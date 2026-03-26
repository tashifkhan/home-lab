CATEGORIES: list[dict] = [
    {
        "id": "media",
        "label": "Media",
        "wide": True,
    },
    {
        "id": "management",
        "label": "Management",
        "wide": True,
    },
    {
        "id": "downloads",
        "label": "Downloads",
        "cols": 2,
    },
    {
        "id": "library",
        "label": "Library Managers",
        "cols": 4,
    },
    {
        "id": "storage",
        "label": "Storage",
        "wide": True,
    },
]

SERVICES: list[dict] = [
    {
        "name": "Taflix",
        "app": "Jellyfin",
        "desc": "Media Streaming",
        "port": 4201,
        "public": "taflix.tashif.codes",
        "category": "media",
        "icon": "play",
        "num": 1,
    },
    {
        "name": "Manage",
        "app": "Overseerr",
        "desc": "Request Management",
        "port": 4202,
        "public": "manage.arr.tashif.codes",
        "category": "management",
        "icon": "clipboard",
        "num": 2,
    },
    {
        "name": "Torrent",
        "app": "qBittorrent",
        "desc": "Download Client",
        "port": 4203,
        "public": "torrent.arr.tashif.codes",
        "category": "downloads",
        "icon": "download",
        "num": 3,
    },
    {
        "name": "Crawl",
        "app": "Prowlarr",
        "desc": "Indexer Manager",
        "port": 4204,
        "public": "crawl.arr.tashif.codes",
        "category": "downloads",
        "icon": "search",
        "num": 4,
    },
    {
        "name": "Shows",
        "app": "Sonarr",
        "desc": "TV Series",
        "port": 4205,
        "public": "shows.arr.tashif.codes",
        "category": "library",
        "icon": "monitor",
        "num": 5,
    },
    {
        "name": "Movies",
        "app": "Radarr",
        "desc": "Films",
        "port": 4206,
        "public": "movies.arr.tashif.codes",
        "category": "library",
        "icon": "film",
        "num": 6,
    },
    {
        "name": "Music",
        "app": "Lidarr",
        "desc": "Audio Library",
        "port": 4207,
        "public": "music.arr.tashif.codes",
        "category": "library",
        "icon": "music",
        "num": 7,
    },
    {
        "name": "Books",
        "app": "Readarr",
        "desc": "eBooks",
        "port": 4208,
        "public": "books.arr.tashif.codes",
        "category": "library",
        "icon": "book",
        "num": 8,
    },
    {
        "name": "Drive",
        "app": "Nextcloud",
        "desc": "File Storage & Sync",
        "port": 4433,
        "public": "drive.tashif.codes",
        "category": "storage",
        "icon": "cloud",
        "num": 9,
        "local_proto": "https",
    },
]


def _enrich(service: dict) -> dict:
    proto = service.get("local_proto", "http")
    return {
        **service,
        "local_url": f"{proto}://home-server:{service['port']}",
        "local_display": f"home-server:{service['port']}",
        "public_url": f"https://{service['public']}",
        "public_display": service["public"],
    }


def get_sections() -> list[dict]:
    sections = []

    for cat in CATEGORIES:
        services = [
            _enrich(s) for s in SERVICES
            if s["category"] == cat["id"]
        ]
        sections.append({
            **cat, "services": services,
        })

    return sections
