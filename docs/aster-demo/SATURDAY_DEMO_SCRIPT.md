# Saturday demo script: Aster Group (Gulf) on IST Health

Sign in at https://isthealth.irisstar.tech/login with hospital code `aster`. Logins are in `docs/aster-demo/private/DEMO_LOGINS.md` (not in git).
All patients, staff, insurers and prices are synthetic. Say so up front.

## Opening (2 min): one customer, two hospitals
Aster Group is one customer in IST Health with two hospitals: Aster Hospital Al Qusais, Dubai (AED) and Aster Hospital Doha (QAR). Each has its own beds, theatres, staff, worklists and books. Patients are shared across the group.

## Flow (about 25 min)
1. **Group view** (`aster_group_ceo`): open *Group Overview*. Both hospitals side by side, each in its own currency (never added together). Use the hospital switcher in the header to jump into Dubai, then Doha.
2. **Front desk, Dubai** (`dxb_fd01`): register or find a patient with an Emirates-ID-style number (`784-SYN-...`), check the insurance policy, book an appointment.
3. **Triage** (`dxb_rn01`): record vitals (BP, HR, SpO2, temp, RR).
4. **Physician** (`dxb_dr01`): consultation, SOAP note, prescription, lab and imaging orders.
5. **Lab and radiology** (`dxb_lb01`, `dxb_rd01`): result and sign the orders just placed.
6. **Pharmacy** (`dxb_cs01`): dispense the prescription.
7. **Billing** (`dxb_cs01`): insurer patient invoice stays posted (receivable from the insurer); self-pay is paid at the desk.
8. **Inpatient**: bed census by ward (ICU, NICU, maternity, private), admission and discharge; surgery schedule (3 theatres + cath lab).
9. **Doha** (`doh_dr01`, `doh_fd01`): same flow; point out Doha has the real 50-bed, 15-specialty profile (no cardiology or oncology, as Aster Doha lists).
10. **Accounts** (`dxb_ac01`): books in AED; then `doh_ac01` in QAR.

## Say plainly if asked
- Pre-authorisation and insurer claim tracking are **not** native yet; the demo shows the unpaid invoice as the receivable. It is the obvious next feature.
- Prices, payor mix, headcounts are illustrative; Aster publishes none of them (see `ASTER_GULF_RESEARCH.md`).
- Lab and pharmacy lists show the latest 50 items. History is stamped today, so there are no trend charts.

## Rehearsal checklist (Friday)
- [ ] Log in as each persona above once in a normal browser; confirm landing pages.
- [ ] Walk steps 1-10 end to end on the live site and note anything slow.
- [ ] Freeze changes Friday evening.
