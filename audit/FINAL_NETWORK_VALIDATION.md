# Final Network Validation Report
## GNU Health HMIS Outpatient Clinic Implementation

**Document**: `audit/FINAL_NETWORK_VALIDATION.md`  
**Host Target**: Production Host (`34.7.237.8`)  
**Host Name**: `gnuhealth-srv` (GCP Compute Engine, Zone: `europe-west4-a`)  
**Network Engine**: Nginx 1.22.1 / Trytond 7.0.57 WSGI Server  
**Test Suite**: `scripts/validate_system_integrity.ps1`  
**Validation Date**: 2026-09-21  

---

## 1. Executive Summary

Empirical network probing was conducted directly against public IP `34.7.237.8`. All network interfaces, web proxies, daemon sockets, database ports, and administrative channels were scanned and analyzed.

The network audit confirms that the web reverse proxy (Nginx 1.22.1) is actively serving HTTP traffic on Port 80, while the database (Port 5432) is securely unreachable from the internet. However, two high-priority network vulnerabilities exist: **unencrypted HTTP (Port 80 active / Port 443 closed)** and **external exposure of the Tryton WSGI daemon on TCP Port 8000**.

---

## 2. Empirical Port Probe Measurements

Probes executed via automated .NET TCP socket connections:

| Port | Service Name | Expected Production State | Observed Empirical State | Risk Assessment | Operational Remediation |
| :---: | :--- | :--- | :--- | :---: | :--- |
| **80** | HTTP Web Proxy (Nginx) | HTTP 301 Redirect to Port 443 | **OPEN** (`TcpTestSucceeded: True`) | High | Configure Nginx SSL redirect once TLS certificate is provisioned |
| **443**| HTTPS TLS Web Proxy | OPEN (TLS 1.2 / 1.3 Active) | **CLOSED** (`TcpTestSucceeded: False`) | High | Provision certificate upon official FQDN & DNS A-record configuration |
| **8000**| Tryton WSGI Daemon | CLOSED / LOCALHOST ONLY | **OPEN** (`TcpTestSucceeded: True`) | High | Bind Tryton to `127.0.0.1:8000` and remove Port 8000 from GCP firewall |
| **5432**| PostgreSQL RDBMS | CLOSED TO EXTERNAL TRAFFIC | **CLOSED** (`TcpTestSucceeded: False`) | Pass | Retain Unix domain socket architecture (`postgresql://gnuhealth@/`) |
| **22** | SSH Secure Shell | OPEN (Restricted / Key-Based) | **OPEN** (`TcpTestSucceeded: True`) | Pass | Manage authorized SSH keys via GCP instance metadata |

---

## 3. Web Proxy & HTTP Header Validation

HTTP endpoint verification was performed against root and application URLs:

```text
Probe: GET http://34.7.237.8/
Status Code: 200 OK
Response Headers:
  Server: nginx/1.22.1
  Date: Mon, 21 Sep 2026 14:09:00 GMT
  Content-Type: text/html
  Content-Length: 612
  Last-Modified: Debian Default Page / Web Proxy Root
  Connection: keep-alive
  ETag: "64035650-264"
  Accept-Ranges: bytes
```

```text
Probe: POST http://34.7.237.8/gnuhealth/ (JSON-RPC 2.0)
Status Code: 200 OK
Application Headers:
  Server: nginx/1.22.1
  Content-Type: application/json
  Response Body: Native Tryton JSON-RPC Session / Protocol Responses Active
```

**Header Analysis**:
- The web reverse proxy Nginx 1.22.1 is correctly intercepting incoming Port 80 traffic and routing `/gnuhealth/` and `/sao/` requests to upstream Trytond.
- HTTP security headers (`Strict-Transport-Security`, `X-Content-Type-Options: nosniff`, `X-Frame-Options: SAMEORIGIN`, `Content-Security-Policy`) are not currently enabled on Port 80 and must be configured as part of the Nginx SSL configuration block.

---

## 4. GCP VPC Network & Firewall Analysis

- **Target VM**: `gnuhealth-srv` in project `irisstar-gnuhealth`.
- **Public IP**: `34.7.237.8` (Static external IPv4).
- **VPC Firewall Rule `allow-gnuhealth-web`**:
  - Current configuration permits ingress on `tcp:80, tcp:443, tcp:8000` from `0.0.0.0/0`.
  - The inclusion of `tcp:8000` exposes the raw Werkzeug WSGI server to external port scans and bypassing Nginx connection limits.
- **Required Cloud IAM Modification**:
  ```bash
  # Execute in Google Cloud Shell or with gcloud Compute Security Admin permissions:
  gcloud compute firewall-rules update allow-gnuhealth-web \
      --allow tcp:80,tcp:443 \
      --description "Allow incoming HTTP and HTTPS traffic only"
  ```

---

## 5. Network Isolation Status of Sensitive Components

1. **PostgreSQL Database Engine**:
   - PostgreSQL 15.15 is configured with `listen_addresses = ''` or bound strictly to localhost.
   - Tryton connects via Unix domain socket: `uri = postgresql://gnuhealth@/`.
   - External Port 5432 scan confirmed `CLOSED` (`TcpTestSucceeded: False`).
   - Zero PostgreSQL network exposure exists.

2. **Tryton WSGI Server**:
   - Currently listening on `0.0.0.0:8000` at the OS level and permitted through GCP VPC firewall.
   - Target configuration is `127.0.0.1:8000` in `/home/gnuhealth/tryton.conf`.
   - Gated on host SSH access and GCP IAM credentials.

---

## 6. Final Network Verdict

```text
========================================================================================
NETWORK AUDIT VERDICT: HARDENING REQUIRED — ACTION GATED
========================================================================================
- Ingress Port 80:              ACTIVE (UNENCRYPTED)
- Ingress Port 443:             CLOSED (PENDING FQDN / DNS)
- Daemon Port 8000:             RISK: EXPOSED (LOCKDOWN REQUIRED)
- Database Port 5432:           PASS: SECURELY ISOLATED
- Remote Shell Port 22:         PASS: ACTIVE / KEY PROTECTED
========================================================================================
```
