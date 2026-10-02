"use client";

import React, { useState } from "react";
import { BedDouble } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { Card, clock, Empty, Field, fmt, LINK, LINK_RED, Notices, PageHeader, PatientSelect, SELECT, StateBadge, Stats, TH, useOps, Variant } from "@/components/app/ops-ui";

interface Plan {
  id: number; reference: string; state: string; patientId: number; patientName: string; puid: string | null; payor: string; authorizationId: number | null;
  wardType: string; expectedDays: number; dailyRate: number; procedureCharges: number; estimate: number; advanceRequired: number; advanceReceived: number;
  registrationId: number | null; admittedAt: string | null; note: string | null; fromEmergency: boolean;
}
interface Data {
  plans: Plan[]; patients: { id: number; puid: string | null; name: string }[]; authorizations: { id: number; label: string; approved: number }[];
  freeBeds: { id: number; label: string }[]; summary: { open: number; awaitingDeposit: number; ready: number; depositsHeld: number };
}

const STATE: Record<string, [string, Variant]> = {
  estimate: ["Estimate given", "amber"], deposit_paid: ["Advance received", "blue"], ready: ["Ready to admit", "teal"], admitted: ["Admitted", "green"], cancelled: ["Cancelled", "neutral"],
};
const PAYOR: Record<string, string> = { self: "Self-pay", insurance: "Insurance (cashless)", corporate: "Corporate", scheme: "Government scheme" };

type Dialog = { kind: "new" } | { kind: "deposit" | "admit" | "auth"; plan: Plan };

export default function AdmissionsPage() {
  const { data, loading, feedback, setFeedback, error, setError, busy, post } = useOps<Data>("/api/clinical/admissions");
  const [dialog, setDialog] = useState<Dialog | null>(null);
  const [f, setF] = useState<Record<string, string>>({});
  const set = (k: string, v: string) => setF((p) => ({ ...p, [k]: v }));
  const open = (d: Dialog, init: Record<string, string> = {}) => { setError(null); setF(init); setDialog(d); };
  const submit = async (payload: Record<string, unknown>) => { if (await post(payload)) setDialog(null); };
  const total = (Number(f.dailyRate) || 0) * (Number(f.expectedDays) || 0) + (Number(f.procedureCharges) || 0);

  // The bed is allocated by the native inpatient registration; the plan then records which admission it became.
  const admit = async (plan: Plan) => {
    if (!f.bedId) { setError("Choose a free bed."); return; }
    const days = plan.expectedDays;
    const expected = new Date(Date.now() + days * 864e5).toISOString().slice(0, 10);
    const res = await fetch("/api/clinical/inpatient", { method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ patientId: plan.patientId, bedId: Number(f.bedId), admissionType: "routine", expectedDischargeDate: expected, nursingPlan: `Admitted from plan ${plan.reference}` }) });
    const body = await res.json();
    if (!res.ok || !body.success) { setError(body.error || "The bed could not be allocated."); return; }
    await submit({ action: "admitted", id: plan.id, registrationId: Number(body.admission) });
  };

  return (
    <div className="max-w-6xl mx-auto space-y-7 animate-fade-in">
      <PageHeader kicker="ADMISSION PLANNING" title="Admission Planning" subtitle="Before a bed is allocated: give the family a cost estimate, collect the advance (or secure the insurer's pre-authorization for a cashless stay), then admit to a free bed."
        actions={<Button variant="primary" size="sm" onClick={() => open({ kind: "new" }, { payor: "self", expectedDays: "3", procedureCharges: "0", advanceRequired: "0" })} leftIcon={<BedDouble className="w-4 h-4" />}>New estimate</Button>} />
      <Notices feedback={feedback} onClose={() => setFeedback(null)} error={dialog ? null : error} />
      {data && <Stats items={[["Plans open", data.summary.open], ["Waiting for advance", data.summary.awaitingDeposit], ["Ready to admit", data.summary.ready], ["Advances held", fmt(data.summary.depositsHeld), "green"]]} />}

      <Card>
        {loading ? <div className="p-12 text-center text-xs text-slate-500 font-mono">Loading...</div>
          : !data || data.plans.length === 0 ? <Empty title="No admission plans yet" hint="Start one when a doctor advises admission." />
            : (
              <table className="w-full text-left border-collapse text-xs">
                <thead><tr className="bg-slate-50 border-b border-slate-200/80 font-mono text-[11px] text-slate-500 uppercase tracking-wider">
                  <th className={TH}>Ref</th><th className={TH}>Patient</th><th className={TH}>Room</th><th className={TH}>Payor</th>
                  <th className={`${TH} text-right`}>Estimate</th><th className={`${TH} text-right`}>Advance</th><th className={TH}>Status</th><th className={TH}>Next</th>
                </tr></thead>
                <tbody className="divide-y divide-slate-100">
                  {data.plans.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50/80">
                      <td className="py-3 px-4 font-mono font-bold text-[#0F766E]">{p.reference}</td>
                      <td className="py-3 px-4"><div className="font-semibold text-slate-900">{p.patientName}</div><div className="text-slate-500 font-mono">{p.puid}{p.fromEmergency && " · from ED"}</div></td>
                      <td className="py-3 px-4">{p.wardType}<div className="text-slate-500">{p.expectedDays} days</div></td>
                      <td className="py-3 px-4">{PAYOR[p.payor]}{p.payor === "insurance" && <div className={p.authorizationId ? "text-emerald-700" : "text-amber-700"}>{p.authorizationId ? "Pre-auth linked" : "Needs pre-auth"}</div>}</td>
                      <td className="py-3 px-4 text-right font-mono">{fmt(p.estimate)}</td>
                      <td className="py-3 px-4 text-right font-mono">{p.payor === "insurance" ? "—" : <><span className="text-emerald-700">{fmt(p.advanceReceived)}</span><div className="text-slate-500">of {fmt(p.advanceRequired)}</div></>}</td>
                      <td className="py-3 px-4"><StateBadge state={p.state} map={STATE} />{p.admittedAt && <div className="text-slate-500 mt-1">{clock(p.admittedAt)}</div>}</td>
                      <td className="py-3 px-4 space-x-3 whitespace-nowrap">
                        {p.state === "estimate" && p.payor !== "insurance" && <button className={LINK} onClick={() => open({ kind: "deposit", plan: p }, { amount: String(Math.max(0, p.advanceRequired - p.advanceReceived)) })}>Receive advance</button>}
                        {["estimate", "deposit_paid"].includes(p.state) && p.payor === "insurance" && !p.authorizationId && <button className={LINK} onClick={() => open({ kind: "auth", plan: p }, { authorizationId: String(data.authorizations[0]?.id || "") })}>Link pre-auth</button>}
                        {["estimate", "deposit_paid"].includes(p.state) && (p.payor === "insurance" ? !!p.authorizationId : p.advanceReceived >= p.advanceRequired) && <button className={LINK} disabled={busy} onClick={() => post({ action: "ready", id: p.id })}>Clear for admission</button>}
                        {p.state === "ready" && <button className={LINK} onClick={() => open({ kind: "admit", plan: p }, { bedId: String(data.freeBeds[0]?.id || "") })}>Admit to bed</button>}
                        {["estimate", "deposit_paid", "ready"].includes(p.state) && <button className={LINK_RED} disabled={busy} onClick={() => post({ action: "cancel", id: p.id })}>Cancel</button>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
      </Card>

      <Modal isOpen={dialog?.kind === "new"} onClose={() => setDialog(null)} title="Cost estimate" kicker="FINANCIAL COUNSELLING" size="md">
        <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); submit({ action: "create", patientId: Number(f.patientId), payor: f.payor, wardType: f.wardType, expectedDays: Number(f.expectedDays),
          dailyRate: Number(f.dailyRate), procedureCharges: Number(f.procedureCharges), advanceRequired: f.payor === "insurance" ? 0 : Number(f.advanceRequired), authorizationId: f.authorizationId ? Number(f.authorizationId) : undefined, note: f.note }); }}>
          <Field label="Patient *"><PatientSelect patients={data?.patients || []} value={f.patientId || ""} onChange={(v) => set("patientId", v)} /></Field>
          <Field label="Who is paying *">
            <select className={SELECT} value={f.payor || "self"} onChange={(e) => set("payor", e.target.value)}>{Object.entries(PAYOR).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select>
          </Field>
          {f.payor === "insurance" && (
            <Field label="Approved pre-authorization (can be linked later)">
              <select className={SELECT} value={f.authorizationId || ""} onChange={(e) => set("authorizationId", e.target.value)}>
                <option value="">Not yet</option>{(data?.authorizations || []).map((a) => <option key={a.id} value={a.id}>{a.label}</option>)}
              </select>
            </Field>
          )}
          <Input label="Room / ward type *" value={f.wardType || ""} onChange={(e) => set("wardType", e.target.value)} required />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Expected days *" type="number" min="1" value={f.expectedDays || ""} onChange={(e) => set("expectedDays", e.target.value)} required />
            <Input label="Room rate per day *" type="number" min="0" step="0.01" value={f.dailyRate || ""} onChange={(e) => set("dailyRate", e.target.value)} required />
          </div>
          <Input label="Procedure and other charges" type="number" min="0" step="0.01" value={f.procedureCharges || ""} onChange={(e) => set("procedureCharges", e.target.value)} />
          {f.payor !== "insurance" && <Input label="Advance required" type="number" min="0" step="0.01" value={f.advanceRequired || ""} onChange={(e) => set("advanceRequired", e.target.value)} />}
          <div className="text-sm font-semibold text-slate-900">Estimated total: {fmt(total)}</div>
          {error && <p className="text-xs text-red-600 font-medium">{error}</p>}
          <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setDialog(null)}>Cancel</Button>
            <Button type="submit" variant="primary" isLoading={busy} disabled={!f.patientId} className="bg-[#0F766E] font-bold">Save estimate</Button>
          </div>
        </form>
      </Modal>

      {dialog && dialog.kind !== "new" && (
        <Modal isOpen onClose={() => setDialog(null)} size="md" kicker={`PLAN ${dialog.plan.reference} - ${dialog.plan.patientName}`}
          title={dialog.kind === "deposit" ? "Receive advance" : dialog.kind === "auth" ? "Link pre-authorization" : "Admit to a bed"}>
          <form className="space-y-4" onSubmit={(e) => {
            e.preventDefault();
            if (dialog.kind === "deposit") submit({ action: "deposit", id: dialog.plan.id, amount: Number(f.amount) });
            else if (dialog.kind === "auth") submit({ action: "link_authorization", id: dialog.plan.id, authorizationId: Number(f.authorizationId) });
            else admit(dialog.plan);
          }}>
            {dialog.kind === "deposit" && <Input label={`Amount received * (required ${fmt(dialog.plan.advanceRequired)}, received ${fmt(dialog.plan.advanceReceived)})`} type="number" min="0" step="0.01" value={f.amount || ""} onChange={(e) => set("amount", e.target.value)} required />}
            {dialog.kind === "auth" && (
              <Field label="Approved pre-authorization *">
                <select className={SELECT} value={f.authorizationId || ""} onChange={(e) => set("authorizationId", e.target.value)}>{(data?.authorizations || []).map((a) => <option key={a.id} value={a.id}>{a.label}</option>)}</select>
              </Field>
            )}
            {dialog.kind === "admit" && (
              <Field label="Free bed *">
                <select className={SELECT} value={f.bedId || ""} onChange={(e) => set("bedId", e.target.value)}>{(data?.freeBeds || []).map((b) => <option key={b.id} value={b.id}>{b.label}</option>)}</select>
              </Field>
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
