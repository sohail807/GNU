#!/usr/bin/env python3
"""
IST Health -- seed the `aster` group tenant: infrastructure and catalogues for every hospital (SYNTHETIC DATA ONLY).

For each hospital in profiles_gulf.json this creates, under that hospital's own company and institution:
wards, beds (each with its billable product), operating rooms, and a price for every billable service in the
hospital's currency. Procedure codes and payor parties (insurers, schemes, corporate) are shared by the group.
Additive and idempotent: everything is matched by name, so re-running is a no-op.

Prerequisite: bootstrap_tenant.py has run for each hospital (institution, chart of accounts, fiscal year...).
    sudo -u gnuhealth env TRYTOND_CONFIG=/home/gnuhealth/trytond.conf \
        /home/gnuhealth/venv/bin/python3 seed_aster_group.py <profiles_gulf.json>
"""
import json
import os
import sys

os.environ.setdefault("TRYTOND_CONFIG", "/home/gnuhealth/trytond.conf")

from trytond.pool import Pool
from trytond.transaction import Transaction


def main():
    if len(sys.argv) != 2:
        print("Usage: seed_aster_group.py <profiles_gulf.json>")
        return 1
    cfg = json.load(open(sys.argv[1], encoding="utf-8"))
    database = cfg["database"]
    if not database.startswith("gnuhealth_h_"):
        print("Refusing: not a hospital database")
        return 1
    Pool.start()
    pool = Pool(database)
    pool.init()
    summary = {}

    for hid, h in cfg["hospitals"].items():
        report = {k: 0 for k in ("wards", "beds", "operating_rooms", "procedures", "services", "prices", "payors")}
        with Transaction().start(database, 0, context={}) as t:
            company = pool.get("company.company").search([("party.name", "=", h["company_name"])], limit=1)
            if not company:
                print(f"[{hid}] ERROR: company '{h['company_name']}' not found; run bootstrap_tenant.py first")
                return 1
            company_id, party_id = company[0].id, company[0].party.id
            t.rollback()

        with Transaction().start(database, 0, context={"company": company_id}) as txn:
            Institution, Ward, Bed, OR = (pool.get(m) for m in ("gnuhealth.institution", "gnuhealth.hospital.ward",
                                                                "gnuhealth.hospital.bed", "gnuhealth.hospital.or"))
            Template, Product, Uom, Procedure, Party = (pool.get(m) for m in (
                "product.template", "product.product", "product.uom", "gnuhealth.procedure", "party.party"))
            institution = (Institution.search([("party", "=", party_id)], limit=1) or [None])[0]
            if institution is None:
                print(f"[{hid}] ERROR: institution not found; run bootstrap_tenant.py first")
                return 1
            unit = (Uom.search([("name", "=", "Unit")], limit=1) or [None])[0]
            if unit is None:
                print("ERROR: product.uom 'Unit' not found")
                return 1

            def make_service(name, price, is_bed=False):
                template = Template()
                template.name, template.type, template.default_uom = name, "service", unit
                template.cost_price_method, template.list_price = "fixed", price
                template.save()
                product = Product()
                product.template = template
                if is_bed:
                    product.is_bed = True
                product.save()
                return product

            # wards and beds of THIS hospital
            wards = {w.name: w for w in Ward.search([("institution", "=", institution.id)])}
            beds = {b.rec_name for b in Bed.search([])}
            for w in h["wards"]:
                ward = wards.get(w["name"])
                if ward is None:
                    ward = Ward()
                    ward.name, ward.institution, ward.floor = w["name"], institution, w["floor"]
                    ward.number_of_beds, ward.gender = len(w["beds"]), w["gender"]
                    ward.private = w["name"].startswith(("Private", "Deluxe"))
                    ward.save()
                    wards[w["name"]] = ward
                    report["wards"] += 1
                for bed_name in w["beds"]:
                    if bed_name in beds:
                        continue
                    product = make_service(bed_name, w["daily_rate"], is_bed=True)
                    bed = Bed()
                    bed.product, bed.ward, bed.institution = product, ward, institution
                    bed.bed_type, bed.state = w["bed_type"], "free"
                    bed.save()
                    report["beds"] += 1

            # operating rooms
            have = {o.name for o in OR.search([("institution", "=", institution.id)])}
            for name in h["operating_rooms"]:
                if name not in have:
                    room = OR()
                    room.name, room.institution = name, institution
                    room.save()
                    report["operating_rooms"] += 1

            # shared across the group (created once, by whichever hospital runs first)
            have = {p.name for p in Procedure.search([])}
            for p in h["procedures"]:
                if p["code"] not in have:
                    proc = Procedure()
                    proc.name, proc.description = p["code"], p["description"]
                    proc.save()
                    report["procedures"] += 1
            by_name = {p.name: p for p in Party.search([])}
            for name in h["insurers"] + h["other_payors"]:
                party = by_name.get(name)
                if party is None:
                    party = Party()
                    party.name, party.is_person, party.is_insurance_company = name, False, True
                    party.save()
                    by_name[name] = party
                    report["payors"] += 1
                elif not party.is_insurance_company:
                    Party.write([party], {"is_insurance_company": True})
                    report["payors"] += 1

            # billable services: one product per service for the group, one price per hospital (company)
            templates = {t_.name: t_ for t_ in Template.search([("type", "=", "service")])}
            for s in h["services"]:
                t_ = templates.get(s["name"])
                if t_ is None:
                    make_service(s["name"], s["price"])
                    report["services"] += 1
                else:
                    Template.write([t_], {"list_price": s["price"]})  # under THIS company's context
                    report["prices"] += 1
            txn.commit()
        summary[hid] = report
        print(f"[{hid}] ({h['currency']}) created: {json.dumps(report)}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
