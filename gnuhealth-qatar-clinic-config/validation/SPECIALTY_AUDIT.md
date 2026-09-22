# Medical Specialty Master Audit

**Audit Date**: 2026-09-21  
**Database**: `gnuhealth`  
**Status**: `VERIFIED`  

---

## 1. Objective

To audit the clinical specialty catalog within GNU Health 5.0 (`gnuhealth.specialty`), verifying master data integrity, duplicate checks, and mapping against Qatar Council for Healthcare Practitioners (QCHP) outpatient licensing categories.

---

## 2. Quantitative Verification

- **Total Live Records**: `73`
- **Duplicate Specialties Found**: `0`
- **Source**: Preloaded international standard medical specialties from GNU Health core module.

---

## 3. QCHP Outpatient Clinic Scope Mapping

The 73 preloaded specialties cover standard outpatient private clinic disciplines licensed by the Qatar Ministry of Public Health (MOPH) / QCHP:

| Specialty Name | Code / ID | QCHP Scope Mapping | Supported in Base GNU Health |
| :--- | :--- | :--- | :--- |
| **General Practice** | ID 59 / `gp` | Primary Care & Family Medicine | Yes |
| **Internal Medicine** | Standard | Adult General Medicine & Chronic Care | Yes |
| **Pediatrics** | Standard | Child & Adolescent Care | Yes |
| **Obstetrics & Gynecology** | Standard | Women's Health & Antenatal Care | Yes |
| **Dermatology** | Standard | Skin Conditions & Outpatient Procedures | Yes |
| **Cardiology** | Standard | Cardiovascular Outpatient Consults | Yes |
| **Otorhinolaryngology (ENT)** | Standard | Ear, Nose, Throat Consultations | Yes |
| **Ophthalmology** | Standard | Eye Exams & Vision Testing | Yes |
| **Orthopedics** | Standard | Musculoskeletal & Sports Medicine | Yes |
| **Dental Surgery** | Standard | General Dentistry & Oral Health | Yes |
| **Endocrinology & Metabolism**| Standard | Diabetes & Thyroid Clinics | Yes |
| **Psychiatry** | Standard | Mental Health & Psychology Services | Yes |

---

## 4. Operational Doctor Mapping Policy

- Prior to onboarding clinical staff, each doctor's official QCHP evaluation certificate must be reviewed to assign their primary specialty (`mainsp = True`).
- Subspecialties or secondary qualifications can be mapped via `gnuhealth.hp_specialty` without modifying the core 73 specialty definitions.
- Current live count of assigned doctor specialties: **0** (All test records purged).
