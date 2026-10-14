---
tags: [yolo, obsidian, deepseek, mcp, fork]
upstream: https://github.com/Lapis0x0/obsidian-yolo
upstream_commit: c499c63f2638ab6fe639d0714f106de5c71ba983
upstream_version: 1.6.11
updated: 2026-10-14
---

# YOLO 改写与配置文档（DeepSeek 方案）

本文是自用版 YOLO 的完整说明，覆盖：源码放在哪、怎么构建加载、怎么防止被官方版覆盖、怎么接 DeepSeek、知识库、权限、MCP，以及怎么改代码、怎么同步上游。

总说明：[[使用说明]] · 相关笔记：[[Obsidian 内嵌 AI 插件 + DeepSeek 操作流程]] · [[DeepSeek CLI + Obsidian 联动]] · [[项目进度与待办]]

---

## 1. 源码在哪、是怎么来的

| 项 | 值 |
|---|---|
| 位置 | `.obsidian/plugins/obsidian-yolo/`（本仓库内） |
| 上游 | <https://github.com/Lapis0x0/obsidian-yolo>，`main` 分支 |
| 导入时的上游提交 | `c499c63f`（2026-10-14，版本 1.6.11） |
| 导入方式 | `git subtree add --squash`：把上游代码压成一个提交放进本仓库，同时记下上游提交号，以后可以 `git subtree pull` 合并新版本 |
| 协议 | MIT。改写和再发布都可以，但必须保留 `LICENSE` 里的版权声明 |

**为什么放在 `.obsidian/plugins/` 下？**
- Obsidian 只从 `.obsidian/plugins/<文件夹>/` 加载插件，源码放在这里，构建完就能直接启用。上游的开发说明也是这么做的。
- 以 `.` 开头的目录不会被 Obsidian 当作笔记索引。这样 `npm install` 生成的 `node_modules`（里面有上千个 `.md`）不会把笔记库搞乱。如果放在库根目录，就会被索引。

**会不会把 API Key 提交上去？** 不会。子目录自带的 `.gitignore` 已经忽略了 `data.json`（插件设置，Key 存在这里）、`node_modules`、`main.js`、`styles.css` 等构建产物。

### 关于 GitHub 上的 “Fork”

我这边的会话只有你的 `ObsidianVault` 仓库的权限，没法在你的 GitHub 账号下点 Fork。所以采用了“把上游完整代码导入你的仓库”的方式，效果和 fork 一样：可以随意改，也能继续同步上游。

如果你还想在 GitHub 上有一个真正的 fork（比如以后给上游提 PR）：

1. 打开 <https://github.com/Lapis0x0/obsidian-yolo>，点右上角 **Fork**，得到 `XOX2707/obsidian-yolo`。
2. 在本地 vault 仓库里，把这个目录的改动推送到那个 fork 的一个分支上：
   ```bash
   git remote add yolo-fork https://github.com/XOX2707/obsidian-yolo.git
   git subtree push --prefix=.obsidian/plugins/obsidian-yolo yolo-fork my-changes
   ```
   因为导入时用了 `--squash`，这个分支的历史和上游不相连，适合存档自己的版本。如果要给上游提 PR，建议在 fork 里从上游 `main` 新建分支，再用 `git cherry-pick` 或者直接复制文件，把具体改动带过去。

---

## 2. 在本机构建并加载

> 前提：Node.js ≥ 20（导入时用 Node 22 + npm 10 实测构建通过），并且已经把本仓库 clone 到电脑上，作为 Obsidian 的库来打开。
>
> 本文的命令以 **Windows PowerShell** 为准。你的库在 `C:\Users\XW\source\Obsidian Default Repo`，路径里有空格，**必须加引号**。macOS/Linux 用户把路径换成自己的即可。

```powershell
cd "C:\Users\XW\source\Obsidian Default Repo\.obsidian\plugins\obsidian-yolo"
npm ci            # 按 package-lock 安装依赖，第一次需要几分钟
npm run build     # 生产构建：类型检查 + 样式 + 运行组件 + 模块 + main.js
```

构建完成后，目录里会出现 `main.js`、`styles.css`，加上已有的 `manifest.json`，这就是 Obsidian 需要的三件套。然后：

1. 在 Obsidian 的 **设置 → 第三方插件** 里关闭安全模式，然后刷新已安装插件列表。
2. 找到 **YOLO (XOX)**（插件 id 是 `yolo-xox`，见第 3 节），启用。
3. 如果之前装过 **Smart Composer**，必须先禁用或卸载。YOLO 是从它分出来的，两者会冲突。
4. 如果之前从插件商店装过官方 **YOLO**，请先在 Obsidian 里卸载它。商店版的文件夹如果也叫 `obsidian-yolo`，会和这份源码重叠；如果叫别的名字，两份同时启用会冲突（视图类型相同）。

### 边改边看（开发模式）

```powershell
cd "C:\Users\XW\source\Obsidian Default Repo\.obsidian\plugins\obsidian-yolo"
$env:OBSIDIAN_PLUGIN_DIR = (Get-Location).Path
npm run dev
```

macOS/Linux（bash/zsh）的写法是：`OBSIDIAN_PLUGIN_DIR="$PWD" npm run dev`。

- **一定要先设置 `OBSIDIAN_PLUGIN_DIR`，让它等于插件目录本身。** PowerShell 里用 `$env:` 设置的变量只在当前窗口有效，每次新开终端都要重新设一次。上游的 `scripts/sync-dev-artifacts.mjs` 默认把 `git rev-parse --git-common-dir` 所在目录当作插件目录。上游的做法是插件目录本身就是一个 git 仓库。但在我们这里，它会算出**库根目录**，然后往库根复制 `main.js`。把这个变量设为当前目录后，脚本发现源目录和目标目录相同，就会跳过复制。
- `npm run ob` 是上游作者在 macOS 上的专用脚本，会退出并重开 Obsidian，不要用。
- 建议装 [Hot Reload](https://github.com/pjeby/hot-reload) 插件实现自动重载；不装的话，在开发者控制台按 `Ctrl+R`（macOS 是 `Cmd+R`）刷新。

### 提交前的检查（和上游 CI 一致）

```powershell
npm run type:check
npm run lint:check
npm test
```

改了样式：`styles.css` 是**生成的**，不要直接改。改 `src/styles/**`，然后跑 `npm run styles:build`。CSS 类名统一加 `yolo-` 前缀。在本仓库里 `styles.css` 已被忽略，不用提交。

---

## 3. 防止被官方版本覆盖（已处理）

自用改写版最常见的坑是：**官方更新把你的 `main.js` 覆盖掉。** 覆盖的来源有两个：

- YOLO 自己的更新器：通过上游的发行渠道源（`distribution/feed-v1.json`）找到新版本，再去 `Lapis0x0/obsidian-yolo` 的 Releases 下载。
- Obsidian 自带的“检查插件更新”：按插件 id 去社区商店拉官方版。

这两处都已经在源码里处理好了：

| 改动 | 位置 | 效果 |
|---|---|---|
| 插件 id 改成 `yolo-xox`，名称改成 `YOLO (XOX)` | `manifest.json` | 社区商店里没有这个 id，Obsidian 的“检查更新”不会再拉官方 YOLO |
| 关闭核心自更新：`CORE_SELF_UPDATE_ENABLED = false` | `src/core/update/pluginUpdater.ts` | `canSelfUpdate()` 恒为 false：不下载、不安装、不“自动修复安装”（自动修复同样会下载官方版来覆盖） |
| 不再检查核心新版本 | `src/main.ts` 的 `runUpdateCheck()` | 不弹“有新版本”提示；设置里的「更新方式」对核心不再起作用 |

**模块更新没有关**：学习模式、白板等官方模块仍然可以从发行渠道安装和更新。它们独立发布，不会覆盖插件本体。

以后想恢复官方更新，把 `CORE_SELF_UPDATE_ENABLED` 改回 `true` 就行。但即使恢复，下载的也还是上游的官方版本。想换成你自己的发布源，就改 `src/core/distribution/distributionFeedClient.ts` 和 `src/core/update/updateChecker.ts` 里的上游地址。

**改 id 带来的影响（第一次启用前请了解）：**

- 插件文件夹仍然是 `.obsidian/plugins/obsidian-yolo/`（这是 subtree 的路径，改了就没法同步上游）。Obsidian 不要求文件夹名和 id 一致。插件设置 `data.json` 跟着文件夹走，**原有设置会保留**。
- **快捷键需要重新绑定**：Obsidian 的命令 id 带插件 id 前缀，会从 `yolo:…` 变成 `yolo-xox:…`。
- **OAuth 登录凭据**（ChatGPT、Gemini、Copilot、MCP OAuth）存在 `.obsidian/plugins/<插件id>/` 下，也就是 `.obsidian/plugins/yolo-xox/`，而不在插件文件夹里，这是上游本来的设计。如果用过这些登录，换 id 后需要重新登录一次。库根的 `.gitignore` 已经忽略了 `yolo-xox/` 和 `yolo/` 这两个目录，凭据不会被提交。
- 不要同时启用官方 YOLO 和你的版本，也不要和 Smart Composer 同时启用：它们注册的视图类型相同，会冲突。
- 运行组件（分词器、PDF、Bash、嵌入引擎）仍然从上游 Releases 下载，并按 sha256 校验，**不用改**。

---

## 4. 接入 DeepSeek

YOLO 内置了 DeepSeek 提供商，也预置了 `deepseek-v4-flash` 和 `deepseek-v4-pro` 两个模型（默认未启用），不需要填 Base URL。

### 4.1 添加提供商

1. 到 <https://platform.deepseek.com/api_keys> 创建 Key。
2. **设置 → YOLO → 模型 → 添加提供商 → 中国 → DeepSeek**，粘贴 Key。
3. **API 类型**：DeepSeek 提供商支持三种：
   - `openai-compatible`（**默认，推荐**）：走 `https://api.deepseek.com`，使用 YOLO 为 DeepSeek 专门做的适配器（`deepseekStudioProvider.ts`，并且声明了**不支持图片**）。
   - `anthropic`：走 `https://api.deepseek.com/anthropic`，适配器会在“思考 + 工具调用”时自动回传 thinking 块。如果 Agent 模式下多轮工具调用报错，可以切到这个试试。
   - `openai-responses`：一般不用。
4. 网络请求方式：桌面端保持「自动」或「桌面直连」。手机上如果请求失败，切到「Obsidian 内置请求」。

### 4.2 启用模型并设为默认

1. 展开 DeepSeek 卡片，打开 `deepseek-v4-pro`、`deepseek-v4-flash` 的启用开关。如果没看到，就点「添加聊天模型」，手动填调用 ID。
2. 点表头的「**连通性测试**」，确认两个模型都返回正常。
3. **模型类型（推理档位）**：预置是 `OpenAI 推理 effort`，可以按需选 low/medium/high。
4. **上下文窗口 token**：如果没有自动填，就手动填上，否则对话里的“上下文占用百分比”算不出来。
5. **输入模态**：只勾「文本」。DeepSeek 不支持图片，勾了会直接报错。
6. 滚到「**默认模型策略与提示词**」：

| 槽位 | 推荐 |
|---|---|
| 默认聊天模型 | `deepseek-v4-pro` |
| 对话命名模型 | `deepseek-v4-flash`（便宜） |
| 主请求超时 | 60 秒调到 **180 秒**（思考模型容易超时） |
| 启用自动恢复 | 保持开 |

7. 在灵光写作设置里，「续写模型」和「Tab 补全模型」都选 `deepseek-v4-flash`。Tab 补全**默认是关的**，需要手动打开。

### 4.3 全局系统提示词（推荐写法）

新建一篇笔记 `YOLO/提示词/库规范.md`，写上你的库规范，比如“使用 [[双链]]、frontmatter 必须带 tags、日期格式 YYYY-MM-DD、中文回答、忽略 `.obsidian/` 目录”。然后在全局系统提示词里只写一行：

```
![[库规范]]
```

以后改这篇笔记，就等于改了提示词。

### 4.4 联网

模型编辑里的「Provider 内置工具」可以开启 **DeepSeek 官方联网**。**开启后，YOLO 自己的联网搜索工具会被自动关闭**，两套只能二选一。

> [!warning] 官方联网需要先切换 API 类型
> DeepSeek 只在 **Anthropic** 和 **OpenAI Responses** 两种接口上提供官方联网；默认的 `openai-compatible`（chat/completions）会直接拒绝这类工具。所以在默认设置下，Web Search 开关是灰的，提示“该提供商当前的 API 类型不支持官方联网”。
>
> 要用官方联网：
> 1. 设置 → 模型 → 编辑 **DeepSeek 提供商**（不是编辑模型），把 **API 类型** 改成 **Anthropic**，保存。Base URL 可以留空，YOLO 会自动改用 `https://api.deepseek.com/anthropic`。
> 2. 回到模型编辑页，打开 Web Search，然后对两个模型重新跑一次「连通性测试」。
>
> 推荐选 Anthropic 而不是 OpenAI Responses：YOLO 给 Anthropic 接口做了 DeepSeek 专用适配（`deepseekAnthropicProvider.ts`，处理“思考 + 工具调用”），OpenAI Responses 走的是通用实现。API 类型是**按提供商**设置的，切换后这个提供商下的所有模型都会改走 Anthropic 接口。
>
> 不切也完全可以：保持 `openai-compatible`，使用 YOLO 自带的联网搜索即可（默认已开启）。

### 4.5 也想用 Claude？

YOLO 可以同时配 DeepSeek 和 Anthropic 两个提供商，在模型下拉框里按对话切换。Anthropic 提供商的配置、推荐模型、价格和注意事项见 [[使用说明]] 第 5.6 节。

---

## 5. 知识库（RAG）：DeepSeek 没有嵌入接口

DeepSeek 不提供 embedding，所以 YOLO 里的 DeepSeek 提供商 `supportEmbedding: false`。推荐用**本地嵌入模型**，不需要 Key，笔记也不会离开本机，只能在桌面端用：

1. **设置 → YOLO → 模块 → 运行组件**，启用「**嵌入引擎**」。
2. **设置 → YOLO → 知识库 → 嵌入模型 → 本地（设备端）**：
   - 中文为主选 **BGE Small (Chinese)**，约 23MB，512 维。
   - 中英混合、要求质量选 **BGE-M3**，约 560MB。
   - 点「下载」，下完后选中，再点「**设为当前**」。
3. 点状态条上的「**开启并建立索引**」。
4. 可选：「新建知识库」，按目录拆开，比如「工作」「读书」，**描述要写清楚**，模型会根据描述判断查哪个库。
5. 用 API 嵌入（比如硅基流动的 bge-m3）遇到 429 报错时，把「嵌入并发数」调到 2–3。

> 换嵌入模型、改分块大小之后，都必须**手动重建整个库的索引**（命令面板 → 重建整个库索引）。

---

## 6. 模式与权限：推荐配置

| 模式 | 能做什么 |
|---|---|
| **Ask** | 读笔记、检索、联网。不改正文，但虚拟终端仍能执行 `mv`/`rm`，这类操作每次都会问你 |
| **Agent** | 能改库里的文件、跑多步任务。改文件默认要先看 diff 再点「应用」 |
| **Max** | 能读写**本机任意文件**，只在桌面端有 |

推荐：
- 日常用 **Agent**，**不开** YOLO 自动放行开关，「文件编辑工具集」保持「需要审批」。
- 「终端命令」（真实 shell）保持关闭，除非确实需要。它和第三方 MCP 都能**绕过工作区范围**。
- 想把它限制在某些目录：Agent 编辑器 → 工作区 → 打开「限制自主工作范围」。
- 撤销功能依赖本机快照，不随笔记同步。**这个库已经在 Git 里，记得经常提交。**
- 其他 → 交互 → 「`@` 文件上下文注入模式」保持**轻量模式**，更省 token。

---

## 7. MCP：两个方向

MCP 只能在桌面端用，手机上整块隐藏。

### 7.1 YOLO 调用外部工具

**设置 → YOLO → Agent → 全局能力 → 工具 → 管理工具 → 添加 MCP 服务器**，切到 JSON 模式粘贴配置，支持 stdio、http、sse、ws 四种连接方式，也兼容 Claude Desktop 的 `mcpServers` 格式：

```json
{
  "transport": "stdio",
  "command": "npx",
  "args": ["-y", "@modelcontextprotocol/server-github"],
  "env": { "GITHUB_PERSONAL_ACCESS_TOKEN": "<token>" }
}
```

工具多的服务器，在 Agent 的「工具」标签里把披露模式设为「**按需披露**」，可以省 token。

### 7.2 把 YOLO 暴露给外部（和 deepseek-cli 联动）

**设置 → YOLO → Agent → Agent 能力 → 外部 Agent 接入 → 允许外部 Agent 访问**。之后 YOLO 会在 `http://127.0.0.1:28124/mcp` 起一个 MCP 服务，提供 `vault_search`、`agent_task_start`、`agent_task_get`、`agent_task_cancel` 四个工具。

这样，[[DeepSeek CLI + Obsidian 联动|deepseek-cli]] 就能在终端里直接使用 YOLO 的知识库检索，还能把任务派给 YOLO 的 Agent。在库根目录新建 `.mcp.json`。里面有 token，**不要提交**；本仓库的 `.gitignore` 已经忽略了它：

```json
{
  "mcpServers": {
    "yolo": {
      "type": "http",
      "url": "http://127.0.0.1:28124/mcp",
      "headers": { "Authorization": "Bearer <YOLO 界面上给出的 token>" }
    }
  }
}
```

然后在库根目录运行 `deepseek`，输入 `/mcp list`，应该能看到 `mcp__yolo__vault_search` 等工具。

---

## 8. 改代码从哪下手

先读子目录里的 `FEATURE_MAP.md`，它是“功能 → 代码文件 → 怎么验证”的索引；再读 `AGENTS.md`，了解目录边界和约束。常改的地方：

| 想改什么 | 看哪里 |
|---|---|
| 默认模型、提供商预设 | `src/constants.ts`（`PROVIDER_PRESET_INFO`、默认模型列表），`src/constants/provider-catalog.ts` |
| DeepSeek 的请求和消息适配 | `src/core/llm/deepseekStudioProvider.ts`、`deepseekMessageAdapter.ts`、`deepseekAnthropicProvider.ts`、`deepseekCapabilities.ts` |
| 系统提示词怎么拼 | `src/utils/chat/requestContextBuilder.ts` |
| Ask/Agent 模式的权限 | `src/core/agent/chat-runtime-profiles.ts`、`tool-gateway.ts` |
| 新增或修改工具 | `src/core/tools/capabilities/`（唯一的注册点）+ `src/core/tools/<工具名>/` |
| Quick Ask、Tab 补全、改写 | `src/features/editor/`，共用 `src/core/ai/single-turn.ts` |
| 知识库检索 | `src/core/rag/` |
| MCP | `src/core/mcp/` |
| 设置页 | `src/settings/SettingTab.tsx`；**新增设置项要加迁移**：`src/settings/schema/migrations/` |
| 更新器（防覆盖，开关是 `CORE_SELF_UPDATE_ENABLED`） | `src/core/update/pluginUpdater.ts` |
| Claude 的思考参数、`block_binding`、采样参数 | `src/core/llm/claudeReasoning.ts`、`src/core/llm/anthropic.ts` |
| 各模型的价格、上下文长度 | `src/constants.ts`（`ANTHROPIC_PRICES` 等）、`src/utils/llm/model-capability-registry.ts` |
| 界面文案（中文） | `src/i18n/` |

建议的改写流程：

1. 每次改动单独提交，提交信息写清楚改了什么。这样以后合并上游时冲突更好处理。
2. 改完跑 `type:check` / `lint:check` / `test`，再 `npm run build`，然后在 Obsidian 里手动验证。
3. 如果改的是浮层或快捷键，按 FEATURE_MAP 的要求，在**独立窗口**里也验证一遍。

---

## 9. 同步上游更新

```powershell
cd "C:\Users\XW\source\Obsidian Default Repo"   # 仓库根目录，不是插件目录
git remote add yolo-upstream https://github.com/Lapis0x0/obsidian-yolo.git   # 只需执行一次
git subtree pull --prefix=.obsidian/plugins/obsidian-yolo yolo-upstream main --squash
```

`--prefix` 后面的路径保持用正斜杠 `/`，Windows 下也一样。

- 有冲突时按普通 merge 处理，你自己的改动以提交为单位，比较好对照。
- 合并后重新 `npm ci && npm run build`。
- 不要在插件目录里另外执行 `git init` 或 `git clone`，那样会和 subtree 冲突。

---

## 10. 常见问题

| 现象 | 处理 |
|---|---|
| 启用后报错或白屏 | 先确认 Smart Composer 已禁用；再看开发者控制台（`Ctrl+Shift+I`，macOS 是 `Cmd+Option+I`） |
| 改了代码但界面没变 | 确认重新执行了 `npm run build` 或 `npm run dev`，并重载了插件 |
| 重启后改动消失 | 确认 `manifest.json` 的 id 是 `yolo-xox`，并且库里没有另一份官方 YOLO |
| DeepSeek 请求超时 | 调大主请求超时；或者切 `deepseek-v4-flash`；或者降低推理强度 |
| Agent 多轮工具调用报 thinking 相关错误 | DeepSeek 提供商的 API 类型切到 `anthropic` |
| 知识库只能做关键词检索 | 嵌入模型没设好，或者没点「设为当前」，或者嵌入引擎组件没启用 |
| 库根出现 `main.js` | 运行 `npm run dev` 前没设置 `OBSIDIAN_PLUGIN_DIR`（PowerShell：`$env:OBSIDIAN_PLUGIN_DIR = (Get-Location).Path`），删掉那个文件即可 |
| API Key 报错弹窗里点「Open Settings」没反应 | 上游的遗留问题：按钮写死了旧 id `next-composer`。**已修复**，现在会打开 YOLO (XOX) 的设置页 |
| 手机上没有 MCP、本地嵌入、CLI | 这些设计上只支持桌面端 |
