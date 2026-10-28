---
tags: [计算机, 操作系统, Linux, BBR, Debian11]
created: 2026-10-27
updated: 2026-10-28
---

# 02 第二课：开 BBR（网络提速）

回到 [[计算机/操作系统/Linux/README|学习地图]] · 前置：[[01 今晚第一课：SSH 连上服务器]]

## 目标

在 Debian 11 上启用 **fq + BBR**，并持久化到 sysctl，使重启后仍生效。

## 验收标准

- [ ] `sysctl net.ipv4.tcp_congestion_control` 输出 `bbr`
- [ ] `sysctl net.core.default_qdisc` 输出 `fq`
- [ ] `lsmod | grep bbr` 能看到 `tcp_bbr`，引用计数 ≥ 1
- [ ] `/etc/sysctl.conf`（或 `/etc/sysctl.d/`）中 **各键只出现一次**，无重复 `echo` 堆积

## 前置条件

- 已 SSH 登录，提示符为 `root@…#`
- 内核 ≥ 4.9（Debian 11 为 **5.10**，自带 `tcp_bbr`）
- 可访问官方或镜像 apt 源（bullseye）

---

## BBR 是什么（实验相关）

TCP **拥塞控制**算法。跨洋等高延迟、易丢包链路，传统 cubic 易过度降速；BBR 更关注带宽与 RTT 估计，常能提高**大流量吞吐**。

| 能改善 | 不能改善 |
| --- | --- |
| apt 下载、传文件、代理大流量 | SSH 按键的物理 RTT（约 150–250 ms） |

---

## 步骤

### 1. 刷新索引并安装基础工具

```bash
apt update && apt install -y curl wget nano
```

| 片段 | 含义 |
| --- | --- |
| `apt update` | 更新软件索引（bullseye）；**不升级已装包** |
| `apt install -y` | 安装；`-y` 免交互确认 |

**预期**：索引拉取成功；末尾提示 `curl`/`wget`/`nano` 已安装或已是最新。首次可能需 1–2 分钟。

> 可选：若官方源过慢，可换国内 Debian 镜像（清华/中科大等 bullseye 源）。换源属运维细节，本课不展开；换完再 `apt update`。

### 2. 写入 sysctl（防重复）

**先检查是否已有配置**，避免多次 `echo >>` 导致重复行：

```bash
grep -E 'net\.(core\.default_qdisc|ipv4\.tcp_congestion_control)' /etc/sysctl.conf /etc/sysctl.d/* 2>/dev/null || true
```

**预期**：若从未配置，无输出或无 `bbr`/`fq` 行。

若**尚无**相关行，再追加（推荐写独立文件，便于管理）：

```bash
cat >/etc/sysctl.d/99-bbr.conf <<'SYSCTL'
net.core.default_qdisc=fq
net.ipv4.tcp_congestion_control=bbr
SYSCTL
```

若坚持用 `/etc/sysctl.conf`：

```bash
grep -q 'net.core.default_qdisc=fq' /etc/sysctl.conf || echo 'net.core.default_qdisc=fq' >> /etc/sysctl.conf
grep -q 'net.ipv4.tcp_congestion_control=bbr' /etc/sysctl.conf || echo 'net.ipv4.tcp_congestion_control=bbr' >> /etc/sysctl.conf
```

**预期**：命令无报错；重复执行不会叠多行。

> ⚠️ 不要在未检查的情况下反复执行裸 `echo … >> /etc/sysctl.conf`，否则文件末尾会堆重复项。

### 3. 加载配置

```bash
sysctl --system
```

或仅加载刚才文件：

```bash
sysctl -p /etc/sysctl.d/99-bbr.conf
```

**预期**：输出中含：

```text
net.core.default_qdisc = fq
net.ipv4.tcp_congestion_control = bbr
```

### 4. 运行时与模块验证

```bash
sysctl net.ipv4.tcp_congestion_control
sysctl net.core.default_qdisc
lsmod | grep bbr
```

**预期**：

```text
net.ipv4.tcp_congestion_control = bbr
net.core.default_qdisc = fq
tcp_bbr                20480  1
```

（第三列引用计数可能 ≥ 1；为 `0` 或无行则未真正启用。）

---

## 验证（重启后也建议再查一次）

```bash
uname -r
sysctl net.ipv4.tcp_congestion_control net.core.default_qdisc
lsmod | grep bbr
```

**通过条件**：内核 5.10.x；两参数为 `bbr` / `fq`；`tcp_bbr` 在列表中。

---

## 踩坑 / 回滚

| 现象 | 原因 | 处理 |
| --- | --- | --- |
| `apt update` 长时间无输出 | 跨洋慢或源不可达 | 耐心等待；必要时换 bullseye 镜像源后再 update |
| `sysctl` 报 unknown key | 内核过旧或拼写错误 | `uname -r`；核对方括号与键名 |
| `lsmod` 无 `bbr` | 未加载或未真正切换 | 再执行 `sysctl -w net.ipv4.tcp_congestion_control=bbr` 后查 `lsmod` |
| 配置文件末尾多段相同行 | 重复 `echo >>` | 用 `nano` 删到各保留一行，或改用 `/etc/sysctl.d/99-bbr.conf` 单文件 |
| 改完立刻断流？ | 极少见；多半是巧合 | 查 `dmesg` / 网络本身；BBR 切换通常不中断 SSH |

**回滚**（恢复默认 cubic，示例）：

```bash
rm -f /etc/sysctl.d/99-bbr.conf
# 若写在 sysctl.conf，手动删掉那两行
sysctl -w net.ipv4.tcp_congestion_control=cubic
sysctl -w net.core.default_qdisc=fq_codel
# 具体默认值以你机器原配置为准
```

---

## 一句话记住

Debian 11 开 BBR = **fq + bbr 写入 sysctl（只写一次）→ `sysctl -p/--system` → 用 `sysctl` 与 `lsmod` 双验证**。

## 下一课

[[03 第三课：装 3x-ui 面板]] — 安装 Web 面板，为开节点做准备。
