import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth-session";
import { TrytonClient } from "@/lib/tryton-client";
import { hasModuleAccess } from "@/lib/access-control";

function formatTrytonDateTime(v: any): string | null {
  if (!v || typeof v !== "object" || !v.year) return null;
  const datePart = `${v.year}-${String(v.month).padStart(2, "0")}-${String(v.day).padStart(2, "0")}`;
  if (typeof v.hour !== "number") return datePart;
  return `${datePart}T${String(v.hour).padStart(2, "0")}:${String(v.minute || 0).padStart(2, "0")}`;
}

const idOf = (v: unknown) => (typeof v === "number" ? v : Array.isArray(v) ? v[0] : null);

// All direct gnuhealth.patient lifestyle fields this module edits.
const LIFESTYLE_FIELDS = [
  "exercise", "exercise_minutes_day", "sleep_hours", "sleep_during_daytime",
  "number_of_meals", "vegetarian_type", "diet_belief", "eats_alone", "salt",
  "coffee", "coffee_cups", "soft_drinks", "diet", "diet_info",
  "smoking", "smoking_number", "ex_smoker", "second_hand_smoker", "age_start_smoking", "age_quit_smoking",
  "alcohol", "age_start_drinking", "age_quit_drinking", "ex_alcoholic",
  "alcohol_beer_number", "alcohol_wine_number", "alcohol_liquor_number",
  "drug_usage", "ex_drug_addict", "drug_iv", "age_start_drugs", "age_quit_drugs",
  "traffic_laws", "car_revision", "car_seat_belt", "car_child_safety", "home_safety",
  "motorcycle_rider", "helmet", "lifestyle_info",
  "sexual_preferences", "sexual_practices", "sexual_partners", "sexual_partners_number",
  "first_sexual_encounter", "anticonceptive", "sex_oral", "sex_anal",
  "prostitute", "sex_with_prostitutes", "sexuality_info",
];

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized session" }, { status: 401 });
  }
  if (!hasModuleAccess(session.role, "lifestyle")) {
    return NextResponse.json({ error: "Your role does not have permission for this module." }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const patientId = searchParams.get("patientId");
  const context = { company: session.companyId };

  try {
    const patients = await TrytonClient.execute<any[]>(
      session.username, session.userId, session.sessionToken,
      "gnuhealth.patient", "search_read",
      [[], 0, 500, null, ["id", "rec_name", "puid"]],
      context, session.database
    );

    const [vegetarianTypes, dietBeliefs, recreationalDrugCatalog] = await Promise.all([
      TrytonClient.execute<any[]>(session.username, session.userId, session.sessionToken, "gnuhealth.vegetarian_types", "search_read", [[], 0, 50, [["name", "ASC"]], ["id", "name"]], context, session.database),
      TrytonClient.execute<any[]>(session.username, session.userId, session.sessionToken, "gnuhealth.diet.belief", "search_read", [[], 0, 50, [["name", "ASC"]], ["id", "name"]], context, session.database),
      TrytonClient.execute<any[]>(session.username, session.userId, session.sessionToken, "gnuhealth.drugs_recreational", "search_read", [[], 0, 100, [["name", "ASC"]], ["id", "name", "category"]], context, session.database),
    ]);

    if (!patientId) {
      return NextResponse.json({
        success: true,
        patients: patients.map((p) => ({ id: p.id, name: p.rec_name, puid: p.puid })),
        vegetarianTypes, dietBeliefs, recreationalDrugCatalog,
      });
    }

    const pid = parseInt(patientId, 10);
    const patRecords = await TrytonClient.execute<any[]>(
      session.username, session.userId, session.sessionToken,
      "gnuhealth.patient", "read",
      [[pid], ["id", "rec_name", "puid", ...LIFESTYLE_FIELDS]],
      context, session.database
    );
    if (!patRecords[0]) {
      return NextResponse.json({ error: "Patient not found" }, { status: 404 });
    }
    const p = patRecords[0];

    // CAGE and recreational-drug records are gated in Tryton to "Health
    // Doctor" / "Health Lifestyle Administration" groups - a role without
    // that group (e.g. Administration) must still see the rest of the
    // lifestyle profile, so these are fetched independently rather than
    // failing the whole request.
    let cageRecords: any[] = [];
    let cageRestricted = false;
    try {
      cageRecords = await TrytonClient.execute<any[]>(
        session.username, session.userId, session.sessionToken,
        "gnuhealth.patient.cage", "search_read",
        [[["patient", "=", pid]], 0, 20, [["evaluation_date", "DESC"]], ["id", "evaluation_date", "cage_c", "cage_a", "cage_g", "cage_e", "cage_score"]],
        context, session.database
      );
    } catch {
      cageRestricted = true;
    }
    let drugRecords: any[] = [];
    let drugsRestricted = false;
    try {
      drugRecords = await TrytonClient.execute<any[]>(
        session.username, session.userId, session.sessionToken,
        "gnuhealth.patient.recreational_drugs", "search_read",
        [[["patient", "=", pid]], 0, 50, null, ["id", "recreational_drug"]],
        context, session.database
      );
    } catch {
      drugsRestricted = true;
    }

    const drugCatalogMap = recreationalDrugCatalog.reduce((acc, d) => { acc[d.id] = d; return acc; }, {} as Record<number, any>);

    return NextResponse.json({
      success: true,
      patients: patients.map((pp) => ({ id: pp.id, name: pp.rec_name, puid: pp.puid })),
      vegetarianTypes, dietBeliefs, recreationalDrugCatalog,
      profile: {
        id: p.id,
        patientName: p.rec_name,
        puid: p.puid,
        vegetarianType: idOf(p.vegetarian_type),
        dietBelief: idOf(p.diet_belief),
        ...Object.fromEntries(LIFESTYLE_FIELDS.filter((f) => f !== "vegetarian_type" && f !== "diet_belief").map((f) => [f, p[f] ?? null])),
      },
      cageHistory: cageRecords.map((c) => ({
        id: c.id,
        evaluationDate: formatTrytonDateTime(c.evaluation_date),
        cageC: !!c.cage_c, cageA: !!c.cage_a, cageG: !!c.cage_g, cageE: !!c.cage_e,
        score: c.cage_score ?? 0,
      })),
      recreationalDrugs: drugRecords.map((d) => {
        const drugId = idOf(d.recreational_drug);
        return { id: d.id, drugId, drugName: drugCatalogMap[drugId as number]?.name || null };
      }),
      cageRestricted,
      drugsRestricted,
    });
  } catch (err: unknown) {
    const status = (err as any)?.status || 500;
    const message = err instanceof Error ? err.message : "Failed to load lifestyle profile";
    return NextResponse.json({ error: message }, { status });
  }
}

export async function PATCH(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!hasModuleAccess(session.role, "lifestyle")) {
    return NextResponse.json({ error: "Your role does not have permission for this module." }, { status: 403 });
  }
  try {
    const body = await req.json();
    const patientId = Number(body.patientId);
    if (!Number.isSafeInteger(patientId) || patientId <= 0) {
      return NextResponse.json({ error: "A valid patient is required." }, { status: 400 });
    }

    const payload: Record<string, unknown> = {};
    for (const key of LIFESTYLE_FIELDS) {
      if (key in body) payload[key] = body[key] === "" ? null : body[key];
    }
    if ("vegetarianType" in body) payload.vegetarian_type = body.vegetarianType || null;
    if ("dietBelief" in body) payload.diet_belief = body.dietBelief || null;

    await TrytonClient.execute(
      session.username, session.userId, session.sessionToken,
      "gnuhealth.patient", "write",
      [[patientId], payload],
      { company: session.companyId }, session.database
    );

    return NextResponse.json({ success: true, message: "Lifestyle & social history updated." });
  } catch (err: unknown) {
    const status = (err as any)?.status || 500;
    const message = err instanceof Error ? err.message : "Failed to update lifestyle profile";
    return NextResponse.json({ error: message }, { status });
  }
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!hasModuleAccess(session.role, "lifestyle")) {
    return NextResponse.json({ error: "Your role does not have permission for this module." }, { status: 403 });
  }
  try {
    const body = await req.json();
    const action = body.action;
    const context = { company: session.companyId };

    if (action === "addCage") {
      const patientId = Number(body.patientId);
      if (!Number.isSafeInteger(patientId) || patientId <= 0) {
        return NextResponse.json({ error: "A valid patient is required." }, { status: 400 });
      }
      const cageC = !!body.cageC, cageA = !!body.cageA, cageG = !!body.cageG, cageE = !!body.cageE;
      const score = [cageC, cageA, cageG, cageE].filter(Boolean).length;
      const created = await TrytonClient.execute<number[]>(
        session.username, session.userId, session.sessionToken,
        "gnuhealth.patient.cage", "create",
        [[{
          patient: patientId,
          cage_c: cageC, cage_a: cageA, cage_g: cageG, cage_e: cageE,
          cage_score: score,
        }]],
        context, session.database
      );
      return NextResponse.json({ success: true, cageId: created[0], score, message: `CAGE assessment recorded (score: ${score}/4).` });
    }

    if (action === "addDrug") {
      const patientId = Number(body.patientId);
      const drugId = Number(body.drugId);
      if (!Number.isSafeInteger(patientId) || patientId <= 0 || !Number.isSafeInteger(drugId) || drugId <= 0) {
        return NextResponse.json({ error: "A patient and a recreational drug are required." }, { status: 400 });
      }
      const created = await TrytonClient.execute<number[]>(
        session.username, session.userId, session.sessionToken,
        "gnuhealth.patient.recreational_drugs", "create",
        [[{ patient: patientId, recreational_drug: drugId }]],
        context, session.database
      );
      return NextResponse.json({ success: true, id: created[0], message: "Recreational drug use recorded." });
    }

    if (action === "removeDrug") {
      const id = Number(body.id);
      if (!Number.isSafeInteger(id) || id <= 0) {
        return NextResponse.json({ error: "A valid record is required." }, { status: 400 });
      }
      await TrytonClient.execute(
        session.username, session.userId, session.sessionToken,
        "gnuhealth.patient.recreational_drugs", "delete",
        [[id]],
        context, session.database
      );
      return NextResponse.json({ success: true, message: "Record removed." });
    }

    return NextResponse.json({ error: `Unsupported lifestyle action: ${action}` }, { status: 400 });
  } catch (err: unknown) {
    const status = (err as any)?.status || 500;
    const message = err instanceof Error ? err.message : "Failed to process lifestyle record";
    return NextResponse.json({ error: message }, { status });
  }
}
