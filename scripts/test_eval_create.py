from trytond.config import config
config.update_etc('/home/gnuhealth/trytond.conf')
from trytond.pool import Pool
from trytond.transaction import Transaction

Pool.start()
pool = Pool('gnuhealth')
pool.init()
Evaluation = pool.get('gnuhealth.patient.evaluation')

with Transaction().start('gnuhealth', 151, context={'company': 2, '_check_access': True}) as t:
    print("t.check_access:", t.check_access)
    try:
        Evaluation.create([{'patient': 52, 'healthprof': 71, 'chief_complaint': 'tamper'}])
        print("Evaluation.create SUCCEEDED!")
    except Exception as e:
        print("Evaluation.create RAISED:", type(e).__name__, e)
