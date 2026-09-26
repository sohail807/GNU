import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth-session";
import { TrytonClient } from "@/lib/tryton-client";
import { hasModuleAccess } from "@/lib/access-control";

function formatTrytonDate(v: any): string | null {
  if (!v || typeof v !== "object" || !v.year) return null;
  return `${v.year}-${String(v.month).padStart(2, "0")}-${String(v.day).padStart(2, "0")}`;
}

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized session" }, { status: 401 });
  }
  if (!hasModuleAccess(session.role, "insurance")) {
    return NextResponse.json({ error: "Your role does not have permission for this module." }, { status: 403 });
  }

  try {
    const rawIns = await TrytonClient.execute<any[]>(
      session.username, session.userId, session.sessionToken,
      "gnuhealth.insurance", "search_read",
      [[], 0, 100, [["id", "DESC"]], ["id", "number", "party", "company", "plan_id", "insurance_type", "category", "member_since", "member_exp", "notes"]],
      { company: session.companyId }, session.database
    );

    const idOf = (v: unknown) => (typeof v === "number" ? v : Array.isArray(v) ? v[0] : null);
    const partyIds = [...new Set(rawIns.map((r) => idOf(r.party)).filter(Boolean))];
    const companyIds = [...new Set(rawIns.map((r) => idOf(r.company)).filter(Boolean))];

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
    const [partiesMap, companiesMap] = await Promise.all([
      lookup("party.party", partyIds, ["id", "name"]),
      lookup("party.party", companyIds, ["id", "name"]),
    ]);

    const insurances = rawIns.map((r) => {
      const pid = idOf(r.party);
      const cid = idOf(r.company);
      return {
        id: r.id,
        number: r.number,
        partyId: pid,
        partyName: partiesMap[pid as number]?.name || null,
        companyId: cid,
        companyName: companiesMap[cid as number]?.name || null,
        insuranceType: r.insurance_type || null,
        category: r.category || null,
        memberSince: formatTrytonDate(r.member_since),
        memberExp: formatTrytonDate(r.member_exp),
        notes: r.notes || null,
      };
    });

    // Insurance-company parties and enrollable patients, loaded live so the
    // enrollment form can only ever reference a party that actually exists.
    const [companies, patients] = await Promise.all([
      TrytonClient.execute<any[]>(
        session.username, session.userId, session.sessionToken,
        "party.party", "search_read",
        [[["is_insurance_company", "=", true]], 0, 100, null, ["id", "name"]],
        { company: session.companyId }, session.database
      ).catch(() => []),
      TrytonClient.execute<any[]>(
        session.username, session.userId, session.sessionToken,
        "gnuhealth.patient", "search_read",
        [[], 0, 200, null, ["id", "party", "puid"]],
        { company: session.companyId }, session.database
      ).catch(() => []),
    ]);

    return NextResponse.json({
      success: true,
      insurances,
      insuranceCompanies: companies.map((c) => ({ id: c.id, name: c.name })),
      enrollablePatients: patients.map((p) => ({
        patientId: p.id,
        partyId: idOf(p.party),
        puid: p.puid || null,
      })),
    });
  } catch (err: unknown) {
    const status = (err as any)?.status || 500;
    const message = err instanceof Error ? err.message : "Failed to load insurance records";
    return NextResponse.json({ error: message }, { status });
  }
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized session" }, { status: 401 });
  }
  if (!hasModuleAccess(session.role, "insurance")) {
    return NextResponse.json({ error: "Your role does not have permission for this module." }, { status: 403 });
  }

  try {
    const body = await req.json();
    const partyId = Number(body.partyId);
    const companyId = Number(body.companyId);
    const number = typeof body.number === "string" ? body.number.trim() : "";
    if (!Number.isSafeInteger(partyId) || partyId <= 0 || !Number.isSafeInteger(companyId) || companyId <= 0 || !number) {
      return NextResponse.json({ error: "A valid patient, insurance company, and policy number are required." }, { status: 400 });
    }

    const VALID_TYPES = ["state", "labour_union", "private"];
    if (body.insuranceType !== undefined && body.insuranceType !== "" && !VALID_TYPES.includes(body.insuranceType)) {
      return NextResponse.json(
        { error: `Invalid insurance type. Must be one of: ${VALID_TYPES.join(", ")}.` },
        { status: 400 }
      );
    }

    const payload: Record<string, unknown> = {
      party: partyId,
      company: companyId,
      number,
      insurance_type: body.insuranceType || undefined,
      notes: typeof body.notes === "string" && body.notes.trim() ? body.notes.trim() : undefined,
    };

    const created = await TrytonClient.execute<number[]>(
      session.username, session.userId, session.sessionToken,
      "gnuhealth.insurance", "create",
      [[payload]],
      { company: session.companyId }, session.database
    );

    return NextResponse.json({ success: true, insuranceId: created[0], message: `Insurance policy ${number} enrolled.` });
  } catch (err: unknown) {
    const status = (err as any)?.status || 500;
    const message = err instanceof Error ? err.message : "Failed to enroll insurance policy";
    return NextResponse.json({ error: message }, { status });
  }
}
