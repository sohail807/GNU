#!/usr/bin/env python3
"""
Harden and fix RBAC group memberships and password hashes for DEMO users.
Enforces strict least privilege:
- Removes accidental Administrator group (Group 1) memberships
- Assigns ONLY intended role-specific groups
- Sets secure native password hashes for all DEMO users
"""

import os
import secrets
import string
from trytond.config import config
config.update_etc('/home/gnuhealth/trytond.conf')

from trytond.pool import Pool
from trytond.transaction import Transaction

Pool.start()
pool = Pool('gnuhealth')
pool.init()

User = pool.get('res.user')
Group = pool.get('res.group')

ROLE_GROUPS = {
    'demo_dr1': ['Health Doctor'],
    'demo_dr2': ['Health Doctor'],
    'demo_nurse1': ['Health Nurse'],
    'demo_lab1': ['Health Lab'],
    'demo_rad1': ['Health Imaging'],
    'demo_frontdesk1': ['Health Front Desk'],
    'demo_cashier1': ['Account', 'Accounting Party'],
    'demo_admin1': ['Administration', 'Health Administration']
}

def generate_secure_pass():
    chars = string.ascii_letters + string.digits + "!@#$%^&*"
    return "".join(secrets.choice(chars) for _ in range(24))

with Transaction().start('gnuhealth', 1) as t:
    print("=== Hardening DEMO User Accounts ===")
    
    for login, group_names in ROLE_GROUPS.items():
        users = User.search([('login', '=', login)])
        if not users:
            print(f"User {login} not found, skipping.")
            continue
        u = users[0]
        
        # Resolve target groups
        target_groups = []
        for gname in group_names:
            grps = Group.search([('name', '=', gname)])
            if grps:
                target_groups.append(grps[0])
            else:
                print(f"WARNING: Group {gname} not found!")
                
        # Assign STRICTLY target groups (removes all other groups including Administration)
        u.groups = target_groups
        
        # Set secure password to generate proper hash
        temp_pwd = generate_secure_pass()
        u.password = temp_pwd
        u.save()
        print(f"User {u.login} (ID {u.id}): groups set to {[g.name for g in target_groups]}; password hash generated.")
        
    t.commit()
    print("=== User Hardening Committed Successfully ===")

with Transaction().start('gnuhealth', 1, readonly=True):
    cursor = Transaction().connection.cursor()
    cursor.execute("""
        SELECT u.id, u.login, 
               COALESCE(bool_or(g.id = 1), false) as is_admin,
               array_agg(g.name) as group_names,
               u.password_hash IS NOT NULL as has_hash
        FROM res_user u
        LEFT JOIN res_user_group_rel rel ON rel.user = u.id
        LEFT JOIN res_group g ON rel.group = g.id
        WHERE u.login LIKE 'demo_%'
        GROUP BY u.id, u.login
        ORDER BY u.id;
    """)
    print("\n--- Verified User State ---")
    for r in cursor.fetchall():
        uid, login, is_admin, gnames, has_hash = r
        print(f"User {login} (ID {uid}): Admin={is_admin}, HasHash={has_hash}, Groups={gnames}")
