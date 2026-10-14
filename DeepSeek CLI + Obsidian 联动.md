---
tags: [deepseek, obsidian, mcp, cli]
source: https://www.npmjs.com/package/@kavienw/deepseek-cli
version: 0.5.0
---

# DeepSeek CLI + Obsidian 联动（最接近 MCP 体验）

源码位置：[[deepseek-cli/README|deepseek-cli/]]（来自 npm 包 `@kavienw/deepseek-cli@0.5.0`，MIT 协议）

> [!note] 关于“Clone”
> 这个 npm 包没有声明 `repository` 字段，网上也找不到公开的 GitHub 仓库，所以没法 `git clone`。这里存的是 npm 发布的完整包，内容为编译后的 `dist/*.js`、`README.md` 和 `package.json`。source map 里没有内嵌 `src/*.ts` 原文，因此还原不出 TypeScript 源码。

## 一句话定位

一个仿照 Claude Code 写的终端智能体，模型用 DeepSeek V4。在 Obsidian 联动里，它负责把 **DeepSeek 接成 vault 的“操作者 + MCP 客户端”**：
- 它直接读写 vault 里的 Markdown 文件。
- 它还能挂载 Obsidian 的 MCP 服务器，调用 Obsidian 本身的能力。

## 在联动中的主要作用

| 作用 | 实现位置 | 对 Obsidian 的意义 |
|---|---|---|
| **MCP 客户端** | `dist/mcp.js` | 支持 stdio 和 Streamable HTTP/SSE 两种连接方式。配置从 `~/.deepseek-cli/mcp.json`、`<vault>/.mcp.json`（兼容 Claude 的格式）和 `<vault>/.deepseek/mcp.json` 读取，后者优先级最高。远端工具会注册成 `mcp__<server>__<tool>`，调用前需要确认。这是“接近 MCP 体验”的核心。 |
| **直接读写 vault 文件** | `dist/tools/*.js` | `read_file` / `list_files` / `search_text` 是只读工具，不需要审批。`write_file` / `edit_file` 需要审批，并且会显示 diff。不装 Obsidian 插件也能整理、改写和批量编辑笔记。 |
| **把 vault 当“项目”加载规则** | `dist/project.js` | 启动时会自动注入 `DEEPSEEK.md`、`CLAUDE.md`、`AGENTS.md`，可以在这些文件里写 vault 约定，例如目录结构、双链规范、frontmatter 格式。输入 `# 一句话` 会把内容追加到 `DEEPSEEK.md` 的 `## Notes` 小节下。 |
| **技能 = 可复用的笔记工作流** | `dist/skills.js` | `.deepseek/skills/*.md` 是带 frontmatter 的 Markdown，会自动注册成 `/命令`，适合做 `/daily-review`、`/weekly-summary`、`/inbox-triage` 这类命令。 |
| **钩子** | `dist/hooks.js` | `.deepseek/hooks.json` 里的钩子会在 `postToolUse` 等事件触发，可以在改文件后自动执行 `git commit`，也就是自动备份 vault。 |
| **附件和文档提取** | `dist/attachments.js`, `pdf.js`, `office.js`, `ocr.js` | 用 `@文件` 或拖拽可以引用笔记；PDF、Word、PPT、Excel 会自动提取文字，适合把文献导入笔记。DeepSeek 模型**看不了图片**：图片和扫描件只能走 OCR 提取文字，OCR 要另装可选依赖 `npm i -g tesseract.js @napi-rs/canvas`（2026-10-15 查过，本机没装，所以现在图片和扫描件读不出内容）。 |
| **联网 + 子代理** | `webSearch.js`, `webFetch.js`, `task.js` | 联网检索资料后写成笔记。`task` 会启动一个上下文隔离的子代理来处理大批量笔记。 |

## 典型配置（vault 根目录 `.mcp.json`）

```json
{
  "mcpServers": {
    "obsidian": {
      "url": "http://127.0.0.1:27123/mcp",
      "type": "http",
      "headers": { "Authorization": "Bearer <Local REST API key>" }
    },
    "vault-fs": {
      "command": "cmd",
      "args": ["/c", "npx", "-y", "@modelcontextprotocol/server-filesystem", "C:/Users/XW/source/Obsidian Default Repo"]
    }
  }
}
```

- 第一种需要 Obsidian 侧有一个 MCP 端点，比如 Local REST API 插件加一个 MCP 桥接插件或服务。具体地址和端口以所用插件为准，上面只是示意。**更推荐直接用 YOLO 自带的 MCP 服务**，见 [[YOLO 改写与配置文档]] 第 7.2 节。
- **Windows 注意**：deepseek-cli 启动本地 MCP 进程时不经过 shell（源码 `dist/mcp.js` 直接 `spawn(command, args)`）。所以 `npx` 这类 `.cmd` 命令不能直接写在 `command` 里，否则会报 `ENOENT` 或 `EINVAL`。要像上面那样写成 `"command": "cmd"`，`args` 以 `"/c", "npx", ...` 开头。
- JSON 里的 Windows 路径用正斜杠 `/`；如果用反斜杠，要写成双反斜杠 `\\`。
- 只想读写文件的话，其实不需要 MCP，直接在 vault 目录里运行 `deepseek` 就行。

## 局限（读源码发现）

- **不认识 Obsidian 的语义**：代码里没有任何 `obsidian` 相关逻辑。`[[双链]]`、反向链接、标签索引、Dataview 都要靠 MCP 服务器或者模型自己理解纯文本。
- **项目根目录识别**：`findProjectRoot` 只认 `.git`、`package.json` 等标记，不认 `.obsidian`。vault 不是 git 仓库时，会把当前目录当根目录，所以要在 vault 根目录启动。
- **`.obsidian/` 不会被跳过**：`list_files` 只忽略 `node_modules` 和 `.git`，搜索时可能扫到插件配置。建议在 `DEEPSEEK.md` 里写明“忽略 `.obsidian/`”。
- **MCP 只支持 tools**：只实现了 `tools/list` 和 `tools/call`，没有 resources 和 prompts。工具结果只取文本。
- 每个 MCP 工具调用都要审批，`--yes` 可以全部跳过，但要慎用。
