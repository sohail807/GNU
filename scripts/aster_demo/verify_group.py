"""Group-level acceptance checks for the `aster` tenant (read-only, through the app API).

    python verify_group.py <admin_creds.json> <staff_dubai.json> <staff_doha.json>

Proves the multi-hospital design: each hospital sees only its own beds, staff cannot cross hospitals,
a group user can switch, prices and currencies are per hospital, and the group overview adds up.
"""
import json
import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))
from aster_demo.client import AppClient  # noqa: E402

results = []


def check(label, ok, detail=""):
    print(f"  [{'PASS' if ok else 'FAIL'}] {label} {detail}")
    results.append(bool(ok))


def beds(c):
    _, r = c.get("/api/clinical/inpatient")
    return [b["name"] for b in (r.get("beds") or [])]


def main():
    admin_creds = json.load(open(sys.argv[1], encoding="utf-8"))
    dxb = json.load(open(sys.argv[2], encoding="utf-8"))
    doh = json.load(open(sys.argv[3], encoding="utf-8"))
    pick = lambda staff, role: next(s for s in staff if s["role"] == role)
    print("== Aster group tenant")

    g = AppClient("aster", admin_creds["adminUsername"], admin_creds["adminPassword"])
    _, me = g.get("/api/auth/me")
    names = [h["name"] for h in (me["user"].get("hospitals") or [])]
    check("group user belongs to both hospitals", len(names) == 2, f"({names})")

    d_nurse = AppClient("aster", pick(dxb, "nursing")["username"], pick(dxb, "nursing")["password"])
    h_nurse = AppClient("aster", pick(doh, "nursing")["username"], pick(doh, "nursing")["password"])
    _, m1 = d_nurse.get("/api/auth/me"); _, m2 = h_nurse.get("/api/auth/me")
    check("Dubai nurse lands in Dubai", "Dubai" in (m1["user"].get("hospitalName") or ""), f"({m1['user'].get('hospitalName')})")
    check("Doha nurse lands in Doha", "Doha" in (m2["user"].get("hospitalName") or ""), f"({m2['user'].get('hospitalName')})")

    db, hb = beds(d_nurse), beds(h_nurse)
    check("Dubai nurse sees only Dubai beds", db and all(b.startswith("DXB") for b in db), f"({len(db)} beds)")
    check("Doha nurse sees only Doha beds", hb and all(b.startswith("DOH") for b in hb), f"({len(hb)} beds)")
    check("bed counts match the hospitals (60 and 50)", (len(db), len(hb)) == (60, 50))

    st, r = d_nurse.post("/api/auth/hospital", {"hospitalId": "aster-doha"})
    check("Dubai nurse cannot switch to Doha", st in (400, 403), f"(HTTP {st})")
    st, r = g.post("/api/auth/hospital", {"hospitalId": "aster-doha"})
    check("group user can switch to Doha", st == 200)
    check("after switching, group user sees Doha beds only", all(b.startswith("DOH") for b in beds(g)))
    g.post("/api/auth/hospital", {"hospitalId": "aster-dubai"})

    # appointments and clinicians are per hospital (the front desk holds the appointment desk)
    d_fd = AppClient("aster", pick(dxb, "reception")["username"], pick(dxb, "reception")["password"])
    h_fd = AppClient("aster", pick(doh, "reception")["username"], pick(doh, "reception")["password"])
    _, ra = d_fd.get("/api/clinical/appointments?type=physicians")
    _, rb = h_fd.get("/api/clinical/appointments?type=physicians")
    da, ha = {p["name"] for p in (ra.get("physicians") or [])}, {p["name"] for p in (rb.get("physicians") or [])}
    check("clinician lists are per hospital and do not overlap", da and ha and not (da & ha), f"({len(da)} Dubai, {len(ha)} Doha)")

    # lab, imaging and pharmacy worklists are per hospital (scoped through the requesting doctor)
    def worklist_ids(staff, role, path, key):
        c = AppClient("aster", pick(staff, role)["username"], pick(staff, role)["password"])
        _, r = c.get(path)
        return {(o.get("orderRef") or o.get("orderNumber") or o.get("id")) for o in (r.get(key) or [])}
    for label, role, path, key in (("lab", "lab", "/api/clinical/laboratory", "labOrders"),
                                   ("imaging", "radiology", "/api/clinical/radiology", "radiologyOrders"),
                                   ("pharmacy", "cashier", "/api/clinical/pharmacy", "prescriptions")):
        a, b = worklist_ids(dxb, role, path, key), worklist_ids(doh, role, path, key)
        check(f"{label} worklists are separate per hospital", a and b and not (a & b), f"({len(a)} Dubai, {len(b)} Doha, {len(a & b)} shared)")

    # prices and currency per hospital
    _, sa = AppClient("aster", pick(dxb, "cashier")["username"], pick(dxb, "cashier")["password"]).get("/api/clinical/billing")
    _, sb = AppClient("aster", pick(doh, "cashier")["username"], pick(doh, "cashier")["password"]).get("/api/clinical/billing")
    pa = {s["name"]: s["price"] for s in (sa.get("services") or [])}; pb = {s["name"]: s["price"] for s in (sb.get("services") or [])}
    common = [n for n in pa if n in pb and pa[n] != pb[n]]
    check("services are priced per hospital (Dubai AED, Doha QAR)", len(common) >= 20, f"({len(common)} services differ, e.g. CT {pa.get('CT Scan')} vs {pb.get('CT Scan')})")

    # group overview adds up
    _, ov = g.get("/api/group/overview")
    hs = ov.get("hospitals") or []
    check("group overview lists both hospitals without errors", len(hs) == 2 and not any(h.get("error") for h in hs))
    check("overview currencies are AED and QAR", sorted(h.get("currency") for h in hs) == ["AED", "QAR"], f"({[h.get('currency') for h in hs]})")
    check("overview beds equal the real bed counts", sorted(h.get("beds") for h in hs) == [50, 60])
    check("overview shows occupied beds in both", all((h.get("occupiedBeds") or 0) > 0 for h in hs), f"({[h.get('occupancy') for h in hs]}%)")

    # hospital staff must not reach the group overview
    st, _r = d_nurse.get("/api/group/overview")
    check("single-hospital staff cannot open the group overview", st == 403, f"(HTTP {st})")

    print(f"== {sum(results)}/{len(results)} group checks passed")
    return 0 if all(results) else 1


if __name__ == "__main__":
    sys.exit(main())
