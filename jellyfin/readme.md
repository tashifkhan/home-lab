# Jellyfin

Jellyfin uses port 4201. Seerr uses port 4202.

`custom-cont-init.d/10-topbar.sh` runs when Jellyfin starts. It limits the desktop
navigation to three library links, leaving Collections, Books, Music and Playlists
under More with the current library order.
The script retains all library views.

The script patches the navigation chunk, gives it a content-based filename,
updates the runtime's chunk mapping, and gives the runtime a new filename in
`index.html`. This avoids reusing cached JavaScript with the original filenames.
It also regenerates gzip files. If a web update changes the expected code or adds
Brotli files, the script reports an error for review.

The custom taflix Skins plugin is built from
<https://github.com/tashifkhan/jellyfin-plugin-skin-manager>. Its DLL includes
`skins-taflix.json`, so opening the selector does not depend on GitHub or Google
Fonts. Selecting Set Skin writes the selected imports to Branding CSS.
CSS imports still load from the theme hosts.

Before replacing the plugin or startup script, back up the configuration and
SQLite databases under `/mnt/hdd03/backups`. Test with the running image ID and
an independent configuration copy. Do not mount live configuration or writable
media into the test container. Check all six skin choices, saving Branding CSS,
load/save failures, desktop navigation, `/health`, and all seven library views.
