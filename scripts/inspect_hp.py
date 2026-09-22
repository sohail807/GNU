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
    HpSpec = pool.get('gnuhealth.hp_specialty')
    print("HpSpecialty fields:", list(HpSpec._fields.keys()))
    print("HpSpecialty required:", [k for k, f in HpSpec._fields.items() if getattr(f, 'required', False)])
