"use client";

import React, { useState, useEffect } from "react";
import {
  Scissors,
  Activity,
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  Plus,
  Search,
  Filter,
  User,
  ShieldCheck,
  FileCheck,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";

interface OperatingRoom {
  id: number;
  name: string;
  state: string;
}

interface Surgery {
  id: number;
  code: string;
  description: string;
  patientId: number;
  patientName: string;
  operatingRoomId: number;
  operatingRoomName: string;
  surgeon: string;
  anesthetist: string;
  surgeryDate: string;
  anesthesiaType: string;
  classification: string;
  state: string;
  postopGuidelines: string;
}

interface SurgeryStats {
  totalTheatres: number;
  scheduledToday: number;
  inProgress: number;
  completed: number;
}

export default function SurgeryPage() {
  const [operatingRooms, setOperatingRooms] = useState<OperatingRoom[]>([]);
  const [surgeries, setSurgeries] = useState<Surgery[]>([]);
  const [stats, setStats] = useState<SurgeryStats>({
    totalTheatres: 0,
    scheduledToday: 0,
    inProgress: 0,
    completed: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  // Book Surgery Modal
  const [isBookModalOpen, setIsBookModalOpen] = useState(false);
  const [patientId, setPatientId] = useState("");
  const [description, setDescription] = useState("");
  const [operatingRoomId, setOperatingRoomId] = useState("");
  const [surgeryDate, setSurgeryDate] = useState("");
  const [anesthesiaType, setAnesthesiaType] = useState("general");
  const [classification, setClassification] = useState("elective");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/clinical/surgery");
      if (res.ok) {
        const data = await res.json();
        const rooms: OperatingRoom[] = data.operatingRooms || [];
        setOperatingRooms(rooms);
        setOperatingRoomId((prev) => (prev ? prev : rooms[0] ? String(rooms[0].id) : ""));
        setSurgeries(data.surgeries || []);
        if (data.stats) setStats(data.stats);
      }
    } catch (e) {
      console.error("Failed to load surgical suite:", e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleBookSurgery = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!patientId || !description) return;

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/clinical/surgery", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patientId,
          description,
          operatingRoomId,
          surgeryDate: surgeryDate || undefined,
          anesthesiaType,
          classification,
        }),
      });

      if (res.ok) {
        setIsBookModalOpen(false);
        setPatientId("");
        setDescription("");
        fetchData();
      }
    } catch (e) {
      console.error("Booking failed:", e);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateState = async (surgeryId: number, newState: string) => {
    try {
      const res = await fetch("/api/clinical/surgery", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ surgeryId, state: newState }),
      });
      if (res.ok) {
        fetchData();
      }
    } catch (e) {
      console.error("Status update failed:", e);
    }
  };

  const filteredSurgeries = surgeries.filter((s) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      (s.description || "").toLowerCase().includes(q) ||
      (s.patientName || "").toLowerCase().includes(q) ||
      (s.code || "").toLowerCase().includes(q) ||
      (s.surgeon || "").toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200/80 pb-5">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono font-semibold text-[#0F766E] uppercase tracking-wider mb-1">
            <Scissors className="w-3.5 h-3.5" />
            <span>Surgical Care & Operating Theatre Management</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 font-display">
            Operating Room Scheduling & Surgical Suite
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time surgical bookings, sterile room allocation, anesthesia team assignments, and post-op protocols.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchData}
            isLoading={isLoading}
            className="text-xs"
          >
            Refresh Schedule
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => setIsBookModalOpen(true)}
            leftIcon={<Plus className="w-4 h-4" />}
            className="text-xs font-semibold"
          >
            Book Surgical Procedure
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4.5 rounded-xl border border-slate-200/90 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-[11px] font-mono font-bold uppercase tracking-wider">Active Theatres</span>
            <Scissors className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-2xl font-semibold text-slate-900 font-mono">{stats.totalTheatres}</div>
          <div className="text-[11px] text-slate-400 mt-1">Sterile suites configured</div>
        </div>

        <div className="bg-white p-4.5 rounded-xl border border-slate-200/90 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-[11px] font-mono font-bold uppercase tracking-wider">Scheduled Today</span>
            <Calendar className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-2xl font-semibold text-blue-600 font-mono">{stats.scheduledToday}</div>
          <div className="text-[11px] text-blue-600/80 font-medium mt-1">Planned operative cases</div>
        </div>

        <div className="bg-white p-4.5 rounded-xl border border-slate-200/90 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-[11px] font-mono font-bold uppercase tracking-wider">In Progress</span>
            <Activity className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-semibold text-amber-600 font-mono">{stats.inProgress}</div>
          <div className="text-[11px] text-amber-600/80 font-medium mt-1">Under active operation</div>
        </div>

        <div className="bg-white p-4.5 rounded-xl border border-slate-200/90 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-[11px] font-mono font-bold uppercase tracking-wider">Procedures Completed</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-semibold text-emerald-600 font-mono">{stats.completed}</div>
          <div className="text-[11px] text-emerald-600/80 font-medium mt-1">Transferred to PACU / Ward</div>
        </div>
      </div>

      {/* Operating Rooms Live Status */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
        {operatingRooms.map((room) => {
          const isOccupied = room.state === "in_use";
          return (
            <div
              key={room.id}
              className={`p-4 rounded-xl border transition-all ${
                isOccupied
                  ? "border-amber-200 bg-amber-50/40 text-amber-900"
                  : "border-emerald-200 bg-emerald-50/40 text-emerald-900"
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-mono font-bold uppercase">Suite 0{room.id}</span>
                <span
                  className={`text-[9px] font-mono font-bold uppercase px-2 py-0.5 rounded ${
                    isOccupied ? "bg-amber-100 text-amber-800" : "bg-emerald-100 text-emerald-800"
                  }`}
                >
                  {isOccupied ? "Procedure in Progress" : "Sterilized & Available"}
                </span>
              </div>
              <div className="font-bold text-sm text-slate-800">{room.name}</div>
              <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" />
                <span>Next slot: On demand</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Surgical Case Registry */}
      <div className="bg-white rounded-xl border border-slate-200/90 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-bold text-slate-900">Surgical Procedure Registry</h2>
            <p className="text-xs text-slate-500">Scheduled operative procedures, sterile theatre logs, and team sign-offs.</p>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search surgical cases..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-[#0F766E]"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 border-b border-slate-200/80 text-[11px] font-mono font-bold text-slate-500 uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Case #</th>
                <th className="py-3 px-4">Procedure</th>
                <th className="py-3 px-4">Patient</th>
                <th className="py-3 px-4">Theatre Suite</th>
                <th className="py-3 px-4">Surgeon</th>
                <th className="py-3 px-4">Anesthesia</th>
                <th className="py-3 px-4">Classification</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredSurgeries.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-xs text-slate-400">
                    No surgical cases booked yet. Click "Book Surgical Procedure" to schedule an operative case.
                  </td>
                </tr>
              ) : (
                filteredSurgeries.map((surg) => (
                  <tr key={surg.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4 font-mono font-semibold text-[#0F766E]">{surg.code}</td>
                    <td className="py-3 px-4 font-semibold text-slate-900">{surg.description}</td>
                    <td className="py-3 px-4 font-medium">{surg.patientName}</td>
                    <td className="py-3 px-4 font-mono text-slate-700">{surg.operatingRoomName}</td>
                    <td className="py-3 px-4">{surg.surgeon}</td>
                    <td className="py-3 px-4 capitalize">{surg.anesthesiaType}</td>
                    <td className="py-3 px-4 capitalize">
                      <span className="px-2 py-0.5 bg-slate-100 rounded text-[11px] font-medium">
                        {surg.classification}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded ${
                          surg.state === "confirmed"
                            ? "bg-blue-50 text-blue-700 border border-blue-200"
                            : surg.state === "in_progress"
                            ? "bg-amber-50 text-amber-700 border border-amber-200"
                            : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                        }`}
                      >
                        {surg.state}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      {surg.state === "confirmed" && (
                        <button
                          onClick={() => handleUpdateState(surg.id, "in_progress")}
                          className="text-xs text-amber-600 hover:text-amber-700 font-semibold mr-3"
                        >
                          Start Surgery
                        </button>
                      )}
                      {surg.state === "in_progress" && (
                        <button
                          onClick={() => handleUpdateState(surg.id, "done")}
                          className="text-xs text-emerald-600 hover:text-emerald-700 font-semibold"
                        >
                          Complete Case
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Book Surgery Modal */}
      <Modal
        isOpen={isBookModalOpen}
        onClose={() => setIsBookModalOpen(false)}
        title="Schedule Surgical Case in Operating Theatre"
        size="lg"
      >
        <form onSubmit={handleBookSurgery} className="space-y-4">
          <Input
            label="Patient PUID or Record ID"
            value={patientId}
            onChange={(e) => setPatientId(e.target.value)}
            placeholder="e.g. 101 or 28264873791"
            required
            helperText="Enter the patient registration ID from Master Registry."
          />

          <Input
            label="Procedure Name & Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="e.g. Laparoscopic Cholecystectomy / Arthroscopic Knee Debridement"
            required
          />

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1.5">Operating Theatre</label>
              <select
                value={operatingRoomId}
                onChange={(e) => setOperatingRoomId(e.target.value)}
                className="w-full h-10 px-3 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-[#0F766E]"
              >
                <option value="">
                  {operatingRooms.length ? "Select a theatre" : "No theatres configured"}
                </option>
                {operatingRooms.map((or) => (
                  <option key={or.id} value={or.id}>
                    {or.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1.5">Anesthesia Type</label>
              <select
                value={anesthesiaType}
                onChange={(e) => setAnesthesiaType(e.target.value)}
                className="w-full h-10 px-3 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-[#0F766E]"
              >
                <option value="general">General Anesthesia</option>
                <option value="spinal">Spinal / Epidural</option>
                <option value="sedation">Monitored Anesthesia Care (MAC)</option>
                <option value="local">Local Infiltration</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1.5">Classification</label>
              <select
                value={classification}
                onChange={(e) => setClassification(e.target.value)}
                className="w-full h-10 px-3 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-[#0F766E]"
              >
                <option value="elective">Elective Procedure</option>
                <option value="urgent">Urgent / Unscheduled</option>
                <option value="emergency">Life/Limb Emergency</option>
              </select>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
            <Button variant="outline" size="sm" onClick={() => setIsBookModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" type="submit" isLoading={isSubmitting}>
              Confirm Booking & Schedule
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
