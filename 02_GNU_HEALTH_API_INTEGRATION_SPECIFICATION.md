# GNU Health HMIS — Native API Integration Specification
## Complete JSON-RPC 2.0 Integration Contract & Technical Capability Catalog

**Document Reference:** `GH-API-SPEC-002`  
**System Target:** GNU Health HMIS 5.0.6 / Tryton Application Server 7.0.57  
**API Transport:** JSON-RPC 2.0 over HTTP/HTTPS  
**Base RPC Endpoint:** `http://34.7.237.8/gnuhealth/` (Production: `https://<clinic-domain>/gnuhealth/`)  
**Security Status:** Header-Based Token Authentication & Native Model-Level RBAC  
**Audience:** Frontend Engineers, API Integration Architects, Mobile App Developers

---

## 1. Architectural Authority & Mandatory Integration Boundary

GNU Health HMIS, operating on the Tryton application framework, is the **exclusive system of record and business logic engine**. The clinic frontend is strictly an interactive presentation client.

```
+-------------------------------------------------------------+
|                  Future Clinic Frontend                     |
|        (Web / Mobile / React / Next.js / Flutter)           |
+-------------------------------------------------------------+
                              |
                              | Native Authenticated JSON-RPC 2.0
                              | (HTTPS via Browser / Fetch API)
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

### The 7 Non-Negotiable Invariants:
1. **No Direct Database Access:** The frontend must never connect directly to PostgreSQL (port 5432).
2. **No Direct Database Writes:** Raw SQL `INSERT`, `UPDATE`, or `DELETE` queries are prohibited.
3. **No Shadow Tables:** The frontend must not create parallel database tables for patient, clinical, diagnostic, or financial entities.
4. **No Duplicate Accounting Engine:** The frontend must never calculate general ledger debits/credits or maintain independent accounting state.
5. **No Parallel RBAC:** The frontend must not create an independent permission store. Tryton enforces all security.
6. **No Workflow Bypass:** The frontend must follow the defined state machine progression.
7. **GNU Health Is Authoritative:** Every record rendered in the UI must originate from GNU Health.

---

## 2. Protocol, Endpoints & Authentication Lifecycle

### 2.1 Transport Protocol
- **Protocol:** HTTP/1.1 or HTTP/2 over TLS (HTTPS).
- **Format:** JSON-RPC 2.0.
- **Base Endpoint:** `http://34.7.237.8/gnuhealth/` (or `https://<clinic-domain>/gnuhealth/`).
- **HTTP Headers Required:**
  ```http
  Content-Type: application/json
  Accept: application/json
  Authorization: Session <base64_encoded_token>
  ```

### 2.2 Authentication Handshake (`common.db.login`)
Authentication is initiated by calling the native `common.db.login` method.

#### Request Format:
```http
POST /gnuhealth/ HTTP/1.1
Host: 34.7.237.8
Content-Type: application/json

{
  "id": 1,
  "method": "common.db.login",
  "params": ["<USERNAME>", "<PASSWORD>"]
}
```

#### Successful Response:
```json
{
  "id": 1,
  "result": [12, "abc123sessiontoken456xyz"],
  "error": null
}
```
- `result[0]` = Integer User ID (e.g., `12`).
- `result[1]` = Cryptographic Session Token string.

#### Constructing the Authorization Header:
Combine the User ID and Session Token separated by a colon, and Base64-encode the string:
```
Raw String:    "12:abc123sessiontoken456xyz"
Base64 String: "MTI6YWJjMTIzc2Vzc2lvbnRva2VuNDU2eHl6"
HTTP Header:   Authorization: Session MTI6YWJjMTIzc2Vzc2lvbnRva2VuNDU2eHl6
```

### 2.3 Session Lifecycle & Expiration
- **Session Duration:** Sessions remain active based on Tryton server timeout settings (default: 30 days of inactivity).
- **Session Expiration Behavior:** If an RPC request is submitted with an expired or invalid token, Tryton returns an HTTP `401 Unauthorized` status or an `AccessError` exception.
- **Logout:** Calling `common.db.logout` invalidates the server-side session token.

---

## 3. Standard JSON-RPC Request & Response Anatomy

### 3.1 Generic Method Call Structure
All business operations target the `model.<model_name>.<method_name>` namespace:
```json
{
  "id": 101,
  "method": "model.<MODEL_NAME>.<METHOD_NAME>",
  "params": [
    <ARGUMENT_1>,
    <ARGUMENT_2>,
    <CONTEXT_OBJECT>
  ]
}
```

### 3.2 Context Object
Every data-modifying or read operation accepts a context dictionary defining environment variables:
```json
{
  "company": 1,
  "language": "en",
  "client": "clinic_custom_frontend_v1"
}
```

### 3.3 Core Generic ORM Methods
Every Tryton model exposes five core ORM operations (subject to RBAC):

| Method Name | Signature | Description |
| :--- | :--- | :--- |
| `search` | `(domain, offset=0, limit=None, order=None, context=None)` | Returns a list of integer IDs matching search criteria. |
| `read` | `(ids, fields_names, context=None)` | Returns dictionaries of requested field values for given IDs. |
| `search_read` | `(domain, offset=0, limit=None, order=None, fields_names=None, context=None)` | Combines search and read into a single round-trip. |
| `create` | `([values_dict_1, values_dict_2, ...], context=None)` | Creates new records; returns list of created integer IDs. |
| `write` | `(ids, values_dict, context=None)` | Updates specified records; returns boolean `true`. |
| `delete` | `(ids, context=None)` | Deletes records (if permitted and not locked); returns `true`. |

---

## 4. API Operation Catalog (Grouped by Functional Domain)

### Domain A: Authentication & Session
- **Model / Service:** `common.db`
- **Method:** `login`
  - **Parameters:** `[username, password]`
  - **Returns:** `[user_id, session_token]` or `false`
- **Method:** `logout`
  - **Parameters:** `[]`
  - **Returns:** `true`

### Domain B: Users & Context
- **Model:** `res.user`
- **Method:** `read`
  - **Parameters:** `[[<user_id>], ["name", "login", "email", "groups"], <context>]`
  - **Returns:** Current user details and role group memberships.

### Domain C: Patients & Demographics
- **Models:** `party.party`, `party.address`, `gnuhealth.patient`
- **Method:** `model.party.party.create`
  - **Parameters:** `[[{"name": "string", "is_person": true, "is_patient": true, "gender": "m"|"f", "dob": "YYYY-MM-DD", "fed_country": "QAT", "ref": "string"}], <context>]`
  - **Permission:** `Health Front Desk`, `Health Doctor`, `Administration`
- **Method:** `model.gnuhealth.patient.create`
  - **Parameters:** `[[{"party": <party_id>, "blood_type": "string", "rh": "string"}], <context>]`
  - **Returns:** `[<patient_id>]` (PUID sequence auto-generated)
- **Method:** `model.gnuhealth.patient.search_read`
  - **Domain:** `[["party.name", "ilike", "%search_term%"]]` or `[["puid", "=", "KQI816APL"]]`

### Domain D: Appointment Scheduling
- **Model:** `gnuhealth.appointment`
- **Method:** `model.gnuhealth.appointment.create`
  - **Parameters:** `[[{"patient": <patient_id>, "healthprof": <healthprof_id>, "appointment_date": "YYYY-MM-DD HH:MM:SS", "specialty": <specialty_id>}], <context>]`
  - **State:** Initializes in `free` or `confirmed`
- **Method:** `model.gnuhealth.appointment.search_read`
  - **Domain:** `[["appointment_date", ">=", "YYYY-MM-DD 00:00:00"], ["healthprof", "=", <doctor_id>]]`

### Domain E: Patient Check-In
- **Model:** `gnuhealth.appointment`
- **Method:** `model.gnuhealth.appointment.write` (or workflow action button)
  - **Parameters:** `[[<appointment_id>], {"state": "checked_in"}, <context>]`
  - **Permission:** `Health Front Desk`, `Health Nurse`

### Domain F: Nursing Triage & Vitals
- **Model:** `gnuhealth.patient.evaluation`
- **Method:** `model.gnuhealth.patient.create`
  - **Parameters:**
    ```json
    [[{
      "patient": <patient_id>,
      "healthprof": <attending_physician_id>,
      "systolic": 120,
      "diastolic": 80,
      "bpm": 76,
      "temperature": 37.0,
      "respiratory_rate": 16,
      "osat": 98,
      "weight": 75.0,
      "height": 175.0,
      "evaluation_type": "outpatient"
    }], <context>]
    ```
  - **Permission:** `Health Nurse`, `Health Doctor`

### Domain G: Clinical Evaluation & SOAP
- **Model:** `gnuhealth.patient.evaluation`
- **Method:** `model.gnuhealth.patient.evaluation.write`
  - **Parameters:**
    ```json
    [[<evaluation_id>], {
      "chief_complaint": "Mild fever and headache",
      "present_illness": "Patient reports mild fever for two days.",
      "evaluation_summary": "Temperature 37.0 C, vitals stable.",
      "info_diagnosis": "Viral upper respiratory infection.",
      "directions": "Hydration, rest, symptomatic therapy.",
      "diagnosis": <pathology_id>
    }, <context>]
    ```
  - **Action `end_evaluation`:** Signs and finalizes the evaluation record, transitioning it to `signed`.
  - **Permission:** `Health Doctor` exclusively.

### Domain H: Medical Coding (ICD-10)
- **Model:** `gnuhealth.pathology`
- **Method:** `model.gnuhealth.pathology.search_read`
  - **Domain:** `[["code", "ilike", "J06%"]]` or `[["name", "ilike", "%respiratory%"]]`
  - **Fields:** `["id", "code", "name"]`

### Domain I: Electronic Prescriptions
- **Models:** `gnuhealth.prescription.order`, `gnuhealth.prescription.line`
- **Method:** `model.gnuhealth.prescription.order.create`
  - **Parameters:**
    ```json
    [[{
      "patient": <patient_id>,
      "healthprof": <doctor_id>,
      "prescription_warning_ack": true,
      "lines": [
        ["create", [{
          "medicament": <medicament_id>,
          "dose": 500,
          "dose_unit": <unit_id>,
          "form": <form_id>,
          "route": <route_id>,
          "qty": 15,
          "frequency": 3,
          "duration": 5,
          "duration_period": "days"
        }]]
      ]
    }], <context>]
    ```
- **Action `create_prescription`:** Transitions order to `done` (validated).

### Domain J: Diagnostic Laboratory
- **Model:** `gnuhealth.lab`
- **Method:** `model.gnuhealth.lab.create`
  - **Parameters:** `[[{"patient": <patient_id>, "requestor": <doctor_id>, "test": <test_type_id>}], <context>]`
- **Action `complete_criteareas`:** Generates analyte criteria lines.
- **Method:** `model.gnuhealth.lab.test.critearea.write` (result entry for analytes).
- **Action `generate_document`:** Validates results and sets state to `done`.

### Domain K: Medical Imaging (Radiology)
- **Models:** `gnuhealth.imaging.test.request`, `gnuhealth.imaging.test.result`
- **Method:** `model.gnuhealth.imaging.test.request.create`
  - **Parameters:** `[[{"patient": <patient_id>, "requested_test": <test_id>, "comment": "string"}], <context>]`
- **Action `requested` & `generate_results`:** Finalizes report into state `done`.

### Domain L: Health Services
- **Model:** `gnuhealth.health_service`, `gnuhealth.health_service.line`
- **Method:** `model.gnuhealth.health_service.create`
  - **Parameters:** `[[{"patient": <patient_id>, "desc": "Outpatient Encounter"}], <context>]`

### Domain M & N: Customer Invoicing
- **Model:** `account.invoice`, `account.invoice.line`
- **Method:** `model.account.invoice.create`
  - **Parameters:**
    ```json
    [[{
      "party": <patient_party_id>,
      "type": "out",
      "currency": 1,
      "lines": [
        ["create", [{
          "product": <service_product_id>,
          "quantity": 1,
          "unit_price": 150.00
        }]]
      ]
    }], <context>]
    ```
- **Action `post`:** Validates and posts the invoice to the general ledger, creating immutable move #47.

### Domain O: Cashier Payments
- **Wizard Model:** `account.invoice.pay`
- **Method:** Native payment execution linking to payment method (`Cash Payment (QAR)`).
- **Result:** Invoice state transitions to `paid`.

### Domain P & Q: Accounting & Reconciliation
- **Models:** `account.move`, `account.move.line`
- **Method:** `model.account.move.search_read`
  - **Domain:** `[["origin", "=", "account.invoice,<invoice_id>"]]`
  - **Lines Verification:** Total Debits == Total Credits.

### Domain R: Patient Related Records
- **Model:** Native `relate` queries linking patient to appointments, evaluations, prescriptions, labs, and invoices.

### Domain S & T: Reporting & Administration
- Standard Tryton report engines and administrative models (`res.user`, `res.group`).

---

## 5. Standard Error Schemas & Exception Handling

Tryton returns JSON-RPC errors as two-element lists inside the `"error"` key: `["ErrorClass", "Human-readable message"]`.

### 5.1 RBAC Access Denied (`AccessError`)
```json
{
  "id": 201,
  "result": null,
  "error": [
    "AccessError",
    "You are not allowed to access \"Patient Evaluation\". - "
  ]
}
```

### 5.2 Clinical / Accounting Immutability Error (`AccessError`)
```json
{
  "id": 202,
  "result": null,
  "error": [
    "AccessError",
    "You cannot modify invoice \"INV-2026/00014\" because it is posted, paid or cancelled. - "
  ]
}
```

### 5.3 Validation & Constraint Error (`UserError`)
```json
{
  "id": 203,
  "result": null,
  "error": [
    "UserError",
    "The value \"invalid_state\" for field \"State\" is not one of the allowed options."
  ]
}
```

### 5.4 Unique Constraint Violation (`SQLConstraintError`)
```json
{
  "id": 204,
  "result": null,
  "error": [
    "SQLConstraintError",
    "The patient reference number must be unique."
  ]
}
```

---

## 6. End-to-End Integration Flow Example (Frontend Developer Recipe)

```typescript
// Example: Centralized Authenticated Fetch Routine in TypeScript
async function callGnuHealthRpc(method: string, params: any[], sessionToken?: string) {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "Accept": "application/json"
  };
  
  if (sessionToken) {
    headers["Authorization"] = `Session ${sessionToken}`;
  }

  const response = await fetch("http://34.7.237.8/gnuhealth/", {
    method: "POST",
    headers,
    body: JSON.stringify({
      id: Date.now(),
      method,
      params
    })
  });

  const data = await response.json();
  if (data.error) {
    const [errClass, errMsg] = data.error;
    throw new Error(`[GNU Health ${errClass}] ${errMsg}`);
  }
  return data.result;
}
```
