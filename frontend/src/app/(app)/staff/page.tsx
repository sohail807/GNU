"use client";

import React, { useState, useEffect } from "react";
import {
  Stethoscope,
  Plus,
  CheckCircle2,
  AlertCircle,
  Trash2,
  Star,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";

interface SpecialtyAssignment {
  id: number;
  name: string | null;
  isMain: boolean;
}

interface StaffMember {
  id: number;
  name: string;
  code: string | null;
  specialties: SpecialtyAssignment[];
}

export default function StaffDirectoryPage() {
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [specialtyCatalog, setSpecialtyCatalog] = useState<{ id: number; name: string }[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [targetHpId, setTargetHpId] = useState<number | null>(null);
  const [selectedSpecialtyId, setSelectedSpecialtyId] = useState<number>(0);
  const [isMain, setIsMain] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadData = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const res = await fetch("/api/clinical/staff");
      const data = await res.json();
      if (data.success) {
        setStaff(Array.isArray(data.staff) ? data.staff : []);
        const catalog = Array.isArray(data.specialtyCatalog) ? data.specialtyCatalog : [];
        setSpecialtyCatalog(catalog);
        setSelectedSpecialtyId((prev) => prev || catalog[0]?.id || 0);
      } else if (data.error) {
        setErrorMessage(data.error);
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to load staff directory");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const openAssign = (hpId: number) => {
    setTargetHpId(hpId);
    setIsMain(false);
    setIsModalOpen(true);
  };

  const handleAssign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetHpId || !selectedSpecialtyId) return;
    setIsSubmitting(true);
    setErrorMessage(null);
    try {
      const res = await fetch("/api/clinical/staff", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "add_specialty", healthprofId: targetHpId, specialtyId: selectedSpecialtyId, isMain }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || "Failed to assign specialty");
      await loadData();
      setIsModalOpen(false);
      setFeedback(data.message || "Specialty assigned.");
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to assign specialty");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemove = async (assignmentId: number) => {
    setErrorMessage(null);
    try {
      const res = await fetch("/api/clinical/staff", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "remove_specialty", assignmentId }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || "Failed to remove specialty");
      await loadData();
      setFeedback(data.message || "Specialty removed.");
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to remove specialty");
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-7 animate-fade-in">
      <div className="pb-6 border-b border-slate-200/90">
        <div className="flex items-center gap-2 mb-1">
          <span className="kicker text-[#0F766E]">Governance</span>
          <span className="text-slate-300">/</span>
          <span className="kicker text-slate-500">Staff Directory</span>
        </div>
        <h1 className="text-xl sm:text-2xl font-semibold text-slate-900 tracking-tight">
          Clinical Staff Directory
        </h1>
        <p className="text-xs text-slate-600 mt-1">
          Health professional roster and specialty assignments, resolved live from GNU Health.
        </p>
      </div>

      {feedback && (
        <div className="p-4 rounded-xl bg-emerald-50 text-xs text-emerald-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{feedback}</span>
          </div>
          <button onClick={() => setFeedback(null)} className="text-emerald-700 font-bold px-2">✕</button>
        </div>
      )}
      {errorMessage && (
        <div className="p-4 rounded-xl bg-red-50 text-xs text-red-700 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {isLoading ? (
        <div className="p-12 text-center text-xs text-slate-500 font-mono">Loading staff directory...</div>
      ) : staff.length === 0 ? (
        <div className="bg-white border border-slate-200/90 rounded-2xl shadow-2xs p-12 text-center space-y-3">
          <Stethoscope className="w-10 h-10 text-slate-300 mx-auto" />
          <div className="text-sm font-bold text-slate-800">No Health Professionals on File</div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {staff.map((hp) => (
            <div key={hp.id} className="bg-white border border-slate-200/90 rounded-2xl shadow-2xs p-5 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-lg bg-teal-50 text-[#0F766E] flex items-center justify-center">
                    <Stethoscope className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-slate-900">{hp.name}</h3>
                    {hp.code && <span className="text-[11px] text-slate-400 font-mono">{hp.code}</span>}
                  </div>
                </div>
                <Button variant="outline" size="xs" onClick={() => openAssign(hp.id)} leftIcon={<Plus className="w-3.5 h-3.5" />}>
                  Specialty
                </Button>
              </div>

              {hp.specialties.length === 0 ? (
                <p className="text-xs text-slate-400 italic">No specialties assigned yet.</p>
              ) : (
                <div className="flex flex-wrap gap-1.5">
                  {hp.specialties.map((s) => (
                    <span key={s.id} className="inline-flex items-center gap-1">
                      <Badge variant={s.isMain ? "teal" : "neutral"} size="sm">
                        {s.isMain && <Star className="w-2.5 h-2.5 mr-1 inline" />}
                        {s.name || "Unknown"}
                      </Badge>
                      <button onClick={() => handleRemove(s.id)} className="text-slate-300 hover:text-red-500" title="Remove">
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Assign Specialty" kicker="Staff Directory" size="sm">
        <form onSubmit={handleAssign} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-600">Specialty *</label>
            <select
              value={selectedSpecialtyId}
              onChange={(e) => setSelectedSpecialtyId(parseInt(e.target.value, 10))}
              className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg font-medium focus:outline-none focus:border-[#0F766E]"
            >
              {specialtyCatalog.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>
          <label className="flex items-center gap-2 text-xs text-slate-700">
            <input type="checkbox" checked={isMain} onChange={(e) => setIsMain(e.target.checked)} className="accent-[#0F766E]" />
            Primary specialty
          </label>
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button type="submit" variant="primary" isLoading={isSubmitting} disabled={!selectedSpecialtyId} className="bg-[#0F766E] font-bold">
              Assign
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
