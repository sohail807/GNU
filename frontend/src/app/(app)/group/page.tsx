"use client";

import React, { useEffect, useState } from "react";
import { Building2, BedDouble, Stethoscope, CalendarCheck, Receipt, FlaskConical, ScanLine, AlertTriangle } from "lucide-react";

interface HospitalRow {
  id: string;
  name: string;
  currency?: string;
  beds?: number;
  occupiedBeds?: number;
  occupancy?: number;
  doctors?: number;
  appointments?: number;
  inpatients?: number;
  invoices?: number;
  paidInvoices?: number;
  billed?: number;
  collected?: number;
  labOrders?: number;
  imagingOrders?: number;
  error?: string;
}

const fmt = (n?: number) => (n === undefined ? "-" : n.toLocaleString("en-US"));

function Metric({ icon: Icon, label, value, sub }: { icon: React.ElementType; label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
        <Icon className="w-3.5 h-3.5 text-[#0F766E]" />
        {label}
      </div>
      <div className="mt-1.5 text-2xl font-bold text-slate-900">{value}</div>
      {sub && <div className="text-xs text-slate-500 mt-0.5">{sub}</div>}
    </div>
  );
}

export default function GroupOverviewPage() {
  const [rows, setRows] = useState<HospitalRow[]>([]);
  const [activeId, setActiveId] = useState<string | undefined>();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/group/overview", { cache: "no-store" })
      .then(async (res) => {
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.error || `Unable to load the group overview (HTTP ${res.status}).`);
        setRows(data.hospitals || []);
        setActiveId(data.activeHospitalId);
      })
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const ok = rows.filter((r) => !r.error);
  const totalBeds = ok.reduce((t, r) => t + (r.beds || 0), 0);
  const totalOcc = ok.reduce((t, r) => t + (r.occupiedBeds || 0), 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
          <Building2 className="w-5 h-5 text-[#0F766E]" /> Group overview
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Every hospital in the group side by side. Each hospital keeps its own books and currency; use the hospital menu in the header to work inside one.
        </p>
      </div>

      {loading && <p className="text-sm text-slate-500">Loading the group...</p>}
      {error && (
        <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-800 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" /> {error}
        </div>
      )}

      {ok.length > 0 && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <Metric icon={Building2} label="Hospitals" value={String(ok.length)} />
          <Metric icon={BedDouble} label="Beds in the group" value={fmt(totalBeds)} />
          <Metric icon={BedDouble} label="Occupied now" value={fmt(totalOcc)} sub={totalBeds ? `${Math.round((totalOcc / totalBeds) * 100)}% group occupancy` : undefined} />
          <Metric icon={Stethoscope} label="Doctors" value={fmt(ok.reduce((t, r) => t + (r.doctors || 0), 0))} />
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        {rows.map((r) => (
          <section key={r.id} className={`rounded-2xl border bg-slate-50 p-5 ${r.id === activeId ? "border-[#0F766E]" : "border-slate-200"}`}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-slate-900">{r.name}</h2>
              <div className="flex items-center gap-2">
                {r.currency && <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-200 text-slate-700">{r.currency}</span>}
                {r.id === activeId && <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-teal-100 text-teal-800">Working here</span>}
              </div>
            </div>
            {r.error ? (
              <p className="text-sm text-red-700">This hospital&apos;s figures are unavailable: {r.error}</p>
            ) : (
              <>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <Metric icon={BedDouble} label="Beds" value={fmt(r.beds)} sub={`${fmt(r.occupiedBeds)} occupied (${r.occupancy}%)`} />
                  <Metric icon={Stethoscope} label="Doctors" value={fmt(r.doctors)} />
                  <Metric icon={BedDouble} label="Inpatients" value={fmt(r.inpatients)} />
                  <Metric icon={CalendarCheck} label="Appointments" value={fmt(r.appointments)} />
                  <Metric icon={FlaskConical} label="Lab orders" value={fmt(r.labOrders)} />
                  <Metric icon={ScanLine} label="Imaging orders" value={fmt(r.imagingOrders)} />
                </div>
                <div className="mt-3 rounded-xl border border-slate-200 bg-white p-4">
                  <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
                    <Receipt className="w-3.5 h-3.5 text-[#0F766E]" /> Billing ({r.currency || "local currency"})
                  </div>
                  <div className="mt-1.5 flex flex-wrap gap-x-8 gap-y-1 text-sm text-slate-700">
                    <span>Billed <b className="text-slate-900">{fmt(r.billed)}</b></span>
                    <span>Collected <b className="text-slate-900">{fmt(r.collected)}</b></span>
                    <span>Invoices <b className="text-slate-900">{fmt(r.invoices)}</b> ({fmt(r.paidInvoices)} paid)</span>
                  </div>
                </div>
              </>
            )}
          </section>
        ))}
      </div>
    </div>
  );
}
