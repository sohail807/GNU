import { NextResponse } from "next/server";
import { day, errorResponse, guard, idOf, names, num, rpc, stamp, Row } from "@/lib/ops-api";

// Management report for the active hospital: beds, outpatient load, revenue and collections, emergency, discharge,
// claims ageing, pharmacy stock, maternity. Everything is read live from the hospital's own records; a section whose
// source is not available (for example a module not installed) comes back null and the page leaves it out.

const section = async <T,>(fn: () => Promise<T>): Promise<T | null> => {
  try { return await fn(); } catch { return null; }
};

export async function GET() {
  const g = await guard(["ledger", "billing", "admin"]);
  if ("response" in g) return g.response;
  const { session } = g;
  try {
    const company = [["company", "=", session.companyId]];
    const today = new Date().toISOString().slice(0, 10);

    const beds = await section(async () => {
      const bedRows = await rpc<Row[]>(session, "gnuhealth.hospital.bed", "search_read", [[], 0, 500, null, ["id", "ward", "state"]]);
      const wards = await names(session, "gnuhealth.hospital.ward", [...new Set(bedRows.map((b) => idOf(b.ward)).filter((x): x is number => !!x))]);
      const by: Record<string, { ward: string; total: number; occupied: number }> = {};
      for (const b of bedRows) {
        const w = wards[idOf(b.ward) as number]?.name || "Ward";
        by[w] = by[w] || { ward: w, total: 0, occupied: 0 };
        by[w].total += 1;
        if (b.state === "occupied") by[w].occupied += 1;
      }
      const list = Object.values(by).sort((a, b) => b.total - a.total);
      const total = list.reduce((t, w) => t + w.total, 0), occupied = list.reduce((t, w) => t + w.occupied, 0);
      return { total, occupied, occupancy: total ? Math.round((occupied / total) * 1000) / 10 : 0, wards: list };
    });

    const outpatient = await section(async () => {
      const appts = await rpc<Row[]>(session, "gnuhealth.appointment", "search_read", [[], 0, 1000, [["id", "DESC"]], ["id", "state", "healthprof"]]);
      const states: Record<string, number> = {};
      for (const a of appts) states[a.state || "unknown"] = (states[a.state || "unknown"] || 0) + 1;
      const docIds = [...new Set(appts.map((a) => idOf(a.healthprof)).filter((x): x is number => !!x))];
      const docs = docIds.length ? await rpc<Row[]>(session, "gnuhealth.healthprofessional", "search_read", [[["id", "in", docIds]], 0, docIds.length, null, ["id", "main_specialty"]]) : [];
      const spec = await names(session, "gnuhealth.hp_specialty", docs.map((d) => idOf(d.main_specialty)).filter((x): x is number => !!x));
      const specOf: Record<number, string> = {};
      for (const d of docs) specOf[d.id] = spec[idOf(d.main_specialty) as number]?.name || "General";
      const bySpec: Record<string, number> = {};
      for (const a of appts) { const s = specOf[idOf(a.healthprof) as number] || "General"; bySpec[s] = (bySpec[s] || 0) + 1; }
      return { total: appts.length, states, bySpecialty: Object.entries(bySpec).map(([specialty, visits]) => ({ specialty, visits })).sort((a, b) => b.visits - a.visits).slice(0, 10) };
    });

    const revenue = await section(async () => {
      const invs = await rpc<Row[]>(session, "account.invoice", "search_read", [[["type", "=", "out"], ...company], 0, 5000, null, ["id", "state", "total_amount", "invoice_date", "amount_to_pay"]]);
      const co = (await rpc<Row[]>(session, "company.company", "read", [[session.companyId], ["currency.code"]]))[0] || {};
      const byDay: Record<string, number> = {};
      let billed = 0, outstanding = 0, collected = 0;
      for (const i of invs) {
        const total = num(i.total_amount);
        billed += total;
        if (i.state === "paid") collected += total;
        else if (i.state === "posted") outstanding += num(i.amount_to_pay ?? i.total_amount);
        const d = day(i.invoice_date) || today;
        byDay[d] = (byDay[d] || 0) + total;
      }
      return { currency: co["currency."]?.code || "", invoices: invs.length, billed: Math.round(billed), collected: Math.round(collected), outstanding: Math.round(outstanding),
        collectionRate: billed ? Math.round((collected / billed) * 100) : 0, byDay: Object.entries(byDay).sort().slice(-14).map(([date, amount]) => ({ date, amount: Math.round(amount) })) };
    });

    const emergency = await section(async () => {
      const v = await rpc<Row[]>(session, "ist.ops.ed_visit", "search_read", [[...company], 0, 1000, null, ["id", "state", "triage_level", "arrived_at", "seen_at"]]);
      const seen = v.filter((x) => x.seen_at && x.arrived_at).map((x) => (new Date(stamp(x.seen_at)!).getTime() - new Date(stamp(x.arrived_at)!).getTime()) / 60000);
      const levels: Record<string, number> = {};
      for (const x of v) if (x.triage_level) levels[x.triage_level] = (levels[x.triage_level] || 0) + 1;
      const closed = v.filter((x) => ["admitted", "discharged", "transferred", "left"].includes(x.state));
      return { visits: v.length, avgDoorToDoctorMin: seen.length ? Math.round(seen.reduce((a, b) => a + b, 0) / seen.length) : null,
        admissionRate: closed.length ? Math.round((v.filter((x) => x.state === "admitted").length / closed.length) * 100) : 0,
        leftUnseen: v.filter((x) => x.state === "left").length, levels };
    });

    const discharge = await section(async () => {
      const d = await rpc<Row[]>(session, "ist.ops.discharge", "search_read", [[...company], 0, 1000, null, ["id", "state", "started_at", "completed_at"]]);
      const done = d.filter((x) => x.state === "complete" && x.completed_at && x.started_at).map((x) => (new Date(stamp(x.completed_at)!).getTime() - new Date(stamp(x.started_at)!).getTime()) / 36e5);
      return { total: d.length, open: d.filter((x) => x.state === "open").length, avgHours: done.length ? Math.round((done.reduce((a, b) => a + b, 0) / done.length) * 10) / 10 : null,
        within6h: done.length ? Math.round((done.filter((h) => h <= 6).length / done.length) * 100) : null };
    });

    const claims = await section(async () => {
      const c = await rpc<Row[]>(session, "ist.claims.claim", "search_read", [[...company], 0, 2000, null, ["id", "state", "claimed_amount", "approved_amount", "settled_amount", "submitted_on", "due_on", "insurer"]]);
      const open = c.filter((x) => ["submitted", "queried", "approved", "partially_paid"].includes(x.state));
      const buckets = { "0-30 days": 0, "31-45 days": 0, "Over 45 days": 0 };
      let owed = 0;
      for (const x of open) {
        const out = Math.max(0, (x.approved_amount == null ? num(x.claimed_amount) : num(x.approved_amount)) - num(x.settled_amount));
        owed += out;
        const sub = day(x.submitted_on);
        const age = sub ? Math.floor((Date.now() - new Date(sub).getTime()) / 864e5) : 0;
        buckets[age <= 30 ? "0-30 days" : age <= 45 ? "31-45 days" : "Over 45 days"] += out;
      }
      const ins = await names(session, "party.party", [...new Set(open.map((x) => idOf(x.insurer)).filter((x): x is number => !!x))]);
      const byInsurer: Record<string, number> = {};
      for (const x of open) { const n = ins[idOf(x.insurer) as number]?.name || "Insurer"; byInsurer[n] = (byInsurer[n] || 0) + Math.max(0, (x.approved_amount == null ? num(x.claimed_amount) : num(x.approved_amount)) - num(x.settled_amount)); }
      const decided = c.filter((x) => ["approved", "partially_paid", "paid", "rejected"].includes(x.state));
      return { total: c.length, open: open.length, owed: Math.round(owed), ageing: Object.entries(buckets).map(([bucket, amount]) => ({ bucket, amount: Math.round(amount) })),
        byInsurer: Object.entries(byInsurer).map(([insurer, amount]) => ({ insurer, amount: Math.round(amount) })).sort((a, b) => b.amount - a.amount).slice(0, 6),
        rejectionRate: decided.length ? Math.round((c.filter((x) => x.state === "rejected").length / decided.length) * 100) : 0 };
    });

    const stock = await section(async () => {
      const s = await rpc<Row[]>(session, "ist.ops.stock", "search_read", [[...company], 0, 2000, null, ["id", "medicament", "quantity", "reorder_level", "expiry"]]);
      const soon = new Date(Date.now() + 90 * 864e5).toISOString().slice(0, 10);
      const qty: Record<number, { q: number; r: number }> = {};
      for (const x of s) {
        const m = idOf(x.medicament) as number;
        qty[m] = qty[m] || { q: 0, r: 0 };
        if (!day(x.expiry) || day(x.expiry)! >= today) qty[m].q += x.quantity;
        qty[m].r = Math.max(qty[m].r, x.reorder_level);
      }
      return { medicines: Object.keys(qty).length, low: Object.values(qty).filter((v) => v.q <= v.r).length, expiringSoon: s.filter((x) => day(x.expiry) && day(x.expiry)! >= today && day(x.expiry)! <= soon).length,
        expired: s.filter((x) => day(x.expiry) && day(x.expiry)! < today).length };
    });

    const maternity = await section(async () => {
      const d = await rpc<Row[]>(session, "ist.ops.delivery", "search_read", [[...company], 0, 1000, null, ["id", "delivery_type", "outcome", "birth_weight_g", "nicu"]]);
      return { deliveries: d.length, caesareanRate: d.length ? Math.round((d.filter((x) => x.delivery_type === "caesarean").length / d.length) * 100) : 0,
        lowBirthWeight: d.filter((x) => x.birth_weight_g != null && x.birth_weight_g < 2500).length, nicu: d.filter((x) => x.nicu).length, stillbirths: d.filter((x) => x.outcome === "stillbirth").length };
    });

    return NextResponse.json({ success: true, hospital: session.hospitalName || null, beds, outpatient, revenue, emergency, discharge, claims, stock, maternity });
  } catch (err) {
    return errorResponse(err, "Failed to build the report");
  }
}
