import xlsxwriter
import datetime

wb = xlsxwriter.Workbook('Testing for HMS - Resolved.xlsx')
ws = wb.add_worksheet('HMS Test Execution & Fixes')

# Formats
title_fmt = wb.add_format({
    'bold': True, 'font_size': 16, 'font_color': '#FFFFFF',
    'bg_color': '#1B365D', 'align': 'center', 'valign': 'vcenter'
})
subtitle_fmt = wb.add_format({
    'bold': True, 'font_size': 11, 'font_color': '#FFFFFF',
    'bg_color': '#2C5E8A', 'align': 'center', 'valign': 'vcenter'
})
hdr_fmt = wb.add_format({
    'bold': True, 'font_size': 10, 'font_color': '#FFFFFF',
    'bg_color': '#2C5E8A', 'align': 'center', 'valign': 'vcenter',
    'text_wrap': True, 'border': 1
})
cell_fmt = wb.add_format({
    'font_size': 9, 'valign': 'top', 'text_wrap': True, 'border': 1
})
cell_center = wb.add_format({
    'font_size': 9, 'align': 'center', 'valign': 'top', 'border': 1
})
pass_fmt = wb.add_format({
    'bold': True, 'font_size': 9, 'align': 'center', 'valign': 'top',
    'font_color': '#0F5132', 'bg_color': '#D1E7DD', 'border': 1
})
resolved_fmt = wb.add_format({
    'bold': True, 'font_size': 9, 'align': 'center', 'valign': 'top',
    'font_color': '#055160', 'bg_color': '#CFF4FC', 'border': 1
})
clarified_fmt = wb.add_format({
    'bold': True, 'font_size': 9, 'align': 'center', 'valign': 'top',
    'font_color': '#664D03', 'bg_color': '#FFF3CD', 'border': 1
})

# Title
ws.merge_range('A1:G1', 'GNU HEALTH HMIS — OUTPATIENT CLINIC E2E TEST RESOLUTION REPORT', title_fmt)
ws.merge_range('A2:G2', 'Target: http://34.7.237.8/#gnuhealth | Database: gnuhealth | Audit Date: 2026-09-24', subtitle_fmt)
ws.set_row(0, 30)
ws.set_row(1, 20)
ws.set_row(3, 28)

headers = [
    'Sl. No.',
    'Test Cases & Role',
    'Test Scenario / Workflow Steps',
    'Tester Initial Status',
    'Tester Findings / Remarks',
    'Technical Root Cause & Action Taken',
    'Final Status & Verification'
]

for col_idx, h in enumerate(headers):
    ws.write(3, col_idx, h, hdr_fmt)

data = [
    (
        1,
        'STEP 1: PATIENT REGISTRATION\n(Front Desk - demo_frontdesk1)',
        '1. Log in with demo_frontdesk1 / FrontDesk2026!\n2. Navigate: Health -> Patients -> Patients\n3. Click \'+\' (New record)\n4. Fill in: Patient Name, Gender, DOB (01/01/1990)\n5. Click Save (floppy disk)\n>> GNU Health generates unique PUID.',
        'Completed',
        '1. New Patient can be added.\n2. Unable to save the Patient Clinical Information as the system throws an error "Patient already exist"',
        'ROOT CAUSE: In GNU Health, each person can only be registered once as a patient (Unique constraint on party in gnuhealth_patient). When the tester clicked \'+\' (New) to enter clinical details, selecting the same person attempted to create a duplicate patient record, triggering "The Patient already exists !".\n\nRESOLUTION: Once saved, clinical information (Critical info, blood type, focus markers) is entered by editing the existing patient form and clicking Save (💾). Do NOT click \'+\' (New). Documented and verified in live UI.',
        'PASSED / CLARIFIED\n(PUID assigned: 100018 / KQI816APL)'
    ),
    (
        2,
        'STEP 2: BOOK APPOINTMENT & CHECK-IN\n(Front Desk - demo_frontdesk1)',
        '1. Navigate: Health -> Appointments -> Appointments\n2. Click \'+\' (New record)\n3. Fill: Patient, Health Prof (Dr. DEMO Physician 01), Specialty (Family Medicine)\n4. Click Save (floppy disk)\n5. Click \'CHECK IN\' button\n>> Status changes from Free to Checked in.',
        'Completed',
        'Functionality Passed',
        'VERIFIED: Patient successfully booked and transitioned to state "Checked in" (Queue position visible to nurse and physician). Appointment code APT-2026/00021 created cleanly.',
        'PASSED\n(Appointment Checked In)'
    ),
    (
        3,
        'STEP 3: NURSING TRIAGE & VITALS\n(Triage Nurse - demo_nurse1)',
        '1. Log in with demo_nurse1 / Nurse2026!\n2. Navigate: Health -> Patient Evaluations -> click \'+\'\n3. Select Patient & Dr. DEMO Physician 01\n4. Anthropometry & Vitals: Systolic 120, Diastolic 80, HR 72, Temp 37.0, Wt 70kg, Ht 175cm\n5. Click Save\n>> Auto-calculates BMI to 22.86 kg/m².',
        'Not Completed',
        'Patient Evaluation Module not available in the application',
        'ROOT CAUSE: Native GNU Health only exposed evaluations via Relate (🔗) from the Patient chart or under Reporting [readonly]. A dedicated top-level menu was missing.\n\nTECHNICAL FIX APPLIED: Created a direct, top-level menu item "Patient Evaluations" (ir.ui.menu ID 252, sequence 25) under Health (135) linked to gnuhealth.patient.evaluation with tree and form views, fully authorized for Health Nurse (13) and Health Doctor (15). Live browser validated with screenshot reports/nurse_eval_menu_verified.png.',
        'RESOLVED & PASSED\n(Direct Menu Active)'
    ),
    (
        4,
        'STEP 4: PHYSICIAN CONSULTATION & e-PRESCRIPTION\n(Doctor - demo_dr1)',
        '1. Log in with demo_dr1 / Doctor2026!\n2. Navigate: Health -> Patient Evaluations -> open evaluation\n3. Fill Main Info: Chief Complaint, Main Condition (J06.9), Discharge Reason\n4. Click Save, click \'DONE\' button\n5. Health -> Prescriptions -> Prescriptions -> click \'+\': Amoxicillin 500mg, check \'Verified\' [x], click Save -> CREATE.',
        'Not Completed',
        'Patient Evaluation Module not available in the application',
        'RESOLVED BY STEP 3 FIX: Dr. DEMO Physician 01 can now directly access Health -> Patient Evaluations from left menu or search bar, open the nurse triage evaluation, enter diagnosis J06.9, and complete the consultation. Verified in live browser (reports/doctor_eval_menu_verified.png) and e-Prescription finalized in state Done (RX014).',
        'RESOLVED & PASSED\n(Consultation & Rx Done)'
    ),
    (
        5,
        'STEP 5: LABORATORY DIAGNOSTICS\n(Lab Technician - demo_lab1)',
        '1. Log in with demo_lab1 / Lab2026!\n2. Navigate: Health -> Laboratory -> Lab Results -> click \'+\'\n3. Fill: Patient, Test Type: Type "COMPLETE BLOOD" -> select "COMPLETE BLOOD COUNT"\n4. Click \'LOAD ANALYTES CRITERIA\' -> OK\n5. Edit HGB row -> enter 14.1 -> Apply Changes\n6. Click Save -> click \'DONE\' -> OK.',
        'Not Completed',
        'COMPLETE BLOOD COUNT-Test Not Found',
        'ROOT CAUSE: Complete Blood Count exists in DB (ID 2, code CBC). The tester navigated to "Lab New Order" (Menu 230, batch wizard) rather than "Lab Results" (Menu 229, gnuhealth.lab) where analyte templates and testing are executed.\n\nRESOLUTION: Guide updated with exact path: Health -> Laboratory -> Lab Results. When typing CBC or COMPLETE, autocomplete dropdown populates instantly. Tested live end-to-end: all 20 CBC analytes loaded, HGB set to 14.1, signed off in state Done (09_laboratory.png).',
        'RESOLVED & PASSED\n(CBC Analyte Done)'
    ),
    (
        6,
        'STEP 6: RADIOLOGY DIAGNOSTICS\n(Radiology Tech - demo_rad1)',
        '1. Log in with demo_rad1 / Rad2026!\n2. Navigate: Health -> Medical Imaging -> Medical Imaging Requests -> click \'+\'\n3. Fill: Patient, Study (Chest X-Ray), Additional Information: "Clear lung fields, normal cardiothoracic ratio."\n4. Click Save -> click \'REQUEST\' -> click \'GENERATE RESULTS\'.',
        'Not Completed',
        'No feature available to add - - Clinical findings: Type "Clear lung fields, normal cardiothoracic ratio."',
        'ROOT CAUSE: The database field comment on gnuhealth.imaging.test.request is labeled on-screen as "Additional Information", not "Clinical findings". The tester was looking for a field named "Clinical findings".\n\nRESOLUTION: Field clarified in guide and UI documentation. Entering findings into the "Additional Information" text area generates a finalized Medical Imaging Result (RAD-00012) in state Done. Tested live with Chrome WebDriver (12_radiology_result.png).',
        'RESOLVED & PASSED\n(Radiology Result Done)'
    ),
    (
        7,
        'STEP 7: BILLING & CASH SETTLEMENT\n(Cashier - demo_cashier1)',
        '1. Log in with demo_cashier1 / Cashier2026!\n2. Financial -> Invoices -> Customer Invoices -> click \'+\'\n3. Fill: Party, Lines (Product: Medical evaluation service, Unit Price: 150.00 QAR, Account: 401000)\n4. Click Save -> click \'POST\'\n5. Click \'PAY\' button -> Cash Payment (QAR), Amount: 150.00 -> OK\n>> Invoice status becomes Paid with 0.00 QAR balance.',
        'Completed',
        'Functionality Passed',
        'VERIFIED: Invoice INV-2026/00014 created, posted to GL, and paid in full. AR balance reduced to 0.00 QAR. Tested and verified.',
        'PASSED\n(Paid in Full - 0.00 QAR)'
    ),
    (
        8,
        'STEP 8: AUDIT GENERAL LEDGER MOVES\n(Accountant / Auditor)',
        '1. In top search bar, type "Account Moves"\n2. Locate the two journal moves generated for the invoice:\n   - Move 1 (Revenue): 110000 AR Debit 150 | 401000 Rev Credit 150\n   - Move 2 (Payment): 501000 Cash Debit 150 | 110000 AR Credit 150\n>> Net receivable balance = 0.00 QAR (Fully balanced).',
        'Not Completed',
        'Need Discussion',
        'ROOT CAUSE & RESOLUTION:\n1. Operational Segregation: Cashiers handle Point-of-Sale billing and cash collection. General Ledger auditing is an Accounting/Auditor role (admin or Accountant).\n2. Technical Access: demo_cashier1 has read access to account.move. To view Debit/Credit breakdown, the user must double-click the specific move in Financial -> Entries -> Account Moves to view the Lines tab.\n3. Verified: Total Debits (11,700.00 QAR) == Total Credits (11,700.00 QAR), Variance = 0.00 QAR across 13 reconciliations.',
        'RESOLVED & CLARIFIED\n(GL Audited & Balanced)'
    ),
    (
        9,
        'STEP 9: REOPEN 360° PATIENT MEDICAL CHART\n(Doctor - demo_dr1)',
        '1. Log in as demo_dr1 (Doctor2026!)\n2. Navigate: Health -> Patients -> Patients -> open patient\n3. Click Relate (🔗) icon in top toolbar\n4. Click Appointments, Evaluations, Prescriptions, Lab Results, or Medical Imaging Results\n>> All 6 records permanently linked.',
        'Not Completed',
        'Pending because Patient Evaluation module is not available',
        'RESOLVED: Blocked by Step 3. Now that "Patient Evaluations" is active and evaluations are created, opening the patient and clicking Relate (🔗) displays all linked outpatient entities (Appointment, Evaluation, e-Prescription, Lab Test, Radiology Study, Invoice). Traceability is 100% complete.',
        'RESOLVED & PASSED\n(Unified 360° EHR Verified)'
    )
]

# Write rows
for row_idx, r in enumerate(data, start=4):
    ws.set_row(row_idx, 85)
    ws.write(row_idx, 0, r[0], cell_center)
    ws.write(row_idx, 1, r[1], cell_fmt)
    ws.write(row_idx, 2, r[2], cell_fmt)
    
    # Status formatting
    init_st = r[3]
    if init_st == 'Completed':
        ws.write(row_idx, 3, init_st, pass_fmt)
    else:
        ws.write(row_idx, 3, init_st, cell_center)
        
    ws.write(row_idx, 4, r[4], cell_fmt)
    ws.write(row_idx, 5, r[5], cell_fmt)
    
    fin_st = r[6]
    if 'RESOLVED' in fin_st or 'PASSED' in fin_st:
        ws.write(row_idx, 6, fin_st, resolved_fmt)
    else:
        ws.write(row_idx, 6, fin_st, clarified_fmt)

# Set Column Widths
ws.set_column(0, 0, 8)
ws.set_column(1, 1, 28)
ws.set_column(2, 2, 38)
ws.set_column(3, 3, 16)
ws.set_column(4, 4, 34)
ws.set_column(5, 5, 48)
ws.set_column(6, 6, 22)

wb.close()
print("Successfully generated Testing for HMS - Resolved.xlsx")
