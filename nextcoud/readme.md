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
