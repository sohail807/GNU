#!/usr/bin/env python3
"""
IST Health -- seed one Aster demo hospital's infrastructure and catalogues (SYNTHETIC DATA ONLY).

For the profile given (scripts/aster_demo/profiles.json) this creates, inside the hospital's own database:
  wards and beds (each bed with its billable product), operating rooms and cath lab, procedure codes,
  billable service products with illustrative INR prices, and synthetic payor parties (insurers/TPAs,
  corporate, schemes). Everything is additive and matched by name, so re-running is a no-op.

Prerequisite: bootstrap_tenant.py has run (institution, chart of accounts, fiscal year exist).
Run on the VM as the gnuhealth user, one database at a time:
    sudo -u gnuhealth env TRYTOND_CONFIG=/home/gnuhealth/trytond.conf \
        /home/gnuhealth/venv/bin/python3 seed_aster_institution.py <profiles.json> <profile_code>
"""
import json
import os
import sys

os.environ.setdefault("TRYTOND_CONFIG", "/home/gnuhealth/trytond.conf")

from trytond.pool import Pool
from trytond.transaction import Transaction


def main():
    if len(sys.argv) != 3:
        print("Usage: seed_aster_institution.py <profiles.json> <profile_code>")
        return 1
    profile = json.load(open(sys.argv[1], encoding="utf-8"))[sys.argv[2]]
    database = profile["database"]
    if not database.startswith("gnuhealth_h_"):
        print("Refusing: not a hospital database")
        return 1

    Pool.start()
    pool = Pool(database)
    pool.init()

    with Transaction().start(database, 0, context={}) as t:
        company = pool.get("company.company").search([], limit=1)[0]
        company_id = company.id
        t.rollback()

    report = {k: 0 for k in ("wards", "beds", "operating_rooms", "procedures", "services", "payors")}
    with Transaction().start(database, 0, context={"company": company_id}) as txn:
        Institution = pool.get("gnuhealth.institution")
        institution = (Institution.search([], limit=1) or [None])[0]
        if institution is None:
            print("ERROR: no institution; run bootstrap_tenant.py first")
            return 1
        Ward, Bed, OR = (pool.get(m) for m in ("gnuhealth.hospital.ward", "gnuhealth.hospital.bed", "gnuhealth.hospital.or"))
        Template, Product, Uom = (pool.get(m) for m in ("product.template", "product.product", "product.uom"))
        Procedure, Party = pool.get("gnuhealth.procedure"), pool.get("party.party")

        unit = Uom.search([("name", "=", "Unit")], limit=1)
        if not unit:
            print("ERROR: product.uom 'Unit' not found")
            return 1
        unit = unit[0]

        def make_service(name, price, is_bed=False):
            template = Template()
            template.name = name
            template.type = "service"
            template.default_uom = unit
            template.cost_price_method = "fixed"
            template.list_price = price
            template.save()
            product = Product()
            product.template = template
            if is_bed:
                product.is_bed = True
            product.save()
            return product

        # ---- wards and beds
        wards = {w.name: w for w in Ward.search([])}
        existing_beds = {b.rec_name for b in Bed.search([])}
        for w in profile["wards"]:
            ward = wards.get(w["name"])
            if ward is None:
                ward = Ward()
                ward.name = w["name"]
                ward.institution = institution
                ward.floor = w["floor"]
                ward.number_of_beds = len(w["beds"])
                ward.gender = w["gender"]
                ward.private = w["name"].startswith(("Private", "Deluxe"))
                ward.save()
                wards[w["name"]] = ward
                report["wards"] += 1
            for bed_name in w["beds"]:
                if bed_name in existing_beds:
                    continue
                product = make_service(bed_name, w["daily_rate"], is_bed=True)
                bed = Bed()
                bed.product = product
                bed.ward = ward
                bed.institution = institution
                bed.bed_type = w["bed_type"]
                bed.state = "free"
                bed.save()
                report["beds"] += 1

        # ---- operating rooms and cath lab
        existing = {o.name for o in OR.search([])}
        for name in profile["operating_rooms"]:
            if name not in existing:
                room = OR()
                room.name = name
                room.institution = institution
                room.save()
                report["operating_rooms"] += 1

        # ---- procedure codes
        existing = {p.name for p in Procedure.search([])}
        for p in profile["procedures"]:
            if p["code"] not in existing:
                proc = Procedure()
                proc.name = p["code"]
                proc.description = p["description"]
                proc.save()
                report["procedures"] += 1

        # ---- billable services (illustrative INR prices); beds are excluded from this list in the app
        existing = {t_.name for t_ in Template.search([("type", "=", "service")])}
        for s in profile["services"]:
            if s["name"] not in existing:
                make_service(s["name"], s["price"])
                report["services"] += 1

        # ---- synthetic payors: TPAs/insurers, government schemes and the corporate client are all flagged as
        # insurance companies, so patient policies (gnuhealth.insurance) can name any of them as the payor.
        by_name = {p.name: p for p in Party.search([])}
        for name in profile["insurers"] + profile["other_payors"]:
            party = by_name.get(name)
            if party is None:
                party = Party()
                party.name = name
                party.is_person = False
                party.is_insurance_company = True
                party.save()
                report["payors"] += 1
            elif not party.is_insurance_company:
                Party.write([party], {"is_insurance_company": True})
                report["payors"] += 1

        txn.commit()

    print(f"[{sys.argv[2]}] created:", json.dumps(report))
    return 0


if __name__ == "__main__":
    sys.exit(main())
