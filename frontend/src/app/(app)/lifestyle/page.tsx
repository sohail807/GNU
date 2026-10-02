"use client";

import React, { useState, useEffect, useCallback } from "react";
import { HeartPulse, CheckCircle2, AlertCircle, Wine, Cigarette, Salad, Shield, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { Badge } from "@/components/ui/Badge";

interface LifestyleProfile {
  id: number;
  vegetarianType: number | null;
  dietBelief: number | null;
  [key: string]: any;
}

interface CageEntry {
  id: number;
  evaluationDate: string | null;
  cageC: boolean; cageA: boolean; cageG: boolean; cageE: boolean;
  score: number;
}

interface DrugEntry { id: number; drugId: number | null; drugName: string | null; }

const Check: React.FC<{ label: string; checked: boolean; onChange: (v: boolean) => void }> = ({ label, checked, onChange }) => (
  <label className="flex items-center gap-2 text-xs text-slate-700 py-1 cursor-pointer select-none">
    <input type="checkbox" checked={!!checked} onChange={(e) => onChange(e.target.checked)} className="w-4 h-4 rounded border-slate-300 text-[#0F766E] focus:ring-[#0F766E]/30" />
    {label}
  </label>
);

const Num: React.FC<{ label: string; value: any; onChange: (v: string) => void }> = ({ label, value, onChange }) => (
  <div className="space-y-1">
    <label className="text-xs font-medium text-slate-600">{label}</label>
    <input type="number" value={value ?? ""} onChange={(e) => onChange(e.target.value)} className="w-full h-9 px-2.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-[#0F766E]" />
  </div>
);

const Section: React.FC<{ title: string; icon: React.ReactNode; children: React.ReactNode }> = ({ title, icon, children }) => (
  <div className="bg-white border border-slate-200/90 rounded-xl shadow-2xs p-5 space-y-3">
    <div className="flex items-center gap-2 text-sm font-bold text-slate-800 pb-2 border-b border-slate-100">
      {icon}{title}
    </div>
    {children}
  </div>
);

export default function LifestylePage() {
  const [patients, setPatients] = useState<{ id: number; name: string; puid: string }[]>([]);
  const [vegetarianTypes, setVegetarianTypes] = useState<{ id: number; name: string }[]>([]);
  const [dietBeliefs, setDietBeliefs] = useState<{ id: number; name: string }[]>([]);
  const [drugCatalog, setDrugCatalog] = useState<{ id: number; name: string; category: string }[]>([]);

  const [selectedPatientId, setSelectedPatientId] = useState<number | "">("");
  const [profile, setProfile] = useState<LifestyleProfile | null>(null);
  const [cageHistory, setCageHistory] = useState<CageEntry[]>([]);
  const [recreationalDrugs, setRecreationalDrugs] = useState<DrugEntry[]>([]);
  const [cageRestricted, setCageRestricted] = useState(false);
  const [drugsRestricted, setDrugsRestricted] = useState(false);

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [cageC, setCageC] = useState(false);
  const [cageA, setCageA] = useState(false);
  const [cageG, setCageG] = useState(false);
  const [cageE, setCageE] = useState(false);
  const [selectedDrugId, setSelectedDrugId] = useState<number | "">("");

  const loadPatientList = useCallback(async () => {
    try {
      const res = await fetch("/api/clinical/lifestyle");
      const data = await res.json();
      if (data.success) {
        setPatients(data.patients || []);
        setVegetarianTypes(data.vegetarianTypes || []);
        setDietBeliefs(data.dietBeliefs || []);
        setDrugCatalog(data.recreationalDrugCatalog || []);
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

  const loadProfile = useCallback(async (patientId: number) => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const res = await fetch(`/api/clinical/lifestyle?patientId=${patientId}`);
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || "Failed to load lifestyle profile");
      setProfile(data.profile);
      setCageHistory(data.cageHistory || []);
      setRecreationalDrugs(data.recreationalDrugs || []);
      setCageRestricted(!!data.cageRestricted);
      setDrugsRestricted(!!data.drugsRestricted);
    } catch (e: any) {
      setErrorMessage(e.message || "Failed to load lifestyle profile");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { loadPatientList(); }, [loadPatientList]);
  useEffect(() => {
    if (typeof selectedPatientId === "number") loadProfile(selectedPatientId);
  }, [selectedPatientId, loadProfile]);

  const set = (key: string, value: any) => setProfile((prev) => (prev ? { ...prev, [key]: value } : prev));

  const handleSave = async () => {
    if (!profile || typeof selectedPatientId !== "number") return;
    setIsSaving(true);
    setErrorMessage(null);
    try {
      const res = await fetch("/api/clinical/lifestyle", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ patientId: selectedPatientId, ...profile }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || "Failed to save");
      setFeedback(data.message || "Lifestyle & social history updated.");
    } catch (e: any) {
      setErrorMessage(e.message || "Failed to save lifestyle profile");
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddCage = async () => {
    if (typeof selectedPatientId !== "number") return;
    setErrorMessage(null);
    try {
      const res = await fetch("/api/clinical/lifestyle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "addCage", patientId: selectedPatientId, cageC, cageA, cageG, cageE }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || "Failed to record CAGE assessment");
      setFeedback(data.message);
      setCageC(false); setCageA(false); setCageG(false); setCageE(false);
      loadProfile(selectedPatientId);
    } catch (e: any) {
      setErrorMessage(e.message || "Failed to record CAGE assessment");
    }
  };

  const handleAddDrug = async () => {
    if (typeof selectedPatientId !== "number" || !selectedDrugId) return;
    setErrorMessage(null);
    try {
      const res = await fetch("/api/clinical/lifestyle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "addDrug", patientId: selectedPatientId, drugId: selectedDrugId }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || "Failed to record drug use");
      setFeedback(data.message);
      setSelectedDrugId("");
      loadProfile(selectedPatientId);
    } catch (e: any) {
      setErrorMessage(e.message || "Failed to record drug use");
    }
  };

  const handleRemoveDrug = async (id: number) => {
    if (typeof selectedPatientId !== "number") return;
    setErrorMessage(null);
    try {
      const res = await fetch("/api/clinical/lifestyle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "removeDrug", id }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || "Failed to remove record");
      loadProfile(selectedPatientId);
    } catch (e: any) {
      setErrorMessage(e.message || "Failed to remove record");
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-7 animate-fade-in">
      <div className="pb-6 border-b border-slate-200/90">
        <div className="flex items-center gap-2 mb-1">
          <span className="kicker text-[#0F766E]">CLINICAL DOCUMENTATION</span>
          <span className="text-slate-300">/</span>
          <span className="kicker text-slate-500">LIFESTYLE & SOCIAL HISTORY</span>
        </div>
        <h1 className="text-xl sm:text-2xl font-semibold text-slate-900 tracking-tight">Lifestyle & Social History</h1>
        <p className="text-xs text-slate-600 mt-1">Diet, exercise, tobacco/alcohol/substance use, CAGE screening and sexual health history.</p>
      </div>

      {feedback && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center justify-between shadow-2xs font-medium">
          <div className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" /><span>{feedback}</span></div>
          <button onClick={() => setFeedback(null)} className="text-emerald-700 font-bold px-2">✕</button>
        </div>
      )}
      {errorMessage && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-xs text-red-800 flex items-center gap-2 shadow-2xs font-medium">
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0" /><span>{errorMessage}</span>
        </div>
      )}

      <div className="bg-white border border-slate-200/90 rounded-xl shadow-2xs p-5">
        <Select
          label="Select Patient"
          options={[{ value: "", label: "— Choose a patient —" }, ...patients.map((p) => ({ value: String(p.id), label: `${p.name} (PUID: ${p.puid})` }))]}
          value={selectedPatientId === "" ? "" : String(selectedPatientId)}
          onChange={(e) => setSelectedPatientId(e.target.value ? parseInt(e.target.value, 10) : "")}
        />
      </div>

      {typeof selectedPatientId === "number" && (
        isLoading ? (
          <div className="p-12 text-center text-xs text-slate-500 font-mono">Loading lifestyle profile...</div>
        ) : profile ? (
          <>
            <div className="grid md:grid-cols-2 gap-5">
              <Section title="Diet & Nutrition" icon={<Salad className="w-4 h-4 text-emerald-600" />}>
                <div className="grid grid-cols-2 gap-3">
                  <Select label="Vegetarian Type" options={[{ value: "", label: "None" }, ...vegetarianTypes.map((v) => ({ value: String(v.id), label: v.name }))]} value={profile.vegetarianType ? String(profile.vegetarianType) : ""} onChange={(e) => set("vegetarianType", e.target.value ? Number(e.target.value) : null)} />
                  <Select label="Dietary Belief" options={[{ value: "", label: "None" }, ...dietBeliefs.map((v) => ({ value: String(v.id), label: v.name }))]} value={profile.dietBelief ? String(profile.dietBelief) : ""} onChange={(e) => set("dietBelief", e.target.value ? Number(e.target.value) : null)} />
                  <Num label="Meals / day" value={profile.number_of_meals} onChange={(v) => set("number_of_meals", v ? Number(v) : null)} />
                  <Num label="Coffee cups / day" value={profile.coffee_cups} onChange={(v) => set("coffee_cups", v ? Number(v) : null)} />
                </div>
                <div className="grid grid-cols-2 gap-1 pt-2">
                  <Check label="Eats alone" checked={profile.eats_alone} onChange={(v) => set("eats_alone", v)} />
                  <Check label="Adds salt to food" checked={profile.salt} onChange={(v) => set("salt", v)} />
                  <Check label="Drinks coffee" checked={profile.coffee} onChange={(v) => set("coffee", v)} />
                  <Check label="Drinks sugared soft drinks" checked={profile.soft_drinks} onChange={(v) => set("soft_drinks", v)} />
                  <Check label="Currently on a diet" checked={profile.diet} onChange={(v) => set("diet", v)} />
                </div>
                {profile.diet && (
                  <input type="text" placeholder="Diet description" value={profile.diet_info || ""} onChange={(e) => set("diet_info", e.target.value)} className="w-full h-9 px-2.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-[#0F766E]" />
                )}
              </Section>

              <Section title="Exercise & Sleep" icon={<HeartPulse className="w-4 h-4 text-rose-600" />}>
                <div className="grid grid-cols-2 gap-3">
                  <Num label="Exercise minutes / day" value={profile.exercise_minutes_day} onChange={(v) => set("exercise_minutes_day", v ? Number(v) : null)} />
                  <Num label="Sleep hours / night" value={profile.sleep_hours} onChange={(v) => set("sleep_hours", v ? Number(v) : null)} />
                </div>
                <div className="grid grid-cols-2 gap-1 pt-2">
                  <Check label="Exercises regularly" checked={profile.exercise} onChange={(v) => set("exercise", v)} />
                  <Check label="Sleeps during daytime" checked={profile.sleep_during_daytime} onChange={(v) => set("sleep_during_daytime", v)} />
                </div>
              </Section>

              <Section title="Tobacco Use" icon={<Cigarette className="w-4 h-4 text-slate-600" />}>
                <div className="grid grid-cols-2 gap-1">
                  <Check label="Currently smokes" checked={profile.smoking} onChange={(v) => set("smoking", v)} />
                  <Check label="Ex-smoker" checked={profile.ex_smoker} onChange={(v) => set("ex_smoker", v)} />
                  <Check label="Second-hand / passive smoker" checked={profile.second_hand_smoker} onChange={(v) => set("second_hand_smoker", v)} />
                </div>
                <div className="grid grid-cols-3 gap-3 pt-2">
                  <Num label="Cigarettes / day" value={profile.smoking_number} onChange={(v) => set("smoking_number", v ? Number(v) : null)} />
                  <Num label="Age started" value={profile.age_start_smoking} onChange={(v) => set("age_start_smoking", v ? Number(v) : null)} />
                  <Num label="Age quit" value={profile.age_quit_smoking} onChange={(v) => set("age_quit_smoking", v ? Number(v) : null)} />
                </div>
              </Section>

              <Section title="Alcohol Use" icon={<Wine className="w-4 h-4 text-purple-600" />}>
                <div className="grid grid-cols-2 gap-1">
                  <Check label="Drinks alcohol" checked={profile.alcohol} onChange={(v) => set("alcohol", v)} />
                  <Check label="Ex-alcoholic" checked={profile.ex_alcoholic} onChange={(v) => set("ex_alcoholic", v)} />
                </div>
                <div className="grid grid-cols-2 gap-3 pt-2">
                  <Num label="Age started drinking" value={profile.age_start_drinking} onChange={(v) => set("age_start_drinking", v ? Number(v) : null)} />
                  <Num label="Age quit drinking" value={profile.age_quit_drinking} onChange={(v) => set("age_quit_drinking", v ? Number(v) : null)} />
                  <Num label="Beers / day" value={profile.alcohol_beer_number} onChange={(v) => set("alcohol_beer_number", v ? Number(v) : null)} />
                  <Num label="Glasses of wine / day" value={profile.alcohol_wine_number} onChange={(v) => set("alcohol_wine_number", v ? Number(v) : null)} />
                  <Num label="Liquor drinks / day" value={profile.alcohol_liquor_number} onChange={(v) => set("alcohol_liquor_number", v ? Number(v) : null)} />
                </div>

                <div className="pt-3 border-t border-slate-100 mt-2">
                  <div className="text-xs font-bold text-slate-700 mb-2">CAGE Screening (alcohol dependency)</div>
                  {cageRestricted ? (
                    <p className="text-[11px] text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-2.5">
                      Your account's Tryton role does not have access to CAGE screening records (restricted to Health Doctor / Health Lifestyle Administration).
                    </p>
                  ) : (
                    <>
                      <div className="space-y-0.5">
                        <Check label="Felt need to Cut down drinking" checked={cageC} onChange={setCageC} />
                        <Check label="Annoyed by people criticizing drinking" checked={cageA} onChange={setCageA} />
                        <Check label="Felt Guilty about drinking" checked={cageG} onChange={setCageG} />
                        <Check label="Needed an Eye-opener drink" checked={cageE} onChange={setCageE} />
                      </div>
                      <Button variant="outline" size="xs" className="mt-2" onClick={handleAddCage}>Record CAGE Assessment</Button>
                    </>
                  )}
                  {cageHistory.length > 0 && (
                    <div className="mt-3 space-y-1.5">
                      {cageHistory.map((c) => (
                        <div key={c.id} className="flex items-center justify-between text-[11px] bg-slate-50 rounded-lg px-3 py-1.5">
                          <span className="text-slate-600 font-mono">{c.evaluationDate?.slice(0, 16) || "—"}</span>
                          <Badge variant={c.score > 1 ? "red" : "neutral"} size="sm">Score {c.score}/4{c.score > 1 ? " — clinically significant" : ""}</Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </Section>

              <Section title="Substance Use" icon={<AlertCircle className="w-4 h-4 text-amber-600" />}>
                <div className="grid grid-cols-2 gap-1">
                  <Check label="Uses recreational drugs" checked={profile.drug_usage} onChange={(v) => set("drug_usage", v)} />
                  <Check label="Ex drug addict" checked={profile.ex_drug_addict} onChange={(v) => set("ex_drug_addict", v)} />
                  <Check label="IV drug user" checked={profile.drug_iv} onChange={(v) => set("drug_iv", v)} />
                </div>
                <div className="grid grid-cols-2 gap-3 pt-2">
                  <Num label="Age started" value={profile.age_start_drugs} onChange={(v) => set("age_start_drugs", v ? Number(v) : null)} />
                  <Num label="Age quit" value={profile.age_quit_drugs} onChange={(v) => set("age_quit_drugs", v ? Number(v) : null)} />
                </div>
                <div className="pt-3 border-t border-slate-100 mt-2">
                  <div className="text-xs font-bold text-slate-700 mb-2">Specific Drugs Used</div>
                  {drugsRestricted ? (
                    <p className="text-[11px] text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-2.5">
                      Your account's Tryton role does not have access to recreational drug use records (restricted to Health Doctor / Health Lifestyle Administration / Health Social Worker).
                    </p>
                  ) : (
                    <div className="flex gap-2">
                      <select value={selectedDrugId} onChange={(e) => setSelectedDrugId(e.target.value ? Number(e.target.value) : "")} className="flex-1 h-9 px-2.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-[#0F766E]">
                        <option value="">— Select drug —</option>
                        {drugCatalog.map((d) => (<option key={d.id} value={d.id}>{d.name} ({d.category})</option>))}
                      </select>
                      <Button variant="outline" size="xs" onClick={handleAddDrug} disabled={!selectedDrugId}><Plus className="w-3.5 h-3.5" /></Button>
                    </div>
                  )}
                  {recreationalDrugs.length > 0 && (
                    <div className="mt-2 space-y-1">
                      {recreationalDrugs.map((d) => (
                        <div key={d.id} className="flex items-center justify-between text-[11px] bg-slate-50 rounded-lg px-3 py-1.5">
                          <span>{d.drugName || "—"}</span>
                          <button onClick={() => handleRemoveDrug(d.id)} className="text-red-500 hover:text-red-700"><Trash2 className="w-3.5 h-3.5" /></button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </Section>

              <Section title="Safety Behaviors" icon={<Shield className="w-4 h-4 text-blue-600" />}>
                <div className="grid grid-cols-2 gap-1">
                  <Check label="Obeys traffic laws" checked={profile.traffic_laws} onChange={(v) => set("traffic_laws", v)} />
                  <Check label="Regular car maintenance" checked={profile.car_revision} onChange={(v) => set("car_revision", v)} />
                  <Check label="Uses seat belt" checked={profile.car_seat_belt} onChange={(v) => set("car_seat_belt", v)} />
                  <Check label="Uses child car safety seats" checked={profile.car_child_safety} onChange={(v) => set("car_child_safety", v)} />
                  <Check label="Follows home safety practices" checked={profile.home_safety} onChange={(v) => set("home_safety", v)} />
                  <Check label="Rides motorcycle" checked={profile.motorcycle_rider} onChange={(v) => set("motorcycle_rider", v)} />
                  <Check label="Uses helmet" checked={profile.helmet} onChange={(v) => set("helmet", v)} />
                </div>
              </Section>

              <Section title="Sexual Health" icon={<HeartPulse className="w-4 h-4 text-pink-600" />}>
                <div className="grid grid-cols-2 gap-3">
                  <Select label="Sexual Preference" options={[{ value: "", label: "—" }, { value: "h", label: "Heterosexual" }, { value: "g", label: "Homosexual" }, { value: "b", label: "Bisexual" }, { value: "t", label: "Transexual" }]} value={profile.sexual_preferences || ""} onChange={(e) => set("sexual_preferences", e.target.value || null)} />
                  <Select label="Sexual Practices" options={[{ value: "", label: "—" }, { value: "s", label: "Safe / Protected sex" }, { value: "r", label: "Risky / Unprotected sex" }]} value={profile.sexual_practices || ""} onChange={(e) => set("sexual_practices", e.target.value || null)} />
                  <Select label="Partners" options={[{ value: "", label: "—" }, { value: "m", label: "Monogamous" }, { value: "t", label: "Polygamous" }]} value={profile.sexual_partners || ""} onChange={(e) => set("sexual_partners", e.target.value || null)} />
                  <Num label="Number of partners" value={profile.sexual_partners_number} onChange={(v) => set("sexual_partners_number", v ? Number(v) : null)} />
                  <Num label="Age of first encounter" value={profile.first_sexual_encounter} onChange={(v) => set("first_sexual_encounter", v ? Number(v) : null)} />
                  <Select label="Contraceptive Method" options={[{ value: "", label: "None" }, { value: "1", label: "Pill / Minipill" }, { value: "2", label: "Male condom" }, { value: "3", label: "Vasectomy" }, { value: "4", label: "Female sterilisation" }, { value: "5", label: "Intra-uterine device" }, { value: "6", label: "Withdrawal method" }, { value: "7", label: "Fertility cycle awareness" }, { value: "8", label: "Contraceptive injection" }, { value: "9", label: "Skin Patch" }, { value: "10", label: "Female condom" }]} value={profile.anticonceptive || ""} onChange={(e) => set("anticonceptive", e.target.value || null)} />
                </div>
                <div className="grid grid-cols-2 gap-1 pt-2">
                  <Check label="Prostitute" checked={profile.prostitute} onChange={(v) => set("prostitute", v)} />
                  <Check label="Has sex with prostitutes" checked={profile.sex_with_prostitutes} onChange={(v) => set("sex_with_prostitutes", v)} />
                </div>
              </Section>
            </div>

            <div className="bg-white border border-slate-200/90 rounded-xl shadow-2xs p-5 space-y-3">
              <Textarea label="Additional Lifestyle Notes" value={profile.lifestyle_info || ""} onChange={(e) => set("lifestyle_info", e.target.value)} rows={3} />
              <Textarea label="Additional Sexual Health Notes" value={profile.sexuality_info || ""} onChange={(e) => set("sexuality_info", e.target.value)} rows={2} />
              <div className="flex justify-end pt-2 border-t border-slate-100">
                <Button variant="primary" isLoading={isSaving} onClick={handleSave} className="bg-[#0F766E] font-bold">
                  Save Lifestyle & Social History
                </Button>
              </div>
            </div>
          </>
        ) : null
      )}
    </div>
  );
}
