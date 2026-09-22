# PENDING CLINIC INPUT & REMAINING REQUIREMENTS REGISTER
## GNU HEALTH HMIS 5.0 / TRYTON 7.0 OUTPATIENT CLINIC

**Classification**: Single Authoritative Implementation Blocker & Stakeholder Input Register  
**Governing Protocol**: Zero-Fabrication Healthcare Data Integrity Standard  
**Current Status**: ACTIVE REGISTER — AWAITING STAKEHOLDER SUBMISSIONS  

---

## 1. Single Authoritative Input Register

| ID | CATEGORY | REQUIRED INPUT | WHY REQUIRED | OWNER | STATUS | BLOCKING? | EVIDENCE | DATE RECEIVED |
| :--- | :--- | :--- | :--- | :--- | :---: | :---: | :--- | :---: |
| **CLINIC-001** | Legal Identity | Official legal clinic trade name (English & Arabic) | Legal header on patient invoices, prescriptions, and official medical reports | Clinic General Manager / Legal Director | `PENDING INPUT` | **YES** | Institution party currently set to default placeholder | — |
| **CLINIC-002** | Infrastructure | Official clinic production FQDN & DNS A-Record | Provision Let's Encrypt TLS certificate on Port 443 | IT Lead / Operations | `PENDING INPUT` | **YES** | Nginx `server_name _;` listening on Port 80 only | — |
| **CLINIC-003** | Licensing | Commercial Registration (CR) number | Required for legal commercial invoicing and fiscal compliance | Finance / Legal Director | `PENDING INPUT` | **YES** | Model `party.party` tax identifier blank | — |
| **CLINIC-004** | Licensing | MOPH / National Healthcare Facility License Number | Required for official clinical diagnostic and regulatory reporting | Medical Director | `PENDING INPUT` | **YES** | Model `gnuhealth.institution` license blank | — |
| **CLINIC-005** | Contact | Official physical clinic address (Building, Street, Zone) | Required on printed patient encounter receipts and referral documents | Operations Lead | `PENDING INPUT` | **YES** | Model `party.address` contains default blank row | — |
| **CLINIC-006** | Contact | Official public telephone number and billing email | Public appointment line and corporate billing contact | Operations Lead | `PENDING INPUT` | **YES** | Contact mechanisms unconfigured | — |
| **CLINIC-007** | Clinical Staff | Licensed physician roster (Names, QCHP License Nos, Specialties) | Doctors must be registered in `gnuhealth.healthprofessional` to book appointments and sign Rx | Medical Director / HR | `PENDING INPUT` | **YES** | `doctor_count = 0` in live database | — |
| **CLINIC-008** | Operations Staff| Operational staff directory (Reception, Nursing, Billing) | To provision named user accounts in `res.user` mapped to least-privilege security groups | Operations / HR | `PENDING INPUT` | **YES** | Exactly 1 active user (`admin`); demo users disabled | — |
| **CLINIC-009** | Tariffs | Outpatient service consultation and diagnostic fee schedule | To populate `list_price` across 15 configured outpatient services | CFO / Clinic Board | `PENDING INPUT` | **YES** | 15 products have `list_price = NULL` in database | — |
| **CLINIC-010** | Insurance | Contracted health insurance payers and copay rules | To configure payer parties, policy plans, and insurance split billing | Insurance Lead / CFO | `PENDING INPUT` | **NO** | `gnuhealth.insurance` contains 0 records (Self-pay can launch) | — |
| **FIN-001** | Accounting | Approved Fiscal Year Name (e.g., `FY2026`) | Mandatory accounting root container required for Tryton invoice posting | CFO / Head of Accounts | `PENDING APPROVAL` | **YES** | `fiscal_year_count = 0` in live database | — |
| **FIN-002** | Accounting | Approved Fiscal Year Start Date and End Date | Invoice validation fails without an active, open fiscal period | CFO / Head of Accounts | `PENDING APPROVAL` | **YES** | Model `account.fiscalyear` has 0 rows | — |
| **FIN-003** | Billing | Accepted Point-of-Sale payment methods and Terminal IDs | To configure cashier journals and POS receipt settlement | Head of Accounts | `PENDING APPROVAL` | **YES** | Payment journals restricted to default cash | — |
| **FIN-004** | Taxation | Healthcare services tax treatment confirmation (0% / Exempt) | Mandatory for legal tax calculation on outpatient invoice lines | CFO / Tax Advisor | `PENDING APPROVAL` | **YES** | Account `220000` (Main Tax) active at 0% default | — |
| **IT-001** | Security | Operator SSH private key hardening approval/implementation | Operator key `~/.ssh/gnuhealth_deploy` is unencrypted on disk | Lead DevOps / Security | `PENDING ACTION` | **YES** | Key has `cipher: none`; requires passphrase/ssh-agent | — |
| **UAT-001** | Quality | Clinic leadership and Medical Director UAT sign-off | Formal authorization to open the system for live clinical operations | Medical Director / Clinic Board | `PENDING SIGN-OFF`| **YES** | 12 technical synthetic UAT tests passed; operational sign-off pending | — |

---

## 2. Stakeholder Submission Instructions

To submit the required data, clinic authorities must complete:
1. `docs/CLINIC_GO_LIVE_INPUT_TEMPLATE.md` (Sections A through P)
2. `docs/FINANCE_GO_LIVE_INPUT_TEMPLATE.md` (Sections 1 through 5)
3. `docs/SERVICE_TARIFF_SCHEDULE_TEMPLATE.csv` (Approved prices in QAR)

Upon receipt of authorized submissions, the technical implementation team will immediately ingest the records, open the financial fiscal year, configure named user accounts, and execute the final pre-opening operational validation.
