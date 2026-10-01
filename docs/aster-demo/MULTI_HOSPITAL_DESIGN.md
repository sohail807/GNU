# Aster as one customer with several hospitals: feasibility and design

Step 2 of the Aster demo plan. Evidence comes from a read-only probe of a hospital database on the live server and a search of the app code,
both on 1 October 2026. Nothing was changed.

## 1. Question
Can IST Health model **one customer (Aster) that owns several hospitals**, so that group leaders see all of them, hospital staff see only
their own, and a patient has one record across the group?

## 2. Answer: yes, and the database already supports most of it

| Need | What GNU Health / Tryton already provides | Evidence |
|---|---|---|
| Several hospitals in one database | `gnuhealth.institution` can hold many records. **32 clinical models carry an `institution` field**: appointments, inpatient registrations, wards, beds, operating rooms, surgery, evaluations, health professionals, vaccinations, pregnancy records, health services and more. | probe output |
| One patient across hospitals | `gnuhealth.patient` has **no** institution or company field: patients are global. | probe output |
| Separate books per hospital | Accounting is **company-scoped** with record rules (`company in user.companies`): accounts, fiscal years, periods, moves, sequences. One company per hospital gives each its own chart, fiscal year and invoice numbers. | 23 record rules mention company |
| Users limited to some hospitals | `res.user` has `companies` (allowed set) and `company` (current). | probe output |

## 3. What does not come for free

1. **No database rule limits clinical data to a hospital.** Of 26 models with record rules, none restrict by institution. A hospital user
   could read another hospital's wards, appointments or admissions unless the **app** filters. (Accounting data is protected by company rules.)
2. **Lab orders and prescriptions have no institution field** (nor company). They must be scoped through the patient's evaluation or
   appointment, or shown group-wide.
3. **The app assumes one hospital per tenant:**
   - `session.companyId` is set once at login from the tenant registry and passed to Tryton in **31 files**. This is also the good news:
     switching hospital means changing one value in the session.
   - The Facilities screen takes "the first institution it finds" (`facilities/route.ts`).
   - Ten routes list hospital-scoped data with no institution filter: appointments, inpatient, surgery, staff, facilities, pharmacy,
     radiology, billing, admin/users, login.
4. **Hospital set-up is per company.** `bootstrap_tenant.py` creates one institution and one chart of accounts; for Aster it must do that
   **per hospital** (institution, company, chart, fiscal year, invoice sequences, payment method).
5. **There is no group view yet.** Aggregates across hospitals (occupancy, average stay, revenue per bed, payor mix) are new work.

## 4. Proposed design

**Model.** Tenant `aster` = one database. Each hospital = one **company** (legal entity, own books) + one **institution** (clinical site).
Patients are shared. Staff belong to one or more hospitals.

```
Aster tenant (one database)
 |-- shared: patients, doctors directory, catalogues (medicines, tests, ICD-10)
 |-- Hospital 1: company + institution + wards/beds/OTs + books   (Medcity)
 |-- Hospital 2: company + institution + wards/beds/OTs + books   (CMI)
 `-- Hospital 3: company + institution + wards/beds/OTs + books   (Prime)
```

**Registry.** The tenant entry gains an optional `hospitals` list (id, name, company id, institution id). Tenants without it behave exactly as
today, so IST Central is unaffected.

**Session.** Adds `institutionId` and the allowed hospital list. After sign-in, a user with one hospital goes straight in; a user with
several picks one, and can **switch hospital** from the header (a new endpoint re-issues the session after checking the user is allowed).

**Access levels**
| Level | Sees |
|---|---|
| Hospital staff (front desk, nurse, doctor, lab, cashier...) | Their hospital only |
| Hospital administrator | Their hospital: users, wards, beds, prices |
| Cluster head / group executive | Several or all hospitals, with a hospital switcher and group dashboard |

**Filtering (the app work).** Add the active institution to every list in the ten routes above, and set the institution on every record
created. Where a model has no institution (lab, prescriptions) filter through its evaluation or appointment. As defence in depth, add
database record rules for institution on the main clinical models once the app side works.

**Group dashboard (new).** One endpoint that, for a group user, loops over their hospitals and returns beds, occupancy, admissions,
average stay, outpatient visits, revenue and payor mix, shown by hospital and by cluster.

**Demo data.** The existing generators are reused. They are pointed at one hospital at a time by signing in as that hospital's staff, so
every record is stamped with the right institution and company. History (decision 4) needs a direct-write loader and is a separate step.

## 5. Build slices (each is testable on its own)

| Slice | Content | Risk |
|---|---|---|
| 1 | Registry `hospitals`; session hospital context; hospital switcher; backward compatible | Medium: touches sign-in used by IST Central |
| 2 | Institution filtering and stamping in the ten routes; Facilities fixes | Medium: many files, mechanical |
| 3 | Multi-hospital bootstrap (company, institution and books per hospital); create the `aster` tenant with three hospitals | Low |
| 4 | Staff and activity for the three hospitals through the API | Low (done once already for one hospital) |
| 5 | Group dashboard and hospital roles | Medium |
| 6 | Institution record rules in the database; isolation tests; history loader | Medium |

**Acceptance for slice 1-2:** a Medcity nurse cannot see CMI wards, beds, admissions or appointments through any screen or API call;
IST Central works unchanged; a group user can switch hospitals and sees each hospital's own data.

## 6. Risks
- Sign-in and session changes affect the live IST Central site: slice 1 must be backward compatible and tested against the live tenant first.
- Mixing hospitals in one database makes isolation an application and rule responsibility; slice 6 and an isolation test suite are not optional.
- Lab and prescription worklists have no institution field, which makes filtering there less direct.
- Per-hospital accounting means group financial consolidation is a later, separate piece of work.

## 7. Decision needed
Go ahead with slice 1 (hospital context in the session) on the live app, backward compatible, or review this design first?
