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

    const rawRx = await TrytonClient.execute<any[]>(
      session.username,
      session.userId,
      session.sessionToken,
      "gnuhealth.prescription.order",
      "search_read",
      [
        domain,
        0,
        20,
        [["id", "DESC"]],
        ["id", "patient", "healthprof", "prescription_date", "state", "prescription_line"],
      ]
    );

    // Resolve patient names
    const patientIds = rawRx
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

    // Resolve prescription lines
    const allLineIds = rawRx.flatMap((r) => r.prescription_line || []);
    let linesMap: Record<number, any> = {};
    if (allLineIds.length > 0) {
      try {
        const lines = await TrytonClient.execute<any[]>(
          session.username,
          session.userId,
          session.sessionToken,
          "gnuhealth.prescription.line",
          "search_read",
          [[["id", "in", allLineIds]], 0, allLineIds.length, null, [
            "id",
            "medicament",
            "dose",
            "dose_unit",
            "form",
            "route",
            "frequency",
            "duration",
          ]]
        );
        linesMap = lines.reduce((acc, l) => {
          acc[l.id] = l;
          return acc;
        }, {} as Record<number, any>);
      } catch {
        // Fallback
      }
    }

    const prescriptions = rawRx.map((rx) => {
      const pid = typeof rx.patient === "number" ? rx.patient : rx.patient?.[0];
      const pat = patientsMap[pid] || {};
      const lineObjs = (rx.prescription_line || []).map((lid: number) => {
        const l = linesMap[lid] || {};
        const medName = Array.isArray(l.medicament) ? l.medicament[1] : null;
        return {
          id: l.id,
          medicament: medName,
          dose: l.dose == null ? null : String(l.dose),
          route: Array.isArray(l.route) ? l.route[1] : null,
          frequency: l.frequency == null ? null : String(l.frequency),
          duration: l.duration == null ? null : String(l.duration),
        };
      });

      return {
        id: rx.id,
        ref: String(rx.id),
        patientId: pid,
        patientName: pat.rec_name || null,
        puid: pat.puid || null,
        date: rx.prescription_date || null,
        state: rx.state || "unknown",
        lines: lineObjs,
      };
    });

    return NextResponse.json({ success: true, prescriptions });
  } catch (err: unknown) {
    const status = (err as any)?.status || 500;
    const message = err instanceof Error ? err.message : "Failed to load prescriptions";
    return NextResponse.json({ error: message }, { status });
  }
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized session" }, { status: 401 });
  }
  return NextResponse.json(
    { error: "Prescription writing is unavailable until native health records system prescription lines, validated dose units and frequencies, warning acknowledgement, and the create_prescription workflow are integrated." },
    { status: 501 }
  );
}
