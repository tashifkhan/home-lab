# BentoPDF

Self-hosted, client-side PDF toolkit served at `https://pdf.taf.sh`.

PDF processing happens in the visitor's browser. The VPS serves the static
application and does not receive uploaded documents.

## Deployment

The service is attached directly to Nginx Proxy Manager's external Docker
network and deliberately publishes no host port.

```bash
docker compose -f docker-compose.bentopdf.yaml pull
docker compose -f docker-compose.bentopdf.yaml up -d
docker compose -f docker-compose.bentopdf.yaml ps
```

Nginx Proxy Manager forwards `pdf.taf.sh` to:

```text
http://bentopdf-ui:3000
```

Its advanced configuration disables proxy buffering so large WebAssembly
assets are streamed without NPM writing temporary copies to the VPS disk:

```nginx
proxy_buffering off;
```

The application supplies cross-origin isolation headers for browser-side
PDF processing:

```text
Cross-Origin-Opener-Policy: same-origin
Cross-Origin-Embedder-Policy: require-corp
```

Do not embed BentoPDF in an iframe. Cross-origin isolation is required for the
browser-side WebAssembly modules used by supported tools.

## Version upgrades

The image is pinned by both source commit and manifest digest. Before upgrading:

1. Review the fork's release, dependency, and security checks.
2. Resolve the new multi-platform manifest digest.
3. Update both the version and digest in the Compose file.
4. Deploy and run the checks below.

## Verification

```bash
curl -fsSI https://pdf.taf.sh/
curl -fsSI https://pdf.taf.sh/tools/merge-pdf
curl -fsSI https://pdf.taf.sh/tools/pdf-multi-tool
```

In browser developer tools, verify:

```js
window.crossOriginIsolated === true
typeof SharedArrayBuffer !== "undefined"
```

Test Merge PDF and PDF Multi Tool with non-sensitive sample documents after
each upgrade.

## Redesigned UI fork

The production application uses the public TanStack Start/Bun UI fork:

```text
https://github.com/tashifkhan/bentopdf
ghcr.io/tashifkhan/bentopdf-ui
```

It is pinned to commit `40babf9` and multi-platform image digest
`sha256:ab0762514fa352c49bc0870c4c824249e5422e17024049cce5afcd42f5e3cfd0`.
The container listens on `http://bentopdf-ui:3000` only inside the Nginx Proxy
Manager network; NPM is its sole public entry point.

The current React port implements Merge PDF and PDF Multi Tool. Other catalog
routes are currently placeholders and must be ported before they become
functional.

## Scope

The deployment uses BentoPDF's existing tools. It does not add AI summary or
translation, PDF-to-PowerPoint, or camera-scanning extensions.
