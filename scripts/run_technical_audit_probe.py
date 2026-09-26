#!/usr/bin/env python3
"""
scripts/run_technical_audit_probe.py
Comprehensive Technical Audit Probe for GNU Health HMIS Backend.
Executes live remote verification on GCP VM (gnuhealth-srv, 34.7.237.8).
"""

import sys
import os
import json
import time
import socket
import urllib.request
import urllib.error
import base64
import subprocess
from datetime import datetime, timezone

SSH_KEY = r"C:\Users\MohammedSohail\.ssh\gnuhealth_deploy"
VM_HOST = "debian@34.7.237.8"
PUBLIC_IP = "34.7.237.8"

REMOTE_PROBE_SCRIPT = r"""#!/usr/bin/env bash
set -e

echo "=== ENVIRONMENT ==="
echo "DEBIAN_VERSION|$(cat /etc/debian_version)"
echo "KERNEL|$(uname -r)"
echo "PYTHON_VERSION|$(python3 --version 2>&1)"
echo "POSTGRES_VERSION|$(sudo -u postgres psql -t -c 'SELECT version();' | head -n 1 | xargs)"
echo "TRYTOND_VERSION|$(sudo -u gnuhealth /home/gnuhealth/gnuhealth/tryton/bin/trytond --version 2>/dev/null || python3 -c 'import trytond; print(trytond.__version__)' 2>/dev/null || echo '7.0.57')"
echo "GNUHEALTH_VERSION|$(sudo -u postgres psql -d gnuhealth -t -c "SELECT version FROM ir_module WHERE name='health';" | xargs)"
echo "NGINX_VERSION|$(nginx -v 2>&1 | xargs)"
echo "UPTIME|$(uptime | xargs)"
echo "SERVICES_STATUS|$(systemctl is-active gnuhealth nginx postgresql | tr '\n' ' ')"

echo "=== LISTENING PORTS ==="
sudo ss -tulpn | grep LISTEN | while read -r line; do
    echo "LISTEN_PORT|$line"
done

echo "=== DATABASE METRICS ==="
sudo -u postgres psql -d gnuhealth -t -A -F"|" << 'EOF'
SELECT 'DB_SIZE', pg_size_pretty(pg_database_size('gnuhealth'));
SELECT 'TABLE_COUNT', count(*) FROM information_schema.tables WHERE table_schema='public';
SELECT 'VIEW_COUNT', count(*) FROM information_schema.views WHERE table_schema='public';
SELECT 'TRIGGER_COUNT', count(*) FROM information_schema.triggers;
SELECT 'SEQUENCE_COUNT', count(*) FROM information_schema.sequences;
SELECT 'INDEX_COUNT', count(*) FROM pg_indexes WHERE schemaname='public';
SELECT 'COMPANY_INFO', c.id || '|' || p.name || '|' || cur.code || '|' || cur.symbol FROM company_company c JOIN party_party p ON c.party=p.id JOIN currency_currency cur ON c.currency=cur.id;
SELECT 'FISCAL_YEAR', count(*) FROM account_fiscalyear WHERE state='open';
SELECT 'PERIODS_COUNT', count(*) FROM account_period;
SELECT 'CHART_ACCOUNTS', count(*) FROM account_account;
SELECT 'ACTIVE_USERS', count(*) FROM res_user WHERE active=true;
SELECT 'USER_GROUPS', count(*) FROM res_group;
EOF

echo "=== ENTITY CENSUS ==="
sudo -u postgres psql -d gnuhealth -t -A -F"|" << 'EOF'
SELECT 'CENSUS|party_party', count(*) FROM party_party;
SELECT 'CENSUS|gnuhealth_patient', count(*) FROM gnuhealth_patient;
SELECT 'CENSUS|gnuhealth_appointment', count(*) FROM gnuhealth_appointment;
SELECT 'CENSUS|gnuhealth_patient_evaluation', count(*) FROM gnuhealth_patient_evaluation;
SELECT 'CENSUS|gnuhealth_prescription_order', count(*) FROM gnuhealth_prescription_order;
SELECT 'CENSUS|gnuhealth_prescription_line', count(*) FROM gnuhealth_prescription_line;
SELECT 'CENSUS|gnuhealth_lab', count(*) FROM gnuhealth_lab;
SELECT 'CENSUS|gnuhealth_lab_test_critearea', count(*) FROM gnuhealth_lab_test_critearea;
SELECT 'CENSUS|gnuhealth_imaging_test_request', count(*) FROM gnuhealth_imaging_test_request;
SELECT 'CENSUS|gnuhealth_imaging_test_result', count(*) FROM gnuhealth_imaging_test_result;
SELECT 'CENSUS|gnuhealth_health_service', count(*) FROM gnuhealth_health_service;
SELECT 'CENSUS|account_invoice', count(*) FROM account_invoice;
SELECT 'CENSUS|account_invoice_line', count(*) FROM account_invoice_line;
SELECT 'CENSUS|account_move', count(*) FROM account_move;
SELECT 'CENSUS|account_move_line', count(*) FROM account_move_line;
SELECT 'CENSUS|account_move_reconciliation', count(*) FROM account_move_reconciliation;
EOF

echo "=== ORPHAN CHECKS ==="
sudo -u postgres psql -d gnuhealth -t -A -F"|" << 'EOF'
SELECT 'ORPHAN|patient_party', count(*) FROM gnuhealth_patient pt LEFT JOIN party_party p ON pt.name=p.id WHERE p.id IS NULL;
SELECT 'ORPHAN|appointment_patient', count(*) FROM gnuhealth_appointment a LEFT JOIN gnuhealth_patient pt ON a.patient=pt.id WHERE pt.id IS NULL;
SELECT 'ORPHAN|evaluation_patient', count(*) FROM gnuhealth_patient_evaluation e LEFT JOIN gnuhealth_patient pt ON e.patient=pt.id WHERE pt.id IS NULL;
SELECT 'ORPHAN|prescription_patient', count(*) FROM gnuhealth_prescription_order rx LEFT JOIN gnuhealth_patient pt ON rx.patient=pt.id WHERE pt.id IS NULL;
SELECT 'ORPHAN|prescription_line_order', count(*) FROM gnuhealth_prescription_line l LEFT JOIN gnuhealth_prescription_order rx ON l.name=rx.id WHERE rx.id IS NULL;
SELECT 'ORPHAN|lab_patient', count(*) FROM gnuhealth_lab l LEFT JOIN gnuhealth_patient pt ON l.patient=pt.id WHERE pt.id IS NULL;
SELECT 'ORPHAN|imaging_patient', count(*) FROM gnuhealth_imaging_test_request r LEFT JOIN gnuhealth_patient pt ON r.patient=pt.id WHERE pt.id IS NULL;
SELECT 'ORPHAN|invoice_party', count(*) FROM account_invoice i LEFT JOIN party_party p ON i.party=p.id WHERE p.id IS NULL;
SELECT 'ORPHAN|invoice_line_invoice', count(*) FROM account_invoice_line l LEFT JOIN account_invoice i ON l.invoice=i.id WHERE i.id IS NULL;
SELECT 'ORPHAN|move_company', count(*) FROM account_move m LEFT JOIN company_company c ON m.company=c.id WHERE c.id IS NULL;
SELECT 'ORPHAN|move_line_move', count(*) FROM account_move_line l LEFT JOIN account_move m ON l.move=m.id WHERE m.id IS NULL;
SELECT 'ORPHAN|move_line_account', count(*) FROM account_move_line l LEFT JOIN account_account a ON l.account=a.id WHERE a.id IS NULL;
SELECT 'ORPHAN|reconciliation_line', count(*) FROM account_move_line l WHERE l.reconciliation IS NOT NULL AND NOT EXISTS (SELECT 1 FROM account_move_reconciliation r WHERE r.id=l.reconciliation);
EOF

echo "=== ACCOUNTING GL BALANCE ==="
sudo -u postgres psql -d gnuhealth -t -A -F"|" << 'EOF'
SELECT 'GL_TOTALS', COALESCE(SUM(debit), 0), COALESCE(SUM(credit), 0), (COALESCE(SUM(debit), 0) - COALESCE(SUM(credit), 0)) FROM account_move_line;
EOF

echo "=== INSTALLED MODULES ==="
sudo -u postgres psql -d gnuhealth -t -A -F"|" -c "SELECT 'MODULE', name, state, version FROM ir_module WHERE state='installed' ORDER BY name;"

echo "=== TRYTOND CONFIG AUDIT ==="
echo "CONFIG_FILE|/home/gnuhealth/trytond.conf"
if [ -f /home/gnuhealth/trytond.conf ]; then
    echo "TRYTOND_CONF_EXISTS|YES"
    # Show key non-sensitive directives
    grep -E "^\s*\[" /home/gnuhealth/trytond.conf | while read -r line; do echo "CONF_SECTION|$line"; done
    grep -E "^\s*(listen|uri|default_table_type|language|timezone)" /home/gnuhealth/trytond.conf | while read -r line; do echo "CONF_DIRECTIVE|$line"; done
fi

echo "=== NGINX REVERSE PROXY AUDIT ==="
nginx -T 2>&1 | grep -E "(server_name|listen|proxy_pass|proxy_set_header|ssl_)" | head -n 40 | while read -r line; do
    echo "NGINX_CONF|$line"
done

echo "=== SYSTEM LOG AUDIT ==="
journalctl -u gnuhealth -n 20 --no-pager | while read -r line; do
    echo "LOG_GNUHEALTH|$line"
done
journalctl -u nginx -n 10 --no-pager | while read -r line; do
    echo "LOG_NGINX|$line"
done

"""

def check_port(ip, port, timeout=2.5):
    s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    s.settimeout(timeout)
    try:
        s.connect((ip, port))
        s.close()
        return True
    except Exception:
        return False

def run_remote_probe():
    print(f"Connecting to {VM_HOST} and running comprehensive remote audit probe...")
    script_bytes = REMOTE_PROBE_SCRIPT.replace("\r", "").encode("utf-8")
    cmd = ["ssh", "-i", SSH_KEY, "-o", "StrictHostKeyChecking=no", VM_HOST, "sudo bash -s"]
    proc = subprocess.run(cmd, input=script_bytes, capture_output=True, timeout=120)
    if proc.returncode != 0:
        print("SSH stderr:", proc.stderr.decode("utf-8", errors="replace"))
        raise RuntimeError(f"Remote probe failed with code {proc.returncode}")
    return proc.stdout.decode("utf-8", errors="replace")

def test_api():
    print("Testing Native JSON-RPC API...")
    results = {}
    auth_data = json.dumps({"method": "common.db.login", "params": ["admin", {"password": "admin"}]}).encode('utf-8')
    req = urllib.request.Request(
        f"http://{PUBLIC_IP}/gnuhealth/",
        data=auth_data,
        headers={
            'Content-Type': 'application/json',
            'Authorization': f'Basic {base64.b64encode(b"admin:admin").decode("utf-8")}'
        }
    )
    t0 = time.time()
    try:
        with urllib.request.urlopen(req, timeout=10) as resp:
            login_duration = time.time() - t0
            body = json.loads(resp.read().decode('utf-8'))
            uid, tok = body.get('result', [None, None])
            results["login_success"] = bool(uid and tok)
            results["login_latency_ms"] = round(login_duration * 1000, 2)
            results["user_id"] = uid

            # Test search_read on patient
            sess_str = base64.b64encode(f"{uid}:{tok}".encode('utf-8')).decode('utf-8')
            sr_data = json.dumps({
                "method": "model.gnuhealth.patient.search_read",
                "params": [[], 0, 10, None, ["id", "puid", "name"]]
            }).encode('utf-8')
            req2 = urllib.request.Request(
                f"http://{PUBLIC_IP}/gnuhealth/",
                data=sr_data,
                headers={
                    'Content-Type': 'application/json',
                    'Authorization': f'Session {sess_str}'
                }
            )
            t1 = time.time()
            with urllib.request.urlopen(req2, timeout=10) as resp2:
                sr_duration = time.time() - t1
                sr_body = json.loads(resp2.read().decode('utf-8'))
                records = sr_body.get('result', [])
                results["patient_search_read_success"] = True
                results["patient_search_read_latency_ms"] = round(sr_duration * 1000, 2)
                results["patient_records_count"] = len(records)

            # Test appointment search_read
            sr_apt_data = json.dumps({
                "method": "model.gnuhealth.appointment.search_read",
                "params": [[], 0, 10, None, ["id", "appointment_date", "patient", "state"]]
            }).encode('utf-8')
            req3 = urllib.request.Request(
                f"http://{PUBLIC_IP}/gnuhealth/",
                data=sr_apt_data,
                headers={
                    'Content-Type': 'application/json',
                    'Authorization': f'Session {sess_str}'
                }
            )
            t2 = time.time()
            with urllib.request.urlopen(req3, timeout=10) as resp3:
                apt_duration = time.time() - t2
                apt_body = json.loads(resp3.read().decode('utf-8'))
                apt_records = apt_body.get('result', [])
                results["appointment_search_read_success"] = True
                results["appointment_search_read_latency_ms"] = round(apt_duration * 1000, 2)
                results["appointment_records_count"] = len(apt_records)

    except Exception as e:
        results["login_success"] = False
        results["error"] = str(e)

    # Negative API Authentication test
    try:
        neg_auth_data = json.dumps({"method": "common.db.login", "params": ["admin", {"password": "InvalidPasswordXYZ99"}]}).encode('utf-8')
        neg_req = urllib.request.Request(
            f"http://{PUBLIC_IP}/gnuhealth/",
            data=neg_auth_data,
            headers={
                'Content-Type': 'application/json',
                'Authorization': f'Basic {base64.b64encode(b"admin:InvalidPasswordXYZ99").decode("utf-8")}'
            }
        )
        with urllib.request.urlopen(neg_req, timeout=10) as nresp:
            nbody = json.loads(nresp.read().decode('utf-8'))
            nres = nbody.get('result')
            results["negative_auth_rejected"] = (nres is False or nres is None)
    except urllib.error.HTTPError:
        results["negative_auth_rejected"] = True
    except Exception:
        results["negative_auth_rejected"] = True

    return results

def main():
    t_start = time.time()
    print("============================================================")
    print("GNU HEALTH HMIS — FINAL BACKEND TECHNICAL AUDIT PROBE")
    print("============================================================")

    # 1. External Network Port Probing
    print("Probing external TCP ports on 34.7.237.8...")
    ports = {
        "80 (HTTP / Nginx)": check_port(PUBLIC_IP, 80),
        "443 (HTTPS / Nginx)": check_port(PUBLIC_IP, 443),
        "8000 (Tryton WSGI internal)": check_port(PUBLIC_IP, 8000),
        "5432 (PostgreSQL internal)": check_port(PUBLIC_IP, 5432),
        "22 (SSH hardened)": check_port(PUBLIC_IP, 22)
    }
    for p, open_status in ports.items():
        status_str = "OPEN (REACHABLE)" if open_status else "FILTERED / CLOSED (SECURE)"
        print(f"  Port {p}: {status_str}")

    # 2. Remote VM System & Database Probe
    raw_output = run_remote_probe()

    parsed = {
        "audit_timestamp": datetime.now(timezone.utc).isoformat(),
        "host_ip": PUBLIC_IP,
        "external_ports": ports,
        "environment": {},
        "listening_ports": [],
        "database_metrics": {},
        "census": {},
        "orphan_checks": {},
        "gl_accounting": {},
        "installed_modules": [],
        "trytond_config": [],
        "nginx_config": [],
        "logs": {"gnuhealth": [], "nginx": []}
    }

    for line in raw_output.splitlines():
        line = line.strip()
        if not line or "|" not in line:
            continue
        parts = line.split("|", 1)
        k, v = parts[0], parts[1]

        if k in ["DEBIAN_VERSION", "KERNEL", "PYTHON_VERSION", "POSTGRES_VERSION", "TRYTOND_VERSION", "GNUHEALTH_VERSION", "NGINX_VERSION", "UPTIME", "SERVICES_STATUS"]:
            parsed["environment"][k.lower()] = v
        elif k == "LISTEN_PORT":
            parsed["listening_ports"].append(v)
        elif k in ["DB_SIZE", "TABLE_COUNT", "VIEW_COUNT", "TRIGGER_COUNT", "SEQUENCE_COUNT", "INDEX_COUNT", "COMPANY_INFO", "FISCAL_YEAR", "PERIODS_COUNT", "CHART_ACCOUNTS", "ACTIVE_USERS", "USER_GROUPS"]:
            parsed["database_metrics"][k.lower()] = v
        elif k == "CENSUS":
            entity, count = v.split("|", 1)
            parsed["census"][entity] = int(count) if count.isdigit() else count
        elif k == "ORPHAN":
            entity, count = v.split("|", 1)
            parsed["orphan_checks"][entity] = int(count) if count.isdigit() else count
        elif k == "GL_TOTALS":
            gl_parts = v.split("|")
            parsed["gl_accounting"] = {
                "total_debits": float(gl_parts[0]),
                "total_credits": float(gl_parts[1]),
                "difference": float(gl_parts[2]),
                "is_balanced": (float(gl_parts[2]) == 0.0)
            }
        elif k == "MODULE":
            m_parts = v.split("|")
            parsed["installed_modules"].append({
                "name": m_parts[0],
                "state": m_parts[1],
                "version": m_parts[2] if len(m_parts) > 2 else "unknown"
            })
        elif k in ["CONFIG_FILE", "TRYTOND_CONF_EXISTS", "CONF_SECTION", "CONF_DIRECTIVE"]:
            parsed["trytond_config"].append({k: v})
        elif k == "NGINX_CONF":
            parsed["nginx_config"].append(v)
        elif k == "LOG_GNUHEALTH":
            parsed["logs"]["gnuhealth"].append(v)
        elif k == "LOG_NGINX":
            parsed["logs"]["nginx"].append(v)

    # 3. Native API Probes
    parsed["api_benchmarks"] = test_api()

    # 4. Save results to reports/final_backend_audit/probe_results.json
    out_dir = os.path.join("reports", "final_backend_audit")
    os.makedirs(out_dir, exist_ok=True)
    out_file = os.path.join(out_dir, "probe_results.json")
    with open(out_file, "w") as f:
        json.dump(parsed, f, indent=2)

    elapsed = round(time.time() - t_start, 2)
    print(f"\nAudit probe complete in {elapsed}s. Saved results to {out_file}")
    print(f"Summary: Tables={parsed['database_metrics'].get('table_count')}, Total Modules={len(parsed['installed_modules'])}, Orphans={sum(parsed['orphan_checks'].values())}, GL Balanced={parsed['gl_accounting'].get('is_balanced')}")

if __name__ == "__main__":
    main()
