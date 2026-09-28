import { NextResponse } from "next/server";
import { getTenantRegistry } from "@/lib/tenant";

// Public, pre-auth endpoint the login page's manual tenant picker fetches from (used only
// when subdomain-per-tenant routing hasn't resolved a tenant, e.g. on the bare IP). Deliberately
// strips internal fields -- no database name, no subdomain -- so an unauthenticated visitor
// can't enumerate other hospitals' backend details, only pick their own facility by name.
export async function GET() {
  const registry = getTenantRegistry();
  const tenants = Object.values(registry)
    .filter((t) => t.status === "active")
    .map((t) => ({ id: t.id, name: t.name, currency: t.currency, country: t.country }));
  return NextResponse.json({ success: true, tenants });
}
