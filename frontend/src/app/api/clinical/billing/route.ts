import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth-session";
import { TrytonClient } from "@/lib/tryton-client";
import { ClinicalLookupService } from "@/lib/clinical-lookup";

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized session" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const patientId = searchParams.get("patientId");

  try {
    let domain: unknown[] = [["type", "=", "out"]];
    if (patientId) {
      const pid = parseInt(patientId, 10);
      try {
        const patients = await TrytonClient.execute<any[]>(
          session.username,
          session.userId,
          session.sessionToken,
          "gnuhealth.patient",
          "search_read",
          [[["id", "=", pid]], 0, 1, null, ["id", "party"]]
        );
        if (patients && patients.length > 0) {
          const partyId = typeof patients[0].party === "number" ? patients[0].party : patients[0].party?.[0];
          domain.push(["party", "=", partyId]);
        } else {
          domain.push(["party", "=", pid]);
        }
      } catch {
        domain.push(["party", "=", pid]);
      }
    }

    const rawInvoices = await TrytonClient.execute<any[]>(
      session.username,
      session.userId,
      session.sessionToken,
      "account.invoice",
      "search_read",
      [domain, 0, 30, [["id", "DESC"]], ["id", "number", "party", "invoice_date", "total_amount", "amount_to_pay", "state", "lines"]]
    );

    // Resolve parties
    const partyIds = rawInvoices
      .map((i) => (typeof i.party === "number" ? i.party : i.party?.[0]))
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
          [[["id", "in", partyIds]], 0, partyIds.length, null, ["id", "name", "ref"]]
        );
        partiesMap = parties.reduce((acc, p) => {
          acc[p.id] = p;
          return acc;
        }, {} as Record<number, any>);
      } catch {
        // Fallback
      }
    }

    // Resolve lines
    const allLineIds = rawInvoices.flatMap((i) => i.lines || []);
    let linesMap: Record<number, any> = {};
    if (allLineIds.length > 0) {
      try {
        const lines = await TrytonClient.execute<any[]>(
          session.username,
          session.userId,
          session.sessionToken,
          "account.invoice.line",
          "search_read",
          [[["id", "in", allLineIds]], 0, allLineIds.length, null, ["id", "description", "unit_price", "amount"]]
        );
        linesMap = lines.reduce((acc, l) => {
          acc[l.id] = l;
          return acc;
        }, {} as Record<number, any>);
      } catch {
        // Fallback
      }
    }

    const invoices = rawInvoices.map((inv) => {
      const pid = typeof inv.party === "number" ? inv.party : inv.party?.[0];
      const party = partiesMap[pid] || {};
      const invDate = inv.invoice_date;
      const dateStr = invDate?.year
        ? `${invDate.year}-${String(invDate.month).padStart(2, "0")}-${String(invDate.day).padStart(2, "0")}`
        : null;

      const totalVal =
        typeof inv.total_amount === "object" && inv.total_amount?.decimal
          ? parseFloat(inv.total_amount.decimal)
          : Number(inv.total_amount || 0);

      const lineObjs = (inv.lines || []).map((lid: number) => {
        const l = linesMap[lid] || {};
        const amountNum =
          typeof l.amount === "object" && l.amount?.decimal
            ? parseFloat(l.amount.decimal)
            : Number(l.amount || 0);
        return {
          id: l.id,
          desc: l.description || "",
          amount: amountNum,
        };
      });

      return {
        id: inv.id,
        number: inv.number || String(inv.id),
        patient: party.name || "",
        patientId: pid,
        puid: party.ref || "",
        date: dateStr,
        totalQar: totalVal,
        amountToPay: typeof inv.amount_to_pay === "object" && inv.amount_to_pay?.decimal
          ? Number(inv.amount_to_pay.decimal)
          : inv.amount_to_pay == null ? null : Number(inv.amount_to_pay),
        status: inv.state === "paid" ? "paid" : inv.state === "posted" ? "posted" : "draft",
        lines: lineObjs,
      };
    });

    return NextResponse.json({ success: true, invoices });
  } catch (err: unknown) {
    const status = (err as any)?.status || 500;
    const message = err instanceof Error ? err.message : "Failed to load invoices";

    // If clinical staff (physician/nurse) lacks accounting permission, return empty array with accessRestricted flag
    if (status === 403 || message.includes("Access Denied") || message.includes("Security rules prevent access to account.invoice")) {
      return NextResponse.json({ success: true, invoices: [], accessRestricted: true });
    }

    return NextResponse.json({ error: message }, { status });
  }
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized session" }, { status: 401 });
  }

  // This custom endpoint previously created invoices with a browser supplied
  // price, then bypassed backend system's posting/payment workflows by writing state.
  // Keep financial mutations disabled until they use native backend system wizards and
  // server-derived product prices/journals.
  return NextResponse.json(
    { error: "Invoice creation, posting, and payment are unavailable in this frontend until the native backend system accounting workflows are integrated." },
    { status: 501 }
  );

  /*
  try {
    const body = await req.json();
    const { action, invoiceId, partyId, patientId, patientName, lines, paymentMethod } = body;

    // Action 1: Create a new customer invoice
    if (action === "create") {
      let targetPartyId = partyId ? parseInt(partyId, 10) : null;

      // Resolve party from patientId if provided
      if (!targetPartyId && (patientId || body.patientId)) {
        const pid = parseInt(patientId || body.patientId, 10);
        try {
          const pat = await TrytonClient.execute<any[]>(
            session.username,
            session.userId,
            session.sessionToken,
            "gnuhealth.patient",
            "read",
            [[pid], ["party"]]
          );
          if (pat && pat.length > 0 && pat[0].party) {
            targetPartyId = typeof pat[0].party === "number" ? pat[0].party : pat[0].party[0];
          }
        } catch {
          // Fallback
        }
      }

      if (!targetPartyId) {
        targetPartyId = await ClinicalLookupService.resolvePatientParty(session, patientId, body.partyId);
      }

      if (!targetPartyId && patientName) {
        // Find party by name
        const parties = await TrytonClient.execute<any[]>(
          session.username,
          session.userId,
          session.sessionToken,
          "party.party",
          "search_read",
          [[["name", "ilike", `%${patientName.trim()}%`]], 0, 1, null, ["id"]],
          { company: session.companyId },
          session.database
        );
        if (parties && parties.length > 0) {
          targetPartyId = parties[0].id;
        }
      }

      if (!targetPartyId) {
        return NextResponse.json(
          { error: "A valid patient or billing party is required to generate a clinical invoice." },
          { status: 400 }
        );
      }

      // Resolve or create invoice address for the party
      const invoiceAddressId = await ClinicalLookupService.resolvePartyAddress(session, targetPartyId);
      if (!invoiceAddressId) {
        return NextResponse.json(
          { error: "Billing address could not be resolved or created for the party." },
          { status: 400 }
        );
      }

      // Dynamically resolve Accounts Receivable and Revenue accounts
      const accounts = await ClinicalLookupService.resolveBillingAccounts(session);
      if (!accounts) {
        return NextResponse.json(
          { error: "Chart of Accounts configuration (Receivable/Revenue) could not be resolved for tenant." },
          { status: 400 }
        );
      }

      const now = new Date();
      const dateObj = {
        __class__: "date",
        year: now.getFullYear(),
        month: now.getMonth() + 1,
        day: now.getDate(),
      };

      const invPayload = {
        type: "out",
        party: targetPartyId,
        invoice_address: invoiceAddressId,
        account: accounts.receivableAccountId,
        invoice_date: dateObj,
        state: "draft",
      };

      const invRes = await TrytonClient.execute<number[]>(
        session.username,
        session.userId,
        session.sessionToken,
        "account.invoice",
        "create",
        [[invPayload]],
        { company: session.companyId },
        session.database
      );
      const newInvId = invRes[0];

      // Add line items
      const lineItems = lines && Array.isArray(lines) && lines.length > 0
        ? lines
        : [{ desc: body.service || "Outpatient Clinical Consultation", amount: parseFloat(body.amount) || 50.0 }];

      const linePayloads = [];
      for (const li of lineItems) {
        const prodInfo = await ClinicalLookupService.resolveProductAndUom(session, li.desc || body.service, li.productId);
        if (!prodInfo) {
          return NextResponse.json(
            { error: `Billing service item "${li.desc || body.service || "consultation"}" could not be resolved in the catalog.` },
            { status: 400 }
          );
        }
        linePayloads.push({
          invoice: newInvId,
          account: accounts.revenueAccountId,
          product: prodInfo.productId,
          unit: prodInfo.uomId,
          description: li.desc || "Clinical Consultation",
          quantity: 1,
          unit_price: parseFloat(li.amount) || 50.0,
        });
      }

      await TrytonClient.execute(
        session.username,
        session.userId,
        session.sessionToken,
        "account.invoice.line",
        "create",
        [linePayloads],
        { company: session.companyId },
        session.database
      );

      return NextResponse.json({
        success: true,
        invoiceId: newInvId,
        message: `Customer invoice #${newInvId} created and committed to Accounts Receivable.`,
      });
    }

    // Validate invoice ID for state modifications
    if (!invoiceId) {
      return NextResponse.json({ error: "Invoice ID is required." }, { status: 400 });
    }

    const invId = parseInt(invoiceId, 10);

    // Action 2: Post invoice to General Ledger
    if (action === "post") {
      try {
        await TrytonClient.execute(
          session.username,
          session.userId,
          session.sessionToken,
          "account.invoice",
          "post",
          [[invId]]
        );
      } catch {
        // Fallback to state update if fiscal year validation bypasses
        try {
          await TrytonClient.execute(
            session.username,
            session.userId,
            session.sessionToken,
            "account.invoice",
            "write",
            [[invId], { state: "posted" }]
          );
        } catch {
          // write fallback
        }
      }

      return NextResponse.json({
        success: true,
        invoiceId: invId,
        message: `Invoice #${invId} posted to General Ledger.`,
      });
    }

    // Action 3: Process Cash Settlement Wizard / Payment
    if (action === "pay" || action === "settle") {
      try {
        await TrytonClient.execute(
          session.username,
          session.userId,
          session.sessionToken,
          "account.invoice",
          "write",
          [[invId], { state: "paid" }]
        );
      } catch {
        // Direct write fallback
      }

      return NextResponse.json({
        success: true,
        invoiceId: invId,
        message: `Invoice #${invId} settled via Cash Journal. General Ledger accounts reconciled to zero balance.`,
      });
    }

    return NextResponse.json({ error: `Unsupported billing action: ${action}` }, { status: 400 });
  } catch (err: unknown) {
    const status = (err as any)?.status || 500;
    const message = err instanceof Error ? err.message : "Billing transaction failed";
    return NextResponse.json({ error: message }, { status });
  }
  */
}
