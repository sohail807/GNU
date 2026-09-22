# FINAL REQUIREMENTS BASELINE — GNU HEALTH HMIS OUTPATIENT CLINIC

**Project**: GNU Health HMIS 5.0 / Tryton 7.0 Implementation  
**Document**: `FINAL_REQUIREMENTS_BASELINE.md`  
**Classification**: Authoritative Requirements Baseline  
**Scope**: Primary Outpatient & Ambulatory Healthcare Facility (State of Qatar)  
**Status**: Current requirements baseline pending formal clinic stakeholder sign-off  

---

## 1. Baseline Declaration & Scope Demarcation

This document establishes the single authoritative requirements baseline for the GNU Health outpatient clinic implementation. 

### Scope Boundaries:
- **IN SCOPE**: Outpatient reception, appointment scheduling, nursing triage, physician clinical encounter (SOAP), electronic prescribing, outpatient laboratory ordering & result entry, outpatient radiology ordering & reporting, outpatient cash/card billing, local health insurance copay tracking, and role-based access control.
- **OUT OF SCOPE (DORMANT)**: Acute inpatient hospitalization, bed allocation, inpatient ward rounds, intensive care units (ICU), and major operating theater surgical protocols. (While backend modules exist in the Tryton engine, they are excluded from clinic operational navigation).

---

## 2. Core Outpatient Functional Requirements

### 2.1 Patient Management (`PAT`)
* **PAT-REQ-01: Patient Registration**: The system shall register new patients capturing legal name (in English and Arabic), date of birth, biological sex, marital status, and primary contact phone number.
* **PAT-REQ-02: Patient Identification**: The system shall generate a unique, immutable Medical Record Number / Patient Unique Identifier (PUID) with the country prefix `QAT` upon record creation.
* **PAT-REQ-03: Demographics & Nationality**: The system shall record patient nationality, residence status, and primary spoken language from preloaded country masters.
* **PAT-REQ-04: Official Identification Documents**: The system shall capture the patient's 11-digit Qatar National ID (QID) as primary identification, or Passport Number and Issuing Country for expatriate visitors/tourists.
* **PAT-REQ-05: Contact & Emergency Information**: The system shall record home address, mobile phone number, email address, and next-of-kin / emergency contact details.
* **PAT-REQ-06: Patient Search**: The system shall allow front-desk, nursing, and clinical staff to locate patient records rapidly using PUID, QID, Passport Number, Full Name, or Phone Number.
* **PAT-REQ-07: Duplicate Handling**: The system shall prevent duplicate patient registration by alerting staff when matching QID or birthdate + phone number combinations are entered.
* **PAT-REQ-08: Patient History Tracking**: The system shall maintain an immutable chronological history of all clinical encounters, vitals, diagnostic results, and prescriptions associated with the patient PUID.

---

### 2.2 Appointment & Scheduling (`APT`)
* **APT-REQ-01: Appointment Creation**: Front-desk staff shall create future and same-day patient appointments linked to the patient record.
* **APT-REQ-02: Doctor & Specialty Assignment**: Appointments must be booked against a specific registered healthcare professional and their authorized medical specialty.
* **APT-REQ-03: Appointment Types**: The system shall categorize bookings by appointment type (New Patient Consultation, Specialist Follow-up, Routine Checkup, Urgent Walk-in).
* **APT-REQ-04: Date & Time Scheduling**: Appointments shall be scheduled into defined calendar slots respecting physician working hours and room allocations.
* **APT-REQ-05: Cancellation & Reason Tracking**: The system shall allow cancellation of appointments, requiring a documented cancellation reason.
* **APT-REQ-06: Rescheduling**: Front-desk staff shall have the ability to reschedule booked appointments to alternative available slots while retaining historical audit logs.
* **APT-REQ-07: Walk-in Management**: The system shall accommodate unscheduled walk-in patients by creating immediate appointments inserted into the triage queue.
* **APT-REQ-08: Daily Patient Queue**: The system shall display a real-time status queue (`draft` -> `confirmed` -> `checked_in` -> `in_consultation` -> `done` -> `cancelled`).

---

### 2.3 Reception & Intake (`REC`)
* **REC-REQ-01: Patient Arrival & Check-In**: Front-desk staff shall mark arriving patients as `checked_in`, timestamping patient arrival.
* **REC-REQ-02: Demographic Verification**: Staff shall verify contact details and active insurance coverage upon arrival before queuing for triage.
* **REC-REQ-03: Triage Queue Handoff**: Marking check-in shall automatically transition the patient record into the nursing triage queue.
* **REC-REQ-04: Front-Desk Invoicing Handoff**: For self-pay patients requiring pre-consultation payment, reception shall generate the consultation invoice.

---

### 2.4 Nursing & Triage (`TRG`)
* **TRG-REQ-01: Nursing Intake**: Triage nurses shall access checked-in patients directly from the departmental triage list.
* **TRG-REQ-02: Vital Signs Recording**: The system shall record baseline physiological vitals:
  - Blood Pressure (Systolic / Diastolic in mmHg)
  - Heart Rate / Pulse (beats per minute)
  - Respiratory Rate (breaths per minute)
  - Body Temperature (degrees Celsius)
  - Oxygen Saturation ($SpO_2$ in %)
* **TRG-REQ-03: Anthropometric Calculations**: The system shall capture Patient Weight (kg) and Height (cm), automatically calculating Body Mass Index (BMI).
* **TRG-REQ-04: Triage Categorization**: The nurse shall assign a triage priority category (Emergency, Urgent, Normal Routine) based on patient clinical presentation.
* **TRG-REQ-05: Nursing Assessment & Allergies**: The nurse shall record known allergies, current home medications, and chief complaint.
* **TRG-REQ-06: Doctor Queue Handoff**: Saving the triage assessment shall advance the patient to the assigned doctor's consultation waiting room queue.

---

### 2.5 Physician Clinical Encounter (`CON`)
* **CON-REQ-01: Clinical History & Vitals Review**: The consulting physician shall review the triage vitals, historical encounters, chronic diseases, and documented allergies.
* **CON-REQ-02: Chief Complaint & HPI**: The physician shall document the reason for visit and history of present illness.
* **CON-REQ-03: Physical Examination**: The physician shall record structured physical examination findings across body systems.
* **CON-REQ-04: Diagnostic Coding (ICD-10)**: The physician shall select one primary diagnosis and optional secondary diagnoses from the preloaded WHO ICD-10 pathology catalog (14,416 codes).
* **CON-REQ-05: Clinical Assessment & Plan**: The physician shall record the diagnostic assessment and therapeutic management plan.
* **CON-REQ-06: Order Generation**: The physician shall have the ability to trigger ancillary requisitions (Laboratory orders, Radiology requests, and Electronic Prescriptions) directly from the consultation form.
* **CON-REQ-07: Follow-up & Referrals**: The physician shall specify follow-up instructions (e.g. return in 7 days) or document internal/external specialty referrals.
* **CON-REQ-08: Legal Immutability & Sign-Off**: Once a clinical evaluation is signed and marked as `done`, it shall become permanently read-only (`perm_delete = False`), ensuring medical-legal immutability.

---

### 2.6 Pharmacy & E-Prescribing (`PHR`)
* **PHR-REQ-01: Electronic Prescription Creation**: Physicians shall generate outpatient prescription orders specifying medication, strength, dosage form, administration route, frequency, and treatment duration.
* **PHR-REQ-02: Clinical Safety Warnings**: The prescribing engine shall automatically warn clinicians of known patient drug allergies and pregnancy contraindications (`SM-CORE-0018`).
* **PHR-REQ-03: Formulary Medication Catalog**: Prescriptions must select medications from an approved commercial drug catalog (`gnuhealth.medicament`) linked to standard dosage forms (94 forms) and routes (47 routes).
* **PHR-REQ-04: Pharmacist Prescription Verification**: The pharmacy technician/pharmacist shall review incoming digital prescriptions for clinical appropriateness and dosage verification.
* **PHR-REQ-05: Stock Availability Check**: The pharmacy module shall verify local clinic dispensary stock availability prior to dispensing.
* **PHR-REQ-06: Dispensing Workflow**: The pharmacist shall record the dispensed batch/lot number, expiry date, and quantity handed to the patient.
* **PHR-REQ-07: Pharmacy Billing Generation**: Dispensed medications shall automatically generate customer invoice lines linked to the patient billing account.
* **PHR-REQ-08: Medication Returns**: The system shall support pharmacy returns for unopened, unexpired medications, generating corresponding credit notes.

---

### 2.7 Laboratory Investigations (`LAB`)
* **LAB-REQ-01: Laboratory Test Requisition**: Physicians shall order diagnostic tests selecting from the clinic laboratory catalog categorized across the 9 preloaded test domains.
* **LAB-REQ-02: Specimen Collection & Tracking**: The laboratory staff shall log sample collection timestamps, specimen type (blood, urine, swab), and accession identifiers.
* **LAB-REQ-03: Worklist Management**: Lab technicians shall view pending specimen queues filtered by priority (Routine vs Urgent/Stat).
* **LAB-REQ-04: Results Entry & Reference Ranges**: Technicians shall input numeric or qualitative findings; the system shall automatically flag abnormal results outside established reference ranges.
* **LAB-REQ-05: Pathologist / Lead Verification**: Laboratory results must undergo formal verification and sign-off by an authorized laboratory supervisor before release.
* **LAB-REQ-06: Clinical Notification**: Verified results shall become immediately visible to the requesting physician in the patient clinical record.
* **LAB-REQ-07: Laboratory Billing Trigger**: Validating a laboratory requisition shall trigger an automatic billing charge in the patient invoice.

---

### 2.8 Radiology & Medical Imaging (`RAD`)
* **RAD-REQ-01: Imaging Study Requisition**: Physicians shall order radiological exams from the 8 preloaded modalities (X-Ray, Ultrasound, CT, MRI, Mammography, etc.).
* **RAD-REQ-02: Clinical Indication**: Requisitions must require a documented clinical indication and requested anatomic region.
* **RAD-REQ-03: Examination Logging**: Radiology technicians shall log procedure execution, contrast media usage (if applicable), and completion timestamp.
* **RAD-REQ-04: Radiologist Diagnostic Reporting**: The interpreting radiologist shall record structured diagnostic findings, impressions, and recommendations.
* **RAD-REQ-05: Report Verification**: The radiology report must be verified and digitally signed, locking the report against subsequent alteration.
* **RAD-REQ-06: PDF Report Archiving**: The system shall attach the final signed radiology report as a PDF to the patient medical record.
* **RAD-REQ-07: Radiology Billing Trigger**: Executing an imaging study shall generate an invoice line item linked to the radiology revenue account.
* **RAD-REQ-08: PACS / DICOM Interfacing (POTENTIAL / OPTIONAL INTEGRATION)**: External integration has not yet been formally confirmed as a clinic requirement. Technical assessment should occur only after the clinic provides the required business and integration specifications. If a clinic PACS server is deployed, studies shall reference DICOM Accession Numbers for image retrieval via external DICOM viewers.

---

### 2.9 Billing & Invoicing (`BIL`)
* **BIL-REQ-01: Unified Service Catalog**: The system shall maintain a centralized catalog of billable services (consultations, lab tests, imaging procedures, nursing treatments) with prices in Qatari Riyal (`QAR`).
* **BIL-REQ-02: Automated Charge Aggregation**: Medical orders (consultation fees, lab tests, imaging studies, pharmacy prescriptions) shall automatically consolidate into a single patient encounter invoice.
* **BIL-REQ-03: Invoice Validation & Fiscal Period Check**: Invoice posting to the general ledger shall validate that an open fiscal year and active accounting period exist in `account.fiscalyear`.
* **BIL-REQ-04: Multi-Payment Methods**: Cashiers shall record payments across multiple tenders:
  - Cash (QAR notes and dirhams)
  - Debit/Credit Card (POS terminal transaction reference)
  - Bank Transfer
  - Insurance Split (Patient Copay + Payer Receivable)
* **BIL-REQ-05: Official Printed Receipt**: The cashier shall print an official patient payment receipt displaying clinic legal details, invoice number, date, breakdown of services, VAT (if applicable: 0%), amount paid, and balance.
* **BIL-REQ-06: Discounts & Fee Adjustments**: Authorized financial managers shall have the ability to apply approved percentage or flat discounts with mandatory reason documentation.
* **BIL-REQ-07: Refunds & Credit Notes**: The billing module shall support authorized service cancellations and payment refunds through formal credit note issuance.
* **BIL-REQ-08: Cashier Shift Reconciliation**: The system shall generate daily cashier collection reports reconciling cash drawer totals against posted system receipts.

---

### 2.10 Health Insurance Management (`INS`)
* **INS-REQ-01: Insurance Payer Master (CONTRACTED INSURANCE PAYERS — PENDING CLINIC INPUT)**: The system shall maintain records of contracted private health insurance providers and Third-Party Administrators (TPAs) once supplied by the clinic.
* **INS-REQ-02: Patient Policy Registration**: Reception staff shall capture patient insurance details: Payer Name, Member Policy Number, Card Number, Expiry Date, Network Tier, and Plan Name.
* **INS-REQ-03: Copay & Deductible Tracking**: The system shall calculate patient out-of-pocket copayments (e.g. 20% copay up to a fixed maximum ceiling) versus the insurer-covered balance (e.g. 80%).
* **INS-REQ-04: Dual-Line Invoicing**: Invoices shall split receivable lines into Patient Payable (collected at checkout) and Insurance Company Receivable (batched for settlement).
* **INS-REQ-05: Prior Authorization Tracking**: The system shall record Prior Authorization Request numbers and approval status for restricted diagnostic or surgical procedures.
* **INS-REQ-06: Batch Claim Settlement**: The accounting module shall support posting bulk settlement remittances received from insurance payers against outstanding claims.

---

## 3. Non-Functional Requirements (`NFR`)

### 3.1 Security & Access Control (`SEC`)
* **SEC-REQ-01: Transport Encryption (TLS)**: All communication between clients and the application server must be encrypted in transit using TLS 1.3 over HTTPS (Port 443). Plain HTTP (Port 80) must redirect automatically to HTTPS.
* **SEC-REQ-02: Application Port Hardening**: Internal Tryton daemon port (TCP 8000) must be restricted to internal loopback (`127.0.0.1`) and completely blocked from public internet exposure via firewall rules.
* **SEC-REQ-03: Credential Hardening**: Administrative provisioning passwords must be replaced with strong, 24-character enterprise passphrases. Individual staff accounts must have unique credentials; shared generic logins are prohibited.
* **SEC-REQ-04: Role-Based Access Control (RBAC)**: Access permissions must follow the principle of least privilege, mapping users strictly to their functional operational groups.
* **SEC-REQ-05: Audit Logging**: The system shall record timestamps, user IDs, and record identifiers for all patient record creations, modifications, and financial transactions.
* **SEC-REQ-06: Secrets Management**: Database passwords and encryption keys must reside strictly in protected server configuration files (`trytond.conf`) with restricted OS permissions (`chmod 600`), completely excluded from source repositories.

---

### 3.2 Performance & Scalability (`PERF`)
* **PERF-REQ-01: Target User Capacity**: The system shall support up to 50 concurrent administrative and clinical users without service degradation.
* **PERF-REQ-02: Response Latency**: Core clinical and administrative UI actions (patient search, form loading, appointment saving) shall execute in less than 1.5 seconds under normal network conditions.
* **PERF-REQ-03: Database Indexing & Query Efficiency**: Common search fields (PUID, National ID, Phone, ICD-10 code, Invoice number) must maintain active B-Tree database indexes in PostgreSQL.

---

### 3.3 Availability & Disaster Recovery (`AVAIL`)
* **AVAIL-REQ-01: Automated Database Backups**: The PostgreSQL database must be automatically backed up via scheduled daily cron jobs using `pg_dump`, compressed, and stored in a secure local backup repository.
* **AVAIL-REQ-02: Offsite Backup Replication**: Daily backup archives should be replicated to a secondary cloud storage bucket (e.g. GCP Cloud Storage) with a 30-day retention policy.
* **AVAIL-REQ-03: Recovery Time & Point Objectives**: Recovery Point Objective (RPO) shall be $\le 24$ hours; Recovery Time Objective (RTO) for server reconstitution shall be $\le 2$ hours.
* **AVAIL-REQ-04: Service Supervision**: The Tryton application server must run as a managed `systemd` service (`gnuhealth.service`) with automated restart upon unexpected process termination.

---

### 3.4 Regulatory Compliance & Local Standards (`COMP`)

```text
SECURITY REQUIREMENT

HTTPS/TLS, firewall restrictions, credential rotation, access control,
backup protection and audit controls are required project security
controls.

Formal regulatory compliance must be validated against the applicable
clinic, Qatar regulatory and contractual requirements.
```

* **COMP-REQ-01: Qatar National Currency Compliance**: All accounting books, billing transactions, tariffs, and receipts must be denominated in Qatari Riyal (`QAR`, `ر.ق`) with 2 decimal digits precision.
* **COMP-REQ-02: Healthcare Practitioner Licensing**: Every practicing physician recorded in the system must capture a verified Qatar Council for Healthcare Practitioners (QCHP) license number.
* **COMP-REQ-03: National Patient Identification**: Patient identity capture must natively support Qatar National ID (QID) 11-digit numbers.
* **COMP-REQ-04: Medical Record Immutability**: Signed clinical encounters, diagnostic reports, and posted financial entries must be legally immutable, prohibiting retroactive deletion or alteration.
* **COMP-REQ-05: Data Residency**: In accordance with Qatar health data sovereignty standards, all patient health data and electronic medical records must reside within authorized cloud regions or local infrastructure.

