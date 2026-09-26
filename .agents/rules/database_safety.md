# Database Safety Rules

## Data Integrity & Transaction Isolation
- **Synthetic Data Exclusively:**
  - All testing must use designated synthetic test entities (e.g., Patient: `Alexander Wright`, `P00088`; Doctor: `Dr. Gregory House`).
  - Never use real personal identifiable information (PII) or protected health information (PHI).
- **Party Uniqueness Constraint Enforcement:**
  - The model `gnuhealth.patient` enforces a unique constraint `gnuhealth_patient_name_uniq` on the associated `party.party` entity.
  - *Rule:* To update patient details, medical history, or critical info, the user must search and open the existing patient record. Clicking `+` (New Record) for an existing party will raise an `IntegrityError`.
- **Accounting Immutability:**
  - In Tryton, posted account moves (`account.move`) and invoices (`account.invoice`) cannot be deleted.
  - Never attempt to forcefully delete posted financial records using raw SQL queries (`DELETE FROM account_move`).
  - Reversals must be executed via standard credit notes or offsetting entries.
- **Backup Verification Before DDL/Schema Changes:**
  - Always verify that an automated database backup (`pg_dump`) is available prior to applying module upgrades or schema alterations.
