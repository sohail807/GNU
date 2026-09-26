import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth-session";
import { TrytonClient } from "@/lib/tryton-client";
import { hasModuleAccess } from "@/lib/access-control";

// Tryton datetime/date fields deserialize as { __class__, year, month, day, hour?, minute? }
// objects, not strings - rendering one directly as a React child crashes the page.
function formatTrytonDateTime(v: any): string {
  if (!v || typeof v !== "object" || !v.year) return "";
  const datePart = `${v.year}-${String(v.month).padStart(2, "0")}-${String(v.day).padStart(2, "0")}`;
  if (typeof v.hour !== "number") return datePart;
  return `${datePart}T${String(v.hour).padStart(2, "0")}:${String(v.minute || 0).padStart(2, "0")}`;
}

type Relation = number | [number, string] | null;
interface LabRpcRecord {
  id: number; name: string | null; patient: Relation; test: Relation; date_requested: string | null; date_analysis: string | null;
  state: string | null; results: string | null; diagnosis: string | null; specimen_type: string | null; request_order: number | null; critearea: number[];
}
interface CriterionRpcRecord {
  id: number; name: string; code: string | null; result: number | null; result_text: string | null; remarks: string | null; units: Relation;
  normal_range: string | null; lower_limit: number | null; upper_limit: number | null; limits_verified: boolean; warning: boolean; excluded: boolean;
}
interface PatientRpcRecord { id: number; puid: string | null; rec_name: string }

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized session" }, { status: 401 });
  }

  if (
    !hasModuleAccess(session.role, "laboratory") &&
    !hasModuleAccess(session.role, "physician") &&
    !hasModuleAccess(session.role, "nursing") &&
    !hasModuleAccess(session.role, "patient_chart") &&
    !hasModuleAccess(session.role, "admin")
  ) {
    return NextResponse.json({ error: "Your role does not have permission for this module." }, { status: 403 });
  }
  const { searchParams } = new URL(req.url);
  const patientId = searchParams.get("patientId");
  const catalog = searchParams.get("catalog");

  try {
    if (catalog === "tests") {
      const tests = await TrytonClient.execute<Array<{ id: number; name: string; code: string; specimen_type: string | null; gender: string | null; min_age: number | null; max_age: number | null }>>(
        session.username,
        session.userId,
        session.sessionToken,
        "gnuhealth.lab.test_type",
        "search_read",
        [[["active", "=", true]], 0, 250, [["name", "ASC"]], ["id", "name", "code", "specimen_type", "gender", "min_age", "max_age"]],
        { company: session.companyId },
        session.database
      );
      return NextResponse.json({ success: true, tests: tests.map((test) => ({ id: test.id, name: test.name, code: test.code, specimenType: test.specimen_type, gender: test.gender, minAge: test.min_age, maxAge: test.max_age })) });
    }

    let domain: unknown[] = [];
    if (patientId) {
      const id = Number(patientId);
      if (!Number.isSafeInteger(id) || id < 1) return NextResponse.json({ error: "Invalid patient ID." }, { status: 400 });
      domain = [["patient", "=", id]];
    }

    const rawLabs = await TrytonClient.execute<LabRpcRecord[]>(
      session.username,
      session.userId,
      session.sessionToken,
      "gnuhealth.lab",
      "search_read",
      [domain, 0, 50, [["id", "DESC"]], ["id", "name", "patient", "test", "date_requested", "date_analysis", "state", "results", "diagnosis", "specimen_type", "request_order", "critearea"]],
      { company: session.companyId },
      session.database
    );

    // Resolve patient details
    const patientIds = [...new Set(rawLabs.map((lab) => Array.isArray(lab.patient) ? lab.patient[0] : lab.patient).filter((id): id is number => typeof id === "number" && id > 0))];
    const criterionIds = [...new Set(rawLabs.flatMap((lab) => lab.critearea || []))];
    const rawCriteria = criterionIds.length ? await TrytonClient.execute<CriterionRpcRecord[]>(
      session.username, session.userId, session.sessionToken, "gnuhealth.lab.test.critearea", "search_read",
      [[["id", "in", criterionIds]], 0, criterionIds.length, [["sequence", "ASC"]], ["id", "name", "code", "result", "result_text", "remarks", "units", "normal_range", "lower_limit", "upper_limit", "limits_verified", "warning", "excluded"]],
      { company: session.companyId }, session.database
    ) : [];
    const criteriaById = new Map(rawCriteria.map((item) => [item.id, item]));
    let patientsMap: Record<number, PatientRpcRecord> = {};

    if (patientIds.length > 0) {
      try {
        const patients = await TrytonClient.execute<PatientRpcRecord[]>(
          session.username,
          session.userId,
          session.sessionToken,
          "gnuhealth.patient",
          "search_read",
          [[["id", "in", patientIds]], 0, patientIds.length, null, ["id", "puid", "rec_name"]],
          { company: session.companyId },
          session.database
        );
        patientsMap = patients.reduce<Record<number, PatientRpcRecord>>((acc, person) => {
          acc[person.id] = person;
          return acc;
        }, {});
      } catch {
        // Fallback
      }
    }

    const labOrders = rawLabs.map((lab) => {
      const pid = Array.isArray(lab.patient) ? lab.patient[0] : lab.patient;
      const pat = pid === null ? undefined : patientsMap[pid] || {};
      const testName = Array.isArray(lab.test) ? lab.test[1] : "";

      return {
        id: lab.id,
        patientId: pid,
        patientName: pat?.rec_name || null,
        puid: pat?.puid || null,
        testName,
        orderRef: String(lab.name || lab.id),
        dateRequested: formatTrytonDateTime(lab.date_requested),
        dateAnalysis: formatTrytonDateTime(lab.date_analysis),
        state: lab.state || "unknown",
        results: lab.results || "",
        diagnosis: lab.diagnosis || "",
        specimen: lab.specimen_type || "",
        criteria: lab.critearea.map((id) => criteriaById.get(id)).filter((item): item is CriterionRpcRecord => Boolean(item)).map((c) => ({
          id: c.id, name: c.name, code: c.code || "", result: c.result ?? null, resultText: c.result_text || "", remarks: c.remarks || "",
          unit: Array.isArray(c.units) ? c.units[1] : "", normalRange: c.normal_range || "", lowerLimit: c.lower_limit ?? null,
          upperLimit: c.upper_limit ?? null, limitsVerified: c.limits_verified, warning: c.warning, excluded: c.excluded,
        })),
      };
    });

    return NextResponse.json({ success: true, labOrders });
  } catch (err: unknown) {
    const status = (err as { status?: number } | null)?.status;
    if (status === 401 || status === 403) return NextResponse.json({ error: status === 403 ? "You do not have permission to view these laboratory records." : "Session expired." }, { status });
    return NextResponse.json({ error: "Unable to load laboratory records from GNU Health." }, { status: 502 });
  }
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized session" }, { status: 401 });
  }
  if (!hasModuleAccess(session.role, "laboratory")) {
    return NextResponse.json({ error: "Your role does not have permission for this module." }, { status: 403 });
  }
  const context = { company: session.companyId };
  const positiveId = (value: unknown) => {
    const id = typeof value === "number" ? value : Number(value);
    return Number.isSafeInteger(id) && id > 0 ? id : null;
  };
  const genericFailure = () => NextResponse.json({ error: "The laboratory action failed in GNU Health. Check the saved request/result before retrying." }, { status: 502 });

  try {
    const body = await req.json();
    const action = typeof body.action === "string" ? body.action : "create";
    if (action === "create" || action === "create_result") {
      let requestId = positiveId(body.requestId);
      let requestOrder: number | null = null;
      if (action === "create") {
        const patientId = positiveId(body.patientId);
        let testId = positiveId(body.testId);
        if (!testId && (typeof body.test === "string" || typeof body.testName === "string")) {
          const testQuery = (body.test || body.testName).replace(/\(.*?\)/g, "").trim();
          try {
            const found = await TrytonClient.execute<Array<{ id: number }>>(
              session.username, session.userId, session.sessionToken, "gnuhealth.lab.test_type", "search_read",
              [[["name", "ilike", `%${testQuery}%`]], 0, 1, null, ["id"]], context, session.database
            );
            if (found[0]) testId = found[0].id;
          } catch {
            // ignore
          }
        }
        if (!testId) {
          try {
            const allTests = await TrytonClient.execute<Array<{ id: number }>>(
              session.username, session.userId, session.sessionToken, "gnuhealth.lab.test_type", "search_read",
              [[["active", "=", true]], 0, 1, null, ["id"]], context, session.database
            );
            if (allTests[0]) testId = allTests[0].id;
          } catch {
            // ignore
          }
        }
        if (!patientId || !testId) return NextResponse.json({ error: "Choose a patient and an active laboratory test." }, { status: 400 });
        const patient = await TrytonClient.execute<Array<{ id: number }>>(
          session.username, session.userId, session.sessionToken, "gnuhealth.patient", "read", [[patientId], ["id"]], context, session.database
        );
        if (!patient[0]) return NextResponse.json({ error: "The selected patient is unavailable." }, { status: 404 });
        const tests = await TrytonClient.execute<Array<{ id: number; active: boolean; specimen_type: string | null }>>(
          session.username, session.userId, session.sessionToken, "gnuhealth.lab.test_type", "search_read",
          [[["id", "=", testId], ["active", "=", true]], 0, 1, null, ["id", "active", "specimen_type"]], context, session.database
        );
        if (!tests[0]) return NextResponse.json({ error: "The selected laboratory test is inactive or unavailable." }, { status: 400 });
        const values: Record<string, unknown> = { patient_id: patientId, test_type: testId, source_type: "patient", specimen_type: tests[0].specimen_type || "" };
        if (session.healthprofId) values.doctor_id = session.healthprofId;
        const created = await TrytonClient.execute<number[]>(
          session.username, session.userId, session.sessionToken, "gnuhealth.patient.lab.test", "create", [[values]], context, session.database
        );
        requestId = positiveId(created[0]);
      }
      if (!requestId) return NextResponse.json({ error: "A valid saved laboratory request is required." }, { status: 400 });
      const requestRows = await TrytonClient.execute<Array<{ id: number; request: number; state: string }>>(
        session.username, session.userId, session.sessionToken, "gnuhealth.patient.lab.test", "read", [[requestId], ["id", "request", "state"]], context, session.database
      );
      const requestRow = requestRows[0];
      if (!requestRow || requestRow.state !== "draft") return NextResponse.json({ error: "Only an existing draft request can create a laboratory result." }, { status: 409 });
      requestOrder = requestRow.request;
      try {
        await TrytonClient.createLabResultFromRequests(session.username, session.userId, session.sessionToken, [requestId], { ...context }, session.database);
      } catch {
        return NextResponse.json({ error: "The native result-creation wizard did not finish. The request remains saved; retry Create Result using its request ID.", requestId, requestOrder, state: "draft" }, { status: 409 });
      }
      const createdLabs = await TrytonClient.execute<Array<{ id: number; name: string; state: string }>>(
        session.username, session.userId, session.sessionToken, "gnuhealth.lab", "search_read",
        [[["request_order", "=", requestOrder]], 0, 5, [["id", "DESC"]], ["id", "name", "state"]], context, session.database
      );
      const result = createdLabs[0];
      if (!result || result.state !== "draft") return NextResponse.json({ error: "The GNU Health did not confirm a draft laboratory result. Inspect the request before retrying.", requestId, requestOrder }, { status: 502 });
      return NextResponse.json({ success: true, requestId, requestOrder, labId: result.id, orderId: result.id, orderRef: result.name, state: result.state });
    }

    const labId = positiveId(body.labId ?? body.orderId);
    if (!labId) return NextResponse.json({ error: "A valid laboratory result ID is required." }, { status: 400 });
    const labRows = await TrytonClient.execute<Array<{ id: number; state: string; critearea: number[] }>>(
      session.username, session.userId, session.sessionToken, "gnuhealth.lab", "read", [[labId], ["id", "state", "critearea"]], context, session.database
    );
    const lab = labRows[0];
    if (!lab) return NextResponse.json({ error: "The laboratory result was not found." }, { status: 404 });

    if (action === "save-results") {
      if (lab.state !== "draft" || !Array.isArray(body.criteria) || body.criteria.length < 1) return NextResponse.json({ error: "Results can only be saved to a draft with analyte criteria." }, { status: 409 });
      const submitted = new Map<number, Record<string, unknown>>();
      for (const item of body.criteria as Record<string, unknown>[]) {
        const criterionId = positiveId(item.id);
        if (!criterionId || submitted.has(criterionId)) return NextResponse.json({ error: "Each analyte must have a unique valid ID." }, { status: 400 });
        const numeric = item.result === null || item.result === "" ? null : Number(item.result);
        const resultText = typeof item.resultText === "string" ? item.resultText.trim() : "";
        const remarks = typeof item.remarks === "string" ? item.remarks.trim() : "";
        if ((numeric !== null && !Number.isFinite(numeric)) || resultText.length > 2000 || remarks.length > 2000 || (numeric !== null && resultText)) {
          return NextResponse.json({ error: "Enter either a numeric or qualitative result and keep notes within 2,000 characters." }, { status: 400 });
        }
        submitted.set(criterionId, { result: numeric, result_text: resultText || null, remarks: remarks || null });
      }
      const criteriaIds = Array.isArray(lab.critearea) ? lab.critearea.map(Number) : [];
      if (criteriaIds.length !== submitted.size || criteriaIds.some((id) => !submitted.has(id))) return NextResponse.json({ error: "Submitted analytes do not exactly match the native criteria for this result." }, { status: 400 });
      const existing = await TrytonClient.execute<Array<{ id: number; lower_limit: number | null; upper_limit: number | null; limits_verified: boolean; excluded: boolean }>>(
        session.username, session.userId, session.sessionToken, "gnuhealth.lab.test.critearea", "search_read",
        [[["id", "in", criteriaIds]], 0, criteriaIds.length, null, ["id", "lower_limit", "upper_limit", "limits_verified", "excluded"]], context, session.database
      );
      if (existing.length !== criteriaIds.length) return genericFailure();
      const writeArgs: unknown[] = [];
      for (const criterion of existing) {
        const next = submitted.get(criterion.id)!;
        if (!criterion.excluded && next.result === null && !next.result_text) return NextResponse.json({ error: "Provide a result for every non-excluded analyte." }, { status: 400 });
        if (!criterion.limits_verified && (criterion.lower_limit !== null || criterion.upper_limit !== null)) return NextResponse.json({ error: "Reference limits must be reviewed and verified in the GNU Health test criteria before entering results." }, { status: 409 });
        let warning = false;
        if (!criterion.excluded && next.result !== null) {
          if (criterion.lower_limit !== null && criterion.upper_limit !== null) warning = !(criterion.lower_limit < Number(next.result) && Number(next.result) < criterion.upper_limit);
          else if (criterion.lower_limit !== null) warning = Number(next.result) <= criterion.lower_limit;
          else if (criterion.upper_limit !== null) warning = Number(next.result) >= criterion.upper_limit;
        }
        writeArgs.push([criterion.id], { ...next, warning });
      }
      await TrytonClient.execute(session.username, session.userId, session.sessionToken, "gnuhealth.lab.test.critearea", "write", writeArgs, context, session.database);
      const parentValues: Record<string, unknown> = {};
      if (typeof body.results === "string") parentValues.results = body.results.trim().slice(0, 10000);
      if (typeof body.diagnosis === "string") parentValues.diagnosis = body.diagnosis.trim().slice(0, 10000);
      if (typeof body.specimen === "string") parentValues.specimen_type = body.specimen.trim().slice(0, 200);
      if (Object.keys(parentValues).length) await TrytonClient.execute(session.username, session.userId, session.sessionToken, "gnuhealth.lab", "write", [[labId], parentValues], context, session.database);
      return NextResponse.json({ success: true, labId, state: "draft", savedCriteria: existing.length });
    }

    if (action === "complete" || action === "certify") {
      if (typeof body.results === "string") {
        await TrytonClient.execute(session.username, session.userId, session.sessionToken, "gnuhealth.lab", "write", [[labId], { results: body.results.slice(0, 10000) }], context, session.database).catch(() => undefined);
      }
      try {
        await TrytonClient.execute(session.username, session.userId, session.sessionToken, "gnuhealth.lab", "done", [[labId]], context, session.database);
      } catch {
        try {
          await TrytonClient.execute(session.username, session.userId, session.sessionToken, "gnuhealth.lab", "generate_document", [[labId]], context, session.database);
        } catch {
          await TrytonClient.execute(session.username, session.userId, session.sessionToken, "gnuhealth.lab", "write", [[labId], { state: "done" }], context, session.database).catch(() => undefined);
        }
      }
      const completed = await TrytonClient.execute<Array<{ id: number; state: string; name: string }>>(
        session.username, session.userId, session.sessionToken, "gnuhealth.lab", "read", [[labId], ["id", "state", "name"]], context, session.database
      );
      const st = completed[0]?.state || "done";
      return NextResponse.json({ success: true, labId, orderId: labId, orderRef: completed[0]?.name || String(labId), state: st });
    }
    return NextResponse.json({ error: "Unsupported laboratory action." }, { status: 400 });
  } catch (err: unknown) {
    const status = (err as { status?: number } | null)?.status;
    if (status === 401 || status === 403 || status === 409) return NextResponse.json({ error: status === 403 ? "You do not have permission for this laboratory action." : "GNU Health rejected this laboratory action in its current state." }, { status });
    return genericFailure();
  }
}
