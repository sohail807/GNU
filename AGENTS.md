# GNU HEALTH HMIS — WORKSPACE RULES & AGENT OPERATING DIRECTIVES

These directives govern all development, testing, debugging, auditing, and documentation tasks within this workspace.

---

## 1. Architectural Integrity & Single Source of Truth
- **Authoritative Backend:** GNU Health HMIS running on Tryton 7.0 (PostgreSQL) is the sole system of record.
- **No Shadow Systems:** Never construct parallel backends, mock databases, duplicate accounting tables, secondary RBAC models, or shadow transaction engines.
- **Native Implementation:** All business logic, state machines, and data validation must utilize native Tryton models (`gnuhealth.*`, `party.*`, `account.*`).
- **Data Dictionary Compliance:** Respect native Tryton field definitions (e.g., radiology findings stored in `comment` labeled on screen as `Additional Information`; lab test criteria populated via `complete_criteareas`).

---

## 2. Security & Zero-Trust Credential Protection
- **Zero Secret Commits:** Never embed cleartext passwords, session tokens, private SSH keys, or connection strings in code, documentation, Git commits, or screenshots.
- **Credential Storage:** Retrieve all test credentials from secure local credential managers or authorized environment variables.
- **Masking:** In screenshots and documentation, mask all sensitive inputs as `[SECURE]` or `••••••••`.
- **Git Hygiene:** Strictly adhere to `.gitignore` rules preventing `.pem`, `.key`, `id_rsa*`, `.env`, and database dumps from being tracked.

---

## 3. Database Safety & Test Data Boundaries
- **Synthetic Data Exclusively:** All UAT, E2E, and automated tests must use synthetic patient identities (e.g., `Alexander Wright`, `P00088`) and synthetic transactions.
- **Production Record Immutability:** Never modify, overwrite, or delete real patient medical records or posted general ledger moves.
- **Native Transaction Cycles:** Always conduct business transactions through native Tryton interfaces (Sao web client or JSON-RPC API) rather than direct SQL inserts.
- **Uniqueness Constraints:** Respect party and patient uniqueness constraints (`gnuhealth_patient_name_uniq`). To update an existing patient, always search and edit the existing record; never click `+` (New Record) for an existing party.

---

## 4. Verification & Evidence-Backed Claims
- **No Unsubstantiated Claims:** Never declare a test or task "PASSED" without actual, reproducible evidence.
- **Distinguish Verification Modes:**
  1. *Code Inspection:* Static review of Python models, XML views, and configuration files.
  2. *API Testing:* Verified HTTP JSON-RPC calls with response codes and JSON payloads.
  3. *Database Auditing:* Direct SQL inspection of table rows, relational keys, and constraint states.
  4. *Live Browser Testing:* Genuine browser automation in Chrome (via Selenium) producing dated screenshots and execution logs.
- **Negative Testing:** Verify that unauthorized roles are genuinely blocked with appropriate HTTP 403 or Tryton `AccessError` exceptions.

---

## 5. Documentation Fidelity
- **Document Actual Behavior:** Always verify actual system behavior in the live environment before documenting menu paths, UI labels, or API parameters.
- **No Hallucinated Paths:** Never invent non-existent menus, buttons, endpoints, or database tables.
- **Screenshot Integrity:** All screenshots must originate from genuine live browser sessions. AI-generated or fabricated mock screenshots are strictly prohibited.
- **Troubleshooting Inclusion:** Document known operational edge cases, root causes, exact recovery click-paths, and visual error states.

---

## 6. Standard Task Execution Protocol (11-Step Lifecycle)
1. **Inspect:** Examine existing codebase, database state, and configuration before editing.
2. **Reproduce:** Reproduce reported issue or baseline the requested feature in the live environment.
3. **Plan:** Formulate a concise, phased implementation plan.
4. **Implement:** Execute the minimal appropriate code or configuration change.
5. **Focused Test:** Execute targeted unit or functional tests on the modified component.
6. **Regression Test:** Verify that adjacent clinical or financial workflows remain unaffected.
7. **Browser Verification:** Verify user-facing changes in Google Chrome.
8. **Capture Evidence:** Capture timestamped screenshots, logs, and JSON outputs.
9. **Document:** Update relevant markdown specifications, indices, and manuals.
10. **Security Scan:** Inspect Git diff for secrets, temporary files, or unintended changes.
11. **Summary:** Provide a concise, evidence-backed completion summary.

---

## 7. Approval & Autonomous Execution Boundaries
- **Autonomous Execution Permitted:**
  - Read-only inspection of files, logs, and database schemas.
  - Safe automated test execution with synthetic data.
  - Generation of documentation, evidence indices, and reports.
  - Bug fixes and optimizations in local workspace scripts.
- **Explicit User Approval Required Before:**
  - Deleting database records or dropping tables.
  - Modifying live accounting configuration or chart of accounts.
  - Changing user passwords, security groups, or access rules.
  - Modifying SSH keys, firewall rules, or GCP infrastructure.
  - Force-pushing or rewriting Git commit history.
