"""Bring one hospital's worklists to a realistic end state (idempotent, through the app API).

    python finalize.py <profile> <admin_creds.json> <staff.json> --gulf [--dispense 0.7]

* lab: every order still waiting is resulted by the hospital's lab technologist
* imaging: every order still waiting is reported by the radiologist
* pharmacy: about 70% of pending prescriptions are dispensed (the rest stay in the queue, as in a real pharmacy)
Because worklists are now scoped to the signed-in hospital, each hospital only touches its own orders.
"""
import json
import os
import random
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))
from aster_demo.client import load_profiles, open_session  # noqa: E402


def main():
    args = [a for a in sys.argv[1:] if not a.startswith("--")]
    gulf = "--gulf" in sys.argv
    dispense_share = float(sys.argv[sys.argv.index("--dispense") + 1]) if "--dispense" in sys.argv else 0.7
    if "--dispense" in sys.argv:
        args = [a for a in args if a != sys.argv[sys.argv.index("--dispense") + 1]]
    code, creds_path, staff_path = args[:3]
    prof = load_profiles(gulf)[code]
    staff = json.load(open(staff_path, encoding="utf-8"))
    rng = random.Random(f"finalize-{code}")
    first = lambda role: next(s for s in staff if s["role"] == role)
    sess = lambda role: open_session(prof, code, first(role)["username"], first(role)["password"])
    out = {}

    lab = sess("lab")
    _, r = lab.get("/api/clinical/laboratory")
    todo = [o for o in (r.get("labOrders") or []) if o.get("state") != "done" and o.get("id")]
    ok = 0
    for o in todo:
        st, rr = lab.post("/api/clinical/laboratory", {"action": "certify", "orderId": o["id"],
                                                         "results": "All analytes within reference range. Certified (synthetic)."})
        ok += 1 if (st == 200 and rr.get("success")) else 0
    out["lab_resulted"] = f"{ok}/{len(todo)}"

    rad = sess("radiology")
    _, r = rad.get("/api/clinical/radiology")
    todo = [o for o in (r.get("radiologyOrders") or []) if o.get("state") != "done" and o.get("id")]
    ok = 0
    for o in todo:
        st, rr = rad.post("/api/clinical/radiology", {"action": "sign", "orderId": o["id"],
                                                        "findings": "No acute abnormality. Report signed (synthetic)."})
        ok += 1 if (st == 200 and rr.get("success")) else 0
    out["imaging_reported"] = f"{ok}/{len(todo)}"

    pharm = sess("cashier")      # cashiers hold the pharmacy module in the role table
    _, r = pharm.get("/api/clinical/pharmacy")
    pending = [p for p in (r.get("prescriptions") or []) if p.get("state") in ("draft", "invoiced") and p.get("id")]
    rng.shuffle(pending)
    take = pending[: round(len(pending) * dispense_share)]
    ok = 0
    for p in take:
        st, rr = pharm.post("/api/clinical/pharmacy", {"prescriptionId": p["id"], "verificationNotes": "Checked against the prescription (synthetic)."})
        ok += 1 if (st == 200 and rr.get("success")) else 0
    out["prescriptions_dispensed"] = f"{ok}/{len(pending)} pending ({round(dispense_share * 100)}% target)"
    print(f"[{code}]", json.dumps(out))


if __name__ == "__main__":
    main()
