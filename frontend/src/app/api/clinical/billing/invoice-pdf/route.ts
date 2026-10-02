import { NextRequest, NextResponse } from "next/server";
import { execFile } from "child_process";
import { promisify } from "util";
import fs from "fs/promises";
import path from "path";
import os from "os";
import { getSession } from "@/lib/auth-session";
import { TrytonClient } from "@/lib/tryton-client";
import { hasModuleAccess } from "@/lib/access-control";

const execFileAsync = promisify(execFile);

// GNU Health's invoice report template is ODT (OpenDocument), and Tryton only
// converts to PDF itself when the report action's own "extension" field is
// set to "pdf" - a persistent admin config change on a shared Tryton record,
// not something this route should mutate. Instead: get the real rendered ODT
// from Tryton's own report engine, then convert it locally with the same
// LibreOffice CLI Tryton itself would use (soffice --headless --convert-to),
// which is already installed on this host. The document content and data are
// still 100% native Tryton; only the ODT->PDF step happens in our process.
export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized session" }, { status: 401 });
  }
  if (!hasModuleAccess(session.role, "billing")) {
    return NextResponse.json({ error: "Your role does not have billing/invoicing permission." }, { status: 403 });
  }

  const invoiceIdParam = new URL(req.url).searchParams.get("invoiceId");
  const invoiceId = Number(invoiceIdParam);
  if (!Number.isSafeInteger(invoiceId) || invoiceId <= 0) {
    return NextResponse.json({ error: "A valid invoice ID is required." }, { status: 400 });
  }

  let workDir: string | null = null;
  try {
    const report = await TrytonClient.executeReport(
      session.username, session.userId, session.sessionToken,
      "account.invoice", [invoiceId],
      { company: session.companyId }, session.database
    );

    if (report.extension === "pdf") {
      // Already PDF (e.g. if the report action is ever reconfigured server-side) - no
      // conversion needed.
      return new NextResponse(new Uint8Array(report.data), {
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `attachment; filename="${(report.name || `Invoice-${invoiceId}`).replace(/[^\w.-]/g, "_")}.pdf"`,
        },
      });
    }

    if (report.extension !== "odt") {
      return NextResponse.json(
        { error: `Unexpected report format "${report.extension}" - cannot convert to PDF.` },
        { status: 502 }
      );
    }

    workDir = await fs.mkdtemp(path.join(os.tmpdir(), "ist-invoice-pdf-"));
    const odtPath = path.join(workDir, "invoice.odt");
    await fs.writeFile(odtPath, report.data);

    // Same flags Tryton's own trytond/report/report.py convert() uses.
    await execFileAsync(
      "soffice",
      ["--headless", "--nolockcheck", "--nodefault", "--norestore", "--convert-to", "pdf", "--outdir", workDir, odtPath],
      { timeout: 60_000 }
    );

    const pdfPath = path.join(workDir, "invoice.pdf");
    const pdfBytes = await fs.readFile(pdfPath);

    return new NextResponse(new Uint8Array(pdfBytes), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${(report.name || `Invoice-${invoiceId}`).replace(/[^\w.-]/g, "_")}.pdf"`,
      },
    });
  } catch (error: unknown) {
    const status = (error as { status?: number })?.status || 500;
    const message = error instanceof Error ? error.message : "Failed to generate invoice PDF";
    const isConversionFailure = message.includes("ENOENT") || message.includes("soffice");
    return NextResponse.json(
      { error: isConversionFailure ? "PDF conversion is unavailable on this server (LibreOffice not found)." : message },
      { status: isConversionFailure ? 503 : status }
    );
  } finally {
    if (workDir) {
      await fs.rm(workDir, { recursive: true, force: true }).catch(() => undefined);
    }
  }
}
