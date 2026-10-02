#!/usr/bin/env python3
"""
IST Health -- Grant the Account/Accounting Party groups create/write access to
gnuhealth.insurance.

Context: CLAUDE.md documents Cashier/Accountant as the persona responsible for
insurance enrollment (access-control.ts grants "insurance: true" to both the
cashier and accountant frontend roles), but the underlying Tryton ACL was
never actually granted to their groups ("Account", "Accounting Party") -
confirmed live: demo_cashier1 could read existing gnuhealth.insurance records
(inherited from a blanket read-only rule) but enrolling a new patient failed
with "Access Denied: Security rules prevent access to gnuhealth.insurance."
Every other module this role needs (billing, pharmacy) already has a real
ACL grant; this one was simply missed.

Run on the VM as the gnuhealth user, with TRYTOND_CONFIG set, against one
database at a time:
    sudo -u gnuhealth env TRYTOND_CONFIG=/home/gnuhealth/trytond.conf \
        /home/gnuhealth/venv/bin/python3 grant_insurance_acl_to_accounting.py <database>
"""
import sys

from trytond.transaction import Transaction
from trytond.pool import Pool

GROUP_NAMES = ["Account", "Accounting Party"]
MODEL_NAME = "gnuhealth.insurance"


def main():
    if len(sys.argv) != 2:
        print("Usage: grant_insurance_acl_to_accounting.py <database>")
        return 1
    database = sys.argv[1]

    Pool.start()
    pool = Pool(database)
    pool.init()

    with Transaction().start(database, 0) as transaction:
        Group = pool.get("res.group")
        Model = pool.get("ir.model")
        ModelAccess = pool.get("ir.model.access")

        groups = Group.search([("name", "in", GROUP_NAMES)])
        found_names = {g.name for g in groups}
        missing = set(GROUP_NAMES) - found_names
        if missing:
            print(f"ERROR: group(s) not found: {missing}")
            return 1

        models = Model.search([("model", "=", MODEL_NAME)], limit=1)
        if not models:
            print(f"ERROR: model not found: {MODEL_NAME}")
            return 1
        model = models[0]

        existing = ModelAccess.search([
            ("model", "=", model.id),
            ("group", "in", [g.id for g in groups]),
        ])
        existing_group_ids = {a.group.id for a in existing if a.group}

        created = []
        for group in groups:
            if group.id in existing_group_ids:
                continue
            access = ModelAccess()
            access.model = model
            access.group = group
            access.perm_read = True
            access.perm_write = True
            access.perm_create = True
            access.perm_delete = True
            access.save()
            created.append(group.name)

        transaction.commit()
        print(f"Granted access to: {created}")
        print(f"Already had an access record: {sorted(existing_group_ids)}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
