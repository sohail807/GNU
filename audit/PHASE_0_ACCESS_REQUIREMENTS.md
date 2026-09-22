# PHASE 0 ACCESS & AUTHORIZATION REQUIREMENTS SPECIFICATION
## GNU HEALTH HMIS OUTPATIENT CLINIC

**Classification**: Authoritative Pre-Execution Access & Prerequisite Specification  
**Platform**: GNU Health HMIS 5.0.7 / Tryton 7.0.57 / PostgreSQL 15.15 / Debian 12  
**Target Environment**: APPLICATION SERVER / PRODUCTION HOST (`34.7.237.8`)  
**Document**: `audit/PHASE_0_ACCESS_REQUIREMENTS.md`  
**Date**: 2026-09-21  
**Execution State**: `EXECUTION PENDING AUTHORIZATION — READ-ONLY PLANNING BASELINE`  

---

## 1. Document Purpose & Operational Context

This document defines the comprehensive inventory of access credentials, organizational authorizations, cloud permissions, domain configurations, and backup criteria strictly required before executing Phase 0 Security Hardening.

> [!IMPORTANT]
> **GOVERNANCE BOUNDARY**:  
> No live infrastructure, database, service daemon, firewall, or credential changes may be attempted until every access prerequisite defined herein is confirmed and provisioned to the authorized technical implementation team. No passwords, private keys, API tokens, or cloud service account keys are stored or requested in this repository.

---

## 2. Governance Prerequisites

The following organizational approvals and designations must be established in writing prior to commencing Phase 0 execution:

### 2.1 Formal Requirements Baseline Sign-Off
* **Artifact**: [`FINAL_REQUIREMENTS_BASELINE.md`](file:///c:/Users/MohammedSohail/OneDrive%20-%20IRISSTAR%20TECHNOLOGIES/GNU%20Health/FINAL_REQUIREMENTS_BASELINE.md).
* **Requirement**: Formal signature from executive clinic management confirming the functional scope, outpatient clinic workflows, and security baseline.
* **Status**: `BLOCKED — PENDING CLINIC SIGN-OFF`.

### 2.2 Phase 0 Security-Hardening Authorization
* **Artifact**: [`audit/PHASE_0_EXECUTION_PLAN.md`](file:///c:/Users/MohammedSohail/OneDrive%20-%20IRISSTAR%20TECHNOLOGIES/GNU%20Health/audit/PHASE_0_EXECUTION_PLAN.md).
* **Requirement**: Explicit technical and administrative authorization from clinic leadership permitting the technical team to modify host configuration files, rotate administrative passwords, update firewall rules, and install TLS certificates.
* **Status**: `BLOCKED — PENDING WRITTEN AUTHORIZATION`.

### 2.3 Approved Operational Maintenance Window
* **Window Duration**: Minimum 30 minutes, maximum 60 minutes.
* **Window Criteria**: Scheduled during off-peak hours (e.g., Friday morning or evening after clinic shift close).
* **Notification**: Clinic stakeholders and system users notified in advance of service restarts and temporary HTTP/HTTPS unavailability.
* **Status**: `BLOCKED — PENDING MAINTENANCE WINDOW SCHEDULING (<PENDING MAINTENANCE WINDOW>)`.

### 2.4 Approved Rollback Procedure
* **Artifact**: [`audit/PHASE_0_EXECUTION_PLAN.md`](file:///c:/Users/MohammedSohail/OneDrive%20-%20IRISSTAR%20TECHNOLOGIES/GNU%20Health/audit/PHASE_0_EXECUTION_PLAN.md) (Section 12).
* **Requirement**: Formal sign-off on the step-by-step technical rollback runbook for Tryton configuration, Nginx virtual host, GCP firewall rules, and PostgreSQL database snapshot restoration.
* **Status**: `BLOCKED — PENDING TECHNICAL SIGN-OFF`.

### 2.5 Named Technical Owner & Approvers
* **Named Technical Implementation Lead**: `<PENDING OWNER>` (Responsible for executing the operator runbook).
* **Named Business / Management Approver**: `<PENDING APPROVER>` (Clinic Executive / Operations Director with sign-off authority).
* **Named Clinical Authority**: `<PENDING MEDICAL DIRECTOR>` (Medical Director overseeing clinical data governance).
* **Status**: `PENDING APPOINTMENT`.

---

## 3. Production Host Access Requirements

To perform host-level configuration, credential rotation, and backup validation, the technical lead requires direct shell access to the production virtual machine (`gnuhealth-srv` / `34.7.237.8`):

### 3.1 Secure Shell (SSH) Access
* **Protocol**: SSHv2 on standard TCP Port 22 (or authorized bastion/jump-host endpoint).
* **Target OS User**: Dedicated administrative service account (e.g., `gnuhealth` or individual named administrator account).
* **Authentication Method**: Cryptographic SSH key-pair authentication (ED25519 or RSA 4096-bit); password-based SSH authentication should be disabled.
* **Security Rule**: Private keys must be managed exclusively within the technician's secure workstation keychain and **never** committed or stored in repository files.

### 3.2 Operating System Privileges (Sudo / Root)
* **Required Privilege**: Sudo capability for specific administrative binaries without interactive password prompt or with approved elevation mechanism:
  - `systemctl reload/restart/status gnuhealth.service`
  - `systemctl reload/restart/status nginx.service`
  - `nginx -t` (Configuration syntax validation)
  - `certbot` / `apt-get` (TLS certificate provisioning)
  - Read/write access to `/etc/nginx/` and `/home/gnuhealth/`
  - Direct execution of `/home/gnuhealth/venv/bin/trytond-admin` under unix user `gnuhealth`
  - Read/write access to PostgreSQL utilities (`sudo -u postgres pg_dump`, `sudo -u postgres pg_restore`).

### 3.3 Inspection & Audit Capabilities
The operator must have the explicit capability to inspect:
1. **Tryton Runtime Configuration**: `/home/gnuhealth/trytond.conf` (ensuring permissions `chmod 600` owned by `gnuhealth:gnuhealth`).
2. **Nginx Virtual Host Configuration**: `/etc/nginx/sites-available/gnuhealth` and `/etc/nginx/sites-enabled/`.
3. **Backup Filesystem Directory**: `/home/gnuhealth/backups/` (verifying write access, disk capacity, and permissions `chmod 700`).
4. **Service & System Logs**: `journalctl -u gnuhealth.service`, `/var/log/nginx/access.log`, `/var/log/nginx/error.log`, and PostgreSQL system logs.

---

## 4. Google Cloud Platform (GCP) Access Requirements

Direct external reachability on TCP Port 8000 was confirmed via network probing, but cloud-side perimeter rules cannot be verified or altered without cloud infrastructure access:

### 4.1 Cloud IAM Role Requirements
The technical operator or cloud engineer must be granted an IAM role with the least privileges required to inspect and update VPC firewall rules:
* **Predefined IAM Role**: `roles/compute.securityAdmin` (Compute Security Admin) or custom role with:
  - `compute.firewalls.get`
  - `compute.firewalls.list`
  - `compute.firewalls.update`
* **GCP Resource Scope**: Project hosting the GNU Health application VM instance (`gnuhealth-srv`).

### 4.2 Required Cloud-Side Operational Tasks
1. **Inspect Current VPC Firewall Rules**: List all ingress rules affecting the instance network and tags.
2. **Identify Responsible Rule**: Empirically locate the exact rule permitting external ingress to TCP 8000.
   > [!WARNING]
   > **DO NOT ASSUME RULE NAME**:  
   > While deployment scripts referenced a rule named `allow-gnuhealth-web`, the operator must independently verify whether this rule or another broad ingress rule is responsible for TCP 8000 exposure before modifying any rule.
3. **Modify / Restrict Ingress Rule**:
   - Remove `tcp:8000` from allowed external ingress ports.
   - Restrict external ingress strictly to `tcp:80` and `tcp:443`.
   - Maintain SSH administration access (`tcp:22`) via approved source IP ranges or Identity-Aware Proxy (IAP).
4. **Verify Effective Perimeter**: Validate via Cloud Console / `gcloud compute firewall-rules list` that external routing to TCP 8000 is terminated at the edge.

---

## 5. DNS & TLS Transport Security Requirements

Configuring Nginx with valid TLS termination and permanent redirection from HTTP to HTTPS strictly depends on official clinic domain designation:

### 5.1 Official Clinic FQDN
* **Designation**: Written confirmation of the clinic's official Fully Qualified Domain Name (e.g., `clinic.domain.qa` or `his.clinicname.qa`).
* **Policy**: Generic placeholders (e.g., `<PENDING_FQDN>`, `<CLINIC_NAME>`) or test domain names must NOT be used.
* **Status**: `BLOCKED — PENDING CLINIC INPUT`.

### 5.2 DNS Management & Mapping Authority
* **DNS Control**: Access to the clinic's DNS registrar / authoritative nameserver (e.g., QDomains / Cloudflare / Azure DNS / Route53).
* **Record Type**: Public DNS `A` record (and `AAAA` if IPv6 enabled) mapping `<OFFICIAL_CLINIC_FQDN>` directly to the public IP address `34.7.237.8`.
* **Verification Precondition**: Public DNS propagation verified globally (`dig +short <OFFICIAL_CLINIC_FQDN> == 34.7.237.8`) prior to running ACME/Certbot challenges.

### 5.3 Approved Certificate Strategy & Baseline
* **Certificate Authority**: Let's Encrypt automated ACME certificates via Certbot, or enterprise/commercial CA-issued certificate and private key.
* **Protocol Baseline**:
  - Minimum Baseline: **TLS 1.2 or higher**.
  - Preferred Protocol: **TLS 1.3 preferred** where supported by client endpoints.
  - Legacy Protocols: TLS 1.0 and TLS 1.1 must remain strictly disabled.
* **Security Headers**: HSTS (`Strict-Transport-Security`), `X-Frame-Options SAMEORIGIN`, `X-Content-Type-Options nosniff`.

---

## 6. Pre-Change Database Backup Requirements

Under no circumstances may any configuration file, service binding, or credential hash be altered until an empirical, validated database backup is physically created on disk:

### 6.1 Strict Empirical Criteria
The backup is considered valid and acceptable as a pre-change safety gate **ONLY** when all four criteria are satisfied:
1. **Physical Existence on Disk**: File exists at `/home/gnuhealth/backups/gnuhealth_pre_phase0_<TIMESTAMP>.dump`.
2. **Non-Zero File Size**: File size is non-zero and consistent with full schema and reference data (expected: $> 25\text{ MB}$).
3. **Integrity Validation**: Command `sudo -u postgres pg_restore --list <DUMP_FILE>` executes successfully and outputs table table of contents without errors.
4. **Maintenance Window Timestamp**: File creation timestamp is recorded strictly within the approved maintenance window prior to changes.

### 6.2 Target Command & Parameters
```bash
# Target execution under postgres system user
sudo -u postgres pg_dump -Fc gnuhealth > /home/gnuhealth/backups/gnuhealth_pre_phase0_$(date +%Y%m%d_%H%M%S).dump
```

### 6.3 Documented Restoration & Acceptance Runbook
* **Restoration Command**:
  ```bash
  sudo -u postgres pg_restore -d gnuhealth --clean --if-exists /home/gnuhealth/backups/<DUMP_FILE>
  ```
* **Acceptance Requirement**: In the event of an execution failure, the database must be restorable to the pre-change state within 10 minutes without schema corruption or transaction loss.
* **No Existing Backup Assumption**: No backup can be presumed to exist until physically validated via the steps above.

---

## 7. Summary of Current Access Gaps

```text
========================================================================================
PHASE 0 ACCESS REQUIREMENTS AUDIT SUMMARY
========================================================================================
1. Governance Approvals:    0 of 5 Confirmed (ALL PENDING SIGN-OFF)
2. Production Host Access:   0 of 3 Confirmed (SSH, Sudo, Inspection PENDING PROVISIONING)
3. GCP Cloud IAM Access:     0 of 2 Confirmed (Firewall View/Edit PENDING ASSIGNMENT)
4. DNS & FQDN Designation:   0 of 3 Confirmed (FQDN, DNS A-Record, ACME PENDING INPUT)
5. Backup Precondition:      0 of 3 Confirmed (On-Host Dump, Validation, Storage PENDING)
========================================================================================
CURRENT STATUS: ALL ACCESS PREREQUISITES REMAIN BLOCKED
EXECUTION MAY NOT COMMENCE UNTIL EVERY REQUIREMENT IS FORMALLY PROVISIONED
========================================================================================
```
