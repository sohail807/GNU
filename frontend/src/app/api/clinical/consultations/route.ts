import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth-session";
import { TrytonClient } from "@/lib/tryton-client";

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized session" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const patientId = searchParams.get("patientId");

  try {
    let domain: unknown[] = [];
    if (patientId) {
      domain = [["patient", "=", parseInt(patientId, 10)]];
    }

    const evals = await TrytonClient.execute<any[]>(
      session.username,
      session.userId,
      session.sessionToken,
      "gnuhealth.patient.evaluation",
      "search_read",
      [
        domain,
        0,
        10,
        [["id", "DESC"]],
        [
          "id",
          "patient",
          "healthprof",
          "evaluation_start",
          "chief_complaint",
          "present_illness",
          "evaluation_summary",
          "directions",
          "diagnosis",
          "state",
          "systolic",
          "diastolic",
          "bpm",
          "temperature",
          "bmi",
        ],
      ]
    );

    return NextResponse.json({ success: true, consultations: evals });
  } catch (err: unknown) {
    const status = (err as any)?.status || 500;
    const message = err instanceof Error ? err.message : "Failed to load consultations";
    return NextResponse.json({ error: message }, { status });
  }
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized session" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const {
      patientId,
      chiefComplaint,
      presentIllness,
      physicalExam,
      diagnosisCode,
      directions,
      orderLab,
      orderRadiology,
      completed,
    } = body;

    if (!patientId) {
      return NextResponse.json({ error: "Patient ID is required." }, { status: 400 });
    }

    const pid = parseInt(patientId, 10);
    const now = new Date();
    const dtObj = {
      __class__: "datetime",
      year: now.getFullYear(),
      month: now.getMonth() + 1,
      day: now.getDate(),
      hour: now.getHours(),
      minute: now.getMinutes(),
      second: now.getSeconds(),
      microsecond: 0,
    };

    // Resolve ICD-10 diagnosis ID if code provided
    let pathologyId: number | null = null;
    if (diagnosisCode) {
      try {
        const pathMatches = await TrytonClient.execute<any[]>(
          session.username,
          session.userId,
          session.sessionToken,
          "gnuhealth.pathology",
          "search_read",
          [[["code", "=", diagnosisCode.trim()]], 0, 1, null, ["id", "code", "name"]]
        );
        if (pathMatches && pathMatches.length > 0) {
          pathologyId = pathMatches[0].id;
        }
      } catch {
        // Continue
      }
    }

    const hpId = session.healthprofId || 71;

    // 1. Create clinical evaluation
    const evalPayload: Record<string, unknown> = {
      patient: pid,
      healthprof: hpId,
      evaluation_start: dtObj,
      chief_complaint: chiefComplaint || "General Outpatient Consultation",
      present_illness: presentIllness || "",
      evaluation_summary: physicalExam || "",
      directions: directions || "",
      state: completed ? "signed" : "in_progress",
    };
    if (pathologyId) {
      evalPayload.diagnosis = pathologyId;
    }

    const evalRes = await TrytonClient.execute<number[]>(
      session.username,
      session.userId,
      session.sessionToken,
      "gnuhealth.patient.evaluation",
      "create",
      [[evalPayload]]
    );

    // 2. If Order Lab requested, create lab order
    let labOrderId: number | null = null;
    if (orderLab) {
      try {
        const labRes = await TrytonClient.execute<number[]>(
          session.username,
          session.userId,
          session.sessionToken,
          "gnuhealth.lab",
          "create",
          [[{ patient: pid, test: 2, state: "draft" }]]
        );
        labOrderId = labRes[0];
      } catch {
        // Non-blocking
      }
    }

    // 3. If Order Radiology requested, create imaging request
    let radOrderId: number | null = null;
    if (orderRadiology) {
      try {
        const radRes = await TrytonClient.execute<number[]>(
          session.username,
          session.userId,
          session.sessionToken,
          "gnuhealth.imaging.test.request",
          "create",
          [[{ patient: pid, state: "draft" }]]
        );
        radOrderId = radRes[0];
      } catch {
        // Non-blocking
      }
    }

    return NextResponse.json({
      success: true,
      evaluationId: evalRes[0],
      labOrderId,
      radOrderId,
      message: completed
        ? "Clinical consultation completed, signed, and committed to Patient Medical Record."
        : "Clinical notes and diagnosis saved successfully.",
    });
  } catch (err: unknown) {
    const status = (err as any)?.status || 500;
    const message = err instanceof Error ? err.message : "Failed to record consultation";
    return NextResponse.json({ error: message }, { status });
  }
}
