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
| **Database Census** | 0 operational records | Full 18-table SQL census query | 2026-09-22 13:53 | 0 patients, 0 appointments, 0 evaluations, 0 invoices, 0 moves | Verified Technical Fact |
| **Backup Subsystem** | Daily timer at 02:00 UTC | `systemctl status gnuhealth-backup.timer` | 2026-09-22 13:55 | Active (waiting), 0 warnings, trigger Wed 02:00 UTC | Verified Technical Fact |
| **Backup Execution** | Manual execution success | `/usr/local/bin/gnuhealth-backup.sh` | 2026-09-22 13:55 | Dump generated (7.3 MB), 3,052 catalog entries, SHA-256 valid | Verified Technical Fact |
| **Restore Drill** | Isolated DB restoration | `pg_restore -d gnuhealth_isolated_restore_test` | 2026-09-22 13:56 | Duration ~10s, 306 public tables restored, DB dropped cleanly | Synthetic Test Result |
| **Operational Currency**| Qatari Riyal (QAR) active | `SELECT currency FROM company_company;` | 2026-09-22 13:40 | QAR (ID 3, symbol `ر.ق`, 634) assigned to Company 2 | Technical Configuration |
| **Fiscal Year 2026** | 12 monthly periods open | `SELECT * FROM account_fiscalyear;` | 2026-09-22 13:40 | FY2026 (ID 7, state `open`), 12 periods, sequence MV-2026/ | Technical Configuration |
| **RBAC Matrix** | 6 role profiles validated | Tryton ORM `check_access()` tests | 2026-09-22 12:30 | 0 privilege leakage; UAT accounts uncredentialed | Technical Configuration |
| **Clinical Encounter**| Outpatient lifecycle | Native ORM clinical test suite | 2026-09-22 12:35 | Intake $\rightarrow$ Vitals $\rightarrow$ SOAP $\rightarrow$ CDS $\rightarrow$ Rx $\rightarrow$ Lab $\rightarrow$ Rad | Synthetic Test Result |
| **Financial Workflow** | Balanced GL moves | SQL query on `account_move` 5 & 6 | 2026-09-22 12:35 | $\sum \text{Dr} = \sum \text{Cr} = 500.00 \text{ QAR}$, Net AR = 0.00 QAR | Synthetic Test Result |
| **Disaster Recovery** | Off-host replication | Cloud backup inspection | 2026-09-22 13:55 | Local verified; off-host replication not configured | Blocked Item |
| **Production TLS** | Valid HTTPS on 443 | `certbot certificates; ss -tulpn` | 2026-09-22 13:34 | 0 certificates; Port 443 no listener | Blocked Item |
| **Clinic Identity** | Commercial Registration | `CLINIC_GO_LIVE_INPUT_TEMPLATE.md` | 2026-09-22 17:50 | Legal trade name, CR, MOPH license pending | Business Input |
| **Medical Staff** | Licensed physicians | `CLINIC_GO_LIVE_INPUT_TEMPLATE.md` | 2026-09-22 17:50 | Licensed doctor roster and MOPH numbers pending | Business Input |
| **Service Tariffs** | Outpatient price list | `SERVICE_TARIFF_SCHEDULE_TEMPLATE.csv` | 2026-09-22 17:50 | Consultation and diagnostic prices pending CFO approval | Governance Approval |
| **Business UAT** | Executive sign-off | `BUSINESS_UAT_SIGNOFF.md` | 2026-09-22 17:50 | 12 test cases documented; executive signing pending | Governance Approval |
| **Release Auth** | Management release | `FINAL_GO_LIVE_GATE.md` | 2026-09-22 17:50 | Final go-live authorization pending | Governance Approval |

---

## 3. Evidence Governance Summary

```text
========================================================================================
EVIDENCE VERIFICATION SUMMARY:
========================================================================================

TECHNICAL BACKEND INFRASTRUCTURE:
VERIFIED TECHNICAL FACT (All tested technical components operational)

OPERATIONAL DATABASE STATE:
VERIFIED CLEAN (Exact 0 census preserved across all operational tables)

BACKUP & RESTORE CAPABILITY:
VERIFIED TECHNICAL FACT (Local daily automated backups & isolated restore drill validated)

PRODUCTION TLS & HTTPS:
BLOCKED (Official clinic FQDN required)

CLINIC MASTER DATA & STAFFING:
PENDING CLINIC INPUT (Trade name, CR, MOPH license, doctor roster)

TARIFF & FISCAL YEAR APPROVAL:
PENDING GOVERNANCE APPROVAL (CFO approval required)

OVERALL GO-LIVE STATUS:
BLOCKED — REQUIRED CLINIC INPUTS / APPROVALS PENDING
========================================================================================
```
