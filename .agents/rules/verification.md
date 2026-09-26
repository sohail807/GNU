# Verification Rules

## Evidence-Backed Quality Assurance
- **Prohibition of Unsubstantiated Claims:**
  - An agent must NEVER mark a test, finding, or task as "PASSED", "VERIFIED", or "RESOLVED" without capturing and presenting reproducible evidence.
- **Verification Modality Taxonomy:**
  1. **Code Inspection:** Examining Python source code, Tryton XML view definitions, and database constraints. Necessary but NOT sufficient on its own to claim operational completion.
  2. **API Verification:** Executing HTTP JSON-RPC calls against `/gnuhealth/` using `common.db.login` and model dispatchers (`model.gnuhealth.*.read`, `write`, `create`), verifying HTTP 200 responses and valid result payloads.
  3. **Database Audit:** Querying PostgreSQL tables to verify relational integrity, foreign keys, and calculated balances.
  4. **Genuine Browser Testing:** Launching Google Chrome via Selenium, navigating menus, filling input fields, clicking workflow buttons, and capturing actual application screenshots.
- **Strict Evidence Retention:**
  - Browser tests must output timestamped screenshots to `reports/browser_tests/` or `reports/visual_uat_manual/screenshots/`.
  - JSON execution logs must record step IDs, start/end timestamps, duration, and pass/fail states.
- **Negative Testing Requirement:**
  - Security and RBAC claims require negative testing (verifying that unauthorized roles receive `AccessError` / HTTP 403 when attempting unauthorized operations).
