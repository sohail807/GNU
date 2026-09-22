# Country Master & Regional Nationalities Audit

**Audit Date**: 2026-09-21  
**Database**: `gnuhealth`  
**Status**: `VERIFIED`  

---

## 1. Objective

To audit the geopolitical master data configured within Tryton to support patient registration, demographics, and GNU Health Federation person identity compliance in the State of Qatar.

---

## 2. Qatar Country Master

Inspection of `country.country` (Record ID: 1) confirmed:

```json
{
  "id": 1,
  "name": "Qatar",
  "code": "QA",
  "code3": "QAT"
}
```

- **ISO Alpha-2 Code**: `QA`
- **ISO Alpha-3 Code**: `QAT`
- **Numeric Code**: `634`
- **Primary Geopolitical Classification**: Domestic host state for clinic operations.

---

## 3. Regional & GCC Patient Nationalities

In Qatar outpatient healthcare, demographic diversity requires immediate availability of common GCC and expatriate nationalities to prevent registration bottlenecks. 

The live database contains the following 14 additional verified country records:

| Country Name | ISO Alpha-2 (`code`) | ISO Alpha-3 (`code3`) | Record ID | Demographics Relevance |
| :--- | :--- | :--- | :--- | :--- |
| **United Arab Emirates** | `AE` | `ARE` | 2 | GCC Neighbor |
| **Saudi Arabia** | `SA` | `SAU` | 3 | GCC Neighbor |
| **Kuwait** | `KW` | `KWT` | 4 | GCC Neighbor |
| **Oman** | `OM` | `OMN` | 5 | GCC Neighbor |
| **Bahrain** | `BH` | `BHR` | 6 | GCC Neighbor |
| **Egypt** | `EG` | `EGY` | 7 | Arab Expatriate Population |
| **India** | `IN` | `IND` | 8 | South Asian Expatriate Population |
| **Pakistan** | `PK` | `PAK` | 9 | South Asian Expatriate Population |
| **Philippines** | `PH` | `PHL` | 10 | Southeast Asian Expatriate Population |
| **Jordan** | `JO` | `JOR` | 11 | Arab Expatriate Population |
| **Lebanon** | `LB` | `LBN` | 12 | Arab Expatriate Population |
| **United Kingdom** | `GB` | `GBR` | 13 | Western Expatriate Population |
| **United States** | `US` | `USA` | 14 | Western Expatriate Population |
| **Sudan** | `SD` | `SDN` | 15 | Arab Expatriate Population |

---

## 4. GNU Health Federation Country Configuration

Inspection of `gnuhealth.federation.country.config` (Record ID: 1) confirmed:

```json
{
  "id": 1,
  "country": 1,
  "code": "QAT"
}
```

### Critical Architecture Impact
In GNU Health HMIS 5.0, when a new party is created with `is_person = True` (such as patients, doctors, or administrative staff), the system automatically validates or queries `fed_country`. If `gnuhealth.federation.country.config` is unconfigured or null, Tryton raises an unhandled `KeyError: 'fed_country'`.

Setting `country = 1` (Qatar) and `code = 'QAT'` ensures all newly registered people automatically inherit the Qatar federation prefix (`QAT`) without system exception.
