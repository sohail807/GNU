> **Superseded for operations:** hospital onboarding is now a per-hospital-database, per-subdomain flow. Follow `docs/TENANT_ONBOARDING.md`. The text below is the original single-tenant analysis and release-gate list.

# Tenant onboarding and isolation

## Current deployment status

The frontend is configured for one workspace only: `qatar-outpatient`. The login selector is presentation metadata, while the server reads one database name and one company ID from its environment. The isolated test service currently points at the `gnuhealth_test_alpha` database and company 2, configured for QAR. There is no tenant signup, tenant database provisioning, tenant-specific authentication boundary, or tenant-isolation test in this codebase. Selecting a workspace does not register a new organization.

Do not accept customer data or present this deployment as a multi-tenant service. A new customer cannot self-register safely through the current frontend.

## How to register a tenant today

For a controlled pilot, an authorized platform operator must onboard a tenant manually:

1. Approve the organization, country, currency, data residency, and hosting arrangement.
2. Provision a separate native application database (preferred for isolation) and native company through the supported backend administration process. Do not create business records directly in SQL.
3. Configure company details, QAR/currency where applicable, fiscal settings, chart of accounts, journals, taxes, products, modules, and roles with the organization’s authorized administrator.
4. Create named tenant administrator accounts with least privilege. Deliver credentials through an approved secure channel; require password change using a verified process.
5. Add the tenant to a server-side allowlisted registry that maps an opaque tenant ID to its database, company ID, country, currency, and status. Never accept a database/company ID from browser input.
6. Configure a tenant-specific deployment or a reviewed server-side connection pool. Bind every request and session to the authenticated tenant; verify backend company and record-level permissions on every operation.
7. Run synthetic-data verification for login, logout/revocation, role grants and denials, patient search, appointment, consultation, orders, billing, and cross-tenant denial. Capture logs without personal data.
8. Verify backups and restore, monitoring, audit trail, TLS, secret rotation, incident contacts, retention, and tenant offboarding/backup-retention policy before production use.

## Product flow for future self-service registration

If self-service onboarding is later approved, it should begin with an organization request (legal name, country, requested currency, primary administrator contact, and intended modules). The request remains `pending_review` until an authorized operator approves it. Only a privileged provisioning worker may create the isolated native database/company, apply a reviewed configuration template, provision the tenant administrator, perform health checks, and mark it `active`. Failures must leave the tenant non-routable and support safe retry/rollback. The UI must clearly distinguish request submission from an active workspace; it must not claim that signup alone provisions clinical or financial readiness.

Tenant IDs should be opaque identifiers. Resolve them from a server-side registry after authentication; do not derive database names from user input or allow browser-supplied company IDs. Sessions must include a tenant binding, and tenant changes must require re-authentication. All APIs, background jobs, exports, file storage, cache keys, and audit events must carry and enforce that binding. A deployment with one shared database is not tenant-isolated merely because records have a company ID.

## Required release gates

- Approved tenant-isolation architecture and threat review.
- Server-side registry and provisioning lifecycle with authorization, audit, idempotency, failure handling, and offboarding.
- Per-tenant backend/database permissions, company context, and positive/negative isolation tests.
- Shared session/revocation strategy suitable for all service instances.
- Verified currency/accounting configuration and synthetic financial reconciliation per tenant.
- TLS, backups with restore evidence, monitoring, incident response, and operational ownership.
- Authenticated browser/API end-to-end coverage for each supported role and workflow.

Until these gates are complete, onboard any pilot tenant manually into an isolated, operator-managed environment and describe the current service as single-tenant.
