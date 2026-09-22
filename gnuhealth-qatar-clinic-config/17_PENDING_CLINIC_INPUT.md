# 17 — Pending Clinic Input & Action Items

**Document:** `17_PENDING_CLINIC_INPUT.md`  
**Status:** Outstanding operational items required from clinic stakeholders  
**Date:** 2026-09-21

---

## 1. Clinic Legal & Administrative Information

| Information Item | Current Placeholder | Description / Required Source | Impact |
| :--- | :--- | :--- | :--- |
| **Official Clinic Name** | `<CLINIC_NAME>` | Commercial trade name registered in Qatar | System branding & invoice headers |
| **Legal Entity Name** | `<LEGAL_CLINIC_NAME>` | Registered legal corporate name | Financial & tax compliance |
| **Commercial Registration (CR)** | `<PENDING_CLINIC_INPUT>` | Ministry of Commerce and Industry (MOCI) CR Number | Invoices & regulatory audit |
| **MOPH Healthcare Facility License**| `<PENDING_CLINIC_INPUT>` | Ministry of Public Health License Number | Healthcare compliance |
| **Clinic Physical Address** | Zone `<ZONE>`, Street `<STREET>`, Building `<BUILDING>`, City `<CITY>` | Official Qatar Kahramaa / GIS Blue Plate address | Patient directions & billing |
| **Official Phone / Email** | `+974 <PHONE>`, `<EMAIL>` | Reception contact details | Patient appointment alerts |

---

## 2. Staffing & Physician Roster

| Information Item | Current Placeholder | Description / Required Source | Impact |
| :--- | :--- | :--- | :--- |
| **Physician Roster** | `master-data/doctors.yaml` | List of licensed doctors, QCHP License numbers, and specialties | EMR user logins and prescription authority |
| **Consulting Room Assignments** | Room 1, Room 2, etc. | Physical room allocation per physician | Outpatient appointment scheduling |
| **Clinical Staff Names** | `06_USER_ROLE_MATRIX.md` | Staff roster for Reception, Nursing, Lab, Pharmacy, Radiology, Billing | RBAC user accounts creation |

---

## 3. Financial, Commercial & Pricing Data

| Information Item | Current Placeholder | Description / Required Source | Impact |
| :--- | :--- | :--- | :--- |
| **Outpatient Fee Schedule** | `master-data/services.yaml` | Approved cash prices for General/Specialist consultations in QAR | Patient billing & cashier collection |
| **Diagnostic Test Prices** | `master-data/LABORATORY_SERVICE_TEMPLATE.yaml`, `RADIOLOGY_SERVICE_TEMPLATE.yaml` | Prices for Lab and Radiology in QAR | Diagnostic invoicing |
| **Clinic Formulary & Medicine Prices**| `master-data/medicines.yaml` | Approved medicines, brand names, and retail prices | Pharmacy dispensing |
| **Chart of Accounts (COA)** | `14_ACCOUNTING_CONFIGURATION.md` | Certified accounting structure | General Ledger posting |
| **Contracted Insurance Payers / TPAs**| `master-data/insurance.yaml` | List of active insurance networks and direct billing agreements | Insurance claims & copays |
| **Operating Hours Schedule** | `WORKING_HOURS_TEMPLATE.md` | Specific morning/evening shift timings and weekend policy | Appointment calendar rules |
