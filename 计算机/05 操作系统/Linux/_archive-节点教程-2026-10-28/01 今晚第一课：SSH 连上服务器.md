---
tags: [计算机, 操作系统, Linux, SSH, Debian11]
created: 2026-10-27
updated: 2026-10-28
---

# 01 今晚第一课：SSH 连上服务器

回到 [[计算机/操作系统/Linux/README|学习地图]] · 前置：[[00 什么是 Linux]]

## 目标

从 Windows 用 OpenSSH 客户端登录 Debian 11 VPS，进入交互式 root shell。

## 验收标准

- [ ] 命令行提示符变为类似 `root@debian:~#`（或 `root@主机名:~#`）
- [ ] 在远端执行 `uname -a`，输出含 `Debian` / `5.10` 类内核信息
- [ ] 执行 `pwd` 得到 `/root`（或等价家目录）
- [ ] 密码与密钥**未**写入任何笔记文件

## 前置条件

| 项 | 本实验值 |
| --- | --- |
| IP | `192.220.37.75` |
| SSH 端口 | **`62027`**（非默认 22，必须 `-p`） |
| 用户 | `root` |
| 密码 | `<root密码>`（厂商后台发放，勿贴进笔记） |
| 系统 | Debian 11.1（bullseye） |
| 本机 | Windows，已带 OpenSSH 客户端（PowerShell / Windows Terminal） |

---

## 步骤

### 1. 打开本机终端

开始菜单 → 搜 **PowerShell** 或 **Windows Terminal** → 打开。

**预期**：出现本地提示符，例如 `PS C:\Users\…>`。

### 2. 发起 SSH

```powershell
ssh root@192.220.37.75 -p 62027
```

说明：`-p 62027` 不可省略；省略则连 22，通常超时。

**预期（首次连接）**：

```text
The authenticity of host '[192.220.37.75]:62027 ([192.220.37.75]:62027)' can't be established.
ED25519 key fingerprint is SHA256:….
Are you sure you want to continue connecting (yes/no/[fingerprint])?
```

输入 `yes` 回车（把主机密钥写入本机 `known_hosts`）。

### 3. 输入密码

**预期**：

```text
root@192.220.37.75's password:
```

输入 `<root密码>`。**屏幕不回显字符、也不显示 `*`，属正常**。输完回车。

### 4. 确认已在远端

**预期提示符**类似：

```text
root@debian:~#
```

再跑：

```bash
uname -a
pwd
```

**预期**：`uname` 含 `GNU/Linux` 与 `5.10.…`；`pwd` 为 `/root`。

---

## 验证（小结）

| 检查 | 命令 / 现象 | 通过条件 |
| --- | --- | --- |
| 会话位置 | 提示符 | `root@…#` 而非 `PS C:\…>` |
| 系统 | `cat /etc/os-release` | `VERSION_ID="11"` / bullseye |
| 端口记忆 | 下次连接 | 仍带 `-p 62027` |

```bash
cat /etc/os-release | head -5
```

**预期**含 `PRETTY_NAME="Debian GNU/Linux 11 …"`。

---

## 踩坑 / 回滚

| 现象 | 原因 | 处理 |
| --- | --- | --- |
| 密码「没反应」 | SSH 故意不回显 | 照常输入后回车 |
| `Connection timed out` | IP 错、网络不通、**漏 `-p 62027`**、机房封禁 | 核 IP/端口；本机 `Test-NetConnection 192.220.37.75 -Port 62027` |
| `Permission denied` | 密码错或剪贴带空格 | 从密码管理器粘贴；确认未开 Caps Lock |
| 提示符仍是 `PS C:\…>` | 未连上 | 读报错，勿在本地瞎敲 Linux 命令 |
| 按键有 150–250 ms 延迟 | 跨洋 RTT，正常 | 等 `#` 回来再敲下一行 |
| `WARNING: REMOTE HOST IDENTIFICATION HAS CHANGED!` | 重装系统后主机密钥变了 | 确认确是自己的机器后，按提示删掉本机 `known_hosts` 对应行再连 |

**回滚**：SSH 本身无破坏性配置。断线即退出会话；服务器进程不受影响。重连：

```powershell
ssh root@192.220.37.75 -p 62027
```

---

## 顺手认识几个只读命令

| 命令 | 作用 |
| --- | --- |
| `pwd` | 当前目录 |
| `ls` | 列出当前目录 |
| `cd 目录` / `cd ..` | 进入目录 / 返回上层 |
| `whoami` | 当前用户（应为 `root`） |
| `hostname` | 主机名 |

`ls`、`pwd`、`uname` 只读，可放心练习。

## 一句话记住

连 Debian 11 必须带上机房给的端口：`ssh root@IP -p 62027`；看到 `root@…#` 才算进门。

## 下一课

[[02 第二课：开 BBR（网络提速）]] — 在已登录的 shell 里开 BBR 并验证。
