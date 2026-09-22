from trytond.config import config
config.update_etc('/home/gnuhealth/trytond.conf')
from trytond.pool import Pool
from trytond.transaction import Transaction

Pool.start()
pool = Pool('gnuhealth')
pool.init()

ModelAccess = pool.get('ir.model.access')
Group = pool.get('res.group')
Model = pool.get('ir.model')

with Transaction().start('gnuhealth', 1, readonly=True):
    models = Model.search([('model', '=', 'gnuhealth.patient.evaluation')])
    if models:
        m = models[0]
        accesses = ModelAccess.search([('model', '=', m.id)])
        print(f"Total access rules for {m.model}: {len(accesses)}")
        for a in accesses:
            gname = a.group.name if a.group else "GLOBAL (ALL USERS)"
            print(f"Group: '{gname}' -> Read:{a.perm_read}, Write:{a.perm_write}, Create:{a.perm_create}, Delete:{a.perm_delete}")
    else:
        print("Model gnuhealth.patient.evaluation not found in ir.model")
