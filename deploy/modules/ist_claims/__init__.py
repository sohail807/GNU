from trytond.pool import Pool

from . import claims


def register():
    Pool.register(
        claims.Authorization,
        claims.Claim,
        module='ist_claims', type_='model')
