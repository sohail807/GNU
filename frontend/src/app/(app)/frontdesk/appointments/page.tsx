"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Calendar,
  Clock,
  User,
  Search,
  Filter,
  Plus,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  UserCheck,
  Stethoscope,
  Building,
  Check,
  ChevronDown,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";

interface Appointment {
  id: number;
  ref: string;
  time: string;
  date: string;
  puid: string;
  patientName: string;
  phone: string;
  physicianName: string;
  specialty: string;
  state: string;
  urgency: string;
  patientId: number;
}

interface Doctor {
  id: string;
  name: string;
  specialty: string;
}

export default function AppointmentCalendarPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [patients, setPatients] = useState<any[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Search & Filter States
  const [patientSearchQuery, setPatientSearchQuery] = useState("");
  const [selectedSpecialtyFilter, setSelectedSpecialtyFilter] = useState("all");
  const [selectedDoctorFilter, setSelectedDoctorFilter] = useState("all");
  const [stateFilter, setStateFilter] = useState("all");

  // Booking Modal States
  const [modalSelectedPatientId, setModalSelectedPatientId] = useState<number | null>(null);
  const [modalDoctorId, setModalDoctorId] = useState("");
  const [modalDate, setModalDate] = useState("");
  const [modalTime, setModalTime] = useState("");
  const [modalUrgency, setModalUrgency] = useState("normal");

  const loadData = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      // 1. Load appointments
      const resApt = await fetch("/api/clinical/appointments");
      const dataApt = await resApt.json();
      if (dataApt.success && Array.isArray(dataApt.appointments)) {
        setAppointments(dataApt.appointments);
      }

      // 2. Load patients for dropdown
      const resPat = await fetch("/api/clinical/patients");
      const dataPat = await resPat.json();
      if (dataPat.success && Array.isArray(dataPat.patients)) {
        setPatients(dataPat.patients);
      }

      // 3. Load physicians
      const resDoc = await fetch("/api/clinical/appointments?type=physicians");
      const dataDoc = await resDoc.json();
      if (dataDoc.success && Array.isArray(dataDoc.physicians) && dataDoc.physicians.length > 0) {
        setDoctors(
          dataDoc.physicians.map((d: any) => ({
            id: String(d.id),
            name: d.name,
            specialty: d.specialty || "Outpatient Specialist",
          }))
        );
        setModalDoctorId(String(dataDoc.physicians[0].id));
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to load calendar data";
      setErrorMessage(msg);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Check In action
  const handleCheckIn = async (aptId: number) => {
    try {
      const res = await fetch("/api/clinical/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "checkin", appointmentId: aptId }),
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error || "Failed to check in appointment.");
      }

      await loadData();
      setFeedback(`Encounter #${aptId} transitioned to 'Checked In'. Patient transferred to Nursing Triage.`);
      setTimeout(() => setFeedback(null), 4000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to check in patient";
      setErrorMessage(msg);
    }
  };

  // Book appointment handler
  const handleBookAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!modalSelectedPatientId) {
      setErrorMessage("Please select a patient.");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const res = await fetch("/api/clinical/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "book",
          patientId: modalSelectedPatientId,
          healthprofId: parseInt(modalDoctorId, 10),
          appointmentDate: modalDate,
          appointmentTime: modalTime,
          urgency: modalUrgency,
        }),
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error || "Failed to book appointment in GNU Health backend.");
      }

      setFeedback("Appointment successfully booked and confirmed in Hospital Calendar.");
      setIsModalOpen(false);
      await loadData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to book appointment";
      setErrorMessage(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filtered Appointments Table
  const filteredAppointments = appointments.filter((apt) => {
    const q = patientSearchQuery.toLowerCase().trim();
    const matchesPatient =
      !q ||
      apt.patientName.toLowerCase().includes(q) ||
      apt.puid.toLowerCase().includes(q);

    const matchesSpecialty =
      selectedSpecialtyFilter === "all" || apt.specialty === selectedSpecialtyFilter;

    const matchesDoctor =
      selectedDoctorFilter === "all" || apt.physicianName.includes(selectedDoctorFilter);

    const matchesState = stateFilter === "all" || apt.state === stateFilter;

    return matchesPatient && matchesSpecialty && matchesDoctor && matchesState;
  });

  return (
    <div className="max-w-7xl mx-auto space-y-7 animate-fade-in">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-slate-200/90 gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="kicker text-[#0F766E]">OUTPATIENT SCHEDULING</span>
            <span className="text-slate-300">/</span>
            <span className="kicker text-slate-500">APPOINTMENT DESK</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-semibold text-slate-900 tracking-tight">
            Consultation Calendar & Booking
          </h1>
          <p className="text-xs text-slate-600 mt-1">
            Schedule outpatient visits, manage multi-physician calendars, and filter by clinical specialty.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Button
            variant="primary"
            size="sm"
            onClick={() => setIsModalOpen(true)}
            leftIcon={<Plus className="w-4 h-4" />}
          >
            Book Appointment
          </Button>
        </div>
      </div>

      {/* FEEDBACK & ERROR ALERTS */}
      {feedback && (
        <div className="p-4 rounded-xl bg-teal-50 border border-teal-200 text-xs text-teal-800 flex items-center justify-between">
          <span className="font-medium">{feedback}</span>
          <button onClick={() => setFeedback(null)} className="text-teal-600 font-bold">×</button>
        </div>
      )}

      {errorMessage && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-xs text-red-800 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
          <span className="font-medium">{errorMessage}</span>
        </div>
      )}

      {/* FILTER CONTROLS */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-2xs space-y-3">
        <div className="flex flex-col md:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Search by Patient Name or PUID..."
              value={patientSearchQuery}
              onChange={(e) => setPatientSearchQuery(e.target.value)}
              className="w-full h-9 pl-9 pr-3 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-[#0F766E]"
            />
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto">
            <select
              value={selectedDoctorFilter}
              onChange={(e) => setSelectedDoctorFilter(e.target.value)}
              className="h-9 px-3 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-[#0F766E]"
            >
              <option value="all">All Attending Physicians</option>
              {doctors.map((d) => (
                <option key={d.id} value={d.name}>
                  {d.name}
                </option>
              ))}
            </select>

            <select
              value={stateFilter}
              onChange={(e) => setStateFilter(e.target.value as any)}
              className="h-9 px-3 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-[#0F766E]"
            >
              <option value="all">All Statuses</option>
              <option value="confirmed">Confirmed</option>
              <option value="checked_in">Checked in</option>
              <option value="done">Completed</option>
              <option value="no_show">No show</option>
              <option value="user_cancelled">Cancelled by patient</option>
              <option value="center_cancelled">Cancelled by clinic</option>
            </select>
          </div>
        </div>
      </div>

      {/* APPOINTMENTS TABLE */}
      <div className="bg-white border border-slate-200/90 rounded-xl shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="p-12 text-center text-xs text-slate-500 font-mono">
              Loading calendar bookings from GNU Health backend...
            </div>
          ) : filteredAppointments.length === 0 ? (
            <div className="p-12 text-center space-y-3">
              <Calendar className="w-10 h-10 text-slate-300 mx-auto" />
              <div className="text-sm font-bold text-slate-800">No scheduled appointments found</div>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                No calendar bookings match the selected search criteria.
              </p>
              <Button variant="primary" size="sm" onClick={() => setIsModalOpen(true)}>
                Book New Appointment
              </Button>
            </div>
          ) : (
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200/80 font-mono text-[11px] text-slate-500 uppercase tracking-wider">
                  <th className="py-3 px-5">Ref #</th>
                  <th className="py-3 px-5">Date & Time</th>
                  <th className="py-3 px-5">Patient Details</th>
                  <th className="py-3 px-5">Attending Physician</th>
                  <th className="py-3 px-5">Urgency</th>
                  <th className="py-3 px-5">Status</th>
                  <th className="py-3 px-5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-sans">
                {filteredAppointments.map((apt) => (
                  <tr key={apt.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-5 font-mono font-bold text-[#0F766E]">
                      {apt.ref}
                    </td>
                    <td className="py-3.5 px-5">
                      <span className="block font-semibold text-slate-900">{apt.date}</span>
                      <span className="font-mono text-slate-500 text-[11px]">{apt.time}</span>
                    </td>
                    <td className="py-3.5 px-5">
                      <span className="block font-semibold text-slate-900">{apt.patientName}</span>
                      <span className="font-mono text-slate-500 text-[11px]">{apt.puid}</span>
                    </td>
                    <td className="py-3.5 px-5 text-slate-700">{apt.physicianName}</td>
                    <td className="py-3.5 px-5">
                      <Badge variant={apt.urgency === "urgent" ? "amber" : "neutral"} size="sm">
                        {apt.urgency}
                      </Badge>
                    </td>
                    <td className="py-3.5 px-5">
                      <Badge
                        variant={apt.state === "checked_in" ? "green" : apt.state === "done" ? "neutral" : apt.state === "confirmed" ? "blue" : "neutral"}
                        dot
                      >
                        {apt.state || "Unknown"}
                      </Badge>
                    </td>
                    <td className="py-3.5 px-5 text-right">
                      {apt.state === "confirmed" ? (
                        <Button variant="primary" size="xs" onClick={() => handleCheckIn(apt.id)}>
                          Check-In
                        </Button>
                      ) : (
                        <Link href={`/patient/${apt.patientId}`}>
                          <Button variant="ghost" size="xs">
                            View Chart
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

      {/* BOOK APPOINTMENT MODAL */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Schedule Clinical Encounter"
        kicker="OUTPATIENT BOOKING WIZARD"
        size="md"
      >
        <form onSubmit={handleBookAppointment} className="space-y-4">
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">Select Patient *</label>
            <select
              value={modalSelectedPatientId || ""}
              onChange={(e) => setModalSelectedPatientId(e.target.value ? Number(e.target.value) : null)}
              className="w-full h-10 px-3 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:border-[#0F766E]"
              required
            >
              <option value="">Select a patient</option>
              {patients.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.puid}) — QID: {p.qid}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">Attending Physician *</label>
            <select
              value={modalDoctorId}
              onChange={(e) => setModalDoctorId(e.target.value)}
              className="w-full h-10 px-3 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:border-[#0F766E]"
              required
            >
              <option value="">Select a clinician</option>
              {doctors.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name} ({d.specialty})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input label="Appointment Date" type="date" value={modalDate} onChange={(e) => setModalDate(e.target.value)} required />
            <Input label="Appointment Time" type="time" value={modalTime} onChange={(e) => setModalTime(e.target.value)} required />
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Clinical Urgency</label>
              <select
                value={modalUrgency}
                onChange={(e) => setModalUrgency(e.target.value)}
                className="w-full h-10 px-3 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:border-[#0F766E]"
              >
                <option value="normal">Normal (Routine)</option>
                <option value="urgent">Urgent</option>
                <option value="emergency">Emergency Priority</option>
              </select>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={isSubmitting}>
              Confirm Booking
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
