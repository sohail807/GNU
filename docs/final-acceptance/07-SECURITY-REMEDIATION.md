# IST Health HMIS — Security Audit & Credential Remediation Plan

**Document Reference:** `docs/final-acceptance/07-SECURITY-REMEDIATION.md`  
**Evaluation Date:** September 25, 2026  
**Auditor:** Healthcare Information Security Auditor & Forensic Analyst  

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
- **Threat Vector:** An attacker with access to the Git repository or execution logs could directly authenticate to `http://34.7.237.8/gnuhealth/` as `admin` or demo staff.
- **Classification:** **HIGH SEVERITY**.
- **Mitigating Factor:** Tryton's native brute-force rate limiter is active, locking accounts that receive repeated failed or rapid requests (HTTP 429).
- **Mandate:** All affected credentials must be treated as **COMPROMISED** and rotated before production go-live.

---

## 2. Active Codebase Scrubbing & Environment Isolation

### A. Removal of Universal Administrative Bypass
- **Vulnerability:** Previously, `frontend/src/lib/tryton-client.ts` contained a static method `executeSystem` that used hardcoded `Admin12345!` to run all API calls as root.
- **Remediation:**
  1. All 10 clinical route handlers now require authenticated sessions (`getSession()`).
  2. Route handlers invoke `TrytonClient.execute(username, userId, sessionToken, ...)` forwarding the user's personal session token.
  3. Environment variables `GNUHEALTH_ADMIN_PASSWORD` are strictly restricted to administrative setup and cannot be called by regular users.

### B. Client-Side Bundle Scrubbing
- **Vulnerability:** Static arrays (`STAFF_PRESETS`) previously embedded demonstration passwords into public client-side JavaScript chunks.
- **Remediation:** All client-side demonstration arrays were removed from the public bundle. The login page accepts manual credentials only.

---

## 3. Credential Rotation Plan (Pre-Go-Live Protocol)

Because modifying live production credentials requires explicit user approval under Directive 7, the following credential-rotation protocol is established for deployment day:

### Step 1: Rotate PostgreSQL Database Master Password
```bash
sudo -u postgres psql -c "ALTER USER gnuhealth WITH PASSWORD '[SECURE_HIGH_ENTROPY_DB_SECRET]';"
```
Update `/home/gnuhealth/gnuhealth/tryton/server/config/trytond.conf`:
```ini
[database]
uri = postgresql://gnuhealth:[SECURE_HIGH_ENTROPY_DB_SECRET]@localhost:5432/gnuhealth
```

### Step 2: Rotate Tryton Platform Super-Administrator Password
```bash
/home/gnuhealth/gnuhealth/tryton/server/bin/trytond-admin -c /home/gnuhealth/gnuhealth/tryton/server/config/trytond.conf -d gnuhealth --reset-password=admin
# Enter high-entropy 24-character secret
```

### Step 3: Rotate All Clinical Staff Passwords
Using the administrative portal (`/admin`) or Tryton CLI, update each staff account to unique, randomized temporary passwords with mandatory reset on first login.

### Step 4: Rotate JWT / Next.js Session Encryption Secret
Generate a new 64-byte session secret:
```bash
openssl rand -base64 64
```
Store in `frontend/.env.local`:
```ini
SESSION_SECRET=[SECURE_BASE64_KEY]
COOKIE_SECURE=true
```

---

## 4. Network Boundary & TLS Verification

### A. Public Port Exposure Audit
- **Port 22 (SSH):** Open, protected by Google Cloud OS Login and SSH public key authentication.
- **Port 80 (HTTP):** Open, routed through Nginx reverse proxy.
- **Port 443 (HTTPS):** Configured for TLS termination; pending valid production domain DNS record.
- **Port 8000 (Tryton Daemon):** **PROTECTED**. The Tryton JSON-RPC daemon binds exclusively to `127.0.0.1:8000`. External traffic reaches Tryton solely via Nginx proxy passing `/gnuhealth/`. Direct external access to port 8000 is blocked by GCP Cloud Firewall rules.
- **Port 5432 (PostgreSQL):** **PROTECTED**. PostgreSQL listens exclusively on `localhost:5432`. No external database access is permitted.

### B. TLS Transition Roadmap
To transition from HTTP (port 80) to HTTPS (port 443):
1. Point production DNS A record (e.g. `hmis.ist-health.qa`) to `34.7.237.8`.
2. Issue trusted Let's Encrypt TLS certificate:
   ```bash
   sudo certbot --nginx -d hmis.ist-health.qa
   ```
3. Enable HTTP Strict Transport Security (HSTS):
   ```nginx
   add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
   ```
4. Set `COOKIE_SECURE=true` in Next.js environment to enforce browser-level cookie encryption.
