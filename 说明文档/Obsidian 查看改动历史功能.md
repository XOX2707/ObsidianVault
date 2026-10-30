---
tags:
  - 工具
  - Obsidian
created: 2026-10-16
updated: 2026-10-16
---

# Obsidian 查看改动历史（diff）

## 现状

2026-10-16 确认：Agent 沙箱里没有 git，也没有桌面版 Obsidian CLI（`obsidian-cli`）。
真正跑 git 或 obsidian-cli 的版本历史命令，需要在 Max（桌面）模式做，因为那才碰得到本地 shell。

## 三档方案（从省事到完整）

### 第一档 免费内置：文件恢复快照

- 核心插件「文件恢复 / File recovery」自动存快照
- 命令面板 Ctrl/Cmd+P 输入「打开快照 / Open snapshots」
- 能翻最近几天的历史版本，最省事，先看这个

### 第二档 逐行 diff：Version History Diff 插件

- 社区插件，装完打开文件即可前后版本对比
- 这就是「每一行改了啥」的 diff 视图

### 第三档 完整 git 历史：obsidian-git 插件

- 社区插件 obsidian-git + 桌面装了 git
- 给库 git init，之后每次改动自动提交
- 就能用 git diff、git log 全套

## 词义备忘

- `diff`：差异，`git diff` 查看逐行改动
- `stash`：暂存，`git stash` 把未提交改动先藏起来
- `git log`：提交历史列表
