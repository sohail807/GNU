# Technical Findings & Architectural Audit

**Project**: Healthcare Management System — GNU Health Implementation  
**Assessment Date**: 2026-09-21  
**Audit Role**: Senior Software Architect & Tryton 7.0 Specialist  
**Document**: `audit/technical-findings.md`  

---

## 1. Summary of Technical Discoveries

Through systematic inspection of the live GNU Health 5.0.7 / Tryton 7.0.57 runtime, PostgreSQL 15 database, and Python source code, the following architectural behaviors, dependencies, and findings were established:

---

## 2. Detailed Technical Findings

### Finding TF-01: Tryton 7.0 JSON-RPC Context & Company Scoping
- **Mechanism**: In Tryton 7.0, all model RPC calls require positional parameters: `[args, context_dict]`.
- **Finding**: For financial and accounting models (`account.account`, `account.invoice`, `account.fiscalyear`), queries will return empty sets or fail unless `company: <company_id>` is explicitly passed within the context dictionary (e.g. `{"language": "en", "company": 2}`).
- **Impact**: Client applications or integration scripts must include active company context on all financial API calls.

### Finding TF-02: GNU Health Federation Country Precondition
- **Mechanism**: When creating a `party.party` record with `is_person = True`, GNU Health automatically looks up the federation country code to generate the PUID.
- **Finding**: If `gnuhealth.federation.country.config` ID 1 has `country = null`, Tryton throws an unhandled `KeyError: 'fed_country'` on line 708 of `health.py`.
- **Resolution**: Configured singleton `gnuhealth.federation.country.config` record with `country = 1` (Qatar), resolving the issue permanently.

### Finding TF-03: Clinical Medical Safety Validation Engine
- **Mechanism**: GNU Health enforces strict medical safety checks before committing transactions:
  - **`SM-CORE-0018`**: Requires explicit physician sign-off (`prescription_warning_ack = True`) confirming pregnancy and allergy check prior to prescription issuance.
  - **`SM-CORE-0007`**: Restricts certain clinical actions if the currently logged-in user (`Transaction().user`) is not mapped to an active health professional party.
- **Impact**: Clinical workflows cannot be automated blindly; safety flags must be intentionally handled by clinical staff.

### Finding TF-04: EHR Immutability & Evaluation Access Rules
- **Mechanism**: GNU Health implements legal electronic health record (EHR) immutability by setting `perm_delete = False` across all roles for `gnuhealth.patient.evaluation` in `ir.model.access` (Record ID: 152).
- **Finding**: Even the system administrator cannot delete a consultation record via standard UI. Deleting test encounter data required an explicit administrative override on access permissions, followed by immediate restoration of the immutable state.

### Finding TF-05: Invoicing General Ledger Dependency
- **Mechanism**: Tryton's double-entry accounting engine forbids posting customer invoices (`account.invoice`) without an open fiscal year and active monthly accounting periods (`account.fiscalyear`).
- **Finding**: `account.fiscalyear` currently has 0 records. Although QAR currency, billing departments, and service templates are configured, live invoices cannot be posted to accounts receivable until the clinic accountant configures and opens the fiscal year.

### Finding TF-06: Python Decimal Type Serialization over JSON-RPC
- **Mechanism**: Tryton enforces strict Python `decimal.Decimal` types on monetary and rounding fields.
- **Finding**: Passing standard JSON floats (e.g., `0.01`) results in validation exceptions. Precision fields must be passed using Tryton's JSON type wrapper: `{"__class__": "Decimal", "decimal": "0.01"}`.

### Finding TF-07: Public Web Exposure & Plaintext HTTP
- **Mechanism**: Nginx reverse proxy currently listens on Port 80 without SSL/TLS encryption.
- **Finding**: Credentials, session tokens, and patient data would traverse the internet unencrypted. Production go-live strictly requires binding a domain name, installing a TLS certificate, and enforcing HTTPS on Port 443.

### Finding TF-08: Provisioning Credentials in VM Environment
- **Mechanism**: Initial deployment generated a random admin password stored in `/home/gnuhealth/admin_password.txt`.
- **Finding**: Default superuser password remains active. Production deployment requires credential rotation and secure deletion of the provisioning text file.
