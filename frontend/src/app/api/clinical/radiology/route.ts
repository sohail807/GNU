import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth-session";
import { TrytonClient } from "@/lib/tryton-client";
import { ClinicalLookupService } from "@/lib/clinical-lookup";
import { hasModuleAccess } from "@/lib/access-control";

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized session" }, { status: 401 });
  }

  if (
    !hasModuleAccess(session.role, "radiology") &&
    !hasModuleAccess(session.role, "physician") &&
    !hasModuleAccess(session.role, "nursing") &&
    !hasModuleAccess(session.role, "patient_chart") &&
    !hasModuleAccess(session.role, "admin")
  ) {
    return NextResponse.json({ error: "Your role does not have permission for this module." }, { status: 403 });
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
    ,
      { company: session.companyId },
      session.database
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
        ,
          { company: session.companyId },
          session.database
        );
        patientsMap = patients.reduce((acc, p) => {
          acc[p.id] = p;
          return acc;
        }, {} as Record<number, any>);
      } catch {
        // Fallback
      }
    }

    // Resolve doctor and requested-test names via explicit lookups rather than
    // assuming search_read inlines many2one fields as [id, name] tuples - that
    // shape isn't guaranteed across every model, and silently falling back to
    // null produced blank "Study" / "Referring MD" fields for real records.
    const doctorIds = rawRads
      .map((r) => (typeof r.doctor === "number" ? r.doctor : r.doctor?.[0]))
      .filter(Boolean);
    let doctorsMap: Record<number, any> = {};
    if (doctorIds.length > 0) {
      try {
        const docs = await TrytonClient.execute<any[]>(
          session.username,
          session.userId,
          session.sessionToken,
          "gnuhealth.healthprofessional",
          "search_read",
          [[["id", "in", doctorIds]], 0, doctorIds.length, null, ["id", "rec_name"]],
          { company: session.companyId },
          session.database
        );
        doctorsMap = docs.reduce((acc, d) => {
          acc[d.id] = d;
          return acc;
        }, {} as Record<number, any>);
      } catch {
        // Fallback
      }
    }

    const testIds = rawRads
      .map((r) => (typeof r.requested_test === "number" ? r.requested_test : r.requested_test?.[0]))
      .filter(Boolean);
    let testsMap: Record<number, any> = {};
    if (testIds.length > 0) {
      try {
        const tests = await TrytonClient.execute<any[]>(
          session.username,
          session.userId,
          session.sessionToken,
          "gnuhealth.imaging.test",
          "search_read",
          [[["id", "in", testIds]], 0, testIds.length, null, ["id", "name"]],
          { company: session.companyId },
          session.database
        );
        testsMap = tests.reduce((acc, t) => {
          acc[t.id] = t;
          return acc;
        }, {} as Record<number, any>);
      } catch {
        // Fallback
      }
    }

    const radiologyOrders = rawRads.map((r) => {
      const pid = typeof r.patient === "number" ? r.patient : r.patient?.[0];
      const pat = patientsMap[pid] || {};
      const did = typeof r.doctor === "number" ? r.doctor : r.doctor?.[0];
      const tid = typeof r.requested_test === "number" ? r.requested_test : r.requested_test?.[0];
      const d = r.date;
      const dateStr = d?.year
        ? `${d.year}-${String(d.month).padStart(2, "0")}-${String(d.day).padStart(2, "0")}`
        : null;

      return {
        id: r.id,
        patientId: pid,
        patientName: pat.rec_name || null,
        puid: pat.puid || null,
        procedureName: testsMap[tid]?.name || null,
        orderRef: String(r.id),
        requestDate: dateStr,
        state: r.state || "unknown",
        doctor: doctorsMap[did]?.rec_name || null,
        modality: null,
        findings: r.comment || null,
      };
    });

    // Imaging test catalog, loaded live so the "new request" form can only ever
    // reference a study type that actually exists in this tenant.
    let testTypes: { id: number; name: string }[] = [];
    try {
      const types = await TrytonClient.execute<any[]>(
        session.username,
        session.userId,
        session.sessionToken,
        "gnuhealth.imaging.test",
        "search_read",
        [[], 0, 50, [["name", "ASC"]], ["id", "name"]],
        { company: session.companyId },
        session.database
      );
      testTypes = (types || []).map((t) => ({ id: t.id, name: t.name }));
    } catch {
      // Leave testTypes empty rather than fail the whole orders list
    }

    return NextResponse.json({ success: true, radiologyOrders, testTypes });
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
  if (!hasModuleAccess(session.role, "radiology")) {
    return NextResponse.json({ error: "Your role does not have permission for this module." }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { action, patientId, testId, studyName, requestId, findings } = body;

    if (action === "create") {
      const pid = Number(patientId);
      if (!Number.isSafeInteger(pid) || pid <= 0) {
        return NextResponse.json({ error: "A valid patient ID is required." }, { status: 400 });
      }

      const doctorId = await ClinicalLookupService.resolveClinician(session);
      if (!doctorId) {
        return NextResponse.json(
          { error: "Requesting health professional could not be resolved for this session." },
          { status: 400 }
        );
      }

      const testTypeId = await ClinicalLookupService.resolveImagingTest(session, testId, studyName);
      if (!testTypeId) {
        return NextResponse.json(
          { error: "No matching imaging test type could be resolved in the catalog." },
          { status: 400 }
        );
      }

      const now = new Date();
      const dateObj = {
        __class__: "datetime",
        year: now.getUTCFullYear(),
        month: now.getUTCMonth() + 1,
        day: now.getUTCDate(),
        hour: now.getUTCHours(),
        minute: now.getUTCMinutes(),
        second: now.getUTCSeconds(),
        microsecond: 0,
      };

      const created = await TrytonClient.execute<number[]>(
        session.username,
        session.userId,
        session.sessionToken,
        "gnuhealth.imaging.test.request",
        "create",
        [[{ patient: pid, doctor: doctorId, requested_test: testTypeId, date: dateObj }]],
        { company: session.companyId },
        session.database
      );

      return NextResponse.json({
        success: true,
        orderId: created[0],
        message: `Imaging request #${created[0]} scheduled.`,
      });
    }

    if (action === "finalize" || action === "sign") {
      const rid = Number(requestId ?? body.orderId);
      if (!Number.isSafeInteger(rid) || rid <= 0) {
        return NextResponse.json({ error: "A valid imaging request ID is required." }, { status: 400 });
      }
      if (typeof findings !== "string" || !findings.trim()) {
        return NextResponse.json({ error: "Diagnostic findings are required to finalize the study." }, { status: 400 });
      }

      const doctorId = await ClinicalLookupService.resolveClinician(session);
      if (!doctorId) {
        return NextResponse.json(
          { error: "Reporting health professional could not be resolved for this session." },
          { status: 400 }
        );
      }

      const [reqRecord] = await TrytonClient.execute<any[]>(
        session.username,
        session.userId,
        session.sessionToken,
        "gnuhealth.imaging.test.request",
        "read",
        [[rid], ["patient", "requested_test"]],
        { company: session.companyId },
        session.database
      );
      if (!reqRecord) {
        return NextResponse.json({ error: "Imaging request not found." }, { status: 404 });
      }
      const patRel = reqRecord.patient;
      const testRel = reqRecord.requested_test;

      const now = new Date();
      const dateObj = {
        __class__: "datetime",
        year: now.getUTCFullYear(),
        month: now.getUTCMonth() + 1,
        day: now.getUTCDate(),
        hour: now.getUTCHours(),
        minute: now.getUTCMinutes(),
        second: now.getUTCSeconds(),
        microsecond: 0,
      };

      await TrytonClient.execute(
        session.username,
        session.userId,
        session.sessionToken,
        "gnuhealth.imaging.test.result",
        "create",
        [[{
          request: rid,
          patient: Array.isArray(patRel) ? patRel[0] : patRel,
          requested_test: Array.isArray(testRel) ? testRel[0] : testRel,
          doctor: doctorId,
          date: dateObj,
          comment: findings.trim(),
        }]],
        { company: session.companyId },
        session.database
      );

      await TrytonClient.execute(
        session.username,
        session.userId,
        session.sessionToken,
        "gnuhealth.imaging.test.request",
        "write",
        [[rid], { state: "done", comment: findings.trim() }],
        { company: session.companyId },
        session.database
      );

      return NextResponse.json({
        success: true,
        message: `Imaging request #${rid} finalized with diagnostic findings.`,
      });
    }

    return NextResponse.json({ error: `Unsupported radiology action: ${action}` }, { status: 400 });
  } catch (err: unknown) {
    const status = (err as any)?.status || 500;
    const message = err instanceof Error ? err.message : "Radiology transaction failed";
    return NextResponse.json({ error: message }, { status });
  }
}