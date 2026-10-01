import { NextRequest, NextResponse } from "next/server";
import { errorResponse, fail, guard, idOf, patientInfo, positiveId, rpc, stamp, text, Row } from "@/lib/ops-api";

// Discharge clearance: after the doctor orders discharge, five departments sign off (medical, nursing, pharmacy,
// billing, insurance). The inpatient discharge refuses to run until all are done (see dischargeBlock in ops-api).
// Records are native Tryton ist.ops.discharge rows.

const M = "ist.ops.discharge";
const DEPTS = ["medical", "nursing", "pharmacy", "billing", "insurance"] as const;
const TARGET_HOURS = 6;
// which staff may sign off which department (the hospital administrator may sign any)
const SIGNERS: Record<string, string[]> = {
  medical: ["physician", "admin"],
  nursing: ["nursing", "admin"],
  pharmacy: ["cashier", "physician", "admin"],
  billing: ["cashier", "accountant", "admin"],
  insurance: ["reception", "cashier", "accountant", "admin"],
};

export async function GET() {
  const g = await guard(["inpatient", "billing", "pharmacy", "physician", "nursing", "frontdesk"]);
  if ("response" in g) return g.response;
  const { session } = g;
  try {
    const fields = ["id", "reference", "registration", "patient", "state", "started_at", "completed_at", "note",
      ...DEPTS.flatMap((d) => [`${d}_state`, `${d}_at`])];
    const rows = await rpc<Row[]>(session, M, "search_read", [[["company", "=", session.companyId]], 0, 200, [["id", "DESC"]], fields]);
    const pats = await patientInfo(session, [...new Set(rows.map((r) => idOf(r.patient)).filter((x): x is number => !!x))]);
    const now = Date.now();
    const discharges = rows.map((r) => {
      const started = stamp(r.started_at);
      const end = stamp(r.completed_at);
      const hours = started ? ((end ? new Date(end).getTime() : now) - new Date(started).getTime()) / 36e5 : 0;
      return {
        id: r.id, reference: r.reference, state: r.state, registrationId: idOf(r.registration), patientName: pats[idOf(r.patient) as number]?.name || "",
        puid: pats[idOf(r.patient) as number]?.puid || null, startedAt: started, completedAt: end, hours: Math.round(hours * 10) / 10,
        late: r.state === "open" && hours > TARGET_HOURS, note: r.note || null,
        clearances: Object.fromEntries(DEPTS.map((d) => [d, { state: r[`${d}_state`], at: stamp(r[`${d}_at`]), mine: SIGNERS[d].includes(session.role) }])),
      };
    });
    // patients in a bed with no clearance yet: where the discharge starts
    const admitted = await rpc<Row[]>(session, "gnuhealth.inpatient.registration", "search_read", [[["state", "=", "hospitalized"]], 0, 200, [["id", "DESC"]], ["id", "patient"]]).catch(() => []);
    const started = new Set(discharges.filter((d) => d.state !== "cancelled").map((d) => d.registrationId));
    const candidates = admitted.filter((a) => !started.has(a.id));
    const cPats = await patientInfo(session, [...new Set(candidates.map((a) => idOf(a.patient)).filter((x): x is number => !!x))]);
    return NextResponse.json({
      success: true, discharges, role: session.role,
      candidates: candidates.map((a) => ({ registrationId: a.id, patientName: cPats[idOf(a.patient) as number]?.name || "", puid: cPats[idOf(a.patient) as number]?.puid || null })),
      summary: {
        open: discharges.filter((d) => d.state === "open").length, late: discharges.filter((d) => d.late).length,
        complete: discharges.filter((d) => d.state === "complete").length,
        avgHours: (() => { const done = discharges.filter((d) => d.state === "complete"); return done.length ? Math.round((done.reduce((t, d) => t + d.hours, 0) / done.length) * 10) / 10 : null; })(),
      },
    });
  } catch (err) {
    return errorResponse(err, "Failed to load discharge clearances");
  }
}

export async function POST(req: NextRequest) {
  const g = await guard(["inpatient", "billing", "pharmacy", "physician", "nursing", "frontdesk"]);
  if ("response" in g) return g.response;
  const { session } = g;
  try {
    const body = await req.json();
    const action = String(body.action || "");
    if (action === "start") {
      const regId = positiveId(body.registrationId);
      if (!regId) return fail("Choose the admitted patient.");
      if (!["physician", "nursing", "admin"].includes(session.role)) return fail("Only a doctor or nurse can order a discharge.", 403);
      const reg = (await rpc<Row[]>(session, "gnuhealth.inpatient.registration", "search_read", [[["id", "=", regId], ["state", "=", "hospitalized"]], 0, 1, null, ["id", "patient"]]))[0];
      if (!reg) return fail("That patient is not currently admitted in this hospital.", 404);
      const exists = await rpc<number[]>(session, M, "search", [[["registration", "=", regId], ["state", "!=", "cancelled"]]]);
      if (exists.length) return fail("A discharge clearance is already open for this patient.", 409);
      const created = await rpc<number[]>(session, M, "create", [[{
        registration: regId, patient: idOf(reg.patient), company: session.companyId, institution: session.institutionId || undefined, note: text(body.note),
      }]]);
      return NextResponse.json({ success: true, dischargeId: created[0], message: "Discharge ordered. Departments can now sign off." });
    }
    if (action === "clear") {
      const id = positiveId(body.id);
      const dept = String(body.department || "");
      const outcome = String(body.outcome || "cleared");
      if (!id || !(DEPTS as readonly string[]).includes(dept)) return fail("Choose the clearance to update.");
      if (!["cleared", "na", "pending"].includes(outcome)) return fail("Invalid outcome.");
      if (!SIGNERS[dept].includes(session.role)) return fail(`Your role cannot sign off the ${dept} clearance.`, 403);
      const rec = await rpc<number[]>(session, M, "search", [[["id", "=", id], ["company", "=", session.companyId]]]);
      if (!rec.length) return fail("Clearance not found in this hospital.", 404);
      await rpc(session, M, "write", [[id], { [`${dept}_state`]: outcome }]);
      return NextResponse.json({ success: true, message: `${dept[0].toUpperCase()}${dept.slice(1)} clearance updated.` });
    }
    return fail(`Unsupported action: ${action}`);
  } catch (err) {
    return errorResponse(err, "Discharge transaction failed");
  }
}
