#!/usr/bin/env python3
"""
IST Health -- Seed medicament formulary, lab test panels, and orderable
imaging studies that were nearly empty in the live GNU Health database.

Confirmed live before this script:
  - gnuhealth.medicament: 30 records (seed_medicament_formulary.py already
    ran once) but nothing for IV fluids, anticoagulants, insulin, injectable
    antibiotics/analgesics, cardiac drugs, or psychiatric medication - all
    relevant now that this session also seeded ICU/surgical/maternity wards
    and beds (seed_reference_catalogs.py) with nothing to actually prescribe
    for those patients. Also only 2 vaccines (Influenza, Tetanus), so the
    immunizations module's picker had almost nothing beyond those two.
  - gnuhealth.lab.test_type: 9 panels, all with real analyte criteria
    templates already - genuinely fine, but missing several very common
    panels (lipid, thyroid, glycemic, coagulation).
  - gnuhealth.imaging.test.type: 8 entries - but this is just the DICOM
    modality catalog (X-ray, Ultrasound, CT, MRI, ...), NOT the orderable
    study list. The actual orderable catalog, gnuhealth.imaging.test (what
    ClinicalLookupService.resolveImagingTest and the radiology module really
    query), had exactly ONE record: "Chest X-Ray". That's the real reason
    every radiology order tested this session was a Chest X-Ray - it was
    the only study that existed to pick.

Everything below is purely additive (new records only, matched by name so
re-running is a no-op) - nothing existing is modified or deleted.

Run on the VM as the gnuhealth user, with TRYTOND_CONFIG set, against one
database at a time:
    sudo -u gnuhealth env TRYTOND_CONFIG=/home/gnuhealth/trytond.conf \
        /home/gnuhealth/venv/bin/python3 seed_medical_test_catalogs.py <database>
"""
import os
import sys

os.environ.setdefault("TRYTOND_CONFIG", "/home/gnuhealth/trytond.conf")

from trytond.transaction import Transaction
from trytond.pool import Pool

# name, active_component, strength, unit_name, route_name, form_name, is_vaccine
NEW_MEDICAMENTS = [
    ("Normal Saline 0.9% 1000mL", "Sodium chloride", None, None, "Intravenous", "Solution"),
    ("Ringer's Lactate 1000mL", "Compound sodium lactate", None, None, "Intravenous", "Solution"),
    ("Dextrose 5% in Water 500mL", "Glucose", None, None, "Intravenous", "Solution"),
    ("Insulin Regular (Actrapid) 100 unit/mL", "Insulin (regular human)", 100, "unit", "Subcutaneous", "Solution"),
    ("Insulin Glargine (Lantus) 100 unit/mL", "Insulin glargine", 100, "unit", "Subcutaneous", "Solution"),
    ("Heparin Sodium 5000 unit/mL", "Heparin sodium", 5000, "unit", "Intravenous", "Solution"),
    ("Enoxaparin 40mg/0.4mL", "Enoxaparin sodium", 40, "mg", "Subcutaneous", "Solution"),
    ("Warfarin 5mg", "Warfarin sodium", 5, "mg", "Oral", "Tablet"),
    ("Furosemide 40mg", "Furosemide", 40, "mg", "Oral", "Tablet"),
    ("Spironolactone 25mg", "Spironolactone", 25, "mg", "Oral", "Tablet"),
    ("Digoxin 0.25mg", "Digoxin", 0.25, "mg", "Oral", "Tablet"),
    ("Ceftriaxone 1g Injection", "Ceftriaxone sodium", 1000, "mg", "Intravenous", "Solution"),
    ("Vancomycin 500mg Injection", "Vancomycin hydrochloride", 500, "mg", "Intravenous", "Solution"),
    ("Morphine Sulfate 10mg/mL Injection", "Morphine sulfate", 10, "mg", "Intravenous", "Solution"),
    ("Tramadol 50mg", "Tramadol hydrochloride", 50, "mg", "Oral", "Capsule"),
    ("Diazepam 5mg", "Diazepam", 5, "mg", "Oral", "Tablet"),
    ("Haloperidol 5mg", "Haloperidol", 5, "mg", "Oral", "Tablet"),
    ("Sertraline 50mg", "Sertraline hydrochloride", 50, "mg", "Oral", "Tablet"),
    ("Risperidone 2mg", "Risperidone", 2, "mg", "Oral", "Tablet"),
    ("Lidocaine 2% Injection", "Lidocaine hydrochloride", 20, "mg", "Intradermal", "Solution"),
    ("Oxytocin 10 unit Injection", "Oxytocin", 10, "unit", "Intramuscular", "Solution"),
    ("Magnesium Sulfate 50% Injection", "Magnesium sulfate", None, None, "Intravenous", "Solution"),
    ("Hydrocortisone Sodium Succinate 100mg Injection", "Hydrocortisone sodium succinate", 100, "mg", "Intravenous", "Solution"),
    ("Adrenaline (Epinephrine) 1mg/mL Injection", "Epinephrine", 1, "mg", "Intramuscular", "Solution"),
    ("Atropine Sulfate 0.6mg Injection", "Atropine sulfate", 0.6, "mg", "Intravenous", "Solution"),
    # Vaccine catalog was down to 2 entries (Influenza, Tetanus, from
    # seed_medicament_formulary.py) - the immunizations module's vaccine
    # picker had almost nothing to choose from beyond those.
    ("Hepatitis B Vaccine (Recombinant)", "Hepatitis B surface antigen", None, None, "Intramuscular", "Solution", True),
    ("MMR Vaccine (Measles, Mumps, Rubella)", "Live attenuated MMR virus strains", None, None, "Subcutaneous", "Solution", True),
    ("Varicella (Chickenpox) Vaccine", "Live attenuated varicella-zoster virus", None, None, "Subcutaneous", "Solution", True),
    ("Pneumococcal Conjugate Vaccine (PCV13)", "Streptococcus pneumoniae polysaccharide conjugate", None, None, "Intramuscular", "Solution", True),
    ("HPV Vaccine (Human Papillomavirus)", "HPV L1 protein antigens", None, None, "Intramuscular", "Solution", True),
    ("COVID-19 mRNA Vaccine", "mRNA encoding SARS-CoV-2 spike protein", None, None, "Intramuscular", "Solution", True),
    ("Rotavirus Vaccine (Oral)", "Live attenuated rotavirus strains", None, None, "Oral", "Solution", True),
    ("BCG Vaccine (Tuberculosis)", "Live attenuated Mycobacterium bovis", None, None, "Intradermal", "Solution", True),
    ("Hepatitis A Vaccine (Inactivated)", "Inactivated hepatitis A virus", None, None, "Intramuscular", "Solution", True),
    ("Meningococcal Conjugate Vaccine", "Neisseria meningitidis polysaccharide conjugate", None, None, "Intramuscular", "Solution", True),
]

# panel_name, panel_code, specimen_type, [(analyte, code, unit_name, lower, upper), ...]
NEW_LAB_PANELS = [
    ("LIPID PROFILE", "LIPID", "Serum", [
        ("Total Cholesterol", "TCHOL", "mg/dl", 0, 200),
        ("LDL Cholesterol", "LDL", "mg/dl", 0, 100),
        ("HDL Cholesterol", "HDL", "mg/dl", 40, 60),
        ("Triglycerides", "TRIG", "mg/dl", 0, 150),
    ]),
    ("THYROID FUNCTION TEST", "TFT", "Serum", [
        ("TSH", "TSH", "mIU/l", 0.4, 4.0),
        ("Free T4", "FT4", "ng/ml", 0.8, 1.8),
        ("Free T3", "FT3", "pg/ml", 2.3, 4.2),
    ]),
    ("GLYCEMIC PROFILE", "GLUC", "Serum/Plasma", [
        ("Fasting Blood Glucose", "FBG", "mg/dl", 70, 100),
        ("HbA1c", "HBA1C", "%", 4.0, 5.6),
    ]),
    ("COAGULATION PROFILE", "COAG", "Whole Blood (citrate)", [
        ("Prothrombin Time (PT)", "PT", None, 11, 13.5),
        ("INR", "INR", None, 0.8, 1.1),
        ("Activated Partial Thromboplastin Time (aPTT)", "APTT", None, 25, 35),
    ]),
]

# study_name, code, modality_type_name
NEW_IMAGING_STUDIES = [
    ("Abdominal X-Ray", "AXR", "X-ray"),
    ("Pelvis X-Ray", "PXR", "X-ray"),
    ("Skull X-Ray", "SXR", "X-ray"),
    ("Limb X-Ray (Extremity)", "LXR", "X-ray"),
    ("Abdominal Ultrasound", "AUS", "Ultrasound"),
    ("Pelvic Ultrasound", "PUS", "Ultrasound"),
    ("Obstetric Ultrasound", "OUS", "Ultrasound"),
    ("Thyroid Ultrasound", "TUS", "Ultrasound"),
    ("Brain MRI", "MRIB", "Magnetic Resonance"),
    ("Spine MRI", "MRIS", "Magnetic Resonance"),
    ("Knee MRI", "MRIK", "Magnetic Resonance"),
    ("Head CT", "CTH", "Computed Tomography"),
    ("Chest CT", "CTC", "Computed Tomography"),
    ("Abdomen/Pelvis CT", "CTAP", "Computed Tomography"),
    ("Coronary Angiography", "CANGIO", "X-Ray Angiography"),
    ("Mammography", "MAMMO", "Digital Radiography"),
    ("Whole Body PET Scan", "PETWB", "Positron emission tomography (PET)"),
]


def make_service_product(Template, Product, uom, name):
    template = Template()
    template.name = name
    template.type = "service"
    template.default_uom = uom
    template.cost_price_method = "fixed"
    template.list_price = 0
    template.save()

    product = Product()
    product.template = template
    product.save()
    return product


def main():
    if len(sys.argv) != 2:
        print("Usage: seed_medical_test_catalogs.py <database>")
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

    report = {"medicaments": [], "lab_panels": [], "imaging_studies": [], "skipped": []}

    # list_price is company-scoped (Product List Price multivalue) - needs an active company
    # in context, same fix already applied in seed_medicament_formulary.py / seed_reference_catalogs.py.
    with Transaction().start(database, 0, context={"company": company_id}) as transaction:
        Medicament = pool.get("gnuhealth.medicament")
        Template = pool.get("product.template")
        Product = pool.get("product.product")
        Uom = pool.get("product.uom")
        DoseUnit = pool.get("gnuhealth.dose.unit")
        Route = pool.get("gnuhealth.drug.route")
        Form = pool.get("gnuhealth.drug.form")

        unit_uom = Uom.search([("name", "=", "Unit")], limit=1)
        if not unit_uom:
            print("ERROR: product.uom 'Unit' not found")
            return 1
        unit_uom = unit_uom[0]

        dose_unit_cache, route_cache, form_cache = {}, {}, {}

        def get_dose_unit(name):
            if name not in dose_unit_cache:
                found = DoseUnit.search([("name", "=", name)], limit=1)
                dose_unit_cache[name] = found[0] if found else None
            return dose_unit_cache[name]

        def get_route(name):
            if name not in route_cache:
                found = Route.search([("name", "=", name)], limit=1)
                route_cache[name] = found[0] if found else None
            return route_cache[name]

        def get_form(name):
            if name not in form_cache:
                found = Form.search([("name", "=", name)], limit=1)
                form_cache[name] = found[0] if found else None
            return form_cache[name]

        # --- Medicaments ---
        existing_med_names = {m.rec_name for m in Medicament.search([])}
        for entry in NEW_MEDICAMENTS:
            name, active_component, strength, unit_name, route_name, form_name = entry[:6]
            is_vaccine = entry[6] if len(entry) > 6 else False
            if name in existing_med_names:
                report["skipped"].append(f"medicament: {name}")
                continue

            template = Template()
            template.name = name
            template.type = "goods"
            template.default_uom = unit_uom
            template.cost_price_method = "fixed"
            template.list_price = 0
            template.save()

            product = Product()
            product.template = template
            product.name = name
            product.type = "goods"
            product.default_uom = unit_uom
            product.cost_price_method = "fixed"
            product.is_medicament = True
            product.save()

            medicament = Medicament()
            medicament.product = product
            medicament.active_component = active_component
            medicament.is_vaccine = is_vaccine
            if strength is not None:
                medicament.strength = strength
            dose_unit = get_dose_unit(unit_name) if unit_name else None
            if dose_unit:
                medicament.unit = dose_unit
            route = get_route(route_name)
            if route:
                medicament.route = route
            form = get_form(form_name)
            if form:
                medicament.form = form
            medicament.save()
            report["medicaments"].append(name)

        # --- Lab test panels (test_type + critearea analytes) ---
        TestType = pool.get("gnuhealth.lab.test_type")
        Critearea = pool.get("gnuhealth.lab.test.critearea")
        LabUnit = pool.get("gnuhealth.lab.test.units")

        lab_unit_cache = {}

        def get_lab_unit(name):
            if not name:
                return None
            if name not in lab_unit_cache:
                found = LabUnit.search([("name", "=", name)], limit=1)
                lab_unit_cache[name] = found[0] if found else None
            return lab_unit_cache[name]

        existing_panel_names = {t.name for t in TestType.search([])}
        for panel_name, panel_code, specimen_type, analytes in NEW_LAB_PANELS:
            if panel_name in existing_panel_names:
                report["skipped"].append(f"lab panel: {panel_name}")
                continue

            product = make_service_product(Template, Product, unit_uom, f"Lab Test - {panel_name.title()}")

            test_type = TestType()
            test_type.name = panel_name
            test_type.code = panel_code
            test_type.specimen_type = specimen_type
            test_type.product_id = product
            test_type.save()

            for seq, (analyte_name, analyte_code, unit_name, lower, upper) in enumerate(analytes, start=1):
                critearea = Critearea()
                critearea.name = analyte_name
                critearea.code = analyte_code
                critearea.sequence = seq
                critearea.lower_limit = lower
                critearea.upper_limit = upper
                critearea.limits_verified = True
                unit = get_lab_unit(unit_name)
                if unit:
                    critearea.units = unit
                # normal_range is the free-text "Reference" shown to lab staff - lower_limit/
                # upper_limit are what save-results actually validates against, but leaving this
                # blank means every result screen shows an empty reference range.
                critearea.normal_range = f"{lower}-{upper}{(' ' + unit_name) if unit_name else ''}"
                critearea.test_type_id = test_type
                critearea.save()

            report["lab_panels"].append(panel_name)

        # --- Imaging studies (orderable gnuhealth.imaging.test) ---
        ImagingTestType = pool.get("gnuhealth.imaging.test.type")
        ImagingTest = pool.get("gnuhealth.imaging.test")

        modality_cache = {}

        def get_modality(name):
            if name not in modality_cache:
                found = ImagingTestType.search([("name", "=", name)], limit=1)
                modality_cache[name] = found[0] if found else None
            return modality_cache[name]

        existing_study_names = {t.name for t in ImagingTest.search([])}
        for study_name, code, modality_name in NEW_IMAGING_STUDIES:
            if study_name in existing_study_names:
                report["skipped"].append(f"imaging study: {study_name}")
                continue
            modality = get_modality(modality_name)
            if not modality:
                report["skipped"].append(f"imaging study: {study_name} (modality '{modality_name}' not found)")
                continue

            product = make_service_product(Template, Product, unit_uom, f"Imaging Study - {study_name}")

            study = ImagingTest()
            study.name = study_name
            study.code = code
            study.test_type = modality
            study.product = product
            study.save()
            report["imaging_studies"].append(study_name)

        transaction.commit()

    for key in ["medicaments", "lab_panels", "imaging_studies"]:
        print(f"{key} created ({len(report[key])}): {report[key]}")
    print(f"skipped, already existed ({len(report['skipped'])}): {report['skipped']}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
