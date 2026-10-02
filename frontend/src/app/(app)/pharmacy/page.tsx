"use client";

import React, { useState, useEffect } from "react";
import {
  Pill,
  CheckCircle2,
  Clock,
  Search,
  Filter,
  AlertTriangle,
  FileCheck,
  ShieldCheck,
  Package,
  Layers,
  ArrowRight,
  Activity,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";

interface Prescription {
  id: number;
  orderNumber: string;
  patientId: number;
  patientName: string;
  prescribingDoctor: string;
  prescriptionDate: string;
  state: string;
  notes: string;
  medicines?: string[];
}

interface Medicament {
  id: number;
  activeComponent: string;
  dosage: string;
  presentation: string;
  indications: string;
  isVaccine: boolean;
  pregnancyWarning: boolean;
}

interface PharmacyStats {
  totalOrders: number;
  pendingDispensation: number;
  dispensed: number;
  formularyCount: number;
}

export default function PharmacyPage() {
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [medicaments, setMedicaments] = useState<Medicament[]>([]);
  const [stats, setStats] = useState<PharmacyStats>({
    totalOrders: 0,
    pendingDispensation: 0,
    dispensed: 0,
    formularyCount: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [accessError, setAccessError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"queue" | "formulary">("queue");
  const [searchQuery, setSearchQuery] = useState("");

  // Dispense Modal
  const [isDispenseModalOpen, setIsDispenseModalOpen] = useState(false);
  const [targetRx, setTargetRx] = useState<Prescription | null>(null);
  const [pharmacistNotes, setPharmacistNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [dispenseNotice, setDispenseNotice] = useState<{ ok: boolean; text: string } | null>(null);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/clinical/pharmacy");
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setAccessError(null);
        setPrescriptions(data.prescriptions || []);
        setMedicaments(data.medicaments || []);
        if (data.stats) setStats(data.stats);
      } else {
        // A blocked request used to fail silently here, leaving an empty "no prescriptions
        // found" dashboard that looked identical to a genuinely empty queue -- indistinguishable
        // from "you don't have permission to see this".
        setAccessError(data.error || `Unable to load pharmacy data (HTTP ${res.status}).`);
        setPrescriptions([]);
        setMedicaments([]);
      }
    } catch (e) {
      console.error("Failed to load pharmacy data:", e);
      setAccessError("Unable to load pharmacy data. Check your connection and try again.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleDispense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetRx) return;

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/clinical/pharmacy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prescriptionId: targetRx.id,
          verificationNotes: pharmacistNotes,
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setDispenseNotice({ ok: true, text: `${targetRx.orderNumber}: ${data.message || "Dispensed."}` });
        setIsDispenseModalOpen(false);
        setTargetRx(null);
        setPharmacistNotes("");
        fetchData();
      } else {
        // Stays open so the pharmacist can read the reason (for example a stock shortage) next to the prescription.
        setDispenseNotice({ ok: false, text: data.error || "The prescription could not be dispensed." });
        setIsDispenseModalOpen(false);
      }
    } catch (e) {
      console.error("Dispense failed:", e);
      setDispenseNotice({ ok: false, text: "The prescription could not be dispensed. Check the connection and try again." });
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredPrescriptions = prescriptions.filter((rx) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      rx.orderNumber.toLowerCase().includes(q) ||
      (rx.patientName || "").toLowerCase().includes(q) ||
      (rx.prescribingDoctor || "").toLowerCase().includes(q)
    );
  });

  const filteredMedicaments = medicaments.filter((m) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      m.activeComponent.toLowerCase().includes(q) ||
      (m.indications || "").toLowerCase().includes(q) ||
      (m.presentation || "").toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200/80 pb-5">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono font-semibold text-[#0F766E] uppercase tracking-wider mb-1">
            <Pill className="w-3.5 h-3.5" />
            <span>Hospital Pharmacy Services / Electronic Dispensing</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 font-display">
            Pharmacy Dispensing & Formulary
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Electronic prescription fulfillment, pharmacist verification, drug interactions, and hospital medication inventory.
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
            Refresh Orders
          </Button>
        </div>
      </div>

      {dispenseNotice && (
        <div className={`p-4 rounded-xl border text-xs font-medium flex items-center justify-between gap-3 ${dispenseNotice.ok ? "bg-emerald-50 border-emerald-200 text-emerald-900" : "bg-red-50 border-red-200 text-red-800"}`}>
          <span>{dispenseNotice.text}</span>
          <button type="button" onClick={() => setDispenseNotice(null)} className="text-[11px] underline">Dismiss</button>
        </div>
      )}

      {accessError && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-xs text-red-800 flex items-center gap-2 font-medium">
          <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
          <span>{accessError}</span>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4.5 rounded-xl border border-slate-200/90 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-[11px] font-mono font-bold uppercase tracking-wider">Pending Orders</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-semibold text-amber-600 font-mono">{stats.pendingDispensation}</div>
          <div className="text-[11px] text-amber-600/80 font-medium mt-1">Awaiting pharmacist verification</div>
        </div>

        <div className="bg-white p-4.5 rounded-xl border border-slate-200/90 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-[11px] font-mono font-bold uppercase tracking-wider">Dispensed Today</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-semibold text-emerald-600 font-mono">{stats.dispensed}</div>
          <div className="text-[11px] text-emerald-600/80 font-medium mt-1">Medications handed to patients</div>
        </div>

        <div className="bg-white p-4.5 rounded-xl border border-slate-200/90 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-[11px] font-mono font-bold uppercase tracking-wider">Total Rx Orders</span>
            <FileCheck className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-2xl font-semibold text-blue-600 font-mono">{stats.totalOrders}</div>
          <div className="text-[11px] text-blue-600/80 font-medium mt-1">All clinical prescriptions</div>
        </div>

        <div className="bg-white p-4.5 rounded-xl border border-slate-200/90 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-[11px] font-mono font-bold uppercase tracking-wider">Hospital Formulary</span>
            <Package className="w-4 h-4 text-teal-600" />
          </div>
          <div className="text-2xl font-semibold text-teal-700 font-mono">{stats.formularyCount}</div>
          <div className="text-[11px] text-slate-400 mt-1">Active pharmaceutical items</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200">
        <button
          onClick={() => setActiveTab("queue")}
          className={`px-4 py-2 text-xs font-semibold border-b-2 transition-all cursor-pointer ${
            activeTab === "queue"
              ? "border-[#0F766E] text-[#0F766E]"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          Prescription Fulfillment Queue ({prescriptions.length})
        </button>
        <button
          onClick={() => setActiveTab("formulary")}
          className={`px-4 py-2 text-xs font-semibold border-b-2 transition-all cursor-pointer ${
            activeTab === "formulary"
              ? "border-[#0F766E] text-[#0F766E]"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          Hospital Formulary Catalog ({medicaments.length})
        </button>
      </div>

      {/* Tab 1: Prescription Queue */}
      {activeTab === "queue" && (
        <div className="bg-white rounded-xl border border-slate-200/90 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Physician Prescription Queue</h2>
              <p className="text-xs text-slate-500">Live electronic orders submitted from Outpatient Consultations.</p>
            </div>

            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search orders or patients..."
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
                  <th className="py-3 px-4">Rx Number</th>
                  <th className="py-3 px-4">Patient Name</th>
                  <th className="py-3 px-4">Prescribed By</th>
                  <th className="py-3 px-4">Date & Time</th>
                  <th className="py-3 px-4">Dosage Protocol</th>
                  <th className="py-3 px-4">Fulfillment Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredPrescriptions.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-xs text-slate-400">
                      No prescriptions found. Prescriptions ordered in Physician Cockpit will appear here.
                    </td>
                  </tr>
                ) : (
                  filteredPrescriptions.map((rx) => (
                    <tr key={rx.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-4 font-mono font-semibold text-[#0F766E]">{rx.orderNumber}</td>
                      <td className="py-3 px-4 font-semibold text-slate-900">{rx.patientName}</td>
                      <td className="py-3 px-4">{rx.prescribingDoctor}</td>
                      <td className="py-3 px-4 font-mono text-[11px]">
                        {rx.prescriptionDate ? rx.prescriptionDate.slice(0, 16) : "—"}
                      </td>
                      <td className="py-3 px-4 text-slate-700">
                        {rx.medicines?.length ? rx.medicines.map((m) => <div key={m}>{m}</div>) : null}
                        {rx.notes && <div className={rx.medicines?.length ? "text-slate-400" : ""}>{rx.notes}</div>}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded ${
                            rx.state === "done"
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : "bg-amber-50 text-amber-700 border border-amber-200"
                          }`}
                        >
                          {rx.state === "done" ? "Dispensed" : "Pending Verification"}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        {rx.state !== "done" && (
                          <button
                            onClick={() => {
                              setTargetRx(rx);
                              setIsDispenseModalOpen(true);
                            }}
                            className="text-xs text-[#0F766E] hover:text-[#0D655E] font-semibold hover:underline"
                          >
                            Verify & Dispense
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
      )}

      {/* Tab 2: Formulary Catalog */}
      {activeTab === "formulary" && (
        <div className="bg-white rounded-xl border border-slate-200/90 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Hospital Pharmaceutical Formulary</h2>
              <p className="text-xs text-slate-500">Official catalog of approved medicaments, dosage forms, and clinical precautions.</p>
            </div>

            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search medicament formulary..."
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
                  <th className="py-3 px-4">Item #</th>
                  <th className="py-3 px-4">Active Component</th>
                  <th className="py-3 px-4">Dosage / Strength</th>
                  <th className="py-3 px-4">Presentation Form</th>
                  <th className="py-3 px-4">Clinical Indications</th>
                  <th className="py-3 px-4">Safety Flags</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredMedicaments.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-xs text-slate-400">
                      No medicaments found in hospital catalog.
                    </td>
                  </tr>
                ) : (
                  filteredMedicaments.map((m) => (
                    <tr key={m.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-4 font-mono font-semibold text-slate-400">#{m.id}</td>
                      <td className="py-3 px-4 font-semibold text-slate-900">{m.activeComponent}</td>
                      <td className="py-3 px-4 font-mono text-slate-700">{m.dosage}</td>
                      <td className="py-3 px-4 text-slate-600">{m.presentation}</td>
                      <td className="py-3 px-4 text-slate-500 max-w-xs truncate">{m.indications}</td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5">
                          {m.pregnancyWarning && (
                            <span className="text-[10px] bg-red-50 text-red-700 border border-red-200 px-1.5 py-0.5 rounded font-medium flex items-center gap-1">
                              <AlertTriangle className="w-3 h-3" />
                              Pregnancy Warning
                            </span>
                          )}
                          {m.isVaccine && (
                            <span className="text-[10px] bg-blue-50 text-blue-700 border border-blue-200 px-1.5 py-0.5 rounded font-medium">
                              Vaccine
                            </span>
                          )}
                          {!m.pregnancyWarning && !m.isVaccine && (
                            <span className="text-[10px] text-slate-400 font-mono">Standard Rx</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Dispense Medication Modal */}
      <Modal
        isOpen={isDispenseModalOpen}
        onClose={() => setIsDispenseModalOpen(false)}
        title="Verify & Dispense Clinical Prescription"
        size="md"
      >
        <form onSubmit={handleDispense} className="space-y-4">
          <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200 text-xs">
            <div className="flex items-center justify-between mb-1">
              <span className="font-bold text-slate-900">{targetRx?.orderNumber}</span>
              <span className="font-mono text-slate-400">{targetRx?.prescriptionDate?.slice(0, 16)}</span>
            </div>
            <div className="font-semibold text-[#0F766E]">{targetRx?.patientName}</div>
            <div className="text-slate-500 mt-1">Prescribed by: {targetRx?.prescribingDoctor}</div>
            <div className="text-slate-700 mt-2 p-2 bg-white rounded border border-slate-200 font-mono text-[11px]">
              {targetRx?.medicines?.length ? targetRx.medicines.map((m) => <div key={m}>{m}</div>) : null}
              {targetRx?.notes}
              {!targetRx?.medicines?.length && !targetRx?.notes && "No medicine lines were returned for this prescription."}
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1.5">Pharmacist Dispensation Notes</label>
            <textarea
              value={pharmacistNotes}
              onChange={(e) => setPharmacistNotes(e.target.value)}
              placeholder="e.g. Verified patient allergies, checked batch expiration, instructed patient on post-prandial administration."
              rows={3}
              className="w-full p-2.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-[#0F766E]"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
            <Button variant="outline" size="sm" onClick={() => setIsDispenseModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" type="submit" isLoading={isSubmitting}>
              Confirm Dispense & Sign Off
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
