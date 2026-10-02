"""Give every demo_* login of the Qatar Central Campus database a new strong random password.

Runs ON THE SERVER with the GNU Health virtualenv. It never stores a password: each new one is printed once to your
terminal and nothing else (no file, no log). The old, published demo passwords stop working immediately.

Step 1, look only (changes nothing):
    Get-Content -Raw scripts/rotate_demo_passwords.py | ssh -i "C:\\Users\\MohammedSohail\\.ssh\\gnuhealth_deploy" debian@34.7.237.8 "sudo -u gnuhealth /home/gnuhealth/venv/bin/python - --dry-run"

Step 2, rotate (prints the new passwords; copy them into your password manager straight away):
    Get-Content -Raw scripts/rotate_demo_passwords.py | ssh -i "C:\\Users\\MohammedSohail\\.ssh\\gnuhealth_deploy" debian@34.7.237.8 "sudo -u gnuhealth /home/gnuhealth/venv/bin/python - --rotate"

To suspend the demo accounts after the demo instead, see the end of this file.
"""
import secrets
import string
import sys

DB = "gnuhealth"
CONF = "/home/gnuhealth/trytond.conf"
LOGIN_PREFIX = "demo_"


def new_password(length=20):
    alphabet = string.ascii_letters + string.digits
    symbols = "-_.!"
    while True:
        pw = "".join(secrets.choice(alphabet + symbols) for _ in range(length))
        # at least one of every class so the backend's password policy always accepts it
        if (any(c.islower() for c in pw) and any(c.isupper() for c in pw)
                and any(c.isdigit() for c in pw) and any(c in symbols for c in pw)):
            return pw


def main():
    mode = sys.argv[1] if len(sys.argv) > 1 else "--dry-run"
    if mode not in ("--dry-run", "--rotate"):
        print("Use --dry-run or --rotate")
        return 2

    from trytond.config import config
    config.update_etc(CONF)
    from trytond.pool import Pool
    from trytond.transaction import Transaction

    Pool.start()
    pool = Pool(DB)
    pool.init()
    with Transaction().start(DB, 0) as transaction:
        User = pool.get("res.user")
        users = User.search([("login", "like", LOGIN_PREFIX + "%")], order=[("login", "ASC")])
        if not users:
            print("No demo_* users found.")
            return 1
        print(f"{'ACTIVE' if mode == '--rotate' else 'DRY RUN'}: {len(users)} demo user(s) in database {DB}")
        out = []
        for user in users:
            state = "active" if user.active else "suspended"
            if mode == "--rotate":
                pw = new_password()
                User.write([user], {"password": pw})
                out.append((user.login, pw, state))
            else:
                out.append((user.login, "(unchanged)", state))
        if mode == "--rotate":
            transaction.commit()
        width = max(len(login) for login, _, _ in out)
        for login, pw, state in out:
            print(f"  {login:<{width}}  {state:<9}  {pw}")
        if mode == "--rotate":
            print("\nDone. Old passwords no longer work. These were printed once and are not stored anywhere.")
    return 0


if __name__ == "__main__":
    sys.exit(main())

# To SUSPEND the demo accounts after the demo (reversible: set active back to true):
#   $sql = "update res_user set active = false where login like 'demo\_%';"
#   $sql | ssh -i "C:\Users\MohammedSohail\.ssh\gnuhealth_deploy" debian@34.7.237.8 "sudo -u postgres psql -d gnuhealth"
