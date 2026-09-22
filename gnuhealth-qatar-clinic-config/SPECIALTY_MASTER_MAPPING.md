# Medical Specialty Master Mapping: Qatar Outpatient Clinic

**Document:** `SPECIALTY_MASTER_MAPPING.md`  
**Model:** `gnuhealth.specialty`  
**Total Preloaded Specialties:** 73  
**Status:** `VERIFIED`

---

## 1. Outpatient Clinic Candidate Specialties Mapping

The GNU Health installation includes 73 preloaded medical specialties. The following 12 core specialties are mapped as candidate departments for the Qatar Outpatient Clinic:

| Clinic Specialty Category | GNU Health Code | System ID | Official Model Name | Recommended Department | Status |
| :--- | :---: | :---: | :--- | :--- | :--- |
| **General Medicine / GP** | `GP` | 59 | General Practitioner | Outpatient Department (OPD) | `VERIFIED` |
| **Primary Care** | `PRIMARYCARE` | 68 | Primary Care | Outpatient Department (OPD) | `VERIFIED` |
| **Family Medicine** | `FAMILY` | 15 | Family Medicine | Outpatient Department (OPD) | `VERIFIED` |
| **Internal Medicine** | `INTERNAL` | 60 | Internal Medicine | Specialist Clinic | `VERIFIED` |
| **Pediatrics** | `PEDIATRICS` | 40 | Pediatrics | Specialist Clinic | `VERIFIED` |
| **Dermatology** | `DS` | 10 | Dermatology | Specialist Clinic | `VERIFIED` |
| **Cardiology** | `CARDIO` | 6 | Cardiology | Specialist Clinic | `VERIFIED` |
| **ENT (Otolaryngology)** | `ENT` | 37 | Otolaryngology - ENT | Specialist Clinic | `VERIFIED` |
| **Orthopedics** | `ORTHOSURG` | 36 | Orthopedic surgery | Specialist Clinic | `VERIFIED` |
| **Obstetrics & Gynecology** | `OBGYN` | 33 | Obstetrics and gynecology | Specialist Clinic | `VERIFIED` |
| **Ophthalmology** | `OPHTALMO` | 35 | Ophthalmology | Specialist Clinic | `VERIFIED` |
| **Dental / Oral Medicine** | `PRIMARY-ORAL` | 71 | Oral Medicine (Primary Care) | Specialist Clinic | `VERIFIED` |

---

## 2. Diagnostic & Clinical Support Specialties

| Diagnostic Function | GNU Health Code | System ID | Official Model Name | Department | Status |
| :--- | :---: | :---: | :--- | :--- | :--- |
| **Laboratory Medicine** | `LAB` | 8 | Clinical laboratory sciences | Laboratory | `VERIFIED` |
| **Diagnostic Radiology** | `RADIO` | 48 | Radiology | Radiology | `VERIFIED` |
| **Nursing & Triage** | `NURSING` | 32 | Nursing | Nursing / Triage | `VERIFIED` |
| **Clinical Nutrition** | `NUTRITION` | 11 | Nutrition | Outpatient / Wellness | `VERIFIED` |

---

## 3. Governance & Policy Rules

1. **No Duplication**: The 73 existing GNU Health specialty records are reused directly. No duplicate or redundant specialty records have been or will be created.
2. **Doctor Assignment**: Physician association to these specialties remains `PENDING_CLINIC_INPUT` until official Qatar Ministry of Public Health (MOPH) / QCHP physician licenses and credentials are submitted.
3. **Activation**: Candidate specialties will only be operationalized as active clinical schedules upon confirmed staffing by clinic leadership.
