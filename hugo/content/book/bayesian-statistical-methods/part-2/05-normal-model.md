---
title: "The Normal Model"
linkTitle: "The Normal Model"
weight: 10
label: "ch:normal"
---

{{< newthought "The normal distribution" />}} is the workhorse of continuous-data modeling—not because real-world populations are literally Gaussian, but because the Central Limit Theorem pushes averages toward normality and because a normal model depends only on first and second moments.{{< cite "hoff2009" >}} Chapter 5 marks a decisive step up in complexity: for the first time we have **two unknown parameters**, the population mean $\theta \in \mathbb{R}$ and variance $\sigma^2 > 0$, forcing us to confront joint priors, marginalization, and the exact trade-off between bias and variance.

## Properties and Joint Sufficient Statistics {#sec:ch05-suff}

A random variable $Y \sim \operatorname{normal}(\theta, \sigma^2)$ has density

$$
p(y \mid \theta, \sigma^2) = \frac{1}{\sqrt{2\pi\sigma^2}}\exp\left\{-\frac{(y - \theta)^2}{2\sigma^2}\right\},
\qquad y \in \mathbb{R}. \label{eq:ch05-normal-pdf}
$$

For an i.i.d. sample $Y_1, \dots, Y_n \mid \theta, \sigma^2 \stackrel{\text{i.i.d.}}{\sim} \operatorname{normal}(\theta, \sigma^2)$, expanding the sum of squared deviations around the sample mean $\bar{y} = \frac{1}{n}\sum_{i=1}^n y_i$ yields the algebraic workhorse identity that powers Chapters 5 through 9:

$$
\sum_{i=1}^n (y_i - \theta)^2
= \sum_{i=1}^n (y_i - \bar{y} + \bar{y} - \theta)^2
= (n - 1)s^2 + n(\bar{y} - \theta)^2, \label{eq:ch05-ss-decomp}
$$

where $s^2 = \frac{1}{n-1}\sum_{i=1}^n (y_i - \bar{y})^2$ is the unbiased sample variance (the cross term $2(\bar{y} - \theta)\sum_{i=1}^n (y_i - \bar{y})$ vanishes identically). Substituting {{< eqref "eq:ch05-ss-decomp" >}} into the joint likelihood gives

$$
p(y_1, \dots, y_n \mid \theta, \sigma^2)
= (2\pi\sigma^2)^{-n/2} \exp\left\{-\frac{1}{2\sigma^2}\bigl[(n - 1)s^2 + n(\bar{y} - \theta)^2\bigr]\right\}. \label{eq:ch05-lik}
$$

By the Fisher–Neyman factorization theorem, $(\bar{y}, s^2)$ is a **jointly sufficient statistic**{{< index "sufficient statistic" >}} for $(\theta, \sigma^2)$: the entire dataset of size $n$ compresses without loss into two numbers.

## Conditional Inference for the Mean ($\sigma^2$ Known) {#sec:ch05-known-var}

Temporarily suppose $\sigma^2$ is known. Because the likelihood {{< eqref "eq:ch05-lik" >}} is exponential-quadratic in $\theta$, a normal prior $\theta \sim \operatorname{normal}(\mu_0, \tau_0^2)$ is conjugate. Writing precisions as $\tilde{\sigma}^2 = 1/\sigma^2$ and $\tilde{\tau}_0^2 = 1/\tau_0^2$, the log-posterior collects into a quadratic in $\theta$:

$$
\log p(\theta \mid y_{1:n}, \sigma^2)
= -\frac{1}{2}\Bigl[\tilde{\tau}_0^2(\theta - \mu_0)^2 + n\tilde{\sigma}^2(\theta - \bar{y})^2\Bigr] + \text{const}
= -\frac{1}{2}\tilde{\tau}_n^2(\theta - \mu_n)^2 + \text{const}. \label{eq:ch05-cond-quad}
$$

Matching the coefficients of $\theta^2$ and $\theta$ (completing the square; see {{< xref "app:toolkit" "full" >}}) yields the **additive precision rule**{{< index "precision" >}}:

{{< proposition note="Normal–Normal Conditional Update" label="prop:ch05-normal-mean" >}}
If $\theta \sim \operatorname{normal}(\mu_0, \tau_0^2)$ and $Y_1, \dots, Y_n \mid \theta, \sigma^2 \stackrel{\text{i.i.d.}}{\sim} \operatorname{normal}(\theta, \sigma^2)$ with $\sigma^2$ known, then $\theta \mid y_{1:n}, \sigma^2 \sim \operatorname{normal}(\mu_n, \tau_n^2)$, where

$$
\tilde{\tau}_n^2 = \frac{1}{\tau_n^2} = \frac{1}{\tau_0^2} + \frac{n}{\sigma^2}, \qquad
\mu_n = \frac{\frac{1}{\tau_0^2}\mu_0 + \frac{n}{\sigma^2}\bar{y}}{\frac{1}{\tau_0^2} + \frac{n}{\sigma^2}}. \label{eq:ch05-mean-update}
$$

Moreover, a future observation $\tilde{Y}$ has posterior predictive distribution $\tilde{Y} \mid y_{1:n}, \sigma^2 \sim \operatorname{normal}(\mu_n,\, \sigma^2 + \tau_n^2)$.
{{< /proposition >}}

Look closely at {{< eqref "eq:ch05-mean-update" >}}:
- **Precisions add**: posterior precision equals prior precision ($1/\tau_0^2$) plus data precision ($n/\sigma^2$).
- **Means average by precision**: $\mu_n$ is a convex combination of $\mu_0$ and $\bar{y}$, weighted by their respective precisions. Setting $\kappa_0 = \sigma^2 / \tau_0^2$ expresses the prior precision as $\kappa_0$ equivalent observations, giving

  $$
  \mu_n = \frac{\kappa_0}{\kappa_0 + n}\mu_0 + \frac{n}{\kappa_0 + n}\bar{y}.
  $$
- **Predictive variances add**: writing $\tilde{Y} = \theta + \tilde{\epsilon}$ with $\tilde{\epsilon} \sim \operatorname{normal}(0, \sigma^2)$ independent of $\theta \mid y_{1:n}$, we immediately get $\operatorname{Var}(\tilde{Y} \mid y_{1:n}, \sigma^2) = \tau_n^2 + \sigma^2$—again separating parameter uncertainty from irreducible sampling variability.

## Joint Inference for Mean and Variance: The Conjugate Normal–Inverse-Gamma Model {#sec:ch05-joint}

When both $\theta$ and $\sigma^2$ are unknown, any joint prior factors via the chain rule as $p(\theta, \sigma^2) = p(\theta \mid \sigma^2)\,p(\sigma^2)$. To keep the joint posterior in closed form, we tie the prior variance of $\theta$ proportionally to $\sigma^2$ through a prior sample size $\kappa_0 > 0$:

$$
\theta \mid \sigma^2 \sim \operatorname{normal}\!\left(\mu_0,\, \frac{\sigma^2}{\kappa_0}\right), \qquad
\frac{1}{\sigma^2} \sim \operatorname{gamma}\!\left(\frac{\nu_0}{2},\, \frac{\nu_0 \sigma_0^2}{2}\right), \label{eq:ch05-conj-prior}
$$

equivalently $\sigma^2 \sim \operatorname{inverse-gamma}(\nu_0/2,\, \nu_0\sigma_0^2/2)$, where $\sigma_0^2$ is a prior guess for $\sigma^2$ and $\nu_0 > 0$ is its prior degrees of freedom (effective sample size).

{{< theorem note="Joint Conjugate Normal–Inverse-Gamma Posterior and Student-t Marginal" label="thm:ch05-nig" >}}
Under the conjugate prior {{< eqref "eq:ch05-conj-prior" >}} and i.i.d. normal sampling model {{< eqref "eq:ch05-lik" >}}, define $\kappa_n = \kappa_0 + n$, $\nu_n = \nu_0 + n$, and

$$
\mu_n = \frac{\kappa_0 \mu_0 + n \bar{y}}{\kappa_n}, \qquad
\nu_n \sigma_n^2 = \nu_0 \sigma_0^2 + (n - 1)s^2 + \frac{\kappa_0 n}{\kappa_0 + n}(\bar{y} - \mu_0)^2. \label{eq:ch05-nig-params}
$$

Then the joint posterior $p(\theta, \sigma^2 \mid y_{1:n}) = p(\theta \mid \sigma^2, y_{1:n})\,p(\sigma^2 \mid y_{1:n})$ is again Normal–Inverse-Gamma:

$$
\theta \mid \sigma^2, y_{1:n} \sim \operatorname{normal}\!\left(\mu_n,\, \frac{\sigma^2}{\kappa_n}\right), \qquad
\frac{1}{\sigma^2} \mid y_{1:n} \sim \operatorname{gamma}\!\left(\frac{\nu_n}{2},\, \frac{\nu_n \sigma_n^2}{2}\right). \label{eq:ch05-nig-post}
$$

Integrating out $\sigma^2$ yields an exact location–scale **Student-$t$ marginal posterior**{{< index "Student-t distribution" >}} for $\theta$:

$$
\frac{\theta - \mu_n}{\sigma_n / \sqrt{\kappa_n}} \;\Bigm|\; y_{1:n} \;\sim\; t_{\nu_n}, \label{eq:ch05-student-t}
$$

and the posterior predictive distribution for a future observation $\tilde{Y}$ is $(\tilde{Y} - \mu_n) / \bigl(\sigma_n\sqrt{1 + 1/\kappa_n}\bigr) \mid y_{1:n} \sim t_{\nu_n}$.
{{< /theorem >}}

{{< proof >}}
First, substitute $\tau_0^2 = \sigma^2/\kappa_0$ into {{< xref "prop:ch05-normal-mean" "full" >}} to obtain $\theta \mid \sigma^2, y_{1:n} \sim \operatorname{normal}(\mu_n, \sigma^2/\kappa_n)$ immediately. Next, to find $p(\sigma^2 \mid y_{1:n})$, combine the prior quadratic $\kappa_0(\theta - \mu_0)^2$ and data quadratic $n(\theta - \bar{y})^2$ using the algebraic identity

$$
\kappa_0(\theta - \mu_0)^2 + n(\theta - \bar{y})^2
= \kappa_n(\theta - \mu_n)^2 + \frac{\kappa_0 n}{\kappa_0 + n}(\bar{y} - \mu_0)^2.
$$

Now multiply $p(\theta, \sigma^2)$ by $p(y_{1:n} \mid \theta, \sigma^2)$ and integrate over $\theta \in \mathbb{R}$. The $\theta$-integral

$$
\int \exp\bigl\{-\frac{\kappa_n}{2\sigma^2}(\theta - \mu_n)^2\bigr\}\,d\theta = \sqrt{2\pi\sigma^2/\kappa_n}
$$

cancels the $(\sigma^2)^{-1/2}$ factor from $p(\theta \mid \sigma^2)$, leaving

$$
p(\sigma^2 \mid y_{1:n}) \propto (\sigma^2)^{-\frac{\nu_0 + n}{2} - 1}
\exp\left\{-\frac{\nu_0 \sigma_0^2 + (n - 1)s^2 + \frac{\kappa_0 n}{\kappa_0 + n}(\bar{y} - \mu_0)^2}{2\sigma^2}\right\},
$$

which is the exact kernel of $\operatorname{inverse-gamma}(\nu_n/2,\, \nu_n\sigma_n^2/2)$. Finally, to obtain $p(\theta \mid y_{1:n})$, integrate the joint posterior over precision $\tilde{\sigma}^2 = 1/\sigma^2 \in (0, \infty)$:

$$
\begin{aligned}
p(\theta \mid y_{1:n})
&\propto \int_0^\infty (\tilde{\sigma}^2)^{1/2} e^{-\frac{\kappa_n(\theta - \mu_n)^2}{2}\tilde{\sigma}^2}
(\tilde{\sigma}^2)^{\frac{\nu_n}{2} - 1} e^{-\frac{\nu_n \sigma_n^2}{2}\tilde{\sigma}^2}\,d\tilde{\sigma}^2 \\
&= \int_0^\infty (\tilde{\sigma}^2)^{\frac{\nu_n + 1}{2} - 1}
\exp\left\{-\frac{\nu_n \sigma_n^2 + \kappa_n(\theta - \mu_n)^2}{2}\,\tilde{\sigma}^2\right\} d\tilde{\sigma}^2
\propto \left[1 + \frac{1}{\nu_n}\left(\frac{\theta - \mu_n}{\sigma_n / \sqrt{\kappa_n}}\right)^2\right]^{-\frac{\nu_n + 1}{2}},
\end{aligned}
$$

which is precisely the density kernel of a Student-$t$ distribution with $\nu_n$ degrees of freedom, location $\mu_n$, and scale $\sigma_n/\sqrt{\kappa_n}$.
{{< /proof >}}

Look at the third term inside $\nu_n \sigma_n^2$ in {{< eqref "eq:ch05-nig-params" >}}: $\frac{\kappa_0 n}{\kappa_0 + n}(\bar{y} - \mu_0)^2$. When the observed mean $\bar{y}$ disagrees sharply with the prior mean $\mu_0$, the posterior variance $\sigma_n^2$ **automatically inflates** to reconcile the discrepancy! Notice also the subtle **improper reference limit**: letting $\kappa_0, \nu_0 \to 0^+$ corresponds to $p(\theta, \sigma^2) \propto (\sigma^2)^{-3/2}$ and gives a $t_n$ posterior with $\sigma_n^2 = (n - 1)s^2/n$. The standard reference prior $p(\theta, \sigma^2) \propto 1/\sigma^2$ corresponds formally to $\kappa_0 \to 0$, $\nu_0 = -1$, and $\nu_0\sigma_0^2 \to 0$, yielding $\nu_n = n - 1$ and $\sigma_n^2 = s^2$, so $(\theta - \bar{y})/(s/\sqrt{n}) \mid y_{1:n} \sim t_{n-1}$—matching the classical Student-$t$ interval while endowing it with a genuine posterior probability interpretation!

### Example: Midge Wing Length {#sec:ch05-midge}

Grogan and Wirth measured wing lengths (in mm) of $n = 9$ midges: $(1.64, 1.70, 1.72, 1.74, 1.82, 1.82, 1.82, 1.90, 2.08)$, giving $\bar{y} = 1.804$ and $s^2 = 0.0169$. Using weak prior knowledge from related species ($\mu_0 = 1.9$, $\sigma_0^2 = 0.01$, $\kappa_0 = \nu_0 = 1$), {{< xref "thm:ch05-nig" "full" >}} gives $\kappa_n = 10$, $\nu_n = 10$, $\mu_n = 1.814$, and $\sigma_n^2 = 0.0153$, with 95% Student-$t$ credible interval $[1.727, 1.901]$ ({{< xref "fig:ch05-mse" "full" >}}, left panel).

{{< fig src="images/bayesian-hoff/fig-ch05-mse-tradeoff.svg" type="fullwidth" label="fig:ch05-mse" alt="Three panels: contour plot of the Normal-Inverse-Gamma joint posterior for midge wing length; relative MSE curves of the Bayes shrinkage estimator versus the sample mean for kappa_0 equals 1, 2, 3 as a function of n; and sampling densities at n equals 10 illustrating the bias-variance trade-off" short="Normal-IG joint posterior and the bias–variance MSE trade-off" >}}Left: conjugate Normal–Inverse-Gamma joint posterior contours for the $n = 9$ midge wing lengths. Center: relative frequentist MSE of the Bayes mean $\hat{\theta}_b$ vs. $\bar{y}$ when true IQ $\theta_0 = 112$, $\sigma^2 = 169$, and prior $\mu_0 = 100$—even with a 12-point prior bias, $\kappa_0 = 1$ beats $\bar{y}$ for every $n$. Right: sampling densities at $n = 10$ showing how mild shrinkage trades tiny bias for substantial variance reduction.{{< /fig >}}

## Bias, Variance, and When the Bayes Mean Beats $\bar{y}$ in MSE {#sec:ch05-mse}

A natural objection to Bayesian shrinkage is: *isn’t $\hat{\theta}_b = E[\theta \mid y_{1:n}] = w\bar{y} + (1 - w)\mu_0$ (with $w = \frac{n}{n + \kappa_0}$) biased whenever $\mu_0 \neq \theta_0$?* Yes—its bias is $(1 - w)(\mu_0 - \theta_0)$, whereas $\bar{y}$ is unbiased. Yet unbiasedness ignores variance! Measuring total accuracy by **Mean Squared Error**{{< index "mean squared error" >}} ($\operatorname{MSE} = \operatorname{Var} + \operatorname{Bias}^2$) reveals a striking frequentist justification for Bayesian shrinkage:

{{< theorem note="When the Bayes Mean Beats y-bar in MSE" label="thm:ch05-mse" >}}
Suppose $Y_1, \dots, Y_n \stackrel{\text{i.i.d.}}{\sim} \operatorname{normal}(\theta_0, \sigma^2)$ and

$$
\hat{\theta}_b = \frac{n}{n+\kappa_0}\bar{y} + \frac{\kappa_0}{n+\kappa_0}\mu_0
$$

with $\kappa_0 > 0$. Then

$$
\operatorname{MSE}(\hat{\theta}_b)
= \left(\frac{n}{n + \kappa_0}\right)^2 \frac{\sigma^2}{n} +
\left(\frac{\kappa_0}{n + \kappa_0}\right)^2 (\mu_0 - \theta_0)^2. \label{eq:ch05-mse}
$$

Consequently, $\operatorname{MSE}(\hat{\theta}_b) < \operatorname{MSE}(\bar{y}) = \sigma^2 / n$ if and only if

$$
(\mu_0 - \theta_0)^2 < \sigma^2\!\left(\frac{1}{n} + \frac{2}{\kappa_0}\right). \label{eq:ch05-mse-cond}
$$
{{< /theorem >}}

{{< proof >}}
Write $\operatorname{MSE}(\hat{\theta}_b) < \sigma^2/n$ using {{< eqref "eq:ch05-mse" >}} and multiply both sides by $(n + \kappa_0)^2$:

$$
n\sigma^2 + \kappa_0^2 (\mu_0 - \theta_0)^2 < \frac{(n + \kappa_0)^2}{n}\sigma^2
= \left(n + 2\kappa_0 + \frac{\kappa_0^2}{n}\right)\sigma^2.
$$

Subtracting $n\sigma^2$ and dividing by $\kappa_0^2 > 0$ gives $(\mu_0 - \theta_0)^2 < \sigma^2(2/\kappa_0 + 1/n)$.
{{< /proof >}}

Notice how generous {{< eqref "eq:ch05-mse-cond" >}} is! For Hoff’s town-IQ example ($\theta_0 = 112$, $\sigma = 13$, prior $\mu_0 = 100$, so $(\mu_0 - \theta_0)^2 = 144$), taking $\kappa_0 = 1$ gives $\sigma^2(1/n + 2) > 338 > 144$ for *all* $n$! Even though the prior guess is wrong by almost a full standard deviation, shrinking mildly toward it strictly lowers MSE at every sample size ({{< xref "fig:ch05-mse" "full" >}}, center and right). Conversely, setting $\kappa_0$ too large ($\kappa_0 = 3$) makes bias dominate once $n$ grows.

## Expectation-Based Priors, Robustness, and the Limit of Conjugacy {#sec:ch05-limits}

Two deeper lessons close Chapter 5 and motivate the rest of Part II:

1. **Why normal sampling is surprisingly robust**: The normal likelihood depends on the data only through $(\bar{y}, s^2)$, and by the Central Limit Theorem $\bar{y}$ is approximately normal even when individual observations $Y_i$ are skewed. Still, **Lukacs’ theorem**{{< cite "lukacs1942" >}}{{< index "Lukacs’ theorem" >}} proves that $\bar{Y}$ and $S^2$ are independent *if and only if* the population is strictly normal; separately, heavy-tailed non-normal populations can distort variance inference and predictions.
2. **The awkwardness of joint conjugacy**: The conjugate prior {{< eqref "eq:ch05-conj-prior" >}} forced $\operatorname{Var}(\theta \mid \sigma^2) = \sigma^2/\kappa_0$, coupling our uncertainty about the *mean* $\theta$ to the unknown sampling variance $\sigma^2$. In the midge example, we actually had an independent prior belief $\theta \sim \operatorname{normal}(1.9, 0.95^2)$ based on positivity—independent of $\sigma^2$! Separating the priors into $p(\theta, \sigma^2) = p(\theta)\,p(\sigma^2)$ breaks joint conjugacy, so $p(\theta, \sigma^2 \mid y)$ no longer has a closed form. Solving that exact problem is why we turn next to the **Gibbs sampler** in {{< xref "ch:gibbs" "full" >}}.

```python
import numpy as np
from scipy import stats

# Conjugate Normal-IG analysis of Hoff's midge wing length data (n=9)
y = np.array([1.64, 1.70, 1.72, 1.74, 1.82, 1.82, 1.82, 1.90, 2.08])
n, ybar, s2 = len(y), np.mean(y), np.var(y, ddof=1)
mu0, k0, s20, nu0 = 1.9, 1.0, 0.01, 1.0

kn, nun = k0 + n, nu0 + n
mun = (k0 * mu0 + n * ybar) / kn
s2n = (nu0 * s20 + (n - 1) * s2 + k0 * n * (ybar - mu0)**2 / kn) / nun

# Exact Student-t 95% credible interval for theta
ci_exact = stats.t.ppf([0.025, 0.975], df=nun, loc=mun, scale=np.sqrt(s2n / kn))
print(f"Exact mu_n = {mun:.4f}, s2_n = {s2n:.5f}, 95% CI = {np.round(ci_exact, 4)}")

# Exact ancestral Monte Carlo verification (draw 1/sigma^2, then theta | sigma^2)
rng = np.random.default_rng(42)
S = 20_000
s2_mc = 1.0 / rng.gamma(shape=nun / 2.0, scale=2.0 / (nun * s2n), size=S)
th_mc = rng.normal(mun, np.sqrt(s2_mc / kn))
print("MC 95% CI for theta:  ", np.round(np.quantile(th_mc, [0.025, 0.975]), 4))
print("MC 95% CI for sigma:  ", np.round(np.quantile(np.sqrt(s2_mc), [0.025, 0.975]), 4))
```

## Modern Developments: Learning the Prior and Surviving Outliers {#sec:ch05-modern}

### Tweedie’s Formula and Empirical Bayes Shrinkage {#sec:ch05-tweedie}

**Tweedie’s formula**{{< index "Tweedie’s formula" >}} computes a normal posterior mean from the *marginal* density of the data alone, with no explicit prior.{{< sidenote >}}**Beyond Hoff (2009).** This material is not in Hoff’s book; the identity itself is much older—Robbins reported it in 1956 and credited Maurice Tweedie—and Efron (2011) modernized it as an empirical Bayes correction for selection bias.{{< cite "efron2011" >}}{{< /sidenote >}} Take $\bar{y} \mid \theta \sim \operatorname{normal}(\theta, v)$ with $v = \sigma^2/n$ known and *any* prior $\pi(\theta)$, and let $m(\bar{y}) = \int p(\bar{y} \mid \theta)\,\pi(\theta)\,d\theta$. Then

$$
E[\theta \mid \bar{y}] = \bar{y} + v\,\frac{d}{d\bar{y}}\log m(\bar{y}), \qquad
\operatorname{Var}(\theta \mid \bar{y}) = v\left[1 + v\,\frac{d^2}{d\bar{y}^2}\log m(\bar{y})\right]. \label{eq:ch05-tweedie}
$$

Why? Since $\partial_{\bar{y}}\,p(\bar{y} \mid \theta) = \frac{\theta - \bar{y}}{v}\,p(\bar{y} \mid \theta)$, differentiating under the integral gives $m'/m = (E[\theta \mid \bar{y}] - \bar{y})/v$; a second derivative gives the variance. With $\pi = \operatorname{normal}(\mu_0, \tau_0^2)$, $m$ is $\operatorname{normal}(\mu_0, \tau_0^2 + v)$ and {{< eqref "eq:ch05-tweedie" >}} collapses to $\bar{y} - \frac{v}{\tau_0^2 + v}(\bar{y} - \mu_0)$, exactly $\mu_n$ in {{< eqref "eq:ch05-mean-update" >}}.

The gain appears with many parallel problems $(\theta_i, \bar{y}_i)$ sharing $v$: the observed $\bar{y}_i$ are themselves a sample from $m$, so a smooth estimate $\hat{m}$ replaces the prior. The most extreme $\bar{y}_i$ are then pulled back by $v\,(\log \hat{m})'$, correcting the winner’s curse: a Bayes posterior given $\bar{y}_i$ is unchanged by having *selected* case $i$ for its extremeness.

**When to use it.** With one mean and real prior knowledge, use {{< xref "prop:ch05-normal-mean" "full" >}}. With hundreds of parallel means and no trusted prior family, use Tweedie—but not in the far tails, where $\hat{m}$ has little data and its derivative is unstable.

### Whole Robustness with Log-Regularly Varying Tails {#sec:ch05-robust}

A sampling density with sufficiently heavy tails can make a conflicting outlier’s influence on the posterior of *both* $\theta$ and $\sigma$ vanish in the limit, a property called **whole robustness**{{< index "whole robustness" >}}.{{< sidenote >}}**Beyond Hoff (2009).** This material is not in Hoff’s book; Desgagné (2015) proves whole robustness for location–scale models, sharpening the older heavy-tail advice for outliers.{{< cite "desgagne2015" >}}{{< /sidenote >}} The normal model fails badly: moving one observation $y_i \to \infty$ drags $\mu_n$ along and inflates $\nu_n\sigma_n^2$ in {{< eqref "eq:ch05-nig-params" >}} without bound. Replace it by $p(y_i \mid \theta, \sigma) = \frac{1}{\sigma}f\bigl(\frac{y_i - \theta}{\sigma}\bigr)$ and examine the outlier’s likelihood factor, normalized by the constant $f(y_i)$, as $y_i \to \infty$:

$$
\frac{\frac{1}{\sigma}\,f\!\left(\frac{y_i - \theta}{\sigma}\right)}{f(y_i)} \;\longrightarrow\;
\begin{cases}
\sigma^{\nu}, & f = t_\nu \quad (\text{partial robustness}), \\
1, & z f(z) \text{ log-regularly varying} \quad (\text{whole robustness}).
\end{cases} \label{eq:ch05-whole-robust}
$$

For $t_\nu$, $f(z) \sim c\,\lvert z \rvert^{-\nu-1}$: $\theta$ is protected, but the surviving factor $\sigma^\nu$ still pushes the scale upward. If instead $z f(z) = h(\log z)$ with $h$ regularly varying—say $f(z) \propto 1/[z(\log z)^{b}]$, $b > 1$, spliced onto a normal core—then shifting and scaling alter $\log z$ only by lower-order terms, so the ratio tends to $1$ and the outlier drops out. Passing from factors to the whole posterior requires regularity of $f$ (symmetry, continuity, monotone tails), a prior that is controlled near $\sigma = 0$, and sufficiently many non-outliers relative to outliers; otherwise the “outliers” could form the dominant cluster. The theorem in the paper gives the exact count.

**When to use it.** Keep Hoff’s conjugate model for clean data and closed forms; use a log-regularly varying $f$, at the price of MCMC and of predictive distributions with no finite mean, when gross contamination must affect neither location nor scale.

### Computational & Symbolic Check {#sec:ch05-modern-check}

The script compares {{< eqref "eq:ch05-tweedie" >}}, computed from a numerically integrated marginal $m$, with the conjugate update, and then evaluates the outlier factor {{< eqref "eq:ch05-whole-robust" >}} for $t_4$ and for the log-regularly varying tail $f(z) \propto 1/[z(\log z)^2]$.{{< sidenote >}}**Beyond Hoff (2009).** This computational check and its Wolfram symbolic counterpart below verify the modern methods in this section and are not in Hoff’s book.{{< /sidenote >}}

```python
import numpy as np
from scipy import integrate, stats

# Tweedie from the integrated marginal m(y); log m is quadratic, so central differences are exact
mu0, t20, v, y, h = 1.0, 4.0, 1.0, 3.0, 0.1
def log_m(u):
    f = lambda th: stats.norm.pdf(u, th, np.sqrt(v)) * stats.norm.pdf(th, mu0, np.sqrt(t20))
    return np.log(integrate.quad(f, -20, 20, epsabs=0, epsrel=1e-12)[0])
lo, mid, hi = log_m(y - h), log_m(y), log_m(y + h)
print(f"Tweedie:   {y + v * (hi - lo) / (2 * h):.6f}, {v * (1 + v * (hi - 2 * mid + lo) / h**2):.6f}")
print(f"Conjugate: {(t20 * y + v * mu0) / (t20 + v):.6f}, {t20 * v / (t20 + v):.6f}")

# Outlier factor (1/s) f((z - th)/s) / f(z): limit s^nu = 16 for t_4, limit 1 for the LRV tail
th, s, nu, b = 1.0, 2.0, 4.0, 2.0
for z in (1e2, 1e8, 1e100):
    t_ratio = ((1 + ((z - th) / s)**2 / nu) / (1 + z**2 / nu))**(-(nu + 1) / 2) / s
    lrv_ratio = z / (z - th) * (np.log(z) / np.log((z - th) / s))**b
    print(f"z = {z:.0e}: Student-t {t_ratio:.4f}, log-regularly varying {lrv_ratio:.4f}")
```

{{< marginnote >}}Write the log of the Normal–Normal marginal $m = \mathcal{N}(\mu_0, \tau_0^2 + v)$ as a function of $\bar{y}$.{{< /marginnote >}}

```js
// Chapter 5 (modern): Tweedie on the Normal-Normal marginal & outlier-factor limits
const logM = await show`-(yb - mu0)^2/(2*(t2 + v)) - Log[2*Pi*(t2 + v)]/2`
```

$$
\log m(\bar{y}) = -\frac{(\bar{y}-\mu_0)^2}{2 (\tau_0^2+v)}-\frac{1}{2} \log \bigl(2 \pi (\tau_0^2+v)\bigr)
$$

{{< marginnote >}}Apply Tweedie’s mean formula $\bar{y} + v\,(\log m)'(\bar{y})$ to that marginal.{{< /marginnote >}}

```js
const twMean = await show`Factor[yb + v*D[${logM}, yb]]`
```

$$
E[\theta \mid \bar{y}] = \bar{y} + v\,(\log m)'(\bar{y}) = \frac{\mu_0 v+\tau_0^2 \bar{y}}{\tau_0^2+v}
$$

{{< marginnote >}}Apply Tweedie’s variance formula to the same marginal.{{< /marginnote >}}

```js
const twVar = await show`Factor[v*(1 + v*D[${logM}, {yb, 2}])]`
```

$$
\operatorname{Var}(\theta \mid \bar{y}) = v\bigl[1 + v\,(\log m)''(\bar{y})\bigr] = \frac{\tau_0^2 v}{\tau_0^2+v}
$$

{{< marginnote >}}Subtract the precision-weighted conjugate mean and variance: both differences vanish identically.{{< /marginnote >}}

```js
await show`Simplify[{${twMean} - (mu0/t2 + yb/v)/(1/t2 + 1/v), ${twVar} - 1/(1/t2 + 1/v)}]`
```

$$
\bigl(E_{\text{Tweedie}} - E_{\text{conj}},\; \operatorname{Var}_{\text{Tweedie}} - \operatorname{Var}_{\text{conj}}\bigr) = \{0,0\}
$$

{{< marginnote >}}Instantiate at the Python values $(\mu_0, \tau_0^2, v, \bar{y}) = (1, 4, 1, 3)$.{{< /marginnote >}}

```js
await show`{${twMean}, ${twVar}} /. {mu0 -> 1, t2 -> 4, v -> 1, yb -> 3}`
```

$$
\bigl(E[\theta \mid \bar{y}],\; \operatorname{Var}(\theta \mid \bar{y})\bigr) = \left\{\frac{13}{5},\frac{4}{5}\right\}
$$

{{< marginnote >}}Student-$t$ outlier factor: the ratio of the location–scale $t_\nu$ density at an outlier $z$ to the standard $t_\nu$ density there.{{< /marginnote >}}

```js
const tFac = await show`(1/s)*((1 + ((z - th)/s)^2/nu)/(1 + z^2/nu))^(-(nu + 1)/2)`
```

$$
\frac{\frac{1}{\sigma}\,t_\nu\!\left(\frac{z - \theta}{\sigma}\right)}{t_\nu(z)} = \frac{1}{\sigma}\left(\frac{1+\frac{(z-\theta)^2}{\nu \sigma^2}}{1+\frac{z^2}{\nu}}\right)^{-\frac{1+\nu}{2}}
$$

{{< marginnote >}}Its limit as $z \to \infty$ is $\sigma^\nu$, which still involves the scale (partial robustness).{{< /marginnote >}}

```js
await show`Assuming[nu > 0 && s > 0 && Element[th, Reals], FullSimplify[Limit[${tFac}, z -> Infinity]]]`
```

$$
\lim_{z \to \infty} \frac{\frac{1}{\sigma}\,t_\nu\!\left(\frac{z - \theta}{\sigma}\right)}{t_\nu(z)} = \sigma^\nu
$$

{{< marginnote >}}Log-regularly varying outlier factor for $f(z) \propto 1/[z(\log z)^2]$, i.e. $b = 2$.{{< /marginnote >}}

```js
const lrvFac = await show`z/(z - th)*(Log[z]/Log[(z - th)/s])^2`
```

$$
\frac{\frac{1}{\sigma}\,f\!\left(\frac{z - \theta}{\sigma}\right)}{f(z)}\bigg|_{f(z) \propto 1/[z(\log z)^2]} = \frac{z}{z-\theta}\left(\frac{\log z}{\log \frac{z-\theta}{\sigma}}\right)^2
$$

{{< marginnote >}}Its limit as $z \to \infty$ is free of $\theta$ and $\sigma$ (whole robustness).{{< /marginnote >}}

```js
await show`Assuming[s > 0 && Element[th, Reals], Limit[${lrvFac}, z -> Infinity]]`
```

$$
\lim_{z \to \infty} \frac{\frac{1}{\sigma}\,f\!\left(\frac{z - \theta}{\sigma}\right)}{f(z)}\bigg|_{f(z) \propto 1/[z(\log z)^2]} = 1
$$

{{< marginnote >}}Tabulate both factors at $z \in \{10^2, 10^8, 10^{100}\}$ for $(\theta, \sigma, \nu) = (1, 2, 4)$: convergence to $1$ is only logarithmic.{{< /marginnote >}}

```js
await show`N[Table[{${tFac}, ${lrvFac}} /. {th -> 1, s -> 2, nu -> 4, z -> zz}, {zz, {10^2, 10^8, 10^100}}]]`
```

$$
\begin{aligned}
&\bigl(t_4 \text{ factor},\; \text{LRV factor}\bigr)_{z \in \{10^2,\, 10^8,\, 10^{100}\}} \\
&= \left( \begin{array}{cc} 16.7729 & 1.40698 \\ 16. & 1.07973 \\ 16. & 1.00605 \\ \end{array} \right)
\end{aligned}
$$

## Symbolic Check in Wolfram Language {#sec:ch05-wolfram}

Integrates precision $p = 1/\sigma^2$ out of the Normal–Inverse-Gamma joint posterior in `wolfram-ws-bridge` JavaScript mode, verifies that the ratio to the Student-$t$ kernel has zero derivative in $\theta$, derives the exact symbolic Student-$t$ posterior variance $\operatorname{Var}[\theta \mid y]$, factors $(n + \kappa_0)^2(\operatorname{MSE}(\hat{\theta}_b) - \operatorname{MSE}(\bar{y}))$, and instantiates all symbolic formulas on Hoff’s midge wing lengths.

{{< marginnote >}}Integrate precision $p = 1/\sigma^2$ out of the Normal–Gamma joint posterior to obtain the marginal kernel in $\theta$.{{< /marginnote >}}

```js
// Chapter 5: Symbolic Normal-IG -> Student-t marginal, variance & exact MSE inequality
const marg = await show`Assuming[nun > 0 && rate > 0,
  FullSimplify[Integrate[p^((nun + 1)/2 - 1)*Exp[-rate*p/2], {p, 0, Infinity}]]] /. rate -> nun*s2n + kn*(th - mun)^2`
```

$$
\begin{aligned}
&\int_0^\infty p^{\frac{\nu_n+1}{2}-1} e^{-p(\nu_n\sigma_n^2 + \kappa_n(\theta-\mu_n)^2)/2}\,dp \\
&= 2^{\frac{1+\nu_n}{2}} \left(\frac{1}{\nu_n \sigma_n^2 +\kappa_n (-\mu_n +\theta)^2}\right)^{\frac{1+\nu_n}{2}} \Gamma \left(\frac{1+\nu_n}{2}\right)
\end{aligned}
$$

{{< marginnote >}}Write the unnormalized $t_{\nu_n}(\mu_n, \sigma_n^2/\kappa_n)$ kernel in $\theta$.{{< /marginnote >}}

```js
const tKer = await show`(1 + kn*(th - mun)^2 / (nun*s2n))^(-(nun + 1)/2)`
```

$$
t_{\nu_n}(\theta \mid \mu_n, \sigma_n^2/\kappa_n) \propto \left(1+\frac{\kappa_n (\theta -\mu_n)^2}{\nu_n \sigma_n^2}\right)^{-\frac{1+\nu_n}{2}}
$$

{{< marginnote >}}Check that the log-ratio of the integrated kernel to the $t_{\nu_n}(\mu_n, \sigma_n^2/\kappa_n)$ kernel has zero derivative in $\theta$.{{< /marginnote >}}

```js
await show`Assuming[kn > 0 && nun > 0 && s2n > 0 && Element[{th, mun}, Reals],
  FullSimplify[D[Log[${marg} / ${tKer}], th]]]`
```

$$
\begin{aligned}
&\frac{d}{d\theta}\log\!\left(\frac{p(\theta \mid y)}{t_{\nu_n}(\theta \mid \mu_n, \sigma_n^2/\kappa_n)}\right) \\
&= 0
\end{aligned}
$$

{{< marginnote >}}Integrate $u^2$ against the Student-$t$ density to confirm $\operatorname{Var}(\theta \mid y) = [\nu_n/(\nu_n - 2)](\sigma_n^2/\kappa_n)$.{{< /marginnote >}}

```js
// Symbolic Student-t variance Var[theta | y] = (nun / (nun - 2)) * (s2n / kn) for nun > 2
const tVar = await show`Assuming[nun > 2 && kn > 0 && s2n > 0,
  FullSimplify[(s2n/kn) * Integrate[u^2*(1 + u^2/nun)^(-(nun + 1)/2) / (Sqrt[nun]*Beta[1/2, nun/2]), {u, -Infinity, Infinity}]]]`
```

$$
\operatorname{Var}(\theta \mid y) = \frac{\nu_n \sigma_n^2}{\kappa_n (-2+\nu_n)}
$$

{{< marginnote >}}Factor the scaled MSE difference $(n + \kappa_0)^2[\operatorname{MSE}(\hat{\theta}_b) - \operatorname{MSE}(\bar{y})]$ to locate the crossover.{{< /marginnote >}}

```js
// Scaled MSE difference (n + k0)^2 * (MSE(theta_b) - MSE(ybar))
const { Plus, Times, Power, Divide, Subtract, n, k0, s2, mu0, th0 } = W
const mseB = Plus(
  Times(Power(Divide(n, Plus(n, k0)), 2), Divide(s2, n)),
  Times(Power(Divide(k0, Plus(n, k0)), 2), Power(Subtract(mu0, th0), 2))
)
await show`Factor[Together[(${mseB} - s2/n) * (n + k0)^2]]`
```

$$
\begin{aligned}
&(n + \kappa_0)^2\bigl(\operatorname{MSE}(\hat{\theta}_b) - \operatorname{MSE}(\bar{y})\bigr) \\
&= \frac{\kappa_0 \left(\kappa_0 \mu_0^2 n-\kappa_0 \sigma^2 -2 n \sigma^2 -2 \kappa_0 \mu_0 n \theta_0 +\kappa_0 n \theta_0^2\right)}{n}
\end{aligned}
$$

{{< marginnote >}}Posterior mean $\mu_n = (\kappa_0\mu_0 + n\bar{y})/\kappa_n$ on Hoff’s midge data, with $(\mu_0, \kappa_0) = (1.9, 1)$ and $n = 9$.{{< /marginnote >}}

```js
// Instantiate symbolic formulas on Hoff's midge wing lengths (n = 9)
const y = [1.64, 1.70, 1.72, 1.74, 1.82, 1.82, 1.82, 1.90, 2.08]
const mun = await show`N[(19/10 + Total[${y}]) / 10]`
```

$$
\mu_n = \frac{\kappa_0 \mu_0 + \sum_{i=1}^{9} y_i}{\kappa_0 + n} = \frac{1.9 + 16.24}{10} = 1.814
$$

{{< marginnote >}}Posterior scale $\sigma_n^2 = [\nu_0\sigma_0^2 + (n-1)s^2 + \frac{\kappa_0 n}{\kappa_n}(\bar{y} - \mu_0)^2]/\nu_n$, with $(\nu_0, \sigma_0^2) = (1, 0.01)$.{{< /marginnote >}}

```js
const s2n = await show`N[(1/100 + 8*Variance[${y}] + (9/10)*(Mean[${y}] - 19/10)^2) / 10]`
```

$$
\sigma_n^2 = \frac{\nu_0\sigma_0^2 + (n-1)s^2 + \frac{\kappa_0 n}{\kappa_n}(\bar{y}-\mu_0)^2}{\nu_n} = 0.015324
$$

{{< marginnote >}}Solve $1 - I_{10/(10+t^2)}(5, \tfrac12) = 0.95$ for the two-sided $97.5\%$ quantile of $t_{10}$.{{< /marginnote >}}

```js
const tCrit = await show`t /. FindRoot[1 - Beta[10/(10 + t^2), 5, 1/2]/Beta[5, 1/2] == 95/100, {t, 2.2}]`
```

$$
t_{10,\,0.975} : \; 1 - \frac{B\bigl(\tfrac{10}{10+t^2};\, 5, \tfrac12\bigr)}{B\bigl(5, \tfrac12\bigr)} = 0.95 \;\Longrightarrow\; t = 2.22814
$$

{{< marginnote >}}Instantiate the exact posterior mean, variance, SD, and $95\%$ Student-$t$ credible interval on Hoff’s midge data.{{< /marginnote >}}

```js
await show`N[{${mun}, ${s2n}, Sqrt[${tVar} /. {nun -> 10, kn -> 10, s2n -> ${s2n}}], ${mun} - ${tCrit}*Sqrt[${s2n}/10], ${mun} + ${tCrit}*Sqrt[${s2n}/10]}]`
```

$$
\begin{aligned}
&\bigl(\mu_n,\; \sigma_n^2,\; \operatorname{SD}(\theta \mid y),\; \text{CI}_{0.025},\; \text{CI}_{0.975}\bigr)_{\text{midge}} \\
&= \{1.814,0.015324,0.0437664,1.72678,1.90122\}
\end{aligned}
$$

## Exercises {#sec:ch05-exercises}

{{< thm kind="exercise" label="ex:ch05-improper-limit" >}}
Show that taking $\kappa_0, \nu_0 \to 0^+$ in {{< xref "thm:ch05-nig" "full" >}} gives $\mu_n = \bar{y}$ and $\nu_n = n$, whereas the reference prior $p(\theta, \sigma^2) \propto 1/\sigma^2$ gives $n - 1$ degrees of freedom. Explain the discrepancy by tracking the factor $(\sigma^2)^{-1/2}$ in $p(\theta \mid \sigma^2)$.
{{< /thm >}}

{{< details summary="Symbolic Solution & Instantiation" >}}

{{< marginnote >}}Take $\kappa_0 \to 0^+$ to verify that the posterior mean collapses to the sample mean $\bar{y}$.{{< /marginnote >}}

```js
// Ex 5.1: Marginal posterior exponent of sigma^2 under kappa_0, nu_0 -> 0+ vs. reference prior 1/sigma^2
await show`Limit[(k0*mu0 + n*yb)/(k0 + n), k0 -> 0]`
```

$$
\lim_{\kappa_0 \to 0^+} \mu_n = \bar{y}
$$

{{< marginnote >}}Evaluate the marginal posterior exponent of $\sigma^2$ in the limit $\kappa_0, \nu_0 \to 0^+$.{{< /marginnote >}}

```js
const powLim = await show`Assuming[n > 0, FullSimplify[-(n + nu0)/2 - 1 /. nu0 -> 0]]`
```

$$
\text{Marginal exponent of } \sigma^2 \text{ as } \kappa_0, \nu_0 \to 0^+ = -1-\frac{n}{2}
$$

{{< marginnote >}}Compute the corresponding marginal exponent of $\sigma^2$ under the Jeffreys/reference prior $p(\theta, \sigma^2) \propto 1/\sigma^2$.{{< /marginnote >}}

```js
const powRef = await show`Assuming[n > 0, FullSimplify[-(n - 1)/2 - 1]]`
```

$$
\begin{aligned}
&\text{Marginal exponent of } \sigma^2 \text{ under } p(\theta, \sigma^2) \propto 1/\sigma^2 \\
&= \frac{1}{2} (-1-n)
\end{aligned}
$$

{{< marginnote >}}Instantiate the resulting degrees of freedom at $n = 9$, showing the $1$-df difference ($9$ versus $8$).{{< /marginnote >}}

```js
await show`{-2*(${powLim} + 1), -2*(${powRef} + 1)} /. n -> 9`
```

$$
\bigl(\text{df}_{\kappa_0,\nu_0\to 0^+},\; \text{df}_{1/\sigma^2}\bigr)_{n=9} = \{9,8\}
$$

{{< /details >}}

{{< thm kind="exercise" label="ex:ch05-pred-student-t" >}}
Derive the exact posterior predictive distribution $\tilde{Y} \mid y_{1:n}$ in {{< xref "thm:ch05-nig" "full" >}} by integrating $\tilde{Y} \mid \theta, \sigma^2 \sim \operatorname{normal}(\theta, \sigma^2)$ first over $\theta \mid \sigma^2, y_{1:n}$ and then over $\sigma^2 \mid y_{1:n}$. Confirm that its variance is $\frac{\nu_n}{\nu_n - 2}\,\sigma_n^2(1 + 1/\kappa_n)$ for $\nu_n > 2$.
{{< /thm >}}

{{< details summary="Symbolic Solution & Instantiation" >}}

{{< marginnote >}}Simplify the exact posterior predictive Student-$t$ variance $\operatorname{Var}(\tilde{Y} \mid y)$ for $\nu_n > 2$.{{< /marginnote >}}

```js
// Ex 5.2: Exact posterior predictive Student-t variance for Normal-IG model
const predVar = await show`Assuming[nun > 2 && kn > 0 && s2n > 0,
  FullSimplify[(nun/(nun - 2)) * s2n * (1 + 1/kn)]]`
```

$$
\begin{aligned}
&\operatorname{Var}(\tilde{Y} \mid y) \\
&= \frac{\left(1+\frac{1}{\kappa_n}\right) \nu_n \sigma_n^2}{-2+\nu_n}
\end{aligned}
$$

{{< marginnote >}}Instantiate the midge predictive SD alongside the much narrower posterior SD of $\theta$.{{< /marginnote >}}

```js
await show`N[{Sqrt[${predVar}], Sqrt[(nun/(nun - 2))*s2n/kn]} /. {nun -> 10, kn -> 10, s2n -> 0.01532}]`
```

$$
\begin{aligned}
&\bigl(\operatorname{SD}(\tilde{Y} \mid y),\; \operatorname{SD}(\theta \mid y)\bigr)_{\text{midge}} \\
&= \{0.145138,0.0437607\}
\end{aligned}
$$

{{< /details >}}

{{< thm kind="exercise" label="ex:ch05-mse-crossover" >}}
In {{< xref "thm:ch05-mse" "full" >}}, suppose $\theta_0 = 112$, $\sigma^2 = 169$, $\mu_0 = 100$, and $\kappa_0 = 3$. Find the exact sample size $n^*$ above which $\bar{y}$ achieves lower MSE than $\hat{\theta}_b$, and verify your threshold against the orange curve in {{< xref "fig:ch05-mse" "full" >}}.
{{< /thm >}}

{{< details summary="Symbolic Solution & Instantiation" >}}

{{< marginnote >}}Solve $\operatorname{MSE}(\hat{\theta}_b) = \operatorname{MSE}(\bar{y})$ symbolically for the exact crossover sample size $n^*$.{{< /marginnote >}}

```js
// Ex 5.3: Exact sample-size crossover n* where ybar beats Bayes shrinkage in MSE (exists iff k0*(mu0 - th0)^2 > 2*s2)
const nStar = await show`n /. First[Solve[(mu0 - th0)^2 == s2*(1/n + 2/k0), n]]`
```

$$
\begin{aligned}
&n^* \\
&= \frac{\kappa_0 \sigma^2}{\kappa_0 \mu_0^2-2 \sigma^2 -2 \kappa_0 \mu_0 \theta_0 +\kappa_0 \theta_0^2}
\end{aligned}
$$

{{< marginnote >}}Evaluate $n^*$ both as an exact fraction and numerically for the town-IQ parameters ($\theta_0=112, \mu_0=100$).{{< /marginnote >}}

```js
await show`{${nStar}, N[${nStar}]} /. {th0 -> 112, mu0 -> 100, s2 -> 169, k0 -> 3}`
```

$$
\begin{aligned}
&\bigl(n^*_{\text{exact}},\; n^*_{\text{decimal}}\bigr)_{\theta_0=112,\;\mu_0=100,\;\sigma^2=169,\;\kappa_0=3} \\
&= \left\{\frac{507}{94},5.39362\right\}
\end{aligned}
$$

{{< /details >}}
