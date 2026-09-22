# PRODUCTION GO-LIVE CHECKLIST & GATING SPECIFICATION

**Project**: GNU Health HMIS 5.0 / Tryton 7.0 Implementation  
**Document**: `GO_LIVE_CHECKLIST.md`  
**Classification**: Formal Gating & Go/No-Go Decision Matrix  
**Scope**: Primary Outpatient & Ambulatory Healthcare Facility (State of Qatar)  
**Status**: ACTIVE GATING CHECKLIST — SYSTEM IS CURRENTLY NO-GO  

---

## 1. Governance Rules for Production Authorization

> [!CAUTION]
> **MANDATORY PRODUCTION GO-LIVE RULE**:  
> The system **MAY NOT BE DECLARED PRODUCTION-READY** and patient health operations **MAY NOT COMMENCE** until every single mandatory item in this checklist is explicitly marked **PASS** with verifiable evidence, and all four department executives (Clinical, Finance, Operations, Technical) sign the final authorization block.

---

## 2. Comprehensive Gating Checklist

### 2.1 Security & Infrastructure Gates (`MANDATORY BLOCKERS`)
| Gate ID | Verification Item | Target Standard | Current Status | Verifier / Evidence | Pass / Fail |
| :---: | :--- | :--- | :---: | :--- | :---: |
| **GATE-SEC-01** | Admin Credential Rotation | Tryton `admin` default password rotated to 24-char enterprise passphrase; old credential invalidated | `CREDENTIAL ROTATION REQUIRED` | Terminal log of `trytond-admin -p` | **[ ] PASS** |
| **GATE-SEC-02** | Transport Encryption (HTTPS) | Valid TLS 1.2+ certificate installed on Nginx Port 443 (TLS 1.3 preferred where supported); HTTP Port 80 redirects to HTTPS | `CONFIGURATION REQUIRED` | SSL Labs Report / Curl `https://` test | **[ ] PASS** |
| **GATE-SEC-03** | GCP Firewall Hardening | Port 8000 closed to external public in GCP VPC; Tryton daemon listens strictly on `127.0.0.1:8000` | `CONFIGURATION REQUIRED` | GCP firewall rule inspection | **[ ] PASS** |
| **GATE-SEC-04** | Secrets Protection | `/home/gnuhealth/trytond.conf` owned by `gnuhealth:gnuhealth` with `chmod 600` permissions | `VERIFIED` | `ls -la /home/gnuhealth/trytond.conf` | **[ ] PASS** |
| **GATE-SEC-05** | Backup Automation | Daily automated cron for `backup_gnuhealth.sh` at 02:00 AST active; offsite sync enabled | `CONFIGURATION REQUIRED` | `crontab -l` inspection | **[ ] PASS** |

---

### 2.2 Organization & Master Data Gates
| Gate ID | Verification Item | Target Standard | Current Status | Verifier / Evidence | Pass / Fail |
| :---: | :--- | :--- | :---: | :--- | :---: |
| **GATE-ORG-01** | Legal Clinic Data | Official Trade Name, Commercial Registration (CR), and MoPH License recorded in `party.party` and `gnuhealth.institution` | `MASTER DATA REQUIRED` | Database query on `party.party` ID 2 | **[ ] PASS** |
| **GATE-ORG-02** | Institution & Units | Healthcare Institution `CLINIC-QA` with departments | 8 configured hospital units/departments identified in the current database. Operational workflow validation remains pending. | Verified live count = 8 units | **[ ] PASS** |
| **GATE-ORG-03** | Operating Schedule | Clinic shift hours (Sat–Thu, Fri) approved by management and mapped to appointment calendars | `BUSINESS APPROVAL REQUIRED` | Management sign-off sheet | **[ ] PASS** |

---

### 2.3 Staff & Role Provisioning Gates
| Gate ID | Verification Item | Target Standard | Current Status | Verifier / Evidence | Pass / Fail |
| :---: | :--- | :--- | :---: | :--- | :---: |
| **GATE-STF-01** | Doctor Onboarding | All practicing physicians registered in `gnuhealth.healthprofessional` with active appointments | `MASTER DATA REQUIRED` | Count of `healthprofessional` $> 0$ | **[ ] PASS** |
| **GATE-STF-02** | QCHP License Verification | Valid Qatar QCHP license numbers entered in `license_number` for all practicing doctors | `MASTER DATA REQUIRED` | QCHP registry audit log | **[ ] PASS** |
| **GATE-STF-03** | Named Staff Accounts | Individual named accounts created in `res.user` for all operational staff; generic accounts absent | `MASTER DATA REQUIRED` | Query of `res.user` | **[ ] PASS** |
| **GATE-STF-04** | Role Permissions Tested | Security group mappings verified; demo accounts verified disabled (`active = False`) | `VERIFIED` | RBAC test report | **[x] PASS** |

---

### 2.4 Clinical Workflow Gates
| Gate ID | Verification Item | Target Standard | Current Status | Verifier / Evidence | Pass / Fail |
| :---: | :--- | :--- | :---: | :--- | :---: |
| **GATE-CLN-01** | Patient Registration | UAT-001 passed; PUID generated with `QAT` prefix; 11-digit QID validated | `TESTING REQUIRED` | UAT-001 test report | **[ ] PASS** |
| **GATE-CLN-02** | Appointment Scheduling | UAT-003 and UAT-004 passed; scheduled and walk-in appointments queue properly | `TESTING REQUIRED` | UAT-003/004 test report | **[ ] PASS** |
| **GATE-CLN-03** | Nursing Triage | UAT-005 passed; multi-parameter vitals recorded; BMI calculated accurately | `TESTING REQUIRED` | UAT-005 test report | **[ ] PASS** |
| **GATE-CLN-04** | Doctor Consultation | UAT-006 passed; SOAP notes, physical exam, and ICD-10 coding operational | `TESTING REQUIRED` | UAT-006 test report | **[ ] PASS** |
| **GATE-CLN-05** | EHR Immutability | Signed medical evaluations permanently locked against deletion (`perm_delete = False`) | `VERIFIED` | Model inspection verified | **[x] PASS** |
| **GATE-CLN-06** | E-Prescribing & Safety | UAT-007 passed; drug-allergy and pregnancy warnings triggered accurately | `TESTING REQUIRED` | UAT-007 test report | **[ ] PASS** |
| **GATE-CLN-07** | Diagnostic Orders | UAT-009 (Lab) and UAT-010 (Radiology) requisitions and verified result workflows passed | `TESTING REQUIRED` | UAT-009/010 test reports | **[ ] PASS** |

---

### 2.5 Pharmacy & Dispensary Gates
| Gate ID | Verification Item | Target Standard | Current Status | Verifier / Evidence | Pass / Fail |
| :---: | :--- | :--- | :---: | :--- | :---: |
| **GATE-PHR-01** | Formulary Approved | QNF-compliant commercial medications ingested in `gnuhealth.medicament` with forms and routes | `MEDICAL APPROVAL REQUIRED` | Count of `medicament` $> 0$ | **[ ] PASS** |
| **GATE-PHR-02** | Inventory Configured | Dispensary stock location configured; initial stock loaded with lot/batch numbers and expiry | `CONFIGURATION REQUIRED` | Stock balance report | **[ ] PASS** |
| **GATE-PHR-03** | Dispensing Tested | UAT-008 passed; medication dispensing deducts inventory and triggers billing line | `TESTING REQUIRED` | UAT-008 test report | **[ ] PASS** |

---

### 2.6 Finance & Billing Gates (`MANDATORY BLOCKERS`)
| Gate ID | Verification Item | Target Standard | Current Status | Verifier / Evidence | Pass / Fail |
| :---: | :--- | :--- | :---: | :--- | :---: |
| **GATE-FIN-01** | Fiscal Year Opened | FY2026 and 12 monthly periods created and in `open` state in `account.fiscalyear` | `ACCOUNTING APPROVAL REQUIRED` | Count of `account.fiscalyear` $= 1$ | **[ ] PASS** |
| **GATE-FIN-02** | Chart of Accounts Signed | Clinic Chart of Accounts approved and linked to company default accounts | `ACCOUNTING APPROVAL REQUIRED` | Signed Chart of Accounts document | **[ ] PASS** |
| **GATE-FIN-03** | Services Priced in QAR | All active clinical services in `product.product` populated with approved non-zero prices | `BUSINESS APPROVAL REQUIRED` | Query showing 0 blank prices | **[ ] PASS** |
| **GATE-FIN-04** | Invoicing Tested | UAT-011 passed; consolidated patient invoice confirms and posts to General Ledger | `TESTING REQUIRED` | Posted invoice in `account.invoice` | **[ ] PASS** |
| **GATE-FIN-05** | Cash & Card Payments | UAT-011 (Cash) and UAT-012 (Card POS) payments post to respective journals | `TESTING REQUIRED` | Posted moves in `account.move` | **[ ] PASS** |
| **GATE-FIN-06** | Official Printed Receipt | Cashier receipt template renders clinic legal name, CR number, service breakdown, and QAR total | `BUSINESS APPROVAL REQUIRED` | Printed sample receipt scan | **[ ] PASS** |

---

### 2.7 Health Insurance Gates
| Gate ID | Verification Item | Target Standard | Current Status | Verifier / Evidence | Pass / Fail |
| :---: | :--- | :--- | :---: | :--- | :---: |
| **GATE-INS-01** | Payers Configured | Contracted private health insurance providers created as parties in `gnuhealth.insurance` | `MASTER DATA REQUIRED` | Insurer party list query | **[ ] PASS** |
| **GATE-INS-02** | Insurance Split Tested | UAT-013 passed; 20% patient copay collected at cashier and 80% booked to insurer receivable | `TESTING REQUIRED` | UAT-013 test report | **[ ] PASS** |
| **GATE-INS-03** | External Clearinghouse | If electronic clearinghouse mandated, integration validated; if not, manual claim export verified | `VERIFIED / MANUAL BASELINE`| Exported monthly claim batch report | **[ ] PASS** |

---

### 2.8 Quality Assurance & Operational Gates
| Gate ID | Verification Item | Target Standard | Current Status | Verifier / Evidence | Pass / Fail |
| :---: | :--- | :--- | :---: | :--- | :---: |
| **GATE-QA-01** | Full UAT Execution | All 17 UAT scenarios executed; all P0/P1 scenarios marked PASS | `TESTING REQUIRED` | Signed `MASTER_UAT_PLAN.md` | **[ ] PASS** |
| **GATE-QA-02** | Zero Critical Defects | Zero Severity 1 (Blocker) and zero Severity 2 (High) defects open | `TESTING REQUIRED` | Defect tracking log | **[ ] PASS** |
| **GATE-QA-03** | Disaster Recovery Test | UAT-017 passed; database backup restored to test instance without data loss | `TESTING REQUIRED` | Restoration terminal log | **[ ] PASS** |
| **GATE-QA-04** | Test Data Purged | All synthetic test patient records from UAT safely purged via ORM; database clean | `VERIFIED CLEAN BASELINE` | Query showing 0 test records | **[ ] PASS** |
| **GATE-QA-05** | Staff Training Certified | All operational receptionists, nurses, doctors, and cashiers completed training | `OPERATIONAL_READINESS` | Training attendance records | **[ ] PASS** |

---

## 3. Executive Go-Live Authorization Block

```text
========================================================================================
FINAL PRODUCTION GO-LIVE SIGN-OFF
========================================================================================
We, the undersigned executive leads, hereby certify that all mandatory gates above have 
been independently verified and satisfy the standards required for clinical operations.

1. Clinical Lead / Medical Director:
   Name:      ________________________________________
   Signature: ________________________________________   Date: ________________________

2. Finance Lead / Chief Financial Officer:
   Name:      ________________________________________
   Signature: ________________________________________   Date: ________________________

3. Operations Manager / Clinic Director:
   Name:      ________________________________________
   Signature: ________________________________________   Date: ________________________

4. Technical Lead / System Administrator:
   Name:      ________________________________________
   Signature: ________________________________________   Date: ________________________

========================================================================================
SYSTEM GO-LIVE VERDICT:  [  ] AUTHORIZED FOR PRODUCTION     [  ] REJECTED / GATES PENDING
========================================================================================
```
