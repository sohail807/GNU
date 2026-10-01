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
  Landmark,
  ClipboardList,
  Bed,
  Scissors,
  Pill,
  Syringe,
  Users2,
  ShieldCheck,
  Baby,
  Building,
  HeartPulse,
  Cigarette,
  Siren,
  Send,
} from "lucide-react";
import { ClientSession } from "@/lib/auth-session";
import { AppModule, hasModuleAccess } from "@/lib/access-control";

interface AppSidebarProps {
  user: ClientSession;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  isMobileOpen: boolean;
  onCloseMobile: () => void;
  onOpenOnboarding: () => void;
  isSuperAdmin?: boolean;
}

interface NavItem {
  label: string;
  href: string;
  icon: any;
  moduleKey: AppModule;
  /** Shown when the role holds any of these modules (instead of just moduleKey). */
  moduleAny?: AppModule[];
  badge?: string;
}

export const AppSidebar: React.FC<AppSidebarProps> = ({
  user,
  isCollapsed,
  onToggleCollapse,
  isMobileOpen,
  onCloseMobile,
  onOpenOnboarding,
  isSuperAdmin = false,
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
        { label: "Emergency Department", href: "/emergency", icon: Siren, moduleKey: "frontdesk", moduleAny: ["frontdesk", "nursing", "physician"], badge: "ED" },
        { label: "Admission Planning", href: "/admissions", icon: ClipboardList, moduleKey: "inpatient", moduleAny: ["inpatient", "billing", "frontdesk"], badge: "Est." },
        { label: "Inpatient Care & Beds", href: "/inpatient", icon: Bed, moduleKey: "inpatient", badge: "Wards" },
        { label: "Discharge Clearance", href: "/discharges", icon: ClipboardList, moduleKey: "inpatient", moduleAny: ["inpatient", "billing", "pharmacy", "physician", "nursing"], badge: "D/C" },
        { label: "Referrals", href: "/referrals", icon: Send, moduleKey: "inpatient", moduleAny: ["frontdesk", "physician", "nursing", "inpatient"], badge: "Refer" },
        { label: "Operating Theatre", href: "/surgery", icon: Scissors, moduleKey: "surgery", badge: "OT" },
        { label: "Hospital Pharmacy", href: "/pharmacy", icon: Pill, moduleKey: "pharmacy", badge: "Rx" },
        { label: "Pharmacy Stock", href: "/stock", icon: Pill, moduleKey: "pharmacy", badge: "Stock" },
        { label: "Physician Cockpit", href: "/physician", icon: Stethoscope, moduleKey: "physician", badge: "SOAP" },
        { label: "Diagnostic Lab", href: "/laboratory", icon: Microscope, moduleKey: "laboratory", badge: "CBC" },
        { label: "Digital Radiology", href: "/radiology", icon: Scan, moduleKey: "radiology", badge: "PACS" },
        { label: "Immunizations", href: "/immunizations", icon: Syringe, moduleKey: "immunizations", badge: "Vax" },
        { label: "Obstetrics & Pregnancy", href: "/obstetrics", icon: Baby, moduleKey: "obstetrics", badge: "OB" },
        { label: "Women's Health Screening", href: "/womens-health", icon: HeartPulse, moduleKey: "womens_health", badge: "WH" },
        { label: "Lifestyle & Social History", href: "/lifestyle", icon: Cigarette, moduleKey: "lifestyle", badge: "Social" },
        { label: "Ambulatory Procedures & ECG", href: "/ambulatory", icon: Activity, moduleKey: "ambulatory", badge: "Proc" },
        { label: "Socioeconomic Assessment", href: "/socioeconomics", icon: Landmark, moduleKey: "socioeconomics", badge: "SES" },
      ],
    },
    {
      title: "FINANCIAL & CHARTS",
      items: [
        { label: "Cashier & Invoicing", href: "/billing", icon: Receipt, moduleKey: "billing", badge: "Cash" },
        { label: "General Ledger Audit", href: "/billing?tab=ledger", icon: Landmark, moduleKey: "ledger", badge: "GL" },
        { label: "Master Patient Registry", href: "/patient", icon: FileText, moduleKey: "patient_chart", badge: "EHR" },
        { label: "Patient Insurance", href: "/insurance", icon: ShieldCheck, moduleKey: "insurance", badge: "Cover" },
        { label: "Pre-auth & Claims", href: "/claims", icon: ShieldCheck, moduleKey: "insurance", badge: "Claims" },
      ],
    },
    {
      title: "SOCIAL & ADMINISTRATIVE",
      items: [
        { label: "Family Registry", href: "/family", icon: Users2, moduleKey: "family", badge: "Family" },
      ],
    },
    {
      title: "GOVERNANCE",
      items: [
        { label: "Administration & RBAC", href: "/admin", icon: Shield, moduleKey: "admin", badge: "Admin" },
        { label: "Ward & Facilities", href: "/facilities", icon: Building, moduleKey: "facilities", badge: "Setup" },
        { label: "Staff Directory", href: "/staff", icon: Stethoscope, moduleKey: "staff_directory", badge: "Roster" },
      ],
    },
    // Group customers: users who belong to several hospitals get a side-by-side overview of them.
    ...((user.hospitals?.length ?? 0) > 1
      ? [
          {
            title: "GROUP",
            items: [
              { label: "Group Overview", href: "/group", icon: Building2, moduleKey: "admin" as AppModule, badge: "Group" },
            ],
          },
        ]
      : []),
    // Sits above any single hospital's RBAC -- shown only for the allow-listed platform-operator
    // identity (see lib/platform.ts), never derived from the "admin" role bypass every other
    // section here gets, since a hospital's own local admin must never see or reach this.
    ...(isSuperAdmin
      ? [
          {
            title: "PLATFORM",
            items: [
              { label: "Onboard Hospital", href: "/platform", icon: Building2, moduleKey: "admin" as AppModule, badge: "New" },
            ],
          },
        ]
      : []),
  ];

  const sidebarContent = (
    <div className="flex flex-col h-full justify-between select-none">
      <div>
        {/* Brand Header */}
        <div
          className={`h-16 border-b border-slate-200 flex items-center transition-all ${
            isCollapsed ? "justify-center px-2" : "justify-between px-5"
          }`}
        >
          <Link
            href="/frontdesk"
            className="flex items-center gap-3 group overflow-hidden"
          >
            <div className="w-8 h-8 rounded-lg bg-[#0F766E] text-white flex items-center justify-center font-bold text-base shrink-0">
              <Building2 className="w-4.5 h-4.5" />
            </div>
            {!isCollapsed && (
              <div className="overflow-hidden">
                <div className="text-sm font-semibold tracking-tight text-slate-900 leading-tight truncate">
                  IST Health
                </div>
                <div className="text-[11px] text-slate-400 truncate">
                  Hospital HMIS
                </div>
              </div>
            )}
          </Link>

          {/* Mobile Close Button */}
          <button
            onClick={onCloseMobile}
            className="md:hidden text-slate-400 hover:text-slate-700 p-1 rounded-lg"
            aria-label="Close sidebar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* User Identity Card & RBAC Badge */}
        <div
          className={`border-b border-slate-200 transition-all ${
            isCollapsed ? "p-3 flex justify-center" : "px-5 py-3.5"
          }`}
        >
          {isCollapsed ? (
            <div
              className="w-9 h-9 rounded-full bg-teal-50 border border-teal-100 text-[#0F766E] font-semibold flex items-center justify-center text-xs"
              title={`${user.name} (@${user.username}) — Role: ${user.role}`}
            >
              {user.name.charAt(0)}
            </div>
          ) : (
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-teal-50 border border-teal-100 text-[#0F766E] font-semibold flex items-center justify-center text-xs shrink-0">
                {user.name.charAt(0)}
              </div>
              <div className="overflow-hidden">
                <div className="text-xs font-semibold text-slate-800 truncate">
                  {user.name}
                </div>
                <div className="text-[11px] text-slate-400 truncate capitalize">
                  {user.role} · @{user.username}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Navigation Sections with Role-Based Access Control Filtering (Zero Locked Clutter) */}
        <div
          className={`py-3 overflow-y-auto max-h-[calc(100vh-270px)] space-y-4 ${
            isCollapsed ? "px-2" : "px-3"
          }`}
        >
          {navSections
            .map((sec) => ({
              ...sec,
              items: sec.items.filter(
                (item) => user.role === "admin" || (item.moduleAny || [item.moduleKey]).some((m) => hasModuleAccess(user.role, m))
              ),
            }))
            .filter((sec) => sec.items.length > 0)
            .map((sec, idx) => (
              <div key={idx}>
                {!isCollapsed && (
                  <div className="text-[11px] font-semibold tracking-wider text-slate-400 px-3 mb-1.5 uppercase">
                    {sec.title}
                  </div>
                )}
                <div className="space-y-0.5">
                  {sec.items.map((item) => {
                    const Icon = item.icon;
                    const isActive =
                      pathname === item.href ||
                      (item.href !== "/frontdesk" && pathname.startsWith(item.href.split("?")[0]));

                    return (
                      <Link
                        key={`${item.href}-${item.label}`}
                        href={item.href}
                        onClick={onCloseMobile}
                        className={`flex items-center gap-3 rounded-lg text-[13px] font-medium transition-all group relative ${
                          isCollapsed
                            ? "justify-center p-2.5"
                            : "px-3 py-2 justify-between"
                        } ${
                          isActive
                            ? "bg-teal-50 text-[#0F766E] shadow-sm font-semibold"
                            : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/80"
                        }`}
                        title={isCollapsed ? item.label : undefined}
                      >
                        <div className="flex items-center gap-3">
                          <Icon
                            className={`w-4 h-4 shrink-0 transition-colors ${
                              isActive
                                ? "text-[#0F766E]"
                                : "text-slate-400 group-hover:text-slate-700"
                            }`}
                          />
                          {!isCollapsed && <span className="truncate">{item.label}</span>}
                        </div>

                        {!isCollapsed && item.badge && (
                          <span
                            className={`text-[10px] px-1.5 py-0.5 rounded ${
                              isActive
                                ? "bg-teal-100 text-[#0F766E]"
                                : "bg-slate-100 text-slate-400"
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
            ))}
        </div>
      </div>

      {/* Footer Controls */}
      <div className="p-3 border-t border-slate-200 space-y-0.5">
        {/* Onboarding Tour Trigger */}
        <button
          onClick={onOpenOnboarding}
          className={`w-full flex items-center rounded-lg text-[13px] text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors ${
            isCollapsed ? "justify-center p-2" : "gap-2.5 px-3 py-2"
          }`}
          title="Interactive Onboarding Walkthrough"
        >
          <Sparkles className="w-4 h-4 shrink-0" />
          {!isCollapsed && <span className="font-medium">System Tour Guide</span>}
        </button>

        {/* Collapse Toggle (Desktop only) */}
        <button
          onClick={onToggleCollapse}
          className={`hidden md:flex w-full items-center rounded-lg text-[13px] text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors ${
            isCollapsed ? "justify-center p-2" : "justify-between px-3 py-2"
          }`}
          title={isCollapsed ? "Expand Sidebar (Alt+S)" : "Collapse Sidebar (Alt+S)"}
        >
          {!isCollapsed && <span>Collapse Sidebar</span>}
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
        className={`hidden md:block bg-white border-r border-slate-200 flex-shrink-0 transition-all duration-200 z-30 ${
          isCollapsed ? "w-16" : "w-64"
        }`}
      >
        {sidebarContent}
      </aside>

      {/* Mobile Drawer Backdrop */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-40 md:hidden animate-fade-in"
          onClick={onCloseMobile}
        />
      )}

      {/* Mobile Drawer */}
      <aside
        className={`fixed top-0 bottom-0 left-0 w-64 bg-white border-r border-slate-200 z-50 md:hidden transition-transform duration-200 ease-out shadow-xl ${
          isMobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {sidebarContent}
      </aside>
    </>
  );
};
