import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth-session";
import { DEFAULT_ROLE_PERMISSIONS, HospitalRole } from "@/lib/access-control";

export async function GET() {
  const session = await getSession();

  if (!session) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }

  const roleKey = (session.role as HospitalRole) || "general";
  const permissions = DEFAULT_ROLE_PERMISSIONS[roleKey] || DEFAULT_ROLE_PERMISSIONS.general;

  return NextResponse.json({
    authenticated: true,
    user: {
      username: session.username,
      userId: session.userId,
      role: session.role,
      name: session.name,
      tenantId: session.tenantId || "default",
      healthprofId: session.healthprofId,
      hospitalId: session.hospitalId,
      hospitalName: session.hospitalName,
      hospitals: session.hospitals,
      permissions,
    },
  });
}
