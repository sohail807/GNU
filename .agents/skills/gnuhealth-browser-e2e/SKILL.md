---
name: gnuhealth-browser-e2e
description: >-
  Execute automated end-to-end browser testing for the GNU Health HMIS outpatient clinic in Google Chrome. Use when validating full outpatient workflows, verifying role transitions, capturing live application screenshots, or conducting regression testing.
---

# GNU Health Browser E2E Certification Runbook

This skill executes complete outpatient clinical, diagnostic, and financial workflows in Google Chrome using Selenium automation, capturing timestamped screenshots and logging all state transitions.

## Prerequisites
- Working GNU Health deployment on `http://34.7.237.8/#gnuhealth`.
- Google Chrome and Selenium (`selenium 4.49.0`) installed locally.
- Test runner library [`scripts/lib_e2e.py`](../../scripts/lib_e2e.py).
- Designated synthetic patient identity (`Alexander Wright`, `P00088`).

## Workflow Execution Steps

### 1. Launch Browser Test Runner
Execute the standardized test entry point:
```powershell
python scripts/run_genuine_visible_browser_certification.py
```
Or run individual targeted role phases:
- Front Desk Registration & Appointment: `python scripts/run_browser_phase1.py`
- Nursing Triage & Vitals: `python scripts/run_phase5_triage.py`
- Physician Consultation & Rx: `python scripts/run_phase6_consultation.py`
- Laboratory Diagnostics: `python scripts/test_complete_lab.py`
- Radiology Diagnostics: `python scripts/test_complete_radiology.py`
- Cashier Billing & Payment: `python scripts/test_complete_payment.py`

### 2. Multi-Role Execution Sequence
The runner transitions sequentially through the 6 department roles:
1. **`demo_frontdesk1`**: Register synthetic patient -> save PUID -> schedule appointment -> click `CHECK IN`.
2. **`demo_nurse1`**: Open `Health -> Patient Evaluations` -> enter BP 120/80, HR 72, Temp 37.0, Wt 70, Ht 175 -> verify calculated BMI 22.86 -> save.
3. **`demo_dr1`**: Open triage evaluation -> document Chief Complaint -> add ICD-10 `J06.9` -> complete evaluation -> create prescription for Amoxicillin 500mg TID x 7d.
4. **`demo_lab1`**: Open `Health -> Laboratory -> Lab Results` -> select CBC -> click `LOAD ANALYTES CRITERIA` -> enter Hemoglobin 14.1 g/dL -> click `DONE`.
5. **`demo_rad1`**: Open `Health -> Imaging -> Medical Imaging Requests` -> select Chest X-Ray -> enter findings in `Additional Information` -> execute `Request` & `Generate Results`.
6. **`demo_cashier1`**: Open `Financial -> Invoices -> Customer Invoices` -> create invoice for Consultation ($50.00) -> click `POST` -> launch `Pay Invoice` wizard -> pay $50.00 cash -> verify $0.00 balance.

### 3. Evidence Capture & Verification
- All screenshots are automatically saved to `reports/browser_tests/` or `reports/live_browser_test/`.
- Execution summary and timing metrics logged to `reports/browser_tests/e2e_test_results.json`.
- Status must record explicit `PASS` for all 9 canonical test cases.

### 4. Safety Guardrails
- Never bypass a failed UI step by silently running SQL update commands in the background.
- If a browser action fails, capture the DOM dump and screenshot, record status as `FAIL` or `BLOCKED`, and trigger `gnuhealth-defect-investigation`.
