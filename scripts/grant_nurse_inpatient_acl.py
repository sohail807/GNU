#!/usr/bin/env python3
"""
IST Health -- Grant "Health Nurse" write+create access to
gnuhealth.inpatient.registration and write access to gnuhealth.hospital.bed.

Context: the Inpatient Admissions & Ward Census module's entire UI (Admit
Patient, Discharge, Bed Clean) is built for the nursing role, but Health
Nurse only had read access to gnuhealth.inpatient.registration
(write=False, create=False) and no explicit row at all on
gnuhealth.hospital.bed (falling back to the default read=True/write=False).
Confirmed live: demo_nurse1 got "Access Denied: Security rules prevent
access to gnuhealth.inpatient.registration" on every admission attempt -
this is why a nurse-persona UAT pass marked every Inpatient test case as
failed.

Adds/updates explicit ir.model.access rows for (model, Health Nurse) on
both models. delete is left False on both - a nurse admitting/discharging
a patient or updating a bed's status doesn't need to delete either kind of
record outright.

Run on the VM as the gnuhealth user, with TRYTOND_CONFIG set, against one
database at a time:
    sudo -u gnuhealth env TRYTOND_CONFIG=/home/gnuhealth/trytond.conf \
        /home/gnuhealth/venv/bin/python3 grant_nurse_inpatient_acl.py <database>
"""
import sys
from trytond.transaction import Transaction
from trytond.pool import Pool

GROUP_NAME = "Health Nurse"
# (model, perm_read, perm_write, perm_create)
GRANTS = [
    ("gnuhealth.inpatient.registration", True, True, True),
    ("gnuhealth.hospital.bed", True, True, False),
]


def main():
    database = sys.argv[1]
    Pool.start()
    pool = Pool(database)
    pool.init()
    with Transaction().start(database, 0) as transaction:
        Group = pool.get("res.group")
        Model = pool.get("ir.model")
        ModelAccess = pool.get("ir.model.access")

        group = Group.search([("name", "=", GROUP_NAME)], limit=1)[0]

        for model_name, perm_read, perm_write, perm_create in GRANTS:
            model = Model.search([("model", "=", model_name)], limit=1)[0]
            existing = ModelAccess.search([("model", "=", model.id), ("group", "=", group.id)])
            if existing:
                access = existing[0]
                access.perm_read = perm_read
                access.perm_write = perm_write
                access.perm_create = perm_create
                access.save()
                print(f"Updated {model_name} access {access.id}: read={perm_read} write={perm_write} create={perm_create}")
            else:
                access = ModelAccess()
                access.model = model
                access.group = group
                access.perm_read = perm_read
                access.perm_write = perm_write
                access.perm_create = perm_create
                access.perm_delete = False
                access.save()
                print(f"Created {model_name} access {access.id}: read={perm_read} write={perm_write} create={perm_create}")
        transaction.commit()
    return 0


if __name__ == "__main__":
    sys.exit(main())
