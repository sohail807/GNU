import { NextResponse } from "next/server";

// Self-service recovery is not available: no mail transport is configured and
// /api/auth/reset-password is disabled. Fail closed without minting tokens or writing
// anything to disk, rather than claiming an email was sent.
export async function POST() {
  return NextResponse.json(
    { error: "Self-service password recovery is not configured. Contact an authorized health records system administrator." },
    { status: 503 }
  );
}
