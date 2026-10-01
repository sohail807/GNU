import { NextRequest, NextResponse } from "next/server";
import { errorResponse, fail, guard, idOf, names, patientInfo, positiveId, recentPatients, rpc, stamp, text, Row } from "@/lib/ops-api";

// Emergency department: arrival -> triage (1-5) -> doctor -> observation -> admit / discharge / transfer.
// Records are native Tryton ist.ops.ed_visit rows, scoped to the active hospital's company and institution.

const M = "ist.ops.ed_visit";
const TARGET_MIN: Record<string, number> = { "1": 0, "2": 10, "3": 30, "4": 60, "5": 120 };
const OPEN = ["waiting", "triaged", "in_treatment", "observation"];
const MODULES = ["frontdesk", "nursing", "physician"] as const;

export async function GET() {
  const g = await guard([...MODULES]);
  if ("response" in g) return g.response;
  const { session } = g;
  try {
    const rows = await rpc<Row[]>(session, M, "search_read", [[["company", "=", session.companyId]], 0, 300, [["id", "DESC"]],
      ["id", "reference", "patient", "arrival_mode", "complaint", "triage_level", "triage_note", "doctor", "bay", "state",
        "arrived_at", "triaged_at", "seen_at", "closed_at", "disposition_note", "admission"]]);
    const pats = await patientInfo(session, [...new Set(rows.map((r) => idOf(r.patient)).filter((x): x is number => !!x))]);
    const docRows = await rpc<Row[]>(session, "gnuhealth.healthprofessional", "search_read", [[], 0, 100, null, ["id", "name"]]).catch(() => []);
    const docParties = await names(session, "party.party", docRows.map((d) => idOf(d.name)).filter((x): x is number => !!x));
    const doctors = docRows.map((d) => ({ id: d.id as number, name: docParties[idOf(d.name) as number]?.name || `Clinician ${d.id}` }));
    const docById = Object.fromEntries(doctors.map((d) => [d.id, d.name]));

    const now = Date.now();
    const visits = rows.map((r) => {
      const arrived = stamp(r.arrived_at), seen = stamp(r.seen_at), triaged = stamp(r.triaged_at);
      const level = r.triage_level || null;
      const waitedMin = arrived ? Math.round(((seen ? new Date(seen).getTime() : now) - new Date(arrived).getTime()) / 60000) : 0;
      const target = level ? TARGET_MIN[level] : null;
      return {
        id: r.id, reference: r.reference, state: r.state, patientId: idOf(r.patient), patientName: pats[idOf(r.patient) as number]?.name || "",
        puid: pats[idOf(r.patient) as number]?.puid || null, arrivalMode: r.arrival_mode, complaint: r.complaint, level, triageNote: r.triage_note || null,
        doctorId: idOf(r.doctor), doctor: docById[idOf(r.doctor) as number] || null, bay: r.bay || null,
        arrivedAt: arrived, triagedAt: triaged, seenAt: seen, closedAt: stamp(r.closed_at), note: r.disposition_note || null, admissionId: idOf(r.admission),
        waitedMin, targetMin: target, breach: OPEN.includes(r.state) && !seen && target != null && r.state !== "observation" && waitedMin > target,
      };
    });
    const open = visits.filter((v) => OPEN.includes(v.state));
    const seenToday = visits.filter((v) => v.seenAt && v.arrivedAt);
    const avgDoorToDoctor = seenToday.length
      ? Math.round(seenToday.reduce((t, v) => t + (new Date(v.seenAt!).getTime() - new Date(v.arrivedAt!).getTime()) / 60000, 0) / seenToday.length) : null;
    return NextResponse.json({
      success: true, visits, doctors, patients: await recentPatients(session),
      summary: {
        inDepartment: open.length, waitingTriage: open.filter((v) => v.state === "waiting").length,
        waitingDoctor: open.filter((v) => v.state === "triaged").length, inTreatment: open.filter((v) => v.state === "in_treatment").length,
        observation: open.filter((v) => v.state === "observation").length, breaches: open.filter((v) => v.breach).length,
        admitted: visits.filter((v) => v.state === "admitted").length, avgDoorToDoctor,
      },
    });
  } catch (err) {
    return errorResponse(err, "Failed to load the emergency department");
  }
}

export async function POST(req: NextRequest) {
  const g = await guard([...MODULES]);
  if ("response" in g) return g.response;
  const { session } = g;
  try {
    const body = await req.json();
    const action = String(body.action || "");
    if (action === "register") {
      const patientId = positiveId(body.patientId);
      const complaint = text(body.complaint, 200);
      if (!patientId || !complaint) return fail("Choose the patient and enter the presenting complaint.");
      const mode = ["walk_in", "ambulance", "referred", "police"].includes(body.arrivalMode) ? body.arrivalMode : "walk_in";
      const created = await rpc<number[]>(session, M, "create", [[{
        patient: patientId, company: session.companyId, institution: session.institutionId || undefined, arrival_mode: mode, complaint,
      }]]);
      return NextResponse.json({ success: true, visitId: created[0], message: "Patient registered in the emergency department." });
    }
    const id = positiveId(body.id);
    if (!id) return fail("Visit is required.");
    const visit = (await rpc<Row[]>(session, M, "search_read", [[["id", "=", id], ["company", "=", session.companyId]], 0, 1, null, ["id", "state"]]))[0];
    if (!visit) return fail("Visit not found in this hospital.", 404);
    const values: Row = {};
    if (action === "triage") {
      const level = String(body.level || "");
      if (!(level in TARGET_MIN)) return fail("Choose a triage level from 1 to 5.");
      Object.assign(values, { state: "triaged", triage_level: level, triage_note: text(body.note, 200), bay: text(body.bay, 40) });
    } else if (action === "start") {
      const doctorId = positiveId(body.doctorId);
      if (!doctorId) return fail("Choose the treating doctor.");
      Object.assign(values, { state: "in_treatment", doctor: doctorId, bay: text(body.bay, 40) });
    } else if (action === "observe") values.state = "observation";
    else if (action === "resume") values.state = "in_treatment";
    else if (action === "admit" || action === "discharge" || action === "transfer" || action === "left") {
      const note = text(body.note);
      if (action !== "left" && !note) return fail("Enter the diagnosis or disposition note.");
      Object.assign(values, { state: { admit: "admitted", discharge: "discharged", transfer: "transferred", left: "left" }[action], disposition_note: note });
    } else return fail(`Unsupported action: ${action}`);
    await rpc(session, M, "write", [[id], values]);
    return NextResponse.json({ success: true, message: "Emergency visit updated." });
  } catch (err) {
    return errorResponse(err, "Emergency transaction failed");
  }
}
