# 15 — Configuration Change Log

**Document:** `15_CONFIGURATION_CHANGE_LOG.md`  
**Scope:** Chronological audit trail of all configuration mutations on database `gnuhealth`  
**Administrator:** Antigravity GNU Health Configuration Specialist  
**Status:** `VERIFIED`

---

## Change Log Entries

### Entry 001 — Pre-Configuration Baseline Snapshot
- **Date:** 2026-09-21T09:15:24Z
- **Module:** System / Database
- **Change:** Generated full pre-configuration JSON master snapshot.
- **Old Value:** Unrecorded
- **New Value:** `gnuhealth-qatar-clinic-config/backup/pre_config_snapshot.json` (27,453 Bytes)
- **Reason:** Mandate for zero clinical data loss and verifiable rollback baseline.
- **Verified:** Yes.

### Entry 002 — Base Country Master Data Population
- **Date:** 2026-09-21T09:15:57Z
- **Module:** `country`
- **Change:** Created Qatar (`QA`, `QAT`, `634`, ID: 1) and 14 patient nationalities (AE, SA, KW, OM, BH, EG, IN, PK, PH, JO, LB, GB, US, SD).
- **Old Value:** 0 countries
- **New Value:** 15 active countries
- **Reason:** Required for patient demographic registration, citizenship, and Federation ID generation.
- **Verified:** Yes.

### Entry 003 — Qatari Riyal (`QAR`) Currency Provisioning
- **Date:** 2026-09-21T09:16:55Z
- **Module:** `currency`
- **Change:** Created Qatari Riyal (`QAR`, Symbol `ر.ق`, digits 2, rounding factor Decimal `0.01`, ID: 3) and initial rate `1.0000` (ID: 2).
- **Old Value:** 0 currencies
- **New Value:** 1 active currency (`QAR`) with active base rate
- **Reason:** Primary legal operating currency for Qatar outpatient clinic.
- **Verified:** Yes.

### Entry 004 — Arabic Language Configuration
- **Date:** 2026-09-21T09:18:20Z
- **Module:** `ir`
- **Change:** Verified and activated Arabic (`ar`, ID: 26, `direction: "rtl"`, `translatable: true`).
- **Old Value:** English only active
- **New Value:** English (`en`, LTR) and Arabic (`ar`, RTL) active
- **Reason:** Official language of Qatar and required secondary clinic interface language.
- **Verified:** Yes.

### Entry 005 — Federation Country Configuration
- **Date:** 2026-09-21T09:28:13Z
- **Module:** `health`
- **Change:** Updated `gnuhealth.federation.country.config` ID 1 to `country = 1` (Qatar), `code = "QAT"`, `use_citizenship = true`.
- **Old Value:** `country = null`, `code = null`
- **New Value:** `country = 1` (Qatar), `code = "QAT"`
- **Reason:** Eliminates `KeyError: 'fed_country'` during patient and physician party registration.
- **Verified:** Yes.

### Entry 006 — Clinic Organization, Company & Institution Setup
- **Date:** 2026-09-21T09:21:16Z
- **Module:** `party`, `company`, `health`
- **Change:**
  - Created Clinic Party (`party.party` ID: 2, `<CLINIC_NAME>`, Private Institution).
  - Created Primary Company (`company.company` ID: 2, Currency: QAR, Timezone: `Asia/Qatar`).
  - Created Health Institution (`gnuhealth.institution` ID: 2, Code: `CLINIC-QA`, Type: `clinic`, Public Level: `private`).
  - Updated User `admin` (ID: 1) company context to Company ID: 2.
- **Old Value:** 0 parties, 0 companies, 0 institutions
- **New Value:** 1 party, 1 company, 1 health institution
- **Reason:** Core organizational structure required for GNU Health outpatient operations.
- **Verified:** Yes.

### Entry 007 — Department / Hospital Units Creation
- **Date:** 2026-09-21T09:21:16Z
- **Module:** `health`
- **Change:** Created 8 outpatient hospital units in `gnuhealth.hospital.unit`:
  `OPD`, `NURS`, `PHARM`, `LAB`, `RAD`, `BILL`, `INS`, `ADMIN`.
- **Old Value:** 0 hospital units
- **New Value:** 8 active outpatient units
- **Reason:** Functional departmental separation for clinical and administrative routing.
- **Verified:** Yes.

### Entry 008 — Diagnostic Imaging Study Definition
- **Date:** 2026-09-21T09:31:36Z
- **Module:** `health_imaging`
- **Change:** Created diagnostic study Chest X-Ray (`CXR`, ID: 1, Modality: `XR`, Product: 3).
- **Old Value:** 0 studies
- **New Value:** 1 active imaging study
- **Reason:** Enables outpatient diagnostic radiology ordering.
- **Verified:** Yes.

### Entry 009 — End-to-End Test Encounter Validation
- **Date:** 2026-09-21T09:32:23Z
- **Module:** `health`, `health_lab`, `health_imaging`
- **Change:** Executed test patient encounter (`TEST - Qatar Clinic Patient`, MRN `PLI528CHX`, Doctor `TEST - Dr. Outpatient Consultant`, Appointment ID: 2, Evaluation ID: 2, Lab Order ID: 2, Imaging Request ID: 2, Prescription Order ID: 2).
- **Old Value:** 0 test encounters
- **New Value:** 1 successfully verified test encounter sequence (Appointment status: `done`).
- **Reason:** Verification of full clinical lifecycle and ORM constraints.
- **Verified:** Yes.
