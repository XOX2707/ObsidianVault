#!/usr/bin/env bash
# Watches the Claude and DeepSeek status pages and prints one line per change:
# overall status, non-operational components and incident updates for Claude
# (Statuspage JSON API); headline and open incidents for DeepSeek (a FlashCat
# page with no JSON API, read from its visible text). Lines that disappear
# are printed with "[已解除]". The first poll prints the current state as a
# baseline. Built to run under Claude Code's Monitor tool, one event per line.
#
# Needs bash, curl and python3. Usage:
#   bash scripts/status-monitor.sh               # poll every 120 s
#   STATUS_INTERVAL=300 bash scripts/status-monitor.sh
# State (the last seen text per site) lives outside the vault by default;
# override with STATUS_STATE_DIR.
set -u
STATE_DIR="${STATUS_STATE_DIR:-${TMPDIR:-/tmp}/status-monitor-state}"
mkdir -p "$STATE_DIR"

poll() {
  local name="$1" url="$2" out
  out=$(curl -sS -m 20 "$url" 2>&1) || {
    echo "$name: fetch failed: ${out:0:120}"
    return
  }
  printf '%s' "$out" | python3 -I -c '
import json, sys
try:
    d = json.load(sys.stdin)
except Exception:
    print("UNPARSEABLE"); sys.exit()
print("overall|" + d.get("status", {}).get("description", "?"))
for c in d.get("components", []):
    if not c.get("group") and c.get("status") != "operational":
        print("component|%s: %s" % (c.get("name"), c.get("status")))
for i in d.get("incidents", []):
    u = (i.get("incident_updates") or [{}])[0]
    print("incident|%s [%s/%s] %s" % (i.get("name"), i.get("status"), i.get("impact"), (u.get("body") or "")[:160].replace("\n", " ")))
'
}

# DeepSeek's page is a FlashCat (Next.js) status page with no JSON API, so
# read its visible text between the header and the event calendar: the
# headline plus each open incident's title, latest update and state.
poll_flashcat() {
  local name="$1" url="$2" out
  out=$(curl -sS -m 20 "$url" 2>&1) || {
    echo "fetch failed: ${out:0:120}"
    return
  }
  printf '%s' "$out" | python3 -I -c '
import html, re, sys
t = sys.stdin.read()
t = re.sub(r"<script[^>]*>.*?</script>|<style[^>]*>.*?</style>", " ", t, flags=re.S)
lines = [html.unescape(l).strip() for l in re.sub(r"<[^>]+>", "\n", t).split("\n")]
lines = [l for l in lines if l and l != "·"]
if "Powered by" not in lines:
    print("UNPARSEABLE"); sys.exit()
lines = lines[lines.index("Powered by") + 1 :]
# The page sometimes renders without the calendar, so stop at whichever
# section comes first after the incidents.
ends = [lines.index(m) for m in ("Event calendar", "System status", "View historical events") if m in lines]
lines = lines[: min(ends)] if ends else lines
# Drop the ticking "Ongoing for N hours" so it does not count as a change.
print("\n".join(l for l in lines if not l.startswith("Ongoing for")))
'
}

while true; do
  for pair in "Claude|https://status.claude.com/api/v2/summary.json" \
              "DeepSeek|https://status.deepseek.com/"; do
    name="${pair%%|*}"; url="${pair#*|}"
    if [ "$name" = "DeepSeek" ]; then
      cur=$(poll_flashcat "$name" "$url")
    else
      cur=$(poll "$name" "$url" | sort)
    fi
    prev_file="$STATE_DIR/$name"
    prev=$(cat "$prev_file" 2>/dev/null || true)
    if [ "$cur" != "$prev" ]; then
      diff <(printf '%s\n' "$prev") <(printf '%s\n' "$cur") | grep '^[<>] ' \
        | sed -e "s/^> /$name: /" -e "s/^< /$name: [已解除] /" | grep -v ': \[已解除\] $'
      echo "$name: ---"
      printf '%s' "$cur" > "$prev_file"
    fi
  done
  sleep "${STATUS_INTERVAL:-120}"
done
