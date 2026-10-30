---
tags: [AI协作, Script, DeepSeek]
created: 2026-10-30
status: 启用·对话框为准
bridge: chat_dialog_only
---

# Script · 告知 DeepSeek · 说明文档挪位与 Claude 数据迁移（存档）

> **纪律一**：对人只从对话框复制下面 Script 块；本文件仅存档。

## 启用

已启用 · 2026-10-30 · 寻寻（本地 Claude Code）

## 存档正文（与对话块一致）

```text
DeepSeek，同步一下库里今天（2026-10-30）的变动，请记进工作记忆，之后写路径按新的来：

1. 说明文档挪了位置。库根原来的 9 篇说明文档挪进了 `说明文档/` 文件夹：本地助手 vs Obsidian Agent 分工、YOLO 改写与配置文档、DeepSeek CLI + Obsidian 联动、Obsidian 内嵌 AI 插件 + DeepSeek 操作流程、多设备与 Obsidian Sync、Claude API 计费与 Opus 5.5 High 用法、Obsidian 查看改动历史功能、AI Agent 交互行为差异总结、新手README·搭一个AI知识库。根目录只留 README.md、CLAUDE.md、AGENTS.md、DEEPSEEK.md、使用说明.md、项目进度与待办.md、AI助手回复.md。DEEPSEEK.md 的 Project structure 一节已经改好。双链照常能用，写路径时要带 `说明文档/`。

2. claude.ai 组织已停用。用户把 claude.ai 的数据全部导出迁到了本地：78 个 Claude 对话转成笔记，放进 `AI对话/` 原来的 15 个分类（属性 `来源: Claude`），索引是 `AI对话/00 Claude 对话索引.md`。导出原件在 `claude_data-2026-10-30/`，不进 git；里面有邮箱、手机号和登录 IP，不要打开 users.json 和 login_history.json，也不要引用里面的内容。依赖这个组织的 claude.ai 网页版、Claude Desktop 和云端 Claude 会话都用不了了。

3. 顺带挪了几个散文件：`个人信息.md` → `私人/个人信息.md`；`聊天记录.txt` → `学校/辩论赛群聊记录（土木建院 10.24-10.29）.txt`；Claude Console 用量数据 → `账单/原始数据/`。

请你：确认已读，不用改文件。如果你自己的笔记或 Script 里有按根目录写的旧路径，列出来给我，寻寻这边再改。
```

## 关联

- [[AI对话/00 Claude 对话索引]]
- [[AI协作/跨AI全局环境变量（纪律一二）]]
