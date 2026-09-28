"use client";

import React, { useState, useEffect } from "react";
import {
  Syringe,
  Plus,
  CheckCircle2,
  AlertCircle,
  Calendar,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";

interface Vaccination {
  id: number;
  patientId: number | null;
  patientName: string | null;
  puid: string | null;
  vaccineId: number | null;
  vaccineName: string | null;
  dose: number | null;
  date: string | null;
  nextDoseDate: string | null;
  vaccineLot: string | null;
  adminRoute: string | null;
  observations: string | null;
  state: string | null;
}

export default function ImmunizationsPage() {
  const [vaccinations, setVaccinations] = useState<Vaccination[]>([]);
  const [vaccineCatalog, setVaccineCatalog] = useState<{ id: number; name: string }[]>([]);
  const [patientsList, setPatientsList] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formPatientId, setFormPatientId] = useState<number>(0);
  const [formVaccineId, setFormVaccineId] = useState<number>(0);
  const [formDose, setFormDose] = useState("1");
  const [formNextDose, setFormNextDose] = useState("");
  const [formLot, setFormLot] = useState("");
  const [formRoute, setFormRoute] = useState("");
  const [formObservations, setFormObservations] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadData = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const [vaxRes, patRes] = await Promise.all([
        fetch("/api/clinical/immunizations"),
        fetch("/api/clinical/patients"),
      ]);
      const vaxData = await vaxRes.json();
      const patData = await patRes.json();
      if (vaxData.success) {
        setVaccinations(Array.isArray(vaxData.vaccinations) ? vaxData.vaccinations : []);
        setVaccineCatalog(Array.isArray(vaxData.vaccineCatalog) ? vaxData.vaccineCatalog : []);
      } else if (vaxData.error) {
        setErrorMessage(vaxData.error);
      }
      if (patData.success && Array.isArray(patData.patients)) {
        setPatientsList(patData.patients);
        setFormPatientId((prev) => prev || patData.patients[0]?.id || 0);
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to load immunization records");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (vaccineCatalog.length > 0 && !formVaccineId) {
      setFormVaccineId(vaccineCatalog[0].id);
    }
  }, [vaccineCatalog, formVaccineId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formPatientId || !formVaccineId) {
      setErrorMessage("Select a patient and a vaccine from the formulary.");
      return;
    }
    setIsSubmitting(true);
    setErrorMessage(null);
    try {
      const res = await fetch("/api/clinical/immunizations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patientId: formPatientId,
          vaccineId: formVaccineId,
          dose: formDose,
          nextDoseDate: formNextDose || undefined,
          vaccineLot: formLot,
          adminRoute: formRoute,
          observations: formObservations,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || "Failed to record vaccination");
      await loadData();
      setIsModalOpen(false);
      setFormDose("1");
      setFormNextDose("");
      setFormLot("");
      setFormRoute("");
      setFormObservations("");
      setFeedback(data.message || "Vaccination recorded.");
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to record vaccination");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-7 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-slate-200/90 gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="kicker text-[#0F766E]">PREVENTIVE CARE</span>
            <span className="text-slate-300">/</span>
            <span className="kicker text-slate-500">IMMUNIZATION SCHEDULE</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-semibold text-slate-900 tracking-tight">
            Immunizations & Vaccine Administration
          </h1>
          <p className="text-xs text-slate-600 mt-1">
            Record vaccine doses administered and track upcoming dose schedules.
          </p>
        </div>
        <Button variant="primary" size="sm" onClick={() => setIsModalOpen(true)} leftIcon={<Plus className="w-4 h-4" />}>
          + Record Vaccination
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

      {vaccineCatalog.length === 0 && (
        <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900">
          No vaccines are configured in this tenant's medicament formulary yet. Add a medicament with the "Is a Vaccine" flag set before recording administrations.
        </div>
      )}

      <div className="bg-white border border-slate-200/90 rounded-xl shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="p-12 text-center text-xs text-slate-500 font-mono">Loading immunization records...</div>
          ) : vaccinations.length === 0 ? (
            <div className="p-12 text-center space-y-3">
              <Syringe className="w-10 h-10 text-slate-300 mx-auto" />
              <div className="text-sm font-bold text-slate-800">No vaccinations recorded</div>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                No vaccine administrations are on file yet for this tenant.
              </p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200/80 font-mono text-[11px] text-slate-500 uppercase tracking-wider">
                  <th className="py-3 px-5">Patient</th>
                  <th className="py-3 px-5">Vaccine</th>
                  <th className="py-3 px-5">Dose</th>
                  <th className="py-3 px-5">Date Administered</th>
                  <th className="py-3 px-5">Next Dose Due</th>
                  <th className="py-3 px-5">Lot #</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-sans">
                {vaccinations.map((v) => (
                  <tr key={v.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-5">
                      <span className="block font-semibold text-slate-900">{v.patientName || "—"}</span>
                      <span className="font-mono text-slate-500 text-[11px]">{v.puid || ""}</span>
                    </td>
                    <td className="py-3.5 px-5 font-bold text-slate-900">{v.vaccineName || "—"}</td>
                    <td className="py-3.5 px-5 font-mono text-slate-700">{v.dose ?? "—"}</td>
                    <td className="py-3.5 px-5 text-slate-700">{v.date ? v.date.slice(0, 10) : "—"}</td>
                    <td className="py-3.5 px-5">
                      {v.nextDoseDate ? (
                        <Badge variant="blue" size="sm" dot>
                          <Calendar className="w-3 h-3 mr-1 inline" />
                          {v.nextDoseDate.slice(0, 10)}
                        </Badge>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                    <td className="py-3.5 px-5 font-mono text-slate-500">{v.vaccineLot || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Record Vaccination" kicker="IMMUNIZATION ADMINISTRATION" size="md">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700">Select Patient *</label>
            <select
              value={formPatientId}
              onChange={(e) => setFormPatientId(parseInt(e.target.value, 10))}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg font-semibold focus:outline-none focus:border-[#0F766E]"
            >
              {patientsList.map((p) => (
                <option key={p.id} value={p.id}>{p.name} (PUID: {p.puid})</option>
              ))}
              {patientsList.length === 0 && <option value={0}>No patients found</option>}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700">Vaccine (Formulary) *</label>
            {vaccineCatalog.length === 0 ? (
              <p className="text-xs text-red-600 font-medium">No vaccines configured in the formulary.</p>
            ) : (
              <select
                value={formVaccineId}
                onChange={(e) => setFormVaccineId(parseInt(e.target.value, 10))}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg font-semibold focus:outline-none focus:border-[#0F766E]"
              >
                {vaccineCatalog.map((v) => (
                  <option key={v.id} value={v.id}>{v.name}</option>
                ))}
              </select>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input label="Dose Number" type="number" min="1" step="1" value={formDose} onChange={(e) => setFormDose(e.target.value)} required />
            <Input label="Next Dose Due" type="date" value={formNextDose} onChange={(e) => setFormNextDose(e.target.value)} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input label="Vaccine Lot #" value={formLot} onChange={(e) => setFormLot(e.target.value)} />
            <Input label="Administration Route" value={formRoute} onChange={(e) => setFormRoute(e.target.value)} placeholder="e.g. Intramuscular" />
          </div>

          <Textarea label="Observations" value={formObservations} onChange={(e) => setFormObservations(e.target.value)} rows={2} />

          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button type="submit" variant="primary" isLoading={isSubmitting} disabled={!formPatientId || !formVaccineId} className="bg-[#0F766E] font-bold">
              Record Administration
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
