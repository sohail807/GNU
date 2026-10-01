"use client";

import React, { useState, useEffect } from "react";
import {
  Building2,
  Plus,
  CheckCircle2,
  AlertCircle,
  BedDouble,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";

interface Ward {
  id: number;
  name: string;
  floor: number | null;
  plannedBeds: number | null;
  provisionedBeds: number;
  gender: string | null;
  isPrivate: boolean;
  bioHazard: boolean;
  extraInfo: string | null;
}

interface Bed {
  id: number;
  name: string;
  wardId: number | null;
  bedType: string | null;
  state: string | null;
}

const GENDER_LABELS: Record<string, string> = { men: "Men's Ward", women: "Women's Ward", unisex: "Unisex" };
const BED_STATE_VARIANT: Record<string, "green" | "amber" | "red" | "neutral"> = {
  free: "green",
  reserved: "amber",
  occupied: "red",
  to_clean: "amber",
  na: "neutral",
};

export default function FacilitiesPage() {
  const [wards, setWards] = useState<Ward[]>([]);
  const [beds, setBeds] = useState<Bed[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [isWardModalOpen, setIsWardModalOpen] = useState(false);
  const [formName, setFormName] = useState("");
  const [formFloor, setFormFloor] = useState("1");
  const [formBeds, setFormBeds] = useState("6");
  const [formGender, setFormGender] = useState("unisex");
  const [formPrivate, setFormPrivate] = useState(false);
  const [formNotes, setFormNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [isBedModalOpen, setIsBedModalOpen] = useState(false);
  const [bedWardId, setBedWardId] = useState<number | null>(null);
  const [bedName, setBedName] = useState("");
  const [bedType, setBedType] = useState("gatch");
  const [bedRate, setBedRate] = useState("0.00");

  const loadData = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const res = await fetch("/api/clinical/facilities");
      const data = await res.json();
      if (data.success) {
        setWards(Array.isArray(data.wards) ? data.wards : []);
        setBeds(Array.isArray(data.beds) ? data.beds : []);
      } else if (data.error) {
        setErrorMessage(data.error);
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to load ward directory");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateWard = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      setErrorMessage("A ward name is required.");
      return;
    }
    setIsSubmitting(true);
    setErrorMessage(null);
    try {
      const res = await fetch("/api/clinical/facilities", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "create_ward",
          name: formName,
          floor: formFloor,
          plannedBeds: formBeds,
          gender: formGender,
          isPrivate: formPrivate,
          extraInfo: formNotes,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || "Failed to register ward");
      await loadData();
      setIsWardModalOpen(false);
      setFormName("");
      setFormNotes("");
      setFeedback(data.message || "Ward registered.");
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to register ward");
    } finally {
      setIsSubmitting(false);
    }
  };

  const openBedModal = (wardId: number) => {
    setBedWardId(wardId);
    setBedName("");
    setBedType("gatch");
    setBedRate("0.00");
    setIsBedModalOpen(true);
  };

  const handleAddBed = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bedWardId || !bedName.trim()) {
      setErrorMessage("A bed name is required.");
      return;
    }
    setIsSubmitting(true);
    setErrorMessage(null);
    try {
      const res = await fetch("/api/clinical/facilities", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "add_bed", wardId: bedWardId, bedName, bedType, dailyRate: bedRate }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || "Failed to provision bed");
      await loadData();
      setIsBedModalOpen(false);
      setFeedback(data.message || "Bed provisioned.");
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to provision bed");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-7 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-slate-200/90 gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="kicker text-[#0F766E]">Facility Management</span>
            <span className="text-slate-300">/</span>
            <span className="kicker text-slate-500">Wards</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-semibold text-slate-900 tracking-tight">
            Ward & Facility Management
          </h1>
          <p className="text-xs text-slate-600 mt-1">
            Set up hospital wards and provision beds for the Inpatient module.
          </p>
        </div>
        <Button variant="primary" size="sm" onClick={() => setIsWardModalOpen(true)} leftIcon={<Plus className="w-4 h-4" />}>
          New Ward
        </Button>
      </div>

      {feedback && (
        <div className="p-4 rounded-xl bg-emerald-50 text-xs text-emerald-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{feedback}</span>
          </div>
          <button onClick={() => setFeedback(null)} className="text-emerald-700 font-bold px-2">✕</button>
        </div>
      )}
      {errorMessage && (
        <div className="p-4 rounded-xl bg-red-50 text-xs text-red-700 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {isLoading ? (
        <div className="p-12 text-center text-xs text-slate-500 font-mono">Loading ward directory...</div>
      ) : wards.length === 0 ? (
        <div className="bg-white border border-slate-200/90 rounded-xl shadow-2xs p-12 text-center space-y-3">
          <Building2 className="w-10 h-10 text-slate-300 mx-auto" />
          <div className="text-sm font-bold text-slate-800">No Wards Configured</div>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">No hospital wards have been set up for this tenant yet.</p>
        </div>
      ) : (
        <div className="space-y-5">
          {wards.map((w) => {
            const wardBeds = beds.filter((b) => b.wardId === w.id);
            return (
              <div key={w.id} className="bg-white border border-slate-200/90 rounded-xl shadow-2xs overflow-hidden">
                <div className="p-4 border-b border-slate-100 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-lg bg-teal-50 text-[#0F766E] flex items-center justify-center">
                      <Building2 className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-slate-900">{w.name}</h3>
                      <span className="text-[11px] text-slate-400">
                        Floor {w.floor ?? "—"} · Planned {w.plannedBeds ?? "—"} beds · {wardBeds.length} provisioned
                        {w.isPrivate && " · Private"}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {w.gender && <Badge variant="teal" size="sm">{GENDER_LABELS[w.gender] || w.gender}</Badge>}
                    <Button variant="outline" size="xs" onClick={() => openBedModal(w.id)} leftIcon={<Plus className="w-3.5 h-3.5" />}>
                      Bed
                    </Button>
                  </div>
                </div>
                {wardBeds.length > 0 && (
                  <div className="p-4 flex flex-wrap gap-2">
                    {wardBeds.map((b) => (
                      <span key={b.id} className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-50 border border-slate-200/80 text-xs">
                        <BedDouble className="w-3.5 h-3.5 text-slate-400" />
                        <span className="font-medium text-slate-700">{b.name}</span>
                        {b.state && <Badge variant={BED_STATE_VARIANT[b.state] || "neutral"} size="sm">{b.state}</Badge>}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <Modal isOpen={isWardModalOpen} onClose={() => setIsWardModalOpen(false)} title="Register New Ward" kicker="Facility Management" size="md">
        <form onSubmit={handleCreateWard} className="space-y-4">
          <Input label="Ward Name *" value={formName} onChange={(e) => setFormName(e.target.value)} required />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Floor" type="number" step="1" value={formFloor} onChange={(e) => setFormFloor(e.target.value)} />
            <Input label="Planned Bed Count" type="number" min="0" step="1" value={formBeds} onChange={(e) => setFormBeds(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-600">Ward Type *</label>
            <select
              value={formGender}
              onChange={(e) => setFormGender(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg font-medium focus:outline-none focus:border-[#0F766E]"
            >
              <option value="unisex">Unisex</option>
              <option value="men">Men's Ward</option>
              <option value="women">Women's Ward</option>
            </select>
          </div>
          <label className="flex items-center gap-2 text-xs text-slate-700">
            <input type="checkbox" checked={formPrivate} onChange={(e) => setFormPrivate(e.target.checked)} className="accent-[#0F766E]" />
            Private rooms
          </label>
          <Textarea label="Notes" value={formNotes} onChange={(e) => setFormNotes(e.target.value)} rows={2} />
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setIsWardModalOpen(false)}>Cancel</Button>
            <Button type="submit" variant="primary" isLoading={isSubmitting} className="bg-[#0F766E] font-bold">
              Register Ward
            </Button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={isBedModalOpen} onClose={() => setIsBedModalOpen(false)} title="Provision Bed" kicker="Facility Management" size="sm">
        <form onSubmit={handleAddBed} className="space-y-4">
          <Input label="Bed Name / Number *" value={bedName} onChange={(e) => setBedName(e.target.value)} placeholder="e.g. Bed A-101" required />
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-600">Bed Type</label>
            <select
              value={bedType}
              onChange={(e) => setBedType(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg font-medium focus:outline-none focus:border-[#0F766E]"
            >
              <option value="gatch">Gatch Bed</option>
              <option value="electric">Electric</option>
              <option value="stretcher">Stretcher</option>
              <option value="low">Low Bed</option>
              <option value="low_air_loss">Low Air Loss</option>
              <option value="circo_electric">Circo Electric</option>
              <option value="clinitron">Clinitron</option>
            </select>
          </div>
          <Input label="Daily Rate" type="number" min="0" step="0.01" value={bedRate} onChange={(e) => setBedRate(e.target.value)} />
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setIsBedModalOpen(false)}>Cancel</Button>
            <Button type="submit" variant="primary" isLoading={isSubmitting} className="bg-[#0F766E] font-bold">
              Provision Bed
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
