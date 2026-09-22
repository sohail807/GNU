# Healthcare Management System — GNU Health Implementation

[![Platform](https://img.shields.io/badge/Platform-GNU%20Health%20HMIS%205.0.7-blue.svg)](https://www.gnuhealth.org/)
[![Framework](https://img.shields.io/badge/Framework-Tryton%207.0.57-red.svg)](https://www.tryton.org/)
[![Database](https://img.shields.io/badge/Database-PostgreSQL%2015-green.svg)](https://www.postgresql.org/)
[![OS](https://img.shields.io/badge/OS-Debian%2012%20Bookworm-lightgrey.svg)](https://www.debian.org/)
[![Status](https://img.shields.io/badge/Status-Baseline%20Configured%20%7C%20Pending%20Approvals-orange.svg)]()

A professional, enterprise-grade deployment and configuration of the **GNU Health Hospital Management Information System (HMIS)**, established as a complete outpatient and ambulatory healthcare management solution for the **State of Qatar**.

---

## 1. Project Purpose & Relationship to GNU Health

This implementation utilizes the official upstream **GNU Health HMIS 5.0** platform running on the **Tryton 7.0 LTS** framework. 

GNU Health is a free/libre, community-driven health and hospital information system developed by GNU Solidario. This repository provides:
- Automated infrastructure-as-code runbooks for Google Cloud Platform (GCP).
- Complete Qatar localization (Qatari Riyal `QAR`, `ر.ق`, GCC demographics, Arabic RTL support, `Asia/Qatar` timezone).
- Clean institutional hierarchies and functional departmental routing (OPD, Triage, Pharmacy, Lab, Radiology, Billing, Insurance, Administration).
- Structured master data ingestion templates and verification audit trails.

> **Upstream Integrity**: This project does not fork, monkey-patch, or replace GNU Health core modules. All capabilities operate strictly through native Tryton ORM mechanisms, ensuring full upstream upgradeability.

---

## 2. Technology Stack & Runtime Architecture

```text
┌────────────────────────────────────────────────────────────────────────┐
│ Cloud Host: Google Cloud Platform (GCP Compute Engine: gnuhealth-srv) │
│ OS: Debian GNU/Linux 12 (Bookworm x86_64, Kernel 6.1)                  │
│                                                                        │
│   ┌────────────────────────────────────────────────────────────────┐   │
│   │ Nginx 1.22.1 (Reverse Proxy & Web Server)                      │   │
│   │ Host: APPLICATION SERVER / PRODUCTION HOST                     │   │
│   │ (Port 80 HTTP active / Port 443 HTTPS planned)                 │   │
│   └───────────────────────────────┬────────────────────────────────┘   │
│                                   │ Proxies to 127.0.0.1:8000          │
│   ┌───────────────────────────────▼────────────────────────────────┐   │
│   │ Trytond 7.0.57 Application Daemon                              │   │
│   │ Web UI: Tryton SAO 7.0 (Mounted at root)                       │   │
│   │ Runtime: Python 3.11.2 (Virtualenv: /home/gnuhealth/venv)       │   │
│   │ Protocol: Tryton JSON-RPC 2.0                                  │   │
│   └───────────────────────────────┬────────────────────────────────┘   │
│                                   │ Unix Domain Socket                 │
│   ┌───────────────────────────────▼────────────────────────────────┐   │
│   │ PostgreSQL 15.15 RDBMS                                         │   │
│   │ Database: gnuhealth (Encoding: UTF-8)                          │   │
│   └────────────────────────────────────────────────────────────────┘   │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Supported Outpatient Functional Areas

The system activates 24 core GNU Health / Tryton modules, natively supporting:

1. **Patient Registration & Intake**: PUID generation with Qatar country prefix (`QAT`), demographic capture, Civil ID / QID recording, and duplicate detection.
2. **Appointment Scheduling**: Outpatient calendar, doctor availability slots, visit status tracking (`draft` -> `confirmed` -> `checked_in` -> `done`), and walk-in routing.
3. **Nursing Triage**: Patient intake, queue prioritization, vital signs recording (BP, Pulse, RR, Temp, SpO2), and height/weight BMI tracking.
4. **Clinical OPD Encounters**: Subjective history, chief complaints, physical examination, and diagnostic coding from **14,416 WHO ICD-10** preloaded codes.
5. **Electronic Prescribing**: E-prescriptions with clinical safety rules identified in configured system (`SM-CORE-0018`).
6. **Diagnostic Laboratory (LIMS)**: 9 preloaded laboratory categories; test requisition, sample collection timestamps, results entry against reference ranges, and pathologist approval.
7. **Diagnostic Radiology (RIS)**: 8 preloaded modalities; imaging study requisition, procedure logging, and radiologist diagnostic reporting (Chest X-Ray CXR active).
8. **Billing & Invoicing**: Invoicing in Qatari Riyal (`QAR`), 6 financial journals, customer invoice lines linked to service products, and cashier receipting.
9. **Private Health Insurance**: Internal payer management, member policy tracking, and copay percentage splitting (e.g. 80/20 copay).
10. **Role-Based Security & EHR Immutability**: 28 security groups enforcing least-privilege access and legal record immutability (`perm_delete = False`).

---

## 4. Current System Status & Verification

> **`CONFIGURATION BASELINE COMPLETE — PRODUCTION ACTIVATION PENDING CLINIC INPUT AND APPROVALS`**

- **Live Access**: APPLICATION SERVER / CLINIC DOMAIN (Tryton SAO Web Client)
- **Active Currency**: Qatari Riyal (`QAR`, `ر.ق`, 2 Decimals, Rate: `1.0000`).
- **Active Languages**: English (`en`, LTR) and Arabic (`ar`, RTL).
- **Hospital Units**: 8 configured hospital units/departments identified in the current database. Operational workflow validation remains pending.
- **Operational Data Cleanliness**: **Zero synthetic records**. A complete 11-step proof-of-concept encounter was executed during validation, verified, backed up to JSON, and permanently purged via native Tryton ORM. Live tables contain **0 patients, 0 doctors, 0 appointments, 0 evaluations, 0 lab orders, 0 imaging requests, and 0 invoices**.

---

## 5. Known Limitations & Remaining Work

The system is technically sound but blocked from production clinical service by the following prerequisites:

| Area | Current Limitation | Pre-Production Requirement |
| :--- | :--- | :--- |
| **Transport Security** | Web access runs on plain HTTP (Port 80) | Bind official clinic domain; install TLS certificate on Port 443 |
| **Credentials** | Initial provisioning admin password active | Rotate Tryton superuser password; provision personal staff logins |
| **Invoicing** | Zero fiscal years open in `account.fiscalyear` | Clinic accountant must open FY 2026 and monthly periods |
| **Practitioners** | 0 doctors registered | Ingest licensed clinic doctors and QCHP license IDs |
| **Pharmacy** | 0 commercial medicines registered | Ingest Qatar National Formulary (QNF) approved drug catalog |
| **Fee Schedule** | 0 custom consultation tariffs | Clinic management must approve official QAR price tariffs |
| **Identity** | Holds `<CLINIC_NAME>` placeholder | Ingest official MOCI CR number, MOPH license code, Blue Plate address |

For the complete traceability matrix and priority breakdown, see [docs/16-Gaps-and-Remaining-Work.md](file:///c:/Users/MohammedSohail/OneDrive%20-%20IRISSTAR%20TECHNOLOGIES/GNU%20Health/docs/16-Gaps-and-Remaining-Work.md).

---

## 6. Repository Structure & Documentation Index

```text
/
├── README.md                           # Master project overview & architectural reference
├── DOCUMENTATION_INDEX.md              # Master navigation index across all project documents
├── FUNCTIONAL_IMPLEMENTATION_STATUS.md # Authoritative functional & operational implementation status
├── FINAL_REQUIREMENTS_BASELINE.md      # Authoritative clinical & non-functional requirements baseline
├── REQUIREMENTS_TRACEABILITY_MATRIX.md # Comprehensive requirements traceability matrix (RTM)
├── IMPLEMENTATION_MASTER_PLAN.md       # Master phased implementation roadmap & blueprint
├── IMPLEMENTATION_MASTER_STATUS.md     # Single authoritative operational implementation status
├── MASTER_DATA_IMPLEMENTATION_PLAN.md  # Organization, doctor, service & pharmacy intake templates
├── ACCOUNTING_IMPLEMENTATION_PLAN.md   # Chart of accounts, fiscal year & revenue mapping plan
├── INSURANCE_IMPLEMENTATION_PLAN.md    # Private health insurance & copay architecture
├── USER_ROLE_IMPLEMENTATION_PLAN.md    # 12 operational roles, RBAC matrix & permissions
├── CLINICAL_WORKFLOW_IMPLEMENTATION_PLAN.md # End-to-end outpatient clinical workflow specification
├── PRODUCTION_SECURITY_PLAN.md         # 14 security controls, credential rotation & TLS hardening
├── MASTER_UAT_PLAN.md                  # 17 end-to-end real clinic UAT verification scenarios
├── GO_LIVE_CHECKLIST.md                # Mandatory go-live gating checklist & sign-off block
├── PRE_IMPLEMENTATION_GATE.md          # Authoritative pre-implementation governance gate & blocker verdict
├── PENDING_CLINIC_INPUT.md             # Formal catalog of pending clinic stakeholder inputs
├── PROJECT_STATUS.md                   # Executive project status report
├── CHANGELOG.md                        # Chronological change log
├── FUNCTIONAL_COMPLETION_PLAN.md       # Operational master guide for clinic go-live
├── TECHNICAL_DEBT.md                   # Technical debt and risk assessment
├── TEST_PLAN.md                        # Pre-production test plan
├── FINAL_AUDIT_REPORT.md               # Senior implementation audit report
├── PRODUCTION_READINESS_ASSESSMENT.md  # Multi-pillar readiness & go-live gating assessment
├── SECOND_PASS_FINAL_REPORT.md         # Independent second-pass verification final report
│
├── docs/                               # Standardized system documentation
│   ├── REQUIREMENTS_BASELINE.md        # Formal requirements baseline & traceability matrix
│   ├── 01-Project-Overview.md          # Project purpose, background, and scope
│   ├── 02-System-Architecture.md       # Infrastructure, application, and database architecture
│   ├── 03-Functional-Modules.md        # Detailed audit of 12 functional domains
│   ├── 04-Clinical-Workflows.md        # 6 end-to-end outpatient workflow specifications
│   ├── 05-Administrative-Workflows.md  # Front-desk, triage queue, and cashier workflows
│   ├── 06-Billing-and-Insurance.md     # QAR currency, invoicing, and insurance policies
│   ├── 07-Pharmacy.md                  # E-prescribing, drug safety engine, and formulary
│   ├── 08-Laboratory.md                # LIMS architecture, test categories, and results
│   ├── 09-Radiology.md                 # RIS workflows, modalities, and report generation
│   ├── 10-Security-and-Roles.md        # User groups, permissions, and access rules
│   ├── 11-Configuration.md             # Tryton daemon and GNU Health configuration
│   ├── 12-Integration.md               # JSON-RPC protocols, endpoints, and external APIs
│   ├── 13-Deployment.md                # GCP Compute Engine step-by-step runbook
│   ├── 14-Testing-and-QA.md            # Testing strategies and validation results
│   ├── 15-Data-and-Master-Data.md      # Data dictionary, ontologies, and seed data
│   ├── 16-Gaps-and-Remaining-Work.md   # Prioritized gap analysis & execution roadmap
│   └── 17-Operations-and-Maintenance.md# System administration, backups, and disaster recovery
│
├── audit/                              # Technical audit evidence
│   ├── PHASE_0_PRECHANGE_EVIDENCE.md   # Empirical pre-execution evidence matrix
│   ├── PHASE_0_EXECUTION_PLAN.md       # Technical change plan, Port 8000 model, and TLS plan
│   ├── PHASE_0_READINESS_REPORT.md     # Authoritative Phase 0 readiness report and execution gate
│   ├── FINAL_EVIDENCE_MATRIX.md        # Definitive 16-point technical and operational evidence matrix
│   ├── REPOSITORY_CLEANUP_LOG.md       # Authoritative file archival and cleanup audit trail
│   ├── FINAL_DOCUMENTATION_VALIDATION.md # Final quality assurance & governance audit
│   ├── SECOND_PASS_REPOSITORY_VALIDATION.md # Repository file inventory & safety audit
│   ├── LIVE_DATABASE_VALIDATION.md     # Live Tryton JSON-RPC model verification
│   ├── FUNCTIONAL_COMPLETION_REVALIDATION.md # Domain-by-domain functional audit
│   ├── project-discovery.md            # Initial codebase scan and file inventory
│   ├── codebase-classification.md      # Classification of every repository component
│   ├── cleanup-changelog.md            # Deletion log and safety check evidence
│   └── technical-findings.md           # Runtime discoveries, RPC nuances, and behaviors
│
├── configuration/                      # Active configuration baseline
│   ├── clinic-config.yaml              # Declarative clinic configuration specification
│   ├── master-data-status.md           # Master data readiness matrix
│   ├── post_configuration_actual_state.md # Live database actual state specification
│   └── master-data/                    # YAML ingestion templates (Doctors, Rx, Insurance)
│
├── deployment/                         # Cloud infrastructure automation
│   ├── deploy_gcp_gnuhealth.sh         # Automated GCP provisioning script
│   ├── finish_setup.sh                 # VM post-install finalizer script
│   ├── startup_gnuhealth.sh            # VM startup and package installation script
│   └── archive/                        # Preserved prototype deployment scripts
│
├── backup/                             # Verified backup archives
│   ├── pre_config_snapshot.json        # Pre-configuration baseline database snapshot
│   ├── test_data_before_cleanup.json   # Export of synthetic encounter data prior to purge
│   └── pre_cleanup_root_archive/       # Safety backup of cleaned root files
│
└── his/                                # Upstream GNU Health HMIS 5.0.7 source repository
```

---

## 7. Licensing & Upstream Attribution

- **GNU Health**: Copyright © 2008–2026 GNU Solidario / Luis Falcón. Licensed under the **GNU General Public License v3.0 (GPL-3.0)** or later.
- **Tryton Application Framework**: Copyright © Tryton Foundation. Licensed under GPL-3.0.
- This implementation preserves all upstream copyrights, licenses, and module attributions without alteration.
