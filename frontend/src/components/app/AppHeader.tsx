"use client";

import React, { useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import {
  Search,
  LogOut,
  Sparkles,
  ChevronRight,
  Menu,
  PanelLeftClose,
  PanelLeft,
  UserCheck,
  Building,
} from "lucide-react";
import { ClientSession } from "@/lib/auth-session";

interface AppHeaderProps {
  user: ClientSession;
  isSidebarCollapsed: boolean;
  onToggleSidebar: () => void;
  onToggleMobileMenu: () => void;
  onOpenOnboarding: () => void;
}

export const AppHeader: React.FC<AppHeaderProps> = ({
  user,
  isSidebarCollapsed,
  onToggleSidebar,
  onToggleMobileMenu,
  onOpenOnboarding,
}) => {
  const router = useRouter();
  const pathname = usePathname();
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isSwitchingHospital, setIsSwitchingHospital] = useState(false);
  const hospitals = user.hospitals || [];

  // Group customers: change the active hospital, then reload so every screen refetches for the new hospital.
  const handleHospitalChange = async (hospitalId: string) => {
    if (hospitalId === user.hospitalId) return;
    setIsSwitchingHospital(true);
    try {
      const res = await fetch("/api/auth/hospital", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ hospitalId }),
      });
      if (res.ok) window.location.reload();
    } finally {
      setIsSwitchingHospital(false);
    }
  };

  // Generate breadcrumb title based on pathname
  const getBreadcrumb = () => {
    if (pathname.includes("frontdesk/register")) return "Front Desk / Patient Registration";
    if (pathname.includes("frontdesk/appointments")) return "Front Desk / Appointment Calendar";
    if (pathname.includes("frontdesk")) return "Front Desk / Reception & Queue";
    if (pathname.includes("nursing")) return "Clinical Nursing / Triage & Vitals";
    if (pathname.includes("physician")) return "Consulting Suites / Physician Cockpit";
    if (pathname.includes("laboratory")) return "Clinical Pathology / Diagnostic Laboratory";
    if (pathname.includes("radiology")) return "Diagnostic Imaging / Digital Radiology";
    if (pathname.includes("billing")) return "Outpatient Cashier / Billing & Accounting";
    if (pathname.includes("patient")) return "Medical Records / Unified Patient Chart";
    if (pathname.includes("admin")) return "System Administration / RBAC & Audit";
    return "Outpatient Operations";
  };

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/login");
    } finally {
      setIsLoggingOut(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    router.push(`/frontdesk?q=${encodeURIComponent(searchQuery)}`);
  };

  return (
    <header className="h-16 bg-white border-b border-slate-200/90 px-4 sm:px-6 flex items-center justify-between shrink-0 shadow-2xs z-20">
      {/* Left Area: Sidebar Controls & Breadcrumb */}
      <div className="flex items-center gap-3">
        {/* Mobile Hamburger Button */}
        <button
          onClick={onToggleMobileMenu}
          className="md:hidden p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
          aria-label="Open sidebar"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Desktop Sidebar Toggle Button */}
        <button
          onClick={onToggleSidebar}
          className="hidden md:flex p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
          title={isSidebarCollapsed ? "Expand Sidebar (⌥S)" : "Collapse Sidebar (⌥S)"}
        >
          {isSidebarCollapsed ? (
            <PanelLeft className="w-4.5 h-4.5 text-[#0F766E]" />
          ) : (
            <PanelLeftClose className="w-4.5 h-4.5" />
          )}
        </button>

        {/* Facility Info & Breadcrumb */}
        <div className="hidden sm:flex items-center gap-2 text-xs">
          <span className="flex items-center gap-1.5 font-bold text-slate-900 font-sans">
            <Building className="w-3.5 h-3.5 text-[#0F766E]" />
            {hospitals.length > 1 ? (
              <select
                aria-label="Active hospital"
                value={user.hospitalId}
                disabled={isSwitchingHospital}
                onChange={(e) => handleHospitalChange(e.target.value)}
                className="bg-transparent font-bold text-slate-900 text-xs focus:outline-none cursor-pointer max-w-[220px] truncate"
              >
                {hospitals.map((h) => (
                  <option key={h.id} value={h.id}>
                    {h.name}
                  </option>
                ))}
              </select>
            ) : (
              user.hospitalName || "IST Health Hospital"
            )}
          </span>
          <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
          <span className="text-slate-500 text-[13px] truncate max-w-[200px] md:max-w-none">
            {getBreadcrumb()}
          </span>
        </div>
      </div>

      {/* Center Area: Patient Search Bar */}
      <form
        onSubmit={handleSearchSubmit}
        className="hidden lg:flex items-center w-80 max-w-sm relative"
      >
        <Search className="w-4 h-4 text-slate-400 absolute left-3 pointer-events-none" />
        <input
          type="text"
          placeholder="Quick search patient (PUID, National ID, Name)..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full h-9 pl-9 pr-12 text-xs bg-slate-50 border border-slate-200/90 rounded-lg focus:outline-none focus:border-[#0F766E] focus:ring-2 focus:ring-[#0F766E]/15 focus:bg-white transition-all text-slate-800 placeholder:text-slate-400"
        />
        <kbd className="absolute right-2.5 text-[10px] font-mono text-slate-400 bg-slate-200/60 px-1.5 py-0.5 rounded pointer-events-none">
          ⌘K
        </kbd>
      </form>

      {/* Right Area: System Telemetry, Onboarding & Staff Profile */}
      <div className="flex items-center gap-2.5 sm:gap-3">
        {/* Onboarding Walkthrough Guide Button */}
        <button
          onClick={onOpenOnboarding}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-[#0F766E] bg-teal-50 hover:bg-teal-100 transition-colors"
          title="Start Hospital Operations Walkthrough"
        >
          <Sparkles className="w-3.5 h-3.5 shrink-0" />
          <span className="hidden sm:inline">Guided Tour</span>
        </button>

        {/* Live Hospital Network Status Badge */}
        <div
          className="hidden xl:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-[11px] text-emerald-700"
          title="Clinical Healthcare Network Connected"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 pulse-beacon shrink-0" />
          <span>Network Online</span>
        </div>

        {/* Authenticated Staff Profile Badge */}
        <div className="relative">
          <button
            onClick={() => setIsProfileOpen(!isProfileOpen)}
            className="flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
            title="Authenticated Staff Profile"
          >
            <div className="w-6 h-6 rounded-full bg-[#0F766E] text-white flex items-center justify-center font-medium text-[11px]">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div className="text-left hidden sm:block">
              <span className="block font-medium text-slate-800 leading-tight truncate max-w-[120px]">{user.name}</span>
              <span className="block text-[11px] text-slate-400 capitalize">{user.role}</span>
            </div>
          </button>

          {isProfileOpen && (
            <div className="absolute right-0 mt-2 w-64 bg-white border border-slate-200 rounded-xl shadow-lg py-2 z-50 animate-fade-in divide-y divide-slate-100">
              <div className="px-4 py-2">
                <span className="block font-medium text-xs text-slate-900">{user.name}</span>
                <span className="block text-[11px] text-slate-400">@{user.username}</span>
                <span className="inline-block mt-1.5 px-2 py-0.5 rounded bg-teal-50 text-[#0F766E] text-[11px] font-medium capitalize">
                  {user.role}
                </span>
              </div>
              <div className="px-2 py-1">
                <button
                  onClick={handleLogout}
                  className="w-full text-left px-3 py-2 text-xs text-red-600 hover:bg-red-50 rounded-lg transition-colors flex items-center gap-2 font-medium"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Switch Account / Sign Out</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Direct Logout Button */}
        <button
          onClick={handleLogout}
          disabled={isLoggingOut}
          className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors focus:outline-none"
          title="Sign Out of Portal"
          aria-label="Sign out"
        >
          <LogOut className="w-4.5 h-4.5" />
        </button>
      </div>
    </header>
  );
};
