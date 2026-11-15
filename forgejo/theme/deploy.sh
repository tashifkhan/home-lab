#!/usr/bin/env bash
# Build the 26 Forgejo themes, settings dock and profile UI and deploy them to git.taf.sh.
#
# Usage:
#   ./deploy.sh
#   SSH_OPTS="-J mac-pro" ./deploy.sh
#
# The jump host is only needed when Tailscale policy blocks direct SSH from
# this machine. The remote host still receives a normal ssh/rsync connection.
set -euo pipefail
cd "$(dirname "$0")"

HOST="${HOST:-home-server}"
ROOT="${ROOT:-/mnt/hdd01/forgejo/data/custom}"
SSH_OPTS="${SSH_OPTS:-}"
STAMP="$(date +%Y%m%d-%H%M%S)"

echo "==> build"
if [ -d node_modules ] && command -v bun >/dev/null 2>&1; then
  bun run build
  bun run check
else
  echo "node_modules missing; using the committed dist/ (run bun install to rebuild)"
  test -f dist/manifest.json
fi

echo "==> backup custom/ on $HOST"
ssh $SSH_OPTS "$HOST" "tar -C /mnt/hdd01/forgejo/data -czf \$HOME/forgejo-custom-$STAMP.tgz custom"

echo "==> sync assets"
ssh $SSH_OPTS "$HOST" "mkdir -p '$ROOT/public/assets/css' '$ROOT/public/assets/themes/fonts' '$ROOT/public/assets/img' '$ROOT/templates/custom'"
rsync -az -e "ssh $SSH_OPTS" dist/css/ "$HOST:$ROOT/public/assets/css/"
rsync -az -e "ssh $SSH_OPTS" --delete dist/themes/ "$HOST:$ROOT/public/assets/themes/"
rsync -az -e "ssh $SSH_OPTS" dist/img/ "$HOST:$ROOT/public/assets/img/"
rsync -az -e "ssh $SSH_OPTS" templates/ "$HOST:$ROOT/templates/custom/"

ssh $SSH_OPTS "$HOST" "chmod -R u=rwX,go=rX '$ROOT/public/assets' '$ROOT/templates'"

echo "==> update app.ini"
ssh $SSH_OPTS "$HOST" 'python3 -' <<'PY'
from pathlib import Path

path = Path("/mnt/hdd01/forgejo/data/custom/conf/app.ini")
text = path.read_text()

def set_key(text, section, key, value):
    lines = text.splitlines()
    header = f"[{section}]"
    start = None
    for i, line in enumerate(lines):
        if line.strip() == header:
            start = i
            break
    if start is None:
        lines += ["", header, f"{key} = {value}"]
        return "\n".join(lines) + "\n"
    end = len(lines)
    for j in range(start + 1, len(lines)):
        if lines[j].lstrip().startswith("[") and lines[j].rstrip().endswith("]"):
            end = j
            break
    for j in range(start + 1, end):
        if lines[j].split("=", 1)[0].strip() == key:
            lines[j] = f"{key} = {value}"
            return "\n".join(lines) + "\n"
    lines.insert(start + 1, f"{key} = {value}")
    return "\n".join(lines) + "\n"

themes = "taf-light,taf-dark,dump-light,dump-dark,sleeck-light,sleeck-dark,simple-light,simple-dark,bubblegum-light,bubblegum-dark,sketch-light,sketch-dark,material-purple-light,material-purple-dark,material-blue-light,material-blue-dark,material-teal-light,material-teal-dark,material-green-light,material-green-dark,material-amber-light,material-amber-dark,material-red-light,material-red-dark,material-rose-light,material-rose-dark"

text = set_key(text, "ui", "DEFAULT_THEME", "taf-light")
text = set_key(text, "ui", "THEMES", themes)
text = set_key(text, "server", "LANDING_PAGE", "/taf?tab=repositories")
text = set_key(text, "service", "ENABLE_USER_HEATMAP", "true")
path.write_text(text)
print("app.ini updated")
PY

echo "==> restart"
ssh $SSH_OPTS "$HOST" 'docker restart forgejo >/dev/null && sleep 5 && docker ps --filter name=forgejo --format "{{.Names}} {{.Status}}"'

echo "==> verify"
curl -fsS -o /dev/null -w "root: %{http_code} -> %{redirect_url}\n" https://git.taf.sh/ || true
curl -fsS -o /dev/null -w "theme: %{http_code}\n" https://git.taf.sh/assets/css/theme-taf-light.css || true
curl -fsS -o /dev/null -w "heatmap api: %{http_code}\n" https://git.taf.sh/api/v1/users/taf/heatmap || true
echo "backup: ~/forgejo-custom-$STAMP.tgz on $HOST"
