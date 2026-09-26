---
name: gnuhealth-api-validation
description: >-
  Validate the native Tryton JSON-RPC API, authentication protocol, session token issuance, model dispatching, RBAC authorization, and error handling for GNU Health HMIS. Use when testing backend API readiness or verifying frontend integration endpoints.
---

# GNU Health Native API Validation Runbook

This skill validates the native Tryton JSON-RPC API layer exposed on the GNU Health server, verifying endpoint structure, cryptographic session management, model RPC dispatchers, role-based access control (RBAC), and negative error handling.

## Prerequisites
- Accessible GNU Health server on `http://34.7.237.8/` (JSON-RPC port 80/8000).
- Python environment with `urllib3` or `requests`.
- Database name: `gnuhealth`.

## API Endpoint Specification

All API interactions utilize the standard Tryton JSON-RPC 2.0 protocol over HTTP POST:
- **Base Endpoint:** `http://34.7.237.8/gnuhealth/`
- **Content-Type:** `application/json`

### Authentication Flow:
1. **Request Login:**
   ```json
   {
     "method": "common.db.login",
     "params": ["demo_dr1", {"password": "<SECURE_PASSWORD>"}]
   }
   ```
2. **Response:**
   Returns `[user_id, session_token]`, e.g., `[14, "64_char_hex_session_token"]`.
3. **Authenticated Model Calls:**
   Pass the session token in the authorization parameter tuple `[user_id, session_token]`.

## Automated Validation Execution

Run the automated API test suites:
```powershell
# 1. Core JSON-RPC connectivity and session lifecycle
python scripts/test_jsonrpc.py

# 2. Comprehensive operational model CRUD & workflow RPCs
python scripts/test_operational_api.py

# 3. Native API contract validation (Appointments, Evaluations, Rx, Labs, Invoices)
python scripts/verify_native_api.py

# 4. Negative testing: Authentication failure with invalid password
python scripts/test_wrong_pwd.py
```

## Verification Checklist

| Test ID | Method / Model | Expected Result | Pass Criteria |
| :--- | :--- | :--- | :--- |
| **API-01** | `common.db.login` (Valid) | User ID + 64-char cryptographic token | HTTP 200, valid token string |
| **API-02** | `common.db.login` (Invalid) | Authentication rejected | Response `null` or 401 Unauthorized |
| **API-03** | `model.gnuhealth.patient.search_read` | List of patient records with PUIDs | Valid JSON array of patient dictionaries |
| **API-04** | `model.gnuhealth.appointment.search_read` | Appointments filtered by date/doctor | Valid appointment entities |
| **API-05** | `model.gnuhealth.patient.evaluation.read` | Clinical evaluation and vitals | Vitals dictionary (BP, HR, BMI) |
| **API-06** | `model.account.invoice.search_read` | Invoices with state and total | Valid invoice records |
| **API-07** | RBAC Boundary Check | Cashier blocked from clinical evaluations | Tryton `AccessError` / HTTP 403 |

## Safety Boundaries
- Never commit session tokens or API keys to the repository.
- Use test scripts that obtain credentials dynamically.
- Store output evidence in `reports/api_tests/`.
