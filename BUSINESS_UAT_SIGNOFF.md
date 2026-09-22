# BUSINESS USER ACCEPTANCE TESTING (UAT) SIGN-OFF PACK
## GNU HEALTH HMIS 5.0 / TRYTON 7.0 OUTPATIENT CLINIC SYSTEM

**Document Version**: 2.0  
**Classification**: Official Operational & Clinical Gate Document  
**Governing Protocol**: Business Workflow Acceptance & Pre-Go-Live Sign-Off Standard  
**Technical UAT Baseline**: 100% Empirical Technical Lifecycle Verified (Patient ID 23, Invoice INV-2026/00001, GL Moves 5 & 6 Balanced in QAR, Census Purged to Exactly 0)  
**Authoritative Operational Status**: **`IMPLEMENTATION BLOCKED — INPUTS REQUIRED`**

---

## 1. Document Objective & Governance

Technical implementation, unit testing, automated multi-role execution, database transaction integrity, and isolated disaster recovery restore tests have been successfully completed and empirically verified against GNU Health HMIS 5.0 and Tryton 7.0.

This **Business UAT Sign-off Pack** is the formal instrument through which designated clinic stakeholders, medical professionals, operational managers, and financial authorities validate each outpatient operational scenario against real-world clinic workflows.

### Governing Principles:
1. **Zero Fabrication**: Business UAT must be executed by named institutional staff using authorized clinic testing parties or sandbox encounters.
2. **Independent Authorization**: Final production go-live requires unanimous affirmative sign-off from all five designated functional owners.
3. **Traceable Verification**: Every test case must record tester identity, execution timestamp, result, and qualitative clinical observations.
4. **Clean Baseline Preserved**: Following technical validation, all synthetic records were purged. Operational census is verified at exactly zero records.

---

## 2. Business UAT Workflow Test Cases (01 – 12)

---

### CASE 01 — Patient Registration & Demographic Intake
* **Scope**: Front desk search for existing patient records, creation of new patient identity, national ID / civil ID capture, date of birth, gender, address, emergency contact, and automated medical record number (PUID) assignment.
* **Success Criteria**: Patient identity record generated without duplicate warnings; primary address linked; PUID visible on patient file.

| Attribute | Specification / Execution Record |
| :--- | :--- |
| **BUSINESS OWNER** | Front Desk Lead / Clinic Operations Owner |
| **TESTER** | __________________________________________________ |
| **DATE** | YYYY-MM-DD |
| **RESULT** | `[ ] PASS` &nbsp;&nbsp;&nbsp; `[ ] FAIL` &nbsp;&nbsp;&nbsp; `[ ] CONDITIONAL` |
| **COMMENTS** | |
| **SIGN-OFF** | Signature: _______________________ &nbsp;&nbsp; Date: ____________ |

---

### CASE 02 — Outpatient Appointment Scheduling
* **Scope**: Selection of registered patient, selection of consulting physician, date/time slot selection, appointment urgency classification (Normal/Urgent), and appointment status transition (`Free` $\rightarrow$ `Confirmed`).
* **Success Criteria**: Appointment calendar displays booked slot; prevents double-booking of same physician in identical time slot; status updates to Confirmed.

| Attribute | Specification / Execution Record |
| :--- | :--- |
| **BUSINESS OWNER** | Reception Supervisor / Operations Owner |
| **TESTER** | __________________________________________________ |
| **DATE** | YYYY-MM-DD |
| **RESULT** | `[ ] PASS` &nbsp;&nbsp;&nbsp; `[ ] FAIL` &nbsp;&nbsp;&nbsp; `[ ] CONDITIONAL` |
| **COMMENTS** | |
| **SIGN-OFF** | Signature: _______________________ &nbsp;&nbsp; Date: ____________ |

---

### CASE 03 — Physician Consultation & SOAP Encounter
* **Scope**: Doctor initiates encounter from appointment queue; entry of Subjective symptoms (chief complaint), Objective vital signs (blood pressure, heart rate, temperature, BMI), Assessment findings, and Clinical Plan.
* **Success Criteria**: Clinical evaluation record saved; vitals automatically calculate BMI; evaluation linked to patient medical history.

| Attribute | Specification / Execution Record |
| :--- | :--- |
| **BUSINESS OWNER** | Chief Medical Officer / Medical Director |
| **TESTER** | __________________________________________________ |
| **DATE** | YYYY-MM-DD |
| **RESULT** | `[ ] PASS` &nbsp;&nbsp;&nbsp; `[ ] FAIL` &nbsp;&nbsp;&nbsp; `[ ] CONDITIONAL` |
| **COMMENTS** | |
| **SIGN-OFF** | Signature: _______________________ &nbsp;&nbsp; Date: ____________ |

---

### CASE 04 — Diagnostic Coding (ICD-10 Clinical Coding)
* **Scope**: Lookup and selection of verified ICD-10 diagnostic codes from the installed 14,416-code disease catalog; linking primary and secondary diagnoses to the clinical encounter.
* **Success Criteria**: ICD-10 code (e.g., `J06.9` Acute upper respiratory infection) attaches cleanly to evaluation; search by code and description functions without lag.

| Attribute | Specification / Execution Record |
| :--- | :--- |
| **BUSINESS OWNER** | Medical Director / Health Informatics Lead |
| **TESTER** | __________________________________________________ |
| **DATE** | YYYY-MM-DD |
| **RESULT** | `[ ] PASS` &nbsp;&nbsp;&nbsp; `[ ] FAIL` &nbsp;&nbsp;&nbsp; `[ ] CONDITIONAL` |
| **COMMENTS** | |
| **SIGN-OFF** | Signature: _______________________ &nbsp;&nbsp; Date: ____________ |

---

### CASE 05 — Electronic Prescription (e-Prescribing)
* **Scope**: Generation of outpatient medication order; selection of drug, pharmaceutical form (e.g., Tablet), route of administration (e.g., Oral), dose quantity, dose unit (e.g., mg), frequency, duration, and patient instructions.
* **Success Criteria**: Prescription order validated; prescription document generated for pharmacy fulfillment; physician signature block populated.

| Attribute | Specification / Execution Record |
| :--- | :--- |
| **BUSINESS OWNER** | Lead Physician / Chief Pharmacist |
| **TESTER** | __________________________________________________ |
| **DATE** | YYYY-MM-DD |
| **RESULT** | `[ ] PASS` &nbsp;&nbsp;&nbsp; `[ ] FAIL` &nbsp;&nbsp;&nbsp; `[ ] CONDITIONAL` |
| **COMMENTS** | |
| **SIGN-OFF** | Signature: _______________________ &nbsp;&nbsp; Date: ____________ |

---

### CASE 06 — Laboratory Test Requisition & Results Entry
* **Scope**: Physician orders clinical laboratory test (e.g., `LAB-CBC` or `LAB-LIPID`); lab technician acknowledges order, collects sample, enters quantitative criteria/findings, and marks test completed.
* **Success Criteria**: Lab request transitions from Draft to Ordered to Done; quantitative findings stored; out-of-range indicators alert physician.

| Attribute | Specification / Execution Record |
| :--- | :--- |
| **BUSINESS OWNER** | Laboratory Director / Medical Director |
| **TESTER** | __________________________________________________ |
| **DATE** | YYYY-MM-DD |
| **RESULT** | `[ ] PASS` &nbsp;&nbsp;&nbsp; `[ ] FAIL` &nbsp;&nbsp;&nbsp; `[ ] CONDITIONAL` |
| **COMMENTS** | |
| **SIGN-OFF** | Signature: _______________________ &nbsp;&nbsp; Date: ____________ |

---

### CASE 07 — Diagnostic Radiology / Imaging Requisition
* **Scope**: Physician orders diagnostic imaging procedure (e.g., `RAD-CXR` Chest X-Ray); radiology department accepts requisition, schedules modality, captures procedure report, and links conclusion to patient record.
* **Success Criteria**: Imaging order generated with unique sequence number; radiologist report attached; request marked Done.

| Attribute | Specification / Execution Record |
| :--- | :--- |
| **BUSINESS OWNER** | Head of Radiology / Medical Director |
| **TESTER** | __________________________________________________ |
| **DATE** | YYYY-MM-DD |
| **RESULT** | `[ ] PASS` &nbsp;&nbsp;&nbsp; `[ ] FAIL` &nbsp;&nbsp;&nbsp; `[ ] CONDITIONAL` |
| **COMMENTS** | |
| **SIGN-OFF** | Signature: _______________________ &nbsp;&nbsp; Date: ____________ |

---

### CASE 08 — Outpatient Billing, Invoicing & Cashiering
* **Scope**: Aggregation of billable encounter services (physician consultation `OPD-EVAL`, lab, radiology); generation of customer invoice; verification of tariff prices; application of taxes/exemptions; payment receipt creation.
* **Success Criteria**: Customer invoice validated; Tryton general ledger moves created in open fiscal period; cashier receipt prints with official legal headers.

| Attribute | Specification / Execution Record |
| :--- | :--- |
| **BUSINESS OWNER** | Chief Financial Officer / Finance Owner |
| **TESTER** | __________________________________________________ |
| **DATE** | YYYY-MM-DD |
| **RESULT** | `[ ] PASS` &nbsp;&nbsp;&nbsp; `[ ] FAIL` &nbsp;&nbsp;&nbsp; `[ ] CONDITIONAL` |
| **COMMENTS** | |
| **SIGN-OFF** | Signature: _______________________ &nbsp;&nbsp; Date: ____________ |

---

### CASE 09 — Outpatient Follow-up & Discharge Summary
* **Scope**: Physician creates follow-up appointment recommendation; generates patient clinical discharge / encounter summary; prints outpatient visit summary for patient.
* **Success Criteria**: Follow-up appointment flagged in scheduling system; discharge summary contains accurate diagnoses and prescribed medications.

| Attribute | Specification / Execution Record |
| :--- | :--- |
| **BUSINESS OWNER** | Clinic Operations Lead / Medical Director |
| **TESTER** | __________________________________________________ |
| **DATE** | YYYY-MM-DD |
| **RESULT** | `[ ] PASS` &nbsp;&nbsp;&nbsp; `[ ] FAIL` &nbsp;&nbsp;&nbsp; `[ ] CONDITIONAL` |
| **COMMENTS** | |
| **SIGN-OFF** | Signature: _______________________ &nbsp;&nbsp; Date: ____________ |

---

### CASE 10 — Clinic Operational & Financial Reporting
* **Scope**: Extraction of daily encounter registers, appointment census reports, revenue by service product, and physician activity logs.
* **Success Criteria**: Standard reports execute without errors; figures balance with cashier totals; exports to PDF/CSV render cleanly.

| Attribute | Specification / Execution Record |
| :--- | :--- |
| **BUSINESS OWNER** | Operations Lead / Financial Controller |
| **TESTER** | __________________________________________________ |
| **DATE** | YYYY-MM-DD |
| **RESULT** | `[ ] PASS` &nbsp;&nbsp;&nbsp; `[ ] FAIL` &nbsp;&nbsp;&nbsp; `[ ] CONDITIONAL` |
| **COMMENTS** | |
| **SIGN-OFF** | Signature: _______________________ &nbsp;&nbsp; Date: ____________ |

---

### CASE 11 — User Permissions & Segregation of Duties (RBAC)
* **Scope**: Verification of role-based boundaries defined in `docs/ROLE_ONBOARDING_MATRIX.md`:
  - Front Desk cannot modify clinical diagnoses or sign prescriptions.
  - Physicians cannot post accounting moves or modify fiscal years.
  - Billing clerks cannot create lab requisitions without physician orders.
* **Success Criteria**: Access control rules strictly enforce menu visibility and model write permissions across all 12 operational roles.

| Attribute | Specification / Execution Record |
| :--- | :--- |
| **BUSINESS OWNER** | IT Security Lead / IT Owner |
| **TESTER** | __________________________________________________ |
| **DATE** | YYYY-MM-DD |
| **RESULT** | `[ ] PASS` &nbsp;&nbsp;&nbsp; `[ ] FAIL` &nbsp;&nbsp;&nbsp; `[ ] CONDITIONAL` |
| **COMMENTS** | |
| **SIGN-OFF** | Signature: _______________________ &nbsp;&nbsp; Date: ____________ |

---

### CASE 12 — Audit Trail & Healthcare Record Accountability
* **Scope**: Inspection of system history on patient demographics, clinical notes, and financial invoices; verification that `create_uid`, `write_uid`, and timestamps are immutably logged for every operational transaction.
* **Success Criteria**: Historical modifications display previous values, editor identity, and exact timestamp; audit log cannot be altered by normal clinic users.

| Attribute | Specification / Execution Record |
| :--- | :--- |
| **BUSINESS OWNER** | Compliance Officer / IT Owner |
| **TESTER** | __________________________________________________ |
| **DATE** | YYYY-MM-DD |
| **RESULT** | `[ ] PASS` &nbsp;&nbsp;&nbsp; `[ ] FAIL` &nbsp;&nbsp;&nbsp; `[ ] CONDITIONAL` |
| **COMMENTS** | |
| **SIGN-OFF** | Signature: _______________________ &nbsp;&nbsp; Date: ____________ |

---

## 3. Executive Business Sign-Off Gate

All five functional owners must inspect, sign, and date this section before the system may transition to **`GO-LIVE READY`**.

```text
CRITICAL GO-LIVE CONSTRAINT:
Absence of any single executive signature below strictly prevents production cutover.
```

### 1. Medical Director / Clinical Owner
> *"I certify that the clinical workflows (Consultation, Diagnosis, Prescribing, Laboratory, Radiology) have been tested and approved for clinical outpatient operations."*

* **Full Name**: __________________________________________________
* **Professional License No**: ____________________________________
* **Decision**: `[ ] APPROVED` &nbsp;&nbsp;&nbsp; `[ ] REJECTED` &nbsp;&nbsp;&nbsp; `[ ] CONDITIONAL`
* **Signature**: __________________________________________________
* **Date**: ________________________

---

### 2. Operations Owner
> *"I certify that patient registration, front desk appointment scheduling, queue management, and daily clinic administrative procedures have been validated."*

* **Full Name**: __________________________________________________
* **Title / Designation**: _________________________________________
* **Decision**: `[ ] APPROVED` &nbsp;&nbsp;&nbsp; `[ ] REJECTED` &nbsp;&nbsp;&nbsp; `[ ] CONDITIONAL`
* **Signature**: __________________________________________________
* **Date**: ________________________

---

### 3. Finance Owner
> *"I certify that the outpatient service tariff schedule, accounting general ledger mapping, fiscal year setup, cashier receipting, and financial reporting have been validated."*

* **Full Name**: __________________________________________________
* **Title / Designation**: _________________________________________
* **Decision**: `[ ] APPROVED` &nbsp;&nbsp;&nbsp; `[ ] REJECTED` &nbsp;&nbsp;&nbsp; `[ ] CONDITIONAL`
* **Signature**: __________________________________________________
* **Date**: ________________________

---

### 4. IT Owner
> *"I certify that host infrastructure, network isolation, database backups, disaster recovery, RBAC access controls, and TLS encryption readiness have been validated."*

* **Full Name**: __________________________________________________
* **Title / Designation**: _________________________________________
* **Decision**: `[ ] APPROVED` &nbsp;&nbsp;&nbsp; `[ ] REJECTED` &nbsp;&nbsp;&nbsp; `[ ] CONDITIONAL`
* **Signature**: __________________________________________________
* **Date**: ________________________

---

### 5. Management / Project Sponsor
> *"I authorize the formal production release and clinic go-live of the GNU Health HMIS system upon fulfillment of all contingent conditions."*

* **Full Name**: __________________________________________________
* **Title / Designation**: _________________________________________
* **Decision**: `[ ] AUTHORIZED TO GO LIVE` &nbsp;&nbsp;&nbsp; `[ ] GO-LIVE HALTED`
* **Signature**: __________________________________________________
* **Date**: ________________________
