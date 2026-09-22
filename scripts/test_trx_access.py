from trytond.config import config
config.update_etc('/home/gnuhealth/trytond.conf')
from trytond.pool import Pool
from trytond.transaction import Transaction, check_access

Pool.start()
pool = Pool('gnuhealth')
pool.init()

with Transaction().start('gnuhealth', 151, context={'company': 2, '_check_access': True}) as t:
    print("t.user:", t.user)
    print("t.context:", t.context)
    print("t.check_access:", t.check_access)
    
    ModelAccess = pool.get('ir.model.access')
    print("ModelAccess.check read:", ModelAccess.check('gnuhealth.patient.evaluation', 'read', raise_exception=False))
    print("ModelAccess.check write:", ModelAccess.check('gnuhealth.patient.evaluation', 'write', raise_exception=False))
    print("ModelAccess.check create:", ModelAccess.check('gnuhealth.patient.evaluation', 'create', raise_exception=False))

with Transaction().start('gnuhealth', 151, context={'company': 2}) as t:
    with check_access():
        print("\nWith check_access():")
        print("t.user:", t.user)
        print("t.context:", t.context)
        print("t.check_access:", t.check_access)
        print("ModelAccess.check read:", ModelAccess.check('gnuhealth.patient.evaluation', 'read', raise_exception=False))
        print("ModelAccess.check write:", ModelAccess.check('gnuhealth.patient.evaluation', 'write', raise_exception=False))
        print("ModelAccess.check create:", ModelAccess.check('gnuhealth.patient.evaluation', 'create', raise_exception=False))
