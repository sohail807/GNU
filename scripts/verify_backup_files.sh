#!/bin/bash
set -e
latest_dump=$(ls -t /var/backups/gnuhealth/*.dump | head -n 1)
latest_attach=$(ls -t /var/backups/gnuhealth/*.tar.gz | head -n 1)
echo "Latest dump: $latest_dump"
echo "Latest attach: $latest_attach"
ls -la "$latest_dump" "$latest_attach"
echo "Catalog entries:"
sudo -u postgres pg_restore -l "$latest_dump" | wc -l
echo "SHA-256:"
sha256sum "$latest_dump"
echo "Tarball contents:"
tar -tzf "$latest_attach"
