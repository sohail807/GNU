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

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized session" }, { status: 401 });
  }
  if (!hasModuleAccess(session.role, "immunizations")) {
    return NextResponse.json({ error: "Your role does not have permission for this module." }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const patientId = searchParams.get("patientId");

  try {
    // Vaccine catalog: medicaments flagged is_vaccine, loaded live so the
    // "record vaccination" form can only ever reference a real formulary entry.
    const vaccineProducts = await TrytonClient.execute<any[]>(
      session.username, session.userId, session.sessionToken,
      "gnuhealth.medicament", "search_read",
      [[["is_vaccine", "=", true]], 0, 100, null, ["id", "active_component"]],
      { company: session.companyId }, session.database
    );

    const domain: unknown[] = patientId ? [["patient", "=", parseInt(patientId, 10)]] : [];
    const rawVax = await TrytonClient.execute<any[]>(
      session.username, session.userId, session.sessionToken,
      "gnuhealth.vaccination", "search_read",
      [domain, 0, 100, [["date", "DESC"]], ["id", "patient", "vaccine", "dose", "date", "next_dose_date", "vaccine_lot", "admin_route", "observations", "state"]],
      { company: session.companyId }, session.database
    );

    const idOf = (v: unknown) => (typeof v === "number" ? v : Array.isArray(v) ? v[0] : null);
    const patientIds = [...new Set(rawVax.map((v) => idOf(v.patient)).filter(Boolean))];
    const vaccineIds = [...new Set(rawVax.map((v) => idOf(v.vaccine)).filter(Boolean))];

    const lookup = async (model: string, ids: unknown[], fields: string[]) => {
      if (ids.length === 0) return {} as Record<number, any>;
      try {
        const rows = await TrytonClient.execute<any[]>(
          session.username, session.userId, session.sessionToken,
          model, "search_read",
          [[["id", "in", ids]], 0, ids.length, null, fields],
          { company: session.companyId }, session.database
        );
        return rows.reduce((acc, r) => { acc[r.id] = r; return acc; }, {} as Record<number, any>);
      } catch {
        return {} as Record<number, any>;
      }
    };
    const [patientsMap, vaccinesMap] = await Promise.all([
      lookup("gnuhealth.patient", patientIds, ["id", "rec_name", "puid"]),
      lookup("gnuhealth.medicament", vaccineIds, ["id", "active_component"]),
    ]);

    const vaccinations = rawVax.map((v) => {
      const pid = idOf(v.patient);
      const vid = idOf(v.vaccine);
      return {
        id: v.id,
        patientId: pid,
        patientName: patientsMap[pid as number]?.rec_name || null,
        puid: patientsMap[pid as number]?.puid || null,
        vaccineId: vid,
        vaccineName: vaccinesMap[vid as number]?.active_component || null,
        dose: v.dose ?? null,
        date: formatTrytonDateTime(v.date),
        nextDoseDate: formatTrytonDateTime(v.next_dose_date),
        vaccineLot: v.vaccine_lot || null,
        adminRoute: v.admin_route || null,
        observations: v.observations || null,
        state: v.state || null,
      };
    });

    return NextResponse.json({
      success: true,
      vaccinations,
      vaccineCatalog: vaccineProducts.map((p) => ({ id: p.id, name: p.active_component })),
    });
  } catch (err: unknown) {
    const status = (err as any)?.status || 500;
    const message = err instanceof Error ? err.message : "Failed to load immunization records";
    return NextResponse.json({ error: message }, { status });
  }
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized session" }, { status: 401 });
  }
  if (!hasModuleAccess(session.role, "immunizations")) {
    return NextResponse.json({ error: "Your role does not have permission for this module." }, { status: 403 });
  }

  try {
    const body = await req.json();
    const patientId = Number(body.patientId);
    const vaccineId = Number(body.vaccineId);
    if (!Number.isSafeInteger(patientId) || patientId <= 0 || !Number.isSafeInteger(vaccineId) || vaccineId <= 0) {
      return NextResponse.json({ error: "A valid patient and vaccine are required." }, { status: 400 });
    }
    const dose = body.dose !== undefined && body.dose !== "" ? Number(body.dose) : undefined;
    if (dose !== undefined && (!Number.isSafeInteger(dose) || dose <= 0)) {
      return NextResponse.json({ error: "Dose number must be a positive whole number." }, { status: 400 });
    }

    const healthprofId = await ClinicalLookupService.resolveClinician(session, body.healthprofId);
    if (!healthprofId) {
      return NextResponse.json({ error: "The administering clinician could not be resolved for this session." }, { status: 400 });
    }

    const now = new Date();
    const dateObj = {
      __class__: "datetime",
      year: now.getUTCFullYear(), month: now.getUTCMonth() + 1, day: now.getUTCDate(),
      hour: now.getUTCHours(), minute: now.getUTCMinutes(), second: now.getUTCSeconds(), microsecond: 0,
    };

    let nextDoseObj: unknown = undefined;
    if (typeof body.nextDoseDate === "string" && /^\d{4}-\d{2}-\d{2}$/.test(body.nextDoseDate)) {
      const [y, m, d] = body.nextDoseDate.split("-").map(Number);
      nextDoseObj = { __class__: "datetime", year: y, month: m, day: d, hour: 0, minute: 0, second: 0, microsecond: 0 };
    }

    const payload: Record<string, unknown> = {
      patient: patientId,
      vaccine: vaccineId,
      healthprof: healthprofId,
      date: dateObj,
      dose,
      next_dose_date: nextDoseObj,
      vaccine_lot: typeof body.vaccineLot === "string" && body.vaccineLot.trim() ? body.vaccineLot.trim() : undefined,
      admin_route: typeof body.adminRoute === "string" && body.adminRoute.trim() ? body.adminRoute.trim() : undefined,
      observations: typeof body.observations === "string" && body.observations.trim() ? body.observations.trim() : undefined,
    };

    const created = await TrytonClient.execute<number[]>(
      session.username, session.userId, session.sessionToken,
      "gnuhealth.vaccination", "create",
      [[payload]],
      { company: session.companyId }, session.database
    );

    return NextResponse.json({ success: true, vaccinationId: created[0], message: "Vaccination administration recorded." });
  } catch (err: unknown) {
    const status = (err as any)?.status || 500;
    const message = err instanceof Error ? err.message : "Failed to record vaccination";
    return NextResponse.json({ error: message }, { status });
  }
}
