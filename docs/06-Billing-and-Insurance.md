# 06. Billing & Health Insurance

**Project**: Healthcare Management System — GNU Health Implementation  
**Assessment Date**: 2026-09-21  
**Operating Currency**: Qatari Riyal (`QAR`, `ر.ق`)  
**Status**: `PARTIALLY_CONFIGURED — PENDING ACCOUNTING APPROVAL`  
**Document**: `docs/06-Billing-and-Insurance.md`  

---

## 1. Executive Summary

This document details the outpatient billing architecture, QAR financial configuration, Chart of Accounts structure, and health insurance claim mechanisms.

---

## 2. Qatari Riyal (QAR) Currency Configuration

The financial foundation is configured in Tryton's native currency engine:

```json
{
  "id": 3,
  "code": "QAR",
  "name": "Qatari Riyal",
  "symbol": "ر.ق",
  "digits": 2,
  "rounding": {
    "__class__": "Decimal",
    "decimal": "0.01"
  }
}
```

- **Base Operating Rate**: Rate ID 2 (`rate: 1.0000`, `currency: 3`, effective `2026-09-21`).
- **Precision**: 2 decimal digits (1 QAR = 100 Dirhams), strictly using Python `Decimal` data types.
- **Company Linkage**: Operating company `company.company` (ID: 2) is bound to Currency ID 3.

---

## 3. Invoicing Framework & Clinical Integration

The `health_services` module bridges clinical care to Tryton's double-entry accounting engine:

```text
Clinical Requisitions (Consultation / Lab / Imaging / Rx)
                       ↓
         Health Service Aggregation (health_services)
                       ↓
          Customer Invoice (account.invoice)
                       ↓
     Invoice Lines Linked to Billable Products (product.product)
                       ↓
    Payment Posting via Payment Method (Cash / Card POS / Copay)
                       ↓
   General Ledger Accounting Moves Posted (account.move.line)
```

### Financial Journals Configured
Tryton contains 6 pre-configured operational journals:
1. `CASH`: Cash Journal
2. `BANK`: Bank POS Terminal Journal
3. `REVENUE`: Customer Invoicing Journal
4. `EXPENSE`: Supplier Expense Journal
5. `STOCK`: Inventory Valuation Journal
6. `GENERAL`: General Ledger Miscellaneous Journal

---

## 4. Critical Audit Finding: Fiscal Year Dependency

> [!WARNING]
> **Pre-Production Blocker (Gate 08 & 09)**:  
> While QAR currency, journals, and company associations are established, **no live customer invoice can be posted to the general ledger because `account.fiscalyear` contains 0 records**.  
>  
> Tryton strictly enforces double-entry ledger validation: posting an invoice creates debit/credit journal entries that require an open fiscal year and active accounting periods.  
>  
> **Status**: `PARTIALLY_CONFIGURED` / `PENDING_ACCOUNTING_APPROVAL`.

### Steps Required for Invoicing Activation:
1. Clinic accountant must review and approve the Chart of Accounts.
2. Open the active fiscal year (e.g. FY 2026) and 12 monthly accounting periods in `account.fiscalyear`.
3. Link income/expense accounts to product service templates.
4. Execute an end-to-end test patient invoice with receipt posting.

---

## 5. Health Insurance Management

The `health_insurance` module provides private medical insurance coverage for outpatient care:

### Supported Insurance Features
- **Payer Master**: Health insurance companies and Third-Party Administrators (TPAs) represented as `party.party` records with `is_insurance_company = True`.
- **Policy Management**: `gnuhealth.insurance` records capturing Policy Number, Member ID, Policy Start/End Dates, and Primary Beneficiary.
- **Coverage Rules**:
  - Co-insurance / Copay calculation (e.g. 10%, 20%, or fixed copay).
  - Maximum annual limits and deductible thresholds.
- **Invoicing Split**: System splits invoice totals between patient copay (payable at front desk) and insurer claim balance (payable by insurance payer).

### Pending Master Data (`PENDING_CLINIC_INPUT`)
- Ingestion of contracted private insurance payers in Qatar (e.g. QLM, Alkoot, Daman, Mednet, Al Khaleej Takaful).
- Specific copay policies and exclusion rules.
