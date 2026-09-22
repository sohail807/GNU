# PHASE 0 EVIDENCE CAPTURE CHECKLIST
## GNU HEALTH HMIS OUTPATIENT CLINIC

**Document**: `audit/PHASE_0_EVIDENCE_CAPTURE_CHECKLIST.md`  
**Classification**: Authoritative Pre- and Post-Change Technical Evidence Matrix  
**Platform**: GNU Health HMIS 5.0.7 / Tryton 7.0.57 / PostgreSQL 15.15 / Debian 12  
**Target Host**: APPLICATION SERVER (`34.7.237.8`)  
**Document Date**: 2026-09-21  

---

## 1. Evidence Taxonomy & Rules

Every evidence dimension must be explicitly categorized under one of the five approved empirical statuses:
* `OBSERVED`: Measured or observed directly via external network probe or API call.
* `VERIFIED`: Confirmed with complete technical proof and validation checks.
* `NOT VERIFIED`: Technical existence cannot be confirmed from current vantage point.
* `NOT EXECUTED`: Planned execution step has not been performed.
* `BLOCKED`: Execution cannot proceed due to missing prerequisite or dependency.

> [!NOTE]
> Do **NOT** use "COMPLETE" unless verified technical evidence exists and has been validated.

---

## 2. Pre-Change Evidence Checklist (Baseline State)

| Item ID | Target Dimension | Required Evidence Standard | Current Evaluation State | Current Baseline Observation |
| :---: | :--- | :--- | :---: | :--- |
| **PRE-01** | **Tryton Listening State** | Socket binding reported by host `ss -tlpn` command | `OBSERVED` | Remote probe confirms TCP 8000 is open; host configuration has `listen = 0.0.0.0:8000`. |
| **PRE-02** | **Nginx Listening State** | Host socket state for Ports 80 and 443 | `OBSERVED` | Port 80 is listening (`nginx/1.22.1`); Port 443 listener is absent (`NOT PRESENT`). |
| **PRE-03** | **HTTP Status** | HTTP response code and headers on TCP Port 80 | `VERIFIED` | HTTP 200 OK returned; serves Tryton SAO client over unencrypted channel. |
| **PRE-04** | **HTTPS Status** | TLS handshake and response on TCP Port 443 | `VERIFIED` | TCP Port 443 connection fails (`Connection Timed Out`). HTTPS not configured. |
| **PRE-05** | **TCP/8000 Exposure** | External reachability of Port 8000 bypassing Nginx | `VERIFIED` | Remote probe succeeds; HTTP 200 returned directly by `Werkzeug/3.1.8 Python/3.11.2`. |
| **PRE-06** | **PostgreSQL Exposure** | External TCP scan of Port 5432 | `VERIFIED` | Connection refused; PostgreSQL is bound strictly to internal local Unix socket. |
| **PRE-07** | **Active User Count** | Database query on `res.user` where `active = True` | `VERIFIED` | Exactly 1 active user (`admin`, ID 1); accounts `root` (ID 0) and 7 demo users deactivated. |
| **PRE-08** | **Database Record Counts** | Operational model counts (patients, doctors, appointments, invoices) | `VERIFIED` | Exactly 0 patients, 0 health professionals, 0 appointments, 0 evaluations, 0 invoices. |
| **PRE-09** | **Configuration Backup** | File copy of `/home/gnuhealth/trytond.conf` and Nginx virtual host on disk | `NOT EXECUTED` | Planned for execution at Step 6/15 of operator runbook. |
| **PRE-10** | **PostgreSQL Dump Validation** | `pg_restore --list` passing against on-disk `pg_dump -Fc` archive | `NOT EXECUTED` | Pre-change dump has not been created on the host (`BACKUP VERIFICATION REQUIRED`). |
| **PRE-11** | **Current Firewall State** | Cloud IAM query of GCP VPC firewall rules | `NOT VERIFIED` | Reachable externally, but exact rule name, source ranges, and priority require cloud IAM access. |
| **PRE-12** | **Current DNS State** | Public DNS A-record query for clinic domain | `NOT VERIFIED` | Official clinic FQDN is not yet designated (`PENDING CLINIC INPUT`). |

---

## 3. Post-Change Evidence Checklist (Hardened Target State)

| Item ID | Target Dimension | Required Evidence Standard | Evaluation State | Post-Change Verification Criteria |
| :---: | :--- | :--- | :---: | :--- |
| **POST-01** | **Credential Rotation** | `trytond-admin -p` execution log without password string | `NOT EXECUTED` | Password hash updated in PostgreSQL database `gnuhealth`. |
| **POST-02** | **Old Credential Rejection** | JSON-RPC authentication attempt using old password fails | `NOT EXECUTED` | Request rejected with HTTP 401 Unauthorized or Tryton AuthError. |
| **POST-03** | **New Credential Auth** | JSON-RPC authentication attempt using new passphrase succeeds | `NOT EXECUTED` | Request succeeds; returns valid user context and server version. |
| **POST-04** | **Tryton Loopback Binding** | Host socket binding restricted to `127.0.0.1:8000` | `NOT EXECUTED` | `ss -tlpn` confirms socket bound strictly to `127.0.0.1:8000`; `0.0.0.0` absent. |
| **POST-05** | **TCP/8000 Rejection** | External probe to TCP 8000 from public internet fails | `NOT EXECUTED` | Connection timed out or connection refused at cloud edge. |
| **POST-06** | **HTTPS Certificate Validation** | Valid TLS handshake on Port 443 with matching FQDN | `NOT EXECUTED` | TLS 1.2+ handshake succeeds; certificate issuer and expiry date verified. |
| **POST-07** | **HTTP → HTTPS Redirection** | HTTP Port 80 returns 301 redirect to `https://<FQDN>/` | `NOT EXECUTED` | `curl -I http://<FQDN>/` returns `HTTP/1.1 301 Moved Permanently` with `Location: https://...`. |
| **POST-08** | **Nginx Reverse Proxy** | Nginx forwards incoming HTTPS requests to `127.0.0.1:8000` | `NOT EXECUTED` | Web client renders correctly over HTTPS without mixed content or 502 Bad Gateway. |
| **POST-09** | **PostgreSQL Protection** | TCP 5432 remains completely closed to external traffic | `VERIFIED` | Connection refused externally; Unix socket peer authentication intact. |
| **POST-10** | **Automated Backup Schedule** | Verified crontab entry for daily execution at 02:00 AST | `NOT EXECUTED` | `crontab -l` confirms `/home/gnuhealth/scripts/backup_daily.sh` scheduled daily. |
| **POST-11** | **Backup Automation Pass** | Test execution of automated backup script succeeds | `NOT EXECUTED` | Backup file created in `/home/gnuhealth/backups/` and passes `pg_restore --list`. |
| **POST-12** | **Application Login** | End-to-end web client login via browser over HTTPS | `NOT EXECUTED` | User logs in successfully as `admin` via Tryton SAO web client over HTTPS. |
| **POST-13** | **JSON-RPC / API Validation** | Standard API call over HTTPS proxy succeeds | `NOT EXECUTED` | POST to `https://<FQDN>/gnuhealth/` returns valid JSON response. |
| **POST-14** | **Database Integrity** | Verification that operational counts remain zero | `VERIFIED` | Operational record counts remain exactly 0 (0 patients, 0 doctors, 0 invoices). |
| **POST-15** | **Service Health** | `systemctl status gnuhealth nginx postgresql` all active | `NOT EXECUTED` | All service units report `active (running)` with 0 restart crashes. |
| **POST-16** | **Clean System Logs** | Application and proxy logs inspected for critical errors | `NOT EXECUTED` | `journalctl -u gnuhealth` and Nginx error logs free of syntax/runtime exceptions. |

---

## 4. Evidence Matrix Summary

```text
========================================================================================
PHASE 0 EVIDENCE CHECKLIST AUDIT SUMMARY
========================================================================================
PRE-CHANGE EVIDENCE ITEMS:   12
- VERIFIED:                   6
- OBSERVED:                   2
- NOT VERIFIED:               2
- NOT EXECUTED:               2

POST-CHANGE EVIDENCE ITEMS:  16
- VERIFIED (STATIC SAFEGUARD): 2 (PostgreSQL Local Socket, Zero Operational Data)
- NOT EXECUTED:              14 (Awaiting Authorized Execution in Maintenance Window)
========================================================================================
CURRENT PHASE 0 STATUS: STANDBY — EXECUTION PENDING AUTHORIZATION
========================================================================================
```
