"""Create the "Patient Advance (QAR)" payment method used to apply an admission advance to an invoice.

Applying an advance is then an ordinary invoice payment through Tryton's own payment wizard, paid "from" the Customer
Advances account (230000) instead of from cash: it reduces the patient's advance, settles the invoice and reconciles it,
with the same rights as taking a cash payment. Run create_advance_account.py first.

Runs ON THE SERVER with the GNU Health virtualenv.

Step 1, look only:
    Get-Content -Raw scripts/create_advance_payment_method.py | ssh -i "C:\\Users\\MohammedSohail\\.ssh\\gnuhealth_deploy" debian@34.7.237.8 "sudo -u gnuhealth /home/gnuhealth/venv/bin/python - --dry-run"

Step 2, create it:
    Get-Content -Raw scripts/create_advance_payment_method.py | ssh -i "C:\\Users\\MohammedSohail\\.ssh\\gnuhealth_deploy" debian@34.7.237.8 "sudo -u gnuhealth /home/gnuhealth/venv/bin/python - --create"
"""
import sys

DB = "gnuhealth"
CONF = "/home/gnuhealth/trytond.conf"
ADVANCE_ACCOUNT_CODE = "230000"
METHOD_NAME = "Patient Advance (QAR)"


def main():
    mode = sys.argv[1] if len(sys.argv) > 1 else "--dry-run"
    if mode not in ("--dry-run", "--create"):
        print("Use --dry-run or --create")
        return 2

    from trytond.config import config
    config.update_etc(CONF)
    from trytond.pool import Pool
    from trytond.transaction import Transaction

    Pool.start()
    pool = Pool(DB)
    pool.init()
    with Transaction().start(DB, 0) as transaction:
        Method = pool.get("account.invoice.payment.method")
        Account = pool.get("account.account")
        Journal = pool.get("account.journal")

        if Method.search([("name", "=", METHOD_NAME)]):
            print(f"Already there: {METHOD_NAME}. Nothing to do.")
            return 0
        accounts = Account.search([("code", "=", ADVANCE_ACCOUNT_CODE)])
        if not accounts:
            print(f"Account {ADVANCE_ACCOUNT_CODE} (Customer Advances) not found. Run create_advance_account.py first.")
            return 1
        cash_methods = Method.search([("name", "!=", METHOD_NAME)], limit=1)
        if not cash_methods:
            print("No existing payment method to take the journal and company from.")
            return 1
        template = cash_methods[0]
        advance = accounts[0]
        print(f"Would create '{METHOD_NAME}': company {template.company.id}, journal {template.journal.name}, "
              f"debit/credit account {advance.code} {advance.name}")
        if mode == "--dry-run":
            print("Dry run only. Nothing changed.")
            return 0
        created = Method.create([{
            "name": METHOD_NAME,
            "company": template.company.id,
            "journal": template.journal.id,
            "credit_account": advance.id,
            "debit_account": advance.id,
        }])
        transaction.commit()
        print(f"Created payment method {created[0].name} (id {created[0].id}).")
    return 0


if __name__ == "__main__":
    sys.exit(main())
