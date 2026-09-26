"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  Stethoscope,
  Activity,
  Heart,
  Thermometer,
  Wind,
  AlertTriangle,
  Pill,
  Plus,
  CheckCircle2,
  FileCheck,
  Microscope,
  Scan,
  Receipt,
  ArrowRight,
  Search,
  Building,
  Save,
  Check,
  Trash2,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Select } from "@/components/ui/Select";
import { Modal } from "@/components/ui/Modal";

// MASTER ICD-10 DIAGNOSIS CATALOG (Resolves S4.3)
interface ICD10Item {
  code: string;
  name: string;
  category: string;
}

const ICD10_CATALOG: ICD10Item[] = [];

// MASTER HOSPITAL DRUG DATABASE / FORMULARY (Resolves S4.5)
interface DrugFormularyItem {
  id: string;
  name: string;
  genericName: string;
  strength: string;
  form: string;
  defaultDose: string;
  defaultRoute: string;
  defaultFrequency: string;
  defaultDuration: string;
  category: string;
}

const DRUG_FORMULARY: DrugFormularyItem[] = [];

interface PrescriptionLine {
  id: number;
  medicament: string;
  dose: string;
  route: string;
  frequency: string;
  duration: string;
  status: "approved" | "pending";
}

export default function PhysicianConsultationPage() {
  const searchParams = useSearchParams();
  const initialPatientId = Number(searchParams.get("patientId")) || 0;
  const initialEvaluationId = Number(searchParams.get("evaluationId")) || 0;
  const [patientsList, setPatientsList] = useState<any[]>([]);
  const [selectedPatientId, setSelectedPatientId] = useState<number>(initialPatientId);
  const [evaluationId, setEvaluationId] = useState<number>(initialEvaluationId);
  const [patient, setPatient] = useState({
    id: 0, puid: "", name: "", age: "", gender: "", bloodGroup: "", allergies: [] as string[],
    vitals: {
      bp: "", bpm: null as number | null, temp: null as number | null, spo2: null as number | null, bmi: "",
    },
  });

  const [soapData, setSoapData] = useState({
    chiefComplaint: "", physicalExam: "", diagnosisCode: "", diagnosisName: "", treatmentPlan: "",
  });

  // Prescriptions state (Resolves S4.6 & S4.8: RX-2026-0029)
  const [prescriptionRef, setPrescriptionRef] = useState("");
  const [prescriptions, setPrescriptions] = useState<PrescriptionLine[]>([]);

  // Modal States
  const [isIcdModalOpen, setIsIcdModalOpen] = useState(false);
  const [icdSearchTerm, setIcdSearchTerm] = useState("");
  const [isRxModalOpen, setIsRxModalOpen] = useState(false);
  const [drugSearchTerm, setDrugSearchTerm] = useState("");
  const [selectedDrug, setSelectedDrug] = useState<DrugFormularyItem | null>(null);
  const [newRx, setNewRx] = useState({
    medicament: "", dose: "", route: "", frequency: "", duration: "",
  });

  const [isSaving, setIsSaving] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Live ICD-10 Search State
  const [liveIcdResults, setLiveIcdResults] = useState<ICD10Item[]>([]);
  const [isIcdSearching, setIsIcdSearching] = useState(false);

  // Live Drug Formulary Search State
  const [liveDrugResults, setLiveDrugResults] = useState<DrugFormularyItem[]>([]);
  const [isDrugSearching, setIsDrugSearching] = useState(false);

  // Live ICD-10 debounced search against clinical system gnuhealth.pathology
  useEffect(() => {
    if (!icdSearchTerm || icdSearchTerm.length < 2) {
      setLiveIcdResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      setIsIcdSearching(true);
      try {
        const res = await fetch(`/api/clinical/pathology?q=${encodeURIComponent(icdSearchTerm)}`);
        const data = await res.json();
        if (data.success && Array.isArray(data.pathologies) && data.pathologies.length > 0) {
          setLiveIcdResults(
            data.pathologies.map((p: any) => ({
              code: p.code,
              name: p.name,
              category: "clinical system Pathology",
            }))
          );
        } else {
          setLiveIcdResults([]);
        }
      } catch {
        setLiveIcdResults([]);
      } finally {
        setIsIcdSearching(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [icdSearchTerm]);

  // Live Formulary debounced search against clinical system gnuhealth.medicament
  useEffect(() => {
    if (!drugSearchTerm || drugSearchTerm.length < 2) {
      setLiveDrugResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      setIsDrugSearching(true);
      try {
        const res = await fetch(`/api/clinical/medicaments?q=${encodeURIComponent(drugSearchTerm)}`);
        const data = await res.json();
        if (data.success && Array.isArray(data.medicaments) && data.medicaments.length > 0) {
          setLiveDrugResults(
            data.medicaments.map((m: any) => ({
              id: String(m.id),
              name: m.name,
              genericName: m.genericName || m.name,
              strength: "",
              form: "",
              defaultDose: "",
              defaultRoute: "",
              defaultFrequency: "",
              defaultDuration: "",
              category: "",
            }))
          );
        } else {
          setLiveDrugResults([]);
        }
      } catch {
        setLiveDrugResults([]);
      } finally {
        setIsDrugSearching(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [drugSearchTerm]);

  // Load live patients & triage telemetry
  useEffect(() => {
    async function loadPatientData() {
      try {
        const res = await fetch("/api/clinical/patients");
        const data = await res.json();
        if (data.success && Array.isArray(data.patients) && data.patients.length > 0) {
          setPatientsList(data.patients);
          const match = data.patients.find((p: any) => p.id === initialPatientId) || data.patients[0];
          if (match) {
            setSelectedPatientId(match.id);
            setPatient({
              id: match.id, puid: match.puid || "", name: match.name || "", age: match.age || "",
              gender: match.gender || "", bloodGroup: match.bloodGroup || "", allergies: match.allergies || [],
              vitals: { bp: "", bpm: null, temp: null, spo2: null, bmi: "" },
            });
          }
        }
      } catch {
        setErrorMessage("Could not load patient records from clinical system.");
      }
    }
    loadPatientData();
  }, [initialPatientId]);

  const handlePatientSelect = (patId: number) => {
    setSelectedPatientId(patId);
    const match = patientsList.find((p) => p.id === patId);
    if (match) {
      setPatient((prev) => ({
        ...prev,
        id: match.id,
        puid: match.puid || "",
        name: match.name || "",
        age: match.age || "",
        gender: match.gender || "",
        bloodGroup: match.bloodGroup || "",
        allergies: match.allergies || [],
        vitals: { bp: "", bpm: null, temp: null, spo2: null, bmi: "" },
      }));
      setEvaluationId(0);
      setFeedback(null);
      setErrorMessage(null);
    }
  };

  // Select ICD-10 Code (Resolves S4.3)
  const handleSelectIcd10 = (item: ICD10Item) => {
    setSoapData((prev) => ({
      ...prev,
      diagnosisCode: item.code,
      diagnosisName: item.name,
    }));
    setIsIcdModalOpen(false);
    setFeedback(`Primary Pathology updated: ${item.code} — ${item.name}`);
    setErrorMessage(null);
  };

  // Select Drug from Formulary (Resolves S4.5)
  const handleSelectDrug = (drug: DrugFormularyItem) => {
    setSelectedDrug(drug);
    setNewRx({
      medicament: drug.name,
      dose: drug.defaultDose,
      route: drug.defaultRoute,
      frequency: drug.defaultFrequency,
      duration: drug.defaultDuration,
    });
  };

  // Add Prescription Line (Resolves S4.7)
  const handleAddPrescription = (e: React.FormEvent) => {
    e.preventDefault();
    const line: PrescriptionLine = {
      id: prescriptions.length + 1,
      medicament: newRx.medicament,
      dose: newRx.dose,
      route: newRx.route,
      frequency: newRx.frequency,
      duration: newRx.duration,
      status: "pending",
    };
    setPrescriptions([...prescriptions, line]);
    setIsRxModalOpen(false);
    setFeedback(`Prescription line added: ${line.medicament} (${line.dose}, ${line.frequency}).`);
    setErrorMessage(null);
  };

  // Create / Issue Prescription (Resolves S4.8 - Real clinical system Persistence)
  const handleCreatePrescription = async () => {
    setIsSaving(true);
    setFeedback(null);
    setErrorMessage(null);
    try {
      const res = await fetch("/api/clinical/prescriptions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patientId: patient.id,
          evaluationId: evaluationId || undefined,
          lines: prescriptions.map((p) => ({
            medicament: p.medicament,
            dose: p.dose,
            route: p.route,
            frequency: p.frequency,
            duration: p.duration,
          })),
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to persist prescription in clinical system");
      }
      const ref = data.prescriptionId ? String(data.prescriptionId) : "";
      setPrescriptionRef(ref);
      setFeedback(`clinical system prescription record ${ref} created for ${patient.name}.`);
    } catch (err: any) {
      setErrorMessage(err.message || "Error issuing prescription order");
    } finally {
      setIsSaving(false);
    }
  };

  // Explicit Save Clinical Evaluation Button (Resolves S4.2: Save Button not found)
  const handleSaveEvaluation = async () => {
    setIsSaving(true);
    setFeedback(null);
    setErrorMessage(null);
    try {
      const res = await fetch("/api/clinical/consultations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patientId: patient.id,
          evaluationId: evaluationId || undefined,
          chiefComplaint: soapData.chiefComplaint,
          physicalExam: soapData.physicalExam,
          diagnosisCode: soapData.diagnosisCode,
          directions: soapData.treatmentPlan,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to save evaluation to clinical system");
      }
      if (data.evaluationId) setEvaluationId(data.evaluationId);
      setFeedback(`clinical system evaluation ${data.evaluationId || ""} saved.`);
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to save evaluation to clinical system");
    } finally {
      setIsSaving(false);
    }
  };

  // Complete Evaluation Button (Resolves S4.4: Complete Evaluation)
  const handleCompleteEvaluation = async () => {
    setIsSaving(true);
    setFeedback(null);
    setErrorMessage(null);
    try {
      const res = await fetch("/api/clinical/consultations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patientId: patient.id,
          evaluationId: evaluationId || undefined,
          chiefComplaint: soapData.chiefComplaint,
          physicalExam: soapData.physicalExam,
          diagnosisCode: soapData.diagnosisCode,
          directions: soapData.treatmentPlan,
          completed: true,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to complete evaluation in clinical system");
      }
      setFeedback(`clinical system evaluation ${data.evaluationId || evaluationId || ""} completed.`);
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to complete evaluation in clinical system");
    } finally {
      setIsSaving(false);
    }
  };

  // Filtered ICD-10
  const filteredIcd10 = liveIcdResults.filter((item) => {
    const q = icdSearchTerm.toLowerCase();
    return item.code.toLowerCase().includes(q) || item.name.toLowerCase().includes(q) || item.category.toLowerCase().includes(q);
  });

  // Filtered Drugs in Formulary
  const filteredDrugs = liveDrugResults.filter((d) => {
    const q = drugSearchTerm.toLowerCase();
    return (
      d.name.toLowerCase().includes(q) ||
      d.genericName.toLowerCase().includes(q) ||
      d.category.toLowerCase().includes(q)
    );
  });

  return (
    <div className="max-w-7xl mx-auto space-y-7 animate-fade-in">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-slate-200/90 gap-4">
        <div>
          <div className="kicker text-[#0F766E] mb-1">CLINICAL HEALTH · CONSULTING ROOM 04</div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Physician Consultation & Clinical Cockpit
          </h1>
          <p className="text-xs text-slate-600 mt-1">
            {evaluationId ? <>clinical system Evaluation ID: <span className="font-mono font-bold text-slate-900">{evaluationId}</span> · </> : null}
            Attending clinician is resolved from the current clinical system session.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* EXPLICIT SAVE BUTTON (Resolves S4.2: Save Button not found) */}
          <Button
            variant="outline"
            size="sm"
            onClick={handleSaveEvaluation}
            isLoading={isSaving}
            leftIcon={<Save className="w-4 h-4 text-[#0F766E]" />}
          >
            Save Evaluation
          </Button>

          {/* COMPLETE EVALUATION (Resolves S4.4: Complete Evaluation) */}
          <Button
            variant="primary"
            size="sm"
            onClick={handleCompleteEvaluation}
            isLoading={isSaving}
            leftIcon={<FileCheck className="w-4 h-4" />}
            className="bg-[#0F766E] hover:bg-[#115E59] font-bold"
          >
            Complete Evaluation
          </Button>
        </div>
      </div>

      {feedback && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center justify-between shadow-2xs font-medium">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{feedback}</span>
          </div>
          <Link
            href="/billing"
            className="font-bold underline text-emerald-900 flex items-center gap-1 hover:text-emerald-950"
          >
            <span>Proceed to Outpatient Cashier</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      )}

      {errorMessage && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-xs text-red-800 flex items-center gap-2 shadow-2xs font-medium">
          <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* PATIENT BANNER WITH TELEMETRY */}
      <div className="bg-white border border-slate-200/90 rounded-2xl shadow-2xs p-6 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-[#0F766E] text-white flex items-center justify-center font-bold text-lg shadow-xs">
              {patient.name.charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h2 className="text-lg font-bold text-slate-900">{patient.name}</h2>
                <span className="font-mono text-xs px-2 py-0.5 rounded-md bg-teal-50 border border-teal-200 text-[#0F766E] font-bold">
                  PUID: {patient.puid}
                </span>
                <Badge variant="blue" dot>Consultation Active</Badge>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                {[patient.age, patient.gender, patient.bloodGroup].filter(Boolean).join(" · ")}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {patientsList.length > 1 && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500 font-medium">Consulting Patient:</span>
                <select
                  value={selectedPatientId}
                  onChange={(e) => handlePatientSelect(parseInt(e.target.value, 10))}
                  className="text-xs font-semibold bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-[#0F766E]"
                >
                  {patientsList.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.puid})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Allergy Badges */}
            <div className="flex items-center gap-2">
              <span className="kicker text-red-600">ALLERGY ALERT:</span>
              {patient.allergies.map((all, i) => (
                <Badge key={i} variant="red" size="md">
                  <AlertTriangle className="w-3.5 h-3.5 mr-1" />
                  {all}
                </Badge>
              ))}
            </div>
          </div>
        </div>

        {/* Vital Signs Strip (from Nursing Triage S3.6) */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-1">
          <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl">
            <span className="kicker text-[10px] text-slate-400 block mb-1">BLOOD PRESSURE</span>
            <div className="font-mono text-lg font-extrabold text-slate-900 flex items-center gap-1.5">
              <Heart className="w-3.5 h-3.5 text-red-500" />
              <span>{patient.vitals.bp}</span>
              <span className="text-[10px] text-slate-400 font-normal">mmHg</span>
            </div>
          </div>

          <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl">
            <span className="kicker text-[10px] text-slate-400 block mb-1">HEART RATE</span>
            <div className="font-mono text-lg font-extrabold text-[#0F766E] flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-[#0F766E]" />
              <span>{patient.vitals.bpm}</span>
              <span className="text-[10px] text-slate-400 font-normal">BPM</span>
            </div>
          </div>

          <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl">
            <span className="kicker text-[10px] text-slate-400 block mb-1">BODY TEMP</span>
            <div className="font-mono text-lg font-extrabold text-slate-900 flex items-center gap-1.5">
              <Thermometer className="w-3.5 h-3.5 text-emerald-600" />
              <span>{patient.vitals.temp}</span>
              <span className="text-[10px] text-slate-400 font-normal">°C</span>
            </div>
          </div>

          <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl">
            <span className="kicker text-[10px] text-slate-400 block mb-1">OXYGEN SAT (SPO2)</span>
            <div className="font-mono text-lg font-extrabold text-blue-600 flex items-center gap-1.5">
              <Wind className="w-3.5 h-3.5 text-blue-500" />
              <span>{patient.vitals.spo2}</span>
              <span className="text-[10px] text-slate-400 font-normal">%</span>
            </div>
          </div>

          <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl">
            <span className="kicker text-[10px] text-slate-400 block mb-1">BODY MASS INDEX</span>
            <div className="font-mono text-lg font-extrabold text-slate-900">
              {patient.vitals.bmi} <span className="text-[10px] text-slate-400 font-normal">kg/m²</span>
            </div>
          </div>
        </div>
      </div>

      {/* TWO-COLUMN WORKSPACE: SOAP NOTES & PRESCRIPTIONS */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: SOAP Evaluation Notes */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-2xs space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-tight flex items-center gap-2">
                <Stethoscope className="w-4 h-4 text-[#0F766E]" />
                <span>Clinical Assessment & SOAP Protocol</span>
              </h3>
              <Badge variant="teal">clinical system Clinical Model</Badge>
            </div>

            <Textarea
              label="1. Subjective History (Chief Complaint & HPI) *"
              value={soapData.chiefComplaint}
              onChange={(e) => setSoapData({ ...soapData, chiefComplaint: e.target.value })}
              rows={3}
              required
            />

            <Textarea
              label="2. Objective Findings (Physical Examination) *"
              value={soapData.physicalExam}
              onChange={(e) => setSoapData({ ...soapData, physicalExam: e.target.value })}
              rows={4}
              required
            />

            {/* ICD-10 Pathology Diagnosis (Resolves S4.3) */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-700 flex items-center justify-between">
                <span>3. Primary Pathology Diagnosis (ICD-10 Standard) *</span>
                <span className="text-[11px] text-[#0F766E] font-mono">WHO ICD-10 Classification</span>
              </label>

              <div className="p-3.5 bg-slate-50 border border-slate-200/90 rounded-xl flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="font-mono text-xs px-2.5 py-1 rounded bg-teal-100 text-[#0F766E] font-bold">
                    {soapData.diagnosisCode}
                  </span>
                  <span className="text-xs font-semibold text-slate-800">
                    {soapData.diagnosisName}
                  </span>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="xs"
                  onClick={() => setIsIcdModalOpen(true)}
                  leftIcon={<Search className="w-3 h-3 text-[#0F766E]" />}
                  className="font-bold text-xs"
                >
                  Search ICD-10
                </Button>
              </div>
            </div>

            <Textarea
              label="4. Management & Treatment Plan *"
              value={soapData.treatmentPlan}
              onChange={(e) => setSoapData({ ...soapData, treatmentPlan: e.target.value })}
              rows={3}
              required
            />

            <div className="pt-2 flex items-center justify-between border-t border-slate-100">
              <span className="text-[11px] text-slate-400">Clinical evaluation</span>
              <Button
                type="button"
                variant="primary"
                size="sm"
                onClick={handleSaveEvaluation}
                isLoading={isSaving}
                leftIcon={<Save className="w-4 h-4" />}
                className="bg-[#0F766E] hover:bg-[#115E59]"
              >
                Save Evaluation Notes
              </Button>
            </div>
          </div>
        </div>

        {/* Right Column: Prescriptions & Drug Database (Resolves S4.5 - S4.8) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Active Prescription Orders */}
          <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-2xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <span className="kicker text-slate-400 block mb-0.5">PRESCRIPTION HEADER (S4.6)</span>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                  <Pill className="w-4 h-4 text-[#0F766E]" />
                  <span>{prescriptionRef}</span>
                </h3>
                <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                  Patient: {patient.name} ({patient.puid})
                </div>
              </div>
              <Button
                variant="primary"
                size="xs"
                onClick={() => setIsRxModalOpen(true)}
                leftIcon={<Plus className="w-3.5 h-3.5" />}
                className="bg-[#0F766E] hover:bg-[#115E59] font-bold"
              >
                Add Medicine
              </Button>
            </div>

            {/* Prescription Lines List (Resolves S4.7: Prescription Line Entry) */}
            <div className="space-y-3">
              {prescriptions.map((rx) => (
                <div
                  key={rx.id}
                  className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-xl space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
                      <Pill className="w-3.5 h-3.5 text-[#0F766E]" />
                      {rx.medicament}
                    </span>
                    <Badge variant="green" size="sm">Approved</Badge>
                  </div>
                  <div className="text-[11px] font-mono text-slate-500">
                    Dose: <strong className="text-slate-700">{rx.dose}</strong> · Route: {rx.route} · Frequency: {rx.frequency} · Duration: {rx.duration}
                  </div>
                </div>
              ))}
            </div>

            {/* CREATE PRESCRIPTION BUTTON (Resolves S4.8: Create Prescription) */}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
              <span className="text-[11px] font-mono text-slate-500">{prescriptions.length} line(s)</span>
              <Button
                type="button"
                variant="primary"
                size="sm"
                onClick={handleCreatePrescription}
                leftIcon={<FileCheck className="w-4 h-4" />}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
              >
                CREATE PRESCRIPTION ({prescriptionRef})
              </Button>
            </div>
          </div>

          {/* Diagnostic Investigation Orders */}
          <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-2xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-tight pb-3 border-b border-slate-100 flex items-center gap-2">
              <Activity className="w-4 h-4 text-[#0F766E]" />
              <span>Diagnostic Workup Requisitions</span>
            </h3>

            <div className="grid grid-cols-2 gap-3">
              <Link href="/laboratory" className="block">
                <div className="p-3.5 bg-slate-50 border border-slate-200/80 hover:border-[#0F766E] rounded-xl transition-all group">
                  <div className="flex items-center gap-2">
                    <Microscope className="w-4 h-4 text-[#0F766E]" />
                    <span className="text-xs font-bold text-slate-900 group-hover:text-[#0F766E]">CBC Lab Test</span>
                  </div>
                  <div className="text-[10px] text-slate-500 mt-1">Diagnostic Pathology</div>
                </div>
              </Link>

              <Link href="/radiology" className="block">
                <div className="p-3.5 bg-slate-50 border border-slate-200/80 hover:border-[#0F766E] rounded-xl transition-all group">
                  <div className="flex items-center gap-2">
                    <Scan className="w-4 h-4 text-[#0F766E]" />
                    <span className="text-xs font-bold text-slate-900 group-hover:text-[#0F766E]">Chest X-Ray</span>
                  </div>
                  <div className="text-[10px] text-slate-500 mt-1">Digital PACS Suite</div>
                </div>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* MODAL 1: SEARCH & SELECT ICD-10 DIAGNOSIS (Resolves S4.3) */}
      <Modal
        isOpen={isIcdModalOpen}
        onClose={() => setIsIcdModalOpen(false)}
        title="ICD-10 Pathology Diagnostic Search"
        kicker="WHO INTERNATIONAL CLASSIFICATION OF DISEASES"
        size="lg"
      >
        <div className="space-y-4">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by code (e.g. J06.9) or pathology keyword (e.g. respiratory, fever, cough)..."
              value={icdSearchTerm}
              onChange={(e) => setIcdSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2.5 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:border-[#0F766E]"
              autoFocus
            />
          </div>

          <div className="max-h-72 overflow-y-auto divide-y divide-slate-100 border border-slate-200 rounded-xl">
            {isIcdSearching && (
              <div className="p-4 text-center text-xs text-slate-500 font-mono">
                Searching clinical system ICD-10 database...
              </div>
            )}
            {!isIcdSearching && liveIcdResults.map((item) => (
              <div
                key={item.code}
                onClick={() => handleSelectIcd10(item)}
                className="p-3 hover:bg-teal-50/70 cursor-pointer transition-colors flex items-center justify-between gap-3"
              >
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-teal-100 text-[#0F766E]">
                      {item.code}
                    </span>
                    <span className="text-xs font-bold text-slate-900">{item.name}</span>
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono">{item.category}</div>
                </div>
                <Button variant="ghost" size="xs">
                  Select
                </Button>
              </div>
            ))}
          </div>

          <div className="pt-2 flex justify-end">
            <Button variant="outline" size="sm" onClick={() => setIsIcdModalOpen(false)}>
              Close
            </Button>
          </div>
        </div>
      </Modal>

      {/* MODAL 2: SEARCH DRUG DATABASE & ADD PRESCRIPTION (Resolves S4.5 & S4.7) */}
      <Modal
        isOpen={isRxModalOpen}
        onClose={() => setIsRxModalOpen(false)}
        title="Drug Formulary & Medication Dispensary"
        kicker="PHARMACEUTICAL DATABASE SEARCH (S4.5)"
        size="lg"
      >
        <div className="space-y-5">
          {/* Drug Search */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700">Search Medication in Drug Database *</label>
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search by generic or trade drug name (e.g. Amoxicillin, Paracetamol, Ibuprofen)..."
                value={drugSearchTerm}
                onChange={(e) => setDrugSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:border-[#0F766E]"
              />
            </div>
          </div>

          {/* Drug Catalog Grid */}
          <div className="max-h-44 overflow-y-auto grid grid-cols-1 sm:grid-cols-2 gap-2 border border-slate-200 rounded-xl p-2 bg-slate-50">
            {isDrugSearching && (
              <div className="col-span-2 p-3 text-center text-xs text-slate-500 font-mono">
                Searching clinical system Formulary...
              </div>
            )}
            {!isDrugSearching && liveDrugResults.map((d) => (
              <div
                key={d.id}
                onClick={() => handleSelectDrug(d)}
                className={`p-2.5 rounded-lg border cursor-pointer transition-all ${
                  selectedDrug?.id === d.id
                    ? "bg-teal-50 border-[#0F766E] shadow-2xs"
                    : "bg-white border-slate-200 hover:border-slate-300"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900">{d.name}</span>
                  {selectedDrug?.id === d.id && <Check className="w-3.5 h-3.5 text-[#0F766E]" />}
                </div>
                <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                  {d.genericName} · {d.form}
                </div>
              </div>
            ))}
          </div>

          {/* Form for selected drug */}
          <form onSubmit={handleAddPrescription} className="space-y-4 pt-2 border-t border-slate-100">
            <Input
              label="Selected Medication"
              value={newRx.medicament}
              onChange={(e) => setNewRx({ ...newRx, medicament: e.target.value })}
              required
            />

            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Dosage"
                value={newRx.dose}
                onChange={(e) => setNewRx({ ...newRx, dose: e.target.value })}
                required
              />
              <Input
                label="Route of Administration"
                value={newRx.route}
                onChange={(e) => setNewRx({ ...newRx, route: e.target.value })}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Dosing Frequency"
                value={newRx.frequency}
                onChange={(e) => setNewRx({ ...newRx, frequency: e.target.value })}
                required
              />
              <Input
                label="Treatment Duration"
                value={newRx.duration}
                onChange={(e) => setNewRx({ ...newRx, duration: e.target.value })}
                required
              />
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setIsRxModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" className="bg-[#0F766E] font-bold">
                Add to Prescription Order
              </Button>
            </div>
          </form>
        </div>
      </Modal>
    </div>
  );
}
