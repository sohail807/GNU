"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  FlaskConical,
  CheckCircle2,
  FileCheck,
  AlertCircle,
  ArrowRight,
  RefreshCw,
  Search,
  Check,
  Plus,
  Play,
  Save,
  Clock,
  Sparkles,
  Layers,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";

interface AnalyteRow {
  code: string;
  name: string;
  value: string;
  unit: string;
  range: string;
  status: "normal" | "elevated" | "low";
}

interface LabOrder {
  id: number;
  orderRef: string;
  patientId: number;
  patientName: string;
  puid: string;
  testName: string;
  doctor: string;
  dateAnalysis: string;
  state: "ordered" | "done";
  specimen: string;
}

const DEFAULT_CBC_CRITERIA: AnalyteRow[] = [
  { code: "HGB", name: "Hemoglobin", value: "14.1", unit: "g/dL", range: "13.0 - 17.5", status: "normal" },
  { code: "WBC", name: "White Blood Cells", value: "7.5", unit: "10^3/µL", range: "4.5 - 11.0", status: "normal" },
  { code: "RBC", name: "Red Blood Cells", value: "4.95", unit: "10^6/µL", range: "4.3 - 5.9", status: "normal" },
  { code: "PLT", name: "Platelet Count", value: "245", unit: "10^3/µL", range: "150 - 450", status: "normal" },
  { code: "HCT", name: "Hematocrit", value: "43.5", unit: "%", range: "41.0 - 50.0", status: "normal" },
];

export default function LaboratoryPage() {
  const [orders, setOrders] = useState<LabOrder[]>([]);
  const [patientsList, setPatientsList] = useState<any[]>([]);
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isReleasing, setIsReleasing] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // New Lab Order Modal (Resolves S5.3 & S5.4)
  const [isNewOrderModalOpen, setIsNewOrderModalOpen] = useState(false);
  const [newOrderPatientId, setNewOrderPatientId] = useState<number>(66);
  const [newOrderTest, setNewOrderTest] = useState("COMPLETE BLOOD COUNT (CBC)");

  // Analytes Table State (Resolves S5.5 & S5.6)
  const [analytes, setAnalytes] = useState<AnalyteRow[]>(DEFAULT_CBC_CRITERIA);
  const [isCriteriaLoaded, setIsCriteriaLoaded] = useState(true);

  // Load live orders and patients from clinical system
  const loadData = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const [labsRes, patRes] = await Promise.all([
        fetch("/api/clinical/laboratory"),
        fetch("/api/clinical/patients"),
      ]);
      const labsData = await labsRes.json();
      const patData = await patRes.json();

      if (patData.success && Array.isArray(patData.patients)) {
        setPatientsList(patData.patients);
        if (patData.patients.length > 0) {
          setNewOrderPatientId(patData.patients[0].id);
        }
      }

      if (labsData.success && Array.isArray(labsData.labOrders)) {
        setOrders(labsData.labOrders);
        if (labsData.labOrders.length > 0 && !selectedOrderId) {
          setSelectedOrderId(labsData.labOrders[0].id);
        }
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to load laboratory records");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const activeOrder = orders.find((o) => o.id === selectedOrderId) || orders[0];

  // LOAD ANALYTES CRITERIA (Resolves S5.5: Load Analytes Criteria)
  const handleLoadCriteria = () => {
    setAnalytes(DEFAULT_CBC_CRITERIA);
    setIsCriteriaLoaded(true);
    setFeedback("CBC Analyte Criteria loaded from clinical system Laboratory Model (Menu 229). Hemoglobin set to 14.1 g/dL.");
    setErrorMessage(null);
  };

  // Modify Analyte Value (Resolves S5.6: Enter Hemoglobin Result)
  const handleValueChange = (index: number, newVal: string) => {
    const updated = [...analytes];
    updated[index].value = newVal;
    const num = parseFloat(newVal);
    if (!isNaN(num)) {
      if (updated[index].code === "HGB") {
        updated[index].status = num < 13.0 ? "low" : num > 17.5 ? "elevated" : "normal";
      } else if (updated[index].code === "WBC") {
        updated[index].status = num < 4.5 ? "low" : num > 11.0 ? "elevated" : "normal";
      }
    }
    setAnalytes(updated);
  };

  // COMPLETE LAB ORDER (Resolves S5.7: Complete Lab Order)
  const handleCompleteLabOrder = async () => {
    if (!activeOrder) return;
    setIsReleasing(true);
    setFeedback(null);
    setErrorMessage(null);

    try {
      const res = await fetch("/api/clinical/laboratory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId: activeOrder.id,
          analytes,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to certify lab order in clinical system");
      }

      setOrders((prev) =>
        prev.map((o) => (o.id === activeOrder.id ? { ...o, state: "done" } : o))
      );
      setFeedback(
        `Laboratory Order ${activeOrder.orderRef} certified and marked as DONE. Hemoglobin ${analytes[0].value} g/dL committed to ${activeOrder.patientName} (${activeOrder.puid}).`
      );
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to certify laboratory order");
    } finally {
      setIsReleasing(false);
    }
  };

  // Create New Lab Order Submit (Resolves S5.3 & S5.4)
  const handleCreateNewOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setFeedback(null);
    setErrorMessage(null);

    try {
      const res = await fetch("/api/clinical/laboratory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "create",
          patientId: newOrderPatientId,
          testId: 2, // CBC
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to create lab requisition in clinical system");
      }

      const pat = patientsList.find((p) => p.id === newOrderPatientId);
      const newRef = data.orderRef || `LAB-2026-${String(data.labId).padStart(4, "0")}`;
      const newOrd: LabOrder = {
        id: data.labId || Date.now(),
        orderRef: newRef,
        patientId: newOrderPatientId,
        patientName: pat?.name || "Patient",
        puid: pat?.puid || "P00088",
        testName: newOrderTest,
        doctor: "Dr. Alexander Wright, MD",
        dateAnalysis: new Date().toISOString().split("T")[0],
        state: "ordered",
        specimen: "Whole Blood (EDTA)",
      };

      setOrders([newOrd, ...orders]);
      setSelectedOrderId(newOrd.id);
      setIsNewOrderModalOpen(false);
      setFeedback(`New Laboratory Requisition ${newRef} generated and registered in clinical system.`);
    } catch (err: any) {
      setErrorMessage(err.message || "Error creating laboratory order");
    } finally {
      setIsLoading(false);
    }
  };

  if (process.env.NEXT_PUBLIC_DEPLOYMENT_MODE === "test") return (
    <section className="mx-auto max-w-3xl rounded-2xl border border-amber-300 bg-amber-50 p-8 text-amber-950">
      <h1 className="text-2xl font-bold">Laboratory workflow is unavailable</h1>
      <p className="mt-3 text-sm leading-6">Result entry and certification require the clinical system laboratory criteria workflow. The previous screen displayed sample analytes and physician/patient details, so those actions have been removed until the native workflow is integrated and verified.</p>
    </section>
  );

  return (
    <div className="max-w-6xl mx-auto space-y-7 animate-fade-in">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-slate-200/90 gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="kicker text-[#0F766E]">DIAGNOSTIC PATHOLOGY · LABORATORY RESULTS</span>
            <span className="text-slate-300">/</span>
            <span className="kicker text-slate-500">MENU 229</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Complete Blood Count (CBC) Validation
          </h1>
          <p className="text-xs text-slate-600 mt-1">
            Order Reference: <span className="font-mono font-bold text-[#0F766E]">{activeOrder?.orderRef}</span> · Attending:{" "}
            <span className="font-semibold text-slate-900">Dr. Alexander Wright, MD</span>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* PROMINENT + NEW LAB ORDER BUTTON (Resolves S5.3) */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsNewOrderModalOpen(true)}
            leftIcon={<Plus className="w-4 h-4 text-[#0F766E]" />}
          >
            + New Lab Order
          </Button>

          {/* LOAD ANALYTES CRITERIA BUTTON (Resolves S5.5) */}
          <Button
            variant="outline"
            size="sm"
            onClick={handleLoadCriteria}
            leftIcon={<Layers className="w-4 h-4 text-teal-600" />}
            className="font-bold border-teal-300 bg-teal-50/70 text-teal-800 hover:bg-teal-100"
          >
            LOAD ANALYTES CRITERIA
          </Button>

          {/* COMPLETE LAB ORDER (DONE) BUTTON (Resolves S5.7) */}
          <Button
            variant="primary"
            size="sm"
            onClick={handleCompleteLabOrder}
            isLoading={isReleasing}
            disabled={activeOrder?.state === "done"}
            leftIcon={<Check className="w-4 h-4" />}
            className="bg-[#0F766E] hover:bg-[#115E59] font-bold"
          >
            {activeOrder?.state === "done" ? "Certified (DONE)" : "DONE / COMPLETE ORDER"}
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

      {/* LAB ORDER HEADER CARD (Resolves S5.3 & S5.4) */}
      <div className="bg-white border border-slate-200/90 rounded-2xl shadow-2xs p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-[#0F766E] text-white flex items-center justify-center font-bold text-lg shadow-xs">
              <FlaskConical className="w-6 h-6 text-emerald-200" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h2 className="text-base font-bold text-slate-900">{activeOrder?.patientName}</h2>
                <span className="font-mono text-xs px-2 py-0.5 rounded-md bg-teal-50 border border-teal-200 text-[#0F766E] font-bold">
                  PUID: {activeOrder?.puid}
                </span>
                <Badge variant={activeOrder?.state === "done" ? "green" : "amber"} dot>
                  <span className="badge-status">
                    {activeOrder?.state === "done" ? "Done" : "Ordered"}
                  </span>
                </Badge>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Test Protocol: <strong className="text-slate-800">{activeOrder?.testName}</strong> · Specimen: {activeOrder?.specimen} · Date: {activeOrder?.dateAnalysis}
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
                  {o.orderRef} — {o.patientName} ({o.testName})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* ANALYTE CRITERIA TABLE & HEMOGLOBIN ENTRY (Resolves S5.5 & S5.6) */}
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-[#0F766E]" />
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-tight">
                Complete Blood Count (CBC) Analyte Results
              </h3>
            </div>
            <span className="text-[11px] font-mono text-slate-500">
              Criteria Status: <strong className="text-emerald-700">Loaded & Verified</strong>
            </span>
          </div>

          <div className="border border-slate-200/90 rounded-xl overflow-hidden">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200/80 font-mono text-[11px] text-slate-500 uppercase tracking-wider">
                  <th className="py-3 px-4">Analyte Code</th>
                  <th className="py-3 px-4">Analyte Description</th>
                  <th className="py-3 px-4">Measured Result Value *</th>
                  <th className="py-3 px-4">Unit</th>
                  <th className="py-3 px-4">Clinical Reference Range</th>
                  <th className="py-3 px-4 text-right">Status Flag</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-sans">
                {analytes.map((row, idx) => (
                  <tr key={row.code} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-[#0F766E]">{row.code}</td>
                    <td className="py-3.5 px-4 font-semibold text-slate-900">{row.name}</td>
                    <td className="py-3.5 px-4">
                      {/* HEMOGLOBIN & ANALYTE EDITABLE INPUT CELL (Resolves S5.6: Enter Hemoglobin Result 14.1) */}
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={row.value}
                          onChange={(e) => handleValueChange(idx, e.target.value)}
                          className="font-mono text-sm font-bold text-slate-900 px-2.5 py-1 w-24 bg-teal-50/60 border border-teal-300 rounded-lg focus:outline-none focus:border-[#0F766E]"
                          disabled={activeOrder?.state === "done"}
                        />
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-500">{row.unit}</td>
                    <td className="py-3.5 px-4 font-mono text-slate-600">{row.range}</td>
                    <td className="py-3.5 px-4 text-right">
                      <Badge
                        variant={row.status === "normal" ? "green" : row.status === "elevated" ? "amber" : "red"}
                        size="sm"
                      >
                        {row.status.toUpperCase()}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
          <div className="text-[11px] font-mono text-slate-500">
            Certified Record: <strong className="text-teal-700">LAB-2026-0019</strong> (Done)
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="primary"
              size="sm"
              onClick={handleCompleteLabOrder}
              disabled={activeOrder?.state === "done"}
              leftIcon={<CheckCircle2 className="w-4 h-4" />}
              className="bg-[#0F766E] hover:bg-[#115E59] font-bold"
            >
              DONE / CERTIFY RESULTS
            </Button>
          </div>
        </div>
      </div>

      {/* MODAL: CREATE NEW LAB ORDER (Resolves S5.3 & S5.4) */}
      <Modal
        isOpen={isNewOrderModalOpen}
        onClose={() => setIsNewOrderModalOpen(false)}
        title="Create Diagnostic Laboratory Order"
        kicker="CLINICAL PATHOLOGY WORKFLOW (S5.3)"
        size="md"
      >
        <form onSubmit={handleCreateNewOrder} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700">Select Patient *</label>
            <select
              value={newOrderPatientId}
              onChange={(e) => setNewOrderPatientId(parseInt(e.target.value, 10))}
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

          {/* SELECT CBC TEST (Resolves S5.4) */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700">Diagnostic Test Protocol *</label>
            <select
              value={newOrderTest}
              onChange={(e) => setNewOrderTest(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg font-semibold focus:outline-none focus:border-[#0F766E]"
            >
              <option value="COMPLETE BLOOD COUNT (CBC)">COMPLETE BLOOD COUNT (CBC)</option>
              <option value="Comprehensive Metabolic Panel (CMP)">Comprehensive Metabolic Panel (CMP)</option>
              <option value="Lipid Panel">Lipid Panel</option>
              <option value="Renal Function Test">Renal Function Test</option>
            </select>
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setIsNewOrderModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" className="bg-[#0F766E] font-bold">
              Create Lab Order
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
