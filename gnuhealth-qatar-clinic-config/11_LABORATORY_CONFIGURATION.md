# 11 — Clinical Laboratory Configuration

**Document:** `11_LABORATORY_CONFIGURATION.md`  
**Department:** Laboratory (`LAB`, ID: 4)  
**Status:** `CONFIGURED` / `VERIFIED`

---

## 1. Laboratory Test Categories (`gnuhealth.lab.test_type`)

The GNU Health installation provides 9 preloaded laboratory test categories:

| Category Code | Category Name | System ID | Standard Specimen / Sample | Status |
| :---: | :--- | :---: | :--- | :---: |
| **`CBC`** | Complete Blood Count | 2 | Whole Blood (EDTA tube) | `VERIFIED` |
| **`LFT`** | Liver Function Test | 3 | Serum / Heparin Plasma | `VERIFIED` |
| **`RFT`** | Renal Function Test | 5 | Serum / Plain tube | `VERIFIED` |
| **`UA`** | Urine Analysis | 8 | Midstream Sterile Urine | `VERIFIED` |
| **`SE`** | Stool Examination | 4 | Fresh Stool Specimen | `VERIFIED` |
| **`HTG`** | Haematology Panels | 6 | Whole Blood / Citrate | `VERIFIED` |
| **`PSE`** | Peripheral Smear Examination | 7 | Blood Smear Slide | `VERIFIED` |
| **`EGY`** | Endocrinology | 9 | Serum (Hormones) | `VERIFIED` |
| **`SA`** | Semen Analysis | 1 | Seminal Fluid | `VERIFIED` |

---

## 2. Laboratory Order & Results Workflow

```text
Physician Consultation
        ↓
Electronic Lab Order (gnuhealth.lab)
        ↓
Phlebotomy / Specimen Barcode Labeling & Collection
        ↓
Laboratory Sample Intake & Analysis
        ↓
Analyte Result Entry & Verification by Pathologist
        ↓
Validation & Immediate EMR Consultation Chart Availability
```

---

## 3. Laboratory Reference Ranges Policy

> [!CAUTION]
> **No Synthetic Reference Ranges**: Biological reference ranges (e.g., Hemoglobin, Fasting Blood Glucose, Serum Creatinine) vary by laboratory analyzer, reagent vendor, and patient demographic (age/gender). All reference ranges and critical alert thresholds must be provided and signed off by the laboratory medical director (`PENDING_LABORATORY_APPROVAL`).
