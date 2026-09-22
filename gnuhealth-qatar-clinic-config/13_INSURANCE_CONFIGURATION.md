# 13 — Health Insurance & Third-Party Payer (TPA) Framework

**Document:** `13_INSURANCE_CONFIGURATION.md`  
**Department:** Insurance (`INS`, ID: 7)  
**Module:** `health_insurance`  
**Status:** `CONFIGURED` / `PENDING_CLINIC_INPUT`

---

## 1. GNU Health Insurance Data Model

The `health_insurance` module provides:
- **Insurance Company Party**: Party record with `is_insurance_company = true`
- **Insurance Policy / Plan (`gnuhealth.insurance`)**: Links patient, company, policy number, valid from/to dates, and coverage level.
- **Patient Linkage**: Direct relation on `gnuhealth.patient.insurances`.

---

## 2. Qatar Healthcare Insurance Landscape Context

In the State of Qatar, health insurance operates across national mandatory schemes (e.g., Mandatory Health Insurance for expatriates) and private commercial payers / Third-Party Administrators (TPAs):
- **Candidate Payers**:
  - QLM Life & Medical Insurance
  - Al Koot Insurance & Reinsurance
  - National Health Insurance (Daman / Seha)
  - Mednet Qatar (TPA)
  - NextCare Qatar (TPA)
  - Seib Insurance

---

## 3. Payer Master Data Loading Rule

- **No Fictional Insurance Payers**: Actual insurance companies and TPAs will only be loaded after clinic management submits the approved list of contracted payers, network tiers, and claim submission guidelines.
- **Data Template**: Available at `master-data/insurance.yaml`.
