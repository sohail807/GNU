# Antigravity Implementation Brief: GNU Health Frontend Completion

**Purpose:** Use this document as the implementation and verification brief for completing the custom frontend against the existing GNU Health / Tryton backend in this repository.

**Repository reviewed:** GNU Health HMIS workspace, including `frontend/`, `his/tryton/`, API routes, configuration, handover documents, and existing evidence under `reports/`.

**Review date:** 2026-09-25  
**Review type:** Static code and documentation audit. No live transactions were run during this review.  
**Target locale/currency:** Qatar (`QAT`), Qatari Riyal (`QAR`, 2 decimal places), Asia/Qatar time (UTC+03:00).

---

## 1. Mission

Complete the existing Next.js frontend so Qatar clinic users can carry out the backend-supported outpatient workflows end to end through the custom frontend. Preserve GNU Health / Tryton as the sole system of record and business rules engine. Do not replace, fork, or simulate the backend.

The deliverable is a secure, accessible, responsive, production-deployable frontend that calls the deployed Tryton JSON-RPC API using each user’s authenticated session, reflects actual backend state, and can be demonstrated using synthetic data. Complete implementation, run the verification listed below, fix defects found, and produce evidence and an honest go-live readiness report.

Do not treat a page existing, a button clicking, an HTTP 200, seeded data, or a previous backend-only test as proof of an end-to-end frontend workflow.

## 2. Authority and constraints

1. **Authoritative system:** GNU Health HMIS on Tryton 7.0 / PostgreSQL. All patient, clinical, diagnostic, accounting, and identity records remain in native Tryton models.
2. **Integration:** Use authenticated Tryton JSON-RPC 2.0 only. No direct SQL, parallel database, shadow model, second RBAC store, or frontend accounting engine.
3. **Business rules:** Use native model methods and workflow actions for state transitions. Do not set terminal states directly when a backend action exists.
4. **Security:** No hardcoded passwords, service credentials, session tokens, or production secrets. Never ship these in a client bundle or logs. Use per-user backend sessions. TLS is mandatory for production.
5. **Data:** Use synthetic identities and records for testing/demo. Never modify or delete real patient records or posted accounting moves. Search for and update an existing patient rather than creating a duplicate.
6. **Qatar context:** Derive company, currency, locale, timezone, company-specific accounts, payment methods, and catalogs from the authenticated tenant/company. Do not infer currency from a label or hardcode database IDs. Verify all financial amounts against the backend in QAR.
7. **Preserve user work:** The repository currently contains many modified and untracked files. Inspect `git status` before work and do not overwrite or discard existing user changes.
8. **Claims:** Distinguish source inspection, build/lint, API tests, backend audits, and real browser workflows. Cite dated evidence and don’t call a gate passed without running it.

## 3. Repository reality found in this audit

The custom app is under `frontend/` (Next.js 16 / React 19). It has screens for front desk, patient registration/chart, appointments, nursing, physician, laboratory, radiology, billing, and admin. Server-side API routes exist for authentication, patients, appointments, triage, consultations, prescriptions, laboratory, radiology, billing, ledger, pathology/medicament lookup, and staff administration.

The repository also contains a Tryton source tree at `his/tryton/health/` and Qatar/backend specifications such as `02_GNU_HEALTH_API_INTEGRATION_SPECIFICATION.md`, `03_GNU_HEALTH_DATA_MODEL_AND_WORKFLOW_REFERENCE.md`, `04_GNU_HEALTH_RBAC_AND_SECURITY_CONTRACT.md`, `05_GNU_HEALTH_FRONTEND_INTEGRATION_GUIDE.md`, and `GNU_HEALTH_CONFIGURATION_BASELINE.md`.

The local source tree contains many additional GNU Health modules (including inpatient, ICU, surgery, gynecology, pediatrics, insurance, stock, EMS, dentistry, ophthalmology, and others). Their presence in `his/tryton/` does **not** prove they are installed, activated, configured, or in the clinic's approved scope. The current `FINAL_REQUIREMENTS_BASELINE.md` explicitly calls inpatient/bed/ICU/surgery dormant/out of scope for the outpatient clinic. Antigravity must inventory the **actual active modules and their clinic-approved scope** before concluding what “entire backend” means. Implement all active and approved workflows in scope; for active modules excluded from client use, document why and ensure no misleading frontend link advertises them. Do not build a UI for every source directory indiscriminately.

Existing success reports need careful interpretation:

- `frontend_integration_test_results.json` exercises backend Tryton models directly; it is not evidence that the custom Next.js app completed those workflows.
- `reports/LIVE_BROWSER_TRANSACTION_TEST.md` describes tests against the native Tryton SAO client, not the custom Next.js frontend.
- Backend readiness documents are inconsistent and are not a substitute for checking the current server. Some describe TLS/443 as staged, HTTP as active, and other live go-live gates as pending. The deployment guide must report verified current state, not copy a contradictory claim.
- `07_GNU_HEALTH_FRONTEND_HANDOVER_CHECKLIST.md` is marked entirely unchecked. Reconcile it with the actual implementation and new evidence rather than assuming either its checkboxes or narrative are current.

### Confirmed source-level defects to address first

| Priority | Finding | Required correction |
|---|---|---|
| **P0 Security** | `frontend/src/lib/tryton-client.ts` contains hardcoded backend/admin credential fallbacks and `executeSystem()` attempts demo/admin logins. | Remove all embedded credential fallbacks and privileged background login paths. Fail closed when required configuration is absent. Rotate any exposed credential through the authorized operations process; do not repeat it in logs/docs. |
| **P0 Security** | `frontend/src/lib/auth-session.ts` stores all session claims in a base64-encoded unsigned cookie with a seven-day lifetime. | Use an integrity-protected server-side session or signed/encrypted cookie with short, explicit expiry, secure production cookie flags, revocation/rotation, tenant binding, and CSRF protection for mutations. Never trust client-editable role/group claims. |
| **P0 Security** | Admin UI route rendering checks authentication only. Admin API GET checks authentication only; POST uses `session.role` from the cookie as its admin gate. | Enforce admin authorization server-side on both page and every admin API operation using authoritative verified Tryton groups/permissions. Restrict directory data to authorized administrators. Keep Tryton ACLs authoritative too. |
| **P0 Security / function** | Staff reset route writes `res.user.password`, returns the temporary password to the browser, and generates it with `Math.random()`. UI promises forced change at next login, but no such flag or flow is implemented. | Implement a secure reset lifecycle supported by the actual Tryton version: cryptographically secure one-time secret or approved reset flow, expiry, forced-change behavior if supported, audit event without password, safe delivery or one-time display, session invalidation, and recovery UX. Verify the precise native password API before using it. |
| **P0 Security** | New staff provisioning falls back to a shared hardcoded initial password. | Provision without a common password. Use the approved invitation/activation/reset process and require first-login credential setup if supported. |
| **P1 Function** | Admin access-matrix UI sends `permissions`, but `frontend/src/app/api/admin/users/route.ts` ignores it. “Save” can report success although no override is persisted. | Remove unsupported per-module overrides or define a valid mapping to native Tryton groups/ACLs with backend-owned persistence. Prefer native groups/record rules and make the UI accurately show only effective permissions. Never imply a custom UI matrix enforces security. |
| **P1 Function** | Admin edit form submits department, email, phone, and name, but API writes only name, active status, and groups. | Persist fields only where native models support them, using `res.user` and related native party records correctly; otherwise render those fields read-only/not editable and explain their source. |
| **P1 Data integrity** | Patient API substitutes sample QID, DOB, age, and blood-group values when backend fields are absent; other API handlers synthesize dates, references, states, and display values. | Remove fabricated clinical/identity/financial values. Represent unavailable data as null/unknown, use real date formatting, and expose backend state faithfully. No fake patient identifiers or demographics. |
| **P1 Data integrity** | Patient update route reports phone/emergency contact/address as updated although it writes only `critical_info`. | Persist supported fields using the correct native party/address/identifier models, or don’t offer/report edits for fields not persisted. Preserve backend constraints and existing-record search/update behavior. |
| **P1 Workflow** | Triage and consultation routes create separate evaluations. Consultation does not continue the existing triage evaluation/appointment chain and can create a signed record by setting `state` directly. | Select and update the correct in-progress evaluation; link patient, appointment, clinician, and episode; use `end_evaluation` to sign; lock/read-only after backend confirmation. Make multi-record actions atomic where possible or report partial success and provide recovery. |
| **P1 Workflow** | Some frontend routes directly write workflow states instead of using native Tryton actions. | Verify each transition against source/version and call the actual backend method/wizard (`end_evaluation`, `create_prescription`, lab criteria/result/document action, imaging request/result action, invoice post/pay). Don’t guess action signatures. |
| **P1 Integration** | Generic `/api/hmis/[...endpoint]` route omits the session tenant database/company when calling Tryton and maps all exceptions to 500. | Scope all RPCs to authenticated tenant/company, validate permitted model/methods or remove the generic route, preserve proper HTTP statuses, and normalize Tryton errors safely. |
| **P1 Auth** | Logout clears the frontend cookie but doesn’t call native Tryton logout; backend session expiry/re-authentication and unsaved-form recovery aren’t implemented. | End the native session where supported, revoke local session, handle expiry/401 centrally, preserve unsaved form state in memory, and require re-authentication safely. |
| **P1 Qatar / financial** | Tenant/configuration choices include non-Qatar examples; code uses numeric company defaults and hardcoded/default account codes in places. | Make the intended Qatar tenant explicit and selectable only when configured. Derive company/currency/accounts/payment methods/catalogs from Tryton; render monetary amounts using server currency and QAR precision. Reject incompatible currency/company selection for Qatar workflows. |
| **P2 UX** | Empty/failed directory load silently retains hardcoded sample staff. Date/time/state fallback labels can mislead operators. | Show explicit loading, empty, and error states. Never silently replace live data with demo records. Clearly separate any deliberately enabled demo tenant from live mode. |
| **P2 Governance** | Admin UI displays seeded audit logs and static claims (e.g. certified account count, backup pass) as if live. | Replace with native auditable events/live status or clearly label/remove demo-only content. Do not claim backup, audit, or zero-trust controls unless supported and verified. |

These are confirmed by static source inspection. Antigravity must verify whether additional defects exist and update severity/status based on implementation and real evidence.

## 4. Required product scope: close every backend-supported user workflow

Build and verify all applicable modules below. For every form: load options from live authorized Tryton catalogs; validate required fields client-side for usability and rely on backend rules for authority; show loading/success/error/empty states; refresh from the backend after mutations; prevent duplicate submissions; handle expired sessions; preserve safe user-entered draft state; and show actual backend record IDs/references/state.

### A. Authentication, tenant, and account security

- Login via `common.db.login` with the selected configured tenant database and per-user credentials.
- Obtain authoritative user display data, company context, and effective Tryton groups; don’t map admin from username text or client claims.
- Enforce HTTPS in production, secure HTTP-only SameSite cookies, CSRF protections, session expiry/re-authentication, logout/revocation, and no persistent plaintext password/token storage.
- Provide correct unauthorized, access-denied, network, timeout, invalid-credential, and backend-maintenance handling.
- Remove all default/demo password login paths and production credential fallbacks.

### B. Patient registration, identity, and longitudinal chart

- Search existing patients/parties by name, PUID, and Qatar QID before registration; use native uniqueness constraints and never auto-create a duplicate.
- Register `party.party` then `gnuhealth.patient` as a safe operation with duplicate/error recovery and show the backend-generated PUID.
- Follow the Qatar requirements baseline for legal name (English/Arabic where supported), date of birth, sex, QID or passport plus issuing country, nationality, residence/language where configured, contact/address, and emergency contact. Read and update only supported actual demographic/address/identifier fields; never fabricate missing values.
- Unified chart shows actual linked appointments, evaluations, diagnoses, prescriptions, lab, radiology, services, invoices, and balances subject to native record access.

### C. Front desk and appointment lifecycle

- Search/select patient and clinician from live catalogs; book with the actual appointment date/time and clinic schedule constraints.
- Show exact backend appointment states and legal actions. Check-in must transition via the verified backend-supported action and then refresh.
- Do not invent schedule slots, appointment IDs, dates, clinician names, or state labels.

### D. Nursing triage

- Create/update the appropriate patient evaluation for the checked-in appointment, including supported vitals: BP, heart rate, temperature, respiratory rate, SpO2, weight, height, BMI, complaint.
- Validate numeric ranges and units as UX; display backend-computed values as authoritative.
- Persist triage once and make the in-progress evaluation available to the physician flow.

### E. Physician consultation, diagnosis, and prescription

- Continue the same encounter/evaluation and display existing triage data.
- Provide SOAP/clinical notes, live ICD-10/pathology search, clinician identity, and discharge data supported by the backend.
- Sign only via the native evaluation completion method; confirm signed state from backend and make record read-only.
- Prescribe using live medicament/form/route/unit catalogs; collect dose, frequency, duration, quantity, indication, and mandatory safety acknowledgement.
- Execute native `create_prescription`; display backend result and lock completed prescription as required.

### F. Laboratory and radiology

- Laboratory: load live test types, create/link order to patient and encounter, call `complete_criteareas`, display criteria, ranges and units, allow result entry, and use the verified finalization method (`generate_document` or actual configured workflow).
- Radiology: load live study catalog, create and transition request using actual native action(s), capture findings in the correct native field (the handover specifies `comment` displayed as “Additional Information”), generate results using the actual method, and display linked result/status.
- Failed downstream orders must not silently leave a partially complete consultation. Display which records succeeded and an operator recovery action.

### G. Services, billing, cashier, and accounting

- Use native health-service/catalog/tariff data and invoice/payment workflows. Never calculate/post ledger entries in the frontend.
- Confirm whether health-service aggregation exists and is enabled in this configured deployment; don’t claim automatic aggregation unless live evidence shows it.
- Display server-returned invoice line values, totals, taxes, currency, invoice state, amount to pay, payment methods, and reconciled status. Currency should resolve to `QAR` for the Qatar company.
- Post invoice with the native action, lock posted data, execute the configured native payment wizard, then refresh and show the resulting paid/reconciled state.
- Ledger views are read-only and authorized; show actual balanced debit/credit entries only when role ACL permits. Don’t grant cashier ledger access based only on frontend UI.

### H. User administration and password lifecycle

- Admin-only staff directory from live `res.user` and native party/profile data. No seeded fallback presented as real.
- Show effective native groups/role, active status, and supported profile data. Make profile fields read-only unless a real write is implemented.
- Provision accounts using an approved onboarding lifecycle; assign only validated native Tryton groups; handle user/party/profile creation partial failures with rollback or recovery.
- Role changes must preserve required baseline Tryton groups and must be blocked for unauthorized operators. Don’t overwrite groups with a guessed short list.
- Access matrix must accurately represent native Tryton group/ACL/record-rule effective permissions. If the backend has no per-user module overrides, the UI must not claim they can be saved.
- Implement the secure password reset behavior in Section 3. Test reset with a synthetic user and verify old-password failure, new-password success, session invalidation, and first-login behavior without exposing credentials in logs/evidence.
- Admin actions and reset events must be auditable without recording secrets.

### I. Installed-module and clinic-scope completeness inventory

- Query the actual target database's installed/activated Tryton modules, module versions/states, model registry, menus/actions, and role ACLs. Compare that with `his/tryton/` source and the approved functional requirements; the source tree alone is not runtime truth.
- Produce a traceability matrix with one row per active, clinic-approved backend capability: module/domain, native models, supported methods/actions, state machine, role, frontend route/component, API handler, test case, and status. Include any currently enabled insurance/claims, stock/pharmacy, appointments/calendar, health services, reporting/document, portal, and master-data capability that is in approved scope.
- Reconcile the explicit dormant/out-of-scope modules in `FINAL_REQUIREMENTS_BASELINE.md` with the live installation and stakeholder-approved demonstration scope. Clearly mark excluded/dormant items and why. Raise scope conflicts instead of silently dropping or inventing features.
- Do not call the frontend “complete” until every active and approved domain in the inventory is implemented or an authorized, documented scope decision excludes it.

## 5. Integration architecture requirements

- Keep all Tryton calls server-side in Next.js route handlers or a server-only service. Never expose backend credentials or Tryton session tokens in browser JavaScript.
- Use one typed JSON-RPC client with validated method arguments, tenant database/company context, request timeout, safe retry policy for idempotent reads only, request correlation IDs, and normalized typed errors.
- Do not retry create/write/post/pay calls blindly. Protect against double submission and use backend idempotency/record checks when available.
- Pass context correctly as required by Tryton 7.0 and confirm JSON-RPC serialization for date/time, relation IDs, and domain filters against the actual API.
- Bind each session to the authenticated user, tenant, company, and verified group state. A browser-supplied tenant ID, role, company ID, or user ID is untrusted until authorized server-side.
- Validate incoming IDs, action names, body sizes, and fields. Avoid a generic arbitrary-model RPC proxy unless access is explicitly restricted and reviewed.
- Map Tryton `AccessError`, `UserError`, validation/constraint errors, session-expired responses, and transport failures to safe status codes and actionable UI messages. Don’t leak stack traces, SQL, tokens, or sensitive patient details into logs.
- Use environment configuration for non-secret endpoints and secure secret provisioning for server-only secrets. Provide a sanitized `.env.example`; never commit actual `.env` or private material.
- Remove/deactivate unused mock values, hardcoded IDs, placeholder demographics, stale tenant database defaults, demo staff, and false “production” claims from live paths.

## 6. Verification plan and required evidence

Run checks in a safe development/UAT environment using synthetic records and approved credentials. Do not run destructive cleanup against the live database. If live read-only checks or a browser UAT need network/credentials that are unavailable, document the exact missing dependency and leave that gate **NOT VERIFIED**.

### Gate 1 — Static and security review

- Trace each frontend screen and API action to its actual backend model/method and documented state machine.
- Search frontend source, built client output, logs, and Git diff for credential/password/token leaks, direct DB clients, fabricated values, bypasses, and debug routes.
- Verify route-level authz for every protected page and API method; test direct URL/API access as each synthetic role.
- Verify HTTP-only secure cookies, session integrity/expiry/revocation, CSRF posture, input validation, log redaction, TLS enforcement, security headers, and dependency posture.
- Confirm all reporting says whether findings are source-inspected or live-tested.

### Gate 2 — Build and quality

- Install only from the existing lockfile; run frontend lint, typecheck (if configured), and production build.
- Fix all errors/warnings relevant to production operation; record exact command, timestamp, exit status, and any environment limitation.
- Confirm responsive behavior, keyboard use, accessible labels/focus/errors, and no console errors on the supported browsers/viewports.

### Gate 3 — API contract and role tests

- Verify login, wrong password, logout, session expiry, tenant/company scoping, JSON-RPC error mapping, and lookup catalogs.
- For each operational role, confirm allowed actions succeed and disallowed direct API actions are rejected by Tryton with `AccessError`/appropriate denial.
- Use synthetic users for add/edit/activate/suspend/group assignment/password reset; prove backend persistence by re-reading through Tryton after each mutation.
- Verify a saved access matrix corresponds to backend effective group permissions; no frontend-only authority.

### Gate 4 — Custom frontend browser E2E

Execute the entire workflow in the **custom Next.js frontend**, not SAO and not direct model/API scripts:

1. Front Desk login → find-or-register synthetic patient → verify backend-generated PUID.
2. Book appointment → check in → verify exact backend state.
3. Nurse login → record triage on encounter → verify persisted vitals and evaluation identity.
4. Physician login → continue that evaluation → diagnosis/SOAP → native sign action → verify immutable signed state.
5. Prescribe and safety acknowledgement → native create action → verify persisted prescription/lines/state.
6. Lab and radiology order → result entry → native finalization → verify linked reports and states.
7. Cashier login → services/invoice → native post/pay flow → verify QAR values, paid state, and reconciled balance.
8. Authorized auditor read-only ledger review → verify backend balanced move; unauthorized roles are denied.
9. Admin-only directory, provisioning, group/access changes, suspension, and password reset lifecycle using a synthetic user.
10. Verify patient chart shows all related records and refreshes from Tryton; test browser refresh/re-login and recovery from an interrupted request.

Record screenshots only from genuine browser sessions. Mask all patient identifiers, usernames/passwords, session values, host secrets, and personal data. Save sanitized test logs and API response evidence. Track created synthetic record IDs so cleanup is deliberate and permitted; do not delete posted accounting data or real clinical data.

### Gate 5 — deployment and presentation readiness

- Verify actual target hostname, DNS, CA-signed HTTPS, HTTP→HTTPS redirect, TLS configuration, secure cookies, security headers, reverse proxy behavior, and that Tryton/PostgreSQL ports are not publicly exposed.
- Verify production environment configuration, secrets delivery, build/start commands, process supervision, health/readiness checks, logs/monitoring, backup/restore ownership, rollback procedure, and deployment artifact version.
- Verify tenant/company is the Qatar company, currency is backend QAR, timezone/date display is Qatar local, and official clinic name/logo/contacts/tariffs are supplied or visibly marked as demo placeholders.
- Do not represent the project as production-ready until security, clinical workflow, accounting, infrastructure, backup/restore, and client presentation gates have real evidence and sign-off.

### Evidence files to deliver

- `reports/frontend_end_to_end_audit.md` — current findings, scope, limitations, gate status, and evidence links.
- `reports/frontend_e2e/` — dated sanitized browser screenshots, test run logs, and workflow IDs/traceability.
- Updated API/workflow mapping and `07_GNU_HEALTH_FRONTEND_HANDOVER_CHECKLIST.md` with each item marked Pass / Fail / Not Verified and linked evidence.
- Deployment runbook including environment variables (names only), build/release/rollback/health-check instructions; no secrets.
- Final client demo readiness summary and separate production go-live decision, each supported by evidence.

## 7. Completion acceptance criteria

The task is complete only when all of these are true:

- Every backend-supported workflow in Section 4 has a functioning frontend screen and server API path, with native backend state and relationships verified after refresh.
- There are no fabricated medical, identity, workflow, financial, or staff values presented as live data.
- No secrets/default credentials are in source, Git history added by this task, logs, or client bundle; authentication and authorization pass positive and negative tests.
- User access controls map to real Tryton groups/ACLs; admin operations and password lifecycle are effective, least-privilege, and auditable.
- Every clinical and financial state transition uses the verified native Tryton action/wizard; QAR amounts and ledger values reconcile against backend records.
- Frontend-specific browser E2E completes end to end with genuine, sanitized evidence; backend-only/API-only/SAO runs are not counted as frontend E2E.
- Production build and security gates pass; HTTPS and deployment/rollback/backup readiness are verified on the actual target environment.
- The handover/checklist and final report accurately mark unresolved items. If a production gate cannot be verified, report **Not Production Ready** rather than assuming success.

## 8. Suggested implementation order

1. Establish a reproducible baseline; inspect and preserve current workspace changes. Map every page → API route → Tryton model/method → state transition.
2. Fix credential/session/authorization architecture and remove unsafe fallback/mocked live data.
3. Fix shared RPC, tenant/company context, error normalization, and live catalog lookups.
4. Complete identity/registration, scheduling/check-in, and one linked triage→consultation episode.
5. Complete prescription, lab, radiology, service billing, payment, and read-only accounting workflows.
6. Repair user administration and implement secure provisioning/access/reset lifecycle.
7. Run unit/API/role/browser checks in UAT; fix issues and repeat. Capture actual custom-frontend evidence.
8. Verify production deployment gates and client presentation content; publish honest reports and checklist.

Work in small reviewable changes. After each phase, report files changed, behavior implemented, verification commands/evidence, defects remaining, and deployment readiness. Do not deploy, modify live security groups/passwords, change accounting configuration, or perform destructive cleanup without the appropriate authorization and operational procedure.

---

## 9. Source documents to reconcile during implementation

- `01_GNU_HEALTH_BACKEND_EXECUTIVE_HANDOVER.md`
- `02_GNU_HEALTH_API_INTEGRATION_SPECIFICATION.md`
- `03_GNU_HEALTH_DATA_MODEL_AND_WORKFLOW_REFERENCE.md`
- `04_GNU_HEALTH_RBAC_AND_SECURITY_CONTRACT.md`
- `05_GNU_HEALTH_FRONTEND_INTEGRATION_GUIDE.md`
- `06_GNU_HEALTH_BACKEND_TEST_AND_CERTIFICATION_SUMMARY.md`
- `07_GNU_HEALTH_FRONTEND_HANDOVER_CHECKLIST.md`
- `08_GNU_HEALTH_BACKEND_API_HANDOVER_INDEX.md`
- `GNU_HEALTH_CONFIGURATION_BASELINE.md`
- `PRODUCTION_READINESS_ASSESSMENT.md`
- Existing frontend source in `frontend/src/` and native models in `his/tryton/health/`

When these documents conflict with deployed behavior or source, verify against the actual Tryton API/server and update the documents. Never resolve a conflict by inventing an endpoint, field, permission, currency, menu, or workflow method.
