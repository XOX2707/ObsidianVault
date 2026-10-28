---
tags: [AI协作, 交接, 待办, 重排]
created: 2026-10-27
---

# Claude 停摆残留 Routine 重排（2026-10-27）

起因：2026-10-22 云端 Claude 账号被封、API 组织禁用，到 10-27 电脑修好回来，中间 6 天靠寻寻（YOLO / DeepSeek）和 Grok Bot（ShaWarma）撑着。原来交给 Claude 的 Routine、Schedule、交接任务散在 [[项目进度与待办]]、[[仪表盘/时间表]]、[[AI协作/交接日志]] 里，有的已经失效，有的还能续。这里把残留翻出来重排一遍，以后以这一页为准。

> 敏感背景见 [[AI协作/给 Claude 的断连期同步（2026-10-22 至 10-27）]]，不复述。

## 一、现在就能做（不依赖 Claude，寻寻 / 用户接着干）

| 编号 | 事 | 来源 | 现状 |
| --- | --- | --- | --- |
| A1 | YOLO 打开 DeepSeek 官方联网收尾：deepseek-flash 输入模态只留文本；deepseek-v4-pro 填展示名称；默认聊天模型换新的；发句需联网的话试 | 项目进度「现在要做」第 3 条 | 10-20 已建好提供商和模型，就差这几步，随时可做 |
| A2 | YOLO 自动压缩上下文：确认 设置 → Agent → 上下文压缩 开着；Opus 上下文窗口 token 改 200000 | 项目进度「现在要做」第 4 条 | 配置类，随时可做 |
| A3 | 仓库日常维护 P6：`git remote add yolo-upstream`；`.gitignore` 加 workspace.json；决定个人笔记要不要推 GitHub；文件与链接里排除 `deepseek-cli/` | 项目进度 P6 | 本就不依赖 Claude，一直挂着 |

## 二、等 Claude 通道恢复才能做（API / 订阅都封着）

| 编号 | 事 | 卡在哪 |
| --- | --- | --- |
| B1 | 验证 YOLO 的 1 小时提示缓存（要 Claude 看缓存读取记录） | 要 Claude API 跑一次 Opus 对话才能看缓存 |
| B2 | P1.5：加 `claude-sonnet-5-5`、`claude-haiku-5-5`，Console 设月度上限 | Claude API 组织禁用 |
| B3 | P8：给 [[想法/现实与虚拟的映射]] 画八象限 SVG | 要 Claude API 画 |
| B4 | #006 上报 deepseek-cli bash 无输出问题给上游 Claude | 云端 Claude 封号，报告已就绪（`AI协作/diagnose-shell-report-2026-10-27.txt`），就差渠道：deepseek-cli GitHub issue 或等 Claude 恢复 |

## 三、计划任务残留（今天刚接手，还要善后）

| 编号 | 事 | 现状 |
| --- | --- | --- |
| C1 | `OkxDailyCheckLocal` 上次退出码 1（失败） | 要查日志；依赖 Clash Verge 代理（12334）+ 可选 Claude，见 [[仪表盘/任务计划总表]] |
| C2 | `NcmDailyDiary` 首次跑（20:30）结果没回看 | 新建的计划任务，跑一次确认当天听歌段正常生成 |

## 四、已作废 / 已重排（别再当待办）

| 事 | 处理 |
| --- | --- |
| 「回到云端会话看交接日志」 | 云端封号，作废 |
| 日本 VPS 路线 | 已弃（iOS 内购走不通） |
| 路线一全美国接 Claude | 预算不足（可支配 ¥131.73），先做门槛：IP 试用 + 学 Linux，订阅等下一笔钱，见 [[仪表盘/时间表]] |
| 重装环境 | 已取消（电脑没重装） |
| Claude Code 后台 agent（Schedule / Terminal / Monitor） | 随 Claude Code 一起停了，等官方订阅 / API 恢复再开 |

## 五、建议的顺序

1. **今晚**：A1 / A2 收尾（YOLO 配置，不花钱），或者按既定计划学 Linux（[[计算机/操作系统/Linux/README.md]]）
2. **明天**：变现阶段 0（已进 [[仪表盘/时间表]]）+ 查 C1
3. **等钱 / 等 Claude**：B 全类挂起，不占今天的精力

## 六、哪些任务真需要 Linux 服务器（2026-10-27 清点）

用户问：之前跟 Claude Code 提过的「只有 / 推荐 Linux Server 才能做」的任务，全翻出来看看现实不现实。结论先说：**翻不出「只有 Linux 能做」的清单**，翻出来的这些在 Windows 上都跑过或正在跑。

| 任务 | 出处 | 现在跑在哪 | Windows 能不能 | 真需要 Linux？ |
| --- | --- | --- | --- | --- |
| Claude Code 的 Monitor 盯服务状态（`scripts/status-monitor.sh`） | 使用说明 11.1 | 2026-10-15 在 Windows 11 的 Git Bash 里**跑过**（交接日志 #002） | 能，要 bash + curl + python3 | **不需要**；现在卡的是 Claude Code 账号停了，不是系统 |
| 文件清单自动刷新（`gen_file_index.py`） | 交接日志 #007 | Windows 计划任务 `ObsidianGenFileIndex`，每天 08:05 | 能，已经在跑 | 不需要 |
| 网易云听歌日记（`ncm_daily_diary.py`） | 交接日志 #007 | Windows 计划任务 `NcmDailyDiary`，每 30 分 | 能，已经在跑 | 不需要 |
| OKX 每日检查（`run_daily_check.ps1`） | 任务计划总表 | Windows 计划任务 `OkxDailyCheckLocal`，09:15，上次失败 | 能，已经在跑 | 不需要 |
| 每日 BTC OI 简报 | 任务计划总表 | Grok Bot 云端例行 | 不占本机 | 不需要 |
| 随身 WiFi 流量提醒 | [[设备/随身WiFi]] | 卡商后台弹窗 + 对话里主动查 | 不用脚本 | 不需要 |

那台美国机器真正给的是这三样，Windows 给不了：

1. **常开**：电脑会关机、会睡眠，服务器 7×24
2. **公网**：有个公开 IP，能对外提供服务（面板、代理）
3. **不占本机**：跑东西不耗你电脑，也不怕你出门

所以「后台监工 bot」值不值得放 Linux，看的不是「Monitor 这个功能」，是**要不要 7×24**。一天跑一次的活，Windows 计划任务更省事

## 关联

[[项目进度与待办]] · [[仪表盘/时间表]] · [[AI协作/交接日志]] · [[仪表盘/任务计划总表]]
