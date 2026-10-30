#!/usr/bin/env python3
"""Convert an unzipped claude.ai data export into categorized Obsidian notes.

Reads conversations.json, projects/ and artifacts/ from the export folder.
Writes one Markdown note per conversation into <out>/<category>/ (the same
folders the DeepSeek notes use, told apart by `来源: Claude`), project notes
into <out>/Claude 项目/, Claude Docs pages into <out>/Claude Artifacts/, and
an index note <out>/00 Claude 对话索引.md. Categories come from
claude_categories.txt, keyed by the first 8 characters of the chat uuid.

Only the user's questions, Claude's text answers, attachment names, pasted
text and the names of tools Claude called are kept; thinking, tool results
and injected system blocks are dropped. When a chat has edited or regenerated
branches, the most recent branch is followed. Times are Beijing time.
Subscription tokens and API keys in the text are masked.

Usage:
  python claude_to_notes.py <export_dir> --out DIR
"""
import argparse
import collections
import datetime
import glob
import json
import os
import re
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
DEFAULT_CATEGORY = "15 梗与杂谈"
INDEX_NAME = "00 Claude 对话索引.md"
PROJECT_DIR = "Claude 项目"
ARTIFACT_DIR = "Claude Artifacts"
ROOT_PARENT = "00000000-0000-4000-8000-000000000000"
SECRET_RES = [
    (re.compile(r"((?:token|key|secret|password|passwd)=)[A-Za-z0-9._\-]{8,}", re.I), r"\1***"),
    (re.compile(r"\bsk-[A-Za-z0-9_\-]{16,}"), "sk-***"),
]


def load_categories(path):
    mapping, order, current = {}, [], None
    with open(path, encoding="utf-8") as f:
        for line in f:
            line = line.split("#", 1)[0].strip() if not line.startswith("## ") else line.strip()
            if not line:
                continue
            if line.startswith("## "):
                current = line[3:].strip()
                order.append(current)
            elif current:
                mapping[line] = current
    return mapping, order


def safe_name(s, limit=60):
    s = re.sub(r'[\\/:*?"<>|#^\[\]\r\n\t]', " ", s)
    s = re.sub(r"\s+", " ", s).strip(" .")
    return s[:limit].rstrip(" .") or "无标题"


def redact(s):
    for rx, repl in SECRET_RES:
        s = rx.sub(repl, s)
    return s


def bj(ts):
    """ISO UTC timestamp -> naive Beijing datetime, or None."""
    if not ts:
        return None
    try:
        t = datetime.datetime.strptime(ts[:19], "%Y-%m-%dT%H:%M:%S")
    except ValueError:
        return None
    return t + datetime.timedelta(hours=8)


def main_path(msgs):
    """Follow the newest leaf back to the root; return (messages, branched)."""
    by_id = {m["uuid"]: m for m in msgs}
    kids = collections.Counter(m.get("parent_message_uuid") for m in msgs)
    branched = any(n > 1 for n in kids.values())
    if not branched:
        return sorted(msgs, key=lambda m: m.get("created_at", "")), False
    leaves = [m for m in msgs if kids[m["uuid"]] == 0]
    node = max(leaves, key=lambda m: m.get("created_at", ""))
    path, seen = [], set()
    while node and node["uuid"] not in seen:
        seen.add(node["uuid"])
        path.append(node)
        node = by_id.get(node.get("parent_message_uuid"))
    if path[-1].get("parent_message_uuid") != ROOT_PARENT:
        return sorted(msgs, key=lambda m: m.get("created_at", "")), False
    return path[::-1], True


def human_parts(m):
    texts, files, pasted, images = [], [], [], 0
    for x in m.get("content") or []:
        t = x.get("type")
        if t == "text" and x.get("text", "").strip():
            texts.append(x["text"])
        elif t == "document" and x.get("title"):
            files.append(x["title"])
        elif t == "image":
            images += 1
    for f in (m.get("files") or []) + (m.get("attachments") or []):
        name = f.get("file_name")
        if name:
            files.append(name)
        if f.get("extracted_content", "").strip():
            pasted.append((name or "粘贴的文本", f["extracted_content"]))
    files = list(dict.fromkeys(files))
    named_images = sum(1 for n in files if re.search(r"\.(png|jpe?g|gif|webp)$", n, re.I))
    files += ["图片"] * max(0, images - named_images)
    return "\n\n".join(texts), files, pasted


def assistant_parts(m):
    texts, tools = [], collections.Counter()
    for x in m.get("content") or []:
        t = x.get("type")
        if t == "text" and x.get("text", "").strip():
            texts.append(x["text"])
        elif t == "tool_use" and x.get("name"):
            tools[x["name"]] += 1
    return "\n\n".join(texts), tools


def merge_rounds(msgs):
    """Group into rounds: one human turn (text, files, pasted text), then Claude's answer."""
    rounds, cur = [], None

    def new_round(ts):
        r = {"q": [], "files": [], "pasted": [], "a": [], "tools": collections.Counter(),
             "time": bj(ts), "answered": False}
        rounds.append(r)
        return r

    for m in msgs:
        if m.get("sender") == "human":
            text, files, pasted = human_parts(m)
            if not (text or files or pasted):
                continue  # tool approvals and empty turns
            if cur is None or cur["answered"]:
                cur = new_round(m.get("created_at"))
            if text:
                cur["q"].append(text)
            cur["files"] += [f for f in files if f not in cur["files"]]
            cur["pasted"] += pasted
        else:
            text, tools = assistant_parts(m)
            if not (text or tools):
                continue
            if cur is None:
                cur = new_round(m.get("created_at"))
            if text:
                cur["a"].append(text)
            cur["tools"].update(tools)
            cur["answered"] = True
    return rounds


def callout(title, body):
    lines = [f"> [!quote]- {title}"]
    lines += ["> " + ln if ln else ">" for ln in body.strip().splitlines()]
    return "\n".join(lines)


def render_chat(chat, category, rounds):
    fm = [
        "---", "tags:", "  - AI对话",
        f"分类: {category[3:]}",
        f"created: {chat['created']}",
        f"updated: {chat['updated']}",
        "来源: Claude",
        f"claude_id: {chat['id']}",
        f"轮数: {len(rounds)}", "---", "",
    ]
    body = [f"# {chat['display_title']}", ""]
    note = (f"> 从 claude.ai 导出的对话（2026-10-30 导出），{chat['created']}，共 {len(rounds)} 轮，时间是北京时间。"
            "只保留了问答原文和附件名，思考过程、工具返回结果已去掉，图片和文件本身不在导出里。")
    if chat["branched"]:
        note += "这个对话有改写或重新生成过的分支，这里只收了最后一版。"
    body += [note, ""]
    first_day = rounds[0]["time"].date() if rounds and rounds[0]["time"] else None
    for i, r in enumerate(rounds, 1):
        t = r["time"]
        stamp = ""
        if t:
            stamp = t.strftime("%H:%M") if t.date() == first_day else t.strftime("%m-%d %H:%M")
        body += [f"## 第 {i} 轮" + (f"（{stamp}）" if stamp else ""), ""]
        if r["files"]:
            body += ["（附件：" + "、".join(r["files"]) + "）", ""]
        for name, content in r["pasted"]:
            body += [callout(f"粘贴的内容：{name}", redact(content)), ""]
        body += ["**我**：", "", redact("\n\n".join(r["q"])).strip() or "（无文字）", ""]
        body += ["**Claude**：", "", redact("\n\n".join(r["a"])).strip() or "（没有文字回答）", ""]
        if r["tools"]:
            used = "、".join(f"{k}×{v}" if v > 1 else k for k, v in r["tools"].items())
            body += [f"*（这一轮 Claude 调用了工具：{used}）*", ""]
    return "\n".join(fm + body)


def vault_rel(path, out):
    """Path relative to the vault root (the parent of --out), with forward slashes."""
    return os.path.relpath(path, os.path.dirname(out)).replace("\\", "/")


def write_file(path, text):
    with open(path, "w", encoding="utf-8", newline="\n") as f:
        f.write(text.rstrip("\n") + "\n")


def export_projects(src, out):
    """One note per project with instructions or docs; returns index rows."""
    folder = os.path.join(out, PROJECT_DIR)
    rows = []
    for p in sorted(glob.glob(os.path.join(src, "projects", "*.json"))):
        with open(p, encoding="utf-8") as f:
            d = json.load(f)
        name = (d.get("name") or "").strip() or "未命名项目"
        created = (d.get("created_at") or "")[:10]
        docs = d.get("docs") or []
        prompt = (d.get("prompt_template") or "").strip()
        link = ""
        if prompt or docs:
            pdir = os.path.join(folder, safe_name(name))
            os.makedirs(pdir, exist_ok=True)
            lines = ["---", "tags:", "  - AI对话", "  - Claude项目", f"created: {created}",
                     f"claude_project_id: {d.get('uuid', '')}", "---", "",
                     f"# {name}", "",
                     f"> claude.ai 里的 Project（2026-10-30 导出），{created} 建。",
                     "> 导出里没有记录哪些对话属于这个项目。", ""]
            if d.get("description"):
                lines += ["**说明**：" + d["description"], ""]
            if prompt:
                lines += ["## 项目指令", "", "```text", redact(prompt), "```", ""]
            if docs:
                lines += ["## 项目资料", ""]
                for doc in docs:
                    fn = safe_name(os.path.splitext(os.path.basename(doc.get("filename") or "资料"))[0])
                    write_file(os.path.join(pdir, fn + ".md"), redact(doc.get("content") or ""))
                    lines.append(f"- [[{PROJECT_DIR}/{safe_name(name)}/{fn}|{fn}]]")
                lines.append("")
            write_file(os.path.join(pdir, "00 项目说明.md"), "\n".join(lines))
            link = f"[[{PROJECT_DIR}/{safe_name(name)}/00 项目说明\\|打开]]"
        rows.append((created, name, d.get("description") or "", len(docs), link))
    return rows


def export_artifacts(src, out):
    """Claude Docs pages become notes; HTML artifacts stay in the archive. Returns index rows."""
    folder = os.path.join(out, ARTIFACT_DIR)
    rows = []
    for p in sorted(glob.glob(os.path.join(src, "artifacts", "*", "artifact.json"))):
        adir = os.path.dirname(p)
        with open(p, encoding="utf-8") as f:
            a = json.load(f)
        vers = {v["id"]: v for v in a.get("versions", [])}
        v = vers.get(a.get("active_version")) or (a.get("versions") or [{}])[0]
        title = v.get("title") or "无标题"
        when = bj(v.get("created_at"))
        date = when.strftime("%Y-%m-%d") if when else ""
        page = os.path.join(adir, "page.md")
        if a.get("kind") == "page" and os.path.exists(page):
            os.makedirs(folder, exist_ok=True)
            fn = safe_name(f"{date} {title}")
            with open(page, encoding="utf-8") as f:
                content = f.read()
            head = ["---", "tags:", "  - AI对话", "  - Claude文档", f"created: {date}",
                    f"claude_artifact_id: {a.get('id', '')}", "---", "",
                    f"> claude.ai 里的 Claude Docs 文档（2026-10-30 导出），共 {len(vers)} 个版本，这里是当前版本。", ""]
            if os.path.exists(os.path.join(adir, "comments.json")):
                head += [f"> 评论原件在 `{vault_rel(os.path.join(adir, 'comments.json'), out)}`。", ""]
            write_file(os.path.join(folder, fn + ".md"), "\n".join(head) + redact(content))
            where = f"[[{ARTIFACT_DIR}/{fn}\\|打开]]"
            desc = f"Claude Docs 文档，{len(vers)} 个版本"
        else:
            html = glob.glob(os.path.join(adir, "versions", "*.html"))
            where = "`" + vault_rel(html[0], out) + "`" if html else "（没有文件）"
            desc = v.get("description") or ""
        rows.append((date, title, desc, a.get("visibility", ""), where))
    return rows


def cell(s):
    return s.replace("|", "｜").replace("\n", " ")


def write_index(out, cat_order, index, skipped, projects, artifacts):
    total = sum(len(v) for v in index.values())
    months = collections.Counter(item[0][:7] for v in index.values() for item in v)
    lines = [
        "---", "tags:", "  - AI对话", "  - 索引", "---", "",
        "# Claude 对话索引", "",
        f"> 共 {total} 个对话，从 claude.ai 导出（2026-10-30，组织停用前最后一次导出）后由 "
        "`scripts/claude_to_notes.py` 转成笔记，分类表在 `scripts/claude_categories.txt`。"
        "笔记和 DeepSeek 对话放在同一套分类文件夹里，属性 `来源: Claude` 的就是这批。"
        "原始导出在库根 `claude_data-2026-10-30/`（不进 git）。DeepSeek 的索引见 [[00 总索引]]。",
        "",
    ]
    if skipped:
        lines += [f"> 另有 {len(skipped)} 个对话是空的（没有任何文字），没有转成笔记："
                  + "、".join(skipped) + "。", ""]
    lines += ["## 分类一览", "", "| 分类 | 数量 |", "| --- | --- |"]
    for cat in cat_order:
        if index.get(cat):
            lines.append(f"| [[#{cat}]] | {len(index[cat])} |")
    lines += ["", "## 按月份", "", "| 月份 | 数量 |", "| --- | --- |"]
    for m in sorted(months):
        lines.append(f"| {m or '未知'} | {months[m]} |")
    for cat in cat_order:
        items = index.get(cat)
        if not items:
            continue
        lines += ["", f"## {cat}", "", "| 日期 | 对话 | 轮数 |", "| --- | --- | --- |"]
        for date, name, title, n in sorted(items):
            lines.append(f"| {date} | [[{name}\\|{cell(title)}]] | {n} |")
    lines += ["", "## Claude 项目", "", "| 建立 | 项目 | 说明 | 资料数 | 笔记 |", "| --- | --- | --- | --- | --- |"]
    for created, name, desc, ndocs, link in sorted(projects):
        lines.append(f"| {created} | {cell(name)} | {cell(desc)} | {ndocs} | {link or '（空项目）'} |")
    lines += ["", "## Artifacts", "",
              "> Claude Docs 文档转成了笔记；HTML 页面（每日 Morning Brief、币圈生存实验室）Obsidian 打不开，"
              "原件留在导出文件夹，用浏览器打开对应路径。", "",
              "| 日期 | 标题 | 说明 | 可见性 | 位置 |", "| --- | --- | --- | --- | --- |"]
    for date, title, desc, vis, where in sorted(artifacts):
        lines.append(f"| {date} | {cell(title)} | {cell(desc)} | {vis} | {where} |")
    write_file(os.path.join(out, INDEX_NAME), "\n".join(lines))
    return total


def vault_names(root):
    names = set()
    for dp, dns, fns in os.walk(root):
        dns[:] = [d for d in dns if not d.startswith(".") and d != "node_modules"]
        names.update(os.path.splitext(f)[0] for f in fns if f.endswith(".md"))
    return names


def main():
    ap = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    ap.add_argument("export_dir")
    ap.add_argument("--out", required=True)
    ap.add_argument("--categories", default=os.path.join(HERE, "claude_categories.txt"))
    args = ap.parse_args()
    out = os.path.abspath(args.out)

    for p in (os.path.join(out, INDEX_NAME), os.path.join(out, PROJECT_DIR), os.path.join(out, ARTIFACT_DIR)):
        if os.path.exists(p):
            sys.exit(f"already exists, refusing to overwrite: {p}")

    cat_map, cat_order = load_categories(args.categories)
    if DEFAULT_CATEGORY not in cat_order:
        cat_order.append(DEFAULT_CATEGORY)
    with open(os.path.join(args.export_dir, "conversations.json"), encoding="utf-8") as f:
        convs = json.load(f)

    taken = vault_names(os.path.dirname(out))
    unmatched, skipped, index = [], [], collections.defaultdict(list)
    for c in sorted(convs, key=lambda x: (x.get("created_at", ""), x["uuid"])):
        msgs, branched = main_path(c.get("chat_messages") or [])
        rounds = merge_rounds(msgs)
        title = (c.get("name") or "").strip()
        created = bj(c.get("created_at"))
        date = created.strftime("%Y-%m-%d") if created else ""
        if not rounds:
            skipped.append(f"{date} {title or '无标题'}")
            continue
        title = title or safe_name("\n".join(rounds[0]["q"]), 24)
        category = cat_map.get(c["uuid"][:8])
        if category is None:
            category = DEFAULT_CATEGORY
            unmatched.append(f"{c['uuid'][:8]} {title}")
        updated = bj(c.get("updated_at"))
        chat = {"id": c["uuid"], "display_title": title, "branched": branched, "created": date,
                "updated": updated.strftime("%Y-%m-%d") if updated else date}
        base = f"{date} {safe_name(title)}"
        name = base if base not in taken else f"{base} {c['uuid'][:8]}"
        taken.add(name)
        folder = os.path.join(out, category)
        os.makedirs(folder, exist_ok=True)
        write_file(os.path.join(folder, name + ".md"), render_chat(chat, category, rounds))
        index[category].append((date, name, title, len(rounds)))

    projects = export_projects(args.export_dir, out)
    artifacts = export_artifacts(args.export_dir, out)
    total = write_index(out, cat_order, index, skipped, projects, artifacts)
    print(f"wrote {total} chat notes, {sum(1 for p in projects if p[4])} project notes, "
          f"{sum(1 for a in artifacts if '[[' in a[4])} doc notes into {out}; skipped {len(skipped)} empty chats")
    for cat in cat_order:
        if index.get(cat):
            print(f"  {cat}: {len(index[cat])}")
    if unmatched:
        print(f"{len(unmatched)} chats not in category table (put into {DEFAULT_CATEGORY}):")
        for t in unmatched:
            print("   ", t)


if __name__ == "__main__":
    main()
