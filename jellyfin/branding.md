# Jellyfin branding CSS

Paste a theme import and exactly one flavour import into Dashboard > Branding > Custom CSS code.
Keep imports before any other CSS rules. Save, then reload the web client.
The default web layout uses Display mode "Auto".

The local theme patch is commit `8ad2032258a5c252fc7c38819686d7e31b2e5bc9` on `theme/default-layout` in
[tashifkhan/catppuccin-jellyfin](https://github.com/tashifkhan/catppuccin-jellyfin).
It builds on [catppuccin/jellyfin#62](https://github.com/catppuccin/jellyfin/pull/62).

This commit has not been pushed. The pinned URLs below become available after it is published.
The fork's `main` branch does not include this patch yet.

## Imports through jsDelivr

Import the shared rules first:

```css
@import url("https://cdn.jsdelivr.net/gh/tashifkhan/catppuccin-jellyfin@8ad2032258a5c252fc7c38819686d7e31b2e5bc9/themes/theme.css");
```

Then choose one flavour:

```css
/* Latte */
@import url("https://cdn.jsdelivr.net/gh/tashifkhan/catppuccin-jellyfin@8ad2032258a5c252fc7c38819686d7e31b2e5bc9/themes/catppuccin-latte.css");
/* Frappe */
@import url("https://cdn.jsdelivr.net/gh/tashifkhan/catppuccin-jellyfin@8ad2032258a5c252fc7c38819686d7e31b2e5bc9/themes/catppuccin-frappe.css");
/* Macchiato */
@import url("https://cdn.jsdelivr.net/gh/tashifkhan/catppuccin-jellyfin@8ad2032258a5c252fc7c38819686d7e31b2e5bc9/themes/catppuccin-macchiato.css");
/* Mocha */
@import url("https://cdn.jsdelivr.net/gh/tashifkhan/catppuccin-jellyfin@8ad2032258a5c252fc7c38819686d7e31b2e5bc9/themes/catppuccin-mocha.css");
```

GitHub's raw file URLs return `text/plain` with `nosniff`, which browsers reject as stylesheets.
Use jsDelivr for imports. It serves the CSS files as `text/css`.

## Jellyfin 12.3 limits

A disposable Jellyfin 12.3.0 container with a fresh config passed the home, details,
video player OSD and user Display settings checks for all four flavours in Chromium.
The theme uses relative RGB colors for translucent controls and needs a browser that supports them.

The full test failed because Jellyfin's server dashboard does not load Branding Custom CSS.
Its [dashboard layout](https://github.com/jellyfin/jellyfin-web/blob/v12.3/src/apps/dashboard/AppLayout.tsx)
omits the CustomCss component. Changing CSS selectors cannot make the dashboard load it.
The dashboard keeps its built-in theme. This needs a Jellyfin web client change before a theme can
cover every requested page.

The theme branch and this note remain local because of that failure.
The live server's Branding CSS was not changed.
