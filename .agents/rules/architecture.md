# Architecture Rules

## Authoritative System of Record
- **Core Platform:** GNU Health HMIS v5.0.6 running on Tryton ERP v7.0.58 backed by PostgreSQL 15 on Debian.
- **Single Source of Truth:** All medical records, appointments, evaluations, prescriptions, laboratory results, medical imaging requests, invoices, and accounting moves reside exclusively in Tryton models.
- **Prohibited Architectures:**
  - Never implement parallel backends, SQLite shadow databases, or mock transaction stores.
  - Never create separate tables for business logic that duplicate Tryton native models.
  - Never bypass Tryton's ORM or JSON-RPC dispatchers with custom unmanaged REST layers unless explicitly designed as an authenticated Tryton proxy.
- **Workflow State Engines:**
  - Appointments: `draft` -> `confirmed` -> `checked_in` -> `done`.
  - Evaluations: `draft` -> `in_progress` -> `done`.
  - Prescriptions: `draft` -> `prescription` (action: `create_prescription`).
  - Lab Orders: `draft` -> `done` (analytes loaded via `complete_criteareas`).
  - Invoices: `draft` -> `validated` -> `posted` -> `paid`.
