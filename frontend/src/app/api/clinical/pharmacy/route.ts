import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth-session";
import { TrytonClient } from "@/lib/tryton-client";
import { hasModuleAccess } from "@/lib/access-control";
import { consumeStock } from "@/lib/ops-api";

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

  if (!hasModuleAccess(session.role, "pharmacy")) {
    return NextResponse.json({ error: "Your role does not have permission for this module." }, { status: 403 });
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
          // "name" isn't a real field on this model (it's "prescription_id") -- requesting it
          // made the whole search_read throw a KeyError, which the catch below silently
          // swallowed, so the pharmacy queue always came back empty for every role, on every
          // prescription, regardless of permissions.
          ["id", "prescription_id", "patient", "healthprof", "prescription_date", "state", "notes"],
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

    // Resolve patient/prescriber names via explicit lookups rather than assuming
    // search_read inlines many2one fields as [id, name] tuples - falling back to
    // fabricated names ("Synthetic Patient", "Dr. UAT Physician") misrepresented
    // real or missing data as if it were populated.
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
    const [patientsMap, physiciansMap] = await Promise.all([
      lookup("gnuhealth.patient", prescriptions.map((rx) => idOf(rx.patient)), ["id", "rec_name"]),
      lookup("gnuhealth.healthprofessional", prescriptions.map((rx) => idOf(rx.healthprof)), ["id", "rec_name"]),
    ]);

    return NextResponse.json({
      success: true,
      database: session.database,
      prescriptions: prescriptions.map((rx) => {
        const pid = idOf(rx.patient);
        const docId = idOf(rx.healthprof);
        return {
          id: rx.id,
          orderNumber: rx.prescription_id || `RX-${rx.id}`,
          patientId: pid,
          patientName: patientsMap[pid as number]?.rec_name || null,
          prescribingDoctor: physiciansMap[docId as number]?.rec_name || null,
          prescriptionDate: formatTrytonDateTime(rx.prescription_date),
          state: rx.state || "draft",
          notes: rx.notes || null,
        };
      }),
      // Medicament catalog fields reflect exactly what's configured - a blank
      // dosage/presentation/indications is shown as such, never fabricated,
      // since pharmacy staff would otherwise dispense against a made-up value.
      medicaments: medicaments.map((m) => ({
        id: m.id,
        activeComponent: m.active_component || `Medicament #${m.id}`,
        dosage: m.dosage || null,
        presentation: m.presentation || null,
        indications: m.indications || null,
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

  if (!hasModuleAccess(session.role, "pharmacy")) {
    return NextResponse.json({ error: "Your role does not have permission for this module." }, { status: 403 });
  }
  try {
    const body = await req.json();
    const { prescriptionId, verificationNotes } = body;

    if (!prescriptionId) {
      return NextResponse.json({ error: "Prescription ID is required" }, { status: 400 });
    }

    const context = { company: session.companyId };

    // Take the medicines out of stock first (earliest expiry first); a shortage of a tracked medicine stops the dispense.
    const shortage = await consumeStock(session, parseInt(prescriptionId, 10));
    if (shortage) return NextResponse.json({ error: shortage }, { status: 409 });

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
