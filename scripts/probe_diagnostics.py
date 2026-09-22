import os
from trytond.config import config
config.update_etc('/home/gnuhealth/trytond.conf')
from trytond.pool import Pool
from trytond.transaction import Transaction
from trytond.exceptions import UserError
try:
    from trytond.model.exceptions import AccessError
except ImportError:
    AccessError = UserError

Pool.start()
pool = Pool('gnuhealth')
pool.init()

print("--- Checking Password Hashes ---")
with Transaction().start('gnuhealth', 1, readonly=True):
    cursor = Transaction().connection.cursor()
    cursor.execute("SELECT id, login, password_hash FROM res_user WHERE login LIKE 'demo_%';")
    for r in cursor.fetchall():
        print(r[0], r[1], (r[2][:20] if r[2] else 'NULL'))

print("--- Checking Admin Isolation ---")
Group = pool.get('res.group')
with Transaction().start('gnuhealth', 1, readonly=True):
    g1 = Group(1)
    print("Admin group users:", [(u.id, u.login) for u in g1.users])

print("--- Checking Evaluation 31 write by demo_dr1 (146) ---")
Evaluation = pool.get('gnuhealth.patient.evaluation')
try:
    with Transaction().start('gnuhealth', 146, context={'company': 2, '_check_access': True}):
        ev = Evaluation(31)
        print("ev 31 state:", ev.state)
        ev.notes = "Testing write"
        ev.save()
        print("WRITE SUCCEEDED!")
except Exception as e:
    print("Write failed with:", type(e).__name__, e)

print("--- Checking ir.model.access check ---")
Access = pool.get('ir.model.access')
with Transaction().start('gnuhealth', 151, context={'company': 2}):
    for mode in ['read', 'write', 'create', 'delete']:
        res = Access.check('gnuhealth.patient.evaluation', mode, raise_exception=False)
        print(f"frontdesk eval {mode}: {res}")
