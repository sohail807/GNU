import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { getSession } from "@/lib/auth-session";
import { TrytonClient } from "@/lib/tryton-client";
import {
  UserAccessProfile,
  DEFAULT_ROLE_PERMISSIONS,
  HospitalRole,
  AppModule,
  resolveRoleFromTrytonGroupNames,
} from "@/lib/access-control";

const ROLE_TO_TRYTON_GROUP_NAMES: Record<HospitalRole, string[]> = {
  admin: ["Administration", "Health Administration"],
  physician: ["Health Doctor"],
  nursing: ["Health Nurse"],
  reception: ["Health Front Desk"],
  lab: ["Health Lab"],
  radiology: ["Health Imaging"],
  cashier: ["Account"],
  accountant: ["Account Administration", "Accounting Party"],
  general: ["Health Front Desk"],
};

async function hasLiveAdminRole(session: NonNullable<Awaited<ReturnType<typeof getSession>>>) {
  const users = await TrytonClient.execute<any[]>(
    session.username, session.userId, session.sessionToken,
    "res.user", "read", [[session.userId], ["groups"]],
    { company: session.companyId }, session.database
  );
  const ids = relationIds(users[0]?.groups);
  if (!ids.length) return false;
  const groups = await TrytonClient.execute<any[]>(
    session.username, session.userId, session.sessionToken,
    "res.group", "search_read",
    [[ ["id", "in", ids] ], 0, ids.length, null, ["name"]],
    { company: session.companyId }, session.database
  );
  return resolveRoleFromTrytonGroupNames(groups.map((group) => String(group.name || ""))).role === "admin";
}

function relationIds(value: unknown): number[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => (Array.isArray(item) ? item[0] : item))
    .filter((id): id is number => Number.isSafeInteger(id));
}

async function readRoleGroupIds(
  session: NonNullable<Awaited<ReturnType<typeof getSession>>>,
  requiredRole: HospitalRole
) {
  const requestedNames = [...new Set(Object.values(ROLE_TO_TRYTON_GROUP_NAMES).flat())];
  const rows = await TrytonClient.execute<any[]>(
    session.username,
    session.userId,
    session.sessionToken,
    "res.group",
    "search_read",
    [[["name", "in", requestedNames]], 0, requestedNames.length, null, ["id", "name"]],
    { company: session.companyId },
    session.database
  );
  const byName = new Map(rows.map((row) => [String(row.name).trim().toLowerCase(), row.id as number]));
  const idsByRole = {} as Record<HospitalRole, number[]>;
  for (const role of Object.keys(ROLE_TO_TRYTON_GROUP_NAMES) as HospitalRole[]) {
    const roleIds = ROLE_TO_TRYTON_GROUP_NAMES[role]
      .map((name) => byName.get(name.toLowerCase()))
      .filter((id): id is number => Number.isSafeInteger(id));
    if (role === requiredRole && roleIds.length !== ROLE_TO_TRYTON_GROUP_NAMES[role].length) {
      throw new Error(`backend system security groups are missing or unreadable for role ${role}.`);
    }
    idsByRole[role] = roleIds;
  }
  return { idsByRole, managedIds: new Set(rows.map((row) => row.id as number)) };
}

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized session" }, { status: 401 });
  }

  try {
    if (!(await hasLiveAdminRole(session))) {
      return NextResponse.json({ error: "Current backend system administrator access is required." }, { status: 403 });
    }
    // Query genuine users from backend system res.user
    const usersRaw = await TrytonClient.execute<any[]>(
      session.username,
      session.userId,
      session.sessionToken,
      "res.user",
      "search_read",
      [[], 0, 50, [["id", "ASC"]], ["id", "login", "name", "active", "groups", "email"]],
      { company: session.companyId },
      session.database
    );

    const allGroupIds = [...new Set(usersRaw.flatMap((user) => relationIds(user.groups)))];
    const groupRows = allGroupIds.length
      ? await TrytonClient.execute<any[]>(
          session.username,
          session.userId,
          session.sessionToken,
          "res.group",
          "search_read",
          [[["id", "in", allGroupIds]], 0, allGroupIds.length, null, ["id", "name"]],
          { company: session.companyId },
          session.database
        )
      : [];
    const groupNameById = new Map(groupRows.map((group) => [group.id as number, String(group.name)]));

    const users: UserAccessProfile[] = usersRaw.map((u) => {
      const groupIds = relationIds(u.groups);
      const resolved = resolveRoleFromTrytonGroupNames(
        groupIds.map((id) => groupNameById.get(id)).filter((name): name is string => Boolean(name))
      );
      const perms = { ...DEFAULT_ROLE_PERMISSIONS[resolved.role] };

      return {
        id: u.id,
        username: u.login,
        name: u.name || u.login,
        role: resolved.role,
        roleTitle: resolved.roleTitle,
        department: "",
        email: u.email || "",
        phone: "",
        status: u.active ? "active" : "suspended",
        permissions: perms,
        lastLogin: "Unavailable",
      };
    });

    // Read this tenant's own company/facility name rather than assuming any fixed hospital --
    // a newly onboarded tenant starts with its own placeholder company, not the original one.
    let hospitalName = "";
    try {
      const companies = await TrytonClient.execute<any[]>(
        session.username, session.userId, session.sessionToken,
        "company.company", "read",
        [[session.companyId], ["rec_name"]],
        { company: session.companyId }, session.database
      );
      hospitalName = companies[0]?.rec_name || "";
    } catch {
      // Non-fatal: the directory still loads, just without a facility label.
    }

    return NextResponse.json({
      success: true,
      users,
      hospitalName,
      currentUser: {
        username: session.username,
        role: session.role,
      },
    });
  } catch (err: unknown) {
    const status = (err as any)?.status || 500;
    const message = err instanceof Error ? err.message : "Failed to load staff user directory";
    return NextResponse.json({ error: message }, { status });
  }
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized session" }, { status: 401 });
  }

  // Only Administrator can execute mutations on staff users and access control
  try {
    if (!(await hasLiveAdminRole(session))) {
      return NextResponse.json({ error: "Current backend system administrator access is required." }, { status: 403 });
    }
    const body = await req.json();
    const { action } = body;

    if (action === "update_permissions") {
      return NextResponse.json(
        { error: "Individual module overrides are not supported. Assign a native backend system role instead." },
        { status: 400 }
      );
    }

    // Update a native backend system account and its managed operational role group.
    if (action === "update_user") {
      const { userId, role, status, name, email } = body;
      const uid = Number(userId);
      if (!Number.isSafeInteger(uid) || uid <= 0) {
        return NextResponse.json({ error: "User ID is required." }, { status: 400 });
      }

      const writePayload: Record<string, unknown> = {};

      if (status === "active" || status === "suspended") {
        writePayload.active = status === "active";
      } else if (status !== undefined) {
        return NextResponse.json({ error: "Status must be active or suspended." }, { status: 400 });
      }

      if (typeof name === "string" && name.trim()) {
        writePayload.name = name.trim();
      }

      if (email !== undefined) {
        if (typeof email !== "string" || (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))) {
          return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
        }
        writePayload.email = email.trim();
      }

      if (role !== undefined) {
        if (typeof role !== "string" || !Object.hasOwn(ROLE_TO_TRYTON_GROUP_NAMES, role)) {
          return NextResponse.json({ error: "The selected backend system role is not supported." }, { status: 400 });
        }
        if (uid === session.userId && (role !== "admin" || status === "suspended")) {
          return NextResponse.json(
            { error: "You cannot remove or suspend your own administrator access." },
            { status: 409 }
          );
        }

        const { idsByRole, managedIds } = await readRoleGroupIds(session, role as HospitalRole);
        const targetUsers = await TrytonClient.execute<any[]>(
          session.username,
          session.userId,
          session.sessionToken,
          "res.user",
          "read",
          [[uid], ["id", "groups"]],
          { company: session.companyId },
          session.database
        );
        const currentGroups: number[] = relationIds(targetUsers[0]?.groups);
        // Many2Many fields take Tryton's write-command tuples, not a plain array of the final
        // desired ids -- passing a flat array here previously made Tryton throw a raw Python
        // TypeError for every role change. "remove" drops the old role's managed groups (leaving
        // any unmanaged ones the user already had untouched); "add" attaches the new role's groups.
        const groupsToRemove = currentGroups.filter((groupId) => managedIds.has(groupId));
        const groupsToAdd = idsByRole[role as HospitalRole];
        writePayload.groups = [
          ["remove", groupsToRemove],
          ["add", groupsToAdd],
        ];
      }

      if (Object.keys(writePayload).length === 0) {
        return NextResponse.json({ error: "No supported profile changes were supplied." }, { status: 400 });
      }

      await TrytonClient.execute(
        session.username,
        session.userId,
        session.sessionToken,
        "res.user",
        "write",
        [[uid], writePayload],
        { company: session.companyId },
        session.database
      );

      return NextResponse.json({
        success: true,
        message: `Staff user record updated and committed to backend system security database.`,
      });
    }

    // Action 2: Add New Staff User
    if (action === "add_user") {
      const { username, name, role, email } = body;
      if (!username || !name || !role) {
        return NextResponse.json(
          { error: "Username, Full Name, and Clinical Role are required." },
          { status: 400 }
        );
      }

      if (typeof role !== "string" || !Object.hasOwn(ROLE_TO_TRYTON_GROUP_NAMES, role)) {
        return NextResponse.json({ error: "The selected backend system role is not supported." }, { status: 400 });
      }
      const targetRole = role as HospitalRole;
      const { idsByRole } = await readRoleGroupIds(session, targetRole);
      const groups = idsByRole[targetRole];
      const temporaryPassword = randomBytes(24).toString("base64url");

      const userPayload = {
        login: username.trim().toLowerCase(),
        name: name.trim(),
        email: typeof email === "string" ? email.trim() : "",
        password: temporaryPassword,
        // Many2Many fields need Tryton's write-command format on create, not a plain array of
        // ids -- passing groups directly made res.user.create throw a raw Python TypeError
        // ("'int' object is not subscriptable") for every single role, since nothing had ever
        // exercised this code path successfully before.
        groups: [["add", groups]],
        active: true,
      };

      const res = await TrytonClient.execute<number[]>(
        session.username,
        session.userId,
        session.sessionToken,
        "res.user",
        "create",
        [[userPayload]],
        { company: session.companyId },
        session.database
      );
      const newUserId = res[0];

      // Link clinicians to the account so appointment/clinical routes can resolve them.
      if (targetRole === "physician" || targetRole === "nursing") {
        try {
          const partyRes = await TrytonClient.execute<number[]>(
            session.username,
            session.userId,
            session.sessionToken,
            "party.party",
            "create",
            [[{ name: name.trim(), is_person: true, internal_user: newUserId }]],
            { company: session.companyId },
            session.database
          );
          await TrytonClient.execute(
            session.username,
            session.userId,
            session.sessionToken,
            "gnuhealth.healthprofessional",
            "create",
            [[{ party: partyRes[0] }]],
            { company: session.companyId },
            session.database
          );
        } catch (error) {
          await TrytonClient.execute(
            session.username,
            session.userId,
            session.sessionToken,
            "res.user",
            "write",
            [[newUserId], { active: false }],
            { company: session.companyId },
            session.database
          );
          throw new Error(
            `The account was created but its clinician profile could not be linked; the account has been disabled. ${error instanceof Error ? error.message : ""}`
          );
        }
      }

      return NextResponse.json({
        success: true,
        userId: newUserId,
        temporaryPassword,
        message: `Staff user @${username} provisioned successfully in backend system database.`,
      });
    }

    // Action 3: Administrative Password Reset
    if (action === "reset_password") {
      const userId = Number(body.userId);
      if (!Number.isSafeInteger(userId) || userId <= 0) {
        return NextResponse.json(
          { error: "User ID is required." },
          { status: 400 }
        );
      }

      if (userId === session.userId) {
        return NextResponse.json(
          { error: "Use the account's native password-change process to change your own password." },
          { status: 400 }
        );
      }

      const uid = userId;

      // Protect Platform Super-Admin (User ID 1) from tenant admin reset
      if (uid === 1 && session.userId !== 1) {
        return NextResponse.json(
          { error: "Security Violation: Platform Super Administrator cannot be reset by Tenant Admins." },
          { status: 403 }
        );
      }

      const temporaryPassword = randomBytes(24).toString("base64url");
      await TrytonClient.execute(
        session.username,
        session.userId,
        session.sessionToken,
        "res.user",
        "write",
        [[uid], { password: temporaryPassword }],
        { company: session.companyId },
        session.database
      );

      return NextResponse.json({
        success: true,
        temporaryPassword,
        message: "Password updated. This temporary credential is shown only once; share it through an approved secure channel.",
      });
    }

    return NextResponse.json({ error: "Invalid administrative action requested." }, { status: 400 });
  } catch (err: unknown) {
    const status = (err as any)?.status || 500;
    const message = err instanceof Error ? err.message : "Failed to process administrative user mutation";
    return NextResponse.json({ error: message }, { status });
  }
}
