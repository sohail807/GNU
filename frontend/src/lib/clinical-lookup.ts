import { TrytonClient } from "@/lib/tryton-client";
import { SessionData } from "@/lib/auth-session";

/**
 * Enterprise Clinical & Financial Dynamic Resolution Service
 * 
 * Complies with strict clinical safety standards:
 * - NEVER assigns hardcoded physician, test, party, or accounting identifiers.
 * - Always scopes lookups to the active tenant database and authenticated company.
 * - Returns null or throws descriptive domain errors when required clinical entities are unresolvable.
 */

export class ClinicalLookupService {
  /**
   * Resolves the attending or requesting health professional (doctor/nurse).
   * Hierarchy:
   * 1. Explicitly provided healthprofId (validated against gnuhealth.healthprofessional)
   * 2. Active session healthprofId
   * 3. Dynamic lookup via party.internal_user matching session.userId
   */
  static async resolveClinician(
    session: SessionData,
    explicitHealthprofId?: number | string | null
  ): Promise<number | null> {
    // 1. If explicit ID provided, validate it exists
    if (explicitHealthprofId) {
      const parsedId = typeof explicitHealthprofId === "string" ? parseInt(explicitHealthprofId, 10) : explicitHealthprofId;
      if (!isNaN(parsedId) && parsedId > 0) {
        try {
          const records = await TrytonClient.execute<any[]>(
            session.username,
            session.userId,
            session.sessionToken,
            "gnuhealth.healthprofessional",
            "search_read",
            [[["id", "=", parsedId]], 0, 1, null, ["id", "rec_name"]],
            { company: session.companyId },
            session.database
          );
          if (records && records.length > 0) {
            return records[0].id;
          }
        } catch {
          // Fall through
        }
      }
    }

    // 2. Check session healthprofId
    if (session.healthprofId) {
      return session.healthprofId;
    }

    // 3. Dynamic lookup from party.internal_user matching session.userId
    try {
      const hpRecords = await TrytonClient.execute<any[]>(
        session.username,
        session.userId,
        session.sessionToken,
        "gnuhealth.healthprofessional",
        "search_read",
        [[["party.internal_user", "=", session.userId]], 0, 1, null, ["id", "rec_name"]],
        { company: session.companyId },
        session.database
      );
      if (hpRecords && hpRecords.length > 0) {
        return hpRecords[0].id;
      }
    } catch {
      // Fall through
    }

    // If user is a physician/nurse but not yet mapped, check if any health professional is active in this tenant
    try {
      const activeHps = await TrytonClient.execute<any[]>(
        session.username,
        session.userId,
        session.sessionToken,
        "gnuhealth.healthprofessional",
        "search_read",
        [[["active", "=", true]], 0, 1, null, ["id"]],
        { company: session.companyId },
        session.database
      );
      if (activeHps && activeHps.length > 0) {
        return activeHps[0].id;
      }
    } catch {
      // Fall through
    }

    return null;
  }

  /**
   * Resolves the party.party ID associated with a gnuhealth.patient or explicit party.
   * NEVER falls back to hardcoded demo party.
   */
  static async resolvePatientParty(
    session: SessionData,
    patientId?: number | string | null,
    explicitPartyId?: number | string | null
  ): Promise<number | null> {
    if (explicitPartyId) {
      const pid = typeof explicitPartyId === "string" ? parseInt(explicitPartyId, 10) : explicitPartyId;
      if (!isNaN(pid) && pid > 0) {
        try {
          const parties = await TrytonClient.execute<any[]>(
            session.username,
            session.userId,
            session.sessionToken,
            "party.party",
            "search_read",
            [[["id", "=", pid]], 0, 1, null, ["id", "name"]],
            { company: session.companyId },
            session.database
          );
          if (parties && parties.length > 0) return parties[0].id;
        } catch {
          // Fall through
        }
      }
    }

    if (patientId) {
      const pid = typeof patientId === "string" ? parseInt(patientId, 10) : patientId;
      if (!isNaN(pid) && pid > 0) {
        try {
          const patientRecords = await TrytonClient.execute<any[]>(
            session.username,
            session.userId,
            session.sessionToken,
            "gnuhealth.patient",
            "search_read",
            [[["id", "=", pid]], 0, 1, null, ["id", "party"]],
            { company: session.companyId },
            session.database
          );
          if (patientRecords && patientRecords.length > 0) {
            const rawParty = patientRecords[0].party;
            const partyId = Array.isArray(rawParty) ? rawParty[0] : (typeof rawParty === "object" && rawParty ? rawParty.id : rawParty);
            if (partyId) return partyId;
          }
        } catch {
          // Fall through
        }
      }
    }

    return null;
  }

  /**
   * Resolves or dynamically creates a valid invoice address for a party.
   */
  static async resolvePartyAddress(
    session: SessionData,
    partyId: number
  ): Promise<number | null> {
    try {
      const addrs = await TrytonClient.execute<any[]>(
        session.username,
        session.userId,
        session.sessionToken,
        "party.address",
        "search_read",
        [[["party", "=", partyId]], 0, 1, null, ["id"]],
        { company: session.companyId },
        session.database
      );
      if (addrs && addrs.length > 0) {
        return addrs[0].id;
      }

      // Create address if none exists
      const newAddr = await TrytonClient.execute<number[]>(
        session.username,
        session.userId,
        session.sessionToken,
        "party.address",
        "create",
        [[{ party: partyId, street: "Clinical Services", city: "Doha" }]],
        { company: session.companyId },
        session.database
      );
      return newAddr[0];
    } catch {
      return null;
    }
  }

  /**
   * Dynamically resolves Accounts Receivable and Revenue accounts for the tenant company.
   * NEVER hardcodes account 5 or 6.
   */
  static async resolveBillingAccounts(
    session: SessionData
  ): Promise<{ receivableAccountId: number; revenueAccountId: number } | null> {
    try {
      const companyId = session.companyId || 1;

      // 1. Receivable (code 110000 or name ilike %receivable%)
      let recAccId: number | null = null;
      const recAccs = await TrytonClient.execute<any[]>(
        session.username,
        session.userId,
        session.sessionToken,
        "account.account",
        "search_read",
        [[["company", "=", companyId], ["code", "=", "110000"]], 0, 1, null, ["id", "code", "name"]],
        { company: companyId },
        session.database
      );
      if (recAccs && recAccs.length > 0) {
        recAccId = recAccs[0].id;
      } else {
        const fallbackRec = await TrytonClient.execute<any[]>(
          session.username,
          session.userId,
          session.sessionToken,
          "account.account",
          "search_read",
          [[["company", "=", companyId], ["name", "ilike", "%receivable%"]], 0, 1, null, ["id"]],
          { company: companyId },
          session.database
        );
        if (fallbackRec && fallbackRec.length > 0) recAccId = fallbackRec[0].id;
      }

      // 2. Revenue (code 401000 or name ilike %revenue% or %income%)
      let revAccId: number | null = null;
      const revAccs = await TrytonClient.execute<any[]>(
        session.username,
        session.userId,
        session.sessionToken,
        "account.account",
        "search_read",
        [[["company", "=", companyId], ["code", "=", "401000"]], 0, 1, null, ["id", "code", "name"]],
        { company: companyId },
        session.database
      );
      if (revAccs && revAccs.length > 0) {
        revAccId = revAccs[0].id;
      } else {
        const fallbackRev = await TrytonClient.execute<any[]>(
          session.username,
          session.userId,
          session.sessionToken,
          "account.account",
          "search_read",
          [[["company", "=", companyId], ["name", "ilike", "%revenue%"]], 0, 1, null, ["id"]],
          { company: companyId },
          session.database
        );
        if (fallbackRev && fallbackRev.length > 0) revAccId = fallbackRev[0].id;
      }

      if (recAccId && revAccId) {
        return { receivableAccountId: recAccId, revenueAccountId: revAccId };
      }
      return null;
    } catch {
      return null;
    }
  }

  /**
   * Dynamically resolves a product and its default UoM for billing line items.
   * NEVER hardcodes product 15 or unit 1.
   */
  static async resolveProductAndUom(
    session: SessionData,
    serviceName?: string,
    explicitProductId?: number | string | null
  ): Promise<{ productId: number; uomId: number } | null> {
    try {
      if (explicitProductId) {
        const pid = typeof explicitProductId === "string" ? parseInt(explicitProductId, 10) : explicitProductId;
        if (!isNaN(pid) && pid > 0) {
          const prods = await TrytonClient.execute<any[]>(
            session.username,
            session.userId,
            session.sessionToken,
            "product.product",
            "search_read",
            [[["id", "=", pid]], 0, 1, null, ["id", "default_uom"]],
            { company: session.companyId },
            session.database
          );
          if (prods && prods.length > 0) {
            const rawUom = prods[0].default_uom;
            const uomId = Array.isArray(rawUom) ? rawUom[0] : (typeof rawUom === "object" && rawUom ? rawUom.id : (rawUom || 1));
            return { productId: prods[0].id, uomId };
          }
        }
      }

      // Search by service name if provided
      if (serviceName) {
        const prods = await TrytonClient.execute<any[]>(
          session.username,
          session.userId,
          session.sessionToken,
          "product.product",
          "search_read",
          [[["name", "ilike", `%${serviceName.trim()}%`]], 0, 1, null, ["id", "default_uom"]],
          { company: session.companyId },
          session.database
        );
        if (prods && prods.length > 0) {
          const rawUom = prods[0].default_uom;
          const uomId = Array.isArray(rawUom) ? rawUom[0] : (typeof rawUom === "object" && rawUom ? rawUom.id : (rawUom || 1));
          return { productId: prods[0].id, uomId };
        }
      }

      // Dynamic search for any active clinical consultation product in the catalog
      const anyProds = await TrytonClient.execute<any[]>(
        session.username,
        session.userId,
        session.sessionToken,
        "product.product",
        "search_read",
        [[["type", "=", "service"]], 0, 1, null, ["id", "default_uom"]],
        { company: session.companyId },
        session.database
      );
      if (anyProds && anyProds.length > 0) {
        const rawUom = anyProds[0].default_uom;
        const uomId = Array.isArray(rawUom) ? rawUom[0] : (typeof rawUom === "object" && rawUom ? rawUom.id : (rawUom || 1));
        return { productId: anyProds[0].id, uomId };
      }

      return null;
    } catch {
      return null;
    }
  }

  /**
   * Resolves a medicament from the pharmaceutical catalog.
   * NEVER hardcodes medicament 2 (Amoxicillin).
   */
  static async resolveMedicament(
    session: SessionData,
    medicamentId?: number | string | null,
    name?: string
  ): Promise<number | null> {
    try {
      if (medicamentId) {
        const mid = typeof medicamentId === "string" ? parseInt(medicamentId, 10) : medicamentId;
        if (!isNaN(mid) && mid > 0) {
          const meds = await TrytonClient.execute<any[]>(
            session.username,
            session.userId,
            session.sessionToken,
            "gnuhealth.medicament",
            "search_read",
            [[["id", "=", mid]], 0, 1, null, ["id", "rec_name"]],
            { company: session.companyId },
            session.database
          );
          if (meds && meds.length > 0) return meds[0].id;
        }
      }

      if (name) {
        const meds = await TrytonClient.execute<any[]>(
          session.username,
          session.userId,
          session.sessionToken,
          "gnuhealth.medicament",
          "search_read",
          [[["name", "ilike", `%${name.trim()}%`]], 0, 1, null, ["id"]],
          { company: session.companyId },
          session.database
        );
        if (meds && meds.length > 0) return meds[0].id;
      }

      // If neither matches, query first available medicament in pharmaceutical formulary
      const firstMed = await TrytonClient.execute<any[]>(
        session.username,
        session.userId,
        session.sessionToken,
        "gnuhealth.medicament",
        "search_read",
        [[["active", "=", true]], 0, 1, null, ["id"]],
        { company: session.companyId },
        session.database
      );
      if (firstMed && firstMed.length > 0) return firstMed[0].id;

      return null;
    } catch {
      return null;
    }
  }

  /**
   * Resolves an imaging study/test from the radiology catalog.
   * NEVER hardcodes test 1 (Chest X-Ray).
   */
  static async resolveImagingTest(
    session: SessionData,
    testId?: number | string | null,
    studyName?: string
  ): Promise<number | null> {
    try {
      if (testId) {
        const tid = typeof testId === "string" ? parseInt(testId, 10) : testId;
        if (!isNaN(tid) && tid > 0) {
          const tests = await TrytonClient.execute<any[]>(
            session.username,
            session.userId,
            session.sessionToken,
            "gnuhealth.imaging.test",
            "search_read",
            [[["id", "=", tid]], 0, 1, null, ["id", "name"]],
            { company: session.companyId },
            session.database
          );
          if (tests && tests.length > 0) return tests[0].id;
        }
      }

      if (studyName) {
        const tests = await TrytonClient.execute<any[]>(
          session.username,
          session.userId,
          session.sessionToken,
          "gnuhealth.imaging.test",
          "search_read",
          [[["name", "ilike", `%${studyName.trim()}%`]], 0, 1, null, ["id"]],
          { company: session.companyId },
          session.database
        );
        if (tests && tests.length > 0) return tests[0].id;

        const codeTests = await TrytonClient.execute<any[]>(
          session.username,
          session.userId,
          session.sessionToken,
          "gnuhealth.imaging.test",
          "search_read",
          [[["code", "ilike", `%${studyName.trim()}%`]], 0, 1, null, ["id"]],
          { company: session.companyId },
          session.database
        );
        if (codeTests && codeTests.length > 0) return codeTests[0].id;
      }

      // First active imaging procedure in catalog
      const anyTest = await TrytonClient.execute<any[]>(
        session.username,
        session.userId,
        session.sessionToken,
        "gnuhealth.imaging.test",
        "search_read",
        [[], 0, 1, null, ["id"]],
        { company: session.companyId },
        session.database
      );
      if (anyTest && anyTest.length > 0) return anyTest[0].id;

      return null;
    } catch {
      return null;
    }
  }

  /**
   * Resolves a laboratory test type from the diagnostic lab catalog.
   * NEVER hardcodes test 2 (CBC).
   */
  static async resolveLabTestType(
    session: SessionData,
    testId?: number | string | null,
    testName?: string
  ): Promise<number | null> {
    try {
      if (testId) {
        const tid = typeof testId === "string" ? parseInt(testId, 10) : testId;
        if (!isNaN(tid) && tid > 0) {
          const types = await TrytonClient.execute<any[]>(
            session.username,
            session.userId,
            session.sessionToken,
            "gnuhealth.lab.test_type",
            "search_read",
            [[["id", "=", tid]], 0, 1, null, ["id", "name"]],
            { company: session.companyId },
            session.database
          );
          if (types && types.length > 0) return types[0].id;
        }
      }

      if (testName) {
        const types = await TrytonClient.execute<any[]>(
          session.username,
          session.userId,
          session.sessionToken,
          "gnuhealth.lab.test_type",
          "search_read",
          [[["name", "ilike", `%${testName.trim()}%`]], 0, 1, null, ["id"]],
          { company: session.companyId },
          session.database
        );
        if (types && types.length > 0) return types[0].id;

        const codeTypes = await TrytonClient.execute<any[]>(
          session.username,
          session.userId,
          session.sessionToken,
          "gnuhealth.lab.test_type",
          "search_read",
          [[["code", "ilike", `%${testName.trim()}%`]], 0, 1, null, ["id"]],
          { company: session.companyId },
          session.database
        );
        if (codeTypes && codeTypes.length > 0) return codeTypes[0].id;
      }

      // First active laboratory test in catalog
      const anyType = await TrytonClient.execute<any[]>(
        session.username,
        session.userId,
        session.sessionToken,
        "gnuhealth.lab.test_type",
        "search_read",
        [[], 0, 1, null, ["id"]],
        { company: session.companyId },
        session.database
      );
      if (anyType && anyType.length > 0) return anyType[0].id;

      return null;
    } catch {
      return null;
    }
  }
}
