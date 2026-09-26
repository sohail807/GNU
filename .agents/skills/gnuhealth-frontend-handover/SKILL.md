---
name: gnuhealth-frontend-handover
description: >-
  Generate, validate, and package the comprehensive backend API specification, data models, workflow state machines, and handover checklists required for frontend UI integration with GNU Health HMIS. Use when preparing developer documentation for external or frontend engineering teams.
---

# GNU Health Frontend Integration & Handover Runbook

This skill compiles and validates the technical handover package required for frontend developers integrating custom web, mobile, or portal interfaces with the GNU Health HMIS backend.

## Prerequisites
- Working GNU Health deployment on `http://34.7.237.8/`.
- Verified native API endpoints and operational workflows.
- Handover documentation set (`01_GNU_HEALTH_BACKEND_EXECUTIVE_HANDOVER.md` through `08_GNU_HEALTH_BACKEND_API_HANDOVER_INDEX.md`).

## Handover Package Artifacts

The frontend integration documentation suite consists of eight core artifacts:

1. **[`01_GNU_HEALTH_BACKEND_EXECUTIVE_HANDOVER.md`](../../01_GNU_HEALTH_BACKEND_EXECUTIVE_HANDOVER.md):**  
   High-level architecture overview, server environment specifications, operational boundaries, and system topology.
2. **[`02_GNU_HEALTH_API_INTEGRATION_SPECIFICATION.md`](../../02_GNU_HEALTH_API_INTEGRATION_SPECIFICATION.md):**  
   Detailed JSON-RPC 2.0 protocol guide, endpoint schemas, request/response headers, and session token authentication (`common.db.login`).
3. **[`03_GNU_HEALTH_DATA_MODEL_AND_WORKFLOW_REFERENCE.md`](../../03_GNU_HEALTH_DATA_MODEL_AND_WORKFLOW_REFERENCE.md):**  
   Entity-relationship diagrams, model schemas for Patient, Appointment, Evaluation, Prescription, Lab, Radiology, and Invoices, including exact field names and workflow transitions.
4. **[`04_GNU_HEALTH_RBAC_AND_SECURITY_CONTRACT.md`](../../04_GNU_HEALTH_RBAC_AND_SECURITY_CONTRACT.md):**  
   Security matrix detailing the 6 departmental roles, access control lists (ACLs), button rules, and session timeout policies.
5. **[`05_GNU_HEALTH_FRONTEND_INTEGRATION_GUIDE.md`](../../05_GNU_HEALTH_FRONTEND_INTEGRATION_GUIDE.md):**  
   Code samples and recipes in TypeScript/JavaScript for calling native Tryton JSON-RPC endpoints from React, Vue, or Next.js frontends.
6. **[`06_GNU_HEALTH_BACKEND_TEST_AND_CERTIFICATION_SUMMARY.md`](../../06_GNU_HEALTH_BACKEND_TEST_AND_CERTIFICATION_SUMMARY.md):**  
   Summary of all verified E2E transactions, database integrity audits, and API certification tests.
7. **[`07_GNU_HEALTH_FRONTEND_HANDOVER_CHECKLIST.md`](../../07_GNU_HEALTH_FRONTEND_HANDOVER_CHECKLIST.md):**  
   Step-by-step onboarding checklist for frontend developers to verify environment connectivity, authentication, and basic CRUD operations.
8. **[`08_GNU_HEALTH_BACKEND_API_HANDOVER_INDEX.md`](../../08_GNU_HEALTH_BACKEND_API_HANDOVER_INDEX.md):**  
   Master navigation index linking all handover documents, contracts, and test evidence.

## Handover Validation Workflow

### Step 1: Probe Catalogs & Dynamic Models
Verify catalog data availability before handing over to frontend developers:
```powershell
python scripts/probe_catalogs.py
```
Checks:
- Medicaments catalog (Amoxicillin, dosages, forms).
- Diagnostic catalogs (ICD-10 codes, `J06.9`).
- Lab test profiles (CBC, analytes).
- Radiology study types (Chest X-Ray).
- Service tariff schedules (Outpatient Consultation, $50.00).

### Step 2: Validate Frontend Integration Contracts
Execute automated JSON-RPC contract tests:
```powershell
python scripts/test_operational_api.py
```
Confirm that:
- Patient creation returns valid ID and PUID.
- Appointment creation and check-in execute via RPC.
- Prescription lines populate medicament ID and safety criteria.
- Invoices calculate line totals correctly.

### Step 3: Archive & Publish Documentation
Ensure all handover guides are published to `docs/handover/` and referenced in [`GNU_HEALTH_BACKEND_API_HANDOVER_PACKAGE.md`](../../GNU_HEALTH_BACKEND_API_HANDOVER_PACKAGE.md).
