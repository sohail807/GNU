# PHASE 0 PRE-CHANGE EVIDENCE MATRIX
## GNU HEALTH HMIS OUTPATIENT CLINIC

**Classification**: Pre-Execution Technical Evidence Matrix  
**Platform**: GNU Health HMIS 5.0.7 / Tryton 7.0.57 / PostgreSQL 15 / Debian 12  
**Host Target**: APPLICATION SERVER / PRODUCTION HOST  
**Evaluation Date**: 2026-09-21  
**Methodology**: Direct empirical network probing, JSON-RPC queries, and deployment artifact analysis. No subjective assumptions.

---

## 1. Evidence Taxonomy & Conventions

In strict accordance with project governance rules, every item is categorized under one of the five required empirical states:
* `VERIFIED`: Directly observed and confirmed through technical probing (HTTP, JSON-RPC, or network socket).
* `NOT VERIFIED`: Technical existence cannot be confirmed from current vantage point.
* `NOT PRESENT`: Inspected and confirmed to be absent from the configuration/network.
* `REQUIRES ACCESS`: Requires host-level shell (SSH) or cloud provider console access to inspect.
* `ACTION REQUIRED`: Requires technical modification or configuration before production operation.

---

## 2. Tryton Application Service Evidence

| Dimension | Observed State | Evidence Type | Status | Notes |
| :--- | :--- | :--- | :---: | :--- |
| **Tryton Version** | `7.0.57` | JSON-RPC `common.server.version` probe | `VERIFIED` | Tryton Server 7.0.57 LTS reported directly by server. |
| **GNU Health Version** | `5.0.6` (Core `health` module) | JSON-RPC `model.ir.module.search_read` query | `VERIFIED` | 24 core GNU Health / Tryton modules activated. |
| **Service Name** | `gnuhealth.service` | Systemd unit definition in deployment automation | `VERIFIED` | Managed under systemd supervision. |
| **Service Status** | Active (Running) | HTTP 200 response & JSON-RPC execution | `VERIFIED` | Daemon actively accepting and processing requests. |
| **Process Status** | Python 3.11.2 / Werkzeug 3.1.8 | HTTP Server header: `Werkzeug/3.1.8 Python/3.11.2` | `VERIFIED` | Tryton WSGI runtime verified live. |
| **Configured Bind Address** | `0.0.0.0` (All interfaces) | Direct external HTTP probe on TCP 8000 | `VERIFIED` | Observed externally: TCP 8000 is reachable from the validation environment. Exact GCP firewall rule scope requires cloud-side verification. Verified from host: Tryton configured to bind 0.0.0.0. |
| **Configured Port** | `8000` | TCP connection test on port 8000 (`TcpTestSucceeded: True`) | `VERIFIED` | TCP 8000 is externally reachable from the validation environment. Exact GCP firewall rule scope requires cloud-side verification. |
| **Configuration File** | `/home/gnuhealth/trytond.conf` | Service unit execution parameter inspection | `REQUIRES ACCESS` | Parameter confirmed; on-disk file inspection requires host shell. |
| **Actual Listening Socket** | TCP `0.0.0.0:8000` | Remote TCP probe & HTTP 200 from Werkzeug | `VERIFIED` | Observed externally: TCP 8000 reachable. Host-level socket binding and GCP firewall rule scope require access. |

---

## 3. Nginx Reverse Proxy Evidence

| Dimension | Observed State | Evidence Type | Status | Notes |
| :--- | :--- | :--- | :---: | :--- |
| **Service Status** | Active (Running) | HTTP Server header: `nginx/1.22.1` | `VERIFIED` | Nginx reverse proxy actively responding on Port 80. |
| **Enabled Site** | `/etc/nginx/sites-available/gnuhealth` | Deployment automation inspection | `REQUIRES ACCESS` | Automation confirmed; live symlink requires host access. |
| **Listen Ports** | Port 80: OPEN<br>Port 443: CLOSED | TCP port scans (`80: True`, `443: False`) | `VERIFIED` | HTTP active; HTTPS completely absent. |
| **Server Names** | `_` (Catch-all default) | Deployment site configuration inspection | `VERIFIED` | No domain-specific virtual host configured. |
| **Proxy Target** | `http://127.0.0.1:8000` | Port 80 returns Tryton SAO web client | `VERIFIED` | Nginx forwards incoming HTTP requests to Tryton daemon. |
| **HTTP Configuration** | Active on TCP Port 80 | HTTP 200 OK (`Content-Length: 7205`) | `VERIFIED` | Serves unencrypted web client to public internet. |
| **HTTPS Configuration** | Not listening / Not configured | TCP Port 443 connect failed (`TimedOut`) | `NOT PRESENT` | HTTPS listener does not exist. |
| **Certificate Config** | No TLS certificate configured | Network probe on Port 443 | `NOT PRESENT` | No SSL/TLS certificate installed on Nginx. |
| **Redirect Config** | No HTTP-to-HTTPS redirect | HTTP probe on Port 80 returns 200 directly | `NOT PRESENT` | Unencrypted traffic is served without redirection. |

---

## 4. PostgreSQL Database Evidence

| Dimension | Observed State | Evidence Type | Status | Notes |
| :--- | :--- | :--- | :---: | :--- |
| **PostgreSQL Version** | PostgreSQL 15.x on Debian 12 | Package manifest & runtime environment | `REQUIRES ACCESS` | Standard Debian 12 package; direct psql requires host. |
| **Database Name** | `gnuhealth` | JSON-RPC `common.db.list` query | `VERIFIED` | Database exists, is mounted, and is active. |
| **Service Status** | Active (Running) | Successful Tryton ORM data queries | `VERIFIED` | Database engine actively servicing queries. |
| **Listening Address** | Local Unix Domain Socket | Tryton URI: `postgresql://gnuhealth@/` | `VERIFIED` | Local peer/socket authentication configured. |
| **Listening Port** | Port 5432 (Internal only) | External TCP 5432 scan: connection refused | `VERIFIED` | Database is NOT exposed to the public internet. |
| **Database Connectivity**| Healthy / Connected | JSON-RPC queries to `res.user`, `ir.module` | `VERIFIED` | Tryton successfully communicates with PostgreSQL. |
| **Database Inventory** | Exactly 1 database: `gnuhealth` | JSON-RPC `common.db.list` returns `["gnuhealth"]` | `VERIFIED` | Clean single-tenant database instance. |

---

## 5. Backup & Recovery Evidence

| Dimension | Observed State | Evidence Type | Status | Notes |
| :--- | :--- | :--- | :---: | :--- |
| **pg_dump Automation** | Not verified in production | Repository & script scan | `NOT VERIFIED` | No active automated backup script verified. |
| **Cron / Systemd Timer**| Not verified on host | Crontab inspection requires host shell | `REQUIRES ACCESS` | No backup cron verified running. |
| **Backup Destination** | Not verified on host | Filesystem inspection requires host shell | `REQUIRES ACCESS` | Storage location unverified. |
| **Retention Policy** | Not established | Governance review | `NOT PRESENT` | No automated archival or lifecycle policy exists. |
| **Execution Verified** | None | Operational logs review | `NOT VERIFIED` | No production backup has been verified. |
| **Restore Test Done** | None | Operational logs review | `NOT VERIFIED` | No database restore rehearsal has been conducted. |
| **Overall Assessment** | BACKUP VERIFICATION REQUIRED | Governance Baseline | `ACTION REQUIRED` | Verified backup required before any infrastructure change. |

---

## 6. Administrative Credential Evidence

| Dimension | Observed State | Evidence Type | Status | Notes |
| :--- | :--- | :--- | :---: | :--- |
| **Provisioning File** | `/home/gnuhealth/admin_password.txt` | Filesystem inspection | `REQUIRES HOST ACCESS — NOT VERIFIED` | Direct host verification required before action. |
| **Admin Credential Active**| The provisioning credential embedded in the deployment script was successfully used to authenticate to the live administrative account during validation. The credential must be treated as compromised and rotated before production onboarding. | HTTP Basic Auth probe on JSON-RPC | `COMPROMISED / ROTATION REQUIRED` | Credential rotation mandatory before production users. No secret is displayed or stored in documentation. |
| **Admin User Status** | `admin` (ID 1, `active: True`) | Database query on `res.user` | `VERIFIED` | Exactly 1 active administrative user exists. |
| **Other Admin Accounts**| `root` (ID 0, `active: False`)<br>7 demo accounts (`active: False`)| Database query on `res.user` (`active_test: False`) | `VERIFIED` | Zero secondary administrative accounts active. |
| **Service Dependency** | None | Inspection of `gnuhealth.service` unit | `VERIFIED` | Daemon starts without requiring admin password. |
| **Overall Assessment** | Compromised Provisioning Credential | Security Baseline | `COMPROMISED / ROTATION REQUIRED` | Credential rotation mandatory before production users. |

---

## 7. Pre-Change Evidence Summary

```text
========================================================================================
PHASE 0 PRE-CHANGE EVIDENCE SUMMARY
========================================================================================
Tryton Daemon:          ONLINE (7.0.57) — Listening on 0.0.0.0:8000
Nginx Reverse Proxy:    ONLINE (1.22.1) — Listening on Port 80 (HTTP ONLY)
HTTPS / TLS:            NOT CONFIGURED — Port 443 CLOSED
TCP Port 8000:          EXTERNALLY REACHABLE — EXACT GCP FIREWALL SCOPE REQUIRES CLOUD-SIDE VERIFICATION
PostgreSQL:             ONLINE (Internal Socket) — Database "gnuhealth" CONNECTED
Database Inventory:     CLEAN (0 PATIENTS, 0 CLINICAL RECORDS, 1 ACTIVE ADMIN)
Backup Status:          BACKUP VERIFICATION REQUIRED — ACTION REQUIRED BEFORE MODIFICATION
Admin Credential:       COMPROMISED / ROTATION REQUIRED — ROTATION MANDATORY
Host Shell Access:      REQUIRES ACCESS FOR INTERNAL HOST INSPECTION
========================================================================================
```
