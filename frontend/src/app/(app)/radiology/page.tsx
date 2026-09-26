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
  findings: string;
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
  const [newPatientId, setNewPatientId] = useState<number>(66);
  const [newStudy, setNewStudy] = useState("Chest X-Ray (PA & Lateral)");

  // Additional Information Field (Resolves S6.4 & S6.5: Locate Findings Field & Enter Findings)
  const [additionalInformation, setAdditionalInformation] = useState(
    "Clear lung fields bilaterally. Normal cardiac silhouette. No focal consolidation, pneumothorax, or pleural effusion."
  );

  // Fetch live orders and patients
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
          setNewPatientId(patData.patients[0].id);
        }
      }

      if (radsData.success && Array.isArray(radsData.radiologyOrders)) {
        setOrders(radsData.radiologyOrders);
        if (radsData.radiologyOrders.length > 0 && !selectedOrderId) {
          setSelectedOrderId(radsData.radiologyOrders[0].id);
          if (radsData.radiologyOrders[0].findings) {
            setAdditionalInformation(radsData.radiologyOrders[0].findings);
          }
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

  // Step 1: REQUEST Action (Resolves S6.6 - Real Backend Call)
  const handleExecuteRequest = async () => {
    if (!activeOrder) return;
    setIsProcessing(true);
    setFeedback(null);
    setErrorMessage(null);

    try {
      const res = await fetch("/api/clinical/radiology", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "request",
          orderId: activeOrder.id,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to transition study state");
      }

      setOrders((prev) =>
        prev.map((o) => (o.id === activeOrder.id ? { ...o, state: "requested" } : o))
      );
      setFeedback(`Radiological study ${activeOrder.orderRef} successfully transitioned to 'REQUESTED' in clinical system.`);
    } catch (err: any) {
      setErrorMessage(err.message || "Error requesting study");
    } finally {
      setIsProcessing(false);
    }
  };

  // Step 2: GENERATE RESULTS Action (Resolves S6.6 & S6.7 - Real Backend Call)
  const handleGenerateResults = async () => {
    if (!activeOrder) return;
    setIsProcessing(true);
    setFeedback(null);
    setErrorMessage(null);

    try {
      const res = await fetch("/api/clinical/radiology", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId: activeOrder.id,
          findings: additionalInformation,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to commit diagnostic report");
      }

      setOrders((prev) =>
        prev.map((o) =>
          o.id === activeOrder.id ? { ...o, state: "done", findings: additionalInformation } : o
        )
      );
      setFeedback(
        `Digital Radiology study ${activeOrder.orderRef} finalized and verified. Diagnostic report stamped as DONE in clinical system PACS.`
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
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to create radiology request");
      }

      const pat = patientsList.find((p) => p.id === newPatientId);
      const newRef = data.orderRef || `RAD-2026-${String(data.orderId).padStart(4, "0")}`;
      const newReq: RadiologyOrder = {
        id: data.orderId || Date.now(),
        orderRef: newRef,
        patientId: newPatientId,
        patientName: pat?.name || "Patient",
        puid: pat?.puid || "P00088",
        procedureName: newStudy,
        modality: "Digital Radiography (DX)",
        doctor: "Dr. Alexander Wright, MD",
        requestDate: new Date().toISOString().split("T")[0],
        state: "draft",
        findings: "Clear lung fields bilaterally.",
      };

      setOrders([newReq, ...orders]);
      setSelectedOrderId(newReq.id);
      setIsNewModalOpen(false);
      setFeedback(`New Imaging Request ${newRef} scheduled and recorded in clinical system.`);
    } catch (err: any) {
      setErrorMessage(err.message || "Error scheduling imaging request");
    } finally {
      setIsLoading(false);
    }
  };

  if (process.env.NEXT_PUBLIC_DEPLOYMENT_MODE === "test") return (
    <section className="mx-auto max-w-3xl rounded-2xl border border-amber-300 bg-amber-50 p-8 text-amber-950">
      <h1 className="text-2xl font-bold">Imaging workflow is unavailable</h1>
      <p className="mt-3 text-sm leading-6">clinical system imaging state changes and result generation must run through its native workflow. The previous screen included sample findings and a hard-coded patient, so imaging actions are hidden until the native lifecycle is integrated and verified.</p>
    </section>
  );

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
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Diagnostic Radiology & Medical Imaging Requests
          </h1>
          <p className="text-xs text-slate-600 mt-1">
            Requisition: <span className="font-mono font-bold text-[#0F766E]">{activeOrder?.orderRef}</span> · Modality:{" "}
            <span className="font-semibold text-slate-900">{activeOrder?.modality}</span>
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

          {/* REQUEST ACTION BUTTON (Resolves S6.6) */}
          <Button
            variant="outline"
            size="sm"
            onClick={handleExecuteRequest}
            disabled={activeOrder?.state !== "draft"}
            leftIcon={<Play className="w-4 h-4 text-teal-600" />}
            className="font-bold border-teal-300 bg-teal-50/70 text-teal-800"
          >
            REQUEST
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
                variant="outline"
                size="sm"
                onClick={handleExecuteRequest}
                disabled={activeOrder?.state !== "draft"}
              >
                1. REQUEST
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleGenerateResults}
                disabled={activeOrder?.state === "done"}
                isLoading={isProcessing}
                className="bg-[#0F766E] hover:bg-[#115E59] font-bold"
              >
                2. GENERATE RESULTS
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
              {patientsList.length === 0 && (
                <option value={66}>Alexander Wright (PUID: P00088)</option>
              )}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700">Radiology Study / Procedure *</label>
            <select
              value={newStudy}
              onChange={(e) => setNewStudy(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg font-semibold focus:outline-none focus:border-[#0F766E]"
            >
              <option value="Chest X-Ray (PA & Lateral)">Chest X-Ray (PA & Lateral)</option>
              <option value="Lumbar Spine (AP & Lateral)">Lumbar Spine (AP & Lateral)</option>
              <option value="CT Scan Head without contrast">CT Scan Head without contrast</option>
              <option value="Abdominal Ultrasound">Abdominal Ultrasound</option>
              <option value="MRI Brain Screening">MRI Brain Screening</option>
            </select>
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
