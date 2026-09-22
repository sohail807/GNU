# 14 — Financial & Accounting Configuration

**Document:** `14_ACCOUNTING_CONFIGURATION.md`  
**Base Currency:** QAR (`currency.currency` ID: 3)  
**Company:** Main Clinic (`company.company` ID: 2)  
**Status:** `PENDING_ACCOUNTING_APPROVAL`

---

## 1. Current Accounting State

- **Journals (`account.journal`)**: 6 Standard Operational Journals Active:
  - `REV` (Revenue Journal, ID: 1)
  - `EXP` (Expense Journal, ID: 2)
  - `CASH` (Cash Journal, ID: 3)
  - `STO` (Stock Valuation Journal, ID: 4)
  - `MISC` (General Miscellaneous Journal, ID: 5)
  - `EXC` (Currency Exchange Write-off, ID: 6)
- **Chart of Accounts (`account.account`)**: Currently 0 records.
- **Fiscal Year (`account.fiscalyear`)**: Awaiting clinic financial policy.

---

## 2. Recommended Minimum Chart of Accounts for Qatar Outpatient Clinic

To finalize invoice posting without financial assumptions, the clinic's finance director or certified public accountant should approve the following account structure:

```text
1000 - ASSETS
  ├── 1010 - Cash on Hand (Outpatient Reception Cashiers)
  ├── 1020 - Operating Bank Account (Qatar National Bank / Commercial Bank)
  └── 1100 - Accounts Receivable - Patients & Insurance
2000 - LIABILITIES
  ├── 2010 - Accounts Payable - Medical & Pharmaceutical Suppliers
  └── 2100 - Patient Advance Deposits / Unearned Revenue
4000 - REVENUE
  ├── 4010 - Outpatient Consultation Revenue (General & Specialist)
  ├── 4020 - Clinical Laboratory Services Revenue
  ├── 4030 - Diagnostic Radiology Services Revenue
  ├── 4040 - Pharmacy Dispensing Revenue
  └── 4050 - Nursing Procedures & Minor Ambulatory Revenue
5000 - EXPENSES
  ├── 5010 - Medical Supplies & Consumables
  ├── 5020 - Laboratory Reagents & Test Kits
  └── 5030 - Pharmacy Cost of Goods Sold
```

---

## 3. Governance Policy

> [!WARNING]
> No arbitrary chart of accounts has been imposed on the live system. In accordance with Prompt Rules 40 & 41, creating ledger accounts and fiscal years remains `PENDING_ACCOUNTING_APPROVAL` to ensure full compliance with the clinic's external auditor and Qatar tax laws.
