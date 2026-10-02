"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { Card, clock, Empty, LINK, Notices, PageHeader, Stats, TH, useOps } from "@/components/app/ops-ui";

interface Phase { done: boolean; at: string | null; note: string | null }
interface Row {
  surgeryId: number; code: string; procedure: string; state: string; patientName: string; puid: string | null; room: string | null; when: string | null;
  checklistId: number | null; phases: Record<"sign_in" | "time_out" | "sign_out", Phase>;
}
interface Data { surgeries: Row[]; prompts: Record<string, string[]>; summary: { today: number; noChecklist: number; complete: number } }

const PHASES: Array<["sign_in" | "time_out" | "sign_out", string, string]> = [
  ["sign_in", "Sign in", "before anaesthesia"], ["time_out", "Time out", "before the incision"], ["sign_out", "Sign out", "before leaving theatre"],
];
const STATE_LABEL: Record<string, string> = { confirmed: "Booked", in_progress: "In theatre", done: "Done", signed: "Signed off" };

export default function TheatreSafetyPage() {
  const { data, loading, feedback, setFeedback, error, setError, busy, post } = useOps<Data>("/api/clinical/theatre-safety");
  const [dialog, setDialog] = useState<{ row: Row; phase: "sign_in" | "time_out" | "sign_out" } | null>(null);
  const [note, setNote] = useState("");
  const [ticks, setTicks] = useState<Record<number, boolean>>({});

  const openPhase = (row: Row, phase: "sign_in" | "time_out" | "sign_out") => { setError(null); setNote(""); setTicks({}); setDialog({ row, phase }); };
  const prompts = dialog ? data?.prompts[dialog.phase] || [] : [];
  const allTicked = prompts.every((_, i) => ticks[i]);

  return (
    <div className="max-w-6xl mx-auto space-y-7 animate-fade-in">
      <PageHeader kicker="OPERATING THEATRE" title="Theatre Safety Checklist" subtitle="The WHO surgical safety checklist in three pauses: sign in before anaesthesia, time out before the incision, sign out before the patient leaves theatre. A surgery cannot be started until sign in and time out are done, nor closed until sign out is done." />
      <Notices feedback={feedback} onClose={() => setFeedback(null)} error={dialog ? null : error} />
      {data && <Stats items={[["Booked / in theatre", data.summary.today], ["Without a checklist", data.summary.noChecklist, "red"], ["Fully signed out", data.summary.complete]]} />}

      <Card>
        {loading ? <div className="p-12 text-center text-xs text-slate-500 font-mono">Loading...</div>
          : !data || data.surgeries.length === 0 ? <Empty title="No surgeries to check" hint="Book a surgery under Operating Theatre first." />
            : (
              <table className="w-full text-left border-collapse text-xs">
                <thead><tr className="bg-slate-50 border-b border-slate-200/80 font-mono text-[11px] text-slate-500 uppercase tracking-wider">
                  <th className={TH}>Surgery</th><th className={TH}>Patient</th><th className={TH}>Status</th>
                  {PHASES.map(([k, label]) => <th key={k} className={TH}>{label}</th>)}
                </tr></thead>
                <tbody className="divide-y divide-slate-100">
                  {data.surgeries.map((r) => (
                    <tr key={r.surgeryId} className="hover:bg-slate-50/80">
                      <td className="py-3 px-4"><div className="font-semibold text-slate-900">{r.procedure}</div><div className="text-slate-500">{r.room || "No room"} · {r.when || "—"}</div></td>
                      <td className="py-3 px-4"><div className="font-semibold">{r.patientName}</div><div className="text-slate-500 font-mono">{r.puid}</div></td>
                      <td className="py-3 px-4">{STATE_LABEL[r.state] || r.state}</td>
                      {PHASES.map(([k, , when], i) => {
                        const p = r.phases[k];
                        const earlierDone = PHASES.slice(0, i).every(([e]) => r.phases[e].done);
                        return (
                          <td key={k} className="py-3 px-4 whitespace-nowrap">
                            {p.done ? <span className="text-emerald-700 font-semibold">Done<div className="text-slate-500 font-normal">{clock(p.at)}</div></span>
                              : !r.checklistId ? (i === 0 ? <button className={LINK} disabled={busy} onClick={() => post({ action: "start", surgeryId: r.surgeryId })}>Open checklist</button> : <span className="text-slate-400">—</span>)
                                : earlierDone ? <button className={LINK} onClick={() => openPhase(r, k)}>Do {when}</button> : <span className="text-slate-400">Waiting</span>}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
      </Card>

      {dialog && (
        <Modal isOpen onClose={() => setDialog(null)} size="md" kicker={`${dialog.row.procedure} - ${dialog.row.patientName}`} title={PHASES.find(([k]) => k === dialog.phase)![1]}>
          <form className="space-y-4" onSubmit={async (e) => {
            e.preventDefault();
            if (await post({ action: "phase", id: dialog.row.checklistId, phase: dialog.phase, done: true, note })) setDialog(null);
          }}>
            <div className="space-y-2">
              {prompts.map((q, i) => (
                <label key={q} className="flex items-start gap-2 text-xs text-slate-800">
                  <input type="checkbox" className="mt-0.5" checked={!!ticks[i]} onChange={(e) => setTicks((t) => ({ ...t, [i]: e.target.checked }))} /> {q}
                </label>
              ))}
            </div>
            <Input label="Note (optional)" value={note} onChange={(e) => setNote(e.target.value)} />
            {error && <p className="text-xs text-red-600 font-medium">{error}</p>}
            <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setDialog(null)}>Cancel</Button>
              <Button type="submit" variant="primary" isLoading={busy} disabled={!allTicked} className="bg-[#0F766E] font-bold">Confirm all checks</Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
