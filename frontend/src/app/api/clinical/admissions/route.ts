import { NextRequest, NextResponse } from "next/server";
import { dateValue, errorResponse, fail, guard, idOf, money, names, num, patientInfo, positiveId, recentPatients, rpc, stamp, text, Row } from "@/lib/ops-api";

// Admission planning: the financial counsellor's step before a bed is allocated. Cost estimate -> advance deposit
// (self-pay / corporate / scheme) or insurer pre-authorization (cashless) -> ready -> admitted to a bed.
// Records are native Tryton ist.ops.admission_plan rows; the actual admission is still the native inpatient registration.

const M = "ist.ops.admission_plan";
const MODULES = ["frontdesk", "billing", "inpatient"] as const;
const PAYORS = ["self", "insurance", "corporate", "scheme"];

export async function GET() {
  const g = await guard([...MODULES]);
  if ("response" in g) return g.response;
  const { session } = g;
  try {
    const rows = await rpc<Row[]>(session, M, "search_read", [[["company", "=", session.companyId]], 0, 300, [["id", "DESC"]],
      ["id", "reference", "patient", "payor", "authorization", "ward_type", "expected_days", "daily_rate", "procedure_charges", "estimate_total",
        "advance_required", "advance_received", "state", "registration", "admitted_at", "note", "source_ed_visit"]]);
    const pats = await patientInfo(session, [...new Set(rows.map((r) => idOf(r.patient)).filter((x): x is number => !!x))]);
    const plans = rows.map((r) => ({
      id: r.id, reference: r.reference, state: r.state, patientId: idOf(r.patient), patientName: pats[idOf(r.patient) as number]?.name || "",
      puid: pats[idOf(r.patient) as number]?.puid || null, payor: r.payor, authorizationId: idOf(r.authorization), wardType: r.ward_type,
      expectedDays: r.expected_days, dailyRate: num(r.daily_rate), procedureCharges: num(r.procedure_charges), estimate: num(r.estimate_total),
      advanceRequired: num(r.advance_required), advanceReceived: num(r.advance_received), registrationId: idOf(r.registration),
      admittedAt: stamp(r.admitted_at), note: r.note || null, fromEmergency: !!idOf(r.source_ed_visit),
    }));
    const authRows = await rpc<Row[]>(session, "ist.claims.authorization", "search_read", [[["company", "=", session.companyId], ["state", "in", ["approved", "partial"]]], 0, 200, [["id", "DESC"]],
      ["id", "reference", "patient", "service", "approved_amount"]]).catch(() => []);
    const authPats = await patientInfo(session, [...new Set(authRows.map((a) => idOf(a.patient)).filter((x): x is number => !!x))]);
    const bedRows = await rpc<Row[]>(session, "gnuhealth.hospital.bed", "search_read", [[["state", "=", "free"]], 0, 200, [["id", "ASC"]], ["id", "name", "ward"]]).catch(() => []);
    const products = await names(session, "product.product", bedRows.map((b) => idOf(b.name)).filter((x): x is number => !!x));
    const wards = await names(session, "gnuhealth.hospital.ward", bedRows.map((b) => idOf(b.ward)).filter((x): x is number => !!x));
    return NextResponse.json({
      success: true, plans, patients: await recentPatients(session),
      authorizations: authRows.map((a) => ({ id: a.id, label: `${a.reference} - ${authPats[idOf(a.patient) as number]?.name || ""} - ${a.service}`, approved: num(a.approved_amount) })),
      freeBeds: bedRows.map((b) => ({ id: b.id, label: `${wards[idOf(b.ward) as number]?.name || "Ward"} / ${products[idOf(b.name) as number]?.name || `Bed ${b.id}`}` })),
      summary: {
        open: plans.filter((p) => ["estimate", "deposit_paid", "ready"].includes(p.state)).length,
        awaitingDeposit: plans.filter((p) => p.state === "estimate" && p.payor !== "insurance").length,
        ready: plans.filter((p) => p.state === "ready").length,
        depositsHeld: Math.round(plans.filter((p) => ["deposit_paid", "ready"].includes(p.state)).reduce((t, p) => t + p.advanceReceived, 0)),
      },
    });
  } catch (err) {
    return errorResponse(err, "Failed to load admission plans");
  }
}

export async function POST(req: NextRequest) {
  const g = await guard([...MODULES]);
  if ("response" in g) return g.response;
  const { session } = g;
  try {
    const body = await req.json();
    const action = String(body.action || "");
    if (action === "create") {
      const patientId = positiveId(body.patientId);
      const wardType = text(body.wardType, 80);
      const days = Math.round(Number(body.expectedDays));
      const rate = Number(body.dailyRate), proc = Number(body.procedureCharges ?? 0), advance = Number(body.advanceRequired ?? 0);
      if (!patientId || !wardType || !(days > 0) || !(rate >= 0) || !(proc >= 0) || !(advance >= 0)) return fail("Enter the patient, room type, expected days and the charges.");
      if (!PAYORS.includes(body.payor)) return fail("Choose who is paying.");
      const authId = positiveId(body.authorizationId);
      const created = await rpc<number[]>(session, M, "create", [[{
        patient: patientId, company: session.companyId, institution: session.institutionId || undefined, payor: body.payor,
        authorization: authId || undefined, ward_type: wardType, expected_days: days, daily_rate: money(rate), procedure_charges: money(proc),
        advance_required: money(advance), note: text(body.note),
      }]]);
      return NextResponse.json({ success: true, planId: created[0], message: "Cost estimate prepared." });
    }
    const id = positiveId(body.id);
    if (!id) return fail("Plan is required.");
    const plan = (await rpc<Row[]>(session, M, "search_read", [[["id", "=", id], ["company", "=", session.companyId]], 0, 1, null,
      ["id", "state", "advance_required", "advance_received"]]))[0];
    if (!plan) return fail("Plan not found in this hospital.", 404);
    if (action === "deposit") {
      const amount = Number(body.amount);
      if (!(amount > 0)) return fail("Enter the amount received.");
      const total = num(plan.advance_received) + amount;
      const values: Row = { advance_received: money(total) };
      if (plan.state === "estimate" && total >= num(plan.advance_required)) values.state = "deposit_paid";
      await rpc(session, M, "write", [[id], values]);
      return NextResponse.json({ success: true, message: values.state ? "Advance received in full." : "Part of the advance received." });
    }
    if (action === "ready") { await rpc(session, M, "write", [[id], { state: "ready" }]); return NextResponse.json({ success: true, message: "Cleared for admission." }); }
    if (action === "cancel") { await rpc(session, M, "write", [[id], { state: "cancelled" }]); return NextResponse.json({ success: true, message: "Plan cancelled." }); }
    if (action === "link_authorization") {
      const authId = positiveId(body.authorizationId);
      if (!authId) return fail("Choose the pre-authorization.");
      await rpc(session, M, "write", [[id], { authorization: authId }]);
      return NextResponse.json({ success: true, message: "Pre-authorization linked." });
    }
    if (action === "admitted") {
      const regId = positiveId(body.registrationId);
      await rpc(session, M, "write", [[id], { state: "admitted", registration: regId || undefined }]);
      return NextResponse.json({ success: true, message: "Admission recorded." });
    }
    return fail(`Unsupported action: ${action}`);
  } catch (err) {
    return errorResponse(err, "Admission transaction failed");
  }
}
