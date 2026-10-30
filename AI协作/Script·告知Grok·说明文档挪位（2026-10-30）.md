---
tags: [AI协作, Script, Grok]
created: 2026-10-30
status: 启用·对话框为准
bridge: chat_dialog_only
---

# Script · 告知 Grok · 说明文档挪位（存档）

> **纪律一**：对人只从对话框复制下面 Script 块；本文件仅存档。用户 2026-10-30 定：这次只告知，不走 4.5 节的审查。

## 启用

已启用 · 2026-10-30 · 寻寻（本地 Claude Code）

## 存档正文（与对话块一致）

```text
Grok，告知一下，不用审查：

今天（2026-10-30）本地 Claude Code 改了库的结构，你之后看 diff 或读库时按新路径来：

1. 库根 9 篇说明文档挪进了 `说明文档/`（Claude API 计费、多设备与 Obsidian Sync、YOLO 改写与配置文档、本地助手 vs Obsidian Agent 分工等）。CLAUDE.md、DEEPSEEK.md、README.md、使用说明.md 里的路径跟着改了，下次 diff 里看到这几份规则文件有改动，就是这次挪文件引起的。
2. claude.ai 组织停用，数据导出迁到了本地：对话笔记在 `AI对话/`（属性 `来源: Claude`），原件在 `claude_data-2026-10-30/`，已加进 .gitignore，不会出现在 diff 里。
3. 新增脚本 `scripts/claude_to_notes.py` 和分类表 `scripts/claude_categories.txt`；`scripts/gen_file_index.py` 多排除了 `claude_data` 开头的文件夹。

回一句「收到」就行。
```

## 关联

- [[AI协作/跨AI全局环境变量（纪律一二）]]
