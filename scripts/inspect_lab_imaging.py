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
    models = pool._pool[pool.database_name]['model'].keys()
    print("--- LAB MODELS ---")
    for m in sorted([x for x in models if 'lab' in x]):
        print(f"  {m}")
    print("--- IMAGING MODELS ---")
    for m in sorted([x for x in models if 'imaging' in x]):
        print(f"  {m}")
    print("--- EVALUATION MODELS ---")
    for m in sorted([x for x in models if 'evaluation' in x]):
        print(f"  {m}")
