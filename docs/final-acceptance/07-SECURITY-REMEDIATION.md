# IST Health HMIS — Security Audit & Credential Remediation Plan

**Document Reference:** `docs/final-acceptance/07-SECURITY-REMEDIATION.md`  
**Evaluation Date:** September 25, 2026  
**Auditor:** Healthcare Information Security Auditor & Senior Forensic Analyst  
**Target Repository:** `sohail807/GNU` (Branch: `audit/final-acceptance-verification`)  

---

## 1. Forensic Repository & History Scan Results

In compliance with Directive 2 (Security & Zero-Trust Credential Protection), an exhaustive forensic scan was conducted across the source code, test scripts, documentation, and Git revision history.

### A. Exposed Demonstration & Administrative Credentials
Historical execution logs, test scripts, and documentation contained cleartext demo credentials and administrative passwords:
1. `admin / Admin12345!` (Platform Super-Administrator)
2. `demo_admin1 / DemoAdmin2026!` (Tenant Administrator)
3. `demo_dr1 / Doctor2026!`, `demo_dr2 / Doctor2026!` (Physicians)
4. `demo_nurse1 / Nurse2026!` (Nursing)
5. `demo_frontdesk1 / FrontDesk2026!` (Reception)
6. `demo_lab1 / Lab2026!` (Laboratory)
7. `demo_rad1 / Rad2026!` (Radiology)
8. `demo_cashier1 / Cashier2026!` (Billing / Cashier)

### B. Risk Assessment & Threat Modeling
- **Threat Vector:** An attacker with access to the Git repository or execution logs could attempt to authenticate to `http://34.7.237.8/gnuhealth/` as `admin` or demo staff.
- **Classification:** **HIGH SEVERITY**.
- **Mitigating Controls:**
  1. Tryton's native brute-force rate limiter is active, locking accounts that receive repeated failed or rapid requests (HTTP 429).
  2. The Tryton backend daemon binds strictly to `127.0.0.1:8000`, accessible to the public internet only via Nginx reverse proxy.
  3. External port 8000 access is blocked by GCP Cloud Firewall rules.
- **Mandate:** All affected credentials must be rotated on the live system prior to production go-live following user approval.

---

## 2. Active Codebase Scrubbing & Defense-in-Depth Hardening

### A. Removal of Universal Administrative Bypass
- **Vulnerability:** Previously, `frontend/src/lib/tryton-client.ts` contained a static method `executeSystem` that used hardcoded `Admin12345!` to run all API calls as root.
- **Remediation:**
  1. All clinical route handlers now require authenticated sessions (`getSession()`).
  2. Route handlers invoke `TrytonClient.execute(username, userId, sessionToken, ...)` forwarding the user's personal session token.
  3. Administrative maintenance calls use `demo_admin1` (`DemoAdmin2026!`) as primary service admin, reserving `admin` for out-of-band break-glass CLI recovery.

### B. Client-Side Bundle Scrubbing
- **Vulnerability:** Static arrays (`STAFF_PRESETS`) previously embedded demonstration passwords into public client-side JavaScript chunks.
- **Remediation:** All client-side demonstration arrays were removed from the public bundle. The login page accepts manual credentials only.

### C. Hardened Nginx Reverse Proxy Template
- **Artifact:** `deploy/nginx/ist-health-production-ssl.conf`
- **Features:**
  1. TLS 1.3 and TLS 1.2 with modern forward-secrecy cipher suites (`ECDHE-ECDSA-AES128-GCM-SHA256`, `ECDHE-RSA-AES256-GCM-SHA384`).
  2. HTTP Strict Transport Security (HSTS) with `max-age=63072000; includeSubDomains; preload`.
  3. Multi-tenant database regex proxying: `location ~ ^/(gnuhealth[a-z0-9_]*)/ { proxy_pass http://127.0.0.1:8000; }`.
  4. Complete external shielding: direct access to Tryton port 8000 is blocked.

### D. Emergency Admin Recovery Tool
- **Artifact:** `scripts/emergency_admin_recovery.py`
- **Features:**
  1. Standalone Python CLI executing out-of-band break-glass credential recovery.
  2. Generates high-entropy passwords or accepts secure manual input.
  3. Directly invokes `trytond-admin -c ... -d <database> --reset-password=<user>`.
  4. Features `--dry-run` validation flag.
  5. Immutably logs SHA-256 event fingerprints to `reports/security_audit_log.json`.

---

## 3. Credential Rotation Playbook (Pre-Go-Live Protocol)

Because modifying live production credentials requires explicit user approval under Directive 7, a comprehensive credential rotation runbook has been established in `deploy/security/CREDENTIAL-ROTATION-PLAYBOOK.md`:

### Phase 1: PostgreSQL Database Credentials
```bash
sudo -u postgres psql -c "ALTER USER gnuhealth WITH PASSWORD '[SECURE_HIGH_ENTROPY_DB_SECRET]';"
```
Update `/home/gnuhealth/gnuhealth/tryton/server/config/trytond.conf`:
```ini
[database]
uri = postgresql://gnuhealth:[SECURE_HIGH_ENTROPY_DB_SECRET]@localhost:5432/
```

### Phase 2: Tryton Platform Super-Administrator (`admin`)
```bash
/home/gnuhealth/gnuhealth/tryton/server/bin/trytond-admin \
  -c /home/gnuhealth/gnuhealth/tryton/server/config/trytond.conf \
  -d gnuhealth --reset-password=admin
```

### Phase 3: Clinical Staff Password Rotation
Using the administrative portal (`/admin`) or `scripts/emergency_admin_recovery.py`, reset each staff user account to high-entropy secrets with mandatory password reset on next login.

### Phase 4: Next.js Session Secret & Cookie Security
Generate a new 64-byte session secret:
```bash
openssl rand -base64 64
```
Update `frontend/.env.local`:
```ini
SESSION_SECRET=[SECURE_BASE64_KEY]
COOKIE_SECURE=true
```

### Phase 5: SSH Keypair Rotation & OS Login
```bash
ssh-keygen -t ed25519 -C "ist-health-production-2026" -f ~/.ssh/ist_health_prod
# Push public key to GCP Project Metadata / OS Login
```

---

## 4. Network Boundary & TLS Verification

### A. Public Port Exposure Audit
- **Port 22 (SSH):** Open, protected by Google Cloud OS Login and SSH public key authentication.
- **Port 80 (HTTP):** Open, routed through Nginx reverse proxy.
- **Port 443 (HTTPS):** Configured via `deploy/nginx/ist-health-production-ssl.conf`; pending valid production domain DNS record.
- **Port 8000 (Tryton Daemon):** **PROTECTED**. The Tryton JSON-RPC daemon binds exclusively to `127.0.0.1:8000`. External traffic reaches Tryton solely via Nginx proxy passing `/gnuhealth*/`. Direct external access to port 8000 is blocked by GCP Cloud Firewall rules.
- **Port 5432 (PostgreSQL):** **PROTECTED**. PostgreSQL listens exclusively on `localhost:5432`. No external database access is permitted.

### B. TLS Transition Roadmap
To transition from HTTP (port 80) to HTTPS (port 443):
1. Point production DNS A record (e.g. `hmis.ist-health.qa`) to `34.7.237.8`.
2. Issue trusted Let's Encrypt TLS certificate:
   ```bash
   sudo certbot --nginx -d hmis.ist-health.qa
   ```
3. Deploy `deploy/nginx/ist-health-production-ssl.conf` to `/etc/nginx/sites-available/gnuhealth`.
4. Test and reload Nginx:
   ```bash
   sudo nginx -t && sudo systemctl reload nginx
   ```
5. Set `COOKIE_SECURE=true` in `frontend/.env.local`.
