import asyncio

from fastapi import APIRouter, Cookie, Request
from fastapi.responses import HTMLResponse, JSONResponse, RedirectResponse
from fastapi.templating import Jinja2Templates

from app.config import settings
from app.deps.auth import verify_token
from app.services.battery import get_batteries
from app.services.tailscale import _DEVICE_CACHE_TTL, get_devices

router = APIRouter(tags=["tailscale"])
templates = Jinja2Templates(directory="templates")


@router.get("/tailscale")
async def tailscale_page(
    request: Request,
    access_token: str | None = Cookie(default=None),
):
    # Shell only, so the tab opens instantly; devices load from /tailscale/devices.
    if not verify_token(access_token):
        return RedirectResponse("/login?next=/tailscale", status_code=303)
    return templates.TemplateResponse(request, "tailscale.html", {})


@router.get("/tailscale/devices")
async def tailscale_devices(
    request: Request,
    access_token: str | None = Cookie(default=None),
):
    if not verify_token(access_token):
        return HTMLResponse("", status_code=401)

    fresh = request.query_params.get("fresh") in ("1", "true", "yes")

    async def devices_or_error():
        try:
            devices, checked_at = await get_devices(force=fresh)
            return devices, checked_at, None
        except Exception as exc:
            return [], None, str(exc)

    (devices, checked_at, error), batteries = await asyncio.gather(
        devices_or_error(), get_batteries()
    )
    online_count = sum(1 for d in devices if d["online"])

    return templates.TemplateResponse(
        request,
        "_devices.html",
        {
            "devices": devices,
            "checked_at": checked_at,
            "online_count": online_count,
            "total": len(devices),
            "cache_ttl": _DEVICE_CACHE_TTL,
            "error": error,
            "tailnet": settings.tailscale_tailnet,
            "batteries": batteries,
        },
        headers={
            "Cache-Control": "no-store",
            "X-Refresh-After": str(_DEVICE_CACHE_TTL),
        },
    )


@router.get("/api/tailscale/raw")
async def tailscale_raw(
    access_token: str | None = Cookie(default=None),
):
    """Debug: returns the first device's raw fields from the Tailscale API."""
    if not verify_token(access_token):
        return JSONResponse({"error": "unauthorized"}, status_code=401)
    import httpx

    from app.services.tailscale import _API_BASE, _get_token

    token = await _get_token()
    tailnet = settings.tailscale_tailnet
    async with httpx.AsyncClient() as client:
        r = await client.get(
            f"{_API_BASE}/tailnet/{tailnet}/devices",
            headers={"Authorization": f"Bearer {token}"},
            params={"fields": "all"},
        )
        r.raise_for_status()
        devices = r.json().get("devices", [])

    return {
        "first_device_keys": list(devices[0].keys()) if devices else [],
        "first_device": devices[0] if devices else {},
    }


@router.get("/api/tailscale/devices")
async def tailscale_devices_api(
    request: Request,
    access_token: str | None = Cookie(default=None),
):
    if not verify_token(access_token):
        return JSONResponse(
            {
                "error": "unauthorized",
            },
            status_code=401,
        )

    fresh = request.query_params.get("fresh") in ("1", "true", "yes")

    try:
        devices, checked_at = await get_devices(force=fresh)
        return {
            "devices": devices,
            "checked_at": checked_at,
            "cached_for": _DEVICE_CACHE_TTL,
        }

    except Exception as exc:
        return JSONResponse(
            {
                "error": str(exc),
            },
            status_code=502,
        )
