# OPERATIONAL ROLE ONBOARDING & RBAC MATRIX
## GNU HEALTH HMIS 5.0 / TRYTON 7.0

**Classification**: Authoritative Role-Based Access Control (RBAC) Specification  
**Governing Standard**: Principle of Least Privilege & Separation of Clinical/Financial Duties  
**Status**: SPECIFICATION READY — AWAITING STAKEHOLDER STAFF ROSTER  

---

## 1. Governance Principles & Segregation of Duties (SoD)

To safeguard patient health information (PHI) and financial controls:
1. **Clinical / Financial Separation**: Clinical staff (Physicians, Nurses) cannot post general ledger entries or cancel customer invoices. Billing staff cannot create, modify, or view clinical progress notes without specific clinical privileges.
2. **Prescription Integrity**: Prescriptions can only be created and signed by users with the `Health Doctor` group linked to an active `gnuhealth.healthprofessional` license.
3. **Dual Approval Controls**: High-impact financial actions (invoice cancellations, credit notes, fiscal year closing) require dual approval from `Account Administration`.

---

## 2. Granular Role Mapping Matrix

### Role 1: System Administrator
* **Operational Scope**: Technical system operations, service health, backups, and user management.
* **Assigned Groups**: `Administration`, `Health Administration`.
* **Menu Access**: Administration > Users, System Maintenance, Modules, Localization.
* **Model Access**: Read/Write on `res.user`, `res.group`, `ir.*`.
* **Clinical Access**: Restricted from clinical evaluations (least privilege).
* **Dual Approval**: Dual review required for emergency access elevation.

---

### Role 2: Clinic Administrator / Operations Lead
* **Operational Scope**: Master data management, operating hours, institutional details, doctor assignment.
* **Assigned Groups**: `Health Administration`, `Company Administration`, `Party Administration`.
* **Menu Access**: Health > Configuration, Parties, Institutions, Health Professionals.
* **Model Access**: `gnuhealth.institution`, `gnuhealth.healthprofessional`, `party.party`.
* **Clinical Access**: Operational metadata only; no clinical encounter writing.

---

### Role 3: Front Desk / Patient Registration
* **Operational Scope**: Patient intake, demographic entry, appointment scheduling, check-in.
* **Assigned Groups**: `Health Front Desk`, `Party Administration`.
* **Menu Access**: Health > Patients > Patients, Health > Appointments > Appointments.
* **Model Access**: `gnuhealth.patient` (create/read/update demographics), `gnuhealth.appointment` (create/schedule/check-in), `party.party` (patient parties).
* **Restricted**: Zero access to medical evaluation SOAP notes, lab results, or radiology reports.

---

### Role 4: Physician (Outpatient Doctor)
* **Operational Scope**: Clinical consultation, SOAP history, physical exam, ICD-10 diagnosis, e-prescribing, order entry.
* **Assigned Groups**: `Health Doctor`.
* **Prerequisite**: Must be linked to an active record in `gnuhealth.healthprofessional`.
* **Menu Access**: Health > Patients, Health > Appointments, Health > Clinical Evaluations, Health > Prescriptions, Health > Diagnostic Orders.
* **Model Access**: `gnuhealth.patient.evaluation` (Full), `gnuhealth.prescription.order` (Full), `gnuhealth.lab` (Request only), `gnuhealth.imaging.test.request` (Request only).
* **Restricted**: Billing settlement, posting invoices.

---

### Role 5: Outpatient Triage Nurse
* **Operational Scope**: Patient vital signs, anthropometry, nursing triage, outpatient injections/dressings.
* **Assigned Groups**: `Health Nurse`.
* **Menu Access**: Health > Appointments, Health > Nursing, Health > Ambulatory Care.
* **Model Access**: `gnuhealth.patient.ambulatory_care` (Full), `gnuhealth.appointment` (Read/Triage update).
* **Restricted**: Final prescription signing, financial invoicing.

---

### Role 6: Laboratory Technician / Pathologist
* **Operational Scope**: Specimen accessioning, test execution, quantitative result entry, report release.
* **Assigned Groups**: `Health Lab`.
* **Menu Access**: Health > Laboratory > Test Requests, Test Results, Laboratory Catalog.
* **Model Access**: `gnuhealth.lab` (Read/Write test results, validate reports).
* **Restricted**: Full clinical evaluation SOAP notes, cashiering.

---

### Role 7: Radiographer / Imaging Lead
* **Operational Scope**: Examination verification, radiological study logging, report attachment.
* **Assigned Groups**: `Health Imaging`.
* **Menu Access**: Health > Diagnostic Imaging > Imaging Requests, Imaging Reports.
* **Model Access**: `gnuhealth.imaging.test.request` (Read/Update status), `gnuhealth.imaging.test.result` (Create/Write findings).
* **Restricted**: Laboratory data entry, general ledger moves.

---

### Role 8: Pharmacy Lead / Dispensary Specialist
* **Operational Scope**: Prescription verification, medication dispensing, stock management.
* **Assigned Groups**: `Health Services Administration`, `Product Administration`.
* **Menu Access**: Health > Prescriptions, Health > Medicaments, Products.
* **Model Access**: `gnuhealth.prescription.order` (Read/Dispense), `gnuhealth.medicament` (Read/Write).
* **Restricted**: Clinical SOAP encounter creation.

---

### Role 9: Cashier & Billing Specialist
* **Operational Scope**: Point-of-Sale patient invoicing, collecting copayments/cash, issuing receipts.
* **Assigned Groups**: `Account`, `Accounting Party`.
* **Menu Access**: Financial > Invoices > Customer Invoices, Payments.
* **Model Access**: `account.invoice` (Create/Validate), `account.payment` (Create).
* **Restricted**: Clinical history, lab results, modifying chart of accounts.

---

### Role 10: Senior Accountant / Finance Lead
* **Operational Scope**: Chart of accounts maintenance, fiscal year management, bank reconciliation, GL posting.
* **Assigned Groups**: `Account Administration`, `Account Product Administration`.
* **Menu Access**: Financial > Configuration, Fiscal Years, Periods, General Ledger, Financial Reports.
* **Model Access**: `account.account`, `account.fiscalyear`, `account.move`, `account.journal`.
* **Dual Approval**: Required for opening/closing fiscal years and writing off receivables.

---

### Role 11: Insurance Claims & TPA Coordinator
* **Operational Scope**: Eligibility checking, pre-authorizations, batch electronic claim generation, remittance advice.
* **Assigned Groups**: `Health Back Office`, `Account`.
* **Menu Access**: Health > Insurance, Financial > Invoices.
* **Model Access**: `gnuhealth.insurance`, `gnuhealth.insurance.plan`, `account.invoice`.
* **Restricted**: Clinical diagnostic data editing.

---

### Role 12: Clinical Director / Quality & Reporting Lead
* **Operational Scope**: Operational dashboards, epidemiological surveillance, quality auditing.
* **Assigned Groups**: Read-Only access across `Health Administration`, `Account`.
* **Menu Access**: Health > Reporting, Statistics, Surveillance.
* **Restricted**: Write access to live transactions.

---

## 3. Onboarding Workflow Execution Steps
1. **Roster Intake**: Receive completed Section D–M of `docs/CLINIC_GO_LIVE_INPUT_TEMPLATE.md`.
2. **User Account Creation**: Provision named account `res.user` with institutional email.
3. **Group Association**: Attach only the explicitly defined security groups above.
4. **Health Professional Linking**: For physicians, link user to `gnuhealth.healthprofessional`.
5. **Initial Password Issuance**: Issue cryptographically generated temporary credential via secure out-of-band channel with mandatory change on first login.
