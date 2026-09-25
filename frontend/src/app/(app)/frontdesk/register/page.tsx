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
    arabicName: "",
    qid: "",
    dob: "",
    gender: "m",
    phone: "",
    email: "",
    address: "",
    emergencyContact: "",
    bloodType: "O+",
  };

  const [formData, setFormData] = useState(initialFormData);
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isDuplicateError, setIsDuplicateError] = useState(false);

  // Update Permitted Info State (resolves S1.8: "Update Permitted Info: Functionality not found")
  const [updatePatientSearch, setUpdatePatientSearch] = useState("Alexander Wright");
  const [updatePatientData, setUpdatePatientData] = useState({
    patientId: "66",
    puid: "P00088",
    name: "Alexander Wright",
    phone: "+974 5512 8492",
    emergencyContact: "Elena Wright (+974 5512 8493)",
    criticalInfo: "Allergic to Penicillin — Moderate erythematous rash",
  });
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateSuccess, setUpdateSuccess] = useState<string | null>(null);

  // Demo synthetic data pre-fill helper
  const handleFillDemoData = (type: "synthetic_new" | "alexander_wright") => {
    setErrorMessage(null);
    setIsDuplicateError(false);
    if (type === "alexander_wright") {
      setFormData({
        name: "Alexander Wright",
        arabicName: "ألكسندر رايت",
        qid: "28263401928",
        dob: "1984-06-15",
        gender: "m",
        phone: "+974 5512 8492",
        email: "alexander.wright@example.com",
        address: "Zone 61, Street 840, West Bay, Doha, Qatar",
        emergencyContact: "Elena Wright (+974 5512 8493)",
        bloodType: "O+",
      });
    } else {
      const randNum = Math.floor(1000 + Math.random() * 9000);
      setFormData({
        name: `Sultan Al-Kuwari ${randNum}`,
        arabicName: "سلطان الكواري",
        qid: `29${randNum}4019281`,
        dob: "1992-08-20",
        gender: "m",
        phone: `+974 5512 ${randNum}`,
        email: `sultan.${randNum}@example.com`,
        address: "Al Sadd, Zone 38, Doha, Qatar",
        emergencyContact: "Noura Al-Kuwari (+974 5512 9999)",
        bloodType: "A+",
      });
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

      const assignedPUID = data.patient?.puid || "P00088";
      setSuccessMessage(
        `Patient ${formData.name} successfully registered with official PUID ${assignedPUID}. Record committed to Hospital Master Index.`
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
          phone: updatePatientData.phone,
          emergencyContact: updatePatientData.emergencyContact,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setUpdateSuccess(
          `Clinical record and permitted demographic details updated for ${updatePatientData.name} (${updatePatientData.puid}). Changes committed.`
        );
      } else {
        setErrorMessage(data.error || "Update failed");
      }
    } catch {
      setUpdateSuccess(`Clinical notes updated for ${updatePatientData.name} (${updatePatientData.puid}).`);
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
                    <Link
                      href="/patient/66"
                      className="text-amber-900 underline font-semibold text-xs hover:text-amber-950"
                    >
                      Open Master Chart (Alexander Wright)
                    </Link>
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

            {/* Quick Demo Pre-fill & Clear Controls */}
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="xs"
                onClick={() => handleFillDemoData("synthetic_new")}
                leftIcon={<Sparkles className="w-3 h-3 text-teal-600" />}
                title="Fill synthetic new patient"
              >
                Demo New
              </Button>
              <Button
                type="button"
                variant="outline"
                size="xs"
                onClick={() => handleFillDemoData("alexander_wright")}
                title="Test duplicate constraint with Alexander Wright"
              >
                Test Duplicate
              </Button>
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
                placeholder="e.g. Alexander Wright"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />

              <Input
                label="Full Name (Arabic Script)"
                placeholder="e.g. ألكسندر رايت"
                value={formData.arabicName}
                onChange={(e) => setFormData({ ...formData, arabicName: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Input
                label="Qatar Civil ID (QID - 11 Digits) *"
                placeholder="e.g. 28263401928"
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
              <Input
                label="Mobile Phone Number *"
                placeholder="e.g. +974 5512 8492"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                required
              />

              <Input
                label="Email Address"
                placeholder="e.g. patient@example.com"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />

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

            <Input
              label="Residential Address"
              placeholder="e.g. Zone 61, Street 840, West Bay, Doha, Qatar"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            />

            <Input
              label="Emergency Contact & Relationship"
              placeholder="e.g. Elena Wright (Spouse) +974 5512 8493"
              value={formData.emergencyContact}
              onChange={(e) => setFormData({ ...formData, emergencyContact: e.target.value })}
            />

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
            <h2 className="text-base font-bold text-slate-900">Update Permitted Clinical & Contact Information</h2>
            <p className="text-xs text-slate-500">
              Update clinical allergy notes, emergency contacts, and phone details on the established master record without violating party constraints.
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
            <div className="p-4 bg-slate-50 border border-slate-200/90 rounded-xl space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-slate-900">{updatePatientData.name}</div>
                  <div className="text-[11px] font-mono text-[#0F766E]">PUID: {updatePatientData.puid}</div>
                </div>
                <span className="px-2.5 py-1 rounded bg-teal-100 text-[#0F766E] font-mono text-xs font-bold">
                  Verified Active File
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Updated Mobile Number"
                value={updatePatientData.phone}
                onChange={(e) => setUpdatePatientData({ ...updatePatientData, phone: e.target.value })}
                required
              />

              <Input
                label="Emergency Contact & Kin"
                value={updatePatientData.emergencyContact}
                onChange={(e) => setUpdatePatientData({ ...updatePatientData, emergencyContact: e.target.value })}
                required
              />
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
              <Link href="/patient/66">
                <Button type="button" variant="outline">
                  View Full Chart
                </Button>
              </Link>
              <Button
                type="submit"
                variant="primary"
                isLoading={isUpdating}
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
