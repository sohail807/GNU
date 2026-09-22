# 04. Clinical Workflows Specification

**Project**: Healthcare Management System — GNU Health Implementation  
**Assessment Date**: 2026-09-21  
**Document**: `docs/04-Clinical-Workflows.md`  

---

## 1. Executive Summary

This document specifies the six core outpatient clinical workflows supported by the GNU Health implementation. Each workflow traces real operational steps, identifying working mechanisms, dependencies, and required inputs.

---

## 2. End-to-End Clinical Workflows

### Workflow A: New Outpatient Intake & Clinical Encounter

```text
[Reception Desk]
   1. Patient Demographics & National ID Registration (party.party, gnuhealth.patient)
   2. Automated PUID Generation (e.g. QAT-PLIXXXXXX)
   3. Outpatient Appointment Booking (gnuhealth.appointment) -> State: 'confirmed'
        ↓
[Nursing Station - Unit: NURS]
   4. Patient Arrival & Check-In -> State: 'checked_in'
   5. Nursing Intake & Vital Signs Capture (gnuhealth.patient.evaluation)
      - Blood Pressure, Heart Rate, Respiratory Rate, Temp, SpO2, Weight, Height
        ↓
[Consultation Room - Unit: OPD]
   6. Physician Encounter Start (gnuhealth.patient.evaluation) -> State: 'in_progress'
   7. Subjective History, Chief Complaint, and Physical Examination Recording
   8. WHO ICD-10 Pathology Coding (gnuhealth.pathology)
   9. Diagnostic Requisitions (gnuhealth.lab / gnuhealth.imaging.test.request)
  10. Electronic Prescription Issuance (gnuhealth.prescription.order)
      - Pregnancy & Allergy Safety Confirmation (SM-CORE-0018)
  11. Consultation Closure & Physician Sign-Off -> State: 'signed' (Immutable)
        ↓
[Discharge & Settlement]
  12. Appointment Status Advanced to 'done'
  13. Billing Invoicing in QAR & Medication Dispensing
```

- **Working Steps**: Steps 1 through 12 verified via Tryton ORM.
- **Missing / Pending**: Step 13 (Invoice posting blocked until fiscal year is opened; medicines catalog pending).

---

### Workflow B: Existing Patient Follow-Up

```text
1. Search Patient by PUID, Mobile Number, or Civil ID (party.party / gnuhealth.patient)
2. Retrieve Patient History, Past Allergies, and Chronic Conditions
3. Book Follow-Up Slot (gnuhealth.appointment) -> Link to Previous Evaluation
4. Triage / Vital Signs Update (gnuhealth.patient.evaluation)
5. Attending Doctor Review -> Treatment Plan Adjustment
6. Follow-up Encounter Completion -> State: 'signed'
```

- **Working Steps**: Complete native GNU Health support verified.
- **Dependencies**: Real patient history accumulates during live clinic service.

---

### Workflow C: Diagnostic Laboratory Requisition & Results

```text
1. Doctor creates Lab Order during Consultation (gnuhealth.lab)
2. Specimen Collection in Laboratory Unit (LAB)
   - Sample Type, Barcode/Tube Labeling, Phlebotomy Timestamp
3. Specimen Processing & Pathology Analysis
4. Technician Enters Result Values against Reference Ranges
5. Pathologist / Lab Director Diagnostic Approval -> State: 'done'
6. Attending Physician Reviews Verified Lab Results in Patient History
7. Lab Service Billed to Patient / Insurance (health_services_lab)
```

- **Working Steps**: Requisition creation, test tracking, result capture verified.
- **External Dependencies**: Results entered via SAO web client; no direct automated analyzer integration currently connected.

---

### Workflow D: Diagnostic Radiology Requisition & Reporting

```text
1. Doctor creates Diagnostic Imaging Request (gnuhealth.imaging.test.request)
   - Modality (X-Ray, Ultrasound, etc.), Clinical Indication
2. Patient arrives at Radiology Department (RAD)
3. Radiographer Performs Examination -> Procedure Completed
4. Radiologist Reviews Image -> Dictates / Enters Diagnostic Findings
5. Radiology Report Signed & Released -> State: 'done'
6. Doctor Accesses Radiology Report in Encounter Record
7. Radiology Fee Billed in QAR
```

- **Working Steps**: Study request, status tracking, and reporting verified (Chest X-Ray test ID 1).
- **External Dependencies**: Images viewed on local radiologist workstation; no cloud PACS/DICOM server connected.

---

### Workflow E: Pharmacy e-Prescribing & Outpatient Dispensing

```text
1. Doctor selects Medicament from Formulary (gnuhealth.medicament)
2. Dose, Form, Administration Route, Frequency, and Duration Specified
3. GNU Health Safety Engine Checks:
   - SM-CORE-0018: Prescription safety acknowledgement
   - Patient allergy contraindications & pregnancy risk
4. Prescription Released in System (gnuhealth.prescription.order) -> State: 'draft' / 'done'
5. Patient Presents at Clinic Pharmacy (PHARM)
6. Pharmacist Verifies Order & Issues Medication
7. Prescription Status Updated to Dispensed
```

- **Working Steps**: E-prescription numbering, safety checks, and dosage models verified.
- **Missing / Pending**: Real commercial drugs in `gnuhealth.medicament` (pending Qatar National Formulary input).

---

### Workflow F: Health Insurance Authorization & Copay Settlement

```text
1. Reception Verifies Patient Insurance Policy & Member ID (gnuhealth.insurance)
2. System Identifies Covered Services & Patient Copay Percentage (e.g. 80/20)
3. Consultation / Diagnostic Services Provided
4. Service Lines Aggregated into Patient Invoice (account.invoice)
5. Patient Pays Copay (20%) at Cashier in QAR -> Cash / Card Receipt
6. Remaining Balance (80%) Billed to Insurance Payer / TPA Account
7. Insurance Claim Statement Generated for Payer Batch Submission
```

- **Working Steps**: Insurance policy data model and copay structure supported natively.
- **Missing / Pending**: Contracted Qatar payer names (`PENDING_CLINIC_INPUT`); fiscal year activation (`PENDING_ACCOUNTING_APPROVAL`).
