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
The live portal is accessible at `http://34.7.237.8/login` (and locally at `http://localhost:3000/login`).

| Department / Role | Username | Password | Default Landing | Capabilities |
| :--- | :--- | :--- | :--- | :--- |
| **Front Desk / Reception** | `demo_frontdesk1` | `FrontDesk2026!` | `/frontdesk` | Queue management, arrival check-in, appointments |
| **Outpatient Physician** | `demo_dr1` | `Doctor2026!` | `/physician` | Consultation, SOAP clinical notes, prescriptions, diagnostics |
| **Inpatient Department** | `demo_dr1` / `demo_nurse1` | `Doctor2026!` | `/inpatient` | Bed census, ward management, admissions & discharges |
| **Surgical Suite / OT** | `demo_dr1` | `Doctor2026!` | `/surgery` | Operating theatre scheduling, surgical case logs |
| **Hospital Pharmacy** | `demo_dr1` / `demo_cashier1` | `Doctor2026!` | `/pharmacy` | E-prescription fulfillment, drug formulary |
| **Triage Nurse** | `demo_nurse1` | `Nurse2026!` | `/nursing` | Vital signs triage (BP, HR, SpO2, Temp, RR), nursing assessments |
| **Cashier / Billing** | `demo_cashier1` | `Cashier2026!` | `/billing` | Patient invoice settlement, POS cash/card payment collection |
| **Diagnostic Lab** | `demo_lab1` | `Lab2026!` | `/laboratory` | Test criteria entry, lab results verification |
| **Digital Radiology** | `demo_rad1` | `Rad2026!` | `/radiology` | Diagnostic imaging studies, radiologist findings |
| **System Administrator** | `demo_admin1` | `DemoAdmin2026!` | `/admin` | User management, RBAC dispatching, audit trails |

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
SESSION_ENCRYPTION_KEY=d7a96ef8b4382e753acbd2217c09c488319f3e4bc392815a
```

---

## 6. Code Style & Key Implementation Details
- **Session Auth:** Implemented in `frontend/src/lib/auth-session.ts` with AES-256-GCM encryption in an HTTP-only cookie (`ist_session`). Cookie `secure` flag is protocol-adaptive (`isHttps`) so it works seamlessly over both IP HTTP demos and production HTTPS domains.
- **Tryton JSON-RPC Dispatcher:** `frontend/src/lib/tryton-client.ts` dispatches directly to GNU Health Tryton models with session authentication tokens.
- **UI Framework:** Next.js App Router (`src/app/`), React 19, Lucide React icons, Tailwind CSS tokens in `src/app/globals.css`.
- **Role Redirection:** Managed centrally in `frontend/src/lib/access-control.ts` mapping Tryton user groups (`Health Administration`, `Health Physician`, `Health Nursing`, `Health Lab`, `Health Radiology`, `Account Administration`) to application workspaces.
