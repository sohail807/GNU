# 23. Security Audit

**Audit Date**: 2026-09-21  
**Target Server**: GCP Compute Engine `gnuhealth-srv` (IP: `34.7.237.8`)  
**Status**: `SECURITY_REVIEW_REQUIRED`  
**Classification**: High Priority Pre-Production Gate  

---

## 1. Executive Summary

This security audit inspects the access controls, credential management, network exposure, and encryption status of the GNU Health 5.0 / Tryton 7.0 deployment. 

While core application-level role separation is established, **the system is currently running on unencrypted HTTP (Port 80) and utilizes initial provisioning credentials**. Mandatory hardening actions must be completed before clinical go-live.

---

## 2. Access Control & Role Matrix Audit

### A. Tryton Security Groups
Tryton manages permissions through 28 distinct functional groups in `res.group`. The system enforces clear separation of concerns:
- **Administrative Groups**: `Administration` (1), `Company Administration` (4), `Currency Administration` (2), `Party Administration` (3).
- **Clinical Groups**: `Health Administration` (11), `Health Doctor` (15), `Health Nurse` (13), `Health Front Desk` (14), `Health Back Office` (17).
- **Departmental Groups**: `Health Lab` (23), `Health Imaging` (20), `Account` (6).

### B. Medical Record Immutability Verification
- GNU Health enforces read-only immutability for patient evaluations (`gnuhealth.patient.evaluation`) across standard clinical roles (`perm_delete = False`).
- Verification confirms that test encounter deletion required administrative override on model access rules, which was immediately reverted. Regular clinical staff and physicians cannot delete patient consultations.

---

## 3. Network & Transport Security Findings

### Finding SEC-01: Unencrypted HTTP Web Access [CRITICAL]
- **Current State**: The Tryton SAO web client is accessible over unencrypted HTTP on port 80 (`http://34.7.237.8`).
- **Risk**: Patient Health Information (PHI), physician credentials, and session tokens transmitted in plaintext across the public internet, violating Qatar MOPH patient privacy standards.
- **Action Required**: 
  1. Bind an official clinic domain name (e.g., `clinic.example.qa`) to the server IP.
  2. Issue and install a valid TLS/SSL certificate (e.g., Let's Encrypt or commercial SSL).
  3. Configure Nginx to enforce HTTPS (Port 443) with HTTP-to-HTTPS 301 redirection and HSTS headers.

### Finding SEC-02: Initial Provisioning Credentials [CRITICAL]
- **Current State**: The Tryton `admin` superuser password was generated during VM startup and remains unchanged.
- **Risk**: Unauthorized administrative access if initial deployment files or logs are compromised.
- **Action Required**:
  1. Immediately rotate the Tryton `admin` user password via `trytond-admin -c trytond.conf -d gnuhealth -p`.
  2. Create named administrative accounts for IT staff and disable general shared use of the superuser account.
  3. Securely archive or shred `/home/gnuhealth/admin_password.txt` on the host VM.

### Finding SEC-03: Cloud Firewall & Network Exposure [MEDIUM]
- **Current State**: Port 80, 443, and 8000 are open in GCP VPC firewall rules to `0.0.0.0/0`.
- **Risk**: Direct access to Tryton daemon on port 8000 bypasses Nginx reverse proxy buffering and rate limiting.
- **Action Required**:
  1. Restrict GCP firewall rule `allow-gnuhealth-web` to ports 80 and 443 only.
  2. Ensure Tryton daemon binds only to `127.0.0.1:8000` so external traffic is forced through Nginx.

---

## 4. Redaction Verification

All operational documentation, change logs, and validation templates within `gnuhealth-qatar-clinic-config` have been verified for zero credential exposure:
- [x] Superuser password string redacted (`[REDACTED]`).
- [x] Tryton JSON-RPC session tokens redacted (`[REDACTED_SESSION_TOKEN]`).
- [x] SSH private keys and certificates excluded from repository storage.
