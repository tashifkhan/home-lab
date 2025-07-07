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
