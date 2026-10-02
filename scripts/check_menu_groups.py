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
    Menu = pool.get('ir.ui.menu')
    # Health menu
    health_menu = Menu(135)
    print("Menu 'Health' (135) groups:", [(g.id, g.name) for g in health_menu.groups])
    
    # Medical Imaging menu
    img_menus = Menu.search([('name', 'ilike', '%imaging%')])
    for m in img_menus:
        print(f"Menu '{m.name}' ({m.id}) parent={m.parent.id if m.parent else None} groups={[ (g.id, g.name) for g in m.groups]}")
