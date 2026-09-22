# 09 — Pharmacy & Medication Architecture

**Document:** `09_PHARMACY_CONFIGURATION.md`  
**Department:** Pharmacy (`PHARM`, ID: 3)  
**Status:** `CONFIGURED` / `VERIFIED`

---

## 1. Installed Clinical Reference Ontologies

The GNU Health installation provides preloaded WHO and international standard pharmaceutical master data:

- **Drug Forms (`gnuhealth.drug.form`)**: **94 preloaded forms**, including:
  - `TAB` (Tablet), `CAP` (Capsule), `CRM` (Cream), `DPS` (Drops), `INH` (Inhaler)
  - `SUS` (Suspension), `SYR` (Syrup), `INJ` (Injection), `OIN` (Ointment), `SUP` (Suppository)
- **Drug Administration Routes (`gnuhealth.drug.route`)**: **47 preloaded routes**, including:
  - `O` (Oral), `TOP` (Topical), `IV` (Intravenous), `IM` (Intramuscular), `SC` (Subcutaneous)
  - `IH` (Inhalation), `OPHT` (Ophthalmic), `OTIC` (Otic), `NAS` (Nasal), `REC` (Rectal)
- **Standard Dose Units (`gnuhealth.dose.unit`)**: **7 preloaded units**:
  - `mg` (Milligram), `mL` (Milliliter), `ug` (Microgram), `L` (Liter)
  - `kg` (Kilogram), `mmol` (Millimole), `unit` (International Unit)

---

## 2. Prescription Safety Verification Engine

GNU Health 5.0 enforces rule `SM-CORE-0018`:
- In every outpatient electronic prescription order (`gnuhealth.prescription.order`), the physician is prompted to acknowledge allergy contraindications and pregnancy precautions:
  ```python
  prescription_warning_ack = True
  ```
- This ensures patient safety before prescription lines can be finalized and dispensed.

---

## 3. Medication Formulary Loading Strategy

- Real pharmaceutical brand names, strengths, bar codes, and pack sizes must be populated from the clinic's Ministry of Public Health (MOPH) approved formulary.
- Structured import template is available at `master-data/medicines.yaml`.
- Inventory stock quantities remain strictly at zero (`initial_stock = 0`) to prevent fictional inventory balances.
