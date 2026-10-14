---
tags: [deepseek, obsidian, ai-plugin, mcp]
updated: 2026-10-14
---

# Obsidian 内嵌 AI 插件 + DeepSeek 操作流程

对照：[[DeepSeek CLI + Obsidian 联动]]。CLI 方案在终端里操作 vault；插件方案把 AI 放进 Obsidian 侧边栏，可以直接用当前笔记、选区、`@文件` 当上下文，修改也是一键应用。

## 0. 通用准备

1. 到 <https://platform.deepseek.com/api_keys> 创建一个 API Key。
2. 记下连接参数。DeepSeek 兼容 OpenAI 格式：
   - Base URL：`https://api.deepseek.com`（有的插件要求填 `https://api.deepseek.com/v1`，两个都可以试）
   - 模型：`deepseek-v4-pro`（质量优先）或 `deepseek-v4-flash`（便宜、快）
   - 旧名 `deepseek-chat` / `deepseek-reasoner` 已在 2026-07-24 下线，插件里如果还是默认的旧名，要手动改掉。
3. Obsidian → 设置 → 第三方插件 → 关闭“安全模式”。

## 方案 A（推荐）：Smart Composer，内置 DeepSeek 并支持 MCP

适合想要“聊天 + 改笔记 + 搜整个 vault + MCP 工具”一体化的人。最新版本 1.2.9。作者已声明“不再积极开发”，但功能完整。

1. **安装**：第三方插件 → 浏览 → 搜 `Smart Composer` → 安装 → 启用。
2. **配置 DeepSeek**：设置 → Smart Composer → **Providers** → 在 DeepSeek 一行填入 API Key。
3. **添加模型**：在 **Models / Chat models** 里新增，Provider 选 DeepSeek，Model ID 填 `deepseek-v4-pro`。然后把它设为默认 Chat 模型，Apply 模型可以设成 `deepseek-v4-flash`。
4. **用起来**：
   - 打开右侧聊天面板。默认带上当前笔记；输入 `@文件名` 或 `@文件夹` 可以加更多上下文。
   - AI 给出修改后，点 **Apply** 会显示 diff，可以逐块接受。
   - 输入 `/` 调出提示词模板；系统提示词里可以写 vault 规则，比如“使用 [[双链]]、frontmatter 包含 tags”。
5. **Vault 全库检索（RAG）**：DeepSeek 没有向量（embedding）接口，需要另配一个 embedding 模型。推荐用本地 Ollama：`ollama pull bge-m3` 或 `nomic-embed-text`，再到设置里把 Embedding 模型选成它。配好后按 `Cmd/Ctrl+Shift+Enter` 进行全库问答。
6. **MCP（可选，仅桌面端，只支持 stdio 本地进程）**：设置 → Smart Composer → **MCP** → 添加服务器，填名称和参数 JSON：
   ```json
   {
     "command": "npx",
     "args": ["-y", "@modelcontextprotocol/server-filesystem", "/你的/ObsidianVault"]
   }
   ```
   如果想调用 Obsidian 本身的能力（搜索、读当前活动笔记、打补丁），先装 **Local REST API** 插件拿到 API Key，再接上 `mcp-obsidian`：
   ```json
   {
     "command": "uvx",
     "args": ["mcp-obsidian"],
     "env": { "OBSIDIAN_API_KEY": "<Local REST API 的 key>", "OBSIDIAN_HOST": "127.0.0.1", "OBSIDIAN_PORT": "27124" }
   }
   ```
   MCP 工具调用依赖模型的 function calling，V4 系列支持。

## 方案 B：Copilot（logancyang，v4.x）

适合想要完整 **Agent**（多步操作、建文件、Skills/Commands、Projects）的人。

1. 第三方插件 → 搜 `Copilot` → 安装 → 启用。
2. 设置 → Copilot → **BYOK** → **Add a provider** → **Add a custom provider**：
   - Base URL：`https://api.deepseek.com`（如果测试失败，改成 `/v1` 结尾的地址）
   - API Key：DeepSeek 的 key。key 存在本机的 Obsidian Keychain 里，不写进 vault。
   - Model：手动填 `deepseek-v4-pro` 和 `deepseek-v4-flash` → **Test** → **Save**。
   - 如果 Test 通过但 Quick Chat 发不出消息，打开 **Enable CORS**（代价是回复不再逐字流式显示）。
3. **Quick Chat / Quick Ask**（桌面和手机都能用）：Basic → Agents → Quick Chat 里选 DeepSeek 模型。
4. **Agent Chat**（仅桌面）：Basic → Agents → **opencode** → Configure → Managed by Copilot → Download & install，然后在 opencode 的模型列表里选 BYOK 的 DeepSeek 模型。点侧边栏的 Agent 图标即可开始。
5. 内置的 Obsidian Markdown/Bases/Canvas Skills 可以直接开启；自己写的 Skill 放在 `<Copilot 文件夹>/skills/`。

## 方案 C：Real Chat（轻量，DeepSeek 直连）

1. 第三方插件 → 搜 `Real Chat`。如果商店里搜不到，从 GitHub Release 下载 `main.js`、`manifest.json`、`styles.css`，放进 `.obsidian/plugins/real-chat/`。
2. 设置 → Real Chat → Provider 选 **DeepSeek direct** → 粘贴 Key。
3. 从侧边栏的气泡图标打开。能读写、重命名笔记，查找反向链接、孤立笔记和断链，可以联网，还会统计费用。改文件前默认会请你确认。

## 怎么选

| 需求 | 选择 |
|---|---|
| 写作、改稿、全库问答、MCP | Smart Composer |
| 多步 Agent、Skills、长期项目 | Copilot（opencode + DeepSeek BYOK） |
| 简单、省钱、直接操作笔记 | Real Chat |
| 批处理、脚本化、在终端里操作 | [[DeepSeek CLI + Obsidian 联动\|deepseek-cli]] |

## 注意

- 笔记内容会发送到 DeepSeek 的服务器，敏感笔记请先排除，或改用本地 Ollama 模型。
- 插件可以修改文件，建议配合 Obsidian Git 或定期备份。
- 手机端：Smart Composer 的 MCP 和 Copilot 的 Agent 都只能在桌面端用；普通聊天在手机上可以用。
