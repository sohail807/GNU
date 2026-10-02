# GNU Health frontend production audit

**Status: not production ready.** The frontend is deployed as an isolated, localhost-only test service on the existing GNU Health server. This is a deployment smoke check, not production certification or authenticated end-to-end workflow evidence. Use only an authorized GNU Health account and verified synthetic records in the configured test database.

## Scope inspected

The frontend Next.js application was reviewed across its API routes, auth/session and tenant libraries, access-control and Tryton client code, route/page implementations, and environment/deployment configuration. Routes present in the build include login, admin, front desk registration and appointments, patient list/chart, nursing, physician, laboratory, radiology, billing, and JSON-RPC endpoints. The backend calls visible in source target native Tryton/GNU Health models such as `res.user`, `res.group`, `party.party`, `gnuhealth.patient`, `gnuhealth.patient.evaluation`, `gnuhealth.appointment`, `gnuhealth.lab`, `gnuhealth.imaging.test.request`, and `account.*`.

## Changes made in this audit

- Removed embedded backend host/database/company assumptions, demo credentials, and `executeSystem` access. Runtime configuration now requires `GNUHEALTH_HOST`, `GNUHEALTH_DATABASE`, and `GNUHEALTH_COMPANY_ID`; production requires HTTPS. Added a placeholder-only `frontend/.env.example`.
- Replaced the unsigned base64 session cookie with authenticated AES-GCM encryption, an eight-hour expiry, HTTP-only/SameSite cookie attributes, and fail-closed `SESSION_ENCRYPTION_KEY` handling. Logout attempts native `common.db.logout` and clears the local session.
- Login now derives its display role from live Tryton group names and fails to a general role when group lookup is unavailable. Admin APIs re-read the current user’s Tryton groups before allowing staff operations.
- Removed demo/default credential prefill and disabled password-recovery endpoints that had no real delivery/reset service. The previous mailer claimed delivery while only writing to a local spool.
- Removed the fake seeded staff directory and the UI controls that implied unsupported per-module permission overrides were saved. Staff administration now uses Tryton users/groups, generated one-time passwords, and explicit unsupported-field handling.
- Disabled the custom billing POST operations. The old endpoint trusted browser-supplied prices and could report successful posting/payment after swallowing Tryton errors or directly writing accounting state.
- Removed fabricated ledger dates, account codes/names, and balancing lines from the ledger GET response. Removed made-up invoice dates, patient references, amounts, and line-item values from invoice GET responses.
- Sanitized login failures so Tryton host/database exception details are not returned to the browser.
- Removed Google Fonts network fetches from the build so the Linux server can compile offline with system font fallbacks.
- Added a test-environment warning banner; the isolated instance is pinned to `gnuhealth_test_alpha`, company 2 (QAR), and `127.0.0.1:3001`. It has a separate systemd service, encryption key, and revocation directory. The existing frontend on port 3000 and Nginx were left unchanged.
- Removed false patient-update success on network errors, added live patient search/selection before updating `critical_info`, and removed contact fields the API did not persist.
- Removed unsupported accreditation, facility, privacy-law, and security claims from the login screen; it now identifies the configured GNU Health workspace and shows a test-environment notice in test builds.
- Hid the sample billing, laboratory, and imaging screens in test builds. Their write endpoints now fail closed until native GNU Health accounting, laboratory criteria/certification, and imaging workflows are integrated. Prescription writes also fail closed pending native line validation and `create_prescription`.
- Removed invented patient/order values from laboratory, radiology, and prescription API read serializers; no fabricated clinical result is returned when a native value is missing.

## Findings that still block production

### Critical: clinical demo data remains in production code paths

The test build hides the billing, laboratory, and imaging sample screens. Other production code paths still require a full pass for hard-coded patients, medication/diagnosis examples, placeholder vitals, and success copy after failed reads. The production build must remove these fixtures or move them into explicitly isolated development-only fixtures. Until then, do not serve real patient records through this frontend.

The patient serializer no longer fabricates missing PUID, QID, DOB, age, gender, blood group, active status, or allergy information. Patient creation remains a multi-step `party.party` then `gnuhealth.patient` operation without a verified atomic rollback strategy; a second-step failure can leave an orphan party. API behavior has not been exercised against a synthetic record in the deployed test database.

### Critical: clinical lifecycle integration is not end to end

The consultations endpoint now uses GNU Health evaluation completion. Laboratory, imaging, prescription, and billing writes are disabled pending native workflows. Appointment and triage creation and staff administration still need role-by-role positive and negative API tests against actual Tryton ACLs, including verification of every field and workflow method on the installed module set.

### Critical: billing is intentionally unavailable pending native accounting integration

Billing mutations now return HTTP 501 because the old path was unsafe. The billing page still contains USD/$50/sample invoice, patient, voucher, and ledger-summary copy and must be redesigned to use the configured Tryton currency, actual product/catalogue prices, journals, native invoice/payment wizards, and server-returned records. Do not enable billing for presentation or live transactions until that work and accounting reconciliation are verified on a synthetic dataset and the approved company.

### High: session revocation storage is not suitable for a multi-instance/serverless deployment

The encrypted cookie is integrity-protected, but revocation state is stored in a local JSON file under `.tokens` unless `SESSION_REVOCATION_DIR` is set. Local filesystem state may not be shared across instances, may be ephemeral, and file read/modify/write is not a distributed atomic store. Use an approved shared session/revocation store or rely on a documented backend session policy, then test logout and revocation across instances. Review the eight-hour session lifetime against the clinic’s security policy.

### High: role mapping is an unverified approximation of Tryton security groups

`access-control.ts` and `api/admin/users/route.ts` map friendly frontend roles to group-name assumptions. The live group names, translated names, implications, overlapping roles, user creation requirements, and every API method’s ACL have not been verified on the target database. Frontend role flags are presentation hints only and must never be treated as authorization. Validate every role with positive and negative API tests against native Tryton ACLs; confirm role assignment cannot remove necessary system groups or grant unintended groups.

### High: generic JSON-RPC proxy exposes arbitrary model/method dispatch to the signed-in user

`frontend/src/app/api/hmis/[...endpoint]/route.ts` forwards a client-selected model, method, parameters, and context. Native Tryton authorization still applies, but this broad proxy expands the callable surface and returns backend errors directly. Restrict it to an explicit allowlist of required read/workflow operations or remove it, validate request/context schemas, and sanitize errors.

### High: error handling, API schemas, and lint remain incomplete

Many routes use `any`, return backend exception text, accept loosely typed inputs, or perform multi-step creates without transaction/compensation. Partial writes can leave orphaned party/patient, order, invoice, or evaluation records. `npm run lint` currently reports **153 errors and 105 warnings**, largely `no-explicit-any` and unused imports. Replace untyped Tryton boundaries with validated DTOs, validate IDs/enums/amounts/required fields, avoid exposing clinical or infrastructure details, and define safe handling for partial failures.

### High: production/deployment and Qatar operational readiness are unverified

The deployed test instance is private and bound to loopback. Public TLS/domain access was not configured; the existing site is HTTP-only and the DNS name did not resolve at audit time. The server-side test database/company pairing and QAR currency were confirmed by read-only inspection, but fiscal year, chart of accounts, product catalogue, journals, tax setup, backup/restore, monitoring, privacy content, and role ACLs remain unverified. Do not expose this test instance publicly.

### High: password recovery and operational controls are incomplete

Forgot/reset-password routes return unavailable responses because no verified delivery/reset service exists. Session revocation uses a local file and is not a shared, atomic multi-instance store. Login rate limiting, CSRF review, security headers/CSP, secret rotation, audit logging, and lockout policy remain incomplete. The test instance has no verified test-user credential; no authenticated workflow or patient data operation was performed.

## Verification performed

- Updated visible application branding and login copy to use “Health Workspace” without backend product branding. Added [TENANT_ONBOARDING_AND_ISOLATION.md](TENANT_ONBOARDING_AND_ISOLATION.md) documenting the single-workspace limitation and the operator-managed onboarding process.
- Rebuilt and deployed the revised source to the isolated GCP test service at `/var/www/ist-health-frontend-test`; the service restarted active on loopback port 3001. Login returned HTTP 200 and `/api/auth/me` returned HTTP 401 without a session.
- Unauthenticated browser-route sweep: `/frontdesk`, registration, appointments, patient list, nursing, physician, laboratory, radiology, billing, and admin returned HTTP 307 to the sign-in route. Protected API GETs for auth/me, patients, appointments, consultations, triage, laboratory, radiology, prescriptions, billing, and admin/users returned HTTP 401.
- Refreshed the in-app browser at `http://127.0.0.1:3101/login`; it displayed “Health Workspace (QAR)” and the synthetic-data-only test banner. The local SSH tunnel remains available.
- These checks cover compilation, deployment health, and unauthenticated access boundaries only. No authorized credentials were available, so authenticated workflow, transaction, role-positive, and cross-tenant end-to-end behavior remains unverified.

- `npm run build` in a clean local copy with `NEXT_PUBLIC_DEPLOYMENT_MODE=test`: passed, including production compilation, TypeScript, and static page generation. The normal workspace `.next` had a Windows reparse/read-only file that blocked writing, so the clean copy was used.
- `npm run build` in `/var/www/ist-health-frontend-test` on Linux: passed. The app and TypeScript routes compiled with Next.js 16.3.6.
- Test deployment smoke check: systemd service active; `/login` returned HTTP 200; `/api/auth/me` without a cookie returned HTTP 401; port 3001 listens only on `127.0.0.1`; port 3000 remained active. Test warning is present in generated static assets.
- Browser inspection through the SSH tunnel confirmed the revised login page, GNU Health workspace label, and visible test-environment notice. No credentials were entered and no authenticated test was performed.
- Through the tunnel, unauthenticated GET requests to `/api/clinical/patients`, `/api/clinical/appointments`, `/api/admin/users`, `/api/clinical/laboratory`, and `/api/clinical/prescriptions` each returned HTTP 401.
- `npm run lint`: failed with 153 errors and 112 warnings, mostly explicit `any` and unused imports.
- No authenticated Tryton API workflow, patient read/write, clinical order, role-negative test, browser workflow, or financial operation was run. Patient records in the test database were not opened or changed.

## Release decision

**Do not deploy this frontend publicly or use it for client demonstrations with real patient data or live clinical/financial operations yet.** The isolated test instance is available only through an SSH tunnel. The build and unauthenticated HTTP responses passed; the remaining UI fixtures, disabled workflows, missing credentials, lint findings, security controls, and operational checks prevent production approval. Complete native workflow integration, verify synthetic test users/data and ACLs, run authenticated browser/API end-to-end and negative tests, resolve lint/security issues, and configure TLS/monitoring/backups before any public or production deployment.
