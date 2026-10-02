---
name: gnuhealth-backend-audit
description: >-
  Conduct an exhaustive technical audit of the GNU Health HMIS backend, including repository security, database integrity, accounting balance, RBAC configuration, backup verification, and certification evidence. Use during pre-deployment audits or compliance reviews.
---

# GNU Health Backend Technical Audit Runbook

This skill automates the comprehensive technical audit of the deployed GNU Health backend across 8 audit dimensions: Architecture, Database Integrity, RBAC, Accounting Double-Entry, API Security, Performance Baseline, Backup & Recovery Drills, and Forensic Secret Scanning.

## Prerequisites
- Working connection to GCP host (`34.7.237.8`).
- SSH key available at `~/.ssh/gnuhealth_deploy` (for remote system inspection).
- Local Python audit collection scripts.
- Audit evidence directory: `reports/audits/` and `reports/final_backend_audit/`.

## Audit Execution Suite

### 1. Comprehensive System Probe
Execute the automated technical probe:
```powershell
python scripts/run_technical_audit_probe.py
```
This collects:
- OS & Kernel baseline (`Debian 12`, Linux kernel, memory, disk).
- Tryton server service status (`trytond.service` active).
- PostgreSQL 15 configuration, database encoding (`UTF-8`), and connection pool.
- Nginx reverse proxy configuration (`/etc/nginx/sites-available/`).

### 2. Database Relational Integrity & Schema Audit
Execute SQL integrity audits:
```powershell
python -c "import sys; sys.path.append('scripts'); from run_technical_audit_probe import run_sql; print(run_sql('scripts/audit_integrity.sql'))"
```
Checks:
- Zero orphaned appointment, evaluation, or prescription records.
- Foreign key constraints intact across `gnuhealth_patient`, `party_party`, and `res_user`.
- Sequence health and PUID increment continuity.

### 3. General Ledger & Double-Entry Accounting Audit
Execute accounting ledger validation:
```powershell
python -c "import sys; sys.path.append('scripts'); from run_technical_audit_probe import run_sql; print(run_sql('scripts/audit_accounting.sql'))"
```
Checks:
- Double-entry balance: `SUM(debit) == SUM(credit)` across all posted account moves.
- Unbalanced moves check: `SELECT count(*) FROM account_move WHERE round(debit, 2) != round(credit, 2) == 0`.
- Zero unreconciled customer invoice balances for settled cash payments.

### 4. Forensic Secret & Repository Security Scan
Execute the automated repository hygiene scanner:
```powershell
python scripts/repo_security_forensic_scanner.py
```
Checks:
- Zero unmasked passwords or session tokens committed to Git.
- Git ignore rules active for `.pem`, `.key`, `id_rsa*`, `.env`, and database dumps.
- File permission modes on private keys (`0600`) and Tryton configuration files.

### 5. Backup & Recovery Drill Verification
Verify that automated backup scripts exist and can successfully restore into an isolated test database:
```powershell
bash scripts/final_backup_and_restore_drill.sh
```
Verify generated artifact in `reports/audits/backup_validation.json`.

## Completion Criteria
- Generate or update [`FINAL_BACKEND_CERTIFICATION_REPORT.md`](../../FINAL_BACKEND_CERTIFICATION_REPORT.md).
- All 8 audit categories must pass with zero critical or high-severity vulnerabilities.
