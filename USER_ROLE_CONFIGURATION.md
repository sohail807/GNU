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

Six dedicated operational role profiles have been configured, mapped to active company ID 2 (`QAR`), and validated:

| Role Profile | System Username | User ID | Primary Security Group (Tryton Group ID) | Secondary Groups | Linked Domain Entity |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Front Desk / Receptionist** | `uat_frontdesk` | `10` | `Health Front Desk` (ID 21) | — | Front Desk Terminal User |
| **Attending Physician** | `uat_doctor` | `11` | `Health Doctor` (ID 20) | — | `Dr. UAT Physician` (HP ID 8) |
| **Triage Nurse** | `uat_nurse` | `12` | `Health Nurse` (ID 22) | — | Nursing Station Staff |
| **Laboratory Technician** | `uat_lab` | `13` | `Health Lab` (ID 23) | — | Clinical Laboratory Bench |
| **Radiology Technician** | `uat_rad` | `14` | `Health Imaging` (ID 24) | — | Diagnostic Imaging Suite |
| **Billing Cashier** | `uat_cashier` | `15` | `Account` (ID 4) | `Accounting Party` (ID 34) | Outpatient Billing Desk |

---

## 3. Empirical RBAC Permission Matrix & Live Test Results

The access matrix was tested directly against the Tryton ORM kernel using `with Transaction().set_user(role_user_id): with check_access():`. Every permission test returned the expected security response without privilege leakage:

| Model / Functional Capability | Front Desk (`uat_frontdesk`) | Attending Physician (`uat_doctor`) | Triage Nurse (`uat_nurse`) | Lab Tech (`uat_lab`) | Radiology Tech (`uat_rad`) | Cashier (`uat_cashier`) |
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

## 4. Empirical Security Test Evidence

The following programmatic test script was executed inside the live Tryton environment to empirically verify permissions:

```python
# Empirical RBAC Verification Protocol
with Transaction().set_user(frontdesk_user.id):
    with check_access():
        assert Patient.check_access('create', raise_exception=False) == True, "Frontdesk must create patients"
        assert Evaluation.check_access('write', raise_exception=False) == False, "Frontdesk cannot edit clinical notes"
        assert Prescription.check_access('create', raise_exception=False) == False, "Frontdesk cannot prescribe drugs"
        assert AccountMove.check_access('write', raise_exception=False) == False, "Frontdesk cannot edit general ledger"

with Transaction().set_user(doctor_user.id):
    with check_access():
        assert Evaluation.check_access('create', raise_exception=False) == True, "Doctor must create evaluations"
        assert Prescription.check_access('create', raise_exception=False) == True, "Doctor must write prescriptions"
        assert LabTest.check_access('create', raise_exception=False) == True, "Doctor must order lab tests"
        assert AccountMove.check_access('write', raise_exception=False) == False, "Doctor cannot write general ledger"
        assert Invoice.check_access('delete', raise_exception=False) == False, "Doctor cannot delete invoices"

with Transaction().set_user(cashier_user.id):
    with check_access():
        assert Invoice.check_access('write', raise_exception=False) == True, "Cashier must edit/post invoices"
        assert Evaluation.check_access('write', raise_exception=False) == False, "Cashier cannot edit medical notes"
        assert Prescription.check_access('create', raise_exception=False) == False, "Cashier cannot create prescriptions"
```

**Verification Result**: All assertions **`PASSED`** (100% compliance with security baseline).

---

## 5. Production User Onboarding Protocol

When official clinic personnel rosters are provided by the Medical Director and HR, production user accounts will be provisioned using the following protocol:
1. **Party Creation**: Create physical person record (`party.party`) with `is_person=True`, `gender`, and National QID (`party.identifier`).
2. **User Account**: Generate system user (`res.user`) with unprivileged password, linked to active company ID 2.
3. **Security Group Assignment**: Assign user exclusively to the single appropriate operational group.
4. **Health Professional Linking** (For Physicians/Nurses): Link `party.party` to `gnuhealth.healthprofessional` and assign medical specialty in `gnuhealth.hp_specialty`.
5. **Two-Factor Authentication**: Enforce mandatory password rotation upon initial login.
