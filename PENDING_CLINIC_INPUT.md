# PENDING CLINIC INPUT & ONBOARDING DATA CATALOG

**Project**: GNU Health HMIS 5.0 / Tryton 7.0 Implementation  
**Document**: `PENDING_CLINIC_INPUT.md`  
**Classification**: Stakeholder Data Intake & Requirement Collection Framework  
**Scope**: Primary Outpatient & Ambulatory Healthcare Facility (State of Qatar)  
**Status**: ACTIVE INTAKE CATALOG — AWAITING STAKEHOLDER SUBMISSIONS  

---

## 1. Executive Notice to Clinic Leadership

To maintain data integrity and regulatory compliance, the GNU Health technical team will not fabricate or invent clinic data. The implementation is currently waiting on specific business, clinical, operational, and financial inputs from clinic leadership.

This document serves as the formal checklist of all required information.

---

## 2. Granular Data Collection Matrix

### 2.1 Organization & Legal Identity
* **Information Required**: Official clinic commercial trade name (English & Arabic), Commercial Registration (CR) number, Qatar Ministry of Public Health (MoPH) Healthcare Facility License Number, Blue Plate address (Building No, Street No, Zone No).
* **Why Required**: Replaces `<CLINIC_NAME>` placeholder across legal patient invoices, official doctor prescriptions, referral letters, and MoPH diagnostic reports.
* **Who Provides It**: Clinic General Manager / Legal Director.
* **Format**: Official government trade license certificates (PDF) or completed CSV intake sheet.
* **Blocking?**: **YES (CRITICAL BLOCKER)**.

---

### 2.2 Healthcare Professionals (Doctors)
* **Information Required**: Full legal names of all practicing physicians, official Qatar Council for Healthcare Practitioners (QCHP) license numbers, primary medical specialties, assigned consultation room numbers.
* **Why Required**: Physicians must be registered in `gnuhealth.healthprofessional` to enable appointment booking, clinical evaluations, and legal prescription signing.
* **Who Provides It**: Medical Director / HR Department.
* **Format**: Copy of QCHP license credentials + completed CSV doctor intake sheet.
* **Blocking?**: **YES (CRITICAL BLOCKER)**.

---

### 2.3 Operational Staff & User Enrollment
* **Information Required**: Full staff directory across Reception, Nursing, Pharmacy, Laboratory, Radiology, Cashiering, and Accounting (Full Name, Department, Job Title, Clinic Email Address).
* **Why Required**: To provision individual named user accounts in `res.user` mapped to least-privilege security groups.
* **Who Provides It**: HR Manager / Operations Lead.
* **Format**: Excel / CSV staff directory.
* **Blocking?**: **YES (HIGH PRIORITY)**.

---

### 2.4 Clinical Services & Outpatient Menu
* **Information Required**: Full catalog of clinical services provided at the clinic (General Practitioner consultations, Specialist consultations, Follow-up visits, ECG, Injections, Wound Dressing, Nebulization).
* **Why Required**: To configure billable service products in `product.product` linked to departmental cost centers.
* **Who Provides It**: Operations Manager & Medical Director.
* **Format**: Service catalog list with descriptions and standard slot durations.
* **Blocking?**: **YES (CRITICAL BLOCKER)**.

---

### 2.5 Outpatient Service Price Tariffs
* **Information Required**: Approved consultation fee schedule and procedure prices in Qatari Riyal (`QAR`).
* **Why Required**: The 15 preloaded service templates currently contain `0.00 QAR` prices. Legitimate billing and patient invoicing cannot generate charges without approved prices.
* **Who Provides It**: Clinic Board / Chief Financial Officer.
* **Format**: Signed official price tariff sheet (PDF/Excel).
* **Blocking?**: **YES (CRITICAL BLOCKER)**.

---

### 2.6 Pharmacy Medication Formulary
* **Information Required**: Approved list of commercial pharmaceutical medications to be stocked in the clinic dispensary (Commercial Brand Name, Generic INN Name, Strength, Dosage Form, Route, Manufacturer, Barcode/GTIN, Retail Price in QAR, Wholesale Cost).
* **Why Required**: `gnuhealth.medicament` currently contains 0 records. Physicians cannot select commercial medications for e-prescribing until the formulary is ingested.
* **Who Provides It**: Chief Pharmacist / Pharmacy Director.
* **Format**: Completed CSV formulary intake template.
* **Blocking?**: **YES (HIGH PRIORITY)**.

---

### 2.7 Laboratory Test Catalog & Reference Ranges
* **Information Required**: In-house laboratory test menu, quantitative measurement units, diagnostic reference intervals (stratified by adult male, adult female, pediatric), and QAR test charges.
* **Why Required**: To populate `gnuhealth.patient.lab.test` parameters and configure automatic abnormal value flagging.
* **Who Provides It**: Laboratory Director / Lead Pathologist.
* **Format**: Laboratory service menu with technical reference sheets.
* **Blocking?**: **YES (HIGH PRIORITY)**.

---

### 2.8 Radiology Study Catalog
* **Information Required**: List of radiological examinations performed on-site (e.g. Chest X-Ray, Extremity X-Rays, Abdominal Ultrasound, Pelvic Ultrasound) and approved QAR fees.
* **Why Required**: To configure radiology requisition choices in `gnuhealth.imaging.test.type`.
* **Who Provides It**: Radiology Director / Chief Radiologist.
* **Format**: Radiology department fee and procedure schedule.
* **Blocking?**: **YES (HIGH PRIORITY)**.

---

### 2.9 Contracted Health Insurance Payers
* **Information Required**: List of contracted private health insurance companies and TPAs (e.g. QLM, Al Koot, Daman, MedNet), policy network tiers accepted, patient copayment percentages (e.g. 20%), and copay ceilings.
* **Why Required**: To configure payer parties, policy terms, and split-line invoicing in `gnuhealth.insurance`.
* **Who Provides It**: Insurance Relations Manager / Finance Lead.
* **Format**: Insurer contracts summary table.
* **Blocking?**: **NO (Required for insurance billing; self-pay can launch without it)**.

---

### 2.10 Financial & Accounting Configuration
* **Information Required**: Approval of proposed Outpatient Chart of Accounts, authorization to open Fiscal Year 2026 (`FY2026`) and 12 monthly periods in `account.fiscalyear`, and designated operational bank account details (QNB).
* **Why Required**: Tryton strictly forbids general ledger postings without an open fiscal year, completely blocking invoice confirmation and cashier checkout.
* **Who Provides It**: Chief Financial Officer / Lead Accountant.
* **Format**: Signed Accounting Implementation Approval document.
* **Blocking?**: **YES (CRITICAL BLOCKER)**.

---

### 2.11 Operating Schedule & Shift Timings
* **Information Required**: Official weekly clinic opening hours (Saturday through Thursday, and Friday timings), morning/evening shift division, and consultation room allocations per doctor.
* **Why Required**: To configure doctor calendar availability and avoid appointment double-booking.
* **Who Provides It**: Operations Manager.
* **Format**: Clinic operating timetable sheet.
* **Blocking?**: **YES (HIGH PRIORITY)**.

---

### 2.12 Administrative & Financial Policies
* **Information Required**: Official clinic discount authorization rules (maximum staff/courtesy discount percentage, required approval levels), and refund / credit note approval protocols.
* **Why Required**: To configure user authorization limits in Tryton accounting journals.
* **Who Provides It**: Clinic General Manager & CFO.
* **Format**: Documented clinic financial standard operating procedures (SOP).
* **Blocking?**: **NO (Operational best practice)**.

---

### 2.13 Third-Party Technical Integrations (Conditional)
* **Information Required**: If clinic management mandates external system interfacing:
  1. SMS Gateway: Provider API endpoint, HTTP webhook format, authentication token.
  2. PACS / DICOM Server: Orthanc IP address, AE Title, Port number.
  3. Insurance Clearinghouse: National e-claims gateway credentials and technical specifications.
* **Why Required**: To scope and schedule external API integrations (Phase 2).
* **Who Provides It**: Clinic IT Director / Third-Party Vendors.
* **Format**: Vendor API technical documentation and sandbox credentials.
* **Blocking?**: **NO (Core outpatient clinic operations launch natively without external APIs)**.
