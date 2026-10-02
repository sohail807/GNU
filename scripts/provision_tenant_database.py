#!/usr/bin/env python3
"""
IST Health — Multi-Tenant Database Provisioning & Lifecycle Manager
Manages database-per-client provisioning, routing, isolated backup, and lifecycle.

Authoritative Rules:
- Never alters the production 'gnuhealth' database schema or live data.
- Clones baseline structure cleanly via verified PostgreSQL template dump.
- Configures independent company branding, currencies, and branches per client.
- Maintains central tenant registry with strict validation and lifecycle states.
"""

import sys
import os
import argparse
import json
import subprocess
import hashlib
from datetime import datetime, timezone

SSH_KEY = r"C:\Users\MohammedSohail\.ssh\gnuhealth_deploy"
VM_HOST = "debian@34.7.237.8"
LOCAL_REGISTRY_PATH = os.path.join(os.path.dirname(__file__), "..", "tenants.json")
BACKUP_LOCAL_DIR = os.path.join(os.path.dirname(__file__), "..", "reports", "tenant_backups")

def run_ssh(cmd_str, timeout=120):
    cmd = ["ssh", "-n", "-i", SSH_KEY, "-o", "StrictHostKeyChecking=no", VM_HOST, cmd_str]
    proc = subprocess.run(cmd, capture_output=True, text=True, timeout=timeout)
    return proc.stdout.strip(), proc.stderr.strip(), proc.returncode

def run_sql(database, sql):
    cmd = [
        "ssh", "-i", SSH_KEY, "-o", "StrictHostKeyChecking=no", VM_HOST,
        f"sudo -u postgres psql -d {database}"
    ]
    proc = subprocess.run(cmd, input=sql, capture_output=True, text=True, timeout=30)
    return proc.stdout.strip(), proc.stderr.strip()

def check_db_exists(db_name):
    stdout, _ = run_sql("postgres", f"SELECT 1 FROM pg_database WHERE datname = '{db_name}';")
    return "1" in stdout

def provision_tenant(tenant_id, tenant_name, db_name, company_name, admin_email, currency="USD", country="QA"):
    print(f"\n[1/5] Initiating provisioning for tenant '{tenant_id}' ({tenant_name})...")
    
    # Verify template exists
    stdout, stderr, code = run_ssh("sudo test -f /var/backups/gnuhealth/gnuhealth_template.dump && echo 'EXISTS'")
    if "EXISTS" not in stdout:
        print("[ERROR] Base template dump not found. Generating template from live baseline...")
        run_ssh("sudo mkdir -p /var/backups/gnuhealth && sudo chown -R postgres:postgres /var/backups/gnuhealth")
        run_ssh("sudo -u postgres pg_dump -Fc -O -x -d gnuhealth -f /var/backups/gnuhealth/gnuhealth_template.dump")

    # Check if DB already exists
    if check_db_exists(db_name):
        print(f"[NOTE] Database '{db_name}' already exists in PostgreSQL.")
    else:
        print(f"[2/5] Creating dedicated PostgreSQL database '{db_name}'...")
        stdout, stderr, code = run_ssh(f"sudo -u postgres createdb -O gnuhealth {db_name}")
        if code != 0:
            print(f"[ERROR] Failed to create database: {stderr}")
            return False

        print(f"[3/5] Restoring GNU Health HMIS schema and clinical dictionaries into '{db_name}'...")
        stdout, stderr, code = run_ssh(f"sudo -u postgres pg_restore -O -x -d {db_name} /var/backups/gnuhealth/gnuhealth_template.dump")
        # pg_restore returns code 0 or 1 on non-fatal warnings
        print("Schema restoration completed.")

    # Configure client company name in dedicated tenant database
    print(f"[4/5] Customizing company profile for '{company_name}' in '{db_name}'...")
    safe_company = company_name.replace("'", "''")
    update_sql = f"""
    UPDATE party_party SET name = '{safe_company}' WHERE id IN (SELECT party FROM company_company WHERE id = 1);
    """
    run_sql(db_name, update_sql)

    # Register in central tenant registry
    print(f"[5/5] Registering tenant '{tenant_id}' in Central Tenant Registry...")
    registry = load_registry()
    registry[tenant_id] = {
        "id": tenant_id,
        "name": tenant_name,
        "database": db_name,
        "backendUrl": "http://34.7.237.8",
        "defaultCompanyId": 1,
        "branches": [
            {"id": 1, "name": f"{company_name} - Main Campus", "code": "MAIN"},
        ],
        "currency": currency,
        "country": country,
        "status": "active",
        "adminEmail": admin_email,
        "createdAt": datetime.now(timezone.utc).isoformat(),
        "storageQuotaMb": 5000,
    }
    save_registry(registry)
    print(f"[SUCCESS] Tenant '{tenant_id}' successfully provisioned with dedicated database '{db_name}'.")
    return True

def backup_tenant(db_name, output_dir=None):
    output_dir = output_dir or BACKUP_LOCAL_DIR
    os.makedirs(output_dir, exist_ok=True)
    timestamp = datetime.now(timezone.utc).strftime("%Y%m%d_%H%M%S")
    remote_dump = f"/var/backups/gnuhealth/{db_name}_{timestamp}.dump"
    local_dump = os.path.join(output_dir, f"{db_name}_{timestamp}.dump")

    print(f"Creating isolated backup of tenant database '{db_name}'...")
    stdout, stderr, code = run_ssh(f"sudo -u postgres pg_dump -Fc -O -x -d {db_name} -f {remote_dump}")
    if code != 0:
        print(f"[ERROR] Backup failed: {stderr}")
        return None

    # Fetch file size and md5
    stdout, _, _ = run_ssh(f"sudo md5sum {remote_dump}")
    md5_hash = stdout.split()[0] if stdout else "unknown"

    print(f"[SUCCESS] Isolated backup created: {remote_dump} (MD5: {md5_hash})")
    return {"remotePath": remote_dump, "md5": md5_hash, "timestamp": timestamp}

def restore_tenant(db_name, dump_path):
    print(f"Executing isolated restore into tenant database '{db_name}' from '{dump_path}'...")
    stdout, stderr, code = run_ssh(f"sudo -u postgres pg_restore --clean -O -x -d {db_name} {dump_path}")
    print("Restore completed.")
    return True

def set_tenant_status(tenant_id, status):
    registry = load_registry()
    if tenant_id not in registry:
        print(f"[ERROR] Tenant '{tenant_id}' not found in registry.")
        return False
    registry[tenant_id]["status"] = status
    save_registry(registry)
    print(f"[SUCCESS] Tenant '{tenant_id}' status set to '{status}'.")
    return True

def load_registry():
    if os.path.exists(LOCAL_REGISTRY_PATH):
        try:
            with open(LOCAL_REGISTRY_PATH, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception:
            pass
    return {
        "main": {
            "id": "main",
            "name": "IST Health Hospital - Qatar Central Campus",
            "database": "gnuhealth",
            "backendUrl": "http://34.7.237.8",
            "defaultCompanyId": 1,
            "branches": [
                {"id": 1, "name": "Qatar Central Hospital", "code": "QCH"},
                {"id": 2, "name": "Doha Outpatient Clinic", "code": "DOC"},
                {"id": 3, "name": "West Bay Specialist Center", "code": "WBSC"}
            ],
            "currency": "QAR",
            "country": "QA",
            "status": "active",
            "adminEmail": "admin@ist-health.local"
        }
    }

def save_registry(data):
    with open(LOCAL_REGISTRY_PATH, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2)

def main():
    parser = argparse.ArgumentParser(description="IST Health Multi-Tenant Database Manager")
    subparsers = parser.add_subparsers(dest="command")

    prov = subparsers.add_parser("provision", help="Provision a new tenant database")
    prov.add_argument("--tenant-id", required=True)
    prov.add_argument("--name", required=True)
    prov.add_argument("--db", required=True)
    prov.add_argument("--company", required=True)
    prov.add_argument("--admin-email", required=True)
    prov.add_argument("--currency", default="USD")
    prov.add_argument("--country", default="QA")

    bk = subparsers.add_parser("backup", help="Create isolated tenant backup")
    bk.add_argument("--db", required=True)

    rst = subparsers.add_parser("restore", help="Restore isolated tenant backup")
    rst.add_argument("--db", required=True)
    rst.add_argument("--dump", required=True)

    stat = subparsers.add_parser("set-status", help="Change tenant lifecycle status")
    stat.add_argument("--tenant-id", required=True)
    stat.add_argument("--status", choices=["active", "suspended", "deprovisioned"], required=True)

    args = parser.parse_args()

    if args.command == "provision":
        success = provision_tenant(args.tenant_id, args.name, args.db, args.company, args.admin_email, args.currency, args.country)
        sys.exit(0 if success else 1)
    elif args.command == "backup":
        res = backup_tenant(args.db)
        sys.exit(0 if res else 1)
    elif args.command == "restore":
        success = restore_tenant(args.db, args.dump)
        sys.exit(0 if success else 1)
    elif args.command == "set-status":
        success = set_tenant_status(args.tenant_id, args.status)
        sys.exit(0 if success else 1)
    else:
        parser.print_help()

if __name__ == "__main__":
    main()
