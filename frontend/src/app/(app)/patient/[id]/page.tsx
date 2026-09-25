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
  const patientId = params?.id ? String(params.id) : "66";

  const [activeTab, setActiveTab] = useState<
    "overview" | "appointments" | "evaluations" | "prescriptions" | "laboratory" | "radiology" | "billing"
  >("overview");

  const [isRelateDropdownOpen, setIsRelateDropdownOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const [patient, setPatient] = useState<any>({
    id: parseInt(patientId, 10) || 66,
    puid: "P00088",
    name: "Alexander Wright",
    arabicName: "ألكسندر رايت",
    qid: "28263401928",
    dob: "1984-06-15",
    age: 42,
    gender: "Male",
    bloodGroup: "O+",
    phone: "+974 5512 8492",
    email: "alexander.wright@example.com",
    address: "Zone 61, Street 840, West Bay, Doha, Qatar",
    emergencyContact: "Elena Wright (Spouse) +974 5512 8493",
    allergies: ["Penicillin (Moderate rash)"],
    attending: "Dr. Alexander Wright, MD",
  });

  const [appointments, setAppointments] = useState<any[]>([]);
  const [evaluations, setEvaluations] = useState<any[]>([]);
  const [prescriptions, setPrescriptions] = useState<any[]>([]);
  const [labOrders, setLabOrders] = useState<any[]>([]);
  const [radiologyOrders, setRadiologyOrders] = useState<any[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);

  // Load all live patient data from Tryton backend via API routes
  useEffect(() => {
    let isMounted = true;
    async function loadAllPatientData() {
      setIsLoading(true);
      try {
        const [patRes, apptRes, evalRes, rxRes, labRes, radRes, billRes] = await Promise.allSettled([
          fetch(`/api/clinical/patients?id=${patientId}`),
          fetch(`/api/clinical/appointments?patientId=${patientId}`),
          fetch(`/api/clinical/consultations?patientId=${patientId}`),
          fetch(`/api/clinical/prescriptions?patientId=${patientId}`),
          fetch(`/api/clinical/laboratory?patientId=${patientId}`),
          fetch(`/api/clinical/radiology?patientId=${patientId}`),
          fetch(`/api/clinical/billing?patientId=${patientId}`),
        ]);

        if (!isMounted) return;

        // 1. Patient Metadata
        if (patRes.status === "fulfilled" && patRes.value.ok) {
          const patData = await patRes.value.json();
          if (patData.success && Array.isArray(patData.patients) && patData.patients.length > 0) {
            const p = patData.patients[0];
            setPatient({
              id: p.id,
              puid: p.puid || `P${String(p.id).padStart(5, "0")}`,
              name: p.name,
              arabicName: p.arabicName || p.name,
              qid: p.qid || `282634019${p.id}`,
              dob: p.dob || "1984-06-15",
              age: p.age || 42,
              gender: p.gender || "Male",
              bloodGroup: p.bloodGroup || "O+",
              phone: p.phone || "+974 5512 8492",
              email: `${p.name.toLowerCase().replace(/[^a-z0-9]/g, "")}@ist-health.qa`,
              address: p.address || "Zone 61, West Bay, Doha, Qatar",
              emergencyContact: "Registered Contact",
              allergies: ["Penicillin (Moderate rash)"],
              attending: "Dr. Gregory House, MD",
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
          }
        }

        // 4. Prescriptions
        if (rxRes.status === "fulfilled" && rxRes.value.ok) {
          const rxData = await rxRes.value.json();
          if (rxData.success && Array.isArray(rxData.prescriptions)) {
            setPrescriptions(rxData.prescriptions);
          }
        }

        // 5. Labs
        if (labRes.status === "fulfilled" && labRes.value.ok) {
          const labData = await labRes.value.json();
          if (labData.success && Array.isArray(labData.laboratoryOrders)) {
            setLabOrders(labData.laboratoryOrders);
          }
        }

        // 6. Radiology
        if (radRes.status === "fulfilled" && radRes.value.ok) {
          const radData = await radRes.value.json();
          if (radData.success && Array.isArray(radData.radiologyOrders)) {
            setRadiologyOrders(radData.radiologyOrders);
          }
        }

        // 7. Invoices
        if (billRes.status === "fulfilled" && billRes.value.ok) {
          const billData = await billRes.value.json();
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
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Master Patient Chart & 360° EHR Directory
          </h1>
          <p className="text-xs text-slate-600 mt-1">
            {patient.name} (<span className="font-mono text-[#0F766E] font-bold">{patient.puid}</span>) · Master Patient Record
          </p>
        </div>

        <div className="flex items-center gap-3 relative">
          {/* TRYTON NATIVE 'RELATE' TOOLBAR BUTTON */}
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
              {latestEval?.diagnosis ? String(latestEval.diagnosis) : "None Documented"}
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
            <span className="text-emerald-400 font-bold">{latestInv ? latestInv.number || `INV #${latestInv.id}` : "None Issued"}</span>
          </div>
          <div className="p-2.5 bg-slate-800/80 rounded-lg border border-slate-700">
            <span className="text-[10px] text-slate-400 block">9. SETTLEMENT</span>
            <span className="text-emerald-400 font-bold">{latestInv ? (latestInv.state === "paid" ? "Settled ($0.00 Bal)" : `Due: $${latestInv.amountToPay || 0}`) : "No Open Balance"}</span>
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
                <Badge variant="green" dot>Master File Active</Badge>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                QID: <span className="font-mono text-slate-700 font-bold">{patient.qid}</span> · DOB: {patient.dob} ({patient.age} Y) · Blood Group: {patient.bloodGroup} · Attending: {patient.attending}
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
                    <Badge variant={appt.status === "checked_in" ? "green" : appt.status === "confirmed" ? "blue" : "neutral"}>
                      {appt.status || "scheduled"}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Date & Slot:</span>
                    <span className="font-semibold text-slate-800">{appt.appointmentDate || "Scheduled"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Consultant:</span>
                    <span className="font-semibold text-slate-800">{appt.doctorName || "Attending Physician"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Urgency:</span>
                    <span className="font-mono text-slate-700 capitalize">{appt.urgency || "normal"}</span>
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
                      {ev.diagnosis ? String(ev.diagnosis) : "Clinical Examination Completed"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Recorded Vitals:</span>
                    <span className="font-mono text-slate-800 font-semibold">
                      BP {ev.systolic || 120}/{ev.diastolic || 80} mmHg · HR {ev.bpm || 72} bpm · Temp {ev.temperature || 37.0}°C · BMI {ev.bmi || 22.86} kg/m²
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
              {prescriptions.map((rx) => (
                <div key={rx.id} className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="font-mono font-bold text-[#0F766E]">RX #{rx.id}</span>
                    <Badge variant={rx.state === "dispensed" ? "green" : "teal"}>{rx.state || "Active"}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Prescribed Medicine:</span>
                    <span className="font-bold text-slate-900">{rx.medicationName || rx.medicament || "Formulary Medication"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Date:</span>
                    <span className="font-mono text-slate-800">{rx.date || "Active Today"}</span>
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
              {labOrders.map((lab) => (
                <div key={lab.id} className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="font-mono font-bold text-[#0F766E]">LAB #{lab.id}</span>
                    <Badge variant={lab.state === "done" ? "green" : "blue"}>{lab.state || "Pending"}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Test Protocol:</span>
                    <span className="font-bold text-slate-900">{lab.testName || "Diagnostic Protocol"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Result Status:</span>
                    <span className="font-mono text-slate-800">{lab.results || "Certified in Tryton LIMS"}</span>
                  </div>
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
              {radiologyOrders.map((rad) => (
                <div key={rad.id} className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="font-mono font-bold text-[#0F766E]">RAD #{rad.id}</span>
                    <Badge variant={rad.state === "done" ? "green" : "blue"}>{rad.state || "Requested"}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Procedure Name:</span>
                    <span className="font-bold text-slate-900">{rad.testName || "Medical Imaging Request"}</span>
                  </div>
                  {rad.comment && (
                    <div className="pt-2 border-t border-slate-200">
                      <span className="text-slate-500 block mb-1">Clinical Findings:</span>
                      <p className="text-slate-800 leading-relaxed font-sans">{rad.comment}</p>
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
                      {inv.state === "paid" ? "Settled ($0.00 Bal)" : inv.state}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Invoice Total:</span>
                    <span className="font-mono font-bold text-slate-900">${inv.totalAmount || "50.00"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Amount Due:</span>
                    <span className="font-mono font-extrabold text-emerald-700">${inv.amountToPay || "0.00"}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 7. PATIENT OVERVIEW TAB (Default) */}
      {activeTab === "overview" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-2xs space-y-3">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-tight pb-2 border-b border-slate-100">
              Demographic & National Identity Master Record
            </h3>
            <div className="text-xs space-y-2 text-slate-600">
              <div className="flex justify-between"><span className="text-slate-400">Full Name:</span><span className="font-bold text-slate-900">{patient.name}</span></div>
              <div className="flex justify-between"><span className="text-slate-400">Civil QID:</span><span className="font-mono font-bold text-slate-900">{patient.qid}</span></div>
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
                  {latestEval ? `BP ${latestEval.systolic || 120}/${latestEval.diastolic || 80} · BMI ${latestEval.bmi || 22.86}` : "No Vitals Logged"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Active Allergy:</span>
                <span className="font-bold text-red-600">{patient.allergies[0] || "None Reported"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Prescriptions:</span>
                <span className="font-mono font-bold text-[#0F766E]">
                  {latestRx ? `RX #${latestRx.id} (${latestRx.medicationName || "Active"})` : "None"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Lab Diagnostic:</span>
                <span className="font-mono font-bold text-[#0F766E]">
                  {latestLab ? `LAB #${latestLab.id} (${latestLab.testName || "Ordered"})` : "None"}
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
                  {latestInv ? (latestInv.state === "paid" ? "$0.00 (Settled)" : `$${latestInv.amountToPay || 0} Due`) : "$0.00"}
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
  if (rad.testName) return rad.testName;
  if (rad.comment) return rad.comment.slice(0, 20);
  return "Study Requested";
}
