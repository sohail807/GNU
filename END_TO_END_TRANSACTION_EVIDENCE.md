# GNU HEALTH HMIS 5.0 — END-TO-END TRANSACTION EVIDENCE DOSSIER
## Complete Forensic Evidence Log: Clinical Encounter, Invoicing, Settlement & General Ledger

**Document Identifier**: `GH-E2E-008`  
**Execution Timestamp**: 2026-09-22 12:35:14 UTC  
**Environment**: `gnuhealth-srv` (Debian 12.15 Bookworm, PostgreSQL 15.19, Database `gnuhealth`)  
**Currency**: Qatari Riyal (`QAR`, `ر.ق`)  
**Status**: `FORENSIC TRANSACTION EVIDENCE DOSSIER`  

---

## 1. Executive Summary & Transaction Record Index

This document provides a forensic audit log of the complete real-world outpatient transaction executed on the live GNU Health HMIS backend. All records were generated through native Tryton ORM calls and committed to PostgreSQL under ACID transaction governance:

```
TRANSACTION LIFECYCLE SUMMARY:
[Patient Registration] ──> [Appointment Booking] ──> [Nursing Triage]
                                                            │
                                                            ▼
[Diagnostic Reporting] <── [Lab & Imaging Orders] <── [Physician Consultation]
           │                                                │
           ▼                                                ▼
[Cashier Settlement]  <─── [Customer Invoice]   <─── [Service Generation]
           │
           ▼
[General Ledger Move 5 & 6] ──> [Subledger Reconciliation ID 1] (Net AR = 0.00 QAR)
```

---

## 2. Granular Entity Audit Log

| Lifecycle Phase | Domain Model | Entity Identifier | Key Field Values | Lifecycle State |
| :--- | :--- | :--- | :--- | :---: |
| **Patient Party** | `party.party` | ID `32` | Name: `UAT-SYNTHETIC-PATIENT-01`, Gender: `m`, Country: `QAT` | Active |
| **National ID** | `party.identifier` | ID `1` | Type: `qid`, Code: `QID-28563412345` | Active |
| **Physical Address**| `party.address` | ID `32` | City: `Doha`, Country: `Qatar` | Active |
| **Patient Master** | `gnuhealth.patient` | ID `23` | Linked Party: `32`, Auto-assigned PUID | Active |
| **Appointment 1** | `gnuhealth.appointment`| ID `29` | Healthprof: `Dr. UAT Physician` (ID 8), Urgency: `routine` | `checked_in` |
| **Consultation** | `gnuhealth.patient.evaluation`| ID `17` | Chief Complaint: Upper URI, BP: 120/80, Pulse: 72 | `signed` |
| **Medical Coding** | `gnuhealth.pathology` | ID `13204` | ICD-10 Code: `J06.9` (Acute upper respiratory infection) | Linked |
| **Prescription** | `gnuhealth.prescription.order`| ID `16` | Drug: Amoxicillin 500mg, Safety Ack: `True` | `validated` |
| **Prescription Line**| `gnuhealth.prescription.line`| ID `16` | 15 Caps, Dose: 1 Cap, Route: Oral, Freq: TID, Days: 5 | `validated` |
| **Lab Order** | `gnuhealth.patient.lab.test`| ID `9` | Test: Complete Blood Count (CBC), Specimen: EDTA | `tested` |
| **Lab Result** | `gnuhealth.lab` | ID `14` | Findings: Mild leukocytosis, WBC 11.4 | `validated` |
| **Radiology Order** | `gnuhealth.imaging.test.request`| ID `14`| Modality: Chest X-Ray PA View | `done` |
| **Radiology Result**| `gnuhealth.imaging.test.result` | ID `9` | Findings: Normal cardiothoracic ratio, clear lungs | `done` |
| **Follow-up Appt** | `gnuhealth.appointment`| ID `30` | Date: `2026-09-29` (+7 Days), Linked to Eval 17 | `confirmed` |
| **Medical Service** | `gnuhealth.health_service`| ID `9` | Service: Outpatient General Consultation, Patient: 23 | Invoiced |
| **Customer Invoice**| `account.invoice` | ID `12` | Number: **`INV-2026/00001`**, Strict Sequence: Yes | `posted` |
| **Invoice Line** | `account.invoice_line` | ID `12` | Product: General Consultation (ID 4), Amount: `250.00 QAR` | `posted` |
| **GL Move 1 (Invoice)**| `account.move` | ID `5` | Company: 2, Period: `2026-09`, Balanced: Yes | `posted` |
| **GL Move 2 (Payment)**| `account.move` | ID `6` | Payment Method: `Cash Payment (QAR)`, Balanced: Yes | `posted` |
| **AR Reconciliation** | `account.move.reconciliation`| ID `1` | Reconciled Move Lines: `10` (Invoice) and `11` (Payment) | Validated |

---

## 3. Financial Invoicing & Cashier Settlement Evidence

### 3.1 Invoice Header & Detail Record
```
Invoice ID: 12
Company: 2 (Clinic Entity)
Currency: QAR (ID 634)
Party: 32 (UAT-SYNTHETIC-PATIENT-01)
Invoice Type: 'out' (Customer Invoice)
Invoice Number: INV-2026/00001
Sequence: Customer Invoice Strict 2026 (ir.sequence.strict ID 1)
Total Untaxed Amount: 250.00 QAR
Total Tax Amount: 0.00 QAR
Total Amount: 250.00 QAR
Invoice State: posted
Amount to Pay: 0.00 QAR
Reconciled: True
```

### 3.2 General Ledger Accounting Move Records (PostgreSQL Extraction)

```sql
SELECT m.id as move_id, m.number as move_number, m.state as move_state,
       l.id as line_id, l.account, a.code as account_code, a.name as account_name,
       l.debit, l.credit, l.reconciliation
FROM account_move m
JOIN account_move_line l ON l.move = m.id
JOIN account_account a ON a.id = l.account
WHERE m.id IN (5, 6)
ORDER BY m.id, l.id;
```

**Database Query Output**:
```
 move_id | move_number | move_state | line_id | account | account_code |         account_name          | debit  | credit | reconciliation 
---------+-------------+------------+---------+---------+--------------+-------------------------------+--------+--------+----------------
       5 | 5           | posted     |       9 |       6 | 401000       | Main Outpatient Revenue       |   0.00 | 250.00 |           NULL
       5 | 5           | posted     |      10 |       5 | 110000       | Main Accounts Receivable      | 250.00 |   0.00 |              1
       6 | 6           | posted     |      11 |       5 | 110000       | Main Accounts Receivable      |   0.00 | 250.00 |              1
       6 | 6           | posted     |      12 |       2 | 101000       | Main Cash                     | 250.00 |   0.00 |           NULL
(4 rows)
```

### 3.3 Verification of Financial Balance
* **Total Move 5 Debits**: $250.00 \text{ QAR} \equiv \text{Credits: } 250.00 \text{ QAR}$ ($\Delta = 0.00$)
* **Total Move 6 Debits**: $250.00 \text{ QAR} \equiv \text{Credits: } 250.00 \text{ QAR}$ ($\Delta = 0.00$)
* **Accounts Receivable Net Balance**:
  $$\text{Line 10 (Debit)} - \text{Line 11 (Credit)} = 250.00 - 250.00 = \mathbf{0.00 \text{ QAR}}$$
* **Cash Subledger Net Balance**: $+250.00 \text{ QAR}$ (Inflow from Cashier Settlement)
* **Revenue Subledger Net Balance**: $+250.00 \text{ QAR}$ (Operating Outpatient Revenue Recognized)
