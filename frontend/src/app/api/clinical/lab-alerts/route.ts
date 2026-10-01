import { NextRequest, NextResponse } from "next/server";
import { errorResponse, fail, guard, idOf, patientInfo, positiveId, raiseLabAlerts, rpc, stamp, text, Row } from "@/lib/ops-api";

// Laboratory result alerts: an analyte outside its verified reference range raises an alert (critical when more than
// 30% beyond a limit). The doctor must acknowledge it and record the action taken; open critical alerts are listed
// first. Records are native Tryton ist.ops.critical_alert rows.

const M = "ist.ops.critical_alert";
const MODULES = ["physician", "nursing", "laboratory"] as const;

export async function GET() {
  const g = await guard([...MODULES]);
  if ("response" in g) return g.response;
  const { session } = g;
  try {
    const rows = await rpc<Row[]>(session, M, "search_read", [[["company", "=", session.companyId]], 0, 300, [["id", "DESC"]],
      ["id", "reference", "lab", "patient", "analyte", "value", "limits", "severity", "state", "raised_at", "acknowledged_by", "acknowledged_at", "action_note"]]);
    const pats = await patientInfo(session, [...new Set(rows.map((r) => idOf(r.patient)).filter((x): x is number => !!x))]);
    const alerts = rows.map((r) => ({
      id: r.id, reference: r.reference, labId: idOf(r.lab), patientName: pats[idOf(r.patient) as number]?.name || "", puid: pats[idOf(r.patient) as number]?.puid || null,
      analyte: r.analyte, value: r.value, limits: r.limits || "", severity: r.severity, state: r.state, raisedAt: stamp(r.raised_at), acknowledgedAt: stamp(r.acknowledged_at), note: r.action_note || null,
    }));
    alerts.sort((a, b) => (a.state === b.state ? 0 : a.state === "open" ? -1 : 1) || (a.severity === b.severity ? 0 : a.severity === "critical" ? -1 : 1));
    return NextResponse.json({
      success: true, alerts, role: session.role,
      summary: {
        open: alerts.filter((a) => a.state === "open").length, openCritical: alerts.filter((a) => a.state === "open" && a.severity === "critical").length,
        acknowledged: alerts.filter((a) => a.state === "acknowledged").length,
      },
    });
  } catch (err) {
    return errorResponse(err, "Failed to load result alerts");
  }
}

export async function POST(req: NextRequest) {
  const g = await guard([...MODULES]);
  if ("response" in g) return g.response;
  const { session } = g;
  try {
    const body = await req.json();
    const action = String(body.action || "");
    if (action === "acknowledge") {
      const id = positiveId(body.id);
      const note = text(body.note, 500);
      if (!id) return fail("Alert is required.");
      if (!["physician", "nursing", "admin"].includes(session.role)) return fail("Only a doctor or nurse can acknowledge a result alert.", 403);
      if (!note) return fail("Record the action taken before acknowledging.");
      const exists = await rpc<number[]>(session, M, "search", [[["id", "=", id], ["company", "=", session.companyId]]]);
      if (!exists.length) return fail("Alert not found in this hospital.", 404);
      await rpc(session, M, "write", [[id], { state: "acknowledged", action_note: note }]);
      return NextResponse.json({ success: true, message: "Result alert acknowledged." });
    }
    if (action === "scan") {
      // Raise alerts for results saved before alerts existed (laboratory staff and administrators).
      if (!["lab", "admin"].includes(session.role)) return fail("Only laboratory staff can scan results.", 403);
      const labs = await rpc<Row[]>(session, "gnuhealth.lab", "search_read", [[], 0, 300, [["id", "DESC"]], ["id"]]);
      let raised = 0;
      for (const l of labs) raised += await raiseLabAlerts(session, l.id);
      return NextResponse.json({ success: true, message: raised ? `${raised} alert(s) raised.` : "No new out-of-range results found.", raised });
    }
    return fail(`Unsupported action: ${action}`);
  } catch (err) {
    return errorResponse(err, "Result alert transaction failed");
  }
}
