"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { Card, clock, Empty, LINK, Notices, PageHeader, StateBadge, Stats, TH, useOps, Variant } from "@/components/app/ops-ui";

interface Alert {
  id: number; reference: string; labId: number; patientName: string; puid: string | null; analyte: string; value: string; limits: string;
  severity: "abnormal" | "critical"; state: "open" | "acknowledged"; raisedAt: string | null; acknowledgedAt: string | null; note: string | null;
}
interface Data { alerts: Alert[]; role: string; summary: { open: number; openCritical: number; acknowledged: number } }

const SEVERITY: Record<string, [string, Variant]> = { critical: ["Critical", "red"], abnormal: ["Abnormal", "amber"] };
const STATE: Record<string, [string, Variant]> = { open: ["Needs acknowledgement", "red"], acknowledged: ["Acknowledged", "green"] };

export default function LabAlertsPage() {
  const { data, loading, feedback, setFeedback, error, setError, busy, post } = useOps<Data>("/api/clinical/lab-alerts");
  const [dialog, setDialog] = useState<Alert | null>(null);
  const [note, setNote] = useState("");
  const canAcknowledge = !!data && ["physician", "nursing", "admin"].includes(data.role);
  const canScan = !!data && ["lab", "admin"].includes(data.role);

  return (
    <div className="max-w-6xl mx-auto space-y-7 animate-fade-in">
      <PageHeader kicker="LABORATORY" title="Result Alerts" subtitle="An analyte outside its verified reference range raises an alert; more than 30% beyond a limit is critical. A doctor or nurse must acknowledge each alert and record the action taken."
        actions={canScan ? <Button variant="outline" size="sm" isLoading={busy} onClick={() => post({ action: "scan" })}>Scan saved results</Button> : undefined} />
      <Notices feedback={feedback} onClose={() => setFeedback(null)} error={dialog ? null : error} />
      {data && <Stats items={[["Waiting for acknowledgement", data.summary.open, "red"], ["Critical, open", data.summary.openCritical, "red"], ["Acknowledged", data.summary.acknowledged, "green"]]} />}

      <Card>
        {loading ? <div className="p-12 text-center text-xs text-slate-500 font-mono">Loading...</div>
          : !data || data.alerts.length === 0 ? <Empty title="No result alerts" hint="Alerts appear when laboratory results fall outside the reference range." />
            : (
              <table className="w-full text-left border-collapse text-xs">
                <thead><tr className="bg-slate-50 border-b border-slate-200/80 font-mono text-[11px] text-slate-500 uppercase tracking-wider">
                  <th className={TH}>Ref</th><th className={TH}>Patient</th><th className={TH}>Analyte</th><th className={TH}>Result</th><th className={TH}>Range</th>
                  <th className={TH}>Severity</th><th className={TH}>Status</th><th className={TH}>Next</th>
                </tr></thead>
                <tbody className="divide-y divide-slate-100">
                  {data.alerts.map((a) => (
                    <tr key={a.id} className={a.state === "open" && a.severity === "critical" ? "bg-red-50/40" : "hover:bg-slate-50/80"}>
                      <td className="py-3 px-4 font-mono font-bold text-[#0F766E]">{a.reference}<div className="text-slate-500 font-normal">{clock(a.raisedAt)}</div></td>
                      <td className="py-3 px-4"><div className="font-semibold text-slate-900">{a.patientName}</div><div className="text-slate-500 font-mono">{a.puid}</div></td>
                      <td className="py-3 px-4">{a.analyte}</td>
                      <td className="py-3 px-4 font-mono font-semibold">{a.value}</td>
                      <td className="py-3 px-4 font-mono text-slate-500">{a.limits || "—"}</td>
                      <td className="py-3 px-4"><StateBadge state={a.severity} map={SEVERITY} /></td>
                      <td className="py-3 px-4"><StateBadge state={a.state} map={STATE} />{a.note && <div className="text-slate-500 mt-1 max-w-[200px]">{a.note}</div>}</td>
                      <td className="py-3 px-4">{a.state === "open" && canAcknowledge && <button className={LINK} onClick={() => { setError(null); setNote(""); setDialog(a); }}>Acknowledge</button>}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
      </Card>

      {dialog && (
        <Modal isOpen onClose={() => setDialog(null)} size="md" kicker={`${dialog.reference} - ${dialog.patientName}`} title="Acknowledge result alert">
          <form className="space-y-4" onSubmit={async (e) => { e.preventDefault(); if (await post({ action: "acknowledge", id: dialog.id, note })) setDialog(null); }}>
            <div className="text-sm text-slate-800"><strong>{dialog.analyte}</strong>: {dialog.value} <span className="text-slate-500">(range {dialog.limits || "n/a"})</span></div>
            <Input label="Action taken *" value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g. Patient called back, repeat test ordered" required />
            {error && <p className="text-xs text-red-600 font-medium">{error}</p>}
            <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setDialog(null)}>Cancel</Button>
              <Button type="submit" variant="primary" isLoading={busy} className="bg-[#0F766E] font-bold">Acknowledge</Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
