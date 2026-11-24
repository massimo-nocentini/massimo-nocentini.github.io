---
title: "Verified Errata and Parameterization Notes for Hoff (2009)"
linkTitle: "Errata in Hoff (2009)"
matter: appendix
weight: 430
label: "app:errata"
---

{{< newthought "Every classic textbook" />}} accumulates a handful of minor typographical slips in its first printing. While verifying every derivation and numerical calculation against the 2009 Springer printing of Peter D. Hoff’s *A First Course in Bayesian Statistical Methods*{{< cite "hoff2009" >}}, we catalogued seven entries that commonly trip up readers implementing the formulas from scratch. All equations in this companion present the verified, corrected versions.

| Location | Printed in Hoff (2009) | Corrected Formula / Value | Verification Note |
|:---------|:-----------------------|:--------------------------|:------------------|
| Ch. 3, p. 43 | 95% HPD interval of $\operatorname{beta}(3, 9)$ printed as `[0.04, 0.048]` | `[0.041, 0.484]` (exact `[0.0406, 0.4837]`) | Decimal typo in upper bound (`0.048` instead of `0.48`); density level $h^* = 0.5846$, width $0.4432$. |
| Ch. 3, p. 52 | Poisson exponential family printed as $c(\phi) = \exp(e^{-\phi})$ and DY prior $\exp(n_0 e^{-\phi}) e^{n_0 t_0 y}$ | $c(\phi) = \exp(-e^\phi)$ and $p(\phi \mid n_0, t_0) \propto \exp(-n_0 e^\phi + n_0 t_0 \phi)$ | Since $\phi = \log\theta$, $e^{-\theta} = \exp(-e^\phi)$; with Jacobian $\lvert d\phi/d\theta \rvert = \theta^{-1}$, this yields $\operatorname{gamma}(n_0 t_0, n_0)$. |
| Ch. 8, p. 135 | Numerator of full conditional mean of $\theta_j$ printed as $n_j \bar{y}_j / \sigma^2 + 1 / \tau^2$ | $n_j \bar{y}_j / \sigma^2 + \mu / \tau^2$ | Missing factor $\mu$ in the printed formula; Hoff’s accompanying R code on p. 138 correctly writes `mu/tau2`. |
| Ch. 8, p. 144 | Rate parameter of full conditional of $\sigma_0^2$ printed as $b + \frac{1}{2}\sum_{j=1}^m 1/\sigma_j^2$ | $b + \frac{\nu_0}{2}\sum_{j=1}^m 1/\sigma_j^2$ | Missing factor $\nu_0$: since $p(\sigma_j^{-2} \mid \nu_0, \sigma_0^2) \propto (\sigma_0^2)^{\nu_0/2}\exp\bigl(-\frac{\nu_0 \sigma_0^2}{2}\sigma_j^{-2}\bigr)$, the exponent collects $\frac{\nu_0}{2}\sum \sigma_j^{-2}$. |
| Ch. 9, pp. 151, 157 & 165 | On p. 151, two regression lines indexed by $x_1 = 0, 1$; on p. 157, normalizer printed as $\lvert 2\pi g\sigma^2 (\mathbf{X}^T\mathbf{X})^{-1} \rvert^{-1}$; on p. 165, intermediate denominator exponent printed as $(\nu_0 + n)/2 - 1$ (and $\operatorname{SSR}_g^z$ missing transpose on last $\mathbf{X}_z$) | Group indicator is $x_2 \in \{0, 1\}$ ($x_1 \equiv 1$ is the intercept); determinant exponent is $-1/2$; denominator exponent is $(\nu_0 + n)/2$ | Standard MVN normalizing constant is $\lvert 2\pi\Sigma \rvert^{-1/2}$; Hoff’s final boxed marginal likelihood formula on p. 165 is already correct. |
| Ch. 10, p. 180 | Text writes `dpois(y_i, x_i^T beta*)` in the MH acceptance ratio | `dpois(y_i, exp(x_i^T beta*))` | Poisson log-link requires $\theta_i = \exp(\mathbf{x}_i^T \boldsymbol{\beta})$; Hoff’s R code on the same page correctly uses `exp(X %*% beta.p)`. |
| Ch. 12, p. 220 | R code defines the conditional regression-weight vector `Sz <- Sigma[j,-j] %*% solve(Sigma[-j,-j])` on line 1, then references `Sjc` on lines 2–3 | Replace `Sjc` with `Sz` consistently | Variable-renaming slip in the snippet computing the conditional mean and variance of $Z_{i,j}$ given $\mathbf{Z}_{i,-j}$. |
{#tab:appC-errata caption="Verified typographical slips in the 2009 Springer printing of Hoff (2009) and their exact corrections." short="Verified errata in Hoff (2009)"}

{{< remark note="Why verifying equations against code matters" label="rem:appC-verify" >}}
Notice that several of these slips—such as the missing $\mu$ on p. 135 or the missing `exp` on p. 180—were *already correct* in Hoff’s own R code, while others (such as the missing $\nu_0$ on p. 144) can silently bias a sampler if transcribed blindly from the printed equation! A reliable habit when studying any Bayesian algorithm is **simulation-based calibration**: simulate synthetic data from known ground-truth parameters $(\mu, \tau^2, \nu_0, \sigma_0^2, \boldsymbol{\beta})$, run your sampler, and verify that posterior credible intervals recover the true values cleanly.
{{< /remark >}}
