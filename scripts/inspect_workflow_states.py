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
    models = [
        'gnuhealth.patient.evaluation',
        'gnuhealth.prescription.order',
        'gnuhealth.lab',
        'gnuhealth.imaging.test.request',
        'account.invoice',
    ]
    for m in models:
        Model = pool.get(m)
        print(f"\n{m} states:")
        print(" ", getattr(Model.state, 'selection', None))
