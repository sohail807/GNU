"use client";

import React, { useCallback, useEffect, useState } from "react";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";

interface Allergy { id: number; code: string; name: string; kind: string; severity: string; active: boolean; note: string | null; unverified?: boolean }
const SEL = "w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg font-semibold focus:outline-none focus:border-[#0F766E]";

/** Lists a patient's recorded allergies and lets a doctor or nurse add one (searching the diagnosis catalogue). */
export function AllergyPanel({ patientId, onChanged }: { patientId: number; onChanged?: () => void }) {
  const [items, setItems] = useState<Allergy[]>([]);
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [results, setResults] = useState<Array<{ code: string; name: string }>>([]);
  const [pick, setPick] = useState<{ code: string; name: string } | null>(null);
  const [kind, setKind] = useState("da");
  const [severity, setSeverity] = useState("2_mo");
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    if (!patientId) return;
    try {
      const res = await fetch(`/api/clinical/allergies?patientId=${patientId}`);
      const data = await res.json();
      setItems(data.success ? data.allergies : []);
    } catch { setItems([]); }
  }, [patientId]);
  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (q.trim().length < 2) { setResults([]); return; }
    const t = setTimeout(async () => {
      try {
        const res = await fetch(`/api/clinical/pathology?q=${encodeURIComponent(q.trim())}`);
        const data = await res.json();
        setResults(data.success ? (data.pathologies || []).slice(0, 12).map((p: any) => ({ code: p.code, name: p.name })) : []);
      } catch { setResults([]); }
    }, 250);
    return () => clearTimeout(t);
  }, [q]);

  const call = async (payload: Record<string, unknown>) => {
    setBusy(true); setError(null);
    try {
      const res = await fetch("/api/clinical/allergies", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || "The allergy could not be saved.");
      await load(); onChanged?.();
      return true;
    } catch (e) { setError(e instanceof Error ? e.message : "The allergy could not be saved."); return false; } finally { setBusy(false); }
  };

  const active = items.filter((a) => a.active);
  return (
    <div className="bg-white border border-slate-200/90 rounded-xl p-4 shadow-2xs space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-800"><AlertTriangle className="w-4 h-4 text-amber-600" /> Allergies</div>
        <Button variant="outline" size="sm" onClick={() => { setError(null); setPick(null); setQ(""); setNote(""); setOpen(true); }}>Add allergy</Button>
      </div>
      {active.length === 0 ? <p className="text-xs text-slate-500">No allergies recorded.</p> : (
        <ul className="space-y-1">
          {active.map((a) => (
            <li key={a.id} className="flex items-center justify-between text-xs">
              <span><strong className={a.severity === "Severe" ? "text-red-600" : "text-slate-900"}>{a.name}</strong> <span className="text-slate-500">{a.kind}{a.severity ? ` · ${a.severity}` : ""}{a.note ? ` · ${a.note}` : ""}</span>{a.unverified && <span className="ml-1.5 text-[10px] px-1.5 py-0.5 rounded bg-amber-50 text-amber-800 font-semibold">Reported by patient - confirm</span>}</span>
              <button className="text-slate-500 hover:underline" disabled={busy} onClick={() => call({ action: "resolve", id: a.id })}>Resolved</button>
            </li>
          ))}
        </ul>
      )}
      {open && (
        <Modal isOpen onClose={() => setOpen(false)} title="Record allergy" kicker="PATIENT SAFETY" size="md">
          <form className="space-y-4" onSubmit={async (e) => { e.preventDefault(); if (pick && (await call({ action: "add", patientId, code: pick.code, kind, severity, note }))) setOpen(false); }}>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">Search the diagnosis list *</label>
              <input className={SEL} value={q} onChange={(e) => { setQ(e.target.value); setPick(null); }} placeholder="e.g. penicillin, allergy, anaphylaxis" />
              {pick ? <p className="text-xs text-emerald-700 font-semibold">{pick.code} - {pick.name}</p> : results.length > 0 && (
                <div className="border border-slate-200 rounded-lg max-h-40 overflow-y-auto divide-y">
                  {results.map((r) => <button type="button" key={r.code} className="block w-full text-left text-xs px-3 py-1.5 hover:bg-slate-50" onClick={() => setPick(r)}>{r.code} - {r.name}</button>)}
                </div>
              )}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><label className="text-xs font-semibold text-slate-700">Kind *</label>
                <select className={SEL} value={kind} onChange={(e) => setKind(e.target.value)}><option value="da">Drug allergy</option><option value="fa">Food allergy</option><option value="ma">Other allergy</option><option value="mc">Contraindication</option></select></div>
              <div className="space-y-1.5"><label className="text-xs font-semibold text-slate-700">Severity *</label>
                <select className={SEL} value={severity} onChange={(e) => setSeverity(e.target.value)}><option value="1_mi">Mild</option><option value="2_mo">Moderate</option><option value="3_sv">Severe</option></select></div>
            </div>
            <div className="space-y-1.5"><label className="text-xs font-semibold text-slate-700">Reaction / note</label>
              <input className={SEL} value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g. rash and swelling" /></div>
            {error && <p className="text-xs text-red-600 font-medium">{error}</p>}
            <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button type="submit" variant="primary" isLoading={busy} disabled={!pick} className="bg-[#0F766E] font-bold">Save allergy</Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
