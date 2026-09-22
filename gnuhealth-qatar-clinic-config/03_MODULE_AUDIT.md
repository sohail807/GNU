# 03 — Tryton & GNU Health Module Audit

**Document:** `03_MODULE_AUDIT.md`  
**Database:** `gnuhealth`  
**Total Registered Modules:** 24  
**Total Activated Modules:** 24  
**Status:** `VERIFIED`

---

## 1. Activated Module Inventory

| Module Name | Version | Source | Functional Role in Outpatient Clinic | Status |
| :--- | :---: | :--- | :--- | :---: |
| **`ir`** | 7.0.x | Tryton Core | System models, sequences, views, actions, translations | `VERIFIED` |
| **`res`** | 7.0.x | Tryton Core | Users, security groups, access control lists (ACL) | `VERIFIED` |
| **`party`** | 7.0.7 | Tryton Core | Patient, doctor, staff, and institutional party records | `VERIFIED` |
| **`company`** | 7.0.4 | Tryton Core | Clinic multi-company, currency, and timezone context | `VERIFIED` |
| **`currency`** | 7.0.1 | Tryton Core | Multi-currency management, Qatari Riyal (QAR) definition | `VERIFIED` |
| **`country`** | 7.0.1 | Tryton Core | Country, subdivisions, ISO 3166 Qatar national data | `VERIFIED` |
| **`product`** | 7.0.6 | Tryton Core | Products, services, unit of measures | `VERIFIED` |
| **`account`** | 7.0.28 | Tryton Financial | Core general ledger, journals, chart of accounts | `VERIFIED` |
| **`account_product`**| 7.0.3 | Tryton Financial | Revenue and expense account mapping for clinic products | `VERIFIED` |
| **`account_invoice`**| 7.0.18 | Tryton Financial | Outpatient patient and insurance billing and payments | `VERIFIED` |
| **`health`** | 5.0.6 | GNU Health Core | Core EMR, patients, doctors, institutions, appointments | `VERIFIED` |
| **`health_services`**| 5.0.4 | GNU Health Core | Integration of clinical encounters with financial invoicing | `VERIFIED` |
| **`health_icd10`** | 5.0.4 | GNU Health Core | WHO ICD-10 clinical diagnosis classification (14,416 records)| `VERIFIED` |
| **`health_nursing`** | 5.0.4 | GNU Health Core | Ambulatory care, nursing triage, patient roundings | `VERIFIED` |
| **`health_lab`** | 5.0.4 | GNU Health Core | Laboratory Information Management (LIMS), orders, results | `VERIFIED` |
| **`health_imaging`** | 5.0.4 | GNU Health Core | Diagnostic radiology modalities, requests, imaging reports | `VERIFIED` |
| **`health_insurance`**| 5.0.4 | GNU Health Core | Health insurance policies, coverage, payers | `VERIFIED` |
| **`health_pediatrics`**| 5.0.4 | GNU Health Core | Pediatric evaluations, growth percentiles, developmental check | `VERIFIED` |
| **`health_gyneco`** | 5.0.4 | GNU Health Core | Obstetrics and gynecology evaluations | `VERIFIED` |
| **`health_surgery`** | 5.0.4 | GNU Health Core | Surgical protocols and minor ambulatory procedures | `VERIFIED` |
| **`health_inpatient`**| 5.0.4 | GNU Health Core | Day-case observation and bed management | `VERIFIED` |
| **`health_lifestyle`**| 5.0.4 | GNU Health Core | Patient diet, physical activity, lifestyle assessment | `VERIFIED` |
| **`health_socioeconomics`**| 5.0.4 | GNU Health Core | Socioeconomic determinants of health | `VERIFIED` |
| **`health_genetics`**| 5.0.4 | GNU Health Core | Genetic traits, hereditary conditions, family risk factors | `VERIFIED` |

---

## 2. Module Activation Conclusion

All 24 required clinical, financial, and administrative packages are installed, cleanly activated, and running without dependency conflicts or errors.
