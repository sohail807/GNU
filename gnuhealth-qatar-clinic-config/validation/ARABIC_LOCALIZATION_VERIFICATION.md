# Arabic Localization & RTL Verification

**Audit Date**: 2026-09-21  
**Database**: `gnuhealth`  
**Status**: `PARTIALLY_VERIFIED`  

---

## 1. Objective

To audit the language model configuration and Right-to-Left (RTL) localization readiness within GNU Health 5.0 and Tryton 7.0 for the State of Qatar.

---

## 2. Active Language Configuration

Inspection of `ir.lang` via Tryton JSON-RPC yielded the following active language records:

| Language Name | Code (`code`) | Record ID | Translatable | Text Direction (`direction`) | Verification Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **English** | `en` | 1 | `true` | `ltr` (Left-to-Right) | `VERIFIED` |
| **Arabic** | `ar` | 26 | `true` | `rtl` (Right-to-Left) | `VERIFIED` |

---

## 3. Localization Scope & Audit Breakdown

### A. Tryton Backend Language Model (`VERIFIED`)
- Both English (`en`) and Arabic (`ar`) are activated and marked as translatable in `ir.lang`.
- Arabic direction is strictly set to `rtl`.
- Arabic locale PO files exist within installed GNU Health packages (`locale/ar.po`).

### B. Tryton SAO Web Client Interface (`PARTIALLY_VERIFIED`)
- Users can switch their session language to Arabic via user preferences.
- SAO dynamically inverts layout orientations to RTL when Arabic is selected.
- Core GNU Health terms are translated; however, several outpatient medical labels default to English due to incomplete upstream coverage in specific Tryton modules.

### C. Bilingual Forms & Medical Documents (`PENDING_CLINIC_INPUT`)
- In Qatar private healthcare, patient-facing documents (Prescriptions, Encounter Summaries, Invoices, Sick Leave Certificates) are standardly issued in bilingual (Arabic / English) format.
- Native GNU Health report definitions currently render primarily in the session's active language.
- Clinic management must approve the exact bilingual formatting and layout before custom report templates are designed.

---

## 4. Summary & Readiness Assessment

| Localization Component | Current Status | Action Required |
| :--- | :--- | :--- |
| Language Model Activation (`ar`) | `VERIFIED` | None |
| RTL Text Direction Flag | `VERIFIED` | None |
| SAO Client RTL Switching | `VERIFIED` | Operational user training |
| Upstream Arabic Terminology | `PARTIALLY_VERIFIED` | Ongoing PO translation updates |
| Bilingual Patient Deliverables | `PENDING_CLINIC_INPUT` | Design clinic-approved bilingual printouts |
