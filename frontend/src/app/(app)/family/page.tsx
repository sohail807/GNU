"use client";

import React, { useState, useEffect } from "react";
import {
  Users2,
  Plus,
  UserPlus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Home,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Modal } from "@/components/ui/Modal";

interface FamilyMember {
  id: number;
  partyId: number | null;
  partyName: string | null;
  partyRef: string | null;
  role: string | null;
}

interface Family {
  id: number;
  name: string;
  info: string | null;
  members: FamilyMember[];
}

export default function FamilyRegistryPage() {
  const [families, setFamilies] = useState<Family[]>([]);
  const [patientsList, setPatientsList] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [isNewFamilyOpen, setIsNewFamilyOpen] = useState(false);
  const [newFamilyName, setNewFamilyName] = useState("");
  const [newFamilyInfo, setNewFamilyInfo] = useState("");

  const [isAddMemberOpen, setIsAddMemberOpen] = useState(false);
  const [targetFamilyId, setTargetFamilyId] = useState<number | null>(null);
  const [memberPartyId, setMemberPartyId] = useState<number>(0);
  const [memberRole, setMemberRole] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadData = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const [famRes, patRes] = await Promise.all([
        fetch("/api/clinical/family"),
        fetch("/api/clinical/patients"),
      ]);
      const famData = await famRes.json();
      const patData = await patRes.json();
      if (famData.success && Array.isArray(famData.families)) {
        setFamilies(famData.families);
      } else if (famData.error) {
        setErrorMessage(famData.error);
      }
      if (patData.success && Array.isArray(patData.patients)) {
        setPatientsList(patData.patients.filter((p: any) => p.partyId));
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to load family registry");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateFamily = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFamilyName.trim()) {
      setErrorMessage("A household name is required.");
      return;
    }
    setIsSubmitting(true);
    setErrorMessage(null);
    try {
      const res = await fetch("/api/clinical/family", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "create_family", name: newFamilyName, info: newFamilyInfo }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || "Failed to register household");
      await loadData();
      setIsNewFamilyOpen(false);
      setNewFamilyName("");
      setNewFamilyInfo("");
      setFeedback(data.message || "Household registered.");
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to register household");
    } finally {
      setIsSubmitting(false);
    }
  };

  const openAddMember = (familyId: number) => {
    setTargetFamilyId(familyId);
    setMemberPartyId(patientsList[0]?.partyId || 0);
    setMemberRole("");
    setIsAddMemberOpen(true);
  };

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetFamilyId || !memberPartyId) {
      setErrorMessage("Select a patient to add to this household.");
      return;
    }
    setIsSubmitting(true);
    setErrorMessage(null);
    try {
      const res = await fetch("/api/clinical/family", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "add_member", familyId: targetFamilyId, partyId: memberPartyId, role: memberRole }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || "Failed to add family member");
      await loadData();
      setIsAddMemberOpen(false);
      setFeedback(data.message || "Family member added.");
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to add family member");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemoveMember = async (memberId: number) => {
    setErrorMessage(null);
    try {
      const res = await fetch("/api/clinical/family", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "remove_member", memberId }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || "Failed to remove family member");
      await loadData();
      setFeedback(data.message || "Family member removed.");
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to remove family member");
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-7 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-slate-200/90 gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="kicker text-[#0F766E]">SOCIAL CONTEXT</span>
            <span className="text-slate-300">/</span>
            <span className="kicker text-slate-500">FAMILY & HOUSEHOLD REGISTRY</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-semibold text-slate-900 tracking-tight">
            Family & Household Registry
          </h1>
          <p className="text-xs text-slate-600 mt-1">
            Group patients into households for family medicine and social context.
          </p>
        </div>
        <Button variant="primary" size="sm" onClick={() => setIsNewFamilyOpen(true)} leftIcon={<Plus className="w-4 h-4" />}>
          + New Household
        </Button>
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

      {isLoading ? (
        <div className="p-12 text-center text-xs text-slate-500 font-mono">Loading household registry...</div>
      ) : families.length === 0 ? (
        <div className="bg-white border border-slate-200/90 rounded-2xl shadow-2xs p-12 text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-teal-50 text-[#0F766E] flex items-center justify-center mx-auto">
            <Home className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">No Households Registered</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              No family/household groupings have been created yet in this tenant.
            </p>
          </div>
          <Button variant="primary" size="sm" onClick={() => setIsNewFamilyOpen(true)} leftIcon={<Plus className="w-4 h-4" />}>
            + New Household
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {families.map((fam) => (
            <div key={fam.id} className="bg-white border border-slate-200/90 rounded-2xl shadow-2xs p-5 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-lg bg-[#0F766E] text-white flex items-center justify-center shadow-xs">
                    <Users2 className="w-4 h-4 text-emerald-200" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">{fam.name}</h3>
                    <span className="text-[11px] text-slate-500 font-mono">{fam.members.length} member(s)</span>
                  </div>
                </div>
                <Button variant="outline" size="xs" onClick={() => openAddMember(fam.id)} leftIcon={<UserPlus className="w-3.5 h-3.5" />}>
                  Add Member
                </Button>
              </div>

              {fam.info && <p className="text-xs text-slate-600">{fam.info}</p>}

              {fam.members.length === 0 ? (
                <p className="text-xs text-slate-400 italic">No members linked yet.</p>
              ) : (
                <div className="space-y-2">
                  {fam.members.map((m) => (
                    <div key={m.id} className="flex items-center justify-between p-2.5 bg-slate-50 border border-slate-200/80 rounded-lg text-xs">
                      <div>
                        <span className="font-bold text-slate-900">{m.partyName || "Unknown party"}</span>
                        {m.partyRef && <span className="ml-2 font-mono text-slate-500">{m.partyRef}</span>}
                        {m.role && <span className="ml-2 px-1.5 py-0.5 bg-teal-100 text-[#0F766E] rounded font-semibold">{m.role}</span>}
                      </div>
                      <button onClick={() => handleRemoveMember(m.id)} className="text-slate-400 hover:text-red-600" title="Remove from household">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* MODAL: NEW HOUSEHOLD */}
      <Modal isOpen={isNewFamilyOpen} onClose={() => setIsNewFamilyOpen(false)} title="Register New Household" kicker="FAMILY REGISTRY" size="md">
        <form onSubmit={handleCreateFamily} className="space-y-4">
          <Input label="Household Name *" value={newFamilyName} onChange={(e) => setNewFamilyName(e.target.value)} required />
          <Textarea label="Social/Household Notes" value={newFamilyInfo} onChange={(e) => setNewFamilyInfo(e.target.value)} rows={3} />
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setIsNewFamilyOpen(false)}>Cancel</Button>
            <Button type="submit" variant="primary" isLoading={isSubmitting} className="bg-[#0F766E] font-bold">Register Household</Button>
          </div>
        </form>
      </Modal>

      {/* MODAL: ADD MEMBER */}
      <Modal isOpen={isAddMemberOpen} onClose={() => setIsAddMemberOpen(false)} title="Add Family Member" kicker="FAMILY REGISTRY" size="md">
        <form onSubmit={handleAddMember} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700">Select Patient *</label>
            {patientsList.length === 0 ? (
              <p className="text-xs text-red-600 font-medium">No patients found in this tenant.</p>
            ) : (
              <select
                value={memberPartyId}
                onChange={(e) => setMemberPartyId(parseInt(e.target.value, 10))}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg font-semibold focus:outline-none focus:border-[#0F766E]"
              >
                {patientsList.map((p) => (
                  <option key={p.partyId} value={p.partyId}>
                    {p.name} (PUID: {p.puid})
                  </option>
                ))}
              </select>
            )}
          </div>
          <Input label="Household Role (e.g. Father, Mother, Sibling)" value={memberRole} onChange={(e) => setMemberRole(e.target.value)} />
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setIsAddMemberOpen(false)}>Cancel</Button>
            <Button type="submit" variant="primary" isLoading={isSubmitting} disabled={!memberPartyId} className="bg-[#0F766E] font-bold">Add Member</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
