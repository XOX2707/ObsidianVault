"""把这台电脑网易云音乐每天听过的歌扒出来，写进当天日记的「## 今天听的歌」一节。

只读网易云 PC 客户端的本地文件，不联网、不登录：
  - %LOCALAPPDATA%/NetEase/CloudMusic/Library/webdb.dat（SQLite）里名字像「最近播放」的表
    （history / recent / playRecord 之类）和 playingCount
  - %LOCALAPPDATA%/NetEase/CloudMusic/webdata/file/history（旧版客户端的最近播放 JSON）
具体是哪张表、哪个字段，脚本自己按列名和 JSON 结构去认，先用 --probe 看它认到了什么。

客户端的「最近播放」每首歌只留最后一次播放时间，重听会把旧时间盖掉，所以脚本每次运行都把
看到的（歌, 时间）追加进 兴趣/网易云·每日听歌/plays.jsonl 攒起来。挂进 Windows 计划任务每 30 分钟
跑一次，重听也能记下来（30 分钟内重复听同一首只算一次）。plays.jsonl 是私人数据，不要 git add。

日记里只改两段带 <!-- xxx:start --> / <!-- xxx:end --> 标记的内容，别的字一个不动：
  - ncm：「## 今天听的歌」整段（放在「## 想法」前面）
  - ai-notes：「## 交给 AI 的事」末尾一行，列出 AI对话/ 里当天日期开头、日记里还没链接过的笔记

用法：
    python scripts/ncm_daily_diary.py                    # 收集一次，刷新今天和昨天的日记
    python scripts/ncm_daily_diary.py --probe            # 只看找到了哪些数据源，不写任何文件
    python scripts/ncm_daily_diary.py --date 2026-10-19  # 刷新指定日期
    python scripts/ncm_daily_diary.py --backfill         # 刷新记录里所有日期（只改已经存在的日记）
    python scripts/ncm_daily_diary.py --no-diary         # 只收集，不碰日记
"""

import argparse
import json
import os
import re
import shutil
import sqlite3
import sys
import tempfile
import traceback
from collections import Counter
from datetime import date, datetime, timedelta
from pathlib import Path

VAULT = Path(__file__).resolve().parent.parent
DIARY_DIR = VAULT / "日记"
AI_NOTES_DIR = VAULT / "AI对话"
DATA_DIR = VAULT / "兴趣" / "网易云·每日听歌"
LOG = DATA_DIR / "plays.jsonl"
ERR = DATA_DIR / "last_error.txt"

NCM = Path(os.environ.get("LOCALAPPDATA", "")) / "NetEase" / "CloudMusic"
DB = NCM / "Library" / "webdb.dat"
HISTORY_FILES = [NCM / "webdata" / "file" / "history"]

DAY_CUTOFF_HOUR = 4  # 凌晨 4 点前听的算前一天（用户一两点才睡，见 write-diary 记忆）
SESSION_GAP_MIN = 20  # 上一首放完到下一首开始隔了 20 分钟以上，就算新的一段
WEEKDAYS = "一二三四五六日"

TABLE_HINTS = ("history", "recent", "playrecord", "playlog", "playingcount", "listen")
SKIP_TABLES = {"requestcache", "persistentmodel", "dbtrack", "playlisttrackids"}
JSON_TIME_KEYS = ("playtime", "playedtime", "lastplaytime", "time", "timestamp")
COL_TIME_KEYS = JSON_TIME_KEYS + ("ts", "updatetime", "createtime", "date")
TRACK_KEYS = ("track", "song", "data", "resource", "simpleSong")


# ---------- 解析 ----------

def to_dt(v):
    """秒 / 毫秒 / 微秒时间戳或 ISO 字符串转本地时间，不像 2011 到 2039 年的时间就返回 None"""
    if v is None or isinstance(v, bool):
        return None
    if isinstance(v, str):
        s = v.strip()
        if not re.fullmatch(r"\d+(\.\d+)?", s):
            try:
                d = datetime.fromisoformat(s.replace("Z", "+00:00"))
            except ValueError:
                return None
            if d.tzinfo:
                d = d.astimezone().replace(tzinfo=None)
            return d if 2011 <= d.year <= 2039 else None
        v = s
    try:
        x = float(v)
    except (TypeError, ValueError):
        return None
    if x > 1e14:
        x /= 1e6
    elif x > 1e11:
        x /= 1e3
    if not 1.3e9 < x < 2.2e9:
        return None
    return datetime.fromtimestamp(x)


def pick_time(d, keys):
    low = {str(k).lower(): k for k in d}
    for k in keys:
        if k in low:
            t = to_dt(d[low[k]])
            if t:
                return t
    return None


def track_info(t):
    """兼容旧字段（artists / album / duration）和新字段（ar / al / dt）"""
    if not isinstance(t, dict) or "id" not in t or not t.get("name"):
        return None
    ar = t.get("artists") if "artists" in t else t.get("ar")
    if not isinstance(ar, list):
        return None  # 没有歌手列表的多半是歌单、专辑，不是歌
    al = t.get("album") if isinstance(t.get("album"), dict) else t.get("al")
    al = al if isinstance(al, dict) else {}
    try:
        duration = int(t.get("duration") or t.get("dt") or 0)
    except (TypeError, ValueError):
        duration = 0
    return {
        "id": str(t["id"]),
        "name": str(t["name"]),
        "artists": " / ".join(str(a.get("name") or "") for a in ar if isinstance(a, dict)),
        "album": str(al.get("name") or ""),
        "duration": duration,
    }


def find_track(obj):
    info = track_info(obj)
    if info or not isinstance(obj, dict):
        return info
    for k in TRACK_KEYS:
        info = track_info(obj.get(k))
        if info:
            return info
    return None


def event(source, info, ts):
    e = {"source": source, "ts": ts.strftime("%Y-%m-%d %H:%M:%S")}
    e.update(info)
    return e


def events_from_json(node, source):
    """在任意 JSON 里找「带播放时间的歌」"""
    out, stack = [], [node]
    while stack:
        n = stack.pop()
        if isinstance(n, list):
            stack.extend(n)
            continue
        if not isinstance(n, dict):
            continue
        ts = pick_time(n, JSON_TIME_KEYS)
        info = find_track(n) if ts else None
        if info:
            out.append(event(source, info, ts))
            continue
        stack.extend(n.values())
    return out


# ---------- 读本地缓存 ----------

def open_db_copy(tmp):
    """客户端一直占着库文件，复制一份再读；WAL 模式下最新的写入在 -wal 里，一起复制"""
    copy = Path(tmp) / "webdb.dat"
    shutil.copy2(DB, copy)
    for suf in ("-wal", "-shm"):
        side = DB.with_name(DB.name + suf)
        if side.exists():
            try:
                shutil.copy2(side, copy.with_name(copy.name + suf))
            except OSError:
                pass
    return sqlite3.connect(str(copy))


def candidate_tables(con):
    names = [r[0] for r in con.execute("select name from sqlite_master where type='table' order by name")]
    picked = [n for n in names if n.lower() not in SKIP_TABLES and any(h in n.lower() for h in TABLE_HINTS)]
    return names, picked


def events_from_table(con, table):
    cols = [c[1] for c in con.execute(f'pragma table_info("{table}")')]
    low = {c.lower(): c for c in cols}
    json_cols = [c for c in cols if "json" in c.lower()]
    id_col = next((low[k] for k in ("trackid", "songid", "resourceid") if k in low), None)
    type_col = low.get("resourcetype")
    out = []
    for row in con.execute(f'select * from "{table}"'):
        r = dict(zip(cols, row))
        if type_col and str(r.get(type_col) or "").lower() not in ("track", "song", ""):
            continue
        ts = pick_time(r, COL_TIME_KEYS)
        evs = []
        for jc in json_cols:
            try:
                obj = json.loads(r[jc]) if r[jc] else None
            except (TypeError, ValueError):
                continue
            evs = events_from_json(obj, table)
            if not evs and ts:
                info = find_track(obj)
                if info:
                    evs = [event(table, info, ts)]
            if evs:
                break
        if not evs and ts and id_col and r.get(id_col) is not None:
            evs = [event(table, {"id": str(r[id_col])}, ts)]
        # playingCount 记的是这次实际播放了几秒，比整首时长准；一行对应一首时才用
        if len(evs) == 1 and "playduration" in low and isinstance(r.get(low["playduration"]), (int, float)):
            evs[0]["listened"] = int(r[low["playduration"]])
        out.extend(evs)
    return cols, out


def fill_meta(con, events):
    """只有歌曲 id 的记录，去 dbTrack 补歌名、歌手"""
    cache = {}
    for e in events:
        if e.get("name"):
            continue
        tid = e["id"]
        if tid not in cache:
            info = None
            for key in (tid, int(tid) if tid.isdigit() else None):
                if key is None:
                    continue
                try:
                    row = con.execute("select jsonStr from dbTrack where id=?", (key,)).fetchone()
                except sqlite3.Error:
                    row = None
                if row:
                    try:
                        info = find_track(json.loads(row[0]))
                    except (TypeError, ValueError):
                        info = None
                    break
            cache[tid] = info
        if cache[tid]:
            e.update({k: v for k, v in cache[tid].items() if k != "id"})


def collect():
    by_source, notes = {}, []
    if DB.exists():
        with tempfile.TemporaryDirectory() as tmp:
            con = open_db_copy(tmp)
            try:
                names, picked = candidate_tables(con)
                notes.append(f"webdb.dat 共 {len(names)} 张表：{', '.join(names)}")
                notes.append(f"按名字挑出来的候选表：{', '.join(picked) or '（没有）'}")
                for t in picked:
                    try:
                        cols, evs = events_from_table(con, t)
                    except sqlite3.Error as exc:
                        notes.append(f"  表 {t} 读取失败：{exc}")
                        continue
                    fill_meta(con, evs)
                    notes.append(f"  表 {t}：列 {', '.join(cols)}，认出 {len(evs)} 条带时间的播放")
                    if evs:
                        by_source[t] = evs
            finally:
                con.close()  # 先关掉，临时目录才删得掉
    else:
        notes.append(f"没找到 {DB}")
    for f in HISTORY_FILES:
        if not f.exists():
            notes.append(f"没有 {f}")
            continue
        src = f"file:{f.name}"
        try:
            obj = json.loads(f.read_text(encoding="utf-8", errors="replace"))
        except ValueError as exc:
            notes.append(f"  {f} 不是 JSON：{exc}")
            continue
        evs = events_from_json(obj, src)
        notes.append(f"  文件 {f}：认出 {len(evs)} 条带时间的播放")
        if evs:
            by_source[src] = evs
    return by_source, notes


# ---------- 攒记录 ----------

def load_log():
    rows, seen = [], set()
    if LOG.exists():
        for line in LOG.read_text(encoding="utf-8").splitlines():
            try:
                e = json.loads(line)
                k = (e["source"], e["id"], e["ts"])
            except (ValueError, KeyError, TypeError):
                continue
            if k not in seen:
                seen.add(k)
                rows.append(e)
    return rows, seen


def merge_into_log(by_source):
    rows, seen = load_log()
    new = []
    for evs in by_source.values():
        for e in evs:
            k = (e["source"], e["id"], e["ts"])
            if k not in seen:
                seen.add(k)
                new.append(e)
    if new:
        DATA_DIR.mkdir(parents=True, exist_ok=True)
        with LOG.open("a", encoding="utf-8") as f:
            for e in sorted(new, key=lambda x: x["ts"]):
                f.write(json.dumps(e, ensure_ascii=False) + "\n")
    return rows + new, len(new)


# ---------- 生成日记段落 ----------

def parse_ts(s):
    return datetime.strptime(s, "%Y-%m-%d %H:%M:%S")


def logical_day(dt):
    return (dt - timedelta(hours=DAY_CUTOFF_HOUR)).date()


def day_events(rows, day):
    evs = [e for e in rows if logical_day(parse_ts(e["ts"])) == day]
    if not evs:
        return []
    # 两类来源记的不一样：playingCount（带实际播放秒数）每次重听都记，但切掉的歌不记；
    # 「最近播放」切掉的也记，可重听只留最后一次。先用带秒数的，再拿别的补，
    # 同一首在 15 分钟内已经有了就不重复算
    counts = Counter(e["source"] for e in evs)
    timed = {e["source"] for e in evs if "listened" in e}
    order = sorted(counts, key=lambda s: (s not in timed, -counts[s]))
    meta = {}
    for e in rows:
        if e.get("name"):
            meta.setdefault(e["id"], e)
    out = []
    for src in order:
        kept, last = len(out), {}
        for e in sorted((x for x in evs if x["source"] == src), key=lambda x: x["ts"]):
            dt = parse_ts(e["ts"])
            # 客户端常把同一次播放连写两行，隔几毫秒到一秒，合成一次（同一条记录出现两遍也一样）
            prev = last.get(e["id"])
            if prev and dt - prev[0] <= timedelta(seconds=10):
                if prev[1] is not None and "listened" in e and "listened" not in prev[1]:
                    prev[1]["listened"] = e["listened"]
                continue
            if any(o["id"] == e["id"] and abs(o["dt"] - dt) <= timedelta(minutes=15) for o in out[:kept]):
                last[e["id"]] = (dt, None)
                continue
            m = {k: v for k, v in meta.get(e["id"], {}).items() if k in ("name", "artists", "album", "duration")}
            # 这条记录上空着的歌名、歌手、时长，用别的记录里认到的补上
            out.append({**e, **{k: v for k, v in m.items() if v and not e.get(k)}, "dt": dt})
            last[e["id"]] = (dt, out[-1])
    return sorted(out, key=lambda x: x["dt"])


def sessions(evs):
    groups = []
    for e in evs:
        if groups:
            prev = groups[-1][-1]
            played = prev["listened"] * 1000 if "listened" in prev else prev.get("duration") or 0
            idle = e["dt"] - prev["dt"] - timedelta(milliseconds=played)
            if idle <= timedelta(minutes=SESSION_GAP_MIN):
                groups[-1].append(e)
                continue
        groups.append([e])
    return groups


def artist_counter(evs):
    return Counter(a.strip() for e in evs for a in (e.get("artists") or "").split(" / ") if a.strip())


def dur_text(ms):
    m = round(ms / 60000)
    return f"{m // 60} 小时 {m % 60:02d} 分" if m >= 60 else f"{m} 分钟"


def title(e):
    return (e.get("name") or f"未知歌曲 {e['id']}").replace("[", "［").replace("]", "］").replace("\n", " ").strip()


def song_line(e):
    line = f"{e['dt']:%H:%M} [{title(e)}](https://music.163.com/song?id={e['id']})"
    return line + (f" · {e['artists']}" if e.get("artists") else "")


def render_music(evs):
    if not evs:
        return "- 这台电脑这天没有听歌记录（手机上听的不算）"
    total = sum(e["listened"] * 1000 if "listened" in e else e.get("duration") or 0 for e in evs)
    if all("listened" in e for e in evs):
        how = f"实际播放约 {dur_text(total)}"
    elif any("listened" in e for e in evs):
        how = f"约 {dur_text(total)}（切掉的歌按整首算，偏多）"
    else:
        how = f"按整首算约 {dur_text(total)}"
    lines = [
        f"- 这台电脑一共听了 {len(evs)} 首（不重复 {len({e['id'] for e in evs})} 首）"
        + (f"，{how}" if total else "")
    ]
    top_artists = artist_counter(evs).most_common(3)
    if top_artists:
        lines.append("- 听得最多的歌手：" + "、".join(f"{a}（{c}）" for a, c in top_artists))
    top_id, top_c = Counter(e["id"] for e in evs).most_common(1)[0]
    if top_c >= 2:
        e = next(x for x in evs if x["id"] == top_id)
        lines.append(f"- 重复最多：{title(e)}" + (f" · {e['artists']}" if e.get("artists") else "") + f"（{top_c} 次）")
    for g in sessions(evs):
        span = f"{g[0]['dt']:%H:%M}" if len(g) == 1 else f"{g[0]['dt']:%H:%M} 到 {g[-1]['dt']:%H:%M}"
        top = [a for a, _ in artist_counter(g).most_common(2)]
        lines.append(f"- {span} 听了 {len(g)} 首" + (f"，多是 {'、'.join(top)}" if top else ""))
    lines += ["", "> [!note]- 完整列表（点歌名在网易云打开）"]
    lines += [f"> - {song_line(e)}" for e in evs]
    return "\n".join(lines)


def ai_notes_line(day, text):
    if not AI_NOTES_DIR.exists():
        return ""  # 目录不在就别动已有的那段
    text = marker("ai-notes")[2].sub("", text)  # 只看标记外面、他自己写的链接
    found = []
    for p in sorted(AI_NOTES_DIR.rglob(f"{day.isoformat()}*.md")):
        if any(f"{p.stem}{c}" in text for c in ("]]", "|", "#")):  # 日记里已经链接过的就不重复列
            continue
        rel = p.relative_to(VAULT).with_suffix("").as_posix()
        found.append(f"[[{rel}|{p.stem}]]")
    return "- 这天在 AI对话/ 里的笔记：" + "、".join(found) if found else None


# ---------- 写日记 ----------

def marker(tag):
    start = f"<!-- {tag}:start 由 scripts/ncm_daily_diary.py 生成，重跑会整段覆盖，别在这段里手写 -->"
    return start, f"<!-- {tag}:end -->", re.compile(rf"<!-- {tag}:start.*?<!-- {tag}:end -->", re.S)


def heading(text, name):
    return re.search(rf"^## {re.escape(name)}[ \t]*$", text, re.M)


def upsert_music(text, body):
    start, end, pat = marker("ncm")
    block = f"{start}\n{body}\n{end}"
    if pat.search(text):
        return pat.sub(lambda _: block, text, count=1)
    h = heading(text, "今天听的歌")
    if h:
        return text[: h.end()] + "\n\n" + block + "\n" + text[h.end():]
    for anchor in ("想法", "交给 AI 的事"):
        h = heading(text, anchor)
        if h:
            return text[: h.start()] + f"## 今天听的歌\n\n{block}\n\n" + text[h.start():]
    return text.rstrip("\n") + f"\n\n## 今天听的歌\n\n{block}\n"


def upsert_ai_notes(text, line):
    start, end, pat = marker("ai-notes")
    block = f"{start}\n{line}\n{end}"
    if pat.search(text):
        return pat.sub(lambda _: block, text, count=1)
    h = heading(text, "交给 AI 的事")
    if not h:
        return text.rstrip("\n") + f"\n\n## 交给 AI 的事\n\n{block}\n"
    nxt = re.search(r"^## ", text[h.end():], re.M)
    cut = h.end() + nxt.start() if nxt else len(text)
    head, tail = text[:cut].rstrip("\n"), text[cut:]
    sep = "\n\n" if head.endswith(h.group(0)) else "\n"
    return head + sep + block + "\n" + ("\n" + tail if tail else "")


def new_diary(day):
    return (
        f"---\ntags: [日记]\ncreated: {day.isoformat()}\n---\n\n"
        f"# {day.isoformat()} 星期{WEEKDAYS[day.weekday()]}\n\n"
        "## 今天\n\n## 想法\n\n## 交给 AI 的事\n"
    )


def update_diary(day, evs, create):
    path = DIARY_DIR / f"{day.isoformat()}.md"
    if path.exists():
        raw = path.read_bytes().decode("utf-8")
        nl = "\r\n" if raw.count("\r\n") * 2 > raw.count("\n") else "\n"
        text = raw.replace("\r\n", "\n")
    elif create and evs:
        raw, nl, text = None, "\n", new_diary(day)
    else:
        return "跳过（没有日记文件）"

    changed = text
    if evs or marker("ncm")[2].search(changed):
        changed = upsert_music(changed, render_music(evs))
    line = ai_notes_line(day, changed)
    if line != "" and (line or marker("ai-notes")[2].search(changed)):
        changed = upsert_ai_notes(changed, line or "- 这天在 AI对话/ 里的笔记都已经在上面链接过了")

    out = changed.replace("\n", nl)
    if out == raw:
        return "没变化"
    path.parent.mkdir(parents=True, exist_ok=True)
    # 先写临时文件再替换，中途出错也不会把日记写坏一半
    tmp = path.with_name(path.name + ".tmp")
    try:
        with open(tmp, "w", encoding="utf-8", newline="") as f:
            f.write(out)
            f.flush()
            os.fsync(f.fileno())
        os.replace(tmp, path)
    finally:
        if tmp.exists():
            tmp.unlink()
    return f"已写入（{len(evs)} 首）" if raw is not None else f"新建（{len(evs)} 首）"


# ---------- 入口 ----------

def print_probe(by_source, notes):
    print("\n".join(notes))
    print()
    if not by_source:
        print("一条带时间的播放都没认出来；把上面的表名和列名，连同 scripts/ncm_diag.py 的输出发给寻寻")
        return
    for src, evs in by_source.items():
        evs = sorted(evs, key=lambda x: x["ts"])
        named = sum(1 for e in evs if e.get("name"))
        print(f"== {src}：{len(evs)} 条（{named} 条有歌名），从 {evs[0]['ts']} 到 {evs[-1]['ts']}")
        for e in evs[-5:]:
            print(f"   {e['ts']}  {e.get('name') or '?'} · {e.get('artists') or '?'}  (id {e['id']})")


def main():
    if sys.stdout is not None and hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(errors="replace")
    ap = argparse.ArgumentParser(description="网易云每日听歌写进日记")
    ap.add_argument("--probe", action="store_true", help="只看认到了哪些数据源，不写文件")
    ap.add_argument("--date", help="刷新指定日期的日记，格式 YYYY-MM-DD")
    ap.add_argument("--backfill", action="store_true", help="刷新记录里所有日期（只改已存在的日记）")
    ap.add_argument("--no-diary", action="store_true", help="只收集，不碰日记")
    args = ap.parse_args()

    by_source, notes = collect()
    if args.probe:
        print_probe(by_source, notes)
        return

    rows, added = merge_into_log(by_source)
    print(f"本次新记下 {added} 条，累计 {len(rows)} 条（{LOG.relative_to(VAULT).as_posix()}）")
    if args.no_diary:
        return

    if args.date:
        days, create = [date.fromisoformat(args.date)], True
    elif args.backfill:
        days, create = sorted({logical_day(parse_ts(e["ts"])) for e in rows}), False
    else:
        today = logical_day(datetime.now())
        days, create = [today - timedelta(days=1), today], True
    for d in days:
        print(f"{d}：{update_diary(d, day_events(rows, d), create)}")
    if ERR.exists():
        ERR.unlink()


if __name__ == "__main__":
    try:
        main()
    except Exception:
        # 计划任务用 pythonw 跑时看不到报错，写进文件
        DATA_DIR.mkdir(parents=True, exist_ok=True)
        ERR.write_text(f"{datetime.now():%Y-%m-%d %H:%M:%S}\n{traceback.format_exc()}", encoding="utf-8")
        raise
