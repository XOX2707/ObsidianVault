# ObsidianVault

一个**每天在用的 Obsidian 个人知识库**，仓库根目录就是库根目录。它同时是三样东西：

- **知识库**：学习（转专业计科对齐、计算机 MOOC、线代、学校课程）、生活（日记、想法、兴趣、游戏）、交易经济专题，全在这里
- **AI 中枢**：自用版 Obsidian AI 插件 **YOLO (XOX)** 的源码、终端工具 **deepseek-cli** 的存档，以及一套多位 AI 协作的规则和信箱
- **自动化**：`scripts/` 里的一批脚本负责文件清单、网易云听歌日记、epub 转 txt、对话拆分等日常杂活

> 完整说明请看 **[使用说明](<使用说明.md>)**；当前进度一眼看 **[用户看板（纪律二）](<AI协作/用户看板·步骤与进度（纪律二）.md>)**。

## 库地图

| 区域 | 位置 | 一句话 |
|---|---|---|
| 仪表盘 | `仪表盘/` | 日常入口：时间表、文件清单（Dataview 动态版 + 静态兜底）、最近对话、任务计划总表 |
| AI 协作区 | `AI协作/` | AI 之间的交接日志、给人看的进度看板、跨 AI 全局纪律 |
| AI 对话档案 | `AI对话/` | 近 600 篇历史对话按 15 个主题归档，入口 `00 总索引` |
| 转专业 | `转专业/` | 计科本科对齐学习方案 + 每周学习节奏（2026-10-28 改版，旧机构方案已归档） |
| 计算机 | `计算机/` | 计科九大知识域（00 导论 ~ 08 软工）的 MOOC 笔记与实验，入口 `README` 和 `课程地图` |
| 线性代数 | `线性代数/` | 寻寻讲义的线代课，一课一练，入口 `00 课程地图` |
| 学校 | `学校/` | 课堂记录与实验报告（人工智能通识 A、思想道德与法治等） |
| 经济专题 | `Economic Study For Transaction/` | 杠杆与保证金、btc-neff 学习路线、FOMO 等，入口 `00 专题首页` |
| 想法 | `想法/` | 点子、感悟、复盘，一篇一个主题 |
| 兴趣 | `兴趣/` | 网易云 1213 首口味档案、练字等 |
| 游戏 | `游戏/` | 围住神经猫攻略、聪明猫开发清单 |
| 设备 | `设备/` | 平板、随身 WiFi 等设备记录 |
| 账单 | `账单/` | 大额账单与 AI、订阅花费的记账，规则见 `账单/记账规则.md` |
| 日记 | `日记/` | 每天一篇，AI 帮忙做完事会顺手记一笔 |
| 电子书 | `epub/` | 轻小说等电子书收藏 |
| 输入法 | `Rime配置/` | 小狼毫 + 雾凇拼音的自定义配置备份 |
| YOLO (XOX) 源码 | `.obsidian/plugins/obsidian-yolo/` | Obsidian 里的 AI 侧边栏，基于 [Lapis0x0/obsidian-yolo](https://github.com/Lapis0x0/obsidian-yolo) 1.6.11，插件 id 改为 `yolo-xox`，关闭了官方自更新，补齐了新版 Claude 模型的支持。改代码前先读该目录自己的 `CLAUDE.md` |
| YOLO 数据与记忆 | `YOLO/` | 插件运行数据、`提示词/`，以及各助手共用的记忆树 `memory/`（`global/` 所有助手共享，`Default/` 默认助手专用） |
| deepseek-cli 存档 | `deepseek-cli/` | `@kavienw/deepseek-cli@0.5.0` 的编译产物，只读存档不要改；要用请运行 `npm i -g @kavienw/deepseek-cli` |
| 脚本 | `scripts/` | 文件清单、网易云听歌日记、epub 转 txt、DeepSeek 对话拆分等 |

## AI 怎么在这个库里工作

库里日常有几位 AI 助手，互相不记得对方的对话，靠仓库里的两个信箱交接（`AI协作/交接日志.md` 正式任务、`AI助手回复.md` 给用户看的回复）：

| 助手 | 在哪 | 干什么 |
|---|---|---|
| YOLO (XOX) 侧边栏 | Obsidian 内 | 聊天、改笔记、搜全库、写作补全。日常走 DeepSeek（`deepseek-v4-pro` / `deepseek-v4-flash`），难任务切 Claude（`claude-opus-5-5` 等） |
| deepseek-cli | 终端 | 终端里的 DeepSeek 助手，能读写库文件、经 MCP 搜全库 |
| Claude Code | 终端 | 本地编程与库维护，启动时自动读 `CLAUDE.md` |
| Cursor | IDE | 难仓库、长命令、靶机，启动时读 `AGENTS.md` |
| Grok | 终端 / Grok Bot（ShaWarma） | 终端里是审查员：只看 git diff、提意见，不改文件；Grok Bot 按库内勾选做执行、线上复核和例行简报 |
| 寻寻 | YOLO / Claude Code | 守库规矩、批改线代作业、拍板买退 |

两条跨 AI 纪律（[跨AI全局环境变量（纪律一二）](<AI协作/跨AI全局环境变量（纪律一二）.md>)，所有模型进库第一时间读）：

- **纪律一**：AI 之间传对接 Script 只从对话框整段复制，不开 Markdown 手抄
- **纪律二**：给人看的步骤与进度只认 [用户看板](<AI协作/用户看板·步骤与进度（纪律二）.md>) 这一篇

规则文件：`CLAUDE.md`（Claude Code 启动必读）、`AGENTS.md`（Cursor 等）、`DEEPSEEK.md`（deepseek-cli）。共同底线：不读取或提交任何密钥、只提交自己改过的文件、推送前先问用户、帮用户做完事顺手记进当天日记。

## 学习主线（2026-10 起）

- **转专业**：目标对齐南京工程学院计算机科学与技术本科，主课走中国大学 MOOC。总方案 [计科本科对齐学习方案](<转专业/计科本科对齐学习方案（南工程·中国大学MOOC）.md>)，节奏 [每周学习节奏（计科对齐）](<转专业/每周学习节奏（计科对齐）.md>)
- **计算机**：[课程地图](<计算机/课程地图.md>) 从 00 计算思维导论走到 08 软件工程，当前主推 C 语言
- **线性代数**：[课程地图](<线性代数/00 课程地图.md>) 是寻寻写的讲义课，一课没弄懂不往下走
- **学校**：课堂记录和实验报告在 `学校/`，按每门课的要求分层记（例如人工智能通识 A 只要求了解名词，公式推导放拓展）

## 文档

| 文档 | 内容 |
|---|---|
| [使用说明](<使用说明.md>) | **从这里开始**：安装、三种使用方式、配置要点、费用、排错 |
| [项目进度与待办](<项目进度与待办.md>) | 插件与仓库的历史进度和待办清单（实时进度现在看用户看板） |
| [多设备与 Obsidian Sync](<说明文档/多设备与 Obsidian Sync.md>) | 手机、平板和其他电脑的使用说明 |
| [本地助手 vs Obsidian Agent 分工](<说明文档/本地助手 vs Obsidian Agent 分工.md>) | 几个 AI 助手的区别、费用和分工 |
| [YOLO 改写与配置文档](<说明文档/YOLO 改写与配置文档.md>) | YOLO (XOX) 插件的完整手册 |
| [DeepSeek CLI + Obsidian 联动](<说明文档/DeepSeek CLI + Obsidian 联动.md>) | deepseek-cli 的作用、配置和局限 |
| [Obsidian 内嵌 AI 插件 + DeepSeek 操作流程](<说明文档/Obsidian 内嵌 AI 插件 + DeepSeek 操作流程.md>) | 当初的插件选型调研（仅供参考） |
| [新手README·搭一个AI知识库](<说明文档/新手README·搭一个AI知识库.md>) | 给完全不懂电脑的朋友的极简版，从零搭一个「会记事的 AI + 知识库」 |
| [说明文档/](<说明文档/>) | 其余说明：Claude API 计费、改动历史、Agent 行为差异等 |
| [AI协作/交接日志](<AI协作/交接日志.md>) | AI 之间的任务交接信箱 |
| [AI协作/用户看板·步骤与进度（纪律二）](<AI协作/用户看板·步骤与进度（纪律二）.md>) | **给人看的最新进度**（纪律二准源） |
| [AI协作/跨AI全局环境变量（纪律一二）](<AI协作/跨AI全局环境变量（纪律一二）.md>) | 所有模型进库第一时间读的两条纪律 |

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

1. 用 Obsidian「打开本地仓库」，选中这个文件夹
2. 设置 → 第三方插件 → 关闭安全模式 → 启用 **YOLO (XOX)**。不要同时安装 Smart Composer 或官方 YOLO
3. 设置 → YOLO (XOX) → 模型 → 添加提供商 → **DeepSeek**，粘贴 Key，启用 `deepseek-v4-pro` 和 `deepseek-v4-flash`
4. 可选：再添加 **Anthropic** 提供商，用 Claude 模型（`claude-opus-5-5` 等），见 [使用说明](<使用说明.md>)

详细步骤见 [使用说明](<使用说明.md>)。

## 更新

```powershell
git pull
cd ".obsidian\plugins\obsidian-yolo"
npm run build
```

然后在 Obsidian 里重新加载插件。

## 安全

- API Key 只存在本机：YOLO 的在插件目录的 `data.json`，deepseek-cli 的在 `~/.deepseek-cli/config.json`，两者都不会被提交
- `.gitignore` 已经忽略 `.mcp.json`（里面有本地 MCP token）和 YOLO 的 OAuth 凭据目录
- 给 AI 的规则（见 `CLAUDE.md`）：只 `git add` 自己改过的具体文件，不用 `git add -A`；`日记/` 是私人笔记，除非用户明确要求，否则不提交

## 协议

- 本仓库：MIT，© 2026 XOX2707，见根目录 [`LICENSE`](LICENSE)。下面两个第三方组件不在其中，各按各的协议
- YOLO 源码：MIT，© 2026 Lapis0x0，见 `.obsidian/plugins/obsidian-yolo/LICENSE`
- deepseek-cli：MIT，npm 发布者 kavienw
- 本仓库的文档由多位 AI 助手协助编写（Claude Code、DeepSeek、Cursor、Grok 等）
