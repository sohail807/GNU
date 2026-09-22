# 20. Post-Configuration Audit

**Audit Date**: 2026-09-21  
**Auditor Role**: Senior GNU Health 5.0 / Tryton 7.0 Implementation Auditor  
**Environment**: GCP Compute Engine `gnuhealth-srv` (Debian 12, IP: `34.7.237.8`)  
**Stack**: GNU Health HMIS 5.0.7 / Tryton 7.0.57 / PostgreSQL 15.15 / Database: `gnuhealth`  
**Overall System Status**: `CONFIGURATION BASELINE COMPLETE — PRODUCTION ACTIVATION PENDING CLINIC INPUT AND APPROVALS`  

---

## 1. Audit Scope & Protocol

This independent audit evaluated every change performed on the live GNU Health system, contrasting actual database records against claims made in previous implementation reports. 

The audit utilized direct Tryton JSON-RPC inspection (`model.<name>.search_read`) across all core operational models.

---

## 2. Actual vs. Claimed Implementation Analysis

| Domain / Component | Claimed in Previous Report | Actual Audit Finding | Discrepancy / Correction | Final Classification |
| :--- | :--- | :--- | :--- | :--- |
| **System Stack** | GNU Health 5.0.7 / Tryton 7.0.57 on Debian 12 | Confirmed exactly: GNU Health 5.0.7, Tryton 7.0.57, Python 3.11, PostgreSQL 15 | Accurate | `VERIFIED` |
| **Active Modules** | 24 modules active | All 24 modules active in `ir.module` | Accurate | `VERIFIED` |
| **QAR Currency** | Configured QAR, Symbol `ر.ق`, 2 digits, rounding `0.01`, rate `1.0` | `currency.currency` ID 3 contains QAR, `ر.ق`, `0.01`, rate `1.0000` | Accurate | `VERIFIED` |
| **Country Master** | Qatar + 14 regional nationalities | `country.country` contains Qatar (`QA`, `QAT`, `634`) + 14 GCC/expat countries | Accurate | `VERIFIED` |
| **Federation Prefix** | Configured `QAT` | `gnuhealth.federation.country.config` ID 1 mapped to Country 1 (`QAT`) | Accurate | `VERIFIED` |
| **Languages & RTL** | English & Arabic active, RTL verified | `ir.lang` has `en` (LTR) and `ar` (RTL) marked translatable | Accurate | `VERIFIED` |
| **Clinic Organization** | Company ID 2, Party ID 2, Institution ID 2 (`CLINIC-QA`) | Confirmed live records with timezone `Asia/Qatar` | Uses placeholder `<CLINIC_NAME>` | `VERIFIED` (Placeholder) |
| **Hospital Units** | 8 Units (OPD, NURS, PHARM, LAB, RAD, BILL, INS, ADMIN) | `gnuhealth.hospital.unit` contains all 8 units linked to Institution 2 | Accurate | `VERIFIED` |
| **Medical Specialties** | 73 Specialties available | `gnuhealth.specialty` contains 73 preloaded standard specialties | Accurate, 0 duplicates | `VERIFIED` |
| **Billing & Invoicing** | "Billing and invoicing verified" | `account.invoice`: 0 records; `account.fiscalyear`: 0 records; no fiscal year open | **Significant Overstatement**: Invoicing was NOT executed or verified; no invoice moves were posted | **Corrected to**: `PARTIALLY_CONFIGURED` / `PENDING_ACCOUNTING_APPROVAL` |
| **Accounting Chart** | Minimal chart loaded | `account.account`: 7 minimal accounts loaded; no custom Qatar chart | Requires clinic accountant review | `PARTIALLY_CONFIGURED` / `PENDING_ACCOUNTING_APPROVAL` |
| **Test Encounter Data**| "Demonstrated complete clinical workflow" | Created synthetic Patient, Doctor, Appointment, Lab, Imaging, Prescription | Synthetic records persisted on live system | **Cleaned Up**: All test records safely purged via ORM |

---

## 3. Detailed Audit Findings

### Finding AUD-01: Invoicing & Billing Overstatement [CRITICAL AUDIT FINDING]
- **Issue**: The previous final report asserted that billing and invoicing were verified.
- **Evidence**: Inspection of `account.invoice` returned 0 records. `account.fiscalyear` returned 0 records. In Tryton, an invoice cannot be confirmed or posted to the general ledger without an active fiscal year and open accounting periods.
- **Correction**: Billing configuration is downgraded from `VERIFIED` to `PARTIALLY_CONFIGURED` / `PENDING_ACCOUNTING_APPROVAL`. The clinic must provide its preferred Chart of Accounts and fiscal calendar before live billing can be verified.

### Finding AUD-02: Synthetic Test Records in Live Operational Database [RESOLVED]
- **Issue**: Test records from the initial encounter demonstration remained in the live tables (`PLI528CHX`, `TEST - Dr. Outpatient Consultant`, test appointment, lab, imaging, prescription).
- **Remediation**: All 9 synthetic records were extracted to `gnuhealth-qatar-clinic-config/backup/test_data_before_cleanup.json` and deleted in reverse dependency order using Tryton ORM. Live clinical tables now contain strictly 0 records.

### Finding AUD-03: Placeholder Clinic Identity [PENDING_CLINIC_INPUT]
- **Issue**: Party 2 and Address 1 contain placeholders: `<CLINIC_NAME>`, `<STREET>`, Zone `<ZONE>`, Building `<BUILDING>`, `<CITY>`.
- **Status**: Proper and expected at this stage. Clinic management must supply official Commercial Registration (CR) and MOPH licensing certificates to replace these placeholders.

### Finding AUD-04: Security & Transport Encryption [SECURITY_REVIEW_REQUIRED]
- **Issue**: Web access remains on plain HTTP (Port 80); initial default admin credentials remain active.
- **Status**: Production blocker. Must be addressed prior to clinical go-live.

---

## 4. Model Record Counts Post-Audit & Cleanup

```json
{
  "currency.currency": 1,
  "currency.currency.rate": 2,
  "country.country": 15,
  "gnuhealth.federation.country.config": 1,
  "ir.lang (translatable)": 2,
  "party.party (clinic only)": 1,
  "party.address": 1,
  "company.company": 1,
  "gnuhealth.institution": 1,
  "gnuhealth.hospital.unit": 8,
  "gnuhealth.specialty": 73,
  "product.product": 15,
  "gnuhealth.imaging.test": 1,
  "account.account": 7,
  "account.journal": 6,
  "account.fiscalyear": 0,
  "account.invoice": 0,
  "gnuhealth.patient": 0,
  "gnuhealth.healthprofessional": 0,
  "gnuhealth.hp_specialty": 0,
  "gnuhealth.appointment": 0,
  "gnuhealth.patient.evaluation": 0,
  "gnuhealth.lab": 0,
  "gnuhealth.imaging.test.request": 0,
  "gnuhealth.prescription.order": 0,
  "gnuhealth.prescription.line": 0
}
```

The database is completely pristine, auditable, and ready for official clinic master data loading upon management approval.
