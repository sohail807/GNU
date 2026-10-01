import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth-session";
import { TrytonClient } from "@/lib/tryton-client";
import { hasModuleAccess } from "@/lib/access-control";
import { dischargeBlock } from "@/lib/ops-api";

// Tryton datetime/date fields deserialize as { __class__, year, month, day, hour?, minute? }
// objects, not strings - rendering one directly as a React child crashes the page.
function formatTrytonDateTime(v: any): string | null {
  if (!v || typeof v !== "object" || !v.year) return null;
  const datePart = `${v.year}-${String(v.month).padStart(2, "0")}-${String(v.day).padStart(2, "0")}`;
  if (typeof v.hour !== "number") return datePart;
  return `${datePart}T${String(v.hour).padStart(2, "0")}:${String(v.minute || 0).padStart(2, "0")}`;
}

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!hasModuleAccess(session.role, "inpatient")) {
    return NextResponse.json({ error: "Your role does not have permission for this module." }, { status: 403 });
  }
  try {
    const context = { company: session.companyId };

    // 1. Fetch Wards
    let wards: any[] = [];
    try {
      wards = await TrytonClient.execute<any[]>(
        session.username,
        session.userId,
        session.sessionToken,
        "gnuhealth.hospital.ward",
        "search_read",
        [[], 0, 50, [["name", "ASC"]], ["id", "name", "floor", "number_of_beds", "state", "gender", "private"]],
        context,
        session.database
      );
    } catch (e) {
      console.warn("Could not fetch wards:", e);
    }

    // 2. Fetch Beds
    let beds: any[] = [];
    try {
      beds = await TrytonClient.execute<any[]>(
        session.username,
        session.userId,
        session.sessionToken,
        "gnuhealth.hospital.bed",
        "search_read",
        [[], 0, 100, [["id", "ASC"]], ["id", "rec_name", "ward", "bed_type", "state", "telephone_number"]],
        context,
        session.database
      );
    } catch (e) {
      console.warn("Could not fetch beds:", e);
    }

    // 3. Fetch Inpatient Admissions
    let admissions: any[] = [];
    try {
      admissions = await TrytonClient.execute<any[]>(
        session.username,
        session.userId,
        session.sessionToken,
        "gnuhealth.inpatient.registration",
        "search_read",
        [
          [["state", "!=", "cancelled"]],
          0,
          50,
          [["hospitalization_date", "DESC"]],
          [
            "id",
            "name",
            "patient",
            "bed",
            "hospitalization_date",
            "discharge_date",
            "admission_type",
            "attending_physician",
            "state",
            "nursing_plan",
            "discharge_plan",
          ],
        ],
        context,
        session.database
      );
    } catch (e) {
      console.warn("Could not fetch admissions:", e);
    }

    // 4. Calculate Census Statistics (from real data only - never fabricated)
    const totalBeds = beds.length;
    const occupiedBeds = beds.filter((b) => b.state === "occupied").length;
    // Only beds actually in "free" state are ready for a new admission - beds
    // "to_clean" (post-discharge) or "na" are neither occupied nor available.
    const availableBeds = beds.filter((b) => b.state === "free").length;
    const occupancyRate = totalBeds > 0 ? Math.round((occupiedBeds / totalBeds) * 100) : 0;

    // Resolve patient/bed/physician names via explicit lookups rather than
    // assuming search_read inlines many2one fields as [id, name] tuples -
    // falling back to fabricated names ("Synthetic Patient", "Dr. UAT
    // Physician") misrepresented real or missing data as if it were populated.
    const idOf = (v: unknown) => (typeof v === "number" ? v : Array.isArray(v) ? v[0] : null);
    const lookup = async (model: string, ids: unknown[], fields: string[]) => {
      const uniq = [...new Set(ids.filter(Boolean))];
      if (uniq.length === 0) return {} as Record<number, any>;
      try {
        const rows = await TrytonClient.execute<any[]>(
          session.username, session.userId, session.sessionToken,
          model, "search_read",
          [[["id", "in", uniq]], 0, uniq.length, null, fields],
          context, session.database
        );
        return rows.reduce((acc, r) => { acc[r.id] = r; return acc; }, {} as Record<number, any>);
      } catch {
        return {} as Record<number, any>;
      }
    };
    const [patientsMap, physiciansMap, admBedsMap] = await Promise.all([
      lookup("gnuhealth.patient", admissions.map((a) => idOf(a.patient)), ["id", "rec_name"]),
      lookup("gnuhealth.healthprofessional", admissions.map((a) => idOf(a.attending_physician)), ["id", "rec_name"]),
      lookup("gnuhealth.hospital.bed", admissions.map((a) => idOf(a.bed)), ["id", "rec_name"]),
    ]);

    return NextResponse.json({
      success: true,
      database: session.database,
      wards: wards.map((w) => ({
        id: w.id,
        name: w.name,
        floor: w.floor ?? null,
        numberOfBeds: w.number_of_beds ?? null,
        state: w.state || null,
        gender: w.gender || null,
        isPrivate: !!w.private,
      })),
      beds: beds.map((b) => ({
        id: b.id,
        name: b.rec_name || `Bed ${b.id}`,
        wardId: Array.isArray(b.ward) ? b.ward[0] : b.ward,
        wardName: Array.isArray(b.ward) ? b.ward[1] : null,
        bedType: b.bed_type || null,
        state: b.state || null,
        telephone: b.telephone_number || null,
      })),
      admissions: admissions.map((a) => {
        const pid = idOf(a.patient);
        const bid = idOf(a.bed);
        const docId = idOf(a.attending_physician);
        return {
          id: a.id,
          registrationNumber: a.name || `ADM-${a.id}`,
          patientId: pid,
          patientName: patientsMap[pid as number]?.rec_name || null,
          bedId: bid,
          bedName: admBedsMap[bid as number]?.rec_name || null,
          hospitalizationDate: formatTrytonDateTime(a.hospitalization_date),
          dischargeDate: formatTrytonDateTime(a.discharge_date),
          admissionType: a.admission_type || null,
          attendingPhysician: physiciansMap[docId as number]?.rec_name || null,
          state: a.state || "hospitalized",
          nursingPlan: a.nursing_plan || null,
          dischargePlan: a.discharge_plan || null,
        };
      }),
      stats: {
        totalBeds,
        occupiedBeds,
        availableBeds,
        occupancyRate,
        todayAdmissions: admissions.length,
      },
    });
  } catch (error: any) {
    console.error("Error in inpatient route:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to load inpatient data" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!hasModuleAccess(session.role, "inpatient") || !(["nursing", "physician", "admin"] as const).some((m) => hasModuleAccess(session.role, m))) {
    return NextResponse.json({ error: "Only nursing, physician or administrator accounts can admit patients." }, { status: 403 });
  }
  try {
    const body = await req.json();
    const { patientId, bedId, admissionType, nursingPlan, expectedDischargeDate } = body;

    const idOk = (v: unknown) => Number.isSafeInteger(Number(v)) && Number(v) > 0 && Number(v) < 2147483647;
    if (!patientId || !idOk(patientId)) {
      return NextResponse.json({ error: "A valid patient is required." }, { status: 400 });
    }
    if (bedId !== undefined && bedId !== null && bedId !== "" && !idOk(bedId)) {
      return NextResponse.json({ error: "A valid bed is required." }, { status: 400 });
    }

    // GNU Health requires an expected discharge date at admission time (used
    // for bed/capacity planning); it's later overwritten with the actual
    // discharge date when the patient is discharged. Default to 3 days out
    // if the caller didn't supply one.
    let dischargeDateStr: string;
    if (typeof expectedDischargeDate === "string" && /^\d{4}-\d{2}-\d{2}$/.test(expectedDischargeDate)) {
      dischargeDateStr = `${expectedDischargeDate} 12:00:00`;
    } else {
      const fallback = new Date();
      fallback.setDate(fallback.getDate() + 3);
      dischargeDateStr = fallback.toISOString().slice(0, 19).replace("T", " ");
    }

    const context = { company: session.companyId };

    // Native GNU Health only ever assigns a bed via the confirmed()/admission() workflow
    // buttons, which check the bed isn't already reserved/occupied/pending-clean before
    // touching it. This route creates the registration directly with create(), skipping
    // that check entirely - confirmed live: admitting a second patient to a bed still
    // sitting in "to_clean" (discharged but not yet cleaned) silently succeeded and
    // overwrote the bed straight to "occupied", losing track of the pending clean step.
    // Only "free" is a genuinely available bed - reject anything else with a clear 409.
    if (bedId) {
      const bedRows = await TrytonClient.execute<Array<{ id: number; state: string }>>(
        session.username, session.userId, session.sessionToken,
        "gnuhealth.hospital.bed", "read", [[parseInt(bedId, 10)], ["id", "state"]],
        context, session.database
      );
      const bedState = bedRows[0]?.state;
      if (bedState !== "free") {
        return NextResponse.json(
          { error: `This bed is not available for admission (current state: ${bedState || "unknown"}). Select a free bed.` },
          { status: 409 }
        );
      }
    }

    // Register admission in Tryton
    const admissionData = {
      patient: parseInt(patientId, 10),
      bed: bedId ? parseInt(bedId, 10) : undefined,
      admission_type: admissionType || "routine",
      hospitalization_date: new Date().toISOString().slice(0, 19).replace("T", " "),
      discharge_date: dischargeDateStr,
      attending_physician: session.healthprofId || undefined,
      nursing_plan: nursingPlan || "Standard Nursing Observation Plan",
      state: "hospitalized",
    };

    const newAdmissions = await TrytonClient.execute<any[]>(
      session.username,
      session.userId,
      session.sessionToken,
      "gnuhealth.inpatient.registration",
      "create",
      [[admissionData]],
      context,
      session.database
    );

    // If a bed was assigned, mark it occupied
    if (bedId) {
      try {
        await TrytonClient.execute(
          session.username,
          session.userId,
          session.sessionToken,
          "gnuhealth.hospital.bed",
          "write",
          [[parseInt(bedId, 10)], { state: "occupied" }],
          context,
          session.database
        );
      } catch (e) {
        console.warn("Could not update bed state:", e);
      }
    }

    return NextResponse.json({
      success: true,
      admission: newAdmissions[0],
      message: "Patient admitted to inpatient ward successfully",
    });
  } catch (error: any) {
    console.error("Error creating inpatient admission:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to create inpatient admission" },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!hasModuleAccess(session.role, "inpatient") || !(["nursing", "physician", "admin"] as const).some((m) => hasModuleAccess(session.role, m))) {
    return NextResponse.json({ error: "Only nursing, physician or administrator accounts can discharge patients or release beds." }, { status: 403 });
  }
  try {
    const body = await req.json();
    const action = body.action || "discharge";
    const context = { company: session.companyId };

    // Bed cleaning step: GNU Health's discharge() button never frees the bed
    // directly - it moves it to "to_clean" first, and a separate bedclean()
    // step (housekeeping confirming the room is ready) moves the registration
    // to "finished" and the bed to "free".
    if (action === "bedclean") {
      const { admissionId, bedId } = body;
      if (!admissionId || !bedId) {
        return NextResponse.json({ error: "Admission ID and bed ID are required" }, { status: 400 });
      }
      await TrytonClient.execute(
        session.username, session.userId, session.sessionToken,
        "gnuhealth.inpatient.registration", "write",
        [[parseInt(admissionId, 10)], { state: "finished" }],
        context, session.database
      );
      await TrytonClient.execute(
        session.username, session.userId, session.sessionToken,
        "gnuhealth.hospital.bed", "write",
        [[parseInt(bedId, 10)], { state: "free" }],
        context, session.database
      );
      return NextResponse.json({ success: true, message: "Bed cleaned and marked available." });
    }

    const { admissionId, bedId, dischargePlan, dischargeReason, dischargeDxId, admissionReasonId } = body;

    if (!admissionId) {
      return NextResponse.json({ error: "Admission ID is required" }, { status: 400 });
    }

    // Every department must have signed off (medical, nursing, pharmacy, billing, insurance) before the patient leaves.
    const blocked = await dischargeBlock(session, parseInt(admissionId, 10));
    if (blocked) return NextResponse.json({ error: blocked }, { status: 409 });

    // GNU Health's own discharge validation (check_discharge_context) requires
    // discharge_reason, discharge_dx AND admission_reason to all be set before
    // the registration can move to state "done" - reject early with a clear
    // message rather than letting the Tryton UserError surface raw.
    const VALID_DISCHARGE_REASONS = ["home", "transfer", "death", "against_advice"];
    if (!VALID_DISCHARGE_REASONS.includes(dischargeReason)) {
      return NextResponse.json(
        { error: `Discharge reason must be one of: ${VALID_DISCHARGE_REASONS.join(", ")}.` },
        { status: 400 }
      );
    }
    const dischargeDx = dischargeDxId ? parseInt(dischargeDxId, 10) : null;
    const admissionReason = admissionReasonId ? parseInt(admissionReasonId, 10) : null;
    if (!dischargeDx) {
      return NextResponse.json({ error: "A discharge diagnosis (ICD-10) is required." }, { status: 400 });
    }
    if (!admissionReason) {
      return NextResponse.json({ error: "A reason for admission (ICD-10) is required." }, { status: 400 });
    }

    // Discharge patient - GNU Health state "done" means "Discharged - needs
    // cleaning" (there is no "discharged" state in the health_inpatient module).
    await TrytonClient.execute(
      session.username,
      session.userId,
      session.sessionToken,
      "gnuhealth.inpatient.registration",
      "write",
      [
        [parseInt(admissionId, 10)],
        {
          state: "done",
          discharged_by: session.healthprofId || undefined,
          discharge_date: new Date().toISOString().slice(0, 19).replace("T", " "),
          discharge_plan: dischargePlan || "Discharged home with outpatient follow-up in 7 days.",
          discharge_reason: dischargeReason,
          discharge_dx: dischargeDx,
          admission_reason: admissionReason,
        },
      ],
      context,
      session.database
    );

    // Bed moves to "to_clean" on discharge, not straight to "free" - matches
    // the real GNU Health discharge()/bedclean() two-step state machine.
    if (bedId) {
      try {
        await TrytonClient.execute(
          session.username,
          session.userId,
          session.sessionToken,
          "gnuhealth.hospital.bed",
          "write",
          [[parseInt(bedId, 10)], { state: "to_clean" }],
          context,
          session.database
        );
      } catch (e) {
        console.warn("Could not update bed state:", e);
      }
    }

    return NextResponse.json({
      success: true,
      message: "Patient discharged. Bed marked as needing cleaning before it can be reassigned.",
    });
  } catch (error: any) {
    console.error("Error discharging patient:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to discharge patient" },
      { status: 500 }
    );
  }
}
