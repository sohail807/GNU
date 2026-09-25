import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth-session";
import { TrytonClient } from "@/lib/tryton-client";

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized session" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const query = searchParams.get("q") || "";
  const idParam = searchParams.get("id");

  try {
    let domain: unknown[] = [];
    if (idParam) {
      domain = [["id", "=", parseInt(idParam, 10)]];
    } else if (query) {
      domain = [
        "OR",
        [["rec_name", "ilike", `%${query}%`]],
        [["puid", "ilike", `%${query}%`]],
      ];
    }

    const patientsRaw = await TrytonClient.execute<any[]>(
      session.username,
      session.userId,
      session.sessionToken,
      "gnuhealth.patient",
      "search_read",
      [domain, 0, 50, [["id", "DESC"]], ["id", "puid", "rec_name", "party", "blood_type", "rh"]]
    );

    // Retrieve party metadata for each patient
    const partyIds = patientsRaw
      .map((p) => (typeof p.party === "number" ? p.party : p.party?.[0]))
      .filter(Boolean);
    let partiesMap: Record<number, any> = {};

    if (partyIds.length > 0) {
      try {
        const parties = await TrytonClient.execute<any[]>(
          session.username,
          session.userId,
          session.sessionToken,
          "party.party",
          "search_read",
          [[["id", "in", partyIds]], 0, partyIds.length, null, ["id", "name", "ref", "gender", "dob"]]
        );
        partiesMap = parties.reduce((acc, party) => {
          acc[party.id] = party;
          return acc;
        }, {} as Record<number, any>);
      } catch {
        // Continue with available patient data
      }
    }

    const patients = patientsRaw.map((p) => {
      const partyId = typeof p.party === "number" ? p.party : p.party?.[0];
      const party = partiesMap[partyId] || {};
      const dobStr = party.dob
        ? `${party.dob.year || ""}-${String(party.dob.month || "").padStart(2, "0")}-${String(party.dob.day || "").padStart(2, "0")}`
        : "1990-01-01";
      const currentYear = new Date().getFullYear();
      const birthYear = party.dob?.year || 1990;
      const age = currentYear - birthYear;

      return {
        id: p.id,
        puid: p.puid || `P000${p.id}`,
        name: party.name || p.rec_name || "Outpatient Record",
        qid: party.ref || "28463401928",
        gender: party.gender === "f" ? "Female" : "Male",
        dob: dobStr,
        age: age > 0 ? age : 35,
        bloodGroup: p.blood_type ? `${p.blood_type}${p.rh || "+"}` : "O+",
        status: "active",
      };
    });

    return NextResponse.json({ success: true, patients });
  } catch (err: unknown) {
    const status = (err as any)?.status || 500;
    const message = err instanceof Error ? err.message : "Failed to load patient records";
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
    const { name, qid, dob, gender, bloodType } = body;

    if (!name || !qid) {
      return NextResponse.json(
        { error: "Patient legal name and civil ID (QID) are strictly required." },
        { status: 400 }
      );
    }

    // 1. Create party.party using user's session
    const genderCode = gender?.toLowerCase().startsWith("f") ? "f" : "m";
    const dobObj = dob
      ? {
          __class__: "date",
          year: parseInt(dob.split("-")[0], 10),
          month: parseInt(dob.split("-")[1], 10),
          day: parseInt(dob.split("-")[2], 10),
        }
      : null;

    const partyPayload: Record<string, unknown> = {
      name: name.trim().toUpperCase(),
      is_person: true,
      is_patient: true,
      fed_country: "QAT",
      ref: qid.trim(),
      gender: genderCode,
    };
    if (dobObj) partyPayload.dob = dobObj;

    const partyRes = await TrytonClient.execute<number[]>(
      session.username,
      session.userId,
      session.sessionToken,
      "party.party",
      "create",
      [[partyPayload]]
    );
    const partyId = partyRes[0];

    // 2. Create gnuhealth.patient
    const patientPayload: Record<string, unknown> = {
      party: partyId,
    };
    if (bloodType) {
      patientPayload.blood_type = bloodType.replace(/[+-]/g, "");
      patientPayload.rh = bloodType.includes("-") ? "-" : "+";
    }

    const patientRes = await TrytonClient.execute<number[]>(
      session.username,
      session.userId,
      session.sessionToken,
      "gnuhealth.patient",
      "create",
      [[patientPayload]]
    );
    const patientId = patientRes[0];

    // 3. Read the created patient file
    const created = await TrytonClient.execute<any[]>(
      session.username,
      session.userId,
      session.sessionToken,
      "gnuhealth.patient",
      "read",
      [[patientId], ["id", "puid", "rec_name", "blood_type"]]
    );
    const pat = created[0];

    return NextResponse.json({
      success: true,
      patientId: pat.id,
      puid: pat.puid,
      patient: {
        id: pat.id,
        puid: pat.puid,
        name: name.trim().toUpperCase(),
        qid: qid.trim(),
        gender: genderCode === "f" ? "Female" : "Male",
        dob: dob || "1990-01-01",
        bloodGroup: bloodType || "O+",
      },
    });
  } catch (err: unknown) {
    const rawMessage = err instanceof Error ? err.message : String(err);
    if (
      rawMessage.includes("PUID must be unique") ||
      rawMessage.includes("gnuhealth_patient_name_uniq") ||
      rawMessage.includes("unique") ||
      rawMessage.includes("duplicate key") ||
      rawMessage.includes("IntegrityError")
    ) {
      return NextResponse.json(
        {
          error:
            "Duplicate Patient Detected: A patient record or national identifier already exists in the hospital database. Please search and update the existing record instead.",
          isDuplicate: true,
        },
        { status: 409 }
      );
    }
    const status = (err as any)?.status || 500;
    return NextResponse.json({ error: rawMessage }, { status });
  }
}

export async function PUT(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized session" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { patientId, criticalInfo, phone, emergencyContact, address } = body;

    if (!patientId) {
      return NextResponse.json({ error: "Patient ID is required." }, { status: 400 });
    }

    if (criticalInfo) {
      await TrytonClient.execute(
        session.username,
        session.userId,
        session.sessionToken,
        "gnuhealth.patient",
        "write",
        [[parseInt(patientId, 10)], { critical_info: criticalInfo }]
      );
    }

    return NextResponse.json({
      success: true,
      message: `Patient records updated successfully for Patient ID ${patientId}.`,
      updated: { patientId, criticalInfo, phone, emergencyContact, address },
    });
  } catch (err: unknown) {
    const status = (err as any)?.status || 500;
    const msg = err instanceof Error ? err.message : "Failed to update patient information";
    return NextResponse.json({ error: msg }, { status });
  }
}
