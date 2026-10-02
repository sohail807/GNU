# 07-IMPLEMENTATION-PLAN: IST HEALTH HMIS PRODUCTION READINESS ROADMAP

**Project:** IST Health HMIS  
**Baseline Date:** 2026-09-25  
**Governing Standard:** Production-Ready, Secure, Multi-Tenant Healthcare Medical OS  
**Implementation Methodology:** 14-Phase Phased Engineering Execution with Strict Verification Gates  

---

## 1. Executive Strategy & Guiding Principles

This implementation plan translates the empirical findings from documents `01` through `06` into an actionable engineering roadmap. 

### Core Non-Negotiable Directives
1. **Direct In-Repo Implementation:** Implement directly in the existing repository. Preserve working functionality, established clinical models, and the finalized **Mockup A** design system.
2. **Zero Mocks / Zero Shadow Systems:** All data mutations must persist into native Tryton models (`gnuhealth.*`, `account.*`, `party.*`, `res.*`). Never return fake success when a transaction fails.
3. **Zero Secrets in Code:** Remove all cleartext passwords from the client bundle. Retrieve sensitive values from environment variables or secure credential vaults.
4. **Verification at Every Step:** Never claim a feature works without empirical evidence (code inspection, API test, SQL audit, or live browser verification).

---

## 2. Phased Implementation Roadmap

```mermaid
gantt
    title IST Health HMIS Production Implementation Phases
    dateFormat  YYYY-MM-DD
    section Baseline & Security
    Phase 1: Codebase Audit & Gap Analysis         :done, p1, 2026-09-25, 1d
    Phase 2: GNU Health Backend Repair & Gateway   :active, p2, 2026-09-26, 2d
    section Multi-Tenancy & Auth
    Phase 5: Secure Multi-Tenant Architecture       :p5, after p2, 2d
    Phase 6: Professional RBAC & Dashboard Isolation:p6, after p5, 2d
    Phase 7: Authentication & Password Recovery     :p7, after p6, 2d
    section Full Clinical Integration
    Phase 3: Frontend-to-Backend API Integration   :p3, after p7, 3d
    Phase 8: Complete Hospital Workflows           :p8, after p3, 2d
    Phase 9: IST Health Frontend Completion (Mockup A):p9, after p8, 2d
    section Data & Infrastructure
    Phase 4: Demo Data Purge & Clean Onboarding    :p4, after p9, 2d
    Phase 10: Database Integrity & Migrations      :p10, after p4, 1d
    Phase 11: Healthcare Security & Audit Trails   :p11, after p10, 2d
    Phase 12: Production Infrastructure & Nginx    :p12, after p11, 2d
    section Verification & Gate
    Phase 13: Comprehensive Automated Testing Suite:p13, after p12, 2d
    Phase 14: Production Acceptance & Handover     :p14, after p13, 1d
```

---

## 3. Detailed Work Breakdown by Phase

### PHASE 2 — GNU Health Backend Verification & Repair
- **Objective:** Fix backend API gateway to use native session tokens and repair model endpoints.
- **Tasks:**
  1. Refactor `frontend/src/lib/tryton-client.ts`:
     - Eliminate hardcoded `admin / Admin12345!`.
     - Implement clean token pass-through for user sessions.
     - Add company context resolution.
  2. Implement native Tryton error parser to translate Tryton `UserError`, `AccessError`, and integrity violations into friendly, structured HTTP error responses.
  3. Validate backend endpoints for ICD-10 search (`gnuhealth.pathology`), medicament formulary (`gnuhealth.medicament`), and health professionals (`gnuhealth.healthprofessional`).
- **Files Modified:** `frontend/src/lib/tryton-client.ts`, `frontend/src/app/api/hmis/[...endpoint]/route.ts`.
- **Verification Gate:** Verified JSON-RPC call as `demo_frontdesk1` returning user-scoped records.

---

### PHASE 5 — Secure Multi-Tenant Architecture
- **Objective:** Enable multi-tenant hospital routing and tenant-scoped database isolation.
- **Tasks:**
  1. Implement a Central Tenant Control Plane:
     - Tenant configuration store managing tenant ID, slug/domain, company ID, and database name.
  2. Implement Tenant Resolver Middleware in Next.js:
     - Resolve active tenant from hostname (e.g. `tenant1.ist-health.qa`), `X-Tenant-ID` header, or session cookie.
     - Route JSON-RPC calls to the tenant's dedicated database or company context.
  3. Prevent cross-tenant data leakage by enforcing tenant boundaries in all BFF routes.
- **Files Modified:** `frontend/src/lib/tenant-resolver.ts`, `frontend/src/middleware.ts`, `frontend/src/lib/tryton-client.ts`.
- **Verification Gate:** Automated isolation test demonstrating Tenant A cannot view Tenant B's patient list.

---

### PHASE 6 — Professional Role-Based Access Control (RBAC) & Dashboard Isolation
- **Objective:** Enforce server-side permissions and role-appropriate dashboard isolation.
- **Tasks:**
  1. Map native Tryton groups (`Health Front Desk`, `Health Nurse`, `Health Doctor`, `Health Lab`, `Health Imaging`, `Account`) to IST Health roles.
  2. Dynamically issue effective user permissions from Tryton during `/api/auth/me`.
  3. Strict Dashboard Isolation:
     - Receptionist sees only Front Desk, Intake, Appointments, and Patient Directory.
     - Doctor sees only Physician Cockpit, assigned patients, and clinical diagnostic orders.
     - Cashier sees only Invoicing, payments, and receipts; ledger is restricted to Financial Comptroller.
  4. Server-Side Permission Gate: BFF API routes reject unauthorized role calls before dispatching to backend.
- **Files Modified:** `frontend/src/lib/access-control.ts`, `frontend/src/components/app/AppSidebar.tsx`, `frontend/src/app/api/clinical/*`.
- **Verification Gate:** Direct API and URL access tests verifying unauthorized roles receive HTTP 403 Forbidden.

---

### PHASE 7 — Authentication, Password Recovery & Administrator Reset
- **Objective:** Provide secure account lifecycle management.
- **Tasks:**
  1. **Purge Cleartext Credentials:** Remove `STAFF_PRESETS` from `login/page.tsx` and `QUICK_ROLES` from `AppHeader.tsx`.
  2. **Self-Service Password Recovery:**
     - Add "Forgot Password?" dialog on `/login`.
     - Implement `/api/auth/forgot-password` generating single-use HMAC-SHA256 reset tokens (15-min expiry).
     - Implement `/api/auth/reset-password` executing native password updates on `res.user`.
  3. **Administrative Staff Password Reset:**
     - Implement `/api/admin/users/reset-password` allowing tenant admins to issue secure reset links or temporary passwords without revealing existing passwords.
     - Prevent tenant admins from modifying platform super-admin accounts.
  4. **Security Hardening:** Set `secure: true` on cookies in production; add brute-force rate limiting on login.
- **Files Modified:** `frontend/src/app/login/page.tsx`, `frontend/src/components/app/AppHeader.tsx`, `frontend/src/app/api/auth/*`, `frontend/src/lib/auth-session.ts`.
- **Verification Gate:** Complete reset cycle verified from forgot-password request to login with new password.

---

### PHASE 3 & 8 — Complete Frontend-to-Backend API Integration & Hospital Workflows
- **Objective:** Eliminate all frontend-only mutations, hardcoded IDs, and mock responses across all 9 departments.
- **Tasks:**
  1. **Front Desk & Appointments (`/frontdesk`, `/frontdesk/appointments`):**
     - Dynamic arrival queue loading with legitimate empty state.
     - Connect appointment booking to live `gnuhealth.healthprofessional` list.
     - Remove optimistic check-in in error catch block.
  2. **Nursing Triage (`/nursing`):**
     - Dynamically link triage vitals to the authenticated nurse and patient.
     - Remove hardcoded "Dr. Gregory House" and static evaluation references.
  3. **Physician Cockpit (`/physician`):**
     - Dynamic ICD-10 search against Tryton `gnuhealth.pathology`.
     - Dynamic drug formulary search against `gnuhealth.medicament`.
     - Wire `handleCreatePrescription` to call `/api/clinical/prescriptions` and persist `gnuhealth.prescription.order` with line items.
     - Remove fake success toast from evaluation save catch block.
  4. **Diagnostic Laboratory (`/laboratory`):**
     - Add `useEffect` to fetch live pending laboratory requisitions on mount.
     - Wire "Create New Lab Order" modal to persist `gnuhealth.lab` via Tryton API.
     - Persist analyte criteria into `gnuhealth.lab.test.critearea`.
  5. **Digital Radiology & PACS (`/radiology`):**
     - Add `useEffect` to fetch live imaging orders on mount.
     - Wire "Request Study" action to transition state to `requested` via backend write.
     - Persist imaging findings into Tryton `gnuhealth.imaging.test.request.comment`.
  6. **Cashier Billing & General Ledger (`/billing`):**
     - Wire "Create New Invoice" modal to persist `account.invoice` and `account.invoice.line` in PostgreSQL.
     - Implement genuine settlement workflow: validate invoice -> post invoice -> post cash receipt move in `account.move` -> reconcile.
     - In GL Audit tab (`/billing?tab=ledger`), query live `account.move` and `account.move.line` records.
  7. **Longitudinal Patient Chart (`/patient/[id]`):**
     - Refactor `/patient/[id]/page.tsx` from static "Alexander Wright" mockup into dynamic master chart.
     - Fetch patient demographics, historical appointments, evaluations, prescriptions, labs, imaging, and invoices linked to `params.id`.
  8. **Staff Administration (`/admin`):**
     - Replace in-memory array with native Tryton queries against `res.user`, `res.group`, and `gnuhealth.healthprofessional`.
- **Files Modified:** All pages in `frontend/src/app/(app)/` and routes in `frontend/src/app/api/clinical/`.
- **Verification Gate:** 100% of workflows tested end-to-end with persistent database records verified via SQL.

---

### PHASE 4 — Demo Data Removal & Clean Client Onboarding
- **Objective:** Deliver pristine production state with a first-run onboarding wizard.
- **Tasks:**
  1. Isolate mandatory reference data (ICD-10, countries, currencies, chart of accounts) from demo patients and transactions.
  2. Implement automated clean-install script `scripts/purge_demo_uat_data.py`.
  3. Reset all sequence counters (`ir.sequence`) to 1.
  4. Design first-run Onboarding Wizard modal for new hospital tenants:
     - Institution details (name, commercial license, tax ID, currency).
     - Outpatient departments and consulting rooms.
     - Attending physicians and staff invitations.
  5. Ensure all dashboards display meaningful empty states when zero patient records exist.
- **Files Modified:** `frontend/src/components/app/OnboardingTourModal.tsx`, `scripts/purge_demo_uat_data.py`.
- **Verification Gate:** Clean deployment drill resulting in empty arrival queue with zero synthetic demo names.

---

### PHASE 9 — IST Health Frontend Polish & Mockup A Integrity
- **Objective:** Ensure all finalized Mockup A design system standards are preserved.
- **Tasks:**
  1. Maintain enterprise teal color palette (`#0F766E`, `#0F172A`, `#F8FAFC`).
  2. Verify glassmorphism card styling, responsive layouts, and typography.
  3. Replace any rough error states with polished, branded alert dialogs.
  4. Test responsive layout across desktop (1600px), tablet (1024px), and mobile (390px).
- **Files Modified:** `frontend/src/app/globals.css`, `frontend/src/components/ui/*`.
- **Verification Gate:** Visual inspection against Mockup A HTML reference benchmarks in `scratch/mockup_html/`.

---

### PHASE 10 & 11 — Database Integrity, Security Hardening & Audit Trails
- **Objective:** Guarantee data durability, security compliance, and immutable audit logs.
- **Tasks:**
  1. Re-verify 12 relational foreign-key chains with zero orphans.
  2. Implement immutable audit logging table/service capturing all logins, password changes, clinical note signings, and billing settlements.
  3. Configure Nginx security headers (`X-Content-Type-Options`, `X-Frame-Options`, `Strict-Transport-Security`, Content Security Policy).
- **Files Modified:** `deployment/nginx-ist-health.conf`, `scripts/audit_integrity.sql`.
- **Verification Gate:** Automated security scan and SQL integrity pass.

---

### PHASE 12 & 13 — Production Infrastructure & Comprehensive Automated Testing
- **Objective:** Deploy, automate, and verify all test suites.
- **Tasks:**
  1. Execute unit and API integration test suite (`tests/test_frontend_api_integration.py`).
  2. Execute full Selenium E2E operational browser certification (`scripts/verify_ist_health_frontend.py`).
  3. Execute automated cross-tenant isolation tests.
  4. Conduct backup and disaster recovery drill.
- **Verification Gate:** 100% test pass rate with zero skipped critical tests.

---

### PHASE 14 — Production Acceptance & Handover
- **Objective:** Deliver final evidence package and production signoff.
- **Tasks:**
  1. Compile final acceptance matrix mapping every screen to backend tests.
  2. Deliver `PRODUCTION-READINESS-REPORT.md` documenting verified capabilities and operational runbooks.
- **Verification Gate:** Formal signoff against all non-negotiable architectural directives.
