#!/usr/bin/env python3
"""
IST Health -- Seed a standard outpatient drug formulary into gnuhealth.medicament.

Context: the live formulary only ever had one seeded record ("Amoxicillin 500mg"),
so physicians could not actually prescribe anything else even though the
prescription UI and API work correctly. This creates each drug's underlying
product.template + product.product (gnuhealth.medicament.product is required and
points at product.product) and then the gnuhealth.medicament record itself, using
dose units / routes / forms that already exist in the target database (queried
live below rather than hardcoded, since ids can differ between tenants).

Run on the VM as the gnuhealth user, with TRYTOND_CONFIG set, against one
database at a time:
    sudo -u gnuhealth env TRYTOND_CONFIG=/home/gnuhealth/trytond.conf \
        /home/gnuhealth/venv/bin/python3 seed_medicament_formulary.py <database>
"""
import os
import sys

os.environ.setdefault("TRYTOND_CONFIG", "/home/gnuhealth/trytond.conf")

from trytond.transaction import Transaction
from trytond.pool import Pool

FORMULARY = [
    # name, active_component, strength, unit_name, route_name, form_name
    ("Paracetamol 500mg", "Paracetamol", 500, "mg", "Oral", "Tablet"),
    ("Ibuprofen 400mg", "Ibuprofen", 400, "mg", "Oral", "Tablet"),
    ("Azithromycin 500mg", "Azithromycin", 500, "mg", "Oral", "Tablet"),
    ("Ciprofloxacin 500mg", "Ciprofloxacin", 500, "mg", "Oral", "Tablet"),
    ("Metronidazole 400mg", "Metronidazole", 400, "mg", "Oral", "Tablet"),
    ("Doxycycline 100mg", "Doxycycline", 100, "mg", "Oral", "Capsule"),
    ("Omeprazole 20mg", "Omeprazole", 20, "mg", "Oral", "Capsule"),
    ("Ranitidine 150mg", "Ranitidine", 150, "mg", "Oral", "Tablet"),
    ("Domperidone 10mg", "Domperidone", 10, "mg", "Oral", "Tablet"),
    ("Ondansetron 4mg", "Ondansetron", 4, "mg", "Oral", "Tablet"),
    ("Metformin 500mg", "Metformin", 500, "mg", "Oral", "Tablet"),
    ("Amlodipine 5mg", "Amlodipine", 5, "mg", "Oral", "Tablet"),
    ("Atorvastatin 20mg", "Atorvastatin", 20, "mg", "Oral", "Tablet"),
    ("Losartan 50mg", "Losartan", 50, "mg", "Oral", "Tablet"),
    ("Aspirin 75mg", "Acetylsalicylic acid", 75, "mg", "Oral", "Tablet"),
    ("Clopidogrel 75mg", "Clopidogrel", 75, "mg", "Oral", "Tablet"),
    ("Prednisolone 5mg", "Prednisolone", 5, "mg", "Oral", "Tablet"),
    ("Levothyroxine 50mcg", "Levothyroxine sodium", 50, "ug", "Oral", "Tablet"),
    ("Cetirizine 10mg", "Cetirizine", 10, "mg", "Oral", "Tablet"),
    ("Loratadine 10mg", "Loratadine", 10, "mg", "Oral", "Tablet"),
    ("Diclofenac 50mg", "Diclofenac sodium", 50, "mg", "Oral", "Tablet enteric coated"),
    ("Salbutamol Inhaler 100mcg", "Salbutamol", 100, "ug", "Inhalation", "Aerosol metered-dose"),
    ("Hydrocortisone Cream 1%", "Hydrocortisone", 1, "mg", "Topical", "Cream"),
    ("Paracetamol Syrup 120mg/5mL", "Paracetamol", 120, "mg", "Oral", "Syrup"),
    ("Amoxicillin Syrup 250mg/5mL", "Amoxicillin", 250, "mg", "Oral", "Syrup"),
    ("Vitamin C 500mg", "Ascorbic acid", 500, "mg", "Oral", "Tablet chewable"),
    ("Multivitamin Tablet", "Multivitamin", None, None, "Oral", "Tablet"),
]


def main():
    if len(sys.argv) != 2:
        print("Usage: seed_medicament_formulary.py <database>")
        return 1
    database = sys.argv[1]

    Pool.start()
    pool = Pool(database)
    pool.init()

    with Transaction().start(database, 0) as transaction:
        Company = pool.get("company.company")
        companies = Company.search([], limit=1)
        company_id = companies[0].id if companies else None

    # list_price is a company-scoped multivalue field (Product List Price) -- creating a
    # template without an active company in context fails with a RequiredValidationError.
    # Resolved live above instead of hardcoded, since the id can differ between databases.
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

        dose_unit_cache = {}
        route_cache = {}
        form_cache = {}

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

        existing_names = {m.rec_name for m in Medicament.search([])}
        created = []
        skipped = []

        for name, active_component, strength, unit_name, route_name, form_name in FORMULARY:
            if name in existing_names:
                skipped.append(name)
                continue

            route = get_route(route_name)
            form = get_form(form_name)
            dose_unit = get_dose_unit(unit_name) if unit_name else None

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
            # gnuhealth.medicament.product has a domain of [("is_medicament", "=", True)] --
            # confirmed live against the existing Amoxicillin record, which has this set.
            product.is_medicament = True
            product.save()

            medicament = Medicament()
            medicament.product = product
            medicament.active_component = active_component
            if strength is not None:
                medicament.strength = strength
            if dose_unit:
                medicament.unit = dose_unit
            if route:
                medicament.route = route
            if form:
                medicament.form = form
            medicament.save()

            created.append(name)

        transaction.commit()
        print(f"Created: {len(created)} -> {created}")
        print(f"Skipped (already existed): {len(skipped)} -> {skipped}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
