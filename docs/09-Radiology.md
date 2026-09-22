# 09. Radiology & Diagnostic Imaging

**Project**: Healthcare Management System — GNU Health Implementation  
**Assessment Date**: 2026-09-21  
**Status**: `VERIFIED — PENDING CLINIC IMAGING CATALOG INPUT`  
**Document**: `docs/09-Radiology.md`  

---

## 1. Executive Summary

This document specifies the Diagnostic Imaging and Radiology Information System (RIS) architecture in GNU Health 5.0, detailing preloaded modalities, study requisitioning, procedure logging, diagnostic reporting, and PACS integration requirements.

---

## 2. Preloaded Imaging Modalities

The system contains 8 pre-configured diagnostic imaging modalities in `gnuhealth.imaging.test.type`:

1. **X-Ray (Plain Radiography)**: Chest, Skeletal, Abdominal, Dental.
2. **Ultrasound (Sonography)**: Abdominal, Pelvic, Obstetric/Gynecological, Doppler.
3. **Computed Tomography (CT)**: Head, Chest, Abdomen (Contrast / Non-contrast).
4. **Magnetic Resonance Imaging (MRI)**: Brain, Spine, Musculoskeletal.
5. **Mammography**: Screening and Diagnostic Breast Imaging.
6. **Bone Densitometry (DEXA)**: Osteoporosis Screening.
7. **Fluoroscopy**: Barium Studies, Dynamic Gastrointestinal Exams.
8. **Echocardiography**: Transthoracic Cardiac Imaging.

---

## 3. Verified Diagnostic Test Configuration

- **Active Test**: `gnuhealth.imaging.test` Record ID 1
  - `name`: `"Chest X-Ray"`
  - `code`: `"CXR"`
  - `product`: Record ID 3 (`"X-ray charges"`)
- **Workflow Verification**: An end-to-end requisition was executed during testing and safely purged:
  - Physician requisitioned PA Chest X-Ray.
  - Tracking through Radiology unit (`RAD`).
  - Diagnostic sign-off and service billing link verified.

---

## 4. Radiology Operational Workflow

```text
[Physician Consultation - OPD]
  1. Doctor creates Imaging Study Requisition (gnuhealth.imaging.test.request).
  2. Selects Modality, Exam Code, and enters Clinical Indication.
  3. Order Status: 'draft'.
        ↓
[Radiology Reception & Scanning Suite - RAD]
  4. Patient presents at Radiology Department.
  5. Radiographer performs examination on X-Ray / Ultrasound unit.
  6. Radiographer records technical notes (exposure factors, views taken).
  7. Status advances to Procedure Done.
        ↓
[Radiologist Diagnostic Review & Reporting]
  8. Radiologist examines diagnostic images on viewing workstation.
  9. Dictates / types structured Findings, Impression, and Recommendations.
 10. Radiologist electronically signs diagnostic report -> State: 'done'.
 11. Study Report automatically linked into Patient EHR record.
 12. Radiology fee posted to billing ledger in QAR.
```

---

## 5. PACS / DICOM Server Integration Assessment

- **Current Status**: **No PACS / DICOM node is connected**.
- **Operational Reality**: In the baseline outpatient clinic setup, radiologist reports and key image snapshots are uploaded directly into Tryton document attachments (`/home/gnuhealth/attach`).
- **Future PACS Option**: GNU Health includes an optional `health_orthanc` module designed to bridge GNU Health with the Orthanc open-source DICOM server. Connecting a DICOM PACS server is classified as an optional Phase 2 enhancement once physical imaging equipment is installed.

---

## 6. Master Data Requirements (`PENDING_CLINIC_INPUT`)

To finalize the radiology catalog:
1. Medical Director / Radiologist must approve the clinic's imaging examination list (e.g. Chest PA, KUB X-Ray, Pelvic Ultrasound).
2. Set individual examination charges in QAR.
3. Template provided in: [configuration/master-data/RADIOLOGY_SERVICE_TEMPLATE.yaml](file:///c:/Users/MohammedSohail/OneDrive%20-%20IRISSTAR%20TECHNOLOGIES/GNU%20Health/configuration/master-data/RADIOLOGY_SERVICE_TEMPLATE.yaml).
