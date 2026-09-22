#!/bin/bash
set -e
backup_file="/var/backups/gnuhealth/gnuhealth_db_20260922_135511.dump"
test_db="gnuhealth_isolated_restore_test"

echo "=== RESTORE DRILL START ==="
start_time=$(date +%s)

echo "Creating isolated test database: $test_db"
sudo -u postgres dropdb --if-exists "$test_db"
sudo -u postgres createdb -O gnuhealth "$test_db"

echo "Restoring backup: $backup_file"
sudo -u postgres pg_restore -d "$test_db" "$backup_file" || true

end_time=$(date +%s)
duration_sec=$((end_time - start_time))
echo "Restore duration: approximately ${duration_sec} seconds"

echo "=== VERIFYING RESTORED DATABASE ==="
table_count=$(sudo -u postgres psql -d "$test_db" -t -A -c "SELECT count(*) FROM information_schema.tables WHERE table_schema = 'public';")
echo "Public table count: $table_count"

echo "Representative GNU Health structures:"
sudo -u postgres psql -d "$test_db" -c "SELECT id, name FROM party_party LIMIT 5;"
sudo -u postgres psql -d "$test_db" -c "SELECT id, code, name FROM account_account WHERE code IN ('101000', '110000', '401000');"
sudo -u postgres psql -d "$test_db" -c "SELECT id, name, start_date, end_date, state FROM account_fiscalyear;"
sudo -u postgres psql -d "$test_db" -c "SELECT count(*) as specialties FROM gnuhealth_specialty;"

echo "=== CLEANING UP TEMPORARY RESTORE DATABASE ==="
sudo -u postgres dropdb "$test_db"
echo "Isolated restore database dropped cleanly."

echo "=== RESTORE DRILL COMPLETE ==="
