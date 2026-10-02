"""Regenerate ops.xml (model access rules). Run from this folder: python gen_access.py"""
D = 'health.group_health_doctor'
N = 'health.group_health_nursing'
F = 'health.group_health_frontdesk'
A = 'health.group_health_admin'
AC = 'account.group_account'
ACA = 'account.group_account_admin'
SA = 'health_surgery.group_health_surgery_admin'
GA = 'health_gyneco.group_health_gyneco_admin'
LAB = 'health_lab.group_health_lab'
LABA = 'health_lab.group_health_lab_admin'

WORK = {
    'ist.ops.ed_visit': [F, D, N, A],
    'ist.ops.admission_plan': [F, AC, ACA, D, A],
    'ist.ops.discharge': [D, N, F, AC, ACA, A],
    'ist.ops.referral': [F, D, N, A],
    'ist.ops.stock': [AC, ACA, A],
    'ist.ops.surgery_checklist': [D, N, SA, A],
    'ist.ops.delivery': [D, N, GA, A],
    'ist.ops.critical_alert': [D, N, LAB, LABA, A],
    'ist.ops.purchase_request': [AC, ACA, A],
    'ist.ops.order_set': [D, N, A],
}

# Native GNU Health models the app reads for pharmacy and billing staff. Read only: the pharmacist must see what to
# dispense (and stock is taken out per medicine line) without being allowed to edit the doctor's prescription.
READ_ONLY = {
    'gnuhealth.prescription.line': [AC, ACA],
    # A triage nurse must see a patient's recorded allergies (and the diagnosis names behind them) before treating.
    # The app already allows nursing to read allergies; without these rules the backend refused and the screen said "restricted".
    'gnuhealth.pathology': [N],
}

# Nurses record allergies at triage (the app allows it) and mark them resolved, so they need to create and change patient
# disease lines. They cannot delete them.
# Saving a disease line also writes the patient's "Page of Life" timeline entry, so nursing needs that table too.
WRITE_NO_DELETE = {
    'gnuhealth.patient.disease': [N],
    'gnuhealth.pol': [N],
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
            <field name="perm_delete" eval="{g == A or model == 'ist.ops.order_set'}"/>
        </record>''')
for model, groups in READ_ONLY.items():
    slug = model.split('.')[-1] if model.count('.') < 2 else '_'.join(model.split('.')[-2:])
    for g in groups:
        out.append(f'''        <record model="ir.model.access" id="access_{slug}_{g.split('.')[-1]}_read">
            <field name="model" search="[('model', '=', '{model}')]"/>
            <field name="group" ref="{g}"/>
            <field name="perm_read" eval="True"/>
            <field name="perm_write" eval="False"/>
            <field name="perm_create" eval="False"/>
            <field name="perm_delete" eval="False"/>
        </record>''')
for model, groups in WRITE_NO_DELETE.items():
    slug = '_'.join(model.split('.')[-2:])
    for g in groups:
        out.append(f'''        <record model="ir.model.access" id="access_{slug}_{g.split('.')[-1]}_work">
            <field name="model" search="[('model', '=', '{model}')]"/>
            <field name="group" ref="{g}"/>
            <field name="perm_read" eval="True"/>
            <field name="perm_write" eval="True"/>
            <field name="perm_create" eval="True"/>
            <field name="perm_delete" eval="False"/>
        </record>''')
out += ['    </data>', '</tryton>']
open('ops.xml', 'w', encoding='utf-8').write('\n'.join(out) + '\n')
print(len(WORK), 'models')
