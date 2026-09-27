import { NextRequest, NextResponse } from "next/server";
import { resolveTenantFromHost } from "@/lib/tenant";

// Resolves the tenant from the request's Host header (e.g. central.isthealth.com) once
// APP_BASE_DOMAIN is configured, so each hospital's staff reach their own subdomain with no
// manual tenant picker. Falls back to unset (manual selection on /login) when the host isn't
// a recognized tenant subdomain — this keeps plain IP / staging access working unchanged
// until the domain is live.
export function middleware(req: NextRequest) {
  const tenant = resolveTenantFromHost(req.headers.get("host"));

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
