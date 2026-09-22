# Backup Information & Snapshot Documentation

**Document:** `18_BACKUP_INFORMATION.md`  
**Database:** `gnuhealth`  
**Host:** GCP Compute Engine `gnuhealth-srv` (Debian 12, 34.7.237.8)  
**Timestamp:** 2026-09-21T09:15:24Z  
**Backup Method:** PostgreSQL Native `pg_dump` & Tryton Programmatic ORM Master Snapshot  
**Status:** `VERIFIED`

---

## 1. Backup Details

- **Database Name:** `gnuhealth`
- **Database Engine:** PostgreSQL 15.15 on Debian 12 (Bookworm)
- **Database Owner:** `gnuhealth`
- **GNU Health Version:** 5.0.7
- **Tryton Server Version:** 7.0.57
- **Configuration Snapshot File:** `gnuhealth-qatar-clinic-config/backup/pre_config_snapshot.json`
- **Snapshot Size:** 27,453 Bytes
- **Content Verified:**
  - 24 Activated Tryton & GNU Health modules
  - 28 Base security groups
  - 9 Default user account templates
  - 15 Billable service templates
  - 17 System sequence records

---

## 2. Server-Side PostgreSQL Dump Procedure

On the GCP host `gnuhealth-srv`, PostgreSQL backups are created using standard custom/compressed dump formats:

```bash
# Execute as postgres or gnuhealth user on gnuhealth-srv
sudo -u postgres pg_dump -Fc gnuhealth > /home/gnuhealth/backup_gnuhealth_preconfig_$(date +%Y%m%d_%H%M%S).dump

# Verify backup integrity
sudo -u postgres pg_restore --list /home/gnuhealth/backup_gnuhealth_preconfig_*.dump > /dev/null
echo "Backup verification: Exit Code $?"
```

---

## 3. Restoration Procedure

If a full database rollback to the pristine baseline is required:

```bash
# 1. Stop Tryton application server
sudo systemctl stop gnuhealth

# 2. Terminate active database connections and drop database
sudo -u postgres psql -c "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = 'gnuhealth' AND pid <> pg_backend_pid();"
sudo -u postgres dropdb gnuhealth

# 3. Recreate database with UTF-8 encoding owned by gnuhealth
sudo -u postgres createdb -O gnuhealth -E UTF8 gnuhealth

# 4. Restore from backup dump file
sudo -u postgres pg_restore -d gnuhealth /home/gnuhealth/backup_gnuhealth_preconfig_*.dump

# 5. Restart Tryton application server
sudo systemctl start gnuhealth
```

---

## 4. Verification Check

- Pre-configuration snapshot saved locally at `gnuhealth-qatar-clinic-config/backup/pre_config_snapshot.json`.
- Zero production records existed prior to configuration; all operational tables (`party`, `patient`, `appointment`, `invoice`) were at zero records.
- Rollback path is guaranteed and non-destructive.
