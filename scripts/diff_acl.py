#!/usr/bin/env python3
"""Compare access control (ir.model.access and ir.rule) between a reference database and a clone.

Read-only. Prints rows that differ so that tenant bootstrap can reproduce the production hardening.
    sudo -u gnuhealth env TRYTOND_CONFIG=/home/gnuhealth/trytond.conf \
        /home/gnuhealth/venv/bin/python3 diff_acl.py <reference_db> <clone_db>
"""
import json
import os
import sys

os.environ.setdefault("TRYTOND_CONFIG", "/home/gnuhealth/trytond.conf")
from trytond.pool import Pool
from trytond.transaction import Transaction


def acl(db):
    Pool.start()
    pool = Pool(db)
    pool.init()
    out = {}
    with Transaction().start(db, 0, context={}) as t:
        for a in pool.get("ir.model.access").search([]):
            key = (a.model.model if a.model else None, a.group.name if a.group else "*")
            out[key] = (bool(a.perm_read), bool(a.perm_write), bool(a.perm_create), bool(a.perm_delete))
        rules = {}
        for r in pool.get("ir.rule").search([]):
            rules[(r.rule_group.model.model, r.rule_group.name, r.domain)] = (r.rule_group.default_perm_read, r.rule_group.default_perm_write)
        t.rollback()
    return out, rules


def main():
    ref, clone = sys.argv[1], sys.argv[2]
    ref_acl, ref_rules = acl(ref)
    cl_acl, cl_rules = acl(clone)
    print(f"ACL rows: reference={len(ref_acl)} clone={len(cl_acl)}")
    diff = []
    for key in sorted(set(ref_acl) | set(cl_acl), key=str):
        r, c = ref_acl.get(key), cl_acl.get(key)
        if r != c:
            diff.append({"model": key[0], "group": key[1], "reference(r,w,c,d)": r, "clone(r,w,c,d)": c})
    print(f"ACL differences: {len(diff)}")
    for d in diff:
        print(json.dumps(d))
    print(f"RULES: reference={len(ref_rules)} clone={len(cl_rules)}; only in reference={len(set(ref_rules) - set(cl_rules))}, only in clone={len(set(cl_rules) - set(ref_rules))}")


if __name__ == "__main__":
    main()
