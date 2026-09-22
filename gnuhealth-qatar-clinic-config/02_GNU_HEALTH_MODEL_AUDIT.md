# 02 — GNU Health Core Model Audit

**Document:** `02_GNU_HEALTH_MODEL_AUDIT.md`  
**Scope:** Verification of native GNU Health models, relations, required fields, and constraints  
**Status:** `VERIFIED`

---

## 1. Verified Key Data Models

| Functional Area | Technical Model Name | Module | Required Fields | Key Relationships |
| :--- | :--- | :--- | :--- | :--- |
| **Party** | `party.party` | `party` | `name` | Address, Contacts, Identifiers |
| **Company** | `company.company` | `company` | `party`, `currency` | Currency, Employees, Timezone |
| **Institution** | `gnuhealth.institution` | `health` | `party`, `public_level` | Party, Hospital Units, Specialties |
| **Department / Unit**| `gnuhealth.hospital.unit` | `health` | `name`, `code` | Institution |
| **Patient** | `gnuhealth.patient` | `health` | `party` | Party, PUID sequence, EMR evaluations |
| **Health Professional**| `gnuhealth.healthprofessional` | `health` | `party` | Party, Institution, Specialties |
| **Appointment** | `gnuhealth.appointment` | `health` | `patient`, `healthprof`, `appointment_date` | Patient, Doctor, Institution, State |
| **Triage / Vitals** | `gnuhealth.patient.evaluation` | `health` | `patient` | Appointment, Doctor, Pathology (ICD-10) |
| **Prescription Order** | `gnuhealth.prescription.order`| `health` | `patient` | Patient, Doctor, Warning Ack, Lines |
| **Prescription Line** | `gnuhealth.prescription.line` | `health` | `medicament` | Prescription Order, Medicament, Route |
| **Medicament** | `gnuhealth.medicament` | `health` | `name` | Product, Drug Form, Route, Dose Unit |
| **Lab Order** | `gnuhealth.lab` | `health_lab` | `patient`, `test` | Patient, Requestor, Lab Test Type |
| **Imaging Request** | `gnuhealth.imaging.test.request`| `health_imaging` | `patient`, `doctor`, `requested_test`, `date` | Patient, Doctor, Imaging Study |
| **Customer Invoice** | `account.invoice` | `account_invoice`| `party`, `type`, `currency` | Company, Lines, Journal, Patient |

---

## 2. ORM Constraints & Clinical Safety Hooks

1. **PUID Generation**: Automatic alphanumeric sequence generated via `ir.sequence` (Prefix `PAC`).
2. **Federation Prefix**: Generates local/federation identification prefixes based on `gnuhealth.federation.country.config` (Configured to `QAT` for Qatar).
3. **Gender Requirement**: In GNU Health, every person party requires a valid binary gender selection (`m` / `f`) for clinical risk calculations.
4. **Prescription Safety Verification**: GNU Health enforces rule `SM-CORE-0018`, requiring explicit physician acknowledgment (`prescription_warning_ack = true`) verifying absence of contraindicated drug allergies or pregnancy warnings.
5. **Decimals & Monetary Precision**: Monetary values and dosage factors strictly require Python `Decimal` representations with 2 decimal places in QAR (`digits = 2`, `rounding = 0.01`).
