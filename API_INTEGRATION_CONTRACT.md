# GNU HEALTH HMIS 5.0 / TRYTON 7.0 — API INTEGRATION CONTRACT
## Programmatic JSON-RPC Interface Specification for Future Custom Frontend & Integration Gateways

**Document Identifier**: `GH-API-012`  
**System Baseline**: GNU Health 5.0.6 / Tryton 7.0.57 JSON-RPC Kernel  
**Protocol Standard**: JSON-RPC 2.0 over HTTPS  
**Integration Boundary**: Strictly Backend Service Interface (Future Custom Frontend Decoupled)  
**Status**: `AUTHORITATIVE API INTEGRATION CONTRACT`  

---

## 1. Architectural Scope & Protocol Specification

This contract defines the standardized, programmatic application programming interface (API) exposed by the GNU Health / Tryton backend. When the custom clinic frontend is developed, it will interface with the backend strictly through authenticated, role-constrained JSON-RPC endpoints.

### 1.1 Transport & Endpoint Details
* **Production HTTPS Endpoint**: `https://<CLINIC-FQDN>/gnuhealth/` (Post-TLS activation)
* **Local Backend Endpoint**: `http://127.0.0.1:8000/gnuhealth/`
* **Transport Protocol**: HTTP/1.1 or HTTP/2 over TLS 1.3
* **Payload Encoding**: `application/json` (UTF-8)

---

## 2. Authentication & Session Protocol

Tryton enforces session-token authentication. API clients authenticate once via `common.db.login` and pass the returned session token in subsequent request headers.

### 2.1 Login Request (`common.db.login`)
```json
{
  "method": "common.db.login",
  "params": ["gnuhealth", "uat_doctor", "SECRET_PASSWORD"],
  "id": 1
}
```

### 2.2 Login Success Response
```json
{
  "result": [11, "34a8f9c2d1e0b5a67c8d9e0f1a2b3c4d"],
  "error": null,
  "id": 1
}
```
* `result[0]`: User ID (e.g., `11`)
* `result[1]`: Session Token (e.g., `"34a8f9c2d1e0b5a67c8d9e0f1a2b3c4d"`)

### 2.3 Authenticated Request Header
All subsequent API requests pass the credentials in the standard HTTP header:
```http
Authorization: Session dWF0X2RvY3RvcjoxMTozNGE4ZjljMmQxZTBiNWE2N2M4ZDllMGYxYTJiM2M0ZA==
```
*(Base64 encoding of `<username>:<user_id>:<session_token>`)*.

---

## 3. Core Outpatient API Endpoints & Request Contracts

### 3.1 Patient Management (`model.gnuhealth.patient`)

#### Search Patient by National QID
```json
{
  "method": "model.gnuhealth.patient.search_read",
  "params": [
    [["name.identifiers.code", "=", "QID-28563412345"]],
    0, 10, null,
    ["id", "puid", "name.name", "name.gender", "name.dob", "name.federation_account"]
  ],
  "id": 2
}
```

#### Register New Outpatient
```json
{
  "method": "model.gnuhealth.patient.create",
  "params": [
    [{
      "name": {
        "name": "Ahmed Al-Mansoori",
        "is_person": true,
        "is_patient": true,
        "gender": "m",
        "dob": "1988-06-15",
        "fed_country": "QAT",
        "identifiers": [["create", [{"type": "qid", "code": "QID-28863499999"}]]],
        "addresses": [["create", [{"street": "Street 920, Zone 55", "city": "Doha"}]]]
      }
    }]
  ],
  "id": 3
}
```

---

### 3.2 Appointment Scheduling (`model.gnuhealth.appointment`)

#### Book Outpatient Consultation
```json
{
  "method": "model.gnuhealth.appointment.create",
  "params": [
    [{
      "patient": 23,
      "healthprof": 8,
      "appointment_date": "2026-09-23 09:00:00",
      "urgency": "routine",
      "comments": "Initial primary care consultation"
    }]
  ],
  "id": 4
}
```

#### Transition Appointment to Checked-In
```json
{
  "method": "model.gnuhealth.appointment.check_in",
  "params": [[29]],
  "id": 5
}
```

---

### 3.3 Clinical Outpatient Encounter (`model.gnuhealth.patient.evaluation`)

#### Create Clinical SOAP Consultation
```json
{
  "method": "model.gnuhealth.patient.evaluation.create",
  "params": [
    [{
      "patient": 23,
      "healthprof": 8,
      "appointment": 29,
      "evaluation_type": "pa",
      "chief_complaint": "Persistent sore throat and mild cough for 3 days",
      "bp_systolic": 120,
      "bp_diastolic": 80,
      "heart_rate": 72,
      "temperature": 37.0,
      "respiratory_rate": 16,
      "diagnosis": 13204,
      "directions": "Rest, oral hydration, symptomatic analgesia"
    }]
  ],
  "id": 6
}
```

#### Physician Sign-off & Record Locking
```json
{
  "method": "model.gnuhealth.patient.evaluation.sign",
  "params": [[17]],
  "id": 7
}
```

---

### 3.4 Electronic Prescribing (`model.gnuhealth.prescription.order`)

#### Create & Validate Prescription Order
```json
{
  "method": "model.gnuhealth.prescription.order.create",
  "params": [
    [{
      "patient": 23,
      "healthprof": 8,
      "prescription_warning_ack": true,
      "prescription_line": [["create", [{
        "medicament": 1,
        "dose": 1.0,
        "dose_unit": 1,
        "form": 1,
        "route": 1,
        "frequency": 3,
        "duration": 5,
        "duration_period": "days",
        "qty": 15
      }]]]
    }]
  ],
  "id": 8
}
```

---

### 3.5 Outpatient Billing & Cashier Settlement (`model.account.invoice`)

#### Create Outpatient Customer Invoice
```json
{
  "method": "model.account.invoice.create",
  "params": [
    [{
      "party": 32,
      "type": "out",
      "company": 2,
      "currency": 634,
      "journal": 1,
      "invoice_address": 32,
      "lines": [["create", [{
        "product": 4,
        "unit": 1,
        "quantity": 1.0,
        "unit_price": "250.00",
        "account": 6
      }]]]
    }]
  ],
  "id": 9
}
```

#### Post Invoice to General Ledger
```json
{
  "method": "model.account.invoice.post",
  "params": [[12]],
  "id": 10
}
```

#### Cashier Settlement (Cash Payment in QAR)
```json
{
  "method": "model.account.invoice.pay",
  "params": [
    [12],
    {
      "payment_method": 1,
      "amount": "250.00",
      "currency": 634,
      "date": "2026-09-22"
    }
  ],
  "id": 11
}
```

---

## 4. Error Handling & Standard Error Codes

Tryton JSON-RPC returns structured error payloads when exceptions occur:

| Error Type | Description | HTTP Status | Mitigation / Client Action |
| :--- | :--- | :---: | :--- |
| **`UserError`** | Business logic violation (e.g., missing mandatory field)| `200 OK` (JSON error)| Display user-friendly error message returned in `error.message` |
| **`AccessError`** | RBAC permission violation (unauthorized role) | `200 OK` (JSON error)| Alert user that profile lacks access to requested model |
| **`ConcurrencyException`**| Optimistic locking write conflict | `200 OK` (JSON error)| Reload record from server and retry transaction |
| **`RateLimitExceeded`**| Nginx rate limit exceeded | `429 Too Many Requests`| Backoff request rate |
