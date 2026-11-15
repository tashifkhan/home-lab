# Forgejo theme + profile landing

Source for the git.taf.sh look: 26 themes across seven families, a settings
dock, and the profile-first landing with contribution heatmap and stats.

## Build

```sh
bun install
bun run build
bun run check
```

`dist/` is generated. Do not edit it by hand; edit `tokens.mjs` and `src/`.

## Deploy

```sh
SSH_OPTS="-J mac-pro" ./deploy.sh
```

The script:

1. builds and contrast-checks 26 themes,
2. tars the remote `custom/` directory into `~/forgejo-custom-<stamp>.tgz`,
3. syncs CSS, fonts, images and the three template hooks,
4. updates `[ui]`, `[server]` and `[service]` in `app.ini` idempotently,
5. restarts `forgejo`,
6. checks the root, the theme CSS and the heatmap API.

## Layout

- `tokens.mjs` — the only file to edit for palette changes. Material expands
  through `@material/material-color-utilities` at build time.
- `src/base.css` — semantic tokens → Forgejo variables.
- `src/chrome.css` — components and family flourishes.
- `src/chroma.css` — syntax, diff and console colors.
- `src/profile.css`, `src/profile.js` — heatmap, stats and the profile mount.
- `src/settings-dock.css`, `src/settings-dock.js` — the appearance dock in the
  bottom-right corner: color mode, the seven families (plus Material seeds),
  haptics and reduce motion. It mirrors the dock on taf.sh.
- Guests keep the theme in `localStorage["crt-theme"]`. Signed-in users get the
  new stylesheet at once and the dock posts it to Forgejo in the background.
- Haptics (`crt-haptics`) and reduce motion (`crt-reduce-motion`, which sets
  `data-reduce-motion` on `<html>`) are per browser. `header.tmpl` restores the
  motion flag before paint. `web-haptics` is bundled into
  `dist/themes/web-haptics.js` and only fetched on the first tap with haptics on.
- `templates/` — `header.tmpl`, `footer.tmpl`, `extra_links.tmpl`.
- `assets/fonts/` — latin woff2 files, self-hosted.
- `assets/img/` — taf.sh logo/favicon.

## Notes

- Root redirect: `LANDING_PAGE` only affects guests. `header.tmpl` has a
  pre-paint `location.replace` for signed-in `/`, so the owner lands on
  `/taf?tab=repositories` without the dashboard flashing. If an edge rule is
  later added, it can take over; the header check is harmless.
- `?tab=activity` is skipped by the custom heatmap because Forgejo already
  renders one there.
- Theme CSS URLs carry Forgejo's version query; hard-refresh after a deploy.
