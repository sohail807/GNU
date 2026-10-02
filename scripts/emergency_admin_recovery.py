#!/usr/bin/env python3
"""
IST Health -- Emergency Administrator Recovery Protocol
Auditable break-glass tool for platform super-administrators.

Requirements:
- Must only be executed from authorized administrative shell with SSH credentials.
- Requires explicit operator identity and reason for audit compliance.
- Generates cryptographically secure temporary credentials.
- Resets the password via trytond-admin's native password hasher (-p / TRYTONPASSFILE) --
  the only mechanism confirmed to work against this deployment. Two others were tried and
  rejected: `trytond-admin --reset-password` requires SMTP, which is not configured here,
  and fails outright; a raw `Pool.start()` / `res.user.write` Python snippet against the
  Tryton ORM silently falls back to Tryton's default SQLite backend (not this deployment's
  PostgreSQL) unless TRYTOND_CONFIG is set, and errors with
  "Database '.../gnuhealth.sqlite' doesn't exist!" -- confirmed by actually running it.
- trytond-admin -p resets specifically the "admin" login; it has no way to target any other
  username, so this tool does not pretend to support one either.
- Forcibly invalidates that user's active sessions (deletes their rows from ir_session) so a
  password reset can't be silently bypassed by an already-open session.
- Logs to reports/security_audit_log.json -- an audit trail of WHO ran this and WHEN, not a
  record of the real password (only a SHA-256 fingerprint of it, for later correlation).
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
TRYTOND_CONF = "/home/gnuhealth/trytond.conf"
TRYTOND_ADMIN = "/home/gnuhealth/venv/bin/trytond-admin"
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

def main():
    parser = argparse.ArgumentParser(description="IST Health Auditable Emergency Administrator Recovery")
    parser.add_argument("--database", default="gnuhealth", help="Target tenant database (default: gnuhealth)")
    parser.add_argument("--operator", required=True, help="Identity of authorized operator executing recovery")
    parser.add_argument("--reason", required=True, help="Clinical or operational justification for recovery")
    parser.add_argument("--new-password", default=None, help="Explicit password (auto-generated if omitted)")
    parser.add_argument("--dry-run", action="store_true", help="Simulate without applying changes")

    args = parser.parse_args()

    print("=" * 70)
    print("IST HEALTH -- AUDITABLE EMERGENCY ADMINISTRATOR RECOVERY")
    print("=" * 70)
    print(f"Timestamp:   {datetime.now(timezone.utc).isoformat()}Z")
    print(f"Operator:    {args.operator}")
    print(f"Reason:      {args.reason}")
    print(f"Target User: admin (trytond-admin -p only ever resets this login)")
    print(f"Database:    {args.database}")

    password = args.new_password or generate_secure_password(16)
    pass_fingerprint = hashlib.sha256(password.encode()).hexdigest()

    if args.dry_run:
        print("\n[DRY RUN] Password generated: [SECURE]")
        print("[DRY RUN] No changes applied.")
        return 0

    # Stage the password in a private, gnuhealth-owned temp file on the VM (never passed as a
    # CLI argument, never logged) so trytond-admin can read it via TRYTONPASSFILE, then reset
    # the password, invalidate the admin user's active sessions, and remove the temp file --
    # all in one SSH round trip so the plaintext password never lands on disk longer than needed.
    remote_script = f"""
set -e
RUN_DIR=$(mktemp -d /tmp/ist-recovery.XXXXXX)
# This whole script runs as the plain "debian" SSH user; only individual commands are
# escalated via sudo. Once RUN_DIR is handed to gnuhealth below, "debian" itself can no
# longer remove it -- the cleanup trap needs sudo too, or it fails silently and leaves
# the (already-consumed) password file behind.
trap 'sudo rm -rf "$RUN_DIR"' EXIT
sudo chown gnuhealth:gnuhealth "$RUN_DIR"
PASS_FILE="$RUN_DIR/admin_pw"
printf '%s' {password!r} | sudo -u gnuhealth tee "$PASS_FILE" >/dev/null
sudo chmod 400 "$PASS_FILE"
sudo -u gnuhealth env TRYTONPASSFILE="$PASS_FILE" {TRYTOND_ADMIN} -c {TRYTOND_CONF} -d {args.database} -p
sudo -u postgres psql -d {args.database} -tAc "DELETE FROM ir_session WHERE create_uid = (SELECT id FROM res_user WHERE login='admin');"
echo OK_UPDATED
""".strip()

    ssh_cmd = ["ssh", "-i", SSH_KEY, "-o", "StrictHostKeyChecking=no", VM_HOST, remote_script]

    print("\nExecuting emergency credential reset in Tryton database...")
    proc = subprocess.run(ssh_cmd, capture_output=True, text=True, timeout=60)

    success = "OK_UPDATED" in proc.stdout

    audit_entry = {
        "event": "EMERGENCY_ADMIN_RECOVERY",
        "timestamp": datetime.now(timezone.utc).isoformat() + "Z",
        "operator": args.operator,
        "reason": args.reason,
        "targetUser": "admin",
        "database": args.database,
        "passwordFingerprintSha256": pass_fingerprint,
        "status": "SUCCESS" if success else "FAILED",
        "rawOutput": proc.stdout.strip(),
        "rawError": proc.stderr.strip(),
    }
    append_audit_log(audit_entry)

    if success:
        print("[SUCCESS] Administrator credentials reset and active sessions invalidated.")
        print(f"Temporary Password: {password}")
        print(f"Audit Log Recorded: {AUDIT_LOG_FILE}")
        return 0
    else:
        print(f"[ERROR] Failed to reset credentials: {proc.stdout} {proc.stderr}")
        return 1

if __name__ == "__main__":
    sys.exit(main())
