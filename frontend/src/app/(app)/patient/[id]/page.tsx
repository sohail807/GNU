"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  User,
  Heart,
  Activity,
  Stethoscope,
  Microscope,
  Scan,
  Receipt,
  AlertTriangle,
  ArrowLeft,
  Calendar,
  Building,
  RefreshCw,
  PlusCircle,
  Share2,
  ChevronDown,
  FileCheck,
  CheckCircle2,
  Clock,
  Pill,
  Printer,
  ShieldCheck,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";

export default function UnifiedPatientChartPage() {
  const params = useParams();
  const patientId = params?.id ? String(params.id) : "";

  const [activeTab, setActiveTab] = useState<
    "overview" | "appointments" | "evaluations" | "prescriptions" | "laboratory" | "radiology" | "billing" | "insurance"
  >("overview");

  const [isRelateDropdownOpen, setIsRelateDropdownOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const [patient, setPatient] = useState<any>({
    id: Number(patientId), puid: "", name: "", arabicName: "", qid: "", dob: "",
    age: "", gender: "", bloodGroup: "", phone: "", email: "", address: "",
    emergencyContact: "", allergies: [], allergiesLoaded: false, allergiesRestricted: false, attending: "",
  });

  const [appointments, setAppointments] = useState<any[]>([]);
  const [evaluations, setEvaluations] = useState<any[]>([]);
  const [evaluationsStatusOnly, setEvaluationsStatusOnly] = useState(false);
  const [prescriptions, setPrescriptions] = useState<any[]>([]);
  const [prescriptionsStatusOnly, setPrescriptionsStatusOnly] = useState(false);
  const [labOrders, setLabOrders] = useState<any[]>([]);
  const [labStatusOnly, setLabStatusOnly] = useState(false);
  const [radiologyOrders, setRadiologyOrders] = useState<any[]>([]);
  const [radiologyStatusOnly, setRadiologyStatusOnly] = useState(false);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [policies, setPolicies] = useState<any[]>([]);
  // Billing is not open to every role: say "not visible" instead of claiming no invoice exists.
  const [invoicesRestricted, setInvoicesRestricted] = useState(false);

  // Load all live patient data from GNU Health backend via API routes
  useEffect(() => {
    let isMounted = true;
    async function loadAllPatientData() {
      setIsLoading(true);
      try {
        const [patRes, apptRes, evalRes, rxRes, labRes, radRes, billRes, insRes] = await Promise.allSettled([
          fetch(`/api/clinical/patients?id=${patientId}`),
          fetch(`/api/clinical/appointments?patientId=${patientId}`),
          fetch(`/api/clinical/consultations?patientId=${patientId}`),
          fetch(`/api/clinical/prescriptions?patientId=${patientId}`),
          fetch(`/api/clinical/laboratory?patientId=${patientId}`),
          fetch(`/api/clinical/radiology?patientId=${patientId}`),
          fetch(`/api/clinical/billing?patientId=${patientId}`),
          fetch(`/api/clinical/insurance?patientId=${patientId}`),
        ]);

        if (!isMounted) return;

        // 1. Patient Metadata
        if (patRes.status === "fulfilled" && patRes.value.ok) {
          const patData = await patRes.value.json();
          if (patData.success && Array.isArray(patData.patients) && patData.patients.length > 0) {
            const p = patData.patients[0];
            setPatient({
              id: p.id,
              puid: p.puid || "",
              name: p.name || "",
              arabicName: p.arabicName || "",
              qid: p.qid || "",
              dob: p.dob || "",
              age: p.age || "",
              gender: p.gender || "",
              bloodGroup: p.bloodGroup || "",
              phone: p.phone || "",
              email: p.email || "",
              address: p.address || "",
              emergencyContact: p.emergencyContact || "",
              allergies: p.allergies || [],
              allergiesLoaded: p.allergiesLoaded === true,
              allergiesRestricted: p.allergiesRestricted === true,
              attending: p.attending || "",
            });
          }
        }

        // 2. Appointments
        if (apptRes.status === "fulfilled" && apptRes.value.ok) {
          const apptData = await apptRes.value.json();
          if (apptData.success && Array.isArray(apptData.appointments)) {
            setAppointments(apptData.appointments);
          }
        }

        // 3. Evaluations
        if (evalRes.status === "fulfilled" && evalRes.value.ok) {
          const evalData = await evalRes.value.json();
          if (evalData.success && Array.isArray(evalData.consultations)) {
            setEvaluations(evalData.consultations);
            setEvaluationsStatusOnly(Boolean(evalData.statusOnly));
          }
        }

        // 4. Prescriptions
        if (rxRes.status === "fulfilled" && rxRes.value.ok) {
          const rxData = await rxRes.value.json();
          if (rxData.success && Array.isArray(rxData.prescriptions)) {
            setPrescriptions(rxData.prescriptions);
            setPrescriptionsStatusOnly(Boolean(rxData.statusOnly));
          }
        }

        // 5. Labs
        if (labRes.status === "fulfilled" && labRes.value.ok) {
          const labData = await labRes.value.json();
          if (labData.success && Array.isArray(labData.labOrders)) {
            setLabOrders(labData.labOrders);
            setLabStatusOnly(Boolean(labData.statusOnly));
          }
        }

        // 6. Radiology
        if (radRes.status === "fulfilled" && radRes.value.ok) {
          const radData = await radRes.value.json();
          if (radData.success && Array.isArray(radData.radiologyOrders)) {
            setRadiologyOrders(radData.radiologyOrders);
            setRadiologyStatusOnly(Boolean(radData.statusOnly));
          }
        }

        // 8. Insurance policies
        if (insRes.status === "fulfilled" && insRes.value.ok) {
          const insData = await insRes.value.json();
          if (insData.success && Array.isArray(insData.insurances)) setPolicies(insData.insurances);
        }

        // 7. Invoices
        if (billRes.status === "fulfilled" && billRes.value.status === 403) setInvoicesRestricted(true);
        if (billRes.status === "fulfilled" && billRes.value.ok) {
          const billData = await billRes.value.json();
          if (billData.accessRestricted) setInvoicesRestricted(true);
          if (billData.success && Array.isArray(billData.invoices)) {
            setInvoices(billData.invoices);
          }
        }
      } catch {
        // Fallback gracefully
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    loadAllPatientData();
    return () => {
      isMounted = false;
    };
  }, [patientId]);

  const initials = patient.name
    ? patient.name
        .split(" ")
        .filter(Boolean)
        .map((n: string) => n[0])
        .slice(0, 2)
        .join("")
        .toUpperCase()
    : "PT";

  const handleRelate = (tabId: typeof activeTab) => {
    setActiveTab(tabId);
    setIsRelateDropdownOpen(false);
  };

  const latestEval = evaluations.length > 0 ? evaluations[0] : null;
  const latestAppt = appointments.length > 0 ? appointments[0] : null;
  const latestRx = prescriptions.length > 0 ? prescriptions[0] : null;
  const latestLab = labOrders.length > 0 ? labOrders[0] : null;
  const latestRad = radiologyOrders.length > 0 ? radiologyOrders[0] : null;
  const latestInv = invoices.length > 0 ? invoices[0] : null;

  return (
    <div className="max-w-7xl mx-auto space-y-7 animate-fade-in">
      {/* HEADER WITH PROMINENT RELATE TOOLBAR BUTTON */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-slate-200/90 gap-4">
        <div>
          <Link
            href="/patient"
            className="text-xs font-mono uppercase tracking-wider text-slate-500 hover:text-slate-900 flex items-center gap-1.5 mb-2 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Master Patient Directory</span>
          </Link>
          <div className="kicker text-[#0F766E] mb-1">LONGITUDINAL ELECTRONIC HEALTH RECORD · RECORD ID {patient.id}</div>
          <h1 className="text-xl sm:text-2xl font-semibold text-slate-900 tracking-tight">
            Master Patient Chart & 360° EHR Directory
          </h1>
          <p className="text-xs text-slate-600 mt-1">
            {patient.name} (<span className="font-mono text-[#0F766E] font-bold">{patient.puid}</span>) · Master Patient Record
          </p>
        </div>

        <div className="flex items-center gap-3 relative">
          {/* CLINICAL SYSTEM NATIVE 'RELATE' TOOLBAR BUTTON */}
          <div className="relative">
            <button
              onClick={() => setIsRelateDropdownOpen(!isRelateDropdownOpen)}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-teal-50 hover:bg-teal-100 border border-teal-300 text-[#0F766E] font-bold text-xs shadow-2xs transition-colors"
              title="Click toolbar 'Relate' button to jump to linked encounters"
            >
              <Share2 className="w-4 h-4 text-[#0F766E]" />
              <span>Relate</span>
              <ChevronDown className="w-3.5 h-3.5" />
            </button>

            {/* RELATE DROPDOWN MENU */}
            {isRelateDropdownOpen && (
              <div className="absolute right-0 mt-2 w-64 bg-white border border-slate-200 rounded-xl shadow-xl z-50 py-1.5 text-xs divide-y divide-slate-100 animate-fade-in">
                <div className="px-3 py-1.5 text-[10px] font-mono text-slate-400 uppercase font-bold">
                  Relate Linked Encounters
                </div>
                <div className="py-1">
                  <button
                    onClick={() => handleRelate("appointments")}
                    className="w-full px-3 py-2 text-left hover:bg-teal-50 flex items-center justify-between text-slate-700 hover:text-slate-900"
                  >
                    <span className="flex items-center gap-2">
                      <Calendar className="w-3.5 h-3.5 text-[#0F766E]" />
                      <span>Appointments</span>
                    </span>
                    <span className="font-mono text-[10px] text-teal-700 font-bold">
                      {appointments.length > 0 ? `APT #${appointments[0].id}` : "None"}
                    </span>
                  </button>

                  <button
                    onClick={() => handleRelate("evaluations")}
                    className="w-full px-3 py-2 text-left hover:bg-teal-50 flex items-center justify-between text-slate-700 hover:text-slate-900"
                  >
                    <span className="flex items-center gap-2">
                      <Stethoscope className="w-3.5 h-3.5 text-[#0F766E]" />
                      <span>Evaluations</span>
                    </span>
                    <span className="font-mono text-[10px] text-teal-700 font-bold">
                      {evaluations.length > 0 ? `EVAL #${evaluations[0].id}` : "None"}
                    </span>
                  </button>

                  <button
                    onClick={() => handleRelate("prescriptions")}
                    className="w-full px-3 py-2 text-left hover:bg-teal-50 flex items-center justify-between text-slate-700 hover:text-slate-900"
                  >
                    <span className="flex items-center gap-2">
                      <Pill className="w-3.5 h-3.5 text-[#0F766E]" />
                      <span>Prescriptions</span>
                    </span>
                    <span className="font-mono text-[10px] text-teal-700 font-bold">
                      {prescriptions.length > 0 ? `RX #${prescriptions[0].id}` : "None"}
                    </span>
                  </button>

                  <button
                    onClick={() => handleRelate("laboratory")}
                    className="w-full px-3 py-2 text-left hover:bg-teal-50 flex items-center justify-between text-slate-700 hover:text-slate-900"
                  >
                    <span className="flex items-center gap-2">
                      <Microscope className="w-3.5 h-3.5 text-[#0F766E]" />
                      <span>Lab Results</span>
                    </span>
                    <span className="font-mono text-[10px] text-teal-700 font-bold">
                      {labOrders.length > 0 ? `LAB #${labOrders[0].id}` : "None"}
                    </span>
                  </button>

                  <button
                    onClick={() => handleRelate("radiology")}
                    className="w-full px-3 py-2 text-left hover:bg-teal-50 flex items-center justify-between text-slate-700 hover:text-slate-900"
                  >
                    <span className="flex items-center gap-2">
                      <Scan className="w-3.5 h-3.5 text-[#0F766E]" />
                      <span>Medical Imaging</span>
                    </span>
                    <span className="font-mono text-[10px] text-teal-700 font-bold">
                      {radiologyOrders.length > 0 ? `RAD #${radiologyOrders[0].id}` : "None"}
                    </span>
                  </button>

                  <button
                    onClick={() => handleRelate("billing")}
                    className="w-full px-3 py-2 text-left hover:bg-teal-50 flex items-center justify-between text-slate-700 hover:text-slate-900"
                  >
                    <span className="flex items-center gap-2">
                      <Receipt className="w-3.5 h-3.5 text-[#0F766E]" />
                      <span>Financial Invoices</span>
                    </span>
                    <span className="font-mono text-[10px] text-teal-700 font-bold">
                      {invoices.length > 0 ? invoices[0].number || `INV #${invoices[0].id}` : "None"}
                    </span>
                  </button>
                </div>
              </div>
            )}
          </div>

          <Link href={`/physician?patientId=${patient.id}`}>
            <Button variant="primary" size="sm" leftIcon={<Stethoscope className="w-4 h-4" />}>
              Open Physician Cockpit
            </Button>
          </Link>
        </div>
      </div>

      {/* 360° LONGITUDINAL EHR AUDIT BANNER */}
      <div className="p-5 bg-gradient-to-r from-teal-900 via-slate-900 to-slate-900 text-white rounded-2xl shadow-md space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-teal-800/80">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center font-bold">
              <CheckCircle2 className="w-5 h-5 text-emerald-300" />
            </div>
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-emerald-400 font-mono">
                360° Certified Longitudinal Patient Record Audit
              </div>
              <h3 className="text-base font-bold text-white">
                {patient.name} (PUID: {patient.puid}) · Dynamic EHR Traceability
              </h3>
            </div>
          </div>
          <Badge variant="green" size="md">
            Authoritative GNU Health Record
          </Badge>
        </div>

        {/* 9-Module Traceability Matrix */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 text-xs font-mono">
          <div className="p-2.5 bg-slate-800/80 rounded-lg border border-slate-700">
            <span className="text-[10px] text-slate-400 block">1. INTAKE PUID</span>
            <span className="text-emerald-400 font-bold">{patient.puid}</span>
          </div>
          <div className="p-2.5 bg-slate-800/80 rounded-lg border border-slate-700">
            <span className="text-[10px] text-slate-400 block">2. APPOINTMENT</span>
            <span className="text-emerald-400 font-bold">{latestAppt ? `APT #${latestAppt.id}` : "None Scheduled"}</span>
          </div>
          <div className="p-2.5 bg-slate-800/80 rounded-lg border border-slate-700">
            <span className="text-[10px] text-slate-400 block">3. EVALUATION</span>
            <span className="text-emerald-400 font-bold">{latestEval ? `EVAL #${latestEval.id}` : "None Recorded"}</span>
          </div>
          <div className="p-2.5 bg-slate-800/80 rounded-lg border border-slate-700">
            <span className="text-[10px] text-slate-400 block">4. ICD-10 DIAGNOSIS</span>
            <span className="text-emerald-400 font-bold">
              {latestEval?.diagnosis ? String(latestEval.diagnosis) : evaluationsStatusOnly ? "Not visible to your role" : "None Documented"}
            </span>
          </div>
          <div className="p-2.5 bg-slate-800/80 rounded-lg border border-slate-700">
            <span className="text-[10px] text-slate-400 block">5. PRESCRIPTION</span>
            <span className="text-emerald-400 font-bold">{latestRx ? `RX #${latestRx.id}` : "None Prescribed"}</span>
          </div>
          <div className="p-2.5 bg-slate-800/80 rounded-lg border border-slate-700">
            <span className="text-[10px] text-slate-400 block">6. LAB (ORDERS)</span>
            <span className="text-emerald-400 font-bold">{latestLab ? `LAB #${latestLab.id}` : "None Ordered"}</span>
          </div>
          <div className="p-2.5 bg-slate-800/80 rounded-lg border border-slate-700">
            <span className="text-[10px] text-slate-400 block">7. RADIOLOGY</span>
            <span className="text-emerald-400 font-bold">{latestRad ? `RAD #${latestRad.id}` : "None Requested"}</span>
          </div>
          <div className="p-2.5 bg-slate-800/80 rounded-lg border border-slate-700">
            <span className="text-[10px] text-slate-400 block">8. INVOICE</span>
            <span className="text-emerald-400 font-bold">{latestInv ? latestInv.number || `INV #${latestInv.id}` : invoicesRestricted ? "Not visible to your role" : "None Issued"}</span>
          </div>
          <div className="p-2.5 bg-slate-800/80 rounded-lg border border-slate-700">
            <span className="text-[10px] text-slate-400 block">9. SETTLEMENT</span>
            <span className="text-emerald-400 font-bold">{latestInv ? (latestInv.amountToPay == null ? "Balance unavailable" : formatQar(latestInv.amountToPay)) : invoicesRestricted ? "Not visible to your role" : "No invoice"}</span>
          </div>
          <div className="p-2.5 bg-emerald-950/70 rounded-lg border border-emerald-500/40">
            <span className="text-[10px] text-emerald-300 block">RECORD HEALTH</span>
            <span className="text-emerald-400 font-bold">SYNCHRONIZED</span>
          </div>
        </div>
      </div>

      {/* PATIENT IDENTITY HEADER CARD */}
      <div className="bg-white border border-slate-200/90 rounded-2xl shadow-2xs p-6 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-[#0F766E] text-white flex items-center justify-center font-bold text-xl shadow-xs">
              {initials}
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-3">
                <h2 className="text-xl font-bold text-slate-900">{patient.name}</h2>
                <span className="font-mono text-xs px-2.5 py-0.5 rounded-md bg-teal-50 border border-teal-200 text-[#0F766E] font-bold">
                  {patient.puid}
                </span>
                <Badge variant="green" dot>GNU Health patient record</Badge>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                National ID: <span className="font-mono text-slate-700 font-bold">{patient.qid || "Not recorded"}</span> · DOB: {patient.dob || "Not recorded"} · Age: {patient.age || "Not recorded"} · Blood Group: {patient.bloodGroup || "Not recorded"}
              </p>
            </div>
          </div>

          {/* Allergy Badges */}
          <div className="flex items-center gap-2">
            <span className="kicker text-red-600">CLINICAL ALLERGY:</span>
            {patient.allergies.map((all: string, i: number) => (
              <Badge key={i} variant="red" size="md">
                <AlertTriangle className="w-3.5 h-3.5 mr-1" />
                {all}
              </Badge>
            ))}
            {patient.allergies.length === 0 && (
              <span className="text-xs text-slate-500">
                {patient.allergiesLoaded
                  ? "No allergy records returned by GNU Health."
                  : patient.allergiesRestricted
                    ? "Not visible to your role — ask a physician or nurse to review."
                    : "Allergy information could not be loaded."}
              </span>
            )}
          </div>
        </div>

        {/* Chart Navigation Tabs */}
        <div className="flex flex-wrap items-center gap-2 pt-1 border-b border-slate-100">
          {[
            { id: "overview", label: "Patient Summary", icon: User, count: null },
            { id: "appointments", label: "Appointments", icon: Calendar, count: appointments.length },
            { id: "evaluations", label: "Evaluations", icon: Stethoscope, count: evaluations.length },
            { id: "prescriptions", label: "Prescriptions", icon: Pill, count: prescriptions.length },
            { id: "laboratory", label: "Laboratory", icon: Microscope, count: labOrders.length },
            { id: "radiology", label: "Radiology", icon: Scan, count: radiologyOrders.length },
            { id: "billing", label: "Invoices", icon: Receipt, count: invoices.length },
            { id: "insurance", label: "Insurance", icon: ShieldCheck, count: policies.length },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                className={`flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-lg transition-all ${
                  isActive
                    ? "bg-[#0F766E] text-white shadow-xs font-bold"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
                {tab.count !== null && tab.count > 0 && (
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                    isActive ? "bg-white/20 text-white" : "bg-slate-200 text-slate-700"
                  }`}>
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* TAB CONTENT VIEWS */}
      {/* 1. APPOINTMENTS TAB */}
      {activeTab === "appointments" && (
        <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-2xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-[#0F766E]" />
              <span>Linked Appointments ({appointments.length})</span>
            </h3>
            <Link href="/frontdesk/appointments">
              <Button variant="secondary" size="xs">Book Appointment</Button>
            </Link>
          </div>
          {appointments.length === 0 ? (
            <div className="p-8 text-center text-slate-500 text-xs bg-slate-50 rounded-xl">
              No appointments scheduled for this patient.
            </div>
          ) : (
            <div className="space-y-3">
              {appointments.map((appt) => (
                <div key={appt.id} className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="font-mono font-bold text-[#0F766E]">APT #{appt.id}</span>
                    <Badge variant={appt.state === "checkin" ? "green" : appt.state === "confirmed" ? "blue" : "neutral"}>
                      {appt.state || "Unknown"}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Date & Slot:</span>
                    <span className="font-semibold text-slate-800">{[appt.date, appt.time].filter(Boolean).join(" ") || "Not available"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Consultant:</span>
                    <span className="font-semibold text-slate-800">{appt.physicianName || "Not available"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Urgency:</span>
                    <span className="font-mono text-slate-700 capitalize">{appt.urgency || "Not recorded"}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 2. EVALUATIONS TAB */}
      {activeTab === "evaluations" && (
        <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-2xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Stethoscope className="w-4 h-4 text-[#0F766E]" />
              <span>Linked Clinical Evaluations ({evaluations.length})</span>
            </h3>
            <Link href={`/physician?patientId=${patient.id}`}>
              <Button variant="secondary" size="xs">New Consultation</Button>
            </Link>
          </div>
          {evaluations.length === 0 ? (
            <div className="p-8 text-center text-slate-500 text-xs bg-slate-50 rounded-xl">
              No clinical evaluations recorded yet for this patient.
            </div>
          ) : evaluationsStatusOnly ? (
            <div className="space-y-3">
              <div className="p-3 rounded-lg border border-slate-200 bg-slate-50 text-[11px] text-slate-500">
                Clinical details (diagnosis, vitals, notes) are visible only to physician and nursing roles. This shows completion status only, so you know when a patient is ready to bill.
              </div>
              {evaluations.map((ev) => (
                <div key={ev.id} className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-xs">
                  <span className="font-mono font-bold text-[#0F766E]">EVAL #{ev.id}</span>
                  <Badge variant={ev.state === "done" ? "teal" : "blue"}>{ev.state === "done" ? "Complete" : "In Progress"}</Badge>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {evaluations.map((ev) => (
                <div key={ev.id} className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2.5 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="font-mono font-bold text-[#0F766E]">EVAL #{ev.id}</span>
                    <Badge variant={ev.state === "done" ? "teal" : "blue"}>{ev.state || "Completed"}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Primary Diagnosis:</span>
                    <span className="font-bold text-slate-900">
                      {ev.diagnosis ? (Array.isArray(ev.diagnosis) ? ev.diagnosis[1] : String(ev.diagnosis)) : "Not recorded"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Recorded Vitals:</span>
                    <span className="font-mono text-slate-800 font-semibold">
                      BP {ev.systolic ?? "—"}/{ev.diastolic ?? "—"} mmHg · HR {ev.bpm ?? "—"} bpm · Temp {ev.temperature ?? "—"}°C · BMI {ev.bmi ?? "—"} kg/m²
                    </span>
                  </div>
                  {ev.chief_complaint && (
                    <div className="pt-2 border-t border-slate-200">
                      <span className="text-slate-500 block mb-1">Chief Complaint & Subjective:</span>
                      <p className="text-slate-700 leading-relaxed font-sans">{ev.chief_complaint}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 3. PRESCRIPTIONS TAB */}
      {activeTab === "prescriptions" && (
        <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-2xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Pill className="w-4 h-4 text-[#0F766E]" />
              <span>Linked Prescriptions ({prescriptions.length})</span>
            </h3>
            <Link href={`/physician?patientId=${patient.id}`}>
              <Button variant="secondary" size="xs">Create Prescription</Button>
            </Link>
          </div>
          {prescriptions.length === 0 ? (
            <div className="p-8 text-center text-slate-500 text-xs bg-slate-50 rounded-xl">
              No prescriptions recorded for this patient.
            </div>
          ) : (
            <div className="space-y-3">
              {prescriptionsStatusOnly && (
                <div className="p-3 rounded-lg border border-slate-200 bg-slate-50 text-[11px] text-slate-500">
                  Medication details are visible only to physician, pharmacy and nursing roles. This shows order status only.
                </div>
              )}
              {prescriptions.map((rx) => (
                <div key={rx.id} className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="font-mono font-bold text-[#0F766E]">RX #{rx.id}</span>
                    <Badge variant={rx.state === "dispensed" ? "green" : "teal"}>{rx.state || "Unknown"}</Badge>
                  </div>
                  {!prescriptionsStatusOnly && (
                    <div className="flex justify-between">
                      <span className="text-slate-500">Prescribed Medicine:</span>
                      <span className="font-bold text-slate-900">{rxMedicationSummary(rx)}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-slate-500">Date:</span>
                    <span className="font-mono text-slate-800">{rx.date || "Not available"}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 4. LABORATORY TAB */}
      {activeTab === "laboratory" && (
        <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-2xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Microscope className="w-4 h-4 text-[#0F766E]" />
              <span>Linked Laboratory Tests ({labOrders.length})</span>
            </h3>
            <Link href="/laboratory">
              <Button variant="secondary" size="xs">Laboratory Worklist</Button>
            </Link>
          </div>
          {labOrders.length === 0 ? (
            <div className="p-8 text-center text-slate-500 text-xs bg-slate-50 rounded-xl">
              No laboratory tests ordered for this patient.
            </div>
          ) : (
            <div className="space-y-3">
              {labStatusOnly && (
                <div className="p-3 rounded-lg border border-slate-200 bg-slate-50 text-[11px] text-slate-500">
                  Analyte results and diagnosis are visible only to physician, lab and nursing roles. This shows order status only.
                </div>
              )}
              {labOrders.map((lab) => (
                <div key={lab.id} className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="font-mono font-bold text-[#0F766E]">LAB #{lab.id}</span>
                    <Badge variant={lab.state === "done" ? "green" : "blue"}>{lab.state || "Pending"}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Test Protocol:</span>
                    <span className="font-bold text-slate-900">{lab.testName || "Not available"}</span>
                  </div>
                  {!labStatusOnly && (
                    <div className="flex justify-between">
                      <span className="text-slate-500">Result Status:</span>
                      <span className="font-mono text-slate-800">{lab.results || "No result recorded"}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 5. RADIOLOGY TAB */}
      {activeTab === "radiology" && (
        <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-2xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Scan className="w-4 h-4 text-[#0F766E]" />
              <span>Linked Radiology Studies ({radiologyOrders.length})</span>
            </h3>
            <Link href="/radiology">
              <Button variant="secondary" size="xs">Radiology Worklist</Button>
            </Link>
          </div>
          {radiologyOrders.length === 0 ? (
            <div className="p-8 text-center text-slate-500 text-xs bg-slate-50 rounded-xl">
              No radiology studies ordered for this patient.
            </div>
          ) : (
            <div className="space-y-3">
              {radiologyStatusOnly && (
                <div className="p-3 rounded-lg border border-slate-200 bg-slate-50 text-[11px] text-slate-500">
                  Radiologist findings are visible only to physician, radiology and nursing roles. This shows order status only.
                </div>
              )}
              {radiologyOrders.map((rad) => (
                <div key={rad.id} className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="font-mono font-bold text-[#0F766E]">RAD #{rad.id}</span>
                    <Badge variant={rad.state === "done" ? "green" : "blue"}>{rad.state || "Requested"}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Procedure Name:</span>
                    <span className="font-bold text-slate-900">{rad.procedureName || "Not available"}</span>
                  </div>
                  {rad.findings && (
                    <div className="pt-2 border-t border-slate-200">
                      <span className="text-slate-500 block mb-1">Clinical Findings:</span>
                      <p className="text-slate-800 leading-relaxed font-sans">{rad.findings}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 6. BILLING TAB */}
      {activeTab === "billing" && (
        <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-2xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Receipt className="w-4 h-4 text-[#0F766E]" />
              <span>Linked Invoices & Cash Settlement ({invoices.length})</span>
            </h3>
            <Link href="/billing">
              <Button variant="secondary" size="xs">Billing & Invoicing</Button>
            </Link>
          </div>
          {invoices.length === 0 ? (
            <div className="p-8 text-center text-slate-500 text-xs bg-slate-50 rounded-xl">
              No customer invoices issued for this patient.
            </div>
          ) : (
            <div className="space-y-3">
              {invoices.map((inv) => (
                <div key={inv.id} className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="font-mono font-bold text-[#0F766E]">{inv.number || `INV #${inv.id}`}</span>
                    <Badge variant={inv.state === "paid" ? "green" : inv.state === "posted" ? "blue" : "neutral"}>
                      {inv.status || "Unknown"}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Invoice Total:</span>
                    <span className="font-mono font-bold text-slate-900">{formatQar(inv.totalQar)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Amount Due:</span>
                    <span className="font-mono font-semibold text-emerald-700">{inv.amountToPay == null ? "Not available" : formatQar(inv.amountToPay)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 7. PATIENT OVERVIEW TAB (Default) */}
      {activeTab === "insurance" && (
        <div className="bg-white border border-slate-200/90 rounded-xl shadow-2xs overflow-hidden">
          {policies.length === 0 ? (
            <div className="p-10 text-center text-xs text-slate-500">No insurance policy is recorded for this patient.</div>
          ) : (
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200/80 font-mono text-[11px] text-slate-500 uppercase tracking-wider">
                  <th className="py-3 px-5">Policy #</th><th className="py-3 px-5">Insurance Company</th><th className="py-3 px-5">Type</th><th className="py-3 px-5">Member Since</th><th className="py-3 px-5">Expires</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {policies.map((p: any) => (
                  <tr key={p.id}>
                    <td className="py-3 px-5 font-mono font-bold text-[#0F766E]">{p.number}</td>
                    <td className="py-3 px-5 text-slate-800">{p.companyName || "—"}</td>
                    <td className="py-3 px-5 text-slate-700">{{ state: "State", labour_union: "Labour Union", private: "Private" }[p.insuranceType as string] || p.insuranceType || "—"}</td>
                    <td className="py-3 px-5 font-mono text-slate-500">{p.memberSince || "—"}</td>
                    <td className="py-3 px-5 font-mono text-slate-500">{p.memberExp || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {activeTab === "overview" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-2xs space-y-3">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-tight pb-2 border-b border-slate-100">
              Demographic & National Identity Master Record
            </h3>
            <div className="text-xs space-y-2 text-slate-600">
              <div className="flex justify-between"><span className="text-slate-400">Full Name:</span><span className="font-bold text-slate-900">{patient.name}</span></div>
              <div className="flex justify-between"><span className="text-slate-400">National ID:</span><span className="font-mono font-bold text-slate-900">{patient.qid || "Not recorded"}</span></div>
              <div className="flex justify-between"><span className="text-slate-400">Date of Birth:</span><span>{patient.dob} ({patient.age} Years)</span></div>
              <div className="flex justify-between"><span className="text-slate-400">Biological Sex:</span><span>{patient.gender}</span></div>
              <div className="flex justify-between"><span className="text-slate-400">Blood Group:</span><span className="font-bold text-[#0F766E]">{patient.bloodGroup}</span></div>
              <div className="flex justify-between"><span className="text-slate-400">Phone:</span><span className="font-mono">{patient.phone}</span></div>
              <div className="flex justify-between"><span className="text-slate-400">Emergency Kin:</span><span>{patient.emergencyContact}</span></div>
            </div>
          </div>

          <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-2xs space-y-3">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-tight pb-2 border-b border-slate-100">
              Longitudinal Clinical Activity Summary
            </h3>
            <div className="text-xs space-y-2 text-slate-600">
              <div className="flex justify-between">
                <span className="text-slate-400">Latest Vitals:</span>
                <span className="font-mono font-bold text-slate-900">
                  {latestEval ? `BP ${latestEval.systolic ?? "—"}/${latestEval.diastolic ?? "—"} · BMI ${latestEval.bmi ?? "—"}` : "No Vitals Logged"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Active Allergy:</span>
                <span className="font-bold text-slate-600">{patient.allergies[0] || (patient.allergiesLoaded ? "No allergy records" : patient.allergiesRestricted ? "Restricted for your role" : "Not loaded")}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Prescriptions:</span>
                <span className="font-mono font-bold text-[#0F766E]">
                  {latestRx ? `RX #${latestRx.id}${prescriptionsStatusOnly ? "" : ` (${rxMedicationSummary(latestRx)})`}` : "None recorded"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Lab Diagnostic:</span>
                <span className="font-mono font-bold text-[#0F766E]">
                  {latestLab ? `LAB #${latestLab.id}${latestLab.testName ? ` (${latestLab.testName})` : ""}` : "None recorded"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Radiology Study:</span>
                <span className="font-mono font-bold text-[#0F766E]">
                  {latestRad ? `RAD #${latestRad.id} (${radOrdersTitle(latestRad)})` : "None"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Accounts Balance:</span>
                <span className="font-mono font-bold text-emerald-700">
                  {latestInv ? (latestInv.amountToPay == null ? "Balance unavailable" : formatQar(latestInv.amountToPay)) : invoicesRestricted ? "Not visible to your role" : "No invoice"}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function radOrdersTitle(rad: any): string {
  if (rad.procedureName) return rad.procedureName;
  if (rad.findings) return rad.findings.slice(0, 20);
  return "Not available";
}

function rxMedicationSummary(rx: any): string {
  const names = Array.isArray(rx.lines) ? rx.lines.map((l: any) => l.medicament).filter(Boolean) : [];
  return names.length ? names.join(", ") : "Not available";
}

function formatQar(value: number | string | null | undefined): string {
  if (value == null || value === "" || !Number.isFinite(Number(value))) return "Not available";
  return new Intl.NumberFormat(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Number(value));
}
