# FINANCE & BILLING GO-LIVE INPUT TEMPLATE
## GNU HEALTH HMIS 5.0 / TRYTON 7.0 FINANCIAL MODULE

**Classification**: Authoritative Financial Policy & Accounting Input Template  
**Target Authority**: Chief Financial Officer (CFO), Head of Accounts & External Auditor  
**Instructions**:  
This document must be approved and signed off by the clinic's financial leadership. **Do not fabricate dates or prices.** Financial posting is gated behind these authorized parameters.

---

## 1. Operating Currency & Chart of Accounts Verification

* **Current Configured Currency**: `QAR` (Qatari Riyal, symbol `ر.ق`)
* **Current Configured Chart of Accounts**:
  - `101000`: Main Cash
  - `110000`: Main Receivable
  - `210000`: Main Payable
  - `220000`: Main Tax
  - `401000`: Main Revenue
  - `501000`: Main Expense

| Field Name | Description | Status | Sign-off / Confirmation |
| :--- | :--- | :---: | :--- |
| **Operating Currency Confirmation** | Confirm QAR as legal operating currency | `REQUIRED` | [ ] Approved [ ] Revision Needed |
| **Chart of Accounts Approval** | Confirm standard 6-account structure | `REQUIRED` | [ ] Approved [ ] Sub-accounts Needed |
| **Bank Account Integration** | Primary operational bank name & IBAN | `OPTIONAL` | |

---

## 2. Fiscal Year Parameters

*Note: In Tryton, customer invoice posting requires an open, validated fiscal year with corresponding operational periods.*

| Parameter | Required Specification | Finance Decision Value |
| :--- | :--- | :--- |
| **Fiscal Year Name** | Official code (e.g. `FY2026` or `2026`) | |
| **Fiscal Year Start Date** | Exact legal start date (`YYYY-MM-DD`) | |
| **Fiscal Year End Date** | Exact legal end date (`YYYY-MM-DD`) | |
| **Period Generation Model** | Monthly (12 periods) / Quarterly (4) | |
| **Financial Sign-off Authority** | Name & Title of authorizing financial officer| |

---

## 3. Outpatient Service Tariff Schedule

*Note: The 15 preconfigured outpatient clinical services currently have unapproved zero-base prices. Legitimate billing cannot commence until official tariffs are declared.*

| Service Code | Service Description | Category | Proposed Price (QAR) | Tax Status | Cost Center |
| :--- | :--- | :---: | :--- | :---: | :--- |
| `OPD-EVAL` | General Outpatient Consultation | Clinical | | Exempt / 0% | Outpatient Clinic |
| `OPD-SPEC` | Specialist Consultation | Clinical | | Exempt / 0% | Outpatient Clinic |
| `RAD-US` | Diagnostic Ultrasound | Radiology | | Exempt / 0% | Imaging Dept |
| `RAD-MRI` | Magnetic Resonance Imaging | Radiology | | Exempt / 0% | Imaging Dept |
| `RAD-XR` | Diagnostic X-Ray | Radiology | | Exempt / 0% | Imaging Dept |
| `RAD-CT` | Computed Tomography | Radiology | | Exempt / 0% | Imaging Dept |
| `RAD-PET` | Positron Emission Tomography | Radiology | | Exempt / 0% | Imaging Dept |
| `LAB-CBC` | Complete Blood Count | Laboratory | | Exempt / 0% | Pathology Lab |
| `LAB-LFT` | Liver Function Tests | Laboratory | | Exempt / 0% | Pathology Lab |
| `LAB-RFT` | Renal Function Tests | Laboratory | | Exempt / 0% | Pathology Lab |
| `LAB-UA` | Routine Urinalysis | Laboratory | | Exempt / 0% | Pathology Lab |
| `LAB-STOOL`| Stool Examination | Laboratory | | Exempt / 0% | Pathology Lab |
| `LAB-SEMEN`| Semen Analysis | Laboratory | | Exempt / 0% | Pathology Lab |
| `LAB-HAEM` | Hematology Coagulation Panel | Laboratory | | Exempt / 0% | Pathology Lab |
| `LAB-SMEAR`| Cytology / Smear Examination | Laboratory | | Exempt / 0% | Pathology Lab |
| `LAB-ENDO` | Endocrinology Panel | Laboratory | | Exempt / 0% | Pathology Lab |

---

## 4. Billing, Invoicing & Payment Policies

| Policy Parameter | Description | Finance Specification |
| :--- | :--- | :--- |
| **Accepted Payment Methods** | Cash, POS Credit Card, Debit Card, Cheque | |
| **POS Merchant Account Terminal IDs**| Terminal IDs mapped to Cashier stations | |
| **Customer Invoice Sequence Format** | e.g. `INV-2026-00001` or `CLI-YYYY-NNNNN` | |
| **Tax / VAT Policy** | Healthcare services tax treatment | [ ] Exempt [ ] Zero-Rated [ ] Standard |
| **Patient Copayment Policy** | Standard copayment ceiling / fixed amounts | |
| **Credit & Bad-Debt Write-off Policy**| Authorization threshold for bad debt write-off| |
| **Refund & Credit Note Policy** | Requirements for dual approval on refund | |

---

## 5. Formal Finance Gate Verdict

```text
FINANCE CONFIGURATION STATUS:
PENDING FINANCE APPROVAL

BLOCKING ITEMS:
1. Official Fiscal Year Start & End Dates
2. Authorized Consultation & Diagnostic Tariff Schedule
3. Invoice Sequence Formatting Authorization
```
