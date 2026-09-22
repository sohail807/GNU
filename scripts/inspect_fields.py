import os
from trytond.config import config
config.update_etc('/home/gnuhealth/trytond.conf')
from trytond.pool import Pool
from trytond.transaction import Transaction
Pool.start()
pool = Pool('gnuhealth')
pool.init()
Patient = pool.get('gnuhealth.patient')
with Transaction().start('gnuhealth', 1, readonly=True):
    cursor = Transaction().connection.cursor()
    cursor.execute("SELECT column_name FROM information_schema.columns WHERE table_name = 'gnuhealth_patient';")
    cols = [r[0] for r in cursor.fetchall()]
    print('gnuhealth_patient SQL columns:', cols)
    print('Patient fields:', {k: type(v).__name__ for k, v in Patient._fields.items() if 'name' in k or 'party' in k})
