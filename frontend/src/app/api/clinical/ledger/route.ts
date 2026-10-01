import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth-session";
import { TrytonClient } from "@/lib/tryton-client";
import { hasModuleAccess } from "@/lib/access-control";

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized session" }, { status: 401 });
  }
  if (!hasModuleAccess(session.role, "ledger")) {
    // Per RBAC policy, cashiers are segregated from GL journal entries - only
    // accountants/admins may view account moves. Degrade gracefully rather than
    // error, consistent with how the billing route handles restricted access.
    return NextResponse.json({ error: "Your role does not have permission to view the general ledger." }, { status: 403 });
  }

  try {
    const rawMoves = await TrytonClient.execute<any[]>(
      session.username,
      session.userId,
      session.sessionToken,
      "account.move",
      "search_read",
      [[], 0, 20, [["id", "DESC"]], ["id", "number", "date", "description", "state", "lines"]],
      { company: session.companyId },
      session.database
    );

    // Resolve move lines
    const allLineIds = rawMoves.flatMap((m) => m.lines || []);
    let linesMap: Record<number, any> = {};

    if (allLineIds.length > 0) {
      try {
        const rawLines = await TrytonClient.execute<any[]>(
          session.username,
          session.userId,
          session.sessionToken,
          "account.move.line",
          "search_read",
          [[["id", "in", allLineIds]], 0, allLineIds.length, null, ["id", "account", "debit", "credit", "description"]],
          { company: session.companyId },
          session.database
        );
        linesMap = rawLines.reduce((acc, l) => {
          acc[l.id] = l;
          return acc;
        }, {} as Record<number, any>);
      } catch {
        // Fallback
      }
    }

    // Resolve account names
    const accountIds = Object.values(linesMap)
      .map((l: any) => (typeof l.account === "number" ? l.account : l.account?.[0]))
      .filter(Boolean);
    let accountsMap: Record<number, any> = {};

    if (accountIds.length > 0) {
      try {
        const accounts = await TrytonClient.execute<any[]>(
          session.username,
          session.userId,
          session.sessionToken,
          "account.account",
          "search_read",
          [[["id", "in", accountIds]], 0, accountIds.length, null, ["id", "code", "name"]],
          { company: session.companyId },
          session.database
        );
        accountsMap = accounts.reduce((acc, a) => {
          acc[a.id] = a;
          return acc;
        }, {} as Record<number, any>);
      } catch {
        // Fallback
      }
    }

    const moves = rawMoves.map((m) => {
      const dateVal = m.date;
      const dateStr = dateVal?.year
        ? `${dateVal.year}-${String(dateVal.month).padStart(2, "0")}-${String(dateVal.day).padStart(2, "0")}`
        : null;

      const lines = (m.lines || []).map((lid: number) => {
        const l = linesMap[lid] || {};
        const accId = typeof l.account === "number" ? l.account : l.account?.[0];
        const acc = accountsMap[accId] || {};
        const debitNum =
          typeof l.debit === "object" && l.debit?.decimal
            ? parseFloat(l.debit.decimal)
            : parseFloat(l.debit || 0);
        const creditNum =
          typeof l.credit === "object" && l.credit?.decimal
            ? parseFloat(l.credit.decimal)
            : parseFloat(l.credit || 0);

        return {
          id: l.id,
          account: acc.code || "",
          accountName: acc.name || "",
          debit: debitNum,
          credit: creditNum,
          description: l.description || "",
        };
      });

      return {
        id: m.id,
        ref: String(m.number || m.id),
        date: dateStr,
        description: m.description || `Account Move #${m.number || m.id}`,
        state: m.state || "",
        lines,
      };
    });

    return NextResponse.json({ success: true, moves });
  } catch (err: unknown) {
    const status = (err as any)?.status || 500;
    const message = err instanceof Error ? err.message : "Failed to load general ledger audit";
    return NextResponse.json({ error: message }, { status });
  }
}
