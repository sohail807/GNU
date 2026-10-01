"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, useReducedMotion } from "framer-motion";
import {
  Lock,
  CalendarCheck,
  FlaskConical,
  TrendingUp,
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
  Globe,
  HelpCircle,
  X,
} from "lucide-react";
interface PublicTenant {
  id: string;
  name: string;
  currency: string;
  country: string;
}

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

export default function LoginPage() {
  const router = useRouter();
  // The hospital comes from the address when visiting a hospital subdomain (locked); on the main
  // address staff type their hospital code (blank = the default hospital). The page never lists
  // other hospitals.
  const [tenantId, setTenantId] = useState("qatar-outpatient");
  const [hospitalCode, setHospitalCode] = useState("");
  const [hostResolved, setHostResolved] = useState(false);
  const [tenants, setTenants] = useState<PublicTenant[]>([]);
  useEffect(() => {
    fetch("/api/tenants")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data.tenants)) {
          setTenants(data.tenants);
          if (data.tenants[0]?.id) setTenantId(data.tenants[0].id);
        }
        setHostResolved(data.hostResolved === true);
      })
      .catch(() => {
        // Leave the facility name blank rather than show a stale or invented one.
      });
  }, []);
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
          hospital: hostResolved ? "" : hospitalCode.trim().toLowerCase(),
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

  const currentTenant = tenants.find((t) => t.id === tenantId) || tenants[0];
  const reduce = useReducedMotion();

  const features = [
    { icon: Stethoscope, label: "Clinical records" },
    { icon: FlaskConical, label: "Lab & imaging" },
    { icon: Receipt, label: "Billing & claims" },
    { icon: ShieldCheck, label: "Audited access" },
  ];

  const rise = (delay: number) => ({
    initial: reduce ? false : { opacity: 0, y: 18 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.6, delay, ease: [0.16, 1, 0.3, 1] as const },
  });

  const float = (dur: number, dist: number) =>
    reduce ? {} : { animate: { y: [0, -dist, 0] }, transition: { duration: dur, repeat: Infinity, ease: "easeInOut" as const } };

  const inputClass =
    "peer w-full h-12 [@media(max-height:820px)]:lg:h-10 pl-11 pr-3 text-[15px] bg-slate-950/60 border border-white/10 rounded-xl text-white placeholder:text-slate-400 hover:border-white/20 focus:outline-none focus:bg-slate-950 focus:border-teal-400 focus:ring-4 focus:ring-teal-400/15 [&:-webkit-autofill]:shadow-[inset_0_0_0_100px_#0a141d] [&:-webkit-autofill]:[-webkit-text-fill-color:#fff] transition-all";
  const iconClass =
    "w-[18px] h-[18px] text-slate-400 absolute left-4 top-[15px] pointer-events-none transition-colors peer-focus:text-teal-400";

  const bars = [38, 54, 46, 70, 62, 84, 76];
  const queue = [
    { initials: "AW", tone: "bg-teal-500/20 text-teal-200", status: "In consultation", dot: "bg-teal-500" },
    { initials: "MR", tone: "bg-sky-500/20 text-sky-200", status: "Waiting", dot: "bg-amber-400" },
    { initials: "JK", tone: "bg-indigo-500/20 text-indigo-200", status: "Lab results ready", dot: "bg-emerald-500" },
  ];

  return (
    <div className="relative min-h-dvh lg:h-dvh w-full overflow-x-hidden lg:overflow-hidden bg-[#060D14] text-slate-100 [color-scheme:dark] font-sans selection:bg-teal-600 selection:text-white">
      {/* Soft light mesh background */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-40 -left-40 w-[620px] h-[620px] rounded-full bg-teal-500/15 blur-[120px]" />
        <div className="absolute top-1/3 -right-40 w-[560px] h-[560px] rounded-full bg-sky-500/10 blur-[120px]" />
        <div className="absolute -bottom-48 left-1/3 w-[520px] h-[520px] rounded-full bg-indigo-500/10 blur-[120px]" />
        <div
          className="absolute inset-0 opacity-[0.5]"
          style={{
            backgroundImage: "radial-gradient(rgba(94,234,212,0.10) 1px, transparent 1px)",
            backgroundSize: "26px 26px",
            maskImage: "radial-gradient(ellipse at center, black 30%, transparent 75%)",
            WebkitMaskImage: "radial-gradient(ellipse at center, black 30%, transparent 75%)",
          }}
        />
      </div>

      <div className="relative z-10 min-h-dvh lg:h-full flex flex-col">
        {/* Top bar */}
        <header className="w-full max-w-7xl mx-auto px-5 sm:px-8 lg:px-10 pt-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-600 to-teal-800 text-white flex items-center justify-center shadow-lg shadow-teal-700/25">
              <Building2 className="w-5 h-5" />
            </div>
            <div className="leading-tight">
              <div className="text-[17px] font-bold tracking-tight text-white">IST Health</div>
              <div className="text-[11px] font-medium text-slate-400">Hospital Management System</div>
            </div>
          </div>
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs font-medium text-slate-300 backdrop-blur">
            <Lock className="w-3.5 h-3.5 text-teal-400" />
            Secure staff access
          </div>
        </header>

        <main className="flex-1 min-h-0 w-full max-w-7xl mx-auto px-5 sm:px-8 lg:px-10 py-8 lg:py-4 flex flex-col lg:flex-row items-center gap-10 xl:gap-20">
          {/* Showcase */}
          <section className="hidden lg:flex lg:w-[56%] flex-col">
            <motion.div {...rise(0.05)} className="inline-flex items-center gap-2 w-fit px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-semibold text-teal-300">
              <span className="w-1.5 h-1.5 rounded-full bg-teal-500" />
              One platform for every department
            </motion.div>

            <motion.h1 {...rise(0.12)} className="mt-5 text-4xl xl:text-[3.25rem] font-extrabold tracking-tight leading-[1.08] text-white">
              Care, diagnostics and billing,{" "}
              <span className="bg-gradient-to-r from-teal-300 via-teal-400 to-sky-400 bg-clip-text text-transparent">
                beautifully connected.
              </span>
            </motion.h1>

            <motion.p {...rise(0.2)} className="mt-5 max-w-xl text-lg text-slate-400 leading-relaxed">
              From front desk to ward, laboratory, pharmacy and cashier, every team works from a single patient record.
            </motion.p>

            <motion.div {...rise(0.28)} className="mt-7 flex flex-wrap gap-2.5">
              {features.map((f) => {
                const FIcon = f.icon;
                return (
                  <span key={f.label} className="inline-flex items-center gap-2 px-3.5 py-2 rounded-full bg-white/5 border border-white/10 text-sm font-medium text-slate-200 backdrop-blur">
                    <FIcon className="w-4 h-4 text-teal-400" />
                    {f.label}
                  </span>
                );
              })}
            </motion.div>

            {/* Illustrative product preview */}
            <motion.div {...rise(0.36)} className="relative mt-10 max-w-[560px] [@media(max-height:820px)]:hidden">
              <div className="rounded-2xl bg-slate-900/70 border border-white/10 shadow-[0_30px_60px_-25px_rgba(0,0,0,0.6)] backdrop-blur p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Today</div>
                    <div className="text-base font-bold text-white">Outpatient overview</div>
                  </div>
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-300 bg-emerald-500/10 border border-emerald-500/20 px-2 py-1 rounded-full">
                    <TrendingUp className="w-3 h-3" /> Live
                  </span>
                </div>

                <div className="mt-4 grid grid-cols-3 gap-3">
                  {[
                    { k: "Visits", v: "128" },
                    { k: "Avg. wait", v: "14 min" },
                    { k: "Results ready", v: "36" },
                  ].map((s) => (
                    <div key={s.k} className="rounded-xl bg-white/5 border border-white/10 p-3">
                      <div className="text-[11px] font-medium text-slate-400">{s.k}</div>
                      <div className="mt-0.5 text-xl font-bold tracking-tight text-white">{s.v}</div>
                    </div>
                  ))}
                </div>

                <div className="mt-4 flex items-end gap-2 h-20 px-1">
                  {bars.map((h, i) => (
                    <motion.div
                      key={i}
                      initial={reduce ? false : { height: 0 }}
                      animate={{ height: `${h}%` }}
                      transition={{ duration: 0.8, delay: 0.7 + i * 0.07, ease: [0.16, 1, 0.3, 1] }}
                      className="flex-1 rounded-md bg-gradient-to-t from-teal-600 to-teal-400/80"
                    />
                  ))}
                </div>
              </div>

              <motion.div
                {...float(5, 7)}
                className="hidden xl:block absolute -right-6 -bottom-10 w-56 rounded-xl bg-slate-800 border border-white/10 shadow-xl shadow-black/40 p-3"
              >
                <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-400 mb-2">
                  <CalendarCheck className="w-3.5 h-3.5 text-teal-400" /> Patient queue
                </div>
                <ul className="space-y-2">
                  {queue.map((q) => (
                    <li key={q.initials} className="flex items-center gap-2.5">
                      <span className={`w-7 h-7 rounded-full text-[10px] font-bold flex items-center justify-center ${q.tone}`}>{q.initials}</span>
                      <span className="text-xs font-medium text-slate-200 flex-1 truncate">{q.status}</span>
                      <span className={`w-2 h-2 rounded-full ${q.dot}`} />
                    </li>
                  ))}
                </ul>
              </motion.div>

              <motion.div
                {...float(6, 6)}
                className="hidden xl:flex absolute -left-6 -bottom-6 items-center gap-2.5 rounded-xl bg-slate-800 border border-white/10 shadow-xl shadow-black/40 px-3.5 py-2.5"
              >
                <span className="w-8 h-8 rounded-lg bg-emerald-500/15 text-emerald-300 flex items-center justify-center">
                  <ShieldCheck className="w-4 h-4" />
                </span>
                <div className="leading-tight">
                  <div className="text-xs font-bold text-white">Every action audited</div>
                  <div className="text-[11px] text-slate-400">Role-based access</div>
                </div>
              </motion.div>
            </motion.div>
          </section>

          {/* Sign-in */}
          <section className="w-full lg:w-[44%] flex justify-center lg:justify-end lg:py-2">
            <div className="w-full max-w-[440px]">
              {/* Compact intro for phones and tablets (the full showcase is desktop-only) */}
              <div className="lg:hidden text-center mb-6">
                <h1 className="text-[28px] sm:text-3xl font-extrabold tracking-tight leading-tight text-white">
                  Care, diagnostics and billing,{" "}
                  <span className="bg-gradient-to-r from-teal-300 to-sky-400 bg-clip-text text-transparent">connected.</span>
                </h1>
                <p className="mt-2 text-sm text-slate-400">One patient record for every department.</p>
              </div>
              <div className="rounded-3xl bg-slate-900/70 backdrop-blur-xl border border-white/10 shadow-[0_1px_0_rgba(255,255,255,0.06)_inset,0_40px_80px_-30px_rgba(0,0,0,0.7)] p-5 min-[400px]:p-7 sm:p-9 [@media(max-height:820px)]:sm:p-6">
                <h2 className="text-[26px] font-bold tracking-tight text-white">Welcome back</h2>
                <p className="mt-1.5 text-sm text-slate-400">Sign in with your hospital staff account.</p>

                {hostResolved && currentTenant?.name && (
                  <div className="mt-5 flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl bg-teal-500/10 border border-teal-500/20">
                    <Globe className="w-4 h-4 text-teal-400 shrink-0" />
                    <div className="min-w-0 leading-tight">
                      <div className="text-sm font-semibold text-teal-100 truncate">{currentTenant.name}</div>
                      {currentTenant.country && <div className="text-[11px] text-teal-200/70">{currentTenant.country}</div>}
                    </div>
                  </div>
                )}

                {errorMessage && (
                  <div role="alert" className="mt-5 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-200 text-sm flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                    <span className="leading-relaxed">{errorMessage}</span>
                  </div>
                )}

                <form onSubmit={handleLogin} className="mt-6 space-y-4 [@media(max-height:820px)]:lg:mt-4 [@media(max-height:820px)]:lg:space-y-3">
                  {!hostResolved && (
                    <div>
                      <label htmlFor="login-hospital" className="text-[13px] font-semibold text-slate-200 block mb-1.5">
                        Hospital code <span className="font-normal text-slate-400">(optional)</span>
                      </label>
                      <div className="relative">
                        <input
                          id="login-hospital"
                          name="hospital"
                          type="text"
                          value={hospitalCode}
                          onChange={(e) => setHospitalCode(e.target.value.toLowerCase().replace(/[^a-z0-9]/g, ""))}
                          maxLength={24}
                          autoComplete="off"
                          autoCapitalize="none"
                          spellCheck={false}
                          placeholder="Leave blank for IST Central"
                          className={inputClass}
                        />
                        <Building2 className={iconClass} />
                      </div>
                    </div>
                  )}

                  <div>
                    <label htmlFor="login-username" className="text-[13px] font-semibold text-slate-200 block mb-1.5">
                      Username
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
                        className={inputClass}
                      />
                      <User className={iconClass} />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label htmlFor="login-password" className="text-[13px] font-semibold text-slate-200">
                        Password
                      </label>
                      <button
                        type="button"
                        onClick={() => setShowForgotModal(true)}
                        className="text-[13px] font-semibold text-teal-400 hover:text-teal-200 transition-colors cursor-pointer"
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
                        placeholder="Enter your password"
                        required
                        autoComplete="current-password"
                        className={`${inputClass} pr-11`}
                      />
                      <KeyRound className={iconClass} />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-[13px] text-slate-400 hover:text-slate-200 p-0.5 cursor-pointer"
                        aria-label={showPassword ? "Hide password" : "Show password"}
                      >
                        {showPassword ? <EyeOff className="w-[18px] h-[18px]" /> : <Eye className="w-[18px] h-[18px]" />}
                      </button>
                    </div>
                  </div>

                  <motion.button
                    whileHover={reduce ? undefined : { y: -1 }}
                    whileTap={reduce ? undefined : { scale: 0.985 }}
                    type="submit"
                    disabled={isLoading}
                    className="w-full h-12 mt-2 rounded-xl bg-gradient-to-b from-teal-600 to-teal-800 text-white font-semibold text-[15px] shadow-lg shadow-teal-700/30 ring-1 ring-inset ring-white/15 hover:from-teal-500 hover:to-teal-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer focus:outline-none focus:ring-4 focus:ring-teal-600/25"
                  >
                    {isLoading ? (
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        <span>Sign in</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </motion.button>
                </form>

                {/* Demo stations: non-production builds only (see DEMO_STATIONS above) */}
                {DEMO_STATIONS.length > 0 && (
                  <div className="mt-6 pt-5 [@media(max-height:820px)]:lg:hidden border-t border-white/10">
                    <div className="flex items-center justify-between mb-2.5">
                      <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Demo stations</span>
                      <span className="text-[11px] text-slate-400">Click to fill</span>
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
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-colors cursor-pointer truncate ${
                              isCurrent
                                ? "bg-teal-500/15 text-teal-200 border-teal-400/40"
                                : "bg-white/5 text-slate-300 border-white/10 hover:border-white/20 hover:bg-white/10"
                            }`}
                          >
                            <SIcon className="w-3.5 h-3.5 shrink-0" />
                            <span className="truncate">{s.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              <p className="mt-5 flex items-center justify-center gap-1.5 text-xs text-slate-400 text-center">
                <Lock className="w-3.5 h-3.5 text-teal-400 shrink-0" />
                Your session is encrypted and all access is logged.
              </p>
            </div>
          </section>
        </main>

        <footer className="w-full max-w-7xl mx-auto px-5 sm:px-8 lg:px-10 pb-6 text-xs text-slate-400 flex flex-col sm:flex-row items-center justify-between gap-1">
          <span>© {new Date().getFullYear()} IST Health · Irisstar Technologies</span>
          <span>Encrypted sessions · Role-based access · Audit logged</span>
        </footer>
      </div>

      {showForgotModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div
            initial={reduce ? false : { opacity: 0, scale: 0.96, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className="bg-slate-900 border border-white/10 rounded-2xl p-6 max-w-sm w-full shadow-2xl"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2 text-white font-bold text-base">
                <HelpCircle className="w-5 h-5 text-teal-400" />
                <span>Password recovery</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowForgotModal(false);
                  setForgotStatus(null);
                }}
                aria-label="Close"
                className="text-slate-400 hover:text-slate-200 p-1 rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-sm text-slate-400 mb-4 leading-relaxed">
              Enter your username or registered hospital email and we will send recovery instructions.
            </p>

            {forgotStatus && (
              <div className="mb-3 p-3 rounded-lg bg-teal-500/10 border border-teal-500/30 text-teal-100 text-sm">{forgotStatus}</div>
            )}

            <form onSubmit={handleForgotPassword} className="space-y-3">
              <input
                type="text"
                value={forgotIdentity}
                onChange={(e) => setForgotIdentity(e.target.value)}
                placeholder="Staff username or email"
                required
                className="w-full h-11 px-3 text-sm bg-slate-950/60 border border-white/10 rounded-xl focus:outline-none focus:border-teal-400 focus:ring-4 focus:ring-teal-400/15 text-white placeholder:text-slate-400"
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowForgotModal(false)}
                  className="flex-1 h-10 rounded-xl bg-white/10 hover:bg-white/15 text-slate-200 text-sm font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={forgotLoading}
                  className="flex-1 h-10 rounded-xl bg-teal-700 hover:bg-teal-800 text-white text-sm font-semibold disabled:opacity-60 cursor-pointer"
                >
                  {forgotLoading ? "Sending..." : "Send reset link"}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}
