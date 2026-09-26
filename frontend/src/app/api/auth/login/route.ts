import { NextRequest, NextResponse } from "next/server";
import { TrytonClient } from "@/lib/tryton-client";
import { setSession } from "@/lib/auth-session";
import { resolveRoleFromTrytonGroupNames } from "@/lib/access-control";
import { resolveTenant } from "@/lib/tenant";

export async function POST(req: NextRequest) {
  try {
    const { username, password, tenantId } = await req.json();

    if (!username || !password) {
      return NextResponse.json({ error: "Username and password are required" }, { status: 400 });
    }

    const tenant = resolveTenant(tenantId || req.headers.get("x-tenant-id"));

    // Authenticate with authoritative backend system backend for the tenant's dedicated database
    const { userId, sessionToken } = await TrytonClient.login(username.trim(), password, tenant.database);

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
    // backend system may include internal host, database, or account details in its
    // exception text. Keep those details in server logs only.
    return NextResponse.json({ error: "Unable to sign in. Check your credentials or contact your administrator." }, { status: 401 });
  }
}
