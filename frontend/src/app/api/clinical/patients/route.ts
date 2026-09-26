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
      [domain, 0, 50, [["id", "DESC"]], ["id", "puid", "rec_name", "party", "dob", "age", "gender", "blood_type", "rh", "active"]]
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

    const patientIds = patientsRaw.map((patient) => patient.id);
    let diseasesRaw: any[] = [];
    let allergiesLoaded = false;
    if (patientIds.length > 0) {
      try {
        diseasesRaw = await TrytonClient.execute<any[]>(
          session.username, session.userId, session.sessionToken,
          "gnuhealth.patient.disease", "search_read",
          [[ ["patient", "in", patientIds] ], 0, 500, [["id", "ASC"]], ["id", "patient", "pathology", "is_allergy", "is_active", "status"]],
          { company: session.companyId }, session.database
        );
        allergiesLoaded = true;
      } catch {
        // Do not interpret unavailable allergy data as an empty allergy list.
      }
    }

    const patients = patientsRaw.map((p) => {
      const partyId = typeof p.party === "number" ? p.party : p.party?.[0];
      const party = partiesMap[partyId] || {};
      const dob = p.dob || party.dob;
      const dobStr = dob?.year
        ? `${dob.year}-${String(dob.month).padStart(2, "0")}-${String(dob.day).padStart(2, "0")}`
        : null;

      return {
        id: p.id,
        puid: p.puid || "",
        name: party.name || p.rec_name || "",
        qid: party.ref || "",
        gender: p.gender || "",
        dob: dobStr,
        age: p.age || null,
        bloodGroup: p.blood_type ? `${p.blood_type}${p.rh || ""}` : "",
        status: p.active === true ? "active" : p.active === false ? "inactive" : "unknown",
        allergiesLoaded,
        allergies: allergiesLoaded ? diseasesRaw
          .filter((disease) => disease.is_allergy && disease.is_active && !["h", "healed"].includes(String(disease.status || "")))
          .filter((disease) => Array.isArray(disease.patient) ? disease.patient[0] === p.id : disease.patient === p.id)
          .map((disease) => Array.isArray(disease.pathology) ? disease.pathology[1] : "")
          .filter(Boolean) : null,
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
    const genderCode = typeof gender === "string" && gender ? gender.toLowerCase().charAt(0) : undefined;
    if (genderCode && !["m", "f", "n", "o", "u"].includes(genderCode)) {
      return NextResponse.json({ error: "Gender must be a valid health records system selection." }, { status: 400 });
    }
    const dobObj = dob
      ? {
          __class__: "date",
          year: parseInt(dob.split("-")[0], 10),
          month: parseInt(dob.split("-")[1], 10),
          day: parseInt(dob.split("-")[2], 10),
        }
      : null;

    const partyPayload: Record<string, unknown> = {
      name: name.trim(),
      is_person: true,
      is_patient: true,
      fed_country: "QAT",
      ref: qid.trim(),
    };
    if (genderCode) partyPayload.gender = genderCode;
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
        dob: dob || null,
        bloodGroup: pat.blood_type ? `${pat.blood_type}${pat.rh || ""}` : "",
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
    const { patientId, criticalInfo } = body;

    if (!patientId) {
      return NextResponse.json({ error: "Patient ID is required." }, { status: 400 });
    }

    if (typeof patientId !== "string" || !/^\d+$/.test(patientId) || !criticalInfo?.trim()) {
      return NextResponse.json({ error: "A valid patient ID and clinical critical information are required." }, { status: 400 });
    }

    await TrytonClient.execute(
        session.username,
        session.userId,
        session.sessionToken,
        "gnuhealth.patient",
        "write",
        [[parseInt(patientId, 10)], { critical_info: criticalInfo.trim() }]
    );

    return NextResponse.json({
      success: true,
      message: `Patient records updated successfully for Patient ID ${patientId}.`,
      updated: { patientId, criticalInfo: criticalInfo.trim() },
    });
  } catch (err: unknown) {
    const status = (err as any)?.status || 500;
    const msg = err instanceof Error ? err.message : "Failed to update patient information";
    return NextResponse.json({ error: msg }, { status });
  }
}
