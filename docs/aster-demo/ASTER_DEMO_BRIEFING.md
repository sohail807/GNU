# Aster demo on IST Health: briefing for decision

**Purpose of this note:** give you one clear picture of (1) what Aster is, (2) what we would build in IST Health, (3) the choices that
change the work, and (4) what we recommend. It is written in business terms. The detailed research is in
`ASTER_OPERATIONS_RESEARCH.md`; this note is the short version.

**Date:** 1 October 2026. **Status:** research finished; build paused until the decisions in section 4 are made.

---

## 1. In one paragraph

Aster is a large Indian hospital group (merged in 2025-26 with Quality Care India into **Aster DM Quality Care**: 39 hospitals,
10,600+ beds, 7,400+ doctors). We have studied it from its own public filings and websites and written down how it is organised, which
services it offers, and how a patient moves through it (outpatient visit, emergency, admission and discharge, surgery, lab and
imaging, pharmacy, billing and insurance, international patients). The next step is to recreate a believable, **fully synthetic**
version of that in IST Health, so we can show how IST Health would run a hospital group like Aster.

## 2. What we found about Aster (the facts that shape the demo)

| Topic | What the public data says |
|---|---|
| Shape of the group | One company, many hospitals in **three regional clusters**: Kerala (6 hospitals, 2,501 beds), Karnataka and Maharashtra (5 hospitals, 1,446 beds), Andhra Pradesh and Telangana (7 hospitals, 1,047 beds). Plus 13 clinics, 232 labs and 212 pharmacies. (The clusters add up to 18 hospitals; Aster's total of 19 counts one more asset-light hospital separately.) |
| Scale (Sep 2024) | 19 hospitals, 4,994 beds, about 770 admissions and 9,300 outpatient visits **a day** across the group. |
| How busy | 69% of beds occupied; average stay 3.2 days; about INR 43,600 revenue per occupied bed per day (varies by region from 29,100 to 58,600). |
| Who pays | 58% self-pay, 30% insurance, 4% international patients, 3% central-government schemes, 2% corporate, 2% state schemes. |
| What they treat | Heart 14%, brain and nerves 11%, cancer 10%, liver and digestive 8%, bones 7%, kidney and urology 7%, women's health 6%, children 6%, general medicine and surgery 18%. |
| How a patient flows | Registration with a unique hospital ID, tariff estimate by a financial counsellor, insurance pre-approval for cashless patients, bed allocation, discharge in 2-6 hours. Aster publishes these steps. |
| Digital | Patient apps (OneAster, Aster Health, Aster Labs app), home lab collection, video consultations. |

**What is not public** (so the demo must not claim it): Aster's real prices, its hospital software, how doctors are paid, and its insurer
contracts. The demo will use invented prices and clearly say so.

## 3. What "the demo" would be

A new IST Health customer called Aster, populated with **made-up** people and activity that follow Aster's real proportions
(bed counts, occupancy, stay length, payor and specialty mix). Nobody in it is real: no real patients, no real doctors, no real prices.

A viewer should be able to sign in as different people (front desk, nurse, doctor, lab, radiology, cashier, accountant, hospital
administrator, and ideally group leadership) and walk the ten scripted patient stories from the research, for example:
a chest-pain emergency that ends in a cashless insurance discharge, a planned robotic knee replacement, a delivery, a monthly cancer-treatment
patient on a government scheme, and an international patient.

## 4. Decisions needed from you

These are the choices that change the amount of work. A recommended answer is given for each.

| # | Decision | Options | Recommendation |
|---|---|---|---|
| **1** | **Who is the audience?** | Showcase for Aster / internal proof of concept / start of a real pilot | Showcase for Aster (sets the quality bar) |
| **2** | **How is Aster set up in IST Health?** | **(A)** Each hospital is a separate customer. **(B)** Aster is one customer that contains several hospitals. | **(B).** Aster is one group; its leaders will want to see all hospitals together. (A) is what exists today and cannot show a group view. |
| **3** | **How much of Aster?** | One hospital / one per region (3) / all 19 / the whole merged group | Three hospitals, one per region (Medcity in Kerala, CMI in Bangalore, Prime in Hyderabad) |
| **4** | **Months of history?** | Today only / about 3 months / a year | About 3 months, so charts show trends. Needs extra work (see below). |
| **5** | **Who logs in?** | Front-line roles only / plus hospital administrators / plus regional and group leaders | All three levels, so a group view can be shown |
| **6** | **Use Aster's real hospital names?** | Real names / invented names | Real names, **if** you are comfortable; confirm with Aster or legal before showing outside the company |
| **7** | **Size of the data** | Full real size / one-tenth size | One-tenth size (about 150 beds across the three hospitals); realistic proportions, fast and cheap to run |
| **8** | **Deadline and who sees it first** | - | Needed to decide how much polish is realistic |

### What choice 2 means in practice
- **(A) one customer per hospital** is what we have now. It is simple and keeps each hospital's data fully apart, but there is no way to see
  patients, doctors or revenue across hospitals, and a patient seen at two hospitals is two different people.
- **(B) one Aster customer with hospitals inside** matches how Aster really works (one patient app, one group). It needs **real changes to
  IST Health**: each user belongs to one or more hospitals and chooses one when signing in; wards, beds and appointments are filtered by
  hospital; group roles see everything while hospital roles see only theirs; and a few group reports are added.
  We would first check how much of this the underlying GNU Health system already supports.

### What choice 4 means in practice
IST Health stamps every record with the moment it is created. To show 3 months of history we need a different loading method that writes
the data directly with past dates. It is more work but makes the demo look like a hospital that has been running for months.

## 5. Recommended plan (if the recommendations above are accepted)

| Step | What happens | Rough effort* |
|---|---|---|
| 1 | Confirm decisions 1-8 | 1 meeting |
| 2 | Check how GNU Health handles several hospitals in one customer; write a short design | 1-2 days |
| 3 | Build the multi-hospital support in IST Health (hospital picker, filtering, roles) | 1-2 weeks |
| 4 | Create the Aster customer with three hospitals and their wards, beds, staff and prices | 1-2 days |
| 5 | Generate and load synthetic activity with history | 3-5 days |
| 6 | Add group and cluster views (occupancy, stay length, revenue per bed, payor mix) | 3-5 days |
| 7 | Test the ten scripted stories end to end; fix; hand over | 3-5 days |

\*Rough estimates from what we have learned so far, not commitments. Step 3 is the biggest unknown until step 2 is done.

## 6. Where things stand today

**Done**
- Research report on Aster's structure, services and process flows, with every fact marked as published, reported, assumed, or our own choice.
- Data tables (hospitals, specialties, payors, wards and beds, key numbers) and ten scripted patient stories.
- A working method to create synthetic staff and activity, proven on a small test hospital (Prime Hyderabad: 20 beds, passed all 18 checks).
- A fix to IST Health's hospital set-up: **a newly created hospital was unusable for billing and wards** until we added the missing
  accounting set-up and access rules. This is now corrected (the provisioning change was deployed to the live server on 1 October).

**Paused, awaiting your decisions**
- The three one-hospital-per-customer demo tenants (Medcity, CMI, Prime). Prime is complete; Medcity and CMI are partly loaded.
  If you choose option (B) these would be removed or kept only as a small side demo.

**Not done**
- Group view, history, multi-hospital support, and the Platform-screen change that automates hospital set-up (written and tested locally, not yet deployed).

## 7. Risks and things to be careful about
- **Realism vs honesty:** the demo is synthetic. Anything shown as a price, doctor or hospital process that Aster never published must be labelled illustrative.
- **Brand use:** using Aster's name needs approval before any outside showing.
- **Scope growth:** "the entire group" could mean millions of records. One-tenth scale and three hospitals keeps it manageable.
- **Shared server:** the demo lives on the same server as live IST Central. It is isolated, but we should avoid heavy loading during working hours.
- **Multi-hospital support is the main technical risk;** step 2 exists to size it before we commit.

## 8. What we need from you
Your answers to decisions 1-8 above (or "go with your recommendations"). Once we have them we can start step 2 immediately.
