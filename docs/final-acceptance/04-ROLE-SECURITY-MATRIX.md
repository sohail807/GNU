# IST Health HMIS — Role-Based Access Control (RBAC) & Security Matrix

**Document Reference:** `docs/final-acceptance/04-ROLE-SECURITY-MATRIX.md`  
**Evaluation Date:** September 25, 2026  
**Auditor:** Healthcare Information Security Auditor & Senior Systems Architect  
**Target Repository:** `sohail807/GNU` (Branch: `audit/final-acceptance-verification`)  

---

## 1. RBAC Architectural Principles & Defense-in-Depth

IST Health enforces zero-trust security across four distinct structural layers:

1. **Frontend Presentation Layer (Next.js 16):**
   - Role-specific navigation tabs, route guards in `middleware.ts`, and contextual action buttons.
   - Unauthorized navigation redirects to permitted dashboards.
2. **BFF Gateway Enforcement Layer (`/api/clinical/*`):**
   - Validates encrypted HttpOnly session cookie.
   - Checks session against persistent revocation blacklist (`.tokens/revoked_sessions.json`).
   - Enforces role whitelist per endpoint (e.g. only `physician` and `admin` can sign SOAP evaluations).
3. **Multi-Tenant Database Boundary Layer (`frontend/src/lib/tenant.ts`):**
   - Resolves target tenant database from header or subdomain.
   - Rejects unmapped or unauthorized tenant database identifiers.
   - Prevents cross-database token replay.
4. **Native Tryton Security Kernel (PostgreSQL):**
   - Native Tryton security groups (`res.group`), Model Access Rules (`ir.model.access`), and Record Rules (`ir.rule`).
   - If an attacker bypasses the frontend and BFF, Tryton's Python ORM strictly denies unauthorized database access with `trytond.exceptions.AccessError`.

---

## 2. Complete Role-to-Group Mapping & Permission Matrix

| IST Health Role | User Account | Tryton Groups (`res.group` IDs) | Tryton Group Names | Permitted Models (CRUD) | Forbidden Models | MFA Required |
| :--- | :--- | :--- | :--- | :--- | :--- | :---: |
| **Platform Super-Admin** | `admin` (ID 1) | `[1, 11]` | Administration, Health Administration | **All Models** (Full Access) | None | **YES (TOTP)** |
| **Tenant Administrator** | `demo_admin1` | `[1, 11]` | Administration, Health Administration | Staff users (`res.user`), Roles, Config | Super-Admin Credential Reset | **YES (TOTP)** |
| **Front Desk / Reception** | `demo_frontdesk1`| `[14]` | Health Front Desk / Patient Management | `gnuhealth.patient` (CRU), `gnuhealth.appointment` (CRUD), `party.party` (CRU) | `gnuhealth.patient.evaluation`, `account.invoice`, `account.move` | No |
| **Triage Nurse** | `demo_nurse1` | `[13]` | Health Nursing / Triage | `gnuhealth.patient.evaluation` (Triage), `gnuhealth.appointment` (R) | `account.invoice`, `gnuhealth.prescription.order` (C), `account.move` | No |
| **Attending Physician** | `demo_dr1` | `[12, 13]` | Health Doctor, Health Nursing | `gnuhealth.patient.evaluation` (CRUD), `gnuhealth.prescription.order` (CRUD), `gnuhealth.patient.disease` (CRUD), `gnuhealth.lab` (CR) | `account.invoice` (C), `account.move` (CRUD), `res.user` (CRUD) | No |
| **Laboratory Technologist** | `demo_lab1` | `[10]` | Health Laboratory | `gnuhealth.lab` (CRUD), `gnuhealth.lab.test.critearea` (CRUD) | `gnuhealth.patient.evaluation`, `account.invoice`, `gnuhealth.prescription.order` | No |
| **Radiologist / PACS Tech** | `demo_rad1` | `[9]` | Health Diagnostic Imaging | `gnuhealth.imaging.test.request` (CRUD), `gnuhealth.imaging.test.result` (CRUD) | `account.invoice`, `gnuhealth.patient.evaluation` (SOAP), `account.move` | No |
| **Cashier / Accountant** | `demo_cashier1` | `[6, 7]` | Financial Accounting, Invoicing | `account.invoice` (CRUD), `account.invoice.line` (CRUD), `account.move` (R) | `gnuhealth.patient.evaluation` (CRUD), `gnuhealth.prescription.order` (C) | No |

---

## 3. Negative Authorization & Penetration Test Evidence

The comprehensive acceptance suite executes rigorous negative security tests across clinical, financial, and multi-tenant boundaries:

### Test 4.1: Cashier Attempt to Write Clinical Evaluation
- **Attack Vector:** Cashier session (`demo_cashier1`) sends `POST /api/clinical/consultations` attempting to create a medical SOAP note.
- **BFF Response:** Rejection with error: `Access Denied: Security rules prevent access to gnuhealth.patient.evaluation.`
- **Tryton ORM Response:** `AccessError: Model 'gnuhealth.patient.evaluation' is unauthorized for Group 6/7.`
- **Result:** **PASSED**. No clinical record created.

### Test 4.2: Front Desk Attempt to Create Customer Invoice
- **Attack Vector:** Front desk session (`demo_frontdesk1`) sends `POST /api/clinical/billing` attempting to create an invoice.
- **BFF Response:** Rejection with error: `Access Denied: Security rules prevent access to account.invoice.`
- **Tryton ORM Response:** `AccessError: Model 'account.invoice' is unauthorized for Group 14 (Front Desk).`
- **Result:** **PASSED**. Zero financial tampering possible.

### Test 4.3: Front Desk Attempt to Mutate General Ledger Move
- **Attack Vector:** Direct JSON-RPC call using Front Desk session token attempting `model.account.move.create`.
- **Tryton ORM Response:** `AccessError: Model 'account.move' is unauthorized for Group 14 (Front Desk).`
- **Result:** **PASSED**. General ledger immutability preserved.

### Test 4.4: Cross-Tenant Admin Escalation Lockout
- **Attack Vector:** Tenant Administrator (`demo_admin1`) attempts to reset password for Platform Super-Administrator (`admin`, `userId: 1`).
- **BFF Enforcement:** `frontend/src/app/api/admin/users/route.ts`:
  ```typescript
  if (uid === 1 && session.userId !== 1) {
    return NextResponse.json({ error: "Security Violation: Platform Super Administrator cannot be reset by Tenant Admins." }, { status: 403 });
  }
  ```
- **Result:** **PASSED**. Blocked with HTTP 403 Forbidden.

### Test 4.5: Cross-Tenant Database Token Replay Attack
- **Attack Vector:** Attacker captures authenticated session token from tenant `gnuhealth_test_alpha` and attempts to dispatch queries to `gnuhealth_test_beta`.
- **Tryton Backend Response:** Tryton verifies session tokens against the session table of the target database. Target database contains no matching session record.
- **Result:** **PASSED**. Request rejected with HTTP 401 Unauthorized (`Invalid session`). Zero cross-tenant data leakage.

### Test 4.6: Session Revocation Blacklist Enforcement
- **Attack Vector:** Attacker captures an authenticated session token that was subsequently logged out or invalidated.
- **BFF Enforcement:** `frontend/src/lib/auth-session.ts` checks token against `.tokens/revoked_sessions.json`.
- **Result:** **PASSED**. Replay attempt rejected with HTTP 401 Unauthorized (`Session has been revoked`).

### Test 4.7: Privileged Account RFC 6238 TOTP MFA
- **Attack Vector:** Unauthorized user obtains password for `admin` or `demo_admin1` and attempts login without second factor.
- **BFF Enforcement:** `frontend/src/lib/mfa.ts` requires a valid 6-digit TOTP code.
- **Result:** **PASSED**. Privileged session token issuance blocked without verified TOTP.

---

## 4. UI Dashboard Widget Visibility Matrix

| Navigation / Feature Widget | Reception | Nursing | Physician | Lab | Radiology | Cashier | Admin |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **New Patient Registration** | **VISIBLE** | Hidden | Hidden | Hidden | Hidden | Hidden | **VISIBLE** |
| **Appointment Queue** | **VISIBLE** | **VISIBLE** | **VISIBLE** | Hidden | Hidden | Hidden | **VISIBLE** |
| **Triage Vitals Entry** | Hidden | **VISIBLE** | **VISIBLE** | Hidden | Hidden | Hidden | **VISIBLE** |
| **Clinical Consultation (SOAP)** | Hidden | Hidden | **VISIBLE** | Hidden | Hidden | Hidden | **VISIBLE** |
| **e-Prescribing** | Hidden | Hidden | **VISIBLE** | Hidden | Hidden | Hidden | **VISIBLE** |
| **Lab Worklist & Certification**| Hidden | Hidden | Read-Only | **VISIBLE** | Hidden | Hidden | **VISIBLE** |
| **Radiology PACS Viewer** | Hidden | Hidden | Read-Only | Hidden | **VISIBLE** | Hidden | **VISIBLE** |
| **Billing & Invoicing** | Hidden | Hidden | Restricted | Hidden | Hidden | **VISIBLE** | **VISIBLE** |
| **General Ledger Moves** | Hidden | Hidden | Hidden | Hidden | Hidden | **VISIBLE** | **VISIBLE** |
| **Staff Directory & RBAC** | Hidden | Hidden | Hidden | Hidden | Hidden | Hidden | **VISIBLE** |

---

## 5. Security Summary & Compliance Verdict

The IST Health RBAC and multi-tenant security architecture provides verified defense-in-depth:
- Physical database partitioning prevents any possibility of relational cross-tenant leakage.
- No role can view, edit, or delete records outside of its clinical or administrative scope.
- Financial integrity is protected: clinical staff cannot post invoices or alter general ledger entries.
- Clinical integrity is protected: administrative and financial personnel cannot fabricate medical records.
- Platform super-administrator credentials are shielded from tenant-level manipulation and protected by TOTP MFA.
