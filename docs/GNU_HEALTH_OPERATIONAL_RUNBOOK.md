# GNU HEALTH HMIS 5.0 — OPERATIONAL RUNBOOK
**Target Host:** GCP VM `gnuhealth-srv` (Zone: `europe-west4-a`, Public IP: `34.7.237.8`)  
**Operating System:** Debian GNU/Linux 12.15 (Bookworm)  
**Authoritative Backend:** GNU Health HMIS 5.0.6 / Tryton 7.0.57 / PostgreSQL 15.19 / Nginx 1.22.1  
**Certified State:** **TECHNICALLY CERTIFIED — DEMO/UAT OPERATIONAL**

---

## 1. System Services & Process Control

The clinic infrastructure relies on three core systemd services running on the host VM:

| Service Name | Unit File | Bound Interface / Port | Function |
|:---|:---|:---|:---|
| **`postgresql`** | `postgresql.service` | `127.0.0.1:5432` (Private Loopback) | Relational database engine |
| **`gnuhealth`** | `gnuhealth.service` | `127.0.0.1:8000` (Private Loopback) | Tryton WSGI application daemon |
| **`nginx`** | `nginx.service` | `0.0.0.0:80` / `0.0.0.0:443` (Public) | Reverse proxy, TLS termination, static assets |
| **`gnuhealth-backup`**| `gnuhealth-backup.timer` | Daily cron timer (`02:00 UTC`) | Automated database & attachment backup |

### Routine Service Commands
```bash
# Check service status
sudo systemctl status gnuhealth postgresql nginx

# Restart application service (graceful)
sudo systemctl restart gnuhealth

# Reload Nginx configuration without dropping connections
sudo systemctl reload nginx

# View real-time Tryton application logs
sudo journalctl -u gnuhealth -f --no-pager
```

---

## 2. Automated Backups & Disaster Recovery

### 2.1 Backup Policy & Directory Structure
- **Storage Location:** `/var/backups/gnuhealth/` (Permissions: `0750 gnuhealth:gnuhealth`)
- **Database Dump Format:** PostgreSQL Custom Compressed Archive (`.dump`, `pg_dump -Fc`)
- **Attachment Archive:** Tar Gzip Archive (`.tar.gz`, `/home/gnuhealth/attach`)
- **Retention Schedule:** 30 daily snapshots maintained locally; off-site replication to Google Cloud Storage (GCS) required prior to production go-live.

### 2.2 On-Demand Backup Execution
```bash
# Execute pre-maintenance manual backup
sudo -u postgres pg_dump -Fc gnuhealth > /var/backups/gnuhealth/gnuhealth_manual_$(date +%Y%m%d_%H%M%S).dump
sudo chmod 644 /var/backups/gnuhealth/gnuhealth_manual_*.dump
```

### 2.3 Disaster Recovery Isolated Restore Drill
**MANDATORY RULE:** Never restore backups directly into the live `gnuhealth` database for verification drills. Always restore into an isolated database.

```bash
# Execute automated isolated DR drill script
sudo bash /home/gnuhealth/scripts/e2e_cert_backup_and_restore_drill.sh
```
The script automatically:
1. Validates archive integrity and catalog readability (`pg_restore -l`).
2. Creates isolated database `gnuhealth_isolated_e2e_restore`.
3. Restores database and checks all 306 tables, entity census, and GL balance (`Total DR == Total CR`).
4. Extracts and verifies attachment archives in `/tmp`.
5. Destroys isolated test database without impacting production traffic.

---

## 3. User Administration & Security Runbook

### 3.1 Principle of Least Privilege
- **Never grant Group 1 (`Administration`) to operational staff.**
- Group 1 is restricted strictly to designated system administrators (`admin`, `demo_admin1`).
- Clinical, nursing, laboratory, radiology, and cashier staff must be assigned only their designated operational groups:
  - Doctor: `Health Doctor`
  - Nurse: `Health Nurse`
  - Lab: `Health Lab`
  - Radiology: `Health Imaging`
  - Front Desk: `Health Front Desk`
  - Cashier: `Account`, `Accounting Party`

### 3.2 Secure Password Reset Procedure
All password updates must be executed natively via the Tryton ORM to generate salted scrypt hashes. **Direct SQL password updates are strictly prohibited.**

```python
# Execute inside Tryton Python environment:
# /home/gnuhealth/venv/bin/python
from trytond.config import config
config.update_etc('/home/gnuhealth/trytond.conf')
from trytond.pool import Pool
from trytond.transaction import Transaction

Pool.start()
pool = Pool('gnuhealth')
pool.init()
User = pool.get('res.user')

with Transaction().start('gnuhealth', 0) as t:
    users = User.search([('login', '=', 'TARGET_USERNAME')])
    if users:
        users[0].password = 'STRONG_TEMPORARY_PASSWORD_MIN_16_CHARS'
        users[0].save()
        t.commit()
        print("Password updated successfully.")
```

---

## 4. Operational Monitoring & Health Checks

### 4.1 System Health Probes
```bash
# 1. Verify listening ports
sudo ss -tulpn | grep -E '(8000|5432|80|443)'

# 2. Check General Ledger Balance
sudo -u postgres psql -d gnuhealth -c \
  "SELECT SUM(debit) as debits, SUM(credit) as credits, SUM(debit)-SUM(credit) as diff FROM account_move_line;"

# 3. Check for failed login attempts
sudo -u postgres psql -d gnuhealth -c \
  "SELECT count_ip, create_date FROM res_user_login_attempt ORDER BY create_date DESC LIMIT 5;"
```

---

## 5. Emergency Incident Response Playbooks

### Incident A: Tryton Service Unresponsive / 502 Bad Gateway
1. Inspect Nginx error logs: `sudo tail -n 50 /var/log/nginx/error.log`
2. Inspect Tryton service status: `sudo systemctl status gnuhealth`
3. If Tryton daemon crashed, inspect crash traceback: `sudo journalctl -u gnuhealth -n 100 --no-pager`
4. Restart service: `sudo systemctl restart gnuhealth`
5. Verify loopback response: `curl -I http://127.0.0.1:8000/`

### Incident B: General Ledger Out of Balance (Difference != 0.00)
1. **HALT all financial transaction posting immediately.**
2. Run transaction audit query:
   ```sql
   SELECT move, SUM(debit) - SUM(credit) as imbalance 
   FROM account_move_line 
   GROUP BY move 
   HAVING SUM(debit) - SUM(credit) != 0;
   ```
3. Identify offending move ID; inspect `create_uid` and `create_date`.
4. Capture forensic dump immediately prior to corrective action.

---

## 6. Pre-Production Hardening Checklist

Before switching from DEMO/UAT mode to live clinical operations:
- [ ] Acquire official clinic domain name (FQDN).
- [ ] Provision Let's Encrypt TLS certificate on Nginx (Port 443 active, Port 80 permanent redirect).
- [ ] Ingest official MoPH clinic facility license and physician licensing roster.
- [ ] Import approved clinic chargemaster tariff schedule.
- [ ] Configure off-site daily snapshot sync to encrypted GCS bucket.
- [ ] Execute `scripts/purge_e2e_cert_data.py --execute` to remove synthetic test records.
