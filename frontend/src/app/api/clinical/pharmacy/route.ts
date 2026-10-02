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
          200,
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
          400,
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

    // What the pharmacist dispenses: one readable line per medicine, e.g. "Paracetamol 500mg · 500 mg · Oral · every 8 hours for 5 days".
    // Read separately from the orders: an account without access to the lines still gets its queue, just without this text.
    const orderIds = prescriptions.map((rx) => rx.id);
    const lineText: Record<number, string[]> = {};
    if (orderIds.length > 0) {
      try {
        const orderRows = await TrytonClient.execute<any[]>(
          session.username, session.userId, session.sessionToken,
          "gnuhealth.prescription.order", "read", [orderIds, ["id", "prescription_line"]], context, session.database
        );
        const lineIds = orderRows.flatMap((o) => (Array.isArray(o.prescription_line) ? o.prescription_line : []));
        const orderOfLine: Record<number, number> = {};
        for (const o of orderRows) for (const lid of o.prescription_line || []) orderOfLine[lid] = o.id;
        const lineRows = lineIds.length === 0 ? [] : await TrytonClient.execute<any[]>(
          session.username, session.userId, session.sessionToken,
          "gnuhealth.prescription.line", "search_read",
          [[["id", "in", lineIds]], 0, lineIds.length, null, ["id", "medicament", "dose", "dose_unit", "route", "frequency", "frequency_unit", "duration", "duration_period", "quantity"]],
          context, session.database
        );
        // Related fields come back as bare ids here, so the names are looked up the same way as the patient and doctor above.
        const [medNames, unitNames, routeNames] = await Promise.all([
          lookup("gnuhealth.medicament", lineRows.map((l) => idOf(l.medicament)), ["id", "rec_name"]),
          lookup("gnuhealth.dose.unit", lineRows.map((l) => idOf(l.dose_unit)), ["id", "rec_name"]),
          lookup("gnuhealth.drug.route", lineRows.map((l) => idOf(l.route)), ["id", "rec_name"]),
        ]);
        for (const l of lineRows) {
          const parts = [
            medNames[idOf(l.medicament) as number]?.rec_name || "",
            l.dose != null ? `${l.dose} ${unitNames[idOf(l.dose_unit) as number]?.rec_name || ""}`.trim() : "",
            routeNames[idOf(l.route) as number]?.rec_name || "",
            l.frequency != null ? `every ${l.frequency} ${l.frequency_unit || ""}`.trim() : "",
            l.duration != null ? `for ${l.duration} ${l.duration_period || ""}`.trim() : "",
            Number(l.quantity) > 0 ? `qty ${l.quantity}` : "",
          ].filter(Boolean);
          (lineText[orderOfLine[l.id]] ||= []).push(parts.join(" · "));
        }
      } catch (e) {
        console.warn("Could not fetch prescription lines:", e);
      }
    }

    // Counts come from the database, not from the newest page of prescriptions, so they stay right as the list grows.
    const count = (domain: unknown[]) => TrytonClient.execute<number>(
      session.username, session.userId, session.sessionToken, "gnuhealth.prescription.order", "search_count", [domain], context, session.database
    ).catch(() => 0);
    const [tTotal, tPending, tDone] = await Promise.all([count([]), count([["state", "in", ["draft", "invoiced"]]]), count([["state", "=", "done"]])]);
    const totals = { total: tTotal, pending: tPending, done: tDone };

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
          medicines: lineText[rx.id] || [],
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
        totalOrders: totals.total,
        pendingDispensation: totals.pending,
        dispensed: totals.done,
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

    // A prescription is dispensed once.
    const rxId = parseInt(prescriptionId, 10);
    if (!Number.isSafeInteger(rxId) || rxId <= 0 || rxId >= 2147483647) {
      return NextResponse.json({ error: "A valid prescription is required." }, { status: 400 });
    }
    const current = await TrytonClient.execute<Array<{ id: number; state: string }>>(
      session.username, session.userId, session.sessionToken, "gnuhealth.prescription.order", "read", [[rxId], ["id", "state"]], context, session.database
    );
    if (!current[0]) return NextResponse.json({ error: "Prescription not found." }, { status: 404 });
    if (current[0].state === "done") {
      return NextResponse.json({ error: "This prescription has already been dispensed." }, { status: 409 });
    }

    // Take the medicines out of stock first (earliest expiry first); a shortage of a tracked medicine stops the dispense.
    const stock = await consumeStock(session, parseInt(prescriptionId, 10));
    if (stock.refusal) return NextResponse.json({ error: stock.refusal }, { status: 409 });

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
      message: `Prescription verified and dispensed successfully.${stock.summary ? ` ${stock.summary}` : ""}`,
    });
  } catch (error: any) {
    console.error("Error dispensing prescription:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to dispense prescription" },
      { status: 500 }
    );
  }
}
