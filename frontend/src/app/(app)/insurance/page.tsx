"use client";

import React, { useState, useEffect } from "react";
import {
  ShieldCheck,
  Plus,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";

interface InsuranceRecord {
  id: number;
  number: string;
  partyId: number | null;
  partyName: string | null;
  companyId: number | null;
  companyName: string | null;
  insuranceType: string | null;
  category: string | null;
  memberSince: string | null;
  memberExp: string | null;
  notes: string | null;
}

export default function InsurancePage() {
  const [insurances, setInsurances] = useState<InsuranceRecord[]>([]);
  const [companies, setCompanies] = useState<{ id: number; name: string }[]>([]);
  const [patients, setPatients] = useState<{ patientId: number; partyId: number | null; puid: string | null }[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formPartyId, setFormPartyId] = useState<number>(0);
  const [formCompanyId, setFormCompanyId] = useState<number>(0);
  const [formNumber, setFormNumber] = useState("");
  const [formType, setFormType] = useState("");
  const [formNotes, setFormNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadData = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const res = await fetch("/api/clinical/insurance");
      const data = await res.json();
      if (data.success) {
        setInsurances(Array.isArray(data.insurances) ? data.insurances : []);
        setCompanies(Array.isArray(data.insuranceCompanies) ? data.insuranceCompanies : []);
        const enrollable = (Array.isArray(data.enrollablePatients) ? data.enrollablePatients : []).filter((p: any) => p.partyId);
        setPatients(enrollable);
        setFormPartyId((prev) => prev || enrollable[0]?.partyId || 0);
      } else if (data.error) {
        setErrorMessage(data.error);
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to load insurance records");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (companies.length > 0 && !formCompanyId) setFormCompanyId(companies[0].id);
  }, [companies, formCompanyId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formPartyId || !formCompanyId || !formNumber.trim()) {
      setErrorMessage("Select a patient, an insurance company, and enter a policy number.");
      return;
    }
    setIsSubmitting(true);
    setErrorMessage(null);
    try {
      const res = await fetch("/api/clinical/insurance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          partyId: formPartyId,
          companyId: formCompanyId,
          number: formNumber,
          insuranceType: formType,
          notes: formNotes,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || "Failed to enroll insurance policy");
      await loadData();
      setIsModalOpen(false);
      setFormNumber("");
      setFormType("");
      setFormNotes("");
      setFeedback(data.message || "Insurance policy enrolled.");
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to enroll insurance policy");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-7 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-slate-200/90 gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="kicker text-[#0F766E]">COVERAGE MANAGEMENT</span>
            <span className="text-slate-300">/</span>
            <span className="kicker text-slate-500">PATIENT INSURANCE</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-semibold text-slate-900 tracking-tight">
            Patient Insurance & Coverage
          </h1>
          <p className="text-xs text-slate-600 mt-1">
            Enroll patients in insurance coverage and track active policies.
          </p>
        </div>
        <Button variant="primary" size="sm" onClick={() => setIsModalOpen(true)} leftIcon={<Plus className="w-4 h-4" />}>
          + Enroll Policy
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

      {companies.length === 0 && (
        <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900">
          No insurance companies are configured as party records in this tenant yet. Flag a party as an insurance company before enrolling policies.
        </div>
      )}

      <div className="bg-white border border-slate-200/90 rounded-xl shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="p-12 text-center text-xs text-slate-500 font-mono">Loading insurance records...</div>
          ) : insurances.length === 0 ? (
            <div className="p-12 text-center space-y-3">
              <ShieldCheck className="w-10 h-10 text-slate-300 mx-auto" />
              <div className="text-sm font-bold text-slate-800">No Insurance Policies on File</div>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">No patients have an insurance policy enrolled in this tenant yet.</p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200/80 font-mono text-[11px] text-slate-500 uppercase tracking-wider">
                  <th className="py-3 px-5">Policy #</th>
                  <th className="py-3 px-5">Policyholder</th>
                  <th className="py-3 px-5">Insurance Company</th>
                  <th className="py-3 px-5">Type</th>
                  <th className="py-3 px-5">Member Since</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-sans">
                {insurances.map((ins) => (
                  <tr key={ins.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-5 font-mono font-bold text-[#0F766E]">{ins.number}</td>
                    <td className="py-3.5 px-5 font-semibold text-slate-900">{ins.partyName || "—"}</td>
                    <td className="py-3.5 px-5 text-slate-700">{ins.companyName || "—"}</td>
                    <td className="py-3.5 px-5">
                      {ins.insuranceType ? (
                        <Badge variant="teal" size="sm">
                          {{ state: "State", labour_union: "Labour Union", private: "Private" }[ins.insuranceType] || ins.insuranceType}
                        </Badge>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                    <td className="py-3.5 px-5 text-slate-500 font-mono">{ins.memberSince || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Enroll Insurance Policy" kicker="PATIENT COVERAGE ENROLLMENT" size="md">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700">Select Patient *</label>
            {patients.length === 0 ? (
              <p className="text-xs text-red-600 font-medium">No patients found in this tenant.</p>
            ) : (
              <select
                value={formPartyId}
                onChange={(e) => setFormPartyId(parseInt(e.target.value, 10))}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg font-semibold focus:outline-none focus:border-[#0F766E]"
              >
                {patients.map((p) => (
                  <option key={p.partyId} value={p.partyId as number}>PUID: {p.puid}</option>
                ))}
              </select>
            )}
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700">Insurance Company *</label>
            {companies.length === 0 ? (
              <p className="text-xs text-red-600 font-medium">No insurance companies configured.</p>
            ) : (
              <select
                value={formCompanyId}
                onChange={(e) => setFormCompanyId(parseInt(e.target.value, 10))}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg font-semibold focus:outline-none focus:border-[#0F766E]"
              >
                {companies.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            )}
          </div>

          <Input label="Policy Number *" value={formNumber} onChange={(e) => setFormNumber(e.target.value)} required />
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700">Insurance Type</label>
            <select
              value={formType}
              onChange={(e) => setFormType(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg font-semibold focus:outline-none focus:border-[#0F766E]"
            >
              <option value="">Not specified</option>
              <option value="state">State</option>
              <option value="labour_union">Labour Union / Syndical</option>
              <option value="private">Private</option>
            </select>
          </div>
          <Textarea label="Notes" value={formNotes} onChange={(e) => setFormNotes(e.target.value)} rows={2} />

          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button type="submit" variant="primary" isLoading={isSubmitting} disabled={!formPartyId || !formCompanyId} className="bg-[#0F766E] font-bold">
              Enroll Policy
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
