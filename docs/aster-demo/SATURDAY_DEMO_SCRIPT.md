# Saturday demo script: Aster Group (Gulf) on IST Health

Sign in at https://isthealth.irisstar.tech/login with hospital code `aster`. Logins are in `docs/aster-demo/private/DEMO_LOGINS.md` (not in git).
All patients, staff, insurers and prices are synthetic. Say so up front.

## Opening (2 min): one customer, two hospitals
Aster Group is one customer in IST Health with two hospitals: Aster Hospital Al Qusais, Dubai (AED) and Aster Hospital Doha (QAR). Each has its own beds, theatres, staff, worklists and books. Patients are shared across the group, so a patient's full history follows them between hospitals.

## Flow (about 30 min)
1. **Group view** (`aster_group_ceo`): *Group Overview* shows both hospitals side by side, each in its own currency. Use the hospital switcher in the header to enter Dubai, then Doha. *Management Report* gives beds, revenue and collections, outpatient load, claims ageing, emergency, discharge speed, stock and maternity.
2. **Front desk, Dubai** (`dxb_fd01`): find or register a patient (national ID: Emirates ID or Qatar ID), check the insurance policy, book an appointment.
3. **Triage and consultation** (`dxb_rn01`, `dxb_dr01`): vitals, SOAP note, prescription, lab and imaging orders.
4. **Pre-authorization** (`dxb_fd01` or `dxb_cs01`, *Pre-auth & Claims*): ask the insurer to approve a scan or procedure. The insurer's answer clock runs (6 h outpatient, 24 h inpatient). Record the approval with the insurer's approval number.
5. **Emergency department** (`dxb_fd01` register, `dxb_rn01` triage, `dxb_dr01` treat): register an arrival, triage on the 1-5 scale, see the target-time clock, start treatment, then admit.
6. **Admission planning** (`dxb_cs01`): cost estimate, receive the advance (or link the pre-authorization for a cashless stay), clear for admission, admit to a free bed.
7. **Theatre** (`dxb_dr01`, *Theatre Safety Checklist*): the WHO sign-in and time-out must be done before the surgery can start; try starting one without it to show it is refused.
8. **Maternity** (`dxb_dr01`, *Deliveries & Newborns*): record a delivery, register the newborn as a patient linked to the mother, flag NICU.
9. **Pharmacy** (`dxb_cs01`, *Pharmacy Stock*): dispense; stock falls, earliest expiry first. Low-stock and expiring batches are flagged.
10. **Discharge** (`dxb_dr01` orders; `dxb_rn01`, `dxb_cs01`, `dxb_ac01`, `dxb_fd01` sign off): five departments clear. Try discharging early on *Inpatient Care* to show it is refused until all are done.
11. **Billing and claims** (`dxb_cs01`): the insurer's invoice stays unpaid; submit the claim, record an insurer query, approval, then payment. A full payment settles the invoice in the ledger.
12. **Referral** (`dxb_dr01`, then `doh_fd01`): refer a patient from Dubai to Doha; Doha accepts and confirms arrival.
13. **Doha** (`doh_dr01`, `doh_fd01`): same system, QAR books, its own 50-bed, 15-specialty profile.

## Say plainly if asked
- Prices, payor mix and headcounts are illustrative; Aster publishes none of them (see `ASTER_GULF_RESEARCH.md`). Hospital sizes and specialties follow Aster's own pages.
- Not built: critical-result alerts on lab values, stock reordering to suppliers, and the wider Aster operations (HR, procurement, clinics, pharmacies).
- Data is dated today, so there are no trend charts.

## Rehearsal checklist (Friday)
- [ ] Sign in as each persona once in a normal browser; confirm landing pages.
- [ ] Walk steps 1-13 on the live site and note anything slow.
- [ ] Freeze changes Friday evening.
