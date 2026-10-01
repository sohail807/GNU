"""Populate one Aster demo hospital with SYNTHETIC clinical and financial activity, through the app API.

Everything goes through the same endpoints the UI uses (patients, appointments, triage, consultations,
prescriptions, laboratory, radiology, inpatient, surgery, billing), so records are validated by the app
and stored in native GNU Health / Tryton models.

Volumes and mixes come from the Aster research (docs/aster-demo): OPD visits per bed per day, target
occupancy, ALOS, specialty mix and payor mix. All people are fictitious; IDs are SYN-<hospital>-<n>.

    python load_activity.py <profile> <admin_creds.json> <staff.json> [--opd N] [--force] [--seed S]
"""
import argparse
import collections
import datetime
import json
import math
import os
import random
import sys
import time

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))
from aster_demo.client import AppClient  # noqa: E402

HERE = os.path.dirname(__file__)
PROFILES = json.load(open(os.path.join(HERE, "profiles.json"), encoding="utf-8"))

# specialty label -> relative weight within the hospital (derived from published service-line revenue mix)
SPEC_WEIGHT = {"General Medicine": 11, "General Surgery": 4, "Emergency Medicine": 3, "Cardiology": 14, "Neurology": 11,
               "Oncology": 10, "Gastroenterology": 8, "Orthopaedics": 7, "Nephrology": 3.5, "Urology": 3.5,
               "Obstetrics and Gynaecology": 6, "Paediatrics": 6}
CONSULT_SERVICE = {"General Medicine": "Consultation - General Medicine", "Cardiology": "Consultation - Cardiology",
                   "Neurology": "Consultation - Neurology", "Oncology": "Consultation - Oncology",
                   "Gastroenterology": "Consultation - Gastroenterology", "Orthopaedics": "Consultation - Orthopaedics",
                   "Nephrology": "Consultation - Nephrology", "Urology": "Consultation - Urology",
                   "Obstetrics and Gynaecology": "Consultation - Obstetrics and Gynaecology",
                   "Paediatrics": "Consultation - Paediatrics", "General Surgery": "Consultation - General Surgery",
                   "Emergency Medicine": "Emergency Department Consultation"}
# (ICD-10 code, complaint, examination, advice)
CASES = {
    "General Medicine": [("J06.9", "Fever and sore throat for 3 days", "Pharyngeal erythema, chest clear", "Rest, fluids, antipyretic"),
                         ("I10", "Headache, elevated blood pressure at home", "BP 150/94, no focal deficit", "Salt restriction, start antihypertensive"),
                         ("E11.9", "Increased thirst, fatigue; known diabetic", "Random glucose raised", "Diet review, adjust oral agents"),
                         ("N39.0", "Burning micturition for 2 days", "Suprapubic tenderness", "Hydration, antibiotic course")],
    "Cardiology": [("I20.9", "Chest discomfort on exertion", "BP 138/86, heart sounds normal", "ECG, lipid profile, risk review"),
                   ("I25.1", "Follow-up of coronary artery disease", "Stable, no new symptoms", "Continue antiplatelet and statin"),
                   ("I48.9", "Palpitations", "Irregularly irregular pulse", "Rate control, anticoagulation review"),
                   ("I50.9", "Breathlessness and ankle swelling", "Raised JVP, bibasal crepitations", "Diuretic, echocardiogram")],
    "Neurology": [("G43.9", "Recurrent throbbing headache with nausea", "Neurological exam normal", "Migraine prophylaxis, trigger diary"),
                  ("G40.9", "Two episodes of seizure", "Post-ictal, no deficit", "Anti-epileptic, EEG, MRI brain"),
                  ("I63.9", "Sudden right arm weakness", "Right hemiparesis", "Urgent CT, stroke pathway"),
                  ("G20", "Tremor and slowness of movement", "Resting tremor, rigidity", "Start levodopa, physiotherapy")],
    "Oncology": [("C50.9", "Breast lump; staging review", "Firm 3 cm lump", "Staging scans, plan chemotherapy"),
                 ("C34.9", "Persistent cough, weight loss", "Reduced air entry right base", "CT chest, biopsy"),
                 ("C18.9", "Change in bowel habit, anaemia", "Pallor, mass not palpable", "Colonoscopy, CEA")],
    "Gastroenterology": [("K21.9", "Heartburn and regurgitation", "Epigastric tenderness", "PPI, lifestyle advice"),
                         ("K76.0", "Fatty liver on ultrasound", "BMI 31, no stigmata", "Weight reduction, repeat LFT"),
                         ("K80.2", "Right upper abdominal pain after meals", "Murphy sign negative", "Ultrasound, surgical review"),
                         ("K74.6", "Abdominal distension; cirrhosis follow-up", "Ascites, spider naevi", "Diuretics, variceal screening")],
    "Orthopaedics": [("M17.1", "Right knee pain on climbing stairs", "Crepitus, reduced flexion", "X-ray, physiotherapy, analgesia"),
                     ("M54.5", "Low back pain for 2 weeks", "Paraspinal spasm, SLR negative", "NSAID, back exercises"),
                     ("S72.0", "Fall with hip pain", "Shortened, externally rotated limb", "X-ray pelvis, surgical planning")],
    "Nephrology": [("N18.3", "Follow-up chronic kidney disease", "BP 140/90, mild oedema", "Renal profile, ACE inhibitor"),
                   ("N17.9", "Reduced urine output after illness", "Dehydrated", "IV fluids, creatinine monitoring")],
    "Urology": [("N20.0", "Loin to groin colic", "Renal angle tenderness", "Ultrasound KUB, hydration, analgesia"),
                ("N40", "Weak urinary stream, nocturia", "Enlarged smooth prostate", "PSA, alpha-blocker")],
    "Obstetrics and Gynaecology": [("Z34.0", "Routine antenatal visit, 28 weeks", "Fundal height appropriate", "Routine antenatal bloods, scan"),
                                   ("N92.0", "Heavy menstrual bleeding", "Pallor, uterus normal size", "Hb, ultrasound pelvis, tranexamic acid"),
                                   ("O80", "Term pregnancy in labour", "Fully effaced, 4 cm dilated", "Admit to labour ward")],
    "Paediatrics": [("J21.9", "Cough and fast breathing in an infant", "Wheeze, mild recession", "Nebulisation, oral fluids"),
                    ("A09", "Loose stools for 2 days", "Mildly dehydrated", "ORS, zinc"),
                    ("R50.9", "Fever for 3 days, child", "Febrile, throat congested", "Paracetamol, review in 48 hours")],
    "General Surgery": [("K35.8", "Right lower abdominal pain, vomiting", "RIF guarding, rebound", "Ultrasound, admit for appendicectomy"),
                        ("K40.9", "Groin swelling on coughing", "Reducible inguinal hernia", "Elective hernia repair")],
    "Emergency Medicine": [("R07.9", "Chest pain for 40 minutes", "Diaphoretic, BP 150/90", "ECG and troponin, cardiology review"),
                           ("S06.0", "Head injury after fall", "GCS 15, scalp haematoma", "CT head, observation")],
}
LAB_SERVICE = {"COMPLETE BLOOD COUNT": "Complete Blood Count", "LIPID PROFILE": "Lipid Profile", "GLYCEMIC PROFILE": "HbA1c",
               "LIVER FUNCTION TEST": "Liver Function Test", "RENAL FUNCTION TEST": "Renal Function Test",
               "THYROID FUNCTION TEST": "Thyroid Profile"}
IMAGING_SERVICE = {"Chest CT": "CT Scan", "Head CT": "CT Scan", "Abdomen/Pelvis CT": "CT Scan", "Brain MRI": "MRI Scan",
                   "Spine MRI": "MRI Scan", "Knee MRI": "MRI Scan", "Whole Body PET Scan": "PET-CT Scan",
                   "Abdominal Ultrasound": "Ultrasound Abdomen"}
SPEC_LABS = {"General Medicine": ["COMPLETE BLOOD COUNT", "GLYCEMIC PROFILE"], "Cardiology": ["LIPID PROFILE", "COMPLETE BLOOD COUNT"],
             "Gastroenterology": ["LIVER FUNCTION TEST"], "Nephrology": ["RENAL FUNCTION TEST"], "Oncology": ["COMPLETE BLOOD COUNT"],
             "Neurology": ["COMPLETE BLOOD COUNT"], "Orthopaedics": ["COMPLETE BLOOD COUNT"], "Urology": ["RENAL FUNCTION TEST"],
             "Obstetrics and Gynaecology": ["COMPLETE BLOOD COUNT"], "Paediatrics": ["COMPLETE BLOOD COUNT"],
             "General Surgery": ["COMPLETE BLOOD COUNT"], "Emergency Medicine": ["COMPLETE BLOOD COUNT"]}
SPEC_IMAGING = {"Neurology": ["Brain MRI", "Head CT"], "Orthopaedics": ["Knee MRI", "Limb X-Ray (Extremity)"],
                "Gastroenterology": ["Abdominal Ultrasound"], "Urology": ["Abdominal Ultrasound"], "Oncology": ["Chest CT", "Whole Body PET Scan"],
                "Obstetrics and Gynaecology": ["Obstetric Ultrasound"], "General Surgery": ["Abdominal Ultrasound"],
                "Emergency Medicine": ["Head CT"], "Cardiology": [], "General Medicine": ["Abdominal Ultrasound"], "Nephrology": ["Abdominal Ultrasound"], "Paediatrics": []}
PAYORS = [("Walk-in", 58), ("Insurance", 30), ("MVT", 4), ("Scheme-central", 3), ("Corporate", 2), ("Scheme-state", 2), ("Other", 1)]
POLICY = {"Insurance": (None, "private"), "Scheme-central": ("CGHS-ECHS Scheme (synthetic)", "state"),
          "Scheme-state": ("State Health Scheme (synthetic)", "state"), "Corporate": ("Northwind Logistics (synthetic corporate)", "labour_union")}
PAID_NOW = {"Walk-in", "MVT", "Other"}  # others stay posted and outstanding (receivable from payor)

MALE = ["Arjun", "Rohan", "Vikram", "Suresh", "Anil", "Manoj", "Rajesh", "Karthik", "Naveen", "Pradeep", "Sanjay", "Imran", "Joseph",
        "Thomas", "George", "Abdul", "Harish", "Dinesh", "Mahesh", "Ravi", "Sunil", "Deepak", "Faisal", "Varun", "Alexander", "Omar"]
FEMALE = ["Priya", "Anitha", "Deepa", "Lakshmi", "Meera", "Neha", "Divya", "Sneha", "Fathima", "Maya", "Kavya", "Rekha", "Sandhya",
          "Swathi", "Anju", "Revathi", "Nisha", "Shalini", "Geetha", "Pooja", "Smitha", "Asha", "Remya", "Bindu", "Sara", "Aisha"]
SURNAMES = ["Nair", "Menon", "Pillai", "Iyer", "Reddy", "Rao", "Kumar", "Sharma", "Varghese", "Joseph", "Thomas", "George", "Mathew",
            "Krishnan", "Naidu", "Gowda", "Hegde", "Kamath", "Shetty", "Patil", "Kulkarni", "Khan", "Siddiqui", "Chandran", "Warrier",
            "Raman", "Subramanian", "Das", "Bose", "Mukherjee", "Wright", "Haddad"]


def weighted(rng, pairs):
    total = sum(w for _, w in pairs)
    x = rng.uniform(0, total)
    for item, w in pairs:
        x -= w
        if x <= 0:
            return item
    return pairs[-1][0]


class Loader:
    def __init__(self, code, creds, staff, seed):
        self.code = code
        self.profile = PROFILES[code]
        self.rng = random.Random(f"aster-activity-{code}-{seed}")
        self.stats = collections.Counter()
        self.fail = collections.Counter()
        self.fail_samples = {}
        self.patient_no = 0
        self.services = {s["name"]: s["price"] for s in self.profile["services"]}
        self.staff = staff
        self.sessions = {}
        self.admin = AppClient(code, creds["adminUsername"], creds["adminPassword"])
        self.docs = collections.defaultdict(list)
        for s in staff:
            if s["role"] == "physician" and s.get("healthprofId"):
                self.docs[s["specialty"]].append(s)
        self.ledger = []
        self.bad_codes = set()

    # ------------------------------------------------------------------ plumbing
    def session(self, member):
        if member["username"] not in self.sessions:
            self.sessions[member["username"]] = AppClient(self.code, member["username"], member["password"])
        return self.sessions[member["username"]]

    def role(self, role):
        return self.session(next(s for s in self.staff if s["role"] == role))

    def call(self, label, client, path, data=None, method="POST"):
        st, r = client.request(path, method, data)
        ok = st == 200 and (r.get("success") is True or method == "GET")
        if ok:
            self.stats[label] += 1
        else:
            self.fail[label] += 1
            self.fail_samples.setdefault(label, f"HTTP {st}: {str(r.get('error'))[:140]}")
        return ok, r

    def new_person(self, gender=None, age=None):
        self.patient_no += 1
        gender = gender or self.rng.choice(["Male", "Female"])
        first = self.rng.choice(MALE if gender == "Male" else FEMALE)
        name = f"{first} {self.rng.choice(SURNAMES)}".upper()
        age = age if age is not None else int(min(90, max(1, self.rng.gauss(46, 18))))
        dob = datetime.date.today() - datetime.timedelta(days=age * 365 + self.rng.randint(0, 364))
        return {"name": f"{name} SYN{self.patient_no:04d}", "qid": f"SYN-{self.code}-{self.patient_no:05d}",
                "dob": dob.isoformat(), "gender": gender, "bloodType": self.rng.choice(["O+", "A+", "B+", "AB+", "O-", "A-", "B-"])}

    def register(self, person):
        ok, r = self.call("patient.register", self.role("reception"), "/api/clinical/patients", person)
        return r.get("patientId") if ok else None

    def pick_spec(self, available):
        pairs = [(s, SPEC_WEIGHT[s]) for s in available if s in SPEC_WEIGHT and self.docs.get(s)]
        return weighted(self.rng, pairs)

    def pick_doc(self, spec):
        return self.rng.choice(self.docs[spec])

    def person_for(self, spec):
        if spec == "Paediatrics":
            return self.new_person(age=self.rng.randint(0, 14))
        if spec == "Obstetrics and Gynaecology":
            return self.new_person("Female", self.rng.randint(22, 40))
        return self.new_person()

    # ------------------------------------------------------------------ one consultation
    def consult(self, patient_id, doc, spec, order_lab, order_img):
        case = self.rng.choice(CASES[spec])
        code, complaint, exam, advice = case
        body = {"patientId": patient_id, "chiefComplaint": complaint, "physicalExam": exam, "directions": advice, "diagnosisCode": code}
        lab = self.rng.choice(SPEC_LABS[spec]) if order_lab and SPEC_LABS.get(spec) else None
        img = self.rng.choice(SPEC_IMAGING[spec]) if order_img and SPEC_IMAGING.get(spec) else None
        if lab:
            body.update({"orderLab": True, "labTestName": lab})
        if img:
            body.update({"orderRadiology": True, "radiologyStudy": img})
        if code in self.bad_codes:
            body.pop("diagnosisCode")
        st, r = self.session(doc).request("/api/clinical/consultations", "POST", body)
        if st == 400 and "diagnosis code" in str(r.get("error", "")).lower() and "diagnosisCode" in body:
            self.bad_codes.add(code)
            self.stats[f"dx_missing.{code}"] += 1
            body.pop("diagnosisCode")
            st, r = self.session(doc).request("/api/clinical/consultations", "POST", body)
        ok = st == 200 and r.get("success") is True
        if ok:
            self.stats["consultation"] += 1
        else:
            self.fail["consultation"] += 1
            self.fail_samples.setdefault("consultation", f"HTTP {st}: {str(r.get('error'))[:140]}")
        return ok, lab, img

    def prescribe(self, doc, patient_id):
        meds = self.meds
        lines = []
        for m in self.rng.sample(meds, k=self.rng.randint(1, 3)):
            lines.append({"medicament": m, "dose": self.rng.choice(["1 tablet", "500 mg", "250 mg", "10 mg"]), "route": "Oral",
                          "frequency": self.rng.choice(["OD (once daily)", "BD (2x daily)", "TID (3x daily)"]),
                          "duration": self.rng.choice(["5 Days", "7 Days", "14 Days", "30 Days"])})
        return self.call("prescription", self.session(doc), "/api/clinical/prescriptions", {"patientId": patient_id, "lines": lines})

    def bill(self, patient_id, items, payor):
        """Invoice in the patient's own name (the insurer is recorded as a policy, see enroll_policies)."""
        lines = [{"desc": n, "amount": f"{self.services[n]:.2f}"} for n in items if n in self.services]
        if not lines:
            return False
        cashier = self.role("cashier")
        ok, r = self.call("invoice.create", cashier, "/api/clinical/billing", {"action": "create", "patientId": patient_id, "lines": lines})
        if not ok:
            return False
        inv = r.get("invoiceId")
        ok, _ = self.call("invoice.post", cashier, "/api/clinical/billing", {"action": "post", "invoiceId": inv})
        if ok and payor in PAID_NOW:
            total = sum(float(l["amount"]) for l in lines)
            self.call("invoice.pay", cashier, "/api/clinical/billing", {"action": "pay", "invoiceId": inv, "journal": "Cash", "amount": f"{total:.2f}"})
        return ok

    # ------------------------------------------------------------------ OPD visit
    def opd_visit(self):
        spec = self.pick_spec(self.docs.keys())
        doc = self.pick_doc(spec)
        person = self.person_for(spec)
        pid = self.register(person)
        if not pid:
            return
        fd = self.role("reception")
        ok, r = self.call("appointment.book", fd, "/api/clinical/appointments",
                          {"action": "book", "patientId": pid, "healthprofId": doc["healthprofId"],
                           "appointmentDate": datetime.date.today().isoformat(), "urgency": "normal"})
        if ok:
            self.call("appointment.checkin", fd, "/api/clinical/appointments", {"action": "checkin", "appointmentId": r.get("appointmentId")})
        rn = self.role("nursing")
        sys_bp = int(self.rng.gauss(124, 14)); dia = int(self.rng.gauss(80, 9)); hgt = int(self.rng.gauss(165, 10)); wt = int(self.rng.gauss(70, 14))
        self.call("triage", rn, "/api/clinical/triage", {"patientId": pid, "systolic": str(sys_bp), "diastolic": str(dia),
                  "bpm": str(int(self.rng.gauss(76, 9))), "temp": f"{self.rng.gauss(36.9, 0.5):.1f}", "weight": str(wt),
                  "height": str(hgt), "bmi": f"{wt / ((hgt / 100) ** 2):.2f}", "notes": "Triage vitals recorded (synthetic)."})
        ok, lab, img = self.consult(pid, doc, spec, self.rng.random() < 0.35, self.rng.random() < 0.15)
        if not ok:
            return
        if self.rng.random() < 0.7:
            self.prescribe(doc, pid)
        payor = weighted(self.rng, PAYORS)
        items = [CONSULT_SERVICE.get(spec, "Outpatient Consultation")]
        if lab:
            items.append(LAB_SERVICE.get(lab, lab))
        if img:
            items.append(IMAGING_SERVICE.get(img, "Chest X-Ray"))
        if self.rng.random() < 0.5:
            items.append("Pharmacy - Medicines and Consumables")
        self.bill(pid, items, payor)
        self.ledger.append({"qid": person["qid"], "patientId": pid, "payor": payor})
        self.stats[f"payor.{payor}"] += 1
        self.stats["opd.visits"] += 1

    # ------------------------------------------------------------------ inpatients
    def census(self, beds, ward_defs, occupancy, insurer_ids):
        """Fill each ward to the target occupancy with admitted synthetic patients."""
        by_ward = collections.defaultdict(list)
        for b in beds:
            by_ward[b["wardName"]].append(b)
        today = datetime.date.today()
        for wd in ward_defs:
            all_beds = by_ward.get(wd["name"], [])
            wbeds = [b for b in all_beds if b.get("state") == "free"]
            occupied_now = len(all_beds) - len(wbeds)
            target = round(occupancy * len(wd["beds"]))
            if wd["name"] == "Day Care Unit":
                target = max(1, round(0.5 * len(wd["beds"])))
            n = min(len(wbeds), max(0, target - occupied_now))  # top up only, so re-runs do not over-fill
            for bed in wbeds[:n]:
                spec, person, adm_type = self.admission_profile(wd["name"])
                if spec is None:
                    continue
                doc = self.pick_doc(spec)
                pid = self.register(person)
                if not pid:
                    continue
                ok, _, _ = self.consult(pid, doc, spec, False, False)
                remaining = 0 if wd["name"] == "Day Care Unit" else max(1, int(self.rng.lognormvariate(math.log(self.profile["alos"] - 0.6), 0.5)))
                ok, r = self.call("admission", self.session(doc), "/api/clinical/inpatient",
                                  {"patientId": pid, "bedId": bed["id"], "admissionType": adm_type,
                                   "nursingPlan": "Standard nursing observation plan (synthetic)",
                                   "expectedDischargeDate": (today + datetime.timedelta(days=remaining)).isoformat()})
                if ok:
                    self.ledger.append({"qid": person["qid"], "patientId": pid, "payor": weighted(self.rng, PAYORS)})
                    self.stats[f"census.{wd['name']}"] += 1
                    self.admitted.append({"patientId": pid, "spec": spec, "doc": doc, "ward": wd["name"]})

    def admission_profile(self, ward):
        avail = list(self.docs.keys())
        if ward in ("General Ward (Men)", "General Ward (Women)"):
            gender = "Male" if "Men" in ward else "Female"
            spec = self.pick_spec([s for s in avail if s not in ("Obstetrics and Gynaecology", "Paediatrics", "Emergency Medicine")] or avail)
            return spec, self.new_person(gender), "routine"
        if ward in ("Intensive Care Unit", "High Dependency Unit"):
            spec = self.pick_spec([s for s in ("Cardiology", "Neurology", "General Medicine", "Emergency Medicine") if s in avail] or avail)
            return spec, self.new_person(age=self.rng.randint(45, 85)), "emergency"
        if ward in ("Neonatal ICU", "Paediatric ICU"):
            if "Paediatrics" not in avail:
                return None, None, None
            return "Paediatrics", self.new_person(age=0 if ward.startswith("Neo") else self.rng.randint(1, 10)), "emergency"
        if ward == "Maternity Ward":
            if "Obstetrics and Gynaecology" not in avail:
                return None, None, None
            return "Obstetrics and Gynaecology", self.new_person("Female", self.rng.randint(22, 38)), "maternity"
        if ward == "Day Care Unit":
            spec = self.pick_spec([s for s in ("Oncology", "Nephrology", "General Medicine") if s in avail] or avail)
            return spec, self.new_person(age=self.rng.randint(35, 75)), "elective"
        if ward == "Isolation Ward":
            return self.pick_spec(["General Medicine"]), self.new_person(), "emergency"
        spec = self.pick_spec([s for s in avail if s != "Emergency Medicine"] or avail)
        return spec, self.new_person(), "elective" if spec in ("Orthopaedics", "General Surgery", "Urology") else "routine"

    def surgeries(self, target, rooms):
        cand = [a for a in self.admitted if a["spec"] in ("Orthopaedics", "General Surgery", "Urology", "Cardiology", "Obstetrics and Gynaecology", "Neurology")]
        self.rng.shuffle(cand)
        desc = {"Orthopaedics": "Total knee arthroplasty (robotic-assisted)", "General Surgery": "Laparoscopic appendectomy",
                "Urology": "Laparoscopic partial nephrectomy", "Cardiology": "Percutaneous coronary intervention with stent",
                "Obstetrics and Gynaecology": "Cesarean delivery", "Neurology": "Deep brain stimulation electrode implantation"}
        cath = next((r for r in rooms if "Cath" in r["name"]), None)
        ors = [r for r in rooms if "Cath" not in r["name"]] or rooms
        today = datetime.date.today()
        next_slot = collections.defaultdict(int)   # per room: how many bookings so far
        for a in cand[:target]:
            room = cath if (a["spec"] == "Cardiology" and cath) else self.rng.choice(ors)
            k = next_slot[room["id"]]; next_slot[room["id"]] += 1
            day, hour = k // 4, (8, 11, 14, 17)[k % 4]          # four 3-hour slots per room per day: no overlaps
            self.call("surgery.book", self.session(a["doc"]), "/api/clinical/surgery",
                      {"patientId": a["patientId"], "description": desc[a["spec"]], "operatingRoomId": room["id"],
                       "surgeryDate": (today + datetime.timedelta(days=day)).isoformat() + f" {hour:02d}:00:00",
                       "durationMinutes": self.rng.choice([60, 90, 120, 150]), "anesthesiaType": "general" if a["spec"] != "Cardiology" else "local",
                       "classification": "elective" if a["spec"] != "Obstetrics and Gynaecology" else "urgent"})

    def enroll_policies(self, insurers):
        """Record each insured patient's payor as a native gnuhealth.insurance policy."""
        st, r = self.admin.get("/api/clinical/insurance")
        party_of = {p["puid"]: p["partyId"] for p in (r.get("enrollablePatients") or [])}
        payor_id = {c["name"]: c["id"] for c in (r.get("insuranceCompanies") or [])}
        tpas = [payor_id[n] for n in self.profile["insurers"] if n in payor_id]
        ins = self.role("cashier")
        n = 0
        for e in self.ledger:
            if e["payor"] not in POLICY or e["qid"] not in party_of:
                continue
            name, kind = POLICY[e["payor"]]
            company = self.rng.choice(tpas) if name is None else payor_id.get(name)
            if not company:
                continue
            n += 1
            self.call("insurance.enroll", ins, "/api/clinical/insurance",
                      {"partyId": party_of[e["qid"]], "companyId": company, "number": f"SYN-POL-{self.code[-3:].upper()}-{n:05d}",
                       "insuranceType": kind, "notes": f"Synthetic {e['payor']} policy"})

    # ------------------------------------------------------------------ diagnostics release
    def release_results(self):
        lab, rad = self.role("lab"), self.role("radiology")
        st, r = lab.get("/api/clinical/laboratory")
        for o in (r.get("labOrders") or r.get("orders") or []):
            if o.get("state") in ("ordered", "draft", "pending", None) and o.get("id"):
                self.call("lab.certify", lab, "/api/clinical/laboratory",
                          {"action": "certify", "orderId": o["id"], "results": "All analytes within reference range. Certified (synthetic)."})
        st, r = rad.get("/api/clinical/radiology")
        for o in (r.get("radiologyOrders") or []):
            if o.get("state") in ("requested", "draft", "pending", "ordered", None) and o.get("id"):
                self.call("radiology.sign", rad, "/api/clinical/radiology",
                          {"action": "sign", "orderId": o["id"], "findings": "No acute abnormality. Report signed (synthetic)."})

    # ------------------------------------------------------------------ run
    def run(self, n_opd, force):
        st, r = self.admin.get("/api/clinical/patients")
        existing = len(r.get("patients") or [])
        self.patient_no = max(self.patient_no, existing)  # keep SYN ids unique across re-runs
        if existing > 5 and not force:
            print(f"[{self.code}] already has {existing} patients; use --force to add more")
            return
        _, r = self.admin.get("/api/clinical/medicaments")
        names = [m["name"] for m in (r.get("medicaments") or [])]
        self.meds = [n for n in names if "Injection" not in n and "Vaccine" not in n and "mL" not in n] or names
        _, r = self.admin.get("/api/clinical/insurance")
        insurer_ids = [c["id"] for c in (r.get("insuranceCompanies") or [])]
        _, r = self.admin.get("/api/clinical/inpatient")
        ward_names = {w["id"]: w["name"] for w in (r.get("wards") or [])}
        beds = r.get("beds") or []
        for b in beds:  # the API returns the ward id; attach the name the census works with
            b["wardName"] = ward_names.get(b.get("wardId"))
        _, r = self.admin.get("/api/clinical/surgery")
        rooms = r.get("operatingRooms") or []
        self.admitted = []
        t0 = time.time()
        print(f"[{self.code}] doctors: { {k: len(v) for k, v in self.docs.items()} }; beds: {len(beds)}; ORs: {len(rooms)}; insurers: {len(insurer_ids)}")

        self.census(beds, self.profile["wards"], self.profile["occupancy"], None)
        print(f"[{self.code}] census done: {len(self.admitted)} admitted ({time.time() - t0:.0f}s)")
        self.surgeries(max(1, round(0.15 * self.profile["total_beds"])), rooms)
        for i in range(n_opd):
            self.opd_visit()
            if (i + 1) % 25 == 0:
                print(f"[{self.code}] OPD {i + 1}/{n_opd} ({time.time() - t0:.0f}s)")
        self.release_results()
        self.enroll_policies(insurer_ids)
        print(f"[{self.code}] done in {time.time() - t0:.0f}s")
        print(f"[{self.code}] OK  :", dict(sorted(self.stats.items())))
        print(f"[{self.code}] FAIL:", dict(sorted(self.fail.items())))
        for k, v in self.fail_samples.items():
            print(f"[{self.code}]   e.g. {k}: {v}")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("profile"); ap.add_argument("creds"); ap.add_argument("staff")
    ap.add_argument("--opd", type=int, default=None, help="OPD visits to create (default: beds x 2.67)")
    ap.add_argument("--force", action="store_true"); ap.add_argument("--seed", default="1")
    a = ap.parse_args()
    creds = json.load(open(a.creds, encoding="utf-8"))
    staff = json.load(open(a.staff, encoding="utf-8"))
    ld = Loader(a.profile, creds, staff, a.seed)
    n_opd = a.opd if a.opd is not None else round(ld.profile["total_beds"] * 2.67)
    ld.run(n_opd, a.force)


if __name__ == "__main__":
    main()
