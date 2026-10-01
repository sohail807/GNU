import { NextRequest, NextResponse } from "next/server";
import { errorResponse, fail, guard, idOf, names, patientInfo, positiveId, recentPatients, rpc, stamp, text, Row } from "@/lib/ops-api";

// Maternity: delivery record (type, outcome, weight, Apgar, mother's condition), newborn registered as a patient of
// the group and linked to the mother's record, NICU flag. Records are native Tryton ist.ops.delivery rows.

const M = "ist.ops.delivery";
const MODULES = ["obstetrics", "physician", "nursing"] as const;

export async function GET() {
  const g = await guard([...MODULES]);
  if ("response" in g) return g.response;
  const { session } = g;
  try {
    const rows = await rpc<Row[]>(session, M, "search_read", [[["company", "=", session.companyId]], 0, 300, [["id", "DESC"]],
      ["id", "reference", "mother", "delivered_at", "delivery_type", "outcome", "baby_sex", "birth_weight_g", "apgar_1", "apgar_5", "mother_condition", "nicu", "baby", "obstetrician", "state", "note"]]);
    const ids = [...new Set(rows.flatMap((r) => [idOf(r.mother), idOf(r.baby)]).filter((x): x is number => !!x))];
    const pats = await patientInfo(session, ids);
    const docRows = await rpc<Row[]>(session, "gnuhealth.healthprofessional", "search_read", [[], 0, 100, null, ["id", "name"]]).catch(() => []);
    const docParties = await names(session, "party.party", docRows.map((d) => idOf(d.name)).filter((x): x is number => !!x));
    const doctors = docRows.map((d) => ({ id: d.id as number, name: docParties[idOf(d.name) as number]?.name || `Clinician ${d.id}` }));
    const docName = Object.fromEntries(doctors.map((d) => [d.id, d.name]));
    const deliveries = rows.map((r) => ({
      id: r.id, reference: r.reference, state: r.state, motherId: idOf(r.mother), mother: pats[idOf(r.mother) as number]?.name || "", motherPuid: pats[idOf(r.mother) as number]?.puid || null,
      deliveredAt: stamp(r.delivered_at), type: r.delivery_type, outcome: r.outcome, babySex: r.baby_sex || null, weight: r.birth_weight_g ?? null, apgar1: r.apgar_1 ?? null, apgar5: r.apgar_5 ?? null,
      motherCondition: r.mother_condition || null, nicu: !!r.nicu, babyId: idOf(r.baby), baby: pats[idOf(r.baby) as number]?.name || null, babyPuid: pats[idOf(r.baby) as number]?.puid || null,
      obstetrician: docName[idOf(r.obstetrician) as number] || null, note: r.note || null,
    }));
    const live = deliveries.filter((d) => d.outcome === "live_birth");
    return NextResponse.json({
      success: true, deliveries, doctors, patients: await recentPatients(session),
      summary: {
        deliveries: deliveries.length, caesarean: deliveries.filter((d) => d.type === "caesarean").length,
        caesareanRate: deliveries.length ? Math.round((deliveries.filter((d) => d.type === "caesarean").length / deliveries.length) * 100) : 0,
        nicu: deliveries.filter((d) => d.nicu).length, newbornsToRegister: live.filter((d) => !d.babyId).length,
        lowWeight: live.filter((d) => d.weight != null && d.weight < 2500).length,
      },
    });
  } catch (err) {
    return errorResponse(err, "Failed to load deliveries");
  }
}

export async function POST(req: NextRequest) {
  const g = await guard([...MODULES]);
  if ("response" in g) return g.response;
  const { session } = g;
  try {
    const body = await req.json();
    const action = String(body.action || "");
    if (action === "record") {
      const motherId = positiveId(body.motherId);
      if (!motherId) return fail("Choose the mother.");
      if (!["normal", "assisted", "caesarean"].includes(body.deliveryType)) return fail("Choose the type of delivery.");
      if (!["live_birth", "stillbirth"].includes(body.outcome)) return fail("Choose the outcome.");
      const int = (v: unknown) => (v === "" || v == null || !Number.isFinite(Number(v)) ? undefined : Math.round(Number(v)));
      const created = await rpc<number[]>(session, M, "create", [[{
        mother: motherId, company: session.companyId, institution: session.institutionId || undefined, delivery_type: body.deliveryType, outcome: body.outcome,
        baby_sex: ["m", "f"].includes(body.babySex) && body.outcome === "live_birth" ? body.babySex : undefined, birth_weight_g: int(body.weight),
        apgar_1: int(body.apgar1), apgar_5: int(body.apgar5), mother_condition: text(body.motherCondition, 120), nicu: !!body.nicu,
        obstetrician: positiveId(body.obstetricianId) || undefined, note: text(body.note, 500),
      }]]);
      return NextResponse.json({ success: true, deliveryId: created[0], message: "Delivery recorded." });
    }
    const id = positiveId(body.id);
    if (!id) return fail("Delivery is required.");
    const d = await rpc<number[]>(session, M, "search", [[["id", "=", id], ["company", "=", session.companyId]]]);
    if (!d.length) return fail("Delivery not found in this hospital.", 404);
    if (action === "link_baby") {
      const babyId = positiveId(body.babyId);
      if (!babyId) return fail("The newborn record is required.");
      await rpc(session, M, "write", [[id], { baby: babyId, state: "newborn_registered" }]);
      return NextResponse.json({ success: true, message: "Newborn registered and linked to the mother's record." });
    }
    if (action === "close") {
      await rpc(session, M, "write", [[id], { state: "closed" }]);
      return NextResponse.json({ success: true, message: "Delivery record closed." });
    }
    return fail(`Unsupported action: ${action}`);
  } catch (err) {
    return errorResponse(err, "Delivery transaction failed");
  }
}
