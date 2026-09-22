# 08 — Central Service Catalog: Qatar Outpatient Clinic

**Document:** `08_SERVICE_CATALOG.md`  
**Model:** `product.product` / `health.service`  
**Currency:** Qatari Riyal (`QAR`)  
**Status:** `CONFIGURED` / `PENDING_CLINIC_INPUT`

---

## 1. Outpatient Clinic Billable Services Catalog

| Service Code | Service Name | Department | Technical Model | Currency | Price (QAR) | Applicable Tax | Status |
| :--- | :--- | :--- | :--- | :---: | :---: | :---: | :---: |
| **`OPD-GEN`** | General Practitioner Consultation | Outpatient (OPD) | `product.product` | QAR | `<PENDING_CLINIC_INPUT>` | None / Exempt | `CONFIGURED` |
| **`OPD-SPEC`** | Specialist Physician Consultation | Outpatient (OPD) | `product.product` | QAR | `<PENDING_CLINIC_INPUT>` | None / Exempt | `CONFIGURED` |
| **`OPD-FOLL`** | Outpatient Follow-up Consultation | Outpatient (OPD) | `product.product` | QAR | `<PENDING_CLINIC_INPUT>` | None / Exempt | `CONFIGURED` |
| **`NURS-TRIAGE`**| Nursing Triage & Vital Signs Check | Nursing (NURS) | `product.product` | QAR | `<PENDING_CLINIC_INPUT>` | None / Exempt | `CONFIGURED` |
| **`NURS-DRESS`** | Minor Wound Dressing / Ambulatory Care | Nursing (NURS) | `product.product` | QAR | `<PENDING_CLINIC_INPUT>` | None / Exempt | `CONFIGURED` |
| **`NURS-INJ`** | IM / IV Injection Administration | Nursing (NURS) | `product.product` | QAR | `<PENDING_CLINIC_INPUT>` | None / Exempt | `CONFIGURED` |
| **`LAB-CBC`** | Complete Blood Count (CBC) | Laboratory (LAB) | `gnuhealth.lab.test_type`| QAR | `<PENDING_CLINIC_INPUT>` | None / Exempt | `CONFIGURED` |
| **`LAB-LFT`** | Liver Function Test (LFT) | Laboratory (LAB) | `gnuhealth.lab.test_type`| QAR | `<PENDING_CLINIC_INPUT>` | None / Exempt | `CONFIGURED` |
| **`LAB-RFT`** | Renal Function Test (RFT) | Laboratory (LAB) | `gnuhealth.lab.test_type`| QAR | `<PENDING_CLINIC_INPUT>` | None / Exempt | `CONFIGURED` |
| **`LAB-UA`** | Routine Urine Analysis | Laboratory (LAB) | `gnuhealth.lab.test_type`| QAR | `<PENDING_CLINIC_INPUT>` | None / Exempt | `CONFIGURED` |
| **`LAB-STOOL`** | Routine Stool Examination | Laboratory (LAB) | `gnuhealth.lab.test_type`| QAR | `<PENDING_CLINIC_INPUT>` | None / Exempt | `CONFIGURED` |
| **`RAD-CXR`** | Chest X-Ray (PA View) | Radiology (RAD) | `gnuhealth.imaging.test` | QAR | `<PENDING_CLINIC_INPUT>` | None / Exempt | `CONFIGURED` |
| **`RAD-XRAY`** | General Plain X-Ray Study | Radiology (RAD) | `product.product` | QAR | `<PENDING_CLINIC_INPUT>` | None / Exempt | `CONFIGURED` |
| **`RAD-US`** | Diagnostic Ultrasound Study | Radiology (RAD) | `product.product` | QAR | `<PENDING_CLINIC_INPUT>` | None / Exempt | `CONFIGURED` |
| **`RAD-CT`** | Computed Tomography (CT) Scan | Radiology (RAD) | `product.product` | QAR | `<PENDING_CLINIC_INPUT>` | None / Exempt | `CONFIGURED` |
| **`RAD-MRI`** | Magnetic Resonance Imaging (MRI) | Radiology (RAD) | `product.product` | QAR | `<PENDING_CLINIC_INPUT>` | None / Exempt | `CONFIGURED` |

---

## 2. Pricing & Fee Schedule Policy

1. **No Speculative Pricing**: Prices are strictly marked `<PENDING_CLINIC_INPUT>` until the official clinic fee schedule is signed off by management.
2. **Currency**: All customer-facing bills, insurance copay calculations, and cash receipts are denominated in Qatari Riyal (`QAR`).
3. **VAT / Taxation**: Healthcare services in Qatar are generally exempt or not subject to Value-Added Tax. Any future statutory fiscal tax rule requires accounting confirmation (`PENDING_ACCOUNTING_APPROVAL`).
