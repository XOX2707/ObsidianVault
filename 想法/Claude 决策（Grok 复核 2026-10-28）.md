---
tags: [想法, Claude, 决策, 退款]
created: 2026-10-28
---

# Claude 决策（Grok 复核 2026-10-28）

状态：已定 —— **退丽萨 VPS，暂停大陆官方 Claude Pro 路线**
复核对象：[[想法/路线一 美国自洽接 Claude（主方案 + Schedule）]]、[[想法/美国 VPS 搭 Claude 代理（配置步骤）]]、[[想法/VPS 节点收尾清单]]

## 一句话

工程及格（节点已通），产品合规不及格。人在大陆时，官方 Claude Pro 不靠「美国自洽」堆栈就能变成 ToS 合规；卡没买之前停手；Claude 专用的丽萨机走 48h 退款。

## 决策表

| 项 | 结论 |
| --- | --- |
| VPS | **退款**。订单 `C20261027217890`，IP `192.220.37.75`，服务 S227506。仅作 Claude 出口不值留。 |
| 工单 | **#270182** 已提交（2026-10-28）。主题「申请退款 C20261027217890」。查看：https://lisahost.com/viewticket.php?tid=270182&c=WMf77zLx |
| 退款窗口 | 约至 **2026-10-29 21:12（Asia/Shanghai）**（开通约 2026-10-27 21:12 + 48h） |
| 手续费 | 开通费 / 支付手续费通常不退；实退可能接近折后 ¥61.2，不是实付 ¥63.04 |
| PokePay / 虚拟卡 | **先别买**。PokePay 官网限制含中国与美国；公开 BIN 偏香港预付，不是美国 BIN |
| Phase 2 注册 | **无支持地区实体短信号前不要开号** |
| 产品替代 | 日常 DeepSeek / Qwen / Kimi 等；Cursor 用其在国内能通的模型。别在此栈上升 Max |
| 若仍要官方 Pro | 耐久路径是人身到支持地区 + 当地号 + 当地卡（或合规实体） |

## DeepSeek 方案：对了什么

- 卡国 ≈ 账单 ≈ 出口 ≈ 浏览器时区/语言的一致性，好过伪造日本身份
- 弃中转、弃淘宝 iOS、先 Pro 后 Max、面板只听本机
- 节点收尾本身做过：VLESS+REALITY、39521、Clash `12334`、出口 country=US

## DeepSeek 方案：错了 / 过时了什么

1. **「住宅 IP」**：`192.220.37.75` → **AS2914 NTT**（骨干/中转），不是 Comcast/AT&T 家宽 ASN。丽萨「9929 双 ISP 住宅」是卖点。
2. **PokePay**：不能当「只剩的美国 BIN」；限制名单含中美；BIN 非美。
3. **漏手机硬门槛**：支持地区实体 SMS；禁 VoIP / Google Voice。
4. **「真实身份可申诉」**：政策按物理位置；不支持地区申诉改不了条款。
5. **Google Play**：可能减网页卡拒，盖不住地区 / 手机 / IP 类型。

## 关键来源（复核日 2026-10-28）

- https://www.anthropic.com/supported-countries
- https://support.claude.com/en/articles/8325609-how-do-i-sign-up-for-the-pro-plan
- https://support.claude.com/en/articles/8287232-verify-your-phone-number
- https://support.claude.com/en/articles/9402418-why-was-my-card-declined
- https://pokepay.cc/hk/service_restrictions.html
- https://ipinfo.io/192.220.37.75 （AS2914）

## 待跟进

- [x] 2026-10-28 16:26 已回工单 #270182：坚持退款、退支付宝（不要换 IP / 不要退余额）
- [ ] 等丽萨确认退款金额与支付宝到账、取消实例
- [ ] 到账后更新现金余额（退前约 ¥68.69，实付 VPS ¥63.04）
- [ ] 后台曾见 **逾期账单 ¥500**——与本次退款无关，自行核对，勿误付
- [x] 三篇旧笔记已加 2026-10-28 暂停/退款横幅，链到本篇

## 关联

[[想法/路线一 美国自洽接 Claude（主方案 + Schedule）]]
[[想法/美国 VPS 搭 Claude 代理（配置步骤）]]
[[想法/VPS 节点收尾清单]]
