# Final end-to-end pass, 2026-10-02

Production: https://isthealth.irisstar.tech (Cloud Run revision after commit 4e89e9b). Driven through Claude in Chrome; the user signed in for each role.
Synthetic patient for the whole pass: **Alexander Wright Final 1002** (patient id 121, national ID 28510021002).

## 1. Front desk (demo_frontdesk1)

| Step | Result | Evidence |
| :--- | :--- | :--- |
| Register patient through the form | PASS | Patient 121 created; PUID 28510021002; blood group O+ and date of birth 1985-03-12 returned correctly by the patient list |
| Reject bad appointment urgency | PASS | urgency "zzz" returned 400 "Select a valid appointment urgency." |
| Book appointment | PASS | Dr. DEMO Physician 01, 2026-10-02 18:30, urgency normal: 200, appointment 107, state confirmed |
| Check in | PASS | 200 "checked in and queued for Nursing Triage"; queue row shows "In Triage" |
| Role isolation (API) | PASS | pharmacy, allergies, triage, surgery, order-sets, stock all 403; billing 200 with accessRestricted true (empty); laboratory, radiology, prescriptions, consultations return status only (statusOnly true), no clinical content |
| Page guard | PASS | /physician shows "Access restricted ... Reception isn't configured for Physician Cockpit" |
| Pages load | PASS | /frontdesk, /frontdesk/register, /frontdesk/appointments, /emergency, /patient, /admissions, /inpatient, /discharges, /referrals all render |

Notes
- One console exception while sweeping pages as front desk: minified React error #412 (a rendering mismatch). The page still rendered; not yet traced to a specific page. See open items.

## 2. Nurse (demo_nurse1)

| Step | Result | Evidence |
| :--- | :--- | :--- |
| Patient picker | FAIL then fixed | After the hide script, the picker still offered hidden test patients (including the oversized junk entries). The patient list now drops patients whose person record is inactive; an exact name or id search still finds them and flags them inactive. Verified live: picker 20 clean entries, search "Priya" returns patient 120 flagged inactive (commit after 7c36003, deployed) |
| Check-in arrives in triage queue | PASS | Alexander Wright Final 1002 was selected first in the nursing picker |
| Record vitals through the form | PASS | Evaluation 118 saved: BP 128/82, HR 88, temp 38.4, RR 18, SpO2 97, weight 74, height 178; BMI shown 23.36 (correct); chief complaint saved; state in_progress |
| First Save click | NOTE | The first click on "Save Evaluation & Record Vitals" through the automation did nothing; a direct click saved it. Not reproduced as a defect |
| Record allergy (Z88.0, severe) | FAIL then fixed | "You do not have permission for this action." The nursing group had read-only access to patient disease lines, but the app lets nurses add allergies. Nursing now has create and change (not delete); commit 467975e; needs the module update |
| Role isolation (API) | PASS | pharmacy, stock, surgery, prescriptions, order-sets, radiology, claims, purchases, ledger, laboratory all 403; billing 200 empty (accessRestricted true); triage, immunizations, inpatient, emergency, discharges, referrals, lab-alerts, consultations 200 |
| Validation | PASS | triage for unknown patient 404; triage without patient 400 |
