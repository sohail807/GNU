#!/usr/bin/env bash
# Install the IST Tryton modules (ist_claims: insurer pre-authorizations and claims; ist_ops: emergency department,
# admission plans, discharge clearance, referrals, pharmacy stock) on the VM and activate them in the given hospital
# databases. Run from the repository root:
#
#   bash scripts/install_ist_modules.sh gnuhealth_h_aster [more databases...]
#
# Each database is dumped to /tmp on the VM first. Safe to run again (module files are replaced and the databases
# updated in place). The backend restarts once at the end; sessions survive.
set -euo pipefail
[ $# -ge 1 ] || { echo "usage: $0 <database> [database...]"; exit 1; }
KEY="${SSH_KEY:-$HOME/.ssh/gnuhealth_deploy}"
HOST="${VM_HOST:-debian@34.7.237.8}"
DBS="$*"
SSH=(ssh -i "$KEY" -o StrictHostKeyChecking=no "$HOST")

# upload first (stdin is then free for the remote script)
tar czf /tmp/ist_modules.tgz -C deploy/modules ist_claims ist_ops
scp -i "$KEY" -o StrictHostKeyChecking=no /tmp/ist_modules.tgz "$HOST:/tmp/ist_modules.tgz"

"${SSH[@]}" "DBS='$DBS' bash -s" <<'REMOTE'
set -euo pipefail
MODS=/home/gnuhealth/venv/lib/python3.11/site-packages/trytond/modules
CONF=/home/gnuhealth/trytond.conf
ADMIN=/home/gnuhealth/venv/bin/trytond-admin
sudo rm -rf /tmp/ist_modules_up && mkdir /tmp/ist_modules_up
tar xzf /tmp/ist_modules.tgz -C /tmp/ist_modules_up
for m in ist_claims ist_ops; do
  sudo rm -rf "$MODS/$m"
  sudo cp -r "/tmp/ist_modules_up/$m" "$MODS/$m"
  sudo chown -R gnuhealth:gnuhealth "$MODS/$m"
done
for db in $DBS; do
  sudo -u postgres pg_dump -Fc "$db" -f "/tmp/${db}_before_ist_modules.dump"
  # register the new modules in the database's module list, then activate/update them
  sudo -u gnuhealth "$ADMIN" -c "$CONF" -d "$db" -m
  sudo -u gnuhealth "$ADMIN" -c "$CONF" -d "$db" -u ist_claims ist_ops --activate-dependencies
  sudo -u postgres psql -d "$db" -At -c "select name || ' in $db: ' || state from ir_module where name in ('ist_claims','ist_ops') order by name;"
done
sudo systemctl restart gnuhealth
sleep 6
systemctl is-active gnuhealth
REMOTE
