# GNU HEALTH HMIS — WORKSPACE RULES & AGENT OPERATING DIRECTIVES

See [AGENTS.md](./AGENTS.md) for the master operating directives.

These directives govern all development, testing, debugging, auditing, and documentation tasks within this workspace:
1. **Architecture:** GNU Health / Tryton on PostgreSQL is the authoritative backend. Never build parallel or shadow backends.
2. **Security:** Zero secret leakage. No plaintext passwords, session tokens, or private keys committed or logged.
3. **Database Safety:** Synthetic test data only. Respect party uniqueness constraints (`gnuhealth_patient_name_uniq`). Never alter production records.
4. **Verification:** Evidence-backed verification only. Distinguish code inspection, API testing, SQL queries, and live Chrome browser testing.
5. **Documentation:** Document verified runtime behavior. Never invent endpoints, menus, or model fields.
6. **Task Protocol:** Follow the 11-step execution lifecycle (Inspect -> Reproduce -> Plan -> Implement -> Test -> Regress -> Verify -> Evidence -> Document -> Scan -> Summarize).
7. **Approval Boundaries:** Require user approval for destructive changes, accounting alterations, privilege escalation, and infrastructure modifications.
