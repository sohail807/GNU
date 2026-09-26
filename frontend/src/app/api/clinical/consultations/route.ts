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

  try {
    const domain: unknown[] = patientId ? [["patient", "=", patientId]] : [];
    const consultations = await TrytonClient.execute<unknown[]>(
      session.username, session.userId, session.sessionToken,
      "gnuhealth.patient.evaluation", "search_read",
      [domain, 0, 50, [["id", "DESC"]], EVALUATION_FIELDS],
      { company: session.companyId }, session.database
    );
    return NextResponse.json({ success: true, consultations });
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

    let labTestId: number | null = null;
    if (body.orderLab) {
      labTestId = await ClinicalLookupService.resolveLabTestType(session, body.labTestId, body.labTestName);
      if (!labTestId) return NextResponse.json({ error: "Select a laboratory test from the health records system catalogue." }, { status: 400 });
    }
    let imagingTestId: number | null = null;
    if (body.orderRadiology) {
      imagingTestId = await ClinicalLookupService.resolveImagingTest(session, body.radiologyTestId, body.radiologyStudy);
      if (!imagingTestId) return NextResponse.json({ error: "Select an imaging study from the health records system catalogue." }, { status: 400 });
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
      const now = new Date();
      const dateTime = {
        __class__: "datetime", year: now.getFullYear(), month: now.getMonth() + 1,
        day: now.getDate(), hour: now.getHours(), minute: now.getMinutes(),
        second: now.getSeconds(), microsecond: 0,
      };
      const created = await TrytonClient.execute<number[]>(
        session.username, session.userId, session.sessionToken,
        "gnuhealth.patient.evaluation", "create",
        [[{ ...evaluationPayload, patient: patientId, healthprof: healthprofId, evaluation_start: dateTime, state: "in_progress" }]],
        { company: session.companyId }, session.database
      );
      evaluationId = created[0];
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
