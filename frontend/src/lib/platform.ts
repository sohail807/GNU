import { DEFAULT_TENANT_ID } from "@/lib/tenant";
import type { SessionData } from "@/lib/auth-session";

// Platform/tenant-onboarding access is deliberately not a Tryton group like every other role --
// it operates above any single hospital's database (it creates new ones), so it's gated on an
// explicit username allow-list rather than reusing the per-tenant RBAC groups. Comma-separated,
// e.g. "irisstar_admin,another_operator". Unset = nobody gets platform access, not "everyone".
function superAdminUsernames(): Set<string> {
  return new Set(
    (process.env.SUPER_ADMIN_USERNAMES || "")
      .split(",")
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean)
  );
}

/**
 * True only for an allow-listed username, and only while logged into the main/default tenant's
 * database -- a hospital-local admin account in some other tenant (even one that happens to
 * share a username) never qualifies, since tenantId is bound to the database the session
 * actually authenticated against.
 */
export function isSuperAdmin(session: Pick<SessionData, "username" | "tenantId">): boolean {
  if (session.tenantId !== DEFAULT_TENANT_ID) return false;
  return superAdminUsernames().has(session.username.trim().toLowerCase());
}
