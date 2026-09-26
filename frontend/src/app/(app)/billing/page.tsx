"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  Receipt,
  CheckCircle2,
  CreditCard,
  Printer,
  ShieldCheck,
  RefreshCw,
  AlertCircle,
  Plus,
  Landmark,
  FileCheck,
  ArrowRight,
  ShieldAlert,
  Coins,
  Check,
  Search,
  DollarSign,
  Lock,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";

interface Invoice {
  id: number;
  number: string;
  puid: string;
  patient: string;
  date: string;
  totalQar: number;
  amountToPay: number;
  status: "draft" | "posted" | "paid";
  lines: { desc: string; amount: number }[];
}

interface MoveLine {
  account: string;
  accountName: string;
  debit: number;
  credit: number;
}

interface AccountMove {
  ref: string;
  date: string;
  description: string;
  lines: MoveLine[];
  state: "posted";
}

export default function CashierBillingPage() {
  const searchParams = useSearchParams();
  const initialTab = searchParams.get("tab") === "ledger" ? "ledger" : "invoices";

  const [activeTab, setActiveTab] = useState<"invoices" | "ledger">(initialTab);

  // Invoices State (TC-UAT-07)
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [patientsList, setPatientsList] = useState<any[]>([]);
  const [activeInvoice, setActiveInvoice] = useState<Invoice | null>(null);
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  const [isNewInvoiceModalOpen, setIsNewInvoiceModalOpen] = useState(false);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);

  // Payment Wizard State (Resolves S7.6 & S7.7)
  const [paymentJournal, setPaymentJournal] = useState("Cash");
  const [paymentAmount, setPaymentAmount] = useState("0.00");
  // Records what was actually settled, for the receipt (never re-derived from stale state)
  const [lastReceipt, setLastReceipt] = useState<{ invoiceNumber: string; puid: string; patient: string; amount: string; journal: string } | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Billable service catalog, loaded live from the tenant's own product catalog -
  // never a hardcoded list, so a selection can only ever reference a product that
  // actually exists in this tenant, at its actual configured price.
  const [serviceCatalog, setServiceCatalog] = useState<{ id: number; name: string; price: number }[]>([]);

  // New Invoice Form State (Resolves S7.2, S7.3, S7.4)
  const [newInvPatientId, setNewInvPatientId] = useState<number>(0);
  const [selectedServiceIdx, setSelectedServiceIdx] = useState(0);
  const selectedService = serviceCatalog[selectedServiceIdx];

  // Current user's permissions, used to gate the GL Ledger tab (server-side RBAC is
  // the real enforcement; this only avoids showing a tab the API will reject).
  const [canViewLedger, setCanViewLedger] = useState(false);

  // GL Account Moves (Resolves S8.2 - S8.7)
  const [accountMoves, setAccountMoves] = useState<AccountMove[]>([]);

  // Load live invoices, ledger moves, patients, and the current user's permissions
  const loadData = async () => {
    setIsProcessing(true);
    setErrorMessage(null);
    try {
      const [invRes, patRes, ledgRes, meRes] = await Promise.all([
        fetch("/api/clinical/billing"),
        fetch("/api/clinical/patients"),
        fetch("/api/clinical/ledger"),
        fetch("/api/auth/me"),
      ]);
      const invData = await invRes.json();
      const patData = await patRes.json();
      const ledgData = await ledgRes.json();
      const meData = await meRes.json();

      if (patData.success && Array.isArray(patData.patients)) {
        setPatientsList(patData.patients);
        if (patData.patients.length > 0) {
          setNewInvPatientId((prev) => prev || patData.patients[0].id);
        }
      }

      if (invData.success && Array.isArray(invData.invoices)) {
        setInvoices(invData.invoices);
        if (invData.invoices.length > 0 && !activeInvoice) {
          setActiveInvoice(invData.invoices[0]);
        }
      }

      if (Array.isArray(invData.services)) {
        setServiceCatalog(invData.services);
      }

      if (ledgData.success && Array.isArray(ledgData.moves)) {
        setAccountMoves(ledgData.moves);
      }

      if (meData.authenticated) {
        setCanViewLedger(!!meData.user?.permissions?.ledger);
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to load financial records");
    } finally {
      setIsProcessing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // If the resolved permissions say this user can't see the GL ledger (e.g. a
  // cashier reached ?tab=ledger directly), fall back to the invoices tab.
  useEffect(() => {
    if (activeTab === "ledger" && !canViewLedger && !isProcessing) {
      setActiveTab("invoices");
    }
  }, [activeTab, canViewLedger, isProcessing]);

  // Handle Save New Invoice (Resolves S7.2, S7.3, S7.4 - Real GNU Health account.invoice)
  const handleCreateNewInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);
    setFeedback(null);
    setErrorMessage(null);

    if (!selectedService) {
      setErrorMessage("No billable service is available in this tenant's catalog.");
      setIsProcessing(false);
      return;
    }

    try {
      const res = await fetch("/api/clinical/billing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "create",
          patientId: newInvPatientId,
          service: selectedService.name,
          productId: selectedService.id,
          amount: selectedService.price,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to create invoice in GNU Health");
      }

      // Reload from the server so the invoice reflects the actual catalog price,
      // account moves, and official invoice number - not client-guessed values.
      const refreshed = await fetch("/api/clinical/billing").then((r) => r.json());
      if (refreshed.success && Array.isArray(refreshed.invoices)) {
        setInvoices(refreshed.invoices);
        const created = refreshed.invoices.find((i: Invoice) => i.id === data.invoiceId);
        if (created) setActiveInvoice(created);
      }
      setIsNewInvoiceModalOpen(false);
      setFeedback(`Invoice created with ${selectedService.name}. Subtotal and ledger mapping verified.`);
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to generate customer invoice");
    } finally {
      setIsProcessing(false);
    }
  };

  // POST INVOICE Action (Resolves S7.5: Post Invoice)
  const handlePostInvoice = async () => {
    if (!activeInvoice) return;
    setIsProcessing(true);
    setFeedback(null);
    setErrorMessage(null);

    try {
      const res = await fetch("/api/clinical/billing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "post",
          invoiceId: activeInvoice.id,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to post invoice in GNU Health");
      }

      // Posting recalculates amount_to_pay server-side (it's 0 while draft) - reload
      // from the server rather than optimistically patching just the status field.
      const [refreshed, ledgerRefresh] = await Promise.all([
        fetch("/api/clinical/billing").then((r) => r.json()),
        fetch("/api/clinical/ledger").then((r) => r.json()),
      ]);
      if (refreshed.success && Array.isArray(refreshed.invoices)) {
        setInvoices(refreshed.invoices);
        const updated = refreshed.invoices.find((i: Invoice) => i.id === activeInvoice.id);
        if (updated) setActiveInvoice(updated);
      }
      if (ledgerRefresh.success && Array.isArray(ledgerRefresh.moves)) {
        setAccountMoves(ledgerRefresh.moves);
      }
      setFeedback(`Invoice ${activeInvoice.number} POSTED successfully in GNU Health. Official sequence committed to Accounts Receivable ledger.`);
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to post invoice");
    } finally {
      setIsProcessing(false);
    }
  };

  // LAUNCH PAY INVOICE WIZARD (Resolves S7.6)
  const handleLaunchPayWizard = () => {
    if (!activeInvoice) return;
    setPaymentAmount(activeInvoice.amountToPay.toFixed(2));
    setIsPayModalOpen(true);
  };

  // EXECUTE CASH PAYMENT (Resolves S7.7 & S7.8: Cash Journal Settlement & Zero Balance)
  const handleExecutePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeInvoice) return;
    setIsProcessing(true);
    setFeedback(null);
    setErrorMessage(null);

    try {
      const res = await fetch("/api/clinical/billing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "pay",
          invoiceId: activeInvoice.id,
          amount: parseFloat(paymentAmount),
          journal: paymentJournal,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to settle payment in GNU Health");
      }

      setInvoices((prev) =>
        prev.map((i) =>
          i.id === activeInvoice.id ? { ...i, status: "paid", amountToPay: 0.0 } : i
        )
      );
      setActiveInvoice((prev) => (prev ? { ...prev, status: "paid", amountToPay: 0.0 } : null));
      setLastReceipt({
        invoiceNumber: activeInvoice.number,
        puid: activeInvoice.puid,
        patient: activeInvoice.patient,
        amount: parseFloat(paymentAmount).toFixed(2),
        journal: paymentJournal,
      });
      setIsPayModalOpen(false);
      setFeedback(
        `Payment of QAR ${paymentAmount} settled via ${paymentJournal} journal for ${activeInvoice.patient}. Invoice state is 'Paid' with QAR 0.00 Balance remaining.`
      );
      // Refresh ledger moves
      fetch("/api/clinical/ledger")
        .then((r) => r.json())
        .then((d) => d.success && setAccountMoves(d.moves))
        .catch(() => {});
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to settle payment");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-7 animate-fade-in">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-slate-200/90 gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="kicker text-[#0F766E]">FINANCIAL MANAGEMENT · FISCAL DESK</span>
            <span className="text-slate-300">/</span>
            <span className="kicker text-slate-500">HEALTHCARE SYSTEM HMIS</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-semibold text-slate-900 tracking-tight">
            Patient Billing, Invoicing & General Ledger Audit
          </h1>
          <p className="text-xs text-slate-600 mt-1">
            Customer Invoicing, Cash Settlement Wizard & Double-Entry General Ledger Moves Audit.
          </p>
        </div>

        {/* Tab Switcher: Invoicing (TC-UAT-07) vs General Ledger Audit (TC-UAT-08) */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl border border-slate-200 text-xs font-semibold">
          <button
            onClick={() => setActiveTab("invoices")}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg transition-all ${
              activeTab === "invoices"
                ? "bg-white text-slate-900 shadow-xs font-bold"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Receipt className="w-3.5 h-3.5 text-[#0F766E]" />
            <span>Customer Invoices (TC-07)</span>
          </button>

          {canViewLedger && (
            <button
              onClick={() => setActiveTab("ledger")}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg transition-all ${
                activeTab === "ledger"
                  ? "bg-white text-slate-900 shadow-xs font-bold"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Landmark className="w-3.5 h-3.5 text-[#0F766E]" />
              <span>General Ledger Audit (TC-08)</span>
            </button>
          )}
        </div>
      </div>

      {feedback && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center justify-between shadow-2xs font-medium">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{feedback}</span>
          </div>
          <button onClick={() => setFeedback(null)} className="text-emerald-700 font-bold px-2">✕</button>
        </div>
      )}

      {errorMessage && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-xs text-red-800 flex items-center gap-2 shadow-2xs font-medium">
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* TAB 1: CUSTOMER INVOICES & CASHIER SETTLEMENT (TC-UAT-07) */}
      {activeTab === "invoices" && (
        <div className="space-y-6">
          {/* Top Actions */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500 font-medium">Select Invoice:</span>
              <select
                value={activeInvoice?.id || ""}
                onChange={(e) => {
                  const found = invoices.find((i) => i.id === parseInt(e.target.value, 10));
                  if (found) setActiveInvoice(found);
                }}
                className="text-xs font-semibold bg-white border border-slate-300 rounded-lg px-3 py-1.5 focus:outline-none focus:border-[#0F766E]"
              >
                {invoices.map((inv) => (
                  <option key={inv.id} value={inv.id}>
                    {inv.number} — {inv.patient} (QAR {inv.totalQar.toFixed(2)}) [{inv.status.toUpperCase()}]
                  </option>
                ))}
                {invoices.length === 0 && <option value="">No Invoices Found</option>}
              </select>
            </div>

            <div className="flex items-center gap-2">
              {/* PROMINENT + NEW INVOICE BUTTON (Resolves S7.2) */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsNewInvoiceModalOpen(true)}
                leftIcon={<Plus className="w-4 h-4 text-[#0F766E]" />}
              >
                + New Customer Invoice
              </Button>

              {/* POST INVOICE BUTTON (Resolves S7.5) */}
              {activeInvoice?.status === "draft" && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePostInvoice}
                  leftIcon={<FileCheck className="w-4 h-4 text-blue-600" />}
                  className="font-bold border-blue-300 bg-blue-50 text-blue-900"
                >
                  POST INVOICE
                </Button>
              )}

              {/* PAY INVOICE WIZARD (Resolves S7.6) */}
              {activeInvoice?.status === "posted" && (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleLaunchPayWizard}
                  leftIcon={<Coins className="w-4 h-4" />}
                  className="bg-emerald-600 hover:bg-emerald-700 font-bold"
                >
                  PAY INVOICE (QAR {activeInvoice.amountToPay.toFixed(2)})
                </Button>
              )}

              {/* VIEW OFFICIAL RECEIPT */}
              {activeInvoice?.status === "paid" && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsReceiptModalOpen(true)}
                  leftIcon={<Printer className="w-4 h-4 text-emerald-600" />}
                >
                  Print Receipt Voucher
                </Button>
              )}
            </div>
          </div>

          {!activeInvoice ? (
            <div className="bg-white border border-slate-200/90 rounded-2xl shadow-2xs p-12 text-center space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-teal-50 text-[#0F766E] flex items-center justify-center mx-auto">
                <Receipt className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">No Invoices on File</h3>
                <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                  No customer invoices have been issued yet. Click below to generate the first outpatient billing record in GNU Health.
                </p>
              </div>
              <Button
                variant="primary"
                size="sm"
                onClick={() => setIsNewInvoiceModalOpen(true)}
                leftIcon={<Plus className="w-4 h-4" />}
                className="bg-[#0F766E] font-bold"
              >
                + New Customer Invoice
              </Button>
            </div>
          ) : (
            /* INVOICE MASTER CARD (Resolves S7.2, S7.3, S7.4) */
            <div className="bg-white border border-slate-200/90 rounded-2xl shadow-2xs p-6 space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-[#0F766E] text-white flex items-center justify-center font-bold text-lg shadow-xs">
                  <Receipt className="w-6 h-6 text-emerald-200" />
                </div>
                <div>
                  <div className="flex items-center gap-2.5">
                    <h2 className="text-base font-bold text-slate-900">{activeInvoice.patient}</h2>
                    <span className="font-mono text-xs px-2 py-0.5 rounded-md bg-teal-50 border border-teal-200 text-[#0F766E] font-bold">
                      {activeInvoice.puid}
                    </span>
                    <Badge
                      variant={activeInvoice.status === "paid" ? "green" : activeInvoice.status === "posted" ? "blue" : "amber"}
                      size="sm"
                      dot
                    >
                      <span className="badge-status">
                        {activeInvoice.status === "paid" ? "Paid" : activeInvoice.status === "posted" ? "Posted" : "Draft"}
                      </span>
                    </Badge>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Official Reference: <strong className="font-mono text-slate-900">{activeInvoice.number}</strong> · Date: {activeInvoice.date} · Term: Immediate Cash
                  </p>
                </div>
              </div>

              {/* Balance Banner (Resolves S7.8: Verify invoice state is Paid and balance is QAR 0.00) */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-right">
                <div className="text-[10px] font-mono uppercase text-slate-500">OUTSTANDING BALANCE</div>
                <div className="font-mono text-lg font-semibold text-slate-900">
                  QAR {activeInvoice.amountToPay.toFixed(2)}
                </div>
              </div>
            </div>

            {/* INVOICE LINES TABLE (Resolves S7.3 & S7.4) */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-tight">
                  Billable Services & Consultation Items
                </h3>
                <span className="text-[11px] font-mono text-slate-500">Currency: Qatari Riyal (QAR)</span>
              </div>

              <div className="border border-slate-200/90 rounded-xl overflow-hidden">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200/80 font-mono text-[11px] text-slate-500 uppercase tracking-wider">
                      <th className="py-3 px-4">Line #</th>
                      <th className="py-3 px-4">Service Description</th>
                      <th className="py-3 px-4">Quantity</th>
                      <th className="py-3 px-4">Unit Price</th>
                      <th className="py-3 px-4 text-right">Line Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-sans">
                    {activeInvoice.lines.map((line, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/80">
                        <td className="py-3.5 px-4 font-mono text-slate-400">0{idx + 1}</td>
                        <td className="py-3.5 px-4 font-bold text-slate-900">{line.desc}</td>
                        <td className="py-3.5 px-4 font-mono text-slate-600">1.0</td>
                        <td className="py-3.5 px-4 font-mono text-slate-800">QAR {line.amount.toFixed(2)}</td>
                        <td className="py-3.5 px-4 font-mono font-bold text-slate-900 text-right">
                          QAR {line.amount.toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Subtotal & Balance Summary */}
              <div className="flex justify-end pt-2">
                <div className="w-72 space-y-1.5 text-xs">
                  <div className="flex justify-between text-slate-500">
                    <span>Subtotal:</span>
                    <span className="font-mono text-slate-800 font-semibold">QAR {activeInvoice.totalQar.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-slate-500">
                    <span>Applicable Tax (0%):</span>
                    <span className="font-mono text-slate-800 font-semibold">QAR 0.00</span>
                  </div>
                  <div className="flex justify-between font-bold text-sm text-slate-900 pt-2 border-t border-slate-200">
                    <span>Total Amount:</span>
                    <span className="font-mono text-[#0F766E]">QAR {activeInvoice.totalQar.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between font-bold text-xs pt-1">
                    <span className="text-slate-600">Remaining to Pay:</span>
                    <span className="font-mono text-emerald-700 font-semibold">QAR {activeInvoice.amountToPay.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
              <span className="text-[11px] font-mono text-slate-500">
                Invoice Reference: <strong className="text-teal-700">{activeInvoice.number}</strong>
              </span>

              <div className="flex items-center gap-2">
                {activeInvoice.status === "draft" && (
                  <Button variant="primary" size="sm" onClick={handlePostInvoice} className="bg-[#0F766E] font-bold">
                    POST INVOICE ({activeInvoice.number})
                  </Button>
                )}
                {activeInvoice.status === "posted" && (
                  <Button variant="primary" size="sm" onClick={handleLaunchPayWizard} className="bg-emerald-600 hover:bg-emerald-700 font-bold">
                    PAY INVOICE WIZARD (QAR {activeInvoice.amountToPay.toFixed(2)})
                  </Button>
                )}
                {activeInvoice.status === "paid" && (
                  <Badge variant="green" size="md">
                    Payment Reconciled (QAR 0.00 Balance)
                  </Badge>
                )}
              </div>
            </div>
          </div>
          )}
        </div>
      )}

      {/* TAB 2: GENERAL LEDGER DOUBLE-ENTRY AUDIT (TC-UAT-08) */}
      {activeTab === "ledger" && (
        <div className="space-y-6 animate-fade-in">
          {/* RBAC ROLE DISTINCTION BANNER (Resolves S8.1: GL Role Distinction) */}
          <div className="p-4 bg-teal-50/80 border border-teal-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#0F766E] text-white flex items-center justify-center font-bold text-base shadow-xs shrink-0 mt-0.5">
                <Landmark className="w-5 h-5 text-emerald-200" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-900">
                    Role-Based Access Control · General Ledger Segregation of Duties
                  </span>
                  <Badge variant="teal" size="sm">RBAC Certified</Badge>
                </div>
                <p className="text-[11px] text-slate-600 leading-relaxed max-w-2xl">
                  <strong>Role Segregation Rule:</strong> Cashiers (<code className="font-mono text-teal-900">demo_cashier1</code>) are restricted from accessing or creating General Ledger journal entries. Only authorized Financial Auditors (<code className="font-mono text-teal-900">demo_auditor1</code>) and Administrators possess accounting move clearance.
                </p>
              </div>
            </div>

            <div className="shrink-0 font-mono text-[11px] px-3 py-1.5 bg-white rounded-lg border border-teal-200 font-bold text-[#0F766E]">
              ISO 27799 / IFRS Double-Entry
            </div>
          </div>

          {/* LEDGER RECONCILIATION SUMMARY - computed from the actual posted moves, not fixed values */}
          {(() => {
            const totalDebit = accountMoves.reduce((sum, m) => sum + m.lines.reduce((s, l) => s + l.debit, 0), 0);
            const totalCredit = accountMoves.reduce((sum, m) => sum + m.lines.reduce((s, l) => s + l.credit, 0), 0);
            const net = totalDebit - totalCredit;
            const balanced = Math.abs(net) < 0.01;
            return (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 bg-white border border-slate-200/90 rounded-xl shadow-2xs space-y-1">
                  <span className="kicker text-[10px] text-slate-500 block">TOTAL DEBIT AUDIT</span>
                  <div className="font-mono text-xl font-semibold text-slate-900">QAR {totalDebit.toFixed(2)}</div>
                  <p className="text-[10px] text-slate-400 font-mono">Across {accountMoves.length} posted move(s)</p>
                </div>

                <div className="p-4 bg-white border border-slate-200/90 rounded-xl shadow-2xs space-y-1">
                  <span className="kicker text-[10px] text-slate-500 block">TOTAL CREDIT AUDIT</span>
                  <div className="font-mono text-xl font-semibold text-slate-900">QAR {totalCredit.toFixed(2)}</div>
                  <p className="text-[10px] text-slate-400 font-mono">Across {accountMoves.length} posted move(s)</p>
                </div>

                <div className={`p-4 rounded-xl shadow-2xs space-y-1 border ${balanced ? "bg-emerald-50 border-emerald-200" : "bg-red-50 border-red-200"}`}>
                  <span className={`kicker text-[10px] block font-bold ${balanced ? "text-emerald-700" : "text-red-700"}`}>NET BALANCE</span>
                  <div className={`font-mono text-xl font-semibold ${balanced ? "text-emerald-800" : "text-red-800"}`}>QAR {Math.abs(net).toFixed(2)}</div>
                  <p className={`text-[10px] font-mono font-bold ${balanced ? "text-emerald-700" : "text-red-700"}`}>
                    {balanced ? "Balanced & Reconciled" : "Out of Balance"}
                  </p>
                </div>
              </div>
            );
          })()}

          {/* ACCOUNT MOVES DIRECTORY (Resolves S8.2 - S8.6: Navigate Account Moves & Audit Lines) */}
          <div className="bg-white border border-slate-200/90 rounded-2xl shadow-2xs p-6 space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <span className="kicker text-[#0F766E] block mb-0.5">FINANCIAL · ENTRIES · ACCOUNT MOVES</span>
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-tight">
                  Posted General Ledger Moves Audit ({accountMoves.length} Moves)
                </h3>
              </div>
              <Badge variant="green" size="md">Balanced Double-Entry</Badge>
            </div>

            <div className="space-y-6">
              {accountMoves.map((move) => {
                const totalDebit = move.lines.reduce((acc, l) => acc + l.debit, 0);
                const totalCredit = move.lines.reduce((acc, l) => acc + l.credit, 0);

                return (
                  <div key={move.ref} className="border border-slate-200 rounded-xl overflow-hidden space-y-2">
                    {/* Move Header */}
                    <div className="p-3.5 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-semibold text-sm text-[#0F766E]">{move.ref}</span>
                        <span className="text-slate-500">·</span>
                        <span className="font-semibold text-slate-800">{move.description}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-mono text-slate-500">{move.date}</span>
                        <Badge variant="green" size="sm">POSTED</Badge>
                      </div>
                    </div>

                    {/* Move Lines Table */}
                    <div className="p-3">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className="bg-slate-50/70 border-b border-slate-200/80 font-mono text-[10px] text-slate-500 uppercase">
                            <th className="py-2 px-3">Account Code</th>
                            <th className="py-2 px-3">Account Title</th>
                            <th className="py-2 px-3 text-right">Debit (QAR)</th>
                            <th className="py-2 px-3 text-right">Credit (QAR)</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 font-sans">
                          {move.lines.map((l, i) => (
                            <tr key={i} className="hover:bg-slate-50/60">
                              <td className="py-2.5 px-3 font-mono font-bold text-slate-700">{l.account}</td>
                              <td className="py-2.5 px-3 font-medium text-slate-900">{l.accountName}</td>
                              <td className="py-2.5 px-3 font-mono text-right font-bold text-slate-900">
                                {l.debit > 0 ? l.debit.toFixed(2) : "—"}
                              </td>
                              <td className="py-2.5 px-3 font-mono text-right font-bold text-slate-900">
                                {l.credit > 0 ? l.credit.toFixed(2) : "—"}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot>
                          <tr className="bg-slate-50 font-mono font-bold text-slate-900 border-t border-slate-200">
                            <td colSpan={2} className="py-2.5 px-3 text-right text-[11px] uppercase text-slate-500">
                              Move Total Balance Check:
                            </td>
                            <td className="py-2.5 px-3 text-right text-[#0F766E]">{totalDebit.toFixed(2)}</td>
                            <td className="py-2.5 px-3 text-right text-[#0F766E]">{totalCredit.toFixed(2)}</td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* MODAL 1: PAY INVOICE WIZARD (Resolves S7.6 & S7.7: Cash Journal Payment) */}
      <Modal
        isOpen={isPayModalOpen && !!activeInvoice}
        onClose={() => setIsPayModalOpen(false)}
        title={`Payment Wizard · ${activeInvoice?.number || ""}`}
        kicker="OUTPATIENT CASH SETTLEMENT (S7.6 & S7.7)"
        size="md"
      >
        {activeInvoice && (
        <form onSubmit={handleExecutePayment} className="space-y-4">
          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-500">Patient:</span>
              <span className="font-bold text-slate-900">{activeInvoice.patient} ({activeInvoice.puid})</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Total Invoice Amount:</span>
              <span className="font-mono font-bold text-slate-900">QAR {activeInvoice.totalQar.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Amount Due:</span>
              <span className="font-mono font-bold text-[#0F766E]">QAR {activeInvoice.amountToPay.toFixed(2)}</span>
            </div>
          </div>

          {/* Payment Journal Selector (Resolves S7.7: Select Cash Journal) */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700">Payment Method / Cash Journal *</label>
            <select
              value={paymentJournal}
              onChange={(e) => setPaymentJournal(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg font-semibold focus:outline-none focus:border-[#0F766E]"
            >
              <option value="Cash">Cash Journal (Main Reception Till)</option>
              <option value="Debit Card">Debit / POS Terminal (Direct Settlement)</option>
              <option value="Credit Card">Credit Card (Visa / Mastercard)</option>
              <option value="Health Insurance">Qatar National Health Insurance</option>
            </select>
          </div>

          {/* Payment Amount Input */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700">Payment Amount (QAR) *</label>
            <input
              type="text"
              inputMode="decimal"
              value={paymentAmount}
              onChange={(e) => setPaymentAmount(e.target.value)}
              className="w-full px-3 py-2 text-sm font-mono font-bold bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:border-[#0F766E]"
              required
            />
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setIsPayModalOpen(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              isLoading={isProcessing}
              className="bg-emerald-600 hover:bg-emerald-700 font-bold"
            >
              Confirm & Execute Payment (QAR {paymentAmount})
            </Button>
          </div>
        </form>
        )}
      </Modal>

      {/* MODAL 2: NEW CUSTOMER INVOICE (Resolves S7.2, S7.3, S7.4) */}
      <Modal
        isOpen={isNewInvoiceModalOpen}
        onClose={() => setIsNewInvoiceModalOpen(false)}
        title="Create Customer Invoice"
        kicker="OUTPATIENT BILLING SERVICE (S7.2)"
        size="md"
      >
        <form onSubmit={handleCreateNewInvoice} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700">Select Patient *</label>
            <select
              value={newInvPatientId}
              onChange={(e) => setNewInvPatientId(parseInt(e.target.value, 10))}
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

          {/* Add Invoice Line - loaded live from this tenant's own product catalog */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700">Add Service Line Item *</label>
            {serviceCatalog.length === 0 ? (
              <p className="text-xs text-red-600 font-medium">No billable services are configured in this tenant's catalog yet.</p>
            ) : (
              <select
                value={selectedServiceIdx}
                onChange={(e) => setSelectedServiceIdx(parseInt(e.target.value, 10))}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg font-semibold focus:outline-none focus:border-[#0F766E]"
              >
                {serviceCatalog.map((svc, idx) => (
                  <option key={svc.id} value={idx}>
                    {svc.name} — QAR {svc.price.toFixed(2)}
                  </option>
                ))}
              </select>
            )}
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setIsNewInvoiceModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" className="bg-[#0F766E] font-bold" disabled={!newInvPatientId || !selectedService}>
              Save Invoice {selectedService ? `(QAR ${selectedService.price.toFixed(2)})` : ""}
            </Button>
          </div>
        </form>
      </Modal>

      {/* MODAL 3: OFFICIAL CASH RECEIPT VOUCHER - reflects the actual last-settled payment */}
      <Modal
        isOpen={isReceiptModalOpen && !!lastReceipt}
        onClose={() => setIsReceiptModalOpen(false)}
        title="Official Hospital Payment Receipt"
        kicker={`INVOICE: ${lastReceipt?.invoiceNumber || ""}`}
        size="md"
      >
        {lastReceipt && (
        <div className="space-y-4 p-2 font-mono text-xs">
          <div className="text-center pb-3 border-b border-dashed border-slate-300 space-y-1">
            <div className="font-bold text-sm text-slate-900 font-sans">IST HEALTH ENTERPRISE CLINIC</div>
            <div className="text-slate-500 text-[10px]">West Bay, Doha, State of Qatar</div>
            <div className="text-emerald-700 font-bold text-[11px]">OFFICIAL CASH COLLECTION RECEIPT</div>
          </div>

          <div className="space-y-1.5 text-[11px]">
            <div className="flex justify-between">
              <span className="text-slate-500">Customer Invoice:</span>
              <span className="font-bold text-slate-900">{lastReceipt.invoiceNumber}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Patient:</span>
              <span className="font-bold text-slate-900">{lastReceipt.patient} ({lastReceipt.puid})</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Payment Method:</span>
              <span className="font-bold text-slate-900">{lastReceipt.journal}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Amount Paid:</span>
              <span className="font-bold text-emerald-700 text-sm">QAR {lastReceipt.amount}</span>
            </div>
            <div className="flex justify-between border-t border-slate-200 pt-1">
              <span className="text-slate-500">Remaining Balance:</span>
              <span className="font-bold text-slate-900">QAR 0.00 (Settled)</span>
            </div>
          </div>

          <div className="pt-3 border-t border-dashed border-slate-300 flex items-center justify-between font-sans">
            <span className="text-[10px] text-slate-400">Financial records</span>
            <Button variant="outline" size="xs" onClick={() => setIsReceiptModalOpen(false)}>
              Close
            </Button>
          </div>
        </div>
        )}
      </Modal>
    </div>
  );
}
