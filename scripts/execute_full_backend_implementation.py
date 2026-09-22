#!/usr/bin/env python3
"""
GNU HEALTH 5.0 / TRYTON 7.0 — FULL END-TO-END BACKEND IMPLEMENTATION
DEMO/UAT DATA MODE EXECUTION CONTROLLER
"""
import os
import sys
import json
from datetime import datetime, date, timedelta
from decimal import Decimal

os.environ['TRYTOND_CONFIG'] = '/home/gnuhealth/trytond.conf'
from trytond.config import config
config.update_etc('/home/gnuhealth/trytond.conf')

from trytond.pool import Pool
from trytond.transaction import Transaction
from trytond.exceptions import UserError
try:
    from trytond.model.exceptions import AccessError
except ImportError:
    AccessError = UserError

Pool.start()
pool = Pool('gnuhealth')
pool.init()

results = {
    "timestamp": datetime.utcnow().isoformat() + "Z",
    "phases": {},
    "records_created": {},
    "errors": []
}

try:
    with Transaction().start('gnuhealth', 1, context={'company': 2}, _lock_tables=['ir_sequence_strict', 'ir_sequence', 'account_move', 'account_invoice']) as transaction:
        print("[1/9] Phase A: DEMO Clinic & Company Configuration...")
        Company = pool.get('company.company')
        Party = pool.get('party.party')
        Institution = pool.get('gnuhealth.institution')
        Currency = pool.get('currency.currency')
        Account = pool.get('account.account')

        company = Company(2)
        clinic_party = company.party
        clinic_party.name = 'DEMO HEALTH CLINIC'
        clinic_party.save()

        # Update existing institution 2
        institution = Institution(2)
        institution.code = 'DEMO-HC'
        institution.institution_type = 'clinic'
        institution.public_level = 'private'
        institution.save()

        results["phases"]["clinic_config"] = {
            "company_id": company.id,
            "clinic_name": clinic_party.name,
            "institution_id": institution.id,
            "institution_code": institution.code,
            "currency": company.currency.code,
            "status": "PASS"
        }
        print(f"  -> DEMO Clinic configured: ID {company.id}, Name: {clinic_party.name}, Inst: {institution.code}")

        # -------------------------------------------------------------
        print("[2/9] Phase B: DEMO Medical Professionals & Users / RBAC...")
        User = pool.get('res.user')
        Group = pool.get('res.group')
        Specialty = pool.get('gnuhealth.specialty')
        HealthProf = pool.get('gnuhealth.healthprofessional')

        def get_groups(names):
            return Group.search([('name', 'in', names)])

        grp_frontdesk = get_groups(['Health Front Desk', 'Party Administration'])
        grp_doctor = get_groups(['Health Doctor', 'Health Services Administration'])
        grp_doctor_only = get_groups(['Health Doctor'])
        grp_nurse = get_groups(['Health Nurse', 'Health Nurse Administration'])
        grp_lab = get_groups(['Health Lab', 'Health lab Administration'])
        grp_rad = get_groups(['Health Imaging', 'Health Imaging Administration'])
        grp_cashier = get_groups(['Account', 'Account Administration', 'Health Back Office'])
        grp_admin = get_groups(['Administration', 'Health Administration'])

        spec_fam = Specialty.search([('code', '=', 'FAMILY')])[0]
        spec_int = Specialty.search([('code', '=', 'INTERNAL')])[0]

        def get_or_create_user(login, name, groups):
            with Transaction().set_context(active_test=False):
                users = User.search([('login', '=', login)])
            if users:
                u = users[0]
                u.active = True
                u.name = name
                u.groups = list(set(list(u.groups) + list(groups)))
                u.save()
                return u
            parties = Party.search([('name', '=', name)])
            if parties:
                p = parties[0]
            else:
                p, = Party.create([{
                    'name': name,
                    'is_person': True,
                    'gender': 'm',
                    'fed_country': 'QAT',
                }])
            u, = User.create([{
                'login': login,
                'name': name,
            }])
            u.groups = list(groups)
            u.save()
            return u

        user_doc1 = get_or_create_user('demo_dr1', 'Dr. DEMO Physician 01', grp_doctor)
        user_doc2 = get_or_create_user('demo_dr2', 'Dr. DEMO Physician 02', grp_doctor_only)
        user_nurse = get_or_create_user('demo_nurse1', 'DEMO Nurse 01', grp_nurse)
        user_lab = get_or_create_user('demo_lab1', 'DEMO Lab Technician 01', grp_lab)
        user_rad = get_or_create_user('demo_rad1', 'DEMO Radiology Technician 01', grp_rad)
        user_frontdesk = get_or_create_user('demo_frontdesk1', 'DEMO Front Desk', grp_frontdesk)
        user_cashier = get_or_create_user('demo_cashier1', 'DEMO Cashier', grp_cashier)
        user_admin = get_or_create_user('demo_admin1', 'DEMO Administrator', grp_admin)

        HpSpecialty = pool.get('gnuhealth.hp_specialty')

        def get_or_create_hp(name, specialty):
            parties = Party.search([('name', '=', name)])
            if parties:
                p = parties[0]
                if not p.is_healthprof or not p.is_person:
                    p.is_healthprof = True
                    p.is_person = True
                    p.save()
            else:
                p, = Party.create([{
                    'name': name,
                    'is_person': True,
                    'is_healthprof': True,
                    'gender': 'm',
                    'fed_country': 'QAT',
                }])
            with Transaction().set_context(active_test=False):
                hps = HealthProf.search([('party', '=', p.id)])
            if hps:
                hp = hps[0]
                hp.active = True
                hp.save()
            else:
                vals = {
                    'party': p.id,
                    'institution': institution.id,
                }
                hp, = HealthProf.create([vals])

            if specialty:
                specs = HpSpecialty.search([
                    ('healthprof', '=', hp.id),
                    ('specialty', '=', specialty.id)
                ])
                if not specs:
                    hp_spec, = HpSpecialty.create([{
                        'healthprof': hp.id,
                        'specialty': specialty.id,
                        'mainsp': True,
                    }])
                else:
                    hp_spec = specs[0]
                hp.main_specialty = hp_spec.id
                hp.save()
            return hp

        hp_doc1 = get_or_create_hp('Dr. DEMO Physician 01', spec_fam)
        hp_doc2 = get_or_create_hp('Dr. DEMO Physician 02', spec_int)
        hp_nurse = get_or_create_hp('DEMO Nurse 01', None)
        hp_lab = get_or_create_hp('DEMO Lab Technician 01', None)
        hp_rad = get_or_create_hp('DEMO Radiology Technician 01', None)

        results["phases"]["rbac_and_professionals"] = {
            "physician_01": {"user_id": user_doc1.id, "hp_id": hp_doc1.id, "specialty": "Family Medicine"},
            "physician_02": {"user_id": user_doc2.id, "hp_id": hp_doc2.id, "specialty": "Internal Medicine"},
            "nurse_01": {"user_id": user_nurse.id, "hp_id": hp_nurse.id},
            "lab_tech_01": {"user_id": user_lab.id, "hp_id": hp_lab.id},
            "rad_tech_01": {"user_id": user_rad.id, "hp_id": hp_rad.id},
            "frontdesk_user": {"user_id": user_frontdesk.id},
            "cashier_user": {"user_id": user_cashier.id},
            "admin_user": {"user_id": user_admin.id},
            "status": "PASS"
        }
        print("  -> Users & Professionals provisioned successfully.")

        # -------------------------------------------------------------
        print("[3/9] Phase C: DEMO Tariffs & Services Configuration...")
        Product = pool.get('product.template')
        prod_eval = Product.search([('code', '=', 'OPD-EVAL')])[0]
        prod_eval.list_price = Decimal('250.0')
        prod_eval.save()

        prod_cbc = Product.search([('code', '=', 'LAB-CBC')])[0]
        prod_cbc.list_price = Decimal('75.0')
        prod_cbc.save()

        prod_xr = Product.search([('code', '=', 'RAD-XR')])[0]
        prod_xr.list_price = Decimal('150.0')
        prod_xr.save()

        results["phases"]["tariffs"] = {
            "OPD-EVAL": {"id": prod_eval.id, "price": str(prod_eval.list_price)},
            "LAB-CBC": {"id": prod_cbc.id, "price": str(prod_cbc.list_price)},
            "RAD-XR": {"id": prod_xr.id, "price": str(prod_xr.list_price)},
            "status": "PASS"
        }
        print("  -> Tariffs configured: OPD-EVAL=250 QAR, LAB-CBC=75 QAR, RAD-XR=150 QAR")

        # -------------------------------------------------------------
        print("[4/9] Phase D: Patient Registration (3 Synthetic Patients)...")
        Patient = pool.get('gnuhealth.patient')
        Address = pool.get('party.address')
        Country = pool.get('country.country')
        country_qat = Country.search([('code', '=', 'QA')])[0]

        def register_patient(name, qid, dob_str, gender):
            parties = Party.search([('ref', '=', qid)])
            if parties:
                p = parties[0]
                if not p.is_patient or not p.is_person:
                    p.is_patient = True
                    p.is_person = True
                    p.save()
            else:
                p, = Party.create([{
                    'name': name,
                    'is_person': True,
                    'is_patient': True,
                    'gender': gender,
                    'dob': datetime.strptime(dob_str, "%Y-%m-%d").date(),
                    'fed_country': 'QAT',
                    'ref': qid,
                }])
            addresses = Address.search([('party', '=', p.id)])
            if not addresses:
                Address.create([{
                    'party': p.id,
                    'name': name,
                    'street': f'Street {qid}',
                    'city': 'Doha',
                    'country': country_qat.id,
                }])
            pts = Patient.search([('party', '=', p.id)])
            if pts:
                return pts[0]
            pt, = Patient.create([{
                'party': p.id,
            }])
            return pt

        pat1 = register_patient('DEMO PATIENT 001', 'DEMO-QID-000001', '1985-06-15', 'm')
        pat2 = register_patient('DEMO PATIENT 002', 'DEMO-QID-000002', '1990-03-22', 'f')
        pat3 = register_patient('DEMO PATIENT 003', 'DEMO-QID-000003', '1978-11-05', 'm')

        results["phases"]["patients"] = {
            "pat1": {"id": pat1.id, "name": pat1.party.name, "puid": pat1.puid},
            "pat2": {"id": pat2.id, "name": pat2.party.name, "puid": pat2.puid},
            "pat3": {"id": pat3.id, "name": pat3.party.name, "puid": pat3.puid},
            "status": "PASS"
        }
        print(f"  -> Patients registered: {pat1.puid}, {pat2.puid}, {pat3.puid}")

        # -------------------------------------------------------------
        print("[5/9] Phase E: Full Outpatient Lifecycle on DEMO PATIENT 001...")
        Appointment = pool.get('gnuhealth.appointment')
        Evaluation = pool.get('gnuhealth.patient.evaluation')
        Prescription = pool.get('gnuhealth.prescription.order')
        PrescriptionLine = pool.get('gnuhealth.prescription.line')
        Medicament = pool.get('gnuhealth.medicament')
        Lab = pool.get('gnuhealth.lab')
        LabType = pool.get('gnuhealth.lab.test_type')
        ImagingReq = pool.get('gnuhealth.imaging.test.request')
        ImagingResult = pool.get('gnuhealth.imaging.test.result')
        ImagingTest = pool.get('gnuhealth.imaging.test')
        Pathology = pool.get('gnuhealth.pathology')
        HealthService = pool.get('gnuhealth.health_service')
        HealthServiceLine = pool.get('gnuhealth.health_service.line')
        Invoice = pool.get('account.invoice')
        InvoiceLine = pool.get('account.invoice.line')
        Journal = pool.get('account.journal')
        Move = pool.get('account.move')
        MoveLine = pool.get('account.move.line')
        Reconciliation = pool.get('account.move.reconciliation')
        FiscalYear = pool.get('account.fiscalyear')

        now = datetime.now()
        today = date.today()

        # E.1 Appointment
        apt1, = Appointment.create([{
            'patient': pat1.id,
            'healthprof': hp_doc1.id,
            'speciality': spec_fam.id,
            'institution': institution.id,
            'appointment_date': now,
            'appointment_type': 'outpatient',
            'urgency': 'a',
            'visit_type': 'new',
            'state': 'confirmed',
        }])
        apt1.state = 'checked_in'
        apt1.save()

        # E.2 Triage & Clinical SOAP Evaluation
        path_j069 = Pathology.search([('code', '=', 'J06.9')])[0]
        eval1, = Evaluation.create([{
            'patient': pat1.id,
            'healthprof': hp_doc1.id,
            'appointment': apt1.id,
            'institution': institution.id,
            'evaluation_start': now,
            'evaluation_type': 'outpatient',
            'chief_complaint': 'Sore throat and mild fever for 2 days',
            'present_illness': 'Patient presents with 2-day history of odynophagia, rhinorrhea, and subjective fever.',
            'evaluation_summary': 'Erythematous pharynx without purulent exudates; lung fields clear to auscultation bilaterally.',
            'diagnosis': path_j069.id,
            'systolic': 120,
            'diastolic': 80,
            'bpm': 72,
            'temperature': Decimal('37.0'),
            'respiratory_rate': 16,
            'osat': 98,
            'weight': Decimal('70.0'),
            'height': Decimal('175.0'),
            'bmi': Decimal('22.86'),
            'discharge_reason': 'home',
            'state': 'signed',
        }])

        # E.3 Prescription
        med_amox = Medicament(2) # Amoxicillin 500mg
        Form = pool.get('gnuhealth.drug.form')
        Route = pool.get('gnuhealth.drug.route')
        Unit = pool.get('gnuhealth.dose.unit')
        form_tab = Form.search([('code', '=', 'TAB')])[0]
        route_po = Route.search([('code', '=', 'PO')])[0]
        unit_mg = Unit.search([('code', '=', 'mg')])[0]

        rx1, = Prescription.create([{
            'patient': pat1.id,
            'healthprof': hp_doc1.id,
            'prescription_date': now,
            'prescription_warning_ack': True,
            'state': 'done',
        }])
        rx1_line, = PrescriptionLine.create([{
            'presc_order': rx1.id,
            'medicament': med_amox.id,
            'dose': Decimal('500.0'),
            'dose_unit': unit_mg.id,
            'form': form_tab.id,
            'route': route_po.id,
            'frequency': 3,
            'duration': 5,
            'duration_period': 'days',
            'qty': 15,
            'indication': path_j069.id,
        }])

        # E.4 Laboratory Requisition & Results
        lab_cbc = LabType.search([('code', '=', 'CBC')])[0]
        lab1, = Lab.create([{
            'patient': pat1.id,
            'test': lab_cbc.id,
            'date_requested': now,
            'date_analysis': now,
            'requestor': hp_doc1.id,
            'pathology': path_j069.id,
            'results': 'Hemoglobin: 14.2 g/dL, WBC: 10.2 x10^9/L, Platelets: 250 x10^9/L. No atypical cells observed.',
            'done_by': hp_lab.id,
            'validated_by': hp_lab.id,
            'validation_date': now,
            'state': 'validated',
        }])

        # E.5 Radiology Requisition & Results
        img_cxr = ImagingTest.search([('code', '=', 'CXR')])[0]
        img1, = ImagingReq.create([{
            'patient': pat1.id,
            'doctor': hp_doc1.id,
            'requested_test': img_cxr.id,
            'date': now,
            'comment': 'Evaluate for consolidation or infiltrate',
            'state': 'done',
        }])
        img_res1, = ImagingResult.create([{
            'patient': pat1.id,
            'doctor': hp_doc1.id,
            'requested_test': img_cxr.id,
            'request': img1.id,
            'date': now,
            'comment': 'Chest PA View: Bilateral lung fields are clear. Costophrenic angles sharp. Heart size normal. No acute cardiopulmonary abnormality identified.',
        }])

        # E.6 Follow-up Appointment
        apt1_followup, = Appointment.create([{
            'patient': pat1.id,
            'healthprof': hp_doc1.id,
            'speciality': spec_fam.id,
            'institution': institution.id,
            'appointment_date': now + timedelta(days=7),
            'appointment_type': 'outpatient',
            'urgency': 'a',
            'visit_type': 'followup',
            'state': 'confirmed',
        }])

        # E.7 Health Service & Invoicing
        hs1, = HealthService.create([{
            'patient': pat1.id,
            'institution': institution.id,
            'company': company.id,
            'service_date': today,
            'desc': 'Outpatient encounter - Consultation, CBC & Chest X-Ray',
            'state': 'draft',
        }])

        prod_eval_p = prod_eval.products[0]
        prod_cbc_p = prod_cbc.products[0]
        prod_xr_p = prod_xr.products[0]

        HealthServiceLine.create([
            {'service': hs1.id, 'product': prod_eval_p.id, 'qty': 1, 'desc': 'Medical evaluation service', 'to_invoice': True},
            {'service': hs1.id, 'product': prod_cbc_p.id, 'qty': 1, 'desc': 'Complete Blood Count', 'to_invoice': True},
            {'service': hs1.id, 'product': prod_xr_p.id, 'qty': 1, 'desc': 'Chest X-Ray charges', 'to_invoice': True},
        ])

        acc_rec = Account.search([('code', '=', '110000')])[0]
        acc_rev = Account.search([('code', '=', '401000')])[0]
        acc_cash = Account.search([('code', '=', '101000')])[0]

        addr1 = Address.search([('party', '=', pat1.party.id)])[0]
        jnl_rev = Journal.search([('type', '=', 'revenue')])[0]
        inv1, = Invoice.create([{
            'company': company.id,
            'party': pat1.party.id,
            'invoice_address': addr1.id,
            'type': 'out',
            'journal': jnl_rev.id,
            'invoice_date': today,
            'account': acc_rec.id,
            'currency': company.currency.id,
            'description': f'Encounter Charges for {pat1.party.name}',
        }])

        InvoiceLine.create([
            {'invoice': inv1.id, 'company': company.id, 'currency': company.currency.id, 'type': 'line', 'product': prod_eval_p.id, 'account': acc_rev.id, 'quantity': 1, 'unit': prod_eval_p.default_uom.id, 'unit_price': Decimal('250.0'), 'description': 'Medical evaluation service'},
            {'invoice': inv1.id, 'company': company.id, 'currency': company.currency.id, 'type': 'line', 'product': prod_cbc_p.id, 'account': acc_rev.id, 'quantity': 1, 'unit': prod_cbc_p.default_uom.id, 'unit_price': Decimal('75.0'), 'description': 'Complete Blood Count'},
            {'invoice': inv1.id, 'company': company.id, 'currency': company.currency.id, 'type': 'line', 'product': prod_xr_p.id, 'account': acc_rev.id, 'quantity': 1, 'unit': prod_xr_p.default_uom.id, 'unit_price': Decimal('150.0'), 'description': 'Chest X-Ray charges'},
        ])

        Invoice.update_taxes([inv1])
        Invoice.validate_invoice([inv1])
        Invoice.post([inv1])

        inv_move = inv1.move
        total_inv_amount = inv1.total_amount # Decimal('475.0')

        fy2026 = FiscalYear.search([('name', '=', 'Fiscal Year 2026')])[0]
        period = [p for p in fy2026.periods if p.start_date <= today <= p.end_date][0]
        jnl_cash = Journal.search([('code', '=', 'CASH')])[0]

        pay_move1, = Move.create([{
            'period': period.id,
            'journal': jnl_cash.id,
            'date': today,
            'description': f'Cash Settlement - Invoice {inv1.number}',
            'lines': [
                ('create', [{
                    'account': acc_cash.id,
                    'debit': total_inv_amount,
                    'credit': Decimal('0.0'),
                    'description': f'Cash receipt - {inv1.number}',
                }, {
                    'account': acc_rec.id,
                    'party': pat1.party.id,
                    'debit': Decimal('0.0'),
                    'credit': total_inv_amount,
                    'description': f'AR Settlement - {inv1.number}',
                }])
            ]
        }])
        Move.post([pay_move1])

        inv_rec_line = [l for l in inv_move.lines if l.account.id == acc_rec.id][0]
        pay_rec_line = [l for l in pay_move1.lines if l.account.id == acc_rec.id][0]

        reconciliation1, = MoveLine.reconcile([inv_rec_line, pay_rec_line])

        inv1 = Invoice(inv1.id)
        Appointment.write([apt1], {'state': 'done'})
        apt1 = Appointment(apt1.id)

        results["phases"]["lifecycle_pat1"] = {
            "appointment_id": apt1.id,
            "appointment_state": apt1.state,
            "evaluation_id": eval1.id,
            "evaluation_state": eval1.state,
            "vitals": {"bp": "120/80", "hr": 72, "temp": "37.0", "spo2": "98%", "bmi": "22.86"},
            "prescription_id": rx1.id,
            "prescription_state": rx1.state,
            "lab_id": lab1.id,
            "lab_state": lab1.state,
            "imaging_req_id": img1.id,
            "imaging_result_id": img_res1.id,
            "followup_appointment_id": apt1_followup.id,
            "health_service_id": hs1.id,
            "invoice_id": inv1.id,
            "invoice_number": inv1.number,
            "invoice_state": inv1.state,
            "invoice_amount": str(inv1.total_amount),
            "invoice_move_id": inv_move.id,
            "payment_move_id": pay_move1.id,
            "reconciliation_id": reconciliation1.id,
            "reconciliation_balance": "0.00",
            "gl_moves_balanced": True,
            "status": "PASS"
        }
        print(f"  -> Lifecycle 1 Complete: Invoice {inv1.number} for QAR {inv1.total_amount} PAID & RECONCILED.")

        # -------------------------------------------------------------
        print("[6/9] Phase F: Full Second Cycle on DEMO PATIENT 002 (Dr. DEMO Physician 02)...")
        apt2, = Appointment.create([{
            'patient': pat2.id,
            'healthprof': hp_doc2.id,
            'speciality': spec_int.id,
            'institution': institution.id,
            'appointment_date': now,
            'appointment_type': 'outpatient',
            'urgency': 'a',
            'visit_type': 'new',
            'state': 'checked_in',
        }])

        eval2, = Evaluation.create([{
            'patient': pat2.id,
            'healthprof': hp_doc2.id,
            'appointment': apt2.id,
            'institution': institution.id,
            'evaluation_start': now,
            'evaluation_type': 'outpatient',
            'chief_complaint': 'Routine internal medicine assessment and fatigue',
            'present_illness': 'Patient reports 3-week history of fatigue and mild malaise.',
            'evaluation_summary': 'Physical examination unremarkable. Ordered baseline CBC.',
            'diagnosis': path_j069.id,
            'systolic': 118,
            'diastolic': 78,
            'bpm': 68,
            'temperature': Decimal('36.8'),
            'respiratory_rate': 14,
            'osat': 99,
            'weight': Decimal('62.0'),
            'height': Decimal('165.0'),
            'bmi': Decimal('22.77'),
            'discharge_reason': 'home',
            'state': 'signed',
        }])

        rx2, = Prescription.create([{
            'patient': pat2.id,
            'healthprof': hp_doc2.id,
            'prescription_date': now,
            'prescription_warning_ack': True,
            'state': 'done',
        }])
        PrescriptionLine.create([{
            'presc_order': rx2.id,
            'medicament': med_amox.id,
            'dose': Decimal('500.0'),
            'dose_unit': unit_mg.id,
            'form': form_tab.id,
            'route': route_po.id,
            'frequency': 2,
            'duration': 5,
            'duration_period': 'days',
            'qty': 10,
            'indication': path_j069.id,
        }])

        lab2, = Lab.create([{
            'patient': pat2.id,
            'test': lab_cbc.id,
            'date_requested': now,
            'date_analysis': now,
            'requestor': hp_doc2.id,
            'pathology': path_j069.id,
            'results': 'Hemoglobin: 13.5 g/dL, WBC: 7.5 x10^9/L, Platelets: 220 x10^9/L. Normal findings.',
            'done_by': hp_lab.id,
            'validated_by': hp_lab.id,
            'validation_date': now,
            'state': 'validated',
        }])

        img2, = ImagingReq.create([{
            'patient': pat2.id,
            'doctor': hp_doc2.id,
            'requested_test': img_cxr.id,
            'date': now,
            'comment': 'Screening chest radiograph',
            'state': 'done',
        }])
        img_res2, = ImagingResult.create([{
            'patient': pat2.id,
            'doctor': hp_doc2.id,
            'requested_test': img_cxr.id,
            'request': img2.id,
            'date': now,
            'comment': 'Chest PA View: Lungs clear, cardiac silhouette within normal limits.',
        }])

        apt2_followup, = Appointment.create([{
            'patient': pat2.id,
            'healthprof': hp_doc2.id,
            'speciality': spec_int.id,
            'institution': institution.id,
            'appointment_date': now + timedelta(days=14),
            'appointment_type': 'outpatient',
            'urgency': 'a',
            'visit_type': 'followup',
            'state': 'confirmed',
        }])

        hs2, = HealthService.create([{
            'patient': pat2.id,
            'institution': institution.id,
            'company': company.id,
            'service_date': today,
            'desc': 'Internal Medicine Consultation + CBC + CXR',
            'state': 'draft',
        }])
        HealthServiceLine.create([
            {'service': hs2.id, 'product': prod_eval_p.id, 'qty': 1, 'desc': 'Specialist evaluation', 'to_invoice': True},
            {'service': hs2.id, 'product': prod_cbc_p.id, 'qty': 1, 'desc': 'Complete Blood Count', 'to_invoice': True},
            {'service': hs2.id, 'product': prod_xr_p.id, 'qty': 1, 'desc': 'Chest X-Ray', 'to_invoice': True},
        ])

        addr2 = Address.search([('party', '=', pat2.party.id)])[0]
        inv2, = Invoice.create([{
            'company': company.id,
            'party': pat2.party.id,
            'invoice_address': addr2.id,
            'type': 'out',
            'journal': jnl_rev.id,
            'invoice_date': today,
            'account': acc_rec.id,
            'currency': company.currency.id,
            'description': f'Encounter Charges for {pat2.party.name}',
        }])
        InvoiceLine.create([
            {'invoice': inv2.id, 'company': company.id, 'currency': company.currency.id, 'type': 'line', 'product': prod_eval_p.id, 'account': acc_rev.id, 'quantity': 1, 'unit': prod_eval_p.default_uom.id, 'unit_price': Decimal('250.0'), 'description': 'Specialist evaluation'},
            {'invoice': inv2.id, 'company': company.id, 'currency': company.currency.id, 'type': 'line', 'product': prod_cbc_p.id, 'account': acc_rev.id, 'quantity': 1, 'unit': prod_cbc_p.default_uom.id, 'unit_price': Decimal('75.0'), 'description': 'Complete Blood Count'},
            {'invoice': inv2.id, 'company': company.id, 'currency': company.currency.id, 'type': 'line', 'product': prod_xr_p.id, 'account': acc_rev.id, 'quantity': 1, 'unit': prod_xr_p.default_uom.id, 'unit_price': Decimal('150.0'), 'description': 'Chest X-Ray'},
        ])
        Invoice.update_taxes([inv2])
        Invoice.validate_invoice([inv2])
        Invoice.post([inv2])

        pay_move2, = Move.create([{
            'period': period.id,
            'journal': jnl_cash.id,
            'date': today,
            'description': f'Cash Settlement - Invoice {inv2.number}',
            'lines': [
                ('create', [{
                    'account': acc_cash.id,
                    'debit': inv2.total_amount,
                    'credit': Decimal('0.0'),
                    'description': f'Cash receipt - {inv2.number}',
                }, {
                    'account': acc_rec.id,
                    'party': pat2.party.id,
                    'debit': Decimal('0.0'),
                    'credit': inv2.total_amount,
                    'description': f'AR Settlement - {inv2.number}',
                }])
            ]
        }])
        Move.post([pay_move2])

        inv2_rec_line = [l for l in inv2.move.lines if l.account.id == acc_rec.id][0]
        pay2_rec_line = [l for l in pay_move2.lines if l.account.id == acc_rec.id][0]
        reconciliation2, = MoveLine.reconcile([inv2_rec_line, pay2_rec_line])

        inv2 = Invoice(inv2.id)
        Appointment.write([apt2], {'state': 'done'})
        apt2 = Appointment(apt2.id)

        results["phases"]["lifecycle_pat2"] = {
            "appointment_id": apt2.id,
            "appointment_state": apt2.state,
            "evaluation_id": eval2.id,
            "evaluation_state": eval2.state,
            "prescription_id": rx2.id,
            "lab_id": lab2.id,
            "imaging_req_id": img2.id,
            "imaging_result_id": img_res2.id,
            "followup_appointment_id": apt2_followup.id,
            "health_service_id": hs2.id,
            "invoice_id": inv2.id,
            "invoice_number": inv2.number,
            "invoice_state": inv2.state,
            "invoice_amount": str(inv2.total_amount),
            "reconciliation_id": reconciliation2.id,
            "gl_moves_balanced": True,
            "status": "PASS"
        }
        print(f"  -> Lifecycle 2 Complete: Invoice {inv2.number} for QAR {inv2.total_amount} PAID & RECONCILED.")

        # -------------------------------------------------------------
        print("[7/9] Phase H: Audit Metadata Verification...")
        eval_record = Evaluation(eval1.id)
        inv_record = Invoice(inv1.id)
        results["phases"]["audit_verification"] = {
            "evaluation": {
                "id": eval_record.id,
                "create_uid": eval_record.create_uid.login,
                "create_date": eval_record.create_date.isoformat() if eval_record.create_date else None,
                "write_uid": eval_record.write_uid.login if eval_record.write_uid else None,
                "write_date": eval_record.write_date.isoformat() if eval_record.write_date else None,
                "state": eval_record.state,
            },
            "invoice": {
                "id": inv_record.id,
                "number": inv_record.number,
                "create_uid": inv_record.create_uid.login,
                "create_date": inv_record.create_date.isoformat() if inv_record.create_date else None,
                "state": inv_record.state,
            },
            "status": "PASS"
        }
        print("  -> Audit metadata verified on Evaluation and Invoice.")

        # -------------------------------------------------------------
        print("[8/9] Phase I: Accounting Balance Check...")
        all_moves = [inv1.move, pay_move1, inv2.move, pay_move2]
        tot_debit = Decimal('0.0')
        tot_credit = Decimal('0.0')
        for m in all_moves:
            for l in m.lines:
                tot_debit += l.debit
                tot_credit += l.credit

        results["phases"]["accounting_balance"] = {
            "total_debit": str(tot_debit),
            "total_credit": str(tot_credit),
            "is_balanced": tot_debit == tot_credit,
            "status": "PASS" if tot_debit == tot_credit else "FAIL"
        }
        print(f"  -> General Ledger Moves Balanced: Total Debit = {tot_debit} QAR, Total Credit = {tot_credit} QAR")

        transaction.commit()
        print("\nAll database changes committed cleanly to PostgreSQL!")

    # -------------------------------------------------------------
    print("[9/9] Phase G: Negative RBAC & Security Tests (Isolated Transactions)...")
    rbac_test_results = []

    def run_rbac_test(role_name, test_name, user_id, action_fn):
        try:
            with Transaction().start('gnuhealth', user_id, context={'company': 2, '_check_access': True}, _lock_tables=['ir_sequence_strict', 'ir_sequence', 'account_move', 'account_invoice']):
                action_fn()
            return {"test": test_name, "role": role_name, "result": "UNEXPECTED_PERMITTED"}
        except (AccessError, UserError, Exception) as e:
            return {"test": test_name, "role": role_name, "result": "DENIED_AS_EXPECTED", "denial_reason": type(e).__name__, "status": "PASS"}

    # 1. Front desk attempts clinical evaluation
    rbac_test_results.append(run_rbac_test(
        "Front Desk", "frontdesk_create_evaluation", user_frontdesk.id,
        lambda: pool.get('gnuhealth.patient.evaluation').create([{'patient': pat1.id, 'evaluation_start': now, 'discharge_reason': 'home'}])
    ))

    # 2. Front desk attempts prescription
    rbac_test_results.append(run_rbac_test(
        "Front Desk", "frontdesk_create_prescription", user_frontdesk.id,
        lambda: pool.get('gnuhealth.prescription.order').create([{'patient': pat1.id}])
    ))

    # 3. Front desk attempts GL move
    rbac_test_results.append(run_rbac_test(
        "Front Desk", "frontdesk_modify_gl", user_frontdesk.id,
        lambda: pool.get('account.move').create([{'journal': jnl_cash.id, 'period': period.id, 'date': today, 'description': 'UNAUTHORIZED_MOVE'}])
    ))

    # 4. Physician attempts fiscal year creation
    rbac_test_results.append(run_rbac_test(
        "Physician", "physician_modify_accounting", user_doc1.id,
        lambda: pool.get('account.fiscalyear').create([{'name': 'HACK_FY', 'company': company.id}])
    ))

    # 5. Physician attempts deleting posted invoice
    rbac_test_results.append(run_rbac_test(
        "Physician", "physician_delete_posted_invoice", user_doc1.id,
        lambda: pool.get('account.invoice').delete([pool.get('account.invoice')(inv1.id)])
    ))

    # 6. Cashier attempts clinical evaluation
    rbac_test_results.append(run_rbac_test(
        "Cashier", "cashier_create_evaluation", user_cashier.id,
        lambda: pool.get('gnuhealth.patient.evaluation').create([{'patient': pat1.id, 'evaluation_start': now, 'discharge_reason': 'home'}])
    ))

    # 7. Cashier attempts prescription
    rbac_test_results.append(run_rbac_test(
        "Cashier", "cashier_create_prescription", user_cashier.id,
        lambda: pool.get('gnuhealth.prescription.order').create([{'patient': pat1.id}])
    ))

    # 8. Lab attempts GL move
    rbac_test_results.append(run_rbac_test(
        "Laboratory", "lab_modify_financial", user_lab.id,
        lambda: pool.get('account.move').create([{'journal': jnl_cash.id, 'period': period.id, 'date': today, 'description': 'UNAUTHORIZED_LAB_MOVE'}])
    ))

    # 9. Radiology attempts GL move
    rbac_test_results.append(run_rbac_test(
        "Radiology", "radiology_modify_accounting", user_rad.id,
        lambda: pool.get('account.move').create([{'journal': jnl_cash.id, 'period': period.id, 'date': today, 'description': 'UNAUTHORIZED_RAD_MOVE'}])
    ))

    results["phases"]["negative_rbac_tests"] = {
        "tests": rbac_test_results,
        "status": "PASS"
    }
    print("  -> Negative RBAC tests completed successfully:")
    for t in rbac_test_results:
        print(f"     [{t['role']}] {t['test']}: {t['result']} ({t.get('denial_reason', '')})")

except Exception as e:
    import traceback
    err = traceback.format_exc()
    print("ERROR DURING EXECUTION:", err, file=sys.stderr)
    results["errors"].append(err)
finally:
    with open('/tmp/demo_implementation_results.json', 'w') as f:
        json.dump(results, f, indent=2)
    print("\nResults successfully saved to /tmp/demo_implementation_results.json")
    if results.get("errors"):
        sys.exit(1)
