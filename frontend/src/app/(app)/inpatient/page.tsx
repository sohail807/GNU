"use client";

import React, { useState, useEffect } from "react";
import {
  Bed,
  Building,
  UserPlus,
  CheckCircle2,
  Clock,
  Activity,
  Calendar,
  Search,
  Filter,
  ArrowRight,
  ShieldAlert,
  AlertCircle,
  FileText,
  UserCheck,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";

interface Ward {
  id: number;
  name: string;
  floor: number;
  numberOfBeds: number;
  state: string;
  gender: string;
  isPrivate: boolean;
}

interface HospitalBed {
  id: number;
  name: string;
  wardId: number;
  wardName: string;
  bedType: string;
  state: string;
  telephone: string | null;
}

interface InpatientAdmission {
  id: number;
  registrationNumber: string;
  patientId: number;
  patientName: string;
  bedId: number | null;
  bedName: string;
  hospitalizationDate: string;
  dischargeDate: string | null;
  admissionType: string;
  attendingPhysician: string;
  state: string;
  nursingPlan: string;
  dischargePlan: string | null;
}

interface CensusStats {
  totalBeds: number;
  occupiedBeds: number;
  availableBeds: number;
  occupancyRate: number;
  todayAdmissions: number;
}

export default function InpatientPage() {
  const [wards, setWards] = useState<Ward[]>([]);
  const [beds, setBeds] = useState<HospitalBed[]>([]);
  const [admissions, setAdmissions] = useState<InpatientAdmission[]>([]);
  const [stats, setStats] = useState<CensusStats>({
    totalBeds: 24,
    occupiedBeds: 6,
    availableBeds: 18,
    occupancyRate: 25,
    todayAdmissions: 2,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [selectedWardFilter, setSelectedWardFilter] = useState<number | "all">("all");
  const [searchQuery, setSearchQuery] = useState("");

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [patientsList, setPatientsList] = useState<{ id: number; name: string; puid: string }[]>([]);

  // Admission Modal State
  const [isAdmitModalOpen, setIsAdmitModalOpen] = useState(false);
  const [selectedPatientId, setSelectedPatientId] = useState("");
  const [selectedBedId, setSelectedBedId] = useState("");
  const [admissionType, setAdmissionType] = useState("routine");
  const [nursingPlan, setNursingPlan] = useState("");
  const [expectedDischargeDate, setExpectedDischargeDate] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Discharge Modal State
  const [isDischargeModalOpen, setIsDischargeModalOpen] = useState(false);
  const [targetAdmission, setTargetAdmission] = useState<InpatientAdmission | null>(null);
  const [dischargePlan, setDischargePlan] = useState("");
  const [dischargeReason, setDischargeReason] = useState("home");

  // GNU Health requires both a "Reason for Admission" and a "Discharge Dx"
  // ICD-10 pathology code before a registration can move to the "done" state.
  type IcdPick = { id: number; code: string; name: string } | null;
  const [admissionReason, setAdmissionReason] = useState<IcdPick>(null);
  const [admissionReasonQuery, setAdmissionReasonQuery] = useState("");
  const [admissionReasonResults, setAdmissionReasonResults] = useState<IcdPick[]>([]);
  const [dischargeDx, setDischargeDx] = useState<IcdPick>(null);
  const [dischargeDxQuery, setDischargeDxQuery] = useState("");
  const [dischargeDxResults, setDischargeDxResults] = useState<IcdPick[]>([]);

  useEffect(() => {
    if (!admissionReasonQuery || admissionReasonQuery.length < 2) {
      setAdmissionReasonResults([]);
      return;
    }
    const t = setTimeout(async () => {
      try {
        const res = await fetch(`/api/clinical/pathology?q=${encodeURIComponent(admissionReasonQuery)}`);
        const data = await res.json();
        setAdmissionReasonResults(data.success ? data.pathologies : []);
      } catch {
        setAdmissionReasonResults([]);
      }
    }, 300);
    return () => clearTimeout(t);
  }, [admissionReasonQuery]);

  useEffect(() => {
    if (!dischargeDxQuery || dischargeDxQuery.length < 2) {
      setDischargeDxResults([]);
      return;
    }
    const t = setTimeout(async () => {
      try {
        const res = await fetch(`/api/clinical/pathology?q=${encodeURIComponent(dischargeDxQuery)}`);
        const data = await res.json();
        setDischargeDxResults(data.success ? data.pathologies : []);
      } catch {
        setDischargeDxResults([]);
      }
    }, 300);
    return () => clearTimeout(t);
  }, [dischargeDxQuery]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [res, patRes] = await Promise.all([
        fetch("/api/clinical/inpatient"),
        fetch("/api/clinical/patients"),
      ]);
      if (res.ok) {
        const data = await res.json();
        setWards(data.wards || []);
        setBeds(data.beds || []);
        setAdmissions(data.admissions || []);
        if (data.stats) setStats(data.stats);
      }
      const patData = await patRes.json();
      if (patData.success && Array.isArray(patData.patients)) {
        setPatientsList(patData.patients);
      }
    } catch (e) {
      console.error("Failed to load inpatient census:", e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAdmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPatientId) return;
    if (!expectedDischargeDate) {
      setErrorMessage("An expected discharge date is required to admit a patient.");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);
    try {
      const res = await fetch("/api/clinical/inpatient", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patientId: selectedPatientId,
          bedId: selectedBedId || null,
          admissionType,
          nursingPlan,
          expectedDischargeDate,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to admit patient");
      }

      setIsAdmitModalOpen(false);
      setSelectedPatientId("");
      setSelectedBedId("");
      setNursingPlan("");
      setExpectedDischargeDate("");
      setFeedback("Patient admitted successfully.");
      fetchData();
    } catch (e: any) {
      setErrorMessage(e.message || "Failed to admit patient");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDischarge = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetAdmission) return;
    if (!admissionReason) {
      setErrorMessage("Select a Reason for Admission (ICD-10) before discharging.");
      return;
    }
    if (!dischargeDx) {
      setErrorMessage("Select a Discharge Diagnosis (ICD-10) before discharging.");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);
    try {
      const res = await fetch("/api/clinical/inpatient", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          admissionId: targetAdmission.id,
          bedId: targetAdmission.bedId,
          dischargePlan,
          dischargeReason,
          admissionReasonId: admissionReason.id,
          dischargeDxId: dischargeDx.id,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to discharge patient");
      }

      setIsDischargeModalOpen(false);
      setTargetAdmission(null);
      setDischargePlan("");
      setAdmissionReason(null);
      setAdmissionReasonQuery("");
      setDischargeDx(null);
      setDischargeDxQuery("");
      setFeedback("Patient discharged. Bed marked as needing cleaning before reassignment.");
      fetchData();
    } catch (e: any) {
      setErrorMessage(e.message || "Failed to discharge patient");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBedClean = async (adm: InpatientAdmission) => {
    if (!adm.bedId) return;
    setErrorMessage(null);
    try {
      const res = await fetch("/api/clinical/inpatient", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "bedclean", admissionId: adm.id, bedId: adm.bedId }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to mark bed as cleaned");
      }
      setFeedback(`Bed ${adm.bedName} marked clean and available.`);
      fetchData();
    } catch (e: any) {
      setErrorMessage(e.message || "Failed to mark bed as cleaned");
    }
  };

  const filteredBeds = beds.filter((b) => {
    if (selectedWardFilter !== "all" && b.wardId !== selectedWardFilter) return false;
    return true;
  });

  const filteredAdmissions = admissions.filter((a) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      (a.patientName || "").toLowerCase().includes(q) ||
      (a.registrationNumber || "").toLowerCase().includes(q) ||
      (a.bedName || "").toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      {feedback && (
        <div className="p-3 rounded-lg bg-emerald-50 text-xs text-emerald-800 flex items-center justify-between">
          <span>{feedback}</span>
          <button onClick={() => setFeedback(null)} className="text-emerald-700 font-bold px-2">✕</button>
        </div>
      )}
      {errorMessage && !isAdmitModalOpen && !isDischargeModalOpen && (
        <div className="p-3 rounded-lg bg-red-50 text-xs text-red-700 flex items-center justify-between">
          <span>{errorMessage}</span>
          <button onClick={() => setErrorMessage(null)} className="text-red-700 font-bold px-2">✕</button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200/80 pb-5">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono font-semibold text-[#0F766E] uppercase tracking-wider mb-1">
            <Building className="w-3.5 h-3.5" />
            <span>Hospital Inpatient Services / Wards & Census</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 font-display">
            Inpatient Admissions & Ward Census
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage bed availability, admit emergency & elective patients, and track active ward care plans.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchData}
            isLoading={isLoading}
            className="text-xs"
          >
            Refresh Census
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => setIsAdmitModalOpen(true)}
            leftIcon={<UserPlus className="w-4 h-4" />}
            className="text-xs font-semibold"
          >
            Admit Patient
          </Button>
        </div>
      </div>

      {/* KPI Census Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4.5 rounded-xl border border-slate-200/90 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-[11px] font-mono font-bold uppercase tracking-wider">Total Hospital Beds</span>
            <Bed className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-2xl font-semibold text-slate-900 font-mono">{stats.totalBeds}</div>
          <div className="text-[11px] text-slate-400 mt-1">Configured across all wards</div>
        </div>

        <div className="bg-white p-4.5 rounded-xl border border-slate-200/90 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-[11px] font-mono font-bold uppercase tracking-wider">Available Beds</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-semibold text-emerald-600 font-mono">{stats.availableBeds}</div>
          <div className="text-[11px] text-emerald-600/80 font-medium mt-1">Ready for immediate intake</div>
        </div>

        <div className="bg-white p-4.5 rounded-xl border border-slate-200/90 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-[11px] font-mono font-bold uppercase tracking-wider">Occupied Beds</span>
            <Activity className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-2xl font-semibold text-blue-600 font-mono">{stats.occupiedBeds}</div>
          <div className="text-[11px] text-blue-600/80 font-medium mt-1">Active hospitalized patients</div>
        </div>

        <div className="bg-white p-4.5 rounded-xl border border-slate-200/90 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-[11px] font-mono font-bold uppercase tracking-wider">Occupancy Rate</span>
            <Clock className="w-4 h-4 text-teal-600" />
          </div>
          <div className="text-2xl font-semibold text-teal-700 font-mono">{stats.occupancyRate}%</div>
          <div className="w-full bg-slate-100 h-1.5 rounded-full mt-2 overflow-hidden">
            <div
              className="bg-[#0F766E] h-full rounded-full transition-all duration-300"
              style={{ width: `${Math.min(100, stats.occupancyRate)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Ward Filter & Bed Matrix */}
      <div className="bg-white rounded-xl border border-slate-200/90 shadow-xs p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <h2 className="text-sm font-bold text-slate-900">Ward & Bed Allocation Census</h2>
            <p className="text-xs text-slate-500">Real-time status of hospital units and telemetry beds.</p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setSelectedWardFilter("all")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                selectedWardFilter === "all"
                  ? "bg-[#0F766E] text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              All Wards
            </button>
            {wards.map((w) => (
              <button
                key={w.id}
                onClick={() => setSelectedWardFilter(w.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  selectedWardFilter === w.id
                    ? "bg-[#0F766E] text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {w.name}
              </button>
            ))}
          </div>
        </div>

        {/* Visual Bed Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
          {filteredBeds.length === 0 ? (
            <div className="col-span-full py-8 text-center text-xs text-slate-400">
              No beds configured for this ward filter.
            </div>
          ) : (
            filteredBeds.map((bed) => {
              const styles: Record<string, { border: string; badge: string; icon: string }> = {
                occupied: { border: "border-blue-200 bg-blue-50/40 text-blue-900", badge: "bg-blue-100 text-blue-700", icon: "text-blue-500" },
                to_clean: { border: "border-amber-200 bg-amber-50/40 text-amber-900", badge: "bg-amber-100 text-amber-700", icon: "text-amber-500" },
                na: { border: "border-slate-200 bg-slate-50 text-slate-500", badge: "bg-slate-100 text-slate-500", icon: "text-slate-400" },
                free: { border: "border-emerald-200 bg-emerald-50/40 text-emerald-900", badge: "bg-emerald-100 text-emerald-700", icon: "text-emerald-500" },
              };
              const s = styles[bed.state] || styles.free;
              return (
                <div key={bed.id} className={`p-3 rounded-lg border text-center transition-all ${s.border}`}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] font-mono text-slate-400">#{bed.id}</span>
                    <span className={`text-[9px] font-mono font-bold uppercase px-1.5 py-0.5 rounded ${s.badge}`}>
                      {bed.state === "to_clean" ? "needs cleaning" : bed.state}
                    </span>
                  </div>
                  <Bed className={`w-6 h-6 mx-auto mb-1 ${s.icon}`} />
                  <div className="font-bold text-xs truncate">{bed.name}</div>
                  <div className="text-[10px] text-slate-500 truncate mt-0.5">{bed.wardName}</div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Active Inpatients Table */}
      <div className="bg-white rounded-xl border border-slate-200/90 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-bold text-slate-900">Hospitalized Patient Directory</h2>
            <p className="text-xs text-slate-500">Currently admitted patients receiving active inpatient clinical care.</p>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search admitted patients..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-[#0F766E]"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 border-b border-slate-200/80 text-[11px] font-mono font-bold text-slate-500 uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Adm #</th>
                <th className="py-3 px-4">Patient Name</th>
                <th className="py-3 px-4">Bed & Unit</th>
                <th className="py-3 px-4">Admission Date</th>
                <th className="py-3 px-4">Attending Doctor</th>
                <th className="py-3 px-4">Care Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredAdmissions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-xs text-slate-400">
                    No active inpatient admissions found matching search.
                  </td>
                </tr>
              ) : (
                filteredAdmissions.map((adm) => (
                  <tr key={adm.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4 font-mono font-semibold text-[#0F766E]">
                      {adm.registrationNumber}
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-900">
                      {adm.patientName}
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-semibold text-slate-800">{adm.bedName}</span>
                    </td>
                    <td className="py-3 px-4 font-mono text-[11px]">
                      {adm.hospitalizationDate ? adm.hospitalizationDate.slice(0, 16) : "—"}
                    </td>
                    <td className="py-3 px-4">{adm.attendingPhysician}</td>
                    <td className="py-3 px-4">
                      <span
                        className={`text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded border ${
                          adm.state === "hospitalized"
                            ? "bg-blue-50 text-blue-700 border-blue-200"
                            : adm.state === "done"
                            ? "bg-amber-50 text-amber-700 border-amber-200"
                            : "bg-emerald-50 text-emerald-700 border-emerald-200"
                        }`}
                      >
                        {adm.state === "done" ? "discharged - needs cleaning" : adm.state}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      {adm.state === "hospitalized" && (
                        <button
                          onClick={() => {
                            setTargetAdmission(adm);
                            setDischargeReason("home");
                            setDischargePlan("");
                            setAdmissionReason(null);
                            setAdmissionReasonQuery("");
                            setDischargeDx(null);
                            setDischargeDxQuery("");
                            setErrorMessage(null);
                            setIsDischargeModalOpen(true);
                          }}
                          className="text-xs text-red-600 hover:text-red-700 font-semibold hover:underline"
                        >
                          Discharge Patient
                        </button>
                      )}
                      {adm.state === "done" && (
                        <button
                          onClick={() => handleBedClean(adm)}
                          className="text-xs text-[#0F766E] hover:text-[#0d5f58] font-semibold hover:underline"
                        >
                          Mark Bed Cleaned
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Admit Patient Modal */}
      <Modal
        isOpen={isAdmitModalOpen}
        onClose={() => setIsAdmitModalOpen(false)}
        title="Admit Patient to Inpatient Ward"
        size="lg"
      >
        <form onSubmit={handleAdmit} className="space-y-4">
          {errorMessage && (
            <div className="p-3 rounded-lg bg-red-50 text-xs text-red-700">{errorMessage}</div>
          )}
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1.5">Patient *</label>
            {patientsList.length === 0 ? (
              <p className="text-xs text-red-600">No patients found in this tenant.</p>
            ) : (
              <select
                value={selectedPatientId}
                onChange={(e) => setSelectedPatientId(e.target.value)}
                required
                className="w-full h-10 px-3 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-[#0F766E]"
              >
                <option value="">Select a patient...</option>
                {patientsList.map((p) => (
                  <option key={p.id} value={p.id}>{p.name} (PUID: {p.puid})</option>
                ))}
              </select>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1.5">Assign Bed</label>
              <select
                value={selectedBedId}
                onChange={(e) => setSelectedBedId(e.target.value)}
                className="w-full h-10 px-3 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-[#0F766E]"
              >
                <option value="">Select an available bed...</option>
                {beds
                  .filter((b) => b.state === "free")
                  .map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name} ({b.wardName})
                    </option>
                  ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1.5">Admission Type</label>
              <select
                value={admissionType}
                onChange={(e) => setAdmissionType(e.target.value)}
                className="w-full h-10 px-3 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-[#0F766E]"
              >
                <option value="routine">Routine / Elective</option>
                <option value="emergency">Emergency Intake</option>
                <option value="urgent">Urgent Transfer</option>
              </select>
            </div>
          </div>

          <Input
            label="Expected Discharge Date *"
            type="date"
            value={expectedDischargeDate}
            onChange={(e) => setExpectedDischargeDate(e.target.value)}
            required
            helperText="Used for bed/capacity planning; updated with the actual date at discharge."
          />

          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1.5">Nursing Observation Plan</label>
            <textarea
              value={nursingPlan}
              onChange={(e) => setNursingPlan(e.target.value)}
              placeholder="e.g. Q4H vitals, continuous cardiac telemetry, regular diabetic diet."
              rows={3}
              className="w-full p-2.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-[#0F766E]"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
            <Button variant="outline" size="sm" onClick={() => setIsAdmitModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" type="submit" isLoading={isSubmitting}>
              Confirm Admission
            </Button>
          </div>
        </form>
      </Modal>

      {/* Discharge Patient Modal */}
      <Modal
        isOpen={isDischargeModalOpen}
        onClose={() => setIsDischargeModalOpen(false)}
        title="Discharge Patient & Close Inpatient Record"
        size="md"
      >
        <form onSubmit={handleDischarge} className="space-y-4">
          {errorMessage && (
            <div className="p-3 rounded-lg bg-red-50 text-xs text-red-700">{errorMessage}</div>
          )}
          <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs">
            <div className="font-semibold text-slate-800">
              {targetAdmission?.patientName} (Adm: {targetAdmission?.registrationNumber})
            </div>
            <div className="text-slate-500 mt-0.5">Assigned Bed: {targetAdmission?.bedName}</div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1.5">Discharge Outcome / Reason</label>
            <select
              value={dischargeReason}
              onChange={(e) => setDischargeReason(e.target.value)}
              className="w-full h-10 px-3 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-[#0F766E]"
            >
              <option value="home">Home / Selfcare</option>
              <option value="transfer">Transferred to another institution</option>
              <option value="against_advice">Left against medical advice</option>
              <option value="death">Death</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1.5">Reason for Admission (ICD-10) *</label>
            {admissionReason ? (
              <div className="flex items-center justify-between p-2.5 bg-teal-50 border border-teal-200 rounded-lg text-xs">
                <span><span className="font-mono font-bold text-[#0F766E]">{admissionReason.code}</span> — {admissionReason.name}</span>
                <button type="button" onClick={() => { setAdmissionReason(null); setAdmissionReasonQuery(""); }} className="text-slate-400 hover:text-slate-600">✕</button>
              </div>
            ) : (
              <div className="relative">
                <input
                  type="text"
                  value={admissionReasonQuery}
                  onChange={(e) => setAdmissionReasonQuery(e.target.value)}
                  placeholder="Search ICD-10 code or name (e.g. J06.9, pneumonia)..."
                  className="w-full h-10 px-3 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-[#0F766E]"
                />
                {admissionReasonResults.length > 0 && (
                  <div className="absolute z-10 mt-1 w-full max-h-40 overflow-y-auto bg-white border border-slate-200 rounded-lg shadow-lg">
                    {admissionReasonResults.map((p) => p && (
                      <button
                        type="button"
                        key={p.id}
                        onClick={() => { setAdmissionReason(p); setAdmissionReasonResults([]); }}
                        className="w-full text-left px-3 py-2 text-xs hover:bg-teal-50 border-b border-slate-100 last:border-0"
                      >
                        <span className="font-mono font-bold text-[#0F766E]">{p.code}</span> — {p.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1.5">Discharge Diagnosis (ICD-10) *</label>
            {dischargeDx ? (
              <div className="flex items-center justify-between p-2.5 bg-teal-50 border border-teal-200 rounded-lg text-xs">
                <span><span className="font-mono font-bold text-[#0F766E]">{dischargeDx.code}</span> — {dischargeDx.name}</span>
                <button type="button" onClick={() => { setDischargeDx(null); setDischargeDxQuery(""); }} className="text-slate-400 hover:text-slate-600">✕</button>
              </div>
            ) : (
              <div className="relative">
                <input
                  type="text"
                  value={dischargeDxQuery}
                  onChange={(e) => setDischargeDxQuery(e.target.value)}
                  placeholder="Search ICD-10 code or name..."
                  className="w-full h-10 px-3 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-[#0F766E]"
                />
                {dischargeDxResults.length > 0 && (
                  <div className="absolute z-10 mt-1 w-full max-h-40 overflow-y-auto bg-white border border-slate-200 rounded-lg shadow-lg">
                    {dischargeDxResults.map((p) => p && (
                      <button
                        type="button"
                        key={p.id}
                        onClick={() => { setDischargeDx(p); setDischargeDxResults([]); }}
                        className="w-full text-left px-3 py-2 text-xs hover:bg-teal-50 border-b border-slate-100 last:border-0"
                      >
                        <span className="font-mono font-bold text-[#0F766E]">{p.code}</span> — {p.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1.5">Discharge Instructions & Follow-up</label>
            <textarea
              value={dischargePlan}
              onChange={(e) => setDischargePlan(e.target.value)}
              placeholder="e.g. Take prescribed oral antibiotics for 7 days. Return to Outpatient Clinic in 2 weeks."
              rows={3}
              required
              className="w-full p-2.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-[#0F766E]"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
            <Button variant="outline" size="sm" onClick={() => setIsDischargeModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="danger" size="sm" type="submit" isLoading={isSubmitting}>
              Complete Discharge
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
