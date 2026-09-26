import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth-session";
import { TrytonClient } from "@/lib/tryton-client";

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized session" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const patientId = searchParams.get("patientId");

  try {
    let domain: unknown[] = [];
    if (patientId) {
      domain = [["patient", "=", parseInt(patientId, 10)]];
    }

    const rawLabs = await TrytonClient.execute<any[]>(
      session.username,
      session.userId,
      session.sessionToken,
      "gnuhealth.lab",
      "search_read",
      [domain, 0, 50, [["id", "DESC"]], ["id", "patient", "test", "date_analysis", "state", "results"]]
    );

    // Resolve patient details
    const patientIds = rawLabs
      .map((l) => (typeof l.patient === "number" ? l.patient : l.patient?.[0]))
      .filter(Boolean);
    let patientsMap: Record<number, any> = {};

    if (patientIds.length > 0) {
      try {
        const patients = await TrytonClient.execute<any[]>(
          session.username,
          session.userId,
          session.sessionToken,
          "gnuhealth.patient",
          "search_read",
          [[["id", "in", patientIds]], 0, patientIds.length, null, ["id", "puid", "rec_name"]]
        );
        patientsMap = patients.reduce((acc, p) => {
          acc[p.id] = p;
          return acc;
        }, {} as Record<number, any>);
      } catch {
        // Fallback
      }
    }

    const labOrders = rawLabs.map((l) => {
      const pid = typeof l.patient === "number" ? l.patient : l.patient?.[0];
      const pat = patientsMap[pid] || {};
      const testName = Array.isArray(l.test) ? l.test[1] : null;

      return {
        id: l.id,
        patientId: pid,
        patientName: pat.rec_name || null,
        puid: pat.puid || null,
        testName,
        orderRef: String(l.id),
        dateAnalysis: l.date_analysis || null,
        state: l.state || "unknown",
        results: l.results || null,
      };
    });

    return NextResponse.json({ success: true, labOrders });
  } catch (err: unknown) {
    const status = (err as any)?.status || 500;
    const message = err instanceof Error ? err.message : "Failed to load laboratory orders";
    return NextResponse.json({ error: message }, { status });
  }
}

export async function POST(_req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized session" }, { status: 401 });
  }
  return NextResponse.json(
    { error: "Laboratory order creation and result entry are unavailable until the native health records system criteria and certification workflow is integrated." },
    { status: 501 }
  );
}
