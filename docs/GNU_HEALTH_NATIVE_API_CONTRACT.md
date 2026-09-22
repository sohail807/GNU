# GNU HEALTH HMIS 5.0 / TRYTON 7.0 — NATIVE API INTEGRATION CONTRACT

## 1. Architectural Authority & Mandatory Integration Boundary

This document establishes the **authoritative, legally binding API integration contract** between the future outpatient clinic frontend application and the GNU Health HMIS backend.

```
+-------------------------------------------------------------+
|                  Future Clinic Frontend                     |
|        (Web / Mobile / React / Next.js / Flutter)           |
+-------------------------------------------------------------+
                              |
                              | Native Authenticated JSON-RPC
                              v
+-------------------------------------------------------------+
|               Reverse Proxy & TLS Termination               |
|                   Nginx (Port 80 / 443)                     |
+-------------------------------------------------------------+
                              |
                              | 127.0.0.1:8000 (Internal Only)
                              v
+-------------------------------------------------------------+
|             GNU Health HMIS 5.0 / Tryton 7.0                |
|  - Sole System of Record                                    |
|  - Native ORM Business Rules & Workflow State Machines      |
|  - Native Role-Based Access Control (RBAC)                  |
|  - Native General Ledger Accounting Engine                  |
+-------------------------------------------------------------+
                              |
                              | 127.0.0.1:5432 (Internal Only)
                              v
+-------------------------------------------------------------+
|                   PostgreSQL 15.19 RDBMS                    |
+-------------------------------------------------------------+
```

### Mandatory Frontend Integration Rules (Non-Negotiable)

To preserve clinical safety, diagnostic integrity, regulatory compliance, and statutory financial audibility:

1. **NO DIRECT POSTGRESQL ACCESS**: The frontend must **NEVER** connect directly to PostgreSQL.
2. **NO DIRECT DATABASE WRITES**: The frontend must **NEVER** execute raw `INSERT`, `UPDATE`, or `DELETE` queries on the database.
3. **NO SHADOW OR DUPLICATE BUSINESS TABLES**: The frontend must **NOT** create its own duplicate tables for patients, appointments, evaluations, prescriptions, laboratory orders, imaging orders, or invoices.
4. **NO DUPLICATE ACCOUNTING ENGINE**: The frontend must **NOT** calculate general ledger debits/credits or maintain its own accounting state. All fiscal transactions, invoicing, and receivables settlement are handled natively by Tryton's accounting module.
5. **NO PARALLEL RBAC ENGINE**: The frontend must **NOT** maintain its own user permission system. User authentication, group membership, model-level permissions, and field-level readonly states are strictly enforced by Tryton's native RBAC.
6. **NO BYPASS OF CLINICAL WORKFLOWS**: The frontend must **NOT** bypass required workflow states (e.g., attempting to mark an appointment `done` without check-in, or modifying an evaluation once `signed`).
7. **GNU HEALTH IS THE ONLY SYSTEM OF RECORD**: Every transaction rendered in the UI must originate from and be stored in GNU Health/Tryton.

---

## 2. Protocol, Endpoints & Authentication Lifecycle

### 2.1 Communication Protocol
- **Transport**: HTTP/1.1 or HTTP/2 over TLS (HTTPS).
- **Format**: JSON-RPC 2.0.
- **Base Endpoint**: `https://<api-domain>/<database_name>/` (e.g., `https://clinic.example.com/gnuhealth/`).
- **Content-Type**: `application/json`.

### 2.2 Authentication & Session Lifecycle

Tryton uses header-based HTTP Basic Authentication or Session Cookie tokens for RPC calls.

#### 1. Authentication Handshake
- **Request**: Call `common.login` to authenticate credentials.
  - **Method**: `POST /gnuhealth/`
  - **Payload**:
    ```json
    {
      "id": 1,
      "method": "common.db.login",
      "params": ["<username>", "<password>"]
    }
    ```
- **Response**:
  - Success returns `[<user_id>, "<session_token>"]`.
  - Failure returns `false` or RPC Error `401 Unauthorized`.

#### 2. Authenticated RPC Calls
All subsequent RPC requests must supply the authentication token via the HTTP Authorization header:
```http
Authorization: Session <base64_encoded_user_id_colon_session_token>
```
Or via standard Tryton JSON-RPC dispatch:
```json
{
  "id": 2,
  "method": "model.<model_name>.<method_name>",
  "params": [
    "<context_or_args>",
    ...
  ]
}
```

#### 3. Session Expiration & Re-authentication
Sessions expire after inactivity (configured in Tryton server settings). When receiving an authentication error (code 401 or `UserError`), the frontend must prompt the user to re-authenticate and refresh the session token.

---

## 3. Core Operational Data Models & API Operations

Every business entity in GNU Health maps directly to an authoritative Tryton ORM model.

### 3.1 Patient Registration (`party.party`, `gnuhealth.patient`)

#### Model Overview
- **`party.party`**: Authoritative entity for individual human person attributes (legal name, date of birth, gender, tax/national ID).
- **`party.address`**: Physical clinic contact address (street, city, country).
- **`gnuhealth.patient`**: Outpatient clinical file linking the party to the electronic medical record (PUID sequence, blood type, Rh, general clinical indicators).

#### Representative API Call: Create Patient File
- **RPC Method**: `model.party.party.create` followed by `model.gnuhealth.patient.create`
- **Required Fields (`party.party`)**:
  - `name` (string, required): Full legal name.
  - `is_person` (boolean, required): `true`.
  - `is_patient` (boolean, required): `true`.
  - `gender` (selection, required): `'m'` | `'f'`.
  - `dob` (date `YYYY-MM-DD`, required): Date of birth.
  - `fed_country` (string, required): Country ISO Alpha-3 code (e.g., `'QAT'`).
  - `ref` (string, optional/unique): Civil ID / QID number.
- **Required Fields (`gnuhealth.patient`)**:
  - `party` (integer Many2One, required): ID of created `party.party`.
  - `puid` (string, generated/optional): Unique Medical Record Number (auto-generated if omitted).
- **Authorization**: `Health Front Desk`, `Health Nurse`, `Health Doctor`, or `Health Administration`.
- **Example Request**:
  ```json
  {
    "id": 10,
    "method": "model.party.party.create",
    "params": [
      [{
        "name": "Fatima Al-Kuwari",
        "is_person": true,
        "is_patient": true,
        "gender": "f",
        "dob": "1994-08-12",
        "fed_country": "QAT",
        "ref": "29463401234"
      }]
    ]
  }
  ```
- **Example Response**:
  ```json
  {
    "id": 10,
    "result": [215],
    "error": null
  }
  ```

---

### 3.2 Appointment Scheduling & Workflow (`gnuhealth.appointment`)

#### Model Overview
Tracks patient visits, provider assignment, scheduling slots, and operational status transitions.

#### Valid Workflow States
`free` -> `confirmed` -> `checked_in` -> `done` (or `user_cancelled` / `center_cancelled` / `no_show`)

#### Operations
- **Search Available Slots**: `model.gnuhealth.appointment.search_read` with domain `[('state', '=', 'free')]`.
- **Book Appointment**: `model.gnuhealth.appointment.write` setting `patient=<patient_id>`, `state='confirmed'`.
- **Patient Arrival / Check-in**:
  - **Method**: `model.gnuhealth.appointment.write`
  - **Params**: `[<appointment_id>], {"state": "checked_in"}`
  - **Authorization**: `Health Front Desk`, `Health Nurse`.
- **Consultation Complete**:
  - **Method**: `model.gnuhealth.appointment.write`
  - **Params**: `[<appointment_id>], {"state": "done"}`
  - **Authorization**: `Health Doctor`.

---

### 3.3 Clinical Evaluation & Triage (`gnuhealth.patient.evaluation`)

#### Model Overview
Stores outpatient triage vitals, chief complaints, history of present illness, physical examination summary, and clinical conclusions.

#### Required Fields
- `patient` (Many2One `gnuhealth.patient`, required).
- `healthprof` (Many2One `gnuhealth.healthprofessional`, required): Attending clinician.
- `appointment` (Many2One `gnuhealth.appointment`, optional/recommended).
- `institution` (Many2One `gnuhealth.institution`, required).
- `evaluation_start` (datetime, required).
- `evaluation_type` (selection, required): `'outpatient'` | `'telemedicine'` | `'homecare'` | `'inpatient'`.
- `chief_complaint` (string, required).
- `diagnosis` (Many2One `gnuhealth.pathology`, required upon completion): Primary ICD-10 pathology.
- `state` (selection): `'draft'` | `'in_progress'` | `'signed'`.

#### Immutability Enforcement
- Once `state` is set to `'signed'`, the evaluation record is **locked**.
- Fields have native `states={'readonly': Eval('state') == 'signed'}`.
- Deletions are blocked by `ir.model.access` for non-administrative roles.
- Unauthorized write attempts raise `AccessError`.

---

### 3.4 Prescription Management (`gnuhealth.prescription.order`, `gnuhealth.prescription.line`)

#### Model Overview
Electronic prescribing engine enforcing formulation, dosage, route, frequency, duration, and clinical indication linkage.

#### Workflow States
`draft` -> `done` (validated)

#### Required Fields
- Order (`gnuhealth.prescription.order`):
  - `patient` (Many2One `gnuhealth.patient`, required).
  - `healthprof` (Many2One `gnuhealth.healthprofessional`, required).
  - `prescription_date` (datetime, required).
  - `prescription_warning_ack` (boolean, required): Clinician safety acknowledgement.
- Line (`gnuhealth.prescription.line`):
  - `presc_order` (Many2One `gnuhealth.prescription.order`, required).
  - `medicament` (Many2One `gnuhealth.medicament`, required).
  - `dose` (Decimal, required): e.g., `500.0`.
  - `dose_unit` (Many2One `gnuhealth.dose.unit`, required): e.g., `mg`.
  - `form` (Many2One `gnuhealth.drug.form`, required): e.g., `Tablet`.
  - `route` (Many2One `gnuhealth.drug.route`, required): e.g., `Oral`.
  - `qty` (integer, required): Quantity dispensed.
  - `frequency` (integer, required): Times per day.
  - `duration` (integer, required): e.g., `5`.
  - `duration_period` (selection, required): `'days'` | `'weeks'` | `'months'`.
  - `indication` (Many2One `gnuhealth.pathology`, required): Primary ICD-10 diagnosis.

---

### 3.5 Laboratory Requisitions (`gnuhealth.lab`)

#### Model Overview
Diagnostic pathology ordering, specimen collection tracking, technical result entry, and clinical validation.

#### Workflow States
`draft` -> `tested` -> `validated`

#### Operations & Authorization
- **Clinician Order**: `Health Doctor` creates requisition in state `'draft'` with `requestor`, `test` (Many2One `gnuhealth.lab.test_type`), and `pathology`.
- **Lab Technician Processing**: `Health Lab` records quantitative/qualitative findings in `results` and marks `'tested'`.
- **Validation**: `Health Lab` or `Health Doctor` marks `'validated'`.

---

### 3.6 Diagnostic Radiology (`gnuhealth.imaging.test.request`, `gnuhealth.imaging.test.result`)

#### Model Overview
Medical imaging order workflow and formalized radiologist reporting.

#### Required Fields
- Request (`gnuhealth.imaging.test.request`):
  - `patient` (Many2One `gnuhealth.patient`, required).
  - `doctor` (Many2One `gnuhealth.healthprofessional`, required).
  - `requested_test` (Many2One `gnuhealth.imaging.test`, required): e.g., Chest X-Ray.
  - `date` (datetime, required).
- Result (`gnuhealth.imaging.test.result`):
  - `request` (Many2One `gnuhealth.imaging.test.request`, required).
  - `patient` (Many2One `gnuhealth.patient`, required).
  - `doctor` (Many2One `gnuhealth.healthprofessional`, required): Reporting radiologist/physician.
  - `requested_test` (Many2One `gnuhealth.imaging.test`, required).
  - `date` (datetime, required).
  - `comment` (text, required): Formal narrative diagnostic report.

---

### 3.7 Health Services Compilation (`gnuhealth.health_service`, `gnuhealth.health_service.line`)

#### Model Overview
Compiles all billable clinical encounter items (consultation fees, diagnostic procedures, laboratory tests, medications) into a unified billing manifest.

#### Required Fields
- Header (`gnuhealth.health_service`):
  - `patient` (Many2One `gnuhealth.patient`, required).
  - `institution` (Many2One `gnuhealth.institution`, required).
  - `company` (Many2One `company.company`, required).
  - `service_date` (date, required).
  - `desc` (string, required): Encounter description.
- Line (`gnuhealth.health_service.line`):
  - `service` (Many2One `gnuhealth.health_service`, required).
  - `product` (Many2One `product.product`, required): Service product catalog item.
  - `qty` (integer, required): Quantity delivered.
  - `to_invoice` (boolean, required): `true`.

---

### 3.8 Patient Invoicing & Fiscal Posting (`account.invoice`, `account.invoice.line`)

#### Model Overview
Authoritative financial invoice generating dual-entry general ledger moves.

#### Native Tryton Posting Workflow
1. **Create Invoice**:
   - `party` = patient party ID
   - `type` = `'out'` (Customer Invoice)
   - `journal` = Revenue Journal ID
   - `account` = Accounts Receivable (110000)
   - `currency` = QAR ID
2. **Add Lines**:
   - `product` = service product
   - `account` = Operating Revenue (401000)
   - `quantity` = Decimal quantity
   - `unit_price` = Approved tariff price
3. **Execute Native Posting**:
   - Call `model.account.invoice.update_taxes([invoice_id])`
   - Call `model.account.invoice.validate_invoice([invoice_id])`
   - Call `model.account.invoice.post([invoice_id])`

#### Immutability & Financial Control
Once posted (`state='posted'`):
- The invoice cannot be edited or deleted.
- The invoice generates an immutable General Ledger Move (`account.move`) with balanced Debit (Accounts Receivable) and Credit (Revenue).
- Any attempt to delete or alter a posted invoice raises `AccessError: You cannot modify invoice "<number>" because it is posted, paid or cancelled`.

---

### 3.9 Cashier Payments & Receivables Settlement (`account.move`, `account.move.line`)

#### Model Overview
Direct recording of cash/card payments settling outstanding customer accounts receivable.

#### Settlement Flow
1. Cashier receives settlement for invoice.
2. Call `model.account.move.create` with lines:
   - Debit: Cash / Bank Account (101000)
   - Credit: Accounts Receivable (110000) with `party=<patient_party_id>`
3. Call `model.account.move.post([move_id])`.
4. Call `model.account.move.line.reconcile([invoice_ar_line_id, payment_ar_line_id])`.
5. Net Accounts Receivable balance for patient becomes `0.00 QAR`.

---

## 4. Role-Based Access Control (RBAC) Matrix for API Operations

The API strictly evaluates user credentials and groups on every request. Any violation returns an `AccessError` or `AccessForbidden`.

| Functional Domain | Model Name | Front Desk (`demo_frontdesk1`) | Nurse (`demo_nurse1`) | Physician (`demo_dr1`) | Lab Tech (`demo_lab1`) | Rad Tech (`demo_rad1`) | Cashier (`demo_cashier1`) | Admin (`demo_admin1`) |
|:------------------|:-----------|:-------------------------------|:----------------------|:-----------------------|:-----------------------|:-----------------------|:--------------------------|:----------------------|
| **Patient Registration** | `gnuhealth.patient` | Read, Create, Write | Read, Create, Write | Read, Create, Write | Read | Read | Read | Full Access |
| **Appointment Booking** | `gnuhealth.appointment` | Read, Create, Write, Check-in | Read, Write | Read, Write, Complete | Read | Read | Read | Full Access |
| **Clinical Evaluation** | `gnuhealth.patient.evaluation` | DENY | Read, Create (Triage), Write | Read, Create, Write, Sign | DENY | DENY | DENY | Full Access |
| **Prescriptions** | `gnuhealth.prescription.order` | DENY | Read | Read, Create, Write, Done | DENY | DENY | DENY | Full Access |
| **Laboratory Orders** | `gnuhealth.lab` | DENY | Read | Read, Create | Read, Write, Validate | DENY | DENY | Full Access |
| **Radiology Orders** | `gnuhealth.imaging.test.request` | DENY | Read | Read, Create | DENY | Read, Write, Complete | DENY | Full Access |
| **Health Services** | `gnuhealth.health_service` | Read | Read | Read, Create, Write | Read | Read | Read, Write | Full Access |
| **Customer Invoices** | `account.invoice` | DENY | DENY | DENY | DENY | DENY | Read, Create, Post | Full Access |
| **Payments / GL Moves** | `account.move` | DENY | DENY | DENY | DENY | DENY | Read, Create, Post, Reconcile | Full Access |
| **System Administration**| `res.user`, `res.group` | DENY | DENY | DENY | DENY | DENY | DENY | Full Access |

---

## 5. Standard Error Handling & Response Schemas

### 5.1 Success Response
```json
{
  "id": 101,
  "result": {
    "status": "success",
    "data": { ... }
  },
  "error": null
}
```

### 5.2 Access Denied (RBAC Enforced)
When a role attempts an unauthorized model operation (e.g., cashier creating an evaluation):
```json
{
  "id": 102,
  "result": null,
  "error": [
    "AccessError",
    "You are not allowed to access \"Patient Evaluation\". - "
  ]
}
```

### 5.3 Accounting Immutability Violation
When attempting to delete or modify a posted invoice or move:
```json
{
  "id": 103,
  "result": null,
  "error": [
    "AccessError",
    "You cannot modify invoice \"INV-2026/00007\" because it is posted, paid or cancelled. - "
  ]
}
```

### 5.4 Data Validation / Constraint Error
When an invalid selection or missing foreign key is passed:
```json
{
  "id": 104,
  "result": null,
  "error": [
    "UserError",
    "The value \"invalid_state\" for field \"State\" is not one of the allowed options."
  ]
}
```

---

## 6. Frontend Developer Checklist

Before deploying any feature in the frontend, verify:
- [ ] No direct database connections exist in the codebase.
- [ ] Every API call uses the native JSON-RPC Tryton endpoint.
- [ ] All patient and clinical IDs match GNU Health database records.
- [ ] Invoicing and payment flows call Tryton's native posting and reconciliation methods.
- [ ] All state transitions match the defined workflow state machines.
- [ ] All user credentials and session tokens are stored securely in browser session/memory and never written to repository or logs.
