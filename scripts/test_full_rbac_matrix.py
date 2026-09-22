from trytond.config import config
config.update_etc('/home/gnuhealth/trytond.conf')
from trytond.pool import Pool
from trytond.transaction import Transaction

Pool.start()
pool = Pool('gnuhealth')
pool.init()
ModelAccess = pool.get('ir.model.access')

models_to_test = [
    ('Patient', 'gnuhealth.patient'),
    ('Appointment', 'gnuhealth.appointment'),
    ('Evaluation', 'gnuhealth.patient.evaluation'),
    ('Prescription', 'gnuhealth.prescription.order'),
    ('Lab', 'gnuhealth.lab'),
    ('Radiology', 'gnuhealth.imaging.test.request'),
    ('HealthService', 'gnuhealth.health_service'),
    ('Invoice', 'account.invoice'),
    ('PaymentMove', 'account.move'),
    ('FiscalYear', 'account.fiscalyear')
]

users = [
    ('demo_frontdesk1', 151),
    ('demo_nurse1', 148),
    ('demo_dr1', 146),
    ('demo_dr2', 147),
    ('demo_lab1', 149),
    ('demo_rad1', 150),
    ('demo_cashier1', 152),
    ('demo_admin1', 153)
]

for login, uid in users:
    print(f"\n=== User: {login} (ID {uid}) ===")
    with Transaction().start('gnuhealth', uid, context={'company': 2, '_check_access': True}):
        for mlabel, mname in models_to_test:
            r = "ALLOW" if ModelAccess.check(mname, 'read', raise_exception=False) else "DENY"
            c = "ALLOW" if ModelAccess.check(mname, 'create', raise_exception=False) else "DENY"
            w = "ALLOW" if ModelAccess.check(mname, 'write', raise_exception=False) else "DENY"
            d = "ALLOW" if ModelAccess.check(mname, 'delete', raise_exception=False) else "DENY"
            print(f"  {mlabel:15}: R:{r:5} C:{c:5} W:{w:5} D:{d:5}")
