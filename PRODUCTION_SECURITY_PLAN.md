# PRODUCTION SECURITY & INFRASTRUCTURE HARDENING PLAN

**Project**: GNU Health HMIS 5.0 / Tryton 7.0 Implementation  
**Document**: `PRODUCTION_SECURITY_PLAN.md`  
**Classification**: Infrastructure Security & Hardening Specification  
**Scope**: Primary Outpatient & Ambulatory Healthcare Facility (State of Qatar)  
**Status**: MANDATORY PRE-PRODUCTION GATE — CREDENTIAL ROTATION REQUIRED  

---

## 1. Executive Summary & Security Notice

```text
SECURITY REQUIREMENT

HTTPS/TLS, firewall restrictions, credential rotation, access control,
backup protection and audit controls are required project security
controls.

Formal regulatory compliance must be validated against the applicable
clinic, Qatar regulatory and contractual requirements.
```

> [!CAUTION]
> **CRITICAL SECURITY ALERT: CREDENTIAL ROTATION REQUIRED**:  
> The initial administrative provisioning password generated during automated server bootstrapping **MUST BE CONSIDERED COMPROMISED**.  
> Under no circumstances shall that provisioning string be reused, printed in reports, or retained in plaintext files. Administrative credentials must be rotated to a 24-character enterprise passphrase prior to exposing the system to operational users.

Production go-live is strictly gated upon full execution of the 14 security controls detailed herein.

---

## 2. Mandatory Security Implementation Controls

### Control 01: Administrative Credential Rotation (`CREDENTIAL ROTATION REQUIRED`)
```text
Administrative credential rotation required.

No credential value is stored in project documentation.
```
- **Vulnerability**: Initial provisioning password active in `admin_password.txt`.
- **Hardening Action**:
  1. Generate a cryptographically secure 24-character random passphrase.
  2. Execute `trytond-admin -c /home/gnuhealth/trytond.conf -d gnuhealth --password` as the `gnuhealth` system user.
  3. Securely store the new passphrase in the enterprise password manager (e.g. 1Password, Bitwarden).
  4. Permanently delete `/home/gnuhealth/admin_password.txt` via `shred -u`.

### Control 02: Transport Layer Security (TLS 1.3 / HTTPS)
- **Vulnerability**: Web client currently accessible over unencrypted HTTP (Port 80), exposing patient health information (PHI) to packet interception.
- **Hardening Action**:
  1. Issue a valid SSL/TLS certificate (via Let's Encrypt Certbot or corporate CA).
  2. Configure Nginx with modern TLS parameters:
     ```nginx
     ssl_protocols TLSv1.2 TLSv1.3;
     ssl_ciphers 'ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384';
     ssl_prefer_server_ciphers off;
     ssl_session_timeout 1d;
     ssl_session_cache shared:SSL:10m;
     ```
  3. Enforce automatic HTTP (Port 80) to HTTPS (Port 443) permanent redirection (`return 301 https://$host$request_uri;`).

### Control 03: Domain Name Resolution & Binding
- **Hardening Action**:
  - Bind official clinic domain name (e.g. `clinic.health.qa` or `his.alrayyanmedical.qa`) via an authoritative DNS A-record to the APPLICATION SERVER / PRODUCTION HOST.
  - Configure Nginx `server_name` to match the official FQDN.

### Control 04: Reverse Proxy Hardening (Nginx)
- **Hardening Action**:
  - Add security headers to all Nginx HTTP responses:
    ```nginx
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline';" always;
    ```
  - Limit request body size to prevent buffer overflow attacks: `client_max_body_size 25M;`.

### Control 05: GCP VPC Firewall Rule Lockdown
```text
NETWORK SECURITY VALIDATION REQUIRED
```
- **Vulnerability**: TCP Port 8000 (Tryton daemon) is reported reachable from the public internet (`0.0.0.0/0`).
- **Hardening Action**:
  - In GCP VPC Console: Update firewall rule `allow-gnuhealth-web`.
  - Remove `tcp:8000` from public ingress.
  - Retain strictly: `tcp:80` (HTTP redirect) and `tcp:443` (HTTPS secure).
  - Trytond must bind strictly to `127.0.0.1:8000` locally.

### Control 06: Database Access Restriction (PostgreSQL)
- **Hardening Action**:
  - PostgreSQL listens strictly on local Unix domain sockets (`/var/run/postgresql/`).
  - Remote TCP listening on Port 5432 is disabled in `postgresql.conf` (`listen_addresses = 'localhost'`).
  - Access controlled via `pg_hba.conf` using peer or md5 authentication.

### Control 07: Operating System Secrets Protection
- **Hardening Action**:
  - Configuration file `/home/gnuhealth/trytond.conf` must be owned by user `gnuhealth:gnuhealth` with file permissions `chmod 600`.
  - No database passwords or session secrets shall be readable by world or group users.

### Control 08: Automated Daily Backups & Archival
- **Hardening Action**:
  - Automate `backup_gnuhealth.sh` via crontab running every night at 02:00 AST:
    ```bash
    0 2 * * * /home/gnuhealth/backup_gnuhealth.sh >> /var/log/gnuhealth_backup.log 2>&1
    ```
  - Backups stored in `/home/gnuhealth/backups/` with 30-day retention pruning.

### Control 09: Offsite Cloud Replication
- **Hardening Action**:
  - Configure automated synchronization of backup `.sql.gz` files to an isolated GCP Cloud Storage bucket:
    ```bash
    gsutil rsync -d /home/gnuhealth/backups/ gs://gnuhealth-backup-vault-qa/
    ```

### Control 10: System Monitoring & Daemon Watchdog
- **Hardening Action**:
  - Systemd daemon `gnuhealth.service` configured with `Restart=always` and `RestartSec=5s`.
  - Disk utilization alert trigger at 80% capacity via GCP Cloud Monitoring agent.

### Control 11: Application Log Rotation & Hygiene
- **Hardening Action**:
  - Configure `logrotate` for `/var/log/tryton/tryton.log` with daily rotation, compression, and 90-day retention.
  - Verify that no patient medical text or sensitive credentials appear in application logs.

### Control 12: Medical-Legal Audit Trail
- **Hardening Action**:
  - Tryton ORM tracks `create_uid`, `create_date`, `write_uid`, and `write_date` on all clinical and financial models.
  - EHR immutability enforced on `gnuhealth.patient.evaluation` (`perm_delete = False`).

### Control 13: Role-Based Access Enforcement
- **Hardening Action**:
  - Clinical and administrative users segregated into least-privilege groups in accordance with [USER_ROLE_IMPLEMENTATION_PLAN.md](file:///c:/Users/MohammedSohail/OneDrive%20-%20IRISSTAR%20TECHNOLOGIES/GNU%20Health/USER_ROLE_IMPLEMENTATION_PLAN.md).
  - All historical demo user accounts remain disabled (`active = False`).

### Control 14: Enterprise Password Policy
- **Hardening Action**:
  - Enforce password complexity for all user logins:
    - Minimum length: 12 characters.
    - Mandatory combination of uppercase, lowercase, numeric, and special symbols.
    - Password expiration: 90 days.
    - Account lockout after 5 consecutive failed authentication attempts.
