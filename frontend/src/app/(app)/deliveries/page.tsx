"use client";

import React, { useState } from "react";
import { Baby } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { Card, clock, Empty, Field, LINK, Notices, PageHeader, PatientSelect, SELECT, StateBadge, Stats, TH, useOps, Variant } from "@/components/app/ops-ui";

interface Delivery {
  id: number; reference: string; state: string; mother: string; motherPuid: string | null; deliveredAt: string | null; type: string; outcome: string; babySex: string | null;
  weight: number | null; apgar1: number | null; apgar5: number | null; motherCondition: string | null; nicu: boolean; babyId: number | null; baby: string | null; babyPuid: string | null;
  obstetrician: string | null; note: string | null;
}
interface Data {
  deliveries: Delivery[]; doctors: { id: number; name: string }[]; patients: { id: number; puid: string | null; name: string }[];
  summary: { deliveries: number; caesarean: number; caesareanRate: number; nicu: number; newbornsToRegister: number; lowWeight: number };
}
const TYPE: Record<string, string> = { normal: "Normal vaginal", assisted: "Assisted", caesarean: "Caesarean" };
const STATE: Record<string, [string, Variant]> = { recorded: ["Delivery recorded", "amber"], newborn_registered: ["Newborn registered", "green"], closed: ["Closed", "neutral"] };

export default function DeliveriesPage() {
  const { data, loading, feedback, setFeedback, error, setError, busy, post } = useOps<Data>("/api/clinical/deliveries");
  const [dialog, setDialog] = useState<"new" | { baby: Delivery } | null>(null);
  const [f, setF] = useState<Record<string, string>>({});
  const set = (k: string, v: string) => setF((p) => ({ ...p, [k]: v }));
  const open = (d: "new" | { baby: Delivery }, init: Record<string, string> = {}) => { setError(null); setF(init); setDialog(d); };

  // The newborn is a patient of the group in their own right: register the record, then link it to the mother's delivery.
  const registerBaby = async (d: Delivery) => {
    const name = (f.babyName || `Baby of ${d.mother}`).trim();
    const res = await fetch("/api/clinical/patients", { method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, qid: `NB-${d.reference}`, dob: new Date().toISOString().slice(0, 10), gender: d.babySex === "m" ? "male" : "female" }) });
    const body = await res.json();
    if (!res.ok || !body.success) { setError(body.error || "The newborn could not be registered."); return; }
    if (await post({ action: "link_baby", id: d.id, babyId: body.patientId })) setDialog(null);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-7 animate-fade-in">
      <PageHeader kicker="MATERNITY" title="Deliveries & Newborns" subtitle="Record each delivery (type, outcome, weight, Apgar, mother's condition), register the baby as a patient linked to the mother, and flag babies who need the NICU."
        actions={<Button variant="primary" size="sm" onClick={() => open("new", { deliveryType: "normal", outcome: "live_birth" })} leftIcon={<Baby className="w-4 h-4" />}>Record delivery</Button>} />
      <Notices feedback={feedback} onClose={() => setFeedback(null)} error={dialog ? null : error} />
      {data && <Stats items={[["Deliveries", data.summary.deliveries], ["Caesarean rate", `${data.summary.caesareanRate}%`], ["Needing NICU", data.summary.nicu], ["Newborns to register", data.summary.newbornsToRegister, "red"]]} />}

      <Card>
        {loading ? <div className="p-12 text-center text-xs text-slate-500 font-mono">Loading...</div>
          : !data || data.deliveries.length === 0 ? <Empty title="No deliveries recorded" hint="Record a delivery to start." />
            : (
              <table className="w-full text-left border-collapse text-xs">
                <thead><tr className="bg-slate-50 border-b border-slate-200/80 font-mono text-[11px] text-slate-500 uppercase tracking-wider">
                  <th className={TH}>Ref</th><th className={TH}>Mother</th><th className={TH}>Delivery</th><th className={TH}>Baby</th><th className={TH}>Apgar</th><th className={TH}>Status</th><th className={TH}>Next</th>
                </tr></thead>
                <tbody className="divide-y divide-slate-100">
                  {data.deliveries.map((d) => (
                    <tr key={d.id} className="hover:bg-slate-50/80">
                      <td className="py-3 px-4 font-mono font-bold text-[#0F766E]">{d.reference}<div className="text-slate-500 font-normal">{clock(d.deliveredAt)}</div></td>
                      <td className="py-3 px-4"><div className="font-semibold text-slate-900">{d.mother}</div><div className="text-slate-500 font-mono">{d.motherPuid}</div>{d.motherCondition && <div className="text-slate-500">{d.motherCondition}</div>}</td>
                      <td className="py-3 px-4">{TYPE[d.type]}<div className={d.outcome === "stillbirth" ? "text-red-600 font-semibold" : "text-slate-500"}>{d.outcome === "stillbirth" ? "Stillbirth" : "Live birth"}</div>{d.obstetrician && <div className="text-slate-500">{d.obstetrician}</div>}</td>
                      <td className="py-3 px-4">{d.babySex ? (d.babySex === "f" ? "Girl" : "Boy") : "—"}{d.weight != null && <span className={d.weight < 2500 ? "text-amber-700 font-semibold" : ""}> · {d.weight} g</span>}{d.nicu && <div><Badge variant="red">NICU</Badge></div>}{d.baby && <div className="text-slate-500 font-mono">{d.babyPuid}</div>}</td>
                      <td className="py-3 px-4 font-mono">{d.apgar1 ?? "—"} / {d.apgar5 ?? "—"}</td>
                      <td className="py-3 px-4"><StateBadge state={d.state} map={STATE} /></td>
                      <td className="py-3 px-4 space-x-3 whitespace-nowrap">
                        {d.state === "recorded" && d.outcome === "live_birth" && <button className={LINK} onClick={() => open({ baby: d })}>Register newborn</button>}
                        {d.state !== "closed" && (d.state === "newborn_registered" || d.outcome === "stillbirth") && <button className={LINK} disabled={busy} onClick={() => post({ action: "close", id: d.id })}>Close</button>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
      </Card>

      <Modal isOpen={dialog === "new"} onClose={() => setDialog(null)} title="Record delivery" kicker="MATERNITY" size="md">
        <form className="space-y-4" onSubmit={async (e) => {
          e.preventDefault();
          if (await post({ action: "record", motherId: Number(f.motherId), deliveryType: f.deliveryType, outcome: f.outcome, babySex: f.babySex, weight: f.weight, apgar1: f.apgar1, apgar5: f.apgar5,
            motherCondition: f.motherCondition, nicu: f.nicu === "yes", obstetricianId: f.obstetricianId ? Number(f.obstetricianId) : undefined, note: f.note })) setDialog(null);
        }}>
          <Field label="Mother *"><PatientSelect patients={data?.patients || []} value={f.motherId || ""} onChange={(v) => set("motherId", v)} /></Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Type of delivery *">
              <select className={SELECT} value={f.deliveryType || "normal"} onChange={(e) => set("deliveryType", e.target.value)}>{Object.entries(TYPE).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select>
            </Field>
            <Field label="Outcome *">
              <select className={SELECT} value={f.outcome || "live_birth"} onChange={(e) => set("outcome", e.target.value)}><option value="live_birth">Live birth</option><option value="stillbirth">Stillbirth</option></select>
            </Field>
          </div>
          <Field label="Obstetrician">
            <select className={SELECT} value={f.obstetricianId || ""} onChange={(e) => set("obstetricianId", e.target.value)}><option value="">Not recorded</option>{(data?.doctors || []).map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}</select>
          </Field>
          {f.outcome !== "stillbirth" && (<>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Baby">
                <select className={SELECT} value={f.babySex || ""} onChange={(e) => set("babySex", e.target.value)}><option value="">Not recorded</option><option value="f">Girl</option><option value="m">Boy</option></select>
              </Field>
              <Input label="Birth weight (g)" type="number" min="300" max="7000" value={f.weight || ""} onChange={(e) => set("weight", e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Input label="Apgar at 1 minute" type="number" min="0" max="10" value={f.apgar1 || ""} onChange={(e) => set("apgar1", e.target.value)} />
              <Input label="Apgar at 5 minutes" type="number" min="0" max="10" value={f.apgar5 || ""} onChange={(e) => set("apgar5", e.target.value)} />
            </div>
            <label className="flex items-center gap-2 text-xs font-semibold text-slate-700"><input type="checkbox" checked={f.nicu === "yes"} onChange={(e) => set("nicu", e.target.checked ? "yes" : "no")} /> Baby needs the NICU</label>
          </>)}
          <Input label="Mother's condition" value={f.motherCondition || ""} onChange={(e) => set("motherCondition", e.target.value)} />
          {error && <p className="text-xs text-red-600 font-medium">{error}</p>}
          <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setDialog(null)}>Cancel</Button>
            <Button type="submit" variant="primary" isLoading={busy} disabled={!f.motherId} className="bg-[#0F766E] font-bold">Save</Button>
          </div>
        </form>
      </Modal>

      {dialog && dialog !== "new" && (
        <Modal isOpen onClose={() => setDialog(null)} title="Register newborn" kicker={`DELIVERY ${dialog.baby.reference} - ${dialog.baby.mother}`} size="md">
          <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); registerBaby(dialog.baby); }}>
            <Input label="Baby's name" placeholder={`Baby of ${dialog.baby.mother}`} value={f.babyName || ""} onChange={(e) => set("babyName", e.target.value)} />
            <p className="text-xs text-slate-500">A patient record is created for the baby and linked to this delivery, so the baby has their own chart from day one.</p>
            {error && <p className="text-xs text-red-600 font-medium">{error}</p>}
            <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setDialog(null)}>Cancel</Button>
              <Button type="submit" variant="primary" isLoading={busy} className="bg-[#0F766E] font-bold">Register</Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
