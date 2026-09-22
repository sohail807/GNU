# 17. Operations, Maintenance & Disaster Recovery

**Project**: Healthcare Management System — GNU Health Implementation  
**Assessment Date**: 2026-09-21  
**Target Host**: Debian GNU/Linux 12 (GCP VM `gnuhealth-srv`)  
**Document**: `docs/17-Operations-and-Maintenance.md`  

---

## 1. Executive Summary

This document specifies the routine operational procedures, daemon maintenance commands, backup schedules, log monitoring, and disaster recovery runbooks for systems administration personnel managing the GNU Health platform.

---

## 2. Core Service Management

The system runs as a systemd service under user `gnuhealth` on Debian 12:

### Tryton Application Server (`gnuhealth.service`)
- **Check Status**:
  ```bash
  sudo systemctl status gnuhealth
  ```
- **Restart Application Server**:
  ```bash
  sudo systemctl restart gnuhealth
  ```
- **Stop Application Server**:
  ```bash
  sudo systemctl stop gnuhealth
  ```
- **Start Application Server**:
  ```bash
  sudo systemctl start gnuhealth
  ```

### Nginx Reverse Proxy (`nginx.service`)
- **Test Configuration Syntax**:
  ```bash
  sudo nginx -t
  ```
- **Reload Nginx Without Downtime**:
  ```bash
  sudo systemctl reload nginx
  ```
- **Restart Nginx**:
  ```bash
  sudo systemctl restart nginx
  ```

### PostgreSQL RDBMS (`postgresql.service`)
- **Check Database Status**:
  ```bash
  sudo systemctl status postgresql
  ```
- **Restart Database Daemon**:
  ```bash
  sudo systemctl restart postgresql
  ```

---

## 3. Log Monitoring & Diagnostics

1. **Tryton Application Server Logs**:
   ```bash
   sudo journalctl -u gnuhealth -f
   ```
2. **Nginx Web Access & Error Logs**:
   ```bash
   sudo tail -f /var/log/nginx/access.log
   sudo tail -f /var/log/nginx/error.log
   ```
3. **PostgreSQL Database Logs**:
   ```bash
   sudo tail -f /var/log/postgresql/postgresql-15-main.log
   ```

---

## 4. Automated Database Backup Runbook

PostgreSQL database backups must execute daily during off-peak hours (e.g. 02:00 AST).

### A. Manual Immediate Backup Command
Run on the host VM as user `gnuhealth` or root:

```bash
BACKUP_FILE="/home/gnuhealth/backup/gnuhealth_$(date +%Y%m%d_%H%M%S).sql.gz"
mkdir -p /home/gnuhealth/backup
sudo -u postgres pg_dump -d gnuhealth --format=custom --blobs | gzip > "${BACKUP_FILE}"
echo "Backup created at ${BACKUP_FILE} ($(du -h "${BACKUP_FILE}" | cut -f1))"
```

### B. Automated Cron Schedule (`/etc/cron.d/gnuhealth_backup`)
Create `/etc/cron.d/gnuhealth_backup` to automate daily backups with 30-day retention:

```cron
0 2 * * * postgres pg_dump -d gnuhealth --format=custom --blobs | gzip > /home/gnuhealth/backup/gnuhealth_$(date +\%Y\%m\%d).sql.gz
0 3 * * * root find /home/gnuhealth/backup/ -name "*.sql.gz" -mtime +30 -delete
```

---

## 5. Disaster Recovery & Restore Runbook

To restore the system from a full backup archive:

1. **Stop Application Daemon**:
   ```bash
   sudo systemctl stop gnuhealth
   ```
2. **Drop and Recreate Database**:
   ```bash
   sudo -u postgres dropdb gnuhealth
   sudo -u postgres createdb -O gnuhealth -E UTF8 gnuhealth
   ```
3. **Restore Backup Archive**:
   ```bash
   gunzip -c /home/gnuhealth/backup/gnuhealth_TARGET_DATE.sql.gz | sudo -u postgres pg_restore -d gnuhealth
   ```
4. **Update System Modules (if needed)**:
   ```bash
   sudo -u gnuhealth /home/gnuhealth/venv/bin/trytond-admin -c /home/gnuhealth/trytond.conf -d gnuhealth --all
   ```
5. **Start Application Daemon**:
   ```bash
   sudo systemctl start gnuhealth
   sudo systemctl status gnuhealth
   ```

---

## 6. Document Attachments Backup

Patient report uploads and diagnostic images reside in `/home/gnuhealth/attach`. Sync this directory alongside database backups to off-site cloud storage:

```bash
rsync -avz /home/gnuhealth/attach/ /mnt/secure_backup/gnuhealth_attach/
```
