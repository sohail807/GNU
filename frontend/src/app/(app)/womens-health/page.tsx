"use client";

import React, { useState, useEffect, useCallback } from "react";
import { HeartPulse, CheckCircle2, AlertCircle, Plus, Calendar, Microscope, Scan } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";

type ScreeningType = "menstrual" | "mammography" | "pap" | "colposcopy";

interface MenstrualRec { id: number; patientId: number | null; patientName: string | null; date: string | null; lmp: string | null; lmpLength: number | null; isRegular: boolean; dysmenorrhea: boolean; frequency: string | null; volume: string | null; }
interface ScreeningRec { id: number; patientId: number | null; patientName: string | null; date: string | null; lastMammography?: string | null; lastPap?: string | null; lastColposcopy?: string | null; result: string | null; comments: string | null; }

const TABS: { key: ScreeningType; label: string; icon: React.ReactNode }[] = [
  { key: "menstrual", label: "Menstrual History", icon: <Calendar className="w-3.5 h-3.5" /> },
  { key: "pap", label: "PAP Smear", icon: <Microscope className="w-3.5 h-3.5" /> },
  { key: "mammography", label: "Mammography", icon: <Scan className="w-3.5 h-3.5" /> },
  { key: "colposcopy", label: "Colposcopy", icon: <Microscope className="w-3.5 h-3.5" /> },
];

const PAP_RESULT_LABELS: Record<string, string> = { negative: "Negative", c1: "ASC-US", c2: "ASC-H", g1: "ASG", c3: "LSIL", c4: "HSIL", g4: "AIS" };

export default function WomensHealthPage() {
  const [femalePatients, setFemalePatients] = useState<{ id: number; name: string; puid: string }[]>([]);
  const [menstrual, setMenstrual] = useState<MenstrualRec[]>([]);
  const [mammography, setMammography] = useState<ScreeningRec[]>([]);
  const [pap, setPap] = useState<ScreeningRec[]>([]);
  const [colposcopy, setColposcopy] = useState<ScreeningRec[]>([]);
  const [tab, setTab] = useState<ScreeningType>("menstrual");
  const [isLoading, setIsLoading] = useState(true);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formPatientId, setFormPatientId] = useState<number | "">("");
  const [formLmp, setFormLmp] = useState("");
  const [formLmpLength, setFormLmpLength] = useState("28");
  const [formIsRegular, setFormIsRegular] = useState(true);
  const [formDysmenorrhea, setFormDysmenorrhea] = useState(false);
  const [formFrequency, setFormFrequency] = useState("eumenorrhea");
  const [formVolume, setFormVolume] = useState("normal");
  const [formLastDate, setFormLastDate] = useState("");
  const [formResult, setFormResult] = useState("");
  const [formComments, setFormComments] = useState("");

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const res = await fetch("/api/clinical/womens-health");
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || "Failed to load records");
      setFemalePatients(data.femalePatients || []);
      setMenstrual(data.menstrual || []);
      setMammography(data.mammography || []);
      setPap(data.pap || []);
      setColposcopy(data.colposcopy || []);
    } catch (e: any) {
      setErrorMessage(e.message || "Failed to load women's health records");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const resetForm = () => {
    setFormPatientId(""); setFormLmp(""); setFormLmpLength("28"); setFormIsRegular(true);
    setFormDysmenorrhea(false); setFormFrequency("eumenorrhea"); setFormVolume("normal");
    setFormLastDate(""); setFormResult(""); setFormComments("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formPatientId) { setErrorMessage("Select a patient."); return; }
    setIsSubmitting(true);
    setErrorMessage(null);
    try {
      const body: Record<string, unknown> = { type: tab, patientId: formPatientId };
      if (tab === "menstrual") {
        Object.assign(body, { lmp: formLmp, lmpLength: formLmpLength, isRegular: formIsRegular, dysmenorrhea: formDysmenorrhea, frequency: formFrequency, volume: formVolume });
      } else {
        Object.assign(body, { lastDate: formLastDate, result: formResult, comments: formComments });
      }
      const res = await fetch("/api/clinical/womens-health", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || "Failed to save record");
      setFeedback(data.message);
      setIsModalOpen(false);
      resetForm();
      loadData();
    } catch (e: any) {
      setErrorMessage(e.message || "Failed to save record");
    } finally {
      setIsSubmitting(false);
    }
  };

  const currentRows: (MenstrualRec | ScreeningRec)[] = tab === "menstrual" ? menstrual : tab === "mammography" ? mammography : tab === "pap" ? pap : colposcopy;

  return (
    <div className="max-w-6xl mx-auto space-y-7 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-slate-200/90 gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="kicker text-[#0F766E]">OBSTETRICS & GYNECOLOGY</span>
            <span className="text-slate-300">/</span>
            <span className="kicker text-slate-500">WOMEN'S HEALTH SCREENING</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-semibold text-slate-900 tracking-tight">Women's Health Screening History</h1>
          <p className="text-xs text-slate-600 mt-1">Menstrual, PAP smear, mammography and colposcopy screening records.</p>
        </div>
        <Button variant="primary" size="sm" onClick={() => { resetForm(); setIsModalOpen(true); }} leftIcon={<Plus className="w-4 h-4" />}>New Record</Button>
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

      <div className="flex gap-2 flex-wrap">
        {TABS.map((t) => (
          <button key={t.key} onClick={() => setTab(t.key)} className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all inline-flex items-center gap-1.5 ${tab === t.key ? "bg-[#0F766E] text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}>
            {t.icon}{t.label}
          </button>
        ))}
      </div>

      <div className="bg-white border border-slate-200/90 rounded-xl shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="p-12 text-center text-xs text-slate-500 font-mono">Loading records...</div>
          ) : currentRows.length === 0 ? (
            <div className="p-12 text-center space-y-3">
              <HeartPulse className="w-10 h-10 text-slate-300 mx-auto" />
              <div className="text-sm font-bold text-slate-800">No Records</div>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">No {TABS.find((t) => t.key === tab)?.label.toLowerCase()} records are on file yet.</p>
            </div>
          ) : tab === "menstrual" ? (
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200/80 font-mono text-[11px] text-slate-500 uppercase tracking-wider">
                  <th className="py-3 px-5">Patient</th><th className="py-3 px-5">Date</th><th className="py-3 px-5">LMP</th><th className="py-3 px-5">Cycle</th><th className="py-3 px-5">Frequency</th><th className="py-3 px-5">Volume</th><th className="py-3 px-5">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {(menstrual).map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50/80">
                    <td className="py-3 px-5 font-semibold text-slate-900">{r.patientName || "—"}</td>
                    <td className="py-3 px-5 font-mono text-[11px]">{r.date || "—"}</td>
                    <td className="py-3 px-5 font-mono text-[11px]">{r.lmp || "—"}</td>
                    <td className="py-3 px-5">{r.lmpLength ? `${r.lmpLength}d` : "—"} {r.isRegular ? <Badge variant="green" size="sm">Regular</Badge> : <Badge variant="amber" size="sm">Irregular</Badge>}</td>
                    <td className="py-3 px-5 capitalize">{r.frequency}</td>
                    <td className="py-3 px-5 capitalize">{r.volume}</td>
                    <td className="py-3 px-5">{r.dysmenorrhea ? <Badge variant="red" size="sm">Dysmenorrhea</Badge> : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200/80 font-mono text-[11px] text-slate-500 uppercase tracking-wider">
                  <th className="py-3 px-5">Patient</th><th className="py-3 px-5">Date</th><th className="py-3 px-5">Previous</th><th className="py-3 px-5">Result</th><th className="py-3 px-5">Remarks</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {(currentRows as ScreeningRec[]).map((r) => {
                  const lastDate = tab === "mammography" ? r.lastMammography : tab === "pap" ? r.lastPap : r.lastColposcopy;
                  return (
                    <tr key={r.id} className="hover:bg-slate-50/80">
                      <td className="py-3 px-5 font-semibold text-slate-900">{r.patientName || "—"}</td>
                      <td className="py-3 px-5 font-mono text-[11px]">{r.date || "—"}</td>
                      <td className="py-3 px-5 font-mono text-[11px]">{lastDate || "—"}</td>
                      <td className="py-3 px-5">
                        {r.result ? (
                          <Badge variant={r.result === "normal" || r.result === "negative" ? "green" : "red"} size="sm">
                            {tab === "pap" ? PAP_RESULT_LABELS[r.result] || r.result : r.result}
                          </Badge>
                        ) : "—"}
                      </td>
                      <td className="py-3 px-5 text-slate-600">{r.comments || "—"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={`New ${TABS.find((t) => t.key === tab)?.label} Record`} size="md">
        <form onSubmit={handleSubmit} className="space-y-4">
          <Select label="Patient *" options={[{ value: "", label: "— Select patient —" }, ...femalePatients.map((p) => ({ value: String(p.id), label: `${p.name} (PUID: ${p.puid})` }))]} value={String(formPatientId)} onChange={(e) => setFormPatientId(e.target.value ? Number(e.target.value) : "")} required />

          {tab === "menstrual" ? (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1"><label className="text-xs font-semibold text-slate-700">Last Menstrual Period *</label><input type="date" value={formLmp} onChange={(e) => setFormLmp(e.target.value)} required className="w-full h-10 px-3 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-[#0F766E]" /></div>
                <div className="space-y-1"><label className="text-xs font-semibold text-slate-700">Cycle Length (days) *</label><input type="number" value={formLmpLength} onChange={(e) => setFormLmpLength(e.target.value)} required className="w-full h-10 px-3 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-[#0F766E]" /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Select label="Frequency" options={[{ value: "amenorrhea", label: "Amenorrhea" }, { value: "oligomenorrhea", label: "Oligomenorrhea" }, { value: "eumenorrhea", label: "Eumenorrhea (normal)" }, { value: "polymenorrhea", label: "Polymenorrhea" }]} value={formFrequency} onChange={(e) => setFormFrequency(e.target.value)} />
                <Select label="Volume" options={[{ value: "hypomenorrhea", label: "Hypomenorrhea (light)" }, { value: "normal", label: "Normal" }, { value: "menorrhagia", label: "Menorrhagia (heavy)" }]} value={formVolume} onChange={(e) => setFormVolume(e.target.value)} />
              </div>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer"><input type="checkbox" checked={formIsRegular} onChange={(e) => setFormIsRegular(e.target.checked)} className="w-4 h-4 rounded border-slate-300 text-[#0F766E]" />Regular cycle</label>
                <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer"><input type="checkbox" checked={formDysmenorrhea} onChange={(e) => setFormDysmenorrhea(e.target.checked)} className="w-4 h-4 rounded border-slate-300 text-[#0F766E]" />Dysmenorrhea</label>
              </div>
            </>
          ) : (
            <>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">Previous {tab === "mammography" ? "Mammography" : tab === "pap" ? "PAP Test" : "Colposcopy"} Date</label>
                <input type="date" value={formLastDate} onChange={(e) => setFormLastDate(e.target.value)} className="w-full h-10 px-3 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-[#0F766E]" />
              </div>
              <Select
                label="Result"
                options={tab === "pap"
                  ? [{ value: "", label: "— Pending —" }, ...Object.entries(PAP_RESULT_LABELS).map(([v, l]) => ({ value: v, label: l }))]
                  : [{ value: "", label: "— Pending —" }, { value: "normal", label: "Normal" }, { value: "abnormal", label: "Abnormal" }]}
                value={formResult}
                onChange={(e) => setFormResult(e.target.value)}
              />
              <Textarea label="Remarks" value={formComments} onChange={(e) => setFormComments(e.target.value)} rows={2} />
            </>
          )}

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
            <Button variant="outline" size="sm" type="button" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button variant="primary" size="sm" type="submit" isLoading={isSubmitting}>Save Record</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
