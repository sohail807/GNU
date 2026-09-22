# GNU HEALTH HMIS — PRODUCTION OPERATIONS RUNBOOK
## GCP COMPUTE ENGINE (`gnuhealth-srv`)

**Target Environment**: `gnuhealth-srv` (Debian 12 Bookworm, IP: `34.7.237.8`)  
**Scope**: Routine Operations, Service Lifecycle, Automated Backups, Disaster Recovery & Troubleshooting  
**Confidentiality**: Zero Plaintext Credentials or Private Keys Included  

---

## 1. System Architecture & Port Mapping

```text
+-------------------+       +--------------------+       +----------------------+
| Internet (Public) | ----> | Nginx (TCP 80/443) | ----> | Tryton (127.0.0.1)   |
+-------------------+       +--------------------+       +----------+-----------+
                                                                    | Unix Socket
                                                         +----------v-----------+
                                                         | PostgreSQL (Port 5432)|
                                                         +----------------------+
```

| Component | Service Name | Listening Socket | Config File |
| :--- | :--- | :--- | :--- |
| **GNU Health / Tryton**| `gnuhealth.service` | `127.0.0.1:8000` | `/home/gnuhealth/trytond.conf` |
| **Web Proxy** | `nginx.service` | `0.0.0.0:80`, `[::]:80` | `/etc/nginx/sites-available/gnuhealth` |
| **Database Engine** | `postgresql.service` | `127.0.0.1:5432`, socket | `/etc/postgresql/15/main/postgresql.conf` |
| **Daily Backup Timer**| `gnuhealth-backup.timer` | `02:00:00 UTC` | `/etc/systemd/system/gnuhealth-backup.timer` |

---

## 2. Service Management Commands

### 2.1 Checking Service Status
```bash
sudo systemctl status gnuhealth.service
sudo systemctl status nginx.service
sudo systemctl status postgresql.service
sudo systemctl status gnuhealth-backup.timer
```

### 2.2 Starting Services
```bash
sudo systemctl start gnuhealth.service
sudo systemctl start nginx.service
sudo systemctl start postgresql.service
```

### 2.3 Stopping Services
```bash
sudo systemctl stop gnuhealth.service
sudo systemctl stop nginx.service
```

### 2.4 Restarting Services
```bash
# Restart application server
sudo systemctl restart gnuhealth.service

# Reload web server without dropping connections
sudo nginx -t && sudo systemctl reload nginx.service

# Restart database engine
sudo systemctl restart postgresql.service
```

---

## 3. Log Inspection & Troubleshooting

| Log Description | File Location | Inspection Command |
| :--- | :--- | :--- |
| **Tryton Application Logs** | Systemd Journal | `sudo journalctl -u gnuhealth.service -n 50 --no-pager` |
| **Nginx Access Log** | `/var/log/nginx/access.log` | `sudo tail -n 50 /var/log/nginx/access.log` |
| **Nginx Error Log** | `/var/log/nginx/error.log` | `sudo tail -n 50 /var/log/nginx/error.log` |
| **Automated Backup Log** | `/var/log/gnuhealth_backup.log`| `sudo tail -n 50 /var/log/gnuhealth_backup.log` |
| **PostgreSQL Error Log** | `/var/log/postgresql/` | `sudo tail -n 50 /var/log/postgresql/postgresql-15-main.log` |

---

## 4. Automated Backup & Disaster Recovery Procedures

### 4.1 On-Demand Backup Execution
```bash
# Execute the production backup script manually
sudo /usr/local/bin/gnuhealth-backup.sh

# Verify the latest generated backup
sudo ls -lh /var/backups/gnuhealth/
sudo tail -n 10 /var/log/gnuhealth_backup.log
```

### 4.2 Restoring from Backup (Disaster Recovery Protocol)
> [!CAUTION]
> Never restore directly into the live `gnuhealth` database without a confirmed pre-recovery snapshot and medical director authorization.

```bash
# 1. Stop application traffic
sudo systemctl stop gnuhealth.service

# 2. Terminate existing connections to the database
sudo -u postgres psql -c "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname='gnuhealth' AND pid <> pg_backend_pid();"

# 3. Create an emergency safety copy of current DB state
sudo -u postgres createdb -O gnuhealth -T gnuhealth gnuhealth_pre_recovery_safety

# 4. Restore the selected backup archive
LATEST_DUMP="/var/backups/gnuhealth/<TARGET_BACKUP_FILE>.dump"
sudo -u postgres pg_restore --clean --if-exists -d gnuhealth "${LATEST_DUMP}"

# 5. Restore file attachments
sudo tar -xzf "/var/backups/gnuhealth/<TARGET_ATTACH_FILE>.tar.gz" -C /home/gnuhealth/attach/
sudo chown -R gnuhealth:gnuhealth /home/gnuhealth/attach/

# 6. Restart application
sudo systemctl start gnuhealth.service
sudo systemctl is-active gnuhealth.service
```

---

## 5. Storage & Database Health Verification

```bash
# Check filesystem utilization (Alert if root partition > 80%)
df -h /

# Check PostgreSQL database size
sudo -u postgres psql -d gnuhealth -c "SELECT pg_size_pretty(pg_database_size('gnuhealth'));"

# Run routine PostgreSQL VACUUM and ANALYZE
sudo -u postgres psql -d gnuhealth -c "VACUUM ANALYZE;"
```

---

## 6. Official FQDN & TLS Provisioning Protocol

When the official clinic domain (e.g., `hmis.yourclinic.com`) has been delegated via DNS A-Record to `34.7.237.8`:

```bash
# 1. Verify public DNS resolution from the server
dig +short <OFFICIAL_CLINIC_FQDN>

# 2. Issue Let's Encrypt certificate using Certbot
sudo certbot --nginx -d <OFFICIAL_CLINIC_FQDN>

# 3. Test automated certificate renewal
sudo certbot renew --dry-run
```
