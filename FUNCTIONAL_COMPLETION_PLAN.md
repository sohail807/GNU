# Functional Completion Plan & Remaining Work

**Project Title**: Healthcare Management System — GNU Health Implementation  
**Platform**: GNU Health HMIS 5.0.7 / Tryton 7.0.57 / PostgreSQL 15  
**Assessment Date**: 2026-09-21  
**Lead Auditor**: Senior Software Architect & Healthcare Systems Analyst  
**Document**: `FUNCTIONAL_COMPLETION_PLAN.md`  

---

## Executive Overview

This master document serves as the single authoritative operational guide for project management, medical leadership, finance, and technical teams. It provides unambiguous, evidence-backed answers to the fourteen essential questions governing the production readiness of this outpatient clinic implementation.

---

## 1. What is already working?

The following capabilities have been tested and verified on the live system:
- **Cloud Infrastructure & Web Client**: GCP Debian 12 host (`34.7.237.8`), Nginx reverse proxy, PostgreSQL 15, and Tryton SAO 7.0 web client.
- **Geopolitical & National Identity**: Qatar host country configuration (`QA`, `QAT`, `634`), 14 regional nationalities preloaded, and automated `QAT` PUID prefix generation.
- **QAR Currency Engine**: ISO code `QAR`, official symbol `ر.ق`, 2 decimal digits, `0.01` rounding factor, and base exchange rate `1.0000`.
- **Localization**: English (`en`, LTR) and Arabic (`ar`, RTL) language models active. Timezone configured to `Asia/Qatar` (UTC+3).
- **Institutional Subunits**: 8 hospital units active (OPD, Nursing, Pharmacy, Lab, Radiology, Billing, Insurance, Administration).
- **WHO ICD-10 Coding**: 14,416 diagnoses active for immediate clinical coding.
- **Medical Specialties**: 73 international specialties preloaded with zero duplicates.
- **Diagnostic Catalog Baselines**: 9 laboratory categories and 8 imaging modalities preloaded; Chest X-Ray study active.
- **Clinical Safety Rules**: Medical evaluation EHR immutability (`perm_delete = False`), doctor license verification, and prescription allergy/pregnancy safety acknowledgement (`SM-CORE-0018`).
- **Clean Operational Baseline**: All synthetic test encounters, patients, and doctors safely purged via ORM. Zero test records remain.

---

## 2. What is partially working?

- **Arabic Localization**: Arabic language activation and RTL layout switching are verified; however, bilingual (Arabic / English) patient printout headers (prescriptions, consultation summaries, invoices) require layout approval.
- **Pharmacy Prescribing Workflow**: Prescriptions can be generated and numbered; however, the commercial medication table contains 0 records, preventing physicians from picking real drugs until the clinic formulary is ingested.
- **Invoicing Architecture**: The connection between medical services, customer invoice structures, and journals is configured; however, invoices cannot be posted to the general ledger because no fiscal year is active.

---

## 3. What is only configured but not tested?

- **Health Insurance Policy Management**: Models for insurance companies, TPAs, policy numbers, validity dates, and copay splits exist natively in `health_insurance`, but no live claim settlement has been run against a contracted Qatar payer.
- **Service Billing from Ancillary Orders**: Requisition-to-billing triggers (`health_services`) are installed, but invoice line posting requires active fiscal periods.

---

## 4. What is missing?

- **SSL/TLS Encryption**: Port 443 HTTPS is missing; traffic runs on plain HTTP Port 80.
- **Official Clinic Legal Identity**: Registered commercial name, MOCI CR number, MOPH license code, and Blue Plate address.
- **Physician Roster**: Real doctors with QCHP license numbers and primary specialties.
- **Commercial Medication Formulary**: Real pharmaceutical products in `gnuhealth.medicament`.
- **Outpatient Price Tariffs**: Agreed consultation fee schedule in QAR.
- **Active Accounting Fiscal Year**: Open fiscal year and monthly periods in `account.fiscalyear`.
- **Named Employee Accounts**: Individual logins with least-privilege security roles.

---

## 5. What requires master data?

The clinic must provide the following structured data (templates provided in `configuration/master-data/`):
1. **Clinic Registration Details**: Official name, CR, MOPH license, Blue Plate address.
2. **Physicians**: Full legal names, QCHP license IDs, medical specialties, assigned OPD rooms.
3. **Medicines**: Qatar National Formulary compliant drug list (Brand, Generic, Strength, Form, Route, Unit, Retail Price).
4. **Services & Prices**: Consultation tariffs (GP, Specialist, Follow-up) and diagnostic test charges in QAR.
5. **Insurance Providers**: List of contracted private insurance companies and TPAs.

---

## 6. What requires configuration?

1. **Accounting Fiscal Year Setup**: Creating FY 2026 and 12 monthly accounting periods in `account.fiscalyear`.
2. **Chart of Accounts Mapping**: Linking default receivable, revenue, cash, and tax accounts to company 2.
3. **Nginx Web Server Configuration**: Installing TLS certificates, binding the clinic domain, and enforcing HTTPS on Port 443.
4. **GCP Firewall Rule Update**: Restricting Port 8000 to localhost only.

---

## 7. What requires custom development? & Requirements Baseline

> **Baseline Status: NO FORMAL REQUIREMENTS BASELINE IDENTIFIED.**  
> Based on standard outpatient clinic operational scope, native GNU Health 5.0.7 and Tryton 7.0.57 provide the necessary functional capabilities for ambulatory clinic operations. No custom development has been identified as necessary for core workflows, subject to final clinic stakeholder review and sign-off on specialized third-party integrations (e.g. NPHIES insurance clearinghouse, lab analyzer interfacing). Rebuilding custom frontends or coding custom backend modules is unwarranted and strongly discouraged.

---

## 8. What requires third-party integration?

- **Immediate Launch**: **None**. Operations will run with Tryton SAO web interface, physical POS card machines, and manual analyzer result entry.
- **Phase 2 (Optional Post-Go-Live)**:
  - Local Qatar SMS Gateway for automated patient appointment reminders.
  - SMTP Relay for transactional email receipts.
  - Orthanc DICOM Server for high-resolution radiology image archiving.

---

## 9. What requires accounting/financial decisions?

1. Review and adoption of the clinic Chart of Accounts.
2. Approval of the clinic fiscal year calendar.
3. Establishing cashier drawer float limits and daily cash reconciliation procedures.
4. Merchant bank accounts for credit/debit card POS terminal settlement.

---

## 10. What requires medical/clinical decisions?

1. Formal sign-off on the outpatient medication formulary (QNF compliance).
2. Approval of in-house vs. outsourced laboratory test panels.
3. Assignment of primary specialties (`mainsp`) to licensed physicians based on QCHP evaluation certificates.
4. Standard consultation slot durations (e.g. 15 vs 20 minutes).

---

## 11. What requires management approval?

1. Outpatient consultation and diagnostic price schedule in QAR.
2. Contracting terms with private health insurance payers.
3. Clinic weekly operating hours and staffing shift schedules.
4. Final authorization for clinical go-live cutover.

---

## 12. What is blocking production?

```text
[CRITICAL PRODUCTION BLOCKERS]
  ├── Blocker 1: Unencrypted Web Access (Plain HTTP Port 80 -> Needs TLS Port 443)
  ├── Blocker 2: Unrotated Superuser Admin Password (Initial provisioning string active)
  ├── Blocker 3: Missing Fiscal Year (Zero records in account.fiscalyear -> Invoicing blocked)
  ├── Blocker 4: Missing Licensed Doctors (Zero records in gnuhealth.healthprofessional)
  ├── Blocker 5: Missing Commercial Medicines (Zero records in gnuhealth.medicament)
  ├── Blocker 6: Missing Price Tariffs (Zero custom tariffs in QAR)
  └── Blocker 7: Placeholder Clinic Identity (<CLINIC_NAME> on invoices and prescriptions)
```

---

## 13. What can be completed immediately?

1. **Firewall Rule Restriction**: Update GCP firewall rule `allow-gnuhealth-web` to close public Port 8000.
2. **Domain & TLS Setup**: Bind clinic domain and execute Certbot for free Let's Encrypt TLS certificate.
3. **Admin Password Rotation**: Execute `trytond-admin -c trytond.conf -d gnuhealth -p`.
4. **Fiscal Year Activation**: Open FY 2026 and monthly periods via Tryton SAO or JSON-RPC.

---

## 14. What should NOT be changed?

1. **Core Source Tree (`his/`)**: Do not alter GNU Health or Tryton core source files.
2. **Preloaded Ontologies**: Preserve the 14,416 WHO ICD-10 diagnoses, 73 specialties, 94 drug forms, and 47 routes.
3. **QAR Currency Configuration**: Currency ID 3 and base rate 1.0000 are verified and must remain untouched.
4. **Federation Prefix**: `gnuhealth.federation.country.config` ID 1 mapped to Qatar (`QAT`) must be preserved.
5. **EHR Immutability Rules**: Keep `perm_delete = False` on `gnuhealth.patient.evaluation`.
