# PHASE 0 EXECUTION & SECURITY HARDENING PLAN
## GNU HEALTH HMIS OUTPATIENT CLINIC

**Classification**: Authoritative Technical Execution & Security Hardening Plan  
**Platform**: GNU Health HMIS 5.0.7 / Tryton 7.0.57 / PostgreSQL 15 / Debian 12  
**Target Environment**: APPLICATION SERVER / PRODUCTION HOST  
**Document**: `audit/PHASE_0_EXECUTION_PLAN.md`  
**Execution Authorization State**: `PENDING FORMAL AUTHORIZATION — READ-ONLY VALIDATION PHASE`  
**Date**: 2026-09-21  

---

## 1. Executive Charter & Authorization Boundary

This plan defines the precise technical sequence required to transition the GNU Health outpatient clinic implementation from its current unhardened baseline to a secure, production-grade infrastructure state.

```text
========================================================================================
EXECUTION AUTHORIZATION GATE
========================================================================================
CURRENT STATUS: EXECUTION PENDING AUTHORIZATION — NO MODIFICATIONS PERMITTED

All activities described in this document require explicit technical and stakeholder 
authorization. Under the current pre-execution validation scope, ZERO live system 
modifications, credential rotations, firewall edits, or configuration changes may be made.
========================================================================================
```

---

## 2. Definitive Pre-Change & Execution Matrix

The following table details every required infrastructure and security change, its observed baseline state, the target configuration, technical risks, rollback mechanisms, and authorization requirements:

| Change | Current State | Target State | Risk | Rollback | Authorization Required |
| :--- | :--- | :--- | :--- | :--- | :---: |
| **Admin credential rotation** | Provisioning credential embedded in deployment script was successfully authenticated to live admin account (`COMPROMISED / ROTATION REQUIRED`) | 24-character enterprise passphrase via `trytond-admin`; initial credential invalidated | Lockout from administrative interface if rotation fails | Revert to previous password via `trytond-admin` using saved recovery key | **YES** |
| **Tryton network binding** | Tryton daemon listening on `0.0.0.0:8000` (All interfaces) | Tryton daemon listening strictly on `127.0.0.1:8000` (Localhost only) | Service disruption if Nginx reverse proxy configuration is misaligned | Revert `listen = 127.0.0.1:8000` back to `listen = 0.0.0.0:8000` in `trytond.conf` and restart `gnuhealth.service` | **YES** |
| **GCP TCP 8000 perimeter** | TCP 8000 is externally reachable from the validation environment. Exact GCP firewall rule scope requires cloud-side verification. | GCP VPC firewall denies external ingress on TCP 8000; only 80 and 443 permitted | External tools bypassing Nginx will lose connectivity | Re-add TCP 8000 to GCP VPC firewall rule `allow-gnuhealth-web` | **YES** |
| **Nginx HTTPS / TLS** | Port 443 closed; HTTP Port 80 unencrypted; no TLS certificate (`HTTPS/TLS PRODUCTION CONFIGURATION REQUIRED`) | Nginx TLS 1.2 or higher listener (with TLS 1.3 preferred where supported by the approved security baseline) on Port 443 with valid CA-signed certificate for clinic FQDN | TLS handshake failures if domain DNS or certificate chain is invalid | Revert Nginx virtual host configuration to HTTP Port 80 only; reload Nginx | **YES** |
| **HTTP-to-HTTPS redirect** | HTTP Port 80 serves web client directly (200 OK) without redirect | HTTP Port 80 permanently redirects (301 Moved Permanently) to HTTPS on Port 443 | Redirection loop if proxy headers (`X-Forwarded-Proto`) are misconfigured | Remove redirect block in Nginx; restore direct proxy on Port 80 | **YES** |
| **Backup automation** | `BACKUP VERIFICATION REQUIRED` (No automated `pg_dump` cron or verified production backup on host) | Automated daily `pg_dump` cron job running at 02:00 AST with 30-day retention and cloud sync | Disk exhaustion if retention purge fails; database lock contention during dump | Disable crontab entry; purge stuck dump files from `/home/gnuhealth/backups/` | **YES** |

---

## 3. Corrected Port 8000 Network & Security Architecture

The architectural model for Port 8000 strictly separates host-level application binding from cloud-level perimeter filtering. Never conflate these layers:

### 3.1 Three Distinct Architectural Layers
* **Layer 1 (Observed externally)**: TCP 8000 is reachable from the validation environment.
* **Layer 2 (Verified from host)**: Actual Tryton daemon socket binding (`listen = 0.0.0.0:8000` in `/home/gnuhealth/trytond.conf`).
* **Layer 3 (Verified from GCP)**: Firewall rule source ranges and target tags/service accounts require cloud-side IAM verification.

### 3.2 Application / Service Layer (Tryton Daemon)
* **Target Architecture**: When Nginx acts as the reverse proxy on the same host VM, Tryton has no operational reason to bind to external interfaces.
* **Configuration Required**: Update `/home/gnuhealth/trytond.conf`:
  ```ini
  [web]
  listen = 127.0.0.1:8000
  root = /home/gnuhealth/sao
  ```
* **Effect**: The Tryton daemon will bind exclusively to loopback interface `127.0.0.1`. Sockets on external interfaces will be closed at the operating system kernel level.

### 3.3 Cloud / Network Perimeter Layer (GCP VPC Firewall)
* **Observed State**: TCP 8000 is externally reachable from the validation environment. Exact GCP firewall rule scope requires cloud-side verification.
* **Target Architecture**: External internet traffic must never reach TCP 8000 directly. Port 8000 must NOT be an intended external application entry point.
* **Configuration Required**: Update GCP VPC firewall rule `allow-gnuhealth-web`:
  - Allowed protocols/ports: `tcp:80, tcp:443` (Remove `tcp:8000`).
* **Effect**: GCP edge routers drop all external packets targeting TCP 8000 before reaching the VM instance.

### 3.4 Target Network Architecture Diagram

```text
Internet
   |
   | HTTPS 443
   v
GCP VPC Firewall
   |
   v
Nginx :443
   |
   | proxy_pass http://127.0.0.1:8000
   v
Tryton :8000
   |
   v
PostgreSQL
```

### 3.5 Target Operational State Specifications
* Nginx is externally accessible on Port 443 with TLS termination.
* HTTP Port 80 is used only for approved redirect / ACME challenge requirements.
* Tryton is bound to loopback (`127.0.0.1:8000`) where operationally appropriate.
* GCP external ingress to Port 8000 is denied.
* PostgreSQL is externally inaccessible (local Unix domain socket).
* Exact network state must be verified post-implementation across all three layers.

---

## 4. HTTPS / TLS Configuration & Validation Plan

### 4.1 Current Technical State
* HTTP listener: `VERIFIED ACTIVE` on Port 80 (`nginx/1.22.1`).
* HTTPS listener: `NOT PRESENT` on Port 443 (`Connection refused / TimedOut`).
* TLS certificate: `NOT PRESENT`.
* Certificate validity / hostname / expiration: `NOT APPLICABLE` (No certificate installed).
* HTTP-to-HTTPS redirect: `NOT PRESENT`.
* FQDN Status: `OFFICIAL CLINIC FQDN — PENDING CLINIC INPUT`.
* Overall Status: `HTTPS/TLS PRODUCTION CONFIGURATION REQUIRED`.

### 4.2 Target Implementation Sequence (Upon FQDN Receipt & Authorization)
1. **Clinic FQDN Mapping**: Clinic IT maps official DNS A-record (e.g. `clinic.domain.qa`) to the VM application server.
2. **ACME / Certbot Installation**:
   ```bash
   sudo apt-get install -y certbot python3-certbot-nginx
   ```
3. **Certificate Issuance**:
   ```bash
   sudo certbot --nginx -d <OFFICIAL_CLINIC_FQDN> --non-interactive --agree-tos -m <ADMIN_EMAIL> --redirect
   ```
4. **Nginx Security Configuration**: Configure TLS 1.2 or higher (with TLS 1.3 preferred where supported by the approved security baseline), strong ciphers, and HTTP Strict Transport Security (HSTS) in `/etc/nginx/sites-available/gnuhealth`:
   ```nginx
   server {
       listen 80;
       listen [::]:80;
       server_name <OFFICIAL_CLINIC_FQDN>;
       return 301 https://$host$request_uri;
   }

   server {
       listen 443 ssl http2;
       listen [::]:443 ssl http2;
       server_name <OFFICIAL_CLINIC_FQDN>;

       ssl_certificate /etc/letsencrypt/live/<OFFICIAL_CLINIC_FQDN>/fullchain.pem;
       ssl_certificate_key /etc/letsencrypt/live/<OFFICIAL_CLINIC_FQDN>/privkey.pem;
       ssl_protocols TLSv1.2 TLSv1.3;
       ssl_ciphers HIGH:!aNULL:!MD5;
       ssl_prefer_server_ciphers on;

       add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
       add_header X-Content-Type-Options nosniff;
       add_header X-Frame-Options SAMEORIGIN;
       add_header X-XSS-Protection "1; mode=block";

       client_max_body_size 50M;

       location / {
           proxy_pass http://127.0.0.1:8000;
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
           proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
           proxy_set_header X-Forwarded-Proto https;
           proxy_read_timeout 300s;
           proxy_connect_timeout 300s;
       }
   }
   ```
5. **Validation**: Verify SSL Labs A+ rating, TLS certificate expiry monitoring, and 301 redirect.

### 4.3 Logical Decoupling of FQDN from Other Phase 0 Actions
Unrelated security and preparation tasks must NOT be blocked waiting for the official domain name. Prerequisites are partitioned logically:

* **Actions that can be prepared without an official FQDN**:
  1. Pre-change database backup creation (`pg_dump -Fc`).
  2. Administrative credential rotation via `trytond-admin`.
  3. Tryton configuration update to bind loopback (`listen = 127.0.0.1:8000`).
  4. GCP VPC firewall rule review and lockdown (denying external ingress to TCP 8000).
  5. Repository secret review and deployment script sanitization.
* **Actions that strictly require the official clinic FQDN**:
  1. Production TLS certificate issuance (Let's Encrypt / CA).
  2. Final Nginx `server_name` virtual host configuration.
  3. Public DNS A-record validation.
  4. Production HTTPS client endpoint verification.

---

## 5. Administrative Credential Rotation Plan

### 5.1 Pre-Rotation Assessment Findings
1. **Is initial provisioning credential still active?**  
   `YES (VERIFIED)`. Authenticated successfully via JSON-RPC basic authentication to user `admin` (ID 1).
2. **Is Tryton admin account accessible?**  
   `YES (VERIFIED)`. Query to `model.res.user.get_preferences` returns valid administrator context.
3. **Does another authorized administrative account exist?**  
   `NO (VERIFIED)`. Account `root` (ID 0) and all demo accounts (`demo_*`) have `active = False`.
4. **Can password rotation be safely performed?**  
   `YES (VERIFIED)`. Tryton provides the native CLI tool `trytond-admin` which updates password hashes in PostgreSQL without requiring running service intervention.
5. **Is the credential stored anywhere else?**  
   - Previously stored in root `finish_setup.sh` and `deployment/finish_setup.sh` (both sanitized in this audit session).
   - Flagged for verification on host at `/home/gnuhealth/admin_password.txt`.
   - Local workspace is not a Git repository; if tracked in remote VCS, history remediation will be required.
6. **Does any running service depend on the credential?**  
   `NO (VERIFIED)`. The systemd service `gnuhealth.service` starts Tryton as unix user `gnuhealth` with database URI `postgresql://gnuhealth@/` (peer socket auth). No service daemon depends on the Tryton user `admin` password.

### 5.2 Authoritative 10-Step Rotation Sequence (Upon Authorization)
```text
CRITICAL GOVERNANCE RULES:
1. Never print, display, or commit credentials into terminal logs, reports, or documentation.
2. Store newly generated credentials exclusively in the clinic's enterprise password manager.
3. Do NOT delete the old credential artifact before successful credential rotation.
```

1. **Establish verified database backup**: Ensure pre-change database dump is verified on host before proceeding.
2. **Confirm administrative access path**: Verify operational connectivity to `trytond-admin` on the host VM.
3. **Rotate the Tryton administrative password**:
   ```bash
   sudo -u gnuhealth TRYTONPASS="<NEW_ENTERPRISE_PASSPHRASE>" /home/gnuhealth/venv/bin/trytond-admin \
       -c /home/gnuhealth/trytond.conf -d gnuhealth -p
   ```
4. **Verify login using the new credential**: Test authenticated JSON-RPC call using the new passphrase.
5. **Verify the old credential no longer authenticates**: Confirm that authentication attempts using the initial provisioning string fail with `401 Unauthorized`.
6. **Identify all plaintext copies of the old credential**: Inspect host filesystem (`/home/gnuhealth/admin_password.txt`) and repository files.
7. **Securely remove plaintext credential artifacts where authorized**:
   ```bash
   shred -u /home/gnuhealth/admin_password.txt
   ```
8. **Review Git / version-history exposure**: Review remote repository commit history and prepare history remediation if tracked.
9. **Confirm no deployment script contains a static production password**: Verify all setup scripts use dynamic generation (`openssl rand -hex 12`) or environment variables.
10. **Record completion without recording the secret**: Document rotation timestamp and operator identity in the audit log.

---

## 6. Pre-Change Database Backup Precondition

### 6.1 Strict Gating Rule & Verification Criteria
```text
========================================================================================
DATABASE PROTECTION PRECONDITION: BACKUP VERIFICATION REQUIRED
========================================================================================
No infrastructure, network, or configuration changes may be executed until an on-host, 
verified PostgreSQL database dump exists in a dedicated backup repository.
========================================================================================
```

A backup is classified as `VERIFIED` **only** when all of the following criteria are satisfied:
1. A database dump has actually been created (`pg_dump -Fc`).
2. The dump file exists at the intended destination directory on disk.
3. The dump can be read and validated (`pg_restore -l` returns table list without errors).
4. Preferably a restore test has been performed on a secondary staging database.

Until these four criteria are empirically verified on the host, the backup status remains `BACKUP VERIFICATION REQUIRED`.

### 6.2 Pre-Execution Backup Procedure (To be executed first upon authorization)
1. **Create Backup Directory**:
   ```bash
   mkdir -p /home/gnuhealth/backups
   chmod 700 /home/gnuhealth/backups
   ```
2. **Execute Full Consistent Database Dump**:
   ```bash
   sudo -u postgres pg_dump -Fc gnuhealth > /home/gnuhealth/backups/gnuhealth_pre_phase0_$(date +%Y%m%d_%H%M%S).dump
   ```
3. **Verify Backup Integrity**:
   ```bash
   sudo -u postgres pg_restore -l /home/gnuhealth/backups/gnuhealth_pre_phase0_*.dump > /dev/null
   echo "BACKUP INTEGRITY VERIFIED"
   ```
4. **Record Metadata**:
   - Timestamp: Recorded at execution
   - Database: `gnuhealth`
   - Format: Custom compressed (`pg_dump -Fc`)
   - Destination: `/home/gnuhealth/backups/`
   - File size: Recorded in audit log
   - Zero credentials exposed in documentation.

---

## 7. Execution Authorization Verdict & Prerequisites

```text
========================================================================================
PHASE 0 EXECUTION GATE VERDICT
========================================================================================
STATUS: PHASE 0 BLOCKED — PRECONDITIONS REQUIRED
========================================================================================
```

Phase 0 execution cannot proceed until the following categorized prerequisites are fulfilled:

### 7.1 Governance Prerequisites
* **Formal requirements sign-off**: Clinic leadership sign-off on `FINAL_REQUIREMENTS_BASELINE.md`.
* **Authorized maintenance window**: Approved 30-minute window for service restarts and credential rotation.
* **Approved production security baseline**: Stakeholder agreement on TLS 1.2+ baseline and cipher suites.

### 7.2 Technical Access Prerequisites
* **Host SSH access**: DevOps shell access (`gnuhealth@` or `root@`) on host VM `gnuhealth-srv`.
* **Required GCP IAM access**: Cloud permissions to update VPC firewall rule `allow-gnuhealth-web`.
* **DNS / FQDN control**: Domain registrar access to bind official clinic FQDN to application server IP.
* **Certificate issuance capability**: ACME / Let's Encrypt or enterprise CA issuance pipeline.

### 7.3 Safety Prerequisites
* **Verified pre-change PostgreSQL backup**: Successful execution of `pg_dump -Fc` and `pg_restore -l` verification.
* **Rollback procedure validated**: Rollback runbook reviewed by technical lead.
* **Maintenance window**: Designated operational buffer for unexpected service failure.

### 7.4 Security Prerequisites
* **Credential rotation authorization**: Formal instruction to execute `trytond-admin -p`.
* **Firewall change authorization**: Authorization to deny external TCP ingress on Port 8000.
* **HTTPS / TLS implementation authorization**: Authorization to install Nginx SSL virtual host and redirect Port 80.

