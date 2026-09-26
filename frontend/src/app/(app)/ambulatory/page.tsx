"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Activity, Stethoscope, CheckCircle2, AlertCircle, Plus } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { Modal } from "@/components/ui/Modal";

interface ProcedureCode { id: number; code: string; description: string; }
interface ProcedureRecord { id: number; patientId: number | null; patientName: string | null; procedureCode: string | null; procedureDescription: string | null; date: string | null; comments: string | null; }
interface EcgRecord {
  id: number; patientId: number | null; patientName: string | null; date: string | null;
  rate: number | null; rhythm: string | null; axis: string | null; pacemaker: string | null;
  pr: number | null; qrs: number | null; qt: number | null; stSegment: string | null;
  twaveInversion: boolean; interpretation: string | null; lead: string | null;
}

export default function AmbulatoryPage() {
  const [patients, setPatients] = useState<{ id: number; name: string; puid: string }[]>([]);
  const [procedureCatalog, setProcedureCatalog] = useState<ProcedureCode[]>([]);
  const [procedures, setProcedures] = useState<ProcedureRecord[]>([]);
  const [ecgs, setEcgs] = useState<EcgRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [tab, setTab] = useState<"procedures" | "ecg">("procedures");

  const [isProcModalOpen, setIsProcModalOpen] = useState(false);
  const [procPatientId, setProcPatientId] = useState<number | "">("");
  const [procProcedureId, setProcProcedureId] = useState<number | "">("");
  const [procComments, setProcComments] = useState("");
  const [isCodeModalOpen, setIsCodeModalOpen] = useState(false);
  const [newCode, setNewCode] = useState("");
  const [newCodeDesc, setNewCodeDesc] = useState("");

  const [isEcgModalOpen, setIsEcgModalOpen] = useState(false);
  const [ecgPatientId, setEcgPatientId] = useState<number | "">("");
  const [ecgRate, setEcgRate] = useState("");
  const [ecgRhythm, setEcgRhythm] = useState("regular");
  const [ecgAxis, setEcgAxis] = useState("normal");
  const [ecgPacemaker, setEcgPacemaker] = useState("sa");
  const [ecgSt, setEcgSt] = useState("normal");
  const [ecgPr, setEcgPr] = useState("");
  const [ecgQrs, setEcgQrs] = useState("");
  const [ecgQt, setEcgQt] = useState("");
  const [ecgTwave, setEcgTwave] = useState(false);
  const [ecgInterpretation, setEcgInterpretation] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const res = await fetch("/api/clinical/ambulatory");
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || "Failed to load ambulatory records");
      setPatients(data.patients || []);
      setProcedureCatalog(data.procedureCatalog || []);
      setProcedures(data.procedures || []);
      setEcgs(data.ecgs || []);
    } catch (e: any) {
      setErrorMessage(e.message || "Failed to load ambulatory records");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const handleAddCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    try {
      const res = await fetch("/api/clinical/ambulatory", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "addProcedureCode", code: newCode, description: newCodeDesc }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || "Failed to add procedure code");
      setFeedback(data.message);
      setIsCodeModalOpen(false);
      setNewCode(""); setNewCodeDesc("");
      loadData();
    } catch (e: any) {
      setErrorMessage(e.message || "Failed to add procedure code");
    }
  };

  const handleAddProcedure = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!procPatientId || !procProcedureId) { setErrorMessage("Select a patient and a procedure."); return; }
    setIsSubmitting(true);
    setErrorMessage(null);
    try {
      const res = await fetch("/api/clinical/ambulatory", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "addProcedure", patientId: procPatientId, procedureId: procProcedureId, comments: procComments }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || "Failed to record procedure");
      setFeedback(data.message);
      setIsProcModalOpen(false);
      setProcPatientId(""); setProcProcedureId(""); setProcComments("");
      loadData();
    } catch (e: any) {
      setErrorMessage(e.message || "Failed to record procedure");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddEcg = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ecgPatientId || !ecgRate || !ecgInterpretation.trim()) { setErrorMessage("Patient, rate and interpretation are required."); return; }
    setIsSubmitting(true);
    setErrorMessage(null);
    try {
      const res = await fetch("/api/clinical/ambulatory", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "addEcg", patientId: ecgPatientId, rate: ecgRate, rhythm: ecgRhythm, axis: ecgAxis,
          pacemaker: ecgPacemaker, stSegment: ecgSt, pr: ecgPr, qrs: ecgQrs, qt: ecgQt,
          twaveInversion: ecgTwave, interpretation: ecgInterpretation,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || "Failed to record ECG");
      setFeedback(data.message);
      setIsEcgModalOpen(false);
      setEcgPatientId(""); setEcgRate(""); setEcgPr(""); setEcgQrs(""); setEcgQt(""); setEcgTwave(false); setEcgInterpretation("");
      loadData();
    } catch (e: any) {
      setErrorMessage(e.message || "Failed to record ECG");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-7 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-slate-200/90 gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="kicker text-[#0F766E]">CLINICAL DOCUMENTATION</span>
            <span className="text-slate-300">/</span>
            <span className="kicker text-slate-500">AMBULATORY PROCEDURES & ECG</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-semibold text-slate-900 tracking-tight">Ambulatory Procedures & ECG</h1>
          <p className="text-xs text-slate-600 mt-1">In-clinic minor procedures and electrocardiogram recording.</p>
        </div>
        <div className="flex gap-2">
          {tab === "procedures" ? (
            <Button variant="primary" size="sm" onClick={() => setIsProcModalOpen(true)} leftIcon={<Plus className="w-4 h-4" />}>New Procedure</Button>
          ) : (
            <Button variant="primary" size="sm" onClick={() => setIsEcgModalOpen(true)} leftIcon={<Plus className="w-4 h-4" />}>New ECG</Button>
          )}
        </div>
      </div>

      {feedback && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center justify-between shadow-2xs font-medium">
          <div className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" /><span>{feedback}</span></div>
          <button onClick={() => setFeedback(null)} className="text-emerald-700 font-bold px-2">✕</button>
        </div>
      )}
      {errorMessage && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-xs text-red-800 flex items-center gap-2 shadow-2xs font-medium">
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0" /><span>{errorMessage}</span>
        </div>
      )}

      <div className="flex gap-2">
        <button onClick={() => setTab("procedures")} className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${tab === "procedures" ? "bg-[#0F766E] text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}>
          <Stethoscope className="w-3.5 h-3.5 inline mr-1" />Ambulatory Procedures
        </button>
        <button onClick={() => setTab("ecg")} className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${tab === "ecg" ? "bg-[#0F766E] text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}>
          <Activity className="w-3.5 h-3.5 inline mr-1" />ECG Records
        </button>
      </div>

      {tab === "procedures" ? (
        <div className="bg-white border border-slate-200/90 rounded-xl shadow-2xs overflow-hidden">
          {procedureCatalog.length === 0 && (
            <div className="p-4 bg-amber-50 border-b border-amber-200 text-xs text-amber-800 flex items-center justify-between">
              <span>No procedure codes are configured for this tenant yet.</span>
              <Button variant="outline" size="xs" onClick={() => setIsCodeModalOpen(true)}>+ Add Procedure Code</Button>
            </div>
          )}
          <div className="overflow-x-auto">
            {isLoading ? (
              <div className="p-12 text-center text-xs text-slate-500 font-mono">Loading procedures...</div>
            ) : procedures.length === 0 ? (
              <div className="p-12 text-center space-y-3">
                <Stethoscope className="w-10 h-10 text-slate-300 mx-auto" />
                <div className="text-sm font-bold text-slate-800">No Ambulatory Procedures Recorded</div>
              </div>
            ) : (
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200/80 font-mono text-[11px] text-slate-500 uppercase tracking-wider">
                    <th className="py-3 px-5">Patient</th>
                    <th className="py-3 px-5">Procedure</th>
                    <th className="py-3 px-5">Date</th>
                    <th className="py-3 px-5">Comments</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-sans">
                  {procedures.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-5 font-semibold text-slate-900">{p.patientName || "—"}</td>
                      <td className="py-3 px-5"><span className="font-mono font-bold text-[#0F766E]">{p.procedureCode}</span> {p.procedureDescription}</td>
                      <td className="py-3 px-5 font-mono text-[11px] text-slate-600">{p.date?.slice(0, 16) || "—"}</td>
                      <td className="py-3 px-5 text-slate-600">{p.comments || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      ) : (
        <div className="bg-white border border-slate-200/90 rounded-xl shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            {isLoading ? (
              <div className="p-12 text-center text-xs text-slate-500 font-mono">Loading ECG records...</div>
            ) : ecgs.length === 0 ? (
              <div className="p-12 text-center space-y-3">
                <Activity className="w-10 h-10 text-slate-300 mx-auto" />
                <div className="text-sm font-bold text-slate-800">No ECG Records</div>
              </div>
            ) : (
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200/80 font-mono text-[11px] text-slate-500 uppercase tracking-wider">
                    <th className="py-3 px-5">Patient</th>
                    <th className="py-3 px-5">Date</th>
                    <th className="py-3 px-5">Rate</th>
                    <th className="py-3 px-5">Rhythm</th>
                    <th className="py-3 px-5">Axis</th>
                    <th className="py-3 px-5">ST Segment</th>
                    <th className="py-3 px-5">Interpretation</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-sans">
                  {ecgs.map((e) => (
                    <tr key={e.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-5 font-semibold text-slate-900">{e.patientName || "—"}</td>
                      <td className="py-3 px-5 font-mono text-[11px] text-slate-600">{e.date?.slice(0, 16) || "—"}</td>
                      <td className="py-3 px-5 font-mono font-bold">{e.rate} bpm</td>
                      <td className="py-3 px-5 capitalize">{e.rhythm}</td>
                      <td className="py-3 px-5 capitalize">{e.axis?.replace("_", " ")}</td>
                      <td className="py-3 px-5 capitalize">{e.stSegment}</td>
                      <td className="py-3 px-5 text-slate-600 max-w-xs truncate">{e.interpretation}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* New Procedure Code Modal */}
      <Modal isOpen={isCodeModalOpen} onClose={() => setIsCodeModalOpen(false)} title="Add Procedure Code to Catalog" size="sm">
        <form onSubmit={handleAddCode} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700">Code *</label>
            <input value={newCode} onChange={(e) => setNewCode(e.target.value)} placeholder="e.g. 96372" required className="w-full h-10 px-3 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-[#0F766E]" />
          </div>
          <Textarea label="Description *" value={newCodeDesc} onChange={(e) => setNewCodeDesc(e.target.value)} rows={2} required />
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
            <Button variant="outline" size="sm" type="button" onClick={() => setIsCodeModalOpen(false)}>Cancel</Button>
            <Button variant="primary" size="sm" type="submit">Add Code</Button>
          </div>
        </form>
      </Modal>

      {/* New Ambulatory Procedure Modal */}
      <Modal isOpen={isProcModalOpen} onClose={() => setIsProcModalOpen(false)} title="Record Ambulatory Procedure" size="md">
        <form onSubmit={handleAddProcedure} className="space-y-4">
          <Select label="Patient *" options={[{ value: "", label: "— Select patient —" }, ...patients.map((p) => ({ value: String(p.id), label: `${p.name} (PUID: ${p.puid})` }))]} value={String(procPatientId)} onChange={(e) => setProcPatientId(e.target.value ? Number(e.target.value) : "")} required />
          {procedureCatalog.length === 0 ? (
            <div className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-3">
              No procedure codes in catalog. <button type="button" onClick={() => { setIsProcModalOpen(false); setIsCodeModalOpen(true); }} className="underline font-semibold">Add one first</button>.
            </div>
          ) : (
            <Select label="Procedure *" options={[{ value: "", label: "— Select procedure —" }, ...procedureCatalog.map((p) => ({ value: String(p.id), label: `${p.code} — ${p.description}` }))]} value={String(procProcedureId)} onChange={(e) => setProcProcedureId(e.target.value ? Number(e.target.value) : "")} required />
          )}
          <Textarea label="Comments" value={procComments} onChange={(e) => setProcComments(e.target.value)} rows={2} />
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
            <Button variant="outline" size="sm" type="button" onClick={() => setIsProcModalOpen(false)}>Cancel</Button>
            <Button variant="primary" size="sm" type="submit" isLoading={isSubmitting}>Record Procedure</Button>
          </div>
        </form>
      </Modal>

      {/* New ECG Modal */}
      <Modal isOpen={isEcgModalOpen} onClose={() => setIsEcgModalOpen(false)} title="Record ECG" size="lg">
        <form onSubmit={handleAddEcg} className="space-y-4">
          <Select label="Patient *" options={[{ value: "", label: "— Select patient —" }, ...patients.map((p) => ({ value: String(p.id), label: `${p.name} (PUID: ${p.puid})` }))]} value={String(ecgPatientId)} onChange={(e) => setEcgPatientId(e.target.value ? Number(e.target.value) : "")} required />
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">Rate (bpm) *</label>
              <input type="number" value={ecgRate} onChange={(e) => setEcgRate(e.target.value)} required className="w-full h-10 px-3 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-[#0F766E]" />
            </div>
            <Select label="Rhythm *" options={[{ value: "regular", label: "Regular" }, { value: "irregular", label: "Irregular" }]} value={ecgRhythm} onChange={(e) => setEcgRhythm(e.target.value)} />
            <Select label="Axis *" options={[{ value: "normal", label: "Normal" }, { value: "left", label: "Left deviation" }, { value: "right", label: "Right deviation" }, { value: "extreme_right", label: "Extreme right deviation" }]} value={ecgAxis} onChange={(e) => setEcgAxis(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Select label="Pacemaker *" options={[{ value: "sa", label: "Sinus Node" }, { value: "av", label: "Atrioventricular" }, { value: "pk", label: "Purkinje" }]} value={ecgPacemaker} onChange={(e) => setEcgPacemaker(e.target.value)} />
            <Select label="ST Segment *" options={[{ value: "normal", label: "Normal" }, { value: "depressed", label: "Depressed" }, { value: "elevated", label: "Elevated" }]} value={ecgSt} onChange={(e) => setEcgSt(e.target.value)} />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1"><label className="text-xs font-semibold text-slate-700">PR (ms)</label><input type="number" value={ecgPr} onChange={(e) => setEcgPr(e.target.value)} className="w-full h-9 px-2.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-[#0F766E]" /></div>
            <div className="space-y-1"><label className="text-xs font-semibold text-slate-700">QRS (ms)</label><input type="number" value={ecgQrs} onChange={(e) => setEcgQrs(e.target.value)} className="w-full h-9 px-2.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-[#0F766E]" /></div>
            <div className="space-y-1"><label className="text-xs font-semibold text-slate-700">QT (ms)</label><input type="number" value={ecgQt} onChange={(e) => setEcgQt(e.target.value)} className="w-full h-9 px-2.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-[#0F766E]" /></div>
          </div>
          <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer select-none">
            <input type="checkbox" checked={ecgTwave} onChange={(e) => setEcgTwave(e.target.checked)} className="w-4 h-4 rounded border-slate-300 text-[#0F766E]" />
            T wave inversion present
          </label>
          <Textarea label="Clinical Interpretation *" value={ecgInterpretation} onChange={(e) => setEcgInterpretation(e.target.value)} rows={3} required />
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
            <Button variant="outline" size="sm" type="button" onClick={() => setIsEcgModalOpen(false)}>Cancel</Button>
            <Button variant="primary" size="sm" type="submit" isLoading={isSubmitting}>Save ECG</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
