"""Load synthetic insurer pre-authorizations and claims for one Aster hospital (through the app API, so every record
passes the same validation as the screens).

    python load_claims.py <profile> <staff.json> --gulf

Works on the invoices and policies already in the hospital; safe to run once per hospital (it skips invoices that
already have a claim). Insurer names, approval numbers and reasons are synthetic.
"""
import json
import os
import random
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))
from aster_demo.client import load_profiles, open_session  # noqa: E402

REJECT_AUTH = ["Service not covered under the member's plan", "Medical necessity not established; clinical notes requested",
               "Member is in the waiting period for this benefit"]
REJECT_CLAIM = ["Duplicate submission", "Pre-authorization number missing", "Treatment outside the policy network"]
QUERY = ["Please send the discharge summary", "Itemised bill and lab reports needed", "Clarify the length of stay"]
SERVICES = {
    "outpatient": ["Specialist consultation - Cardiology", "Specialist consultation - Orthopaedics", "Follow-up consultation"],
    "imaging": ["MRI Scan - Lumbar spine", "CT Scan - Abdomen", "Ultrasound - Pelvis"],
    "medication": ["Biologic therapy - monthly", "Insulin pump supplies"],
    "inpatient": ["Planned admission - 3 nights, private room", "Admission - observation, 2 nights"],
    "procedure": ["Laparoscopic cholecystectomy", "Knee arthroscopy", "Coronary angiography", "Caesarean section"],
}


def main():
    args = [a for a in sys.argv[1:] if not a.startswith("--")]
    code, staff_path = args[:2]
    prof = load_profiles("--gulf" in sys.argv)[code]
    staff = json.load(open(staff_path, encoding="utf-8"))
    rng = random.Random(f"claims-{code}")
    cashier = next(s for s in staff if s["role"] == "cashier")
    c = open_session(prof, code, cashier["username"], cashier["password"])
    out = {"auth": 0, "auth_failed": 0, "claim": 0, "claim_failed": 0}

    status, data = c.get("/api/clinical/claims")
    if status != 200 or not data.get("success"):
        raise SystemExit(f"claims API not ready: {status} {data}")
    policies, invoices = data["policies"], data["claimableInvoices"]
    if not policies:
        raise SystemExit("no insurance policies in this hospital")

    def act(kind, payload):
        st, r = c.post("/api/clinical/claims", payload)
        ok = st == 200 and r.get("success")
        out[kind + ("" if ok else "_failed")] += 1
        return r if ok else None

    # pre-authorizations, in every state a desk sees
    plan = ["approved"] * 6 + ["partial"] * 2 + ["rejected"] * 2 + ["submitted"] * 4 + ["draft"] * 2
    for i, final in enumerate(plan):
        pol = policies[(i * 3) % len(policies)]
        kind = rng.choice(list(SERVICES))
        asked = round(rng.choice([450, 900, 1800, 3500, 8000, 15000, 32000]) * (1 + rng.random() / 4), -1)
        r = act("auth", {"action": "create_authorization", "insuranceId": pol["id"], "authType": kind, "service": rng.choice(SERVICES[kind]),
                         "diagnosis": "Synthetic", "requestedAmount": asked, "submit": final != "draft"})
        if not r:
            continue
        aid = r["authorizationId"]
        ref = f"INS-{rng.randint(100000, 999999)}"
        if final == "approved":
            act("auth", {"action": "authorization_action", "id": aid, "step": "approve", "approvedAmount": asked, "insurerReference": ref})
        elif final == "partial":
            act("auth", {"action": "authorization_action", "id": aid, "step": "partial", "approvedAmount": round(asked * 0.7, 2), "insurerReference": ref,
                         "note": "Room upgrade not covered"})
        elif final == "rejected":
            act("auth", {"action": "authorization_action", "id": aid, "step": "reject", "note": rng.choice(REJECT_AUTH)})

    # claims on the hospital's posted invoices
    _, data = c.get("/api/clinical/claims")
    approved = [a["id"] for a in data["authorizations"] if a["state"] in ("approved", "partial")]
    plan = ["draft"] * 4 + ["submitted"] * 12 + ["queried"] * 4 + ["approved"] * 6 + ["partially_paid"] * 4 + ["paid"] * 6 + ["rejected"] * 4
    for inv, final in zip(invoices, plan):
        r = act("claim", {"action": "create_claim", "invoiceId": inv["id"], "authorizationId": rng.choice(approved) if approved and rng.random() < 0.4 else None,
                          "submit": final != "draft"})
        if not r:
            continue
        cid, amt = r["claimId"], inv["amount"]
        step = lambda s, **kw: act("claim", {"action": "claim_action", "id": cid, "step": s, **kw})  # noqa: E731
        if final == "queried":
            step("query", note=rng.choice(QUERY))
        elif final == "rejected":
            step("reject", note=rng.choice(REJECT_CLAIM))
        elif final in ("approved", "partially_paid", "paid"):
            ok = round(amt * rng.choice([1.0, 1.0, 0.9]), 2)
            step("approve", approvedAmount=ok)
            if final == "partially_paid":
                step("settle", amount=round(ok * 0.5, 2))
            elif final == "paid":
                step("settle", amount=ok)
    print(f"[{code}]", json.dumps(out))
    c.logout()


if __name__ == "__main__":
    main()
