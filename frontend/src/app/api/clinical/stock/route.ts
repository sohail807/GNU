import { NextRequest, NextResponse } from "next/server";
import { dateValue, day, errorResponse, fail, guard, idOf, positiveId, rpc, text, Row } from "@/lib/ops-api";

// Pharmacy stock: batches with expiry and quantity per hospital. Dispensing a prescription takes the medicines out
// earliest-expiry-first (see consumeStock in ops-api); expired batches are never dispensed.
// Records are native Tryton ist.ops.stock rows.

const M = "ist.ops.stock";

export async function GET() {
  const g = await guard(["pharmacy"]);
  if ("response" in g) return g.response;
  const { session } = g;
  try {
    const rows = await rpc<Row[]>(session, M, "search_read", [[["company", "=", session.companyId]], 0, 500, [["expiry", "ASC"]],
      ["id", "medicament", "batch", "expiry", "quantity", "reorder_level", "supplier"]]);
    const meds = await rpc<Row[]>(session, "gnuhealth.medicament", "search_read", [[], 0, 300, [["active_component", "ASC"]], ["id", "rec_name", "active_component", "presentation"]]).catch(() => []);
    // The product name ("Amoxicillin 500mg") is what doctors prescribe, so stock is labelled the same way. Labelling by active
    // ingredient alone let stock be received against the syrup while the 500mg capsules were prescribed, and nothing was deducted.
    const medName = Object.fromEntries(meds.map((m) => [m.id, `${m.rec_name || m.active_component || `Medicine ${m.id}`}${m.presentation ? ` (${m.presentation})` : ""}`]));
    const today = new Date().toISOString().slice(0, 10);
    const soon = new Date(Date.now() + 90 * 864e5).toISOString().slice(0, 10);
    const batches = rows.map((r) => {
      const exp = day(r.expiry) || "";
      return {
        id: r.id, medicineId: idOf(r.medicament), medicine: medName[idOf(r.medicament) as number] || `Medicine ${idOf(r.medicament)}`, batch: r.batch,
        expiry: exp, quantity: r.quantity, reorderLevel: r.reorder_level, supplier: r.supplier || null,
        expired: !!exp && exp < today, expiringSoon: !!exp && exp >= today && exp <= soon,
      };
    });
    // totals per medicine, in-date batches only
    const totals = new Map<number, { medicine: string; qty: number; reorder: number }>();
    for (const b of batches) {
      if (b.medicineId == null) continue;
      const t = totals.get(b.medicineId) || { medicine: b.medicine, qty: 0, reorder: 0 };
      if (!b.expired) t.qty += b.quantity;
      t.reorder = Math.max(t.reorder, b.reorderLevel);
      totals.set(b.medicineId, t);
    }
    const low = [...totals.values()].filter((t) => t.qty <= t.reorder);
    return NextResponse.json({
      success: true, batches, medicines: meds.map((m) => ({ id: m.id as number, label: medName[m.id] })),
      lowStock: low.map((t) => ({ medicine: t.medicine, onHand: t.qty, reorderLevel: t.reorder })),
      summary: { medicinesTracked: totals.size, batches: batches.length, low: low.length, expiringSoon: batches.filter((b) => b.expiringSoon).length, expired: batches.filter((b) => b.expired).length },
    });
  } catch (err) {
    return errorResponse(err, "Failed to load pharmacy stock");
  }
}

export async function POST(req: NextRequest) {
  const g = await guard(["pharmacy"]);
  if ("response" in g) return g.response;
  const { session } = g;
  try {
    const body = await req.json();
    const action = String(body.action || "");
    if (action === "receive") {
      const medicineId = positiveId(body.medicineId), batch = text(body.batch, 40), qty = Math.round(Number(body.quantity)), reorder = Math.round(Number(body.reorderLevel ?? 0));
      if (!medicineId || !batch || !(qty > 0) || !(reorder >= 0) || !/^\d{4}-\d{2}-\d{2}$/.test(String(body.expiry))) return fail("Choose the medicine and enter batch, expiry date and quantity.");
      if (String(body.expiry) < new Date().toISOString().slice(0, 10)) return fail("That batch has already expired.");
      const created = await rpc<number[]>(session, M, "create", [[{
        medicament: medicineId, company: session.companyId, institution: session.institutionId || undefined, batch, expiry: dateValue(body.expiry),
        quantity: qty, reorder_level: reorder, supplier: text(body.supplier, 80),
      }]]);
      return NextResponse.json({ success: true, batchId: created[0], message: "Stock received." });
    }
    const id = positiveId(body.id);
    if (!id) return fail("Batch is required.");
    const cur = (await rpc<Row[]>(session, M, "search_read", [[["id", "=", id], ["company", "=", session.companyId]], 0, 1, null, ["id", "quantity"]]))[0];
    if (!cur) return fail("Batch not found in this hospital.", 404);
    if (action === "adjust") {
      const qty = Math.round(Number(body.quantity));
      if (!(qty >= 0)) return fail("Enter the counted quantity.");
      await rpc(session, M, "write", [[id], { quantity: qty }]);
      return NextResponse.json({ success: true, message: "Stock count updated." });
    }
    if (action === "reorder_level") {
      const level = Math.round(Number(body.reorderLevel));
      if (!(level >= 0)) return fail("Enter the reorder level.");
      await rpc(session, M, "write", [[id], { reorder_level: level }]);
      return NextResponse.json({ success: true, message: "Reorder level updated." });
    }
    return fail(`Unsupported action: ${action}`);
  } catch (err) {
    return errorResponse(err, "Stock transaction failed");
  }
}
