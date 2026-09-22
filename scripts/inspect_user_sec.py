from trytond.config import config
config.update_etc('/home/gnuhealth/trytond.conf')
from trytond.pool import Pool
from trytond.transaction import Transaction

Pool.start()
pool = Pool('gnuhealth')
pool.init()
User = pool.get('res.user')
ModelAccess = pool.get('ir.model.access')
FieldAccess = pool.get('ir.model.field.access')
Rule = pool.get('ir.rule')

with Transaction().start('gnuhealth', 0, context={'company': 2}):
    print("--- Model Access for res.user ---")
    mas = ModelAccess.search([('model.model', '=', 'res.user')])
    for ma in mas:
        print(f"Group: {ma.group.name if ma.group else 'GLOBAL'}, R:{ma.perm_read}, W:{ma.perm_write}, C:{ma.perm_create}, D:{ma.perm_delete}")

    print("\n--- Field Access for res.user ---")
    fas = FieldAccess.search([('field.model.model', '=', 'res.user')])
    for fa in fas:
        print(f"Field: {fa.field.name}, Group: {fa.group.name if fa.group else 'GLOBAL'}, R:{fa.perm_read}, W:{fa.perm_write}")

    print("\n--- Rules for res.user ---")
    rules = Rule.search([('rule_group.model.model', '=', 'res.user')])
    for r in rules:
        print(f"Rule Group: {r.rule_group.name}, Domain: {r.domain}")

    print("\n--- Testing ModelAccess.check for res.user as physician (146) ---")
    with Transaction().set_user(146):
        print("physician check read:", ModelAccess.check('res.user', 'read', raise_exception=False))
        print("physician check write:", ModelAccess.check('res.user', 'write', raise_exception=False))
        print("physician check create:", ModelAccess.check('res.user', 'create', raise_exception=False))
        print("physician check delete:", ModelAccess.check('res.user', 'delete', raise_exception=False))
