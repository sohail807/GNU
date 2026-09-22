# FINAL EVIDENCE MATRIX — GNU HEALTH HMIS 5.0 OUTPATIENT CLINIC
## EMPIRICAL TECHNICAL & GOVERNANCE EVIDENCE LEDGER

**Document Identifier**: `FINAL_EVIDENCE_MATRIX.md`  
**Evaluation Date**: 2026-09-22  
**Target Environment**: `gnuhealth-srv` (Debian 12.15 Bookworm, IP: `34.7.237.8`, GCP: `gnu-health-509307`)  
**Evaluation Standard**: Zero-Trust Empirical Verification Protocol  
**Authoritative Classification**: Master Technical Evidence Matrix  

---

## 1. Evidence Governance & Taxonomy

Every item in this matrix has been verified against the live host, database, network boundary, or application ORM. No item is marked verified based on assumption or documentation alone.

Status Classifications:
* **Verified Technical Fact**: Inspected directly on the live host/operating system/PostgreSQL.
* **Synthetic Test Result**: Verified through controlled simulation/test execution; purged afterward.
* **Technical Configuration**: Configured in backend models; functional capability verified.
* **Business Input**: Required data that must be supplied by clinic leadership.
* **Governance Approval**: Formal executive sign-off required prior to production opening.
* **Blocked Item**: Safely halted pending external dependency.
* **External Dependency**: External third-party or regulatory action outside implementation control.

---

## 2. Authoritative Evidence Matrix

| Area / Control | Claim / State | Verification Command / Source | Timestamp (UTC) | Empirical Result | Classification |
| :--- | :--- | :--- | :---: | :--- | :--- |
| **Operating System** | Debian 12.15 Bookworm | `cat /etc/os-release; uname -a` | 2026-09-22 13:53 | Linux 6.1.0-53-cloud-amd64 x86_64, Debian 12 | Verified Technical Fact |
| **Host Storage** | Root FS has ample free disk | `df -h /` | 2026-09-22 13:53 | 49 GB total, 4.5 GB used (10%), 43 GB available | Verified Technical Fact |
| **Tryton Application**| Trytond 7.0.57 active | `systemctl status gnuhealth.service` | 2026-09-22 13:53 | Active (running), PID 52400, Python 3.11.2 venv | Verified Technical Fact |
| **Service Sandboxing**| Systemd security hardening | `cat /etc/systemd/system/gnuhealth.service` | 2026-09-22 13:38 | `NoNewPrivileges=true`, `PrivateTmp=true`, `ProtectSystem=full` | Verified Technical Fact |
| **Config Permissions**| File mode 0640 | `ls -l /home/gnuhealth/trytond.conf` | 2026-09-22 13:38 | `-rw-r----- 1 gnuhealth gnuhealth` | Verified Technical Fact |
| **Web Proxy / Nginx** | Nginx 1.22.1 reverse proxy | `nginx -t; curl -I http://34.7.237.8/` | 2026-09-22 13:35 | HTTP 200 OK, `server_tokens off`, security headers present | Verified Technical Fact |
| **Perimeter Port 80** | Accessible externally | `Test-NetConnection -Port 80` | 2026-09-22 13:37 | `TcpTestSucceeded : True` | Verified Technical Fact |
| **Perimeter Port 443**| No listener / SSL staged | `Test-NetConnection -Port 443; ss -tulpn` | 2026-09-22 13:37 | `TcpTestSucceeded : False`; no listener on 443 | Blocked Item |
| **Perimeter Port 8000**| Tryton WSGI loopback only | `Test-NetConnection -Port 8000; ss -tulpn` | 2026-09-22 13:37 | `TcpTestSucceeded : False`; bound strictly to `127.0.0.1:8000` | Verified Technical Fact |
| **Perimeter Port 5432**| PostgreSQL loopback only | `Test-NetConnection -Port 5432; ss -tulpn` | 2026-09-22 13:37 | `TcpTestSucceeded : False`; bound strictly to `127.0.0.1:5432` | Verified Technical Fact |
| **SSH Security** | Key-only auth enforced | `sudo sshd -T` | 2026-09-22 13:57 | `passwordauthentication no`, `permitrootlogin no` | Verified Technical Fact |
| **PostgreSQL Listen** | Localhost only | `SHOW listen_addresses;` | 2026-09-22 13:53 | `localhost` | Verified Technical Fact |
| **PostgreSQL HBA** | SCRAM-SHA-256 loopback | `grep -E -v '^(#\|$)' pg_hba.conf` | 2026-09-22 13:53 | Local `peer`, loopback TCP `scram-sha-256`, zero remote TCP | Verified Technical Fact |
| **Database Roles** | `gnuhealth` non-superuser | `\du` in psql | 2026-09-22 13:37 | `gnuhealth` has `Create DB` (non-superuser); `postgres` superuser | Verified Technical Fact |
| **Database Census** | DEMO/UAT operational records | Live SQL census query | 2026-09-22 15:25 | 3 synthetic patients, 8 appointments, 4 evaluations, 4 posted invoices | Verified Technical Fact |
| **Backup Subsystem** | Daily timer at 02:00 UTC | `systemctl status gnuhealth-backup.timer` | 2026-09-22 15:30 | Active (waiting), 0 warnings, trigger Wed 02:00 UTC | Verified Technical Fact |
| **Backup Execution** | Post-implementation snapshot | `sudo /usr/local/bin/gnuhealth-backup.sh` | 2026-09-22 15:30 | `gnuhealth_db_20260922_153056.dump` (7.6 MB), SHA-256 verified | Verified Technical Fact |
| **Restore Drill** | Isolated DB restoration drill | `scripts/verify_isolated_restore.py` | 2026-09-22 15:32 | 306 tables, 3 patients, 4 invoices, 24 GL lines restored; test DB dropped | Synthetic Test Result |
| **Operational Currency**| Qatari Riyal (QAR) active | `SELECT currency FROM company_company;` | 2026-09-22 15:24 | QAR (ID 3, symbol `ر.ق`, 634) assigned to Company 2 (`DEMO HEALTH CLINIC`) | Technical Configuration |
| **Fiscal Year 2026** | 12 monthly periods open | `SELECT * FROM account_fiscalyear;` | 2026-09-22 15:24 | FY2026 (ID 7, state `open`), 12 periods, sequence MV-2026/ | Technical Configuration |
| **RBAC Matrix** | 8 DEMO roles validated | Live ORM access check + 9 negative tests | 2026-09-22 15:25 | 100% pass; 9/9 unauthorized operations denied with `AccessError` | Technical Configuration |
| **Clinical Encounter**| Outpatient lifecycle (x2) | Full lifecycle script execution | 2026-09-22 15:24 | Intake $\rightarrow$ Vitals $\rightarrow$ SOAP $\rightarrow$ Rx $\rightarrow$ Lab $\rightarrow$ CXR $\rightarrow$ Followup | Synthetic Test Result |
| **Financial Workflow** | Balanced GL moves (x2) | SQL query on `account_move` 24–27 | 2026-09-22 15:24 | $\sum \text{Dr} = \sum \text{Cr} = 1,900.00 \text{ QAR}$, Net AR = 0.00 QAR | Synthetic Test Result |
| **Disaster Recovery** | Off-host replication | Cloud backup inspection | 2026-09-22 15:30 | Local verified; off-host replication not configured | Blocked Item |
| **Production TLS** | Valid HTTPS on 443 | `certbot certificates; ss -tulpn` | 2026-09-22 15:30 | 0 certificates; Port 443 no listener | Blocked Item |
| **Clinic Identity** | Commercial Registration | `CLINIC_GO_LIVE_INPUT_TEMPLATE.md` | 2026-09-22 18:00 | Legal trade name, CR, MOPH license pending | Business Input |
| **Medical Staff** | Licensed physicians | `CLINIC_GO_LIVE_INPUT_TEMPLATE.md` | 2026-09-22 18:00 | Licensed doctor roster and MOPH numbers pending | Business Input |
| **Service Tariffs** | Outpatient price list | `SERVICE_TARIFF_SCHEDULE_TEMPLATE.csv` | 2026-09-22 18:00 | Synthetic tariffs active; official schedule pending CFO approval | Governance Approval |
| **Business UAT** | Executive sign-off | `BUSINESS_UAT_SIGNOFF.md` | 2026-09-22 18:00 | 12 test cases documented; executive signing pending | Governance Approval |
| **Release Auth** | Management release | `FINAL_GO_LIVE_GATE.md` | 2026-09-22 18:00 | Final go-live authorization pending | Governance Approval |

---

## 3. Evidence Governance Summary

```text
========================================================================================
FINAL SYSTEM READINESS CLASSIFICATION
========================================================================================

TECHNICAL BACKEND:
PASS — TECHNICALLY READY — DEMO/UAT VERIFIED

TECHNICAL SECURITY:
PASS / CONDITIONAL — Host OS, sandboxing, and loopback sockets verified; SSH global network restriction review pending institutional handover

DATABASE:
PASS — PostgreSQL 15.19 localhost only; 306 public tables; DEMO records verified

BACKUP:
PASS — LOCAL BACKUP VERIFIED (Automated daily 02:00 UTC snapshot active; post-implementation dump verified)

RESTORE:
PASS — ISOLATED RESTORE VERIFIED (Isolated database drill completed in ~10s)

OFF-HOST DISASTER RECOVERY:
NOT VERIFIED (Local backup verified; off-host cloud replication not configured)

NETWORK:
PASS — Application (8000) and database (5432) private ports not externally reachable

HTTPS/TLS:
BLOCKED — OFFICIAL FQDN/CERTIFICATE REQUIRED

RBAC:
PASS — MODEL VALIDATED (8 roles validated; 9 negative security denial tests passed)

PRODUCTION USERS:
BLOCKED — OFFICIAL STAFF DATA REQUIRED

MASTER DATA:
PASS (DEMO/UAT) — Synthetic tariffs configured; official tariff schedule pending CFO approval

ACCOUNTING:
PASS (DEMO/UAT) — QAR FY2026 fully operational; formal CFO adoption pending

BUSINESS UAT:
PENDING — Executive execution of BUSINESS_UAT_SIGNOFF.md pending

EXECUTIVE RELEASE:
PENDING — Board release authorization pending

OVERALL BUSINESS GO-LIVE:
BLOCKED — CLINIC INPUTS REQUIRED

========================================================================================
STATEMENT ON READINESS:
The backend is TECHNICALLY READY — DEMO/UAT VERIFIED. The complete outpatient clinic
transaction lifecycle has been executed and verified end-to-end natively in GNU Health.
Live human patient operations remain safely blocked pending official clinic inputs,
FQDN delegation for TLS, licensed physician rosters, and executive release approval.
========================================================================================
```

---

## 4. DEMO/UAT BACKEND IMPLEMENTATION STATUS

### TECHNICALLY IMPLEMENTED
* Full outpatient clinic master structure configured natively (`DEMO HEALTH CLINIC`, `DEMO-HC`, QAR).
* Full operational user and medical professional profiles provisioned (IDs 146–153).
* Consultation, laboratory, and radiology tariff templates configured in QAR.
* Native Tryton QAR accounting engine, FY2026, and journal sequences operational.

### DEMO/UAT VERIFIED
* 2 complete end-to-end transaction lifecycles executed natively for DEMO PATIENT 001 and 002.
* Customer invoices `INV-2026/00004` and `INV-2026/00005` (475.00 QAR each) posted and fully settled via cash moves.
* General ledger fully balanced ($\sum \text{Debit} = \sum \text{Credit} = 1,900.00 \text{ QAR}$) with zero net AR.
* All 9 negative security access attempts denied with native `AccessError`.
* Native API / JSON-RPC verified across patient, appointment, evaluation, prescription, lab, and invoice models.
* Post-implementation backup and isolated restore drill verified against `gnuhealth_isolated_demo_restore`.

### PRODUCTION INPUT PENDING
* Official clinic legal name, commercial registration (CR), and MOPH facility license (GATE-CLINIC-01).
* Official clinic FQDN and DNS delegation for TLS (GATE-CLINIC-02).
* Licensed medical staff directory and MOPH credentials (GATE-CLINIC-03).
* Operational staff roster (GATE-CLINIC-04).
* Production service tariff schedule approved by CFO (GATE-FIN-01).

### BUSINESS APPROVAL PENDING
* Formal financial adoption of chart of accounts, fiscal year, and payment journals by CFO (GATE-FIN-02).
* Executive and clinical leadership sign-off on Business UAT pack (GATE-UAT-01).
* Final board authorization for live production opening (GATE-EXEC-01).


