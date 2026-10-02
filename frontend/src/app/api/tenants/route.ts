import { NextRequest, NextResponse } from "next/server";
import { DEFAULT_TENANT_ID, getTenantRegistry } from "@/lib/tenant";

// Public, pre-auth endpoint the login page uses to show which hospital it belongs to.
// It only ever returns the ONE hospital this address resolves to (middleware sets x-tenant-id
// from the subdomain; the bare domain falls back to the default hospital). It never lists other
// hospitals, so an anonymous visitor can't enumerate clients, and it exposes no database name.
export async function GET(req: NextRequest) {
  const registry = getTenantRegistry();
  const id = req.headers.get("x-tenant-id") || DEFAULT_TENANT_ID;
  const tenant = registry[id];
  const tenants =
    tenant && tenant.status === "active"
      ? [{ id: tenant.id, name: tenant.name, currency: tenant.currency, country: tenant.country }]
      : [];
  return NextResponse.json({ success: true, tenants, hostResolved: Boolean(req.headers.get("x-tenant-id")) });
}
