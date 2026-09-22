# MASTER USER ACCEPTANCE TESTING (UAT) PLAN

**Project**: GNU Health HMIS 5.0 / Tryton 7.0 Implementation  
**Document**: `MASTER_UAT_PLAN.md`  
**Classification**: Quality Assurance & End-to-End Test Plan  
**Scope**: Primary Outpatient & Ambulatory Healthcare Facility (State of Qatar)  
**Status**: APPROVED TEST SPECIFICATION — READY FOR EXECUTION  

---

## 1. Test Strategy & Acceptance Criteria

This Master UAT Plan defines the 17 core end-to-end verification scenarios that must be executed by clinic stakeholders prior to authorizing production go-live.

### Success Gate:
1. All P0 and P1 scenarios must achieve a verified status of **PASS**.
2. **Zero Critical Defects (Severity 1 / Blocker)** remain open.
3. System response latency during execution remains $< 1.5$ seconds.
4. All synthetic test records created during UAT must be purged or backed up prior to production cutover.

---

## 2. Comprehensive UAT Scenario Specifications

### UAT-001: New Patient Registration
- **Test ID**: `UAT-001`
- **Objective**: Verify that a new patient can be registered with Qatar ID (QID) and unique PUID generation.
- **Actor**: Receptionist (`Health Front Desk`).
- **Preconditions**: Receptionist user logged into Tryton SAO web client.
- **Test Data**: Name: `Ahmed Al-Mannai`, DOB: `1985-04-12`, Gender: `Male`, QID: `28563412345`, Phone: `+974 5511 2233`.
- **Steps**:
  1. Navigate to Party -> Patients -> New.
  2. Enter full legal name, DOB, biological sex, nationality (Qatar), and mobile phone.
  3. Enter 11-digit QID in National ID field.
  4. Click Save.
- **Expected Result**: Patient record saved; unique PUID generated with prefix `QAT-` (e.g. `QAT-00001`); no errors.
- **Actual Result**: Pending UAT execution.
- **Pass/Fail**: `TESTING_REQUIRED`
- **Evidence**: Screenshot of saved patient profile showing PUID.
- **Defect**: None.
- **Owner**: Reception Lead.

---

### UAT-002: Existing Patient Search & Retrieval
- **Test ID**: `UAT-002`
- **Objective**: Verify rapid search and retrieval of existing patient charts using multiple criteria.
- **Actor**: Receptionist / Nurse.
- **Preconditions**: Patient registered in UAT-001.
- **Test Data**: Search query: `Ahmed Al-Mannai`, `28563412345`, or PUID.
- **Steps**:
  1. Open Patient Search dialog.
  2. Search by 11-digit QID; verify result appears immediately.
  3. Search by partial phone number; verify result appears.
  4. Search by PUID; open patient master file.
- **Expected Result**: Matching patient record retrieved in $< 1$ second; demographic history displayed accurately.
- **Actual Result**: Pending UAT execution.
- **Pass/Fail**: `TESTING_REQUIRED`
- **Evidence**: Search results log.
- **Defect**: None.
- **Owner**: Reception Lead.

---

### UAT-003: Appointment Booking (Scheduled)
- **Test ID**: `UAT-003`
- **Objective**: Verify scheduling a future consultation appointment with a specific doctor.
- **Actor**: Receptionist.
- **Preconditions**: Doctor profile registered in `gnuhealth.healthprofessional`.
- **Test Data**: Doctor: `Dr. Sarah Al-Kuwari` (General Practice), Date: Tomorrow at 10:00 AM, Type: `Routine`.
- **Steps**:
  1. Open Appointments calendar.
  2. Select Doctor and date/time slot.
  3. Attach patient from UAT-001.
  4. Set appointment status to `Confirmed`.
- **Expected Result**: Appointment saved in `confirmed` status; appears in doctor's daily schedule.
- **Actual Result**: Pending UAT execution (Blocked by doctor master data onboarding).
- **Pass/Fail**: `BLOCKED` (Master Data Required)
- **Evidence**: Calendar view screenshot.
- **Defect**: Doctor master data missing.
- **Owner**: Reception Lead.

---

### UAT-004: Unscheduled Walk-In Arrival & Queue Insertion
- **Test ID**: `UAT-004`
- **Objective**: Verify immediate queue insertion for an unscheduled walk-in patient.
- **Actor**: Receptionist.
- **Preconditions**: Patient registered; doctor on duty.
- **Test Data**: Patient from UAT-001, Walk-in flag: `True`, Priority: `Urgent`.
- **Steps**:
  1. Create immediate appointment for current date/time.
  2. Mark as Walk-In.
  3. Click `Check-In`.
- **Expected Result**: Appointment status updates to `checked_in`; arrival timestamp logged; patient appears immediately in Nursing Triage queue.
- **Actual Result**: Pending UAT execution.
- **Pass/Fail**: `TESTING_REQUIRED`
- **Evidence**: Triage queue screenshot showing checked-in patient.
- **Defect**: None.
- **Owner**: Reception Lead.

---

### UAT-005: Nursing Triage & Vital Signs Acquisition
- **Test ID**: `UAT-005`
- **Objective**: Verify recording of multi-parameter vital signs and automatic BMI calculation.
- **Actor**: Triage Nurse (`Health Nursing`).
- **Preconditions**: Patient in `checked_in` status.
- **Test Data**: BP: `120/80 mmHg`, Pulse: `72 bpm`, RR: `16`, Temp: `37.0 C`, SpO2: `99%`, Weight: `70 kg`, Height: `175 cm`.
- **Steps**:
  1. Open Nursing Triage queue; select checked-in patient.
  2. Enter vital signs in triage rounding form.
  3. Enter Weight and Height.
  4. Verify calculated BMI ($BMI = 22.86$).
  5. Select Triage Category: `Routine / Normal`.
  6. Click Save and Submit to Doctor.
- **Expected Result**: Vitals saved without error; BMI calculated accurately; patient advances to Doctor's Consultation Queue.
- **Actual Result**: Pending UAT execution.
- **Pass/Fail**: `TESTING_REQUIRED`
- **Evidence**: Completed triage form screenshot.
- **Defect**: None.
- **Owner**: Nursing Lead.

---

### UAT-006: Physician Clinical Encounter & ICD-10 Coding
- **Test ID**: `UAT-006`
- **Objective**: Verify physician SOAP charting, ICD-10 diagnosis assignment, and medical record sign-off.
- **Actor**: Consulting Doctor (`Health Doctor`).
- **Preconditions**: Patient in doctor's waiting queue with recorded vitals.
- **Test Data**: Chief Complaint: `Fever and dry cough for 3 days`, Exam: `Normal breath sounds`, Diagnosis: `J06.9 Acute upper respiratory infection`.
- **Steps**:
  1. Doctor opens patient evaluation from clinic queue.
  2. Review triage vitals.
  3. Document Subjective history and Objective exam.
  4. Search and select ICD-10 code `J06.9` as primary diagnosis.
  5. Document management plan: `Rest, hydration, symptomatic treatment`.
  6. Sign and mark evaluation as `Done`.
- **Expected Result**: Evaluation record locked permanently against modification (`perm_delete = False`); diagnosis linked to patient history.
- **Actual Result**: Pending UAT execution.
- **Pass/Fail**: `TESTING_REQUIRED`
- **Evidence**: Signed evaluation form screenshot showing locked fields.
- **Defect**: None.
- **Owner**: Clinical Lead.

---

### UAT-007: Electronic Prescription Ordering & Drug Safety Checks
- **Test ID**: `UAT-007`
- **Objective**: Verify e-prescription creation and automatic allergy contraindication warning.
- **Actor**: Consulting Doctor.
- **Preconditions**: Patient documented with Penicillin allergy in medical record.
- **Test Data**: Drug: `Amoxicillin 500mg Capsules` (Penicillin family), Dose: 1 cap TDS for 5 days.
- **Steps**:
  1. Open Prescriptions tab within the active clinical evaluation.
  2. Add medication line: select Amoxicillin.
  3. Click Save.
- **Expected Result**: System triggers clinical safety warning (`SM-CORE-0018`): *"Patient is allergic to Penicillin derivatives"*; requires explicit physician override or cancellation.
- **Actual Result**: Pending UAT execution (Blocked by formulary onboarding).
- **Pass/Fail**: `BLOCKED` (Master Data Required)
- **Evidence**: Safety warning dialog screenshot.
- **Defect**: Medication formulary empty.
- **Owner**: Clinical Lead / Chief Pharmacist.

---

### UAT-008: Pharmacy Prescription Dispensing & Inventory Deduction
- **Test ID**: `UAT-008`
- **Objective**: Verify pharmacist prescription review, batch assignment, and stock level deduction.
- **Actor**: Pharmacist (`Health Pharmacy`).
- **Preconditions**: E-Prescription signed by physician; drug in stock with batch and expiry.
- **Test Data**: Drug: `Panadol Extra 500mg`, Qty: 1 box (20 tablets), Batch: `BAT-2026-09`.
- **Steps**:
  1. Pharmacist opens pending e-prescriptions queue.
  2. Select prescription; verify dosage instructions.
  3. Select stock lot/batch number.
  4. Click `Dispense`.
- **Expected Result**: Prescription marked as `Dispensed`; stock moves deduct 1 unit from dispensary location; billing handoff created.
- **Actual Result**: Pending UAT execution.
- **Pass/Fail**: `TESTING_REQUIRED`
- **Evidence**: Dispensing confirmation log and inventory stock move report.
- **Defect**: None.
- **Owner**: Pharmacy Lead.

---

### UAT-009: Laboratory Test Requisition & Result Entry
- **Test ID**: `UAT-009`
- **Objective**: Verify doctor lab ordering, specimen collection, technician result entry, and pathologist sign-off.
- **Actor**: Doctor, Nurse, Lab Technician.
- **Preconditions**: Patient in consultation.
- **Test Data**: Test: `Complete Blood Count (CBC)`.
- **Steps**:
  1. Doctor orders CBC test from evaluation screen.
  2. Phlebotomist logs blood tube collection with accession timestamp.
  3. Lab tech opens specimen worklist, inputs Hemoglobin ($14.2\text{ g/dL}$) and WBC ($6.5\times 10^3/\mu\text{L}$).
  4. Lab supervisor reviews and signs off test report.
  5. Doctor views verified result in patient EHR.
- **Expected Result**: Results verified and locked; visible in real-time on doctor's consultation screen; lab service billed.
- **Actual Result**: Pending UAT execution.
- **Pass/Fail**: `TESTING_REQUIRED`
- **Evidence**: Verified lab report PDF and doctor view screenshot.
- **Defect**: None.
- **Owner**: Lab Lead.

---

### UAT-010: Radiology Study Requisition & Diagnostic Reporting
- **Test ID**: `UAT-010`
- **Objective**: Verify imaging requisition, procedure logging, and radiologist report sign-off.
- **Actor**: Doctor, Radiology Tech, Radiologist.
- **Preconditions**: Patient in consultation.
- **Test Data**: Study: `Chest X-Ray (CXR PA View)`, Indication: `Persistent cough`.
- **Steps**:
  1. Doctor creates imaging requisition with clinical indication.
  2. Radiology tech logs scan execution.
  3. Radiologist enters diagnostic report: *"Clear lung fields, normal cardiothoracic ratio"*.
  4. Radiologist signs and locks report.
- **Expected Result**: Signed radiology report attached as PDF to patient medical chart; procedure billed.
- **Actual Result**: Pending UAT execution.
- **Pass/Fail**: `TESTING_REQUIRED`
- **Evidence**: Radiology report attachment screenshot.
- **Defect**: None.
- **Owner**: Radiology Lead.

---

### UAT-011: Outpatient Cash Billing & General Ledger Posting
- **Test ID**: `UAT-011`
- **Objective**: Verify consolidated invoice creation, cash payment receipting, and general ledger posting in QAR.
- **Actor**: Cashier / Billing Officer (`Health Billing`).
- **Preconditions**: Consultation completed; fiscal year open in `account.fiscalyear`.
- **Test Data**: Consultation: 150.00 QAR, Cash Tender: 200.00 QAR, Change: 50.00 QAR.
- **Steps**:
  1. Cashier opens patient billing account.
  2. Validate aggregated invoice lines (Consultation: 150 QAR).
  3. Click `Post Invoice`.
  4. Select Payment Method: `Cash`. Enter 200 QAR tendered.
  5. Click `Post Payment` and print official receipt.
- **Expected Result**: Invoice posted to General Ledger; debit Account 1111 (Cash) 150 QAR, credit Account 4100 (Revenue) 150 QAR; receipt prints with clinic details and QAR currency.
- **Actual Result**: **BLOCKED** (Current live count of `account.fiscalyear` is 0; invoice posting cannot execute).
- **Pass/Fail**: `BLOCKED` (Fiscal Year Required)
- **Evidence**: Blocked validation error dialog.
- **Defect**: No open fiscal year in `account.fiscalyear`.
- **Owner**: Finance Lead.

---

### UAT-012: Credit/Debit Card POS Payment & Settlement
- **Test ID**: `UAT-012`
- **Objective**: Verify payment collection via bank debit/credit card POS terminal.
- **Actor**: Cashier.
- **Preconditions**: Fiscal year open; POS clearing journal active.
- **Test Data**: Invoice Total: 250.00 QAR, Tender: `Card`, POS Auth Code: `TXN-88421`.
- **Steps**:
  1. Cashier validates invoice.
  2. Select Payment Method: `Bank / POS Terminal`.
  3. Enter POS Transaction Approval Code `TXN-88421`.
  4. Post payment and print receipt.
- **Expected Result**: Payment debits Account 1112 (POS Clearing) and credits Account 1131 (Patient Receivable).
- **Actual Result**: Pending UAT execution (Blocked by fiscal year).
- **Pass/Fail**: `BLOCKED` (Fiscal Year Required)
- **Evidence**: POS receipt printout.
- **Defect**: Fiscal year required.
- **Owner**: Finance Lead.

---

### UAT-013: Health Insurance Copay & Payer Split Invoicing
- **Test ID**: `UAT-013`
- **Objective**: Verify 20% patient copayment calculation and 80% insurer receivable line creation.
- **Actor**: Receptionist / Billing Officer.
- **Preconditions**: Patient registered with valid insurance policy (20% copay terms).
- **Test Data**: Gross Service: 250.00 QAR Specialist Consultation.
- **Steps**:
  1. Select insured patient for billing.
  2. Generate encounter invoice.
  3. Verify split: Copay = `50.00 QAR`, Insurer Claim = `200.00 QAR`.
  4. Collect 50 QAR from patient via Card.
  5. Post invoice.
- **Expected Result**: Patient pays 50 QAR; remaining 200 QAR booked to Account 1132 (Insurance Receivables) under insurer party.
- **Actual Result**: Pending UAT execution (Blocked by fiscal year and payer master data).
- **Pass/Fail**: `BLOCKED`
- **Evidence**: Split invoice line screenshot.
- **Defect**: Fiscal year and payer master data required.
- **Owner**: Insurance Lead / Finance Lead.

---

### UAT-014: Patient Refund & Credit Note Processing
- **Test ID**: `UAT-014`
- **Objective**: Verify processing of an authorized service cancellation and payment refund.
- **Actor**: Billing Officer & Clinic Manager.
- **Preconditions**: Posted invoice from UAT-011.
- **Test Data**: Service cancelled prior to delivery. Refund amount: 150.00 QAR.
- **Steps**:
  1. Open posted invoice.
  2. Click `Credit Note / Refund`. Enter cancellation reason.
  3. Manager authorizes credit note.
  4. Cashier issues cash refund from drawer.
- **Expected Result**: Credit note generated reversing revenue; accounting move reverses cash debit.
- **Actual Result**: Pending UAT execution.
- **Pass/Fail**: `TESTING_REQUIRED`
- **Evidence**: Credit note printout.
- **Defect**: None.
- **Owner**: Finance Lead.

---

### UAT-015: Role-Based Access Control & Permission Enforcement
- **Test ID**: `UAT-015`
- **Objective**: Verify that receptionists cannot access clinical notes and doctors cannot access general ledger journals.
- **Actor**: Receptionist and Doctor test users.
- **Preconditions**: User accounts mapped to respective groups.
- **Steps**:
  1. Log in as Receptionist: attempt to navigate to Medical Evaluations; verify menu is hidden or access denied.
  2. Log in as Doctor: attempt to navigate to Financial Journals / Fiscal Years; verify menu is hidden or access denied.
- **Expected Result**: Access strictly denied in accordance with RBAC least-privilege matrix.
- **Actual Result**: Pending UAT execution.
- **Pass/Fail**: `TESTING_REQUIRED`
- **Evidence**: Permission denial screenshots.
- **Defect**: None.
- **Owner**: System Administrator.

---

### UAT-016: Clinical Audit Trail Verification
- **Test ID**: `UAT-016`
- **Objective**: Verify that all patient record modifications record user ID and timestamp.
- **Actor**: System Administrator.
- **Preconditions**: Actions completed in UAT-001 through UAT-006.
- **Steps**:
  1. Admin opens `gnuhealth.patient.evaluation` in Tryton debug mode.
  2. Inspect system fields: `create_uid`, `create_date`, `write_uid`, `write_date`.
- **Expected Result**: Audit timestamps match action execution; user IDs accurately reflect acting clinicians.
- **Actual Result**: Pending UAT execution.
- **Pass/Fail**: `TESTING_REQUIRED`
- **Evidence**: Audit inspector screenshot.
- **Defect**: None.
- **Owner**: System Administrator.

---

### UAT-017: Disaster Recovery Backup & Restoration Verification
- **Test ID**: `UAT-017`
- **Objective**: Verify that a database backup can be restored to a secondary test environment without data corruption.
- **Actor**: DevOps Engineer.
- **Preconditions**: Database contains test UAT data.
- **Steps**:
  1. Execute `/home/gnuhealth/backup_gnuhealth.sh`.
  2. Transfer snapshot to scratch test database `gnuhealth_test_restore`.
  3. Verify table record counts match primary database.
- **Expected Result**: Backup archive decompresses and restores cleanly; zero database corruption.
- **Actual Result**: Pending UAT execution.
- **Pass/Fail**: `TESTING_REQUIRED`
- **Evidence**: Restoration terminal log.
- **Defect**: None.
- **Owner**: DevOps Engineer.
