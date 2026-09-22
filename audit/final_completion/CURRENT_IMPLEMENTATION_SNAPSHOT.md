# CURRENT IMPLEMENTATION SNAPSHOT
## GNU HEALTH HMIS PRODUCTION ENVIRONMENT (`gnuhealth-srv`)

**Execution Timestamp**: 2026-09-22 10:24:24 UTC  
**Environment**: Google Cloud Platform (VM: `gnuhealth-srv`, Zone: `europe-west4-a`, Project: `gnu-health-509307`)  
**External IP**: `34.7.237.8` | **Internal IP**: `10.164.0.2`  

---

## 1. System Architecture & Component Versions
- **Hostname**: `gnuhealth-srv`
- **Operating System**: Debian GNU/Linux 12 (bookworm)
- **Kernel**: `6.1.0-53-cloud-amd64`
- **GNU Health Core Package**: `5.0.6`
- **Tryton Server Package**: `7.0.57 LTS`
- **PostgreSQL Database**: `15.19 (Debian 15.19-0+deb12u1)`
- **Nginx Reverse Proxy**: `1.22.1`

---

## 2. Systemd Services & Network Sockets
- `gnuhealth.service`: **`active`**
- `nginx.service`: **`active`**
- `postgresql.service`: **`active`**
- `gnuhealth-backup.timer`: **`active`** (`enabled`)
- **Listening Sockets (`ss -lntp`)**:
  - `127.0.0.1:8000`: Bound to `trytond` (PID 52400) — *Loopback Only*
  - `0.0.0.0:8000`: **ABSENT / UNEXPOSED**
  - `127.0.0.1:5432` / `[::1]:5432`: Bound to PostgreSQL — *Loopback Only*
  - `0.0.0.0:80` / `[::]:80`: Bound to Nginx Reverse Proxy
  - `0.0.0.0:22` / `[::]:22`: Bound to OpenSSH

---

## 3. Database Statistics & Clinical Baseline
- **Database Size**: `123 MB`
- **Public Schema Table Count**: `306`
- **Registered Patients**: `0`
- **Appointments**: `0`
- **Clinical Evaluations**: `0`
- **Prescription Orders**: `0`
- **Laboratory Requests**: `0`
- **Imaging Requests**: `0`
- **Inpatient Registrations**: `0`
- **Invoices**: `0`
- **General Ledger Moves**: `0`
- **Open Fiscal Years**: `0`
- **Registered Doctors**: `0`
- **Configured Outpatient Products**: `15` (`OPD-EVAL`, `RAD-*`, `LAB-*`)
- **Health Institutions**: `1` (Default)

---

## 4. User Roster & Security Groups
- **Active System Users**: `1` (`admin`, ID 1, credential rotated on 2026-09-22 10:04:14 UTC)
- **Disabled Demo Users**: `8` (`root` ID 0, `demo_nurses` ID 2, `demo_frontdesk` ID 3, `demo_doctor` ID 4, `demo_social_worker` ID 5, `demo_back_office` ID 6, `demo_imaging` ID 7, `demo_lab` ID 8)
- **Security Groups Available in Model `res.group`**: `28`

---

## 5. Security Sandboxing & Host Hardening
- **Systemd Service Sandboxing (`/etc/systemd/system/gnuhealth.service`)**:
  - `NoNewPrivileges=true`
  - `PrivateTmp=true`
  - `ProtectSystem=full`
  - `RestartSec=5`
  - `ReadWritePaths=/home/gnuhealth /var/log`
- **Nginx Security Headers**:
  - `X-Content-Type-Options: "nosniff"`
  - `X-Frame-Options: "SAMEORIGIN"`
  - `X-XSS-Protection: "1; mode=block"`
  - `Referrer-Policy: "strict-origin-when-cross-origin"`
  - `Permissions-Policy: "geolocation=(), microphone=(), camera=()"`
  - `server_tokens off;` (Version masked)
- **GCP VPC Firewall**:
  - Rule `allow-gnuhealth-web` permits strictly `tcp:80,tcp:443`. Port 8000 is absent.

---

## 6. Mandatory Pre-Change Backup (Section 4 Compliance)
- **Database Dump**: `/var/backups/gnuhealth/gnuhealth_db_pre_master_exec_20260922_102424.dump`
  - Size: `7.3 MB`
  - Mode: `0600` (Owner: `postgres`)
  - Catalog TOC Table Data count: `306`
  - SHA-256 Checksum: `57ad8c119826d50e10a8ac969a3036e627fa2a69c8c115a3c84296a73dee09f2`
- **Attachments Archive**: `/var/backups/gnuhealth/gnuhealth_attach_pre_master_exec_20260922_102424.tar.gz`
  - Size: `4.0 KB`
  - Mode: `0600` (Owner: `root`)
  - SHA-256 Checksum: `bf9b0e78e0c7bb7e9a037b01eedd502b7b36626eacb2a5e543ced867cfe5679a`
