"""IST Health: insurer pre-authorizations and claims, as native Tryton records.

GNU Health has no model for an insurer's prior approval or for tracking a claim until the insurer pays. These two
models add exactly that, next to the native insurance policy (gnuhealth.insurance) and customer invoice
(account.invoice), so there is one source of truth and the usual Tryton access rules, history and reports apply.

Pre-authorization:  draft -> submitted -> approved | partial | rejected  (or cancelled / expired)
Claim:              draft -> submitted -> queried | approved | rejected -> partially_paid -> paid
                    (a rejected claim can be corrected and submitted again)

Service levels follow the Gulf insurer rules the demo is based on: an outpatient approval is due in 6 hours, an
inpatient or procedure approval in 24 hours, and a claim is settled within 45 days of submission.
"""
from datetime import datetime, timedelta

from trytond.exceptions import UserError
from trytond.model import ModelSQL, ModelView, fields
from trytond.pool import Pool
from trytond.pyson import Eval
from trytond.transaction import Transaction

AUTH_SLA_HOURS = {'outpatient': 6, 'imaging': 6, 'medication': 6, 'inpatient': 24, 'procedure': 24}
CLAIM_SETTLEMENT_DAYS = 45


def _context_company():
    return Transaction().context.get('company')


class Authorization(ModelSQL, ModelView):
    'Insurer Pre-authorization'
    __name__ = 'ist.claims.authorization'
    _rec_name = 'reference'

    TRANSITIONS = {
        'draft': {'submitted', 'cancelled'},
        'submitted': {'approved', 'partial', 'rejected', 'expired', 'cancelled'},
        'rejected': {'submitted', 'cancelled'},
        'expired': {'submitted', 'cancelled'},
        'approved': set(),
        'partial': set(),
        'cancelled': set(),
    }

    reference = fields.Char('Reference', readonly=True)
    patient = fields.Many2One('gnuhealth.patient', 'Patient', required=True)
    insurance = fields.Many2One('gnuhealth.insurance', 'Insurance policy', required=True)
    insurer = fields.Function(fields.Many2One('party.party', 'Insurer'), 'get_insurer')
    company = fields.Many2One('company.company', 'Company', required=True)
    institution = fields.Many2One('gnuhealth.institution', 'Hospital')
    auth_type = fields.Selection([
        ('outpatient', 'Outpatient consultation'),
        ('imaging', 'Imaging'),
        ('medication', 'Medication'),
        ('inpatient', 'Inpatient admission'),
        ('procedure', 'Surgery / procedure'),
    ], 'Type', required=True)
    service = fields.Char('Service requested', required=True)
    diagnosis = fields.Char('Diagnosis')
    requested_amount = fields.Numeric('Requested amount', digits=(16, 2), required=True)
    approved_amount = fields.Numeric(
        'Approved amount', digits=(16, 2),
        states={'required': Eval('state').in_(['approved', 'partial'])})
    insurer_reference = fields.Char(
        'Insurer approval number', states={'required': Eval('state').in_(['approved', 'partial'])})
    state = fields.Selection([
        ('draft', 'Draft'), ('submitted', 'Submitted'), ('approved', 'Approved'),
        ('partial', 'Partly approved'), ('rejected', 'Rejected'), ('expired', 'Expired'),
        ('cancelled', 'Cancelled'),
    ], 'State', required=True, readonly=True)
    submitted_at = fields.DateTime('Submitted at', readonly=True)
    due_at = fields.DateTime('Insurer answer due', readonly=True)
    decided_at = fields.DateTime('Decided at', readonly=True)
    decision_note = fields.Text('Insurer note / rejection reason')

    @classmethod
    def __setup__(cls):
        super().__setup__()
        cls._order = [('id', 'DESC')]

    @staticmethod
    def default_state():
        return 'draft'

    @staticmethod
    def default_company():
        return _context_company()

    def get_insurer(self, name):
        if self.insurance and self.insurance.company:
            return self.insurance.company.id

    @classmethod
    def create(cls, vlist):
        records = super().create(vlist)
        for record in records:
            super(Authorization, cls).write([record], {'reference': 'PA-%06d' % record.id})
        return records

    @classmethod
    def write(cls, *args):
        actions = iter(args)
        for records, values in zip(actions, actions):
            new_state = values.get('state')
            for record in records:
                vals = dict(values)
                if new_state and new_state != record.state:
                    if new_state not in cls.TRANSITIONS.get(record.state, set()):
                        raise UserError(
                            'A pre-authorization cannot go from %s to %s.' % (record.state, new_state))
                    now = datetime.now()
                    if new_state == 'submitted':
                        vals['submitted_at'] = now
                        vals['due_at'] = now + timedelta(hours=AUTH_SLA_HOURS.get(record.auth_type, 24))
                        vals['decided_at'] = None
                    elif new_state in ('approved', 'partial', 'rejected'):
                        vals['decided_at'] = now
                super(Authorization, cls).write([record], vals)


class Claim(ModelSQL, ModelView):
    'Insurer Claim'
    __name__ = 'ist.claims.claim'
    _rec_name = 'reference'

    TRANSITIONS = {
        'draft': {'submitted'},
        'submitted': {'queried', 'approved', 'rejected'},
        'queried': {'submitted', 'rejected'},
        'rejected': {'submitted'},
        'approved': {'partially_paid', 'paid'},
        'partially_paid': {'partially_paid', 'paid'},
        'paid': set(),
    }

    reference = fields.Char('Reference', readonly=True)
    invoice = fields.Many2One('account.invoice', 'Invoice', required=True,
                              domain=[('type', '=', 'out')])
    party = fields.Function(fields.Many2One('party.party', 'Patient'), 'get_party')
    insurer = fields.Many2One('party.party', 'Insurer', required=True,
                              domain=[('is_insurance_company', '=', True)])
    authorization = fields.Many2One('ist.claims.authorization', 'Pre-authorization')
    company = fields.Many2One('company.company', 'Company', required=True)
    institution = fields.Many2One('gnuhealth.institution', 'Hospital')
    claimed_amount = fields.Numeric('Claimed amount', digits=(16, 2), required=True)
    approved_amount = fields.Numeric(
        'Approved amount', digits=(16, 2),
        states={'required': Eval('state').in_(['approved', 'partially_paid', 'paid'])})
    settled_amount = fields.Numeric('Received so far', digits=(16, 2))
    state = fields.Selection([
        ('draft', 'Draft'), ('submitted', 'Submitted'), ('queried', 'Insurer query'),
        ('approved', 'Approved'), ('partially_paid', 'Partly paid'), ('paid', 'Paid'),
        ('rejected', 'Rejected'),
    ], 'State', required=True, readonly=True)
    submitted_on = fields.Date('Submitted on', readonly=True)
    due_on = fields.Date('Settlement due', readonly=True)
    settled_on = fields.Date('Last payment on', readonly=True)
    note = fields.Text('Insurer query / rejection reason')

    @classmethod
    def __setup__(cls):
        super().__setup__()
        cls._order = [('id', 'DESC')]

    @staticmethod
    def default_state():
        return 'draft'

    @staticmethod
    def default_company():
        return _context_company()

    @staticmethod
    def default_settled_amount():
        from decimal import Decimal
        return Decimal('0.00')

    def get_party(self, name):
        if self.invoice and self.invoice.party:
            return self.invoice.party.id

    @classmethod
    def create(cls, vlist):
        records = super().create(vlist)
        for record in records:
            super(Claim, cls).write([record], {'reference': 'CL-%06d' % record.id})
        return records

    @classmethod
    def write(cls, *args):
        actions = iter(args)
        for records, values in zip(actions, actions):
            new_state = values.get('state')
            for record in records:
                vals = dict(values)
                if new_state and new_state != record.state:
                    if new_state not in cls.TRANSITIONS.get(record.state, set()):
                        raise UserError('A claim cannot go from %s to %s.' % (record.state, new_state))
                    today = datetime.now().date()
                    if new_state == 'submitted':
                        vals['submitted_on'] = today
                        vals['due_on'] = today + timedelta(days=CLAIM_SETTLEMENT_DAYS)
                    elif new_state in ('partially_paid', 'paid'):
                        vals['settled_on'] = today
                super(Claim, cls).write([record], vals)
