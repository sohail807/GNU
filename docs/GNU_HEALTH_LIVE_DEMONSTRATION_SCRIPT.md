# GNU Health HMIS 5.0 — Live Demonstration Script
## Operational Working Model Demonstration Playbook (20 Scenarios)

**System:** GNU Health HMIS 5.0.6 / Tryton 7.0.57 / PostgreSQL 15.19
**Host VM:** `gnuhealth-srv` (`34.7.237.8`)
**Database:** `gnuhealth`
**Certified Run ID:** `E2E-CERT-FINAL-184439`
**Target Audience:** Management, Clinical Directors, IT Operations, Finance Leadership, Future Frontend Developers

---

### Overview

This script guides an engineer or presenter through an interactive, live demonstration of the GNU Health HMIS outpatient working model. Each step demonstrates a concrete operational capability on the authoritative backend, verifies the business outcome, and references the empirical test evidence.

---

### DEMO 1: Register Patient

* **What to Do:**
  Log in as Receptionist (`demo_frontdesk1`). Call `party.party.create` and `gnuhealth.patient.create` with full demographic payload (Name, QID, DOB: 1991-03-14, Gender: Male, Country: QAT, Address: Al Sadd, Doha).
* **What Should Happen:**
  GNU Health creates the legal `party.party` entity, creates the `party.address`, issues the `party.identifier`, and binds the clinical `gnuhealth.patient` record with an assigned Medical Record Number (PUID).
* **What to Show:**
  Display the created patient record and show that `party.ref == puid == 'E2E-CERT-FINAL-QID-184439'`.
* **Expected Result:**
  Patient record successfully created without duplicate or unlinked foreign keys.
* **Evidence ID:** `PAT-01` (`gnuhealth.patient,65`, `party.party,228`).

---

### DEMO 2: Book Appointment

* **What to Do:**
  As Receptionist (`demo_frontdesk1`), schedule an appointment for Patient 65 with Attending Physician Dr. DEMO (`healthprof,71`), type `outpatient`.
* **What Should Happen:**
  Appointment record created in `free` state, transition to `confirmed`.
* **What to Show:**
  Appointment 68 on the clinic calendar; physician roster linkage and appointment type validation.
* **Expected Result:**
  Appointment state transitions to `confirmed`. Double-booking checks verified.
* **Evidence ID:** `APT-01` (`gnuhealth.appointment,68`).

---

### DEMO 3: Check-in Patient

* **What to Do:**
  When the patient arrives, the front desk executes the check-in transition on Appointment 68 (`appt.state = 'checked_in'`).
* **What Should Happen:**
  The appointment state changes from `confirmed` to `checked_in`. The patient is immediately placed in the clinical triage nursing queue.
* **What to Show:**
  Appointment state showing `checked_in`, timestamped in appointment history.
* **Expected Result:**
  Successful state transition. Front desk cannot modify clinical fields.
* **Evidence ID:** `APT-01` (`gnuhealth.appointment,68`).

---

### DEMO 4: Nursing Triage & Vitals

* **What to Do:**
  Log in as Nurse (`demo_nurse1`). Open the triage queue and record vital signs on Evaluation 44: BP `118/78 mmHg`, Heart Rate `74 bpm`, Temperature `37.1 °C`, Respiratory Rate `16`, SpO2 `99%`, Weight `72.5 kg`, Height `176.0 cm`.
* **What Should Happen:**
  Vital signs are validated and stored in `gnuhealth.patient.evaluation`. BMI is computed automatically.
* **What to Show:**
  Evaluation 44 vitals panel displaying normal physiological values and Chief Complaint: *"Fever, sore throat and rhinorrhea for 3 days"*.
* **Expected Result:**
  Vitals saved in `in_progress` encounter state.
* **Evidence ID:** `TRG-01` (`gnuhealth.patient.evaluation,44`).

---

### DEMO 5: Doctor Consultation (SOAP Notes)

* **What to Do:**
  Log in as Physician (`demo_dr1`). Open Evaluation 44. Enter History of Present Illness (HPI), Physical Examination notes (hyperemic oropharynx, cervical lymphadenopathy), and treatment plan.
* **What Should Happen:**
  Clinical text is recorded under Dr. DEMO's credential (`healthprof,71`).
* **What to Show:**
  The complete SOAP structure in Evaluation 44 and physician attribution.
* **Expected Result:**
  Evaluation reflects physician consultation and links to the clinical encounter.
* **Evidence ID:** `CLN-01` (`gnuhealth.patient.evaluation,44`).

---

### DEMO 6: ICD-10 Diagnosis Binding

* **What to Do:**
  Within Evaluation 44, query the WHO ICD-10 catalog for code `J06.9` ("Acute upper respiratory infection, unspecified") and bind it as the primary diagnosis.
* **What Should Happen:**
  The diagnosis is attached to Evaluation 44, and a persistent entry is added to `gnuhealth.patient.disease`.
* **What to Show:**
  Patient disease registry showing Disease 8 linked to Pathology `J06.9`.
* **Expected Result:**
  Verified diagnosis link. Attempting invalid ICD-10 code rejects cleanly (`ICD-02`).
* **Evidence ID:** `CLN-01`, `ICD-01` (`gnuhealth.patient.disease,8`).

---

### DEMO 7: Prescription Ordering

* **What to Do:**
  As Physician (`demo_dr1`), create a prescription for Amoxicillin 500mg capsules (`medicament,2`): 1 capsule Oral TID for 5 days (total 15 capsules), linked to Evaluation 44.
* **What Should Happen:**
  Drug dosage, route, frequency, and duration are validated. Prescription order reaches `done` state.
* **What to Show:**
  Prescription 39 and line 30 showing physician signature, dosage units, and patient safety validation.
* **Expected Result:**
  Prescription validated and authorized. Front desk creation attempt fails (`RX-02`).
* **Evidence ID:** `RX-01` (`gnuhealth.prescription.order,39`, line 30).

---

### DEMO 8: Laboratory Order & Validation

* **What to Do:**
  Physician orders a Complete Blood Count (CBC). Log in as Lab Technician (`demo_lab1`). Enter test results: Hemoglobin `14.1 g/dL`, WBC `9.4 x10^9/L`, Platelets `260 x10^9/L`. Validate the order.
* **What Should Happen:**
  Laboratory order transitions from requested to `validated`. Automated reference ranges applied.
* **What to Show:**
  Lab Order 34 in `validated` state with biological sign-off by `demo_lab1`.
* **Expected Result:**
  Results certified. Front desk modification attempt fails (`LAB-02`).
* **Evidence ID:** `LAB-01` (`gnuhealth.lab,34`).

---

### DEMO 9: Radiology Request & Reporting

* **What to Do:**
  Physician orders a Chest X-Ray. Log in as Radiologist (`demo_rad1`). Complete imaging interpretation: *"Heart size normal. Lungs clear without focal consolidation."*
* **What Should Happen:**
  Imaging request 34 transitions to `done`. Diagnostic report saved in result record 29.
* **What to Show:**
  Radiology Result 29 showing radiologist sign-off and diagnostic narrative.
* **Expected Result:**
  Imaging workflow completed. Cashier creation attempt fails (`RAD-02`).
* **Evidence ID:** `RAD-01` (`gnuhealth.imaging.test.request,34`, `result,29`).

---

### DEMO 10: Health Services Compilation

* **What to Do:**
  Aggregate encounter clinical events into Health Service 29: Consultation (250 QAR) + CBC (75 QAR) + Chest X-Ray (150 QAR).
* **What Should Happen:**
  Three health service lines are created and linked to the chargemaster product templates.
* **What to Show:**
  Health Service 29 displaying 3 service lines totaling 475.00 QAR.
* **Expected Result:**
  Health service lines correctly linked to revenue account 401000 and patient 65.
* **Evidence ID:** `SRV-01` (`gnuhealth.health_service,29`).

---

### DEMO 11: Customer Invoicing

* **What to Do:**
  Log in as Cashier (`demo_cashier1`). Generate customer invoice from Health Service 29. Validate and post the invoice.
* **What Should Happen:**
  Invoice 31 is posted with gapless official number `INV-2026/00013` for 475.00 QAR.
* **What to Show:**
  Invoice 31 showing posted status, invoice lines, and linked GL Move 42.
* **Expected Result:**
  Posted invoice generates General Ledger Move 42 (DR AR 475.00, CR Revenue 475.00). Doctor invoice creation fails (`BIL-02`).
* **Evidence ID:** `BIL-01` (`account.invoice,31`, `account.move,42`).

---

### DEMO 12: Cash Payment Collection

* **What to Do:**
  As Cashier (`demo_cashier1`), record cash settlement of 475.00 QAR for invoice `INV-2026/00013`.
* **What Should Happen:**
  Payment move 43 (number 46) is created in the Cash Journal (`CASH`) and posted.
* **What to Show:**
  Payment Move 43 showing DR 101000 (Cash) 475.00 QAR and CR 110000 (AR) 475.00 QAR.
* **Expected Result:**
  Debit equals credit (475.00 QAR). Move is posted.
* **Evidence ID:** `ACC-01` (`account.move,43`).

---

### DEMO 13: Receivables Reconciliation

* **What to Do:**
  Execute receivables reconciliation between Invoice 31 AR line and Payment Move 43 AR line.
* **What Should Happen:**
  `account.move_reconciliation,18` is generated, linking the two lines.
* **What to Show:**
  Reconciliation 18 and query proving Patient 65 net outstanding AR is `0.00 QAR`.
* **Expected Result:**
  Patient balance strictly zero. No open unallocated balances.
* **Evidence ID:** `ACC-01` (`account.move_reconciliation,18`).

---

### DEMO 14: General Ledger Double-Entry Audit

* **What to Do:**
  Run General Ledger audit query across the entire database: `SELECT SUM(debit), SUM(credit) FROM account_move_line;`.
* **What Should Happen:**
  Total debits equal total credits across all posted moves in the system.
* **What to Show:**
  Total Debits: `11,400.00 QAR` | Total Credits: `11,400.00 QAR` | Net Difference: `0.00 QAR`.
* **Expected Result:**
  100% mathematical balance. Zero unbalanced moves or orphan move lines.
* **Evidence ID:** `ACC-01`, `reports/e2e_accounting_evidence.json`.

---

### DEMO 15: RBAC Role Boundary Enforcement

* **What to Do:**
  Attempt prohibited operations across roles:
  1. Front Desk attempts to create a prescription.
  2. Cashier attempts to edit a clinical evaluation.
  3. Doctor attempts to create an invoice.
  4. Non-admin attempts to access user administration (`res.user`).
* **What Should Happen:**
  Every prohibited attempt is stopped at the Tryton ORM kernel level.
* **What to Show:**
  Show the resulting `AccessError` exceptions and prove no database records were altered.
* **Expected Result:**
  Clean rejection with `AccessError`. No privilege escalation possible.
* **Evidence ID:** `RBC-01`, `RX-02`, `BIL-02`, `reports/e2e_rbac_evidence.json`.

---

### DEMO 16: Signed Evaluation Immutability

* **What to Do:**
  Attempt to modify clinical notes or delete Evaluation 44 after digital signing.
* **What Should Happen:**
  Tryton model access and clinical workflow logic reject modification and deletion.
* **What to Show:**
  Error message showing deletion denied (`CLN-02`).
* **Expected Result:**
  Signed medical evaluation remains immutable.
* **Evidence ID:** `CLN-02` (`gnuhealth.patient.evaluation,44`).

---

### DEMO 17: Posted Invoice & Move Lock

* **What to Do:**
  Attempt to delete posted Invoice 31 or posted Accounting Move 42.
* **What Should Happen:**
  Tryton accounting core rejects deletion of posted documents.
* **What to Show:**
  Rejection exception (`BIL-03`, `ACC-02`).
* **Expected Result:**
  Posted financial records cannot be deleted. Any adjustment must occur via formal credit note.
* **Evidence ID:** `BIL-03`, `ACC-02`.

---

### DEMO 18: Audit History & Traceability

* **What to Do:**
  Inspect the Tryton audit trail on Patient 65, Appointment 68, Evaluation 44, and Invoice 31.
* **What Should Happen:**
  Show `create_uid`, `create_date`, `write_uid`, and `write_date` metadata.
* **What to Show:**
  The chronological user attribution showing exact user timestamps for each operational transition.
* **Expected Result:**
  Full legal traceability across the entire patient encounter.
* **Evidence ID:** `AUD-01`.

---

### DEMO 19: Native JSON-RPC API

* **What to Do:**
  Send an authenticated JSON-RPC 2.0 HTTP request to `http://127.0.0.1:8000/gnuhealth/` (or via Nginx reverse proxy):
  1. `common.db.login` with `demo_admin1` credentials to retrieve session token.
  2. `model.gnuhealth.patient.search_read` with `Authorization: Session <base64>` header.
* **What Should Happen:**
  Session token issued; patient payload returned formatted in JSON.
* **What to Show:**
  The exact JSON response containing patient ID, PUID, and name.
* **Expected Result:**
  Seamless API dispatch. Invalid password test rejected (`API-02`).
* **Evidence ID:** `API-01`, `API-02`.

---

### DEMO 20: Disaster Recovery & Isolated Restore

* **What to Do:**
  Review the post-certification backup dump `gnuhealth_db_e2e_post_20260922_184552.dump` (7.65 MB, SHA-256 verified). Demonstrate the automated isolated restore drill into `gnuhealth_isolated_e2e_restore`.
* **What Should Happen:**
  Dump is restored in 10 seconds; all 306 tables, 11 patients, 16 appointments, 12 invoices, and 11,400.00 QAR balanced GL are verified. Isolated DB is dropped cleanly.
* **What to Show:**
  Show `reports/e2e_backup_restore.json` proving 100% data survivability.
* **Expected Result:**
  Isolated drill passes with zero data corruption and untouched live system.
* **Evidence ID:** `reports/e2e_backup_restore.json`.
