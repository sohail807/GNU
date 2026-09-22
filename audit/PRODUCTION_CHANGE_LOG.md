# Production Change Control Log
## GNU Health HMIS Outpatient Clinic Implementation

**Document**: `audit/PRODUCTION_CHANGE_LOG.md`  
**Target Environment**: Production Host (`34.7.237.8`) / Tryton Runtime (`http://34.7.237.8/gnuhealth/`)  
**Database**: `gnuhealth` (PostgreSQL 15.15)  
**Governance Standard**: ISO 20000 / ITIL Change Management & Healthcare Audit Trail Standards  

---

## Change Record Index

| Change ID | Timestamp (UTC) | Scope / Model | Summary of Modification | Authorized By | Validation Status |
| :--- | :--- | :--- | :--- | :--- | :---: |
| **CHG-2026-001** | 2026-09-21 14:00 | `model.account.account` | Assign standard Chart of Accounts codes (101000..501000) | Technical Lead | `VERIFIED` |
| **CHG-2026-002** | 2026-09-21 14:00 | `model.product.category` | Enable accounting linkage and map revenue/expense accounts | Technical Lead | `VERIFIED` |
| **CHG-2026-003** | 2026-09-21 14:00 | `model.product.template` | Assign standard outpatient clinical service codes (IDs 1..15) | Technical Lead | `VERIFIED` |
| **CHG-2026-004** | 2026-09-21 14:03 | `model.product.template` | Map account categories across all 15 clinical service templates | Technical Lead | `VERIFIED` |
| **CHG-2026-005** | 2026-09-21 16:07 | Repository & Scratch Files | Sanitize plaintext provisioning credentials from workspace | Security Lead | `VERIFIED` |

---

## Detailed Change Records

### Change Record CHG-2026-001: General Ledger Account Code Assignment

* **Target Entity**: `model.account.account` (IDs 2, 3, 4, 5, 6, 7)
* **Current State Before Change**: Accounts existed under root view ID 1 ("Minimal Account Chart") with names ("Main Cash", "Main Expense", "Main Payable", "Main Receivable", "Main Revenue", "Main Tax") but `code` attributes were empty strings/null.
* **Intended Change**: Assign standard 6-digit double-entry Chart of Accounts codes conforming to outpatient clinic accounting standards.
* **Technical Reason**: Tryton billing and financial reports require account codes for reconciliation, journal entries, and trial balance generation.
* **Command / Action Executed**:
  ```python
  # Tryton JSON-RPC method model.account.account.write
  params = [
      ([2], {"code": "101000"}), # Main Cash
      ([3], {"code": "501000"}), # Main Expense
      ([4], {"code": "210000"}), # Main Payable
      ([5], {"code": "110000"}), # Main Receivable
      ([6], {"code": "401000"}), # Main Revenue
      ([7], {"code": "220000"}), # Main Tax
  ]
  ```
* **Result**: All 6 account records successfully updated in PostgreSQL database `gnuhealth`.
* **Validation Evidence**:
  Executed `model.account.account.read` via authenticated JSON-RPC:
  ```text
  id  code    name              type  reconcile
  --  ----    ----              ----  ---------
   2  101000  Main Cash           11      False
   3  501000  Main Expense        16      False
   4  210000  Main Payable        13       True
   5  110000  Main Receivable     12       True
   6  401000  Main Revenue        15      False
   7  220000  Main Tax            14      False
  ```
* **Rollback Method**: Execute `model.account.account.write` passing `{"code": null}` for IDs 2..7.

---

### Change Record CHG-2026-002: Product Category Accounting Linkage

* **Target Entity**: `model.product.category` (IDs 2, 3, 4)
* **Current State Before Change**: Categories existed ("Imaging Services" ID 2, "Lab Services" ID 3, "Medical Evaluation" ID 4) with `accounting = False`, `account_revenue = null`, `account_expense = null`.
* **Intended Change**: Enable `accounting = True` and set default `account_revenue = 6` (Main Revenue: 401000) and `account_expense = 3` (Main Expense: 501000).
* **Technical Reason**: Tryton's invoice generation engine requires product categories to define the revenue and expense account routing when billable services are added to customer invoices.
* **Command / Action Executed**:
  ```python
  # Tryton JSON-RPC method model.product.category.write
  params = [
      ([2, 3, 4], {"accounting": True, "account_revenue": 6, "account_expense": 3})
  ]
  ```
* **Result**: Categories 2, 3, and 4 successfully updated. Category 1 ("Insurances") left unmodified as a non-revenue grouping.
* **Validation Evidence**:
  Executed `model.product.category.read` via authenticated JSON-RPC:
  ```text
  id  name                accounting  account_revenue  account_expense
  --  ----                ----------  ---------------  ---------------
   1  Insurances               False                                
   2  Imaging Services          True  6                3              
   3  Lab Services              True  6                3              
   4  Medical Evaluation        True  6                3              
  ```
* **Rollback Method**: Execute `model.product.category.write` passing `{"accounting": False, "account_revenue": null, "account_expense": null}` for IDs 2, 3, 4.

---

### Change Record CHG-2026-003: Outpatient Clinical Service Codes

* **Target Entity**: `model.product.template` (IDs 1..15) and inherited `model.product.product`
* **Current State Before Change**: 15 service product templates existed with names but `code` attributes were empty/null.
* **Intended Change**: Assign standard outpatient clinical identifiers according to departmental naming conventions (`OPD-*`, `RAD-*`, `LAB-*`).
* **Technical Reason**: Clinical ordering, nursing requisition, laboratory accessioning, radiology scheduling, and patient billing require concise, unambiguous service codes.
* **Command / Action Executed**:
  ```python
  # Tryton JSON-RPC method model.product.template.write
  params = [
      ([1], {"code": "RAD-US"}),
      ([2], {"code": "RAD-MRI"}),
      ([3], {"code": "RAD-XR"}),
      ([4], {"code": "RAD-CT"}),
      ([5], {"code": "RAD-PET"}),
      ([6], {"code": "LAB-SEMEN"}),
      ([7], {"code": "LAB-CBC"}),
      ([8], {"code": "LAB-LFT"}),
      ([9], {"code": "LAB-STOOL"}),
      ([10], {"code": "LAB-RFT"}),
      ([11], {"code": "LAB-HAEM"}),
      ([12], {"code": "LAB-SMEAR"}),
      ([13], {"code": "LAB-UA"}),
      ([14], {"code": "LAB-ENDO"}),
      ([15], {"code": "OPD-EVAL"}),
  ]
  ```
* **Result**: All 15 product templates updated and reflected on `model.product.product`.
* **Validation Evidence**:
  Executed `model.product.product.read` via authenticated JSON-RPC:
  ```text
  id  code       name                          type     active
  --  ----       ----                          ----     ------
  15  OPD-EVAL   Medical evaluation service    service    True
   1  RAD-US     Ultrasound charges            service    True
   2  RAD-MRI    MRI charges                   service    True
   3  RAD-XR     X-ray charges                 service    True
   4  RAD-CT     CT Scan charges               service    True
   5  RAD-PET    PET Scan charges              service    True
   6  LAB-SEMEN  Semen Analysis                service    True
   7  LAB-CBC    Complete Blood Count          service    True
   8  LAB-LFT    Liver Function                service    True
   9  LAB-STOOL  Stool Examination             service    True
  10  LAB-RFT    Renal Function                service    True
  11  LAB-HAEM   Haematology                   service    True
  12  LAB-SMEAR  Peripheral Smear Examination  service    True
  13  LAB-UA     Urine Analysis                service    True
  14  LAB-ENDO   Endocrinology                 service    True
  ```
* **Rollback Method**: Execute `model.product.template.write` passing `{"code": null}` for IDs 1..15.

---

### Change Record CHG-2026-004: Service Template Account Category Mapping

* **Target Entity**: `model.product.template` (IDs 1..15)
* **Current State Before Change**: All 15 service templates had `account_category = null`.
* **Intended Change**: Map templates to their corresponding active accounting category:
  - IDs 1..5 (Radiology) &rarr; Category 2 (*Imaging Services*)
  - IDs 6..14 (Laboratory) &rarr; Category 3 (*Lab Services*)
  - ID 15 (Outpatient Consultation) &rarr; Category 4 (*Medical Evaluation*)
* **Technical Reason**: Enables automatic invoice line account resolution to revenue account 401000 without requiring manual line item bookkeeping during patient checkout.
* **Command / Action Executed**:
  ```python
  # Tryton JSON-RPC method model.product.template.write
  params = [
      ([1, 2, 3, 4, 5], {"account_category": 2}),
      ([6, 7, 8, 9, 10, 11, 12, 13, 14], {"account_category": 3}),
      ([15], {"account_category": 4}),
  ]
  ```
* **Result**: All 15 templates mapped.
* **Validation Evidence**:
  Executed `model.product.template.read` via authenticated JSON-RPC:
  ```text
  id  code       name                          account_category
  --  ----       ----                          ----------------
   1  RAD-US     Ultrasound charges                           2
   2  RAD-MRI    MRI charges                                  2
   3  RAD-XR     X-ray charges                                2
   4  RAD-CT     CT Scan charges                              2
   5  RAD-PET    PET Scan charges                             2
   6  LAB-SEMEN  Semen Analysis                               3
   7  LAB-CBC    Complete Blood Count                         3
   8  LAB-LFT    Liver Function                               3
   9  LAB-STOOL  Stool Examination                            3
  10  LAB-RFT    Renal Function                               3
  11  LAB-HAEM   Haematology                                  3
  12  LAB-SMEAR  Peripheral Smear Examination                 3
  13  LAB-UA     Urine Analysis                               3
  14  LAB-ENDO   Endocrinology                                3
  15  OPD-EVAL   Medical evaluation service                   4
  ```
* **Rollback Method**: Execute `model.product.template.write` passing `{"account_category": null}` for IDs 1..15.

---

### Change Record CHG-2026-005: Workspace Secret Sanitization & Hygiene

* **Target Entity**: Local repository files and temporary scratch automation scripts
* **Current State Before Change**: Historical deployment files and early scratch test scripts contained static strings from initial provisioning.
* **Intended Change**: Replace all occurrences of plaintext secrets with dynamic environment variable references (`$env:TRYTON_ADMIN_PASSWORD`) or masked tokens (`<MASKED_PROVISIONING_PASSWORD>`).
* **Technical Reason**: Adherence to OWASP Top 10 credential exposure prevention and strict security requirements.
* **Command / Action Executed**: Automated regex sanitation pass across `c:\Users\MohammedSohail\OneDrive - IRISSTAR TECHNOLOGIES\GNU Health\` and `scratch/`.
* **Result**: All repository files, logs, and scratch scripts sanitized.
* **Validation Evidence**: Executed ripgrep across repository and scratch paths. Result: **0 matches found**.
* **Rollback Method**: N/A (Security hygiene measure; secrets must remain sanitized).
