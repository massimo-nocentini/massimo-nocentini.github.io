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
- **Means average by precision**: $\mu_n$ is a convex combination of $\mu_0$ and $\bar{y}$, weighted by their respective precisions. Setting $\kappa_0 = \sigma^2 / \tau_0^2$ expresses the prior precision as $\kappa_0$ equivalent observations, giving $\mu_n = \frac{\kappa_0}{\kappa_0 + n}\mu_0 + \frac{n}{\kappa_0 + n}\bar{y}$.
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
Now multiply $p(\theta, \sigma^2)$ by $p(y_{1:n} \mid \theta, \sigma^2)$ and integrate over $\theta \in \mathbb{R}$. The $\theta$-integral $\int \exp\bigl\{-\frac{\kappa_n}{2\sigma^2}(\theta - \mu_n)^2\bigr\}\,d\theta = \sqrt{2\pi\sigma^2/\kappa_n}$ cancels the $(\sigma^2)^{-1/2}$ factor from $p(\theta \mid \sigma^2)$, leaving
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
Suppose $Y_1, \dots, Y_n \stackrel{\text{i.i.d.}}{\sim} \operatorname{normal}(\theta_0, \sigma^2)$ and $\hat{\theta}_b = \frac{n}{n+\kappa_0}\bar{y} + \frac{\kappa_0}{n+\kappa_0}\mu_0$ with $\kappa_0 > 0$. Then

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

## Symbolic Check in Wolfram Language {#sec:ch05-wolfram}

Integrates precision $p = 1/\sigma^2$ out of the Normal–Inverse-Gamma joint posterior in `wolfram-ws-bridge` JavaScript mode, verifies that the ratio to the Student-$t$ kernel has zero derivative in $\theta$, derives the exact symbolic Student-$t$ posterior variance $\operatorname{Var}[\theta \mid y]$, factors $(n + \kappa_0)^2(\operatorname{MSE}(\hat{\theta}_b) - \operatorname{MSE}(\bar{y}))$, and instantiates all symbolic formulas on Hoff’s midge wing lengths.

```js
const marg = await show`Assuming[nun > 0 && rate > 0,
  FullSimplify[Integrate[p^((nun + 1)/2 - 1)*Exp[-rate*p/2], {p, 0, Infinity}]]] /. rate -> nun*s2n + kn*(th - mun)^2`
```


$$
\begin{aligned}
&\left.\int_0^\infty p^{\frac{\nu_n +1}{2}-1} e^{-\text{rate}\cdot p/2}\,dp\right|_{\text{rate}=\nu_n \,\sigma_n^2 +\kappa_n (\theta -\mu_n)^2} \\
&= 2^{\frac{1+\nu_n}{2}} \left(\frac{1}{\nu_n \sigma_n^2 +\kappa_n (-\mu_n +\theta)^2}\right)^{\frac{1+\nu_n}{2}} \Gamma \left(\frac{1+\nu_n}{2}\right)\end{aligned}
$$

```js
const tKer = await wl`(1 + kn*(th - mun)^2 / (nun*s2n))^(-(nun + 1)/2)`
const ratioSlope = toJS(await wl`Assuming[kn > 0 && nun > 0 && s2n > 0 && Element[{th, mun}, Reals],
  FullSimplify[D[Log[${marg} / ${tKer}], th]]]`)
console.log('d/dth log(marginal / Student-t kernel) =', ratioSlope)
```


```text
d/dth log(marginal / Student-t kernel) = 0
```

```js
// Symbolic Student-t posterior variance Var[theta | y] for nun > 2
const tVar = await show`Assuming[nun > 2 && kn > 0 && s2n > 0,
  FullSimplify[(s2n/kn) * Integrate[u^2*(1 + u^2/nun)^(-(nun + 1)/2) / (Sqrt[nun]*Beta[1/2, nun/2]), {u, -Infinity, Infinity}]]]`
```


$$
\begin{aligned}
&\operatorname{Var}[\theta \mid y] = \frac{\sigma_n^2}{\kappa_n}\int_{-\infty}^\infty u^2\,\frac{(1 + u^2/\nu_n)^{-(\nu_n +1)/2}}{\sqrt{\nu_n}\,B(\tfrac12, \nu_n /2)}\,du \\
&= \frac{\nu_n \sigma_n^2}{\kappa_n (-2+\nu_n)}\end{aligned}
$$

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
(n + \kappa_0)^2\!\left[\operatorname{MSE}(\hat{\theta}_b) - \frac{\sigma^2}{n}\right] \;=\; \frac{\kappa_0 \left(\kappa_0 \mu_0^2 n-\kappa_0 \sigma^2 -2 n \sigma^2 -2 \kappa_0 \mu_0 n \theta_0 +\kappa_0 n \theta_0^2\right)}{n}
$$

```js
// Instantiate symbolic formulas on Hoff's midge wing lengths (n = 9)
const y = [1.64, 1.70, 1.72, 1.74, 1.82, 1.82, 1.82, 1.90, 2.08]
const mun = toJS(await wl`N[(19/10 + Total[${y}]) / 10]`)
const s2n = toJS(await wl`N[(1/100 + 8*Variance[${y}] + (9/10)*(Mean[${y}] - 19/10)^2) / 10]`)
const sdPost = Math.sqrt(toJS(await wl`N[${tVar} /. {nun -> 10, kn -> 10, s2n -> ${s2n}}]`))
const tCrit = toJS(await wl`t /. FindRoot[
  Integrate[(1 + u^2/10)^(-11/2) / (Sqrt[10]*Beta[1/2, 5]), {u, -t, t}] == 95/100, {t, 2.2}]`)
const lo = mun - tCrit * Math.sqrt(s2n / 10), hi = mun + tCrit * Math.sqrt(s2n / 10)
console.log(`Midge exact: mu_n = ${mun.toFixed(4)}, s2_n = ${s2n.toFixed(5)}, post SD = ${sdPost.toFixed(4)}, 95% CI = [${lo.toFixed(4)}, ${hi.toFixed(4)}]`)
```


```text
Midge exact: mu_n = 1.8140, s2_n = 0.01532, post SD = 0.0438, 95% CI = [1.7268, 1.9012]
```

## Exercises {#sec:ch05-exercises}

{{< thm kind="exercise" label="ex:ch05-improper-limit" >}}
Show that taking $\kappa_0, \nu_0 \to 0^+$ in {{< xref "thm:ch05-nig" "full" >}} gives $\mu_n = \bar{y}$ and $\nu_n = n$, whereas the reference prior $p(\theta, \sigma^2) \propto 1/\sigma^2$ gives $n - 1$ degrees of freedom. Explain the discrepancy by tracking the factor $(\sigma^2)^{-1/2}$ in $p(\theta \mid \sigma^2)$.
{{< /thm >}}

{{< details summary="Symbolic Solution & Instantiation" >}}

```js
// Ex 5.1: Marginal posterior exponent of sigma^2 under kappa_0, nu_0 -> 0+ vs. reference prior 1/sigma^2
const muLim = await show`Limit[(k0*mu0 + n*yb)/(k0 + n), k0 -> 0]`
```

$$
\lim_{\kappa_0 \to 0^+} \mu_n = \bar{y}
$$

```js
const powLim = await show`Assuming[n > 0, FullSimplify[-(n + nu0)/2 - 1 /. nu0 -> 0]]`
```

$$
\text{Marginal exponent of } \sigma^2 \text{ as } \kappa_0, \nu_0 \to 0^+ = -1-\frac{n}{2}
$$

```js
const powRef = await show`Assuming[n > 0, FullSimplify[-(n - 1)/2 - 1]]`
```

$$
\begin{aligned}
&\text{Marginal exponent of } \sigma^2 \text{ under } p(\theta, \sigma^2) \propto 1/\sigma^2 \\
&= \frac{1}{2} (-1-n)
\end{aligned}
$$

```js
const [dfLim, dfRef] = toJS(await wl`{-2*(${powLim} + 1), -2*(${powRef} + 1)} /. n -> 9`)
console.log(`At n = 9: kappa0,nu0 -> 0+ gives df = ${dfLim} (prior ~ s2^(-3/2)), whereas 1/s2 gives df = ${dfRef} (nu0 = -1)`)
```

```text
At n = 9: kappa0,nu0 -> 0+ gives df = 9 (prior ~ s2^(-3/2)), whereas 1/s2 gives df = 8 (nu0 = -1)
```

{{< /details >}}

{{< thm kind="exercise" label="ex:ch05-pred-student-t" >}}
Derive the exact posterior predictive distribution $\tilde{Y} \mid y_{1:n}$ in {{< xref "thm:ch05-nig" "full" >}} by integrating $\tilde{Y} \mid \theta, \sigma^2 \sim \operatorname{normal}(\theta, \sigma^2)$ first over $\theta \mid \sigma^2, y_{1:n}$ and then over $\sigma^2 \mid y_{1:n}$. Confirm that its variance is $\frac{\nu_n}{\nu_n - 2}\,\sigma_n^2(1 + 1/\kappa_n)$ for $\nu_n > 2$.
{{< /thm >}}

{{< details summary="Symbolic Solution & Instantiation" >}}

```js
// Ex 5.2: Exact posterior predictive Student-t variance for Normal-IG model
const predVar = await show`Assuming[nun > 2 && kn > 0 && s2n > 0,
  FullSimplify[(nun/(nun - 2)) * s2n * (1 + 1/kn)]]`
```

$$
\begin{aligned}
&\operatorname{Var}(\tilde{Y} \mid y) \\
&= \frac{\left(1+\frac{1}{\kappa_n }\right) \nu_n \sigma_n^2 }{-2+\nu_n }
\end{aligned}
$$

```js
const sdPred = Math.sqrt(toJS(await wl`N[${predVar} /. {nun -> 10, kn -> 10, s2n -> 0.01532}]`))
const sdTheta = Math.sqrt(toJS(await wl`N[(nun/(nun - 2))*s2n/kn /. {nun -> 10, kn -> 10, s2n -> 0.01532}]`))
console.log(`Midge posterior predictive SD = ${sdPred.toFixed(4)} (vs. posterior SD of theta = ${sdTheta.toFixed(4)})`)
```

```text
Midge posterior predictive SD = 0.1451 (vs. posterior SD of theta = 0.0438)
```

{{< /details >}}

{{< thm kind="exercise" label="ex:ch05-mse-crossover" >}}
In {{< xref "thm:ch05-mse" "full" >}}, suppose $\theta_0 = 112$, $\sigma^2 = 169$, $\mu_0 = 100$, and $\kappa_0 = 3$. Find the exact sample size $n^*$ above which $\bar{y}$ achieves lower MSE than $\hat{\theta}_b$, and verify your threshold against the orange curve in {{< xref "fig:ch05-mse" "full" >}}.
{{< /thm >}}

{{< details summary="Symbolic Solution & Instantiation" >}}

```js
// Ex 5.3: Exact sample-size crossover n* where ybar beats Bayes shrinkage in MSE (exists iff k0*(mu0 - th0)^2 > 2*s2)
const nStar = await show`n /. First[Solve[(mu0 - th0)^2 == s2*(1/n + 2/k0), n]]`
```

$$
\begin{aligned}
&n^* \\
&= \frac{\kappa_0 \sigma^2 }{\kappa_0 \mu_0 ^2-2 \sigma^2 -2 \kappa_0 \mu_0 \theta_0 +\kappa_0 \theta_0 ^2}
\end{aligned}
$$

```js
const val = toJS(await wl`N[${nStar} /. {th0 -> 112, mu0 -> 100, s2 -> 169, k0 -> 3}]`)
console.log(`At theta0=112, mu0=100, s2=169, k0=3 -> exact n* = ${val.toFixed(3)} (= 507/94; ybar wins for n >= 6)`)
```

```text
At theta0=112, mu0=100, s2=169, k0=3 -> exact n* = 5.394 (= 507/94; ybar wins for n >= 6)
```

{{< /details >}}
