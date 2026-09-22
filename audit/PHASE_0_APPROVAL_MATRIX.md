# PHASE 0 APPROVAL & ACCESS GATING MATRIX
## GNU HEALTH HMIS OUTPATIENT CLINIC

**Classification**: Authoritative Gating & Approval Tracking Matrix  
**Platform**: GNU Health HMIS 5.0.7 / Tryton 7.0.57 / PostgreSQL 15.15 / Debian 12  
**Target Environment**: APPLICATION SERVER / PRODUCTION HOST (`34.7.237.8`)  
**Document**: `audit/PHASE_0_APPROVAL_MATRIX.md`  
**Date**: 2026-09-21  
**Current Gate Verdict**: `PHASE 0 EXECUTION BLOCKED — AWAITING ALL APPROVALS`  

---

## 1. Comprehensive Approval & Access Matrix

The following table tracks every required governance approval, operational permission, technical credential, and infrastructure configuration necessary prior to initiating Phase 0 Security Hardening. 

In strict adherence to project safety rules, status values remain `BLOCKED` or `PENDING` until empirical, documentary, or technical proof is verified:

| Approval / Access | Required From | Evidence Required | Status |
| :--- | :--- | :--- | :---: |
| **Requirements Baseline** | `<PENDING APPROVER>`<br>(Clinic Executive / Operations Director) | Formally signed and dated signature block on [`FINAL_REQUIREMENTS_BASELINE.md`](file:///c:/Users/MohammedSohail/OneDrive%20-%20IRISSTAR%20TECHNOLOGIES/GNU%20Health/FINAL_REQUIREMENTS_BASELINE.md). | `BLOCKED — PENDING SIGN-OFF` |
| **Phase 0 Authorization** | `<PENDING APPROVER>`<br>(Clinic Executive / Project Sponsor) | Formal written change authorization to execute live configuration hardening as detailed in [`audit/PHASE_0_EXECUTION_PLAN.md`](file:///c:/Users/MohammedSohail/OneDrive%20-%20IRISSTAR%20TECHNOLOGIES/GNU%20Health/audit/PHASE_0_EXECUTION_PLAN.md). | `BLOCKED — PENDING AUTHORIZATION` |
| **Maintenance Window** | `<PENDING APPROVER>`<br>& Clinic Operations Team | Operational sign-off sheet designating a 30-minute off-peak service interruption window (`<PENDING MAINTENANCE WINDOW>`). | `BLOCKED — PENDING SCHEDULING` |
| **Rollback Approval** | `<PENDING OWNER>`<br>(Technical Implementation Lead) | Formal technical review and sign-off on Section 12 rollback procedures in [`audit/PHASE_0_EXECUTION_PLAN.md`](file:///c:/Users/MohammedSohail/OneDrive%20-%20IRISSTAR%20TECHNOLOGIES/GNU%20Health/audit/PHASE_0_EXECUTION_PLAN.md). | `BLOCKED — PENDING TECHNICAL REVIEW` |
| **Production SSH Access** | Cloud / System Administrator | Verified SSH key-pair authentication to `gnuhealth@34.7.237.8` (or jump-host) without password authentication. | `BLOCKED — PENDING ACCESS PROVISIONING` |
| **Sudo / Root Capability** | System Administrator | Sudoers privilege allowing execution of `trytond-admin`, `systemctl` service restarts, and PostgreSQL maintenance commands. | `BLOCKED — PENDING ACCESS PROVISIONING` |
| **GCP IAM Permissions** | GCP Project Owner / Cloud IAM Lead | Predefined role `roles/compute.securityAdmin` assigned to operator account on target GCP project hosting `gnuhealth-srv`. | `BLOCKED — PENDING IAM ASSIGNMENT` |
| **Official Clinic FQDN** | Clinic Management / Legal Entity | Official written designation of the clinic's public domain name (`<PENDING FQDN>`). No generic or test placeholders permitted. | `BLOCKED — PENDING CLINIC INPUT` |
| **DNS Access & Mapping** | Clinic IT / Domain Registrar Authority | Public DNS `A` record query confirming that `<PENDING FQDN>` resolves directly to `34.7.237.8` (`dig +short <FQDN>`). | `BLOCKED — PENDING DNS RECORD CREATION` |
| **Backup Destination** | `<PENDING OWNER>`<br>(DevOps Engineer) | On-disk inspection of `/home/gnuhealth/backups/` confirming directory existence, `chmod 700` permissions, and $> 5\text{ GB}$ free disk space. | `BLOCKED — PENDING HOST ACCESS INSPECTION` |
| **Credential Rotation Authorization** | `<PENDING APPROVER>`<br>& Medical Director | Formal instruction authorizing the technical lead to execute `trytond-admin -p` and rotate the initial provisioning credential. | `BLOCKED — PENDING AUTHORIZATION` |
| **Firewall-Change Authorization** | Cloud Security Lead / IT Director | Approved Cloud Security Change Ticket permitting edge restriction of TCP Port 8000 on GCP VPC firewall. | `BLOCKED — PENDING AUTHORIZATION` |

---

## 2. Designated Roles & Accountabilities

To maintain strict accountability, all roles remain unassigned until formally designated by clinic executive management:

```text
+------------------------------------+---------------------------------------+-----------------------------+
| Role Description                   | Designated Individual                 | Contact / Channel           |
+------------------------------------+---------------------------------------+-----------------------------+
| Technical Implementation Owner     | <PENDING OWNER>                       | <PENDING CONTACT>           |
| Executive Management Approver      | <PENDING APPROVER>                    | <PENDING CONTACT>           |
| Medical Director / Clinical Lead   | <PENDING MEDICAL DIRECTOR>            | <PENDING CONTACT>           |
| Cloud Infrastructure Administrator | <PENDING CLOUD ADMIN>                 | <PENDING CONTACT>           |
| DNS & Domain Registrar Authority   | <PENDING DNS ADMIN>                   | <PENDING CONTACT>           |
+------------------------------------+---------------------------------------+-----------------------------+
```

---

## 3. Gating Evaluation Summary

```text
========================================================================================
PHASE 0 APPROVAL MATRIX EVALUATION
========================================================================================
TOTAL APPROVAL & ACCESS GATES EVALUATED: 12
CONFIRMED / SATISFIED:                   0
BLOCKED / PENDING:                       12
========================================================================================
CURRENT STATUS: PHASE 0 EXECUTION BLOCKED
No changes may be initiated until all 12 items are marked CONFIRMED with verified evidence.
========================================================================================
```
