import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth-session";
import { TrytonClient } from "@/lib/tryton-client";
import { hasModuleAccess } from "@/lib/access-control";

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized session" }, { status: 401 });
  }
  if (!hasModuleAccess(session.role, "family")) {
    return NextResponse.json({ error: "Your role does not have permission for this module." }, { status: 403 });
  }

  try {
    const families = await TrytonClient.execute<any[]>(
      session.username, session.userId, session.sessionToken,
      "gnuhealth.family", "search_read",
      [[], 0, 50, [["name", "ASC"]], ["id", "name", "info"]],
      { company: session.companyId }, session.database
    );
    const familyIds = families.map((f) => f.id);

    let members: any[] = [];
    if (familyIds.length > 0) {
      members = await TrytonClient.execute<any[]>(
        session.username, session.userId, session.sessionToken,
        "gnuhealth.family_member", "search_read",
        [[["family", "in", familyIds]], 0, 500, null, ["id", "family", "party", "role"]],
        { company: session.companyId }, session.database
      );
    }

    const idOf = (v: unknown) => (typeof v === "number" ? v : Array.isArray(v) ? v[0] : null);
    const partyIds = [...new Set(members.map((m) => idOf(m.party)).filter(Boolean))];
    let partiesMap: Record<number, any> = {};
    if (partyIds.length > 0) {
      try {
        const parties = await TrytonClient.execute<any[]>(
          session.username, session.userId, session.sessionToken,
          "party.party", "search_read",
          [[["id", "in", partyIds]], 0, partyIds.length, null, ["id", "name", "ref"]],
          { company: session.companyId }, session.database
        );
        partiesMap = parties.reduce((acc, p) => { acc[p.id] = p; return acc; }, {} as Record<number, any>);
      } catch {
        // Fallback
      }
    }

    const familiesOut = families.map((f) => ({
      id: f.id,
      name: f.name,
      info: f.info || null,
      members: members
        .filter((m) => idOf(m.family) === f.id)
        .map((m) => {
          const pid = idOf(m.party);
          return {
            id: m.id,
            partyId: pid,
            partyName: partiesMap[pid as number]?.name || null,
            partyRef: partiesMap[pid as number]?.ref || null,
            role: m.role || null,
          };
        }),
    }));

    return NextResponse.json({ success: true, families: familiesOut });
  } catch (err: unknown) {
    const status = (err as any)?.status || 500;
    const message = err instanceof Error ? err.message : "Failed to load family registry";
    return NextResponse.json({ error: message }, { status });
  }
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized session" }, { status: 401 });
  }
  if (!hasModuleAccess(session.role, "family")) {
    return NextResponse.json({ error: "Your role does not have permission for this module." }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { action } = body;
    const context = { company: session.companyId };

    if (action === "create_family") {
      const name = typeof body.name === "string" ? body.name.trim() : "";
      if (!name) {
        return NextResponse.json({ error: "A household/family name is required." }, { status: 400 });
      }
      const info = typeof body.info === "string" ? body.info.trim() : undefined;
      const created = await TrytonClient.execute<number[]>(
        session.username, session.userId, session.sessionToken,
        "gnuhealth.family", "create",
        [[{ name, info: info || undefined }]],
        context, session.database
      );
      return NextResponse.json({ success: true, familyId: created[0], message: `Household "${name}" registered.` });
    }

    if (action === "add_member") {
      const familyId = Number(body.familyId);
      const partyId = Number(body.partyId);
      if (!Number.isSafeInteger(familyId) || familyId <= 0 || !Number.isSafeInteger(partyId) || partyId <= 0) {
        return NextResponse.json({ error: "A valid family and patient/party are required." }, { status: 400 });
      }
      const role = typeof body.role === "string" ? body.role.trim() : undefined;
      await TrytonClient.execute(
        session.username, session.userId, session.sessionToken,
        "gnuhealth.family_member", "create",
        [[{ family: familyId, party: partyId, role: role || undefined }]],
        context, session.database
      );
      return NextResponse.json({ success: true, message: "Family member added." });
    }

    if (action === "remove_member") {
      const memberId = Number(body.memberId);
      if (!Number.isSafeInteger(memberId) || memberId <= 0) {
        return NextResponse.json({ error: "A valid family member ID is required." }, { status: 400 });
      }
      await TrytonClient.execute(
        session.username, session.userId, session.sessionToken,
        "gnuhealth.family_member", "delete",
        [[memberId]],
        context, session.database
      );
      return NextResponse.json({ success: true, message: "Family member removed." });
    }

    return NextResponse.json({ error: `Unsupported family action: ${action}` }, { status: 400 });
  } catch (err: unknown) {
    const status = (err as any)?.status || 500;
    const message = err instanceof Error ? err.message : "Failed to process family registry action";
    return NextResponse.json({ error: message }, { status });
  }
}
