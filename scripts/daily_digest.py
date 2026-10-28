"""Print one diary day's material: songs played and AI conversations, merged into one timeline.

The output is material for whoever writes the diary (see YOLO/memory/global/write-diary.md);
this script writes nothing. The "## 今天听的歌" section itself is written by
scripts/ncm_daily_diary.py, whose NetEase reader and day boundary are reused here.

AI sources (local, read-only):
- YOLO chats: YOLO/data/chats/v1_*.json (user messages, per-chat model and estimated cost)
- Claude Code sessions: ~/.claude/projects/*/*.jsonl (user messages)

Usage:
    python scripts/daily_digest.py               # today (a day ends at 04:00 next morning)
    python scripts/daily_digest.py 2026-10-19
"""

import json
import re
import sys
from datetime import datetime, timedelta
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import ncm_daily_diary as ncm  # noqa: E402

VAULT = Path(__file__).resolve().parent.parent
YOLO_CHATS = VAULT / "YOLO" / "data" / "chats"
CLAUDE_PROJECTS = Path.home() / ".claude" / "projects"

# Per million tokens. Claude in USD, DeepSeek in CNY (cache miss / hit / output).
CLAUDE_PRICE = {"in": 4, "write": 5, "read": 0.2, "out": 20}
DEEPSEEK_PRICE = {"flash": (1, 0.02, 4), "pro": (4.5, 0.15, 13.5)}


def day_window(day):
    start = datetime.strptime(day, "%Y-%m-%d") + timedelta(hours=ncm.DAY_CUTOFF_HOUR)
    return start, start + timedelta(days=1)


def music_plays(day):
    by_source, _ = ncm.collect()
    rows, _ = ncm.load_log()
    rows += [e for evs in by_source.values() for e in evs]
    return ncm.day_events(rows, datetime.strptime(day, "%Y-%m-%d").date())


# Things that look like keys or tokens, masked before anything is printed.
SECRET = re.compile(
    r"(?<![A-Za-z0-9])(?:sk-[A-Za-z0-9_-]{16,}|gh[pousr]_[A-Za-z0-9]{20,}|xox[abpr]-[A-Za-z0-9-]{10,})"
    r"|-----BEGIN[^-]*-----"
    r"|(?i:(?:api[_-]?key|token|secret|password)[\"']?\s*[:=]\s*[\"']?[^\s\"',]+)"
    r"|(?<![A-Za-z0-9_-])(?=[A-Za-z0-9_-]*[A-Za-z])(?=[A-Za-z0-9_-]*[0-9])[A-Za-z0-9_-]{40,}(?![A-Za-z0-9_-])"
)
# Claude Code wraps commands and system notes in these tags; they are not things the user said.
WRAPPERS = ("<system-reminder", "<command-", "<local-command", "<task-notification", "<bash-", "<user-prompt-submit-hook")


def clip(text, n=80):
    text = re.sub(r"-----BEGIN[^-]*-----.*?(-----END[^-]*-----|$)", "[redacted]", text or "", flags=re.S)
    text = SECRET.sub("[redacted]", re.sub(r"\s+", " ", text or "").strip())
    return text if len(text) <= n else text[: n - 1] + "…"


# ---------- YOLO ----------


def lexical_text(node):
    if isinstance(node, dict):
        if "root" in node:
            return lexical_text(node["root"])
        if node.get("type") == "text" or "text" in node and isinstance(node["text"], str):
            return node.get("text", "")
        return "".join(lexical_text(c) for c in node.get("children", []) or []) + (
            " " if node.get("type") == "paragraph" else ""
        )
    if isinstance(node, list):
        return "".join(lexical_text(c) for c in node)
    return ""


def message_cost(model, u):
    prompt = u.get("prompt_tokens") or 0
    out = u.get("completion_tokens") or 0
    read = u.get("cache_read_input_tokens") or 0
    write = u.get("cache_creation_input_tokens") or 0
    model = model.lower()
    if "claude" in model:
        p = CLAUDE_PRICE
        usd = (max(0, prompt - read - write) * p["in"] + write * p["write"] + read * p["read"] + out * p["out"]) / 1e6
        return usd, 0.0
    if "deepseek" in model:
        miss, hit, o = DEEPSEEK_PRICE["flash" if "flash" in model else "pro"]
        return 0.0, (max(0, prompt - read) * miss + read * hit + out * o) / 1e6
    return 0.0, 0.0


def yolo_events(start, end):
    """Return ([(time, label, text)], {title: (usd, cny, models)})."""
    events, chats = [], {}
    if not YOLO_CHATS.exists():
        return events, chats
    for f in YOLO_CHATS.glob("v1_*.json"):
        if datetime.fromtimestamp(f.stat().st_mtime) < start:
            continue
        try:
            chat = json.loads(f.read_text(encoding="utf-8"))
        except (OSError, ValueError):
            continue
        if not isinstance(chat, dict):
            continue
        title = clip(chat.get("title") or f.stem, 40)
        when = None
        for m in chat.get("messages") or []:
            if not isinstance(m, dict):
                continue
            if m.get("role") == "user" and m.get("timeContext"):
                try:
                    when = datetime.fromisoformat(m["timeContext"][:16].replace(" ", "T"))
                except ValueError:
                    when = None
                    continue
                if start <= when < end:
                    text = lexical_text(m.get("content")) or str(m.get("promptContent") or "")
                    events.append((when, f"YOLO「{title}」", clip(text)))
            usage = (m.get("metadata") or {}).get("usage")
            if m.get("role") == "assistant" and usage and when and start <= when < end:
                model = m["metadata"].get("model") or "?"
                if isinstance(model, dict):
                    model = model.get("model") or "?"
                usd, cny = message_cost(model, usage)
                c = chats.setdefault(f.stem, [0.0, 0.0, set(), title])
                c[0] += usd
                c[1] += cny
                c[2].add(model)
    return events, chats


# ---------- Claude Code ----------


def claude_code_events(start, end):
    events = []
    if not CLAUDE_PROJECTS.exists():
        return events
    for f in CLAUDE_PROJECTS.glob("*/*.jsonl"):
        try:
            if datetime.fromtimestamp(f.stat().st_mtime) < start:
                continue
            lines = f.read_text(encoding="utf-8", errors="replace").splitlines()
        except OSError:
            continue
        for line in lines:
            if '"type":"user"' not in line and '"type": "user"' not in line:
                continue
            try:
                o = json.loads(line)
            except ValueError:
                continue
            if not isinstance(o, dict) or o.get("type") != "user" or o.get("isMeta") or o.get("isSidechain"):
                continue
            content = (o.get("message") or {}).get("content")
            if isinstance(content, list):
                if any(b.get("type") == "tool_result" for b in content if isinstance(b, dict)):
                    continue
                content = " ".join(b.get("text", "") for b in content if isinstance(b, dict))
            if not isinstance(content, str) or not content.strip():
                continue
            if content.lstrip().startswith(WRAPPERS) or content.startswith("This session is being continued"):
                continue
            try:
                when = datetime.fromisoformat(o["timestamp"].replace("Z", "+00:00")).astimezone().replace(tzinfo=None)
            except (KeyError, AttributeError, ValueError):
                continue
            if start <= when < end:
                project = Path(o.get("cwd") or "").name or f.parent.name
                events.append((when, f"Claude Code（{project}）", clip(content)))
    return events


# ---------- main ----------


def main():
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8")
    day = sys.argv[1] if len(sys.argv) > 1 else ncm.logical_day(datetime.now()).isoformat()
    start, end = day_window(day)

    try:
        plays = music_plays(day)
    except Exception as exc:  # the AI half is still worth printing
        print(f"（读网易云记录失败：{exc}）\n")
        plays = []
    yolo, chats = yolo_events(start, end)
    cc = claude_code_events(start, end)

    print(f"# {day} 素材（{start:%m-%d %H:%M} 到 {end:%m-%d %H:%M}）\n")
    print("## 听歌概括（和 ncm_daily_diary.py 写进日记的一样）\n")
    print(ncm.render_music(plays).split("\n\n>")[0] + "\n")
    print("## AI 对话\n")
    for usd, cny, models, title in sorted(chats.values(), key=lambda c: -c[0]):
        cost = " + ".join(s for s in (f"${usd:.2f}" if usd else "", f"¥{cny:.2f}" if cny else "") if s)
        print(f"- YOLO「{title}」：{', '.join(sorted(models))}，约 {cost or '0'}")
    print(f"- Claude Code 发言 {len(cc)} 条，YOLO 发言 {len(yolo)} 条\n")

    print("## 时间线（歌和 AI 对话合在一起）\n")
    timeline = [(e["dt"], "♪", f"{ncm.title(e)} · {e.get('artists') or '?'}") for e in plays]
    timeline += yolo + cc
    for t, label, text in sorted(timeline, key=lambda x: x[0]):
        print(f"- {t:%H:%M} {label} {text}")


if __name__ == "__main__":
    main()
