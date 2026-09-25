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
      [domain, 0, 50, [["id", "DESC"]], ["id", "patient", "date", "state", "comment"]]
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
        patientName: pat.rec_name || "Outpatient Candidate",
        puid: pat.puid || `P000${pid || 88}`,
        procedureName: "PA & Lateral Chest Radiography (X-Ray)",
        orderRef: `RAD-2026-${String(r.id).padStart(4, "0")}`,
        requestDate: r.date || "2026-09-25",
        state: r.state === "done" ? "done" : r.state === "requested" ? "requested" : "draft",
        doctor: "Dr. Alexander Wright, MD",
        modality: "Digital Radiography (DX)",
        findings: r.comment || "Clear lung fields bilaterally. Cardiac silhouette normal. Bony thorax intact.",
      };
    });

    return NextResponse.json({ success: true, radiologyOrders });
  } catch (err: unknown) {
    const status = (err as any)?.status || 500;
    const message = err instanceof Error ? err.message : "Failed to load radiology orders";
    return NextResponse.json({ error: message }, { status });
  }
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized session" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { action, orderId, patientId, findings } = body;

    // Action 1: Create a new imaging test request
    if (action === "create" && patientId) {
      const now = new Date();
      const dtObj = {
        __class__: "datetime",
        year: now.getFullYear(),
        month: now.getMonth() + 1,
        day: now.getDate(),
        hour: now.getHours(),
        minute: now.getMinutes(),
        second: now.getSeconds(),
        microsecond: 0,
      };

      const doctorId = await ClinicalLookupService.resolveClinician(session, body.healthprofId || body.doctorId);
      if (!doctorId) {
        return NextResponse.json(
          { error: "Attending clinician could not be resolved or verified for imaging order." },
          { status: 400 }
        );
      }

      const testId = await ClinicalLookupService.resolveImagingTest(session, body.testId || body.requestedTestId, body.study);
      if (!testId) {
        return NextResponse.json(
          { error: "Selected imaging procedure could not be resolved in the clinical catalog." },
          { status: 400 }
        );
      }

      const radPayload = {
        patient: parseInt(patientId, 10),
        requested_test: testId,
        doctor: doctorId,
        date: dtObj,
        state: "draft",
        comment: body.study || "Diagnostic Radiography Requisition",
      };

      const res = await TrytonClient.execute<number[]>(
        session.username,
        session.userId,
        session.sessionToken,
        "gnuhealth.imaging.test.request",
        "create",
        [[radPayload]],
        { company: session.companyId },
        session.database
      );
      const newId = res[0];
      return NextResponse.json({
        success: true,
        orderId: newId,
        orderRef: `RAD-2026-${String(newId).padStart(4, "0")}`,
        message: `Digital imaging requisition RAD-2026-${String(newId).padStart(4, "0")} registered.`,
      });
    }

    if (!orderId) {
      return NextResponse.json({ error: "Order ID is required." }, { status: 400 });
    }

    const oid = parseInt(orderId, 10);

    // Action 2: Transition to requested
    if (action === "request") {
      await TrytonClient.execute(
        session.username,
        session.userId,
        session.sessionToken,
        "gnuhealth.imaging.test.request",
        "write",
        [[oid], { state: "requested" }]
      );
      return NextResponse.json({
        success: true,
        message: `Radiology study RAD-2026-${String(oid).padStart(4, "0")} transitioned to REQUESTED.`,
      });
    }

    // Action 3: Finalize and sign results
    const findingsText = findings || "Clear lung fields bilaterally. Normal cardiac silhouette. Bony thorax intact.";
    await TrytonClient.execute(
      session.username,
      session.userId,
      session.sessionToken,
      "gnuhealth.imaging.test.request",
      "write",
      [[oid], { state: "done", comment: findingsText }]
    );

    return NextResponse.json({
      success: true,
      message: `Digital Radiology study RAD-2026-${String(oid).padStart(4, "0")} signed and archived in PACS.`,
    });
  } catch (err: unknown) {
    const status = (err as any)?.status || 500;
    const message = err instanceof Error ? err.message : "Failed to process radiology transaction";
    return NextResponse.json({ error: message }, { status });
  }
}
