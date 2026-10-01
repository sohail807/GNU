#!/usr/bin/env bash
# One step to bring the Aster tenant up to date on the VM:
#   1. install / update the IST Tryton modules in the Aster database (backs it up first, restarts the backend once)
#   2. remove "(synthetic)" tags from free-text clinical notes
# Run from the repository root:   bash scripts/finish_aster_tenant.sh
set -euo pipefail
KEY="${SSH_KEY:-$HOME/.ssh/gnuhealth_deploy}"
HOST="${VM_HOST:-debian@34.7.237.8}"
DB="${1:-gnuhealth_h_aster}"

bash scripts/install_ist_modules.sh "$DB"
echo "== cleaning note labels in $DB"
ssh -i "$KEY" -o StrictHostKeyChecking=no "$HOST" "sudo -u postgres psql -d $DB -f -" < scripts/aster_demo/scrub_labels.sql
echo "== done"
