# 11. Configuration & Master Data Setup

**Project**: Healthcare Management System — GNU Health Implementation  
**Assessment Date**: 2026-09-21  
**Status**: `VERIFIED CONFIGURATION BASELINE`  
**Document**: `docs/11-Configuration.md`  

---

## 1. Executive Summary

This document specifies the technical system configuration, server parameters, Qatar localization settings, and organizational structures active in the live environment.

---

## 2. Server Configuration (`trytond.conf`)

The Tryton application daemon is configured via `/home/gnuhealth/trytond.conf` on the host VM:

```ini
[database]
uri = postgresql://gnuhealth@/
path = /home/gnuhealth/attach

[web]
listen = 0.0.0.0:8000
root = /home/gnuhealth/sao

[web.cors]
origins = *
```

### Key Parameters:
- **Database Connection**: Connects to PostgreSQL over local Unix domain socket as user `gnuhealth`.
- **Document Attachments**: Stored locally in `/home/gnuhealth/attach`.
- **Web UI Client**: Tryton SAO static root mounted from `/home/gnuhealth/sao`.
- **Port**: Listens internally on `0.0.0.0:8000`, proxied externally by Nginx on Port 80.

---

## 3. Qatar Localization Configuration

### A. QAR Currency & Base Rate
- **Entity**: `currency.currency` ID 3 (`code: "QAR"`, `symbol: "ر.ق"`, `digits: 2`, `rounding: 0.01`).
- **Rate**: `currency.currency.rate` ID 2 (`rate: 1.0000`, date: `2026-09-21`).
- **Company Link**: Linked to `company.company` ID 2.

### B. Timezone & Locale
- **System Timezone**: `Asia/Qatar` (UTC+3 / Arabian Standard Time).
- **Languages**: Primary: English (`en`, LTR); Secondary: Arabic (`ar`, RTL).

### C. Federation Prefix
- **Entity**: `gnuhealth.federation.country.config` ID 1 mapped to Country 1 (Qatar). Automatically assigns `QAT` prefix on person registration.

---

## 4. Organizational & Institutional Hierarchy

```text
Party: <CLINIC_NAME> (party.party ID: 2)
  ├── Address: <STREET>, Zone <ZONE>, Building <BUILDING>, <CITY>, Qatar (party.address ID: 1)
  ├── Company: <CLINIC_NAME> (company.company ID: 2, Currency: QAR, Timezone: Asia/Qatar)
  └── Health Institution: CLINIC-QA (gnuhealth.institution ID: 2, Type: clinic, Level: private)
        ├── Hospital Unit 1: OPD (Outpatient Department - Consultations)
        ├── Hospital Unit 2: NURS (Nursing & Triage Station)
        ├── Hospital Unit 3: PHARM (Clinic Pharmacy & Dispensing)
        ├── Hospital Unit 4: LAB (Clinical Laboratory)
        ├── Hospital Unit 5: RAD (Diagnostic Radiology)
        ├── Hospital Unit 6: BILL (Billing & Accounts)
        ├── Hospital Unit 7: INS (Insurance Management)
        └── Hospital Unit 8: ADMIN (Clinic Administration)
```

---

## 5. Configuration Maintenance Protocol

- System settings are maintained natively through Tryton JSON-RPC or Tryton SAO administrative forms.
- The single human-readable declarative configuration specification is maintained at:  
  [configuration/clinic-config.yaml](file:///c:/Users/MohammedSohail/OneDrive%20-%20IRISSTAR%20TECHNOLOGIES/GNU%20Health/configuration/clinic-config.yaml).
