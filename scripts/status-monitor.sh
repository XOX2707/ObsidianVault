#!/usr/bin/env bash
# Watches the Claude and DeepSeek status pages and prints one line per change:
# overall status, non-operational components and incident updates for Claude
# (Statuspage JSON API); unresolved incidents for DeepSeek (from the RSS feed
# of its Flashduty-hosted page, which has no JSON API). Lines that disappear
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

# DeepSeek's status page (hosted on Flashduty) has no JSON API, but it
# publishes an RSS feed with one item per incident carrying the incident's
# latest state. Report the incidents that are not resolved yet: title,
# status, latest update and affected components. When one resolves, its line
# disappears and the diff below reports it with "[已解除]".
poll_deepseek_rss() {
  local name="$1" url="$2" out
  out=$(curl -sS -m 20 "$url" 2>&1) || {
    echo "fetch failed: ${out:0:120}"
    return
  }
  printf '%s' "$out" | python3 -I -c '
import html, re, sys
import xml.etree.ElementTree as ET
try:
    root = ET.fromstring(sys.stdin.read())
except ET.ParseError:
    print("UNPARSEABLE"); sys.exit()

def text(fragment):
    plain = re.sub(r"<[^>]+>", "\n", html.unescape(fragment or ""))
    return [l.strip() for l in plain.split("\n") if l.strip()]

open_incidents = []
for item in root.findall("./channel/item"):
    # The description is "<strong>Status:</strong> x" then the update text
    # then "<strong>Affected components:</strong> y", so a label and its
    # value come out as separate lines.
    status, update, affected, field = "?", [], "", None
    for line in text(item.findtext("description")):
        if line in ("Status:", "Affected components:"):
            field = line
        elif field == "Status:":
            status, field = line, None
        elif field == "Affected components:":
            affected, field = line, None
        else:
            update.append(line)
    if status.lower() in ("resolved", "completed"):
        continue
    open_incidents.append(
        "incident|%s [%s] %s | 影响: %s"
        % (item.findtext("title"), status, " ".join(update)[:200], affected or "?")
    )
print("overall|" + ("%d 个未解决的事件" % len(open_incidents) if open_incidents else "没有未解决的事件"))
print("\n".join(open_incidents))
'
}

while true; do
  for pair in "Claude|https://status.claude.com/api/v2/summary.json" \
              "DeepSeek|https://status.deepseek.com/feed.rss"; do
    name="${pair%%|*}"; url="${pair#*|}"
    if [ "$name" = "DeepSeek" ]; then
      cur=$(poll_deepseek_rss "$name" "$url")
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
