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
  if (!hasModuleAccess(session.role, "appointments") && !hasModuleAccess(session.role, "frontdesk")) {
    return NextResponse.json({ error: "Your role does not have appointment desk permission." }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type");
  const patientId = searchParams.get("patientId");

  try {
    // If client requests available physicians list for appointment booking
    if (type === "physicians") {
      const hps = await TrytonClient.execute<any[]>(
        session.username,
        session.userId,
        session.sessionToken,
        "gnuhealth.healthprofessional",
        "search_read",
        [[], 0, 50, null, ["id", "rec_name", "main_specialty"]],
        { company: session.companyId },
        session.database
      );
      return NextResponse.json({
        success: true,
        physicians: hps.map((hp) => ({
          id: hp.id,
          name: hp.rec_name,
          specialty: Array.isArray(hp.main_specialty) ? hp.main_specialty[1] : "",
        })),
      });
    }

    let domain: unknown[] = [];
    if (patientId) {
      domain = [["patient", "=", parseInt(patientId, 10)]];
    }

    const rawAppts = await TrytonClient.execute<any[]>(
      session.username,
      session.userId,
      session.sessionToken,
      "gnuhealth.appointment",
      "search_read",
      [domain, 0, 200, [["id", "DESC"]], ["id", "name", "patient", "healthprof", "appointment_date", "state", "urgency"]],
      { company: session.companyId },
      session.database
    );

    // Resolve patient names
    const patientIds = rawAppts
      .map((a) => (typeof a.patient === "number" ? a.patient : a.patient?.[0]))
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
          [[["id", "in", patientIds]], 0, patientIds.length, null, ["id", "puid", "rec_name", "party"]],
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

    // Resolve real patient phone numbers from their party's contact mechanisms.
    // Never fabricated - a patient with no phone on file shows null, not a fake number.
    const partyIds = Object.values(patientsMap)
      .map((p: any) => (typeof p.party === "number" ? p.party : p.party?.[0]))
      .filter(Boolean);
    let phoneByParty: Record<number, string> = {};
    if (partyIds.length > 0) {
      try {
        const contacts = await TrytonClient.execute<any[]>(
          session.username,
          session.userId,
          session.sessionToken,
          "party.contact_mechanism",
          "search_read",
          [[["party", "in", partyIds], ["type", "in", ["mobile", "phone"]]], 0, partyIds.length * 2, null, ["party", "value"]],
          { company: session.companyId },
          session.database
        );
        for (const c of contacts || []) {
          const pid = typeof c.party === "number" ? c.party : c.party?.[0];
          if (pid && !phoneByParty[pid]) phoneByParty[pid] = c.value;
        }
      } catch {
        // Fallback: leave phoneByParty empty
      }
    }

    // A patient is "ready to bill" once a physician has completed at least one evaluation --
    // front desk needs this signal to know when to route them to the cashier, but (per the
    // consultations route) never sees the clinical content behind it, just this derived flag.
    let readyToBillPatientIds = new Set<number>();
    if (patientIds.length > 0) {
      try {
        const doneEvaluations = await TrytonClient.execute<any[]>(
          session.username,
          session.userId,
          session.sessionToken,
          "gnuhealth.patient.evaluation",
          "search_read",
          [[["patient", "in", patientIds], ["state", "=", "done"]], 0, patientIds.length, null, ["patient"]],
          { company: session.companyId },
          session.database
        );
        readyToBillPatientIds = new Set(
          doneEvaluations.map((e) => (typeof e.patient === "number" ? e.patient : e.patient?.[0])).filter(Boolean)
        );
      } catch {
        // Fallback: nobody flagged ready to bill rather than failing the whole appointment list
      }
    }

    // Resolve health professional names
    const hpIds = rawAppts
      .map((a) => (typeof a.healthprof === "number" ? a.healthprof : a.healthprof?.[0]))
      .filter(Boolean);
    let hpMap: Record<number, any> = {};
    if (hpIds.length > 0) {
      try {
        const hps = await TrytonClient.execute<any[]>(
          session.username,
          session.userId,
          session.sessionToken,
          "gnuhealth.healthprofessional",
          "search_read",
          [[["id", "in", hpIds]], 0, hpIds.length, null, ["id", "rec_name"]],
          { company: session.companyId },
          session.database
        );
        hpMap = hps.reduce((acc, hp) => {
          acc[hp.id] = hp;
          return acc;
        }, {} as Record<number, any>);
      } catch {
        // Fallback
      }
    }

    const appointments = rawAppts.map((a) => {
      const pid = typeof a.patient === "number" ? a.patient : a.patient?.[0];
      const hpid = typeof a.healthprof === "number" ? a.healthprof : a.healthprof?.[0];
      const pat = patientsMap[pid] || {};
      const patPartyId = typeof pat.party === "number" ? pat.party : pat.party?.[0];
      const hp = hpMap[hpid] || {};
      const aptDate = a.appointment_date;
      const timeStr = Number.isInteger(aptDate?.hour)
        ? `${String(aptDate.hour).padStart(2, "0")}:${String(aptDate.minute || 0).padStart(2, "0")}`
        : "";
      const dateStr = aptDate?.year
        ? `${aptDate.year}-${String(aptDate.month).padStart(2, "0")}-${String(aptDate.day).padStart(2, "0")}`
        : null;

      return {
        id: a.id,
        ref: a.name || String(a.id),
        patientId: pid,
        puid: pat.puid || "",
        patientName: pat.rec_name || "",
        patientPhone: (patPartyId && phoneByParty[patPartyId]) || null,
        physicianName: hp.rec_name || "",
        physicianId: hpid,
        date: dateStr,
        time: timeStr,
        state: a.state || "",
        urgency: a.urgency || "",
        readyToBill: readyToBillPatientIds.has(pid),
      };
    });

    return NextResponse.json({ success: true, appointments });
  } catch (err: unknown) {
    const status = (err as any)?.status || 500;
    const message = err instanceof Error ? err.message : "Failed to load appointments";
    return NextResponse.json({ error: message }, { status });
  }
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized session" }, { status: 401 });
  }
  if (!hasModuleAccess(session.role, "appointments") && !hasModuleAccess(session.role, "frontdesk")) {
    return NextResponse.json({ error: "Your role does not have appointment desk permission." }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { action, appointmentId, patientId, healthprofId, appointmentDate, appointmentTime, urgency } = body;

    if (action === "checkin" && appointmentId) {
      const aid = Number(appointmentId);
      if (!Number.isSafeInteger(aid) || aid <= 0) {
        return NextResponse.json({ error: "A valid appointment ID is required." }, { status: 400 });
      }
      await TrytonClient.execute(
        session.username,
        session.userId,
        session.sessionToken,
        "gnuhealth.appointment",
        "check_in",
        [[aid]],
        { company: session.companyId },
        session.database
      );
      return NextResponse.json({
        success: true,
        message: "Patient successfully checked in and queued for Nursing Triage.",
      });
    }

    if (action === "book" && patientId) {
      const pid = Number(patientId);
      if (!Number.isSafeInteger(pid) || pid <= 0) {
        return NextResponse.json({ error: "A valid patient ID is required." }, { status: 400 });
      }
      if (typeof appointmentDate !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(appointmentDate)) {
        return NextResponse.json({ error: "A valid appointment date (YYYY-MM-DD) is required." }, { status: 400 });
      }
      const resolvedTime = (typeof appointmentTime === "string" && /^([01]\d|2[0-3]):[0-5]\d$/.test(appointmentTime))
        ? appointmentTime
        : "10:00";
      const [year, month, day] = appointmentDate.split("-").map(Number);
      const [hour, minute] = resolvedTime.split(":").map(Number);
      const checkDate = new Date(Date.UTC(year, month - 1, day));
      if (checkDate.getUTCFullYear() !== year || checkDate.getUTCMonth() !== month - 1 || checkDate.getUTCDate() !== day) {
        return NextResponse.json({ error: "The appointment date is invalid." }, { status: 400 });
      }
      const dtObj = { __class__: "datetime", year, month, day, hour, minute, second: 0, microsecond: 0 };

      // Dynamically resolve attending clinician
      const hp = await ClinicalLookupService.resolveClinician(session, healthprofId);
      if (!hp) {
        return NextResponse.json(
          { error: "Attending health professional could not be resolved or verified for appointment." },
          { status: 400 }
        );
      }

      const urgencyMap: Record<string, string> = { normal: "a", urgent: "b", emergency: "c" };
      const urgencyCode = typeof urgency === "string" ? urgencyMap[urgency] : undefined;
      if (!urgencyCode) {
        return NextResponse.json({ error: "Select a valid appointment urgency." }, { status: 400 });
      }

      const apptPayload = {
        patient: pid,
        healthprof: hp,
        appointment_date: dtObj,
        urgency: urgencyCode,
        state: "confirmed",
      };

      const res = await TrytonClient.execute<number[]>(
        session.username,
        session.userId,
        session.sessionToken,
        "gnuhealth.appointment",
        "create",
        [[apptPayload]],
        { company: session.companyId },
        session.database
      );

      return NextResponse.json({
        success: true,
        appointmentId: res[0],
        message: "Encounter appointment successfully booked in Hospital Calendar.",
      });
    }

    return NextResponse.json({ error: "Invalid action or parameters specified" }, { status: 400 });
  } catch (err: unknown) {
    const status = (err as any)?.status || 500;
    const message = err instanceof Error ? err.message : "Appointment transaction failed";
    return NextResponse.json({ error: message }, { status });
  }
}
