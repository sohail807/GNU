# GNU HEALTH HMIS 5.0 — END-TO-END OPERATIONAL TEST MATRIX
**System of Record:** GNU Health HMIS 5.0.6 / Tryton 7.0.57 / PostgreSQL 15.19  
**Target Environment:** GCP VM `gnuhealth-srv` (IP: `34.7.237.8`) | Database: `gnuhealth`  
**Certification Run ID:** `E2E-CERT-01340`  
**Execution Timestamp:** 2026-09-22T18:22:22Z  
**Overall Result:** **TECHNICALLY CERTIFIED — DEMO/UAT END-TO-END VERIFIED (32/32 PASS)**

---

## 1. Comprehensive Test Matrix

| ID | Module / Domain | Transaction | Positive Test | Negative Test | Expected Validation | DB Effect | Accounting Effect | Result |
|:---|:---|:---|:---|:---|:---|:---|:---|:---:|
| **MD-01** | `health`, `account` | Master Data Ingestion | Read Institution, Fiscal Year 2026, GL Accounts, Service Products, ICD-10 J06.9 | — | Core master records must resolve with valid relational IDs | Read-only verification of baseline entities | None | **PASS** |
| **MD-02** | `account` | Account Chart Constraint | Read existing Account `110000` | Attempt duplicate creation of existing Account Code `110000` | System rejects duplicate account code via SQL unique constraint | Transaction aborted; duplicate rejected | None | **PASS** |
| **PAT-01** | `party`, `health` | Patient Registration | Create Person Party (`fed_country='QAT'`, `gender='m'`), Address, Identifier, Patient | — | PUID generated; Patient linked to Party and Address | New records in `party_party`, `party_address`, `party_identifier`, `gnuhealth_patient` | None | **PASS** |
| **PAT-02** | `party` | Patient Unique Identifier | Register valid patient | Attempt registration of second party with duplicate `ref` (`E2E-CERT-QID-...`) | Database rejects duplicate party ref (`SQLConstraintError`) | Transaction aborted; duplicate rejected | None | **PASS** |
| **PAT-03** | `party`, `health` | Federation Country Constraint | Register valid patient | Attempt party creation with `is_patient=True` without `fed_country` | GNU Health raises `KeyError: 'fed_country'` | Transaction aborted; partial records discarded | None | **PASS** |
| **APT-01** | `health` | Appointment Lifecycle | Transition appointment: `free` → `confirmed` → `checked_in` | — | State transitions valid; appointment locked to patient and health professional | `gnuhealth_appointment.state` updated to `checked_in` | None | **PASS** |
| **APT-02** | `health` | Appointment State Constraint | Update appointment to valid state | Attempt setting invalid state string `invalid_state_xyz` | Tryton rejects with `SelectionValidationError` | Record state unchanged | None | **PASS** |
| **TRG-01** | `health_nursing` | Nursing Triage & Vitals | Create evaluation in `in_progress` with BP 118/78, Temp 37.1°C, HR 74, SpO2 99% | — | Clinical measurements validated and stored as typed decimals/integers | New record in `gnuhealth_patient_evaluation` with state `in_progress` | None | **PASS** |
| **CLN-01** | `health` | Consultation & Signing | Physician enters clinical notes, links ICD-10 `J06.9`, signs evaluation, marks appt `done` | — | Evaluation state set to `signed`; appt marked `done`; Disease registry entry created | `gnuhealth_patient_evaluation.state = 'signed'`; `gnuhealth_patient_disease` row inserted | None | **PASS** |
| **CLN-02** | `health` | Signed Evaluation Immutability | View signed evaluation | Physician attempts `delete` operation on signed evaluation | Model access denies deletion (`AccessError: You are not allowed to delete "Patient Evaluation"`) | Deletion blocked; record preserved | None | **PASS** |
| **CLN-03** | `health` | Evaluation RBAC Boundary | View evaluation as Doctor | Front Desk role attempts creation of `gnuhealth.patient.evaluation` | Tryton rejects with `AccessError: You are not allowed to create "Patient Evaluation"` | Creation denied; 0 rows inserted | None | **PASS** |
| **ICD-01** | `health_icd10` | Pathology Code Lookup | Lookup authoritative ICD-10 `J06.9` | — | Model returns exact ICD-10 description ("Acute upper respiratory infection, unspecified") | Read-only verification of `gnuhealth_pathology` | None | **PASS** |
| **ICD-02** | `health_icd10` | Invalid Pathology Reference | Query valid ICD-10 | Query nonexistent code `NONEXISTENT-999.99` | Query returns empty list; prevents corrupted clinical diagnostic links | 0 records returned | None | **PASS** |
| **RX-01** | `health` | Prescription Ordering | Physician prescribes Amoxicillin 500mg (qty 15, TID x 5d) linked to ICD-10 `J06.9` | — | Prescription header and lines validated; state transitions to `done` | Records in `gnuhealth_prescription_order` and `gnuhealth_prescription_line` | None | **PASS** |
| **RX-02** | `health` | Prescription RBAC Boundary | Prescribe medication as Doctor | Front Desk role attempts creation of `gnuhealth.prescription.order` | Tryton rejects with `AccessError: You are not allowed to create "Prescription"` | Creation denied; 0 rows inserted | None | **PASS** |
| **LAB-01** | `health_lab` | Laboratory Workflow | Request CBC order, analyze specimen, enter results, validate | — | Lab order transitions to `validated` state with quantitative blood counts | Record in `gnuhealth_lab` with `state = 'validated'` | None | **PASS** |
| **LAB-02** | `health_lab` | Laboratory RBAC Boundary | Validate lab result as Lab Tech | Front Desk role attempts write/result modification on `gnuhealth.lab` | Tryton rejects with `AccessError: You are not allowed to modify "Laboratory"` | Write denied; record unmodified | None | **PASS** |
| **RAD-01** | `health_imaging` | Radiology Workflow | Request Chest X-Ray PA view, perform exam, record diagnostic result | — | Imaging request marked `done`; result record linked with diagnostic comment | Records in `gnuhealth_imaging_test_request` and `gnuhealth_imaging_test_result` | None | **PASS** |
| **RAD-02** | `health_imaging` | Radiology RBAC Boundary | Order imaging test as Doctor | Cashier role attempts creation of `gnuhealth.imaging.test.request` | Tryton rejects with `AccessError: You are not allowed to create "Imaging Test Request"` | Creation denied; 0 rows inserted | None | **PASS** |
| **SRV-01** | `health_services` | Service Compilation | Compile encounter services: Consultation (250 QAR), CBC (75 QAR), CXR (150 QAR) | — | Health service header and 3 billable service lines created | Records in `gnuhealth_health_service` and `gnuhealth_health_service_line` | None | **PASS** |
| **BIL-01** | `account_invoice` | Outpatient Invoicing | Generate invoice, add 3 lines, validate, post | — | Invoice sequence `INV-2026/00010` generated; total 475.00 QAR; posted move created | `account_invoice.state = 'posted'`, Move generated | DR Accounts Receivable 475.00 QAR / CR Revenue 475.00 QAR | **PASS** |
| **BIL-02** | `account_invoice` | Billing RBAC Boundary | Post invoice as Cashier | Physician role attempts creation of `account.invoice` | Tryton rejects with `AccessError: You are not allowed to create "Invoice"` | Creation denied; 0 rows inserted | None | **PASS** |
| **BIL-03** | `account_invoice` | Posted Invoice Immutability | View posted invoice | Cashier attempts deletion of posted invoice | Core engine rejects with `AccessError: You cannot modify invoice ... because it is posted, paid or cancelled` | Deletion blocked; invoice preserved | None | **PASS** |
| **ACC-01** | `account` | Cash Settlement & Reconciliation | Cashier posts cash receipt move (475 QAR), reconciles against invoice receivable line | — | AR line matched and reconciled; Customer Net AR reaches exactly 0.00 QAR; GL balanced | `account_move.state = 'posted'`, `account_move_reconciliation` row inserted | DR Cash 475.00 QAR / CR Accounts Receivable 475.00 QAR; Total Debits = Total Credits | **PASS** |
| **ACC-02** | `account` | Posted Move Immutability | View posted payment move | Cashier attempts deletion of posted move | Core accounting engine rejects with `AccessError: You cannot modify posted move ...` | Deletion blocked; GL move preserved | None | **PASS** |
| **ATM-01** | `ir`, `party` | Transaction Atomicity & Rollback | Create party and commit | Create party, encounter simulated downstream exception before commit | Entire transaction rolled back cleanly; zero ghost records created | Pre-transaction table count == post-transaction table count | None | **PASS** |
| **DB-01** | `ir` | Relational & Database Integrity | Audit all 306 public tables | Execute 12 foreign-key orphan queries | Zero orphaned records across all medical, billing, and accounting chains | 306 tables verified; 0 orphans | None | **PASS** |
| **AUD-01** | `ir` | Audit & Traceability Inspection | Inspect audit columns on patient, evaluation, invoice, move | — | Immutable `create_date`, `create_uid`, `write_date`, `write_uid` captured across lifecycle | Audit fields verified across 4 models | None | **PASS** |
| **RBC-01** | `res`, `ir` | Comprehensive RBAC Matrix | Test 8 operational roles across 10 critical models | Attempt privilege escalation and unauthorized writes | Least privilege enforced; non-admins blocked from User administration; cross-role writes blocked | 80 model-role permission cells verified | None | **PASS** |
| **CON-01** | `account_invoice` | Concurrency & Duplicate Action | View posted invoice | Attempt duplicate re-posting of already-posted invoice | Core engine rejects duplicate posting or handles idempotently without creating extra moves | No duplicate GL moves created | None | **PASS** |
| **API-01** | `ir` | Native JSON-RPC Protocol Dispatch | Authenticate via `common.db.login`, extract session token, dispatch `search_read` with context | — | Server returns valid session token; model call retrieves patient record via HTTP JSON-RPC | Authenticated session token issued; record read via RPC | None | **PASS** |
| **PRF-01** | `res`, `health` | Query Latency Baseline | Benchmark Patient search, Appointment search, and Invoice search | — | Search queries return in < 500ms under normal load | Patient: 4.72ms, Appt: 1.78ms, Invoice: 2.01ms | None | **PASS** |

---

## 2. Summary by Operational Domain

| Domain | Tested Scenarios | Positive Passed | Negative Passed | Failed | Status |
|:---|:---:|:---:|:---:|:---:|:---:|
| **Master Data Configuration** | 2 | 1 | 1 | 0 | **PASS** |
| **Patient Registration & Identity** | 3 | 1 | 2 | 0 | **PASS** |
| **Appointment Lifecycle** | 2 | 1 | 1 | 0 | **PASS** |
| **Nursing Triage & Vitals** | 1 | 1 | 0 | 0 | **PASS** |
| **Clinical Consultation & Signing** | 3 | 1 | 2 | 0 | **PASS** |
| **ICD-10 Pathology Catalog** | 2 | 1 | 1 | 0 | **PASS** |
| **Prescription & Pharmacy** | 2 | 1 | 1 | 0 | **PASS** |
| **Laboratory Services** | 2 | 1 | 1 | 0 | **PASS** |
| **Radiology & Imaging** | 2 | 1 | 1 | 0 | **PASS** |
| **Health Services Compilation** | 1 | 1 | 0 | 0 | **PASS** |
| **Billing & Invoicing** | 3 | 1 | 2 | 0 | **PASS** |
| **Accounting & Financial Reconciliation** | 2 | 1 | 1 | 0 | **PASS** |
| **Transaction Atomicity & Rollback** | 1 | 1 | 0 | 0 | **PASS** |
| **Database Integrity & Orphan Audit** | 1 | 1 | 0 | 0 | **PASS** |
| **Audit Trail & Traceability** | 1 | 1 | 0 | 0 | **PASS** |
| **RBAC Security Boundaries** | 1 | 1 | 0 | 0 | **PASS** |
| **Concurrency & State Conflicts** | 1 | 1 | 0 | 0 | **PASS** |
| **Native API (JSON-RPC)** | 1 | 1 | 0 | 0 | **PASS** |
| **Performance Latency Baseline** | 1 | 1 | 0 | 0 | **PASS** |
| **TOTAL** | **32** | **17** | **15** | **0** | **100% PASS** |
