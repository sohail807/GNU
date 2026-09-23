# GNU Health HMIS — Frontend Handover & Integration Checklist
## Engineering Deliverables, Integration Verification & Readiness Checklist

**Document Reference:** `GH-FE-CHECKLIST-007`  
**System Target:** GNU Health HMIS 5.0.6 / Tryton Framework 7.0.57  
**Status:** Uncompleted Action Checklist for Upcoming Frontend Phase  
**Audience:** Frontend Lead Engineers, Scrum Masters, Project Managers

*Important Notice: In accordance with project audit standards, all checkboxes below remain unchecked (`[ ]`) to represent the exact scope of work awaiting execution by the frontend development team.*

---

## 1. Frontend Architecture & API Communication Layer
- [ ] Centralized JSON-RPC 2.0 API service client configured targeting `/gnuhealth/`.
- [ ] Request timeout handling and retry policies established.
- [ ] Context header management implemented (company ID, language).
- [ ] HTTP Authorization header injection mechanism implemented (`Session <token>`).
- [ ] Zero database client libraries (`pg`, `psycopg2`, `prisma`, etc.) present in frontend code.
- [ ] Environment variables configured for API host URL without hardcoded secrets.

## 2. Authentication & Session Management
- [ ] Login screen implemented capturing username and password.
- [ ] `common.db.login` authentication handshake wired to state management.
- [ ] Base64 session token encoding routine implemented.
- [ ] Session token stored securely in reactive memory (no plaintext localStorage persistence).
- [ ] Session expiration interceptor implemented to detect 401 Unauthorized responses.
- [ ] Graceful re-authentication modal implemented preserving unsaved form state.
- [ ] Logout functionality implemented calling `common.db.logout` and clearing client state.

## 3. Patient Demographics & Registration
- [ ] Patient search interface implemented using `model.gnuhealth.patient.search_read`.
- [ ] Live search autocomplete wired to party name and medical record number (PUID).
- [ ] Patient registration form built with mandatory demographic fields (Name, Gender, DoB, QID).
- [ ] Two-step creation workflow implemented (`party.party` followed by `gnuhealth.patient`).
- [ ] Handling of duplicate QID constraint errors (`SQLConstraintError`) implemented.
- [ ] Display of system-generated permanent PUID confirmed in patient banner.

## 4. Outpatient Appointments & Queue Check-In
- [ ] Calendar and schedule view implemented for available clinic appointment slots.
- [ ] Appointment booking form built linking patient, attending doctor, and specialty.
- [ ] Status badge component implemented reflecting appointment state machine.
- [ ] Patient check-in action button wired to transition state from `confirmed` to `checked_in`.
- [ ] Front Desk daily queue dashboard implemented filtering checked-in visits.

## 5. Nursing Triage & Anthropometric Vitals
- [ ] Triage entry interface implemented targeting `gnuhealth.patient.evaluation`.
- [ ] Vital signs form fields validated:
  - [ ] Systolic & Diastolic Blood Pressure (mmHg)
  - [ ] Heart Rate (bpm)
  - [ ] Body Temperature (°C)
  - [ ] Respiratory Rate (bpm)
  - [ ] Oxygen Saturation (SpO2 %)
  - [ ] Weight (kg) & Height (cm)
- [ ] Automatic client-side Body Mass Index (BMI) calculation for instant feedback.
- [ ] Triage evaluation save action confirmed attaching vitals to patient file.

## 6. Physician Clinical Consultations & Diagnoses
- [ ] Clinician SOAP documentation workspace implemented:
  - [ ] Chief Complaint (mandatory string)
  - [ ] Subjective (History of Present Illness)
  - [ ] Objective (Physical Examination findings)
  - [ ] Assessment (Diagnostic reasoning)
  - [ ] Plan (Therapeutic directions)
- [ ] Searchable ICD-10 pathology dropdown wired to `gnuhealth.pathology`.
- [ ] Digital sign-off action button wired to `end_evaluation` workflow method.
- [ ] UI lock enforcement: Signed evaluation forms rendered strictly read-only.

## 7. Electronic Prescribing & Medication Management
- [ ] Electronic prescription interface implemented (`gnuhealth.prescription.order`).
- [ ] Medication catalog search wired to approved clinic formulary (`gnuhealth.medicament`).
- [ ] Mandatory prescription line attributes validated:
  - [ ] Dose strength & dose unit (e.g. 500 mg)
  - [ ] Drug formulation & administration route (e.g. Oral Capsule)
  - [ ] Frequency (times per day)
  - [ ] Duration & duration period (e.g. 5 days)
  - [ ] Total quantity dispensed
- [ ] Mandatory clinician drug safety warning acknowledgement checkbox implemented.
- [ ] Prescription validation action wired to `create_prescription`.

## 8. Diagnostic Laboratory Orders & Results
- [ ] Laboratory test order interface implemented (`gnuhealth.lab`).
- [ ] Diagnostic test type selector wired to pathology catalog (e.g. CBC).
- [ ] Analyte criteria expansion trigger wired to `complete_criteareas`.
- [ ] Results entry grid implemented displaying analyte names, reference ranges, and units.
- [ ] Document generation and sign-off action wired to `generate_document`.

## 9. Medical Imaging (Radiology) Requisitions & Reports
- [ ] Imaging request interface implemented (`gnuhealth.imaging.test.request`).
- [ ] Study selector wired to imaging catalog (e.g. Chest X-Ray PA View).
- [ ] Request workflow action wired to `requested`.
- [ ] Radiologist narrative findings and impression reporting form implemented.
- [ ] Results generation action wired to `generate_results`.

## 10. Health Services & Billing Compilation
- [ ] Health services bundle interface implemented (`gnuhealth.health_service`).
- [ ] Automatic aggregation of doctor consultation fees and diagnostic procedure lines.
- [ ] Verification that billable items flag `to_invoice = True`.

## 11. Patient Invoicing & Cashier Payments
- [ ] Customer invoice form implemented (`account.invoice`).
- [ ] Line item tariff display showing service description, quantity, and unit price (QAR).
- [ ] Fiscal invoice posting action wired to `model.account.invoice.post`.
- [ ] UI lock enforcement: Posted invoices locked against line addition or modification.
- [ ] Cashier settlement wizard interface implemented (`account.invoice.pay`).
- [ ] Payment method selection wired to `Cash Payment (QAR)`.
- [ ] Invoice state transition to `Paid` verified and reflected in billing badge.

## 12. Read-Only Accounting & Ledger Views
- [ ] Read-only General Ledger move viewer implemented (`account.move`).
- [ ] Display of balanced Debit and Credit lines for audit trail visibility.
- [ ] Patient outstanding balance widget displaying Accounts Receivable status.

## 13. Role-Based Access Control (RBAC) UI Hiding
- [ ] Role context provider implemented reading user groups on login.
- [ ] Front Desk view configured: Prescriptions and Clinical Evaluations hidden.
- [ ] Nurse view configured: Invoicing, Cashier, and Prescriptions hidden.
- [ ] Physician view configured: General Ledger Move administration hidden.
- [ ] Cashier view configured: Clinical consultation and evaluation editing hidden.
- [ ] Laboratory and Radiology views configured: Restricted to diagnostic domains.

## 14. Error Interception & User Notification UX
- [ ] Global error handler implemented intercepting Tryton JSON-RPC exceptions.
- [ ] `AccessError` translated into informative "Access Denied" user notification.
- [ ] `UserError` presented in clear modal or inline form error alerts.
- [ ] `SQLConstraintError` mapped to friendly duplicate record guidance.
- [ ] Network failure and connection timeout handling with retry button.

## 15. Security & Production Deployment Validation
- [ ] Codebase audited to ensure zero hardcoded administrative credentials.
- [ ] Client bundle inspected to ensure no private keys or internal tokens are bundled.
- [ ] Production build configured strictly over HTTPS / TLS 1.3.
- [ ] Cross-browser testing completed across desktop, tablet, and mobile browsers.

## 16. User Acceptance Testing (UAT) Signoff
- [ ] Front Desk operational workflow UAT completed.
- [ ] Nursing triage operational workflow UAT completed.
- [ ] Physician consultation and e-prescribing UAT completed.
- [ ] Diagnostic laboratory and radiology UAT completed.
- [ ] Cashier billing and cash settlement UAT completed.
- [ ] Formal business signoff achieved for frontend release.
