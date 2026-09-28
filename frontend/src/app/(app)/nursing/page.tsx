"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  Activity,
  Heart,
  Thermometer,
  Wind,
  AlertTriangle,
  CheckCircle2,
  ArrowRight,
  ShieldAlert,
  Save,
  Gauge,
  UserCheck,
  ClipboardList,
  Stethoscope,
  Calendar,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Select } from "@/components/ui/Select";
import { Badge } from "@/components/ui/Badge";

export default function NursingTriagePage() {
  const searchParams = useSearchParams();
  const initialPatientId = searchParams.get("patientId");

  const [patientsList, setPatientsList] = useState<any[]>([]);
  const [selectedPatientId, setSelectedPatientId] = useState<number>(0);
  const [patient, setPatient] = useState({
    id: 0, puid: "", name: "", age: "", gender: "", bloodGroup: "", allergies: [] as string[], allergiesLoaded: false, allergiesRestricted: false,
  });

  // Evaluation Header States (Resolves S3.3: Evaluation Header)
  const [evaluationRef, setEvaluationRef] = useState("");

  // Vitals & Anthropometry (Resolves S3.4, S3.5, S3.6: BP 120/80, HR 72, Temp 37.0, Wt 70, Ht 175, BMI 22.86)
  const [vitals, setVitals] = useState({
    systolic: "", diastolic: "", bpm: "", respiratoryRate: "", temp: "", spo2: "", weight: "", height: "",
  });

  const [nurseNotes, setNurseNotes] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Dynamic BMI Calculation
  const heightM = Number(vitals.height) / 100;
  const weightKg = Number(vitals.weight);
  const bmiVal = Number.isFinite(heightM) && heightM > 0 && Number.isFinite(weightKg) && weightKg > 0
    ? (weightKg / (heightM * heightM)).toFixed(2) : "";

  // Load live patients
  useEffect(() => {
    async function loadPatients() {
      try {
        const res = await fetch("/api/clinical/patients");
        const data = await res.json();
        if (data.success && Array.isArray(data.patients)) {
          setPatientsList(data.patients);
          const targetId = initialPatientId ? Number(initialPatientId) : 0;
          const match = data.patients.find((p: any) => p.id === targetId) || data.patients[0];
          if (match) selectPatient(match);
        } else {
          setErrorMessage(data.error || "Unable to load patients from GNU Health.");
        }
      } catch (error) {
        setErrorMessage(error instanceof Error ? error.message : "Unable to load patients from GNU Health.");
      }
    }
    loadPatients();
  }, [initialPatientId]);

  const selectPatient = (match: any) => {
    setSelectedPatientId(match.id);
    setPatient({
      id: match.id, puid: match.puid || "", name: match.name || "", age: match.age || "",
      gender: match.gender || "", bloodGroup: match.bloodGroup || "", allergies: match.allergies || [], allergiesLoaded: match.allergiesLoaded === true, allergiesRestricted: match.allergiesRestricted === true,
    });
    setVitals({ systolic: "", diastolic: "", bpm: "", respiratoryRate: "", temp: "", spo2: "", weight: "", height: "" });
    setNurseNotes("");
  };

  const handlePatientSelect = (patId: number) => {
    const match = patientsList.find((p) => p.id === patId);
    if (match) {
      selectPatient(match);
      setFeedback(null);
      setErrorMessage(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setFeedback(null);
    setErrorMessage(null);
    try {
      const res = await fetch("/api/clinical/triage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patientId: patient.id,
          systolic: vitals.systolic,
          diastolic: vitals.diastolic,
          bpm: vitals.bpm,
          temperature: vitals.temp,
          respiratoryRate: vitals.respiratoryRate,
          osat: vitals.spo2,
          weight: vitals.weight,
          height: vitals.height,
          bmi: bmiVal,
          chiefComplaint: nurseNotes,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to commit triage telemetry to GNU Health");
      }

      const generatedRef = data.evaluationId ? String(data.evaluationId) : "";
      setEvaluationRef(generatedRef);
      setFeedback(
        `GNU Health evaluation record ${generatedRef || ""} saved for ${patient.name}.`
      );
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to save triage evaluation");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-7 animate-fade-in">
      {/* HEADER (Resolves S3.2: Verify Eval Menu) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-slate-200/90 gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="kicker text-[#0F766E]">CLINICAL HEALTH · PATIENT EVALUATIONS</span>
            <span className="text-slate-300">/</span>
            <span className="kicker text-slate-500">TRIAGE</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-semibold text-slate-900 tracking-tight">
            Patient Evaluations & Clinical Triage
          </h1>
          <p className="text-xs text-slate-600 mt-1">
            Record patient evaluation details in GNU Health.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Badge variant="green" size="md" dot>
              Native GNU Health workflow
          </Badge>
        </div>
      </div>

      {/* FEEDBACK ALERT */}
      {feedback && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center justify-between shadow-2xs font-medium">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>{feedback}</span>
          </div>
          <Link
            href={`/physician?patientId=${patient.id}`}
            className="font-bold underline text-emerald-900 flex items-center gap-1 hover:text-emerald-950"
          >
            <span>Proceed to Physician Cockpit</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      )}

      {/* ERROR ALERT */}
      {errorMessage && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-xs text-red-800 flex items-center gap-2 shadow-2xs font-medium">
          <AlertTriangle className="w-5 h-5 text-red-600 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* EVALUATION HEADER CARD (Resolves S3.3: Evaluation Header) */}
      <div className="bg-white border border-slate-200/90 rounded-2xl shadow-2xs p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
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
                <Badge variant="teal" size="sm">Evaluation: {evaluationRef}</Badge>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                {[patient.age, patient.gender, patient.bloodGroup].filter(Boolean).join(" · ")}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {patientsList.length > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500 font-medium">Select Patient:</span>
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
              {patient.allergies.length === 0 && (
                <span className="text-xs text-slate-500">
                  {patient.allergiesLoaded
                    ? "No allergy records returned by GNU Health."
                    : patient.allergiesRestricted
                      ? "Not visible to your role — ask a physician to review."
                      : "Allergy information could not be loaded."}
                </span>
              )}
            </div>
          </div>
        </div>

        {evaluationRef && <p className="text-xs text-slate-600">GNU Health evaluation record ID: {evaluationRef}</p>}
      </div>

      {/* VITALS & ANTHROPOMETRY FORM (Resolves S3.4, S3.5, S3.6) */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white border border-slate-200/90 rounded-2xl shadow-2xs p-6 space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-[#0F766E]" />
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-tight">
                Anthropometry & Physiological Telemetry (Vitals Tab)
              </h3>
            </div>
            <span className="font-mono text-xs text-slate-500">
              Enter values measured for this patient.
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
            {/* Systolic BP */}
            <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl space-y-1">
              <span className="kicker text-[10px] text-slate-500 block">SYSTOLIC BP</span>
              <div className="flex items-baseline gap-1">
                <input
                  type="number"
                  value={vitals.systolic}
                  onChange={(e) => setVitals({ ...vitals, systolic: e.target.value })}
                  className="font-mono text-xl font-semibold text-slate-900 w-16 bg-transparent border-b border-slate-300 focus:outline-none focus:border-[#0F766E]"
                  required
                />
                <span className="text-[10px] text-slate-400">mmHg</span>
              </div>
            </div>

            {/* Diastolic BP */}
            <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl space-y-1">
              <span className="kicker text-[10px] text-slate-500 block">DIASTOLIC BP</span>
              <div className="flex items-baseline gap-1">
                <input
                  type="number"
                  value={vitals.diastolic}
                  onChange={(e) => setVitals({ ...vitals, diastolic: e.target.value })}
                  className="font-mono text-xl font-semibold text-slate-900 w-16 bg-transparent border-b border-slate-300 focus:outline-none focus:border-[#0F766E]"
                  required
                />
                <span className="text-[10px] text-slate-400">mmHg</span>
              </div>
            </div>

            {/* Heart Rate */}
            <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl space-y-1">
              <span className="kicker text-[10px] text-slate-500 block">HEART RATE</span>
              <div className="flex items-baseline gap-1">
                <input
                  type="number"
                  value={vitals.bpm}
                  onChange={(e) => setVitals({ ...vitals, bpm: e.target.value })}
                  className="font-mono text-xl font-semibold text-[#0F766E] w-16 bg-transparent border-b border-slate-300 focus:outline-none focus:border-[#0F766E]"
                  required
                />
                <span className="text-[10px] text-slate-400">BPM</span>
              </div>
            </div>

            {/* Body Temperature */}
            <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl space-y-1">
              <span className="kicker text-[10px] text-slate-500 block">BODY TEMP</span>
              <div className="flex items-baseline gap-1">
                <input
                  type="number"
                  step="0.1"
                  value={vitals.temp}
                  onChange={(e) => setVitals({ ...vitals, temp: e.target.value })}
                  className="font-mono text-xl font-semibold text-slate-900 w-16 bg-transparent border-b border-slate-300 focus:outline-none focus:border-[#0F766E]"
                  required
                />
                <span className="text-[10px] text-slate-400">°C</span>
              </div>
            </div>

            {/* Respiratory Rate */}
            <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl space-y-1">
              <span className="kicker text-[10px] text-slate-500 block">RESP. RATE</span>
              <div className="flex items-baseline gap-1">
                <input type="number" value={vitals.respiratoryRate}
                  onChange={(e) => setVitals({ ...vitals, respiratoryRate: e.target.value })}
                  className="font-mono text-xl font-semibold text-slate-900 w-16 bg-transparent border-b border-slate-300 focus:outline-none focus:border-[#0F766E]" required />
                <span className="text-[10px] text-slate-400">/min</span>
              </div>
            </div>

            {/* Oxygen Saturation */}
            <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl space-y-1">
              <span className="kicker text-[10px] text-slate-500 block">O2 SAT (SPO2)</span>
              <div className="flex items-baseline gap-1">
                <input
                  type="number"
                  value={vitals.spo2}
                  onChange={(e) => setVitals({ ...vitals, spo2: e.target.value })}
                  className="font-mono text-xl font-semibold text-blue-600 w-16 bg-transparent border-b border-slate-300 focus:outline-none focus:border-[#0F766E]"
                  required
                />
                <span className="text-[10px] text-slate-400">%</span>
              </div>
            </div>

            {/* Weight */}
            <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl space-y-1">
              <span className="kicker text-[10px] text-slate-500 block">WEIGHT</span>
              <div className="flex items-baseline gap-1">
                <input
                  type="number"
                  value={vitals.weight}
                  onChange={(e) => setVitals({ ...vitals, weight: e.target.value })}
                  className="font-mono text-xl font-semibold text-slate-900 w-16 bg-transparent border-b border-slate-300 focus:outline-none focus:border-[#0F766E]"
                  required
                />
                <span className="text-[10px] text-slate-400">kg</span>
              </div>
            </div>

            {/* Height */}
            <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl space-y-1">
              <span className="kicker text-[10px] text-slate-500 block">HEIGHT</span>
              <div className="flex items-baseline gap-1">
                <input
                  type="number"
                  value={vitals.height}
                  onChange={(e) => setVitals({ ...vitals, height: e.target.value })}
                  className="font-mono text-xl font-semibold text-slate-900 w-16 bg-transparent border-b border-slate-300 focus:outline-none focus:border-[#0F766E]"
                  required
                />
                <span className="text-[10px] text-slate-400">cm</span>
              </div>
            </div>
          </div>

          {/* DYNAMIC BMI DISPLAY BANNER (Resolves S3.6: Verify BMI 22.86 & Save) */}
          <div className="p-4 bg-teal-50/70 border border-teal-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-[#0F766E] text-white flex items-center justify-center font-bold text-base shadow-xs shrink-0">
                <Gauge className="w-5 h-5 text-emerald-200" />
              </div>
              <div>
                <div className="text-xs font-bold text-slate-900">
                  Computed Body Mass Index (BMI):{" "}
                  <span className="font-mono text-base font-semibold text-[#0F766E]">
                    {bmiVal} kg/m²
                  </span>
                </div>
                <div className="text-[11px] text-slate-600">
                  Formula: Weight ({vitals.weight} kg) / Height² ({vitals.height} cm)
                </div>
              </div>
            </div>

            <Badge variant="teal" size="md">Acuity must be assessed by clinical staff.</Badge>
          </div>

          <Textarea
            label="Nursing Triage Notes & Chief Complaint History"
            value={nurseNotes}
            onChange={(e) => setNurseNotes(e.target.value)}
            rows={3}
            placeholder="Record subjective intake comments, acute symptoms, or immediate nursing interventions..."
          />

          <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
            <div className="text-xs text-slate-500">Evaluation details are saved to the organization’s gnuhealth.</div>

            <Button
              type="submit"
              variant="primary"
              size="md"
              isLoading={isSubmitting}
              disabled={!patient.id || patientsList.length === 0}
              leftIcon={<Save className="w-4 h-4" />}
              className="bg-[#0F766E] hover:bg-[#115E59] font-bold"
            >
              Save Evaluation & Record Vitals
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
