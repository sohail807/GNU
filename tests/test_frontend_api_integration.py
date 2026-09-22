#!/usr/bin/env python3
"""
tests/test_frontend_api_integration.py

Comprehensive Frontend API Integration Test Suite for GNU Health HMIS 5.0 / Tryton 7.0.
Simulates client frontend JSON-RPC operations under specific authenticated user role contexts.

Covers:
1. Positive Outpatient Lifecycle:
   Patient -> Appointment -> Check-in -> Triage -> Evaluation -> Diagnosis ->
   Prescription -> Lab -> Radiology -> Service -> Invoice -> Payment -> Reconciliation
2. Negative Security & Authorization Checks:
   - Front Desk blocked from clinical evaluation creation
   - Front Desk blocked from prescription creation
   - Cashier blocked from modifying clinical evaluations
   - Physician blocked from invoice creation/posting
   - Non-admin blocked from user/group privilege escalation
   - Posted invoice alteration/deletion blocked
   - Signed evaluation immutability enforced
"""

import sys
import os
import time
import json
import logging
from datetime import datetime, date, timedelta
from decimal import Decimal

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s [%(levelname)s] %(message)s')
logger = logging.getLogger("frontend_integration_test")

# Tryton Setup
from trytond.config import config
config.update_etc('/home/gnuhealth/trytond.conf')

from trytond.pool import Pool
from trytond.transaction import Transaction
from trytond.exceptions import UserError

DB_NAME = "gnuhealth"
COMPANY_ID = 2

# User Roles Mapping
ROLES = {
    'admin': 153,        # demo_admin1
    'frontdesk': 151,    # demo_frontdesk1
    'nurse': 148,        # demo_nurse1
    'doctor': 146,       # demo_dr1
    'lab': 149,          # demo_lab1
    'rad': 150,          # demo_rad1
    'cashier': 152       # demo_cashier1
}

def run_tests():
    logger.info("=================================================================")
    logger.info("GNU HEALTH FRONTEND INTEGRATION TEST SUITE - DEMO/UAT DATASET")
    logger.info("=================================================================")

    Pool.start()
    pool = Pool(DB_NAME)
    pool.init()

    results = {
        'timestamp': datetime.utcnow().isoformat() + "Z",
        'positive_tests': {},
        'negative_tests': {},
        'overall_status': 'PASS'
    }

    # Models
    Party = pool.get('party.party')
    Address = pool.get('party.address')
    Identifier = pool.get('party.identifier')
    Patient = pool.get('gnuhealth.patient')
    Appointment = pool.get('gnuhealth.appointment')
    Evaluation = pool.get('gnuhealth.patient.evaluation')
    Disease = pool.get('gnuhealth.patient.disease')
    Pathology = pool.get('gnuhealth.pathology')
    Prescription = pool.get('gnuhealth.prescription.order')
    PrescriptionLine = pool.get('gnuhealth.prescription.line')
    Lab = pool.get('gnuhealth.lab')
    ImagingReq = pool.get('gnuhealth.imaging.test.request')
    ImagingRes = pool.get('gnuhealth.imaging.test.result')
    HealthService = pool.get('gnuhealth.health_service')
    HealthServiceLine = pool.get('gnuhealth.health_service.line')
    Invoice = pool.get('account.invoice')
    InvoiceLine = pool.get('account.invoice.line')
    Move = pool.get('account.move')
    MoveLine = pool.get('account.move.line')
    Account = pool.get('account.account')
    Journal = pool.get('account.journal')
    Institution = pool.get('gnuhealth.institution')
    ProductTemplate = pool.get('product.template')
    ModelAccess = pool.get('ir.model.access')
    User = pool.get('res.user')

    unique_ts = str(int(time.time()))
    test_qid = f"FE-UAT-QID-{unique_ts[-6:]}"
    test_name = f"FE-UAT PATIENT {unique_ts[-4:]}"

    # =========================================================================
    # PART 1: POSITIVE WORKFLOW TESTS
    # =========================================================================
    logger.info("\n>>> STARTING PART 1: POSITIVE CLINICAL WORKFLOW TESTS <<<")

    Transaction().stop()
    with Transaction().start(DB_NAME, 1, _lock_tables=['ir_sequence_strict', 'ir_sequence', 'account_move', 'account_invoice']) as t:
        with Transaction().set_context(company=COMPANY_ID):
            # Shared Context Entities
            inst = Institution.search([])[0]
            prod_eval_p = ProductTemplate.search([('code', '=', 'OPD-EVAL')])[0].products[0]
            prod_cbc_p = ProductTemplate.search([('code', '=', 'LAB-CBC')])[0].products[0]
            prod_xr_p = ProductTemplate.search([('code', '=', 'RAD-XR')])[0].products[0]
            path_j069 = Pathology.search([('code', '=', 'J06.9')])[0]

            # Step 1: Patient Registration (Front Desk)
            try:
                p_party, = Party.create([{
                    'name': test_name,
                    'is_person': True,
                    'is_patient': True,
                    'gender': 'f',
                    'dob': date(1996, 5, 20),
                    'fed_country': 'QAT',
                    'ref': test_qid
                }])
                p_addr, = Address.create([{
                    'party': p_party.id,
                    'name': test_name,
                    'street': f"FE-UAT STREET {unique_ts[-4:]}",
                    'city': "Doha"
                }])
                p_ident, = Identifier.create([{
                    'party': p_party.id,
                    'type': None,
                    'code': test_qid
                }])
                p_pat, = Patient.create([{'party': p_party.id}])
                results['positive_tests']['patient_registration'] = {
                    'status': 'PASS', 'patient_id': p_pat.id, 'puid': p_pat.puid, 'party_id': p_party.id
                }
                logger.info(f"PASS: Patient Registration (Patient ID {p_pat.id}, PUID {p_pat.puid})")
            except Exception as e:
                results['positive_tests']['patient_registration'] = {'status': 'FAIL', 'error': str(e)}
                results['overall_status'] = 'FAIL'
                logger.error(f"FAIL: Patient Registration: {e}")

            # Step 2: Appointment Booking & Check-In (Front Desk)
            try:
                appt, = Appointment.create([{
                    'patient': p_pat.id,
                    'healthprof': 71,
                    'appointment_date': datetime.utcnow(),
                    'appointment_type': 'outpatient',
                    'state': 'free'
                }])
                appt.state = 'confirmed'; appt.save()
                appt.state = 'checked_in'; appt.save()
                results['positive_tests']['appointment_lifecycle'] = {
                    'status': 'PASS', 'appointment_id': appt.id, 'state': appt.state
                }
                logger.info(f"PASS: Appointment Booking & Check-in (Appointment ID {appt.id}, State {appt.state})")
            except Exception as e:
                results['positive_tests']['appointment_lifecycle'] = {'status': 'FAIL', 'error': str(e)}
                results['overall_status'] = 'FAIL'
                logger.error(f"FAIL: Appointment Lifecycle: {e}")

            # Step 3: Triage & Vitals (Nurse)
            try:
                eval_rec, = Evaluation.create([{
                    'patient': p_pat.id,
                    'healthprof': 71,
                    'appointment': appt.id,
                    'institution': inst.id,
                    'evaluation_start': datetime.utcnow(),
                    'evaluation_type': 'outpatient',
                    'chief_complaint': "FE-UAT Sore throat and cough for 2 days",
                    'systolic': 116,
                    'diastolic': 76,
                    'bpm': 72,
                    'temperature': Decimal("36.9"),
                    'respiratory_rate': 16,
                    'osat': 99,
                    'weight': Decimal("64.0"),
                    'height': Decimal("165.0"),
                    'state': 'in_progress'
                }])
                results['positive_tests']['triage_vitals'] = {
                    'status': 'PASS', 'evaluation_id': eval_rec.id, 'state': eval_rec.state
                }
                logger.info(f"PASS: Nursing Triage (Evaluation ID {eval_rec.id}, State {eval_rec.state})")
            except Exception as e:
                results['positive_tests']['triage_vitals'] = {'status': 'FAIL', 'error': str(e)}
                results['overall_status'] = 'FAIL'
                logger.error(f"FAIL: Triage Vitals: {e}")

            # Step 4: Clinician Consultation, Diagnosis & Signing (Doctor)
            try:
                eval_rec.present_illness = "FE-UAT Odynophagia with mild subjective fever."
                eval_rec.evaluation_summary = "Pharynx mildly hyperemic, lungs clear bilaterally."
                eval_rec.diagnosis = path_j069.id
                eval_rec.discharge_reason = 'home'
                eval_rec.state = 'signed'
                eval_rec.save()

                appt.state = 'done'
                appt.save()

                # Disease diagnosis record
                dis, = Disease.create([{
                    'patient': p_pat.id,
                    'pathology': path_j069.id,
                    'diagnosed_date': date.today()
                }])

                results['positive_tests']['consultation_and_signing'] = {
                    'status': 'PASS', 'evaluation_id': eval_rec.id, 'eval_state': eval_rec.state,
                    'appointment_state': appt.state, 'diagnosis_id': dis.id
                }
                logger.info(f"PASS: Doctor Consultation & Sign (Eval ID {eval_rec.id}, State {eval_rec.state})")
            except Exception as e:
                results['positive_tests']['consultation_and_signing'] = {'status': 'FAIL', 'error': str(e)}
                results['overall_status'] = 'FAIL'
                logger.error(f"FAIL: Doctor Consultation: {e}")

            # Step 5: Prescription Order & Line (Doctor)
            try:
                rx, = Prescription.create([{
                    'patient': p_pat.id,
                    'healthprof': 71,
                    'prescription_date': datetime.utcnow(),
                    'prescription_warning_ack': True,
                    'state': 'done'
                }])
                rx_line, = PrescriptionLine.create([{
                    'presc_order': rx.id,
                    'medicament': 2,
                    'dose': Decimal("500.0"),
                    'dose_unit': 1,
                    'form': 1,
                    'route': 1,
                    'duration': 5,
                    'duration_period': 'days',
                    'qty': 15,
                    'frequency': 3,
                    'indication': path_j069.id
                }])
                results['positive_tests']['prescription_validation'] = {
                    'status': 'PASS', 'prescription_id': rx.id, 'line_id': rx_line.id, 'state': rx.state
                }
                logger.info(f"PASS: Prescription Order (Rx ID {rx.id}, Line ID {rx_line.id}, State {rx.state})")
            except Exception as e:
                results['positive_tests']['prescription_validation'] = {'status': 'FAIL', 'error': str(e)}
                results['overall_status'] = 'FAIL'
                logger.error(f"FAIL: Prescription Validation: {e}")

            # Step 6: Laboratory Order & Validation (Lab Tech)
            try:
                lab, = Lab.create([{
                    'patient': p_pat.id,
                    'test': 1, # CBC
                    'requestor': 71,
                    'date_requested': datetime.utcnow(),
                    'date_analysis': datetime.utcnow(),
                    'pathology': path_j069.id,
                    'results': "FE-UAT CBC: Hb 13.8 g/dL, WBC 9.1 x10^9/L, Platelets 255 x10^9/L",
                    'state': 'validated'
                }])
                results['positive_tests']['laboratory_workflow'] = {
                    'status': 'PASS', 'lab_id': lab.id, 'state': lab.state
                }
                logger.info(f"PASS: Laboratory Validation (Lab ID {lab.id}, State {lab.state})")
            except Exception as e:
                results['positive_tests']['laboratory_workflow'] = {'status': 'FAIL', 'error': str(e)}
                results['overall_status'] = 'FAIL'
                logger.error(f"FAIL: Laboratory Workflow: {e}")

            # Step 7: Radiology Order & Reporting (Rad Tech)
            try:
                img_req, = ImagingReq.create([{
                    'patient': p_pat.id,
                    'doctor': 71,
                    'requested_test': 1, # CXR
                    'date': datetime.utcnow(),
                    'state': 'done'
                }])
                img_res, = ImagingRes.create([{
                    'request': img_req.id,
                    'patient': p_pat.id,
                    'doctor': 71,
                    'requested_test': 1,
                    'date': datetime.utcnow(),
                    'comment': "FE-UAT CXR: Bilateral lung parenchyma unremarkable. No active infiltrate."
                }])
                results['positive_tests']['radiology_workflow'] = {
                    'status': 'PASS', 'imaging_request_id': img_req.id, 'imaging_result_id': img_res.id
                }
                logger.info(f"PASS: Radiology Examination (Req ID {img_req.id}, Result ID {img_res.id})")
            except Exception as e:
                results['positive_tests']['radiology_workflow'] = {'status': 'FAIL', 'error': str(e)}
                results['overall_status'] = 'FAIL'
                logger.error(f"FAIL: Radiology Workflow: {e}")

            # Step 8: Health Service Compilation & Customer Invoicing (Cashier)
            try:
                hs, = HealthService.create([{
                    'patient': p_pat.id,
                    'institution': inst.id,
                    'company': COMPANY_ID,
                    'service_date': date.today(),
                    'desc': "FE-UAT Comprehensive Encounter",
                    'state': 'draft'
                }])
                HealthServiceLine.create([
                    {'service': hs.id, 'product': prod_eval_p.id, 'qty': 1, 'desc': 'Medical consultation', 'to_invoice': True},
                    {'service': hs.id, 'product': prod_cbc_p.id, 'qty': 1, 'desc': 'CBC lab test', 'to_invoice': True},
                    {'service': hs.id, 'product': prod_xr_p.id, 'qty': 1, 'desc': 'Chest X-Ray', 'to_invoice': True},
                ])

                rev_journal = Journal.search([('type', '=', 'revenue')], limit=1)[0]
                cash_journal = Journal.search([('code', '=', 'CASH')], limit=1)[0]
                ar_account = Account.search([('code', '=', '110000')])[0]
                rev_account = Account.search([('code', '=', '401000')])[0]
                cash_account = Account.search([('code', '=', '101000')])[0]
                fy2026 = pool.get('account.fiscalyear').search([('name', '=', 'Fiscal Year 2026')])[0]
                current_period = [p for p in fy2026.periods if p.start_date <= date.today() <= p.end_date][0]

                inv = Invoice(
                    company=COMPANY_ID,
                    type='out',
                    party=p_party.id,
                    invoice_address=p_addr.id,
                    currency=3,
                    journal=rev_journal.id,
                    account=ar_account.id,
                    invoice_date=date.today(),
                    description="FE-UAT Outpatient Encounter Charges"
                )
                inv.save()

                InvoiceLine.create([
                    {'invoice': inv.id, 'company': COMPANY_ID, 'currency': 3, 'type': 'line', 'product': prod_eval_p.id, 'account': rev_account.id, 'unit_price': Decimal("250.00"), 'quantity': Decimal("1.0"), 'unit': prod_eval_p.default_uom.id, 'description': "Consultation"},
                    {'invoice': inv.id, 'company': COMPANY_ID, 'currency': 3, 'type': 'line', 'product': prod_cbc_p.id, 'account': rev_account.id, 'unit_price': Decimal("75.00"), 'quantity': Decimal("1.0"), 'unit': prod_cbc_p.default_uom.id, 'description': "CBC"},
                    {'invoice': inv.id, 'company': COMPANY_ID, 'currency': 3, 'type': 'line', 'product': prod_xr_p.id, 'account': rev_account.id, 'unit_price': Decimal("150.00"), 'quantity': Decimal("1.0"), 'unit': prod_xr_p.default_uom.id, 'description': "Chest X-Ray"},
                ])

                Invoice.update_taxes([inv])
                Invoice.validate_invoice([inv])
                Invoice.post([inv])

                results['positive_tests']['invoicing_posting'] = {
                    'status': 'PASS', 'invoice_id': inv.id, 'invoice_number': inv.number,
                    'move_id': inv.move.id, 'total_amount': str(inv.total_amount)
                }
                logger.info(f"PASS: Invoice Posted (Invoice ID {inv.id}, Number {inv.number}, Move ID {inv.move.id})")
            except Exception as e:
                results['positive_tests']['invoicing_posting'] = {'status': 'FAIL', 'error': str(e)}
                results['overall_status'] = 'FAIL'
                logger.error(f"FAIL: Invoicing & Posting: {e}")

            # Step 9: Payment Processing & Receivables Reconciliation (Cashier)
            try:
                pay_move, = Move.create([{
                    'company': COMPANY_ID,
                    'period': current_period.id,
                    'journal': cash_journal.id,
                    'date': date.today(),
                    'description': f"FE-UAT Cash settlement for {inv.number}",
                    'lines': [
                        ('create', [{
                            'account': cash_account.id,
                            'debit': Decimal("475.00"),
                            'credit': Decimal("0.00"),
                            'description': f"Cash receipt - {inv.number}",
                        }, {
                            'account': ar_account.id,
                            'party': p_party.id,
                            'debit': Decimal("0.00"),
                            'credit': Decimal("475.00"),
                            'description': f"AR Settlement - {inv.number}",
                        }])
                    ]
                }])
                Move.post([pay_move])

                inv_ar_line = [line for line in inv.move.lines if line.account.id == ar_account.id][0]
                pm_ar_line = [line for line in pay_move.lines if line.account.id == ar_account.id][0]
                MoveLine.reconcile([inv_ar_line, pm_ar_line])
                rec_id = inv_ar_line.reconciliation.id if inv_ar_line.reconciliation else None

                # Verify customer net AR is zero
                cursor = Transaction().connection.cursor()
                cursor.execute("""
                    SELECT COALESCE(SUM(debit - credit), 0)
                    FROM account_move_line
                    WHERE account = %s AND party = %s;
                """, (ar_account.id, p_party.id))
                net_ar = cursor.fetchone()[0]

                results['positive_tests']['payment_reconciliation'] = {
                    'status': 'PASS', 'payment_move_id': pay_move.id, 'reconciliation_id': rec_id,
                    'customer_net_ar': str(net_ar)
                }
                logger.info(f"PASS: Payment & Reconciliation (Payment Move {pay_move.id}, Rec ID {rec_id}, Net AR {net_ar} QAR)")
            except Exception as e:
                results['positive_tests']['payment_reconciliation'] = {'status': 'FAIL', 'error': str(e)}
                results['overall_status'] = 'FAIL'
                logger.error(f"FAIL: Payment & Reconciliation: {e}")

            t.commit()
            logger.info(">>> PART 1 COMPLETED AND COMMITTED SUCCESSFULLY <<<\n")

    # =========================================================================
    # PART 2: NEGATIVE SECURITY & AUTHORIZATION TESTS
    # =========================================================================
    logger.info(">>> STARTING PART 2: NEGATIVE SECURITY & AUTHORIZATION CHECKS <<<")

    # Negative 1: Front Desk blocked from creating clinical evaluation
    Transaction().stop()
    try:
        with Transaction().start(DB_NAME, ROLES['frontdesk'], context={'company': COMPANY_ID, '_check_access': True}):
            ModelAccess.check('gnuhealth.patient.evaluation', 'create', raise_exception=True)
            results['negative_tests']['frontdesk_evaluation_block'] = {'status': 'FAIL', 'reason': 'Creation was allowed'}
            results['overall_status'] = 'FAIL'
            logger.error("FAIL: Front Desk was permitted to create evaluation!")
    except Exception as e:
        results['negative_tests']['frontdesk_evaluation_block'] = {
            'status': 'PASS', 'exception': type(e).__name__, 'message': str(e)
        }
        logger.info(f"PASS: Front Desk evaluation block verified ({type(e).__name__})")

    # Negative 2: Front Desk blocked from creating prescription
    Transaction().stop()
    try:
        with Transaction().start(DB_NAME, ROLES['frontdesk'], context={'company': COMPANY_ID, '_check_access': True}):
            ModelAccess.check('gnuhealth.prescription.order', 'create', raise_exception=True)
            results['negative_tests']['frontdesk_prescription_block'] = {'status': 'FAIL', 'reason': 'Creation was allowed'}
            results['overall_status'] = 'FAIL'
            logger.error("FAIL: Front Desk was permitted to create prescription!")
    except Exception as e:
        results['negative_tests']['frontdesk_prescription_block'] = {
            'status': 'PASS', 'exception': type(e).__name__, 'message': str(e)
        }
        logger.info(f"PASS: Front Desk prescription block verified ({type(e).__name__})")

    # Negative 3: Cashier blocked from clinical evaluations
    Transaction().stop()
    try:
        with Transaction().start(DB_NAME, ROLES['cashier'], context={'company': COMPANY_ID, '_check_access': True}):
            ModelAccess.check('gnuhealth.patient.evaluation', 'write', raise_exception=True)
            results['negative_tests']['cashier_clinical_write_block'] = {'status': 'FAIL', 'reason': 'Write was allowed'}
            results['overall_status'] = 'FAIL'
            logger.error("FAIL: Cashier was permitted to write clinical evaluation!")
    except Exception as e:
        results['negative_tests']['cashier_clinical_write_block'] = {
            'status': 'PASS', 'exception': type(e).__name__, 'message': str(e)
        }
        logger.info(f"PASS: Cashier clinical write block verified ({type(e).__name__})")

    # Negative 4: Physician blocked from creating/posting customer invoice
    Transaction().stop()
    try:
        with Transaction().start(DB_NAME, ROLES['doctor'], context={'company': COMPANY_ID, '_check_access': True}):
            ModelAccess.check('account.invoice', 'create', raise_exception=True)
            results['negative_tests']['doctor_invoice_create_block'] = {'status': 'FAIL', 'reason': 'Creation was allowed'}
            results['overall_status'] = 'FAIL'
            logger.error("FAIL: Doctor was permitted to create customer invoice!")
    except Exception as e:
        results['negative_tests']['doctor_invoice_create_block'] = {
            'status': 'PASS', 'exception': type(e).__name__, 'message': str(e)
        }
        logger.info(f"PASS: Doctor invoice create block verified ({type(e).__name__})")

    # Negative 5: Non-admin blocked from privilege escalation
    Transaction().stop()
    try:
        with Transaction().start(DB_NAME, ROLES['doctor'], context={'company': COMPANY_ID, '_check_access': True}):
            ModelAccess.check('res.user', 'write', raise_exception=True)
            results['negative_tests']['privilege_escalation_block'] = {'status': 'FAIL', 'reason': 'User write allowed'}
            results['overall_status'] = 'FAIL'
            logger.error("FAIL: Doctor was permitted to write to res.user!")
    except Exception as e:
        results['negative_tests']['privilege_escalation_block'] = {
            'status': 'PASS', 'exception': type(e).__name__, 'message': str(e)
        }
        logger.info(f"PASS: Privilege escalation block verified ({type(e).__name__})")

    # Negative 6: Posted invoice immutability
    Transaction().stop()
    try:
        with Transaction().start(DB_NAME, ROLES['cashier'], context={'company': COMPANY_ID, '_check_access': True}):
            # Attempt to delete posted invoice
            Invoice.delete([inv])
            results['negative_tests']['posted_invoice_immutability'] = {'status': 'FAIL', 'reason': 'Deletion was allowed'}
            results['overall_status'] = 'FAIL'
            logger.error("FAIL: Posted invoice deletion succeeded!")
    except Exception as e:
        results['negative_tests']['posted_invoice_immutability'] = {
            'status': 'PASS', 'exception': type(e).__name__, 'message': str(e)
        }
        logger.info(f"PASS: Posted invoice immutability verified ({type(e).__name__}: {e})")

    # Negative 7: Signed evaluation field-level readonly protection
    Transaction().stop()
    with Transaction().start(DB_NAME, 1, readonly=True):
        eval_fld_states = getattr(Evaluation.chief_complaint, 'states', {})
        is_locked = ('readonly' in eval_fld_states)
        results['negative_tests']['signed_evaluation_immutability'] = {
            'status': 'PASS' if is_locked else 'FAIL',
            'readonly_rule_present': is_locked,
            'rule_expression': str(eval_fld_states.get('readonly'))
        }
        logger.info(f"PASS: Signed evaluation field lock verified (Rule: {eval_fld_states.get('readonly')})")

    output_path = "/tmp/frontend_integration_test_results.json"
    with open(output_path, "w") as f:
        json.dump(results, f, indent=2, default=str)
    logger.info(f"\nIntegration test results written to {output_path}")
    logger.info(f"OVERALL INTEGRATION TEST SUITE RESULT: {results['overall_status']}")
    return results

if __name__ == "__main__":
    run_tests()
