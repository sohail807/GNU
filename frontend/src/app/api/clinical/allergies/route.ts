import { NextRequest, NextResponse } from "next/server";
import { errorResponse, fail, guard, idOf, positiveId, rpc, text, Row } from "@/lib/ops-api";

// Patient allergies, recorded the native way: a patient disease line flagged as an allergy (kind, severity, status).
// A severe allergy also raises the patient's "critical allergy" flag, which the prescribing safety gate checks.

const MODULES = ["physician", "nursing"] as const;
const KINDS: Record<string, string> = { da: "Drug allergy", fa: "Food allergy", ma: "Other allergy", mc: "Contraindication" };
const SEVERITY: Record<string, string> = { "1_mi": "Mild", "2_mo": "Moderate", "3_sv": "Severe" };

export async function GET(req: NextRequest) {
  const g = await guard([...MODULES]);
  if ("response" in g) return g.response;
  const { session } = g;
  const patientId = positiveId(new URL(req.url).searchParams.get("patientId"));
  if (!patientId) return fail("A valid patient is required.");
  try {
    const rows = await rpc<Row[]>(session, "gnuhealth.patient.disease", "search_read", [[["patient", "=", patientId], ["is_allergy", "=", true]], 0, 100, [["id", "DESC"]],
      ["id", "pathology", "allergy_type", "disease_severity", "status", "is_active", "short_comment"]]);
    const paths = rows.length ? await rpc<Row[]>(session, "gnuhealth.pathology", "search_read", [[["id", "in", rows.map((r) => idOf(r.pathology)).filter((x): x is number => !!x)]], 0, 100, null, ["id", "code", "name"]]) : [];
    const byId = Object.fromEntries(paths.map((p) => [p.id, p]));
    return NextResponse.json({
      success: true,
      allergies: rows.map((r) => ({
        id: r.id, code: byId[idOf(r.pathology) as number]?.code || "", name: byId[idOf(r.pathology) as number]?.name || "", kind: KINDS[r.allergy_type] || "Allergy",
        severity: SEVERITY[r.disease_severity] || "", active: !!r.is_active && !["h", "healed"].includes(String(r.status || "")), note: r.short_comment || null,
      })),
    });
  } catch (err) {
    return errorResponse(err, "Failed to load allergies");
  }
}

export async function POST(req: NextRequest) {
  const g = await guard([...MODULES]);
  if ("response" in g) return g.response;
  const { session } = g;
  try {
    const body = await req.json();
    const action = String(body.action || "add");
    if (action === "resolve") {
      const id = positiveId(body.id);
      if (!id) return fail("Allergy is required.");
      await rpc(session, "gnuhealth.patient.disease", "write", [[id], { is_active: false, status: "h" }]);
      return NextResponse.json({ success: true, message: "Allergy marked as resolved." });
    }
    const patientId = positiveId(body.patientId), code = text(body.code, 20);
    if (!patientId || !code) return fail("Choose the patient and the allergy from the diagnosis list.");
    if (!(body.kind in KINDS)) return fail("Choose the kind of allergy.");
    if (!(body.severity in SEVERITY)) return fail("Choose how severe it is.");
    const path = (await rpc<Row[]>(session, "gnuhealth.pathology", "search_read", [[["code", "=", code]], 0, 1, null, ["id"]]))[0];
    if (!path) return fail("That diagnosis code was not found.", 404);
    const dup = await rpc<number[]>(session, "gnuhealth.patient.disease", "search", [[["patient", "=", patientId], ["pathology", "=", path.id], ["is_allergy", "=", true], ["is_active", "=", true]]]);
    if (dup.length) return fail("This allergy is already recorded and active for the patient.", 409);
    const created = await rpc<number[]>(session, "gnuhealth.patient.disease", "create", [[{
      patient: patientId, pathology: path.id, is_allergy: true, is_active: true, status: "c", allergy_type: body.kind, disease_severity: body.severity,
      short_comment: text(body.note, 200), healthprof: session.healthprofId || undefined,
    }]]);
    if (body.severity === "3_sv") await rpc(session, "gnuhealth.patient", "write", [[patientId], { crit_allergic: true }]).catch(() => undefined);
    return NextResponse.json({ success: true, allergyId: created[0], message: "Allergy recorded." });
  } catch (err) {
    return errorResponse(err, "Allergy transaction failed");
  }
}
