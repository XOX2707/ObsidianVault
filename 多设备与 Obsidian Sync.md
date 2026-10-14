---
tags: [说明, 同步, Obsidian Sync, 多设备]
updated: 2026-10-15
---

# 多设备与 Obsidian Sync

目标：**主电脑**继续负责写笔记、改插件、配合 AI；**手机**随时查看和编辑笔记；**其他电脑**按需要选择“只用笔记”或“也要开发”。

总说明见 [[使用说明]]，进度见 [[项目进度与待办]]。

---

## 0. 先搞清楚：Git 和 Obsidian Sync 各管什么

| | Git（GitHub 仓库） | Obsidian Sync |
|---|---|---|
| 同步什么 | 文档、插件源码、`CLAUDE.md`、交接日志 | **笔记本身**，以及你选择同步的 Obsidian 设置和插件 |
| 适合 | 开发、版本历史、和云端 Claude 协作 | 手机、多台电脑之间**自动、实时**同步笔记 |
| 手机能用吗 | 基本不行 | **能** |
| 隐藏文件夹（`.git`、`YOLO/.yolo_json_db` 等） | 照规则提交 | **不同步**（`.obsidian` 由下面第 2 节的开关单独管理） |
| 加密 | GitHub 私有仓库 | 可以设端到端加密密码 |

**两者可以同时用**，分工如下：
- 笔记在设备之间的同步交给 **Obsidian Sync**。
- 代码、文档、AI 交接只在**主电脑**上用 **Git** 提交和拉取。
- 其他设备**默认不碰 Git**，除非那台电脑也要开发（见第 4.2 节）。
- 不要再叠加 OneDrive、iCloud、坚果云之类的同步盘，多个同步工具同时改同一批文件会互相打架。

---

## 1. 主电脑：开通并连接 Obsidian Sync

1. 在 [Obsidian 官网](https://obsidian.md/sync) 订阅 Sync，然后在 Obsidian 里用同一个账号登录：设置 → 通用 → 账户。
2. 设置 → 核心插件 → 打开「**同步**」。
3. 设置 → 同步 → 远程仓库「选择」→ **新建远程仓库**：
   - 名字随便起，比如 `ObsidianVault`。
   - **建议设置端到端加密密码**，并把它记在密码管理器里。忘了就解不开，官方也找不回。
4. 点「连接」，等第一次上传完成（右下角的同步图标变成对勾）。

### 1.1 排除不需要同步的文件夹

设置 → 同步 → **排除的文件夹**，添加：

| 文件夹 | 原因 |
|---|---|
| `deepseek-cli` | 只是 npm 包的存档，手机上用不到 |
| `AI协作`（可选） | AI 之间的交接信箱，靠 Git 同步就够了；想在手机上看可以不排除 |

---

## 2. 设置和插件的同步开关（每台设备都要单独打开）

设置 → 同步 → 「**设置同步**」（Vault configuration sync）。下面这些开关**每台设备都要单独打开一次**，不会自动跟着同步：

| 开关 | 建议 | 说明 |
|---|---|---|
| 主要设置、外观、主题、快捷键、核心插件设置 | 打开 | 换设备后界面和习惯保持一致 |
| **已启用的第三方插件列表** | 打开 | 同步“启用了哪些插件” |
| **已安装的第三方插件** | 打开 | 同步插件文件本身（`main.js`、`manifest.json`、`styles.css`），以及插件设置 `data.json` |

> [!warning] YOLO (XOX) 的 `main.js` 大约 5.8MB
> 第三方资料显示，Obsidian Sync **Standard** 套餐的单个文件上限是 **5MB**，这样 YOLO 的 `main.js` 传不到其他设备。具体限制以 Obsidian 官方页面为准。
> - 订阅的是 **Plus** 套餐（单个文件上限更高）：插件会自动传到手机和其他电脑。
> - 订阅的是 **Standard** 套餐：笔记照常同步，但 YOLO 插件要在其他电脑上手动安装（见第 4.1 节），手机上暂时用不了 YOLO。
>
> 打开开关后，到 设置 → 同步 → 「查看同步日志」，看有没有 `obsidian-yolo/main.js` 上传失败或被跳过的记录。

> [!note] 插件文件夹里的源码和 `node_modules`
> 按第三方资料和论坛里的同步日志，Obsidian Sync 对第三方插件只传运行需要的文件，**不会**上传插件目录里的 `src/`、`node_modules/` 这些开发文件。第一次打开开关后，还是建议看一眼同步日志，确认没有成批上传 `node_modules`。如果有，立刻关掉「已安装的第三方插件」，然后告诉我。

> [!note] API Key 也会跟着同步
> YOLO 的 Key 存在插件的 `data.json` 里。打开「已安装的第三方插件」后，**DeepSeek Key 会同步到手机和其他电脑**，所以别的设备不用重新填。数据在 Sync 里是加密传输的。不希望 Key 离开主电脑的话，就不要打开这个开关，到其他设备上手动安装插件、单独填 Key。

---

## 3. 手机

1. 安装 Obsidian（iOS 在 App Store，Android 在 Google Play），用同一个账号登录。
2. 启动页选「**同步远程仓库**」（就是你截图里的那个按钮）→ 选择 `ObsidianVault` → 输入加密密码 → 等待下载完成。
3. 设置 → 同步 → 按第 2 节打开设置同步开关；再到 设置 → 第三方插件 → 关闭安全模式。
4. **手机上能做的**：查看和编辑所有笔记，查看 YOLO 的聊天记录（`YOLO/data/chats/` 会随 Sync 同步过来）。
5. **手机上 YOLO 的限制**（插件同步过来以后）：
   - 能用：和 DeepSeek 聊天、改笔记、Quick Ask。
   - 不能用：MCP、本地嵌入模型、终端、CLI 运行时（都是只有电脑上才有的功能）。
   - 知识库索引存在每台设备自己的浏览器数据库里，**不会同步**。手机上没有本地嵌入模型，所以只能做关键词检索。
   - 如果请求失败：设置 → 模型 → DeepSeek 提供商 → 网络请求方式改成「**Obsidian 内置请求**」。如果你的网络需要代理，手机上也要开代理 App（可以用 TUN 或全局模式）。

---

## 4. 其他电脑

先选一种用法：

| 用法 | 适合 | 需要装 |
|---|---|---|
| **4.1 只用笔记**（推荐） | 看、写笔记，用 YOLO 和 AI 聊天 | Obsidian（Node.js 和 Git 都不用装） |
| **4.2 也要开发** | 改插件代码、用 Claude Code、deepseek-cli、和云端 Claude 协作 | Obsidian、Git、Node.js 20 或以上 |

### 4.1 只用笔记（只用 Obsidian Sync）

1. 安装 Obsidian，登录账号。
2. 启动页选「**同步远程仓库**」→ 选择 `ObsidianVault` → 选一个**空文件夹**存放，比如 `C:\Users\<你的用户名>\Documents\ObsidianVault` → 输入加密密码 → 等待下载完成。
3. 设置 → 同步 → 按第 2 节打开设置同步开关；设置 → 第三方插件 → 关闭安全模式。
4. **YOLO 插件**：
   - Sync 是 **Plus** 套餐：插件会自动出现，启用 **YOLO (XOX)** 就行。
   - Sync 是 **Standard** 套餐：从主电脑的 `.obsidian\plugins\obsidian-yolo\` 里复制 `main.js`、`manifest.json`、`styles.css` 这 3 个文件（用 U 盘或网盘都行），放到这台电脑库里的 `.obsidian\plugins\obsidian-yolo\` 下，然后重启 Obsidian 并启用。没打开插件同步的话，再填一次 DeepSeek Key。
5. 知识库：在这台电脑上重新下载本地嵌入模型、重建索引（[[使用说明]] 第 5.3 节），因为索引不跟着同步。
6. 如果这台电脑也需要代理：开代理软件的系统代理或 TUN 模式，YOLO 会自动跟随（[[使用说明]]）。

**注意**：这台电脑**不要**做 `git pull` 或 `git commit`。它没有 Git，笔记全靠 Sync 同步。

### 4.2 也要开发（Git 加 Obsidian Sync）

> 前提：`git`、`node -v`（20 或以上）都能运行。如果访问 GitHub 或 DeepSeek 需要代理，先打开代理（TUN 模式最省事）。

1. 在一个**空文件夹**里拉取仓库，路径有空格的话要加引号：
   ```powershell
   git config --global core.longpaths true
   git config --global core.quotepath false
   cd "D:\ObsidianVault"          # 换成你的空文件夹
   git clone https://github.com/XOX2707/ObsidianVault.git .
   ```
2. 构建插件：
   ```powershell
   cd ".obsidian\plugins\obsidian-yolo"
   npm ci
   npm run build
   ```
3. 用 Obsidian「**打开本地仓库**」选中这个文件夹，然后在 设置 → 同步 里**连接同一个远程仓库** `ObsidianVault`。Sync 会把只存在 Sync 里、Git 里没有的笔记合并进来。
4. 第一次同步完成后，运行 `git status`，确认 Sync 没有把 `data.json`、聊天记录之类不该提交的文件带进 Git 的待提交列表（`.gitignore` 已经忽略了它们）。
5. 按需安装 deepseek-cli、Claude Code，再建 `.mcp.json`（[[使用说明]] 第 6 节）。`CLAUDE.md` 和交接日志会通过 Git 一起拉下来，本地 Claude Code 照常能用。

**多台开发电脑的规则：**
- **同一时间只在一台电脑上做 Git 提交。** 换电脑前，先在原来那台电脑上提交并推送；到新电脑上先 `git pull`，再开始改。
- Sync 和 Git 同时改同一个文件时，Sync 有可能生成冲突副本，文件名里会带 “conflict”。看到这种文件，比较一下内容，留对的那份，删掉另一份。
- 插件代码以 Git 为准。在一台电脑上改完插件，另一台电脑要 `git pull` 后重新 `npm run build`。

---

## 5. 常见问题

| 现象 | 原因和处理 |
|---|---|
| 手机上没有 YOLO 插件 | Sync 是 Standard 套餐，`main.js` 超过 5MB 传不过去；或者没打开「已安装的第三方插件」开关。升级 Plus，或者在手机上暂时只看笔记 |
| 新电脑上 YOLO 没有 Key | 没打开「已安装的第三方插件」（`data.json` 没同步过来）。手动填一次 Key |
| 新电脑上知识库只能关键词检索 | 索引不跟着同步，在这台电脑上重建（[[使用说明]] 第 5.3 节） |
| 出现文件名带 “conflict” 的笔记 | 两台设备同时改了同一篇笔记。合并内容后删掉多余的那份 |
| Sync 日志里出现大量 `node_modules` | 立刻关掉「已安装的第三方插件」开关，告诉云端 Claude 或本地 Claude Code 排查 |
| 手机上请求 DeepSeek 失败 | 网络请求方式改成「Obsidian 内置请求」；需要代理的话，打开手机上的代理 App |

---

参考：[Obsidian Sync 设置说明](https://obsidian.md/help/sync/settings)，以及 Obsidian 论坛上关于插件同步的讨论：[#65062](https://forum.obsidian.md/t/obsidian-sync-doesnt-sync-plugins/65062)、[#62804](https://forum.obsidian.md/t/obsidian-sync-how-to-sync-only-some-community-plugins-to-mobile/62804)。文中第三方资料的结论没有经过官方确认，以 Obsidian 官方页面和你自己的同步日志为准。
