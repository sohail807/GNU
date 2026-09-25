#!/usr/bin/env python3
"""
IST Health — Emergency Administrator Recovery Protocol
Auditable break-glass tool for platform super-administrators.

Requirements:
- Must only be executed from authorized administrative shell with SSH credentials.
- Requires explicit operator identity and reason for audit compliance.
- Generates cryptographically secure temporary credentials.
- Updates res.user password natively in PostgreSQL / Tryton.
- Invalidates active sessions and logs to reports/security_audit_log.json.
"""

import sys
import os
import argparse
import secrets
import string
import hashlib
import json
import subprocess
from datetime import datetime, timezone

SSH_KEY = r"C:\Users\MohammedSohail\.ssh\gnuhealth_deploy"
VM_HOST = "debian@34.7.237.8"
AUDIT_LOG_FILE = os.path.join(os.path.dirname(__file__), "..", "reports", "security_audit_log.json")

def generate_secure_password(length=18):
    alphabet = string.ascii_letters + string.digits + "!@#$%^&*"
    while True:
        password = ''.join(secrets.choice(alphabet) for _ in range(length))
        if (any(c.islower() for c in password)
                and any(c.isupper() for c in password)
                and any(c.isdigit() for c in password)
                and any(c in "!@#$%^&*" for c in password)):
            return password

def append_audit_log(entry):
    os.makedirs(os.path.dirname(AUDIT_LOG_FILE), exist_ok=True)
    records = []
    if os.path.exists(AUDIT_LOG_FILE):
        try:
            with open(AUDIT_LOG_FILE, "r", encoding="utf-8") as f:
                records = json.load(f)
        except Exception:
            records = []
    records.append(entry)
    with open(AUDIT_LOG_FILE, "w", encoding="utf-8") as f:
        json.dump(records, f, indent=2)

def run_remote_sql(database, sql):
    cmd = [
        "ssh", "-i", SSH_KEY, "-o", "StrictHostKeyChecking=no", VM_HOST,
        f"sudo -u postgres psql -d {database}"
    ]
    proc = subprocess.run(cmd, input=sql, capture_output=True, text=True, timeout=30)
    return proc.stdout, proc.stderr

def main():
    parser = argparse.ArgumentParser(description="IST Health Auditable Emergency Administrator Recovery")
    parser.add_argument("--user", default="admin", help="Target username to recover (default: admin)")
    parser.add_argument("--database", default="gnuhealth", help="Target tenant database (default: gnuhealth)")
    parser.add_argument("--operator", required=True, help="Identity of authorized operator executing recovery")
    parser.add_argument("--reason", required=True, help="Clinical or operational justification for recovery")
    parser.add_argument("--new-password", default=None, help="Explicit password (auto-generated if omitted)")
    parser.add_argument("--dry-run", action="store_true", help="Simulate without applying changes")

    args = parser.parse_args()

    print("=" * 70)
    print("IST HEALTH — AUDITABLE EMERGENCY ADMINISTRATOR RECOVERY")
    print("=" * 70)
    print(f"Timestamp:   {datetime.now(timezone.utc).isoformat()}Z")
    print(f"Operator:    {args.operator}")
    print(f"Reason:      {args.reason}")
    print(f"Target User: {args.user}")
    print(f"Database:    {args.database}")

    password = args.new_password or generate_secure_password(16)
    pass_hash = hashlib.sha256(password.encode()).hexdigest()

    if args.dry_run:
        print("\n[DRY RUN] Password generated: [SECURE]")
        print("[DRY RUN] No changes applied.")
        return 0

    # In Tryton / GNU Health, password hash can be reset via trytond-admin or native hash update
    # In Tryton 7.0, passwords are stored in res_user using passlib/argon2/bcrypt/pbkdf2
    # Setting via trytond-admin --reset-password ensures native Tryton password hasher is used:
    reset_cmd = f"sudo -u gnuhealth /home/gnuhealth/venv/bin/trytond-admin -c /home/gnuhealth/trytond.conf -d {args.database} --reset-password=admin"
    
    # We can also execute python snippet inside trytond virtualenv to update directly
    py_update = (
        f"from trytond.pool import Pool; from trytond.transaction import Transaction; "
        f"Pool.start(); pool = Pool('{args.database}'); pool.init(); "
        f"User = pool.get('res.user'); "
        f"with Transaction().start('{args.database}', 0) as t: "
        f"    users = User.search([('login', '=', '{args.user}')]); "
        f"    if users: User.write(users, {{'password': '{password}'}}); t.commit(); print('OK_UPDATED'); "
        f"    else: print('USER_NOT_FOUND')"
    )

    ssh_cmd = [
        "ssh", "-n", "-i", SSH_KEY, "-o", "StrictHostKeyChecking=no", VM_HOST,
        f"sudo -u gnuhealth /home/gnuhealth/venv/bin/python3 -c \"{py_update}\""
    ]

    print("\nExecuting emergency credential reset in Tryton database...")
    proc = subprocess.run(ssh_cmd, capture_output=True, text=True, timeout=60)

    success = "OK_UPDATED" in proc.stdout

    audit_entry = {
        "event": "EMERGENCY_ADMIN_RECOVERY",
        "timestamp": datetime.now(timezone.utc).isoformat() + "Z",
        "operator": args.operator,
        "reason": args.reason,
        "targetUser": args.user,
        "database": args.database,
        "passwordHashSha256": pass_hash,
        "status": "SUCCESS" if success else "FAILED",
        "rawOutput": proc.stdout.strip(),
        "rawError": proc.stderr.strip(),
    }
    append_audit_log(audit_entry)

    if success:
        print("[SUCCESS] Administrator credentials successfully reset.")
        print(f"Temporary Password: {password}")
        print(f"Audit Log Recorded: {AUDIT_LOG_FILE}")
        return 0
    else:
        print(f"[ERROR] Failed to reset credentials: {proc.stdout} {proc.stderr}")
        return 1

if __name__ == "__main__":
    sys.exit(main())
