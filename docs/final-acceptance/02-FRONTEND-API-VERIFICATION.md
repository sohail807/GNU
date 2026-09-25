# IST Health HMIS — Frontend-to-Backend Full-Stack Verification & Traceability

**Document Reference:** `docs/final-acceptance/02-FRONTEND-API-VERIFICATION.md`  
**Execution Date:** September 25, 2026  
**Auditor:** Independent Full-Stack Engineer & GNU Health Systems Architect  

---

## 1. Architectural Integration Model

IST Health utilizes a modern, zero-trust **Backend-for-Frontend (BFF)** architecture. The Next.js 16 frontend never exposes GNU Health / Tryton credentials or database endpoints directly to the browser. Every user operation flows through the authenticated BFF layer:

```
[Browser / Chrome UI]
       │
       ▼ (HTTPS / Secure Cookie `ist_health_session`)
[Next.js 16 Route Handler: /api/clinical/*]
       │
       ▼ (Validates Session & Role Scope)
[TrytonClient.ts RPC Dispatcher]
       │
       ▼ (HTTP Basic / Session Header + Mandatory Company Context `company: 2`)
[Tryton 7.0 JSON-RPC 2.0 Engine: http://34.7.237.8/gnuhealth/]
       │
       ▼ (ORM Validation, Model Access & Record Rules)
[PostgreSQL 15 Authoritative Database: `gnuhealth`]
```

---

## 2. Page-by-Page Full-Stack Traceability Matrix

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
- **Error Handling:** Uniqueness constraint violations (`gnuhealth_patient_name_uniq` or duplicate QID) return HTTP 400 with user-friendly conflict message.

#### 2. Appointment Scheduling Dialog (`/frontdesk/appointments`)
- **Trigger:** Front desk books consultation for registered patient.
- **Frontend Action:** Sends `POST /api/clinical/appointments` with `{ action: 'book', patientId, healthprofId: 71, appointmentDate, urgency: 'normal' }`.
- **BFF Translation:** Converts urgency string `"normal"` to native Tryton Selection key `'a'` (Normal).
- **Tryton Transaction:** `gnuhealth.appointment.create([{'patient': patientId, 'healthprof': 71, 'appointment_date': dt, 'urgency': 'a', 'state': 'confirmed'}])`.
- **Check-In Action:** Sends `action: 'checkin'`. BFF executes `gnuhealth.appointment.write([apptId], {'state': 'checked_in'})`.
- **UI State Update:** Appointment card transitions to amber `Checked In` badge; real-time queue automatically alerts Nursing Triage.

---

### B. Nursing Triage Cockpit (`/nursing`)

#### 1. Vital Signs Telemetry & Acuity Logging
- **Trigger:** Triage nurse enters vitals telemetry for checked-in patient.
- **Frontend Action:** Sends `POST /api/clinical/triage` with `{ patientId, appointmentId, systolic, diastolic, bpm, temp, weight, height, bmi, notes }`.
- **Tryton Transaction:** `gnuhealth.patient.evaluation.create([{'patient': pid, 'appointment': apptId, 'systolic': 120, 'diastolic': 80, 'bpm': 72, 'temperature': 37.0, 'weight': 70, 'height': 175, 'bmi': 22.86, 'notes': notes, 'evaluation_type': 'triage', 'state': 'done'}])`.
- **PostgreSQL Persistence:** Row committed in `gnuhealth_patient_evaluation`.
- **UI State Update:** Triage vitals panel immediately refreshes with calculated BMI (22.86 kg/m²) and normal cardiovascular indicators.

---

### C. Physician Clinical Cockpit (`/physician`)

#### 1. Clinical Consultation & ICD-10 Coding
- **Trigger:** Attending physician documents encounter.
- **Frontend Action:** Sends `POST /api/clinical/consultations` with `{ patientId, chiefComplaint, physicalExam, diagnosisCode: 'J06.9', directions }`.
- **Tryton Transactions:**
  1. Resolves `pathology_id` from `gnuhealth.pathology` where `code = 'J06.9'`.
  2. Updates evaluation record: `gnuhealth.patient.evaluation.write([evalId], {'present_illness': chiefComplaint, 'evaluation_summary': physicalExam, 'diagnosis': pathId, 'directions': directions, 'state': 'signed'})`.
  3. Records diagnosed disease: `gnuhealth.patient.disease.create([{'patient': pid, 'pathology': pathId, 'diagnosed_date': today}])`.
- **UI State Update:** Displays signed consultation stamp with ICD-10 descriptor `Acute Upper Respiratory Infection`.

#### 2. Electronic Prescription Order
- **Trigger:** Physician issues medication prescription.
- **Frontend Action:** Sends `POST /api/clinical/prescriptions` with `{ patientId, lines: [{ medicament: 'Amoxicillin 500mg', dose: '500', route: 'Oral', frequency: 'TID', duration: '7' }] }`.
- **Tryton Transactions:**
  1. `gnuhealth.prescription.order.create([{'patient': pid, 'healthprof': 71, 'prescription_date': dtObj, 'state': 'draft', 'prescription_warning_ack': true}])`.
  2. `gnuhealth.prescription.line.create([{'presc_order': rxId, 'medicament': 2, 'dose': 500, 'route': 'Oral', 'frequency': 'TID', 'duration': 7}])`.
- **UI State Update:** Renders signed e-Prescription with medication order identifier, instantly available to dispensary.

---

### D. Diagnostic Laboratory & Radiology (`/laboratory`, `/radiology`)

#### 1. Complete Blood Count (CBC) Certification (`/laboratory`)
- **Trigger:** Laboratory technologist reviews worklist and enters analytical values.
- **Requisition Action:** `POST /api/clinical/laboratory` `{ action: 'create', patientId, test: 'CBC' }` -> Creates `gnuhealth.lab` record.
- **Certification Action:** `POST /api/clinical/laboratory` `{ action: 'certify', orderId, results: 'Hemoglobin 14.1 g/dL, Platelets 245 x10^3/uL' }`.
- **Tryton Transaction:** `gnuhealth.lab.write([labId], {'results': results, 'state': 'done'})`.
- **UI State Update:** Worklist row moves from `Pending Analysis` to `Certified & Released`.

#### 2. Digital Radiology PACS Requisition & Reporting (`/radiology`)
- **Trigger:** Radiologist views imaging study and signs PACS report.
- **Requisition Action:** `POST /api/clinical/radiology` `{ action: 'create', patientId, study: 'Chest X-Ray' }`.
  - Tryton Transaction: `gnuhealth.imaging.test.request.create([{'patient': pid, 'requested_test': 1, 'doctor': 71, 'date': dtObj, 'state': 'draft'}])`.
- **Signing Action:** `POST /api/clinical/radiology` `{ action: 'sign', orderId, findings: 'Clear lung fields bilaterally. Cardiac silhouette normal.' }`.
  - Tryton Transaction: `gnuhealth.imaging.test.request.write([oid], {'state': 'done', 'comment': findings})`.
- **UI State Update:** Study status updates to `Diagnostic Report Archived (Done)`.

---

### E. Financial Billing & General Ledger Audit (`/billing`)

#### 1. Customer Encounter Invoicing
- **Trigger:** Cashier generates encounter bill upon clinical discharge.
- **Frontend Action:** Sends `POST /api/clinical/billing` with `{ action: 'create', patientId: 87, amount: '50.00', service: 'Outpatient Consultation' }`.
- **Party & Address Resolution:** Resolves `party` ID from patient 87; resolves/creates billing address in `party.address`.
- **Tryton Transactions:**
  1. `account.invoice.create([{'type': 'out', 'party': partyId, 'invoice_address': addrId, 'account': 5, 'invoice_date': today, 'state': 'draft'}])`.
  2. `account.invoice.line.create([{'invoice': invId, 'account': 6, 'product': 15, 'unit': 1, 'description': service, 'quantity': 1, 'unit_price': 50.0}])`.
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
