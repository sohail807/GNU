import { NextRequest, NextResponse } from "next/server";
import { execFile } from "child_process";
import { promisify } from "util";
import { getSession } from "@/lib/auth-session";
import { isSuperAdmin } from "@/lib/platform";
import { getTenantRegistry, saveTenantRegistry, DEFAULT_TENANT_ID, HOSPITAL_CODE_PATTERN, type TenantConfig } from "@/lib/tenant";
import { TrytonClient } from "@/lib/tryton-client";

const execFileAsync = promisify(execFile);

// Codes that would collide with infrastructure names or the default hospital.
const RESERVED_CODES = new Set(["central", "admin", "api", "www", "platform", "staging", "template", "gnuhealth", "default"]);

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!isSuperAdmin(session)) {
    return NextResponse.json({ error: "Platform administration requires super-admin access." }, { status: 403 });
  }
  const registry = getTenantRegistry();
  return NextResponse.json({ success: true, tenants: Object.values(registry) });
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!isSuperAdmin(session)) {
    return NextResponse.json({ error: "Platform administration requires super-admin access." }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { name, subdomain, currency, country } = body;

    if (typeof name !== "string" || !name.trim()) {
      return NextResponse.json({ error: "Hospital name is required." }, { status: 400 });
    }
    if (typeof subdomain !== "string" || !HOSPITAL_CODE_PATTERN.test(subdomain)) {
      return NextResponse.json(
        { error: "Hospital code must be 2-24 lowercase letters or digits (no spaces or hyphens)." },
        { status: 400 }
      );
    }
    if (RESERVED_CODES.has(subdomain)) {
      return NextResponse.json({ error: `"${subdomain}" is reserved. Choose another hospital code.` }, { status: 400 });
    }
    if (typeof currency !== "string" || !/^[A-Z]{3}$/.test(currency)) {
      return NextResponse.json({ error: "Currency must be a 3-letter ISO code, e.g. QAR." }, { status: 400 });
    }
    if (typeof country !== "string" || !/^[A-Z]{2,3}$/.test(country)) {
      return NextResponse.json({ error: "Country must be a 2-3 letter ISO code, e.g. QAT." }, { status: 400 });
    }

    const registry = getTenantRegistry();
    const tenantId = subdomain; // subdomain doubles as the registry key: both must be unique.
    if (registry[tenantId]) {
      return NextResponse.json({ error: `A tenant with subdomain "${subdomain}" already exists.` }, { status: 409 });
    }
    if (Object.values(registry).some((t) => t.subdomain === subdomain)) {
      return NextResponse.json({ error: `Subdomain "${subdomain}" is already in use.` }, { status: 409 });
    }

    // Derived, not user-supplied: the database name is generated from the already-validated
    // subdomain, so it can never carry attacker-controlled characters into the provisioning
    // script (which independently re-validates it against the same allow-list regardless).
    const database = `gnuhealth_h_${subdomain}`;

    let adminUsername = "";
    let adminPassword = "";

    if (process.env.PROVISIONER_URL && process.env.PROVISIONER_TOKEN) {
      // Hospital databases are created by a small, token-protected service on the database VM
      // (deploy/infra/provisioner). It only ever runs the whitelisted provisioning script.
      try {
        const res = await fetch(process.env.PROVISIONER_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${process.env.PROVISIONER_TOKEN}` },
          body: JSON.stringify({ code: subdomain }),
          signal: AbortSignal.timeout(120_000),
        });
        const result = (await res.json().catch(() => ({}))) as {
          error?: string; adminUsername?: string; adminPassword?: string;
        };
        if (!res.ok) {
          return NextResponse.json(
            { error: res.status === 409 ? `A database for "${subdomain}" already exists.` : `Database provisioning failed: ${result.error || `HTTP ${res.status}`}` },
            { status: res.status === 409 ? 409 : 502 }
          );
        }
        adminUsername = result.adminUsername || "";
        adminPassword = result.adminPassword || "";
      } catch {
        return NextResponse.json({ error: "Could not reach the database provisioning service." }, { status: 502 });
      }
    } else if (process.env.TENANT_PROVISIONING === "manual") {
      // Cloud Run can't reach the database server's provisioning script, so an operator creates
      // the database on the VM first (docs/TENANT_ONBOARDING.md). Here we only confirm the
      // backend actually serves that database before making the hospital routable: Tryton answers
      // 401 for a database it serves and 404 for one it doesn't (no credentials are sent).
      try {
        const probe = await fetch(TrytonClient.getBaseUrl(database), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: 1, method: "common.db.login", params: ["__probe__", { password: "__probe__" }] }),
          signal: AbortSignal.timeout(15_000),
        });
        if (probe.status === 404) {
          return NextResponse.json(
            { error: `Database "${database}" is not served by the backend yet. Create it on the VM and add it to TRYTOND_DATABASE_NAMES first (see docs/TENANT_ONBOARDING.md).` },
            { status: 409 }
          );
        }
        if (probe.status !== 401) {
          return NextResponse.json({ error: `Backend check for "${database}" returned HTTP ${probe.status}.` }, { status: 502 });
        }
      } catch {
        return NextResponse.json({ error: "Could not reach the backend to verify the hospital database." }, { status: 502 });
      }
    } else {
      try {
        const { stdout } = await execFileAsync("sudo", ["-n", "/usr/local/bin/ist-provision-tenant.sh", database], {
          timeout: 60_000,
        });
        // The script prints these on their own lines so the freshly-rotated, tenant-unique
        // admin password never has to be baked into the template or shared across hospitals.
        adminUsername = /^ADMIN_USERNAME=(.+)$/m.exec(stdout)?.[1]?.trim() || "";
        adminPassword = /^ADMIN_PASSWORD=(.+)$/m.exec(stdout)?.[1]?.trim() || "";
      } catch (err: unknown) {
        const message = err && typeof err === "object" && "stderr" in err
          ? String((err as { stderr?: unknown }).stderr || "")
          : err instanceof Error ? err.message : "Unknown provisioning failure";
        return NextResponse.json(
          { error: `Database provisioning failed: ${message.trim() || "see server logs"}` },
          { status: 500 }
        );
      }
    }

    const newTenant: TenantConfig = {
      id: tenantId,
      name: name.trim(),
      slug: subdomain,
      subdomain,
      database,
      defaultCompanyId: 1,
      currency,
      country,
      status: "active",
    };
    saveTenantRegistry({ ...registry, [tenantId]: newTenant });

    return NextResponse.json({
      success: true,
      tenant: newTenant,
      // Shown once, to this super-admin only -- not persisted or logged anywhere else.
      // The hospital's own admin should change this password on first login.
      initialAdminCredentials: adminUsername && adminPassword
        ? { username: adminUsername, password: adminPassword }
        : null,
      message: `Hospital "${name.trim()}" is live. Staff sign in at the main address with hospital code "${subdomain}".`,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to onboard tenant";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// Retiring a tenant only ever flips its status -- the database and its data are left alone.
// Actually deleting a hospital's database is a decision a human makes deliberately via SSH,
// never a side effect of a UI click.
export async function PATCH(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!isSuperAdmin(session)) {
    return NextResponse.json({ error: "Platform administration requires super-admin access." }, { status: 403 });
  }
  const body = await req.json();
  const { tenantId, status } = body;
  if (typeof tenantId !== "string" || !["active", "suspended"].includes(status)) {
    return NextResponse.json({ error: "tenantId and a valid status are required." }, { status: 400 });
  }
  if (tenantId === DEFAULT_TENANT_ID && status === "suspended") {
    return NextResponse.json({ error: "The platform operator's own hospital cannot be suspended." }, { status: 400 });
  }
  const registry = getTenantRegistry();
  if (!registry[tenantId]) {
    return NextResponse.json({ error: "Tenant not found." }, { status: 404 });
  }
  registry[tenantId] = { ...registry[tenantId], status };
  saveTenantRegistry(registry);
  return NextResponse.json({ success: true, tenant: registry[tenantId] });
}
