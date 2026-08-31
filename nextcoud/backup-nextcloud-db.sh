#!/usr/bin/env bash
set -euo pipefail

backup_dir=/mnt/hdd03/nextcloud-backups/mariadb
stamp="$(date -u +%Y%m%dT%H%M%SZ)"
partial="$backup_dir/nextcloud-$stamp.sql.gz.partial"
output="${partial%.partial}"

mkdir -p "$backup_dir"
chmod 700 "$backup_dir"

cleanup() {
    rm -f "$partial"
}
trap cleanup EXIT

docker exec nextcloud-db sh -lc \
    'exec mariadb-dump --single-transaction --quick --default-character-set=utf8mb4 -unextcloud -p"$MARIADB_PASSWORD" nextcloud' \
    | gzip -9 > "$partial"

gzip -t "$partial"
chmod 600 "$partial"
mv "$partial" "$output"
trap - EXIT

# Retain two weeks of daily dumps. Pre-migration SQLite snapshots are managed
# separately and are intentionally not touched here.
find "$backup_dir" -maxdepth 1 -type f -name 'nextcloud-*.sql.gz' -mtime +14 -delete

echo "$output"
