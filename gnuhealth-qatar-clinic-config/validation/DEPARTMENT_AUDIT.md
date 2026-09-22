# Clinic Department & Hospital Units Audit

**Audit Date**: 2026-09-21  
**Database**: `gnuhealth`  
**Status**: `VERIFIED`  

---

## 1. Objective

To audit the organizational subunits (`gnuhealth.hospital.unit`) configured within the healthcare institution to support outpatient operational routing, triage, dispensing, diagnostic work, and administrative functions.

---

## 2. Configured Hospital Units Inventory

All units are attached to Institution ID 2 (`CLINIC-QA`):

| ID | Code | Department / Unit Name | Institution ID | Operational Scope | Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **1** | `OPD` | Outpatient Department | 2 | General Practitioner & Specialist consultation rooms | `VERIFIED` |
| **2** | `NURS` | Nursing / Triage | 2 | Patient intake, height, weight, vital signs triage | `VERIFIED` |
| **3** | `PHARM` | Pharmacy | 2 | Prescription order review and medication dispensing | `VERIFIED` |
| **4** | `LAB` | Laboratory | 2 | Specimen collection, clinical pathology, test result entry | `VERIFIED` |
| **5** | `RAD` | Radiology | 2 | Diagnostic imaging (X-Ray, Ultrasound) requisitions | `VERIFIED` |
| **6** | `BILL` | Billing / Accounts | 2 | Patient fee collection, copay processing, receipt issue | `VERIFIED` |
| **7** | `INS` | Insurance | 2 | Payer eligibility verification, pre-authorizations | `VERIFIED` |
| **8** | `ADMIN`| Administration | 2 | HR, clinic management, operational oversight | `VERIFIED` |

---

## 3. Operational Integration

1. **Patient Intake & Triage Flow**:
   - Patient arrives at reception -> Routed to `NURS` for vital signs -> Transferred to assigned physician in `OPD`.
2. **Ancillary Diagnostic Flow**:
   - Doctor in `OPD` enters diagnostic orders -> Orders immediately visible in `LAB` or `RAD` unit worklists.
3. **Discharge & Settling Flow**:
   - Doctor concludes encounter -> Patient routed to `BILL` for invoice settlement / copay -> Transferred to `PHARM` for medication dispensing upon payment confirmation.

---

## 4. Pending Clinic Management Customization

> [!NOTE]
> Physical room numbers (e.g., OPD Clinic Room 101, Consultation Room 102), specific nurse triage stations, and equipment IDs remain `PENDING_CLINIC_INPUT` until clinic floorplan and room assignments are finalized.
