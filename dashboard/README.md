# arr.tashif.codes

FastAPI dashboard for the home lab: service cards with live health dots, a
Tailscale device page, and short redirects.

## Short links

Every service has a slug that redirects from the dashboard host:

```
arr.tashif.codes/t3      → http://${MAC_AIR_IP}:3773
arr.tashif.codes/taflix  → https://taflix.tashif.codes
```

The target is the service's public hostname when it has one, and its Tailscale
address otherwise. `/go/<slug>` works the same as `/<slug>`; slugs are
case-insensitive. Hitting a shortcut while signed out lands on `/login?next=…`
and continues to the service afterwards.

Slugs live next to each service in `app/data/services.py` (`slug` plus optional
`aliases`); `_build_shortcuts()` refuses to start if two services claim the same
key or a key shadows a real route (`login`, `api`, `static`, …).

| Path | Service | Aliases |
| --- | --- | --- |
| `/drive` | Drive · Nextcloud | `/nextcloud`, `/nc`, `/files` |
| `/taflix` | Taflix · Jellyfin | `/jellyfin`, `/watch` |
| `/encode` | Encode · Tdarr | `/tdarr`, `/transcode` |
| `/manage` | Manage · Seerr | `/seerr`, `/jellyseerr`, `/requests` |
| `/homarr` | Homarr · Homarr | — |
| `/torrent` | Torrent · qBittorrent | `/qbit`, `/qbittorrent`, `/qb` |
| `/crawl` | Crawl · Prowlarr | `/prowlarr`, `/indexers` |
| `/shows` | Shows · Sonarr | `/sonarr`, `/tv` |
| `/movies` | Movies · Radarr | `/radarr`, `/films` |
| `/music` | Music · Lidarr | `/lidarr` |
| `/books` | Books · Readarr | `/readarr`, `/ebooks` |
| `/tasks` | Tasks · Nextcloud Tasks | `/todo` |
| `/office` | Office · Nextcloud Office | `/nextcloud-office` |
| `/docs` | Docs · Euro-Office | `/eurooffice`, `/euro-office` |
| `/pdf` | PDF · BentoPDF | `/bentopdf` |
| `/press` | Press · Pressroom | `/pressroom`, `/write` |
| `/search` | Search · SearXNG | `/searx`, `/searxng` |
| `/dump` | Dump · dump.lab | `/zine` |
| `/git` | Git · Forgejo | `/forgejo`, `/repo` |
| `/gateway` | Gateway · Relay Room | `/llm`, `/ai` |
| `/relay` | Relay · Relay Room | `/relayroom`, `/console` |
| `/t3` | T3 · T3 Code | `/t3code`, `/agent` |

`/go` lists all of them in the UI; `/api/shortcuts` returns the same as JSON.

## Run

```sh
uv run main.py          # dev, :4200
docker compose up -d    # prod
```

Config comes from `.env` (see `.env.example`): dashboard password, JWT secret,
and Tailscale OAuth credentials for the network page.
