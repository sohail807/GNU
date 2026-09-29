#!/usr/bin/env python3
"""
IST Health -- Seed reference/catalog data that was found nearly or completely
empty across the live GNU Health database, the same class of gap
seed_medicament_formulary.py already fixed for the drug formulary.

Confirmed live before this script (gnuhealth database):
  - gnuhealth.hospital.ward: 1 record ("General Medicine Ward A", nominal
    capacity 6 beds)
  - gnuhealth.hospital.bed: 1 record total ("Bed A-101") - the ward's own
    stated 6-bed capacity was never backed by real bed records, and this
    session's inpatient double-booking bug (fixed in 1e7d90a) was only
    findable/fixable at all because there was exactly one bed to test with.
  - gnuhealth.hospital.or: 1 record ("VT-OR-01") - the synthetic operating
    room this session created purely to reproduce/verify the surgery booking
    bugs (fixed in 1f9baf3); no real, permanently-named OR existed before.
  - gnuhealth.procedure (CPT-style procedure code catalog used by both the
    ambulatory and surgery booking modules): 1 record.
  - party.party with is_insurance_company=True: 1 record, and that one
    record is party id 232 "Rishma" - the same party already flagged
    is_patient=True elsewhere in this database. That looks like leftover
    test-data cross-contamination from an earlier session (a patient
    accidentally also flagged as an insurance company), not real seed data -
    left untouched here since silently changing a patient's own record
    wasn't asked for; flagged separately to the user instead of "fixed" by
    this script.

Everything this script adds is purely additive (new records only, matched
by name so re-running is a no-op) - nothing existing is modified or deleted.

Run on the VM as the gnuhealth user, with TRYTOND_CONFIG set, against one
database at a time:
    sudo -u gnuhealth env TRYTOND_CONFIG=/home/gnuhealth/trytond.conf \
        /home/gnuhealth/venv/bin/python3 seed_reference_catalogs.py <database>
"""
import os
import sys

os.environ.setdefault("TRYTOND_CONFIG", "/home/gnuhealth/trytond.conf")

from trytond.transaction import Transaction
from trytond.pool import Pool

NEW_WARDS = [
    # name, floor, number_of_beds, gender, private
    ("Surgical Recovery Ward B", 1, 4, "unisex", False),
    ("Intensive Care Ward C", 2, 4, "unisex", False),
    ("Maternity Ward D", 1, 4, "men", False),  # 'men' unused; corrected below
]

# GNU Health's gnuhealth.hospital.ward "gender" selection is
# ('men','women','unisex') - Maternity should be women-only.
NEW_WARDS = [
    ("Surgical Recovery Ward B", 1, 4, "unisex", False),
    ("Intensive Care Ward C", 2, 4, "unisex", False),
    ("Maternity Ward D", 1, 4, "women", False),
]

# (ward_name, bed_label, bed_type) - bed_type is GNU Health's own selection
# ('gatch','electric','stretcher','low','circoelectric','other').
BED_PLAN = [
    ("General Medicine Ward A", "Bed A-102", "gatch"),
    ("General Medicine Ward A", "Bed A-103", "gatch"),
    ("General Medicine Ward A", "Bed A-104", "gatch"),
    ("General Medicine Ward A", "Bed A-105", "electric"),
    ("General Medicine Ward A", "Bed A-106", "electric"),
    ("Surgical Recovery Ward B", "Bed B-101", "electric"),
    ("Surgical Recovery Ward B", "Bed B-102", "electric"),
    ("Surgical Recovery Ward B", "Bed B-103", "gatch"),
    ("Surgical Recovery Ward B", "Bed B-104", "gatch"),
    ("Intensive Care Ward C", "Bed C-101", "electric"),
    ("Intensive Care Ward C", "Bed C-102", "electric"),
    ("Intensive Care Ward C", "Bed C-103", "electric"),
    ("Intensive Care Ward C", "Bed C-104", "electric"),
    ("Maternity Ward D", "Bed D-101", "gatch"),
    ("Maternity Ward D", "Bed D-102", "gatch"),
    ("Maternity Ward D", "Bed D-103", "gatch"),
    ("Maternity Ward D", "Bed D-104", "gatch"),
]

NEW_OPERATING_ROOMS = [
    "Operating Room 1",
    "Operating Room 2",
    "Operating Room 3 (Minor Procedures)",
]

# (code, description) - a realistic spread of common CPT-style procedure
# codes across specialties, so the ambulatory/surgery booking pickers have
# more than the single pre-existing entry to choose from.
NEW_PROCEDURES = [
    ("44970", "Laparoscopic appendectomy"),
    ("47562", "Laparoscopic cholecystectomy"),
    ("49505", "Repair of inguinal hernia"),
    ("29881", "Knee arthroscopy with meniscectomy"),
    ("27447", "Total knee arthroplasty"),
    ("27130", "Total hip arthroplasty"),
    ("59400", "Vaginal delivery, obstetric care"),
    ("59510", "Cesarean delivery, obstetric care"),
    ("19120", "Excision of breast lesion"),
    ("45378", "Diagnostic colonoscopy"),
    ("43235", "Diagnostic upper GI endoscopy"),
    ("12002", "Simple wound repair/suturing"),
    ("36556", "Insertion of central venous catheter"),
    ("31500", "Emergency endotracheal intubation"),
    ("93000", "Electrocardiogram (ECG), routine"),
    ("11042", "Debridement of subcutaneous tissue"),
    ("20610", "Arthrocentesis, aspiration/injection of major joint"),
    ("66984", "Cataract extraction with IOL insertion"),
]

NEW_INSURANCE_COMPANIES = [
    "Qatar National Health Insurance",
    "Al Khaleej Takaful Insurance",
    "Doha Global Assurance",
]


def main():
    if len(sys.argv) != 2:
        print("Usage: seed_reference_catalogs.py <database>")
        return 1
    database = sys.argv[1]

    Pool.start()
    pool = Pool(database)
    pool.init()

    with Transaction().start(database, 0, context={}) as lookup_txn:
        Company = pool.get("company.company")
        companies = Company.search([], limit=1)
        company_id = companies[0].id if companies else None
        lookup_txn.rollback()

    # list_price is a company-scoped multivalue field (Product List Price) - creating a bed's
    # template without an active company in context fails with a RequiredValidationError.
    # Same fix already applied in seed_medicament_formulary.py for the same reason.
    with Transaction().start(database, 0, context={"company": company_id}) as transaction:
        Institution = pool.get("gnuhealth.institution")
        institutions = Institution.search([], limit=1)
        if not institutions:
            print("ERROR: no institution found")
            return 1
        institution = institutions[0]

        Ward = pool.get("gnuhealth.hospital.ward")
        Bed = pool.get("gnuhealth.hospital.bed")
        OR = pool.get("gnuhealth.hospital.or")
        Procedure = pool.get("gnuhealth.procedure")
        Party = pool.get("party.party")
        Template = pool.get("product.template")
        Product = pool.get("product.product")
        Uom = pool.get("product.uom")

        report = {"wards": [], "beds": [], "operating_rooms": [], "procedures": [], "insurance_companies": [], "skipped": []}

        # --- Wards ---
        existing_ward_names = {w.name for w in Ward.search([])}
        ward_by_name = {w.name: w for w in Ward.search([])}
        for name, floor, num_beds, gender, private in NEW_WARDS:
            if name in existing_ward_names:
                report["skipped"].append(f"ward: {name}")
                continue
            ward = Ward()
            ward.name = name
            ward.institution = institution
            ward.floor = floor
            ward.number_of_beds = num_beds
            ward.gender = gender
            ward.private = private
            ward.save()
            ward_by_name[name] = ward
            report["wards"].append(name)

        # --- Beds (each needs its own billable product, like facilities/route.ts does) ---
        unit_uom = Uom.search([("name", "=", "Unit")], limit=1)
        if not unit_uom:
            print("ERROR: product.uom 'Unit' not found")
            return 1
        unit_uom = unit_uom[0]

        existing_bed_names = {b.rec_name for b in Bed.search([])}
        for ward_name, bed_label, bed_type in BED_PLAN:
            if bed_label in existing_bed_names:
                report["skipped"].append(f"bed: {bed_label}")
                continue
            ward = ward_by_name.get(ward_name)
            if not ward:
                report["skipped"].append(f"bed: {bed_label} (ward '{ward_name}' not found)")
                continue

            template = Template()
            template.name = bed_label
            template.type = "service"
            template.default_uom = unit_uom
            template.cost_price_method = "fixed"
            template.list_price = 150
            template.save()

            product = Product()
            product.template = template
            product.is_bed = True
            product.save()

            bed = Bed()
            bed.product = product
            bed.ward = ward
            bed.institution = institution
            bed.bed_type = bed_type
            bed.state = "free"
            bed.save()
            report["beds"].append(bed_label)

        # --- Operating rooms ---
        existing_or_names = {o.name for o in OR.search([])}
        for name in NEW_OPERATING_ROOMS:
            if name in existing_or_names:
                report["skipped"].append(f"or: {name}")
                continue
            room = OR()
            room.name = name
            room.institution = institution
            room.save()
            report["operating_rooms"].append(name)

        # --- Procedure codes ---
        existing_proc_names = {p.name for p in Procedure.search([])}
        for code, description in NEW_PROCEDURES:
            if code in existing_proc_names:
                report["skipped"].append(f"procedure: {code}")
                continue
            proc = Procedure()
            proc.name = code
            proc.description = description
            proc.save()
            report["procedures"].append(code)

        # --- Insurance companies (party.party, is_insurance_company=True) ---
        existing_company_names = {
            p.name for p in Party.search([("is_insurance_company", "=", True)])
        }
        for name in NEW_INSURANCE_COMPANIES:
            if name in existing_company_names:
                report["skipped"].append(f"insurance company: {name}")
                continue
            party = Party()
            party.name = name
            party.is_person = False
            party.is_insurance_company = True
            party.save()
            report["insurance_companies"].append(name)

        transaction.commit()

    for key in ["wards", "beds", "operating_rooms", "procedures", "insurance_companies"]:
        print(f"{key} created ({len(report[key])}): {report[key]}")
    print(f"skipped, already existed ({len(report['skipped'])}): {report['skipped']}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
