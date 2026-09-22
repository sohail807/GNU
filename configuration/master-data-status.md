# Master Data Status & Governance

**Project**: Healthcare Management System — GNU Health Implementation  
**Assessment Date**: 2026-09-21  
**Status**: `VERIFIED CONFIGURATION BASELINE`  

---

## 1. Master Data Classification & Readiness Matrix

| Master Data Domain | Current Record Count | Live System State | Governance Status | Action Required Prior to Go-Live |
| :--- | :---: | :--- | :--- | :--- |
| **Geopolitical (Qatar)** | 1 | `QA` / `QAT` / `634` | `VERIFIED` | None |
| **Regional Nationalities**| 14 | GCC & expat countries | `VERIFIED` | None |
| **Operating Currency (QAR)**| 1 | `QAR`, `ر.ق`, 2 Decimals | `VERIFIED` | None |
| **Currency Base Rate** | 1 | Rate: `1.0000` | `VERIFIED` | None |
| **Languages & Localization**| 2 | English (LTR) & Arabic (RTL)| `VERIFIED` | Bilingual printout templates |
| **Federation Account Config**| 1 | Mapped to Qatar (`QAT`) | `VERIFIED` | None |
| **Hospital Departments** | 8 | OPD, Nursing, Rx, Lab, Rad, Billing, Ins, Admin | `VERIFIED` | Room numbers from clinic floorplan |
| **Medical Specialties** | 73 | Standard WHO catalog | `VERIFIED` (0 Duplicates) | None |
| **WHO ICD-10 Diagnoses** | 14,416 | Complete international set | `VERIFIED` | None |
| **Preloaded Services** | 15 | Diagnostic & consultation templates | `VERIFIED` | Custom price schedule |
| **Clinic Legal Identity** | 1 | `<CLINIC_NAME>` placeholder | `PENDING_CLINIC_INPUT` | Provide MOCI CR & MOPH license |
| **Physicians / Doctors** | 0 | Test records purged | `PENDING_MEDICAL_APPROVAL`| Ingest licensed staff & QCHP IDs |
| **Pharmacy Formulary** | 0 | 94 forms & 47 routes exist | `PENDING_MEDICAL_APPROVAL`| Ingest QNF-approved drug catalog |
| **Outpatient Fee Schedule**| 0 custom | Standard templates exist | `PENDING_CLINIC_INPUT` | Sign-off on QAR tariffs |
| **Private Insurance Payers**| 0 | Framework active | `PENDING_CLINIC_INPUT` | Ingest contracted payers (QLM, etc.) |
| **Chart of Accounts** | 7 | Minimal chart loaded | `PENDING_ACCOUNTING_APPROVAL` | Review/adopt clinic account tree |
| **Fiscal Year & Periods** | 0 | Required for invoice posting | `PENDING_ACCOUNTING_APPROVAL` | Open operational financial year |

---

## 2. Ingestion Templates Directory

Structured YAML ingestion templates are provided in [master-data/](file:///c:/Users/MohammedSohail/OneDrive%20-%20IRISSTAR%20TECHNOLOGIES/GNU%20Health/configuration/master-data/):
- `doctors.yaml`: Doctor registration, user accounts, and QCHP licensing.
- `medicines.yaml`: Medication formulary, ATC codes, forms, routes, and pricing.
- `insurance.yaml`: Contracted insurance payers, TPAs, and policy templates.
- `LABORATORY_SERVICE_TEMPLATE.yaml`: Laboratory test panels and sample types.
- `RADIOLOGY_SERVICE_TEMPLATE.yaml`: Imaging modalities and study types.
