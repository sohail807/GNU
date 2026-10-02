"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { AlertCircle, CheckCircle2, ClipboardCheck, Plus, ReceiptText } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";

type Variant = "green" | "amber" | "blue" | "red" | "neutral" | "purple" | "teal";

interface Authorization {
  id: number; reference: string; state: string; authType: string; service: string; diagnosis: string | null;
  patientName: string; puid: string | null; insurer: string; requestedAmount: number; approvedAmount: number | null;
  insurerReference: string | null; submittedAt: string | null; dueAt: string | null; overdue: boolean; note: string | null;
}
interface Claim {
  id: number; reference: string; state: string; invoiceNumber: string; patientName: string; insurer: string;
  authorizationId: number | null; claimedAmount: number; approvedAmount: number | null; settledAmount: number; outstanding: number;
  submittedOn: string | null; dueOn: string | null; overdue: boolean; note: string | null;
}
interface Summary {
  authPending: number; authOverdue: number; authApproved: number; authRejected: number;
  claimsOpen: number; claimsOverdue: number; claimsRejected: number; receivable: number; received: number;
}

const AUTH_STATE: Record<string, [string, Variant]> = {
  draft: ["Draft", "neutral"], submitted: ["Waiting for insurer", "amber"], approved: ["Approved", "green"],
  partial: ["Partly approved", "blue"], rejected: ["Rejected", "red"], expired: ["Expired", "red"], cancelled: ["Cancelled", "neutral"],
};
const CLAIM_STATE: Record<string, [string, Variant]> = {
  draft: ["Draft", "neutral"], submitted: ["Submitted", "amber"], queried: ["Insurer query", "purple"], approved: ["Approved", "blue"],
  partially_paid: ["Partly paid", "teal"], paid: ["Paid", "green"], rejected: ["Rejected", "red"],
};
const AUTH_TYPE: Record<string, string> = {
  outpatient: "Outpatient consultation", imaging: "Imaging", medication: "Medication", inpatient: "Inpatient admission", procedure: "Surgery / procedure",
};
const SELECT = "w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg font-semibold focus:outline-none focus:border-[#0F766E]";
const fmt = (n: number) => n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const when = (iso: string | null) => (iso ? new Date(iso).toLocaleString([], { dateStyle: "medium", timeStyle: "short" }) : "—");

function left(iso: string | null): string {
  if (!iso) return "—";
  const ms = new Date(iso).getTime() - Date.now();
  const h = Math.abs(ms) / 36e5;
  const text = h >= 48 ? `${Math.round(h / 24)} days` : h >= 1 ? `${Math.floor(h)} h ${Math.round((h % 1) * 60)} min` : `${Math.round(h * 60)} min`;
  return ms < 0 ? `${text} late` : `${text} left`;
}

type Dialog =
  | { kind: "new_auth" }
  | { kind: "new_claim" }
  | { kind: "auth"; step: "approve" | "partial" | "reject"; item: Authorization }
  | { kind: "claim"; step: "approve" | "query" | "reject" | "settle"; item: Claim };

export default function ClaimsPage() {
  const [tab, setTab] = useState<"auth" | "claims">("auth");
  const [auths, setAuths] = useState<Authorization[]>([]);
  const [claims, setClaims] = useState<Claim[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [policies, setPolicies] = useState<{ id: number; number: string; patientName: string; insurer: string }[]>([]);
  const [invoices, setInvoices] = useState<{ id: number; number: string; patientName: string; amount: number }[]>([]);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dialog, setDialog] = useState<Dialog | null>(null);
  const [busy, setBusy] = useState(false);
  const [f, setF] = useState<Record<string, string>>({});
  const set = (k: string, v: string) => setF((p) => ({ ...p, [k]: v }));

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/clinical/claims");
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || "Failed to load claims");
      setAuths(data.authorizations); setClaims(data.claims); setSummary(data.summary);
      setPolicies(data.policies); setInvoices(data.claimableInvoices);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load claims");
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => { load(); }, [load]);

  const post = async (payload: Record<string, unknown>) => {
    setBusy(true); setError(null);
    try {
      const res = await fetch("/api/clinical/claims", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || "The action failed");
      setFeedback(data.message || "Done."); setDialog(null); setF({});
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "The action failed");
    } finally {
      setBusy(false);
    }
  };

  const open = (d: Dialog) => {
    setError(null);
    const base: Record<string, string> = {};
    if (d.kind === "auth" && (d.step === "approve")) base.approvedAmount = String(d.item.requestedAmount);
    if (d.kind === "claim" && d.step === "approve") base.approvedAmount = String(d.item.claimedAmount);
    if (d.kind === "claim" && d.step === "settle") base.amount = String(d.item.outstanding);
    if (d.kind === "new_auth") Object.assign(base, { authType: "outpatient", insuranceId: String(policies[0]?.id || "") });
    if (d.kind === "new_claim") Object.assign(base, { invoiceId: String(invoices[0]?.id || "") });
    setF(base); setDialog(d);
  };

  const approvedAuths = useMemo(() => auths.filter((a) => a.state === "approved" || a.state === "partial"), [auths]);

  const stat = (label: string, value: string | number, tone = "text-slate-900") => (
    <div className="bg-white border border-slate-200/90 rounded-xl p-4 shadow-2xs">
      <div className="text-[11px] font-mono uppercase tracking-wider text-slate-500">{label}</div>
      <div className={`text-2xl font-semibold mt-1 ${tone}`}>{value}</div>
    </div>
  );

  const link = "text-[#0F766E] font-semibold hover:underline disabled:opacity-40";

  return (
    <div className="max-w-6xl mx-auto space-y-7 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-slate-200/90 gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="kicker text-[#0F766E]">COVERAGE MANAGEMENT</span>
            <span className="text-slate-300">/</span>
            <span className="kicker text-slate-500">PRE-AUTHORIZATION & CLAIMS</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-semibold text-slate-900 tracking-tight">Insurer Pre-authorization & Claims</h1>
          <p className="text-xs text-slate-600 mt-1">
            Ask the insurer to approve a service before it is given, then claim the invoice and track the money until it is received.
            Outpatient approvals are due in 6 hours, inpatient and procedures in 24 hours; claims are settled within 45 days.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => open({ kind: "new_auth" })} leftIcon={<ClipboardCheck className="w-4 h-4" />} disabled={policies.length === 0}>New pre-authorization</Button>
          <Button variant="primary" size="sm" onClick={() => open({ kind: "new_claim" })} leftIcon={<Plus className="w-4 h-4" />} disabled={invoices.length === 0}>New claim</Button>
        </div>
      </div>

      {feedback && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center justify-between font-medium">
          <div className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" /><span>{feedback}</span></div>
          <button onClick={() => setFeedback(null)} className="text-emerald-700 font-bold px-2">✕</button>
        </div>
      )}
      {error && !dialog && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-xs text-red-800 flex items-center gap-2 font-medium">
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0" /><span>{error}</span>
        </div>
      )}

      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {stat("Waiting for insurer", summary.authPending)}
          {stat("Answer overdue", summary.authOverdue, summary.authOverdue ? "text-red-600" : "text-slate-900")}
          {stat("Claims in progress", summary.claimsOpen)}
          {stat("Claims past 45 days", summary.claimsOverdue, summary.claimsOverdue ? "text-red-600" : "text-slate-900")}
          {stat("Owed by insurers", fmt(summary.receivable))}
          {stat("Received from insurers", fmt(summary.received), "text-emerald-700")}
          {stat("Pre-auths approved", summary.authApproved)}
          {stat("Rejected (auth / claim)", `${summary.authRejected} / ${summary.claimsRejected}`)}
        </div>
      )}

      <div className="flex gap-1 border-b border-slate-200">
        {([["auth", `Pre-authorizations (${auths.length})`], ["claims", `Claims (${claims.length})`]] as const).map(([k, label]) => (
          <button key={k} onClick={() => setTab(k)}
            className={`px-4 py-2 text-xs font-semibold border-b-2 -mb-px ${tab === k ? "border-[#0F766E] text-[#0F766E]" : "border-transparent text-slate-500 hover:text-slate-800"}`}>
            {label}
          </button>
        ))}
      </div>

      <div className="bg-white border border-slate-200/90 rounded-xl shadow-2xs overflow-hidden overflow-x-auto">
        {loading ? (
          <div className="p-12 text-center text-xs text-slate-500 font-mono">Loading...</div>
        ) : tab === "auth" ? (
          auths.length === 0 ? (
            <div className="p-12 text-center space-y-3">
              <ClipboardCheck className="w-10 h-10 text-slate-300 mx-auto" />
              <div className="text-sm font-bold text-slate-800">No pre-authorizations yet</div>
              <p className="text-xs text-slate-500">Start one for an insured patient before a scan, admission or procedure.</p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200/80 font-mono text-[11px] text-slate-500 uppercase tracking-wider">
                  <th className="py-3 px-4">Ref</th><th className="py-3 px-4">Patient</th><th className="py-3 px-4">Service</th>
                  <th className="py-3 px-4">Insurer</th><th className="py-3 px-4 text-right">Asked / approved</th>
                  <th className="py-3 px-4">Answer due</th><th className="py-3 px-4">Status</th><th className="py-3 px-4">Next</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {auths.map((a) => (
                  <tr key={a.id} className="hover:bg-slate-50/80">
                    <td className="py-3 px-4 font-mono font-bold text-[#0F766E]">{a.reference}</td>
                    <td className="py-3 px-4"><div className="font-semibold text-slate-900">{a.patientName}</div><div className="text-slate-500 font-mono">{a.puid}</div></td>
                    <td className="py-3 px-4"><div className="text-slate-800">{a.service}</div><div className="text-slate-500">{AUTH_TYPE[a.authType]}</div></td>
                    <td className="py-3 px-4 text-slate-700">{a.insurer}</td>
                    <td className="py-3 px-4 text-right font-mono">{fmt(a.requestedAmount)}{a.approvedAmount != null && <div className="text-emerald-700">{fmt(a.approvedAmount)}</div>}</td>
                    <td className="py-3 px-4">
                      {a.state === "submitted" ? <span className={a.overdue ? "text-red-600 font-semibold" : "text-slate-700"}>{left(a.dueAt)}</span> : <span className="text-slate-400">{a.insurerReference || "—"}</span>}
                    </td>
                    <td className="py-3 px-4">
                      <Badge variant={AUTH_STATE[a.state]?.[1] || "neutral"}>{AUTH_STATE[a.state]?.[0] || a.state}</Badge>
                      {a.note && <div className="text-slate-500 mt-1 max-w-[180px]">{a.note}</div>}
                    </td>
                    <td className="py-3 px-4 space-x-3 whitespace-nowrap">
                      {a.state === "draft" && <button className={link} disabled={busy} onClick={() => post({ action: "authorization_action", id: a.id, step: "submit" })}>Send to insurer</button>}
                      {a.state === "submitted" && (<>
                        <button className={link} onClick={() => open({ kind: "auth", step: "approve", item: a })}>Approved</button>
                        <button className={link} onClick={() => open({ kind: "auth", step: "partial", item: a })}>Partly</button>
                        <button className="text-red-600 font-semibold hover:underline" onClick={() => open({ kind: "auth", step: "reject", item: a })}>Rejected</button>
                      </>)}
                      {(a.state === "rejected" || a.state === "expired") && <button className={link} disabled={busy} onClick={() => post({ action: "authorization_action", id: a.id, step: "submit" })}>Send again</button>}
                      {(a.state === "draft" || a.state === "submitted") && <button className="text-slate-500 hover:underline" disabled={busy} onClick={() => post({ action: "authorization_action", id: a.id, step: "cancel" })}>Cancel</button>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )
        ) : claims.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <ReceiptText className="w-10 h-10 text-slate-300 mx-auto" />
            <div className="text-sm font-bold text-slate-800">No claims yet</div>
            <p className="text-xs text-slate-500">Claim a posted invoice of an insured patient from the insurer.</p>
          </div>
        ) : (
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200/80 font-mono text-[11px] text-slate-500 uppercase tracking-wider">
                <th className="py-3 px-4">Ref</th><th className="py-3 px-4">Invoice</th><th className="py-3 px-4">Patient</th>
                <th className="py-3 px-4">Insurer</th><th className="py-3 px-4 text-right">Claimed</th><th className="py-3 px-4 text-right">Received / owed</th>
                <th className="py-3 px-4">Settle by</th><th className="py-3 px-4">Status</th><th className="py-3 px-4">Next</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {claims.map((c) => (
                <tr key={c.id} className="hover:bg-slate-50/80">
                  <td className="py-3 px-4 font-mono font-bold text-[#0F766E]">{c.reference}</td>
                  <td className="py-3 px-4 font-mono">{c.invoiceNumber}</td>
                  <td className="py-3 px-4 font-semibold text-slate-900">{c.patientName}</td>
                  <td className="py-3 px-4 text-slate-700">{c.insurer}</td>
                  <td className="py-3 px-4 text-right font-mono">{fmt(c.claimedAmount)}{c.approvedAmount != null && c.approvedAmount !== c.claimedAmount && <div className="text-blue-700">ok {fmt(c.approvedAmount)}</div>}</td>
                  <td className="py-3 px-4 text-right font-mono"><span className="text-emerald-700">{fmt(c.settledAmount)}</span>{c.outstanding > 0 && !["draft", "rejected"].includes(c.state) && <div className="text-amber-700">{fmt(c.outstanding)}</div>}</td>
                  <td className="py-3 px-4">{c.dueOn ? <span className={c.overdue ? "text-red-600 font-semibold" : "text-slate-700"}>{c.dueOn}{c.overdue ? " (late)" : ""}</span> : "—"}</td>
                  <td className="py-3 px-4">
                    <Badge variant={CLAIM_STATE[c.state]?.[1] || "neutral"}>{CLAIM_STATE[c.state]?.[0] || c.state}</Badge>
                    {c.note && <div className="text-slate-500 mt-1 max-w-[180px]">{c.note}</div>}
                  </td>
                  <td className="py-3 px-4 space-x-3 whitespace-nowrap">
                    {c.state === "draft" && <button className={link} disabled={busy} onClick={() => post({ action: "claim_action", id: c.id, step: "submit" })}>Submit</button>}
                    {(c.state === "submitted") && (<>
                      <button className={link} onClick={() => open({ kind: "claim", step: "approve", item: c })}>Approved</button>
                      <button className={link} onClick={() => open({ kind: "claim", step: "query", item: c })}>Query</button>
                      <button className="text-red-600 font-semibold hover:underline" onClick={() => open({ kind: "claim", step: "reject", item: c })}>Rejected</button>
                    </>)}
                    {c.state === "queried" && <button className={link} disabled={busy} onClick={() => post({ action: "claim_action", id: c.id, step: "resubmit" })}>Answered, send again</button>}
                    {c.state === "rejected" && <button className={link} disabled={busy} onClick={() => post({ action: "claim_action", id: c.id, step: "resubmit" })}>Resubmit</button>}
                    {(c.state === "approved" || c.state === "partially_paid") && <button className={link} onClick={() => open({ kind: "claim", step: "settle", item: c })}>Record payment</button>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* new pre-authorization */}
      <Modal isOpen={dialog?.kind === "new_auth"} onClose={() => setDialog(null)} title="New pre-authorization" kicker="ASK THE INSURER FIRST" size="md">
        <form className="space-y-4" onSubmit={(e) => {
          e.preventDefault();
          post({ action: "create_authorization", insuranceId: Number(f.insuranceId), authType: f.authType, service: f.service, diagnosis: f.diagnosis,
            requestedAmount: Number(f.requestedAmount), submit: true });
        }}>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700">Patient and policy *</label>
            <select className={SELECT} value={f.insuranceId || ""} onChange={(e) => set("insuranceId", e.target.value)}>
              {policies.map((p) => <option key={p.id} value={p.id}>{p.patientName} — {p.insurer} ({p.number})</option>)}
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700">Approval is for *</label>
            <select className={SELECT} value={f.authType || "outpatient"} onChange={(e) => set("authType", e.target.value)}>
              {Object.entries(AUTH_TYPE).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </div>
          <Input label="Service requested *" value={f.service || ""} onChange={(e) => set("service", e.target.value)} required />
          <Input label="Diagnosis" value={f.diagnosis || ""} onChange={(e) => set("diagnosis", e.target.value)} />
          <Input label="Amount requested *" type="number" min="0" step="0.01" value={f.requestedAmount || ""} onChange={(e) => set("requestedAmount", e.target.value)} required />
          {error && <p className="text-xs text-red-600 font-medium">{error}</p>}
          <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setDialog(null)}>Cancel</Button>
            <Button type="submit" variant="primary" isLoading={busy} className="bg-[#0F766E] font-bold">Send to insurer</Button>
          </div>
        </form>
      </Modal>

      {/* new claim */}
      <Modal isOpen={dialog?.kind === "new_claim"} onClose={() => setDialog(null)} title="New claim" kicker="CLAIM AN INVOICE FROM THE INSURER" size="md">
        <form className="space-y-4" onSubmit={(e) => {
          e.preventDefault();
          post({ action: "create_claim", invoiceId: Number(f.invoiceId), authorizationId: f.authorizationId ? Number(f.authorizationId) : undefined, submit: true });
        }}>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700">Invoice *</label>
            <select className={SELECT} value={f.invoiceId || ""} onChange={(e) => set("invoiceId", e.target.value)}>
              {invoices.map((i) => <option key={i.id} value={i.id}>{i.number} — {i.patientName} ({fmt(i.amount)})</option>)}
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700">Approved pre-authorization (optional)</label>
            <select className={SELECT} value={f.authorizationId || ""} onChange={(e) => set("authorizationId", e.target.value)}>
              <option value="">None</option>
              {approvedAuths.map((a) => <option key={a.id} value={a.id}>{a.reference} — {a.patientName} — {a.service}</option>)}
            </select>
          </div>
          {error && <p className="text-xs text-red-600 font-medium">{error}</p>}
          <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setDialog(null)}>Cancel</Button>
            <Button type="submit" variant="primary" isLoading={busy} className="bg-[#0F766E] font-bold">Submit claim</Button>
          </div>
        </form>
      </Modal>

      {/* decisions */}
      {dialog && (dialog.kind === "auth" || dialog.kind === "claim") && (
        <Modal isOpen onClose={() => setDialog(null)} size="md"
          kicker={dialog.kind === "auth" ? `PRE-AUTHORIZATION ${dialog.item.reference}` : `CLAIM ${dialog.item.reference}`}
          title={{ approve: "Insurer approved", partial: "Insurer approved part of it", reject: "Insurer rejected", query: "Insurer asked a question", settle: "Record payment received" }[dialog.step]}>
          <form className="space-y-4" onSubmit={(e) => {
            e.preventDefault();
            if (dialog.kind === "auth") {
              post({ action: "authorization_action", id: dialog.item.id, step: dialog.step, approvedAmount: f.approvedAmount, insurerReference: f.insurerReference, note: f.note });
            } else {
              post({ action: "claim_action", id: dialog.item.id, step: dialog.step, approvedAmount: f.approvedAmount, amount: f.amount, note: f.note });
            }
          }}>
            {dialog.kind === "auth" && (dialog.step === "approve" || dialog.step === "partial") && (<>
              <Input label="Approved amount *" type="number" min="0" step="0.01" value={f.approvedAmount || ""} onChange={(e) => set("approvedAmount", e.target.value)} required />
              <Input label="Insurer approval number *" value={f.insurerReference || ""} onChange={(e) => set("insurerReference", e.target.value)} required />
            </>)}
            {dialog.kind === "claim" && dialog.step === "approve" && (
              <Input label="Approved amount *" type="number" min="0" step="0.01" value={f.approvedAmount || ""} onChange={(e) => set("approvedAmount", e.target.value)} required />
            )}
            {dialog.kind === "claim" && dialog.step === "settle" && (
              <Input label={`Amount received * (owed ${fmt(dialog.item.outstanding)})`} type="number" min="0" step="0.01" value={f.amount || ""} onChange={(e) => set("amount", e.target.value)} required />
            )}
            {dialog.step !== "settle" && (
              <Input label={dialog.step === "reject" ? "Reason given by the insurer *" : dialog.step === "query" ? "What the insurer is asking *" : "Note"}
                value={f.note || ""} onChange={(e) => set("note", e.target.value)} required={dialog.step === "reject" || dialog.step === "query"} />
            )}
            {error && <p className="text-xs text-red-600 font-medium">{error}</p>}
            <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setDialog(null)}>Cancel</Button>
              <Button type="submit" variant="primary" isLoading={busy} className="bg-[#0F766E] font-bold">Save</Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
