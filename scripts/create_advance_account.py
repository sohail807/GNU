"""Create the "Customer Advances" liability account (code 230000) in the Qatar Central Campus books.

Admission advances are booked as cash received against this account, per patient, and applied to the final invoice.
The account is a copy of your existing "Main Payable" (210000), so it has the same account type, parent and party
rules; only the code and name differ. Nothing else is touched.

Runs ON THE SERVER with the GNU Health virtualenv.

Step 1, look only:
    Get-Content -Raw scripts/create_advance_account.py | ssh -i "C:\\Users\\MohammedSohail\\.ssh\\gnuhealth_deploy" debian@34.7.237.8 "sudo -u gnuhealth /home/gnuhealth/venv/bin/python - --dry-run"

Step 2, create it:
    Get-Content -Raw scripts/create_advance_account.py | ssh -i "C:\\Users\\MohammedSohail\\.ssh\\gnuhealth_deploy" debian@34.7.237.8 "sudo -u gnuhealth /home/gnuhealth/venv/bin/python - --create"
"""
import sys

DB = "gnuhealth"
CONF = "/home/gnuhealth/trytond.conf"
SOURCE_CODE = "210000"
NEW_CODE = "230000"
NEW_NAME = "Customer Advances"


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
        Account = pool.get("account.account")
        existing = Account.search([("code", "=", NEW_CODE)])
        if existing:
            print(f"Already there: {existing[0].code} {existing[0].name} (id {existing[0].id}). Nothing to do.")
            return 0
        sources = Account.search([("code", "=", SOURCE_CODE)])
        if not sources:
            print(f"Source account {SOURCE_CODE} not found; stopping.")
            return 1
        for src in sources:
            kind = getattr(src.type, "name", "?")
            print(f"Would copy: {src.code} {src.name} (type {kind}, company {src.company.id if src.company else '-'}) -> {NEW_CODE} {NEW_NAME}")
        if mode == "--dry-run":
            print("Dry run only. Nothing changed.")
            return 0
        created = Account.copy(sources, default={"code": NEW_CODE, "name": NEW_NAME})
        transaction.commit()
        for acc in created:
            print(f"Created {acc.code} {acc.name} (id {acc.id}).")
    return 0


if __name__ == "__main__":
    sys.exit(main())
