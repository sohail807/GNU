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
    Inst = pool.get('gnuhealth.institution')
    print("inst_type:", getattr(Inst.institution_type, 'selection', None))
    print("pub_level:", getattr(Inst.public_level, 'selection', None))
    existing = Inst.search([])
    print("existing insts:", [(i.id, i.code, i.party.name if i.party else None) for i in existing])
