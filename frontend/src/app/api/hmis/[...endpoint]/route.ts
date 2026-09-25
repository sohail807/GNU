import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth-session";
import { TrytonClient } from "@/lib/tryton-client";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ endpoint: string[] }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized — valid session required" }, { status: 401 });
  }

  const { endpoint } = await params;
  const path = endpoint.join("/");
  // Format: [model]/[method], e.g. "gnuhealth.patient/search_read"
  const parts = path.split("/");
  if (parts.length < 2) {
    return NextResponse.json(
      { error: "Invalid RPC endpoint path. Expected /api/hmis/[model]/[method]" },
      { status: 400 }
    );
  }

  const model = parts.slice(0, -1).join("/");
  const method = parts[parts.length - 1];

  try {
    const body = await req.json().catch(() => ({}));
    const rpcParams = body.params || [];
    const rpcContext = body.context || {};

    const result = await TrytonClient.execute(
      session.username,
      session.userId,
      session.sessionToken,
      model,
      method,
      rpcParams,
      rpcContext
    );

    return NextResponse.json({ success: true, result });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Tryton RPC execution failure";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
