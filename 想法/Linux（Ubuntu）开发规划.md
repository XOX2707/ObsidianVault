---
tags: [想法, 规划, Linux]
created: 2026-10-21
---

# Linux（Ubuntu）开发规划

> 起因：2026-10-21 提到之前在电脑（拯救者 Y9000P）上搞过 Ubuntu，只做了一半，现在好像只剩一个「Linux」文件夹。写个规划，等电脑从联想报修回来继续弄。

## 现状（已知的）

- 电脑是联想拯救者 Y9000P，现在在联想报修，还没拿回来
- 2026-09-29 查过怎么进 BIOS（[[AI对话/02 编程与数码/2026-09-29 拯救者Y9000P进BIOS方法]]），之后装 Ubuntu 只做了一半
- 现在硬盘上大概只剩一个「Linux」文件夹，里面是啥还没看（ISO、启动盘工具、虚拟机文件都有可能）
- 磁盘：C（Windows-SSD）400 GB 剩 113 GB，D（Data）551.6 GB 剩 116 GB 但游戏占大头，E 是移动硬盘、别碰

## 电脑回来第一步：先搞清楚装到哪了

别急着重装，先看清卡在哪一步，按顺序查：

1. 打开那个「Linux」文件夹看里面是什么
   - 有 `ubuntu-xx.iso` + Rufus / Ventoy / balenaEtcher：只走到「下载 + 做启动盘」，分区和安装都还没开始
   - 有 `.vdi` / `.vmdk`：当初装的是虚拟机（VirtualBox / VMware）
   - 有 `ext4.vhdx` 之类：走的是 WSL 路线
2. 按 Win+R 输 `wsl -l -v` 回车
   - 列出 Ubuntu 且状态是 Stopped：WSL 其实已经装好了，只是没进去用过
   - 报错或没反应：WSL 功能没开或没装发行版
3. 控制面板 →「启用或关闭 Windows 功能」里看两处勾没勾
   - 「适用于 Linux 的 Windows 子系统」
   - 「虚拟机平台」
4. 磁盘管理（Win+R 输 `diskmgmt.msc`）里找有没有一个没盘符、文件系统显示「未知 / RAW」的分区
   - 有：当初给 Ubuntu 分过区，是双系统装到一半，那个分区里可能是已经装了一半的 ext4 系统

## 三条路怎么选

### 路线 A：WSL2（寻寻推荐先走这条）

适合：想在 Windows 上开个真 Linux 终端写代码，不用重启、不碰游戏盘、不分区。

- 不分区、不重启、不影响 Windows 和游戏
- 能跑 gcc、python、git、Node 全套，还能开图形界面（WSLg）
- 缺点是它跑在 Windows 之上，不是完全独立的 Linux；哪天要原生 Linux 再走 B

电脑回来做：

1. 管理员 PowerShell 跑 `wsl --install -d Ubuntu`
2. 按提示设用户名和密码
3. `sudo apt update && sudo apt upgrade`
4. 装开发工具（见下面「开发环境」）
5. 把 WSL 的虚拟磁盘从 C 盘挪到 D 盘，别让 C 盘（只剩 113 GB）吃紧

### 路线 B：双系统（真 Ubuntu 裸机）

适合：想要一个完整独立的 Linux，重启就能切换，或者以后做 Linux 重活。

- 需要从 C 或 D 里再腾 40 到 60 GB 给 Ubuntu
- 先在 Windows 磁盘管理里「压缩卷」空出未分配空间，再去 BIOS 关 Secure Boot、开相关项
- 安装时一定看清楚，别覆盖 Windows 分区
- 磁盘紧：压缩前照寻寻记的磁盘规矩（能搬先搬、能压先压、E 盘别碰），别一上来就动

真要做的时候再展开步骤。

### 路线 C：虚拟机（最保守）

适合：只想试水、随时能删、不在乎性能。

- VirtualBox / VMware 里装 Ubuntu
- 好处是干净，出问题删掉重来，不影响本体
- 坏处是性能打折，跑大活 / 编译重的东西不合适

## 开发环境要装什么（按平时干的活配）

- 基础：`build-essential`（gcc / g++ / gdb）、`git`、`curl`、`wget`
- Python：`python3` + pip
- Node.js：用 nvm 装（YOLO、deepseek-cli 那套都在用 Node）
- 编辑器：Windows 装 VSCode + Remote-WSL 插件，连进 WSL 写代码
- Android Studio 先不折腾：安卓那套在 Windows 上已经能跑，Linux 里后补

## 磁盘安排

- E 盘是移动硬盘，Linux 相关的东西别往那放
- WSL 默认装 C 盘，装完要 `wsl --export` 到 D 再 `--import`，把虚拟磁盘挪过去
- 双系统的话，分区前先照磁盘规矩来，删东西列清单让我勾

## 待办

- [ ] 电脑拿回来，先看「Linux」文件夹里剩了什么
- [ ] 跑 `wsl -l -v` 看 WSL 状态
- [ ] 决定走 A / B / C（默认 A）
- [ ] 走 A：`wsl --install -d Ubuntu` → 设用户 → `apt update && upgrade`
- [ ] 装开发工具（build-essential、git、python3、nvm）
- [ ] WSL 虚拟磁盘从 C 挪到 D
- [ ] VSCode 装 Remote-WSL，进去编译一个 C 程序、跑一个 Python 脚本试试
