import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth-session";
import { TrytonClient } from "@/lib/tryton-client";
import { ClinicalLookupService } from "@/lib/clinical-lookup";
import { hasModuleAccess } from "@/lib/access-control";

// Tryton datetime/date fields deserialize as { __class__, year, month, day, hour?, minute? }
// objects, not strings - rendering one directly as a React child crashes the page.
function formatTrytonDateTime(v: any): string | null {
  if (!v || typeof v !== "object" || !v.year) return null;
  const datePart = `${v.year}-${String(v.month).padStart(2, "0")}-${String(v.day).padStart(2, "0")}`;
  if (typeof v.hour !== "number") return datePart;
  return `${datePart}T${String(v.hour).padStart(2, "0")}:${String(v.minute || 0).padStart(2, "0")}`;
}

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized session" }, { status: 401 });
  }

  // Reading vitals is broader than recording them: the physician consultation cockpit pulls
  // the nurse's triage evaluation for the same patient, so a physician session must be able to
  // read here even though only nursing can create/update via POST below.
  if (!hasModuleAccess(session.role, "nursing") && !hasModuleAccess(session.role, "physician")) {
    return NextResponse.json({ error: "Your role does not have permission for this module." }, { status: 403 });
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
    ,
      { company: session.companyId },
      session.database
    );

    const evaluations = evalsRaw.map((e: any) => ({
      id: e.id,
      patientId: typeof e.patient === "number" ? e.patient : e.patient?.[0],
      healthprofId: typeof e.healthprof === "number" ? e.healthprof : e.healthprof?.[0],
      evaluationStart: formatTrytonDateTime(e.evaluation_start),
      systolic: e.systolic ?? null,
      diastolic: e.diastolic ?? null,
      bpm: e.bpm ?? null,
      temperature: e.temperature ?? null,
      respiratoryRate: e.respiratory_rate ?? null,
      osat: e.osat ?? null,
      weight: e.weight ?? null,
      height: e.height ?? null,
      bmi: e.bmi ?? null,
      chiefComplaint: e.chief_complaint || null,
      state: e.state || null,
    }));

    return NextResponse.json({ success: true, evaluations });
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

  if (!hasModuleAccess(session.role, "nursing")) {
    return NextResponse.json({ error: "Your role does not have permission for this module." }, { status: 403 });
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

    // GNU Health stores/compares naive datetimes as UTC (confirmed live: a
    // record written with this server's *local* time components - e.g. GST,
    // UTC+4 - landed hours in Tryton's future relative to its own clock,
    // which then rejected completing the evaluation with "End time ...
    // BEFORE evaluation start ..."). Use UTC getters so this is correct
    // regardless of which timezone the Next.js process happens to run in.
    const now = new Date();
    const dtObj = {
      __class__: "datetime",
      year: now.getUTCFullYear(),
      month: now.getUTCMonth() + 1,
      day: now.getUTCDate(),
      hour: now.getUTCHours(),
      minute: now.getUTCMinutes(),
      second: now.getUTCSeconds(),
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

    // Re-measuring vitals or correcting a typo and saving again used to always
    // create a brand-new evaluation - confirmed live: submitting triage twice
    // for the same patient left two separate "in_progress" evaluations, one
    // of them silently orphaned (whichever wasn't the highest id). Resume the
    // patient's existing in_progress evaluation instead, the same fix already
    // applied on the physician side for the identical bug class.
    let evaluationId: number;
    const existing = await TrytonClient.execute<Array<{ id: number }>>(
      session.username, session.userId, session.sessionToken,
      "gnuhealth.patient.evaluation", "search_read",
      [[["patient", "=", parseInt(patientId, 10)], ["state", "=", "in_progress"]], 0, 1, [["id", "DESC"]], ["id"]],
      { company: session.companyId }, session.database
    );

    if (existing[0]) {
      evaluationId = existing[0].id;
      delete evalPayload.patient;
      delete evalPayload.evaluation_start;
      await TrytonClient.execute(
        session.username, session.userId, session.sessionToken,
        "gnuhealth.patient.evaluation", "write",
        [[evaluationId], evalPayload],
        { company: session.companyId }, session.database
      );
    } else {
      const res = await TrytonClient.execute<number[]>(
        session.username, session.userId, session.sessionToken,
        "gnuhealth.patient.evaluation", "create",
        [[evalPayload]],
        { company: session.companyId }, session.database
      );
      evaluationId = res[0];
    }

    return NextResponse.json({
      success: true,
      evaluationId,
      message: "Triage telemetry and vitals committed to Patient Medical Record.",
    });
  } catch (err: unknown) {
    const status = (err as any)?.status || 500;
    const message = err instanceof Error ? err.message : "Failed to record triage evaluation";
    return NextResponse.json({ error: message }, { status });
  }
}
