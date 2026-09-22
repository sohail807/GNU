# 04. Cleanup Change Log

**Project**: Healthcare Management System — GNU Health Implementation  
**Assessment Date**: 2026-09-21  
**Execution Lead**: DevOps & System Architect  
**Status**: `VERIFIED & COMPLETE`  
**Document**: `audit/cleanup-changelog.md` (and `04_CLEANUP_CHANGELOG.md`)  

---

## 1. Overview & Policy

In strict accordance with Rule 4 ("NEVER DELETE FIRST"), every item considered for removal or reorganization underwent:
1. Purpose identification.
2. Reference checking via workspace-wide grep.
3. Upstream GNU Health / Tryton dependency verification.
4. Pre-removal snapshot archiving to `backup/`.
5. Safe migration or removal.

---

## 2. Cleanup Actions Log

| # | Original Path | Action | Reason | Dependency Check | Risk Assessment | Rollback Location |
| :---: | :--- | :--- | :--- | :--- | :--- | :--- |
| **1** | `startup_b64.txt` | **Archived & Removed** | Exact redundant base64-encoded copy of `startup_gnuhealth.sh`. | 0 references found in codebase. No script uses this file. | **None** | `backup/pre_cleanup_root_archive/startup_b64.txt` |
| **2** | `deploy_gcp.sh` | **Archived to Deployment** | 59-line early prototype deployment script, completely superseded by `deploy_gcp_gnuhealth.sh` (249 lines). | Standalone script; no external callers. | **None** | `deployment/archive/deploy_gcp_prototype.sh` & `backup/` |
| **3** | `deploy_gcp_gnuhealth.sh` | **Preserved & Reorganized** | Active cloud provisioning runbook. | Primary deployment script for GCP Compute Engine. | **Preserved** | `deployment/deploy_gcp_gnuhealth.sh` |
| **4** | `finish_setup.sh` | **Preserved & Reorganized** | Post-installation daemon and SAO web client configuration script. | Required for VM re-provisioning or service setup. | **Preserved** | `deployment/finish_setup.sh` |
| **5** | `startup_gnuhealth.sh` | **Preserved & Reorganized** | VM OS startup and Debian package bootstrap script. | Referenced by cloud provisioning runbooks. | **Preserved** | `deployment/startup_gnuhealth.sh` |
| **6** | `his/` (Source Tree) | **Preserved Intact** | Upstream GNU Health 5.0.7 source preserved and repository integrity verified. | Core clinical and framework dependency. | **Zero Deletions** | Intact at `his/` |
| **7** | Synthetic Test Encounters | **Purged via Tryton ORM** | Test patient, doctor, appointment, evaluation, lab, imaging, prescription records on live DB. | Purged in reverse dependency order; zero SQL DELETE calls. | **Zero Clinical Impact** | `gnuhealth-qatar-clinic-config/backup/test_data_before_cleanup.json` |

---

## 3. Rollback Instructions

Should any archived file be required in its original location:
1. Copy `backup/pre_cleanup_root_archive/startup_b64.txt` back to root:
   ```powershell
   Copy-Item "backup\pre_cleanup_root_archive\startup_b64.txt" "startup_b64.txt"
   ```
2. Copy `deployment/archive/deploy_gcp_prototype.sh` back to root:
   ```powershell
   Copy-Item "deployment\archive\deploy_gcp_prototype.sh" "deploy_gcp.sh"
   ```
