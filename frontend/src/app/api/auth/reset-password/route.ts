import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    { error: "Self-service password recovery is not configured. Contact an authorized health records system administrator." },
    { status: 503 }
  );
}
