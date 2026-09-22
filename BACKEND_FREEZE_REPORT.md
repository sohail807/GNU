# GNU HEALTH HMIS 5.0 / TRYTON 7.0 — BACKEND FREEZE REPORT

**Document ID:** GNU-HEALTH-FREEZE-2026-09-22  
**Effective Date:** 2026-09-22  
**Baseline Git Commit:** `42dfef3d567c9a51321c40d27b46aa1438577bf3`  
**Classification:** **TECHNICALLY READY — DEMO/UAT VERIFIED**  
**Freeze Status:** **BACKEND CODEBASE & CORE CONFIGURATION FROZEN**  

---

## 1. Executive Summary & Freeze Declaration

This Backend Freeze Report establishes the authoritative baseline for the GNU Health HMIS 5.0 / Tryton 7.0 backend deployed on GCP VM `gnuhealth-srv` (`34.7.237.8`). 

The technical backend has passed 100% of end-to-end outpatient workflow validations, General Ledger accounting integrity tests, database hardening checks, and Role-Based Access Control (RBAC) tests.

**THE BACKEND IS HEREBY FROZEN FOR FRONTEND INTEGRATION.**

Frontend engineers must treat the backend as an immutable, authoritative system of record. Under no circumstances should backend code, database schemas, or accounting configurations be altered merely to accommodate frontend convenience.

---

## 2. Freeze Specification Details

### 2.1 Current Git Commit
- **Authoritative Commit Hash:** `42dfef3d567c9a51321c40d27b46aa1438577bf3`
- **Branch:** `master`
- **Repository Cleanliness:** All validation suites, configuration files, and API contracts committed.

### 2.2 Current Database State
- **DBMS:** PostgreSQL 15.19 (Debian 15.19-0+deb12u1)
- **Database Name:** `gnuhealth`
- **Database Size:** 124 MB
- **Public Tables:** Exactly 306 base relational tables in schema `public`
- **Foreign Key Integrity:** 100% intact; 0 broken constraints
- **Orphan Relational Entities:** Exactly 0 orphans across all 12 tested relationships
- **Shadow Tables:** Exactly 0 shadow or custom duplicate tables
- **Connection Role:** Dedicated application user `gnuhealth` (`rolsuper = False` — strictly non-superuser)

### 2.3 Current Service State
All core application and infrastructure services are governed by `systemd`:
- `postgresql.service`: `active (running)` — PostgreSQL database engine
- `gnuhealth.service`: `active (running)` — Tryton WSGI application daemon
- `nginx.service`: `active (running)` — Reverse proxy & TLS gateway
- `gnuhealth-backup.timer`: `active (waiting)` — Automated daily backup scheduler

### 2.4 Current Network Topology & Port Bindings
- **Public Exposure:**
  - Port 80 (HTTP): Bound to `0.0.0.0:80` via Nginx reverse proxy
  - Port 443 (HTTPS): Pre-configured in Nginx; automated TLS binding pending official clinic FQDN
- **Private Loopback Isolation:**
  - Port 8000 (Tryton WSGI): Bound strictly to `127.0.0.1:8000` (external access denied)
  - Port 5432 (PostgreSQL): Bound strictly to `127.0.0.1:5432` and `[::1]:5432` (external access denied)
- **GCP Firewall:** Restricted to Port 22 (SSH) and Port 80/443 (Web). Port 8000 and 5432 are inaccessible from the Internet.

### 2.5 Current RBAC Baseline
- **Administrator Isolation:** Group 1 (`Administration`) is strictly restricted to:
  - User ID 1: `admin`
  - User ID 153: `demo_admin1`
- **Operational Least-Privilege Role Groups:**
  - Front Desk (`demo_frontdesk1`, ID 151): Group 14 (`Health Front Desk`)
  - Nurse (`demo_nurse1`, ID 148): Group 13 (`Health Nurse`)
  - Physician 01 (`demo_dr1`, ID 146): Group 15 (`Health Doctor`)
  - Physician 02 (`demo_dr2`, ID 147): Group 15 (`Health Doctor`)
  - Lab Technician (`demo_lab1`, ID 149): Group 23 (`Health Lab`)
  - Radiology Technician (`demo_rad1`, ID 150): Group 20 (`Health Imaging`)
  - Cashier (`demo_cashier1`, ID 152): Group 6 (`Account`), Group 7 (`Accounting Party`)
- **Credential Storage:** All user accounts possess native `$scrypt$...` salted password hashes. Zero plaintext passwords exist in the database, repository, or configuration.

### 2.6 Current Accounting & Fiscal Configuration
- **Operating Currency:** Qatari Riyal (QAR) — ID 3, Symbol `QAR`, Precision 2
- **Fiscal Year:** Fiscal Year 2026 (ID 2), spanning 2026-01-01 to 2026-12-31 with 12 open monthly periods
- **Key General Ledger Accounts:**
  - 101000: Cash in Hand (Cash Journal ID 3)
  - 110000: Accounts Receivable (Revenue Journal ID 2)
  - 401000: Outpatient Clinical Operating Revenue
- **Financial Balance Status:**
  - Total Debits: **5,700.00 QAR**
  - Total Credits: **5,700.00 QAR**
  - General Ledger Imbalance: **0.00 QAR**
  - Net Customer AR: **0.00 QAR** (all posted test invoices fully settled and reconciled)
- **DEMO/UAT Tariffs (DEMO ONLY — NOT PRODUCTION APPROVED):**
  - Outpatient Medical Evaluation (`OPD-EVAL`): 250.00 QAR
  - Complete Blood Count (`LAB-CBC`): 75.00 QAR
  - Chest X-Ray (`RAD-XR`): 150.00 QAR

### 2.7 Current Backup & Disaster Recovery Baseline
- **Verified Safety Backup Dump:** `/var/backups/gnuhealth/gnuhealth_db_20260922_164053.dump`
  - Size: 7,648,541 bytes (7.3 MB)
  - SHA256: `fc26dde5153f3d361fa3949c03397b1d6b681c0ac41bb3a06291adc543cad5b2`
  - Format: PostgreSQL Custom Archive (`pg_dump -Fc`), 3,052 catalog entries
- **Verified Attachment Archive:** `/var/backups/gnuhealth/gnuhealth_attach_20260922_164053.tar.gz`
  - SHA256: `85cea451eec057fa7e734548ca3ba6d779ed5836a3f9de14b8394575ef0d7d8e`
- **Disaster Recovery Validation Drill:** Restored into isolated database `gnuhealth_isolated_val_restore` in **12 seconds**; verified 306 tables, 5 patients, 10 appointments, 8 evaluations, 6 prescriptions, 6 labs, 6 imaging orders, 6 health services, 6 posted invoices, 12 posted moves, and 6 reconciliations. Cleanly destroyed without touching live data.

### 2.8 Current API Contract
- **Authoritative Contract Document:** `docs/GNU_HEALTH_NATIVE_API_CONTRACT.md`
- **Protocol:** Authenticated JSON-RPC 2.0 over HTTPS.
- **Base Endpoint:** `https://<domain>/gnuhealth/` routed via Nginx.

### 2.9 Known Production Prerequisites (Remaining Business Gates)
The backend is technically verified in DEMO/UAT mode. Production operational go-live remains blocked pending:
1. Clinic Public Domain Name (FQDN) pointed to `34.7.237.8` for automated TLS certificate issuance.
2. Qatar Ministry of Public Health (MoPH) Healthcare Facility License.
3. Official Clinician and Staff Rostering (QIDs, practitioner license numbers, authorized clinic roles).
4. Official Production Chargemaster / Tariffs approved by clinic management.
5. Off-Host Cloud Storage Bucket configured for disaster recovery replication.
6. Executive Business Authorization & Sign-off.

---

## 3. Files and Scripts Frozen from Modification

During the frontend integration phase, the following core files and scripts **MUST NOT BE MODIFIED**:

| File / Path | Reason for Freeze |
|:------------|:------------------|
| `/home/gnuhealth/trytond.conf` | Authoritative Tryton server configuration (DB, security, paths) |
| `/etc/nginx/nginx.conf` | Authoritative reverse proxy, header filtering, and security rules |
| `/etc/nginx/sites-available/gnuhealth` | Reverse proxy routing for Tryton WSGI |
| `BACKEND_FINAL_VALIDATION.md` | Authoritative validation evidence document |
| `final_backend_validation_results.json` | Empirical audit evidence data |
| `scripts/run_final_backend_validation.py` | Validated end-to-end backend test suite |
| `scripts/fix_and_harden_rbac_users.py` | Authoritative user hardening script |
| `scripts/final_backup_and_restore_drill.sh` | Disaster recovery drill suite |
| `scripts/purge_demo_uat_data.py` | Safe ID-based cleanup controller |
| `gnuhealth-qatar-clinic-config/*` | Baseline Qatar clinic master data templates |

---

## 4. Frontend Integration Rules of Engagement

1. **Native JSON-RPC Only:** The frontend must communicate solely through the documented native Tryton JSON-RPC endpoint.
2. **Zero Database Connections:** No direct PostgreSQL drivers (e.g., `pg`, `psycopg2`, `prisma`, `typeorm`) are permitted in the frontend application.
3. **Zero Shadow Models:** All clinical and financial entities are owned and persisted exclusively by GNU Health.
4. **No Logic Duplication:** The frontend presents data and collects user inputs. It does not validate drug doses, compute general ledger debits/credits, or enforce RBAC independent of the backend.
5. **Session Safety:** Frontend must never store permanent credentials. All interactions use authenticated session tokens.
