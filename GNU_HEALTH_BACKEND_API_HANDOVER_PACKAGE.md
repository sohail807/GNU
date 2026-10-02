# GNU HEALTH HMIS — ALL-IN-ONE MASTER BACKEND & API HANDOVER PACKAGE
## Authoritative Architecture, Native JSON-RPC 2.0 API Specification, Data Models, RBAC Security Contract, Developer Guide & Certification Baseline

**Document Reference:** `GH-ALL-IN-ONE-MASTER-2026`  
**Release Date:** `2026-09-23`  
**System Target:** GNU Health HMIS 5.0.6 / Tryton Application Server 7.0.57  
**Host Infrastructure:** Google Cloud Platform (`34.7.237.8`) / Debian 12.15 Bookworm / PostgreSQL 15.19  
**Deployment Profile:** Specialist & Primary Care Outpatient Clinic (Doha, State of Qatar)  
**Standard Currency:** Qatari Riyal (`QAR`, `ر.ق`, ISO 4217: 634)  
**Backend Status:** **TECHNICALLY COMPLETE AND END-TO-END CERTIFIED FOR DEMO/UAT**  
**Frontend Handover Status:** **READY FOR CUSTOM FRONTEND INTEGRATION**

---

## TABLE OF CONTENTS
1. [Executive Management Summary](#1-executive-management-summary)
2. [Technology Stack & Infrastructure Topology](#2-technology-stack--infrastructure-topology)
3. [System Architecture & System of Record Boundaries](#3-system-architecture--system-of-record-boundaries)
4. [Native JSON-RPC 2.0 API Protocol & Authentication Lifecycle](#4-native-json-rpc-20-api-protocol--authentication-lifecycle)
5. [Complete API Operation Catalog (Domains A through T)](#5-complete-api-operation-catalog-domains-a-through-t)
6. [Data Model Reference (18 Core Business Entities)](#6-data-model-reference-18-core-business-entities)
7. [Clinical & Diagnostic Workflow State Machines](#7-clinical--diagnostic-workflow-state-machines)
8. [Billing, Cashier & General Ledger Accounting Contracts](#8-billing-cashier--general-ledger-accounting-contracts)
9. [Role-Based Access Control (RBAC) & Security Invariants](#9-role-based-access-control-rbac--security-invariants)
10. [Frontend Developer Implementation Guide & TypeScript Recipes](#10-frontend-developer-implementation-guide--typescript-recipes)
11. [Error Handling, Exception Schemas & UX Guidelines](#11-error-handling-exception-schemas--ux-guidelines)
12. [Testing, Relational Integrity & Browser E2E Certification Summary](#12-testing-relational-integrity--browser-e2e-certification-summary)
13. [Disaster Recovery & Backup Baseline](#13-disaster-recovery--backup-baseline)
14. [Actionable Frontend Integration Checklist (16 Categories)](#14-actionable-frontend-integration-checklist-16-categories)
15. [Documentation Consistency, Discrepancies & Production Gates](#15-documentation-consistency-discrepancies--production-gates)
16. [Final Backend Handover Statement & Evidence Index](#16-final-backend-handover-statement--evidence-index)

---

## 1. Executive Management Summary

### 1.1 Executive View (For Management & Project Directors)
The core backend for the outpatient clinic's Hospital Management Information System (HMIS) has been successfully built, deployed, configured, hardened, and technically verified on the Google Cloud Platform (`http://34.7.237.8/`). The system is powered by GNU Health HMIS 5.0 and the enterprise-grade Tryton application kernel, backed by a hardened PostgreSQL 15 relational database.

All ten operational departments required for ambulatory care—Patient Intake, Appointment Scheduling, Queue Check-In, Nursing Triage, Physician Consultations (SOAP), Electronic Prescriptions, Pathology Laboratory, Radiology Imaging, Health Services Billing, and Cashier Settlement—are 100% functional, interconnected, and operational.

The platform has achieved full technical certification across two rigorous evaluation layers:
1. **Automated Backend Certification:** 33 out of 33 transaction test cases passed (100% success rate) with **0 foreign key orphans** detected across 306 database tables.
2. **Genuine Visible Google Chrome Browser Certification:** 20 out of 20 operational stages were executed and visually verified in real visible Google Chrome desktop sessions on the live Tryton SAO interface, producing a balanced general ledger transaction (150.00 QAR debit = 150.00 QAR credit).

The system is officially **Technically Complete and End-to-End Certified for DEMO/UAT**. The backend engineering team is pleased to formally deliver this comprehensive, all-in-one technical specification to the Project Owner and Frontend Engineering Team to govern the upcoming custom frontend phase.

### 1.2 Technical Detail (For Engineers & System Architects)
GNU Health acts as the sole system of record, clinical state machine, and double-entry accounting engine. The upcoming frontend application will interface exclusively via authenticated native Tryton JSON-RPC 2.0 application interfaces (`http://34.7.237.8/gnuhealth/`). Direct database access, parallel shadow tables, and duplicated accounting logic are strictly prohibited.

---

## 2. Technology Stack & Infrastructure Topology

| Architectural Layer | Component | Version | Purpose | Source / Evidence |
| :--- | :--- | :--- | :--- | :--- |
| **Operating System** | Debian GNU/Linux | `12.15 Bookworm` | Server operating system | Live host `gnuhealth-srv` |
| **Kernel** | Linux Kernel | `6.1.0-53-cloud-amd64` | Linux operating system kernel | `uname -a` |
| **Hosting** | Google Cloud Platform | Compute Engine | Cloud infrastructure | Static IP `34.7.237.8` (Zone `europe-west4-a`) |
| **Reverse Proxy** | Nginx | `1.22.1-100` | TLS termination & request routing | `nginx -v` |
| **App Server** | Tryton Server (`trytond`) | `7.0.57` | Business logic & transaction kernel | Virtualenv python package |
| **HMIS Core** | GNU Health HMIS | `5.0.6` | Healthcare domain models & logic | Modular Tryton pool |
| **Runtime** | Python | `3.11.2` | Application execution runtime | `python3 --version` |
| **Database** | PostgreSQL RDBMS | `15.19-0+deb12u1` | Relational data persistence | `psql -V` |
| **Web Client** | Tryton SAO | `6.0 / 7.0 compatible` | Reference administrative web UI | Verified in browser tests |
| **Automation** | Selenium WebDriver | `4.49.0` | Visible browser test automation | `pip list` |
| **Browser** | Google Chrome | `153.0.8010.53` | Client desktop browser | Chrome system binary |
| **Driver** | ChromeDriver | `153.0.8010.52` | Browser automation driver | Local Selenium Manager |

---

## 3. System Architecture & System of Record Boundaries

```
                    +==================================+
                    |      Upcoming Custom Frontend    |
                    |   (Web / Mobile / React / Vue)   |
                    +==================================+
                                     |
                                     | HTTPS / JSON-RPC 2.0
                                     | (Header Token Authentication)
                                     v
+-----------------------------------------------------------------------------+
|                            REVERSE PROXY TIER                               |
|   Nginx 1.22.1 (Port 80 / 443)                                              |
|   - TLS 1.3 Termination & Security Headers                                  |
|   - Rate Limiting & Buffer Hardening                                        |
|   - Reverse proxy pass to 127.0.0.1:8000                                    |
+-----------------------------------------------------------------------------+
                                     |
                                     | Internal WSGI (127.0.0.1:8000)
                                     v
+-----------------------------------------------------------------------------+
|                         APPLICATION ENGINE TIER                             |
|   GNU Health HMIS 5.0.6 / Tryton 7.0.57 (Systemd: gnuhealth.service)        |
|   - Single System of Record                                                 |
|   - Medical Workflow State Machines & Drug Safety Engine                    |
|   - Role-Based Access Control (ir.model.access & ir.rule)                   |
|   - Native Double-Entry General Ledger & Invoicing Engine                   |
+-----------------------------------------------------------------------------+
                                     |
                                     | Loopback / Non-Superuser (127.0.0.1:5432)
                                     v
+-----------------------------------------------------------------------------+
|                          PERSISTENT STORAGE TIER                            |
|   PostgreSQL 15.19 RDBMS                                                    |
|   - Database: gnuhealth (306 Public Schema Tables)                          |
|   - Relational Constraints: Strict Foreign Keys, CHECK constraints          |
|   - File Attachment Storage: /var/lib/gnuhealth/attachments                 |
+-----------------------------------------------------------------------------+
```

### The System of Record Invariants (Non-Negotiable)
1. **NO Direct PostgreSQL Connections:** The frontend must never connect directly to PostgreSQL on port 5432.
2. **NO Direct Database Writes:** Raw SQL `INSERT`, `UPDATE`, or `DELETE` statements are prohibited.
3. **NO Shadow Tables:** The frontend must not maintain parallel database tables for patient, clinical, or financial records.
4. **NO Duplicate Accounting Logic:** General ledger debits, credits, and tax amounts must never be calculated in frontend code.
5. **NO Parallel RBAC Engine:** The frontend must not implement its own user security store; Tryton enforces permissions on every RPC call.
6. **NO Workflow Bypass:** Frontend applications must follow the sequential state transitions enforced by Tryton models.
7. **GNU Health Is Authoritative:** When a discrepancy arises between client UI state and server response, the server state wins.

---

## 4. Native JSON-RPC 2.0 API Protocol & Authentication Lifecycle

### 4.1 Protocol Specifications
- **Transport:** HTTP/1.1 or HTTP/2 over TLS (HTTPS).
- **Format:** JSON-RPC 2.0.
- **Base Endpoint:** `http://34.7.237.8/gnuhealth/` (Production: `https://<clinic-domain>/gnuhealth/`).
- **Required Request Headers:**
  ```http
  Content-Type: application/json
  Accept: application/json
  Authorization: Session <base64_encoded_token>
  ```

### 4.2 Authentication Handshake (`common.db.login`)
Authentication executes against the native Tryton database service:
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
**Response Schema:**
```json
{
  "id": 1,
  "result": [12, "abc123sessiontoken456xyz"],
  "error": null
}
```
- `result[0]` = Integer User ID (e.g. `12`).
- `result[1]` = Cryptographic Session Token string.

### 4.3 Constructing the Authorization Header
Combine the User ID and Session Token separated by a colon, and Base64-encode the string:
```
Raw String:    "12:abc123sessiontoken456xyz"
Base64 String: "MTI6YWJjMTIzc2Vzc2lvbnRva2VuNDU2eHl6"
HTTP Header:   Authorization: Session MTI6YWJjMTIzc2Vzc2lvbnRva2VuNDU2eHl6
```

### 4.4 Session Expiry & Logout
- **Inactivity Timeout:** Managed natively by Tryton server settings.
- **Session Expiration:** When an expired token is submitted, Tryton returns HTTP `401 Unauthorized` or an `AccessError`. The frontend must prompt for re-login.
- **Logout Action:** Calling `common.db.logout` invalidates the server-side session token.

---

## 5. Complete API Operation Catalog (Domains A through T)

### Domain A: Authentication & Session
- `common.db.login([username, password])` -> `[user_id, session_token]`
- `common.db.logout()` -> `true`

### Domain B: Users & Context
- `model.res.user.read([[user_id], ["name", "login", "groups"]], context)` -> User profile and groups.

### Domain C: Patient Demographics & Intake
- **Create Party:**
  ```json
  {
    "method": "model.party.party.create",
    "params": [
      [{
        "name": "Fatima Al-Kuwari",
        "is_person": true,
        "is_patient": true,
        "gender": "f",
        "dob": "1994-08-12",
        "fed_country": 178,
        "ref": "29463401234"
      }],
      {"company": 1}
    ]
  }
  ```
- **Create Patient File:**
  ```json
  {
    "method": "model.gnuhealth.patient.create",
    "params": [
      [{"party": 215, "blood_type": "O", "rh": "+"}],
      {"company": 1}
    ]
  }
  ```
  *Result: Returns patient ID; auto-generates permanent PUID.*

### Domain D: Appointment Scheduling
- **Create Appointment:** `model.gnuhealth.appointment.create([[{patient, healthprof, specialty, appointment_date}], context])`
- **Search Appointments:** `model.gnuhealth.appointment.search_read([[["appointment_date", ">=", "2026-09-23 00:00:00"]], 0, 50, ...])`

### Domain E: Patient Check-In
- **Check-In Action:** `model.gnuhealth.appointment.write([[appointment_id], {"state": "checked_in"}], context)`

### Domain F: Nursing Triage & Vitals
- **Create Evaluation:**
  ```json
  {
    "method": "model.gnuhealth.patient.evaluation.create",
    "params": [
      [{
        "patient": 65,
        "healthprof": 1,
        "systolic": 120,
        "diastolic": 80,
        "bpm": 76,
        "temperature": 37.0,
        "respiratory_rate": 16,
        "osat": 98,
        "weight": 75.0,
        "height": 175.0,
        "evaluation_type": "outpatient"
      }],
      {"company": 1}
    ]
  }
  ```

### Domain G: Clinical Consultation & SOAP Documentation
- **Update SOAP & Diagnosis:**
  ```json
  {
    "method": "model.gnuhealth.patient.evaluation.write",
    "params": [
      [15],
      {
        "chief_complaint": "Mild fever and headache",
        "present_illness": "Patient reports mild fever for two days.",
        "evaluation_summary": "Temperature 37.0 C, vitals stable.",
        "info_diagnosis": "Viral upper respiratory infection.",
        "directions": "Hydration, rest, symptomatic therapy.",
        "diagnosis": 8
      },
      {"company": 1}
    ]
  }
  ```
- **Sign Evaluation Action:** `model.gnuhealth.patient.evaluation.end_evaluation([[15]], context)`  
  *Result: Transitions state to `signed`; record permanently locks against edits.*

### Domain H: Medical Coding (ICD-10)
- `model.gnuhealth.pathology.search_read([[["code", "ilike", "J06%"]], 0, 20, null, ["id", "code", "name"]], context)`

### Domain I: Electronic Prescribing
- **Create Prescription Order & Lines:**
  ```json
  {
    "method": "model.gnuhealth.prescription.order.create",
    "params": [
      [{
        "patient": 65,
        "healthprof": 1,
        "prescription_warning_ack": true,
        "lines": [
          ["create", [{
            "medicament": 1,
            "dose": 500,
            "dose_unit": 1,
            "form": 1,
            "route": 1,
            "qty": 15,
            "frequency": 3,
            "duration": 5,
            "duration_period": "days"
          }]]
        ]
      }],
      {"company": 1}
    ]
  }
  ```
- **Validate Prescription:** `model.gnuhealth.prescription.order.create_prescription([[rx_id]], context)` -> State `done`.

### Domain J: Diagnostic Laboratory
- **Create Test:** `model.gnuhealth.lab.create([[{patient, requestor, test: cbc_id}], context])`
- **Load Criteria:** `model.gnuhealth.lab.complete_criteareas([[lab_id]], context)` -> Loads 20 CBC analytes.
- **Save Result:** `model.gnuhealth.lab.test.critearea.write([[analyte_id], {"result": "14.1"}], context)`
- **Sign-off Document:** `model.gnuhealth.lab.generate_document([[lab_id]], context)` -> State `done`.

### Domain K: Medical Imaging (Radiology)
- **Create Request:** `model.gnuhealth.imaging.test.request.create([[{patient, doctor, requested_test, comment}], context])`
- **Execute Request:** `model.gnuhealth.imaging.test.request.requested([[rad_id]], context)`
- **Generate Results:** `model.gnuhealth.imaging.test.request.generate_results([[rad_id]], context)` -> State `done`.

### Domain L: Health Services
- `model.gnuhealth.health_service.create([[{patient, desc: "Outpatient Visit"}], context])`

### Domain M & N: Customer Invoicing
- **Create Invoice:**
  ```json
  {
    "method": "model.account.invoice.create",
    "params": [
      [{
        "party": 215,
        "type": "out",
        "currency": 1,
        "lines": [
          ["create", [{
            "product": 1,
            "quantity": 1,
            "unit_price": 150.00
          }]]
        ]
      }],
      {"company": 1}
    ]
  }
  ```
- **Post Invoice:** `model.account.invoice.post([[invoice_id]], context)`  
  *Result: Generates Move #47 on Revenue journal; locks invoice lines permanently.*

### Domain O: Cashier Payments
- **Execute Cash Settlement Wizard:**
  ```json
  {
    "method": "wizard.account.invoice.pay.execute",
    "params": [
      {"invoice": 14, "payment_method": 1},
      {"company": 1}
    ]
  }
  ```
  *Result: Generates Move #48 on Cash journal; reconciles invoice to `Paid`.*

### Domain P & Q: Accounting & Reconciliation
- `model.account.move.search_read([[["origin", "=", "account.invoice,14"]]], context)`
- `model.account.move.line.reconcile([ar_debit_id, ar_credit_id], context)`

### Domain R: Patient Related Records
- Native Tryton `relate` queries linking patient file to appointments, evaluations, prescriptions, labs, and invoices.

### Domain S & T: Reporting & Administration
- Tryton standard reporting engines and administrative models (`res.user`, `res.group`).

---

## 6. Data Model Reference (18 Core Business Entities)

### 1. `party.party` (Person Identity)
- Fields: `name` (Char), `is_person` (Bool), `is_patient` (Bool), `gender` ('m'/'f'), `dob` (Date), `fed_country` (Many2One), `ref` (Unique QID).
- Relates: 1:1 with `gnuhealth.patient`, 1:N with `party.address`.

### 2. `gnuhealth.patient` (Medical Record)
- Fields: `party` (Many2One, Unique), `puid` (Char, Unique, Read-Only), `blood_type`, `rh`, `general_info`.

### 3. `gnuhealth.appointment` (Scheduling)
- Fields: `patient` (Many2One), `healthprof` (Many2One), `specialty` (Many2One), `appointment_date` (DateTime), `state` (`free`, `confirmed`, `checked_in`, `done`).

### 4. `gnuhealth.patient.evaluation` (Triage & SOAP)
- Fields: `patient`, `healthprof`, `appointment`, `chief_complaint`, `present_illness`, `evaluation_summary`, `info_diagnosis`, `directions`, `diagnosis` (ICD-10), vitals (`systolic`, `diastolic`, `bpm`, `temperature`, `respiratory_rate`, `osat`, `weight`, `height`), `state` (`draft`, `in_progress`, `signed`).

### 5. `gnuhealth.pathology` (ICD-10 Catalog)
- Fields: `code` (Unique), `name`, `category`. (Contains 14,416 standard ICD-10 records).

### 6. `gnuhealth.prescription.order` (e-Prescription Header)
- Fields: `name` (RX sequence), `patient`, `healthprof`, `prescription_date`, `prescription_warning_ack` (Bool), `state` (`draft`, `done`).

### 7. `gnuhealth.prescription.line` (Medication Line)
- Fields: `order`, `medicament`, `dose`, `dose_unit`, `form`, `route`, `qty`, `frequency`, `duration`, `duration_period`.

### 8. `gnuhealth.lab` (Diagnostic Pathology Requisition)
- Fields: `name` (TEST sequence), `patient`, `requestor`, `test` (test type), `state` (`draft`, `tested`, `done`).

### 9. `gnuhealth.lab.test.critearea` (Laboratory Analyte)
- Fields: `gnuhealth_lab_id`, `name`, `result`, `lower_limit`, `upper_limit`, `units`.

### 10. `gnuhealth.imaging.test.request` (Radiology Order)
- Fields: `order_code` (RAD sequence), `patient`, `doctor`, `requested_test`, `state` (`draft`, `requested`, `done`).

### 11. `gnuhealth.imaging.test.result` (Radiologist Report)
- Fields: `request`, `comment` (narrative impression), `date`.

### 12. `gnuhealth.health_service` (Billable Service Bundle)
- Fields: `patient`, `desc`, `service_date`, `lines`.

### 13. `account.invoice` (Customer Invoice)
- Fields: `number` (INV sequence), `party`, `type` (`out`), `currency` (QAR), `total_amount`, `state` (`draft`, `validated`, `posted`, `paid`).

### 14. `account.invoice.line` (Invoice Line Item)
- Fields: `invoice`, `product`, `account` (4000), `quantity`, `unit_price`.

### 15. `account.move` (General Ledger Journal Entry)
- Fields: `number`, `journal` (Revenue/Cash), `date`, `origin`, `state` (`draft`, `posted`). Invariant: Debits == Credits.

### 16. `account.move.line` (Debit / Credit Line)
- Fields: `move`, `account` (1000/1200/4000), `debit`, `credit`, `party`, `reconciliation`.

### 17. `account.move.reconciliation` (AR Reconciliation)
- Fields: `name`, `lines`. Links invoice AR debit with payment AR credit.

### 18. `res.user` / `res.group` (Security & Roles)
- Fields: `login`, `password_hash`, `groups`.

---

## 7. Clinical & Diagnostic Workflow State Machines

```
[ FRONT DESK ]              [ NURSING ]                 [ PHYSICIAN ]
1. Registration             3. Triage                   4. Consultation
   party.party                 eval.create (Vitals)        eval.write (SOAP)
   gnuhealth.patient                |                           |
        |                           v                           v
        v                   eval.write (Triage)         eval.end_evaluation (signed)
2. Appointment                                                  |
   appt.create (confirmed)                                      v
        |                                               5. Prescription
        v                                                  presc.create_prescription (done)
   appt.write (checked_in)                                      |
        |                                                       v
        +-----------------------------------------------> 6. Diagnostics (Lab / Radiology)
                                                                |
                                                                v
                                                        [ CASHIER / BILLING ]
                                                        7. Invoicing (invoice.post)
                                                                |
                                                                v
                                                        8. Payment (pay_wizard -> Paid)
```

---

## 8. Billing, Cashier & General Ledger Accounting Contracts

```
1. Customer Invoice Posting (Move #47 - Revenue Journal):
   DEBIT:  Account 1200 - Accounts Receivable (Party: Patient)   150.00 QAR
   CREDIT: Account 4000 - Medical Services Revenue               150.00 QAR
   Balance: 150.00 QAR == 150.00 QAR (Balanced)

2. Cashier Payment Settlement (Move #48 - Cash Journal):
   DEBIT:  Account 1000 - Petty Cash / Main Till                 150.00 QAR
   CREDIT: Account 1200 - Accounts Receivable (Party: Patient)   150.00 QAR
   Balance: 150.00 QAR == 150.00 QAR (Balanced)

3. Reconciliation:
   Line 47.AR matched with Line 48.AR -> Reconciled.
   Net Patient Receivable Balance = 0.00 QAR (Paid in Full).
```

---

## 9. Role-Based Access Control (RBAC) & Security Invariants

### 9.1 Role Matrix across 7 Operational Roles

| Role Name | Demo Login | Allowed Modules | Restricted Modules | Observed UI Denial Result |
| :--- | :--- | :--- | :--- | :--- |
| **Front Desk** | `demo_frontdesk1` | Registration, Appointments, Check-in | Prescriptions, Clinical Evaluations, GL | Search returns `[]`; access denied |
| **Nurse** | `demo_nurse1` | Outpatient Triage, Anthropometric Vitals | Financial Invoicing, Prescriptions, GL | Search returns `[]`; access denied |
| **Physician** | `demo_dr1` | SOAP Consultations, ICD-10, Prescriptions | General Ledger Move Administration | Search returns `[]`; access denied |
| **Laboratory** | `demo_lab1` | Pathology Requisitions, Analyte Results | Billing, Prescriptions, Evaluations | Restricted to diagnostic lab domain |
| **Radiology** | `demo_rad1` | Imaging Requests, Radiologist Reports | Financial Ledger, Pharmacy Dispensing | Restricted to diagnostic imaging |
| **Cashier** | `demo_cashier1` | Invoices, Posting, Cash Payment Wizard | Clinical Evaluations, Prescriptions | Search returns `[]`; access denied |
| **Administrator**| `demo_admin1` | User Management, System Configuration | Operational separation enforced | Segregated from clinical roles |

### 9.2 The 17 Mandatory Frontend Security Invariants
1. Never connect directly to PostgreSQL.
2. Never store database passwords in frontend code.
3. Never embed administrative service accounts.
4. Never bypass Tryton authentication.
5. Never bypass native Tryton RBAC.
6. Never duplicate accounting calculations in JavaScript.
7. Never duplicate clinical decision support logic.
8. Never assume cosmetic UI hiding equals security.
9. Always handle backend `AccessError` exceptions.
10. Always handle HTTP 401 session expiration.
11. Do not trust client-side validation alone.
12. The backend remains authoritative.
13. Enforce HTTPS / TLS 1.3 in production.
14. Never expose private keys or secrets in client bundles.
15. Store session tokens securely in reactive memory.
16. Never cache plaintext passwords in localStorage.
17. Never create shadow patient or accounting tables.

---

## 10. Frontend Developer Implementation Guide & TypeScript Recipes

### Recipe 1: Authenticating & Obtaining a Session Token
```typescript
async function login(username: string, password: string): Promise<{ userId: number; sessionToken: string }> {
  const response = await fetch("http://34.7.237.8/gnuhealth/", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      id: Date.now(),
      method: "common.db.login",
      params: [username, password]
    })
  });
  const data = await response.json();
  if (!data.result) throw new Error("Invalid username or password.");
  const [userId, sessionToken] = data.result;
  return { userId, sessionToken };
}
```

### Recipe 2: Constructing Authorization Header
```typescript
function getAuthHeader(userId: number, token: string): string {
  return `Session ${btoa(`${userId}:${token}`)}`;
}
```

### Recipe 3: Universal RPC Client
```typescript
async function callRpc<T = any>(method: string, params: any[], authHeader?: string): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "Accept": "application/json"
  };
  if (authHeader) headers["Authorization"] = authHeader;

  const res = await fetch("http://34.7.237.8/gnuhealth/", {
    method: "POST",
    headers,
    body: JSON.stringify({ id: Date.now(), method, params })
  });

  if (res.status === 401) throw new Error("SESSION_EXPIRED");
  const data = await res.json();
  if (data.error) {
    const [errClass, errMsg] = data.error;
    throw new Error(`[${errClass}] ${errMsg}`);
  }
  return data.result;
}
```

### Recipe 4: Patient Registration
```typescript
async function registerPatient(name: string, gender: "m"|"f", dob: string, qid: string, authHeader: string) {
  const ctx = { company: 1 };
  const [partyId] = await callRpc<number[]>(
    "model.party.party.create",
    [[{ name, is_person: true, is_patient: true, gender, dob, fed_country: 178, ref: qid }], ctx],
    authHeader
  );
  const [patientId] = await callRpc<number[]>(
    "model.gnuhealth.patient.create",
    [[{ party: partyId }], ctx],
    authHeader
  );
  return { patientId, partyId };
}
```

### Recipe 5: Signing Clinical Consultation
```typescript
async function signEvaluation(evaluationId: number, authHeader: string) {
  return await callRpc(
    "model.gnuhealth.patient.evaluation.end_evaluation",
    [[evaluationId], { company: 1 }],
    authHeader
  );
}
```

### Recipe 6: Settle Bill via Cash Wizard
```typescript
async function payInvoiceCash(invoiceId: number, authHeader: string) {
  const ctx = { company: 1 };
  await callRpc("model.account.invoice.post", [[invoiceId], ctx], authHeader);
  await callRpc("wizard.account.invoice.pay.execute", [{ invoice: invoiceId, payment_method: 1 }, ctx], authHeader);
  return { status: "PAID" };
}
```

---

## 11. Error Handling, Exception Schemas & UX Guidelines

| Exception Class | Server Condition | Frontend UX Handling | Recommended User Alert Message |
| :--- | :--- | :--- | :--- |
| `AccessError` | User role lacks permission | Display warning alert | *"Access Restricted: Your departmental role does not permit access to this module."* |
| `AccessError` (Locked) | Modifying signed evaluation or posted invoice | Lock form controls | *"Record Finalized: This record has been signed/posted and cannot be modified."* |
| `UserError` | Missing mandatory field or invalid state | Highlight input | Shows specific Tryton validation rule (e.g. missing attending doctor). |
| `SelectionValidationError` | Invalid state machine string | Fix dropdown value | *"Invalid status submitted."* |
| `SQLConstraintError` | Duplicate Qatar QID entered | Highlight QID field | *"A patient with this Civil ID already exists in the system."* |
| `SESSION_EXPIRED` | Inactivity token expiration | Prompt login modal | *"Your session has timed out. Please enter your password to continue."* |

---

## 12. Testing, Relational Integrity & Browser E2E Certification Summary

### 12.1 Automated Backend Technical Tests (`reports/e2e_test_results.json`)
- **Success Rate:** 33 / 33 passed (100%).
- **Database Relational Integrity:** 306 tables evaluated; **0 orphaned foreign key rows** (`reports/e2e_database_integrity.json`).
- **Defensive Negative Tests:** 14 / 14 exception tests passed (`reports/e2e_negative_tests.json`).
- **Performance Baseline:** Patient search: 3.67 ms, read: 7.00 ms, appointment search: 1.12 ms, evaluation retrieval: 2.20 ms, invoice search: 1.42 ms, accounting retrieval: 5.09 ms.

### 12.2 Visible Google Chrome Browser E2E Certification (`reports/LIVE_BROWSER_E2E_CERTIFICATION.md`)
- **Status:** PASS (20 out of 20 required stages executed on live Chrome desktop browser).
- **Evidence Payload:** 21 screenshots (1.17 MB total) in `reports/live_browser_test/`.
- **Live Transaction Identifiers:**
  - Patient: `LIVE E2E TEST PATIENT` (PUID: `KQI816APL`)
  - Appointment: `gnuhealth.appointment,18` (Checked-in)
  - Evaluation: `gnuhealth.patient.evaluation,15` (Vitals: BP 120/80, Signed)
  - Prescription: `RX014` (Amoxicillin 500mg, Validated)
  - Laboratory: `TEST037` (CBC, 20 analytes, HGB 14.1 g/dL, Done)
  - Radiology: `RAD-00012` (Chest X-Ray, Done)
  - Customer Invoice: `INV-2026/00014` (150.00 QAR, Paid)
  - Accounting Moves: Move #47 (Revenue) & Move #48 (Cash), balanced at 150.00 QAR.

### 12.3 Complete 20-Screenshot Inventory Table

| # | Filename | Size (Bytes) | Visual Content & Verified State |
| :---: | :--- | :---: | :--- |
| **REC** | `recovery_01_login_page.png` | `21,431` | Mandatory Section 4 recovery screenshot showing SAO login dialog |
| **01** | `01_login.png` | `16,134` | Live GNU Health SAO authentication modal |
| **02** | `02_dashboard.png` | `15,777` | Front Desk authenticated session dashboard |
| **03** | `03_patient_registration.png` | `64,031` | Party creation modal with Gender: Male, DoB: 01/01/1990 |
| **04** | `04_patient_saved.png` | `50,385` | Saved patient record displaying generated PUID `KQI816APL` |
| **05** | `05_appointment.png` | `70,410` | Appointment scheduled with `Dr. DEMO Physician 01` |
| **06** | `06_checkin.png` | `42,451` | Appointment state updated to `Checked-in` |
| **07** | `07_triage.png` | `71,527` | Nursing triage evaluation with recorded vital signs (BP 120/80) |
| **08** | `08_consultation.png` | `74,570` | Physician consultation signed with SOAP notes and ICD-10 `J06.9` |
| **09** | `09_prescription.png` | `60,473` | Validated e-Prescription `RX014` for Amoxicillin 500mg |
| **10** | `10_lab_order.png` | `66,942` | Laboratory CBC request with 20 analyte criteria loaded |
| **11** | `11_lab_result.png` | `66,778` | Validated lab test result (`TEST037`) with HGB 14.1 g/dL |
| **12** | `12_radiology.png` | `54,251` | Chest X-Ray imaging request (`RAD-00012`) with report in `Done` state |
| **13** | `13_invoice.png` | `64,319` | Customer invoice `INV-2026/00014` posted for 150.00 QAR |
| **14** | `14_payment.png` | `61,770` | Native Cash payment completed; invoice transitioned to `Paid` |
| **15** | `15_accounting_move.png` | `58,611` | General ledger account moves showing balanced debit/credit (150.00 QAR) |
| **16** | `16_patient_related_records.png` | `125,763` | Native `Relate` dropdown showing complete interconnected patient chain |
| **17** | `17_frontdesk_negative.png` | `23,902` | Negative RBAC test: Front Desk denied access to Prescriptions |
| **18** | `18_cashier_negative.png` | `21,154` | Negative RBAC test: Cashier denied access to Clinical Evaluations |
| **19** | `19_physician_negative.png` | `22,161` | Negative RBAC test: Physician denied access to Account Moves admin |
| **20** | `20_final_transaction.png` | `125,763` | Full consolidated patient transaction view in visible Google Chrome |

---

## 13. Disaster Recovery & Backup Baseline

- **Automated Backup:** Daily script creating encrypted PostgreSQL dumps and attachment archives (`/var/backups/gnuhealth/`).
- **Tested Dump:** `gnuhealth_db_e2e_post_20260922_184552.dump` (7.65 MB, SHA256: `e1ef0af3...`).
- **Disaster Recovery Drill:** Restored into sandbox `gnuhealth_isolated_e2e_restore` in **10 seconds** with 100% data fidelity (306 tables, 14,416 ICD-10 codes, 11,400.00 QAR balanced ledger). Verified in `reports/e2e_backup_restore.json`.

---

## 14. Actionable Frontend Integration Checklist (16 Categories)

*(All items remain unchecked `[ ]` representing the work awaiting execution by the frontend team)*

- [ ] **Architecture:** Centralized JSON-RPC client configured; zero database libraries in frontend code.
- [ ] **Authentication:** Login form calling `common.db.login`; session token stored in memory; logout configured.
- [ ] **Demographics:** Patient search via `search_read`; two-step registration (`party.party` + `gnuhealth.patient`).
- [ ] **Appointments:** Calendar slots view; booking form; check-in button transitioning state to `checked_in`.
- [ ] **Triage:** Vital signs intake form (BP, HR, Temp, RR, SpO2, Weight, Height); instant client-side BMI.
- [ ] **Consultations:** Clinician SOAP documentation; searchable ICD-10 dropdown; sign-off locking via `end_evaluation`.
- [ ] **Prescriptions:** Formularies search; dosage, route, frequency fields; safety acknowledgement; validation.
- [ ] **Laboratory:** Pathology requisitions; analyte criteria expansion via `complete_criteareas`; numerical results.
- [ ] **Radiology:** Imaging request form; study selection (Chest X-Ray); narrative radiologist reporting.
- [ ] **Billing:** Health service bundle display; tariff line item rendering (QAR).
- [ ] **Invoicing:** Customer invoice creation; fiscal posting action (`post`); immutability locking.
- [ ] **Cashier:** Cash settlement wizard; payment method selection; invoice status updated to `Paid`.
- [ ] **Accounting:** Read-only General Ledger move viewer displaying balanced Debits and Credits.
- [ ] **RBAC:** Cosmetic UI hiding based on logged-in user role groups.
- [ ] **Errors:** Global error interceptor mapping `AccessError`, `UserError`, and `SQLConstraintError` to UX alerts.
- [ ] **Security:** HTTPS enforcement; zero hardcoded secrets; zero credentials in git.

---

## 15. Documentation Consistency, Discrepancies & Production Gates

### 15.1 Resolved Discrepancies
- **Browser Automation Engine:** Legacy notes suggested Playwright; actual live testing established local Selenium WebDriver `4.49.0` with ChromeDriver `153.0.8010.52` controlling desktop Chrome `153.0.8010.53`, bypassing cloud 404 driver download issues.
- **Evaluation Action:** Verified that evaluation sign-off is `end_evaluation` (not generic `done`).
- **Laboratory Expansion:** Verified that criteria generation executes via `complete_criteareas`.

### 15.2 Mandatory Production Go-Live Gates
1. **Clinic Commercial Registration:** Ingest official Qatar MoPH commercial registration data.
2. **Staff Credential Ingestion:** Onboard real practitioners with verified medical licenses.
3. **Commercial Tariff Approval:** Replace 150.00 QAR test fee with approved commercial fee schedule.
4. **Domain & TLS Deployment:** Map clinic FQDN to `34.7.237.8` and issue CA-signed TLS 1.3 certificate.
5. **Off-Site Automated DR Sync:** Configure scheduled sync of daily backups to secondary GCP Cloud Storage bucket.

---

## 16. Final Backend Handover Statement & Evidence Index

### Final Statement
The GNU Health HMIS backend is **technically complete, fully operational, and end-to-end certified for DEMO/UAT**. All operational models, security roles, clinical workflows, and accounting ledgers have been verified against the live environment. The backend engineering team formally hands over the platform and integration specifications to the frontend development team.

### Authoritative Document Index
- Executive Report: `01_GNU_HEALTH_BACKEND_EXECUTIVE_HANDOVER.md`
- API Specification: `02_GNU_HEALTH_API_INTEGRATION_SPECIFICATION.md`
- Data Model Reference: `03_GNU_HEALTH_DATA_MODEL_AND_WORKFLOW_REFERENCE.md`
- RBAC Security Contract: `04_GNU_HEALTH_RBAC_AND_SECURITY_CONTRACT.md`
- Frontend Developer Guide: `05_GNU_HEALTH_FRONTEND_INTEGRATION_GUIDE.md`
- Test Summary: `06_GNU_HEALTH_BACKEND_TEST_AND_CERTIFICATION_SUMMARY.md`
- Frontend Checklist: `07_GNU_HEALTH_FRONTEND_HANDOVER_CHECKLIST.md`
- Documentation Index: `08_GNU_HEALTH_BACKEND_API_HANDOVER_INDEX.md`
- QA Audit Report: `API_DOCUMENTATION_QA_REPORT.md`
- Live Browser Certification: `reports/LIVE_BROWSER_E2E_CERTIFICATION.md`
