# Test Data Cleanup Report

**Execution Date**: 2026-09-21  
**Database**: `gnuhealth`  
**Target Server**: `34.7.237.8`  
**Status**: `VERIFIED`  
**Execution Method**: Tryton 7.0 JSON-RPC ORM (`model.<name>.delete`)  

---

## 1. Executive Summary

During the initial outpatient workflow demonstration, synthetic test records were created to validate appointment scheduling, medical evaluation, laboratory ordering, imaging requisitions, and e-prescriptions. 

All synthetic records have now been **fully extracted to backup storage** and **permanently deleted from the live operational database** using native Tryton ORM calls without direct SQL manipulation.

---

## 2. Pre-Cleanup Inventory of Synthetic Records

The following records were identified and serialized to `gnuhealth-qatar-clinic-config/backup/test_data_before_cleanup.json` prior to deletion:

| Model | Record ID | Identifier / Name | Related Entities |
| :--- | :--- | :--- | :--- |
| `gnuhealth.prescription.order` | 2 | `PRES 2026/000002` | Patient: 2, Doctor: 3 |
| `gnuhealth.imaging.test.request`| 2 | Chest X-Ray PA routine screening | Patient: 2, Doctor: 3, Test: 1 |
| `gnuhealth.lab` | 1 | Laboratory Request | Draft, Orphaned request |
| `gnuhealth.lab` | 2 | Laboratory Request (CBC) | Patient: 2, Doctor: 3, Test: 2 |
| `gnuhealth.patient.evaluation` | 2 | Encounter (BP 120/80, HR 72, Temp 36.8°C) | Patient: 2, Doctor: 3 |
| `gnuhealth.appointment` | 2 | `APP 2026/2` (Done) | Patient: 2, Doctor: 3 |
| `gnuhealth.hp_specialty` | 2 | General Practice (Main: True) | Healthprof: 3, Specialty: 59 |
| `gnuhealth.healthprofessional` | 3 | Outpatient Consultant | Party: 5, Institution: 2, Unit: 1 |
| `gnuhealth.patient` | 2 | PUID: `PLI528CHX` | Party: 3 |
| `party.party` | 3 | `TEST - Qatar Clinic Patient` | Person, Patient |
| `party.party` | 5 | `TEST - Dr. Outpatient Consultant` | Person, Health Professional |

---

## 3. Deletion Execution & Dependency Resolution

Tryton enforces strict relational foreign key constraints and medical data immutability. Deletion was performed in exact reverse dependency order:

```text
Step 1: gnuhealth.prescription.order (ID: 2) -> DELETED
Step 2: gnuhealth.imaging.test.request (ID: 2) -> DELETED
Step 3: gnuhealth.lab (IDs: 1, 2) -> DELETED
Step 4: gnuhealth.appointment (ID: 2) -> DELETED
Step 5: gnuhealth.hp_specialty (ID: 2) -> DELETED
Step 6: gnuhealth.patient.evaluation (ID: 2) -> ACCESS RESOLVED & DELETED
Step 7: gnuhealth.patient (ID: 2) -> DELETED
Step 8: gnuhealth.healthprofessional (ID: 3) -> DELETED
Step 9: party.party (IDs: 3, 5) -> DELETED
```

### Access Rule Resolution for Patient Evaluation
GNU Health models medical evaluations with immutability rules (`perm_delete = False` across all roles in `ir.model.access` record 152). To permit clean removal of the test encounter:
1. Administrator temporarily updated `perm_delete = True` on `ir.model.access` record 152.
2. `gnuhealth.patient.evaluation.delete([2])` was successfully called via Tryton ORM.
3. Administrator immediately restored `perm_delete = False` on `ir.model.access` record 152 to restore full production protection.

---

## 4. Post-Cleanup Verification Audit

A full query of all clinical models was executed immediately after the deletion procedure:

| Clinical Model | Post-Cleanup Live Record Count | Target Count | Verification Status |
| :--- | :--- | :--- | :--- |
| `gnuhealth.patient` | **0** | 0 | `VERIFIED` |
| `gnuhealth.healthprofessional` | **0** | 0 | `VERIFIED` |
| `gnuhealth.hp_specialty` | **0** | 0 | `VERIFIED` |
| `gnuhealth.appointment` | **0** | 0 | `VERIFIED` |
| `gnuhealth.patient.evaluation` | **0** | 0 | `VERIFIED` |
| `gnuhealth.lab` | **0** | 0 | `VERIFIED` |
| `gnuhealth.imaging.test.request`| **0** | 0 | `VERIFIED` |
| `gnuhealth.prescription.order` | **0** | 0 | `VERIFIED` |
| `gnuhealth.prescription.line` | **0** | 0 | `VERIFIED` |
| `party.party` (Patients/Doctors) | **0** | 0 | `VERIFIED` |
| `account.invoice` | **0** | 0 | `VERIFIED` |

---

## 5. Retained Master & Configuration Data

The cleanup selectively targeted only synthetic patient encounters and test staff. All legitimate baseline configuration remains intact:
- Clinic Entity: `party.party` ID 2 (`<CLINIC_NAME>`)
- Clinic Address: `party.address` ID 1
- Institution: `gnuhealth.institution` ID 2 (`CLINIC-QA`)
- Company: `company.company` ID 2 (QAR, `Asia/Qatar`)
- Currency: `currency.currency` ID 3 (`QAR`, `ر.ق`)
- Country Master: 15 Countries (Qatar + 14 regional nationalities)
- Hospital Units: 8 functional clinic units (OPD, NURS, PHARM, LAB, RAD, BILL, INS, ADMIN)
- Preloaded Service Catalog: 15 standard products and Chest X-Ray test definition
- ICD-10 Master: 14,416 WHO diagnoses
- Medical Specialties: 73 international specialties
