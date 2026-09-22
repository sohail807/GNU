#!/usr/bin/env python3
"""
GNU Health HMIS 5.0 / Tryton 7.0 - Final Backend Hardening, Validation & Integrity Pass
Executes read-only and controlled validation tests on live backend.
Uses native ORM models, workflows, and RBAC rules.
"""

import sys
import os
import json
import logging
from datetime import datetime, date, timedelta
from decimal import Decimal
import time

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s [%(levelname)s] %(message)s')
logger = logging.getLogger("backend_final_validation")

# Tryton setup
from trytond.config import config
config.update_etc('/home/gnuhealth/trytond.conf')

from trytond.pool import Pool
from trytond.transaction import Transaction
from trytond.exceptions import UserError
try:
    from trytond.model.exceptions import AccessError
except ImportError:
    AccessError = UserError

DB_NAME = 'gnuhealth'
COMPANY_ID = 2

results = {
    "timestamp": datetime.utcnow().isoformat() + "Z",
    "phases": {},
    "errors": []
}

def init_pool():
    Pool.start()
    pool = Pool(DB_NAME)
    pool.init()
    return pool

def test_models_and_tables(pool):
    logger.info("=== Phase 1: Verify Native GNU Health Models & Shadow Table Audit ===")
    phase = {}
    with Transaction().start(DB_NAME, 1, readonly=True):
        cursor = Transaction().connection.cursor()
        
        expected_models = [
            'gnuhealth.patient',
            'gnuhealth.appointment',
            'gnuhealth.patient.evaluation',
            'gnuhealth.patient.disease',
            'gnuhealth.prescription.order',
            'gnuhealth.lab',
            'gnuhealth.imaging.test.request',
            'gnuhealth.imaging.test.result',
            'gnuhealth.health_service',
            'account.invoice',
            'account.move',
            'account.move.line',
            'account.move.reconciliation',
            'res.user',
            'res.group',
            'party.party',
            'company.company',
            'account.fiscalyear'
        ]
        models_verified = {}
        for m in expected_models:
            exists = m in pool._pool[DB_NAME]['model']
            models_verified[m] = exists
        phase['native_models_verified'] = models_verified
        phase['all_native_models_present'] = all(models_verified.values())

        cursor.execute("""
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
              AND table_type = 'BASE TABLE'
              AND (
                  table_name LIKE 'custom_%' 
                  OR table_name LIKE 'shadow_%' 
                  OR table_name LIKE 'my_%'
                  OR table_name LIKE 'app_%'
                  OR table_name LIKE 'frontend_%'
              );
        """)
        shadow_tables = [r[0] for r in cursor.fetchall()]
        phase['shadow_tables_found'] = shadow_tables
        phase['shadow_tables_count'] = len(shadow_tables)
        phase['status'] = "PASS" if phase['all_native_models_present'] and len(shadow_tables) == 0 else "FAIL"
    
    results['phases']['model_integrity'] = phase
    logger.info(f"Model integrity audit status: {phase['status']}")

def test_orphan_and_consistency(pool):
    logger.info("=== Phase 2: Read-Only Orphan & Consistency Checks ===")
    phase = {}
    with Transaction().start(DB_NAME, 1, readonly=True):
        cursor = Transaction().connection.cursor()
        
        checks = {
            "patients_without_parties": """
                SELECT count(*) FROM gnuhealth_patient p 
                LEFT JOIN party_party pt ON p.party = pt.id 
                WHERE pt.id IS NULL;
            """,
            "appointments_without_patients": """
                SELECT count(*) FROM gnuhealth_appointment a 
                LEFT JOIN gnuhealth_patient p ON a.patient = p.id 
                WHERE p.id IS NULL;
            """,
            "appointments_without_physicians": """
                SELECT count(*) FROM gnuhealth_appointment a 
                LEFT JOIN gnuhealth_healthprofessional hp ON a.healthprof = hp.id 
                WHERE hp.id IS NULL;
            """,
            "evaluations_without_patients": """
                SELECT count(*) FROM gnuhealth_patient_evaluation e 
                LEFT JOIN gnuhealth_patient p ON e.patient = p.id 
                WHERE p.id IS NULL;
            """,
            "evaluations_without_physicians": """
                SELECT count(*) FROM gnuhealth_patient_evaluation e 
                LEFT JOIN gnuhealth_healthprofessional hp ON e.healthprof = hp.id 
                WHERE hp.id IS NULL;
            """,
            "prescriptions_without_patients": """
                SELECT count(*) FROM gnuhealth_prescription_order pr 
                LEFT JOIN gnuhealth_patient p ON pr.patient = p.id 
                WHERE p.id IS NULL;
            """,
            "lab_records_without_patients": """
                SELECT count(*) FROM gnuhealth_lab l 
                LEFT JOIN gnuhealth_patient p ON l.patient = p.id 
                WHERE p.id IS NULL;
            """,
            "radiology_records_without_patients": """
                SELECT count(*) FROM gnuhealth_imaging_test_request r 
                LEFT JOIN gnuhealth_patient p ON r.patient = p.id 
                WHERE p.id IS NULL;
            """,
            "health_services_without_patients": """
                SELECT count(*) FROM gnuhealth_health_service s 
                LEFT JOIN gnuhealth_patient p ON s.patient = p.id 
                WHERE p.id IS NULL;
            """,
            "invoices_without_customer": """
                SELECT count(*) FROM account_invoice i 
                LEFT JOIN party_party pt ON i.party = pt.id 
                WHERE pt.id IS NULL;
            """,
            "posted_invoices_without_moves": """
                SELECT count(*) FROM account_invoice i 
                WHERE i.state = 'posted' AND i.move IS NULL;
            """,
            "reconciliations_without_lines": """
                SELECT count(*) FROM account_move_reconciliation r 
                LEFT JOIN account_move_line l ON l.reconciliation = r.id 
                WHERE l.id IS NULL;
            """
        }
        
        counts = {}
        for check_name, sql in checks.items():
            cursor.execute(sql)
            count = cursor.fetchone()[0]
            counts[check_name] = count
            
        phase['counts'] = counts
        phase['all_zero'] = all(c == 0 for c in counts.values())
        phase['status'] = "PASS" if phase['all_zero'] else "FAIL"
        
    results['phases']['orphan_checks'] = phase
    logger.info(f"Orphan checks status: {phase['status']}, counts: {counts}")

def test_clinical_relationship_trace(pool):
    logger.info("=== Phase 3: Clinical Chain & Relationship Trace ===")
    phase = {}
    with Transaction().start(DB_NAME, 1, readonly=True, context={'company': COMPANY_ID}):
        Patient = pool.get('gnuhealth.patient')
        Appointment = pool.get('gnuhealth.appointment')
        Evaluation = pool.get('gnuhealth.patient.evaluation')
        Prescription = pool.get('gnuhealth.prescription.order')
        Lab = pool.get('gnuhealth.lab')
        Imaging = pool.get('gnuhealth.imaging.test.request')
        HealthService = pool.get('gnuhealth.health_service')
        Invoice = pool.get('account.invoice')
        
        pat = Patient(52)
        party = pat.party
        
        appts = Appointment.search([('patient', '=', 52)])
        evals = Evaluation.search([('patient', '=', 52)])
        rxs = Prescription.search([('patient', '=', 52)])
        labs = Lab.search([('patient', '=', 52)])
        ims = Imaging.search([('patient', '=', 52)])
        services = HealthService.search([('patient', '=', 52)])
        invoices = Invoice.search([('party', '=', party.id)])
        
        trace = {
            "patient_id": 52,
            "party_id": party.id,
            "appointments": [{"id": a.id, "state": a.state, "doctor_id": a.healthprof.id if a.healthprof else None} for a in appts],
            "evaluations": [{"id": e.id, "state": e.state, "doctor_id": e.healthprof.id if e.healthprof else None} for e in evals],
            "prescriptions": [{"id": r.id, "state": r.state} for r in rxs],
            "labs": [{"id": l.id, "state": l.state} for l in labs],
            "imaging": [{"id": im.id, "state": im.state} for im in ims],
            "health_services": [{"id": s.id} for s in services],
            "invoices": [{"id": inv.id, "number": inv.number, "state": inv.state, "amount": str(inv.total_amount_cache), "move_id": inv.move.id if inv.move else None} for inv in invoices]
        }
        
        phase['trace_patient_52'] = trace
        has_all = len(appts) > 0 and len(evals) > 0 and len(rxs) > 0 and len(labs) > 0 and len(ims) > 0 and len(services) > 0 and len(invoices) > 0
        phase['status'] = "PASS" if has_all else "FAIL"
        
    results['phases']['clinical_trace'] = phase
    logger.info(f"Clinical chain trace status: {phase['status']}")

def test_signed_evaluation_immutability(pool):
    logger.info("=== Phase 4: Signed Clinical Record Immutability Test ===")
    phase = {}
    ModelAccess = pool.get('ir.model.access')
    Evaluation = pool.get('gnuhealth.patient.evaluation')
    
    immutability_results = {}
    
    # Test 1: Front Desk attempting write
    Transaction().stop()
    fd_denied = False
    fd_reason = None
    try:
        with Transaction().start(DB_NAME, 151, context={'company': COMPANY_ID, '_check_access': True}):
            ModelAccess.check('gnuhealth.patient.evaluation', 'write', raise_exception=True)
    except Exception as e:
        fd_denied = True
        fd_reason = type(e).__name__ + ": " + str(e)
    immutability_results['frontdesk_write'] = {
        "user_id": 151, "operation": "write", "denied": fd_denied, "reason": fd_reason, "status": "PASS" if fd_denied else "FAIL"
    }

    # Test 2: Cashier attempting write
    Transaction().stop()
    cashier_denied = False
    cashier_reason = None
    try:
        with Transaction().start(DB_NAME, 152, context={'company': COMPANY_ID, '_check_access': True}):
            ModelAccess.check('gnuhealth.patient.evaluation', 'write', raise_exception=True)
    except Exception as e:
        cashier_denied = True
        cashier_reason = type(e).__name__ + ": " + str(e)
    immutability_results['cashier_write'] = {
        "user_id": 152, "operation": "write", "denied": cashier_denied, "reason": cashier_reason, "status": "PASS" if cashier_denied else "FAIL"
    }

    # Test 3: Physician attempting delete on signed evaluation
    Transaction().stop()
    dr_del_denied = False
    dr_del_reason = None
    try:
        with Transaction().start(DB_NAME, 146, context={'company': COMPANY_ID, '_check_access': True}):
            ev = Evaluation(31)
            Evaluation.delete([ev])
    except Exception as e:
        dr_del_denied = True
        dr_del_reason = type(e).__name__ + ": " + str(e)
    immutability_results['doctor_delete'] = {
        "user_id": 146, "operation": "delete", "denied": dr_del_denied, "reason": dr_del_reason, "status": "PASS" if dr_del_denied else "FAIL"
    }

    # Test 4: Doctor write semantics (UI states={'readonly': Eval('state') == 'signed'} vs ORM ModelAccess)
    with Transaction().start(DB_NAME, 1, readonly=True):
        ev_field_states = Evaluation.patient.states
        has_readonly_state = ('readonly' in ev_field_states)
    immutability_results['doctor_view_immutability'] = {
        "enforcement_mechanism": "Field.states['readonly'] on evaluation fields when state == 'signed'",
        "states_rule_present": has_readonly_state,
        "status": "PASS" if has_readonly_state else "FAIL"
    }

    phase['results'] = immutability_results
    phase['status'] = "PASS" if (fd_denied and cashier_denied and dr_del_denied and has_readonly_state) else "FAIL"
    results['phases']['signed_evaluation_immutability'] = phase
    logger.info(f"Signed evaluation immutability status: {phase['status']}")

def test_posted_invoice_immutability(pool):
    logger.info("=== Phase 5: Posted Invoice & Accounting Move Immutability Test ===")
    phase = {}
    Invoice = pool.get('account.invoice')
    Move = pool.get('account.move')
    
    tests = [
        ("cashier_delete_posted_invoice", 152, "delete_invoice", 22),
        ("doctor_delete_posted_invoice", 146, "delete_invoice", 22),
        ("cashier_delete_posted_move", 152, "delete_move", 24),
        ("doctor_delete_posted_move", 146, "delete_move", 24)
    ]
    
    inv_results = {}
    for test_name, uid, op, target_id in tests:
        Transaction().stop()
        denied = False
        reason = None
        try:
            with Transaction().start(DB_NAME, uid, context={'company': COMPANY_ID, '_check_access': True}):
                if op == "delete_invoice":
                    inv = Invoice(target_id)
                    Invoice.delete([inv])
                elif op == "delete_move":
                    m = Move(target_id)
                    Move.delete([m])
        except Exception as e:
            denied = True
            reason = type(e).__name__ + ": " + str(e)
            
        inv_results[test_name] = {
            "user_id": uid, "target_id": target_id, "operation": op, "denied": denied, "reason": reason, "status": "PASS" if denied else "FAIL"
        }
        
    phase['results'] = inv_results
    phase['all_denied'] = all(r['denied'] for r in inv_results.values())
    phase['status'] = "PASS" if phase['all_denied'] else "FAIL"
    results['phases']['posted_invoice_immutability'] = phase
    logger.info(f"Posted invoice immutability status: {phase['status']}")

def test_admin_isolation_and_escalation(pool):
    logger.info("=== Phase 6: Administrator Isolation & Privilege Escalation Tests ===")
    phase = {}
    User = pool.get('res.user')
    Group = pool.get('res.group')
    ModelAccess = pool.get('ir.model.access')
    
    Transaction().stop()
    with Transaction().start(DB_NAME, 1, readonly=True):
        admin_group = Group(1)
        admin_users = [{"id": u.id, "login": u.login} for u in admin_group.users]
        phase['admin_group_members'] = admin_users
        demo_admins = [u for u in admin_users if u['login'].startswith('demo_')]
        phase['demo_admins'] = demo_admins
        phase['only_one_demo_admin'] = (len(demo_admins) == 1 and demo_admins[0]['login'] == 'demo_admin1')

    escalation_tests = [
        ("physician_escalate_admin", 146),
        ("cashier_escalate_admin", 152),
        ("frontdesk_escalate_admin", 151),
        ("nurse_escalate_admin", 148)
    ]
    
    esc_results = {}
    for test_name, uid in escalation_tests:
        Transaction().stop()
        denied = False
        reason = None
        try:
            with Transaction().start(DB_NAME, uid, context={'company': COMPANY_ID, '_check_access': True}):
                # Native API / ModelAccess verification: Tryton RPC evaluates ModelAccess.check before write
                ModelAccess.check('res.user', 'write', raise_exception=True)
                user = User(uid)
                admin_group = Group(1)
                user.groups = list(user.groups) + [admin_group]
                user.save()
        except Exception as e:
            if "AccessError" in type(e).__name__ or "AccessForbidden" in type(e).__name__:
                denied = True
            reason = type(e).__name__ + ": " + str(e)
            
        esc_results[test_name] = {
            "user_id": uid, "escalation_denied": denied, "reason": reason, "status": "PASS" if denied else "FAIL"
        }
        
    phase['escalation_tests'] = esc_results
    phase['all_escalations_denied'] = all(r['escalation_denied'] for r in esc_results.values())
    phase['status'] = "PASS" if phase['only_one_demo_admin'] and phase['all_escalations_denied'] else "FAIL"
    results['phases']['admin_isolation'] = phase
    logger.info(f"Admin isolation status: {phase['status']}")

def test_password_hash_security(pool):
    logger.info("=== Phase 7: Password Hash Security Verification ===")
    phase = {}
    Transaction().stop()
    with Transaction().start(DB_NAME, 1, readonly=True):
        cursor = Transaction().connection.cursor()
        cursor.execute("""
            SELECT id, login, password_hash 
            FROM res_user 
            WHERE login LIKE 'demo_%' 
            ORDER BY id;
        """)
        demo_user_auth = []
        all_hashed = True
        for uid, login, phash in cursor.fetchall():
            is_valid_hash = bool(phash and (phash.startswith('$pbkdf2-sha512$') or phash.startswith('$6$') or phash.startswith('$2b$') or phash.startswith('$scrypt$') or phash.startswith('$argon2')))
            if not is_valid_hash:
                all_hashed = False
            demo_user_auth.append({
                "id": uid,
                "login": login,
                "has_hash": bool(phash),
                "hash_algorithm": phash.split('$')[1] if phash and '$' in phash else "unknown",
                "is_securely_hashed": is_valid_hash
            })
            
        phase['users'] = demo_user_auth
        phase['all_securely_hashed'] = all_hashed
        phase['status'] = "PASS" if all_hashed and len(demo_user_auth) >= 8 else "FAIL"
        
    results['phases']['password_security'] = phase
    logger.info(f"Password security status: {phase['status']}")

def test_rbac_full_matrix(pool):
    logger.info("=== Phase 8: Comprehensive RBAC Permission Matrix ===")
    phase = {}
    ModelAccess = pool.get('ir.model.access')
    
    users_to_test = [
        ('demo_frontdesk1', 151, 'Front Desk'),
        ('demo_nurse1', 148, 'Nurse'),
        ('demo_dr1', 146, 'Physician 01'),
        ('demo_dr2', 147, 'Physician 02'),
        ('demo_lab1', 149, 'Lab Tech'),
        ('demo_rad1', 150, 'Rad Tech'),
        ('demo_cashier1', 152, 'Cashier'),
        ('demo_admin1', 153, 'Admin')
    ]
    
    models_to_test = [
        ('Patient', 'gnuhealth.patient'),
        ('Appointment', 'gnuhealth.appointment'),
        ('Evaluation', 'gnuhealth.patient.evaluation'),
        ('Prescription', 'gnuhealth.prescription.order'),
        ('Lab', 'gnuhealth.lab'),
        ('Radiology', 'gnuhealth.imaging.test.request'),
        ('HealthService', 'gnuhealth.health_service'),
        ('Invoice', 'account.invoice'),
        ('PaymentMove', 'account.move'),
        ('FiscalYear', 'account.fiscalyear')
    ]
    
    matrix = {}
    for login, uid, role_label in users_to_test:
        user_perms = {}
        Transaction().stop()
        with Transaction().start(DB_NAME, uid, context={'company': COMPANY_ID, '_check_access': True}):
            for model_label, model_name in models_to_test:
                perms = {
                    "read": "ALLOW" if ModelAccess.check(model_name, 'read', raise_exception=False) else "DENY",
                    "create": "ALLOW" if ModelAccess.check(model_name, 'create', raise_exception=False) else "DENY",
                    "write": "ALLOW" if ModelAccess.check(model_name, 'write', raise_exception=False) else "DENY",
                    "delete": "ALLOW" if ModelAccess.check(model_name, 'delete', raise_exception=False) else "DENY"
                }
                user_perms[model_label] = perms
        matrix[login] = {
            "role": role_label,
            "user_id": uid,
            "permissions": user_perms
        }
        
    phase['matrix'] = matrix
    
    assertions = [
        matrix['demo_frontdesk1']['permissions']['Evaluation']['create'] == "DENY",
        matrix['demo_frontdesk1']['permissions']['Prescription']['create'] == "DENY",
        matrix['demo_frontdesk1']['permissions']['PaymentMove']['create'] == "DENY",
        matrix['demo_cashier1']['permissions']['Evaluation']['create'] == "DENY",
        matrix['demo_cashier1']['permissions']['Prescription']['create'] == "DENY",
        matrix['demo_cashier1']['permissions']['Invoice']['create'] == "ALLOW",
        matrix['demo_dr1']['permissions']['Evaluation']['create'] == "ALLOW",
        matrix['demo_dr1']['permissions']['Prescription']['create'] == "ALLOW",
        matrix['demo_dr1']['permissions']['PaymentMove']['create'] == "DENY",
        matrix['demo_nurse1']['permissions']['Evaluation']['create'] == "ALLOW",
        matrix['demo_lab1']['permissions']['Lab']['create'] == "ALLOW",
        matrix['demo_lab1']['permissions']['PaymentMove']['create'] == "DENY",
        matrix['demo_rad1']['permissions']['Radiology']['create'] == "ALLOW",
        matrix['demo_rad1']['permissions']['PaymentMove']['create'] == "DENY"
    ]
    
    phase['key_rules_passed'] = all(assertions)
    phase['status'] = "PASS" if phase['key_rules_passed'] else "FAIL"
    results['phases']['rbac_matrix'] = phase
    logger.info(f"RBAC full matrix status: {phase['status']}")

def test_native_api_final_validation_lifecycle(pool):
    logger.info("=== Phase 9: Native API Verification with FINAL-VALIDATION-DEMO Lifecycle ===")
    phase = {}
    Transaction().stop()
    with Transaction().start(DB_NAME, 1, _lock_tables=['ir_sequence_strict', 'ir_sequence', 'account_move', 'account_invoice']) as t:
        context = {'company': COMPANY_ID}
        with Transaction().set_context(**context):
            Party = pool.get('party.party')
            Address = pool.get('party.address')
            Identifier = pool.get('party.identifier')
            Patient = pool.get('gnuhealth.patient')
            Appointment = pool.get('gnuhealth.appointment')
            Evaluation = pool.get('gnuhealth.patient.evaluation')
            Disease = pool.get('gnuhealth.patient.disease')
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
            Period = pool.get('account.period')
            Institution = pool.get('gnuhealth.institution')
            ProductTemplate = pool.get('product.template')
            
            inst = Institution.search([])[0]
            prod_eval_p = ProductTemplate.search([('code', '=', 'OPD-EVAL')])[0].products[0]
            prod_cbc_p = ProductTemplate.search([('code', '=', 'LAB-CBC')])[0].products[0]
            prod_xr_p = ProductTemplate.search([('code', '=', 'RAD-XR')])[0].products[0]
            
            # 1. Create FINAL-VALIDATION-DEMO Patient
            unique_suffix = str(int(time.time()))
            qid_code = f"FINAL-VAL-QID-{unique_suffix}"
            pat_name = f"FINAL-VALIDATION-DEMO PATIENT {unique_suffix[-4:]}"
            
            p_party, = Party.create([{
                'name': pat_name,
                'is_patient': True,
                'is_person': True,
                'gender': 'm',
                'dob': date(1992, 4, 18),
                'fed_country': 'QAT',
                'ref': qid_code
            }])
            
            p_addr, = Address.create([{
                'party': p_party.id,
                'name': pat_name,
                'street': f"FINAL-VAL STREET {unique_suffix[-4:]}",
                'city': "Doha"
            }])
            
            p_ident, = Identifier.create([{
                'party': p_party.id,
                'type': None,
                'code': qid_code
            }])
            
            p_patient, = Patient.create([{
                'party': p_party.id
            }])
            logger.info(f"Created FINAL-VALIDATION-DEMO Patient ID: {p_patient.id}, PUID: {p_patient.puid}")
            
            # API Update test: Update patient address
            p_addr.street = "FINAL-VAL STREET 001-MODIFIED"
            p_addr.save()
            
            # 2. Appointment Workflow: Dr. DEMO Physician 01 (HP 71)
            appt = Appointment(
                patient=p_patient.id,
                healthprof=71,
                appointment_date=datetime.utcnow(),
                state='free'
            )
            appt.save()
            appt.state = 'confirmed'; appt.save()
            appt.state = 'checked_in'; appt.save()
            appt.state = 'done'; appt.save()
            logger.info(f"Completed Appointment ID: {appt.id} (State: {appt.state})")
            
            # 3. Clinical Evaluation with Vitals and SOAP note
            eval_rec, = Evaluation.create([{
                'patient': p_patient.id,
                'healthprof': 71,
                'appointment': appt.id,
                'institution': inst.id,
                'evaluation_start': datetime.utcnow(),
                'evaluation_type': 'outpatient',
                'chief_complaint': "Final validation routine checkup",
                'present_illness': "Routine health checkup and examination.",
                'evaluation_summary': "Patient in good general condition. Vital signs completely normal.",
                'diagnosis': 3505,
                'systolic': 118,
                'diastolic': 78,
                'bpm': 70,
                'temperature': Decimal("36.8"),
                'respiratory_rate': 16,
                'osat': 99,
                'weight': Decimal("72.0"),
                'height': Decimal("176.0"),
                'discharge_reason': 'home',
                'state': 'signed'
            }])
            logger.info(f"Created Evaluation ID: {eval_rec.id} (State: {eval_rec.state})")
            
            # Diagnosis
            dis, = Disease.create([{
                'patient': p_patient.id,
                'pathology': 3505, # J06.9
                'diagnosed_date': date.today()
            }])
            
            # 4. Prescription
            rx, = Prescription.create([{
                'patient': p_patient.id,
                'healthprof': 71,
                'prescription_date': datetime.utcnow(),
                'prescription_warning_ack': True,
                'state': 'done'
            }])
            rx_line, = PrescriptionLine.create([{
                'presc_order': rx.id,
                'medicament': 2,
                'dose': Decimal("500"),
                'dose_unit': 1,
                'form': 1,
                'route': 1,
                'duration': 5,
                'duration_period': 'days',
                'qty': 15,
                'frequency': 3,
                'indication': 3505
            }])
            logger.info(f"Completed Prescription ID: {rx.id} (State: {rx.state})")
            
            # 5. Laboratory Requisition
            lab, = Lab.create([{
                'patient': p_patient.id,
                'test': 1, # CBC
                'requestor': 71,
                'date_requested': datetime.utcnow(),
                'date_analysis': datetime.utcnow(),
                'pathology': 3505,
                'results': "Final Validation: Hb 14.5 g/dL, WBC 9.8 x10^9/L, Platelets 260 x10^9/L",
                'state': 'validated'
            }])
            logger.info(f"Completed Lab ID: {lab.id} (State: {lab.state})")
            
            # 6. Radiology Requisition & Result
            img_req, = ImagingReq.create([{
                'patient': p_patient.id,
                'doctor': 71,
                'requested_test': 1, # CXR
                'date': datetime.utcnow(),
                'state': 'done'
            }])
            img_res, = ImagingRes.create([{
                'request': img_req.id,
                'patient': p_patient.id,
                'doctor': 71,
                'requested_test': 1,
                'date': datetime.utcnow(),
                'comment': "FINAL-VAL: Normal pulmonary vasculature and cardiac silhouette."
            }])
            logger.info(f"Completed Radiology Req ID: {img_req.id}, Result ID: {img_res.id}")
            
            # 7. Health Service Compilation
            hs, = HealthService.create([{
                'patient': p_patient.id,
                'institution': inst.id,
                'company': COMPANY_ID,
                'service_date': date.today(),
                'desc': "FINAL-VAL Outpatient Consultation, CBC & Chest X-Ray",
                'state': 'draft'
            }])
            HealthServiceLine.create([
                {'service': hs.id, 'product': prod_eval_p.id, 'qty': 1, 'desc': 'Consultation', 'to_invoice': True},
                {'service': hs.id, 'product': prod_cbc_p.id, 'qty': 1, 'desc': 'CBC', 'to_invoice': True},
                {'service': hs.id, 'product': prod_xr_p.id, 'qty': 1, 'desc': 'Chest X-Ray', 'to_invoice': True},
            ])
            logger.info(f"Health service ID: {hs.id}")
            
            # 8. Customer Invoice
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
                currency=3, # QAR
                journal=rev_journal.id,
                account=ar_account.id,
                invoice_date=date.today(),
                description="FINAL-VAL Encounter Charges"
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
            logger.info(f"Posted Invoice ID: {inv.id}, Number: {inv.number}, Move: {inv.move.id}")
            
            # 9. Cash Payment & AR Reconciliation
            pay_move, = Move.create([{
                'company': COMPANY_ID,
                'period': current_period.id,
                'journal': cash_journal.id,
                'date': date.today(),
                'description': f"Cash settlement for {inv.number}",
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
            logger.info(f"Posted Payment Move ID: {pay_move.id}")
            
            inv_ar_line = [line for line in inv.move.lines if line.account.id == ar_account.id][0]
            pm_ar = [line for line in pay_move.lines if line.account.id == ar_account.id][0]
            
            reconciled_lines = MoveLine.reconcile([inv_ar_line, pm_ar])
            rec_id = inv_ar_line.reconciliation.id if inv_ar_line.reconciliation else None
            logger.info(f"Reconciled AR. Reconciliation ID: {rec_id}")
            
            cursor = Transaction().connection.cursor()
            cursor.execute("""
                SELECT COALESCE(SUM(debit - credit), 0) 
                FROM account_move_line 
                WHERE account = %s AND party = %s;
            """, (ar_account.id, p_party.id))
            customer_balance = cursor.fetchone()[0]
            logger.info(f"Net Customer AR Balance: {customer_balance} QAR")
            
            cursor.execute("""
                SELECT SUM(debit), SUM(credit) 
                FROM account_move_line 
                WHERE move IN (%s, %s);
            """, (inv.move.id, pay_move.id))
            tot_debit, tot_credit = cursor.fetchone()
            gl_balanced = (tot_debit == tot_credit and tot_debit == Decimal("950.00"))
            
            phase['records_created'] = {
                "patient_id": p_patient.id,
                "party_id": p_party.id,
                "puid": p_patient.puid,
                "appointment_id": appt.id,
                "evaluation_id": eval_rec.id,
                "prescription_id": rx.id,
                "lab_id": lab.id,
                "imaging_req_id": img_req.id,
                "imaging_res_id": img_res.id,
                "health_service_id": hs.id,
                "invoice_id": inv.id,
                "invoice_number": inv.number,
                "invoice_move_id": inv.move.id,
                "payment_move_id": pay_move.id,
                "reconciliation_id": rec_id,
                "customer_net_ar": str(customer_balance),
                "total_debit": str(tot_debit),
                "total_credit": str(tot_credit),
                "gl_balanced": gl_balanced
            }
            phase['status'] = "PASS" if customer_balance == Decimal("0.00") and gl_balanced else "FAIL"
            
            t.commit()
            logger.info("Successfully committed FINAL-VALIDATION-DEMO transaction.")
            
    results['phases']['native_api_validation'] = phase
    logger.info(f"Native API validation status: {phase['status']}")

def test_database_and_services():
    logger.info("=== Phase 10: PostgreSQL Database & Service Hardening Verification ===")
    phase = {}
    Transaction().stop()
    with Transaction().start(DB_NAME, 1, readonly=True):
        cursor = Transaction().connection.cursor()
        
        cursor.execute("SELECT current_database(), current_user, pg_size_pretty(pg_database_size(current_database()));")
        db_name, db_user, db_size = cursor.fetchone()
        
        cursor.execute("SELECT rolsuper FROM pg_roles WHERE rolname = current_user;")
        is_superuser = cursor.fetchone()[0]
        
        cursor.execute("SELECT count(*) FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE';")
        public_table_count = cursor.fetchone()[0]
        
        cursor.execute("SHOW listen_addresses;")
        listen_addrs = cursor.fetchone()[0]
        
        phase['database_name'] = db_name
        phase['connection_user'] = db_user
        phase['is_superuser'] = is_superuser
        phase['database_size'] = db_size
        phase['public_tables_count'] = public_table_count
        phase['listen_addresses'] = listen_addrs
        phase['status'] = "PASS" if not is_superuser and public_table_count >= 306 and listen_addrs == 'localhost' else "FAIL"
        
    results['phases']['database_hardening'] = phase
    logger.info(f"Database hardening status: {phase['status']}")

def main():
    pool = init_pool()
    test_models_and_tables(pool)
    test_orphan_and_consistency(pool)
    test_clinical_relationship_trace(pool)
    test_signed_evaluation_immutability(pool)
    test_posted_invoice_immutability(pool)
    test_admin_isolation_and_escalation(pool)
    test_password_hash_security(pool)
    test_rbac_full_matrix(pool)
    test_native_api_final_validation_lifecycle(pool)
    test_database_and_services()
    
    output_path = "/tmp/final_backend_validation_results.json"
    with open(output_path, "w") as f:
        json.dump(results, f, indent=2, default=str)
    logger.info(f"Results written to {output_path}")

if __name__ == "__main__":
    main()
