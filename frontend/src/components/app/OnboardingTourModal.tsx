"use client";

import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import {
  ShieldCheck,
  Users,
  Activity,
  Stethoscope,
  Microscope,
  Receipt,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Sparkles,
  ExternalLink,
  Lock,
} from "lucide-react";
import { Button } from "@/components/ui/Button";

interface OnboardingTourModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const TOUR_STEPS = [
  {
    step: 1,
    title: "Hospital System Architecture & Zero-Trust Governance",
    badge: "ZERO-TRUST GOVERNANCE",
    icon: ShieldCheck,
    color: "#0F766E",
    description:
      "IST Health HMIS is an enterprise hospital operating platform delivering encrypted clinical workflows, longitudinal electronic medical records, and strict data sovereignty. Every clinical note, diagnostic order, and financial transaction is committed with cryptographic authentication.",
    keyPoints: [
      "Single Source of Clinical Truth: Unified electronic medical records across all hospital departments.",
      "Strict Role-Based Access Control: 8 verified clinical staff personas with segregated departmental permissions.",
      "Regulatory Compliance: built for Gulf health-data protection requirements (UAE and Qatar).",
    ],
    route: "/admin",
    routeLabel: "Inspect Hospital Administration & Staff Directory",
  },
  {
    step: 2,
    title: "Front Desk & Patient Civil Registration",
    badge: "PATIENT INTAKE",
    icon: Users,
    color: "#0F766E",
    description:
      "Receptionists manage the real-time outpatient queue, check in arriving patients, and record legal civil identities with strict national ID (Emirates ID / Qatar ID) and party uniqueness enforcement.",
    keyPoints: [
      "Real-Time Arrival Queue: 1-click Check-In advances patients directly to Nursing Triage.",
      "Party Uniqueness: Automatic validation of national IDs (Qatar ID 11 digits, Emirates ID 15 digits).",
      "Auto-Sequenced PUID: Deterministic medical record numbering (e.g. P00088).",
    ],
    route: "/frontdesk",
    routeLabel: "Open Front Desk Queue",
  },
  {
    step: 3,
    title: "Nursing Station & Clinical Vitals Triage",
    badge: "TELEMETRY & TRIAGE",
    icon: Activity,
    color: "#0F766E",
    description:
      "Triage nurses capture physiological vitals, calculate BMI, flag active clinical allergies, and triage patients before transferring them to the physician's consulting room.",
    keyPoints: [
      "Comprehensive Telemetry: Blood pressure, heart rate, oxygen saturation, and body temperature.",
      "Automated Pyrexia Alerts: Visual fever triggers for temperatures > 38.0°C.",
      "Clinical Allergies: Critical allergy alerts (e.g. Penicillin) instantly broadcast across all clinical cockpits.",
    ],
    route: "/nursing",
    routeLabel: "Open Nursing Triage",
  },
  {
    step: 4,
    title: "Physician Clinical Consultation Cockpit",
    badge: "CLINICAL DECISION",
    icon: Stethoscope,
    color: "#0F766E",
    description:
      "Attending physicians conduct clinical evaluations using structured SOAP methodology, assign international ICD-10 diagnostic pathology codes, order diagnostic investigations, and commit electronic prescriptions.",
    keyPoints: [
      "SOAP Note Architecture: Subjective, Objective, Assessment, and Plan documentation.",
      "ICD-10 Pathology Integration: Standardized diagnostic coding (e.g. J06.9 Acute URI).",
      "Digital Prescriptions: Dose, route, frequency, and duration committed directly to the hospital digital dispensary.",
    ],
    route: "/physician",
    routeLabel: "Open Physician Cockpit",
  },
  {
    step: 5,
    title: "Diagnostic Ancillaries (Laboratory & Radiology)",
    badge: "PRECISION DIAGNOSTICS",
    icon: Microscope,
    color: "#0F766E",
    description:
      "Integrated clinical laboratory and digital radiology suites process physician diagnostic orders, evaluate biological reference ranges, and interpret radiological imaging.",
    keyPoints: [
      "Complete Blood Count (CBC): Analyte measurement validation (HGB, WBC, RBC, PLT) with automated out-of-range indicators.",
      "Digital Chest Radiography: DICOM Modality Worklist integration and certified radiological findings.",
      "Direct Physician Handoff: Diagnostic results immediately appear in the unified patient chart.",
    ],
    route: "/laboratory",
    routeLabel: "Open Diagnostic Suites",
  },
  {
    step: 6,
    title: "Outpatient Cashier & General Ledger Accounting",
    badge: "FINANCIAL GOVERNANCE",
    icon: Receipt,
    color: "#0F766E",
    description:
      "The billing desk aggregates consultation and diagnostic charges into a certified patient hospital invoice, processes payment in the hospital's own currency, and posts balanced entries to the hospital General Ledger.",
    keyPoints: [
      "Integrated Billing Engine: Itemized billing generation linking clinical encounters and diagnostic services.",
      "Financial Ledger Integrity: 1-click payment settlement executes verified General Ledger posting.",
      "Fiscal Receipts: Official itemized financial receipts ready for patient discharge.",
    ],
    route: "/billing",
    routeLabel: "Open Outpatient Cashier",
  },
];

export const OnboardingTourModal: React.FC<OnboardingTourModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  // Portal to document.body: a page's .animate-fade-in wrapper leaves a lingering CSS
  // `transform` after its entrance animation finishes, which creates a new containing block
  // and silently breaks this dialog's `position: fixed` if rendered inline in the page tree
  // (it ends up positioned in the document instead of pinned to the viewport). See Modal.tsx.
  const [portalTarget, setPortalTarget] = useState<HTMLElement | null>(null);
  useEffect(() => {
    setPortalTarget(document.body);
  }, []);

  if (!isOpen || !portalTarget) return null;

  const currentStep = TOUR_STEPS[currentStepIndex];
  const IconComponent = currentStep.icon;
  const isFirst = currentStepIndex === 0;
  const isLast = currentStepIndex === TOUR_STEPS.length - 1;

  const handleNext = () => {
    if (isLast) {
      onClose();
    } else {
      setCurrentStepIndex((prev) => prev + 1);
    }
  };

  const handlePrev = () => {
    if (!isFirst) {
      setCurrentStepIndex((prev) => prev - 1);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/70 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-2xl bg-white border border-slate-200/90 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Top Header & Progress Indicator */}
        <div className="p-6 bg-slate-900 text-white flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-8 h-8 rounded-lg bg-[#0F766E] text-white flex items-center justify-center font-bold text-sm">
                <Sparkles className="w-4 h-4 text-emerald-300" />
              </span>
              <div>
                <span className="text-xs font-mono uppercase tracking-widest text-emerald-400 font-semibold block">
                  SYSTEM ONBOARDING & CLINICAL WALKTHROUGH
                </span>
                <h3 className="text-base font-bold text-white tracking-tight">
                  IST Health Outpatient Operations Manual
                </h3>
              </div>
            </div>

            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white p-1 text-sm font-mono transition-colors"
            >
              Skip Tour ✕
            </button>
          </div>

          {/* Progress Bar */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs font-mono text-slate-300">
              <span>Step {currentStep.step} of {TOUR_STEPS.length}</span>
              <span>{Math.round(((currentStepIndex + 1) / TOUR_STEPS.length) * 100)}% Completed</span>
            </div>
            <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-300 rounded-full"
                style={{
                  width: `${((currentStepIndex + 1) / TOUR_STEPS.length) * 100}%`,
                }}
              />
            </div>
          </div>
        </div>

        {/* Step Content */}
        <div className="p-7 overflow-y-auto space-y-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-teal-50 text-[#0F766E] border border-teal-200/60 flex items-center justify-center shrink-0">
              <IconComponent className="w-6 h-6" />
            </div>
            <div>
              <span className="kicker text-[#0F766E] block mb-1">
                {currentStep.badge}
              </span>
              <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                {currentStep.title}
              </h2>
            </div>
          </div>

          <p className="text-sm text-slate-600 leading-relaxed font-sans">
            {currentStep.description}
          </p>

          <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-5 space-y-3">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider font-mono">
              Key Operational Standards:
            </h4>
            <ul className="space-y-2.5">
              {currentStep.keyPoints.map((point, idx) => (
                <li key={idx} className="flex items-start gap-2.5 text-xs text-slate-700">
                  <CheckCircle2 className="w-4 h-4 text-[#0F766E] shrink-0 mt-0.5" />
                  <span>{point}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Quick Jump Action */}
          <div className="pt-2 flex items-center justify-between text-xs">
            <span className="text-slate-500 font-medium">Ready to test this clinical station?</span>
            <Link
              href={currentStep.route}
              onClick={onClose}
              className="font-semibold text-[#0F766E] hover:text-[#115E59] flex items-center gap-1.5 bg-teal-50 px-3 py-1.5 rounded-lg border border-teal-200/50 hover:bg-teal-100 transition-colors"
            >
              <span>{currentStep.routeLabel}</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Modal Footer Controls */}
        <div className="p-5 border-t border-slate-100 bg-slate-50/80 flex items-center justify-between">
          <Button
            variant="outline"
            size="sm"
            onClick={handlePrev}
            disabled={isFirst}
            leftIcon={<ArrowLeft className="w-3.5 h-3.5" />}
          >
            Previous
          </Button>

          {/* Step Dots */}
          <div className="flex items-center gap-1.5">
            {TOUR_STEPS.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentStepIndex(i)}
                className={`w-2 h-2 rounded-full transition-all ${
                  currentStepIndex === i
                    ? "w-6 bg-[#0F766E]"
                    : "bg-slate-300 hover:bg-slate-400"
                }`}
                aria-label={`Go to step ${i + 1}`}
              />
            ))}
          </div>

          <Button
            variant="primary"
            size="sm"
            onClick={handleNext}
            rightIcon={!isLast ? <ArrowRight className="w-3.5 h-3.5" /> : undefined}
          >
            {isLast ? "Complete Tour & Start" : "Next Step"}
          </Button>
        </div>
      </div>
    </div>,
    portalTarget
  );
};
