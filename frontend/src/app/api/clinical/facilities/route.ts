import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth-session";
import { TrytonClient } from "@/lib/tryton-client";
import { hasModuleAccess } from "@/lib/access-control";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized session" }, { status: 401 });
  }
  if (!hasModuleAccess(session.role, "facilities")) {
    return NextResponse.json({ error: "Your role does not have permission for this module." }, { status: 403 });
  }

  try {
    const context = { company: session.companyId };
    const wards = await TrytonClient.execute<any[]>(
      session.username, session.userId, session.sessionToken,
      "gnuhealth.hospital.ward", "search_read",
      [[], 0, 100, [["name", "ASC"]], ["id", "name", "floor", "number_of_beds", "gender", "private", "bio_hazard", "extra_info"]],
      context, session.database
    );

    let beds: any[] = [];
    try {
      beds = await TrytonClient.execute<any[]>(
        session.username, session.userId, session.sessionToken,
        "gnuhealth.hospital.bed", "search_read",
        [[], 0, 200, null, ["id", "ward", "rec_name", "bed_type", "state"]],
        context, session.database
      );
    } catch {
      // Leave beds empty
    }
    const idOf = (v: unknown) => (typeof v === "number" ? v : Array.isArray(v) ? v[0] : null);
    const bedCountByWard: Record<number, number> = {};
    for (const b of beds) {
      const wid = idOf(b.ward);
      if (wid) bedCountByWard[wid] = (bedCountByWard[wid] || 0) + 1;
    }

    return NextResponse.json({
      success: true,
      wards: wards.map((w) => ({
        id: w.id,
        name: w.name,
        floor: w.floor ?? null,
        plannedBeds: w.number_of_beds ?? null,
        provisionedBeds: bedCountByWard[w.id] || 0,
        gender: w.gender || null,
        isPrivate: !!w.private,
        bioHazard: !!w.bio_hazard,
        extraInfo: w.extra_info || null,
      })),
      beds: beds.map((b) => ({
        id: b.id,
        name: b.rec_name || `Bed ${b.id}`,
        wardId: idOf(b.ward),
        bedType: b.bed_type || null,
        state: b.state || null,
      })),
    });
  } catch (err: unknown) {
    const status = (err as any)?.status || 500;
    const message = err instanceof Error ? err.message : "Failed to load ward directory";
    return NextResponse.json({ error: message }, { status });
  }
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized session" }, { status: 401 });
  }
  if (!hasModuleAccess(session.role, "facilities")) {
    return NextResponse.json({ error: "Your role does not have permission for this module." }, { status: 403 });
  }

  try {
    const body = await req.json();
    const context = { company: session.companyId };
    const action = body.action || "create_ward";

    // Every ward/bed belongs to an institution - resolve the tenant's own
    // institution record live rather than hardcoding an ID.
    const institutions = await TrytonClient.execute<any[]>(
      session.username, session.userId, session.sessionToken,
      "gnuhealth.institution", "search_read",
      [[], 0, 1, null, ["id"]],
      context, session.database
    );
    if (!institutions[0]) {
      return NextResponse.json({ error: "No hospital institution is configured for this tenant." }, { status: 400 });
    }
    const institutionId = institutions[0].id;

    if (action === "create_ward") {
      const name = typeof body.name === "string" ? body.name.trim() : "";
      const gender = body.gender;
      const VALID_GENDERS = ["men", "women", "unisex"];
      if (!name) {
        return NextResponse.json({ error: "A ward name is required." }, { status: 400 });
      }
      if (!VALID_GENDERS.includes(gender)) {
        return NextResponse.json({ error: `Ward gender must be one of: ${VALID_GENDERS.join(", ")}.` }, { status: 400 });
      }
      const plannedBeds = body.plannedBeds !== undefined && body.plannedBeds !== "" ? Number(body.plannedBeds) : undefined;
      if (plannedBeds !== undefined && (!Number.isSafeInteger(plannedBeds) || plannedBeds < 0)) {
        return NextResponse.json({ error: "Planned bed count must be a non-negative whole number." }, { status: 400 });
      }
      const floor = body.floor !== undefined && body.floor !== "" ? Number(body.floor) : undefined;

      const payload: Record<string, unknown> = {
        name,
        gender,
        institution: institutionId,
        number_of_beds: plannedBeds,
        floor,
        private: !!body.isPrivate,
        extra_info: typeof body.extraInfo === "string" && body.extraInfo.trim() ? body.extraInfo.trim() : undefined,
      };

      const created = await TrytonClient.execute<number[]>(
        session.username, session.userId, session.sessionToken,
        "gnuhealth.hospital.ward", "create",
        [[payload]],
        context, session.database
      );

      return NextResponse.json({ success: true, wardId: created[0], message: `Ward "${name}" registered.` });
    }

    if (action === "add_bed") {
      const wardId = Number(body.wardId);
      const bedName = typeof body.bedName === "string" ? body.bedName.trim() : "";
      const VALID_BED_TYPES = ["gatch", "electric", "stretcher", "low", "low_air_loss", "circo_electric", "clinitron"];
      const bedType = typeof body.bedType === "string" && body.bedType.trim() ? body.bedType.trim() : "gatch";
      if (!Number.isSafeInteger(wardId) || wardId <= 0 || !bedName) {
        return NextResponse.json({ error: "A ward and bed name are required." }, { status: 400 });
      }
      if (!VALID_BED_TYPES.includes(bedType)) {
        return NextResponse.json({ error: `Bed type must be one of: ${VALID_BED_TYPES.join(", ")}.` }, { status: 400 });
      }

      // Beds are billable line items in GNU Health - each needs its own
      // product-catalog record (never reuse an existing product's identity).
      const uoms = await TrytonClient.execute<any[]>(
        session.username, session.userId, session.sessionToken,
        "product.uom", "search_read",
        [[["name", "=", "Unit"]], 0, 1, null, ["id"]],
        context, session.database
      );
      if (!uoms[0]) {
        return NextResponse.json({ error: "No base unit of measure ('Unit') is configured for this tenant." }, { status: 400 });
      }

      const template = await TrytonClient.execute<number[]>(
        session.username, session.userId, session.sessionToken,
        "product.template", "create",
        [[{ name: bedName, type: "service", default_uom: uoms[0].id, cost_price_method: "fixed", list_price: body.dailyRate || "0.00", products: [["create", [{ is_bed: true }]]] }]],
        context, session.database
      );
      const productRows = await TrytonClient.execute<any[]>(
        session.username, session.userId, session.sessionToken,
        "product.template", "read",
        [[template[0]], ["products"]],
        context, session.database
      );
      const productId = productRows[0]?.products?.[0];
      if (!productId) {
        return NextResponse.json({ error: "Bed product could not be resolved after creation." }, { status: 502 });
      }

      const bed = await TrytonClient.execute<number[]>(
        session.username, session.userId, session.sessionToken,
        "gnuhealth.hospital.bed", "create",
        [[{ product: productId, ward: wardId, institution: institutionId, bed_type: bedType, state: "free" }]],
        context, session.database
      );

      return NextResponse.json({ success: true, bedId: bed[0], message: `Bed "${bedName}" provisioned.` });
    }

    return NextResponse.json({ error: `Unsupported facilities action: ${action}` }, { status: 400 });
  } catch (err: unknown) {
    const status = (err as any)?.status || 500;
    const message = err instanceof Error ? err.message : "Failed to process facility action";
    return NextResponse.json({ error: message }, { status });
  }
}
