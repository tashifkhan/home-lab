# Tdarr Pre-Transcoding

Tdarr is part of the arr stack because it processes the same movie and show folders that Radarr, Sonarr, and Jellyfin use.

It lets Jellyfin keep the original 4K file and store generated `1080p` and `720p` versions for lower-bandwidth playback.

## Start

Add this to `arr_stack/.env`:

```env
TDARR_TRANSCODE_CACHE=/path/to/fast/transcode/cache
UMASK_SET=002
```

Then start the arr stack normally:

```sh
docker compose -f docker-compose.arr.yaml up -d
```

The Tdarr web UI will be available at `http://SERVER_IP:4210`.

The Tdarr server port is published as `4211` for external nodes. The included `tdarr-node` talks to the server over the Docker network and does not need the host port.

## Media Paths

Tdarr sees the media library as:

```text
/media/movies
/media/shows
```

These map to the same host folders Jellyfin already reads from `${ARR_PATH}/movies` and `${ARR_PATH}/shows`.

## Jellyfin Version Naming

Configure Tdarr output names so Jellyfin can group all versions together.

Movie example:

```text
Interstellar (2014) - 4K.mkv
Interstellar (2014) - 1080p SDR.mkv
Interstellar (2014) - 720p SDR.mkv
```

TV example:

```text
Show Name - S01E01 - Episode Title - 4K.mkv
Show Name - S01E01 - Episode Title - 1080p SDR.mkv
Show Name - S01E01 - Episode Title - 720p SDR.mkv
```

After Tdarr creates the extra files, refresh the Jellyfin library. Jellyfin should show a version selector in the player.

## Recommended Policy

Use this policy first and test it on one movie before scanning the full library:

- Keep the original file untouched.
- If source resolution is greater than `1080p`, create a `1080p SDR` copy.
- If source resolution is greater than `720p`, create a `720p SDR` copy.
- Do not create `1440p` by default.
- Use SSD storage for `TDARR_TRANSCODE_CACHE`.

Suggested outputs:

```text
1080p SDR: HEVC/H.265, good for remote viewing
720p SDR: H.264, good for weak devices and bad internet
```

## Hardware Acceleration

The Compose file is CPU-safe by default. For 4K HDR sources, hardware acceleration is strongly recommended.

For Intel Quick Sync, add this to `tdarr-node` after confirming `/dev/dri` exists on the host:

```yaml
    devices:
      - /dev/dri:/dev/dri
```

For NVIDIA, install the NVIDIA container runtime first, then add the NVIDIA runtime/device configuration for your Docker setup.

## Important

Radarr and Sonarr generally manage one primary file per movie or episode. Test with one movie first and confirm Radarr/Sonarr do not remove the Tdarr-created versions before enabling this across the whole library.
