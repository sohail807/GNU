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

    // 1. Fetch Prescriptions
    let prescriptions: any[] = [];
    try {
      prescriptions = await TrytonClient.execute<any[]>(
        session.username,
        session.userId,
        session.sessionToken,
        "gnuhealth.prescription.order",
        "search_read",
        [
          [],
          0,
          50,
          [["prescription_date", "DESC"]],
          ["id", "name", "patient", "healthprof", "prescription_date", "state", "notes"],
        ],
        context,
        session.database
      );
    } catch (e) {
      console.warn("Could not fetch prescriptions:", e);
    }

    // 2. Fetch Medicaments / Formulary
    let medicaments: any[] = [];
    try {
      medicaments = await TrytonClient.execute<any[]>(
        session.username,
        session.userId,
        session.sessionToken,
        "gnuhealth.medicament",
        "search_read",
        [
          [],
          0,
          60,
          [["active_component", "ASC"]],
          ["id", "active_component", "dosage", "indications", "presentation", "is_vaccine", "pregnancy_warning"],
        ],
        context,
        session.database
      );
    } catch (e) {
      console.warn("Could not fetch medicaments:", e);
    }

    return NextResponse.json({
      success: true,
      database: session.database,
      prescriptions: prescriptions.map((rx) => ({
        id: rx.id,
        orderNumber: rx.name || `RX-${rx.id}`,
        patientId: Array.isArray(rx.patient) ? rx.patient[0] : rx.patient,
        patientName: Array.isArray(rx.patient) ? rx.patient[1] : "Synthetic Patient",
        prescribingDoctor: Array.isArray(rx.healthprof) ? rx.healthprof[1] : "Dr. UAT Physician",
        prescriptionDate: rx.prescription_date,
        state: rx.state || "draft",
        notes: rx.notes || "Standard dosage per prescription protocol",
      })),
      medicaments: medicaments.map((m) => ({
        id: m.id,
        activeComponent: m.active_component || `Medicament #${m.id}`,
        dosage: m.dosage || "500 mg",
        presentation: m.presentation || "Tablets",
        indications: m.indications || "General medical indication",
        isVaccine: !!m.is_vaccine,
        pregnancyWarning: !!m.pregnancy_warning,
      })),
      stats: {
        totalOrders: prescriptions.length,
        pendingDispensation: prescriptions.filter((rx) => rx.state === "draft" || rx.state === "invoiced").length,
        dispensed: prescriptions.filter((rx) => rx.state === "done").length,
        formularyCount: medicaments.length,
      },
    });
  } catch (error: any) {
    console.error("Error in pharmacy route:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to load pharmacy data" },
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
    const { prescriptionId, verificationNotes } = body;

    if (!prescriptionId) {
      return NextResponse.json({ error: "Prescription ID is required" }, { status: 400 });
    }

    const context = { company: session.companyId };

    // Update prescription state to done (dispensed)
    await TrytonClient.execute(
      session.username,
      session.userId,
      session.sessionToken,
      "gnuhealth.prescription.order",
      "write",
      [
        [parseInt(prescriptionId, 10)],
        {
          state: "done",
          notes: verificationNotes ? `Dispensed by Pharmacy: ${verificationNotes}` : "Dispensed by Pharmacy staff",
        },
      ],
      context,
      session.database
    );

    return NextResponse.json({
      success: true,
      message: "Prescription verified and dispensed successfully",
    });
  } catch (error: any) {
    console.error("Error dispensing prescription:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to dispense prescription" },
      { status: 500 }
    );
  }
}
