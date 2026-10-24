#!/bin/sh
# keep books, music and playlists under "More" in the top bar
grep -l 'return v?8:y?5:3' /usr/share/jellyfin/web/*.js 2>/dev/null | while read -r f; do
  sed -i 's/return v?8:y?5:3/return v?4:y?4:3/' "$f"
  rm -f "$f.gz" "$f.br"
done
