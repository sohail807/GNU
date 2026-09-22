from trytond.config import config
config.update_etc('/home/gnuhealth/trytond.conf')
from trytond.pool import Pool
from trytond.transaction import Transaction

Pool.start()
pool = Pool('gnuhealth')
pool.init()
Evaluation = pool.get('gnuhealth.patient.evaluation')

with Transaction().start('gnuhealth', 146, context={'company': 2, '_check_access': True}) as t:
    ev = Evaluation(31)
    print("Evaluation 31 state:", ev.state)
    try:
        Evaluation.write([ev], {'notes': 'tampered by doctor'})
        print("Evaluation.write by doctor SUCCEEDED")
    except Exception as e:
        print("Evaluation.write by doctor RAISED:", type(e).__name__, e)
