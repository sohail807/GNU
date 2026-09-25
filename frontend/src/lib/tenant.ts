/**
 * IST Health — Multi-Tenant SaaS Architecture & Central Tenant Registry
 * Enforces database-level isolation across independent hospital clients,
 * while retaining company-level separation for branches within each client.
 */

export interface HospitalBranch {
  id: number;
  name: string;
  code: string;
  isMain: boolean;
}

export interface TenantConfig {
  id: string;
  name: string;
  slug: string;
  database: string;
  backendUrl: string;
  defaultCompanyId: number;
  branches: HospitalBranch[];
  currency: string;
  country: string;
  status: "active" | "suspended" | "provisioning";
  adminEmail: string;
  storageQuotaMb: number;
  createdAt: string;
}

const DEFAULT_HOST = process.env.GNUHEALTH_HOST || "http://34.7.237.8";

// Master Central Tenant Registry
export const TENANT_REGISTRY: Record<string, TenantConfig> = {
  "qatar-outpatient": {
    id: "qatar-outpatient",
    name: "Qatar Outpatient Specialist Center",
    slug: "qatar-outpatient",
    database: "gnuhealth",
    backendUrl: `${DEFAULT_HOST}/gnuhealth/`,
    defaultCompanyId: 2,
    branches: [
      { id: 2, name: "Doha Outpatient Clinic", code: "DOH-MAIN", isMain: true },
      { id: 3, name: "West Bay Day Surgery Unit", code: "WB-DSU", isMain: false },
    ],
    currency: "QAR",
    country: "QAT",
    status: "active",
    adminEmail: "admin@qatar-outpatient.ist-health.qa",
    storageQuotaMb: 10240,
    createdAt: "2026-01-01T00:00:00Z",
  },
  "al-rayyan-hospital": {
    id: "al-rayyan-hospital",
    name: "Al Rayyan General Hospital",
    slug: "al-rayyan",
    database: "gnuhealth_alrayyan",
    backendUrl: `${DEFAULT_HOST}/gnuhealth_alrayyan/`,
    defaultCompanyId: 1,
    branches: [
      { id: 1, name: "Al Rayyan Main Campus", code: "RYN-MAIN", isMain: true },
      { id: 2, name: "Al Rayyan Emergency Annex", code: "RYN-ER", isMain: false },
    ],
    currency: "QAR",
    country: "QAT",
    status: "active",
    adminEmail: "director@alrayyan.ist-health.qa",
    storageQuotaMb: 20480,
    createdAt: "2026-03-15T00:00:00Z",
  },
  "al-wakrah-medical": {
    id: "al-wakrah-medical",
    name: "Al Wakrah Specialized Medical Center",
    slug: "al-wakrah",
    database: "gnuhealth_alwakrah",
    backendUrl: `${DEFAULT_HOST}/gnuhealth_alwakrah/`,
    defaultCompanyId: 1,
    branches: [
      { id: 1, name: "Al Wakrah Central Facility", code: "WKR-MAIN", isMain: true },
    ],
    currency: "QAR",
    country: "QAT",
    status: "active",
    adminEmail: "admin@alwakrah.ist-health.qa",
    storageQuotaMb: 10240,
    createdAt: "2026-06-01T00:00:00Z",
  },
  "tenant-alpha-test": {
    id: "tenant-alpha-test",
    name: "Synthetic Client Alpha (Test Hospital)",
    slug: "test-alpha",
    database: "gnuhealth_test_alpha",
    backendUrl: `${DEFAULT_HOST}/gnuhealth_test_alpha/`,
    defaultCompanyId: 1,
    branches: [
      { id: 1, name: "Alpha Central Pavilion", code: "ALP-MAIN", isMain: true },
    ],
    currency: "USD",
    country: "USA",
    status: "active",
    adminEmail: "qa-alpha@ist-health.test",
    storageQuotaMb: 5120,
    createdAt: "2026-09-25T00:00:00Z",
  },
  "tenant-beta-test": {
    id: "tenant-beta-test",
    name: "Synthetic Client Beta (Test Clinic)",
    slug: "test-beta",
    database: "gnuhealth_test_beta",
    backendUrl: `${DEFAULT_HOST}/gnuhealth_test_beta/`,
    defaultCompanyId: 1,
    branches: [
      { id: 1, name: "Beta Medical Suites", code: "BET-MAIN", isMain: true },
    ],
    currency: "EUR",
    country: "DEU",
    status: "active",
    adminEmail: "qa-beta@ist-health.test",
    storageQuotaMb: 5120,
    createdAt: "2026-09-25T00:00:00Z",
  },
  "default": {
    id: "default",
    name: "IST Health Enterprise Healthcare System",
    slug: "default",
    database: "gnuhealth",
    backendUrl: `${DEFAULT_HOST}/gnuhealth/`,
    defaultCompanyId: 2,
    branches: [
      { id: 2, name: "Primary Healthcare Facility", code: "DEF-MAIN", isMain: true },
    ],
    currency: "QAR",
    country: "QAT",
    status: "active",
    adminEmail: "platform-admin@ist-health.qa",
    storageQuotaMb: 51200,
    createdAt: "2026-01-01T00:00:00Z",
  },
};

/**
 * Returns all registered hospital clients
 */
export function getAllTenants(): TenantConfig[] {
  return Object.values(TENANT_REGISTRY).filter((t) => t.id !== "default");
}

/**
 * Resolves tenant configuration from headers, host, or tenant identifier
 */
export function resolveTenant(tenantIdentifier?: string | null): TenantConfig {
  if (tenantIdentifier && TENANT_REGISTRY[tenantIdentifier]) {
    const tenant = TENANT_REGISTRY[tenantIdentifier];
    if (tenant.status === "suspended") {
      const err = new Error(`Tenant account '${tenant.name}' is suspended. Access is prohibited.`);
      (err as any).status = 403;
      throw err;
    }
    return tenant;
  }
  return TENANT_REGISTRY["default"];
}

/**
 * Verifies that the authenticated session is permitted to access the requested tenant.
 * Rejects cross-tenant attempts with an explicit SecurityError.
 */
export function validateTenantAccess(sessionTenantId?: string | null, requestedTenantId?: string | null): boolean {
  if (!sessionTenantId || !requestedTenantId) return true;
  // Platform super-administrator in default context can inspect across tenants
  if (sessionTenantId === "default") return true;
  
  if (sessionTenantId !== requestedTenantId) {
    const error = new Error(`Cross-Tenant Violation: Session belongs to '${sessionTenantId}', cannot access '${requestedTenantId}'.`);
    (error as any).status = 403;
    throw error;
  }
  return true;
}

/**
 * Dynamically registers a newly provisioned hospital client in the registry
 */
export function registerTenant(config: Omit<TenantConfig, "backendUrl" | "createdAt">): TenantConfig {
  const backendUrl = `${DEFAULT_HOST}/${config.database}/`;
  const fullConfig: TenantConfig = {
    ...config,
    backendUrl,
    createdAt: new Date().toISOString(),
  };
  TENANT_REGISTRY[config.id] = fullConfig;
  return fullConfig;
}

/**
 * Toggles tenant lifecycle state (active, suspended, provisioning)
 */
export function setTenantStatus(tenantId: string, status: "active" | "suspended" | "provisioning"): void {
  if (TENANT_REGISTRY[tenantId]) {
    TENANT_REGISTRY[tenantId].status = status;
  }
}
