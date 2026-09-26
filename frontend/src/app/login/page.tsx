"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ShieldCheck,
  Building2,
  Lock,
  ArrowRight,
  Eye,
  EyeOff,
  UserCheck,
  Activity,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { TENANT_REGISTRY } from "@/lib/tenant";

export default function LoginPage() {
  const router = useRouter();
  const [tenantId, setTenantId] = useState("qatar-outpatient");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [isForgotModalOpen, setIsForgotModalOpen] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password, tenantId }),
      });

      const data = await res.json();

      if (!res.ok || data.error) {
        throw new Error(data.error || "Authentication failed. Invalid credentials.");
      }

      // Successful login -> route to verified role dashboard
      const redirectPath = data.user?.redirect || "/frontdesk";
      router.push(redirectPath);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Authentication error";
      setErrorMessage(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-12 bg-[#F8FAFC]">
      {/* Product and connection information */}
      <div className="lg:col-span-5 xl:col-span-5 bg-[#0F172A] text-white p-8 sm:p-12 lg:p-16 flex flex-col justify-between relative overflow-hidden">
        {/* Subtle background glow */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#0F766E]/20 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-teal-600/10 rounded-full blur-3xl pointer-events-none -ml-20 -mb-20" />

        <div className="relative z-10">
          {/* Institution Header */}
          <div className="flex items-center gap-3 mb-12">
            <div className="w-10 h-10 rounded-xl bg-[#0F766E] text-white flex items-center justify-center font-bold text-lg shadow-md border border-teal-400/30">
              <Building2 className="w-5 h-5 text-emerald-200" />
            </div>
            <div>
              <span className="text-lg font-bold tracking-tight text-white block leading-tight">
                IST HEALTH
              </span>
              <span className="text-[10px] font-mono tracking-widest text-emerald-400 uppercase font-bold">
                HEALTHCARE WORKSPACE
              </span>
            </div>
          </div>

          <div className="max-w-md">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800/80 border border-slate-700 text-[11px] font-mono text-emerald-400 font-semibold mb-6">
              <span className="w-2 h-2 rounded-full bg-emerald-500 pulse-beacon" />
              <span>HEALTH WORKSPACE</span>
            </div>

            <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight mb-4">
              Hospital management workspace
            </h1>

            <p className="text-sm text-slate-300 leading-relaxed mb-8">
              Sign in with your authorized staff account. Clinical and administrative access is controlled by your organization’s configured permissions.
            </p>

            {/* Architecture Highlights */}
            <div className="space-y-3">
              <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 flex items-start gap-3">
                <ShieldCheck className="w-5 h-5 text-[#0D9488] shrink-0 mt-0.5" />
                <div>
                  <span className="text-xs font-bold text-white block">Session protection</span>
                  <span className="text-[11px] text-slate-400">Session cookies are HTTP-only and encrypted by the application.</span>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 flex items-start gap-3">
                <Activity className="w-5 h-5 text-[#0D9488] shrink-0 mt-0.5" />
                <div>
                  <span className="text-xs font-bold text-white block">Clinical records integration</span>
                  <span className="text-[11px] text-slate-400">Your organization’s clinical records system is configured by the administrator.</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="relative z-10 pt-8 mt-8 border-t border-slate-800 text-xs text-slate-400">
          Workspace access is configured by the server administrator.
        </div>
      </div>

      {/* RIGHT COLUMN: ENTERPRISE LOGIN FORM */}
      <div className="lg:col-span-7 xl:col-span-7 p-6 sm:p-12 lg:p-16 flex flex-col justify-center max-w-2xl mx-auto w-full">
        {process.env.NEXT_PUBLIC_DEPLOYMENT_MODE === "test" && (
          <div role="status" className="mb-6 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-950">
            Test environment · synthetic data only · no production operations
          </div>
        )}
        <div className="mb-8">
          <div className="kicker text-[#0F766E] mb-1.5">AUTHENTICATION GATEWAY</div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Staff Portal Access
          </h2>
          <p className="text-xs text-slate-600 mt-1.5">Enter your authorized staff username and password.</p>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-xs text-red-800 flex items-center gap-2">
            <Lock className="w-4 h-4 text-red-600 shrink-0" />
            <span className="font-medium">{errorMessage}</span>
          </div>
        )}

        {/* Credentials Form */}
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1.5">Configured workspace</label>
            <select
              value={tenantId}
              onChange={(e) => setTenantId(e.target.value)}
              className="w-full h-10 px-3 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:border-[#0F766E] font-medium"
            >
              {Object.values(TENANT_REGISTRY).map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name} ({t.currency})
                </option>
              ))}
            </select>
          </div>

          <Input
            label="Staff Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Enter your staff username"
            required
            autoComplete="username"
          />

          <div className="relative">
            <Input
              label="Secure Password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              required
              autoComplete="current-password"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3.5 top-8.5 text-slate-400 hover:text-slate-600 p-1"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>

          <div className="flex items-center justify-between text-xs pt-1">
            <button
              type="button"
              onClick={() => setIsForgotModalOpen(true)}
              className="text-[#0F766E] hover:underline font-semibold"
            >
              Forgot Password?
            </button>
            <span className="text-slate-400 font-mono text-[11px]">Secure staff sign-in</span>
          </div>

          <div className="pt-3">
            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full h-11 text-sm font-semibold tracking-wide shadow-sm"
              isLoading={isLoading}
              rightIcon={<ArrowRight className="w-4 h-4 ml-1" />}
            >
              Sign In to Medical Workspace
            </Button>
          </div>
        </form>

        {/* Quick Role Fill Stations (Available in Development & Test Environments) */}
        {process.env.NEXT_PUBLIC_DEPLOYMENT_MODE !== "production" && (
          <div className="mt-8 pt-6 border-t border-slate-200">
            <div className="flex items-center justify-between mb-3">
              <div className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-500">
                Verified Demo Stations (1-Click Fill)
              </div>
              <span className="text-[10px] font-mono text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 font-semibold">
                Live Backend
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {[
                { label: "Front Desk", user: "demo_frontdesk1", pass: "FrontDesk2026!", role: "Reception", color: "hover:border-blue-400 hover:bg-blue-50/50" },
                { label: "Physician", user: "demo_dr1", pass: "Doctor2026!", role: "Clinical", color: "hover:border-teal-400 hover:bg-teal-50/50" },
                { label: "Triage Nurse", user: "demo_nurse1", pass: "Nurse2026!", role: "Nursing", color: "hover:border-emerald-400 hover:bg-emerald-50/50" },
                { label: "Cashier", user: "demo_cashier1", pass: "Cashier2026!", role: "Billing", color: "hover:border-amber-400 hover:bg-amber-50/50" },
                { label: "Diagnostic Lab", user: "demo_lab1", pass: "Lab2026!", role: "Laboratory", color: "hover:border-purple-400 hover:bg-purple-50/50" },
                { label: "Radiology Tech", user: "demo_rad1", pass: "Rad2026!", role: "Radiology", color: "hover:border-indigo-400 hover:bg-indigo-50/50" },
                { label: "Administrator", user: "demo_admin1", pass: "DemoAdmin2026!", role: "Admin", color: "hover:border-slate-500 hover:bg-slate-100" },
              ].map((p) => (
                <button
                  key={p.user}
                  type="button"
                  onClick={() => {
                    setUsername(p.user);
                    setPassword(p.pass);
                    setErrorMessage(null);
                  }}
                  className={`p-2 rounded-lg border border-slate-200 bg-white text-left transition-all group ${p.color} cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#0F766E]/20`}
                >
                  <div className="text-xs font-bold text-slate-800 group-hover:text-[#0F766E] truncate">
                    {p.label}
                  </div>
                  <div className="text-[10px] font-mono text-slate-400 truncate">
                    @{p.user}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="mt-6 text-center text-xs text-slate-600 flex items-center justify-center gap-2">
          <ShieldCheck className="w-3.5 h-3.5 text-slate-600" />
          <span>Use only with an authorized account.</span>
        </div>
      </div>

      {/* Password recovery is intentionally not advertised until a secure recovery service is configured. */}
      <Modal
        isOpen={isForgotModalOpen}
        onClose={() => setIsForgotModalOpen(false)}
        title="Password recovery"
        kicker="ACCOUNT SUPPORT"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-700">
            Self-service password recovery is not configured for this deployment. Contact your clinic administrator to request a reset.
          </p>
          <div className="flex justify-end">
            <Button type="button" variant="primary" onClick={() => setIsForgotModalOpen(false)}>
              Close
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
