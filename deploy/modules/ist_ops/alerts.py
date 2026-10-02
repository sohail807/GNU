"""IST Health: critical-result alerts and pharmacy purchase requests (part of the ist_ops module)."""
from trytond.exceptions import UserError
from trytond.model import ModelSQL, ModelView, fields
from trytond.pyson import Eval
from trytond.transaction import Transaction

from .ops import _Workflow, _company, _now


class CriticalAlert(_Workflow, ModelSQL, ModelView):
    'Laboratory Result Alert'
    __name__ = 'ist.ops.critical_alert'
    _rec_name = 'reference'
    LABEL = 'result alert'
    PREFIX = 'CR'
    TRANSITIONS = {'open': {'acknowledged'}, 'acknowledged': set()}

    reference = fields.Char('Reference', readonly=True)
    lab = fields.Many2One('gnuhealth.lab', 'Laboratory result', required=True)
    criterion = fields.Integer('Analyte record')
    patient = fields.Many2One('gnuhealth.patient', 'Patient', required=True)
    company = fields.Many2One('company.company', 'Company', required=True)
    institution = fields.Many2One('gnuhealth.institution', 'Hospital')
    analyte = fields.Char('Analyte', required=True)
    value = fields.Char('Result', required=True)
    limits = fields.Char('Reference range')
    severity = fields.Selection([('abnormal', 'Abnormal'), ('critical', 'Critical')], 'Severity', required=True)
    state = fields.Selection([('open', 'Needs acknowledgement'), ('acknowledged', 'Acknowledged')], 'State', required=True, readonly=True)
    raised_at = fields.DateTime('Raised', required=True, readonly=True)
    acknowledged_by = fields.Many2One('res.user', 'Acknowledged by', readonly=True)
    acknowledged_at = fields.DateTime('Acknowledged', readonly=True)
    action_note = fields.Text('Action taken', states={'required': Eval('state') == 'acknowledged'})

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
    def default_raised_at():
        return _now()

    @classmethod
    def _on_transition(cls, record, new_state, vals):
        if new_state == 'acknowledged':
            vals['acknowledged_by'] = Transaction().user
            vals['acknowledged_at'] = _now()
            if not (vals.get('action_note') or record.action_note):
                raise UserError('Record the action taken before acknowledging a result alert.')


class PurchaseRequest(_Workflow, ModelSQL, ModelView):
    'Pharmacy Purchase Request'
    __name__ = 'ist.ops.purchase_request'
    _rec_name = 'reference'
    LABEL = 'purchase request'
    PREFIX = 'PR'
    TRANSITIONS = {'requested': {'ordered', 'cancelled'}, 'ordered': {'received', 'cancelled'}, 'received': set(), 'cancelled': set()}

    reference = fields.Char('Reference', readonly=True)
    medicament = fields.Many2One('gnuhealth.medicament', 'Medicine', required=True)
    company = fields.Many2One('company.company', 'Company', required=True)
    institution = fields.Many2One('gnuhealth.institution', 'Hospital')
    quantity = fields.Integer('Quantity', required=True)
    supplier = fields.Char('Supplier')
    reason = fields.Selection([('low_stock', 'Below reorder level'), ('expiring', 'Replace expiring stock'), ('new', 'New line')], 'Reason', required=True)
    state = fields.Selection([('requested', 'Requested'), ('ordered', 'Ordered from supplier'), ('received', 'Received into stock'), ('cancelled', 'Cancelled')],
                             'State', required=True, readonly=True)
    requested_by = fields.Many2One('res.user', 'Requested by', readonly=True)
    requested_at = fields.DateTime('Requested', readonly=True)
    ordered_at = fields.DateTime('Ordered', readonly=True)
    received_at = fields.DateTime('Received', readonly=True)
    note = fields.Char('Note')

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
    def default_requested_by():
        return Transaction().user

    @staticmethod
    def default_requested_at():
        return _now()

    @classmethod
    def validate(cls, records):
        super().validate(records)
        for r in records:
            if r.quantity is not None and r.quantity <= 0:
                raise UserError('The quantity to order must be above zero.')

    @classmethod
    def _on_transition(cls, record, new_state, vals):
        if new_state == 'ordered':
            vals['ordered_at'] = _now()
        elif new_state == 'received':
            vals['received_at'] = _now()


class OrderSet(ModelSQL, ModelView):
    'Diagnostic Order Set'
    __name__ = 'ist.ops.order_set'
    _rec_name = 'name'

    name = fields.Char('Name', required=True)
    owner = fields.Many2One('res.user', 'Owner', required=True, readonly=True)
    company = fields.Many2One('company.company', 'Company', required=True)
    shared = fields.Boolean('Shared with all doctors')
    # JSON list of {"kind": "lab" | "imaging", "id": test id, "name": test name}
    items = fields.Text('Tests in the set', required=True)

    @classmethod
    def __setup__(cls):
        super().__setup__()
        cls._order = [('name', 'ASC')]

    @staticmethod
    def default_company():
        return _company()

    @staticmethod
    def default_owner():
        return Transaction().user

    @staticmethod
    def default_shared():
        return False

    @classmethod
    def validate(cls, records):
        super().validate(records)
        import json
        for r in records:
            try:
                items = json.loads(r.items or '[]')
            except ValueError:
                raise UserError('The order set is not valid.')
            if not isinstance(items, list) or not items or len(items) > 40:
                raise UserError('An order set needs between 1 and 40 tests.')
