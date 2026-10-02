import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth-session";
import { TrytonClient } from "@/lib/tryton-client";
import { ClinicalLookupService } from "@/lib/clinical-lookup";
import { hasModuleAccess } from "@/lib/access-control";

function formatTrytonDate(v: any): string | null {
  if (!v || typeof v !== "object" || !v.year) return null;
  return `${v.year}-${String(v.month).padStart(2, "0")}-${String(v.day).padStart(2, "0")}`;
}

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized session" }, { status: 401 });
  }
  if (!hasModuleAccess(session.role, "obstetrics")) {
    return NextResponse.json({ error: "Your role does not have permission for this module." }, { status: 403 });
  }

  try {
    const rawPreg = await TrytonClient.execute<any[]>(
      session.username, session.userId, session.sessionToken,
      "gnuhealth.patient.pregnancy", "search_read",
      [[], 0, 100, [["id", "DESC"]], ["id", "patient", "gravida", "fetuses", "lmp", "current_pregnancy", "pregnancy_end_date", "pregnancy_end_result", "notes"]],
      { company: session.companyId }, session.database
    );

    const idOf = (v: unknown) => (typeof v === "number" ? v : Array.isArray(v) ? v[0] : null);
    const patientIds = [...new Set(rawPreg.map((p) => idOf(p.patient)).filter(Boolean))];
    let patientsMap: Record<number, any> = {};
    if (patientIds.length > 0) {
      try {
        const patients = await TrytonClient.execute<any[]>(
          session.username, session.userId, session.sessionToken,
          "gnuhealth.patient", "search_read",
          [[["id", "in", patientIds]], 0, patientIds.length, null, ["id", "rec_name", "puid"]],
          { company: session.companyId }, session.database
        );
        patientsMap = patients.reduce((acc, p) => { acc[p.id] = p; return acc; }, {} as Record<number, any>);
      } catch {
        // Fallback
      }
    }

    const pregnancies = rawPreg.map((p) => {
      const pid = idOf(p.patient);
      return {
        id: p.id,
        patientId: pid,
        patientName: patientsMap[pid as number]?.rec_name || null,
        puid: patientsMap[pid as number]?.puid || null,
        gravida: p.gravida ?? null,
        fetuses: p.fetuses ?? null,
        lmp: formatTrytonDate(p.lmp),
        currentPregnancy: !!p.current_pregnancy,
        pregnancyEndDate: formatTrytonDate(p.pregnancy_end_date),
        pregnancyEndResult: p.pregnancy_end_result || null,
        notes: p.notes || null,
      };
    });

    // Female patients only, since gravida/pregnancy tracking applies to them.
    // Gender lives on party.party (gnuhealth.patient does not reliably carry
    // its own searchable gender), so filter via the party relation rather
    // than domain-filtering gnuhealth.patient directly.
    let femalePatients: { id: number; name: string; puid: string }[] = [];
    try {
      const allPatients = await TrytonClient.execute<any[]>(
        session.username, session.userId, session.sessionToken,
        "gnuhealth.patient", "search_read",
        [[], 0, 500, null, ["id", "rec_name", "puid", "party"]],
        { company: session.companyId }, session.database
      );
      const partyIds = [...new Set(allPatients.map((p) => idOf(p.party)).filter(Boolean))];
      if (partyIds.length > 0) {
        const parties = await TrytonClient.execute<any[]>(
          session.username, session.userId, session.sessionToken,
          "party.party", "search_read",
          [[["id", "in", partyIds], ["gender", "=", "f"]], 0, partyIds.length, null, ["id"]],
          { company: session.companyId }, session.database
        );
        const femalePartyIds = new Set(parties.map((p) => p.id));
        femalePatients = allPatients
          .filter((p) => femalePartyIds.has(idOf(p.party)))
          .map((p) => ({ id: p.id, name: p.rec_name, puid: p.puid }));
      }
    } catch {
      // Leave femalePatients empty rather than fail the whole request
    }

    return NextResponse.json({
      success: true,
      pregnancies,
      femalePatients,
    });
  } catch (err: unknown) {
    const status = (err as any)?.status || 500;
    const message = err instanceof Error ? err.message : "Failed to load obstetric records";
    return NextResponse.json({ error: message }, { status });
  }
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized session" }, { status: 401 });
  }
  if (!hasModuleAccess(session.role, "obstetrics")) {
    return NextResponse.json({ error: "Your role does not have permission for this module." }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { action } = body;
    const context = { company: session.companyId };

    if (action === "create") {
      const patientId = Number(body.patientId);
      const fetuses = Number(body.fetuses);
      if (!Number.isSafeInteger(patientId) || patientId <= 0) {
        return NextResponse.json({ error: "A valid patient is required." }, { status: 400 });
      }
      if (!Number.isSafeInteger(fetuses) || fetuses <= 0) {
        return NextResponse.json({ error: "Number of fetuses must be a positive whole number." }, { status: 400 });
      }

      // gravida (pregnancy number) is unique per patient - derive the next
      // sequential number from this patient's existing pregnancy records
      // rather than trusting a client-supplied value that could collide.
      const existing = await TrytonClient.execute<any[]>(
        session.username, session.userId, session.sessionToken,
        "gnuhealth.patient.pregnancy", "search_read",
        [[["patient", "=", patientId]], 0, 100, [["gravida", "DESC"]], ["id", "gravida", "current_pregnancy"]],
        context, session.database
      );
      const nextGravida = (existing[0]?.gravida || 0) + 1;

      // A double-click (or re-opening the "New Pregnancy" form) used to be
      // able to open two concurrent current_pregnancy=true records for the
      // same patient - nothing checked for one already open.
      if (existing.some((p) => p.current_pregnancy)) {
        return NextResponse.json(
          { error: "This patient already has an open current pregnancy on file. Close it before recording a new one." },
          { status: 409 }
        );
      }

      if (typeof body.lmp !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(body.lmp)) {
        return NextResponse.json({ error: "Last Menstrual Period (LMP) is required." }, { status: 400 });
      }
      const [lmpY, lmpM, lmpD] = body.lmp.split("-").map(Number);
      const lmpObj = { __class__: "date", year: lmpY, month: lmpM, day: lmpD };

      const healthprofId = await ClinicalLookupService.resolveClinician(session, body.healthprofId);

      const payload: Record<string, unknown> = {
        patient: patientId,
        gravida: nextGravida,
        fetuses,
        lmp: lmpObj,
        current_pregnancy: true,
        healthprof: healthprofId || undefined,
        notes: typeof body.notes === "string" && body.notes.trim() ? body.notes.trim() : undefined,
      };

      const created = await TrytonClient.execute<number[]>(
        session.username, session.userId, session.sessionToken,
        "gnuhealth.patient.pregnancy", "create",
        [[payload]],
        context, session.database
      );

      return NextResponse.json({ success: true, pregnancyId: created[0], message: `Pregnancy (gravida ${nextGravida}) recorded.` });
    }

    if (action === "close") {
      const pregnancyId = Number(body.pregnancyId);
      const result = body.result;
      const gestWeeks = Number(body.gestationalWeeks);
      const VALID_RESULTS = ["live_birth", "abortion", "stillbirth", "status_unknown"];
      if (!Number.isSafeInteger(pregnancyId) || pregnancyId <= 0) {
        return NextResponse.json({ error: "A valid pregnancy record is required." }, { status: 400 });
      }
      if (!VALID_RESULTS.includes(result)) {
        return NextResponse.json({ error: `Result must be one of: ${VALID_RESULTS.join(", ")}.` }, { status: 400 });
      }
      if (!Number.isSafeInteger(gestWeeks) || gestWeeks <= 0) {
        return NextResponse.json({ error: "Gestational weeks at end of pregnancy is required." }, { status: 400 });
      }

      const now = new Date();
      const endDateObj = {
        __class__: "datetime",
        year: now.getUTCFullYear(), month: now.getUTCMonth() + 1, day: now.getUTCDate(),
        hour: now.getUTCHours(), minute: now.getUTCMinutes(), second: now.getUTCSeconds(), microsecond: 0,
      };

      await TrytonClient.execute(
        session.username, session.userId, session.sessionToken,
        "gnuhealth.patient.pregnancy", "write",
        [[pregnancyId], { current_pregnancy: false, pregnancy_end_result: result, pregnancy_end_date: endDateObj, reverse_weeks: gestWeeks }],
        context, session.database
      );

      return NextResponse.json({ success: true, message: "Pregnancy outcome recorded." });
    }

    return NextResponse.json({ error: `Unsupported obstetrics action: ${action}` }, { status: 400 });
  } catch (err: unknown) {
    const status = (err as any)?.status || 500;
    const message = err instanceof Error ? err.message : "Failed to process obstetric record";
    return NextResponse.json({ error: message }, { status });
  }
}
