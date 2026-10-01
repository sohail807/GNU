"""IST Health: theatre safety checklist and delivery / newborn record (part of the ist_ops module)."""
from trytond.exceptions import UserError
from trytond.model import ModelSQL, ModelView, fields
from trytond.transaction import Transaction

from .ops import _Workflow, _company, _now

PHASES = ['sign_in', 'time_out', 'sign_out']


class SurgeryChecklist(ModelSQL, ModelView):
    'Surgical Safety Checklist (WHO)'
    __name__ = 'ist.ops.surgery_checklist'
    _rec_name = 'reference'

    reference = fields.Char('Reference', readonly=True)
    surgery = fields.Many2One('gnuhealth.surgery', 'Surgery', required=True)
    patient = fields.Many2One('gnuhealth.patient', 'Patient', required=True)
    company = fields.Many2One('company.company', 'Company', required=True)
    institution = fields.Many2One('gnuhealth.institution', 'Hospital')
    # Sign in: before anaesthesia. Identity, site marked, consent, allergies, anaesthesia machine and pulse oximeter.
    sign_in_done = fields.Boolean('Sign in complete')
    sign_in_by = fields.Many2One('res.user', 'By', readonly=True)
    sign_in_at = fields.DateTime('At', readonly=True)
    sign_in_note = fields.Char('Sign in note')
    # Time out: before the first incision. Team introduced, patient/site/procedure confirmed, antibiotics, imaging.
    time_out_done = fields.Boolean('Time out complete')
    time_out_by = fields.Many2One('res.user', 'By', readonly=True)
    time_out_at = fields.DateTime('At', readonly=True)
    time_out_note = fields.Char('Time out note')
    # Sign out: before the patient leaves theatre. Procedure recorded, counts correct, specimens labelled, recovery plan.
    sign_out_done = fields.Boolean('Sign out complete')
    sign_out_by = fields.Many2One('res.user', 'By', readonly=True)
    sign_out_at = fields.DateTime('At', readonly=True)
    sign_out_note = fields.Char('Sign out note')

    @classmethod
    def __setup__(cls):
        super().__setup__()
        cls._order = [('id', 'DESC')]

    @staticmethod
    def default_company():
        return _company()

    @staticmethod
    def default_sign_in_done():
        return False

    @staticmethod
    def default_time_out_done():
        return False

    @staticmethod
    def default_sign_out_done():
        return False

    @classmethod
    def create(cls, vlist):
        records = super().create(vlist)
        for record in records:
            super(SurgeryChecklist, cls).write([record], {'reference': 'SC-%06d' % record.id})
        return records

    @classmethod
    def write(cls, *args):
        actions = iter(args)
        for records, values in zip(actions, actions):
            for record in records:
                vals = dict(values)
                for phase in PHASES:
                    flag = phase + '_done'
                    if flag in vals and bool(vals[flag]) != bool(getattr(record, flag)):
                        if vals[flag]:
                            for earlier in PHASES[:PHASES.index(phase)]:
                                if not vals.get(earlier + '_done', getattr(record, earlier + '_done')):
                                    raise UserError('Complete %s before %s.' % (earlier.replace('_', ' '), phase.replace('_', ' ')))
                            vals[phase + '_by'] = Transaction().user
                            vals[phase + '_at'] = _now()
                        else:
                            vals[phase + '_by'] = None
                            vals[phase + '_at'] = None
                super(SurgeryChecklist, cls).write([record], vals)


class Delivery(_Workflow, ModelSQL, ModelView):
    'Delivery and Newborn Record'
    __name__ = 'ist.ops.delivery'
    _rec_name = 'reference'
    LABEL = 'delivery record'
    PREFIX = 'DL'
    TRANSITIONS = {'recorded': {'newborn_registered', 'closed'}, 'newborn_registered': {'closed'}, 'closed': set()}

    reference = fields.Char('Reference', readonly=True)
    mother = fields.Many2One('gnuhealth.patient', 'Mother', required=True)
    company = fields.Many2One('company.company', 'Company', required=True)
    institution = fields.Many2One('gnuhealth.institution', 'Hospital')
    delivered_at = fields.DateTime('Delivered', required=True)
    delivery_type = fields.Selection([
        ('normal', 'Normal vaginal'), ('assisted', 'Assisted (forceps / vacuum)'), ('caesarean', 'Caesarean section'),
    ], 'Type of delivery', required=True)
    outcome = fields.Selection([('live_birth', 'Live birth'), ('stillbirth', 'Stillbirth')], 'Outcome', required=True)
    baby_sex = fields.Selection([(None, ''), ('f', 'Girl'), ('m', 'Boy')], 'Baby sex')
    birth_weight_g = fields.Integer('Birth weight (g)')
    apgar_1 = fields.Integer('Apgar at 1 minute')
    apgar_5 = fields.Integer('Apgar at 5 minutes')
    mother_condition = fields.Char('Mother after delivery')
    nicu = fields.Boolean('Needs NICU')
    baby = fields.Many2One('gnuhealth.patient', 'Newborn patient record')
    obstetrician = fields.Many2One('gnuhealth.healthprofessional', 'Obstetrician')
    state = fields.Selection([('recorded', 'Delivery recorded'), ('newborn_registered', 'Newborn registered'), ('closed', 'Closed')],
                             'State', required=True, readonly=True)
    note = fields.Text('Note')

    @classmethod
    def __setup__(cls):
        super().__setup__()
        cls._order = [('id', 'DESC')]

    @staticmethod
    def default_state():
        return 'recorded'

    @staticmethod
    def default_company():
        return _company()

    @staticmethod
    def default_delivered_at():
        return _now()

    @staticmethod
    def default_nicu():
        return False

    @classmethod
    def validate(cls, records):
        super().validate(records)
        for r in records:
            for name in ('apgar_1', 'apgar_5'):
                v = getattr(r, name)
                if v is not None and not 0 <= v <= 10:
                    raise UserError('Apgar scores run from 0 to 10.')
            if r.birth_weight_g is not None and not 300 <= r.birth_weight_g <= 7000:
                raise UserError('Birth weight must be between 300 g and 7000 g.')
