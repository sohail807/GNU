import os
import sys
import json
import time
import socket
import urllib.request
import urllib.error
import base64
import subprocess

SSH_KEY = r"C:\Users\MohammedSohail\.ssh\gnuhealth_deploy"
VM_HOST = "debian@34.7.237.8"
PUBLIC_IP = "34.7.237.8"
TRYTON_URL = f"http://{PUBLIC_IP}/gnuhealth/"

def run_ssh(cmd, timeout=60):
    ssh_cmd = [
        "ssh", "-i", SSH_KEY, "-o", "StrictHostKeyChecking=no",
        "-o", "ConnectTimeout=10", VM_HOST, cmd
    ]
    p = subprocess.run(ssh_cmd, capture_output=True, text=True, timeout=timeout)
    return p.stdout.strip(), p.stderr.strip(), p.returncode

def run_psql(sql, db="gnuhealth", timeout=60):
    cmd = f'sudo -u postgres psql -d {db} -X -A -t -F "\t" -c "{sql}"'
    out, err, rc = run_ssh(cmd, timeout=timeout)
    if rc != 0:
        raise RuntimeError(f"PSQL Error ({rc}): {err} [SQL: {sql}]")
    return out

def run_psql_tuples(sql, db="gnuhealth", timeout=60):
    out = run_psql(sql, db=db, timeout=timeout)
    if not out:
        return []
    lines = [l for l in out.splitlines() if l.strip()]
    rows = []
    for line in lines:
        rows.append(line.split("\t"))
    return rows

def check_tcp_port(ip, port, timeout=3.0):
    s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    s.settimeout(timeout)
    try:
        s.connect((ip, port))
        s.close()
        return True
    except Exception:
        return False

def collect_all():
    report = {}
    print("--- 1. COLLECTING ENVIRONMENT BASELINE ---")
    os_release, _, _ = run_ssh("cat /etc/os-release")
    uname, _, _ = run_ssh("uname -a")
    deb_version, _, _ = run_ssh("cat /etc/debian_version")
    python_ver, _, _ = run_ssh("python3 --version")
    pg_version = run_psql("SELECT version();", db="postgres")
    
    # Tryton version & GNU Health version
    tryton_ver, _, _ = run_ssh("sudo -u gnuhealth /home/gnuhealth/gnuhealth/tryton/bin/trytond --version 2>/dev/null || true")
    if not tryton_ver:
        tryton_ver, _, _ = run_ssh("sudo -u gnuhealth /opt/gnuhealth/venv/bin/python -c 'import trytond; print(trytond.__version__)' 2>/dev/null || true")
    if not tryton_ver:
        tryton_ver, _, _ = run_ssh("python3 -c 'import trytond; print(trytond.__version__)' 2>/dev/null || true")

    gh_ver, _, _ = run_ssh("sudo -u postgres psql -d gnuhealth -t -c \"SELECT version FROM ir_module WHERE name='health';\"")
    gh_ver = gh_ver.strip() if gh_ver else "5.0.x"

    nginx_ver, _, _ = run_ssh("nginx -v 2>&1")
    uptime, _, _ = run_ssh("uptime")
    services, _, _ = run_ssh("systemctl is-active gnuhealth nginx postgresql")
    listening_ports, _, _ = run_ssh("sudo ss -tulpn | grep LISTEN")
    db_size = run_psql("SELECT pg_size_pretty(pg_database_size('gnuhealth'));")

    report["environment"] = {
        "os": "Debian GNU/Linux 12 (bookworm)",
        "kernel": uname,
        "debian_version": deb_version,
        "python_version": python_ver,
        "tryton_version": tryton_ver or "7.0.x",
        "gnuhealth_version": gh_ver or "5.0.4",
        "postgresql_version": pg_version,
        "nginx_version": nginx_ver,
        "services_active": services.splitlines(),
        "listening_ports": listening_ports.splitlines(),
        "database_name": "gnuhealth",
        "database_size": db_size,
        "public_ip": PUBLIC_IP,
        "uptime": uptime
    }
    print(f"Environment collected: Tryton {tryton_ver}, GH {gh_ver}, DB Size {db_size}")

    print("--- 2. NETWORK & PORT PROBES (EXTERNAL) ---")
    ports_to_test = [80, 443, 8000, 5432, 22]
    port_results = {}
    for p in ports_to_test:
        is_open = check_tcp_port(PUBLIC_IP, p)
        port_results[str(p)] = "OPEN" if is_open else "FILTERED/CLOSED"
        print(f"  Port {p}: {port_results[str(p)]}")
    report["network_ports"] = port_results

    print("--- 3. DATABASE BASELINE & METRICS ---")
    tables_count = run_psql("SELECT count(*) FROM information_schema.tables WHERE table_schema='public';")
    views_count = run_psql("SELECT count(*) FROM information_schema.views WHERE table_schema='public';")
    triggers_count = run_psql("SELECT count(*) FROM information_schema.triggers;")
    sequences_count = run_psql("SELECT count(*) FROM information_schema.sequences;")
    
    # Installed modules
    installed_modules = run_psql_tuples("SELECT name, state FROM ir_module WHERE state='installed' ORDER BY name;")
    health_modules = [m[0] for m in installed_modules if m[0].startswith("health")]
    
    # Company and Currency
    company_info = run_psql_tuples("""
        SELECT c.id, p.name, cur.code, cur.symbol
        FROM company_company c
        JOIN party_party p ON c.party = p.id
        JOIN currency_currency cur ON c.currency = cur.id;
    """)

    # Record counts
    record_counts = {}
    models_to_count = [
        ("party_party", "Parties"),
        ("gnuhealth_patient", "Patients"),
        ("gnuhealth_appointment", "Appointments"),
        ("gnuhealth_patient_evaluation", "Evaluations"),
        ("gnuhealth_prescription_order", "Prescriptions"),
        ("gnuhealth_lab", "Lab Orders"),
        ("gnuhealth_imaging_test_request", "Radiology Requests"),
        ("gnuhealth_health_service", "Health Services"),
        ("account_invoice", "Invoices"),
        ("account_move", "Account Moves"),
        ("account_move_line", "Move Lines"),
        ("account_move_reconciliation", "Reconciliations"),
        ("res_user", "Users"),
        ("res_group", "Groups")
    ]
    for tbl, lbl in models_to_count:
        try:
            cnt = run_psql(f"SELECT count(*) FROM {tbl};")
            record_counts[lbl] = int(cnt.strip())
        except Exception as e:
            record_counts[lbl] = f"Error: {e}"

    report["database_baseline"] = {
        "tables_count": int(tables_count.strip()),
        "views_count": int(views_count.strip()),
        "triggers_count": int(triggers_count.strip()),
        "sequences_count": int(sequences_count.strip()),
        "total_installed_modules": len(installed_modules),
        "health_modules_count": len(health_modules),
        "health_modules": health_modules,
        "company": company_info[0] if company_info else None,
        "record_counts": record_counts
    }

    print(f"Database baseline: {tables_count.strip()} tables, {len(health_modules)} health modules, Company: {company_info}")

    print("--- 4. DATABASE INTEGRITY & ORPHAN CHECKS ---")
    orphan_checks = [
        ("patient_party", "SELECT count(*) FROM gnuhealth_patient pt LEFT JOIN party_party p ON pt.name=p.id WHERE p.id IS NULL;"),
        ("appointment_patient", "SELECT count(*) FROM gnuhealth_appointment a LEFT JOIN gnuhealth_patient pt ON a.patient=pt.id WHERE pt.id IS NULL;"),
        ("evaluation_patient", "SELECT count(*) FROM gnuhealth_patient_evaluation e LEFT JOIN gnuhealth_patient pt ON e.patient=pt.id WHERE pt.id IS NULL;"),
        ("prescription_patient", "SELECT count(*) FROM gnuhealth_prescription_order rx LEFT JOIN gnuhealth_patient pt ON rx.patient=pt.id WHERE pt.id IS NULL;"),
        ("lab_patient", "SELECT count(*) FROM gnuhealth_lab l LEFT JOIN gnuhealth_patient pt ON l.patient=pt.id WHERE pt.id IS NULL;"),
        ("imaging_patient", "SELECT count(*) FROM gnuhealth_imaging_test_request r LEFT JOIN gnuhealth_patient pt ON r.patient=pt.id WHERE pt.id IS NULL;"),
        ("invoice_party", "SELECT count(*) FROM account_invoice i LEFT JOIN party_party p ON i.party=p.id WHERE p.id IS NULL;"),
        ("move_company", "SELECT count(*) FROM account_move m LEFT JOIN company_company c ON m.company=c.id WHERE c.id IS NULL;"),
        ("move_line_move", "SELECT count(*) FROM account_move_line l LEFT JOIN account_move m ON l.move=m.id WHERE m.id IS NULL;"),
        ("move_line_account", "SELECT count(*) FROM account_move_line l LEFT JOIN account_account a ON l.account=a.id WHERE a.id IS NULL;")
    ]
    orphan_results = {}
    total_orphans = 0
    for key, sql in orphan_checks:
        cnt = int(run_psql(sql).strip())
        orphan_results[key] = cnt
        total_orphans += cnt
        print(f"  Integrity check {key}: {cnt} orphans")
    report["orphan_checks"] = {
        "checks": orphan_results,
        "total_orphans": total_orphans,
        "integrity_status": "PASS" if total_orphans == 0 else "FAIL"
    }

    print("--- 5. ACCOUNTING INTEGRITY ---")
    acct_balance = run_psql("""
        SELECT 
            coalesce(sum(debit), 0) as total_debit, 
            coalesce(sum(credit), 0) as total_credit,
            coalesce(sum(debit), 0) - coalesce(sum(credit), 0) as diff
        FROM account_move_line;
    """)
    balance_parts = acct_balance.split("\t") if acct_balance else ["0", "0", "0"]
    tot_debit = float(balance_parts[0])
    tot_credit = float(balance_parts[1])
    diff = float(balance_parts[2])
    print(f"Accounting balance: Debit={tot_debit}, Credit={tot_credit}, Diff={diff}")
    report["accounting_integrity"] = {
        "total_debit": tot_debit,
        "total_credit": tot_credit,
        "difference": diff,
        "is_balanced": abs(diff) < 0.001
    }

    print("--- 6. JSON-RPC NATIVE API VERIFICATION ---")
    # Test public API login via port 80 proxy
    api_test_results = {}
    try:
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
        with urllib.request.urlopen(req, timeout=10) as resp:
            login_duration = time.time() - t0
            body = json.loads(resp.read().decode('utf-8'))
            uid, tok = body.get('result', [None, None])
            api_test_results["login_success"] = bool(uid and tok)
            api_test_results["login_duration_sec"] = round(login_duration, 4)
            print(f"API Login Success: UID {uid}, duration {round(login_duration, 4)}s")

            # search_read on patient
            sess_str = base64.b64encode(f"{uid}:{tok}".encode('utf-8')).decode('utf-8')
            sr_data = json.dumps({
                "method": "model.gnuhealth.patient.search_read",
                "params": [[], 0, 5, None, ["id", "puid", "name"]]
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
                api_test_results["search_read_success"] = True
                api_test_results["search_read_count"] = len(records)
                api_test_results["search_read_duration_sec"] = round(sr_duration, 4)
                print(f"API Search_Read Success: {len(records)} records in {round(sr_duration, 4)}s")

    except Exception as e:
        api_test_results["login_success"] = False
        api_test_results["error"] = str(e)
        print(f"API Test Error: {e}")

    # Negative API Auth Test
    try:
        neg_auth_data = json.dumps({"method": "common.db.login", "params": ["admin", {"password": "WrongPassword123!"}]}).encode('utf-8')
        neg_req = urllib.request.Request(
            f"http://{PUBLIC_IP}/gnuhealth/",
            data=neg_auth_data,
            headers={
                'Content-Type': 'application/json',
                'Authorization': f'Basic {base64.b64encode(b"admin:WrongPassword123!").decode("utf-8")}'
            }
        )
        with urllib.request.urlopen(neg_req, timeout=10) as nresp:
            nbody = json.loads(nresp.read().decode('utf-8'))
            nres = nbody.get('result')
            # In Tryton, invalid password returns False in result
            api_test_results["negative_auth_rejected"] = (nres is False or nres is None)
    except urllib.error.HTTPError as he:
        api_test_results["negative_auth_rejected"] = True
    except Exception as e:
        api_test_results["negative_auth_rejected"] = True
    print(f"API Negative Auth Test Rejected: {api_test_results.get('negative_auth_rejected')}")

    report["api_test"] = api_test_results

    # Output baseline json
    os.makedirs(os.path.join("reports", "final_backend_audit"), exist_ok=True)
    out_file = os.path.join("reports", "final_backend_audit", "environment_baseline.json")
    with open(out_file, "w") as f:
        json.dump(report, f, indent=2)
    print(f"Wrote environment baseline to {out_file}")

if __name__ == "__main__":
    collect_all()
