# GNU HEALTH HMIS — REPORTS & EVIDENCE REPOSITORY

This directory contains verified audit trails, automated browser test logs, API test outputs, security forensic scans, and user acceptance testing evidence.

## Directory Structure & Taxonomy

```text
reports/
├── audits/               # Backend technical audits, database integrity, and baseline reports
├── browser_tests/        # Automated Chrome / Selenium E2E execution logs and screenshots
├── uat/                  # User Acceptance Testing manuals, verification logs, and execution sheets
├── api_tests/            # Native JSON-RPC API validation payloads, RPC logs, and contracts
├── security/             # Forensic secret scans, RBAC validation matrices, and TLS evidence
├── visual_uat_manual/    # Complete 73-screenshot curated repository for the UAT manual
│   └── screenshots/      # High-resolution callout-annotated application captures
└── live_browser_test/    # Baseline certification captures from initial E2E qualification
```

## Legacy Reference Preservation
Existing primary certification reports remain accessible in the root of `reports/`:
- `LIVE_BROWSER_E2E_CERTIFICATION.md` & `.json`
- `LIVE_BROWSER_TRANSACTION_TEST.md` & `.json`
- `e2e_test_results.json`
- `e2e_accounting_evidence.json`
- `e2e_rbac_evidence.json`
