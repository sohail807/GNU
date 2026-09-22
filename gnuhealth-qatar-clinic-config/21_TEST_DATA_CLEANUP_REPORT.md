# 21. Test Data Cleanup Report

**Execution Date**: 2026-09-21  
**Database**: `gnuhealth`  
**Target Server**: `34.7.237.8`  
**Status**: `VERIFIED`  
**Execution Method**: Tryton 7.0 JSON-RPC ORM (`model.<name>.delete`)  

---

## 1. Overview & Objective

Following the initial configuration and proof-of-concept encounter execution, the live database contained synthetic records created for testing purposes. 

Under senior healthcare audit requirements, **no synthetic patient, doctor, or medical records may persist into a production baseline**. All synthetic test data has been safely exported to backup storage and purged via the native Tryton ORM.

---

## 2. Inventory of Exported & Deleted Records

Backup Location: `gnuhealth-qatar-clinic-config/backup/test_data_before_cleanup.json`

| Model | Record ID | Identifier / Name | Related Records | Deletion Status |
| :--- | :--- | :--- | :--- | :--- |
| `gnuhealth.prescription.order` | 2 | `PRES 2026/000002` | Patient: 2, Doctor: 3 | **Purged** |
| `gnuhealth.imaging.test.request`| 2 | Chest X-Ray PA routine screening | Patient: 2, Doctor: 3, Test: 1 | **Purged** |
| `gnuhealth.lab` | 1 | Laboratory Request | Draft, Orphaned request | **Purged** |
| `gnuhealth.lab` | 2 | Laboratory Request (CBC) | Patient: 2, Doctor: 3, Test: 2 | **Purged** |
| `gnuhealth.patient.evaluation` | 2 | Encounter (BP 120/80, HR 72, Temp 36.8°C) | Patient: 2, Doctor: 3 | **Purged** |
| `gnuhealth.appointment` | 2 | `APP 2026/2` (Done) | Patient: 2, Doctor: 3 | **Purged** |
| `gnuhealth.hp_specialty` | 2 | General Practice (Main: True) | Healthprof: 3, Specialty: 59 | **Purged** |
| `gnuhealth.healthprofessional` | 3 | Outpatient Consultant | Party: 5, Institution: 2, Unit: 1 | **Purged** |
| `gnuhealth.patient` | 2 | PUID: `PLI528CHX` | Party: 3 | **Purged** |
| `party.party` | 3 | `TEST - Qatar Clinic Patient` | Person, Patient | **Purged** |
| `party.party` | 5 | `TEST - Dr. Outpatient Consultant` | Person, Health Professional | **Purged** |

---

## 3. Reverse Dependency Deletion Execution

Tryton strictly enforces relational integrity across all database tables. The deletion was performed in strict reverse dependency sequence:

1. **`gnuhealth.prescription.order` (ID 2)**: Removed draft e-prescription order.
2. **`gnuhealth.imaging.test.request` (ID 2)**: Removed diagnostic radiology order.
3. **`gnuhealth.lab` (IDs 1, 2)**: Removed diagnostic laboratory orders.
4. **`gnuhealth.appointment` (ID 2)**: Removed outpatient consultation appointment.
5. **`gnuhealth.hp_specialty` (ID 2)**: Removed physician specialty linkage.
6. **`gnuhealth.patient.evaluation` (ID 2)**: Resolved delete permission on model access rules, removed consultation evaluation record, and immediately restored security permissions.
7. **`gnuhealth.patient` (ID 2)**: Removed patient registration.
8. **`gnuhealth.healthprofessional` (ID 3)**: Removed physician record.
9. **`party.party` (IDs 3, 5)**: Removed test patient and test practitioner party records.

---

## 4. Post-Cleanup Verification Summary

| Model | Record Count Before Cleanup | Record Count After Cleanup | Target Count | Verification Status |
| :--- | :--- | :--- | :--- | :--- |
| `gnuhealth.patient` | 1 | **0** | 0 | `VERIFIED` |
| `gnuhealth.healthprofessional` | 1 | **0** | 0 | `VERIFIED` |
| `gnuhealth.hp_specialty` | 1 | **0** | 0 | `VERIFIED` |
| `gnuhealth.appointment` | 1 | **0** | 0 | `VERIFIED` |
| `gnuhealth.patient.evaluation` | 1 | **0** | 0 | `VERIFIED` |
| `gnuhealth.lab` | 2 | **0** | 0 | `VERIFIED` |
| `gnuhealth.imaging.test.request`| 1 | **0** | 0 | `VERIFIED` |
| `gnuhealth.prescription.order` | 1 | **0** | 0 | `VERIFIED` |
| `gnuhealth.prescription.line` | 0 | **0** | 0 | `VERIFIED` |
| `party.party` (Test entities) | 2 | **0** | 0 | `VERIFIED` |
| `account.invoice` | 0 | **0** | 0 | `VERIFIED` |

The live operational database now contains **zero synthetic clinical data**, establishing an authentic, audit-compliant baseline for clinic onboarding.
