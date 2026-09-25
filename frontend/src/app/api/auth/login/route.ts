import { NextRequest, NextResponse } from "next/server";
import { TrytonClient } from "@/lib/tryton-client";
import { setSession } from "@/lib/auth-session";
import { resolveRoleFromTrytonGroups } from "@/lib/access-control";
import { resolveTenant } from "@/lib/tenant";

export async function POST(req: NextRequest) {
  try {
    const { username, password, tenantId } = await req.json();

    if (!username || !password) {
      return NextResponse.json({ error: "Username and password are required" }, { status: 400 });
    }

    const tenant = resolveTenant(tenantId || req.headers.get("x-tenant-id"));

    // Authenticate with authoritative Tryton backend for the tenant's dedicated database
    const { userId, sessionToken } = await TrytonClient.login(username.trim(), password, tenant.database);

    // Fetch live user profile and security groups using the user's authentic session
    let role = "general";
    let roleTitle = "Clinical Staff";
    let redirect = "/frontdesk";
    let displayName = username;
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
        const resolved = resolveRoleFromTrytonGroups(groupIds);
        role = resolved.role;
        roleTitle = resolved.roleTitle;
        redirect = resolved.redirect;
      }
    } catch (err) {
      console.warn("Could not read user groups from res.user, using fallback:", err);
      if (username === "admin") {
        role = "admin";
        roleTitle = "System Administrator";
        redirect = "/admin";
      }
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

    // Store in secure httpOnly cookie with tenant database and company context
    await setSession({
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
    });

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
    const message = err instanceof Error ? err.message : "Authentication failed";
    return NextResponse.json({ error: message }, { status: 401 });
  }
}
