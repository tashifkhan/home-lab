# dump.taf.sh

Static Astro site deployed on `home-server` and published through the VPS Nginx
Proxy Manager at `https://dump.taf.sh`.

- Source: https://github.com/tashifkhan/dump
- Home-server source checkout: `/home/taf/dump`
- Compose file: `/home/taf/home-lab-yaml/dump/docker-compose.dump.yml`
- Secrets: `/home/taf/home-lab-yaml/dump/.env` (mode 600, not in git)
- Tailscale-only bind: `${TAILSCALE_IP}:4214`

## Access control

| Surface | Protection |
|---------|------------|
| `/` index shelf | Basic auth via `JOURNEY_API_KEY` and/or `DUMP_INDEX_PASSWORD` |
| Public dumps `/d/…` | Open with the link (`access: public`) |
| Locked dumps | `access: locked` + Journey API key |
| Passphrase dumps | `access: passphrase` + `DUMP_PASSPHRASES` / `DUMP_PASSPHRASE_*` |

Browser usernames:

- `taf` — Journey API key
- `dump` — index password / per-dump passphrase

Redeploy after changing `.env`:

```bash
cd /home/taf/home-lab-yaml/dump
docker compose -f docker-compose.dump.yml up -d --force-recreate
```
