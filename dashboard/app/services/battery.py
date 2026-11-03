"""Battery levels for the Network page, keyed by Tailscale IPv4.

The home server is a laptop, and /sys/class/power_supply is visible inside
the container without extra mounts. Other machines run agents/battery_agent.py,
which serves GET /battery on their Tailscale IP.
"""

import asyncio
import os
from pathlib import Path

import httpx

_SUPPLY = Path("/sys/class/power_supply")
_AGENT_PORT = 8399

# This container's host, read from sysfs.
_LOCAL_IP = os.environ.get("HOME_SERVER_TS_IP", "")

# Machines running the battery agent, comma-separated Tailscale IPs.
_AGENT_IPS = [
    ip.strip()
    for ip in os.environ.get(
        "BATTERY_AGENT_IPS", os.environ.get("MAC_AIR_TS_IP", "")
    ).split(",")
    if ip.strip()
]


def _read_local() -> dict | None:
    try:
        batteries = sorted(_SUPPLY.glob("BAT*"))
    except OSError:
        return None
    for bat in batteries:
        try:
            percent = int((bat / "capacity").read_text().strip())
            status = (bat / "status").read_text().strip()
        except (OSError, ValueError):
            continue
        return {
            "percent": percent,
            "status": status.lower(),
            "charging": status in ("Charging", "Full"),
        }
    return None


async def _read_agent(client: httpx.AsyncClient, ip: str) -> dict | None:
    try:
        r = await client.get(f"http://{ip}:{_AGENT_PORT}/battery")
        data = r.json() if r.status_code == 200 else None
    except Exception:
        return None
    if not isinstance(data, dict) or not isinstance(data.get("percent"), int):
        return None
    return {
        "percent": data["percent"],
        "status": str(data.get("status", "")),
        "charging": bool(data.get("charging")),
    }


async def get_batteries() -> dict[str, dict]:
    """Map Tailscale IP -> {"percent", "status", "charging"} for every reachable battery."""
    out: dict[str, dict] = {}
    local = _read_local()
    if local and _LOCAL_IP:
        out[_LOCAL_IP] = local
    if _AGENT_IPS:
        async with httpx.AsyncClient(timeout=httpx.Timeout(2.0, connect=1.5)) as client:
            results = await asyncio.gather(*[_read_agent(client, ip) for ip in _AGENT_IPS])
        out.update({ip: b for ip, b in zip(_AGENT_IPS, results) if b})
    return out
