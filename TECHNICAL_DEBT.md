# Technical Debt & System Risk Assessment

**Project**: Healthcare Management System — GNU Health Implementation  
**Assessment Date**: 2026-09-21  
**Lead Auditor**: Senior Software Architect & DevOps Lead  
**Document**: `TECHNICAL_DEBT.md`  

---

## 1. Executive Summary

This document categorizes all identified technical debt, architectural risks, deployment weaknesses, and maintainability concerns across the GNU Health implementation. Items are ranked by severity into **Critical**, **High**, **Medium**, and **Low**.

---

## 2. Technical Debt Matrix

### Critical Debt (Production Blockers)

| ID | Domain | Issue Description | Technical Risk | Remediation Action |
| :---: | :--- | :--- | :--- | :--- |
| **TD-01** | **Security / Transport** | Plaintext HTTP (Port 80) web client exposure | Interception of Patient Health Information (PHI) and session tokens in transit | Configure TLS/SSL certificate on Nginx (Port 443) and enforce HTTPS 301 redirection |
| **TD-02** | **Security / Credentials**| Default superuser admin password remains active from initial VM boot | Unauthorized full administrative compromise of database and application | Rotate Tryton admin password via `trytond-admin -c trytond.conf -d gnuhealth -p` |
| **TD-03** | **Network / Firewall** | Port 8000 directly open to `0.0.0.0/0` in GCP VPC firewall rules | Direct public bypass of Nginx reverse proxy rate-limiting and headers | Restrict GCP firewall rule `allow-gnuhealth-web` to ports 80/443; bind port 8000 to localhost |

---

### High Debt (Operational Blockers)

| ID | Domain | Issue Description | Technical Risk | Remediation Action |
| :---: | :--- | :--- | :--- | :--- |
| **TD-04** | **Financial Accounting** | Zero fiscal years or accounting periods configured in `account.fiscalyear` | Invoicing engine strictly blocks posting customer invoices to accounts receivable | Clinic accountant must review Chart of Accounts and open FY 2026 with monthly periods |
| **TD-05** | **Pharmacy Master Data** | Zero commercial pharmaceutical products in `gnuhealth.medicament` | Doctors cannot issue e-prescriptions for real clinical patient encounters | Ingest Qatar National Formulary (QNF) approved commercial drug catalog |
| **TD-06** | **Credential Management**| Provisioning password stored in plaintext at `/home/gnuhealth/admin_password.txt` | Local filesystem credential exposure if VM is inspected | Securely shred `/home/gnuhealth/admin_password.txt` after rotating password |

---

### Medium Debt (Maintainability & Usability)

| ID | Domain | Issue Description | Technical Risk | Remediation Action |
| :---: | :--- | :--- | :--- | :--- |
| **TD-07** | **Reporting / Localization**| Bilingual Arabic/English patient printout templates not customized | Native reports print in active session language; clinic standard requires dual-language | Design and deploy clinic-branded bilingual report templates (Rx, Consultation, Invoice) |
| **TD-08** | **Integration / Email** | SMTP credentials omitted in `trytond.conf` | Application server cannot dispatch automated email receipts or appointment reminders | Configure internal clinic SMTP relay server in `trytond.conf` |
| **TD-09** | **Integration / LIS** | Manual laboratory result entry (no ASTM/HL7 analyzer interface) | Transcription latency and potential data entry error during peak phlebotomy hours | Plan Phase 2 LIS analyzer middleware connection |
| **TD-10** | **Integration / PACS** | Diagnostic imaging reports stored as static PDF attachments | Lacks high-resolution browser-based DICOM multi-frame viewer | Plan Phase 2 Orthanc DICOM server integration |

---

### Low Debt (Minor Cleanups & Optimizations)

| ID | Domain | Issue Description | Technical Risk | Remediation Action |
| :---: | :--- | :--- | :--- | :--- |
| **TD-11** | **Repository Structure** | Prototype deployment script (`deploy_gcp.sh`) previously in root | Developer confusion regarding authoritative provisioning script | Moved to `deployment/archive/deploy_gcp_prototype.sh` |
| **TD-12** | **Redundant Artifacts** | Base64-encoded startup script (`startup_b64.txt`) in root | Redundant file clutter | Backed up to `backup/` and purged from root |
| **TD-13** | **Automated Backups** | Daily database backup cron not yet active on host VM | Risk of data loss in catastrophic VM failure if manual backup missed | Deploy `/etc/cron.d/gnuhealth_backup` script to host VM |
