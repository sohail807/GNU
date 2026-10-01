"""Give the Aster tenant its real names (no "demo" or "synthetic" in any visible name), through the app's admin API.

    python rename_tenant.py <admin_creds.json> <ceo_user_id>

Renames the two hospitals (company + institution + registry), the customer, the group executive's display name and every
insurer / payor whose name carries a "(demo)" or "(synthetic...)" tag. Safe to run again.
"""
import json
import os
import re
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))
from aster_demo.client import AppClient  # noqa: E402

HOSPITALS = {"aster-dubai": "Aster Hospital Al Qusais, Dubai", "aster-doha": "Aster Hospital Doha"}
CUSTOMER = "Aster Hospitals Gulf"
CEO_NAME = "Group Chief Executive"
TAG = re.compile(r"\s*\((?:demo|synthetic[^)]*)\)\s*$", re.I)


def main():
    creds = json.load(open(sys.argv[1], encoding="utf-8"))
    ceo_id = int(sys.argv[2])
    admin = AppClient("aster", creds["adminUsername"], creds["adminPassword"])
    done = 0

    def call(path, payload):
        nonlocal done
        st, r = admin.post(path, payload)
        ok = st == 200 and r.get("success")
        print(f"  {'ok ' if ok else 'ERR'} {payload.get('action', 'update_user')} {payload.get('name', '')}: {r.get('message') or r.get('error')}")
        done += 1 if ok else 0
        return ok

    for hid, name in HOSPITALS.items():
        call("/api/admin/organization", {"action": "rename_hospital", "hospitalId": hid, "name": name})
    call("/api/admin/organization", {"action": "rename_customer", "name": CUSTOMER})
    call("/api/admin/users", {"action": "update_user", "userId": ceo_id, "name": CEO_NAME})

    # every insurer / payor party, whichever hospital's list it shows in
    seen = {}
    for hid in HOSPITALS:
        admin.post("/api/auth/hospital", {"hospitalId": hid})
        _, r = admin.get("/api/clinical/insurance")
        for c in r.get("insuranceCompanies", []):
            seen[c["id"]] = c["name"]
    for pid, old in seen.items():
        new = TAG.sub("", old).strip()
        if new != old:
            call("/api/admin/organization", {"action": "rename_insurer", "partyId": pid, "name": new})
    print(f"done: {done} change(s)")


if __name__ == "__main__":
    main()
