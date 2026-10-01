"use client";

import React, { useState } from "react";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { Textarea } from "@/components/ui/Textarea";
import { Card, clock, Empty, Field, LINK, LINK_RED, Notices, PageHeader, PatientSelect, SELECT, StateBadge, Stats, TH, useOps, Variant } from "@/components/app/ops-ui";

interface Referral {
  id: number; reference: string; direction: "incoming" | "outgoing"; state: string; patientName: string; puid: string | null; from: string; to: string;
  specialty: string; urgency: string; reason: string; summary: string | null; requestedAt: string | null; responseNote: string | null;
}
interface Data {
  referrals: Referral[]; hospitals: { id: number; name: string }[]; patients: { id: number; puid: string | null; name: string }[];
  summary: { incomingOpen: number; outgoingOpen: number; completed: number };
}

const STATE: Record<string, [string, Variant]> = {
  requested: ["Waiting for answer", "amber"], accepted: ["Accepted", "blue"], declined: ["Declined", "red"], completed: ["Patient received", "green"], cancelled: ["Cancelled", "neutral"],
};
const URGENCY: Record<string, [string, Variant]> = { routine: ["Routine", "neutral"], urgent: ["Urgent", "amber"], emergency: ["Emergency", "red"] };

type Dialog = { kind: "new" } | { kind: "decline"; item: Referral };

export default function ReferralsPage() {
  const { data, loading, feedback, setFeedback, error, setError, busy, post } = useOps<Data>("/api/clinical/referrals");
  const [dialog, setDialog] = useState<Dialog | null>(null);
  const [f, setF] = useState<Record<string, string>>({});
  const set = (k: string, v: string) => setF((p) => ({ ...p, [k]: v }));
  const open = (d: Dialog, init: Record<string, string> = {}) => { setError(null); setF(init); setDialog(d); };
  const submit = async (payload: Record<string, unknown>) => { if (await post(payload)) setDialog(null); };

  return (
    <div className="max-w-6xl mx-auto space-y-7 animate-fade-in">
      <PageHeader kicker="GROUP NETWORK" title="Inter-hospital Referrals" subtitle="Refer a patient to another hospital in the group. The receiving hospital accepts or declines and confirms the patient arrived; the patient's full record is already shared across the group."
        actions={<Button variant="primary" size="sm" onClick={() => open({ kind: "new" }, { urgency: "routine", toInstitutionId: String(data?.hospitals[0]?.id || "") })} leftIcon={<Send className="w-4 h-4" />} disabled={!data || data.hospitals.length === 0}>New referral</Button>} />
      <Notices feedback={feedback} onClose={() => setFeedback(null)} error={dialog ? null : error} />
      {data && <Stats items={[["Incoming, open", data.summary.incomingOpen], ["Outgoing, open", data.summary.outgoingOpen], ["Patients received", data.summary.completed]]} />}

      <Card>
        {loading ? <div className="p-12 text-center text-xs text-slate-500 font-mono">Loading...</div>
          : !data || data.referrals.length === 0 ? <Empty title="No referrals yet" hint="Send one to another hospital in the group." />
            : (
              <table className="w-full text-left border-collapse text-xs">
                <thead><tr className="bg-slate-50 border-b border-slate-200/80 font-mono text-[11px] text-slate-500 uppercase tracking-wider">
                  <th className={TH}>Ref</th><th className={TH}>Direction</th><th className={TH}>Patient</th><th className={TH}>From / to</th><th className={TH}>Service and reason</th>
                  <th className={TH}>Urgency</th><th className={TH}>Status</th><th className={TH}>Next</th>
                </tr></thead>
                <tbody className="divide-y divide-slate-100">
                  {data.referrals.map((r) => (
                    <tr key={r.id} className="hover:bg-slate-50/80">
                      <td className="py-3 px-4 font-mono font-bold text-[#0F766E]">{r.reference}<div className="text-slate-500 font-normal">{clock(r.requestedAt)}</div></td>
                      <td className="py-3 px-4 font-semibold">{r.direction === "incoming" ? "Incoming" : "Outgoing"}</td>
                      <td className="py-3 px-4"><div className="font-semibold text-slate-900">{r.patientName}</div><div className="text-slate-500 font-mono">{r.puid}</div></td>
                      <td className="py-3 px-4">{r.from}<div className="text-slate-500">to {r.to}</div></td>
                      <td className="py-3 px-4 max-w-[260px]"><div className="text-slate-800">{r.specialty}</div><div className="text-slate-500">{r.reason}</div>{r.summary && <div className="text-slate-400">{r.summary}</div>}{r.responseNote && <div className="text-slate-600 mt-1">Reply: {r.responseNote}</div>}</td>
                      <td className="py-3 px-4"><StateBadge state={r.urgency} map={URGENCY} /></td>
                      <td className="py-3 px-4"><StateBadge state={r.state} map={STATE} /></td>
                      <td className="py-3 px-4 space-x-3 whitespace-nowrap">
                        {r.direction === "incoming" && r.state === "requested" && (<>
                          <button className={LINK} disabled={busy} onClick={() => post({ action: "accept", id: r.id })}>Accept</button>
                          <button className={LINK_RED} onClick={() => open({ kind: "decline", item: r })}>Decline</button>
                        </>)}
                        {r.direction === "incoming" && r.state === "accepted" && <button className={LINK} disabled={busy} onClick={() => post({ action: "complete", id: r.id })}>Patient arrived</button>}
                        {r.direction === "outgoing" && ["requested", "accepted"].includes(r.state) && <button className="text-slate-500 hover:underline" disabled={busy} onClick={() => post({ action: "cancel", id: r.id })}>Cancel</button>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
      </Card>

      <Modal isOpen={dialog?.kind === "new"} onClose={() => setDialog(null)} title="New referral" kicker="SEND A PATIENT TO ANOTHER HOSPITAL" size="md">
        <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); submit({ action: "create", patientId: Number(f.patientId), toInstitutionId: Number(f.toInstitutionId), specialty: f.specialty, urgency: f.urgency, reason: f.reason, summary: f.summary }); }}>
          <Field label="Patient *"><PatientSelect patients={data?.patients || []} value={f.patientId || ""} onChange={(v) => set("patientId", v)} /></Field>
          <Field label="Refer to *">
            <select className={SELECT} value={f.toInstitutionId || ""} onChange={(e) => set("toInstitutionId", e.target.value)}>{(data?.hospitals || []).map((h) => <option key={h.id} value={h.id}>{h.name}</option>)}</select>
          </Field>
          <Input label="Service / specialty needed *" value={f.specialty || ""} onChange={(e) => set("specialty", e.target.value)} required />
          <Field label="Urgency">
            <select className={SELECT} value={f.urgency || "routine"} onChange={(e) => set("urgency", e.target.value)}>{Object.entries(URGENCY).map(([k, [l]]) => <option key={k} value={k}>{l}</option>)}</select>
          </Field>
          <Input label="Reason *" value={f.reason || ""} onChange={(e) => set("reason", e.target.value)} required />
          <Textarea label="Clinical summary" value={f.summary || ""} onChange={(e) => set("summary", e.target.value)} rows={3} />
          {error && <p className="text-xs text-red-600 font-medium">{error}</p>}
          <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setDialog(null)}>Cancel</Button>
            <Button type="submit" variant="primary" isLoading={busy} disabled={!f.patientId} className="bg-[#0F766E] font-bold">Send referral</Button>
          </div>
        </form>
      </Modal>

      {dialog?.kind === "decline" && (
        <Modal isOpen onClose={() => setDialog(null)} title="Decline referral" kicker={`REFERRAL ${dialog.item.reference}`} size="md">
          <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); submit({ action: "decline", id: dialog.item.id, note: f.note }); }}>
            <Input label="Reason *" value={f.note || ""} onChange={(e) => set("note", e.target.value)} required />
            {error && <p className="text-xs text-red-600 font-medium">{error}</p>}
            <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setDialog(null)}>Cancel</Button>
              <Button type="submit" variant="primary" isLoading={busy} className="bg-[#0F766E] font-bold">Decline</Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
