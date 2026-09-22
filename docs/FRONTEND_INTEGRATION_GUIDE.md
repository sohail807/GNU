# GNU HEALTH HMIS 5.0 — FRONTEND INTEGRATION GUIDE

**Document ID:** GNU-HEALTH-FE-GUIDE-2026-09-22  
**Target Audience:** Frontend Software Engineers, UI/UX Developers, Full-Stack Architects  
**Authoritative Backend:** GNU Health HMIS 5.0 / Tryton 7.0 / PostgreSQL 15.19  
**Reference API Contract:** `docs/GNU_HEALTH_NATIVE_API_CONTRACT.md`  

---

## 1. Core Architecture & Architectural Invariants

The clinic frontend is strictly a **presentation and user interaction layer**. GNU Health HMIS is the **sole system of record**, clinical workflow authority, billing engine, and security policy enforcer.

```
+-------------------------------------------------------------+
|                   Future Clinic Frontend                    |
|             (React / Next.js / Vue / Mobile)                |
+-------------------------------------------------------------+
                              |
                              | Native Authenticated JSON-RPC 2.0
                              | (HTTPS via Browser / Fetch API)
                              v
+-------------------------------------------------------------+
|                     Nginx Reverse Proxy                     |
|           - TLS Termination (Port 443 / HTTPS)              |
|           - Security Headers & Request Filtering            |
+-------------------------------------------------------------+
                              |
                              | http://127.0.0.1:8000
                              v
+-------------------------------------------------------------+
|              GNU Health HMIS 5.0 / Tryton 7.0               |
|  - Sole System of Record                                    |
|  - Native ORM Business Rules & Workflow State Machines      |
|  - Role-Based Access Control (RBAC) Enforcement             |
|  - General Ledger Accounting & AR Reconciliation           |
+-------------------------------------------------------------+
                              |
                              | Non-superuser connection (5432)
                              v
+-------------------------------------------------------------+
|                    PostgreSQL 15.19 RDBMS                   |
+-------------------------------------------------------------+
```

### The 7 Non-Negotiable Invariants:
1. **NO Direct Database Connections:** The frontend must never import PostgreSQL libraries (`pg`, `psycopg2`, `prisma`, `typeorm`, etc.) or connect directly to port 5432.
2. **NO Shadow Database Tables:** The frontend must never maintain its own database tables for patients, appointments, evaluations, prescriptions, laboratory orders, imaging orders, or invoices.
3. **NO Duplicate Business Logic:** The frontend must never duplicate medical validation (e.g. drug dosing algorithms), workflow transitions, or financial calculations (e.g. general ledger debits/credits).
4. **NO Invented Endpoints:** The frontend must communicate solely through native Tryton JSON-RPC endpoints (`POST /gnuhealth/`). Do not invent REST endpoints or mock APIs that bypass Tryton.
5. **Report Missing Capabilities Instead of Creating Workarounds:** If a required frontend operation cannot be achieved via the native API, **STOP** and document the exact missing backend capability. Do not create parallel databases or proxy layers.
6. **Zero Secret Leakage:** The frontend must never receive or handle database passwords, Tryton administrator credentials, server SSH keys, or backend secrets.
7. **Native RBAC Delegation:** UI element visibility (e.g., hiding a button) is purely a cosmetic convenience for the user. Real security is enforced by Tryton on every RPC call.

---

## 2. Communication Protocol & Session Lifecycle

### 2.1 Transport Protocol
- **Transport:** HTTP/1.1 or HTTP/2 over TLS (HTTPS).
- **Endpoint:** `https://<clinic-domain>/gnuhealth/` (routed to Tryton by Nginx).
- **Format:** JSON-RPC 2.0.
- **Request Headers:**
  - `Content-Type: application/json`
  - `Accept: application/json`
  - `Authorization: Session <base64_encoded_token>` (for authenticated calls)

### 2.2 Standard JSON-RPC 2.0 Payload Formats

#### Method Call Format:
```json
{
  "id": 1,
  "method": "model.<model_name>.<method_name>",
  "params": [
    "<param_1>",
    "<param_2>",
    ...
  ]
}
```

#### Success Response Format:
```json
{
  "id": 1,
  "result": "<result_value_or_object>",
  "error": null
}
```

#### Error Response Format:
```json
{
  "id": 1,
  "result": null,
  "error": [
    "ErrorClassName",
    "Human readable error message from GNU Health."
  ]
}
```

---

## 3. Detailed Guide for the 18 Frontend Integration Areas

### 3.1 Authentication & Login

- **Frontend Action:** User enters username and password on clinic login screen.
- **JSON-RPC Method:** `common.db.login`
- **Model:** `res.user` (internal)
- **Allowed Operation:** Authentication handshake
- **Required Role:** Any active user account
- **Workflow / State Transition:** N/A
- **Request Payload:**
  ```json
  {
    "id": 1,
    "method": "common.db.login",
    "params": ["demo_dr1", "UserSuppliedPassword"]
  }
  ```
- **Expected Response:** `[<user_id>, "<session_token>"]` (e.g. `[146, "s3ss10n_t0k3n_str1ng"]`)
- **Expected Error:** `false` or `["UserError", "Invalid username or password"]`
- **Frontend Storage:** Store `user_id` and `session_token` in application memory or secure session storage. All subsequent requests must provide the token in the `Authorization` header:
  `Authorization: Session base64(user_id:session_token)`

---

### 3.2 Patient Registration & Search

#### 3.2.1 Search Patient
- **Frontend Action:** Search patient by Civil ID (QID), Medical Record Number (PUID), or Name.
- **JSON-RPC Method:** `model.gnuhealth.patient.search_read`
- **Model:** `gnuhealth.patient`
- **Allowed Operation:** Read / Search
- **Required Role:** Front Desk, Nurse, Doctor, Cashier, Lab, Radiology, Admin
- **Request Payload:**
  ```json
  {
    "id": 2,
    "method": "model.gnuhealth.patient.search_read",
    "params": [
      [["puid", "=", "DEMO-QID-000001"]],
      0,
      10,
      null,
      ["id", "puid", "name", "gender", "dob"]
    ]
  }
  ```
- **Expected Response:** Array of patient records matching criteria.
- **Expected Error:** `["AccessError", "You are not allowed to access \"Patient\"."]`

#### 3.2.2 Register New Patient
- **Frontend Action:** Register a new outpatient.
- **Step 1:** Create `party.party` with `name`, `is_person=true`, `is_patient=true`, `gender`, `dob`, `fed_country='QAT'`, `ref=<qid>`.
- **Step 2:** Create `gnuhealth.patient` with `party=<created_party_id>`.
- **JSON-RPC Methods:** `model.party.party.create` then `model.gnuhealth.patient.create`
- **Required Role:** Front Desk, Nurse, Doctor, Admin (Cashier/Lab/Rad are DENIED create)
- **Expected Response:** IDs of created party and patient.
- **Expected Error:** `["SQLConstraintError", "The PUID must be unique"]` if Civil ID already exists.

---

### 3.3 Appointment Management (Scheduling & Search)

- **Frontend Action:** View appointment roster or schedule an appointment.
- **JSON-RPC Method:** `model.gnuhealth.appointment.search_read` / `model.gnuhealth.appointment.create`
- **Model:** `gnuhealth.appointment`
- **Allowed Operation:** Read / Create / Write
- **Required Role:** Front Desk, Doctor, Nurse, Admin
- **Fields Required:**
  - `patient`: Patient ID
  - `healthprof`: Clinician ID
  - `appointment_date`: ISO Datetime string (`2026-09-22 09:30:00`)
  - `appointment_type`: `'outpatient'`
  - `state`: `'free'` (or `'confirmed'`)
- **Expected Response:** Created appointment record ID.
- **Expected Error:** `["AccessError", "You are not allowed to access \"Appointment\"."]`

---

### 3.4 Patient Arrival & Check-In

- **Frontend Action:** Receptionist marks arrived patient as checked in.
- **JSON-RPC Method:** `model.gnuhealth.appointment.write`
- **Model:** `gnuhealth.appointment`
- **Allowed Operation:** State transition
- **Required Role:** Front Desk, Nurse
- **Workflow State Transition:** `'confirmed'` → `'checked_in'`
- **Request Payload:**
  ```json
  {
    "id": 4,
    "method": "model.gnuhealth.appointment.write",
    "params": [
      [50],
      {"state": "checked_in"}
    ]
  }
  ```
- **Expected Response:** `true`
- **Expected Error:** `["UserError", "Invalid state transition"]`

---

### 3.5 Outpatient Nursing Triage

- **Frontend Action:** Nurse records vital signs (BP, Pulse, Temperature, SpO2, Weight, Height) and preliminary complaints.
- **JSON-RPC Method:** `model.gnuhealth.patient.evaluation.create`
- **Model:** `gnuhealth.patient.evaluation`
- **Allowed Operation:** Create / Write
- **Required Role:** Nurse, Doctor
- **Workflow State:** Initial state `'in_progress'`
- **Key Fields:** `patient`, `healthprof`, `appointment`, `institution`, `evaluation_start`, `evaluation_type='outpatient'`, `systolic`, `diastolic`, `bpm`, `temperature`, `respiratory_rate`, `osat`, `weight`, `height`.
- **Expected Response:** Created evaluation ID.
- **Expected Error:** `["AccessError", "You are not allowed to access \"Patient Evaluation\"."]` (raised if Front Desk or Cashier attempts).

---

### 3.6 Clinician Consultation & Clinical Evaluation

- **Frontend Action:** Attending physician reviews vitals, documents History of Present Illness (HPI), physical exam, and assessment.
- **JSON-RPC Method:** `model.gnuhealth.patient.evaluation.write`
- **Model:** `gnuhealth.patient.evaluation`
- **Allowed Operation:** Write / Sign
- **Required Role:** Doctor (`Health Doctor`)
- **Key Fields:** `chief_complaint`, `present_illness`, `evaluation_summary`, `diagnosis`.
- **Sign & Lock Transition:** Setting `{"state": "signed"}` permanently locks the record.
- **Expected Response:** `true`
- **Expected Error:** If already signed, further edits raise `["AccessError", "You are not allowed to modify signed evaluation."]`.

---

### 3.7 Diagnosis Coding (ICD-10 Pathology)

- **Frontend Action:** Clinician assigns primary ICD-10 diagnostic code.
- **JSON-RPC Method:** `model.gnuhealth.patient.disease.create` or linking `pathology` on `gnuhealth.patient.evaluation`.
- **Model:** `gnuhealth.patient.disease` / `gnuhealth.pathology`
- **Allowed Operation:** Search ICD-10 catalog / Create patient disease record
- **Required Role:** Doctor
- **Catalog Search Example:**
  ```json
  {
    "id": 7,
    "method": "model.gnuhealth.pathology.search_read",
    "params": [
      [["code", "like", "J06%"]],
      0,
      10,
      null,
      ["id", "code", "name"]
    ]
  }
  ```
- **Expected Response:** Array of matching ICD-10 codes (e.g. `[{"id": 3505, "code": "J06.9", "name": "Acute upper respiratory infection, unspecified"}]`).

---

### 3.8 Electronic Prescription (Ordering & Validation)

- **Frontend Action:** Clinician prescribes medications with dosage, route, frequency, and duration.
- **JSON-RPC Method:** `model.gnuhealth.prescription.order.create` and `model.gnuhealth.prescription.line.create`
- **Models:** `gnuhealth.prescription.order`, `gnuhealth.prescription.line`
- **Allowed Operation:** Create / Validate
- **Required Role:** Doctor
- **Workflow State Transition:** `'draft'` → `'done'`
- **Validation Rule:** Must link `medicament`, `dose`, `dose_unit`, `form`, `route`, `qty`, `frequency`, `duration`, `duration_period`, and `indication` (ICD-10).
- **Expected Response:** Prescription order ID.
- **Expected Error:** `["AccessError", "You are not allowed to access \"Prescription\"."]` (Front desk and cashier blocked).

---

### 3.9 Laboratory Orders & Results

- **Frontend Action:**
  - Clinician orders lab test (e.g. CBC).
  - Lab technician enters results and validates test.
- **JSON-RPC Methods:** `model.gnuhealth.lab.create` / `model.gnuhealth.lab.write`
- **Model:** `gnuhealth.lab`
- **Required Role:**
  - Ordering: Doctor (`Health Doctor`)
  - Testing & Validation: Lab Tech (`Health Lab`)
- **Workflow State Transition:** `'draft'` → `'tested'` → `'validated'`
- **Result Recording:** Field `results` stores qualitative/quantitative laboratory findings.
- **Expected Response:** Lab order ID / update confirmation.

---

### 3.10 Radiology / Imaging Orders & Results

- **Frontend Action:**
  - Clinician orders imaging examination (e.g. CXR).
  - Radiologist records diagnostic findings report.
- **JSON-RPC Methods:** `model.gnuhealth.imaging.test.request.create` and `model.gnuhealth.imaging.test.result.create`
- **Models:** `gnuhealth.imaging.test.request`, `gnuhealth.imaging.test.result`
- **Required Role:**
  - Ordering: Doctor (`Health Doctor`)
  - Reporting: Radiology Technician / Radiologist (`Health Imaging`)
- **Workflow State Transition:** Request state transitions to `'done'` upon result filing.
- **Expected Response:** Requisition ID and Result ID.

---

### 3.11 Health Services Manifest Compilation

- **Frontend Action:** System compiles delivered clinical encounter services into a billing manifest.
- **JSON-RPC Method:** `model.gnuhealth.health_service.create` and `model.gnuhealth.health_service.line.create`
- **Models:** `gnuhealth.health_service`, `gnuhealth.health_service.line`
- **Allowed Operation:** Create / Read
- **Required Role:** Doctor, Cashier, Front Desk, Admin
- **Manifest Content:** Consultation service, lab service product, imaging service product with `to_invoice=true`.
- **Expected Response:** Health service manifest ID.

---

### 3.12 Invoice Viewing & Generation

- **Frontend Action:** Cashier reviews encounter charges and posts customer invoice.
- **JSON-RPC Method:** `model.account.invoice.create` followed by `model.account.invoice.post`
- **Models:** `account.invoice`, `account.invoice.line`
- **Allowed Operation:** Read / Create / Post
- **Required Role:** Cashier (`Account`, `Accounting Party`), Admin
- **Immutability Protection:** Once posted (`state='posted'`), invoices are permanent and cannot be modified or deleted.
- **Expected Response:** Posted invoice ID and generated invoice sequence number (`INV-2026/XXXXX`).
- **Expected Error:** `["AccessError", "You cannot modify invoice... because it is posted"]` if modification is attempted.

---

### 3.13 Payment Processing & AR Settlement

- **Frontend Action:** Cashier collects payment and reconciles customer accounts receivable.
- **JSON-RPC Method:** `model.account.move.create`, `model.account.move.post`, `model.account.move.line.reconcile`
- **Models:** `account.move`, `account.move.line`
- **Allowed Operation:** Post cash receipt / Reconcile move lines
- **Required Role:** Cashier (`Account`), Admin
- **Accounting Verification:** Debit Cash in Hand (101000) = Credit Accounts Receivable (110000). Remaining customer balance becomes `0.00 QAR`.
- **Expected Response:** Reconciliation ID.

---

### 3.14 Patient Clinical History View

- **Frontend Action:** Clinician reviews longitudinal medical history for an existing patient.
- **JSON-RPC Method:** `model.<model_name>.search_read` with domain `[('patient', '=', <patient_id>)]` across:
  - `gnuhealth.appointment` (visit history)
  - `gnuhealth.patient.evaluation` (prior evaluations and vitals)
  - `gnuhealth.patient.disease` (past diagnoses and chronic conditions)
  - `gnuhealth.prescription.order` (medication history)
  - `gnuhealth.lab` (diagnostic laboratory reports)
  - `gnuhealth.imaging.test.result` (radiology reports)
- **Required Role:** Doctor, Nurse
- **Expected Response:** Complete chronological clinical history.

---

### 3.15 Role-Based Navigation & UI Adaptation

- **Frontend Action:** Dynamically render application menus based on authenticated user's role groups.
- **Mechanism:**
  - Upon login, query `model.res.user.read` for `groups` assigned to the user.
  - Front Desk: Register Patient, Appointment Calendar, Check-In Desk.
  - Nurse: Triage Queue, Vitals Entry, Patient Roster.
  - Doctor: Outpatient Clinic Roster, Consultation EMR, Diagnosis, Rx, Lab/Imaging Orders.
  - Lab Tech: Laboratory Worklist, Specimen Entry, Lab Validation.
  - Rad Tech: Radiology Worklist, Imaging Report Entry.
  - Cashier: Billing Manifest Queue, Invoicing, Cash Receipt, Settlement.
  - Administrator: System Health, User Management, Operational Audit.

---

### 3.16 Standardized Error Handling

The frontend must implement a centralized error interceptor for JSON-RPC responses:

```javascript
function handleRpcResponse(response) {
  if (response.error) {
    const [errorType, errorMessage] = response.error;
    switch (errorType) {
      case "AccessError":
        notifyUser("Access Denied: Your assigned role is not permitted to perform this action.");
        break;
      case "UserError":
        notifyUser(`Operational Validation Warning: ${errorMessage}`);
        break;
      case "SQLConstraintError":
        notifyUser(`Data Integrity Conflict: ${errorMessage}`);
        break;
      case "ConcurrencyException":
        notifyUser("Record was modified by another user. Please refresh.");
        break;
      default:
        notifyUser(`System Error: ${errorMessage}`);
    }
    throw new Error(`${errorType}: ${errorMessage}`);
  }
  return response.result;
}
```

---

### 3.17 Session Expiration & Refresh Handling

- **Token Lifecycle:** Sessions expire after a configured idle period.
- **Interceptor Rule:** If any RPC call returns HTTP 401 or `["UserError", "Session expired"]`:
  1. Clear cached session tokens from application memory.
  2. Display session expiration dialog to the clinician.
  3. Redirect to login screen preserving current draft form state if appropriate.
  4. Never store plaintext credentials in browser `localStorage` or `sessionStorage`.

---

### 3.18 Audit-Safe Operations & Traceability

- **Automatic Audit Attribution:** GNU Health automatically records `create_uid`, `create_date`, `write_uid`, and `write_date` on every database record.
- **Frontend Obligation:** The frontend must never attempt to spoof or manually pass `create_uid` or timestamps. Attribution is derived directly from the authenticated session header.
- **Immutable Log Integrity:** All changes to patient evaluations and accounting moves produce immutable transaction history in GNU Health.
