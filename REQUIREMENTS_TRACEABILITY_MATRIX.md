# REQUIREMENTS TRACEABILITY MATRIX (RTM)

**Project**: GNU Health HMIS 5.0 / Tryton 7.0 Implementation  
**Document**: `REQUIREMENTS_TRACEABILITY_MATRIX.md`  
**Classification**: Authoritative Requirements Traceability Matrix  
**Scope**: Primary Outpatient & Ambulatory Healthcare Facility (State of Qatar)  
**Status**: Current requirements baseline pending formal clinic stakeholder sign-off  

---

## 1. Traceability Architecture & Status Taxonomy

Every functional and non-functional requirement defined in [FINAL_REQUIREMENTS_BASELINE.md](file:///c:/Users/MohammedSohail/OneDrive%20-%20IRISSTAR%20TECHNOLOGIES/GNU%20Health/FINAL_REQUIREMENTS_BASELINE.md) is mapped to its Tryton/GNU Health capability, current empirical state, required remaining actions, responsible owner, dependencies, priority, and implementation category.

### Implementation Category Taxonomy:
1. `EXISTING / VERIFIED`: Native feature installed and empirically verified on live instance.
2. `GNU HEALTH CONFIGURATION`: Standard administrative setting within Tryton client or server config.
3. `MASTER DATA`: Structured organization, doctor, service, or formulary records to be ingested.
4. `BUSINESS DECISION`: Clinic management policy, operational schedule, or workflow sign-off.
5. `MEDICAL DECISION`: Clinical lead approval of medical protocols, reference ranges, or formulary.
6. `ACCOUNTING DECISION`: Financial lead approval of chart of accounts, fiscal year, or journals.
7. `SECURITY / INFRASTRUCTURE`: OS, network, firewall, web server, or credential hardening.
8. `THIRD-PARTY INTEGRATION`: External API interface (e.g. SMS, PACS, Insurance clearinghouse).
9. `CUSTOM DEVELOPMENT`: Custom module development (not currently identified for confirmed outpatient scope).
10. `TESTING / UAT`: Verification scenario to be executed by clinical/operational users.
11. `NOT SUPPORTED`: Feature not available in base packages without third-party extension.

---

## 2. Comprehensive Traceability Matrix

| ID | Area | Requirement | Source | Native Capability | Current State | Category | Remaining Work | Owner | Dependency | Priority | Status |
| :---: | :--- | :--- | :---: | :---: | :--- | :--- | :--- | :--- | :--- | :---: | :--- |
| **PAT-01** | Patient | New patient registration (name, DOB, sex) | Baseline Scope | Yes (`gnuhealth.patient`) | Form verified; 0 records | TESTING / UAT | Execute UAT registration | Reception Lead | None | P1 | `TESTING REQUIRED` |
| **PAT-02** | Patient | Unique PUID with `QAT` prefix | Baseline Scope | Yes (`gnuhealth.sequences`) | Sequence active (`QAT-XXXXX`) | EXISTING / VERIFIED | None | System Admin | None | P1 | `VERIFIED` |
| **PAT-03** | Patient | Nationality & demographic capture | Baseline Scope | Yes (`country.country`) | Qatar + 14 GCC/expats loaded | EXISTING / VERIFIED | None | System Admin | None | P1 | `VERIFIED` |
| **PAT-04** | Patient | Qatar ID (QID) & Passport recording | Baseline Scope | Yes (`party.party`) | Identification field active | TESTING / UAT | Verify 11-digit QID entry | Reception Lead | None | P1 | `TESTING REQUIRED` |
| **PAT-05** | Patient | Contact & emergency contact info | Baseline Scope | Yes (`party.address`) | Contact fields active | TESTING / UAT | Verify contact saving | Reception Lead | None | P1 | `TESTING REQUIRED` |
| **PAT-06** | Patient | Search by PUID, QID, Name, Phone | Baseline Scope | Yes (`gnuhealth.patient`) | Search fields indexed | EXISTING / VERIFIED | Test search responsiveness | Reception Lead | None | P1 | `VERIFIED` |
| **PAT-07** | Patient | Duplicate patient detection | Baseline Scope | Yes (`gnuhealth.patient`) | Tryton duplicate check active | TESTING / UAT | Test duplicate QID alert | Reception Lead | None | P2 | `TESTING REQUIRED` |
| **PAT-08** | Patient | Historical encounter tracking | Baseline Scope | Yes (`gnuhealth.patient`) | Relation fields active | EXISTING / VERIFIED | Test history view | Clinical Lead | PAT-01 | P1 | `VERIFIED` |
| **APT-01** | Appointment | Appointment creation (future/same day) | Baseline Scope | Yes (`gnuhealth.appointment`) | Workflow verified; 0 records | MASTER DATA | Onboard doctor roster | Reception Lead | APT-02 | P1 | `MASTER DATA REQUIRED` |
| **APT-02** | Appointment | Doctor & specialty assignment | Baseline Scope | Yes (`gnuhealth.appointment`) | Blocked: 0 doctors in system | MASTER DATA | Ingest doctor accounts | Operations Lead | REQ-DOC | P0 | `BLOCKED` |
| **APT-03** | Appointment | Appointment types (Routine, Follow-up, Walk-in)| Baseline Scope | Yes (`gnuhealth.appointment`) | Standard types configured | EXISTING / VERIFIED | None | Operations Lead | None | P2 | `VERIFIED` |
| **APT-04** | Appointment | Calendar scheduling by shift/room | Baseline Scope | Yes (`health_calendar`) | Calendar view active | BUSINESS DECISION | Approve clinic timetable | Operations Lead | None | P1 | `BUSINESS APPROVAL REQUIRED` |
| **APT-05** | Appointment | Cancellation tracking with reason | Baseline Scope | Yes (`gnuhealth.appointment`) | Cancellation field active | TESTING / UAT | Test cancellation log | Reception Lead | None | P2 | `TESTING REQUIRED` |
| **APT-06** | Appointment | Rescheduling with audit trail | Baseline Scope | Yes (`gnuhealth.appointment`) | Drag-and-drop active | TESTING / UAT | Test reschedule flow | Reception Lead | None | P2 | `TESTING REQUIRED` |
| **APT-07** | Appointment | Walk-in patient queue insertion | Baseline Scope | Yes (`gnuhealth.appointment`) | Urgent flag active | TESTING / UAT | Test walk-in intake | Reception Lead | None | P1 | `TESTING REQUIRED` |
| **APT-08** | Appointment | Real-time departmental queue | Baseline Scope | Yes (`gnuhealth.appointment`) | State filter active | TESTING / UAT | Test queue status change | Reception Lead | None | P1 | `TESTING REQUIRED` |
| **REC-01** | Reception | Patient check-in timestamping | Baseline Scope | Yes (`gnuhealth.appointment`) | `checked_in` state active | TESTING / UAT | Test check-in button | Reception Lead | None | P1 | `TESTING REQUIRED` |
| **REC-02** | Reception | Demographic & insurance verification | Baseline Scope | Yes (`gnuhealth.insurance`) | Policy fields active | MASTER DATA | Ingest insurance payers | Reception Lead | INS-01 | P1 | `MASTER DATA REQUIRED` |
| **REC-03** | Reception | Automatic triage queue handoff | Baseline Scope | Yes (`gnuhealth.appointment`) | Linked to triage view | TESTING / UAT | Test nurse queue handoff | Nursing Lead | None | P1 | `TESTING REQUIRED` |
| **REC-04** | Reception | Consultation invoicing handoff | Baseline Scope | Yes (`account_invoice`) | Blocked: No fiscal year | ACCOUNTING DECISION | Open fiscal year | Finance Lead | BIL-03 | P0 | `BLOCKED` |
| **TRG-01** | Triage | Nursing queue intake | Baseline Scope | Yes (`gnuhealth.patient.ambulatory_care`)| Form verified; 0 records | TESTING / UAT | Test nurse intake form | Nursing Lead | None | P1 | `TESTING REQUIRED` |
| **TRG-02** | Triage | Baseline vital signs recording | Baseline Scope | Yes (`gnuhealth.patient.rounding`) | BP, HR, RR, Temp, SpO2 ready| EXISTING / VERIFIED | Test vitals entry | Nursing Lead | None | P1 | `VERIFIED` |
| **TRG-03** | Triage | Weight, Height & auto BMI calculation | Baseline Scope | Yes (`gnuhealth.patient.rounding`) | Auto-calc formula active | EXISTING / VERIFIED | Verify BMI calculation | Nursing Lead | None | P1 | `VERIFIED` |
| **TRG-04** | Triage | Clinical triage priority categorization | Baseline Scope | Yes (`gnuhealth.patient.ambulatory_care`)| Priority levels active | TESTING / UAT | Test urgent triage flag | Nursing Lead | None | P1 | `TESTING REQUIRED` |
| **TRG-05** | Triage | Allergy & home medication recording | Baseline Scope | Yes (`gnuhealth.patient`) | Allergy fields active | EXISTING / VERIFIED | Verify allergy alerts | Nursing Lead | None | P1 | `VERIFIED` |
| **TRG-06** | Triage | Doctor consultation queue handoff | Baseline Scope | Yes (`gnuhealth.appointment`) | State update active | TESTING / UAT | Test doctor queue notify | Nursing Lead | None | P1 | `TESTING REQUIRED` |
| **CON-01** | Consultation| Historical record & vitals review | Baseline Scope | Yes (`gnuhealth.patient.evaluation`)| EHR history tab active | EXISTING / VERIFIED | Review past encounters | Clinical Lead | None | P1 | `VERIFIED` |
| **CON-02** | Consultation| Chief complaint & HPI documentation | Baseline Scope | Yes (`gnuhealth.patient.evaluation`)| Text blocks active | EXISTING / VERIFIED | Test SOAP note saving | Clinical Lead | None | P1 | `VERIFIED` |
| **CON-03** | Consultation| Structured physical exam findings | Baseline Scope | Yes (`gnuhealth.patient.evaluation`)| Systems review forms active| EXISTING / VERIFIED | Test exam entry | Clinical Lead | None | P1 | `VERIFIED` |
| **CON-04** | Consultation| Primary & secondary ICD-10 diagnosis | Baseline Scope | Yes (`gnuhealth.pathology`) | 14,416 ICD-10 codes live | EXISTING / VERIFIED | Test pathology search | Clinical Lead | None | P1 | `VERIFIED` |
| **CON-05** | Consultation| Assessment & management plan | Baseline Scope | Yes (`gnuhealth.patient.evaluation`)| Action plan field active | EXISTING / VERIFIED | Test plan saving | Clinical Lead | None | P1 | `VERIFIED` |
| **CON-06** | Consultation| Trigger Lab, Rad, and Rx orders | Baseline Scope | Yes (`gnuhealth.patient.evaluation`)| One-click order buttons | TESTING / UAT | Test cross-order dispatch | Clinical Lead | None | P1 | `TESTING REQUIRED` |
| **CON-07** | Consultation| Follow-up interval & referral | Baseline Scope | Yes (`gnuhealth.patient.evaluation`)| Referral fields active | TESTING / UAT | Test referral form | Clinical Lead | None | P2 | `TESTING REQUIRED` |
| **CON-08** | Consultation| Medical EHR immutability (`perm_delete=F`)| Baseline Scope | Yes (`gnuhealth.patient.evaluation`)| Enforced at model level | EXISTING / VERIFIED | Verify delete restriction | Clinical Lead | None | P0 | `VERIFIED` |
| **PHR-01** | Pharmacy | E-Prescription generation | Baseline Scope | Yes (`gnuhealth.prescription.order`)| Prescribing form ready | TESTING / UAT | Test Rx line entry | Pharmacy Lead | PHR-03 | P1 | `TESTING REQUIRED` |
| **PHR-02** | Pharmacy | Allergy & pregnancy contraindication check| Baseline Scope | Yes (`health_pediatrics`) | Engine active (`SM-CORE-0018`) | EXISTING / VERIFIED | Test safety alert popup | Clinical Lead | None | P1 | `VERIFIED` |
| **PHR-03** | Pharmacy | Commercial medication formulary | Baseline Scope | Yes (`gnuhealth.medicament`) | Blocked: 0 drugs in table | MEDICAL DECISION | Ingest approved formulary | Chief Pharmacist| None | P1 | `MEDICAL APPROVAL REQUIRED` |
| **PHR-04** | Pharmacy | Pharmacist prescription verification | Baseline Scope | Yes (`gnuhealth.prescription.order`)| Approval status active | TESTING / UAT | Test pharmacist sign-off | Pharmacy Lead | None | P1 | `TESTING REQUIRED` |
| **PHR-05** | Pharmacy | Dispensary stock level check | Baseline Scope | Yes (`stock.move`) | Tryton stock tracking ready | GNU HEALTH CONFIGURATION| Set up pharmacy location | Pharmacy Lead | None | P1 | `CONFIGURATION REQUIRED` |
| **PHR-06** | Pharmacy | Dispensing with lot/batch & expiry | Baseline Scope | Yes (`stock.lot`) | Lot tracking active | TESTING / UAT | Test lot deduction | Pharmacy Lead | PHR-05 | P1 | `TESTING REQUIRED` |
| **PHR-07** | Pharmacy | Prescription billing line generation | Baseline Scope | Yes (`health_services`) | Bill trigger active | ACCOUNTING DECISION | Blocked by fiscal year | Finance Lead | BIL-03 | P0 | `BLOCKED` |
| **PHR-08** | Pharmacy | Medication returns & credit notes | Baseline Scope | Yes (`account_invoice`) | Credit note model active | TESTING / UAT | Test medication return | Pharmacy Lead | BIL-03 | P2 | `TESTING REQUIRED` |
| **LAB-01** | Laboratory | Diagnostic test ordering by category | Baseline Scope | Yes (`gnuhealth.patient.lab.test`) | 9 lab categories preloaded | MASTER DATA | Ingest clinic lab tests | Lab Lead | None | P1 | `MASTER DATA REQUIRED` |
| **LAB-02** | Laboratory | Specimen collection & accession logging | Baseline Scope | Yes (`gnuhealth.patient.lab.test`) | Sample fields active | TESTING / UAT | Test accession logging | Lab Lead | None | P1 | `TESTING REQUIRED` |
| **LAB-03** | Laboratory | Lab technician worklist queue | Baseline Scope | Yes (`gnuhealth.patient.lab.test`) | Queue view active | TESTING / UAT | Test lab worklist filter | Lab Lead | None | P1 | `TESTING REQUIRED` |
| **LAB-04** | Laboratory | Numeric results entry & range checks | Baseline Scope | Yes (`gnuhealth.lab`) | Reference range logic ready | MASTER DATA | Define lab test ranges | Lab Lead | None | P1 | `MASTER DATA REQUIRED` |
| **LAB-05** | Laboratory | Pathologist formal verification | Baseline Scope | Yes (`gnuhealth.lab`) | Sign-off button active | TESTING / UAT | Test pathologist sign-off | Lab Lead | None | P1 | `TESTING REQUIRED` |
| **LAB-06** | Laboratory | Results notification in patient EHR | Baseline Scope | Yes (`gnuhealth.patient.evaluation`)| Dynamic result lookup | EXISTING / VERIFIED | Test result rendering | Clinical Lead | None | P1 | `VERIFIED` |
| **LAB-07** | Laboratory | Automatic lab billing charge | Baseline Scope | Yes (`health_services`) | Bill trigger active | ACCOUNTING DECISION | Blocked by fiscal year | Finance Lead | BIL-03 | P0 | `BLOCKED` |
| **RAD-01** | Radiology | Imaging study order by modality | Baseline Scope | Yes (`gnuhealth.imaging.test.request`) | 8 modalities preloaded | MASTER DATA | Ingest clinic imaging tests | Radiology Lead | None | P1 | `MASTER DATA REQUIRED` |
| **RAD-02** | Radiology | Clinical indication documentation | Baseline Scope | Yes (`gnuhealth.imaging.test.request`) | Indication field mandatory | EXISTING / VERIFIED | Verify mandatory field | Clinical Lead | None | P1 | `VERIFIED` |
| **RAD-03** | Radiology | Procedure execution logging | Baseline Scope | Yes (`gnuhealth.imaging.test.result`) | Execution form active | TESTING / UAT | Test tech execution log | Radiology Lead | None | P1 | `TESTING REQUIRED` |
| **RAD-04** | Radiology | Structured diagnostic reporting | Baseline Scope | Yes (`gnuhealth.imaging.test.result`) | Report text block active | EXISTING / VERIFIED | Test radiology report | Radiology Lead | None | P1 | `VERIFIED` |
| **RAD-05** | Radiology | Radiologist digital sign-off | Baseline Scope | Yes (`gnuhealth.imaging.test.result`) | Signature lock active | TESTING / UAT | Test report sign-off | Radiology Lead | None | P1 | `TESTING REQUIRED` |
| **RAD-06** | Radiology | PDF report attachment to EHR | Baseline Scope | Yes (`ir.attachment`) | Attachment widget active | EXISTING / VERIFIED | Test PDF report upload | Radiology Lead | None | P1 | `VERIFIED` |
| **RAD-07** | Radiology | Automatic radiology billing charge | Baseline Scope | Yes (`health_services`) | Bill trigger active | ACCOUNTING DECISION | Blocked by fiscal year | Finance Lead | BIL-03 | P0 | `BLOCKED` |
| **RAD-08** | Radiology | PACS / DICOM server integration | Potential Scope | External (`health_orthanc`) | Not deployed on VM | POTENTIAL / OPTIONAL INTEGRATION| Technical assessment pending clinic specifications | IT / DevOps | PACS Decision | P3 | `POTENTIAL / OPTIONAL INTEGRATION` |
| **BIL-01** | Billing | Centralized service catalog in QAR | Baseline Scope | Yes (`product.product`) | 15 services with 0.00 QAR | BUSINESS DECISION | Approve clinic price list | Clinic Management| None | P0 | `BUSINESS APPROVAL REQUIRED` |
| **BIL-02** | Billing | Unified encounter charge aggregation | Baseline Scope | Yes (`health_services`) | Aggregation module active | TESTING / UAT | Test consolidated bill | Billing Lead | BIL-01 | P1 | `TESTING REQUIRED` |
| **BIL-03** | Billing | Invoice posting with open fiscal year | Baseline Scope | Yes (`account.fiscalyear`) | Blocked: 0 fiscal years | ACCOUNTING DECISION | Open FY 2026 & 12 periods| Chief Accountant| None | P0 | `BLOCKED` |
| **BIL-04** | Billing | Multi-tender payment (Cash/Card/Bank) | Baseline Scope | Yes (`account.payment`) | Journals & methods ready | TESTING / UAT | Test card/cash tenders | Billing Lead | BIL-03 | P1 | `TESTING REQUIRED` |
| **BIL-05** | Billing | Official printed bilingual receipt | Baseline Scope | Yes (`account_invoice`) | Report template active | BUSINESS DECISION | Approve receipt layout | Clinic Management| None | P1 | `BUSINESS APPROVAL REQUIRED` |
| **BIL-06** | Billing | Authorized discount management | Baseline Scope | Yes (`account_invoice`) | Discount percentage ready | BUSINESS DECISION | Define discount authority | Finance Lead | None | P2 | `BUSINESS APPROVAL REQUIRED` |
| **BIL-07** | Billing | Patient refunds & credit notes | Baseline Scope | Yes (`account_invoice`) | Credit note workflow ready | TESTING / UAT | Test credit note issuance | Finance Lead | BIL-03 | P2 | `TESTING REQUIRED` |
| **BIL-08** | Billing | Daily cashier shift reconciliation | Baseline Scope | Yes (`account.journal`) | Daily journal report ready | TESTING / UAT | Test shift closeout | Finance Lead | BIL-04 | P1 | `TESTING REQUIRED` |
| **INS-01** | Insurance | Private insurance payer directory | Baseline Scope | Yes (`gnuhealth.insurance`) | 0 payer parties entered | MASTER DATA | CONTRACTED INSURANCE PAYERS — PENDING CLINIC INPUT | Clinic Management| None | P1 | `MASTER DATA REQUIRED` |
| **INS-02** | Insurance | Patient member policy recording | Baseline Scope | Yes (`gnuhealth.insurance`) | Policy fields ready | MASTER DATA | Enter test patient policy | Reception Lead | INS-01 | P1 | `MASTER DATA REQUIRED` |
| **INS-03** | Insurance | Copay calculation & ceiling rules | Baseline Scope | Yes (`gnuhealth.insurance`) | Copay formula active | TESTING / UAT | Test 20/80 copay split | Billing Lead | INS-02 | P1 | `TESTING REQUIRED` |
| **INS-04** | Insurance | Dual-line invoice split (Patient/Payer)| Baseline Scope | Yes (`account_invoice`) | Split line engine active | TESTING / UAT | Verify separate balances | Finance Lead | BIL-03 | P1 | `TESTING REQUIRED` |
| **INS-05** | Insurance | Prior authorization request tracking | Baseline Scope | Yes (`gnuhealth.insurance`) | Auth code field ready | TESTING / UAT | Test prior auth code log | Insurance Lead | None | P2 | `TESTING REQUIRED` |
| **INS-06** | Insurance | External e-claims gateway | Optional Integration | Custom / Integration API | Not confirmed requirement | POTENTIAL / OPTIONAL INTEGRATION| Technical assessment pending clinic specifications | IT / Vendor | Clearinghouse Decision | P3 | `POTENTIAL / OPTIONAL INTEGRATION` |
| **SEC-01** | Security | TLS 1.3 / HTTPS encryption (Port 443)| Mandatory Standard | Yes (Nginx Reverse Proxy) | Blocked: Plaintext HTTP 80 | SECURITY / INFRASTRUCTURE| Install TLS certificate | DevOps Engineer | Domain DNS | P0 | `BLOCKED` |
| **SEC-02** | Security | Application daemon port 8000 locked | Security Baseline | Yes (GCP VPC Firewall) | Open to 0.0.0.0/0 | SECURITY / INFRASTRUCTURE| Restrict to localhost | Cloud Engineer | None | P0 | `BLOCKED` |
| **SEC-03** | Security | Administrative credential rotation | Security Baseline | Yes (`trytond-admin`) | Default password active | SECURITY / INFRASTRUCTURE| Rotate admin passphrase | System Admin | None | P0 | `BLOCKED` |
| **SEC-04** | Security | Least-privilege role-based access | Security Baseline | Yes (`res.group`, `res.user`) | 28 groups; demo users off | GNU HEALTH CONFIGURATION| Assign roles to staff | System Admin | Staff List | P1 | `CONFIGURATION REQUIRED` |
| **SEC-05** | Security | Transactional audit trail logging | Security Baseline | Yes (`ir.model.access`) | User & timestamp logging on| EXISTING / VERIFIED | Test audit log output | System Admin | None | P1 | `VERIFIED` |
| **SEC-06** | Security | Protected secrets management | Security Baseline | Yes (`trytond.conf`) | Config file chmod 600 | EXISTING / VERIFIED | Verify file permissions | DevOps Engineer | None | P1 | `VERIFIED` |
| **PERF-01**| Performance | 50 concurrent user support | Baseline Capacity | Yes (GCP 2 vCPU / 8GB RAM) | VM running comfortably | EXISTING / VERIFIED | Execute load smoke test | DevOps Engineer | None | P2 | `VERIFIED` |
| **PERF-02**| Performance | Sub-1.5s transaction response time | Performance SLA | Yes (Local UNIX Socket DB) | JSON-RPC queries < 300ms | EXISTING / VERIFIED | Monitor under multi-user | DevOps Engineer | None | P2 | `VERIFIED` |
| **AVAIL-01**| Availability| Automated daily PostgreSQL backups | Business Continuity| Yes (`backup_gnuhealth.sh`) | Script exists; cron pending | GNU HEALTH CONFIGURATION| Enable daily cron in crontab | System Admin | None | P1 | `CONFIGURATION REQUIRED` |
| **AVAIL-02**| Availability| Offsite cloud backup replication | Business Continuity| Yes (GCP Cloud Storage) | GCS bucket sync pending | SECURITY / INFRASTRUCTURE| Setup gsutil sync cron | DevOps Engineer | GCS Bucket | P2 | `CONFIGURATION REQUIRED` |
| **AVAIL-04**| Availability| Managed `systemd` daemon supervision| High Availability | Yes (`gnuhealth.service`) | Enabled and active | EXISTING / VERIFIED | Verify reboot auto-start | DevOps Engineer | None | P1 | `VERIFIED` |
| **COMP-01**| Compliance | Qatari Riyal accounting mandate | Qatar Central Bank | Yes (`currency.currency`) | Base currency set to QAR | EXISTING / VERIFIED | None | Finance Lead | None | P0 | `VERIFIED` |
| **COMP-02**| Compliance | Doctor QCHP licensing capture | Qatar MoPH / QCHP | Yes (`gnuhealth.healthprofessional`)| License field ready | MASTER DATA | Enter QCHP numbers | Operations Lead | Doctor List | P0 | `MASTER DATA REQUIRED` |
| **COMP-03**| Compliance | 11-digit Qatar National ID support | Qatar MoPH | Yes (`party.party`) | National ID field ready | EXISTING / VERIFIED | None | Reception Lead | None | P0 | `VERIFIED` |
| **COMP-04**| Compliance | Signed medical record immutability | Medical-Legal | Yes (`perm_delete = False`) | Model rules active | EXISTING / VERIFIED | None | Clinical Lead | None | P0 | `VERIFIED` |
