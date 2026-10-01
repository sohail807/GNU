"""Generate scripts/aster_demo/profiles_gulf.json: the `aster` tenant (Aster's Gulf operation) with two hospitals.

One tenant = one database. Each hospital = one Tryton company (own books and currency) + one GNU Health institution
(own wards, beds, theatres). Patients are shared across the group.

Sources and scaling (see docs/aster-demo/ASTER_OPERATIONS_RESEARCH.md and ASTER_GULF_RESEARCH.md):
  * Aster Hospital Al Qusais, Dubai: 150 beds (84 standard + 8 deluxe rooms), 36 specialties, 5 OTs, cath lab, 10-bed ICU, 9-bed NICU,
    4 labour rooms, 10-bed ED, 10-bed day care, 4-bed dialysis, 90+ doctors, EIAC accredited [S: asterhospitals.ae]
  * Aster Hospital Doha: 50-bed specialty hospital, 15 specialties (gynaecology and obstetrics, newborn care, general and minimal-access
    surgery, orthopaedics, ENT, dental and maxillofacial, gastroenterology, urology, critical care, radiology and lab), 24h ED, 3 OTs,
    labour and recovery, NICU, day care, ICU with isolation, 16-slice CT, 1.5T MRI, single and VIP rooms, 24h pharmacy; soft-launched 2017;
    Aster in Qatar since 2003 with 5 medical centres; accepts Aetna, Allianz, BUPA, Cigna, Daman, MetLife and ~20 more [S: aster.qa]
  * Demo size: Dubai 60 beds (40% of real), Doha 50 beds (real size).
Every price, headcount and the payor mix are ILLUSTRATIVE demo choices, not Aster data.
"""
import json
import os

# ward type: (display, gender, floor, bed type, base daily rate in AED, prefix)
WARD_TYPES = [
    ("General Ward (Men)", "men", 1, "gatch", 600, "GM"),
    ("General Ward (Women)", "women", 1, "gatch", 600, "GW"),
    ("Semi-Private Rooms", "unisex", 2, "electric", 900, "SP"),
    ("Private Rooms", "unisex", 3, "electric", 1500, "PR"),
    ("Deluxe and Suite Rooms", "unisex", 4, "electric", 3000, "DX"),
    ("Intensive Care Unit", "unisex", 2, "electric", 4500, "IC"),
    ("High Dependency Unit", "unisex", 2, "electric", 3000, "HD"),
    ("Neonatal ICU", "unisex", 1, "electric", 4000, "NI"),
    ("Paediatric ICU", "unisex", 1, "electric", 4000, "PI"),
    ("Isolation Ward", "unisex", 1, "electric", 1800, "IS"),
    ("Maternity Ward", "women", 1, "gatch", 1500, "MT"),
    ("Day Care Unit", "unisex", 1, "stretcher", 800, "DC"),
]
# base prices in AED, scaled by each hospital's price index (QAR ~ AED)
SERVICES = [
    ("Consultation - General Medicine", 300), ("Consultation - Cardiology", 450), ("Consultation - Neurology", 450),
    ("Consultation - Oncology", 500), ("Consultation - Gastroenterology", 400), ("Consultation - Orthopaedics", 400),
    ("Consultation - Nephrology", 400), ("Consultation - Urology", 400), ("Consultation - Obstetrics and Gynaecology", 350),
    ("Consultation - Paediatrics", 300), ("Consultation - General Surgery", 350), ("Emergency Department Consultation", 400),
    ("Video Consultation", 200), ("ECG", 150), ("Echocardiogram", 600), ("Chest X-Ray", 120), ("Ultrasound Abdomen", 350),
    ("CT Scan", 1200), ("MRI Scan", 1800), ("PET-CT Scan", 5500), ("Complete Blood Count", 60), ("Lipid Profile", 120),
    ("HbA1c", 90), ("Liver Function Test", 110), ("Renal Function Test", 110), ("Thyroid Profile", 140),
    ("Executive Health Check", 1200), ("Cardiac Health Check", 1800), ("Dialysis Session", 650),
    ("Chemotherapy Day-care Session", 3500), ("Coronary Angiography", 8000), ("PCI with Stent", 35000),
    ("Normal Delivery Package", 9000), ("Caesarean Section Package", 16000), ("Robotic Knee Replacement Package", 60000),
    ("Appendectomy Package", 15000), ("Cataract Surgery Package", 8000), ("Operation Theatre Charges", 4000),
    ("Anaesthesia Charges", 2500), ("ICU Nursing Charges (per day)", 1800), ("Pharmacy - Medicines and Consumables", 300),
    ("Implants and Consumables", 5000), ("Outpatient Consultation", 300),
    ("Consultation - ENT", 350), ("Consultation - Dental", 300),
]
PROCEDURES = json.load(open(os.path.join(os.path.dirname(__file__), "profiles.json"), encoding="utf-8"))["astermedcity"]["procedures"]

HOSPITALS = [
    dict(
        id="aster-dubai", short="dxb", name="Aster Hospital Al Qusais, Dubai (Demo)", institution_code="ASTQUS",
        company_name="Aster Hospital Al Qusais, Dubai (Demo)", country="ARE", currency="AED", timezone="Asia/Dubai",
        id_prefix="784-SYN-", id_label="Emirates ID", price_index=1.00, alos=3.1, occupancy=0.68,
        models="Aster Hospital Al Qusais, Dubai (150 beds)",
        beds={"GM": 5, "GW": 5, "SP": 12, "PR": 14, "DX": 3, "IC": 4, "HD": 3, "NI": 4, "PI": 1, "IS": 2, "MT": 3, "DC": 4},
        operating_rooms=["OT 1 (General Surgery)", "OT 2 (Orthopaedics)", "OT 3 (Gynaecology and Urology)", "Cath Lab 1"],
        doctors={"General Medicine": 3, "Cardiology": 2, "Neurology": 2, "Oncology": 1, "Gastroenterology": 2, "Orthopaedics": 2,
                 "Nephrology": 1, "Urology": 1, "Obstetrics and Gynaecology": 3, "Paediatrics": 3, "General Surgery": 2,
                 "Emergency Medicine": 3, "Anaesthesiology": 2, "ENT": 1, "Dental": 1},
        nurses=9, frontdesk=4, cashiers=2, accountants=1, lab=2, radiology=2,
        insurers=["Daman (demo)", "Cigna (demo)", "MetLife (demo)", "Allianz (demo)", "BUPA (demo)", "Aetna (demo)"],
        other_payors=["Government Health Scheme (synthetic)", "Northwind Logistics Gulf (synthetic corporate)"],
        payor_mix=[["Walk-in", 17], ["Insurance", 58], ["Scheme-central", 12], ["Corporate", 8], ["MVT", 3], ["Other", 2]],
        nationalities=[["indian", 34], ["arab_levant_egypt", 20], ["pakistani", 10], ["emirati", 10], ["filipino", 6],
                       ["bangladeshi", 5], ["western", 8], ["srilankan", 3], ["nepali", 2], ["african", 2]],
    ),
    dict(
        id="aster-doha", short="doh", name="Aster Hospital Doha (Demo)", institution_code="ASTDOH",
        company_name="Aster Hospital Doha (Demo)", country="QAT", currency="QAR", timezone="Asia/Qatar",
        id_prefix="QID-SYN-", id_label="Qatar ID", price_index=0.95, alos=3.3, occupancy=0.64,
        models="Aster Hospital Doha (50 beds, 15 specialties)",
        beds={"PR": 22, "DX": 6, "IC": 4, "HD": 2, "IS": 2, "NI": 6, "MT": 4, "DC": 4},
        operating_rooms=["OT 1", "OT 2", "OT 3"],
        doctors={"General Medicine": 3, "Obstetrics and Gynaecology": 3, "Paediatrics": 2, "General Surgery": 2, "Orthopaedics": 2,
                 "ENT": 1, "Dental": 2, "Gastroenterology": 1, "Urology": 1, "Emergency Medicine": 2, "Anaesthesiology": 1},
        nurses=8, frontdesk=2, cashiers=2, accountants=1, lab=1, radiology=1,
        insurers=["Daman (demo)", "Cigna (demo)", "MetLife (demo)", "Allianz (demo)", "BUPA (demo)", "Aetna (demo)"],
        other_payors=["Government Health Scheme (synthetic)", "Northwind Logistics Gulf (synthetic corporate)"],
        payor_mix=[["Walk-in", 22], ["Insurance", 55], ["Scheme-central", 10], ["Corporate", 9], ["MVT", 2], ["Other", 2]],
        nationalities=[["indian", 28], ["arab_levant_egypt", 22], ["qatari", 12], ["filipino", 8], ["pakistani", 8],
                       ["bangladeshi", 6], ["nepali", 5], ["western", 5], ["srilankan", 4], ["african", 2]],
    ),
]


def build():
    out = {"tenant": "aster", "database": "gnuhealth_h_aster", "hospitals": {}}
    for h in HOSPITALS:
        wards = []
        for display, gender, floor, bed_type, rate, prefix in WARD_TYPES:
            n = h["beds"].get(prefix, 0)
            if n:
                wards.append({"name": display, "gender": gender, "floor": floor, "bed_type": bed_type,
                              "daily_rate": round(rate * h["price_index"]),
                              "beds": [f"{h['short'].upper()}-{prefix}-{i:02d}" for i in range(1, n + 1)]})
        entry = {k: v for k, v in h.items() if k != "beds"}
        entry.update({
            "tenant": "aster", "hospital_id": h["id"], "database": out["database"], "wards": wards,
            "total_beds": sum(len(w["beds"]) for w in wards),
            "services": [{"name": n, "price": round(p * h["price_index"] / 5) * 5} for n, p in SERVICES],
            "procedures": PROCEDURES,
        })
        out["hospitals"][h["id"]] = entry
    return out


if __name__ == "__main__":
    path = os.path.join(os.path.dirname(__file__), "profiles_gulf.json")
    data = build()
    json.dump(data, open(path, "w", encoding="utf-8"), indent=1)
    for k, v in data["hospitals"].items():
        print(k, v["currency"], "beds:", v["total_beds"], "wards:", len(v["wards"]), "services:", len(v["services"]),
              "staff:", sum(v["doctors"].values()) + v["nurses"] + v["frontdesk"] + v["cashiers"] + v["accountants"] + v["lab"] + v["radiology"])
