# GNU HEALTH HMIS 5.0 — FINANCIAL & ACCOUNTING TRANSACTION MODEL
**System of Record:** GNU Health HMIS 5.0.6 / Tryton 7.0.57 / PostgreSQL 15.19  
**Accounting Standard:** Double-Entry General Ledger (IAS/IFRS Compliant Architecture)  
**Functional Currency:** QAR (Qatari Riyal, Precision: 2 decimals, ID: 3)  
**Company:** IRISSTAR Medical Center (Company ID: 2)  
**Certification Status:** **TECHNICALLY CERTIFIED — DEMO/UAT BALANCED (9,500.00 QAR = 9,500.00 QAR)**

---

## 1. Accounting Architecture & Chart of Accounts

GNU Health integrates natively with the Tryton General Ledger. Financial transactions are never stored in disconnected clinical tables; all billable events compile into native Tryton invoices and post directly into the General Ledger.

### 1.1 Configured Chart of Accounts

| Account Code | Account Name | Account Type | Normal Balance | Role in Outpatient Lifecycle |
|:---|:---|:---|:---:|:---|
| **`101000`** | Cash on Hand | Asset / Cash | Debit | Holds physical cash collected at clinic cashier counter |
| **`102000`** | Commercial Bank Account | Asset / Bank | Debit | Receives electronic card settlements and bank transfers |
| **`110000`** | Accounts Receivable (Patients) | Asset / Receivable | Debit | Tracks outstanding balances owed by individual patients |
| **`210000`** | Accounts Payable | Liability / Payable | Credit | Tracks vendor liabilities for pharmaceuticals and medical consumables |
| **`401000`** | Outpatient Healthcare Revenue | Revenue | Credit | Records earned revenue from consultations, labs, and imaging |
| **`501000`** | Medical Operating Expenses | Expense | Debit | Records operational and consumable clinical costs |

### 1.2 Configured Financial Journals

| Journal Code | Journal Name | Journal Type | Used In |
|:---|:---|:---|:---|
| **`REV`** | Revenue Journal | Revenue | Outpatient patient customer invoices |
| **`CASH`** | Cash Journal | Cash | Cash payments received at front desk / cashier |
| **`EXP`** | Expense Journal | Expense | Clinic operational supplier payments |
| **`MISC`** | Miscellaneous Journal | General | Year-end adjustments and opening balances |

---

## 2. Double-Entry Outpatient Lifecycle Accounting Chain

The financial lifecycle consists of three distinct, verifiable phases:

```
[ CLINICAL ENCOUNTER ]
         |
         v
[ 1. INVOICE POSTING ] 
         |--> DR 110000 Accounts Receivable (Party: Patient 220) :  475.00 QAR
         |--> CR 401000 Outpatient Revenue (Consultation + Lab + XR): 475.00 QAR
         |
         v
[ 2. CASH PAYMENT POSTING ]
         |--> DR 101000 Cash on Hand                             :  475.00 QAR
         |--> CR 110000 Accounts Receivable (Party: Patient 220) :  475.00 QAR
         |
         v
[ 3. RECEIVABLES RECONCILIATION ]
         |--> Match DR Line (Move 38) with CR Line (Move 39)
         |--> Create Reconciliation Record (ID: 17)
         |--> Patient Net Outstanding AR Balance                  :    0.00 QAR
         |--> Global General Ledger Balance: Total DR == Total CR : 9,500.00 QAR
```

---

## 3. Empirical Transaction Evidence (Cycle `E2E-CERT-01340`)

### 3.1 Invoice Posting (Move `38`)
- **Invoice Number:** `INV-2026/00011`
- **Customer Party:** `E2E-CERT PATIENT 01340` (Party ID: `220`)
- **Total Amount:** `475.00 QAR`
- **Accounting Move Lines:**
  - Line 1: Account `110000` (AR) | Party `220` | Debit: `475.00 QAR` | Credit: `0.00 QAR`
  - Line 2: Account `401000` (Rev) | Product `OPD-EVAL` | Debit: `0.00 QAR` | Credit: `250.00 QAR`
  - Line 3: Account `401000` (Rev) | Product `LAB-CBC` | Debit: `0.00 QAR` | Credit: `75.00 QAR`
  - Line 4: Account `401000` (Rev) | Product `RAD-XR` | Debit: `0.00 QAR` | Credit: `150.00 QAR`
  - **Move Total:** Debits: `475.00 QAR` = Credits: `475.00 QAR` (Balanced)

### 3.2 Payment Receipt (Move `39`)
- **Journal:** `CASH` (Cash Journal ID: 3)
- **Period:** Fiscal Year 2026 / Active Outpatient Period
- **Description:** `"E2E-CERT-01340 Cash settlement for INV-2026/00011"`
- **Accounting Move Lines:**
  - Line 1: Account `101000` (Cash) | Debit: `475.00 QAR` | Credit: `0.00 QAR`
  - Line 2: Account `110000` (AR) | Party `220` | Debit: `0.00 QAR` | Credit: `475.00 QAR`
  - **Move Total:** Debits: `475.00 QAR` = Credits: `475.00 QAR` (Balanced)

### 3.3 Receivables Reconciliation
- **Reconciliation ID:** `17` (`account_move_reconciliation`)
- **Matched Move Lines:**
  - Move Line from Invoice Move `38` (AR Debit: `475.00 QAR`)
  - Move Line from Payment Move `39` (AR Credit: `475.00 QAR`)
- **Customer Net Balance Verification (SQL):**
  ```sql
  SELECT COALESCE(SUM(debit - credit), 0)
  FROM account_move_line
  WHERE account = 110000 AND party = 220;
  ```
  **Result:** `0.00 QAR` (Full settlement; zero unpaid balance).

### 3.4 General Ledger Balance Verification
- **Global GL Balance Query (SQL):**
  ```sql
  SELECT 
      SUM(debit) as total_debit, 
      SUM(credit) as total_credit, 
      SUM(debit) - SUM(credit) as gl_difference 
  FROM account_move_line;
  ```
  **Result:**
  - Total Debits: `9,500.00 QAR`
  - Total Credits: `9,500.00 QAR`
  - Net Difference: `0.00 QAR` (**STRICT ZERO-VARIANCE BALANCE**)

---

## 4. Financial Security & Immutability Rules

1. **Posted Invoices Are Strictly Immutable:**
   - Attempting to update or delete a posted invoice via ORM or JSON-RPC triggers:
     `AccessError: You cannot modify invoice "INV-2026/00011" because it is posted, paid or cancelled.`
2. **Posted Accounting Moves Are Strictly Immutable:**
   - Attempting to delete a posted accounting move triggers:
     `AccessError: You cannot modify posted move "39".`
3. **No Direct Database Writes:**
   - All accounting entries must originate through Tryton transaction workflows (`Invoice.post()`, `Move.post()`, `MoveLine.reconcile()`).
   - Direct SQL `INSERT`/`UPDATE` against `account_move` or `account_move_line` is strictly forbidden to preserve ledger integrity and transaction audit logs.
