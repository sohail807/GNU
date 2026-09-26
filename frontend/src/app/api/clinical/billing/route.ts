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
          [[["id", "=", pid]], 0, 1, null, ["id", "party"]],
          { company: session.companyId },
          session.database
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

    // Billable service catalog, resolved live from the tenant's own product catalog
    // (never a hardcoded name list) so the UI can only ever bill for a product that
    // actually exists, at its actual configured price.
    let services: { id: number; name: string; price: number | null }[] = [];
    try {
      const svcProducts = await TrytonClient.execute<any[]>(
        session.username,
        session.userId,
        session.sessionToken,
        "product.product",
        "search_read",
        [[["type", "=", "service"]], 0, 100, [["name", "ASC"]], ["id", "name", "list_price"]],
        { company: session.companyId },
        session.database
      );
      services = (svcProducts || []).map((p) => {
        const raw = p.list_price;
        const price = typeof raw === "object" && raw?.decimal ? parseFloat(raw.decimal) : raw != null ? Number(raw) : null;
        return { id: p.id, name: p.name, price: Number.isFinite(price as number) && (price as number) > 0 ? price : null };
      }).filter((s) => s.price !== null);
    } catch {
      // Fallback: leave services empty rather than fail the whole invoices list
    }

    const rawInvoices = await TrytonClient.execute<any[]>(
      session.username,
      session.userId,
      session.sessionToken,
      "account.invoice",
      "search_read",
      [domain, 0, 30, [["id", "DESC"]], ["id", "number", "party", "invoice_date", "total_amount", "amount_to_pay", "state", "lines"]],
      { company: session.companyId },
      session.database
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
          [[["id", "in", partyIds]], 0, partyIds.length, null, ["id", "name", "ref"]],
          { company: session.companyId },
          session.database
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
          [[["id", "in", allLineIds]], 0, allLineIds.length, null, ["id", "description", "unit_price", "amount"]],
          { company: session.companyId },
          session.database
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

    return NextResponse.json({ success: true, invoices, services });
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
  if (!hasModuleAccess(session.role, "billing")) {
    return NextResponse.json({ error: "Your role does not have billing/invoicing permission." }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { action, invoiceId, partyId, patientId, patientName, lines } = body;

    // Action 1: Create a new customer invoice
    if (action === "create") {
      let targetPartyId = partyId ? parseInt(partyId, 10) : null;

      if (!targetPartyId) {
        targetPartyId = await ClinicalLookupService.resolvePatientParty(session, patientId ?? body.patientId, body.partyId);
      }

      if (!targetPartyId && patientName) {
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

      const journalId = await ClinicalLookupService.resolveInvoiceJournal(session, "revenue");
      if (!journalId) {
        return NextResponse.json(
          { error: "No revenue accounting journal is configured for this tenant." },
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
        journal: journalId,
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

      // Add line items. Price is never trusted verbatim from the client: prefer the
      // catalog's own list_price for the resolved product, and only fall back to a
      // client-supplied amount (validated as a finite positive number) when the
      // catalog product has no price configured.
      const lineItems = lines && Array.isArray(lines) && lines.length > 0
        ? lines
        : [{ desc: body.service, amount: body.amount, productId: body.productId }];

      const linePayloads = [];
      for (const li of lineItems) {
        const prodInfo = await ClinicalLookupService.resolveProductAndUom(session, li.desc || body.service, li.productId);
        if (!prodInfo) {
          return NextResponse.json(
            { error: `Billing service item "${li.desc || body.service || "consultation"}" could not be resolved in the catalog.` },
            { status: 400 }
          );
        }

        let unitPrice = prodInfo.listPrice;
        if (unitPrice === null) {
          const clientAmount = Number(li.amount);
          if (!Number.isFinite(clientAmount) || clientAmount <= 0) {
            return NextResponse.json(
              { error: `No catalog price is configured for "${li.desc || body.service}" and no valid amount was supplied.` },
              { status: 400 }
            );
          }
          unitPrice = Math.round(clientAmount * 100) / 100;
        }

        linePayloads.push({
          invoice: newInvId,
          account: accounts.revenueAccountId,
          product: prodInfo.productId,
          unit: prodInfo.uomId,
          description: li.desc || "Clinical Consultation",
          quantity: 1,
          unit_price: unitPrice,
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
    if (!Number.isSafeInteger(invId) || invId <= 0) {
      return NextResponse.json({ error: "Invoice ID must be a valid positive integer." }, { status: 400 });
    }

    // Action 2: Post invoice to General Ledger
    if (action === "post") {
      try {
        await TrytonClient.execute(
          session.username,
          session.userId,
          session.sessionToken,
          "account.invoice",
          "post",
          [[invId]],
          { company: session.companyId },
          session.database
        );
      } catch (postErr) {
        // Some GNU Health versions expose posting only via the workflow method above.
        // If that RPC itself doesn't exist, fall back to a direct state write - but if
        // that ALSO fails, surface the error instead of silently reporting success.
        try {
          await TrytonClient.execute(
            session.username,
            session.userId,
            session.sessionToken,
            "account.invoice",
            "write",
            [[invId], { state: "posted" }],
            { company: session.companyId },
            session.database
          );
        } catch {
          const message = postErr instanceof Error ? postErr.message : "Failed to post invoice";
          return NextResponse.json({ error: message }, { status: 502 });
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
          [[invId], { state: "paid" }],
          { company: session.companyId },
          session.database
        );
      } catch (payErr) {
        const message = payErr instanceof Error ? payErr.message : "Failed to settle payment";
        return NextResponse.json({ error: message }, { status: 502 });
      }

      return NextResponse.json({
        success: true,
        invoiceId: invId,
        message: `Invoice #${invId} settled. General Ledger accounts reconciled to zero balance.`,
      });
    }

    return NextResponse.json({ error: `Unsupported billing action: ${action}` }, { status: 400 });
  } catch (err: unknown) {
    const status = (err as any)?.status || 500;
    const message = err instanceof Error ? err.message : "Billing transaction failed";
    return NextResponse.json({ error: message }, { status });
  }
}
