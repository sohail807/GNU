import { NextResponse } from "next/server";
import { clearSession, getSession } from "@/lib/auth-session";
import { TrytonClient } from "@/lib/tryton-client";

export async function POST() {
  const session = await getSession();
  let backendLogoutSucceeded = false;
  if (session) {
    try {
      await TrytonClient.logout(
        session.username,
        session.userId,
        session.sessionToken,
        session.database
      );
      backendLogoutSucceeded = true;
    } catch {
      // Always clear the browser session even if the backend is temporarily unavailable.
    }
  }
  await clearSession();
  return NextResponse.json({
    success: true,
    backendLogoutSucceeded,
    message: "Local session cleared.",
  });
}
