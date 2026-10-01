"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Users,
  UserPlus,
  Clock,
  Calendar,
  Search,
  ArrowUpRight,
  RefreshCw,
  Check,
  AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { StatCard } from "@/components/ui/StatCard";
import { Badge } from "@/components/ui/Badge";

interface PatientQueueItem {
  id: number;
  appointmentId?: number;
  puid: string;
  name: string;
  phone?: string;
  doctor: string;
  appointmentTime: string;
  state: "draft" | "confirmed" | "checked_in" | "in_consultation" | "done";
  readyToBill: boolean;
}

export default function FrontDeskPage() {
  const [patients, setPatients] = useState<PatientQueueItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isActionLoading, setIsActionLoading] = useState<number | null>(null);
  const [searchFilter, setSearchFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Fetch live appointments & queue from clinical API
  const fetchLiveQueue = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const res = await fetch("/api/clinical/appointments");
      const data = await res.json();
      if (data.success && Array.isArray(data.appointments)) {
        setPatients(
          data.appointments.map((a: any) => ({
            id: a.patientId || a.id,
            appointmentId: a.id,
            puid: a.puid,
            name: a.patientName,
            phone: a.patientPhone || undefined,
            doctor: a.physicianName || "Attending Physician",
            appointmentTime: a.time,
            state: a.state,
            readyToBill: Boolean(a.readyToBill),
          }))
        );
      } else if (data.error) {
        setErrorMessage(data.error);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to load queue from backend";
      setErrorMessage(msg);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLiveQueue();
  }, []);

  const handleCheckIn = async (patientId: number, appointmentId?: number) => {
    setIsActionLoading(patientId);
    setFeedbackMessage(null);
    setErrorMessage(null);

    try {
      const res = await fetch("/api/clinical/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "checkin", appointmentId: appointmentId || patientId }),
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error || "Failed to check in patient.");
      }

      setPatients((prev) =>
        prev.map((p) => (p.id === patientId ? { ...p, state: "checked_in" } : p))
      );
      setFeedbackMessage("Patient successfully checked in and transferred to Nursing Triage.");
      setTimeout(() => setFeedbackMessage(null), 4000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to execute check-in transaction.";
      setErrorMessage(msg);
    } finally {
      setIsActionLoading(null);
    }
  };

  const filteredPatients = patients.filter((p) => {
    const q = searchFilter.toLowerCase().trim();
    const matchesSearch =
      !q ||
      p.name.toLowerCase().includes(q) ||
      p.puid.toLowerCase().includes(q) ||
      (p.phone && p.phone.toLowerCase().includes(q));
    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "pending" && (p.state === "confirmed" || p.state === "draft")) ||
      (statusFilter === "checked_in" && p.state === "checked_in") ||
      (statusFilter === "done" && p.state === "done");
    return matchesSearch && matchesStatus;
  });

  const totalPatients = patients.length;
  const pendingCount = patients.filter((p) => p.state === "confirmed" || p.state === "draft").length;
  const triageCount = patients.filter((p) => p.state === "checked_in").length;
  const doneCount = patients.filter((p) => p.state === "done").length;

  return (
    <div className="max-w-7xl mx-auto space-y-7 animate-fade-in">
      {/* PAGE HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-slate-200/90 gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="kicker text-[#0F766E]">OUTPATIENT RECEPTION</span>
            <span className="text-slate-300">/</span>
            <span className="kicker text-slate-500">CLINIC DESK 01</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-semibold text-slate-900 tracking-tight">
            Patient Intake & Arrival Queue
          </h1>
          <p className="text-xs text-slate-600 mt-1">
            Manage scheduled outpatient arrivals, execute arrival check-ins, and initiate demographic registrations.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchLiveQueue}
            isLoading={isLoading}
            leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
          >
            Sync Backend
          </Button>

          <Link href="/frontdesk/appointments">
            <Button
              variant="secondary"
              size="sm"
              leftIcon={<Calendar className="w-3.5 h-3.5" />}
            >
              Calendar
            </Button>
          </Link>

          <Link href="/frontdesk/register">
            <Button
              variant="primary"
              size="sm"
              leftIcon={<UserPlus className="w-4 h-4" />}
            >
              Register Patient
            </Button>
          </Link>
        </div>
      </div>

      {/* FEEDBACK & ERROR ALERTS */}
      {feedbackMessage && (
        <div className="p-4 rounded-xl bg-teal-50 border border-teal-200 text-xs text-teal-800 flex items-center justify-between">
          <span>{feedbackMessage}</span>
          <button onClick={() => setFeedbackMessage(null)} className="text-teal-600 font-bold">×</button>
        </div>
      )}

      {errorMessage && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-xs text-red-800 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* STATS OVERVIEW CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          kicker="INTAKE TOTAL"
          label="Today's Appointments"
          value={totalPatients}
          subtext="Encounter Capacity"
          icon={<Users className="w-5 h-5" />}
        />
        <StatCard
          kicker="WAITING ROOM"
          label="Pending Arrivals"
          value={pendingCount}
          subtext="Awaiting Reception Check-in"
          icon={<Calendar className="w-5 h-5" />}
        />
        <StatCard
          kicker="IN CLINIC"
          label="Currently in Triage"
          value={triageCount}
          subtext="Vitals Recording in Progress"
          icon={<Clock className="w-5 h-5" />}
        />
        <StatCard
          kicker="DISCHARGED"
          label="Completed Consultations"
          value={doneCount}
          subtext="Chart Closed & Billed"
          icon={<Check className="w-5 h-5" />}
        />
      </div>

      {/* PATIENT ARRIVAL QUEUE TABLE */}
      <div className="bg-white border border-slate-200/90 rounded-xl shadow-2xs overflow-hidden">
        {/* Table Filter Toolbar */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-3 bg-slate-50/50">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-800">Arrival Roster</span>
            <span className="text-xs font-mono text-slate-400">
              ({filteredPatients.length} records)
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Status Filter Buttons */}
            <div className="flex items-center p-1 bg-slate-100 rounded-lg text-xs">
              <button
                onClick={() => setStatusFilter("all")}
                className={`px-2.5 py-1 rounded-md font-medium transition-all ${
                  statusFilter === "all"
                    ? "bg-white text-slate-900 shadow-2xs font-bold"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                All
              </button>
              <button
                onClick={() => setStatusFilter("pending")}
                className={`px-2.5 py-1 rounded-md font-medium transition-all ${
                  statusFilter === "pending"
                    ? "bg-white text-slate-900 shadow-2xs font-bold"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Pending
              </button>
              <button
                onClick={() => setStatusFilter("checked_in")}
                className={`px-2.5 py-1 rounded-md font-medium transition-all ${
                  statusFilter === "checked_in"
                    ? "bg-white text-slate-900 shadow-2xs font-bold"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                In Triage
              </button>
            </div>

            {/* Quick Filter Search */}
            <div className="relative w-64 max-w-full">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder="Filter by name or PUID..."
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                className="w-full h-8 pl-8 pr-3 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-[#0F766E] focus:ring-2 focus:ring-[#0F766E]/15"
              />
            </div>
          </div>
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="p-12 text-center text-xs text-slate-500 font-mono">
              Loading live arrival queue from GNU Health backend...
            </div>
          ) : filteredPatients.length === 0 ? (
            <div className="p-12 text-center space-y-3">
              <Users className="w-10 h-10 text-slate-300 mx-auto" />
              <div className="text-sm font-bold text-slate-800">No scheduled patients in arrival queue</div>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                No patient encounters match the selected filter. Book an appointment or register a new patient to populate the queue.
              </p>
              <div className="pt-2 flex justify-center gap-2">
                <Link href="/frontdesk/appointments">
                  <Button variant="outline" size="sm" leftIcon={<Calendar className="w-3.5 h-3.5" />}>
                    Book Appointment
                  </Button>
                </Link>
                <Link href="/frontdesk/register">
                  <Button variant="primary" size="sm" leftIcon={<UserPlus className="w-3.5 h-3.5" />}>
                    Register New Patient
                  </Button>
                </Link>
              </div>
            </div>
          ) : (
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200/80 font-mono text-[11px] text-slate-500 uppercase tracking-wider">
                  <th className="py-3 px-5">PUID</th>
                  <th className="py-3 px-5">Patient Name</th>
                  <th className="py-3 px-5">Consulting Physician</th>
                  <th className="py-3 px-5">Time Slot</th>
                  <th className="py-3 px-5">Status</th>
                  <th className="py-3 px-5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-sans">
                {filteredPatients.map((p, idx) => (
                  <tr key={`${p.id}-${p.appointmentId || idx}`} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-5 font-mono font-bold text-[#0F766E]">
                      {p.puid}
                    </td>
                    <td className="py-3.5 px-5 font-semibold text-slate-900">
                      <Link
                        href={`/patient/${p.id}`}
                        className="hover:text-[#0F766E] hover:underline"
                      >
                        {p.name}
                      </Link>
                    </td>
                    <td className="py-3.5 px-5 text-slate-600">{p.doctor}</td>
                    <td className="py-3.5 px-5 font-mono text-slate-700">
                      <span className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        {p.appointmentTime}
                      </span>
                    </td>
                    <td className="py-3.5 px-5">
                      {p.readyToBill ? (
                        <Badge variant="green">Ready to Bill</Badge>
                      ) : p.state === "checked_in" ? (
                        <Badge variant="green" dot>In Triage</Badge>
                      ) : p.state === "confirmed" ? (
                        <Badge variant="amber" dot>Arrived</Badge>
                      ) : p.state === "done" ? (
                        <Badge variant="neutral">Completed</Badge>
                      ) : (
                        <Badge variant="blue" dot>Scheduled</Badge>
                      )}
                    </td>
                    <td className="py-3.5 px-5 text-right">
                      {p.readyToBill ? (
                        <Link href="/billing">
                          <Button variant="primary" size="xs" rightIcon={<ArrowUpRight className="w-3 h-3" />}>
                            Bill
                          </Button>
                        </Link>
                      ) : p.state === "confirmed" || p.state === "draft" ? (
                        <Button
                          variant="primary"
                          size="xs"
                          isLoading={isActionLoading === p.id}
                          onClick={() => handleCheckIn(p.id, p.appointmentId)}
                        >
                          Check-In
                        </Button>
                      ) : p.state === "checked_in" ? (
                        <Link href={`/nursing?patientId=${p.id}`}>
                          <Button variant="outline" size="xs" rightIcon={<ArrowUpRight className="w-3 h-3" />}>
                            Triage
                          </Button>
                        </Link>
                      ) : (
                        <Link href={`/patient/${p.id}`}>
                          <Button variant="ghost" size="xs">
                            Chart
                          </Button>
                        </Link>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
