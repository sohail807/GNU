# 03-GNU-HEALTH-MODULE-INVENTORY: MODULE & MODEL SPECIFICATION

**System:** GNU Health HMIS 5.0.6 / Tryton 7.0.57  
**Database Schema:** PostgreSQL 15.19 (`gnuhealth`)  
**Activated Modules Count:** 24 Modules  
**Total Available Modules in Source:** 55 Modules (`his/tryton/`)  
**Status:** FULLY INVENTORIED & VERIFIED  

---

## 1. Executive Summary

This document provides a comprehensive technical inventory of all installed and activated GNU Health and Tryton modules in the IST Health HMIS backend. Every model, primary table, state machine lifecycle, and relational constraint has been verified via live Tryton JSON-RPC inspection and PostgreSQL schema cataloging.

---

## 2. Activated Module Directory (24 Core Modules)

| # | Module Technical Name | Functional Category | Primary Models | Primary Database Tables | Activation Status |
|:--|:---|:---|:---|:---|:---:|
| 1 | `health` | Core Healthcare | `gnuhealth.patient`<br/>`gnuhealth.healthprofessional`<br/>`gnuhealth.appointment`<br/>`gnuhealth.patient.evaluation`<br/>`gnuhealth.medicament`<br/>`gnuhealth.prescription.order` | `gnuhealth_patient`<br/>`gnuhealth_healthprofessional`<br/>`gnuhealth_appointment`<br/>`gnuhealth_patient_evaluation`<br/>`gnuhealth_medicament`<br/>`gnuhealth_prescription_order` | **Activated** |
| 2 | `health_lab` | Diagnostics | `gnuhealth.lab`<br/>`gnuhealth.patient.lab.test`<br/>`gnuhealth.lab.test.critearea` | `gnuhealth_lab`<br/>`gnuhealth_patient_lab_test`<br/>`gnuhealth_lab_test_critearea` | **Activated** |
| 3 | `health_imaging` | Diagnostics | `gnuhealth.imaging.test.request`<br/>`gnuhealth.imaging.test.result` | `gnuhealth_imaging_test_request`<br/>`gnuhealth_imaging_test_result` | **Activated** |
| 4 | `account` | Financial Engine | `account.account`<br/>`account.fiscalyear`<br/>`account.period`<br/>`account.journal`<br/>`account.move`<br/>`account.move.line` | `account_account`<br/>`account_fiscalyear`<br/>`account_period`<br/>`account_journal`<br/>`account_move`<br/>`account_move_line` | **Activated** |
| 5 | `account_invoice` | Fiscal Billing | `account.invoice`<br/>`account.invoice.line`<br/>`account.invoice.payment_term` | `account_invoice`<br/>`account_invoice_line`<br/>`account_invoice_payment_term` | **Activated** |
| 6 | `account_product` | Accounting | `product.category.account` | `product_category_account` | **Activated** |
| 7 | `health_services` | Service Tariff | `gnuhealth.health_service`<br/>`gnuhealth.health_service.line` | `gnuhealth_health_service`<br/>`gnuhealth_health_service_line` | **Activated** |
| 8 | `health_icd10` | Clinical Coding | `gnuhealth.pathology`<br/>`gnuhealth.pathology_category` | `gnuhealth_pathology`<br/>`gnuhealth_pathology_category` | **Activated** |
| 9 | `party` | Identity & CRM | `party.party`<br/>`party.address`<br/>`party.contact_mechanism`<br/>`party.identifier` | `party_party`<br/>`party_address`<br/>`party_contact_mechanism`<br/>`party_identifier` | **Activated** |
| 10 | `product` | Catalogs | `product.product`<br/>`product.template`<br/>`product.uom` | `product_product`<br/>`product_template`<br/>`product_uom` | **Activated** |
| 11 | `company` | Multi-Institution | `company.company`<br/>`company.employee` | `company_company`<br/>`company_employee` | **Activated** |
| 12 | `currency` | FX & Valuation | `currency.currency`<br/>`currency.currency.rate` | `currency_currency`<br/>`currency_currency_rate` | **Activated** |
| 13 | `country` | Geography & Postal | `country.country`<br/>`country.subdivision` | `country_country`<br/>`country_subdivision` | **Activated** |
| 14 | `health_nursing` | Nursing | `gnuhealth.patient.rounding`<br/>`gnuhealth.nursing.ambulatory_care` | `gnuhealth_patient_rounding`<br/>`gnuhealth_nursing_ambulatory_care` | **Activated** |
| 15 | `health_pediatrics`| Specialty | `gnuhealth.pediatrics.growth.chart` | `gnuhealth_pediatrics_growth_chart` | **Activated** |
| 16 | `health_gyneco` | Specialty | `gnuhealth.patient.pregnancy`<br/>`gnuhealth.patient.perinatal` | `gnuhealth_patient_pregnancy`<br/>`gnuhealth_patient_perinatal` | **Activated** |
| 17 | `health_surgery` | Inpatient / OR | `gnuhealth.operation` | `gnuhealth_operation` | **Activated** |
| 18 | `health_inpatient` | Hospitalization | `gnuhealth.inpatient.registration`<br/>`gnuhealth.hospital.ward`<br/>`gnuhealth.hospital.bed` | `gnuhealth_inpatient_registration`<br/>`gnuhealth_hospital_ward`<br/>`gnuhealth_hospital_bed` | **Activated** |
| 19 | `health_insurance` | Payer & Policies | `gnuhealth.insurance`<br/>`gnuhealth.insurance.plan` | `gnuhealth_insurance`<br/>`gnuhealth_insurance_plan` | **Activated** |
| 20 | `health_socioeconomics` | Social Determinants | `gnuhealth.patient.socioeconomics` | `gnuhealth_patient_socioeconomics` | **Activated** |
| 21 | `health_lifestyle` | Preventive Care | `gnuhealth.patient.lifestyle` | `gnuhealth_patient_lifestyle` | **Activated** |
| 22 | `health_genetics` | Hereditary Care | `gnuhealth.patient.genetic.risk` | `gnuhealth_patient_genetic_risk` | **Activated** |
| 23 | `ir` | Framework Core | `ir.model`<br/>`ir.model.field`<br/>`ir.model.access`<br/>`ir.rule`<br/>`ir.sequence` | `ir_model`<br/>`ir_model_field`<br/>`ir_model_access`<br/>`ir_rule`<br/>`ir_sequence` | **Activated** |
| 24 | `res` | Security Core | `res.user`<br/>`res.group` | `res_user`<br/>`res_group`<br/>`res_user_res_group` | **Activated** |

---

## 3. Core Clinical Model Lifecycles & State Transitions

### 3.1 Patient Registration (`gnuhealth.patient` & `party.party`)
- **Uniqueness Constraint:** Patient uniqueness is enforced through `party.party` and `gnuhealth_patient_name_uniq` (a party can only be linked to a single `gnuhealth.patient` record).
- **PUID Generation:** Non-strict automated sequence (`ir.sequence`), e.g. `P00088`.
- **National Civil ID:** Stored in `party.party.ref` (e.g. Qatar Civil ID: 11-digit integer).

### 3.2 Appointment Encounter (`gnuhealth.appointment`)
```
[draft] ──(confirm)──> [confirmed] ──(checkin)──> [checked_in] ──(done)──> [done]
                                \
                                 ──(cancel)──> [cancelled]
```
- **State Transition Rules:**
  - `draft`: Initial entry.
  - `confirmed`: Booked and scheduled on calendar.
  - `checked_in`: Patient has arrived at clinic front desk; patient queue advances to Nursing Triage.
  - `done`: Clinical encounter concluded by attending physician.

### 3.3 Clinical Evaluation (`gnuhealth.patient.evaluation`)
```
[in_progress] ──(sign)──> [signed]
```
- **Key Fields:**
  - `patient`: Foreign key to `gnuhealth.patient` (Mandatory).
  - `healthprof`: Foreign key to `gnuhealth.healthprofessional` (Mandatory).
  - `evaluation_start`: Datetime of consultation commencement.
  - `chief_complaint`, `present_illness`: Clinical history (SOAP Subjective).
  - `evaluation_summary`: Objective physical exam notes.
  - `diagnosis`: Foreign key to `gnuhealth.pathology` (ICD-10 code).
  - `directions`: Treatment plan and patient advice (SOAP Plan).
  - Vitals fields: `systolic`, `diastolic`, `bpm`, `temperature`, `respiratory_rate`, `osat`, `weight`, `height`, `bmi`.

### 3.4 Diagnostic Laboratory Workflow (`gnuhealth.lab`)
```
[draft] ──(test)──> [in_progress] ──(validate)──> [done]
```
- **Key Models:**
  - `gnuhealth.lab`: The laboratory test instance linked to a patient and test type (`test`).
  - `gnuhealth.lab.test.critearea`: Individual analyte criteria (e.g. Hemoglobin, WBC, Platelets, Hematocrit) with reference ranges, units, and values.
  - `complete_criteareas`: Model method that populates standard analytes from the test template into the test instance.

### 3.5 Diagnostic Radiology Workflow (`gnuhealth.imaging.test.request`)
```
[draft] ──(request)──> [requested] ──(complete)──> [done]
```
- **Key Fields:**
  - `patient`: Patient recipient.
  - `test`: Imaging procedure template (e.g. Chest X-Ray PA & Lateral).
  - `comment`: Free-text findings and radiologist impression (labeled on screen as *Additional Information*).
  - `state`: Workflow progress tracker.

### 3.6 Electronic Prescription (`gnuhealth.prescription.order`)
```
[draft] ──(prescribe)──> [prescribed]
```
- **Lines:** Child table `gnuhealth.prescription.line` containing `medicament` (FK to `gnuhealth.medicament`), `dose`, `dose_unit`, `form`, `route`, `frequency`, and `duration`.

### 3.7 Customer Invoicing & GL Settlement (`account.invoice`)
```
[draft] ──(validate)──> [validated] ──(post)──> [posted] ──(pay)──> [paid]
```
- **Accounting Move Creation:** When an invoice transitions to `posted`, Tryton automatically generates a balanced debit/credit entry in `account.move` and `account.move.line`:
  - Debit: `1100 Accounts Receivable`
  - Credit: `4000 Outpatient Clinical Revenue`
- **Payment & Reconciliation:** When payment is recorded via Cash Journal (`1010`), a settlement move is posted and reconciled via `account.move.reconciliation`:
  - Debit: `1010 Main Cash on Hand`
  - Credit: `1100 Accounts Receivable` (Reconciled to zero)

---

## 4. Inactive Modules in Source Tree (`his/tryton/`)

The repository contains 31 additional upstream GNU Health modules that are not currently activated in the clinic's database:
- Specialty / Research modules: `health_dentistry`, `health_ophthalmology`, `health_ems`, `health_icu`, `health_crypto`, `health_crypto_lab`, `health_orthanc` (DICOM PACS integration), `health_who_essential_medicines`, `health_qrcodes`.
- **Policy Directive:** These modules remain available in the codebase for future specialty additions but will not be activated prematurely to keep the production database lean and maintain optimal index performance.
