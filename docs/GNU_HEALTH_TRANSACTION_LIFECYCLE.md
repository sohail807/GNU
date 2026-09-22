# GNU HEALTH HMIS 5.0 — OUTPATIENT TRANSACTION LIFECYCLE
**Authoritative Backend:** GNU Health HMIS 5.0.6 / Tryton 7.0.57 / PostgreSQL 15.19  
**GCP VM:** `gnuhealth-srv` (`34.7.237.8`) | Database: `gnuhealth`  
**Certified Transaction Cycle ID:** `E2E-CERT-01340`  
**Execution Timestamp:** 2026-09-22T18:22:22Z  
**Certification Status:** **TECHNICALLY CERTIFIED — DEMO/UAT END-TO-END VERIFIED**

---

## 1. Outpatient Transaction Architecture

The outpatient clinic transaction lifecycle operates strictly within native GNU Health models, ensuring that clinical, billing, and accounting operations maintain referential integrity without external or duplicate business logic.

```
+---------------------------------------------------------------------------------------------------+
|                                 END-TO-END TRANSACTION CHAIN                                      |
+---------------------------------------------------------------------------------------------------+
|  1. Patient Registration (Front Desk)     --> party.party (220), gnuhealth.patient (63)           |
|  2. Appointment Booking & Check-In        --> gnuhealth.appointment (66, state: checked_in)       |
|  3. Nursing Triage & Vitals (Nurse)       --> gnuhealth.patient.evaluation (42, in_progress)      |
|  4. Physician Consultation (Doctor)       --> gnuhealth.patient.evaluation (42, state: signed)    |
|  5. ICD-10 Diagnosis Assignment           --> gnuhealth.patient.disease (6, code: J06.9)          |
|  6. Prescription Order & Pharmacy         --> gnuhealth.prescription.order (37, state: done)      |
|  7. Laboratory Test Order & Validation    --> gnuhealth.lab (32, state: validated)                |
|  8. Radiology Order & Interpretation      --> gnuhealth.imaging.test.request (32, state: done)    |
|  9. Health Service Compilation            --> gnuhealth.health_service (27, 3 service lines)       |
| 10. Patient Billing & Invoice Posting     --> account.invoice (29, INV-2026/00011, Move 38)       |
| 11. Payment Receipt & AR Reconciliation   --> account.move (39), reconciliation (17)              |
| 12. Audit Trail & Patient History         --> GL Balanced (9500 QAR), Customer Net AR: 0.00 QAR   |
+---------------------------------------------------------------------------------------------------+
```

---

## 2. Certified Step-by-Step Transaction Walkthrough

### Step 1: Patient Registration & Identity Establishment
- **Responsible Role:** Front Desk (`demo_frontdesk1`, User ID: 151)
- **Native Models:** `party.party`, `party.address`, `party.identifier`, `gnuhealth.patient`
- **Certified Entity IDs:**
  - `party.party` ID: `220` (Name: `E2E-CERT PATIENT 01340`, Ref/QID: `E2E-CERT-QID-01340`, Gender: `m`, Country: `QAT`)
  - `party.address` ID: `220` (Street: `Zone 45, Al Sadd, Doha`, City: `Doha`)
  - `party.identifier` ID: `12` (Code: `E2E-CERT-QID-01340`)
  - `gnuhealth.patient` ID: `63` (PUID: `E2E-CERT-QID-01340`)
- **Validation Enforced:** Required gender, federation country ISO code, unique identifier check.

### Step 2: Appointment Management & Arrival Check-in
- **Responsible Role:** Front Desk (`demo_frontdesk1`)
- **Native Model:** `gnuhealth.appointment`
- **Certified Entity ID:** `gnuhealth.appointment` ID: `66`
- **Workflow Progression:**
  1. `state = 'free'` (Initial slot booking for Dr. DEMO Physician 01, HP ID: 71)
  2. `state = 'confirmed'` (Patient confirms outpatient slot)
  3. `state = 'checked_in'` (Patient arrives physically at clinic; enters waiting queue)
- **Validation Enforced:** Valid selection states; invalid transition `invalid_state_xyz` rejected with `SelectionValidationError`.

### Step 3: Nursing Triage & Vital Signs Recording
- **Responsible Role:** Nurse (`demo_nurse1`, User ID: 148)
- **Native Model:** `gnuhealth.patient.evaluation`
- **Certified Entity ID:** `gnuhealth.patient.evaluation` ID: `42` (Initial State: `in_progress`)
- **Recorded Vitals:**
  - Systolic BP: `118 mmHg` | Diastolic BP: `78 mmHg`
  - Heart Rate: `74 bpm` | Respiratory Rate: `16 bpm`
  - Body Temperature: `37.1 °C` | SpO2: `99%`
  - Body Weight: `72.5 kg` | Height: `176.0 cm`
- **Chief Complaint:** `"E2E-CERT-01340 Fever, sore throat and rhinorrhea for 3 days"`

### Step 4: Clinical Consultation, Diagnosis & Signature Lock
- **Responsible Role:** Doctor (`demo_dr1`, User ID: 146 / HP ID: 71)
- **Native Models:** `gnuhealth.patient.evaluation`, `gnuhealth.patient.disease`, `gnuhealth.pathology`
- **Certified Operations:**
  - Clinical Documentation: Present illness and examination documented.
  - Diagnosis: Assigned ICD-10 `J06.9` (*Acute upper respiratory infection, unspecified*).
  - Disease Registry: Created `gnuhealth.patient.disease` ID `6` linked to Patient `63`.
  - Signature: Evaluation state transitioned to `signed`. Appointment `66` transitioned to `done`.
- **Validation Enforced:** Signed evaluation fields become read-only; doctor deletion attempt rejected via `ir.model.access` (`AccessError`).

### Step 5: Prescription Order & Pharmaceutical Care
- **Responsible Role:** Doctor (`demo_dr1`)
- **Native Models:** `gnuhealth.prescription.order`, `gnuhealth.prescription.line`
- **Certified Entity IDs:**
  - `gnuhealth.prescription.order` ID: `37` (State: `done`, Warning Acknowledged: `True`)
  - `gnuhealth.prescription.line` ID: `28`
- **Prescription Parameters:**
  - Medicament ID: `2` (Amoxicillin 500mg capsule)
  - Dose: `500.0 mg` | Route: `Oral (1)` | Form: `Capsule (1)`
  - Frequency: `3 times daily (TID)` | Duration: `5 days` | Total Quantity: `15 capsules`
  - Clinical Indication: Linked to ICD-10 `J06.9`
- **Validation Enforced:** Front Desk creation blocked via `ir.model.access`.

### Step 6: Laboratory Order & Diagnostic Validation
- **Responsible Role:** Doctor (Ordering) / Lab Technician (`demo_lab1`, User ID: 149)
- **Native Model:** `gnuhealth.lab`
- **Certified Entity ID:** `gnuhealth.lab` ID: `32` (State: `validated`)
- **Test Details:** Complete Blood Count (CBC, Test ID: 1)
- **Reported Result:** `"E2E-CERT-01340 CBC: Hb 14.1 g/dL, WBC 9.4 x10^9/L, Platelets 260 x10^9/L"`
- **Validation Enforced:** Front Desk write/tampering blocked via `ir.model.access`.

### Step 7: Radiology Request, Imaging & Interpretation
- **Responsible Role:** Doctor (Ordering) / Radiographer (`demo_rad1`, User ID: 150)
- **Native Models:** `gnuhealth.imaging.test.request`, `gnuhealth.imaging.test.result`
- **Certified Entity IDs:**
  - `gnuhealth.imaging.test.request` ID: `32` (Requested Test: Chest X-Ray PA View, State: `done`)
  - `gnuhealth.imaging.test.result` ID: `27`
- **Diagnostic Finding:** `"E2E-CERT-01340 CXR: Heart size normal. Lungs clear without focal consolidation or pneumothorax."`
- **Validation Enforced:** Cashier creation blocked via `ir.model.access`.

### Step 8: Health Services Billing Compilation
- **Responsible Role:** Billing Clerk / Cashier (`demo_cashier1`, User ID: 152)
- **Native Models:** `gnuhealth.health_service`, `gnuhealth.health_service.line`
- **Certified Entity ID:** `gnuhealth.health_service` ID: `27` (State: `draft`)
- **Compiled Service Lines (3):**
  1. Product `OPD-EVAL`: Outpatient Consultation (Qty: 1)
  2. Product `LAB-CBC`: Complete Blood Count (Qty: 1)
  3. Product `RAD-XR`: Chest X-Ray PA View (Qty: 1)

### Step 9: Customer Invoicing & Ledger Posting
- **Responsible Role:** Cashier (`demo_cashier1`)
- **Native Models:** `account.invoice`, `account.invoice.line`, `account.move`
- **Certified Entity IDs:**
  - `account.invoice` ID: `29` (Number: `INV-2026/00011`, State: `posted`)
  - Invoice Lines (3):
    - Consultation: `250.00 QAR` (Account `401000`)
    - CBC Lab Test: `75.00 QAR` (Account `401000`)
    - Chest X-Ray: `150.00 QAR` (Account `401000`)
    - **Total Invoice Amount:** `475.00 QAR`
  - Generated GL Move ID: `38` (State: `posted`)
- **Validation Enforced:** Strict sequential numbering; deletion of posted invoice blocked by core engine (`AccessError: You cannot modify invoice ... because it is posted, paid or cancelled`).

### Step 10: Cash Payment & Receivables Reconciliation
- **Responsible Role:** Cashier (`demo_cashier1`)
- **Native Models:** `account.move`, `account.move.line`, `account.move.reconciliation`
- **Certified Operations:**
  - Cash Settlement Move ID: `39` (Journal: `CASH`, Period: Current open period)
    - Debit: Cash Account `101000` = `475.00 QAR`
    - Credit: Accounts Receivable `110000` (Party: 220) = `475.00 QAR`
  - Reconciliation: Matched Invoice Receivable Line and Payment Receivable Line → Reconciliation ID: `17`
  - Customer Net AR: Exactly `0.00 QAR` (Outstanding balance cleared)
  - Global Ledger Balance: Total Debits `9,500.00 QAR` = Total Credits `9,500.00 QAR` (Difference: `0.00 QAR`)
- **Validation Enforced:** Deletion of posted move blocked by Tryton core accounting engine (`AccessError: You cannot modify posted move "..."`).

---

## 3. Transaction Summary Table

| Transaction Component | Certified Record ID | Status / State | Financial / Medical Consequence |
|:---|:---|:---|:---|
| **Patient Party** | `party.party,220` | Active | Person party established with QID `E2E-CERT-QID-01340` |
| **Patient Record** | `gnuhealth.patient,63` | Active | Patient established with PUID `E2E-CERT-QID-01340` |
| **Appointment** | `gnuhealth.appointment,66` | `done` | Successfully traversed `free` → `confirmed` → `checked_in` → `done` |
| **Evaluation** | `gnuhealth.patient.evaluation,42` | `signed` | Vitals recorded; diagnosis confirmed; locked against modification |
| **Disease Entry** | `gnuhealth.patient.disease,6` | Active | Registered ICD-10 `J06.9` in patient's permanent medical history |
| **Prescription** | `gnuhealth.prescription.order,37` | `done` | Prescribed Amoxicillin 500mg TID x 5d (15 capsules) |
| **Lab Order** | `gnuhealth.lab,32` | `validated` | CBC quantitative counts recorded and validated |
| **Imaging Request** | `gnuhealth.imaging.test.request,32` | `done` | Chest X-Ray completed with normal interpretation |
| **Health Service** | `gnuhealth.health_service,27` | `draft` | Consolidated 3 encounter charges |
| **Invoice** | `account.invoice,29` | `posted` | Assigned sequence `INV-2026/00011`; Total `475.00 QAR` |
| **Invoice GL Move** | `account.move,38` | `posted` | DR AR `110000` 475 QAR / CR Rev `401000` 475 QAR |
| **Payment GL Move** | `account.move,39` | `posted` | DR Cash `101000` 475 QAR / CR AR `110000` 475 QAR |
| **Reconciliation** | `account.move.reconciliation,17` | Reconciled | Customer AR cleared to `0.00 QAR`; GL balanced |
