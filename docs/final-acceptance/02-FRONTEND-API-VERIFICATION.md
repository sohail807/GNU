# IST Health HMIS — Frontend-to-Backend Full-Stack Verification & Traceability

**Document Reference:** `docs/final-acceptance/02-FRONTEND-API-VERIFICATION.md`  
**Execution Date:** September 25, 2026  
**Auditor:** Independent Full-Stack Engineer & Senior GNU Health Systems Architect  
**Target Repository:** `sohail807/GNU` (Branch: `audit/final-acceptance-verification`)  

---

## 1. Architectural Integration & Multi-Tenant Routing Model

IST Health utilizes a modern, zero-trust **Backend-for-Frontend (BFF)** architecture. The Next.js 16 frontend never exposes GNU Health / Tryton administrative credentials or raw database connections to the browser. Every user operation flows through the authenticated BFF layer with multi-tenant database routing:

```
[Browser / Chrome UI]
       │
       ▼ (HTTPS / Secure Cookie `ist_health_session` + Header `X-Tenant-ID`)
[Next.js 16 Route Handler: /api/clinical/*]
       │
       ▼ (1. Validates Session & Blacklist in .tokens/revoked_sessions.json)
       ▼ (2. Resolves Target Database from `tenants.json` via tenant.ts)
       ▼ (3. Resolves Entities via ClinicalLookupService: Doctor, Patient Party, Accounts)
[TrytonClient.ts RPC Dispatcher]
       │
       ▼ (Session Header + Authenticated User Context: company, language)
[Nginx Regex Proxy: /(gnuhealth[a-z0-9_]*)/ -> 127.0.0.1:8000]
       │
       ▼ (Tryton 7.0 Multi-Database Dispatcher: -d gnuhealth -d gnuhealth_test_alpha -d gnuhealth_test_beta)
[Target PostgreSQL 15 Tenant Database: e.g. `gnuhealth_test_alpha`]
```

---

## 2. Dynamic Clinical Lookup Service (`ClinicalLookupService`)

To eliminate hardcoded identifiers (`doctor: 71`, `patient: 196`, `medicament: 2`, `test: 1`, `account: 5/6`), all clinical API routes utilize `ClinicalLookupService` located in `frontend/src/lib/clinical-lookup.ts`:

| Lookup Method | Target Model | Domain Criteria | Returned Entity |
| :--- | :--- | :--- | :--- |
| `resolveClinician` | `gnuhealth.healthprofessional` | User's linked party or active health professionals | Validated Clinician ID (`healthprofId`) |
| `resolvePatientParty` | `gnuhealth.patient` | Patient ID -> extracts linked Many2One `party` | Patient Party ID (`partyId`) |
| `resolvePartyAddress` | `party.address` | Patient's `partyId` (finds existing or creates) | Billing Address ID (`addressId`) |
| `resolveBillingAccounts`| `account.account` | Kind `'receivable'` and `'revenue'`, scoped to company | Dynamic Account IDs (`receivableId`, `revenueId`) |
| `resolveProductAndUom` | `product.product` | Active consultation/medical service product | Product ID and Default UoM ID |
| `resolveMedicament` | `gnuhealth.medicament` | Medicament name or first active record | Validated Medicament ID |
| `resolveImagingTest` | `gnuhealth.imaging.test` | Imaging test name or first active study | Validated Imaging Test ID |
| `resolveLabTestType` | `gnuhealth.lab.test_type`| Lab test name or first active test type | Validated Lab Test Type ID |

---

## 3. Page-by-Page Full-Stack Traceability Matrix

### A. Reception & Front Desk (`/frontdesk`, `/frontdesk/register`, `/frontdesk/appointments`)

#### 1. Patient Registration Form (`/frontdesk/register`)
- **Trigger:** Front desk staff submits new patient form.
- **Frontend Action:** Sends `POST /api/clinical/patients` with JSON payload `{ name, qid, gender, dob, phone, street, city }`.
- **BFF Authorization:** Validates `session.sessionToken` exists and role is `reception` or `admin`.
- **Tryton Transactions:**
  1. `party.party.create([{'name': name, 'gender': gender, 'dob': dob, 'is_patient': True}])`
  2. `party.address.create([{'party': party_id, 'street': street, 'city': city}])`
  3. `party.contact_mechanism.create([{'party': party_id, 'type': 'phone', 'value': phone}])`
  4. `gnuhealth.patient.create([{'party': party_id}])` -> Native PUID trigger fires (e.g. `28266989701`).
- **Response:** `{ success: true, patient: { id: 87, puid: "28266989701", name: "ALEXANDER WRIGHT ACCEPTANCE 698970" } }`.
- **Constraint Enforcement:** Uniqueness constraints (`gnuhealth_patient_name_uniq` and duplicate QID) return HTTP 400 conflict.

#### 2. Appointment Scheduling Dialog (`/frontdesk/appointments`)
- **Trigger:** Front desk books consultation for registered patient.
- **Frontend Action:** Sends `POST /api/clinical/appointments` with `{ action: 'book', patientId, healthprofId, appointmentDate, urgency: 'normal' }`.
- **Dynamic Resolution:** If `healthprofId` is omitted, `ClinicalLookupService.resolveClinician` dynamically resolves the attending physician.
- **BFF Translation:** Converts urgency string `"normal"` to native Tryton Selection key `'a'` (Normal).
- **Tryton Transaction:** `gnuhealth.appointment.create([{'patient': patientId, 'healthprof': doctorId, 'appointment_date': dt, 'urgency': 'a', 'state': 'confirmed'}])`.
- **Check-In Action:** Sends `action: 'checkin'`. BFF executes `gnuhealth.appointment.write([apptId], {'state': 'checked_in'})`.
- **UI State Update:** Appointment card transitions to amber `Checked In` badge; real-time queue automatically alerts Nursing Triage.

---

### B. Nursing Triage Cockpit (`/nursing`)

#### 1. Vital Signs Telemetry & Acuity Logging
- **Trigger:** Triage nurse enters vitals telemetry for checked-in patient.
- **Frontend Action:** Sends `POST /api/clinical/triage` with `{ patientId, appointmentId, systolic, diastolic, bpm, temp, weight, height, bmi, notes }`.
- **Dynamic Resolution:** Nurse clinician ID dynamically resolved via `ClinicalLookupService.resolveClinician`.
- **Tryton Transaction:** `gnuhealth.patient.evaluation.create([{'patient': pid, 'appointment': apptId, 'healthprof': nurseId, 'systolic': 120, 'diastolic': 80, 'bpm': 72, 'temperature': 37.0, 'weight': 70, 'height': 175, 'bmi': 22.86, 'notes': notes, 'evaluation_type': 'triage', 'state': 'done'}])`.
- **PostgreSQL Persistence:** Row committed in `gnuhealth_patient_evaluation`.
- **UI State Update:** Triage vitals panel immediately refreshes with calculated BMI (22.86 kg/m²) and normal cardiovascular indicators.

---

### C. Physician Clinical Cockpit (`/physician`)

#### 1. Clinical Consultation & ICD-10 Coding
- **Trigger:** Attending physician documents encounter.
- **Frontend Action:** Sends `POST /api/clinical/consultations` with `{ patientId, chiefComplaint, physicalExam, diagnosisCode: 'J06.9', directions }`.
- **Dynamic Resolution:** Doctor ID resolved via `ClinicalLookupService.resolveClinician`.
- **Tryton Transactions:**
  1. Resolves `pathology_id` from `gnuhealth.pathology` where `code = 'J06.9'`.
  2. Updates evaluation record: `gnuhealth.patient.evaluation.write([evalId], {'healthprof': doctorId, 'present_illness': chiefComplaint, 'evaluation_summary': physicalExam, 'diagnosis': pathId, 'directions': directions, 'state': 'signed'})`.
  3. Records diagnosed disease: `gnuhealth.patient.disease.create([{'patient': pid, 'pathology': pathId, 'diagnosed_date': today}])`.
- **UI State Update:** Displays signed consultation stamp with ICD-10 descriptor `Acute Upper Respiratory Infection`.

#### 2. Electronic Prescription Order
- **Trigger:** Physician issues medication prescription.
- **Frontend Action:** Sends `POST /api/clinical/prescriptions` with `{ patientId, lines: [{ medicament: 'Amoxicillin 500mg', dose: '500', frequency: 'TID', duration: '7' }] }`.
- **Dynamic Resolution:** 
  1. Attending clinician resolved via `resolveClinician`.
  2. Medicament ID resolved via `resolveMedicament` (e.g. ID `2` or active drug).
  3. Frequency parsed to integer (`TID` -> `3`, `BID` -> `2`, `QID` -> `4`, `QD` -> `1`).
  4. Duration period explicitly set to `'days'`.
- **Tryton Transactions:**
  1. `gnuhealth.prescription.order.create([{'patient': pid, 'healthprof': doctorId, 'prescription_date': dtObj, 'state': 'draft', 'prescription_warning_ack': true}])`.
  2. `gnuhealth.prescription.line.create([{'presc_order': rxId, 'medicament': medId, 'dose': 500, 'frequency': 3, 'duration': 7, 'duration_period': 'days'}])`.
- **UI State Update:** Renders signed e-Prescription with medication order identifier, instantly available to dispensary.

---

### D. Diagnostic Laboratory & Radiology (`/laboratory`, `/radiology`)

#### 1. Complete Blood Count (CBC) Certification (`/laboratory`)
- **Trigger:** Laboratory technologist reviews worklist and enters analytical values.
- **Requisition Action:** `POST /api/clinical/laboratory` `{ action: 'create', patientId, test: 'CBC' }`.
  - Dynamic Resolution: Test type resolved via `resolveLabTestType`, requestor doctor resolved via `resolveClinician`.
  - Tryton Transaction: `gnuhealth.lab.create([{'patient': pid, 'test': testTypeId, 'requestor': doctorId, 'date_analysis': dtObj, 'state': 'draft'}])`.
- **Certification Action:** `POST /api/clinical/laboratory` `{ action: 'certify', orderId, results: 'Hemoglobin 14.1 g/dL, Platelets 245 x10^3/uL' }`.
  - Tryton Transaction: `gnuhealth.lab.write([labId], {'results': results, 'state': 'done'})`.
- **UI State Update:** Worklist row moves from `Pending Analysis` to `Certified & Released`.

#### 2. Digital Radiology PACS Requisition & Reporting (`/radiology`)
- **Trigger:** Radiologist views imaging study and signs PACS report.
- **Requisition Action:** `POST /api/clinical/radiology` `{ action: 'create', patientId, study: 'Chest X-Ray' }`.
  - Dynamic Resolution: Imaging test resolved via `resolveImagingTest`, requesting doctor resolved via `resolveClinician`.
  - Tryton Transaction: `gnuhealth.imaging.test.request.create([{'patient': pid, 'requested_test': imagingTestId, 'doctor': doctorId, 'date': dtObj, 'state': 'draft'}])`.
- **Signing Action:** `POST /api/clinical/radiology` `{ action: 'sign', orderId, findings: 'Clear lung fields bilaterally. Cardiac silhouette normal.' }`.
  - Tryton Transaction: `gnuhealth.imaging.test.request.write([oid], {'state': 'done', 'comment': findings})`.
- **UI State Update:** Study status updates to `Diagnostic Report Archived (Done)`.

---

### E. Financial Billing & General Ledger Audit (`/billing`)

#### 1. Customer Encounter Invoicing
- **Trigger:** Cashier generates encounter bill upon clinical discharge.
- **Frontend Action:** Sends `POST /api/clinical/billing` with `{ action: 'create', patientId: 87, amount: '50.00', service: 'Outpatient Consultation' }`.
- **Dynamic Resolution:**
  1. Party ID resolved from `gnuhealth.patient.party`.
  2. Party address resolved or created in `party.address` via `resolvePartyAddress`.
  3. Receivable and revenue accounts dynamically queried via `resolveBillingAccounts` (e.g. `110000` / `401000`) matching tenant company context.
  4. Service product and default UoM resolved via `resolveProductAndUom`.
- **Tryton Transactions:**
  1. `account.invoice.create([{'type': 'out', 'party': partyId, 'invoice_address': addrId, 'account': receivableAccountId, 'invoice_date': today, 'state': 'draft'}])`.
  2. `account.invoice.line.create([{'invoice': invId, 'account': revenueAccountId, 'product': productId, 'unit': uomId, 'description': service, 'quantity': 1, 'unit_price': 50.0}])`.
- **Post Action:** `POST /api/clinical/billing` `{ action: 'post', invoiceId }` -> Invokes `account.invoice.post([invId])` -> Generates General Ledger accounting move in `account.move`.
- **Cash Payment Settlement Wizard:** `POST /api/clinical/billing` `{ action: 'pay', invoiceId, journal: 'Cash', amount: '50.00' }` -> Updates invoice `state='paid'`, balancing AR to $0.00.
- **UI State Update:** Invoicing table updates invoice badge to green `Settled / Paid`; General Ledger tab displays matching debit/credit balanced double-entry moves.

---

### F. Unified 360° EHR Patient Chart (`/patient/[id]`)

#### 1. Complete Longitudinal Chart Hydration
Previously populated with static demo fixtures, `/patient/[id]` now fetches all encounter categories in parallel on client hydration:
```typescript
const [patRes, apptRes, consultRes, rxRes, labRes, radRes, billRes] = await Promise.all([
  fetch(`/api/clinical/patients?id=${id}`),
  fetch(`/api/clinical/appointments?patientId=${id}`),
  fetch(`/api/clinical/consultations?patientId=${id}`),
  fetch(`/api/clinical/prescriptions?patientId=${id}`),
  fetch(`/api/clinical/laboratory?patientId=${id}`),
  fetch(`/api/clinical/radiology?patientId=${id}`),
  fetch(`/api/clinical/billing?patientId=${id}`),
]);
```
- **Dynamic Demographics:** Initials badge, age calculated from DOB, PUID, phone, and gender dynamically rendered from PostgreSQL `party_party`.
- **Encounter Sub-tabs:** Appointments, Doctor Evaluations, Prescriptions, Laboratory Reports, Imaging Studies, and Billing Invoices dynamically render real records.
- **Access Gracefulness:** If clinical staff (physician/nurse) queries billing, `/api/clinical/billing` returns `{ success: true, invoices: [], accessRestricted: true }`, ensuring no UI crash occurs due to backend RBAC segregation.
