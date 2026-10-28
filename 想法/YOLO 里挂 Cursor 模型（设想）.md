---
tags: [想法, YOLO, Cursor]
created: 2026-10-28
---

# YOLO 里挂 Cursor 模型（设想）

用户 2026-10-28 设想：直接在 YOLO 里添加 Cursor 的模型。

## 结论（寻寻复核）

**不能按「下拉框加一个 Cursor 模型」这么办。**

原因：
1. Cursor 是**消费者**：自己调各家模型，或用订阅额度；**没有**对外开放的「OpenAI 兼容 chat/completions，把订阅模型借给 YOLO」入口。
2. YOLO 能加的是**提供商**（DeepSeek、Anthropic API、OpenRouter、OpenAI 兼容 Base URL 等），不是「Cursor 账号里的那个模型名」。
3. YOLO 桌面 CLI Agent 已支持 Claude Code / Codex / Hermes / Pi / Grok，**名单里没有 Cursor Agent CLI**；要接 Cursor 得改插件或另走 Cloud Agents API，不是设置里勾一下。
4. Cursor 公开的 Cloud Agents API（crsr_）是**跑 Agent 工作流**，不是给侧边栏当聊天补全接口；有第三方 Obsidian 插件在试，但和「YOLO 模型下拉」不是一回事。
5. 用抓包/会话 cookie 把 Cursor 订阅转发给 YOLO，属于灰区且易封号，不建议。

## 更贴学习目标的做法

| 目标 | 做法 |
|---|---|
| 学习 / 改代码 / 守库 | 继续在 **Cursor IDE** 里干（已定学习模式） |
| 笔记侧边栏便宜日常 | YOLO 继续 **DeepSeek** |
| YOLO 里也要 Claude 脑子 | 在 YOLO 加 **Anthropic 提供商 + Console API Key**（按 token 另计费，不是 Cursor 订阅额度） |
| 想在 Obsidian 里喊 Cursor | 看第三方 Cursor-Obsidian 插件或等 YOLO 官方加 CLI；别指望「加模型」 |

## 一句话

想用 Cursor 的能力，人去 Cursor；想用同一家模型，去那家的 API/提供商，不要指望把 Cursor 订阅当管道灌进 YOLO。
