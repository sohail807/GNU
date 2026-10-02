"use client";

import React, { useState } from "react";
import { Siren } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { Card, clock, Empty, Field, LINK, LINK_RED, minutes, Notices, PageHeader, PatientSelect, SELECT, StateBadge, Stats, TH, useOps, Variant } from "@/components/app/ops-ui";

interface Visit {
  id: number; reference: string; state: string; patientName: string; puid: string | null; arrivalMode: string; complaint: string; level: string | null;
  triageNote: string | null; doctor: string | null; bay: string | null; arrivedAt: string | null; waitedMin: number; targetMin: number | null; breach: boolean; note: string | null;
}
interface Data {
  visits: Visit[]; doctors: { id: number; name: string }[]; patients: { id: number; puid: string | null; name: string }[];
  summary: { inDepartment: number; waitingTriage: number; waitingDoctor: number; inTreatment: number; observation: number; breaches: number; admitted: number; avgDoorToDoctor: number | null };
}

const STATE: Record<string, [string, Variant]> = {
  waiting: ["Waiting for triage", "amber"], triaged: ["Waiting for doctor", "purple"], in_treatment: ["In treatment", "blue"], observation: ["Observation", "teal"],
  admitted: ["Admitted", "green"], discharged: ["Discharged", "neutral"], transferred: ["Transferred", "neutral"], left: ["Left unseen", "red"],
};
const LEVEL: Record<string, [string, string]> = {
  "1": ["1 Resuscitation", "bg-red-600 text-white"], "2": ["2 Emergent", "bg-orange-500 text-white"], "3": ["3 Urgent", "bg-yellow-400 text-slate-900"],
  "4": ["4 Less urgent", "bg-green-500 text-white"], "5": ["5 Non-urgent", "bg-blue-500 text-white"],
};
const ARRIVAL: Record<string, string> = { walk_in: "Walk-in", ambulance: "Ambulance", referred: "Referred", police: "Police / other" };

type Dialog = { kind: "register" } | { kind: "triage" | "start" | "dispose"; visit: Visit; step?: "admit" | "discharge" | "transfer" };

export default function EmergencyPage() {
  const { data, loading, feedback, setFeedback, error, setError, busy, post } = useOps<Data>("/api/clinical/emergency");
  const [dialog, setDialog] = useState<Dialog | null>(null);
  const [f, setF] = useState<Record<string, string>>({});
  const set = (k: string, v: string) => setF((p) => ({ ...p, [k]: v }));
  const open = (d: Dialog, init: Record<string, string> = {}) => { setError(null); setF(init); setDialog(d); };
  const submit = async (payload: Record<string, unknown>) => { if (await post(payload)) setDialog(null); };
  const act = (id: number, action: string) => post({ action, id });

  // most urgent first, then longest wait
  const open_ = (data?.visits || []).filter((v) => ["waiting", "triaged", "in_treatment", "observation"].includes(v.state))
    .sort((a, b) => Number(a.level || 9) - Number(b.level || 9) || b.waitedMin - a.waitedMin);
  const closed = (data?.visits || []).filter((v) => !["waiting", "triaged", "in_treatment", "observation"].includes(v.state)).slice(0, 30);
  const s = data?.summary;

  const row = (v: Visit, live: boolean) => (
    <tr key={v.id} className="hover:bg-slate-50/80">
      <td className="py-3 px-4">{v.level ? <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${LEVEL[v.level][1]}`}>{LEVEL[v.level][0]}</span> : <span className="text-slate-400">Not triaged</span>}</td>
      <td className="py-3 px-4"><div className="font-semibold text-slate-900">{v.patientName}</div><div className="text-slate-500 font-mono">{v.puid} · {ARRIVAL[v.arrivalMode]}</div></td>
      <td className="py-3 px-4 max-w-[220px]"><div className="text-slate-800">{v.complaint}</div>{v.triageNote && <div className="text-slate-500">{v.triageNote}</div>}{v.note && <div className="text-slate-500">{v.note}</div>}</td>
      <td className="py-3 px-4 text-slate-700">{v.doctor || "—"}{v.bay && <div className="text-slate-500">{v.bay}</div>}</td>
      <td className="py-3 px-4">
        {live ? <span className={v.breach ? "text-red-600 font-semibold" : "text-slate-700"}>{minutes(v.waitedMin)}{v.targetMin != null && <span className="text-slate-400"> / {v.targetMin} min</span>}</span> : clock(v.arrivedAt)}
      </td>
      <td className="py-3 px-4"><StateBadge state={v.state} map={STATE} /></td>
      <td className="py-3 px-4 space-x-3 whitespace-nowrap">
        {v.state === "waiting" && <button className={LINK} onClick={() => open({ kind: "triage", visit: v }, { level: "3" })}>Triage</button>}
        {v.state === "triaged" && <button className={LINK} onClick={() => open({ kind: "start", visit: v }, { bay: v.bay || "", doctorId: String(data?.doctors[0]?.id || "") })}>Start treatment</button>}
        {v.state === "in_treatment" && <button className={LINK} disabled={busy} onClick={() => act(v.id, "observe")}>Observation</button>}
        {v.state === "observation" && <button className={LINK} disabled={busy} onClick={() => act(v.id, "resume")}>Back to treatment</button>}
        {(v.state === "in_treatment" || v.state === "observation") && (<>
          <button className={LINK} onClick={() => open({ kind: "dispose", visit: v, step: "admit" })}>Admit</button>
          <button className={LINK} onClick={() => open({ kind: "dispose", visit: v, step: "discharge" })}>Discharge</button>
          <button className={LINK} onClick={() => open({ kind: "dispose", visit: v, step: "transfer" })}>Transfer</button>
        </>)}
        {(v.state === "waiting" || v.state === "triaged") && <button className={LINK_RED} disabled={busy} onClick={() => act(v.id, "left")}>Left</button>}
      </td>
    </tr>
  );

  const head = (
    <thead>
      <tr className="bg-slate-50 border-b border-slate-200/80 font-mono text-[11px] text-slate-500 uppercase tracking-wider">
        <th className={TH}>Triage</th><th className={TH}>Patient</th><th className={TH}>Complaint</th><th className={TH}>Doctor / bay</th>
        <th className={TH}>Waited / target</th><th className={TH}>Status</th><th className={TH}>Next</th>
      </tr>
    </thead>
  );

  return (
    <div className="max-w-6xl mx-auto space-y-7 animate-fade-in">
      <PageHeader kicker="EMERGENCY DEPARTMENT" title="Emergency Department" subtitle="Register the arrival, triage on the 1-5 scale, see the doctor within the target time, then admit, discharge or transfer. The most urgent and longest-waiting patients are listed first."
        actions={<Button variant="primary" size="sm" onClick={() => open({ kind: "register" }, { arrivalMode: "walk_in" })} leftIcon={<Siren className="w-4 h-4" />}>Register arrival</Button>} />
      <Notices feedback={feedback} onClose={() => setFeedback(null)} error={dialog ? null : error} />
      {s && <Stats items={[["In department", s.inDepartment], ["Waiting triage", s.waitingTriage], ["Waiting doctor", s.waitingDoctor], ["Past target time", s.breaches, "red"],
        ["In treatment", s.inTreatment], ["Observation", s.observation], ["Admitted", s.admitted], ["Door to doctor (avg)", s.avgDoorToDoctor == null ? "—" : minutes(s.avgDoorToDoctor)]]} />}

      <div className="flex gap-3 text-[11px] flex-wrap">
        {Object.entries(LEVEL).map(([k, [label, cls]]) => <span key={k} className={`px-2 py-0.5 rounded font-bold ${cls}`}>{label}</span>)}
        <span className="text-slate-500">Target time to see a doctor: 0, 10, 30, 60 and 120 minutes.</span>
      </div>

      <Card>
        {loading ? <div className="p-12 text-center text-xs text-slate-500 font-mono">Loading...</div>
          : open_.length === 0 ? <Empty title="Nobody in the department" hint="Register an arrival to start." />
            : <table className="w-full text-left border-collapse text-xs">{head}<tbody className="divide-y divide-slate-100">{open_.map((v) => row(v, true))}</tbody></table>}
      </Card>

      {closed.length > 0 && (<>
        <h2 className="text-sm font-semibold text-slate-800">Recently left the department</h2>
        <Card><table className="w-full text-left border-collapse text-xs">{head}<tbody className="divide-y divide-slate-100">{closed.map((v) => row(v, false))}</tbody></table></Card>
      </>)}

      <Modal isOpen={dialog?.kind === "register"} onClose={() => setDialog(null)} title="Register arrival" kicker="EMERGENCY DEPARTMENT" size="md">
        <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); submit({ action: "register", patientId: Number(f.patientId), complaint: f.complaint, arrivalMode: f.arrivalMode }); }}>
          <Field label="Patient *"><PatientSelect patients={data?.patients || []} value={f.patientId || ""} onChange={(v) => set("patientId", v)} /></Field>
          <Input label="Presenting complaint *" value={f.complaint || ""} onChange={(e) => set("complaint", e.target.value)} required />
          <Field label="Arrived by">
            <select className={SELECT} value={f.arrivalMode || "walk_in"} onChange={(e) => set("arrivalMode", e.target.value)}>
              {Object.entries(ARRIVAL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </Field>
          {error && <p className="text-xs text-red-600 font-medium">{error}</p>}
          <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setDialog(null)}>Cancel</Button>
            <Button type="submit" variant="primary" isLoading={busy} disabled={!f.patientId} className="bg-[#0F766E] font-bold">Register</Button>
          </div>
        </form>
      </Modal>

      {dialog && dialog.kind !== "register" && (
        <Modal isOpen onClose={() => setDialog(null)} size="md" kicker={`EMERGENCY ${dialog.visit.reference} - ${dialog.visit.patientName}`}
          title={dialog.kind === "triage" ? "Triage" : dialog.kind === "start" ? "Start treatment" : { admit: "Admit to hospital", discharge: "Discharge from the department", transfer: "Transfer to another hospital" }[dialog.step!]}>
          <form className="space-y-4" onSubmit={(e) => {
            e.preventDefault();
            if (dialog.kind === "triage") submit({ action: "triage", id: dialog.visit.id, level: f.level, note: f.note, bay: f.bay });
            else if (dialog.kind === "start") submit({ action: "start", id: dialog.visit.id, doctorId: Number(f.doctorId), bay: f.bay });
            else submit({ action: dialog.step === "admit" ? "admit" : dialog.step === "discharge" ? "discharge" : "transfer", id: dialog.visit.id, note: f.note });
          }}>
            {dialog.kind === "triage" && (<>
              <Field label="Triage level *">
                <select className={SELECT} value={f.level || "3"} onChange={(e) => set("level", e.target.value)}>
                  {Object.entries(LEVEL).map(([k, [label]]) => <option key={k} value={k}>{label}</option>)}
                </select>
              </Field>
              <Input label="Vitals / findings" value={f.note || ""} onChange={(e) => set("note", e.target.value)} />
              <Input label="Bay" value={f.bay || ""} onChange={(e) => set("bay", e.target.value)} />
            </>)}
            {dialog.kind === "start" && (<>
              <Field label="Treating doctor *">
                <select className={SELECT} value={f.doctorId || ""} onChange={(e) => set("doctorId", e.target.value)}>
                  {(data?.doctors || []).map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
              </Field>
              <Input label="Bay" value={f.bay || ""} onChange={(e) => set("bay", e.target.value)} />
            </>)}
            {dialog.kind === "dispose" && <Input label="Diagnosis / disposition note *" value={f.note || ""} onChange={(e) => set("note", e.target.value)} required />}
            {dialog.kind === "dispose" && dialog.step === "admit" && <p className="text-xs text-slate-500">After this, prepare the cost estimate under Admission Planning and allocate a bed.</p>}
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
