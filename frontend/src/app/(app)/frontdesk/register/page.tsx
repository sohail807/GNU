"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  UserCheck,
  Phone,
  MapPin,
  HeartHandshake,
  Sparkles,
  RotateCcw,
  Edit3,
  Search,
  UserPlus,
  AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";

export default function PatientRegistrationPage() {
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<"new" | "update">("new");

  // Clean initial state (resolves S1.4: "When we click on new registration, old Patient details still reflects")
  const initialFormData = {
    name: "",
    qid: "",
    dob: "",
    gender: "",
    bloodType: "",
  };

  const [formData, setFormData] = useState(initialFormData);
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isDuplicateError, setIsDuplicateError] = useState(false);

  // Update Permitted Info State (resolves S1.8: "Update Permitted Info: Functionality not found")
  const [updatePatientSearch, setUpdatePatientSearch] = useState("");
  const [updatePatientResults, setUpdatePatientResults] = useState<Array<{ id: number; name: string; puid: string }>>([]);
  const [updatePatientData, setUpdatePatientData] = useState({
    patientId: "",
    puid: "",
    name: "",
    criticalInfo: "",
  });
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateSuccess, setUpdateSuccess] = useState<string | null>(null);

  const searchExistingPatients = async () => {
    setUpdateSuccess(null);
    setErrorMessage(null);
    if (!updatePatientSearch.trim()) {
      setErrorMessage("Enter a patient name or clinical system PUID to search.");
      return;
    }
    try {
      const response = await fetch(`/api/clinical/patients?q=${encodeURIComponent(updatePatientSearch.trim())}`);
      const data = await response.json();
      if (!response.ok || !Array.isArray(data.patients)) throw new Error(data.error || "Patient search failed.");
      setUpdatePatientResults(data.patients.map((patient: { id: number; name: string; puid: string }) => ({ id: patient.id, name: patient.name, puid: patient.puid })));
      if (data.patients.length === 0) setErrorMessage("No matching patient was found.");
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Patient search failed.");
    }
  };

  const handleClearForm = () => {
    setFormData(initialFormData);
    setErrorMessage(null);
    setIsDuplicateError(false);
    setSuccessMessage(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage(null);
    setIsDuplicateError(false);
    setSuccessMessage(null);

    // Validation for QID (11 digits required in Qatar)
    if (!/^\d{11}$/.test(formData.qid.replace(/\s+/g, ""))) {
      setErrorMessage("Qatar Civil ID (QID) must consist of exactly 11 digits.");
      setIsLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/clinical/patients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          qid: formData.qid,
          dob: formData.dob,
          gender: formData.gender,
          bloodType: formData.bloodType,
        }),
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        if (res.status === 409 || data.isDuplicate || data.error?.toLowerCase().includes("duplicate") || data.error?.toLowerCase().includes("unique")) {
          setIsDuplicateError(true);
        }
        throw new Error(data.error || "Failed to register patient in hospital registry");
      }

      const assignedPUID = data.patient?.puid;
      setSuccessMessage(
        assignedPUID
          ? `Patient ${formData.name} registered with clinical system PUID ${assignedPUID}.`
          : `Patient ${formData.name} registered. clinical system did not return a PUID; verify the record before continuing.`
      );

      setTimeout(() => {
        router.push("/frontdesk");
      }, 2000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to register patient";
      setErrorMessage(msg);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Update Permitted Info
  const handleUpdatePermittedInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdating(true);
    setUpdateSuccess(null);
    try {
      const res = await fetch("/api/clinical/patients", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patientId: updatePatientData.patientId,
          criticalInfo: updatePatientData.criticalInfo,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setUpdateSuccess(
          `clinical system critical information updated for ${updatePatientData.name} (${updatePatientData.puid}).`
        );
      } else {
        setErrorMessage(data.error || "Update failed");
      }
    } catch {
      setErrorMessage("Could not reach the patient service. No update was confirmed; check the record before retrying.");
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-7 animate-fade-in">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-slate-200/90 gap-4">
        <div>
          <Link
            href="/frontdesk"
            className="text-xs font-mono uppercase tracking-wider text-slate-500 hover:text-slate-900 flex items-center gap-1.5 mb-2 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Intake Queue</span>
          </Link>
          <div className="kicker text-[#0F766E] mb-1">CIVIL REGISTRATION · PATIENT ONBOARDING</div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Patient Demographic Registration & File Management
          </h1>
        </div>

        {/* Tab Switcher: New Registration vs Update Existing Record */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl border border-slate-200 text-xs font-semibold">
          <button
            onClick={() => setActiveTab("new")}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg transition-all ${
              activeTab === "new"
                ? "bg-white text-slate-900 shadow-xs font-bold"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <UserPlus className="w-3.5 h-3.5 text-[#0F766E]" />
            <span>New Registration</span>
          </button>

          <button
            onClick={() => setActiveTab("update")}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg transition-all ${
              activeTab === "update"
                ? "bg-white text-slate-900 shadow-xs font-bold"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Edit3 className="w-3.5 h-3.5 text-[#0F766E]" />
            <span>Update Permitted Info</span>
          </button>
        </div>
      </div>

      {/* SUCCESS BANNER */}
      {successMessage && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center justify-between shadow-2xs font-medium">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successMessage}</span>
          </div>
          <Link
            href="/frontdesk"
            className="font-bold underline text-emerald-900 flex items-center gap-1"
          >
            Return to Queue
          </Link>
        </div>
      )}

      {/* ERROR & DUPLICATE PREVENTION BANNER (Resolves S1.9: "Error should shown as Duplicate Patient") */}
      {errorMessage && (
        <div
          className={`p-4 rounded-xl border text-xs shadow-2xs font-medium ${
            isDuplicateError
              ? "bg-amber-50 border-amber-300 text-amber-900"
              : "bg-rose-50 border-rose-200 text-rose-800"
          }`}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-2.5">
              {isDuplicateError ? (
                <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              )}
              <div className="space-y-1">
                <div className="font-bold text-sm">
                  {isDuplicateError ? "Duplicate Patient Warning (gnuhealth_patient_name_uniq)" : "Registration Error"}
                </div>
                <p className="leading-relaxed">
                  {errorMessage}
                </p>
                {isDuplicateError && (
                  <div className="pt-2 flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setActiveTab("update")}
                      className="px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold"
                    >
                      Switch to Update Existing Record
                    </button>
                  </div>
                )}
              </div>
            </div>
            <button
              onClick={() => {
                setErrorMessage(null);
                setIsDuplicateError(false);
              }}
              className="text-slate-400 hover:text-slate-700 font-bold"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* TAB 1: NEW PATIENT REGISTRATION FORM */}
      {activeTab === "new" && (
        <div className="bg-white border border-slate-200/90 rounded-2xl p-6 sm:p-8 shadow-2xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
            <div>
              <span className="kicker text-[#0F766E] block mb-0.5">NEW MASTER PATIENT INDEX FILE</span>
              <h2 className="text-base font-bold text-slate-900">Demographic Intake Form</h2>
              <p className="text-xs text-slate-500">All fields marked with an asterisk (*) are mandatory for MPI commit.</p>
            </div>

            {/* Clear Controls */}
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="ghost"
                size="xs"
                onClick={handleClearForm}
                leftIcon={<RotateCcw className="w-3 h-3" />}
              >
                Clear Form
              </Button>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Full Legal Name (English) *"
                placeholder="Enter the patient’s legal name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />

            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Input
                label="Qatar Civil ID (QID - 11 Digits) *"
                placeholder="11 digit Qatar Civil ID"
                value={formData.qid}
                onChange={(e) => setFormData({ ...formData, qid: e.target.value })}
                required
              />

              <Input
                label="Date of Birth *"
                type="date"
                value={formData.dob}
                onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
                required
              />

              <Select
                label="Biological Sex *"
                value={formData.gender}
                onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                options={[
                  { value: "m", label: "Male" },
                  { value: "f", label: "Female" },
                ]}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Select
                label="Blood Group (ABO/Rh)"
                value={formData.bloodType}
                onChange={(e) => setFormData({ ...formData, bloodType: e.target.value })}
                options={[
                  { value: "O+", label: "O Positive (O+)" },
                  { value: "O-", label: "O Negative (O-)" },
                  { value: "A+", label: "A Positive (A+)" },
                  { value: "A-", label: "A Negative (A-)" },
                  { value: "B+", label: "B Positive (B+)" },
                  { value: "B-", label: "B Negative (B-)" },
                  { value: "AB+", label: "AB Positive (AB+)" },
                  { value: "AB-", label: "AB Negative (AB-)" },
                ]}
              />
            </div>

            <p className="text-xs text-slate-600">This registration stores the demographic fields currently mapped to clinical system. Contact details and Arabic name are not collected here.</p>

            <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
              <span className="text-xs text-slate-500 font-mono">
                Assigned Medical Record Identifier: <strong className="text-teal-700">Auto-Generated PUID</strong>
              </span>

              <div className="flex items-center gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleClearForm}
                >
                  Reset
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  isLoading={isLoading}
                  leftIcon={<CheckCircle2 className="w-4 h-4" />}
                >
                  Commit Patient Registration
                </Button>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* TAB 2: UPDATE PERMITTED INFO (Resolves S1.8: "Update Permitted Info: Functionality not found") */}
      {activeTab === "update" && (
        <div className="bg-white border border-slate-200/90 rounded-2xl p-6 sm:p-8 shadow-2xs space-y-6">
          <div className="pb-4 border-b border-slate-100">
            <span className="kicker text-[#0F766E] block mb-0.5">EXISTING PATIENT MASTER FILE</span>
            <h2 className="text-base font-bold text-slate-900">Update Clinical Critical Information</h2>
            <p className="text-xs text-slate-500">
              Select an existing patient, then update the clinical system critical information field.
            </p>
          </div>

          {updateSuccess && (
            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center justify-between font-medium">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{updateSuccess}</span>
              </div>
              <button onClick={() => setUpdateSuccess(null)} className="text-emerald-700 font-bold">✕</button>
            </div>
          )}

          <form onSubmit={handleUpdatePermittedInfo} className="space-y-5">
            <div className="flex items-end gap-3">
              <Input label="Find Existing Patient" value={updatePatientSearch} onChange={(event) => setUpdatePatientSearch(event.target.value)} placeholder="Patient name or PUID" />
              <Button type="button" variant="outline" onClick={searchExistingPatients} leftIcon={<Search className="w-4 h-4" />}>Search</Button>
            </div>
            {updatePatientResults.length > 0 && (
              <div className="space-y-2" aria-label="Patient search results">
                {updatePatientResults.map((patient) => (
                  <button key={patient.id} type="button" onClick={() => { setUpdatePatientData((current) => ({ ...current, patientId: String(patient.id), name: patient.name, puid: patient.puid })); setUpdatePatientResults([]); setUpdateSuccess(null); }} className="w-full rounded-lg border border-slate-200 p-3 text-left text-sm hover:border-teal-600">
                    {patient.name} <span className="ml-2 text-slate-500">{patient.puid}</span>
                  </button>
                ))}
              </div>
            )}
            <div className="p-4 bg-slate-50 border border-slate-200/90 rounded-xl space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-slate-900">{updatePatientData.name}</div>
                  <div className="text-[11px] font-mono text-[#0F766E]">PUID: {updatePatientData.puid}</div>
                </div>
                {updatePatientData.patientId && <span className="px-2.5 py-1 rounded bg-teal-100 text-[#0F766E] font-mono text-xs font-bold">Selected patient record</span>}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <p className="text-xs text-slate-600">This action updates clinical system’s critical information field only. Phone, address, and emergency contact edits are not available in this frontend.</p>
            </div>

            <Textarea
              label="Clinical Critical Information & Allergies *"
              value={updatePatientData.criticalInfo}
              onChange={(e) => setUpdatePatientData({ ...updatePatientData, criticalInfo: e.target.value })}
              rows={3}
              placeholder="e.g. Allergic to Penicillin — Moderate rash"
                required
            />

            <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
              <Button
                type="submit"
                variant="primary"
                isLoading={isUpdating}
                disabled={!updatePatientData.patientId}
                leftIcon={<CheckCircle2 className="w-4 h-4" />}
              >
                Save Permitted Information
              </Button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
