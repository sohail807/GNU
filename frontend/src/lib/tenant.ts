import fs from "fs";
import path from "path";

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

export const DEFAULT_TENANT_ID = "qatar-outpatient";

// Seed used only the very first time the app runs and no registry file exists yet on disk.
// After that, the file at REGISTRY_PATH is authoritative -- edit tenants through the
// platform onboarding screen (super-admin only), not by changing this constant.
const SEED_REGISTRY: Record<string, TenantConfig> = {
  [DEFAULT_TENANT_ID]: {
    id: DEFAULT_TENANT_ID,
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

// Deliberately outside src/ (which is deployed read-only in production) so the platform
// onboarding flow can write new tenants at runtime without needing a rebuild or redeploy.
// Resolved relative to the process's working directory, which for both the production and
// staging PM2 processes is the app root (/var/www/ist-health-frontend[-staging]).
const REGISTRY_PATH = path.join(process.cwd(), "data", "tenants-registry.json");

function readRegistryFile(): Record<string, TenantConfig> {
  try {
    const raw = fs.readFileSync(REGISTRY_PATH, "utf-8");
    return JSON.parse(raw);
  } catch {
    try {
      fs.mkdirSync(path.dirname(REGISTRY_PATH), { recursive: true });
      fs.writeFileSync(REGISTRY_PATH, JSON.stringify(SEED_REGISTRY, null, 2));
    } catch {
      // Best effort: if the directory isn't writable, fall through and just serve the seed
      // from memory for this request rather than failing the whole app.
    }
    return SEED_REGISTRY;
  }
}

let cache: { data: Record<string, TenantConfig>; loadedAt: number } | null = null;
// Short TTL: a newly-onboarded tenant should become reachable within a few seconds across
// all PM2/worker processes without requiring a restart, but every request re-reading the
// file from disk would be wasteful for a value that changes maybe a few times a year.
const CACHE_TTL_MS = 5000;

export function getTenantRegistry(): Record<string, TenantConfig> {
  const now = Date.now();
  if (cache && now - cache.loadedAt < CACHE_TTL_MS) return cache.data;
  const data = readRegistryFile();
  cache = { data, loadedAt: now };
  return data;
}

export function saveTenantRegistry(data: Record<string, TenantConfig>): void {
  fs.mkdirSync(path.dirname(REGISTRY_PATH), { recursive: true });
  fs.writeFileSync(REGISTRY_PATH, JSON.stringify(data, null, 2));
  cache = { data, loadedAt: Date.now() };
}

/** Base domain subdomain-per-tenant routing is anchored to, e.g. "isthealth.com". Unset until the domain is live. */
export const APP_BASE_DOMAIN = process.env.APP_BASE_DOMAIN || "";

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
  const registry = getTenantRegistry();
  const match = Object.values(registry).find((t) => t.subdomain === subdomain);
  return match || null;
}

export function resolveTenant(tenantIdentifier?: string | null): TenantConfig {
  const registry = getTenantRegistry();
  const selectedId = tenantIdentifier && registry[tenantIdentifier]
    ? tenantIdentifier
    : DEFAULT_TENANT_ID;

  const baseConfig = registry[selectedId] || SEED_REGISTRY[DEFAULT_TENANT_ID];

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
  const registry = getTenantRegistry();
  if (!registry[requestedTenantId]) {
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
