# User Role and Security Matrix: Qatar Outpatient Clinic

**Document:** `06_USER_ROLE_MATRIX.md`  
**Security Model:** Tryton / GNU Health Role-Based Access Control (RBAC)  
**Principle:** Principle of Least Privilege (PoLP)  
**Status:** `VERIFIED`

---

## 1. Operational Roles & Security Group Mapping

Every clinic function is mapped directly to GNU Health / Tryton native security groups (`res.group`). No user is granted excessive administrative rights.

| Operational Role | Primary GNU Health / Tryton Groups | Group IDs | Granted Functional Permissions |
| :--- | :--- | :---: | :--- |
| **Receptionist / Front Desk** | • `Health Front Desk`<br>• `Party Administration` | 14, 3 | • Patient registration and demographic updates<br>• National ID (QID) / Passport recording<br>• Patient appointment scheduling & search<br>• Patient arrival check-in and queue management<br>• Initial demographic verification |
| **Triage / Clinic Nurse** | • `Health Nurse`<br>• `Health Nurse Administration` | 13, 12 | • Access waiting queue<br>• Patient triage & clinical evaluations<br>• Recording vital signs (BP, Pulse, Temp, RR, SpO2, BMI)<br>• Ambulatory nursing care and dressing procedures<br>• Allergy and triage history updates |
| **Attending Physician / Doctor** | • `Health Doctor`<br>• `Health Services Administration` | 15, 27 | • Full electronic medical record (EMR) access<br>• Outpatient consultation encounters<br>• WHO ICD-10 clinical diagnosis assignment<br>• Electronic prescription generation<br>• Laboratory and radiology test orders<br>• Clinical follow-up scheduling |
| **Outpatient Pharmacist** | • `Health Back Office`<br>• `Product Administration` | 17, 9 | • Inpatient/outpatient prescription review<br>• Verification of drug dosages, forms, and routes<br>• Medication dispensing and counseling log<br>• Pharmacy inventory & stock location oversight |
| **Radiology Technician / Radiologist** | • `Health Imaging`<br>• `Health Imaging Administration` | 20, 21 | • Access diagnostic radiology worklist<br>• Medical imaging study request processing<br>• Image acquisition status management<br>• Diagnostic imaging report entry and validation |
| **Laboratory Technician / Pathologist** | • `Health Lab`<br>• `Health lab Administration` | 23, 22 | • Laboratory test request order intake<br>• Specimen/sample collection and tracking<br>• Analyte result entry against standard units<br>• Critical value reporting & result verification |
| **Billing & Accounts Officer** | • `Account`<br>• `Account Administration`<br>• `Health Back Office` | 6, 8, 17 | • Outpatient consultation fee invoicing (QAR)<br>• Diagnostic service fee invoicing<br>• Patient copay and cash/card payment collection<br>• Daily cashier reconciliation & financial reporting |
| **Insurance Coordinator** | • `Health Back Office`<br>• `Health Services Administration` | 17, 27 | • Patient health insurance policy verification<br>• Pre-authorization requests and coverage validation<br>• Insurance claims compilation and tracking |
| **Clinic Medical Director / Manager** | • `Health Administration`<br>• `Company Administration`<br>• `Employee Administration` | 11, 4, 5 | • Clinic-wide operational and appointment reports<br>• Departmental performance monitoring<br>• Clinical workflow oversight<br>• Staff assignment management |
| **System Administrator** | • `Administration` | 1 | • Database maintenance, configuration, backups<br>• System user credential provisioning<br>• Technical audit trail and security compliance |

---

## 2. Staff Account Provisioning Policy

> [!IMPORTANT]
> **No Fictional Accounts**: Real staff logins are not created until official employee names and verified credentials are provided by clinic management.

All staff accounts will follow the naming convention:
- **Format**: `firstinitial.lastname` (e.g., `s.almarri`, `m.khan`)
- **Default Status**: Inactive until mandatory privacy and HIPAA/MOPH compliance training completion.
- **Passwords**: Generated cryptographically with mandatory initial password rotation.
