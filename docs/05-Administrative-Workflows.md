# 05. Administrative Workflows

**Project**: Healthcare Management System — GNU Health Implementation  
**Assessment Date**: 2026-09-21  
**Document**: `docs/05-Administrative-Workflows.md`  

---

## 1. Executive Summary

This document specifies the administrative, operational, and front-desk workflows that support clinical delivery in the outpatient clinic, including patient reception, appointment queues, doctor scheduling, and cashier reconciliation.

---

## 2. Core Administrative Workflows

### A. Reception & Patient Arrival Handling
1. **Patient Check-In**:
   - Reception staff search patient by QID (Civil ID), Mobile Number, or PUID.
   - For new patients, reception performs standard demographic registration in `party.party` and creates the `gnuhealth.patient` record.
   - For scheduled patients, reception changes appointment state from `confirmed` to `checked_in`.
2. **Walk-In Patient Routing**:
   - Reception creates an immediate appointment with status `checked_in`, assigning the patient to the next available general practitioner or specialist.
3. **Queue Prioritization**:
   - Checked-in patients automatically appear on the Nursing / Triage unit worklist.

---

### B. Outpatient Waiting Queue Management
- **Wait-Time Tracking**: GNU Health calculates patient wait time via functional field `get_wait_time()` by measuring the delta between `checked_in_date` on the appointment and `evaluation_start` on the encounter record.
- **Triage Priority**: Nursing staff assess patient urgency (Routine, Priority, Emergency) and route patients to appropriate consultation rooms.

---

### C. Doctor Scheduling & Shift Rostering
- **Physician Profile**: Managed in `gnuhealth.healthprofessional`, linking each doctor to their legal party record, institution unit (`OPD`), license number, and primary specialty.
- **Appointment Slots**: Standard consultation durations (e.g. 15, 20, or 30 minutes) are managed through Tryton appointment scheduling.
- **Absence / Leave Handling**: Cancelled appointments transition to `cancelled` state with mandatory cancellation reason tracking.

---

### D. Cashier Operations & End-of-Day Reconciliation
1. **Point of Sale Collection**:
   - Cashiers collect patient consultation fees, medication charges, and copay amounts in Qatari Riyal (`QAR`).
   - Transactions are booked to the Cash Journal (`CASH`) or Bank POS Card Journal (`BANK`).
2. **Daily Shift Closure**:
   - Cashier runs payment register report to compare physical cash drawer counts against recorded Tryton cash receipts.
   - Daily statement submitted to the Finance / Accounts unit (`BILL`).

---

### E. Master Data Governance
- **Role-Based Maintenance**: Only users with `Administration` (1) or `Health Administration` (11) group privileges may create or update hospital units, service catalogs, or doctor profiles.
- **Immutability Protection**: Patient clinical records, once signed by attending physicians, cannot be altered by administrative staff.
