import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth-session";
import { TrytonClient } from "@/lib/tryton-client";
import { AppModule, hasModuleAccess } from "@/lib/access-control";

// Shared helpers for the hospital-operations routes (emergency, admissions, discharge, referrals, pharmacy stock).
// The records live in the native Tryton module `ist_ops`; every read is pinned to the active hospital's company.

export type Session = NonNullable<Awaited<ReturnType<typeof getSession>>>;
export type Row = Record<string, any>;

export const idOf = (v: unknown): number | null => (typeof v === "number" ? v : Array.isArray(v) && typeof v[0] === "number" ? v[0] : null);
export const num = (v: unknown): number => Number(v && typeof v === "object" && "decimal" in (v as Row) ? (v as Row).decimal : v) || 0;
export const money = (n: number) => ({ __class__: "Decimal", decimal: n.toFixed(2) });
export const day = (v: any): string | null => (v && typeof v === "object" && v.year ? `${v.year}-${String(v.month).padStart(2, "0")}-${String(v.day).padStart(2, "0")}` : null);
export const stamp = (v: any): string | null =>
  v && typeof v === "object" && v.year ? new Date(Date.UTC(v.year, v.month - 1, v.day, v.hour || 0, v.minute || 0, v.second || 0)).toISOString() : null;
export const dateValue = (iso: string) => {
  const [y, m, d] = iso.split("-").map(Number);
  return { __class__: "date", year: y, month: m, day: d };
};
export const text = (v: unknown, max = 500) => (typeof v === "string" && v.trim() ? v.trim().slice(0, max) : undefined);
export const positiveId = (v: unknown) => (Number.isSafeInteger(Number(v)) && Number(v) > 0 ? Number(v) : null);
export const fail = (message: string, status = 400) => NextResponse.json({ error: message }, { status });

export function rpc<T>(session: Session, model: string, method: string, params: unknown[]) {
  return TrytonClient.execute<T>(
    session.username, session.userId, session.sessionToken, model, method, params,
    { company: session.companyId }, session.database
  );
}

export async function names(session: Session, model: string, ids: number[], field = "name") {
  const out: Record<number, Row> = {};
  if (ids.length === 0) return out;
  const rows = await rpc<Row[]>(session, model, "search_read", [[["id", "in", ids]], 0, ids.length, null, ["id", field]]).catch(() => []);
  for (const r of rows) out[r.id] = r;
  return out;
}

/** id -> { name, puid } for a set of patient ids. */
export async function patientInfo(session: Session, ids: number[]) {
  const out: Record<number, { name: string; puid: string | null }> = {};
  if (ids.length === 0) return out;
  const pts = await rpc<Row[]>(session, "gnuhealth.patient", "search_read", [[["id", "in", ids]], 0, ids.length, null, ["id", "puid", "party"]]).catch(() => []);
  const parties = await names(session, "party.party", pts.map((p) => idOf(p.party)).filter((x): x is number => !!x));
  for (const p of pts) out[p.id] = { name: parties[idOf(p.party) as number]?.name || "", puid: p.puid || null };
  return out;
}

/** Recent patients for the pick-lists (latest first). */
export async function recentPatients(session: Session, limit = 200) {
  const pts = await rpc<Row[]>(session, "gnuhealth.patient", "search_read", [[], 0, limit, [["id", "DESC"]], ["id", "puid", "party"]]).catch(() => []);
  const parties = await names(session, "party.party", pts.map((p) => idOf(p.party)).filter((x): x is number => !!x));
  return pts.map((p) => ({ id: p.id as number, puid: (p.puid as string) || null, name: parties[idOf(p.party) as number]?.name || "" }));
}

/** Staff of the signed-in role may use a route when they hold any of the listed modules. */
export async function guard(modules: AppModule[]): Promise<{ session: Session } | { response: NextResponse }> {
  const session = await getSession();
  if (!session) return { response: fail("Unauthorized session", 401) };
  if (!modules.some((m) => hasModuleAccess(session.role, m))) {
    return { response: fail("Your role does not have permission for this module.", 403) };
  }
  return { session };
}

export function errorResponse(err: unknown, fallback: string) {
  const status = (err as { status?: number })?.status || 500;
  const raw = err instanceof Error ? err.message : fallback;
  if (/not associated to a health professional/i.test(raw)) {
    return NextResponse.json({ error: "Only a doctor or nurse registered as a health professional can do this. Sign in with a clinical account." }, { status: 403 });
  }
  if (/Tryton RPC error on ist\.[a-z_.]+\.[a-z_]+: \["'ist\./.test(raw)) {
    return NextResponse.json({ error: "This feature is not enabled for this hospital yet. Ask the administrator to install the IST workflow modules." }, { status: 503 });
  }
  // Tryton's own refusal (invalid state change, missing prerequisite) arrives inside a long RPC error: show just the reason.
  const reason = /(A [a-z -]+ cannot go from[^"\]\\]*|The advance of[^"\]\\]*|A cashless admission[^"\]\\]*|A referral must[^"\]\\]*|Stock of[^"\]\\]*|Record the action taken[^"\]\\]*|The quantity to order[^"\]\\]*|Complete [a-z ]+ before [a-z ]+\.|Apgar scores[^"\]\\]*|Birth weight must[^"\]\\]*)/.exec(raw)?.[0];
  return NextResponse.json({ error: reason || raw.slice(0, 300) }, { status: reason ? 409 : status });
}

/**
 * Raise a result alert for every analyte of a laboratory result that is outside its verified reference range. An
 * analyte more than 30% beyond a limit is "critical", otherwise "abnormal". One alert per analyte; re-running is safe.
 * Returns how many alerts were raised (0 also when the alert module is not installed).
 */
export async function raiseLabAlerts(session: Session, labId: number): Promise<number> {
  try {
    const lab = (await rpc<Row[]>(session, "gnuhealth.lab", "read", [[labId], ["id", "patient", "critearea"]]))[0];
    const ids: number[] = Array.isArray(lab?.critearea) ? lab.critearea.map(Number) : [];
    const patientId = idOf(lab?.patient);
    if (!ids.length || !patientId) return 0;
    const criteria = await rpc<Row[]>(session, "gnuhealth.lab.test.critearea", "search_read", [[["id", "in", ids], ["warning", "=", true]], 0, ids.length, null,
      ["id", "name", "result", "lower_limit", "upper_limit", "units", "excluded"]]);
    const existing = await rpc<Row[]>(session, "ist.ops.critical_alert", "search_read", [[["lab", "=", labId]], 0, 100, null, ["id", "criterion"]]);
    const done = new Set(existing.map((e) => Number(e.criterion)));
    let raised = 0;
    for (const c of criteria) {
      if (c.excluded || c.result == null || done.has(c.id)) continue;
      const v = Number(c.result), lo = c.lower_limit == null ? null : Number(c.lower_limit), hi = c.upper_limit == null ? null : Number(c.upper_limit);
      const critical = (lo != null && v < lo - Math.abs(lo) * 0.3) || (hi != null && v > hi + Math.abs(hi) * 0.3);
      const unit = Array.isArray(c.units) ? c.units[1] : "";
      await rpc(session, "ist.ops.critical_alert", "create", [[{
        lab: labId, criterion: c.id, patient: patientId, company: session.companyId, institution: session.institutionId || undefined,
        analyte: String(c.name || "Analyte").slice(0, 80), value: `${v}${unit ? " " + unit : ""}`,
        limits: lo != null && hi != null ? `${lo} - ${hi}` : lo != null ? `above ${lo}` : hi != null ? `below ${hi}` : "", severity: critical ? "critical" : "abnormal",
      }]]);
      raised += 1;
    }
    return raised;
  } catch {
    return 0;
  }
}

/**
 * The theatre gate: a surgery may start only after "sign in" and "time out", and be closed only after "sign out"
 * (WHO surgical safety checklist). Returns the reason to refuse, or null to allow. Open if the module is not installed.
 */
export async function checklistBlock(session: Session, surgeryId: number, newState: string): Promise<string | null> {
  const needs = newState === "in_progress" ? ["sign_in", "time_out"] : ["done", "signed"].includes(newState) ? ["sign_in", "time_out", "sign_out"] : [];
  if (needs.length === 0) return null;
  try {
    const rows = await rpc<Row[]>(session, "ist.ops.surgery_checklist", "search_read", [[["surgery", "=", surgeryId]], 0, 1, [["id", "DESC"]],
      ["id", "sign_in_done", "time_out_done", "sign_out_done"]]);
    if (rows.length === 0) return "Complete the surgical safety checklist first (Theatre Safety).";
    const missing = needs.filter((p) => !rows[0][`${p}_done`]);
    return missing.length ? `The safety checklist is not finished: ${missing.map((m) => m.replace("_", " ")).join(", ")} still to do.` : null;
  } catch {
    return null;
  }
}

// Hours in each unit the prescription form offers. "wr" (when required) and "indefinite" cannot be counted.
const FREQUENCY_HOURS: Record<string, number> = { seconds: 1 / 3600, minutes: 1 / 60, hours: 1, days: 24, weeks: 168 };
const DURATION_HOURS: Record<string, number> = { minutes: 1 / 60, hours: 1, days: 24, months: 720, years: 8760 };

/** Doses in a course: one per interval over the whole duration (every 8 hours for 5 days = 15). Null when it cannot be counted. */
export function courseUnits(frequency: unknown, frequencyUnit: unknown, duration: unknown, durationPeriod: unknown): number | null {
  const every = Number(frequency) * (FREQUENCY_HOURS[String(frequencyUnit)] || 0);
  const course = Number(duration) * (DURATION_HOURS[String(durationPeriod)] || 0);
  if (!(every > 0) || !(course > 0)) return null;
  return Math.max(1, Math.ceil(course / every));
}

/**
 * Units to take out of stock for one prescription line: the quantity stored on the line (set when the doctor issues the
 * prescription), otherwise the course count, and a single unit when neither is known.
 */
function unitsToDispense(l: Row): number {
  if (Number(l.quantity) > 0) return Number(l.quantity);
  return courseUnits(l.frequency, l.frequency_unit, l.duration, l.duration_period) ?? 1;
}

/**
 * Take the medicines of a prescription out of pharmacy stock, earliest expiry first. Medicines the hospital does not
 * track in stock are dispensed as before; for tracked ones a shortage refuses the dispense. Returns the reason to
 * refuse, or null when it went through (or stock tracking is not installed).
 */
export async function consumeStock(session: Session, prescriptionId: number): Promise<{ refusal: string | null; summary: string }> {
  const taken: string[] = [];
  const untracked: string[] = [];
  try {
    const order = (await rpc<Row[]>(session, "gnuhealth.prescription.order", "read", [[prescriptionId], ["prescription_line"]]))[0];
    const lineIds: number[] = Array.isArray(order?.prescription_line) ? order.prescription_line : [];
    const lines = lineIds.length ? await rpc<Row[]>(session, "gnuhealth.prescription.line", "read", [lineIds, ["id", "medicament", "quantity", "frequency", "frequency_unit", "duration", "duration_period"]]) : [];
    const needs = new Map<number, number>();
    for (const l of lines) {
      const med = idOf(l.medicament);
      if (med) needs.set(med, (needs.get(med) || 0) + unitsToDispense(l));
    }
    if (needs.size === 0) return { refusal: null, summary: "No medicine lines were found on this prescription, so no stock was taken." };
    const today = new Date().toISOString().slice(0, 10);
    const plan: Array<{ id: number; take: number }> = [];
    for (const [med, qty] of needs) {
      const batches = await rpc<Row[]>(session, "ist.ops.stock", "search_read", [[["medicament", "=", med], ["company", "=", session.companyId], ["quantity", ">", 0]], 0, 100,
        [["expiry", "ASC"]], ["id", "quantity", "expiry"]]);
      const tracked = batches.length > 0 || (await rpc<number>(session, "ist.ops.stock", "search_count", [[["medicament", "=", med], ["company", "=", session.companyId]]])) > 0;
      const medName = async () => { const m = (await rpc<Row[]>(session, "gnuhealth.medicament", "read", [[med], ["rec_name", "active_component"]]))[0]; return m?.rec_name || m?.active_component || `medicine ${med}`; };
      if (!tracked) { untracked.push(await medName()); continue; }
      let left = qty;
      for (const b of batches) {
        const exp = day(b.expiry);
        if (exp && exp < today) continue; // never dispense an expired batch
        const take = Math.min(left, b.quantity);
        if (take > 0) { plan.push({ id: b.id, take }); left -= take; }
        if (left <= 0) break;
      }
      if (left > 0) {
        const m = (await rpc<Row[]>(session, "gnuhealth.medicament", "read", [[med], ["rec_name", "active_component"]]))[0];
        return { refusal: `Not enough stock of ${m?.rec_name || m?.active_component || "this medicine"}: ${qty - left} in date, ${qty} needed.`, summary: "" };
      }
      taken.push(`${await medName()} x${qty}`);
    }
    for (const p of plan) {
      const cur = (await rpc<Row[]>(session, "ist.ops.stock", "read", [[p.id], ["quantity"]]))[0];
      await rpc(session, "ist.ops.stock", "write", [[p.id], { quantity: Math.max(0, (cur?.quantity || 0) - p.take) }]);
    }
    const parts = [taken.length ? `Stock taken: ${taken.join(", ")}.` : "", untracked.length ? `Not tracked in stock: ${untracked.join(", ")}.` : ""];
    return { refusal: null, summary: parts.filter(Boolean).join(" ") };
  } catch (err) {
    // Only "stock tracking is not installed" lets the dispense go ahead. Anything else (for instance a login without
    // access to pharmacy stock) used to be swallowed here, so medicines left the pharmacy without the stock going down.
    const raw = err instanceof Error ? err.message : "";
    if (/Tryton RPC error on ist\.[a-z_.]+\.[a-z_]+: \["'ist\./.test(raw)) return { refusal: null, summary: "" };
    return { refusal: "Pharmacy stock could not be updated, so nothing was dispensed. Dispense from a pharmacy or cashier account, or ask the administrator.", summary: "" };
  }
}

/**
 * The discharge gate: a patient may be discharged only when every department has signed off. Returns the reason to
 * refuse, or null to allow. If the clearance module is not installed in this hospital's database the gate is open.
 */
export async function dischargeBlock(session: Session, admissionId: number): Promise<string | null> {
  try {
    const rows = await rpc<Row[]>(session, "ist.ops.discharge", "search_read", [[["registration", "=", admissionId], ["state", "!=", "cancelled"]], 0, 1, [["id", "DESC"]],
      ["id", "state", "medical_state", "nursing_state", "pharmacy_state", "billing_state", "insurance_state"]]);
    if (rows.length === 0) return "Start the discharge clearance first: each department signs off before the patient leaves.";
    const r = rows[0];
    if (r.state === "complete") return null;
    const pending = ["medical", "nursing", "pharmacy", "billing", "insurance"].filter((k) => r[`${k}_state`] === "pending");
    return `Discharge clearance is incomplete. Still waiting for: ${pending.join(", ")}.`;
  } catch {
    return null;
  }
}
