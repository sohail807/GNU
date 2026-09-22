# GNU HEALTH HMIS 5.0 — FRONTEND SECURITY MODEL & ACCESS GOVERNANCE

**Document ID:** GNU-HEALTH-FE-SEC-2026-09-22  
**Target Audience:** Security Architects, Frontend Engineers, DevOps Engineers, Compliance Officers  
**Authoritative Backend:** GNU Health HMIS 5.0 / Tryton 7.0 / PostgreSQL 15.19  

---

## 1. Core Security Philosophy & Trust Boundaries

The clinic frontend application operates in an **untrusted client environment** (web browsers on clinic workstations, tablets, or mobile devices). Consequently:

1. **The Backend Never Trusts the Frontend:** All business rules, access control, state transitions, and audit records are evaluated and enforced exclusively on the GNU Health server.
2. **Zero Direct Database Exposure:** The frontend never connects directly to PostgreSQL. The database is bound strictly to `127.0.0.1:5432` with no external route.
3. **Zero Credential Exposure:** The frontend never receives database connection strings, database usernames/passwords, Tryton root credentials, or server SSH private keys.
4. **Session-Scoped Authorization:** Every interaction requires a valid session token issued during the authentication handshake. Permissions are re-evaluated dynamically per request based on the user's active role groups in Tryton.

```
+-------------------------------------------------------------+
|               UNTRUSTED: Client Browser                     |
|  - UI Elements & Navbars (Cosmetic Guides Only)             |
|  - In-Memory Session Token (Session Token, Expirable)       |
+-------------------------------------------------------------+
                              |
                              | HTTPS (Port 443) / JSON-RPC
                              v
+-------------------------------------------------------------+
|             TRUSTED BOUNDARY: Reverse Proxy (Nginx)         |
|  - Strict TLS Termination                                   |
|  - Security Headers: HSTS, X-Frame-Options, CSP, nosniff    |
+-------------------------------------------------------------+
                              |
                              | Internal Loopback (127.0.0.1:8000)
                              v
+-------------------------------------------------------------+
|          AUTHORITATIVE TRUST CORE: GNU Health / Tryton      |
|  - ir.model.access (Model Access Rules)                     |
|  - ir.model.field.access (Field Access Rules)               |
|  - View Field State Guards (states={'readonly': ...})       |
|  - Full Clinical & Financial Workflow State Machines        |
|  - Automatic Immutable Audit Trails (create_uid/write_uid)  |
+-------------------------------------------------------------+
```

---

## 2. Secrets & Credential Quarantine

The frontend repository, build bundles, runtime scripts, and network payloads are strictly quarantined from sensitive backend credentials:

| Secret Type | Backend Location | Frontend Visibility | Enforcement Mechanism |
|:------------|:-----------------|:--------------------|:----------------------|
| **PostgreSQL Passwords** | `/home/gnuhealth/trytond.conf` | **ZERO (Never Exposed)** | DB isolated to loopback; frontend talks only to JSON-RPC |
| **Server SSH Keys** | `~/.ssh/` on VM | **ZERO (Never Exposed)** | Standard web application barrier |
| **Tryton Admin Password** | `res_user` (hashed) | **ZERO (Never Exposed)** | Dedicated non-admin demo/operational user accounts |
| **User Password Hashes** | `res_user.password_hash` | **ZERO (Never Exposed)** | API queries on `res.user` exclude `password_hash` |
| **Session Authentication Tokens**| `common.db.login` response | **Temporary (Session Only)**| In-memory session or HttpOnly cookie; expires on idle |

---

## 3. Negative Security Cases & Hardened Enforcements

The following security constraints were empirically validated against the live backend and must never be bypassed:

### 3.1 Front Desk Role Restriction
- **Constraint:** Front desk receptionists (`Health Front Desk`) cannot access, create, or alter clinical evaluations or medical prescriptions.
- **Enforcement:** `ir.model.access` on `gnuhealth.patient.evaluation` and `gnuhealth.prescription.order`.
- **Observed Behavior:** RPC calls return `AccessError: You are not allowed to access "Patient Evaluation"`.
- **Frontend Design Rule:** Reception UI must not offer clinical documentation forms.

### 3.2 Nursing Role Restriction
- **Constraint:** Nurses (`Health Nurse`) can record triage vital signs but cannot sign outpatient medical evaluations, validate diagnostic laboratory reports, or finalize customer billing.
- **Enforcement:** `ir.model.access` and workflow state machines.
- **Observed Behavior:** Evaluation signing is reserved for `Health Doctor`; invoicing is reserved for `Account`.

### 3.3 Cashier / Financial Role Restriction
- **Constraint:** Cashiers (`Account`, `Accounting Party`) cannot modify clinical records, doctor notes, laboratory results, or prescription orders.
- **Enforcement:** `ir.model.access` returns `DENY` for all clinical models.
- **Observed Behavior:** RPC write attempts to `gnuhealth.patient.evaluation` raise `AccessError`.

### 3.4 Clinician Financial Posting Restriction
- **Constraint:** Clinicians (`Health Doctor`) cannot post invoices, create manual journal entries, or reconcile customer accounts receivable.
- **Enforcement:** `ir.model.access` returns `DENY` for `account.invoice` and `account.move` writing/posting.
- **Frontend Design Rule:** Doctor EMR interface compiles billable health services but delegates invoicing and cash collection to the cashier desk.

### 3.5 Signed Clinical Record Immutability
- **Constraint:** Once an outpatient evaluation is signed by the clinician (`state='signed'`), the medical record is locked against in-place tampering.
- **Enforcement:** 
  - Native Tryton field states: `states={'readonly': Eval('state') == 'signed'}`.
  - Non-administrative roles are denied delete access on `gnuhealth.patient.evaluation`.
- **Observed Behavior:** Attempted modification is rejected by the ORM validator.

### 3.6 Posted Financial Record Immutability
- **Constraint:** Once an invoice is posted (`state='posted'`) and generating General Ledger moves, it cannot be edited, cancelled without reversal, or deleted.
- **Enforcement:** Tryton core accounting engine (`account.invoice.write` and `account.move.write`).
- **Observed Behavior:** Calling delete or write raises `AccessError: You cannot modify invoice "<number>" because it is posted, paid or cancelled`.

### 3.7 Privilege Escalation Prevention
- **Constraint:** Non-administrative clinic users cannot modify `res.user` or `res.group` to grant themselves administrative privileges.
- **Enforcement:** `ir.model.access` grants write/create permissions on `res.user` strictly to Group 1 (`Administration`).
- **Observed Behavior:** Non-admin write attempts to `res.user` raise `AccessError: You are not allowed to access "User"`.

---

## 4. Session Token Management in Client Applications

Frontend developers must adhere to the following session management standards:

1. **Storage Mechanism:**
   - Prefer in-memory state management (e.g. React context / Vuex / Redux store) or secure `sessionStorage`.
   - Never persist session tokens in unencrypted permanent storage (`localStorage` or IndexedDB) on shared clinical terminals.
2. **Session Timeout:**
   - Implement an automated client-side inactivity timer (default: 15 minutes of idle time).
   - On timeout, immediately purge in-memory tokens and display the re-authentication modal.
3. **Session Interception:**
   - All HTTP responses with status `401 Unauthorized` or payload `["UserError", "Session expired"]` must trigger an immediate session cleanup and redirection to login.
4. **No Cross-Site Scripting (XSS) Exposure:**
   - Sanitize all text fields rendered in the EMR.
   - Nginx enforces strict `Content-Security-Policy` and `X-XSS-Protection` headers.

---

## 5. Audit Trail & Legal Traceability

Under Qatar healthcare compliance standards and general medical jurisprudence, every electronic healthcare interaction must be attributed:

1. **Non-Repudiation:** GNU Health records the user ID (`create_uid`), creation timestamp (`create_date`), last modifying user (`write_uid`), and modification timestamp (`write_date`) on every table row.
2. **Attribution Integrity:** The frontend cannot override or fabricate user attribution. Attribution is derived directly from the authenticated session context.
3. **Accountability:** Clinical staff must never share login credentials. Individual DEMO and operational staff accounts are strictly assigned per person.
