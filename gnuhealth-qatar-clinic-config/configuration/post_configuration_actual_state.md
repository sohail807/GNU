# Post-Configuration Actual System State

**Audit Date**: 2026-09-21  
**Target Environment**: GCP Compute Engine `gnuhealth-srv` (Debian 12 Bookworm, IP: `34.7.237.8`)  
**Core Stack**: GNU Health HMIS 5.0.7 / Tryton 7.0.57 / PostgreSQL 15.15  
**Database**: `gnuhealth`  
**Audit Protocol**: Live Tryton JSON-RPC Inspection (`model.<name>.search_read`)  

---

## 1. Executive Summary & Verification Matrix

This document records the exact, verified post-cleanup state of the live GNU Health 5.0 database following the cleanup of all synthetic test encounters and the verification of Qatar baseline configuration.

| Model / Component | Live Record Count | Actual State | Verification Status |
| :--- | :--- | :--- | :--- |
| **`currency.currency` (QAR)** | 1 | ID 3: Code `QAR`, Symbol `ر.ق`, Rounding `0.01`, Digits `2` | `VERIFIED` |
| **`currency.currency.rate`** | 2 | Base rate ID 2: `1.0000` (effective 2026-09-21) | `VERIFIED` |
| **`country.country`** | 15 | Qatar (ID 1, `QA`, `QAT`, `634`) + 14 regional nationalities | `VERIFIED` |
| **`gnuhealth.federation.country.config`**| 1 | ID 1: Country 1 (Qatar), Federation Code `QAT` | `VERIFIED` |
| **`ir.lang` (Arabic & English)** | 2 active | English (`en`, LTR) & Arabic (`ar`, RTL, translatable) | `VERIFIED` |
| **`company.company`** | 1 | ID 2: Party 2, Currency 3 (QAR), Timezone `Asia/Qatar` | `VERIFIED` |
| **`gnuhealth.institution`** | 1 | ID 2: Code `CLINIC-QA`, Type `clinic`, Level `private` | `VERIFIED` (Placeholder Name) |
| **`gnuhealth.hospital.unit`** | 8 | OPD, NURS, PHARM, LAB, RAD, BILL, INS, ADMIN | `VERIFIED` |
| **`gnuhealth.specialty`** | 73 | Preloaded standard international specialties (0 duplicates) | `VERIFIED` |
| **`gnuhealth.imaging.test`** | 1 | ID 1: Chest X-Ray (`CXR`), linked to Product 3 | `VERIFIED` |
| **`product.product`** | 15 | Standard service items (CT, CBC, MRI, Eval, Ultrasound, etc.)| `VERIFIED` |
| **`account.account`** | 7 | Minimal chart of accounts (Cash, Expense, Payable, etc.) | `PARTIALLY_CONFIGURED` |
| **`account.journal`** | 6 | Cash, Expense, Revenue, Stock, etc. | `CONFIGURED` |
| **`account.fiscalyear`** | 0 | No fiscal year or periods opened | `PENDING_ACCOUNTING_APPROVAL` |
| **`account.invoice`** | 0 | Zero invoices created | `PENDING_ACCOUNTING_APPROVAL` |
| **`gnuhealth.patient`** | 0 | Clean operational baseline (test patient deleted) | `VERIFIED` |
| **`gnuhealth.healthprofessional`** | 0 | Clean operational baseline (test doctor deleted) | `VERIFIED` |
| **`gnuhealth.hp_specialty`** | 0 | Clean operational baseline | `VERIFIED` |
| **`gnuhealth.appointment`** | 0 | Clean operational baseline | `VERIFIED` |
| **`gnuhealth.patient.evaluation`** | 0 | Clean operational baseline | `VERIFIED` |
| **`gnuhealth.lab`** | 0 | Clean operational baseline | `VERIFIED` |
| **`gnuhealth.imaging.test.request`** | 0 | Clean operational baseline | `VERIFIED` |
| **`gnuhealth.prescription.order`** | 0 | Clean operational baseline | `VERIFIED` |
| **`party.party`** | 1 | ID 2: Clinic entity (`<CLINIC_NAME>`) | `VERIFIED` (Placeholder) |

---

## 2. Qatar Geopolitical & Financial Baseline

### A. Currency Configuration
- **Record**: `currency.currency` ID 3
- **Fields**:
  - `code`: `"QAR"`
  - `name`: `"Qatari Riyal"`
  - `symbol`: `"ر.ق"`
  - `digits`: `2`
  - `rounding`: `0.01` (`Decimal`)
- **Base Rate**: `currency.currency.rate` ID 2 (`rate: 1.0000`, `currency: 3`)

### B. Geopolitical Master Data
- **Country**: `country.country` ID 1 (`name: "Qatar"`, `code: "QA"`, `code3: "QAT"`)
- **GCC & Regional Patient Nationalities**: 14 additional countries preloaded:
  - United Arab Emirates (`AE`, `ARE`)
  - Saudi Arabia (`SA`, `SAU`)
  - Kuwait (`KW`, `KWT`)
  - Oman (`OM`, `OMN`)
  - Bahrain (`BH`, `BHR`)
  - Egypt (`EG`, `EGY`)
  - India (`IN`, `IND`)
  - Pakistan (`PK`, `PAK`)
  - Philippines (`PH`, `PHL`)
  - Jordan (`JO`, `JOR`)
  - Lebanon (`LB`, `LBN`)
  - United Kingdom (`GB`, `GBR`)
  - United States (`US`, `USA`)
  - Sudan (`SD`, `SDN`)
- **GNU Health Federation Country Config**: `gnuhealth.federation.country.config` ID 1:
  - `country`: `1` (Qatar)
  - `code`: `"QAT"`

### C. Language & Localization
- **Active Languages**:
  - `en` (English, LTR, translatable)
  - `ar` (Arabic, RTL, translatable)
- **Timezone**: `Asia/Qatar` (UTC+3 / AST) configured at operating system and company model levels.

---

## 3. Clinic Structure & Operational Departments

### A. Legal Entity & Institution
- **Party**: `party.party` ID 2 (`name: "<CLINIC_NAME>"`, `is_institution: True`)
- **Address**: `party.address` ID 1 (`street: "<STREET>, Zone <ZONE>, Building <BUILDING>"`, `city: "<CITY>"`, `country: 1`)
- **Company**: `company.company` ID 2 (`party: 2`, `currency: 3`, `timezone: "Asia/Qatar"`)
- **Institution**: `gnuhealth.institution` ID 2 (`code: "CLINIC-QA"`, `party: 2`, `institution_type: "clinic"`, `public_level: "private"`)

### B. Hospital Units (`gnuhealth.hospital.unit`)
All 8 units are mapped to Institution ID 2:
1. `OPD` (Outpatient Department) - ID 1
2. `NURS` (Nursing / Triage) - ID 2
3. `PHARM` (Pharmacy) - ID 3
4. `LAB` (Laboratory) - ID 4
5. `RAD` (Radiology) - ID 5
6. `BILL` (Billing / Accounts) - ID 6
7. `INS` (Insurance) - ID 7
8. `ADMIN` (Administration) - ID 8

---

## 4. Operational Cleanliness & Deletion Verification

All synthetic entities created during initial testing have been deleted via native Tryton ORM calls (`model.<name>.delete`):
- `gnuhealth.prescription.order` ID 2: **Deleted**
- `gnuhealth.imaging.test.request` ID 2: **Deleted**
- `gnuhealth.lab` IDs 1 and 2: **Deleted**
- `gnuhealth.patient.evaluation` ID 2: **Deleted**
- `gnuhealth.appointment` ID 2: **Deleted**
- `gnuhealth.hp_specialty` ID 2: **Deleted**
- `gnuhealth.healthprofessional` ID 3: **Deleted**
- `gnuhealth.patient` ID 2: **Deleted**
- `party.party` IDs 3 and 5: **Deleted**

The operational clinical database contains **exactly 0 patient records, 0 health professionals, 0 clinical encounters, 0 lab orders, 0 imaging requests, and 0 invoices**.
