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

Invoice = pool.get('account.invoice')
Move = pool.get('account.move')

print("--- Testing posted invoice deletion as demo_cashier1 (152) ---")
try:
    with Transaction().start('gnuhealth', 152, context={'company': 2, '_check_access': True}):
        inv = Invoice(22)
        print(f"Invoice {inv.id} state: {inv.state}")
        Invoice.delete([inv])
        print("DELETE INVOICE SUCCEEDED! (UNEXPECTED)")
except Exception as e:
    print(f"Delete invoice DENIED as expected with {type(e).__name__}: {e}")

print("--- Testing posted move deletion as demo_cashier1 (152) ---")
try:
    with Transaction().start('gnuhealth', 152, context={'company': 2, '_check_access': True}):
        m = Move(24)
        print(f"Move {m.id} state: {m.state}")
        Move.delete([m])
        print("DELETE MOVE SUCCEEDED! (UNEXPECTED)")
except Exception as e:
    print(f"Delete move DENIED as expected with {type(e).__name__}: {e}")

print("--- Testing evaluation modification by demo_frontdesk1 (151) ---")
Evaluation = pool.get('gnuhealth.patient.evaluation')
try:
    with Transaction().start('gnuhealth', 151, context={'company': 2, '_check_access': True}):
        ev = Evaluation(31)
        ev.notes = "Frontdesk trying to tamper"
        ev.save()
        print("EVAL WRITE SUCCEEDED! (UNEXPECTED)")
except Exception as e:
    print(f"Eval write DENIED as expected with {type(e).__name__}: {e}")

print("--- Testing evaluation creation by demo_frontdesk1 (151) ---")
try:
    with Transaction().start('gnuhealth', 151, context={'company': 2, '_check_access': True}):
        ev = Evaluation(patient=52, healthprof=71, chief_complaint="tamper")
        ev.save()
        print("EVAL CREATE SUCCEEDED! (UNEXPECTED)")
except Exception as e:
    print(f"Eval create DENIED as expected with {type(e).__name__}: {e}")
