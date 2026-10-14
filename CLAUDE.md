# CLAUDE.md

本文件写给在这个仓库里工作的 AI 助手，主要是用户电脑上的 **Claude Code**。Claude Code 每次启动都会自动读取它。deepseek-cli 启动时也会读取（它同时读 `DEEPSEEK.md`、`CLAUDE.md`、`AGENTS.md`）。

用户是中文使用者。**回答和文档都用简体中文**；代码、命令、提交信息可以用英文。

---

## 1. 这个仓库是什么

一个 **Obsidian 笔记库**，**仓库根目录就是库根目录**。完整说明见 `使用说明.md`，当前进度和待办见 `项目进度与待办.md`。开始任何任务之前，先读这两篇。

| 部分 | 位置 | 说明 |
|---|---|---|
| YOLO (XOX) 插件源码 | `.obsidian/plugins/obsidian-yolo/` | Obsidian 的 AI 侧边栏插件，从上游 Lapis0x0/obsidian-yolo 1.6.11 用 `git subtree --squash` 导入。插件 id 为 `yolo-xox`，已关闭官方自更新（`CORE_SELF_UPDATE_ENABLED = false`）。该目录有自己的 `CLAUDE.md`、`AGENTS.md`、`FEATURE_MAP.md`，改插件代码前必须读 |
| deepseek-cli 存档 | `deepseek-cli/` | npm 包 `@kavienw/deepseek-cli@0.5.0` 的编译产物，**只读存档，不要修改** |
| 说明文档 | 根目录 `*.md` | `使用说明.md`（总说明）、`项目进度与待办.md`、`本地助手 vs Obsidian Agent 分工.md`（各 AI 助手的区别和费用）、`YOLO 改写与配置文档.md`、`DeepSeek CLI + Obsidian 联动.md`、`Obsidian 内嵌 AI 插件 + DeepSeek 操作流程.md`、`README.md` |
| AI 协作信箱 | `AI协作/` | 云端会话和本地 Claude Code 之间的交接记录，见第 4 节 |

AI 模型：日常用 DeepSeek（`deepseek-v4-pro`、`deepseek-v4-flash`）；难的任务在 YOLO 里切到 Claude（`claude-opus-5-5` 等，使用用户自己的 Anthropic API Key）。

## 2. 环境

- 系统是 **Windows**，终端是 **PowerShell**。命令要用 PowerShell 写法，例如 `$env:VAR = "..."`，不能用 `VAR=... cmd`。
- 库路径：`C:\Users\XW\source\Obsidian Default Repo`。**路径里有空格，命令里必须加引号。**
- Node.js 20 或以上。插件的构建和检查命令都在插件目录里运行：
  ```powershell
  cd ".obsidian\plugins\obsidian-yolo"
  npm ci
  npm run build
  npm run type:check
  npm run lint:check
  npm test
  ```
- 开发模式必须先设置插件目录变量，否则会把 `main.js` 复制到库根目录：
  `$env:OBSIDIAN_PLUGIN_DIR = (Get-Location).Path; npm run dev`
- 改完插件后，要请用户在 Obsidian 里重新加载插件，你自己没法操作 Obsidian 的界面。
- 库根目录的 `.mcp.json`（不要打开）给 Claude Code 接上了 YOLO 的「外部 Agent 接入」，可以用 `mcp__yolo__vault_search` 按意思搜索笔记。要求 Obsidian 开着、开关打开着；工具没出现时，先用 ToolSearch 搜 `yolo`。
- 用户看不懂终端里的 markdown 符号。比较长的回复和报告，**追加**到根目录的 `AI助手回复.md` 末尾（标题写 `## YYYY-MM-DD · 主题`），终端里只说要点。用户说“单独建个文件”时才新建文件。

## 3. 必须遵守的规则

1. **绝不读取、输出或提交密钥。** `.obsidian/plugins/obsidian-yolo/data.json`（里面有 DeepSeek 和 Anthropic 的 Key）、`.mcp.json`、`~/.deepseek-cli/config.json`、`.obsidian/plugins/yolo-xox/`（OAuth 凭据）都不能打开查看，也不能在回复里引用其中的内容。截图和日志里出现的 Key 或 token 也不要复述。
2. **不要设置 `ANTHROPIC_API_KEY` 环境变量**，也不要建议用户设置，否则 Claude Code 会改用 API 计费。如果发现当前进程里有这个变量（只查是否存在，不看值），要提醒用户用 `/status` 确认登录方式。也不要建议在 YOLO 里用 Claude OAuth 提供商，Anthropic 不允许第三方工具使用订阅凭据。
3. **不要改插件文件夹名** `obsidian-yolo`，否则 `git subtree` 同步上游会失效。不要在插件目录里执行 `git init` 或 `git clone`。
4. **不要动 `deepseek-cli/`**，它是只读存档。
5. **用户的个人笔记**：没有用户明确同意，不要修改、移动或删除。提交时**只 `git add` 你改过的具体文件**，不要用 `git add -A` 或 `git add .`，以免把用户的私人笔记推到 GitHub。
6. 推送（`git push`）前先问用户。改插件代码后，提交前必须跑通 `type:check`、`lint:check`、`test`、`build`。
7. 不要修改 `.obsidian/workspace*.json` 等 Obsidian 自动生成的界面状态文件。

## 4. 与云端 Claude 的协作协议（AI协作信箱）

用户同时会用两个 Claude：
- **云端会话**：在 claude.ai/code 里，只能访问 GitHub 上的仓库，看不到用户电脑。它的改动通过 PR 合并进 `main`。
- **本地 Claude Code**：在用户电脑的终端里，能构建、能运行命令、能看到真实的本地环境。

两者**互相不记得对方的对话**，唯一的交流渠道是仓库里的 **`AI协作/交接日志.md`**，通过 git 同步。

### 4.1 每次开始工作时（两边都要做）

1. 本地先运行 `git pull`；云端先同步 `main`。
2. 读 `AI协作/交接日志.md`，找收件方是自己、状态为「待处理」的条目。
3. 有的话，先告诉用户“交接日志里有 N 条待处理任务”，**经用户同意后**再做。

### 4.2 写消息的格式

仓库的 `.gitattributes` 给 `AI协作/` 设置了 `merge=union`：两边同时在末尾追加时，git 合并会自动保留双方内容。合并后如果某一条的「状态」行出现了两次，保留较新的那一行。

只在文件**末尾追加**，不改别人写的内容（只能改条目的「状态」那一行，以及在「回复」下面追加）。编号接着上一条往下排。

```markdown
## #编号 · YYYY-MM-DD · 发件方 → 收件方 · 状态：待处理

**任务**：一句话说明要做什么。
**背景**：为什么要做，相关文件和链接。
**完成标准**：怎样算做完，需要回报什么。
**注意**：限制和风险（可选）。

**回复**（收件方填写）：
```

- 发件方和收件方写 `云端` 或 `本地`。
- 状态只能是这几种：`待处理`、`进行中`、`已完成`、`需要用户`、`阻塞`。
- 回复要写清楚**实际结果**：命令输出的关键几行、通过或失败、改了哪些文件、提交号。**没做的、没验证的要明说**，不要编造结果。
- 消息里**不能出现任何 Key、token 或个人隐私内容**。

### 4.3 做完之后

- **本地**：更新条目的状态，在「回复」下写结果。如果有影响，同时更新 `项目进度与待办.md`。然后只 `git add` 改过的文件，提交信息写 `handoff: #编号 ...`，**问过用户后**推送到 `main`。
- **云端**：在 `claude/...` 分支上修改并开 PR，由用户合并。PR 描述里写上对应的交接编号。

### 4.4 分工原则

| 交给本地 | 交给云端 |
|---|---|
| 构建、运行测试、看真实报错 | 不依赖本地环境的代码修改和文档整理 |
| 检查 Obsidian 里插件的实际表现（需要用户配合） | 调研、读上游源码、写方案 |
| 批量处理用户的笔记文件 | 开 PR、在 GitHub 上跟进 |
| 验证云端改动在 Windows 上是否可用 | 根据本地回报的问题修复代码 |
