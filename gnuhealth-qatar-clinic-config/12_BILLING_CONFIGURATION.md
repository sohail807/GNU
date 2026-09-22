# 12 — Outpatient Billing Configuration

**Document:** `12_BILLING_CONFIGURATION.md`  
**Currency:** Qatari Riyal (`QAR`, `ر.ق`)  
**Department:** Billing / Accounts (`BILL`, ID: 6)  
**Status:** `CONFIGURED` / `PENDING_CLINIC_INPUT`

---

## 1. Billing Framework in GNU Health

Outpatient billing in GNU Health is driven by the `health_services` module, which bridges clinical encounters (consultations, lab orders, imaging studies, and procedures) directly into standard Tryton customer invoices (`account.invoice`):

- **Customer / Debtor**: Patient Party (`party.party`)
- **Billable Service Products**: Linked to `product.product`
- **Currency**: `QAR` (ID: 3, decimal digits: 2, rounding: 0.01)
- **Company**: Main Clinic (`company.company` ID: 2)

---

## 2. Invoicing Workflow

```text
Doctor Consultation / Diagnostic Orders
        ↓
Health Service Aggregation (gnuhealth.health_service)
        ↓
Generate Customer Invoice (account.invoice)
        ↓
Cashier Payment Collection (Cash / Credit Card / Insurance Copay)
        ↓
Receipt Issue in QAR & Invoice State = Posted/Paid
```

---

## 3. Supported Payment Methods

1. **Cash (`QAR`)**: Recorded to Cash Journal (`CASH`, ID: 3).
2. **Credit / Debit Card (Debit Card / Visa / MasterCard)**: Subject to terminal merchant account setup (`PENDING_ACCOUNTING_APPROVAL`).
3. **Insurance Direct Billing**: Co-insurance copay collected from patient; remainder invoiced to contracted payer/TPA (`PENDING_CLINIC_INPUT`).

---

## 4. Audit Verification Note

> [!WARNING]
> **Audit Status Correction (2026-09-21)**:  
> While currency, journals, and company links are established, **no invoices have been created or posted (`account.invoice` count: 0)**. In Tryton, posting invoices requires an open fiscal year and active accounting periods (`account.fiscalyear`), which currently has 0 records.  
> **Current Status**: `PARTIALLY_CONFIGURED` / `PENDING_ACCOUNTING_APPROVAL`. Final end-to-end verification must be conducted after the clinic accountant opens the fiscal year and inputs official service tariffs.
