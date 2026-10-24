# Jellyfin branding CSS

Paste a theme import and exactly one flavour import into Dashboard > Branding > Custom CSS code.
Keep imports before any other CSS rules. Save, then reload the web client.
The default web layout uses Display mode "Auto".

The theme CSS is commit `1aacccfede039001039f5b7a9f846a57859be602` on `theme/default-layout` in
[tashifkhan/catppuccin-jellyfin](https://github.com/tashifkhan/catppuccin-jellyfin).
It builds on [catppuccin/jellyfin#62](https://github.com/catppuccin/jellyfin/pull/62).

The fork's `main` branch does not include this patch yet. These imports pin the tested CSS commit.

## Imports through jsDelivr

Import the shared rules first:

```css
@import url("https://cdn.jsdelivr.net/gh/tashifkhan/catppuccin-jellyfin@1aacccfede039001039f5b7a9f846a57859be602/themes/theme.css");
```

Then choose one flavour:

```css
/* Latte */
@import url("https://cdn.jsdelivr.net/gh/tashifkhan/catppuccin-jellyfin@1aacccfede039001039f5b7a9f846a57859be602/themes/catppuccin-latte.css");
/* Frappe */
@import url("https://cdn.jsdelivr.net/gh/tashifkhan/catppuccin-jellyfin@1aacccfede039001039f5b7a9f846a57859be602/themes/catppuccin-frappe.css");
/* Macchiato */
@import url("https://cdn.jsdelivr.net/gh/tashifkhan/catppuccin-jellyfin@1aacccfede039001039f5b7a9f846a57859be602/themes/catppuccin-macchiato.css");
/* Mocha */
@import url("https://cdn.jsdelivr.net/gh/tashifkhan/catppuccin-jellyfin@1aacccfede039001039f5b7a9f846a57859be602/themes/catppuccin-mocha.css");
```

GitHub's raw file URLs return `text/plain` with `nosniff`, which browsers reject as stylesheets.
Use jsDelivr for imports. It serves the CSS files as `text/css`.

## Dashboard support on Jellyfin 12.3

Stock Jellyfin 12.3 does not load custom CSS in the server dashboard. The optional image below
builds the v12.3 web client with a two-line patch that renders its existing CustomCss component
in the dashboard. It uses the same Branding CSS and per-user opt-out as the default layout.
The server image and web source are pinned to 12.3. The regular compose file stays unchanged.

To use the patched client, run from this directory:

```sh
docker compose -f docker-compose.jelly.yaml -f docker-compose.branding.yaml up -d --build --no-deps jellyfin
```

The build runs type checking first and limits bundler concurrency to fit a Docker VM with 4 GB
of memory. The runtime image contains the patched production web build.

Save the imports in Dashboard > Branding, then reload. A fresh local 12.3 container passed all 28 page checks across the four flavours.
The checks covered home, details, video playback and OSD, dashboard, Branding, General
and user Display settings in Auto mode. Disabling server CSS removed the dashboard theme,
and re-enabling it restored the theme. Screenshots and computed colours confirmed the results.
The theme uses relative RGB colors and needs a browser that supports them.

To return to the stock client, recreate Jellyfin with only `docker-compose.jelly.yaml`.
No command in this change alters the saved Branding CSS.
