"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Users,
  Search,
  UserPlus,
  Stethoscope,
  Activity,
  Receipt,
  ArrowRight,
  Filter,
  CheckCircle2,
  Calendar,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";

interface PatientItem {
  id: number;
  name: string;
  puid: string;
  age: number;
  gender: string;
  bloodGroup: string;
  phone?: string;
  qid?: string;
}

export default function MasterPatientDirectoryPage() {
  const [patients, setPatients] = useState<PatientItem[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [genderFilter, setGenderFilter] = useState("all");
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    async function loadPatients() {
      setIsLoading(true);
      try {
        const res = await fetch("/api/clinical/patients");
        const data = await res.json();
        if (data.success && Array.isArray(data.patients)) {
          setPatients(data.patients);
        } else {
          setErrorMessage(data.error || "Failed to load patient records");
        }
      } catch (err: any) {
        setErrorMessage(err.message || "Network error loading patients");
      } finally {
        setIsLoading(false);
      }
    }
    loadPatients();
  }, []);

  const filtered = patients.filter((p) => {
    const q = searchTerm.toLowerCase();
    const matchesSearch =
      p.name.toLowerCase().includes(q) ||
      p.puid.toLowerCase().includes(q) ||
      (p.qid && p.qid.toLowerCase().includes(q));

    const matchesGender =
      genderFilter === "all" || p.gender.toLowerCase() === genderFilter.toLowerCase();

    return matchesSearch && matchesGender;
  });

  return (
    <div className="max-w-7xl mx-auto space-y-7 animate-fade-in">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-slate-200/90 gap-4">
        <div>
          <div className="kicker text-[#0F766E] mb-1">HEALTH INFORMATION MANAGEMENT · MASTER EHR</div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Master Patient Registry & Charts
          </h1>
          <p className="text-xs text-slate-600 mt-1">
            Authoritative GNU Health Patient Records Directory · Search by Name, PUID or Qatar ID.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link href="/frontdesk">
            <Button
              variant="primary"
              size="sm"
              leftIcon={<UserPlus className="w-4 h-4" />}
              className="bg-[#0F766E] hover:bg-[#115E59] font-bold"
            >
              + Register New Patient
            </Button>
          </Link>
        </div>
      </div>

      {errorMessage && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-xs text-red-800 font-medium">
          {errorMessage}
        </div>
      )}

      {/* FILTER & SEARCH BAR */}
      <div className="p-4 bg-white border border-slate-200/90 rounded-2xl shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-96">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by Patient Name, PUID (e.g. P00088), or QID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:border-[#0F766E]"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-xs text-slate-500 font-medium">Gender:</span>
          <select
            value={genderFilter}
            onChange={(e) => setGenderFilter(e.target.value)}
            className="text-xs font-semibold bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-[#0F766E]"
          >
            <option value="all">All Genders</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
          </select>
        </div>
      </div>

      {/* PATIENT LIST TABLE */}
      <div className="bg-white border border-slate-200/90 rounded-2xl shadow-2xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-[#0F766E]" />
            <h3 className="text-sm font-bold text-slate-900">
              Registered Patients ({filtered.length})
            </h3>
          </div>
          <span className="text-[11px] font-mono text-slate-500">
            Tryton Model: <strong className="text-teal-700">gnuhealth.patient</strong>
          </span>
        </div>

        {isLoading ? (
          <div className="p-12 text-center text-xs text-slate-500 font-mono">
            Loading master patient records from GNU Health...
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <Users className="w-8 h-8 text-slate-400 mx-auto" />
            <p className="text-xs text-slate-500 font-medium">
              No matching patient records found.
            </p>
            <Link href="/frontdesk">
              <Button variant="outline" size="sm">
                Register New Patient
              </Button>
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200/80 font-mono text-[11px] text-slate-500 uppercase tracking-wider">
                  <th className="py-3 px-4">PUID</th>
                  <th className="py-3 px-4">Patient Name</th>
                  <th className="py-3 px-4">Demographics</th>
                  <th className="py-3 px-4">Blood Group</th>
                  <th className="py-3 px-4">Contact</th>
                  <th className="py-3 px-4 text-right">Clinical Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-sans">
                {filtered.map((pat) => (
                  <tr key={pat.id} className="hover:bg-teal-50/40 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-[#0F766E]">
                      {pat.puid}
                    </td>
                    <td className="py-3.5 px-4">
                      <Link
                        href={`/patient/${pat.id}`}
                        className="font-bold text-slate-900 hover:text-[#0F766E] flex items-center gap-1.5"
                      >
                        <span>{pat.name}</span>
                      </Link>
                    </td>
                    <td className="py-3.5 px-4 text-slate-600">
                      {pat.age} Y · {pat.gender}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-700">
                      {pat.bloodGroup || "—"}
                    </td>
                    <td className="py-3.5 px-4 text-slate-500 font-mono text-[11px]">
                      {pat.phone || "+974 5512 8492"}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Link href={`/patient/${pat.id}`}>
                          <Button variant="ghost" size="xs" className="font-bold text-slate-700 hover:text-[#0F766E]">
                            Chart
                          </Button>
                        </Link>
                        <Link href={`/physician?patientId=${pat.id}`}>
                          <Button variant="outline" size="xs" className="font-bold text-[#0F766E]">
                            Consult
                          </Button>
                        </Link>
                        <Link href={`/nursing?patientId=${pat.id}`}>
                          <Button variant="ghost" size="xs" className="text-slate-600">
                            Triage
                          </Button>
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
