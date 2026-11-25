---
title: "One-Parameter Models"
linkTitle: "One-Parameter Models"
weight: 30
label: "ch:one-param"
---

{{< newthought "One-parameter models" />}} provide the cleanest laboratory for mastering the mechanics of Bayesian inference: sufficient statistics, conjugate updating by kernel recognition, posterior predictive distributions, credible intervals, and the unifying theory of exponential families.{{< cite "hoff2009" >}}

## The Binomial–Beta Model {#sec:ch03-binomial}

Let $Y_1, \dots, Y_n \mid \theta \stackrel{\text{i.i.d.}}{\sim} \operatorname{binary}(\theta)$, where $\theta \in [0, 1]$ is a population proportion (for instance, the fraction of women aged 65+ in the 1998 GSS reporting general happiness: $n = 129$, $\sum y_i = 118$). The joint sampling probability is

$$
p(y_1, \dots, y_n \mid \theta) = \theta^{\sum_{i=1}^n y_i}(1 - \theta)^{n - \sum_{i=1}^n y_i}. \label{eq:ch03-bern-lik}
$$

By the **Fisher–Neyman factorization theorem**{{< index "Fisher–Neyman factorization" >}}, a statistic $T(Y)$ is a **sufficient statistic**{{< index "sufficient statistic" >}} for $\theta$ if and only if the sampling density factors as $p(y \mid \theta) = h(y)\,g\bigl(T(y), \theta\bigr)$ where $h(y)$ does not depend on $\theta$. In {{< eqref "eq:ch03-bern-lik" >}}, $h(y) = 1$ and the likelihood depends on $(y_1, \dots, y_n)$ *only* through $Y = \sum_{i=1}^n Y_i$; consequently, for any prior $p(\theta)$, the posterior $p(\theta \mid y_1, \dots, y_n) = p(\theta \mid Y = y)$ is identical whether we condition on the full sequence or only on the sufficient count $Y \mid \theta \sim \operatorname{binomial}(n, \theta)$.

### Beta Conjugacy and Kernel Recognition {#sec:ch03-conjugacy}

{{< definition note="Conjugate Prior Family" label="def:ch03-conjugate" >}}
A class $\mathcal{P}$ of prior distributions for $\theta$ is **conjugate**{{< index "conjugate prior" >}} for a sampling model $p(y \mid \theta)$ if{{< cite "raiffa1961" >}}
$$
p(\theta) \in \mathcal{P} \implies p(\theta \mid y) \in \mathcal{P}.
$$
{{< /definition >}}

Suppose $\theta \sim \operatorname{beta}(a, b)$, with density $p(\theta) = \frac{\Gamma(a+b)}{\Gamma(a)\Gamma(b)} \theta^{a-1}(1-\theta)^{b-1}$ on $[0, 1]$ (the uniform prior on $[0, 1]$ is the special case $a = b = 1$). Multiplying prior and binomial likelihood and dropping factors independent of $\theta$ gives

$$
p(\theta \mid y) \propto \theta^{a-1}(1 - \theta)^{b-1} \cdot \theta^y (1 - \theta)^{n - y}
= \theta^{(a + y) - 1}(1 - \theta)^{(b + n - y) - 1}. \label{eq:ch03-beta-kernel}
$$

Because {{< eqref "eq:ch03-beta-kernel" >}} has the exact functional form (*kernel*) of a $\operatorname{beta}(a + y,\, b + n - y)$ density and both densities must integrate to $1$, they are identically equal—no integration required! This **kernel recognition trick**{{< index "kernel recognition" >}} is used in every chapter of Hoff.

{{< proposition note="Beta–Binomial Update and Prediction" label="prop:ch03-beta-binom" >}}
If $\theta \sim \operatorname{beta}(a, b)$ and $Y_1, \dots, Y_n \mid \theta \stackrel{\text{i.i.d.}}{\sim} \operatorname{binary}(\theta)$ with $y = \sum_{i=1}^n y_i$, set $a_n = a + y$ and $b_n = b + n - y$. Then:

1. **Posterior**: $\theta \mid y \sim \operatorname{beta}(a_n, b_n)$, with mean

   $$
   E[\theta \mid y] = \frac{a + b}{a + b + n}\,\frac{a}{a + b} + \frac{n}{a + b + n}\,\frac{y}{n}. \label{eq:ch03-beta-mean}
   $$

2. **Posterior predictive (single trial)**: because a future draw $\tilde{Y}$ is conditionally independent of $y_1, \dots, y_n$ given $\theta$ ($\tilde{Y} \perp y_{1:n} \mid \theta$),

   $$
   \Pr(\tilde{Y} = 1 \mid y_{1:n})
   = \int_0^1 \Pr(\tilde{Y} = 1 \mid \theta, y_{1:n})\,p(\theta \mid y_{1:n})\,d\theta
   = \int_0^1 \theta\,p(\theta \mid y_{1:n})\,d\theta
   = \frac{a_n}{a_n + b_n}. \label{eq:ch03-beta-pred}
   $$

3. **Posterior predictive ($m$ future trials)**: the total count $\tilde{S}_m = \sum_{j=1}^m \tilde{Y}_j$ follows a **beta–binomial**{{< index "beta–binomial distribution" >}} distribution:

   $$
   \Pr(\tilde{S}_m = \tilde{y} \mid y_{1:n})
   = \binom{m}{\tilde{y}} \frac{B(a_n + \tilde{y},\, b_n + m - \tilde{y})}{B(a_n, b_n)},
   \qquad \tilde{y} \in \{0, 1, \dots, m\}, \label{eq:ch03-betabinom}
   $$

   where $B(\alpha, \beta) = \Gamma(\alpha)\Gamma(\beta)/\Gamma(\alpha+\beta)$.
{{< /proposition >}}

Notice the intuitive **pseudo-count interpretation**: $a$ acts as prior successes, $b$ as prior failures, and $a + b$ as the prior sample size. Notice also that $\tilde{Y}$ is *not* marginally independent of $y_1, \dots, y_n$: the observed data inform $\theta$, which in turn shifts our prediction for $\tilde{Y}$.

## Credible Regions: Coverage, Quantiles, and HPD {#sec:ch03-credible}

After observing $Y = y$, how do we summarize plausible values of $\theta$ with an interval $[l(y), u(y)]$? Hoff emphasizes the sharp distinction between post-experimental and pre-experimental probability:

{{< definition note="Bayesian vs. Frequentist Coverage" label="def:ch03-coverage" >}}
- An interval $[l(y), u(y)]$ has **$100(1-\alpha)\%$ Bayesian coverage**{{< index "Bayesian coverage" >}} (a **credible interval**{{< index "credible interval" >}}) if $\Pr(l(y) < \theta < u(y) \mid Y = y) = 1 - \alpha$.
- A random interval $[l(Y), u(Y)]$ has **$100(1-\alpha)\%$ frequentist coverage**{{< index "frequentist coverage" >}} if, *before* observing $Y$, $\Pr(l(Y) < \theta < u(Y) \mid \theta) = 1 - \alpha$ for *all* $\theta \in \Theta$.
{{< /definition >}}

Under regular continuous models, Welch and Peers{{< cite "welch1963" >}} and Hartigan{{< cite "hartigan1966" >}} showed that two-sided $95\%$ Bayesian credible intervals also achieve $95\% + O(1/n)$ frequentist coverage asymptotically (for discrete binomial data, lattice effects introduce $O(n^{-1/2})$ oscillations unless intervals are randomized{{< cite "brown2001" >}}). Thus Bayesian intervals inherit strong long-run coverage while retaining a direct post-data probability interpretation.

There are two standard ways to construct a $100(1-\alpha)\%$ Bayesian region:

1. **Equal-tailed quantile interval**{{< index "quantile-based interval" >}}: $[\theta_{\alpha/2}, \theta_{1-\alpha/2}]$, putting $\alpha/2$ posterior probability in each tail. Easy to compute from quantiles or Monte Carlo draws, and **invariant under strictly monotone reparameterizations**: if $\gamma = g(\theta)$ is strictly increasing, the quantile interval for $\gamma$ is simply $[g(\theta_{\alpha/2}), g(\theta_{1-\alpha/2})]$.
2. **Highest Posterior Density (HPD) region**{{< index "HPD region" >}}: a subset $s(y) \subset \Theta$ with $\Pr(\theta \in s(y) \mid y) = 1 - \alpha$ such that every point inside $s(y)$ has higher posterior density than every point outside: $\theta_a \in s(y),\, \theta_b \notin s(y) \implies p(\theta_a \mid y) > p(\theta_b \mid y)$.

An HPD region is the *shortest* possible region of a given probability content, and for multimodal posteriors it naturally splits into disjoint intervals. However, unlike quantile intervals, HPD regions are **not invariant** under nonlinear reparameterizations because the Jacobian $\lvert d\theta/d\gamma \rvert$ reshapes the density height! For $\theta \mid y \sim \operatorname{beta}(3, 9)$ (from $n = 10, y = 2$ under a uniform prior), the 95% equal-tailed quantile interval is $[0.060, 0.518]$ (width $0.458$), whereas the 95% HPD interval is $[0.041, 0.484]$ (width $0.443$, at density threshold $h^* = 0.585$; {{< xref "fig:ch03-hpd" "full" >}}).{{< sidenote >}}Note a typographical slip in the 2009 printing of Hoff (p. 43), which writes `[0.04, 0.048]` instead of `[0.04, 0.48]` for the 95% HPD of $\operatorname{beta}(3, 9)$; see {{< xref "app:errata" "full" >}}.{{< /sidenote >}}

{{< fig src="images/bayesian-hoff/fig-ch03-hpd-vs-quantile.svg" type="fullwidth" label="fig:ch03-hpd" alt="Three panels: Beta(3, 9) density comparing the 95 percent HPD interval [0.041, 0.484] against the equal-tailed quantile interval [0.060, 0.518]; GSS fertility posterior densities Gamma(219, 112) and Gamma(68, 45); and overlapping Negative Binomial posterior predictive count distributions" short="HPD vs. equal-tailed intervals, and population vs. predictive differences" >}}Left: for the skewed $\operatorname{beta}(3, 9)$ posterior, the 95% HPD interval (shaded, horizontal cut) is narrower than the equal-tailed quantile interval (dashed). Center and right: GSS fertility rates comparing women without vs. with a bachelor’s degree—posterior densities of the group means $\theta_1, \theta_2$ separate cleanly ($\Pr(\theta_1 > \theta_2 \mid y) = 0.97$), yet the individual posterior predictive counts $\tilde{Y}_1, \tilde{Y}_2$ overlap heavily ($\Pr(\tilde{Y}_1 > \tilde{Y}_2 \mid y) = 0.48$).{{< /fig >}}

## The Poisson–Gamma Model {#sec:ch03-poisson}

For count data $Y_1, \dots, Y_n \mid \theta \stackrel{\text{i.i.d.}}{\sim} \operatorname{Poisson}(\theta)$ with $p(y \mid \theta) = \theta^y e^{-\theta} / y!$, note the **mean–variance equality** $E[Y \mid \theta] = \operatorname{Var}[Y \mid \theta] = \theta$. The likelihood is proportional to $\theta^{\sum y_i} e^{-n\theta}$, so $\sum_{i=1}^n Y_i$ is again sufficient, and the conjugate prior is the **gamma distribution**{{< index "gamma distribution" >}} (shape $a > 0$, rate $b > 0$):

$$
p(\theta) = \frac{b^a}{\Gamma(a)}\,\theta^{a - 1} e^{-b\theta}, \qquad
E[\theta] = \frac{a}{b}, \qquad
\operatorname{Var}[\theta] = \frac{a}{b^2}. \label{eq:ch03-gamma}
$$

Multiplying prior and likelihood yields the conjugate posterior and the exact **negative binomial**{{< index "negative binomial distribution" >}} posterior predictive distribution:

{{< proposition note="Poisson–Gamma Update and Predictive Variance" label="prop:ch03-pois-gamma" >}}
Let $\theta \sim \operatorname{gamma}(a, b)$ and $Y_1, \dots, Y_n \mid \theta \stackrel{\text{i.i.d.}}{\sim} \operatorname{Poisson}(\theta)$, with $a_n = a + \sum_{i=1}^n y_i$ and $b_n = b + n$. Then:

1. **Posterior**: $\theta \mid y_1, \dots, y_n \sim \operatorname{gamma}(a_n, b_n)$, with $E[\theta \mid y] = \frac{b}{b+n}\frac{a}{b} + \frac{n}{b+n}\bar{y}$. Here $b$ acts as prior sample size and $a$ as prior total count.
2. **Posterior predictive**: integrating out $\theta$ gives a $\operatorname{negative\ binomial}(a_n, b_n)$ distribution,

   $$
   p(\tilde{y} \mid y_1, \dots, y_n)
   = \frac{\Gamma(a_n + \tilde{y})}{\Gamma(\tilde{y} + 1)\,\Gamma(a_n)}
   \left(\frac{b_n}{b_n + 1}\right)^{a_n}
   \left(\frac{1}{b_n + 1}\right)^{\tilde{y}}, \qquad \tilde{y} \in \{0, 1, 2, \dots\}, \label{eq:ch03-negbin}
   $$

   with mean and variance

   $$
   E[\tilde{Y} \mid y] = \frac{a_n}{b_n} = E[\theta \mid y], \qquad
   \operatorname{Var}[\tilde{Y} \mid y] = E[\theta \mid y]\,\frac{b_n + 1}{b_n}
   = \underbrace{E[\theta \mid y]}_{\text{sampling variability}} + \underbrace{\operatorname{Var}[\theta \mid y]}_{\text{parameter uncertainty}}. \label{eq:ch03-pred-var}
   $$
{{< /proposition >}}

{{< proof >}}
For the posterior, $p(\theta \mid y_{1:n}) \propto \theta^{a-1} e^{-b\theta} \cdot \theta^{\sum y_i} e^{-n\theta} = \theta^{a_n - 1} e^{-b_n \theta}$, which is the kernel of $\operatorname{gamma}(a_n, b_n)$. For the predictive distribution, using $\tilde{Y} \perp y_{1:n} \mid \theta$ and the gamma integral $\int_0^\infty \theta^{\alpha - 1} e^{-\beta\theta}\,d\theta = \Gamma(\alpha)/\beta^\alpha$:
$$
\begin{aligned}
p(\tilde{y} \mid y_{1:n})
&= \int_0^\infty \frac{\theta^{\tilde{y}} e^{-\theta}}{\tilde{y}!}\,\frac{b_n^{a_n}}{\Gamma(a_n)}\,\theta^{a_n - 1} e^{-b_n \theta}\,d\theta \\
&= \frac{b_n^{a_n}}{\Gamma(\tilde{y} + 1)\,\Gamma(a_n)} \int_0^\infty \theta^{(a_n + \tilde{y}) - 1} e^{-(b_n + 1)\theta}\,d\theta
= \frac{b_n^{a_n}}{\Gamma(\tilde{y} + 1)\,\Gamma(a_n)}\,\frac{\Gamma(a_n + \tilde{y})}{(b_n + 1)^{a_n + \tilde{y}}},
\end{aligned}
$$
which rearranges immediately into {{< eqref "eq:ch03-negbin" >}}. The predictive variance {{< eqref "eq:ch03-pred-var" >}} follows directly from the law of total variance: $\operatorname{Var}[\tilde{Y} \mid y] = E[\operatorname{Var}(\tilde{Y} \mid \theta) \mid y] + \operatorname{Var}[E(\tilde{Y} \mid \theta) \mid y] = E[\theta \mid y] + \operatorname{Var}[\theta \mid y]$.
{{< /proof >}}

Equation {{< eqref "eq:ch03-pred-var" >}} captures a universal law of Bayesian prediction: predictive variance equals expected sampling variance *plus* variance from parameter uncertainty. As $n \to \infty$, $\operatorname{Var}[\theta \mid y] \to 0$, but irreducible sampling variability $E[\theta \mid y]$ remains.

### Crucial Distinction: Population Means vs. Individuals {#sec:ch03-pop-vs-ind}

In Hoff’s GSS birth-rate analysis ($n_1 = 111, \sum y_{i,1} = 217$ for women aged 40 without a bachelor’s degree; $n_2 = 44, \sum y_{i,2} = 66$ with a degree; common prior $\operatorname{gamma}(2, 1)$), the posteriors are $\operatorname{gamma}(219, 112)$ and $\operatorname{gamma}(68, 45)$. Comparing the *population means* gives $\Pr(\theta_1 > \theta_2 \mid y) = 0.97$—strong evidence that the average rates differ. Yet comparing *two randomly drawn women* yields $\Pr(\tilde{Y}_1 > \tilde{Y}_2 \mid y) = 0.48$ and $\Pr(\tilde{Y}_1 = \tilde{Y}_2 \mid y) = 0.22$ ({{< xref "fig:ch03-hpd" "full" >}}). **Strong evidence of a difference in population means does not imply that the difference is large relative to individual variability.**

## Exponential Families and Diaconis–Ylvisaker Priors {#sec:ch03-expfam}

Both the binomial and Poisson models are instances of a **one-parameter exponential family**{{< index "exponential family" >}}:

$$
p(y \mid \phi) = h(y)\,c(\phi)\,\exp\bigl(\phi\,t(y)\bigr), \label{eq:ch03-expfam}
$$

where $\phi$ is the natural parameter and $t(y)$ is the sufficient statistic. Diaconis and Ylvisaker{{< cite "diaconis1979" >}} proved that the canonical conjugate prior takes the form

$$
p(\phi \mid n_0, t_0) = \kappa(n_0, t_0)\,c(\phi)^{n_0}\,\exp(n_0 t_0 \phi), \label{eq:ch03-dy-prior}
$$

which is proper whenever $n_0 > 0$ and $t_0$ lies in the interior of the convex hull of the support of $t(Y)$. Under $n$ i.i.d. observations with sample average $\bar{t}(y) = \frac{1}{n}\sum_{i=1}^n t(y_i)$, it updates linearly to $p\bigl(\phi \mid n_0 + n,\, \frac{n_0 t_0 + n\bar{t}(y)}{n_0 + n}\bigr)$, and satisfies $E\bigl[E[t(Y) \mid \phi]\bigr] = t_0$: thus $t_0$ is the prior expectation of the mean sufficient statistic and $n_0$ is the equivalent prior sample size.

To translate {{< eqref "eq:ch03-dy-prior" >}} from the natural parameter $\phi$ back to the standard parameter $\theta$, we apply the change-of-variables Jacobian $p(\theta) = p(\phi(\theta))\,\lvert d\phi/d\theta \rvert$:

- **Binary**: $\phi = \log\frac{\theta}{1-\theta}$, so $c(\phi) = 1 - \theta$ and $\lvert d\phi/d\theta \rvert = \theta^{-1}(1-\theta)^{-1}$, giving $p(\theta) \propto (1-\theta)^{n_0} (\frac{\theta}{1-\theta})^{n_0 t_0} \theta^{-1}(1-\theta)^{-1} = \theta^{n_0 t_0 - 1}(1-\theta)^{n_0(1-t_0) - 1}$, i.e. $\operatorname{beta}\bigl(n_0 t_0,\, n_0(1 - t_0)\bigr)$.
- **Poisson**: $\phi = \log\theta$, so $c(\phi) = \exp(-e^\phi) = e^{-\theta}$ and $\lvert d\phi/d\theta \rvert = \theta^{-1}$, giving $p(\theta) \propto e^{-n_0 \theta}\,\theta^{n_0 t_0}\,\theta^{-1} = \theta^{n_0 t_0 - 1} e^{-n_0 \theta}$, i.e. $\operatorname{gamma}(n_0 t_0,\, n_0)$.

| Model | $t(y)$ | Natural $\phi$ | $c(\phi)$ | Conjugate prior on $\theta$ | Weakly informative ($n_0 = 1$) |
|:------|:-------|:---------------|:----------|:----------------------------|:-------------------------------|
| $\operatorname{binary}(\theta)$ | $y$ | $\log\frac{\theta}{1-\theta}$ | $(1 + e^\phi)^{-1}$ | $\operatorname{beta}(n_0 t_0,\, n_0(1-t_0))$ | $\operatorname{beta}(t_0, 1-t_0)$; at $t_0=\tfrac12$, Jeffreys’ $\operatorname{beta}(\tfrac12,\tfrac12)$ |
| $\operatorname{Poisson}(\theta)$ | $y$ | $\log\theta$ | $\exp(-e^\phi)$ | $\operatorname{gamma}(n_0 t_0,\, n_0)$ | $\operatorname{gamma}(t_0, 1)$ |
{#tab:ch03-expfam caption="One-parameter exponential family structure and Diaconis–Ylvisaker conjugate priors (correcting the sign typo in the 2009 printing of Hoff, p. 52; see Appendix C)." short="One-parameter exponential families"}

```python
import numpy as np
from scipy import stats

# Poisson-Gamma birth rates: exact posterior summaries & Negative Binomial predictive
a, b = 2, 1
n1, sy1 = 111, 217
n2, sy2 = 44, 66

# Note: scipy.stats.gamma uses scale = 1/rate
ci1 = stats.gamma.ppf([0.025, 0.975], a=a + sy1, scale=1 / (b + n1))
ci2 = stats.gamma.ppf([0.025, 0.975], a=a + sy2, scale=1 / (b + n2))
print("No degree 95% CI:", np.round(ci1, 3))
print("Degree    95% CI:", np.round(ci2, 3))

# Posterior predictive PMF: scipy.stats.nbinom(n=a_n, p=b_n/(b_n+1))
y_vals = np.arange(0, 6)
pmf1 = stats.nbinom.pmf(y_vals, a + sy1, (b + n1) / (b + n1 + 1))
print("Pred PMF (no degree, y=0..5):", np.round(pmf1, 3))
```

## Symbolic Check in Wolfram Language {#sec:ch03-wolfram}

Integrates $\theta$ out of the Poisson–Gamma posterior symbolically in `wolfram-ws-bridge` JavaScript mode to recover the Negative Binomial predictive PMF, mean, and variance, derives the general symbolic Beta interval mass $\int_l^u p(t \mid a, b)\,dt$, and then instantiates both on the GSS fertility counts and the $\operatorname{beta}(3, 9)$ 95% HPD interval.

```js
const { Times, Divide, Power, Exp, Minus, Subtract, Gamma, Factorial, th, yt, an, bn } = W
const pois = Divide(Times(Power(th, yt), Exp(Minus(th))), Factorial(yt))
const gam = Times(Divide(Power(bn, an), Gamma(an)), Power(th, Subtract(an, 1)), Exp(Times(-1, bn, th)))
const pred = await show`Assuming[an > 0 && bn > 0 && yt >= 0 && Element[yt, Integers],
  FullSimplify[Integrate[${pois} * ${gam}, {th, 0, Infinity}]]]`
```


$$
\int_0^\infty \frac{\theta^{\tilde{y}} e^{-\theta}}{\tilde{y} !}\,\frac{b_n^{a_n}}{\Gamma(a_n)}\,\theta^{a_n -1} e^{-b_n \,\theta}\,d\theta \;=\; \frac{b_n^{a_n} (1+b_n)^{-a_n -\tilde{y}} \Gamma (a_n +\tilde{y})}{\tilde{y} ! \Gamma (a_n)}
$$

```js
const predMean = await show`Assuming[an > 0 && bn > 0, FullSimplify[Sum[yt * ${pred}, {yt, 0, Infinity}]]]`
```


$$
\sum_{\tilde{y} =0}^{\infty} \tilde{y} \cdot p(\tilde{y} \mid y) \;=\; \frac{a_n}{b_n}
$$

```js
await show`Assuming[an > 0 && bn > 0,
  FullSimplify[Sum[yt^2 * ${pred}, {yt, 0, Infinity}] - (${predMean})^2]]`
```


$$
\sum_{\tilde{y} =0}^{\infty} \tilde{y}^2\,p(\tilde{y} \mid y) - \left(\frac{a_n}{b_n}\right)^2 \;=\; \frac{a_n (1+b_n)}{b_n^2}
$$

```js
// Symbolic interval probability Int_l^u Beta(a, b) for the general HPD system
const betaMass = await show`Assuming[a > 0 && b > 0 && 0 < l < u < 1,
  FullSimplify[Integrate[t^(a - 1)*(1 - t)^(b - 1) / Beta[a, b], {t, l, u}]]]`
```


$$
\int_l^u \frac{t^{a-1}(1-t)^{b-1}}{B(a,b)}\,dt \;=\; \frac{-B_l(a,b)+B_u(a,b)}{B(a,b)}
$$

```js
// Instantiate GSS no-degree group (an = 219, bn = 112) and numerical Beta(3, 9) 95% HPD
const pmf = toJS(await wl`N[Table[${pred} /. {an -> 219, bn -> 112}, {yt, 0, 5}]]`)
console.log('GSS pred PMF (y=0..5):', pmf.map(v => v.toFixed(3)).join(', '))
const hpd = toJS(await wl`{l, u} /. FindRoot[{
  l^(a - 1)*(1 - l)^(b - 1) == u^(a - 1)*(1 - u)^(b - 1),
  (${betaMass}) == 95/100} /. {a -> 3, b -> 9}, {{l, 0.04}, {u, 0.48}}]`)
console.log(`Beta(3,9) 95% HPD = [${hpd[0].toFixed(4)}, ${hpd[1].toFixed(4)}], width = ${(hpd[1] - hpd[0]).toFixed(4)}`)
```


```text
GSS pred PMF (y=0..5): 0.143, 0.277, 0.269, 0.176, 0.086, 0.034
Beta(3,9) 95% HPD = [0.0406, 0.4837], width = 0.4432
```

## Exercises {#sec:ch03-exercises}

{{< thm kind="exercise" label="ex:ch03-hpd-invariance" >}}
Let $\theta \mid y \sim \operatorname{beta}(3, 9)$ and define the log-odds $\gamma = \log\frac{\theta}{1-\theta}$. Compute both the equal-tailed 95% credible interval and the 95% HPD interval for $\gamma$, and compare them against the log-odds transform of the $\theta$-intervals $[0.060, 0.518]$ and $[0.041, 0.484]$. Verify that the quantile interval transforms identically while the HPD interval does not.
{{< /thm >}}

{{< details summary="Symbolic Solution & Instantiation" >}}

```js
// Ex 3.1: Log-odds HPD non-invariance vs. quantile monotone invariance for Beta(3, 9)
const pg = await show`FullSimplify[(E^(a*g)*(1 + E^g)^(-a - b)) / Beta[a, b]]`
```

$$
\begin{aligned}
&p_\gamma(g) = p_\theta\!\left(\frac{e^g}{1+e^g}\right) \left|\frac{d}{dg}\frac{e^g}{1+e^g}\right| \\
&= \frac{e^{a g} \left(1+e^g\right)^{-a-b}}{B(a,b)}
\end{aligned}
$$

```js
const hpdG = toJS(await wl`{gl, gu} /. FindRoot[{
  (${pg} /. {a -> 3, b -> 9, g -> gl}) == (${pg} /. {a -> 3, b -> 9, g -> gu}),
  Integrate[${pg} /. {a -> 3, b -> 9}, {g, gl, gu}] == 95/100}, {{gl, -2.9}, {gu, 0.0}}]`)
const qLo = toJS(await wl`g /. FindRoot[Integrate[${pg} /. {a -> 3, b -> 9}, {g, -Infinity, g}] == 25/1000, {g, -2.7}]`)
const qHi = toJS(await wl`g /. FindRoot[Integrate[${pg} /. {a -> 3, b -> 9}, {g, -Infinity, g}] == 975/1000, {g, 0.1}]`)
const logit = t => Math.log(t / (1 - t))
console.log(`Direct gamma-quantile CI:      [${qLo.toFixed(3)}, ${qHi.toFixed(3)}]  (matches logit of theta-quantiles)`)
console.log(`Transformed theta-HPD CI:      [${logit(0.0406).toFixed(3)}, ${logit(0.4837).toFixed(3)}]  vs. true gamma-HPD: [${hpdG[0].toFixed(3)}, ${hpdG[1].toFixed(3)}]`)
```

```text
Direct gamma-quantile CI:      [-2.748, 0.071]  (matches logit of theta-quantiles)
Transformed theta-HPD CI:      [-3.163, -0.065]  vs. true gamma-HPD: [-2.656, 0.144]
```

{{< /details >}}

{{< thm kind="exercise" label="ex:ch03-betabinom-overdisp" >}}
Using the law of total variance, derive the exact mean and variance of the beta–binomial posterior predictive count $\tilde{S}_m$ in {{< eqref "eq:ch03-betabinom" >}}, and show that its variance exceeds the binomial variance $m \bar{\theta}(1 - \bar{\theta})$ by a factor $(a_n + b_n + m)/(a_n + b_n + 1)$.
{{< /thm >}}

{{< details summary="Symbolic Solution & Instantiation" >}}

```js
// Ex 3.2: Beta-Binomial posterior predictive mean, variance & overdispersion factor
const meanT = await wl`an / (an + bn)`
const varT = await wl`(an*bn) / ((an + bn)^2*(an + bn + 1))`
const meanS = await show`Factor[m * ${meanT}]`
```

$$
\mathbb{E}[\tilde{S}_m \mid y] = \frac{a_n m}{a_n +b_n }
$$

```js
const varS = await show`Factor[m*((${meanT})*(1 - ${meanT}) - ${varT}) + m^2*(${varT})]`
```

$$
\begin{aligned}
&\operatorname{Var}(\tilde{S}_m \mid y) \\
&= \frac{a_n b_n m (a_n +b_n +m)}{(a_n +b_n )^2 (1+a_n +b_n )}
\end{aligned}
$$

```js
const ratio = await show`Factor[${varS} / (m*(${meanT})*(1 - ${meanT}))]`
```

$$
\begin{aligned}
&\frac{\operatorname{Var}(\tilde{S}_m \mid y)}{m\,\bar{\theta}(1 - \bar{\theta})} \\
&= \frac{a_n +b_n +m}{1+a_n +b_n }
\end{aligned}
$$

```js
const [mVal, rVal] = toJS(await wl`N[{${meanS}, ${ratio}} /. {an -> 2, bn -> 40, m -> 20}]`)
console.log(`At Beta(2, 40), m = 20: E[S_m | y] = ${mVal.toFixed(4)}, overdispersion factor = ${rVal.toFixed(4)} (= 62/43)`)
```

```text
At Beta(2, 40), m = 20: E[S_m | y] = 0.9524, overdispersion factor = 1.4419 (= 62/43)
```

{{< /details >}}

{{< thm kind="exercise" label="ex:ch03-exp-expfam" >}}
Cast the exponential sampling model $p(y \mid \theta) = \theta e^{-\theta y}$ ($y > 0, \theta > 0$) into the exponential-family form {{< eqref "eq:ch03-expfam" >}}, write down its Diaconis–Ylvisaker conjugate prior {{< eqref "eq:ch03-dy-prior" >}}, and confirm that the conjugate family is $\operatorname{gamma}(a, b)$.
{{< /thm >}}

{{< details summary="Symbolic Solution & Instantiation" >}}

```js
// Ex 3.3: Exponential model (h=1, c=-phi, t=y) -> Diaconis-Ylvisaker prior -> Gamma(n0 + 1, n0*t0)
const dyPhi = await show`(-phi)^n0 * Exp[n0 * t0 * phi]`
```

$$
\begin{aligned}
&p(\phi \mid n_0, t_0) \propto \exp\!\bigl(n_0 t_0 \phi - n_0(-\log(-\phi))\bigr) \\
&= e^{n_0 \phi t_0 } (-\phi )^{n_0 }
\end{aligned}
$$

```js
const gamKer = await show`FullSimplify[(${dyPhi} /. phi -> -th) * Abs[D[-th, th]], th > 0]`
```

$$
\begin{aligned}
&p(\theta \mid n_0, t_0) \propto p(\phi \mid n_0, t_0)\big|_{\phi = -\theta}\,\left|\frac{d\phi}{d\theta}\right| \\
&= e^{-n_0 t_0 \theta } \theta ^{n_0 }
\end{aligned}
$$

```js
const [shape, rate, meanG] = toJS(await wl`N[{n0 + 1, n0*t0, (n0 + 1)/(n0*t0)} /. {n0 -> 2, t0 -> 3}]`)
console.log(`At (n0=2, t0=3): Gamma(${shape}, ${rate}), prior mean = ${meanG.toFixed(3)}`)
```

```text
At (n0=2, t0=3): Gamma(3, 6), prior mean = 0.500
```

{{< /details >}}
