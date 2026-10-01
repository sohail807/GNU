import fs from "fs";
import path from "path";

/**
 * A hospital inside a group customer (one database, several hospitals). Each hospital is one Tryton company
 * (its own books) and one GNU Health institution (its own wards, beds and theatres). Tenants without a
 * `hospitals` list are single-hospital and behave exactly as before.
 */
export interface HospitalConfig {
  id: string;
  name: string;
  companyId: number;
  institutionId?: number;
}

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
  hospitals?: HospitalConfig[];
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
// TENANT_REGISTRY_DIR points this at a durable shared volume on Cloud Run.
const REGISTRY_PATH = path.join(process.env.TENANT_REGISTRY_DIR || path.join(process.cwd(), "data"), "tenants-registry.json");

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
/**
 * The host the browser actually used. Behind Firebase Hosting the request reaches Cloud Run with
 * the run.app host and the original one in X-Forwarded-Host. Only used to pick which hospital's
 * login page to show -- authorization still comes from that hospital's own credentials.
 */
export function requestHost(headers: Headers): string | null {
  return headers.get("x-forwarded-host")?.split(",")[0]?.trim() || headers.get("host");
}

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

/** Hospital codes are short, lowercase, alphanumeric (they become part of the database name). */
export const HOSPITAL_CODE_PATTERN = /^[a-z0-9]{2,24}$/;

/**
 * Looks a hospital up by the code staff type on the login page. Returns null for anything that is
 * malformed, unknown or not active, so the caller can answer with the same generic error as a
 * wrong password and never reveal which hospitals exist.
 */
export function findActiveTenantByCode(code?: string | null): TenantConfig | null {
  const normalized = (code || "").trim().toLowerCase();
  if (!HOSPITAL_CODE_PATTERN.test(normalized)) return null;
  const match = Object.values(getTenantRegistry()).find(
    (t) => t.subdomain === normalized || t.id === normalized
  );
  return match && match.status === "active" ? match : null;
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
