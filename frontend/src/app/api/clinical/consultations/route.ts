import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth-session";
import { TrytonClient } from "@/lib/tryton-client";
import { ClinicalLookupService } from "@/lib/clinical-lookup";
import { hasModuleAccess } from "@/lib/access-control";

const EVALUATION_FIELDS = [
  "id", "code", "patient", "healthprof", "evaluation_start", "chief_complaint",
  "present_illness", "evaluation_summary", "directions", "diagnosis", "state",
  "systolic", "diastolic", "bpm", "temperature", "bmi",
];

// Front desk can see that an evaluation exists and whether it's done (to know a patient is
// ready to bill) but not the clinical content -- SOAP notes, diagnosis, vitals stay visible
// only to clinical roles. This is enforced here, in the fields actually requested/returned,
// rather than by widening what the "Health Front Desk" Tryton group can read.
const EVALUATION_STATUS_FIELDS = ["id", "patient", "state", "evaluation_start"];

function relationId(value: unknown): number | null {
  const id = Array.isArray(value) ? value[0] : value;
  return Number.isSafeInteger(id) ? Number(id) : null;
}

function rpcStatus(error: unknown): number {
  const status = (error as { status?: unknown })?.status;
  return Number.isInteger(status) && Number(status) >= 400 && Number(status) <= 599 ? Number(status) : 500;
}

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized session" }, { status: 401 });

  if (
    !hasModuleAccess(session.role, "physician") &&
    !hasModuleAccess(session.role, "nursing") &&
    !hasModuleAccess(session.role, "patient_chart") &&
    !hasModuleAccess(session.role, "admin")
  ) {
    return NextResponse.json({ error: "Your role does not have permission for this module." }, { status: 403 });
  }
  const rawPatientId = new URL(req.url).searchParams.get("patientId");
  const patientId = rawPatientId ? Number(rawPatientId) : null;
  if (rawPatientId && (!Number.isSafeInteger(patientId) || patientId! <= 0)) {
    return NextResponse.json({ error: "A valid patient ID is required." }, { status: 400 });
  }

  const statusOnly = session.role === "reception";

  try {
    const domain: unknown[] = patientId ? [["patient", "=", patientId]] : [];
    const consultations = await TrytonClient.execute<unknown[]>(
      session.username, session.userId, session.sessionToken,
      "gnuhealth.patient.evaluation", "search_read",
      [domain, 0, 50, [["id", "DESC"]], statusOnly ? EVALUATION_STATUS_FIELDS : EVALUATION_FIELDS],
      { company: session.companyId }, session.database
    );
    // The diagnosis comes back as a bare id; give the screen its code and name so a saved assessment can be shown again.
    if (!statusOnly) {
      const rows = consultations as Array<Record<string, any>>;
      const pathIds = [...new Set(rows.map((r) => relationId(r.diagnosis)).filter((x): x is number => !!x))];
      if (pathIds.length) {
        const paths = await TrytonClient.execute<Array<{ id: number; code: string; name: string }>>(
          session.username, session.userId, session.sessionToken, "gnuhealth.pathology", "search_read",
          [[["id", "in", pathIds]], 0, pathIds.length, null, ["id", "code", "name"]], { company: session.companyId }, session.database
        ).catch(() => []);
        const byId = Object.fromEntries(paths.map((p) => [p.id, p]));
        for (const r of rows) { const d = byId[relationId(r.diagnosis) as number]; if (d) { r.diagnosisCode = d.code; r.diagnosisName = d.name; } }
      }
    }
    return NextResponse.json({ success: true, consultations, statusOnly });
  } catch (error) {
    const status = rpcStatus(error);
    return NextResponse.json({ error: status === 403 ? "You do not have permission to view these evaluations." : "Unable to load evaluations from health records system." }, { status });
  }
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized session" }, { status: 401 });

  if (!hasModuleAccess(session.role, "physician")) {
    return NextResponse.json({ error: "Your role does not have permission for this module." }, { status: 403 });
  }
  try {
    const body = await req.json();
    const patientId = Number(body.patientId);
    if (!Number.isSafeInteger(patientId) || patientId <= 0) {
      return NextResponse.json({ error: "A valid patient ID is required." }, { status: 400 });
    }
    const textFields = [body.chiefComplaint, body.presentIllness, body.physicalExam, body.directions];
    if (!textFields.some((value) => typeof value === "string" && value.trim())) {
      return NextResponse.json({ error: "Enter clinical notes before saving the evaluation." }, { status: 400 });
    }

    const healthprofId = await ClinicalLookupService.resolveClinician(session, body.healthprofId);
    if (!healthprofId) {
      return NextResponse.json({ error: "The clinician could not be resolved from the current health records system user." }, { status: 400 });
    }

    let pathologyId: number | null = null;
    if (body.diagnosisCode) {
      const matches = await TrytonClient.execute<Array<{ id: number }>>(
        session.username, session.userId, session.sessionToken,
        "gnuhealth.pathology", "search_read",
        [[["code", "=", String(body.diagnosisCode).trim()]], 0, 1, null, ["id"]],
        { company: session.companyId }, session.database
      );
      if (!matches.length) {
        return NextResponse.json({ error: "The diagnosis code was not found in the health records system pathology catalogue." }, { status: 400 });
      }
      pathologyId = matches[0].id;
    }

    // An unknown test name never blocks the clinical note: the evaluation is saved first, then the caller is told which
    // order could not be placed (see the response after the save below).
    let labTestId: number | null = null;
    let orderProblem: string | null = null;
    if (body.orderLab) {
      labTestId = await ClinicalLookupService.resolveLabTestType(session, body.labTestId, body.labTestName);
      if (!labTestId) orderProblem = "the laboratory test was not found in the catalogue";
    }
    let imagingTestId: number | null = null;
    if (body.orderRadiology) {
      imagingTestId = await ClinicalLookupService.resolveImagingTest(session, body.radiologyTestId, body.radiologyStudy);
      if (!imagingTestId) orderProblem = orderProblem ? `${orderProblem} and the imaging study was not found` : "the imaging study was not found in the catalogue";
    }

    const evaluationPayload: Record<string, unknown> = {
      chief_complaint: typeof body.chiefComplaint === "string" ? body.chiefComplaint.trim() : "",
      present_illness: typeof body.presentIllness === "string" ? body.presentIllness.trim() : "",
      evaluation_summary: typeof body.physicalExam === "string" ? body.physicalExam.trim() : "",
      directions: typeof body.directions === "string" ? body.directions.trim() : "",
    };
    if (pathologyId) evaluationPayload.diagnosis = pathologyId;

    let evaluationId: number;
    if (body.evaluationId !== undefined && body.evaluationId !== null && body.evaluationId !== "") {
      evaluationId = Number(body.evaluationId);
      if (!Number.isSafeInteger(evaluationId) || evaluationId <= 0) {
        return NextResponse.json({ error: "A valid evaluation ID is required." }, { status: 400 });
      }
      const records = await TrytonClient.execute<Array<{ id: number; patient: unknown; state: string }>>(
        session.username, session.userId, session.sessionToken,
        "gnuhealth.patient.evaluation", "read", [[evaluationId], ["id", "patient", "state"]],
        { company: session.companyId }, session.database
      );
      if (!records[0] || relationId(records[0].patient) !== patientId) {
        return NextResponse.json({ error: "The evaluation does not belong to the selected patient." }, { status: 404 });
      }
      if (["done", "signed"].includes(records[0].state)) {
        return NextResponse.json({ error: "This evaluation is already complete and cannot be edited." }, { status: 409 });
      }
      await TrytonClient.execute(
        session.username, session.userId, session.sessionToken,
        "gnuhealth.patient.evaluation", "write", [[evaluationId], evaluationPayload],
        { company: session.companyId }, session.database
      );
    } else {
      // GNU Health stores/compares naive datetimes as UTC - use UTC getters,
      // not local ones, or a Next.js process running in a non-UTC timezone
      // (e.g. GST, UTC+4) writes an evaluation_start hours in Tryton's own
      // future, which then rejects completing it (SM-CORE-0008: end time
      // before start). See the identical fix in triage/route.ts.
      const now = new Date();
      const dateTime = {
        __class__: "datetime", year: now.getUTCFullYear(), month: now.getUTCMonth() + 1,
        day: now.getUTCDate(), hour: now.getUTCHours(), minute: now.getUTCMinutes(),
        second: now.getUTCSeconds(), microsecond: 0,
      };
      const created = await TrytonClient.execute<number[]>(
        session.username, session.userId, session.sessionToken,
        "gnuhealth.patient.evaluation", "create",
        [[{ ...evaluationPayload, patient: patientId, healthprof: healthprofId, evaluation_start: dateTime, state: "in_progress" }]],
        { company: session.companyId }, session.database
      );
      evaluationId = created[0];
    }

    if (orderProblem) {
      return NextResponse.json(
        { error: `The evaluation was saved, but ${orderProblem}. Choose the test from the catalogue and order it again.`, evaluationId, labOrderId: null, radiologyOrderId: null },
        { status: 400 }
      );
    }

    let labOrderId: number | null = null;
    let radiologyOrderId: number | null = null;
    try {
      if (labTestId) {
        const created = await TrytonClient.execute<number[]>(
          session.username, session.userId, session.sessionToken,
          "gnuhealth.lab", "create", [[{ patient: patientId, test: labTestId, requestor: healthprofId }]],
          { company: session.companyId }, session.database
        );
        labOrderId = created[0];
        // create() alone leaves the order's own critearea empty - complete_criteareas is a
        // native GNU Health button action (health_lab.py Lab.complete_criteareas) that copies
        // the test type's analyte template onto the order, and it never runs automatically.
        // Without this call, laboratory/route.ts's own save-results action can never accept
        // results for a physician-ordered test (it validates submitted analytes against
        // lab.critearea, which stays permanently empty).
        await TrytonClient.execute(
          session.username, session.userId, session.sessionToken,
          "gnuhealth.lab", "complete_criteareas", [[labOrderId]],
          { company: session.companyId }, session.database
        );
      }
      if (imagingTestId) {
        const created = await TrytonClient.execute<number[]>(
          session.username, session.userId, session.sessionToken,
          "gnuhealth.imaging.test.request", "create",
          [[{ patient: patientId, requested_test: imagingTestId, doctor: healthprofId }]],
          { company: session.companyId }, session.database
        );
        radiologyOrderId = created[0];
      }
    } catch (error) {
      const status = rpcStatus(error);
      return NextResponse.json({
        error: "The evaluation was saved, but a requested diagnostic order did not complete. Review the evaluation and worklists before retrying.",
        evaluationId, labOrderId, radiologyOrderId,
      }, { status: status >= 400 ? status : 502 });
    }

    if (body.completed === true) {
      await TrytonClient.execute(
        session.username, session.userId, session.sessionToken,
        "gnuhealth.patient.evaluation", "end_evaluation", [[evaluationId]],
        { company: session.companyId }, session.database
      );
    }

    return NextResponse.json({
      success: true, evaluationId, labOrderId, radiologyOrderId,
      state: body.completed === true ? "done" : "in_progress",
      message: body.completed === true
        ? "health records system completed the evaluation using its native end_evaluation action."
        : "Clinical notes were saved to the health records system evaluation.",
    });
  } catch (error) {
    const status = rpcStatus(error);
    const message = error instanceof Error ? error.message : "Failed to save the health records system evaluation.";
    return NextResponse.json({ error: status === 403 ? "You do not have permission to update this evaluation." : message }, { status });
  }
}
