## Next CLoud

used linuxserver.io image

site live at :4433

### Adding trusted domains

navigate to

`${CLOUD_PATH}/config/www/nextcloud/config`

then edit

`config.php`

there edit

```php
'trusted_domains' =>
  array (
   0 => 'localhost',
   1 => 'server1.example.com',
   2 => '192.168.1.50',
   3 => '[fe80::1:50]',
),
```

if you using a setup like mine using a vps as a reverse proxy to your home lab then next cloud is gonna kill you for sure

change these lines in the config

```php
<?php
$CONFIG = array (
  // ... (your existing configurations) ...
  'overwrite.cli.url' => 'https://nextcloud.tashif.codes',
  'trusted_proxies' => ['100.X.Y.Z'], // *** YOUR VPS TAILSCALE IP HERE ***
  'overwriteprotocol' => 'https',
  'overwritehost' => 'nextcloud.tashif.codes',
  // ... (rest of your existing configurations) ...
);
```

`PS. using this jancky setup tailscale and all because jio ffs asks for a business plan to give you a static ip ffs`

also keep yout schema as https for this (its emabarising to admit how much time i spent on this and NPM (Ningx Proxy Manager) just to fig out this was the problem)

### Euro-Office

Copy `nc.env.example` to `.env`, set a random `EURO_OFFICE_JWT_SECRET`, and
keep that value identical to the `jwt_secret` configured in Nextcloud.

The document service runs as UID `105` and GID `107`, so its persistent storage
must be writable by that account:

```sh
mkdir -p /mnt/hdd01/nextcloud/euro-office/data
sudo chown -R 105:107 /mnt/hdd01/nextcloud/euro-office/data
docker compose -f docker-compose.nc.yaml up -d euro-office
```

The current integration uses:

- Public document server: `https://office.taf.sh/`
- Internal document server: `http://euro-office/`
- Nextcloud callback URL: `https://drive.tashif.codes/`

PDF files open in Nextcloud's lightweight native viewer by default. A pencil
button in the preview toolbar and the `Edit in Nextcloud Office` file action
open the full PDF editor when it is needed. The Office overview does not list
PDF files, so start PDF editing from Files or from an open native preview. This
avoids starting the full Office editor for an ordinary preview, especially on
mobile devices.

The Office container has a 1 GiB shared-memory segment and writable HOME/cache
paths for its unprivileged document service. Keep these settings: without the
writable cache, optimized image processing is disabled; Docker's 64 MiB default
shared memory is also too small for larger PDF workloads.

The Nginx Proxy Manager host for `office.taf.sh` overrides caching only for the
exact static `/web-apps/apps/api/documents/api.js` SDK bootstrap (five-minute
origin browser cache; Cloudflare can extend it to the zone's browser-cache
minimum). Document bodies, callbacks, conversion APIs, and WebSockets are not
cached.

Cloudflare Cache Rules make only the static PDF application bundles eligible
for edge caching:

- `drive.tashif.codes`: files under the PDF viewer's `js`, `css`, and `img`
  directories with an explicit static extension.
- `office.taf.sh`: files under `web-apps` or `sdkjs` with an explicit static
  extension, including the PDF engine's WASM module.

Both rules respect the origin TTL and retain the query string in the cache key.
They must never be broadened to DAV paths, `/cache/files/data`, `/downloadfile`,
document callbacks, API responses, HTML, or WebSockets.

After restoring the database or connector configuration, run:

```sh
bash configure-office-pdf-default.sh
```

This keeps native PDF viewing as the default without disabling PDF editing in
Office.

Verify the connector after deployment:

```sh
docker exec -u abc nextcloud php /app/www/public/occ eurooffice:documentserver --check
```

### Performance cache and locking

`nextcloud-redis` is the persistent Redis service used for Nextcloud's
distributed cache and file locking. Keep these values in `config.php` when
recreating the stack:

```php
'memcache.distributed' => '\\OC\\Memcache\\Redis',
'memcache.locking' => '\\OC\\Memcache\\Redis',
'redis' => [
    'host' => 'nextcloud-redis',
    'port' => 6379,
],
```

The versioned `custom-cont-init.d` scripts restore the ImageMagick preview
support supplied by the container, add the Office edit action to native PDF
previews, and work around the Office 1.0.0 overview query bug. Office otherwise
combines all document MIME types into one DAV search, allowing the server's
first 100 Markdown results to hide Word, spreadsheet, and presentation files.
The workaround searches each MIME type separately and requests up to the
overview's 200-file display limit.

The production metadata database is MariaDB on the mSATA SSD at
`/mnt/hdd01/nextcloud/mariadb`. The previous SQLite database is retained as a
rollback artifact; do not delete it until the MariaDB deployment has been
backed up and observed in normal use. Database passwords live only in the
ignored `.env` file.

`backup-nextcloud-db.sh` writes an atomic, validated, UTF-8 MariaDB dump to the
separate `/mnt/hdd03/nextcloud-backups/mariadb` disk. The home-server user cron
runs it nightly and retains 14 days. It never prunes the pre-migration SQLite
snapshots.

Persistent PHP overrides live at `${CLOUD_PATH}/config/php/php-local.ini`; the
versioned reference is `config-snippets/php-local.ini`. The PHP-FPM pool is
configured at `${CLOUD_PATH}/config/php/www2.conf` for 20 workers. Avoid raising
that value without measuring worker RSS and available memory.

### MIME mappings + previews

Custom extension mappings and icon aliases live on the server at
`${CLOUD_PATH}/config/www/nextcloud/config/mimetypemapping.json` and
`mimetypealiases.json`. Copies for reference are in `config-snippets/`.

After editing either file:

```sh
docker exec -u abc nextcloud php /app/www/public/occ maintenance:mimetype:update-db
docker exec -u abc nextcloud php /app/www/public/occ maintenance:mimetype:update-js
# optional: rewrite filecache for existing files
docker exec -u abc nextcloud php /app/www/public/occ maintenance:mimetype:update-db --repair-filecache
```

`config.php` enables HEIC / TIFF / SVG preview providers in addition to the
stock image/text/PDF set.
