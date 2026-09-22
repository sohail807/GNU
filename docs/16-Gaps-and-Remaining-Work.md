# 16. Requirements Traceability Matrix & Remaining Work

**Project**: Healthcare Management System — GNU Health Implementation  
**Assessment Date**: 2026-09-21  
**Audit Role**: Senior Software Architect & Healthcare Systems Analyst  
**Document**: `docs/16-Gaps-and-Remaining-Work.md`  
**Classification**: **PRIMARY SYSTEM AUDIT DELIVERABLE**  

---

## 1. Executive Summary

> [!IMPORTANT]
> **Formal Requirements Baseline Declaration**:  
> **NO FORMAL REQUIREMENTS BASELINE IDENTIFIED** prior to this audit.  
> Based on standard outpatient clinic operational scope, native GNU Health 5.0.7 and Tryton 7.0.57 provide the requisite capabilities. No custom development has been identified as necessary for core ambulatory workflows, subject to final clinic stakeholder review and sign-off on specialized third-party integrations (e.g. NPHIES insurance clearinghouse, lab analyzer interfacing).

This comprehensive Requirements Traceability Matrix defines the exact operational, clinical, technical, and regulatory gap between the current GNU Health baseline and a fully licensed, production-ready outpatient clinic system in the State of Qatar.

Every item is backed by live runtime evidence, assigned an objective status, categorized by action type, and prioritized by operational risk.

---

## 2. Priority Classification Rationale

- **`P0 — Critical` (Production Blocker)**: Clinical safety hazard, legal compliance violation (MOPH / QCHP), severe security vulnerability, or hard technical blocker preventing core operations.
- **`P1 — High` (Operational Necessity)**: Essential departmental workflows required for standard outpatient daily operations (e.g. physician consultations, billing, pharmacy dispensing).
- **`P2 — Medium` (Efficiency & Usability)**: Optimizations, bilingual layout customization, and extended ancillary workflows.
- **`P3 — Low` (Future Enhancement)**: Advanced hardware interfacing (DICOM PACS, automated LIS analyzers), SMS reminders.

---

## 3. Comprehensive Requirements Traceability Matrix

| ID | Functional Area | Requirement | Current State | Evidence | Gap | Required Action | Type | Priority | Dependency | Status |
| :---: | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :---: | :--- | :--- |
| **REQ-01** | **Transport Security** | Secure HTTPS encryption (TLS Port 443) with valid certificate | Accessible over plain HTTP (Port 80) | Port 80 response; no TLS cert configured | Cleartext transmission of PHI and credentials violates MOPH standards | Bind clinic domain name, issue TLS certificate, enforce HTTPS 301 redirection | Infrastructure Hardening | **P0** | Domain DNS | `BLOCKED` |
| **REQ-02** | **Credential Security** | Unique, rotated administrative credentials and personal staff logins | Default provisioning admin password remains active | `/home/gnuhealth/admin_password.txt` contains initial string | Unauthorized administrative access risk | Rotate Tryton admin password; provision personal named user accounts | Security Hardening | **P0** | REQ-01 | `SECURITY_REVIEW_REQUIRED` |
| **REQ-03** | **Network Security** | Direct access to internal application daemon blocked | Port 8000 open in GCP VPC firewall to 0.0.0.0/0 | GCP firewall rule `allow-gnuhealth-web` rules=tcp:80,443,8000 | Tryton RPC bypasses Nginx reverse proxy buffering & rate limiting | Update GCP firewall to restrict Port 8000 to localhost; only 80/443 public | Cloud Security | **P0** | None | `SECURITY_REVIEW_REQUIRED` |
| **REQ-04** | **Clinic Legal Identity**| Official MOCI CR and MOPH Healthcare Facility License | Holds placeholder `<CLINIC_NAME>` and `CLINIC-QA` | `party.party` ID 2, `gnuhealth.institution` ID 2 | Legal clinic identity missing from invoices, prescriptions, reports | Ingest official clinic commercial name, CR number, MOPH license code, Blue Plate address | Master Data | **P0** | Clinic Management | `PENDING_CLINIC_INPUT` |
| **REQ-05** | **Fiscal Year & Periods**| Active financial year and accounting periods for General Ledger | 0 fiscal years exist in `account.fiscalyear` | Database query returns 0 records | Tryton strictly blocks posting invoices without an open fiscal period | Accountant opens fiscal year (e.g. FY 2026) and 12 monthly periods | Financial Configuration | **P0** | Accountant Review | `PENDING_ACCOUNTING_APPROVAL` |
| **REQ-06** | **Physician Credentialing**| Licensed practitioners with QCHP credentials and specialties | 0 health professional records exist (test staff purged) | `gnuhealth.healthprofessional` count = 0 | Outpatient consultations cannot be scheduled or signed without doctors | Ingest physician names, user accounts, QCHP licenses, and specialties | Medical Master Data | **P1** | REQ-04, Medical Director | `PENDING_MEDICAL_APPROVAL` |
| **REQ-07** | **Pharmacy Formulary** | QNF-compliant commercial medication formulary | 0 commercial products in `gnuhealth.medicament` | Database count = 0; 94 forms and 47 routes exist | Doctors cannot select commercial medications for e-prescribing | Ingest Qatar National Formulary approved drugs, brands, strengths, and prices | Clinical Master Data | **P1** | Chief Pharmacist | `PENDING_MEDICAL_APPROVAL` |
| **REQ-08** | **Consultation Tariffs**| Official outpatient consultation fee schedule in QAR | 15 preloaded service templates; 0 custom clinic tariffs | `product.product` contains standard services; no clinic fee list | Cannot calculate correct patient charges at reception/checkout | Clinic management approves consultation fee schedule (GP, Specialist, Follow-up) | Business Master Data | **P1** | Clinic Management | `PENDING_CLINIC_INPUT` |
| **REQ-09** | **End-to-End Billing** | Generate customer invoice, collect copay/cash, post receipt in QAR | Invoicing framework configured; zero live invoices posted | `account.invoice` count = 0; 6 journals ready | Billing workflow unverified end-to-end against live General Ledger | Execute test patient invoice, payment collection, and receipt posting in QAR | Workflow Verification | **P1** | REQ-05, REQ-08 | `PENDING_ACCOUNTING_APPROVAL` |
| **REQ-10** | **Health Insurance Payers**| Contracted private health insurance providers and TPAs | Insurance models active; 0 insurance company parties | `gnuhealth.insurance` count = 0 | Insurance copay calculation cannot execute without contracted payers | Ingest approved insurance companies (QLM, Alkoot, Daman, Mednet) & copay policies | Business Master Data | **P1** | Clinic Management | `PENDING_CLINIC_INPUT` |
| **REQ-11** | **Patient Registration**| Outpatient intake, demographics, PUID generation | Verified functional with Qatar prefix (`QAT`) | `country.country` 15 records, `gnuhealth.federation.country.config` ID 1 | 0 operational records (test patient safely purged) | Ingest real patient registrations upon clinical launch | Operational | **P1** | None | `VERIFIED` |
| **REQ-12** | **Appointment Scheduling**| Booking, status workflow, queue prioritization | Fully implemented natively in `gnuhealth.appointment` | Workflow verified; test appointment purged | Live doctor availability schedules required | Ingest doctor clinic hours and consultation room assignments | Operational Setup | **P1** | REQ-06 | `VERIFIED` |
| **REQ-13** | **Clinical OPD Encounter**| History, physical exam, ICD-10 coding, vitals triage | Implemented natively with 14,416 ICD-10 diagnoses | `gnuhealth.pathology` verified; test encounter purged | Real clinical encounter data | Operational use by licensed physicians | Clinical Operation | **P1** | REQ-06 | `VERIFIED` |
| **REQ-14** | **Diagnostic Laboratory**| Lab requisition, specimen tracking, result entry | Implemented natively with 9 preloaded categories | `gnuhealth.lab.test_type` verified; test orders purged | Specific in-house lab test panels and pricing needed | Ingest clinic laboratory test catalog, reference ranges, and QAR fees | Departmental Setup | **P1** | Lab Director | `VERIFIED` |
| **REQ-15** | **Diagnostic Radiology**| Modality requisition, examination logging, report entry | Implemented natively with 8 modalities & CXR test | `gnuhealth.imaging.test` CXR active; test requests purged | Clinic ultrasound/X-ray exam menu and fees needed | Ingest clinic imaging service catalog and pricing | Departmental Setup | **P1** | Radiologist | `VERIFIED` |
| **REQ-16** | **Bilingual Patient Forms**| Arabic/English bilingual printed reports (Rx, invoice, sick leave)| Native Tryton reports render in active session language | Arabic language & RTL layout verified in `ir.lang` | Patient-facing documents standardly require side-by-side Arabic/English | Design and deploy clinic-approved bilingual print templates | Reporting Configuration | **P2** | Clinic Layout Approval | `PARTIALLY_VERIFIED` |
| **REQ-17** | **Physical Room Allocation**| Specific consultation room numbers and triage bays | 8 functional hospital units exist (OPD, Triage, etc.) | `gnuhealth.hospital.unit` IDs 1–8 verified | Room numbers (e.g. Room 101, Bay 2) not assigned | Map physical clinic floorplan to hospital units | Departmental Setup | **P2** | Clinic Operations | `VERIFIED` |
| **REQ-18** | **Transactional Email** | Automated invoice and appointment confirmation email | Not configured in `trytond.conf` | `trytond.conf` lacks SMTP relay settings | Automated email receipts cannot dispatch | Configure SMTP server credentials in `trytond.conf` | Technical Setup | **P2** | Clinic Mail Server | `NOT_SUPPORTED` (Config needed) |
| **REQ-19** | **SMS Patient Reminders**| SMS text reminders prior to scheduled appointment | Not implemented in base installation | No SMS gateway connector in core modules | Manual telephone reminder calls required | Integrate SMS gateway via HTTP webhook or external service | Custom / Integration | **P3** | Telecom Provider | `INTEGRATION_REQUIRED` |
| **REQ-20** | **PACS / DICOM Server** | Direct digital imaging archive and DICOM image viewing | Radiology reports stored as PDF attachments | No DICOM server running on host VM | High-resolution multi-frame DICOM viewing requires external viewer | Procure / deploy Orthanc DICOM server and activate `health_orthanc` | Advanced Integration | **P3** | Radiology Equipment | `OPTIONAL` |

---

## 4. Summary of Critical P0 Blockers

1. **REQ-01 (Transport Security - TLS/HTTPS)**:
   - **Reason for P0**: Exposing patient medical records and credentials over unencrypted HTTP violates Qatar Ministry of Public Health patient confidentiality standards.
2. **REQ-02 (Default Provisioning Password)**:
   - **Reason for P0**: The default Tryton administrative password generated during startup must be rotated before production exposure.
3. **REQ-03 (Exposed Port 8000)**:
   - **Reason for P0**: Direct access to the Tryton application daemon bypasses Nginx reverse proxy filtering and rate limits.
4. **REQ-04 (Legal Clinic Identity)**:
   - **Reason for P0**: Official Commercial Registration (CR) and MOPH license numbers must be present on official medical reports, prescriptions, and financial invoices.
5. **REQ-05 (Fiscal Year & Periods)**:
   - **Reason for P0**: Tryton's accounting engine strictly forbids general ledger postings without an open fiscal year, completely blocking invoice confirmation and cashier checkout.
