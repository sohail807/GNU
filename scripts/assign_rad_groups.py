import os
os.environ['TRYTOND_CONFIG'] = '/home/gnuhealth/trytond.conf'
from trytond.config import config
config.update_etc('/home/gnuhealth/trytond.conf')

from trytond.pool import Pool
from trytond.transaction import Transaction

Pool.start()
pool = Pool('gnuhealth')
pool.init()

with Transaction().start('gnuhealth', 1) as t:
    User = pool.get('res.user')
    Group = pool.get('res.group')
    
    rad_user = User.search([('login', '=', 'demo_rad1')])[0]
    g_imaging = Group.search([('name', '=', 'Health Imaging')])[0]
    g_imaging_admin = Group.search([('name', '=', 'Health Imaging Administration')])[0]
    
    rad_user.groups = [g_imaging, g_imaging_admin]
    rad_user.save()
    t.commit()
    print("Updated demo_rad1 groups to:", [(g.id, g.name) for g in rad_user.groups])
