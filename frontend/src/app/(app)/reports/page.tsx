"use client";

import React from "react";
import { Notices, PageHeader, fmt, useOps } from "@/components/app/ops-ui";

interface Data {
  hospital: string | null;
  beds: { total: number; occupied: number; occupancy: number; wards: { ward: string; total: number; occupied: number }[] } | null;
  outpatient: { total: number; states: Record<string, number>; bySpecialty: { specialty: string; visits: number }[] } | null;
  revenue: { currency: string; invoices: number; billed: number; collected: number; outstanding: number; collectionRate: number; byDay: { date: string; amount: number }[] } | null;
  emergency: { visits: number; avgDoorToDoctorMin: number | null; admissionRate: number; leftUnseen: number; levels: Record<string, number> } | null;
  discharge: { total: number; open: number; avgHours: number | null; within6h: number | null } | null;
  claims: { total: number; open: number; owed: number; ageing: { bucket: string; amount: number }[]; byInsurer: { insurer: string; amount: number }[]; rejectionRate: number } | null;
  stock: { medicines: number; low: number; expiringSoon: number; expired: number } | null;
  maternity: { deliveries: number; caesareanRate: number; lowBirthWeight: number; nicu: number; stillbirths: number } | null;
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white border border-slate-200/90 rounded-xl shadow-2xs p-5 space-y-3">
      <h2 className="text-sm font-semibold text-slate-900">{title}</h2>
      {children}
    </div>
  );
}
function Bar({ label, value, max, text, tone = "bg-[#0F766E]" }: { label: string; value: number; max: number; text?: string; tone?: string }) {
  return (
    <div className="text-xs">
      <div className="flex justify-between mb-1"><span className="text-slate-700">{label}</span><span className="font-mono text-slate-600">{text ?? value}</span></div>
      <div className="h-2 bg-slate-100 rounded"><div className={`h-2 rounded ${tone}`} style={{ width: `${max ? Math.max(2, Math.min(100, (value / max) * 100)) : 0}%` }} /></div>
    </div>
  );
}
const Fact = ({ label, value }: { label: string; value: string | number }) => (
  <div><div className="text-[11px] font-mono uppercase tracking-wider text-slate-500">{label}</div><div className="text-xl font-semibold text-slate-900">{value}</div></div>
);

export default function ReportsPage() {
  const { data, loading, feedback, setFeedback, error } = useOps<Data>("/api/clinical/reports");
  const d = data;
  return (
    <div className="max-w-6xl mx-auto space-y-7 animate-fade-in">
      <PageHeader kicker="MANAGEMENT" title={`Management Report${d?.hospital ? ` - ${d.hospital}` : ""}`} subtitle="Live figures for the hospital you are working in: beds, outpatient load, revenue and collections, emergency, discharge speed, insurer claims, pharmacy stock and maternity. Switch hospital in the header to see the other one." />
      <Notices feedback={feedback} onClose={() => setFeedback(null)} error={error} />
      {loading && <div className="p-12 text-center text-xs text-slate-500 font-mono">Loading...</div>}
      {d && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {d.beds && (
            <Panel title="Beds and occupancy">
              <div className="grid grid-cols-3 gap-4"><Fact label="Beds" value={d.beds.total} /><Fact label="Occupied" value={d.beds.occupied} /><Fact label="Occupancy" value={`${d.beds.occupancy}%`} /></div>
              {d.beds.wards.map((w) => <Bar key={w.ward} label={w.ward} value={w.occupied} max={w.total} text={`${w.occupied} / ${w.total}`} />)}
            </Panel>
          )}
          {d.revenue && (
            <Panel title={`Revenue and collections (${d.revenue.currency})`}>
              <div className="grid grid-cols-4 gap-4"><Fact label="Billed" value={fmt(d.revenue.billed)} /><Fact label="Collected" value={fmt(d.revenue.collected)} /><Fact label="Outstanding" value={fmt(d.revenue.outstanding)} /><Fact label="Collected" value={`${d.revenue.collectionRate}%`} /></div>
              {d.revenue.byDay.map((x) => <Bar key={x.date} label={x.date} value={x.amount} max={Math.max(...d.revenue!.byDay.map((y) => y.amount))} text={fmt(x.amount)} />)}
            </Panel>
          )}
          {d.outpatient && (
            <Panel title="Outpatient visits by specialty">
              <div className="grid grid-cols-3 gap-4"><Fact label="Appointments" value={d.outpatient.total} />{Object.entries(d.outpatient.states).slice(0, 2).map(([k, v]) => <Fact key={k} label={k.replace("_", " ")} value={v} />)}</div>
              {d.outpatient.bySpecialty.map((s) => <Bar key={s.specialty} label={s.specialty} value={s.visits} max={d.outpatient!.bySpecialty[0].visits} />)}
            </Panel>
          )}
          {d.claims && (
            <Panel title="Insurer claims ageing">
              <div className="grid grid-cols-3 gap-4"><Fact label="Open claims" value={d.claims.open} /><Fact label="Owed by insurers" value={fmt(d.claims.owed)} /><Fact label="Rejection rate" value={`${d.claims.rejectionRate}%`} /></div>
              {d.claims.ageing.map((a) => <Bar key={a.bucket} label={a.bucket} value={a.amount} max={Math.max(1, ...d.claims!.ageing.map((y) => y.amount))} text={fmt(a.amount)} tone={a.bucket === "Over 45 days" ? "bg-red-500" : a.bucket === "31-45 days" ? "bg-amber-500" : "bg-[#0F766E]"} />)}
              <div className="text-[11px] font-mono uppercase tracking-wider text-slate-500 pt-1">By insurer</div>
              {d.claims.byInsurer.map((i) => <Bar key={i.insurer} label={i.insurer} value={i.amount} max={d.claims!.byInsurer[0].amount} text={fmt(i.amount)} />)}
            </Panel>
          )}
          {d.emergency && (
            <Panel title="Emergency department">
              <div className="grid grid-cols-4 gap-4"><Fact label="Visits" value={d.emergency.visits} /><Fact label="Door to doctor" value={d.emergency.avgDoorToDoctorMin == null ? "—" : `${d.emergency.avgDoorToDoctorMin} min`} /><Fact label="Admission rate" value={`${d.emergency.admissionRate}%`} /><Fact label="Left unseen" value={d.emergency.leftUnseen} /></div>
              {Object.entries(d.emergency.levels).sort().map(([k, v]) => <Bar key={k} label={`Triage level ${k}`} value={v} max={Math.max(...Object.values(d.emergency!.levels))} />)}
            </Panel>
          )}
          {d.discharge && (
            <Panel title="Discharge speed">
              <div className="grid grid-cols-4 gap-4"><Fact label="Discharges" value={d.discharge.total} /><Fact label="In progress" value={d.discharge.open} /><Fact label="Average" value={d.discharge.avgHours == null ? "—" : `${d.discharge.avgHours} h`} /><Fact label="Within 6 h" value={d.discharge.within6h == null ? "—" : `${d.discharge.within6h}%`} /></div>
            </Panel>
          )}
          {d.stock && (
            <Panel title="Pharmacy stock">
              <div className="grid grid-cols-4 gap-4"><Fact label="Medicines" value={d.stock.medicines} /><Fact label="At reorder level" value={d.stock.low} /><Fact label="Expiring 90 d" value={d.stock.expiringSoon} /><Fact label="Expired" value={d.stock.expired} /></div>
            </Panel>
          )}
          {d.maternity && (
            <Panel title="Maternity">
              <div className="grid grid-cols-4 gap-4"><Fact label="Deliveries" value={d.maternity.deliveries} /><Fact label="Caesarean" value={`${d.maternity.caesareanRate}%`} /><Fact label="Low birth weight" value={d.maternity.lowBirthWeight} /><Fact label="NICU" value={d.maternity.nicu} /></div>
            </Panel>
          )}
        </div>
      )}
    </div>
  );
}
