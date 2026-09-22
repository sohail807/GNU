# ACCOUNTING & FINANCIAL IMPLEMENTATION PLAN

**Project**: GNU Health HMIS 5.0 / Tryton 7.0 Implementation  
**Document**: `ACCOUNTING_IMPLEMENTATION_PLAN.md`  
**Classification**: Financial Configuration Specification & Decision Framework  
**Scope**: Primary Outpatient & Ambulatory Healthcare Facility (State of Qatar)  
**Status**: PENDING_ACCOUNTING_APPROVAL  

---

## 1. Executive Summary & Financial Prerequisites

Tryton's double-entry accounting engine enforces strict fiscal controls. Patient invoicing, cashier collection, and receipt generation cannot proceed until the financial leadership of the clinic approves and signs off on the accounting structure.

> [!CRITICAL]
> **Production Gating Status**: `PENDING_ACCOUNTING_APPROVAL`  
> In accordance with project governance rules, **NO FINANCIAL ACCOUNTS, FISCAL YEARS, OR ACCOUNTING POLICIES SHALL BE CREATED ON THE LIVE SYSTEM WITHOUT FORMAL SIGN-OFF FROM THE CHIEF FINANCIAL OFFICER OR LEAD ACCOUNTANT**.

---

## 2. Company & Currency Baseline

The foundational accounting entities are verified on the live system:
- **Operating Company**: Company ID: `2` (Legal Entity: `<CLINIC_NAME>`)
- **Functional & Reporting Currency**: `QAR` (Qatari Riyal, ID: `3`, Code: `QAR`, Symbol: `ر.ق`)
- **Monetary Precision**: 2 decimal places (1 QAR = 100 Dirhams; Rounding factor: `0.01`)
- **Foreign Exchange Parity**: Default base rate `1.0000 QAR/QAR` active.

---

## 3. Fiscal Year & Accounting Periods Framework

The live database currently contains **`0` fiscal years in `account.fiscalyear`**. This is the primary blocker preventing customer invoice confirmation.

### 3.1 Fiscal Year Status & Proposal

#### Current fact
```text
Current fiscal-year record count: 0.
```

#### Proposed implementation
```text
Proposed fiscal year: FY2026, subject to Finance approval.
Fiscal Year Name: FY 2026
Code:             FY2026
Start Date:       2026-01-01
End Date:         2026-12-31
Company:          Company ID 2
State:            Open
```
*(Note: FY2026 is a proposed fiscal calendar submitted for Finance review and is not yet a definitive production fiscal year. No fiscal year shall be created until Finance formally signs off).*

### 3.2 Proposed 12 Monthly Accounting Periods
| Period Code | Period Name | Start Date | End Date | State | Status |
| :---: | :--- | :---: | :---: | :---: | :--- |
| **P01-2026** | January 2026 | 2026-01-01 | 2026-01-31 | Open | `PENDING_ACCOUNTING_APPROVAL` |
| **P02-2026** | February 2026 | 2026-02-01 | 2026-02-28 | Open | `PENDING_ACCOUNTING_APPROVAL` |
| **P03-2026** | March 2026 | 2026-03-01 | 2026-03-31 | Open | `PENDING_ACCOUNTING_APPROVAL` |
| **P04-2026** | April 2026 | 2026-04-01 | 2026-04-30 | Open | `PENDING_ACCOUNTING_APPROVAL` |
| **P05-2026** | May 2026 | 2026-05-01 | 2026-05-31 | Open | `PENDING_ACCOUNTING_APPROVAL` |
| **P06-2026** | June 2026 | 2026-06-01 | 2026-06-30 | Open | `PENDING_ACCOUNTING_APPROVAL` |
| **P07-2026** | July 2026 | 2026-07-01 | 2026-07-31 | Open | `PENDING_ACCOUNTING_APPROVAL` |
| **P08-2026** | August 2026 | 2026-08-01 | 2026-08-31 | Open | `PENDING_ACCOUNTING_APPROVAL` |
| **P09-2026** | September 2026 | 2026-09-01 | 2026-09-30 | Open | `PENDING_ACCOUNTING_APPROVAL` |
| **P10-2026** | October 2026 | 2026-10-01 | 2026-10-31 | Open | `PENDING_ACCOUNTING_APPROVAL` |
| **P11-2026** | November 2026 | 2026-11-01 | 2026-11-30 | Open | `PENDING_ACCOUNTING_APPROVAL` |
| **P12-2026** | December 2026 | 2026-12-01 | 2026-12-31 | Open | `PENDING_ACCOUNTING_APPROVAL` |

---

## 4. Proposed Outpatient Clinic Chart of Accounts

To allow granular financial tracking across clinical departments, the following standard chart of accounts is submitted for Finance approval:

```text
1000 ASSETS (View)
 ├── 1100 Current Assets (View)
 │    ├── 1110 Cash & Cash Equivalents (View)
 │    │    ├── 1111 Reception Main Cash Drawer (Current / Asset)
 │    │    └── 1112 Bank POS Terminal Clearing Account (Current / Asset)
 │    ├── 1120 Operating Bank Accounts (View)
 │    │    └── 1121 Qatar National Bank (QNB) Operating Account (Current / Asset)
 │    └── 1130 Accounts Receivable (View)
 │         ├── 1131 Patient Receivables - Self Pay (Receivable / Asset)
 │         └── 1132 Insurance Company Receivables (Receivable / Asset)
 │
2000 LIABILITIES (View)
 ├── 2100 Current Liabilities (View)
 │    ├── 2110 Accounts Payable - Suppliers & Vendors (Payable / Liability)
 │    ├── 2120 Patient Advance Deposits & Unearned Revenue (Current / Liability)
 │    └── 2130 Value Added Tax (VAT) Payable (Tax / Liability - 0% Rate)
 │
3000 EQUITY & RESERVES (View)
 └── 3100 Share Capital & Retained Earnings (Equity)
 │
4000 OPERATING REVENUE (View)
 ├── 4100 Consultation Revenue - Outpatient Clinics (Revenue)
 ├── 4200 Laboratory Investigation Revenue (Revenue)
 ├── 4300 Diagnostic Radiology & Imaging Revenue (Revenue)
 ├── 4400 Pharmacy & Medication Sales Revenue (Revenue)
 └── 4500 Nursing & Ambulatory Procedure Revenue (Revenue)
 │
5000 DIRECT OPERATING COSTS & DISCOUNTS (View)
 ├── 5100 Pharmacy Cost of Goods Sold (COGS) (Expense)
 ├── 5200 Laboratory Reagents & Consumables Cost (Expense)
 ├── 5300 Radiology Films & Consumables Cost (Expense)
 └── 5400 Patient Discounts & Authorized Concessions (Expense)
```

---

## 5. Departmental Revenue Breakdown & Service Linkages

Every medical product/service in `product.product` must be linked to its corresponding revenue account:

| Department / Service Domain | Revenue Account Code | Revenue Account Name | Tax Applicable | Approval Status |
| :--- | :---: | :--- | :---: | :--- |
| **Physician Consultations** | `4100` | Outpatient Consultation Revenue | 0% (Exempt) | `PENDING_ACCOUNTING_APPROVAL` |
| **Laboratory Tests** | `4200` | Laboratory Investigation Revenue | 0% (Exempt) | `PENDING_ACCOUNTING_APPROVAL` |
| **Radiology Studies** | `4300` | Radiology & Imaging Revenue | 0% (Exempt) | `PENDING_ACCOUNTING_APPROVAL` |
| **Pharmacy Sales** | `4400` | Pharmacy Medication Sales Revenue| 0% (Exempt) | `PENDING_ACCOUNTING_APPROVAL` |
| **Nursing Procedures** | `4500` | Nursing & Procedure Revenue | 0% (Exempt) | `PENDING_ACCOUNTING_APPROVAL` |

---

## 6. Financial Journals & Sequences

Tryton groups accounting transactions into specialized journals:

| Journal Code | Journal Name | Type | Balance Sheet / Income Statement Mapping | Status |
| :---: | :--- | :---: | :--- | :--- |
| **CSH** | Reception Cash Journal | Cash | Debit Account `1111`, Credit Account `1131` | `PENDING_ACCOUNTING_APPROVAL` |
| **POS** | Card POS Terminal Journal | Bank | Debit Account `1112`, Credit Account `1131` | `PENDING_ACCOUNTING_APPROVAL` |
| **REV** | Outpatient Revenue Journal | Revenue| Debit Account `1131`, Credit Accounts `4100-4500`| `PENDING_ACCOUNTING_APPROVAL` |
| **INS** | Insurance Billing Journal | Revenue| Debit Account `1132`, Credit Accounts `4100-4500`| `PENDING_ACCOUNTING_APPROVAL` |
| **GEN** | General Accounting Journal | General| Year-end adjustments, depreciation | `PENDING_ACCOUNTING_APPROVAL` |

---

## 7. Operational Cashiering & Reconciliation Policies

The Finance team must review and establish the following operational accounting rules:

1. **Daily Cashier Drawer Limit**:
   - Starting float: e.g., `500.00 QAR` per cashier drawer.
   - End-of-day count: Daily physical cash counted against posted `account.journal` totals.
   - Cash handover report signed by Cashier and Lead Accountant.
2. **Card Transaction Reconciliation**:
   - Daily batch close report from bank credit card terminal (POS) matched against system POS journal entries.
3. **Authorized Discount Policy**:
   - Doctor/Staff Courtesy Discount: Maximum 20% (Requires Clinic Manager approval).
   - Indigent / Compassionate Discount: Requires Medical Director & Finance sign-off.
   - Discount code linked to Account `5400 (Patient Discounts)`.
4. **Refunds & Credit Notes Policy**:
   - No cash refunds issued without a verified doctor cancellation or lab test non-performance.
   - All refunds require an approved Credit Note in Tryton reversing the original invoice.

---

## 8. Financial Sign-Off Submission

```text
SUBMITTED TO:
Chief Financial Officer / Lead Accountant: ___________________________
Date:                                      ___________________________
Decision:                                  [  ] APPROVED
                                           [  ] REJECTED (See Comments)
                                           [  ] AMENDMENTS REQUIRED
Signature:                                 ___________________________
```
