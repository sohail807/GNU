"use client";

import React from "react";
import { Card, clock, Empty, LINK, Notices, PageHeader, StateBadge, Stats, TH, useOps, Variant } from "@/components/app/ops-ui";

interface Clearance { state: "pending" | "cleared" | "na"; at: string | null; mine: boolean }
interface Discharge {
  id: number; reference: string; state: string; registrationId: number; patientName: string; puid: string | null; startedAt: string | null;
  completedAt: string | null; hours: number; late: boolean; clearances: Record<string, Clearance>;
}
interface Data {
  discharges: Discharge[]; role: string; candidates: { registrationId: number; patientName: string; puid: string | null }[];
  summary: { open: number; late: number; complete: number; avgHours: number | null };
}

const DEPTS: Array<[string, string]> = [["medical", "Medical"], ["nursing", "Nursing"], ["pharmacy", "Pharmacy"], ["billing", "Billing"], ["insurance", "Insurance"]];
const STATE: Record<string, [string, Variant]> = { open: ["In progress", "amber"], complete: ["All cleared", "green"], cancelled: ["Cancelled", "neutral"] };

export default function DischargesPage() {
  const { data, loading, feedback, setFeedback, error, busy, post } = useOps<Data>("/api/clinical/discharges");
  const canOrder = !!data && ["physician", "nursing", "admin"].includes(data.role);

  return (
    <div className="max-w-6xl mx-auto space-y-7 animate-fade-in">
      <PageHeader kicker="DISCHARGE" title="Discharge Clearance" subtitle="After the doctor orders discharge, five departments sign off: medical, nursing, pharmacy, billing and insurance. The patient can leave the bed only when all are done. Target: within 6 hours." />
      <Notices feedback={feedback} onClose={() => setFeedback(null)} error={error} />
      {data && <Stats items={[["Discharges in progress", data.summary.open], ["Past 6 hours", data.summary.late, "red"], ["Completed", data.summary.complete], ["Average time", data.summary.avgHours == null ? "—" : `${data.summary.avgHours} h`]]} />}

      {data && data.candidates.length > 0 && (
        <div className="bg-white border border-slate-200/90 rounded-xl p-4 shadow-2xs">
          <div className="text-xs font-semibold text-slate-800 mb-2">Admitted patients (no discharge ordered)</div>
          <div className="flex flex-wrap gap-2">
            {data.candidates.map((c) => (
              <span key={c.registrationId} className="inline-flex items-center gap-2 text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5">
                <span className="font-semibold">{c.patientName}</span><span className="text-slate-500 font-mono">{c.puid}</span>
                {canOrder && <button className={LINK} disabled={busy} onClick={() => post({ action: "start", registrationId: c.registrationId })}>Order discharge</button>}
              </span>
            ))}
          </div>
          {!canOrder && <p className="text-[11px] text-slate-500 mt-2">Only a doctor or nurse can order a discharge.</p>}
        </div>
      )}

      <Card>
        {loading ? <div className="p-12 text-center text-xs text-slate-500 font-mono">Loading...</div>
          : !data || data.discharges.length === 0 ? <Empty title="No discharges in progress" hint="Order a discharge for an admitted patient above." />
            : (
              <table className="w-full text-left border-collapse text-xs">
                <thead><tr className="bg-slate-50 border-b border-slate-200/80 font-mono text-[11px] text-slate-500 uppercase tracking-wider">
                  <th className={TH}>Patient</th><th className={TH}>Ordered</th>
                  {DEPTS.map(([k, label]) => <th key={k} className={TH}>{label}</th>)}
                  <th className={TH}>Status</th>
                </tr></thead>
                <tbody className="divide-y divide-slate-100">
                  {data.discharges.map((d) => (
                    <tr key={d.id} className="hover:bg-slate-50/80">
                      <td className="py-3 px-4"><div className="font-semibold text-slate-900">{d.patientName}</div><div className="text-slate-500 font-mono">{d.puid} · {d.reference}</div></td>
                      <td className="py-3 px-4"><div>{clock(d.startedAt)}</div><div className={d.late ? "text-red-600 font-semibold" : "text-slate-500"}>{d.hours} h{d.late ? " (late)" : ""}</div></td>
                      {DEPTS.map(([k]) => {
                        const c = d.clearances[k];
                        return (
                          <td key={k} className="py-3 px-4 whitespace-nowrap">
                            {c.state === "pending" ? (
                              d.state === "open" && c.mine ? (
                                <span className="space-x-2">
                                  <button className={LINK} disabled={busy} onClick={() => post({ action: "clear", id: d.id, department: k, outcome: "cleared" })}>Clear</button>
                                  <button className="text-slate-500 hover:underline" disabled={busy} onClick={() => post({ action: "clear", id: d.id, department: k, outcome: "na" })}>N/A</button>
                                </span>
                              ) : <span className="text-amber-700">Waiting</span>
                            ) : (
                              <span className={c.state === "cleared" ? "text-emerald-700 font-semibold" : "text-slate-400"}>
                                {c.state === "cleared" ? "Cleared" : "N/A"}
                                {d.state === "open" && c.mine && <button className="ml-2 text-[11px] text-slate-500 hover:underline" disabled={busy} onClick={() => post({ action: "clear", id: d.id, department: k, outcome: "pending" })}>undo</button>}
                              </span>
                            )}
                          </td>
                        );
                      })}
                      <td className="py-3 px-4"><StateBadge state={d.state} map={STATE} />{d.state === "complete" && <div className="text-slate-500 mt-1">Now discharge on Inpatient Care</div>}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
      </Card>
    </div>
  );
}
