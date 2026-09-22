# GNU HEALTH HMIS 5.0 / TRYTON 7.0 — FINANCIAL & ACCOUNTING SPECIFICATION
## Chart of Accounts, Fiscal Year 2026, Strict Invoicing Sequences & General Ledger Proof

**Document Identifier**: `GH-ACC-006`  
**System Baseline**: GNU Health 5.0.6 / Tryton 7.0.57 Accounting Engine  
**Operating Environment**: `gnuhealth-srv` (PostgreSQL 15.19, Database `gnuhealth`)  
**Currency Baseline**: Qatari Riyal (`QAR`, `ر.ق`, ISO 4217: 634)  
**Status**: `AUTHORITATIVE ACCOUNTING SPECIFICATION`  

---

## 1. Accounting Architecture & Enterprise Compliance

The financial engine in GNU Health is driven by Tryton's enterprise double-entry accounting kernel (`account`, `account_invoice`, `account_product`, and `currency`).

### 1.1 Core Financial Rules
1. **Strict Balance Invariant**: Every financial move (`account.move`) must satisfy the fundamental accounting equation:
   $$\sum \text{Debit} = \sum \text{Credit}$$
   Tryton prevents the posting of any out-of-balance journal entry at the ORM validation layer.
2. **Gapless Invoicing Sequences**: Customer invoices utilize strict sequences (`ir.sequence.strict`). Strict sequences enforce atomic gapless numbering, ensuring compliance with international financial reporting standards and tax regulations.
3. **Automated Subledger Reconciliation**: Payment processing automatically generates reconciliation identifiers (`account.move.reconciliation`), clearing outstanding receivables in real-time.

---

## 2. Chart of Accounts & Financial Routing

The operational Chart of Accounts is configured under Company ID 2 with operational currency QAR:

| Account Code | Account Name | System ID | Account Type | Reconciliation Permitted | Financial Statement |
| :--- | :--- | :--- | :--- | :---: | :--- |
| **`101000`** | Main Cash | `2` | Cash / Liquid Asset | No | Balance Sheet (Current Assets) |
| **`110000`** | Main Accounts Receivable | `5` | Receivable (Party Required) | **Yes** | Balance Sheet (Current Assets) |
| **`210000`** | Main Accounts Payable | `4` | Payable (Party Required) | **Yes** | Balance Sheet (Current Liabilities) |
| **`401000`** | Main Outpatient Revenue | `6` | Revenue | No | Income Statement (P&L Revenue) |
| **`501000`** | Main Operating Expense | `3` | Expense | No | Income Statement (P&L Expense) |

### 2.1 Default Accounting Configuration (`account.configuration`)
The global accounting defaults are explicitly wired to ensure automatic line routing:
* `default_account_receivable`: Account `110000` (ID 5)
* `default_account_payable`: Account `210000` (ID 4)
* `default_category_account_revenue`: Account `401000` (ID 6)
* `default_category_account_expense`: Account `501000` (ID 3)

### 2.2 Product Category Financial Wiring (`product.category`)
All billable outpatient medical categories route revenue directly to Account `401000`:
* Category ID 2 (`Imaging Services`): Revenue Account `401000`
* Category ID 3 (`Lab Services`): Revenue Account `401000`
* Category ID 4 (`Medical Evaluation`): Revenue Account `401000`

---

## 3. Fiscal Year 2026 & Monthly Period Architecture

### 3.1 Fiscal Year Configuration (`account.fiscalyear`)
* **Fiscal Year Name**: `Fiscal Year 2026` (System ID `7`)
* **Company**: Company ID `2` (Currency: QAR)
* **Date Range**: `2026-01-01` to `2026-12-31`
* **Lifecycle State**: `open`
* **Move Sequence Link**: `Account Move 2026` (`ir.sequence` ID `30`, Prefix: `MV-2026/`)
* **Invoice Sequence Link**: `Customer Invoice Strict 2026` (`ir.sequence.strict` ID `1`, Prefix: `INV-2026/`)

### 3.2 Monthly Fiscal Periods (`account.period`)
Twelve monthly accounting periods were generated and verified in the `open` state:

| Period Code | Period Name | Start Date | End Date | State | Post Move Sequence |
| :---: | :--- | :---: | :---: | :---: | :--- |
| `2026-01` | January 2026 | 2026-01-01 | 2026-01-31 | `open` | Account Move 2026 |
| `2026-02` | February 2026 | 2026-02-01 | 2026-02-28 | `open` | Account Move 2026 |
| `2026-03` | March 2026 | 2026-03-01 | 2026-03-31 | `open` | Account Move 2026 |
| `2026-04` | April 2026 | 2026-04-01 | 2026-04-30 | `open` | Account Move 2026 |
| `2026-05` | May 2026 | 2026-05-01 | 2026-05-31 | `open` | Account Move 2026 |
| `2026-06` | June 2026 | 2026-06-01 | 2026-06-30 | `open` | Account Move 2026 |
| `2026-07` | July 2026 | 2026-07-01 | 2026-07-31 | `open` | Account Move 2026 |
| `2026-08` | August 2026 | 2026-08-01 | 2026-08-31 | `open` | Account Move 2026 |
| `2026-09` | September 2026| 2026-09-01 | 2026-09-30 | `open` | Account Move 2026 |
| `2026-10` | October 2026 | 2026-10-01 | 2026-10-31 | `open` | Account Move 2026 |
| `2026-11` | November 2026 | 2026-11-01 | 2026-11-30 | `open` | Account Move 2026 |
| `2026-12` | December 2026 | 2026-12-01 | 2026-12-31 | `open` | Account Move 2026 |

---

## 4. Cashier Payment Methods & Settlement Engine

### 4.1 Payment Method Master (`account.invoice.payment.method`)
* **Payment Method Name**: `Cash Payment (QAR)` (System ID `1`)
* **Financial Journal**: Journal ID `3` (`CASH`, Code `CASH`, Type `cash`)
* **Debit Account**: Account `101000` (Main Cash, ID `2`)
* **Company**: Company ID `2`

---

## 5. End-to-End Double-Entry Transaction Proof

During live transaction testing, an outpatient consultation was billed for **250.00 QAR** and settled in cash. The resulting General Ledger moves were extracted directly from PostgreSQL:

### 5.1 Step 1: Customer Invoice Posting (`INV-2026/00001`)
Posting the customer invoice created General Ledger Move ID `5`:

$$\begin{aligned}
\text{Debit: } & \text{Account 110000 (Main Accounts Receivable)} & 250.00 \text{ QAR} \\
\text{Credit: } & \text{Account 401000 (Main Outpatient Revenue)} & 250.00 \text{ QAR}
\end{aligned}$$

**PostgreSQL Move Lines**:
* Line ID `9`: Account `6` (`401000`), Debit `0.00 QAR`, Credit `250.00 QAR`
* Line ID `10`: Account `5` (`110000`), Debit `250.00 QAR`, Credit `0.00 QAR`

### 5.2 Step 2: Cashier Cash Settlement
Cash payment registration created General Ledger Move ID `6`:

$$\begin{aligned}
\text{Debit: } & \text{Account 101000 (Main Cash)} & 250.00 \text{ QAR} \\
\text{Credit: } & \text{Account 110000 (Main Accounts Receivable)} & 250.00 \text{ QAR}
\end{aligned}$$

**PostgreSQL Move Lines**:
* Line ID `11`: Account `5` (`110000`), Debit `0.00 QAR`, Credit `250.00 QAR`
* Line ID `12`: Account `2` (`101000`), Debit `250.00 QAR`, Credit `0.00 QAR`

### 5.3 Step 3: Subledger Reconciliation & Net Balance
Tryton executed automatic line reconciliation (Reconciliation ID `1`) linking Line `10` (Debit 250.00 QAR) and Line `11` (Credit 250.00 QAR):

$$\text{Net Accounts Receivable Balance} = 250.00 - 250.00 = \mathbf{0.00 \text{ QAR}}$$
$$\text{Total Debits} = 500.00 \text{ QAR} \quad \equiv \quad \text{Total Credits} = 500.00 \text{ QAR}$$

Customer invoice state transitioned to `posted` with `amount_to_pay = 0.00 QAR` and `reconciled = True`.
