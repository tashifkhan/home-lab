#!/usr/bin/env python3
"""Serve this Mac's battery level as JSON for the dashboard's Network page.

GET /battery -> {"percent": 65, "status": "discharging", "charging": false,
                 "remaining": "3:12"}

Binds to the Tailscale IP only, so nothing outside the tailnet can reach it.
Standard library only; runs on the system /usr/bin/python3.
"""

from __future__ import annotations

import json
import re
import subprocess
import sys
from http.server import BaseHTTPRequestHandler, HTTPServer

_PCT = re.compile(r"(\d+)%;\s*([^;]+);\s*(\S+)?")


def read() -> dict | None:
    out = subprocess.run(
        ["pmset", "-g", "batt"], capture_output=True, text=True, timeout=5
    ).stdout
    m = _PCT.search(out)
    if not m:
        return None
    status = m.group(2).strip()
    remaining = m.group(3)
    return {
        "percent": int(m.group(1)),
        "status": status,
        "charging": status in ("charging", "charged", "finishing charge")
        or "AC Power" in out,
        "remaining": remaining if remaining and ":" in remaining else None,
    }


class Handler(BaseHTTPRequestHandler):
    def do_GET(self):
        if self.path.rstrip("/") != "/battery":
            self.send_error(404)
            return
        body = json.dumps(read()).encode()
        self.send_response(200)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def log_message(self, *args):
        pass


if __name__ == "__main__":
    host = sys.argv[1] if len(sys.argv) > 1 else "127.0.0.1"
    port = int(sys.argv[2]) if len(sys.argv) > 2 else 8399
    HTTPServer((host, port), Handler).serve_forever()
