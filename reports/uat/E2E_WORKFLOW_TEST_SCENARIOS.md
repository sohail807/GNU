# IST Health HMIS — End-to-End Workflow Test Scenarios

Test plan for exercising every clinical/financial workflow module against the live GNU Health
Tryton backend (never mocks). Environment: `http://34.7.237.8/login` (production VM) or
`http://localhost:3000/login` (local dev pointed at the same backend). All scenarios use the
verified demo personas below — never real patient data.

## 0. Personas & Credentials

| Role | Username | Password | Landing |
|---|---|---|---|
| Front Desk | `demo_frontdesk1` | `FrontDesk2026!` | `/frontdesk` |
| Physician | `demo_dr1` | `Doctor2026!` | `/physician` |
| Nurse (Triage/Inpatient) | `demo_nurse1` | `Nurse2026!` | `/nursing` |
| Cashier/Billing | `demo_cashier1` | `Cashier2026!` | `/billing` |
| Lab Tech | `demo_lab1` | `Lab2026!` | `/laboratory` |
| Radiology Tech | `demo_rad1` | `Rad2026!` | `/radiology` |
| Admin | `demo_admin1` | `DemoAdmin2026!` | `/admin` |

Use a clearly synthetic patient name for every new registration (e.g. `TEST <ScenarioName> <date>`),
never a real identity.

---

## 1. Golden Path — Full Patient Journey (run this chain first)

Run as one continuous chain for a single synthetic patient; each step's output feeds the next.

1. **Register patient** (Front Desk, `POST /api/clinical/patients`) — name, QID, DOB, gender, blood type.
   - ✅ Response includes `bloodGroup` with **both** ABO letter and Rh sign (e.g. `O-`), not just the letter.
2. **Book appointment** (Front Desk, `POST /api/clinical/appointments`, `action:"book"`) for the new patient.
3. **Check in** (Front Desk, `action:"checkin"`) — appointment moves to Arrival Roster.
   - ✅ Roster is appointment-driven: a patient with **no appointment booked** correctly does *not*
     appear here even though they exist in the Master Patient Registry — this is by design, not a bug.
4. **Triage vitals** (Nurse, `POST /api/clinical/triage`) — BP, HR, temp, SpO2, chief complaint.
   - Submit twice in a row for the same patient → should **update the same** `in_progress`
     evaluation, not fork a second orphaned one.
5. **Physician consultation** (Physician, `POST /api/clinical/consultations`) — SOAP notes,
   diagnosis (ICD-10 code), order a lab test, order an imaging study, mark `completed:true`.
   - ✅ Lab order comes back with a **non-empty `criteria` array** matching the ordered test type's
     analyte template (regression check for the `complete_criteareas` fix).
   - ✅ Imaging order is created successfully (regression check that `gnuhealth.imaging.test`
     resolution still works with the expanded study catalog).
6. **Prescribe medication** (Physician, `POST /api/clinical/prescriptions`, default create path).
   - ✅ Response `state` is `"draft"`, **not** `"done"` (regression check for the auto-dispense fix).
7. **Lab result entry** (Lab Tech, `POST /api/clinical/laboratory`, `action:"save-results"` then
   `action:"complete"`) — enter a result for every analyte, finalize.
   - ✅ `save-results` succeeds first try (proves criteria were actually populated on order creation).
8. **Radiology finding** (Radiology Tech, `POST /api/clinical/radiology`, `action:"finalize"`) —
   enter findings text, confirm order flips to `"done"`.
9. **Pharmacy dispense** (Cashier/Pharmacy, `POST /api/clinical/pharmacy`) — verify the prescription
   shows as **Pending Verification** (`state:"draft"`) before this step, dispense it, confirm it now
   shows **Dispensed** (`state:"done"`).
10. **Billing** (Cashier, `POST /api/clinical/billing`) — `action:"create"` an invoice with lines for
    the consultation, lab test, and imaging study; `action:"post"` to the General Ledger;
    `action:"pay"` to settle.
    - ✅ Each step uses GNU Health's real workflow action (`post`/`pay` wizards), not a raw
      `state` write — confirm the invoice has a real `number` (e.g. `INV-2026/000xx`) and
      `amountToPay: 0` after payment.

---

## 2. Front Desk / Reception

- Register a patient with a duplicate QID → expect `409` with `isDuplicate:true`, no duplicate record created.
- Register with an invalid gender code → `400`.
- Register with a PUID-length QID pasted into the "patient ID" field elsewhere (e.g. surgery
  booking) → should resolve by PUID lookup, not overflow as a raw integer id.
- Search patient registry by partial name and by PUID (`GET /api/clinical/patients?q=...`).
- View a patient with restricted allergy/condition history as a front-desk role → confirm
  `allergiesRestricted:true` and no clinical content leaks, rather than a generic failure.
- Book an appointment with an invalid time format → `400`.
- Double-book the exact same appointment slot (submit twice quickly) — confirm behavior is
  sane (either both booked as separate legitimate appointments, or rejected — GNU Health has no
  native overlap check for appointments, so this is informational, not a required-fail scenario).

## 3. Physician / Consultation

- Save clinical notes without `completed:true` → evaluation stays `in_progress`, re-opening and
  saving again should **update the same evaluation**, not create a second one.
- Complete an evaluation twice (call again after `state:"done"`) → should be rejected
  (`409`, "already complete and cannot be edited").
- Order a lab test AND an imaging study in the same consultation call → both `labOrderId` and
  `radiologyOrderId` populated, both independently valid.
- Order a lab test with an invalid/unknown test name → `400`, clear error, evaluation itself
  still saved (partial-failure messaging, not a silent full rollback).
- Prescribe medication with a controlled/vaccine-only search term to confirm formulary resolution
  falls back sensibly when no exact match exists.
- Prescribe with `acknowledgeWarnings` unset for a patient flagged `crit_allergic` or
  `childbearing_age` (pregnancy warning path) → confirm the safety gate actually blocks or warns.

## 4. Nursing / Triage

- Record vitals for a patient with no prior evaluation today → creates new `in_progress` evaluation.
- Record vitals again same day → resumes the same evaluation (no duplicate).
- Submit an evaluation timestamp scenario across a non-UTC server clock → confirm no
  "end time before start" false rejection (regression check for the UTC-datetime fix).

## 5. Laboratory

- Order and process one case from **each** of the 13 lab panels at least once (9 original + the
  4 newly seeded: Lipid Profile, Thyroid Function, Glycemic Profile, Coagulation Profile) to prove
  every panel's criteria template actually round-trips through `save-results` → `complete`.
- Attempt `save-results` on an order whose analytes don't exactly match its native criteria
  (tamper with the submitted id list) → `400`, "Submitted analytes do not exactly match...".
- Attempt `save-results` on a non-`draft` order → `409`.
- Submit a numeric result **and** a qualitative `resultText` for the same analyte → `400`
  (mutually exclusive).
- Submit a result outside the verified reference range → confirm `warning:true` is set on that
  criterion without blocking the save.

## 6. Radiology

- Order and finalize studies across at least 4 different modalities (X-ray, Ultrasound, MRI, CT)
  using the newly seeded catalog (e.g. Abdominal X-Ray, Obstetric Ultrasound, Brain MRI, Chest CT)
  to confirm the orderable-study catalog expansion resolves correctly end-to-end, not just Chest X-Ray.
- Finalize without findings text → `400`, "Diagnostic findings are required".
- Re-finalize an already-`done` study → confirm it's rejected or handled gracefully, not silently
  overwritten.

## 7. Pharmacy

- View the queue and confirm `pendingDispensation` vs `dispensed` counts match actual `draft`/
  `invoiced` vs `done` states (regression check for the auto-dispense fix — a fresh prescription
  must show as pending, never pre-dispensed).
- Dispense a prescription, confirm `notes` records "Dispensed by Pharmacy: ..." with the entered
  verification notes.
- Attempt to dispense an already-`done` prescription → confirm no double-dispense / duplicate
  ledger effect.
- Dispense at least one prescription line using a newly-seeded medicament category (e.g. an IV
  fluid, an anticoagulant, and a vaccine) to confirm the expanded 60-item formulary resolves in
  the picker.

## 8. Inpatient

- Admit a patient to a bed currently in state `free` → succeeds, bed flips to `occupied`.
- Admit a patient to a bed in state `to_clean` or `occupied` → **must be rejected with 409**
  (regression check for the double-booking fix — this was a real, reproduced bug).
- Discharge a patient without a discharge reason / diagnosis / admission reason → `400` for
  each missing field individually.
- Discharge with all required fields → bed moves to `to_clean`, **not** straight to `free`.
- Run `bedclean` on that bed → admission moves to `finished`, bed moves to `free`.
- Exercise all 4 wards / 18 beds seeded this session at least once each across the admit →
  discharge → bedclean cycle to confirm the new inventory behaves identically to the original bed.

## 9. Surgical Suite

- Book a surgery **without** an operating room → succeeds (OR is optional).
- Book a surgery **with** an operating room and no explicit end time → succeeds with a
  system-defaulted end time, and the OR's own state flips to `scheduled`
  (regression check for the missing-`surgery_end_date` fix).
- Book a second, genuinely overlapping surgery in the **same** OR → **must be rejected with 409**
  (regression check for the OR double-booking fix).
- Book a non-overlapping surgery in the same OR (after the first one's end time) → succeeds.
- Cycle a surgery through `confirmed → in_progress → done → signed` via the PATCH state actions,
  confirming a `signed` surgery then rejects further writes.
- Exercise all 4 seeded operating rooms at least once.
- Exercise several of the newly seeded procedure codes (e.g. appendectomy, cholecystectomy,
  cesarean delivery) via the ambulatory/surgery procedure pickers.

## 10. Billing / Cashier

- Create an invoice for a patient with no existing invoice today → succeeds.
- Create a second invoice **same patient, same service description, same day** → `409`,
  "already exists today... use that invoice instead" (duplicate-invoice guard).
- Post a draft invoice → real Tryton `post` action assigns a sequence number and creates the
  accounting move (confirm a real `INV-2026/xxxxx` number appears, not a fake state flip).
- Pay a posted invoice → real `pay` wizard reconciles the receivable; confirm `amountToPay: 0`
  and a genuine payment/move exists, not just `state:"paid"` with nothing behind it.
- Attempt to modify/delete a `posted`/`paid` invoice → rejected by Tryton's own accounting
  integrity rules with a clear message (not a raw 500).

## 11. Insurance

- List insurance companies → confirm the 3 newly seeded companies appear (Qatar National Health
  Insurance, Al Khaleej Takaful Insurance, Doha Global Assurance) alongside pre-existing entries.
- ⚠️ Known data anomaly (not fixed, flagged only): party id 232 ("Rishma") is flagged as **both**
  a patient and an insurance company. Confirm this doesn't cause a real patient to be selectable
  as their own insurer in the enrollment flow; if it does, that's a new bug to raise.
- Enroll a patient in an insurance policy, confirm the policy appears on the patient's chart.

## 12. Admin / RBAC

- Log in as each of the 8 personas, confirm each lands on its correct default route and cannot
  access another role's write actions (e.g. `demo_cashier1` should not be able to create a
  prescription; `demo_frontdesk1` should not see clinical SOAP content).
- Confirm the two ACL grants made this session are still correctly scoped: `demo_dr1` (Health
  Doctor group) can create `gnuhealth.lab` orders and write `gnuhealth.hospital.or` state, but
  still cannot, e.g., delete a lab order (delete was deliberately left `False`).

## 13. Cross-Cutting Negative / Security Checks

- Every POST/PATCH endpoint: submit with a missing session cookie → `401`.
- Every endpoint gated by `hasModuleAccess`: hit it with a role that shouldn't have access → `403`
  with a role-appropriate message, not a stack trace.
- Submit an out-of-range or negative id for any `*Id` field → `400`, not a raw Tryton exception.
- Confirm no endpoint ever echoes back a raw Tryton internal error message containing SQL or
  stack details to the client — check `tryton-client.ts`'s error translation is hit for a forced
  `AccessError` and a forced `IntegrityError`.

---

## Notes for Whoever Runs This

- Steps marked "regression check" correspond to real, reproduced-and-fixed bugs from this
  session's audit (commits `8a41b90`, `0c4ee5b`, `1e7d90a`, `1f9baf3`) — these are the highest
  priority to keep in any future automated suite, since they represent silent data-integrity
  failures, not crashes (nothing errored before the fix; the workflow just silently skipped a
  safety step).
- Catalog-dependent scenarios (sections 5, 6, 7, 8, 9) rely on the reference-data seeding done
  this session (`scripts/seed_reference_catalogs.py`, `scripts/seed_medical_test_catalogs.py`) —
  if run against a fresh/different database, run those scripts first or substitute equivalent
  local catalog entries.
- Always clean up synthetic records created purely for testing afterward (or track them for
  `scripts/cleanup_session_test_data.py`-style removal) — never leave test data indistinguishable
  from real clinical/financial records in a database anyone else relies on.
