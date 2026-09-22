# 07 — Department and Facility Configuration

**Document:** `07_DEPARTMENT_CONFIGURATION.md`  
**Model:** `gnuhealth.hospital.unit`  
**Institution:** `<CLINIC_NAME>` (`CLINIC-QA`, ID: 2)  
**Status:** `CONFIGURED` / `VERIFIED`

---

## 1. Outpatient Clinic Department Structure

All 8 primary outpatient departments have been configured in GNU Health's native hospital unit model (`gnuhealth.hospital.unit`), linked directly to the main health institution:

| Department Name | Code | Unit ID | Parent Institution | Operational Scope | Responsible Person | Status |
| :--- | :---: | :---: | :--- | :--- | :--- | :---: |
| **Outpatient Department** | `OPD` | 1 | Clinic (`CLINIC-QA`) | General and Specialist Consultations | `<PENDING_CLINIC_INPUT>` | `CONFIGURED` |
| **Nursing / Triage** | `NURS` | 2 | Clinic (`CLINIC-QA`) | Vital Signs, Initial Triage, Dressings | `<PENDING_CLINIC_INPUT>` | `CONFIGURED` |
| **Pharmacy** | `PHARM` | 3 | Clinic (`CLINIC-QA`) | Prescription Review, Dispensing, Stock | `<PENDING_CLINIC_INPUT>` | `CONFIGURED` |
| **Laboratory** | `LAB` | 4 | Clinic (`CLINIC-QA`) | Specimen Collection, Diagnostic Analysis | `<PENDING_CLINIC_INPUT>` | `CONFIGURED` |
| **Radiology** | `RAD` | 5 | Clinic (`CLINIC-QA`) | Diagnostic Imaging (XR, US, CT, MRI) | `<PENDING_CLINIC_INPUT>` | `CONFIGURED` |
| **Billing / Accounts** | `BILL` | 6 | Clinic (`CLINIC-QA`) | Invoicing, Copay Collection, Cashier | `<PENDING_CLINIC_INPUT>` | `CONFIGURED` |
| **Insurance** | `INS` | 7 | Clinic (`CLINIC-QA`) | Eligibility Check, Pre-Authorizations | `<PENDING_CLINIC_INPUT>` | `CONFIGURED` |
| **Administration** | `ADMIN` | 8 | Clinic (`CLINIC-QA`) | Executive Leadership, Human Resources | `<PENDING_CLINIC_INPUT>` | `CONFIGURED` |

---

## 2. Facility Infrastructure & Consultation Rooms

- **Physical Building**: Main Clinic Facility (`<CLINIC_ADDRESS>`, Zone `<ZONE>`, Building `<BUILDING>`, `<CITY>`, Qatar)
- **Consulting Rooms**:
  - `Room 1 - General Consultation` (`PENDING_CLINIC_INPUT`)
  - `Room 2 - Internal Medicine` (`PENDING_CLINIC_INPUT`)
  - `Room 3 - Pediatrics` (`PENDING_CLINIC_INPUT`)
  - `Room 4 - Dermatology` (`PENDING_CLINIC_INPUT`)
  - `Triage & Treatment Room` (`PENDING_CLINIC_INPUT`)
  - `Phlebotomy & Sample Collection Area` (`PENDING_CLINIC_INPUT`)
  - `Diagnostic Imaging Suite` (`PENDING_CLINIC_INPUT`)
  - `Outpatient Pharmacy Counter` (`PENDING_CLINIC_INPUT`)
