# AI 助手回复

## 2026-10-15 · Obsidian 中文论坛热门插件推荐（按本库需求）

> 依据：本仓库文档 + [Obsidian 中文论坛](https://forum-zh.obsidian.md/) 热帖/经验贴（2025–2026）。原则：少而精；补齐中文编辑与结构能力，不重复已有 YOLO / Sync。

### 本库画像（筛选轴）

| 维度 | 现状 | 选型含义 |
|---|---|---|
| AI | 已自用 **YOLO (XOX)**（聊天、改笔记、知识库 BGE Chinese、MCP） | 不要再装 Smart Composer / 官方 YOLO / Copilot |
| 语言 | 中文说明与笔记为主，文档很长 | 优先 Easy Typing、Quiet Outline、Various Complements |
| 同步 | 方案是 **官方 Obsidian Sync + Git** | 不要叠 Remotely Save / Fast Note Sync / Sync Engine |
| 结构 | YAML `tags`、复选框待办、`AI协作/交接日志` | Dataview、Templater、QuickAdd、Linter 有用 |
| 性能 | YOLO `main.js` 约 5.8MB | Lazy Plugin Loader 值得试 |
| 多设备 | Windows + 手机 Sync（待办 P7） | Remember Cursor Position、Editing Toolbar |
| 已装插件 | 仓库 `.obsidian/plugins/` 里目前只有 `obsidian-yolo` | 下面推荐都是「缺口补齐」 |

---

### 第一优先（建议本周装）

| 插件 | 对应需求 | 为什么适合本库 | 论坛依据 |
|---|---|---|---|
| **Easy Typing** | 中文写作 | 中英文空格、符号配对、全角转半角；中文社区几乎标配 | [专帖 #10336](https://forum-zh.obsidian.md/t/topic/10336)；[#49932](https://forum-zh.obsidian.md/t/topic/49932)、[#10622](https://forum-zh.obsidian.md/t/topic/10622)、[#37224](https://forum-zh.obsidian.md/t/topic/37224) 常用清单 |
| **Quiet Outline** | 读长文档 | 按需展开大纲，适合《使用说明》《YOLO 文档》 | #49932 称「最好的大纲」；#37224 |
| **Various Complements** | 双链 + 中文分词 | 减轻 `[[链接]]` 输入成本 | #49932 PC/安卓均列入 |
| **Dataview** | 待办与元数据查询 | 可按 tags/复选框汇总进度页、交接条目 | [#47228](https://forum-zh.obsidian.md/t/topic/47228) 评为核心级；#10622；[/top](https://forum-zh.obsidian.md/top) 仍有 DataviewJS 热帖 |
| **Templater** | 结构化新建 | 文件夹模板、脚本、可拼 QuickAdd；适合交接日志模板 | #47228「必不可少」；#10622 |
| **QuickAdd** | 快速捕获 / 宏 | 一键新建日记、交接条目、捕获灵感 | #47228、#10622 |

---

### 第二优先（装完第一批再加）

| 插件 | 对应需求 | 为什么适合本库 | 论坛依据 |
|---|---|---|---|
| **Linter** | frontmatter 统一 | 批量规范 `tags` / `updated`，与本库文档风格一致 | #47228、#10622 |
| **Lazy Plugin Loader** | 启动速度 | 延迟加载非核心插件；YOLO 较重时尤其有感 | #49932 |
| **Remember Cursor Position** | 多设备续写 | 重开笔记回到上次光标 | #49932 |
| **Style Settings** | 外观微调 | 主题/插件样式统一开关 | #49932、#10622 |
| **Translay Translator / I18N** | 插件汉化 | 英文 UI 翻译；2026 Top 有 Translay 高浏览帖 | [/top](https://forum-zh.obsidian.md/top)；#49932 |
| **Editing Toolbar** | 手机编辑 | 降低移动端 Markdown 摩擦 | #49932 安卓清单 |

---

### 第三优先（有明确场景再装）

| 插件 | 场景 | 依据 / 注意 |
|---|---|---|
| Commander (cmdr) | 自定义侧栏命令 | YOLO 文档提到可绑定「接受补全」；#10622 |
| Settings Search | 设置项搜索 | 插件多了以后刚需 |
| Tag Wrangler | 批量改标签 | 本库大量 tags |
| Calendar / Calendar Hub | 日记 | Hub 在 2026 Top；没开日记可跳过 |
| Vtable | 表格增强 | 2026 Top 热帖 |
| Local REST API + E2N | B站/小红书等剪藏 | E2N 在 2026 Top；端口避开 YOLO MCP `28124`（常见冲突在 27123/27124） |
| Weread | 微信读书划线 | 有读书习惯再装；#47228 |
| Note Refactor | 长文拆笔记 | 说明文档膨胀时有用 |

---

### 明确不推荐（对本库）

| 插件 / 类别 | 原因 |
|---|---|
| Smart Composer / 官方 YOLO / Copilot | 与 YOLO (XOX) 重叠或冲突；《使用说明》明确禁止同装 |
| Vault Curate / Smart Connections | 语义搜索已由 YOLO + BGE Chinese 覆盖 |
| Remotely Save / Fast Note Sync / Sync Engine | 虽是 2026 论坛同步热帖，但本库已选官方 Sync；《多设备与 Obsidian Sync》要求勿叠同步工具 |
| 独立 Spaced Repetition（若已开 YOLO Learning） | YOLO 学习模块已有间隔重复，避免双系统 |

---

### 建议安装顺序

1. **第 1 天**：Easy Typing → Quiet Outline → Various Complements  
2. **第 2–3 天**：Templater + QuickAdd（先做 1–2 个模板）→ Dataview  
3. **稳定后**：Linter、Lazy Plugin Loader、Remember Cursor Position、Style Settings、汉化；手机再加 Editing Toolbar  

装完若要我帮写 Dataview 查询块或 Templater 交接日志模板，直接说即可。

配置步骤已写成任务书，交给本地 Claude 时说：「按 `AI协作/任务书·插件配置.md` 配置插件」。交接日志入口是 `#002`。

## 2026-10-15 · Obsidian 中文论坛社区主题推荐（按本库需求）

> 主题一次只能启用一个。下面按「这个库怎么用」筛选，不是把论坛里出现过的名字都装上。
> 热度用两套依据：中文论坛帖，以及 GitHub star（2026-10-15 查看）。Obsidian 官方没有公开主题下载量接口。

### 本库对主题的要求

| 要求 | 原因 |
|---|---|
| 长中文文档、表格、Callout 要清楚 | 《使用说明》等文档大量使用 Callout 和表格 |
| 少折腾 | 插件任务的原则是非必要不装；主题同理 |
| 不破坏「可读行宽」 | 长文需要限制行宽 |
| YOLO 侧边栏还要能用 | 主题不要靠藏界面来「变干净」 |
| 电脑和手机都能看 | 外观会随 Obsidian Sync 同步（见《多设备与 Obsidian Sync》） |
| 现在还是默认主题 | 仓库里没有提交过 `appearance.json`，本机那份不要推进 Git |

### 主推荐：Minimal

社区里的名字是 **Minimal**，作者 kepano，仓库 `kepano/obsidian-minimal`。不要装成 Minimal Edge、Minimal Dracula 这类名字相近的主题。

| 依据 | 内容 |
|---|---|
| 论坛 | [求一个清爽的不费眼的主题 #8712](https://forum-zh.obsidian.md/t/topic/8712)：多人直接推荐 Minimal，评价是简洁、实用。侧边栏字小可以用配套设置放大 |
| 维护 | GitHub 5428 star，2026-10-06 仍在更新。官方文档写明支持桌面、手机、平板，并单独照顾了 Dataview（本库插件推荐里有它） |
| 和本库的匹配 | 朴素，不靠背景图和彩色文件夹。没有 Blue Topaz 那种黄色 Callout 被旋转的问题 |
| 配套 | 插件 **Minimal Theme Settings**（id `obsidian-minimal-settings`）。Style Settings 可选，第一周不要用它改配色 |

启用后保持默认配色，不要开彩色标题，不要装 Hider（会把工具栏藏起来）。明暗跟随系统。界面字体用 Windows 已有的中文字体，不要另外下载字体。

### 备选（先用过 Minimal，不满意再换一个）

| 主题 | 仓库 | star / 最近更新 | 什么时候换 | 论坛依据 |
|---|---|---|---|---|
| **Things** | `colineckert/obsidian-things` | 1024 / 2026-06-07 | 觉得 Minimal 太素，又不想花时间调 | [#8712](https://forum-zh.obsidian.md/t/topic/8712) 推荐它清爽；[#17747](https://forum-zh.obsidian.md/t/topic/17747) 里「可读行宽」仍然有效。搜索时认这个仓库，不要装成 Things 3 |
| **Border** | `akifyss/obsidian-border` | 2517 / 2026-10-06 | 想要卡片边框，但仍要持续更新的主题 | 中文论坛有人把它当日常主题（[#53448](https://forum-zh.obsidian.md/t/topic/53448)）。装饰比 Minimal 多 |
| **Baseline** 或 **Cupertino** | `svnaxis/obsidian-baseline`、`svnaxis/obsidian-cupertino` | 1559 / 2026-10-12；1277 / 2026-10-08 | 想要 2026 年还在更新的朴素主题 | [两年半使用排行 #62728](https://forum-zh.obsidian.md/t/topic/62728)（2026-07-22）：Baseline 在作者 2026 年使用时长前五；若去掉作者自己的 Brutal Gum，Cupertino 会进前五 |

### 论坛里很有名，但这库先不选

| 主题 | 为什么先不选 |
|---|---|
| **Blue Topaz**（`pkm-er/Blue-Topaz_Obsidian-css`，1640 star，2026-08 仍更新） | 中文社区最有名的主题之一（[介绍帖 #1664](https://forum-zh.obsidian.md/t/topic/1664)）。默认观感偏乱，要靠 Style Settings 才能清爽（#8712）。有人一调就是一个半小时（[#41559](https://forum-zh.obsidian.md/t/topic/41559)）。会让「可读行宽」失效（#17747）。黄色 Callout 会被旋转，2025–2026 年论坛还在修（[#52775](https://forum-zh.obsidian.md/t/topic/52775)）。本库说明文档大量使用 Callout |
| **AnuPpuccin**（`AnubisNekhet/AnuPpuccin`，3420 star） | [#62728](https://forum-zh.obsidian.md/t/topic/62728) 里个人累计使用最长（61 天）。仓库 2024-12-01 之后没有再推送。本库 Obsidian 是 1.14，隔了太久，不拿它当第一套 |
| **Shimmering Focus** | 同一篇排行里作者写明装饰性强、风格独特。不适合这批说明文档 |
| **Composer、Dawn、Iridium** | 出现在 #62728 的个人时长榜上，但 star 只有几十。那是一个人的 git 记录，不是社区热门 |
| **Brutal Gum** | 排行作者自己开发的主题，文中已声明排名会偏高 |

#62728 的数字是作者从自己的 `appearance.json` git 历史算出来的使用天数，不是全论坛投票，也不是商店下载量。

### 不要做的事

- 一次启用多个主题，或先把备选全装上。
- 为了好看加一堆 CSS 片段。排行作者自己也是打补丁才把主题调顺的。
- 把 `appearance.json`、`.obsidian/themes/` 提交进这个仓库。外观交给 Obsidian Sync。

配置步骤在 `AI协作/任务书·主题配置.md`。交给本地 Claude 时说：「按 `AI协作/任务书·主题配置.md` 配置主题」。交接日志入口是 `#003`。
