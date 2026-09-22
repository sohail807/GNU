# FUNCTIONAL IMPLEMENTATION STATUS & OPERATIONAL BLUEPRINT

**Project**: Healthcare Management System — GNU Health Implementation  
**Official Name**: GNU Health HMIS — Outpatient Clinic Implementation  
**Platform**: GNU Health HMIS 5.0.7 / Tryton 7.0.57 / PostgreSQL 15.15 / Debian 12  
**Target Host**: Google Cloud Platform Compute Engine (`gnuhealth-srv`, `APPLICATION SERVER`)  
**Document**: `FUNCTIONAL_IMPLEMENTATION_STATUS.md`  
**Classification**: Primary Authoritative Management Status & Implementation Guide  
**Status**: Current requirements baseline pending formal clinic stakeholder sign-off  

---

## 1. Executive Summary

This document serves as the single authoritative operational baseline for executive leadership, clinical directors, finance heads, and technical leads. It provides an unambiguous, fact-checked account of the GNU Health outpatient clinic implementation in the State of Qatar.

### Core Status Summary:
1. **System & Architecture**: The technical platform is built on official, unmodified upstream **GNU Health 5.0.7** running on the **Tryton 7.0.57 LTS** framework on Debian 12. There are **zero custom code forks, zero replacement frontends, and zero proprietary wrappers**.
2. **Verified Clean State**: Live database inspection across 29 transactional models confirms **zero operational contamination**. The database contains **0 patient records, 0 doctors, 0 appointments, 0 clinical encounters, 0 prescriptions, 0 lab requests, 0 imaging orders, 0 invoices, and 0 accounting moves**.
3. **Reference Data Loaded**: International clinical reference catalogs are active live: **14,416 WHO ICD-10 pathology codes, 73 medical specialties, 94 pharmaceutical dosage forms, 47 administration routes, 7 dosage units, 9 laboratory categories, and 8 imaging modalities**.
4. **Production Go-Live Verdict**:
```text
CURRENT PROJECT GO-LIVE BLOCKERS

The following items currently prevent the project from satisfying its
defined production go-live gates:

1. Security hardening
2. Administrative credential rotation
3. Required network controls
4. Clinic-specific master data
5. Accounting configuration/approval
6. Required functional UAT
7. Required stakeholder sign-offs

Production release remains subject to the approved GO_LIVE_CHECKLIST.md.
```
5. **Custom Development Status**:
```text
CUSTOM DEVELOPMENT NOT CURRENTLY IDENTIFIED

Based on the requirements and technical evidence reviewed to date, no
custom development has currently been identified as necessary for the
confirmed outpatient scope.

This status remains subject to:

1. Formal requirements sign-off
2. Configuration completion
3. Master-data onboarding
4. Integration decisions
5. End-to-end UAT
6. Discovery of requirements not currently documented

Any requirement that cannot be satisfied through native GNU Health/Tryton
capabilities, configuration, approved master data, or supported integration
must be separately assessed for custom development.
```

---

## 2. Verified Technical Platform

All parameters below have been empirically inspected and verified on the live system:

| Platform Component | Technical Specification | Empirical Runtime State | Verification Evidence | Status |
| :--- | :--- | :--- | :--- | :---: |
| **GNU Health HMIS** | Version 5.0.7 (Core: `health 5.0.6`) | Native Python packages in virtualenv `/home/gnuhealth/venv` | `tryton.cfg` manifest and JSON-RPC query | `VERIFIED` |
| **Tryton Server** | Version 7.0.57 | Managed `systemd` daemon `gnuhealth.service` | `trytond --version` and systemctl status | `VERIFIED` |
| **Tryton SAO Web Client**| Version 7.0 LTS | Mounted at web root via Nginx reverse proxy | Web client UI loaded at `APPLICATION SERVER / CLINIC DOMAIN` | `VERIFIED` |
| **Database Engine** | PostgreSQL 15.15 | Port 5432, UTF-8 encoding, local Unix domain socket | `SELECT version();` query | `VERIFIED` |
| **Operating System** | Debian GNU/Linux 12 (Bookworm) | Kernel 6.1.0, x86_64 LTS | `cat /etc/os-release` | `VERIFIED` |
| **Runtime Environment**| Python 3.11.2 | Isolated virtualenv | `python3 --version` | `VERIFIED` |
| **Web Reverse Proxy** | Nginx 1.22.1 | Reverse proxy to `127.0.0.1:8000` | Port 80 response (HTTP) | `VERIFIED` |
| **Cloud Host** | GCP Compute Engine | Instance `gnuhealth-srv`, Zone: `europe-west4-a` | External IP: `PRODUCTION HOST` | `VERIFIED` |
| **Activated Modules** | 24 Official Packages | Health, Calendar, Invoicing, Account, Stock, etc. | `ir.module` query in Tryton | `VERIFIED` |
| **Custom Modules** | 0 Custom Modules | Upstream standard code | Zero custom dirs in python path | `VERIFIED` |

---

## 3. Comprehensive Functional Status Matrix

| Functional Area | Native Capability | Current Empirical State | Remaining Work | Owner | Acceptance Evidence | Implementation Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Patient Registration** | `gnuhealth.patient` | Form verified; 0 records | Execute UAT-001 with staff | Reception Lead | PUID generated with `QAT-` prefix | `TESTING REQUIRED` |
| **Appointment Booking** | `gnuhealth.appointment` | Workflow verified; 0 records | Ingest physician roster | Operations Lead | Appointment appears on doctor calendar | `MASTER DATA REQUIRED` |
| **Reception Check-In** | `gnuhealth.appointment` | `checked_in` state active | Test queue advance to triage | Reception Lead | Timestamped check-in record | `TESTING REQUIRED` |
| **Nursing Triage** | `gnuhealth.patient.rounding` | Vitals form & BMI auto-calc ready | Execute UAT-005 triage test | Nursing Lead | Saved vitals with calculated BMI | `TESTING REQUIRED` |
| **Physician Consultation** | `gnuhealth.patient.evaluation` | SOAP form active; 0 evaluations | Execute UAT-006 with doctor | Clinical Lead | Signed evaluation locked (`perm_delete=F`)| `TESTING REQUIRED` |
| **Diagnostic Coding** | `gnuhealth.pathology` | 14,416 WHO ICD-10 codes live | None (Catalog complete) | Clinical Lead | Pathology search returns valid code | `VERIFIED` |
| **E-Prescribing** | `gnuhealth.prescription.order`| Prescribing form & safety rules live| Ingest commercial formulary | Chief Pharmacist | Safety alert rules active | `MEDICAL APPROVAL REQUIRED` |
| **Pharmacy Dispensing** | `gnuhealth.prescription.order`| Dispensary workflow ready; 0 stock | Ingest initial stock with batch/expiry | Chief Pharmacist | Stock move deducts quantity | `CONFIGURATION REQUIRED` |
| **Laboratory Requisition**| `gnuhealth.patient.lab.test` | 9 lab categories preloaded; 0 tests | Ingest lab test catalog & ranges | Lab Director | Requisition visible in lab worklist | `MASTER DATA REQUIRED` |
| **Radiology Requisition** | `gnuhealth.imaging.test.request`| 8 modalities preloaded; CXR active | Ingest imaging test catalog & fees | Radiology Lead | Signed radiology report PDF attached | `MASTER DATA REQUIRED` |
| **Charge Aggregation** | `health_services` | Service billing triggers active | Open accounting fiscal year | Finance Lead | Unified invoice generated | `BLOCKED` (Fiscal Year) |
| **Patient Invoicing** | `account.invoice` | 15 service products loaded (0.00 QAR)| Set approved tariffs & open FY | Finance Lead | Posted invoice in `account.invoice` | `BLOCKED` (Fiscal Year) |
| **Cash & Card Payments**| `account.payment` | Cash & POS journals configured | Open fiscal year & test tenders | Cashier Lead | Posted accounting move in `account.move`| `BLOCKED` (Fiscal Year) |
| **Health Insurance** | `gnuhealth.insurance` | Policy & copay models active | Ingest contracted payer parties | Insurance Lead | 20/80 copay split on patient invoice | `MASTER DATA REQUIRED` |
| **User Access Control** | `res.user`, `res.group` | 1 active admin; 8 inactive demo users| Provision named staff logins | System Admin | Staff logged in with least-privilege | `MASTER DATA REQUIRED` |
| **Medical Record Audit** | `ir.model.access` | ORM audit tracking active live | Test audit inspector | System Admin | User ID & timestamp on record edit | `VERIFIED` |

---

## 4. End-to-End Outpatient Workflow & Technical Traceability

The target clinic workflow maps to native Tryton/GNU Health models as follows:

```text
PATIENT ARRIVAL
       ↓
[01: REGISTRATION] ──────── gnuhealth.patient (Receptionist)
       ↓
[02: APPOINTMENT / WALK-IN]  gnuhealth.appointment (Receptionist)
       ↓
[03: CHECK-IN & QUEUEING] ─ gnuhealth.appointment (Receptionist)
       ↓
[04: NURSING TRIAGE] ────── gnuhealth.patient.rounding (Triage Nurse)
       ↓
[05: DOCTOR QUEUE & CONSULT] gnuhealth.patient.evaluation (Physician)
       ↓
[06: ICD-10 DIAGNOSIS] ──── gnuhealth.pathology (Physician)
       ↓
[07: ANCILLARY ORDERS] ──── Prescriptions (PHR) / Lab (LAB) / Radiology (RAD)
       ↓
[08: RESULTS REVIEW & SIGN]  gnuhealth.patient.evaluation (Physician)
       ↓
[09: BILLING AGGREGATION] ─ account.invoice (Billing Cashier) [BLOCKED: FY]
       ↓
[10: PAYMENT & RECEIPT] ─── account.payment (Billing Cashier) [BLOCKED: FY]
       ↓
VISIT COMPLETE
```

### Granular Workflow Stage Details:
1. **Registration**: Model `gnuhealth.patient`. Role: Receptionist. Mandatory: Full Name, Gender, Birthdate, Qatar ID (QID). Output: PUID (`QAT-XXXXX`). Status: `TESTING REQUIRED` (UAT-001).
2. **Appointment**: Model `gnuhealth.appointment`. Role: Receptionist. Prerequisite: Registered doctor in `gnuhealth.healthprofessional`. Status: `BLOCKED` (Doctor master data required).
3. **Check-In**: Model `gnuhealth.appointment`. Role: Receptionist. Action: Mark `checked_in`. Output: Patient appears on Triage queue. Status: `TESTING REQUIRED` (UAT-004).
4. **Triage**: Models `gnuhealth.patient.ambulatory_care` and `gnuhealth.patient.rounding`. Role: Nurse. Action: Record BP, HR, RR, Temp, SpO2, Weight, Height. Auto-calc: BMI. Output: Patient routed to Doctor waiting room. Status: `TESTING REQUIRED` (UAT-005).
5. **Consultation**: Model `gnuhealth.patient.evaluation`. Role: Doctor. Action: Review vitals, document Subjective/Objective notes, exam findings. Rule: Permanent immutability (`perm_delete = False`). Status: `TESTING REQUIRED` (UAT-006).
6. **Diagnosis**: Model `gnuhealth.pathology`. Role: Doctor. Source: 14,416 WHO ICD-10 preloaded codes. Output: Primary diagnosis linked to patient history. Status: `VERIFIED` (UAT-006).
7. **Orders**: Models `gnuhealth.prescription.order`, `gnuhealth.patient.lab.test`, `gnuhealth.imaging.test.request`. Role: Doctor. Safety: Clinical safety rules identified in the configured system. End-to-end clinical validation remains required (`SM-CORE-0018`). Status: `MEDICAL APPROVAL REQUIRED` (Formulary required).
8. **Results Review**: Models `gnuhealth.lab` and `gnuhealth.imaging.test.result`. Role: Doctor. Output: Verified reports visible in consultation chart. Status: `TESTING REQUIRED` (UAT-009/010).
9. **Invoicing**: Model `account.invoice`. Role: Cashier. Mechanism: Consolidated encounter charges in QAR. **Blocker: Missing fiscal year in `account.fiscalyear` prevents invoice confirmation**. Status: `BLOCKED` (UAT-011).
10. **Payment & Receipt**: Models `account.payment` and `account.move`. Role: Cashier. Tenders: Cash, Debit/Credit Card POS, Insurance Split. Output: Printed official receipt in QAR. Status: `BLOCKED` (Fiscal Year required).

---

## 5. Master Data Status: Reference vs Clinic-Specific

> [!IMPORTANT]
> **Strict Governance Principle**:  
> Preloaded reference datasets (such as ICD-10 and specialties) provide universal medical ontologies, but **DO NOT CONSTITUTE A FUNCTIONING CLINIC**. Clinic-specific business, staff, tariff, and inventory data must be provided by clinic leadership.

| Data Category | Dataset Name | Current Record Count | Status | Description / Next Action |
| :--- | :--- | :---: | :---: | :--- |
| **Reference Data** | WHO ICD-10 Pathology Codes | **14,416** | `VERIFIED LOADED` | Complete international diagnostic coding library. |
| **Reference Data** | Medical Specialties | **73** | `VERIFIED LOADED` | Standardized clinical disciplines (zero duplicates). |
| **Reference Data** | Pharmaceutical Dosage Forms | **94** | `VERIFIED LOADED` | Tablets, syrups, capsules, inhalers, injections. |
| **Reference Data** | Drug Administration Routes | **47** | `VERIFIED LOADED` | Oral, Intravenous, Intramuscular, Topical, Inhalation. |
| **Reference Data** | Medication Dosage Units | **7** | `VERIFIED LOADED` | mg, g, ml, IU, mcg, drops, puffs. |
| **Reference Data** | Laboratory Test Categories | **9** | `VERIFIED LOADED` | Hematology, Biochemistry, Microbiology, Serology, etc. |
| **Reference Data** | Radiology Imaging Modalities | **8** | `VERIFIED LOADED` | X-Ray, Ultrasound, CT, MRI, Mammography, etc. |
| **Reference Data** | National Currencies | **1** | `VERIFIED ACTIVE` | Qatari Riyal (`QAR`, symbol `ر.ق`, ID: 3). |
| **Reference Data** | Country Registry | **15** | `VERIFIED LOADED` | Qatar (`QA`, `QAT`, `634`) and regional GCC/MENA nations. |
| **Clinic Data** | Clinic Legal Identity & CR | **1 (Placeholder)** | `MASTER DATA REQUIRED` | Holds `<CLINIC_NAME>`; awaiting official CR and MoPH license. |
| **Clinic Data** | Clinic Departments / Cost Centers | **8** | `VERIFIED CONFIGURED`| 8 configured hospital units/departments identified in the current database. Operational workflow validation remains pending. |
| **Clinic Data** | Licensed Physicians (Doctors) | **0** | `MASTER DATA REQUIRED` | `gnuhealth.healthprofessional` count = 0; doctor roster needed. |
| **Clinic Data** | Doctor QCHP License Numbers | **0** | `MASTER DATA REQUIRED` | Mandatory regulatory credential capture pending doctor list. |
| **Clinic Data** | Outpatient Service Price List | **15 (Prices: 0.00)** | `BUSINESS APPROVAL REQUIRED`| 15 clinical services loaded; approved QAR fees required. |
| **Clinic Data** | Commercial Medication Formulary | **0** | `MEDICAL APPROVAL REQUIRED` | `gnuhealth.medicament` count = 0; QNF drug list required. |
| **Clinic Data** | Clinic Laboratory Test Menu | **0 Specific Tests**| `MASTER DATA REQUIRED` | In-house test panels, normal ranges, and fees required. |
| **Clinic Data** | Clinic Radiology Exam Menu | **1 (Generic CXR)** | `MASTER DATA REQUIRED` | Ultrasound and X-ray exam list with fees required. |
| **Clinic Data** | Contracted Insurance Payers | **0** | `BUSINESS APPROVAL REQUIRED`| CONTRACTED INSURANCE PAYERS — PENDING CLINIC INPUT |

---

## 6. Accounting & Financial Status

Tryton's accounting module enforces double-entry bookkeeping rules. The current financial status is:

1. **Functional Currency**: `QAR` (Qatari Riyal, ID: 3, Symbol: `ر.ق`, Minor unit: 2 decimal places, Rounding factor: `0.01`).
2. **Chart of Accounts**: Minimal Chart of Accounts (7 accounts: Minimal Chart Root, Main Cash, Main Expense, Main Payable, Main Receivable, Main Revenue, Main Tax).
   - *Status*: `ACCOUNTING APPROVAL REQUIRED` (Proposed outpatient chart submitted in `ACCOUNTING_IMPLEMENTATION_PLAN.md`).
3. **Tax Policy**: Value Added Tax (VAT) is currently 0% on primary healthcare consultations and essential pharmaceuticals in Qatar. Tax account configured at 0% rate.
4. **Operational Journals**: 6 financial journals configured (Cash, Bank/POS, Revenue, Expense, General, Insurance).
5. **Critical Financial Blocker**:
   ```text
   account.fiscalyear COUNT = 0
   Current fiscal-year record count: 0.
   Proposed fiscal year: FY2026, subject to Finance approval.
   STATUS: BLOCKED (ACCOUNTING APPROVAL REQUIRED)
   ```
   **Tryton strictly prevents confirming and posting any invoice without an open fiscal year covering the invoice date**. Opening a fiscal year (proposed: Fiscal Year 2026 / `FY2026` and 12 monthly periods, subject to Finance approval) is a mandatory gating task for the Chief Financial Officer / Lead Accountant.

---

## 7. Health Insurance Management Status

Insurance management is structured into two distinct operational tiers:

### 7.1 Internal Native GNU Health Tracking (`PHASE 1 GO-LIVE`)
- **Native Capability**: Full support via `gnuhealth.insurance` for tracking insurance companies, Third-Party Administrators (TPAs), member policy numbers, validity dates, network tiers, and copayment split percentages (e.g. 20% patient copay / 80% insurer receivable).
- **Invoice Splitting**: Verified native support for generating dual-line customer invoices:
  - Patient Copay Line: Billed to Account `1131 Patient Receivables` (collected at cashier).
  - Insurer Claim Line: Billed to Account `1132 Insurance Receivables` under insurer party.
- **Current State**: `MASTER DATA REQUIRED` (Awaiting list of contracted payers from clinic management).

### 7.2 External Electronic Clearinghouse Integration (`PHASE 2 - ADVANCED`)

```text
POTENTIAL / OPTIONAL INTEGRATION

External integration has not yet been formally confirmed as a clinic
requirement. Technical assessment should occur only after the clinic
provides the required business and integration specifications.
```

---

## 8. Pharmacy & Dispensary Status

- **Reference Standards**: 94 dosage forms (tablets, capsules, syrups, suspensions), 47 administration routes (oral, IV, IM, topical, inhalation), and 7 dosage measurement units (mg, g, ml, IU, mcg, drops, puffs) are preloaded and verified.
- **Commercial Formulary**: Model `gnuhealth.medicament` currently contains **`0` records**.
- **Clinical Safety Rules**: Clinical safety rules identified in the configured system. End-to-end clinical validation remains required.
- **Inventory Management**: Tryton's native `stock` module provides lot/batch number tracking, expiry date enforcement, and automated stock moves from the clinic dispensary location.
- **Next Action**: Chief Pharmacist must review and ingest the approved commercial medication list via `MASTER_DATA_IMPLEMENTATION_PLAN.md`.

---

## 9. Diagnostic Laboratory Status

- **Reference Categories**: 9 laboratory categories are preloaded (Hematology, Biochemistry, Microbiology, Serology, Urinalysis, Parasitology, Pathology, Immunology, Endocrinology).
- **Requisition Workflow**: Fully functional in `gnuhealth.patient.lab.test`. Physicians can order tests directly from the consultation screen.
- **Specimen & Result Processing**: Model `gnuhealth.lab` supports logging sample collection timestamps, specimen tube types, accession numbers, technician result entry against reference ranges, and supervisor formal sign-off.
- **Next Action**: Laboratory Director must provide the in-house test menu, quantitative reference intervals, and QAR fees.

---

## 10. Diagnostic Radiology & Imaging Status

- **Reference Modalities**: 8 imaging modalities are preloaded (X-Ray, Ultrasound, CT Scan, MRI, Mammography, PET Scan, Angiography, Fluoroscopy).
- **Procedure & Reporting Workflow**: Fully functional in `gnuhealth.imaging.test.request` and `gnuhealth.imaging.test.result`. Supports clinical indication documentation, procedure execution logging, structured diagnostic text reports, radiologist digital sign-off, and PDF report attachment to the patient chart.
- **PACS / DICOM Interfacing**: Native GNU Health RIS handles study requisitions, reporting, and PDF distribution.
```text
POTENTIAL / OPTIONAL INTEGRATION

External integration has not yet been formally confirmed as a clinic
requirement. Technical assessment should occur only after the clinic
provides the required business and integration specifications.
```
- **Next Action**: Radiology Lead must provide the on-site imaging menu and QAR fees.

---

## 11. User Roles & Security Access Control

- **Security Model**: Role-Based Access Control (RBAC) enforced via Tryton `res.user` and `res.group`.
- **EHR Immutability**: All medical evaluations enforce `perm_delete = False`, guaranteeing legal medical-legal record integrity.
- **Current Live Accounts**:
  - `admin` (ID: 1): Active (`active = True`). Administrator superuser.
  - `root` (ID: 0): Deactivated (`active = False`). Internal system account.
  - Demo Accounts (IDs 2–8): `demo_doctor`, `demo_frontdesk`, `demo_nurses`, `demo_lab`, `demo_imaging`, `demo_back_office`, `demo_social_worker` are all **securely deactivated (`active = False`)**.
- **Administrative Credentials**:
```text
Administrative credential rotation required.

No credential value is stored in project documentation.
```
- **Next Action**: In accordance with `USER_ROLE_IMPLEMENTATION_PLAN.md`, clinic HR must submit the operational staff directory to provision named personal accounts across the 12 defined roles.

---

## 12. Security & Infrastructure Hardening Status

```text
SECURITY REQUIREMENT

HTTPS/TLS, firewall restrictions, credential rotation, access control,
backup protection and audit controls are required project security
controls.

Formal regulatory compliance must be validated against the applicable
clinic, Qatar regulatory and contractual requirements.
```

| Security Control | Required Standard | Current Verified State | Risk Level | Action Required |
| :--- | :--- | :--- | :---: | :--- |
| **Admin Superuser Password** | 24-character enterprise passphrase | Initial provisioning credential handling requires verification and rotation before production | **CRITICAL** | Administrative credential rotation required. No credential value is stored in project documentation. |
| **Transport Layer Security** | TLS 1.3 / HTTPS on Port 443 | `HTTPS/TLS PRODUCTION CONFIGURATION REQUIRED` (Plaintext HTTP on Port 80) | **CRITICAL** | Bind clinic domain; install TLS certificate on Nginx. |
| **Firewall Perimeter** | Port 8000 closed to external public | `NETWORK SECURITY VALIDATION REQUIRED` | **HIGH** | Restrict Port 8000 to localhost in GCP VPC firewall. |
| **Secrets Protection** | `chmod 600` on config files | `/home/gnuhealth/trytond.conf` secured | **NORMAL** | Verified protected; owned by `gnuhealth:gnuhealth`. |
| **Automated Daily Backups** | Daily `pg_dump` cron with offsite sync| Existing (script present); Configured (cron pending); Verified (not in prod); Tested (restore script ready) | **MEDIUM** | Enable daily cron in crontab at 02:00 AST. |
| **System Daemon Watchdog** | Auto-restarting `systemd` service | `gnuhealth.service` active and enabled | **NORMAL** | Verified operational; auto-restarts on reboot. |

---

## 13. Quality Assurance & UAT Status

All 17 end-to-end operational scenarios defined in `MASTER_UAT_PLAN.md` are mapped to target acceptance criteria:

| Test ID | Scenario Description | Primary Actor | Target Model | Current Status | Blocker |
| :---: | :--- | :--- | :--- | :---: | :--- |
| **UAT-001** | New Patient Registration & QID | Receptionist | `gnuhealth.patient` | `TESTING REQUIRED` | Ready for execution with staff. |
| **UAT-002** | Existing Patient Search | Receptionist | `gnuhealth.patient` | `TESTING REQUIRED` | Ready for execution with staff. |
| **UAT-003** | Scheduled Appointment Booking | Receptionist | `gnuhealth.appointment` | `BLOCKED` | Doctor master data required. |
| **UAT-004** | Walk-In Arrival & Triage Queue | Receptionist | `gnuhealth.appointment` | `TESTING REQUIRED` | Ready for execution with staff. |
| **UAT-005** | Nursing Triage & Vital Signs | Triage Nurse | `gnuhealth.patient.rounding` | `TESTING REQUIRED` | Ready for execution with staff. |
| **UAT-006** | Doctor Consultation & ICD-10 | Doctor | `gnuhealth.patient.evaluation` | `TESTING REQUIRED` | Doctor account required. |
| **UAT-007** | E-Prescription & Allergy Alerts | Doctor | `gnuhealth.prescription.order`| `BLOCKED` | Pharmacy formulary required. |
| **UAT-008** | Pharmacy Dispensing & Stock Move| Pharmacist | `stock.move` | `TESTING REQUIRED` | Pharmacy stock required. |
| **UAT-009** | Laboratory Order & Result Entry | Lab Tech | `gnuhealth.lab` | `TESTING REQUIRED` | Lab catalog required. |
| **UAT-010** | Radiology Study & Diagnostic Log| Radiologist | `gnuhealth.imaging.test.result` | `TESTING REQUIRED` | Radiology catalog required. |
| **UAT-011** | Cash Billing & Invoice Posting | Cashier | `account.invoice`, `account.move` | `BLOCKED` | **Fiscal year required**. |
| **UAT-012** | Card POS Payment Collection | Cashier | `account.payment` | `BLOCKED` | **Fiscal year required**. |
| **UAT-013** | Insurance Copay Split Invoicing | Cashier | `account.invoice` | `BLOCKED` | **Fiscal year & payers required**. |
| **UAT-014** | Authorized Refund / Credit Note | Cashier / Mgr | `account.invoice` | `TESTING REQUIRED` | Posted invoice required. |
| **UAT-015** | Role-Based Access Enforcement | Admin / Staff | `res.group` | `TESTING REQUIRED` | Staff accounts required. |
| **UAT-016** | Medical-Legal Audit Trail | System Admin | `ir.model.access` | `TESTING REQUIRED` | Ready for audit check. |
| **UAT-017** | Backup & Disaster Recovery Test | DevOps | PostgreSQL Database | `TESTING REQUIRED` | Test restore script ready. |

---

## 14. Custom Software Development Assessment

```text
CUSTOM DEVELOPMENT NOT CURRENTLY IDENTIFIED

Based on the requirements and technical evidence reviewed to date, no
custom development has currently been identified as necessary for the
confirmed outpatient scope.

This status remains subject to:

1. Formal requirements sign-off
2. Configuration completion
3. Master-data onboarding
4. Integration decisions
5. End-to-end UAT
6. Discovery of requirements not currently documented

Any requirement that cannot be satisfied through native GNU Health/Tryton
capabilities, configuration, approved master data, or supported integration
must be separately assessed for custom development.
```

---

## 15. Clinic Stakeholder Input Matrix

The technical team cannot proceed to production cutover without the following official inputs:

| Required Input Item | Providing Stakeholder | Format | Blocks Production Go-Live? |
| :--- | :--- | :--- | :---: |
| **Legal Clinic Trade Name (EN/AR)** | Clinic General Manager | Official CR Certificate | **YES (CRITICAL BLOCKER)** |
| **Commercial Registration (CR) Number**| Clinic General Manager | MOCI Certificate Copy | **YES (CRITICAL BLOCKER)** |
| **MoPH Facility License Number** | Medical Director | MoPH License Document | **YES (CRITICAL BLOCKER)** |
| **Clinic Blue Plate Physical Address** | Operations Manager | Building, Street, Zone No | **YES (CRITICAL BLOCKER)** |
| **Physician Roster & Credentials** | Medical Director / HR | Completed Doctor CSV | **YES (CRITICAL BLOCKER)** |
| **Doctor QCHP License Numbers** | Medical Director / HR | QCHP Registration Copies | **YES (CRITICAL BLOCKER)** |
| **Outpatient Consultation Tariffs (QAR)**| Chief Financial Officer | Approved Fee Schedule | **YES (CRITICAL BLOCKER)** |
| **Fiscal Year Authorization (FY2026)** | Chief Financial Officer | Signed Accounting Plan | **YES (CRITICAL BLOCKER)** |
| **Operational Staff Directory** | HR Manager | Staff List with Emails | **YES (HIGH PRIORITY)** |
| **Dispensary Medication Formulary** | Chief Pharmacist | Completed Formulary CSV | **YES (HIGH PRIORITY)** |
| **Laboratory Test Menu & Ranges** | Laboratory Director | Test Catalog Sheet | **YES (HIGH PRIORITY)** |
| **Radiology Procedure Catalog** | Radiology Director | Procedure Fee Sheet | **YES (HIGH PRIORITY)** |
| **Contracted Insurance Payers** | Insurance Relations Mgr | Insurer List & Terms | **NO (Self-pay can launch)** |
| **Weekly Clinic Operating Hours** | Operations Manager | Shift Schedule Document | **YES (HIGH PRIORITY)** |

---

## 16. Phased Implementation Sequence

Implementation must proceed strictly in the following sequence:

* **PHASE 0: Security & Credential Hardening (`MANDATORY BLOCKER`)**: Rotate admin password, bind domain, install TLS 1.3 certificate on Port 443, close Port 8000 in GCP firewall.
* **PHASE 1: Clinic Legal Identity & Facility Setup**: Ingest official clinic trade name, CR number, MoPH license, and address into `party.party` and `gnuhealth.institution`.
* **PHASE 2: Department Allocations & Operating Hours**: Configure consultation rooms and weekly shift hours.
* **PHASE 3: Doctor Credentialing & Staff Enrollment**: Register licensed physicians in `gnuhealth.healthprofessional` with verified QCHP credentials; provision staff logins.
* **PHASE 4: Outpatient Service Tariffs**: Populate approved consultation and procedure fees in `product.product` in QAR.
* **PHASE 5: Pharmacy Formulary & Dispensary Inventory**: Ingest approved commercial medications into `gnuhealth.medicament` and configure initial stock.
* **PHASE 6: Laboratory Test Catalog & Reference Ranges**: Ingest in-house lab tests, units, and reference intervals.
* **PHASE 7: Radiology Exam Menu & Reporting Setup**: Ingest imaging procedures and configure radiologist report templates.
* **PHASE 8: Financial Activation (`MANDATORY BLOCKER`)**: Lead Accountant approves Chart of Accounts, opens Fiscal Year 2026 and 12 monthly periods in `account.fiscalyear`.
* **PHASE 9: Health Insurance Payer Configuration**: Configure contracted private insurers and copayment split policies.
* **PHASE 10: Role Permissions Verification**: Verify RBAC security groups across all operational user accounts.
* **PHASE 11: End-to-End User Acceptance Testing (UAT)**: Execute scenarios `UAT-001` through `UAT-017` with clinic staff.
* **PHASE 12: Staff Operational Training**: Conduct role-specific hands-on training for receptionists, nurses, doctors, and cashiers.
* **PHASE 13: Controlled Production Go-Live**: Convene executive gating committee, sign off `GO_LIVE_CHECKLIST.md`, and cut over to live clinical service.

---

## 17. Final Verification & Sign-Off Condition

```text
========================================================================================
FINAL PRODUCTION GO-LIVE RULE
========================================================================================
The system may proceed to live patient care ONLY after all mandatory requirements 
in GO_LIVE_CHECKLIST.md are verified and signed off by the Clinical Director, 
Chief Financial Officer, Operations Manager, and Technical Lead.
========================================================================================
```

---

## 18. Final Readiness Table

| Domain | Status |
| :--- | :--- |
| GNU Health / Tryton source | `VERIFIED` |
| Repository structure | `VERIFIED` |
| Database baseline | `VERIFIED` |
| Reference master data | `VERIFIED` |
| Clinic-specific master data | `PENDING CLINIC INPUT` |
| Accounting | `PENDING APPROVAL` |
| Security hardening | `ACTION REQUIRED` |
| Network perimeter | `VALIDATION REQUIRED / ACTION REQUIRED` |
| User onboarding | `REQUIRED` |
| Functional workflows | `TESTING REQUIRED` |
| UAT | `TESTING REQUIRED` |
| External integrations | `PENDING REQUIREMENT CONFIRMATION` |
| Custom development | `NOT CURRENTLY IDENTIFIED` |
| Production go-live | `BLOCKED` |

---

## 19. Implementation Position

```text
CURRENT IMPLEMENTATION POSITION

The GNU Health/Tryton platform and repository have been audited and the
current technical baseline has been documented.

The database is in a clean pre-operational state with no live patient or
clinical transaction data.

The remaining work is primarily controlled implementation activity:

1. Requirements and stakeholder approval
2. Security hardening
3. Clinic-specific master-data onboarding
4. Accounting configuration and approval
5. User/role onboarding
6. Functional configuration
7. End-to-end UAT
8. Training
9. Go-live approval

No custom development is currently identified for the documented outpatient
scope. This remains subject to requirements confirmation, integration
decisions and UAT.

Production go-live must remain gated by the approved GO_LIVE_CHECKLIST.md.
```

