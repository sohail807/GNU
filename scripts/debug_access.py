from trytond.config import config
config.update_etc('/home/gnuhealth/trytond.conf')
from trytond.pool import Pool
from trytond.transaction import Transaction

Pool.start()
pool = Pool('gnuhealth')
pool.init()
ModelAccess = pool.get('ir.model.access')

with Transaction().start('gnuhealth', 151, context={'company': 2, '_check_access': True}) as t:
    access = ModelAccess.get_access(['gnuhealth.patient.evaluation'])
    print("get_access for user 151 (frontdesk):", access)
    try:
        ModelAccess.check('gnuhealth.patient.evaluation', 'create', raise_exception=True)
        print("ModelAccess.check('create') DID NOT RAISE!")
    except Exception as e:
        print(f"ModelAccess.check('create') RAISED: {type(e).__name__}: {e}")
