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
    Party = pool.get('party.party')
    print("Party required:", [k for k, f in Party._fields.items() if getattr(f, 'required', False)])
    for field in ['gender', 'dob', 'is_person', 'is_patient', 'is_healthprof']:
        if field in Party._fields:
            f = Party._fields[field]
            print(f"Party field {field}: type={f._type}, required={getattr(f, 'required', False)}")
