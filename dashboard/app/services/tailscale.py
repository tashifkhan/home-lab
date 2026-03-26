import asyncio
from datetime import datetime, timezone

import httpx

from app.config import settings

_TOKEN_URL = "https://api.tailscale.com/api/v2/oauth/token"
_API_BASE = "https://api.tailscale.com/api/v2"

_DEVICE_CACHE_TTL = 60  # seconds
_TOKEN_BUFFER_SECS = 120  # refresh token this many seconds before expiry

_token: str | None = None
_token_expires_at: datetime | None = None

_device_cache: list[dict] | None = None
_device_cache_at: datetime | None = None


async def _fetch_token() -> str:
    async with httpx.AsyncClient() as client:
        r = await client.post(
            _TOKEN_URL,
            data={
                "client_id": settings.tailscale_client_id,
                "client_secret": settings.tailscale_client_secret,
                "grant_type": "client_credentials",
            },
        )
        r.raise_for_status()
        data = r.json()
        return data["access_token"], data.get("expires_in", 3600)


async def _get_token() -> str:
    global _token, _token_expires_at

    now = datetime.now(timezone.utc)
    if (
        _token
        and _token_expires_at
        and ((_token_expires_at - now).total_seconds() > _TOKEN_BUFFER_SECS)
    ):
        return _token

    token, expires_in = await _fetch_token()
    _token = token
    _token_expires_at = datetime.fromtimestamp(
        now.timestamp() + expires_in, tz=timezone.utc
    )
    return _token


def _format_last_seen(ts: str | None) -> str:
    """Return a human-readable relative time string."""
    if not ts:
        return "never"
    try:
        dt = datetime.fromisoformat(ts.replace("Z", "+00:00"))
        delta = datetime.now(timezone.utc) - dt
        secs = int(delta.total_seconds())
        if secs < 60:
            return "just now"
        if secs < 3600:
            return f"{secs // 60}m ago"
        if secs < 86400:
            return f"{secs // 3600}h ago"
        return f"{secs // 86400}d ago"
    except Exception:
        return ts


def _is_online(raw: dict, last_seen_ts: str | None) -> bool:
    # Prefer the explicit field if present (requires fields=all)
    if "online" in raw:
        return bool(raw["online"])
    # Fallback: consider online if seen within the last 10 minutes
    if last_seen_ts:
        try:
            dt = datetime.fromisoformat(last_seen_ts.replace("Z", "+00:00"))
            return (datetime.now(timezone.utc) - dt).total_seconds() < 600
        except Exception:
            pass
    return False


def _parse_device(raw: dict) -> dict:
    addresses = raw.get("addresses", [])
    tailscale_ip = next((a for a in addresses if a.startswith("100.")), None)
    last_seen = raw.get("lastSeen") or raw.get("lastSeenConnectedAt")
    # name from API is the full MagicDNS name; hostname is the short label
    hostname = raw.get("hostname") or raw.get("name", "").split(".")[0]
    return {
        "id": raw.get("id", ""),
        "hostname": hostname,
        "display_name": raw.get("displayName") or hostname,
        "user": raw.get("user", ""),
        "tailscale_ip": tailscale_ip or "—",
        "os": raw.get("os", ""),
        "client_version": raw.get("clientVersion", ""),
        "online": _is_online(raw, last_seen),
        "last_seen": _format_last_seen(last_seen),
        "last_seen_raw": last_seen,
        "authorized": raw.get("authorized", False),
    }


async def get_devices() -> tuple[list[dict], str]:
    """Return (devices, checked_at_iso). Cached for _DEVICE_CACHE_TTL seconds."""
    global _device_cache, _device_cache_at

    now = datetime.now(timezone.utc)

    if (
        _device_cache is not None
        and _device_cache_at is not None
        and (now - _device_cache_at).total_seconds() < _DEVICE_CACHE_TTL
    ):
        return _device_cache, _device_cache_at.isoformat()

    token = await _get_token()
    tailnet = settings.tailscale_tailnet

    async with httpx.AsyncClient() as client:
        r = await client.get(
            f"{_API_BASE}/tailnet/{tailnet}/devices",
            headers={"Authorization": f"Bearer {token}"},
            params={"fields": "all"},
        )
        r.raise_for_status()
        raw_devices = r.json().get("devices", [])

    devices = [_parse_device(d) for d in raw_devices]
    devices.sort(key=lambda d: (not d["online"], d["hostname"].lower()))

    # invalidate token cache if it came back with no online data (fields=all not honoured)
    _device_cache = devices
    _device_cache_at = now
    return devices, now.isoformat()
