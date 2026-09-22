# 01 — System Architecture & Infrastructure Audit

**Document:** `01_SYSTEM_AUDIT.md`  
**Date:** 2026-09-21  
**Auditor:** GNU Health Configuration Specialist  
**System Location:** Google Cloud Platform (GCP), europe-west4-a  
**Host Instance:** `gnuhealth-srv` (Debian 12 Bookworm, IP: 34.7.237.8)  
**Status:** `VERIFIED`

---

## 1. Executive Summary

A comprehensive, non-destructive audit of the live GNU Health Hospital Management Information System (HMIS) was performed via Tryton JSON-RPC and server inspections. The installation is fully operational, running GNU Health 5.0.7 on Tryton 7.0.57 with PostgreSQL 15. The database `gnuhealth` is in a pristine state with preloaded international ontologies (ICD-10, specialties, diagnostic categories) and zero prior transactional records.

---

## 2. Infrastructure & Operating System

| Parameter | Installed Specification | Verification Method | Status |
| :--- | :--- | :--- | :--- |
| **Operating System** | Debian GNU/Linux 12 (Bookworm) | System environment | `VERIFIED` |
| **Kernel / Arch** | Linux x86_64 | Server runtime | `VERIFIED` |
| **Cloud Host** | GCP Compute Engine (`e2-standard-2`, 2 vCPU, 8 GB RAM) | Cloud metadata | `VERIFIED` |
| **External IP** | `34.7.237.8` | HTTP/SAO interface | `VERIFIED` |
| **Firewall Ingress** | Ports 80 (HTTP), 443 (HTTPS), 8000 (Trytond) | GCP VPC Firewall | `VERIFIED` |
| **Reverse Proxy** | Nginx 1.22.1 (Proxy to 127.0.0.1:8000) | HTTP Headers | `VERIFIED` |
| **Database Engine** | PostgreSQL 15.15 (Unix socket connection) | Tryton configuration | `VERIFIED` |
| **Python Environment** | Python 3.11.2 (`/home/gnuhealth/venv`) | Virtualenv runtime | `VERIFIED` |

---

## 3. Application Stack & Middleware

- **Application Server**: Trytond 7.0.57
- **HMIS Engine**: GNU Health 5.0.7 (`health` core: 5.0.6)
- **Web UI Client**: Tryton SAO 7.0 (Served on `/`)
- **Systemd Unit**: `gnuhealth.service` (Active, enabled)
- **Trytond Configuration**: `/home/gnuhealth/trytond.conf`
  - `uri = postgresql://gnuhealth@/`
  - `path = /home/gnuhealth/attach`
  - `listen = 0.0.0.0:8000`

---

## 4. Operational Readiness Assessment

The infrastructure conforms to official GNU Health recommendations. No secondary database or external frontend is required; the native Tryton SAO interface provides complete desktop and browser-based clinical access.
