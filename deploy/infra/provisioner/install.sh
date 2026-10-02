#!/bin/bash
# Installs one-click hospital provisioning on the database VM. Run as root:
#
#   sudo bash install.sh <dir with the repo's deploy/infra files> <file containing the provisioner token>
#
# What it does, safest steps first (every step that can break a live service is tested and rolled back):
#   1. ist-provisioner service (127.0.0.1:8200, token-protected)
#   2. nginx: routes only `gnuhealth` and `gnuhealth_h_<code>` databases, plus POST /_provision (config-tested)
#   3. nightly backup script that discovers hospital databases from PostgreSQL
#   4. removes the backend's TRYTOND_DATABASE_NAMES allow-list (so new hospitals need no restart) -- ONE
#      backend restart (a few seconds), auto-rolled-back if the backend does not recover
# Safe to re-run. The token file is shredded after use.
set -euo pipefail

SRC="${1:?usage: install.sh <files dir> <token file>}"
TOKEN_FILE="${2:?usage: install.sh <files dir> <token file>}"
API_HOST="api.isthealth.irisstar.tech"
SSLIP_HOST="34-7-237-8.sslip.io"
STAMP=$(date +%Y%m%d_%H%M%S)
BK="/root/ist-install-backup-${STAMP}"
mkdir -p "$BK"

[ "$(id -u)" = 0 ] || { echo "run as root"; exit 1; }
TOKEN=$(tr -d '[:space:]' < "$TOKEN_FILE")
[ "${#TOKEN}" -ge 32 ] || { echo "token must be >= 32 chars"; exit 1; }
for f in provisioner/ist-provisioner.py provisioner/ist-provisioner.service nginx/api443-domain.conf.template nginx/api443-sslip.conf.template scripts/gnuhealth-backup.sh; do
  [ -f "$SRC/$f" ] || { echo "missing $SRC/$f"; exit 1; }
done
[ -x /usr/local/bin/ist-provision-tenant.sh ] || { echo "/usr/local/bin/ist-provision-tenant.sh missing"; exit 1; }

echo "== 1/4 provisioning service"
install -d -m 755 /usr/local/lib/ist-provisioner
install -m 755 "$SRC/provisioner/ist-provisioner.py" /usr/local/lib/ist-provisioner/ist-provisioner.py
install -m 644 "$SRC/provisioner/ist-provisioner.service" /etc/systemd/system/ist-provisioner.service
( umask 077; printf 'PROVISIONER_TOKEN=%s\n' "$TOKEN" > /etc/ist-provisioner.env )
chmod 600 /etc/ist-provisioner.env
systemctl daemon-reload
systemctl enable ist-provisioner >/dev/null 2>&1
systemctl restart ist-provisioner
for i in $(seq 1 10); do curl -fsS http://127.0.0.1:8200/health >/dev/null 2>&1 && break; sleep 1; done
curl -fsS http://127.0.0.1:8200/health >/dev/null || { echo "provisioner failed to start"; journalctl -u ist-provisioner -n 20 --no-pager; exit 1; }
echo "   provisioner healthy"

echo "== 2/4 nginx"
for s in api443 api443-domain; do
  [ -e "/etc/nginx/sites-available/$s" ] && cp -p "/etc/nginx/sites-available/$s" "$BK/$s" || true
done
sed "s/@HOST@/${API_HOST}/g" "$SRC/nginx/api443-domain.conf.template" > /etc/nginx/sites-available/api443-domain
sed "s/@HOST@/${SSLIP_HOST}/g" "$SRC/nginx/api443-sslip.conf.template" > /etc/nginx/sites-available/api443
ln -sf /etc/nginx/sites-available/api443-domain /etc/nginx/sites-enabled/api443-domain
ln -sf /etc/nginx/sites-available/api443 /etc/nginx/sites-enabled/api443
if nginx -t 2>&1; then
  systemctl reload nginx
  echo "   nginx reloaded"
else
  echo "nginx test FAILED - restoring previous site files"
  for s in api443 api443-domain; do [ -e "$BK/$s" ] && cp -p "$BK/$s" "/etc/nginx/sites-available/$s"; done
  nginx -t && systemctl reload nginx
  exit 1
fi

echo "== 3/4 backup script"
[ -e /usr/local/bin/gnuhealth-backup.sh ] && cp -p /usr/local/bin/gnuhealth-backup.sh "$BK/gnuhealth-backup.sh"
install -m 755 -o root -g root "$SRC/scripts/gnuhealth-backup.sh" /usr/local/bin/gnuhealth-backup.sh
echo "   databases the backup will cover: $(/usr/local/bin/gnuhealth-backup.sh --list-databases | tr '\n' ' ')"

echo "== 4/4 backend: remove the database allow-list (one restart)"
DROPIN_DIR=/etc/systemd/system/gnuhealth.service.d
DROPIN="$DROPIN_DIR/databases.conf"
mkdir -p "$DROPIN_DIR"
[ -e "$DROPIN" ] && cp -p "$DROPIN" "$BK/databases.conf" || true
# Keep every existing Environment value except TRYTOND_DATABASE_NAMES.
KEEP=$(systemctl show gnuhealth -p Environment --value | tr ' ' '\n' | grep -v '^TRYTOND_DATABASE_NAMES=' | grep -v '^$' || true)
{
  echo "[Service]"
  echo "# Reset, then re-add everything except the TRYTOND_DATABASE_NAMES allow-list. Which databases are"
  echo "# reachable is decided by nginx (gnuhealth | gnuhealth_h_<code>), so adding a hospital needs no restart."
  echo "Environment="
  while read -r kv; do [ -n "$kv" ] && echo "Environment=$kv"; done <<< "$KEEP"
} > "$DROPIN"
systemctl daemon-reload
systemctl restart gnuhealth
probe() { curl -s -o /dev/null -w '%{http_code}' -X POST http://127.0.0.1:8000/gnuhealth/ -H 'content-type: application/json' -d '{"id":1,"method":"common.db.login","params":["x",{"password":"x"}]}'; }
OK=0
for i in $(seq 1 30); do [ "$(probe)" = "401" ] && { OK=1; break; }; sleep 1; done
if [ "$OK" != 1 ]; then
  echo "BACKEND DID NOT RECOVER - rolling back"
  if [ -e "$BK/databases.conf" ]; then cp -p "$BK/databases.conf" "$DROPIN"; else rm -f "$DROPIN"; fi
  systemctl daemon-reload; systemctl restart gnuhealth
  exit 1
fi
echo "   backend healthy after ${i}s"

shred -u "$TOKEN_FILE" 2>/dev/null || rm -f "$TOKEN_FILE"
echo
echo "DONE. Backups of the previous files are in $BK"
echo "Checks:"
echo "  main db            : $(curl -s -o /dev/null -w '%{http_code}' -X POST https://${API_HOST}/gnuhealth/ -H 'content-type: application/json' -d '{"id":1,"method":"common.db.login","params":["x",{"password":"x"}]}')  (expect 401)"
echo "  staging/test db    : $(curl -s -o /dev/null -w '%{http_code}' -X POST https://${API_HOST}/gnuhealth_staging/ -H 'content-type: application/json' -d '{}')  (expect 404: not routable)"
echo "  provision, no token: $(curl -s -o /dev/null -w '%{http_code}' -X POST https://${API_HOST}/_provision -H 'content-type: application/json' -d '{"code":"x"}')  (expect 401)"
