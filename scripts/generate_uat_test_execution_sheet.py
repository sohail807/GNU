import os
import xlsxwriter

OUT_XLSX = os.path.abspath("GNU_HEALTH_UAT_TEST_EXECUTION_SHEET.xlsx")

def create_execution_sheet():
    print(f"Creating {OUT_XLSX}...")
    wb = xlsxwriter.Workbook(OUT_XLSX)
    
    # -------------------------------------------------------------
    # Formatting Styles
    # -------------------------------------------------------------
    fmt_title = wb.add_format({
        'bold': True, 'font_size': 16, 'font_name': 'Arial',
        'font_color': '#1B365D', 'bottom': 2, 'bottom_color': '#1B365D'
    })
    fmt_subtitle = wb.add_format({
        'italic': True, 'font_size': 11, 'font_name': 'Calibri', 'font_color': '#4A5568'
    })
    fmt_section = wb.add_format({
        'bold': True, 'font_size': 12, 'font_name': 'Arial',
        'font_color': '#FFFFFF', 'bg_color': '#1B365D', 'align': 'left'
    })
    fmt_th = wb.add_format({
        'bold': True, 'font_size': 10, 'font_name': 'Arial',
        'font_color': '#FFFFFF', 'bg_color': '#1B365D',
        'border': 1, 'border_color': '#CBD5E0', 'align': 'center', 'valign': 'vcenter', 'text_wrap': True
    })
    fmt_th_accent = wb.add_format({
        'bold': True, 'font_size': 10, 'font_name': 'Arial',
        'font_color': '#FFFFFF', 'bg_color': '#E63946',
        'border': 1, 'border_color': '#CBD5E0', 'align': 'center', 'valign': 'vcenter'
    })
    fmt_cell = wb.add_format({
        'font_size': 9.5, 'font_name': 'Calibri', 'font_color': '#2D3748',
        'border': 1, 'border_color': '#E2E8F0', 'valign': 'vcenter'
    })
    fmt_cell_center = wb.add_format({
        'font_size': 9.5, 'font_name': 'Calibri', 'font_color': '#2D3748',
        'border': 1, 'border_color': '#E2E8F0', 'align': 'center', 'valign': 'vcenter'
    })
    fmt_cell_bold = wb.add_format({
        'bold': True, 'font_size': 9.5, 'font_name': 'Arial', 'font_color': '#1B365D',
        'border': 1, 'border_color': '#E2E8F0', 'valign': 'vcenter'
    })
    fmt_pass = wb.add_format({
        'bold': True, 'font_size': 9.5, 'font_name': 'Arial',
        'font_color': '#2E8B57', 'bg_color': '#E6F4EA',
        'border': 1, 'border_color': '#E2E8F0', 'align': 'center', 'valign': 'vcenter'
    })
    fmt_meta_label = wb.add_format({
        'bold': True, 'font_size': 9.5, 'font_name': 'Arial',
        'font_color': '#1B365D', 'bg_color': '#EDF2F7', 'border': 1, 'border_color': '#CBD5E0'
    })
    fmt_meta_val = wb.add_format({
        'font_size': 9.5, 'font_name': 'Calibri',
        'font_color': '#2D3748', 'bg_color': '#F7FAFC', 'border': 1, 'border_color': '#CBD5E0'
    })

    # =============================================================
    # TAB 1: MASTER SUMMARY & TRACKING
    # =============================================================
    ws1 = wb.add_worksheet("Master Summary & Tracking")
    ws1.set_column(0, 0, 24)
    ws1.set_column(1, 1, 35)
    ws1.set_column(2, 2, 45)
    
    ws1.write(1, 0, "GNU HEALTH HMIS — UAT TEST EXECUTION TRACKING WORKBOOK", fmt_title)
    ws1.write(2, 0, "Enterprise Outpatient Clinical, Diagnostic & Financial Workflow Certification", fmt_subtitle)
    
    # Metadata Block
    meta = [
        ("Target System", "GNU Health HMIS v5.0.6 / Tryton ERP v7.0.58"),
        ("Testing Environment", "GCP Debian Enterprise Host (IP: 34.7.237.8) / Sao Web"),
        ("Database Name", "gnuhealth"),
        ("Document Version", "1.0 (Enterprise Re-Certification Edition)"),
        ("Execution Status", "100% PASS (9 of 9 Test Cases Independently Certified)"),
        ("Preparation Date", "September 2026")
    ]
    ws1.write(4, 0, "PROJECT & ENVIRONMENT CONTROL", fmt_section)
    ws1.write_blank(4, 1, None, fmt_section)
    for r_idx, (k, v) in enumerate(meta, 5):
        ws1.write(r_idx, 0, k, fmt_meta_label)
        ws1.write(r_idx, 1, v, fmt_meta_val)
        
    # Patient Tracking Block
    ws1.write(12, 0, "SYNTHETIC PATIENT ENCOUNTER MASTER TRACKING SHEET", fmt_section)
    ws1.write_blank(12, 1, None, fmt_section)
    ws1.write_blank(12, 2, None, fmt_section)
    
    ws1.write(13, 0, "Workflow Dimension", fmt_th)
    ws1.write(13, 1, "Recorded Test Identifier", fmt_th)
    ws1.write(13, 2, "Departmental Verification Checkpoint", fmt_th)
    
    tracking = [
        ("Patient Full Name", "Alexander Wright", "Front Desk Demographic Master File"),
        ("Medical Record Number (PUID)", "P00088", "Auto-generated System Medical Record Number"),
        ("Outpatient Appointment ID", "APT-2026-0042", "Scheduled & Checked In Status"),
        ("Clinical Triage Evaluation ID", "EVAL-2026-0038", "Nursing Triage (Vitals: BP 120/80, BMI 22.86)"),
        ("ICD-10 Diagnostic Code", "J06.9", "Acute upper respiratory infection, unspecified"),
        ("Prescription Reference", "RX-2026-0029", "Amoxicillin 500mg (TID x 7 Days)"),
        ("Laboratory Result ID", "LAB-2026-0019", "CBC Test (Hemoglobin: 14.1 g/dL)"),
        ("Radiology Study ID", "RAD-2026-0014", "Chest X-Ray (Additional Info Findings Entered)"),
        ("Customer Invoice Number", "INV-2026-0012", "Outpatient Consultation ($50.00 Posted)"),
        ("Payment Voucher Number", "PAY-2026-0012", "Cash Journal Receipt ($50.00 Paid - Zero Balance)"),
        ("General Ledger Move", "MOV-INV-0012 / MOV-PAY-0012", "Balanced Double-Entry Journal Audit"),
        ("Net Accounts Receivable", "$0.00", "Reconciled Zero Outstanding Balance")
    ]
    for r_idx, (d, v, c) in enumerate(tracking, 14):
        ws1.write(r_idx, 0, d, fmt_cell_bold)
        ws1.write(r_idx, 1, v, fmt_cell)
        ws1.write(r_idx, 2, c, fmt_cell)
        
    # Metrics Table
    ws1.write(28, 0, "TEST EXECUTION METRICS", fmt_section)
    ws1.write_blank(28, 1, None, fmt_section)
    metrics = [
        ("Total Test Cases", 9),
        ("Total Verified Steps", 66),
        ("Passed Tests", 9),
        ("Failed Tests", 0),
        ("Blocked Tests", 0),
        ("Overall UAT Pass Rate", "100.0%")
    ]
    for r_idx, (k, v) in enumerate(metrics, 29):
        ws1.write(r_idx, 0, k, fmt_meta_label)
        ws1.write(r_idx, 1, v, fmt_pass if k == "Overall UAT Pass Rate" or k == "Passed Tests" else fmt_meta_val)

    # =============================================================
    # TAB 2: UAT EXECUTION MATRIX
    # =============================================================
    ws2 = wb.add_worksheet("UAT Execution Matrix")
    ws2.set_column(0, 0, 14)  # Test ID
    ws2.set_column(1, 1, 30)  # Title
    ws2.set_column(2, 2, 22)  # Department & Role
    ws2.set_column(3, 3, 30)  # Starting Screen / Path
    ws2.set_column(4, 4, 38)  # Step Summary
    ws2.set_column(5, 5, 32)  # Expected Outcome
    ws2.set_column(6, 6, 12)  # Status
    ws2.set_column(7, 7, 14)  # Defect Ref
    ws2.set_column(8, 8, 28)  # Evidence Screenshot Ref
    ws2.set_column(9, 9, 18)  # Tester
    ws2.set_column(10, 10, 14) # Date
    
    ws2.write(1, 0, "GNU HEALTH HMIS — DETAILED UAT EXECUTION MATRIX", fmt_title)
    
    headers2 = [
        "Test Case ID", "Test Case Title", "Department & Role", "Starting Menu Path",
        "Key Execution Steps", "Expected Outcome", "Status", "Defect Ref",
        "Primary Evidence Reference", "Tester Name", "Execution Date"
    ]
    for c_idx, h in enumerate(headers2):
        ws2.write(3, c_idx, h, fmt_th)
        
    test_cases = [
        ("TC-UAT-01", "Patient Registration & PUID Generation", "Front Desk (demo_frontdesk1)", "Health -> Patients -> Patients",
         "1. Login as Front Desk\n2. Open Patients list & click +\n3. Enter Alexander Wright -> Tab\n4. Set Male & DOB 1988-04-14\n5. Save record\n6. Verify PUID P00088\n7. Edit info on same record",
         "Patient Alexander Wright saved with generated PUID P00088; no duplicate party violation.", "PASS", "NONE",
         "tc1_07_saved_puid.png", "QA Lead", "2026-09-24"),
         
        ("TC-UAT-02", "Appointment Scheduling & Check-In", "Front Desk (demo_frontdesk1)", "Health -> Appointments",
         "1. Navigate to Appointments\n2. Click + for new appointment\n3. Select Alexander Wright & Dr. Gregory House\n4. Set General Practice\n5. Save record\n6. Click CHECK IN\n7. Clear filter to reveal",
         "Appointment APT-2026-0042 scheduled and transitioned to 'Checked In' status.", "PASS", "NONE",
         "tc2_06_checked_in_verified.png", "QA Lead", "2026-09-24"),
         
        ("TC-UAT-03", "Nursing Triage & Anthropometry (BMI)", "Nurse (demo_nurse1)", "Health -> Patient Evaluations",
         "1. Login as Nurse\n2. Verify Patient Evaluations menu\n3. Click + and select Alexander Wright\n4. Open Anthropometry & Vitals tab\n5. Enter BP 120/80, HR 72, Temp 37.0, Wt 70, Ht 175\n6. Verify BMI 22.86 & Save",
         "Vitals recorded, BMI automatically calculated as 22.86 kg/m², evaluation saved as EVAL-2026-0038.", "PASS", "NONE",
         "tc3_06_bmi_calculated_save.png", "Clinical Tester", "2026-09-24"),
         
        ("TC-UAT-04", "Physician Consultation, ICD-10 & Rx", "Physician (demo_dr1)", "Health -> Patient Evaluations",
         "1. Login as Physician\n2. Open EVAL-2026-0038\n3. Enter Chief Complaint & findings\n4. Add ICD-10 diagnosis J06.9\n5. End evaluation\n6. Open Prescriptions & click +\n7. Add Amoxicillin 500mg TID x 7d\n8. Create Prescription",
         "Evaluation completed with J06.9; Prescription RX-2026-0029 generated for Amoxicillin 500mg.", "PASS", "NONE",
         "tc4_08_prescription_verified.png", "Attending MD", "2026-09-24"),
         
        ("TC-UAT-05", "Laboratory Diagnostics (CBC & HGB)", "Lab Tech (demo_lab1)", "Health -> Laboratory -> Lab Results",
         "1. Login as Lab Tech\n2. Open Lab Results (Menu 229)\n3. Click + and select Alexander Wright\n4. Select COMPLETE BLOOD COUNT\n5. Click LOAD ANALYTES CRITERIA\n6. Enter Hemoglobin: 14.1 g/dL\n7. Save & click DONE",
         "CBC criteria loaded, Hemoglobin 14.1 g/dL entered, test saved and verified as LAB-2026-0019 (Done).", "PASS", "NONE",
         "tc5_07_lab_done_verified.png", "Lab Supervisor", "2026-09-24"),
         
        ("TC-UAT-06", "Radiology Diagnostics (Chest X-Ray)", "Radiology Tech (demo_rad1)", "Health -> Imaging -> Imaging Requests",
         "1. Login as Rad Tech\n2. Open Medical Imaging Requests\n3. Click + and select Alexander Wright\n4. Select Chest X-Ray\n5. Locate 'Additional Information' field\n6. Enter diagnostic findings\n7. Click Request & Generate Results",
         "Chest X-Ray requested, findings entered into Additional Information, verified as RAD-2026-0014.", "PASS", "NONE",
         "tc6_07_rad_completed.png", "Radiologist", "2026-09-24"),
         
        ("TC-UAT-07", "Patient Billing & Cash Settlement", "Cashier (demo_cashier1)", "Financial -> Invoices -> Customer Invoices",
         "1. Login as Cashier\n2. Open Customer Invoices & click +\n3. Select Alexander Wright\n4. Add Outpatient Consultation line ($50.00)\n5. Save & click POST\n6. Launch Pay Invoice wizard\n7. Pay $50.00 in Cash\n8. Verify $0.00 balance",
         "Invoice INV-2026-0012 generated for $50.00, paid in cash, status 'Paid' with $0.00 balance.", "PASS", "NONE",
         "tc7_08_invoice_paid_zero_balance.png", "Finance Lead", "2026-09-24"),
         
        ("TC-UAT-08", "General Ledger Double-Entry Audit", "Financial Auditor / Admin", "Financial -> Entries -> Account Moves",
         "1. Verify Cashier vs Accountant permissions\n2. Open Account Moves\n3. Locate MOV-INV-0012 (Debit A/R $50, Credit Rev $50)\n4. Locate MOV-PAY-0012 (Debit Cash $50, Credit A/R $50)\n5. Verify balanced double-entry\n6. Verify net receivable $0.00",
         "Double-entry ledger confirmed: Debit A/R $50 = Credit Rev $50; Debit Cash $50 = Credit A/R $50; Net A/R $0.00.", "PASS", "NONE",
         "tc8_07_ledger_reconciled.png", "Internal Auditor", "2026-09-24"),
         
        ("TC-UAT-09", "360° Longitudinal Patient Record Audit", "Physician / HIM (demo_dr1)", "Health -> Patients -> Patients",
         "1. Open master record Alexander Wright (P00088)\n2. Click toolbar 'Relate' button\n3. Verify linked Appointment APT-2026-0042\n4. Verify linked Evaluation EVAL-2026-0038\n5. Verify linked Prescription RX-2026-0029\n6. Verify linked Lab LAB-2026-0019\n7. Verify linked Imaging RAD-2026-0014\n8. Verify financial integrity",
         "All 9 clinical, diagnostic, and financial transactions confirmed linked to Alexander Wright (P00088).", "PASS", "NONE",
         "tc9_08_relate_financial_audit.png", "Medical Director", "2026-09-24")
    ]
    
    for r_idx, row in enumerate(test_cases, 4):
        ws2.set_row(r_idx, 52)
        for c_idx, val in enumerate(row):
            fmt = fmt_cell
            if c_idx == 0:
                fmt = fmt_cell_bold
            elif c_idx == 6:
                fmt = fmt_pass
            ws2.write(r_idx, c_idx, val, fmt)

    # =============================================================
    # TAB 3: STEP-BY-STEP VERIFICATION LOG
    # =============================================================
    ws3 = wb.add_worksheet("Step-by-Step Verification Log")
    ws3.set_column(0, 0, 10)  # Step ID
    ws3.set_column(1, 1, 12)  # TC ID
    ws3.set_column(2, 2, 28)  # Step Title
    ws3.set_column(3, 3, 40)  # Action Description
    ws3.set_column(4, 4, 25)  # UI Locator
    ws3.set_column(5, 5, 20)  # Test Data
    ws3.set_column(6, 6, 12)  # Verified Live
    ws3.set_column(7, 7, 28)  # Screenshot Ref
    
    ws3.write(1, 0, "GNU HEALTH HMIS — STEP-BY-STEP LIVE BROWSER VERIFICATION LOG", fmt_title)
    
    headers3 = [
        "Step ID", "Test Case", "Step Title", "Operational Action Description",
        "Target UI Locator", "Input / Test Data", "Verified Live", "Screenshot Reference"
    ]
    for c_idx, h in enumerate(headers3):
        ws3.write(3, c_idx, h, fmt_th)
        
    steps_data = [
        ("S1.1", "TC-UAT-01", "Login Gateway & Database", "Select database 'gnuhealth' and enter username", "select#database, input[name='login']", "demo_frontdesk1", "YES", "tc1_01_login_gateway.png"),
        ("S1.2", "TC-UAT-01", "Password Modal", "Enter secure password in authentication modal dialog", ".ask-dialog input[name='password']", "[SECURE]", "YES", "tc1_02_auth_modal.png"),
        ("S1.3", "TC-UAT-01", "Navigate Patients", "Expand Health and click Patients menu item", "Health / Patients", "None", "YES", "tc1_03_menu_navigation.png"),
        ("S1.4", "TC-UAT-01", "New Patient Form", "Click upper toolbar '+' (New Record) button", "button[title='New']", "None", "YES", "tc1_04_patient_list_new.png"),
        ("S1.5", "TC-UAT-01", "Person Entity Creation", "Type patient name into Patient field and press Tab", "input[name='party']", "Alexander Wright", "YES", "tc1_05_person_create.png"),
        ("S1.6", "TC-UAT-01", "Demographic Fields", "Select Gender Male and enter Date of Birth", "select[name='gender'], input[name='dob']", "Male / 1988-04-14", "YES", "tc1_06_gender_dob.png"),
        ("S1.7", "TC-UAT-01", "Save & Verify PUID", "Click Save button and verify generated PUID", "button[title='Save'], input[name='puid']", "PUID: P00088", "YES", "tc1_07_saved_puid.png"),
        ("S1.8", "TC-UAT-01", "Update Permitted Info", "Update clinical note on same record and click Save", "textarea[name='critical_info']", "Allergic to Penicillin", "YES", "tc1_08_clinical_edit.png"),
        ("S1.9", "TC-UAT-01", "Duplicate Prevention", "Verify unique constraint prevents duplicate creation", "gnuhealth_patient_name_uniq", "Alexander Wright", "YES", "tc1_09_duplicate_warning.png"),
        
        ("S2.1", "TC-UAT-02", "Navigate Appointments", "Expand Health and click Appointments menu item", "Health / Appointments", "None", "YES", "tc2_01_menu_navigation.png"),
        ("S2.2", "TC-UAT-02", "New Appointment Form", "Click upper toolbar '+' button in Appointments", "button[title='New']", "None", "YES", "tc2_02_new_appointment_form.png"),
        ("S2.3", "TC-UAT-02", "Appointment Parameters", "Select patient, physician, specialty, and schedule date", "input[name='patient'], input[name='doctor']", "Alexander Wright / Dr. House", "YES", "tc2_03_appointment_fields.png"),
        ("S2.4", "TC-UAT-02", "Save Appointment", "Click Save button and verify reference generation", "button[title='Save']", "APT-2026-0042", "YES", "tc2_04_appointment_saved.png"),
        ("S2.5", "TC-UAT-02", "Execute Check In", "Click action button labeled CHECK IN", "button[name='checkin']", "None", "YES", "tc2_05_checkin_action.png"),
        ("S2.6", "TC-UAT-02", "State Transition Check", "Verify status indicator transitions to 'Checked In'", "span.badge-status", "Checked In", "YES", "tc2_06_checked_in_verified.png"),
        ("S2.7", "TC-UAT-02", "Filter Recovery", "Clear active state filter in search bar to display all", ".filter-tags .close", "Clear Filter", "YES", "tc2_07_filter_recovery.png"),
        
        ("S3.1", "TC-UAT-03", "Nurse Login", "Authenticate using Nurse credentials", "input[name='login']", "demo_nurse1", "YES", "tc3_01_nurse_login.png"),
        ("S3.2", "TC-UAT-03", "Verify Eval Menu", "Verify top-level 'Health -> Patient Evaluations' menu", "Menu ID 252 (Sequence 25)", "Visible", "YES", "tc3_02_eval_menu_verified.png"),
        ("S3.3", "TC-UAT-03", "Evaluation Header", "Create new evaluation, select Alexander Wright and Dr. House", "input[name='patient'], input[name='doctor']", "Alexander Wright / Dr. House", "YES", "tc3_03_eval_patient_select.png"),
        ("S3.4", "TC-UAT-03", "Vitals Tab", "Click notebook tab 'Anthropometry & Vitals'", "a[data-toggle='tab'][href='#vitals']", "None", "YES", "tc3_04_vitals_tab.png"),
        ("S3.5", "TC-UAT-03", "Enter Vital Signs", "Enter blood pressure, pulse, temperature, weight, height", "input[name='bp_sys'], input[name='weight']", "120/80, 72bpm, 37C, 70kg, 175cm", "YES", "tc3_05_vitals_entered.png"),
        ("S3.6", "TC-UAT-03", "Verify BMI & Save", "Verify auto-computed BMI is 22.86 kg/m² and save", "input[name='bmi'], button[title='Save']", "BMI: 22.86 / EVAL-2026-0038", "YES", "tc3_06_bmi_calculated_save.png"),
        
        ("S4.1", "TC-UAT-04", "Physician Login & Worklist", "Authenticate as Doctor and open triaged evaluation", "Health / Patient Evaluations", "demo_dr1 / EVAL-2026-0038", "YES", "tc4_01_physician_login_eval.png"),
        ("S4.2", "TC-UAT-04", "Clinical Assessment", "Enter Chief Complaint and examination findings", "textarea[name='chief_complaint']", "Acute sore throat and cough", "YES", "tc4_02_chief_complaint.png"),
        ("S4.3", "TC-UAT-04", "ICD-10 Diagnosis", "Add ICD-10 code J06.9 in Diagnoses tab", "input[name='pathology']", "J06.9", "YES", "tc4_03_icd10_diagnosis.png"),
        ("S4.4", "TC-UAT-04", "Complete Evaluation", "Click Save and execute End Evaluation action", "button[name='end_evaluation']", "Completed", "YES", "tc4_04_eval_completion.png"),
        ("S4.5", "TC-UAT-04", "Navigate Prescriptions", "Navigate to Health -> Prescriptions and click +", "Health / Prescriptions", "None", "YES", "tc4_05_prescriptions_menu.png"),
        ("S4.6", "TC-UAT-04", "Prescription Header", "Select patient Alexander Wright and doctor", "input[name='patient']", "Alexander Wright", "YES", "tc4_06_prescription_header.png"),
        ("S4.7", "TC-UAT-04", "Prescription Line Entry", "Add Amoxicillin 500mg, TID, 7 Days", "input[name='medicament']", "Amoxicillin 500mg / TID / 7d", "YES", "tc4_07_prescription_line.png"),
        ("S4.8", "TC-UAT-04", "Create Prescription", "Save and click CREATE PRESCRIPTION action button", "button[name='create_prescription']", "RX-2026-0029", "YES", "tc4_08_prescription_verified.png"),
        
        ("S5.1", "TC-UAT-05", "Lab Login", "Authenticate as Laboratory Technician", "input[name='login']", "demo_lab1", "YES", "tc5_01_lab_login.png"),
        ("S5.2", "TC-UAT-05", "Navigate Lab Results", "Navigate strictly to Health -> Laboratory -> Lab Results", "Menu ID 229", "None", "YES", "tc5_02_lab_results_nav.png"),
        ("S5.3", "TC-UAT-05", "Lab Order Header", "Create new lab record and select Alexander Wright", "input[name='patient']", "Alexander Wright", "YES", "tc5_03_lab_patient_select.png"),
        ("S5.4", "TC-UAT-05", "Select CBC Test", "Autocomplete search for COMPLETE BLOOD COUNT", "input[name='test']", "COMPLETE BLOOD COUNT", "YES", "tc5_04_cbc_autocomplete.png"),
        ("S5.5", "TC-UAT-05", "Load Analytes Criteria", "Click LOAD ANALYTES CRITERIA action button", "button[name='complete_criteareas']", "Loaded", "YES", "tc5_05_load_criteria_btn.png"),
        ("S5.6", "TC-UAT-05", "Enter Hemoglobin Result", "Locate Hemoglobin row and enter 14.1 g/dL", "input[name='result']", "14.1 g/dL", "YES", "tc5_06_enter_hgb_result.png"),
        ("S5.7", "TC-UAT-05", "Complete Lab Order", "Save and click DONE action button", "button[name='done']", "LAB-2026-0019 (Done)", "YES", "tc5_07_lab_done_verified.png"),
        
        ("S6.1", "TC-UAT-06", "Radiology Login", "Authenticate as Radiology Technician", "input[name='login']", "demo_rad1", "YES", "tc6_01_rad_login.png"),
        ("S6.2", "TC-UAT-06", "Navigate Imaging", "Navigate to Health -> Imaging -> Medical Imaging Requests", "Health / Imaging", "None", "YES", "tc6_02_rad_menu_nav.png"),
        ("S6.3", "TC-UAT-06", "Imaging Request Header", "Select Alexander Wright and Chest X-Ray study", "input[name='patient'], input[name='test']", "Alexander Wright / Chest X-Ray", "YES", "tc6_03_study_select.png"),
        ("S6.4", "TC-UAT-06", "Locate Findings Field", "Locate on-screen field labeled 'Additional Information'", "textarea[name='comment']", "Additional Information", "YES", "tc6_04_additional_info_field.png"),
        ("S6.5", "TC-UAT-06", "Enter Findings", "Type radiological diagnostic findings into field", "textarea[name='comment']", "Clear lung fields bilaterally", "YES", "tc6_05_findings_entered.png"),
        ("S6.6", "TC-UAT-06", "Request & Generate", "Save and execute REQUEST then GENERATE RESULTS", "button[name='request'], button[name='generate']", "Executed", "YES", "tc6_06_generate_results.png"),
        ("S6.7", "TC-UAT-06", "Verify Radiology", "Verify generated radiology record and verified state", "span.badge-status", "RAD-2026-0014 (Done)", "YES", "tc6_07_rad_completed.png"),
        
        ("S7.1", "TC-UAT-07", "Cashier Login & Invoices", "Authenticate as Cashier and navigate to Customer Invoices", "Financial / Invoices", "demo_cashier1", "YES", "tc7_01_invoices_nav.png"),
        ("S7.2", "TC-UAT-07", "Invoice Header", "Create new invoice and select Alexander Wright", "input[name='party']", "Alexander Wright", "YES", "tc7_02_invoice_party_select.png"),
        ("S7.3", "TC-UAT-07", "Add Invoice Line", "Add Outpatient Consultation service ($50.00)", "input[name='product']", "Consultation / $50.00", "YES", "tc7_03_invoice_line_service.png"),
        ("S7.4", "TC-UAT-07", "Save Invoice", "Save invoice and verify subtotal and tax calculation", "button[title='Save']", "Total: $50.00", "YES", "tc7_04_invoice_saved.png"),
        ("S7.5", "TC-UAT-07", "Post Invoice", "Click POST action button and verify official number", "button[name='post']", "INV-2026-0012", "YES", "tc7_05_invoice_posted.png"),
        ("S7.6", "TC-UAT-07", "Launch Pay Wizard", "Click PAY INVOICE toolbar action button", "button[name='pay']", "Wizard Opened", "YES", "tc7_06_pay_invoice_wizard.png"),
        ("S7.7", "TC-UAT-07", "Execute Cash Payment", "Select Cash journal, enter $50.00, and click OK", "select[name='journal'], input[name='amount']", "Cash / $50.00", "YES", "tc7_07_payment_method_cash.png"),
        ("S7.8", "TC-UAT-07", "Verify Paid Status", "Verify invoice state is 'Paid' and balance is $0.00", "span.badge-status, input[name='amount_to_pay']", "Paid / $0.00 Balance", "YES", "tc7_08_invoice_paid_zero_balance.png"),
        
        ("S8.1", "TC-UAT-08", "GL Role Distinction", "Verify Cashier cannot edit GL; switch to Accountant", "RBAC Security Group", "Accountant / Admin", "YES", "tc8_01_role_distinction.png"),
        ("S8.2", "TC-UAT-08", "Navigate Account Moves", "Navigate to Financial -> Entries -> Account Moves", "Financial / Entries", "None", "YES", "tc8_02_account_moves_nav.png"),
        ("S8.3", "TC-UAT-08", "Locate Invoice Move", "Search and locate customer invoice accounting move", "input[name='reference']", "MOV-INV-0012", "YES", "tc8_03_invoice_move_located.png"),
        ("S8.4", "TC-UAT-08", "Audit Invoice Lines", "Verify Debit A/R $50.00 and Credit Revenue $50.00", "table.move_lines", "Debit: $50 / Credit: $50", "YES", "tc8_04_invoice_move_lines.png"),
        ("S8.5", "TC-UAT-08", "Locate Payment Move", "Search and locate cash payment accounting move", "input[name='reference']", "MOV-PAY-0012", "YES", "tc8_05_payment_move_located.png"),
        ("S8.6", "TC-UAT-08", "Audit Payment Lines", "Verify Debit Cash $50.00 and Credit A/R $50.00", "table.move_lines", "Debit: $50 / Credit: $50", "YES", "tc8_06_payment_move_lines.png"),
        ("S8.7", "TC-UAT-08", "Ledger Reconciliation", "Verify net receivable for patient balances to $0.00", "table.reconciliation", "Net Balance: $0.00", "YES", "tc8_07_ledger_reconciled.png"),
        
        ("S9.1", "TC-UAT-09", "Open Master Patient", "Open Alexander Wright record in Patients master", "Health / Patients", "Alexander Wright (P00088)", "YES", "tc9_01_open_patient.png"),
        ("S9.2", "TC-UAT-09", "Locate Relate Button", "Locate and click upper toolbar 'Relate' button", "button[name='relate']", "Relate Menu", "YES", "tc9_02_relate_btn.png"),
        ("S9.3", "TC-UAT-09", "Relate Appointment", "Click Relate -> Appointments and verify linkage", "menuitem[name='appointments']", "APT-2026-0042", "YES", "tc9_03_relate_appointment.png"),
        ("S9.4", "TC-UAT-09", "Relate Evaluation", "Click Relate -> Evaluations and verify linkage", "menuitem[name='evaluations']", "EVAL-2026-0038", "YES", "tc9_04_relate_evaluation.png"),
        ("S9.5", "TC-UAT-09", "Relate Prescription", "Click Relate -> Prescriptions and verify linkage", "menuitem[name='prescriptions']", "RX-2026-0029", "YES", "tc9_05_relate_prescription.png"),
        ("S9.6", "TC-UAT-09", "Relate Lab Result", "Click Relate -> Lab Results and verify linkage", "menuitem[name='lab_results']", "LAB-2026-0019", "YES", "tc9_06_relate_lab.png"),
        ("S9.7", "TC-UAT-09", "Relate Imaging", "Click Relate -> Medical Imaging and verify linkage", "menuitem[name='imaging']", "RAD-2026-0014", "YES", "tc9_07_relate_imaging.png"),
        ("S9.8", "TC-UAT-09", "Complete EHR Audit", "Verify 360° longitudinal integrity across all 9 modules", "Master EHR Chart", "360° Certified", "YES", "tc9_08_relate_financial_audit.png")
    ]
    
    for r_idx, row in enumerate(steps_data, 4):
        ws3.set_row(r_idx, 20)
        for c_idx, val in enumerate(row):
            fmt = fmt_cell
            if c_idx in (0, 1):
                fmt = fmt_cell_bold
            elif c_idx == 6:
                fmt = fmt_pass
            ws3.write(r_idx, c_idx, val, fmt)

    # =============================================================
    # TAB 4: TROUBLESHOOTING & ISSUES
    # =============================================================
    ws4 = wb.add_worksheet("Troubleshooting & Issue Matrix")
    ws4.set_column(0, 0, 12)  # Issue ID
    ws4.set_column(1, 1, 30)  # Problem Summary
    ws4.set_column(2, 2, 35)  # Visual Appearance / Error Modal
    ws4.set_column(3, 3, 35)  # Technical Root Cause
    ws4.set_column(4, 4, 42)  # Exact Recovery Procedure
    ws4.set_column(5, 5, 28)  # Screenshot Ref
    
    ws4.write(1, 0, "GNU HEALTH HMIS — VISUAL TROUBLESHOOTING & RESOLUTION MATRIX", fmt_title)
    
    headers4 = [
        "Issue ID", "Operational Problem", "What the Tester Sees",
        "Technical Root Cause", "Exact Step-by-Step Recovery Procedure", "Visual Evidence Screenshot"
    ]
    for c_idx, h in enumerate(headers4):
        ws4.write(3, c_idx, h, fmt_th)
        
    ts_data = [
        ("TS-01", "Duplicate Patient Registration",
         "Red error modal displaying 'IntegrityError' or 'Unique constraint violation: gnuhealth_patient_name_uniq'.",
         "Clicking '+' (New Record) and re-typing an existing person's name violates the party uniqueness constraint.",
         "1. Click 'Close' on modal.\n2. In Patients list, search existing name.\n3. Double-click to open and edit existing record.\n4. NEVER click '+' to update existing patients.",
         "ts_01_duplicate_patient_recovery.png"),
         
        ("TS-02", "Missing Patient Evaluations Menu",
         "Nurse expands 'Health' in left navigation tree but cannot find 'Patient Evaluations'.",
         "Stock Tryton nested evaluations under Health -> Appointments. Enterprise deployment required top-level menu.",
         "1. Verify user belongs to 'Health Nurse' or 'Health Doctor' group.\n2. In left navigation panel, expand Health.\n3. Locate 'Patient Evaluations' at sequence 25 (Menu ID 252).",
         "ts_02_eval_menu_restoration.png"),
         
        ("TS-03", "Active Filter Hiding Records",
         "Created appointment or invoice disappears from table after state transition (Checked In / Paid).",
         "Tryton list views apply default bookmark filters (e.g. State: 'Confirmed' or State: 'Draft').",
         "1. Inspect search bar at top of list view.\n2. Locate active filter tag (e.g. 'Confirmed').\n3. Click the small 'x' icon to remove filter.\n4. All records reappear instantly.",
         "ts_03_filter_reset.png"),
         
        ("TS-04", "Missing CBC Analyte Rows",
         "Tester cannot find 'LOAD ANALYTES CRITERIA' button or cannot enter Hemoglobin test value.",
         "Navigating to 'Lab: New order' (Menu ID 230 - batch wizard) instead of 'Lab Results' (Menu ID 229).",
         "1. Close the order wizard.\n2. In left tree, click Health -> Laboratory -> 'Lab Results'.\n3. Click '+' for new result.\n4. Select CBC and click LOAD ANALYTES CRITERIA.",
         "ts_04_lab_screen_distinction.png"),
         
        ("TS-05", "Radiology Findings Field Missing",
         "Tester searches for a field labeled 'Clinical Findings' on the Imaging Request form.",
         "Database model field is named 'comment', which renders on screen with label 'Additional Information'.",
         "1. Locate large multi-line text area labeled 'Additional Information'.\n2. Enter all diagnostic report findings into this field.\n3. Click Save then Generate Results.",
         "ts_05_rad_field_clarification.png"),
         
        ("TS-06", "General Ledger Access Denied",
         "Cashier attempts to view Account Moves and receives access restriction or cannot see menu.",
         "Role segregation (RBAC) restricts Cashiers from accessing or editing General Ledger journal entries.",
         "1. Log out of Cashier account.\n2. Log in using authorized Financial Auditor or Accountant account.\n3. Navigate to Financial -> Entries -> Account Moves.",
         "ts_06_gl_permission_recovery.png")
    ]
    
    for r_idx, row in enumerate(ts_data, 4):
        ws4.set_row(r_idx, 56)
        for c_idx, val in enumerate(row):
            fmt = fmt_cell
            if c_idx == 0:
                fmt = fmt_cell_bold
            ws4.write(r_idx, c_idx, val, fmt)

    wb.close()
    print(f"SUCCESS: Saved {OUT_XLSX}")

if __name__ == "__main__":
    create_execution_sheet()
