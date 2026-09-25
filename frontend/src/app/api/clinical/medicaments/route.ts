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

  try {
    let domain: unknown[] = [];
    if (q) {
      domain = [["rec_name", "ilike", `%${q}%`]];
    }

    const meds = await TrytonClient.execute<any[]>(
      session.username,
      session.userId,
      session.sessionToken,
      "gnuhealth.medicament",
      "search_read",
      [domain, 0, 30, [["rec_name", "ASC"]], ["id", "rec_name"]]
    );

    return NextResponse.json({
      success: true,
      medicaments: meds.map((m) => ({
        id: m.id,
        name: m.rec_name,
        genericName: m.rec_name,
      })),
    });
  } catch (err: unknown) {
    const status = (err as any)?.status || 500;
    const message = err instanceof Error ? err.message : "Failed to search medicaments";
    return NextResponse.json({ error: message }, { status });
  }
}
