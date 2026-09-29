#!/usr/bin/env python3
"""
IST Health -- Delete synthetic test/verification records left behind by a
Claude Code session's live module-by-module verification sweep.

Deliberately NOT touched by this script (left in their current, already-safe
state rather than deleted):
  - res.user test accounts (verify_test_nurse01-04, verify_test_doc01) -
    already suspended (active=False); deleting a user record cascades into
    party/health-professional links in ways not worth the risk for accounts
    that already can't log in.
  - The "verify-test-iso" platform tenant and its database
    (gnuhealth_verify_test_iso) - already suspended in the tenant registry.
    Dropping a whole tenant's Postgres database is a distinct, heavier
    decision a human should make deliberately via SSH, not something this
    script bundles in.

Everything else this script deletes was created purely to prove a fix works
and has no real clinical/financial meaning. Deletions run in dependency-safe
order (children before parents) and each is wrapped individually so one
failure (e.g. Tryton refusing to delete a non-draft invoice, which is
by-design accounting integrity, not a bug) doesn't block the rest - the
script reports exactly what it deleted and what it couldn't, with the
reason, so nothing is silently swallowed.

Run on the VM as the gnuhealth user, with TRYTOND_CONFIG set, against one
database at a time:
    sudo -u gnuhealth env TRYTOND_CONFIG=/home/gnuhealth/trytond.conf \
        /home/gnuhealth/venv/bin/python3 cleanup_session_test_data.py <database>

Add --dry-run to only print what would be attempted, without deleting
anything.
"""
import sys

from trytond.transaction import Transaction
from trytond.pool import Pool

# (model, [ids], human label) - order matters: children before parents.
TARGETS = [
    ("gnuhealth.patient.ecg", [2], "Verification ECG (patient 101)"),
    ("gnuhealth.patient.procedure", [2], "Verification ambulatory procedure (patient 101)"),
    ("gnuhealth.procedure", None, "Verification procedure code VT-001 (looked up by name)"),
    ("gnuhealth.hospital.bed", [3], "Verification Bed VT-01"),
    ("gnuhealth.hospital.ward", [3], "Verification Test Ward"),
    ("gnuhealth.insurance", [6], "Verification insurance policy VER-TEST-001"),
    ("gnuhealth.family", [2], "Verification Test Household"),
    ("gnuhealth.vaccination", [1], "Verification vaccination record (patient 101)"),
    ("gnuhealth.patient.menstrual_history", [2], "Verification menstrual history record (patient 101)"),
    ("gnuhealth.ses.assessment", [3], "Verification socioeconomic assessment (patient 85)"),
    ("gnuhealth.patient.pregnancy", [10], "Verification pregnancy record (patient 101)"),
    ("gnuhealth.surgery", [3, 4], "Verification surgeries SRG-2026-00003/00004"),
    ("gnuhealth.patient.evaluation", [56, 95, 96, 97, 98], "Verification/orphaned evaluations"),
    ("account.invoice", [55, 56, 59, 60, 61], "Verification invoices"),
    ("gnuhealth.patient", [105], "Verification Test Patient FedCountry"),
]


def main():
    args = [a for a in sys.argv[1:] if not a.startswith("--")]
    dry_run = "--dry-run" in sys.argv
    if len(args) != 1:
        print("Usage: cleanup_session_test_data.py <database> [--dry-run]")
        return 1
    database = args[0]

    Pool.start()
    pool = Pool(database)
    pool.init()

    deleted = []
    failed = []

    # A Postgres transaction that hits a DB-level error (e.g. Tryton's own
    # AccessError from refusing to delete a posted invoice) is left "aborted"
    # on that connection until it's rolled back - any further command on the
    # SAME connection/transaction fails too, even one that would otherwise
    # have succeeded. Confirmed live: after the first paid invoice failed,
    # every item queued after it in one shared transaction failed as well,
    # including two plain draft invoices that should have deleted cleanly.
    # Each target now gets its own fresh Transaction().start() (a genuinely
    # separate connection), so one item's failure can never poison another's.
    with Transaction().start(database, 0, context={}, readonly=True) as lookup_txn:
        Procedure = pool.get("gnuhealth.procedure")
        procedure_codes = Procedure.search([("name", "=", "VT-001")])
        procedure_ids = [p.id for p in procedure_codes]
        lookup_txn.rollback()

    for model_name, ids, label in TARGETS:
        if model_name == "gnuhealth.procedure":
            ids = procedure_ids
        if not ids:
            continue
        # One id at a time, not the whole group in a single Model.delete()
        # call. Confirmed live: delete()'s own check_modify() validates the
        # ENTIRE batch up front - a single posted/paid invoice bundled in
        # with two perfectly deletable drafts blocked all three, reporting
        # one failure that looked like it covered every id in the group when
        # really only one of them was the actual problem.
        for record_id in ids:
            try:
                with Transaction().start(database, 0, context={}):
                    Model = pool.get(model_name)
                    if not Model.search_count([("id", "=", record_id)]):
                        continue
                    if dry_run:
                        print(f"[DRY RUN] Would delete {label}: {model_name} [{record_id}]")
                        continue
                    Model.delete(Model.browse([record_id]))
                    deleted.append(f"{label}: {model_name} [{record_id}]")
            except Exception as exc:
                failed.append(f"{label}: {model_name} [{record_id}] -> {exc}")

    print(f"\nDeleted ({len(deleted)}):")
    for line in deleted:
        print(f"  - {line}")
    print(f"\nCould not delete ({len(failed)}) - review each reason, some are expected (e.g. Tryton refusing to delete a posted/paid invoice by design):")
    for line in failed:
        print(f"  - {line}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
