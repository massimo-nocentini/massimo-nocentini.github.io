---
title: "Latent Variable Methods for Ordinal Data"
linkTitle: "Ordinal & Copula Models"
weight: 40
label: "ch:ordinal"
---

{{< newthought "Many measurements in the social and biomedical sciences" />}} are **ordinal** rather than truly metric: education level (no degree $<$ high school $<$ associate’s $<$ bachelor’s $<$ graduate), survey agreement scales ($1$ to $5$), or binned income brackets. Treating “bachelor’s degree = 4” as twice “high school = 2” in a normal linear model imposes arbitrary arithmetic distances that do not exist in the data! Chapter 12 shows how **latent Gaussian variables**{{< index "latent variable" >}} let us bring all of our multivariate normal and regression machinery to ordinal, skewed, and mixed discrete–continuous datasets without forcing any parametric assumption on the marginal scales.{{< cite "hoff2009" >}}

## Ordered Probit Regression and Identifiability {#sec:ch12-probit}

Consider Hoff’s 1994 General Social Survey example relating a respondent’s highest degree $\text{DEG}_i \in \{1, 2, 3, 4, 5\}$ to their number of children $\text{CHILD}_i$ and parent’s education indicator $\text{PDEG}_i$. An **ordered probit regression**{{< index "ordered probit" >}}{{< cite "albert1993" >}} posits an unobserved continuous latent score $Z_i$ that follows a linear regression, together with ordered cutpoints $-\infty = g_0 < g_1 < \dots < g_{K-1} < g_K = +\infty$ mapping $Z_i$ onto the observed ordinal categories:

$$
Z_i = \boldsymbol{\beta}^T \mathbf{x}_i + \epsilon_i, \qquad \epsilon_i \stackrel{\text{i.i.d.}}{\sim} \mathcal{N}(0, 1), \qquad
Y_i = k \iff g_{k-1} < Z_i \le g_k \quad (k = 1, \dots, K). \label{eq:ch12-probit}
$$

Hence $\Pr(Y_i \le k \mid \mathbf{x}_i, \boldsymbol{\beta}, \mathbf{g}) = \Phi(g_k - \boldsymbol{\beta}^T\mathbf{x}_i)$ ({{< xref "fig:ch12-copula" "full" >}}, left panel).

{{< remark note="Why sigma^2 = 1 and the intercept is omitted" label="rem:ch12-ident" >}}
Notice two deliberate constraints in {{< eqref "eq:ch12-probit" >}}: there is **no intercept** in $\boldsymbol{\beta}^T\mathbf{x}_i$ (with $\mathbf{X}$ full-rank and its column space not containing the constant vector $\mathbf{1}$), and the error variance is fixed at $\sigma^2 = 1$. Why? Because shifting every $Z_i$ and every threshold $g_k$ by $+c$ leaves every inequality $g_{k-1} < Z_i \le g_k$ unchanged (location non-identifiability), and multiplying both $Z_i$ and $\mathbf{g}$ by any $a > 0$ likewise leaves every category probability unchanged (scale non-identifiability)! Fixing the intercept to $0$ and $\sigma^2 = 1$ makes $(\boldsymbol{\beta}, \mathbf{g})$ uniquely identifiable.
{{< /remark >}}

### Data-Augmentation Gibbs Sampler (Albert & Chib) {#sec:ch12-ac-gibbs}

Direct likelihood inference over $(\boldsymbol{\beta}, \mathbf{g})$ involves awkward products of differences $\Phi(g_{y_i} - \boldsymbol{\beta}^T\mathbf{x}_i) - \Phi(g_{y_i - 1} - \boldsymbol{\beta}^T\mathbf{x}_i)$. Conditioning on the latent vector $\mathbf{z} = (Z_1, \dots, Z_n)^T$ restores instant normality! Under $\boldsymbol{\beta} \sim \mathcal{N}_p(\mathbf{0}, \Sigma_0)$ and ordered normal priors on $g_1, \dots, g_{K-1}$, the three full conditionals are:

1. **Regression coefficients $\boldsymbol{\beta} \mid \mathbf{z}, \mathbf{X}$**: standard Chapter 9 normal linear regression with known variance $\sigma^2 = 1$:

   $$
   \boldsymbol{\beta} \mid \mathbf{z}, \mathbf{X} \sim \mathcal{N}_p\bigl(V \mathbf{X}^T \mathbf{z},\; V\bigr), \qquad
   V = (\Sigma_0^{-1} + \mathbf{X}^T \mathbf{X})^{-1}. \label{eq:ch12-fc-beta}
   $$

2. **Latent variables $Z_i \mid y_i, \mathbf{x}_i, \boldsymbol{\beta}, \mathbf{g}$**: independent **truncated normal**{{< index "truncated normal" >}} draws $\mathcal{N}(\boldsymbol{\beta}^T \mathbf{x}_i, 1)$ restricted to $(g_{y_i - 1},\, g_{y_i})$, sampled cleanly via the inverse-CDF method ({{< xref "app:toolkit" "full" >}}).
3. **Thresholds $g_k \mid \mathbf{y}, \mathbf{z}, \mathbf{g}_{-k}$**: truncated normal on $(a_k, b_k)$, where

   $$
   a_k = \max\bigl\{g_{k-1},\; \max_{i:\, y_i = k} Z_i\bigr\}, \qquad
   b_k = \min\bigl\{g_{k+1},\; \min_{i:\, y_i = k + 1} Z_i\bigr\}. \label{eq:ch12-thresh-bounds}
   $$

Look closely at {{< eqref "eq:ch12-thresh-bounds" >}}: when $n$ is large, the gap between $\max_{y_i = k} Z_i$ and $\min_{y_i = k+1} Z_i$ shrinks to $O(1/n)$! That traps each threshold $g_k$ inside a microscopic corridor, causing excruciatingly slow MCMC mixing between $\mathbf{g}$, $\mathbf{z}$, and $\boldsymbol{\beta}$.

{{< fig src="images/bayesian-hoff/fig-ch12-probit-copula.svg" type="fullwidth" label="fig:ch12-copula" alt="Two panels: Ordered probit latent normal density partitioned by thresholds g1 through g4 into five ordinal categories Y equals 1 through 5; and a Gaussian copula scatter plot with latent correlation C12 equals 0.68 generating an ordinal Y1 and right-skewed continuous Y2 with rising group medians" short="Ordered probit thresholds and the Gaussian copula" >}}Left: ordered probit maps a continuous latent regression score $Z_i \sim \mathcal{N}(\boldsymbol{\beta}^T\mathbf{x}_i, 1)$ into ordinal categories via thresholds $g_1, \dots, g_4$. Right: a Gaussian copula ($C_{12} = 0.68$) cleanly captures strong monotone association between an ordinal variable $Y_1$ and a skewed variable $Y_2$ without forcing normality on either margin.{{< /fig >}}

## Pettitt’s Rank Likelihood: Eliminating the Thresholds {#sec:ch12-rank}

How do we eliminate the prior on $\mathbf{g}$ and the tight $\mathbf{g}$–$\mathbf{z}$ coupling—and even handle continuous non-normal responses where the number of distinct values $K$ is huge? Suppose $Y_i = g(Z_i)$ for an *unknown* non-decreasing transformation $g$. Even without knowing $g$, observing $\mathbf{y} = (y_1, \dots, y_n)$ tells us an exact order event on the latent vector $\mathbf{z}$:

$$
\mathbf{z} \in R(\mathbf{y}) \equiv \bigl\{\mathbf{z} \in \mathbb{R}^n : y_i < y_j \implies z_i < z_j \text{ for all } i, j\bigr\}. \label{eq:ch12-rank-set}
$$

The **rank likelihood**{{< index "rank likelihood" >}}{{< cite "pettitt1982" >}} uses the probability of the event $\{\mathbf{Z} \in R(\mathbf{y})\}$, bypassing $g$ (and all thresholds $g_k$) entirely:

$$
p\bigl(\mathbf{Z} \in R(\mathbf{y}) \mid \mathbf{X}, \boldsymbol{\beta}\bigr)
= \int_{R(\mathbf{y})} p(\mathbf{z} \mid \mathbf{X}, \boldsymbol{\beta})\,d\mathbf{z}. \label{eq:ch12-rank-lik}
$$

Because $R(\mathbf{y})$ depends only on the *ordering* of $\mathbf{y}$ and not on any numerical coding of categories or parametric form of $g$, inference for $\boldsymbol{\beta}$ is **completely invariant** to strictly increasing transformations of $Y$! (Note that when $n$ is large and $K$ is small, each $Z_i$ is still confined between neighboring categories, so convergence diagnostics remain essential.) Gibbs sampling under {{< eqref "eq:ch12-rank-lik" >}} requires only two blocks:

{{< thm kind="algorithm" note="Rank-Likelihood Regression Gibbs Sampler" label="alg:ch12-rank-gibbs" >}}
Initialize $\mathbf{z}^{(0)} \in R(\mathbf{y})$ (e.g., normal scores $\Phi^{-1}\bigl(\frac{\operatorname{rank}(y_i)}{n+1}\bigr)$) and $\boldsymbol{\beta}^{(0)}$. For $s = 1, \dots, S$:

1. **Update $\boldsymbol{\beta}^{(s)}$** from the normal regression conditional {{< eqref "eq:ch12-fc-beta" >}} given $\mathbf{z}^{(s-1)}$.
2. **Update $Z_i^{(s)}$** sequentially for $i = 1, \dots, n$: draw $Z_i^{(s)}$ from $\mathcal{N}(\boldsymbol{\beta}^{(s)T}\mathbf{x}_i, 1)$ truncated to the order-preserving interval $(a_i, b_i)$, where

   $$
   a_i = \max\{z_j : y_j < y_i\}, \qquad b_i = \min\{z_j : y_j > y_i\}
   $$

   (with $a_i = -\infty$ if $y_i$ is minimal, and $b_i = +\infty$ if $y_i$ is maximal).
{{< /thm >}}

## Semiparametric Gaussian Copula Models {#sec:ch12-copula}

Now elevate the exact same idea from regression to **multivariate mixed data**: suppose each respondent $i = 1, \dots, n$ has a $p$-dimensional vector $\mathbf{Y}_i = (Y_{i,1}, \dots, Y_{i,p})$ mixing binary, ordinal, count, and skewed continuous variables (such as Hoff’s 1994 GSS dataset of 7 variables: `INCOME`, `DEG`, `CHILD`, `PDEG`, `AGE`, `PINC`, `FEMALE`).

By **Sklar’s theorem**{{< cite "sklar1959" >}}{{< index "Sklar’s theorem" >}}, any joint distribution with marginal CDFs $F_1, \dots, F_p$ can be decomposed into its marginals and a dependence function (a **copula**{{< index "Gaussian copula" >}}). The **Gaussian copula** models the dependence through a latent multivariate normal vector with unit variances and correlation matrix $C$:

$$
\mathbf{Z}_1, \dots, \mathbf{Z}_n \mid C \stackrel{\text{i.i.d.}}{\sim} \mathcal{N}_p(\mathbf{0}, C), \qquad
Y_{i,j} = F_j^{-1}\!\bigl(\Phi(Z_{i,j})\bigr), \qquad j = 1, \dots, p, \label{eq:ch12-copula}
$$

where $F_j^{-1}(u) = \inf\{y : F_j(y) \ge u\}$ is the generalized inverse of the unknown marginal CDF $F_j$ ({{< xref "fig:ch12-copula" "full" >}}, right panel).{{< sidenote >}}**Subtlety of Sklar’s theorem for discrete margins:** when all $F_j$ are continuous, the copula $C$ is *unique*. When some coordinates $Y_j$ are discrete or ordinal, the copula is uniquely determined only on the Cartesian product of the ranges of $F_j$; the rank-likelihood posterior over $C$ integrates coherently over all latent orderings compatible with the observed ties, identifying the latent Gaussian correlation structure cleanly{{< cite "hoff2007" >}}.{{< /sidenote >}}

### Extended Rank Likelihood and Parameter Expansion {#sec:ch12-px}

Applying the rank likelihood column by column defines the order constraint $\mathbf{Z} \in R(\mathbf{Y})$, where within *every* column $j = 1, \dots, p$, $y_{i_1, j} < y_{i_2, j} \implies z_{i_1, j} < z_{i_2, j}$. Look at what happens automatically when an entry $y_{i,j}$ is **missing at random (MAR)**{{< cite "little2002" >}}: it imposes *no* ordering constraint on $Z_{i,j}$, so $(a_{i,j}, b_{i,j}) = (-\infty, +\infty)$—meaning we simply draw $Z_{i,j}$ from its unconstrained conditional normal distribution given $\mathbf{Z}_{i,-j}$! Missing data require literally zero extra machinery!

One obstacle remains: sampling a correlation matrix $C$ directly (subject to $C_{j,j} = 1$ for all $j$) has no conjugate prior. Hoff{{< cite "hoff2007" >}} resolves this with **parameter expansion**{{< index "parameter expansion" >}}{{< cite "liu1999" >}}:

1. Work with an unconstrained covariance matrix $\Sigma \sim \operatorname{inverse-Wishart}(\nu_0, S_0^{-1})$ (for which $\Sigma \mid \mathbf{Z}$ *is* conjugate!) and treat $\Sigma$—not $C$—as the Markov chain state, placing on $C$ the prior induced through the correlation projection $C = h(\Sigma)$ where $C_{j,k} = \Sigma_{j,k} / \sqrt{\Sigma_{j,j}\Sigma_{k,k}}$.
2. Why is this valid? Because rescaling column $j$ of $\mathbf{Z}$ by any positive standard deviation $d_j = \sqrt{\Sigma_{j,j}}$ leaves the ordering event $R(\mathbf{Y})$ **strictly invariant**! Running the Gibbs sampler on the expanded pair $(\mathbf{Z}, \Sigma)$ with $\mathbf{Z}_i \mid \Sigma \sim \mathcal{N}_p(\mathbf{0}, \Sigma)$ preserves the exact induced posterior of $C = h(\Sigma)$, which we simply record as output at every scan!

{{< thm kind="algorithm" note="Parameter-Expanded Gibbs Sampler for the Gaussian Copula" label="alg:ch12-copula-gibbs" >}}
Initialize $\mathbf{Z}^{(0)} \in R(\mathbf{Y})$ (column-wise normal scores, $0$ for missing entries) and $\Sigma^{(0)} = I_p$. For $s = 1, \dots, S$:

1. **Update latent matrix $\mathbf{Z}$ given $\Sigma^{(s-1)}$**: for each column $j = 1, \dots, p$, compute the conditional regression weights $\mathbf{w}_j = \Sigma_{-j,-j}^{-1} \Sigma_{-j,j}$ and conditional variance $v_j = \Sigma_{j,j} - \Sigma_{j,-j} \Sigma_{-j,-j}^{-1} \Sigma_{-j,j}$ from $\Sigma = \Sigma^{(s-1)}$. For each observation $i = 1, \dots, n$, set $\mu_{i,j} = \mathbf{Z}_{i,-j}\mathbf{w}_j$:
   - if $y_{i,j}$ is observed, draw $Z_{i,j}$ from $\mathcal{N}(\mu_{i,j}, v_j)$ truncated to $(\max_{k:\, y_{k,j} < y_{i,j}} Z_{k,j},\; \min_{k:\, y_{k,j} > y_{i,j}} Z_{k,j})$;
   - if $y_{i,j}$ is missing, draw $Z_{i,j} \sim \mathcal{N}(\mu_{i,j}, v_j)$ unconstrained.
2. **Parameter-expanded covariance draw**: draw $\Sigma^{(s)} \sim \operatorname{inverse-Wishart}\bigl(\nu_0 + n,\, (S_0 + \mathbf{Z}^T \mathbf{Z})^{-1}\bigr)$ and record the projected correlation matrix $C^{(s)}_{j,k} = \Sigma^{(s)}_{j,k} / \sqrt{\Sigma^{(s)}_{j,j}\Sigma^{(s)}_{k,k}}$ as output (keeping $\Sigma^{(s)}$ as the chain state for the next scan).{{< sidenote >}}Watch for a variable-naming typo in Hoff’s R code on p. 220, which defines the conditional regression-weight vector `Sz <- Sigma[j,-j] %*% solve(Sigma[-j,-j])` on line 1 and then references `Sjc` on lines 2–3; see {{< xref "app:errata" "full" >}}.{{< /sidenote >}}
{{< /thm >}}

### Partial Regression and Latent Conditional Independence Graphs {#sec:ch12-graphs}

Once we have posterior draws $C^{(1)}, \dots, C^{(S)}$ from {{< xref "alg:ch12-copula-gibbs" "full" >}}, every tool from {{< xref "ch:mvn" "full" >}} carries over intact to arbitrary mixed ordinal data! In particular, computing the **partial regression coefficients** $\boldsymbol{\beta}_{j \mid -j}^{(s)} = (C_{-j,-j}^{(s)})^{-1} C_{-j,j}^{(s)}$ and the **precision matrix** $\Omega^{(s)} = (C^{(s)})^{-1}$ at each iteration reveals the **latent Gaussian graphical model**{{< index "graphical model" >}}{{< cite "lauritzen1996" >}}: a zero entry $\Omega_{j,k} = 0$ means $Z_j$ and $Z_k$ are *conditionally independent* given all remaining latent variables (note that this transfers directly to conditional independence of the observables $Y_j$ and $Y_k$ given $\mathbf{Y}_{-\{j,k\}}$ only when all margins are continuous, since coarse discrete margins carry less conditioning information than the latent scores). In Hoff’s 1994 GSS analysis, marginal correlations link almost every pair of variables, whereas the partial coefficients isolate direct pathways—showing, for example, that respondent income depends strongly on `DEG`, `AGE`, and `FEMALE`, while parent’s education `PDEG` acts largely *indirectly* through the respondent’s own degree `DEG`!

```python
import numpy as np
from scipy import stats

# Parameter-expanded Gaussian copula Gibbs sampler on mixed ordinal + skewed data
rng = np.random.default_rng(12)
n, p = 150, 3
C_true = np.array([[1.0, 0.65, 0.30], [0.65, 1.0, 0.50], [0.30, 0.50, 1.0]])
Z_true = rng.multivariate_normal(np.zeros(p), C_true, size=n)

# Create mixed non-normal observables: Y0 ordinal (1..5), Y1 skewed exp, Y2 binary (0/1)
Y = np.empty((n, p))
Y[:, 0] = np.digitize(stats.norm.cdf(Z_true[:, 0]), [0.15, 0.40, 0.70, 0.88]) + 1
Y[:, 1] = np.exp(0.7 * Z_true[:, 1])
Y[:, 2] = (Z_true[:, 2] > 0.2).astype(float)
Y[rng.uniform(size=(n, p)) < 0.08] = np.nan  # inject 8% MCAR missing entries

# Initialize Z with column-wise normal scores (0 for missing) and Sigma = I_p
Z = np.zeros((n, p))
for j in range(p):
    obs = ~np.isnan(Y[:, j])
    ranks = stats.rankdata(Y[obs, j])
    Z[obs, j] = stats.norm.ppf(ranks / (obs.sum() + 1.0))

nu0, S0 = p + 2.0, np.eye(p)
Sig = np.eye(p)  # keep expanded Sigma as the Markov chain state!
S_iter = 600
C_draws = np.empty((S_iter, p, p))

for s in range(S_iter):
    # 1. Update Z column by column given Sigma and order constraints R(Y)
    for j in range(p):
        oth = [k for k in range(p) if k != j]
        w = np.linalg.solve(Sig[np.ix_(oth, oth)], Sig[oth, j])
        sd = np.sqrt(max(Sig[j, j] - float(Sig[j, oth] @ w), 1e-8))
        mu = Z[:, oth] @ w
        yj = Y[:, j]
        obs_vals = np.unique(yj[~np.isnan(yj)])
        for val in obs_vals:
            idx = np.where(yj == val)[0]
            lo_mask = (~np.isnan(yj)) & (yj < val)
            hi_mask = (~np.isnan(yj)) & (yj > val)
            a = Z[lo_mask, j].max() if np.any(lo_mask) else -np.inf
            b = Z[hi_mask, j].min() if np.any(hi_mask) else np.inf
            ua = stats.norm.cdf((a - mu[idx]) / sd)
            ub = stats.norm.cdf((b - mu[idx]) / sd)
            u = rng.uniform(ua, np.maximum(ub, ua + 1e-12))
            draw = mu[idx] + sd * stats.norm.ppf(np.clip(u, 1e-12, 1 - 1e-12))
            Z[idx, j] = np.clip(draw, a, b)
        mis = np.where(np.isnan(yj))[0]
        if len(mis):
            Z[mis, j] = rng.normal(mu[mis], sd)
    # 2. Parameter-expanded Inverse-Wishart draw; record projected C = h(Sigma)
    Sig = stats.invwishart.rvs(df=nu0 + n, scale=S0 + Z.T @ Z, random_state=rng)
    d = np.sqrt(np.diag(Sig))
    C_draws[s] = Sig / np.outer(d, d)

print("True C:\n", np.round(C_true, 2))
print("Posterior E[C | Y]:\n", np.round(C_draws[150:].mean(axis=0), 2))
```

## Symbolic Check in Wolfram Language {#sec:ch12-wolfram}

Verifies ordered-probit shift/scale invariance symbolically in `wolfram-ws-bridge` JavaScript mode, solves $(C^{-1})_{1,3} = 0$ for a $3 \times 3$ correlation matrix to prove $Z_1 \perp Z_3 \mid Z_2 \iff C_{1,3} = C_{1,2}C_{2,3}$, and contrasts exact conditional independence ($C_{1,3} = 0.325$) against the Python simulation ($C_{1,3} = 0.30$).

```js
const invResid = toJS(await wl`Assuming[a > 0, Simplify[
  1/2*Erfc[-((a*g + c) - (a*eta + c))/(a*Sqrt[2])] - 1/2*Erfc[-(g - eta)/Sqrt[2]]]]`)
console.log('Ordered-probit shift/scale invariance residual =', invResid)
```


```text
Ordered-probit shift/scale invariance residual = 0
```

```js
// Latent conditional independence Z1 _|_ Z3 | Z2 iff (C^(-1))_{1,3} == 0
const C3 = [[1, W.r12, W.r13], [W.r12, 1, W.r23], [W.r13, W.r23, 1]]
const omega13 = await show`Factor[Inverse[${C3}][[1, 3]]]`
```


$$
\frac{\text{r13}-\text{r12} \text{r23}}{-1+\text{r12}^2+\text{r13}^2-2 \text{r12} \text{r13} \text{r23}+\text{r23}^2}
$$

```js
const solR13 = await show`r13 /. First[Solve[${omega13} == 0, r13]]`
```


$$
\text{r12} \text{r23}
$$

```js
// Contrast exact conditional independence (r13 = 13/40 = 0.325) vs. Ch. 12 Python (r13 = 3/10 = 0.30)
const omZero = toJS(await wl`${omega13} /. {r12 -> 13/20, r23 -> 1/2, r13 -> 13/40}`)
const omPy = toJS(await wl`N[${omega13} /. {r12 -> 13/20, r23 -> 1/2, r13 -> 3/10}]`)
console.log(`At (r12, r23) = (0.65, 0.50): Omega_13(0.325) = ${omZero},  Omega_13(0.30) = ${omPy.toFixed(4)}`)
```


```text
At (r12, r23) = (0.65, 0.50): Omega_13(0.325) = 0,  Omega_13(0.30) = 0.0578
```

## Exercises {#sec:ch12-exercises}

{{< thm kind="exercise" label="ex:ch12-invariance" >}}
Verify numerically using the Gaussian copula script above that replacing column $Y_1$ with $Y_1' = \log(Y_1)$ or $Y_1'' = Y_1^3$ leaves the posterior distribution of $C$ completely unchanged (up to Monte Carlo variation). Explain why this invariance fails for the standard multivariate normal model of {{< xref "ch:mvn" "full" >}}.
{{< /thm >}}

{{< thm kind="exercise" label="ex:ch12-probit-vs-rank" >}}
Simulate $n = 200$ observations from an ordered probit model with $K = 5$ categories and $\boldsymbol{\beta} = (0.8, -0.5)^T$. Compare the lag-1 autocorrelation and effective sample size $S_{\text{eff}}$ of $\beta_1$ under (a) the Albert–Chib threshold Gibbs sampler {{< eqref "eq:ch12-thresh-bounds" >}} and (b) the rank-likelihood Gibbs sampler {{< xref "alg:ch12-rank-gibbs" "full" >}}.
{{< /thm >}}

{{< thm kind="exercise" label="ex:ch12-partial-graph" >}}
In the copula script above, construct a 3-variable precision matrix $\Omega$ with $\Omega_{1,3} = 0$ (so $Z_1 \perp Z_3 \mid Z_2$ even though $C_{1,3} > 0$). Run {{< xref "alg:ch12-copula-gibbs" "full" >}}, compute the posterior 95% credible intervals of $C_{1,3}$ and $\Omega_{1,3} = (C^{-1})_{1,3}$, and verify that the copula accurately distinguishes marginal correlation from conditional independence!
{{< /thm >}}
