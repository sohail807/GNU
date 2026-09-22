# DOCUMENTATION INDEX & MASTER NAVIGATION GUIDE

**Project**: Healthcare Management System — GNU Health Implementation  
**Platform**: GNU Health HMIS 5.0.7 / Tryton 7.0.57 / PostgreSQL 15.15 / Debian 12  
**Document**: `DOCUMENTATION_INDEX.md`  
**Classification**: Master Navigation Portal  
**Target Audience**: Project Managers, Technical Leads, Clinical Directors, CFOs, DevOps, Auditors  
**Status**: AUTHORITATIVE MASTER INDEX  

---

## 1. Quick Navigator by Stakeholder Role

| Stakeholder Role | Primary Documents to Review |
| :--- | :--- |
| **Executive Management & Clinic Board** | [FUNCTIONAL_IMPLEMENTATION_STATUS.md](file:///c:/Users/MohammedSohail/OneDrive%20-%20IRISSTAR%20TECHNOLOGIES/GNU%20Health/FUNCTIONAL_IMPLEMENTATION_STATUS.md) <br> [GO_LIVE_CHECKLIST.md](file:///c:/Users/MohammedSohail/OneDrive%20-%20IRISSTAR%20TECHNOLOGIES/GNU%20Health/GO_LIVE_CHECKLIST.md) <br> [PENDING_CLINIC_INPUT.md](file:///c:/Users/MohammedSohail/OneDrive%20-%20IRISSTAR%20TECHNOLOGIES/GNU%20Health/PENDING_CLINIC_INPUT.md) |
| **Project Manager & Implementation Lead** | [IMPLEMENTATION_MASTER_PLAN.md](file:///c:/Users/MohammedSohail/OneDrive%20-%20IRISSTAR%20TECHNOLOGIES/GNU%20Health/IMPLEMENTATION_MASTER_PLAN.md) <br> [IMPLEMENTATION_MASTER_STATUS.md](file:///c:/Users/MohammedSohail/OneDrive%20-%20IRISSTAR%20TECHNOLOGIES/GNU%20Health/IMPLEMENTATION_MASTER_STATUS.md) <br> [REQUIREMENTS_TRACEABILITY_MATRIX.md](file:///c:/Users/MohammedSohail/OneDrive%20-%20IRISSTAR%20TECHNOLOGIES/GNU%20Health/REQUIREMENTS_TRACEABILITY_MATRIX.md) |
| **Medical Director & Clinical Leads** | [FINAL_REQUIREMENTS_BASELINE.md](file:///c:/Users/MohammedSohail/OneDrive%20-%20IRISSTAR%20TECHNOLOGIES/GNU%20Health/FINAL_REQUIREMENTS_BASELINE.md) <br> [CLINICAL_WORKFLOW_IMPLEMENTATION_PLAN.md](file:///c:/Users/MohammedSohail/OneDrive%20-%20IRISSTAR%20TECHNOLOGIES/GNU%20Health/CLINICAL_WORKFLOW_IMPLEMENTATION_PLAN.md) <br> [USER_ROLE_IMPLEMENTATION_PLAN.md](file:///c:/Users/MohammedSohail/OneDrive%20-%20IRISSTAR%20TECHNOLOGIES/GNU%20Health/USER_ROLE_IMPLEMENTATION_PLAN.md) |
| **Chief Financial Officer & Accountants**| [ACCOUNTING_IMPLEMENTATION_PLAN.md](file:///c:/Users/MohammedSohail/OneDrive%20-%20IRISSTAR%20TECHNOLOGIES/GNU%20Health/ACCOUNTING_IMPLEMENTATION_PLAN.md) <br> [INSURANCE_IMPLEMENTATION_PLAN.md](file:///c:/Users/MohammedSohail/OneDrive%20-%20IRISSTAR%20TECHNOLOGIES/GNU%20Health/INSURANCE_IMPLEMENTATION_PLAN.md) |
| **DevOps & Infrastructure Engineers** | [PRODUCTION_SECURITY_PLAN.md](file:///c:/Users/MohammedSohail/OneDrive%20-%20IRISSTAR%20TECHNOLOGIES/GNU%20Health/PRODUCTION_SECURITY_PLAN.md) <br> [deploy_gcp_gnuhealth.sh](file:///c:/Users/MohammedSohail/OneDrive%20-%20IRISSTAR%20TECHNOLOGIES/GNU%20Health/deploy_gcp_gnuhealth.sh) <br> [docs/13-Deployment.md](file:///c:/Users/MohammedSohail/OneDrive%20-%20IRISSTAR%20TECHNOLOGIES/GNU%20Health/docs/13-Deployment.md) |
| **QA Lead & Test Engineers** | [MASTER_UAT_PLAN.md](file:///c:/Users/MohammedSohail/OneDrive%20-%20IRISSTAR%20TECHNOLOGIES/GNU%20Health/MASTER_UAT_PLAN.md) <br> [TEST_PLAN.md](file:///c:/Users/MohammedSohail/OneDrive%20-%20IRISSTAR%20TECHNOLOGIES/GNU%20Health/TEST_PLAN.md) |
| **Auditors & Compliance Officers** | [audit/LIVE_DATABASE_VALIDATION.md](file:///c:/Users/MohammedSohail/OneDrive%20-%20IRISSTAR%20TECHNOLOGIES/GNU%20Health/audit/LIVE_DATABASE_VALIDATION.md) <br> [audit/REPOSITORY_CLEANUP_LOG.md](file:///c:/Users/MohammedSohail/OneDrive%20-%20IRISSTAR%20TECHNOLOGIES/GNU%20Health/audit/REPOSITORY_CLEANUP_LOG.md) <br> [SECOND_PASS_FINAL_REPORT.md](file:///c:/Users/MohammedSohail/OneDrive%20-%20IRISSTAR%20TECHNOLOGIES/GNU%20Health/SECOND_PASS_FINAL_REPORT.md) |

---

## 2. Executive & Governance Master Documents

These documents represent the primary decision-making and operational control layer of the project:

* [**`GNU_HEALTH_HMIS_FUNCTIONALITY_DOCUMENT.md`**](file:///c:/Users/MohammedSohail/OneDrive%20-%20IRISSTAR%20TECHNOLOGIES/GNU%20Health/GNU_HEALTH_HMIS_FUNCTIONALITY_DOCUMENT.md): **The definitive outpatient clinic system functionality and operational guide**. Comprehensive manual detailing all 24 modules, clinical SOAP consultation, LIS lab testing, RIS imaging, e-prescriptions, pharmacy dispensing, billing tariffs, general ledger accounting, and RBAC matrix.
* [**`FINAL_IMPLEMENTATION_REPORT.md`**](file:///c:/Users/MohammedSohail/OneDrive%20-%20IRISSTAR%20TECHNOLOGIES/GNU%20Health/FINAL_IMPLEMENTATION_REPORT.md): **The definitive end-to-end implementation and production readiness report**. Synthesizes all 34 implementation dimensions, system architecture, security readiness, and final go-live gate evaluation.
* [**`FUNCTIONAL_IMPLEMENTATION_STATUS.md`**](file:///c:/Users/MohammedSohail/OneDrive%20-%20IRISSTAR%20TECHNOLOGIES/GNU%20Health/FUNCTIONAL_IMPLEMENTATION_STATUS.md): **The single most important management-facing document**. Details what is verified, what is missing, who provides it, and what remains before go-live.
* [**`FINAL_REQUIREMENTS_BASELINE.md`**](file:///c:/Users/MohammedSohail/OneDrive%20-%20IRISSTAR%20TECHNOLOGIES/GNU%20Health/FINAL_REQUIREMENTS_BASELINE.md): Current requirements baseline pending formal clinic stakeholder sign-off covering 10 core outpatient domains and 4 non-functional categories.
* [**`IMPLEMENTATION_MASTER_PLAN.md`**](file:///c:/Users/MohammedSohail/OneDrive%20-%20IRISSTAR%20TECHNOLOGIES/GNU%20Health/IMPLEMENTATION_MASTER_PLAN.md): The phased execution roadmap (Phases 0 through 12) from Security Hardening to Go-Live Cutover.
* [**`IMPLEMENTATION_MASTER_STATUS.md`**](file:///c:/Users/MohammedSohail/OneDrive%20-%20IRISSTAR%20TECHNOLOGIES/GNU%20Health/IMPLEMENTATION_MASTER_STATUS.md): **The single operational source of truth** tracking 32 system parameters with verifiable evidence states.
* [**`GO_LIVE_CHECKLIST.md`**](file:///c:/Users/MohammedSohail/OneDrive%20-%20IRISSTAR%20TECHNOLOGIES/GNU%20Health/GO_LIVE_CHECKLIST.md): Mandatory multi-departmental gating matrix and executive sign-off sheet.
* [**`PRE_IMPLEMENTATION_GATE.md`**](file:///c:/Users/MohammedSohail/OneDrive%20-%20IRISSTAR%20TECHNOLOGIES/GNU%20Health/PRE_IMPLEMENTATION_GATE.md): Authoritative pre-implementation governance gate detailing prerequisite checklist and blocking conditions.
* [**`PROJECT_STATUS.md`**](file:///c:/Users/MohammedSohail/OneDrive%20-%20IRISSTAR%20TECHNOLOGIES/GNU%20Health/PROJECT_STATUS.md): High-level executive status dashboard.
* [**`README.md`**](file:///c:/Users/MohammedSohail/OneDrive%20-%20IRISSTAR%20TECHNOLOGIES/GNU%20Health/README.md): Project overview, technology stack, directory index, and architecture summary.

---

## 3. Functional Implementation Plans

Detailed departmental workflows, permission models, and operational designs:

* [**`CLINICAL_WORKFLOW_IMPLEMENTATION_PLAN.md`**](file:///c:/Users/MohammedSohail/OneDrive%20-%20IRISSTAR%20TECHNOLOGIES/GNU%20Health/CLINICAL_WORKFLOW_IMPLEMENTATION_PLAN.md): Step-by-step specifications for Patient Intake, Triage, Consultation, Orders, Results, and Discharge.
* [**`USER_ROLE_IMPLEMENTATION_PLAN.md`**](file:///c:/Users/MohammedSohail/OneDrive%20-%20IRISSTAR%20TECHNOLOGIES/GNU%20Health/USER_ROLE_IMPLEMENTATION_PLAN.md): Least-privilege RBAC permission matrix for 12 operational roles.
* [**`ACCOUNTING_IMPLEMENTATION_PLAN.md`**](file:///c:/Users/MohammedSohail/OneDrive%20-%20IRISSTAR%20TECHNOLOGIES/GNU%20Health/ACCOUNTING_IMPLEMENTATION_PLAN.md): Outpatient Chart of Accounts, FY2026 fiscal calendar, revenue accounts, and cashier reconciliation.
* [**`INSURANCE_IMPLEMENTATION_PLAN.md`**](file:///c:/Users/MohammedSohail/OneDrive%20-%20IRISSTAR%20TECHNOLOGIES/GNU%20Health/INSURANCE_IMPLEMENTATION_PLAN.md): Private health insurance, copay splits, and clearinghouse integration boundaries.
* [**`docs/03-Functional-Modules.md`**](file:///c:/Users/MohammedSohail/OneDrive%20-%20IRISSTAR%20TECHNOLOGIES/GNU%20Health/docs/03-Functional-Modules.md): Detailed inventory of all 24 activated Tryton/GNU Health modules.
* [**`docs/04-Clinical-Workflows.md`**](file:///c:/Users/MohammedSohail/OneDrive%20-%20IRISSTAR%20TECHNOLOGIES/GNU%20Health/docs/04-Clinical-Workflows.md): Clinical encounter patterns and SOAP note structure.
* [**`docs/05-Administrative-Workflows.md`**](file:///c:/Users/MohammedSohail/OneDrive%20-%20IRISSTAR%20TECHNOLOGIES/GNU%20Health/docs/05-Administrative-Workflows.md): Reception, appointment booking, and triage queues.
* [**`docs/06-Billing-and-Insurance.md`**](file:///c:/Users/MohammedSohail/OneDrive%20-%20IRISSTAR%20TECHNOLOGIES/GNU%20Health/docs/06-Billing-and-Insurance.md): QAR currency rules, invoice aggregation, and payment journals.
* [**`docs/07-Pharmacy.md`**](file:///c:/Users/MohammedSohail/OneDrive%20-%20IRISSTAR%20TECHNOLOGIES/GNU%20Health/docs/07-Pharmacy.md): E-prescribing, drug safety engine, and dispensary stock.
* [**`docs/08-Laboratory.md`**](file:///c:/Users/MohammedSohail/OneDrive%20-%20IRISSTAR%20TECHNOLOGIES/GNU%20Health/docs/08-Laboratory.md): Lab requisition, specimen accession, and result verification.
* [**`docs/09-Radiology.md`**](file:///c:/Users/MohammedSohail/OneDrive%20-%20IRISSTAR%20TECHNOLOGIES/GNU%20Health/docs/09-Radiology.md): Imaging modalities, study logs, and radiologist diagnostic reporting.
* [**`docs/10-Security-and-Roles.md`**](file:///c:/Users/MohammedSohail/OneDrive%20-%20IRISSTAR%20TECHNOLOGIES/GNU%20Health/docs/10-Security-and-Roles.md): Group access rules and EHR immutability (`perm_delete = False`).

---

## 4. Technical, Security & Deployment Documents

Infrastructure automation, security hardening, and operational runbooks:

* [**`PRODUCTION_SECURITY_PLAN.md`**](file:///c:/Users/MohammedSohail/OneDrive%20-%20IRISSTAR%20TECHNOLOGIES/GNU%20Health/PRODUCTION_SECURITY_PLAN.md): 14 security controls (Credential rotation, TLS 1.3 on Port 443, Port 8000 firewall).
* [**`TECHNICAL_DEBT.md`**](file:///c:/Users/MohammedSohail/OneDrive%20-%20IRISSTAR%20TECHNOLOGIES/GNU%20Health/TECHNICAL_DEBT.md): Risk log tracking unencrypted HTTP, default password, and missing fiscal year.
* [**`docs/02-System-Architecture.md`**](file:///c:/Users/MohammedSohail/OneDrive%20-%20IRISSTAR%20TECHNOLOGIES/GNU%20Health/docs/02-System-Architecture.md): Detailed infrastructure, OS, server daemon, and database topology.
* [**`docs/11-Configuration.md`**](file:///c:/Users/MohammedSohail/OneDrive%20-%20IRISSTAR%20TECHNOLOGIES/GNU%20Health/docs/11-Configuration.md): Server parameters, Tryton configuration, and Qatar localization.
* [**`docs/12-Integration.md`**](file:///c:/Users/MohammedSohail/OneDrive%20-%20IRISSTAR%20TECHNOLOGIES/GNU%20Health/docs/12-Integration.md): Tryton JSON-RPC 2.0 protocol specifications and external API hooks.
* [**`docs/13-Deployment.md`**](file:///c:/Users/MohammedSohail/OneDrive%20-%20IRISSTAR%20TECHNOLOGIES/GNU%20Health/docs/13-Deployment.md): Step-by-step GCP deployment runbook.
* [**`docs/17-Operations-and-Maintenance.md`**](file:///c:/Users/MohammedSohail/OneDrive%20-%20IRISSTAR%20TECHNOLOGIES/GNU%20Health/docs/17-Operations-and-Maintenance.md): Systemd service management, backups, and disaster recovery.
* [**`deploy_gcp_gnuhealth.sh`**](file:///c:/Users/MohammedSohail/OneDrive%20-%20IRISSTAR%20TECHNOLOGIES/GNU%20Health/deploy_gcp_gnuhealth.sh): Production GCP automated deployment script.
* [**`finish_setup.sh`**](file:///c:/Users/MohammedSohail/OneDrive%20-%20IRISSTAR%20TECHNOLOGIES/GNU%20Health/finish_setup.sh): Post-provisioning database initialization script.
* [**`startup_gnuhealth.sh`**](file:///c:/Users/MohammedSohail/OneDrive%20-%20IRISSTAR%20TECHNOLOGIES/GNU%20Health/startup_gnuhealth.sh): Systemd bootstrap script.
* [**`scripts/validate_system_integrity.ps1`**](file:///c:/Users/MohammedSohail/OneDrive%20-%20IRISSTAR%20TECHNOLOGIES/GNU%20Health/scripts/validate_system_integrity.ps1): Automated PowerShell system integrity, port exposure, and endpoint validation script.
* [**`scripts/validate_system_integrity.sh`**](file:///c:/Users/MohammedSohail/OneDrive%20-%20IRISSTAR%20TECHNOLOGIES/GNU%20Health/scripts/validate_system_integrity.sh): Automated Linux host system baseline and PostgreSQL integrity audit script.

---

## 5. Master Data & Requirements Intake Documents

* [**`MASTER_DATA_IMPLEMENTATION_PLAN.md`**](file:///c:/Users/MohammedSohail/OneDrive%20-%20IRISSTAR%20TECHNOLOGIES/GNU%20Health/MASTER_DATA_IMPLEMENTATION_PLAN.md): Data dictionary, validation rules, and intake CSV templates for Organization, Doctors, Tariffs, and Formulary.
* [**`PENDING_CLINIC_INPUT.md`**](file:///c:/Users/MohammedSohail/OneDrive%20-%20IRISSTAR%20TECHNOLOGIES/GNU%20Health/PENDING_CLINIC_INPUT.md): Detailed catalog of all required business inputs grouped by department with blocking status.
* [**`REQUIREMENTS_TRACEABILITY_MATRIX.md`**](file:///c:/Users/MohammedSohail/OneDrive%20-%20IRISSTAR%20TECHNOLOGIES/GNU%20Health/REQUIREMENTS_TRACEABILITY_MATRIX.md): Traceability matrix mapping requirements to Tryton modules, owners, and dependencies.
* [**`docs/15-Data-and-Master-Data.md`**](file:///c:/Users/MohammedSohail/OneDrive%20-%20IRISSTAR%20TECHNOLOGIES/GNU%20Health/docs/15-Data-and-Master-Data.md): Reference ontologies loaded (ICD-10, specialties, drug forms) vs clinic data pending.
* [**`configuration/master-data/`**](file:///c:/Users/MohammedSohail/OneDrive%20-%20IRISSTAR%20TECHNOLOGIES/GNU%20Health/configuration/master-data/): Active YAML ingestion templates (`doctors.yaml`, `medicines.yaml`, `insurance.yaml`, etc.).

---

## 6. Testing, Quality Assurance & UAT Documents

* [**`MASTER_UAT_PLAN.md`**](file:///c:/Users/MohammedSohail/OneDrive%20-%20IRISSTAR%20TECHNOLOGIES/GNU%20Health/MASTER_UAT_PLAN.md): 17 end-to-end verification scenarios covering new patient, doctor visit, e-prescribing, lab, radiology, and cashiering.
* [**`TEST_PLAN.md`**](file:///c:/Users/MohammedSohail/OneDrive%20-%20IRISSTAR%20TECHNOLOGIES/GNU%20Health/TEST_PLAN.md): Technical regression, integration, and smoke test specifications.
* [**`docs/14-Testing-and-QA.md`**](file:///c:/Users/MohammedSohail/OneDrive%20-%20IRISSTAR%20TECHNOLOGIES/GNU%20Health/docs/14-Testing-and-QA.md): QA methodologies and historical test purge verification.

---

## 7. Audit, Validation & Historical Archives

Comprehensive evidence of system inspection, verification, and hygiene:

### 7.1 Authoritative Implementation & Final Audit Reports (Final Phase)
* [**`audit/FINAL_PRODUCTION_AUDIT.md`**](file:///c:/Users/MohammedSohail/OneDrive%20-%20IRISSTAR%20TECHNOLOGIES/GNU%20Health/audit/FINAL_PRODUCTION_AUDIT.md): **Final Production System Audit Report**. Comprehensive synthesis of live infrastructure, network perimeter probes, application runtime, database census, and phase-by-phase implementation gates.
* [**`audit/GO_LIVE_EVIDENCE.md`**](file:///c:/Users/MohammedSohail/OneDrive%20-%20IRISSTAR%20TECHNOLOGIES/GNU%20Health/audit/GO_LIVE_EVIDENCE.md): **Definitive Go-Live Evidence Matrix**. Provides empirical status and proof across all 26 evaluation areas, gating evaluations, and authoritative blocker isolation.
* [**`audit/PRODUCTION_CHANGE_LOG.md`**](file:///c:/Users/MohammedSohail/OneDrive%20-%20IRISSTAR%20TECHNOLOGIES/GNU%20Health/audit/PRODUCTION_CHANGE_LOG.md): Authoritative Change Control Log tracking every live database modification (CHG-001 to CHG-005) with before/after state, commands, read-back evidence, and rollback methods.
* [**`audit/FINAL_DATABASE_AUDIT.md`**](file:///c:/Users/MohammedSohail/OneDrive%20-%20IRISSTAR%20TECHNOLOGIES/GNU%20Health/audit/FINAL_DATABASE_AUDIT.md): Exhaustive database census distinguishing Configuration Data from Operational Data; confirms 0 patients, 0 doctors, 0 invoices, zero duplicates, and referential integrity.
* [**`audit/FINAL_SECURITY_AUDIT.md`**](file:///c:/Users/MohammedSohail/OneDrive%20-%20IRISSTAR%20TECHNOLOGIES/GNU%20Health/audit/FINAL_SECURITY_AUDIT.md): Comprehensive security audit covering repository secret hygiene, administrative credential rotation status, transport layer encryption, daemon socket binding, and least privilege RBAC.
* [**`audit/FINAL_NETWORK_VALIDATION.md`**](file:///c:/Users/MohammedSohail/OneDrive%20-%20IRISSTAR%20TECHNOLOGIES/GNU%20Health/audit/FINAL_NETWORK_VALIDATION.md): Empirical TCP port probe results (80, 443, 8000, 5432, 22), HTTP response header analysis, and GCP VPC firewall rule evaluation.
* [**`audit/FINAL_UAT_REPORT.md`**](file:///c:/Users/MohammedSohail/OneDrive%20-%20IRISSTAR%20TECHNOLOGIES/GNU%20Health/audit/FINAL_UAT_REPORT.md): 17-scenario User Acceptance Testing report evaluating technical, clinical, nursing, diagnostic, pharmacy, billing, and accounting workflows against native models.
* [**`audit/BACKUP_AND_RESTORE_VALIDATION.md`**](file:///c:/Users/MohammedSohail/OneDrive%20-%20IRISSTAR%20TECHNOLOGIES/GNU%20Health/audit/BACKUP_AND_RESTORE_VALIDATION.md): PostgreSQL custom compressed backup architecture, automated retention schedule (30-day rolling), 4 empirical verification criteria, and isolated staging restore protocol.

### 7.2 Phase 0 Readiness & Historical Audit Archives
* [**`audit/PHASE_0_PRECHANGE_EVIDENCE.md`**](file:///c:/Users/MohammedSohail/OneDrive%20-%20IRISSTAR%20TECHNOLOGIES/GNU%20Health/audit/PHASE_0_PRECHANGE_EVIDENCE.md): Empirical pre-execution evidence matrix for Tryton, Nginx, PostgreSQL, backup, and credentials.
* [**`audit/PHASE_0_EXECUTION_PLAN.md`**](file:///c:/Users/MohammedSohail/OneDrive%20-%20IRISSTAR%20TECHNOLOGIES/GNU%20Health/audit/PHASE_0_EXECUTION_PLAN.md): Technical change plan with risk matrix, corrected Port 8000 security model, TLS plan, and credential rotation plan.
* [**`audit/PHASE_0_READINESS_REPORT.md`**](file:///c:/Users/MohammedSohail/OneDrive%20-%20IRISSTAR%20TECHNOLOGIES/GNU%20Health/audit/PHASE_0_READINESS_REPORT.md): Authoritative Phase 0 readiness report and execution gate evaluation.
* [**`audit/PHASE_0_FINAL_CORRECTION_LOG.md`**](file:///c:/Users/MohammedSohail/OneDrive%20-%20IRISSTAR%20TECHNOLOGIES/GNU%20Health/audit/PHASE_0_FINAL_CORRECTION_LOG.md): Authoritative change tracking and evidence reconciliation log.
* [**`audit/PHASE_0_EXECUTION_LOG.md`**](file:///c:/Users/MohammedSohail/OneDrive%20-%20IRISSTAR%20TECHNOLOGIES/GNU%20Health/audit/PHASE_0_EXECUTION_LOG.md): Pre-flight execution checklist, timestamp, and mandatory stop log.
* [**`audit/PHASE_0_POSTCHANGE_VALIDATION.md`**](file:///c:/Users/MohammedSohail/OneDrive%20-%20IRISSTAR%20TECHNOLOGIES/GNU%20Health/audit/PHASE_0_POSTCHANGE_VALIDATION.md): Post-change validation report, executed vs unexecuted changes, and residual risks.
* [**`audit/PHASE_0_ACCESS_REQUIREMENTS.md`**](file:///c:/Users/MohammedSohail/OneDrive%20-%20IRISSTAR%20TECHNOLOGIES/GNU%20Health/audit/PHASE_0_ACCESS_REQUIREMENTS.md): Technical and governance access requirements (SSH, Sudo, GCP IAM, DNS, Backup).
* [**`audit/PHASE_0_APPROVAL_MATRIX.md`**](file:///c:/Users/MohammedSohail/OneDrive%20-%20IRISSTAR%20TECHNOLOGIES/GNU%20Health/audit/PHASE_0_APPROVAL_MATRIX.md): Comprehensive approval and sign-off tracking matrix for Phase 0 execution.
* [**`audit/PHASE_0_OPERATOR_RUNBOOK.md`**](file:///c:/Users/MohammedSohail/OneDrive%20-%20IRISSTAR%20TECHNOLOGIES/GNU%20Health/audit/PHASE_0_OPERATOR_RUNBOOK.md): Authoritative 28-step future execution runbook with safety rules and rollback procedures.
* [**`audit/PHASE_0_EVIDENCE_CAPTURE_CHECKLIST.md`**](file:///c:/Users/MohammedSohail/OneDrive%20-%20IRISSTAR%20TECHNOLOGIES/GNU%20Health/audit/PHASE_0_EVIDENCE_CAPTURE_CHECKLIST.md): Technical pre- and post-change evidence checklist.
* [**`audit/PHASE_0_ACCESS_READINESS_FINAL_REPORT.md`**](file:///c:/Users/MohammedSohail/OneDrive%20-%20IRISSTAR%20TECHNOLOGIES/GNU%20Health/audit/PHASE_0_ACCESS_READINESS_FINAL_REPORT.md): Executive summary of the Phase 0 Access & Authorization Readiness Pack.
* [**`audit/POST_PHASE_0_SYSTEM_VALIDATION.md`**](file:///c:/Users/MohammedSohail/OneDrive%20-%20IRISSTAR%20TECHNOLOGIES/GNU%20Health/audit/POST_PHASE_0_SYSTEM_VALIDATION.md): Platform baseline and system integrity report cross-verifying versions, 24 activated modules, and zero operational records.
* [**`audit/FINAL_PRODUCTION_DATABASE_AUDIT.md`**](file:///c:/Users/MohammedSohail/OneDrive%20-%20IRISSTAR%20TECHNOLOGIES/GNU%20Health/audit/FINAL_PRODUCTION_DATABASE_AUDIT.md): Final production database integrity audit confirming zero duplicate entities, zero unauthorized users, and referential integrity.
* [**`audit/FINAL_IMPLEMENTATION_REPORT_ACCURACY_CHECK.md`**](file:///c:/Users/MohammedSohail/OneDrive%20-%20IRISSTAR%20TECHNOLOGIES/GNU%20Health/audit/FINAL_IMPLEMENTATION_REPORT_ACCURACY_CHECK.md): Authoritative accuracy check and terminology reconciliation report confirming zero live changes and standardized gating verdicts.
* [**`audit/FINAL_EVIDENCE_MATRIX.md`**](file:///c:/Users/MohammedSohail/OneDrive%20-%20IRISSTAR%20TECHNOLOGIES/GNU%20Health/audit/FINAL_EVIDENCE_MATRIX.md): Definitive 16-point technical and operational evidence verification matrix.
* [**`audit/LIVE_DATABASE_VALIDATION.md`**](file:///c:/Users/MohammedSohail/OneDrive%20-%20IRISSTAR%20TECHNOLOGIES/GNU%20Health/audit/LIVE_DATABASE_VALIDATION.md): Deep JSON-RPC query results across 29 models proving clean operational state (0 test records).
* [**`audit/SECOND_PASS_REPOSITORY_VALIDATION.md`**](file:///c:/Users/MohammedSohail/OneDrive%20-%20IRISSTAR%20TECHNOLOGIES/GNU%20Health/audit/SECOND_PASS_REPOSITORY_VALIDATION.md): File inventory and safety verification.
* [**`audit/FUNCTIONAL_COMPLETION_REVALIDATION.md`**](file:///c:/Users/MohammedSohail/OneDrive%20-%20IRISSTAR%20TECHNOLOGIES/GNU%20Health/audit/FUNCTIONAL_COMPLETION_REVALIDATION.md): Module-by-module re-assessment across 16 operational areas.
* [**`audit/REPOSITORY_CLEANUP_LOG.md`**](file:///c:/Users/MohammedSohail/OneDrive%20-%20IRISSTAR%20TECHNOLOGIES/GNU%20Health/audit/REPOSITORY_CLEANUP_LOG.md): Full audit log of all archived stubs, temporary files, and prototypes.
* [**`SECOND_PASS_FINAL_REPORT.md`**](file:///c:/Users/MohammedSohail/OneDrive%20-%20IRISSTAR%20TECHNOLOGIES/GNU%20Health/SECOND_PASS_FINAL_REPORT.md): Synthesis comparing initial audit claims with verified live realities.
* [**`FINAL_AUDIT_REPORT.md`**](file:///c:/Users/MohammedSohail/OneDrive%20-%20IRISSTAR%20TECHNOLOGIES/GNU%20Health/FINAL_AUDIT_REPORT.md): Executive audit report.
* [**`audit/project-discovery.md`**](file:///c:/Users/MohammedSohail/OneDrive%20-%20IRISSTAR%20TECHNOLOGIES/GNU%20Health/audit/project-discovery.md): Initial repository discovery scan.
* [**`audit/codebase-classification.md`**](file:///c:/Users/MohammedSohail/OneDrive%20-%20IRISSTAR%20TECHNOLOGIES/GNU%20Health/audit/codebase-classification.md): Technical classification of all repository folders.
* [**`audit/cleanup-changelog.md`**](file:///c:/Users/MohammedSohail/OneDrive%20-%20IRISSTAR%20TECHNOLOGIES/GNU%20Health/audit/cleanup-changelog.md): Changelog of initial codebase cleanup.
* [**`audit/technical-findings.md`**](file:///c:/Users/MohammedSohail/OneDrive%20-%20IRISSTAR%20TECHNOLOGIES/GNU%20Health/audit/technical-findings.md): Technical nuances of Tryton JSON-RPC.
* [**`gnuhealth-qatar-clinic-config/`**](file:///c:/Users/MohammedSohail/OneDrive%20-%20IRISSTAR%20TECHNOLOGIES/GNU%20Health/gnuhealth-qatar-clinic-config/): Historical archive containing 29 notes from the initial configuration phase.
* [**`backup/pre_cleanup_root_archive/`**](file:///c:/Users/MohammedSohail/OneDrive%20-%20IRISSTAR%20TECHNOLOGIES/GNU%20Health/backup/pre_cleanup_root_archive/): Safe backup storage of early root stubs and bootstrap files.
