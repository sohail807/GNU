import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth-session";
import { resolveTenant } from "@/lib/tenant";
import { TrytonClient } from "@/lib/tryton-client";

// Group overview: the same numbers for every hospital the signed-in user may use, side by side. Only users who
// belong to more than one hospital get it. Each hospital is queried under its own company and institution, so the
// figures are exactly what that hospital's own screens show.

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized session" }, { status: 401 });
  if (!session.hospitals || session.hospitals.length < 2) {
    return NextResponse.json({ error: "The group overview is for users who belong to several hospitals." }, { status: 403 });
  }
  const tenant = resolveTenant(session.tenantId);
  const mine = (tenant.hospitals || []).filter((h) => session.hospitals!.some((m) => m.id === h.id));

  const run = async <T,>(model: string, method: string, domain: unknown[], companyId: number, extra: unknown[] = []): Promise<T> =>
    TrytonClient.execute<T>(
      session.username, session.userId, session.sessionToken,
      model, method, [domain, ...extra], { company: companyId }, session.database, { unscoped: true }
    );

  const rows = await Promise.all(
    mine.map(async (h) => {
      const inst = ["institution", "=", h.institutionId];
      try {
        const [beds, occupied, doctors, appts, admitted, invoices, labs, scans] = await Promise.all([
          run<number>("gnuhealth.hospital.bed", "search_count", [inst], h.companyId),
          run<number>("gnuhealth.hospital.bed", "search_count", [inst, ["state", "=", "occupied"]], h.companyId),
          run<number>("gnuhealth.healthprofessional", "search_count", [inst], h.companyId),
          run<number>("gnuhealth.appointment", "search_count", [inst], h.companyId),
          run<number>("gnuhealth.inpatient.registration", "search_count", [inst, ["state", "=", "hospitalized"]], h.companyId),
          run<Array<{ total_amount: unknown; state: string }>>(
            "account.invoice", "search_read", [["type", "=", "out"]], h.companyId, [0, 5000, null, ["total_amount", "state"]]
          ),
          run<number>("gnuhealth.lab", "search_count", [], h.companyId),
          run<number>("gnuhealth.imaging.test.request", "search_count", [], h.companyId),
        ]);
        const amount = (v: unknown) => Number(typeof v === "object" && v !== null && "decimal" in v ? (v as { decimal: string }).decimal : v) || 0;
        const billed = invoices.reduce((t, i) => t + amount(i.total_amount), 0);
        const paid = invoices.filter((i) => i.state === "paid").reduce((t, i) => t + amount(i.total_amount), 0);
        const company = await run<Array<Record<string, unknown>>>("company.company", "read", [h.companyId], h.companyId, [["currency.code"]]).catch(() => []);
        // Tryton returns a dotted related field as a nested object ("currency." -> { code }).
        const row = company?.[0] || {};
        const nested = row["currency."] as { code?: string } | undefined;
        const currency = nested?.code || (row["currency.code"] as string | undefined) || "";
        return {
          id: h.id, name: h.name, currency, beds, occupiedBeds: occupied,
          occupancy: beds ? Math.round((occupied / beds) * 1000) / 10 : 0,
          doctors, appointments: appts, inpatients: admitted,
          invoices: invoices.length, paidInvoices: invoices.filter((i) => i.state === "paid").length,
          billed: Math.round(billed), collected: Math.round(paid),
          labOrders: labs, imagingOrders: scans,
        };
      } catch (err) {
        return { id: h.id, name: h.name, error: err instanceof Error ? err.message.slice(0, 160) : "Unavailable" };
      }
    })
  );
  return NextResponse.json({ success: true, hospitals: rows, activeHospitalId: session.hospitalId });
}
