---
tags: [计算机, 操作系统, Linux, Debian11]
created: 2026-10-27
updated: 2026-10-28
---

# 00 什么是 Linux

回到 [[计算机/操作系统/Linux/README|学习地图]]

## 目标

能用自己的话说明：Linux / Debian、命令行、SSH、root 各自是什么，以及「连上 SSH 之后命令跑在哪里」。

## 验收标准

- [ ] 能区分「操作系统」与「图形界面 / 命令行」
- [ ] 能说出本实验目标系统是 **Debian 11（bullseye）**
- [ ] 知道 SSH 连上后提示符从本地切到服务器

## 前置条件

无。本课纯概念，不敲命令。

---

## 一句话

Linux 是一套操作系统，与 Windows、macOS 同级。个人电脑常见 Windows；**绝大多数 VPS 默认跑 Linux**。本实验固定在 **Debian 11 bullseye**。

## 三个概念

### 操作系统

开机后最底层的系统软件：调度 CPU/内存、管文件系统与进程。Windows 是一套，Linux 是另一套。Debian 是 Linux 的一个**发行版**（内核 + 软件仓库 + 默认配置的打包）。

### 命令行 / 终端

图形界面靠图标与鼠标；命令行靠**打字下指令、读文字输出**。服务器为省资源通常不装桌面，只留 shell（Debian 默认多为 bash）。

### SSH（Secure Shell）

加密的远程登录通道。你在本机终端里运行 SSH 客户端，连到服务器上的 `sshd`，之后敲的命令在**远端**执行。

## 为什么服务器几乎都跑 Linux

| 点 | 说明 |
| --- | --- |
| 成本 | 多数发行版免费、开源，无桌面授权费 |
| 稳定 | 适合长期开机 |
| 资源 | 无桌面时内存占用低，算力留给业务 |
| 生态 | 包管理、systemd、自动化工具成熟 |

Windows Server 可买，但贵且更重；入门 VPS 几乎一律给 Linux。

## Debian 11 在本实验里意味着什么

| 项 | 实操含义 |
| --- | --- |
| 包管理 | `apt update` / `apt install`（源为 bullseye） |
| 服务 | `systemctl status|restart …` |
| 内核 | 5.10.x，**自带 BBR 模块**，无需另装第三方内核 |
| SSH | 默认 `openssh-server`；本机房把监听端口改成了 **62027**（非 22） |
| 配置习惯 | 持久参数常写 `/etc/sysctl.conf` 或 `/etc/sysctl.d/*.conf` |

## 今晚会碰到的角色

| 角色 | 说明 |
| --- | --- |
| 本机 Windows | 你坐在这边，用 PowerShell / Windows Terminal 发命令 |
| PowerShell | Windows 自带 shell，用来跑 `ssh` 客户端 |
| VPS（Debian 11.1） | 远端机器，IP `192.220.37.75` |
| root | 超级用户；实验初期用，密码用 `<root密码>` 占位，**勿写入笔记** |
| `sshd` | 服务器上的 SSH 守护进程，监听 `62027` |

## 流程示意

```text
[Windows PowerShell]
    ssh root@192.220.37.75 -p 62027
            │
            ▼
[Debian 11 上的 bash，提示符类似 root@debian:~#]
    此后命令在服务器执行，不是在本机
```

**关键切换**：提示符变成 `root@…#` 之后，你就在服务器里面。很多人第一次踩坑，是把本该在服务器跑的命令敲回了本地 `PS C:\…>`。

## 踩坑 / 易混

| 现象 | 原因 | 怎么办 |
| --- | --- | --- |
| 以为「Linux = Ubuntu」 | Ubuntu 也是发行版之一 | 本实验按 **Debian 11** 的 apt/systemd 写，命令大体通，细节以 Debian 为准 |
| 连上后不知自己在哪 | 没看提示符 | 看是 `PS C:\…>` 还是 `root@…#` |
| 把 root 密码记进 Obsidian | 笔记会同步/备份外泄 | 只用占位符；密码放密码管理器 |

## 一句话记住

Linux（本课 = Debian 11）是服务器的操作系统；SSH 是远程进门的钥匙；进门后命令跑在**那台机器**上。

## 下一课

[[01 今晚第一课：SSH 连上服务器]] — 用 PowerShell 真正连上，看到 `root@…#`。
