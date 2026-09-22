# GNU HEALTH HMIS 5.0 — MASTER DATA CONFIGURATION SPECIFICATION
## Clinical Catalogs, Diagnostic Tests, Financial Charts & Master Data Governance

**Document Identifier**: `GH-MD-004`  
**System Baseline**: GNU Health 5.0.6 / Tryton 7.0.57  
**Operating Environment**: `gnuhealth-srv` (PostgreSQL 15.19, Database `gnuhealth`)  
**Status**: `MASTER DATA SPECIFICATION & GOVERNANCE BASELINE`  

---

## 1. Master Data Governance Principles

GNU Health enforces strict relational integrity between clinical encounters, diagnostic orders, electronic prescriptions, and financial billing moves. To prevent data contamination, all master data adheres to two immutable governance rules:
1. **Zero Fictitious Identifiers**: No fabricated Commercial Registration (CR) numbers, fake Ministry of Public Health (MOPH) facility licenses, or fabricated physician license numbers may be committed as permanent master records.
2. **Input State Classification**: All catalogs requiring official organizational sign-off are explicitly classified as:
   - `VERIFIED OPERATIONAL`: System configurations fully tested and active in the database.
   - `PENDING CLINIC INPUT`: Official clinic operational inputs awaiting executive stakeholder submission.
   - `PENDING FINANCE APPROVAL`: Commercial pricing tariffs awaiting Chief Financial Officer sign-off.

---

## 2. Clinical Medical Master Data

### 2.1 Medical Specialties (`gnuhealth.specialty`)
GNU Health includes native international medical specialty classifications. The following specialties are verified and configured for outpatient clinic operations:

| Specialty Name | Model | System ID | Code / Classification | Operational Status |
| :--- | :--- | :--- | :--- | :--- |
| **Family Medicine** | `gnuhealth.specialty` | `15` | Primary Care & General Practice | **VERIFIED OPERATIONAL** |
| **Internal Medicine** | `gnuhealth.specialty` | `22` | Adult General Medicine | **VERIFIED OPERATIONAL** |
| **Pediatrics** | `gnuhealth.specialty` | `33` | Child Healthcare & Growth | **VERIFIED OPERATIONAL** |
| **Obstetrics & Gynecology**| `gnuhealth.specialty`| `30` | Women's Health & Ante-Natal | **VERIFIED OPERATIONAL** |
| **Cardiology** | `gnuhealth.specialty` | `5` | Cardiovascular Outpatient Care | **VERIFIED OPERATIONAL** |
| **Dermatology** | `gnuhealth.specialty` | `10` | Outpatient Skin & Allergy | **VERIFIED OPERATIONAL** |

### 2.2 Medical Pathology & Diagnostic Catalog (`gnuhealth.pathology` / ICD-10)
Standardized ICD-10 clinical coding is active in the database (`health_icd10`). High-frequency outpatient pathologies include:

| Pathology Description | ICD-10 Code | System ID | Category | Validation Status |
| :--- | :--- | :--- | :--- | :--- |
| **Acute upper respiratory infection, unsp.** | `J06.9` | `13204` | Respiratory Infections | **VERIFIED OPERATIONAL** (Tested in UAT) |
| **Essential (primary) hypertension** | `I10` | `12801` | Cardiovascular Diseases | **VERIFIED OPERATIONAL** |
| **Type 2 diabetes mellitus without complications**| `E11.9` | `6452` | Endocrine & Metabolic | **VERIFIED OPERATIONAL** |
| **Acute pharyngitis, unspecified** | `J02.9` | `13162` | Upper Respiratory | **VERIFIED OPERATIONAL** |
| **Gastro-esophageal reflux disease without esophagitis**| `K21.9`| `14210` | Gastroenterology | **VERIFIED OPERATIONAL** |

### 2.3 Pharmaceutical & Medicament Catalog (`gnuhealth.medicament`)
Medicaments are linked to product templates, dosage units, and administration routes:

| Medicament Name | Active Principle | Drug Form | Standard Route | Safety Check (SM-CORE-0018) |
| :--- | :--- | :--- | :--- | :--- |
| **Amoxicillin 500mg Capsule** | Amoxicillin Trihydrate | Capsule (ID 1) | Oral (ID 1) | Active / Warning Ack Required |
| **Paracetamol 500mg Tablet** | Acetaminophen | Tablet (ID 2) | Oral (ID 1) | Active / Hepatic Check |
| **Ibuprofen 400mg Tablet** | Ibuprofen | Film-Coated Tab | Oral (ID 1) | Active / Renal & GI Check |
| **Metformin 500mg Tablet** | Metformin HCl | Extended Release| Oral (ID 1) | Active / Renal Check |
| **Omeprazole 20mg Capsule** | Omeprazole | Delayed Release | Oral (ID 1) | Active / Interaction Check |

---

## 3. Diagnostic Testing Master Catalogs

### 3.1 Laboratory Test Catalog (`gnuhealth.lab.test_type`)
Laboratory tests define the diagnostic protocol, biological specimen, and quantitative criteria:

| Test Name | Test Code | Clinical Section | Standard Specimen | Reference Ranges & Units |
| :--- | :--- | :--- | :--- | :--- |
| **Complete Blood Count (CBC)** | `LAB-CBC-01` | Hematology | Whole Blood (EDTA) | WBC: 4.0–11.0 $10^9$/L, Hb: 13.0–17.5 g/dL, PLT: 150–450 $10^9$/L |
| **Fasting Blood Glucose (FBG)**| `LAB-GLU-01` | Clinical Biochemistry | Plasma (Fluoride/Oxalate) | Normal: 70–99 mg/dL |
| **Lipid Profile (Chol, Trig, HDL, LDL)**| `LAB-LIP-01` | Clinical Biochemistry | Serum (Clot Activator) | Total Chol: < 200 mg/dL, Trig: < 150 mg/dL |
| **Glycated Hemoglobin (HbA1c)**| `LAB-A1C-01` | Special Chemistry | Whole Blood (EDTA) | Normal: < 5.7%, Diabetic: $\ge$ 6.5% |
| **Urinalysis Routine & Microscopic**| `LAB-URI-01` | Clinical Microscopy | Midstream Clean-Catch Urine | Physical, Chemical, Microscopic analysis |

### 3.2 Diagnostic Radiology Catalog (`gnuhealth.imaging.test`)
Medical imaging tests define the radiological procedure, anatomic modality, and view:

| Imaging Procedure Name | Modality Code | Anatomical Region | Standard Projections | Modality Type |
| :--- | :--- | :--- | :--- | :--- |
| **Chest X-Ray (CXR)** | `RAD-CXR-PA` | Thorax / Respiratory | Posteroanterior (PA) & Lateral | Digital Radiography (DR) |
| **Abdominal Ultrasound** | `RAD-US-ABD` | Abdomen / Pelvis | Complete Upper/Lower Survey | Ultrasonography (US) |
| **Lumbosacral Spine X-Ray**| `RAD-XR-LS` | Skeletal / Spine | AP and Lateral Projections | Digital Radiography (DR) |
| **Knee Joint X-Ray (Unilateral)**| `RAD-XR-KN` | Musculoskeletal | AP and Lateral | Digital Radiography (DR) |

---

## 4. Financial & Commercial Master Data

### 4.1 Chart of Accounts Hierarchy (`account.account`)
The operational chart of accounts is configured under Company ID 2 in QAR:

```
Chart of Accounts Hierarchy (QAR):
├── 100000 Current Assets (Type: Asset)
│   ├── 101000 Main Cash [ID 2] (Type: Cash / Liquid Assets)
│   └── 110000 Main Accounts Receivable [ID 5] (Type: Receivable, Party Required)
├── 200000 Current Liabilities (Type: Liability)
│   └── 210000 Main Accounts Payable [ID 4] (Type: Payable, Party Required)
├── 400000 Operating Revenue (Type: Revenue)
│   └── 401000 Main Outpatient Revenue [ID 6] (Type: Revenue, P&L)
└── 500000 Operating Expenses (Type: Expense)
    └── 501000 Main Operating Expense [ID 3] (Type: Expense, P&L)
```

### 4.2 Outpatient Service Tariff Schedule (`product.product` / `product.template`)

| Service Description | Category | Billable Product | Default Revenue Account | Baseline Tariff | Approval Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Outpatient General Consultation** | Medical Services | `product.product` ID 4 | `401000` (Main Revenue) | `250.00 QAR` | `PENDING FINANCE APPROVAL` |
| **Follow-up Outpatient Consultation**| Medical Services | `product.product` ID 5 | `401000` (Main Revenue) | `150.00 QAR` | `PENDING FINANCE APPROVAL` |
| **Specialist Outpatient Consultation**| Medical Services | `product.product` ID 6 | `401000` (Main Revenue) | `350.00 QAR` | `PENDING FINANCE APPROVAL` |
| **Complete Blood Count (CBC) Panel** | Lab Services | `product.product` ID 2 | `401000` (Main Revenue) | `120.00 QAR` | `PENDING FINANCE APPROVAL` |
| **Chest X-Ray (CXR) Diagnostic** | Imaging Services | `product.product` ID 1 | `401000` (Main Revenue) | `180.00 QAR` | `PENDING FINANCE APPROVAL` |

---

## 5. Master Data Pending Stakeholder Input

The following master data artifacts are gated on external executive stakeholder input prior to go-live:

| Master Data Item | Dependency Identifier | Required Input Artifact | Stakeholder Owner |
| :--- | :--- | :--- | :--- |
| **Clinic Legal Identity** | `CLINIC-001` | Official Commercial Registration (CR), MOPH Facility License | Executive Clinic Management |
| **Official Clinic FQDN** | `CLINIC-002` | DNS Delegation for TLS/HTTPS Certificate Activation | IT Infrastructure Lead |
| **Physician & Staff Roster**| `CLINIC-003` | MOPH Medical Licenses, QID, Specialty Registrations | Medical Director / HR |
| **Commercial Tariff Schedule**| `FINANCE-001` | Formally Signed Service Pricing Matrix (QAR) | Chief Financial Officer |
