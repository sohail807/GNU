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

  if (!hasModuleAccess(session.role, "patient_chart")) {
    return NextResponse.json({ error: "Your role does not have permission for this module." }, { status: 403 });
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
      [domain, 0, 50, [["id", "DESC"]], ["id", "puid", "rec_name", "party", "dob", "age", "gender", "blood_type", "rh", "active"]],
      { company: session.companyId },
      session.database
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
          [[["id", "in", partyIds]], 0, partyIds.length, null, ["id", "name", "ref", "gender", "dob"]],
          { company: session.companyId },
          session.database
        );
        partiesMap = parties.reduce((acc, party) => {
          acc[party.id] = party;
          return acc;
        }, {} as Record<number, any>);
      } catch {
        // Continue with available patient data
      }
    }

    // Resolve real phone numbers from each party's contact mechanisms. Never
    // fabricated - a patient with no phone on file returns null, not a fake number.
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

    const patientIds = patientsRaw.map((patient) => patient.id);
    let diseasesRaw: any[] = [];
    let allergiesLoaded = false;
    // Distinguished from a generic load failure: GNU Health's own ACL legitimately restricts
    // "Patient Conditions History" (diagnoses/allergies) to clinical roles -- reception/cashier
    // staff are correctly denied here, and the UI should say so rather than imply a system fault.
    let allergiesRestricted = false;
    if (patientIds.length > 0) {
      try {
        diseasesRaw = await TrytonClient.execute<any[]>(
          session.username, session.userId, session.sessionToken,
          "gnuhealth.patient.disease", "search_read",
          [[ ["patient", "in", patientIds] ], 0, 500, [["id", "ASC"]], ["id", "patient", "pathology", "is_allergy", "is_active", "status"]],
          { company: session.companyId }, session.database
        );
        allergiesLoaded = true;
      } catch (err) {
        allergiesRestricted = (err as { status?: number })?.status === 403;
      }
    }

    // Allergy names: related fields come back as bare ids on this server, so the diagnosis names are looked up explicitly.
    // (Reading the name from a [id, name] pair silently produced an empty list, hiding every recorded allergy.)
    const relId = (v: unknown): number | null => (typeof v === "number" ? v : Array.isArray(v) && typeof v[0] === "number" ? v[0] : null);
    const pathologyName: Record<number, string> = {};
    if (allergiesLoaded && diseasesRaw.length > 0) {
      const ids = [...new Set(diseasesRaw.filter((d) => d.is_allergy).map((d) => relId(d.pathology)).filter((x): x is number => x !== null))];
      if (ids.length > 0) {
        try {
          const paths = await TrytonClient.execute<any[]>(
            session.username, session.userId, session.sessionToken,
            "gnuhealth.pathology", "search_read", [[["id", "in", ids]], 0, ids.length, null, ["id", "name", "code"]],
            { company: session.companyId }, session.database
          );
          for (const pa of paths) pathologyName[pa.id] = pa.name || pa.code || "";
        } catch {
          // names unavailable: the allergy is still counted below under a generic label
        }
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
        partyId: partyId || null,
        puid: String(p.puid || "").slice(0, 64),
        name: String(party.name || p.rec_name || "").slice(0, 120),
        qid: party.ref || "",
        phone: (partyId && phoneByParty[partyId]) || null,
        gender: p.gender || "",
        dob: dobStr,
        age: p.age || null,
        bloodGroup: p.blood_type ? `${p.blood_type}${p.rh || ""}` : "",
        status: p.active === true ? "active" : p.active === false ? "inactive" : "unknown",
        allergiesLoaded,
        allergiesRestricted,
        allergies: allergiesLoaded ? diseasesRaw
          .filter((disease) => disease.is_allergy && disease.is_active && !["h", "healed"].includes(String(disease.status || "")))
          .filter((disease) => Array.isArray(disease.patient) ? disease.patient[0] === p.id : disease.patient === p.id)
          .map((disease) => {
            const pid = relId(disease.pathology);
            return (pid !== null && pathologyName[pid]) || (Array.isArray(disease.pathology) ? String(disease.pathology[1] || "") : "") || "Allergy recorded";
          })
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

  if (!hasModuleAccess(session.role, "patient_register")) {
    return NextResponse.json({ error: "Your role does not have permission for this module." }, { status: 403 });
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
    if (typeof name !== "string" || typeof qid !== "string" || name.length > 200 || qid.length > 32) {
      return NextResponse.json({ error: "The name must be at most 200 characters and the civil ID at most 32." }, { status: 400 });
    }

    // 1. Create party.party using user's session
    const genderCode = typeof gender === "string" && gender ? gender.toLowerCase().charAt(0) : undefined;
    if (genderCode && !["m", "f", "n", "o", "u"].includes(genderCode)) {
      return NextResponse.json({ error: "Gender must be a valid health records system selection." }, { status: 400 });
    }
    // Validate before anything is created: a date or blood type the backend rejects used to surface as a misleading
    // "hospital system temporarily unavailable", and a blood type failure came after the person record already existed.
    if (dob !== undefined && dob !== null && dob !== "") {
      const m = typeof dob === "string" ? /^(\d{4})-(\d{2})-(\d{2})$/.exec(dob) : null;
      const real = m ? new Date(Date.UTC(+m[1], +m[2] - 1, +m[3])) : null;
      if (!m || !real || real.getUTCFullYear() !== +m[1] || real.getUTCMonth() !== +m[2] - 1 || real.getUTCDate() !== +m[3]) {
        return NextResponse.json({ error: "Enter the date of birth as a real date (YYYY-MM-DD)." }, { status: 400 });
      }
      if (real.getTime() > Date.now()) return NextResponse.json({ error: "The date of birth cannot be in the future." }, { status: 400 });
    }
    if (bloodType !== undefined && bloodType !== null && bloodType !== "" && !(typeof bloodType === "string" && /^(A|B|AB|O)[+-]?$/.test(bloodType))) {
      return NextResponse.json({ error: "Choose a valid blood group (A, B, AB or O, with + or -)." }, { status: 400 });
    }
    const dobObj = dob
      ? {
          __class__: "date",
          year: parseInt(dob.split("-")[0], 10),
          month: parseInt(dob.split("-")[1], 10),
          day: parseInt(dob.split("-")[2], 10),
        }
      : null;

    const fedCountry = await ClinicalLookupService.resolveFedCountry(session);
    const partyPayload: Record<string, unknown> = {
      name: name.trim(),
      is_person: true,
      is_patient: true,
      fed_country: fedCountry,
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
      [[partyPayload]],
      { company: session.companyId },
      session.database
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

    let patientRes: number[];
    try {
      patientRes = await TrytonClient.execute<number[]>(
        session.username,
        session.userId,
        session.sessionToken,
        "gnuhealth.patient",
        "create",
        [[patientPayload]],
        { company: session.companyId },
        session.database
      );
    } catch (patientErr) {
      // Do not leave a person record behind without its patient file.
      await TrytonClient.execute(
        session.username, session.userId, session.sessionToken, "party.party", "delete", [[partyId]],
        { company: session.companyId }, session.database
      ).catch(() => undefined);
      throw patientErr;
    }
    const patientId = patientRes[0];

    // 3. Read the created patient file
    const created = await TrytonClient.execute<any[]>(
      session.username,
      session.userId,
      session.sessionToken,
      "gnuhealth.patient",
      "read",
      [[patientId], ["id", "puid", "rec_name", "blood_type", "rh"]],
      { company: session.companyId },
      session.database
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
    const status = (err as any)?.status || 500;
    // TrytonClient.execute() already translates any unique-constraint violation (including a
    // duplicate PUID or the gnuhealth_patient_name_uniq constraint) into a 409 before this catch
    // ever sees it, so keying off that status is reliable -- matching on the raw constraint text
    // here never fires, since what reaches this block is already TrytonClient's own translated
    // message, not the original database error string.
    if (status === 409) {
      return NextResponse.json(
        {
          error:
            "Duplicate Patient Detected: A patient record or national identifier already exists in the hospital database. Please search and update the existing record instead.",
          isDuplicate: true,
        },
        { status: 409 }
      );
    }
    return NextResponse.json({ error: rawMessage }, { status });
  }
}

export async function PUT(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized session" }, { status: 401 });
  }

  if (!hasModuleAccess(session.role, "patient_register")) {
    return NextResponse.json({ error: "Your role does not have permission for this module." }, { status: 403 });
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
        [[parseInt(patientId, 10)], { critical_info: criticalInfo.trim() }],
        { company: session.companyId },
        session.database
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
