# GNU HEALTH HMIS 5.0 — FRONTEND USER ACCEPTANCE TESTING (UAT) PLAN

**Document ID:** GNU-HEALTH-FE-UAT-2026-09-22  
**Target Audience:** QA Engineers, Product Managers, Clinical UAT Leads, Frontend Engineers  
**Authoritative Backend:** GNU Health HMIS 5.0 / Tryton 7.0 / PostgreSQL 15.19  
**Execution Mode:** DEMO / UAT Dataset Mode  

---

## 1. Objective & Scope

This User Acceptance Testing (UAT) Plan defines the structured testing procedures to validate that the future clinic frontend properly integrates with the authoritative GNU Health HMIS backend.

The UAT covers:
1. **End-to-End Outpatient Clinical Workflow (Positive Path):** Testing the full patient journey from reception to settlement.
2. **Role-Based Access Control & Negative Security:** Ensuring that unauthorized operations and privilege escalations are strictly blocked.
3. **Immutability & Accounting Controls:** Ensuring that signed medical records and posted financial invoices cannot be tampered with.

---

## 2. Test Environment & Actors

### 2.1 Test System
- **VM Host:** `gnuhealth-srv` (`34.7.237.8`)
- **Backend Environment:** GNU Health HMIS 5.0.6 / Tryton 7.0.57 / PostgreSQL 15.19
- **Operating Currency:** QAR (Qatari Riyal)
- **Fiscal Year:** FY2026 (Open)

### 2.2 UAT Personas & Accounts
| Persona | User Login | System Role Group | Primary Responsibilities |
|:--------|:-----------|:------------------|:-------------------------|
| **Front Desk Officer** | `demo_frontdesk1` | `Health Front Desk` | Patient intake, appointment booking, check-in |
| **Triage Nurse** | `demo_nurse1` | `Health Nurse` | Vital signs, triage assessment, chief complaint |
| **Attending Clinician** | `demo_dr1` | `Health Doctor` | Consultation, ICD-10 diagnosis, Rx, lab/imaging orders, signing |
| **Laboratory Technician** | `demo_lab1` | `Health Lab` | Specimen receipt, test execution, result entry, validation |
| **Radiology Technician** | `demo_rad1` | `Health Imaging` | Diagnostic image capture, radiology reporting |
| **Cashier / Accountant** | `demo_cashier1` | `Account`, `Accounting Party` | Billing compilation, invoicing, payment settlement, AR reconciliation |
| **Clinic Administrator** | `demo_admin1` | `Administration`, `Health Admin` | User administration, master data, audit oversight |

---

## 3. Test Suite A: Positive Outpatient Clinical Workflow

### Scenario 1: Patient Registration & Search
- **Actor:** Front Desk (`demo_frontdesk1`)
- **Pre-conditions:** Receptionist logged in.
- **Actions:**
  1. Search for existing patient `DEMO PATIENT 001` (QID `DEMO-QID-000001`). Verify record is found.
  2. Navigate to "New Patient Registration".
  3. Register new test patient: Name "UAT PATIENT 001", Gender Female, DOB 1995-03-25, Country "QAT", Civil ID `UAT-QID-001`.
- **Expected Results:**
  - Patient record created with unique PUID sequence.
  - Linked party created with verified QID and country attributes.

---

### Scenario 2: Appointment Scheduling & Check-In
- **Actor:** Front Desk (`demo_frontdesk1`)
- **Actions:**
  1. Open Appointment Calendar for Dr. DEMO Physician 01 (`demo_dr1`).
  2. Select an available time slot and book appointment for "UAT PATIENT 001".
  3. Verify appointment status transitions to `'confirmed'`.
  4. On patient arrival, click "Check-In". Verify status transitions to `'checked_in'`.
- **Expected Results:**
  - Appointment record created and linked to patient file.
  - State correctly reflects `'checked_in'`.

---

### Scenario 3: Nursing Triage & Vital Signs Entry
- **Actor:** Nurse (`demo_nurse1`)
- **Actions:**
  1. Open Nursing Triage Worklist; locate checked-in patient.
  2. Open Triage Encounter Form.
  3. Record vitals: BP 120/80 mmHg, Pulse 72 bpm, Temp 37.0°C, Resp 16/min, SpO2 99%, Weight 68.0 kg, Height 168.0 cm.
  4. Enter preliminary complaint: "Mild fever and sore throat for 2 days".
  5. Save triage assessment.
- **Expected Results:**
  - `gnuhealth.patient.evaluation` record created in state `'in_progress'`.
  - Vitals successfully recorded and linked to patient and appointment.

---

### Scenario 4: Physician Consultation & Medical Evaluation
- **Actor:** Attending Physician (`demo_dr1`)
- **Actions:**
  1. Open Outpatient Consultation Roster; select patient.
  2. Review triage vitals and complaint.
  3. Complete History of Present Illness (HPI), physical exam summary, and clinical findings.
  4. Assign primary ICD-10 diagnosis: search catalog for `J06.9` ("Acute upper respiratory infection, unspecified").
  5. Click "Sign & Finalize Encounter".
- **Expected Results:**
  - Evaluation state transitions to `'signed'`.
  - Field-level lock activates: all clinical evaluation fields become read-only.
  - Appointment status transitions to `'done'`.

---

### Scenario 5: Electronic Prescription
- **Actor:** Attending Physician (`demo_dr1`)
- **Actions:**
  1. Open Medication Order panel.
  2. Prescribe Amoxicillin 500mg: Oral route, 1 tablet TID for 5 days (Qty: 15).
  3. Link indication to ICD-10 diagnosis `J06.9`.
  4. Acknowledge safety warning and click "Validate Prescription".
- **Expected Results:**
  - Prescription order created in state `'done'`.
  - Prescription line populated with formulation, dosage, and duration.

---

### Scenario 6: Diagnostic Laboratory Requisition & Testing
- **Actors:** Attending Physician (`demo_dr1`), Lab Technician (`demo_lab1`)
- **Actions:**
  1. Physician orders Complete Blood Count (`LAB-CBC`) requisition. State initial: `'draft'`.
  2. Lab technician opens Lab Worklist; accepts CBC specimen.
  3. Lab technician enters results: "Hb 14.1 g/dL, WBC 9.5 x10^9/L, Platelets 245 x10^9/L".
  4. Lab technician marks test `'tested'`, then clicks "Validate Results".
- **Expected Results:**
  - Lab requisition transitions to `'validated'`.
  - Results visible in patient's longitudinal EMR view.

---

### Scenario 7: Diagnostic Radiology Examination & Reporting
- **Actors:** Attending Physician (`demo_dr1`), Radiology Technician (`demo_rad1`)
- **Actions:**
  1. Physician orders Chest X-Ray (`RAD-XR`) requisition.
  2. Radiology technician acquires imaging study; enters diagnostic report: "Chest PA View: Lungs clear bilaterally. Heart size normal. No acute infiltrate."
  3. Radiology technician submits completed report.
- **Expected Results:**
  - Imaging request transitions to `'done'`.
  - Formal diagnostic findings saved in `gnuhealth.imaging.test.result`.

---

### Scenario 8: Billing Compilation, Invoicing & Payment Settlement
- **Actor:** Cashier (`demo_cashier1`)
- **Actions:**
  1. Open Billing Manifest Queue. Locate patient's encounter services (Consultation 250 QAR + CBC 75 QAR + CXR 150 QAR = 475 QAR).
  2. Generate Customer Invoice. Click "Post Invoice".
  3. Verify generated invoice sequence number (e.g. `INV-2026/00008`) and state `'posted'`.
  4. Open Cash Receipt Panel; enter cash collection of 475.00 QAR.
  5. Post payment and execute "Reconcile Receivables".
- **Expected Results:**
  - General Ledger move posted: Debit AR (110000) 475 QAR, Credit Revenue (401000) 475 QAR.
  - Payment move posted: Debit Cash (101000) 475 QAR, Credit AR (110000) 475 QAR.
  - Receivables reconciled (Reconciliation ID assigned).
  - Patient Net Accounts Receivable balance reflects **0.00 QAR**.

---

## 4. Test Suite B: Negative Security & Immutability Enforcements

| Test Case ID | Test Objective | Executing Role | Action Attempted | Expected System Behavior | Pass / Fail Criteria |
|:---|:---|:---|:---|:---|:---|
| **SEC-NEG-01** | Front Desk Evaluation Block | `demo_frontdesk1` | Attempt to call `model.gnuhealth.patient.evaluation.create` | Rejected with `AccessError: You are not allowed to access "Patient Evaluation"` | **PASS** if rejected |
| **SEC-NEG-02** | Front Desk Prescription Block | `demo_frontdesk1` | Attempt to call `model.gnuhealth.prescription.order.create` | Rejected with `AccessError: You are not allowed to access "Prescription"` | **PASS** if rejected |
| **SEC-NEG-03** | Cashier Clinical Tampering Block | `demo_cashier1` | Attempt to write or delete `gnuhealth.patient.evaluation` | Rejected with `AccessError: You are not allowed to access "Patient Evaluation"` | **PASS** if rejected |
| **SEC-NEG-04** | Physician Invoice Posting Block | `demo_dr1` | Attempt to call `model.account.invoice.create` or `post` | Rejected with `AccessError: You are not allowed to access "Invoice"` | **PASS** if rejected |
| **SEC-NEG-05** | Privilege Escalation Block | `demo_dr1` / `demo_cashier1` | Attempt to write Group 1 (`Administration`) onto own user account in `res.user` | Rejected with `AccessError: You are not allowed to access "User"` | **PASS** if rejected |
| **SEC-NEG-06** | Signed Evaluation Immutability | `demo_dr1` / `demo_admin1` | Attempt to edit fields on an evaluation in state `'signed'` | ORM rejects modification; field state guards enforce read-only | **PASS** if locked |
| **SEC-NEG-07** | Posted Invoice Immutability | `demo_cashier1` | Attempt to delete a posted customer invoice (`state='posted'`) | Rejected with `AccessError: You cannot modify invoice... because it is posted` | **PASS** if rejected |
| **SEC-NEG-08** | Posted GL Move Immutability | `demo_cashier1` | Attempt to delete a posted general ledger move | Rejected with `AccessError: You cannot modify posted move` | **PASS** if rejected |

---

## 5. Acceptance Criteria for Frontend Sign-Off

The clinic frontend is approved for user deployment **ONLY IF**:
1. All 8 scenarios in Test Suite A execute end-to-end without unhandled errors.
2. All 8 negative test cases in Test Suite B are strictly enforced with appropriate user notifications.
3. Total debits equal total credits across all generated financial transactions.
4. No direct database connections or shadow business tables exist in the frontend codebase.
5. All sensitive credentials remain quarantined from the browser and repository.
