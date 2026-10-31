---
tags: [通用人工智能, AGI, nanoGPT, 技术评估]
created: 2026-10-31
from: Claude Code
---

# nanoGPT 本机可行性评估（已实测）

> 2026-10-31 22:33 到 23:45 在本机实测。本机：拯救者 Y9000P 2024，RTX 4060 Laptop GPU 8188 MiB，驱动 591.74（支持到 CUDA 13.1），算力 8.9
> 本篇是验收版，取代同日早些时候写的估算版。估算版里错的地方见第 7 节。群里二次验收见第 10 节

## 结论

| 问题 | 结论（实测） |
|---|---|
| 1. 环境 | Python 3.12.10 + PyTorch 2.14.1+cu130，不用另装 CUDA Toolkit |
| 2. 显存 | 够。官方字符级配置（10.65M 参数）整卡只占 2.5 GB / 8 GB |
| 3. 耗时 | 5000 步共 11 分 12 秒；每步约 82 ms；最好的模型在第 1750 步，约 4 分钟出现 |
| 4. 路线 | 第一步从零训练。LoRA 是在别人训好的模型上改，不算「自创」 |
| 5. 闭环 | 跑通了：环境、数据、训练、生成、验收全部在 4060 上完成，见第 5、6 节 |

**验收结论：通过。** 最好的 val loss 1.4621，官方在 A100 上是 1.4697，基本一致

## 1. 环境

| 组件 | 版本 | 说明 |
|---|---|---|
| Python | 3.12.10 | winget 按当前用户安装，位置 `%LOCALAPPDATA%\Programs\Python\Python312` |
| PyTorch | 2.14.1+cu130 | wheel 自带 CUDA 13.0 运行库，所以不用装 CUDA Toolkit（本机没有 nvcc 也能跑） |
| 其他依赖 | numpy 2.5.4、requests、tiktoken、tqdm | 字符级训练只用得到 numpy 和 requests |
| nanoGPT | 提交 3adf61e（2025-11-12） | 作者已在 README 里标为「deprecated」，推荐新项目 nanochat；拿来学习和做第一步仍然合适 |

为什么选 cu130：PyTorch 2.15 已经不发 CUDA 12.x 的包，cu121、cu124 这些旧索引里没有新版本。本机驱动支持 CUDA 13.1，cu130 正好能用。cu130 索引里 Python 3.12 到 3.15 都有 Windows 包，选 3.12 是因为它最稳

所有文件在 `C:\Users\XW\AGI_Lab\`：
- `venv312\`：本次用的虚拟环境
- `nanoGPT\`：代码、数据、训练结果（`out-shakespeare-char\ckpt.pt`，123 MB）
- `wheels\`：torch 安装包（1.99 GB，sha256 已核对，可删）
- `train_run1.log`：完整训练日志
- `venv_nanogpt\`：早先用 Python 3.14 建的环境，里面没有可用的 torch，可删

## 2. 显存（实测）

训练时 `nvidia-smi`：显存 2519 MiB / 8188 MiB，GPU 占用 78%，63°C，功耗约 79 W

还剩 5.5 GB 余量，下一步可以把模型加大几倍。具体能加多大要实测，别按公式猜

## 3. 耗时（实测）

| 项 | 数值 |
|---|---|
| 每步训练 | 约 82 ms（每步 16,384 个 token） |
| 每次评估 | 约 12 秒（每 250 步一次，每次 200 个 batch） |
| 5000 步总计 | 11 分 12 秒（23:32:13 到 23:43:25） |
| MFU | 约 4.5%（未开 `torch.compile`，还有提速空间） |

官方 README 说同一配置在 A100 上约 3 分钟，4060 笔记本大约慢 3.7 倍

## 4. 路线：从零训练 vs LoRA

第一步选从零训练，理由：
- Goal 是「自创」示例模型。从零训练，每个参数都是在这台电脑上学出来的
- LoRA 是给已有大模型加一小块可训练参数，底座还是别人的。它适合以后让现成模型学会某个具体任务，不适合当「自创」的第一步
- 从零训练能看到 loss 怎么降、什么时候开始过拟合，这是往后加数据、加参数时做判断的基本功

nanoGPT README 自己也说，用 GPT-2 微调能在莎士比亚数据上得到更好的文本。这句话没错，只是和本项目的目标不一致

## 5. 最小闭环（可复现）

PowerShell，在 `C:\Users\XW\AGI_Lab\nanoGPT` 下运行：

```powershell
$py = "..\venv312\Scripts\python.exe"
$env:HTTPS_PROXY = "http://127.0.0.1:12334"
& $py data\shakespeare_char\prepare.py                                  # 下载约 1.1 MB 文本，转成 train.bin / val.bin
& $py train.py config\train_shakespeare_char.py --compile=False          # 训练约 11 分钟
& $py sample.py --out_dir=out-shakespeare-char --num_samples=2 --max_new_tokens=400 --seed=1337
```

- 数据：Tiny Shakespeare，1,115,394 个字符，词表 65，训练集 1,003,854，验证集 111,540（和官方脚本注释完全一致）
- 模型：官方 baby GPT，6 层、6 头、384 维、上下文 256、batch 64、dropout 0.2、5000 步、bf16 混合精度（nanoGPT 自动选择）
- `--compile=False`：官方 README 说 Windows 上 `torch.compile` 可能报错，要关掉

## 6. 验收记录

### loss 曲线（每 500 步摘一行）

| step | train loss | val loss |
|---|---|---|
| 0 | 4.2874 | 4.2823 |
| 500 | 1.5331 | 1.7282 |
| 1000 | 1.2721 | 1.5211 |
| **1750** | **1.1021** | **1.4621**（最好，存了 checkpoint） |
| 2500 | 0.9635 | 1.4913 |
| 3500 | 0.7848 | 1.5796 |
| 5000 | 0.6256 | 1.7078 |

第 1750 步以后 train loss 继续降、val loss 反而升，说明开始过拟合，模型在背训练集。数据只有 1 MB，这是预期现象。nanoGPT 只在 val loss 变好时保存，所以留下的是第 1750 步的模型

### 生成样本（seed 1337，节选）

```
LEONTES:
Not that, we have been so near, but by the county:
I should so, I would be thus worse shall be before.

LEONTES:
Not so sir, I do beseech you here a good all:
```

### 验收标准

| 标准 | 结果 |
|---|---|
| 训练跑完不报错 | 通过（只有一条 GradScaler 的 FutureWarning，不影响结果） |
| val loss < 1.5 | 通过，1.4621 |
| 有剧本格式（人名 + 冒号 + 换行） | 通过：Clown、AUTOLYCUS、LEONTES、HERMIONE 都是《冬天的故事》里真实的角色 |
| 大部分是真实英文单词 | 通过，偶尔有造出来的词（calat、bazker） |
| 意思连贯 | 不通过，句子之间没有逻辑。10M 参数的字符级模型做不到，这是下一步要解决的问题 |

## 7. 估算版里的错误（已更正）

| 估算版写的 | 实际 |
|---|---|
| 装 PyTorch cu121 | cu121 索引里已没有新版本，实际用 cu130 |
| 「CUDA 版只支持到 Python 3.12」（对话里说的） | 查错了旧索引，cu130 对 3.12 到 3.15 都有包 |
| 数据集 40,000 字符 | 1,115,394 字符 |
| 4 层 64 维的模型约 10M 参数 | 10.65M 对应的是 6 层 384 维；4 层 64 维只有约 0.2M |
| 显存 100 到 250 MB | 实测整卡 2.5 GB（含 CUDA 上下文和激活值） |
| 配置里 `compile = True` | Windows 上要关掉 |
| 字符级对中文不友好，因为一个汉字 3 个字节 | 说错了。`prepare.py` 按 Python 字符切分，一个汉字就是一个 token，只是词表会变成几千 |

## 8. 下一步往「通用」加什么

按「一次只改一样，改完对比 val loss 和样本」的规矩走：

1. **换中文语料，仍用字符级**：拿一本公版中文小说（几 MB）照 `prepare.py` 改一份，看模型能不能学会中文标点和句式。只改数据，模型不动，最容易对比
2. **加数据量，压过拟合**：现在 1 MB 数据第 1750 步就过拟合。换 10 MB 以上的语料，看最好的 val loss 能不能继续降
3. **加模型**：显存还剩 5.5 GB，把 `n_layer`、`n_embd` 加大，每次实测显存和每步耗时
4. **换成词元级（BPE）**：nanoGPT 的 `data/openwebtext` 用的是 GPT-2 的 tiktoken 分词；中文需要另选分词器
5. **以后再看 nanochat**：作者推荐的继任项目，包含对话微调和评测，适合「通用」阶段

要先说清楚：一台 8 GB 显存的笔记本训不出接近 AGI 的模型。每一阶段的验收要定成能量化的目标（val loss、能不能完成某类小任务），而不是「像不像通用」

## 9. 环境踩坑记录

- 代理 `http://127.0.0.1:12334` 不稳定，大文件常被截断，pip 会报「哈希不匹配」。解决办法：用 `curl -C -` 断点续传下载，核对 sha256 后再离线安装（`pip install --no-index --find-links`）
- 为了让 pip 走代理，在 `%APPDATA%\pip\pip.ini` 里加了全局 `proxy = http://127.0.0.1:12334`。它对这台电脑上所有 Python 环境都生效；不想要时运行 `pip config unset global.proxy`

## 10. 二次验收（群里 · 2026-10-31 夜）

> 主人要求寻寻 + ShaWarma 对报告做二次验收并并入本文。寻寻对照：群里中途截图、`AGI_Lab\train_run1.log`、checkpoint、库内语料。ShaWarma 若有补充写在 §10.2。

### 10.1 寻寻 · 猫娘

**总评：二次验收通过。** 报告与实测日志一致，结论站得住，可当本机「示例模型」第一步的准源。

| 核对项 | 报告写法 | 二次核对 | 结果 |
| --- | --- | --- | --- |
| 数据量 / 词表 | 1,115,394 字 / vocab 65 / 训 1,003,854 / 验 111,540 | 与官方 shakespeare_char 及库内 `语料/tinyshakespeare_input.txt` 一致 | 通过 |
| 中途 GPU | 2519/8188 MiB、78%、63℃、~82 ms/step | 群里截图（约 step 970–990）同数 | 通过 |
| loss 表 | step 750/1000/1250/1750/5000 等 | 与 `train_run1.log` 逐行一致（含 750: 1.3585/1.5842） | 通过 |
| 最好 checkpoint | step 1750 val 1.4621 | 日志确认；`out-shakespeare-char\ckpt.pt` 约 123 MB 存在 | 通过 |
| 过拟合叙述 | 1750 后 train↓ val↑ | 日志 2000→5000 val 持续变差，判断正确 | 通过 |
| 「真上 GPU」 | smi 占用与显存 | 非仅 `is_available`；与群里验收口径一致 | 通过 |
| 生成验收诚实度 | 格式过、连贯不过 | 样本像剧本腔但句间无逻辑；10M char 级预期内 | 通过 |
| 下一步顺序 | 先换语料再加参再 BPE | 对齐 Goal `00 主题与目标`；与群里「别在莎翁上耗」一致 | 通过 |

**对报告本身的小建议（不改结论，可选后续补丁）：**

1. 在 §5 或文首加互链：库内阅读语料 [[通用人工智能（AGI）/语料/README]]、讨论纪要 [[想法/01 AI 与模型/nanoGPT·莎翁体检包讨论（2026-10-31）]]
2. Obsidian 打开莎翁正文时的红波浪线 = 现代 spell check，与训练无关 → [[想法/01 AI 与模型/小发现·莎翁红色波浪线（2026-10-31）]]
3. 「官方 A100 val 1.4697」若来自 README，可在表下补一句出处链接，方便以后复查

**不推翻的点：** 环境选 cu130、`--compile=False`、从零训练路线、过拟合解释、AGI 边界（8GB 笔记本训不出通用）——二次验收同意。

### 10.2 ShaWarma

（待 ShaWarma 追加；无异议则保持「寻寻已通过、本节约」即可。）

