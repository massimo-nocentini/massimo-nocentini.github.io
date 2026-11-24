---
title: "Mathematical Toolkit and Concept Map"
linkTitle: "Toolkit & Concept Map"
matter: appendix
weight: 420
label: "app:toolkit"
---

{{< newthought "Six algebraic and probabilistic tools" />}} do almost all the heavy lifting across Hoff’s twelve chapters. Keeping them collected in one place makes every derivation in Parts I–III transparent—and the master concept map at the end shows how every chapter links into a single coherent architecture.

## Six Recurring Mathematical Identities {#sec:appB-identities}

### 1. Completing the Square (Scalar and Vector) {#sec:appB-square}

For a scalar precision $a > 0$ and linear coefficient $b \in \mathbb{R}$,

$$
-\frac{1}{2}a x^2 + b x = -\frac{1}{2}a\left(x - \frac{b}{a}\right)^2 + \frac{b^2}{2a}. \label{eq:appB-scalar-sq}
$$

For a symmetric positive-definite $p \times p$ precision matrix $A = A^T \succ 0$ and vector $\mathbf{b} \in \mathbb{R}^p$,

$$
-\frac{1}{2}\mathbf{x}^T A \mathbf{x} + \mathbf{x}^T \mathbf{b}
= -\frac{1}{2}(\mathbf{x} - A^{-1}\mathbf{b})^T A (\mathbf{x} - A^{-1}\mathbf{b}) + \frac{1}{2}\mathbf{b}^T A^{-1}\mathbf{b}. \label{eq:appB-vec-sq}
$$

Whenever a log-conditional density equals the left-hand side of {{< eqref "eq:appB-vec-sq" >}} plus a constant independent of $\mathbf{x}$, we immediately read off $\mathbf{x} \sim \mathcal{N}_p(A^{-1}\mathbf{b},\, A^{-1})$.

### 2. The Matrix Trace Trick {#sec:appB-trace}

Because a scalar equals its own trace and $\operatorname{tr}(BC) = \operatorname{tr}(CB)$ whenever both products are square,

$$
\sum_{i=1}^n (\mathbf{y}_i - \boldsymbol{\theta})^T \Sigma^{-1} (\mathbf{y}_i - \boldsymbol{\theta})
= \sum_{i=1}^n \operatorname{tr}\!\left((\mathbf{y}_i - \boldsymbol{\theta})(\mathbf{y}_i - \boldsymbol{\theta})^T \Sigma^{-1}\right)
= \operatorname{tr}(\mathbf{S}_{\boldsymbol{\theta}} \Sigma^{-1}), \label{eq:appB-trace}
$$

where $\mathbf{S}_{\boldsymbol{\theta}} = \sum_{i=1}^n (\mathbf{y}_i - \boldsymbol{\theta})(\mathbf{y}_i - \boldsymbol{\theta})^T$. This identity turns the MVN likelihood into an inverse-Wishart kernel in $\Sigma$ (used in {{< xref "ch:mvn" "full" >}}, {{< xref "ch:mixed" "full" >}}, and {{< xref "ch:ordinal" "full" >}}).

### 3. Block Inversion and the Schur Complement {#sec:appB-schur}

Partition a symmetric positive-definite matrix $\Sigma$ and its inverse $\Omega = \Sigma^{-1}$ compatibly into index sets $a$ and $b$:

$$
\Sigma = \begin{pmatrix} \Sigma_{a,a} & \Sigma_{a,b} \\ \Sigma_{b,a} & \Sigma_{b,b} \end{pmatrix}, \qquad
\Sigma_{b \mid a} = \Sigma_{b,b} - \Sigma_{b,a}\Sigma_{a,a}^{-1}\Sigma_{a,b}. \label{eq:appB-schur}
$$

The matrix $\Sigma_{b \mid a}$ is the **Schur complement**{{< index "Schur complement" >}} of $\Sigma_{a,a}$ in $\Sigma$. By the block LDU factorization, $\lvert \Sigma \rvert = \lvert \Sigma_{a,a} \rvert \cdot \lvert \Sigma_{b \mid a} \rvert$, and the conditional distribution of $\mathbf{Y}_b \mid \mathbf{Y}_a = \mathbf{y}_a$ for $\mathbf{Y} \sim \mathcal{N}_p(\boldsymbol{\theta}, \Sigma)$ is $\mathcal{N}\bigl(\boldsymbol{\theta}_b + \Sigma_{b,a}\Sigma_{a,a}^{-1}(\mathbf{y}_a - \boldsymbol{\theta}_a),\; \Sigma_{b \mid a}\bigr)$. Moreover, the precision block satisfies $\Omega_{b,b} = \Sigma_{b \mid a}^{-1}$ and $\Omega_{b,a} = -\Sigma_{b \mid a}^{-1}\Sigma_{b,a}\Sigma_{a,a}^{-1}$, proving immediately that $\boldsymbol{\beta}_{b \mid a} = \Sigma_{b,a}\Sigma_{a,a}^{-1} = -\Omega_{b,b}^{-1}\Omega_{b,a}$—so zeros of $\Omega = \Sigma^{-1}$ encode conditional independence!

### 4. The Woodbury Matrix Identity {#sec:appB-woodbury}

For conformable invertible matrices $A$ and $C$,

$$
(A + U C V)^{-1} = A^{-1} - A^{-1} U (C^{-1} + V A^{-1} U)^{-1} V A^{-1}. \label{eq:appB-woodbury}
$$

This identity simplifies both marginal likelihood integrations (such as Zellner’s $g$-prior in {{< xref "ch:regression" "full" >}}, where $I_n + g X(X^T X)^{-1} X^T$ has inverse $I_n - \frac{g}{g+1} X(X^T X)^{-1} X^T$) and low-rank covariance updates.

### 5. Inverse-CDF Sampling for Truncated Normal Distributions {#sec:appB-truncnorm}

To draw $Z \sim \mathcal{N}(\mu, \sigma^2)$ restricted to an interval $(a, b)$ (used in ordered probit, rank likelihood, and Gaussian copulas in {{< xref "ch:ordinal" "full" >}}):

1. Compute $u_a = \Phi\!\bigl(\frac{a - \mu}{\sigma}\bigr)$ and $u_b = \Phi\!\bigl(\frac{b - \mu}{\sigma}\bigr)$.
2. Draw $U \sim \operatorname{uniform}(u_a, u_b)$.
3. Return $Z = \mu + \sigma\,\Phi^{-1}(U)$.

{{< remark note="Numerical caution in extreme tails" label="rem:appB-trunc-num" >}}
When both $(a - \mu)/\sigma$ and $(b - \mu)/\sigma$ exceed roughly $8$, floating-point `norm.cdf` saturates to `1.0` and `norm.ppf(1.0)` returns `inf`. In production code, use `scipy.stats.truncnorm` or log-space tail approximations whenever an interval lies far in the tail.
{{< /remark >}}

### 6. Markov Chain Convergence Checklist {#sec:appB-mcmc}

A Markov chain with transition kernel $K(\phi \to \phi')$ converges to the target posterior $\pi(\phi) = p(\phi \mid y)$ as $S \to \infty$ when three structural conditions hold:{{< cite "robert2004" >}}
- **Stationarity (invariance)**: $\int \pi(\phi)\,K(\phi \to \phi')\,d\phi = \pi(\phi')$ (automatically implied by **detailed balance**, $\pi(\phi)\,K(\phi \to \phi') = \pi(\phi')\,K(\phi' \to \phi)$, though systematic-scan Gibbs satisfies invariance directly without reversibility).
- **Irreducibility**: the chain can reach any positive-probability subset of $\Theta$ from any starting state in finitely many steps (preventing disconnected islands).
- **Aperiodicity**: the chain does not cycle deterministically between disjoint regions.

## Master Concept Map of Hoff (2009) {#sec:appB-map}

| Ch. | Title & Core Idea | Model & Prior | Inference Engine | Flagship Dataset(s) | Builds On |
|:----|:------------------|:--------------|:-----------------|:--------------------|:----------|
| 1 | Introduction & Examples | Binomial–Beta; sparse regression | Exact conjugacy; BMA preview | Rare infection ($n=20, y=0$); Diabetes ($p=64$) | — |
| 2 | Belief, Probability & Exchangeability | Belief axioms P1–P3; de Finetti | Exact Bayes’ rule & Bayes factors | Screening; GSS survey | Ch. 1 |
| 3 | One-Parameter Models | Beta–Binomial; Poisson–Gamma; Exp. families | Closed-form conjugacy, HPD | GSS happiness & birth rates | Ch. 2 |
| 4 | Monte Carlo Approximation | Arbitrary $g(\theta)$; predictive checks | i.i.d. MC, ancestral sampling, PPC | GSS log-odds & fertility PPC | Ch. 3 |
| 5 | The Normal Model | $\mathcal{N}(\theta, \sigma^2)$ + Normal–IG | Exact Student-$t$; MSE theorem | Midge wing lengths ($n=9$); Town IQ | Ch. 3–4 |
| 6 | The Gibbs Sampler | Semiconjugate independent prior | 2-block Gibbs; ACF & $S_{\text{eff}}$ | Midge data; Trimodal mixture trap | Ch. 4–5 |
| 7 | Multivariate Normal Model | $\mathcal{N}_p(\boldsymbol{\theta}, \Sigma)$ + MVN/IW | Trace trick; Schur MAR augmentation | Reading scores ($n=22$); Pima Indians | Ch. 6 |
| 8 | Hierarchical Modeling | Two-level exchangeable normal | Multi-block Gibbs; Stein shrinkage | 2002 ELS math scores ($m=100$ schools) | Ch. 6 |
| 9 | Linear Regression | $\mathcal{N}_n(\mathbf{X}\boldsymbol{\beta}, \sigma^2 I)$ + $g$-prior & spike-and-slab | Exact MC; collapsed Gibbs BMA | Oxygen uptake ($n=12$); Diabetes ($p=64$) | Ch. 5–7 |
| 10 | Nonconjugate Priors & MH | GLMs (Poisson, Logistic); AR(1) GLS | Metropolis, MH, Metropolis-within-Gibbs | Sparrows ($n=52$); Ice-core $\text{CO}_2$ | Ch. 6, 9 |
| 11 | Mixed Effects Models | LME & Poisson GLMM | Modular Gibbs + MH-within-Gibbs | ELS SES slopes; Mouse intestine tumors | Ch. 7–10 |
| 12 | Ordinal & Copula Models | Ordered probit; rank likelihood; Gaussian copula | Data augmentation; parameter expansion | Social mobility; GSS mixed ordinal data | Ch. 7, 9–11 |
{#tab:appB-map caption="Complete chapter-by-chapter dependency map of Hoff (2009)." short="Master concept map"}

### Recommended Study Tracks {#sec:appB-tracks}

- **Track 1 — Conceptual Core (Fastest Complete Arc)**: Chapters 1 → 2 → 3 → 4 → 5 → 6 → 7 → 8 → 9. Covers every foundational Bayesian principle, conjugate & Gibbs updating, multivariate covariance, hierarchical shrinkage, and regression/model averaging.
- **Track 2 — Computational MCMC Deep Dive**: Chapters 4 → 5 → 6 → 7 → 9 → 10 → 12. Focuses on i.i.d. MC, Gibbs, data augmentation, Metropolis–Hastings detailed balance, and parameter expansion.
- **Track 3 — Applied Multilevel & Non-Normal Data** (assuming Chapters 1–6): Chapters 7 → 8 → 9 → 10 → 11 → 12. Moves directly from multivariate covariance modeling into hierarchical shrinkage, GLMs, mixed effects, and mixed ordinal copulas.
