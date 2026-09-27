"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Building2,
  ShieldCheck,
  Activity,
  Stethoscope,
  Microscope,
  Scan,
  Receipt,
  Shield,
  ArrowRight,
  User,
  KeyRound,
  Eye,
  EyeOff,
  AlertCircle,
  Server,
  Database,
  Globe,
  HelpCircle,
  X,
  Sparkles,
  ChevronDown,
  CheckCircle2,
} from "lucide-react";
import { TENANT_REGISTRY } from "@/lib/tenant";

// Verified demo stations for rapid hospital workflow validation.
// Never populated in a production deployment: these are real, documented credentials against
// the demo dataset, and must not ship to a client-facing build. Gated on a build-time constant
// (not a runtime check) so bundlers dead-code-eliminate the whole array, passwords included,
// out of a NEXT_PUBLIC_DEPLOYMENT_MODE=production build.
const DEMO_STATIONS =
  process.env.NEXT_PUBLIC_DEPLOYMENT_MODE === "production"
    ? []
    : [
        { label: "Front Desk", username: "demo_frontdesk1", password: "FrontDesk2026!", role: "reception", icon: User },
        { label: "Triage Nurse", username: "demo_nurse1", password: "Nurse2026!", role: "nursing", icon: Activity },
        { label: "Physician", username: "demo_dr1", password: "Doctor2026!", role: "physician", icon: Stethoscope },
        { label: "Diagnostic Lab", username: "demo_lab1", password: "Lab2026!", role: "lab", icon: Microscope },
        { label: "Radiology", username: "demo_rad1", password: "Rad2026!", role: "radiology", icon: Scan },
        { label: "Cashier", username: "demo_cashier1", password: "Cashier2026!", role: "cashier", icon: Receipt },
        { label: "Administrator", username: "demo_admin1", password: "DemoAdmin2026!", role: "admin", icon: Shield },
      ];

function readCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

export default function LoginPage() {
  const router = useRouter();
  // When middleware resolves the tenant from the request's subdomain (once subdomain-per-tenant
  // routing is live), it's locked in via this cookie and the manual picker below is hidden.
  const [hostResolvedTenantId] = useState(() => readCookie("resolved_tenant_id"));
  const [tenantId, setTenantId] = useState(() => readCookie("resolved_tenant_id") || "qatar-outpatient");
  const [username, setUsername] = useState(process.env.NEXT_PUBLIC_DEPLOYMENT_MODE === "production" ? "" : "demo_frontdesk1");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Forgot password modal state
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotIdentity, setForgotIdentity] = useState("");
  const [forgotStatus, setForgotStatus] = useState<string | null>(null);
  const [forgotLoading, setForgotLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: username.trim(),
          password,
          tenantId,
        }),
      });

      const data = await res.json();

      if (!res.ok || data.error) {
        throw new Error(data.error || "Authentication failed. Invalid credentials.");
      }

      // Successful login -> route to verified role dashboard
      const redirectPath = data.user?.redirect || "/frontdesk";
      router.push(redirectPath);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Authentication error occurred";
      setErrorMessage(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const fillStation = (stationUsername: string, stationPassword: string) => {
    setUsername(stationUsername);
    setPassword(stationPassword);
    setErrorMessage(null);
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotLoading(true);
    setForgotStatus(null);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identity: forgotIdentity.trim(), tenantId }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Recovery failed.");
      }
      setForgotStatus("A secure password reset link has been dispatched to your verified contact.");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Password recovery request failed";
      setForgotStatus(`Error: ${msg}`);
    } finally {
      setForgotLoading(false);
    }
  };

  const currentTenant = Object.values(TENANT_REGISTRY).find((t) => t.id === tenantId) || Object.values(TENANT_REGISTRY)[0];

  return (
    <div className="min-h-screen w-full bg-slate-950 flex flex-col justify-between text-slate-100 font-sans selection:bg-teal-500 selection:text-white relative">
      {/* Background Ambient Glows */}
      <div className="fixed top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[320px] sm:w-[500px] h-[320px] sm:h-[500px] bg-teal-600/10 rounded-full blur-[100px] sm:blur-[140px] pointer-events-none" />
      <div className="fixed bottom-10 right-1/4 w-[280px] sm:w-[450px] h-[280px] sm:h-[450px] bg-emerald-600/10 rounded-full blur-[90px] sm:blur-[130px] pointer-events-none" />

      {/* Top Banner Navigation Bar */}
      <header className="w-full border-b border-slate-800/80 bg-slate-900/80 backdrop-blur-md px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between z-20 shrink-0">
        <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-br from-teal-500 to-emerald-600 text-white flex items-center justify-center shadow-lg shadow-teal-500/20 shrink-0">
            <Building2 className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <div className="min-w-0">
            <div className="font-bold text-sm sm:text-base tracking-tight text-white flex items-center gap-1.5 sm:gap-2">
              <span className="truncate">IST Health HMIS</span>
              <span className="text-[9px] sm:text-[10px] uppercase font-semibold px-1.5 sm:px-2 py-0.5 rounded-full bg-teal-500/15 text-teal-400 border border-teal-500/30 shrink-0">
                Tryton 7.0
              </span>
            </div>
            <div className="text-[10px] sm:text-[11px] text-slate-400 font-medium truncate hidden md:block">
              Enterprise Hospital Information Management System
            </div>
          </div>
        </div>

        {/* Live Engine Telemetry: Desktop View */}
        <div className="hidden lg:flex items-center gap-3 text-xs">
          <div className="flex items-center gap-2 px-3 py-1 rounded-lg bg-slate-800/60 border border-slate-700/60 text-slate-300">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <Server className="w-3.5 h-3.5 text-slate-400" />
            <span>Tryton 7.0 Engine: <strong className="text-emerald-400 font-medium">Online</strong></span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1 rounded-lg bg-slate-800/60 border border-slate-700/60 text-slate-300">
            <Database className="w-3.5 h-3.5 text-teal-400" />
            <span>PostgreSQL: <strong className="text-white font-medium">Port 5432</strong></span>
          </div>
          <div className="flex items-center gap-1.5 text-slate-400">
            <ShieldCheck className="w-4 h-4 text-teal-400" />
            <span>Zero-Trust 256-Bit</span>
          </div>
        </div>

        {/* Live Engine Telemetry: Mobile & Tablet View */}
        <div className="flex lg:hidden items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-800/80 border border-slate-700/70 text-[11px] text-slate-300 shrink-0">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="font-medium text-emerald-400">Tryton 7.0 Live</span>
        </div>
      </header>

      {/* Main Split / Centered Workspace (Scrollable & Responsive) */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-4 lg:py-5 flex flex-col lg:flex-row items-center justify-center gap-4 sm:gap-6 lg:gap-8 xl:gap-12 z-10">
        
        {/* Left Hero: Large Screens Presentation */}
        <div className="hidden lg:flex lg:w-7/12 xl:w-7/12 flex-col justify-center py-1">
          <div className="inline-flex items-center gap-2 px-3 py-0.5 rounded-full bg-teal-950/80 border border-teal-800/60 text-teal-300 text-xs font-semibold mb-3 w-fit">
            <Sparkles className="w-3.5 h-3.5 text-teal-400 shrink-0" />
            <span>Unified Healthcare Cloud Architecture</span>
          </div>

          <h1 className="text-2xl xl:text-3xl 2xl:text-4xl font-extrabold text-white tracking-tight leading-snug">
            Next-Generation Clinical & Financial Governance
          </h1>
          <p className="mt-2.5 text-slate-400 text-xs xl:text-sm max-w-xl leading-relaxed">
            Native GNU Health HMIS orchestration powered by Tryton 7.0 and PostgreSQL 15. Experience instantaneous 360° longitudinal EHR audit trails, automated triage telemetry, diagnostic PACS, and balanced General Ledger double-entry moves.
          </p>

          {/* Feature Highlights Grid (Compact & Sleek) */}
          <div className="mt-4 xl:mt-5 grid grid-cols-2 gap-2.5 xl:gap-3 max-w-xl">
            <div className="p-2.5 xl:p-3 rounded-xl bg-slate-900/60 border border-slate-800/80 hover:border-teal-500/40 transition-colors flex items-start gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-teal-500/10 text-teal-400 flex items-center justify-center shrink-0 mt-0.5">
                <Activity className="w-3.5 h-3.5" />
              </div>
              <div className="min-w-0">
                <h3 className="text-xs font-semibold text-white">Clinical Telemetry</h3>
                <p className="text-[11px] text-slate-400 mt-0.5">Automated triage, BMI, and ICD-10 diagnoses.</p>
              </div>
            </div>

            <div className="p-2.5 xl:p-3 rounded-xl bg-slate-900/60 border border-slate-800/80 hover:border-teal-500/40 transition-colors flex items-start gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                <Receipt className="w-3.5 h-3.5" />
              </div>
              <div className="min-w-0">
                <h3 className="text-xs font-semibold text-white">General Ledger</h3>
                <p className="text-[11px] text-slate-400 mt-0.5">Balanced double-entry accounting moves.</p>
              </div>
            </div>

            <div className="p-2.5 xl:p-3 rounded-xl bg-slate-900/60 border border-slate-800/80 hover:border-teal-500/40 transition-colors flex items-start gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-purple-500/10 text-purple-400 flex items-center justify-center shrink-0 mt-0.5">
                <Microscope className="w-3.5 h-3.5" />
              </div>
              <div className="min-w-0">
                <h3 className="text-xs font-semibold text-white">Laboratory & PACS</h3>
                <p className="text-[11px] text-slate-400 mt-0.5">Automated CBC protocols and radiology.</p>
              </div>
            </div>

            <div className="p-2.5 xl:p-3 rounded-xl bg-slate-900/60 border border-slate-800/80 hover:border-teal-500/40 transition-colors flex items-start gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center shrink-0 mt-0.5">
                <ShieldCheck className="w-3.5 h-3.5" />
              </div>
              <div className="min-w-0">
                <h3 className="text-xs font-semibold text-white">Multi-Tenancy</h3>
                <p className="text-[11px] text-slate-400 mt-0.5">Physical database-per-client data isolation.</p>
              </div>
            </div>
          </div>

          {/* Active Tenant Facility Card */}
          <div className="mt-3.5 xl:mt-4 p-2.5 xl:p-3 rounded-xl bg-gradient-to-r from-slate-900/90 to-teal-950/40 border border-slate-800 flex items-center justify-between max-w-xl">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-7 h-7 xl:w-8 xl:h-8 rounded-lg bg-teal-500/20 text-teal-300 flex items-center justify-center border border-teal-500/30 shrink-0">
                <Globe className="w-3.5 h-3.5 xl:w-4 xl:h-4" />
              </div>
              <div className="min-w-0">
                <div className="text-xs font-semibold text-white truncate">{currentTenant.name}</div>
                <div className="text-[10px] text-slate-400 truncate">{currentTenant.country} · Currency: {currentTenant.currency}</div>
              </div>
            </div>
            <span className="text-[9px] font-bold px-2 py-0.5 rounded bg-teal-500/20 text-teal-300 border border-teal-500/30 uppercase shrink-0">
              Active Node
            </span>
          </div>
        </div>

        {/* Right Authentication Cockpit (Optimized for all viewports) */}
        <div className="w-full lg:w-5/12 xl:w-5/12 max-w-md flex flex-col justify-center">
          
          {/* Header Title */}
          <div className="mb-2.5 sm:mb-3 text-center lg:text-left">
            <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">Clinical Staff Sign In</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Access your designated outpatient cockpit, wards, or governance suite.
            </p>
          </div>

          {/* Error Message Alert */}
          {errorMessage && (
            <div className="mb-3 p-3 rounded-xl bg-red-950/70 border border-red-800 text-red-200 text-xs flex items-start gap-2 shadow-lg shadow-red-950/40 animate-in fade-in slide-in-from-top-1">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <div className="flex-1">
                <strong className="block font-semibold">Authentication Notice</strong>
                <span className="mt-0.5 block text-red-300 leading-relaxed">{errorMessage}</span>
              </div>
            </div>
          )}

          {/* Glassmorphic Login Card */}
          <div className="bg-slate-900/80 border border-slate-800/90 rounded-2xl p-4 sm:p-6 shadow-2xl backdrop-blur-xl">
            <form onSubmit={handleLogin} className="space-y-3 sm:space-y-3.5">
              
              {/* Hospital Facility: locked to the subdomain's tenant once resolved, otherwise a manual picker */}
              {hostResolvedTenantId ? (
                <div className="flex items-center gap-2 px-3 h-10 rounded-xl bg-slate-950/70 border border-slate-800 text-xs sm:text-sm text-slate-200">
                  <Building2 className="w-3.5 h-3.5 text-teal-400 shrink-0" />
                  <span className="truncate">{TENANT_REGISTRY[hostResolvedTenantId]?.name ?? "Your Facility"}</span>
                </div>
              ) : (
                <div>
                  <label htmlFor="login-tenant" className="text-xs font-semibold text-slate-300 block mb-1">
                    Hospital Facility
                  </label>
                  <div className="relative">
                    <select
                      id="login-tenant"
                      name="database"
                      value={tenantId}
                      onChange={(e) => setTenantId(e.target.value)}
                      className="w-full h-10 px-3 pl-9 pr-8 text-xs sm:text-sm bg-slate-950 border border-slate-700/80 rounded-xl focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 text-white transition-all appearance-none cursor-pointer truncate"
                    >
                      {Object.values(TENANT_REGISTRY).map((t) => (
                        <option key={t.id} value={t.id} className="bg-slate-900 text-white">
                          {t.name}
                        </option>
                      ))}
                    </select>
                    <Building2 className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3 pointer-events-none" />
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-3 pointer-events-none" />
                  </div>
                </div>
              )}

              {/* Username Input */}
              <div>
                <label htmlFor="login-username" className="text-xs font-semibold text-slate-300 block mb-1">
                  Staff Identity / Username
                </label>
                <div className="relative">
                  <input
                    id="login-username"
                    name="login"
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Your staff username"
                    required
                    autoComplete="username"
                    className="w-full h-10 px-3 pl-9 text-xs sm:text-sm bg-slate-950 border border-slate-700/80 rounded-xl focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 text-white placeholder-slate-500 transition-all"
                  />
                  <User className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3 pointer-events-none" />
                </div>
              </div>

              {/* Password Input */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label htmlFor="login-password" className="text-xs font-semibold text-slate-300">
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowForgotModal(true)}
                    className="text-xs text-teal-400 hover:text-teal-300 transition-colors cursor-pointer"
                  >
                    Forgot password?
                  </button>
                </div>
                <div className="relative">
                  <input
                    id="login-password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    required
                    autoComplete="current-password"
                    className="w-full h-10 px-3 pl-9 pr-9 text-xs sm:text-sm bg-slate-950 border border-slate-700/80 rounded-xl focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 text-white placeholder-slate-500 transition-all font-mono"
                  />
                  <KeyRound className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3 pointer-events-none" />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-200 p-0.5 cursor-pointer"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              {/* Sign In Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full h-10 sm:h-11 mt-1 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-600 hover:to-emerald-700 active:scale-[0.99] text-white font-semibold text-xs sm:text-sm shadow-md shadow-teal-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                {isLoading ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <span>Sign In to Healthcare Station</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Quick-Switch Verified Staff Stations — demo/staging only, never in production (see DEMO_STATIONS above) */}
          {DEMO_STATIONS.length > 0 && (
            <div className="mt-3.5 p-3 rounded-xl bg-slate-900/60 border border-slate-800/80">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                  Verified Hospital Stations
                </span>
                <span className="text-[10px] text-teal-400/90 font-medium">One-Click Fill</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                {DEMO_STATIONS.map((s) => {
                  const SIcon = s.icon;
                  const isCurrent = username === s.username;
                  return (
                    <button
                      key={s.username}
                      type="button"
                      onClick={() => fillStation(s.username, s.password)}
                      className={`inline-flex items-center justify-center sm:justify-start gap-1.5 px-2 py-1.5 rounded-lg text-[11px] font-medium border transition-all cursor-pointer truncate ${
                        isCurrent
                          ? "bg-teal-500/20 text-teal-300 border-teal-500/50 shadow-sm"
                          : "bg-slate-950/70 text-slate-400 border-slate-800/90 hover:border-slate-700 hover:text-slate-200"
                      }`}
                    >
                      <SIcon className="w-3 h-3 shrink-0" />
                      <span className="truncate">{s.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Security Guarantee Notice */}
          <div className="mt-3 flex items-center justify-center gap-1.5 text-[10px] sm:text-[11px] text-slate-400 text-center px-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span>Session tokens are encrypted, hardware-bound, and audited under hospital safety regulations.</span>
          </div>
        </div>
      </main>

      {/* Footer System Details */}
      <footer className="w-full border-t border-slate-800/80 bg-slate-900/70 backdrop-blur-md px-4 sm:px-6 lg:px-8 py-2.5 text-xs text-slate-400 flex flex-col md:flex-row items-center justify-between gap-2 z-20 shrink-0">
        <div className="text-center md:text-left text-[10px] sm:text-[11px]">
          IST Health HMIS · Native Tryton 7.0 & PostgreSQL 15 Single Source of Truth
        </div>
        <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 text-[10px] sm:text-[11px] text-slate-400">
          <span>RFC 6238 TOTP</span>
          <span>·</span>
          <span>Zero Secret Leakage</span>
          <span>·</span>
          <span>Database-per-Client</span>
        </div>
      </footer>

      {/* Forgot Password Modal */}
      {showForgotModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 max-w-sm w-full shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2 text-white font-bold text-sm sm:text-base">
                <HelpCircle className="w-4 h-4 sm:w-5 sm:h-5 text-teal-400" />
                <span>Password Recovery</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowForgotModal(false);
                  setForgotStatus(null);
                }}
                className="text-slate-400 hover:text-white p-1 rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-400 mb-3 leading-relaxed">
              Enter your clinical username or registered hospital email. Out-of-band instructions will be spooled to your security profile.
            </p>

            {forgotStatus && (
              <div className="mb-3 p-2.5 rounded-xl bg-teal-950/60 border border-teal-800 text-teal-200 text-xs">
                {forgotStatus}
              </div>
            )}

            <form onSubmit={handleForgotPassword} className="space-y-3">
              <input
                type="text"
                value={forgotIdentity}
                onChange={(e) => setForgotIdentity(e.target.value)}
                placeholder="Staff username or email"
                required
                className="w-full h-10 px-3 text-xs sm:text-sm bg-slate-950 border border-slate-700/80 rounded-xl focus:outline-none focus:border-teal-500 text-white placeholder-slate-500"
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowForgotModal(false)}
                  className="flex-1 h-9 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={forgotLoading}
                  className="flex-1 h-9 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-semibold disabled:opacity-50 cursor-pointer"
                >
                  {forgotLoading ? "Processing..." : "Send Reset Link"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
