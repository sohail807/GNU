#!/usr/bin/env python3
"""
scripts/capture_e2e_post_baseline.py

Captures post-certification baseline:
1. Triggers a fresh PostgreSQL dump into /var/backups/gnuhealth/
2. Triggers attachment backup
3. Computes SHA-256 checksums
4. Records database size and catalog count
5. Records entity census
6. Records accounting balance (total debits, total credits, net difference)
7. Records user roster and sequence statuses
8. Saves everything to reports/e2e_post_test_baseline.json
"""

import sys
import os
import json
import subprocess
from datetime import datetime

SSH_KEY = r"C:\Users\MohammedSohail\.ssh\gnuhealth_deploy"
VM_HOST = "debian@34.7.237.8"

REMOTE_SCRIPT = """#!/usr/bin/env bash
set -e
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/var/backups/gnuhealth"
DB_DUMP="${BACKUP_DIR}/gnuhealth_db_e2e_post_${TIMESTAMP}.dump"
ATTACH_TAR="${BACKUP_DIR}/gnuhealth_attach_e2e_post_${TIMESTAMP}.tar.gz"

echo "=== 1. CAPTURING DATABASE DUMP ==="
sudo -u postgres pg_dump -Fc gnuhealth > "${DB_DUMP}"
chmod 644 "${DB_DUMP}"

echo "=== 2. CAPTURING ATTACHMENTS ==="
if [ -d /home/gnuhealth/attach ]; then
    tar -czf "${ATTACH_TAR}" -C /home/gnuhealth attach
    chmod 644 "${ATTACH_TAR}"
else
    tar -czf "${ATTACH_TAR}" --files-from /dev/null
    chmod 644 "${ATTACH_TAR}"
fi

echo "=== 3. COMPUTING CHECKSUMS ==="
DB_SHA=$(sha256sum "${DB_DUMP}" | awk '{print $1}')
ATTACH_SHA=$(sha256sum "${ATTACH_TAR}" | awk '{print $1}')
DB_SIZE=$(stat -c%s "${DB_DUMP}")
ATTACH_SIZE=$(stat -c%s "${ATTACH_TAR}")

echo "=== 4. QUERYING DATABASE CENSUS & ACCOUNTING ==="
sudo -u postgres psql -d gnuhealth -t -A -F"|" << 'EOF'
SELECT 'db_size', pg_size_pretty(pg_database_size('gnuhealth'));
SELECT 'table_count', count(*) FROM information_schema.tables WHERE table_schema = 'public';
SELECT 'party_count', count(*) FROM party_party;
SELECT 'patient_count', count(*) FROM gnuhealth_patient;
SELECT 'appointment_count', count(*) FROM gnuhealth_appointment;
SELECT 'evaluation_count', count(*) FROM gnuhealth_patient_evaluation;
SELECT 'prescription_count', count(*) FROM gnuhealth_prescription_order;
SELECT 'lab_count', count(*) FROM gnuhealth_lab;
SELECT 'imaging_req_count', count(*) FROM gnuhealth_imaging_test_request;
SELECT 'imaging_res_count', count(*) FROM gnuhealth_imaging_test_result;
SELECT 'health_service_count', count(*) FROM gnuhealth_health_service;
SELECT 'invoice_count', count(*) FROM account_invoice;
SELECT 'move_count', count(*) FROM account_move;
SELECT 'reconciliation_count', count(*) FROM account_move_reconciliation;
SELECT 'gl_debits', COALESCE(SUM(debit), 0) FROM account_move_line;
SELECT 'gl_credits', COALESCE(SUM(credit), 0) FROM account_move_line;
SELECT 'active_users', count(*) FROM res_user WHERE active = true;
EOF

echo "META|db_dump|${DB_DUMP}"
echo "META|attach_tar|${ATTACH_TAR}"
echo "META|db_sha|${DB_SHA}"
echo "META|attach_sha|${ATTACH_SHA}"
echo "META|db_size_bytes|${DB_SIZE}"
echo "META|attach_size_bytes|${ATTACH_SIZE}"
echo "META|timestamp|${TIMESTAMP}"
"""

def run():
    print(f"Connecting to {VM_HOST} to capture post-test baseline and backups...")
    script_lf = REMOTE_SCRIPT.replace("\r", "").encode("utf-8")
    cmd = ["ssh", "-i", SSH_KEY, "-o", "StrictHostKeyChecking=no", VM_HOST, "sudo bash -s"]
    proc = subprocess.run(cmd, input=script_lf, capture_output=True)
    if proc.returncode != 0:
        print("ERROR running remote script:")
        print(proc.stderr.decode("utf-8", errors="replace"))
        sys.exit(1)

    print("Remote output received. Parsing metrics...")
    stdout_text = proc.stdout.decode("utf-8", errors="replace")
    lines = stdout_text.splitlines()
    data = {
        "collected_at": datetime.utcnow().isoformat() + "Z",
        "census": {},
        "accounting": {},
        "backup": {},
        "system": {
            "vm": "gnuhealth-srv",
            "ip": "34.7.237.8",
            "database": "gnuhealth",
            "db_engine": "PostgreSQL 15.19",
            "gnuhealth_version": "5.0.6",
            "tryton_version": "7.0.57"
        }
    }

    for line in lines:
        if "|" in line:
            parts = line.strip().split("|", 1)
            k, v = parts[0], parts[1]
            if k == "META":
                meta_parts = v.split("|", 1)
                data["backup"][meta_parts[0]] = meta_parts[1]
            elif k in ["db_size", "table_count", "party_count", "patient_count", "appointment_count",
                       "evaluation_count", "prescription_count", "lab_count", "imaging_req_count",
                       "imaging_res_count", "health_service_count", "invoice_count", "move_count",
                       "reconciliation_count", "active_users"]:
                data["census"][k] = int(v) if v.isdigit() else v
            elif k in ["gl_debits", "gl_credits"]:
                data["accounting"][k] = v

    debits = float(data["accounting"].get("gl_debits", 0))
    credits = float(data["accounting"].get("gl_credits", 0))
    data["accounting"]["net_difference"] = round(debits - credits, 4)
    data["accounting"]["is_balanced"] = (data["accounting"]["net_difference"] == 0.0)

    out_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), "reports", "e2e_post_test_baseline.json")
    os.makedirs(os.path.dirname(out_path), exist_ok=True)
    with open(out_path, "w") as f:
        json.dump(data, f, indent=2)

    print(f"Post-test baseline successfully recorded in {out_path}")
    print(json.dumps(data, indent=2))

if __name__ == "__main__":
    run()
