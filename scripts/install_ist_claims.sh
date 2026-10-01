#!/usr/bin/env bash
# Install the ist_claims Tryton module (insurer pre-authorizations and claims) on the VM and activate it in the
# given hospital databases. Run from the repository root:
#
#   bash scripts/install_ist_claims.sh gnuhealth_h_aster [more databases...]
#
# Each database is dumped to /tmp on the VM first. Safe to run again (the module files are replaced and
# the databases are updated in place). The backend restarts once at the end; sessions survive.
set -euo pipefail
[ $# -ge 1 ] || { echo "usage: $0 <database> [database...]"; exit 1; }
KEY="${SSH_KEY:-$HOME/.ssh/gnuhealth_deploy}"
HOST="${VM_HOST:-debian@34.7.237.8}"
MODS=/home/gnuhealth/venv/lib/python3.11/site-packages/trytond/modules
CONF=/home/gnuhealth/trytond.conf
DBS="$*"

tar czf - -C deploy/modules ist_claims | ssh -i "$KEY" -o StrictHostKeyChecking=no "$HOST" "DBS='$DBS' MODS='$MODS' CONF='$CONF' bash -s" <<'REMOTE'
set -euo pipefail
sudo rm -rf /tmp/ist_claims_up && mkdir /tmp/ist_claims_up
tar xzf - -C /tmp/ist_claims_up
sudo rm -rf "$MODS/ist_claims"
sudo cp -r /tmp/ist_claims_up/ist_claims "$MODS/ist_claims"
sudo chown -R gnuhealth:gnuhealth "$MODS/ist_claims"
for db in $DBS; do
  sudo -u postgres pg_dump -Fc "$db" -f "/tmp/${db}_before_claims.dump"
  # register the new module in the database's module list, then activate/update it
  sudo -u gnuhealth /home/gnuhealth/venv/bin/trytond-admin -c "$CONF" -d "$db" -m
  sudo -u gnuhealth /home/gnuhealth/venv/bin/trytond-admin -c "$CONF" -d "$db" -u ist_claims --activate-dependencies
  sudo -u postgres psql -d "$db" -At -c "select 'ist_claims in $db:', state from ir_module where name='ist_claims';"
done
sudo systemctl restart gnuhealth
sleep 6
systemctl is-active gnuhealth
REMOTE
