"use client";

import React, { useCallback, useEffect, useState } from "react";
import { AlertCircle, CheckCircle2 } from "lucide-react";
import { Badge } from "@/components/ui/Badge";

export type Variant = "green" | "amber" | "blue" | "red" | "neutral" | "purple" | "teal";

export const SELECT = "w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg font-semibold focus:outline-none focus:border-[#0F766E]";
export const LINK = "text-[#0F766E] font-semibold hover:underline disabled:opacity-40";
export const LINK_RED = "text-red-600 font-semibold hover:underline disabled:opacity-40";
export const TH = "py-3 px-4";
export const fmt = (n: number) => n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
export const clock = (iso: string | null) => (iso ? new Date(iso).toLocaleString([], { dateStyle: "medium", timeStyle: "short" }) : "—");
export const minutes = (m: number) => (m >= 120 ? `${Math.floor(m / 60)} h ${m % 60} min` : `${m} min`);

/** Loads GET `path`, and posts actions to it; keeps feedback and error text for the page. */
export function useOps<T extends Record<string, any>>(path: string) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await fetch(path);
      const body = await res.json();
      if (!res.ok || !body.success) throw new Error(body.error || "Failed to load");
      setData(body as T);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, [path]);
  useEffect(() => { load(); }, [load]);

  /** Returns true when the action succeeded. */
  const post = async (payload: Record<string, unknown>): Promise<boolean> => {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(path, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const body = await res.json();
      if (!res.ok || !body.success) throw new Error(body.error || "The action failed");
      setFeedback(body.message || "Done.");
      await load();
      return true;
    } catch (e) {
      setError(e instanceof Error ? e.message : "The action failed");
      return false;
    } finally {
      setBusy(false);
    }
  };
  return { data, loading, feedback, setFeedback, error, setError, busy, post, load };
}

export function PageHeader({ kicker, title, subtitle, actions }: { kicker: string; title: string; subtitle: string; actions?: React.ReactNode }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-slate-200/90 gap-4">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <span className="kicker text-[#0F766E]">{kicker}</span>
        </div>
        <h1 className="text-xl sm:text-2xl font-semibold text-slate-900 tracking-tight">{title}</h1>
        <p className="text-xs text-slate-600 mt-1 max-w-3xl">{subtitle}</p>
      </div>
      {actions && <div className="flex gap-2 flex-wrap">{actions}</div>}
    </div>
  );
}

export function Notices({ feedback, onClose, error }: { feedback: string | null; onClose: () => void; error: string | null }) {
  return (
    <>
      {feedback && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center justify-between font-medium">
          <div className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" /><span>{feedback}</span></div>
          <button onClick={onClose} className="text-emerald-700 font-bold px-2">✕</button>
        </div>
      )}
      {error && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-xs text-red-800 flex items-center gap-2 font-medium">
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0" /><span>{error}</span>
        </div>
      )}
    </>
  );
}

export function Stats({ items }: { items: Array<[string, string | number, ("red" | "green")?]> }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {items.map(([label, value, tone]) => (
        <div key={label} className="bg-white border border-slate-200/90 rounded-xl p-4 shadow-2xs">
          <div className="text-[11px] font-mono uppercase tracking-wider text-slate-500">{label}</div>
          <div className={`text-2xl font-semibold mt-1 ${tone === "red" && Number(value) !== 0 ? "text-red-600" : tone === "green" ? "text-emerald-700" : "text-slate-900"}`}>{value}</div>
        </div>
      ))}
    </div>
  );
}

export function StateBadge({ state, map }: { state: string; map: Record<string, [string, Variant]> }) {
  const [label, variant] = map[state] || [state, "neutral" as Variant];
  return <Badge variant={variant}>{label}</Badge>;
}

export function Card({ children }: { children: React.ReactNode }) {
  return <div className="bg-white border border-slate-200/90 rounded-xl shadow-2xs overflow-hidden overflow-x-auto">{children}</div>;
}

export function Empty({ title, hint }: { title: string; hint: string }) {
  return (
    <div className="p-12 text-center space-y-2">
      <div className="text-sm font-bold text-slate-800">{title}</div>
      <p className="text-xs text-slate-500">{hint}</p>
    </div>
  );
}

export function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-semibold text-slate-700">{label}</label>
      {children}
    </div>
  );
}

/** Patient picker with a search box; the list comes from the page's GET. */
export function PatientSelect({ patients, value, onChange }: { patients: Array<{ id: number; puid: string | null; name: string }>; value: string; onChange: (v: string) => void }) {
  const [q, setQ] = useState("");
  const shown = patients.filter((p) => !q || `${p.name} ${p.puid}`.toLowerCase().includes(q.toLowerCase())).slice(0, 60);
  return (
    <div className="space-y-1.5">
      <input className={SELECT} placeholder="Search patient by name or ID..." value={q} onChange={(e) => setQ(e.target.value)} />
      <select className={SELECT} value={value} onChange={(e) => onChange(e.target.value)}>
        <option value="">Select patient</option>
        {shown.map((p) => <option key={p.id} value={p.id}>{p.name} ({p.puid})</option>)}
      </select>
    </div>
  );
}
