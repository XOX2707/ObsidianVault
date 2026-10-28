---
tags: [计算机, Linux, Debian, 兴趣路线, D1]
created: 2026-10-28
updated: 2026-10-28
---

# D1-01 权限与 apt

本篇是阶段 D1 的第一次上机，系统是 Debian。范围见 [[D1-00 出门之前]]。

当前没有服务器实例。下面的命令标注为「服务器」，等 SSH 通了再执行。这些命令尚未执行。

## 概念

### root 与普通用户

日常登录用的是普通用户。普通用户可以读写自己家目录里的文件。改系统目录、给整台机器装软件，默认要更高的权限。

root 是权限最高的账户，用户编号（uid）为 0。`whoami` 打印当前用户名。`id` 打印 uid、主组和所属的组。uid 为 0 时才是 root；普通登录用户的 uid 不是 0。

### sudo

`sudo` 放在一条命令前面，表示只用 root 的权限执行后面这一条。这一条跑完，登录身份仍是原来的普通用户。

如果它询问密码，输入当前用户的登录密码。有的云镜像把 sudo 配成了免密，不出现密码提示也正常。

### 一条 apt 命令在做什么

apt 是 Debian 的软件包工具。安装时按下面两步看：

1. `sudo apt update` 从软件源拉取软件包索引，让本机知道当前有哪些包、各自是什么版本。
2. `sudo apt install` 按这份索引下载并安装指定的包。`-y` 表示对安装过程中的确认提问自动回答 yes。

报错时先读输出的最后几行。失败原因习惯写在末尾，行首是 `E:`（错误）或 `Err:`（某一条下载失败）。前面的 `Reading package lists`、`Building dependency tree` 是在读索引、算依赖。

故意安装一个索引里没有的包名时，关键行是最后那句以 `E:` 开头的说明，常见是：

`E: Unable to locate package this-package-does-not-exist`

这行表示当前索引里找不到这个包名。

## 服务器

等 SSH 通了再执行。下面只是待执行的命令，输出还没有产生。

```bash
# 服务器：等 SSH 通了再执行
whoami
id
sudo apt update
sudo apt install -y tree
tree --version
sudo apt install -y this-package-does-not-exist
```

各条在看什么：

- `whoami`：当前用户名。
- `id`：uid 和组，用来确认自己是普通用户。
- `sudo apt update`：更新软件包索引。若失败，先看最后几行里以 `E:` 或 `Err:` 开头的那一行。
- `sudo apt install -y tree`：安装一个小的目录树命令 `tree`。
- `tree --version`：确认这个包已经能运行，输出里应有版本号。
- `sudo apt install -y this-package-does-not-exist`：包名是故意写的，索引里没有它。关键行是末尾的 `E: Unable to locate package this-package-does-not-exist`。

## 当堂练习

SSH 通了之后，把上面这几条命令的输出贴回聊天，并说「D1 交卷」。

执行记录：未执行
