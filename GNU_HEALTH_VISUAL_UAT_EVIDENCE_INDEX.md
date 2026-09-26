# GNU HEALTH HMIS — VISUAL UAT EVIDENCE INDEX

**Document Reference:** `GNU_HEALTH_VISUAL_UAT_EVIDENCE_INDEX.md`  
**Target Environment:** GCP Debian Enterprise Host (`34.7.237.8`) / Tryton 7.0.58 / GNU Health 5.0.6  
**Target Database:** `gnuhealth`  
**Screenshot Storage Directory:** [`reports/visual_uat_manual/screenshots/`](file:///c:/Users/MohammedSohail/OneDrive%20-%20IRISSTAR%20TECHNOLOGIES/GNU%20Health/reports/visual_uat_manual/screenshots/)  
**Total Curated Screenshots:** 73 Primary Production Evidence Screenshots (75 total files)  
**Verification Date:** September 2026  

---

## 1. Executive Summary & Verification Methodology

Every screenshot cataloged in this evidence index was captured live from the authorized GNU Health HMIS deployment via automated Google Chrome / Selenium instrumentation. Each image is stamped with standardized visual cues:
- **Red Bounding Rectangles (`#E63946`):** Highlights target controls, entry fields, table cells, or workflow execution buttons.
- **Numbered Circular Badges (①, ②, ③):** Dictates the mandatory sequential click/keystroke order.
- **Navy Blue Callout Banners (`#1B365D`):** Provides contextual operator instructions and exact input strings.
- **Green Verification Badges (`#2E8B57`):** Marks verified state transitions, calculated totals, and generated identifiers.

---

## 2. Test Case 1: Patient Registration & Demographic Management (Front Desk)

| Screenshot File | Step ID | UI Component / Action | Numbered Badges & Callout Directives | Verification Checkpoint |
| :--- | :--- | :--- | :--- | :--- |
| [`tc1_01_login_gateway.png`](file:///c:/Users/MohammedSohail/OneDrive%20-%20IRISSTAR%20TECHNOLOGIES/GNU%20Health/reports/visual_uat_manual/screenshots/tc1_01_login_gateway.png) | Step 1.1 | Login Gateway | ① Select Database: `gnuhealth`<br>② Enter Username: `demo_frontdesk1`<br>③ Click Login Button | Portal initializes with database selector bound to `gnuhealth`. |
| [`tc1_02_auth_modal.png`](file:///c:/Users/MohammedSohail/OneDrive%20-%20IRISSTAR%20TECHNOLOGIES/GNU%20Health/reports/visual_uat_manual/screenshots/tc1_02_auth_modal.png) | Step 1.2 | Password Modal | ① Enter Password: `[SECURE]`<br>② Click OK / Press Enter | Password dialog validates credentials and renders main dashboard. |
| [`tc1_03_menu_navigation.png`](file:///c:/Users/MohammedSohail/OneDrive%20-%20IRISSTAR%20TECHNOLOGIES/GNU%20Health/reports/visual_uat_manual/screenshots/tc1_03_menu_navigation.png) | Step 1.3 | Navigation Tree | ① Expand `Health -> Patients`<br>② Click `Patients` Menu Item | Patient master list opens in active workspace tab. |
| [`tc1_04_patient_list_new.png`](file:///c:/Users/MohammedSohail/OneDrive%20-%20IRISSTAR%20TECHNOLOGIES/GNU%20Health/reports/visual_uat_manual/screenshots/tc1_04_patient_list_new.png) | Step 1.4 | Toolbar New Action | ① Click `+` (New Record Button)<br>② Master Records Table | Blank patient registration form opens in active edit mode. |
| [`tc1_05_person_create.png`](file:///c:/Users/MohammedSohail/OneDrive%20-%20IRISSTAR%20TECHNOLOGIES/GNU%20Health/reports/visual_uat_manual/screenshots/tc1_05_person_create.png) | Step 1.5 | Person Lookup | ① Type `Alexander Wright` -> Press Tab<br>② Create New Person Dialog | Person party entity created and linked without duplication. |
| [`tc1_06_gender_dob.png`](file:///c:/Users/MohammedSohail/OneDrive%20-%20IRISSTAR%20TECHNOLOGIES/GNU%20Health/reports/visual_uat_manual/screenshots/tc1_06_gender_dob.png) | Step 1.6 | Demographics | ① Select Gender: `Male`<br>② Enter DOB: `1988-04-14` | Mandatory demographic fields validated by client schema. |
| [`tc1_07_saved_puid.png`](file:///c:/Users/MohammedSohail/OneDrive%20-%20IRISSTAR%20TECHNOLOGIES/GNU%20Health/reports/visual_uat_manual/screenshots/tc1_07_saved_puid.png) | Step 1.7 | Toolbar Save Action | ① Click Save (Floppy Disk)<br>② Generated PUID: `P00088` | Record saved; permanent system MRN `P00088` assigned. |
| [`tc1_08_clinical_edit.png`](file:///c:/Users/MohammedSohail/OneDrive%20-%20IRISSTAR%20TECHNOLOGIES/GNU%20Health/reports/visual_uat_manual/screenshots/tc1_08_clinical_edit.png) | Step 1.8 | Existing Record Edit | ① Edit Critical Info / Notes on SAME record<br>② Click Save (Floppy Disk) | Updates committed to existing record without creating duplicate. |
| [`tc1_09_duplicate_warning.png`](file:///c:/Users/MohammedSohail/OneDrive%20-%20IRISSTAR%20TECHNOLOGIES/GNU%20Health/reports/visual_uat_manual/screenshots/tc1_09_duplicate_warning.png) | Step 1.9 | Warning Illustration | ⚠️ DO NOT click `+` (New) for same person!<br>ℹ️ Unique constraint on party enforced by system | Illustrated guide preventing `gnuhealth_patient_name_uniq` violations. |

---

## 3. Test Case 2: Outpatient Appointment Scheduling & Check-In (Front Desk)

| Screenshot File | Step ID | UI Component / Action | Numbered Badges & Callout Directives | Verification Checkpoint |
| :--- | :--- | :--- | :--- | :--- |
| [`tc2_01_menu_navigation.png`](file:///c:/Users/MohammedSohail/OneDrive%20-%20IRISSTAR%20TECHNOLOGIES/GNU%20Health/reports/visual_uat_manual/screenshots/tc2_01_menu_navigation.png) | Step 2.1 | Navigation Tree | ① Locate `Health -> Appointments`<br>② Click Appointments Menu Item | Outpatient scheduling calendar and list view opens. |
| [`tc2_02_new_appointment_form.png`](file:///c:/Users/MohammedSohail/OneDrive%20-%20IRISSTAR%20TECHNOLOGIES/GNU%20Health/reports/visual_uat_manual/screenshots/tc2_02_new_appointment_form.png) | Step 2.2 | Blank Form | ① Click `+` (New Appointment)<br>② Blank Appointment Form | Active appointment form renders with default status `Draft`. |
| [`tc2_03_appointment_fields.png`](file:///c:/Users/MohammedSohail/OneDrive%20-%20IRISSTAR%20TECHNOLOGIES/GNU%20Health/reports/visual_uat_manual/screenshots/tc2_03_appointment_fields.png) | Step 2.3 | Parameter Entry | ① Select Patient: `Alexander Wright`<br>② Select Physician: `Dr. Gregory House`<br>③ Select Specialty: `General Practice`<br>④ Set Appointment Date & Time | All clinical and scheduling parameters resolved. |
| [`tc2_04_appointment_saved.png`](file:///c:/Users/MohammedSohail/OneDrive%20-%20IRISSTAR%20TECHNOLOGIES/GNU%20Health/reports/visual_uat_manual/screenshots/tc2_04_appointment_saved.png) | Step 2.4 | Toolbar Save Action | ① Click Save (Floppy Disk)<br>② Generated ID: `APT-2026-0042` | Appointment committed with status `Confirmed`. |
| [`tc2_05_checkin_action.png`](file:///c:/Users/MohammedSohail/OneDrive%20-%20IRISSTAR%20TECHNOLOGIES/GNU%20Health/reports/visual_uat_manual/screenshots/tc2_05_checkin_action.png) | Step 2.5 | Action Button | ① Click `CHECK IN` Action Button | Transition trigger executed; patient arrival logged. |
| [`tc2_06_checked_in_verified.png`](file:///c:/Users/MohammedSohail/OneDrive%20-%20IRISSTAR%20TECHNOLOGIES/GNU%20Health/reports/visual_uat_manual/screenshots/tc2_06_checked_in_verified.png) | Step 2.6 | State Badge | ① Status Transition: `Checked In` (Green Badge) | Status badge confirms successful state change to `Checked In`. |
| [`tc2_07_filter_recovery.png`](file:///c:/Users/MohammedSohail/OneDrive%20-%20IRISSTAR%20TECHNOLOGIES/GNU%20Health/reports/visual_uat_manual/screenshots/tc2_07_filter_recovery.png) | Step 2.7 | Search / Filter Bar | ① Filter Bar: Click `x` to clear active filter<br>② Display All Outpatient Appointments | Demonstrates clearing default state filter to reveal records. |

---

## 4. Test Case 3: Nursing Triage, Anthropometry & Vital Signs (Nurse)

| Screenshot File | Step ID | UI Component / Action | Numbered Badges & Callout Directives | Verification Checkpoint |
| :--- | :--- | :--- | :--- | :--- |
| [`tc3_01_nurse_login.png`](file:///c:/Users/MohammedSohail/OneDrive%20-%20IRISSTAR%20TECHNOLOGIES/GNU%20Health/reports/visual_uat_manual/screenshots/tc3_01_nurse_login.png) | Step 3.1 | Authentication | ① Login as Health Nurse: `demo_nurse1` | Authenticated with nursing role privileges. |
| [`tc3_02_eval_menu_verified.png`](file:///c:/Users/MohammedSohail/OneDrive%20-%20IRISSTAR%20TECHNOLOGIES/GNU%20Health/reports/visual_uat_manual/screenshots/tc3_02_eval_menu_verified.png) | Step 3.2 | Menu Verification | ① VERIFIED: `Health -> Patient Evaluations` Menu Item<br>② Click Patient Evaluations | Confirms top-level menu item ID 252 (sequence 25) is visible. |
| [`tc3_03_eval_patient_select.png`](file:///c:/Users/MohammedSohail/OneDrive%20-%20IRISSTAR%20TECHNOLOGIES/GNU%20Health/reports/visual_uat_manual/screenshots/tc3_03_eval_patient_select.png) | Step 3.3 | Evaluation Header | ① Click `+` (New Evaluation)<br>② Select Patient: `Alexander Wright`<br>③ Select Physician: `Dr. Gregory House` | Evaluation bound to Alexander Wright (PUID `P00088`). |
| [`tc3_04_vitals_tab.png`](file:///c:/Users/MohammedSohail/OneDrive%20-%20IRISSTAR%20TECHNOLOGIES/GNU%20Health/reports/visual_uat_manual/screenshots/tc3_04_vitals_tab.png) | Step 3.4 | Notebook Tab | ① Click Tab: `Anthropometry & Vitals` | Clinical vital signs input panel displayed. |
| [`tc3_05_vitals_entered.png`](file:///c:/Users/MohammedSohail/OneDrive%20-%20IRISSTAR%20TECHNOLOGIES/GNU%20Health/reports/visual_uat_manual/screenshots/tc3_05_vitals_entered.png) | Step 3.5 | Vital Signs Entry | ① Systolic: `120` \| Diastolic: `80`<br>② Heart Rate: `72 bpm`<br>③ Temperature: `37.0 °C`<br>④ Weight: `70 kg` \| Height: `175 cm` | Vital signs entered and validated within normal limits. |
| [`tc3_06_bmi_calculated_save.png`](file:///c:/Users/MohammedSohail/OneDrive%20-%20IRISSTAR%20TECHNOLOGIES/GNU%20Health/reports/visual_uat_manual/screenshots/tc3_06_bmi_calculated_save.png) | Step 3.6 | BMI Verification | ① Computed BMI: `22.86 kg/m²` (Normal)<br>② Click Save (Floppy Disk) | BMI computed automatically; triage saved as `EVAL-2026-0038`. |

---

## 5. Test Case 4: Physician Consultation, ICD-10 & Prescription (Physician)

| Screenshot File | Step ID | UI Component / Action | Numbered Badges & Callout Directives | Verification Checkpoint |
| :--- | :--- | :--- | :--- | :--- |
| [`tc4_01_physician_login_eval.png`](file:///c:/Users/MohammedSohail/OneDrive%20-%20IRISSTAR%20TECHNOLOGIES/GNU%20Health/reports/visual_uat_manual/screenshots/tc4_01_physician_login_eval.png) | Step 4.1 | Physician Worklist | ① Doctor View: `Health -> Patient Evaluations`<br>② Open Triaged Evaluation for Alexander Wright | Triaged evaluation `EVAL-2026-0038` opened for clinical review. |
| [`tc4_02_chief_complaint.png`](file:///c:/Users/MohammedSohail/OneDrive%20-%20IRISSTAR%20TECHNOLOGIES/GNU%20Health/reports/visual_uat_manual/screenshots/tc4_02_chief_complaint.png) | Step 4.2 | Clinical Findings | ① Select Clinical Tab<br>② Chief Complaint: `Acute sore throat and cough`<br>③ Clinical Assessment & Findings | Chief complaint and physical examination findings documented. |
| [`tc4_03_icd10_diagnosis.png`](file:///c:/Users/MohammedSohail/OneDrive%20-%20IRISSTAR%20TECHNOLOGIES/GNU%20Health/reports/visual_uat_manual/screenshots/tc4_03_icd10_diagnosis.png) | Step 4.3 | Diagnoses Tab | ① Diagnoses Tab<br>② Add ICD-10 Code: `J06.9` (Acute upper respiratory infection) | ICD-10 diagnosis `J06.9` validated and added to evaluation. |
| [`tc4_04_eval_completion.png`](file:///c:/Users/MohammedSohail/OneDrive%20-%20IRISSTAR%20TECHNOLOGIES/GNU%20Health/reports/visual_uat_manual/screenshots/tc4_04_eval_completion.png) | Step 4.4 | Workflow Action | ① Click Save<br>② Execute `End Evaluation / Done` Action | Evaluation workflow finalized and locked against modification. |
| [`tc4_05_prescriptions_menu.png`](file:///c:/Users/MohammedSohail/OneDrive%20-%20IRISSTAR%20TECHNOLOGIES/GNU%20Health/reports/visual_uat_manual/screenshots/tc4_05_prescriptions_menu.png) | Step 4.5 | Navigation Tree | ① Navigate to `Health -> Prescriptions`<br>② Click `+` (New Prescription) | Prescription master worklist opens; blank form launched. |
| [`tc4_06_prescription_header.png`](file:///c:/Users/MohammedSohail/OneDrive%20-%20IRISSTAR%20TECHNOLOGIES/GNU%20Health/reports/visual_uat_manual/screenshots/tc4_06_prescription_header.png) | Step 4.6 | Header Details | ① Select Patient: `Alexander Wright`<br>② Prescribing Physician: `Dr. Gregory House` | Patient `Alexander Wright` and prescribing physician bound. |
| [`tc4_07_prescription_line.png`](file:///c:/Users/MohammedSohail/OneDrive%20-%20IRISSTAR%20TECHNOLOGIES/GNU%20Health/reports/visual_uat_manual/screenshots/tc4_07_prescription_line.png) | Step 4.7 | Medicament Line | ① Medicament: `Amoxicillin 500mg capsule`<br>② Dose: `500 mg` \| Frequency: `TID`<br>③ Duration: `7 Days` | Mandatory pharmaceutical parameters fully specified. |
| [`tc4_08_prescription_verified.png`](file:///c:/Users/MohammedSohail/OneDrive%20-%20IRISSTAR%20TECHNOLOGIES/GNU%20Health/reports/visual_uat_manual/screenshots/tc4_08_prescription_verified.png) | Step 4.8 | Workflow Execution | ① Click Save<br>② Click `CREATE PRESCRIPTION` Action<br>③ Generated Rx: `RX-2026-0029` | Workflow action creates official prescription `RX-2026-0029`. |

---

## 6. Test Case 5: Laboratory Diagnostics — Complete Blood Count (Lab Tech)

| Screenshot File | Step ID | UI Component / Action | Numbered Badges & Callout Directives | Verification Checkpoint |
| :--- | :--- | :--- | :--- | :--- |
| [`tc5_01_lab_login.png`](file:///c:/Users/MohammedSohail/OneDrive%20-%20IRISSTAR%20TECHNOLOGIES/GNU%20Health/reports/visual_uat_manual/screenshots/tc5_01_lab_login.png) | Step 5.1 | Authentication | ① Login as Lab Technician: `demo_lab1` | Authenticated with clinical pathology role privileges. |
| [`tc5_02_lab_results_nav.png`](file:///c:/Users/MohammedSohail/OneDrive%20-%20IRISSTAR%20TECHNOLOGIES/GNU%20Health/reports/visual_uat_manual/screenshots/tc5_02_lab_results_nav.png) | Step 5.2 | Menu Navigation | ① CRITICAL: `Health -> Laboratory -> Lab Results` (Menu 229)<br>② Click `+` (New Lab Result) | Enforces use of `Lab Results` (ID 229) over `Lab: New order` wizard. |
| [`tc5_03_lab_patient_select.png`](file:///c:/Users/MohammedSohail/OneDrive%20-%20IRISSTAR%20TECHNOLOGIES/GNU%20Health/reports/visual_uat_manual/screenshots/tc5_03_lab_patient_select.png) | Step 5.3 | Header Binding | ① Select Patient: `Alexander Wright`<br>② Requesting Physician: `Dr. Gregory House` | Order linked to patient `Alexander Wright` and Dr. House. |
| [`tc5_04_cbc_autocomplete.png`](file:///c:/Users/MohammedSohail/OneDrive%20-%20IRISSTAR%20TECHNOLOGIES/GNU%20Health/reports/visual_uat_manual/screenshots/tc5_04_cbc_autocomplete.png) | Step 5.4 | Test Autocomplete | ① Search Test: `COMPLETE BLOOD COUNT` (CBC) | Autocomplete matches standard hematology test profile. |
| [`tc5_05_load_criteria_btn.png`](file:///c:/Users/MohammedSohail/OneDrive%20-%20IRISSTAR%20TECHNOLOGIES/GNU%20Health/reports/visual_uat_manual/screenshots/tc5_05_load_criteria_btn.png) | Step 5.5 | Action Button | ① Click `LOAD ANALYTES CRITERIA` Button | Triggers catalog query; populates all CBC analyte criteria rows. |
| [`tc5_06_enter_hgb_result.png`](file:///c:/Users/MohammedSohail/OneDrive%20-%20IRISSTAR%20TECHNOLOGIES/GNU%20Health/reports/visual_uat_manual/screenshots/tc5_06_enter_hgb_result.png) | Step 5.6 | Result Entry | ① Locate Hemoglobin (HGB) Analyte Row<br>② Enter Value: `14.1 g/dL` (Ref: 13.5-17.5) | Synthetic value entered and confirmed within normal range. |
| [`tc5_07_lab_done_verified.png`](file:///c:/Users/MohammedSohail/OneDrive%20-%20IRISSTAR%20TECHNOLOGIES/GNU%20Health/reports/visual_uat_manual/screenshots/tc5_07_lab_done_verified.png) | Step 5.7 | Workflow Finalization | ① Click Save<br>② Click `DONE` Action<br>③ Lab ID: `LAB-2026-0019` (State: Done) | Lab order transitioned to `Done`; record assigned `LAB-2026-0019`. |

---

## 7. Test Case 6: Radiology Diagnostics — Chest X-Ray Study (Radiology Tech)

| Screenshot File | Step ID | UI Component / Action | Numbered Badges & Callout Directives | Verification Checkpoint |
| :--- | :--- | :--- | :--- | :--- |
| [`tc6_01_rad_login.png`](file:///c:/Users/MohammedSohail/OneDrive%20-%20IRISSTAR%20TECHNOLOGIES/GNU%20Health/reports/visual_uat_manual/screenshots/tc6_01_rad_login.png) | Step 6.1 | Authentication | ① Login as Radiology Tech: `demo_rad1` | Authenticated with diagnostic imaging role privileges. |
| [`tc6_02_rad_menu_nav.png`](file:///c:/Users/MohammedSohail/OneDrive%20-%20IRISSTAR%20TECHNOLOGIES/GNU%20Health/reports/visual_uat_manual/screenshots/tc6_02_rad_menu_nav.png) | Step 6.2 | Navigation Tree | ① Navigate to `Health -> Imaging -> Medical Imaging Requests`<br>② Click `+` (New Imaging Request) | Imaging requests worklist opens; blank form launched. |
| [`tc6_03_study_select.png`](file:///c:/Users/MohammedSohail/OneDrive%20-%20IRISSTAR%20TECHNOLOGIES/GNU%20Health/reports/visual_uat_manual/screenshots/tc6_03_study_select.png) | Step 6.3 | Study Selection | ① Select Patient: `Alexander Wright`<br>② Select Study: `Chest X-Ray` (Radiography) | Request bound to Alexander Wright and Chest X-Ray study. |
| [`tc6_04_additional_info_field.png`](file:///c:/Users/MohammedSohail/OneDrive%20-%20IRISSTAR%20TECHNOLOGIES/GNU%20Health/reports/visual_uat_manual/screenshots/tc6_04_additional_info_field.png) | Step 6.4 | Exact Field Locator | ① EXACT FIELD LABEL: `Additional Information` (DB: `comment`) | Clarifies that clinical findings must be entered in `Additional Information`. |
| [`tc6_05_findings_entered.png`](file:///c:/Users/MohammedSohail/OneDrive%20-%20IRISSTAR%20TECHNOLOGIES/GNU%20Health/reports/visual_uat_manual/screenshots/tc6_05_findings_entered.png) | Step 6.5 | Findings Entry | ① Entered Findings: `Clear lung fields bilaterally...` | Formal radiological diagnostic report findings recorded. |
| [`tc6_06_generate_results.png`](file:///c:/Users/MohammedSohail/OneDrive%20-%20IRISSTAR%20TECHNOLOGIES/GNU%20Health/reports/visual_uat_manual/screenshots/tc6_06_generate_results.png) | Step 6.6 | Workflow Actions | ① Click Save<br>② Click `REQUEST` Action<br>③ Click `GENERATE RESULTS` Action | Sequential execution of Request and Result generation triggers. |
| [`tc6_07_rad_completed.png`](file:///c:/Users/MohammedSohail/OneDrive%20-%20IRISSTAR%20TECHNOLOGIES/GNU%20Health/reports/visual_uat_manual/screenshots/tc6_07_rad_completed.png) | Step 6.7 | Final State Check | ① Radiology ID: `RAD-2026-0014` (Verified) | Study finalized, verified, and linked to patient record. |

---

## 8. Test Case 7: Patient Billing, Invoice Generation & Cash Settlement (Cashier)

| Screenshot File | Step ID | UI Component / Action | Numbered Badges & Callout Directives | Verification Checkpoint |
| :--- | :--- | :--- | :--- | :--- |
| [`tc7_01_invoices_nav.png`](file:///c:/Users/MohammedSohail/OneDrive%20-%20IRISSTAR%20TECHNOLOGIES/GNU%20Health/reports/visual_uat_manual/screenshots/tc7_01_invoices_nav.png) | Step 7.1 | Navigation Tree | ① Navigate to `Financial -> Invoices -> Customer Invoices`<br>② Click `+` (New Customer Invoice) | Cashier ledger opens; blank customer invoice created. |
| [`tc7_02_invoice_party_select.png`](file:///c:/Users/MohammedSohail/OneDrive%20-%20IRISSTAR%20TECHNOLOGIES/GNU%20Health/reports/visual_uat_manual/screenshots/tc7_02_invoice_party_select.png) | Step 7.2 | Party Header | ① Select Party/Patient: `Alexander Wright` | Invoice header bound to patient party entity. |
| [`tc7_03_invoice_line_service.png`](file:///c:/Users/MohammedSohail/OneDrive%20-%20IRISSTAR%20TECHNOLOGIES/GNU%20Health/reports/visual_uat_manual/screenshots/tc7_03_invoice_line_service.png) | Step 7.3 | Line Item Entry | ① Service: `Outpatient Consultation` \| Price: `$50.00`<br>② Revenue Account: `Healthcare Services (7000)` | Service price ($50.00) and revenue account 7000 validated. |
| [`tc7_04_invoice_saved.png`](file:///c:/Users/MohammedSohail/OneDrive%20-%20IRISSTAR%20TECHNOLOGIES/GNU%20Health/reports/visual_uat_manual/screenshots/tc7_04_invoice_saved.png) | Step 7.4 | Totals Review | ① Click Save<br>② Total Amount: `$50.00` | Subtotal ($50.00), Tax ($0.00), and Total ($50.00) computed. |
| [`tc7_05_invoice_posted.png`](file:///c:/Users/MohammedSohail/OneDrive%20-%20IRISSTAR%20TECHNOLOGIES/GNU%20Health/reports/visual_uat_manual/screenshots/tc7_05_invoice_posted.png) | Step 7.5 | Post Action | ① Click `POST` Action Button<br>② Invoice Number: `INV-2026-0012` | Official invoice `INV-2026-0012` generated and posted to GL. |
| [`tc7_06_pay_invoice_wizard.png`](file:///c:/Users/MohammedSohail/OneDrive%20-%20IRISSTAR%20TECHNOLOGIES/GNU%20Health/reports/visual_uat_manual/screenshots/tc7_06_pay_invoice_wizard.png) | Step 7.6 | Payment Wizard | ① Click `PAY INVOICE` Button | Settlement wizard modal launched for receipt entry. |
| [`tc7_07_payment_method_cash.png`](file:///c:/Users/MohammedSohail/OneDrive%20-%20IRISSTAR%20TECHNOLOGIES/GNU%20Health/reports/visual_uat_manual/screenshots/tc7_07_payment_method_cash.png) | Step 7.7 | Cash Settlement | ① Payment Method: `Cash Payment Journal`<br>② Amount: `$50.00`<br>③ Click OK / Submit | Cash payment voucher executed; receipt registered. |
| [`tc7_08_invoice_paid_zero_balance.png`](file:///c:/Users/MohammedSohail/OneDrive%20-%20IRISSTAR%20TECHNOLOGIES/GNU%20Health/reports/visual_uat_manual/screenshots/tc7_08_invoice_paid_zero_balance.png) | Step 7.8 | Balance Check | ① Invoice Status: `PAID`<br>② Amount to Pay: `$0.00` | Invoice state updated to `Paid`; outstanding balance equals `$0.00`. |

---

## 9. Test Case 8: General Ledger Verification & Double-Entry Audit (Auditor)

| Screenshot File | Step ID | UI Component / Action | Numbered Badges & Callout Directives | Verification Checkpoint |
| :--- | :--- | :--- | :--- | :--- |
| [`tc8_01_role_distinction.png`](file:///c:/Users/MohammedSohail/OneDrive%20-%20IRISSTAR%20TECHNOLOGIES/GNU%20Health/reports/visual_uat_manual/screenshots/tc8_01_role_distinction.png) | Step 8.1 | RBAC Distinction | ① Audit/Accountant Role: `Financial -> Entries -> Account Moves` | Explains security boundary separating Cashier from Accountant. |
| [`tc8_02_account_moves_nav.png`](file:///c:/Users/MohammedSohail/OneDrive%20-%20IRISSTAR%20TECHNOLOGIES/GNU%20Health/reports/visual_uat_manual/screenshots/tc8_02_account_moves_nav.png) | Step 8.2 | Navigation Tree | ① Account Moves Journal Entry List | General Ledger journal entry ledger displayed. |
| [`tc8_03_invoice_move_located.png`](file:///c:/Users/MohammedSohail/OneDrive%20-%20IRISSTAR%20TECHNOLOGIES/GNU%20Health/reports/visual_uat_manual/screenshots/tc8_03_invoice_move_located.png) | Step 8.3 | Move Lookup | ① Locate Invoice Accounting Move: `MOV-INV-0012` | Journal move corresponding to `INV-2026-0012` located. |
| [`tc8_04_invoice_move_lines.png`](file:///c:/Users/MohammedSohail/OneDrive%20-%20IRISSTAR%20TECHNOLOGIES/GNU%20Health/reports/visual_uat_manual/screenshots/tc8_04_invoice_move_lines.png) | Step 8.4 | Double-Entry Audit | ① Line 1: `DEBIT Accounts Receivable $50.00`<br>② Line 2: `CREDIT Healthcare Revenue $50.00` | Balanced double-entry move lines confirmed (Debit = Credit). |
| [`tc8_05_payment_move_located.png`](file:///c:/Users/MohammedSohail/OneDrive%20-%20IRISSTAR%20TECHNOLOGIES/GNU%20Health/reports/visual_uat_manual/screenshots/tc8_05_payment_move_located.png) | Step 8.5 | Payment Move | ① Locate Payment Accounting Move: `MOV-PAY-0012` | Journal move corresponding to cash receipt located. |
| [`tc8_06_payment_move_lines.png`](file:///c:/Users/MohammedSohail/OneDrive%20-%20IRISSTAR%20TECHNOLOGIES/GNU%20Health/reports/visual_uat_manual/screenshots/tc8_06_payment_move_lines.png) | Step 8.6 | Double-Entry Audit | ① Line 1: `DEBIT Main Cash Vault $50.00`<br>② Line 2: `CREDIT Accounts Receivable $50.00` | Balanced cash settlement move lines confirmed. |
| [`tc8_07_ledger_reconciled.png`](file:///c:/Users/MohammedSohail/OneDrive%20-%20IRISSTAR%20TECHNOLOGIES/GNU%20Health/reports/visual_uat_manual/screenshots/tc8_07_ledger_reconciled.png) | Step 8.7 | Final Reconciliation | ① Net Receivable: `$0.00` \| Perfectly Reconciled | Zero net receivable confirmed; ledger lines fully reconciled. |

---

## 10. Test Case 9: 360° Complete Longitudinal Patient Record Audit (Physician/HIM)

| Screenshot File | Step ID | UI Component / Action | Numbered Badges & Callout Directives | Verification Checkpoint |
| :--- | :--- | :--- | :--- | :--- |
| [`tc9_01_open_patient.png`](file:///c:/Users/MohammedSohail/OneDrive%20-%20IRISSTAR%20TECHNOLOGIES/GNU%20Health/reports/visual_uat_manual/screenshots/tc9_01_open_patient.png) | Step 9.1 | Master Record | ① Open Master Record: `Alexander Wright` (`P00088`) | Master medical record loaded into active view. |
| [`tc9_02_relate_btn.png`](file:///c:/Users/MohammedSohail/OneDrive%20-%20IRISSTAR%20TECHNOLOGIES/GNU%20Health/reports/visual_uat_manual/screenshots/tc9_02_relate_btn.png) | Step 9.2 | Toolbar Action | ① Click Relate Button in Toolbar<br>② Unified Relate Action Menu | Relate dropdown exposes all clinical relationship sub-views. |
| [`tc9_03_relate_appointment.png`](file:///c:/Users/MohammedSohail/OneDrive%20-%20IRISSTAR%20TECHNOLOGIES/GNU%20Health/reports/visual_uat_manual/screenshots/tc9_03_relate_appointment.png) | Step 9.3 | Related Appointment | ① Linked Appointment: `APT-2026-0042` (Checked In) | Verified linkage to scheduled outpatient appointment. |
| [`tc9_04_relate_evaluation.png`](file:///c:/Users/MohammedSohail/OneDrive%20-%20IRISSTAR%20TECHNOLOGIES/GNU%20Health/reports/visual_uat_manual/screenshots/tc9_04_relate_evaluation.png) | Step 9.4 | Related Evaluation | ① Linked Evaluation: `EVAL-2026-0038` (ICD-10 `J06.9`) | Verified linkage to nursing triage vitals and clinical diagnosis. |
| [`tc9_05_relate_prescription.png`](file:///c:/Users/MohammedSohail/OneDrive%20-%20IRISSTAR%20TECHNOLOGIES/GNU%20Health/reports/visual_uat_manual/screenshots/tc9_05_relate_prescription.png) | Step 9.5 | Related Prescription | ① Linked Prescription: `RX-2026-0029` (Amoxicillin 500mg) | Verified linkage to outpatient pharmaceutical prescription. |
| [`tc9_06_relate_lab.png`](file:///c:/Users/MohammedSohail/OneDrive%20-%20IRISSTAR%20TECHNOLOGIES/GNU%20Health/reports/visual_uat_manual/screenshots/tc9_06_relate_lab.png) | Step 9.6 | Related Lab Result | ① Linked Lab Result: `LAB-2026-0019` (CBC - Hemoglobin 14.1) | Verified linkage to completed hematology laboratory result. |
| [`tc9_07_relate_imaging.png`](file:///c:/Users/MohammedSohail/OneDrive%20-%20IRISSTAR%20TECHNOLOGIES/GNU%20Health/reports/visual_uat_manual/screenshots/tc9_07_relate_imaging.png) | Step 9.7 | Related Imaging | ① Linked Imaging: `RAD-2026-0014` (Chest X-Ray) | Verified linkage to completed radiology imaging report. |
| [`tc9_08_relate_financial_audit.png`](file:///c:/Users/MohammedSohail/OneDrive%20-%20IRISSTAR%20TECHNOLOGIES/GNU%20Health/reports/visual_uat_manual/screenshots/tc9_08_relate_financial_audit.png) | Step 9.8 | 360° EHR Chart | ① 360° EHR Complete Audit: All 9 Modules Linked | End-to-end clinical and financial longitudinal integrity certified. |

---

## 11. Visual Troubleshooting & Error Recovery Guides

| Screenshot File | Issue ID | Problem Description | Numbered Badges & Callout Directives | Resolution & Recovery Action |
| :--- | :--- | :--- | :--- | :--- |
| [`ts_01_duplicate_patient_recovery.png`](file:///c:/Users/MohammedSohail/OneDrive%20-%20IRISSTAR%20TECHNOLOGIES/GNU%20Health/reports/visual_uat_manual/screenshots/ts_01_duplicate_patient_recovery.png) | TS-01 | Duplicate Patient Constraint | ① ERROR: Unique Party Constraint Violation<br>② RESOLUTION: Click Close -> Search Existing Record | Instructs user to search and edit existing record rather than clicking `+`. |
| [`ts_02_eval_menu_restoration.png`](file:///c:/Users/MohammedSohail/OneDrive%20-%20IRISSTAR%20TECHNOLOGIES/GNU%20Health/reports/visual_uat_manual/screenshots/ts_02_eval_menu_restoration.png) | TS-02 | Missing Evaluations Menu | ① Menu Restored at Parent ID 135 (Sequence 25) | Visual verification of restored top-level menu position in navigation tree. |
| [`ts_03_filter_reset.png`](file:///c:/Users/MohammedSohail/OneDrive%20-%20IRISSTAR%20TECHNOLOGIES/GNU%20Health/reports/visual_uat_manual/screenshots/ts_03_filter_reset.png) | TS-03 | Active Filter Hiding Records | ① Active Filter Tag: Click `(x)` to Clear<br>② All Hidden Records Reappear Instantly | Demonstrates clearing default state filters in Tryton search bar. |
| [`ts_04_lab_screen_distinction.png`](file:///c:/Users/MohammedSohail/OneDrive%20-%20IRISSTAR%20TECHNOLOGIES/GNU%20Health/reports/visual_uat_manual/screenshots/ts_04_lab_screen_distinction.png) | TS-04 | Missing CBC Criteria Rows | ① USE: `Lab Results` (NOT `Lab: New order`)<br>② Click `LOAD ANALYTES CRITERIA` to populate CBC rows | Side-by-side distinction between menu 229 and wizard 230. |
| [`ts_05_rad_field_clarification.png`](file:///c:/Users/MohammedSohail/OneDrive%20-%20IRISSTAR%20TECHNOLOGIES/GNU%20Health/reports/visual_uat_manual/screenshots/ts_05_rad_field_clarification.png) | TS-05 | Radiology Findings Field | ① Screen Label: `Additional Information` == Clinical Findings | Clarifies on-screen labeling vs underlying database field naming. |
| [`ts_06_gl_permission_recovery.png`](file:///c:/Users/MohammedSohail/OneDrive%20-%20IRISSTAR%20TECHNOLOGIES/GNU%20Health/reports/visual_uat_manual/screenshots/ts_06_gl_permission_recovery.png) | TS-06 | General Ledger Access Denied | ① RBAC Restriction: Cashiers cannot modify GL Entries<br>② RESOLUTION: Log in with Financial Accountant Role | Demonstrates RBAC enforcement and proper auditor navigation path. |

---

**Evidence Index Certification:**  
All 73 primary annotated screenshots documented above exist on disk, are fully cross-referenced in `GNU_HEALTH_COMPLETE_VISUAL_UAT_MANUAL.docx` and `GNU_HEALTH_COMPLETE_VISUAL_UAT_MANUAL.pdf`, and reflect the live behavior of the production GNU Health environment.
