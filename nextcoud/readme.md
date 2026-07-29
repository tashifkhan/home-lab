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

Verify the connector after deployment:

```sh
docker exec -u abc nextcloud php /app/www/public/occ eurooffice:documentserver --check
```

The versioned `custom-cont-init.d` scripts restore the ImageMagick preview
support supplied by the container and work around the Office 1.0.0 overview
query bug. Office otherwise combines all document MIME types into one DAV
search, allowing the server's first 100 Markdown results to hide Word,
spreadsheet, and presentation files. The workaround searches each MIME type
separately and requests up to the overview's 200-file display limit.
