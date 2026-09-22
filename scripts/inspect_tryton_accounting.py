import os
os.environ['TRYTOND_CONFIG'] = '/home/gnuhealth/trytond.conf'

from trytond.pool import Pool
from trytond.transaction import Transaction, check_access
from trytond.exceptions import UserError
from trytond.model.exceptions import AccessError
from trytond.config import config

config.update_etc('/home/gnuhealth/trytond.conf')
Pool.start()
pool = Pool('gnuhealth')
pool.init()

User = pool.get('res.user')
Move = pool.get('account.move')
ModelAccess = pool.get('ir.model.access')

with Transaction().start('gnuhealth', 1, context={'company': 2}):
    user_fd = User.search([('login', '=', 'demo_frontdesk1')])[0]

print("Testing with context _check_access=True:")
with Transaction().start('gnuhealth', user_fd.id, context={'company': 2, '_check_access': True}):
    print("check_access property:", Transaction().check_access)
    try:
        ModelAccess.check('account.move', 'create', raise_exception=True)
        print("UNEXPECTED: account.move create allowed")
    except Exception as e:
        print("PASS! Denied as expected:", type(e).__name__, str(e)[:80])
