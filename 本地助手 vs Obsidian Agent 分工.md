---
tags:
  - 说明
  - AI助手
  - Claude
  - 费用
updated: 2026-10-15
---

# 本地助手 vs Obsidian Agent 分工

> 本文整理这个库里能用的几个 AI 助手：它们的区别、费用去向，以及各自适合做什么，方便以后随时查。
> 初版由 deepseek-v4-pro 写成，2026-10-15 由 YOLO Agent（Claude）补充了 Claude 全家（终端 Claude Code、Claude Desktop、Claude API）的内容；同日由本地 Claude Code 联网核实，来源见文末「核实记录」。
> 相关文档：[[使用说明]]（第 4、5.6、7 节）、[[DeepSeek CLI + Obsidian 联动]]、`CLAUDE.md`。

## 零、先分清三件事：在哪跑、用什么模型、钱记在哪

很多混乱来自把这三件事当成一件事。

| 概念 | 意思 | 例子 |
|---|---|---|
| **外壳（在哪跑）** | 决定它**能碰到什么**：笔记、文件、终端、网络 | Obsidian 侧边栏、PowerShell 终端、Claude Desktop 窗口 |
| **模型（大脑）** | 决定它**有多聪明**、单价多少 | `deepseek-v4-pro`、`claude-opus-5-5` |
| **账单（钱记在哪）** | 由**登录方式**决定，不由外壳决定 | DeepSeek 账户、Anthropic API（Console）、Claude 订阅 |

- 同一个 Claude 模型，装在不同外壳里，能力边界完全不同：在 Desktop 里不能跑命令，在 Claude Code 里可以。
- 同一个外壳也能换模型、换账单。例如 YOLO Agent 可以选 DeepSeek，也可以选 Claude；Claude Code 可以用订阅登录，也可以用 API 登录。

## 一、全部成员一览

用户点名的是四个：**我（YOLO Agent）、终端 Claude Code、Claude Desktop、Claude API**。为了完整，把库里涉及的其他几个也列在下面。

| 成员 | 在哪 | 怎么打开 | 模型 | 钱记在哪 | 能碰本地文件吗 | 启动时自动读的规则 |
|---|---|---|---|---|---|---|
| **YOLO Agent（我）** | Obsidian 侧边栏，顶部选「Agent」 | 点左侧 YOLO 图标 | 下拉框里选：DeepSeek 或 Claude | 选 DeepSeek → DeepSeek 账户；选 Anthropic 提供商的 Claude → **API**；选 Claude OAuth 提供商 → **订阅**（⚠️ Anthropic 不允许，见下文） | Ask / Agent 模式：只能碰库内文件；Max 模式（只限桌面端）：能碰任意文件 | `YOLO/memory/` 和助手设置。**不会自动读 `CLAUDE.md`** |
| **终端 Claude Code** | PowerShell | 在库目录里运行 `claude` | Claude | 用订阅登录 → **订阅**；用 Console 账号或 API Key 登录 → **API** | ✅ 全部 | `CLAUDE.md` |
| **Claude Desktop** | Windows 桌面应用 | 开始菜单 → Claude | Claude | **订阅**（和 claude.ai 网页、手机 App 是同一个账号） | Chat 标签页：默认不能，配置 MCP 以后可以；Code 标签页：✅（就是 Claude Code） | Chat：自己的「项目」说明和记忆；Code：同 Claude Code |
| **Claude API** | 本身没有界面 | 由别的程序调用：YOLO、脚本、Console 里的 Workbench | Claude | **API**（Console 预充值，按 token 扣费） | 取决于调用它的程序 | 无，调用方给什么它看什么 |
| deepseek-cli | PowerShell | 在库目录里运行 `deepseek` | 只能用 DeepSeek | DeepSeek 账户 | ✅ 全部 | `DEEPSEEK.md`、`CLAUDE.md`、`AGENTS.md` |
| YOLO 的 CLI 运行时 | Obsidian 侧边栏，顶部选「CLI」 | 切到 CLI，再选 Claude Code | Claude（其实就是本机的 Claude Code） | 同终端 Claude Code | ✅ | 同 Claude Code |
| 云端 Claude Code | 浏览器 claude.ai/code | 网页登录 | Claude | **订阅** | ❌ 只能碰 GitHub 上的仓库 | 仓库里的 `CLAUDE.md` |

## 二、四个 Claude 相关成员详解

### 1. 我：Obsidian 里的 YOLO Agent

**是什么**：Obsidian 里的 AI 侧边栏，也就是 YOLO (XOX) 插件。我是一个"外壳"，用哪个模型、钱记在哪，都看输入框旁边的模型下拉框。

**能做**
- **语义搜索笔记**（需要先建好知识库）：能处理"讲时间消磨的那篇"这种模糊查询。
- 知道你**当前打开的是哪篇笔记、选中了哪段文字**，可以直接在上面改。改之前会先给出 diff 让你确认。
- 读写库里的笔记，可以批量查找和移动文件。我有一个虚拟 shell，但只能用 `grep`、`find`、`mv`、`rm` 这一类命令。
- 联网搜索、读网页，能看图片和 PDF。
- 通过 `YOLO/memory/` 跨对话记住你的偏好。
- 手机上的 Obsidian 也能用（Max 模式除外）。

**不能做（Ask / Agent 模式下）**
- 不能跑真正的程序，比如 `npm run build`、`git`、`deepseek`、`claude`。2026-10-14 尝试在这里启动 deepseek-cli 就失败了，原因正是这个。
- 不能操作 Obsidian 的界面，比如重新加载插件。
- **Max 模式**（只限桌面端）可以用真实终端、读写库外的文件，但权限大，慎用。

**费用**
- 选 `deepseek-v4-pro` / `deepseek-v4-flash`：记在 DeepSeek 账户，最便宜。
- 选 Anthropic 提供商的 Claude 模型：按 API 计费，记在 Anthropic Console。
- 选 Claude OAuth 提供商：消耗 Claude 订阅额度。**但 Anthropic 明确不允许这样用**：官方写明不允许第三方应用提供 claude.ai 登录，也不允许通过 Free / Pro / Max 订阅凭据转发请求，第三方应该用 Console 的 API Key（[Claude Code 法律与合规页](https://code.claude.com/docs/en/legal-and-compliance)）。所以**在 YOLO 里用 Claude，请走 Anthropic 提供商 + API Key**，不要用 Claude OAuth 提供商。
- ⚠️ YOLO **每轮要发 4 万～13 万 token**（系统提示、工具目录、当前笔记、记忆、历史都带上）。所以同一个模型，在 YOLO 里用比在终端里用更费钱。粗估每轮输入按 10 万 token 算：
  - `deepseek-v4-pro`：约 $0.04
  - `claude-opus-5-5` 没命中缓存：约 $0.40；全部命中提示缓存（$0.20 / 百万 token）：约 $0.02，再加上输出费用和首次写入缓存的费用
  - 所以**提示缓存一定要开着**，换话题就开新对话。

**用法**
- 日常记笔记、改稿、按意思找旧笔记 → 选 DeepSeek。
- 卡住的难题、需要高质量长文 → 在下拉框里临时切到 `claude-opus-5-5`，用完再切回来。
- 想让我遵守某条规则：写进 `YOLO/memory/` 或助手设置里。光写在 `CLAUDE.md` 里我不会自动看到。

### 2. 终端里的 Claude Code

**是什么**：Anthropic 官方的命令行编程助手。在库目录里运行 `claude`，它就把整个仓库当作项目来处理，启动时自动读 `CLAUDE.md`。

**能做**：凡是你在 PowerShell 里能做的，它基本都能做。
- 改 YOLO 插件源码，并跑 `npm run build`、`type:check`、`lint:check`、`test`，能看到真实报错。
- `git pull`、提交、看 diff，处理 `AI协作/交接日志.md` 的收发。
- 批量处理笔记：统一加 frontmatter、重命名、查找替换。
- 装依赖、排查环境、联网调研、读图片。
- 通过 MCP 接上 YOLO 的「外部 Agent 接入」，做全库语义检索。**本库已经接好**：Claude Code 和 deepseek-cli 读的是库根目录同一个 `.mcp.json`（格式见 [[YOLO 改写与配置文档]] 7.2 节），启动后会出现 `mcp__yolo__vault_search` 等工具。前提是 Obsidian 开着、YOLO 的「外部 Agent 接入」打开着。第一次使用时 Claude Code 会问你是否信任这个项目里的 MCP 服务器。2026-10-15 已实测语义检索能返回结果。

**不能做**
- 看不到你在 Obsidian 里打开了哪篇、选中了什么。
- 不能点 Obsidian 的界面。改完插件要你自己重新加载。
- 语义搜索要靠上面的 MCP。Obsidian 没开或 YOLO 的「外部 Agent 接入」关着时，只能按关键词 `grep`。

**费用**（看登录方式）
- **用 Claude 订阅登录**（Pro / Max）：不额外花钱，但消耗订阅额度。额度和 Claude Desktop、claude.ai 网页、手机 App **是共享的**，官方原话是两边的所有使用都计入同一份限额。限额分两层：每 5 小时一个会话限额，外加每周限额。用完要等重置。
- **用 Console 账号或 API Key 登录**：按 token 计费。Claude Code 一个任务往往要来回调用很多次模型，一个复杂任务花几美元并不罕见。
- ⚠️ **不要设置 `ANTHROPIC_API_KEY` 环境变量**（见 `CLAUDE.md` 规则 2）。官方文档写明：有订阅、同时又设置了这个变量时，Claude Code 会问你一次要不要用这个 Key，**你点了同意，以后就一直按 API 计费**；用 `claude -p` 非交互运行时，不问直接用 Key。想改回订阅：删掉这个环境变量，或在 `/config` 里关掉「Use custom API key」。
- 在 Claude Code 里输入 `/status`，能看到版本、模型和账号信息，其中「Login method」一行就是当前的登录方式。

**用法**
```powershell
cd "C:\Users\XW\source\Obsidian Default Repo"
git pull
claude
```
然后直接用中文说任务，例如"处理交接日志里的待办"或"把插件的某某功能改成……然后跑一遍检查"。

**YOLO 的 CLI 运行时**：在 Obsidian 侧边栏顶部切到「CLI」，选 Claude Code，等于在 Obsidian 里开了一个 Claude Code，费用同上。这个模式下问"你是谁"会回答 Claude，这是正常的。

### 3. Claude Desktop

**是什么**：Anthropic 官方的桌面应用，和 claude.ai 网页、手机 App 用同一个账号，对话互相同步。顶部有三个标签页：**Chat**（聊天）、**Cowork**、**Code**（Claude Code）。下面说的主要是 Chat；Code 标签页另见本节末尾。

**能做**
- 长篇讨论、头脑风暴、写作，可以上传图片、PDF、文档，可以联网搜索。
- **项目（Projects）**：把一组资料和固定说明放在一起，以后在这个项目里聊天都会带上它们。
- **Artifacts**：生成可以预览的文档、代码、图表。
- **接本地 MCP 服务器**，接上以后可以读写指定的本地文件夹（例如把库目录交给它）。两种方式：
  - **扩展**（简单）：设置 → Extensions → Browse extensions，点安装；自己的 `.mcpb` 扩展包在 Extension Developer 里用「Install Extension…」装。
  - **手写配置文件**：设置 → Developer → Edit Config，打开 `%APPDATA%\Claude\claude_desktop_config.json`，按 `mcpServers` 格式填写，保存后重启 Desktop。
  - 配置文件里如果有 token，**不要提交到仓库，也不要复制进库里**。本库尚未配置。
- **Code 标签页**：桌面版自带的 Claude Code，每个会话对应一个项目文件夹，可以在本机（Local）、云端、SSH 或 WSL 上跑。需要付费订阅（Pro / Max / Team / Enterprise）。能力和费用同上面的 Claude Code。它会读取上面那个 `claude_desktop_config.json` 里的 MCP 服务器；终端里的 `claude` 不读这个文件，读的是库里的 `.mcp.json`。

**不能做（Chat 标签页，不配置 MCP 时）**
- 看不到库里的文件，只能你手动上传或粘贴。
- 不能跑命令、不能 git、不能构建。
- 不知道你在 Obsidian 里打开了什么。

**费用**
- **订阅制**：Free / Pro / Max。固定月费，在用量限额内不另外收费。官方价格页（2026-10-15 查）：
  - Free：$0。
  - Pro：按月付 $20/月；按年付合 $17/月（一次付 $200）。
  - Max：分 5x 和 20x 两档，官方页写「From $100」每月起，**只能按月付**。20x 档常见的说法是 $200/月，但官方页上没查到明确标价，**未核实**，升级前在 claude.ai 的升级页面看实际价格。
  - 来源：<https://claude.com/pricing>
- **订阅和 API 是两套完全独立的账单**：订阅里不包含 API 额度，Console 里充的钱也不能给 Desktop 用。
- 用量在 claude.ai → 设置 → 用量里查看。

**用法**：适合"不需要碰文件、只想和 Claude 好好聊"的场景。而且是固定月费，聊长了也不会多花钱。

### 4. Claude API

**是什么**：没有界面的"裸模型"。别的程序把文字发给它，它返回结果。在 [Claude Console](https://console.anthropic.com) 创建 API Key、充值，按 token 计费。

**谁在用它**
- YOLO Agent 里的 **Anthropic 提供商**，配置方法见 [[使用说明]] 第 5.6 节。
- 用 Console 账号或 API Key 登录的 Claude Code。
- 你自己写的脚本，或 Console 里的 Workbench（网页上直接测试提示词）。

**价格**（每百万 token，输入 / 输出，2026-10-15 核对过[官方价格文档](https://platform.claude.com/docs/en/about-claude/pricing)，和 [[使用说明]] 5.6 节一致）

| 模型 | 调用 ID | 价格 | 用途 |
|---|---|---|---|
| Claude Haiku 5.5 | `claude-haiku-5-5` | $0.10 / $0.50（单次输入超过 10 万 token 时涨到 $0.50 / $2.50） | 最便宜：对话命名、Tab 补全、简单问答 |
| Claude Sonnet 5.5 | `claude-sonnet-5-5` | $2 / $10 | 日常主力 |
| Claude Opus 5.5 | `claude-opus-5-5` | $4 / $20 | 默认推荐：难的推理、长文、复杂整理 |
| Claude Fable 5.1 | `claude-fable-5-1` | $10 / $50 | 最强最贵，只在最难的任务上用 |
| 对比：`deepseek-v4-pro` | — | 约 $0.435 / $0.87 | 比 Opus 便宜一个数量级 |

**注意**
- 提示缓存命中以后，重复部分按原价的一小部分计：Opus 5.5 是 $0.20、Sonnet 5.5 是 $0.10 / 百万 token，**一定要开着**。
- 在 Console 里给 Key **设置月度上限**，防止意外超支。
- Key 只填进 YOLO 的设置里。不要发到聊天里、不要截图、不要写进库里的任何文件。

**用法**：一般不直接"用"它，而是通过 YOLO 或 Claude Code 间接使用。只有写自动化脚本时，才会自己调用。

## 三、费用总览：钱到底记在哪三个地方

| 账单 | 计费方式 | 哪些用法记在这里 | 去哪查 |
|---|---|---|---|
| **DeepSeek 账户** | 按 token，最便宜 | YOLO Agent 选 DeepSeek 模型、deepseek-cli | <https://platform.deepseek.com/usage> |
| **Anthropic API（Console）** | 按 token，预充值 | YOLO Agent 选 Anthropic 提供商的 Claude 模型；Claude Code 用 Console 账号或 API Key 登录；自己写的脚本 | <https://console.anthropic.com> |
| **Claude 订阅（claude.ai 账号）** | 固定月费 + 用量限额 | Claude Desktop、claude.ai 网页和手机 App；用订阅登录的 Claude Code（终端、Desktop 的 Code 标签页、YOLO 的 CLI 运行时、云端 claude.ai/code）；YOLO Agent 选 Claude OAuth 提供商（Anthropic 不允许，别用） | claude.ai → 设置 → 用量 |

**最容易踩的坑**
1. 以为买了 Pro 订阅，API 就不要钱了。**并不是**，两套账单互相独立。
2. 设置了 `ANTHROPIC_API_KEY` 环境变量，Claude Code 弹窗问要不要用这个 Key 时随手点了同意，从此由订阅变成了按 API 计费。
3. 在 YOLO 里长对话一直用 Opus：每轮几万 token，加起来很快。换话题就开新对话，打开自动压缩，日常切回 DeepSeek。
4. 订阅额度共享（官方已确认）：在 Desktop 或网页里聊多了，Claude Code 能用的额度也会变少，反过来也一样。
5. YOLO 顶部选了「CLI」以后，用的是 Claude Code 的账号，不是 DeepSeek。想用 DeepSeek 要切回「Agent」。

**省钱口诀**：日常用 DeepSeek；想和 Claude 长聊用订阅（Desktop / Claude Code）；只有在 YOLO 里需要 Claude 时才走 API，而且要开着缓存。

## 四、能力对比

| 能力 | YOLO Agent（我） | 终端 Claude Code | Claude Desktop | deepseek-cli |
|---|---|---|---|---|
| 按意思搜索笔记（语义检索） | ✅ | ✅ 已接 YOLO 的 MCP | ⚠️ 要接 MCP | ✅ 已接 YOLO 的 MCP |
| 知道当前打开的笔记和选中文字 | ✅ | ❌ | ❌ | ❌ |
| 读写库里的文件 | ✅ 先给 diff 再确认 | ✅ | ⚠️ 要接 MCP | ✅ |
| 读写库外的文件 | ⚠️ 只有 Max 模式 | ✅ | ⚠️ 要接 MCP | ✅ |
| 跑命令、构建、测试 | ⚠️ 只有 Max 模式 | ✅ | ❌（Code 标签页可以） | ✅ |
| git | ⚠️ 只有 Max 模式 | ✅ | ❌（Code 标签页可以） | ✅ |
| 联网 | ✅ | ✅ | ✅ | ✅ |
| 看图片 / PDF | ✅ | ✅ | ✅ | ⚠️ 有限：PDF、Word、PPT、Excel 只提取文字；DeepSeek 模型看不了图片，图片和扫描件只能 OCR 出文字，而且要另装 `tesseract.js`（本机未装） |
| 手机上能用 | ✅（Obsidian 移动端） | ❌（云端版可以） | ✅（手机 App） | ❌ |
| 操作 Obsidian 界面 | ❌ | ❌ | ❌ | ❌ |
| 可用的模型 | DeepSeek + Claude | 只有 Claude | 只有 Claude | 只有 DeepSeek |

> 表里的"⚠️ 要接 MCP"指技术上可以做到，但需要自己配置。本库目前配置了 YOLO 的 MCP（库根目录的 `.mcp.json`），终端 Claude Code 和 deepseek-cli 共用；Claude Desktop 还没配置。语义检索要求 Obsidian 开着。
> 表里的 Claude Desktop 一列指 Chat 标签页；Code 标签页的能力同终端 Claude Code。

## 五、适合交给「本地助手」的活（终端 Claude Code / deepseek-cli）

**核心原则：凡是要动到"文件系统之外的东西"（构建、测试、git、网络上的工具），只有本地助手能做。**

- 改 YOLO 插件源码（TypeScript / React），改完跑 `npm run build`、`type:check`、`lint:check`、`test` 验证，看到真实报错。
- 批量处理文件：给一堆笔记统一加 frontmatter、重命名、查找替换。
- git 操作：提交、看 diff、处理 `AI协作/交接日志.md` 的收发。
- 跑命令、装依赖、排查环境问题。
- 读代码、查文档、联网调研。

**两个本地助手怎么选**
- 简单、量大、预算敏感 → **deepseek-cli**：便宜，每轮只发 3 千～1.1 万 token。
- 难、要求高质量、改插件代码 → **Claude Code**：用订阅登录就不额外花钱。

## 六、适合交给「Obsidian 里的 YOLO Agent」的活

**核心原则：凡是要在 Obsidian 里、基于笔记内容、就地完成的活，它更顺手。**

- 语义检索笔记（RAG 搜索）：找"讲时间消磨的那篇"这种模糊查询，而不是关键词。
- 在当前笔记上就地改写：你正打开一篇稿子，选中一段让它改，它知道上下文和你选中的内容。
- 基于整个库的问答和整理：比如"把我所有关于《三日间的幸福》的笔记汇总一下"。
- 日常的侧边栏聊天、随手记笔记。
- 中等规模的笔记整理：查找、移动、改几篇文件，每处改动都有 diff 让你确认。
- 在手机上用 AI 处理笔记。

## 七、适合交给「Claude Desktop」的活

**核心原则：不需要碰库里的文件，只想和 Claude 好好聊，又不想按 token 付钱。**

- 长时间讨论一个想法、规划方案、头脑风暴。
- 读一份外部的 PDF 或文章并讨论（直接上传）。
- 写长文的初稿，写好以后再贴进 Obsidian，交给 YOLO Agent 润色和归档。
- 在手机上继续电脑上的对话。

## 八、直接用「Claude API」的场景

- 在 YOLO 里需要 Claude 的能力时（这就是在用 API）。
- 写自动化脚本，例如定时把某个文件夹里的笔记总结一遍。
- 在 Console 的 Workbench 里调试提示词。
- 其他时候，订阅（Desktop / Claude Code）通常更划算。

## 九、按任务选人（速查）

| 我想…… | 找谁 | 为什么 |
|---|---|---|
| 写笔记、改当前这篇的某段 | YOLO Agent + DeepSeek | 知道选中内容，便宜 |
| 找一篇记不清标题的旧笔记 | YOLO Agent | 语义检索 |
| 改 YOLO 插件代码 | 终端 Claude Code | 要构建和测试；改完要你在 Obsidian 里重新加载插件 |
| 批量给 200 篇笔记加 frontmatter | deepseek-cli 或 Claude Code | 直接操作文件系统，还能顺手 git 提交留档 |
| 处理交接日志、git 提交推送 | 终端 Claude Code | 本地 git，规则写在 `CLAUDE.md` 里 |
| 一个很难的问题，想要高质量回答 | Claude Desktop（订阅）或 YOLO 切到 Opus（API） | 想省钱用前者，需要结合库里的笔记用后者 |
| 和 Claude 长时间聊一个想法 | Claude Desktop | 固定月费，不按 token 计 |
| 改不依赖本地环境的代码或文档，开 PR | 云端 Claude Code（claude.ai/code） | 只碰 GitHub，见 `CLAUDE.md` 第 4 节 |
| 写自动化脚本调用 AI | Claude API 或 DeepSeek API | 程序调用 |
| 在手机上处理笔记 | YOLO Agent（Obsidian 移动端） | 其他本地工具在手机上用不了 |

## 十、几个助手怎么协作

- **本地助手 → YOLO Agent**：本地助手先把草稿文件写进库里，你在 Obsidian 里打开，再让 YOLO Agent 接着润色。
- **Claude Desktop → YOLO Agent**：在 Desktop 里聊出结论，复制进笔记，再让 YOLO Agent 整理格式、加双链和标签。
- **云端 Claude ↔ 本地 Claude Code**：靠 `AI协作/交接日志.md` 交流，通过 git 同步，协议见 `CLAUDE.md` 第 4 节。
- **deepseek-cli ↔ YOLO**：YOLO 打开「外部 Agent 接入」后，deepseek-cli 通过 `.mcp.json` 调用 YOLO 的全库检索。见 [[使用说明]] 第 6.5 节。
- **它们互相不记得对方的对话。** 要交接，就把内容写进库里的文件。

## 十一、一句话总结

**本地助手管"代码和文件"，YOLO Agent 管"笔记和上下文"，Claude Desktop 管"不碰文件的深度聊天"，Claude API 是 YOLO 和脚本背后按 token 计费的大脑。**

本仓库最典型的分工：改 YOLO 插件找 Claude Code，日常记笔记找 YOLO Agent + DeepSeek，难题临时切 Claude。

## 十二、本仓库的默认分工约定

- 本地助手的回复默认追加到 `AI助手回复.md`；需要单独建文件时，要说明"单独建文件"。
- 改插件代码后，提交前必须跑通 `type:check`、`lint:check`、`test`、`build`（见 `CLAUDE.md`）。
- 插件改完要用户在 Obsidian 里重新加载，所有助手都没法直接操作 Obsidian 的界面。
- **任何助手都不能读取或复述密钥**：`.obsidian/plugins/obsidian-yolo/data.json`、`.mcp.json`、`~/.deepseek-cli/config.json`、`.obsidian/plugins/yolo-xox/`，以及以后可能出现的 Claude Desktop MCP 配置（`%APPDATA%\Claude\claude_desktop_config.json`）。
- 在 YOLO 里用 Claude，只用 Anthropic 提供商 + API Key，不用 Claude OAuth 提供商（Anthropic 条款不允许）。
- **不要设置 `ANTHROPIC_API_KEY` 环境变量**。
- 提交时只 `git add` 改过的具体文件，推送前先问用户。
- 规则要让 YOLO Agent 也遵守的话，除了写进 `CLAUDE.md`，还要写进 `YOLO/memory/` 或助手设置。

## 核实记录

2026-10-15 由本地 Claude Code 核实。官方帮助中心的文章没有标注具体日期，以后价格和规则可能再变。

| # | 内容 | 结论 | 来源 |
|---|---|---|---|
| 1 | Claude 订阅档位和月费 | Pro $20/月（年付合 $17/月）、Max「From $100」只能月付：**已核实**。Max 20x 档 $200/月：**未核实**，官方页没查到明确标价 | <https://claude.com/pricing> |
| 2 | Desktop、网页、订阅登录的 Claude Code 是否共享额度 | **已核实，共享**。另有 5 小时会话限额和每周限额 | <https://support.claude.com/en/articles/11145838-using-claude-code-with-your-max-plan> |
| 3 | Desktop 是否集成 Claude Code | **已核实**：Chat / Cowork / Code 三个标签页，Code 就是 Claude Code，需要付费订阅 | <https://code.claude.com/docs/en/desktop> |
| 4 | 查看登录方式的命令 | **已核实**：`/status`，看「Login method」一行 | <https://code.claude.com/docs/en/commands>、<https://code.claude.com/docs/en/authentication> |
| 5 | 第三方工具用订阅 OAuth 是否合规 | **已核实，不允许**。第三方应用不得提供 claude.ai 登录，也不得通过 Free / Pro / Max 凭据转发请求 | <https://code.claude.com/docs/en/legal-and-compliance>、<https://code.claude.com/docs/en/agent-sdk/overview> |
| 6 | 设了 `ANTHROPIC_API_KEY` 是否优先按 API 计费 | **已核实**：交互模式下你同意一次就一直用 Key；`-p` 模式直接用 | <https://code.claude.com/docs/en/authentication> |
| 7 | Desktop 配置本地 MCP | **已核实**：设置 → Extensions 装扩展（`.mcpb`）；或设置 → Developer → Edit Config 编辑 `claude_desktop_config.json`。Windows 路径 `%APPDATA%\Claude\` 来自 MCP 官方文档，Anthropic 帮助中心没写路径 | <https://support.claude.com/en/articles/10949351-getting-started-with-local-mcp-servers-on-claude-desktop>、<https://modelcontextprotocol.io/docs/develop/connect-local-servers> |
| 8 | Claude API 价格表 | **已核实**，和 [[使用说明]] 5.6 节一致；补充了 Haiku 长输入加价、缓存价 | <https://platform.claude.com/docs/en/about-claude/pricing> |
| 9 | deepseek-cli 看图片 / PDF | **本地读源码核实**：`dist/pdf.js`、`office.js` 提取文字；`dist/agent.js` 对没有视觉能力的模型不发图片，改走 `dist/ocr.js`，OCR 依赖可选的 `tesseract.js`，本机全局未安装 | 本库 `deepseek-cli/dist/` |
| 10 | Claude Code 接 YOLO 的 MCP | **本地实测通过**：终端 Claude Code 读取库根 `.mcp.json`，`mcp__yolo__vault_search` 语义检索返回了结果 | 本机实测 |
