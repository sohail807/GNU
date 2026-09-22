# 10 — Diagnostic Radiology Configuration

**Document:** `10_RADIOLOGY_CONFIGURATION.md`  
**Department:** Radiology (`RAD`, ID: 5)  
**Status:** `CONFIGURED` / `VERIFIED`

---

## 1. Diagnostic Imaging Modalities (`gnuhealth.imaging.test.type`)

GNU Health comes pre-configured with 8 international imaging modality standards:

| Modality Code | Modality Name | System ID | Outpatient Clinic Suitability | Status |
| :---: | :--- | :---: | :--- | :---: |
| **`XR`** | X-Ray | 1 | Primary Outpatient Modality | `VERIFIED` |
| **`US`** | Ultrasound | 2 | Primary Outpatient Modality | `VERIFIED` |
| **`MR`** | Magnetic Resonance Imaging | 3 | Advanced / Referral Modality | `VERIFIED` |
| **`CT`** | Computed Tomography | 7 | Advanced / Referral Modality | `VERIFIED` |
| **`DX`** | Digital Radiography | 5 | Direct Digital X-Ray | `VERIFIED` |
| **`CR`** | Computed Radiography | 6 | Phosphor Plate Radiography | `VERIFIED` |
| **`XA`** | X-Ray Angiography | 4 | Specialized / Interventional | `VERIFIED` |
| **`PT`** | Positron Emission Tomography | 8 | Oncology / Tertiary Referral | `VERIFIED` |

---

## 2. Configured Clinical Imaging Studies (`gnuhealth.imaging.test`)

- **Chest X-Ray (`CXR`, ID: 1)**:
  - Modality: `XR` (ID: 1)
  - Billable Product: `X-ray charges` (Product ID: 3)
  - Workflow: Doctor creates `gnuhealth.imaging.test.request` -> Radiology Tech performs study -> Radiologist logs report.
- Additional studies (Extremity X-Ray, Ultrasound Abdomen, Pelvic Ultrasound) are mapped in `master-data/RADIOLOGY_SERVICE_TEMPLATE.yaml`.

---

## 3. Radiology Workflow in Outpatient Clinic

```text
Physician Consultation
        ↓
Medical Imaging Study Request (gnuhealth.imaging.test.request)
        ↓
Radiology Tech Worklist Intake
        ↓
Study Execution & DICOM Association
        ↓
Radiologist Diagnostic Report Entry (gnuhealth.imaging.test.result)
        ↓
Physician Review & Patient EMR Integration
```
