import asyncio
from datetime import datetime, timezone

import httpx
from fastapi import APIRouter, Cookie
from fastapi.responses import JSONResponse

from app.data.services import SERVICES, _primary_host
from app.deps.auth import verify_token

router = APIRouter(prefix="/api", tags=["health"])

_TIMEOUT = httpx.Timeout(4.0, connect=2.5)
_CACHE_TTL = 30  # seconds

_cache: dict | None = None
_cache_at: datetime | None = None


async def _ping(client: httpx.AsyncClient, service: dict) -> tuple[str, bool]:
    proto = service.get("local_proto", "http")
    path = service.get("health_path", service.get("local_path", ""))
    # A service may serve its health endpoint on a different port than its
    # main one (e.g. RelayRoom's relay on :8317 needs a gateway key, while
    # its admin on :8320 answers /healthz with no auth).
    port = service.get("health_port", service["port"])
    host = _primary_host(service)
    url = f"{proto}://{host}:{port}{path}"
    svc_id = service["name"].lower()
    try:
        resp = await client.get(url, follow_redirects=False)
        # A 5xx means the service answered but is itself unhealthy (e.g.
        # RelayRoom's /readyz is 503 while its upstream is down); anything
        # below that counts the port as alive.
        return svc_id, resp.status_code < 500
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
        "results": dict(pairs),
        "checked_at": now.isoformat(),
        "cached_for": _CACHE_TTL,
    }
    _cache_at = now
    return _cache
