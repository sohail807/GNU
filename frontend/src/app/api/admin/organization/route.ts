import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth-session";
import { TrytonClient } from "@/lib/tryton-client";
import { getTenantRegistry, saveTenantRegistry } from "@/lib/tenant";

// Organisation settings for the hospital administrator: rename a hospital of the customer, the customer itself, or an
// insurer. A hospital name lives in three places that must agree: the Tryton company (its books), the Tryton
// institution (the site), and the tenant registry the sign-in and hospital switcher read.

type Session = NonNullable<Awaited<ReturnType<typeof getSession>>>;
const NAME = /^[A-Za-z0-9][A-Za-z0-9 .,'()&/-]{1,99}$/;

function rpc<T>(s: Session, model: string, method: string, params: unknown[]) {
  return TrytonClient.execute<T>(s.username, s.userId, s.sessionToken, model, method, params, { company: s.companyId }, s.database, { unscoped: true });
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized session" }, { status: 401 });
  if (session.role !== "admin") return NextResponse.json({ error: "Only a system administrator can change organisation settings." }, { status: 403 });
  try {
    const body = await req.json();
    const action = String(body.action || "");
    const name = typeof body.name === "string" ? body.name.trim() : "";
    if (!NAME.test(name)) return NextResponse.json({ error: "Enter a name of 2 to 100 characters (letters, numbers and . , ' ( ) & / -)." }, { status: 400 });

    const registry = getTenantRegistry();
    const tenant = registry[session.tenantId];
    if (!tenant) return NextResponse.json({ error: "Customer not found." }, { status: 404 });

    if (action === "rename_hospital") {
      const hospital = (tenant.hospitals || []).find((h) => h.id === body.hospitalId);
      const companyId = hospital ? hospital.companyId : tenant.defaultCompanyId;
      const company = (await rpc<Array<Record<string, any>>>(session, "company.company", "read", [[companyId], ["party"]]))[0];
      const companyParty = typeof company?.party === "number" ? company.party : company?.party?.[0];
      if (!companyParty) return NextResponse.json({ error: "Hospital company not found." }, { status: 404 });
      const parties = [companyParty];
      if (hospital) {
        const inst = (await rpc<Array<Record<string, any>>>(session, "gnuhealth.institution", "read", [[hospital.institutionId], ["party"]]))[0];
        const instParty = typeof inst?.party === "number" ? inst.party : inst?.party?.[0];
        if (instParty && instParty !== companyParty) parties.push(instParty);
      }
      await rpc(session, "party.party", "write", [parties, { name }]);
      if (hospital) hospital.name = name;
      else tenant.name = name;
      saveTenantRegistry(registry);
      return NextResponse.json({ success: true, message: `Hospital renamed to ${name}.` });
    }

    if (action === "rename_customer") {
      tenant.name = name;
      saveTenantRegistry(registry);
      return NextResponse.json({ success: true, message: `Customer renamed to ${name}.` });
    }

    if (action === "rename_insurer") {
      const partyId = Number(body.partyId);
      if (!Number.isSafeInteger(partyId) || partyId <= 0) return NextResponse.json({ error: "Insurer is required." }, { status: 400 });
      const ok = await rpc<number[]>(session, "party.party", "search", [[["id", "=", partyId], ["is_insurance_company", "=", true]]]);
      if (!ok.length) return NextResponse.json({ error: "That party is not an insurance company." }, { status: 404 });
      await rpc(session, "party.party", "write", [[partyId], { name }]);
      return NextResponse.json({ success: true, message: `Insurer renamed to ${name}.` });
    }

    return NextResponse.json({ error: `Unsupported action: ${action}` }, { status: 400 });
  } catch (err: unknown) {
    const status = (err as { status?: number })?.status || 500;
    return NextResponse.json({ error: err instanceof Error ? err.message.slice(0, 200) : "The change could not be saved." }, { status });
  }
}
