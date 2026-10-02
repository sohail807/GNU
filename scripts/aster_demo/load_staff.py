"""Create synthetic staff for one Aster demo hospital through the app's own admin API.

Uses /api/admin/users add_user (random temporary password, clinicians linked to a health professional)
and /api/clinical/staff add_specialty. Writes the generated logins to a PRIVATE json file that must stay
out of git:  python load_staff.py <profile> <admin_creds.json> <out_staff.json>
"""
import json
import os
import random
import sys
import time

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))
from aster_demo.client import AppClient, load_profiles, open_session  # noqa: E402
from aster_demo.names import person as gulf_person  # noqa: E402


# profile specialty label -> GNU Health specialty catalogue name
SPECIALTY_MAP = {
    "General Medicine": "Internal Medicine", "Cardiology": "Cardiology", "Neurology": "Neurology",
    "Oncology": "Oncology", "Gastroenterology": "Gastroenterology", "Orthopaedics": "Orthopedic surgery",
    "Nephrology": "Nephrology", "Urology": "Urology", "Obstetrics and Gynaecology": "Obstetrics and gynecology",
    "Paediatrics": "Pediatrics", "General Surgery": "General surgery", "Emergency Medicine": "Emergency medicine",
    "ENT": "Otolaryngology - ENT", "Dental": "Stomatology",
    "Anaesthesiology": "Anesthesiology",
}
MALE = ["Arjun", "Rohan", "Vikram", "Suresh", "Anil", "Manoj", "Rajesh", "Karthik", "Naveen", "Pradeep", "Sanjay", "Imran",
        "Joseph", "Thomas", "George", "Abdul", "Harish", "Dinesh", "Mahesh", "Ravi", "Sunil", "Deepak", "Faisal", "Varun"]
FEMALE = ["Priya", "Anitha", "Deepa", "Lakshmi", "Meera", "Neha", "Divya", "Sneha", "Fathima", "Maya", "Kavya", "Rekha",
          "Sandhya", "Swathi", "Anju", "Revathi", "Nisha", "Shalini", "Geetha", "Pooja", "Smitha", "Asha", "Remya", "Bindu"]
SURNAMES = ["Nair", "Menon", "Pillai", "Iyer", "Reddy", "Rao", "Kumar", "Sharma", "Varghese", "Joseph", "Thomas", "George",
            "Mathew", "Krishnan", "Naidu", "Gowda", "Hegde", "Kamath", "Shetty", "Patil", "Kulkarni", "Khan", "Siddiqui",
            "Chandran", "Warrier", "Namboothiri", "Raman", "Subramanian", "Das", "Bose", "Mukherjee", "Banerjee"]


def main():
    args = [a for a in sys.argv[1:] if a not in ("--gulf", "--resume")]
    gulf = "--gulf" in sys.argv
    resume = "--resume" in sys.argv
    code, creds_path, out_path = args[0], args[1], args[2]
    prof = load_profiles(gulf)[code]
    creds = json.load(open(creds_path, encoding="utf-8"))
    rng = random.Random(f"aster-staff-{code}")
    used = set()

    def person(gender, role="other"):
        for _ in range(300):
            if gulf:
                mix = {"physician": [["indian", 48], ["arab_levant_egypt", 32], ["western", 10], ["pakistani", 6], ["srilankan", 4]],
                       "nursing": [["filipino", 38], ["indian", 47], ["arab_levant_egypt", 15]]}.get(role, prof["nationalities"])
                total = sum(w for _, w in mix); x = rng.uniform(0, total)
                for nat, w in mix:
                    x -= w
                    if x <= 0:
                        break
                name = gulf_person(rng, nat, "Male" if gender == "m" else "Female")
            else:
                first = rng.choice(MALE if gender == "m" else FEMALE)
                name = f"{first} {rng.choice(SURNAMES)}"
            if name not in used:
                used.add(name)
                return name
        raise RuntimeError("name pool exhausted")

    plan = []  # (role, specialty or None, count)
    for spec, n in prof["doctors"].items():
        plan.append(("physician", spec, n))
    plan += [("nursing", None, prof["nurses"]), ("reception", None, prof["frontdesk"]), ("cashier", None, prof["cashiers"]),
             ("accountant", None, prof["accountants"]), ("lab", None, prof["lab"]), ("radiology", None, prof["radiology"])]

    existing = {}
    if resume and os.path.exists(out_path):
        existing = {m["username"]: m for m in json.load(open(out_path, encoding="utf-8"))}
        print(f"[{code}] resuming: {len(existing)} accounts already created")
    admin = open_session(prof, code, creds["adminUsername"], creds["adminPassword"])
    prefix = prof["short"]
    counters, staff_out, failures = {}, [], []
    for role, spec, n in plan:
        for _ in range(n):
            counters[role] = counters.get(role, 0) + 1
            gender = rng.choice(["m", "f"])
            name = person(gender, role)
            username = f"{prefix}_{ {'physician': 'dr', 'nursing': 'rn', 'reception': 'fd', 'cashier': 'cs', 'accountant': 'ac', 'lab': 'lb', 'radiology': 'rd'}[role] }{counters[role]:02d}"
            if username in existing:
                staff_out.append(existing[username])   # drawn from the same seeded sequence, so names stay identical
                continue
            for attempt in range(4):                    # concurrent loads can clash on the database: retry
                st, r = admin.post("/api/admin/users", {"action": "add_user", "username": username, "name": name,
                                                          "role": role, "gender": gender, "email": f"{username}@demo.invalid"})
                if st == 200 and r.get("success"):
                    break
                if "serialize" not in str(r.get("error", "")):
                    break
                time.sleep(2 * (attempt + 1))
            if st != 200 or not r.get("success"):
                failures.append((username, role, st, r.get("error")))
                continue
            staff_out.append({"username": username, "password": r["temporaryPassword"], "name": name, "role": role,
                              "specialty": spec, "userId": r.get("userId")})
    print(f"[{code}] users created: {len(staff_out)}; failures: {len(failures)}")
    for f in failures[:5]:
        print("   FAIL", f)

    # specialties for clinicians
    st, r = admin.get("/api/clinical/staff")
    by_name = {s["name"]: s["id"] for s in r.get("staff", [])}
    catalog = {x["name"]: x["id"] for x in r.get("specialtyCatalog", [])}
    assigned = 0
    for s in staff_out:
        if s["role"] != "physician":
            continue
        hp = by_name.get(s["name"])
        sp = catalog.get(SPECIALTY_MAP[s["specialty"]])
        s["healthprofId"] = hp
        if hp and sp and not s.get("specialtyDone"):
            st, rr = admin.post("/api/clinical/staff", {"action": "add_specialty", "healthprofId": hp, "specialtyId": sp, "isMain": True})
            if st == 200 and rr.get("success"):
                s["specialtyDone"] = True
                assigned += 1
    print(f"[{code}] specialties assigned: {assigned}")
    json.dump(staff_out, open(out_path, "w", encoding="utf-8"), indent=1)
    os.chmod(out_path, 0o600)
    admin.logout()


if __name__ == "__main__":
    main()
