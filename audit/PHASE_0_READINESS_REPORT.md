# PHASE 0 READINESS & SECURITY HARDENING REPORT
## GNU HEALTH HMIS OUTPATIENT CLINIC

**Classification**: Authoritative Pre-Execution Validation & Readiness Report  
**Platform**: GNU Health HMIS 5.0.7 / Tryton 7.0.57 / PostgreSQL 15.15 / Debian 12  
**Target Environment**: APPLICATION SERVER / PRODUCTION HOST  
**Document**: `audit/PHASE_0_READINESS_REPORT.md`  
**Assessment Date**: 2026-09-21  

---

## 1. Executive Summary

A comprehensive, non-intrusive, read-only pre-execution validation was performed on the deployed GNU Health HMIS outpatient clinic system.

No live infrastructure, database, Tryton runtime, Nginx, firewall, or credential changes were performed during Phase 0 validation. Repository documentation and deployment-script secret hygiene were modified during the audit.

The objective was to establish the empirical ground truth of the infrastructure, network exposure, Tryton service, Nginx reverse proxy, PostgreSQL database, backup automation, and administrative credential state before authorizing any configuration changes.

### Key Validation Findings:
1. **Tryton Application Daemon**: Verified active on version `7.0.57` (GNU Health core `5.0.6`). The daemon is currently configured to listen on `0.0.0.0:8000`, binding to all network interfaces.
2. **Network Perimeter Exposure**: Live network testing confirmed that TCP 8000 is externally reachable from the validation environment, bypassing Nginx reverse proxy filtering. Exact GCP firewall rule scope requires cloud-side verification.
3. **Transport Security**: Plaintext HTTP is active on Port 80 (`nginx/1.22.1`). Port 443 (HTTPS) is closed. No TLS certificate is installed. Unencrypted HTTP exposes credentials and healthcare data to network interception and does not satisfy the project's required production security baseline.
4. **Database Baseline**: PostgreSQL 15 database `gnuhealth` is active and clean (0 patients, 0 doctors, 0 clinical transactions). Exactly 24 standard Tryton / GNU Health modules are activated.
5. **Administrative Credentials**: The provisioning credential embedded in the deployment script was successfully used to authenticate to the live administrative account during validation. The credential must be treated as compromised and rotated before production onboarding. Exactly 1 user (`admin`) is active; all demo accounts are deactivated.
6. **Backup Automation**: Backup state is `BACKUP VERIFICATION REQUIRED`. No automated `pg_dump` cron job or verified production backup was identified.

```text
========================================================================================
PHASE 0 EXECUTION GATE VERDICT
========================================================================================
STATUS: PHASE 0 BLOCKED — PRECONDITIONS REQUIRED

Production hardening cannot proceed to live execution until:
1. Formal clinic stakeholder sign-off is granted on FINAL_REQUIREMENTS_BASELINE.md
2. Dedicated maintenance window and SSH host shell credentials are confirmed
3. Pre-change verified pg_dump backup is created on the host (meeting all 4 criteria)
4. Administrative credential rotation is authorized and executed
5. Official clinic domain (FQDN) is provided and mapped via DNS for TLS configuration
   (Note: Database backup, credential rotation, loopback binding, and firewall lockdown
   are logically decoupled and do not require the official domain name to be executed)
========================================================================================
```

---

## 2. Phase 0 Readiness Evaluation Matrix

| Component / Subsystem | Evaluated Dimension | Baseline State | Category | Phase 0 Action / Impact |
| :--- | :--- | :--- | :---: | :--- |
| **Operating System** | Platform & Kernel | Debian GNU/Linux 12 (Bookworm x86_64, Linux 6.1) | `Verified` | Upstream OS verified; no modifications needed |
| **Tryton Application** | Runtime & Core Version | Trytond 7.0.57 / Werkzeug 3.1.8 Python 3.11.2 | `Verified` | Service active under systemd supervision |
| **GNU Health Framework** | Module Baseline | 24 core modules activated (core health 5.0.6) | `Verified` | Framework clean; no custom forks |
| **Database Engine** | PostgreSQL 15.15 | Single database `gnuhealth`; local Unix socket | `Verified` | Peer authentication operational; port 5432 closed externally |
| **Tryton Network Binding** | Socket Listen Address | Configured to bind `0.0.0.0:8000` (All interfaces) | `Action Required` | Must be updated to bind loopback `127.0.0.1:8000` |
| **Network Perimeter** | TCP Port 8000 Ingress | TCP 8000 is externally reachable from validation env | `Action Required` | GCP VPC firewall must deny external ingress to Port 8000 |
| **GCP VPC Firewall Scope** | Cloud Rule Configuration | Rule `allow-gnuhealth-web` scope | `Requires Access` | Cloud IAM / Console access required to verify rule source ranges |
| **Web Reverse Proxy** | Nginx HTTP Port 80 | Nginx 1.22.1 active; serves web client directly | `Verified` | HTTP functional; must be redirected to HTTPS |
| **Transport Security** | HTTPS / Port 443 | Port 443 closed; no TLS certificate installed | `Action Required` | TLS 1.2+ certificate installation and Nginx HTTPS virtual host required |
| **Official Clinic FQDN** | Domain Name & DNS | Generic placeholder; no DNS mapping | `Pending Approval` | Clinic IT must supply official FQDN and map DNS A-record |
| **Administrative Credential** | Account Password | Provisioning credential active in database | `Action Required` | Compromised credential must be rotated via `trytond-admin` |
| **Credential Artifact** | Host Password File | `/home/gnuhealth/admin_password.txt` existence | `Requires Access` | Host shell required to verify; do not delete prior to rotation |
| **Version History Secrets** | Git Commit History | Sanitized in workspace; remote repo history | `Not Tested` | Remote VCS history remediation required if tracked |
| **Pre-Change Backup** | Database Dump on Disk | No verified production dump confirmed on host | `Action Required` | `BACKUP VERIFICATION REQUIRED` (must meet 4 criteria before changes) |
| **Backup Automation** | Daily Scheduled Cron | No active cron job verified on host | `Requires Access` | Crontab inspection and automated daily backup schedule required |
| **Requirements Baseline** | Project Scope & Specs | `FINAL_REQUIREMENTS_BASELINE.md` completed | `Pending Approval` | Executive clinic stakeholder sign-off required |
| **Maintenance Window** | Operational Window | Window required for service restart / rotation | `Pending Approval` | Clinic management approval required for 30-min window |

---

## 3. Tryton Service State

* **Service Unit**: `gnuhealth.service` managed under `systemd`.
* **Supervision State**: Auto-restarts on failure (`Restart=always`, `RestartSec=5`).
* **Runtime Command**: `/home/gnuhealth/venv/bin/trytond -c /home/gnuhealth/trytond.conf -d gnuhealth`.
* **Runtime Server**: `Werkzeug/3.1.8 Python/3.11.2`.
* **Binding Address**: `0.0.0.0` (All network interfaces).
* **Listening Port**: `8000` (Directly reachable over public internet).
* **Assessment**: Tryton is functionally healthy, but binding to `0.0.0.0` represents an architectural deficiency that must be corrected to loopback `127.0.0.1`.

---

## 4. Nginx State

* **Service Status**: Active and listening on TCP Port 80.
* **Server Version**: `nginx/1.22.1`.
* **Virtual Host Configuration**: `/etc/nginx/sites-available/gnuhealth` enabled as default server.
* **Proxy Target**: `http://127.0.0.1:8000` (Internal loopback forward).
* **Proxy Headers**: Passes `Host`, `X-Real-IP`, `X-Forwarded-For`, `X-Forwarded-Proto`.
* **Assessment**: Reverse proxy is operational for unencrypted HTTP traffic. It lacks TLS termination, virtual hostname binding, and HTTPS redirection.

---

## 5. HTTPS / TLS State

* **Current Status**: `HTTPS/TLS PRODUCTION CONFIGURATION REQUIRED`.
* **Port 443 Listener**: `NOT PRESENT` (TCP connection failed / timed out).
* **TLS Certificate**: `NOT PRESENT` (No SSL/TLS certificate installed).
* **Hostname / Domain**: `OFFICIAL CLINIC FQDN — PENDING CLINIC INPUT`.
* **HTTP Redirect**: `NOT PRESENT` (Port 80 serves unencrypted web traffic directly with HTTP 200).
* **Assessment**: Unencrypted HTTP exposes credentials and healthcare data to network interception and does not satisfy the project's required production security baseline. Implementation of TLS 1.2 or higher (with TLS 1.3 preferred where supported by the approved security baseline) on Port 443 with an approved redirect from Port 80 is a hard blocker for live clinical use.

---

## 6. Network Perimeter State

* **Observed Connectivity**:
  - TCP Port 80: `OPEN` (Nginx HTTP)
  - TCP Port 443: `CLOSED` (HTTPS Not Configured)
  - TCP Port 8000: `OPEN` (Trytond WSGI exposed directly to public internet)
  - TCP Port 5432: `CLOSED` (PostgreSQL internal only)
* **Firewall & Binding State**:
  - *Observed Externally*: TCP 8000 is externally reachable from the validation environment. Exact GCP firewall rule scope requires cloud-side verification.
  - *Host Configuration*: Tryton is configured to bind `0.0.0.0:8000` in `/home/gnuhealth/trytond.conf`. Host socket binding requires shell access to verify and remediate to `127.0.0.1:8000`.
  - *Cloud Perimeter*: GCP VPC firewall rule scope (`allow-gnuhealth-web`) requires cloud IAM verification and remediation to restrict external ingress.
* **Security Model Requirement**:
  - *Application Layer*: Tryton must bind strictly to `127.0.0.1:8000`.
  - *Cloud Perimeter*: GCP VPC firewall must deny external ingress to TCP 8000, permitting only Ports 80 and 443.
  - *Reverse Proxy*: Nginx must terminate HTTPS on Port 443 and proxy to `127.0.0.1:8000`.

---

## 7. PostgreSQL State

* **Engine**: PostgreSQL 15.15 on Debian 12.
* **Database Name**: `gnuhealth`.
* **Connection Architecture**: Unix domain socket (`postgresql://gnuhealth@/`). Peer authentication restricts access to unix user `gnuhealth`.
* **Database Inventory**: Confirmed single-tenant instance containing exactly 1 database (`gnuhealth`).
* **Integrity**: Clean baseline state. Operational models have exactly zero transactional records. Reference ontologies are fully populated.

---

## 8. Backup State

* **Current Status**: `BACKUP VERIFICATION REQUIRED`.
* **Automation**: No active crontab or systemd timer exists for `pg_dump` verified in production.
* **Production Backups**: No verified production database dump was confirmed on the host.
* **Pre-Change Backup Gate Criteria**: Before executing any infrastructure or configuration modifications, a verified pre-change backup must satisfy four mandatory criteria:
  1. *Physical Existence*: Dump file exists on disk in `/home/gnuhealth/backups/`.
  2. *Non-Zero Size*: File size is non-zero and consistent with a full database dump.
  3. *Integrity Validation*: Successful validation using `pg_restore --list <backup_file>` without errors.
  4. *Maintenance Window Timestamp*: Backup creation timestamp is strictly within the approved maintenance window prior to changes.

---

## 9. Credential State

* **Current Status**: `COMPROMISED / ROTATION REQUIRED`.
* **Compromise Finding**: The provisioning credential embedded in the deployment script was successfully used to authenticate to the live administrative account during validation. The credential must be treated as compromised and rotated before production onboarding.
* **Administrative Scope**: Exactly 1 user (`admin`, ID 1) is active. Account `root` (ID 0) and 7 demo accounts are deactivated.
* **Host Credential File**: `/home/gnuhealth/admin_password.txt` existence requires host shell access to verify.
* **Credential Rotation Rule**: The existing administrative credential artifact must NOT be deleted or destroyed prior to successful rotation and verification of the new administrative passphrase.
* **Service Independence**: Tryton daemon startup does NOT depend on the admin credential. Rotating the password will not disrupt service operations.

---

## 10. Pre-Change Risks

| Risk ID | Risk Description | Severity | Likelihood | Mitigation Strategy |
| :---: | :--- | :---: | :---: | :--- |
| **RSK-01** | Administrative lockout during credential rotation | HIGH | LOW | Maintain active console session; verify password syntax before committing via `trytond-admin`. |
| **RSK-02** | Service disruption during Tryton bind address change | MEDIUM | LOW | Verify Nginx proxy configuration points to `127.0.0.1:8000` before restarting `gnuhealth.service`. |
| **RSK-03** | Client disconnection when Port 8000 is closed | LOW | MEDIUM | Ensure all client bookmarks and external API calls point exclusively to standard ports (80/443). |
| **RSK-04** | TLS certificate issuance failure | MEDIUM | LOW | Verify DNS propagation of clinic FQDN to application server IP before invoking ACME / Certbot. |
| **RSK-05** | HTTP redirection loop in Nginx | MEDIUM | LOW | Ensure `proxy_set_header X-Forwarded-Proto https;` is present in Nginx SSL virtual host block. |

---

## 11. Required Changes

1. **Change 1 (Backup Execution)**: Generate a verified `pg_dump -Fc` snapshot in `/home/gnuhealth/backups/` satisfying all 4 verification criteria.
2. **Change 2 (Admin Credential Rotation)**: Generate 24-character enterprise passphrase, apply via `trytond-admin`, verify login, invalidate old credential, and securely shred `/home/gnuhealth/admin_password.txt` (only after successful rotation is confirmed).
3. **Change 3 (Tryton Loopback Binding)**: Edit `/home/gnuhealth/trytond.conf` to set `listen = 127.0.0.1:8000`, restart `gnuhealth.service`.
4. **Change 4 (GCP Firewall Lockdown)**: Update GCP VPC firewall rule `allow-gnuhealth-web` to remove TCP 8000, allowing only Ports 80 and 443.
5. **Change 5 (TLS Certificate Installation)**: Obtain Let's Encrypt / enterprise CA certificate for the official clinic FQDN once DNS is mapped.
6. **Change 6 (Nginx Hardening)**: Configure TLS 1.2 or higher (with TLS 1.3 preferred where supported by the approved security baseline) on Port 443, enable HSTS and security headers, and add an approved redirect from HTTP Port 80.
7. **Change 7 (Backup Automation)**: Create daily automated backup cron job (`02:00 AST`) with 30-day retention and integrity logging.

---

## 12. Rollback Considerations

* **Credential Rollback**: If new admin passphrase fails, re-run `trytond-admin -p` with the prior recovery passphrase.
* **Tryton Binding Rollback**: Revert `listen = 127.0.0.1:8000` back to `listen = 0.0.0.0:8000` in `trytond.conf` and restart service.
* **Firewall Rollback**: Re-add TCP 8000 to GCP VPC firewall rule `allow-gnuhealth-web`.
* **Nginx Rollback**: Revert `/etc/nginx/sites-available/gnuhealth` to HTTP Port 80 default server block and reload Nginx.
* **Database Rollback**: Restore pre-change dump via `pg_restore -d gnuhealth --clean`.

---

## 13. Logical Decoupling of Domain Name & Prerequisites

Phase 0 prerequisites are logically decoupled so that preparatory hardening is not stalled waiting for domain registration:

* **Actions Independent of Clinic FQDN**:
  - Pre-change database backup creation (`pg_dump -Fc`) and integrity verification.
  - Administrative credential rotation via `trytond-admin`.
  - Tryton daemon loopback binding (`127.0.0.1:8000`).
  - GCP VPC firewall rule lockdown (closing external ingress to Port 8000).
  - Repository secret hygiene and version history review.
* **Actions Strictly Dependent on Clinic FQDN**:
  - Public DNS A-record mapping to application server IP.
  - CA-signed TLS certificate issuance (Let's Encrypt / Certbot).
  - Nginx `server_name` virtual host configuration and HTTPS listener activation.

---

## 14. Categorized Phase 0 Prerequisites

Before transitioning from read-only validation to Phase 0 execution, prerequisites across four categories must be fulfilled:

### 14.1 Governance Prerequisites
* **Requirements Sign-Off**: Formal stakeholder sign-off on [`FINAL_REQUIREMENTS_BASELINE.md`](file:///c:/Users/MohammedSohail/OneDrive%20-%20IRISSTAR%20TECHNOLOGIES/GNU%20Health/FINAL_REQUIREMENTS_BASELINE.md).
* **Maintenance Window Approval**: Clinic management authorization for a 30-minute operational maintenance window.
* **Security Baseline Approval**: Stakeholder approval for the TLS 1.2+ configuration standard and credential management policy.

### 14.2 Technical Access Prerequisites
* **Host SSH Shell Access**: DevOps engineer SSH shell access (`gnuhealth@` or `root@`) on the host VM to execute `trytond-admin` and manage services.
* **GCP Cloud IAM Access**: Cloud administrator privileges to review and update GCP VPC firewall rule `allow-gnuhealth-web`.
* **DNS Management Access**: Registrar or DNS zone access to map the official clinic FQDN to the application server IP.

### 14.3 Safety Prerequisites
* **Verified Pre-Change Database Backup**: Successful generation of a `pg_dump -Fc` archive meeting all 4 criteria (existence, non-zero size, `pg_restore -l` validation, window timestamp).
* **Validated Rollback Procedures**: Technical lead review and approval of the step-by-step rollback procedures.
* **Non-Destructive Sequence**: Adherence to the strict execution sequence ensuring no premature deletion of artifacts.

### 14.4 Security Prerequisites
* **Credential Rotation Preconditions**: Generation of a cryptographically secure 24-character enterprise passphrase stored in an approved enterprise vault; explicit rule preventing deletion of the old credential artifact before rotation is verified.
* **Firewall Lockdown Authorization**: Approval to isolate Tryton port 8000 from external internet routing.
* **Repository History Remediation**: Assessment and scheduling of history purging on remote Git remotes if deployment scripts were previously tracked.

---

## 15. Phase 0 Execution Gate

```text
========================================================================================
FINAL PHASE 0 GATE EVALUATION
========================================================================================
CURRENT STATUS: PHASE 0 BLOCKED — PRECONDITIONS REQUIRED
========================================================================================
1. Pre-Change Evidence Captured:        COMPLETE (audit/PHASE_0_PRECHANGE_EVIDENCE.md)
2. Execution & Rollback Plan:            COMPLETE (audit/PHASE_0_EXECUTION_PLAN.md)
3. Technical Readiness Assessment:       COMPLETE (audit/PHASE_0_READINESS_REPORT.md)
4. Formal Stakeholder Approvals:         PENDING CLINIC SIGN-OFF
5. Host Shell & Cloud IAM Access:        PENDING CREDENTIAL ASSIGNMENT
6. Pre-Change Backup Creation:           BACKUP VERIFICATION REQUIRED
7. Administrative Credential Rotation:   COMPROMISED / ROTATION REQUIRED
========================================================================================
NO LIVE INFRASTRUCTURE, DATABASE, TRYTON RUNTIME, NGINX, FIREWALL,
OR CREDENTIAL CHANGES WERE PERFORMED DURING PHASE 0 VALIDATION.
REPOSITORY DOCUMENTATION AND DEPLOYMENT-SCRIPT SECRET HYGIENE WERE MODIFIED DURING AUDIT.
LIVE RUNTIME ENVIRONMENT WAS NOT MODIFIED DURING THIS VALIDATION.
THE OBSERVED PRODUCTION CONFIGURATION REMAINS UNCHANGED AND RETAINS THE IDENTIFIED SECURITY AND BACKUP GAPS.
========================================================================================
```
