#!/bin/bash
set -euo pipefail

BACKUP_DIR="/var/backups/gnuhealth"
ATTACH_DIR="/home/gnuhealth/attach"
LOG_FILE="/var/log/gnuhealth_backup.log"
RETENTION_DAYS=14
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

mkdir -p "${BACKUP_DIR}"
chmod 700 "${BACKUP_DIR}"

DB_BACKUP="${BACKUP_DIR}/gnuhealth_db_${TIMESTAMP}.dump"
ATTACH_BACKUP="${BACKUP_DIR}/gnuhealth_attach_${TIMESTAMP}.tar.gz"

echo "[$(date -u +"%Y-%m-%dT%H:%M:%SZ")] Starting GNU Health production backup..." >> "${LOG_FILE}"

# 1. PostgreSQL Database Dump (Custom Format)
if sudo -u postgres pg_dump -Fc gnuhealth -f "${DB_BACKUP}"; then
    chmod 600 "${DB_BACKUP}"
    DB_SHA=$(sha256sum "${DB_BACKUP}" | awk '{print $1}')
    DB_SIZE=$(du -h "${DB_BACKUP}" | awk '{print $1}')
    echo "[$(date -u +"%Y-%m-%dT%H:%M:%SZ")] DB backup successful: ${DB_BACKUP} (Size: ${DB_SIZE}, SHA256: ${DB_SHA})" >> "${LOG_FILE}"
else
    echo "[$(date -u +"%Y-%m-%dT%H:%M:%SZ")] ERROR: PostgreSQL backup failed!" >> "${LOG_FILE}"
    exit 1
fi

# 2. Attachments directory backup
if [ -d "${ATTACH_DIR}" ]; then
    tar -czf "${ATTACH_BACKUP}" -C "${ATTACH_DIR}" .
    chmod 600 "${ATTACH_BACKUP}"
    ATTACH_SIZE=$(du -h "${ATTACH_BACKUP}" | awk '{print $1}')
    echo "[$(date -u +"%Y-%m-%dT%H:%M:%SZ")] Attachments backup successful: ${ATTACH_BACKUP} (Size: ${ATTACH_SIZE})" >> "${LOG_FILE}"
fi

# 4. Offsite copy to Google Cloud Storage (only if service-account key is present)
GCS_BUCKET="gs://ist-health-backups-509307"
GCS_KEY="/etc/gcs/ist-health-backup-key.json"
if [ -f "${GCS_KEY}" ]; then
    if gcloud auth activate-service-account --key-file="${GCS_KEY}" --quiet >> "${LOG_FILE}" 2>&1 \
       && gsutil -q cp "${DB_BACKUP}" "${GCS_BUCKET}/" >> "${LOG_FILE}" 2>&1; then
        echo "[$(date -u +"%Y-%m-%dT%H:%M:%SZ")] Uploaded ${DB_BACKUP} to ${GCS_BUCKET}" >> "${LOG_FILE}"
        if [ -f "${ATTACH_BACKUP}" ] && gsutil -q cp "${ATTACH_BACKUP}" "${GCS_BUCKET}/" >> "${LOG_FILE}" 2>&1; then
            echo "[$(date -u +"%Y-%m-%dT%H:%M:%SZ")] Uploaded ${ATTACH_BACKUP} to ${GCS_BUCKET}" >> "${LOG_FILE}"
        fi
    else
        echo "[$(date -u +"%Y-%m-%dT%H:%M:%SZ")] WARNING: GCS upload failed, local backup retained" >> "${LOG_FILE}"
    fi
else
    echo "[$(date -u +"%Y-%m-%dT%H:%M:%SZ")] GCS credentials not configured, local-only backup" >> "${LOG_FILE}"
fi

# 3. Retention Cleanup (older than 14 days)
find "${BACKUP_DIR}" -name "gnuhealth_db_*.dump" -mtime +${RETENTION_DAYS} -delete
find "${BACKUP_DIR}" -name "gnuhealth_attach_*.tar.gz" -mtime +${RETENTION_DAYS} -delete

echo "[$(date -u +"%Y-%m-%dT%H:%M:%SZ")] Backup cycle completed cleanly." >> "${LOG_FILE}"
