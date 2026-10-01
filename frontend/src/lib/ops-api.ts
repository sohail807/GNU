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
  // Tryton's own refusal (invalid state change, missing prerequisite) arrives inside a long RPC error: show just the reason.
  const reason = /(A [a-z -]+ cannot go from[^"\]\\]*|The advance of[^"\]\\]*|A cashless admission[^"\]\\]*|A referral must[^"\]\\]*|Stock of[^"\]\\]*)/.exec(raw)?.[0];
  return NextResponse.json({ error: reason || raw.slice(0, 300) }, { status: reason ? 409 : status });
}

/**
 * Take the medicines of a prescription out of pharmacy stock, earliest expiry first. Medicines the hospital does not
 * track in stock are dispensed as before; for tracked ones a shortage refuses the dispense. Returns the reason to
 * refuse, or null when it went through (or stock tracking is not installed).
 */
export async function consumeStock(session: Session, prescriptionId: number): Promise<string | null> {
  try {
    const lines = await rpc<Row[]>(session, "gnuhealth.prescription.line", "search_read", [[["name", "=", prescriptionId]], 0, 50, null, ["id", "medicament", "quantity"]]);
    const needs = new Map<number, number>();
    for (const l of lines) {
      const med = idOf(l.medicament);
      if (med) needs.set(med, (needs.get(med) || 0) + (Number(l.quantity) > 0 ? Number(l.quantity) : 1));
    }
    if (needs.size === 0) return null;
    const today = new Date().toISOString().slice(0, 10);
    const plan: Array<{ id: number; take: number }> = [];
    for (const [med, qty] of needs) {
      const batches = await rpc<Row[]>(session, "ist.ops.stock", "search_read", [[["medicament", "=", med], ["company", "=", session.companyId], ["quantity", ">", 0]], 0, 100,
        [["expiry", "ASC"]], ["id", "quantity", "expiry"]]);
      const tracked = batches.length > 0 || (await rpc<number>(session, "ist.ops.stock", "search_count", [[["medicament", "=", med], ["company", "=", session.companyId]]])) > 0;
      if (!tracked) continue;
      let left = qty;
      for (const b of batches) {
        const exp = day(b.expiry);
        if (exp && exp < today) continue; // never dispense an expired batch
        const take = Math.min(left, b.quantity);
        if (take > 0) { plan.push({ id: b.id, take }); left -= take; }
        if (left <= 0) break;
      }
      if (left > 0) {
        const m = (await rpc<Row[]>(session, "gnuhealth.medicament", "read", [[med], ["active_component"]]))[0];
        return `Not enough stock of ${m?.active_component || "this medicine"}: ${qty - left} in date, ${qty} needed.`;
      }
    }
    for (const p of plan) {
      const cur = (await rpc<Row[]>(session, "ist.ops.stock", "read", [[p.id], ["quantity"]]))[0];
      await rpc(session, "ist.ops.stock", "write", [[p.id], { quantity: Math.max(0, (cur?.quantity || 0) - p.take) }]);
    }
    return null;
  } catch {
    return null;
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
