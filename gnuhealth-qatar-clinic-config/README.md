# GNU Health 5.0 — Qatar Outpatient Clinic Configuration Workspace

This directory contains the complete system configuration, master-data specifications, change logs, and validation evidence for the **Qatar Outpatient Clinic Management System** built on GNU Health 5.0 / Tryton 7.0.

---

## Workspace Directory Structure

```text
gnuhealth-qatar-clinic-config/
├── README.md                           # Master workspace overview and index
├── CURRENT_STATE.md                    # Live database state audit and record counts
├── clinic-config.yaml                  # Single human-readable configuration specification
├── SPECIALTY_MASTER_MAPPING.md         # Mapping of 73 preloaded specialties to outpatient clinics
├── WORKING_HOURS_TEMPLATE.md           # Weekly operating hours schedule template
│
├── master-data/                        # Master data definition templates (PENDING_CLINIC_INPUT)
│   ├── doctors.yaml                    # Physician roster and QCHP license template
│   ├── medicines.yaml                  # Pharmacy formulary and pricing template
│   ├── insurance.yaml                  # Qatar insurance payer and TPA template
│   ├── LABORATORY_SERVICE_TEMPLATE.yaml# Diagnostic laboratory catalog template
│   └── RADIOLOGY_SERVICE_TEMPLATE.yaml # Diagnostic imaging catalog template
│
├── backup/                             # Database snapshot information & rollback baseline
│   └── pre_config_snapshot.json        # Baseline JSON master data snapshot
│
├── 01_SYSTEM_AUDIT.md                  # Infrastructure, OS, and cloud stack audit
├── 02_GNU_HEALTH_MODEL_AUDIT.md        # Core GNU Health data models and constraints
├── 03_MODULE_AUDIT.md                  # Verification of 24 activated modules
├── 04_QATAR_CONFIGURATION.md           # Qatar localization (QAR, QA, timezone, languages)
├── 05_MASTER_DATA_INVENTORY.md         # Comprehensive master data inventory table
├── 06_USER_ROLE_MATRIX.md              # Role-Based Access Control (RBAC) security matrix
├── 07_DEPARTMENT_CONFIGURATION.md      # Hospital units (OPD, Nursing, Pharmacy, Lab, etc.)
├── 08_SERVICE_CATALOG.md               # Central outpatient service and fee catalog
├── 09_PHARMACY_CONFIGURATION.md        # Drug forms, routes, units, and safety engine
├── 10_RADIOLOGY_CONFIGURATION.md       # Imaging modalities, studies, and order workflows
├── 11_LABORATORY_CONFIGURATION.md      # Lab test types, specimen collection, and results
├── 12_BILLING_CONFIGURATION.md         # Outpatient billing in Qatari Riyal (QAR)
├── 13_INSURANCE_CONFIGURATION.md       # Health insurance and third-party payers
├── 14_ACCOUNTING_CONFIGURATION.md      # Accounting journals and Chart of Accounts plan
├── 15_CONFIGURATION_CHANGE_LOG.md      # Chronological audit trail of all changes
├── 16_VALIDATION_REPORT.md             # End-to-end clinical workflow test evidence
├── 17_PENDING_CLINIC_INPUT.md          # Action items awaiting clinic input
├── 18_BACKUP_INFORMATION.md           # Database backup procedures and verification
├── 19_ROLLBACK_PLAN.md                 # Safe rollback and disaster recovery plans
├── 20_POST_CONFIGURATION_AUDIT.md     # Independent audit of configuration vs claimed state
├── 21_TEST_DATA_CLEANUP_REPORT.md     # Purge of all synthetic test encounters & patients
├── 22_PRODUCTION_READINESS.md         # Production gate analysis across 11 key criteria
├── 23_SECURITY_AUDIT.md               # Credential hardening and HTTPS encryption audit
├── 24_FINAL_CONFIGURATION_STATUS.md   # Final configuration status matrix and taxonomy
│
├── configuration/
│   ├── raw_audit_dump.json             # Raw JSON-RPC audit response
│   ├── post_cleanup_verification.json  # Post-cleanup model verification counts
│   └── post_configuration_actual_state.md # Live database actual state specification
│
└── validation/                         # Dedicated validation evidence
    ├── PLACEHOLDER_DATA_AUDIT.md       # Audit of placeholder records requiring clinic input
    ├── TEST_DATA_CLEANUP_REPORT.md     # ORM deletion verification and dependency log
    ├── QAR_VERIFICATION.md             # QAR currency and exchange rate verification
    ├── COUNTRY_MASTER_AUDIT.md         # Qatar and 14 regional nationalities audit
    ├── ARABIC_LOCALIZATION_VERIFICATION.md # Arabic language and RTL layout verification
    ├── DEPARTMENT_AUDIT.md             # 8 hospital units verification
    ├── SPECIALTY_AUDIT.md              # 73 medical specialties audit
    └── SECURITY_AUDIT.md               # Transport and credential security review
```

---

## Live System Summary

- **URL**: `http://34.7.237.8` (Tryton SAO Web UI on Port 80/8000)
- **Database**: `gnuhealth` (PostgreSQL 15 on Debian 12, GCP Compute Engine)
- **Version**: GNU Health HMIS 5.0.7 / Tryton 7.0.57
- **Base Currency**: Qatari Riyal (`QAR`, `ر.ق`, 2 Decimals, Rate: `1.0000`)
- **Timezone**: `Asia/Qatar` (UTC+3)
- **Languages**: English (`en`) and Arabic (`ar`, RTL)
- **Departments**: 8 Active Hospital Units (OPD, Nursing, Pharmacy, Lab, Radiology, Billing, Insurance, Admin)
- **Operational Baseline**: Clean operational baseline (**0 patients, 0 doctors, 0 encounters, 0 invoices**; all synthetic test data safely purged).
- **Overall Verdict**: `CONFIGURATION BASELINE COMPLETE — PRODUCTION ACTIVATION PENDING CLINIC INPUT AND APPROVALS`.
