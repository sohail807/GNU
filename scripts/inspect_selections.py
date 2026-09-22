#!/usr/bin/env python3
import os
os.environ['TRYTOND_CONFIG'] = '/home/gnuhealth/trytond.conf'
from trytond.config import config
config.update_etc('/home/gnuhealth/trytond.conf')

from trytond.pool import Pool
from trytond.transaction import Transaction

Pool.start()
pool = Pool('gnuhealth')
pool.init()

with Transaction().start('gnuhealth', 1, readonly=True):
    Eval = pool.get('gnuhealth.patient.evaluation')
    print("Eval discharge_reason selection:", getattr(Eval.discharge_reason, 'selection', None))
    print("Eval evaluation_type selection:", getattr(Eval.evaluation_type, 'selection', None))
    
    Apt = pool.get('gnuhealth.appointment')
    print("Apt appointment_type selection:", getattr(Apt.appointment_type, 'selection', None))
    print("Apt state selection:", getattr(Apt.state, 'selection', None))

    ImgResult = pool.get('gnuhealth.imaging.test.result')
    print("Imaging Result fields:", list(ImgResult._fields.keys()))
    print("Imaging Result required:", [k for k, f in ImgResult._fields.items() if getattr(f, 'required', False)])
