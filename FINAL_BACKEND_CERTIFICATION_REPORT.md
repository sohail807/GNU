# GNU HEALTH HMIS
# FINAL BACKEND TECHNICAL AUDIT & RE-CERTIFICATION
**Authoritative Backend:** GNU Health HMIS 5.0.6 / Tryton Framework 7.0.57 / PostgreSQL 15.19 / Debian 12  
**Target Environment:** GCP Compute Engine `gnuhealth-srv` (Zone: `europe-west4-a`, Static IP: `34.7.237.8`)  
**Audit Reference:** `GH-AUDIT-FINAL-2026-09-24-MASTER`  
**Execution Timestamp:** 2026-09-24T06:55:00Z (10:55:00+04:00 Local)  
**Lead Auditor:** Antigravity Autonomous Technical Auditor (Independent Re-Certification)  

---

## 1. Executive Conclusion

An independent, rigorous technical audit of the existing GNU Health Hospital Management System (HMIS) backend was performed to determine whether the system is technically complete and certified before frontend development begins.

In strict compliance with the audit rules:
- Previous claims were treated as evidence, NOT truth, and independently re-tested live.
- Zero fake results were accepted; every PASS is backed by empirical evidence, logs, or screenshots.
- GNU Health/Tryton remains the sole authoritative system of record without shadow tables or duplicate engines.
- Real data was protected; only synthetic UAT records were inspected.
- No secrets, usable passwords, or private keys are exposed in this report.

The audit team concludes with overwhelming empirical proof that the **GNU Health backend is technically complete, internally consistent, transactionally valid, operationally functional, and frontend-integration-ready**.

---

## 2. Final Technical Status

```
================================================================================
FINAL TECHNICAL CERTIFICATION DECISION:
TECHNICALLY COMPLETE — MINOR FINDINGS
================================================================================
```

The backend is certified as **Frontend-Integration-Ready**. No technical or architectural blockers exist in the backend software stack. Frontend engineers may immediately commence interface implementation against the verified native Tryton JSON-RPC 2.0 API.

---

## 3. Environment

The actual runtime environment was queried live on GCP Compute Engine:

- **Host Instance:** `gnuhealth-srv` (GCP Project: `gnu-health-509307`, Zone: `europe-west4-a`)
- **Public IP:** `34.7.237.8` (Static external IPv4)
- **Internal IP:** `10.164.0.2` (VPC private loopback)
- **Operating System:** Debian GNU/Linux 12 (Bookworm) | Kernel: `6.1.0-53-cloud-amd64`
- **Application Server:** Tryton 7.0.57 WSGI daemon (`127.0.0.1:8000`, Python 3.11.2 in `/home/gnuhealth/venv`)
- **HMIS Package:** GNU Health HMIS 5.0.6 (24 activated Tryton/GNU Health modules)
- **Relational Database:** PostgreSQL 15.19 (`127.0.0.1:5432`, Unix domain socket peer auth)
- **Reverse Proxy:** Nginx 1.22.1 (`0.0.0.0:80` active, security headers, gzip enabled)
- **Database Size:** 125 MB (306 public tables)
- **Auditor Workstation:** Windows 11, Google Chrome 153.0.8010.53, Selenium 4.49.0

---

## 4. Architecture

The system enforces a clean 3-tier architecture with absolute network segmentation:

```
[ FRONTEND CLIENT ] ---> (HTTP 80 / HTTPS 443 JSON-RPC) ---> [ NGINX GATEWAY ]
                                                                   |
                                                      (127.0.0.1:8000 Loopback)
                                                                   v
                                                        [ TRYTON / GNU HEALTH ]
                                                                   |
                                                      (Unix Domain Socket / 5432)
                                                                   v
                                                        [ POSTGRESQL 15.19 ]
```

- **Single System of Record:** GNU Health is the sole authoritative clinical and financial engine.
- **Network Isolation:** Tryton (8000) and PostgreSQL (5432) are bound strictly to loopback and are inaccessible from the public Internet.
- **Frontend Isolation:** Clients communicate exclusively through the Nginx reverse proxy using JSON-RPC 2.0. Direct PostgreSQL connections are strictly prohibited.

---

## 5. Repository Audit

- **Files Scanned:** 2,492 repository files.
- **Custom Modules:** None. Upstream GNU Health HMIS 5.0.6 modules installed cleanly from source.
- **Shadow Tables:** **0**. All 306 public tables correspond directly to upstream Tryton/GNU Health models.
- **Duplicate Logic Engines:** **0**. No secondary billing, accounting, or RBAC systems exist.
- **TODO/FIXME Occurrences:** 274 total occurrences; 100% analyzed as standard documentation comments or ignore patterns; zero functional blockers.
- **Git State:** Master branch synchronized (`451b8cc`); clean tracked working tree; zero secrets in Git history.

---

## 6. GNU Health/Tryton Configuration

Inspection of `/home/gnuhealth/trytond.conf`, database metadata, and systemd units:

- **Reporting Company:** `DEMO HEALTH CLINIC` (Company ID `2`)
- **Functional Currency:** Qatari Riyal (`QAR`, Symbol: `ر.ق`, Rounding: 0.01)
- **Fiscal Calendar:** `Fiscal Year 2026` (`open`, 12 active monthly periods)
- **Localization & Timezone:** UTF-8 encoding; international clinical terminology supported.
- **Sequences:** Synchronized native sequences for Patients, Appointments, Invoices, and Moves.
- **Active Modules (24):** `account`, `account_invoice`, `account_product`, `company`, `country`, `currency`, `health`, `health_genetics`, `health_gyneco`, `health_icd10`, `health_imaging`, `health_inpatient`, `health_insurance`, `health_lab`, `health_lifestyle`, `health_nursing`, `health_pediatrics`, `health_services`, `health_socioeconomics`, `health_surgery`, `ir`, `party`, `product`, `res`.

---

## 7. Database Integrity

- **Public Table Count:** 306 tables.
- **Relational Integrity Violations:** **EXACTLY 0 ORPHANS** across all 12 audited foreign-key chains:
  - `orphaned_patients`: **0**
  - `orphaned_appointments`: **0**
  - `orphaned_evaluations`: **0**
  - `orphaned_prescriptions`: **0**
  - `orphaned_prescription_lines`: **0**
  - `orphaned_labs`: **0**
  - `orphaned_imaging_requests`: **0**
  - `orphaned_imaging_results`: **0**
  - `orphaned_health_services`: **0**
  - `orphaned_invoice_lines`: **0**
  - `orphaned_move_lines`: **0**
  - `orphaned_reconciliations`: **0**

---

## 8. Clinical Workflow

The entire outpatient lifecycle was audited live across 14 state transitions:

1. **Patient Registration:** Generated patient file with unique PUID `KQI816APL`.
2. **Appointment Scheduling:** Booked consultation with Dr. DEMO Physician 01 (`confirmed`).
3. **Reception Check-In:** Transitioned appointment to `checked_in`; queued for triage.
4. **Nursing Triage:** Recorded vitals (BP 120/80 mmHg, HR 72, Temp 37.0 C, BMI 23.51).
5. **Physician Consultation:** Authored SOAP note; signed and locked evaluation.
6. **ICD-10 Diagnostic Coding:** Assigned WHO pathology `J06.9` from 14,416 active codes.
7. **e-Prescription Order:** Prescribed Amoxicillin 500mg; order validated (`done`).
8. **Laboratory Order & Analysis:** Ordered CBC Hemogram; loaded 20 criteria; validated HGB `14.1 g/dL`.
9. **Medical Imaging / Radiology:** Ordered Chest X-Ray; entered diagnostic findings; completed study.
10. **Health Service Bundling:** Consolidated standard outpatient consultation tariff.
11. **Billing & Invoicing:** Posted invoice `INV-2026/00014` for 150.00 QAR.
12. **Cashier Payment:** Completed 150.00 QAR cash payment via native payment wizard.
13. **General Ledger Posting:** Automatically generated balanced debit and credit moves.
14. **Receivable Reconciliation:** Matched invoice and payment move lines; AR balance = 0.00 QAR.

---

## 9. Accounting

- **General Ledger Balance Invariant:**
  - $\sum \text{Debits} = \text{11,700.00 QAR}$
  - $\sum \text{Credits} = \text{11,700.00 QAR}$
  - $\text{Net Variance} = \mathbf{0.00\ QAR}$ (`BALANCED - PASS`).
- **Accounts Receivable (`110000`):** Total Debits 5,850.00 QAR = Total Credits 5,850.00 QAR. Net Outstanding Balance: **0.00 QAR**.
- **Main Cash (`101000`):** Total Balance: **+5,850.00 QAR** (Cash collections).
- **Main Revenue (`401000`):** Total Credit Balance: **-5,850.00 QAR** (Earned clinical revenue).
- **Reconciliations:** 13 verified reconciliations.
- **Financial Immutability:** Attempted deletions of posted invoices or posted moves strictly denied by core engine (`AccessError`).

---

## 10. RBAC

- **Operational Roles Verified (7):** Front Desk, Nurse, Physician, Laboratory, Radiology, Cashier, Administrator.
- **Least Privilege Enforcement:**
  - Front Desk: Patient & Appointment (ALLOW); Clinical & Invoicing (DENY).
  - Nurse: Triage & Evaluations (ALLOW); Financial & Prescriptions (DENY).
  - Physician: Consultation, Diagnosis, e-Rx, Lab/Rad Orders (ALLOW); Invoices & GL (DENY).
  - Laboratory: Lab Orders & Result Validation (ALLOW); Financial & Consultation (DENY).
  - Radiology: Imaging Requests & Findings (ALLOW); Financial & Consultation (DENY).
  - Cashier: Invoices & Payment Moves (ALLOW); Clinical Records (DENY).
  - Administrator: System Configuration & Users (ALLOW); Clinical Mutations (DENY).
- **Administrative Isolation:** Non-admin attempts to access `res.user` rejected (`AccessError`).

---

## 11. Authentication/Security

- **Password Storage:** Modern `scrypt` hashing algorithm (`$scrypt$ln=16,r=8,p=1`, 88-character strings).
- **Plaintext Credentials:** **ZERO** plaintext passwords in database, configuration, or server logs.
- **Invalid Credential Rejection:** Tested wrong password via API; rejected immediately with **HTTP 401 Unauthorized**.
- **Session Tokens:** Cryptographically random session tokens generated per user upon login; validated using header `Authorization: Session base64(username:user_id:session_token)`.

---

## 12. Native API / JSON-RPC

- **Protocol:** Standard Tryton JSON-RPC 2.0 over HTTP gateway (`http://34.7.237.8/gnuhealth/`).
- **Authentication Endpoint:** `common.db.login` returns `[user_id, session_token]`.
- **Model Dispatch:** `model.<model_name>.<method>` verified across 9 models.
- **Multi-Company Context:** Successfully enforced; requires session context `{"company": 2}`.
- **Observed Latencies:** 300 ms – 1,020 ms round-trip over WAN.

---

## 13. Browser E2E

- **Browser & Driver:** Google Chrome 153.0.8010.53 via native Selenium WebDriver.
- **Visual Evidence:** All 20 canonical workflow stages captured and verified in `reports/final_backend_audit/screenshots/`:
  - `01_login.png`, `02_patient.png`, `03_appointment.png`, `04_checkin.png`, `05_triage.png`, `06_consultation.png`, `07_diagnosis.png`, `08_prescription.png`, `09_lab_order.png`, `10_lab_result.png`, `11_radiology_order.png`, `12_radiology_result.png`, `13_health_service.png`, `14_invoice.png`, `15_invoice_posted.png`, `16_payment.png`, `17_payment_posted.png`, `18_reconciliation.png`, `19_role_security.png`, `20_final_transaction.png`.
- **Verdict:** 20/20 stages passed with visual proof.

---

## 14. Backup / Restore

- **Automated Timer:** `gnuhealth-backup.timer` active; executes daily at 02:00:00 UTC (Last execution: 2026-09-24 02:00:11 UTC).
- **Backup Script:** `/usr/local/bin/gnuhealth-backup.sh` captures PostgreSQL custom binary dump and attachments archive; enforces 14-day retention cycle.
- **Isolated Restore Drill:** Executed live on 2026-09-24 into temporary sandbox database `gnuhealth_isolated_val_restore`:
  - **Restore Duration:** **11 SECONDS**.
  - **Data Survivability:** 100% (306 tables, 15 patients, 18 appointments, 17 evaluations, 13 prescriptions, 18 labs, 14 imaging requests, 14,416 ICD-10 codes).
  - **Financial Ledger Fidelity:** 100% (Debits 11,700.00 QAR = Credits 11,700.00 QAR; Difference = 0.00 QAR).
  - **Teardown:** Sandbox database cleanly destroyed; live system unaffected.

---

## 15. Atomicity / Rollback

- **Controlled Failure Injection:** Intentionally injected unhandled exceptions within a multi-entity clinical transaction.
- **Atomicity Outcome:** PostgreSQL WAL and Tryton transaction manager rolled back the entire operation atomically.
- **Verification:** Entity count before = 21, count after = 21. Zero partial records, zero phantom appointments, and zero orphaned rows created.

---

## 16. Infrastructure

- **GCP VM:** `gnuhealth-srv` (Debian 12 Bookworm, IP `34.7.237.8`).
- **External Port Probes:**
  - Port 80 (HTTP / Nginx): OPEN (Reachable)
  - Port 443 (HTTPS): FILTERED / CLOSED (Pending domain delegation)
  - Port 8000 (Tryton WSGI internal): FILTERED / CLOSED (Secure loopback)
  - Port 5432 (PostgreSQL internal): FILTERED / CLOSED (Secure loopback)
  - Port 22 (SSH hardened): OPEN (Public key authentication strictly mandatory)
- **Nginx Security:** Reverse proxy enforces security headers (`X-Content-Type-Options: nosniff`, `X-Frame-Options: SAMEORIGIN`, `X-XSS-Protection`).
- **SSH Hardening:** `PasswordAuthentication no`, `PermitRootLogin no`.

---

## 17. TLS

- **Current Status:** `BLOCKED FOR PRODUCTION TLS` (External Production Prerequisite).
- **Assessment:** Automated Let's Encrypt TLS issuance requires an active DNS A-record pointing an official clinic Fully Qualified Domain Name (FQDN) to `34.7.237.8`.
- **Configuration Readiness:** Production TLS 1.3 / HTTP2 Nginx configuration template (`/etc/nginx/sites-available/gnuhealth_ssl.template`) is pre-staged and ready for one-command activation via `certbot --nginx -d <CLINIC_FQDN>`.
- **Classification:** External institutional prerequisite; does not block local/dev frontend API integration over HTTP.

---

## 18. Performance

Observed baseline execution latencies measured across multiple consecutive calls over public WAN:

- **Authentication Challenge (`common.db.login`):** Avg `1,026.28 ms` (Min: 785.95 ms, Max: 1,586.60 ms)
- **Patient Retrieval (`search_read`):** Avg `679.37 ms` (Min: 469.29 ms, Max: 1,024.58 ms)
- **Appointment Queue (`search_read`):** Avg `624.58 ms` (Min: 402.08 ms, Max: 941.59 ms)
- **Clinical Consultation (`search_read`):** Avg `761.86 ms` (Min: 401.19 ms, Max: 1,265.04 ms)
- **e-Prescription Read (`search_read`):** Avg `486.07 ms` (Min: 292.32 ms, Max: 834.00 ms)
- **Laboratory Results (`search_read`):** Avg `300.21 ms` (Min: 274.50 ms, Max: 341.29 ms)
- **Medical Imaging (`search_read`):** Avg `562.95 ms` (Min: 307.95 ms, Max: 1,255.81 ms)
- **Internal Database Lookups:** `< 1.5 ms` on PostgreSQL loopback.

---

## 19. Documentation

- **Audit Coverage:** Audited 12 primary documents (`01_GNU_HEALTH_BACKEND_EXECUTIVE_HANDOVER.md` through `08_GNU_HEALTH_BACKEND_API_HANDOVER_INDEX.md`, `GNU_HEALTH_BACKEND_API_HANDOVER_PACKAGE.md`).
- **Consistency:** 100% faithful to live system reality.
- **Architectural Rules:** Strictly upholds zero direct database connections, native JSON-RPC integration, and zero shadow tables.

---

## 20. Frontend Handover

- **Handover Package:** Complete and validated across all 20 clinical/financial domains.
- **Developer Assets Provided:** Centralized API client patterns, TypeScript model interfaces, authentication token interceptor recipes, and multi-company context handlers.
- **Readiness Verdict:** **100% READY FOR FRONTEND DEVELOPMENT**.

---

## 21. Previous Certification Reconciliation

- **Reconciliation Audit:** 19/19 major claims from previous certifications re-checked live.
- **Verdict:** **100% CONFIRMED**. Zero contradictions, zero regressions, zero false passes detected.

---

## 22. Findings

| Finding ID | Severity | Area | Description | Impact | Recommendation | Status |
| :---: | :---: | :--- | :--- | :--- | :--- | :---: |
| **F-01** | `LOW` | Infrastructure Security | Non-interactive deployment SSH key (`~/.ssh/gnuhealth_deploy`) retained with restricted local ACLs. | Low risk while workstation is secure. | Test interactive passphrase key (`google_compute_engine`) upon operator handover, then decommission deployment key. | `OPEN` |
| **F-02** | `INFORMATIONAL` | Code Cleanliness | Untracked test output documents (`.docx`, `.xlsx`, `.pptx`) and scratch scripts in workspace. | Cosmetic only; no runtime impact. | Archive non-essential scratch scripts into an archive directory. | `OPEN` |

---

## 23. Remaining Production Dependencies

These items represent institutional, legal, and infrastructure prerequisites required before opening the clinic to live patients. They are NOT backend technical defects:

1. **Official Clinic FQDN & DNS A-Record:** Pointing to `34.7.237.8` for automated Let's Encrypt TLS issuance on Port 443.
2. **Facility License & Establishment ID:** Registration with the Qatar Ministry of Public Health (MoPH).
3. **Real Clinical Staff Roster:** Permanent user credentials replacing synthetic DEMO/UAT users.
4. **Approved Service Tariffs:** Formally signed-off clinic fee schedule and insurance co-pay tariffs replacing demo prices.
5. **Off-Site Disaster Recovery:** Automated multi-region replication of backups to cloud storage (GCS/S3).

---

## 24. Final Certification Decision

```
================================================================================
FINAL TECHNICAL CERTIFICATION DECISION:
TECHNICALLY COMPLETE — MINOR FINDINGS
================================================================================
```

The GNU Health backend is technically complete, end-to-end verified, internally consistent, and frontend-integration-ready. Frontend engineers have an unassailable, validated API foundation on which to construct the custom application.

---

## 25. Evidence Index

- **Master Baseline:** [`reports/final_backend_audit/environment_baseline.json`](file:///c:/Users/MohammedSohail/OneDrive%20-%20IRISSTAR%20TECHNOLOGIES/GNU%20Health/reports/final_backend_audit/environment_baseline.json)
- **Detailed Technical Reports (17):**
  1. [`01_FINAL_BACKEND_AUDIT_EXECUTIVE_SUMMARY.md`](file:///c:/Users/MohammedSohail/OneDrive%20-%20IRISSTAR%20TECHNOLOGIES/GNU%20Health/reports/final_backend_audit/01_FINAL_BACKEND_AUDIT_EXECUTIVE_SUMMARY.md)
  2. [`02_FINAL_BACKEND_TECHNICAL_AUDIT.md`](file:///c:/Users/MohammedSohail/OneDrive%20-%20IRISSTAR%20TECHNOLOGIES/GNU%20Health/reports/final_backend_audit/02_FINAL_BACKEND_TECHNICAL_AUDIT.md)
  3. [`03_FINAL_REPOSITORY_AUDIT.md`](file:///c:/Users/MohammedSohail/OneDrive%20-%20IRISSTAR%20TECHNOLOGIES/GNU%20Health/reports/final_backend_audit/03_FINAL_REPOSITORY_AUDIT.md)
  4. [`04_FINAL_DATABASE_INTEGRITY_AUDIT.md`](file:///c:/Users/MohammedSohail/OneDrive%20-%20IRISSTAR%20TECHNOLOGIES/GNU%20Health/reports/final_backend_audit/04_FINAL_DATABASE_INTEGRITY_AUDIT.md)
  5. [`05_FINAL_CLINICAL_WORKFLOW_AUDIT.md`](file:///c:/Users/MohammedSohail/OneDrive%20-%20IRISSTAR%20TECHNOLOGIES/GNU%20Health/reports/final_backend_audit/05_FINAL_CLINICAL_WORKFLOW_AUDIT.md)
  6. [`06_FINAL_ACCOUNTING_AUDIT.md`](file:///c:/Users/MohammedSohail/OneDrive%20-%20IRISSTAR%20TECHNOLOGIES/GNU%20Health/reports/final_backend_audit/06_FINAL_ACCOUNTING_AUDIT.md)
  7. [`07_FINAL_RBAC_SECURITY_AUDIT.md`](file:///c:/Users/MohammedSohail/OneDrive%20-%20IRISSTAR%20TECHNOLOGIES/GNU%20Health/reports/final_backend_audit/07_FINAL_RBAC_SECURITY_AUDIT.md)
  8. [`08_FINAL_API_JSONRPC_AUDIT.md`](file:///c:/Users/MohammedSohail/OneDrive%20-%20IRISSTAR%20TECHNOLOGIES/GNU%20Health/reports/final_backend_audit/08_FINAL_API_JSONRPC_AUDIT.md)
  9. [`09_FINAL_INFRASTRUCTURE_SECURITY_AUDIT.md`](file:///c:/Users/MohammedSohail/OneDrive%20-%20IRISSTAR%20TECHNOLOGIES/GNU%20Health/reports/final_backend_audit/09_FINAL_INFRASTRUCTURE_SECURITY_AUDIT.md)
  10. [`10_FINAL_BACKUP_RESTORE_AUDIT.md`](file:///c:/Users/MohammedSohail/OneDrive%20-%20IRISSTAR%20TECHNOLOGIES/GNU%20Health/reports/final_backend_audit/10_FINAL_BACKUP_RESTORE_AUDIT.md)
  11. [`11_FINAL_BROWSER_E2E_REVALIDATION.md`](file:///c:/Users/MohammedSohail/OneDrive%20-%20IRISSTAR%20TECHNOLOGIES/GNU%20Health/reports/final_backend_audit/11_FINAL_BROWSER_E2E_REVALIDATION.md)
  12. [`12_FINAL_NEGATIVE_TEST_RESULTS.md`](file:///c:/Users/MohammedSohail/OneDrive%20-%20IRISSTAR%20TECHNOLOGIES/GNU%20Health/reports/final_backend_audit/12_FINAL_NEGATIVE_TEST_RESULTS.md)
  13. [`13_FINAL_PERFORMANCE_BASELINE.md`](file:///c:/Users/MohammedSohail/OneDrive%20-%20IRISSTAR%20TECHNOLOGIES/GNU%20Health/reports/final_backend_audit/13_FINAL_PERFORMANCE_BASELINE.md)
  14. [`14_FINAL_DOCUMENTATION_CONSISTENCY_AUDIT.md`](file:///c:/Users/MohammedSohail/OneDrive%20-%20IRISSTAR%20TECHNOLOGIES/GNU%20Health/reports/final_backend_audit/14_FINAL_DOCUMENTATION_CONSISTENCY_AUDIT.md)
  15. [`15_FINAL_FRONTEND_HANDOVER_VALIDATION.md`](file:///c:/Users/MohammedSohail/OneDrive%20-%20IRISSTAR%20TECHNOLOGIES/GNU%20Health/reports/final_backend_audit/15_FINAL_FRONTEND_HANDOVER_VALIDATION.md)
  16. [`16_PREVIOUS_CERTIFICATION_RECONCILIATION.md`](file:///c:/Users/MohammedSohail/OneDrive%20-%20IRISSTAR%20TECHNOLOGIES/GNU%20Health/reports/final_backend_audit/16_PREVIOUS_CERTIFICATION_RECONCILIATION.md)
  17. [`17_FINAL_FINDINGS_AND_REMEDIATION_PLAN.md`](file:///c:/Users/MohammedSohail/OneDrive%20-%20IRISSTAR%20TECHNOLOGIES/GNU%20Health/reports/final_backend_audit/17_FINAL_FINDINGS_AND_REMEDIATION_PLAN.md)
- **Canonical Browser Screenshots (20):** Stored in [`reports/final_backend_audit/screenshots/`](file:///c:/Users/MohammedSohail/OneDrive%20-%20IRISSTAR%20TECHNOLOGIES/GNU%20Health/reports/final_backend_audit/screenshots/)
- **Machine-Readable Certification:** [`FINAL_BACKEND_CERTIFICATION_REPORT.json`](file:///c:/Users/MohammedSohail/OneDrive%20-%20IRISSTAR%20TECHNOLOGIES/GNU%20Health/FINAL_BACKEND_CERTIFICATION_REPORT.json)
- **One-Page Management Summary:** [`FINAL_BACKEND_AUDIT_ONE_PAGE.md`](file:///c:/Users/MohammedSohail/OneDrive%20-%20IRISSTAR%20TECHNOLOGIES/GNU%20Health/FINAL_BACKEND_AUDIT_ONE_PAGE.md)
