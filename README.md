# ObsidianVault

一个**接入 DeepSeek（也可切换到 Claude）的 Obsidian 笔记库**。仓库根目录就是库根目录，里面带着一份自用版的 AI 插件 **YOLO (XOX)** 的源码，还有终端工具 **deepseek-cli** 的存档和配套文档。

> 完整说明请看 **[使用说明](<使用说明.md>)**。

## 包含什么

| 组成 | 位置 | 说明 |
|---|---|---|
| YOLO (XOX) | `.obsidian/plugins/obsidian-yolo/` | Obsidian 里的 AI 侧边栏，可以聊天、改笔记、搜全库、写作补全。基于 [Lapis0x0/obsidian-yolo](https://github.com/Lapis0x0/obsidian-yolo) 1.6.11，插件 id 改为 `yolo-xox`，关闭了官方自更新，补齐了新版 Claude 模型的支持 |
| deepseek-cli 存档 | `deepseek-cli/` | `@kavienw/deepseek-cli@0.5.0` 的 npm 包，只用来查阅；要用请运行 `npm i -g @kavienw/deepseek-cli` 安装 |
| 文档 | 根目录 `*.md` | 见下表 |

## 文档

| 文档 | 内容 |
|---|---|
| [使用说明](<使用说明.md>) | **从这里开始**：安装、三种使用方式、配置要点、费用、排错 |
| [CLAUDE.md](CLAUDE.md) | 写给 AI 的项目说明和规则，本地 Claude Code 启动时自动读取 |
| [AI协作/交接日志](<AI协作/交接日志.md>) | 云端 Claude 和本地 Claude Code 的交接信箱 |
| [项目进度与待办](<项目进度与待办.md>) | 已完成事项和待办清单 |
| [本地助手 vs Obsidian Agent 分工](<本地助手 vs Obsidian Agent 分工.md>) | 几个 AI 助手的区别、费用和分工（已联网核实） |
| [YOLO 改写与配置文档](<YOLO 改写与配置文档.md>) | YOLO (XOX) 插件的完整手册 |
| [DeepSeek CLI + Obsidian 联动](<DeepSeek CLI + Obsidian 联动.md>) | deepseek-cli 的作用、配置和局限 |
| [Obsidian 内嵌 AI 插件 + DeepSeek 操作流程](<Obsidian 内嵌 AI 插件 + DeepSeek 操作流程.md>) | 插件选型调研（仅供参考） |

## 快速开始（Windows）

前提：Git、Node.js 20 或以上、Obsidian，以及一个 [DeepSeek API Key](https://platform.deepseek.com/api_keys)。

```powershell
git config --global core.longpaths true
cd "C:\path\to\空文件夹"
git clone https://github.com/XOX2707/ObsidianVault.git .

cd ".obsidian\plugins\obsidian-yolo"
npm ci
npm run build
```

然后：

1. 用 Obsidian「打开本地仓库」，选中这个文件夹。
2. 设置 → 第三方插件 → 关闭安全模式 → 启用 **YOLO (XOX)**。不要同时安装 Smart Composer 或官方 YOLO。
3. 设置 → YOLO (XOX) → 模型 → 添加提供商 → **DeepSeek**，粘贴 Key，启用 `deepseek-v4-pro` 和 `deepseek-v4-flash`。
4. 可选：再添加 **Anthropic** 提供商，用 Claude 模型（`claude-opus-5-5` 等），见 [使用说明](<使用说明.md>) 第 5.6 节。

详细步骤见 [使用说明](<使用说明.md>) 第 3～5 节。

## 更新

```powershell
git pull
cd ".obsidian\plugins\obsidian-yolo"
npm run build
```

然后在 Obsidian 里重新加载插件。

## 安全

- API Key 只存在本机：YOLO 的在插件目录的 `data.json`，deepseek-cli 的在 `~/.deepseek-cli/config.json`。两者都不会被提交。
- `.gitignore` 已经忽略 `.mcp.json`（里面有本地 MCP token）和 YOLO 的 OAuth 凭据目录。

## 协议

- YOLO 源码：MIT，© 2026 Lapis0x0，见 `.obsidian/plugins/obsidian-yolo/LICENSE`。
- deepseek-cli：MIT，npm 发布者 kavienw。
- 本仓库的文档由 Claude Code 协助编写。
