---
tags: [AI协作, Cursor, 模型, 参考]
created: 2026-10-28
---

# Cursor 模型选择参考

来源：2026-10-27 夜，寻寻给用户的口径，2026-10-28 落成笔记备查。

## 一、模型档位（按烧额度从低到高）

| 模型 | 适合 | 烧额度 |
| --- | --- | --- |
| Auto | 让它自己按任务挑，一般最省 | ★ |
| Composer 2.5 Fast | Cursor 自家模型，快、便宜 | ★ |
| Grok 4.6 High Fast | 同上，旧一档 | ★★ |
| Grok 4.7 High Fast | 日常主力，有 X Premium 更该用 | ★★ |
| Gemini 4 Argon Medium | 中等 | ★★ |
| Muse Wonder High | 中等偏上 | ★★★ |
| Claude Opus 5.5 1M High | 最难的问题才用它 | ★★★★★ |

## 二、选型原则

- **日常活**：Auto 或 Grok 4.7 High Fast / Composer 2.5 Fast，别上 Opus
- **难活（要强推理、长上下文、精细改写）**：再手动切 Claude Opus 5.5
- Opus 5.5 贵在三样叠一起：模型单价高 + 1M 上下文（尽量塞满）+ High 推理（思考也计费）
- 拿 Opus 干「照步骤敲命令、看报错、填表单」这类活 = 开卡车买菜，不值

## 三、地区限制（重要）

- Cursor 的 **Claude 模型走 Anthropic 官方**，国内 IP 会报：
  ```
  Model not available
  This model provider is not supported in your region
  ```
- 这不是额度问题，是地区问题
- 解法：挂美国 IP（Clash 选美国节点 + 开系统代理）再切 Claude
- Grok / Composer 受地区影响小，作为兜底

## 四、和别的工具分工

| 工具 | 定位 |
| --- | --- |
| Cursor | 写代码、跑命令、改配置的本地 agent |
| Grok 网页版 / X Premium | 日常问答，榨 X Premium 的额度 |
| 寻寻（YOLO / DeepSeek） | 库里日常底座，零成本 |
| Claude（订阅/API） | 难题，走官方订阅那条路 |

## 五、计费：Cursor 是 X 订阅的一部分（2026-10-28 核实）

Cursor 不是单独买的订阅，它和 Grok、X 是同一个：**The X Subscription，Premium 档 $30/月**（年付 $300/年，约 ¥181/月）

- 付一次 Premium，Cursor、Grok、X 三边共用
- Cursor 的用量是**周额度池**，2026-10-28 用户那周用到 36%，1 天后重置
- 额度用完可以开 Additional usage credits 继续用，没开就没有额外扣费
- 所以「Cursor 花了多少钱」要分两层看：订阅是固定 $30/月，额度是烧掉的用量，不是钱

来源：Cursor 官方文档 Pricing / Models & Pricing（2026-10-28 核）

## 关联

[[AI协作/交接日志]] · [[AI协作/任务书·VPS 开节点（交 Cursor）]] · [[AI协作/Cursor 模型选择参考]] · [[AI对话/03 AI 与工具/2026-10-14 Grok Cursor Claude搭配]]
