# 15. Master Data Architecture & Management

**Project**: Healthcare Management System — GNU Health Implementation  
**Assessment Date**: 2026-09-21  
**Status**: `ONTOLOGIES LOADED — CLINIC MASTER DATA PENDING`  
**Document**: `docs/15-Data-and-Master-Data.md`  

---

## 1. Master Data Overview

Master data in GNU Health comprises two distinct tiers:
1. **Standard International Ontologies**: Preloaded medical dictionaries, terminology systems, and dosage forms.
2. **Clinic Operational Master Data**: Legal identity, practitioner credentials, fee tariffs, commercial medication formularies, and accounting structures.

---

## 2. Preloaded Reference Ontologies Inventory

| Data Domain | Technical Model | Live Count | Description / Standard | Verification |
| :--- | :--- | :---: | :--- | :--- |
| **Pathology / Diagnoses** | `gnuhealth.pathology` | **14,416** | WHO International Classification of Diseases 10th Revision (ICD-10) | `VERIFIED` |
| **Medical Specialties** | `gnuhealth.specialty` | **73** | Standard international medical and surgical specialties (0 duplicates) | `VERIFIED` |
| **Drug Dosage Forms** | `gnuhealth.drug.form` | **94** | Standard dosage administration physical forms (Tablet, Syrup, Injection, etc.) | `VERIFIED` |
| **Drug Routes** | `gnuhealth.drug.route` | **47** | Routes of administration (Oral, IV, IM, SC, Topical, etc.) | `VERIFIED` |
| **Dose Units** | `gnuhealth.dose.unit` | **7** | Standard pharmacological measurement units (mg, g, ml, IU, etc.) | `VERIFIED` |
| **Lab Categories** | `gnuhealth.lab.test_type` | **9** | Clinical pathology categories (Biochemistry, Hematology, Microbiology, etc.) | `VERIFIED` |
| **Imaging Modalities** | `gnuhealth.imaging.test.type` | **8** | Diagnostic imaging modalities (X-Ray, Ultrasound, CT, MRI, etc.) | `VERIFIED` |
| **Service Templates** | `product.product` | **15** | Standard pre-configured medical service products | `VERIFIED` |

---

## 3. Configured Qatar Geopolitical & Organizational Master Data

| Master Data Item | Model | Current Value / Record | Status |
| :--- | :--- | :--- | :--- |
| **Operating Currency** | `currency.currency` | ID 3: `QAR` (Qatari Riyal, `ر.ق`, 2 Decimals, Rounding `0.01`) | `VERIFIED` |
| **Currency Base Rate** | `currency.currency.rate` | ID 2: Rate `1.0000`, Date `2026-09-21` | `VERIFIED` |
| **Host Country** | `country.country` | ID 1: Qatar (`QA`, `QAT`, `634`) | `VERIFIED` |
| **Regional Nationalities**| `country.country` | 14 regional GCC and expatriate countries (AE, SA, KW, OM, BH, EG, IN, PK, PH, etc.) | `VERIFIED` |
| **Federation Account** | `gnuhealth.federation.country.config` | ID 1: Mapped to Qatar (`QAT`) | `VERIFIED` |
| **Clinic Institution** | `gnuhealth.institution` | ID 2: `CLINIC-QA` (Private Outpatient Clinic) | `VERIFIED` (Placeholder Name) |
| **Hospital Subunits** | `gnuhealth.hospital.unit` | 8 Units: OPD, NURS, PHARM, LAB, RAD, BILL, INS, ADMIN | `VERIFIED` |

---

## 4. Pending Clinic Operational Master Data (`PENDING_CLINIC_INPUT`)

The following operational datasets must be provided by clinic leadership before go-live:

1. **Official Legal Identity**: MOCI Commercial Registration (CR), MOPH Healthcare Facility License Number, Blue Plate National Address (Building, Street, Zone).
2. **Practitioner Roster**: Full physician legal names, QCHP professional license IDs, consultation room allocations, and primary specialty assignments.
3. **Commercial Medication Formulary**: List of commercial medications authorized by the Qatar National Formulary (QNF) to populate `gnuhealth.medicament`.
4. **Outpatient Price Schedule**: Official consultation tariffs in QAR (GP consultation, Specialist consult, Follow-up visit, procedure fees).
5. **Contracted Health Insurance Payers**: List of approved private insurance providers and TPAs in Qatar (QLM, Alkoot, Daman, Mednet, etc.) and policy copay rules.
6. **Financial Chart of Accounts**: Review and approval of the clinic general ledger account hierarchy and opening of fiscal year in `account.fiscalyear`.

---

## 5. Master Data Ingestion Worksheets

Structured YAML templates are available in [configuration/master-data/](file:///c:/Users/MohammedSohail/OneDrive%20-%20IRISSTAR%20TECHNOLOGIES/GNU%20Health/configuration/master-data/):
- `doctors.yaml`
- `medicines.yaml`
- `insurance.yaml`
- `LABORATORY_SERVICE_TEMPLATE.yaml`
- `RADIOLOGY_SERVICE_TEMPLATE.yaml`
