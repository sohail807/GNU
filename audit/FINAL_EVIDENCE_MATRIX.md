# FINAL EVIDENCE MATRIX — GNU HEALTH HMIS OUTPATIENT CLINIC

**Project**: Healthcare Management System — GNU Health Implementation  
**Official Name**: GNU Health HMIS — Outpatient Clinic Implementation  
**Platform**: GNU Health HMIS 5.0.7 / Tryton 7.0.57 / PostgreSQL 15.15 / Debian 12  
**Document**: `audit/FINAL_EVIDENCE_MATRIX.md`  
**Classification**: Authoritative Pre-Implementation Evidence Matrix  
**Status**: VERIFIED EVIDENCE BASELINE  
**Assessment Date**: 2026-09-21  

---

## 1. Evidence Verification Methodology

Every claim in this matrix represents an independently inspected, empirically verified state of the deployed GNU Health / Tryton outpatient clinic implementation. 

In accordance with strict project governance rules:
- No claim is accepted without technical evidence (direct database query, filesystem inspection, or network probe).
- Proposed or planned configurations are strictly separated from verified empirical facts.
- Status values follow the authoritative taxonomy: `VERIFIED`, `CONFIGURATION REQUIRED`, `MASTER DATA REQUIRED`, `BUSINESS APPROVAL REQUIRED`, `ACCOUNTING APPROVAL REQUIRED`, `SECURITY ACTION REQUIRED`, `TESTING REQUIRED`, `NETWORK SECURITY VALIDATION REQUIRED`, `POTENTIAL / OPTIONAL INTEGRATION`, `BLOCKED`.

---

## 2. Authoritative Evidence Matrix

| Claim | Source | Evidence Type | Status | Last Verified | Notes |
| :--- | :--- | :--- | :---: | :---: | :--- |
| **GNU Health version** | `tryton.cfg` manifest, `/home/gnuhealth/venv`, JSON-RPC | Configuration manifest & runtime package inspection | `VERIFIED` | 2026-09-21 | Version 5.0.7 (Core: `health 5.0.6`). Standard upstream packages; zero custom forks. |
| **Tryton version** | `trytond --version`, `gnuhealth.service` | Process execution & package metadata | `VERIFIED` | 2026-09-21 | Tryton Server 7.0.57 LTS managed under systemd supervision. |
| **PostgreSQL version** | `SELECT version();`, Unix socket `/var/run/postgresql/` | Database engine runtime query | `VERIFIED` | 2026-09-21 | PostgreSQL 15.15 on Debian 12. UTF-8 encoding; peer/socket authentication. |
| **Patient count** | JSON-RPC query on model `gnuhealth.patient` (`active_test=False`) | Empirical database query | `VERIFIED` | 2026-09-21 | Exactly 0 records. Clean pre-operational baseline; zero clinical contamination. |
| **Doctor count** | JSON-RPC query on model `gnuhealth.healthprofessional` | Empirical database query | `MASTER DATA REQUIRED` | 2026-09-21 | Exactly 0 records. Physician onboarding and QCHP credential capture pending clinic input. |
| **Accounting fiscal years** | JSON-RPC query on model `account.fiscalyear` | Empirical database query | `ACCOUNTING APPROVAL REQUIRED` | 2026-09-21 | Current fiscal-year record count: 0. Proposed fiscal year: FY2026, subject to Finance approval. Blocker for invoicing. |
| **ICD-10 catalog** | JSON-RPC query on model `gnuhealth.pathology` | Empirical database query | `VERIFIED` | 2026-09-21 | 14,416 WHO ICD-10 pathology records preloaded, indexed, and operational. |
| **Services** | JSON-RPC query on model `product.product` | Empirical database query | `BUSINESS APPROVAL REQUIRED` | 2026-09-21 | 15 clinical outpatient services loaded with 0.00 QAR fees. Approved tariff schedule required. |
| **Pharmacy** | Queries on `gnuhealth.drug.form`, `gnuhealth.drug.route`, `gnuhealth.medicament` | Empirical database query | `MASTER DATA REQUIRED` | 2026-09-21 | 94 dosage forms and 47 routes loaded. 0 commercial medications in `gnuhealth.medicament`. |
| **Laboratory** | Queries on `gnuhealth.lab.test_type` and `gnuhealth.patient.lab.test` | Empirical database query | `MASTER DATA REQUIRED` | 2026-09-21 | 9 lab categories preloaded. In-house laboratory test catalog and reference intervals pending. |
| **Radiology** | Queries on `gnuhealth.imaging.test.type` and `gnuhealth.imaging.test.request` | Empirical database query | `MASTER DATA REQUIRED` | 2026-09-21 | 8 modalities preloaded; 1 generic CXR type loaded. Procedure menu and pricing pending. |
| **Users** | JSON-RPC query on model `res.user` | Empirical database query | `MASTER DATA REQUIRED` | 2026-09-21 | 1 active `admin`; 1 inactive `root`; 7 inactive demo accounts. Named staff logins pending HR roster. |
| **HTTPS** | Nginx site configuration & Port 80 HTTP probe | Network service probe & config audit | `HTTPS/TLS PRODUCTION CONFIGURATION REQUIRED` | 2026-09-21 | Accessible via unencrypted HTTP Port 80. Domain binding and TLS certificate required. |
| **Firewall** | GCP VPC rule `allow-gnuhealth-web` & port scan | Architecture review & security finding | `NETWORK SECURITY VALIDATION REQUIRED` | 2026-09-21 | Port 8000 reported open to public internet. Direct GCP VPC firewall lockdown to localhost required. |
| **Backup** | Filesystem inspection (`/home/gnuhealth/backup_gnuhealth.sh`) | Script existence inspection | `CONFIGURATION REQUIRED` | 2026-09-21 | Existing (script present); Configured (cron pending); Verified (not in prod); Tested (restore script ready). |
| **UAT** | `MASTER_UAT_PLAN.md` specification | Quality assurance test plan | `TESTING REQUIRED` | 2026-09-21 | 17 operational scenarios defined. Execution pending master data onboarding and fiscal year opening. |

---

## 3. Evidence Governance Summary

```text
========================================================================================
EVIDENCE VERIFICATION VERDICT
========================================================================================
Technical Platform Baseline:     VERIFIED; PRODUCTION HARDENING REQUIRED
Operational Data Baseline:        CLEAN & CONTAMINATION-FREE (0 TRANSACTIONS)
Clinic Master Data Baseline:     PENDING CLINIC INPUT
Accounting Configuration:        BLOCKED (FISCAL YEAR REQUIRED - FINANCE APPROVAL PENDING)
Security & Perimeter:            SECURITY HARDENING & NETWORK VALIDATION REQUIRED
========================================================================================
```

---

## 4. Final Readiness Table

| Domain | Status |
| :--- | :--- |
| GNU Health / Tryton source | `VERIFIED` |
| Repository structure | `VERIFIED` |
| Database baseline | `VERIFIED` |
| Reference master data | `VERIFIED` |
| Clinic-specific master data | `PENDING CLINIC INPUT` |
| Accounting | `PENDING APPROVAL` |
| Security hardening | `ACTION REQUIRED` |
| Network perimeter | `VALIDATION REQUIRED / ACTION REQUIRED` |
| User onboarding | `REQUIRED` |
| Functional workflows | `TESTING REQUIRED` |
| UAT | `TESTING REQUIRED` |
| External integrations | `PENDING REQUIREMENT CONFIRMATION` |
| Custom development | `NOT CURRENTLY IDENTIFIED` |
| Production go-live | `BLOCKED` |

---

## 5. Implementation Position

```text
CURRENT IMPLEMENTATION POSITION

The GNU Health/Tryton platform and repository have been audited and the
current technical baseline has been documented.

The database is in a clean pre-operational state with no live patient or
clinical transaction data.

The remaining work is primarily controlled implementation activity:

1. Requirements and stakeholder approval
2. Security hardening
3. Clinic-specific master-data onboarding
4. Accounting configuration and approval
5. User/role onboarding
6. Functional configuration
7. End-to-end UAT
8. Training
9. Go-live approval

No custom development is currently identified for the documented outpatient
scope. This remains subject to requirements confirmation, integration
decisions and UAT.

Production go-live must remain gated by the approved GO_LIVE_CHECKLIST.md.
```

