#!/usr/bin/env python3
import os
import sys

os.environ['TRYTOND_CONFIG'] = '/home/gnuhealth/trytond.conf'
from trytond.config import config
config.update_etc('/home/gnuhealth/trytond.conf')

from trytond.pool import Pool
from trytond.transaction import Transaction

Pool.start()
pool = Pool('gnuhealth')
pool.init()

with Transaction().start('gnuhealth', 1, readonly=True) as transaction:
    models_to_check = [
        'party.party',
        'company.company',
        'gnuhealth.institution',
        'gnuhealth.healthprofessional',
        'gnuhealth.specialty',
        'gnuhealth.patient',
        'gnuhealth.appointment',
        'gnuhealth.patient.evaluation',
        'gnuhealth.prescription.order',
        'gnuhealth.prescription.line',
        'gnuhealth.medicament',
        'gnuhealth.lab.test.type',
        'gnuhealth.patient.lab.test',
        'gnuhealth.imaging.test',
        'gnuhealth.patient.imaging.test',
        'gnuhealth.patient.rounding.medical_service',
        'gnuhealth.health_service',
        'product.template',
        'product.product',
        'account.invoice',
        'account.invoice.line',
        'account.payment',
        'account.move',
        'account.move.line',
    ]
    for model_name in models_to_check:
        try:
            Model = pool.get(model_name)
            fields = list(Model._fields.keys())
            print(f"FOUND: {model_name} (fields: {len(fields)})")
        except KeyError:
            print(f"NOT FOUND: {model_name}")

    # List all gnuhealth models
    all_models = [m for m in pool._pool[pool.database_name]['model'].keys() if 'health' in m or 'lab' in m or 'imaging' in m]
    print(f"\nTotal health/lab/imaging models: {len(all_models)}")
    for m in sorted(all_models)[:30]:
        print(f"  {m}")
