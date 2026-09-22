# 05 — Master Data Inventory: Qatar Outpatient Clinic

**Document:** `05_MASTER_DATA_INVENTORY.md`  
**Status:** Live Database State Verified via Tryton JSON-RPC  
**Date:** 2026-09-21

---

## 1. Master Data Inventory Table

| Domain | Master Data Entity | Technical Model | Status | Count | Source | Verified |
| :--- | :--- | :--- | :---: | :---: | :--- | :---: |
| **Organization** | Clinic Organization | `party.party` | `CONFIGURED` | 1 | Configured Placeholder (`<CLINIC_NAME>`) | Yes |
| **Organization** | Company | `company.company` | `CONFIGURED` | 1 | Linked to Clinic Party (QAR, Asia/Qatar) | Yes |
| **Organization** | Health Institution | `gnuhealth.institution` | `CONFIGURED` | 1 | Private Outpatient Clinic (`CLINIC-QA`) | Yes |
| **Department** | Hospital Units | `gnuhealth.hospital.unit` | `CONFIGURED` | 8 | Native Outpatient Departments (OPD, etc.)| Yes |
| **Currency** | Qatari Riyal | `currency.currency` | `CONFIGURED` | 1 | QAR (ر.ق, digits 2, rounding 0.01) | Yes |
| **Country** | Qatar & Nationalities | `country.country` | `CONFIGURED` | 15 | Qatar (QA) + 14 Common Nationalities | Yes |
| **Language** | English & Arabic | `ir.lang` | `CONFIGURED` | 2 | `en` (Active) / `ar` (Active, RTL) | Yes |
| **Timezone** | System / Company | `company.company` | `CONFIGURED` | 1 | `Asia/Qatar` | Yes |
| **User** | System Users | `res.user` | `CONFIGURED` | 1 Active | `admin` (Linked to Company 2) | Yes |
| **User** | User Roles | `res.group` | `VERIFIED` | 28 | Native GNU Health / Tryton Roles | Yes |
| **Specialty** | Medical Specialties | `gnuhealth.specialty` | `VERIFIED` | 73 | Preloaded International Specialties | Yes |
| **Diagnosis** | WHO ICD-10 Coding | `gnuhealth.pathology` | `VERIFIED` | 14,416| Preloaded WHO ICD-10 Full Dataset | Yes |
| **Doctor** | Attending Physicians | `gnuhealth.healthprofessional`| `PENDING_CLINIC_INPUT`| 0 Prod | Template in `master-data/doctors.yaml` | Yes (Test HP: 1) |
| **Service** | Billable Services | `product.product` | `CONFIGURED` | 15 | Preloaded Service Templates | Yes |
| **Radiology** | Imaging Modalities | `gnuhealth.imaging.test.type`| `VERIFIED` | 8 | XR, US, CT, MR, XA, DX, CR, PT | Yes |
| **Radiology** | Imaging Studies | `gnuhealth.imaging.test` | `CONFIGURED` | 1 | Chest X-Ray (CXR) linked to XR product | Yes |
| **Laboratory** | Test Categories | `gnuhealth.lab.test_type` | `VERIFIED` | 9 | CBC, LFT, RFT, UA, SE, EGY, etc. | Yes |
| **Medicine** | Drug Forms | `gnuhealth.drug.form` | `VERIFIED` | 94 | Tablets, Capsules, Creams, Inhalers, etc.| Yes |
| **Medicine** | Drug Routes | `gnuhealth.drug.route` | `VERIFIED` | 47 | Oral, Topical, IV, IM, Inhalation, etc. | Yes |
| **Medicine** | Dose Units | `gnuhealth.dose.unit` | `VERIFIED` | 7 | mg, mL, L, kg, mmol, ug, unit | Yes |
| **Medicine** | Formulary Products | `gnuhealth.medicament` | `PENDING_CLINIC_INPUT`| 0 Prod | Template in `master-data/medicines.yaml` | Yes |
| **Insurance** | Payer Framework | `gnuhealth.insurance` | `PENDING_CLINIC_INPUT`| 0 Prod | Template in `master-data/insurance.yaml` | Yes |
| **Accounting** | Journals | `account.journal` | `CONFIGURED` | 6 | REV, EXP, CASH, STO, MISC, EXC | Yes |
| **Accounting** | Chart of Accounts | `account.account` | `PENDING_ACCOUNTING_APPROVAL`| 0 Prod | Awaiting Clinic Financial Sign-Off | Yes |

---

## 2. Inventory Assessment

The baseline GNU Health configuration provides a complete clinical, operational, and organizational skeleton. Operational master data that depends on official clinic documentation (staff licenses, official prices, insurance contracts) is prepared in structured templates and marked `PENDING_CLINIC_INPUT`.
