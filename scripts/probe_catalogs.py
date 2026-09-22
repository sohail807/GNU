#!/usr/bin/env python3
import os
os.environ['TRYTOND_CONFIG'] = '/home/gnuhealth/trytond.conf'
from trytond.config import config
config.update_etc('/home/gnuhealth/trytond.conf')

from trytond.pool import Pool
from trytond.transaction import Transaction

Pool.start()
pool = Pool('gnuhealth')
pool.init()

with Transaction().start('gnuhealth', 1, readonly=True):
    # Specialties
    Specialty = pool.get('gnuhealth.specialty')
    fam = Specialty.search([('name', 'ilike', '%family%')])
    gp = Specialty.search([('code', '=', 'GP')])
    internal = Specialty.search([('name', 'ilike', '%internal%')])
    print("Specialties:")
    print("  Family:", [(s.id, s.code, s.name) for s in fam])
    print("  GP:", [(s.id, s.code, s.name) for s in gp])
    print("  Internal:", [(s.id, s.code, s.name) for s in internal])

    # Pathology J06.9
    Pathology = pool.get('gnuhealth.pathology')
    path = Pathology.search([('code', '=', 'J06.9')])
    print("Pathology J06.9:", [(p.id, p.code, p.name) for p in path])

    # Drug Forms, Routes, Units
    Form = pool.get('gnuhealth.drug.form')
    tab = Form.search([('name', 'ilike', '%tablet%')])
    print("Form Tablet:", [(f.id, f.code, f.name) for f in tab])

    Route = pool.get('gnuhealth.drug.route')
    oral = Route.search([('name', 'ilike', '%oral%')])
    print("Route Oral:", [(r.id, r.code, r.name) for r in oral])

    Unit = pool.get('gnuhealth.dose.unit')
    mg = Unit.search([('name', 'ilike', '%mg%')])
    print("Unit mg:", [(u.id, u.code, u.name) for u in mg])

    # Journals
    Journal = pool.get('account.journal')
    journals = Journal.search([])
    print("Journals:", [(j.id, j.code, j.name, j.type) for j in journals])

    # Lab Test Types & Imaging Tests
    LabType = pool.get('gnuhealth.lab.test_type')
    cbc_types = LabType.search([])
    print("Lab Test Types:", [(l.id, l.code, l.name) for l in cbc_types])

    ImgTest = pool.get('gnuhealth.imaging.test')
    img_tests = ImgTest.search([])
    print("Imaging Tests:", [(i.id, i.code, i.name) for i in img_tests])

    # Existing Medicaments
    Medicament = pool.get('gnuhealth.medicament')
    meds = Medicament.search([])
    print(f"Existing Medicaments count: {len(meds)}")
    if meds:
        print("Sample meds:", [(m.id, m.product.name if m.product else None) for m in meds[:5]])
