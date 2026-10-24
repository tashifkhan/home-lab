#!/bin/sh
set -eu

# Keep Books, Music and Playlists in More. Give changed assets new URLs so
# browsers and CDNs cannot reuse the original hashed navigation chunk.
web=${JELLYFIN_WEB_DIR:-/usr/share/jellyfin/web}
original='return v?8:y?5:3'
patched='return v?4:y?4:3'
found=0

for file in "$web"/*.chunk.js; do
    if grep -qF "$original" "$file"; then
        sed -i "s/return v?8:y?5:3/$patched/g" "$file"
    elif ! grep -qF "$patched" "$file"; then
        continue
    fi
    found=1
    name=${file##*/}
    chunk=${name%%.*}
    rest=${name#*.}
    old_hash=${rest%%.*}
    new_hash=$(sha256sum "$file" | cut -c1-20)
    new_name="$chunk.$new_hash.chunk.js"
    if [ "$name" != "$new_name" ]; then
        cp -p "$file" "$web/$new_name"
        # Retain the old file for clients that already loaded the old runtime.
        sed -i "s/$chunk:\"$old_hash\"/$chunk:\"$new_hash\"/g" "$web/runtime.bundle.js"
    fi
    # Replace stale compressed responses with bytes from the patched files.
    gzip -c "$file" > "$file.gz"
    gzip -c "$web/$new_name" > "$web/$new_name.gz"
    if [ -f "$file.br" ] || [ -f "$web/$new_name.br" ]; then
        echo 'Top bar: Brotli files require regeneration before startup' >&2
        exit 1
    fi
done

if [ "$found" -eq 0 ]; then
    echo 'Top bar: navigation code changed; update 10-topbar.sh' >&2
    exit 1
fi

runtime_hash=$(sha256sum "$web/runtime.bundle.js" | cut -c1-20)
runtime_name="runtime.taflix-$runtime_hash.bundle.js"
cp -p "$web/runtime.bundle.js" "$web/$runtime_name"
gzip -c "$web/runtime.bundle.js" > "$web/runtime.bundle.js.gz"
gzip -c "$web/$runtime_name" > "$web/$runtime_name.gz"
sed -i "s/src=\"runtime\(\.taflix-[a-f0-9]*\)\?\.bundle\.js[^\"]*\"/src=\"$runtime_name\"/g" "$web/index.html"
gzip -c "$web/index.html" > "$web/index.html.gz"
if [ -f "$web/runtime.bundle.js.br" ] || [ -f "$web/index.html.br" ]; then
    echo 'Top bar: Brotli files require regeneration before startup' >&2
    exit 1
fi
echo "Top bar: patched navigation, runtime $runtime_name"
