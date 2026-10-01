import { NextRequest, NextResponse } from "next/server";
import { getSession, updateSession } from "@/lib/auth-session";
import { resolveTenant } from "@/lib/tenant";

// Switch the active hospital inside a group customer. The list a user may choose from was fixed at sign-in
// (hospitals whose company the backend allows this user to use) and travels in the encrypted session
// cookie, so a request can never pick a hospital the user was not given. The company in the session is then
// what every backend call is made under; Tryton itself refuses a company outside the user's allowed set.

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized session" }, { status: 401 });
  return NextResponse.json({
    success: true,
    active: session.hospitalId ? { id: session.hospitalId, name: session.hospitalName } : null,
    hospitals: session.hospitals || [],
  });
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized session" }, { status: 401 });
  if (!session.hospitals || session.hospitals.length === 0) {
    return NextResponse.json({ error: "This account is not part of a multi-hospital customer." }, { status: 400 });
  }
  let body: { hospitalId?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "A hospital is required." }, { status: 400 });
  }
  const wanted = typeof body.hospitalId === "string" ? body.hospitalId : "";
  if (!session.hospitals.some((h) => h.id === wanted)) {
    return NextResponse.json({ error: "You do not have access to that hospital." }, { status: 403 });
  }
  // Company and institution come from the server-side registry, never from the request.
  const hospital = resolveTenant(session.tenantId).hospitals?.find((h) => h.id === wanted);
  if (!hospital) {
    return NextResponse.json({ error: "That hospital is no longer available." }, { status: 404 });
  }
  await updateSession({
    companyId: hospital.companyId,
    hospitalId: hospital.id,
    hospitalName: hospital.name,
    institutionId: hospital.institutionId,
  });
  return NextResponse.json({ success: true, active: { id: hospital.id, name: hospital.name } });
}
