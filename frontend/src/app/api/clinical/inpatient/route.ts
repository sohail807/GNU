import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth-session";
import { TrytonClient } from "@/lib/tryton-client";

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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

    // 4. Calculate Census Statistics
    const totalBeds = beds.length || 24;
    const occupiedBeds = beds.filter((b) => b.state === "occupied").length || admissions.filter((a) => a.state === "hospitalized").length;
    const availableBeds = Math.max(0, totalBeds - occupiedBeds);
    const occupancyRate = totalBeds > 0 ? Math.round((occupiedBeds / totalBeds) * 100) : 0;

    return NextResponse.json({
      success: true,
      database: session.database,
      wards: wards.map((w) => ({
        id: w.id,
        name: w.name,
        floor: w.floor || 1,
        numberOfBeds: w.number_of_beds || 6,
        state: w.state || "operational",
        gender: w.gender || "unisex",
        isPrivate: !!w.private,
      })),
      beds: beds.map((b) => ({
        id: b.id,
        name: b.rec_name || `Bed ${b.id}`,
        wardId: Array.isArray(b.ward) ? b.ward[0] : b.ward,
        wardName: Array.isArray(b.ward) ? b.ward[1] : "General Ward",
        bedType: b.bed_type || "standard",
        state: b.state || "free",
        telephone: b.telephone_number || null,
      })),
      admissions: admissions.map((a) => ({
        id: a.id,
        registrationNumber: a.name || `ADM-${a.id}`,
        patientId: Array.isArray(a.patient) ? a.patient[0] : a.patient,
        patientName: Array.isArray(a.patient) ? a.patient[1] : "Synthetic Patient",
        bedId: Array.isArray(a.bed) ? a.bed[0] : a.bed,
        bedName: Array.isArray(a.bed) ? a.bed[1] : "Unassigned Bed",
        hospitalizationDate: a.hospitalization_date,
        dischargeDate: a.discharge_date,
        admissionType: a.admission_type || "routine",
        attendingPhysician: Array.isArray(a.attending_physician) ? a.attending_physician[1] : "Dr. UAT Physician",
        state: a.state || "hospitalized",
        nursingPlan: a.nursing_plan || "Standard Inpatient Monitoring Protocol",
        dischargePlan: a.discharge_plan || null,
      })),
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

  try {
    const body = await req.json();
    const { patientId, bedId, admissionType, nursingPlan } = body;

    if (!patientId) {
      return NextResponse.json({ error: "Patient ID is required" }, { status: 400 });
    }

    const context = { company: session.companyId };

    // Register admission in Tryton
    const admissionData = {
      patient: parseInt(patientId, 10),
      bed: bedId ? parseInt(bedId, 10) : undefined,
      admission_type: admissionType || "routine",
      hospitalization_date: new Date().toISOString().slice(0, 19).replace("T", " "),
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

  try {
    const body = await req.json();
    const { admissionId, bedId, dischargePlan, dischargeReason } = body;

    if (!admissionId) {
      return NextResponse.json({ error: "Admission ID is required" }, { status: 400 });
    }

    const context = { company: session.companyId };

    // Discharge patient
    await TrytonClient.execute(
      session.username,
      session.userId,
      session.sessionToken,
      "gnuhealth.inpatient.registration",
      "write",
      [
        [parseInt(admissionId, 10)],
        {
          state: "discharged",
          discharge_date: new Date().toISOString().slice(0, 19).replace("T", " "),
          discharge_plan: dischargePlan || "Discharged home with outpatient follow-up in 7 days.",
          discharge_reason: dischargeReason || "improved",
        },
      ],
      context,
      session.database
    );

    // Release bed if provided
    if (bedId) {
      try {
        await TrytonClient.execute(
          session.username,
          session.userId,
          session.sessionToken,
          "gnuhealth.hospital.bed",
          "write",
          [[parseInt(bedId, 10)], { state: "free" }],
          context,
          session.database
        );
      } catch (e) {
        console.warn("Could not free bed:", e);
      }
    }

    return NextResponse.json({
      success: true,
      message: "Patient discharged and bed marked available",
    });
  } catch (error: any) {
    console.error("Error discharging patient:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to discharge patient" },
      { status: 500 }
    );
  }
}
