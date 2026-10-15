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
