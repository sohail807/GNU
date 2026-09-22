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

models = [
    'gnuhealth.patient',
    'gnuhealth.appointment',
    'gnuhealth.patient.evaluation',
    'gnuhealth.prescription.order',
    'gnuhealth.prescription.line',
    'gnuhealth.medicament',
    'gnuhealth.patient.lab.test',
    'gnuhealth.lab',
    'gnuhealth.lab.test_type',
    'gnuhealth.imaging.test',
    'gnuhealth.imaging.test.request',
    'gnuhealth.health_service',
    'gnuhealth.health_service.line',
]

with Transaction().start('gnuhealth', 1, readonly=True):
    for m in models:
        try:
            Model = pool.get(m)
            req = [k for k, f in Model._fields.items() if getattr(f, 'required', False)]
            all_f = list(Model._fields.keys())
            print(f"\nMODEL: {m}")
            print(f"  REQUIRED: {req}")
            print(f"  ALL ({len(all_f)}): {all_f}")
        except KeyError:
            print(f"\nMODEL: {m} NOT FOUND")
