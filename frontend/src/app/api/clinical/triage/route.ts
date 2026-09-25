import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth-session";
import { TrytonClient } from "@/lib/tryton-client";
import { ClinicalLookupService } from "@/lib/clinical-lookup";

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized session" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const patientIdParam = searchParams.get("patientId");

  try {
    let domain: unknown[] = [];
    if (patientIdParam) {
      domain = [["patient", "=", parseInt(patientIdParam, 10)]];
    }

    const evalsRaw = await TrytonClient.execute<any[]>(
      session.username,
      session.userId,
      session.sessionToken,
      "gnuhealth.patient.evaluation",
      "search_read",
      [
        domain,
        0,
        20,
        [["id", "DESC"]],
        [
          "id",
          "patient",
          "healthprof",
          "evaluation_start",
          "systolic",
          "diastolic",
          "bpm",
          "temperature",
          "respiratory_rate",
          "osat",
          "weight",
          "height",
          "bmi",
          "chief_complaint",
          "state",
        ],
      ]
    );

    return NextResponse.json({ success: true, evaluations: evalsRaw });
  } catch (err: unknown) {
    const status = (err as any)?.status || 500;
    const message = err instanceof Error ? err.message : "Failed to load triage evaluations";
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
      systolic,
      diastolic,
      bpm,
      temperature,
      respiratoryRate,
      osat,
      weight,
      height,
      bmi,
      chiefComplaint,
      healthprofId,
    } = body;

    if (!patientId) {
      return NextResponse.json({ error: "Patient ID is required." }, { status: 400 });
    }

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

    // Dynamically resolve attending physician or triage clinician
    const hpId = await ClinicalLookupService.resolveClinician(session, healthprofId);
    if (!hpId) {
      return NextResponse.json(
        { error: "Attending clinician could not be resolved or verified for triage evaluation." },
        { status: 400 }
      );
    }

    const evalPayload: Record<string, unknown> = {
      patient: parseInt(patientId, 10),
      healthprof: hpId,
      evaluation_start: dtObj,
      state: "in_progress",
    };

    if (systolic) evalPayload.systolic = parseInt(systolic, 10);
    if (diastolic) evalPayload.diastolic = parseInt(diastolic, 10);
    if (bpm) evalPayload.bpm = parseInt(bpm, 10);
    if (temperature) evalPayload.temperature = parseFloat(temperature);
    if (respiratoryRate) evalPayload.respiratory_rate = parseInt(respiratoryRate, 10);
    if (osat) evalPayload.osat = parseInt(osat, 10);
    if (weight) evalPayload.weight = parseFloat(weight);
    if (height) evalPayload.height = parseFloat(height);
    if (bmi) evalPayload.bmi = parseFloat(bmi);
    if (chiefComplaint) evalPayload.chief_complaint = chiefComplaint;

    const res = await TrytonClient.execute<number[]>(
      session.username,
      session.userId,
      session.sessionToken,
      "gnuhealth.patient.evaluation",
      "create",
      [[evalPayload]],
      { company: session.companyId },
      session.database
    );

    return NextResponse.json({
      success: true,
      evaluationId: res[0],
      message: "Triage telemetry and vitals committed to Patient Medical Record.",
    });
  } catch (err: unknown) {
    const status = (err as any)?.status || 500;
    const message = err instanceof Error ? err.message : "Failed to record triage evaluation";
    return NextResponse.json({ error: message }, { status });
  }
}
