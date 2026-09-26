import os
import zipfile
import xml.sax.saxutils as saxutils

DOCX_PATH = r"c:\Users\MohammedSohail\OneDrive - IRISSTAR TECHNOLOGIES\GNU Health\GNU_Health_Hands_On_Testing_Guide.docx"

content_types = """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
  <Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/>
</Types>"""

root_rels = """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>"""

doc_rels = """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
</Relationships>"""

styles_xml = """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:docDefaults>
    <w:rPrDefault>
      <w:rPr>
        <w:rFonts w:ascii="Calibri" w:hAnsi="Calibri" w:cs="Arial"/>
        <w:sz w:val="22"/>
        <w:color w:val="262626"/>
      </w:rPr>
    </w:rPrDefault>
    <w:pPrDefault>
      <w:pPr>
        <w:spacing w:after="140" w:line="260" w:lineRule="auto"/>
      </w:pPr>
    </w:pPrDefault>
  </w:docDefaults>
  <w:style w:type="paragraph" w:styleId="Normal" w:default="1">
    <w:name w:val="Normal"/>
  </w:style>
  <w:style w:type="paragraph" w:styleId="Title">
    <w:name w:val="Title"/>
    <w:pPr>
      <w:spacing w:before="360" w:after="120"/>
      <w:jc w:val="center"/>
    </w:pPr>
    <w:rPr>
      <w:rFonts w:ascii="Calibri Light" w:hAnsi="Calibri Light"/>
      <w:b/>
      <w:sz w:val="42"/>
      <w:color w:val="1F4E79"/>
    </w:rPr>
  </w:style>
  <w:style w:type="paragraph" w:styleId="Subtitle">
    <w:name w:val="Subtitle"/>
    <w:pPr>
      <w:spacing w:before="40" w:after="300"/>
      <w:jc w:val="center"/>
    </w:pPr>
    <w:rPr>
      <w:rFonts w:ascii="Calibri" w:hAnsi="Calibri"/>
      <w:i/>
      <w:sz w:val="24"/>
      <w:color w:val="595959"/>
    </w:rPr>
  </w:style>
  <w:style w:type="paragraph" w:styleId="Heading1">
    <w:name w:val="heading 1"/>
    <w:pPr>
      <w:spacing w:before="360" w:after="140"/>
    </w:pPr>
    <w:rPr>
      <w:rFonts w:ascii="Calibri Light" w:hAnsi="Calibri Light"/>
      <w:b/>
      <w:sz w:val="30"/>
      <w:color w:val="1F4E79"/>
    </w:rPr>
  </w:style>
</w:styles>"""

def escape(s):
    return saxutils.escape(str(s))

def p_xml(text, style="Normal", bold=False, italic=False, color="", bullet=False):
    p = "<w:p>"
    if style != "Normal":
        p += f'<w:pPr><w:pStyle w:val="{style}"/></w:pPr>'
    p += "<w:r><w:rPr>"
    if bold:
        p += "<w:b/>"
    if italic:
        p += "<w:i/>"
    if color:
        p += f'<w:color w:val="{color}"/>'
    p += '</w:rPr><w:t xml:space="preserve">'
    clean = escape(text)
    if bullet:
        clean = "• " + clean
    p += f"{clean}</w:t></w:r></w:p>"
    return p

def alert_xml(title, msg):
    return (
        '<w:p><w:pPr><w:pBdr><w:left w:val="single" w:sz="24" w:space="15" w:color="007ACC"/></w:pBdr>'
        '<w:shd w:val="clear" w:color="auto" w:fill="F0F4F8"/><w:spacing w:before="120" w:after="120"/></w:pPr>'
        f'<w:r><w:rPr><w:b/><w:color w:val="005A9E"/></w:rPr><w:t xml:space="preserve">{escape(title)}: </w:t></w:r>'
        f'<w:r><w:rPr><w:color w:val="262626"/></w:rPr><w:t xml:space="preserve">{escape(msg)}</w:t></w:r></w:p>'
    )

def table_xml(headers, rows):
    out = [
        '<w:tbl><w:tblPr><w:tblW w:w="9500" w:type="dxa"/><w:tblBorders>'
        '<w:top w:val="single" w:sz="6" w:color="D3D3D3"/><w:left w:val="none"/>'
        '<w:bottom w:val="single" w:sz="12" w:color="1F4E79"/><w:right w:val="none"/>'
        '<w:insideH w:val="single" w:sz="4" w:color="E0E0E0"/><w:insideV w:val="none"/>'
        '</w:tblBorders></w:tblPr>'
    ]
    # Header
    out.append('<w:tr><w:trPr><w:tblHeader/></w:trPr>')
    for h in headers:
        out.append(
            f'<w:tc><w:tcPr><w:shd w:val="clear" w:color="auto" w:fill="1F4E79"/></w:tcPr>'
            f'<w:p><w:r><w:rPr><w:b/><w:color w:val="FFFFFF"/></w:rPr><w:t>{escape(h)}</w:t></w:r></w:p></w:tc>'
        )
    out.append('</w:tr>')
    # Rows
    for r in rows:
        out.append('<w:tr>')
        for c in r:
            out.append(f'<w:tc><w:p><w:r><w:t>{escape(c)}</w:t></w:r></w:p></w:tc>')
        out.append('</w:tr>')
    out.append('</w:tbl>')
    return "".join(out)

doc_parts = [
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>',
    '<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">',
    '<w:body>',
    p_xml("GNU HEALTH HMIS — HANDS-ON OPERATIONAL TESTING GUIDE", "Title"),
    p_xml("Step-by-Step E2E Clinical & Financial Transaction Walkthrough", "Subtitle"),
    p_xml("Testing Environment URL: http://34.7.237.8/#gnuhealth", bold=True, color="1F4E79"),
    p_xml("Database Target: gnuhealth (pre-selected by URL hash)"),
    p_xml("Standard Currency: Qatari Riyal (QAR)"),
    alert_xml("CRITICAL PASSWORD CASING RULE", "All passwords are strictly case-sensitive and end with an exclamation mark (!). Note that Front Desk is FrontDesk2026! with both Capital F and Capital D."),
    
    p_xml("Department Credentials Quick Reference", "Heading1"),
    table_xml(
        ["Department / Role", "Username", "Exact Password", "Key Operational Scope"],
        [
            ["Front Desk Reception", "demo_frontdesk1", "FrontDesk2026!", "Patient registration, scheduling, check-in"],
            ["Triage Nurse", "demo_nurse1", "Nurse2026!", "Triage queue, vital signs, anthropometry (BMI)"],
            ["Attending Doctor", "demo_dr1", "Doctor2026!", "Consultation, SOAP notes, ICD-10 diagnosis, e-Prescriptions"],
            ["Laboratory Tech", "demo_lab1", "Lab2026!", "Specimen analysis, CBC analytes, test validation"],
            ["Radiology Tech", "demo_rad1", "Rad2026!", "Imaging orders, Chest X-Ray execution & findings"],
            ["Cashier / Billing", "demo_cashier1", "Cashier2026!", "Service invoicing, cash collection, General Ledger"],
            ["System Administrator", "admin", "Admin12345!", "Full system configuration, accounting, user roles"]
        ]
    ),
    
    p_xml("STEP 1: Patient Registration (Front Desk)", "Heading1"),
    p_xml("Log in with demo_frontdesk1 and password FrontDesk2026!.", bullet=True),
    p_xml("Navigate to Health -> Patients -> Patients (or type Patients in the top search bar).", bullet=True),
    p_xml("Click the '+' (New) icon in the top toolbar.", bullet=True),
    p_xml("In the Patient field, type test patient name (e.g. AHMED AL-MANSOORI) and press Tab. Click Create/OK.", bullet=True),
    p_xml("Select Gender (Male or Female) and Date of Birth (e.g. 01/01/1990).", bullet=True),
    p_xml("Click the Save (floppy disk) icon in the top toolbar.", bullet=True),
    alert_xml("VERIFICATION 1", "Notice GNU Health generates an official unique Medical Record Number (PUID) like KQI816APL automatically."),
    alert_xml("PATIENT CLINICAL INFO RULE", "Each person can only have ONE patient file (Unique party). Once saved, to enter additional clinical notes or focus markers, stay on this existing patient form and click Save. Do NOT click '+' (New), which would attempt to create a duplicate patient record."),
    
    p_xml("STEP 2: Book Appointment & Check-In (Front Desk)", "Heading1"),
    p_xml("Navigate to Health -> Appointments -> Appointments.", bullet=True),
    p_xml("Click '+' (New). Select your Patient, Health Prof: 'Dr. DEMO Physician 01', Specialty: 'Family Medicine'.", bullet=True),
    p_xml("Click Save (floppy disk).", bullet=True),
    p_xml("With the appointment open, click the 'CHECK IN' action button.", bullet=True),
    p_xml("Log out by clicking username at top-right -> Logout (or click the exit door icon).", bullet=True),
    alert_xml("VERIFICATION 2", "The appointment status badge changes from Free to Checked in."),
    
    p_xml("STEP 3: Nursing Triage & Vital Signs (Triage Nurse)", "Heading1"),
    p_xml("Log in with demo_nurse1 and password Nurse2026!.", bullet=True),
    p_xml("Navigate to Health -> Patient Evaluations (or search 'Patient Evaluations' in the top search bar) -> click '+' (New).", bullet=True),
    p_xml("Select Patient and Health Prof 'Dr. DEMO Physician 01'.", bullet=True),
    p_xml("Under Anthropometry & Vitals sub-tab, enter: Systolic: 120, Diastolic: 80, Heart Rate: 72, Temp: 37.0, Weight: 70, Height: 175.", bullet=True),
    p_xml("Click Save and log out.", bullet=True),
    alert_xml("VERIFICATION 3", "System automatically computes BMI to 22.86 kg/m2 (Normal weight) upon saving. (Alternative access: Health -> Patients -> Patients -> Relate -> Evaluations)."),
    
    p_xml("STEP 4: Physician Consultation & e-Prescription (Doctor)", "Heading1"),
    p_xml("Log in with demo_dr1 and password Doctor2026!.", bullet=True),
    p_xml("Navigate to Health -> Patient Evaluations -> double-click the nurse's evaluation from the list.", bullet=True),
    p_xml("Under Main Info tab: Chief Complaint: 'Patient presents with mild cough and sore throat.' Main Condition: 'J06.9' (Acute upper respiratory infection). Discharge: 'Home / Selfcare'.", bullet=True),
    p_xml("Click Save, then click the 'DONE' action button at the top.", bullet=True),
    p_xml("Navigate to Health -> Prescriptions -> Prescriptions -> click '+' (New).", bullet=True),
    p_xml("Select Patient. Under Prescription Lines click '+' -> Medicament: 'Amoxicillin 500mg' -> Click OK.", bullet=True),
    p_xml("Check the 'Verified' [x] checkbox (mandatory clinical safety rule). Click Save -> click 'CREATE' action button.", bullet=True),
    p_xml("Log out.", bullet=True),
    alert_xml("VERIFICATION 4", "Prescription status transitions to Done with official prescription number RX014."),
    
    p_xml("STEP 5: Laboratory Diagnostics (Lab Technician)", "Heading1"),
    p_xml("Log in with demo_lab1 and password Lab2026!.", bullet=True),
    p_xml("Navigate to Health -> Laboratory -> Lab Results (or search 'Lab Results') -> click '+' (New).", bullet=True),
    p_xml("Select Patient. In the 'Test type' field, type 'COMPLETE BLOOD' or 'CBC' and click 'COMPLETE BLOOD COUNT' from the dropdown.", bullet=True),
    p_xml("Select Health Prof: 'Dr. DEMO Physician 01'.", bullet=True),
    p_xml("Click 'LOAD ANALYTES CRITERIA' in toolbar -> Click OK. (All 20 CBC analytes populate).", bullet=True),
    p_xml("Double-click Hemoglobin (HGB) row, enter 14.1, apply changes.", bullet=True),
    p_xml("Click Save, then click 'DONE' action button -> Click OK. Log out.", bullet=True),
    alert_xml("VERIFICATION 5", "Lab test status transitions to Done, locking diagnostic findings against modification."),
    
    p_xml("STEP 6: Radiology Diagnostics (Radiology Technician)", "Heading1"),
    p_xml("Log in with demo_rad1 and password Rad2026!.", bullet=True),
    p_xml("Navigate to Health -> Medical Imaging -> Medical Imaging Requests -> click '+' (New).", bullet=True),
    p_xml("Select Patient. Study: 'Chest X-Ray'.", bullet=True),
    p_xml("Additional Information: In the large text area labeled 'Additional Information', type: 'Clear lung fields, normal cardiothoracic ratio.'.", bullet=True),
    p_xml("Click Save -> click 'REQUEST' -> click 'GENERATE RESULTS'. Log out.", bullet=True),
    alert_xml("VERIFICATION 6", "Medical Imaging Result generated with status Done (RAD-00012)."),
    
    p_xml("STEP 7: Billing & Cash Settlement (Cashier)", "Heading1"),
    p_xml("Log in with demo_cashier1 and password Cashier2026!.", bullet=True),
    p_xml("Navigate to Financial -> Invoices -> Customer Invoices -> click '+' (New).", bullet=True),
    p_xml("Select Party (Patient). Under Lines click '+' -> Product: 'Medical evaluation service', Unit Price: 150.00, Account: 401000 - Main Revenue -> OK.", bullet=True),
    p_xml("Click Save -> click 'POST' button. (Invoice INV-2026/000xx assigned).", bullet=True),
    p_xml("Click 'PAY' button -> Payment Method: 'Cash Payment (QAR)', Amount: 150.00 -> OK.", bullet=True),
    alert_xml("VERIFICATION 7", "Invoice state transitions to Paid with 0.00 QAR remaining balance."),
    
    p_xml("STEP 8: Audit General Ledger Double-Entry Moves", "Heading1"),
    p_xml("Search 'Account Moves' in top bar (or Financial -> Entries -> Account Moves).", bullet=True),
    p_xml("Double-click the move generated for your invoice to view Debit and Credit breakdown:", bullet=True),
    p_xml("Move 1 (Revenue): Receivable Debit 150.00 QAR / Main Revenue Credit 150.00 QAR.", bullet=True),
    p_xml("Move 2 (Payment): Cash Debit 150.00 QAR / Receivable Credit 150.00 QAR.", bullet=True),
    alert_xml("VERIFICATION 8", "Total Debits = Total Credits (Net receivables balance = 0.00 QAR). Cashiers handle POS collection; General Ledger audit is typically performed by the Accountant."),
    
    p_xml("STEP 9: Reopen 360-Degree Patient Chart", "Heading1"),
    p_xml("Log in as demo_dr1 (Doctor2026!).", bullet=True),
    p_xml("Open Health -> Patients -> Patients -> double-click your patient.", bullet=True),
    p_xml("Click the 'Relate' (link) icon in the top toolbar.", bullet=True),
    p_xml("Open Appointments, Evaluations, Prescriptions, Lab Results, and Medical Imaging Results.", bullet=True),
    alert_xml("VERIFICATION 9", "All 6 clinical and billing records are permanently linked to the patient chart."),
    
    p_xml("Troubleshooting Tips & Tester FAQ", "Heading1"),
    p_xml("Patient already exists: Stay on the current form to add clinical info; do NOT click '+' (New).", bullet=True),
    p_xml("Patient Evaluations missing: Navigate directly to Health -> Patient Evaluations in sidebar or search bar.", bullet=True),
    p_xml("Lab Test not found: Open Health -> Laboratory -> Lab Results (not Lab New Order). Type CBC or COMPLETE in Test type.", bullet=True),
    p_xml("Radiology findings: Clinical findings are entered in the text area labeled 'Additional Information'.", bullet=True),
    p_xml("Password loops: Re-type carefully. Front Desk is FrontDesk2026! with Capital F and Capital D.", bullet=True),
    p_xml("URL target: Always use http://34.7.237.8/#gnuhealth to lock in the gnuhealth database.", bullet=True),
    p_xml("Filter tabs: If records are not showing in list view, click the 'All' tab at the top of the table.", bullet=True),
    
    '</w:body></w:document>'
]

document_xml = "\n".join(doc_parts)

with zipfile.ZipFile(DOCX_PATH, 'w', zipfile.ZIP_DEFLATED) as z:
    z.writestr('[Content_Types].xml', content_types)
    z.writestr('_rels/.rels', root_rels)
    z.writestr('word/_rels/document.xml.rels', doc_rels)
    z.writestr('word/styles.xml', styles_xml)
    z.writestr('word/document.xml', document_xml)

print(f"Successfully generated DOCX at {DOCX_PATH} ({os.path.getsize(DOCX_PATH)} bytes)")
