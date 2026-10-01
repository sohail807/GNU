"""Regenerate ops.xml (model access rules). Run from this folder: python gen_access.py"""
D = 'health.group_health_doctor'
N = 'health.group_health_nursing'
F = 'health.group_health_frontdesk'
A = 'health.group_health_admin'
AC = 'account.group_account'
ACA = 'account.group_account_admin'
SA = 'health_surgery.group_health_surgery_admin'
GA = 'health_gyneco.group_health_gyneco_admin'

WORK = {
    'ist.ops.ed_visit': [F, D, N, A],
    'ist.ops.admission_plan': [F, AC, ACA, D, A],
    'ist.ops.discharge': [D, N, F, AC, ACA, A],
    'ist.ops.referral': [F, D, N, A],
    'ist.ops.stock': [AC, ACA, A],
    'ist.ops.surgery_checklist': [D, N, SA, A],
    'ist.ops.delivery': [D, N, GA, A],
}

out = ['<?xml version="1.0"?>', '<tryton>', '    <data>',
       '        <!-- everyone may read; the groups below may work with the records -->']
for model, groups in WORK.items():
    slug = model.split('.')[-1]
    out.append(f'''        <record model="ir.model.access" id="access_{slug}_default">
            <field name="model" search="[('model', '=', '{model}')]"/>
            <field name="perm_read" eval="True"/>
            <field name="perm_write" eval="False"/>
            <field name="perm_create" eval="False"/>
            <field name="perm_delete" eval="False"/>
        </record>''')
    for g in groups:
        out.append(f'''        <record model="ir.model.access" id="access_{slug}_{g.split('.')[-1]}">
            <field name="model" search="[('model', '=', '{model}')]"/>
            <field name="group" ref="{g}"/>
            <field name="perm_read" eval="True"/>
            <field name="perm_write" eval="True"/>
            <field name="perm_create" eval="True"/>
            <field name="perm_delete" eval="{g == A}"/>
        </record>''')
out += ['    </data>', '</tryton>']
open('ops.xml', 'w', encoding='utf-8').write('\n'.join(out) + '\n')
print(len(WORK), 'models')
