#!/usr/bin/env python3
import sys
import json
import os

os.environ['TRYTOND_CONFIG'] = '/home/gnuhealth/trytond.conf'
from trytond.config import config
config.update_etc('/home/gnuhealth/trytond.conf')

from trytond.pool import Pool
from trytond.transaction import Transaction

Pool.start()
pool = Pool('gnuhealth')
pool.init()

info = {}

with Transaction().start('gnuhealth', 1, readonly=True) as transaction:
    # 1. Versions & modules
    Module = pool.get('ir.module')
    installed_modules = [m.name for m in Module.search([('state', '=', 'installed')])]
    info['installed_modules_count'] = len(installed_modules)
    info['health_modules'] = [m for m in installed_modules if 'health' in m]

    # 2. Company & Institution
    Company = pool.get('company.company')
    companies = Company.search([])
    info['companies'] = [{'id': c.id, 'name': c.party.name, 'currency': c.currency.code} for c in companies]

    Institution = pool.get('gnuhealth.institution') if 'gnuhealth.institution' in pool._pool.get('gnuhealth', {}) else None
    if Institution:
        institutions = Institution.search([])
        info['institutions'] = [{'id': inst.id, 'name': inst.name.name if inst.name else None} for inst in institutions]

    # 3. Currency & Accounts
    Currency = pool.get('currency.currency')
    qar = Currency.search([('code', '=', 'QAR')])
    info['qar_currency'] = [{'id': c.id, 'code': c.code, 'symbol': c.symbol} for c in qar]

    Account = pool.get('account.account')
    accounts = Account.search([])
    info['accounts'] = [{'id': a.id, 'code': a.code, 'name': a.name, 'type': a.type.name if a.type else None} for a in accounts]

    # 4. Fiscal Year
    FiscalYear = pool.get('account.fiscalyear')
    fyears = FiscalYear.search([])
    info['fiscal_years'] = [{'id': fy.id, 'name': fy.name, 'state': fy.state} for fy in fyears]

    # 5. Sequences
    Sequence = pool.get('ir.sequence')
    seqs = Sequence.search([('name', 'ilike', '%invoice%')])
    info['invoice_sequences'] = [{'id': s.id, 'name': s.name, 'prefix': s.prefix} for s in seqs]

    # 6. Products / Services
    Product = pool.get('product.template')
    products = Product.search([('type', '=', 'service')])
    info['service_products'] = [{'id': p.id, 'name': p.name, 'code': p.code, 'list_price': float(p.list_price) if p.list_price else None} for p in products]

    # 7. Users & Roles
    User = pool.get('res.user')
    users = User.search([('active', '=', True)])
    info['users'] = [{'id': u.id, 'login': u.login, 'name': u.name} for u in users]

    Group = pool.get('res.group')
    health_groups = Group.search([('name', 'ilike', '%health%')])
    info['health_groups'] = [{'id': g.id, 'name': g.name} for g in health_groups]

    # 8. Health Professionals
    HealthProf = pool.get('gnuhealth.healthprofessional') if 'gnuhealth.healthprofessional' in pool._pool.get('gnuhealth', {}) else None
    if HealthProf:
        profs = HealthProf.search([])
        info['health_professionals'] = [{'id': hp.id, 'name': hp.name.name if hp.name else None, 'active': hp.active} for hp in profs]

    # 9. Specialties
    Specialty = pool.get('gnuhealth.specialty') if 'gnuhealth.specialty' in pool._pool.get('gnuhealth', {}) else None
    if Specialty:
        specs = Specialty.search([])
        info['specialties_count'] = len(specs)

print(json.dumps(info, indent=2))
