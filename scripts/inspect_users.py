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
    User = pool.get('res.user')
    users = User.search([('login', 'like', 'demo_%')])
    for u in users:
        print(f"User {u.id} ({u.login}): groups = {[(g.id, g.name) for g in u.groups]}")
