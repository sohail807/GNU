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

const QATAR_TENANT_ID = "qatar-outpatient";

/** Public selector metadata only. Connection and company settings are server-only env vars. */
export const TENANT_REGISTRY: Record<string, Pick<TenantConfig, "id" | "name" | "slug" | "currency" | "country" | "status">> = {
  [QATAR_TENANT_ID]: {
    id: QATAR_TENANT_ID,
    name: "Health Workspace",
    slug: QATAR_TENANT_ID,
    currency: "QAR",
    country: "QAT",
    status: "active",
  },
};

export function resolveTenant(tenantIdentifier?: string | null): TenantConfig {
  if (tenantIdentifier && tenantIdentifier !== QATAR_TENANT_ID) {
    const error = new Error("The selected clinic is not configured on this server.");
    (error as Error & { status?: number }).status = 400;
    throw error;
  }

  const database = process.env.GNUHEALTH_DATABASE;
  const companyId = Number(process.env.GNUHEALTH_COMPANY_ID);
  if (!database || !/^[A-Za-z0-9_-]+$/.test(database)) {
    throw new Error("GNUHEALTH_DATABASE must be configured on the server.");
  }
  if (!Number.isSafeInteger(companyId) || companyId <= 0) {
    throw new Error("GNUHEALTH_COMPANY_ID must be configured on the server.");
  }

  return {
    ...TENANT_REGISTRY[QATAR_TENANT_ID],
    database,
    defaultCompanyId: companyId,
  };
}

export function validateTenantAccess(sessionTenantId?: string | null, requestedTenantId?: string | null): boolean {
  if (!requestedTenantId) return true;
  if (requestedTenantId !== QATAR_TENANT_ID || (sessionTenantId && requestedTenantId !== sessionTenantId)) {
    const error = new Error("Access to the requested clinic is not permitted.");
    (error as Error & { status?: number }).status = 403;
    throw error;
  }
  return true;
}
