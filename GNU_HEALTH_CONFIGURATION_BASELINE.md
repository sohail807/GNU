# GNU HEALTH HMIS 5.0 — CONFIGURATION BASELINE SPECIFICATION
## Authoritative Technical Baseline for Outpatient Clinic Operations

**Document Identifier**: `GH-BASE-003`  
**Evaluation Date**: 2026-09-22  
**Target Environment**: `gnuhealth-srv` (IP: `34.7.237.8`, GCP: `gnu-health-509307`, Zone: `europe-west4-a`)  
**Status**: `FROZEN VERIFIED BASELINE`  

---

## 1. Operating System & Infrastructure Specification

| Attribute | Baseline Parameter | Verified Value | Configuration Location / Reference |
| :--- | :--- | :--- | :--- |
| **Compute Instance** | GCP Compute Engine | `e2-standard-2` (2 vCPUs, 8 GB RAM) | GCP Console `gnu-health-509307` |
| **Operating System** | Debian GNU/Linux | Debian 12.15 (Bookworm) x86_64 | `/etc/os-release` |
| **Kernel Version** | Linux Cloud Kernel | `6.1.0-53-cloud-amd64` | `uname -r` |
| **Storage Subsystem** | GCP Persistent Disk (SSD) | 49 GB (Root: 10% utilized, 44 GB free)| `df -h /` |
| **Time Synchronization**| Chrony / Systemd-timesyncd | NTP Synced to Google Metadata Time | `timedatectl status` |
| **Timezone** | System Timezone | UTC (Application converts to AST +03:00)| `timedatectl` |

---

## 2. Database Tier Configuration (PostgreSQL 15.19)

| Parameter | Configuration Setting | Architectural Impact |
| :--- | :--- | :--- |
| **Package Version** | PostgreSQL 15.19 (Debian 15.19-0+deb12u1) | Enterprise SQL engine supporting ACID and JSONB |
| **Listen Addresses** | `localhost` / `127.0.0.1` | Strictly prevents direct external network connections |
| **Listening Port** | `5432` | Standard PostgreSQL port, bound to loopback |
| **Database Name** | `gnuhealth` | Primary production database (306 public tables) |
| **Encoding / Collation** | `UTF-8` / `en_US.UTF-8` | Full support for multilingual clinical records and Arabic text |
| **Authentication Rules** | `local all all peer` / `host 127.0.0.1 scram-sha-256` | Zero cleartext authentication; SCRAM-SHA-256 password hashing |
| **Configuration Files**| `/etc/postgresql/15/main/postgresql.conf` | PostgreSQL server configuration |
| **Access Control File**| `/etc/postgresql/15/main/pg_hba.conf` | Host-based authentication rules |

---

## 3. Application Tier Configuration (GNU Health 5.0 / Tryton 7.0)

| Parameter | Configuration Setting | Architectural Impact |
| :--- | :--- | :--- |
| **Tryton Server Version**| Trytond 7.0.57 | Python-based enterprise application kernel |
| **GNU Health Version** | GNU Health 5.0.6 (QSoL) | Native hospital management subsystem |
| **Runtime Environment** | Python 3.11.2 Virtualenv | Isolated virtualenv at `/home/gnuhealth/venv` |
| **Service Account** | `gnuhealth` (UID 1001, GID 1001) | Unprivileged non-root system execution |
| **Service Manager** | Systemd unit `gnuhealth.service` | Auto-restarts on failure; sandboxed execution |
| **Configuration File** | `/home/gnuhealth/trytond.conf` (Mode `0600`) | Tryton application configuration |
| **Listen Socket** | `127.0.0.1:8000` | Loopback socket; inaccessible from external internet |
| **Attachment Storage** | `/home/gnuhealth/attach` | Filesystem storage for digital assets and reports |
| **JSON-RPC Endpoint** | `http://127.0.0.1:8000/gnuhealth/` | Authenticated programmatic API endpoint |

---

## 4. Web Tier & Reverse Proxy Configuration (Nginx 1.22.1)

| Parameter | Configuration Setting | Architectural Impact |
| :--- | :--- | :--- |
| **Web Server** | Nginx 1.22.1 (Debian package) | High-performance reverse proxy and SSL terminator |
| **Port 80 (HTTP)** | Active (Proxy Pass to `127.0.0.1:8000`) | Serves SAO web client; stubs ready for HTTPS redirect |
| **Port 443 (HTTPS)** | Staged (`gnuhealth_ssl.template`) | Ready for activation upon clinic FQDN delegation |
| **Proxy Buffers** | `proxy_buffer_size 128k; proxy_buffers 4 256k;` | Prevents upstream buffer overflow on large health reports |
| **Client Body Limit** | `client_max_body_size 50M;` | Allows secure upload of medical imaging and laboratory files |
| **Security Headers** | `X-Content-Type-Options`, `X-Frame-Options` | Enforces browser clickjacking and MIME sniffing protections |

---

## 5. Network Perimeter & Firewall Security Baseline

```
+-----------------------------------------------------------------------------------+
|                            EXTERNAL FIREWALL RULES                                |
|   Rule Name                Port/Proto     Source Range       Target / Action      |
|   default-allow-ssh        TCP 22         0.0.0.0/0          gnuhealth-srv (ALLOW)|
|   allow-gnuhealth-web      TCP 80, 443    0.0.0.0/0          gnuhealth-srv (ALLOW)|
|   * ALL OTHER INBOUND PORTS (including 8000, 5432) ARE STRICTLY BLOCKED *         |
+-----------------------------------------------------------------------------------+
```

---

## 6. Financial & Accounting Baseline Configuration

| Parameter | Master Record | System ID | Reference / Code | Configuration Status |
| :--- | :--- | :--- | :--- | :--- |
| **Operational Currency** | Qatari Riyal | ID `634` | `QAR` (`ر.ق`), 2 Decimal Digits | Configured & Locked |
| **Active Company** | Primary Clinic Entity | ID `2` | Currency: QAR | Configured & Active |
| **Fiscal Year 2026** | Calendar Year 2026 | ID `7` | `2026-01-01` to `2026-12-31` | State: `open` |
| **Monthly Periods** | 12 Monthly Fiscal Periods| IDs `31`–`42` | `2026-01` through `2026-12` | All States: `open` |
| **Default Receivable**| Main Accounts Receivable | ID `5` | Account Code `110000` | Wired in `account.configuration` |
| **Default Payable** | Main Accounts Payable | ID `4` | Account Code `210000` | Wired in `account.configuration` |
| **Default Revenue** | Main Operating Revenue | ID `6` | Account Code `401000` | Wired in `account.configuration` |
| **Default Expense** | Main Operating Expense | ID `3` | Account Code `501000` | Wired in `account.configuration` |
| **Product Categories**| Medical, Lab, Imaging | IDs `2, 3, 4` | Revenue Account: `401000` | Wired in `product.category` |
| **Strict Invoice Seq**| Customer Invoice Strict 2026| ID `1` | Prefix: `INV-2026/`, Next: `1` | Linked to Fiscal Year 2026 |
| **Move Sequence** | Account Move 2026 | ID `30` | Prefix: `MV-2026/`, Next: `1` | Linked to Fiscal Year 2026 |
| **Cash Payment Method**| Outpatient Cash Settlement| ID `1` | Journal `CASH`, Account `101000` | Verified & Active |

---

## 7. Clean Operational Census Baseline (Post-Purge Verification)

Following rigorous end-to-end transactional testing, all synthetic patient and billing records were transactionally deleted. The live database census is verified at absolute zero operational records:

```sql
SELECT 
  (SELECT count(*) FROM gnuhealth_patient) as patients,
  (SELECT count(*) FROM gnuhealth_appointment) as appointments,
  (SELECT count(*) FROM gnuhealth_patient_evaluation) as evaluations,
  (SELECT count(*) FROM gnuhealth_prescription_order) as prescriptions,
  (SELECT count(*) FROM gnuhealth_patient_lab_test) as lab_tests,
  (SELECT count(*) FROM gnuhealth_imaging_test_request) as imaging_requests,
  (SELECT count(*) FROM gnuhealth_health_service) as health_services,
  (SELECT count(*) FROM account_invoice) as invoices,
  (SELECT count(*) FROM account_move) as moves,
  (SELECT count(*) FROM account_move_line) as move_lines;
```

**Verified Output**:
```
 patients | appointments | evaluations | prescriptions | lab_tests | imaging_requests | health_services | invoices | moves | move_lines 
----------+--------------+-------------+---------------+-----------+------------------+-----------------+----------+-------+------------
        0 |            0 |           0 |             0 |         0 |                0 |               0 |        0 |     0 |          0
(1 row)
```
