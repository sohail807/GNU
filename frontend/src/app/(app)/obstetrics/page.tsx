"use client";

import React, { useState, useEffect } from "react";
import {
  Baby,
  Plus,
  CheckCircle2,
  AlertCircle,
  Heart,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";

interface Pregnancy {
  id: number;
  patientId: number | null;
  patientName: string | null;
  puid: string | null;
  gravida: number | null;
  fetuses: number | null;
  lmp: string | null;
  currentPregnancy: boolean;
  pregnancyEndDate: string | null;
  pregnancyEndResult: string | null;
  notes: string | null;
}

const RESULT_LABELS: Record<string, string> = {
  live_birth: "Live Birth",
  abortion: "Abortion",
  stillbirth: "Stillbirth",
  status_unknown: "Status Unknown",
};

export default function ObstetricsPage() {
  const [pregnancies, setPregnancies] = useState<Pregnancy[]>([]);
  const [femalePatients, setFemalePatients] = useState<{ id: number; name: string; puid: string }[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [isNewOpen, setIsNewOpen] = useState(false);
  const [formPatientId, setFormPatientId] = useState<number>(0);
  const [formFetuses, setFormFetuses] = useState("1");
  const [formLmp, setFormLmp] = useState("");
  const [formNotes, setFormNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [closingId, setClosingId] = useState<number | null>(null);
  const [closeResult, setCloseResult] = useState("live_birth");
  const [closeWeeks, setCloseWeeks] = useState("40");

  const loadData = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const res = await fetch("/api/clinical/obstetrics");
      const data = await res.json();
      if (data.success) {
        setPregnancies(Array.isArray(data.pregnancies) ? data.pregnancies : []);
        const fem = Array.isArray(data.femalePatients) ? data.femalePatients : [];
        setFemalePatients(fem);
        setFormPatientId((prev) => prev || fem[0]?.id || 0);
      } else if (data.error) {
        setErrorMessage(data.error);
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to load obstetric records");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formPatientId) {
      setErrorMessage("Select a patient.");
      return;
    }
    if (!formLmp) {
      setErrorMessage("Last Menstrual Period (LMP) is required.");
      return;
    }
    setIsSubmitting(true);
    setErrorMessage(null);
    try {
      const res = await fetch("/api/clinical/obstetrics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "create", patientId: formPatientId, fetuses: formFetuses, lmp: formLmp, notes: formNotes }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || "Failed to record pregnancy");
      await loadData();
      setIsNewOpen(false);
      setFormFetuses("1");
      setFormLmp("");
      setFormNotes("");
      setFeedback(data.message || "Pregnancy recorded.");
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to record pregnancy");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCloseOutcome = async (id: number) => {
    setErrorMessage(null);
    if (!closeWeeks || Number(closeWeeks) <= 0) {
      setErrorMessage("Enter the gestational weeks at end of pregnancy.");
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/clinical/obstetrics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "close", pregnancyId: id, result: closeResult, gestationalWeeks: closeWeeks }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || "Failed to record outcome");
      await loadData();
      setClosingId(null);
      setFeedback(data.message || "Pregnancy outcome recorded.");
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to record outcome");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-7 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-slate-200/90 gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="kicker text-[#0F766E]">OBSTETRICS & GYNECOLOGY</span>
            <span className="text-slate-300">/</span>
            <span className="kicker text-slate-500">PREGNANCY TRACKING</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-semibold text-slate-900 tracking-tight">
            Obstetric History & Pregnancy Tracking
          </h1>
          <p className="text-xs text-slate-600 mt-1">
            Record gravida/pregnancy episodes, LMP, and pregnancy outcomes.
          </p>
        </div>
        <Button variant="primary" size="sm" onClick={() => setIsNewOpen(true)} leftIcon={<Plus className="w-4 h-4" />}>
          + New Pregnancy Record
        </Button>
      </div>

      {feedback && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center justify-between shadow-2xs font-medium">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{feedback}</span>
          </div>
          <button onClick={() => setFeedback(null)} className="text-emerald-700 font-bold px-2">✕</button>
        </div>
      )}
      {errorMessage && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-xs text-red-800 flex items-center gap-2 shadow-2xs font-medium">
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      <div className="bg-white border border-slate-200/90 rounded-xl shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="p-12 text-center text-xs text-slate-500 font-mono">Loading obstetric records...</div>
          ) : pregnancies.length === 0 ? (
            <div className="p-12 text-center space-y-3">
              <Baby className="w-10 h-10 text-slate-300 mx-auto" />
              <div className="text-sm font-bold text-slate-800">No Pregnancy Records</div>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">No obstetric history is on file for this tenant yet.</p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200/80 font-mono text-[11px] text-slate-500 uppercase tracking-wider">
                  <th className="py-3 px-5">Patient</th>
                  <th className="py-3 px-5">Gravida</th>
                  <th className="py-3 px-5">Fetuses</th>
                  <th className="py-3 px-5">LMP</th>
                  <th className="py-3 px-5">Status</th>
                  <th className="py-3 px-5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-sans">
                {pregnancies.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-5">
                      <span className="block font-semibold text-slate-900">{p.patientName || "—"}</span>
                      <span className="font-mono text-slate-500 text-[11px]">{p.puid || ""}</span>
                    </td>
                    <td className="py-3.5 px-5 font-mono font-bold text-[#0F766E]">G{p.gravida ?? "—"}</td>
                    <td className="py-3.5 px-5 font-mono text-slate-700">{p.fetuses ?? "—"}</td>
                    <td className="py-3.5 px-5 text-slate-700">{p.lmp || "—"}</td>
                    <td className="py-3.5 px-5">
                      {p.currentPregnancy ? (
                        <Badge variant="amber" size="sm" dot><Heart className="w-3 h-3 mr-1 inline" />Active</Badge>
                      ) : (
                        <Badge variant="neutral" size="sm">{p.pregnancyEndResult ? RESULT_LABELS[p.pregnancyEndResult] || p.pregnancyEndResult : "Closed"}</Badge>
                      )}
                    </td>
                    <td className="py-3.5 px-5 text-right">
                      {p.currentPregnancy && (
                        closingId === p.id ? (
                          <div className="flex items-center gap-1.5 justify-end">
                            <select value={closeResult} onChange={(e) => setCloseResult(e.target.value)} className="text-[11px] border border-slate-300 rounded px-1.5 py-1">
                              <option value="live_birth">Live Birth</option>
                              <option value="abortion">Abortion</option>
                              <option value="stillbirth">Stillbirth</option>
                              <option value="status_unknown">Status Unknown</option>
                            </select>
                            <input
                              type="number"
                              min="1"
                              step="1"
                              value={closeWeeks}
                              onChange={(e) => setCloseWeeks(e.target.value)}
                              title="Gestational weeks at end"
                              placeholder="Weeks"
                              className="w-16 text-[11px] border border-slate-300 rounded px-1.5 py-1"
                            />
                            <Button variant="primary" size="xs" onClick={() => handleCloseOutcome(p.id)} isLoading={isSubmitting} disabled={isSubmitting}>Save</Button>
                            <Button variant="ghost" size="xs" onClick={() => setClosingId(null)} disabled={isSubmitting}>Cancel</Button>
                          </div>
                        ) : (
                          <Button variant="outline" size="xs" onClick={() => setClosingId(p.id)}>Record Outcome</Button>
                        )
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <Modal isOpen={isNewOpen} onClose={() => setIsNewOpen(false)} title="New Pregnancy Record" kicker="OBSTETRIC HISTORY" size="md">
        <form onSubmit={handleCreate} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700">Select Patient *</label>
            {femalePatients.length === 0 ? (
              <p className="text-xs text-red-600 font-medium">No female patients found in this tenant.</p>
            ) : (
              <select
                value={formPatientId}
                onChange={(e) => setFormPatientId(parseInt(e.target.value, 10))}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg font-semibold focus:outline-none focus:border-[#0F766E]"
              >
                {femalePatients.map((p) => (
                  <option key={p.id} value={p.id}>{p.name} (PUID: {p.puid})</option>
                ))}
              </select>
            )}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input label="Number of Fetuses *" type="number" min="1" step="1" value={formFetuses} onChange={(e) => setFormFetuses(e.target.value)} required />
            <Input label="Last Menstrual Period *" type="date" value={formLmp} onChange={(e) => setFormLmp(e.target.value)} required />
          </div>
          <Textarea label="Clinical Notes" value={formNotes} onChange={(e) => setFormNotes(e.target.value)} rows={2} />
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setIsNewOpen(false)}>Cancel</Button>
            <Button type="submit" variant="primary" isLoading={isSubmitting} disabled={!formPatientId} className="bg-[#0F766E] font-bold">
              Record Pregnancy
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
