# GNU Health HMIS — Master Backend & API Handover Package
## Complete System Specification, API Architecture & Frontend Integration Blueprint

**Document Reference:** `GH-MASTER-HANDOVER-2026`  
**Date of Release:** `2026-09-23`  
**System Target:** GNU Health HMIS 5.0.6 / Tryton Application Server 7.0.57  
**Host Environment:** Google Cloud Platform (`34.7.237.8`) / Debian 12.15 / PostgreSQL 15.19  
**Deployment Profile:** Specialist & Primary Care Outpatient Clinic (Doha, State of Qatar)  
**Currency Standard:** Qatari Riyal (`QAR`, `ر.ق`, ISO 4217: 634)  
**Backend Status:** **Technically Complete and End-to-End Certified for DEMO/UAT**  
**Frontend Handover Status:** **READY FOR CUSTOM FRONTEND INTEGRATION**

---

## 1. Document Control

| Metadata Field | Value / Description |
| :--- | :--- |
| **Document Title** | Master Backend & API Handover Package for Frontend Integration |
| **Document ID** | `GH-MASTER-HANDOVER-2026` |
| **Version** | `1.0.0 (Final Release)` |
| **Author** | Backend & Integration Engineering Lead |
| **Reviewed By** | Quality Assurance Lead & Systems Architect |
| **Approved By** | Project Manager & Product Owner |
| **Target Audience** | Executive Leadership, Project Managers, Frontend Software Engineers, QA Leads |
| **Security Classification**| Confidential / Internal Clinic Project Deliverable |

---

## 2. Executive Summary

### Executive View (For Management)
The core backend for the outpatient clinic's Hospital Management Information System (HMIS) has been successfully built, deployed, configured, hardened, and technically verified on the cloud infrastructure. The backend is powered by GNU Health HMIS 5.0 and the Tryton enterprise application framework, backed by PostgreSQL.

All ten core clinical and financial workflows—from initial patient registration and appointment check-in, through nursing triage, doctor consultations, electronic prescriptions, laboratory analysis, radiology imaging, patient invoicing, and cashier settlement—are fully implemented and interconnected.

The backend has passed exhaustive automated technical certification (33/33 tests passing with 0 database orphans) and genuine visible Google Chrome browser certification (20/20 stages visually verified). The system is **Technically Complete and End-to-End Certified for DEMO/UAT**. The project is now ready to transition into the **Frontend Development Phase**.

### Technical Detail (For Engineers)
GNU Health acts as the sole system of record, clinical state machine, and double-entry accounting engine. The upcoming frontend application will interface exclusively via authenticated native Tryton JSON-RPC 2.0 application interfaces (`http://34.7.237.8/gnuhealth/`). Direct database access, parallel shadow tables, and duplicated accounting logic are strictly prohibited.

---

## 3. Scope of the Handover

### In Scope for this Handover
- Formal delivery of the operational cloud backend (`34.7.237.8`).
- Authoritative API integration contract and JSON-RPC 2.0 communication specifications.
- Comprehensive data model documentation for all 18 core business entities.
- Role-based access control (RBAC) security matrix and boundary verification across 7 roles.
- Synthesis of testing evidence (33 automated backend tests, 20 browser E2E screenshots, 0 database orphans, 10s disaster recovery drill).
- Uncompleted actionable checklist for the upcoming frontend development phase.

### Out of Scope for this Handover (Belongs to Upcoming Frontend Phase)
- Custom frontend user interface design, styling, and branding.
- Web, mobile, or kiosk frontend client applications.
- Client-side navigation, form rendering UX, and state management.
- Production commercial registration, live staff onboarding, and off-site cloud storage replication (defined as pre-go-live gates).

---

## 4. Backend Completion Status

| Operational Domain | Built Capabilities | Technical Status | Certification Level |
| :--- | :--- | :---: | :---: |
| **Infrastructure & OS** | Debian 12 Bookworm, Nginx reverse proxy, PostgreSQL 15.19, Systemd sandbox | **OPERATIONAL** | Verified on live GCP host |
| **Master Data** | Qatar clinic institution, FY2026, 3 GL accounts, 2 journals, 14,416 ICD-10 codes | **OPERATIONAL** | Level 1 & Level 3 Verified |
| **Patient Demographics** | Person records, unique QID index, auto-generated permanent PUID | **OPERATIONAL** | Level 1 & Level 3 Verified |
| **Appointments & Queue** | Outpatient scheduling, doctor allocation, queue check-in state machine | **OPERATIONAL** | Level 1 & Level 3 Verified |
| **Nursing Triage** | Outpatient evaluation creation, anthropometric vital signs (BP, HR, Temp, SpO2) | **OPERATIONAL** | Level 1 & Level 3 Verified |
| **Physician Consultation** | SOAP clinical notes, ICD-10 diagnostic coding, digital sign-off locking | **OPERATIONAL** | Level 1 & Level 3 Verified |
| **Electronic Prescribing** | Medicament formulation, dosage, route, frequency, duration, safety validation | **OPERATIONAL** | Level 1 & Level 3 Verified |
| **Diagnostic Laboratory** | Pathology requisitions, 20 CBC analyte criteria loading, numerical results | **OPERATIONAL** | Level 1 & Level 3 Verified |
| **Medical Imaging** | Radiology requests, study selection (Chest X-Ray), radiologist reporting | **OPERATIONAL** | Level 1 & Level 3 Verified |
| **Health Services** | Service bundling, automatic compilation of billable encounter items | **OPERATIONAL** | Level 1 & Level 3 Verified |
| **Invoicing & Billing** | Customer invoice generation, tariff pricing (150.00 QAR), fiscal posting | **OPERATIONAL** | Level 1 & Level 3 Verified |
| **Cash Settlement** | Native cashier payment wizard (`Cash Payment (QAR)`), invoice reconciliation | **OPERATIONAL** | Level 1 & Level 3 Verified |
| **General Ledger** | Balanced double-entry moves (Move 47 & 48, 150.00 QAR debit = credit) | **OPERATIONAL** | Level 1 & Level 3 Verified |

---

## 5. System Architecture

### Multi-Tier Architecture Diagram
```
                    +==================================+
                    |      Upcoming Custom Frontend    |
                    |   (Web / Mobile / React / Vue)   |
                    +==================================+
                                     |
                                     | HTTPS / JSON-RPC 2.0
                                     | (Session Header Authentication)
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

---

## 6. Technology Stack

| Layer | Component | Version | Purpose | Source / Evidence |
| :--- | :--- | :--- | :--- | :--- |
| **OS** | Debian GNU/Linux | `12.15 Bookworm` | Server operating system | Live host `gnuhealth-srv` |
| **Kernel** | Linux Kernel | `6.1.0-53-cloud-amd64` | Linux operating system kernel | `uname -a` |
| **Hosting** | Google Cloud Platform | Compute Engine | Cloud infrastructure | Static IP `34.7.237.8` |
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

## 7. System of Record and Architectural Boundaries

### The System of Record Principle
GNU Health HMIS is the **sole authoritative system of record** for all medical, diagnostic, and financial data. The upcoming frontend application is strictly an untrusted client that presents data and transmits user intentions.

### Non-Negotiable Architectural Invariants:
1. **NO Direct Database Access:** The frontend must never connect directly to PostgreSQL on port 5432.
2. **NO Direct Database Writes:** Raw SQL `INSERT`, `UPDATE`, or `DELETE` statements are prohibited.
3. **NO Shadow Tables:** The frontend must not maintain parallel database tables for patient, clinical, or financial records.
4. **NO Duplicate Accounting Logic:** General ledger debits, credits, and tax amounts must never be calculated in frontend code.
5. **NO Parallel RBAC Engine:** The frontend must not implement its own user security store; Tryton enforces permissions on every RPC call.
6. **NO Workflow Bypass:** Frontend applications must follow the sequential state transitions enforced by Tryton models.
7. **GNU Health Is Authoritative:** When a discrepancy arises between client UI state and server response, the server state wins.

---

## 8. API Architecture & Communication Protocol

- **Protocol:** HTTP/1.1 or HTTP/2 over TLS (HTTPS).
- **Encoding:** JSON-RPC 2.0.
- **Base Endpoint:** `http://34.7.237.8/gnuhealth/` (Production: `https://<clinic-domain>/gnuhealth/`).
- **Standard Request Headers:**
  ```http
  Content-Type: application/json
  Accept: application/json
  Authorization: Session <base64_encoded_token>
  ```

---

## 9. Authentication & Session Management

### 9.1 Authentication Handshake
```http
POST /gnuhealth/ HTTP/1.1
Content-Type: application/json

{
  "id": 1,
  "method": "common.db.login",
  "params": ["<USERNAME>", "<PASSWORD>"]
}
```
**Response:**
```json
{
  "id": 1,
  "result": [12, "session_token_xyz_123"],
  "error": null
}
```

### 9.2 Session Authorization Header Construction
```
Raw String:    "<USER_ID>:<SESSION_TOKEN>"
Encoded:       Base64Encode(Raw String)
Header:        Authorization: Session <ENCODED_STRING>
```

### 9.3 Session Expiration & Logout
- Sessions expire after inactivity. When the server returns HTTP `401 Unauthorized` or `AccessError`, the frontend must prompt for re-authentication.
- Calling `common.db.logout` invalidates the session token on the server.

---

## 10. Native JSON-RPC Contract & Core Methods

Every Tryton ORM model exposes standard methods under the `model.<model_name>.<method>` namespace:

| Method | Parameters | Return Type | Description |
| :--- | :--- | :--- | :--- |
| `search` | `[domain, offset, limit, order, context]` | `[id1, id2, ...]` | Searches records matching domain. |
| `read` | `[[id1, id2], [fields], context]` | `[{field: val}, ...]` | Reads specified field values. |
| `search_read` | `[domain, offset, limit, order, fields, context]` | `[{field: val}, ...]` | Combined search and read in one call. |
| `create` | `[[{field: val}], context]` | `[new_id1, ...]` | Creates new records; returns IDs. |
| `write` | `[[id1, id2], {field: val}, context]` | `true` | Updates specified records. |
| `delete` | `[[id1, id2], context]` | `true` | Deletes records (if permitted). |

---

## 11. API Operation Catalog (Domains A through T)

- **Domain A: Authentication** (`common.db.login`, `common.db.logout`)
- **Domain B: Users / Context** (`model.res.user.read`)
- **Domain C: Patient Demographics** (`model.party.party.create`, `model.gnuhealth.patient.create`, `search_read`)
- **Domain D: Appointment Scheduling** (`model.gnuhealth.appointment.create`, `search_read`)
- **Domain E: Patient Check-In** (`model.gnuhealth.appointment.write` with `state='checked_in'`)
- **Domain F: Nursing Triage** (`model.gnuhealth.patient.evaluation.create` with vital signs)
- **Domain G: Clinical Consultations** (`model.gnuhealth.patient.evaluation.write` with SOAP; action `end_evaluation`)
- **Domain H: ICD-10 Medical Coding** (`model.gnuhealth.pathology.search_read`)
- **Domain I: Electronic Prescribing** (`model.gnuhealth.prescription.order.create`; action `create_prescription`)
- **Domain J: Diagnostic Laboratory** (`model.gnuhealth.lab.create`; actions `complete_criteareas` and `generate_document`)
- **Domain K: Medical Imaging** (`model.gnuhealth.imaging.test.request.create`; actions `requested` and `generate_results`)
- **Domain L: Health Services** (`model.gnuhealth.health_service.create`)
- **Domain M & N: Customer Invoicing** (`model.account.invoice.create`; action `post`)
- **Domain O: Cashier Payments** (`account.invoice.pay` wizard; method: `Cash Payment (QAR)`)
- **Domain P & Q: Accounting & Reconciliation** (`model.account.move.search_read`; `model.account.move.line.reconcile`)
- **Domain R: Related Records** (Native Tryton Relate queries connecting patient file to history)
- **Domain S & T: Reporting & Administration** (Tryton standard report engines and `res.group` models)

---

## 12. Data Model Documentation (18 Core Models)

The system operates on 18 core business models, detailed in `03_GNU_HEALTH_DATA_MODEL_AND_WORKFLOW_REFERENCE.md`:
1. `party.party` (Person identity & civil ID)
2. `gnuhealth.patient` (Medical record file & permanent PUID)
3. `gnuhealth.appointment` (Scheduling & check-in state machine)
4. `gnuhealth.patient.evaluation` (Nursing triage vitals & physician SOAP notes)
5. `gnuhealth.pathology` (ICD-10 clinical diagnoses catalog)
6. `gnuhealth.prescription.order` (Electronic prescription header)
7. `gnuhealth.prescription.line` (Medication, dosage, route, frequency, duration)
8. `gnuhealth.lab` (Diagnostic pathology order)
9. `gnuhealth.lab.test.critearea` (Analyte criteria and quantitative results)
10. `gnuhealth.imaging.test.request` (Radiology imaging request)
11. `gnuhealth.imaging.test.result` (Radiologist narrative findings report)
12. `gnuhealth.health_service` (Billable encounter service bundle)
13. `account.invoice` (Customer commercial invoice)
14. `account.invoice.line` (Invoice service line items)
15. `account.move` (Double-entry general ledger journal entry)
16. `account.move.line` (Debit and credit ledger entries)
17. `account.move.reconciliation` (Accounts receivable settlement link)
18. `res.user` / `res.group` (Operator accounts and RBAC groups)

---

## 13. Clinical Workflow Lifecycle

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

## 14. Laboratory Workflow Contract
- **Order Creation:** Physician orders test (e.g. CBC) in state `draft`.
- **Criteria Generation:** Lab technician triggers `complete_criteareas` action; Tryton auto-expands the 20 standard CBC analytes.
- **Result Recording:** Quantitative findings (e.g. Hemoglobin `14.1 g/dL`) recorded on analyte lines.
- **Validation:** Technician triggers `generate_document`; test state permanently locks to `done`.

---

## 15. Radiology Workflow Contract
- **Request Creation:** Clinician orders study (e.g. Chest X-Ray PA View) with clinical indications.
- **Study Execution:** Radiologist captures study and enters formal narrative findings.
- **Results Generation:** Radiologist triggers `generate_results`; state permanently locks to `done`.

---

## 16. Billing Workflow Contract
- **Health Service Compilation:** Billable consultation fees and diagnostic tests are bundled into `gnuhealth.health_service`.
- **Invoice Draft:** Cashier creates `account.invoice` linked to patient party.
- **Posting Action:** Cashier triggers `post` action; Tryton generates Move #47 on the Revenue journal and permanently locks the invoice against alteration.

---

## 17. Payment Workflow Contract
- **Wizard Launch:** Cashier clicks `PAY` button on posted invoice.
- **Method Selection:** Cashier selects `Cash Payment (QAR)`.
- **Settlement Execution:** Tryton generates Move #48 on the Cash journal, matches Accounts Receivable debit/credit lines, creates reconciliation record, and transitions invoice to `Paid`.

---

## 18. Accounting Workflow & Immutability Contract
- **Revenue Move #47:**
  - Debit: Account `1200` (Accounts Receivable) = `150.00 QAR`
  - Credit: Account `4000` (Medical Services Revenue) = `150.00 QAR`
  - Balanced: `150.00 QAR == 150.00 QAR`.
- **Payment Move #48:**
  - Debit: Account `1000` (Petty Cash / Main Till) = `150.00 QAR`
  - Credit: Account `1200` (Accounts Receivable) = `150.00 QAR`
  - Balanced: `150.00 QAR == 150.00 QAR`.
- **Immutability Invariant:** Posted invoices and moves cannot be modified or deleted. Any unauthorized modification raises an explicit `AccessError`.

---

## 19. Role-Based Access Control (RBAC) Contract

| Role | User Account | Permitted Operational Areas | Strictly Restricted Areas |
| :--- | :--- | :--- | :--- |
| **Front Desk** | `demo_frontdesk1` | Registration, Appointments, Check-in | Prescriptions, Clinical Evaluations, General Ledger |
| **Nurse** | `demo_nurse1` | Outpatient Triage, Anthropometric Vitals | Financial Invoicing, Prescription Issuance, General Ledger |
| **Physician** | `demo_dr1` | SOAP Consultations, ICD-10, Prescriptions | General Ledger Move Administration |
| **Laboratory** | `demo_lab1` | Pathology Requisitions, Analyte Results | Financial Invoicing, Prescriptions |
| **Radiology** | `demo_rad1` | Imaging Requests, Radiologist Reports | Financial Ledger, Pharmacy Dispensing |
| **Cashier** | `demo_cashier1` | Invoices, Posting, Cash Settlement Wizard | Clinical Evaluations, Diagnosis Modification |
| **Administrator**| `demo_admin1` | User Administration, System Maintenance | Operational separation enforced |

---

## 20. Security Architecture & Network Boundaries
- **Perimeter Firewall:** GCP VPC Firewall restricting ingress to TCP 22 (SSH Hardened), TCP 80 (HTTP), and TCP 443 (HTTPS).
- **Application Sandbox:** Tryton server runs under unprivileged service user `gnuhealth` bound strictly to `127.0.0.1:8000`.
- **Database Sandbox:** PostgreSQL bound strictly to `127.0.0.1:5432` with SCRAM-SHA-256 / peer authentication.
- **Password Hashes:** User passwords stored as cryptographic scrypt hashes.

---

## 21. Validation & Error Handling Contract

| Exception Class | Trigger Condition | Frontend Action | Recommended User Message |
| :--- | :--- | :--- | :--- |
| `AccessError` | Role permission denied or record locked | Block action; show alert | *"Access Restricted: You do not have permission to access or modify this record."* |
| `UserError` | Missing required field or invalid state | Highlight form field | Displays specific validation message returned by Tryton backend. |
| `SelectionValidationError` | Invalid state machine string | Fix dropdown value | *"Invalid selection option submitted."* |
| `SQLConstraintError` | Duplicate QID / Civil ID entered | Reject duplicate input | *"A patient with this Civil ID already exists in the clinic database."* |
| `401 Unauthorized` | Inactivity session timeout | Prompt re-login modal | *"Your session has expired. Please enter your password to continue."* |

---

## 22. Transaction Integrity & Rollback Safety
- **ACID Transactions:** Every business action executes inside an atomic PostgreSQL transaction.
- **Rollback Safety:** During validation failures, transactions roll back completely, preventing corrupted or orphaned database rows.
- **Zero Orphan Audit:** Audit of 306 public tables confirmed 0 foreign key orphans.

---

## 23. Backup & Disaster Recovery
- **Backup Schedule:** Automated daily script creating encrypted database dump and file attachment archive.
- **Tested Artifacts:** `/var/backups/gnuhealth/gnuhealth_db_e2e_post_20260922_184552.dump` (7.65 MB).
- **Disaster Recovery Drill:** Fully verified; restored database into sandbox in **10 seconds** with 100% table and accounting fidelity.
- **Off-Site Gate:** Automated sync to remote GCP Cloud Storage bucket flagged as pre-go-live gate.

---

## 24. API Testing Synthesis
- **Automated Integration Test Suite:** 33 / 33 test cases passed (100% success rate) in `reports/e2e_test_results.json`.
- **Negative Test Suite:** 14 / 14 defensive exception tests passed in `reports/e2e_negative_tests.json`.
- **Zero SQL Bypass:** All tests verified through native Tryton ORM.

---

## 25. Genuine Visible Browser E2E Certification
- **Certification Source:** `reports/LIVE_BROWSER_E2E_CERTIFICATION.md`.
- **Execution Engine:** Selenium WebDriver controlling installed Google Chrome desktop browser (`153.0.8010.53`).
- **Results:** 20 out of 20 operational stages executed through native SAO forms and buttons.
- **Evidence Payload:** 21 authentic screenshots (1.17 MB total) in `reports/live_browser_test/`.
- **Live Identifiers:** Patient `LIVE E2E TEST PATIENT` (`KQI816APL`), Appointment `18`, Evaluation `15`, Prescription `RX014`, Lab `TEST037`, Radiology `RAD-00012`, Invoice `INV-2026/00014` (Paid).

---

## 26. Performance Baselines (Observed Test Measurements)
*Note: Test-environment measurements on cloud host `gnuhealth-srv`, not production SLAs.*
- Patient Search: 3.67 ms average
- Patient Search & Read: 7.00 ms average
- Appointment Search: 1.12 ms average
- Clinical Evaluation Retrieval: 2.20 ms average
- Customer Invoice Search: 1.42 ms average
- Accounting Move Retrieval: 5.09 ms average

---

## 27. Frontend Integration Rules (17 Invariants)

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

## 28. Frontend ↔ Backend Responsibility Matrix

| Feature Domain | Frontend Responsibility | Backend Responsibility |
| :--- | :--- | :--- |
| **Authentication** | Collects credentials; manages session token state. | Verifies password hash; issues session token. |
| **Demographics** | Renders patient intake form; validates format. | Auto-generates permanent PUID; checks QID uniqueness. |
| **Appointments** | Displays calendar slots; submits booking request. | Validates provider availability; updates queue state. |
| **Triage** | Renders vitals form; calculates instant BMI. | Attaches vitals to medical file; checks physiological ranges. |
| **Consultation** | Renders SOAP inputs; provides ICD-10 search. | Validates physician license; locks record upon sign-off. |
| **Prescriptions** | Renders drug dosing fields; collects safety ack. | Validates formulation; executes contraindication check. |
| **Invoicing** | Displays service tariff and line totals. | Posts fiscal invoice; generates balanced GL move. |
| **Payment** | Renders cash payment wizard. | Reconciles Accounts Receivable; sets invoice to Paid. |
| **RBAC** | Hides unauthorized buttons for visual cleanliness. | Authoritatively enforces permissions on every RPC call. |

---

## 29. Frontend Team Required Inputs

The frontend team requires the following verified parameters from the backend:
- **Base Endpoint:** `http://34.7.237.8/gnuhealth/` (Production: `https://<domain>/gnuhealth/`).
- **Database Parameter:** `gnuhealth`.
- **Default Company Context:** `{"company": 1}`.
- **Currency Code:** `QAR` (Currency ID: `1`).
- **Country Code:** Qatar (Country ID: `178`, Alpha-3: `QAT`).
- **Active Operational Accounts:** DEMO role accounts (`demo_frontdesk1`, `demo_nurse1`, `demo_dr1`, `demo_lab1`, `demo_rad1`, `demo_cashier1`, `demo_admin1`).
- **Test Credentials:** Approved DEMO credentials (never hardcoded in repositories).

---

## 30. Documentation vs Implementation Consistency Audit

In accordance with Section 3, a strict audit cross-referencing repository documentation against live system behavior was conducted:

### Consistent Items (Verified Truth)
- Multi-tier architecture: Nginx reverse proxy -> Tryton WSGI -> PostgreSQL RDBMS.
- Protocol: Native JSON-RPC 2.0 via `common.db.login` and `model.<name>.<method>`.
- Core models: `party.party`, `gnuhealth.patient`, `gnuhealth.appointment`, `gnuhealth.patient.evaluation`, `gnuhealth.prescription.order`, `account.invoice`, `account.move`.
- Accounting currency: Strictly Qatari Riyal (`QAR`).
- Test evidence: 33 backend tests, 20 browser stages, 0 foreign key orphans.

### Discrepancies Resolved
- **Playwright Cloud Download Failure:** Early documentation referenced Playwright browser tests. Live testing failed with HTTP 404 driver download. Resolved by establishing Selenium WebDriver controlling installed Google Chrome desktop browser (`153.0.8010.53`).
- **Evaluation Completion Method:** Legacy notes referenced a generic `done` action. Live Tryton inspection confirmed the authoritative method is `end_evaluation`. Corrected across all integration specifications.
- **Lab Criteria Expansion Method:** Clarified that analyte expansion executes via `complete_criteareas` followed by document generation via `generate_document`.

### Unresolved Items (Marked NOT VERIFIED / NOT IMPLEMENTED)
- **Direct Insurance Claim Clearinghouse API:** Native Qatar insurance claims submission API is `NOT IMPLEMENTED / FUTURE PHASE`.
- **Off-Site Automated Cloud Storage Sync:** Automated rsync to secondary GCP bucket is `NOT IMPLEMENTED / PRODUCTION GATE`.

---

## 31. Production vs DEMO/UAT Distinction

- **Current Status:** The system is **Technically Complete and End-to-End Certified for DEMO/UAT**.
- **Data Policy:** All current patients (`LIVE E2E TEST PATIENT`, etc.) are synthetic DEMO/UAT records.
- **Production Pre-Requisites:** Real commercial launch requires satisfying the five production go-live gates detailed below.

---

## 32. Known Limitations & Open Items

### Category A: Backend Implementation Limitations
- Formulary currently loaded with representative essential medications (e.g. Amoxicillin). Full commercial pharmacy formulary requires clinic pharmacy import.
- Laboratory catalog currently configured for standard panels (e.g. CBC). Specialized molecular diagnostics require additional criteria loading.

### Category B: API Limitations
- Communication is strictly native Tryton JSON-RPC 2.0. There is no independent REST/OpenAPI wrapper layer. Frontend clients must use JSON-RPC payload structures.

### Category C: Frontend Integration Prerequisites
- Frontend team must implement a centralized JSON-RPC client service handling token injection and exception interception.

### Category D: Production Deployment Gates
1. Clinic Commercial Registration & MoPH License configuration.
2. Real Clinical Staff Onboarding & credential issuance.
3. Commercial Tariff Schedule approval and import.
4. FQDN Domain Mapping & CA-signed TLS 1.3 certificate deployment.
5. Off-site automated daily backup replication.

---

## 33. Frontend Handover Checklist Summary

The detailed 16-category checklist is provided in `07_GNU_HEALTH_FRONTEND_HANDOVER_CHECKLIST.md`. All items remain uncompleted (`[ ]`) awaiting the upcoming frontend phase:
- [ ] Architecture & API Communication Client
- [ ] Authentication & Session Persistence
- [ ] Patient Intake & Medical Record Lookup
- [ ] Appointment Scheduling & Queue Check-In
- [ ] Nursing Triage & Vitals
- [ ] Physician Consultation & ICD-10 Diagnoses
- [ ] Electronic Prescriptions
- [ ] Laboratory & Radiology Workflows
- [ ] Patient Invoicing & Cashier Payments
- [ ] General Ledger Audit Views
- [ ] RBAC Cosmetic UI Filtering
- [ ] Error Interception & User Guidance UX

---

## 34. Final Backend Handover Statement

The GNU Health HMIS backend is **technically complete, fully operational, and end-to-end certified for DEMO/UAT**. All operational models, security roles, clinical workflows, and accounting ledgers have been verified against the live environment. The backend engineering team formally hands over the platform and integration specifications to the frontend development team.

---

## 35. Evidence Index & Artifact References

- Executive Handover: `01_GNU_HEALTH_BACKEND_EXECUTIVE_HANDOVER.md`
- API Specification: `02_GNU_HEALTH_API_INTEGRATION_SPECIFICATION.md`
- Data Model Reference: `03_GNU_HEALTH_DATA_MODEL_AND_WORKFLOW_REFERENCE.md`
- Security Contract: `04_GNU_HEALTH_RBAC_AND_SECURITY_CONTRACT.md`
- Frontend Guide: `05_GNU_HEALTH_FRONTEND_INTEGRATION_GUIDE.md`
- Test Summary: `06_GNU_HEALTH_BACKEND_TEST_AND_CERTIFICATION_SUMMARY.md`
- Frontend Checklist: `07_GNU_HEALTH_FRONTEND_HANDOVER_CHECKLIST.md`
- Documentation Index: `08_GNU_HEALTH_BACKEND_API_HANDOVER_INDEX.md`
- Live Browser Certification: `reports/LIVE_BROWSER_E2E_CERTIFICATION.md`
- Machine Evidence: `reports/LIVE_BROWSER_E2E_CERTIFICATION.json`
- Backend Evidence: `reports/e2e_test_results.json`
