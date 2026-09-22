# 03. Functional Modules Audit

**Project**: Healthcare Management System — GNU Health Implementation  
**Assessment Date**: 2026-09-21  
**Document**: `docs/03-Functional-Modules.md`  

---

## 1. Executive Summary

This document evaluates the twelve core outpatient healthcare functional modules within the installed GNU Health 5.0.7 / Tryton 7.0.57 environment. Each module is assessed based on live database queries, module code verification, and operational readiness.

---

## 2. Functional Modules Evaluation Matrix

| Module Domain | Underlying Model / Module | Current Status | Implemented Capabilities | Remaining Actions / Gaps |
| :--- | :--- | :--- | :--- | :--- |
| **1. Patient Registration** | `party.party`, `gnuhealth.patient` | `VERIFIED` | Demographics, PUID generation (`QAT` prefix), contact details, DOB, gender, nationality, emergency contacts, duplicate detection | Ingest real patient intake during live clinic operations |
| **2. Appointment Management** | `gnuhealth.appointment` | `VERIFIED` | Creation, physician selection, appointment type, date/time, queue status (`confirmed`, `checked_in`, `done`, `cancelled`), walk-in handling | Ingest real clinic doctor availability schedules |
| **3. OPD / Consultation** | `gnuhealth.patient.evaluation` | `VERIFIED` | Chief complaint, history, physical exam, vitals, ICD-10 pathology coding, progress notes, follow-up scheduling, discharge | Ingest clinic-specific clinical evaluation templates if needed |
| **4. Nursing / Triage** | `gnuhealth.patient.evaluation`, `health_nursing` | `VERIFIED` | Patient arrival, vital signs (BP, Pulse, Temp, RR, SpO2), nursing assessment, triage prioritization | Finalize physical triage station room allocations |
| **5. Pharmacy & Dispensing** | `gnuhealth.prescription.order`, `gnuhealth.medicament` | `PARTIALLY_IMPLEMENTED` | Rx order creation, dosage forms (94), routes (47), units (7), drug allergy safety check (`SM-CORE-0018`) | Ingest Qatar National Formulary (QNF) commercial medicines catalog |
| **6. Laboratory (LIMS)** | `gnuhealth.lab`, `health_lab` | `VERIFIED` | Test catalog (9 categories), test requisition, specimen tracking, result entry, reference ranges, doctor review | Ingest clinic-specific in-house lab panels and fees |
| **7. Radiology (RIS)** | `gnuhealth.imaging.test.request`, `health_imaging` | `VERIFIED` | Modality master (8 modalities), imaging test catalog (CXR), study requests, procedure completion, radiologist report | Ingest additional ultrasound and imaging examination types |
| **8. Billing & Cashier** | `account.invoice`, `health_services` | `PARTIALLY_CONFIGURED` / `PENDING_ACCOUNTING_APPROVAL` | QAR currency integration, customer invoice structure, cash/card journals, product service mapping | **Blocked by Gate 08**: Requires open fiscal year & periods in `account.fiscalyear` |
| **9. Health Insurance** | `gnuhealth.insurance`, `health_insurance` | `CONFIGURATION_REQUIRED`| Insurance payer models, policy numbers, validity periods, copay percentage calculation | Ingest contracted private insurance payers in Qatar (QLM, Alkoot, etc.) |
| **10. Security & RBAC** | `res.user`, `res.group`, `ir.model.access` | `VERIFIED` | 28 functional security groups, model-level access rules, EHR immutability enforcement | Provision individualized accounts for staff; rotate admin password |
| **11. Reporting Engine** | Tryton Report Engine, `gnuhealth.reporting` | `PARTIALLY_IMPLEMENTED` | Preloaded system reports (Prescription slip, Lab report, Appointment card, Evaluation summary) | Design clinic-approved bilingual (Arabic/English) headers |
| **12. API & Integration** | Tryton JSON-RPC (`/gnuhealth/`) | `VERIFIED` | Native JSON-RPC endpoint for all models; session authentication | TLS/HTTPS encryption required; no third-party REST/PACS connected |

---

## 3. Deep-Dive Module Breakdown

### 1. Patient Registration (`VERIFIED`)
- **Model**: `party.party` + `gnuhealth.patient`
- **Verification Evidence**: Party creation with `is_person = True` and `is_patient = True` successfully triggers PUID generation with country prefix `QAT`.
- **Nationalities Supported**: Qatar + 14 regional/expatriate nationalities verified in `country.country`.
- **Duplicate Prevention**: Tryton enforces unique identification rules and MRN indexing.

### 2. Appointment Management (`VERIFIED`)
- **Model**: `gnuhealth.appointment`
- **Verification Evidence**: Appointments support doctor assignment, date/time scheduling, outpatient status workflow (`draft` -> `confirmed` -> `checked_in` -> `done`).
- **Walk-in Handling**: Immediate arrival check-in routes patients directly to the triage/nursing queue.

### 3. OPD / Clinical Consultation (`VERIFIED`)
- **Model**: `gnuhealth.patient.evaluation`
- **Verification Evidence**: Full clinical encounter workflow supports chief complaint, subjective/objective findings, vital signs history, and WHO ICD-10 clinical coding from 14,416 diagnoses.
- **Safety Engine**: Automatically checks for drug-pregnancy and drug-allergy contraindications.

### 4. Nursing & Triage (`VERIFIED`)
- **Model**: `gnuhealth.hospital.unit` (ID: 2 `NURS`) + `gnuhealth.patient.evaluation`
- **Verification Evidence**: Supports dedicated nursing vital signs entry (systolic, diastolic, pulse, body temperature, respiratory rate, oxygen saturation).

### 5. Pharmacy (`PARTIALLY_IMPLEMENTED` / `PENDING_MEDICAL_APPROVAL`)
- **Model**: `gnuhealth.prescription.order`, `gnuhealth.prescription.line`, `gnuhealth.medicament`
- **Verification Evidence**: Prescription order numbering (`PRES 2026/XXXXXX`), safety acknowledgement (`SM-CORE-0018`), and dosage administration models work as designed.
- **Gap**: Zero commercial drugs are currently registered in `gnuhealth.medicament`. Requires loading Qatar National Formulary products.

### 6. Laboratory (`VERIFIED`)
- **Model**: `gnuhealth.lab`, `gnuhealth.lab.test_type`
- **Verification Evidence**: 9 preloaded laboratory categories (Hematology, Clinical Chemistry, Microbiology, etc.). Supports test request tracking, specimen collection dates, results capture, and diagnostic sign-off.

### 7. Radiology (`VERIFIED`)
- **Model**: `gnuhealth.imaging.test`, `gnuhealth.imaging.test.request`
- **Verification Evidence**: Modality support (X-Ray, Ultrasound, CT, MRI). Chest X-Ray (`CXR`) verified as an active diagnostic test linked to service billing.

### 8. Billing & Cashier (`PARTIALLY_CONFIGURED` / `PENDING_ACCOUNTING_APPROVAL`)
- **Model**: `account.invoice`, `account.invoice.line`, `health_services`
- **Verification Evidence**: QAR currency (`ر.ق`, 2 decimals) and 6 journals active.
- **Gap / Blocker**: Zero invoices can be posted because no active fiscal year is open in `account.fiscalyear`.

### 9. Insurance (`CONFIGURATION_REQUIRED` / `PENDING_CLINIC_INPUT`)
- **Model**: `gnuhealth.insurance`, `party.party`
- **Verification Evidence**: Data models for insurance policy management and copay rules exist natively in `health_insurance`.
- **Gap**: Requires clinic management to supply contracted payer names and policy contracts.

### 10. Security & User Roles (`VERIFIED`)
- **Model**: `res.user`, `res.group`, `ir.model.access`
- **Verification Evidence**: 28 distinct functional groups separate Front Desk, Nursing, Doctor, Pharmacy, Lab, Radiology, and Billing roles. Record immutability verified.

### 11. Reporting (`PARTIALLY_IMPLEMENTED`)
- **Model**: Tryton Report Engine / WeasyPrint / LibreOffice
- **Verification Evidence**: Native reports exist for prescriptions, lab results, and patient summaries.
- **Gap**: Needs clinic-approved bilingual (Arabic/English) layout headers.

### 12. API & Integration (`VERIFIED`)
- **Protocol**: Native JSON-RPC over HTTP/HTTPS.
- **Verification Evidence**: Fully verified programmatic login, search, read, write, and delete operations.
- **Gap**: Web endpoint requires TLS certificate (HTTPS Port 443).
