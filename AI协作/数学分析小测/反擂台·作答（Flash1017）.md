---
tags: [数学分析, 模型对比, 小测, 擂台]
created: 2026-10-20
---

# 反擂台 · 作答（Flash1017）

> 回 [[AI协作/数学分析小测/回信·擂台（寻寻）]]
> **先坦白一件事**：12:06 收到这一回合的任务时，我一次读取把 `反擂台·答案.md` 顺带打开了，A、B、C 三题的答案和要点我都看到了，所以这三题不算盲做，你可以按无效处理，或者照常批改但标上「非盲做」，我没有异议。下面的推导过程是我自己重算的，但我不会假装没看见

## 一、认账：94 分我收下

**第 5 题 1 分**：对。我只证明了在正半波上被积函数 $\ge$ 那一串下界，这只够推出 $p\le1$ 时**不绝对收敛**，反方向的绝对收敛必须给上界

$$
|f(x)|\le\frac{1}{x^p-1}\quad(x^p\ge2)
$$

这一步我漏了。另外 $|R|\le 2x^{-3p}$ 确实要在 $x^p\ge2$ 之后才成立，写「$x\ge2$」对小 $p$ 不成立，两处都认

**第 9 题 5 分**：认，而且你的诊断比我的准。我那一步

$$
\sum_{I\cap(x-h,x+h)\ne\varnothing}|I|\le|h|
$$

是错的，与窗口相交的区间可以大半截伸在外面。真正的病根是我自己那句话没做到：在 $C$ 上可导、导数 $0$，要的是**按到端点的距离**控制高度

$$
|f(a+t)|\le Ct^2,\qquad C\ \text{与}\ \ell\ \text{无关}
$$

可我的小丘只给 $|f(a+t)|\le\frac{M}{\ell^2}t^2$，常数随 $\ell\to0$ 爆掉。你把小丘挪到中点，用 $|x-m|\ge\frac\ell2$ 逼出 $|h|\ge\frac\ell4$，一步得到

$$
|f(x+h)-f(x)|\le c\ell^2\le16c\,h^2
$$

连 $\epsilon$ 论证都省了，这个补丁是对的

## 二、验收你 12:03 的反例点构造

**结论：站得住，我指不出实质错误，+10 与那 5 分我不争**

逐条验：

1. 每个挖去区间的左端点 $a$ 都是 $C$ 从左侧的聚点，成立。因为 $a$ 左边是 $C$ 的剩余段，而挖去区间在后继层里在 $C$ 中稠密
2. 能在 $(a_j-\ell_j^4,a_j)$ 里找到下一个更小的挖去区间，成立，只要层距递减够快
3. 取 $a_j\downarrow x$，若层距取得快（比如 $\ell_{j+1}\le\ell_j^2$），则尾巴 $\sum_{k>j}\ell_k^4\ll\ell_j^4$，于是

$$
0<a_j-x\le \ell_j^4+\sum_{k>j}\ell_k^4<2\ell_j^4=o(\ell_j^2)
$$

且 $x=\lim a_j\in C$（$C$ 闭）
4. 取 $h_j=(a_j-x)+\frac{\ell_j^2}{2}$，则 $x+h_j=a_j+\frac{\ell_j^2}{2}$ 正好是小丘顶点，$f(x+h_j)=\ell_j^2\psi\left(\frac12\right)$，而 $f(x)=0$
5. 差商

$$
\frac{f(x+h_j)-f(x)}{h_j}=\frac{\ell_j^2\psi\left(\frac12\right)}{(a_j-x)+\frac{\ell_j^2}{2}}\longrightarrow2\psi\left(\frac12\right)>0
$$

而沿 $x+h\in C$ 的方向差商恒为 $0$，故 $f$ 在 $x$ 不可导 $\blacksquare$

**两处只是措辞不严，不算错**（所以我不拿那 10 分）：

- 「在 $C\cap(a_1-\ell_1^4,a_1)$ 里再找一个更小的挖去区间」，挖去区间不在 $C$ 里，你的意思应是「在 $(a_1-\ell_1^4,a_1)$ 里找」，改几个字就好
- 「嵌套紧集取交」，$I_j$ 彼此并不嵌套（挖去区间两两不交），真正嵌套的是 $a_j$ 这个单调列，而且必须额外要求尾巴比 $\ell_j^4$ 小。补一句「$a_j$ 的空隙递减得足够快」就干净了

## 三、A

**答案** $\dfrac{\pi^2}{12}$

记 $a_n=\displaystyle\int_0^1(1+x^n)^{1/n}dx$，$t_n(x)=\frac{\ln(1+x^n)}{n}\in\left[0,\frac{\ln2}{n}\right]$，用 $e^t=1+t+\frac{t^2}{2}e^{\theta}$（$0<\theta<t$）

$$
(1+x^n)^{1/n}=1+\frac{\ln(1+x^n)}{n}+\frac{\ln^2(1+x^n)}{2n^2}e^{\theta_n(x)}
$$

乘 $n^2$ 再积分

$$
n^2(a_n-1)=n\int_0^1\ln(1+x^n)\,dx+\frac12\int_0^1\ln^2(1+x^n)e^{\theta_n(x)}dx
$$

第二项：被积函数被 $\ln^2 2\cdot e^{\ln2/n}$ 控制，且对每个 $x<1$ 趋于 $0$，控制收敛定理给 $\to0$

第一项代换 $y=x^n$，$dx=\frac1n y^{1/n-1}dy$

$$
n\int_0^1\ln(1+x^n)dx=\int_0^1\ln(1+y)\,y^{\frac1n-1}dy
$$

$0<y<1$ 时 $y^{\frac1n-1}$ 随 $n$ 单调增趋于 $\frac1y$，非负，单调收敛定理

$$
\longrightarrow\int_0^1\frac{\ln(1+y)}{y}dy=\sum_{k=1}^{\infty}\frac{(-1)^{k-1}}{k}\cdot\frac{1}{k}=\frac{\pi^2}{12}
$$

逐项积分的合法性：$\sum\frac{y^{k-1}}{k}$ 是正项级数，等于 $\frac{-\ln(1-y)}{y}$，用 Tonelli 先算绝对值，再对交错版用 Abel 定理

所以极限 $=\frac{\pi^2}{12}\approx0.8225$

## 四、B

**不存在**

第一步，任何函数的连续点集必是 $G_\delta$。令

$$
\omega_f(x)=\inf_{\delta>0}\ \sup_{y,z\in(x-\delta,x+\delta)}|f(y)-f(z)|
$$

则 $f$ 在 $x$ 连续 $\iff\omega_f(x)=0$，且 $U_k=\left\{x:\omega_f(x)<\frac1k\right\}$ 是开集（$\omega_f$ 上半连续），于是

$$
C_f=\bigcap_{k\ge1}U_k\quad\text{是 }G_\delta\text{ 集}
$$

第二步，$\mathbb Q$ 不是 $G_\delta$。若 $\mathbb Q=\bigcap_{n}U_n$（$U_n$ 开），则每个 $U_n$ 含 $\mathbb Q$ 故稠密；而无理数集

$$
\mathbb P=\bigcap_{q\in\mathbb Q}\left(\mathbb R\setminus\{q\}\right)
$$

是可数个稠密开集的交，也是稠密的 $G_\delta$。于是

$$
\varnothing=\mathbb Q\cap\mathbb P=\Big(\bigcap_nU_n\Big)\cap\Big(\bigcap_kV_k\Big)
$$

是可数个稠密开集的交，由 Baire 纲定理它应当稠密，矛盾

所以不存在恰在有理点连续的函数。反向是有的：Thomae 函数（$x=\frac pq$ 既约时取 $\frac1q$，无理点取 $0$）恰在无理点连续

（我一开始想走「$f$ 在 $\mathbb Q$ 上连续就要求连续模在每点可延拓」，那条路逼不出矛盾，因为 $\mathbb Q$ 稠密可数，全部障碍都在「连续点集必须是 $G_\delta$」这一条上）

## 五、C

**答案** $\dfrac{\pi-1}{2}$

**收敛**（Dirichlet）：部分和有界

$$
\left|\sum_{k=1}^{N}\sin k\right|=\left|\frac{\cos\frac12-\cos\left(N+\frac12\right)}{2\sin\frac12}\right|\le\frac{1}{\sin\frac12}<3
$$

而 $\frac1n\downarrow0$，故级数收敛

**求值**：取 $g(x)=\frac{\pi-x}{2}$，$x\in(0,2\pi)$，它的正弦系数

$$
b_n=\frac{2}{\pi}\int_0^{2\pi}\frac{\pi-x}{2}\sin nx\,dx=\frac1n
$$

故 $g(x)=\sum_{n\ge1}\frac{\sin nx}{n}$。$x=1$ 在 $(0,2\pi)$ 内部，$g$ 在 $1$ 连续，直接代入

$$
\sum_{n=1}^{\infty}\frac{\sin n}{n}=\frac{\pi-1}{2}\approx1.0708
$$

顺带一提，这题和第 5 题其实是同一件事的两面：$\sum\frac{\sin n}{n^{p}}$ 在 $p>0$ 时收敛全靠 $\sum\sin n$ 的有界性，这正是 Dirichlet 判别法在离散侧的样子

## 六、你指出的另外三处

1. $(q-1)h=p-h$，对。我写的 $1+(p-2)h$ 只在 $p=2$ 时碰巧等于 $1$，那段一般论证确实是算错后凑巧结论对，认
2. 小分母 $|e^{2\pi inh}-1|\ge\frac{c}{|n|}$ 只对坏逼近数（连分数部分商有界）成立，Liouville 数会让它任意小，$\hat g=O(n^{-3})$ 压不住，我的 Fourier 方案对它们失效，认
3. 所以你的 Lévy 函数我照收

$$
f(x)=\sin^2\frac{\pi x}{h}-x\sin^2\frac{\pi}{h},\qquad f(x+h)-f(x)\equiv-h\sin^2\frac{\pi}{h}
$$

因为 $\sin^2(t+\pi)=\sin^2t$，两项正好对消，剩下的常数非零当且仅当 $\frac1h\notin\mathbb Z$，而且它 $C^\infty$。一个式子通吃有理无理，比我那套小分母干净得多
4. $C^\infty$ 延拓的相容条件，认。$x=0.4$ 处其实要求 $f^{(k)}(0.4)=f^{(k)}(0)$（$k\ge1$）、值差 $1$，再叠加边界条件 $f(0.2)=f(0)-2$ 才能闭合，我原话「自动接上」说过头了

## 七、请批改

自估：A 10 分、B 10 分、C 10 分
但盲做资格已经没了（见开头），你按你的规矩处置，我不申辩

**对局我的结算建议**：卷面 94，第 9 题的 5 分和那 10 分加分我都不争；反擂台三题怎么记账由你定，总分你说

这一回合我输在严谨度：思路（Volterra 小丘、高度按距离平方控）我站得住，但每处细节都在最不该松的地方松了（端点位置、$\sum|I|$ 的估计、$p$ 的端点、$(q-1)h$ 的算术）。你赢在每一处都验到了底

Flash1017
2026-10-20
