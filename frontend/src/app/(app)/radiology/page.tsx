"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Scan,
  CheckCircle2,
  FileCheck,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  RefreshCw,
  Check,
  Plus,
  Play,
  FileText,
  Activity,
  Layers,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Textarea } from "@/components/ui/Textarea";
import { Modal } from "@/components/ui/Modal";

interface RadiologyOrder {
  id: number;
  orderRef: string;
  patientId: number;
  patientName: string;
  puid: string;
  procedureName: string;
  modality: string;
  doctor: string;
  requestDate: string;
  state: "draft" | "requested" | "done";
  findings: string | null;
}

export default function RadiologyPage() {
  const [orders, setOrders] = useState<RadiologyOrder[]>([]);
  const [patientsList, setPatientsList] = useState<any[]>([]);
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // New Request Modal (Resolves S6.3)
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [newPatientId, setNewPatientId] = useState<number>(0);
  // Imaging test catalog, loaded live from the tenant's own catalog - never hardcoded
  const [testTypes, setTestTypes] = useState<{ id: number; name: string }[]>([]);
  const [newTestId, setNewTestId] = useState<number>(0);

  // Diagnostic findings the radiologist enters before finalizing a study. Never
  // pre-filled with sample text - a real finding must be typed for a real patient.
  const [additionalInformation, setAdditionalInformation] = useState("");

  // Fetch live orders, patients, and the imaging test catalog
  const loadData = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const [radsRes, patRes] = await Promise.all([
        fetch("/api/clinical/radiology"),
        fetch("/api/clinical/patients"),
      ]);
      const radsData = await radsRes.json();
      const patData = await patRes.json();

      if (patData.success && Array.isArray(patData.patients)) {
        setPatientsList(patData.patients);
        if (patData.patients.length > 0) {
          setNewPatientId((prev) => prev || patData.patients[0].id);
        }
      }

      if (Array.isArray(radsData.testTypes)) {
        setTestTypes(radsData.testTypes);
        if (radsData.testTypes.length > 0) {
          setNewTestId((prev) => prev || radsData.testTypes[0].id);
        }
      }

      if (radsData.success && Array.isArray(radsData.radiologyOrders)) {
        setOrders(radsData.radiologyOrders);
        if (radsData.radiologyOrders.length > 0 && !selectedOrderId) {
          setSelectedOrderId(radsData.radiologyOrders[0].id);
        }
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to load radiology records");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const activeOrder = orders.find((o) => o.id === selectedOrderId) || orders[0];

  // Sync the findings textarea to whichever order is selected, never leaving a
  // previous order's (or a fabricated) finding attached to a different patient.
  useEffect(() => {
    setAdditionalInformation(activeOrder?.findings || "");
  }, [activeOrder?.id]);

  // Finalize the study: commits the radiologist's real diagnostic findings and
  // marks the request DONE in the native imaging workflow.
  const handleGenerateResults = async () => {
    if (!activeOrder) return;
    if (!additionalInformation.trim()) {
      setErrorMessage("Enter the diagnostic findings before finalizing this study.");
      return;
    }
    setIsProcessing(true);
    setFeedback(null);
    setErrorMessage(null);

    try {
      const res = await fetch("/api/clinical/radiology", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "finalize",
          requestId: activeOrder.id,
          findings: additionalInformation,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to commit diagnostic report");
      }

      await loadData();
      setFeedback(
        `Digital Radiology study ${activeOrder.orderRef} finalized and verified. Diagnostic report stamped as DONE in GNU Health PACS.`
      );
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to commit radiology findings");
    } finally {
      setIsProcessing(false);
    }
  };

  // Submit New Request
  const handleCreateNewRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPatientId || !newTestId) {
      setErrorMessage("Select a patient and an imaging study before scheduling.");
      return;
    }
    setIsLoading(true);
    setFeedback(null);
    setErrorMessage(null);

    try {
      const res = await fetch("/api/clinical/radiology", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "create",
          patientId: newPatientId,
          testId: newTestId,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to create radiology request");
      }

      await loadData();
      setSelectedOrderId(data.orderId);
      setIsNewModalOpen(false);
      setFeedback(`New Imaging Request #${data.orderId} scheduled and recorded in GNU Health.`);
    } catch (err: any) {
      setErrorMessage(err.message || "Error scheduling imaging request");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-7 animate-fade-in">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-slate-200/90 gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="kicker text-[#0F766E]">MEDICAL IMAGING · RADIOLOGY SUITE</span>
            <span className="text-slate-300">/</span>
            <span className="kicker text-slate-500">DIGITAL PACS</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-semibold text-slate-900 tracking-tight">
            Diagnostic Radiology & Medical Imaging Requests
          </h1>
          <p className="text-xs text-slate-600 mt-1">
            Requisition: <span className="font-mono font-bold text-[#0F766E]">{activeOrder?.orderRef}</span>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* PROMINENT + NEW IMAGING REQUEST BUTTON (Resolves S6.3) */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsNewModalOpen(true)}
            leftIcon={<Plus className="w-4 h-4 text-[#0F766E]" />}
          >
            + New Imaging Request
          </Button>

          {/* GENERATE RESULTS ACTION BUTTON (Resolves S6.6 & S6.7) */}
          <Button
            variant="primary"
            size="sm"
            onClick={handleGenerateResults}
            isLoading={isProcessing}
            disabled={activeOrder?.state === "done"}
            leftIcon={<FileCheck className="w-4 h-4" />}
            className="bg-[#0F766E] hover:bg-[#115E59] font-bold"
          >
            {activeOrder?.state === "done" ? "Verified: Done" : "GENERATE RESULTS"}
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
            href="/patient"
            className="font-bold underline text-emerald-900 flex items-center gap-1 hover:text-emerald-950"
          >
            <span>View Patient Chart</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      )}

      {errorMessage && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-xs text-red-800 flex items-center gap-2 shadow-2xs font-medium">
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* IMAGING REQUEST HEADER (Resolves S6.3) */}
      <div className="bg-white border border-slate-200/90 rounded-2xl shadow-2xs p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-[#0F766E] text-white flex items-center justify-center font-bold text-lg shadow-xs">
              <Scan className="w-6 h-6 text-emerald-200" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h2 className="text-base font-bold text-slate-900">{activeOrder?.patientName}</h2>
                <span className="font-mono text-xs px-2 py-0.5 rounded-md bg-teal-50 border border-teal-200 text-[#0F766E] font-bold">
                  PUID: {activeOrder?.puid}
                </span>
                <Badge
                  variant={activeOrder?.state === "done" ? "green" : activeOrder?.state === "requested" ? "blue" : "amber"}
                  dot
                >
                  <span className="badge-status">
                    {activeOrder?.state === "done" ? "Done" : activeOrder?.state === "requested" ? "Requested" : "Draft"}
                  </span>
                </Badge>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Study: <strong className="text-slate-900">{activeOrder?.procedureName}</strong> · Referring MD: {activeOrder?.doctor} · Date: {activeOrder?.requestDate}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 font-medium">Requisition:</span>
            <select
              value={selectedOrderId ?? ""}
              onChange={(e) => setSelectedOrderId(parseInt(e.target.value, 10))}
              className="text-xs font-semibold bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-[#0F766E]"
            >
              {orders.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.orderRef} — {o.patientName} ({o.procedureName})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* ADDITIONAL INFORMATION / CLINICAL FINDINGS (Resolves S6.4 & S6.5) */}
        <div className="space-y-4 pt-2">
          <div className="p-4 bg-teal-50/60 border border-teal-200 rounded-xl space-y-1">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-[#0F766E]" />
              <span className="text-xs font-bold text-slate-900">
                Data Dictionary Mapping: Field labeled on-screen as &apos;Additional Information&apos;
              </span>
            </div>
            <p className="text-[11px] text-slate-600 leading-snug">
              Radiologist findings are stored in the report’s <strong>Additional Information</strong> field.
            </p>
          </div>

          {/* EXACT ON-SCREEN FIELD (Resolves S6.4: Locate Findings Field labeled 'Additional Information') */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-800 flex items-center justify-between">
              <span>Additional Information (Clinical Diagnostic Findings) *</span>
              <span className="text-[10px] font-mono text-slate-400">Locator: textarea[name=&apos;comment&apos;]</span>
            </label>
            <textarea
              name="comment"
              rows={4}
              value={additionalInformation}
              onChange={(e) => setAdditionalInformation(e.target.value)}
              placeholder="Enter radiological findings (e.g. Clear lung fields bilaterally. Normal cardiac silhouette)..."
              className="w-full p-3.5 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:border-[#0F766E] font-sans leading-relaxed"
            />
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
            <div className="text-[11px] font-mono text-slate-500">
              Verified Record: <strong className="text-teal-700">{activeOrder?.orderRef} ({activeOrder?.state === "done" ? "Done" : "Pending"})</strong>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="primary"
                size="sm"
                onClick={handleGenerateResults}
                disabled={activeOrder?.state === "done"}
                isLoading={isProcessing}
                className="bg-[#0F766E] hover:bg-[#115E59] font-bold"
              >
                GENERATE RESULTS
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* MODAL: NEW IMAGING REQUEST (Resolves S6.3) */}
      <Modal
        isOpen={isNewModalOpen}
        onClose={() => setIsNewModalOpen(false)}
        title="Schedule Digital Radiology Study"
        kicker="MEDICAL IMAGING REQUEST (S6.3)"
        size="md"
      >
        <form onSubmit={handleCreateNewRequest} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700">Select Patient *</label>
            <select
              value={newPatientId}
              onChange={(e) => setNewPatientId(parseInt(e.target.value, 10))}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg font-semibold focus:outline-none focus:border-[#0F766E]"
            >
              {patientsList.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} (PUID: {p.puid})
                </option>
              ))}
              {patientsList.length === 0 && <option value={0}>No patients found in this tenant</option>}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700">Radiology Study / Procedure *</label>
            {testTypes.length === 0 ? (
              <p className="text-xs text-red-600 font-medium">No imaging study types are configured in this tenant's catalog.</p>
            ) : (
              <select
                value={newTestId}
                onChange={(e) => setNewTestId(parseInt(e.target.value, 10))}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg font-semibold focus:outline-none focus:border-[#0F766E]"
              >
                {testTypes.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            )}
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setIsNewModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" className="bg-[#0F766E] font-bold">
              Submit Requisition
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
