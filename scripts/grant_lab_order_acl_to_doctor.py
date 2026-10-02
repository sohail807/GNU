#!/usr/bin/env python3
"""
IST Health -- Grant the "Health Doctor" group create/write access to
gnuhealth.lab (lab test orders).

Context: physicians order both lab tests and imaging studies from the same
consultation screen, calling the same kind of create endpoint for each -
but only imaging ordering actually worked. Confirmed live: demo_dr1
(Health Doctor group only) got "Access Denied: Security rules prevent
access to gnuhealth.lab" ordering a CBC, while ordering a Chest X-Ray via
gnuhealth.imaging.test.request succeeded immediately after, same patient,
same session. ir.model.access showed exactly why: Health Doctor's existing
access record on gnuhealth.lab has perm_read=True but perm_write/
perm_create=False - only "Health Lab" and "Health lab Administration" can
create an order, which is backwards for an ordering workflow (the
physician orders, the lab technician fulfills/reads it).

Updates the existing ir.model.access record for (gnuhealth.lab, Health
Doctor) rather than creating a duplicate one. Leaves perm_delete alone
(false) - a physician correcting/cancelling their own order is a separate
concern from being able to order at all, not needed to fix this bug.

Run on the VM as the gnuhealth user, with TRYTOND_CONFIG set, against one
database at a time:
    sudo -u gnuhealth env TRYTOND_CONFIG=/home/gnuhealth/trytond.conf \
        /home/gnuhealth/venv/bin/python3 grant_lab_order_acl_to_doctor.py <database>
"""
import sys

from trytond.transaction import Transaction
from trytond.pool import Pool

GROUP_NAME = "Health Doctor"
MODEL_NAME = "gnuhealth.lab"


def main():
    if len(sys.argv) != 2:
        print("Usage: grant_lab_order_acl_to_doctor.py <database>")
        return 1
    database = sys.argv[1]

    Pool.start()
    pool = Pool(database)
    pool.init()

    with Transaction().start(database, 0) as transaction:
        Group = pool.get("res.group")
        Model = pool.get("ir.model")
        ModelAccess = pool.get("ir.model.access")

        groups = Group.search([("name", "=", GROUP_NAME)], limit=1)
        if not groups:
            print(f"ERROR: group not found: {GROUP_NAME}")
            return 1
        group = groups[0]

        models = Model.search([("model", "=", MODEL_NAME)], limit=1)
        if not models:
            print(f"ERROR: model not found: {MODEL_NAME}")
            return 1
        model = models[0]

        existing = ModelAccess.search([
            ("model", "=", model.id),
            ("group", "=", group.id),
        ])

        if existing:
            access = existing[0]
            access.perm_read = True
            access.perm_write = True
            access.perm_create = True
            access.save()
            print(f"Updated existing access record {access.id}: perm_write=True, perm_create=True")
        else:
            access = ModelAccess()
            access.model = model
            access.group = group
            access.perm_read = True
            access.perm_write = True
            access.perm_create = True
            access.perm_delete = False
            access.save()
            print(f"Created new access record: {access.id}")

        transaction.commit()
    return 0


if __name__ == "__main__":
    sys.exit(main())
