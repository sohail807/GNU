# 02-ARCHITECTURE: IST HEALTH HMIS ARCHITECTURAL SPECIFICATION

**System Identifier:** IST-ARCH-002  
**Target Architecture:** Multi-Tenant Healthcare Medical OS  
**Authoritative Backend:** GNU Health HMIS 5.0.6 / Tryton Framework 7.0.57 (PostgreSQL 15.19)  
**Frontend Architecture:** Next.js 16.3.6 App Router (React 19.2.8 / TypeScript 5)  
**Security Standard:** Zero-Trust Role-Based Access Control & Strict Tenant Isolation  

---

## 1. Architectural Philosophy & Core Directives

1. **Native Tryton System of Record:** GNU Health HMIS on Tryton 7.0 is the sole authoritative backend and transaction engine. No shadow backends, mock databases, parallel transaction ledgers, or duplicate accounting tables may be created.
2. **Upstream Compatibility (Zero Reinvention):** The system maintains absolute binary and schema compatibility with upstream GNU Health 5.0 and Tryton 7.0. Core modules are never forked or monkey-patched.
3. **Strict Separation of Concerns:**
   - **Frontend (Presentation Tier):** Renders role-specific dashboards, collects clinical data, enforces immediate client-side validation, and adheres strictly to the finalized **Mockup A** design system.
   - **BFF / Gateway Tier (Next.js Server):** Mediates between browser clients and Trytond; resolves tenant context; validates session tokens; sanitizes input payloads; handles protocol transformation; prevents credential leakage.
   - **Application Tier (Trytond WSGI):** Enforces healthcare business logic, model access permissions (`ir.model.access`), record rules (`ir.rule`), state machines, and ACID transactions.
   - **Database Tier (PostgreSQL):** Guarantees referential integrity, foreign key constraints, unique indexes, and ACID durability.

---

## 2. Multi-Tier System Topology

```
+---------------------------------------------------------------------------------------+
|                                    CLIENT BROWSER                                     |
|   Next.js 16 / React 19 Client SPA · Tailwind CSS v4 · Lucide · Three.js Medical 3D   |
|   Role-Constrained Dynamic Nav · Responsive Desktop/Tablet/Mobile Layouts             |
+-------------------------------------------+-------------------------------------------+
                                            |
                         HTTPS / TLS 1.3    | JSON REST API Calls
                                            v
+---------------------------------------------------------------------------------------+
|                         BACKEND-FOR-FRONTEND (BFF) GATEWAY                             |
|   Next.js 16 App Router Server Execution Context (Node.js 20+ Runtime)               |
|                                                                                       |
|   [Tenant Resolver] ──> Resolves Tenant by Hostname, Domain or Tenant Context Header   |
|   [Auth & Session]  ──> Validates httpOnly Encrypted Cookie Session                   |
|   [Permission Gate] ──> Enforces Server-Side Access Control (Least Privilege)         |
|   [Native Dispatch] ──> TrytonClient JSON-RPC 2.0 Gateway                             |
+-------------------------------------------+-------------------------------------------+
                                            |
                      Internal Loopback/VPC | Native JSON-RPC 2.0 (Port 8000)
                                            v
+---------------------------------------------------------------------------------------+
|                        REVERSE PROXY & PERIMETER SECURITY                             |
|   Nginx 1.22.1 (GCP Host VM: gnuhealth-srv / Static IP 34.7.237.8)                    |
|   - Rate Limiting: 60 req/min per IP on /gnuhealth/ login                             |
|   - HTTP Request Header Sanitization & Buffer Overflow Protection                     |
|   - Reverse Proxy Routing: /gnuhealth/ -> 127.0.0.1:8000                              |
+-------------------------------------------+-------------------------------------------+
                                            |
                                            v
+---------------------------------------------------------------------------------------+
|                         APPLICATION ENGINE (TRYTOND 7.0)                               |
|   Tryton Application Server Daemon (Python 3.11 Virtualenv)                           |
|                                                                                       |
|   - Object-Relational Mapping (ORM): Pool, ModelSQL, ModelView                        |
|   - Role-Based Access Control: 28 Native Security Groups (`res.group`)                |
|   - State Machines: Appointments, Evaluations, Invoices, Prescriptions, Labs, Imaging  |
|   - Business Logic & Safety: Drug contraindications, ICD-10 coding, Account Moves     |
+-------------------------------------------+-------------------------------------------+
                                            |
                                            v
+---------------------------------------------------------------------------------------+
|                         STORAGE ENGINE (POSTGRESQL 15)                                |
|   PostgreSQL 15.19 Relational Database Management System                              |
|                                                                                       |
|   - Primary Database: `gnuhealth` (306 Public Schema Tables)                          |
|   - Zero-Orphan Referential Integrity across all 12 Foreign Key Chains                |
|   - WAL Logging, PITR Snapshot Capabilities, SCRAM-SHA-256 Authentication             |
+---------------------------------------------------------------------------------------+
```

---

## 3. Protocol & Communication Specification

### 3.1 Authentication & Session Issuance
Authentication is executed natively via `common.db.login`:

- **Endpoint:** `POST /gnuhealth/` (or via BFF `/api/auth/login`)
- **Headers:** `Content-Type: application/json`, `Authorization: Basic <base64(username:password)>`
- **Request Body:**
  ```json
  {
    "id": 1,
    "method": "common.db.login",
    "params": ["demo_frontdesk1", { "password": "••••••••" }]
  }
  ```
- **Response:**
  ```json
  {
    "id": 1,
    "result": [151, "3c98782a170564...89fe6a"]
  }
  ```
  Returns a tuple containing `[user_id, session_token]`.

### 3.2 Authenticated Model Execution
Subsequent business operations execute model methods using session-based authorization:

- **Headers:** `Content-Type: application/json`, `Authorization: Session <base64(username:userId:sessionToken)>`
- **Request Body:**
  ```json
  {
    "id": 1727263800000,
    "method": "model.gnuhealth.patient.search_read",
    "params": [
      [["rec_name", "ilike", "%ALEXANDER%"]],
      0,
      20,
      [["id", "DESC"]],
      ["id", "puid", "rec_name", "party", "blood_type"],
      {
        "company": 2,
        "language": "en"
      }
    ]
  }
  ```
- **Context Injection:** In Tryton JSON-RPC 2.0, context dictionary **must always be passed as the final parameter** of the `params` list. The context strictly includes the active healthcare institution (`company: <companyId>`) and user locale (`language: "en"`).

---

## 4. Multi-Tenant Architecture Evaluation & Strategy

Serving multiple independent hospital clients requires robust data isolation. We evaluated three architectural models against GNU Health's operational and compliance characteristics:

| Criterion | Model 1: Shared Database (Tenant ID Column) | Model 2: Schema-per-Tenant | Model 3: Database-per-Tenant (Recommended) |
| :--- | :--- | :--- | :--- |
| **Data Leakage Risk** | High (accidental query without tenant filter leaks records) | Medium (search path manipulation risk) | **Zero (cryptographic & OS/process physical separation)** |
| **GNU Health Compatibility**| Requires modifying upstream models and Tryton ORM | Incompatible with native Tryton table naming conventions | **100% Native (Tryton was built to serve multiple databases via `-d`)** |
| **Tenant Backup/Restore**| Complex; requires row-level filtering and selective dumps | Moderate; requires individual schema dumps | **Simple; native `pg_dump -d <tenant_db>` and point-in-time recovery** |
| **Regulatory Compliance** | Fails strict healthcare isolation requirements in UAE/GCC | Borderline | **Fully meets healthcare tenant isolation standards** |
| **Custom Configuration** | Shared chart of accounts and numbering sequences | Shared sequence engines | **Fully independent charts of accounts, sequences, and staff directories** |

### Selected Multi-Tenant Model: Hybrid Dedicated Database per Client with Multi-Branch Support
1. **Independent Client Tenancy (Database-per-Tenant):** Each independent hospital client receives a dedicated PostgreSQL database instance (e.g. `gnuhealth_ist_prod`, `gnuhealth_client_b`). A single Tryton server daemon can serve multiple databases concurrently using the Tryton multi-database flag:
   ```bash
   trytond -c /home/gnuhealth/trytond.conf -d gnuhealth,gnuhealth_client_b
   ```
2. **Multi-Hospital & Branch Tenancy (Company-per-Branch):** Within a single hospital group or client tenant, distinct hospitals, clinics, and outpatient centers are isolated using Tryton's native `company.company` hierarchy.
3. **Central Tenant Control Plane:** A lightweight control plane manages tenant provisioning metadata, domain mappings (e.g. `clinic1.ist-health.com`), administrative ownership, subscription status, and database connection descriptors.
4. **Tenant Resolver:** The Next.js BFF inspects incoming request subdomains/headers, maps the request to the target client tenant, routes the Tryton JSON-RPC call to the appropriate database, and isolates patient records completely.

---

## 5. Security & RBAC Enforcement Architecture

### 5.1 Defense-in-Depth Principle
Authorization is enforced at three distinct layers:
1. **Presentation Layer (Dynamic Navigation):** The Next.js frontend filters sidebar links, dashboard widgets, and action buttons based on the user's verified role and permissions issued by the server.
2. **BFF Gateway Layer (Route & Parameter Guard):** The Next.js API routes verify session validity, reject unauthorized role access before invoking the backend, and prevent tenant switching.
3. **Application & Database Layer (Native Tryton Groups):** The Tryton ORM evaluates model access rules (`ir.model.access`) and record rules (`ir.rule`) against the user's active session token.

### 5.2 Role Mapping Matrix
Native Tryton groups map to IST Health operational roles:

| IST Health Role | Native Tryton Security Groups | Primary Authorized Scope |
| :--- | :--- | :--- |
| **Platform Super Admin**| Tryton `Administration` (1) | Platform operations, tenant provisioning, system health; no routine clinical record access |
| **Tenant Admin** | `Health Administration` (11), `Party Administration` (3) | Tenant hospital configuration, user administration, department management |
| **Receptionist** | `Health Front Desk` (14) | Patient registration, intake queue, appointment scheduling |
| **Nurse** | `Health Nurse` (13), `Health Nurse Administration` (12) | Anthropometry, vital signs, triage acuity assessment, nursing notes |
| **Doctor / Physician** | `Health Doctor` (15) | Clinical evaluations (SOAP), ICD-10 diagnoses, lab orders, radiology requisitions, prescriptions |
| **Laboratory Staff** | `Health Lab` (23), `Health lab Administration` (22) | Laboratory worklist, specimen processing, CBC analyte validation, pathology certification |
| **Radiologist / Rad Tech**| `Health Imaging` (20), `Health Imaging Administration` (21) | Diagnostic imaging worklist, findings reporting, PACS verification |
| **Cashier / Billing Staff**| `Account` (6) | Outpatient invoice creation, cash collection, receipt issuance |
| **Financial Comptroller**| `Account Administration` (8), `Accounting Party` (7) | General ledger move audit, journal verification, account reconciliation |

---

## 6. Architectural Upgrades & Remediation Strategy

To achieve true production readiness, the following architectural upgrades are enacted:
1. **Elimination of `executeSystem()`:** Refactor all API routes to execute through the authenticated user's native Tryton session token, respecting Tryton's native RBAC.
2. **Persistent User & RBAC Management:** Replace the ephemeral in-memory staff directory in `/api/admin/users` with native queries against `res.user`, `res.group`, and `gnuhealth.healthprofessional`.
3. **Dynamic Patient Routing:** Parameterize all clinical workflows to load records dynamically based on URL parameters (`?patientId=...`) or arrival queue selection, removing hardcoded IDs.
4. **Idempotent Workflow State Transitions:** Wire action buttons directly to native Tryton state machine transitions (`gnuhealth.appointment.checkin`, `gnuhealth.patient.evaluation.sign`, `account.invoice.post`).
