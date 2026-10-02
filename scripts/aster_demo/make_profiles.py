"""Generate scripts/aster_demo/profiles.json for the three Aster demo hospitals.

Everything is SYNTHETIC. Bed counts are the real hospitals' nominal beds scaled 1:10 (see
docs/aster-demo/ASTER_OPERATIONS_RESEARCH.md). Prices are illustrative INR and are scaled by each
cluster's published ARPOB relative to Kerala. Run:  python make_profiles.py
"""
import json
import os

# ward type: (display, gender, floor, share of beds, bed type, illustrative daily rate INR, prefix)
WARD_TYPES = [
    ("General Ward (Men)",        "men",    1, None, "gatch",    1500,  "GM"),
    ("General Ward (Women)",      "women",  1, None, "gatch",    1500,  "GW"),
    ("Semi-Private Rooms",        "unisex", 2, None, "electric", 4000,  "SP"),
    ("Private Rooms",             "unisex", 3, None, "electric", 7000,  "PR"),
    ("Deluxe and Suite Rooms",    "unisex", 4, None, "electric", 15000, "DX"),
    ("Intensive Care Unit",       "unisex", 2, None, "electric", 25000, "IC"),
    ("High Dependency Unit",      "unisex", 2, None, "electric", 15000, "HD"),
    ("Neonatal ICU",              "unisex", 1, None, "electric", 20000, "NI"),
    ("Paediatric ICU",            "unisex", 1, None, "electric", 20000, "PI"),
    ("Isolation Ward",            "unisex", 1, None, "electric", 8000,  "IS"),
    ("Maternity Ward",            "women",  1, None, "gatch",    6000,  "MT"),
    ("Day Care Unit",             "unisex", 1, None, "stretcher", 3000, "DC"),
]
# bed counts per hospital, from ward_bed_template.csv shares applied to the 1:10 bed count
BEDS = {
    "astermedcity": {"GM": 7, "GW": 7, "SP": 16, "PR": 18, "DX": 5, "IC": 6, "HD": 3, "NI": 2, "PI": 2, "IS": 2, "MT": 2, "DC": 10},  # 80
    "asterblr":     {"GM": 4, "GW": 5, "SP": 10, "PR": 11, "DX": 3, "IC": 4, "HD": 2, "NI": 2, "PI": 1, "IS": 1, "MT": 1, "DC": 6},   # 50
    "asterhyd":     {"GM": 2, "GW": 2, "SP": 4,  "PR": 4,  "DX": 1, "IC": 2, "HD": 1, "NI": 1, "PI": 0, "IS": 1, "MT": 1, "DC": 1},   # 20
}

HOSPITALS = {
    "astermedcity": dict(
        name="Aster Medcity (Synthetic Demo)", institution_code="ASTMC", short="mc",
        models="Aster Medcity, Kochi", cluster="Kerala", price_index=1.00, alos=3.1, occupancy=0.69,
        operating_rooms=["OT 1 (General Surgery)", "OT 2 (Orthopaedics and Robotics)", "OT 3 (Neuro and Spine)", "Cath Lab 1"],
        doctors={"General Medicine": 3, "Cardiology": 3, "Neurology": 2, "Oncology": 2, "Gastroenterology": 2,
                 "Orthopaedics": 2, "Nephrology": 1, "Urology": 1, "Obstetrics and Gynaecology": 2, "Paediatrics": 2,
                 "General Surgery": 2, "Emergency Medicine": 2, "Anaesthesiology": 2},
        nurses=6, frontdesk=3, cashiers=2, accountants=1, lab=2, radiology=2),
    "asterblr": dict(
        name="Aster CMI Bangalore (Synthetic Demo)", institution_code="ASTCMI", short="cm",
        models="Aster CMI, Bangalore", cluster="Karnataka and Maharashtra", price_index=1.42, alos=3.1, occupancy=0.69,
        operating_rooms=["OT 1", "OT 2 (Robotic)", "Cath Lab 1"],
        doctors={"General Medicine": 2, "Cardiology": 2, "Neurology": 2, "Oncology": 2, "Gastroenterology": 1,
                 "Orthopaedics": 2, "Nephrology": 1, "Urology": 1, "Obstetrics and Gynaecology": 1, "Paediatrics": 1,
                 "General Surgery": 1, "Emergency Medicine": 1, "Anaesthesiology": 1},
        nurses=4, frontdesk=2, cashiers=2, accountants=1, lab=1, radiology=1),
    "asterhyd": dict(
        name="Aster Prime Hyderabad (Synthetic Demo)", institution_code="ASTPRM", short="pr",
        models="Aster Prime, Hyderabad", cluster="Andhra and Telangana", price_index=0.71, alos=3.9, occupancy=0.60,
        operating_rooms=["OT 1", "Cath Lab 1"],
        doctors={"General Medicine": 2, "Cardiology": 1, "Orthopaedics": 1, "Obstetrics and Gynaecology": 1,
                 "Paediatrics": 1, "General Surgery": 1, "Emergency Medicine": 1, "Anaesthesiology": 1},
        nurses=3, frontdesk=1, cashiers=1, accountants=1, lab=1, radiology=1),
}

# service: (name, base illustrative price INR)  -- these become billable service products
SERVICES = [
    ("Consultation - General Medicine", 700), ("Consultation - Cardiology", 1200), ("Consultation - Neurology", 1300),
    ("Consultation - Oncology", 1400), ("Consultation - Gastroenterology", 1100), ("Consultation - Orthopaedics", 1000),
    ("Consultation - Nephrology", 1100), ("Consultation - Urology", 1100),
    ("Consultation - Obstetrics and Gynaecology", 900), ("Consultation - Paediatrics", 800),
    ("Consultation - General Surgery", 900), ("Emergency Department Consultation", 900), ("Video Consultation", 600),
    ("ECG", 400), ("Echocardiogram", 2500), ("Chest X-Ray", 600), ("Ultrasound Abdomen", 1500), ("CT Scan", 6000),
    ("MRI Scan", 9000), ("PET-CT Scan", 30000),
    ("Complete Blood Count", 350), ("Lipid Profile", 700), ("HbA1c", 600), ("Liver Function Test", 700),
    ("Renal Function Test", 650), ("Thyroid Profile", 800),
    ("Executive Health Check", 6500), ("Cardiac Health Check", 9500),
    ("Dialysis Session", 2800), ("Chemotherapy Day-care Session", 15000),
    ("Coronary Angiography", 35000), ("PCI with Stent", 180000),
    ("Normal Delivery Package", 60000), ("Caesarean Section Package", 110000),
    ("Robotic Knee Replacement Package", 380000), ("Appendectomy Package", 90000), ("Cataract Surgery Package", 45000),
    ("Operation Theatre Charges", 25000), ("Anaesthesia Charges", 12000), ("ICU Nursing Charges (per day)", 6000),
    ("Pharmacy - Medicines and Consumables", 1500), ("Implants and Consumables", 20000),
]

# (CPT-style code, description) -- used for gnuhealth.procedure so surgery booking has real choices
PROCEDURES = [
    ("92928", "Percutaneous coronary intervention with stent"), ("93454", "Coronary angiography"),
    ("33533", "Coronary artery bypass graft (CABG)"), ("27447", "Total knee arthroplasty"),
    ("27130", "Total hip arthroplasty"), ("59510", "Cesarean delivery, obstetric care"),
    ("59400", "Vaginal delivery, obstetric care"), ("44970", "Laparoscopic appendectomy"),
    ("47562", "Laparoscopic cholecystectomy"), ("66984", "Cataract extraction with IOL insertion"),
    ("90935", "Haemodialysis, single evaluation"), ("96413", "Chemotherapy administration, IV infusion"),
    ("93000", "Electrocardiogram (ECG), routine"), ("45378", "Diagnostic colonoscopy"),
    ("43235", "Diagnostic upper GI endoscopy"), ("55866", "Robotic-assisted radical prostatectomy"),
    ("50543", "Laparoscopic partial nephrectomy"), ("61863", "Deep brain stimulation electrode implantation"),
    ("49505", "Repair of inguinal hernia"), ("29881", "Knee arthroscopy with meniscectomy"),
]

# synthetic payors (parties). is_insurance_company = TPA/insurer; others are plain parties.
INSURERS = ["Meridian Health TPA (synthetic)", "Sunrise General Insurance (synthetic)", "Evergreen Mediclaim TPA (synthetic)"]
OTHER_PAYORS = ["Northwind Logistics (synthetic corporate)", "CGHS-ECHS Scheme (synthetic)", "State Health Scheme (synthetic)"]


def build():
    profiles = {}
    for code, h in HOSPITALS.items():
        wards = []
        for display, gender, floor, _, bed_type, rate, prefix in WARD_TYPES:
            n = BEDS[code].get(prefix, 0)
            if n:
                wards.append({"name": display, "gender": gender, "floor": floor, "bed_type": bed_type,
                              "daily_rate": round(rate * h["price_index"]),
                              "beds": [f"{h['short'].upper()}-{prefix}-{i:02d}" for i in range(1, n + 1)]})
        profiles[code] = {
            "code": code, "database": f"gnuhealth_h_{code}", **{k: v for k, v in h.items()},
            "wards": wards,
            "total_beds": sum(len(w["beds"]) for w in wards),
            "services": [{"name": n, "price": round(p * h["price_index"] / 10) * 10} for n, p in SERVICES],
            "procedures": [{"code": c, "description": d} for c, d in PROCEDURES],
            "insurers": INSURERS, "other_payors": OTHER_PAYORS,
        }
    return profiles


if __name__ == "__main__":
    out = os.path.join(os.path.dirname(__file__), "profiles.json")
    p = build()
    json.dump(p, open(out, "w", encoding="utf-8"), indent=1)
    for k, v in p.items():
        print(k, "beds:", v["total_beds"], "wards:", len(v["wards"]), "services:", len(v["services"]))
