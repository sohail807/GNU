import { NextRequest, NextResponse } from "next/server";
import { requestHost, resolveTenantFromHost } from "@/lib/tenant";

// The tenant registry lib/tenant.ts reads from now lives in a runtime-writable file (fs),
// which isn't available in the default Edge middleware runtime -- this opts into the
// Node.js runtime so that read works.
export const runtime = "nodejs";

// Resolves the tenant from the request's Host header (e.g. central.isthealth.com) once
// APP_BASE_DOMAIN is configured, so each hospital's staff reach their own subdomain with no
// manual tenant picker. Falls back to unset (manual selection on /login) when the host isn't
// a recognized tenant subdomain — this keeps plain IP / staging access working unchanged
// until the domain is live.
const BODY_METHODS = new Set(["POST", "PUT", "PATCH"]);
const MAX_JSON_CHECK_BYTES = 1_000_000;

export async function middleware(req: NextRequest) {
  // A request body that is not valid JSON used to reach the route and come back as a 500 with the parser's own wording.
  // Refuse it once, here, with a plain 400 for every API route.
  if (BODY_METHODS.has(req.method) && req.nextUrl.pathname.startsWith("/api/") && (req.headers.get("content-type") || "").includes("json")) {
    const declared = Number(req.headers.get("content-length") || 0);
    if (declared <= MAX_JSON_CHECK_BYTES) {
      const text = await req.clone().text();
      if (text.trim()) {
        try { JSON.parse(text); } catch {
          return NextResponse.json({ error: "The request was not valid JSON." }, { status: 400 });
        }
      }
    }
  }

  const tenant = resolveTenantFromHost(requestHost(req.headers));

  // Forward x-tenant-id on the request itself (not just the response) so downstream route
  // handlers like /api/auth/login, which read req.headers.get("x-tenant-id"), see it.
  const requestHeaders = new Headers(req.headers);
  if (tenant) {
    requestHeaders.set("x-tenant-id", tenant.id);
  } else {
    requestHeaders.delete("x-tenant-id");
  }

  const res = NextResponse.next({ request: { headers: requestHeaders } });

  if (tenant) {
    // Non-httpOnly: the client login page reads this to skip the tenant picker.
    res.cookies.set("resolved_tenant_id", tenant.id, {
      path: "/",
      sameSite: "lax",
      secure: req.nextUrl.protocol === "https:",
    });
  } else {
    res.cookies.delete("resolved_tenant_id");
  }

  return res;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
