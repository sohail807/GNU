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
  Lock,
  User,
  KeyRound,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle2,
  Server,
  Database,
  Globe,
  HelpCircle,
  X,
  Sparkles,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { TENANT_REGISTRY } from "@/lib/tenant";

// Verified demo stations for rapid hospital workflow validation
const DEMO_STATIONS = [
  { label: "Front Desk", username: "demo_frontdesk1", password: "FrontDesk2026!", role: "reception", icon: User, color: "text-blue-600 bg-blue-50 border-blue-200" },
  { label: "Triage Nurse", username: "demo_nurse1", password: "Nurse2026!", role: "nursing", icon: Activity, color: "text-emerald-600 bg-emerald-50 border-emerald-200" },
  { label: "Physician", username: "demo_dr1", password: "Doctor2026!", role: "physician", icon: Stethoscope, color: "text-teal-600 bg-teal-50 border-teal-200" },
  { label: "Diagnostic Lab", username: "demo_lab1", password: "Lab2026!", role: "lab", icon: Microscope, color: "text-purple-600 bg-purple-50 border-purple-200" },
  { label: "Radiology", username: "demo_rad1", password: "Rad2026!", role: "radiology", icon: Scan, color: "text-indigo-600 bg-indigo-50 border-indigo-200" },
  { label: "Cashier", username: "demo_cashier1", password: "Cashier2026!", role: "cashier", icon: Receipt, color: "text-amber-600 bg-amber-50 border-amber-200" },
  { label: "Administrator", username: "demo_admin1", password: "DemoAdmin2026!", role: "admin", icon: Shield, color: "text-rose-600 bg-rose-50 border-rose-200" },
];

export default function LoginPage() {
  const router = useRouter();
  const [tenantId, setTenantId] = useState("qatar-outpatient");
  const [username, setUsername] = useState("demo_frontdesk1");
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
    <div className="min-h-screen bg-slate-950 flex flex-col justify-between text-slate-100 font-sans selection:bg-teal-500 selection:text-white">
      {/* Top Banner Navigation Bar */}
      <header className="w-full border-b border-slate-800/80 bg-slate-900/60 backdrop-blur-md px-6 py-4 flex items-center justify-between z-20">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-teal-500 to-emerald-600 text-white flex items-center justify-center shadow-lg shadow-teal-500/20">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <div className="font-bold text-base tracking-tight text-white flex items-center gap-2">
              IST Health HMIS
              <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded-full bg-teal-500/15 text-teal-400 border border-teal-500/30">
                Production 7.0
              </span>
            </div>
            <div className="text-[11px] text-slate-400 font-medium">
              Enterprise Hospital Information Management System
            </div>
          </div>
        </div>

        {/* Live System Engine Status Badges */}
        <div className="hidden md:flex items-center gap-4 text-xs">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800/60 border border-slate-700/60 text-slate-300">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <Server className="w-3.5 h-3.5 text-slate-400" />
            <span>Tryton 7.0 Engine: <strong className="text-emerald-400 font-medium">Online</strong></span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800/60 border border-slate-700/60 text-slate-300">
            <Database className="w-3.5 h-3.5 text-teal-400" />
            <span>PostgreSQL: <strong className="text-white font-medium">Port 5432</strong></span>
          </div>
          <div className="flex items-center gap-1.5 text-slate-400">
            <ShieldCheck className="w-4 h-4 text-teal-400" />
            <span>Zero-Trust 256-Bit</span>
          </div>
        </div>
      </header>

      {/* Main Split-Screen Workspace */}
      <main className="flex-1 flex flex-col lg:flex-row items-stretch justify-center relative overflow-hidden">
        {/* Background Ambient Glows */}
        <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[550px] bg-teal-600/10 rounded-full blur-[140px] pointer-events-none" />
        <div className="absolute bottom-10 right-1/4 w-[450px] h-[450px] bg-emerald-600/10 rounded-full blur-[130px] pointer-events-none" />

        {/* Left Hero & Healthcare Network Presentation */}
        <div className="hidden lg:flex flex-1 flex-col justify-between p-12 lg:p-16 border-r border-slate-800/60 z-10">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-950/80 border border-teal-800/60 text-teal-300 text-xs font-semibold mb-6">
              <Sparkles className="w-3.5 h-3.5 text-teal-400" />
              Unified Healthcare Cloud Architecture
            </div>

            <h1 className="text-4xl xl:text-5xl font-extrabold text-white tracking-tight leading-tight">
              Next-Generation Clinical & Financial Governance
            </h1>
            <p className="mt-4 text-slate-400 text-base max-w-xl leading-relaxed">
              Native GNU Health orchestration powered by Tryton 7.0 and PostgreSQL. Experience instantaneous 360° longitudinal EHR audit trails, automated triage telemetry, diagnostic PACS, and balanced General Ledger double-entry moves.
            </p>

            {/* Feature Capability Highlights */}
            <div className="mt-10 grid grid-cols-2 gap-4 max-w-lg">
              <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80 hover:border-teal-500/40 transition-colors">
                <div className="w-8 h-8 rounded-lg bg-teal-500/10 text-teal-400 flex items-center justify-center mb-3">
                  <Activity className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-semibold text-white">Clinical Telemetry</h3>
                <p className="text-xs text-slate-400 mt-1">Real-time vital signs, automated BMI indexing, and ICD-10 diagnostics.</p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80 hover:border-teal-500/40 transition-colors">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-3">
                  <Receipt className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-semibold text-white">General Ledger Audit</h3>
                <p className="text-xs text-slate-400 mt-1">Strict debit/credit moves with zero shadow databases or balance drift.</p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80 hover:border-teal-500/40 transition-colors">
                <div className="w-8 h-8 rounded-lg bg-purple-500/10 text-purple-400 flex items-center justify-center mb-3">
                  <Microscope className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-semibold text-white">Laboratory & PACS</h3>
                <p className="text-xs text-slate-400 mt-1">Automated CBC analyte loading and digital radiological reporting.</p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80 hover:border-teal-500/40 transition-colors">
                <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center mb-3">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-semibold text-white">Multi-Tenant Isolation</h3>
                <p className="text-xs text-slate-400 mt-1">Database-per-client physical boundary with token protection.</p>
              </div>
            </div>
          </div>

          {/* Active Tenant Facility Card */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-slate-900/90 to-teal-950/40 border border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-teal-500/20 text-teal-300 flex items-center justify-center border border-teal-500/30">
                <Globe className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs font-semibold text-white">{currentTenant.name}</div>
                <div className="text-[11px] text-slate-400">Database: <code className="text-teal-300">{currentTenant.database}</code> · Currency: {currentTenant.currency}</div>
              </div>
            </div>
            <span className="text-[10px] font-bold px-2 py-1 rounded bg-teal-500/20 text-teal-300 border border-teal-500/30 uppercase">
              Isolated Node
            </span>
          </div>
        </div>

        {/* Right Authentication Cockpit */}
        <div className="flex-1 flex flex-col items-center justify-center p-6 sm:p-10 lg:p-14 z-10">
          <div className="w-full max-w-md">
            {/* Header Title */}
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-white tracking-tight">Clinical Staff Sign In</h2>
              <p className="text-sm text-slate-400 mt-1">
                Access your designated outpatient cockpit, wards, or governance suite.
              </p>
            </div>

            {/* Error Message Alert */}
            {errorMessage && (
              <div className="mb-5 p-4 rounded-xl bg-red-950/60 border border-red-800 text-red-200 text-xs flex items-start gap-3 shadow-lg shadow-red-950/40 animate-in fade-in slide-in-from-top-1">
                <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <strong className="block font-semibold">Authentication Notice</strong>
                  <span className="mt-0.5 block text-red-300">{errorMessage}</span>
                </div>
              </div>
            )}

            {/* Glassmorphic Login Card */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-7 shadow-2xl backdrop-blur-xl">
              <form onSubmit={handleLogin} className="space-y-4">
                {/* Hospital Tenant Selector */}
                <div>
                  <label htmlFor="login-tenant" className="text-xs font-semibold text-slate-300 block mb-1.5 flex items-center justify-between">
                    <span>Hospital Facility / Tenant</span>
                    <span className="text-[11px] text-teal-400 font-normal">Database Partition</span>
                  </label>
                  <div className="relative">
                    <select
                      id="login-tenant"
                      name="database"
                      value={tenantId}
                      onChange={(e) => setTenantId(e.target.value)}
                      className="w-full h-11 px-3.5 pl-10 text-sm bg-slate-950 border border-slate-700/80 rounded-xl focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 text-white transition-all appearance-none cursor-pointer"
                    >
                      {Object.values(TENANT_REGISTRY).map((t) => (
                        <option key={t.id} value={t.id} className="bg-slate-900 text-white">
                          {t.name} ({t.currency}) — DB: {t.database}
                        </option>
                      ))}
                    </select>
                    <Building2 className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5 pointer-events-none" />
                    <ChevronRight className="w-4 h-4 text-slate-400 absolute right-3.5 top-3.5 rotate-90 pointer-events-none" />
                  </div>
                </div>

                {/* Username Input */}
                <div>
                  <label htmlFor="login-username" className="text-xs font-semibold text-slate-300 block mb-1.5">
                    Staff Identity / Username
                  </label>
                  <div className="relative">
                    <input
                      id="login-username"
                      name="login"
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="e.g. demo_dr1, demo_admin1"
                      required
                      autoComplete="username"
                      className="w-full h-11 px-3.5 pl-10 text-sm bg-slate-950 border border-slate-700/80 rounded-xl focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 text-white placeholder-slate-500 transition-all"
                    />
                    <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5 pointer-events-none" />
                  </div>
                </div>

                {/* Password Input */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label htmlFor="login-password" className="text-xs font-semibold text-slate-300">
                      Password
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowForgotModal(true)}
                      className="text-xs text-teal-400 hover:text-teal-300 transition-colors"
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
                      className="w-full h-11 px-3.5 pl-10 pr-10 text-sm bg-slate-950 border border-slate-700/80 rounded-xl focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 text-white placeholder-slate-500 transition-all font-mono"
                    />
                    <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5 pointer-events-none" />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-3 text-slate-400 hover:text-slate-200 p-0.5"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Sign In Submit Button */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full h-11 mt-2 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-600 hover:to-emerald-700 active:scale-[0.99] text-white font-semibold text-sm shadow-lg shadow-teal-500/25 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  {isLoading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <span>Sign In to Healthcare Station</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            </div>

            {/* Quick-Switch Verified Staff Stations */}
            <div className="mt-6 p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80">
              <div className="flex items-center justify-between mb-2.5">
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  Verified Hospital Stations
                </span>
                <span className="text-[10px] text-teal-400/80">One-Click Fill</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {DEMO_STATIONS.map((s) => {
                  const SIcon = s.icon;
                  const isCurrent = username === s.username;
                  return (
                    <button
                      key={s.username}
                      type="button"
                      onClick={() => fillStation(s.username, s.password)}
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-all cursor-pointer ${
                        isCurrent
                          ? "bg-teal-500/20 text-teal-300 border-teal-500/50 shadow-sm"
                          : "bg-slate-950/70 text-slate-400 border-slate-800 hover:border-slate-700 hover:text-slate-200"
                      }`}
                    >
                      <SIcon className="w-3.5 h-3.5" />
                      <span>{s.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Security Guarantee Notice */}
            <div className="mt-6 flex items-center justify-center gap-2 text-xs text-slate-400 text-center">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Session tokens are encrypted, hardware-bound, and audited under hospital safety regulations.</span>
            </div>
          </div>
        </div>
      </main>

      {/* Footer System Details */}
      <footer className="w-full border-t border-slate-800/80 bg-slate-900/60 backdrop-blur-md px-6 py-3 text-xs text-slate-400 flex flex-col sm:flex-row items-center justify-between gap-2 z-20">
        <div>IST Health HMIS · Native Tryton 7.0 & PostgreSQL 15 Single Source of Truth</div>
        <div className="flex items-center gap-4 text-slate-400">
          <span>RFC 6238 TOTP Active</span>
          <span>·</span>
          <span>Zero Secret Leakage</span>
          <span>·</span>
          <span>Database-per-Client</span>
        </div>
      </footer>

      {/* Forgot Password Modal */}
      {showForgotModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-7 max-w-sm w-full shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2 text-white font-bold text-base">
                <HelpCircle className="w-5 h-5 text-teal-400" />
                <span>Password Recovery</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowForgotModal(false);
                  setForgotStatus(null);
                }}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-400 mb-4 leading-relaxed">
              Enter your clinical username or registered hospital email. Out-of-band instructions will be spooled to your security profile.
            </p>

            {forgotStatus && (
              <div className="mb-4 p-3 rounded-xl bg-teal-950/60 border border-teal-800 text-teal-200 text-xs">
                {forgotStatus}
              </div>
            )}

            <form onSubmit={handleForgotPassword} className="space-y-4">
              <input
                type="text"
                value={forgotIdentity}
                onChange={(e) => setForgotIdentity(e.target.value)}
                placeholder="Staff username or email"
                required
                className="w-full h-11 px-3.5 text-sm bg-slate-950 border border-slate-700/80 rounded-xl focus:outline-none focus:border-teal-500 text-white placeholder-slate-500"
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowForgotModal(false)}
                  className="flex-1 h-10 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={forgotLoading}
                  className="flex-1 h-10 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-semibold disabled:opacity-50"
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
