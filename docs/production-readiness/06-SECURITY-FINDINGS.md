# 06-SECURITY-FINDINGS: HEALTHCARE APPLICATION SECURITY AUDIT

**Target Application:** IST Health HMIS  
**Backend:** GNU Health HMIS 5.0.6 / Tryton 7.0.57  
**Standard:** OWASP Top 10, Healthcare Zero-Trust Architecture, HIPAA Security Rule Principles  
**Date of Audit:** 2026-09-25  
**Audit Status:** CRITICAL VULNERABILITIES IDENTIFIED & MITIGATION SPECIFIED  

---

## 1. Executive Summary

This security audit evaluates the IST Health HMIS codebase against zero-trust architectural directives and healthcare data protection requirements. The inspection identified **9 critical and high-severity security vulnerabilities** in the existing frontend-to-backend integration layer.

Most notably, the current frontend API proxy completely circumvents Tryton's native Role-Based Access Control by executing clinical operations via a hardcoded administrative account (`executeSystem`), cleartext passwords are embedded within production client bundles, and user administrative updates are stored in volatile server memory without backend authentication.

---

## 2. Security Findings Register

### SEC-01: Cleartext Demonstration Credentials Embedded in Client JS Bundle
- **CWE:** CWE-798 (Use of Hard-coded Credentials) / CWE-200 (Exposure of Sensitive Information)
- **Severity:** **CRITICAL**
- **Affected Files:**
  - `frontend/src/app/login/page.tsx` (Lines 18–28)
  - `frontend/src/components/app/AppHeader.tsx` (Lines 26–34)
- **Description:** The login screen and application header declare static arrays (`STAFF_PRESETS` and `QUICK_ROLES`) containing usernames and passwords (`FrontDesk2026!`, `Nurse2026!`, `Doctor2026!`, `Admin12345!`). These strings are compiled into the client-side JavaScript bundle delivered to any web visitor.
- **Impact:** Any unauthenticated user inspecting the network tab or JavaScript bundle can extract valid hospital staff passwords and authenticate directly against the GNU Health Tryton backend.
- **Recommended Fix:**
  1. Remove `STAFF_PRESETS` and `QUICK_ROLES` entirely from the client bundle.
  2. Implement genuine credential entry on `/login`.
  3. In test/staging environments, inject test credentials dynamically through secure environment variables or automated Selenium test drivers.
- **Verification Method:** Inspect compiled `.next` client JavaScript bundles using `grep` to verify zero matches for credential strings.

---

### SEC-02: Universal Administrative Privilege Escalation in BFF API Gateway
- **CWE:** CWE-285 (Improper Authorization) / CWE-250 (Execution with Unnecessary Privileges)
- **Severity:** **CRITICAL**
- **Affected Files:**
  - `frontend/src/app/api/clinical/patients/route.ts` (Lines 27, 39, 117, 133, 141)
  - `frontend/src/app/api/clinical/appointments/route.ts` (Lines 12, 24, 74, 102)
  - `frontend/src/app/api/clinical/consultations/route.ts` (Lines 20, 97, 107, 126)
  - `frontend/src/app/api/clinical/triage/route.ts` (Lines 20, 102)
  - `frontend/src/app/api/clinical/laboratory/route.ts` (Lines 20, 32, 86)
  - `frontend/src/app/api/clinical/radiology/route.ts` (Lines 21, 33, 86)
  - `frontend/src/app/api/clinical/billing/route.ts` (Lines 12, 24, 83)
- **Description:** Every specialized API route in `frontend/src/app/api/clinical/` calls `TrytonClient.executeSystem()` rather than `TrytonClient.execute()`. `executeSystem()` logs into Tryton as super-administrator (`admin`) and executes the model method with unrestricted root privileges, ignoring the authenticated user's actual session token.
- **Impact:** A logged-in Receptionist can execute doctor consultations or modify accounting moves simply by sending a POST request to `/api/clinical/consultations`. The server completely bypasses Tryton's native RBAC (`ir.model.access` and `ir.rule`). Furthermore, audit trails in Tryton (`create_uid`, `write_uid`) attribute all clinical actions to user ID 1 (`admin`) rather than the actual clinician.
- **Recommended Fix:**
  1. Refactor every API route to extract `session.username`, `session.userId`, and `session.sessionToken` from `getSession()`.
  2. Invoke `TrytonClient.execute(...)` with the user's authentic session token.
  3. Let Trytond naturally enforce native role permissions and raise `AccessError` if unauthorized.
- **Verification Method:** Attempt to invoke `POST /api/clinical/consultations` using a receptionist session cookie; verify that Tryton rejects the call with HTTP 403 / Tryton `AccessError`.

---

### SEC-03: Hardcoded Administrative Password in Tryton Client Library
- **CWE:** CWE-798 (Use of Hard-coded Credentials)
- **Severity:** **CRITICAL**
- **Affected File:** `frontend/src/lib/tryton-client.ts` (Lines 131, 152)
- **Description:** The string `"Admin12345!"` is hardcoded as the password for the Tryton `admin` user inside the static method `executeSystem`.
- **Impact:** If the repository is exposed or compromised, the primary database administrative credentials for GNU Health are leaked.
- **Recommended Fix:** Retrieve administrative connection credentials exclusively from secure environment variables (`GNUHEALTH_ADMIN_PASSWORD`), and restrict `executeSystem` strictly to system initialization scripts.
- **Verification Method:** Static code analysis verifying zero cleartext credentials in `tryton-client.ts`.

---

### SEC-04: Ephemeral In-Memory User & RBAC Management
- **CWE:** CWE-668 (Exposure of Resource to Wrong Sphere) / CWE-440 (Expected Behavior Violation)
- **Severity:** **CRITICAL**
- **Affected File:** `frontend/src/app/api/admin/users/route.ts` (Lines 13, 51–165)
- **Description:** User modifications, new user creations, and custom permission toggles are committed to an in-memory JavaScript variable (`let staffDirectory = ...`). They are never persisted to Tryton `res.user`, `gnuhealth.healthprofessional`, or PostgreSQL.
- **Impact:** Any user created or password reset by an administrator vanishes when the Next.js Node process restarts or scales across multiple containers. More critically, newly added users cannot authenticate against the GNU Health Tryton backend because they do not exist in `res.user`.
- **Recommended Fix:** Re-architect `/api/admin/users` to execute native Tryton model calls against `res.user`, `res.group`, and `gnuhealth.healthprofessional`.
- **Verification Method:** Create a user via Admin UI, restart the Next.js dev/prod server, and verify the user persists and can authenticate.

---

### SEC-05: Missing Password Recovery & Privileged Account Reset Controls
- **CWE:** CWE-640 (Weak Password Recovery Mechanism)
- **Severity:** **HIGH**
- **Affected Files:** `frontend/src/app/login/page.tsx`, `frontend/src/app/api/auth/`
- **Description:** The application lacks a self-service password reset workflow. Users who forget credentials have no recovery path. Furthermore, tenant administrators have no mechanism to securely reset staff passwords without revealing existing passwords.
- **Impact:** Users are forced to seek manual database intervention, creating an operational security hazard.
- **Recommended Fix:**
  1. Implement a forgotten-password request flow issuing single-use, cryptographically random, short-lived reset tokens (HMAC-SHA256, 15-minute expiry).
  2. Implement an authorized administrative password reset endpoint for tenant administrators restricted to users within their assigned tenant scope.
  3. Ensure platform super admin recovery requires MFA and a separate air-gapped emergency protocol.
- **Verification Method:** Execute end-to-end password reset flow with valid and expired tokens; verify password changes in `res.user`.

---

### SEC-06: Insecure Session Cookie Configuration (`secure: false`)
- **CWE:** CWE-614 (Sensitive Cookie in HTTPS Session Without 'Secure' Attribute)
- **Severity:** **MEDIUM**
- **Affected File:** `frontend/src/lib/auth-session.ts` (Line 32)
- **Description:** The `ist_health_session` cookie is configured with `secure: false`.
- **Impact:** In production environments, session cookies containing Tryton user IDs and session tokens could be transmitted over unencrypted HTTP connections, exposing them to interception.
- **Recommended Fix:** Set `secure: process.env.NODE_ENV === "production"`.
- **Verification Method:** Inspect cookie headers over HTTPS; verify `Secure; HttpOnly; SameSite=Lax`.

---

### SEC-07: Optimistic Error Suppression & Fake Success Toasts in Clinical UI
- **CWE:** CWE-390 (Detection of Error Condition Without Action)
- **Severity:** **HIGH**
- **Affected Files:**
  - `frontend/src/app/(app)/physician/page.tsx` (Lines 380–382, 404–406)
  - `frontend/src/app/(app)/laboratory/page.tsx` (Lines 145–151)
  - `frontend/src/app/(app)/radiology/page.tsx` (Lines 116–124)
  - `frontend/src/app/(app)/frontdesk/page.tsx` (Lines 121–125)
- **Description:** Several frontend action handlers catch fetch errors and still display a success message (e.g. *"Clinical Evaluation EVAL-2026-0038 saved successfully"* or *"Laboratory Order certified"*).
- **Impact:** A clinician is misled into believing a clinical diagnosis, lab validation, or patient check-in was safely committed to the patient's medical record when the transaction actually failed. This constitutes a severe clinical safety risk.
- **Recommended Fix:** Remove all optimistic fake success handlers in catch blocks. Display clear, actionable error toasts when backend operations fail.
- **Verification Method:** Simulate backend failure (e.g. network disconnect); verify error banner appears and status is NOT marked as complete.

---

### SEC-08: Absence of Tenant Isolation in API Gateway
- **CWE:** CWE-639 (Authorization Bypass Through User-Controlled Key)
- **Severity:** **HIGH**
- **Affected Files:** `frontend/src/lib/tryton-client.ts`, `frontend/src/app/api/hmis/[...endpoint]/route.ts`
- **Description:** `tryton-client.ts` hardcodes `DEFAULT_COMPANY_ID = 2` across all transactions. The BFF has no tenant resolution logic to isolate requests between multiple hospital clients.
- **Impact:** If multiple hospital tenants connect to the application, they would all read and write to Company 2, resulting in complete cross-tenant clinical and financial data contamination.
- **Recommended Fix:** Implement dynamic tenant resolution in the BFF layer mapping hostnames/headers to dedicated tenant databases or tenant company IDs.
- **Verification Method:** Multi-tenant isolation test: verify Tenant A cannot read Tenant B's patient records.

---

### SEC-09: Lack of Rate Limiting & Brute-Force Abuse Protection
- **CWE:** CWE-307 (Improper Restriction of Excessive Authentication Attempts)
- **Severity:** **MEDIUM**
- **Affected File:** `frontend/src/app/api/auth/login/route.ts`
- **Description:** `/api/auth/login` does not rate-limit incoming authentication attempts, permitting automated dictionary attacks against user passwords.
- **Recommended Fix:** Implement IP and username-based rate limiting (5 failed attempts per 5 minutes per IP) with temporary lockouts.
- **Verification Method:** Send 10 consecutive failed login requests; verify HTTP 429 Too Many Requests response.
