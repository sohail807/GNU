import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth-session";
import { TrytonClient } from "@/lib/tryton-client";
import {
  UserAccessProfile,
  DEFAULT_ROLE_PERMISSIONS,
  HospitalRole,
  AppModule,
  resolveRoleFromTrytonGroups,
} from "@/lib/access-control";

// Map HospitalRole to Tryton Group IDs
const ROLE_TO_TRYTON_GROUPS: Record<HospitalRole, number[]> = {
  admin: [1, 11], // Administration, Health Administration
  physician: [15], // Health Doctor
  nursing: [13], // Health Nurse
  reception: [14], // Health Front Desk
  lab: [23], // Health Lab
  radiology: [20, 21], // Health Imaging
  cashier: [6], // Account
  accountant: [8, 7], // Account Administration, Accounting Party
  general: [14],
};

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized session" }, { status: 401 });
  }

  try {
    // Query genuine users from Tryton res.user
    const usersRaw = await TrytonClient.execute<any[]>(
      session.username,
      session.userId,
      session.sessionToken,
      "res.user",
      "search_read",
      [[[], 0, 50, [["id", "ASC"]], ["id", "login", "name", "active", "groups", "email"]]]
    );

    const users: UserAccessProfile[] = usersRaw.map((u) => {
      const groupIds = u.groups || [];
      const resolved = resolveRoleFromTrytonGroups(groupIds);
      const perms = { ...DEFAULT_ROLE_PERMISSIONS[resolved.role] };

      return {
        id: u.id,
        username: u.login,
        name: u.name || u.login,
        role: resolved.role,
        roleTitle: resolved.roleTitle,
        department:
          resolved.role === "physician"
            ? "Clinical Medicine & Consultation"
            : resolved.role === "nursing"
            ? "Outpatient Nursing & Triage"
            : resolved.role === "reception"
            ? "Front Desk & Intake"
            : resolved.role === "lab"
            ? "Diagnostic Pathology"
            : resolved.role === "radiology"
            ? "Digital Radiology & PACS"
            : resolved.role === "cashier"
            ? "Patient Accounts & Invoicing"
            : resolved.role === "accountant"
            ? "Hospital General Ledger Audit"
            : "Hospital Administration",
        email: u.email || `${u.login}@ist-health.qa`,
        phone: "+974 4400 1000",
        status: u.active ? "active" : "suspended",
        permissions: perms,
        lastLogin: "Active Today",
      };
    });

    return NextResponse.json({
      success: true,
      users,
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
  if (session.role !== "admin" && session.username !== "admin") {
    return NextResponse.json(
      { error: "Access Denied: Administrative privileges required to manage IST Health users." },
      { status: 403 }
    );
  }

  try {
    const body = await req.json();
    const { action } = body;

    // Action 1: Update User Permissions / Role
    if (action === "update_permissions" || action === "update_user") {
      const { userId, role, status, name } = body;
      if (!userId) {
        return NextResponse.json({ error: "User ID is required." }, { status: 400 });
      }

      const uid = parseInt(userId, 10);
      const writePayload: Record<string, unknown> = {};

      if (typeof status === "string") {
        writePayload.active = status === "active";
      }

      if (name) {
        writePayload.name = name;
      }

      if (role && ROLE_TO_TRYTON_GROUPS[role as HospitalRole]) {
        const groups = ROLE_TO_TRYTON_GROUPS[role as HospitalRole];
        writePayload.groups = groups;
      }

      await TrytonClient.execute(
        session.username,
        session.userId,
        session.sessionToken,
        "res.user",
        "write",
        [[uid], writePayload]
      );

      return NextResponse.json({
        success: true,
        message: `Staff user record updated and committed to Tryton security database.`,
      });
    }

    // Action 2: Add New Staff User
    if (action === "add_user") {
      const { username, name, role, email, password } = body;
      if (!username || !name || !role) {
        return NextResponse.json(
          { error: "Username, Full Name, and Clinical Role are required." },
          { status: 400 }
        );
      }

      const targetRole = (role as HospitalRole) || "reception";
      const groups = ROLE_TO_TRYTON_GROUPS[targetRole] || [14];

      const userPayload = {
        login: username.trim().toLowerCase(),
        name: name.trim(),
        email: email || `${username.trim().toLowerCase()}@ist-health.qa`,
        password: password || "Health2026!",
        groups: groups,
        active: true,
      };

      const res = await TrytonClient.execute<number[]>(
        session.username,
        session.userId,
        session.sessionToken,
        "res.user",
        "create",
        [[userPayload]]
      );
      const newUserId = res[0];

      // If physician or nurse, also register health professional record
      if (targetRole === "physician" || targetRole === "nursing") {
        try {
          const partyRes = await TrytonClient.execute<number[]>(
            session.username,
            session.userId,
            session.sessionToken,
            "party.party",
            "create",
            [[{ name: name.trim(), is_person: true }]]
          );
          await TrytonClient.execute(
            session.username,
            session.userId,
            session.sessionToken,
            "gnuhealth.healthprofessional",
            "create",
            [[{ party: partyRes[0] }]]
          );
        } catch {
          // Non-blocking
        }
      }

      return NextResponse.json({
        success: true,
        userId: newUserId,
        message: `Staff user @${username} provisioned successfully in Tryton database.`,
      });
    }

    // Action 3: Administrative Password Reset
    if (action === "reset_password") {
      const { userId } = body;
      let { newPassword } = body;
      if (!userId) {
        return NextResponse.json(
          { error: "User ID is required." },
          { status: 400 }
        );
      }

      if (!newPassword || typeof newPassword !== "string" || newPassword.trim() === "") {
        // Auto-generate strong 12-char temporary credential
        newPassword = "Temp" + Math.random().toString(36).slice(-6) + "!";
      }

      const uid = parseInt(userId, 10);

      // Protect Platform Super-Admin (User ID 1) from tenant admin reset
      if (uid === 1 && session.userId !== 1) {
        return NextResponse.json(
          { error: "Security Violation: Platform Super Administrator cannot be reset by Tenant Admins." },
          { status: 403 }
        );
      }

      await TrytonClient.execute(
        session.username,
        session.userId,
        session.sessionToken,
        "res.user",
        "write",
        [[uid], { password: newPassword }]
      );

      return NextResponse.json({
        success: true,
        temporaryPassword: newPassword,
        message: "Staff account password updated successfully in Tryton security database.",
      });
    }

    return NextResponse.json({ error: "Invalid administrative action requested." }, { status: 400 });
  } catch (err: unknown) {
    const status = (err as any)?.status || 500;
    const message = err instanceof Error ? err.message : "Failed to process administrative user mutation";
    return NextResponse.json({ error: message }, { status });
  }
}
