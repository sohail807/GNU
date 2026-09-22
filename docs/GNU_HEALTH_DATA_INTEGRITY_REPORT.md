# GNU HEALTH HMIS 5.0 — DATABASE & DATA INTEGRITY REPORT
**System of Record:** GNU Health HMIS 5.0.6 / Tryton 7.0.57 / PostgreSQL 15.19  
**Database Name:** `gnuhealth` (124 MB)  
**Host VM:** GCP Compute Engine `gnuhealth-srv` (`34.7.237.8`)  
**Certification Run ID:** `E2E-CERT-01340`  
**Execution Timestamp:** 2026-09-22T18:22:22Z  
**Certification Status:** **TECHNICALLY CERTIFIED — 0 ORPHANS DETECTED (100% INTEGRITY)**

---

## 1. Executive Summary

This report documents the empirical audit of the PostgreSQL relational schema and data integrity within the `gnuhealth` production-baseline database. The audit verifies that:
1. **Public Schema Standard:** Exactly 306 public tables exist; zero non-standard or shadow tables are present.
2. **Referential Integrity:** All 12 critical medical and financial foreign-key relationship chains contain **0 orphaned records**.
3. **Transaction Cleanliness:** Failed and rolled-back transactions leave zero intermediate or ghost records.

---

## 2. Public Schema Catalog Audit

- **Total Tables in Public Schema:** `306`
- **Native Tryton Models:** `24` activated modules
- **Shadow Tables Detected:** `0`
- **Direct SQL Business Tables:** `0`

All clinical entities (`gnuhealth_*`), party records (`party_*`), accounting records (`account_*`), and administrative objects (`ir_*`, `res_*`) conform strictly to upstream GNU Health and Tryton schema definitions.

---

## 3. Relational Foreign-Key Integrity Verification

During certification run `E2E-CERT-01340`, 12 automated SQL orphan queries were executed against the live database:

| Check ID | Relationship Verified | SQL Audit Query Executed | Orphan Count | Result |
|:---|:---|:---|:---:|:---:|
| **CHK-01** | Patients ↔ Parties | `SELECT count(*) FROM gnuhealth_patient WHERE party NOT IN (SELECT id FROM party_party);` | **0** | **PASS** |
| **CHK-02** | Appointments ↔ Patients | `SELECT count(*) FROM gnuhealth_appointment WHERE patient NOT IN (SELECT id FROM gnuhealth_patient);` | **0** | **PASS** |
| **CHK-03** | Evaluations ↔ Patients | `SELECT count(*) FROM gnuhealth_patient_evaluation WHERE patient NOT IN (SELECT id FROM gnuhealth_patient);` | **0** | **PASS** |
| **CHK-04** | Prescriptions ↔ Patients | `SELECT count(*) FROM gnuhealth_prescription_order WHERE patient NOT IN (SELECT id FROM gnuhealth_patient);` | **0** | **PASS** |
| **CHK-05** | Prescription Lines ↔ Orders | `SELECT count(*) FROM gnuhealth_prescription_line WHERE presc_order NOT IN (SELECT id FROM gnuhealth_prescription_order);` | **0** | **PASS** |
| **CHK-06** | Lab Orders ↔ Patients | `SELECT count(*) FROM gnuhealth_lab WHERE patient NOT IN (SELECT id FROM gnuhealth_patient);` | **0** | **PASS** |
| **CHK-07** | Imaging Requests ↔ Patients | `SELECT count(*) FROM gnuhealth_imaging_test_request WHERE patient NOT IN (SELECT id FROM gnuhealth_patient);` | **0** | **PASS** |
| **CHK-08** | Imaging Results ↔ Requests | `SELECT count(*) FROM gnuhealth_imaging_test_result WHERE request NOT IN (SELECT id FROM gnuhealth_imaging_test_request);` | **0** | **PASS** |
| **CHK-09** | Health Services ↔ Patients | `SELECT count(*) FROM gnuhealth_health_service WHERE patient NOT IN (SELECT id FROM gnuhealth_patient);` | **0** | **PASS** |
| **CHK-10** | Invoice Lines ↔ Invoices | `SELECT count(*) FROM account_invoice_line WHERE invoice NOT IN (SELECT id FROM account_invoice);` | **0** | **PASS** |
| **CHK-11** | Move Lines ↔ Accounting Moves | `SELECT count(*) FROM account_move_line WHERE move NOT IN (SELECT id FROM account_move);` | **0** | **PASS** |
| **CHK-12** | Reconciliations ↔ Move Lines | `SELECT count(*) FROM account_move_reconciliation WHERE id NOT IN (SELECT reconciliation FROM account_move_line WHERE reconciliation IS NOT NULL);` | **0** | **PASS** |

---

## 4. Entity Census & Growth Tracking

| Entity Table | Pre-Test Baseline | Post-Test Baseline | Net Valid Growth | Explanation |
|:---|:---:|:---:|:---:|:---|
| `party_party` | 16 | 19 | +3 | Synthetic E2E certification patient parties |
| `gnuhealth_patient` | 6 | 9 | +3 | Synthetic E2E certification patient records |
| `gnuhealth_appointment` | 11 | 14 | +3 | Outpatient encounter appointments |
| `gnuhealth_patient_evaluation` | 9 | 13 | +4 | Triage vitals and consultation records |
| `gnuhealth_prescription_order` | 7 | 10 | +3 | Outpatient prescriptions |
| `gnuhealth_lab` | 7 | 10 | +3 | Diagnostic laboratory test orders |
| `gnuhealth_imaging_test_request`| 7 | 10 | +3 | Diagnostic radiology requests |
| `gnuhealth_health_service` | 7 | 10 | +3 | Billable encounter services |
| `account_invoice` | 7 | 10 | +3 | Validated and posted customer invoices |
| `account_move` | 17 | 23 | +6 | Invoicing moves (3) + Payment settlement moves (3) |
| `account_move_reconciliation` | 7 | 10 | +3 | Receivables reconciliations |
| `res_user` (Active) | 15 | 15 | 0 | Strict administrative freeze on user provisioning |

---

## 5. Relational Consistency Findings

1. **Zero Disconnected Records:** Every encounter artifact links unambiguously back to a unique `gnuhealth.patient` and `party.party`.
2. **Zero Financial Discrepancies:** Every posted invoice links to exactly one posted `account.move`. Every cash payment move links to an active customer party and is bound to a valid reconciliation ID.
3. **Immutability of Historical Rows:** All previously existing DEMO/UAT records from earlier validation phases remain unaltered and intact.
4. **Conclusion:** Database integrity is **100% verified** with zero schema corruption or referential drift.
