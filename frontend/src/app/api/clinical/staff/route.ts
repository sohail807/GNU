import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth-session";
import { TrytonClient } from "@/lib/tryton-client";
import { hasModuleAccess } from "@/lib/access-control";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized session" }, { status: 401 });
  }
  if (!hasModuleAccess(session.role, "staff_directory")) {
    return NextResponse.json({ error: "Your role does not have permission for this module." }, { status: 403 });
  }

  try {
    const context = { company: session.companyId };
    const hps = await TrytonClient.execute<any[]>(
      session.username, session.userId, session.sessionToken,
      "gnuhealth.healthprofessional", "search_read",
      [[], 0, 200, [["id", "ASC"]], ["id", "rec_name", "code", "institution"]],
      context, session.database
    );

    const hpIds = hps.map((h) => h.id);
    let assignments: any[] = [];
    if (hpIds.length > 0) {
      assignments = await TrytonClient.execute<any[]>(
        session.username, session.userId, session.sessionToken,
        "gnuhealth.hp_specialty", "search_read",
        [[["healthprof", "in", hpIds]], 0, 500, null, ["id", "healthprof", "specialty", "mainsp"]],
        context, session.database
      );
    }

    const idOf = (v: unknown) => (typeof v === "number" ? v : Array.isArray(v) ? v[0] : null);
    const specialtyIds = [...new Set(assignments.map((a) => idOf(a.specialty)).filter(Boolean))];
    let specialtiesMap: Record<number, any> = {};
    if (specialtyIds.length > 0) {
      const rows = await TrytonClient.execute<any[]>(
        session.username, session.userId, session.sessionToken,
        "gnuhealth.specialty", "search_read",
        [[["id", "in", specialtyIds]], 0, specialtyIds.length, null, ["id", "name"]],
        context, session.database
      );
      specialtiesMap = rows.reduce((acc, r) => { acc[r.id] = r; return acc; }, {} as Record<number, any>);
    }

    const staff = hps.map((h) => {
      const hpAssignments = assignments.filter((a) => idOf(a.healthprof) === h.id);
      return {
        id: h.id,
        name: h.rec_name,
        code: h.code || null,
        specialties: hpAssignments.map((a) => ({
          id: a.id,
          name: specialtiesMap[idOf(a.specialty) as number]?.name || null,
          isMain: !!a.mainsp,
        })),
      };
    });

    // Full specialty catalog, for the assignment form - loaded live, never hardcoded.
    const catalog = await TrytonClient.execute<any[]>(
      session.username, session.userId, session.sessionToken,
      "gnuhealth.specialty", "search_read",
      [[], 0, 300, [["name", "ASC"]], ["id", "name"]],
      context, session.database
    );

    return NextResponse.json({ success: true, staff, specialtyCatalog: catalog.map((c) => ({ id: c.id, name: c.name })) });
  } catch (err: unknown) {
    const status = (err as any)?.status || 500;
    const message = err instanceof Error ? err.message : "Failed to load staff directory";
    return NextResponse.json({ error: message }, { status });
  }
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized session" }, { status: 401 });
  }
  if (!hasModuleAccess(session.role, "staff_directory")) {
    return NextResponse.json({ error: "Your role does not have permission for this module." }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { action } = body;
    const context = { company: session.companyId };

    if (action === "add_specialty") {
      const healthprofId = Number(body.healthprofId);
      const specialtyId = Number(body.specialtyId);
      if (!Number.isSafeInteger(healthprofId) || healthprofId <= 0 || !Number.isSafeInteger(specialtyId) || specialtyId <= 0) {
        return NextResponse.json({ error: "A valid clinician and specialty are required." }, { status: 400 });
      }
      await TrytonClient.execute(
        session.username, session.userId, session.sessionToken,
        "gnuhealth.hp_specialty", "create",
        [[{ healthprof: healthprofId, specialty: specialtyId, mainsp: !!body.isMain }]],
        context, session.database
      );
      return NextResponse.json({ success: true, message: "Specialty assigned." });
    }

    if (action === "remove_specialty") {
      const assignmentId = Number(body.assignmentId);
      if (!Number.isSafeInteger(assignmentId) || assignmentId <= 0) {
        return NextResponse.json({ error: "A valid assignment ID is required." }, { status: 400 });
      }
      await TrytonClient.execute(
        session.username, session.userId, session.sessionToken,
        "gnuhealth.hp_specialty", "delete",
        [[assignmentId]],
        context, session.database
      );
      return NextResponse.json({ success: true, message: "Specialty removed." });
    }

    return NextResponse.json({ error: `Unsupported staff directory action: ${action}` }, { status: 400 });
  } catch (err: unknown) {
    const status = (err as any)?.status || 500;
    const message = err instanceof Error ? err.message : "Failed to update staff directory";
    return NextResponse.json({ error: message }, { status });
  }
}
