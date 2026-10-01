"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Activity, Layers, Microscope, Scan } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";

type Kind = "lab" | "imaging";
interface Test { id: number; name: string }
interface OrderSetItem { kind: Kind; id: number; name: string }
interface OrderSet { id: number; name: string; shared: boolean; mine: boolean; items: OrderSetItem[] }
interface Placed { key: string; kind: Kind; name: string; ref: string; state: string; when: string | null }

const SEL = "w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg font-semibold focus:outline-none focus:border-[#0F766E]";

/**
 * Diagnostic workup for the consulting patient: pick several laboratory tests and imaging studies at once, order a saved
 * order set in one step, save the current choice as an order set, and see every order placed for this patient.
 */
export function WorkupOrders({ patientId, patientName }: { patientId: number; patientName: string }) {
  const [labs, setLabs] = useState<Test[]>([]);
  const [imaging, setImaging] = useState<Test[]>([]);
  const [sets, setSets] = useState<OrderSet[]>([]);
  const [placed, setPlaced] = useState<Placed[]>([]);
  const [open, setOpen] = useState(false);
  const [picked, setPicked] = useState<Record<string, OrderSetItem>>({});
  const [q, setQ] = useState("");
  const [setId, setSetId] = useState("");
  const [saveAs, setSaveAs] = useState("");
  const [shared, setShared] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadSets = useCallback(async () => {
    try { const d = await (await fetch("/api/clinical/order-sets")).json(); setSets(d.success ? d.sets : []); } catch { setSets([]); }
  }, []);
  const loadPlaced = useCallback(async () => {
    if (!patientId) { setPlaced([]); return; }
    try {
      const [l, r] = await Promise.all([
        fetch("/api/clinical/laboratory").then((x) => x.json()).catch(() => ({})),
        fetch(`/api/clinical/radiology?patientId=${patientId}`).then((x) => x.json()).catch(() => ({})),
      ]);
      const rows: Placed[] = [];
      for (const o of (l.labOrders || []).filter((o: any) => o.patientId === patientId)) rows.push({ key: `l${o.id}`, kind: "lab", name: o.testName || "Laboratory test", ref: o.orderRef, state: o.state, when: o.dateRequested });
      for (const o of (r.radiologyOrders || []).filter((o: any) => !o.patientId || o.patientId === patientId)) rows.push({ key: `r${o.id}`, kind: "imaging", name: o.studyName || o.testName || "Imaging study", ref: String(o.orderRef || o.id), state: o.state, when: o.dateRequested || o.date || null });
      rows.sort((a, b) => (b.when || "").localeCompare(a.when || ""));
      setPlaced(rows);
    } catch { setPlaced([]); }
  }, [patientId]);

  useEffect(() => { loadSets(); }, [loadSets]);
  useEffect(() => { loadPlaced(); }, [loadPlaced]);
  useEffect(() => {
    if (!open || labs.length) return;
    fetch("/api/clinical/laboratory?catalog=tests").then((x) => x.json()).then((d) => setLabs((d.tests || []).map((t: Test) => ({ id: t.id, name: t.name })))).catch(() => undefined);
    fetch("/api/clinical/radiology").then((x) => x.json()).then((d) => setImaging((d.testTypes || []).map((t: Test) => ({ id: t.id, name: t.name })))).catch(() => undefined);
  }, [open, labs.length]);

  const filt = (list: Test[]) => list.filter((t) => t.name.toLowerCase().includes(q.trim().toLowerCase()));
  const toggle = (kind: Kind, t: Test) => setPicked((p) => {
    const k = `${kind}:${t.id}`;
    const n = { ...p };
    if (n[k]) delete n[k]; else n[k] = { kind, id: t.id, name: t.name };
    return n;
  });
  const pickedList = useMemo(() => Object.values(picked), [picked]);

  const orderAll = async (items: OrderSetItem[]) => {
    setBusy(true); setError(null); setMessage(null);
    let ok = 0; const failed: string[] = [];
    for (const it of items) {
      try {
        const res = it.kind === "lab"
          ? await fetch("/api/clinical/laboratory", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ patientId, testId: it.id }) })
          : await fetch("/api/clinical/radiology", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "create", patientId, testId: it.id }) });
        const d = await res.json();
        if (res.ok && d.success) ok += 1; else failed.push(`${it.name}: ${d.error || "failed"}`);
      } catch { failed.push(`${it.name}: failed`); }
    }
    setBusy(false);
    setMessage(`${ok} of ${items.length} order(s) placed for ${patientName}.`);
    if (failed.length) setError(failed.join(" | "));
    await loadPlaced();
    if (!failed.length) { setPicked({}); setOpen(false); setSetId(""); }
  };

  const saveSet = async () => {
    setBusy(true); setError(null);
    try {
      const res = await fetch("/api/clinical/order-sets", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: saveAs, shared, items: pickedList }) });
      const d = await res.json();
      if (!res.ok || !d.success) throw new Error(d.error || "The order set could not be saved.");
      setMessage(d.message); setSaveAs(""); await loadSets();
    } catch (e) { setError(e instanceof Error ? e.message : "The order set could not be saved."); } finally { setBusy(false); }
  };

  const applySet = sets.find((s) => String(s.id) === setId);

  return (
    <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-2xs space-y-4">
      <h3 className="text-sm font-bold text-slate-900 uppercase tracking-tight pb-3 border-b border-slate-100 flex items-center gap-2">
        <Activity className="w-4 h-4 text-[#0F766E]" /><span>Diagnostic Workup Requisitions</span>
      </h3>
      <div className="grid grid-cols-2 gap-3">
        <button type="button" disabled={!patientId} onClick={() => { setError(null); setMessage(null); setOpen(true); }}
          className="p-3.5 bg-slate-50 border border-slate-200/80 hover:border-[#0F766E] rounded-xl text-left disabled:opacity-60">
          <div className="flex items-center gap-2"><Microscope className="w-4 h-4 text-[#0F766E]" /><Scan className="w-4 h-4 text-[#0F766E]" /><span className="text-xs font-bold text-slate-900">Order tests and studies</span></div>
          <div className="text-[10px] text-slate-500 mt-1">Pick several laboratory tests and imaging studies at once</div>
        </button>
        <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-xl space-y-1.5">
          <div className="flex items-center gap-2"><Layers className="w-4 h-4 text-[#0F766E]" /><span className="text-xs font-bold text-slate-900">Order set</span></div>
          <select className={SEL} value={setId} onChange={(e) => setSetId(e.target.value)} disabled={!patientId}>
            <option value="">{sets.length ? "Choose a saved set" : "No saved sets yet"}</option>
            {sets.map((s) => <option key={s.id} value={s.id}>{s.name} ({s.items.length}){s.shared ? " - shared" : ""}</option>)}
          </select>
          <Button variant="primary" size="sm" disabled={!applySet || busy} isLoading={busy && !open} className="bg-[#0F766E] font-bold" onClick={() => applySet && orderAll(applySet.items)}>
            Order {applySet ? `all ${applySet.items.length}` : "set"}
          </Button>
        </div>
      </div>

      {message && <p className="text-xs text-emerald-700 font-semibold">{message}</p>}
      {error && !open && <p className="text-xs text-red-600 font-medium">{error}</p>}

      <div>
        <div className="text-[11px] font-mono uppercase tracking-wider text-slate-500 mb-1">Ordered for this patient ({placed.length})</div>
        {placed.length === 0 ? <p className="text-xs text-slate-500">Nothing ordered yet.</p> : (
          <div className="max-h-56 overflow-y-auto divide-y divide-slate-100 border border-slate-200 rounded-lg">
            {placed.map((p) => (
              <div key={p.key} className="flex items-center justify-between px-3 py-2 text-xs">
                <span className="flex items-center gap-2">{p.kind === "lab" ? <Microscope className="w-3.5 h-3.5 text-[#0F766E]" /> : <Scan className="w-3.5 h-3.5 text-[#0F766E]" />}<strong className="text-slate-900">{p.name}</strong><span className="text-slate-500 font-mono">{p.ref}</span></span>
                <span className="text-slate-600">{p.state}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {open && (
        <Modal isOpen onClose={() => setOpen(false)} title="Order tests and studies" kicker={`DIAGNOSTIC WORKUP - ${patientName}`} size="lg">
          <div className="space-y-4">
            <input className={SEL} placeholder="Search tests and studies..." value={q} onChange={(e) => setQ(e.target.value)} />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {([["Laboratory", "lab", filt(labs)], ["Imaging", "imaging", filt(imaging)]] as Array<[string, Kind, Test[]]>).map(([title, kind, list]) => (
                <div key={kind}>
                  <div className="text-[11px] font-mono uppercase tracking-wider text-slate-500 mb-1">{title} ({list.length})</div>
                  <div className="max-h-56 overflow-y-auto border border-slate-200 rounded-xl p-2 bg-slate-50 space-y-1">
                    {list.length === 0 && <div className="p-2 text-center text-xs text-slate-500">Nothing found.</div>}
                    {list.map((t) => (
                      <label key={t.id} className={`flex items-center gap-2 p-2 rounded-lg border cursor-pointer text-xs font-semibold ${picked[`${kind}:${t.id}`] ? "bg-teal-50 border-[#0F766E]" : "bg-white border-slate-200"}`}>
                        <input type="checkbox" checked={!!picked[`${kind}:${t.id}`]} onChange={() => toggle(kind, t)} /> {t.name}
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <div className="border border-slate-200 rounded-xl p-3 space-y-2 bg-white">
              <div className="text-xs font-semibold text-slate-800">Selected ({pickedList.length})</div>
              {pickedList.length === 0 ? <p className="text-xs text-slate-500">Tick the tests and studies to order.</p> : (
                <div className="flex flex-wrap gap-1.5">{pickedList.map((p) => <span key={`${p.kind}${p.id}`} className="text-[11px] px-2 py-0.5 rounded bg-teal-50 text-teal-800 font-semibold">{p.name}</span>)}</div>
              )}
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <input className={`${SEL} !w-48`} placeholder="Save as order set..." value={saveAs} onChange={(e) => setSaveAs(e.target.value)} />
                <label className="text-xs text-slate-600 flex items-center gap-1"><input type="checkbox" checked={shared} onChange={(e) => setShared(e.target.checked)} /> Share with all doctors</label>
                <Button type="button" variant="outline" size="sm" disabled={!saveAs.trim() || pickedList.length === 0 || busy} onClick={saveSet}>Save set</Button>
              </div>
            </div>
            {message && <p className="text-xs text-emerald-700 font-semibold">{message}</p>}
            {error && <p className="text-xs text-red-600 font-medium">{error}</p>}
            <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Close</Button>
              <Button type="button" variant="primary" className="bg-[#0F766E] font-bold" disabled={pickedList.length === 0 || busy} isLoading={busy} onClick={() => orderAll(pickedList)}>
                Order {pickedList.length || ""} selected
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
