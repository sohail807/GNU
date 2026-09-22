# 04 — Qatar Localization & Base System Configuration

**Document:** `04_QATAR_CONFIGURATION.md`  
**Scope:** System-wide Qatar localization parameters  
**Status:** `CONFIGURED` / `VERIFIED`

---

## 1. Qatar Geopolitical & Currency Configuration

| Parameter | Configuration Setting | Model | System ID | Status |
| :--- | :--- | :--- | :---: | :---: |
| **Country Name** | Qatar | `country.country` | 1 | `VERIFIED` |
| **Country ISO2** | `QA` | `country.country` | 1 | `VERIFIED` |
| **Country ISO3** | `QAT` | `country.country` | 1 | `VERIFIED` |
| **Numeric Code** | `634` | `country.country` | 1 | `VERIFIED` |
| **Telephone Prefix** | `+974` | Address / Contact mechanisms | — | `VERIFIED` |
| **Base Currency** | Qatari Riyal (`QAR`) | `currency.currency` | 3 | `VERIFIED` |
| **Currency Symbol** | `ر.ق` (Arabic Riyal) | `currency.currency` | 3 | `VERIFIED` |
| **Decimal Precision** | 2 Decimal Places (`digits = 2`) | `currency.currency` | 3 | `VERIFIED` |
| **Rounding Factor** | `0.01` | `currency.currency` | 3 | `VERIFIED` |
| **Default Exchange Rate**| `1.0000` | `currency.currency.rate` | 2 | `VERIFIED` |

---

## 2. Federation & National Identity Integration

| Parameter | Configuration Setting | Model | Status |
| :--- | :--- | :--- | :---: |
| **Federation Account Country**| Qatar (ID: 1, Code: `QAT`) | `gnuhealth.federation.country.config` | `VERIFIED` |
| **Default Citizenship Rule** | Enabled (`use_citizenship = true`) | `gnuhealth.federation.country.config` | `VERIFIED` |
| **National Patient Prefix** | `QAT` + Generated Alphanumeric PUID | `party.party` | `VERIFIED` |
| **Patient MRN Sequence** | `PAC` (Sequential 3-digit padding) | `ir.sequence` | `VERIFIED` |

---

## 3. Supported Patient Population Nationalities (Preloaded)

To accommodate Qatar's multinational demographic, 15 country codes are active:
- **GCC**: Qatar (`QA`), UAE (`AE`), Saudi Arabia (`SA`), Kuwait (`KW`), Oman (`OM`), Bahrain (`BH`)
- **MENA**: Egypt (`EG`), Jordan (`JO`), Lebanon (`LB`), Sudan (`SD`)
- **Expatriate Workforce**: India (`IN`), Pakistan (`PK`), Philippines (`PH`), United Kingdom (`GB`), United States (`US`)

---

## 4. Languages & Timezone

| Parameter | Configuration Setting | Model | Status |
| :--- | :--- | :--- | :---: |
| **Primary Language** | English (`en`, LTR) | `ir.lang` (ID: 1) | `VERIFIED` |
| **Secondary Language** | Arabic (`ar`, RTL) | `ir.lang` (ID: 26) | `CONFIGURED` / `PENDING_TRANSLATION_REVIEW` |
| **System Timezone** | `Asia/Qatar` (UTC+3) | `company.company` (ID: 2) | `VERIFIED` |
| **Clinical Timestamps** | Qatar Standard Time (AST) | Appointments, Triage, Orders | `VERIFIED` |
