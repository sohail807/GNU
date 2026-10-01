"""IST Health: hospital operations workflows that GNU Health does not ship, as native Tryton records.

* Emergency department visit      (ist.ops.ed_visit)        arrival -> triage -> treatment -> disposition
* Admission plan                  (ist.ops.admission_plan)  cost estimate -> advance deposit -> ready -> admitted
* Discharge clearance             (ist.ops.discharge)       medical / nursing / pharmacy / billing / insurance sign-offs
* Inter-hospital referral         (ist.ops.referral)        request -> accepted / declined -> completed
* Pharmacy stock                  (ist.ops.stock)           batch, expiry, quantity and reorder level per hospital

They sit beside the native patient, inpatient registration, institution and medicament records; nothing is duplicated.
State changes are checked here, so every screen and every API call obeys the same rules.
"""
from datetime import datetime
from decimal import Decimal

from trytond.exceptions import UserError
from trytond.model import ModelSQL, ModelView, fields
from trytond.pool import Pool
from trytond.pyson import Eval
from trytond.transaction import Transaction


def _company():
    return Transaction().context.get('company')


def _now():
    return datetime.now()


class _Workflow:
    """State-machine helper shared by the models below: TRANSITIONS maps a state to the states it may move to."""
    TRANSITIONS = {}
    LABEL = 'record'
    PREFIX = 'XX'

    @classmethod
    def _check(cls, old, new):
        if new not in cls.TRANSITIONS.get(old, set()):
            raise UserError('A %s cannot go from %s to %s.' % (cls.LABEL, old, new))

    @classmethod
    def _on_transition(cls, record, new_state, vals):
        """Hook: add timestamps etc. to `vals` when `record` moves to `new_state`."""

    @classmethod
    def create(cls, vlist):
        records = super().create(vlist)
        for record in records:
            super(_Workflow, cls).write([record], {'reference': '%s-%06d' % (cls.PREFIX, record.id)})
        return records

    @classmethod
    def write(cls, *args):
        actions = iter(args)
        for records, values in zip(actions, actions):
            new_state = values.get('state')
            for record in records:
                vals = dict(values)
                if new_state and new_state != record.state:
                    cls._check(record.state, new_state)
                    cls._on_transition(record, new_state, vals)
                super(_Workflow, cls).write([record], vals)


# --------------------------------------------------------------------------------------------- emergency

TRIAGE_TARGET_MINUTES = {'1': 0, '2': 10, '3': 30, '4': 60, '5': 120}


class EDVisit(_Workflow, ModelSQL, ModelView):
    'Emergency Department Visit'
    __name__ = 'ist.ops.ed_visit'
    _rec_name = 'reference'
    LABEL = 'emergency visit'
    PREFIX = 'ED'
    TRANSITIONS = {
        'waiting': {'triaged', 'left'},
        'triaged': {'in_treatment', 'left'},
        'in_treatment': {'observation', 'admitted', 'discharged', 'transferred'},
        'observation': {'in_treatment', 'admitted', 'discharged', 'transferred'},
        'admitted': set(), 'discharged': set(), 'transferred': set(), 'left': set(),
    }

    reference = fields.Char('Reference', readonly=True)
    patient = fields.Many2One('gnuhealth.patient', 'Patient', required=True)
    company = fields.Many2One('company.company', 'Company', required=True)
    institution = fields.Many2One('gnuhealth.institution', 'Hospital')
    arrival_mode = fields.Selection([
        ('walk_in', 'Walk-in'), ('ambulance', 'Ambulance'), ('referred', 'Referred'), ('police', 'Police / other'),
    ], 'Arrival', required=True)
    complaint = fields.Char('Presenting complaint', required=True)
    triage_level = fields.Selection([
        (None, ''), ('1', '1 Resuscitation'), ('2', '2 Emergent'), ('3', '3 Urgent'), ('4', '4 Less urgent'), ('5', '5 Non-urgent'),
    ], 'Triage level', states={'required': ~Eval('state').in_(['waiting', 'left'])})
    triage_note = fields.Char('Triage note (vitals / findings)')
    doctor = fields.Many2One('gnuhealth.healthprofessional', 'Doctor')
    bay = fields.Char('Bay / bed')
    state = fields.Selection([
        ('waiting', 'Waiting for triage'), ('triaged', 'Triaged, waiting for doctor'), ('in_treatment', 'In treatment'),
        ('observation', 'Under observation'), ('admitted', 'Admitted'), ('discharged', 'Discharged'),
        ('transferred', 'Transferred'), ('left', 'Left without being seen'),
    ], 'State', required=True, readonly=True)
    arrived_at = fields.DateTime('Arrived', required=True)
    triaged_at = fields.DateTime('Triaged', readonly=True)
    seen_at = fields.DateTime('Seen by doctor', readonly=True)
    closed_at = fields.DateTime('Left the department', readonly=True)
    disposition_note = fields.Text('Disposition / diagnosis')
    admission = fields.Many2One('gnuhealth.inpatient.registration', 'Inpatient admission')

    @classmethod
    def __setup__(cls):
        super().__setup__()
        cls._order = [('id', 'DESC')]

    @staticmethod
    def default_state():
        return 'waiting'

    @staticmethod
    def default_company():
        return _company()

    @staticmethod
    def default_arrived_at():
        return _now()

    @staticmethod
    def default_arrival_mode():
        return 'walk_in'

    @classmethod
    def _on_transition(cls, record, new_state, vals):
        now = _now()
        if new_state == 'triaged':
            vals['triaged_at'] = now
        elif new_state == 'in_treatment' and not record.seen_at:
            vals['seen_at'] = now
        elif new_state in ('admitted', 'discharged', 'transferred', 'left'):
            vals['closed_at'] = now


# --------------------------------------------------------------------------------------------- admission

class AdmissionPlan(_Workflow, ModelSQL, ModelView):
    'Admission Plan (estimate and advance deposit)'
    __name__ = 'ist.ops.admission_plan'
    _rec_name = 'reference'
    LABEL = 'admission plan'
    PREFIX = 'AP'
    TRANSITIONS = {
        'estimate': {'deposit_paid', 'ready', 'cancelled'},
        'deposit_paid': {'ready', 'cancelled'},
        'ready': {'admitted', 'cancelled'},
        'admitted': set(), 'cancelled': set(),
    }

    reference = fields.Char('Reference', readonly=True)
    patient = fields.Many2One('gnuhealth.patient', 'Patient', required=True)
    company = fields.Many2One('company.company', 'Company', required=True)
    institution = fields.Many2One('gnuhealth.institution', 'Hospital')
    payor = fields.Selection([
        ('self', 'Self-pay'), ('insurance', 'Insurance (cashless)'), ('corporate', 'Corporate'), ('scheme', 'Government scheme'),
    ], 'Payor', required=True)
    authorization = fields.Many2One('ist.claims.authorization', 'Insurer pre-authorization')
    ward_type = fields.Char('Room / ward type', required=True)
    expected_days = fields.Integer('Expected days', required=True)
    daily_rate = fields.Numeric('Room rate per day', digits=(16, 2), required=True)
    procedure_charges = fields.Numeric('Procedure and other charges', digits=(16, 2), required=True)
    estimate_total = fields.Function(fields.Numeric('Estimated total', digits=(16, 2)), 'get_estimate')
    advance_required = fields.Numeric('Advance required', digits=(16, 2), required=True)
    advance_received = fields.Numeric('Advance received', digits=(16, 2))
    state = fields.Selection([
        ('estimate', 'Estimate given'), ('deposit_paid', 'Advance received'), ('ready', 'Ready to admit'),
        ('admitted', 'Admitted'), ('cancelled', 'Cancelled'),
    ], 'State', required=True, readonly=True)
    counsellor = fields.Many2One('res.user', 'Financial counsellor', readonly=True)
    source_ed_visit = fields.Many2One('ist.ops.ed_visit', 'From emergency visit')
    registration = fields.Many2One('gnuhealth.inpatient.registration', 'Inpatient admission')
    admitted_at = fields.DateTime('Admitted at', readonly=True)
    note = fields.Text('Note')

    @classmethod
    def __setup__(cls):
        super().__setup__()
        cls._order = [('id', 'DESC')]

    @staticmethod
    def default_state():
        return 'estimate'

    @staticmethod
    def default_company():
        return _company()

    @staticmethod
    def default_advance_received():
        return Decimal('0.00')

    @staticmethod
    def default_counsellor():
        return Transaction().user

    def get_estimate(self, name):
        return (self.daily_rate or 0) * (self.expected_days or 0) + (self.procedure_charges or 0)

    @classmethod
    def _on_transition(cls, record, new_state, vals):
        if new_state == 'admitted':
            vals['admitted_at'] = _now()
        if new_state == 'deposit_paid' and (vals.get('advance_received', record.advance_received) or 0) < record.advance_required:
            raise UserError('The advance of %s has not been received in full yet.' % record.advance_required)
        if new_state == 'ready' and record.payor == 'insurance' and not (vals.get('authorization') or record.authorization):
            raise UserError('A cashless admission needs an insurer pre-authorization first.')
        if new_state == 'ready' and record.payor != 'insurance':
            received = vals.get('advance_received', record.advance_received) or 0
            if received < record.advance_required:
                raise UserError('The advance of %s has not been received in full yet.' % record.advance_required)


# --------------------------------------------------------------------------------------------- discharge

CLEARANCES = ['medical', 'nursing', 'pharmacy', 'billing', 'insurance']
CLEARANCE_STATES = [('pending', 'Pending'), ('cleared', 'Cleared'), ('na', 'Not applicable')]


class Discharge(ModelSQL, ModelView):
    'Discharge Clearance'
    __name__ = 'ist.ops.discharge'
    _rec_name = 'reference'
    TARGET_HOURS = 6

    reference = fields.Char('Reference', readonly=True)
    registration = fields.Many2One('gnuhealth.inpatient.registration', 'Inpatient admission', required=True)
    patient = fields.Many2One('gnuhealth.patient', 'Patient', required=True)
    company = fields.Many2One('company.company', 'Company', required=True)
    institution = fields.Many2One('gnuhealth.institution', 'Hospital')
    state = fields.Selection([('open', 'In progress'), ('complete', 'All clearances done'), ('cancelled', 'Cancelled')],
                             'State', required=True, readonly=True)
    started_at = fields.DateTime('Discharge ordered', required=True, readonly=True)
    completed_at = fields.DateTime('Completed', readonly=True)
    medical_state = fields.Selection(CLEARANCE_STATES, 'Medical (summary and instructions)', required=True)
    medical_by = fields.Many2One('res.user', 'Cleared by', readonly=True)
    medical_at = fields.DateTime('At', readonly=True)
    nursing_state = fields.Selection(CLEARANCE_STATES, 'Nursing (handover, lines removed)', required=True)
    nursing_by = fields.Many2One('res.user', 'Cleared by', readonly=True)
    nursing_at = fields.DateTime('At', readonly=True)
    pharmacy_state = fields.Selection(CLEARANCE_STATES, 'Pharmacy (discharge medicines)', required=True)
    pharmacy_by = fields.Many2One('res.user', 'Cleared by', readonly=True)
    pharmacy_at = fields.DateTime('At', readonly=True)
    billing_state = fields.Selection(CLEARANCE_STATES, 'Billing (final bill settled)', required=True)
    billing_by = fields.Many2One('res.user', 'Cleared by', readonly=True)
    billing_at = fields.DateTime('At', readonly=True)
    insurance_state = fields.Selection(CLEARANCE_STATES, 'Insurance (final approval)', required=True)
    insurance_by = fields.Many2One('res.user', 'Cleared by', readonly=True)
    insurance_at = fields.DateTime('At', readonly=True)
    note = fields.Text('Note')

    @classmethod
    def __setup__(cls):
        super().__setup__()
        cls._order = [('id', 'DESC')]

    @staticmethod
    def default_state():
        return 'open'

    @staticmethod
    def default_company():
        return _company()

    @staticmethod
    def default_started_at():
        return _now()

    @classmethod
    def create(cls, vlist):
        vlist = [dict(v) for v in vlist]
        for v in vlist:
            for name in CLEARANCES:
                v.setdefault(name + '_state', 'pending')
            v.setdefault('started_at', _now())
        records = super().create(vlist)
        for record in records:
            super(Discharge, cls).write([record], {'reference': 'DC-%06d' % record.id})
        return records

    @classmethod
    def write(cls, *args):
        actions = iter(args)
        for records, values in zip(actions, actions):
            for record in records:
                vals = dict(values)
                now = _now()
                states = {}
                for name in CLEARANCES:
                    new = vals.get(name + '_state')
                    old = getattr(record, name + '_state')
                    states[name] = new or old
                    if new and new != old:
                        vals[name + '_by'] = Transaction().user
                        vals[name + '_at'] = now if new != 'pending' else None
                if 'state' not in vals and record.state == 'open' and all(s != 'pending' for s in states.values()):
                    vals['state'] = 'complete'
                    vals['completed_at'] = now
                elif record.state == 'complete' and any(s == 'pending' for s in states.values()):
                    vals['state'] = 'open'
                    vals['completed_at'] = None
                super(Discharge, cls).write([record], vals)


# --------------------------------------------------------------------------------------------- referral

class Referral(_Workflow, ModelSQL, ModelView):
    'Inter-hospital Referral'
    __name__ = 'ist.ops.referral'
    _rec_name = 'reference'
    LABEL = 'referral'
    PREFIX = 'RF'
    TRANSITIONS = {
        'requested': {'accepted', 'declined', 'cancelled'},
        'accepted': {'completed', 'cancelled'},
        'declined': set(), 'completed': set(), 'cancelled': set(),
    }

    reference = fields.Char('Reference', readonly=True)
    patient = fields.Many2One('gnuhealth.patient', 'Patient', required=True)
    company = fields.Many2One('company.company', 'Referring company', required=True)
    from_institution = fields.Many2One('gnuhealth.institution', 'From hospital', required=True)
    to_institution = fields.Many2One('gnuhealth.institution', 'To hospital', required=True)
    specialty = fields.Char('Specialty / service needed', required=True)
    urgency = fields.Selection([('routine', 'Routine'), ('urgent', 'Urgent'), ('emergency', 'Emergency')], 'Urgency', required=True)
    reason = fields.Text('Reason for referral', required=True)
    clinical_summary = fields.Text('Clinical summary')
    state = fields.Selection([
        ('requested', 'Requested'), ('accepted', 'Accepted'), ('declined', 'Declined'),
        ('completed', 'Patient received'), ('cancelled', 'Cancelled'),
    ], 'State', required=True, readonly=True)
    requested_by = fields.Many2One('res.user', 'Requested by', readonly=True)
    requested_at = fields.DateTime('Requested', readonly=True)
    decided_at = fields.DateTime('Decided', readonly=True)
    response_note = fields.Text('Receiving hospital note')

    @classmethod
    def __setup__(cls):
        super().__setup__()
        cls._order = [('id', 'DESC')]

    @staticmethod
    def default_state():
        return 'requested'

    @staticmethod
    def default_company():
        return _company()

    @staticmethod
    def default_urgency():
        return 'routine'

    @staticmethod
    def default_requested_by():
        return Transaction().user

    @staticmethod
    def default_requested_at():
        return _now()

    @classmethod
    def validate(cls, records):
        super().validate(records)
        for r in records:
            if r.from_institution == r.to_institution:
                raise UserError('A referral must go to a different hospital.')

    @classmethod
    def _on_transition(cls, record, new_state, vals):
        if new_state in ('accepted', 'declined', 'completed'):
            vals['decided_at'] = _now()


# --------------------------------------------------------------------------------------------- pharmacy stock

class Stock(ModelSQL, ModelView):
    'Pharmacy Stock Batch'
    __name__ = 'ist.ops.stock'
    _rec_name = 'batch'

    medicament = fields.Many2One('gnuhealth.medicament', 'Medicine', required=True)
    company = fields.Many2One('company.company', 'Company', required=True)
    institution = fields.Many2One('gnuhealth.institution', 'Hospital')
    batch = fields.Char('Batch', required=True)
    expiry = fields.Date('Expiry', required=True)
    quantity = fields.Integer('Quantity on hand', required=True)
    reorder_level = fields.Integer('Reorder level', required=True)
    supplier = fields.Char('Supplier')

    @classmethod
    def __setup__(cls):
        super().__setup__()
        cls._order = [('expiry', 'ASC'), ('id', 'ASC')]

    @staticmethod
    def default_company():
        return _company()

    @classmethod
    def validate(cls, records):
        super().validate(records)
        for r in records:
            if r.quantity < 0:
                raise UserError('Stock of %s batch %s cannot go below zero.' % (r.medicament.rec_name, r.batch))
