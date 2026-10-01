"use client";

import React, { useState } from "react";
import { PackagePlus } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { Card, Empty, Field, LINK, LINK_RED, Notices, PageHeader, SELECT, StateBadge, Stats, TH, useOps, Variant } from "@/components/app/ops-ui";

interface Batch {
  id: number; medicineId: number; medicine: string; batch: string; expiry: string; quantity: number; reorderLevel: number; supplier: string | null; expired: boolean; expiringSoon: boolean;
}
interface Data {
  batches: Batch[]; medicines: { id: number; label: string }[]; lowStock: { medicine: string; onHand: number; reorderLevel: number }[];
  summary: { medicinesTracked: number; batches: number; low: number; expiringSoon: number; expired: number };
}

interface Purchase { id: number; reference: string; medicineId: number; medicine: string; quantity: number; supplier: string | null; reason: string; state: string; note: string | null }
interface PurchaseData {
  requests: Purchase[]; suggestions: { medicineId: number; medicine: string; onHand: number; reorderLevel: number; suggested: number }[];
  summary: { requested: number; ordered: number; suggestions: number };
}
const PURCHASE_STATE: Record<string, [string, Variant]> = { requested: ["Requested", "amber"], ordered: ["Ordered", "blue"], received: ["Received", "green"], cancelled: ["Cancelled", "neutral"] };

type Dialog = { kind: "receive" } | { kind: "adjust"; item: Batch } | { kind: "po_receive"; item: Purchase } | { kind: "po_order"; item: Purchase };

export default function StockPage() {
  const { data, loading, feedback, setFeedback, error, setError, busy, post, load: reloadStock } = useOps<Data>("/api/clinical/stock");
  const buy = useOps<PurchaseData>("/api/clinical/purchases");
  const buySubmit = async (payload: Record<string, unknown>) => { if (await buy.post(payload)) { setDialog(null); await reloadStock(); return true; } setError(buy.error); return false; };
  const [dialog, setDialog] = useState<Dialog | null>(null);
  const [f, setF] = useState<Record<string, string>>({});
  const set = (k: string, v: string) => setF((p) => ({ ...p, [k]: v }));
  const open = (d: Dialog, init: Record<string, string> = {}) => { setError(null); setF(init); setDialog(d); };
  const submit = async (payload: Record<string, unknown>) => { if (await post(payload)) setDialog(null); };

  return (
    <div className="max-w-6xl mx-auto space-y-7 animate-fade-in">
      <PageHeader kicker="PHARMACY" title="Pharmacy Stock" subtitle="Batches with expiry date and quantity. Dispensing a prescription takes medicines out earliest-expiry first and never uses an expired batch; a shortage stops the dispense. Medicines with no batch here are not tracked."
        actions={<Button variant="primary" size="sm" onClick={() => open({ kind: "receive" }, { medicineId: String(data?.medicines[0]?.id || ""), reorderLevel: "20" })} leftIcon={<PackagePlus className="w-4 h-4" />}>Receive stock</Button>} />
      <Notices feedback={feedback} onClose={() => setFeedback(null)} error={dialog ? null : error} />
      {data && <Stats items={[["Medicines tracked", data.summary.medicinesTracked], ["At or below reorder level", data.summary.low, "red"], ["Expiring in 90 days", data.summary.expiringSoon, "red"], ["Expired batches", data.summary.expired, "red"]]} />}

      {data && data.lowStock.length > 0 && (
        <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900">
          <div className="font-semibold mb-1">Reorder needed</div>
          {data.lowStock.map((l) => <div key={l.medicine}>{l.medicine}: {l.onHand} on hand (reorder level {l.reorderLevel})</div>)}
        </div>
      )}

      <Card>
        {loading ? <div className="p-12 text-center text-xs text-slate-500 font-mono">Loading...</div>
          : !data || data.batches.length === 0 ? <Empty title="No stock recorded" hint="Receive a batch to start tracking a medicine." />
            : (
              <table className="w-full text-left border-collapse text-xs">
                <thead><tr className="bg-slate-50 border-b border-slate-200/80 font-mono text-[11px] text-slate-500 uppercase tracking-wider">
                  <th className={TH}>Medicine</th><th className={TH}>Batch</th><th className={TH}>Expiry</th><th className={`${TH} text-right`}>On hand</th><th className={`${TH} text-right`}>Reorder at</th><th className={TH}>Supplier</th><th className={TH}>Next</th>
                </tr></thead>
                <tbody className="divide-y divide-slate-100">
                  {data.batches.map((b) => (
                    <tr key={b.id} className="hover:bg-slate-50/80">
                      <td className="py-3 px-4 font-semibold text-slate-900">{b.medicine}</td>
                      <td className="py-3 px-4 font-mono">{b.batch}</td>
                      <td className={`py-3 px-4 font-mono ${b.expired ? "text-red-600 font-semibold" : b.expiringSoon ? "text-amber-700 font-semibold" : ""}`}>{b.expiry}{b.expired ? " (expired)" : b.expiringSoon ? " (soon)" : ""}</td>
                      <td className={`py-3 px-4 text-right font-mono ${b.quantity <= b.reorderLevel ? "text-red-600 font-semibold" : ""}`}>{b.quantity}</td>
                      <td className="py-3 px-4 text-right font-mono">{b.reorderLevel}</td>
                      <td className="py-3 px-4 text-slate-600">{b.supplier || "—"}</td>
                      <td className="py-3 px-4"><button className={LINK} onClick={() => open({ kind: "adjust", item: b }, { quantity: String(b.quantity) })}>Stock count</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
      </Card>

      <div className="space-y-3">
        <h2 className="text-sm font-semibold text-slate-800">Purchase requests</h2>
        <Notices feedback={buy.feedback} onClose={() => buy.setFeedback(null)} error={dialog ? null : buy.error} />
        {buy.data && buy.data.suggestions.length > 0 && (
          <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 space-y-2">
            <div className="font-semibold">Below reorder level, no request yet</div>
            {buy.data.suggestions.map((s) => (
              <div key={s.medicineId} className="flex items-center justify-between gap-3">
                <span>{s.medicine}: {s.onHand} on hand (reorder level {s.reorderLevel})</span>
                <button className={LINK} disabled={buy.busy} onClick={() => buy.post({ action: "create", medicineId: s.medicineId, quantity: s.suggested, reason: "low_stock" })}>Request {s.suggested}</button>
              </div>
            ))}
          </div>
        )}
        <Card>
          {!buy.data || buy.data.requests.length === 0 ? <Empty title="No purchase requests" hint="Requests raised from low stock appear here." /> : (
            <table className="w-full text-left border-collapse text-xs">
              <thead><tr className="bg-slate-50 border-b border-slate-200/80 font-mono text-[11px] text-slate-500 uppercase tracking-wider">
                <th className={TH}>Ref</th><th className={TH}>Medicine</th><th className={`${TH} text-right`}>Quantity</th><th className={TH}>Supplier</th><th className={TH}>Status</th><th className={TH}>Next</th>
              </tr></thead>
              <tbody className="divide-y divide-slate-100">
                {buy.data.requests.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50/80">
                    <td className="py-3 px-4 font-mono font-bold text-[#0F766E]">{r.reference}</td>
                    <td className="py-3 px-4 font-semibold text-slate-900">{r.medicine}</td>
                    <td className="py-3 px-4 text-right font-mono">{r.quantity}</td>
                    <td className="py-3 px-4 text-slate-600">{r.supplier || "—"}</td>
                    <td className="py-3 px-4"><StateBadge state={r.state} map={PURCHASE_STATE} /></td>
                    <td className="py-3 px-4 space-x-3 whitespace-nowrap">
                      {r.state === "requested" && <button className={LINK} onClick={() => open({ kind: "po_order", item: r }, { supplier: r.supplier || "" })}>Mark ordered</button>}
                      {r.state === "ordered" && <button className={LINK} onClick={() => open({ kind: "po_receive", item: r }, { quantity: String(r.quantity), reorderLevel: "20" })}>Receive goods</button>}
                      {["requested", "ordered"].includes(r.state) && <button className={LINK_RED} disabled={buy.busy} onClick={() => buy.post({ action: "cancel", id: r.id })}>Cancel</button>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>
      </div>

      {dialog && (dialog.kind === "po_order" || dialog.kind === "po_receive") && (
        <Modal isOpen onClose={() => setDialog(null)} size="md" kicker={`${dialog.item.reference} - ${dialog.item.medicine}`} title={dialog.kind === "po_order" ? "Mark as ordered" : "Receive goods"}>
          <form className="space-y-4" onSubmit={(e) => {
            e.preventDefault();
            if (dialog.kind === "po_order") buySubmit({ action: "order", id: dialog.item.id, supplier: f.supplier });
            else buySubmit({ action: "receive", id: dialog.item.id, batch: f.batch, expiry: f.expiry, quantity: Number(f.quantity), reorderLevel: Number(f.reorderLevel) });
          }}>
            {dialog.kind === "po_order" ? <Input label="Supplier" value={f.supplier || ""} onChange={(e) => set("supplier", e.target.value)} /> : (<>
              <Input label="Batch number *" value={f.batch || ""} onChange={(e) => set("batch", e.target.value)} required />
              <Input label="Expiry date *" type="date" value={f.expiry || ""} onChange={(e) => set("expiry", e.target.value)} required />
              <div className="grid grid-cols-2 gap-3">
                <Input label="Quantity received *" type="number" min="1" value={f.quantity || ""} onChange={(e) => set("quantity", e.target.value)} required />
                <Input label="Reorder level" type="number" min="0" value={f.reorderLevel || ""} onChange={(e) => set("reorderLevel", e.target.value)} />
              </div>
            </>)}
            {buy.error && <p className="text-xs text-red-600 font-medium">{buy.error}</p>}
            <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setDialog(null)}>Cancel</Button>
              <Button type="submit" variant="primary" isLoading={buy.busy} className="bg-[#0F766E] font-bold">Save</Button>
            </div>
          </form>
        </Modal>
      )}

      <Modal isOpen={dialog?.kind === "receive"} onClose={() => setDialog(null)} title="Receive stock" kicker="PHARMACY GOODS-IN" size="md">
        <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); submit({ action: "receive", medicineId: Number(f.medicineId), batch: f.batch, expiry: f.expiry, quantity: Number(f.quantity), reorderLevel: Number(f.reorderLevel), supplier: f.supplier }); }}>
          <Field label="Medicine *">
            <select className={SELECT} value={f.medicineId || ""} onChange={(e) => set("medicineId", e.target.value)}>{(data?.medicines || []).map((m) => <option key={m.id} value={m.id}>{m.label}</option>)}</select>
          </Field>
          <Input label="Batch number *" value={f.batch || ""} onChange={(e) => set("batch", e.target.value)} required />
          <Input label="Expiry date *" type="date" value={f.expiry || ""} onChange={(e) => set("expiry", e.target.value)} required />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Quantity *" type="number" min="1" value={f.quantity || ""} onChange={(e) => set("quantity", e.target.value)} required />
            <Input label="Reorder level" type="number" min="0" value={f.reorderLevel || ""} onChange={(e) => set("reorderLevel", e.target.value)} />
          </div>
          <Input label="Supplier" value={f.supplier || ""} onChange={(e) => set("supplier", e.target.value)} />
          {error && <p className="text-xs text-red-600 font-medium">{error}</p>}
          <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setDialog(null)}>Cancel</Button>
            <Button type="submit" variant="primary" isLoading={busy} className="bg-[#0F766E] font-bold">Receive</Button>
          </div>
        </form>
      </Modal>

      {dialog?.kind === "adjust" && (
        <Modal isOpen onClose={() => setDialog(null)} title="Stock count" kicker={`${dialog.item.medicine} - batch ${dialog.item.batch}`} size="md">
          <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); submit({ action: "adjust", id: dialog.item.id, quantity: Number(f.quantity) }); }}>
            <Input label="Counted quantity *" type="number" min="0" value={f.quantity || ""} onChange={(e) => set("quantity", e.target.value)} required />
            {error && <p className="text-xs text-red-600 font-medium">{error}</p>}
            <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setDialog(null)}>Cancel</Button>
              <Button type="submit" variant="primary" isLoading={busy} className="bg-[#0F766E] font-bold">Save</Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
