# IMPLEMENTATION MASTER STATUS (SINGLE SOURCE OF TRUTH)

**Project**: GNU Health HMIS 5.0 / Tryton 7.0 Implementation  
**Document**: `IMPLEMENTATION_MASTER_STATUS.md`  
**Classification**: Authoritative System Implementation Status  
**Scope**: Primary Outpatient & Ambulatory Healthcare Facility (State of Qatar)  
**Host Target**: GCP Compute Engine `gnuhealth-srv` (APPLICATION SERVER / PRODUCTION HOST)  
**Status**: ACTIVE LIVING DOCUMENT — SINGLE OPERATIONAL SOURCE OF TRUTH  

---

## 1. Executive Summary & Status Overview

This document represents the single authoritative operational status record for the entire implementation. All project reporting, defect management, and milestone gating must reference this file directly.

- **Overall System State**: `CONFIGURATION BASELINE VERIFIED — PRODUCTION GATED ON SECURITY, FISCAL SETUP & MASTER DATA`
- **Production Go-Live Verdict**: `CONDITIONAL NO-GO` (Ready for UAT and Master Data Ingestion; Gated for live production)
- **Active Native Modules**: 24 Tryton / GNU Health modules installed and running on Debian 12.
- **Custom Modules in Runtime**: 0 (upstream native GNU Health / Tryton architecture).
- **Critical Production Blockers**: 4 (TLS Port 443 Encryption, Admin Password & Port 8000 Firewall, Open Accounting Fiscal Year, Legitimate Master Data Ingestion).

---

## 2. Authoritative Implementation Status Table

| ID | Requirement Area | Current State | Action | Owner | Dependency | Priority | Status | Evidence |
| :---: | :--- | :--- | :--- | :--- | :--- | :---: | :--- | :--- |
| **STA-01** | **Cloud Host & OS** | Debian 12 (Bookworm x86_64, Linux 6.1) on GCP VM | Maintain OS patches | DevOps Engineer | GCP Account | P0 | `VERIFIED` | VM `gnuhealth-srv` active on APPLICATION SERVER / PRODUCTION HOST |
| **STA-02** | **Application Server**| Tryton Server 7.0.57 in Python 3.11 virtualenv | Maintain systemd daemon | System Admin | Python 3.11 | P0 | `VERIFIED` | `gnuhealth.service` active and running |
| **STA-03** | **Database Engine** | PostgreSQL 15.15 on local Unix socket | Maintain daily backups | Database Admin | Debian 12 | P0 | `VERIFIED` | Postgres 15 listening on socket |
| **STA-04** | **Admin Credentials** | Compromised default provisioning password active | Rotate to 24-char enterprise passphrase | System Admin | None | P0 | `CREDENTIAL ROTATION REQUIRED` | `/home/gnuhealth/admin_password.txt` must be shredded |
| **STA-05** | **Transport Security** | Accessible over unencrypted HTTP Port 80 | Install TLS 1.3 cert on Nginx Port 443 | DevOps Engineer | Domain DNS | P0 | `CONFIGURATION REQUIRED` | Nginx currently responding on Port 80 |
| **STA-06** | **GCP Firewall** | Port 8000 open to public internet (0.0.0.0/0) | Restrict Port 8000 to localhost in VPC | Cloud Engineer | None | P0 | `CONFIGURATION REQUIRED` | GCP firewall rule `allow-gnuhealth-web` |
| **STA-07** | **Qatar Currency** | QAR currency active (ID: 3, Symbol: `ر.ق`, 2 Dec) | None required | Finance Lead | None | P0 | `VERIFIED` | Live query returns `currency.currency` ID 3 |
| **STA-08** | **Clinic Organization**| Holds placeholder `<CLINIC_NAME>` and `CLINIC-QA`| Ingest official clinic legal name and CR | Operations Lead | Clinic Input | P0 | `MASTER DATA REQUIRED` | `party.party` ID 2 contains placeholder |
| **STA-09** | **Hospital Units** | 8 configured hospital units/departments | Operational workflow validation pending | Operations Lead | None | P1 | `EXISTING / VERIFIED — OPERATIONAL VALIDATION PENDING` | 8 configured hospital units/departments identified in the current database. Operational workflow validation remains pending. |
| **STA-10** | **Medical Specialties**| 73 international specialties preloaded | None required | Clinical Lead | None | P1 | `VERIFIED` | Live query returns 73 `gnuhealth.specialty` |
| **STA-11** | **ICD-10 Diagnoses** | 14,416 WHO ICD-10 pathology codes preloaded | None required | Clinical Lead | None | P0 | `VERIFIED` | Live query returns 14,416 `gnuhealth.pathology` |
| **STA-12** | **Doctor Roster** | 0 physicians registered in system | Ingest doctors with QCHP license numbers | Operations Lead | Medical Lead | P0 | `MASTER DATA REQUIRED` | Live query returns 0 `healthprofessional` |
| **STA-13** | **Staff User Accounts**| 1 active admin user; 7 demo users disabled | Provision individual named staff logins | System Admin | Staff List | P1 | `MASTER DATA REQUIRED` | Live query on `res.user` (8 inactive, 1 active) |
| **STA-14** | **Patient Registry** | Clean operational state (0 patient records) | Ready for live patient registration | Reception Lead | None | P1 | `VERIFIED CLEAN` | Live query returns 0 `gnuhealth.patient` |
| **STA-15** | **Appointments** | Framework ready; 0 appointments booked | Book appointments once doctors onboarded | Reception Lead | STA-12 | P1 | `TESTING REQUIRED` | Live query returns 0 `gnuhealth.appointment` |
| **STA-16** | **Nursing Triage** | Vitals form ready; BMI auto-calc verified | Execute UAT-005 triage test | Nursing Lead | None | P1 | `TESTING REQUIRED` | Live query returns 0 `patient.rounding` |
| **STA-17** | **Doctor Consultation**| SOAP charting & ICD-10 coding verified ready | Execute UAT-006 consultation test | Clinical Lead | STA-12 | P1 | `TESTING REQUIRED` | Live query returns 0 `patient.evaluation` |
| **STA-18** | **EHR Immutability** | `perm_delete = False` enforced on evaluations | None required | Clinical Lead | None | P0 | `VERIFIED` | Tryton ORM model rule enforced |
| **STA-19** | **Pharmacy Prescribing**| Drug forms (94) & routes (47) loaded; 0 medicines| Ingest commercial medication formulary | Chief Pharmacist| Medical Lead | P1 | `MEDICAL APPROVAL REQUIRED` | Live query returns 0 `gnuhealth.medicament` |
| **STA-20** | **Pharmacy Inventory** | Dispensary stock location pending configuration | Configure stock location & initial batch | Chief Pharmacist| STA-19 | P1 | `CONFIGURATION REQUIRED` | Dispensary stock empty |
| **STA-21** | **Laboratory Setup** | 9 lab categories loaded; 0 test requests | Ingest lab test catalog and normal ranges | Lab Lead | None | P1 | `MASTER DATA REQUIRED` | Live query returns 9 `gnuhealth.lab.test_type` |
| **STA-22** | **Radiology Setup** | 8 modalities loaded; CXR active; 0 requests | Ingest radiology catalog and pricing | Radiology Lead | None | P1 | `MASTER DATA REQUIRED` | Live query returns 8 `imaging.test.type` |
| **STA-23** | **Service Price Lists**| 15 clinical services loaded with 0.00 QAR prices | Approve and set official outpatient fees | Clinic Manager | Finance Lead | P0 | `EXISTING SERVICE STUBS — TARIFF CONFIGURATION PENDING` | Live query returns 15 `product.product` (0.00 QAR)|
| **STA-24** | **Fiscal Year Setup** | **0 fiscal years open in `account.fiscalyear`** | Open FY2026 and 12 monthly periods | Finance Lead | Chief Acct | P0 | `BLOCKED` | Live query returns 0 `account.fiscalyear` |
| **STA-25** | **Chart of Accounts** | Minimal chart (7 accounts) configured | Review and adopt outpatient chart | Finance Lead | None | P0 | `ACCOUNTING APPROVAL REQUIRED`| Live query returns 7 `account.account` |
| **STA-26** | **Patient Invoicing** | Framework configured; 0 customer invoices | Blocked by missing fiscal year | Billing Lead | STA-24, STA-23 | P0 | `BLOCKED` | Live query returns 0 `account.invoice` |
| **STA-27** | **Cashier Receipting** | Cash and Card journals ready; 0 payments | Execute test payment once fiscal year open | Billing Lead | STA-24 | P1 | `TESTING REQUIRED` | Live query returns 0 `account.move` |
| **STA-28** | **Health Insurance** | Insurance models active; 0 payer parties | Ingest contracted insurance payers | Insurance Lead | Clinic Input | P1 | `MASTER DATA REQUIRED` | Live query returns 0 `gnuhealth.insurance` |
| **STA-29** | **Automated Backups** | Script exists; automated daily cron pending | Enable daily cron in crontab at 02:00 AST | System Admin | None | P1 | `CONFIGURATION REQUIRED` | `backup_gnuhealth.sh` present on disk |
| **STA-30** | **End-to-End UAT** | Test plan defined across 17 scenarios | Execute full UAT with clinic staff | QA Lead | All Leads | P0 | `TESTING REQUIRED` | `MASTER_UAT_PLAN.md` approved |
| **STA-31** | **Staff Training** | Role matrix and permissions defined | Conduct role-specific hands-on training | Operations Lead | All Leads | P1 | `OPERATIONAL_READINESS` | `USER_ROLE_IMPLEMENTATION_PLAN.md` ready |
| **STA-32** | **Production Go-Live**| Blocked on 4 mandatory gates | Convene gating committee after UAT | Executive Leads | All Gates | P0 | `BLOCKED` | `GO_LIVE_CHECKLIST.md` active |
