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
| Record allergy (Z88.0, severe) | FAIL twice, then PASS | Save was refused with "You do not have permission". Two backend access gaps, found from the server log (the refusal named the table): nursing had read-only access to patient disease lines (commit 467975e), and saving an allergy also writes a Page of Life entry that nursing could not access (commit d521b84). After both module updates: add 200 (allergy 15), duplicate 409, list and patient list show it, triage screen shows the red allergy alert and the card (Drug allergy, Severe, note) and the banner that evaluation 118 is in progress |
| Role isolation (API) | PASS | pharmacy, stock, surgery, prescriptions, order-sets, radiology, claims, purchases, ledger, laboratory all 403; billing 200 empty (accessRestricted true); triage, immunizations, inpatient, emergency, discharges, referrals, lab-alerts, consultations 200 |
| Validation | PASS | triage for unknown patient 404; triage without patient 400 |

## 3. Doctor, consultation and orders (demo_dr1)

| Step | Result | Evidence |
| :--- | :--- | :--- |
| Patient and allergy visible | PASS | Cockpit opened on Alexander Wright Final 1002; allergy alert "Personal history of allergy to penicillin"; prescription header shows "Recorded allergies ... Verify these clinically before prescribing" |
| Triage notes carried into the consultation | PASS | Subjective history pre-filled from the nurse's chief complaint |
| Save SOAP notes with ICD-10 diagnosis | PASS | Objective, plan and A01.0 Typhoid fever saved; the same evaluation (118) was updated, not a second one |
| Prescribing safety check | PASS | Amoxicillin 500mg for the penicillin-allergic patient returned 409 requiresAcknowledgement: "matches the recorded allergy penicillin" |
| Prescribe paracetamol through the screen | PASS | Prescription 71 saved with Paracetamol 500mg, Oral, every 8 hours for 3 days; screen says it was sent to pharmacy |
| Order lab and imaging together | PASS | "2 of 2 test order(s) placed": COMPLETE BLOOD COUNT TEST096 and Chest X-Ray 78, both draft |
| Save as order set pop-up | PASS | Pop-up listed both orders; "Fever work-up" saved (set 5) and appears in the Order set dropdown |
| Role isolation (API) | PASS | claims, ledger 403; billing 200 empty (accessRestricted true); stock, purchases, emergency and triage return 200 because the doctor role holds the pharmacy, emergency and triage-reading modules in the role matrix (by design) |

Notes
- The doctor's evaluation is left in progress; it is completed after the lab and radiology results come back.

## 4. Laboratory (demo_lab1)

| Step | Result | Evidence |
| :--- | :--- | :--- |
| Doctor's order reaches the lab | PASS | TEST096 COMPLETE BLOOD COUNT for Alexander Wright Final 1002 listed first, state draft, 26 analytes with units, reference ranges and verified limits |
| Enter results on the screen and save | PASS | All 26 analytes entered (HGB 9.2 low, WBC 13.5 high, the rest mid-range); "Save draft results" saved 26 of 26; HGB flagged as outside its range (warning true) |
| Mark done | PASS | State done |
| Abnormal results raise alerts | PASS | CR-000003 HGB 9.2 g/dL (limits 11 - 16) and CR-000004 WBC 13.5 10^3/uL (limits 4.5 - 11), severity abnormal, state open |
| Guard re-complete and re-save | PASS | complete again 409; save-results on the done order 409 |
| Role isolation (API) | PASS | pharmacy, prescriptions, radiology, surgery, stock, triage, allergies, consultations, order-sets all 403; billing restricted |
