#!/bin/sh
# Install the battery agent on a Mac as a launchd user agent.
set -eu

here="$(cd "$(dirname "$0")" && pwd)"
ts_ip="$(tailscale ip -4 2>/dev/null || /Applications/Tailscale.app/Contents/MacOS/Tailscale ip -4)"
plist="$HOME/Library/LaunchAgents/sh.taf.battery-agent.plist"

mkdir -p "$HOME/.local/bin"
install -m 755 "$here/battery_agent.py" "$HOME/.local/bin/battery-agent"
sed -e "s|__HOME__|$HOME|" -e "s|__TS_IP__|$ts_ip|" "$here/sh.taf.battery-agent.plist" > "$plist"

launchctl bootout "gui/$(id -u)/sh.taf.battery-agent" 2>/dev/null || true
launchctl bootstrap "gui/$(id -u)" "$plist"
echo "battery agent on http://$ts_ip:8399/battery"
