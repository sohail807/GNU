# GNU HEALTH HMIS 5.0 — PRODUCTION OPERATIONS RUNBOOK
## System Administration, Service Management, Maintenance Protocols & Incident Response Playbooks

**Document Identifier**: `GH-OPS-013`  
**System Baseline**: GNU Health 5.0.6 / Tryton 7.0.57 / Debian 12.15 Bookworm  
**Host VM**: `gnuhealth-srv` (IP: `34.7.237.8`, GCP: `gnu-health-509307`)  
**Audience**: Systems Administrators, Database Administrators & DevOps Engineers  
**Status**: `AUTHORITATIVE OPERATIONAL RUNBOOK`  

---

## 1. System Architecture & Service Hierarchy

```
+-----------------------------------------------------------------------------------+
| Systemd Service Layer:                                                            |
|   1. postgresql.service (Database Tier - Port 5432)                               |
|   2. gnuhealth.service  (Application Tier - Port 8000, User: gnuhealth)           |
|   3. nginx.service      (Reverse Proxy Tier - Ports 80 & 443)                     |
|   4. gnuhealth-backup.timer (Automated Daily 02:00 UTC Backup Engine)             |
+-----------------------------------------------------------------------------------+
```

---

## 2. Standard Service Management Procedures

### 2.1 Service Status Verification
```bash
# Check all core services concurrently
sudo systemctl status postgresql gnuhealth nginx gnuhealth-backup.timer --no-pager
```

### 2.2 Restarting Services in Correct Dependency Order
If the entire application stack requires restart, execute in strict dependency order:
```bash
# 1. Database Tier
sudo systemctl restart postgresql

# 2. Application Tier (Wait 3 seconds for database socket readiness)
sleep 3
sudo systemctl restart gnuhealth

# 3. Web Proxy Tier
sudo systemctl reload nginx
```

### 2.3 Real-Time Log Monitoring
```bash
# Follow live application server logs
sudo journalctl -u gnuhealth -f -n 100

# Inspect Nginx access and error logs
sudo tail -f /var/log/nginx/access.log /var/log/nginx/error.log

# Inspect PostgreSQL query and error logs
sudo tail -f /var/log/postgresql/postgresql-15-main.log
```

---

## 3. Database Maintenance & Backup Operations

### 3.1 Inspecting Automated Daily Backups
The automated backup engine runs daily at 02:00 UTC via `gnuhealth-backup.timer`:
```bash
# Check timer status and next scheduled run
sudo systemctl list-timers gnuhealth-backup.timer

# View existing backup snapshots and disk usage
sudo ls -lh /var/backups/gnuhealth/
```

### 3.2 Executing an On-Demand Manual Backup
Prior to performing major system changes or schema updates, execute an immediate backup:
```bash
sudo /usr/local/bin/gnuhealth-backup.sh
```

### 3.3 Full Disaster Recovery Restoration Procedure
In the event of database failure or corrupted records, execute the following restoration protocol:
```bash
# 1. Stop Tryton Application Server to terminate active transactions
sudo systemctl stop gnuhealth

# 2. Terminate active PostgreSQL backend connections
sudo -u postgres psql -c "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = 'gnuhealth' AND pid <> pg_backend_pid();"

# 3. Drop corrupted database and recreate clean target
sudo -u postgres dropdb gnuhealth
sudo -u postgres createdb gnuhealth

# 4. Restore target snapshot from backup directory
TARGET_DUMP="/var/backups/gnuhealth/gnuhealth_clean_baseline_20260922.dump"
sudo -u postgres pg_restore -d gnuhealth "$TARGET_DUMP"

# 5. Restore attachment directory if applicable
# sudo tar -xzf /var/backups/gnuhealth/gnuhealth_attach_*.tar.gz -C /home/gnuhealth/attach/

# 6. Restart Tryton Application Server
sudo systemctl start gnuhealth

# 7. Verify service health
sudo systemctl status gnuhealth
```

---

## 4. User Onboarding & Access Maintenance

### 4.1 Provisioning a New Clinical Physician
1. Access the Tryton administrative console or run the user onboarding CLI script:
   ```bash
   /home/gnuhealth/venv/bin/python /home/gnuhealth/scripts/create_health_prof.py \
     --name "Dr. Fatima Al-Kuwari" \
     --qid "29163400123" \
     --specialty "Pediatrics" \
     --username "dr_fatima"
   ```
2. Verify that the physician party record links to `gnuhealth.healthprofessional` and has an entry in `gnuhealth.hp_specialty`.

### 4.2 Resetting a User Password
To securely reset a user's password directly from the server:
```bash
/home/gnuhealth/venv/bin/python3 -c "
from trytond.pool import Pool
from trytond.transaction import Transaction
Pool.start()
pool = Pool('gnuhealth')
pool.init()
User = pool.get('res.user')
with Transaction().start('gnuhealth', 1) as t:
    users = User.search([('login', '=', 'TARGET_USERNAME')])
    if users:
        users[0].password = 'NEW_TEMPORARY_PASSWORD'
        users[0].save()
        t.commit()
        print('Password updated successfully')
"
```

---

## 5. Incident Response Playbooks

### Playbook 1: Nginx Returning `HTTP 502 Bad Gateway`
* **Root Cause**: Tryton application daemon (`trytond`) has crashed or is not responding on `127.0.0.1:8000`.
* **Resolution Steps**:
  1. Inspect service status: `sudo systemctl status gnuhealth`
  2. Inspect crash trace: `sudo journalctl -u gnuhealth -n 50 --no-pager`
  3. Verify PostgreSQL is healthy: `sudo systemctl status postgresql`
  4. Restart application server: `sudo systemctl restart gnuhealth`
  5. Test connection locally: `curl -I http://127.0.0.1:8000`

### Playbook 2: PostgreSQL Storage Exhaustion (`Disk Full`)
* **Root Cause**: Database WAL logs, temporary files, or unrotated backups have consumed disk capacity.
* **Resolution Steps**:
  1. Check disk utilization: `df -h`
  2. Identify large directories: `sudo du -sh /var/backups/gnuhealth /var/log /var/lib/postgresql/15/main`
  3. Purge expired backup snapshots older than 30 days: `sudo find /var/backups/gnuhealth/ -name "*.dump" -mtime +30 -delete`
  4. Clean journald logs: `sudo journalctl --vacuum-size=200M`

### Playbook 3: Concurrency Lock Contention (`TransactionError`)
* **Root Cause**: Long-running reporting query or orphaned transaction holding locks on accounting sequence tables (`ir_sequence_strict`).
* **Resolution Steps**:
  1. Inspect blocking locks in PostgreSQL:
     ```sql
     SELECT pid, query, age(clock_timestamp(), query_start), state 
     FROM pg_stat_activity 
     WHERE state != 'idle' AND query NOT LIKE '%pg_stat_activity%';
     ```
  2. Terminate hung backend query:
     ```sql
     SELECT pg_cancel_backend(BLOCKING_PID);
     ```

### Playbook 4: Targeted DEMO/UAT Transaction Data Cleanup SOP
When authorized to transition from DEMO/UAT mode to live production operations:
1. **Mandatory Pre-Cleanup Backup**:
   ```bash
   sudo /usr/local/bin/gnuhealth-backup.sh
   ```
2. **Targeted Identifier Scope (Never use date ranges or unconstrained TRUNCATE)**:
   * **Synthetic Patients**: PUIDs `DEMO-QID-000001`, `DEMO-QID-000002`, `DEMO-QID-000003` (IDs: 52, 53, 54).
   * **Synthetic Appointments**: IDs 54, 55, 56, 57.
   * **Synthetic Evaluations**: IDs 31, 32.
   * **Synthetic Prescriptions**: IDs 30, 31.
   * **Synthetic Lab Requisitions**: IDs 25, 26.
   * **Synthetic Radiology Requests**: IDs 25, 26.
   * **Synthetic Health Services**: IDs 20, 21.
   * **Synthetic Customer Invoices**: IDs 22, 23 (`INV-2026/00004`, `INV-2026/00005`).
   * **Synthetic GL Moves**: IDs 24, 25, 26, 27.
3. **Execution Safety**:
   * Master configuration entities (`company_company` ID 2, `account_account`, `product_template`) are retained.
   * If a pristine zero-census database is requested for opening day, restore the verified pre-implementation clean snapshot:
     ```bash
     sudo systemctl stop gnuhealth
     sudo -u postgres dropdb gnuhealth
     sudo -u postgres createdb gnuhealth
     sudo -u postgres pg_restore -d gnuhealth /var/backups/gnuhealth/gnuhealth_clean_baseline_20260922.dump
     sudo systemctl start gnuhealth
     ```

---

## 6. DEMO/UAT BACKEND IMPLEMENTATION STATUS

### TECHNICALLY IMPLEMENTED
* Automated systemd service management (`gnuhealth.service`, `gnuhealth-backup.timer`).
* Database backup engine with automated cryptographic digest logging.
* Multi-user configuration and maintenance procedures established.

### DEMO/UAT VERIFIED
* Operational recovery drills and playbooks validated against live host.
* Targeted DEMO data cataloging and cleanup SOP defined with explicit entity IDs.
* Subledger reconciliation, accounting integrity, and rollback mechanics fully operational.

### PRODUCTION INPUT PENDING
* Official clinic contact details, domain DNS delegation, and licensed staff roster.

### BUSINESS APPROVAL PENDING
* Formal approval of operational runbook and maintenance escalation paths by Operations / IT Committee.

