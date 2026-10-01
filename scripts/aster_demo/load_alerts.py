"""Load synthetic laboratory results (some out of range, so result alerts are raised by the app's own logic) and
pharmacy purchase requests for one Aster hospital, through the app API.

    python load_alerts.py <profile> <staff.json> --gulf

Lab results are created as real requests, saved with analyte values through the laboratory screen's own action, so the
alert rules (reference range check, 30% = critical) run exactly as they would for a technologist. Synthetic only.
"""
import json
import os
import random
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))
from aster_demo.client import load_profiles, open_session  # noqa: E402


def first(staff, role):
    return next(s for s in staff if s["role"] == role)


def main():
    args = [a for a in sys.argv[1:] if not a.startswith("--")]
    code, staff_path = args[:2]
    prof = load_profiles("--gulf" in sys.argv)[code]
    staff = json.load(open(staff_path, encoding="utf-8"))
    rng = random.Random(f"alerts-{code}")
    sess = {r: open_session(prof, code, first(staff, r)["username"], first(staff, r)["password"]) for r in ["lab", "physician", "cashier"]}
    out = {"results": 0, "alerts_raised": 0, "skipped": 0, "purchases": 0, "errors": 0}

    patients = sess["physician"].get("/api/clinical/emergency")[1].get("patients", [])
    for i in range(10):
        p = patients[(i * 5 + 2) % len(patients)]
        st, r = sess["lab"].post("/api/clinical/laboratory", {"action": "create", "patientId": p["id"], "test": ["Complete Blood Count", "Liver Function", "Lipid", "Thyroid"][i % 4]})
        if st != 200 or not r.get("success"):
            out["errors"] += 1
            print("  ! create", st, r.get("error"))
            continue
        lab_id = r["labId"]
        st, lst = sess["lab"].get("/api/clinical/laboratory")
        order = next((o for o in lst.get("labOrders", []) if o["id"] == lab_id), None)
        crit = (order or {}).get("criteria") or []
        if not crit:
            out["skipped"] += 1
            continue
        scenario = ["normal", "high", "very_high", "low", "very_low", "normal"][i % 6]
        rows = []
        for c in crit:
            lo, hi = c.get("lowerLimit"), c.get("upperLimit")
            if c.get("excluded"):
                rows.append({"id": c["id"], "result": None, "resultText": ""})
            elif lo is not None and hi is not None:
                mid, width = (lo + hi) / 2, hi - lo
                val = {"normal": mid, "high": hi + 0.1 * abs(hi), "very_high": hi + 0.5 * abs(hi), "low": lo - 0.1 * abs(lo), "very_low": lo - 0.5 * abs(lo)}[scenario]
                # only the first analyte carries the abnormal value; the rest stay normal
                rows.append({"id": c["id"], "result": round(val if c is crit[0] else mid, 2), "resultText": ""})
            else:
                rows.append({"id": c["id"], "result": None, "resultText": "Within normal limits"})
        st, r2 = sess["lab"].post("/api/clinical/laboratory", {"action": "save-results", "labId": lab_id, "criteria": rows, "results": "Synthetic demo result", "diagnosis": ""})
        if st == 200 and r2.get("success"):
            out["results"] += 1
            out["alerts_raised"] += r2.get("alertsRaised", 0)
        else:
            out["errors"] += 1
            print("  ! save-results", st, r2.get("error"))

    # purchase requests from low stock, ordered and received
    st, d = sess["cashier"].get("/api/clinical/purchases")
    if st == 200 and d.get("success"):
        for i, sug in enumerate(d["suggestions"][:8]):
            s1, r = sess["cashier"].post("/api/clinical/purchases", {"action": "create", "medicineId": sug["medicineId"], "quantity": sug["suggested"], "reason": "low_stock"})
            if s1 != 200 or not r.get("success"):
                out["errors"] += 1
                continue
            out["purchases"] += 1
            if i % 3 >= 1:
                sess["cashier"].post("/api/clinical/purchases", {"action": "order", "id": r["requestId"], "supplier": rng.choice(["Gulf Pharma Distribution", "Al Noor Medical Supplies"])})
            if i % 3 == 2:
                from datetime import date, timedelta
                sess["cashier"].post("/api/clinical/purchases", {"action": "receive", "id": r["requestId"], "batch": f"B{rng.randint(1000, 9999)}",
                                                                   "expiry": (date.today() + timedelta(days=540)).isoformat(), "quantity": sug["suggested"], "reorderLevel": 20})
    else:
        print("  ! purchases not available:", st, d.get("error"))
    print(f"[{code}]", json.dumps(out))
    for c in sess.values():
        c.logout()


if __name__ == "__main__":
    main()
