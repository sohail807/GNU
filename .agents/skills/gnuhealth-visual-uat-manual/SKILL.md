---
name: gnuhealth-visual-uat-manual
description: >-
  Generate, compile, and maintain the comprehensive visual User Acceptance Testing (UAT) manual and interactive execution tracking workbooks for GNU Health HMIS. Use when updating testing manuals, adding screenshot callouts, or publishing Word/PDF guides.
---

# GNU Health Visual UAT Manual Runbook

This skill compiles the visual, screenshot-based User Acceptance Testing (UAT) Manual and companion Excel tracking workbooks for GNU Health HMIS outpatient clinic workflows.

## Prerequisites
- Working Python environment with `python-docx` (v1.2.0) and `xlsxwriter` (v3.2.9).
- Curated screenshot repository in `reports/visual_uat_manual/screenshots/`.
- Microsoft Word COM automation available for high-fidelity PDF compilation on Windows.

## Manual Compilation Workflow

### Step 1: Capture & Annotate Live Screenshots
To refresh or generate annotated screenshots with red boxes (`#E63946`), numbered badges (①, ②, ③), and navy blue banners (`#1B365D`):
```powershell
python scripts/build_all_visual_uat_screenshots.py
```
This ensures all 73 primary screenshots are generated directly into `reports/visual_uat_manual/screenshots/`.

### Step 2: Generate Complete Word Document
Run the Word document generator:
```powershell
python scripts/generate_complete_uat_manual_docx.py
```
Outputs:
- [`GNU_HEALTH_COMPLETE_VISUAL_UAT_MANUAL.docx`](../../GNU_HEALTH_COMPLETE_VISUAL_UAT_MANUAL.docx)
- Features: 54 pages, 73 inline captioned images, executive document control, master data tracking sheet, 9 detailed test cases, 6 visual troubleshooting guides, and formal QA sign-off pages.

### Step 3: Export Matching PDF via MS Word COM
Convert the Word document to PDF with 100% layout fidelity:
```powershell
$word = New-Object -ComObject Word.Application
$word.Visible = $false
$docPath = (Resolve-Path 'GNU_HEALTH_COMPLETE_VISUAL_UAT_MANUAL.docx').Path
$pdfPath = [System.IO.Path]::ChangeExtension($docPath, '.pdf')
$doc = $word.Documents.Open($docPath)
$doc.SaveAs([ref]$pdfPath, [ref]17)
$doc.Close()
$word.Quit()
```
Outputs:
- [`GNU_HEALTH_COMPLETE_VISUAL_UAT_MANUAL.pdf`](../../GNU_HEALTH_COMPLETE_VISUAL_UAT_MANUAL.pdf)

### Step 4: Generate Interactive UAT Execution Sheet
Generate the 4-worksheet Excel tracking workbook:
```powershell
python scripts/generate_uat_test_execution_sheet.py
```
Outputs:
- [`GNU_HEALTH_UAT_TEST_EXECUTION_SHEET.xlsx`](../../GNU_HEALTH_UAT_TEST_EXECUTION_SHEET.xlsx)
- Contains: Master Tracking & Metrics, Detailed UAT Execution Matrix, Step-by-Step Live Browser Verification Log, Troubleshooting & Issue Matrix.

### Step 5: Update Evidence Index & QA Verification
Update:
- [`GNU_HEALTH_VISUAL_UAT_EVIDENCE_INDEX.md`](../../GNU_HEALTH_VISUAL_UAT_EVIDENCE_INDEX.md)
- [`GNU_HEALTH_UAT_DOCUMENTATION_VERIFICATION.md`](../../GNU_HEALTH_UAT_DOCUMENTATION_VERIFICATION.md)
