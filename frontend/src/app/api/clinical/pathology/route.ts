import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth-session";
import { TrytonClient } from "@/lib/tryton-client";
import { hasModuleAccess } from "@/lib/access-control";

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized session" }, { status: 401 });
  }

  // ICD-10 pathology codes are reference data used across several clinical
  // workflows (lab diagnoses, physician SOAP notes, inpatient admission/
  // discharge diagnoses) - gate on any of those modules, not just laboratory.
  const canLookup =
    hasModuleAccess(session.role, "laboratory") ||
    hasModuleAccess(session.role, "physician") ||
    hasModuleAccess(session.role, "inpatient") ||
    hasModuleAccess(session.role, "nursing");
  if (!canLookup) {
    return NextResponse.json({ error: "Your role does not have permission for this module." }, { status: 403 });
  }
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q") || "";

  try {
    let domain: unknown[] = [];
    if (q) {
      domain = [
        "OR",
        [["code", "ilike", `%${q}%`]],
        [["name", "ilike", `%${q}%`]],
      ];
    }

    const paths = await TrytonClient.execute<any[]>(
      session.username,
      session.userId,
      session.sessionToken,
      "gnuhealth.pathology",
      "search_read",
      [domain, 0, 30, [["code", "ASC"]], ["id", "code", "name"]]
    ,
      { company: session.companyId },
      session.database
    );

    return NextResponse.json({
      success: true,
      pathologies: paths.map((p) => ({
        id: p.id,
        code: p.code,
        name: p.name,
      })),
    });
  } catch (err: unknown) {
    const status = (err as any)?.status || 500;
    const message = err instanceof Error ? err.message : "Failed to search pathologies";
    return NextResponse.json({ error: message }, { status });
  }
}
