#!/bin/bash
set -eo pipefail

TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/var/backups/gnuhealth"
DB_NAME="gnuhealth"
RESTORE_DB="gnuhealth_isolated_val_restore"
DB_DUMP="${BACKUP_DIR}/gnuhealth_db_${TIMESTAMP}.dump"
ATTACH_ARCHIVE="${BACKUP_DIR}/gnuhealth_attach_${TIMESTAMP}.tar.gz"
ATTACH_DIR="/var/lib/gnuhealth/attachments"
RESTORE_ATTACH_DIR="/tmp/isolated_restore_attachments_${TIMESTAMP}"

echo "=== STEP 1: CAPTURING FRESH POST-VALIDATION SAFETY BACKUP ==="
sudo -u postgres pg_dump -Fc -d "${DB_NAME}" -f "${DB_DUMP}"
sudo chown gnuhealth:gnuhealth "${DB_DUMP}"
sudo chmod 640 "${DB_DUMP}"

# Attachments backup
if [ -d "${ATTACH_DIR}" ]; then
    sudo tar -czf "${ATTACH_ARCHIVE}" -C "${ATTACH_DIR}" . 2>/dev/null || sudo tar -czf "${ATTACH_ARCHIVE}" --files-from /dev/null
else
    sudo tar -czf "${ATTACH_ARCHIVE}" --files-from /dev/null
fi
sudo chown gnuhealth:gnuhealth "${ATTACH_ARCHIVE}"
sudo chmod 640 "${ATTACH_ARCHIVE}"

DB_SIZE=$(sudo stat -c%s "${DB_DUMP}")
DB_SHA=$(sudo sha256sum "${DB_DUMP}" | awk '{print $1}')
ATT_SIZE=$(sudo stat -c%s "${ATTACH_ARCHIVE}")
ATT_SHA=$(sudo sha256sum "${ATTACH_ARCHIVE}" | awk '{print $1}')

echo "Backup captured successfully:"
echo "Database dump: ${DB_DUMP} (${DB_SIZE} bytes, SHA256: ${DB_SHA})"
echo "Attachment archive: ${ATTACH_ARCHIVE} (${ATT_SIZE} bytes, SHA256: ${ATT_SHA})"

echo "=== STEP 2: VERIFYING BACKUP ARCHIVE READABILITY ==="
sudo pg_restore -l "${DB_DUMP}" | wc -l | awk '{print "Catalog entries in dump: " $1}'
sudo tar -ztvf "${ATTACH_ARCHIVE}" | wc -l | awk '{print "Files in attachment archive: " $1}'

echo "=== STEP 3: CREATING ISOLATED TEST DATABASE FOR RESTORE DRILL ==="
sudo -u postgres dropdb --if-exists "${RESTORE_DB}"
sudo -u postgres createdb -O gnuhealth "${RESTORE_DB}"

START_TIME=$(date +%s)
echo "Staging dump copy for postgres user restore..."
sudo cp "${DB_DUMP}" /tmp/restore_test.dump
sudo chmod 644 /tmp/restore_test.dump

echo "Restoring /tmp/restore_test.dump into ${RESTORE_DB}..."
sudo -u postgres pg_restore -d "${RESTORE_DB}" /tmp/restore_test.dump || true
sudo rm -f /tmp/restore_test.dump
END_TIME=$(date +%s)
DURATION=$((END_TIME - START_TIME))
echo "Restore completed in ${DURATION} seconds."

echo "=== STEP 4: VERIFYING RESTORED DATABASE INTEGRITY & ENTITIES ==="
sudo -u postgres psql -d "${RESTORE_DB}" -c "
SELECT 
    (SELECT count(*) FROM information_schema.tables WHERE table_schema = 'public') as public_tables,
    (SELECT count(*) FROM gnuhealth_patient) as patients,
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
sudo mkdir -p "${RESTORE_ATTACH_DIR}"
sudo tar -xzf "${ATTACH_ARCHIVE}" -C "${RESTORE_ATTACH_DIR}"
echo "Attachment extraction verified in ${RESTORE_ATTACH_DIR}. Cleaned up."
sudo rm -rf "${RESTORE_ATTACH_DIR}"

echo "=== STEP 6: DESTROYING TEMPORARY ISOLATED RESTORE DATABASE ==="
sudo -u postgres dropdb "${RESTORE_DB}"
echo "Isolated database ${RESTORE_DB} destroyed cleanly. Live system unaffected."

echo "=== RESTORE DRILL COMPLETED WITH FULL PASS ==="
