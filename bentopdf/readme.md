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
http://bentopdf:8080
```

Its advanced configuration disables proxy buffering so large WebAssembly
assets are streamed without NPM writing temporary copies to the VPS disk:

```nginx
proxy_buffering off;
```

The official image supplies the cross-origin isolation headers required by
LibreOffice WebAssembly. BentoPDF 2.8.7 uses the `credentialless` COEP mode:

```text
Cross-Origin-Opener-Policy: same-origin
Cross-Origin-Embedder-Policy: credentialless
```

Do not embed BentoPDF in an iframe. Cross-origin isolation is required for the
Office conversion tools.

## Version upgrades

The image is pinned by both release and manifest digest. Before upgrading:

1. Read the BentoPDF release notes and security notices.
2. Resolve the new multi-platform manifest digest.
3. Update both the version and digest in the Compose file.
4. Deploy and run the checks below.

## Verification

```bash
curl -fsSI https://pdf.taf.sh/
curl -fsS https://pdf.taf.sh/config.json
```

In browser developer tools, verify:

```js
window.crossOriginIsolated === true
typeof SharedArrayBuffer !== "undefined"
```

Test at least one page operation, one Office-to-PDF conversion, OCR, repair,
compression, and a PDF-to-DOCX conversion after each upgrade.

## Scope

The deployment uses BentoPDF's existing tools. It does not add AI summary or
translation, PDF-to-PowerPoint, or camera-scanning extensions.
