import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth-session";
import { TrytonClient } from "@/lib/tryton-client";
import { ClinicalLookupService } from "@/lib/clinical-lookup";

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

    const rawRads = await TrytonClient.execute<any[]>(
      session.username,
      session.userId,
      session.sessionToken,
      "gnuhealth.imaging.test.request",
      "search_read",
      [domain, 0, 50, [["id", "DESC"]], ["id", "patient", "requested_test", "doctor", "date", "state", "comment"]]
    );

    // Resolve patient details
    const patientIds = rawRads
      .map((r) => (typeof r.patient === "number" ? r.patient : r.patient?.[0]))
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

    const radiologyOrders = rawRads.map((r) => {
      const pid = typeof r.patient === "number" ? r.patient : r.patient?.[0];
      const pat = patientsMap[pid] || {};

      return {
        id: r.id,
        patientId: pid,
        patientName: pat.rec_name || null,
        puid: pat.puid || null,
        procedureName: Array.isArray(r.requested_test) ? r.requested_test[1] : null,
        orderRef: String(r.id),
        requestDate: r.date || null,
        state: r.state || "unknown",
        doctor: Array.isArray(r.doctor) ? r.doctor[1] : null,
        modality: null,
        findings: r.comment || null,
      };
    });

    return NextResponse.json({ success: true, radiologyOrders });
  } catch (err: unknown) {
    const status = (err as any)?.status || 500;
    const message = err instanceof Error ? err.message : "Failed to load radiology orders";
    return NextResponse.json({ error: message }, { status });
  }
}

export async function POST(_req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized session" }, { status: 401 });
  }
  return NextResponse.json(
    { error: "Imaging order creation and result finalization are unavailable until the native health records system imaging workflow is integrated." },
    { status: 501 }
  );
}