"""Battery level of the machine the dashboard runs on.

The home server is a laptop, and /sys/class/power_supply is visible inside
the container without extra mounts.
"""

import os
from pathlib import Path

_SUPPLY = Path("/sys/class/power_supply")

# Tailscale hostname of the machine this container runs on.
BATTERY_HOST = os.environ.get("BATTERY_HOST", "home-server")


def read_battery() -> dict | None:
    """Return {"percent", "status", "charging"} or None when there's no battery."""
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
            "status": status,
            "charging": status in ("Charging", "Full"),
        }
    return None
