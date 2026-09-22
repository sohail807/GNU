# USER ROLES & ACCESS CONTROL IMPLEMENTATION PLAN

**Project**: GNU Health HMIS 5.0 / Tryton 7.0 Implementation  
**Document**: `USER_ROLE_IMPLEMENTATION_PLAN.md`  
**Classification**: Role-Based Access Control (RBAC) Specification  
**Scope**: Primary Outpatient & Ambulatory Healthcare Facility (State of Qatar)  
**Status**: APPROVED SPECIFICATION — READY FOR USER ENROLLMENT  

---

## 1. Security Architecture & Least-Privilege Principles

Access control in GNU Health is governed by the native Tryton security framework via `res.user` and `res.group`. 
- **Zero Shared Accounts**: Every employee must be provisioned with an individual, named login. Generic shared accounts (e.g. `reception_desk1`, `nurse_shift`) are strictly prohibited.
- **EHR Immutability**: Medical evaluations, signed doctor notes, and clinical assessments enforce `perm_delete = False` across all user roles, preventing retroactive record destruction.
- **Financial Segregation**: Clinical users (Doctors, Nurses, Technicians) have zero access to cashier payments, general ledger journals, or fiscal period closures.
- **Current Live State**: All 7 historical demo accounts are deactivated (`active = False`). Real accounts will be provisioned in accordance with the 12 functional roles defined below.

---

## 2. Comprehensive Outpatient Role Matrix

| # | Role Title | Primary Department | GNU Health / Tryton Security Groups | Read Scope | Create / Edit Scope | Delete Scope | Approval / Sign-Off Scope |
| :-: | :--- | :--- | :--- | :--- | :--- | :---: | :--- |
| **01** | **System Administrator** | IT / Systems | `Administration`, `Health Administration` | Full System | Technical Config, Users, Backups | Tech Config | System & Module Updates |
| **02** | **Clinic Manager** | Management | `Health Administration`, `Account Administration` | Full Clinic Operations | Master Data, Doctor Shifts, Tariffs | Master Data | Operational Policies, Discounts |
| **03** | **Receptionist** | Front Desk | `Health Front Desk`, `Party Administration` | Patients, Appointments, Doctors | Patients, Appointments, Check-in | None | Appointment Confirmation |
| **04** | **Nurse** | Triage / OPD | `Health Nursing`, `Health Ambulatory` | Patients, Appointments, Vitals | Nursing Intakes, Vitals, Rounding | None | Triage Priority Assignment |
| **05** | **Doctor / Physician**| Clinical OPD | `Health Doctor`, `Health Clinical` | Full Patient Clinical Chart | Evaluations, SOAP Notes, Orders, Rx| None | Clinical Encounter Sign-Off |
| **06** | **Pharmacist** | Pharmacy | `Health Pharmacy`, `Stock Administration` | Prescriptions, Medicaments, Stock | Medication Dispensing, Stock Moves | None | Prescription Dispense Sign-Off |
| **07** | **Lab Technician** | Laboratory | `Health Laboratory`, `Health Lab Tech` | Lab Requests, Patients, Test Types | Specimen Logging, Result Entry | None | Lab Result Tech Verification |
| **08** | **Radiology Tech** | Radiology | `Health Imaging`, `Health Imaging Tech` | Imaging Requests, Patients, Types | Procedure Logs, Scan Attachments | None | Procedure Completion Sign-Off |
| **09** | **Billing Officer / Cashier**| Billing / Accounts | `Health Billing`, `Account Customer Invoicing`| Invoices, Patients, Services | Patient Invoices, Cash/Card Receipts| None | Cashier Shift Closeout |
| **10** | **Insurance Officer**| Insurance Desk | `Health Insurance`, `Health Billing` | Insurance Policies, Claims, Invoices | Policies, Prior Authorizations, Claims| None | Claim Batch Submission |
| **11** | **Accountant** | Finance | `Account Financial`, `Account General` | Full Financial Ledger, Chart, Journals| Fiscal Periods, Reconciliations | None | Fiscal Year Close, Tax Sign-off |
| **12** | **Executive Management**| Executive | `Health Read Only`, `Account Read Only` | Reports, Analytics, Dashboards | None | None | Executive Governance Approval |

---

## 3. Granular Permission Definitions by Role

### Role 01: System Administrator
- **Operational Responsibilities**: Server maintenance, system backups, Tryton module updates, user provisioning, role assignments, security log reviews.
- **Clinical Permissions**: Zero clinical creation rights; read-only for debugging purposes.
- **Financial Permissions**: Technical configuration of payment gateways and currency parameters.
- **Security Rule**: Administrator account must have multi-factor authentication (MFA) enabled where possible and run under a strictly monitored audit trail.

### Role 02: Clinic Manager
- **Operational Responsibilities**: Oversee clinic workflow, manage clinic opening hours, maintain room allocations, review doctor appointment rosters.
- **Clinical Permissions**: Read-only access to operational logs and queue metrics.
- **Financial Permissions**: Authority to authorize fee discounts (up to 20%) and review billing summaries.

### Role 03: Receptionist
- **Operational Responsibilities**: Patient intake, demographic registration, insurance card capture, appointment booking, rescheduling, check-in, patient queue management.
- **Clinical Permissions**: Absolutely zero access to medical notes, diagnoses, clinical evaluations, or lab/radiology findings.
- **Financial Permissions**: View consultation fee tariffs; trigger initial consultation charge invoice for self-pay patients.

### Role 04: Nurse / Triage Specialist
- **Operational Responsibilities**: Patient vital signs acquisition, physiological measurements (Height, Weight, BMI), allergy documentation, nursing assessments, doctor queue routing.
- **Clinical Permissions**: Create and edit nursing intake and ambulatory care forms; read-only access to historical physician notes. Zero prescription or lab order signing rights.
- **Financial Permissions**: None.

### Role 05: Doctor / Consulting Physician
- **Operational Responsibilities**: Patient history review, physical examination, ICD-10 diagnosis coding, management plan formulation, electronic prescribing, ordering lab and imaging studies.
- **Clinical Permissions**: Full create and edit rights on `gnuhealth.patient.evaluation`, `gnuhealth.prescription.order`, `gnuhealth.patient.lab.test`, and `gnuhealth.imaging.test.request`. Signed evaluations are locked against editing.
- **Financial Permissions**: None. (Physician orders automatically trigger service billing in the background).

### Role 06: Pharmacist
- **Operational Responsibilities**: Review prescription orders, check allergy and drug-drug safety warnings, verify stock availability, record batch/lot and expiry, dispense medications, log patient counseling.
- **Clinical Permissions**: Read-only access to patient prescriptions and allergy profiles.
- **Financial Permissions**: Create pharmacy invoice lines linked to dispensed medications.

### Role 07: Laboratory Technician
- **Operational Responsibilities**: Accession incoming specimens, process samples, input test result values against reference ranges, flag abnormal values, attach analyzer printouts.
- **Clinical Permissions**: Create and edit records in `gnuhealth.lab`. Zero access to doctor clinical notes.
- **Financial Permissions**: None.

### Role 08: Radiology Technician
- **Operational Responsibilities**: Verify imaging requisitions, execute radiological scans, record procedure execution notes, upload PDF diagnostic reports or DICOM attachments.
- **Clinical Permissions**: Create and edit records in `gnuhealth.imaging.test.result`.
- **Financial Permissions**: None.

### Role 09: Billing Officer / Cashier
- **Operational Responsibilities**: Review aggregated medical encounter charges, apply approved discounts, collect cash or credit card payments, issue official printed receipts, balance daily register.
- **Clinical Permissions**: Zero access to clinical examination notes, diagnoses, or lab results (solely sees billable service codes and descriptions).
- **Financial Permissions**: Create, validate, and post customer invoices (`account.invoice`) and payment entries (`account.payment`).

### Role 10: Insurance Officer
- **Operational Responsibilities**: Review insurance policy validity, verify copay terms, submit prior authorization requests, prepare monthly claim batches, reconcile remittance advices.
- **Clinical Permissions**: Read diagnostic codes (ICD-10) and medical justifications strictly required for claim submission.
- **Financial Permissions**: Manage insurance receivable balances (Account `1132`).

### Role 11: Lead Accountant
- **Operational Responsibilities**: Chart of accounts maintenance, fiscal year opening and closing, bank statement reconciliations, tax reporting, financial audit compliance.
- **Clinical Permissions**: None.
- **Financial Permissions**: Full administrative authority over general ledger, journal entries, and fiscal periods.

### Role 12: Executive Management
- **Operational Responsibilities**: Review high-level departmental KPIs, patient footfall analytics, revenue summaries, and clinical volume trends.
- **Clinical & Financial Permissions**: Strictly Read-Only aggregate dashboard access.

---

## 4. User Provisioning Protocol (Pre-Go-Live)

```text
STEP 1: Clinic HR / Operations submits authorized Staff Enrollment Form.
STEP 2: System Administrator creates named user in `res.user` (e.g. `s.alkuwari`).
STEP 3: Administrator maps user strictly to designated functional `res.group`.
STEP 4: Initial temporary password generated and delivered via secure out-of-band channel.
STEP 5: User forces password change on first SAO web client login (Minimum 12 chars).
```
