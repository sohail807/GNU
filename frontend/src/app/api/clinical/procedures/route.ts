import { NextRequest, NextResponse } from "next/server";
import { errorResponse, guard, rpc, Row } from "@/lib/ops-api";

// Procedure catalogue (CPT-style codes with descriptions) for the surgery booking form, readable by the clinicians who
// book surgeries.

export async function GET(req: NextRequest) {
  const g = await guard(["surgery", "physician"]);
  if ("response" in g) return g.response;
  const { session } = g;
  try {
    const q = (new URL(req.url).searchParams.get("q") || "").trim().slice(0, 60);
    const domain = q ? ["OR", ["name", "ilike", `%${q}%`], ["description", "ilike", `%${q}%`]] : [];
    const rows = await rpc<Row[]>(session, "gnuhealth.procedure", "search_read", [domain, 0, 100, [["description", "ASC"]], ["id", "name", "description"]]);
    return NextResponse.json({ success: true, procedures: rows.map((r) => ({ id: r.id as number, code: r.name as string, description: (r.description as string) || "" })) });
  } catch (err) {
    return errorResponse(err, "Failed to load the procedure catalogue");
  }
}
