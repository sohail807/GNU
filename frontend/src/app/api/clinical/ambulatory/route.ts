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

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized session" }, { status: 401 });
  }
  if (!hasModuleAccess(session.role, "ambulatory")) {
    return NextResponse.json({ error: "Your role does not have permission for this module." }, { status: 403 });
  }

  const context = { company: session.companyId };

  try {
    const [patients, procedureCatalog, rawProcedures, rawEcgs] = await Promise.all([
      TrytonClient.execute<any[]>(session.username, session.userId, session.sessionToken, "gnuhealth.patient", "search_read", [[], 0, 500, null, ["id", "rec_name", "puid"]], context, session.database),
      TrytonClient.execute<any[]>(session.username, session.userId, session.sessionToken, "gnuhealth.procedure", "search_read", [[], 0, 200, [["name", "ASC"]], ["id", "name", "description"]], context, session.database),
      TrytonClient.execute<any[]>(session.username, session.userId, session.sessionToken, "gnuhealth.patient.procedure", "search_read", [[["ctx", "=", "ambulatory"]], 0, 100, [["pdate", "DESC"]], ["id", "patient", "procedure", "pdate", "comments"]], context, session.database),
      TrytonClient.execute<any[]>(session.username, session.userId, session.sessionToken, "gnuhealth.patient.ecg", "search_read", [[], 0, 100, [["ecg_date", "DESC"]], ["id", "patient", "ecg_date", "rate", "rhythm", "axis", "pacemaker", "pr", "qrs", "qt", "st_segment", "twave_inversion", "interpretation", "lead"]], context, session.database),
    ]);

    const patientIds = [...new Set([...rawProcedures.map((p) => idOf(p.patient)), ...rawEcgs.map((e) => idOf(e.patient))].filter(Boolean))];
    let patientsMap: Record<number, any> = {};
    if (patientIds.length > 0) {
      const rows = await TrytonClient.execute<any[]>(
        session.username, session.userId, session.sessionToken,
        "gnuhealth.patient", "search_read",
        [[["id", "in", patientIds]], 0, patientIds.length, null, ["id", "rec_name", "puid"]],
        context, session.database
      );
      patientsMap = rows.reduce((acc, r) => { acc[r.id] = r; return acc; }, {} as Record<number, any>);
    }
    const procedureCatalogMap = procedureCatalog.reduce((acc, p) => { acc[p.id] = p; return acc; }, {} as Record<number, any>);

    return NextResponse.json({
      success: true,
      patients: patients.map((p) => ({ id: p.id, name: p.rec_name, puid: p.puid })),
      procedureCatalog: procedureCatalog.map((p) => ({ id: p.id, code: p.name, description: p.description })),
      procedures: rawProcedures.map((p) => {
        const pid = idOf(p.patient);
        const procId = idOf(p.procedure);
        return {
          id: p.id,
          patientId: pid,
          patientName: patientsMap[pid as number]?.rec_name || null,
          procedureCode: procedureCatalogMap[procId as number]?.name || null,
          procedureDescription: procedureCatalogMap[procId as number]?.description || null,
          date: formatTrytonDateTime(p.pdate),
          comments: p.comments || null,
        };
      }),
      ecgs: rawEcgs.map((e) => {
        const pid = idOf(e.patient);
        return {
          id: e.id,
          patientId: pid,
          patientName: patientsMap[pid as number]?.rec_name || null,
          date: formatTrytonDateTime(e.ecg_date),
          rate: e.rate ?? null,
          rhythm: e.rhythm || null,
          axis: e.axis || null,
          pacemaker: e.pacemaker || null,
          pr: e.pr ?? null,
          qrs: e.qrs ?? null,
          qt: e.qt ?? null,
          stSegment: e.st_segment || null,
          twaveInversion: !!e.twave_inversion,
          interpretation: e.interpretation || null,
          lead: e.lead || null,
        };
      }),
    });
  } catch (err: unknown) {
    const status = (err as any)?.status || 500;
    const message = err instanceof Error ? err.message : "Failed to load ambulatory records";
    return NextResponse.json({ error: message }, { status });
  }
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!hasModuleAccess(session.role, "ambulatory")) {
    return NextResponse.json({ error: "Your role does not have permission for this module." }, { status: 403 });
  }
  try {
    const body = await req.json();
    const action = body.action;
    const context = { company: session.companyId };

    if (action === "addProcedureCode") {
      const code = typeof body.code === "string" ? body.code.trim().toUpperCase() : "";
      const description = typeof body.description === "string" ? body.description.trim() : "";
      if (!code || !description) {
        return NextResponse.json({ error: "A procedure code and description are required." }, { status: 400 });
      }
      const created = await TrytonClient.execute<number[]>(
        session.username, session.userId, session.sessionToken,
        "gnuhealth.procedure", "create",
        [[{ name: code, description }]],
        context, session.database
      );
      return NextResponse.json({ success: true, id: created[0], message: `Procedure code "${code}" added to catalog.` });
    }

    if (action === "addProcedure") {
      const patientId = Number(body.patientId);
      const procedureId = Number(body.procedureId);
      if (!Number.isSafeInteger(patientId) || patientId <= 0 || !Number.isSafeInteger(procedureId) || procedureId <= 0) {
        return NextResponse.json({ error: "A patient and a procedure are required." }, { status: 400 });
      }
      const created = await TrytonClient.execute<number[]>(
        session.username, session.userId, session.sessionToken,
        "gnuhealth.patient.procedure", "create",
        [[{
          patient: patientId,
          procedure: procedureId,
          ctx: "ambulatory",
          pdate: new Date().toISOString().slice(0, 19).replace("T", " "),
          comments: typeof body.comments === "string" && body.comments.trim() ? body.comments.trim() : undefined,
        }]],
        context, session.database
      );
      return NextResponse.json({ success: true, id: created[0], message: "Ambulatory procedure recorded." });
    }

    if (action === "addEcg") {
      const patientId = Number(body.patientId);
      const rate = Number(body.rate);
      const VALID_AXIS = ["normal", "left", "right", "extreme_right"];
      const VALID_RHYTHM = ["regular", "irregular"];
      const VALID_PACEMAKER = ["sa", "av", "pk"];
      const VALID_ST = ["normal", "depressed", "elevated"];
      if (!Number.isSafeInteger(patientId) || patientId <= 0) {
        return NextResponse.json({ error: "A valid patient is required." }, { status: 400 });
      }
      if (!Number.isSafeInteger(rate) || rate <= 0) {
        return NextResponse.json({ error: "Heart rate is required." }, { status: 400 });
      }
      if (!VALID_AXIS.includes(body.axis)) {
        return NextResponse.json({ error: `Axis must be one of: ${VALID_AXIS.join(", ")}.` }, { status: 400 });
      }
      if (!VALID_RHYTHM.includes(body.rhythm)) {
        return NextResponse.json({ error: `Rhythm must be one of: ${VALID_RHYTHM.join(", ")}.` }, { status: 400 });
      }
      if (!VALID_PACEMAKER.includes(body.pacemaker)) {
        return NextResponse.json({ error: `Pacemaker must be one of: ${VALID_PACEMAKER.join(", ")}.` }, { status: 400 });
      }
      if (!VALID_ST.includes(body.stSegment)) {
        return NextResponse.json({ error: `ST segment must be one of: ${VALID_ST.join(", ")}.` }, { status: 400 });
      }
      if (typeof body.interpretation !== "string" || !body.interpretation.trim()) {
        return NextResponse.json({ error: "A clinical interpretation is required." }, { status: 400 });
      }

      const healthprofId = await ClinicalLookupService.resolveClinician(session, body.healthprofId);
      if (!healthprofId) {
        return NextResponse.json({ error: "No health professional could be resolved for this session to sign the ECG." }, { status: 400 });
      }

      const created = await TrytonClient.execute<number[]>(
        session.username, session.userId, session.sessionToken,
        "gnuhealth.patient.ecg", "create",
        [[{
          patient: patientId,
          ecg_date: new Date().toISOString().slice(0, 19).replace("T", " "),
          axis: body.axis,
          rate,
          rhythm: body.rhythm,
          pacemaker: body.pacemaker,
          st_segment: body.stSegment,
          pr: body.pr ? Number(body.pr) : undefined,
          qrs: body.qrs ? Number(body.qrs) : undefined,
          qt: body.qt ? Number(body.qt) : undefined,
          twave_inversion: !!body.twaveInversion,
          lead: body.lead || undefined,
          interpretation: body.interpretation.trim(),
          healthprof: healthprofId,
        }]],
        context, session.database
      );
      return NextResponse.json({ success: true, id: created[0], message: "ECG recorded." });
    }

    return NextResponse.json({ error: `Unsupported ambulatory action: ${action}` }, { status: 400 });
  } catch (err: unknown) {
    const status = (err as any)?.status || 500;
    const message = err instanceof Error ? err.message : "Failed to process ambulatory record";
    return NextResponse.json({ error: message }, { status });
  }
}
