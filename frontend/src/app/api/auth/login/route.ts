import { NextRequest, NextResponse } from "next/server";
import { TrytonClient } from "@/lib/tryton-client";
import { setSession } from "@/lib/auth-session";
import { resolveRoleFromTrytonGroupNames } from "@/lib/access-control";
import { DEFAULT_TENANT_ID, findActiveTenantByCode, resolveTenant } from "@/lib/tenant";
import { clearLoginFailures, clientIp, loginRetryAfter, recordLoginFailure } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  let attemptedUser = "";
  const ip = clientIp(req.headers);
  try {
    const { username, password, hospital } = await req.json();

    if (!username || !password) {
      return NextResponse.json({ error: "Username and password are required" }, { status: 400 });
    }

    const hospitalCode = typeof hospital === "string" ? hospital.trim().toLowerCase() : "";
    const hostTenantId = req.headers.get("x-tenant-id");
    // Throttle per hospital + username, so an attack on "admin" at one hospital can't lock the
    // "admin" of another.
    attemptedUser = `${hostTenantId || hospitalCode || "default"}:${String(username).trim()}`;
    const retryAfter = loginRetryAfter(attemptedUser, ip);
    if (retryAfter > 0) {
      return NextResponse.json(
        { error: "Too many failed sign-in attempts. Try again later." },
        { status: 429, headers: { "Retry-After": String(retryAfter) } }
      );
    }

    // Which hospital: the address visited wins (a hospital subdomain, resolved by middleware into
    // x-tenant-id); otherwise the hospital code typed on the login page; blank means the default
    // hospital. An unknown/inactive code fails exactly like a wrong password so hospitals can't be
    // enumerated, and the legacy client-supplied tenantId is ignored.
    let tenant;
    if (hostTenantId) {
      tenant = resolveTenant(hostTenantId);
    } else if (hospitalCode) {
      const byCode = findActiveTenantByCode(hospitalCode);
      if (!byCode) throw new Error("Unknown hospital code.");
      tenant = resolveTenant(byCode.id);
    } else {
      tenant = resolveTenant(DEFAULT_TENANT_ID);
    }

    // The platform onboarding screen's "suspend tenant" action only ever flipped this flag in
    // the registry - nothing here ever read it back, so a suspended hospital's staff could
    // keep logging in and using the system exactly as before. Confirmed live: suspending a
    // freshly provisioned test tenant did not block its admin login.
    if (tenant.status !== "active") {
      return NextResponse.json(
        { error: "This hospital's access has been suspended. Contact your platform operator." },
        { status: 403 }
      );
    }

    // Authenticate with authoritative backend system backend for the tenant's dedicated database
    const { userId, sessionToken } = await TrytonClient.login(username.trim(), password, tenant.database);
    clearLoginFailures(attemptedUser);

    // Fetch live user profile and security groups using the user's authentic session
    let role = "general";
    let roleTitle = "Clinical Staff";
    let redirect = "/frontdesk";
    let displayName = username.trim();
    let groupIds: number[] = [];
    let userCompanies: number[] = [];
    let userCompany: number | null = null;
    let healthprofId: number | undefined = undefined;

    try {
      const userRecords = await TrytonClient.execute<any[]>(
        username.trim(),
        userId,
        sessionToken,
        "res.user",
        "read",
        [[userId], ["id", "login", "name", "groups", "companies", "company"]],
        { company: tenant.defaultCompanyId },
        tenant.database
      );

      if (userRecords && userRecords.length > 0) {
        const u = userRecords[0];
        displayName = u.name || username;
        groupIds = u.groups || [];
        userCompanies = Array.isArray(u.companies) ? u.companies : [];
        userCompany = typeof u.company === "number" ? u.company : null;
        const groupRecords = groupIds.length
          ? await TrytonClient.execute<any[]>(
              username.trim(),
              userId,
              sessionToken,
              "res.group",
              "search_read",
              [[["id", "in", groupIds]], 0, groupIds.length, null, ["id", "name"]],
              { company: tenant.defaultCompanyId },
              tenant.database
            )
          : [];
        const resolved = resolveRoleFromTrytonGroupNames(groupRecords.map((group) => group.name));
        role = resolved.role;
        roleTitle = resolved.roleTitle;
        redirect = resolved.redirect;
      }
    } catch {
      // Never infer administrator privileges from a login name when group lookup fails.
      role = "general";
      roleTitle = "Staff member";
      redirect = "/frontdesk";
      groupIds = [];
    }

    // Attempt to locate associated Health Professional ID via party.internal_user relation
    try {
      const hpRecords = await TrytonClient.execute<any[]>(
        username.trim(),
        userId,
        sessionToken,
        "gnuhealth.healthprofessional",
        "search_read",
        [[["party.internal_user", "=", userId]], 0, 1, null, ["id", "rec_name"]],
        { company: tenant.defaultCompanyId },
        tenant.database
      );
      if (hpRecords && hpRecords.length > 0) {
        healthprofId = hpRecords[0].id;
      }
    } catch {
      // Non-clinical roles (receptionist, cashier, admin) will not have a health professional record
    }

    // Group customers (several hospitals in one database): the user works in one hospital at a time, chosen from
    // the hospitals whose company the backend lets this user use. Single-hospital tenants skip this entirely.
    let activeCompanyId = tenant.defaultCompanyId;
    let hospitalFields: { hospitalId?: string; hospitalName?: string; institutionId?: number; hospitals?: Array<{ id: string; name: string }> } = {};
    if (tenant.hospitals && tenant.hospitals.length > 0) {
      const mine = tenant.hospitals.filter((h) => userCompanies.includes(h.companyId));
      if (mine.length === 0) {
        try {
          await TrytonClient.logout(username.trim(), userId, sessionToken, tenant.database);
        } catch {
          // Best effort: the account simply has no hospital here, so no session is created either way.
        }
        return NextResponse.json({ error: "No hospital is assigned to this account. Contact your administrator." }, { status: 403 });
      }
      const chosen = mine.find((h) => h.companyId === userCompany) || mine[0];
      activeCompanyId = chosen.companyId;
      hospitalFields = {
        hospitalId: chosen.id,
        hospitalName: chosen.name,
        institutionId: chosen.institutionId,
        hospitals: mine.map((h) => ({ id: h.id, name: h.name })),
      };
    }

    const isHttps =
      req.nextUrl.protocol === "https:" ||
      req.headers.get("x-forwarded-proto") === "https";

    // Store in secure httpOnly cookie with tenant database and company context
    await setSession(
      {
        username: username.trim(),
        userId,
        sessionToken,
        role,
        name: displayName,
        tenantId: tenant.id,
        database: tenant.database,
        companyId: activeCompanyId,
        healthprofId,
        groups: groupIds,
        ...hospitalFields,
      },
      isHttps
    );

    return NextResponse.json({
      success: true,
      user: {
        username: username.trim(),
        userId,
        role,
        roleTitle,
        name: displayName,
        redirect,
        tenantId: tenant.id,
        healthprofId,
        ...(hospitalFields.hospitalId ? { hospitalId: hospitalFields.hospitalId, hospitalName: hospitalFields.hospitalName } : {}),
      },
    });
  } catch (err: unknown) {
    // backend system may include internal host, database, or account details in its
    // exception text. Keep those details in server logs only.
    if (attemptedUser) recordLoginFailure(attemptedUser, ip);
    return NextResponse.json({ error: "Unable to sign in. Check your credentials or contact your administrator." }, { status: 401 });
  }
}
