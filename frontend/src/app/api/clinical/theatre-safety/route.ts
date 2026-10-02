import { NextRequest, NextResponse } from "next/server";
import { errorResponse, fail, guard, idOf, names, patientInfo, positiveId, rpc, stamp, text, Row } from "@/lib/ops-api";

// WHO surgical safety checklist: sign in (before anaesthesia), time out (before the incision), sign out (before the
// patient leaves theatre). The surgery cannot be started until sign in and time out are done, nor closed until sign
// out is done (enforced in the surgery route). Records are native Tryton ist.ops.surgery_checklist rows.

const M = "ist.ops.surgery_checklist";
const PHASES = ["sign_in", "time_out", "sign_out"] as const;
const PROMPTS: Record<string, string[]> = {
  sign_in: ["Patient identity, site, procedure and consent confirmed", "Site marked", "Anaesthesia safety check complete", "Pulse oximeter on and working", "Known allergy checked", "Airway and blood-loss risk assessed"],
  time_out: ["All team members introduced by name and role", "Patient, site and procedure confirmed aloud", "Antibiotic given in the last 60 minutes", "Critical steps and anticipated events reviewed", "Essential imaging displayed"],
  sign_out: ["Procedure name recorded", "Instrument, swab and needle counts correct", "Specimen labelled", "Equipment problems noted", "Recovery and care plan agreed"],
};

export async function GET() {
  const g = await guard(["surgery"]);
  if ("response" in g) return g.response;
  const { session } = g;
  try {
    const surgeries = await rpc<Row[]>(session, "gnuhealth.surgery", "search_read", [[["state", "in", ["confirmed", "in_progress", "done", "signed"]]], 0, 100, [["id", "DESC"]],
      ["id", "code", "description", "patient", "operating_room", "surgery_date", "state"]]);
    const sIds = surgeries.map((s) => s.id as number);
    const checks = sIds.length ? await rpc<Row[]>(session, M, "search_read", [[["surgery", "in", sIds]], 0, 200, null,
      ["id", "surgery", "reference", ...PHASES.flatMap((p) => [`${p}_done`, `${p}_at`, `${p}_note`])]]) : [];
    const byS: Record<number, Row> = {};
    for (const c of checks) byS[idOf(c.surgery) as number] = c;
    const pats = await patientInfo(session, [...new Set(surgeries.map((s) => idOf(s.patient)).filter((x): x is number => !!x))]);
    const rooms = await names(session, "gnuhealth.hospital.or", surgeries.map((s) => idOf(s.operating_room)).filter((x): x is number => !!x));
    const rows = surgeries.map((s) => {
      const c = byS[s.id];
      return {
        surgeryId: s.id, code: s.code, procedure: s.description, state: s.state, patientName: pats[idOf(s.patient) as number]?.name || "", puid: pats[idOf(s.patient) as number]?.puid || null,
        room: rooms[idOf(s.operating_room) as number]?.name || null, when: s.surgery_date && s.surgery_date.year ? `${s.surgery_date.year}-${String(s.surgery_date.month).padStart(2, "0")}-${String(s.surgery_date.day).padStart(2, "0")} ${String(s.surgery_date.hour || 0).padStart(2, "0")}:${String(s.surgery_date.minute || 0).padStart(2, "0")}` : null, checklistId: c?.id || null,
        phases: Object.fromEntries(PHASES.map((p) => [p, { done: !!c?.[`${p}_done`], at: stamp(c?.[`${p}_at`]), note: c?.[`${p}_note`] || null }])),
      };
    });
    return NextResponse.json({
      success: true, surgeries: rows, prompts: PROMPTS,
      summary: {
        today: rows.filter((r) => r.state === "confirmed" || r.state === "in_progress").length,
        noChecklist: rows.filter((r) => !r.checklistId && ["confirmed", "in_progress"].includes(r.state)).length,
        complete: rows.filter((r) => r.phases.sign_out.done).length,
      },
    });
  } catch (err) {
    return errorResponse(err, "Failed to load theatre safety");
  }
}

export async function POST(req: NextRequest) {
  const g = await guard(["surgery"]);
  if ("response" in g) return g.response;
  const { session } = g;
  try {
    const body = await req.json();
    const action = String(body.action || "");
    if (action === "start") {
      const surgeryId = positiveId(body.surgeryId);
      if (!surgeryId) return fail("Choose the surgery.");
      const s = (await rpc<Row[]>(session, "gnuhealth.surgery", "search_read", [[["id", "=", surgeryId]], 0, 1, null, ["id", "patient"]]))[0];
      if (!s) return fail("Surgery not found in this hospital.", 404);
      const exists = await rpc<number[]>(session, M, "search", [[["surgery", "=", surgeryId]]]);
      if (exists.length) return fail("A checklist already exists for this surgery.", 409);
      const created = await rpc<number[]>(session, M, "create", [[{ surgery: surgeryId, patient: idOf(s.patient), company: session.companyId, institution: session.institutionId || undefined }]]);
      return NextResponse.json({ success: true, checklistId: created[0], message: "Safety checklist opened." });
    }
    if (action === "phase") {
      const id = positiveId(body.id);
      const phase = String(body.phase || "");
      if (!id || !(PHASES as readonly string[]).includes(phase)) return fail("Choose the checklist phase.");
      const done = body.done !== false;
      const exists = await rpc<number[]>(session, M, "search", [[["id", "=", id], ["company", "=", session.companyId]]]);
      if (!exists.length) return fail("Checklist not found in this hospital.", 404);
      await rpc(session, M, "write", [[id], { [`${phase}_done`]: done, [`${phase}_note`]: text(body.note, 200) }]);
      return NextResponse.json({ success: true, message: done ? `${phase.replace("_", " ")} completed.` : `${phase.replace("_", " ")} reopened.` });
    }
    return fail(`Unsupported action: ${action}`);
  } catch (err) {
    return errorResponse(err, "Theatre safety transaction failed");
  }
}
