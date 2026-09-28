"use client";

import React, { useEffect, useState } from "react";
import { Building2, Plus, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";

interface Tenant {
  id: string;
  name: string;
  subdomain: string;
  database: string;
  currency: string;
  country: string;
  status: string;
}

export default function PlatformPage() {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [accessError, setAccessError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState({ name: "", subdomain: "", currency: "QAR", country: "QAT" });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [newCredentials, setNewCredentials] = useState<{ username: string; password: string } | null>(null);

  const fetchTenants = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/platform/tenants");
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setAccessError(null);
        setTenants(data.tenants || []);
      } else {
        setAccessError(data.error || `Unable to load tenants (HTTP ${res.status}).`);
      }
    } catch {
      setAccessError("Unable to reach the platform API.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTenants();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/platform/tenants", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to onboard tenant.");
      setSuccessMessage(data.message);
      setNewCredentials(data.initialAdminCredentials || null);
      setIsModalOpen(false);
      setForm({ name: "", subdomain: "", currency: "QAR", country: "QAT" });
      await fetchTenants();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Failed to onboard tenant.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b border-slate-200/80 pb-5">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono font-semibold text-[#0F766E] uppercase tracking-wider mb-1">
            <Building2 className="w-3.5 h-3.5" />
            <span>Platform Operations / Multi-Tenant Onboarding</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Hospital Tenant Directory</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Each row is a fully isolated hospital: its own database, its own staff, its own patients.
          </p>
        </div>
        <Button variant="primary" size="sm" onClick={() => setIsModalOpen(true)} leftIcon={<Plus className="w-4 h-4" />}>
          Onboard Hospital
        </Button>
      </div>

      {accessError && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-xs text-red-800 flex items-center gap-2 font-medium">
          <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
          <span>{accessError}</span>
        </div>
      )}
      {successMessage && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 space-y-2">
          <p>{successMessage}</p>
          {newCredentials && (
            <div className="rounded-lg bg-white border border-emerald-300 p-3 space-y-1">
              <p className="font-bold uppercase tracking-wide text-[10px] text-emerald-700">
                Initial Admin Login (shown once -- copy it now)
              </p>
              <p className="font-mono text-slate-800">Username: {newCredentials.username}</p>
              <p className="font-mono text-slate-800">Password: {newCredentials.password}</p>
              <p className="text-[10px] text-slate-500">
                This is a unique password generated for this hospital only. Hand it to their
                admin and have them change it on first login -- it is not stored or shown again.
              </p>
            </div>
          )}
        </div>
      )}

      <div className="border border-slate-200 rounded-xl overflow-hidden">
        <table className="w-full text-xs">
          <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] tracking-wide">
            <tr>
              <th className="text-left px-4 py-2">Hospital</th>
              <th className="text-left px-4 py-2">Subdomain</th>
              <th className="text-left px-4 py-2">Database</th>
              <th className="text-left px-4 py-2">Currency</th>
              <th className="text-left px-4 py-2">Status</th>
            </tr>
          </thead>
          <tbody>
            {!isLoading && tenants.length === 0 && !accessError && (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-slate-400">No tenants yet.</td>
              </tr>
            )}
            {tenants.map((t) => (
              <tr key={t.id} className="border-t border-slate-100">
                <td className="px-4 py-2.5 font-semibold text-slate-800">{t.name}</td>
                <td className="px-4 py-2.5 font-mono text-slate-500">{t.subdomain}</td>
                <td className="px-4 py-2.5 font-mono text-slate-500">{t.database}</td>
                <td className="px-4 py-2.5">{t.currency}</td>
                <td className="px-4 py-2.5">
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${t.status === "active" ? "bg-emerald-100 text-emerald-700" : "bg-slate-200 text-slate-600"}`}>
                    {t.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Onboard New Hospital" kicker="TENANT PROVISIONING">
        <form onSubmit={handleCreate} className="space-y-4">
          <Input label="Hospital Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Al Wakra General Hospital" required />
          <Input
            label="Subdomain"
            value={form.subdomain}
            onChange={(e) => setForm({ ...form, subdomain: e.target.value.toLowerCase() })}
            placeholder="e.g. alwakra (reachable at alwakra.yourdomain.com)"
            required
          />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Currency (ISO)" value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value.toUpperCase() })} placeholder="QAR" required />
            <Input label="Country (ISO)" value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value.toUpperCase() })} placeholder="QAT" required />
          </div>
          {formError && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-800 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
              <span>{formError}</span>
            </div>
          )}
          <p className="text-[11px] text-slate-500">
            This clones a fresh GNU Health database for this hospital (schema + base clinical
            dictionaries only, no other tenant&apos;s data). Takes a few seconds. You&apos;ll still need to
            point DNS at this subdomain and create the hospital&apos;s own staff accounts afterward.
          </p>
          <div className="pt-2 flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button type="submit" variant="primary" isLoading={isSubmitting}>Provision Database</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
