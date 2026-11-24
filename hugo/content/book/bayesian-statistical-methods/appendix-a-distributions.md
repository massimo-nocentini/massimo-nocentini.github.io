---
title: "Probability Distributions and Conjugate Atlas"
linkTitle: "Distributions & Conjugacy"
matter: appendix
weight: 410
label: "app:dists"
---

{{< newthought "Translating Bayesian derivations into bug-free code" />}} hinges on matching mathematical parameterizations to software libraries. This appendix collects every probability distribution used in Hoff{{< cite "hoff2009" >}}, aligns its exact notation across Hoff, `numpy`, and `scipy.stats`, and summarizes all conjugate and semiconjugate updating rules from Chapters 3 through 9.

## Common Distributions and Parameterization Map {#sec:appA-dists}

### Discrete Distributions {#sec:appA-discrete}

| Distribution | Support | Mass Function $p(y)$ | Mean & Variance | Python (`scipy.stats` / `numpy`) |
|:-------------|:--------|:---------------------|:----------------|:---------------------------------|
| $\operatorname{binary}(\theta)$ | $\{0, 1\}$ | $\theta^y (1 - \theta)^{1 - y}$ | $\theta$, $\;\theta(1-\theta)$ | `bernoulli(p=theta)` / `rng.binomial(1, theta)` |
| $\operatorname{binomial}(n, \theta)$ | $\{0, \dots, n\}$ | $\binom{n}{y}\theta^y(1-\theta)^{n-y}$ | $n\theta$, $\;n\theta(1-\theta)$ | `binom(n, p=theta)` / `rng.binomial(n, theta)` |
| $\operatorname{Poisson}(\theta)$ | $\{0, 1, 2, \dots\}$ | $\theta^y e^{-\theta} / y!$ | $\theta$, $\;\theta$ | `poisson(mu=theta)` / `rng.poisson(theta)` |
| $\operatorname{neg-bin}(a, b)$ (Hoff) | $\{0, 1, 2, \dots\}$ | $\frac{\Gamma(a+y)}{\Gamma(y+1)\Gamma(a)}\bigl(\frac{b}{b+1}\bigr)^a\bigl(\frac{1}{b+1}\bigr)^y$ | $\frac{a}{b}$, $\;\frac{a}{b}\frac{b+1}{b}$ | `nbinom(n=a, p=b/(b+1))` |
{#tab:appA-discrete caption="Discrete distributions in Hoff (2009) and their exact Python parameterizations." short="Discrete distributions"}

### Continuous Scalar Distributions {#sec:appA-continuous}

| Distribution | Support | Density $p(x)$ | Mean & Variance | Python (`scipy.stats` / `numpy`) |
|:-------------|:--------|:---------------|:----------------|:---------------------------------|
| $\operatorname{beta}(a, b)$ | $(0, 1)$ | $\frac{\Gamma(a+b)}{\Gamma(a)\Gamma(b)} x^{a-1}(1-x)^{b-1}$ | $\frac{a}{a+b}$, $\;\frac{ab}{(a+b)^2(a+b+1)}$ | `beta(a, b)` / `rng.beta(a, b)` |
| $\operatorname{gamma}(a, b)$ (rate $b$) | $(0, \infty)$ | $\frac{b^a}{\Gamma(a)} x^{a-1} e^{-bx}$ | $\frac{a}{b}$, $\;\frac{a}{b^2}$ | `gamma(a=a, scale=1/b)` / `rng.gamma(a, 1/b)` |
| $\operatorname{inv-gamma}(a, b)$ | $(0, \infty)$ | $\frac{b^a}{\Gamma(a)} x^{-(a+1)} e^{-b/x}$ | $\frac{b}{a-1}$ ($a>1$), $\;\frac{b^2}{(a-1)^2(a-2)}$ ($a>2$) | `invgamma(a=a, scale=b)` or `1 / rng.gamma(a, 1/b)` |
| $\operatorname{normal}(\theta, \sigma^2)$ | $\mathbb{R}$ | $(2\pi\sigma^2)^{-1/2}\exp\bigl(-\frac{(x-\theta)^2}{2\sigma^2}\bigr)$ | $\theta$, $\;\sigma^2$ | `norm(loc=theta, scale=sigma)` / `rng.normal(theta, sigma)` |
| $t_\nu(\mu, \sigma^2)$ | $\mathbb{R}$ | $\propto \bigl[1 + \frac{(x-\mu)^2}{\nu\sigma^2}\bigr]^{-(\nu+1)/2}$ | $\mu$ ($\nu>1$), $\;\frac{\nu}{\nu-2}\sigma^2$ ($\nu>2$) | `t(df=nu, loc=mu, scale=sigma)` |
{#tab:appA-continuous caption="Continuous univariate distributions in Hoff (2009) and their exact Python parameterizations." short="Continuous scalar distributions"}

### Multivariate and Matrix-Variate Distributions {#sec:appA-matrix}

| Distribution | Support | Density Kernel | Mean | Python (`scipy.stats` / `numpy`) |
|:-------------|:--------|:---------------|:-----|:---------------------------------|
| $\mathcal{N}_p(\boldsymbol{\theta}, \Sigma)$ | $\mathbb{R}^p$ | $\lvert \Sigma \rvert^{-1/2}\exp\bigl(-\frac{1}{2}(\mathbf{y}-\boldsymbol{\theta})^T \Sigma^{-1}(\mathbf{y}-\boldsymbol{\theta})\bigr)$ | $\boldsymbol{\theta}$ | `multivariate_normal(mean=theta, cov=Sigma)` / `rng.multivariate_normal(theta, Sigma)` |
| $\operatorname{Wishart}(\nu, \Psi)$ | $\mathcal{S}_{++}^p$ | $\lvert W \rvert^{(\nu-p-1)/2}\exp\bigl(-\frac{1}{2}\operatorname{tr}(\Psi^{-1}W)\bigr)$ | $\nu \Psi$ | `wishart(df=nu, scale=Psi)` |
| $\operatorname{inv-Wishart}(\nu, S_0^{-1})$ | $\mathcal{S}_{++}^p$ | $\lvert \Sigma \rvert^{-(\nu+p+1)/2}\exp\bigl(-\frac{1}{2}\operatorname{tr}(S_0 \Sigma^{-1})\bigr)$ | $\frac{1}{\nu - p - 1}S_0$ ($\nu > p+1$) | `invwishart(df=nu, scale=S0)` |
{#tab:appA-matrix caption="Multivariate and matrix-variate distributions in Hoff (2009). Note that multivariate_normal takes the covariance matrix Sigma (unlike scalar norm, which takes standard deviation), and invwishart takes S0 directly rather than S0 inverse." short="Multivariate and matrix distributions"}

> [!WARNING]
> **The Four Golden Coding Checks.**
> 1. Scalar `norm` / `rng.normal` expects **standard deviation** $\sigma$; `multivariate_normal` expects **covariance** $\Sigma$ (squared scale!).
> 2. `gamma` and `rng.gamma` expect **scale** $= 1/\text{rate}$ ($1/b$), whereas Hoff’s $\operatorname{gamma}(a, b)$ uses **rate** $b$.
> 3. `invgamma(a=a, scale=b)` expects $b$ directly (matching `1 / rng.gamma(shape=a, scale=1/b)`).
> 4. `invwishart(df=nu, scale=S0)` expects $S_0$ directly (not $S_0^{-1}$), matching Hoff’s $\operatorname{inverse-Wishart}(\nu, S_0^{-1})$.

## Conjugate and Semiconjugate Updating Atlas {#sec:appA-conjugate}

| Chapter & Model | Prior | Posterior / Full Conditional |
|:----------------|:------|:-----------------------------|
| Ch. 3: $Y \mid \theta \sim \operatorname{bin}(n, \theta)$ | $\theta \sim \operatorname{beta}(a, b)$ | $\theta \mid y \sim \operatorname{beta}(a + y,\, b + n - y)$ |
| Ch. 3: $Y_i \mid \theta \sim \operatorname{Poisson}(\theta)$ | $\theta \sim \operatorname{gamma}(a, b)$ | $\theta \mid y \sim \operatorname{gamma}(a + \sum y_i,\, b + n)$ |
| Ch. 5: $Y_i \mid \theta, \sigma^2 \sim \mathcal{N}(\theta, \sigma^2)$ (joint conjugate) | $\theta \mid \sigma^2 \sim \mathcal{N}(\mu_0, \sigma^2/\kappa_0)$, $\;\sigma^{-2} \sim \operatorname{gamma}(\frac{\nu_0}{2}, \frac{\nu_0\sigma_0^2}{2})$ | $\theta \mid \sigma^2, y \sim \mathcal{N}(\mu_n, \sigma^2/\kappa_n)$, $\;\sigma^{-2} \mid y \sim \operatorname{gamma}(\frac{\nu_n}{2}, \frac{\nu_n\sigma_n^2}{2})$ |
| Ch. 6: $Y_i \mid \theta, \sigma^2 \sim \mathcal{N}(\theta, \sigma^2)$ (semiconjugate) | $\theta \sim \mathcal{N}(\mu_0, \tau_0^2)$, $\;\sigma^{-2} \sim \operatorname{gamma}(\frac{\nu_0}{2}, \frac{\nu_0\sigma_0^2}{2})$ | $\theta \mid \sigma^2, y \sim \mathcal{N}\bigl(\tau_n^2(\frac{\mu_0}{\tau_0^2} + \frac{n\bar{y}}{\sigma^2}), \tau_n^2\bigr)$; $\;\sigma^{-2} \mid \theta, y \sim \operatorname{gamma}\bigl(\frac{\nu_0+n}{2}, \frac{\nu_0\sigma_0^2 + \sum(y_i-\theta)^2}{2}\bigr)$ |
| Ch. 7: $\mathbf{Y}_i \mid \boldsymbol{\theta}, \Sigma \sim \mathcal{N}_p(\boldsymbol{\theta}, \Sigma)$ | $\boldsymbol{\theta} \sim \mathcal{N}_p(\boldsymbol{\mu}_0, \Lambda_0)$, $\;\Sigma \sim \operatorname{IW}(\nu_0, S_0^{-1})$ | $\boldsymbol{\theta} \mid \Sigma, \mathbf{Y} \sim \mathcal{N}_p(\boldsymbol{\mu}_n, \Lambda_n)$; $\;\Sigma \mid \boldsymbol{\theta}, \mathbf{Y} \sim \operatorname{IW}\bigl(\nu_0+n, (S_0 + \mathbf{S}_{\boldsymbol{\theta}})^{-1}\bigr)$ |
| Ch. 9: $\mathbf{y} \mid \boldsymbol{\beta}, \sigma^2 \sim \mathcal{N}_n(\mathbf{X}\boldsymbol{\beta}, \sigma^2 I_n)$ ($g$-prior) | $\boldsymbol{\beta} \mid \sigma^2 \sim \mathcal{N}_p(\mathbf{0}, g\sigma^2(\mathbf{X}^T\mathbf{X})^{-1})$, $\;\sigma^{-2} \sim \operatorname{gamma}(\frac{\nu_0}{2}, \frac{\nu_0\sigma_0^2}{2})$ | $\boldsymbol{\beta} \mid \sigma^2, \mathbf{y} \sim \mathcal{N}_p\bigl(\frac{g}{g+1}\hat{\boldsymbol{\beta}}_{\text{ols}},\, \frac{g}{g+1}\sigma^2(\mathbf{X}^T\mathbf{X})^{-1}\bigr)$; $\;\sigma^{-2} \mid \mathbf{y} \sim \operatorname{gamma}\bigl(\frac{\nu_0+n}{2}, \frac{\nu_0\sigma_0^2 + \operatorname{SSR}_g}{2}\bigr)$ |
{#tab:appA-conjugate caption="Master conjugate and semiconjugate updating table spanning Parts I through III." short="Conjugate updating atlas"}
