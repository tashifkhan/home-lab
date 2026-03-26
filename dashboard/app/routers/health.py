import asyncio
from datetime import datetime, timezone

import httpx
from fastapi import APIRouter, Cookie
from fastapi.responses import JSONResponse

from app.data.services import SERVICES
from app.deps.auth import verify_token

router = APIRouter(prefix="/api", tags=["health"])

_TIMEOUT = httpx.Timeout(4.0, connect=2.5)
_CACHE_TTL = 30  # seconds

_cache: dict | None = None
_cache_at: datetime | None = None


async def _ping(client: httpx.AsyncClient, service: dict) -> tuple[str, bool]:
    proto = service.get("local_proto", "http")
    path  = service.get("local_path", "")
    url   = f"{proto}://home-server:{service['port']}{path}"
    svc_id = service["name"].lower()
    try:
        await client.get(url, follow_redirects=False)
        return svc_id, True   # any HTTP response = port is alive
    except Exception:
        return svc_id, False


@router.get("/health")
async def health(access_token: str | None = Cookie(default=None)):
    global _cache, _cache_at

    if not verify_token(access_token):
        return JSONResponse({"error": "unauthorized"}, status_code=401)

    now = datetime.now(timezone.utc)

    # serve cached result within TTL
    if _cache and _cache_at and (now - _cache_at).total_seconds() < _CACHE_TTL:
        return _cache

    # ping all local endpoints concurrently
    async with httpx.AsyncClient(timeout=_TIMEOUT, verify=False) as client:
        pairs = await asyncio.gather(*[_ping(client, s) for s in SERVICES])

    _cache = {
        "results":    dict(pairs),
        "checked_at": now.isoformat(),
        "cached_for": _CACHE_TTL,
    }
    _cache_at = now
    return _cache
