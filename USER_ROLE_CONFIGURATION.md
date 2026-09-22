# GNU HEALTH HMIS 5.0 — USER ROLE & ACCESS CONTROL SPECIFICATION
## Role-Based Access Control (RBAC), Security Groups & Empirical Permission Validation

**Document Identifier**: `GH-ROLE-005`  
**System Baseline**: GNU Health 5.0.6 / Tryton 7.0.57  
**Operating Environment**: `gnuhealth-srv` (PostgreSQL 15.19, Database `gnuhealth`)  
**Evaluation Standard**: Zero-Trust Model-Level Access Validation (`check_access()`)  
**Status**: `AUTHORITATIVE SECURITY & ROLE SPECIFICATION`  

---

## 1. Role Architecture & Least Privilege Principle

GNU Health RBAC is enforced at the Tryton Object-Relational Mapping (ORM) layer through `ir.model.access`, `ir.model.field.access`, and `ir.rule`. Every database operation evaluates user group memberships before constructing SQL queries.

In strict compliance with healthcare privacy regulations (HIPAA, GDPR, Qatar MOPH Health Data Protection Guidelines), the system implements the **Principle of Least Privilege**:
* Administrative staff (Front Desk, Cashier) have zero visibility or edit access to patient medical notes, clinical evaluations, or electronic prescriptions.
* Clinical staff (Physicians, Nurses) have zero write access to general ledger accounting moves or financial journal configurations.
* Diagnostic technicians (Lab, Radiology) are strictly confined to their respective diagnostic testing and reporting modules.

---

## 2. Operational User & Group Matrix

Dedicated DEMO/UAT operational role profiles have been configured, mapped to active company ID 2 (`DEMO HEALTH CLINIC`), and validated:

| Role Profile | System Username | User ID | Primary Security Group (Tryton Group ID) | Secondary Groups | Linked Domain Entity |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Attending Physician 01** | `demo_dr1` | `146` | `Health Doctor` (ID 20) | — | `Dr. DEMO Physician 01` (HP ID 71, Family Medicine) |
| **Attending Physician 02** | `demo_dr2` | `147` | `Health Doctor` (ID 20) | — | `Dr. DEMO Physician 02` (HP ID 72, Internal Medicine) |
| **Triage Nurse 01** | `demo_nurse1` | `148` | `Health Nurse` (ID 22) | — | `DEMO Nurse 01` (HP ID 73) |
| **Laboratory Technician 01**| `demo_lab1` | `149` | `Health Lab` (ID 23) | — | `DEMO Lab Tech 01` (HP ID 74) |
| **Radiology Technician 01** | `demo_rad1` | `150` | `Health Imaging` (ID 24) | — | `DEMO Rad Tech 01` (HP ID 75) |
| **Front Desk / Receptionist** | `demo_frontdesk1`| `151` | `Health Front Desk` (ID 21) | — | Front Desk Terminal User |
| **Billing Cashier** | `demo_cashier1` | `152` | `Account` (ID 4) | `Accounting Party` (ID 34) | Outpatient Billing Desk |
| **Technical Administrator** | `demo_admin1` | `153` | `Administration` (ID 1) | — | Technical Admin User |

---

## 3. Empirical RBAC Permission Matrix & Live Test Results

The access matrix was tested directly against the Tryton ORM kernel using `Transaction().set_user()` with `_check_access: True`. Every permission test returned the expected security response without privilege leakage:

| Model / Functional Capability | Front Desk (`demo_frontdesk1`) | Attending Physician (`demo_dr1`) | Triage Nurse (`demo_nurse1`) | Lab Tech (`demo_lab1`) | Radiology Tech (`demo_rad1`) | Cashier (`demo_cashier1`) |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| **Patient Demographics Create/Write** (`gnuhealth.patient`) | **ALLOWED** | **ALLOWED** | **ALLOWED** | Read Only | Read Only | Read Only |
| **Appointment Booking & Check-in** (`gnuhealth.appointment`)| **ALLOWED** | **ALLOWED** | **ALLOWED** | Read Only | Read Only | Read Only |
| **Clinical Evaluation Write** (`gnuhealth.patient.evaluation`)| **BLOCKED** | **ALLOWED** | Read Only | **BLOCKED** | **BLOCKED** | **BLOCKED** |
| **Clinical Evaluation Sign-off** (`gnuhealth.patient.evaluation`)| **BLOCKED** | **ALLOWED** | **BLOCKED** | **BLOCKED** | **BLOCKED** | **BLOCKED** |
| **Prescription Order Create/Write** (`gnuhealth.prescription.order`)| **BLOCKED** | **ALLOWED** | **BLOCKED** | **BLOCKED** | **BLOCKED** | **BLOCKED** |
| **Prescription Validation** (`gnuhealth.prescription.order`)| **BLOCKED** | **ALLOWED** | **BLOCKED** | **BLOCKED** | **BLOCKED** | **BLOCKED** |
| **Lab Order Create** (`gnuhealth.patient.lab.test`) | **BLOCKED** | **ALLOWED** | **BLOCKED** | Read Only | **BLOCKED** | **BLOCKED** |
| **Lab Results Entry & Sign-off** (`gnuhealth.lab`) | **BLOCKED** | Read Only | **BLOCKED** | **ALLOWED** | **BLOCKED** | **BLOCKED** |
| **Imaging Request Create** (`gnuhealth.imaging.test.request`)| **BLOCKED** | **ALLOWED** | **BLOCKED** | **BLOCKED** | Read Only | **BLOCKED** |
| **Imaging Reporting** (`gnuhealth.imaging.test.result`) | **BLOCKED** | Read Only | **BLOCKED** | **BLOCKED** | **ALLOWED** | **BLOCKED** |
| **Customer Invoice Create/Write** (`account.invoice`) | **ALLOWED** | **BLOCKED** | **BLOCKED** | **BLOCKED** | **BLOCKED** | **ALLOWED** |
| **Cashier Payment Processing** (`account.invoice.pay`) | **BLOCKED** | **BLOCKED** | **BLOCKED** | **BLOCKED** | **BLOCKED** | **ALLOWED** |
| **General Ledger Direct Write** (`account.move`) | **BLOCKED** | **BLOCKED** | **BLOCKED** | **BLOCKED** | **BLOCKED** | **BLOCKED** |
| **Posted Invoice Deletion** (`account.invoice`) | **BLOCKED** | **BLOCKED** | **BLOCKED** | **BLOCKED** | **BLOCKED** | **BLOCKED** |

---

## 4. Live Negative Security Test Suite & Empirical Denial Evidence

The following 9 unauthorized operations were executed against the live host inside dedicated, isolated non-administrative transactions (`_check_access: True`):

| Test ID | Role Tested | User ID | Targeted Model & Operation | Expected Result | Live Result | Exception Triggered | Status |
| :--- | :--- | :---: | :--- | :---: | :---: | :--- | :---: |
| **NEG-01** | Front Desk | 151 | Create Clinical Evaluation (`gnuhealth.patient.evaluation`) | DENIED | **DENIED** | `AccessError` (Model access restricted) | **PASS** |
| **NEG-02** | Front Desk | 151 | Create Prescription (`gnuhealth.prescription.order`) | DENIED | **DENIED** | `AccessError` (Model access restricted) | **PASS** |
| **NEG-03** | Front Desk | 151 | Direct GL Move Create (`account.move`) | DENIED | **DENIED** | `AccessError` (Model access restricted) | **PASS** |
| **NEG-04** | Physician | 146 | Create Fiscal Year (`account.fiscalyear`) | DENIED | **DENIED** | `AccessError` (Model access restricted) | **PASS** |
| **NEG-05** | Physician | 146 | Delete Posted Invoice (`account.invoice`) | DENIED | **DENIED** | `AccessError` (Model access restricted) | **PASS** |
| **NEG-06** | Cashier | 152 | Create Clinical Evaluation (`gnuhealth.patient.evaluation`) | DENIED | **DENIED** | `AccessError` (Model access restricted) | **PASS** |
| **NEG-07** | Cashier | 152 | Create Prescription (`gnuhealth.prescription.order`) | DENIED | **DENIED** | `AccessError` (Model access restricted) | **PASS** |
| **NEG-08** | Laboratory | 149 | Create General Ledger Move (`account.move`) | DENIED | **DENIED** | `AccessError` (Model access restricted) | **PASS** |
| **NEG-09** | Radiology | 150 | Create Accounting Move (`account.move`) | DENIED | **DENIED** | `AccessError` (Model access restricted) | **PASS** |

**Verification Result**: All 9 negative security assertions **`PASSED`** (100% compliance with least privilege model).

---

## 5. Production User Onboarding Protocol

When official clinic personnel rosters are provided by the Medical Director and HR, production user accounts will be provisioned using the following protocol:
1. **Party Creation**: Create physical person record (`party.party`) with `is_person=True`, `gender`, and National QID (`party.identifier`).
2. **User Account**: Generate system user (`res.user`) with unprivileged password, linked to active company ID 2.
3. **Security Group Assignment**: Assign user exclusively to the single appropriate operational group.
4. **Health Professional Linking** (For Physicians/Nurses): Link `party.party` to `gnuhealth.healthprofessional` and assign medical specialty in `gnuhealth.hp_specialty`.
5. **Two-Factor Authentication**: Enforce mandatory password rotation upon initial login.

---

## 6. DEMO/UAT BACKEND IMPLEMENTATION STATUS

### TECHNICALLY IMPLEMENTED
* 8 individual role-specific DEMO/UAT users created and mapped to native Tryton groups (`res.user` IDs 146–153).
* 5 medical professional entities created and linked to dedicated specialties (`gnuhealth.healthprofessional` IDs 71–75).
* Strict least-privilege security configuration applied at the ORM layer (`ir.model.access`, `ir.rule`).

### DEMO/UAT VERIFIED
* All 8 roles successfully exercised across end-to-end outpatient workflows.
* 9 independent negative security denial tests empirically verified with native `AccessError` exceptions on live host.
* Zero privilege leakage observed between clinical, administrative, and financial roles.

### PRODUCTION INPUT PENDING
* Licensed physician roster, national MOPH license numbers, and medical specialties from Medical Director.
* Official clinic staffing roster for Front Desk, Nursing, Laboratory, Radiology, and Cashier from Operations/HR.

### BUSINESS APPROVAL PENDING
* Executive sign-off on production user role mappings and access governance policies.

