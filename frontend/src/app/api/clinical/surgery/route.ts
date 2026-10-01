import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth-session";
import { TrytonClient } from "@/lib/tryton-client";
import { hasModuleAccess } from "@/lib/access-control";
import { checklistBlock } from "@/lib/ops-api";

// gnuhealth.surgery's "classification" field (labelled "Urgency" in Tryton) only accepts
// the single-letter selection codes below - the booking form's "elective"/"urgent"/"emergency"
// values were being sent as-is, so every create() call was rejected with
// `The value "elective" for field "Urgency" ... is not one of the allowed options.`
// ('r' / Required has no corresponding option in the booking form, so it's omitted here.)
const CLASSIFICATION_TO_TRYTON: Record<string, string> = {
  elective: "o",
  urgent: "u",
  emergency: "e",
};
const TRYTON_TO_CLASSIFICATION: Record<string, string> = {
  o: "elective",
  r: "required",
  u: "urgent",
  e: "emergency",
};

// Tryton datetime/date fields deserialize as { __class__, year, month, day, hour?, minute? }
// objects, not strings - rendering one directly as a React child crashes the page.
function formatTrytonDateTime(v: any): string | null {
  if (!v || typeof v !== "object" || !v.year) return null;
  const datePart = `${v.year}-${String(v.month).padStart(2, "0")}-${String(v.day).padStart(2, "0")}`;
  if (typeof v.hour !== "number") return datePart;
  return `${datePart}T${String(v.hour).padStart(2, "0")}:${String(v.minute || 0).padStart(2, "0")}`;
}

// The booking form's field is labelled "Patient PUID or Record ID" and its placeholder
// literally shows both forms ("e.g. 101 or 28264873791") -- but the handler only ever did
// parseInt(patientId) and used it as the internal record id directly. A PUID is ~11 digits,
// which parses fine in JS but overflows Postgres's 32-bit integer column for the foreign key,
// so entering a PUID (the example the placeholder itself suggests) failed with a raw
// "integer out of range" error. Resolve properly: try it as a record id first, then as a PUID.
async function resolvePatientId(
  session: { username: string; userId: number; sessionToken: string; companyId: number; database: string },
  rawInput: string
): Promise<number | null> {
  const trimmed = String(rawInput).trim();
  const asInt = Number(trimmed);
  const context = { company: session.companyId };
  if (Number.isSafeInteger(asInt) && asInt > 0 && asInt <= 2147483647) {
    const byId = await TrytonClient.execute<Array<{ id: number }>>(
      session.username, session.userId, session.sessionToken,
      "gnuhealth.patient", "search_read",
      [[["id", "=", asInt]], 0, 1, null, ["id"]],
      context, session.database
    );
    if (byId[0]) return byId[0].id;
  }
  const byPuid = await TrytonClient.execute<Array<{ id: number }>>(
    session.username, session.userId, session.sessionToken,
    "gnuhealth.patient", "search_read",
    [[["puid", "=", trimmed]], 0, 1, null, ["id"]],
    context, session.database
  );
  return byPuid[0]?.id ?? null;
}

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!hasModuleAccess(session.role, "surgery")) {
    return NextResponse.json({ error: "Your role does not have permission for this module." }, { status: 403 });
  }
  try {
    const context = { company: session.companyId };

    // 1. Fetch Operating Rooms
    let operatingRooms: any[] = [];
    try {
      operatingRooms = await TrytonClient.execute<any[]>(
        session.username,
        session.userId,
        session.sessionToken,
        "gnuhealth.hospital.or",
        "search_read",
        [[], 0, 20, [["name", "ASC"]], ["id", "name", "building", "unit", "state"]],
        context,
        session.database
      );
    } catch (e) {
      console.warn("Could not fetch operating rooms:", e);
    }

    // 2. Fetch Surgeries
    let surgeries: any[] = [];
    try {
      surgeries = await TrytonClient.execute<any[]>(
        session.username,
        session.userId,
        session.sessionToken,
        "gnuhealth.surgery",
        "search_read",
        [
          [],
          0,
          50,
          [["surgery_date", "DESC"]],
          [
            "id",
            "code",
            "description",
            "patient",
            "admission",
            "operating_room",
            "surgeon",
            "anesthetist",
            "surgery_date",
            "surgery_end_date",
            "anesthesia_type",
            "classification",
            "state",
            "postoperative_guidelines",
          ],
        ],
        context,
        session.database
      );
    } catch (e) {
      console.warn("Could not fetch surgeries:", e);
    }

    // Resolve patient/surgeon/anesthetist/OR names via explicit lookups rather
    // than assuming search_read inlines many2one fields as [id, name] tuples -
    // that shape isn't guaranteed, and silently falling back to fabricated
    // placeholder names ("Synthetic Patient", "Dr. UAT Surgeon") misrepresented
    // real (or missing) data as if it were populated.
    const idOf = (v: unknown) => (typeof v === "number" ? v : Array.isArray(v) ? v[0] : null);
    const patientIds = surgeries.map((s) => idOf(s.patient)).filter(Boolean);
    const surgeonIds = surgeries.map((s) => idOf(s.surgeon)).filter(Boolean);
    const anesthetistIds = surgeries.map((s) => idOf(s.anesthetist)).filter(Boolean);
    const orIds = surgeries.map((s) => idOf(s.operating_room)).filter(Boolean);

    const lookup = async (model: string, ids: unknown[], fields: string[]) => {
      if (ids.length === 0) return {} as Record<number, any>;
      try {
        const rows = await TrytonClient.execute<any[]>(
          session.username, session.userId, session.sessionToken,
          model, "search_read",
          [[["id", "in", ids]], 0, ids.length, null, fields],
          context, session.database
        );
        return rows.reduce((acc, r) => { acc[r.id] = r; return acc; }, {} as Record<number, any>);
      } catch {
        return {} as Record<number, any>;
      }
    };

    const [patientsMap, surgeonsMap, anesthetistsMap, orMap] = await Promise.all([
      lookup("gnuhealth.patient", patientIds, ["id", "rec_name"]),
      lookup("gnuhealth.healthprofessional", surgeonIds, ["id", "rec_name"]),
      lookup("gnuhealth.healthprofessional", anesthetistIds, ["id", "rec_name"]),
      lookup("gnuhealth.hospital.or", orIds, ["id", "name"]),
    ]);

    return NextResponse.json({
      success: true,
      database: session.database,
      operatingRooms: operatingRooms.map((or) => ({
        id: or.id,
        name: or.name,
        state: or.state || null,
      })),
      surgeries: surgeries.map((s) => {
        const pid = idOf(s.patient);
        const orid = idOf(s.operating_room);
        const surgeonId = idOf(s.surgeon);
        const anesthetistId = idOf(s.anesthetist);
        return {
          id: s.id,
          code: s.code || `SRG-${s.id}`,
          description: s.description || null,
          patientId: pid,
          patientName: patientsMap[pid as number]?.rec_name || null,
          operatingRoomId: orid,
          operatingRoomName: orMap[orid as number]?.name || null,
          surgeon: surgeonsMap[surgeonId as number]?.rec_name || null,
          anesthetist: anesthetistsMap[anesthetistId as number]?.rec_name || null,
          surgeryDate: formatTrytonDateTime(s.surgery_date),
          surgeryEndDate: formatTrytonDateTime(s.surgery_end_date),
          anesthesiaType: s.anesthesia_type || null,
          classification: (s.classification && TRYTON_TO_CLASSIFICATION[s.classification]) || s.classification || null,
          state: s.state || "draft",
          postopGuidelines: s.postoperative_guidelines || null,
        };
      }),
      stats: {
        totalTheatres: operatingRooms.length,
        scheduledToday: surgeries.length,
        inProgress: surgeries.filter((s) => s.state === "in_progress").length,
        completed: surgeries.filter((s) => s.state === "done").length,
      },
    });
  } catch (error: any) {
    console.error("Error in surgery route:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to load surgical data" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!hasModuleAccess(session.role, "surgery")) {
    return NextResponse.json({ error: "Your role does not have permission for this module." }, { status: 403 });
  }
  try {
    const body = await req.json();
    const { patientId, description, operatingRoomId, surgeryDate, surgeryEndDate, durationMinutes, anesthesiaType, classification, procedureIds } = body;

    if (!patientId || !description) {
      return NextResponse.json(
        { error: "Patient ID and procedure description are required" },
        { status: 400 }
      );
    }

    const context = { company: session.companyId };

    const resolvedPatientId = await resolvePatientId(session, patientId);
    if (!resolvedPatientId) {
      return NextResponse.json(
        { error: "No patient found matching that PUID or record ID." },
        { status: 404 }
      );
    }

    if (operatingRoomId !== undefined && operatingRoomId !== null && operatingRoomId !== "" &&
        !(Number.isSafeInteger(Number(operatingRoomId)) && Number(operatingRoomId) > 0 && Number(operatingRoomId) < 2147483647)) {
      return NextResponse.json({ error: "Choose a valid operating theatre." }, { status: 400 });
    }
    const resolvedOrId = operatingRoomId ? parseInt(operatingRoomId, 10) : undefined;
    const toTryton = (v: unknown) => (typeof v === "string" && /^\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}(:\d{2})?$/.test(v.trim()) ? v.trim().replace("T", " ").padEnd(19, ":00").slice(0, 19) : null);
    const startDate = toTryton(surgeryDate) || new Date().toISOString().slice(0, 19).replace("T", " ");
    const explicitEnd = toTryton(surgeryEndDate);
    if (surgeryDate && !toTryton(surgeryDate)) {
      return NextResponse.json({ error: "Enter a valid start date and time." }, { status: 400 });
    }
    if (surgeryEndDate && !explicitEnd) {
      return NextResponse.json({ error: "Enter a valid end date and time." }, { status: 400 });
    }
    if (explicitEnd && explicitEnd <= startDate) {
      return NextResponse.json({ error: "The surgery must end after it starts." }, { status: 400 });
    }

    // gnuhealth.surgery.create() creates a companion gnuhealth.or.schedule entry whenever an
    // operating_room is set, and that model requires reserve_to (mapped from surgery_end_date)
    // - the booking form never collects an end time, so every booking that assigned an OR
    // failed outright with "A value is required for field 'To' in Operating Rooms Schedules."
    // Default to a 2-hour block (or the caller's durationMinutes) when an OR is selected.
    let endDate: string | undefined;
    if (resolvedOrId) {
      const start = new Date(startDate.replace(" ", "T") + "Z");
      const minutes = Number.isFinite(Number(durationMinutes)) && Number(durationMinutes) > 0 ? Number(durationMinutes) : 120;
      const end = new Date(start.getTime() + minutes * 60000);
      endDate = explicitEnd || end.toISOString().slice(0, 19).replace("T", " ");

      // Native GNU Health only rejects an overlapping OR booking inside the confirmed() button,
      // which this route bypasses by writing state: "confirmed" directly on create. Reproduce
      // that same conflict check here so two surgeries can't be double-booked into the same OR.
      const overlapping = await TrytonClient.execute<Array<{ id: number }>>(
        session.username, session.userId, session.sessionToken,
        "gnuhealth.surgery", "search_read",
        [[
          ["operating_room", "=", resolvedOrId],
          ["state", "in", ["confirmed", "in_progress"]],
          ["surgery_date", "<", endDate],
          ["surgery_end_date", ">", startDate],
        ], 0, 1, null, ["id"]],
        context, session.database
      );
      if (overlapping.length > 0) {
        return NextResponse.json(
          { error: `This operating room is already booked for an overlapping time (surgery #${overlapping[0].id}). Choose a different room or time.` },
          { status: 409 }
        );
      }
    }

    const surgeryData = {
      patient: resolvedPatientId,
      description,
      operating_room: resolvedOrId,
      surgery_date: startDate,
      surgery_end_date: endDate || explicitEnd || undefined,
      anesthesia_type: anesthesiaType || "general",
      classification: CLASSIFICATION_TO_TRYTON[classification] || CLASSIFICATION_TO_TRYTON.elective,
      surgeon: session.healthprofId || undefined,
      state: "confirmed",
    };

    const newSurgeries = await TrytonClient.execute<any[]>(
      session.username,
      session.userId,
      session.sessionToken,
      "gnuhealth.surgery",
      "create",
      [[surgeryData]],
      context,
      session.database
    );

    // Procedure codes chosen from the catalogue become the surgery's operation lines.
    const procIds: number[] = Array.isArray(procedureIds) ? procedureIds.map(Number).filter((n) => Number.isSafeInteger(n) && n > 0 && n < 2147483647).slice(0, 10) : [];
    if (procIds.length) {
      await TrytonClient.execute(
        session.username, session.userId, session.sessionToken, "gnuhealth.operation", "create",
        [procIds.map((procedure) => ({ surgery: newSurgeries[0], procedure }))], context, session.database
      ).catch(() => undefined);
    }

    return NextResponse.json({
      success: true,
      surgery: newSurgeries[0],
      message: "Surgical procedure booked and scheduled successfully",
    });
  } catch (error: any) {
    console.error("Error booking surgery:", error);
    return NextResponse.json({ error: error?.message || "Failed to book surgical procedure" }, { status: error?.status || 500 });
  }
}

export async function PATCH(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!hasModuleAccess(session.role, "surgery")) {
    return NextResponse.json({ error: "Your role does not have permission for this module." }, { status: 403 });
  }
  try {
    const body = await req.json();
    const { surgeryId, state, postopGuidelines } = body;

    if (!surgeryId) {
      return NextResponse.json({ error: "Surgery ID is required" }, { status: 400 });
    }

    // Whitelist to the model's real state selection - never let a client write
    // an arbitrary string into gnuhealth.surgery.state.
    const VALID_STATES = ["draft", "confirmed", "cancelled", "in_progress", "done", "signed"];
    if (state !== undefined && !VALID_STATES.includes(state)) {
      return NextResponse.json(
        { error: `Invalid surgery state "${state}". Must be one of: ${VALID_STATES.join(", ")}.` },
        { status: 400 }
      );
    }

    const context = { company: session.companyId };

    // The WHO safety checklist gates starting and closing a surgery.
    if (state !== undefined) {
      const blocked = await checklistBlock(session, parseInt(surgeryId, 10), state);
      if (blocked) return NextResponse.json({ error: blocked }, { status: 409 });
    }

    const writeValues: Record<string, unknown> = {};
    if (state !== undefined) writeValues.state = state;
    if (postopGuidelines !== undefined) writeValues.postoperative_guidelines = postopGuidelines;

    await TrytonClient.execute(
      session.username,
      session.userId,
      session.sessionToken,
      "gnuhealth.surgery",
      "write",
      [[parseInt(surgeryId, 10)], writeValues],
      context,
      session.database
    );

    return NextResponse.json({
      success: true,
      message: `Surgical procedure status updated to ${state}`,
    });
  } catch (error: any) {
    console.error("Error updating surgery:", error);
    const msg = String(error?.message || "Failed to update surgery status");
    return NextResponse.json({ error: msg }, { status: /signed|cannot be changed|not allowed/i.test(msg) ? 409 : (error?.status || 500) });
  }
}
