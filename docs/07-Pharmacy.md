# 07. Pharmacy & Medication Management

**Project**: Healthcare Management System — GNU Health Implementation  
**Assessment Date**: 2026-09-21  
**Status**: `PARTIALLY_IMPLEMENTED — PENDING MEDICAL APPROVAL`  
**Document**: `docs/07-Pharmacy.md`  

---

## 1. Executive Summary

This document specifies the pharmacy and e-prescribing architecture in GNU Health 5.0, detailing preloaded pharmacology ontologies, the clinical safety engine, dispensing workflows, and required commercial formulary data.

---

## 2. Preloaded Pharmacology Ontologies

GNU Health includes comprehensive international standard pharmacological reference data:

| Pharmacology Model | Technical Entity | Preloaded Record Count | Description / Scope | Status |
| :--- | :--- | :---: | :--- | :--- |
| **Drug Dosage Forms** | `gnuhealth.drug.form` | **94** | Tablet, Capsule, Syrup, Injection, Ointment, Inhaler, Drops, etc. | `VERIFIED` |
| **Administration Routes**| `gnuhealth.drug.route` | **47** | Oral, Intravenous, Subcutaneous, Topical, Ophthalmic, Inhalation, etc. | `VERIFIED` |
| **Dose Units** | `gnuhealth.dose.unit` | **7** | Milligram (`mg`), Gram (`g`), Milliliter (`ml`), International Unit (`IU`), etc. | `VERIFIED` |
| **WHO Essential Drugs** | `gnuhealth.medicament` (WHO catalog)| Standard definitions | International core medicines list | Available |

---

## 3. Electronic Prescribing & Medical Safety Engine

E-prescriptions are created in `gnuhealth.prescription.order` with line items in `gnuhealth.prescription.line`.

### Built-in Safety Engine Checks
Tryton and GNU Health enforce three automated patient safety layers:
1. **Health Professional Verification (`SM-CORE-0007`)**:
   - Validates that the issuing user is associated with an active health professional profile.
2. **Patient Safety Sign-off (`SM-CORE-0018`)**:
   - Enforces explicit physician review: `prescription_warning_ack = True`. If omitted, Tryton raises `DrugSafetyCheck: The prescription has not been verified for patient safety`.
3. **Allergy & Pregnancy Cross-Checking**:
   - Cross-references prescribed active pharmaceutical ingredients against the patient's recorded drug allergies (`gnuhealth.patient.disease`) and pregnancy status (`gnuhealth.patient`).

---

## 4. Outpatient Pharmacy Dispensing Workflow

```text
[Consultation Room]
  1. Doctor selects medication from formulary (gnuhealth.medicament).
  2. Doctor defines dosage: 500mg Oral Twice Daily for 5 Days.
  3. Safety checks execute -> Rx generated: "PRES 2026/XXXXXX".
        ↓
[Clinic Pharmacy Unit - PHARM]
  4. Pharmacist searches Rx by Patient PUID or Prescription Number.
  5. Pharmacist reviews clinical notes, checks interaction warnings.
  6. Pharmacist dispenses medication -> Updates order state to Dispensed.
  7. Pharmacy fee recorded on patient billing account.
```

---

## 5. Master Data Gap: Qatar National Formulary (QNF)

> [!IMPORTANT]
> **Clinical Master Data Required (`PENDING_MEDICAL_APPROVAL`)**:  
> The live database currently contains **0 commercial products in `gnuhealth.medicament`**.  
>  
> Before the pharmacy can operate in production:
> 1. Chief Pharmacist / Medical Director must provide the clinic's approved medication formulary compliant with the Qatar National Formulary (QNF).
> 2. Formularies must specify: Brand Name, Generic / INN Name, Strength, Form, Route, Unit, Manufacturer, and Retail Price in QAR.
> 3. Template provided in: [configuration/master-data/medicines.yaml](file:///c:/Users/MohammedSohail/OneDrive%20-%20IRISSTAR%20TECHNOLOGIES/GNU%20Health/configuration/master-data/medicines.yaml).
