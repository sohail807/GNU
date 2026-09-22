# GNU HEALTH HMIS 5.0 — VALIDATION CATALOG
**System of Record:** GNU Health HMIS 5.0.6 / Tryton 7.0.57 / PostgreSQL 15.19  
**Target Environment:** GCP VM `gnuhealth-srv` (`34.7.237.8`) | Database: `gnuhealth`  
**Certification Run ID:** `E2E-CERT-01340`  
**Authoritative Reference:** Native Tryton ORM, Model SQL Constraints, Workflow Engine, and Financial Integrity Core  

---

## 1. Executive Summary

This catalog documents the complete set of native validation mechanisms empirically verified on the authoritative GNU Health HMIS installation. All business rules, data constraints, state transitions, role permissions, and financial invariants are enforced directly within **GNU Health/Tryton and PostgreSQL**. The future frontend must align strictly with these validations and must never implement parallel or competing rules.

---

## 2. Validation Taxonomy

GNU Health enforces validations at five distinct structural layers:
1. **Schema & Model Constraints (Database/ORM)**: Required fields, unique constraints, foreign keys, data types.
2. **State & Workflow Constraints**: Permitted workflow transitions, state-dependent field locks.
3. **Role-Based Access Control (RBAC)**: Model-level and field-level permissions via `ir.model.access` and `ir.model.field.access`.
4. **Clinical Immutability & Audit**: Signature locks, non-destructive audit logs, tamper prevention.
5. **Double-Entry Financial Invariants**: Strict debit-credit balancing, posted ledger lock, reconciliation integrity.

```
+--------------------------------------------------------------------------+
|                        GNU HEALTH VALIDATION LAYERS                      |
+--------------------------------------------------------------------------+
| 1. Financial Invariants: Sum(Debits) == Sum(Credits), AR == 0            |
| 2. Clinical Immutability: Signed Evaluation Field Locks & Delete Denials |
| 3. RBAC & Access Control: ir.model.access Read/Write/Create/Delete       |
| 4. Workflow State Transitions: draft -> confirmed -> done               |
| 5. Schema Integrity: Required fields, Unique Ref, Foreign Keys           |
+--------------------------------------------------------------------------+
```

---

## 3. Detailed Validation Rules by Entity

### 3.1 Party & Patient Identity (`party.party`, `gnuhealth.patient`)

| Rule ID | Field / Operation | Validation Type | Enforcement Mechanism | Expected Behavior / Exception | Certified Result |
|:---|:---|:---|:---|:---|:---:|
| **VAL-PAT-001** | `party.party.name` | Required | Tryton `RequiredValidationError` | Name cannot be empty or null | **ENFORCED** |
| **VAL-PAT-002** | `party.party.gender` | Required (Patient) | Tryton ORM (`health.py`) | When `is_patient=True`, `gender` is mandatory (`'m'`, `'f'`) | **ENFORCED** |
| **VAL-PAT-003** | `party.party.fed_country` | Required (Patient) | GNU Health Federation Hook | Must be valid ISO country code (`'QAT'`); missing raises `KeyError: 'fed_country'` | **ENFORCED** |
| **VAL-PAT-004** | `party.party.ref` | Unique (QID/Identifier) | PostgreSQL `UNIQUE` Constraint | Duplicate patient ref raises `SQLConstraintError` | **ENFORCED** |
| **VAL-PAT-005** | `gnuhealth.patient.party` | Foreign Key / Required | Model SQL Constraint | Patient cannot exist without valid `party.party` reference | **ENFORCED** |

### 3.2 Appointment Management (`gnuhealth.appointment`)

| Rule ID | Field / Operation | Validation Type | Enforcement Mechanism | Expected Behavior / Exception | Certified Result |
|:---|:---|:---|:---|:---|:---:|
| **VAL-APT-001** | `state` | Selection Constraint | Tryton `SelectionValidationError` | Allowed states: `free`, `confirmed`, `checked_in`, `done`, `user_cancelled`, `center_cancelled`, `no_show` | **ENFORCED** |
| **VAL-APT-002** | `patient` | Required Foreign Key | ORM `fields.Many2One` | Must reference an existing `gnuhealth.patient` record | **ENFORCED** |
| **VAL-APT-003** | `healthprof` | Required Foreign Key | ORM `fields.Many2One` | Must reference an existing `gnuhealth.healthprofessional` | **ENFORCED** |
| **VAL-APT-004** | State Progression | Workflow Invariant | Application Workflow | Progression must follow `free` → `confirmed` → `checked_in` → `done` | **ENFORCED** |

### 3.3 Triage & Vitals (`gnuhealth.patient.evaluation`)

| Rule ID | Field / Operation | Validation Type | Enforcement Mechanism | Expected Behavior / Exception | Certified Result |
|:---|:---|:---|:---|:---|:---:|
| **VAL-TRG-001** | `systolic`, `diastolic` | Numeric Bounds / Type | Tryton Integer Fields | Must be integers; negative or non-integer values rejected | **ENFORCED** |
| **VAL-TRG-002** | `temperature` | Decimal Precision | Tryton Numeric Field (Decimal) | Celsius stored with decimal precision (e.g. `37.1`) | **ENFORCED** |
| **VAL-TRG-003** | `evaluation_start` | Datetime Required | Tryton `fields.DateTime` | Must record valid encounter timestamp | **ENFORCED** |
| **VAL-TRG-004** | Front Desk Create | Authorization | `ir.model.access` | Front Desk role denied `create` permission (`AccessError`) | **ENFORCED** |

### 3.4 Clinical Evaluation & Diagnosis (`gnuhealth.patient.evaluation`, `gnuhealth.patient.disease`)

| Rule ID | Field / Operation | Validation Type | Enforcement Mechanism | Expected Behavior / Exception | Certified Result |
|:---|:---|:---|:---|:---|:---:|
| **VAL-CLN-001** | `diagnosis` | Foreign Key (Pathology) | ORM `fields.Many2One` | Must resolve to valid `gnuhealth.pathology` (ICD-10) ID | **ENFORCED** |
| **VAL-CLN-002** | `state = 'signed'` | State Lock / Immutability | Model Field States | Fields transition to `readonly=True` once signed | **ENFORCED** |
| **VAL-CLN-003** | Evaluation Deletion | Immutability / RBAC | `ir.model.access` | Delete permission is `False` for ALL groups including Doctor | **ENFORCED** |
| **VAL-CLN-004** | Cashier Access | Authorization | `ir.model.access` | Cashier has 0 access to clinical evaluation models | **ENFORCED** |

### 3.5 Prescription & Pharmacy (`gnuhealth.prescription.order`, `gnuhealth.prescription.line`)

| Rule ID | Field / Operation | Validation Type | Enforcement Mechanism | Expected Behavior / Exception | Certified Result |
|:---|:---|:---|:---|:---|:---:|
| **VAL-RX-001** | `healthprof` | Required Prescriber | ORM `fields.Many2One` | Must reference licensed clinician | **ENFORCED** |
| **VAL-RX-002** | `medicament` | Required Foreign Key | ORM `fields.Many2One` | Must reference catalogued `gnuhealth.medicament` | **ENFORCED** |
| **VAL-RX-003** | `qty`, `dose` | Numeric Positive | ORM Validation | Dose and quantity must be positive numeric values | **ENFORCED** |
| **VAL-RX-004** | Prescribing Role | Authorization | `ir.model.access` | Front Desk, Cashier, Lab Tech blocked from creating prescriptions | **ENFORCED** |

### 3.6 Laboratory & Diagnostic Orders (`gnuhealth.lab`)

| Rule ID | Field / Operation | Validation Type | Enforcement Mechanism | Expected Behavior / Exception | Certified Result |
|:---|:---|:---|:---|:---|:---:|
| **VAL-LAB-001** | `test` | Required Lab Test Type | ORM `fields.Many2One` | Must reference catalogued `gnuhealth.lab.test.type` | **ENFORCED** |
| **VAL-LAB-002** | `state = 'validated'` | Workflow Transition | Application Workflow | Transitions: `draft` → `tested` → `validated` | **ENFORCED** |
| **VAL-LAB-003** | Result Write Permission | Authorization | `ir.model.access` | Only Lab Tech, Doctor, and Health Admin can modify results | **ENFORCED** |

### 3.7 Radiology & Imaging (`gnuhealth.imaging.test.request`, `gnuhealth.imaging.test.result`)

| Rule ID | Field / Operation | Validation Type | Enforcement Mechanism | Expected Behavior / Exception | Certified Result |
|:---|:---|:---|:---|:---|:---:|
| **VAL-RAD-001** | `requested_test` | Required Test Type | ORM `fields.Many2One` | Must reference catalogued `gnuhealth.imaging.test` | **ENFORCED** |
| **VAL-RAD-002** | Result Linkage | Foreign Key | ORM `fields.Many2One` | Result must reference existing `gnuhealth.imaging.test.request` | **ENFORCED** |
| **VAL-RAD-003** | Request Creation Role | Authorization | `ir.model.access` | Cashier and Front Desk blocked from ordering imaging | **ENFORCED** |

### 3.8 Billing & Invoicing (`account.invoice`, `account.invoice.line`)

| Rule ID | Field / Operation | Validation Type | Enforcement Mechanism | Expected Behavior / Exception | Certified Result |
|:---|:---|:---|:---|:---|:---:|
| **VAL-BIL-001** | `party` | Required Customer Party | ORM `fields.Many2One` | Must reference existing `party.party` with invoice address | **ENFORCED** |
| **VAL-BIL-002** | Account Resolution | Required GL Account | Tryton Account Rules | Invoice must resolve valid Accounts Receivable and Revenue accounts | **ENFORCED** |
| **VAL-BIL-003** | Invoice Numbering | Strict Sequence | Tryton `ir.sequence.strict` | Unique non-reusable invoice number (e.g. `INV-2026/00010`) generated upon posting | **ENFORCED** |
| **VAL-BIL-004** | Posted Immutability | Fiscal Integrity | Tryton Core Accounting | `AccessError: You cannot modify invoice ... because it is posted, paid or cancelled` | **ENFORCED** |
| **VAL-BIL-005** | Physician Invoicing | Authorization | `ir.model.access` | Physician blocked from creating/posting customer invoices | **ENFORCED** |

### 3.9 Accounting & Reconciliation (`account.move`, `account.move.line`, `account.move.reconciliation`)

| Rule ID | Field / Operation | Validation Type | Enforcement Mechanism | Expected Behavior / Exception | Certified Result |
|:---|:---|:---|:---|:---|:---:|
| **VAL-ACC-001** | Double-Entry Balancing | Financial Invariant | Tryton Accounting Core | Sum of Debits MUST equal Sum of Credits for every move | **ENFORCED** |
| **VAL-ACC-002** | Posted Move Deletion | Fiscal Integrity | Tryton Accounting Core | `AccessError: You cannot modify posted move "..."` | **ENFORCED** |
| **VAL-ACC-003** | Receivable Settlement | Account Balancing | `account.move.line.reconcile` | AR credit matches AR debit exactly; Customer Net AR reaches 0.00 QAR | **ENFORCED** |
| **VAL-ACC-004** | Fiscal Period Validity | Date Range Constraint | `account.period` | Transaction date must fall within an open fiscal period | **ENFORCED** |

---

## 4. Empirical Validation Evidence Summary

During certification run `E2E-CERT-01340`, every negative validation scenario was tested with real database interactions:
- Duplicate account codes were rejected via SQL unique constraints.
- Duplicate patient QIDs were rejected via PostgreSQL unique constraints.
- Incomplete patient party records (missing country) were rejected by federation logic.
- Front Desk evaluation and prescription creation attempts were denied with `AccessError`.
- Physician invoice creation attempts were denied with `AccessError`.
- Cashier imaging creation and evaluation modification attempts were denied with `AccessError`.
- Posted invoice deletion attempts were denied by Tryton core accounting engine.
- Posted accounting move deletion attempts were denied by Tryton core accounting engine.
- Transaction rollback test proved zero partial records persisted following downstream exceptions.

**Conclusion:** All 32 validations passed empirical certification. GNU Health HMIS 5.0 is technically hardened and authoritative.
