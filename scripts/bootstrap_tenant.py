#!/usr/bin/env python3
"""
IST Health -- bootstrap a freshly provisioned hospital database so it is usable end to end.

The tenant template (gnuhealth_template.dump) is a clean GNU Health schema, but it ships WITHOUT:
  * an institution (so wards/beds cannot be created from the Facilities screen),
  * a chart of accounts, fiscal year and payment method (so no invoice can be posted or paid),
  * the company's real name, currency and timezone ("New Hospital (Rename Me)", USD).
This script adds exactly those, using Tryton's own wizards/models (no raw SQL), and is safe to re-run:
every step checks for existing records first.

Run on the VM as the gnuhealth user, against one database at a time:
    sudo -u gnuhealth env TRYTOND_CONFIG=/home/gnuhealth/trytond.conf \
        /home/gnuhealth/venv/bin/python3 bootstrap_tenant.py <database> \
        --name "Hospital Name" --code ASTMC --currency INR --timezone Asia/Kolkata
"""
import argparse
import datetime
import os
import sys

os.environ.setdefault("TRYTOND_CONFIG", "/home/gnuhealth/trytond.conf")

from trytond.pool import Pool
from trytond.transaction import Transaction


def log(msg):
    print(msg, flush=True)


# Access-control rows that production (the main hospital database) has but the clean template lacks.
# Found by diffing ir.model.access of the main database against a fresh clone (scripts/diff_acl.py):
# the 11 rows below were the ONLY differences, and ir.rule was identical. Without them a new hospital
# cannot order lab tests from a consultation, a nurse cannot admit patients, accounting cannot see
# insurance, and reception cannot read orders. (model, group, read, write, create, delete)
PRODUCTION_ACL = [
    ("gnuhealth.hospital.bed", "Health Nurse", True, True, False, False),
    ("gnuhealth.hospital.or", "Health Doctor", True, True, False, False),
    ("gnuhealth.imaging.test", "Health Front Desk", True, False, False, False),
    ("gnuhealth.imaging.test.request", "Health Front Desk", True, False, False, False),
    ("gnuhealth.inpatient.registration", "Health Nurse", True, True, True, False),
    ("gnuhealth.insurance", "Account", True, True, True, True),
    ("gnuhealth.insurance", "Accounting Party", True, True, True, True),
    ("gnuhealth.lab", "Health Doctor", True, True, True, False),
    ("gnuhealth.lab", "Health Front Desk", True, False, False, False),
    ("gnuhealth.lab.test_type", "Health Front Desk", True, False, False, False),
    ("gnuhealth.prescription.order", "Health Front Desk", True, False, False, False),
]


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("database")
    ap.add_argument("--name", required=True, help="Hospital display name (company and institution party)")
    ap.add_argument("--code", required=True, help="Short institution code, e.g. ASTMC")
    ap.add_argument("--currency", default="INR")
    ap.add_argument("--timezone", default="Asia/Kolkata")
    ap.add_argument("--type", default="hospital", help="institution type: hospital (General Hospital), specialized, clinic ...")
    args = ap.parse_args()
    if not args.database.startswith("gnuhealth_h_"):
        sys.exit("Refusing: this script only bootstraps hospital databases named gnuhealth_h_<code>.")

    db = args.database
    Pool.start()
    pool = Pool(db)
    pool.init()

    # ---------------------------------------------------------------- 1. company
    with Transaction().start(db, 0, context={}) as txn:
        Company = pool.get("company.company")
        Party = pool.get("party.party")
        Currency = pool.get("currency.currency")
        company = Company.search([], limit=1)[0]
        currency = Currency.search([("code", "=", args.currency)], limit=1)
        if not currency:
            sys.exit(f"Currency {args.currency} not found")
        has_moves = pool.get("account.move").search([], count=True) > 0
        if not has_moves:
            Party.write([company.party], {"name": args.name})
            Company.write([company], {"currency": currency[0].id, "timezone": args.timezone})
        company_id = company.id
        party_id = company.party.id
        txn.commit()
    log(f"company: {args.name} ({args.currency}, {args.timezone})")

    ctx = {"company": company_id}

    # ---------------------------------------------------------------- 2. institution
    with Transaction().start(db, 0, context=ctx) as txn:
        Institution = pool.get("gnuhealth.institution")
        if Institution.search([], count=True) == 0:
            # gnuhealth.institution.party has the domain is_institution = True.
            pool.get("party.party").write([pool.get("party.party")(party_id)], {"is_institution": True})
            Institution.create([{"party": party_id, "code": args.code, "institution_type": args.type, "public_level": "private"}])
            log(f"institution created: {args.code}")
        else:
            log("institution: already present")
        txn.commit()

    # ---------------------------------------------------------------- 3. chart of accounts
    # The wizard writes the account.configuration singleton, which Tryton needs pre-locked.
    with Transaction().start(db, 0, context=ctx, _lock_tables=["account_configuration"]) as txn:
        Account = pool.get("account.account")
        if Account.search([("company", "=", company_id)], count=True) == 0:
            Template = pool.get("account.account.template")
            template = Template.search([("parent", "=", None)], limit=1)[0]
            CreateChart = pool.get("account.create_chart", type="wizard")
            session_id, _, _ = CreateChart.create()
            wiz = CreateChart(session_id)
            wiz.account.account_template = template
            wiz.account.company = pool.get("company.company")(company_id)
            wiz.transition_create_account()
            receivable = Account.search(
                [("company", "=", company_id), ("type.receivable", "=", True), ("closed", "!=", True)], limit=1)[0]
            payable = Account.search(
                [("company", "=", company_id), ("type.payable", "=", True), ("closed", "!=", True)], limit=1)[0]
            wiz.properties.company = pool.get("company.company")(company_id)
            wiz.properties.account_receivable = receivable
            wiz.properties.account_payable = payable
            wiz.transition_create_properties()
            log(f"chart of accounts created from '{template.name}'")
        else:
            log("chart of accounts: already present")
        txn.commit()

    # ---------------------------------------------------------------- 4. fiscal year + periods
    year = datetime.date.today().year
    with Transaction().start(db, 0, context=ctx,
                             _lock_tables=["account_fiscalyear", "account_period", "ir_sequence"]) as txn:
        FiscalYear = pool.get("account.fiscalyear")
        if FiscalYear.search([("company", "=", company_id)], count=True) == 0:
            Sequence = pool.get("ir.sequence")
            SequenceType = pool.get("ir.sequence.type")
            seq_type = SequenceType.search([("name", "=", "Account Move")], limit=1)[0]
            seq, = Sequence.create([{"name": f"Account Move {year}", "sequence_type": seq_type.id,
                                     "company": company_id}])
            fy, = FiscalYear.create([{
                "name": f"Fiscal Year {year}",
                "start_date": datetime.date(year, 1, 1),
                "end_date": datetime.date(year, 12, 31),
                "company": company_id,
                "post_move_sequence": seq.id,
            }])
            FiscalYear.create_period([fy])
            log(f"fiscal year {year} created with monthly periods")
        else:
            log("fiscal year: already present")
        txn.commit()

    # ---------------------------------------------------------------- 4b. invoice numbering
    # Posting an invoice needs invoice sequences on the fiscal year (same single strict sequence the
    # main hospital uses for customer invoices, supplier invoices and credit notes).
    with Transaction().start(db, 0, context=ctx,
                             _lock_tables=["account_fiscalyear", "ir_sequence_strict"]) as txn:
        FiscalYear = pool.get("account.fiscalyear")
        for fy in FiscalYear.search([("company", "=", company_id)]):
            if fy.invoice_sequences:
                log(f"invoice sequences: already present for {fy.name}")
                continue
            SequenceType = pool.get("ir.sequence.type")
            Strict = pool.get("ir.sequence.strict")
            inv_type = SequenceType.search([("name", "=", "Invoice")], limit=1)[0]
            fy_year = fy.start_date.year
            seq, = Strict.create([{"name": f"Customer Invoice Strict {fy_year}", "sequence_type": inv_type.id,
                                   "prefix": f"INV-{fy_year}/", "padding": 5, "company": company_id}])
            pool.get("account.fiscalyear.invoice_sequence").create([{
                "fiscalyear": fy.id, "company": company_id,
                "out_invoice_sequence": seq.id, "in_invoice_sequence": seq.id,
                "out_credit_note_sequence": seq.id, "in_credit_note_sequence": seq.id,
            }])
            log(f"invoice sequences created for {fy.name}")
        txn.commit()

    # ---------------------------------------------------------------- 5. cash payment method
    with Transaction().start(db, 0, context=ctx) as txn:
        Method = pool.get("account.invoice.payment.method")
        Journal = pool.get("account.journal")
        Account = pool.get("account.account")
        if Method.search([("company", "=", company_id)], count=True) == 0:
            journal = Journal.search([("name", "=", "Cash")], limit=1)[0]
            cash = Account.search([("company", "=", company_id), ("name", "=", "Main Cash")], limit=1)[0]
            Method.create([{
                "name": f"Cash Payment ({args.currency})",
                "company": company_id,
                "journal": journal.id,
                "credit_account": cash.id,
                "debit_account": cash.id,
            }])
            log(f"payment method created: Cash Payment ({args.currency})")
        else:
            log("payment method: already present")
        txn.commit()

    # ---------------------------------------------------------------- 6. production access control
    with Transaction().start(db, 0, context=ctx) as txn:
        Group, Model, Access = (pool.get(m) for m in ("res.group", "ir.model", "ir.model.access"))
        changed = 0
        for model_name, group_name, r, w, c, d in PRODUCTION_ACL:
            group = Group.search([("name", "=", group_name)], limit=1)
            model = Model.search([("model", "=", model_name)], limit=1)
            if not group or not model:
                log(f"ACL skipped (missing group or model): {model_name} / {group_name}")
                continue
            existing = Access.search([("model", "=", model[0].id), ("group", "=", group[0].id)], limit=1)
            wanted = {"perm_read": r, "perm_write": w, "perm_create": c, "perm_delete": d}
            if existing:
                cur = existing[0]
                if (bool(cur.perm_read), bool(cur.perm_write), bool(cur.perm_create), bool(cur.perm_delete)) != (r, w, c, d):
                    Access.write([cur], wanted)
                    changed += 1
            else:
                Access.create([{"model": model[0].id, "group": group[0].id, **wanted}])
                changed += 1
        txn.commit()
    log(f"production access control: {changed} row(s) added or updated")

    log("bootstrap complete")
    return 0


if __name__ == "__main__":
    sys.exit(main())
