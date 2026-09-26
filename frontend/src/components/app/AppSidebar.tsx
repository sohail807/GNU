"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Users,
  Activity,
  Stethoscope,
  Microscope,
  Scan,
  Receipt,
  FileText,
  Shield,
  Calendar,
  UserPlus,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  X,
  Building2,
  Lock,
  Landmark,
  ClipboardList,
  Bed,
  Scissors,
  Pill,
} from "lucide-react";
import { SessionData } from "@/lib/auth-session";
import { AppModule, hasModuleAccess } from "@/lib/access-control";

interface AppSidebarProps {
  user: SessionData;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  isMobileOpen: boolean;
  onCloseMobile: () => void;
  onOpenOnboarding: () => void;
}

interface NavItem {
  label: string;
  href: string;
  icon: any;
  moduleKey: AppModule;
  badge?: string;
}

export const AppSidebar: React.FC<AppSidebarProps> = ({
  user,
  isCollapsed,
  onToggleCollapse,
  isMobileOpen,
  onCloseMobile,
  onOpenOnboarding,
}) => {
  const pathname = usePathname();

  const navSections: { title: string; items: NavItem[] }[] = [
    {
      title: "CLINICAL WORKFLOWS",
      items: [
        { label: "Front Desk & Queue", href: "/frontdesk", icon: Users, moduleKey: "frontdesk", badge: "Queue" },
        { label: "Patient Registration", href: "/frontdesk/register", icon: UserPlus, moduleKey: "patient_register", badge: "New" },
        { label: "Appointment Desk", href: "/frontdesk/appointments", icon: Calendar, moduleKey: "appointments" },
        { label: "Nursing Triage & Vitals", href: "/nursing", icon: Activity, moduleKey: "nursing", badge: "Vitals" },
        { label: "Inpatient Care & Beds", href: "/inpatient", icon: Bed, moduleKey: "inpatient", badge: "Wards" },
        { label: "Operating Theatre", href: "/surgery", icon: Scissors, moduleKey: "surgery", badge: "OT" },
        { label: "Hospital Pharmacy", href: "/pharmacy", icon: Pill, moduleKey: "pharmacy", badge: "Rx" },
        { label: "Physician Cockpit", href: "/physician", icon: Stethoscope, moduleKey: "physician", badge: "SOAP" },
        { label: "Diagnostic Lab", href: "/laboratory", icon: Microscope, moduleKey: "laboratory", badge: "CBC" },
        { label: "Digital Radiology", href: "/radiology", icon: Scan, moduleKey: "radiology", badge: "PACS" },
      ],
    },
    {
      title: "FINANCIAL & CHARTS",
      items: [
        { label: "Cashier & Invoicing", href: "/billing", icon: Receipt, moduleKey: "billing", badge: "Cash" },
        { label: "General Ledger Audit", href: "/billing?tab=ledger", icon: Landmark, moduleKey: "ledger", badge: "GL" },
        { label: "Master Patient Registry", href: "/patient", icon: FileText, moduleKey: "patient_chart", badge: "EHR" },
      ],
    },
    {
      title: "GOVERNANCE",
      items: [
        { label: "Administration & RBAC", href: "/admin", icon: Shield, moduleKey: "admin", badge: "Admin" },
      ],
    },
  ];

  const sidebarContent = (
    <div className="flex flex-col h-full justify-between select-none">
      <div>
        {/* Brand Header */}
        <div
          className={`h-16 border-b border-slate-800 flex items-center transition-all ${
            isCollapsed ? "justify-center px-2" : "justify-between px-5"
          }`}
        >
          <Link
            href="/frontdesk"
            className="flex items-center gap-3 group overflow-hidden"
          >
            <div className="w-9 h-9 rounded-lg bg-[#0F766E] text-white flex items-center justify-center font-bold text-base shadow-sm shrink-0">
              <Building2 className="w-5 h-5 text-emerald-200" />
            </div>
            {!isCollapsed && (
              <div className="overflow-hidden">
                <div className="text-sm font-bold tracking-tight text-white leading-tight truncate">
                  IST HEALTH
                </div>
                <div className="text-[10px] font-mono tracking-widest text-emerald-400 font-semibold truncate">
                  HOSPITAL HMIS
                </div>
              </div>
            )}
          </Link>

          {/* Mobile Close Button */}
          <button
            onClick={onCloseMobile}
            className="md:hidden text-slate-400 hover:text-white p-1 rounded-lg"
            aria-label="Close sidebar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* User Identity Card & RBAC Badge */}
        <div
          className={`border-b border-slate-800/80 bg-slate-950/40 transition-all ${
            isCollapsed ? "p-3 flex justify-center" : "px-5 py-4"
          }`}
        >
          {isCollapsed ? (
            <div
              className="w-10 h-10 rounded-full bg-slate-800 border border-slate-700 text-emerald-400 font-bold flex items-center justify-center text-xs"
              title={`${user.name} (@${user.username}) — Role: ${user.role}`}
            >
              {user.name.charAt(0)}
            </div>
          ) : (
            <div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-400 font-semibold">
                  AUTHENTICATED STAFF
                </span>
                <span className="text-[10px] font-mono text-slate-400">UID: {user.userId}</span>
              </div>
              <div className="text-xs font-bold text-white truncate mt-1">
                {user.name}
              </div>
              <div className="text-[11px] font-mono text-slate-400 flex items-center justify-between mt-1">
                <span className="text-teal-400">@{user.username}</span>
                <span className="px-2 py-0.5 bg-teal-950 border border-teal-800/80 text-teal-300 rounded-md text-[10px] font-bold uppercase tracking-wider">
                  {user.role}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Navigation Sections with IST Access Control Filtering */}
        <div
          className={`py-3 overflow-y-auto max-h-[calc(100vh-270px)] space-y-4 ${
            isCollapsed ? "px-2" : "px-3"
          }`}
        >
          {navSections.map((sec, idx) => {
            // Determine visible or authorized items
            return (
              <div key={idx}>
                {!isCollapsed && (
                  <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold px-3 mb-1.5">
                    {sec.title}
                  </div>
                )}
                <div className="space-y-1">
                  {sec.items.map((item) => {
                    const Icon = item.icon;
                    const isPermitted = hasModuleAccess(user.role, item.moduleKey);
                    const isActive =
                      pathname === item.href ||
                      (item.href !== "/frontdesk" && pathname.startsWith(item.href.split("?")[0]));

                    // If user is non-admin and has no access, render restricted state
                    if (!isPermitted && user.role !== "admin") {
                      return (
                        <div
                          key={`${item.href}-${item.label}`}
                          className={`flex items-center gap-3 rounded-lg text-xs font-medium text-slate-600 opacity-60 cursor-not-allowed select-none ${
                            isCollapsed
                              ? "justify-center p-2.5"
                              : "px-3 py-2.5 justify-between"
                          }`}
                          title={isCollapsed ? `${item.label} (Access Restricted — ${user.role})` : undefined}
                        >
                          <div className="flex items-center gap-3">
                            <Icon className="w-4 h-4 shrink-0 text-slate-600" />
                            {!isCollapsed && <span className="truncate">{item.label}</span>}
                          </div>
                          {!isCollapsed && (
                            <span className="flex items-center gap-1 text-[9px] font-mono text-slate-500 uppercase px-1.5 py-0.5 bg-slate-900 rounded border border-slate-800">
                              <Lock className="w-2.5 h-2.5" />
                              <span>Restricted</span>
                            </span>
                          )}
                        </div>
                      );
                    }

                    return (
                      <Link
                        key={`${item.href}-${item.label}`}
                        href={item.href}
                        onClick={onCloseMobile}
                        className={`flex items-center gap-3 rounded-lg text-xs font-medium transition-all group relative ${
                          isCollapsed
                            ? "justify-center p-2.5"
                            : "px-3 py-2.5 justify-between"
                        } ${
                          isActive
                            ? "bg-[#0F766E] text-white shadow-xs font-semibold"
                            : "text-slate-300 hover:text-white hover:bg-slate-800/80"
                        }`}
                        title={isCollapsed ? item.label : undefined}
                      >
                        <div className="flex items-center gap-3">
                          <Icon
                            className={`w-4 h-4 shrink-0 transition-colors ${
                              isActive
                                ? "text-emerald-200"
                                : "text-slate-400 group-hover:text-slate-200"
                            }`}
                          />
                          {!isCollapsed && <span className="truncate">{item.label}</span>}
                        </div>

                        {!isCollapsed && item.badge && (
                          <span
                            className={`text-[9px] font-mono uppercase px-1.5 py-0.5 rounded font-bold tracking-wider ${
                              isActive
                                ? "bg-emerald-900/60 text-emerald-200 border border-emerald-500/40"
                                : "bg-slate-800 text-slate-400 border border-slate-700"
                            }`}
                          >
                            {item.badge}
                          </span>
                        )}
                      </Link>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Footer Controls */}
      <div className="p-3 border-t border-slate-800 space-y-2">
        {/* Onboarding Tour Trigger */}
        <button
          onClick={onOpenOnboarding}
          className={`w-full flex items-center rounded-lg text-xs text-emerald-400 hover:text-emerald-300 hover:bg-slate-800/80 transition-colors ${
            isCollapsed ? "justify-center p-2" : "gap-2.5 px-3 py-2"
          }`}
          title="Interactive Onboarding Walkthrough"
        >
          <Sparkles className="w-4 h-4 text-emerald-400 shrink-0" />
          {!isCollapsed && <span className="font-semibold text-[11px]">System Tour Guide</span>}
        </button>

        {/* Collapse Toggle (Desktop only) */}
        <button
          onClick={onToggleCollapse}
          className={`hidden md:flex w-full items-center rounded-lg text-xs text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors ${
            isCollapsed ? "justify-center p-2" : "justify-between px-3 py-2"
          }`}
          title={isCollapsed ? "Expand Sidebar (Alt+S)" : "Collapse Sidebar (Alt+S)"}
        >
          {!isCollapsed && <span className="text-[11px] font-mono">Collapse Sidebar</span>}
          {isCollapsed ? (
            <ChevronRight className="w-4 h-4" />
          ) : (
            <ChevronLeft className="w-4 h-4" />
          )}
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Persistent Sidebar */}
      <aside
        className={`hidden md:block bg-[#0F172A] text-white flex-shrink-0 transition-all duration-200 z-30 ${
          isCollapsed ? "w-16" : "w-64"
        }`}
      >
        {sidebarContent}
      </aside>

      {/* Mobile Drawer Backdrop */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-40 md:hidden animate-fade-in"
          onClick={onCloseMobile}
        />
      )}

      {/* Mobile Drawer */}
      <aside
        className={`fixed top-0 bottom-0 left-0 w-64 bg-[#0F172A] text-white z-50 md:hidden transition-transform duration-200 ease-out shadow-2xl ${
          isMobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {sidebarContent}
      </aside>
    </>
  );
};
