# 10. Security & Role-Based Access Control (RBAC)

**Project**: Healthcare Management System — GNU Health Implementation  
**Assessment Date**: 2026-09-21  
**Status**: `SECURITY_REVIEW_REQUIRED — HARDENING PENDING`  
**Document**: `docs/10-Security-and-Roles.md`  

---

## 1. Executive Summary

This document specifies the security architecture, Role-Based Access Control (RBAC) matrix, electronic medical record immutability rules, and mandatory pre-production infrastructure hardening tasks.

---

## 2. Tryton Security Groups (28 Groups)

Tryton manages permissions through 28 distinct functional groups in `res.group`:

### A. Administrative Roles
- `Administration` (ID: 1): Complete system configuration and module management.
- `Company Administration` (ID: 4): Company parameters and organizational structure.
- `Currency Administration` (ID: 2): Currency definition and exchange rate management.
- `Party Administration` (ID: 3): Master party records and institutional entities.
- `Health Administration` (ID: 11): Healthcare service catalogs and clinic configuration.

### B. Clinical Roles
- `Health Doctor` (ID: 15): Clinical evaluations, diagnoses, and e-prescriptions.
- `Health Nurse` (ID: 13): Nursing assessments, triage, and vital signs monitoring.
- `Health Front Desk` (ID: 14): Patient registration, appointments, and queue check-in.
- `Health Back Office` (ID: 17): Medical records archiving and demographic audits.

### C. Ancillary & Departmental Roles
- `Health Lab` (ID: 23) & `Health lab Administration` (ID: 22): Laboratory testing and pathology results.
- `Health Imaging` (ID: 20) & `Health Imaging Administration` (ID: 21): Radiology procedures and imaging reports.
- `Account` (ID: 6) & `Account Administration` (ID: 8): Customer invoicing, cashier receipts, and general ledger.

---

## 3. Least-Privilege Outpatient Role Matrix

| User Operational Role | Assigned Tryton Security Groups | Allowed Clinical / Financial Actions | Restricted Actions |
| :--- | :--- | :--- | :--- |
| **Receptionist / Front Desk** | `Health Front Desk`, `Party Administration` | Create/update patient demographics, book appointments, check-in patients | Cannot view clinical notes, vitals, or lab results |
| **Triage Nurse** | `Health Nurse`, `Health Front Desk` | View appointment queue, record vital signs, document nursing triage | Cannot prescribe medications or sign medical consultations |
| **Attending Physician** | `Health Doctor`, `Health Services Administration` | Conduct consultations, code ICD-10 diagnoses, order labs/imaging, issue e-prescriptions | Cannot modify financial ledgers or delete patient records |
| **Pharmacist** | `Health Doctor` (Dispense view), `Product Administration` | Review e-prescriptions, verify drug safety, mark medications dispensed | Cannot alter clinical diagnosis or consultation notes |
| **Laboratory Technician** | `Health Lab` | Receive lab orders, record test results against reference ranges | Cannot prescribe medications or view financial invoices |
| **Radiographer** | `Health Imaging` | Log imaging procedures, enter technical notes, attach radiology findings | Cannot modify physician progress notes |
| **Cashier / Billing Clerk** | `Account`, `Health Services Administration` | Issue customer invoices in QAR, collect cash/card copays, print receipts | Cannot view medical diagnoses or clinical history |
| **IT Systems Administrator** | `Administration`, `Health Administration` | User provisioning, role assignment, backups, technical configuration | Subject to ethical access controls; no clinical alteration |

---

## 4. EHR Legal Immutability & Access Rules

- **Medical Record Immutability**: Under GNU Health access rules (`ir.model.access` Record ID: 152), patient consultation records (`gnuhealth.patient.evaluation`) enforce `perm_delete = False` across all user roles.
- Once signed by an attending physician, an encounter cannot be altered or purged. Any clinical correction must be appended as a new addendum note, satisfying legal healthcare compliance requirements.

---

## 5. Security Findings & Pre-Production Hardening

> [!CAUTION]
> **Mandatory Security Actions Prior to Clinical Service**:
> 1. **Transport Encryption (HTTPS)**: Web traffic currently traverses unencrypted HTTP on port 80 (`http://34.7.237.8`). An official domain must be bound and a TLS certificate installed on Nginx (Port 443) with mandatory HTTPS redirection.
> 2. **Superuser Password Rotation**: The initial provisioning password for user `admin` must be rotated via `trytond-admin -c trytond.conf -d gnuhealth -p`.
> 3. **Firewall Hardening**: Direct public internet access to Tryton daemon port 8000 must be closed in GCP firewall rules (`allow-gnuhealth-web`), restricting ingress exclusively to Ports 80 and 443.
> 4. **Named Staff Accounts**: Dedicated user logins must be provisioned for each individual employee; shared administrative logins are strictly forbidden in production.
