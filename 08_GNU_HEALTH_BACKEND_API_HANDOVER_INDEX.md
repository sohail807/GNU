# GNU Health HMIS — Backend & API Handover Documentation Index
## Complete Documentation Suite Directory, File Registry & Evidence Navigator

**Document Reference:** `GH-DOC-INDEX-008`  
**System Target:** GNU Health HMIS 5.0.6 / Tryton Framework 7.0.57  
**Status:** Authoritative Repository Documentation Map  
**Audience:** Project Managers, Solution Architects, Lead Engineers, Auditors

---

## 1. Handover Documentation Suite Overview

This documentation suite constitutes the formal handover package provided to management and the frontend engineering team prior to the commencement of custom frontend development:

| Document Code & Filename | Title | Purpose | Primary Audience |
| :--- | :--- | :--- | :--- |
| **`01_GNU_HEALTH_BACKEND_EXECUTIVE_HANDOVER.md`** | Backend Executive Handover Report | High-level management summary of completed backend capabilities, hosting stack, domain status, and go-live gates. | Project Managers, Stakeholders, Product Owners |
| **`02_GNU_HEALTH_API_INTEGRATION_SPECIFICATION.md`** | Native API Integration Specification | Detailed technical specification of the native Tryton JSON-RPC 2.0 protocol, authentication, and operation catalog across all 20 domains. | Frontend Engineers, API Developers, Architects |
| **`03_GNU_HEALTH_DATA_MODEL_AND_WORKFLOW_REFERENCE.md`** | Data Model & Operational Workflow Reference | Complete catalog of the 18 core business models, relational fields, lifecycle state machines, and accounting double-entry rules. | Data Engineers, Frontend Architects, Business Analysts |
| **`04_GNU_HEALTH_RBAC_AND_SECURITY_CONTRACT.md`** | RBAC & Security Contract | Authoritative security specifications, 7-role access matrix, negative test evidence, and 17 mandatory frontend security invariants. | Security Officers, Compliance Auditors, Frontend Leads |
| **`05_GNU_HEALTH_FRONTEND_INTEGRATION_GUIDE.md`** | Frontend Developer Implementation Guide | Practical developer manual containing step-by-step TypeScript recipes, centralized API client patterns, and error handling UX. | Frontend Software Engineers, UI/UX Developers |
| **`06_GNU_HEALTH_BACKEND_TEST_AND_CERTIFICATION_SUMMARY.md`** | Backend Test & Certification Summary | Complete technical synthesis of the 33 backend tests, 20 visible browser E2E screenshots, 0 FK orphans, and disaster recovery drill. | QA Leads, Compliance Officers, Technical Auditors |
| **`07_GNU_HEALTH_FRONTEND_HANDOVER_CHECKLIST.md`** | Frontend Handover & Integration Checklist | Uncompleted action checklist delineating the upcoming frontend engineering tasks across all clinical and financial modules. | Frontend Lead Engineers, Scrum Masters, PMs |
| **`08_GNU_HEALTH_BACKEND_API_HANDOVER_INDEX.md`** | Backend & API Handover Documentation Index | Comprehensive navigation index, file registry, and cross-reference directory for the entire documentation repository. | All Technical & Management Personnel |
| **`GNU_HEALTH_BACKEND_API_HANDOVER_PACKAGE.md`** | Master Backend & API Handover Package | Unified single master document synthesizing the complete technical and management handover into one standalone artifact. | Executive Leadership, Project Directors |
| **`API_DOCUMENTATION_QA_REPORT.md`** | API Documentation QA & Consistency Report | Quality assurance audit report verifying cross-document consistency, secret redaction, and discrepancy analysis. | QA Auditors, Technical Leads |

---

## 2. Core Repository Artifacts & Evidence Directory

### 2.1 Formal Certification Reports
- **`reports/LIVE_BROWSER_E2E_CERTIFICATION.md`**: Authoritative certification report for the 20-stage genuine visible Google Chrome browser E2E test.
- **`reports/LIVE_BROWSER_E2E_CERTIFICATION.json`**: Machine-readable audit evidence containing live transaction IDs, accounting moves, and RBAC outcomes.
- **`reports/e2e_test_results.json`**: Execution record of the 33/33 automated backend integration test suite.
- **`reports/e2e_database_integrity.json`**: Audit report verifying zero foreign key orphans across 306 public tables.
- **`reports/e2e_negative_tests.json`**: Detailed log of negative defensive tests and exception handling verification.
- **`reports/e2e_backup_restore.json`**: Isolated disaster recovery drill evidence and database fidelity verification.
- **`reports/e2e_performance_baseline.json`**: Observed latency measurements for search, read, and retrieval operations.

### 2.2 Canonical Browser E2E Screenshot Inventory (`reports/live_browser_test/`)
- `recovery_01_login_page.png` (21,431 bytes): Mandatory Section 4 recovery screenshot showing live SAO login page.
- `01_login.png` (16,134 bytes): Initial authentication modal.
- `02_dashboard.png` (15,777 bytes): Front Desk authenticated dashboard.
- `03_patient_registration.png` (64,031 bytes): Party registration modal with demographics.
- `04_patient_saved.png` (50,385 bytes): Saved patient file displaying PUID `KQI816APL`.
- `05_appointment.png` (70,410 bytes): Appointment booked with Dr. DEMO Physician 01.
- `06_checkin.png` (42,451 bytes): Appointment status transitioned to `Checked-in`.
- `07_triage.png` (71,527 bytes): Nursing triage evaluation with recorded vital signs.
- `08_consultation.png` (74,570 bytes): Signed physician consultation with SOAP notes and ICD-10 `J06.9`.
- `09_prescription.png` (60,473 bytes): Validated e-Prescription `RX014` for Amoxicillin 500mg.
- `10_lab_order.png` (66,942 bytes): Laboratory CBC test order with 20 criteria analytes loaded.
- `11_lab_result.png` (66,778 bytes): Completed laboratory test result with HGB `14.1 g/dL`.
- `12_radiology.png` (54,251 bytes): Medical imaging Chest X-Ray request completed with findings.
- `13_invoice.png` (64,319 bytes): Customer invoice `INV-2026/00014` posted for 150.00 QAR.
- `14_payment.png` (61,770 bytes): Cashier cash payment completed; invoice state `Paid`.
- `15_accounting_move.png` (58,611 bytes): General ledger moves showing balanced debits and credits.
- `16_patient_related_records.png` (125,763 bytes): Native Relate navigation proving full clinical/financial chain.
- `17_frontdesk_negative.png` (23,902 bytes): Front Desk negative test: Prescriptions access denied.
- `18_cashier_negative.png` (21,154 bytes): Cashier negative test: Clinical evaluations access denied.
- `19_physician_negative.png` (22,161 bytes): Physician negative test: Account moves administration access denied.
- `20_final_transaction.png` (125,763 bytes): Full consolidated transaction profile in visible Chrome browser.

### 2.3 Key Operational & Verification Scripts (`scripts/`)
- `scripts/execute_full_backend_implementation.py`: Master automated backend technical implementation and test runner.
- `scripts/run_genuine_visible_browser_certification.py`: Comprehensive 20-stage visible browser automation suite.
- `scripts/run_visible_negative_and_final.py`: Visible browser negative RBAC and final transaction runner.
- `scripts/capture_20_final_visible.py`: Script capturing related records and consolidated final profile in visible Chrome.
- `scripts/align_and_verify_evidence.py`: Evidence alignment, validation, and payload integrity checker.
- `scripts/lib_e2e.py`: Shared reusable Tryton SAO browser interaction helper library.

---

## 3. Evidence Cross-Reference Navigator

| Topic | Primary Handover Document | Authoritative Evidence File | Verified Metric / State |
| :--- | :--- | :--- | :--- |
| **System Architecture** | `01_GNU_HEALTH_BACKEND_EXECUTIVE_HANDOVER.md` | `GNU_HEALTH_BACKEND_ARCHITECTURE.md` | 3-tier Nginx -> Tryton -> PostgreSQL |
| **API Protocol & Methods**| `02_GNU_HEALTH_API_INTEGRATION_SPECIFICATION.md` | `docs/GNU_HEALTH_NATIVE_API_CONTRACT.md` | Native JSON-RPC 2.0 / `common.db.login` |
| **Data Models & Schema** | `03_GNU_HEALTH_DATA_MODEL_AND_WORKFLOW_REFERENCE.md`| `configuration/clinic-config.yaml` | 18 Core Models / 306 PostgreSQL Tables |
| **RBAC Matrix & Rules** | `04_GNU_HEALTH_RBAC_AND_SECURITY_CONTRACT.md` | `reports/e2e_rbac_evidence.json` | 7 Roles / Least Privilege Enforced |
| **Negative Tests & Denials**| `04_GNU_HEALTH_RBAC_AND_SECURITY_CONTRACT.md`| `reports/e2e_negative_tests.json` | 100% Defensive Denials Observed |
| **Developer Recipes** | `05_GNU_HEALTH_FRONTEND_INTEGRATION_GUIDE.md` | `docs/FRONTEND_INTEGRATION_GUIDE.md` | 7 Step-by-Step TypeScript Recipes |
| **Integration Test Suite**| `06_GNU_HEALTH_BACKEND_TEST_AND_CERTIFICATION_SUMMARY.md`| `reports/e2e_test_results.json` | 33 / 33 Tests Passed (100%) |
| **Database Integrity** | `06_GNU_HEALTH_BACKEND_TEST_AND_CERTIFICATION_SUMMARY.md`| `reports/e2e_database_integrity.json` | 0 FK Orphans across 306 Tables |
| **Browser E2E Execution** | `06_GNU_HEALTH_BACKEND_TEST_AND_CERTIFICATION_SUMMARY.md`| `reports/LIVE_BROWSER_E2E_CERTIFICATION.md` | 20 / 20 Stages Verified in Chrome |
| **Disaster Recovery** | `06_GNU_HEALTH_BACKEND_TEST_AND_CERTIFICATION_SUMMARY.md`| `reports/e2e_backup_restore.json` | 10-Second Isolated Database Restore |
| **Frontend Work Scope** | `07_GNU_HEALTH_FRONTEND_HANDOVER_CHECKLIST.md`| Project Scope Baseline | 16 Unchecked Action Categories |
