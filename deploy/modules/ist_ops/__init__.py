from trytond.pool import Pool

from . import ops


def register():
    Pool.register(
        ops.EDVisit,
        ops.AdmissionPlan,
        ops.Discharge,
        ops.Referral,
        ops.Stock,
        module='ist_ops', type_='model')
