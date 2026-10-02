"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { AlertCircle, CheckCircle2, FlaskConical, Plus, RefreshCw, Save } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";

interface LabCriterion {
  id: number;
  code: string;
  name: string;
  result: number | null;
  resultText: string;
  remarks: string;
  unit: string;
  normalRange: string;
  lowerLimit: number | null;
  upperLimit: number | null;
  limitsVerified: boolean;
  warning: boolean;
  excluded: boolean;
}

interface LabOrder {
  id: number;
  orderRef: string;
  patientId: number;
  patientName: string;
  puid: string;
  testName: string;
  dateRequested: string;
  dateAnalysis: string;
  state: string;
  results: string;
  diagnosis: string;
  specimen: string;
  criteria: LabCriterion[];
}

interface PatientOption { id: number; name: string; puid: string }
interface TestOption { id: number; name: string; code: string; specimenType: string | null }

export default function LaboratoryPage() {
  const [orders, setOrders] = useState<LabOrder[]>([]);
  const [patients, setPatients] = useState<PatientOption[]>([]);
  const [tests, setTests] = useState<TestOption[]>([]);
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);
  const [patientId, setPatientId] = useState<number | "">("");
  const [testId, setTestId] = useState<number | "">("");
  const [pendingRequestId, setPendingRequestId] = useState<number | null>(null);
  const [isNewOrderOpen, setIsNewOrderOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  const activeOrder = orders.find((order) => order.id === selectedOrderId) ?? null;

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [labResponse, patientResponse, testResponse] = await Promise.all([
        fetch("/api/clinical/laboratory", { cache: "no-store" }),
        fetch("/api/clinical/patients", { cache: "no-store" }),
        fetch("/api/clinical/laboratory?catalog=tests", { cache: "no-store" }),
      ]);
      const [labData, patientData, testData] = await Promise.all([labResponse.json(), patientResponse.json(), testResponse.json()]);
      if (!labResponse.ok || !labData.success) throw new Error(labData.error || "Unable to load laboratory results.");
      if (!patientResponse.ok || !patientData.success) throw new Error(patientData.error || "Unable to load patients.");
      if (!testResponse.ok || !testData.success) throw new Error(testData.error || "Unable to load laboratory tests.");
      const nextOrders = Array.isArray(labData.labOrders) ? labData.labOrders as LabOrder[] : [];
      setOrders(nextOrders);
      setPatients(Array.isArray(patientData.patients) ? patientData.patients.map((item: { id: number; name?: string; puid?: string }) => ({ id: item.id, name: item.name || "", puid: item.puid || "" })) : []);
      setTests(Array.isArray(testData.tests) ? testData.tests as TestOption[] : []);
      setSelectedOrderId((current) => nextOrders.some((order) => order.id === current) ? current : nextOrders[0]?.id ?? null);
    } catch (loadError: unknown) {
      setError(loadError instanceof Error ? loadError.message : "Unable to load laboratory data.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Floating notices fade out by themselves.
  useEffect(() => {
    if (!feedback) return;
    const timer = window.setTimeout(() => setFeedback(null), 8000);
    return () => window.clearTimeout(timer);
  }, [feedback]);

  useEffect(() => {
    const timer = window.setTimeout(() => { void loadData(); }, 0);
    return () => window.clearTimeout(timer);
  }, [loadData]);

  const updateCriterion = (criterionId: number, field: "result" | "resultText" | "remarks", value: string) => {
    if (!activeOrder) return;
    setOrders((current) => current.map((order) => order.id !== activeOrder.id ? order : {
      ...order,
      criteria: order.criteria.map((criterion) => criterion.id !== criterionId ? criterion : {
        ...criterion,
        [field]: field === "result" ? (value === "" ? null : Number(value)) : value,
        ...(field === "result" && value !== "" ? { resultText: "" } : {}),
        ...(field === "resultText" && value ? { result: null } : {}),
      }),
    }));
  };

  const createLabOrder = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!patientId || !testId) return;
    setIsSaving(true);
    setError(null);
    setFeedback(null);
    try {
      const response = await fetch("/api/clinical/laboratory", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "create", patientId, testId }),
      });
      const data = await response.json();
      if (!response.ok || !data.success) {
        if (data.requestId) setPendingRequestId(Number(data.requestId));
        throw new Error(data.error || "GNU Health could not create the laboratory result.");
      }
      setIsNewOrderOpen(false);
      setFeedback("The request and draft result were created by GNU Health.");
      await loadData();
      setSelectedOrderId(Number(data.labId));
      setPendingRequestId(null);
    } catch (createError: unknown) {
      setError(createError instanceof Error ? createError.message : "Laboratory order creation failed.");
    } finally {
      setIsSaving(false);
    }
  };

  const retryCreateResult = async () => {
    if (!pendingRequestId) return;
    setIsSaving(true);
    setError(null);
    try {
      const response = await fetch("/api/clinical/laboratory", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "create_result", requestId: pendingRequestId }),
      });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.error || "The saved request could not create its result.");
      setPendingRequestId(null);
      setFeedback("The saved request now has a GNU Health draft result.");
      await loadData();
      setSelectedOrderId(Number(data.labId));
    } catch (retryError: unknown) {
      setError(retryError instanceof Error ? retryError.message : "Unable to retry result creation.");
    } finally {
      setIsSaving(false);
    }
  };

  // Persists the entered analyte values to the native GNU Health draft. Split out from
  // saveResults() so markDone() can call it directly -- previously "Mark done" sent only
  // { action: "complete" } and never this save-results call, so a technician who typed
  // results and clicked "Mark done" (enabled the instant every analyte had a value in local
  // state) got a record permanently in the "done" state with every analyte still null: results
  // can only be saved while state === "draft", so nothing after this could recover them.
  const persistResults = async () => {
    if (!activeOrder) return false;
    const response = await fetch("/api/clinical/laboratory", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "save-results", labId: activeOrder.id,
        criteria: activeOrder.criteria.map((item) => ({ id: item.id, result: item.result, resultText: item.resultText, remarks: item.remarks })),
        results: activeOrder.results, diagnosis: activeOrder.diagnosis, specimen: activeOrder.specimen,
      }),
    });
    const data = await response.json();
    if (!response.ok || !data.success) throw new Error(data.error || "Unable to save the laboratory results.");
    return true;
  };

  const saveResults = async () => {
    if (!activeOrder) return;
    setIsSaving(true);
    setError(null);
    setFeedback(null);
    try {
      await persistResults();
      setFeedback("Analyte results saved to the native GNU Health draft.");
      await loadData();
    } catch (saveError: unknown) {
      setError(saveError instanceof Error ? saveError.message : "Unable to save the laboratory results.");
    } finally {
      setIsSaving(false);
    }
  };

  const markDone = async () => {
    if (!activeOrder) return;
    setIsSaving(true);
    setError(null);
    setFeedback(null);
    try {
      await persistResults();
      const response = await fetch("/api/clinical/laboratory", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "complete", labId: activeOrder.id }),
      });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.error || "GNU Health did not complete the laboratory result.");
      setFeedback("GNU Health marked this result done. This is not a separate signature or validation state.");
      await loadData();
    } catch (completeError: unknown) {
      setError(completeError instanceof Error ? completeError.message : "Unable to complete this laboratory result.");
    } finally {
      setIsSaving(false);
    }
  };

  const allResultsPresent = useMemo(() => Boolean(activeOrder?.criteria.length) && activeOrder!.criteria.every((item) => item.excluded || item.result !== null || item.resultText.trim().length > 0), [activeOrder]);
  const canEdit = activeOrder?.state === "draft";

  return (
    <main className="mx-auto max-w-7xl space-y-6">
      <header className="flex flex-col justify-between gap-4 border-b border-slate-200 pb-5 sm:flex-row sm:items-center">
        <div>
          <div className="kicker text-teal-700">DIAGNOSTIC PATHOLOGY</div>
          <h1 className="text-2xl font-bold text-slate-900">Laboratory workflow</h1>
          <p className="mt-1 text-sm text-slate-600">Patient requests, test criteria, results, and native GNU Health state.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => void loadData()} isLoading={isLoading} leftIcon={<RefreshCw className="h-4 w-4" />}>Refresh</Button>
          <Button variant="primary" size="sm" onClick={() => setIsNewOrderOpen(true)} leftIcon={<Plus className="h-4 w-4" />}>New laboratory request</Button>
        </div>
      </header>

      {/* Floating, so a message appearing never pushes the form (and the Save / Mark done buttons) down under the cursor. */}
      {error && <div role="alert" className="fixed right-6 top-20 z-50 flex max-w-md gap-2 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800 shadow-lg"><AlertCircle className="h-5 w-5 shrink-0" />{error}</div>}
      {feedback && <div role="status" className="fixed right-6 top-20 z-50 flex max-w-md gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900 shadow-lg"><CheckCircle2 className="h-5 w-5 shrink-0" />{feedback}</div>}
      {pendingRequestId && <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-950"><span>Saved native request {pendingRequestId} has no confirmed result record yet.</span><Button variant="outline" size="sm" onClick={() => void retryCreateResult()} isLoading={isSaving}>Retry result creation</Button></div>}

      <div className="grid gap-6 lg:grid-cols-[minmax(260px,0.8fr)_minmax(0,2fr)]">
        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <h2 className="mb-3 font-semibold text-slate-900">Laboratory results</h2>
          {isLoading && orders.length === 0 && <p className="p-4 text-sm text-slate-500">Loading native records…</p>}
          {!isLoading && orders.length === 0 && <div className="rounded-xl bg-slate-50 p-5 text-sm text-slate-600">No laboratory result records were returned for this company.</div>}
          <div className="space-y-2">
            {orders.map((order) => <button key={order.id} type="button" onClick={() => setSelectedOrderId(order.id)} className={`w-full rounded-xl border p-3 text-left ${selectedOrderId === order.id ? "border-teal-600 bg-teal-50" : "border-slate-200 hover:bg-slate-50"}`}>
              <span className="flex items-center justify-between gap-2"><strong className="text-sm text-slate-900">{order.orderRef}</strong><Badge variant={order.state === "done" || order.state === "validated" ? "green" : "amber"}>{order.state}</Badge></span>
              <span className="mt-1 block text-xs text-slate-700">{order.patientName} {order.puid ? `(${order.puid})` : ""}</span>
              <span className="mt-1 block text-xs text-slate-500">{order.testName}</span>
            </button>)}
          </div>
        </section>

        <section className="min-w-0 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          {!activeOrder ? <div className="flex min-h-64 flex-col items-center justify-center text-center text-slate-500"><FlaskConical className="mb-3 h-9 w-9" /><p>Select an existing result or create a request.</p></div> : <>
            <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-100 pb-4">
              <div><p className="text-xs font-mono text-slate-500">{activeOrder.orderRef} · Patient {activeOrder.puid}</p><h2 className="mt-1 text-lg font-bold text-slate-900">{activeOrder.testName}</h2><p className="text-sm text-slate-600">{activeOrder.patientName} · {activeOrder.specimen || "Specimen not recorded"}</p></div>
              <Badge variant={activeOrder.state === "done" || activeOrder.state === "validated" ? "green" : "amber"} size="md">{activeOrder.state}</Badge>
            </div>
            <div className="mt-4 overflow-x-auto">
              {activeOrder.criteria.length === 0 ? <p className="rounded-xl bg-amber-50 p-4 text-sm text-amber-900">This native result has no analyte criteria. Results cannot be entered until its test template is corrected.</p> : <table className="w-full min-w-[720px] border-collapse text-left text-sm">
                <thead><tr className="border-b bg-slate-50 text-xs uppercase text-slate-600"><th className="p-3">Analyte</th><th className="p-3">Result</th><th className="p-3">Unit</th><th className="p-3">Reference</th><th className="p-3">Remarks</th><th className="p-3">Flag</th></tr></thead>
                <tbody>{activeOrder.criteria.map((item) => <tr key={item.id} className="border-b border-slate-100 align-top">
                  <td className="p-3"><strong>{item.name}</strong>{item.code && <span className="mt-1 block font-mono text-xs text-slate-500">{item.code}</span>}{item.excluded && <span className="text-xs text-slate-500">Excluded</span>}</td>
                  <td className="p-3"><div className="flex flex-col gap-2"><input aria-label={`${item.name} numeric result`} type="number" step="any" value={item.result ?? ""} disabled={!canEdit || item.excluded} onChange={(event) => updateCriterion(item.id, "result", event.target.value)} className="w-32 rounded border border-slate-300 px-2 py-1 disabled:bg-slate-100"/><input aria-label={`${item.name} qualitative result`} value={item.resultText} disabled={!canEdit || item.excluded} onChange={(event) => updateCriterion(item.id, "resultText", event.target.value)} placeholder="Qualitative result" className="w-40 rounded border border-slate-300 px-2 py-1 disabled:bg-slate-100"/></div></td>
                  <td className="p-3 text-slate-600">{item.unit || "—"}</td><td className="p-3 text-slate-600">{item.normalRange || "—"}{!item.limitsVerified && (item.lowerLimit !== null || item.upperLimit !== null) && <span className="mt-1 block text-xs text-amber-700">Limits need verification in the test template.</span>}</td>
                  <td className="p-3"><input aria-label={`${item.name} remarks`} value={item.remarks} disabled={!canEdit || item.excluded} onChange={(event) => updateCriterion(item.id, "remarks", event.target.value)} className="w-40 rounded border border-slate-300 px-2 py-1 disabled:bg-slate-100" /></td>
                  <td className="p-3">{item.warning ? <Badge variant="amber">Review</Badge> : <span className="text-xs text-slate-500">—</span>}</td>
                </tr>)}</tbody>
              </table>}
            </div>
            <div className="mt-5 grid gap-3 sm:grid-cols-2"><label className="text-sm font-medium text-slate-700">Results notes<textarea disabled={!canEdit} value={activeOrder.results} onChange={(event) => setOrders((current) => current.map((order) => order.id === activeOrder.id ? { ...order, results: event.target.value } : order))} rows={3} className="mt-1 w-full rounded-lg border border-slate-300 p-2 disabled:bg-slate-100" /></label><label className="text-sm font-medium text-slate-700">Diagnosis<textarea disabled={!canEdit} value={activeOrder.diagnosis} onChange={(event) => setOrders((current) => current.map((order) => order.id === activeOrder.id ? { ...order, diagnosis: event.target.value } : order))} rows={3} className="mt-1 w-full rounded-lg border border-slate-300 p-2 disabled:bg-slate-100" /></label></div>
            <div className="mt-5 flex flex-wrap justify-end gap-2 border-t border-slate-100 pt-4">
              <Button variant="outline" size="sm" onClick={() => void saveResults()} isLoading={isSaving} disabled={!canEdit || activeOrder.criteria.length === 0} leftIcon={<Save className="h-4 w-4" />}>Save draft results</Button>
              <Button variant="primary" size="sm" onClick={() => void markDone()} isLoading={isSaving} disabled={!canEdit || !allResultsPresent || activeOrder.criteria.some((item) => !item.limitsVerified && (item.lowerLimit !== null || item.upperLimit !== null))} leftIcon={<CheckCircle2 className="h-4 w-4" />}>Mark done</Button>
            </div>
            <p className="mt-3 text-xs text-slate-500">GNU Health’s installed workflow marks a completed lab record as done. This page does not claim a separate signature/validation step.</p>
          </>}
        </section>
      </div>

      <Modal isOpen={isNewOrderOpen} onClose={() => setIsNewOrderOpen(false)} title="Create laboratory request" kicker="GNU HEALTH TEST CATALOG" size="md">
        <form onSubmit={createLabOrder} className="space-y-4">
          <label className="block text-sm font-medium text-slate-700">Patient<select required value={patientId} onChange={(event) => setPatientId(event.target.value ? Number(event.target.value) : "")} className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2"><option value="">Select patient</option>{patients.map((patient) => <option key={patient.id} value={patient.id}>{patient.name} {patient.puid ? `(${patient.puid})` : ""}</option>)}</select></label>
          <label className="block text-sm font-medium text-slate-700">Native lab test<select required value={testId} onChange={(event) => setTestId(event.target.value ? Number(event.target.value) : "")} className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2"><option value="">Select test</option>{tests.map((test) => <option key={test.id} value={test.id}>{test.code} · {test.name}{test.specimenType ? ` — ${test.specimenType}` : ""}</option>)}</select></label>
          {tests.length === 0 && <p className="text-sm text-amber-800">No active tests are available from GNU Health for this tenant.</p>}
          <div className="flex justify-end gap-2 border-t border-slate-100 pt-4"><Button type="button" variant="outline" onClick={() => setIsNewOrderOpen(false)}>Cancel</Button><Button type="submit" variant="primary" isLoading={isSaving} disabled={!patientId || !testId}>Create request and result</Button></div>
        </form>
      </Modal>
    </main>
  );
}
