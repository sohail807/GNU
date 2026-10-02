---
name: gnuhealth-defect-investigation
description: >-
  Investigate, reproduce, diagnose, and remediate tester findings and defects reported in GNU Health HMIS outpatient workflows. Use when a tester reports a bug, unexpected UI behavior, missing menu, permission error, or constraint violation.
---

# GNU Health Defect Investigation Runbook

This skill guides the investigation, reproduction, root-cause isolation, minimal remediation, and re-verification of issues reported during clinical or administrative testing.

## Prerequisites
- Working GNU Health HMIS deployment on `http://34.7.237.8/#gnuhealth`.
- Test findings logged in `Testing for HMS.xlsx` or tester defect tickets.
- Access to authorized role accounts (`demo_frontdesk1`, `demo_nurse1`, `demo_dr1`, `demo_lab1`, `demo_rad1`, `demo_cashier1`).
- Python environment with Selenium and PostgreSQL client tools.

## Investigation Procedure

### Step 1: Ingest & Triage Finding
1. Read the defect description, user role, screen path, and observed behavior from the issue report.
2. Cross-reference against [`Testing for HMS - Resolved.xlsx`](../../Testing%20for%20HMS%20-%20Resolved.xlsx) to check if the issue matches a known pattern:
   - Duplicate party constraint (`gnuhealth_patient_name_uniq`)
   - Sub-menu hierarchy vs top-level menu placement
   - Active bookmark/filter hiding records in list views
   - Batch order wizard vs direct result entry (`Lab Results` vs `Lab: New order`)
   - Field naming discrepancies (`comment` vs `Additional Information`)
   - Role-based separation of duties (Cashier vs Financial Accountant)

### Step 2: Live Browser Reproduction
1. Execute reproduction using [`scripts/lib_e2e.py`](../../scripts/lib_e2e.py):
   ```bash
   python -c "import sys; sys.path.append('scripts'); from lib_e2e import create_driver, login; d = create_driver(); login(d, '<ROLE_USER>', '<PASSWORD>'); ..."
   ```
2. Capture screenshot of observed error state into `reports/browser_tests/`.
3. Check browser console logs and DOM attributes using [`scripts/dump_dom.py`](../../scripts/dump_dom.py).

### Step 3: Technical Root-Cause Isolation
1. **Model / Constraint Inspection:** Check Tryton model definitions and constraints in `his/gnuhealth/` or PostgreSQL catalog.
2. **Menu / Action Inspection:** Run [`scripts/check_menu_groups.py`](../../scripts/check_menu_groups.py) to inspect `ir.ui.menu` and `ir.model.button` permissions.
3. **User Group Inspection:** Run [`scripts/inspect_users.py`](../../scripts/inspect_users.py) to verify security groups assigned to the reporting user.

### Step 4: Propose Minimal Remediation
1. Formulate the smallest surgical change:
   - UI Menu adjustments: update `ir.ui.menu` parent or sequence in DB.
   - User group adjustments: assign missing standard functional group via `res.user-res.group`.
   - Workflow guidance: update user manual with correct click-path and filter-clearing instructions.
2. Never disable database constraints or grant `admin` privileges to resolve a user defect.

### Step 5: Verify & Document Resolution
1. Re-execute the exact user scenario in Chrome.
2. Confirm the expected state transition occurs without error.
3. Capture post-remediation evidence screenshot.
4. Record resolution in [`Testing for HMS - Resolved.xlsx`](../../Testing%20for%20HMS%20-%20Resolved.xlsx).
