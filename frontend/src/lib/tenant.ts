export interface TenantConfig {
  id: string;
  name: string;
  slug: string;
  /** DNS subdomain label this tenant is reached at once subdomain-per-tenant routing is live, e.g. "central" for central.<APP_BASE_DOMAIN>. */
  subdomain: string;
  database: string;
  defaultCompanyId: number;
  currency: string;
  country: string;
  status: "active" | "suspended" | "provisioning";
}

// Provision a new tenant with scripts/provision_tenant_database.py, then add its entry here
// (and give it a unique `subdomain`) to bring it onto subdomain-based routing.
export const TENANT_REGISTRY: Record<string, TenantConfig> = {
  "qatar-outpatient": {
    id: "qatar-outpatient",
    name: "IST Central Hospital (Qatar)",
    slug: "qatar-central",
    subdomain: "central",
    database: "gnuhealth",
    defaultCompanyId: 2,
    currency: "QAR",
    country: "QAT",
    status: "active",
  },
};

export const DEFAULT_TENANT_ID = "qatar-outpatient";

/** Base domain subdomain-per-tenant routing is anchored to, e.g. "isthealth.com". Unset until the domain is live. */
export const APP_BASE_DOMAIN = process.env.APP_BASE_DOMAIN || "";

const SUBDOMAIN_TO_TENANT_ID: Record<string, string> = Object.fromEntries(
  Object.values(TENANT_REGISTRY).map((t) => [t.subdomain, t.id])
);

/**
 * Resolves a tenant from the request Host header once APP_BASE_DOMAIN is configured, e.g.
 * "central.isthealth.com" -> the "qatar-outpatient" tenant. Returns null when the host isn't
 * a recognized tenant subdomain (bare IP access, the apex domain, or an unknown subdomain) so
 * callers can fall back to manual tenant selection.
 */
export function resolveTenantFromHost(host?: string | null): TenantConfig | null {
  if (!host || !APP_BASE_DOMAIN) return null;
  const hostname = host.split(":")[0].toLowerCase();
  const suffix = `.${APP_BASE_DOMAIN.toLowerCase()}`;
  if (!hostname.endsWith(suffix)) return null;
  const subdomain = hostname.slice(0, -suffix.length);
  const tenantId = SUBDOMAIN_TO_TENANT_ID[subdomain];
  return tenantId ? TENANT_REGISTRY[tenantId] : null;
}

export function resolveTenant(tenantIdentifier?: string | null): TenantConfig {
  const selectedId = tenantIdentifier && TENANT_REGISTRY[tenantIdentifier]
    ? tenantIdentifier
    : DEFAULT_TENANT_ID;

  const baseConfig = TENANT_REGISTRY[selectedId];

  // Allow environment variable override for primary deployment
  const database = (selectedId === DEFAULT_TENANT_ID && process.env.GNUHEALTH_DATABASE)
    ? process.env.GNUHEALTH_DATABASE
    : baseConfig.database;

  const companyId = (selectedId === DEFAULT_TENANT_ID && process.env.GNUHEALTH_COMPANY_ID)
    ? Number(process.env.GNUHEALTH_COMPANY_ID)
    : baseConfig.defaultCompanyId;

  return {
    ...baseConfig,
    database,
    defaultCompanyId: Number.isSafeInteger(companyId) && companyId > 0 ? companyId : 2,
  };
}

export function validateTenantAccess(sessionTenantId?: string | null, requestedTenantId?: string | null): boolean {
  if (!requestedTenantId) return true;
  if (!TENANT_REGISTRY[requestedTenantId]) {
    const error = new Error("The requested clinic is not recognized on this server.");
    (error as Error & { status?: number }).status = 404;
    throw error;
  }
  if (sessionTenantId && requestedTenantId !== sessionTenantId) {
    const error = new Error("Access to the requested clinic is not permitted with your current session.");
    (error as Error & { status?: number }).status = 403;
    throw error;
  }
  return true;
}
