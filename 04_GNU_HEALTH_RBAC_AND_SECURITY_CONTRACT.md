# GNU Health HMIS — Role-Based Access Control (RBAC) & Security Contract
## Authoritative Security Boundaries, Permissions Matrix & Defensive Invariants

**Document Reference:** `GH-SEC-RBAC-004`  
**System Target:** GNU Health HMIS 5.0.6 / Tryton Framework 7.0.57  
**Enforcement Engine:** Tryton Kernel Native Security (`ir.model.access`, `ir.rule`, Field Access)  
**Audience:** Security Officers, Frontend Architects, Compliance Auditors

---

## 1. Security Philosophy & Architectural Invariants

### 1.1 Defense in Depth
Security in GNU Health is enforced at the database and application kernel levels. The frontend application is strictly an untrusted client:

```
[ FRONTEND APPLICATION ] ---> Cosmetic UI Hiding (UX convenience only)
           |
           | Authenticated JSON-RPC Request (Session Token)
           v
[ NGINX REVERSE PROXY ]  ---> TLS Termination, Buffer Hardening, Rate Limiting
           |
           | Internal Dispatch (127.0.0.1:8000)
           v
[ TRYTON ORM KERNEL ]    ---> AUTHORITATIVE SECURITY ENFORCEMENT
                              - Model Access Table (ir.model.access)
                              - Record Domain Rules (ir.rule)
                              - Field Readonly State Machines
                              - Workflow Transition Validators
           |
           v
[ POSTGRESQL RDBMS ]     ---> Non-superuser Connection, Strict FK Constraints
```

### 1.2 Core Architectural Invariants:
1. **Backend Remains Authoritative:** Hiding a button, link, or form field in the frontend interface does **not** constitute security. Every JSON-RPC method invocation is checked against the user's role groups by the Tryton kernel.
2. **Strict Least Privilege:** Users possess only the minimum permissions required to perform their departmental duties.
3. **Immutability of Clinical Records:** Completed evaluations (`state='signed'`) and validated prescriptions (`state='done'`) cannot be modified or deleted by any non-administrative user.
4. **Immutability of Financial Ledgers:** Posted invoices (`state='posted'`) and general ledger moves (`state='posted'`) are permanently locked against editing or deletion.

---

## 2. Operational Role Matrix & Permission Allocations

The GNU Health implementation defines seven verified operational roles. Each role maps to native Tryton groups:

| Role Name | Demo User Login | Primary Functional Domain | Assigned Tryton Security Groups |
| :--- | :--- | :--- | :--- |
| **Front Desk** | `demo_frontdesk1` | Reception, Registration, Scheduling | `Health Front Desk` |
| **Nurse** | `demo_nurse1` | Outpatient Triage, Vital Signs | `Health Nurse` |
| **Physician** | `demo_dr1` | Clinical Consultation, Prescriptions | `Health Doctor` |
| **Laboratory** | `demo_lab1` | Pathology Requisitions, Results Entry | `Health Lab` |
| **Radiology** | `demo_rad1` | Medical Imaging, Study Reports | `Health Imaging` |
| **Cashier** | `demo_cashier1` | Patient Invoicing, Cash Settlement | `Account`, `Accounting Party` |
| **Administrator**| `demo_admin1` | User Management, System Config | `Administration`, `Health Administration` |

---

## 3. Comprehensive Model-Level Permission Matrix

| Model Technical Name | Business Entity | Front Desk | Nurse | Physician | Laboratory | Radiology | Cashier | Administrator |
| :--- | :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| `party.party` | Person Identities | R / C / W | R / C / W | R / C / W | R | R | R | Full |
| `gnuhealth.patient` | Patient Clinical Files | R / C / W | R | R / W | R | R | R | Full |
| `gnuhealth.appointment` | Clinic Appointments | R / C / W | R / W | R / W | R | R | R | Full |
| `gnuhealth.patient.evaluation` | Clinical Evaluations | **DENY** | R / C / W (Triage)| R / C / W / S | **DENY** | **DENY** | **DENY** | Full |
| `gnuhealth.pathology` | ICD-10 Diagnoses Catalog | R | R | R | R | R | R | Full |
| `gnuhealth.prescription.order` | Medication Orders | **DENY** | R | R / C / W / V | **DENY** | **DENY** | **DENY** | Full |
| `gnuhealth.lab` | Laboratory Requisitions | **DENY** | R | R / C | R / C / W / V | **DENY** | **DENY** | Full |
| `gnuhealth.imaging.test.request` | Medical Imaging Requests | **DENY** | R | R / C | **DENY** | R / C / W / V | **DENY** | Full |
| `gnuhealth.health_service` | Health Service Bundles | R | R | R / C / W | R | R | R / W | Full |
| `account.invoice` | Customer Invoices | **DENY** | **DENY** | **DENY** | **DENY** | **DENY** | R / C / W / P | Full |
| `account.move` | General Ledger Moves | **DENY** | **DENY** | **DENY** | **DENY** | **DENY** | R / P / Rec | Full |
| `res.user` | System Users | **DENY** | **DENY** | **DENY** | **DENY** | **DENY** | **DENY** | Full |

*Legend: R = Read, C = Create, W = Write, S = Sign, V = Validate, P = Post, Rec = Reconcile, Full = Complete CRUD.*

---

## 4. Negative Testing & Boundary Enforcement Evidence

The platform was subjected to explicit negative boundary testing both via automated API calls and live browser interactions:

### Test Case A: Front Desk Prohibited from Clinical Prescriptions
- **Action:** Front Desk user (`demo_frontdesk1`) attempted to access and write to `gnuhealth.prescription.order`.
- **Observed Behavior:** Tryton returned `AccessError: You are not allowed to access "Prescription Order".`
- **UI Evidence:** Global search in browser returned empty result set (`[]`). Verified in screenshot `17_frontdesk_negative.png`.

### Test Case B: Cashier Prohibited from Clinical Consultations
- **Action:** Cashier user (`demo_cashier1`) attempted to access `gnuhealth.patient.evaluation`.
- **Observed Behavior:** Tryton returned `AccessError: You are not allowed to access "Patient Evaluation".`
- **UI Evidence:** Global search in browser returned empty result set (`[]`). Verified in screenshot `18_cashier_negative.png`.

### Test Case C: Physician Prohibited from General Ledger Move Administration
- **Action:** Physician user (`demo_dr1`) attempted to access `account.move`.
- **Observed Behavior:** Tryton returned `AccessError: You are not allowed to access "Account Move".`
- **UI Evidence:** Global search in browser returned empty result set (`[]`). Verified in screenshot `19_physician_negative.png`.

### Test Case D: Clinical Immutability Enforcement
- **Action:** Attempted modification of signed patient evaluation (`gnuhealth.patient.evaluation,15`).
- **Observed Behavior:** Tryton blocked record alteration due to native state machine rules (`state == 'signed'`).

### Test Case E: Financial Immutability Enforcement
- **Action:** Attempted deletion of posted customer invoice (`INV-2026/00014`).
- **Observed Behavior:** Tryton raised `AccessError: You cannot modify invoice "INV-2026/00014" because it is posted, paid or cancelled.`

---

## 5. Mandatory Frontend Security Rules (17 Invariants)

The upcoming frontend development team **must strictly adhere** to the following security rules:

1. **Never Connect Directly to PostgreSQL:** The frontend must never include database drivers or connect to port 5432.
2. **Never Store Database Credentials in Frontend Code:** Database passwords must never exist in frontend code, configuration, or environment files.
3. **Never Embed Administrator Credentials:** The frontend application must not embed or use administrative service accounts.
4. **Never Bypass Tryton Authentication:** Every user must authenticate individually with their own credentials.
5. **Never Bypass Native RBAC:** The frontend must never bypass permission checks or assume all users have full access.
6. **Never Duplicate Accounting Calculations:** General ledger debits, credits, and tax amounts must never be calculated in JavaScript.
7. **Never Duplicate Clinical Decision Support:** Drug interaction and dosage rules must execute on the backend.
8. **Never Assume UI Hiding Equals Authorization:** Always expect that a user could theoretically forge an API call; ensure the backend rejects it.
9. **Always Handle Backend Permission Errors:** Catch `AccessError` exceptions gracefully and present clear, informative access-denied feedback.
10. **Always Handle Session Expiration:** Catch HTTP `401 Unauthorized` responses and route the user to the re-authentication screen without data corruption.
11. **Do Not Trust Frontend Validation Alone:** Client-side form validation is a UX feature; backend constraints are the authoritative gate.
12. **The Backend Remains Authoritative:** When a conflict occurs between client state and server response, the server state wins.
13. **Use HTTPS in Production:** All production traffic must pass through TLS 1.3 encryption on port 443.
14. **Never Expose Secrets in Client Bundles:** No private keys, API secrets, or server tokens may be included in Webpack/Vite/Next.js client bundles.
15. **Never Place Service Credentials in Local Storage:** Store session tokens only in secure memory or HTTP-only cookies.
16. **Do Not Persist Plaintext Passwords:** Do not cache user passwords in `localStorage`, `sessionStorage`, or IndexedDB.
17. **Do Not Create Shadow Records:** Every patient, visit, and bill must be stored exclusively in GNU Health.
