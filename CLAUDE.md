# CLAUDE.md — IST Health HMIS & GNU Health Workspace Directives

## 1. Project Overview & System Architecture
IST Health HMIS is an enterprise hospital operating platform delivering outpatient clinical workflows, longitudinal electronic medical records (EMR), diagnostic orders, and billing.

- **Authoritative Backend:** GNU Health HMIS running on Tryton 7.0 on PostgreSQL (database: `gnuhealth`). This is the sole system of record.
- **Frontend Application:** Modern Next.js 16.3.6 (Turbopack, React 19, TypeScript, Vanilla Tailwind CSS) located in `./frontend/`.
- **Infrastructure VM:** Debian GNU/Linux on Google Cloud (`debian@34.7.237.8`).
- **Nginx Reverse Proxy on VM:**
  - `/` -> Proxied to local Next.js instance on `http://127.0.0.1:3000` (`/var/www/ist-health-frontend`).
  - `^/(gnuhealth[a-z0-9_]*)/` -> Proxied to native Tryton JSON-RPC server on `http://127.0.0.1:8000`.
- **SSH Access:** `ssh -i "C:\Users\MohammedSohail\.ssh\gnuhealth_deploy" -o StrictHostKeyChecking=no debian@34.7.237.8`
- **Git Branch:** `audit/final-acceptance-verification` (remote: `origin https://github.com/sohail807/GNU.git`).

---

## 2. Core Operating Directives (Strict Rules)
1. **Single Source of Truth:** Never build shadow databases, mock JSON files, duplicate accounting tables, or parallel RBAC systems. All business logic must dispatch to native Tryton models (`gnuhealth.*`, `party.*`, `account.*`).
2. **Zero Secret Leakage:** Never commit cleartext passwords, session encryption keys, private SSH keys, `.env*` (except `.env.example`), or database dumps.
3. **Synthetic Test Data Exclusively:** All tests, E2E flows, and screenshots must strictly use synthetic patient identities (e.g., `Alexander Wright`). Never modify or delete real patient records.
4. **Evidence-Backed Verification:** Never claim a test or task is complete without reproducible evidence (API status codes, build logs, and Chrome Selenium screenshots).

---

## 3. Verified Staff Personas & Credentials
**Production:** `https://isthealth.irisstar.tech` (Firebase Hosting -> Cloud Run `ist-health-frontend`, project `ist-health-hmis-21722`, region `europe-west4`). The legacy VM portal at `http://34.7.237.8/login` is deprecated. Local dev: `http://localhost:3000/login`.

> All `demo_*` and `uat_*` accounts are suspended in the production database (demo users 2026-09-30; `uat_*` and `demo_admin1` 2026-10-01). Only the real administrators `admin` and `irisstar_admin` remain active. Passwords were removed from this file; use real staff accounts. For local/synthetic testing create dedicated synthetic accounts.

| Department / Role | Username | Password | Default Landing | Capabilities |
| :--- | :--- | :--- | :--- | :--- |
| **Front Desk / Reception** | `demo_frontdesk1` | `(disabled in production 2026-09-30)` | `/frontdesk` | Queue management, arrival check-in, appointments |
| **Outpatient Physician** | `demo_dr1` | `(disabled in production 2026-09-30)` | `/physician` | Consultation, SOAP clinical notes, prescriptions, diagnostics |
| **Inpatient Department** | `demo_dr1` / `demo_nurse1` | `(disabled in production 2026-09-30)` | `/inpatient` | Bed census, ward management, admissions & discharges |
| **Surgical Suite / OT** | `demo_dr1` | `(disabled in production 2026-09-30)` | `/surgery` | Operating theatre scheduling, surgical case logs |
| **Hospital Pharmacy** | `demo_dr1` / `demo_cashier1` | `(disabled in production 2026-09-30)` | `/pharmacy` | E-prescription fulfillment, drug formulary |
| **Triage Nurse** | `demo_nurse1` | `(disabled in production 2026-09-30)` | `/nursing` | Vital signs triage (BP, HR, SpO2, Temp, RR), nursing assessments |
| **Cashier / Billing** | `demo_cashier1` | `(disabled in production 2026-09-30)` | `/billing` | Patient invoice settlement, POS cash/card payment collection |
| **Diagnostic Lab** | `demo_lab1` | `(disabled in production 2026-09-30)` | `/laboratory` | Test criteria entry, lab results verification |
| **Digital Radiology** | `demo_rad1` | `(disabled in production 2026-09-30)` | `/radiology` | Diagnostic imaging studies, radiologist findings |
| **System Administrator** | `demo_admin1` | `(disabled in production 2026-10-01)` | `/admin` | User management, RBAC dispatching, audit trails |

*(Note: The login page includes 1-click Verified Demo Station buttons for instant persona fill).*

---

## 4. Key Development & Deployment Commands

### Frontend Local Development (`frontend/`)
```bash
# Navigate to frontend
cd frontend

# Install dependencies
npm install

# Start local Next.js dev server on port 3000
npm run dev

# Production build verification
npm run build
```

### Automated Production Deployment to VM
To deploy local changes to `/var/www/ist-health-frontend` on the live server:
```bash
# From workspace root:
python scripts/deploy_frontend_update.py
```
This script:
1. Archives `frontend/src/`
2. Streams and extracts to `debian@34.7.237.8:/var/www/ist-health-frontend/src`
3. Verifies `/var/www/ist-health-frontend/.env.production`
4. Executes `npm run build` on the VM
5. Restarts `next-server` on port 3000
6. Verifies `curl -I http://127.0.0.1:3000/login`

### Verification & Testing Scripts
```bash
# Full live browser verification with Selenium (captures screenshot to reports/)
python scripts/verify_live_frontend_full.py

# Verify auth API and role dispatching across all personas
python scripts/test_vm_login.py
```

### VM Health Preflight Check
Runs entirely on the production VM (systemd, PostgreSQL, socket, and data-census checks) — copy it up and
run it over SSH, don't run it locally:
```bash
ssh -i "C:\Users\MohammedSohail\.ssh\gnuhealth_deploy" debian@34.7.237.8 "bash -s" < scripts/preflight_check.sh
```
Reports: systemd status for postgresql/gnuhealth/nginx/gnuhealth-backup.timer, listening sockets on
22/80/443/8000/5432, PostgreSQL `listen_addresses` and active `pg_hba.conf` rules, and a row-count census
across every core clinical/financial table (patients, invoices, moves, users, etc.) — useful as a single
before/after snapshot around a deploy, backup restore, or infra change.

---

## 5. Environment Variables Structure

### Local Development (`frontend/.env.local` — Gitignored):
```env
GNUHEALTH_HOST=http://34.7.237.8
GNUHEALTH_DATABASE=gnuhealth
GNUHEALTH_COMPANY_ID=2
SESSION_ENCRYPTION_KEY=local_development_encryption_key_32_chars_minimum_sohail_2026
SESSION_REVOCATION_DIR=.tokens
NEXT_PUBLIC_DEPLOYMENT_MODE=development
```

### Production Server (`/var/www/ist-health-frontend/.env.production`):
```env
NODE_ENV=production
PORT=3000
GNUHEALTH_HOST=http://127.0.0.1:8000
GNUHEALTH_DATABASE=gnuhealth
GNUHEALTH_COMPANY_ID=2
SESSION_ENCRYPTION_KEY=<never committed - kept only in frontend/.env.production.local (gitignored) and on the VM>
```
Rotated 2026-09-26 after the previous key was found committed in git history (leaked-secret finding from the full-codebase audit). Do not put the real value back in this file or any script - `scripts/deploy_frontend_update.py` now reads it from the gitignored `frontend/.env.production.local`.

---

## 6. Code Style & Key Implementation Details
- **Session Auth:** Implemented in `frontend/src/lib/auth-session.ts` with AES-256-GCM encryption in an HTTP-only cookie (`ist_session`). Cookie `secure` flag is protocol-adaptive (`isHttps`) so it works seamlessly over both IP HTTP demos and production HTTPS domains.
- **Tryton JSON-RPC Dispatcher:** `frontend/src/lib/tryton-client.ts` dispatches directly to GNU Health Tryton models with session authentication tokens.
- **UI Framework:** Next.js App Router (`src/app/`), React 19, Lucide React icons, Tailwind CSS tokens in `src/app/globals.css`.
- **Role Redirection:** Managed centrally in `frontend/src/lib/access-control.ts` mapping Tryton user groups (`Health Administration`, `Health Physician`, `Health Nursing`, `Health Lab`, `Health Radiology`, `Account Administration`) to application workspaces.


---

## 7. Production Deployment (Cloud Run + Firebase Hosting)
- **Flow:** browser -> Firebase Hosting (`isthealth.irisstar.tech`, GoDaddy CNAME -> `ist-health-hmis-21722.web.app`) -> Cloud Run `ist-health-frontend` -> GNU Health backend on the VM over HTTPS (`https://api.isthealth.irisstar.tech`, GoDaddy A record -> `34.7.237.8`, nginx site `/etc/nginx/sites-enabled/api443-domain`, Let's Encrypt, exposes only `/gnuhealth*/`). The older `34-7-237-8.sslip.io` site (`api443`) is still enabled as a fallback and can be removed. VM port 80 only redirects to HTTPS; SSH is limited to the `allow-ssh-admin-ip` firewall rule.
- **Deploy:** `powershell -File scripts/deploy_cloudrun.ps1` (needs gcloud logged in as `praveen@irisstar.tech`). Hosting only needs redeploying when `firebase.json` changes: `firebase deploy --only hosting --project ist-health-hmis-21722`.
- **Cookie:** Firebase Hosting only forwards a cookie named `__session`, so Cloud Run sets `SESSION_COOKIE_NAME=__session`. Do not rename it.
- **Do not add** an `index.html` to `hosting-public/`: static files win over the Cloud Run rewrite and the site goes blank.
- **State:** logout revocations and the tenant registry live on a GCS bucket mounted at `/mnt/state` (`ist-health-hmis-21722-state`, versioned). Secrets: `ist-session-key` in Secret Manager. Runtime identity: `ist-health-run@ist-health-hmis-21722.iam.gserviceaccount.com`.
- **Protections:** failed-login throttle (per username + IP, `frontend/src/lib/rate-limit.ts`), security headers + conservative CSP + noindex (`frontend/next.config.ts`), password recovery disabled (503) until SMTP exists.
- **Monitoring:** Cloud Monitoring uptime checks every 5 minutes on `https://isthealth.irisstar.tech/login` and the `web.app` URL (project `ist-health-hmis-21722`); alert policy "IST Health: login page down" emails `sohail@irisstar.tech` when 2+ regions fail. A legacy check in `gnu-health-509307` probes the VM's `/login` (redirects to the live site).
- **Hospitals (tenants):** one database per hospital at `https://<subdomain>.isthealth.irisstar.tech`; the bare domain is the default hospital. Onboarding is operator-driven: see `docs/TENANT_ONBOARDING.md` (create DB on the VM, add to `TRYTOND_DATABASE_NAMES`, register in `/platform`, add Firebase custom domain + GoDaddy CNAME). Cloud Run runs with `APP_BASE_DOMAIN=isthealth.irisstar.tech` and `TENANT_PROVISIONING=manual`.
- **Backups:** VM `gnuhealth-backup.timer` runs daily 02:00 UTC (14-day retention, off-site copy to GCS).

---

## 8. IST Tryton modules (workflows GNU Health does not ship)
Native Tryton modules in `deploy/modules/`, installed per hospital database with `bash scripts/install_ist_modules.sh <database...>` (backs up each database, copies the modules, activates them, restarts `gnuhealth`):
- `ist_claims`: insurer pre-authorizations and claims (`ist.claims.authorization`, `ist.claims.claim`).
- `ist_ops`: emergency visits, admission plans (estimate and advance), discharge clearance, inter-hospital referrals, pharmacy stock batches, WHO surgical safety checklist, deliveries and newborns. Access rules are generated by `deploy/modules/ist_ops/gen_access.py`.
The app reaches them through `/api/clinical/{claims,emergency,admissions,discharges,referrals,stock,theatre-safety,deliveries,reports}` (shared helpers in `frontend/src/lib/ops-api.ts`). The inpatient discharge, surgery start/close and pharmacy dispense routes call gates that enforce them (and stay open if a database lacks the modules). Demo data: `scripts/aster_demo/load_claims.py` and `load_ops.py`. Backend session idle timeout is 8 h (`[session] timeout` in `/home/gnuhealth/trytond.conf`; Tryton's default of 5 minutes logs staff out).
New hospital databases need `install_ist_modules.sh` run for them too (the provisioning template does not include the modules yet).
