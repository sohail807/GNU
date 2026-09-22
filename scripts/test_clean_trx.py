from trytond.config import config
config.update_etc('/home/gnuhealth/trytond.conf')
from trytond.pool import Pool
from trytond.transaction import Transaction

Pool.start()
pool = Pool('gnuhealth')
pool.init()
Evaluation = pool.get('gnuhealth.patient.evaluation')

print("--- Testing with clean transaction stop/start ---")
Transaction().stop()
try:
    with Transaction().start('gnuhealth', 151, context={'company': 2, '_check_access': True}) as t:
        print("Trx started. user:", t.user, "check_access:", t.check_access)
        ev = Evaluation(patient=52, healthprof=71, chief_complaint="tamper")
        ev.save()
        print("EVAL CREATE SUCCEEDED! (UNEXPECTED)")
except Exception as e:
    print(f"Eval create DENIED as expected: {type(e).__name__}: {e}")
finally:
    Transaction().stop()
