import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth-session";
import { TrytonClient } from "@/lib/tryton-client";

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized session" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q") || "";
  const catalog = searchParams.get("catalog");

  try {
    const catalogModels: Record<string, { model: string; fields: string[] }> = {
      routes: { model: "gnuhealth.drug.route", fields: ["id", "rec_name"] },
      doseUnits: { model: "gnuhealth.dose.unit", fields: ["id", "rec_name"] },
      forms: { model: "gnuhealth.drug.form", fields: ["id", "rec_name"] },
    };
    if (catalog) {
      const definition = catalogModels[catalog];
      if (!definition) return NextResponse.json({ error: "Unsupported medication catalog." }, { status: 400 });
      const items = await TrytonClient.execute<Array<{ id: number; rec_name: string }>>(
        session.username,
        session.userId,
        session.sessionToken,
        definition.model,
        "search_read",
        [[ ["id", ">", 0] ], 0, 200, [["rec_name", "ASC"]], definition.fields],
        { company: session.companyId },
        session.database
      );
      return NextResponse.json({ success: true, catalog, items: items.map((item) => ({ id: item.id, name: item.rec_name })) });
    }

    let domain: unknown[] = [];
    if (q) {
      domain = [["rec_name", "ilike", `%${q}%`]];
    }
    domain.push(["active", "=", true]);

    const meds = await TrytonClient.execute<any[]>(
      session.username,
      session.userId,
      session.sessionToken,
      "gnuhealth.medicament",
      "search_read",
      [domain, 0, 30, [["rec_name", "ASC"]], ["id", "rec_name", "active_component", "strength", "unit", "route", "form", "pregnancy_warning"]],
      { company: session.companyId },
      session.database
    );

    return NextResponse.json({
      success: true,
      medicaments: meds.map((m) => ({
        id: m.id,
        name: m.rec_name,
        genericName: m.active_component || m.rec_name,
        strength: m.strength ?? null,
        doseUnitId: Array.isArray(m.unit) ? m.unit[0] : m.unit || null,
        doseUnit: Array.isArray(m.unit) ? m.unit[1] : null,
        routeId: Array.isArray(m.route) ? m.route[0] : m.route || null,
        route: Array.isArray(m.route) ? m.route[1] : null,
        formId: Array.isArray(m.form) ? m.form[0] : m.form || null,
        form: Array.isArray(m.form) ? m.form[1] : null,
        pregnancyWarning: m.pregnancy_warning === true,
      })),
    });
  } catch (err: unknown) {
    const status = (err as any)?.status || 500;
    const message = err instanceof Error ? err.message : "Failed to search medicaments";
    return NextResponse.json({ error: message }, { status });
  }
}
