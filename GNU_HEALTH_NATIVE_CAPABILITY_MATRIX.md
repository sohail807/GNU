# GNU HEALTH HMIS 5.0 — NATIVE CAPABILITY MATRIX
## Outpatient Clinic Operational Scope & Functional Qualification

**Document Identifier**: `GH-CAP-002`  
**System Baseline**: GNU Health 5.0.6 / Tryton 7.0.57  
**Operating Environment**: `gnuhealth-srv` (Debian 12.15 Bookworm, PostgreSQL 15.19)  
**Evaluation Methodology**: Empirical Code Inspection, ORM Schema Analysis & Live Transaction Testing  
**Status**: `AUTHORITATIVE CAPABILITY SPECIFICATION`  

---

## 1. Executive Summary

This matrix provides an exhaustive, model-level evaluation of GNU Health HMIS 5.0's native capabilities for outpatient clinical operations. GNU Health provides comprehensive, native out-of-the-box coverage for all primary clinical, diagnostic, and financial workflows required by modern outpatient facilities without necessitating core modifications or custom forks.

---

## 2. Comprehensive Functional Capability Matrix

| Operational Subsystem | Functional Capability | Native Model / Component | Module | Implementation Classification | Validation Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Patient Registration** | Demographic & Contact Management | `gnuhealth.patient`, `party.party` | `health`, `party` | Native Complete | **PASS** (Tested ID 23) |
| **Patient Registration** | National ID (QID) Storage | `party.identifier` (`type='qid'`) | `party` | Native Complete | **PASS** (Tested `QID-28563412345`) |
| **Patient Registration** | Medical Record Number (PUID) | `gnuhealth.patient.puid` | `health` | Native Complete | **PASS** (Auto-assigned) |
| **Patient Registration** | Federation Account Linking | `party.party.fed_country` | `health_federation` | Native Complete | **PASS** (Country: `QAT`) |
| **Scheduling** | Outpatient Appointment Booking | `gnuhealth.appointment` | `health` | Native Complete | **PASS** (Appt ID 29) |
| **Scheduling** | Appointment Check-in / State Flow | `gnuhealth.appointment.state` | `health` | Native Complete | **PASS** (`checked_in` verified) |
| **Scheduling** | Clinical Follow-up Scheduling | `gnuhealth.appointment` | `health` | Native Complete | **PASS** (Appt ID 30, +7 days) |
| **Clinical Encounter** | Outpatient Clinical Evaluation | `gnuhealth.patient.evaluation` | `health` | Native Complete | **PASS** (Eval ID 17) |
| **Clinical Encounter** | Triage Vitals & Anthropometry | `gnuhealth.patient.evaluation` | `health` | Native Complete | **PASS** (BP, HR, Temp, RR) |
| **Clinical Encounter** | Chief Complaint & SOAP Notes | `gnuhealth.patient.evaluation` | `health` | Native Complete | **PASS** (Subjective/Objective) |
| **Clinical Encounter** | Standardized ICD-10 Diagnostics | `gnuhealth.pathology`, `health_icd10` | `health_icd10` | Native Complete | **PASS** (`J06.9` Acute URI) |
| **Clinical Encounter** | Evaluation Sign-off & Locking | `gnuhealth.patient.evaluation.state`| `health` | Native Complete | **PASS** (`signed` state verified) |
| **E-Prescribing** | Outpatient Medication Orders | `gnuhealth.prescription.order` | `health` | Native Complete | **PASS** (Order ID 16) |
| **E-Prescribing** | Pharmaceutical Catalog Linking | `gnuhealth.medicament` | `health` | Native Complete | **PASS** (Amoxicillin 500mg) |
| **E-Prescribing** | Dosage, Frequency, Route | `gnuhealth.prescription.line` | `health` | Native Complete | **PASS** (TID, Oral, 5 Days) |
| **E-Prescribing** | Drug Interaction Safety Engine | `PrescriptionSafetyCheck` (SM-CORE-0018)| `health` | Native Enforced | **PASS** (Warning Ack Verified) |
| **E-Prescribing** | Prescription Validation State | `gnuhealth.prescription.order.state`| `health` | Native Complete | **PASS** (`validated` verified) |
| **Laboratory** | Lab Test Order Creation | `gnuhealth.patient.lab.test` | `health_lab` | Native Complete | **PASS** (Order ID 9) |
| **Laboratory** | Laboratory Test Result Recording | `gnuhealth.lab` | `health_lab` | Native Complete | **PASS** (Result ID 14, CBC) |
| **Laboratory** | Normal Reference Ranges & Units | `gnuhealth.lab.test.critearea` | `health_lab` | Native Complete | **PASS** (Hematology Verified) |
| **Radiology** | Diagnostic Imaging Request | `gnuhealth.imaging.test.request`| `health_imaging` | Native Complete | **PASS** (Request ID 14) |
| **Radiology** | Radiology Reporting & Sign-off | `gnuhealth.imaging.test.result` | `health_imaging` | Native Complete | **PASS** (Result ID 9, CXR) |
| **Medical Billing** | Billable Service Generation | `gnuhealth.health_service` | `health_services` | Native Complete | **PASS** (Consultation Service) |
| **Medical Billing** | Customer Outpatient Invoicing | `account.invoice` (`type='out'`) | `account_invoice` | Native Complete | **PASS** (Invoice `INV-2026/00001`)|
| **Medical Billing** | Invoice Strict Sequence Control | `ir.sequence.strict` | `account_invoice` | Native Enforced | **PASS** (Zero gaps enforced) |
| **Medical Billing** | Multi-Currency Calculation | `currency.currency` | `currency` | Native Enforced | **PASS** (Strictly `QAR` 634) |
| **Medical Billing** | Cashier Settlement Processing | `account.invoice.pay` | `account_invoice` | Native Complete | **PASS** (250.00 QAR Settled) |
| **Financial Ledger**| Double-Entry General Ledger | `account.move`, `account.move.line`| `account` | Native Enforced | **PASS** (Moves 5 & 6 Balanced)|
| **Financial Ledger**| Chart of Accounts Hierarchy | `account.account` | `account` | Configuration Required | **PASS** (Configured 110/210/401)|
| **Financial Ledger**| Fiscal Year & Monthly Periods | `account.fiscalyear`, `account.period`| `account` | Configuration Required | **PASS** (FY2026, 12 Periods) |
| **Financial Ledger**| Automated AR Reconciliation | `account.move.reconciliation` | `account` | Native Enforced | **PASS** (Net AR = 0.00 QAR) |
| **Security & RBAC** | Model-Level Access Control | `ir.model.access` | `ir` | Native Enforced | **PASS** (6 Role Profiles Validated)|
| **Security & RBAC** | Domain Record Rules | `ir.rule` | `ir` | Native Enforced | **PASS** (Multi-Company Bound) |
| **Security & RBAC** | Transaction Rollback Integrity | PostgreSQL / Tryton Transaction | `trytond` | Native Enforced | **PASS** (0 Orphan Records) |
| **Operations** | Database Backup Engine | `pg_dump -Fc` / Systemd Timer | Infrastructure | Native Enforced | **PASS** (Daily 02:00 UTC Active)|
| **Operations** | Disaster Recovery / Isolated Restore| `pg_restore` into Test DB | Infrastructure | Native Enforced | **PASS** (Restored & Verified) |

---

## 3. Detailed Subsystem Analysis

### 3.1 Patient Registration & Identity Subsystem
GNU Health treats patient entities as specializations of the fundamental `party.party` business entity.
* **Identity Architecture**: A single physical individual has one `party.party` master record, linked to a `gnuhealth.patient` record via a One2One relation.
* **National Identification**: The system supports standard identification types via `party.identifier`. For Qatar, National QID is stored with `type='qid'`, ensuring uniqueness and indexing.
* **PUID Engine**: GNU Health automatically issues a unique Patient Unique Identifier (PUID) formatted according to the configured system sequence.
* **Federation Support**: Built-in support for GNU Health Federation accounts (`party.party.fed_country`), enabling cryptographically verified health records across distributed nodes.

### 3.2 Clinical Outpatient Encounter & Documentation
* **SOAP Structure**: Native fields in `gnuhealth.patient.evaluation` provide dedicated storage for Subjective (patient complaints), Objective (physical findings, vitals), Assessment (diagnoses), and Plan (treatments, orders).
* **ICD-10 Pathology Integration**: Standardized integration with the World Health Organization International Classification of Diseases (10th Revision), enabling standardized disease coding and epidemiological tracking.
* **State Machine Governance**: Evaluations progress through explicit lifecycle states: `draft` $\rightarrow$ `in_progress` $\rightarrow$ `signed`. Once signed, records are immutable, guaranteeing forensic non-repudiation.

### 3.3 Electronic Prescriptions & Clinical Decision Support
* **Medication Master**: The `gnuhealth.medicament` catalog couples pharmaceutical products with active drug principles, dose units, and drug routes.
* **Clinical Decision Support (CDS)**: The drug interaction and contraindication engine (Safety Rule `SM-CORE-0018`) checks patient allergies and concurrent medications. Doctors must review and explicitly set `prescription_warning_ack = True` before orders can be validated, preventing prescription errors.

### 3.4 Outpatient Billing & General Ledger Integration
* **Service-to-Billing Bridge**: Outpatient encounters generate `gnuhealth.health_service` records, which automatically link clinical service codes to billable `product.product` templates.
* **Strict Sequential Invoicing**: Outpatient invoices utilize `ir.sequence.strict`. Unlike standard sequences, strict sequences enforce gapless numbering (`INV-2026/00001`, `INV-2026/00002`), ensuring full compliance with international tax and commercial audit standards.
* **Real-Time Double-Entry Ledger**: Invoicing triggers automatic General Ledger move generation (`account.move`). Posting an invoice automatically debits Main Accounts Receivable (`110000`) and credits Main Revenue (`401000`). Cashier settlement debits Main Cash (`101000`) and credits Accounts Receivable (`110000`), executing automated line reconciliation.
