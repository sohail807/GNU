import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth-session";
import { TrytonClient } from "@/lib/tryton-client";
import { hasModuleAccess } from "@/lib/access-control";

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized session" }, { status: 401 });
  }

  if (
    !hasModuleAccess(session.role, "pharmacy") &&
    !hasModuleAccess(session.role, "physician") &&
    !hasModuleAccess(session.role, "admin")
  ) {
    return NextResponse.json({ error: "Your role does not have permission for this module." }, { status: 403 });
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
        // rec_name isn't a sortable column on these models either -- see the note below. Let
        // each model apply its own default _order instead.
        [[ ["id", ">", 0] ], 0, 200, null, definition.fields],
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
      // rec_name is a computed field on this model, not a real column -- ordering by it makes
      // the underlying SQL query fail with an opaque, empty Tryton error. `null` lets Tryton
      // apply the model's own default _order instead of a column that can't be sorted on.
      [domain, 0, 30, null, ["id", "rec_name", "active_component", "strength", "unit", "route", "form", "pregnancy_warning"]],
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
