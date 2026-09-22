# 01. Project Overview

**Project Title**: Healthcare Management System — GNU Health Implementation  
**Underlying Platform**: GNU Health HMIS 5.0.7 / Tryton 7.0.57  
**Host Environment**: Google Cloud Platform Compute Engine (`34.7.237.8`)  
**Target Sector**: Outpatient Healthcare / Ambulatory Care Clinic (State of Qatar)  
**Document**: `docs/01-Project-Overview.md`  

---

## 1. Project Purpose & Scope

This project establishes an enterprise-grade Hospital Management Information System (HMIS) utilizing the **GNU Health 5.0** platform and **Tryton 7.0** framework, configured specifically for outpatient clinic operations in the **State of Qatar**.

The objective is to provide an auditable, secure, and production-ready healthcare management solution that supports:
- Outpatient appointment scheduling, patient intake, and demographic registration.
- Nursing triage, vital signs monitoring, and encounter prioritization.
- Physician clinical consultations, WHO ICD-10 diagnostic coding, and progress notes.
- Diagnostic requisitioning for clinical laboratories and diagnostic radiology.
- Outpatient e-prescribing and medication dispensing.
- Financial management in Qatari Riyal (`QAR`), patient copay collection, and insurance claims.
- Role-based access control, medical record immutability, and patient privacy compliance.

---

## 2. Platform Philosophy & Non-Rebuilding Commitment

In strict accordance with enterprise architectural standards:
- **No Custom Frontend Layer**: The system leverages the native Tryton SAO 7.0 web client, eliminating fragile external React/Next.js layers and duplicate backend APIs.
- **No Core Forks**: All capabilities are delivered through native GNU Health and Tryton modules, ensuring upstream compatibility and continuous security update paths.
- **No Secondary Databases**: All operational, clinical, and financial data resides in a single, ACID-compliant PostgreSQL 15 database.

---

## 3. Qatar Localization Baseline

- **Country**: State of Qatar (`QA`, `QAT`, Numeric `634`).
- **Currency**: Qatari Riyal (`QAR`, Symbol `ر.ق`, 2 Decimals, Base Rate `1.0000`).
- **National Demographics**: Preloaded country master including Qatar and 14 common GCC/expatriate nationalities.
- **Languages**: English (`en`, LTR) and Arabic (`ar`, RTL).
- **Timezone**: `Asia/Qatar` (UTC+3 / Arabian Standard Time).
- **Federation Prefix**: `QAT` configured for unique person and patient identification numbers (PUID/MRN).

---

## 4. Current Implementation Status

> **`CONFIGURATION BASELINE COMPLETE — PRODUCTION ACTIVATION PENDING CLINIC INPUT AND APPROVALS`**

- **Infrastructure**: Fully provisioned and operational on GCP.
- **Modules**: 24 core clinical and business modules activated.
- **Master Data**: Ontologies loaded (ICD-10, Specialties, Modalities, Lab Categories, Drug administration forms).
- **Operational Data**: Clean baseline (0 synthetic patients, 0 test encounters, 0 invoices).
- **Pending Items**: Official clinic identity, licensed physician roster, commercial pharmacy formulary, agreed consultation tariffs, contracted insurance payers, and open accounting fiscal year.
