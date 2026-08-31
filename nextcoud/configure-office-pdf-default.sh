#!/usr/bin/env bash

set -euo pipefail

# Keep the full Office PDF editor available as a file action, but let routine
# clicks use Nextcloud's much lighter built-in PDF viewer.
# `occ config:app:set` normalizes the JSON object's quotes on Nextcloud 34.
# Write through Nextcloud's config API so the connector receives valid JSON.
docker exec -u 1000 nextcloud php -r '
require "/app/www/public/lib/base.php";
$config = \OC::$server->get(\OCP\IAppConfig::class);
$config->setValueString("eurooffice", "defFormats", "{\"pdf\":false}");
'

actual="$(docker exec nextcloud occ config:app:get eurooffice defFormats)"
if [[ "$actual" != '{"pdf":false}' ]]; then
  printf 'Unexpected eurooffice defFormats value: %s\n' "$actual" >&2
  exit 1
fi

docker exec nextcloud occ config:app:get eurooffice editFormats
