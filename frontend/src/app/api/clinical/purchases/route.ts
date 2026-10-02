import { NextRequest, NextResponse } from "next/server";
import { dateValue, errorResponse, fail, guard, idOf, positiveId, rpc, stamp, text, Row } from "@/lib/ops-api";

// Pharmacy purchase requests: raised when a medicine falls to its reorder level (or by hand), ordered from the
// supplier, and received into stock as a new batch. Records are native Tryton ist.ops.purchase_request rows; receiving
// creates the ist.ops.stock batch in the same step.

const M = "ist.ops.purchase_request";

export async function GET() {
  const g = await guard(["pharmacy"]);
  if ("response" in g) return g.response;
  const { session } = g;
  try {
    const rows = await rpc<Row[]>(session, M, "search_read", [[["company", "=", session.companyId]], 0, 300, [["id", "DESC"]],
      ["id", "reference", "medicament", "quantity", "supplier", "reason", "state", "requested_at", "ordered_at", "received_at", "note"]]);
    const meds = await rpc<Row[]>(session, "gnuhealth.medicament", "search_read", [[], 0, 300, [["active_component", "ASC"]], ["id", "active_component", "presentation"]]).catch(() => []);
    const medName = Object.fromEntries(meds.map((m) => [m.id, `${m.active_component || `Medicine ${m.id}`}${m.presentation ? ` (${m.presentation})` : ""}`]));
    const requests = rows.map((r) => ({
      id: r.id, reference: r.reference, medicineId: idOf(r.medicament), medicine: medName[idOf(r.medicament) as number] || "", quantity: r.quantity, supplier: r.supplier || null,
      reason: r.reason, state: r.state, requestedAt: stamp(r.requested_at), orderedAt: stamp(r.ordered_at), receivedAt: stamp(r.received_at), note: r.note || null,
    }));
    // medicines at or below the reorder level that have no open request yet
    const stock = await rpc<Row[]>(session, "ist.ops.stock", "search_read", [[["company", "=", session.companyId]], 0, 2000, null, ["medicament", "quantity", "reorder_level", "expiry"]]).catch(() => []);
    const today = new Date().toISOString().slice(0, 10);
    const tot: Record<number, { q: number; r: number }> = {};
    for (const s of stock) {
      const m = idOf(s.medicament) as number;
      tot[m] = tot[m] || { q: 0, r: 0 };
      const exp = s.expiry && s.expiry.year ? `${s.expiry.year}-${String(s.expiry.month).padStart(2, "0")}-${String(s.expiry.day).padStart(2, "0")}` : "";
      if (!exp || exp >= today) tot[m].q += s.quantity;
      tot[m].r = Math.max(tot[m].r, s.reorder_level);
    }
    const openFor = new Set(requests.filter((r) => ["requested", "ordered"].includes(r.state)).map((r) => r.medicineId));
    const suggestions = Object.entries(tot).filter(([m, v]) => v.q <= v.r && !openFor.has(Number(m)))
      .map(([m, v]) => ({ medicineId: Number(m), medicine: medName[Number(m)] || `Medicine ${m}`, onHand: v.q, reorderLevel: v.r, suggested: Math.max(v.r * 3 - v.q, v.r) }));
    return NextResponse.json({ success: true, requests, suggestions, medicines: meds.map((m) => ({ id: m.id as number, label: medName[m.id] })),
      summary: { requested: requests.filter((r) => r.state === "requested").length, ordered: requests.filter((r) => r.state === "ordered").length, suggestions: suggestions.length } });
  } catch (err) {
    return errorResponse(err, "Failed to load purchase requests");
  }
}

export async function POST(req: NextRequest) {
  const g = await guard(["pharmacy"]);
  if ("response" in g) return g.response;
  const { session } = g;
  try {
    const body = await req.json();
    const action = String(body.action || "");
    if (action === "create") {
      const medicineId = positiveId(body.medicineId), qty = Math.round(Number(body.quantity));
      if (!medicineId || !(qty > 0)) return fail("Choose the medicine and the quantity to order.");
      const reason = ["low_stock", "expiring", "new"].includes(body.reason) ? body.reason : "low_stock";
      const created = await rpc<number[]>(session, M, "create", [[{
        medicament: medicineId, company: session.companyId, institution: session.institutionId || undefined, quantity: qty, supplier: text(body.supplier, 80), reason, note: text(body.note, 200),
      }]]);
      return NextResponse.json({ success: true, requestId: created[0], message: "Purchase request raised." });
    }
    const id = positiveId(body.id);
    if (!id) return fail("Purchase request is required.");
    const req0 = (await rpc<Row[]>(session, M, "search_read", [[["id", "=", id], ["company", "=", session.companyId]], 0, 1, null, ["id", "medicament", "quantity", "supplier", "state"]]))[0];
    if (!req0) return fail("Purchase request not found in this hospital.", 404);
    if (action === "order") {
      await rpc(session, M, "write", [[id], { state: "ordered", supplier: text(body.supplier, 80) || req0.supplier || undefined }]);
      return NextResponse.json({ success: true, message: "Marked as ordered from the supplier." });
    }
    if (action === "cancel") {
      await rpc(session, M, "write", [[id], { state: "cancelled" }]);
      return NextResponse.json({ success: true, message: "Purchase request cancelled." });
    }
    if (action === "receive") {
      const batch = text(body.batch, 40), qty = Math.round(Number(body.quantity ?? req0.quantity)), level = Math.round(Number(body.reorderLevel ?? 20));
      if (!batch || !(qty > 0) || !/^\d{4}-\d{2}-\d{2}$/.test(String(body.expiry))) return fail("Enter the batch number, quantity and expiry date of the goods received.");
      if (String(body.expiry) < new Date().toISOString().slice(0, 10)) return fail("That batch has already expired.");
      if (req0.state !== "ordered") return fail("Only an ordered request can be received.", 409);
      await rpc(session, "ist.ops.stock", "create", [[{
        medicament: idOf(req0.medicament), company: session.companyId, institution: session.institutionId || undefined, batch, expiry: dateValue(body.expiry),
        quantity: qty, reorder_level: level >= 0 ? level : 20, supplier: req0.supplier || undefined,
      }]]);
      await rpc(session, M, "write", [[id], { state: "received" }]);
      return NextResponse.json({ success: true, message: "Goods received into stock." });
    }
    return fail(`Unsupported action: ${action}`);
  } catch (err) {
    return errorResponse(err, "Purchase transaction failed");
  }
}
