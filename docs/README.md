# GNU HEALTH HMIS — DOCUMENTATION REPOSITORY

This directory houses technical specifications, workflow guides, handover contracts, and operational runbooks for the outpatient clinic deployment.

## Directory Structure & Taxonomy

```text
docs/
├── uat/          # User Acceptance Testing guides, click-by-click manuals, and QA checklists
├── api/          # Native JSON-RPC API integration contracts, model schemas, and payload examples
├── handover/     # Frontend integration packages, onboarding checklists, and developer guides
└── [legacy]      # 38 comprehensive domain guides (Clinical, Billing, Pharmacy, Radiology, Security)
```

## Core Reference Sets
- **Frontend Integration:** [`docs/handover/`](./handover/) contains the 8-part executive handover series (`01_...` through `08_...`).
- **Native API Contract:** [`docs/api/`](./api/) references the Tryton 7.0 JSON-RPC protocol specification.
- **Visual UAT Manual:** [`docs/uat/`](./uat/) references the 54-page click-by-click manual and execution sheets.
