#!/usr/bin/env bash
# Complete the 2026-08-21 media migration from the copy that containers
# already use. Nextcloud is deliberately outside this script.
set -Eeuo pipefail

run_id="$(date +%Y%m%dT%H%M%S)"
base_dir="/home/taf/HeeeHa"
root_movies="$base_dir/movies"
root_downloads="$base_dir/downloads"
old_live_tier="/mnt/hdd02/media-tier-20260821T052203"
canonical_tier="/mnt/hdd02/media"
safety_copy="/mnt/hdd03/.homelab-backups/media-tier-20260821T052203"
rollback_movies="$base_dir/.movies-stale-root-$run_id"
rollback_downloads="$base_dir/.downloads-stale-root-$run_id"
arr_dir="/home/taf/home-lab-yaml/arr_stack"
jellyfin_dir="/home/taf/home-lab-yaml/jellyfin"
log_file="/home/taf/home-lab-yaml/scripts/media-tier-completion-$run_id.log"

arr_stopped=0
jellyfin_stopped=0
exec > >(tee -a "$log_file") 2>&1

restart_on_error() {
	local exit_code=$?
	if (( exit_code == 0 )); then
		exit 0
	fi
	printf 'Completion failed with exit %s. No stale copy was deleted.\n' "$exit_code"
	if (( arr_stopped )); then
		(cd "$arr_dir" && docker compose -f docker-compose.arr.yaml up -d) || true
	fi
	if (( jellyfin_stopped )); then
		(cd "$jellyfin_dir" && docker compose -f docker-compose.jelly.yaml up -d) || true
	fi
	exit "$exit_code"
}
trap restart_on_error EXIT

fail() {
	printf 'ERROR: %s\n' "$1" >&2
	exit 1
}

require_real_dir() {
	[[ -d "$1" && ! -L "$1" ]] || fail "expected a real directory: $1"
}

container_running() {
	[[ "$(docker inspect -f '{{.State.Running}}' "$1")" == "true" ]] || fail "$1 is not running"
}

same_inode() {
	local host_path="$1"
	local container_name="$2"
	local container_path="$3"
	local host_inode container_inode
	host_inode="$(stat -c '%d:%i' "$host_path")"
	container_inode="$(docker exec "$container_name" stat -c '%d:%i' "$container_path")"
	[[ "$host_inode" == "$container_inode" ]] || fail "$container_name:$container_path is not mounted from $host_path"
}

http_ok() {
	local url="$1"
	local attempt status_code
	for attempt in {1..12}; do
		if status_code="$(curl -sS --max-time 20 -o /dev/null -w '%{http_code}' "$url")"; then
			case "$status_code" in
				2*|3*)
					printf '%s -> HTTP %s\n' "$url" "$status_code"
					return 0
					;;
			esac
		fi
		printf '%s is not ready yet (attempt %s/12); retrying.\n' "$url" "$attempt"
		sleep 5
	done
	fail "$url did not become ready after 12 attempts"
}

printf 'Media migration completion started at %s\n' "$(date -Is)"
printf 'Nextcloud paths do not appear in this script.\n'

require_real_dir "$root_movies"
require_real_dir "$root_downloads"
require_real_dir "$old_live_tier"
require_real_dir "$old_live_tier/movies"
require_real_dir "$old_live_tier/downloads"
require_real_dir "$safety_copy"
if [[ -e "$canonical_tier" ]]; then
	require_real_dir "$canonical_tier"
	if find "$canonical_tier" -mindepth 1 ! -type d -print -quit | grep -q .; then
		fail "$canonical_tier contains files or links"
	fi
	printf 'Removing the empty legacy scaffold at %s.\n' "$canonical_tier"
	find "$canonical_tier" -depth -mindepth 1 -type d -empty -delete
	rmdir -- "$canonical_tier" || fail "$canonical_tier contains non-empty directories"
fi
container_running nextcloud

# The failed run restarted these containers while the host paths were symlinks.
# Their bind mounts still point at hdd02 even though rollback restored root dirs.
same_inode "$old_live_tier/movies" jellyfin /data/Movies
same_inode "$old_live_tier/movies" radarr /data/movies
same_inode "$old_live_tier/movies" tdarr /media/movies
same_inode "$old_live_tier/downloads" qbittorrent /downloads

printf 'Stopping only Arr and Jellyfin for the final frozen copy.\n'
(cd "$arr_dir" && docker compose -f docker-compose.arr.yaml down)
arr_stopped=1
(cd "$jellyfin_dir" && docker compose -f docker-compose.jelly.yaml down)
jellyfin_stopped=1

printf 'Refreshing hdd03 safety copy from the live hdd02 tree.\n'
ionice -c2 -n7 rsync -aHAXS --numeric-ids --partial --delete --info=stats2 \
	"$old_live_tier/" "$safety_copy/"

printf 'Running full checksum comparison.\n'
verification_report="$(rsync -aHAXS --numeric-ids --checksum --dry-run --delete --itemize-changes \
	"$old_live_tier/" "$safety_copy/")"
[[ -z "$verification_report" ]] || {
	printf '%s\n' "$verification_report"
	fail 'hdd02 and hdd03 differ after checksum verification'
}
printf 'Checksum comparison passed.\n'

printf 'Renaming the live tier to its stable path and switching host paths.\n'
mv -- "$old_live_tier" "$canonical_tier"
mv -- "$root_movies" "$rollback_movies"
mv -- "$root_downloads" "$rollback_downloads"
ln -s "$canonical_tier/movies" "$root_movies"
ln -s "$canonical_tier/downloads" "$root_downloads"

printf 'Starting Arr and Jellyfin on the stable paths.\n'
(cd "$arr_dir" && docker compose -f docker-compose.arr.yaml up -d)
arr_stopped=0
(cd "$jellyfin_dir" && docker compose -f docker-compose.jelly.yaml up -d)
jellyfin_stopped=0
sleep 20

for container_name in radarr sonarr qbittorrent jellyfin tdarr; do
	container_running "$container_name"
done
container_running nextcloud

same_inode "$canonical_tier/movies" jellyfin /data/Movies
same_inode "$canonical_tier/movies" radarr /data/movies
same_inode "$canonical_tier/movies" tdarr /media/movies
same_inode "$canonical_tier/downloads" qbittorrent /downloads
same_inode "$canonical_tier/downloads" radarr /downloads

http_ok http://127.0.0.1:4201/
http_ok http://127.0.0.1:4203/
http_ok http://127.0.0.1:4206/

[[ -L "$root_movies" && "$(readlink -f "$root_movies")" == "$canonical_tier/movies" ]] || fail 'movies symlink validation failed'
[[ -L "$root_downloads" && "$(readlink -f "$root_downloads")" == "$canonical_tier/downloads" ]] || fail 'downloads symlink validation failed'
require_real_dir "$rollback_movies"
require_real_dir "$rollback_downloads"
require_real_dir "$safety_copy"

printf 'All checks passed. Removing the two stale 153G copies.\n'
rm -rf -- "$rollback_movies" "$rollback_downloads"
rm -rf -- "$safety_copy"

printf 'Media migration completed at %s\n' "$(date -Is)"
df -h / /mnt/hdd01 /mnt/hdd02 /mnt/hdd03
find /mnt/hdd02 /mnt/hdd03 -maxdepth 3 -type d -name 'media-tier-*' -print
touch "/home/taf/home-lab-yaml/scripts/media-tier-migration-complete-$run_id"
