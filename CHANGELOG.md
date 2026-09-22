# Project Changelog

All notable changes to the **Healthcare Management System — GNU Health Implementation** are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/), adhering to healthcare software auditability standards.

## [1.6.0] - 2026-09-22

### Added
- **Final Production Audit Report**: Published `audit/FINAL_PRODUCTION_AUDIT.md` providing end-to-end evaluation across all 13 execution phases, GCP compute resources, network perimeter probes, Tryton WSGI exposure analysis, and comprehensive database census.
- **Automated Endpoint & Hygiene Re-Validation**: Re-executed `scripts/validate_system_integrity.ps1` confirming zero plaintext repository secrets, valid YAML clinic specifications, active Port 80 HTTP proxy, closed Port 5432, and identified pending remediation on Ports 443 and 8000.

### Changed
- **Master Documentation Index**: Registered `audit/FINAL_PRODUCTION_AUDIT.md` into `DOCUMENTATION_INDEX.md` Section 7.1.
- **Go-Live Gating Consolidation**: Re-affirmed production gate classification as `IMPLEMENTATION BLOCKED — INPUTS REQUIRED` across all authoritative reports.

---

## [1.5.0] - 2026-09-21

### Added (Authoritative Final Execution & Audit Pack)
- **Production Change Control Log**: Published `audit/PRODUCTION_CHANGE_LOG.md` recording all live production mutations (CHG-001 through CHG-005) with before/after state, commands, read-back evidence, and rollback methods.
- **Final Production Database Audit**: Published `audit/FINAL_DATABASE_AUDIT.md` providing comprehensive census of 36 models, distinguishing configuration from operational data, and confirming zero clinical or financial contamination.
- **Final Security Audit**: Published `audit/FINAL_SECURITY_AUDIT.md` evaluating repository secret hygiene, administrative credential rotation status, transport encryption, daemon exposure, and least-privilege RBAC.
- **Final Network Validation**: Published `audit/FINAL_NETWORK_VALIDATION.md` documenting empirical TCP port probes, HTTP response headers, reverse proxy routing, and GCP VPC firewall rule scopes.
- **Final User Acceptance Testing Report**: Published `audit/FINAL_UAT_REPORT.md` evaluating 17 outpatient workflow scenarios against native GNU Health models and establishing gating prerequisites.
- **Backup and Disaster Recovery Validation**: Published `audit/BACKUP_AND_RESTORE_VALIDATION.md` defining PostgreSQL custom compressed backup architecture, automated 30-day retention schedule, 4 empirical verification criteria, and isolated staging restore protocol.
- **Definitive Go-Live Evidence Matrix**: Published `audit/GO_LIVE_EVIDENCE.md` compiling the authoritative 26-area implementation matrix and 12-gate production evaluation.

### Security
- **Comprehensive Workspace Secret Sanitization**: Executed automated regex sanitization across all workspace documentation and scratch scripts; verified zero plaintext credentials remain.
- **Compromised Administrative Credential Handling**: Formally registered `ADMIN CREDENTIAL ROTATION BLOCKED — SSH/SUDO REQUIRED` pending host SSH shell access; prevented credential reuse in scripts.

### Changed
- **Master Index & Implementation Report**: Synchronized `DOCUMENTATION_INDEX.md`, `PROJECT_STATUS.md`, and updated `FINAL_IMPLEMENTATION_REPORT.md` with the 26-area implementation status matrix.
- **Final Status Classification**: Consolidated authoritative project status to `IMPLEMENTATION BLOCKED — INPUTS REQUIRED` with `GO-LIVE BLOCKED`.

---

## [1.4.0] - 2026-09-21

### Executed & Configured (Live System Changes)
- **Clinical Service Product & Template Configuration**: Connected to live Tryton system (`http://34.7.237.8/gnuhealth/`) via JSON-RPC API and successfully configured standard clinical service codes across all 15 services in `product.template`:
  - `OPD-EVAL` (Medical evaluation service, ID 15)
  - `RAD-US`, `RAD-MRI`, `RAD-XR`, `RAD-CT`, `RAD-PET` (Radiology / Imaging services, IDs 1..5)
  - `LAB-SEMEN`, `LAB-CBC`, `LAB-LFT`, `LAB-STOOL`, `LAB-RFT`, `LAB-HAEM`, `LAB-SMEAR`, `LAB-UA`, `LAB-ENDO` (Laboratory services, IDs 6..14)
- **Product Category General Ledger Mapping**: Configured accounting linkage (`accounting = True`, `account_revenue = 6` [Main Revenue], `account_expense = 3` [Main Expense]) across product categories 2 (`Imaging Services`), 3 (`Lab Services`), and 4 (`Medical Evaluation`) in `product.category`.
- **Product Template Accounting Category Linkage**: Configured `account_category` across all 15 product templates (IDs 1..5 -> Category 2; IDs 6..14 -> Category 3; ID 15 -> Category 4) enabling automatic revenue and expense routing on patient billing.
- **Chart of Accounts Code Assignment**: Configured standard accounting codes on live general ledger accounts in `account.account`:
  - `101000` (Main Cash, ID 2)
  - `501000` (Main Expense, ID 3)
  - `210000` (Main Payable, ID 4)
  - `110000` (Main Receivable, ID 5)
  - `401000` (Main Revenue, ID 6)
  - `220000` (Main Tax, ID 7)
- **Empirical Read-Back Verification**: Validated all updated records via Tryton JSON-RPC read calls (`model.product.product.read`, `model.product.template.read`, `model.account.account.read`, `model.product.category.read`). Confirmed 100% active state and data consistency.

### Changed
- **Status Reporting**: Updated `FINAL_IMPLEMENTATION_REPORT.md` Sections 16 and 19 to reflect live database configuration state (`ACTUALLY CONFIGURED`).

---

## [1.3.0] - 2026-09-21

### Added
- **Automated System Integrity & Host Validation Suite**: Added `scripts/validate_system_integrity.ps1` (PowerShell endpoint probe, secret grep, and configuration validator) and `scripts/validate_system_integrity.sh` (Linux host baseline, socket binding, systemd service, and PostgreSQL audit script).
- **Authoritative 34-Section Implementation Report**: Re-architected and published `FINAL_IMPLEMENTATION_REPORT.md` covering all 34 required governance, technical, clinical, financial, and operational dimensions.
- **Enriched Clinic Master Configuration**: Updated `configuration/clinic-config.yaml` with professional outpatient clinic defaults for 15 billable clinical service stubs, 8 hospital functional units, 12 RBAC security roles, and double-entry general ledger accounts.

### Changed
- **Empirical Network Verification**: Executed automated port scan against live host `34.7.237.8` recording empirical status: Port 80 (Open HTTP), Port 443 (Closed HTTPS), Port 8000 (Open/Exposed), Port 5432 (Closed/Secure Socket), Port 22 (Open SSH).
- **External Dependency Classification**: Standardized exact blocker classifications: `SSH / SERVER ACCESS — USER INPUT REQUIRED`, `GCP ACCESS / IAM — USER INPUT REQUIRED`, `OFFICIAL PRODUCTION DOMAIN / FQDN — PENDING USER INPUT`, `DNS CONFIGURATION — PENDING USER INPUT`.

---

## [1.2.0] - 2026-09-21

### Added
- **Phase 0 Access & Authorization Readiness Pack**: Published `audit/PHASE_0_ACCESS_REQUIREMENTS.md`, `audit/PHASE_0_APPROVAL_MATRIX.md`, `audit/PHASE_0_OPERATOR_RUNBOOK.md`, `audit/PHASE_0_EVIDENCE_CAPTURE_CHECKLIST.md`, and `audit/PHASE_0_ACCESS_READINESS_FINAL_REPORT.md`.
- **System Baseline & Database Audits**: Published `audit/POST_PHASE_0_SYSTEM_VALIDATION.md` and `audit/FINAL_PRODUCTION_DATABASE_AUDIT.md` verifying platform versions, 24 activated modules, and zero entity duplication.
- **End-to-End Implementation Final Deliverable**: Published `FINAL_IMPLEMENTATION_REPORT.md` synthesizing all 25 implementation dimensions and formal go-live gate evaluation.
- **Implementation Report Accuracy Check**: Published `audit/FINAL_IMPLEMENTATION_REPORT_ACCURACY_CHECK.md` documenting rigorous documentation accuracy reconciliation, terminology corrections, and standardized gating declarations.

### Security
- **Deployment Script Secret Sanitization**: Sanitized root `finish_setup.sh` and `deployment/finish_setup.sh`; replaced static administrative credentials with dynamic cryptographic generation (`openssl rand -hex 12`) and masked banners.
- **Zero Plaintext Repository Secrets**: Verified that zero plaintext credential strings exist across all repository files.
- **Compromised Credential Tracking**: Classified live administrative provisioning credential as `COMPROMISED / ROTATION REQUIRED` with mandatory rotation runbook.

### Changed
- **Evidence Reconciliation & Taxonomy Standardization**: Reconciled all implementation deliverables to eliminate overstatements; replaced "Configured Baseline" with precise empirical statuses (`EXISTING STRUCTURE — OFFICIAL CLINIC IDENTITY PENDING`, `EXISTING / VERIFIED — OPERATIONAL VALIDATION PENDING`, `EXISTING SERVICE STUBS — TARIFF CONFIGURATION PENDING`, `ACCOUNTING CONFIGURATION BLOCKED — NO APPROVED/ACTIVE FISCAL YEAR`).
- **Standardized Technical Foundation & Gating Statements**: Replaced general readiness claims with `Technical Foundation: VERIFIED AGAINST CURRENT OBSERVED SYSTEM STATE; PRODUCTION HARDENING REQUIRED`, affirmed `Live Infrastructure Changes: ZERO DURING THIS IMPLEMENTATION RUN`, and replaced specific gate failure counts with `MULTIPLE MANDATORY GO-LIVE GATES REMAIN UNSATISFIED`.
- **Logical Decoupling of Domain Name**: Decoupled domain-dependent tasks (TLS certificates, Nginx HTTPS virtual host) from domain-independent hardening tasks (database backups, credential rotation, loopback binding, firewall port closure).
- **Final Implementation Status**: Classified implementation as `IMPLEMENTATION BLOCKED — INPUTS REQUIRED` with `GO-LIVE = BLOCKED` pending clinic master data, doctor roster, accounting approvals, and operational access.

---

## [1.1.0] - 2026-09-21

### Added
- **Standardized Documentation Suite**: Deployed comprehensive 17-part documentation suite in `docs/` covering architecture, clinical workflows, billing, pharmacy, laboratory, radiology, security, and maintenance.
- **Audit & Governance Archive**: Established `audit/` containing `project-discovery.md`, `codebase-classification.md`, `cleanup-changelog.md`, and `technical-findings.md`.
- **Pre-Production Operational Artifacts**: Published `FUNCTIONAL_COMPLETION_PLAN.md`, `PROJECT_STATUS.md`, `TECHNICAL_DEBT.md`, `TEST_PLAN.md`, and `FINAL_AUDIT_REPORT.md`.
- **Master Data Ingestion Templates**: Deployed YAML schemas in `configuration/master-data/` for doctors, medicines, insurance, lab panels, and radiology services.

### Changed
- **Professional Rebranding**: Rebranded project identity to `Healthcare Management System — GNU Health Implementation` while preserving upstream GNU Solidario copyright and GPL-3.0 licensing.
- **Repository Reorganization**: Migrated cloud deployment automation scripts into dedicated `deployment/` directory.
- **Root README Rewrite**: Rebuilt root `README.md` as an authoritative architectural overview and implementation index.

### Removed
- **Redundant Script Artifacts**: Archived and purged `startup_b64.txt` (exact base64 duplicate) and moved prototype `deploy_gcp.sh` to `deployment/archive/`.
- **Synthetic Test Encounters**: Purged all 9 synthetic clinical demonstration records (`PLI528CHX`, test doctor, appointments, evaluations, lab orders, imaging requests, prescriptions) via Tryton ORM.
- **Zero Production Contamination**: Confirmed live database contains exactly 0 patient and transactional records.

---

## [1.0.0] - 2026-09-21

### Added
- **Cloud Infrastructure Provisioning**: Automated GCP Compute Engine VM creation (`gnuhealth-srv`, Debian 12, PostgreSQL 15, Nginx).
- **Core Platform Deployment**: Installed GNU Health HMIS 5.0.7 running on Tryton 7.0.57 and Python 3.11 virtualenv.
- **Qatar Geopolitical Configuration**: Created QAR currency (ID: 3, `ر.ق`, 2 decimals, rounding `0.01`, rate `1.0000`), Qatar country record (`QA`, `QAT`, `634`), and 14 GCC/expat nationalities.
- **Arabic Localization**: Activated Arabic language (`ar`, RTL) alongside English (`en`, LTR); set timezone to `Asia/Qatar`.
- **Institutional Structure**: Configured clinic party (`<CLINIC_NAME>`), operating company, health institution (`CLINIC-QA`), and 8 hospital subunits (OPD, Triage, Pharmacy, Lab, Radiology, Billing, Insurance, Administration).
- **Reference Ontologies**: Loaded 14,416 WHO ICD-10 codes, 73 medical specialties, 94 drug forms, 47 routes, 9 lab categories, and 8 imaging modalities.
