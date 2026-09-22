# 03. Codebase Classification Matrix

**Project**: Healthcare Management System — GNU Health Implementation  
**Assessment Date**: 2026-09-21  
**Audit Role**: Senior Software Architect & DevOps Engineer  
**Document**: `audit/codebase-classification.md` (and `03_CODEBASE_CLASSIFICATION.md`)  

---

## 1. Classification Taxonomy

Every component across the repository is classified according to the following strict operational criteria:

| Category | Definition | Action Rule |
| :--- | :--- | :--- |
| **`CORE`** | Upstream GNU Health / Tryton framework code | **PRESERVE INTACT** — Do not modify |
| **`CUSTOM`** | Project-specific source code | Maintain and document |
| **`CONFIGURATION`**| System settings, master data, security, workflow | Maintain in versioned config directory |
| **`REQUIRED`** | Essential for system deployment or runtime | Protect from deletion |
| **`OPTIONAL`** | Functional modules available but not currently activated | Retain for future clinic expansion |
| **`DUPLICATE`** | Redundant copies of existing files or data | Consolidate / remove redundant copies |
| **`OBSOLETE`** | Superseded early prototypes or abandoned versions | Archive or safely remove |
| **`UNUSED`** | Present in repository but unreferenced | Review and archive |
| **`GENERATED`** | Output of compilation, serialization, or tooling | Keep only if needed for rollback/audit |
| **`TEMPORARY`** | Transient test artifacts or scratch files | Purge safely |
| **`UNKNOWN`** | Purpose cannot yet be established | Mark `REVIEW_REQUIRED` |

---

## 2. Comprehensive Inventory Classification

### A. Repository Root & Deployment Assets

| File / Component Path | Category | Purpose | References / Dependencies | Recommendation | Risk of Removal |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **`deploy_gcp_gnuhealth.sh`** | `REQUIRED` / `CONFIGURATION` | Automated cloud provisioning script for GCP Compute Engine | Standalone execution | Move to `deployment/` | High (Destroys cloud runbook) |
| **`finish_setup.sh`** | `REQUIRED` / `CONFIGURATION` | Tryton SAO setup and daemon finalizer | Executed on VM during setup | Move to `deployment/` | High (Needed for VM rebuilds) |
| **`startup_gnuhealth.sh`** | `REQUIRED` / `CONFIGURATION` | VM startup script for Debian OS and package setup | Called by `deploy_gcp_gnuhealth.sh` | Move to `deployment/` | High (Needed for VM provisioning) |
| **`deploy_gcp.sh`** | `OBSOLETE` | 59-line early prototype script superseded by `deploy_gcp_gnuhealth.sh` | Superseded; no active caller | Move to `deployment/archive/` | None (Superseded) |
| **`startup_b64.txt`** | `DUPLICATE` / `GENERATED` | Base64 encoded payload of `startup_gnuhealth.sh` | 0 references in workspace | Archive to `backup/` then remove | None |

### B. Upstream Core Source Tree (`his/`)

| Directory / File Path | Category | Purpose | Recommendation | Risk of Removal |
| :--- | :--- | :--- | :--- | :--- |
| **`his/tryton/health/`** | `CORE` / `REQUIRED` | GNU Health core clinical model and medical logic | **PRESERVE INTACT** | **CRITICAL** (System will not function) |
| **`his/tryton/health_*/` (23 Active)** | `CORE` / `REQUIRED` | 23 activated clinical modules (Inpatient, Lab, Imaging, etc.) | **PRESERVE INTACT** | **CRITICAL** (Breaks active modules) |
| **`his/tryton/health_*/` (30 Inactive)** | `CORE` / `OPTIONAL` | 30 inactive upstream modules (Dentistry, Ophthalmology, etc.) | **PRESERVE INTACT** | Medium (Prevents future modular expansion) |
| **`his/scripts/`** | `CORE` / `OPTIONAL` | Code linting, security scanning, and module test scripts | Preserve for QA | Low |
| **`his/tryton/doc/`** | `CORE` / `DOCUMENTATION` | Upstream GNU Health documentation | Preserve | None |
| **`his/tryton/LICENSES/` & COPYING** | `CORE` / `REQUIRED` | GPL-3.0 and third-party license legal compliance | **PRESERVE INTACT** | High (Violates licensing) |

### C. Configuration & Governance Assets (`gnuhealth-qatar-clinic-config/`)

| File / Component Path | Category | Purpose | Recommendation | Risk of Removal |
| :--- | :--- | :--- | :--- | :--- |
| **`clinic-config.yaml`** | `CONFIGURATION` / `REQUIRED` | Consolidated clinic configuration specification | Preserve in `configuration/` | High (Primary config source) |
| **`master-data/*.yaml`** | `CONFIGURATION` / `REQUIRED` | Master data ingestion templates (Doctors, Rx, Insurance, Lab) | Preserve in `configuration/master-data/` | High (Needed for clinic onboarding) |
| **`backup/pre_config_snapshot.json`** | `GENERATED` / `REQUIRED` | Baseline database state prior to configuration | Preserve in `backup/` | High (Needed for audit & rollback) |
| **`backup/test_data_before_cleanup.json`**| `GENERATED` / `REQUIRED` | Backup of synthetic test encounter data prior to ORM purge | Preserve in `backup/` | High (Needed for audit proof) |
| **`configuration/raw_audit_dump.json`** | `GENERATED` / `REQUIRED` | Raw Tryton JSON-RPC model audit output | Preserve in `audit/` | Low |
| **`01_SYSTEM_AUDIT.md` to `24_...`** | `DOCUMENTATION` | Technical audit and configuration history | Reorganize into `docs/` and `audit/` | Low (Must maintain audit trail) |

---

## 3. Questionable Components Review

### Item 1: `startup_b64.txt`
- **Path**: `c:\Users\MohammedSohail\OneDrive - IRISSTAR TECHNOLOGIES\GNU Health\startup_b64.txt`
- **Type**: Plaintext base64 string (4,926 bytes).
- **Purpose**: Previously created to pass `startup_gnuhealth.sh` as metadata to Google Compute Engine.
- **References**: Searched entire workspace via ripgrep; zero (0) references found.
- **Dependency**: Neither Tryton, PostgreSQL, Debian, nor `deploy_gcp_gnuhealth.sh` depend on this file (`deploy_gcp_gnuhealth.sh` generates its payload dynamically on line 219).
- **Recommendation**: Archive copy into `backup/` and delete from repository root to eliminate clutter.
- **Risk of Removal**: **None**.

### Item 2: `deploy_gcp.sh`
- **Path**: `c:\Users\MohammedSohail\OneDrive - IRISSTAR TECHNOLOGIES\GNU Health\deploy_gcp.sh`
- **Type**: Bash shell script (59 lines).
- **Purpose**: Initial deployment test script.
- **References**: Completely superseded by `deploy_gcp_gnuhealth.sh` (249 lines), which handles VPC rules, automated startup script generation, VM creation, and status monitoring.
- **Recommendation**: Move to `deployment/archive/deploy_gcp_v1_prototype.sh`.
- **Risk of Removal**: **None**.
