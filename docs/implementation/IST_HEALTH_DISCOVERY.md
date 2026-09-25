# IST HEALTH — TECHNICAL DISCOVERY & ARCHITECTURE PROPOSAL
## Comprehensive Baseline, Asset Inventory, Backend RPC Inspection & Implementation Strategy

**Document Reference:** `IST-DISCOVERY-001`  
**System Target:** IST Health Outpatient Clinic (Doha, Qatar)  
**Authoritative Backend:** GNU Health HMIS 5.0.6 / Tryton 7.0.57 on PostgreSQL 15.19 (`http://34.7.237.8/gnuhealth/`)  
**Design Reference & Approved Foundation:** Mockup A (Editorial Minimalism / TFSF Ventures Heritage)  
**Date:** September 2026  
**Status:** Discovery Complete · Awaiting Architecture Approval (Phase 0 Gate)

---

## 1. Executive Summary & Context

The **IST Health** project represents the complete transformation of our certified GNU Health HMIS backend into an editorial, high-performance, modern digital healthcare experience for a premier outpatient clinic in Doha, Qatar.

Following extensive visual research and the side-by-side presentation of three design concepts, **Mockup A (Editorial Minimalism)** has been officially approved as the sole design source of truth. The approved visual direction is rooted in the refined editorial discipline of TFSF Ventures—characterized by crisp geometric composition, generous whitespace, Bodoni Moda display serifs, Geist typography, and hairline borders—rebranded and elevated with Qatari elegance and restrained maroon accents (`#8A1538`).

This document constitutes the formal deliverable for **Phase 0 (Complete Project Discovery)**. It audits the existing workspace, catalogs Mockup A assets, maps the native Tryton JSON-RPC 2.0 API, documents role-to-workflow boundaries, analyzes technical risks, and outlines the recommended implementation architecture.

---

## 2. Current Project Structure & Existing Code Assets

An exhaustive audit of the workspace reveals an enterprise-grade backend testing and certification ecosystem:

```
GNU Health/
├── .agents/                               # Custom agent rules, workflows, and specialized skills
├── audit/                                 # Forensic audit logs, database verification exports
├── backup/                                # Database snapshot archives and restore verification drills
├── configuration/                         # Tryton configuration baseline and Nginx reverse proxy configs
├── deployment/                            # GCP deployment automation scripts (deploy_gcp_gnuhealth.sh)
├── design/
│   └── frontend_wireframes/               # Approved design assets and mockups
│       ├── concept_a/                     # ★ APPROVED MOCKUP A (Source of Truth)
│       │   ├── 01_login.png               # High-fidelity Login Portal (1600x1000)
│       │   ├── 02_frontdesk_dashboard.png # High-fidelity Reception Dashboard (1600x1000)
│       │   ├── 03_patient_registration.png# High-fidelity Patient Registration (1600x1000)
│       │   └── 04_physician_consultation.png# High-fidelity Physician SOAP Cockpit (1600x1000)
│       ├── concept_b/                     # Concept B mockups (Qatari Contemporary)
│       ├── concept_c/                     # Concept C mockups (Clinical Executive)
│       ├── reference/                     # TFSF Ventures live extracted screenshots & styles
│       ├── FRONTEND_DESIGN_REFERENCE_ANALYSIS.md
│       ├── FRONTEND_DESIGN_SYSTEM_PROPOSAL.md
│       ├── FRONTEND_INFORMATION_ARCHITECTURE.md
│       ├── FRONTEND_WIREFRAME_CONCEPTS.docx
│       └── FRONTEND_WIREFRAME_CONCEPTS.pdf # 1.17 MB inline visual manual
├── docs/                                  # Architectural specifications and functional guides
│   ├── api/                               # JSON-RPC integration contracts
│   ├── handover/                          # Comprehensive developer handover documentation (01-08)
│   ├── uat/                               # UAT test scenarios and execution tracking
│   └── implementation/                    # ★ Implementation phase deliverables (IST Health)
├── his/                                   # Native GNU Health and Tryton module source tree
│   └── tryton/                            # Python models (gnuhealth, party, account, company)
├── reports/                               # Verified test reports, live Chrome execution logs
├── scripts/                               # 199+ Python and PowerShell testing/automation tools
│   ├── lib_e2e.py                         # Chrome Selenium automation driver for live clinic
│   ├── test_all_logins.py                 # Multi-role authentication validator
│   ├── test_jsonrpc_external.py           # Native Tryton JSON-RPC 2.0 API test client
│   └── render_concept_mockups.py          # HTML/CSS engine used to render Mockup A/B/C
└── tests/                                 # End-to-end unit, functional, and regression suites
```

### Existing Reusable Assets:
1. **API Client & Handshake Logic:** `scripts/test_jsonrpc_external.py` and `scripts/debug_session_token.py` establish the exact cryptographic session token generation and model query patterns required for Tryton 7.0.
2. **E2E Browser Test Suite:** `scripts/lib_e2e.py` provides working Selenium Chrome automation patterns that can directly power Phase 12 browser QA.
3. **Role Credentials & Profiles:** `scripts/test_all_logins.py` contains verified test credentials for all 8 staff personas.
4. **Mockup A Component Code:** `scripts/render_concept_mockups.py` houses the complete HTML DOM templates, CSS variables, and layout structures for Mockup A, ready for modular componentization.

---

## 3. Approved Mockup A Asset Inventory & Design Token Specification

The approved **Mockup A** has been extracted from `design/frontend_wireframes/concept_a/` and the underlying DOM template generator:

### 3.1 Screen Inventory

| Screen | High-Res Source File | Key Functional & Visual Elements |
| :--- | :--- | :--- |
| **A.1 Authentication** | `concept_a/01_login.png` | Split-screen layout; Bodoni Moda editorial title; live API endpoint telemetry badge (`http://34.7.237.8/gnuhealth/`); 8-role selector tabs; clean hairline input fields; zero drop-shadows. |
| **A.2 Reception Dashboard** | `concept_a/02_frontdesk_dashboard.png` | Monospace status kickers (`FRONT DESK CONSOLE`); daily operational KPI cards (Total Patients: 24, Waiting: 6, Triage: 3, In Consultation: 4); Quick Check-In Queue table with instant `Check-In` action buttons; primary `Register Patient` CTA. |
| **A.3 Patient Registration** | `concept_a/03_patient_registration.png` | Structured demographic intake; auto-sequenced PUID badge (`P00088`); validated 11-digit Qatar ID (QID) input; party relational fields; emergency contacts; atomic `Register Patient` submission. |
| **A.4 Physician Consultation** | `concept_a/04_physician_consultation.png` | Clinical SOAP cockpit; patient vitals banner with live triage chips (BP 122/78, HR 74, Temp 38.1°C alert, SpO2 99%); structured Subjective history and Objective exam textareas; ICD-10 pathology diagnosis search; active e-Prescription line items (`RX-2026-0029`). |

### 3.2 Verified Design Tokens (Rebranded as IST Health)

```css
:root {
  /* Brand & Canvas */
  --ist-bg-canvas: #F4F6F1;             /* Limestone Ivory (Warm White) */
  --ist-bg-surface: #FFFFFF;            /* Pure White for Clinical Cards */
  --ist-bg-subtle: #ECEFE8;             /* Muted Warm Gray for Table Headers */
  --ist-bg-sidebar: #0D1411;            /* Obsidian Charcoal Dark */
  
  /* Typography Colors */
  --ist-text-primary: #071512;          /* Crisp Obsidian Text */
  --ist-text-secondary: #405B50;        /* Slate Jade Neutral */
  --ist-text-tertiary: #6E877C;         /* Muted Metadata / Kickers */
  
  /* Brand Accents */
  --ist-accent-maroon: #8A1538;         /* Qatari Maroon Brand Accent */
  --ist-accent-maroon-hover: #72112E;   /* Deep Maroon */
  --ist-accent-maroon-light: #FBEBED;   /* Maroon Alert Tint */
  --ist-accent-jade: #135D4F;           /* TFSF Editorial Deep Forest Jade */
  --ist-accent-jade-light: #E7F0ED;     /* Subtle Jade Tint */
  --ist-accent-gold: #C5A880;           /* Restrained Desert Gold */
  
  /* Status Colors */
  --ist-status-success: #15803D;        /* Clinical Green */
  --ist-status-success-bg: #DCFCE7;
  --ist-status-warning: #B45309;        /* Triage Alert Amber */
  --ist-status-warning-bg: #FEF3C7;
  --ist-status-danger: #B91C1C;         /* Critical Vital Alert Red */
  --ist-status-danger-bg: #FEE2E2;
  --ist-status-info: #0369A1;           /* Diagnostic Blue */
  --ist-status-info-bg: #E0F2FE;

  /* Borders & Geometry */
  --ist-border: 1px solid rgba(7, 21, 18, 0.14);
  --ist-border-strong: 1px solid rgba(7, 21, 18, 0.28);
  --ist-radius: 0px;                    /* Strict Mockup A Editorial Precision */
  --ist-radius-interactive: 2px;        /* Micro-radius for touch targets */
  
  /* Typography Scale */
  --ist-font-display: 'Bodoni Moda', serif;
  --ist-font-ui: 'Geist', -apple-system, BlinkMacSystemFont, sans-serif;
  --ist-font-mono: 'Geist Mono', monospace;
  --ist-font-arabic: 'Noto Sans Arabic', sans-serif;
  
  /* Spacing Scale (8pt Grid) */
  --ist-space-1: 4px;
  --ist-space-2: 8px;
  --ist-space-3: 12px;
  --ist-space-4: 16px;
  --ist-space-5: 24px;
  --ist-space-6: 32px;
  --ist-space-8: 48px;
  --ist-space-10: 64px;
}
```

---

## 4. Live Backend API Inspection & Protocol Verification

Live testing against `http://34.7.237.8/gnuhealth/` verified the following API behaviors:

### 4.1 Authentication Handshake (`common.db.login`)
- **Transport:** HTTP POST with `Authorization: Basic base64(username:password)`
- **Payload:** `{"method": "common.db.login", "params": ["<username>", {"password": "<password>"}]}`
- **Response:** `[<user_id_integer>, "<64_hex_session_token>"]`
- **Session Lifespan:** Active across user session; invalidation via `common.db.logout`.

### 4.2 Authorized Model Query Protocol
Every subsequent business call requires:
- **HTTP Header:** `Authorization: Session <base64_encoded_credentials>`
  - Format: `base64("<username>:<user_id>:<session_token>")`
- **Model Method Namespace:** `model.<model_name>.<method_name>`
- **Standard Signature:** `params: [domain, offset, limit, order, fields, context]`
- **Mandatory Context:** Must include `{"company": 2}` (or current company ID) to prevent Tryton `Missing context argument` exceptions.
- **Live Verification Evidence:** Query to `model.gnuhealth.patient.search_read` returned live patient records (`DEMO PATIENT 001`, `AHMED AL-MANSOORI`, `LIVE E2E TEST PATIENT`) with 0ms error rate.

---

## 5. Role-to-Workflow & Model Mapping Matrix

| Role | Test Username | Primary Workflows | Native Tryton Models | Supported Transitions |
| :--- | :--- | :--- | :--- | :--- |
| **Front Desk** | `demo_frontdesk1` | Registration, Appointments, Arrival Check-In | `party.party`<br>`gnuhealth.patient`<br>`gnuhealth.appointment` | `appointment.checkin`<br>`appointment.confirm` |
| **Triage Nurse** | `demo_nurse1` | Triage Queue, Vitals Recording, Anthropometry | `gnuhealth.patient.evaluation` | `evaluation.draft`<br>`evaluation.in_progress` |
| **Physician** | `demo_dr1` / `demo_dr2` | Clinical Consultation, SOAP, Diagnosis, Rx | `gnuhealth.patient.evaluation`<br>`gnuhealth.prescription.order`<br>`gnuhealth.pathology` | `prescription.prescribe`<br>`evaluation.done` |
| **Lab Tech** | `demo_lab1` | Diagnostic Queue, CBC Analyte Result Entry | `gnuhealth.lab`<br>`gnuhealth.lab.test_critearea` | `lab.draft` -> `test` -> `done` |
| **Radiology Tech**| `demo_rad1` | Imaging Queue, Radiology Findings Entry | `gnuhealth.imaging.test` | `imaging.draft` -> `done` |
| **Cashier** | `demo_cashier1`| Patient Invoicing, Service Tariffs, Payments | `account.invoice`<br>`account.invoice.line`<br>`account.move` | `invoice.validate_invoice`<br>`invoice.pay_invoice` |
| **Administrator** | `admin` | User RBAC, Configuration, Operational Audit | `res.user`<br>`res.group`<br>`ir.ui.menu` | Master administration |

---

## 6. Known Backend Limitations & Guardrails

1. **Party & Patient Uniqueness (`gnuhealth_patient_name_uniq`):**
   - Attempting to register an existing party as a new patient raises a database unique constraint violation.
   - *Frontend Guardrail:* Implement real-time civil ID / QID search before opening the registration modal. If the party exists, route to "Add Patient Profile to Existing Party" rather than `party.create`.
2. **Immutable General Ledger Moves:**
   - Posted accounting moves cannot be deleted or updated via API.
   - *Frontend Guardrail:* Strict confirmation dialogs with clear financial warnings prior to calling `invoice.validate_invoice` or `invoice.pay_invoice`.
3. **Absence of Server-Side CORS Headers on Port 8000:**
   - Direct browser `fetch()` from an external domain or port to `http://34.7.237.8/gnuhealth/` will fail due to CORS and browser mixed-content (HTTP vs HTTPS) restrictions.
   - *Frontend Guardrail:* Mandatory server-side Backend-for-Frontend (BFF) proxy within Next.js API routes.

---

## 7. Technical Risks & Mitigation Strategies

| Risk | Severity | Mitigation Strategy |
| :--- | :--- | :--- |
| **Mixed Content & CORS** | Critical | Next.js Server-Side Route Handlers (`/api/hmis/*`) make server-to-server HTTP calls to `http://34.7.237.8/gnuhealth/`, completely isolating the browser from CORS and mixed-content issues. |
| **Credential & Token Leakage** | Critical | Store Tryton session tokens strictly in `httpOnly`, `secure`, `sameSite=strict` cookies managed by the Next.js API route layer. Client-side JavaScript never sees raw session tokens. |
| **3D Performance on Mobile** | Moderate | Implement dynamic code splitting and lazy loading for `@react-three/fiber` / `three.js`. Provide an instantaneous, high-resolution static WebGL canvas fallback for mobile and low-tier devices. |
| **State Desynchronization** | Moderate | Enforce optimistic UI updates with immediate automatic rollback upon receiving any Tryton RPC error. All critical operations re-fetch authoritative backend state upon completion. |

---

## 8. Recommended Implementation Architecture

We propose a unified, modern, type-safe full-stack architecture using **Next.js 15 (App Router)** with **TypeScript**:

```
+-----------------------------------------------------------------------------------+
|                           IST HEALTH FULL-STACK APPLICATION                       |
+-----------------------------------------------------------------------------------+
|                                                                                   |
|  [ PUBLIC MARKETING EXPERIENCE ]               [ SECURE HMIS CLINICAL PORTAL ]    |
|  Route Group: /(marketing)                     Route Group: /(app)                |
|  - Home (Cinematic 3D Hero + Fallback)         - /app/frontdesk (Reception)       |
|  - /about (Institutional Profile)              - /app/nursing (Triage)            |
|  - /services (Specialty Clinics)               - /app/physician (Consultation)    |
|  - /technology (Precision Diagnostics)         - /app/laboratory (CBC Analytes)   |
|  - /contact (Inquiry Form + Validation)        - /app/radiology (Imaging)         |
|  - /privacy & /terms                           - /app/billing (Cashier & Invoices)|
|  Features: Three.js, Glassmorphic Panels,      - /app/patient/[id] (Unified Chart)|
|  Bodoni Moda / Geist Typography, Framer Motion - /app/admin (Verified RBAC Audit) |
|                                                Features: Zero-Animation Velocity, |
|                                                Tabular Density, Keyboard Focus    |
+-----------------------------------------------------------------------------------+
|                                                                                   |
|                      [ SHARED DESIGN SYSTEM & UI PRIMITIVES ]                     |
|                      Tokens · CSS Variables · Tailwind CSS 3.4                    |
|                      Radix UI Primitives · Lucide Icons · WCAG 2.2 AA             |
+-----------------------------------------------------------------------------------+
|                                                                                   |
|                     [ BACKEND-FOR-FRONTEND (BFF) API LAYER ]                      |
|                     Route Handlers: /api/auth/* · /api/hmis/*                     |
|                     - httpOnly Secure Session Cookie Management                   |
|                     - Cryptographic Tryton Authorization Construction             |
|                     - Input Schema Validation via Zod                             |
|                     - Error Sanitization & Audit Telemetry                        |
+-----------------------------------------------------------------------------------+
                                         |
                                         | Native Authenticated JSON-RPC 2.0
                                         v
+-----------------------------------------------------------------------------------+
|                  AUTHORITATIVE GNU HEALTH HMIS / TRYTON BACKEND                   |
|                  http://34.7.237.8/gnuhealth/ (Nginx -> Tryton 7.0)               |
+-----------------------------------------------------------------------------------+
```

### Major Dependencies Proposed:
- `next`: 15.x (App Router, Server Actions, API Route Handlers)
- `react` & `react-dom`: 19.x / 18.x
- `typescript`: 5.x
- `tailwindcss`: 3.4.x (configured with Mockup A custom design tokens)
- `lucide-react`: Lightweight, accessible icon system
- `three` & `@react-three/fiber`: 3D visual experience for marketing hero
- `framer-motion`: Smooth scroll and entrance motion for public website
- `zod`: Type-safe schema validation for form submissions and API contracts

---

## 9. Implementation Milestones

1. **Milestone 1 — Architecture & Design System Setup:** Initialize Next.js project, install core dependencies, configure centralized tokens in `tailwind.config.ts` and `globals.css`, and create the shared component library based on Mockup A.
2. **Milestone 2 — Public Marketing Website:** Build cinematic 3D hero with WebGL fallback, glassmorphic cards, service directories, and validated contact forms.
3. **Milestone 3 — Authentication & HMIS Application Shell:** Implement login portal with role selector, session lifecycle handlers, and sidebar navigation shell.
4. **Milestone 5 — Outpatient Clinical Workflows:** Implement Front Desk, Nursing Triage, Physician Consultation, Laboratory, and Radiology screens bound to live Tryton RPC endpoints.
5. **Milestone 5 — Financial & Unified Chart Workflows:** Implement Cashier Invoicing, Payment Processing, Account Move audit views, and Unified Patient Chart.
6. **Milestone 6 — Comprehensive E2E Verification & UAT:** Execute automated browser tests covering the original 9 UAT scenarios with screenshot evidence.
7. **Milestone 7 — Release Packaging & Final Documentation:** Complete deployment build, run security audits, and package handover artifacts.

---

## 10. Phase 0 Decision Gate

Before initiating code generation, please confirm:
1. Approval of the **Next.js + TypeScript Full-Stack BFF Architecture** described in Section 8.
2. Approval of the **IST Health Design Token Scale** derived from Mockup A (Section 3).
3. Authorization to proceed to **Milestone 1 & Milestone 2 (Design System & Marketing Website Implementation)**.
