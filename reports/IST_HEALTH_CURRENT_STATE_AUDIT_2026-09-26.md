# IST Health current-state audit

**Date:** 2026-09-26  
**Scope:** Repository evidence for GNU Health backend, IST Health frontend, workflow integration, multi-tenancy, and QAR.  
**Method:** Read-only source and documentation inspection. No live patient records, credentials, database, or production service were accessed during this pass. This is not a live functional certification.

## Executive finding

IST Health has a substantial GNU Health/Tryton source tree and a Next.js frontend with real authenticated JSON-RPC integrations for several workflows. It is **not established as a complete end-to-end frontend for all GNU Health functionality**, and the evidence reviewed does not support a claim that the whole system is currently working in live operation. The latest frontend audit in the repository explicitly calls the deployment a test service and not production ready. Authenticated workflow execution was not demonstrated in this audit.

| Question | Finding | Evidence strength |
|---|---|---|
| Is GNU Health backend code present? | Yes. The workspace includes GNU Health/Tryton modules under `his/tryton`. Repository documents list a core activated set, but the live module activation/configuration was not independently checked now. | Source presence; activation is documentary only |
| Does IST Health have a frontend? | Yes. 13 page files cover login, front desk, registration/appointments, patients/chart, nursing, physician, laboratory, radiology, billing, and admin. There are 17 API route files, including fail-closed password-recovery routes. | Direct source inspection |
| Is every backend module/workflow covered end to end? | No. The UI is a subset of GNU Health functionality. Laboratory/radiology writes are disabled in test mode, billing writes return HTTP 501, and some UI elements still contain stale sample/USD content. Inpatient, surgery, pediatrics, gynecology, dentistry, ophthalmology, EMS, ICU, PACS and other upstream functions do not have corresponding complete frontend workflows in the inspected route inventory. | Direct source inspection; workflow execution not tested |
| Is it genuinely multi-tenant? | No, not as currently configured in source. The registry contains one workspace (`qatar-outpatient`); database and company come from one server environment configuration. A tenant selector is not tenant provisioning or isolation. | Direct source inspection, consistent with onboarding document |
| Is QAR configured? | Yes for primary company 2 in live `gnuhealth`: QAR (ر.ق). All 20 invoices are QAR; one open fiscal year, 12 open standard periods, active cash/revenue/general/expense/write-off journals, and 28 posted moves were observed. Zero posted moves were unbalanced per move. Billing UI still contained USD/sample content at inspection. | Current read-only live SQL plus direct source inspection; no financial action was executed |
| Can production readiness be claimed? | No. The latest frontend audit says not production ready and reports missing authenticated role/workflow tests, operational controls, and unresolved lint findings. | Dated repository audit; not independently rerun |

## Key source findings

1. `frontend/src/lib/tenant.ts` defines only `qatar-outpatient`. `resolveTenant` reads a single `GNUHEALTH_DATABASE` and `GNUHEALTH_COMPANY_ID` from server environment variables. This is one configured workspace, not a dynamic tenant registry or per-tenant database routing system. Company context is passed to some Tryton calls, but that alone does not establish isolation.
2. `frontend/src/app/api/auth/login/route.ts` binds the resulting session to the resolved database/company and looks up native Tryton user groups. `frontend/src/lib/tryton-client.ts` makes native authenticated Tryton calls; that is a real integration foundation.
3. The login page embeds demo usernames and passwords behind `NEXT_PUBLIC_DEPLOYMENT_MODE !== "production"`. These values are visible in source and can be rendered whenever the production mode variable is absent or misconfigured. Remove them from deployable builds and rotate any corresponding accounts/passwords if they are real.
4. In test mode, the laboratory and radiology pages display explicit “unavailable until integrated” notices and the billing page states that invoice creation, posting, and payment are disabled. The billing API POST returns HTTP 501. However, the billing page still contains USD currency labels and `$50` sample/payment text in source, so test-mode hiding does not clean the production route.
5. The repository contains conflicting certification documents. `docs/final-acceptance/01-INDEPENDENT-AUDIT.md` claims database-per-tenant isolation and 46/46 passing tests, while `TENANT_ONBOARDING_AND_ISOLATION.md` and the current `frontend/src/lib/tenant.ts` describe a single workspace and no tenant isolation tests. The former claims should not be treated as current evidence without dated logs, scripts, and a reproducible target environment.

## Reconciliation with the Antigravity findings supplied on 2026-09-26

The pasted Antigravity text is useful as a scope comparison and as a record of intended read-only SQL checks. It separates backend database isolation from frontend tenant switching and correctly says the Next.js app is not intended to reproduce every native GNU Health screen. However, it also labels the complete OPD flow “100% operational” and “100% end-to-end,” which the current source does not support.

The pasted command history lists SQL commands but does not include their returned rows or command exit statuses. Consequently, its figures (306 tables, 135 clinical models, 20 QAR invoices, balanced totals, company ID/name/currency, and the presence/configuration of the three databases and Tryton service) remain **reported claims**, not independently inspectable evidence in the pasted material. The SQL itself is read-only, but proof requires the output, timestamp, database identity, and environment provenance. Aggregate debit/credit equality alone also does not prove every move is balanced, that invoices are paid/reconciled, or that all values share the same currency.

The claimed backend database-per-client arrangement, if the listed databases and service configuration are confirmed, would be backend infrastructure capacity for isolation. It does not make the current frontend multi-tenant: the inspected resolver still allows only `qatar-outpatient` and binds to one environment-configured database/company. The pasted Antigravity finding itself acknowledges this frontend limitation.

The source findings are inconsistent with the claim that the whole OPD cycle currently works through this Next.js frontend: the billing POST handler returns 501; laboratory and radiology sample screens are explicitly disabled in test mode pending native workflow verification; and billing markup retains USD/sample content. The available source can support “partial native integration,” not an end-to-end success claim. Antigravity may have executed earlier workflows or observed a different deployment/build, but dated request/response or browser evidence is needed to resolve that difference.

## Deployment preflight and work completed on 2026-09-26

A read-only SSH check reached GCP host `gnuhealth-srv`. GNU Health, Nginx, the main frontend service, and the isolated test frontend service reported active. The main service listens on port 3000; the test service listens on loopback port 3001. Both local `/login` endpoints returned HTTP 200. The host had no local listener on TCP 443, and a direct local HTTPS request to Nginx could not connect. External TLS termination was not tested. This is not a safe production deployment target until HTTPS routing/certificates are verified; any firewall or GCP ingress changes require the workspace's explicit-approval gate.

An unauthenticated request to the main frontend's `/api/auth/me` returned HTTP 401, confirming that this one session endpoint rejects requests without a session.

During implementation preflight, embedded demo login credentials and the unsupported password-recovery entry point were removed from `frontend/src/app/login/page.tsx`. Targeted ESLint and TypeScript `--noEmit` checks passed for this source change. The whole frontend lint run still reports 151 errors and 108 warnings. A local untracked diagnostic script contained a hardcoded administrator credential and printed authentication output; it was replaced with environment-sourced credentials and redacted authentication errors. The script was not executed. The credential should be treated as exposed; rotating the affected backend password requires explicit user approval under workspace rules.

An isolated frontend copy built successfully with `npm run build -- --webpack` and `NEXT_PUBLIC_DEPLOYMENT_MODE=test`; Next.js compiled all 32 route entries and completed its TypeScript/build phases. The default Turbopack build could not traverse an external `node_modules` junction in the isolated harness, so it was not a source failure. The production build was not deployed. The 17 API routes include `/api/auth/forgot-password` and `/api/auth/reset-password`; both correctly fail closed with HTTP 503 because no recovery service is configured.

No application files were deployed to GCP. During the follow-on implementation, the prescription POST handler was changed from a disabled stub to a draft-create/native-issue flow, with a matching formulary UI update. This is **source code only and is not yet verified against the installed Tryton prescription schema or a synthetic test tenant**. The billing POST, laboratory POST, and radiology POST remain HTTP 501. Consequently, the live application does not meet the requested complete workflow scope. Existing production service and user changes were left in place.

### Follow-on prescription implementation check (2026-09-26)

- The physician page now marks locally composed lines as drafts, requires an explicit safety-review acknowledgment, displays recorded allergy text, surfaces formulary pregnancy warnings, and provides native route and interval selectors. It preserves/retries a saved draft ID after an issue failure rather than resubmitting a duplicate create.
- The prescription API now checks patient/medication/route IDs, active catalog entries, dose/frequency/duration, professional association, creates through `gnuhealth.prescription.order`, invokes `create_prescription`, and reads back the native state before returning success. The pregnancy-warning field is derived from patient/medication warning indicators. A source-code lookup of GNU Health 4.4.1 confirms `prescription_warning_ack` is a native verification field and `create_prescription` is the form action; this does not confirm the exact installed server version or this request's RPC argument shape.
- Formulary lookup now requests route, dose-unit, and form catalogues and includes native medication metadata. No real patient, clinical record, or financial data was changed.
- Verification: targeted `npx tsc --noEmit --incremental false` passed. Targeted ESLint over the physician page and two changed API routes failed with 18 `no-explicit-any` errors and 9 warnings, including pre-existing findings. No authenticated Tryton mutation, synthetic API/browser E2E, full production build after this patch, or deployment was performed.
- The rest of the goal remains materially incomplete: billing/lab/imaging write workflows are disabled, multi-tenant frontend routing is absent, all approved installed modules/pages are not mapped or implemented, lint is failing, and deployment/security gates remain open.

### Additional live GNU Health database evidence

Read-only checks were run against the primary `gnuhealth` database on `gnuhealth-srv`; only module names, aggregate counts, configuration counts, and relationship exception counts were returned (no individual patient, invoice, or ledger records):

- `ir_module` reports **24 activated** modules: `account`, `account_invoice`, `account_product`, `company`, `country`, `currency`, `health`, `health_genetics`, `health_gyneco`, `health_icd10`, `health_imaging`, `health_inpatient`, `health_insurance`, `health_lab`, `health_lifestyle`, `health_nursing`, `health_pediatrics`, `health_services`, `health_socioeconomics`, `health_surgery`, `ir`, `party`, `product`, and `res`.
- The public schema contains **306 tables**; `ir_model` contains **145** model names prefixed `gnuhealth.`.
- Primary company 2 has currency **QAR**, symbol `ر.ق`, name `Qatari Riyal`. All **20/20** invoice rows are QAR.
- Company 2 has one open fiscal year and **12 open standard periods**. Active journals include one cash, one revenue, two general, one expense, and one write-off journal. There are 12 draft health-service headers and 36 invoiceable service lines.
- The database contains 29 patients, 28 appointments, 42 evaluations, 19 prescriptions / 16 prescription lines, 29 lab results / 489 criteria, 21 imaging requests / 14 results, 20 invoices / 43 invoice lines, and 28 posted accounting moves. This shows persisted operational records and multiple native workflow states; it does not prove every frontend action or that one synthetic encounter traversed the entire chain.
- State aggregates included 12 checked-in and 12 done appointments; 17 signed evaluations; 13 done prescriptions; 12 validated and 10 done lab records; 21 done imaging requests; and 12 posted plus 2 paid invoices.
- Read-only orphan checks returned zero for appointment/evaluation/prescription/lab/imaging patient links, prescription lines, lab criteria, imaging results, invoice lines, and posted/paid invoices without an accounting move. Per-move balance audit returned zero unbalanced posted moves.
- PostgreSQL contains `gnuhealth`, `gnuhealth_test_alpha`, and `gnuhealth_test_beta` databases. Their existence establishes separate database instances, not authorization-safe tenant routing. The current Next.js registry still exposes one tenant only.

These checks materially support that the **live GNU Health backend database is populated and its native modules/accounting records have been used**. They are not proof that every activated module is fully operational, that all critical workflows currently pass through Tryton JSON-RPC, or that the IST frontend completes those workflows. No authenticated API call or UI mutation was made.

## Coverage and functionality boundaries

The page/API inventories demonstrate breadth, not complete workflow coverage. Several paths have native Tryton calls, including patient search/registration, appointments, triage, consultation/evaluation, lookup catalogues, and staff administration. Presence of a handler does not prove correctness against the currently deployed module schema, ACLs, accounting configuration, or role-specific lifecycle.

Known limitations visible in current source or the latest audit document:

- Lab result entry/certification and radiology result/state changes are not enabled in the isolated test build pending native workflow verification.
- Invoice creation, posting, and payment are disabled; no verified native payment/reconciliation lifecycle is exposed by the current UI.
- Test-mode clinical sample pages are hidden, but stale sample strings remain in files and must be removed or safely gated before production use.
- The full GNU Health feature set is much larger than this outpatient frontend. There is no evidence of a complete page and action for each activated or upstream module.
- Current report says the patient chart and some other UI paths still need a complete pass for hard-coded fixtures. Authenticated behavior and role ACLs were not run in this audit.
- Current report records frontend lint failures (153 errors and 112 warnings at its latest run); that result was not rerun here.

## Currency and tenancy conclusions

QAR is now verified in the primary live company and all 20 current invoice rows, with an open fiscal year, open periods, active journals, posted moves, and no aggregate per-move balance exceptions. This confirms important configuration and persisted accounting state, but does not exercise a new invoice/payment transaction or certify tax/pricing, refunds, or reconciliation edge cases. The remaining USD UI strings are a product defect and can mislead users.

Multi-tenant service status is **not ready**. There is one allowlisted tenant in frontend code, no self-service or operator provisioning lifecycle in the inspected app, and no reproducible current cross-tenant test evidence. The onboarding document itself says to describe the deployment as single-tenant until release gates are met.

## Verification gaps before claiming “working end to end”

- Confirm the deployed version, database, active Tryton modules, company, QAR currency, fiscal year, journals, taxes, products, and chart of accounts using read-only live checks.
- Obtain authorized synthetic test accounts and perform role-specific positive and negative API/browser workflows without using real patient data.
- Execute full patient-to-appointment-to-triage-to-evaluation-to-orders-to-results-to-invoice-to-payment/reconciliation workflows only in an isolated synthetic test database.
- Prove tenant separation with two genuinely isolated test tenants, including session/database binding and negative cross-tenant reads/writes; current source does not offer this configuration.
- Reconcile every frontend screen/action against backend models, methods, states, permissions, and persisted records; include upstream modules deliberately out of frontend scope.
- Remove demo credentials and USD/example billing copy from production artifacts; resolve the current audit's build/lint/security findings and produce current dated evidence.

## Recommendation

Describe IST Health today as an **outpatient frontend prototype/integration in an isolated test deployment, with partial native Tryton integration**. Do not describe it as a fully functioning end-to-end GNU Health frontend, a multi-tenant product, or a live QAR billing system until the verification gaps above are closed with reproducible current evidence.
