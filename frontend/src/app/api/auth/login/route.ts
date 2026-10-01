import { NextRequest, NextResponse } from "next/server";
import { TrytonClient } from "@/lib/tryton-client";
import { setSession } from "@/lib/auth-session";
import { resolveRoleFromTrytonGroupNames } from "@/lib/access-control";
import { APP_BASE_DOMAIN, resolveTenant } from "@/lib/tenant";
import { clearLoginFailures, clientIp, loginRetryAfter, recordLoginFailure } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  let attemptedUser = "";
  const ip = clientIp(req.headers);
  try {
    const { username, password, tenantId } = await req.json();

    if (!username || !password) {
      return NextResponse.json({ error: "Username and password are required" }, { status: 400 });
    }

    attemptedUser = String(username).trim();
    const retryAfter = loginRetryAfter(attemptedUser, ip);
    if (retryAfter > 0) {
      return NextResponse.json(
        { error: "Too many failed sign-in attempts. Try again later." },
        { status: 429, headers: { "Retry-After": String(retryAfter) } }
      );
    }

    // Host-resolved tenant (set by middleware from the request's subdomain) is authoritative
    // once subdomain-per-tenant routing is live — a client can't override it via the POST body.
    // The body-supplied tenantId is only honored as a fallback for manual tenant selection
    // (bare-IP / pre-domain access, where there's no subdomain to resolve from).
    // Once subdomain routing is configured (APP_BASE_DOMAIN), the hospital comes only from the
    // address the user visited; a body-supplied tenantId is ignored so one hospital's login page
    // can't be pointed at another hospital's database.
    const tenant = resolveTenant(APP_BASE_DOMAIN ? req.headers.get("x-tenant-id") : req.headers.get("x-tenant-id") || tenantId);

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
    let healthprofId: number | undefined = undefined;

    try {
      const userRecords = await TrytonClient.execute<any[]>(
        username.trim(),
        userId,
        sessionToken,
        "res.user",
        "read",
        [[userId], ["id", "login", "name", "groups"]],
        { company: tenant.defaultCompanyId },
        tenant.database
      );

      if (userRecords && userRecords.length > 0) {
        const u = userRecords[0];
        displayName = u.name || username;
        groupIds = u.groups || [];
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
        companyId: tenant.defaultCompanyId,
        healthprofId,
        groups: groupIds,
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
      },
    });
  } catch (err: unknown) {
    // backend system may include internal host, database, or account details in its
    // exception text. Keep those details in server logs only.
    if (attemptedUser) recordLoginFailure(attemptedUser, ip);
    return NextResponse.json({ error: "Unable to sign in. Check your credentials or contact your administrator." }, { status: 401 });
  }
}
