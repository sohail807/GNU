# Script to generate the comprehensive Excel Workbook (.xlsx) for GNU Health HMIS
[CmdletBinding()]
param(
    [string]$OutputPath = "c:\Users\MohammedSohail\OneDrive - IRISSTAR TECHNOLOGIES\GNU Health\GNU_Health_HMIS_Codebase_and_Transaction_Test_Report.xlsx"
)

Add-Type -AssemblyName System.IO.Compression.FileSystem

$tempDir = Join-Path $env:TEMP "gnuhealth_xlsx_$([Guid]::NewGuid().ToString('N'))"
if (Test-Path $tempDir) { Remove-Item $tempDir -Recurse -Force }
New-Item -ItemType Directory -Path (Join-Path $tempDir "_rels") | Out-Null
New-Item -ItemType Directory -Path (Join-Path $tempDir "xl\_rels") | Out-Null
New-Item -ItemType Directory -Path (Join-Path $tempDir "xl\worksheets") | Out-Null

Write-Host "Creating Excel package structure in $tempDir..." -ForegroundColor Cyan

# 1. [Content_Types].xml
$contentTypes = @'
<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
  <Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>
  <Override PartName="/xl/worksheets/sheet2.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>
  <Override PartName="/xl/worksheets/sheet3.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>
  <Override PartName="/xl/worksheets/sheet4.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>
  <Override PartName="/xl/worksheets/sheet5.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>
  <Override PartName="/xl/worksheets/sheet6.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>
  <Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>
</Types>
'@
[System.IO.File]::WriteAllText((Join-Path $tempDir "[Content_Types].xml"), $contentTypes, [System.Text.Encoding]::UTF8)

# 2. _rels/.rels
$rootRels = @'
<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>
</Relationships>
'@
[System.IO.File]::WriteAllText((Join-Path $tempDir "_rels\.rels"), $rootRels, [System.Text.Encoding]::UTF8)

# 3. xl/_rels/workbook.xml.rels
$wbRels = @'
<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet2.xml"/>
  <Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet3.xml"/>
  <Relationship Id="rId4" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet4.xml"/>
  <Relationship Id="rId5" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet5.xml"/>
  <Relationship Id="rId6" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet6.xml"/>
  <Relationship Id="rId7" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
</Relationships>
'@
[System.IO.File]::WriteAllText((Join-Path $tempDir "xl\_rels\workbook.xml.rels"), $wbRels, [System.Text.Encoding]::UTF8)

# 4. xl/workbook.xml
$workbook = @'
<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <sheets>
    <sheet name="Executive Dashboard" sheetId="1" r:id="rId1"/>
    <sheet name="Transaction Test Results" sheetId="2" r:id="rId2"/>
    <sheet name="Codebase Functional Inventory" sheetId="3" r:id="rId3"/>
    <sheet name="Master UAT Test Matrix" sheetId="4" r:id="rId4"/>
    <sheet name="Master Data Baseline" sheetId="5" r:id="rId5"/>
    <sheet name="Go-Live Gates &amp; Blockers" sheetId="6" r:id="rId6"/>
  </sheets>
</workbook>
'@
[System.IO.File]::WriteAllText((Join-Path $tempDir "xl\workbook.xml"), $workbook, [System.Text.Encoding]::UTF8)

# 5. xl/styles.xml
$styles = @'
<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <fonts count="8">
    <font><sz val="10"/><name val="Calibri"/></font>
    <font><b/><sz val="10"/><color rgb="FFFFFFFF"/><name val="Calibri"/></font>
    <font><b/><sz val="14"/><color rgb="FF1F4E79"/><name val="Calibri"/></font>
    <font><b/><sz val="11"/><color rgb="FF1F4E79"/><name val="Calibri"/></font>
    <font><b/><sz val="10"/><color rgb="FF276A3C"/><name val="Calibri"/></font>
    <font><b/><sz val="10"/><color rgb="FFC00000"/><name val="Calibri"/></font>
    <font><b/><sz val="10"/><color rgb="FF806000"/><name val="Calibri"/></font>
    <font><b/><sz val="10"/><color rgb="FF262626"/><name val="Calibri"/></font>
  </fonts>
  <fills count="8">
    <fill><patternFill patternType="none"/></fill>
    <fill><patternFill patternType="gray125"/></fill>
    <fill><patternFill patternType="solid"><fgColor rgb="FF1F4E79"/></patternFill></fill>
    <fill><patternFill patternType="solid"><fgColor rgb="FFF2F4F7"/></patternFill></fill>
    <fill><patternFill patternType="solid"><fgColor rgb="FFE2EFDA"/></patternFill></fill>
    <fill><patternFill patternType="solid"><fgColor rgb="FFFCE4D6"/></patternFill></fill>
    <fill><patternFill patternType="solid"><fgColor rgb="FFFFF2CC"/></patternFill></fill>
    <fill><patternFill patternType="solid"><fgColor rgb="FFD9E1F2"/></patternFill></fill>
  </fills>
  <borders count="2">
    <border><left/><right/><top/><bottom/><diagonal/></border>
    <border>
      <left style="thin"><color rgb="FFD3D3D3"/></left>
      <right style="thin"><color rgb="FFD3D3D3"/></right>
      <top style="thin"><color rgb="FFD3D3D3"/></top>
      <bottom style="thin"><color rgb="FFD3D3D3"/></bottom>
    </border>
  </borders>
  <cellStyleXfs count="1">
    <xf numFmtId="0" fontId="0" fillId="0" borderId="0"/>
  </cellStyleXfs>
  <cellXfs count="10">
    <xf numFmtId="0" fontId="0" fillId="0" borderId="1" xfId="0"/>
    <xf numFmtId="0" fontId="1" fillId="2" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1"/>
    <xf numFmtId="0" fontId="0" fillId="3" borderId="1" xfId="0" applyFill="1" applyBorder="1"/>
    <xf numFmtId="0" fontId="4" fillId="4" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1"/>
    <xf numFmtId="0" fontId="5" fillId="5" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1"/>
    <xf numFmtId="0" fontId="6" fillId="6" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1"/>
    <xf numFmtId="0" fontId="2" fillId="0" borderId="0" xfId="0" applyFont="1"/>
    <xf numFmtId="0" fontId="3" fillId="7" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1"/>
    <xf numFmtId="0" fontId="7" fillId="0" borderId="1" xfId="0" applyFont="1" applyBorder="1"/>
    <xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>
  </cellXfs>
</styleSheet>
'@
[System.IO.File]::WriteAllText((Join-Path $tempDir "xl\styles.xml"), $styles, [System.Text.Encoding]::UTF8)

# Helper functions for spreadsheet generation
function Escape-Xml([string]$text) {
    if ([string]::IsNullOrEmpty($text)) { return "" }
    return $text.Replace("&", "&amp;").Replace("<", "&lt;").Replace(">", "&gt;").Replace('"', "&quot;").Replace("'", "&apos;")
}

function Get-ColLetter([int]$colIdx) {
    $div = $colIdx
    $colLetter = ""
    while ($div -gt 0) {
        $mod = ($div - 1) % 26
        $colLetter = [char](65 + $mod) + $colLetter
        $div = [int](($div - $mod) / 26)
    }
    return $colLetter
}

function Build-WorksheetXml([System.Collections.ArrayList]$rowsData, [int[]]$colWidths = $null) {
    $sb = [System.Text.StringBuilder]::new()
    [void]$sb.Append(@'
<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
'@)
    if ($colWidths) {
        [void]$sb.Append("<cols>")
        for ($c = 0; $c -lt $colWidths.Length; $c++) {
            $colNum = $c + 1
            $w = $colWidths[$c]
            [void]$sb.Append("<col min=""$colNum"" max=""$colNum"" width=""$w"" customWidth=""1""/>")
        }
        [void]$sb.Append("</cols>")
    }
    [void]$sb.Append("<sheetData>")
    
    $rNum = 1
    foreach ($row in $rowsData) {
        [void]$sb.Append("<row r=""$rNum"">")
        $cells = $row.Cells
        $cNum = 1
        foreach ($cell in $cells) {
            $colLetter = Get-ColLetter $cNum
            $ref = "$colLetter$rNum"
            $style = if ($cell.Style) { $cell.Style } else { 0 }
            $val = Escape-Xml $cell.Value
            
            if ($cell.IsNumeric) {
                [void]$sb.Append("<c r=""$ref"" s=""$style""><v>$val</v></c>")
            } else {
                [void]$sb.Append("<c r=""$ref"" s=""$style"" t=""inlineStr""><is><t>$val</t></is></c>")
            }
            $cNum++
        }
        [void]$sb.Append("</row>")
        $rNum++
    }
    [void]$sb.Append("</sheetData></worksheet>")
    return $sb.ToString()
}

function New-Cell([string]$val, [int]$style = 0, [bool]$isNum = $false) {
    return [PSCustomObject]@{ Value = $val; Style = $style; IsNumeric = $isNum }
}

function New-Row([array]$cells) {
    return [PSCustomObject]@{ Cells = $cells }
}

function Get-StatusStyle([string]$status) {
    switch -Wildcard ($status) {
        "*PASS*" { return 3 }
        "*VERIFIED*" { return 3 }
        "*FULLY FUNCTIONAL*" { return 3 }
        "*LOADED*" { return 3 }
        "*BLOCKED*" { return 4 }
        "*CRITICAL*" { return 4 }
        "*PENDING*" { return 5 }
        "*TESTING*" { return 5 }
        "*REQUIRED*" { return 5 }
        default { return 0 }
    }
}

# ==============================================================================
# SHEET 1: EXECUTIVE DASHBOARD
# ==============================================================================
Write-Host "Building Sheet 1: Executive Dashboard..." -ForegroundColor Cyan
$s1Rows = [System.Collections.ArrayList]::new()
[void]$s1Rows.Add((New-Row @((New-Cell "GNU HEALTH HMIS 5.0 - CODEBASE READINESS AND TRANSACTION TEST DASHBOARD" 6))))
[void]$s1Rows.Add((New-Row @((New-Cell "Facility: Outpatient and Ambulatory Clinic (State of Qatar) | Host: 34.7.237.8 | Assessment Date: 2026-09-21" 9))))
[void]$s1Rows.Add((New-Row @((New-Cell "" 9))))

[void]$s1Rows.Add((New-Row @((New-Cell "CORE METRIC CATEGORY" 1), (New-Cell "KEY SYSTEM INDICATOR" 1), (New-Cell "EMPIRICAL VALUE" 1), (New-Cell "STATUS" 1), (New-Cell "OPERATIONAL SIGNIFICANCE" 1))))
[void]$s1Rows.Add((New-Row @((New-Cell "System Architecture" 8), (New-Cell "Platform Runtime" 0), (New-Cell "GNU Health 5.0.7 / Tryton 7.0.57" 0), (New-Cell "FULLY FUNCTIONAL" 3), (New-Cell "LTS upstream distribution on Debian 12" 0))))
[void]$s1Rows.Add((New-Row @((New-Cell "System Architecture" 8), (New-Cell "Database Engine" 0), (New-Cell "PostgreSQL 15.15" 0), (New-Cell "FULLY FUNCTIONAL" 3), (New-Cell "Secured via Unix domain socket" 0))))
[void]$s1Rows.Add((New-Row @((New-Cell "System Architecture" 8), (New-Cell "Web Presentation Client" 0), (New-Cell "Tryton SAO 7.0 (Nginx Port 80)" 0), (New-Cell "FULLY FUNCTIONAL" 3), (New-Cell "Responding HTTP 200 OK" 0))))
[void]$s1Rows.Add((New-Row @((New-Cell "Network Security" 8), (New-Cell "Direct WSGI Port 8000" 0), (New-Cell "Port 8000 Open Externally" 0), (New-Cell "BLOCKED (Security Risk)" 4), (New-Cell "GCP firewall must restrict to localhost" 0))))
[void]$s1Rows.Add((New-Row @((New-Cell "Network Security" 8), (New-Cell "HTTPS TLS Encryption (Port 443)" 0), (New-Cell "Port 443 Closed (No TLS)" 0), (New-Cell "BLOCKED (Go-Live Gate)" 4), (New-Cell "Domain FQDN + Let's Encrypt required" 0))))
[void]$s1Rows.Add((New-Row @((New-Cell "Clinical Ontology" 8), (New-Cell "WHO ICD-10 Pathologies" 0), (New-Cell "14,416 Codes" 0), (New-Cell "VERIFIED LOADED" 3), (New-Cell "Complete diagnostic coding library" 0))))
[void]$s1Rows.Add((New-Row @((New-Cell "Clinical Ontology" 8), (New-Cell "Medical Specialties" 0), (New-Cell "73 Specialties" 0), (New-Cell "VERIFIED LOADED" 3), (New-Cell "Clinical disciplines ready" 0))))
[void]$s1Rows.Add((New-Row @((New-Cell "Pharmacy Master" 8), (New-Cell "Dosage Forms & Routes" 0), (New-Cell "94 Forms, 47 Routes, 7 Dose Units" 0), (New-Cell "VERIFIED LOADED" 3), (New-Cell "Universal drug administration catalogs" 0))))
[void]$s1Rows.Add((New-Row @((New-Cell "Qatar Localization" 8), (New-Cell "Operating Currency" 0), (New-Cell "Qatari Riyal (QAR)" 0), (New-Cell "VERIFIED LOADED" 3), (New-Cell "Active default currency" 0))))
[void]$s1Rows.Add((New-Row @((New-Cell "Qatar Localization" 8), (New-Cell "Clinic Operating Units" 0), (New-Cell "8 Units (OPD, NURS, LAB, RAD, etc.)" 0), (New-Cell "VERIFIED LOADED" 3), (New-Cell "Configured in clinic-config.yaml" 0))))
[void]$s1Rows.Add((New-Row @((New-Cell "Data Integrity" 8), (New-Cell "Patient Records in Database" 0), (New-Cell "0 (Clean Slate)" 0), (New-Cell "VERIFIED CLEAN" 3), (New-Cell "Zero synthetic contamination" 0))))
[void]$s1Rows.Add((New-Row @((New-Cell "Data Integrity" 8), (New-Cell "Appointments and Evaluations" 0), (New-Cell "0 (Clean Slate)" 0), (New-Cell "VERIFIED CLEAN" 3), (New-Cell "Zero test visits" 0))))
[void]$s1Rows.Add((New-Row @((New-Cell "Financial Accounting" 8), (New-Cell "Accounting Fiscal Years" 0), (New-Cell "0 Fiscal Years Open" 0), (New-Cell "CRITICAL BLOCKER" 4), (New-Cell "Invoices cannot post until FY2026 is opened" 0))))
[void]$s1Rows.Add((New-Row @((New-Cell "Clinical Staff" 8), (New-Cell "Registered Health Professionals" 0), (New-Cell "0 Registered Doctors" 0), (New-Cell "PENDING MASTER DATA" 5), (New-Cell "Physician roster required to book visits" 0))))
[void]$s1Rows.Add((New-Row @((New-Cell "Service Pricing" 8), (New-Cell "Clinical Tariff Catalog" 0), (New-Cell "15 Services (0.00 QAR list price)" 0), (New-Cell "PENDING MASTER DATA" 5), (New-Cell "Clinic tariff schedule in QAR required" 0))))
[void]$s1Rows.Add((New-Row @((New-Cell "End-to-End Test Suite" 8), (New-Cell "Transaction Test Suite" 0), (New-Cell "12 PASS / 1 PENDING / 3 BLOCKED" 0), (New-Cell "TESTING COMPLETED" 3), (New-Cell "End-to-end transaction logic determined" 0))))

$s1Xml = Build-WorksheetXml $s1Rows @(22, 28, 30, 24, 42)
[System.IO.File]::WriteAllText((Join-Path $tempDir "xl\worksheets\sheet1.xml"), $s1Xml, [System.Text.Encoding]::UTF8)

# ==============================================================================
# SHEET 2: TRANSACTION TEST RESULTS
# ==============================================================================
Write-Host "Building Sheet 2: Transaction Test Results..." -ForegroundColor Cyan
$jsonPath = Join-Path $PSScriptRoot "audit\transaction_test_results.json"
$txData = if (Test-Path $jsonPath) { Get-Content $jsonPath -Raw | ConvertFrom-Json } else { @() }

$s2Rows = [System.Collections.ArrayList]::new()
[void]$s2Rows.Add((New-Row @((New-Cell "END-TO-END TRANSACTION TEST RESULTS (DETERMINING SYSTEM EXECUTION)" 6))))
[void]$s2Rows.Add((New-Row @((New-Cell "Probing Web Transport, National ID, Appointment Constraints, Triage Vitals, ICD-10 SOAP, Safety Rules, Billing Lockout, and RBAC" 9))))
[void]$s2Rows.Add((New-Row @((New-Cell "" 9))))

[void]$s2Rows.Add((New-Row @((New-Cell "TX ID" 1), (New-Cell "DOMAIN" 1), (New-Cell "TRANSACTION STEP PROBED" 1), (New-Cell "EXPECTED BEHAVIOR" 1), (New-Cell "ACTUAL LIVE EXECUTION" 1), (New-Cell "STATUS" 1), (New-Cell "OPERATIONAL IMPACT AND REMEDIATION" 1))))

foreach ($tx in $txData) {
    $stStyle = Get-StatusStyle $tx.Status
    $rowCells = @(
        (New-Cell $tx.TxId 8),
        (New-Cell $tx.Domain 0),
        (New-Cell $tx.Step 0),
        (New-Cell $tx.Expected 0),
        (New-Cell $tx.Actual 0),
        (New-Cell $tx.Status $stStyle),
        (New-Cell $tx.Notes 0)
    )
    [void]$s2Rows.Add((New-Row $rowCells))
}

$s2Xml = Build-WorksheetXml $s2Rows @(12, 24, 34, 38, 42, 16, 45)
[System.IO.File]::WriteAllText((Join-Path $tempDir "xl\worksheets\sheet2.xml"), $s2Xml, [System.Text.Encoding]::UTF8)

# ==============================================================================
# SHEET 3: CODEBASE FUNCTIONAL INVENTORY
# ==============================================================================
Write-Host "Building Sheet 3: Codebase Functional Inventory..." -ForegroundColor Cyan
$s3Rows = [System.Collections.ArrayList]::new()
[void]$s3Rows.Add((New-Row @((New-Cell "GNU HEALTH HMIS 5.0 - CODEBASE FUNCTIONAL INVENTORY (16 OPERATIONAL DOMAINS)" 6))))
[void]$s3Rows.Add((New-Row @((New-Cell "Comprehensive Audit of Working Codebase Modules, Native Models, DB Counts, Blocker Dependencies, and Ownership" 9))))
[void]$s3Rows.Add((New-Row @((New-Cell "" 9))))

[void]$s3Rows.Add((New-Row @((New-Cell "DOMAIN ID" 1), (New-Cell "FUNCTIONAL AREA" 1), (New-Cell "NATIVE ORM MODELS" 1), (New-Cell "IMPLEMENTATION STATUS" 1), (New-Cell "CONFIDENCE" 1), (New-Cell "LIVE COUNT" 1), (New-Cell "WORKING MECHANISMS" 1), (New-Cell "OUTSTANDING BLOCKERS / MISSING INPUTS" 1), (New-Cell "OWNER" 1))))

$domains = @(
    @("01", "System Platform and OS", "trytond, nginx, postgresql", "FULLY FUNCTIONAL", "HIGH", "1 Service", "Debian 12, Python 3.11, Trytond 7.0.57, Postgres 15.15 on GCP", "None. Platform structurally verified", "DevOps Lead"),
    @("02", "Reference Master Data", "gnuhealth.pathology, specialty, drug.form", "FULLY FUNCTIONAL", "HIGH", "14,564 Records", "14,416 ICD-10 codes, 73 specialties, 94 drug forms, 47 routes loaded", "None. Catalogs fully preloaded", "Clinical Lead"),
    @("03", "Qatar Localization", "currency.currency, gnuhealth.hospital.unit", "FULLY FUNCTIONAL", "HIGH", "8 Units", "QAR currency, Asia/Qatar timezone, 8 clinic departments active", "Replace <CLINIC_NAME> placeholder with legal name", "Clinic Operations"),
    @("04", "Patient Demographics", "party.party, gnuhealth.patient", "CONFIG COMPLETE - PENDING DATA", "HIGH", "0 Records", "PUID generation, QID validation schema, patient master file", "Awaiting live patient registration", "Reception Lead"),
    @("05", "Appointment Scheduling", "gnuhealth.appointment", "CONFIG COMPLETE - PENDING DATA", "HIGH", "0 Records", "Calendar slots, walk-in check-in, queue progression to triage", "Blocked until doctors are registered in gnuhealth.healthprofessional", "Operations Lead"),
    @("06", "Nursing Triage and Vitals", "gnuhealth.patient.rounding", "CONFIG COMPLETE - PENDING DATA", "HIGH", "0 Records", "BP, HR, RR, Temp, SpO2, Ht, Wt forms; automated BMI computation", "Awaiting patient check-in at triage", "Nursing Lead"),
    @("07", "Doctor Consultations (SOAP)", "gnuhealth.patient.evaluation", "CONFIG COMPLETE - PENDING DATA", "HIGH", "0 Records", "Clinical SOAP charting, past medical history, immutable sign-off", "Requires registered doctor and checked-in patient", "Clinical Lead"),
    @("08", "Diagnostic Coding", "gnuhealth.pathology", "FULLY FUNCTIONAL", "HIGH", "14,416 Records", "Search and attach WHO ICD-10 diagnostic codes to patient chart", "None. Comprehensive library active", "Clinical Lead"),
    @("09", "E-Prescribing and Drug Safety", "gnuhealth.prescription.order", "CONFIG COMPLETE - PENDING DATA", "HIGH", "0 Records", "Prescription orders, dosing, allergy safety alert rule SM-CORE-0018", "Commercial drug formulary intake (medicaments)", "Chief Pharmacist"),
    @("10", "Pharmacy Dispensing", "gnuhealth.prescription.order, stock.move", "CONFIG COMPLETE - PENDING DATA", "HIGH", "0 Records", "Dispensary queue, stock batch/lot tracking, inventory deductions", "Dispensary opening stock and lot registration", "Pharmacy Lead"),
    @("11", "Laboratory Investigations", "gnuhealth.patient.lab.test, gnuhealth.lab", "CONFIG COMPLETE - PENDING DATA", "HIGH", "9 Categories", "Lab orders, specimen accessioning, analyte entry against ranges", "Clinic laboratory test pricing and custom test panels", "Lab Director"),
    @("12", "Radiology and Imaging", "gnuhealth.imaging.test.request", "CONFIG COMPLETE - PENDING DATA", "HIGH", "8 Modalities", "Radiology requisitions, execution logging, radiologist report PDF", "Radiology procedure tariff schedule", "Radiology Lead"),
    @("13", "Patient Billing and Invoicing", "account.invoice, product.product", "FRAMEWORK PRESENT - BLOCKED", "HIGH", "0 Invoices", "Encounter charge aggregation, 15 service items defined", "CRITICAL: account.fiscalyear = 0 blocks invoice posting", "Finance Lead"),
    @("14", "General Ledger and Accounts", "account.move, account.fiscalyear", "FRAMEWORK PRESENT - BLOCKED", "HIGH", "0 Moves", "Double-entry rules, Cash and POS journals configured", "CRITICAL: Open Fiscal Year 2026 with monthly periods", "Finance Lead"),
    @("15", "Health Insurance and Copay", "gnuhealth.insurance", "CONFIG COMPLETE - PENDING DATA", "HIGH", "0 Policies", "80/20 copay separation, policy registration, split billing", "Contracted Qatar payer accounts (Alkoot, QLM, etc.)", "Insurance Lead"),
    @("16", "User Security and RBAC", "res.user, res.group, ir.model.access", "FULLY FUNCTIONAL", "HIGH", "1 User", "Admin user active; 7 demo roles disabled; least-privilege groups", "Provision named staff user accounts and rotated passwords", "System Admin")
)

foreach ($d in $domains) {
    $stStyle = Get-StatusStyle $d[3]
    $rowCells = @(
        (New-Cell $d[0] 8),
        (New-Cell $d[1] 0),
        (New-Cell $d[2] 0),
        (New-Cell $d[3] $stStyle),
        (New-Cell $d[4] 0),
        (New-Cell $d[5] 0),
        (New-Cell $d[6] 0),
        (New-Cell $d[7] 0),
        (New-Cell $d[8] 0)
    )
    [void]$s3Rows.Add((New-Row $rowCells))
}

$s3Xml = Build-WorksheetXml $s3Rows @(12, 26, 32, 28, 14, 16, 42, 42, 18)
[System.IO.File]::WriteAllText((Join-Path $tempDir "xl\worksheets\sheet3.xml"), $s3Xml, [System.Text.Encoding]::UTF8)

# ==============================================================================
# SHEET 4: MASTER UAT TEST MATRIX
# ==============================================================================
Write-Host "Building Sheet 4: Master UAT Test Matrix..." -ForegroundColor Cyan
$s4Rows = [System.Collections.ArrayList]::new()
[void]$s4Rows.Add((New-Row @((New-Cell "MASTER USER ACCEPTANCE TESTING (UAT) SCENARIO SPECIFICATIONS (17 SCENARIOS)" 6))))
[void]$s4Rows.Add((New-Row @((New-Cell "Step-by-Step Test Scenarios, Actors, Models, Expected Results, Status, and Blockers for Pre-Go-Live Acceptance" 9))))
[void]$s4Rows.Add((New-Row @((New-Cell "" 9))))

[void]$s4Rows.Add((New-Row @((New-Cell "TEST ID" 1), (New-Cell "SCENARIO OBJECTIVE" 1), (New-Cell "ACTOR" 1), (New-Cell "TARGET MODEL" 1), (New-Cell "EXECUTION STEPS" 1), (New-Cell "EXPECTED RESULT" 1), (New-Cell "CURRENT STATUS" 1), (New-Cell "BLOCKER / PREREQUISITE" 1), (New-Cell "OWNER" 1))))

$uatScenarios = @(
    @("UAT-001", "New Patient Registration", "Receptionist", "party.party, gnuhealth.patient", "Navigate to Patients -> New; input demographics, 11-digit QID; Save", "Record saved; unique PUID generated (QAT-XXXXX)", "TESTING REQUIRED", "None. Intake form ready", "Reception Lead"),
    @("UAT-002", "Patient Search and Retrieval", "Receptionist / Nurse", "gnuhealth.patient", "Search by 11-digit QID, phone number, and PUID", "Matching record retrieved in < 1 second", "TESTING REQUIRED", "Execute after UAT-001", "Reception Lead"),
    @("UAT-003", "Scheduled Appointment", "Receptionist", "gnuhealth.appointment", "Select doctor and date/time slot; attach patient; confirm", "Appointment saved in 'confirmed' state on doctor calendar", "BLOCKED", "Doctor master data required", "Reception Lead"),
    @("UAT-004", "Walk-In Check-In", "Receptionist", "gnuhealth.appointment", "Create immediate visit; mark Walk-In; click Check-In", "State updates to 'checked_in'; routes to Triage queue", "TESTING REQUIRED", "Doctor master data required", "Reception Lead"),
    @("UAT-005", "Nursing Triage and Vitals", "Triage Nurse", "gnuhealth.patient.evaluation", "Record BP 120/80, Pulse 72, SpO2 99%, Ht 175cm, Wt 70kg", "Vitals saved; BMI automatically computed as 22.86", "TESTING REQUIRED", "Requires checked-in patient", "Nursing Lead"),
    @("UAT-006", "Consultation and ICD-10", "Consulting Doctor", "gnuhealth.patient.evaluation", "Record SOAP notes; attach ICD-10 J06.9; click Sign and Close", "Record permanently locked against editing (perm_delete=F)", "TESTING REQUIRED", "Requires doctor & patient", "Clinical Lead"),
    @("UAT-007", "e-Prescription and Safety", "Consulting Doctor", "gnuhealth.prescription.order", "Order Amoxicillin for Penicillin-allergic patient", "System triggers SM-CORE-0018 allergy warning alert", "BLOCKED", "Drug formulary intake required", "Chief Pharmacist"),
    @("UAT-008", "Pharmacy Dispensing", "Pharmacist", "gnuhealth.prescription.order", "Open prescription queue; select batch/lot; click Dispense", "Marked Dispensed; inventory stock move deducts 1 unit", "TESTING REQUIRED", "Formulary and opening stock", "Pharmacy Lead"),
    @("UAT-009", "Lab Requisition and Entry", "Doctor / Lab Tech", "gnuhealth.lab", "Doctor orders CBC; phlebotomy logs sample; tech inputs WBC/Hgb", "Pathologist signs off; report visible in doctor EHR", "TESTING REQUIRED", "Lab test catalog required", "Lab Lead"),
    @("UAT-010", "Radiology Requisition", "Doctor / Radiologist", "gnuhealth.imaging.test.request", "Order Chest X-Ray; log procedure; radiologist enters findings", "Signed radiology report attached to patient chart", "TESTING REQUIRED", "Imaging procedure pricing", "Radiology Lead"),
    @("UAT-011", "Outpatient Cash Billing", "Cashier", "account.invoice, account.move", "Open patient invoice in QAR; validate lines; collect cash", "Invoice posted; GL moves: debit Cash, credit Revenue", "BLOCKED", "CRITICAL: Open Fiscal Year FY2026", "Finance Lead"),
    @("UAT-012", "Card POS Settlement", "Cashier", "account.payment", "Validate invoice; select Card POS; enter POS Auth Code TXN-88421", "Payment booked: debit POS Clearing, credit Receivable", "BLOCKED", "CRITICAL: Open Fiscal Year FY2026", "Finance Lead"),
    @("UAT-013", "Insurance Copay Split", "Billing Officer", "gnuhealth.insurance", "Generate invoice for insured patient with 80/20 copay terms", "Split created: collect 20% patient copay, book 80% insurer claim", "BLOCKED", "Fiscal year and Payer master data", "Insurance Lead"),
    @("UAT-014", "Patient Refund / Credit", "Billing / Manager", "account.invoice", "Cancel unperformed test; generate credit note with reason", "Credit note reverses revenue and cash entries", "TESTING REQUIRED", "Fiscal year required", "Finance Lead"),
    @("UAT-015", "Role-Based Access (RBAC)", "Admin / Staff", "res.user, res.group", "Verify receptionist cannot view SOAP; doctor cannot edit GL", "Access denied in strict compliance with RBAC matrix", "TESTING REQUIRED", "Provision staff accounts", "System Admin"),
    @("UAT-016", "Clinical Audit Trail", "System Admin", "ir.model.access", "Inspect create_uid, write_uid, timestamps on clinical evaluation", "Audit timestamps and user IDs verified accurate", "TESTING REQUIRED", "Execute after clinical tests", "System Admin"),
    @("UAT-017", "Disaster Recovery Backup", "DevOps Engineer", "PostgreSQL dump", "Run backup_gnuhealth.sh; restore snapshot to scratch test DB", "Database decompresses cleanly with zero data corruption", "TESTING REQUIRED", "GCP shell access", "DevOps Engineer")
)

foreach ($u in $uatScenarios) {
    $stStyle = Get-StatusStyle $u[6]
    $rowCells = @(
        (New-Cell $u[0] 8),
        (New-Cell $u[1] 0),
        (New-Cell $u[2] 0),
        (New-Cell $u[3] 0),
        (New-Cell $u[4] 0),
        (New-Cell $u[5] 0),
        (New-Cell $u[6] $stStyle),
        (New-Cell $u[7] 0),
        (New-Cell $u[8] 0)
    )
    [void]$s4Rows.Add((New-Row $rowCells))
}

$s4Xml = Build-WorksheetXml $s4Rows @(12, 26, 18, 28, 38, 38, 18, 32, 16)
[System.IO.File]::WriteAllText((Join-Path $tempDir "xl\worksheets\sheet4.xml"), $s4Xml, [System.Text.Encoding]::UTF8)

# ==============================================================================
# SHEET 5: MASTER DATA BASELINE
# ==============================================================================
Write-Host "Building Sheet 5: Master Data Baseline..." -ForegroundColor Cyan
$s5Rows = [System.Collections.ArrayList]::new()
[void]$s5Rows.Add((New-Row @((New-Cell "GNU HEALTH HMIS 5.0 - MASTER DATA AND REFERENCE CATALOGS INVENTORY" 6))))
[void]$s5Rows.Add((New-Row @((New-Cell "Complete Inventory of Reference Datasets (Loaded) vs Clinic Operational Datasets (Pending Clinic Input)" 9))))
[void]$s5Rows.Add((New-Row @((New-Cell "" 9))))

[void]$s5Rows.Add((New-Row @((New-Cell "MODEL NAME" 1), (New-Cell "CATALOG / DATASET" 1), (New-Cell "CLASSIFICATION" 1), (New-Cell "LIVE COUNT" 1), (New-Cell "CURRENT STATUS" 1), (New-Cell "QATAR LOCALIZATION & TECHNICAL DETAILS" 1), (New-Cell "DATA GOVERNANCE & SOURCE" 1))))

$catalogs = @(
    @("gnuhealth.pathology", "WHO ICD-10 Diagnosis Codes", "Universal Reference", "14,416", "VERIFIED LOADED", "International diagnostic coding library loaded in Tryton", "WHO ICD-10 Official Master"),
    @("gnuhealth.specialty", "Medical Specialties", "Universal Reference", "73", "VERIFIED LOADED", "Cardiology, General Practice, Pediatrics, Dermatology, etc.", "Standard Medical Specialties"),
    @("gnuhealth.drug.form", "Pharmaceutical Dosage Forms", "Universal Reference", "94", "VERIFIED LOADED", "Tablets, capsules, syrups, creams, inhalers, injections", "Standard Pharmacology"),
    @("gnuhealth.drug.route", "Drug Administration Routes", "Universal Reference", "47", "VERIFIED LOADED", "Oral, Intravenous, Intramuscular, Topical, Inhalation", "Standard Pharmacology"),
    @("gnuhealth.dose.unit", "Medication Dosage Units", "Universal Reference", "7", "VERIFIED LOADED", "mg, g, ml, IU, mcg, drops, puffs", "Standard Pharmacology"),
    @("gnuhealth.lab.test_type", "Laboratory Test Categories", "Universal Reference", "9", "VERIFIED LOADED", "Hematology, Biochemistry, Microbiology, Serology, etc.", "Standard Laboratory"),
    @("gnuhealth.imaging.test.type", "Radiology Modality Types", "Universal Reference", "8", "VERIFIED LOADED", "X-Ray, Ultrasound, CT, MRI, Mammography", "Standard Radiology"),
    @("gnuhealth.hospital.unit", "Clinic Operational Departments", "Clinic Configuration", "8", "VERIFIED CONFIGURED", "OPD, NURS, PHARM, LAB, RAD, BILL, INS, ADMIN", "Defined in clinic-config.yaml"),
    @("product.product", "Clinical Service Products", "Clinic Pricing Master", "15", "PENDING TARIFF SCHEDULE", "15 outpatient services; list prices blank (0.00 QAR)", "Clinic Management Sign-Off Required"),
    @("currency.currency", "National Operating Currency", "National Localization", "1", "VERIFIED ACTIVE", "Qatari Riyal (QAR, ID: 3, 2 decimal places)", "Qatar Central Bank (QCB)"),
    @("account.account", "Chart of Accounts", "Financial Master", "7", "CONFIGURED", "Cash, Receivables, Payables, Revenue, Expense, Tax", "Standard Clinic Chart of Accounts"),
    @("account.journal", "Financial Accounting Journals", "Financial Master", "6", "CONFIGURED", "Cash Drawer, Sales/Revenue, Expenses, General, Invoices", "Standard Financial Journals"),
    @("account.fiscalyear", "Accounting Fiscal Years", "Financial Prerequisite", "0", "CRITICAL BLOCKER", "Zero fiscal years in database; prevents invoice posting", "Finance Lead Must Open FY2026"),
    @("gnuhealth.healthprofessional", "Healthcare Professional Roster", "Staff Master Data", "0", "PENDING CLINIC ONBOARDING", "Zero physicians registered; prevents appointment booking", "HR / Medical Director Input Required"),
    @("gnuhealth.medicament", "Dispensary Drug Formulary", "Pharmacy Master Data", "0", "PENDING FORMULARY INTAKE", "Commercial drugs and dispensary stock inventory", "Chief Pharmacist Input Required"),
    @("gnuhealth.insurance", "Contracted Health Payers", "Commercial Contracts", "0", "PENDING PAYER INTAKE", "Insurance companies (Alkoot, QLM, Mednet) and copay terms", "Insurance Operations Input Required")
)

foreach ($c in $catalogs) {
    $stStyle = Get-StatusStyle $c[4]
    $rowCells = @(
        (New-Cell $c[0] 8),
        (New-Cell $c[1] 0),
        (New-Cell $c[2] 0),
        (New-Cell $c[3] 0),
        (New-Cell $c[4] $stStyle),
        (New-Cell $c[5] 0),
        (New-Cell $c[6] 0)
    )
    [void]$s5Rows.Add((New-Row $rowCells))
}

$s5Xml = Build-WorksheetXml $s5Rows @(26, 28, 22, 14, 26, 42, 32)
[System.IO.File]::WriteAllText((Join-Path $tempDir "xl\worksheets\sheet5.xml"), $s5Xml, [System.Text.Encoding]::UTF8)

# ==============================================================================
# SHEET 6: GO-LIVE GATES & BLOCKERS
# ==============================================================================
Write-Host "Building Sheet 6: Go-Live Gates & Blockers..." -ForegroundColor Cyan
$s6Rows = [System.Collections.ArrayList]::new()
[void]$s6Rows.Add((New-Row @((New-Cell "MANDATORY PRODUCTION GO-LIVE GATES AND REMEDIATION RUNBOOK" 6))))
[void]$s6Rows.Add((New-Row @((New-Cell "The 4 Mandatory Pre-Conditions to Transition from Testing to Live Outpatient Care" 9))))
[void]$s6Rows.Add((New-Row @((New-Cell "" 9))))

[void]$s6Rows.Add((New-Row @((New-Cell "GATE ID" 1), (New-Cell "GO-LIVE GATE TITLE" 1), (New-Cell "PILLAR" 1), (New-Cell "CRITICALITY" 1), (New-Cell "BLOCKER DESCRIPTION" 1), (New-Cell "TECHNICAL ROOT CAUSE" 1), (New-Cell "EXACT REMEDIATION PROCEDURE" 1), (New-Cell "OWNER" 1), (New-Cell "STATUS" 1))))

$gates = @(
    @("GATE-1", "Clinic Master Data Onboarding", "Operational", "P0 - Blocker", "Placeholders exist for clinic name, doctors, and tariffs", "Real business identity not yet loaded into YAML/DB", "Ingest real clinic name, doctor licenses, approved QAR price schedule, and commercial formulary", "Clinic Director", "PENDING INPUT"),
    @("GATE-2", "Financial Fiscal Year Activation", "Accounting", "P0 - Blocker", "Patient invoice posting strictly blocked by Tryton double-entry rules", "account.fiscalyear record count = 0", "Log in as admin -> Financial -> Configuration -> Fiscal Years -> Create FY2026 with 12 monthly periods -> Save as Open", "Finance Lead", "ACTION REQUIRED"),
    @("GATE-3", "TLS/HTTPS and Firewall Hardening", "Security", "P0 - Blocker", "Port 8000 exposed to public; system runs over unencrypted HTTP (Port 80)", "GCP firewall rule allows 8000; TLS cert not yet bound to 443", "Restrict GCP firewall port 8000 to localhost only; point clinic domain FQDN; install Let's Encrypt TLS cert", "DevOps / Security", "ACTION REQUIRED"),
    @("GATE-4", "Formal UAT Sign-Off and Cutover", "Governance", "P1 - High", "Live clinical testing pending formal stakeholder execution", "17 UAT scenarios require executed testing proof", "Execute all 17 scenarios; verify zero Sev-1 defects; purge synthetic test records; sign off cutover runbook", "Steering Committee", "PENDING GATES 1-3")
)

foreach ($g in $gates) {
    $stStyle = Get-StatusStyle $g[8]
    $rowCells = @(
        (New-Cell $g[0] 8),
        (New-Cell $g[1] 0),
        (New-Cell $g[2] 0),
        (New-Cell $g[3] 4),
        (New-Cell $g[4] 0),
        (New-Cell $g[5] 0),
        (New-Cell $g[6] 0),
        (New-Cell $g[7] 0),
        (New-Cell $g[8] $stStyle)
    )
    [void]$s6Rows.Add((New-Row $rowCells))
}

$s6Xml = Build-WorksheetXml $s6Rows @(12, 28, 16, 16, 36, 36, 45, 18, 18)
[System.IO.File]::WriteAllText((Join-Path $tempDir "xl\worksheets\sheet6.xml"), $s6Xml, [System.Text.Encoding]::UTF8)

# ==============================================================================
# COMPRESS TO OUTPUT FILE
# ==============================================================================
Write-Host "Compressing workbook to target path: $OutputPath..." -ForegroundColor Cyan
if (Test-Path $OutputPath) { Remove-Item $OutputPath -Force }
[System.IO.Compression.ZipFile]::CreateFromDirectory($tempDir, $OutputPath)

Remove-Item $tempDir -Recurse -Force
$fi = Get-Item $OutputPath
Write-Host "SUCCESS: Generated Excel Workbook ($($fi.Length) bytes) at $OutputPath" -ForegroundColor Green
