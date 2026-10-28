---
tags: [想法, 待办, Claude, 代理]
created: 2026-10-27
---
> [!caution] 2026-10-28：机器走退款，配置手册改存档
> 节点工程曾验收通过，但用途（过 Claude 风控）已否决。退款工单 **#270182**。支付/风控结论以 [[想法/Claude 决策（Grok 复核 2026-10-28）]] 为准；下文 Linux/3x-ui 步骤仅留档。

# 美国 VPS 搭 Claude 代理（配置步骤）

状态：**已放弃**（2026-10-28）。原为路线一配置手册；用途（过 Claude 风控）已否决，正文留档。决策见 [[想法/Claude 决策（Grok 复核 2026-10-28）]]
主方案：[[想法/路线一 美国自洽接 Claude（主方案 + Schedule）]]
作用：买一台美国住宅 IP VPS，在 Windows 上做成代理，配合 Dolphin{Anty} 指纹浏览器登 Claude 新号
先说死：买 IP 不给 Claude 省钱，它只解决「能不能连上」「能不能过风控」，账单按 token 或订阅算，跟 IP 无关
Linux 知识库：[[计算机/操作系统/Linux/README]]（2026-10-27 起边学边做，绕不开 Linux）

## 服务器（2026-10-27 21:12 开通）

| 项 | 值 |
| --- | --- |
| 订单号 | C20261027217890 |
| IP | `192.220.37.75` |
| **SSH 端口** | **`62027`**（不是默认 22） |
| 用户名 | root |
| 密码 | 后台「实例密码」那张图里，**不记进笔记** |
| 系统 | Debian 11.1 |
| 配置 | 1核1G / 10G NVMe / 50Mbps 上下行 / 1000GB 月流量 |
| 计费 | 月付，优惠码 9 折，续费价 ¥61.20；实付加 3% 手续费，约 ¥63.04/月 |
| 到期 | 2026-11-27（48 小时内不满意可全额退） |
| 进度 | SSH ✅ 21:21 ｜ BBR ✅ 21:32 ｜ 面板装好 ✅ 22:05（端口 35123，路径随机，SQLite，v3.11.0）｜ 浏览器访问 502 待解 ｜ **22:37 余下技术活移交 Cursor / Grok Bot，任务书写在 [[AI协作/交接日志]] #008** |

连法：

```powershell
ssh root@192.220.37.75 -p 62027
```

> [!warning] 别把 IP 和端口推到 GitHub
> 这台机器的 IP + 端口能定位到服务器本体，加上密码就是完整钥匙。密码不记，IP 和端口只留在本库，推仓库前记得排除这一篇

## 待办（当前）

1. **今晚**：买丽萨美国 9929 双ISP 住宅 IP **精简版 ¥68/月**（页面上没有 ¥2 试用，靠 48 小时无条件退款当试用），系统选 Debian 12，照 [[计算机/操作系统/Linux/01 今晚第一课：SSH 连上服务器]] 连上，验出口 IP 和 ASN 是不是住宅段
2. 稳了再上 9929 双ISP 精简版 ¥68/月（50Mbps/1000GB），或年付 ¥499（折 ¥42/月）
3. 装代理：走**面板（3x-ui）**路线，在浏览器里点，别手写 sing-box JSON（手写那套在下面「Windows 配置步骤」存着，要碰 Linux）
4. 装 Dolphin{Anty}，建美国 profile，走这台 VPS 的代理，用它登录 Claude 新号
5. 订阅：支付走 Google Play，先 Pro 后 Max。**预算卡着：2026-10-27 可支配 ¥131.73，首月约 ¥260+（Pro 145 + IP 68 + 开卡 40-70），先做门槛，订阅等下一笔钱**

## 买哪台（2026-10-27 20:58 实看 gid=12）

> 这页没有 ¥2/天 试用（笔记早先写的 ¥2 是错的，已删）。真「试用」靠的是「48 小时不满意无条件退款」，所以买最便宜的月付验 IP，不满意全额退。

| 产品 | 价格 | 配置 | 备注 |
| --- | --- | --- | --- |
| 精简版（pid 65） | ¥68/月 | 1核1G / 10G NVMe / 50Mbps / 1000GB | **先买这个验 IP**，48h 内可退款 |
| 基础版（pid 58） | ¥88/月 | 1核1G / 20G / 60Mbps / 2000GB | |
| 进阶版（pid 59） | ¥158/月 | 2核2G / 40G / 80Mbps / 4000GB | |
| 特价年付版（pid 168） | ¥499/年 | 1核1G / 10G / 50Mbps / 600GB/月 | 折 ¥41/月，稳了再上 |

- 全部「自动开通，即时交付」，48 小时不满意无条件退款
- 系统选 **Debian 12**（下单时选）
- 页面明确写了：部分 IP 段禁 ping，ping 不通正常，别当故障

## 预算（稳优先，2026-10-27 算）

| 组合 | 月费 | 年费 |
| --- | --- | --- |
| 官方 Pro + 美国住宅 IP + 虚拟卡 | ≈ ¥190 | ≈ ¥2300 |
| 官方 Max 5x + 美国住宅 IP + 虚拟卡 | ≈ ¥765 | ≈ ¥9300 |

明细：美国住宅 IP 年付 499（¥42/月）+ Dolphin Anty 免费版 0 + 虚拟卡开卡 $5-10 一次性 + 支付手续费约 2%

## 和兔子发卡比，省了多少（2026-10-28 算）

兔子发卡卖的是现成节点，Clash / 小火箭通用订阅，月付 ¥300 / 100G、季付 ¥800；自己买丽萨是买 VPS 自己配。只比「让流量从美国出去」这一段，Claude 订阅 ¥145 和虚拟卡 ¥40-70 两边都躲不掉，不在这张表里。

| 比法 | 兔子发卡 | 丽萨自建 | 省 |
| --- | --- | --- | --- |
| 月付 | ¥300 / 月（100G） | ¥68，九折 ¥61.2 / 月（1000GB） | ¥238.8 / 月，约八成 |
| 季付 | ¥800 / 季（≈ ¥266.7 / 月） | 月付三个月 ¥183.6 | ¥616.4 / 季 |
| 一年（对季付） | ¥3200 | 年付 ¥499，九折 ¥449.1 | ¥2750.9 / 年 |
| 一年（对月付） | ¥3600 | 年付 ¥449.1 | ¥3150.9 / 年 |

流量顺带也省：兔子 100G，自己 1000GB（年付也有 600GB / 月），多六到十倍。

**这笔省不是白捡的**：兔子发卡贵在「省事」，不用碰 Linux；自己省下的钱，是拿配节点、排错的时间换的。而且截至 2026-10-28 10:00，节点只通了 39521 的 TCP，出口国家还没验到，这笔省还没真正落袋。

> 兔子发卡仅供参考，目前不在购买清单。

## 方案本身要花多少（2026-10-27 算）

| 路 | 起步要花 | 月持续 | 说明 |
| --- | --- | --- | --- |
| ~~钥匙站（中转 API）~~ | ~~0，注册送额度~~ | ~~80～200~~ | **2026-10-27 已放弃**，Opus 在 YOLO 聊天里始终 403，见文末档案 |
| 官方 Pro + 干净 IP | 约 215 | 约 215 | Pro 20 美元约 145 + IP 68，最稳，**当前主走这条** |
| 官方 Max 5x + 干净 IP | 约 790 | 约 790 | Max 100 美元约 725 + IP 68，重度才上 |
| 自建 VPS | 68 起，Claude 另算 | 68 起 | 出口 IP 不解决账单，现阶段没必要碰 |

## 参考资料（2026-10-27 20:10 联网核）

来源都是公开页面，价格和限制随时会变，下单前以官网为准

### 一、IP 那头：丽萨主机 LisaHost

- 官网：<https://lisahost.com>
- 优惠码：`TS-CBP205DQJE`，全场 9 折、循环、续费同价
- 美国洛杉矶 9929 双 ISP 住宅 IP：标价 68 元/月（折后 61.2），1 核 1G / 10G NVMe / 1000GB / 50Mbps
- 特价年付：499 元/年（折后 449.1），1 核 1G / 10G NVMe / 600GB / 50Mbps
- 售后：48 小时内可免费换一次 IP、不满意可全额退款，条件以官方规则为准
- **重要**：卖的是 VPS，不是成品节点。买到手要自己装系统、配代理，用户不会 Linux，这条要么助手代跑、要么边学边做（走 [[计算机/操作系统/Linux/README]]）
- 来源：<https://www.idcspy.com/168950.html>、<https://www.ittellyou.com/411.html>、<http://www.zyhot.com/archives/3816.html>

### 二、支付那头：虚拟卡横评

| 卡 | 开卡费 | 费率 | 大陆能不能办 | 判断 |
| --- | --- | --- | --- | --- |
| RedotPay | 虚拟卡 $10 | 充值 0%（链上）/ 刷卡 1% + 非美元 1.2% | **不能**。官方限制名单含中国大陆和美国，美国也不能填成账单地址 | **划掉**，跟「美国账单地址」这条直接冲突 |
| PokePay | $5 起（官网标 $20，邀请券后 7.2） | 消费 1% + 货币转换 1% | **说法打架**：官方受限名单把大陆列进去，多篇中文实测又说身份证几分钟就能开 | 只小额试，别放大钱 |
| Dupay（原 Depay） | 标准卡 0 元 | 充值 1.35% / 1%，标准卡月费 $1 | 多篇实测身份证 KYC 2-5 分钟过 | 备选 |
| WildCard | $9.9 / 2 年 | 充值约 3.5% | 支付宝扫码，公认最省事，明确支持 Claude / Cursor 订阅 | 备选，最省心但费率最高 |

- 来源：<https://ucard.observer/cards/redotpay/>、<https://ucardradar.com/cards/pokepay-card>、<https://www.typemylife.com/redotpay-visa-debit-card-crypto/>、<https://www.digitalnomadlc.com/how-to-apply-pokepay-card/>、<https://www.iplaysoft.com/best-virtual-credit-cards.html>
- 2026-10-28 再核：上表里的 Dupay、WildCard 已经不能当选项。Dupay 官网写 Service terminated（2025-10-20 公告，2025-11-30 停服）。WildCard 2025-07-12 起停虚拟卡。三家里只剩 PokePay。美国 BIN 404038 开卡约 $20，不是表里的 $5 起。大陆资格和美国账单地址仍未在官网写死。钱没到 ¥185 之前不买。详见 [[想法/一条龙接 Claude 总清单]]。

### 三、从这些资料里得出来的三条硬结论

1. RedotPay 明确办不了，主方案 Phase 0 里那张「RedotPay / PokePay / Depay 挑一张」要改
2. 美国账单地址不是每家都给，办卡前先问发卡行「你们提供的账单地址是美国哪个州」，别默认有
3. 网上「身份证就能开卡」的说法大多来自推广文，官方名单里常常把大陆列为受限；这类平台跑路和封卡的历史不少，随用随充，别把余额留在里面

## Windows 配置步骤（暂缓：手写 sing-box，要碰 Linux）

> [!warning] 这节的服务器端命令要碰 Linux
> 第 0 到第 6 步是 SSH 登录 VPS 后在 Linux 里敲命令（apt、nano、systemctl 这些）。用户 2026-10-27 说根本不会 Linux，纯手动照抄遇到报错就卡死。**当前改用面板（3x-ui）路线，在浏览器点，这节先存档当手写备选**；要代跑交给 Max 模式 / Claude Code。

### 首选路线：3x-ui 面板（2026-10-27 21:36 定）

一条命令装完，之后全在浏览器里点，不再手写 JSON。官方仓库 MHSanaei/3x-ui，支持 Debian

```bash
bash <(curl -Ls https://raw.githubusercontent.com/mhsanaei/3x-ui/master/install.sh)
```

- 装完会**随机生成用户名、密码、访问路径**，屏幕上有，务必抄下来
- 装完敲 `x-ui` 进管理菜单，能看、能改登录信息
- 浏览器访问 `http://IP:面板端口/访问路径`
- 官方文档：<https://docs.sanaei.dev>
- 支持 VLESS + REALITY，跟后面 Clash Verge 那条对得上
- **注意**：面板端口别用 62027（那是 SSH 的），安装时它问就换一个，比如 35123

### 第 0 步 准备（手写备选）

开始菜单搜 PowerShell，Windows 自带 SSH，不用装 PuTTY

```bash
ssh root@你的IP
# 输密码时屏幕不显示，正常
```

### 第 1 步 开 BBR ✅ 2026-10-27 21:32 完成（`tcp_bbr 20480 1` 已验证）

```bash
apt update && apt install -y curl wget nano
echo "net.core.default_qdisc=fq" >> /etc/sysctl.conf
echo "net.ipv4.tcp_congestion_control=bbr" >> /etc/sysctl.conf
sysctl -p
lsmod | grep bbr        # 出现 tcp_bbr 就成了
```

### 第 2 步 装 sing-box

```bash
mkdir -p /etc/apt/keyrings
curl -fsSL https://sing-box.app/gpg.key -o /etc/apt/keyrings/sagernet.asc
chmod a+r /etc/apt/keyrings/sagernet.asc
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/sagernet.asc] https://deb.sagernet.org/ * *" > /etc/apt/sources.list.d/sagernet.list
apt update && apt install -y sing-box
sing-box version
```

### 第 3 步 生成三样东西

```bash
sing-box generate uuid                # 记下来，叫 UUID
sing-box generate reality-keypair     # 输出 PrivateKey 和 PublicKey，两个都记
sing-box generate rand --hex 8        # 8 位十六进制，当 short_id
```

### 第 4 步 写配置

```bash
nano /etc/sing-box/config.json
```

把三处占位换成第 3 步的值

```json
{
  "log": { "level": "warn", "timestamp": true },
  "inbounds": [
    {
      "type": "vless",
      "tag": "vless-in",
      "listen": "::",
      "listen_port": 443,
      "users": [ { "uuid": "你的UUID", "flow": "xtls-rprx-vision" } ],
      "tls": {
        "enabled": true,
        "server_name": "www.microsoft.com",
        "reality": {
          "enabled": true,
          "handshake": { "server": "www.microsoft.com", "server_port": 443 },
          "private_key": "你的PrivateKey",
          "short_id": ["你的short_id"]
        }
      }
    }
  ],
  "outbounds": [ { "type": "direct", "tag": "direct" } ]
}
```

nano 存盘 Ctrl+O 回车，退出 Ctrl+X

### 第 5 步 检查并启动

```bash
sing-box check -c /etc/sing-box/config.json
systemctl enable --now sing-box
systemctl status sing-box     # 看到 active (running)
```

sing-box 版本更新快，字段偶尔会变，check 报错就照官方文档改字段

### 第 6 步 拼节点链接

把 6 个值填进去，一长串复制走

```text
vless://UUID@IP:443?encryption=none&flow=xtls-rprx-vision&security=reality&sni=www.microsoft.com&fp=chrome&pbk=PublicKey&sid=short_id&type=tcp&headerType=none#US-9929
```

### 第 7 步 Windows 端 Clash Verge（客户端）

用户电脑端用的是 Clash Verge，不是 v2rayN

1. 确认装的是 Clash Verge Rev（内核 mihomo），太老的 Clash Premium 内核跑不了 vless reality，得先升 Rev
2. 打开 Clash Verge，导入第 6 步那条 vless 链接，选中美国节点
3. 记下混合端口：Rev 默认 7897，老版默认 7890，设置 → 混合端口 看实际值（下面按 7897 写）
4. 别开 TUN（这台机器 TUN 会被安全软件 / 防火墙堵死），也不用开系统代理，后面按需走
5. 快速验证：curl -x http://127.0.0.1:7897 https://ipinfo.io，看到美国 IP 就对

### 第 8 步 验证

浏览器开 `ip.sb` 或 `ipinfo.io`，看到美国 IP、ASN 是住宅段（不是数据中心机房）就对

命令行核对：

```bash
curl -x http://127.0.0.1:7897 https://ipinfo.io
```

别用 ping 判断死活，这家页面写了部分 IP 段禁 ping，ping 不通正常

### 第 9 步 Dolphin{Anty} 里怎么用

1. 装 Dolphin{Anty}，新建一个 profile，地区选美国
2. 时区 America/Los_Angeles，语言 English，UA 别乱改，跟真实浏览器一致
3. 代理填 socks5 `127.0.0.1:12334`（2026-10-28 这台电脑上 Clash Verge 的混合端口是 12334，不是文档里旧的 7897。http 和 socks 都收）
4. 这个 profile 只登 Claude，别登国内号，别一天切几个国家，一 IP 一号
5. 先月付 Pro 试，稳了再说 Max

### 第 10 步 Claude Code 走分代理（Schedule / Terminal / Monitor 的入口）

网页版管对话，Claude Code 管干活的 agent（Schedule、Terminal、Monitor 这些），两条线共用同一个订阅账号

Claude Code 不读浏览器那套时区 / UA / 指纹，只要出口 IP 是美国、账号正常就行，不用管 Anty

它只支持 HTTP / HTTPS 代理，不支持 SOCKS，所以代理地址一律填 http，别填 socks5

因为 Monitor 这种后台 agent 是独立进程，shell 里临时 export 的变量它拿不到，所以代理变量要写进 `~/.claude/settings.json` 的 env：

```json
{
  "env": {
    "HTTPS_PROXY": "http://127.0.0.1:7897",
    "HTTP_PROXY": "http://127.0.0.1:7897"
  }
}
```

只在当前终端前台用、不跑后台 agent 的话，也可以 PowerShell 里临时设：

```powershell
$env:HTTPS_PROXY = "http://127.0.0.1:7897"
$env:HTTP_PROXY = "http://127.0.0.1:7897"
claude
```

登录那一下会弹系统浏览器走 OAuth，浏览器得自己走代理（Clash 临时开系统代理），登录完 token 存下来，后面 API 请求全走上面的环境变量

用 `/status` 确认是订阅账号登录，不是 API key（API 那条 10 月 27 号组织被禁，已经死透）

## 补充方案（2026-10-27 联网调研）

比纯自建更经得住折腾的几条，按性价比排：

### 1. 支付别用一次性外国卡（最该改）
网上买的一次性外国卡号是 2026 封号重灾区，很多人充完第二天号就没了。改从安卓官方应用商店 Google Play 里订阅：钱从谷歌那边扣，Anthropic 看不到你用了什么卡，稳很多。苹果路线已划掉（用户 2026-10-27 说不用苹果）。

### 2. IP 别迷信「最贵的那种」
不非得买最贵的「真家庭宽带」。关键就三样：干净（没被滥用的黑历史）、只给你一个人用、地址别天天变。独享的干净机房 IP 也能长期稳，还便宜。你选的方向没错，只是预算别全砸在「最贵」上。

### 3. 两段路搭着走（又快又干净）
美国那边直连国内又慢又不稳。做法分两段：国内这段用便宜加速线，最后出口那一下用你买的干净 IP。这样又快又干净，两头的好处都要。

### 4. ~~有网站能直接卖 Claude 的「钥匙」~~（2026-10-27 已放弃）
~~支付宝微信充点钱，发你一串钥匙，填进 YOLO 就能用，不买 VPS 不买订阅~~。实测老张 laozhang.ai 这一步 Opus 在 YOLO 聊天里始终 403，用户当晚决定不用中转，详情见文末「已归档」。

### 来源
GitHub vps888/claude、Fishason/Claude-anti-ban、LMU-AI/claude-api-relay-review、superpowers-skills.com、locdd.com 等，2026-10 检索。

## 风险

丽萨是小商家，支付宝/微信付款实名，年付有跑路风险
住宅 IP 段可能被滥用进风控
虚拟卡 BIN 可能被 Stripe 标记高风险，3DS 弹验证就卡死
代理登 claude.ai 本身踩线，封号不给理由，一封号 credits 和 Claude Code 登录一起没

---

## 已归档：老张中转站试错（2026-10-27 一晚，不再走）

> 一句话：钥匙站本身能用（测试和在线调试台都能调 Opus，扣费口径跟官方一致），但 Opus 在 YOLO 聊天里始终 403，折腾一小时无果。2026-10-27 20:06 用户决定不用中转、宁愿花钱走官方。下面整段留作档案，别再当待办。

### 先试这一家：老张 laozhang.ai
- 选它的原因：中文圈最知名、相对稳、官方同价没有「便宜到可疑」的猫腻、注册送几毛钱额度
- 备选：AIHubMix（文档好、支持缓存、客服快）
- 别碰：PackyAPI（逆向接口随时断）、OpenRouter（国内用不了要国际信用卡）

### 连上了的参数（2026-10-27 19:20 查官方文档核实）

| 项 | 值 |
| --- | --- |
| 服务器地址（Base URL） | `https://api.laozhang.ai`，不加 /v1 |
| OpenAI 格式才用 | `https://api.laozhang.ai/v1` |
| 备用域名 | `api2.laozhang.ai`，欧洲/北美直连用 `api-vip.laozhang.ai` |

- 令牌分组须落 `default` 或 `claude_code`；模型名照抄定价页（`claude-opus-5-5` 这种）
- 限制：单次输出封顶 32768 token；不支持 `web_search`/`web_fetch`/`code_execution`；`count_tokens`、Message Batches、Files API 都没有；PDF 块不收
- 支付只有 Stripe 卡 + 对公转账，没支付宝微信

### 单价（2026-10-27 查定价页）

| 模型 | 输入 /M | 输出 /M |
| --- | --- | --- |
| claude-opus-5-5 | $4 | $20 |
| claude-sonnet-5-5 | $2 | $10 |
| claude-haiku-5-5 | $0.1 | $0.5 |

### 403 排查实录（要点）

- 现象：连通性测试四条全绿（api/api2 × Opus/Sonnet），聊天一发就「API Key 无效 · threeZhang request failed (403)」，Ask 模式也一样
- 实锤：日志 19:44:28 那条 Opus 扣了 $0.0544、生成 315 token，界面一个字没显示 → 请求真跑到了模型、真扣了钱，内容回传丢了，是中转流式收尾的问题
- 对照组：在线调试台（走账户额度、不走令牌，Chat Completions 格式）调 Opus 正常
- 试过全无效：两种格式、两个域名、Ask、非流式、关扩展思考、干净对话发「1+1」
- 结论：不是钥匙、不是网络、不是参数，是「Opus 走 YOLO 聊天这条链」在中转侧崩
- 下次若还想起这条：① 新建分组 default 的令牌；② Console 面板抓原始报错；③ 找客服报 19:44:28 那条流水

### 三条铁律（中转站通用，虽已放弃仍适用）

- 不充大额，用多少充多少
- 别信便宜到可疑的，看内部汇率
- 上线前测是不是真 Claude
