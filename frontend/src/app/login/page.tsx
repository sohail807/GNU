"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ShieldCheck,
  Building2,
  ArrowRight,
  Eye,
  EyeOff,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { TENANT_REGISTRY } from "@/lib/tenant";

// Quick-fill demo stations for the synthetic personas documented for this
// deployment. Convenience only - the backend still authenticates normally.
const DEMO_STATIONS = [
  { label: "Front Desk", username: "demo_frontdesk1", password: "FrontDesk2026!" },
  { label: "Physician", username: "demo_dr1", password: "Doctor2026!" },
  { label: "Triage Nurse", username: "demo_nurse1", password: "Nurse2026!" },
  { label: "Cashier", username: "demo_cashier1", password: "Cashier2026!" },
  { label: "Lab", username: "demo_lab1", password: "Lab2026!" },
  { label: "Radiology", username: "demo_rad1", password: "Rad2026!" },
  { label: "Administrator", username: "demo_admin1", password: "DemoAdmin2026!" },
];

export default function LoginPage() {
  const router = useRouter();
  const [tenantId, setTenantId] = useState("qatar-outpatient");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

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

  const fillStation = (stationUsername: string, stationPassword: string) => {
    setUsername(stationUsername);
    setPassword(stationPassword);
    setErrorMessage(null);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4 py-10">
      <div className="w-full max-w-sm">
        {/* Brand mark */}
        <div className="flex flex-col items-center text-center mb-8">
          <div className="w-11 h-11 rounded-xl bg-[#0F766E] text-white flex items-center justify-center mb-3">
            <Building2 className="w-5.5 h-5.5" />
          </div>
          <h1 className="text-lg font-semibold text-slate-900 tracking-tight">IST Health</h1>
          <p className="text-xs text-slate-400 mt-0.5">Hospital management workspace</p>
        </div>

        {process.env.NEXT_PUBLIC_DEPLOYMENT_MODE === "test" && (
          <div role="status" className="mb-5 rounded-lg border border-amber-200 bg-amber-50 px-3.5 py-2.5 text-xs text-amber-900">
            Test environment · synthetic data only · no production operations
          </div>
        )}

        {/* Login card */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 sm:p-7">
          {errorMessage && (
            <div className="mb-5 p-3 rounded-lg bg-red-50 text-xs text-red-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="text-xs font-medium text-slate-600 block mb-1.5">Workspace</label>
              <select
                value={tenantId}
                onChange={(e) => setTenantId(e.target.value)}
                className="w-full h-10 px-3 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-[#0F766E] focus:ring-2 focus:ring-[#0F766E]/15 text-slate-800"
              >
                {Object.values(TENANT_REGISTRY).map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name} ({t.currency})
                  </option>
                ))}
              </select>
            </div>

            <Input
              label="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Staff username"
              required
              autoComplete="username"
            />

            <div className="relative">
              <Input
                label="Password"
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

            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full mt-1.5"
              isLoading={isLoading}
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              Sign in
            </Button>
          </form>
        </div>

        {/* Demo station quick-fill */}
        <div className="mt-5">
          <p className="text-[11px] text-slate-400 text-center mb-2">Verified demo stations</p>
          <div className="flex flex-wrap justify-center gap-1.5">
            {DEMO_STATIONS.map((s) => (
              <button
                key={s.username}
                type="button"
                onClick={() => fillStation(s.username, s.password)}
                className="px-2.5 py-1 rounded-full text-[11px] font-medium text-slate-500 bg-white border border-slate-200 hover:border-slate-300 hover:text-slate-700 transition-colors"
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-6 flex items-center justify-center gap-1.5 text-[11px] text-slate-400">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Session cookies are HTTP-only and encrypted. Use only with an authorized account.</span>
        </div>
      </div>
    </div>
  );
}
