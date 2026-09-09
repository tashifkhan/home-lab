CATEGORIES: list[dict] = [
    {
        "id": "storage",
        "label": "Storage",
        "wide": True,
    },
    {
        "id": "media",
        "label": "Media",
        "wide": True,
    },
    {
        "id": "management",
        "label": "Management",
        "cols": 2,
    },
    {
        "id": "downloads",
        "label": "Downloads",
        "cols": 2,
    },
    {
        "id": "library",
        "label": "Library managers",
        "cols": 4,
    },
    {
        "id": "productivity",
        "label": "Productivity",
        "wide": True,
    },
    {
        "id": "sites",
        "label": "Sites & tools",
        "cols": 2,
    },
    {
        "id": "ai",
        "label": "MacBook Air · AI",
        "cols": 2,
    },
]

SERVICES: list[dict] = [
    # ── storage ──────────────────────────────────────────────
    {
        "name": "Drive",
        "slug": "drive",
        "aliases": ["nextcloud", "nc", "files"],
        "app": "Nextcloud",
        "desc": "File storage & sync",
        "port": 4433,
        "public": "drive.tashif.codes",
        "category": "storage",
        "icon": "cloud",
        "num": 1,
        "local_proto": "https",
        "local_path": "/apps/files/files",
        "public_path": "/apps/files/files",
        "hosts": ["home-server"],
    },
    # ── media ────────────────────────────────────────────────
    {
        "name": "Taflix",
        "slug": "taflix",
        "aliases": ["jellyfin", "watch"],
        "app": "Jellyfin",
        "desc": "Media streaming",
        "port": 4201,
        "public": "taflix.tashif.codes",
        "category": "media",
        "icon": "play",
        "num": 2,
        "hosts": ["home-server"],
    },
    {
        "name": "Encode",
        "slug": "encode",
        "aliases": ["tdarr", "transcode"],
        "app": "Tdarr",
        "desc": "Transcode queue",
        "port": 4210,
        "public": None,
        "category": "media",
        "icon": "encode",
        "num": 3,
        "hosts": ["home-server"],
    },
    # ── management ───────────────────────────────────────────
    {
        "name": "Manage",
        "slug": "manage",
        "aliases": ["seerr", "jellyseerr", "requests"],
        "app": "Seerr",
        "desc": "Request management",
        "port": 4202,
        "public": "manage.arr.tashif.codes",
        "category": "management",
        "icon": "clipboard",
        "num": 4,
        "hosts": ["home-server"],
    },
    {
        "name": "Homarr",
        "slug": "homarr",
        "app": "Homarr",
        "desc": "Legacy dashboard",
        "port": 4209,
        "public": None,
        "category": "management",
        "icon": "layout",
        "num": 5,
        "hosts": ["home-server"],
    },
    # ── downloads ────────────────────────────────────────────
    {
        "name": "Torrent",
        "slug": "torrent",
        "aliases": ["qbit", "qbittorrent", "qb"],
        "app": "qBittorrent",
        "desc": "Download client",
        "port": 4203,
        "public": "torrent.arr.tashif.codes",
        "category": "downloads",
        "icon": "download",
        "num": 6,
        "hosts": ["home-server"],
    },
    {
        "name": "Crawl",
        "slug": "crawl",
        "aliases": ["prowlarr", "indexers"],
        "app": "Prowlarr",
        "desc": "Indexer manager",
        "port": 4204,
        "public": "crawl.arr.tashif.codes",
        "category": "downloads",
        "icon": "search",
        "num": 7,
        "hosts": ["home-server"],
    },
    # ── library ──────────────────────────────────────────────
    {
        "name": "Shows",
        "slug": "shows",
        "aliases": ["sonarr", "tv"],
        "app": "Sonarr",
        "desc": "TV series",
        "port": 4205,
        "public": "shows.arr.tashif.codes",
        "category": "library",
        "icon": "monitor",
        "num": 8,
        "hosts": ["home-server"],
    },
    {
        "name": "Movies",
        "slug": "movies",
        "aliases": ["radarr", "films"],
        "app": "Radarr",
        "desc": "Films",
        "port": 4206,
        "public": "movies.arr.tashif.codes",
        "category": "library",
        "icon": "film",
        "num": 9,
        "hosts": ["home-server"],
    },
    {
        "name": "Music",
        "slug": "music",
        "aliases": ["lidarr"],
        "app": "Lidarr",
        "desc": "Audio library",
        "port": 4207,
        "public": "music.arr.tashif.codes",
        "category": "library",
        "icon": "music",
        "num": 10,
        "hosts": ["home-server"],
    },
    {
        "name": "Books",
        "slug": "books",
        "aliases": ["readarr", "ebooks"],
        "app": "Readarr",
        "desc": "eBooks",
        "port": 4208,
        "public": "books.arr.tashif.codes",
        "category": "library",
        "icon": "book",
        "num": 11,
        "hosts": ["home-server"],
    },
    # ── productivity ─────────────────────────────────────────
    {
        "name": "Tasks",
        "slug": "tasks",
        "aliases": ["todo"],
        "app": "Nextcloud Tasks",
        "desc": "Task management",
        "port": 4433,
        "public": "drive.tashif.codes",
        "category": "productivity",
        "icon": "tasks",
        "num": 12,
        "local_proto": "https",
        "local_path": "/apps/tasks/collections/all",
        "public_path": "/apps/tasks/collections/all",
        "hosts": ["home-server"],
    },
    {
        "name": "Office",
        "slug": "office",
        "aliases": ["nextcloud-office"],
        "app": "Nextcloud Office",
        "desc": "Docs inside Drive",
        "port": 4433,
        "public": "drive.tashif.codes",
        "category": "productivity",
        "icon": "document-edit",
        "num": 13,
        "local_proto": "https",
        "local_path": "/apps/office",
        "public_path": "/apps/office",
        "hosts": ["home-server"],
    },
    {
        "name": "Docs",
        "slug": "docs",
        "aliases": ["eurooffice", "euro-office"],
        "app": "Euro-Office",
        "desc": "Document server",
        "port": 4213,
        "public": "office.taf.sh",
        "category": "productivity",
        "icon": "document-edit",
        "num": 14,
        # Bound on Tailscale only; LAN hostname resolves to ${HOME_SERVER_LAN_IP}
        "local_host": "${TAILSCALE_IP}",
        "hosts": ["home-server"],
    },
    {
        "name": "PDF",
        "slug": "pdf",
        "aliases": ["bentopdf"],
        "app": "BentoPDF",
        "desc": "Client-side PDF toolkit",
        "port": 3000,
        "public": "pdf.taf.sh",
        "category": "productivity",
        "icon": "pdf",
        "num": 15,
        # LAN-only bind; Tailscale :3000 is Forgejo
        "local_host": "${HOME_SERVER_LAN_IP}",
        "hosts": ["home-server"],
    },
    {
        "name": "Press",
        "slug": "press",
        "aliases": ["pressroom", "write"],
        "app": "Pressroom",
        "desc": "Markdown editor",
        "port": 3100,
        "public": None,
        "category": "productivity",
        "icon": "pen",
        "num": 16,
        "hosts": ["home-server"],
    },
    # ── sites & tools ────────────────────────────────────────
    {
        "name": "Search",
        "slug": "search",
        "aliases": ["searx", "searxng"],
        "app": "SearXNG",
        "desc": "Metasearch",
        "port": 4212,
        "public": "search.taf.sh",
        "category": "sites",
        "icon": "globe",
        "num": 17,
        "hosts": ["home-server"],
    },
    {
        "name": "Dump",
        "slug": "dump",
        "aliases": ["zine"],
        "app": "dump.lab",
        "desc": "Personal zine",
        "port": 4214,
        "public": "dump.taf.sh",
        "category": "sites",
        "icon": "zine",
        "num": 18,
        "local_host": "${TAILSCALE_IP}",
        "health_path": "/healthz",
        "hosts": ["home-server"],
    },
    {
        "name": "Git",
        "slug": "git",
        "aliases": ["forgejo", "repo"],
        "app": "Forgejo",
        "desc": "Self-hosted git",
        "port": 3000,
        "public": "git.taf.sh",
        "category": "sites",
        "icon": "git",
        "num": 19,
        # Same host port as BentoPDF on LAN; Forgejo is Tailscale-only
        "local_host": "${TAILSCALE_IP}",
        "hosts": ["home-server"],
    },
    # ── mac-air AI ───────────────────────────────────────────
    {
        "name": "Gateway",
        "slug": "gateway",
        "aliases": ["llm", "ai"],
        "app": "Relay Room",
        "desc": "OpenAI-compat AI relay",
        "port": 8317,
        "public": None,
        "category": "ai",
        "icon": "zap",
        "num": 20,
        "health_path": "/v1/models",
        "hosts": ["mac-air"],
    },
    {
        "name": "Relay",
        "slug": "relay",
        "aliases": ["relayroom", "console"],
        "app": "Relay Room",
        "desc": "Gateway admin console",
        "port": 8320,
        "public": None,
        "category": "ai",
        "icon": "terminal",
        "num": 21,
        "hosts": ["mac-air"],
    },
    {
        "name": "T3",
        "slug": "t3",
        "aliases": ["t3code", "agent"],
        "app": "T3 Code",
        "desc": "Remote coding agent",
        "port": 3773,
        "public": None,
        "category": "ai",
        "icon": "code",
        "num": 22,
        "hosts": ["mac-air"],
    },
]

# Tailscale IPv4 for local links (MagicDNS names are not shown in the UI)
HOST_IPS: dict[str, str] = {
    "home-server": "${TAILSCALE_IP}",
    "mac-air": "${MAC_AIR_TS_IP}",
}

# Pinned Nextcloud folder shortcuts
_DRIVE_IP = HOST_IPS["home-server"]
_DRIVE_LOCAL = f"https://{_DRIVE_IP}:4433"
_DRIVE_PUBLIC = "https://drive.tashif.codes"

PINNED_FOLDERS: list[dict] = [
    {
        "name": "Documents",
        "path": "/apps/files/files/9243?dir=/Documents/Identity",
    },
    {
        "name": "Resume",
        "path": "/apps/files/files/20913?dir=/Documents/Resume",
    },
    {
        "name": "Invoices",
        "path": "/apps/files/files/1594929?dir=/Documents/Invoices%20SITG",
    },
    {
        "name": "Call Records",
        "path": "/apps/files/files/17256?dir=/Documents/Phone%20Docs/VRecords/Call",
    },
]


def _host_ip(name: str) -> str:
    return HOST_IPS.get(name, name)


def _primary_host(service: dict) -> str:
    if service.get("local_host"):
        return service["local_host"]
    hosts = service.get("hosts") or ["home-server"]
    return _host_ip(hosts[0])


def _enrich(service: dict) -> dict:
    proto = service.get("local_proto", "http")
    local_path = service.get("local_path", "")
    pub_path = service.get("public_path", "")
    hosts = service.get("hosts", ["home-server"])
    host = _primary_host(service)
    public = service.get("public")
    port = service["port"]
    local_url = f"{proto}://{host}:{port}{local_path}"
    public_url = f"https://{public}{pub_path}" if public else None
    out = {
        **service,
        "hosts": hosts,
        "hosts_display": " · ".join(_host_ip(h) for h in hosts),
        "local_url": local_url,
        # Compact mono label; full URL stays on href / title
        "local_display": f"{host}:{port}",
        "has_public": bool(public),
        "public_url": public_url,
        "public_display": public,
        "aliases": service.get("aliases", []),
        # Short redirect, e.g. arr.tashif.codes/t3
        "short_path": f"/{service['slug']}",
        "target_url": public_url or local_url,
        "target_kind": "public" if public_url else "local",
    }
    return out


def _enrich_folder(folder: dict) -> dict:
    return {
        **folder,
        "local_url": f"{_DRIVE_LOCAL}{folder['path']}",
        "local_display": f"{_DRIVE_IP}:4433",
        "public_url": f"{_DRIVE_PUBLIC}{folder['path']}",
        "public_display": "drive.tashif.codes",
    }


def get_sections() -> list[dict]:
    sections = []
    for cat in CATEGORIES:
        services = [
            _enrich(s) for s in SERVICES
            if s["category"] == cat["id"]
        ]
        if not services:
            continue
        sections.append(
            {
                **cat,
                "services": services,
            }
        )
    return sections


def get_pinned_folders() -> list[dict]:
    return [
        _enrich_folder(f) for f in PINNED_FOLDERS
    ]


# ── short redirects (arr.tashif.codes/<slug>) ────────────────
# Paths the app itself owns; a slug may never shadow one of these.
RESERVED_SLUGS: frozenset[str] = frozenset(
    {
        "api",
        "favicon.ico",
        "favicon.png",
        "go",
        "login",
        "logout",
        "manifest.json",
        "manifest.webmanifest",
        "static",
        "sw.js",
        "tailscale",
    }
)


def _build_shortcuts() -> dict[str, str]:
    """Map every slug and alias to its service slug, loudly rejecting clashes."""
    table: dict[str, str] = {}
    for service in SERVICES:
        slug = service["slug"]
        for key in (slug, *service.get("aliases", [])):
            if key in RESERVED_SLUGS:
                raise ValueError(f"shortcut {key!r} collides with a dashboard route")
            if key in table:
                raise ValueError(
                    f"shortcut {key!r} claimed by both {table[key]!r} and {slug!r}"
                )
            table[key] = slug
    return table


SHORTCUTS: dict[str, str] = _build_shortcuts()


def resolve_shortcut(key: str) -> dict | None:
    """Look up an enriched service by slug or alias (case/slash insensitive)."""
    slug = SHORTCUTS.get(key.strip("/").lower())
    if not slug:
        return None
    for service in SERVICES:
        if service["slug"] == slug:
            return _enrich(service)
    return None


def get_shortcuts() -> list[dict]:
    return [_enrich(s) for s in SERVICES]
