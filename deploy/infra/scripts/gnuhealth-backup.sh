#!/bin/bash
# Daily GNU Health backup for EVERY hospital database the backend serves.
#
#   gnuhealth-backup.sh                  run the backup
#   gnuhealth-backup.sh --list-databases print the databases that would be backed up, then exit
#
# Which databases: the main `gnuhealth` database plus every name in the gnuhealth service's
# TRYTOND_DATABASE_NAMES (the same allow-list the backend serves, so a hospital is backed up exactly
# when it is live; test/UAT databases that are not served are not).
#
# Output files in BACKUP_DIR:
#   gnuhealth_db_<ts>.dump                  main database (unchanged name: restore drills rely on it)
#   gnuhealth_tenant_<dbname>_<ts>.dump     one per additional hospital database
#   gnuhealth_attach_<ts>.tar.gz            attachment store (one directory holds every database)
set -uo pipefail

BACKUP_DIR="${BACKUP_DIR:-/var/backups/gnuhealth}"
ATTACH_DIR="${ATTACH_DIR:-/home/gnuhealth/attach}"
LOG_FILE="${LOG_FILE:-/var/log/gnuhealth_backup.log}"
MAIN_DB="gnuhealth"
SERVICE="gnuhealth"
RETENTION_DAYS=14
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
GCS_BUCKET="gs://ist-health-backups-509307"
GCS_KEY="${GCS_KEY:-/etc/gcs/ist-health-backup-key.json}"

log() { echo "[$(date -u +"%Y-%m-%dT%H:%M:%SZ")] $*" >> "${LOG_FILE}"; }

# Databases to back up: main first, then every other valid name served by the backend.
resolve_databases() {
    local env_line names
    # `systemctl show` lists every Environment assignment; if the variable is defined more than
    # once (unit file + drop-in) systemd uses the last one, so do the same.
    env_line=$(systemctl show "${SERVICE}" -p Environment --value 2>/dev/null | tr ' ' '\n' | grep '^TRYTOND_DATABASE_NAMES=' | tail -n1)
    names="${env_line#TRYTOND_DATABASE_NAMES=}"
    {
        echo "${MAIN_DB}"
        echo "${names}" | tr ',' '\n'
    } | sed 's/[[:space:]]//g' | awk 'NF && !seen[$0]++' | while read -r db; do
        # Strict allow-list: it ends up in a file name and a command line.
        if [[ "${db}" =~ ^gnuhealth[a-z0-9_]{0,48}$ ]]; then
            echo "${db}"
        else
            log "WARNING: ignoring invalid database name in TRYTOND_DATABASE_NAMES: '${db}'"
        fi
    done
}

if [[ "${1:-}" == "--list-databases" ]]; then
    resolve_databases
    exit 0
fi

mkdir -p "${BACKUP_DIR}"
chmod 700 "${BACKUP_DIR}"

log "Starting GNU Health production backup..."

mapfile -t DATABASES < <(resolve_databases)
log "Databases to back up (${#DATABASES[@]}): ${DATABASES[*]}"

FAILED=()
DUMPS=()

# 1. PostgreSQL dump (custom format) per database. One failing hospital must not stop the rest.
for DB in "${DATABASES[@]}"; do
    if [[ "${DB}" == "${MAIN_DB}" ]]; then
        FILE="${BACKUP_DIR}/gnuhealth_db_${TIMESTAMP}.dump"
    else
        FILE="${BACKUP_DIR}/gnuhealth_tenant_${DB}_${TIMESTAMP}.dump"
    fi
    if sudo -u postgres pg_dump -Fc "${DB}" -f "${FILE}" \
       && sudo -u postgres pg_restore --list "${FILE}" > /dev/null 2>&1; then
        chmod 600 "${FILE}"
        SHA=$(sha256sum "${FILE}" | awk '{print $1}')
        SIZE=$(du -h "${FILE}" | awk '{print $1}')
        log "DB backup successful [${DB}]: ${FILE} (Size: ${SIZE}, SHA256: ${SHA})"
        DUMPS+=("${FILE}")
    else
        log "ERROR: PostgreSQL backup failed for database ${DB}!"
        rm -f "${FILE}"
        FAILED+=("${DB}")
    fi
done

# 2. Attachment store (a single directory covers every database)
ATTACH_BACKUP="${BACKUP_DIR}/gnuhealth_attach_${TIMESTAMP}.tar.gz"
if [ -d "${ATTACH_DIR}" ]; then
    if tar -czf "${ATTACH_BACKUP}" -C "${ATTACH_DIR}" .; then
        chmod 600 "${ATTACH_BACKUP}"
        ATTACH_SIZE=$(du -h "${ATTACH_BACKUP}" | awk '{print $1}')
        log "Attachments backup successful: ${ATTACH_BACKUP} (Size: ${ATTACH_SIZE})"
    else
        log "ERROR: attachments backup failed"
        rm -f "${ATTACH_BACKUP}"
        FAILED+=("attachments")
    fi
fi

# 3. Offsite copy to Google Cloud Storage (only if the service-account key is present)
if [ -f "${GCS_KEY}" ]; then
    if gcloud auth activate-service-account --key-file="${GCS_KEY}" --quiet >> "${LOG_FILE}" 2>&1; then
        for F in "${DUMPS[@]}" "${ATTACH_BACKUP}"; do
            [ -f "${F}" ] || continue
            if gsutil -q cp "${F}" "${GCS_BUCKET}/" >> "${LOG_FILE}" 2>&1; then
                log "Uploaded ${F} to ${GCS_BUCKET}"
            else
                log "WARNING: GCS upload failed for ${F}, local backup retained"
                FAILED+=("upload:$(basename "${F}")")
            fi
        done
    else
        log "WARNING: GCS authentication failed, local backups retained"
        FAILED+=("gcs-auth")
    fi
else
    log "GCS credentials not configured, local-only backup"
fi

# 4. Retention cleanup (older than ${RETENTION_DAYS} days)
find "${BACKUP_DIR}" -name "gnuhealth_db_*.dump" -mtime +${RETENTION_DAYS} -delete
find "${BACKUP_DIR}" -name "gnuhealth_tenant_*.dump" -mtime +${RETENTION_DAYS} -delete
find "${BACKUP_DIR}" -name "gnuhealth_attach_*.tar.gz" -mtime +${RETENTION_DAYS} -delete

if [ "${#FAILED[@]}" -gt 0 ]; then
    log "Backup cycle finished WITH FAILURES: ${FAILED[*]}"
    exit 1
fi
log "Backup cycle completed cleanly."
