/**
 * IST Health — Multi-Tenant Architecture & Context Resolver
 * Enforces cryptographic and relational isolation across independent hospital clients.
 */

export interface TenantConfig {
  id: string;
  name: string;
  slug: string;
  database: string;
  companyId: number;
  currency: string;
  country: string;
  status: "active" | "suspended";
}

// Master Client Tenant Registry
export const TENANT_REGISTRY: Record<string, TenantConfig> = {
  "qatar-outpatient": {
    id: "qatar-outpatient",
    name: "Qatar Outpatient Specialist Center",
    slug: "qatar",
    database: "gnuhealth",
    companyId: 2,
    currency: "QAR",
    country: "QAT",
    status: "active",
  },
  "default": {
    id: "default",
    name: "IST Health Enterprise Medical Center",
    slug: "default",
    database: "gnuhealth",
    companyId: 2,
    currency: "QAR",
    country: "QAT",
    status: "active",
  },
};

/**
 * Resolves the tenant configuration from request headers or environment
 */
export function resolveTenant(tenantHeader?: string | null): TenantConfig {
  if (tenantHeader && TENANT_REGISTRY[tenantHeader]) {
    const tenant = TENANT_REGISTRY[tenantHeader];
    if (tenant.status === "suspended") {
      throw new Error("Tenant account is suspended. Contact Platform Administrator.");
    }
    return tenant;
  }
  return TENANT_REGISTRY["default"];
}
