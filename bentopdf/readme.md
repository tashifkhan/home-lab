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
PDF processing and the LibreOffice WASM converter:

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

It is pinned to commit `343c219` and multi-platform image digest
`sha256:3f96d4283aacda8fe0219d452dadadc0458ccdac060cd17a439093f2734d7b37`.
The container listens on `http://bentopdf-ui:3000` only inside the Nginx Proxy
Manager network; NPM is its sole public entry point.

The current TanStack Start port includes real processors for 106 of the 116
catalog tools. The remaining 10 tools are marked unavailable in the UI rather
than silently pretending to process a file.

## Scope

The deployment keeps processing in the browser. It does not add AI summary or
translation, PDF-to-PowerPoint, or camera-scanning extensions.
