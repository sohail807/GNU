#!/bin/bash
# Single-purpose, narrowly-scoped provisioning script: creates a new tenant PostgreSQL
# database by cloning the fixed GNU Health template dump. Invoked by the Next.js app
# (as an unprivileged user) via a sudoers rule limited to exactly this script -- nothing
# else is granted. Takes exactly one argument: the new database name.
set -euo pipefail

DB_NAME="${1:-}"
TEMPLATE="/var/backups/gnuhealth/gnuhealth_template.dump"
TRYTOND_CONF="/home/gnuhealth/trytond.conf"
TRYTOND_ADMIN="/home/gnuhealth/venv/bin/trytond-admin"

if [[ -z "$DB_NAME" ]]; then
  echo "Usage: $0 <db_name>" >&2
  exit 2
fi

# Strict allow-list: gnuhealth_ prefix, lowercase alnum/underscore only, bounded length.
# This is the only input this script trusts, so it must reject anything else outright.
if [[ ! "$DB_NAME" =~ ^gnuhealth_[a-z0-9_]{1,40}$ ]]; then
  echo "Rejected: invalid database name '$DB_NAME'" >&2
  exit 1
fi

if [[ ! -f "$TEMPLATE" ]]; then
  echo "Template dump not found at $TEMPLATE" >&2
  exit 1
fi

EXISTING=$(sudo -u postgres psql -tAc "SELECT 1 FROM pg_database WHERE datname = '${DB_NAME}';")
if [[ "$EXISTING" == "1" ]]; then
  echo "Rejected: database '$DB_NAME' already exists" >&2
  exit 1
fi

sudo -u postgres createdb -O gnuhealth "$DB_NAME"

# From here on this script owns the new database. If anything below fails, drop it again: a half-built
# database still carries the template's default admin password, so it must never be left routable.
CREATED=1
FINISHED=0
cleanup_on_failure() {
  if [[ "${CREATED:-0}" == "1" && "${FINISHED:-0}" != "1" ]]; then
    echo "Provisioning failed; removing incomplete database $DB_NAME" >&2
    sudo -u postgres dropdb --force --if-exists "$DB_NAME" || true
  fi
}
trap cleanup_on_failure ERR

# /var/backups/gnuhealth is 700 (postgres-only) so the gnuhealth OS user can't read the
# template dump directly. Restoring as postgres with --no-owner instead would leave every
# restored object owned by postgres, invisible to the gnuhealth role trytond connects as --
# so the dump is staged into a private, gnuhealth-owned tmp copy and restored AS gnuhealth,
# which makes --no-owner assign ownership to gnuhealth (the connecting role) as intended.
RUN_DIR=$(mktemp -d /tmp/ist-provision.XXXXXX)
trap 'rm -rf "$RUN_DIR"' EXIT
# mktemp creates this 700 and root-owned (the script runs as root via sudo) -- hand the
# whole directory to gnuhealth so it can actually traverse into it, not just read the file.
chown gnuhealth:gnuhealth "$RUN_DIR"

STAGED_TEMPLATE="$RUN_DIR/template.dump"
cp "$TEMPLATE" "$STAGED_TEMPLATE"
chown gnuhealth:gnuhealth "$STAGED_TEMPLATE"
chmod 400 "$STAGED_TEMPLATE"

# pg_restore on a template dump commonly reports non-fatal warnings (e.g. ownership of
# objects it can't re-assign) and exits 1 even on a good restore -- don't treat that alone
# as failure, just don't let the whole script abort on it.
sudo -u gnuhealth pg_restore -O -x -d "$DB_NAME" "$STAGED_TEMPLATE" || true

# The template's admin account carries the password baked in when the template was built.
# Every clone would otherwise share that same known password -- generate a fresh one for
# THIS tenant right now, so no two hospitals (and no hospital + the template itself) ever
# share a credential. The password file lives in the same private per-run tmp dir, removed
# in the trap above regardless of outcome.
NEW_PASSWORD=$(openssl rand -base64 24 | tr -dc 'A-Za-z0-9' | head -c 20)
PASS_FILE="$RUN_DIR/admin_pw"
printf '%s' "$NEW_PASSWORD" > "$PASS_FILE"
chown gnuhealth:gnuhealth "$PASS_FILE"
chmod 400 "$PASS_FILE"

sudo -u gnuhealth env TRYTONPASSFILE="$PASS_FILE" "$TRYTOND_ADMIN" -c "$TRYTOND_CONF" -d "$DB_NAME" -p >/dev/null

FINISHED=1
echo "OK: provisioned $DB_NAME"
echo "ADMIN_USERNAME=admin"
echo "ADMIN_PASSWORD=$NEW_PASSWORD"
