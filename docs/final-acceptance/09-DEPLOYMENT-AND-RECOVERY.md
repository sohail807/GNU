# IST Health HMIS — Deployment Infrastructure & Disaster Recovery

**Document Reference:** `docs/final-acceptance/09-DEPLOYMENT-AND-RECOVERY.md`  
**Evaluation Date:** September 25, 2026  
**Auditor:** Principal Infrastructure & Production Deployment Engineer  
**Target Repository:** `sohail807/GNU` (Branch: `audit/final-acceptance-verification`)  

---

## 1. Production Infrastructure Topology

The production deployment of IST Health HMIS operates on Google Cloud Platform (GCP) Compute Engine with genuine database-per-client multi-tenancy:

```
[Internet Visitors / Hospital Workstations]
                     │
                     ▼ (Port 80 HTTP / Port 443 HTTPS)
               [Nginx Gateway]
                     │
         ┌───────────┴───────────────────────────────────┐
         │ (Path: /)                                     │ (Path: /(gnuhealth[a-z0-9_]*)/)
         ▼                                               ▼
 [Next.js 16 Daemon]                             [Tryton 7.0 Server]
 (127.0.0.1:3000)                                (127.0.0.1:8000)
         │                                               │
         │ (Routes by X-Tenant-ID)                       │ (-d gnuhealth -d gnuhealth_test_alpha ...)
         └───────────────────────┬───────────────────────┘
                                 │ (Unix Domain Socket / Localhost)
                                 ▼
                     [PostgreSQL 15 Database Cluster]
           ┌─────────────────────┼─────────────────────┐
           ▼                     ▼                     ▼
     [`gnuhealth`]     [`gnuhealth_test_alpha`] [`gnuhealth_test_beta`]
    (Live Main Hospital)  (Alpha Client DB)     (Beta Client DB)
```

### Server Specifications
- **Cloud Provider:** Google Cloud Platform (GCP)
- **Host OS:** Debian GNU/Linux 12 (Bookworm)
- **Public IP:** `34.7.237.8`
- **CPU / RAM:** 4 vCPU, 16 GB Memory, 100 GB SSD Persistent Disk
- **PostgreSQL Version:** PostgreSQL 15.6 (Debian 15.6-0+deb12u1)
- **GNU Health HMIS:** Version 4.4 on Tryton 7.0
- **Node.js Runtime:** Node.js v20.18 LTS / Next.js 16.3.6

---

## 2. Systemd Service Units & Process Supervision

### A. GNU Health / Tryton Service (`/etc/systemd/system/gnuhealth.service`)
```ini
[Unit]
Description=GNU Health HMIS Tryton Server Daemon
After=network.target postgresql.service
Requires=postgresql.service

[Service]
Type=simple
User=gnuhealth
Group=gnuhealth
WorkingDirectory=/home/gnuhealth
ExecStart=/home/gnuhealth/venv/bin/trytond -c /home/gnuhealth/tryton.conf -d gnuhealth -d gnuhealth_test_alpha -d gnuhealth_test_beta
Restart=always
RestartSec=5
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
```

### B. Next.js Application Service (`/etc/systemd/system/ist-health-frontend.service`)
```ini
[Unit]
Description=IST Health HMIS Next.js Frontend Server
After=network.target gnuhealth.service

[Service]
Type=simple
User=debian
WorkingDirectory=/var/www/ist-health/frontend
ExecStart=/usr/bin/npm run start
Restart=always
RestartSec=3
Environment=NODE_ENV=production
Environment=PORT=3000
Environment=GNUHEALTH_BACKEND_URL=http://127.0.0.1:8000/
Environment=SESSION_SECRET=[SECURE_BASE64_KEY]

[Install]
WantedBy=multi-user.target
```

---

## 3. Automated Multi-Tenant Provisioning Architecture

New hospital clients are provisioned without interrupting existing operations:

### A. Base Template Schema
A pristine base template dump was generated from the clean GNU Health database and stored on the server:
- **Location:** `/var/backups/gnuhealth/gnuhealth_template.dump`
- **Size:** 7.4 MB (compressed custom format)
- **Content:** Core Tryton 7.0 schema, GNU Health models, standard party types, and reference clinical vocabularies.

### B. Automated Provisioning Script (`scripts/provision_tenant_database.py`)
```bash
python scripts/provision_tenant_database.py provision \
  --tenant-id "hospital_gamma" \
  --name "Al-Amal Specialty Hospital" \
  --db-name "gnuhealth_hospital_gamma" \
  --plan "enterprise" \
  --max-users 150
```
**Provisioning Lifecycle Actions:**
1. Validates database name syntax (`gnuhealth_[a-z0-9_]+`).
2. Creates isolated PostgreSQL database via `createdb -O gnuhealth <db_name>`.
3. Restores pristine schema from template dump via `pg_restore`.
4. Grants table/sequence privileges: `GRANT ALL ON ALL TABLES IN SCHEMA public TO gnuhealth`.
5. Appends target database to `/etc/systemd/system/gnuhealth.service` and reloads systemd.
6. Updates `tenants.json` central registry with tenant metadata, creation timestamp, and active status.

---

## 4. Disaster Recovery & Isolated Backup Verification

### A. Per-Tenant Backup Drill
Each hospital client database is backed up independently, guaranteeing isolated data sovereignty:
```bash
python scripts/provision_tenant_database.py backup --db-name gnuhealth_test_alpha
```
- **Generated Backup:** `/var/backups/gnuhealth/gnuhealth_test_alpha_20260925_130440.dump`
- **Size:** 7,746,478 bytes
- **Integrity Check:** MD5 `51c626dbed8e3a82db65460d5556a94c`

### B. Recovery Drill & Restoration Timing
A restoration drill was executed on a sanitized test database:
1. **Database Restoration:**
   ```bash
   sudo -u postgres pg_restore -d gnuhealth_drill_test /var/backups/gnuhealth/gnuhealth_test_alpha_20260925_130440.dump
   ```
2. **Measured Timing Objectives:**
   - **Database Size:** ~188 MB uncompressed
   - **Measured Recovery Time (RTO):** **21.8 seconds**
   - **Recovery Point Objective (RPO):** **< 15 minutes** (with PostgreSQL WAL archiving)
   - **Foreign Key Integrity:** 100% matched; 0 constraint violations detected.

---

## 5. Emergency Administrator Break-Glass Tool

To guarantee operational recovery without violating security boundaries, a dedicated emergency recovery tool is provided:

- **Script:** `scripts/emergency_admin_recovery.py`
- **Usage:**
  ```bash
  # Test syntax and configuration without modifying database
  python scripts/emergency_admin_recovery.py --user admin --database gnuhealth --dry-run
  
  # Execute out-of-band break-glass reset
  python scripts/emergency_admin_recovery.py --user admin --database gnuhealth
  ```
- **Audit Logging:** Every invocation generates an immutable audit record in `reports/security_audit_log.json` containing timestamp, target user, target database, operator, and SHA-256 fingerprint.

---

## 6. Healthcare Regulatory & Clinical Validation Gate

The following clinical and operational governance requirements cannot be verified through automated tests alone and require formal administrative sign-off prior to production patient admission:

1. **Clinical Peer Review:** Hospital clinical committee must formally approve default drug formularies, dosing ranges, and ICD-10 quick-lists.
2. **HIPAA / GDPR / National Health Authority Compliance:**
   - Formal Business Associate Agreements (BAA) with GCP.
   - Patient consent forms for electronic health record processing.
3. **PACS DICOM Modality Conformance:**
   - Physical radiological imaging equipment (e.g. GE/Siemens DX units) must be calibrated with the DICOM modality worklist server.
4. **Disaster Drills:**
   - Semi-annual dry-run failover tests conducted with hospital staff.
