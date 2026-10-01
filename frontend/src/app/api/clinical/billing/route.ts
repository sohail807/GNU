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
      // Hospital beds are also modeled as type="service" products (so gnuhealth.hospital.bed
      // can reference one), but they're billed automatically through the inpatient admission/
      // ward workflow, not picked manually as an outpatient invoice line item - confirmed live,
      // every bed in the ward inventory (19 of them) was flooding this picker. Exclude anything
      // flagged is_bed=True the same way facilities/route.ts's own bed domain does.
      const svcProducts = await TrytonClient.execute<any[]>(
        session.username,
        session.userId,
        session.sessionToken,
        "product.product",
        "search_read",
        [[["type", "=", "service"], ["is_bed", "!=", true]], 0, 100, [["name", "ASC"]], ["id", "name", "list_price"]],
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
      [domain, 0, 100, [["id", "DESC"]], ["id", "number", "party", "invoice_date", "total_amount", "amount_to_pay", "state", "lines"]],
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

    // Resolve this tenant's own facility name/address for receipt printouts,
    // rather than a hardcoded hospital name - a newly onboarded tenant has
    // its own company, not the original demo one (same pattern already
    // fixed for the admin staff directory header).
    let hospitalName = "";
    let hospitalAddress: string | null = null;
    try {
      const companies = await TrytonClient.execute<any[]>(
        session.username, session.userId, session.sessionToken,
        "company.company", "read", [[session.companyId], ["rec_name", "party"]],
        { company: session.companyId }, session.database
      );
      hospitalName = companies[0]?.rec_name || "";
      const partyId = typeof companies[0]?.party === "number" ? companies[0].party : companies[0]?.party?.[0];
      if (partyId) {
        const parties = await TrytonClient.execute<any[]>(
          session.username, session.userId, session.sessionToken,
          "party.party", "read", [[partyId], ["addresses"]],
          { company: session.companyId }, session.database
        );
        const addressId = parties[0]?.addresses?.[0];
        if (addressId) {
          const addresses = await TrytonClient.execute<any[]>(
            session.username, session.userId, session.sessionToken,
            "party.address", "read", [[addressId], ["street", "city"]],
            { company: session.companyId }, session.database
          );
          const street = addresses[0]?.street;
          const city = addresses[0]?.city;
          // Tenant onboarding seeds this address with literal placeholder
          // tokens (e.g. "<STREET>, Zone <ZONE>...") until someone actually
          // configures it - never print that on a receipt as if it were a
          // real address.
          const isPlaceholder = (v: unknown) => typeof v !== "string" || !v.trim() || v.includes("<");
          if (!isPlaceholder(street) && !isPlaceholder(city)) {
            hospitalAddress = `${street}, ${city}`;
          }
        }
      }
    } catch {
      // Non-fatal: the receipt still prints, just without a facility line.
    }

    // The hospital's own currency (a group has AED and QAR hospitals), so the screens never assume one.
    let currency = "";
    try {
      const company = await TrytonClient.execute<Array<Record<string, any>>>(
        session.username, session.userId, session.sessionToken,
        "company.company", "read", [[session.companyId], ["currency.code"]],
        { company: session.companyId }, session.database
      );
      currency = company?.[0]?.["currency."]?.code || company?.[0]?.["currency.code"] || "";
    } catch { /* leave blank */ }
    return NextResponse.json({ success: true, invoices, services, hospitalName, hospitalAddress, currency });
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

      const requestedLines: Array<{ desc?: string; amount?: unknown; productId?: string | number | null }> =
        lines && Array.isArray(lines) && lines.length > 0
          ? lines
          : [{ desc: body.service, amount: body.amount, productId: body.productId }];
      const requestedDescs = requestedLines.map((li) => (li.desc || body.service || "Clinical Consultation").trim());

      // A double-click (or a slow network prompting a retry) on "Create
      // Invoice" used to silently generate two identical invoices for the
      // same patient and the same service - nothing checked for one already
      // pending. Block it: same party, same unpaid/undecided invoice, a line
      // with the exact same description, dated today.
      try {
        const todayStart = { __class__: "date", year: new Date().getUTCFullYear(), month: new Date().getUTCMonth() + 1, day: new Date().getUTCDate() };
        const existingInvoices = await TrytonClient.execute<Array<{ id: number; number: string | null; lines: number[] }>>(
          session.username, session.userId, session.sessionToken,
          "account.invoice", "search_read",
          [[
            ["party", "=", targetPartyId],
            ["type", "=", "out"],
            ["state", "in", ["draft", "posted"]],
            ["invoice_date", "=", todayStart],
          ], 0, 20, null, ["id", "number", "lines"]],
          { company: session.companyId }, session.database
        );
        if (existingInvoices.length > 0) {
          const lineIds = existingInvoices.flatMap((inv) => inv.lines || []);
          if (lineIds.length > 0) {
            const existingLines = await TrytonClient.execute<Array<{ invoice: unknown; description: string }>>(
              session.username, session.userId, session.sessionToken,
              "account.invoice.line", "read", [lineIds, ["invoice", "description"]],
              { company: session.companyId }, session.database
            );
            const dupInvoiceId = existingLines.find((l) =>
              requestedDescs.includes((l.description || "").trim())
            )?.invoice;
            const dupId = typeof dupInvoiceId === "number" ? dupInvoiceId : Array.isArray(dupInvoiceId) ? dupInvoiceId[0] : null;
            if (dupId) {
              const dup = existingInvoices.find((inv) => inv.id === dupId);
              return NextResponse.json(
                { error: `An invoice for this patient with the same service already exists today (${dup?.number || `#${dup?.id}`}). Use that invoice instead of creating a duplicate.` },
                { status: 409 }
              );
            }
          }
        }
      } catch {
        // Non-fatal: if the duplicate check itself fails, don't block legitimate billing on it.
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
      const linePayloads = [];
      for (const li of requestedLines) {
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
        // account.invoice.post is GNU Health's real posting workflow - it's what
        // assigns the invoice sequence number and creates the accounting move.
        // A previous version of this handler fell back to a raw state write
        // ({state: "posted"}) whenever this failed, which "succeeded" by
        // definition (a plain field write skips all business-rule validation)
        // but left the invoice with no move and no number - a fake posted
        // state with no accounting substance behind it. Surface the real
        // Tryton error instead of pretending it worked.
        const message = postErr instanceof Error ? postErr.message : "Failed to post invoice";
        const status = (postErr as { status?: number })?.status || 502;
        return NextResponse.json({ error: message }, { status });
      }

      return NextResponse.json({
        success: true,
        invoiceId: invId,
        message: `Invoice #${invId} posted to General Ledger.`,
      });
    }

    // Action 3: Process Cash Settlement Wizard / Payment
    if (action === "pay" || action === "settle") {
      // This used to be a raw write({state: "paid"}) - never touching Tryton's
      // real account.invoice.pay wizard, so no payment move was ever created
      // and no receivable line was ever reconciled. Every "paid" invoice
      // produced by that path was a fake status with nothing behind it.
      const paymentMethodId = await ClinicalLookupService.resolvePaymentMethod(session);
      if (!paymentMethodId) {
        return NextResponse.json(
          { error: "No cash/bank payment method is configured for this tenant's company - cannot settle invoices." },
          { status: 400 }
        );
      }

      try {
        await TrytonClient.payInvoiceFull(
          session.username,
          session.userId,
          session.sessionToken,
          invId,
          paymentMethodId,
          typeof body.description === "string" && body.description.trim() ? body.description.trim() : "Cash settlement",
          { company: session.companyId },
          session.database
        );
      } catch (payErr) {
        const message = payErr instanceof Error ? payErr.message : "Failed to settle payment";
        const status = (payErr as { status?: number })?.status || 502;
        return NextResponse.json({ error: message }, { status });
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
