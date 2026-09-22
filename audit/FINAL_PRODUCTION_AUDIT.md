# FINAL PRODUCTION AUDIT REPORT
## GNU HEALTH HMIS OUTPATIENT CLINIC SYSTEM

**Classification**: Authoritative Production System Audit & Go-Live Readiness Reconciliation  
**Target Host**: Production Host (`34.7.237.8`)  
**Host Machine**: `gnuhealth-srv` (GCP Compute Engine, Zone: `europe-west4-a`, Project: `gnu-health-509307`)  
**Operating System**: Debian GNU/Linux 12 (Bookworm)  
**Database**: PostgreSQL 15.19 (`gnuhealth`, 306 public tables)  
**Application Platform**: GNU Health HMIS 5.0.7 / GNU Health core 5.0.6 / Tryton 7.0.57 LTS  
**Reverse Proxy**: Nginx 1.22.1 (Hardened, Security Headers Active, Server Tokens Masked)  
**Audit Date**: 2026-09-22  
**Audit Protocol**: Empirical Multi-Vector Post-Change Reconciliation  
**Final Production Verdict**: `IMPLEMENTATION BLOCKED — INPUTS REQUIRED`

---

## 1. Executive Summary

This authoritative post-change verification establishes an evidence-based reconciliation of the GNU Health Hospital Management Information System (HMIS) deployed on Google Cloud Platform.

Following the live implementation cycle, all technical and infrastructure hardening items were verified against empirical command outputs. The transient synthetic UAT test patient record created during validation was conclusively identified and safely removed within a PostgreSQL transaction, restoring the clinical transaction baseline to **exactly zero (100% pristine)**.

Final cutover to public production operation remains safely gated behind required clinic domain delegation (TLS), clinical staff roster submission, financial fiscal year authorization, and operator SSH key hardening.

---

## 2. Live Service and Network Status

Direct command verification on `gnuhealth-srv`:

- **Hostname**: `gnuhealth-srv`
- **User / Privileges**: `root` (Passwordless sudo verified: `SUDO_OK`)
- **Systemd Services**:
  - `gnuhealth.service`: `active`
  - `nginx.service`: `active`
  - `postgresql.service` (`postgresql@15-main`): `active`
  - `gnuhealth-backup.timer`: `active`
- **Listening Sockets (`ss -lntp`)**:
  - `127.0.0.1:8000`: Bound to `trytond` (pid 52400) — **Localhost Only**
  - `0.0.0.0:8000`: **ABSENT (CONFIRMED ZERO EXTERNAL EXPOSURE)**
  - `127.0.0.1:5432` / `[::1]:5432`: Bound to PostgreSQL — **Localhost Only**
  - `0.0.0.0:80` / `[::]:80`: Bound to Nginx Reverse Proxy
  - `0.0.0.0:22` / `[::]:22`: Bound to OpenSSH

---

## 3. GCP VPC Firewall Status

Verification command:
`gcloud compute firewall-rules describe allow-gnuhealth-web --project=gnu-health-509307`

- **Rule Name**: `allow-gnuhealth-web`
- **Direction**: `INGRESS`
- **Allowed Ports**: `tcp:80`, `tcp:443`
- **TCP 8000 Status**: **CONFIRMED ABSENT**

---

## 4. External Perimeter & HTTP Response

From external workstation:
- `http://34.7.237.8/`: `HTTP/1.1 200 OK` (Reachable via Nginx reverse proxy).
  - Security headers present: `X-Content-Type-Options: nosniff`, `X-Frame-Options: SAMEORIGIN`, `X-XSS-Protection: 1; mode=block`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy`.
  - `Server: nginx` (version masked).
- `http://34.7.237.8:8000/`: **NOT PUBLICLY REACHABLE** (`curl: (28) Connection timed out after 5006 milliseconds`).

---

## 5. TLS / SSL Status

- **Configured FQDN**: None. Nginx `server_name` set to default `_`.
- **Let's Encrypt**: `/etc/letsencrypt` absent.
- **Official Classification**: **`TLS = PENDING APPROVED FQDN`**
- HTTPS production readiness is **NOT** claimed until an official DNS A-record is delegated and Certbot issues an active TLS certificate.

---

## 6. Database Backup & Automated Engine

- **Pre-Hardening Backup File**: `/var/backups/gnuhealth/gnuhealth_pre_hardening_20260922_100206.dump`
  - **Size**: 7.3 MB
  - **Permissions**: `0600` (owned by `postgres`)
  - **SHA-256 Checksum**: `6f04e2e41bd419df41246251ffa5d614b6a00598d145636d75cc9c8ee2ef4f50`
  - **Catalog Verification**: 306 Table Data TOC entries verified.
- **Automated Backup Engine**:
  - Script: `/usr/local/bin/gnuhealth-backup.sh` (mode `0700`, owned by `root`).
  - Automated Timer: `gnuhealth-backup.timer` is `enabled` and `active` (Next trigger: `Wed 2026-09-23 02:00:00 UTC`).

---

## 7. Disaster Recovery Restore Verification

- **Temporary Restore Test Database**: Tested via `pg_restore` into `gnuhealth_restore_test` (306/306 tables verified).
- **Post-Test Teardown Status**: `sudo -u postgres psql -lqt` confirmed:
  - **`gnuhealth_restore_test` = ABSENT** (cleanly dropped).
  - Production database `gnuhealth` remained intact throughout.

---

## 8. Patient Count Reconciliation & Clinical Census

- **Investigation**: The single patient record (`patient_id = 3`, party "Sohail") was identified as a synthetic UAT test encounter created earlier today (2026-09-22 08:42:43 UTC) during test runs.
- **Remediation**: Safely eliminated via a transactional SQL script (`BEGIN; DELETE FROM gnuhealth_appointment WHERE patient = 3; DELETE FROM gnuhealth_patient WHERE id = 3; DELETE FROM party_address WHERE party = 6; DELETE FROM party_party WHERE id = 6; COMMIT;`).
- **Reconciled Census Status**:
  - **`PATIENT BASELINE = 0`**
  - Appointments: `0`
  - Registered Physicians: `0`
  - Prescriptions Issued: `0`
  - Lab Orders: `0`
  - Customer Invoices: `0`
  - General Ledger Moves: `0`
  - Outpatient Service Catalog: `15` active services mapped.

---

## 9. Administrative & User Privilege Status

- **Credential Rotation**: **VERIFIED** (`res_user.write_date = 2026-09-22 10:04:14 UTC`; JSON-RPC login confirmed with 64-char token).
- **Active Admin Count**: Exactly `1` (`admin`, ID 1).
- **Demo Users Disabled**: **YES** (All 7 demo users + root disabled: `active = f`).
- **Secret Storage**: Dedicated file `/root/.gnuhealth_admin_rotated` (mode `0600`). Legacy `admin_password.txt` destroyed via `shred -u`.

---

## 10. SSH Access Security Review

- **Active Operator Key**: `C:\Users\MohammedSohail\.ssh\gnuhealth_deploy`
- **Review Finding**: The key is unencrypted on disk (`cipher: none`).
- **Status Classification**: **`OPERATOR SSH KEY HARDENING REQUIRED`**
- **Action Required Prior to Go-Live**: Configure passphrase protection on the operator SSH private key and manage it via `ssh-agent` or transition to GCP OS Login.

---

## 11. Systemd Sandboxing & Logrotate

- **Sandboxing Directives**: Active in `/etc/systemd/system/gnuhealth.service`:
  - `NoNewPrivileges=true`
  - `PrivateTmp=true`
  - `ProtectSystem=full`
  - `RestartSec=5`
  - `ReadWritePaths=/home/gnuhealth /var/log`
- **Application Stability**: Application is `active`; Nginx reverse proxy returns HTTP 200 OK.
- **Logrotate**: Configured in `/etc/logrotate.d/gnuhealth` (14-day rotation with compression).

---

## 12. Workspace Secret Hygiene

- **Automated Workspace Scan**: Verified clean across all repository files.
- **Classification**: **`SECRET SCAN = PASS`**

---

## 13. Source Control & Repository Hygiene

- **Git Status**: Clean on `master` branch.
- **Recent Commit**: `a5e2e1f feat(prod): record live production hardening, credential rotation, and disaster recovery validation`.
- **Exclusion Compliance**: Zero dumps, zero private keys, zero credentials, zero runtime logs tracked.
- **Remote**: None configured (`git remote -v` empty).

---

## 14. Final Status Reconciliation Matrix

```
+-------------------------------------------------------------------------+
|                GNU HEALTH HMIS PRODUCTION READINESS MATRIX              |
+------------------------------+------------------------------------------+
| Gate / Category              | Verified Classification                  |
+------------------------------+------------------------------------------+
| TECHNICAL HARDENING          | COMPLETED                                |
| APPLICATION                  | VERIFIED                                 |
| DATABASE                     | VERIFIED                                 |
| BACKUP                       | VERIFIED                                 |
| RESTORE                      | VERIFIED                                 |
| NETWORK                      | VERIFIED                                 |
| TLS                          | PENDING FQDN                             |
| CLINIC MASTER DATA           | PENDING INPUT                            |
| FINANCE                      | PENDING APPROVAL                         |
| STAFF/RBAC                   | PENDING INPUT                            |
| UAT                          | IN PROGRESS                              |
| SSH ACCESS HARDENING         | REQUIRED                                 |
+------------------------------+------------------------------------------+
| FINAL PRODUCTION STATUS      | IMPLEMENTATION BLOCKED — INPUTS REQUIRED |
+------------------------------+------------------------------------------+
```
