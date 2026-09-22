# 13. Deployment & Cloud Infrastructure

**Project**: Healthcare Management System — GNU Health Implementation  
**Assessment Date**: 2026-09-21  
**Target Host**: Google Cloud Platform Compute Engine (`34.7.237.8`)  
**Document**: `docs/13-Deployment.md`  

---

## 1. Executive Summary

This document specifies the automated cloud provisioning runbooks, systemd service daemon configurations, Nginx reverse proxy settings, and operating environment parameters on Google Cloud Platform.

---

## 2. Cloud Infrastructure Architecture

- **Cloud Provider**: Google Cloud Platform (GCP).
- **Project ID**: `gnu-health-509307`
- **Compute Instance**: `gnuhealth-srv` in Zone `europe-west4-a` (Eemshaven - Tier 1 low latency).
- **Instance Sizing**: `e2-standard-2` (2 vCPUs, 8 GB RAM, 50 GB balanced persistent SSD).
- **Static Public IP**: `34.7.237.8`.
- **Operating System**: Debian GNU/Linux 12 (Bookworm).

---

## 3. Deployment Runbooks Inventory

All deployment automation scripts reside in [deployment/](file:///c:/Users/MohammedSohail/OneDrive%20-%20IRISSTAR%20TECHNOLOGIES/GNU%20Health/deployment/):

| Script Name | Purpose | Execution Location | Primary Actions |
| :--- | :--- | :--- | :--- |
| **`deploy_gcp_gnuhealth.sh`** | Full Cloud Deployment Runbook | Local workstation (Bash / gcloud) | Sets GCP project, configures VPC firewall rules, packages startup script, provisions Compute Engine VM. |
| **`startup_gnuhealth.sh`** | VM Provisioning Script | GCP VM (Executed at boot) | Installs Debian packages (PostgreSQL 15, Python 3.11, Nginx), creates system user `gnuhealth`, initializes DB. |
| **`finish_setup.sh`** | Setup Finalizer Runbook | GCP VM (Post-boot) | Installs GNU Health & Tryton modules, extracts SAO web client, creates `trytond.conf`, starts daemon. |

---

## 4. System Services Configuration

### A. Systemd Daemon Unit (`gnuhealth.service`)
Location: `/etc/systemd/system/gnuhealth.service`

```ini
[Unit]
Description=GNU Health / Tryton Application Server
After=syslog.target network.target postgresql.service

[Service]
Type=simple
User=gnuhealth
Group=gnuhealth
ExecStart=/home/gnuhealth/venv/bin/trytond -c /home/gnuhealth/trytond.conf -d gnuhealth
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
```

### B. Nginx Reverse Proxy Configuration
Location: `/etc/nginx/sites-available/gnuhealth`

```nginx
server {
    listen 80 default_server;
    listen [::]:80 default_server;
    server_name _;
    client_max_body_size 50M;

    location / {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 300s;
        proxy_connect_timeout 300s;
    }
}
```

---

## 5. Firewall & Port Requirements

| Port | Protocol | Current Firewall Rule | Target Production Setting |
| :--- | :--- | :--- | :--- |
| **80** | HTTP | Open to `0.0.0.0/0` | Enforce 301 Redirect to HTTPS Port 443 |
| **443** | HTTPS | Open to `0.0.0.0/0` | Primary secure web entry point (TLS Certificate) |
| **8000** | Tryton RPC | Open to `0.0.0.0/0` | **Restrict to localhost** (Disable public ingress) |
| **22** | SSH | GCP default / IAP | Restrict to authorized IT administrator IP ranges |
| **5432** | PostgreSQL | Closed (Unix Socket only) | Keep closed to public network |
