# Script to generate the comprehensive Word Document (.docx) for GNU Health HMIS
[CmdletBinding()]
param(
    [string]$OutputPath = "c:\Users\MohammedSohail\OneDrive - IRISSTAR TECHNOLOGIES\GNU Health\GNU_Health_HMIS_System_Functioning_and_Workflow_Guide.docx"
)

Add-Type -AssemblyName System.IO.Compression.FileSystem

$tempDir = Join-Path $env:TEMP "gnuhealth_docx_$([Guid]::NewGuid().ToString('N'))"
if (Test-Path $tempDir) { Remove-Item $tempDir -Recurse -Force }
New-Item -ItemType Directory -Path (Join-Path $tempDir "_rels") | Out-Null
New-Item -ItemType Directory -Path (Join-Path $tempDir "word\_rels") | Out-Null

Write-Host "Creating document package structure in $tempDir..." -ForegroundColor Cyan

# 1. [Content_Types].xml
$contentTypes = @'
<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
  <Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/>
</Types>
'@
[System.IO.File]::WriteAllText((Join-Path $tempDir "[Content_Types].xml"), $contentTypes, [System.Text.Encoding]::UTF8)

# 2. _rels/.rels
$rootRels = @'
<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>
'@
[System.IO.File]::WriteAllText((Join-Path $tempDir "_rels\.rels"), $rootRels, [System.Text.Encoding]::UTF8)

# 3. word/_rels/document.xml.rels
$docRels = @'
<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
</Relationships>
'@
[System.IO.File]::WriteAllText((Join-Path $tempDir "word\_rels\document.xml.rels"), $docRels, [System.Text.Encoding]::UTF8)

# 4. word/styles.xml
$styles = @'
<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
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
        <w:spacing w:after="160" w:line="260" w:lineRule="auto"/>
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
      <w:sz w:val="44"/>
      <w:color w:val="1F4E79"/>
    </w:rPr>
  </w:style>
  <w:style w:type="paragraph" w:styleId="Subtitle">
    <w:name w:val="Subtitle"/>
    <w:pPr>
      <w:spacing w:before="60" w:after="360"/>
      <w:jc w:val="center"/>
    </w:pPr>
    <w:rPr>
      <w:rFonts w:ascii="Calibri" w:hAnsi="Calibri"/>
      <w:i/>
      <w:sz w:val="26"/>
      <w:color w:val="595959"/>
    </w:rPr>
  </w:style>
  <w:style w:type="paragraph" w:styleId="Heading1">
    <w:name w:val="heading 1"/>
    <w:pPr>
      <w:spacing w:before="400" w:after="160"/>
    </w:pPr>
    <w:rPr>
      <w:rFonts w:ascii="Calibri Light" w:hAnsi="Calibri Light"/>
      <w:b/>
      <w:sz w:val="34"/>
      <w:color w:val="1F4E79"/>
    </w:rPr>
  </w:style>
  <w:style w:type="paragraph" w:styleId="Heading2">
    <w:name w:val="heading 2"/>
    <w:pPr>
      <w:spacing w:before="280" w:after="120"/>
    </w:pPr>
    <w:rPr>
      <w:rFonts w:ascii="Calibri Light" w:hAnsi="Calibri Light"/>
      <w:b/>
      <w:sz w:val="28"/>
      <w:color w:val="2E75B6"/>
    </w:rPr>
  </w:style>
  <w:style w:type="paragraph" w:styleId="Heading3">
    <w:name w:val="heading 3"/>
    <w:pPr>
      <w:spacing w:before="200" w:after="80"/>
    </w:pPr>
    <w:rPr>
      <w:rFonts w:ascii="Calibri" w:hAnsi="Calibri"/>
      <w:b/>
      <w:sz w:val="24"/>
      <w:color w:val="1F4E79"/>
    </w:rPr>
  </w:style>
</w:styles>
'@
[System.IO.File]::WriteAllText((Join-Path $tempDir "word\styles.xml"), $styles, [System.Text.Encoding]::UTF8)

# 5. Build word/document.xml with complete detailed content
$sb = [System.Text.StringBuilder]::new()
[void]$sb.Append(@'
<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>
'@)

function Escape-Xml([string]$text) {
    if ([string]::IsNullOrEmpty($text)) { return "" }
    return $text.Replace("&", "&amp;").Replace("<", "&lt;").Replace(">", "&gt;").Replace('"', "&quot;").Replace("'", "&apos;")
}

function Add-P([string]$text, [string]$style = $null, [switch]$Bold, [string]$Color = $null, [int]$Size = 0, [string]$Align = $null, [int]$SpaceBefore = 0, [int]$SpaceAfter = 160) {
    $pPr = "<w:pPr>"
    if ($style) { $pPr += "<w:pStyle w:val=""$style""/>" }
    if ($Align) { $pPr += "<w:jc w:val=""$Align""/>" }
    $pPr += "<w:spacing w:before=""$SpaceBefore"" w:after=""$SpaceAfter"" w:line=""260"" w:lineRule=""auto""/>"
    $pPr += "</w:pPr>"
    
    $rPr = ""
    if ($Bold -or $Color -or $Size -gt 0) {
        $rPr = "<w:rPr>"
        if ($Bold) { $rPr += "<w:b/>" }
        if ($Color) { $rPr += "<w:color w:val=""$Color""/>" }
        if ($Size -gt 0) { $rPr += "<w:sz w:val=""$Size""/>" }
        $rPr += "</w:rPr>"
    }
    
    $escaped = Escape-Xml $text
    [void]$sb.Append("<w:p>$pPr<w:r>$rPr<w:t xml:space=""preserve"">$escaped</w:t></w:r></w:p>")
}

function Add-Bullet([string]$label, [string]$text) {
    $pPr = '<w:pPr><w:ind w:left="480" w:hanging="240"/><w:spacing w:before="40" w:after="80" w:line="240" w:lineRule="auto"/></w:pPr>'
    $escapedLabel = Escape-Xml $label
    $escapedText = Escape-Xml $text
    [void]$sb.Append("<w:p>$pPr<w:r><w:rPr><w:b/><w:color w:val=""1F4E79""/></w:rPr><w:t xml:space=""preserve"">&#x2022; $escapedLabel</w:t></w:r><w:r><w:t xml:space=""preserve""> $escapedText</w:t></w:r></w:p>")
}

function Add-StepBullet([string]$stepNum, [string]$title, [string]$detail) {
    $pPr = '<w:pPr><w:ind w:left="560" w:hanging="360"/><w:spacing w:before="60" w:after="100" w:line="250" w:lineRule="auto"/></w:pPr>'
    $escapedStep = Escape-Xml $stepNum
    $escapedTitle = Escape-Xml $title
    $escapedDetail = Escape-Xml $detail
    [void]$sb.Append("<w:p>$pPr<w:r><w:rPr><w:b/><w:color w:val=""1F4E79""/></w:rPr><w:t xml:space=""preserve"">$escapedStep. </w:t></w:r><w:r><w:rPr><w:b/></w:rPr><w:t xml:space=""preserve"">$($escapedTitle): </w:t></w:r><w:r><w:t xml:space=""preserve"">$escapedDetail</w:t></w:r></w:p>")
}

function Add-Callout([string]$title, [string]$message, [string]$borderColor = "1F4E79", [string]$bgColor = "F0F4F8") {
    $eTitle = Escape-Xml $title
    $eMessage = Escape-Xml $message
    $tbl = @"
<w:tbl>
  <w:tblPr>
    <w:tblW w:w="9600" w:type="dxa"/>
    <w:tblBorders>
      <w:top w:val="none"/>
      <w:left w:val="single" w:sz="24" w:space="0" w:color="$borderColor"/>
      <w:bottom w:val="none"/>
      <w:right w:val="none"/>
      <w:insideH w:val="none"/>
      <w:insideV w:val="none"/>
    </w:tblBorders>
  </w:tblPr>
  <w:tr>
    <w:tc>
      <w:tcPr>
        <w:tcW w:w="9600" w:type="dxa"/>
        <w:shd w:val="clear" w:color="auto" w:fill="$bgColor"/>
        <w:tcMar>
          <w:top w:w="160" w:type="dxa"/>
          <w:left w:w="240" w:type="dxa"/>
          <w:bottom w:w="160" w:type="dxa"/>
          <w:right w:w="240" w:type="dxa"/>
        </w:tcMar>
      </w:tcPr>
      <w:p>
        <w:pPr><w:spacing w:before="0" w:after="60"/></w:pPr>
        <w:r><w:rPr><w:b/><w:color w:val="$borderColor"/><w:sz w:val="24"/></w:rPr><w:t xml:space="preserve">$eTitle</w:t></w:r>
      </w:p>
      <w:p>
        <w:pPr><w:spacing w:before="0" w:after="0"/></w:pPr>
        <w:r><w:t xml:space="preserve">$eMessage</w:t></w:r>
      </w:p>
    </w:tc>
  </w:tr>
</w:tbl>
<w:p><w:pPr><w:spacing w:before="0" w:after="160"/></w:pPr></w:p>
"@
    [void]$sb.Append($tbl)
}

function Add-Table([string[]]$headers, [System.Collections.ArrayList]$rows, [int[]]$colWidths = $null) {
    $colCount = $headers.Length
    if (-not $colWidths) {
        $w = [int](9600 / $colCount)
        $colWidths = @(for ($i=0; $i -lt $colCount; $i++) { $w })
    }
    
    $tbl = @"
<w:tbl>
  <w:tblPr>
    <w:tblW w:w="9600" w:type="dxa"/>
    <w:tblBorders>
      <w:top w:val="single" w:sz="6" w:space="0" w:color="B0C4DE"/>
      <w:left w:val="none"/>
      <w:bottom w:val="single" w:sz="8" w:space="0" w:color="1F4E79"/>
      <w:right w:val="none"/>
      <w:insideH w:val="single" w:sz="4" w:space="0" w:color="E0E4E8"/>
      <w:insideV w:val="none"/>
    </w:tblBorders>
    <w:tblCellMar>
      <w:top w:w="120" w:type="dxa"/>
      <w:left w:w="160" w:type="dxa"/>
      <w:bottom w:w="120" w:type="dxa"/>
      <w:right w:w="160" w:type="dxa"/>
    </w:tblCellMar>
  </w:tblPr>
  <w:tr>
    <w:trPr><w:tblHeader/></w:trPr>
"@
    for ($i=0; $i -lt $colCount; $i++) {
        $eH = Escape-Xml $headers[$i]
        $w = $colWidths[$i]
        $tbl += @"
    <w:tc>
      <w:tcPr>
        <w:tcW w:w="$w" w:type="dxa"/>
        <w:shd w:val="clear" w:color="auto" w:fill="1F4E79"/>
      </w:tcPr>
      <w:p>
        <w:pPr><w:spacing w:before="40" w:after="40"/></w:pPr>
        <w:r><w:rPr><w:b/><w:color w:val="FFFFFF"/><w:sz w:val="20"/></w:rPr><w:t xml:space="preserve">$eH</w:t></w:r>
      </w:p>
    </w:tc>
"@
    }
    $tbl += "  </w:tr>`n"
    
    $rIdx = 0
    foreach ($row in $rows) {
        $fill = if ($rIdx % 2 -eq 1) { "F7F9FB" } else { "FFFFFF" }
        $tbl += "  <w:tr>`n"
        for ($i=0; $i -lt $colCount; $i++) {
            $val = if ($i -lt $row.Length) { Escape-Xml $row[$i] } else { "" }
            $w = $colWidths[$i]
            $tbl += @"
    <w:tc>
      <w:tcPr>
        <w:tcW w:w="$w" w:type="dxa"/>
        <w:shd w:val="clear" w:color="auto" w:fill="$fill"/>
      </w:tcPr>
      <w:p>
        <w:pPr><w:spacing w:before="30" w:after="30"/></w:pPr>
        <w:r><w:rPr><w:sz w:val="20"/></w:rPr><w:t xml:space="preserve">$val</w:t></w:r>
      </w:p>
    </w:tc>
"@
        }
        $tbl += "  </w:tr>`n"
        $rIdx++
    }
    $tbl += "</w:tbl>`n<w:p><w:pPr><w:spacing w:before=`"0`" w:after=`"160`"/></w:pPr></w:p>`n"
    [void]$sb.Append($tbl)
}

Write-Host "Assembling document content..." -ForegroundColor Cyan

# ==============================================================================
# COVER & DOCUMENT HEADER
# ==============================================================================
Add-P "GNU HEALTH HMIS 5.0" -style "Title" -Bold -Color "1F4E79" -Size 48 -Align "center" -SpaceBefore 480 -SpaceAfter 120
Add-P "Comprehensive System Functioning & End-to-End Operational Workflow Guide" -style "Subtitle" -Color "595959" -Size 28 -Align "center" -SpaceBefore 0 -SpaceAfter 360

Add-Callout "DOCUMENT CONTROL & SPECIFICATION METADATA" @"
Document ID: GH5-E2E-WF-2026-V1
Platform: GNU Health HMIS 5.0.7 | Tryton 7.0.57 | PostgreSQL 15.15 | Nginx 1.22.1
Host Infrastructure: Google Cloud Platform (GCP) Compute Engine (IP: 34.7.237.8)
Interface Access: Tryton SAO Web Client (HTTP Port 80)
Target Facility: Primary Outpatient & Ambulatory Healthcare Facility (State of Qatar)
Classification: Engineering Specification & End-to-End Operational Validation Manual
Assessment Baseline: 2026-09-21 | Independent Second-Pass Verification
"@ "1F4E79" "EDF2F8"

# ==============================================================================
# SECTION 1: EXECUTIVE SUMMARY & ARCHITECTURAL FOUNDATION
# ==============================================================================
Add-P "1. Executive Summary & Architectural Overview" -style "Heading1"

Add-P "GNU Health HMIS 5.0 is an enterprise Hospital Management Information System built on top of the modular Tryton 7.0 application framework. It delivers comprehensive clinical, administrative, diagnostic, pharmaceutical, and financial accounting functionality for outpatient and ambulatory clinics."

Add-P "The active deployment is hosted on a Google Cloud Platform (GCP) Compute Engine virtual machine (gnuhealth-srv) located in europe-west4-a, accessible at public IP 34.7.237.8. The platform operates on Debian GNU/Linux 12 (Bookworm) with PostgreSQL 15.15 as the relational database engine and Nginx 1.22.1 as the HTTP reverse proxy serving the Tryton SAO web client."

Add-P "Infrastructure & Service Component Map:" -Bold
Add-Bullet "GCP VM Host" "gnuhealth-srv (e2-standard-2, 2 vCPUs, 8 GB RAM, 50 GB balanced SSD, Debian 12)"
Add-Bullet "Web Access Gateway" "Nginx 1.22.1 reverse proxy listening on Port 80, proxying upstream to 127.0.0.1:8000"
Add-Bullet "Application Daemon" "trytond 7.0.57 running under dedicated service user 'gnuhealth' via systemd"
Add-Bullet "Relational Database" "PostgreSQL 15.15 with database 'gnuhealth', Unix domain socket peer authentication"
Add-Bullet "Presentation Layer" "Tryton SAO 7.0 HTML5/JavaScript single-page web interface (/home/gnuhealth/sao)"
Add-Bullet "Document Storage" "/home/gnuhealth/attach for diagnostic scans, radiology reports, and file attachments"

Add-P "Current Live Empirical Database Baseline:" -Bold
Add-P "An independent second-pass verification confirms that the live database is in a strictly verified clean-slate state ready for structured testing:"

$dbTableRows = [System.Collections.ArrayList]::new()
[void]$dbTableRows.Add(@("gnuhealth.pathology", "WHO ICD-10 Diagnostic Pathologies", "14,416", "Loaded & Active"))
[void]$dbTableRows.Add(@("gnuhealth.specialty", "Medical Specialties & Subspecialties", "73", "Loaded & Active"))
[void]$dbTableRows.Add(@("gnuhealth.drug.form", "Pharmaceutical Delivery Forms", "94", "Loaded & Active"))
[void]$dbTableRows.Add(@("gnuhealth.drug.route", "Medication Administration Routes", "47", "Loaded & Active"))
[void]$dbTableRows.Add(@("gnuhealth.dose.unit", "Dosage Units of Measure", "7", "Loaded & Active"))
[void]$dbTableRows.Add(@("gnuhealth.hospital.unit", "Clinic Operational Departments", "8", "Loaded & Configured (OPD, NURS, PHARM, LAB, RAD, etc.)"))
[void]$dbTableRows.Add(@("product.product", "Clinical Service Catalog Items", "15", "Configured (List price 0.00 QAR pending clinic price list)"))
[void]$dbTableRows.Add(@("currency.currency", "National Operating Currency", "1", "Active: Qatari Riyal (QAR / ر.ق, 2 decimals)"))
[void]$dbTableRows.Add(@("gnuhealth.patient", "Patient Master Profiles", "0", "Clean Slate (Zero synthetic data)"))
[void]$dbTableRows.Add(@("gnuhealth.appointment", "Patient Appointments & Visits", "0", "Clean Slate (Zero synthetic data)"))
[void]$dbTableRows.Add(@("gnuhealth.patient.evaluation", "Clinical Consultations / SOAP Charts", "0", "Clean Slate (Zero synthetic data)"))
[void]$dbTableRows.Add(@("gnuhealth.prescription.order", "Electronic Prescriptions", "0", "Clean Slate (Zero synthetic data)"))
[void]$dbTableRows.Add(@("account.invoice", "Patient Invoices", "0", "Clean Slate (Zero synthetic data)"))
[void]$dbTableRows.Add(@("account.fiscalyear", "Accounting Fiscal Years", "0", "Action Required: Fiscal Year must be opened"))

Add-Table @("Model Identifier", "Clinical / Business Domain", "Live Count", "Operational Status") $dbTableRows @(2800, 3600, 1200, 2000)

# ==============================================================================
# SECTION 2: FUNCTIONAL ARCHITECTURE & CORE CLINICAL MODULES
# ==============================================================================
Add-P "2. Functional Architecture & Core Clinical Modules" -style "Heading1"

Add-P "The GNU Health implementation provides eight interrelated clinical and business domains organized into modular, decoupled Tryton packages:"

Add-P "1. Patient Master Registry (gnuhealth.patient / party.party)" -style "Heading2"
Add-P "Manages patient demographics, national identity numbers (Qatar ID / QID), unique Patient Unique Identifiers (PUID format QAT-XXXXXX), date of birth, biological sex, emergency contacts, primary language, and socioeconomic assessments. The party model centralizes legal identity across clinical encounters, pharmacy dispensing, and financial billing."

Add-P "2. Appointment & Queue Management (gnuhealth.appointment)" -style "Heading2"
Add-P "Coordinates scheduled consultations and walk-in clinic visits. Integrates appointment states ('draft', 'confirmed', 'checked_in', 'done', 'cancelled'), links appointments to specific healthcare professionals, clinical specialties, and consulting rooms, and automatically feeds the nursing intake queue upon arrival check-in."

Add-P "3. Nursing Station & Vital Signs Triage (gnuhealth.patient.evaluation / health_nursing)" -style "Heading2"
Add-P "Enables triage nurses to perform ambulatory intake: recording multi-parameter vital signs (Systolic/Diastolic Blood Pressure, Pulse, Respiratory Rate, Body Temperature, Oxygen Saturation / SpO2), anthropometric measurements (Weight in kg, Height in cm), automatic Body Mass Index (BMI) computation, and emergency triage prioritization (Routine, Urgent, Emergency)."

Add-P "4. Physician Clinical Consultation & SOAP Charting (gnuhealth.patient.evaluation)" -style "Heading2"
Add-P "Standardized electronic medical record documentation structured according to clinical SOAP protocol (Subjective history, Objective findings, Assessment, Plan). Full integration with 14,416 WHO ICD-10 diagnostic codes, previous consultation history, chronic condition registries, lifestyle risk factors, and immutable digital sign-off locking."

Add-P "5. Electronic Prescribing & Clinical Safety Engine (gnuhealth.prescription.order)" -style "Heading2"
Add-P "Physician e-prescription ordering linked to the formulary medicament catalog. Powered by the GNU Health Safety Engine (Rule SM-CORE-0018): triggers mandatory alerts if a prescribed medication contains substances to which the patient has documented allergies or if contraindicated during pregnancy. Prescription status transitions from Draft to Released to Dispensed."

Add-P "6. Diagnostic Laboratory (gnuhealth.lab / gnuhealth.patient.lab.test)" -style "Heading2"
Add-P "Laboratory work order requisitions generated directly from clinical evaluations. Tracks specimen accessioning, collection timestamps, phlebotomy tube barcoding, multi-analyte technician result entry against sex- and age-stratified reference ranges, and pathologist diagnostic sign-off."

Add-P "7. Diagnostic Radiology & Medical Imaging (gnuhealth.imaging.test.request)" -style "Heading2"
Add-P "Diagnostic imaging requests for modalities including Radiography (X-Ray), Ultrasound (US), CT, and MRI. Radiographers log scan acquisition; radiologists document and digitally sign structured radiological interpretations, automatically linking findings and attachments to the patient's longitudinal EHR chart."

Add-P "8. Billing, Cashiering & Health Insurance (account.invoice / gnuhealth.insurance)" -style "Heading2"
Add-P "Outpatient billing engine compliant with Tryton double-entry accounting. Automatically aggregates encounter consultation fees, laboratory tests, radiology procedures, and dispensed medications. Supports insurance copayment rules (e.g. 20% patient copay collected at cashier, 80% insurer receivable line booked) with QAR currency formatting."

# ==============================================================================
# SECTION 3: END-TO-END OPERATIONAL WORKFLOWS
# ==============================================================================
Add-P "3. End-to-End Operational Workflows" -style "Heading1"

Add-P "The primary operational lifecycle follows six distinct, interconnected pathways across hospital units:"

Add-P "Workflow A: New Outpatient Intake, Clinical Encounter & Discharge" -style "Heading2"
Add-P "This represents the primary patient journey from initial front-desk presentation to physician consultation, diagnostic requisitions, and checkout:"

Add-StepBullet "1" "Patient Registration (Reception Desk)" "Front desk officer accesses Party -> Patients -> New. Enters legal name, DOB, biological sex, mobile number (+974), and 11-digit Qatar Civil ID (QID). System validates uniqueness and generates PUID (e.g. QAT-00001)."
Add-StepBullet "2" "Outpatient Booking & Check-In" "Receptionist creates an appointment under Appointments -> New Appointment. Selects consulting doctor and specialty. Upon physical arrival, clicks 'Check-In'; status transitions to 'checked_in'."
Add-StepBullet "3" "Nursing Intake & Triage (Nursing Station)" "Triage nurse opens Nursing Worklist. Locates checked-in patient. Opens Evaluation -> Triage tab. Records BP (120/80 mmHg), Heart Rate (72 bpm), SpO2 (99%), Temp (37.0 C), Weight (70 kg), and Height (175 cm). System automatically computes BMI (22.86). Submits to Doctor's Consultation Queue."
Add-StepBullet "4" "Physician Consultation & History (Consultation Room)" "Doctor opens Patient Evaluation from Outpatient Queue. Reviews vitals. Documents Chief Complaint and Subjective history in SOAP chart. Performs physical examination."
Add-StepBullet "5" "WHO ICD-10 Pathology Coding" "Doctor searches ICD-10 diagnostic library and attaches primary pathology code (e.g. J06.9 Acute upper respiratory infection)."
Add-StepBullet "6" "Diagnostic Orders & Prescriptions" "Doctor orders required laboratory tests (CBC) and radiology requisitions (Chest X-Ray) and prescribes necessary medications. Safety engine verifies allergy contraindications."
Add-StepBullet "7" "Consultation Sign-Off & Record Lock" "Doctor clicks 'Sign & Close'. Status updates to 'signed' / 'done'. Clinical notes become permanently immutable against unauthorized tampering."
Add-StepBullet "8" "Discharge & Cashier Settlement" "Appointment advances to 'done'. Patient presents at Billing/Cashier desk for copay/cash payment and receipt issuance."

Add-P "Workflow B: Diagnostic Laboratory Ordering & Verification" -style "Heading2"
Add-StepBullet "1" "Order Initiation" "Attending physician orders lab investigation from clinical evaluation (gnuhealth.patient.lab.test)."
Add-StepBullet "2" "Specimen Phlebotomy & Accessioning" "Patient proceeds to Laboratory Unit (LAB). Phlebotomist logs specimen collection timestamp, specimen type (Venous Blood), and accession tube barcode."
Add-StepBullet "3" "Specimen Analysis & Result Entry" "Lab technician analyzes sample and enters numerical/text values against reference intervals in Tryton SAO (gnuhealth.lab)."
Add-StepBullet "4" "Pathologist Diagnostic Sign-Off" "Pathologist reviews results, flags abnormal parameters, adds diagnostic comments, and clicks 'Verify & Sign'."
Add-StepBullet "5" "Real-Time EHR Availability" "Verified lab report appears immediately in patient's electronic medical chart, accessible to attending doctor."

Add-P "Workflow C: Diagnostic Radiology Ordering & Reporting" -style "Heading2"
Add-StepBullet "1" "Imaging Request" "Doctor generates diagnostic imaging request specifying modality (e.g. Chest X-Ray PA View) and clinical indication."
Add-StepBullet "2" "Radiography Acquisition" "Patient presents at Radiology Department (RAD). Radiographer completes scan procedure and marks requisition 'executed'."
Add-StepBullet "3" "Radiologist Interpretation" "Radiologist examines images on clinical viewer, drafts radiological findings, and provides diagnostic conclusion."
Add-StepBullet "4" "Digital Release & Billing" "Report is signed and locked; service charge automatically flows into billing ledger."

Add-P "Workflow D: Pharmacy e-Prescribing & Outpatient Dispensing" -style "Heading2"
Add-StepBullet "1" "Formulary Drug Selection" "Doctor selects pharmaceutical product from formulary catalog, entering dose, route, frequency, and treatment duration."
Add-StepBullet "2" "Safety Warning Check" "GNU Health engine checks patient allergy profile. If Penicillin allergy is recorded and Amoxicillin is selected, warning dialog appears requiring explicit physician override or cancellation."
Add-StepBullet "3" "Prescription Release" "Doctor signs prescription order; status transitions to 'released'."
Add-StepBullet "4" "Pharmacy Verification & Dispensing" "Pharmacist reviews prescription queue in Pharmacy Unit (PHARM). Verifies dosage, assigns stock batch/lot number, and clicks 'Dispense'."
Add-StepBullet "5" "Inventory Ledger Update" "System generates inventory stock move deducting dispensed quantity from the clinic dispensary stock location."

Add-P "Workflow E: Health Insurance Authorization & Split Invoicing" -style "Heading2"
Add-StepBullet "1" "Insurance Verification" "Reception records patient insurance policy, policy number, payer name, and copay percentage (e.g. 20% patient copay, 80% payer)."
Add-StepBullet "2" "Consolidated Invoice Aggregation" "Encounter consultation, diagnostic tests, and medications are aggregated into a unified patient invoice (account.invoice)."
Add-StepBullet "3" "Copay Separation" "Billing engine computes patient liability (20%) and insurer liability (80%)."
Add-StepBullet "4" "Point-of-Sale Settlement" "Cashier collects patient copay via Cash or Card POS and issues official receipt in QAR."
Add-StepBullet "5" "Payer Claim Ledger Posting" "The remaining balance is booked to the insurance receivables ledger for periodic batch claim submission."

# ==============================================================================
# SECTION 4: STEP-BY-STEP WORKFLOW VERIFICATION PROCEDURES
# ==============================================================================
Add-P "4. Step-by-Step System & Workflow Verification Procedures" -style "Heading1"

Add-P "To verify that all components of the system and clinical workflows function correctly, follow this step-by-step validation protocol:"

Add-P "Phase 1: Automated Technical & Network Perimeter Audit" -style "Heading2"
Add-P "Execute the automated integrity validation script from the repository to verify network connectivity, open ports, web proxy responses, and configuration syntax:"

Add-Callout "RUNNING THE AUTOMATED INTEGRITY AUDIT SCRIPT" @"
Open PowerShell on your administrative workstation and execute:
Set-Location 'c:\Users\MohammedSohail\OneDrive - IRISSTAR TECHNOLOGIES\GNU Health'
powershell -ExecutionPolicy Bypass -File .\scripts\validate_system_integrity.ps1 -TargetHost '34.7.237.8'

Expected Output:
  [1/4] Network Perimeter: Port 80 (HTTP) OPEN, Port 22 (SSH) OPEN, Port 5432 (Postgres) CLOSED
  [2/4] Web Endpoints: Root HTTP Access HTTP 200 OK (Server: nginx/1.22.1)
  [3/4] Repository Hygiene: PASS: Zero plaintext secrets detected across repository files
  [4/4] Clinic Master Configuration: PASS: clinic-config.yaml valid (QAR currency, Asia/Qatar timezone)
"@ "1F4E79" "F0F4F8"

Add-P "Phase 2: Administrative Prerequisites & Clinic Setup" -style "Heading2"
Add-P "Prior to executing clinical transactions, the following two administrative configurations must be completed in the Tryton SAO web client (http://34.7.237.8/):"

Add-Callout "PREREQUISITE A: OPEN ACCOUNTING FISCAL YEAR (BLOCKER RESOLUTION)" @"
Objective: Resolve the invoice posting blocker so billing can complete.
1. Log in to Tryton SAO web client as 'admin' at http://34.7.237.8/.
2. In the navigation tree, go to: Financial -> Configuration -> Fiscal Years -> Fiscal Years.
3. Click '+' (New).
4. Enter Name: 'Fiscal Year 2026', Code: 'FY2026'.
5. Set Start Date: '2026-01-01', End Date: '2026-12-31'.
6. Click the action button: 'Create Monthly Periods'.
7. Click 'Save' and verify status is 'Open'.
Result: Unblocks patient invoice posting, cashier payment receipting, and general ledger moves.
"@ "C00000" "FFF2F2"

Add-Callout "PREREQUISITE B: REGISTER CLINICIAN / DOCTOR PROFILE" @"
Objective: Populate health professional roster so appointments and evaluations can be assigned.
1. Navigate to: Party -> Parties -> New.
2. Enter Name: 'Dr. Sarah Al-Kuwari', Nationality: 'Qatar', Mobile: '+974 5500 1122'. Save party.
3. Navigate to: Health -> Configuration -> Health Professionals -> New.
4. Select Party: 'Dr. Sarah Al-Kuwari'.
5. Select Specialty: 'General Practice' (Code: GP).
6. Enter License Number: 'MOPH-DOC-2026-001'.
7. Click 'Save'.
Result: Unblocks appointment scheduling and clinical consultation assignments.
"@ "1F4E79" "F0F4F8"

Add-P "Phase 3: End-to-End Clinical UAT Test Scenarios" -style "Heading2"
Add-P "The 17 standard User Acceptance Testing scenarios must be executed sequentially to validate the full outpatient lifecycle:"

$uatTable = [System.Collections.ArrayList]::new()
[void]$uatTable.Add(@("UAT-001", "New Patient Registration", "Receptionist", "Create patient with 11-digit QID; verify PUID generation (QAT-00001)"))
[void]$uatTable.Add(@("UAT-002", "Patient Search & Chart Retrieval", "Receptionist / Nurse", "Search by QID, phone, and PUID; verify chart opens in < 1 second"))
[void]$uatTable.Add(@("UAT-003", "Scheduled Appointment Booking", "Receptionist", "Book future visit with Dr. Sarah Al-Kuwari; verify status 'confirmed'"))
[void]$uatTable.Add(@("UAT-004", "Walk-In Arrival & Queue Insertion", "Receptionist", "Mark walk-in arrival; click 'Check-In'; status becomes 'checked_in'"))
[void]$uatTable.Add(@("UAT-005", "Nursing Triage & Vitals Acquisition", "Triage Nurse", "Record BP 120/80, HR 72, SpO2 99%, Ht 175cm, Wt 70kg; verify BMI 22.86"))
[void]$uatTable.Add(@("UAT-006", "Physician Consultation & ICD-10 Coding", "Consulting Doctor", "Record SOAP notes; attach ICD-10 J06.9; click 'Sign'; record locked"))
[void]$uatTable.Add(@("UAT-007", "e-Prescription & Allergy Safety Alert", "Consulting Doctor", "Order Amoxicillin for Penicillin-allergic patient; verify SM-CORE-0018 alert"))
[void]$uatTable.Add(@("UAT-008", "Pharmacy Dispensing & Stock Move", "Pharmacist", "Open prescription queue; select batch/lot; click Dispense; deduct stock"))
[void]$uatTable.Add(@("UAT-009", "Laboratory Test Requisition & Results", "Doctor / Lab Tech", "Order CBC test; phlebotomy accessioning; enter WBC/Hgb; pathologist sign-off"))
[void]$uatTable.Add(@("UAT-010", "Radiology Study Requisition & Report", "Doctor / Radiologist", "Order Chest X-Ray; log procedure; radiologist drafts and signs report"))
[void]$uatTable.Add(@("UAT-011", "Outpatient Cash Billing & GL Posting", "Cashier", "Generate invoice in QAR; collect cash; post move; debit Cash, credit Revenue"))
[void]$uatTable.Add(@("UAT-012", "Card POS Payment & Settlement", "Cashier", "Collect invoice via card; enter POS auth code TXN-88421; print receipt"))
[void]$uatTable.Add(@("UAT-013", "Insurance Copay & Split Invoicing", "Billing Officer", "Apply 80/20 copay split; collect 20% patient copay; book 80% insurer claim"))
[void]$uatTable.Add(@("UAT-014", "Patient Refund & Credit Note", "Billing / Manager", "Cancel unperformed test; generate credit note; reverse revenue entry"))
[void]$uatTable.Add(@("UAT-015", "Role-Based Access Control (RBAC)", "Admin / Multi-User", "Verify receptionist cannot view clinical notes; doctor cannot edit GL"))
[void]$uatTable.Add(@("UAT-016", "Clinical Audit Trail Verification", "Admin", "Inspect create_uid, write_uid, timestamps on clinical evaluation"))
[void]$uatTable.Add(@("UAT-017", "Disaster Recovery Backup & Restore", "DevOps Engineer", "Execute backup_gnuhealth.sh; verify database archive and test restore"))

Add-Table @("Test ID", "Scenario Objective", "Test Actor", "Execution Steps & Expected Outcome") $uatTable @(1100, 2500, 1600, 4400)

# ==============================================================================
# SECTION 5: ROLE-BASED ACCESS CONTROL & SECURITY MATRIX
# ==============================================================================
Add-P "5. Role-Based Access Control & Security Matrix" -style "Heading1"

Add-P "GNU Health enforces strict Role-Based Access Control (RBAC) following the principle of least privilege. Permissions are assigned through Tryton groups (res.group) linked to functional user profiles:"

$rbacTable = [System.Collections.ArrayList]::new()
[void]$rbacTable.Add(@("Health Front Desk", "Receptionist", "Patient Demographics, Appointment Scheduling, Walk-In Check-In, Patient Search", "Medical Notes, Diagnostic Results, Prescriptions, Financial Journals"))
[void]$rbacTable.Add(@("Health Nursing", "Triage Nurse", "Nursing Worklist, Vital Signs Capture, Anthropometrics, Triage Categorization", "Financial Invoicing, Prescription Signing, General Ledger, System Administration"))
[void]$rbacTable.Add(@("Health Doctor", "Consulting Physician", "SOAP Charting, ICD-10 Diagnoses, Lab Requisitions, Radiology Orders, e-Rx", "Patient Financial Payment Collection, System Configuration, Database Admin"))
[void]$rbacTable.Add(@("Health Pharmacy", "Pharmacist", "Prescription Queue, Drug Dispensing, Dispensary Stock Lots, Medication Catalog", "Clinical History Modification, Laboratory Entry, General Ledger Journals"))
[void]$rbacTable.Add(@("Health Laboratory", "Lab Technician / Pathologist", "Lab Worklists, Sample Accessioning, Analyte Result Entry, Lab Verification", "Patient Demographics Edit, Prescription Issuance, Cashier Collections"))
[void]$rbacTable.Add(@("Health Radiology", "Radiographer / Radiologist", "Imaging Requests, Modality Execution, Radiological Reporting, Scan Attachment", "Laboratory Results, Medication Dispensing, Patient Payments, General Ledger"))
[void]$rbacTable.Add(@("Health Billing", "Cashier / Billing Officer", "Invoice Validation, Payment Collection (Cash/Card), Receipts, Copay Accounting", "Clinical Evaluations, Diagnostic Order Modification, Medical Chart Changes"))
[void]$rbacTable.Add(@("Administration", "HMIS Administrator", "User Management, Group Permissions, Clinic Configuration, Backup Schedules", "Clinical Diagnosis Signing (must act under licensed physician credentials)"))

Add-Table @("Security Group", "Assigned Staff", "Permitted System Operations", "Strictly Prohibited Access") $rbacTable @(1800, 1600, 3100, 3100)

# ==============================================================================
# SECTION 6: MANDATORY GO-LIVE GATES & OPERATIONAL CUTOVER
# ==============================================================================
Add-P "6. Mandatory Go-Live Gates & Operational Cutover" -style "Heading1"

Add-P "Before transitioning from User Acceptance Testing to live patient operations, four mandatory governance gates must be satisfied:"

Add-P "Gate 1: Clinic Master Data Onboarding (Owner: Clinic Operations Lead)" -Bold
Add-Bullet "Official Clinic Legal Identity" "Replace <CLINIC_NAME>, Commercial Registration (CR), and MOPH Facility License in configuration/clinic-config.yaml."
Add-Bullet "Clinical Staff Roster" "Register all practicing doctors, specialists, and nurses with licensed MOPH numbers."
Add-Bullet "Service Price Catalog" "Assign agreed QAR list prices to the 15 standard clinical services (product.product)."
Add-Bullet "Drug Formulary" "Import authorized Qatar National Formulary medicaments into gnuhealth.medicament."
Add-Bullet "Insurance Payers" "Configure contracted insurance payers (Alkoot, QLM, Mednet, etc.) and policy terms."

Add-P "Gate 2: Financial & Accounting Foundation (Owner: Finance Lead)" -Bold
Add-Bullet "Accounting Fiscal Year" "Open active fiscal year 2026 in account.fiscalyear with monthly periods."
Add-Bullet "Payment Journals" "Activate Cash Drawer journal and Bank POS Terminal clearing accounts."

Add-P "Gate 3: Network Lockdown & TLS Encryption (Owner: DevOps / Security Lead)" -Bold
Add-Bullet "Domain & TLS Certificate" "Provision official production FQDN and install Let's Encrypt TLS certificate on Port 443."
Add-Bullet "HTTP -> HTTPS Redirect" "Configure Nginx to automatically redirect all unencrypted Port 80 traffic to Port 443."
Add-Bullet "Firewall Ingress Rule" "Restrict GCP Compute Engine firewall to close Port 8000 to the public internet, allowing access only via Nginx localhost reverse proxy."

Add-P "Gate 4: Formal UAT Sign-Off & Cutover (Owner: Clinic Director / Executive)" -Bold
Add-Bullet "UAT Execution" "Execute all 17 UAT scenarios; obtain written sign-off from Clinical, Nursing, Pharmacy, and Finance leads."
Add-Bullet "Test Record Purging" "Purge or archive synthetic test patient records to ensure 100% clean database prior to Day 1 patient registration."
Add-Bullet "Automated Backup Verification" "Verify nightly automated backup cron and offsite snapshot storage on Google Cloud Storage."

# Close document
[void]$sb.Append(@'
    <w:sectPr>
      <w:pgSz w:w="12240" w:h="15840"/>
      <w:pgMar w:top="1440" w:right="1440" w:bottom="1440" w:left="1440"/>
    </w:sectPr>
  </w:body>
</w:document>
'@)

[System.IO.File]::WriteAllText((Join-Path $tempDir "word\document.xml"), $sb.ToString(), [System.Text.Encoding]::UTF8)

Write-Host "Compressing document to target path: $OutputPath..." -ForegroundColor Cyan
if (Test-Path $OutputPath) { Remove-Item $OutputPath -Force }
[System.IO.Compression.ZipFile]::CreateFromDirectory($tempDir, $OutputPath)

Remove-Item $tempDir -Recurse -Force
$fi = Get-Item $OutputPath
Write-Host "SUCCESS: Generated Word Document ($($fi.Length) bytes) at $OutputPath" -ForegroundColor Green
