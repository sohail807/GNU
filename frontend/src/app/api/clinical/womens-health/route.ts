import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth-session";
import { TrytonClient } from "@/lib/tryton-client";
import { ClinicalLookupService } from "@/lib/clinical-lookup";
import { hasModuleAccess } from "@/lib/access-control";

function formatTrytonDate(v: any): string | null {
  if (!v || typeof v !== "object" || !v.year) return null;
  return `${v.year}-${String(v.month).padStart(2, "0")}-${String(v.day).padStart(2, "0")}`;
}
function toDateObj(s: string) {
  const [y, m, d] = s.split("-").map(Number);
  return { __class__: "date", year: y, month: m, day: d };
}

const idOf = (v: unknown) => (typeof v === "number" ? v : Array.isArray(v) ? v[0] : null);

const MODEL_MAP: Record<string, string> = {
  menstrual: "gnuhealth.patient.menstrual_history",
  mammography: "gnuhealth.patient.mammography_history",
  pap: "gnuhealth.patient.pap_history",
  colposcopy: "gnuhealth.patient.colposcopy_history",
};

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized session" }, { status: 401 });
  }
  if (!hasModuleAccess(session.role, "womens_health")) {
    return NextResponse.json({ error: "Your role does not have permission for this module." }, { status: 403 });
  }

  const context = { company: session.companyId };

  try {
    const allPatients = await TrytonClient.execute<any[]>(
      session.username, session.userId, session.sessionToken,
      "gnuhealth.patient", "search_read",
      [[], 0, 500, null, ["id", "rec_name", "puid", "party"]],
      context, session.database
    );
    const partyIds = [...new Set(allPatients.map((p) => idOf(p.party)).filter(Boolean))];
    let femalePatients: { id: number; name: string; puid: string }[] = [];
    if (partyIds.length > 0) {
      const parties = await TrytonClient.execute<any[]>(
        session.username, session.userId, session.sessionToken,
        "party.party", "search_read",
        [[["id", "in", partyIds], ["gender", "=", "f"]], 0, partyIds.length, null, ["id"]],
        context, session.database
      );
      const femalePartyIds = new Set(parties.map((p) => p.id));
      femalePatients = allPatients.filter((p) => femalePartyIds.has(idOf(p.party))).map((p) => ({ id: p.id, name: p.rec_name, puid: p.puid }));
    }

    // These 4 screening-history models are gated in Tryton to "Health Doctor"
    // / "Health Gynecology and Obstetrics Administration" groups - fetch each
    // independently so a role without that group still gets a valid (empty)
    // response instead of a failed request.
    const safeFetch = async (model: string, extraFields: string[]): Promise<any[]> => {
      try {
        return await TrytonClient.execute<any[]>(
          session.username, session.userId, session.sessionToken, model, "search_read",
          [[], 0, 200, [["evaluation_date", "DESC"]], ["id", "patient", "evaluation_date", ...extraFields]],
          context, session.database
        );
      } catch {
        return [];
      }
    };

    const [menstrual, mammography, pap, colposcopy] = await Promise.all([
      safeFetch(MODEL_MAP.menstrual, ["lmp", "lmp_length", "is_regular", "dysmenorrhea", "frequency", "volume"]),
      safeFetch(MODEL_MAP.mammography, ["last_mammography", "result", "comments"]),
      safeFetch(MODEL_MAP.pap, ["last_pap", "result", "comments"]),
      safeFetch(MODEL_MAP.colposcopy, ["last_colposcopy", "result", "comments"]),
    ]);

    const allIds = [...menstrual, ...mammography, ...pap, ...colposcopy].map((r) => idOf(r.patient)).filter(Boolean);
    const patientIds = [...new Set(allIds)];
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
    const nameOf = (pid: number | null) => (pid ? patientsMap[pid]?.rec_name || null : null);

    return NextResponse.json({
      success: true,
      femalePatients,
      menstrual: menstrual.map((r) => ({ id: r.id, patientId: idOf(r.patient), patientName: nameOf(idOf(r.patient)), date: formatTrytonDate(r.evaluation_date), lmp: formatTrytonDate(r.lmp), lmpLength: r.lmp_length ?? null, isRegular: !!r.is_regular, dysmenorrhea: !!r.dysmenorrhea, frequency: r.frequency || null, volume: r.volume || null })),
      mammography: mammography.map((r) => ({ id: r.id, patientId: idOf(r.patient), patientName: nameOf(idOf(r.patient)), date: formatTrytonDate(r.evaluation_date), lastMammography: formatTrytonDate(r.last_mammography), result: r.result || null, comments: r.comments || null })),
      pap: pap.map((r) => ({ id: r.id, patientId: idOf(r.patient), patientName: nameOf(idOf(r.patient)), date: formatTrytonDate(r.evaluation_date), lastPap: formatTrytonDate(r.last_pap), result: r.result || null, comments: r.comments || null })),
      colposcopy: colposcopy.map((r) => ({ id: r.id, patientId: idOf(r.patient), patientName: nameOf(idOf(r.patient)), date: formatTrytonDate(r.evaluation_date), lastColposcopy: formatTrytonDate(r.last_colposcopy), result: r.result || null, comments: r.comments || null })),
    });
  } catch (err: unknown) {
    const status = (err as any)?.status || 500;
    const message = err instanceof Error ? err.message : "Failed to load women's health records";
    return NextResponse.json({ error: message }, { status });
  }
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!hasModuleAccess(session.role, "womens_health")) {
    return NextResponse.json({ error: "Your role does not have permission for this module." }, { status: 403 });
  }
  try {
    const body = await req.json();
    const screeningType = body.type as string;
    const model = MODEL_MAP[screeningType];
    if (!model) {
      return NextResponse.json({ error: `Unsupported screening type: ${screeningType}` }, { status: 400 });
    }
    const patientId = Number(body.patientId);
    if (!Number.isSafeInteger(patientId) || patientId <= 0) {
      return NextResponse.json({ error: "A valid patient is required." }, { status: 400 });
    }
    const context = { company: session.companyId };
    const healthprofId = await ClinicalLookupService.resolveClinician(session, body.healthprofId);

    const today = new Date();
    const todayObj = { __class__: "date", year: today.getFullYear(), month: today.getMonth() + 1, day: today.getDate() };

    let payload: Record<string, unknown>;

    if (screeningType === "menstrual") {
      if (typeof body.lmp !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(body.lmp)) {
        return NextResponse.json({ error: "Last Menstrual Period (LMP) is required." }, { status: 400 });
      }
      const lmpLength = Number(body.lmpLength);
      if (!Number.isSafeInteger(lmpLength) || lmpLength <= 0) {
        return NextResponse.json({ error: "Cycle length is required." }, { status: 400 });
      }
      payload = {
        patient: patientId, evaluation_date: todayObj, lmp: toDateObj(body.lmp), lmp_length: lmpLength,
        is_regular: !!body.isRegular, dysmenorrhea: !!body.dysmenorrhea,
        frequency: body.frequency || "eumenorrhea", volume: body.volume || "normal",
        healthprof: healthprofId || undefined,
      };
    } else {
      const VALID_RESULTS: Record<string, string[]> = {
        mammography: ["normal", "abnormal"],
        colposcopy: ["normal", "abnormal"],
        pap: ["negative", "c1", "c2", "g1", "c3", "c4", "g4"],
      };
      if (body.result && !VALID_RESULTS[screeningType].includes(body.result)) {
        return NextResponse.json({ error: `Result must be one of: ${VALID_RESULTS[screeningType].join(", ")}.` }, { status: 400 });
      }
      const lastDateField = screeningType === "mammography" ? "last_mammography" : screeningType === "pap" ? "last_pap" : "last_colposcopy";
      payload = {
        patient: patientId, evaluation_date: todayObj,
        [lastDateField]: typeof body.lastDate === "string" && /^\d{4}-\d{2}-\d{2}$/.test(body.lastDate) ? toDateObj(body.lastDate) : undefined,
        result: body.result || undefined,
        comments: typeof body.comments === "string" && body.comments.trim() ? body.comments.trim() : undefined,
        healthprof: healthprofId || undefined,
      };
    }

    const created = await TrytonClient.execute<number[]>(
      session.username, session.userId, session.sessionToken,
      model, "create",
      [[payload]],
      context, session.database
    );
    return NextResponse.json({ success: true, id: created[0], message: "Screening record saved." });
  } catch (err: unknown) {
    const status = (err as any)?.status || 500;
    const message = err instanceof Error ? err.message : "Failed to save screening record";
    return NextResponse.json({ error: message }, { status });
  }
}
