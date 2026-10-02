"""Load synthetic hospital-operations data for one Aster hospital through the app API: pharmacy stock, emergency
department visits, admission plans, discharge clearances. Referrals between the two hospitals are loaded by --referrals.

    python load_ops.py <profile> <staff.json> --gulf
    python load_ops.py --referrals <dubai-profile> <dubai-staff.json> <doha-profile> <doha-staff.json> --gulf

Run the hospital load first, then --referrals once both hospitals are loaded. Everything is synthetic.
"""
import json
import os
import random
import sys
from datetime import date, timedelta

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))
from aster_demo.client import load_profiles, open_session  # noqa: E402

COMPLAINTS = [
    ("Chest pain radiating to left arm", "1", "BP 90/60, HR 120, SpO2 93%", "ambulance"),
    ("Road traffic accident, leg injury", "2", "Conscious, deformity right tibia", "ambulance"),
    ("Severe abdominal pain, vomiting", "2", "Guarding in right iliac fossa", "walk_in"),
    ("Shortness of breath, known asthma", "2", "SpO2 90%, wheeze", "walk_in"),
    ("High fever for 3 days, child", "3", "Temp 39.8, alert", "walk_in"),
    ("Deep cut on hand while cooking", "3", "Bleeding controlled", "walk_in"),
    ("Persistent vomiting and diarrhoea", "3", "Mild dehydration", "walk_in"),
    ("Back pain after lifting", "4", "No red flags", "walk_in"),
    ("Sore throat and cough", "4", "Temp 37.9", "walk_in"),
    ("Ankle sprain", "4", "Weight bearing", "walk_in"),
    ("Prescription refill", "5", "Stable", "walk_in"),
    ("Mild headache", "5", "Stable", "walk_in"),
    ("Collapse at home, elderly", "1", "GCS 10, glucose 2.1", "ambulance"),
    ("Labour pains, 38 weeks", "2", "Contractions every 4 min", "walk_in"),
]
DISPOSITION = {"admit": "Admit under medicine for observation and treatment", "discharge": "Treated and discharged with advice",
               "transfer": "Needs a service not available here; transfer arranged"}
WARDS = [("Private Room", 4200, 2), ("Semi-Private Room", 2700, 3), ("ICU", 13500, 3), ("Deluxe Room", 9000, 2), ("General Ward", 1800, 4)]


def first(staff, role):
    return next(s for s in staff if s["role"] == role)


def sessions(prof, code, staff, roles):
    return {r: open_session(prof, code, first(staff, r)["username"], first(staff, r)["password"]) for r in roles}


def load_hospital(code, staff_path, gulf):
    prof = load_profiles(gulf)[code]
    staff = json.load(open(staff_path, encoding="utf-8"))
    rng = random.Random(f"ops-{code}")
    s = sessions(prof, code, staff, ["reception", "nursing", "physician", "cashier", "accountant"])
    out = {"stock": 0, "ed": 0, "plans": 0, "discharge": 0, "errors": 0}

    def call(role, path, payload):
        st, r = s[role].post(path, payload)
        ok = st == 200 and r.get("success")
        if not ok:
            out["errors"] += 1
            print(f"  ! {path} {payload.get('action')}: {st} {r.get('error')}")
        return r if ok else None

    # ---- pharmacy stock (cashier holds the pharmacy module) ----
    st, data = s["cashier"].get("/api/clinical/stock")
    if st == 200 and data.get("success") and data["batches"]:
        print("  stock already loaded, skipping")
    elif st == 200 and data.get("success"):
        meds = data["medicines"][:30]
        for i, m in enumerate(meds):
            expiry = date.today() + timedelta(days=rng.choice([30, 75, 200, 400, 600]))
            qty = rng.choice([8, 15, 60, 120, 300])
            if call("cashier", "/api/clinical/stock", {"action": "receive", "medicineId": m["id"], "batch": f"B{rng.randint(1000, 9999)}",
                    "expiry": expiry.isoformat(), "quantity": qty, "reorderLevel": 20, "supplier": rng.choice(["Gulf Pharma Distribution", "Al Noor Medical Supplies", "MedLine Trading"])}):
                out["stock"] += 1
    else:
        print("  ! stock module not available:", st, data.get("error"))

    # ---- emergency department ----
    st, data = s["reception"].get("/api/clinical/emergency")
    if st == 200 and data.get("success") and len(data["visits"]) >= 10:
        print("  emergency visits already loaded, skipping")
    elif st == 200 and data.get("success"):
        patients = data["patients"]
        # only a doctor's account can list the clinicians
        doctors = s["physician"].get("/api/clinical/emergency")[1].get("doctors") or [{"id": 0}]
        for i, (complaint, level, note, mode) in enumerate(COMPLAINTS):
            p = patients[(i * 7) % len(patients)]
            r = call("reception", "/api/clinical/emergency", {"action": "register", "patientId": p["id"], "complaint": complaint, "arrivalMode": mode})
            if not r:
                continue
            out["ed"] += 1
            vid = r["visitId"]
            final = ["waiting", "triaged", "treat", "treat", "observe", "admit", "discharge", "discharge", "transfer"][i % 9]
            if final == "waiting":
                continue
            call("nursing", "/api/clinical/emergency", {"action": "triage", "id": vid, "level": level, "note": note, "bay": f"Bay {i % 8 + 1}"})
            if final == "triaged":
                continue
            call("physician", "/api/clinical/emergency", {"action": "start", "id": vid, "doctorId": doctors[i % len(doctors)]["id"], "bay": f"Bay {i % 8 + 1}"})
            if final == "observe":
                call("physician", "/api/clinical/emergency", {"action": "observe", "id": vid})
            elif final in DISPOSITION:
                call("physician", "/api/clinical/emergency", {"action": final, "id": vid, "note": DISPOSITION[final]})
    else:
        print("  ! emergency module not available:", st, data.get("error"))

    # ---- admission plans ----
    st, data = s["cashier"].get("/api/clinical/admissions")
    if st == 200 and data.get("success"):
        patients = data["patients"]
        auths = data["authorizations"]
        for i in range(8):
            ward, rate, days = WARDS[i % len(WARDS)]
            payor = ["self", "insurance", "insurance", "corporate", "self", "insurance", "scheme", "insurance"][i]
            proc = rng.choice([0, 6500, 14000, 32000])
            advance = 0 if payor == "insurance" else round((rate * days + proc) * 0.3, -1)
            r = call("cashier", "/api/clinical/admissions", {"action": "create", "patientId": patients[(i * 11 + 3) % len(patients)]["id"], "payor": payor, "wardType": ward,
                     "expectedDays": days, "dailyRate": rate, "procedureCharges": proc, "advanceRequired": advance,
                     "authorizationId": auths[i % len(auths)]["id"] if payor == "insurance" and auths and i % 2 == 0 else None})
            if not r:
                continue
            out["plans"] += 1
            pid = r["planId"]
            stage = i % 4          # 0 estimate only, 1 advance received, 2 ready, 3 ready too
            if stage >= 1 and payor != "insurance":
                call("cashier", "/api/clinical/admissions", {"action": "deposit", "id": pid, "amount": advance})
            if stage >= 2:
                call("cashier", "/api/clinical/admissions", {"action": "ready", "id": pid})
    else:
        print("  ! admissions module not available:", st, data.get("error"))

    # ---- discharge clearances for some admitted patients ----
    st, data = s["physician"].get("/api/clinical/discharges")
    if st == 200 and data.get("success"):
        for i, c in enumerate(data["candidates"][:6]):
            r = call("physician", "/api/clinical/discharges", {"action": "start", "registrationId": c["registrationId"]})
            if not r:
                continue
            out["discharge"] += 1
            did = r["dischargeId"]
            signs = [("medical", "physician"), ("nursing", "nursing"), ("pharmacy", "cashier"), ("billing", "accountant"), ("insurance", "reception")]
            for k, (dept, role) in enumerate(signs):
                if k < [5, 4, 3, 2, 1, 0][i % 6]:
                    call(role, "/api/clinical/discharges", {"action": "clear", "id": did, "department": dept, "outcome": "cleared"})
    else:
        print("  ! discharge module not available:", st, data.get("error"))
    # ---- theatre safety checklists ----
    st, data = s["physician"].get("/api/clinical/theatre-safety")
    out["checklists"] = 0
    if st == 200 and data.get("success"):
        for i, row in enumerate([r for r in data["surgeries"] if r["state"] in ("confirmed", "in_progress")][:8]):
            r = call("physician", "/api/clinical/theatre-safety", {"action": "start", "surgeryId": row["surgeryId"]})
            if not r:
                continue
            out["checklists"] += 1
            for k, phase in enumerate(["sign_in", "time_out", "sign_out"]):
                if k <= [2, 1, 0, 1, 2, 0, 1, 2][i % 8]:
                    call("physician", "/api/clinical/theatre-safety", {"action": "phase", "id": r["checklistId"], "phase": phase, "done": True,
                                                                        "note": rng.choice(["", "No allergies", "Counts correct", "Antibiotic given 20 min before"])})
    else:
        print("  ! theatre safety not available:", st, data.get("error"))

    # ---- deliveries and newborns ----
    st, data = s["physician"].get("/api/clinical/deliveries")
    out["deliveries"] = 0
    if st == 200 and data.get("success"):
        patients, doctors = data["patients"], data["doctors"]
        kinds = ["normal", "normal", "caesarean", "normal", "assisted", "caesarean", "normal", "normal", "caesarean", "normal"]
        for i, kind in enumerate(kinds):
            outcome = "stillbirth" if i == 7 else "live_birth"
            w = rng.choice([2100, 2650, 2900, 3100, 3300, 3550, 3800])
            r = call("physician", "/api/clinical/deliveries", {
                "action": "record", "motherId": patients[(i * 9 + 5) % len(patients)]["id"], "deliveryType": kind, "outcome": outcome,
                "babySex": rng.choice(["f", "m"]), "weight": w if outcome == "live_birth" else 1800, "apgar1": rng.choice([6, 7, 8, 9]), "apgar5": rng.choice([8, 9, 10]),
                "motherCondition": rng.choice(["Stable", "Stable, recovering well", "Stable, monitored for bleeding"]), "nicu": w < 2500,
                "obstetricianId": doctors[i % len(doctors)]["id"] if doctors else None})
            if not r:
                continue
            out["deliveries"] += 1
            if outcome == "live_birth" and i % 3 != 2:
                mother_name = next((x["name"] for x in patients if x["id"] == patients[(i * 9 + 5) % len(patients)]["id"]), f"Mother {i + 1}").title()
                st2, p = s["reception"].post("/api/clinical/patients", {"name": f"Baby of {mother_name}", "qid": f"NB-DL-{code}-{i + 1:03d}",
                                                                          "dob": date.today().isoformat(), "gender": "female" if i % 2 else "male"})
                if st2 == 200 and p.get("success"):
                    call("physician", "/api/clinical/deliveries", {"action": "link_baby", "id": r["deliveryId"], "babyId": p["patientId"]})
                else:
                    print("  ! newborn register:", st2, p.get("error"))
    else:
        print("  ! deliveries not available:", st, data.get("error"))
    print(f"[{code}]", json.dumps(out))
    for c in s.values():
        c.logout()


def load_referrals(d_code, d_staff, h_code, h_staff, gulf):
    profs = load_profiles(gulf)
    d_prof, h_prof = profs[d_code], profs[h_code]
    ds, hs = json.load(open(d_staff, encoding="utf-8")), json.load(open(h_staff, encoding="utf-8"))
    send = {"physician": open_session(d_prof, d_code, first(ds, "physician")["username"], first(ds, "physician")["password"])}
    recv = {"reception": open_session(h_prof, h_code, first(hs, "reception")["username"], first(hs, "reception")["password"])}
    st, data = send["physician"].get("/api/clinical/referrals")
    if st != 200 or not data.get("success") or not data["hospitals"]:
        print("  ! referrals not available:", st, data.get("error"))
        return
    target, patients = data["hospitals"][0]["id"], data["patients"]
    items = [("Neurology", "urgent", "Suspected stroke, needs a stroke unit"), ("Paediatric surgery", "routine", "Recurrent hernia in a child"),
             ("Oncology review", "routine", "Second opinion on imaging findings"), ("Neonatal ICU", "emergency", "Premature baby needs NICU bed"),
             ("Cardiology", "urgent", "Positive stress test, angiography advised")]
    out = {"referrals": 0, "errors": 0}
    ids = []
    for i, (spec, urg, reason) in enumerate(items):
        st, r = send["physician"].post("/api/clinical/referrals", {"action": "create", "patientId": patients[(i * 13) % len(patients)]["id"], "toInstitutionId": target,
                                                                 "specialty": spec, "urgency": urg, "reason": reason, "summary": "Synthetic clinical summary for the demo."})
        if st == 200 and r.get("success"):
            out["referrals"] += 1
            ids.append(r["referralId"])
        else:
            out["errors"] += 1
            print("  !", st, r.get("error"))
    for i, rid in enumerate(ids):
        if i in (0, 3):
            recv["reception"].post("/api/clinical/referrals", {"action": "accept", "id": rid})
        if i == 3:
            recv["reception"].post("/api/clinical/referrals", {"action": "complete", "id": rid})
        if i == 2:
            recv["reception"].post("/api/clinical/referrals", {"action": "decline", "id": rid, "note": "Oncology review is not offered at this hospital"})
    print("[referrals]", json.dumps(out))


if __name__ == "__main__":
    gulf = "--gulf" in sys.argv
    args = [a for a in sys.argv[1:] if not a.startswith("--")]
    if "--referrals" in sys.argv:
        load_referrals(*args[:4], gulf)
    else:
        load_hospital(args[0], args[1], gulf)
