# QAR Currency Verification

**Verification Date**: 2026-09-21  
**Target Database**: `gnuhealth`  
**Status**: `VERIFIED`  

---

## 1. Objective

To independently inspect and verify that the national currency of the State of Qatar (Qatari Riyal / QAR) is accurately defined in Tryton's currency model and established as the operating currency for the clinic company.

---

## 2. Currency Definition Verification

Inspection of `currency.currency` (Record ID: 3) via Tryton JSON-RPC yielded:

```json
{
  "id": 3,
  "code": "QAR",
  "name": "Qatari Riyal",
  "symbol": "ر.ق",
  "digits": 2,
  "rounding": {
    "__class__": "Decimal",
    "decimal": "0.01"
  },
  "rates": [2]
}
```

### Attribute Verification Checklist
- [x] **ISO 4217 Currency Code**: `QAR` — Verified.
- [x] **Display Name**: `Qatari Riyal` — Verified.
- [x] **Official Currency Symbol**: `ر.ق` (Arabic Riyal Qatari) — Verified.
- [x] **Decimal Precision (`digits`)**: `2` (Dirham subdivision: 1 QAR = 100 Dirhams) — Verified.
- [x] **Rounding Factor (`rounding`)**: `0.01` with native Python `Decimal` serialization — Verified.

---

## 3. Exchange Rate Verification

Inspection of `currency.currency.rate` (Record ID: 2) yielded:

```json
{
  "id": 2,
  "currency": 3,
  "date": {
    "__class__": "date",
    "year": 2026,
    "month": 9,
    "day": 21
  },
  "rate": {
    "__class__": "Decimal",
    "decimal": "1.0000"
  }
}
```

- [x] **Effective Rate**: `1.0000` (Base operating currency rate) — Verified.
- [x] **Effective Date**: `2026-09-21` — Verified.

---

## 4. Company Currency Linkage

Inspection of `company.company` (Record ID: 2) confirmed:

```json
{
  "id": 2,
  "party": 2,
  "currency": 3,
  "timezone": "Asia/Qatar"
}
```

- [x] **Operating Company**: ID 2 (`<CLINIC_NAME>`)
- [x] **Base Financial Currency**: Currency ID 3 (`QAR`)
- [x] **All Ledgers & Balances**: Formatted and calculated in QAR with 2 decimal digits.
