# Aster in the Gulf (UAE and Qatar): what the demo models, and why

Companion to `ASTER_OPERATIONS_RESEARCH.md` (which covers Aster India). This note covers the Gulf business and records, for every figure in the
`aster` demo tenant, whether it is **published [S]**, **reported [P]**, **inferred [I]** or **a demo choice [D]**.

## 1. The Gulf business
- Aster began in Dubai in 1987 (Al Rafa Poly Clinic, Bur Dubai) [S]. In 2023-24 the Gulf business was separated from the Indian listed company
  and a 65% stake sold to Alpha GCC Holdings, a consortium led by Fajr Capital, for about USD 1.01 billion [P]. It trades under the Aster,
  Medcare (premium) and Access (value clinics) brands [S].
- Scale quoted by Aster: 15 hospitals, about 121-128 clinics and about 306-345 pharmacies across the GCC (figures vary by page and date) [S].
- Countries: UAE, Oman, Qatar, Saudi Arabia, Bahrain (pharmacies also in Kuwait and Jordan) [S].

## 2. The two hospitals in the demo (facts from Aster's own pages)

| | Aster Hospital Al Qusais, Dubai | Aster Hospital Doha |
|---|---|---|
| Beds | **150** (84 standard + 8 deluxe in-patient rooms) | **50** |
| Specialties | **36**, incl. cardiology, orthopaedics, neurosurgery, obstetrics and gynaecology, paediatrics, oncology, gastroenterology, urology, psychiatry, dentistry, ophthalmology | **15**, incl. gynaecology and obstetrics, newborn care, general and minimal-access surgery, orthopaedics, ENT, dental and maxillofacial, gastroenterology, urology, critical care; radiology and laboratory services |
| Critical care | ICU 10 beds, NICU 9 beds | ICU with an isolation unit, NICU |
| Theatres and procedures | 5 operating theatres, cardiac catheterisation lab, 4 labour rooms | 3 operating theatres, labour and recovery suites |
| Other units | 10-bed day care, 4-bed dialysis, 10-bed emergency department (24h), 24h pharmacy, urgent care clinic, physiotherapy | day care unit, single and VIP rooms, 24h emergency department, 24h pharmacy |
| Imaging | (not itemised) | 16-slice CT, 1.5 tesla MRI |
| Staff | 90+ doctors | (not published) |
| Recognition | EIAC accredited; 10th in the UAE in Newsweek's World's Best Hospitals 2026; Statista 4-star | Soft-launched 2017; part of Aster in Qatar since 2003 (five medical centres) |
| Insurance | (not itemised) | Accepts Aetna, Allianz, BUPA, Cigna, Daman, MetLife and about 20 more |
| Hours | 8 am to 10 pm, emergency 24h | 24h emergency |

Sources: asterhospitals.ae (Al Qusais page), aster.qa (about the hospital), Gulf News (opening of the 150-bed Al Ghusais hospital).
Other Aster Gulf hospitals found but **not** modelled: Mankhool (100 beds, 5 ORs), Sharjah, International City, Cedars Jebel Ali (50+ beds),
the Medcare hospitals (Al Safa, Sharjah, Orthopaedics and Spine, Women and Children, Royal Al Qusais 126 beds), and in Oman Aster Royal
Al Raffah (Muscat) and Al Raffah (Sohar), and Aster Sanad (Riyadh) [S].

## 3. How the demo scales and invents

| Item | Demo value | Basis |
|---|---|---|
| Dubai beds | 60 | [D] 40% of the real 150, keeping the real unit mix (ICU, NICU, day care, deluxe) |
| Doha beds | **50** | [S] real size |
| Doha specialties | General medicine, obstetrics and gynaecology, paediatrics, general surgery, orthopaedics, ENT, dental, gastroenterology, urology, emergency, anaesthesia | [S] for the ten Aster lists; general medicine, paediatrics, emergency and anaesthesia are [I] (the fifteen are not all listed) |
| Doha has no cardiology, neurology, oncology or nephrology | | [S] Aster does not list them |
| Operating theatres | Dubai 3 + cath lab, Doha 3 | [D] / [S] |
| Currencies and books | Dubai in AED, Doha in QAR, each its own company and ledger | [D] design |
| Prices | Illustrative price list in AED, Doha at 95% | **[D] invented; Aster's tariffs are not public** |
| Insurers | Daman, Cigna, MetLife, Allianz, BUPA, Aetna, labelled "(demo)" | [S] Aster Doha lists them as accepted; every policy and claim here is synthetic |
| Payor mix, Dubai | insurance 58%, government scheme 12%, self-pay 17%, corporate 8%, medical tourism 3%, other 2% | [D] illustrative: the UAE requires health insurance in Dubai and Abu Dhabi, so insurance dominates; Aster publishes no Gulf mix |
| Payor mix, Doha | insurance 55%, self-pay 22%, scheme 10%, corporate 9%, tourism 2%, other 2% | [D] |
| Patient ID | `784-SYN-nnnnn` (Emirates-ID style), `QID-SYN-nnnnn` (Qatar ID style) | [D] flagged SYN so no real ID can be confused |
| Nationality mix of patients | Dubai: Indian 34%, Arab (Levant, Egypt) 20%, Pakistani 10%, Emirati 10%, Filipino 6%, Western 8%, Bangladeshi 5%, other; Doha similar with Qatari 12% | [D] reflects the expatriate-majority Gulf population; invented names |
| Staff mix | Doctors mostly Indian and Arab, nurses Filipino and Indian | [I] typical Gulf workforce |

## 4. Gulf process points the demo reflects
- **Identity and eligibility.** In the UAE the Emirates ID is the single reference in healthcare; the clinic scans it and checks the insurance
  policy in real time, showing the insurer, policy number, network tier and expiry [P]. The demo registers every patient with an ID in that style
  and records the insurance policy against the patient.
- **Pre-authorisation.** Insurers operating under the Dubai or Abu Dhabi regulators require prior approval for specialist consultations, imaging,
  surgery and some disease programmes; outpatient approvals are due within **6 hours**, inpatient within **24 hours**, and claims are settled
  within **45 days** [P]. IST Health has no native pre-approval or claim tracker, so the demo shows the cashless patient's invoice raised in the
  patient's name and left **posted but unpaid** (receivable from the insurer) while self-pay invoices are paid at the desk. A pre-authorisation
  tracker is a stated gap and an obvious next feature.
- **Admission and discharge.** Same published Aster sequence as India: UHID, financial counsellor and estimate, advance, bed allocation,
  discharge in 2-6 hours, TPA or insurer clearance coordinated by Patient Relations [S]. (The page is from Aster's Indian hospitals; the Gulf
  hospitals follow the same group process, which is [I].)
- **Two currencies in one group.** Each hospital keeps books in its own currency; the group overview shows each in its own currency and does not
  add them together.

## 5. What is not known (do not claim)
Aster's tariffs and package prices, the HIS used in the Gulf, insurer contracts and discounts, doctor pay arrangements, Doha's doctor count
and exact bed mix, Al Qusais's imaging fleet, and any patient or operational volumes for these two hospitals.

## 6. Sources
- https://www.asterhospitals.ae/locations/hospital-detail/aster-hospital-al-qusais
- https://www.aster.qa/about-us/about-aster-hospital
- https://www.asterdmhealthcare.com/about-us/gcc-network and /our-journey
- https://gulfnews.com/amp/story/uae%2Fhealth%2Faster-opens-150-bed-hospital-in-al-ghusais-1.61704928
- Business Standard (sale of the Gulf business) and Zawya (Newsweek recognition, December 2025)
- UAE insurance verification and pre-authorisation timelines: shory.com, insurancehub.ae, u.ae health insurance pages
