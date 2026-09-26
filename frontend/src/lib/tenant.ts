export interface TenantConfig {
  id: string;
  name: string;
  slug: string;
  database: string;
  defaultCompanyId: number;
  currency: string;
  country: string;
  status: "active" | "suspended" | "provisioning";
}

export const TENANT_REGISTRY: Record<string, TenantConfig> = {
  "qatar-outpatient": {
    id: "qatar-outpatient",
    name: "IST Central Hospital (Qatar)",
    slug: "qatar-central",
    database: "gnuhealth",
    defaultCompanyId: 2,
    currency: "QAR",
    country: "QAT",
    status: "active",
  },
  "alpha-clinic": {
    id: "alpha-clinic",
    name: "IST Alpha Outpatient Center",
    slug: "alpha-clinic",
    database: "gnuhealth_test_alpha",
    defaultCompanyId: 2,
    currency: "QAR",
    country: "QAT",
    status: "active",
  },
  "beta-clinic": {
    id: "beta-clinic",
    name: "IST Beta Specialty Clinic",
    slug: "beta-clinic",
    database: "gnuhealth_test_beta",
    defaultCompanyId: 2,
    currency: "QAR",
    country: "QAT",
    status: "active",
  },
};

export const DEFAULT_TENANT_ID = "qatar-outpatient";

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
