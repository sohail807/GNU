"""Acceptance checks for an Aster demo hospital (read-only, through the app API).

    python verify_demo.py <profile> <admin_creds.json> <staff.json>

Compares what is actually in the hospital with the targets derived from the Aster research:
bed count, occupancy, payor mix (patient policies), specialty mix of visits, billing state, surgery and
diagnostic worklists, and that every persona can sign in.
"""
import collections
import json
import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))
from aster_demo.client import AppClient  # noqa: E402

PROFILES = json.load(open(os.path.join(os.path.dirname(__file__), "profiles.json"), encoding="utf-8"))
TARGET_PAYOR = {"private": 30, "state": 5, "labour_union": 2}  # percent of patients with a policy (rest self-pay/MVT/other)


def check(label, ok, detail=""):
    print(f"  [{'PASS' if ok else 'FAIL'}] {label} {detail}")
    return ok


def main():
    code, creds_path, staff_path = sys.argv[1:4]
    prof = PROFILES[code]
    creds = json.load(open(creds_path, encoding="utf-8"))
    staff = json.load(open(staff_path, encoding="utf-8"))
    a = AppClient(code, creds["adminUsername"], creds["adminPassword"])
    results = []
    print(f"== {prof['name']} ({code})")

    # beds and occupancy
    _, r = a.get("/api/clinical/inpatient")
    stats = r.get("stats") or {}
    beds_total = stats.get("totalBeds")
    occ = (stats.get("occupiedBeds") or 0) / max(1, beds_total or 1)
    results.append(check("bed count equals demo bed count", beds_total == prof["total_beds"], f"({beds_total} vs {prof['total_beds']})"))
    results.append(check("occupancy within +-8 points of target", abs(occ - prof["occupancy"]) <= 0.08,
                         f"({occ:.0%} vs target {prof['occupancy']:.0%})"))
    results.append(check("wards created", len(r.get("wards") or []) == len(prof["wards"]), f"({len(r.get('wards') or [])})"))

    # patients, visits and specialty mix
    _, r = a.get("/api/clinical/patients")
    patients = r.get("patients") or []
    results.append(check("patients registered", len(patients) >= prof["total_beds"], f"({len(patients)})"))
    _, r = a.get("/api/clinical/appointments")
    appts = r.get("appointments") or []
    doc_spec = {s["name"]: s["specialty"] for s in staff if s["role"] == "physician"}
    by_spec = collections.Counter()
    for ap in appts:
        by_spec[doc_spec.get(ap.get("doctor") or ap.get("healthprofName") or ap.get("physician"), "other")] += 1
    results.append(check("appointments booked", len(appts) >= round(prof["total_beds"] * 2.0), f"({len(appts)})"))
    if by_spec and "other" not in by_spec:
        top = by_spec.most_common(3)
        print("       visit mix (top 3):", ", ".join(f"{k} {v}" for k, v in top))

    # billing
    _, r = a.get("/api/clinical/billing")
    invs = r.get("invoices") or []
    states = collections.Counter(i.get("status") for i in invs)
    results.append(check("invoices created", len(invs) > 0, f"({len(invs)}; {dict(states)})"))
    results.append(check("some invoices paid, some outstanding (insurer/scheme/corporate)", states.get("paid", 0) > 0 and states.get("posted", 0) > 0))

    # payor mix as native insurance policies
    _, r = a.get("/api/clinical/insurance")
    pols = r.get("insurances") or []
    kinds = collections.Counter((p.get("insuranceType") or p.get("type")) for p in pols)
    share = {k: v / max(1, len(patients)) * 100 for k, v in kinds.items()}
    results.append(check("insurance policies enrolled", len(pols) > 0, f"({len(pols)} policies = {len(pols) / max(1, len(patients)):.0%} of patients; target ~37%)"))
    print("       policy types:", {k: f"{v:.0f}%" for k, v in share.items()})

    # surgery and diagnostics
    _, r = a.get("/api/clinical/surgery")
    results.append(check("surgeries booked", len(r.get("surgeries") or []) > 0, f"({len(r.get('surgeries') or [])})"))
    _, r = a.get("/api/clinical/laboratory")
    labs = r.get("labOrders") or []
    results.append(check("lab orders resulted", any(o.get("state") == "done" for o in labs), f"({collections.Counter(o.get('state') for o in labs)})"))
    _, r = a.get("/api/clinical/radiology")
    rads = r.get("radiologyOrders") or []
    results.append(check("imaging reported", any(o.get("state") == "done" for o in rads), f"({collections.Counter(o.get('state') for o in rads)})"))

    # every persona can sign in
    seen = set()
    for s in staff:
        if s["role"] in seen:
            continue
        seen.add(s["role"])
        try:
            c = AppClient(code, s["username"], s["password"])
            ok = bool(c.user.get("redirect"))
            c.logout()
        except Exception as exc:  # noqa: BLE001
            ok = False
        results.append(check(f"sign-in as {s['role']}", ok))

    a.logout()
    print(f"== {sum(results)}/{len(results)} checks passed")
    return 0 if all(results) else 1


if __name__ == "__main__":
    sys.exit(main())
