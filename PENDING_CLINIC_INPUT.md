# PENDING CLINIC INPUT & REMAINING REQUIREMENTS REGISTER
## GNU HEALTH HMIS 5.0 / TRYTON 7.0 OUTPATIENT CLINIC

**Classification**: Authoritative Production Blocker & Business Input Intake Register  
**Governing Protocol**: Zero-Fabrication Healthcare Data Integrity Protocol  
**Current Implementation Status**: **`IMPLEMENTATION BLOCKED — INPUTS REQUIRED`**  
**Last Revalidated**: 2026-09-22

---

## 1. Executive Statement

Technical infrastructure, Tryton application services, PostgreSQL database configuration, systemd sandboxing, perimeter network rules, automated backups, and technical verification drills have been executed and verified against the live host (`gnuhealth-srv`). All defined technical verification scenarios executed in this phase passed under the tested conditions.

In accordance with strict clinical governance, the operational database is preserved at a clean implementation baseline (`patients = 0`, `appointments = 0`, `evaluations = 0`, `prescriptions = 0`, `invoices = 0`, `census = 0`).

The implementation team will NOT fabricate clinic legal identities, physician license credentials, medical tariffs, or executive sign-offs. System cutover to live clinical operations remains strictly blocked pending the delivery and formal approval of the authoritative inputs cataloged below.

---

## 2. Business Input Intake Catalog

### Item 01: Clinic Legal Identity & Trade Name
* **INPUT**: Official Clinic Legal Trade Name (English & Arabic)
* **OWNER**: Clinic General Manager / Legal Director
* **WHY REQUIRED**: Required on official patient billing invoices, diagnostic evaluation reports, electronic prescriptions, and regulatory submissions.
* **STATUS**: `PENDING CLINIC INPUT`
* **NEXT ACTION**: Clinic General Manager submits Section A of `docs/CLINIC_GO_LIVE_INPUT_TEMPLATE.md`. Implementation team updates institutional party record in Tryton.

---

### Item 02: Production Domain Name & DNS Delegation
* **INPUT**: Official Clinic Production FQDN & DNS A-Record pointing to `34.7.237.8`
* **OWNER**: IT Operations Lead / Clinic IT Director
* **WHY REQUIRED**: Mandatory to issue official Let's Encrypt TLS certificate on Port 443 and activate HTTPS transport encryption.
* **STATUS**: `PENDING CLINIC INPUT`
* **NEXT ACTION**: IT Lead points DNS A-record to `34.7.237.8`. Implementation team executes 11-step TLS activation SOP detailed in `TLS_EVIDENCE.md`.

---

### Item 03: Commercial Registration & Tax Identification
* **INPUT**: Commercial Registration (CR) Number & Tax Identification
* **OWNER**: Finance Director / Legal Counsel
* **WHY REQUIRED**: Legal requirement for corporate invoicing and financial tax accounting under applicable commercial law.
* **STATUS**: `PENDING CLINIC INPUT`
* **NEXT ACTION**: Finance Director provides CR number in Section B of `docs/CLINIC_GO_LIVE_INPUT_TEMPLATE.md`. Implementation team configures identifier on company party.

---

### Item 04: Healthcare Facility Licensing
* **INPUT**: National Healthcare Facility License Number (e.g., MOPH License)
* **OWNER**: Medical Director
* **WHY REQUIRED**: Required for clinical authenticity, regulatory diagnostic compliance, and health authority inspection audits.
* **STATUS**: `PENDING CLINIC INPUT`
* **NEXT ACTION**: Medical Director provides facility license number in Section C of `docs/CLINIC_GO_LIVE_INPUT_TEMPLATE.md`. Implementation team records number in `gnuhealth.institution`.

---

### Item 05: Official Facility Contact Details
* **INPUT**: Physical Clinic Address (Building, Street, Zone), Public Telephone & Official Billing Email
* **OWNER**: Operations Manager
* **WHY REQUIRED**: Required for printed patient appointment slips, encounter invoices, laboratory receipts, and patient inquiry communication.
* **STATUS**: `PENDING CLINIC INPUT`
* **NEXT ACTION**: Operations Manager completes Section C & D of `docs/CLINIC_GO_LIVE_INPUT_TEMPLATE.md`. Implementation team populates institution address and communication mechanisms.

---

### Item 06: Licensed Physician Roster
* **INPUT**: Licensed Outpatient Physicians (Full Legal Names, Medical License Numbers, Specialties)
* **OWNER**: Medical Director / Chief Medical Officer / HR
* **WHY REQUIRED**: Tryton and GNU Health require active `gnuhealth.healthprofessional` records linked to practitioner users to schedule appointments, conduct evaluations, and sign prescriptions.
* **STATUS**: `PENDING CLINIC INPUT`
* **NEXT ACTION**: Medical Director provides physician roster via Section E of `docs/CLINIC_GO_LIVE_INPUT_TEMPLATE.md`. Implementation team provisions health professional records and assigns clinical roles.

---

### Item 07: Operational Staff Directory
* **INPUT**: Administrative Staff Directory (Receptionists, Triage Nurses, Billing Clerks, Lab Technicians, Radiographers)
* **OWNER**: Operations Manager / HR
* **WHY REQUIRED**: Required to create individualized user accounts (`res.user`) under strict least-privilege role segregation as defined in `docs/ROLE_ONBOARDING_MATRIX.md`.
* **STATUS**: `PENDING CLINIC INPUT`
* **NEXT ACTION**: Operations Manager provides staff names and designated roles. Implementation team creates named accounts with individualized temporary credentials.

---

### Item 08: Outpatient Service Tariff Schedule
* **INPUT**: Approved Consultation and Diagnostic Service Prices in QAR
* **OWNER**: Chief Financial Officer / Clinic Board
* **WHY REQUIRED**: The 15 pre-configured outpatient services (`OPD-EVAL`, `LAB-*`, `RAD-*`) currently have `list_price = NULL`. Customer invoicing cannot validate or calculate line totals without approved tariffs.
* **STATUS**: `PENDING FINANCE INPUT`
* **NEXT ACTION**: CFO completes and signs `docs/SERVICE_TARIFF_SCHEDULE_TEMPLATE.csv`. Implementation team imports prices into `product.template` list prices.

---

### Item 09: Financial Fiscal Year Parameters & Adoption
* **INPUT**: Formal Approval of Fiscal Year 2026 (2026-01-01 to 2026-12-31) and Chart of Accounts
* **OWNER**: Chief Financial Officer / Head of Accounting
* **WHY REQUIRED**: General ledger account moves and customer invoices require an active, open fiscal year and valid monthly accounting periods. In the live system, Fiscal Year 2026 (ID 7) and 12 monthly periods (IDs 25–36) are technically configured and linked to strict sequence MV-2026/.
* **STATUS**: `TECHNICALLY CONFIGURED — FINANCE APPROVAL PENDING`
* **NEXT ACTION**: CFO reviews and formally signs off on the configured chart of accounts and FY2026 periods via `docs/FINANCE_GO_LIVE_INPUT_TEMPLATE.md`.

---

### Item 10: Point-of-Sale & Payment Settlement Methods
* **INPUT**: Accepted Payment Methods (Cash, Visa/Mastercard debit/credit, POS Terminal IDs)
* **OWNER**: Head of Accounting
* **WHY REQUIRED**: Required to configure cashier settlement journals for front desk patient copay and self-pay settlements.
* **STATUS**: `PENDING FINANCE INPUT`
* **NEXT ACTION**: Accounting submits terminal and banking details. Implementation team creates corresponding Tryton payment journals.

---

### Item 11: Contracted Health Insurance Payers (Optional for Cash Opening)
* **INPUT**: Contracted Health Insurance Companies, Policy Types, and Copayment Rules
* **OWNER**: Insurance / Billing Manager
* **WHY REQUIRED**: To configure insurance party records, plan templates, and split-billing rules.
* **STATUS**: `PENDING CLINIC INPUT` *(Non-blocking for self-pay outpatient go-live)*
* **NEXT ACTION**: Insurance manager submits contracted payer contracts when available.

---

### Item 12: Business UAT & Final Executive Sign-Off
* **INPUT**: Completed `BUSINESS_UAT_SIGNOFF.md` signed by all 5 designated executive owners
* **OWNER**: Medical Director, Operations Owner, Finance Owner, IT Owner, Management Sponsor
* **WHY REQUIRED**: Mandatory clinical safety and governance gate authorizing opening of the system for live human patient care.
* **STATUS**: `PENDING CLINIC SIGN-OFF`
* **NEXT ACTION**: Designated owners execute the 12 scenarios in `BUSINESS_UAT_SIGNOFF.md` and sign the authorization block.

---

## 3. Summary of Intake Deliverables for Stakeholders

| Form / Template | Location | Primary Recipient |
| :--- | :--- | :--- |
| **Clinic Input Template** | `docs/CLINIC_GO_LIVE_INPUT_TEMPLATE.md` | Medical Director & Operations Manager |
| **Finance Input Template** | `docs/FINANCE_GO_LIVE_INPUT_TEMPLATE.md` | Chief Financial Officer |
| **Tariff Schedule CSV** | `docs/SERVICE_TARIFF_SCHEDULE_TEMPLATE.csv` | CFO / Billing Lead |
| **Business UAT Sign-Off Pack** | `BUSINESS_UAT_SIGNOFF.md` | All 5 Executive Stakeholders |
