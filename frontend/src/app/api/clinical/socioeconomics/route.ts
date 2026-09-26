import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth-session";
import { TrytonClient } from "@/lib/tryton-client";
import { ClinicalLookupService } from "@/lib/clinical-lookup";
import { hasModuleAccess } from "@/lib/access-control";

function formatTrytonDateTime(v: any): string | null {
  if (!v || typeof v !== "object" || !v.year) return null;
  const datePart = `${v.year}-${String(v.month).padStart(2, "0")}-${String(v.day).padStart(2, "0")}`;
  if (typeof v.hour !== "number") return datePart;
  return `${datePart}T${String(v.hour).padStart(2, "0")}:${String(v.minute || 0).padStart(2, "0")}`;
}

const idOf = (v: unknown) => (typeof v === "number" ? v : Array.isArray(v) ? v[0] : null);

const RISK_FLAGS = [
  "hostile_area", "single_parent", "domestic_violence", "working_children",
  "teenage_pregnancy", "sexual_abuse", "drug_addiction", "school_withdrawal",
  "prison_past", "prison_current", "relative_in_prison", "works_at_home",
];

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized session" }, { status: 401 });
  }
  if (!hasModuleAccess(session.role, "socioeconomics")) {
    return NextResponse.json({ error: "Your role does not have permission for this module." }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const patientId = searchParams.get("patientId");
  const occupationQuery = searchParams.get("occupationQuery");
  const context = { company: session.companyId };

  try {
    if (occupationQuery !== null) {
      const occs = await TrytonClient.execute<any[]>(
        session.username, session.userId, session.sessionToken,
        "gnuhealth.occupation", "search_read",
        [occupationQuery ? [["name", "ilike", `%${occupationQuery}%`]] : [], 0, 20, [["name", "ASC"]], ["id", "name"]],
        context, session.database
      );
      return NextResponse.json({ success: true, occupations: occs });
    }

    const patients = await TrytonClient.execute<any[]>(
      session.username, session.userId, session.sessionToken,
      "gnuhealth.patient", "search_read",
      [[], 0, 500, null, ["id", "rec_name", "puid"]],
      context, session.database
    );

    if (!patientId) {
      return NextResponse.json({ success: true, patients: patients.map((p) => ({ id: p.id, name: p.rec_name, puid: p.puid })) });
    }

    const pid = parseInt(patientId, 10);
    const patRecords = await TrytonClient.execute<any[]>(
      session.username, session.userId, session.sessionToken,
      "gnuhealth.patient", "read",
      [[pid], ["id", "rec_name", "puid", "ses_notes", "hours_outside", ...RISK_FLAGS]],
      context, session.database
    );
    if (!patRecords[0]) {
      return NextResponse.json({ error: "Patient not found" }, { status: 404 });
    }
    const p = patRecords[0];

    const assessments = await TrytonClient.execute<any[]>(
      session.username, session.userId, session.sessionToken,
      "gnuhealth.ses.assessment", "search_read",
      [[["patient", "=", pid]], 0, 30, [["assessment_date", "DESC"]],
        ["id", "assessment_date", "ses", "housing", "income", "education", "occupation",
         "homeless", "fam_apgar_score", "fam_apgar_help", "fam_apgar_discussion",
         "fam_apgar_decisions", "fam_apgar_timesharing", "fam_apgar_affection", "notes", "state"]],
      context, session.database
    );

    const occIds = [...new Set(assessments.map((a) => idOf(a.occupation)).filter(Boolean))];
    let occMap: Record<number, any> = {};
    if (occIds.length > 0) {
      const occs = await TrytonClient.execute<any[]>(
        session.username, session.userId, session.sessionToken,
        "gnuhealth.occupation", "search_read",
        [[["id", "in", occIds]], 0, occIds.length, null, ["id", "name"]],
        context, session.database
      );
      occMap = occs.reduce((acc, o) => { acc[o.id] = o; return acc; }, {} as Record<number, any>);
    }

    return NextResponse.json({
      success: true,
      patients: patients.map((pp) => ({ id: pp.id, name: pp.rec_name, puid: pp.puid })),
      riskProfile: {
        id: p.id,
        patientName: p.rec_name,
        puid: p.puid,
        sesNotes: p.ses_notes || "",
        hoursOutside: p.hours_outside ?? null,
        ...Object.fromEntries(RISK_FLAGS.map((f) => [f, !!p[f]])),
      },
      assessments: assessments.map((a) => {
        const occId = idOf(a.occupation);
        return {
          id: a.id,
          date: formatTrytonDateTime(a.assessment_date),
          ses: a.ses || null,
          housing: a.housing || null,
          income: a.income || null,
          education: a.education || null,
          occupationId: occId,
          occupationName: occMap[occId as number]?.name || null,
          homeless: !!a.homeless,
          famApgarScore: a.fam_apgar_score ?? null,
          notes: a.notes || null,
          state: a.state || "in_progress",
        };
      }),
    });
  } catch (err: unknown) {
    const status = (err as any)?.status || 500;
    const message = err instanceof Error ? err.message : "Failed to load socioeconomic profile";
    return NextResponse.json({ error: message }, { status });
  }
}

export async function PATCH(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!hasModuleAccess(session.role, "socioeconomics")) {
    return NextResponse.json({ error: "Your role does not have permission for this module." }, { status: 403 });
  }
  try {
    const body = await req.json();
    const patientId = Number(body.patientId);
    if (!Number.isSafeInteger(patientId) || patientId <= 0) {
      return NextResponse.json({ error: "A valid patient is required." }, { status: 400 });
    }
    const payload: Record<string, unknown> = {};
    for (const key of RISK_FLAGS) {
      if (key in body) payload[key] = !!body[key];
    }
    if ("sesNotes" in body) payload.ses_notes = body.sesNotes || null;
    if ("hoursOutside" in body) payload.hours_outside = body.hoursOutside === "" || body.hoursOutside == null ? null : Number(body.hoursOutside);

    await TrytonClient.execute(
      session.username, session.userId, session.sessionToken,
      "gnuhealth.patient", "write",
      [[patientId], payload],
      { company: session.companyId }, session.database
    );
    return NextResponse.json({ success: true, message: "Social risk factors updated." });
  } catch (err: unknown) {
    const status = (err as any)?.status || 500;
    const message = err instanceof Error ? err.message : "Failed to update social risk factors";
    return NextResponse.json({ error: message }, { status });
  }
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!hasModuleAccess(session.role, "socioeconomics")) {
    return NextResponse.json({ error: "Your role does not have permission for this module." }, { status: 403 });
  }
  try {
    const body = await req.json();
    const action = body.action;
    const context = { company: session.companyId };

    if (action === "addAssessment") {
      const patientId = Number(body.patientId);
      if (!Number.isSafeInteger(patientId) || patientId <= 0) {
        return NextResponse.json({ error: "A valid patient is required." }, { status: 400 });
      }
      const VALID_APGAR = ["0", "1", "2"];
      const apgarFields = ["famApgarHelp", "famApgarDiscussion", "famApgarDecisions", "famApgarTimesharing", "famApgarAffection"];
      for (const f of apgarFields) {
        if (body[f] !== undefined && !VALID_APGAR.includes(String(body[f]))) {
          return NextResponse.json({ error: "Family APGAR responses must be None/Moderately/Very much." }, { status: 400 });
        }
      }
      const score = apgarFields.reduce((sum, f) => sum + Number(body[f] || "0"), 0);

      const healthprofId = await ClinicalLookupService.resolveClinician(session, body.healthprofId);

      const created = await TrytonClient.execute<number[]>(
        session.username, session.userId, session.sessionToken,
        "gnuhealth.ses.assessment", "create",
        [[{
          patient: patientId,
          assessment_date: new Date().toISOString().slice(0, 19).replace("T", " "),
          health_professional: healthprofId || undefined,
          homeless: !!body.homeless,
          ses: body.ses || undefined,
          housing: body.housing || undefined,
          occupation: body.occupationId ? Number(body.occupationId) : undefined,
          income: body.income || undefined,
          fam_apgar_help: body.famApgarHelp || undefined,
          fam_apgar_discussion: body.famApgarDiscussion || undefined,
          fam_apgar_decisions: body.famApgarDecisions || undefined,
          fam_apgar_timesharing: body.famApgarTimesharing || undefined,
          fam_apgar_affection: body.famApgarAffection || undefined,
          fam_apgar_score: score,
          education: body.education || undefined,
          notes: typeof body.notes === "string" && body.notes.trim() ? body.notes.trim() : undefined,
          state: "in_progress",
        }]],
        context, session.database
      );
      return NextResponse.json({ success: true, id: created[0], message: `Socioeconomic assessment recorded (Family APGAR: ${score}/10).` });
    }

    if (action === "endAssessment") {
      const id = Number(body.id);
      if (!Number.isSafeInteger(id) || id <= 0) {
        return NextResponse.json({ error: "A valid assessment is required." }, { status: 400 });
      }
      const healthprofId = await ClinicalLookupService.resolveClinician(session, body.healthprofId);
      await TrytonClient.execute(
        session.username, session.userId, session.sessionToken,
        "gnuhealth.ses.assessment", "write",
        [[id], { state: "done", signed_by: healthprofId || undefined }],
        context, session.database
      );
      return NextResponse.json({ success: true, message: "Assessment finalized and signed." });
    }

    return NextResponse.json({ error: `Unsupported socioeconomics action: ${action}` }, { status: 400 });
  } catch (err: unknown) {
    const status = (err as any)?.status || 500;
    const message = err instanceof Error ? err.message : "Failed to process socioeconomic record";
    return NextResponse.json({ error: message }, { status });
  }
}
