from trytond.config import config
config.update_etc('/home/gnuhealth/trytond.conf')
from trytond.pool import Pool
from trytond.transaction import Transaction

Pool.start()
pool = Pool('gnuhealth')
pool.init()
User = pool.get('res.user')
Group = pool.get('res.group')

tests = [
    ("physician", 146),
    ("cashier", 152),
    ("frontdesk", 151),
    ("nurse", 148)
]

for role, uid in tests:
    Transaction().stop()
    try:
        with Transaction().start('gnuhealth', uid, context={'company': 2, '_check_access': True}):
            u = User(uid)
            g1 = Group(1)
            u.groups = list(u.groups) + [g1]
            u.save()
            print(f"Role {role} (ID {uid}) escalation SUCCEEDED (UNEXPECTED)")
    except Exception as e:
        print(f"Role {role} (ID {uid}) escalation DENIED with {type(e).__name__}: {e}")
