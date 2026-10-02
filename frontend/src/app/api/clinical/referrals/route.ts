import { NextRequest, NextResponse } from "next/server";
import { errorResponse, fail, guard, idOf, patientInfo, positiveId, recentPatients, rpc, stamp, text, Row } from "@/lib/ops-api";

// Inter-hospital referral inside a group: the sending hospital asks, the receiving hospital accepts or declines,
// then confirms the patient arrived. The patient record is shared across the group, so the receiving doctor sees
// the full history. Records are native Tryton ist.ops.referral rows, visible to both hospitals.

const M = "ist.ops.referral";
const MODULES = ["frontdesk", "physician", "nursing", "inpatient"] as const;

export async function GET() {
  const g = await guard([...MODULES]);
  if ("response" in g) return g.response;
  const { session } = g;
  try {
    const mine = session.institutionId;
    if (!mine) return NextResponse.json({ success: true, referrals: [], hospitals: [], patients: [], summary: { incomingOpen: 0, outgoingOpen: 0, completed: 0 } });
    const rows = await rpc<Row[]>(session, M, "search_read", [["OR", ["from_institution", "=", mine], ["to_institution", "=", mine]], 0, 300, [["id", "DESC"]],
      ["id", "reference", "patient", "from_institution", "to_institution", "specialty", "urgency", "reason", "clinical_summary", "state", "requested_at", "decided_at", "response_note"]]);
    const instRows = await rpc<Row[]>(session, "gnuhealth.institution", "search_read", [[], 0, 50, null, ["id", "rec_name"]]).catch(() => []);
    const hospitals = instRows.map((i) => ({ id: i.id as number, name: (i.rec_name as string) || `Hospital ${i.id}` }));
    const hospitalName = Object.fromEntries(hospitals.map((h) => [h.id, h.name]));
    const pats = await patientInfo(session, [...new Set(rows.map((r) => idOf(r.patient)).filter((x): x is number => !!x))]);
    const referrals = rows.map((r) => {
      const incoming = idOf(r.to_institution) === mine;
      return {
        id: r.id, reference: r.reference, direction: incoming ? "incoming" : "outgoing", state: r.state, patientName: pats[idOf(r.patient) as number]?.name || "",
        puid: pats[idOf(r.patient) as number]?.puid || null, from: hospitalName[idOf(r.from_institution) as number] || "", to: hospitalName[idOf(r.to_institution) as number] || "",
        specialty: r.specialty, urgency: r.urgency, reason: r.reason, summary: r.clinical_summary || null, requestedAt: stamp(r.requested_at),
        decidedAt: stamp(r.decided_at), responseNote: r.response_note || null,
      };
    });
    return NextResponse.json({
      success: true, referrals, hospitals: hospitals.filter((h) => h.id !== mine), patients: await recentPatients(session),
      summary: {
        incomingOpen: referrals.filter((r) => r.direction === "incoming" && ["requested", "accepted"].includes(r.state)).length,
        outgoingOpen: referrals.filter((r) => r.direction === "outgoing" && ["requested", "accepted"].includes(r.state)).length,
        completed: referrals.filter((r) => r.state === "completed").length,
      },
    });
  } catch (err) {
    return errorResponse(err, "Failed to load referrals");
  }
}

export async function POST(req: NextRequest) {
  const g = await guard([...MODULES]);
  if ("response" in g) return g.response;
  const { session } = g;
  try {
    const body = await req.json();
    const action = String(body.action || "");
    const mine = session.institutionId;
    if (!mine) return fail("This account is not attached to a hospital.");
    if (action === "create") {
      const patientId = positiveId(body.patientId), toId = positiveId(body.toInstitutionId);
      const specialty = text(body.specialty, 120), reason = text(body.reason, 1000);
      if (!patientId || !toId || !specialty || !reason) return fail("Choose the patient and receiving hospital, and enter the service needed and the reason.");
      if (toId === mine) return fail("A referral must go to a different hospital.");
      const created = await rpc<number[]>(session, M, "create", [[{
        patient: patientId, company: session.companyId, from_institution: mine, to_institution: toId, specialty,
        urgency: ["routine", "urgent", "emergency"].includes(body.urgency) ? body.urgency : "routine", reason, clinical_summary: text(body.summary, 2000),
      }]]);
      return NextResponse.json({ success: true, referralId: created[0], message: "Referral sent to the receiving hospital." });
    }
    const id = positiveId(body.id);
    if (!id) return fail("Referral is required.");
    const ref = (await rpc<Row[]>(session, M, "search_read", [[["id", "=", id]], 0, 1, null, ["id", "from_institution", "to_institution"]]))[0];
    if (!ref || ![idOf(ref.from_institution), idOf(ref.to_institution)].includes(mine)) return fail("Referral not found.", 404);
    const receiving = idOf(ref.to_institution) === mine;
    const sending = idOf(ref.from_institution) === mine;
    const values: Row = {};
    if (action === "accept" || action === "decline") {
      if (!receiving) return fail("Only the receiving hospital can answer a referral.", 403);
      const note = text(body.note);
      if (action === "decline" && !note) return fail("Enter why the referral is declined.");
      Object.assign(values, { state: action === "accept" ? "accepted" : "declined", response_note: note });
    } else if (action === "complete") {
      if (!receiving) return fail("Only the receiving hospital can confirm the patient arrived.", 403);
      values.state = "completed";
    } else if (action === "cancel") {
      if (!sending) return fail("Only the sending hospital can cancel a referral.", 403);
      values.state = "cancelled";
    } else return fail(`Unsupported action: ${action}`);
    await rpc(session, M, "write", [[id], values]);
    return NextResponse.json({ success: true, message: "Referral updated." });
  } catch (err) {
    return errorResponse(err, "Referral transaction failed");
  }
}
