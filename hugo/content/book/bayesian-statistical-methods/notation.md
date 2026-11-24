---
title: "Notation and Conventions"
matter: front
unnumbered: true
weight: 20
label: "ch:notation"
---

{{< newthought "Consistent notation" />}} is half the battle when moving from scalar conjugate models in Part I to matrix-variate hierarchical and latent-variable models in Parts II and III. This reference collects Hoff’s conventions and highlights the exact translation to Python (`numpy` / `scipy.stats`) and R.

## Core Symbols {#sec:notation-symbols}

| Symbol | Meaning |
|:-------|:--------|
| $\mathcal{Y},\; \Theta$ | Sample space of possible datasets and parameter space of possible parameter values. |
| $Y,\; y$ | Uppercase denotes an unknown random variable (before observation); lowercase denotes its realized numerical value. |
| $\tilde{Y},\; \tilde{y}$ | A future (unobserved) observation drawn from the same population, governed by the predictive distribution $p(\tilde{y} \mid y)$. |
| $p(\cdot),\; p(\cdot \mid \cdot)$ | Generic density or mass function, distinguished by its arguments (e.g., $p(\theta)$ is the prior, $p(y \mid \theta)$ the sampling model, $p(\theta \mid y)$ the posterior). |
| $\propto$ | Proportional to, as a function of the variable of interest (multiplicative constants independent of that variable are absorbed). |
| $\mathbf{y},\; \mathbf{X}$ | Column vector $\mathbf{y} = (y_1, \dots, y_n)^T$ and $n \times p$ design matrix $\mathbf{X}$ with $i$-th row $\mathbf{x}_i^T$. |
| $\bar{y},\; s^2$ | Sample mean $\bar{y} = \frac{1}{n}\sum_{i=1}^n y_i$ and unbiased sample variance $s^2 = \frac{1}{n-1}\sum_{i=1}^n (y_i - \bar{y})^2$. |
| $\theta,\; \phi$ | Primary parameter of interest (often a mean or rate) and generic full parameter vector (e.g., $\phi = (\theta, \sigma^2)$) or natural parameter in an exponential family. |
| $\tilde{\sigma}^2 = 1/\sigma^2,\; \tilde{\tau}^2 = 1/\tau^2$ | Precision (inverse variance); in normal models, precisions add directly. (Context always distinguishes precision tildes from predictive $\tilde{Y}$, non-centered latent variables $\tilde{\theta}_j$, and dummy integration variables $\tilde{\theta}$.) |
| $\operatorname{tr}(A),\; \lvert A \rvert,\; \operatorname{etr}(A)$ | Matrix trace $\sum_j A_{j,j}$, determinant $\det(A)$, and exponential trace $\exp(\operatorname{tr}(A))$. |
| $\Phi(\cdot),\; \Phi^{-1}(\cdot)$ | Standard normal CDF and its inverse (quantile function). |
| $\phi^{(s)},\; S,\; S_{\text{eff}}$ | State at iteration $s$ of a Monte Carlo or MCMC sampler, total number of draws, and effective sample size. |
| $z_{-j},\; \Sigma_{b,a}$ | All elements of $z$ except index $j$; submatrix of $\Sigma$ with rows indexed by $b$ and columns by $a$. |
{#tab:notation-core caption="Core mathematical notation used throughout this companion, following Hoff (2009)." short="Core mathematical notation"}

## Parameterization Traps Across Hoff, R, and Python {#sec:notation-traps}

Three parameterization conventions cause the vast majority of bugs when implementing Hoff’s formulas in code. Keep them in mind whenever you translate an equation into `numpy` or `scipy.stats`:{{< sidenote >}}For complete density formulas, moments, and conjugate tables, see {{< xref "app:dists" "full" >}}.{{< /sidenote >}}

1. **Normal distribution — variance vs. standard deviation.** Hoff writes $\operatorname{normal}(\theta, \sigma^2)$ with the *variance* $\sigma^2$ as the second argument, whereas both R (`dnorm`, `rnorm`) and Python (`np.random.normal`, `scipy.stats.norm`) expect the *standard deviation* $\sigma = \sqrt{\sigma^2}$.
2. **Gamma and Inverse-Gamma — rate vs. scale.** Hoff writes $\operatorname{gamma}(a, b)$ with shape $a$ and *rate* $b$, so $E[X] = a/b$ and $p(x) \propto x^{a-1} e^{-bx}$. R’s `dgamma(x, a, b)` also uses rate $b$ by default, whereas `numpy.random.Generator.gamma(shape=a, scale=1/b)` and `scipy.stats.gamma(a=a, scale=1/b)` expect the *scale* $1/b$. For $\sigma^2 \sim \operatorname{inverse-gamma}(a, b)$, draw precision $\tilde{\sigma}^2 \sim \operatorname{gamma}(a, b)$ (using `scale=1/b`) and take $\sigma^2 = 1/\tilde{\sigma}^2$.
3. **Inverse-Wishart — Hoff’s $S_0^{-1}$ convention.** Hoff writes $\Sigma \sim \operatorname{inverse-Wishart}(\nu_0, S_0^{-1})$ to mean $\Sigma^{-1} \sim \operatorname{Wishart}(\nu_0, S_0^{-1})$, so $E[\Sigma^{-1}] = \nu_0 S_0^{-1}$ and $E[\Sigma] = \frac{1}{\nu_0 - p - 1} S_0$. In `scipy.stats.invwishart(df=nu0, scale=S0)`, the `scale` parameter is $S_0$ directly (not $S_0^{-1}$).
