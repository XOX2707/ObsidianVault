# EVAL：Linux 教程评估与改写说明

评估对象：Obsidian 库内「计算机/操作系统/Linux」原文（README + 00–04）  
改写产出：`/workspace/linux-tutorial/debian11/`（2026-10-28 Debian 11 专业实验版）  
实机参照：Debian 11.1，`192.220.37.75`，SSH `62027`，3x-ui v3.11，面板 `35123`，节点备注 `US-9929`，实通入站口 `39521`，Clash Verge Rev mixed-port `12334`

---

## 总体评分

| 维度 | 原文 | 改写后目标 | 说明 |
| --- | --- | --- | --- |
| 内容准确度 | 7/10 | 9/10 | 原文主路径正确；Clash 端口、443/高端口、代理规则字段有硬伤 |
| 可操作性 | 8/10 | 9/10 | 原文步骤能跑通；缺统一「预期输出 / 验收勾选」 |
| 结构 | 6/10 | 9/10 | 原文偏日记串联；改写统一课结构 |
| Debian 11 适配 | 6.5/10 | 9/10 | 原文已点 Debian 11.1，但 apt/sysctl/systemd 交代不足 |
| 安全卫生 | 5/10 | 8/10 | 有基础提醒；缺占位符纪律与「面板仅本机」进阶路径 |

**综合**：原文作为「当晚边做边记」很有价值；作为可复用实验讲义需结构化与纠错。改写保留温度与 wiki 链接，升格为专业 lab notes。

---

## 原文优点

1. **目标清晰**：为 VPS 搭代理闭环服务，动机真实，学习顺序「边学边做」合理。
2. **踩坑表质量高**：尤其 03/04（安全组、502、REALITY 空密钥、Clash 订阅分组）来自实战，含金量超过多数复制粘贴教程。
3. **端口意识**：一开始就强调 SSH 非 22（`62027`），避免新手最大坑。
4. **Obsidian 友好**：frontmatter、`[[wiki links]]`、术语表、学习地图齐全。
5. **BBR / 面板概念**用大白话讲清「做什么、不做什么」，适合 Windows 转 Linux 读者。

---

## 主要问题

1. **口吻日记化**：时间戳（「今晚」「21:32 实测」）、聊天式衔接适合私密笔记，不利复训与分享；缺统一的「目标 / 验收 / 回滚」骨架。
2. **Clash mixed-port 过时/不准**：写默认 `7897`；本机 Verge Rev 实为 **`12334`**，按原文 curl 会误判「节点没通」。
3. **443 vs 实机端口**：教程写死 443；实机因**机房过滤 443 入站**改用 **`39521`**。原文踩坑表有一句，但正文仍以 443 为主叙事，易让读者以为本机防火墙问题。
4. **缺少可勾选验收标准**：成功标准散落在「成功的样子」里，复训时不易自检。
5. **安全建议偏薄**：提了路径/密码/Fail2ban，但未强调「密钥永不进笔记」、未给出「面板绑 localhost + SSH 隧道」作为明确下一硬措施；存在把真实路径写进笔记的示范风险（路径示例可保留形状，密码/UUID/私钥必须占位）。
6. **sysctl 重复追加风险**：`echo >> /etc/sysctl.conf` 无幂等；多次上课会堆重复行。
7. **面板经 Clash 502**：有正确直觉，但规则示例易写成 **SRC-IP-CIDR**；应为 **`IP-CIDR,192.220.37.75/32,DIRECT`**。
8. **Debian 适配点到为止**：未系统写出 bullseye / apt / systemd / 内核 5.10 与 BBR 的对应关系。
9. **下一课指针不一致**：01 文末仍写「第一件事是装面板」，跳过了已存在的 BBR 课。

---

## 改写做了什么

1. 统一课结构：frontmatter → 标题/回链/前置 → **目标 / 验收标准** → 前置条件 → **编号步骤 + 预期输出** → 验证 → 踩坑/回滚 → 一句话/下一课。
2. 明确 **Lab Scope = Debian 11 bullseye**：apt、systemd、sysctl、内核 5.10、sshd 端口现实。
3. 纠正 Clash：**mixed-port `12334`**，并注明与常见默认 7897 的差异。
4. 端口策略：**优先 443；过滤则用高端口（文档实机 39521），三处同步**。
5. 面板直连规则改为 **IP-CIDR**；强调 Clash 系统代理导致 502。
6. BBR：推荐 `/etc/sysctl.d/99-bbr.conf` 或 `grep -q || echo`；双验证 `sysctl` + `lsmod`。
7. 密钥纪律：`<root密码>` / `<面板密码>` / `<uuid>`；不写私钥与完整链接。
8. 安全：Fail2ban、路径非 `/`、强密码；**面板仅本机 + SSH `-L`**：改写时写为下一加固；写回前已按 2026-10-28 实机状态注明「本实验机已完成」。
9. README 改为学习地图：范围、索引状态、术语、实验室规矩、2026-10-28 changelog（备份 `_backup-2026-10-28`）。
10. 保留中文 Obsidian 文件名与 wiki 链接，便于拷回库内。

---

## 仍建议后续补的课

| 课题 | 理由 |
| --- | --- |
| systemd 基础 | `systemctl` / 开机自启 / 失败状态解读 |
| journalctl | 面板与 xray 排错主路径 |
| 防火墙（nftables/ufw 或厂商安全组对照） | 与「机房过滤 443」区分责任面 |
| SSH 密钥登录 + 禁用密码 | 取代长期 root 密码登录 |
| 面板仅监听 localhost + SSH 隧道 | 去掉公网面板暴露 |
| apt 镜像与 unattended-upgrades | 源慢与安全更新 |
| 备份与迁移 | `x-ui` Backup、`x-ui.db` 纪律 |

---

## 产出文件列表

```text
/workspace/linux-tutorial/debian11/README.md
/workspace/linux-tutorial/debian11/00 什么是 Linux.md
/workspace/linux-tutorial/debian11/01 今晚第一课：SSH 连上服务器.md
/workspace/linux-tutorial/debian11/02 第二课：开 BBR（网络提速）.md
/workspace/linux-tutorial/debian11/03 第三课：装 3x-ui 面板.md
/workspace/linux-tutorial/debian11/04 第四课：开第一个节点（VLESS + REALITY）.md
/workspace/linux-tutorial/debian11/EVAL.md
```
