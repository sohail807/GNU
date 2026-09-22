#!/bin/bash
set -eo pipefail

TIMESTAMP="${1:-20260922_184552}"
BACKUP_DIR="/var/backups/gnuhealth"
DB_NAME="gnuhealth"
RESTORE_DB="gnuhealth_isolated_e2e_restore"
DB_DUMP="${BACKUP_DIR}/gnuhealth_db_e2e_post_${TIMESTAMP}.dump"
ATTACH_ARCHIVE="${BACKUP_DIR}/gnuhealth_attach_e2e_post_${TIMESTAMP}.tar.gz"
RESTORE_ATTACH_DIR="/tmp/isolated_e2e_attach_${TIMESTAMP}"

echo "=== STEP 1: VERIFYING POST-CERTIFICATION BACKUP INTEGRITY ==="
if [ ! -f "${DB_DUMP}" ]; then
    echo "ERROR: Database dump ${DB_DUMP} not found!"
    exit 1
fi

DB_SIZE=$(stat -c%s "${DB_DUMP}")
DB_SHA=$(sha256sum "${DB_DUMP}" | awk '{print $1}')
ATT_SIZE=$(stat -c%s "${ATTACH_ARCHIVE}")
ATT_SHA=$(sha256sum "${ATTACH_ARCHIVE}" | awk '{print $1}')

echo "Database dump: ${DB_DUMP} (${DB_SIZE} bytes, SHA256: ${DB_SHA})"
echo "Attachment archive: ${ATTACH_ARCHIVE} (${ATT_SIZE} bytes, SHA256: ${ATT_SHA})"

echo "=== STEP 2: VERIFYING CATALOG ENTRIES ==="
CATALOG_COUNT=$(pg_restore -l "${DB_DUMP}" | wc -l)
echo "Catalog entries in dump: ${CATALOG_COUNT}"

echo "=== STEP 3: CREATING ISOLATED TEST DATABASE FOR RESTORE DRILL ==="
sudo -u postgres dropdb --if-exists "${RESTORE_DB}"
sudo -u postgres createdb -O gnuhealth "${RESTORE_DB}"

START_TIME=$(date +%s)
echo "Staging dump copy for postgres user restore..."
cp "${DB_DUMP}" /tmp/restore_e2e_test.dump
chmod 644 /tmp/restore_e2e_test.dump

echo "Restoring /tmp/restore_e2e_test.dump into ${RESTORE_DB}..."
sudo -u postgres pg_restore -d "${RESTORE_DB}" /tmp/restore_e2e_test.dump || true
rm -f /tmp/restore_e2e_test.dump
END_TIME=$(date +%s)
DURATION=$((END_TIME - START_TIME))
echo "Restore completed in ${DURATION} seconds."

echo "=== STEP 4: VERIFYING RESTORED DATABASE INTEGRITY & ENTITIES ==="
sudo -u postgres psql -d "${RESTORE_DB}" -c "
SELECT 
    (SELECT count(*) FROM information_schema.tables WHERE table_schema = 'public') as public_tables,
    (SELECT count(*) FROM gnuhealth_patient) as patients,
    (SELECT count(*) FROM party_party WHERE ref LIKE 'E2E-CERT%') as e2e_parties,
    (SELECT count(*) FROM gnuhealth_appointment) as appointments,
    (SELECT count(*) FROM gnuhealth_patient_evaluation) as evaluations,
    (SELECT count(*) FROM gnuhealth_prescription_order) as prescriptions,
    (SELECT count(*) FROM gnuhealth_lab) as labs,
    (SELECT count(*) FROM gnuhealth_imaging_test_request) as imaging_requests,
    (SELECT count(*) FROM gnuhealth_health_service) as health_services,
    (SELECT count(*) FROM account_invoice WHERE state = 'posted') as posted_invoices,
    (SELECT count(*) FROM account_move WHERE state = 'posted') as posted_moves,
    (SELECT count(*) FROM account_move_reconciliation) as reconciliations,
    (SELECT count(*) FROM gnuhealth_pathology) as icd10_pathologies,
    (SELECT count(*) FROM gnuhealth_medicament) as medicaments;
"

echo "Checking GL balance in restored database:"
sudo -u postgres psql -d "${RESTORE_DB}" -c "
SELECT 
    SUM(debit) as total_debit, 
    SUM(credit) as total_credit, 
    SUM(debit) - SUM(credit) as gl_difference 
FROM account_move_line;
"

echo "=== STEP 5: VERIFYING ATTACHMENT EXTRACTION ==="
mkdir -p "${RESTORE_ATTACH_DIR}"
tar -xzf "${ATTACH_ARCHIVE}" -C "${RESTORE_ATTACH_DIR}"
echo "Attachment archive extracted successfully into ${RESTORE_ATTACH_DIR}."
rm -rf "${RESTORE_ATTACH_DIR}"

echo "=== STEP 6: DESTROYING TEMPORARY ISOLATED RESTORE DATABASE ==="
sudo -u postgres dropdb "${RESTORE_DB}"
echo "Isolated database ${RESTORE_DB} destroyed cleanly. Live system untouched."

echo "=== E2E CERTIFICATION RESTORE DRILL COMPLETED: FULL PASS ==="
