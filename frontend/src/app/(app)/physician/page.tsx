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
import { AllergyPanel } from "@/components/app/AllergyPanel";
import { WorkupOrders } from "@/components/app/WorkupOrders";
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
  id: number;
  name: string;
  genericName: string;
  strength: number | null;
  doseUnitId: number | null;
  doseUnit: string | null;
  routeId: number | null;
  route: string | null;
  formId: number | null;
  form: string | null;
  pregnancyWarning: boolean;
}

const DRUG_FORMULARY: DrugFormularyItem[] = [];

interface PrescriptionLine {
  id: number;
  medicamentId: number;
  medicament: string;
  dose: string;
  doseUnitId: number;
  doseUnit: string;
  routeId: number;
  route: string;
  frequency: string;
  frequencyUnit: string;
  duration: string;
  durationPeriod: string;
  status: "draft";
}

interface CatalogOption {
  id: number;
  name: string;
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
    allergiesLoaded: false, allergiesRestricted: false,
    vitals: {
      bp: "", bpm: null as number | null, temp: null as number | null, spo2: null as number | null, bmi: "",
    },
  });

  const [soapData, setSoapData] = useState({
    chiefComplaint: "", physicalExam: "", diagnosisCode: "", diagnosisName: "", treatmentPlan: "",
  });

  // Prescriptions state (Resolves S4.6 & S4.8: RX-2026-0029)
  const [prescriptionRef, setPrescriptionRef] = useState("");
  const [pendingPrescriptionId, setPendingPrescriptionId] = useState<number | null>(null);
  const [prescriptions, setPrescriptions] = useState<PrescriptionLine[]>([]);
  const [routeOptions, setRouteOptions] = useState<CatalogOption[]>([]);
  const [doseUnitOptions, setDoseUnitOptions] = useState<CatalogOption[]>([]);
  const [acknowledgeWarnings, setAcknowledgeWarnings] = useState(false);
  const [safetyWarnings, setSafetyWarnings] = useState<string[]>([]);
  const [isOrderingWorkup, setIsOrderingWorkup] = useState<"lab" | "radiology" | null>(null);

  // Diagnostic Workup catalogs, loaded live from GNU Health so the physician can order any
  // active lab test / imaging study on file -- not just the one hardcoded example of each.
  const [isLabModalOpen, setIsLabModalOpen] = useState(false);
  const [isImagingModalOpen, setIsImagingModalOpen] = useState(false);
  const [labTestOptions, setLabTestOptions] = useState<CatalogOption[]>([]);
  const [imagingTestOptions, setImagingTestOptions] = useState<CatalogOption[]>([]);
  const [selectedLabTestId, setSelectedLabTestId] = useState<number | null>(null);
  const [selectedImagingTestId, setSelectedImagingTestId] = useState<number | null>(null);
  const [labSearchTerm, setLabSearchTerm] = useState("");
  const [imagingSearchTerm, setImagingSearchTerm] = useState("");

  // Modal States
  const [isIcdModalOpen, setIsIcdModalOpen] = useState(false);
  const [icdSearchTerm, setIcdSearchTerm] = useState("");
  const [isRxModalOpen, setIsRxModalOpen] = useState(false);
  const [drugSearchTerm, setDrugSearchTerm] = useState("");
  const [selectedDrug, setSelectedDrug] = useState<DrugFormularyItem | null>(null);
  const [newRx, setNewRx] = useState({
    medicamentId: 0, medicament: "", dose: "", doseUnitId: 0, doseUnit: "",
    routeId: 0, route: "", formId: 0, frequency: "", frequencyUnit: "hours",
    duration: "", durationPeriod: "days",
  });

  const [isSaving, setIsSaving] = useState(false);
  const [resumedEval, setResumedEval] = useState<number | null>(null);
  // The evaluation id just completed here, so the banner and badge stop calling it "in progress".
  const [completedEval, setCompletedEval] = useState<number | null>(null);
  // The patient's latest evaluation is already done or signed (so the header does not claim a consultation is active).
  const [lastEvalDone, setLastEvalDone] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Live ICD-10 Search State
  const [liveIcdResults, setLiveIcdResults] = useState<ICD10Item[]>([]);
  const [isIcdSearching, setIsIcdSearching] = useState(false);

  // Live Drug Formulary Search State
  const [liveDrugResults, setLiveDrugResults] = useState<DrugFormularyItem[]>([]);
  const [isDrugSearching, setIsDrugSearching] = useState(false);

  // Live ICD-10 debounced search against GNU Health gnuhealth.pathology
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
              category: "GNU Health Pathology",
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

  // Live Formulary debounced search against GNU Health gnuhealth.medicament
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
          setLiveDrugResults(data.medicaments);
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

  useEffect(() => {
    if (!isRxModalOpen) return;
    fetch("/api/clinical/medicaments?catalog=routes")
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok || !data.success || !Array.isArray(data.items)) {
          throw new Error(data.error || "Unable to load administration routes");
        }
        setRouteOptions(data.items);
      })
      .catch((error: unknown) => {
        setErrorMessage(error instanceof Error ? error.message : "Unable to load administration routes");
      });
    fetch("/api/clinical/medicaments?catalog=doseUnits")
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok || !data.success || !Array.isArray(data.items)) {
          throw new Error(data.error || "Unable to load dose units");
        }
        setDoseUnitOptions(data.items);
      })
      .catch((error: unknown) => {
        setErrorMessage(error instanceof Error ? error.message : "Unable to load dose units");
      });
  }, [isRxModalOpen]);

  useEffect(() => {
    if (!isLabModalOpen) return;
    fetch("/api/clinical/laboratory?catalog=tests")
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok || !data.success || !Array.isArray(data.tests)) {
          throw new Error(data.error || "Unable to load the laboratory test catalog");
        }
        setLabTestOptions(data.tests.map((t: { id: number; name: string }) => ({ id: t.id, name: t.name })));
      })
      .catch((error: unknown) => {
        setErrorMessage(error instanceof Error ? error.message : "Unable to load the laboratory test catalog");
      });
  }, [isLabModalOpen]);

  useEffect(() => {
    if (!isImagingModalOpen) return;
    fetch("/api/clinical/radiology")
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok || !data.success || !Array.isArray(data.testTypes)) {
          throw new Error(data.error || "Unable to load the imaging test catalog");
        }
        setImagingTestOptions(data.testTypes);
      })
      .catch((error: unknown) => {
        setErrorMessage(error instanceof Error ? error.message : "Unable to load the imaging test catalog");
      });
  }, [isImagingModalOpen]);

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
              allergiesLoaded: match.allergiesLoaded === true, allergiesRestricted: match.allergiesRestricted === true,
              vitals: { bp: "", bpm: null, temp: null, spo2: null, bmi: "" },
            });
            loadLatestVitals(match.id);
          }
        }
      } catch {
        setErrorMessage("Could not load patient records from GNU Health.");
      }
    }
    loadPatientData();
  }, [initialPatientId]);

  // Load the patient's most recent nursing triage vitals, if any. Never
  // fabricated - a patient with no triage evaluation on file shows blank
  // vitals, not made-up numbers.
  //
  // This also resumes the same GNU Health evaluation record nursing already
  // opened for this encounter (when it's still "in_progress"), rather than
  // always starting a fresh one on save. Without this, saving SOAP notes
  // forked a second, orphaned evaluation with no vitals on it, while the
  // nurse's original evaluation was left with vitals but no diagnosis/notes -
  // confirmed live: two separate "in_progress" evaluations for one visit
  // instead of the single combined record this same model already produces
  // when a physician's own evaluation carries both vitals and SOAP content.
  const loadLatestVitals = async (patientId: number) => {
    try {
      const res = await fetch(`/api/clinical/triage?patientId=${patientId}`);
      const data = await res.json();
      if (data.success && Array.isArray(data.evaluations) && data.evaluations.length > 0) {
        const latest = data.evaluations[0];
        setPatient((prev) => ({
          ...prev,
          vitals: {
            bp: latest.systolic != null && latest.diastolic != null ? `${latest.systolic}/${latest.diastolic}` : "",
            bpm: latest.bpm ?? null,
            temp: latest.temperature ?? null,
            spo2: latest.osat ?? null,
            bmi: latest.bmi != null ? String(latest.bmi) : "",
          },
        }));
        setEvaluationId(latest.state === "in_progress" ? latest.id : 0);
        setLastEvalDone(["done", "signed"].includes(latest.state));
      } else {
        setEvaluationId(0);
        setLastEvalDone(false);
      }
      // Show the assessment already saved for this visit (so the doctor sees it again instead of a blank form).
      try {
        const cRes = await fetch(`/api/clinical/consultations?patientId=${patientId}`);
        const cData = await cRes.json();
        const open = (cData.consultations || []).find((c: any) => c.state === "in_progress");
        if (open) {
          setSoapData({
            chiefComplaint: open.chief_complaint || "", physicalExam: open.evaluation_summary || "",
            diagnosisCode: open.diagnosisCode || "", diagnosisName: open.diagnosisName || "", treatmentPlan: open.directions || "",
          });
          setEvaluationId(open.id);
          setResumedEval(open.id);
        } else {
          setSoapData({ chiefComplaint: "", physicalExam: "", diagnosisCode: "", diagnosisName: "", treatmentPlan: "" });
          setResumedEval(null);
        }
      } catch {
        setResumedEval(null);
      }
    } catch {
      // Leave vitals blank rather than show stale/wrong data
      setEvaluationId(0);
    }
  };

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
        allergiesLoaded: match.allergiesLoaded === true, allergiesRestricted: match.allergiesRestricted === true,
        vitals: { bp: "", bpm: null, temp: null, spo2: null, bmi: "" },
      }));
      setEvaluationId(0);
      setFeedback(null);
      setErrorMessage(null);
      loadLatestVitals(match.id);
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
      medicamentId: drug.id,
      medicament: drug.name,
      dose: drug.strength ? String(drug.strength) : "",
      doseUnitId: drug.doseUnitId || 0,
      doseUnit: drug.doseUnit || "",
      routeId: drug.routeId || 0,
      route: drug.route || "",
      formId: drug.formId || 0,
      frequency: "",
      frequencyUnit: "hours",
      duration: "",
      durationPeriod: "days",
    });
  };

  // Add Prescription Line (Resolves S4.7)
  const handleAddPrescription = (e: React.FormEvent) => {
    e.preventDefault();
    const doseValue = Number(newRx.dose);
    const frequencyValue = Number(newRx.frequency);
    const durationValue = Number(newRx.duration);
    if (!selectedDrug || !newRx.doseUnitId || !newRx.routeId || !Number.isFinite(doseValue) || doseValue <= 0 || !Number.isSafeInteger(frequencyValue) || frequencyValue <= 0 || !Number.isSafeInteger(durationValue) || durationValue <= 0) {
      setErrorMessage("Choose a medication and complete its dose, route, frequency, and duration.");
      return;
    }
    const line: PrescriptionLine = {
      id: prescriptions.length + 1,
      medicamentId: newRx.medicamentId,
      medicament: newRx.medicament,
      dose: newRx.dose,
      doseUnitId: newRx.doseUnitId,
      doseUnit: newRx.doseUnit,
      routeId: newRx.routeId,
      route: newRx.route || routeOptions.find((item) => item.id === newRx.routeId)?.name || "",
      frequency: newRx.frequency,
      frequencyUnit: newRx.frequencyUnit,
      duration: newRx.duration,
      durationPeriod: newRx.durationPeriod,
      status: "draft",
    };
    setPrescriptions([...prescriptions, line]);
    setIsRxModalOpen(false);
    setFeedback(`Draft medication line added: ${line.medicament}. It has not yet been issued.`);
    setErrorMessage(null);
  };

  // Create / Issue Prescription (Resolves S4.8 - Real GNU Health Persistence)
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
          acknowledgeWarnings,
          lines: prescriptions.map((p) => ({
            medicamentId: p.medicamentId,
            dose: p.dose,
            routeId: p.routeId,
            frequency: p.frequency,
            frequencyUnit: p.frequencyUnit,
            duration: p.duration,
            durationPeriod: p.durationPeriod,
          })),
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        if (data.requiresAcknowledgement && Array.isArray(data.warnings)) { setSafetyWarnings(data.warnings); setAcknowledgeWarnings(false); }
        if (data.prescriptionId) setPendingPrescriptionId(Number(data.prescriptionId));
        throw new Error(data.error || "Failed to persist prescription in GNU Health");
      }
      setSafetyWarnings([]);
      const ref = data.reference || String(data.prescriptionId || "");
      setPendingPrescriptionId(null);
      setPrescriptionRef(ref);
      setPrescriptions([]);
      setAcknowledgeWarnings(false);
      setFeedback(`Prescription ${ref} was saved for ${patient.name} and sent to pharmacy for dispensing.`);
    } catch (err: any) {
      setErrorMessage(err.message || "Error issuing prescription order");
    } finally {
      setIsSaving(false);
    }
  };

  const handleIssuePrescriptionDraft = async () => {
    if (!pendingPrescriptionId) return;
    setIsSaving(true);
    setErrorMessage(null);
    try {
      const res = await fetch("/api/clinical/prescriptions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "issue", prescriptionId: pendingPrescriptionId }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || "The draft could not be issued.");
      setPrescriptionRef(data.reference || String(data.prescriptionId));
      setPendingPrescriptionId(null);
      setPrescriptions([]);
      setAcknowledgeWarnings(false);
      setFeedback(`Prescription ${data.reference || data.prescriptionId} was issued by GNU Health.`);
    } catch (error: unknown) {
      setErrorMessage(error instanceof Error ? error.message : "The draft could not be issued.");
    } finally {
      setIsSaving(false);
    }
  };

  // Diagnostic Workup Requisitions: these used to be plain navigation links to /laboratory
  // and /radiology that created nothing and dropped the patient's consultation context --
  // they now place the order directly from here, the same way prescriptions are issued.
  // The physician picks the actual test/study from the live GNU Health catalog (not a single
  // hardcoded example) via the lab/imaging picker modals below.
  const handleOrderLabTest = async () => {
    if (!patient.id || !selectedLabTestId) return;
    setIsOrderingWorkup("lab");
    setFeedback(null);
    setErrorMessage(null);
    try {
      const res = await fetch("/api/clinical/laboratory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ patientId: patient.id, testId: selectedLabTestId }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || "The lab order could not be created.");
      const testName = labTestOptions.find((t) => t.id === selectedLabTestId)?.name || "Lab";
      setFeedback(`${testName} lab order ${data.orderRef || data.labId} was requested for ${patient.name}.`);
      setIsLabModalOpen(false);
      setSelectedLabTestId(null);
      setLabSearchTerm("");
    } catch (error: unknown) {
      setErrorMessage(error instanceof Error ? error.message : "The lab order could not be created.");
    } finally {
      setIsOrderingWorkup(null);
    }
  };

  const handleOrderImaging = async () => {
    if (!patient.id || !selectedImagingTestId) return;
    setIsOrderingWorkup("radiology");
    setFeedback(null);
    setErrorMessage(null);
    try {
      const res = await fetch("/api/clinical/radiology", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "create", patientId: patient.id, testId: selectedImagingTestId }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || "The imaging request could not be created.");
      const testName = imagingTestOptions.find((t) => t.id === selectedImagingTestId)?.name || "Imaging";
      setFeedback(`${testName} request #${data.orderId} was scheduled for ${patient.name}.`);
      setIsImagingModalOpen(false);
      setSelectedImagingTestId(null);
      setImagingSearchTerm("");
    } catch (error: unknown) {
      setErrorMessage(error instanceof Error ? error.message : "The imaging request could not be created.");
    } finally {
      setIsOrderingWorkup(null);
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
        throw new Error(data.error || "Failed to save evaluation to GNU Health");
      }
      if (data.evaluationId) setEvaluationId(data.evaluationId);
      setFeedback(`GNU Health evaluation ${data.evaluationId || ""} saved.`);
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to save evaluation to GNU Health");
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
        throw new Error(data.error || "Failed to complete evaluation in GNU Health");
      }
      setFeedback(`GNU Health evaluation ${data.evaluationId || evaluationId || ""} completed.`);
      setCompletedEval(Number(data.evaluationId || evaluationId) || null);
      setLastEvalDone(true);
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to complete evaluation in GNU Health");
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
      d.genericName.toLowerCase().includes(q)
    );
  });

  return (
    <div className="max-w-7xl mx-auto space-y-7 animate-fade-in">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-slate-200/90 gap-4">
        <div>
          <div className="kicker text-[#0F766E] mb-1">CLINICAL HEALTH · CONSULTING ROOM 04</div>
          <h1 className="text-xl sm:text-2xl font-semibold text-slate-900 tracking-tight">
            Physician Consultation & Clinical Cockpit
          </h1>
          <p className="text-xs text-slate-600 mt-1">
            {evaluationId ? <>GNU Health Evaluation ID: <span className="font-mono font-bold text-slate-900">{evaluationId}</span> · </> : null}
            Attending clinician is resolved from the current GNU Health session.
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

      {resumedEval && completedEval !== resumedEval && (
        <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 font-medium">
          An assessment for this patient is already in progress (evaluation #{resumedEval}). It has been reopened below with what was saved; saving again updates that same assessment instead of starting a second one.
        </div>
      )}
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
                {lastEvalDone ? (
                  <Badge variant="green" dot>Consultation Completed</Badge>
                ) : (
                  <Badge variant="blue" dot>Consultation Active</Badge>
                )}
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
              {patient.allergies.length === 0 && (
                <span className="text-xs text-slate-500">
                  {patient.allergiesLoaded
                    ? "No known allergies on file."
                    : patient.allergiesRestricted
                      ? "Not visible to your role."
                      : "Allergy information could not be loaded."}
                </span>
              )}
            </div>
            {patient.id > 0 && !patient.allergiesRestricted && <div className="w-full"><AllergyPanel patientId={patient.id} /></div>}
          </div>
        </div>

        {/* Vital Signs Strip (from Nursing Triage S3.6) */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-1">
          <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl">
            <span className="kicker text-[10px] text-slate-400 block mb-1">BLOOD PRESSURE</span>
            <div className="font-mono text-lg font-semibold text-slate-900 flex items-center gap-1.5">
              <Heart className="w-3.5 h-3.5 text-red-500" />
              <span>{patient.vitals.bp}</span>
              <span className="text-[10px] text-slate-400 font-normal">mmHg</span>
            </div>
          </div>

          <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl">
            <span className="kicker text-[10px] text-slate-400 block mb-1">HEART RATE</span>
            <div className="font-mono text-lg font-semibold text-[#0F766E] flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-[#0F766E]" />
              <span>{patient.vitals.bpm}</span>
              <span className="text-[10px] text-slate-400 font-normal">BPM</span>
            </div>
          </div>

          <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl">
            <span className="kicker text-[10px] text-slate-400 block mb-1">BODY TEMP</span>
            <div className="font-mono text-lg font-semibold text-slate-900 flex items-center gap-1.5">
              <Thermometer className="w-3.5 h-3.5 text-emerald-600" />
              <span>{patient.vitals.temp}</span>
              <span className="text-[10px] text-slate-400 font-normal">°C</span>
            </div>
          </div>

          <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl">
            <span className="kicker text-[10px] text-slate-400 block mb-1">OXYGEN SAT (SPO2)</span>
            <div className="font-mono text-lg font-semibold text-blue-600 flex items-center gap-1.5">
              <Wind className="w-3.5 h-3.5 text-blue-500" />
              <span>{patient.vitals.spo2}</span>
              <span className="text-[10px] text-slate-400 font-normal">%</span>
            </div>
          </div>

          <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl">
            <span className="kicker text-[10px] text-slate-400 block mb-1">BODY MASS INDEX</span>
            <div className="font-mono text-lg font-semibold text-slate-900">
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
              <Badge variant="teal">GNU Health Clinical Model</Badge>
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
                    <Badge variant="amber" size="sm">Draft</Badge>
                  </div>
                  <div className="text-[11px] font-mono text-slate-500">
                    Dose: <strong className="text-slate-700">{rx.dose} {rx.doseUnit}</strong> · Route: {rx.route || routeOptions.find((item) => item.id === rx.routeId)?.name || "Oral"} · Every {rx.frequency} {rx.frequencyUnit} · Duration: {rx.duration} {rx.durationPeriod}
                  </div>
                </div>
              ))}
            </div>

            {safetyWarnings.length > 0 && (
              <div className="rounded-lg border border-red-300 bg-red-50 p-3 text-xs text-red-900 space-y-2">
                <div className="font-bold">Safety warning</div>
                <ul className="list-disc pl-4">{safetyWarnings.map((w) => <li key={w}>{w}</li>)}</ul>
                <label className="flex items-start gap-2">
                  <input type="checkbox" checked={acknowledgeWarnings} onChange={(event) => setAcknowledgeWarnings(event.target.checked)} className="mt-0.5 accent-[#0F766E]" />
                  <span>I have reviewed this warning and want to prescribe anyway.</span>
                </label>
              </div>
            )}
            {patient.allergies.length > 0 && (
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900"><strong>Recorded allergies:</strong> {patient.allergies.join(", ")}. Verify these clinically before prescribing.</div>
            )}
            {pendingPrescriptionId && (
              <div className="flex items-center justify-between rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
                <span>Prescription draft {pendingPrescriptionId} is saved and needs issue confirmation.</span>
                <Button type="button" variant="outline" size="xs" onClick={handleIssuePrescriptionDraft} isLoading={isSaving}>Retry issue</Button>
              </div>
            )}
            {/* CREATE PRESCRIPTION BUTTON (Resolves S4.8: Create Prescription) */}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
              <span className="text-[11px] font-mono text-slate-500">{prescriptions.length} line(s)</span>
              <Button
                type="button"
                variant="primary"
                size="sm"
                onClick={handleCreatePrescription}
                disabled={!patient.id || prescriptions.length === 0 || (safetyWarnings.length > 0 && !acknowledgeWarnings) || Boolean(pendingPrescriptionId) || isSaving}
                isLoading={isSaving}
                leftIcon={<FileCheck className="w-4 h-4" />}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
              >
                CREATE PRESCRIPTION ({prescriptionRef})
              </Button>
            </div>
          </div>

          {/* Diagnostic Investigation Orders */}
          <WorkupOrders patientId={patient.id} patientName={patient.name} />
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
                Searching GNU Health ICD-10 database...
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
                Searching GNU Health Formulary...
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

            <div className="grid grid-cols-3 gap-3">
              <Input label="Dose" type="number" min="0.0001" step="any" value={newRx.dose} onChange={(e) => setNewRx({ ...newRx, dose: e.target.value })} required />
              {/* The selected medicament's own catalog record supplies a default unit, but that
                  record can leave it blank (as GNU Health's own seed data does for at least one
                  demo medicament) -- without a manual override here, prescribing that drug was
                  permanently blocked with no way for the physician to recover. */}
              <Select
                label="Dose Unit"
                value={String(newRx.doseUnitId || "")}
                onChange={(e) => {
                  const doseUnitId = Number(e.target.value);
                  setNewRx({ ...newRx, doseUnitId, doseUnit: doseUnitOptions.find((item) => item.id === doseUnitId)?.name || "" });
                }}
                options={[{ value: "", label: "Select unit" }, ...doseUnitOptions.map((item) => ({ value: String(item.id), label: item.name }))]}
                required
              />
              <Select label="Route of Administration" value={String(newRx.routeId || "")} onChange={(e) => { const routeId = Number(e.target.value); setNewRx({ ...newRx, routeId, route: routeOptions.find((item) => item.id === routeId)?.name || "" }); }} options={[{ value: "", label: "Select route" }, ...routeOptions.map((item) => ({ value: String(item.id), label: item.name }))]} required />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Repeat every"
                type="number"
                min="1"
                step="1"
                value={newRx.frequency}
                onChange={(e) => setNewRx({ ...newRx, frequency: e.target.value })}
                required
              />
              <Input
                label="Duration"
                type="number"
                min="1"
                step="1"
                value={newRx.duration}
                onChange={(e) => setNewRx({ ...newRx, duration: e.target.value })}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Select label="Interval unit" value={newRx.frequencyUnit} onChange={(e) => setNewRx({ ...newRx, frequencyUnit: e.target.value })} options={["seconds", "minutes", "hours", "days", "weeks", "wr"].map((value) => ({ value, label: value }))} required />
              <Select label="Duration unit" value={newRx.durationPeriod} onChange={(e) => setNewRx({ ...newRx, durationPeriod: e.target.value })} options={["minutes", "hours", "days", "months", "years", "indefinite"].map((value) => ({ value, label: value }))} required />
            </div>
            {selectedDrug?.pregnancyWarning && <p className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">This medication has a pregnancy warning in the clinical formulary. Review patient status and clinical guidance before prescribing.</p>}

            {/* Validation failures here used to only surface in a banner far above this modal,
                so the "Add to Prescription Order" button appeared to silently do nothing. */}
            {errorMessage && (
              <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-800 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

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

      {/* MODAL 3: SELECT LAB TEST FROM LIVE GNU HEALTH CATALOG */}
      <Modal
        isOpen={isLabModalOpen}
        onClose={() => { setIsLabModalOpen(false); setSelectedLabTestId(null); setLabSearchTerm(""); }}
        title="Laboratory Test Catalog"
        kicker="DIAGNOSTIC PATHOLOGY ORDER"
        size="md"
      >
        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700">Search Laboratory Test Catalog *</label>
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search by test name (e.g. Liver, Renal, Haematology)..."
                value={labSearchTerm}
                onChange={(e) => setLabSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:border-[#0F766E]"
              />
            </div>
          </div>
          <div className="max-h-56 overflow-y-auto grid grid-cols-1 gap-2 border border-slate-200 rounded-xl p-2 bg-slate-50">
            {labTestOptions.length === 0 && (
              <div className="p-3 text-center text-xs text-slate-500 font-mono">Loading GNU Health test catalog…</div>
            )}
            {labTestOptions
              .filter((t) => t.name.toLowerCase().includes(labSearchTerm.trim().toLowerCase()))
              .map((t) => (
                <div
                  key={t.id}
                  onClick={() => setSelectedLabTestId(t.id)}
                  className={`p-2.5 rounded-lg border cursor-pointer transition-all flex items-center justify-between ${
                    selectedLabTestId === t.id ? "bg-teal-50 border-[#0F766E] shadow-2xs" : "bg-white border-slate-200 hover:border-slate-300"
                  }`}
                >
                  <span className="text-xs font-bold text-slate-900">{t.name}</span>
                  {selectedLabTestId === t.id && <Check className="w-3.5 h-3.5 text-[#0F766E]" />}
                </div>
              ))}
            {labTestOptions.length > 0 && labTestOptions.filter((t) => t.name.toLowerCase().includes(labSearchTerm.trim().toLowerCase())).length === 0 && (
              <div className="p-3 text-center text-xs text-slate-500 font-mono">No matching test in the GNU Health catalog.</div>
            )}
          </div>
          {errorMessage && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-800 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => { setIsLabModalOpen(false); setSelectedLabTestId(null); setLabSearchTerm(""); }}>
              Cancel
            </Button>
            <Button
              type="button"
              variant="primary"
              className="bg-[#0F766E] font-bold"
              onClick={handleOrderLabTest}
              disabled={!selectedLabTestId || isOrderingWorkup !== null}
              isLoading={isOrderingWorkup === "lab"}
            >
              Order Test
            </Button>
          </div>
        </div>
      </Modal>

      {/* MODAL 4: SELECT IMAGING STUDY FROM LIVE GNU HEALTH CATALOG */}
      <Modal
        isOpen={isImagingModalOpen}
        onClose={() => { setIsImagingModalOpen(false); setSelectedImagingTestId(null); setImagingSearchTerm(""); }}
        title="Imaging Study Catalog"
        kicker="DIGITAL PACS ORDER"
        size="md"
      >
        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700">Search Imaging Study Catalog *</label>
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search by study name (e.g. Chest X-Ray, MRI, CT Scan)..."
                value={imagingSearchTerm}
                onChange={(e) => setImagingSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:border-[#0F766E]"
              />
            </div>
          </div>
          <div className="max-h-56 overflow-y-auto grid grid-cols-1 gap-2 border border-slate-200 rounded-xl p-2 bg-slate-50">
            {imagingTestOptions.length === 0 && (
              <div className="p-3 text-center text-xs text-slate-500 font-mono">Loading GNU Health imaging catalog…</div>
            )}
            {imagingTestOptions
              .filter((t) => t.name.toLowerCase().includes(imagingSearchTerm.trim().toLowerCase()))
              .map((t) => (
                <div
                  key={t.id}
                  onClick={() => setSelectedImagingTestId(t.id)}
                  className={`p-2.5 rounded-lg border cursor-pointer transition-all flex items-center justify-between ${
                    selectedImagingTestId === t.id ? "bg-teal-50 border-[#0F766E] shadow-2xs" : "bg-white border-slate-200 hover:border-slate-300"
                  }`}
                >
                  <span className="text-xs font-bold text-slate-900">{t.name}</span>
                  {selectedImagingTestId === t.id && <Check className="w-3.5 h-3.5 text-[#0F766E]" />}
                </div>
              ))}
            {imagingTestOptions.length > 0 && imagingTestOptions.filter((t) => t.name.toLowerCase().includes(imagingSearchTerm.trim().toLowerCase())).length === 0 && (
              <div className="p-3 text-center text-xs text-slate-500 font-mono">No matching study in the GNU Health catalog.</div>
            )}
          </div>
          {errorMessage && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-800 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => { setIsImagingModalOpen(false); setSelectedImagingTestId(null); setImagingSearchTerm(""); }}>
              Cancel
            </Button>
            <Button
              type="button"
              variant="primary"
              className="bg-[#0F766E] font-bold"
              onClick={handleOrderImaging}
              disabled={!selectedImagingTestId || isOrderingWorkup !== null}
              isLoading={isOrderingWorkup === "radiology"}
            >
              Order Study
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
