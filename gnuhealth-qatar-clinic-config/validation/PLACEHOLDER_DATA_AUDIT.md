# Placeholder Data Audit

**Status**: `AUDITED`  
**Classification**: `PENDING_CLINIC_INPUT`  
**Audit Target**: Live GNU Health 5.0 Database (`gnuhealth`)  

---

## 1. Objective

To identify every field and record currently residing in the database that contains placeholder, synthetic, or templated values requiring real operational clinic data before go-live.

---

## 2. Identified Placeholder Records

### A. Clinic Organization & Legal Identity

| Model | Record ID | Field | Current Value | Required Clinic Input |
| :--- | :--- | :--- | :--- | :--- |
| `party.party` | 2 | `name` | `<CLINIC_NAME>` | Official registered clinic trade name in Qatar |
| `party.party` | 2 | `tax_identifier` | `null` | Ministry of Commerce & Industry (MOCI) Commercial Registration (CR) number |
| `gnuhealth.institution` | 2 | `code` | `CLINIC-QA` | Ministry of Public Health (MOPH) facility code / license number |
| `gnuhealth.institution` | 2 | `extra_info` | `Qatar Outpatient Clinic Master Configuration [PENDING_CLINIC_INPUT]` | Official facility description and licensing tier |
| `party.address` | 1 | `street` | `<STREET>, Zone <ZONE>, Building <BUILDING>` | Blue Plate / Qatar National Addressing address (Building, Street, Zone numbers) |
| `party.address` | 1 | `city` | `<CITY>` | Municipality (Doha, Al Rayyan, Al Wakrah, etc.) |

---

## 3. Outstanding Clinical Master Data (Zero Records - Pending Clinic Input)

The following areas contain zero records and require clinic management submissions:

| Category | Model | Current Live Count | Required Master Data |
| :--- | :--- | :--- | :--- |
| **Physicians / Practitioners** | `gnuhealth.healthprofessional` | 0 | Full name, QCHP license ID, medical specialty, consultation room |
| **Consultation Fees & Tariffs** | `product.product`, price lists | 0 custom tariffs | Standard GP consultation fee, Specialist consultation fee, follow-up tariff |
| **Pharmacy Medicines** | `gnuhealth.medicament` | 0 | Qatar National Formulary (QNF) approved drug catalog, strength, unit, brand/generic |
| **Private Insurance Payers** | `party.party`, `gnuhealth.insurance` | 0 | Approved private health insurance companies (e.g., QLM, Alkoot, Daman, Mednet) |
| **Clinic Working Hours** | Operating schedule | 0 | Weekly shift schedule (e.g. Sat–Thu 08:00–22:00, Friday evening) |

---

## 4. Policy on Master Data Population

> [!IMPORTANT]
> In accordance with strict audit governance, placeholder values (`<CLINIC_NAME>`, `<STREET>`, etc.) will remain until official, authorized clinic documentation is submitted. No imaginary names, doctor profiles, or financial figures are permitted to be injected into the live system.
