import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth-session";
import { TrytonClient } from "@/lib/tryton-client";
import { ClinicalLookupService } from "@/lib/clinical-lookup";
import { hasModuleAccess } from "@/lib/access-control";

// Insurer pre-authorizations and claims. The records live in the native Tryton module `ist_claims`
// (ist.claims.authorization / ist.claims.claim) next to the policy (gnuhealth.insurance) and invoice
// (account.invoice); nothing is kept in the app. Every read is pinned to the active hospital's company.

type Session = NonNullable<Awaited<ReturnType<typeof getSession>>>;
type Row = Record<string, any>;

const AUTH = "ist.claims.authorization";
const CLAIM = "ist.claims.claim";
const AUTH_TYPES = ["outpatient", "imaging", "medication", "inpatient", "procedure"];

const idOf = (v: unknown): number | null => (typeof v === "number" ? v : Array.isArray(v) && typeof v[0] === "number" ? v[0] : null);
const num = (v: unknown): number => Number(v && typeof v === "object" && "decimal" in (v as Row) ? (v as Row).decimal : v) || 0;
const money = (n: number) => ({ __class__: "Decimal", decimal: n.toFixed(2) });
const day = (v: any): string | null => (v && typeof v === "object" && v.year ? `${v.year}-${String(v.month).padStart(2, "0")}-${String(v.day).padStart(2, "0")}` : null);
const stamp = (v: any): string | null =>
  v && typeof v === "object" && v.year
    ? new Date(Date.UTC(v.year, v.month - 1, v.day, v.hour || 0, v.minute || 0, v.second || 0)).toISOString()
    : null;

function rpc<T>(session: Session, model: string, method: string, params: unknown[]) {
  return TrytonClient.execute<T>(
    session.username, session.userId, session.sessionToken, model, method, params,
    { company: session.companyId }, session.database
  );
}

async function names(session: Session, model: string, ids: number[], field = "name") {
  const out: Record<number, Row> = {};
  if (ids.length === 0) return out;
  const rows = await rpc<Row[]>(session, model, "search_read", [[["id", "in", ids]], 0, ids.length, null, ["id", field]]).catch(() => []);
  for (const r of rows) out[r.id] = r;
  return out;
}

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized session" }, { status: 401 });
  if (!hasModuleAccess(session.role, "insurance")) {
    return NextResponse.json({ error: "Your role does not have permission for this module." }, { status: 403 });
  }
  try {
    const mine = [["company", "=", session.companyId]];
    const [auths, claims] = await Promise.all([
      rpc<Row[]>(session, AUTH, "search_read", [mine, 0, 300, [["id", "DESC"]],
        ["id", "reference", "patient", "insurance", "insurer", "auth_type", "service", "diagnosis", "requested_amount", "approved_amount",
          "insurer_reference", "state", "submitted_at", "due_at", "decided_at", "decision_note"]]),
      rpc<Row[]>(session, CLAIM, "search_read", [mine, 0, 300, [["id", "DESC"]],
        ["id", "reference", "invoice", "party", "insurer", "authorization", "claimed_amount", "approved_amount", "settled_amount",
          "state", "submitted_on", "due_on", "settled_on", "note"]]),
    ]);

    const patientIds = [...new Set(auths.map((a) => idOf(a.patient)).filter((x): x is number => !!x))];
    const partyIds = [...new Set([...claims.map((c) => idOf(c.party)), ...claims.map((c) => idOf(c.insurer)), ...auths.map((a) => idOf(a.insurer))].filter((x): x is number => !!x))];
    const invoiceIds = [...new Set(claims.map((c) => idOf(c.invoice)).filter((x): x is number => !!x))];
    const [patients, parties, invoices] = await Promise.all([
      patientIds.length ? rpc<Row[]>(session, "gnuhealth.patient", "search_read", [[["id", "in", patientIds]], 0, patientIds.length, null, ["id", "puid", "party"]]).catch(() => []) : [],
      names(session, "party.party", partyIds),
      invoiceIds.length ? rpc<Row[]>(session, "account.invoice", "search_read", [[["id", "in", invoiceIds]], 0, invoiceIds.length, null, ["id", "number", "state"]]).catch(() => []) : [],
    ]);
    const patientParty = await names(session, "party.party", patients.map((p) => idOf(p.party)).filter((x): x is number => !!x));
    const patientById: Record<number, { puid: string | null; name: string }> = {};
    for (const p of patients) patientById[p.id] = { puid: p.puid || null, name: patientParty[idOf(p.party) as number]?.name || "" };
    const invoiceById: Record<number, Row> = {};
    for (const i of invoices) invoiceById[i.id] = i;

    const now = Date.now();
    const authorizations = auths.map((a) => {
      const due = stamp(a.due_at);
      return {
        id: a.id, reference: a.reference, state: a.state, authType: a.auth_type, service: a.service, diagnosis: a.diagnosis || null,
        patientId: idOf(a.patient), patientName: patientById[idOf(a.patient) as number]?.name || "", puid: patientById[idOf(a.patient) as number]?.puid || null,
        insuranceId: idOf(a.insurance), insurer: parties[idOf(a.insurer) as number]?.name || "",
        requestedAmount: num(a.requested_amount), approvedAmount: a.approved_amount == null ? null : num(a.approved_amount),
        insurerReference: a.insurer_reference || null, submittedAt: stamp(a.submitted_at), dueAt: due, decidedAt: stamp(a.decided_at),
        overdue: a.state === "submitted" && !!due && new Date(due).getTime() < now, note: a.decision_note || null,
      };
    });
    const today = new Date().toISOString().slice(0, 10);
    const claimRows = claims.map((c) => {
      const due = day(c.due_on);
      const open = ["submitted", "queried", "approved", "partially_paid"].includes(c.state);
      const outstanding = Math.max(0, (c.approved_amount == null ? num(c.claimed_amount) : num(c.approved_amount)) - num(c.settled_amount));
      return {
        id: c.id, reference: c.reference, state: c.state, invoiceId: idOf(c.invoice), invoiceNumber: invoiceById[idOf(c.invoice) as number]?.number || "",
        patientName: parties[idOf(c.party) as number]?.name || "", insurer: parties[idOf(c.insurer) as number]?.name || "",
        authorizationId: idOf(c.authorization), claimedAmount: num(c.claimed_amount), approvedAmount: c.approved_amount == null ? null : num(c.approved_amount),
        settledAmount: num(c.settled_amount), outstanding, submittedOn: day(c.submitted_on), dueOn: due, settledOn: day(c.settled_on), note: c.note || null,
        overdue: open && !!due && due < today,
      };
    });

    // What the desk can start from: policies to ask approval for, and posted invoices not yet claimed.
    const [policies, openInvoices] = await Promise.all([
      rpc<Row[]>(session, "gnuhealth.insurance", "search_read", [[], 0, 300, [["id", "DESC"]], ["id", "number", "party", "company"]]).catch(() => []),
      rpc<Row[]>(session, "account.invoice", "search_read", [[["type", "=", "out"], ["state", "=", "posted"], ["company", "=", session.companyId]], 0, 300, [["id", "DESC"]],
        ["id", "number", "party", "total_amount", "amount_to_pay"]]).catch(() => []),
    ]);
    const claimed = new Set(claimRows.filter((c) => c.state !== "rejected").map((c) => c.invoiceId));
    const polParties = await names(session, "party.party", [...new Set(policies.flatMap((p) => [idOf(p.party), idOf(p.company)]).filter((x): x is number => !!x))]);
    const invParties = await names(session, "party.party", [...new Set(openInvoices.map((i) => idOf(i.party)).filter((x): x is number => !!x))]);
    const insuredParties = new Set(policies.map((p) => idOf(p.party)));

    const sum = (rows: { state: string }[], states: string[]) => rows.filter((r) => states.includes(r.state)).length;
    return NextResponse.json({
      success: true,
      authorizations, claims: claimRows,
      summary: {
        authPending: sum(authorizations, ["draft", "submitted"]),
        authOverdue: authorizations.filter((a) => a.overdue).length,
        authApproved: sum(authorizations, ["approved", "partial"]),
        authRejected: sum(authorizations, ["rejected"]),
        claimsOpen: claimRows.filter((c) => ["submitted", "queried", "approved", "partially_paid"].includes(c.state)).length,
        claimsOverdue: claimRows.filter((c) => c.overdue).length,
        claimsRejected: sum(claimRows, ["rejected"]),
        receivable: Math.round(claimRows.filter((c) => !["rejected", "draft"].includes(c.state)).reduce((t, c) => t + c.outstanding, 0)),
        received: Math.round(claimRows.reduce((t, c) => t + c.settledAmount, 0)),
      },
      policies: policies.map((p) => ({ id: p.id, number: p.number, patientName: polParties[idOf(p.party) as number]?.name || "", insurer: polParties[idOf(p.company) as number]?.name || "" })),
      claimableInvoices: openInvoices
        .filter((i) => !claimed.has(i.id) && insuredParties.has(idOf(i.party)))
        .map((i) => ({ id: i.id, number: i.number, patientName: invParties[idOf(i.party) as number]?.name || "", amount: num(i.amount_to_pay ?? i.total_amount) })),
    });
  } catch (err: unknown) {
    const status = (err as any)?.status || 500;
    return NextResponse.json({ error: err instanceof Error ? err.message : "Failed to load claims" }, { status });
  }
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized session" }, { status: 401 });
  if (!hasModuleAccess(session.role, "insurance")) {
    return NextResponse.json({ error: "Your role does not have permission for this module." }, { status: 403 });
  }
  try {
    const body = await req.json();
    const action = String(body.action || "");
    const text = (v: unknown) => (typeof v === "string" && v.trim() ? v.trim().slice(0, 500) : undefined);
    const amount = (v: unknown) => {
      const n = Number(v);
      return Number.isFinite(n) && n >= 0 ? n : NaN;
    };
    const fail = (message: string, status = 400) => NextResponse.json({ error: message }, { status });

    // ---- pre-authorizations ----
    if (action === "create_authorization") {
      const insuranceId = Number(body.insuranceId);
      const requested = amount(body.requestedAmount);
      const service = text(body.service);
      if (!Number.isSafeInteger(insuranceId) || insuranceId <= 0 || !service || !Number.isFinite(requested) || requested <= 0) {
        return fail("Choose the patient's policy, the service and the amount requested.");
      }
      if (!AUTH_TYPES.includes(body.authType)) return fail("Choose what the approval is for.");
      const policy = (await rpc<Row[]>(session, "gnuhealth.insurance", "read", [[insuranceId], ["party"]]))[0];
      const partyId = idOf(policy?.party);
      const patient = partyId ? (await rpc<Row[]>(session, "gnuhealth.patient", "search_read", [[["party", "=", partyId]], 0, 1, null, ["id"]]))[0] : null;
      if (!patient) return fail("That policy does not belong to a registered patient.");
      const created = await rpc<number[]>(session, AUTH, "create", [[{
        patient: patient.id, insurance: insuranceId, company: session.companyId, institution: session.institutionId || undefined,
        auth_type: body.authType, service, diagnosis: text(body.diagnosis), requested_amount: money(requested),
      }]]);
      if (body.submit) await rpc(session, AUTH, "write", [[created[0]], { state: "submitted" }]);
      return NextResponse.json({ success: true, authorizationId: created[0], message: body.submit ? "Pre-authorization sent to the insurer." : "Pre-authorization saved as a draft." });
    }

    if (action === "authorization_action") {
      const id = Number(body.id);
      if (!Number.isSafeInteger(id) || id <= 0) return fail("Pre-authorization is required.");
      const step = String(body.step || "");
      const current = (await rpc<Row[]>(session, AUTH, "search_read", [[["id", "=", id], ["company", "=", session.companyId]], 0, 1, null, ["id", "requested_amount"]]))[0];
      if (!current) return fail("Pre-authorization not found in this hospital.", 404);
      const values: Row = {};
      if (step === "submit") values.state = "submitted";
      else if (step === "approve" || step === "partial") {
        const approved = amount(body.approvedAmount ?? (step === "approve" ? num(current.requested_amount) : NaN));
        const ref = text(body.insurerReference);
        if (!Number.isFinite(approved) || approved <= 0 || !ref) return fail("Enter the approved amount and the insurer's approval number.");
        if (step === "approve" && approved < num(current.requested_amount)) return fail("Use 'partly approved' when the insurer approves less than requested.");
        Object.assign(values, { state: step === "approve" ? "approved" : "partial", approved_amount: money(approved), insurer_reference: ref, decision_note: text(body.note) });
      } else if (step === "reject") {
        const note = text(body.note);
        if (!note) return fail("Enter the insurer's reason for rejecting.");
        Object.assign(values, { state: "rejected", decision_note: note });
      } else if (step === "expire") values.state = "expired";
      else if (step === "cancel") values.state = "cancelled";
      else return fail(`Unsupported step: ${step}`);
      await rpc(session, AUTH, "write", [[id], values]);
      return NextResponse.json({ success: true, message: "Pre-authorization updated." });
    }

    // ---- claims ----
    if (action === "create_claim") {
      const invoiceId = Number(body.invoiceId);
      if (!Number.isSafeInteger(invoiceId) || invoiceId <= 0) return fail("Choose an invoice to claim.");
      const invoice = (await rpc<Row[]>(session, "account.invoice", "search_read", [[["id", "=", invoiceId], ["type", "=", "out"], ["company", "=", session.companyId]], 0, 1, null,
        ["id", "party", "amount_to_pay", "total_amount", "state"]]))[0];
      if (!invoice) return fail("Invoice not found in this hospital.", 404);
      const partyId = idOf(invoice.party);
      const policy = (await rpc<Row[]>(session, "gnuhealth.insurance", "search_read", [[["party", "=", partyId]], 0, 1, [["id", "DESC"]], ["id", "company"]]))[0];
      const insurerId = idOf(policy?.company);
      if (!insurerId) return fail("This patient has no insurance policy, so there is no insurer to claim from.");
      let authorizationId = Number(body.authorizationId) || undefined;
      if (authorizationId) {
        const ok = await rpc<Row[]>(session, AUTH, "search_read", [[["id", "=", authorizationId], ["company", "=", session.companyId], ["state", "in", ["approved", "partial"]]], 0, 1, null, ["id"]]);
        if (!ok.length) authorizationId = undefined;
      }
      const created = await rpc<number[]>(session, CLAIM, "create", [[{
        invoice: invoiceId, insurer: insurerId, authorization: authorizationId, company: session.companyId, institution: session.institutionId || undefined,
        claimed_amount: money(num(invoice.amount_to_pay ?? invoice.total_amount)),
      }]]);
      if (body.submit) await rpc(session, CLAIM, "write", [[created[0]], { state: "submitted" }]);
      return NextResponse.json({ success: true, claimId: created[0], message: body.submit ? "Claim submitted to the insurer." : "Claim saved as a draft." });
    }

    if (action === "claim_action") {
      const id = Number(body.id);
      if (!Number.isSafeInteger(id) || id <= 0) return fail("Claim is required.");
      const step = String(body.step || "");
      const claim = (await rpc<Row[]>(session, CLAIM, "search_read", [[["id", "=", id], ["company", "=", session.companyId]], 0, 1, null,
        ["id", "invoice", "claimed_amount", "approved_amount", "settled_amount", "state"]]))[0];
      if (!claim) return fail("Claim not found in this hospital.", 404);
      const values: Row = {};
      if (step === "submit" || step === "resubmit") values.state = "submitted";
      else if (step === "query") {
        const note = text(body.note);
        if (!note) return fail("Enter what the insurer is asking for.");
        Object.assign(values, { state: "queried", note });
      } else if (step === "approve") {
        const approved = amount(body.approvedAmount ?? num(claim.claimed_amount));
        if (!Number.isFinite(approved) || approved <= 0 || approved > num(claim.claimed_amount)) return fail("The approved amount must be above zero and not more than the claim.");
        Object.assign(values, { state: "approved", approved_amount: money(approved), note: text(body.note) });
      } else if (step === "reject") {
        const note = text(body.note);
        if (!note) return fail("Enter the insurer's reason for rejecting.");
        Object.assign(values, { state: "rejected", note });
      } else if (step === "settle") {
        const received = amount(body.amount);
        const target = num(claim.approved_amount);
        const owed = target - num(claim.settled_amount);
        if (!Number.isFinite(received) || received <= 0 || received > owed + 0.005) return fail(`Enter the amount received (up to ${owed.toFixed(2)}).`);
        const total = num(claim.settled_amount) + received;
        const full = total >= target - 0.005;
        Object.assign(values, { state: full ? "paid" : "partially_paid", settled_amount: money(total) });
        if (full) {
          // The insurer has paid everything it approved: settle the invoice itself through the native payment wizard
          // so the ledger shows the money received, not just a status here.
          const invoiceId = idOf(claim.invoice);
          const invoice = invoiceId ? (await rpc<Row[]>(session, "account.invoice", "read", [[invoiceId], ["state"]]))[0] : null;
          if (invoiceId && invoice && invoice.state === "posted") {
            const methodId = await ClinicalLookupService.resolvePaymentMethod(session);
            if (!methodId) return fail("No cash/bank payment method is configured for this hospital's company.");
            await TrytonClient.payInvoiceFull(session.username, session.userId, session.sessionToken, invoiceId, methodId,
              "Insurer settlement", { company: session.companyId }, session.database);
          }
        }
      } else return fail(`Unsupported step: ${step}`);
      await rpc(session, CLAIM, "write", [[id], values]);
      return NextResponse.json({ success: true, message: "Claim updated." });
    }

    return fail(`Unsupported action: ${action}`);
  } catch (err: unknown) {
    const status = (err as any)?.status || 500;
    const raw = err instanceof Error ? err.message : "Claims transaction failed";
    // Tryton's own refusal (for example an invalid state change) arrives inside a long RPC error: show just the reason.
    const reason = /cannot go from[^"\]\\]*/.exec(raw)?.[0];
    return NextResponse.json({ error: reason || raw.slice(0, 300) }, { status: reason ? 409 : status });
  }
}
