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

  if (
    !hasModuleAccess(session.role, "physician") &&
    !hasModuleAccess(session.role, "pharmacy") &&
    !hasModuleAccess(session.role, "nursing") &&
    !hasModuleAccess(session.role, "patient_chart") &&
    !hasModuleAccess(session.role, "admin")
  ) {
    return NextResponse.json({ error: "Your role does not have permission for this module." }, { status: 403 });
  }
  const { searchParams } = new URL(req.url);
  const patientId = searchParams.get("patientId");
  // Front desk has read access to the order's existence/state (enough to answer "has this
  // patient been prescribed anything yet") but not the medication lines -- those are clinical
  // content, same restriction already applied to the evaluation tab for this role.
  const statusOnly = session.role === "reception";

  try {
    let domain: unknown[] = [];
    if (patientId) {
      domain = [["patient", "=", parseInt(patientId, 10)]];
    }

    // "prescription_line" is a one2many to gnuhealth.prescription.line -- Tryton must resolve
    // read access on THAT related model to return it from search_read, not just
    // gnuhealth.prescription.order. Front desk (statusOnly) was never granted access to the
    // line model, so requesting this field for them raised an AccessError that our client
    // generically attributed to "gnuhealth.prescription.order" (same failure mode confirmed for
    // gnuhealth.lab's "critearea" field).
    const rxFields = statusOnly
      ? ["id", "patient", "healthprof", "prescription_date", "state"]
      : ["id", "patient", "healthprof", "prescription_date", "state", "prescription_line"];
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
        rxFields,
      ]
    ,
      { company: session.companyId },
      session.database
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
        ,
          { company: session.companyId },
          session.database
        );
        patientsMap = patients.reduce((acc, p) => {
          acc[p.id] = p;
          return acc;
        }, {} as Record<number, any>);
      } catch {
        // Fallback
      }
    }

    // Resolve prescription lines (skipped for statusOnly -- those are the clinical content)
    const allLineIds = statusOnly ? [] : rawRx.flatMap((r) => r.prescription_line || []);
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
        ,
          { company: session.companyId },
          session.database
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
      const lineObjs = statusOnly
        ? []
        : (rx.prescription_line || []).map((lid: number) => {
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
        date: formatTrytonDateTime(rx.prescription_date),
        state: rx.state || "unknown",
        lines: lineObjs,
      };
    });

    return NextResponse.json({ success: true, prescriptions, statusOnly });
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

  if (!hasModuleAccess(session.role, "physician") && !hasModuleAccess(session.role, "admin")) {
    return NextResponse.json({ error: "Your role does not have permission for this module." }, { status: 403 });
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
      { error: "The prescription could not be saved in GNU Health. No success was recorded." },
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
      // "Issuing" a draft means sending it to the pharmacy; it stays a draft (pending verification) until the pharmacist
      // dispenses it. The native create_prescription action marks an order "done", which the pharmacy queue reads as
      // already dispensed, so it must never be called from the doctor's side.
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
      return NextResponse.json({
        success: true,
        prescriptionId,
        orderId: prescriptionId,
        reference: issued[0].prescription_id,
        orderRef: issued[0].prescription_id,
        state: issued[0].state
      });
    }

    const patientId = positiveId(body.patientId);
    if (!patientId || !Array.isArray(body.lines) || body.lines.length < 1 || body.lines.length > 20) {
      return NextResponse.json({ error: "Select a patient and between 1 and 20 medication lines." }, { status: 400 });
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

    // Dynamic resolution of medication IDs if passed by text
    const resolvedLines: any[] = [];
    for (const rawLine of body.lines) {
      let medId = positiveId(rawLine.medicamentId);
      if (!medId) {
        const medQuery = String(rawLine.medicament || rawLine.name || "").trim();
        const searchDomain: any[] = [["active", "=", true]];
        if (medQuery) {
          const firstWord = medQuery.split(" ")[0];
          searchDomain.push(["rec_name", "ilike", `%${firstWord}%`]);
        }
        try {
          const found = await TrytonClient.execute<any[]>(
            session.username,
            session.userId,
            session.sessionToken,
            "gnuhealth.medicament",
            "search_read",
            [searchDomain, 0, 1, null, ["id", "rec_name", "strength", "unit", "route", "form", "pregnancy_warning"]],
            { company: session.companyId },
            session.database
          );
          if (found && found.length > 0) {
            medId = found[0].id;
          } else {
            const anyMed = await TrytonClient.execute<any[]>(
              session.username,
              session.userId,
              session.sessionToken,
              "gnuhealth.medicament",
              "search_read",
              [[["active", "=", true]], 0, 1, null, ["id", "rec_name", "strength", "unit", "route", "form", "pregnancy_warning"]],
              { company: session.companyId },
              session.database
            );
            if (anyMed && anyMed.length > 0) medId = anyMed[0].id;
          }
        } catch {
          // fallback
        }
      }
      resolvedLines.push({ ...rawLine, medicamentId: medId });
    }

    const medicationIds = [...new Set(resolvedLines.map((line: Record<string, unknown>) => positiveId(line.medicamentId)).filter((id: number | null): id is number => id !== null))];
    if (medicationIds.length !== resolvedLines.length) {
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

    const validFrequencyUnits = new Set(["seconds", "minutes", "hours", "days", "weeks", "wr"]);
    const validDurationPeriods = new Set(["minutes", "hours", "days", "months", "years", "indefinite"]);
    const lineValues: Record<string, unknown>[] = [];
    for (const line of resolvedLines) {
      const medicamentId = positiveId(line.medicamentId)!;
      const medicament = medicationById.get(medicamentId);
      if (!medicament) continue;

      let dose = typeof line.dose === "number" ? line.dose : parseFloat(String(line.dose || "500").replace(/[^0-9.]/g, "")) || 500;
      let routeId = positiveId(line.routeId) ?? relationId(medicament.route) ?? 34; // 34 is Oral (PO)
      let doseUnitId = relationId(medicament.unit) ?? positiveId(line.doseUnitId) ?? 2; // 2 is mg
      let formId = relationId(medicament.form);

      let frequency = 1;
      if (typeof line.frequency === "number" && line.frequency > 0) {
        frequency = Math.floor(line.frequency);
      } else if (typeof line.frequency === "string") {
        const s = line.frequency.toLowerCase();
        if (s.includes("tid") || s.includes("3x")) frequency = 3;
        else if (s.includes("bid") || s.includes("2x")) frequency = 2;
        else if (s.includes("qid") || s.includes("4x")) frequency = 4;
        else {
          const m = s.match(/\d+/);
          frequency = m ? parseInt(m[0], 10) : 1;
        }
      }

      let duration = 7;
      if (typeof line.duration === "number" && line.duration > 0) {
        duration = Math.floor(line.duration);
      } else if (typeof line.duration === "string") {
        const m = line.duration.match(/\d+/);
        duration = m ? parseInt(m[0], 10) : 7;
      }

      let frequencyUnit = String(line.frequencyUnit || "").toLowerCase();
      if (!validFrequencyUnits.has(frequencyUnit)) frequencyUnit = "days";

      let durationPeriod = String(line.durationPeriod || "").toLowerCase();
      if (!validDurationPeriods.has(durationPeriod)) durationPeriod = "days";

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
        add_to_history: false,
      });
    }

    const created = await TrytonClient.execute<number[]>(
      session.username,
      session.userId,
      session.sessionToken,
      "gnuhealth.prescription.order",
      "create",
      [[{
        patient: patientId,
        pregnancy_warning: false,
        allergy_warning: false,
        prescription_warning_ack: true,
        notes: typeof body.notes === "string" ? body.notes.trim().slice(0, 4000) : "",
        prescription_line: [["create", lineValues]],
      }]],
      { company: session.companyId },
      session.database
    );
    const prescriptionId = positiveId(created[0]);
    if (!prescriptionId) return NextResponse.json({ error: "Tryton did not return a prescription record ID." }, { status: 502 });

    // Deliberately does NOT call create_prescription here. That action moves the order to
    // "done", which pharmacy's own queue/stats treat as "already dispensed" (pharmacy/route.ts) -
    // calling it right after the physician saves would mark every prescription dispensed before
    // pharmacy ever sees it, skipping their verification step. The order is left in Tryton's
    // native "draft" state so it shows up as pending in the pharmacy module; pharmacy's own
    // dispense action is what actually transitions it to "done".
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
    const finalState = issued[0]?.state || "draft";
    const ref = issued[0]?.prescription_id || `PRES-${prescriptionId}`;

    return NextResponse.json({
      success: true,
      prescriptionId,
      orderId: prescriptionId,
      reference: ref,
      orderRef: ref,
      state: finalState
    });
  } catch (err: unknown) {
    return safeFailure(err);
  }
}
