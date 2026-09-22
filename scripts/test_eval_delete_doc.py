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
    try:
        Evaluation.delete([ev])
        print("DELETE BY DOCTOR SUCCEEDED (UNEXPECTED)")
    except Exception as e:
        print("DELETE BY DOCTOR RAISED AS EXPECTED:", type(e).__name__, e)
