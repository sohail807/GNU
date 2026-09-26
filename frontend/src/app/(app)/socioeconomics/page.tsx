"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Landmark, CheckCircle2, AlertCircle, Users2, Home, Plus } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";

interface RiskProfile {
  id: number; patientName: string; puid: string; sesNotes: string; hoursOutside: number | null;
  [key: string]: any;
}
interface Assessment {
  id: number; date: string | null; ses: string | null; housing: string | null; income: string | null;
  education: string | null; occupationId: number | null; occupationName: string | null; homeless: boolean;
  famApgarScore: number | null; notes: string | null; state: string;
}

const APGAR_OPTS = [{ value: "0", label: "None" }, { value: "1", label: "Moderately" }, { value: "2", label: "Very much" }];
const SES_LABELS: Record<string, string> = { "0": "Lower", "1": "Lower-middle", "2": "Middle", "3": "Middle-upper", "4": "Higher" };

const Check: React.FC<{ label: string; checked: boolean; onChange: (v: boolean) => void }> = ({ label, checked, onChange }) => (
  <label className="flex items-center gap-2 text-xs text-slate-700 py-1 cursor-pointer select-none">
    <input type="checkbox" checked={!!checked} onChange={(e) => onChange(e.target.checked)} className="w-4 h-4 rounded border-slate-300 text-[#0F766E] focus:ring-[#0F766E]/30" />
    {label}
  </label>
);

export default function SocioeconomicsPage() {
  const [patients, setPatients] = useState<{ id: number; name: string; puid: string }[]>([]);
  const [selectedPatientId, setSelectedPatientId] = useState<number | "">("");
  const [riskProfile, setRiskProfile] = useState<RiskProfile | null>(null);
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [isAssessModalOpen, setIsAssessModalOpen] = useState(false);
  const [occQuery, setOccQuery] = useState("");
  const [occResults, setOccResults] = useState<{ id: number; name: string }[]>([]);
  const [occSelected, setOccSelected] = useState<{ id: number; name: string } | null>(null);
  const [ases, setAses] = useState({ ses: "", housing: "", income: "", education: "", homeless: false, notes: "" });
  const [apgar, setApgar] = useState({ famApgarHelp: "1", famApgarDiscussion: "1", famApgarDecisions: "1", famApgarTimesharing: "1", famApgarAffection: "1" });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadPatients = useCallback(async () => {
    try {
      const res = await fetch("/api/clinical/socioeconomics");
      const data = await res.json();
      if (data.success) setPatients(data.patients || []);
    } catch (e) { console.error(e); }
  }, []);

  const loadProfile = useCallback(async (patientId: number) => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const res = await fetch(`/api/clinical/socioeconomics?patientId=${patientId}`);
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || "Failed to load socioeconomic profile");
      setRiskProfile(data.riskProfile);
      setAssessments(data.assessments || []);
    } catch (e: any) {
      setErrorMessage(e.message || "Failed to load socioeconomic profile");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { loadPatients(); }, [loadPatients]);
  useEffect(() => { if (typeof selectedPatientId === "number") loadProfile(selectedPatientId); }, [selectedPatientId, loadProfile]);

  useEffect(() => {
    if (!occQuery || occQuery.length < 2) { setOccResults([]); return; }
    const t = setTimeout(async () => {
      try {
        const res = await fetch(`/api/clinical/socioeconomics?occupationQuery=${encodeURIComponent(occQuery)}`);
        const data = await res.json();
        setOccResults(data.success ? data.occupations : []);
      } catch { setOccResults([]); }
    }, 300);
    return () => clearTimeout(t);
  }, [occQuery]);

  const setFlag = (key: string, v: any) => setRiskProfile((prev) => (prev ? { ...prev, [key]: v } : prev));

  const handleSaveRisk = async () => {
    if (!riskProfile || typeof selectedPatientId !== "number") return;
    setIsSaving(true);
    setErrorMessage(null);
    try {
      const res = await fetch("/api/clinical/socioeconomics", {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ patientId: selectedPatientId, ...riskProfile }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || "Failed to save");
      setFeedback(data.message);
    } catch (e: any) {
      setErrorMessage(e.message || "Failed to save social risk factors");
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddAssessment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (typeof selectedPatientId !== "number") return;
    setIsSubmitting(true);
    setErrorMessage(null);
    try {
      const res = await fetch("/api/clinical/socioeconomics", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "addAssessment", patientId: selectedPatientId, occupationId: occSelected?.id, ...ases, ...apgar }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || "Failed to record assessment");
      setFeedback(data.message);
      setIsAssessModalOpen(false);
      setOccSelected(null); setOccQuery("");
      setAses({ ses: "", housing: "", income: "", education: "", homeless: false, notes: "" });
      loadProfile(selectedPatientId);
    } catch (e: any) {
      setErrorMessage(e.message || "Failed to record assessment");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEndAssessment = async (id: number) => {
    if (typeof selectedPatientId !== "number") return;
    setErrorMessage(null);
    try {
      const res = await fetch("/api/clinical/socioeconomics", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "endAssessment", id }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || "Failed to finalize assessment");
      setFeedback(data.message);
      loadProfile(selectedPatientId);
    } catch (e: any) {
      setErrorMessage(e.message || "Failed to finalize assessment");
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-7 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-slate-200/90 gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="kicker text-[#0F766E]">CLINICAL DOCUMENTATION</span>
            <span className="text-slate-300">/</span>
            <span className="kicker text-slate-500">SOCIOECONOMIC ASSESSMENT</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-semibold text-slate-900 tracking-tight">Socioeconomic & Family Functionality Assessment</h1>
          <p className="text-xs text-slate-600 mt-1">Family APGAR, SES, housing, occupation and social risk factors.</p>
        </div>
        {typeof selectedPatientId === "number" && (
          <Button variant="primary" size="sm" onClick={() => setIsAssessModalOpen(true)} leftIcon={<Plus className="w-4 h-4" />}>New Assessment</Button>
        )}
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

      <div className="bg-white border border-slate-200/90 rounded-xl shadow-2xs p-5">
        <Select label="Select Patient" options={[{ value: "", label: "— Choose a patient —" }, ...patients.map((p) => ({ value: String(p.id), label: `${p.name} (PUID: ${p.puid})` }))]} value={selectedPatientId === "" ? "" : String(selectedPatientId)} onChange={(e) => setSelectedPatientId(e.target.value ? Number(e.target.value) : "")} />
      </div>

      {typeof selectedPatientId === "number" && (
        isLoading ? (
          <div className="p-12 text-center text-xs text-slate-500 font-mono">Loading socioeconomic profile...</div>
        ) : riskProfile ? (
          <>
            <div className="bg-white border border-slate-200/90 rounded-xl shadow-2xs p-5 space-y-3">
              <div className="flex items-center gap-2 text-sm font-bold text-slate-800 pb-2 border-b border-slate-100">
                <Users2 className="w-4 h-4 text-red-600" />Social Risk Factors
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-1">
                <Check label="Hostile area / war zone" checked={riskProfile.hostile_area} onChange={(v) => setFlag("hostile_area", v)} />
                <Check label="Single parent family" checked={riskProfile.single_parent} onChange={(v) => setFlag("single_parent", v)} />
                <Check label="Domestic violence" checked={riskProfile.domestic_violence} onChange={(v) => setFlag("domestic_violence", v)} />
                <Check label="Working children" checked={riskProfile.working_children} onChange={(v) => setFlag("working_children", v)} />
                <Check label="Teenage pregnancy" checked={riskProfile.teenage_pregnancy} onChange={(v) => setFlag("teenage_pregnancy", v)} />
                <Check label="Sexual abuse" checked={riskProfile.sexual_abuse} onChange={(v) => setFlag("sexual_abuse", v)} />
                <Check label="Drug addiction" checked={riskProfile.drug_addiction} onChange={(v) => setFlag("drug_addiction", v)} />
                <Check label="School withdrawal" checked={riskProfile.school_withdrawal} onChange={(v) => setFlag("school_withdrawal", v)} />
                <Check label="Has been in prison" checked={riskProfile.prison_past} onChange={(v) => setFlag("prison_past", v)} />
                <Check label="Currently in prison" checked={riskProfile.prison_current} onChange={(v) => setFlag("prison_current", v)} />
                <Check label="Relative in prison" checked={riskProfile.relative_in_prison} onChange={(v) => setFlag("relative_in_prison", v)} />
                <Check label="Works at home" checked={riskProfile.works_at_home} onChange={(v) => setFlag("works_at_home", v)} />
              </div>
              <div className="grid grid-cols-2 gap-3 pt-2">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-600">Hours outside home / day</label>
                  <input type="number" value={riskProfile.hoursOutside ?? ""} onChange={(e) => setFlag("hoursOutside", e.target.value ? Number(e.target.value) : null)} className="w-full h-9 px-2.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-[#0F766E]" />
                </div>
              </div>
              <Textarea label="Additional Notes" value={riskProfile.sesNotes} onChange={(e) => setFlag("sesNotes", e.target.value)} rows={2} />
              <div className="flex justify-end pt-2 border-t border-slate-100">
                <Button variant="primary" isLoading={isSaving} onClick={handleSaveRisk} className="bg-[#0F766E] font-bold">Save Risk Factors</Button>
              </div>
            </div>

            <div className="bg-white border border-slate-200/90 rounded-xl shadow-2xs overflow-hidden">
              <div className="p-4 border-b border-slate-100 flex items-center gap-2">
                <Home className="w-4 h-4 text-blue-600" />
                <h2 className="text-sm font-bold text-slate-900">Assessment History</h2>
              </div>
              {assessments.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-500">No socioeconomic assessments on file yet.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200/80 font-mono text-[11px] text-slate-500 uppercase tracking-wider">
                        <th className="py-3 px-5">Date</th>
                        <th className="py-3 px-5">SES</th>
                        <th className="py-3 px-5">Occupation</th>
                        <th className="py-3 px-5">Family APGAR</th>
                        <th className="py-3 px-5">Status</th>
                        <th className="py-3 px-5 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {assessments.map((a) => (
                        <tr key={a.id} className="hover:bg-slate-50/80">
                          <td className="py-3 px-5 font-mono text-[11px]">{a.date?.slice(0, 16) || "—"}</td>
                          <td className="py-3 px-5">{a.ses ? SES_LABELS[a.ses] : "—"}</td>
                          <td className="py-3 px-5">{a.occupationName || "—"}</td>
                          <td className="py-3 px-5">
                            {a.famApgarScore != null ? (
                              <Badge variant={a.famApgarScore >= 7 ? "green" : a.famApgarScore >= 4 ? "amber" : "red"} size="sm">
                                {a.famApgarScore}/10 — {a.famApgarScore >= 7 ? "Functional" : a.famApgarScore >= 4 ? "Some dysfunction" : "Severe dysfunction"}
                              </Badge>
                            ) : "—"}
                          </td>
                          <td className="py-3 px-5"><Badge variant={a.state === "done" ? "green" : "neutral"} size="sm">{a.state === "done" ? "Signed" : "In Progress"}</Badge></td>
                          <td className="py-3 px-5 text-right">
                            {a.state !== "done" && <Button variant="outline" size="xs" onClick={() => handleEndAssessment(a.id)}>Finalize & Sign</Button>}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        ) : null
      )}

      <Modal isOpen={isAssessModalOpen} onClose={() => setIsAssessModalOpen(false)} title="New Socioeconomic Assessment" size="lg">
        <form onSubmit={handleAddAssessment} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Select label="Socioeconomic Status" options={[{ value: "", label: "—" }, ...Object.entries(SES_LABELS).map(([v, l]) => ({ value: v, label: l }))]} value={ases.ses} onChange={(e) => setAses({ ...ases, ses: e.target.value })} />
            <Select label="Housing Conditions" options={[{ value: "", label: "—" }, { value: "0", label: "Shanty, deficient sanitary conditions" }, { value: "1", label: "Small, crowded, good sanitary conditions" }, { value: "2", label: "Comfortable, good sanitary conditions" }, { value: "3", label: "Roomy, excellent sanitary conditions" }, { value: "4", label: "Luxury, excellent sanitary conditions" }]} value={ases.housing} onChange={(e) => setAses({ ...ases, housing: e.target.value })} />
            <Select label="Income Level" options={[{ value: "", label: "—" }, { value: "l", label: "Low" }, { value: "m", label: "Medium" }, { value: "h", label: "High" }]} value={ases.income} onChange={(e) => setAses({ ...ases, income: e.target.value })} />
            <Select label="Education Level" options={[{ value: "", label: "—" }, { value: "0", label: "None" }, { value: "1", label: "Incomplete Primary" }, { value: "2", label: "Primary School" }, { value: "3", label: "Incomplete Secondary" }, { value: "4", label: "Secondary School" }, { value: "5", label: "University" }]} value={ases.education} onChange={(e) => setAses({ ...ases, education: e.target.value })} />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700">Occupation</label>
            {occSelected ? (
              <div className="flex items-center justify-between p-2.5 bg-teal-50 border border-teal-200 rounded-lg text-xs">
                <span>{occSelected.name}</span>
                <button type="button" onClick={() => { setOccSelected(null); setOccQuery(""); }} className="text-slate-400 hover:text-slate-600">✕</button>
              </div>
            ) : (
              <div className="relative">
                <input type="text" value={occQuery} onChange={(e) => setOccQuery(e.target.value)} placeholder="Search occupation..." className="w-full h-10 px-3 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-[#0F766E]" />
                {occResults.length > 0 && (
                  <div className="absolute z-10 mt-1 w-full max-h-40 overflow-y-auto bg-white border border-slate-200 rounded-lg shadow-lg">
                    {occResults.map((o) => (
                      <button type="button" key={o.id} onClick={() => { setOccSelected(o); setOccResults([]); }} className="w-full text-left px-3 py-2 text-xs hover:bg-teal-50 border-b border-slate-100 last:border-0">{o.name}</button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          <Check label="Currently homeless" checked={ases.homeless} onChange={(v) => setAses({ ...ases, homeless: v })} />

          <div className="pt-3 border-t border-slate-100">
            <div className="text-xs font-bold text-slate-700 mb-2">Family APGAR</div>
            <div className="grid grid-cols-1 gap-2.5">
              <Select label="Satisfied with help from family?" options={APGAR_OPTS} value={apgar.famApgarHelp} onChange={(e) => setApgar({ ...apgar, famApgarHelp: e.target.value })} />
              <Select label="Satisfied discussing problems as a family?" options={APGAR_OPTS} value={apgar.famApgarDiscussion} onChange={(e) => setApgar({ ...apgar, famApgarDiscussion: e.target.value })} />
              <Select label="Satisfied with decision-making as a group?" options={APGAR_OPTS} value={apgar.famApgarDecisions} onChange={(e) => setApgar({ ...apgar, famApgarDecisions: e.target.value })} />
              <Select label="Satisfied with time spent together?" options={APGAR_OPTS} value={apgar.famApgarTimesharing} onChange={(e) => setApgar({ ...apgar, famApgarTimesharing: e.target.value })} />
              <Select label="Satisfied with family affection?" options={APGAR_OPTS} value={apgar.famApgarAffection} onChange={(e) => setApgar({ ...apgar, famApgarAffection: e.target.value })} />
            </div>
          </div>

          <Textarea label="Notes" value={ases.notes} onChange={(e) => setAses({ ...ases, notes: e.target.value })} rows={2} />

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
            <Button variant="outline" size="sm" type="button" onClick={() => setIsAssessModalOpen(false)}>Cancel</Button>
            <Button variant="primary" size="sm" type="submit" isLoading={isSubmitting}>Record Assessment</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
