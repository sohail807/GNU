from trytond.pool import Pool

from . import alerts
from . import ops
from . import theatre


def register():
    Pool.register(
        ops.EDVisit,
        ops.AdmissionPlan,
        ops.Discharge,
        ops.Referral,
        ops.Stock,
        theatre.SurgeryChecklist,
        theatre.Delivery,
        alerts.CriticalAlert,
        alerts.PurchaseRequest,
        module='ist_ops', type_='model')
