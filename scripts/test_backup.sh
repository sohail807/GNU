#!/bin/bash
set -e
echo "=== SYSTEMD TIMER UNIT FILE ==="
cat /etc/systemd/system/gnuhealth-backup.timer

echo "=== SYSTEMD TIMER STATUS ==="
systemctl status gnuhealth-backup.timer --no-pager

echo "=== MANUAL EXECUTION OF BACKUP SCRIPT ==="
sudo /usr/local/bin/gnuhealth-backup.sh

echo "=== VERIFY GENERATED BACKUP FILES ==="
sudo ls -lh /var/backups/gnuhealth/

echo "=== VERIFY RETENTION AND CHECKSUM ==="
latest_dump=$(sudo ls -t /var/backups/gnuhealth/*.dump | head -n 1)
latest_attach=$(sudo ls -t /var/backups/gnuhealth/*.tar.gz | head -n 1)
echo "Latest dump: $latest_dump"
echo "Latest attach: $latest_attach"
sudo ls -l "$latest_dump" "$latest_attach"
sudo -u postgres pg_restore -l "$latest_dump" | wc -l
sudo sha256sum "$latest_dump"
sudo tar -tzf "$latest_attach"