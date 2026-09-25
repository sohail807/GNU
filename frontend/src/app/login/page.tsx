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
  KeyRound,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { TENANT_REGISTRY } from "@/lib/tenant";

export default function LoginPage() {
  const router = useRouter();
  const [tenantId, setTenantId] = useState("qatar-outpatient");
  const [username, setUsername] = useState("demo_frontdesk1");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Forgot password modal state
  const [isForgotModalOpen, setIsForgotModalOpen] = useState(false);
  const [recoveryStep, setRecoveryStep] = useState<"request" | "reset">("request");
  const [recoveryIdentity, setRecoveryIdentity] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [recoveryFeedback, setRecoveryFeedback] = useState<string | null>(null);
  const [recoveryError, setRecoveryError] = useState<string | null>(null);
  const [isRecoveryLoading, setIsRecoveryLoading] = useState(false);

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

  const handleRequestResetToken = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsRecoveryLoading(true);
    setRecoveryError(null);
    setRecoveryFeedback(null);

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identity: recoveryIdentity }),
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error || "Failed to submit recovery request.");
      }

      setRecoveryFeedback(data.message);
      if (data.devResetToken) {
        setResetToken(data.devResetToken);
      }
      setRecoveryStep("reset");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Recovery request failed";
      setRecoveryError(msg);
    } finally {
      setIsRecoveryLoading(false);
    }
  };

  const handleExecutePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setRecoveryError("Passwords do not match.");
      return;
    }
    setIsRecoveryLoading(true);
    setRecoveryError(null);

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: resetToken, newPassword }),
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error || "Failed to reset password.");
      }

      setRecoveryFeedback("Password reset successfully. Please log in with your new password.");
      setTimeout(() => {
        setIsForgotModalOpen(false);
        setRecoveryStep("request");
        setRecoveryFeedback(null);
      }, 2500);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Password reset execution failed";
      setRecoveryError(msg);
    } finally {
      setIsRecoveryLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-12 bg-[#F8FAFC]">
      {/* LEFT COLUMN: ENTERPRISE TELEMETRY & BRAND SHOWCASE */}
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
                ENTERPRISE HOSPITAL HMIS
              </span>
            </div>
          </div>

          <div className="max-w-md">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800/80 border border-slate-700 text-[11px] font-mono text-emerald-400 font-semibold mb-6">
              <span className="w-2 h-2 rounded-full bg-emerald-500 pulse-beacon" />
              <span>ACCREDITED CLINICAL HOSPITAL SYSTEM</span>
            </div>

            <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight mb-4">
              Next-Generation Outpatient Clinical Intelligence.
            </h1>

            <p className="text-sm text-slate-300 leading-relaxed mb-8">
              A high-precision, zero-trust Hospital Management Information System engineered for high-volume outpatient centers. Single source of clinical and financial truth.
            </p>

            {/* Architecture Highlights */}
            <div className="space-y-3">
              <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 flex items-start gap-3">
                <ShieldCheck className="w-5 h-5 text-[#0D9488] shrink-0 mt-0.5" />
                <div>
                  <span className="text-xs font-bold text-white block">Cryptographic Session Tokens</span>
                  <span className="text-[11px] text-slate-400">Zero unencrypted credential caching. httpOnly secure server cookies.</span>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 flex items-start gap-3">
                <Activity className="w-5 h-5 text-[#0D9488] shrink-0 mt-0.5" />
                <div>
                  <span className="text-xs font-bold text-white block">Real-Time Patient Workflow</span>
                  <span className="text-[11px] text-slate-400">Integrated intake, triage vitals, physician SOAP notes, and General Ledger posting.</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Telemetry Footer */}
        <div className="relative z-10 pt-8 mt-8 border-t border-slate-800 grid grid-cols-3 gap-4 text-xs font-mono text-slate-400">
          <div>
            <span className="text-[10px] uppercase text-slate-300 block font-bold">STANDARDS</span>
            <span className="text-slate-200 font-semibold">JCI & ISO 27799</span>
          </div>
          <div>
            <span className="text-[10px] uppercase text-slate-300 block font-bold">DATA VAULT</span>
            <span className="text-slate-200 font-semibold">256-Bit Encrypted</span>
          </div>
          <div>
            <span className="text-[10px] uppercase text-slate-300 block font-bold">FACILITY</span>
            <span className="text-slate-200 font-semibold">Doha Central Hospital</span>
          </div>
        </div>
      </div>

      {/* RIGHT COLUMN: ENTERPRISE LOGIN FORM */}
      <div className="lg:col-span-7 xl:col-span-7 p-6 sm:p-12 lg:p-16 flex flex-col justify-center max-w-2xl mx-auto w-full">
        <div className="mb-8">
          <div className="kicker text-[#0F766E] mb-1.5">AUTHENTICATION GATEWAY</div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Staff Portal Access
          </h2>
          <p className="text-xs text-slate-600 mt-1.5">
            Enter authorized hospital staff credentials to access your designated clinical or administrative station.
          </p>
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
            <label className="text-xs font-bold text-slate-700 block mb-1.5">Hospital Client / Facility</label>
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
            placeholder="e.g. demo_frontdesk1"
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
              onClick={() => {
                setIsForgotModalOpen(true);
                setRecoveryIdentity(username);
                setRecoveryStep("request");
                setRecoveryFeedback(null);
                setRecoveryError(null);
              }}
              className="text-[#0F766E] hover:underline font-semibold"
            >
              Forgot Password?
            </button>
            <span className="text-slate-400 font-mono text-[11px]">Zero-Trust Auth</span>
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

        <div className="mt-8 text-center text-xs text-slate-600 flex items-center justify-center gap-2">
          <ShieldCheck className="w-3.5 h-3.5 text-slate-600" />
          <span>Protected under Healthcare Data Privacy Standards (Law No. 13)</span>
        </div>
      </div>

      {/* FORGOT PASSWORD MODAL */}
      <Modal
        isOpen={isForgotModalOpen}
        onClose={() => setIsForgotModalOpen(false)}
        title="Account Recovery & Password Reset"
        kicker="SECURITY SELF-SERVICE"
        size="md"
      >
        <div className="space-y-4">
          {recoveryFeedback && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 rounded-lg flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{recoveryFeedback}</span>
            </div>
          )}

          {recoveryError && (
            <div className="p-3 bg-red-50 border border-red-200 text-xs text-red-800 rounded-lg flex items-center gap-2">
              <Lock className="w-4 h-4 text-red-600 shrink-0" />
              <span>{recoveryError}</span>
            </div>
          )}

          {recoveryStep === "request" ? (
            <form onSubmit={handleRequestResetToken} className="space-y-4">
              <p className="text-xs text-slate-600">
                Enter your staff username or verified email address. A secure, short-lived recovery token will be generated.
              </p>
              <Input
                label="Staff Username or Email"
                value={recoveryIdentity}
                onChange={(e) => setRecoveryIdentity(e.target.value)}
                placeholder="e.g. demo_frontdesk1"
                required
              />
              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" onClick={() => setIsForgotModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary" isLoading={isRecoveryLoading} leftIcon={<KeyRound className="w-4 h-4" />}>
                  Generate Recovery Token
                </Button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleExecutePasswordReset} className="space-y-4">
              <Input
                label="Password Reset Token"
                value={resetToken}
                onChange={(e) => setResetToken(e.target.value)}
                placeholder="Paste the 64-character reset token"
                required
              />
              <Input
                label="New Password"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Minimum 8 characters"
                required
              />
              <Input
                label="Confirm New Password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter new password"
                required
              />
              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" onClick={() => setRecoveryStep("request")}>
                  Back
                </Button>
                <Button type="submit" variant="primary" isLoading={isRecoveryLoading}>
                  Set New Password
                </Button>
              </div>
            </form>
          )}
        </div>
      </Modal>
    </div>
  );
}
