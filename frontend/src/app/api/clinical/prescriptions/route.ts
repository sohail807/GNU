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
  const patientId = searchParams.get("patientId");

  try {
    let domain: unknown[] = [];
    if (patientId) {
      domain = [["patient", "=", parseInt(patientId, 10)]];
    }

    const rawRx = await TrytonClient.execute<any[]>(
      session.username,
      session.userId,
      session.sessionToken,
      "gnuhealth.prescription.order",
      "search_read",
      [
        domain,
        0,
        20,
        [["id", "DESC"]],
        ["id", "patient", "healthprof", "prescription_date", "state", "prescription_line"],
      ]
    );

    // Resolve patient names
    const patientIds = rawRx
      .map((r) => (typeof r.patient === "number" ? r.patient : r.patient?.[0]))
      .filter(Boolean);
    let patientsMap: Record<number, any> = {};

    if (patientIds.length > 0) {
      try {
        const patients = await TrytonClient.execute<any[]>(
          session.username,
          session.userId,
          session.sessionToken,
          "gnuhealth.patient",
          "search_read",
          [[["id", "in", patientIds]], 0, patientIds.length, null, ["id", "puid", "rec_name"]]
        );
        patientsMap = patients.reduce((acc, p) => {
          acc[p.id] = p;
          return acc;
        }, {} as Record<number, any>);
      } catch {
        // Fallback
      }
    }

    // Resolve prescription lines
    const allLineIds = rawRx.flatMap((r) => r.prescription_line || []);
    let linesMap: Record<number, any> = {};
    if (allLineIds.length > 0) {
      try {
        const lines = await TrytonClient.execute<any[]>(
          session.username,
          session.userId,
          session.sessionToken,
          "gnuhealth.prescription.line",
          "search_read",
          [[["id", "in", allLineIds]], 0, allLineIds.length, null, [
            "id",
            "medicament",
            "dose",
            "dose_unit",
            "form",
            "route",
            "frequency",
            "duration",
          ]]
        );
        linesMap = lines.reduce((acc, l) => {
          acc[l.id] = l;
          return acc;
        }, {} as Record<number, any>);
      } catch {
        // Fallback
      }
    }

    const prescriptions = rawRx.map((rx) => {
      const pid = typeof rx.patient === "number" ? rx.patient : rx.patient?.[0];
      const pat = patientsMap[pid] || {};
      const lineObjs = (rx.prescription_line || []).map((lid: number) => {
        const l = linesMap[lid] || {};
        const medName = Array.isArray(l.medicament) ? l.medicament[1] : null;
        return {
          id: l.id,
          medicament: medName,
          dose: l.dose == null ? null : String(l.dose),
          route: Array.isArray(l.route) ? l.route[1] : null,
          frequency: l.frequency == null ? null : String(l.frequency),
          duration: l.duration == null ? null : String(l.duration),
        };
      });

      return {
        id: rx.id,
        ref: String(rx.id),
        patientId: pid,
        patientName: pat.rec_name || null,
        puid: pat.puid || null,
        date: rx.prescription_date || null,
        state: rx.state || "unknown",
        lines: lineObjs,
      };
    });

    return NextResponse.json({ success: true, prescriptions });
  } catch (err: unknown) {
    const status = (err as any)?.status || 500;
    const message = err instanceof Error ? err.message : "Failed to load prescriptions";
    return NextResponse.json({ error: message }, { status });
  }
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized session" }, { status: 401 });
  }

  const positiveId = (value: unknown): number | null => {
    const parsed = typeof value === "number" ? value : Number(value);
    return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : null;
  };
  const relationId = (value: unknown): number | null => {
    if (typeof value === "number") return positiveId(value);
    if (Array.isArray(value)) return positiveId(value[0]);
    return null;
  };
  const safeFailure = (err: unknown) => {
    const status = (err as { status?: number } | null)?.status;
    if (status === 401 || status === 403 || status === 409) {
      return NextResponse.json(
        { error: status === 403 ? "You do not have permission to prescribe this medication." : "The prescription could not be completed in its current state." },
        { status }
      );
    }
    return NextResponse.json(
      { error: "The prescription could not be saved in the clinical system. No success was recorded." },
      { status: 502 }
    );
  };

  try {
    const body = await req.json();

    if (body.action === "issue") {
      const prescriptionId = positiveId(body.prescriptionId);
      if (!prescriptionId) {
        return NextResponse.json({ error: "A valid draft prescription ID is required." }, { status: 400 });
      }
      const current = await TrytonClient.execute<Array<{ id: number; state: string }>>(
        session.username,
        session.userId,
        session.sessionToken,
        "gnuhealth.prescription.order",
        "read",
        [[prescriptionId], ["id", "state"]],
        { company: session.companyId },
        session.database
      );
      if (!current[0] || current[0].state !== "draft") {
        return NextResponse.json({ error: "Only a draft prescription can be issued." }, { status: 409 });
      }
      await TrytonClient.execute(
        session.username,
        session.userId,
        session.sessionToken,
        "gnuhealth.prescription.order",
        "create_prescription",
        [[prescriptionId]],
        { company: session.companyId },
        session.database
      );
      const issued = await TrytonClient.execute<Array<{ id: number; prescription_id: string; state: string }>>(
        session.username,
        session.userId,
        session.sessionToken,
        "gnuhealth.prescription.order",
        "read",
        [[prescriptionId], ["id", "prescription_id", "state"]],
        { company: session.companyId },
        session.database
      );
      if (!issued[0] || issued[0].state !== "done") {
        return NextResponse.json(
          { error: "The clinical system did not confirm the prescription state transition.", prescriptionId, state: issued[0]?.state ?? "unknown" },
          { status: 502 }
        );
      }
      return NextResponse.json({ success: true, prescriptionId, reference: issued[0].prescription_id, state: issued[0].state });
    }

    const patientId = positiveId(body.patientId);
    if (!patientId || !Array.isArray(body.lines) || body.lines.length < 1 || body.lines.length > 20) {
      return NextResponse.json({ error: "Select a patient and between 1 and 20 medication lines." }, { status: 400 });
    }
    if (body.acknowledgeWarnings !== true) {
      return NextResponse.json({ error: "Review and acknowledge the prescription safety checks before continuing." }, { status: 400 });
    }
    if (!session.healthprofId) {
      return NextResponse.json({ error: "The signed-in user is not linked to a health professional record." }, { status: 403 });
    }

    const patientRecords = await TrytonClient.execute<Array<{ id: number; childbearing_age?: boolean; crit_allergic?: boolean }>>(
      session.username,
      session.userId,
      session.sessionToken,
      "gnuhealth.patient",
      "read",
      [[patientId], ["id", "childbearing_age", "crit_allergic"]],
      { company: session.companyId },
      session.database
    );
    const patient = patientRecords[0];
    if (!patient) return NextResponse.json({ error: "The selected patient could not be found." }, { status: 404 });

    const medicationIds = [...new Set(body.lines.map((line: Record<string, unknown>) => positiveId(line.medicamentId)).filter((id: number | null): id is number => id !== null))];
    if (medicationIds.length !== body.lines.length) {
      return NextResponse.json({ error: "Every medication line must reference a valid catalog item." }, { status: 400 });
    }
    const medicaments = await TrytonClient.execute<Array<{
      id: number;
      rec_name: string;
      active: boolean;
      strength: number | null;
      unit: number | [number, string] | null;
      route: number | [number, string] | null;
      form: number | [number, string] | null;
      pregnancy_warning: boolean;
    }>>(
      session.username,
      session.userId,
      session.sessionToken,
      "gnuhealth.medicament",
      "search_read",
      [[ ["id", "in", medicationIds], ["active", "=", true] ], 0, medicationIds.length, null, ["id", "rec_name", "active", "strength", "unit", "route", "form", "pregnancy_warning"]],
      { company: session.companyId },
      session.database
    );
    const medicationById = new Map(medicaments.map((medicament) => [medicament.id, medicament]));
    if (medicationById.size !== medicationIds.length) {
      return NextResponse.json({ error: "One or more selected medications are inactive or unavailable." }, { status: 400 });
    }

    const routeIds = [...new Set(body.lines.map((line: Record<string, unknown>) => positiveId(line.routeId)).filter((id: number | null): id is number => id !== null))];
    if (routeIds.length) {
      const routes = await TrytonClient.execute<Array<{ id: number }>>(
        session.username,
        session.userId,
        session.sessionToken,
        "gnuhealth.drug.route",
        "search_read",
        [[ ["id", "in", routeIds] ], 0, routeIds.length, null, ["id"]],
        { company: session.companyId },
        session.database
      );
      if (routes.length !== routeIds.length) return NextResponse.json({ error: "A selected administration route is unavailable." }, { status: 400 });
    }

    const validFrequencyUnits = new Set(["seconds", "minutes", "hours", "days", "weeks", "wr"]);
    const validDurationPeriods = new Set(["minutes", "hours", "days", "months", "years", "indefinite"]);
    const lineValues: Record<string, unknown>[] = [];
    for (const line of body.lines as Record<string, unknown>[]) {
      const medicamentId = positiveId(line.medicamentId)!;
      const medicament = medicationById.get(medicamentId)!;
      const dose = Number(line.dose);
      const frequency = Number(line.frequency);
      const duration = Number(line.duration);
      const routeId = positiveId(line.routeId) ?? relationId(medicament.route);
      const doseUnitId = relationId(medicament.unit);
      const formId = relationId(medicament.form);
      const frequencyUnit = String(line.frequencyUnit || "");
      const durationPeriod = String(line.durationPeriod || "");
      if (!Number.isFinite(dose) || dose <= 0 || !doseUnitId || !routeId || !Number.isSafeInteger(frequency) || frequency <= 0 || !validFrequencyUnits.has(frequencyUnit) || !Number.isSafeInteger(duration) || duration <= 0 || !validDurationPeriods.has(durationPeriod)) {
        return NextResponse.json({ error: `Complete a valid dose, route, frequency, and duration for ${medicament.rec_name}.` }, { status: 400 });
      }
      lineValues.push({
        medicament: medicamentId,
        dose,
        dose_unit: doseUnitId,
        route: routeId,
        ...(formId ? { form: formId } : {}),
        frequency,
        frequency_unit: frequencyUnit,
        duration,
        duration_period: durationPeriod,
        add_to_history: true,
      });
    }

    const needsWarningReview = Boolean(patient.childbearing_age || patient.crit_allergic || medicaments.some((medicament) => medicament.pregnancy_warning));
    if (needsWarningReview && body.acknowledgeWarnings !== true) {
      return NextResponse.json({ error: "Review the patient and medication warnings before issuing this prescription." }, { status: 409 });
    }

    const created = await TrytonClient.execute<number[]>(
      session.username,
      session.userId,
      session.sessionToken,
      "gnuhealth.prescription.order",
      "create",
      [[{
        patient: patientId,
        pregnancy_warning: Boolean(patient.childbearing_age || medicaments.some((medicament) => medicament.pregnancy_warning)),
        prescription_warning_ack: true,
        notes: typeof body.notes === "string" ? body.notes.trim().slice(0, 4000) : "",
        prescription_line: [["create", lineValues]],
      }]],
      { company: session.companyId },
      session.database
    );
    const prescriptionId = positiveId(created[0]);
    if (!prescriptionId) return NextResponse.json({ error: "Tryton did not return a prescription record ID." }, { status: 502 });

    try {
      await TrytonClient.execute(
        session.username,
        session.userId,
        session.sessionToken,
        "gnuhealth.prescription.order",
        "create_prescription",
        [[prescriptionId]],
        { company: session.companyId },
        session.database
      );
    } catch (err: unknown) {
      const status = (err as { status?: number } | null)?.status;
      return NextResponse.json(
        { error: "The prescription draft was saved but could not be issued. Retry the issue action; do not submit a duplicate prescription.", prescriptionId, state: "draft" },
        { status: status === 403 ? 403 : 409 }
      );
    }

    const issued = await TrytonClient.execute<Array<{ id: number; prescription_id: string; state: string }>>(
      session.username,
      session.userId,
      session.sessionToken,
      "gnuhealth.prescription.order",
      "read",
      [[prescriptionId], ["id", "prescription_id", "state"]],
      { company: session.companyId },
      session.database
    );
    if (!issued[0] || issued[0].state !== "done") {
      return NextResponse.json(
        { error: "Tryton did not confirm the prescription state transition. Review the saved draft before retrying.", prescriptionId, state: issued[0]?.state ?? "unknown" },
        { status: 502 }
      );
    }
    return NextResponse.json({ success: true, prescriptionId, reference: issued[0].prescription_id, state: issued[0].state });
  } catch (err: unknown) {
    return safeFailure(err);
  }
}
