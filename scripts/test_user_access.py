from trytond.config import config
config.update_etc('/home/gnuhealth/trytond.conf')
from trytond.pool import Pool
from trytond.transaction import Transaction

Pool.start()
pool = Pool('gnuhealth')
pool.init()
ModelAccess = pool.get('ir.model.access')
User = pool.get('res.user')

Transaction().stop()
with Transaction().start('gnuhealth', 146, context={'company': 2, '_check_access': True}) as t:
    print('Trx user:', t.user)
    print('Trx check_access:', t.check_access)
    print('check write res.user:', ModelAccess.check('res.user', 'write', raise_exception=False))
    print('check create res.user:', ModelAccess.check('res.user', 'create', raise_exception=False))
    print('check delete res.user:', ModelAccess.check('res.user', 'delete', raise_exception=False))
    try:
        ModelAccess.check('res.user', 'write', raise_exception=True)
        print("ModelAccess write succeeded!")
    except Exception as e:
        print(f"ModelAccess write raised: {type(e).__name__}: {e}")
