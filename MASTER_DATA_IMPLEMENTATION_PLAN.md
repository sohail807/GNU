# MASTER DATA IMPLEMENTATION PLAN & INTAKE TEMPLATES

**Project**: GNU Health HMIS 5.0 / Tryton 7.0 Implementation  
**Document**: `MASTER_DATA_IMPLEMENTATION_PLAN.md`  
**Classification**: Operational Master Data Ingestion Specification  
**Scope**: Primary Outpatient & Ambulatory Healthcare Facility (State of Qatar)  
**Status**: TEMPLATES READY — AWAITING OFFICIAL CLINIC DATA  

---

## 1. Executive Overview & Policy

To preserve the clean-slate integrity of the live GNU Health database, **NO MASTER DATA SHALL BE INGESTED UNTIL OFFICIALLY PROVIDED AND AUTHORIZED BY CLINIC LEADERSHIP**.

This document defines the exact data structures, validation rules, and standardized CSV/YAML intake templates for:
1. Clinic Legal Organization & Operating Hours
2. Healthcare Professional (Physician) Roster & Licensing
3. Clinical Service Catalog & Outpatient Tariffs
4. Pharmacy Medication Formulary & Dispensary Inventory

---

## 2. Organization Master Data Specification

### 2.1 Target Model Mapping
- **Clinic Party**: `party.party` (Company ID: 2)
- **Healthcare Institution**: `gnuhealth.institution` (Code: `CLINIC-QA`, Type: `clinic`)
- **Subunits / Cost Centers**: `gnuhealth.hospital.unit` (IDs 1–8)

### 2.2 Required Intake Fields & Validation Rules
| Field Name | Technical Target | Validation Rule | Mandatory? | Sample Valid Value |
| :--- | :--- | :--- | :---: | :--- |
| **Legal Trade Name (EN)** | `party.party.name` | Alphanumeric, max 128 chars | **YES** | `Al Rayyan Medical Center W.L.L.` |
| **Legal Trade Name (AR)** | `party.party.name` | Arabic script string | **YES** | `مركز الريان الطبي ذ.م.م` |
| **Commercial Reg (CR)** | `party.party.tax_identifier` | 5 to 8 numeric digits | **YES** | `123456` |
| **MOPH Facility License** | `gnuhealth.institution.code` | Alphanumeric code | **YES** | `MOPH-M-2026-0412` |
| **Blue Plate Building No** | `party.address.street` | Numeric building number | **YES** | `Building 42` |
| **Blue Plate Street No** | `party.address.street` | Numeric street number | **YES** | `Street 850` |
| **Blue Plate Zone No** | `party.address.subdivision` | Official Qatar Zone number | **YES** | `Zone 55 (Al Aziziyah)` |
| **Primary Telephone** | `party.contact_mechanism` | Phone with +974 country code | **YES** | `+974 4411 2233` |
| **Official Email** | `party.contact_mechanism` | Valid email syntax | **YES** | `info@alrayyanmedical.qa` |
| **Standard Weekly Shifts** | Operational Schedule | Sat–Thu 08:00–22:00, Fri 14:00–22:00 | **YES** | `Shift 1: 08:00-14:00, Shift 2: 16:00-22:00` |

### 2.3 Organization Intake Template (`templates/organization_intake.csv`)
```csv
legal_name_en,legal_name_ar,cr_number,moph_license,building_no,street_no,zone_no,phone,email,operating_days,shift_1_hours,shift_2_hours
"<CLINIC_LEGAL_NAME_EN>","<CLINIC_LEGAL_NAME_AR>","<CR_NUMBER>","<MOPH_LICENSE_NO>","<BLDG_NO>","<STREET_NO>","<ZONE_NO>","+974 <PHONE>","<EMAIL>","Saturday-Thursday","08:00-14:00","16:00-22:00"
```

---

## 3. Healthcare Professional (Doctor) Master Data

### 3.1 Target Model Mapping
- **Person / Party**: `party.party`
- **Health Professional**: `gnuhealth.healthprofessional`
- **Professional Specialty Link**: `gnuhealth.hp_specialty`
- **System User Link**: `res.user`

### 3.2 Required Intake Fields & Validation Rules
| Field Name | Technical Target | Validation Rule | Mandatory? | Description |
| :--- | :--- | :--- | :---: | :--- |
| **Full Name** | `party.party.name` | Full legal name matching QCHP license | **YES** | e.g., `Dr. Sarah Al-Kuwari` |
| **QCHP License No** | `gnuhealth.healthprofessional.license_number`| Official Qatar QCHP license ID | **YES** | e.g., `QCHP-P-78901` |
| **Medical Specialty** | `gnuhealth.specialty` | Must match one of 73 preloaded specialties | **YES** | e.g., `General Practice`, `Pediatrics` |
| **Department** | `gnuhealth.hospital.unit` | Must link to `OPD` (Unit ID: 1) | **YES** | `Outpatient Department` |
| **Consultation Room** | `gnuhealth.healthprofessional.room` | Room number string | **YES** | e.g., `Room 102` |
| **Working Hours** | Calendar availability | Working shifts | **YES** | e.g., `Sat-Wed 08:00-16:00` |
| **Slot Duration** | Appointment interval | Standard slot duration in minutes | **YES** | `15` or `30` minutes |
| **Active Status** | `gnuhealth.healthprofessional.active` | Boolean | **YES** | `True` |

### 3.3 Doctor Intake Template (`templates/doctor_intake.csv`)
```csv
full_name,qhp_license_number,specialty_name,department_code,room_number,working_days,shift_start,shift_end,slot_duration_mins
"Dr. <FIRST_NAME> <LAST_NAME>","QCHP-P-XXXXX","General Practice","OPD","Room 101","Sat-Wed","08:00","16:00",20
"Dr. <FIRST_NAME> <LAST_NAME>","QCHP-P-YYYYY","Pediatrics","OPD","Room 102","Sat-Wed","09:00","17:00",30
"Dr. <FIRST_NAME> <LAST_NAME>","QCHP-P-ZZZZZ","Internal Medicine","OPD","Room 103","Sat-Wed","14:00","22:00",30
```

---

## 4. Medical Service Catalog & Outpatient Tariff Plan

### 4.1 Target Model Mapping
- **Product Master**: `product.product`
- **Service Categories**: `product.category` (Medical, Laboratory, Radiology)
- **UOM**: `product.uom` (Unit: `Unit`)

### 4.2 Required Intake Fields & Validation Rules
| Field Name | Technical Target | Validation Rule | Mandatory? | Description |
| :--- | :--- | :--- | :---: | :--- |
| **Service Code** | `product.product.code` | Unique uppercase identifier | **YES** | e.g., `CONS-GP-01` |
| **Service Name** | `product.product.name` | Clinical service description | **YES** | e.g., `General Practitioner Consultation` |
| **Department** | `gnuhealth.hospital.unit` | OPD, LAB, RAD, NURS | **YES** | Department cost center |
| **Category** | `product.category` | Service / Procedure / Test | **YES** | `Service` |
| **Retail Price** | `product.product.list_price` | Decimal in QAR $\ge 0.00$ | **YES** | Consultation tariff in QAR |
| **Currency** | `product.product.currency` | Must be `QAR` | **YES** | QAR |
| **Active** | `product.product.active` | Boolean | **YES** | `True` |
| **Insurance Billable**| Flag | Eligible for insurance claim | **YES** | `Yes` / `No` |

### 4.3 Service Intake Template (`templates/service_catalog.csv`)
```csv
service_code,service_name,department_code,category,list_price_qar,currency,insurance_applicable
"CONS-GP-01","General Practitioner Consultation","OPD","Consultation",150.00,"QAR","Yes"
"CONS-SPEC-01","Specialist Physician Consultation","OPD","Consultation",250.00,"QAR","Yes"
"CONS-FUP-01","Follow-up Consultation (Within 7 Days)","OPD","Consultation",0.00,"QAR","Yes"
"NURS-ECG-01","12-Lead Electrocardiogram (ECG)","NURS","Procedure",100.00,"QAR","Yes"
"NURS-INJ-01","Intramuscular / Subcutaneous Injection","NURS","Procedure",35.00,"QAR","Yes"
"NURS-DRS-01","Simple Wound Dressing","NURS","Procedure",50.00,"QAR","Yes"
"LAB-CBC-01","Complete Blood Count (CBC)","LAB","Laboratory",80.00,"QAR","Yes"
"LAB-LIPID-01","Lipid Profile (Cholesterol, HDL, LDL, Trig)","LAB","Laboratory",120.00,"QAR","Yes"
"LAB-LFT-01","Liver Function Test (LFT)","LAB","Laboratory",110.00,"QAR","Yes"
"LAB-RFT-01","Renal Function Test (Urea, Creatinine, Electrolytes)","LAB","Laboratory",100.00,"QAR","Yes"
"LAB-HBA1C-01","Glycated Hemoglobin (HbA1c)","LAB","Laboratory",90.00,"QAR","Yes"
"LAB-URINE-01","Routine Urine Analysis","LAB","Laboratory",40.00,"QAR","Yes"
"RAD-XR-CHEST","Chest X-Ray (PA View)","RAD","Radiology",120.00,"QAR","Yes"
"RAD-XR-EXTR","Extremity X-Ray (2 Views)","RAD","Radiology",140.00,"QAR","Yes"
"RAD-US-ABD","Abdominal Ultrasound","RAD","Radiology",300.00,"QAR","Yes"
```

---

## 5. Pharmacy Medication Formulary Master Data

### 5.1 Target Model Mapping
- **Medicament Record**: `gnuhealth.medicament`
- **Underlying Product**: `product.product`
- **Dosage Form**: `gnuhealth.drug.form` (94 preloaded)
- **Administration Route**: `gnuhealth.drug.route` (47 preloaded)
- **Dosage Unit**: `gnuhealth.dose.unit` (7 preloaded)

### 5.2 Required Intake Fields & Validation Rules
| Field Name | Technical Target | Validation Rule | Mandatory? | Description |
| :--- | :--- | :--- | :---: | :--- |
| **Commercial Brand Name** | `product.product.name` | Trade name of medication | **YES** | e.g., `Panadol Extra Tablets` |
| **Active Generic Name** | `gnuhealth.medicament.active_component`| International Nonproprietary Name | **YES** | e.g., `Paracetamol + Caffeine` |
| **Strength & Unit** | `gnuhealth.medicament.strength` | Numeric + dose unit (mg, ml) | **YES** | `500mg / 65mg` |
| **Dosage Form** | `gnuhealth.medicament.form` | Must match one of 94 preloaded forms| **YES** | `Tablet` |
| **Administration Route**| `gnuhealth.medicament.route` | Must match one of 47 preloaded routes| **YES** | `Oral` |
| **Manufacturer** | `gnuhealth.medicament.manufacturer` | Pharmaceutical company name | **NO** | e.g., `GlaxoSmithKline` |
| **Barcode / GTIN** | `product.product.code` | EAN-13 barcode number | **YES** | e.g., `6291001234567` |
| **Retail Selling Price** | `product.product.list_price` | MoPH approved retail price in QAR | **YES** | e.g., `18.50` |
| **Unit Cost Price** | `product.product.cost_price` | Wholesale purchase cost in QAR | **YES** | e.g., `12.00` |
| **Initial Stock Qty** | `stock.move` (via inventory) | Positive integer | **YES** | e.g., `100` |
| **Batch / Lot Number** | `stock.lot.number` | Manufacturer batch string | **YES** | e.g., `BAT-2026-09` |
| **Expiry Date** | `stock.lot.expiration_date` | YYYY-MM-DD (must be future) | **YES** | e.g., `2028-06-30` |

### 5.3 Pharmacy Intake Template (`templates/pharmacy_formulary.csv`)
```csv
commercial_name,generic_name,strength,dosage_form,route,dose_unit,barcode,retail_price_qar,cost_price_qar,initial_stock,batch_number,expiry_date
"Panadol Advance 500mg","Paracetamol","500","Tablet","Oral","mg","6291001001001",12.00,8.50,200,"BATCH-P101","2028-12-31"
"Augmentin 1g Tablets","Amoxicillin + Clavulanic Acid","1000","Film-coated Tablet","Oral","mg","6291002002002",65.00,48.00,100,"BATCH-A202","2027-09-30"
"Amoxil 500mg Capsules","Amoxicillin","500","Capsule","Oral","mg","6291003003003",28.00,19.00,150,"BATCH-M303","2027-11-30"
"Brufen 400mg Tablets","Ibuprofen","400","Tablet","Oral","mg","6291004004004",16.50,11.00,120,"BATCH-B404","2028-05-31"
"Zyrtec 10mg Tablets","Cetirizine Dihydrochloride","10","Tablet","Oral","mg","6291005005005",22.00,15.50,80,"BATCH-Z505","2028-03-31"
"Nexium 40mg Tablets","Esomeprazole","40","Enteric-coated Tablet","Oral","mg","6291006006006",85.00,62.00,90,"BATCH-N606","2027-08-31"
"Ventolin HFA Inhaler 100mcg","Salbutamol","100","Aerosol, metered","Inhalation","mcg","6291007007007",24.50,17.00,60,"BATCH-V707","2027-10-31"
```

---

## 6. Master Data Ingestion Protocol

When the above completed intake sheets are returned by clinic leadership:
1. **Automated Schema Validation**: A pre-flight script will validate all foreign keys (Specialties, Routes, Forms, Currencies) against live IDs.
2. **Staging Review**: Data will be previewed in a dry-run report for stakeholder sign-off.
3. **ORM Execution**: Records will be created strictly through native Tryton JSON-RPC ORM methods, ensuring all business triggers and sequence counters execute correctly.
