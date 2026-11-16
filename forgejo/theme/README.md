# Forgejo theme + profile landing

Source for the git.taf.sh look: 22 themes across five families, plus the
profile-first landing, contribution heatmap and stats.

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

1. builds and contrast-checks 22 themes,
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
