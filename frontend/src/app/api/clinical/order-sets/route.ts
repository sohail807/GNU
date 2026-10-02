import { NextRequest, NextResponse } from "next/server";
import { errorResponse, fail, guard, idOf, positiveId, rpc, text, Row } from "@/lib/ops-api";

// Order sets: a doctor saves a group of laboratory tests, imaging studies and medicines under a name (for example
// "Admission work-up") and applies the whole group in one step. Tests are ordered at once; medicines only fill the
// prescription draft, so the doctor reviews them before anything is issued. Sets are private to the doctor unless shared.
// Records are native Tryton ist.ops.order_set rows.

const M = "ist.ops.order_set";
type Item = { kind: "lab" | "imaging"; id: number; name: string }
  | { kind: "medicine"; id: number; name: string; dose: string; doseUnitId: number; doseUnit: string; routeId: number; route: string; frequency: string; frequencyUnit: string; duration: string; durationPeriod: string };
const FREQ_UNITS = ["seconds", "minutes", "hours", "days", "weeks", "months", "years"];
const DURATION_UNITS = ["minutes", "hours", "days", "months", "years", "indefinite"];

export async function GET() {
  const g = await guard(["physician"]);
  if ("response" in g) return g.response;
  const { session } = g;
  try {
    const rows = await rpc<Row[]>(session, M, "search_read", [[["company", "=", session.companyId], ["OR", ["shared", "=", true], ["owner", "=", session.userId]]], 0, 200, [["name", "ASC"]],
      ["id", "name", "owner", "shared", "items"]]);
    return NextResponse.json({
      success: true,
      sets: rows.map((r) => {
        let items: Item[] = [];
        try { items = JSON.parse(r.items || "[]"); } catch { items = []; }
        return { id: r.id, name: r.name, shared: !!r.shared, mine: idOf(r.owner) === session.userId, items };
      }),
    });
  } catch (err) {
    return errorResponse(err, "Failed to load order sets");
  }
}

export async function POST(req: NextRequest) {
  const g = await guard(["physician"]);
  if ("response" in g) return g.response;
  const { session } = g;
  try {
    const body = await req.json();
    const action = String(body.action || "create");
    if (action === "delete") {
      const id = positiveId(body.id);
      if (!id) return fail("Order set is required.");
      const row = (await rpc<Row[]>(session, M, "search_read", [[["id", "=", id], ["company", "=", session.companyId]], 0, 1, null, ["id", "owner"]]))[0];
      if (!row) return fail("Order set not found.", 404);
      if (idOf(row.owner) !== session.userId && session.role !== "admin") return fail("Only the doctor who created an order set can delete it.", 403);
      await rpc(session, M, "delete", [[id]]);
      return NextResponse.json({ success: true, message: "Order set deleted." });
    }
    const name = text(body.name, 80);
    if (!name) return fail("Give the order set a name.");
    const raw: unknown[] = Array.isArray(body.items) ? body.items : [];
    const items: Item[] = [];
    for (const it of raw as Array<Record<string, unknown>>) {
      const id = positiveId(it?.id);
      if (!id || typeof it.name !== "string") return fail("The order set contains an invalid item.");
      if (it.kind === "medicine") {
        const dose = Number(it.dose), doseUnitId = positiveId(it.doseUnitId), routeId = positiveId(it.routeId);
        const frequency = Number(it.frequency), duration = Number(it.duration);
        if (!(dose > 0) || !doseUnitId || !routeId || !Number.isSafeInteger(frequency) || frequency <= 0 || !Number.isSafeInteger(duration) || duration <= 0
          || !FREQ_UNITS.includes(String(it.frequencyUnit)) || !DURATION_UNITS.includes(String(it.durationPeriod))) {
          return fail(`The medicine "${it.name.slice(0, 60)}" needs a dose, unit, route, frequency and duration.`);
        }
        if (!items.some((x) => x.kind === "medicine" && x.id === id)) {
          items.push({ kind: "medicine", id, name: it.name.slice(0, 120), dose: String(dose), doseUnitId, doseUnit: String(it.doseUnit || "").slice(0, 40), routeId, route: String(it.route || "").slice(0, 40),
            frequency: String(frequency), frequencyUnit: String(it.frequencyUnit), duration: String(duration), durationPeriod: String(it.durationPeriod) });
        }
        continue;
      }
      if (it.kind !== "lab" && it.kind !== "imaging") return fail("The order set contains an invalid item.");
      if (!items.some((x) => x.kind === it.kind && x.id === id)) items.push({ kind: it.kind, id, name: it.name.slice(0, 120) });
    }
    if (items.length === 0 || items.length > 40) return fail("Choose between 1 and 40 items for the order set.");
    const dup = await rpc<number[]>(session, M, "search", [[["company", "=", session.companyId], ["owner", "=", session.userId], ["name", "=", name]]]);
    if (dup.length) return fail("You already have an order set with that name.", 409);
    const created = await rpc<number[]>(session, M, "create", [[{ name, company: session.companyId, owner: session.userId, shared: !!body.shared, items: JSON.stringify(items) }]]);
    return NextResponse.json({ success: true, setId: created[0], message: `Order set "${name}" saved.` });
  } catch (err) {
    return errorResponse(err, "Order set transaction failed");
  }
}
