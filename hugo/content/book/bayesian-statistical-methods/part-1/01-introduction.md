---
title: "Introduction and Examples"
linkTitle: "Introduction"
weight: 10
label: "ch:intro"
---

{{< newthought "Bayesian statistical inference" />}} begins with a deceptively simple shift in viewpoint: probability does not apply only to repeatable physical coin flips; it is a coherent numerical language for quantifying *uncertainty* about any unknown quantity—including a fixed but unknown population parameter $\theta$.{{< cite "hoff2009" >}} When new data $y$ arrive, Bayes’ rule tells us how our state of uncertainty should update, turning prior beliefs into posterior beliefs.

## The Triad of Bayesian Learning {#sec:ch01-triad}

Let $\mathcal{Y}$ denote the **sample space**{{< index "sample space" >}} of all possible datasets and $\Theta$ the **parameter space**{{< index "parameter space" >}} of all candidate values describing the population. Idealized Bayesian learning rests on three objects:

1. **Prior distribution**{{< index "prior distribution" >}} $p(\theta)$: a probability distribution on $\Theta$ encoding beliefs about $\theta$ *before* observing the dataset.
2. **Sampling model**{{< index "sampling model" >}} $p(y \mid \theta)$: a family of distributions on $\mathcal{Y}$ specifying how probable each dataset $y$ would be if $\theta$ were the true parameter value.
3. **Posterior distribution**{{< index "posterior distribution" >}} $p(\theta \mid y)$: the updated distribution on $\Theta$ *after* observing $y$, obtained from the first two via **Bayes’ rule**{{< index "Bayes’ rule" >}}{{< cite "bayes1763,laplace1995" >}}:

$$
p(\theta \mid y) = \frac{p(y \mid \theta)\,p(\theta)}{\int_{\Theta} p(y \mid \tilde{\theta})\,p(\tilde{\theta})\,d\tilde{\theta}}. \label{eq:ch01-bayes}
$$

{{< remark note="Updating, not dictating" label="rem:ch01-updating" >}}
Bayes’ rule in {{< eqref "eq:ch01-bayes" >}} does *not* tell you what your prior beliefs $p(\theta)$ ought to be; it tells you the unique rationally coherent way your beliefs must *change* in response to new evidence $y$.
{{< /remark >}}

Why use Bayesian methods when exact prior beliefs are hard to elicit? Hoff highlights three distinct justifications that echo throughout the rest of the book:

- **Normative coherence**: Theorems of Cox{{< cite "cox1946,cox1961" >}} and Savage{{< cite "savage1954,savage1972" >}} show that if $p(\theta)$ and $p(y \mid \theta)$ faithfully capture a rational agent’s beliefs, Bayes’ rule is the unique coherent update rule.
- **Useful approximation and sensitivity**: Just as Box and Draper noted that *“all models are wrong, but some are useful”*{{< cite "box1987" >}}, a weakly informative or approximate prior is often adequate when data are moderately informative—and when $n$ is small, **sensitivity analysis**{{< index "sensitivity analysis" >}} explicitly reveals how different priors map to different posteriors.
- **Frequentist regularization in hard problems**: In small samples or high-dimensional models where classical estimators break down, Bayes’ rule automatically generates regularized estimators with strong non-Bayesian (frequentist) risk properties.

## Example 1: Estimating the Probability of a Rare Event {#sec:ch01-rare-event}

Suppose a public health team wants to estimate $\theta \in [0, 1]$, the prevalence of an infectious disease in a small city, from a random sample of $n = 20$ residents. The observed count $Y \in \{0, 1, \dots, 20\}$ follows a binomial sampling model, $Y \mid \theta \sim \operatorname{binomial}(20, \theta)$.

Prior epidemiological studies from comparable cities put typical prevalence between $0.05$ and $0.20$ with mean around $0.10$. For analytical convenience (justified in {{< xref "ch:one-param" "full" >}}), we encode this information with a $\operatorname{beta}(2, 20)$ prior:

$$
\theta \sim \operatorname{beta}(2, 20), \qquad
E[\theta] = \frac{2}{22} \approx 0.091, \qquad
\operatorname{mode}[\theta] = \frac{1}{20} = 0.05, \qquad
\Pr(\theta < 0.10) \approx 0.64. \label{eq:ch01-prior-summary}
$$

Now suppose the survey observes **zero** infected individuals ($Y = 0$). Under beta–binomial conjugacy, the posterior is simply $\theta \mid \{Y = 0\} \sim \operatorname{beta}(2 + 0,\, 20 + 20) = \operatorname{beta}(2, 40)$, yielding:

$$
E[\theta \mid Y = 0] = \frac{2}{42} \approx 0.048, \qquad
\operatorname{mode}[\theta \mid Y = 0] = \frac{1}{40} = 0.025, \qquad
\Pr(\theta < 0.10 \mid Y = 0) \approx 0.926. \label{eq:ch01-post-summary}
$$

{{< fig src="images/bayesian-hoff/fig-ch01-beta-update.svg" type="fullwidth" label="fig:ch01-beta" alt="Three panels showing Binomial(20, theta) likelihoods, Beta(2, 20) prior updated to Beta(2, 40) posterior given y equals 0, and sensitivity contours of Pr(theta < 0.10 | Y = 0) over prior sample size w and prior mean theta_0" short="Rare-event infection rate: likelihood, prior/posterior, and sensitivity" >}}Left: $\operatorname{binomial}(20, \theta)$ sampling distributions for three candidate prevalences. Center: updating $\operatorname{beta}(2, 20)$ to $\operatorname{beta}(2, 40)$ after observing $Y = 0$ shifts probability mass left and sharpens the peak. Right: sensitivity contours of $\Pr(\theta < 0.10 \mid Y = 0)$ across prior mean $\theta_0$ and prior sample size $w = a + b$.{{< /fig >}}

### Shrinkage as a Weighted Average and Prior Sensitivity {#sec:ch01-weighted-average}

Writing $\theta_0 = a/(a+b)$ for the prior mean and $w = a + b$ for the **prior sample size**{{< index "prior sample size" >}}, the posterior expectation for any observed count $y$ decomposes cleanly into a convex combination of the sample mean $\bar{y} = y/n$ and the prior guess $\theta_0$:

$$
E[\theta \mid Y = y] = \frac{a + y}{a + b + n}
= \frac{n}{n + w}\,\bar{y} + \frac{w}{n + w}\,\theta_0. \label{eq:ch01-shrinkage}
$$

This single formula {{< eqref "eq:ch01-shrinkage" >}} recurs in one guise or another throughout the entire textbook:{{< sidenote >}}In {{< xref "ch:normal" "full" >}} we prove that for the normal mean, this shrinkage estimator achieves strictly lower frequentist Mean Squared Error than $\bar{y}$ whenever the prior guess $\theta_0$ lies within a surprisingly wide neighborhood of the truth.{{< /sidenote >}}
- When $n \gg w$, the data weight $n/(n+w) \to 1$ and the prior washes out.
- When $n$ is small, $\bar{y}$ is noisy (or degenerate, as when $y = 0$), and borrowing weight $w$ from $\theta_0$ stabilizes estimation.
- Conversely, a *strongly miscalibrated* prior with large $w$ can dominate small-sample data—which is why checking prior sensitivity is essential:

| Prior $p(\theta)$ | Prior Mean $\theta_0$ | Prior Weight $w$ | Posterior ($n = 20, y = 0$) | $E[\theta \mid Y = 0]$ | $\Pr(\theta < 0.10 \mid Y = 0)$ |
|:------------------|:---------------------|:-----------------|:----------------------------|:-----------------------|:-------------------------------|
| $\operatorname{beta}(1, 1)$ (uniform) | $0.500$ | $2$ | $\operatorname{beta}(1, 21)$ | $0.045$ | $0.891$ |
| $\operatorname{beta}(2, 20)$ (epidemiological) | $0.091$ | $22$ | $\operatorname{beta}(2, 40)$ | $0.048$ | $0.926$ |
| $\operatorname{beta}(10, 10)$ (strong, miscalibrated) | $0.500$ | $20$ | $\operatorname{beta}(10, 30)$ | $0.250$ | $0.004$ |
{#tab:ch01-sensitivity caption="Prior sensitivity when n = 20 and y = 0: a diffuse prior and a well-calibrated epidemiological prior agree closely, whereas a strongly miscalibrated prior with w = n = 20 pulls the posterior away from the data." short="Prior sensitivity for n = 20, y = 0"}

### Why Classical Intervals Fail at $Y = 0$ {#sec:ch01-wald}

The standard asymptotic 95% **Wald confidence interval**{{< index "Wald interval" >}} $\bar{y} \pm 1.96\sqrt{\bar{y}(1-\bar{y})/n}$ collapses to the single point $[0, 0]$ when $y = 0$, absurdly claiming near-certainty that nobody in the city is infected. Even across all possible outcomes $Y \sim \operatorname{binomial}(20, \theta)$, its exact frequentist coverage at $n = 20$ is severely erratic near the boundary: $0.639$ at $\theta = 0.05$, $0.876$ at $\theta = 0.10$, and $0.921$ at $\theta = 0.20$.{{< cite "brown2001" >}}

The **Agresti–Coull adjusted Wald interval**{{< cite "agresti1998" >}} repairs this by adding $z_{0.975}^2/2 \approx 1.92$ pseudo-successes and pseudo-failures (rounded to $2$ each in the popular “plus-four” rule), replacing $\bar{y}$ with

$$
\hat{\theta} = \frac{n}{n+4}\,\bar{y} + \frac{4}{n+4}\cdot\frac{1}{2}, \label{eq:ch01-agresti}
$$

which achieves exact coverage $0.984$ at $\theta = 0.05$, $0.957$ at $\theta = 0.10$, and $0.956$ at $\theta = 0.20$ for $n = 20$. Though motivated purely by frequentist coverage, the plus-four point estimate {{< eqref "eq:ch01-agresti" >}} is algebraically *identical* to the Bayes posterior mean under a weakly informative $\operatorname{beta}(2, 2)$ prior!

## Example 2: High-Dimensional Predictive Modeling {#sec:ch01-prediction}

Hoff’s second motivating example previews {{< xref "ch:regression" "full" >}}: predicting diabetes progression $Y_i$ from $p = 64$ baseline predictors (10 main effects, 45 pairwise interactions, 9 quadratics) using $n = 342$ training patients and evaluating on $100$ held-out test patients:

$$
Y_i = \beta_1 x_{i,1} + \beta_2 x_{i,2} + \dots + \beta_{64} x_{i,64} + \sigma \epsilon_i. \label{eq:ch01-diabetes}
$$

Specifying a full 65-dimensional subjective prior is practically impossible. Instead, we encode one structural belief—**sparsity**{{< index "sparsity" >}}: many of the 64 coefficients are probably zero—by giving each $\beta_j$ a 50% prior point mass at zero (a spike-and-slab prior).{{< sidenote >}}Note a subtlety we revisit in {{< xref "ch:regression" "full" >}}: independent $\Pr(\beta_j \neq 0) = 1/2$ across $p = 64$ predictors actually induces a $\operatorname{binomial}(64, 1/2)$ prior on model size centered at 32 active predictors. True multiplicity-adjusting sparsity places a hierarchical $\operatorname{beta}(1, 1)$ prior on the inclusion probability itself, inducing a uniform prior over model size{{< cite "scott2010" >}}. **Beyond Hoff (2009).** That analysis of multiplicity appeared in 2010 and is not in Hoff’s book.{{< /sidenote >}} Comparing test-set mean squared prediction error on the 100 held-out patients demonstrates the practical power of Bayesian regularization:

| Method | Structural Idea | Diabetes Test MSE |
|:-------|:----------------|:------------------|
| Ordinary Least Squares ($\hat{\beta}_{\text{ols}}$) | Minimizes $\operatorname{SSR}(\beta) = \sum_{i=1}^n (y_i - \mathbf{x}_i^T \beta)^2$ with all 64 predictors | $0.67$ |
| Bayesian Model Averaging ($\hat{\beta}_{\text{Bayes}} = E[\beta \mid y, X]$) | Point mass at $\beta_j = 0$; averages over high-probability sparse models | $0.45$ |
| Lasso ($\hat{\beta}_{\text{lasso}}$){{< cite "tibshirani1996" >}} | Minimizes $\operatorname{SSR}(\beta) + \lambda \sum_{j=1}^p \lvert \beta_j \rvert$; equivalent to posterior **mode** under i.i.d. Laplace (double-exponential) priors on $\beta_j$ | Sparse MAP shrinkage (not reported in Hoff) |
{#tab:ch01-diabetes caption="Why structural priors matter in high dimensions: comparing OLS, Bayesian model averaging, and Lasso on the 64-predictor diabetes task." short="High-dimensional regression comparison"}

## Key Takeaways & Python Check {#sec:ch01-takeaways}

- **Prior + Likelihood $\to$ Posterior**: Bayes’ rule {{< eqref "eq:ch01-bayes" >}} converts prior uncertainty and a sampling model into a complete posterior distribution over $\theta$.
- **Shrinkage protects small samples**: Posterior means naturally interpolate between $\bar{y}$ and $\theta_0$ via {{< eqref "eq:ch01-shrinkage" >}}, and sensitivity analysis ({{< xref "tab:ch01-sensitivity" "full" >}}) checks how much conclusions depend on the prior.
- **Structural priors prevent overfitting**: Even coarse structural priors (such as sparsity) yield substantial out-of-sample gains over unregularized maximum likelihood / OLS.

```python
import numpy as np
from scipy import stats

# Compare three Beta(a, b) priors updated with n=20, y=0
n, y = 20, 0
for name, a, b in [("Uniform", 1, 1), ("Epidemiological", 2, 20), ("Strong wrong", 10, 10)]:
    ap, bp = a + y, b + n - y
    print(f"{name:16s} -> Beta({ap:2d},{bp:2d}) | "
          f"mean={ap/(ap+bp):.3f} | Pr(theta<0.10)={stats.beta.cdf(0.10, ap, bp):.3f}")

# Exact frequentist coverage at n=20 for Wald vs. plus-four intervals
k = np.arange(n + 1)
for theta in [0.05, 0.10, 0.20]:
    pmf = stats.binom.pmf(k, n, theta)
    p_w = k / n
    se_w = np.sqrt(p_w * (1 - p_w) / n)
    cov_w = pmf[(p_w - 1.96 * se_w <= theta) & (theta <= p_w + 1.96 * se_w)].sum()
    p_ac = (k + 2) / (n + 4)
    se_ac = np.sqrt(p_ac * (1 - p_ac) / (n + 4))
    cov_ac = pmf[(p_ac - 1.96 * se_ac <= theta) & (theta <= p_ac + 1.96 * se_ac)].sum()
    print(f"theta={theta:.2f}: Wald coverage={cov_w:.3f}, Plus-four coverage={cov_ac:.3f}")
```

## Modern Developments: Robust Priors and Prior Sensitivity {#sec:ch01-modern}

### Robust Mixture Priors {#sec:ch01-robust-map}

A **robust mixture prior**{{< index "robust mixture prior" >}} keeps the benefit of an informative prior while letting the data overrule it.{{< sidenote >}}**Beyond Hoff (2009).** This material is not in Hoff’s book; it follows the robust meta-analytic-predictive (MAP) priors of Schmidli et al.{{< cite "schmidli2014" >}}, which modernize shrinkage toward a single beta prior. Here MAP stands for “meta-analytic-predictive”, not “maximum a posteriori”.{{< /sidenote >}} The fixed data weight $n/(n+w)$ in {{< eqref "eq:ch01-shrinkage" >}} is the same however badly $\bar{y}$ disagrees with $\theta_0$. Instead, let $p_1 = \operatorname{beta}(a, b)$ be the informative prior, $p_0 = \operatorname{beta}(1, 1)$ a vague one, and $\omega$ the prior probability that the informative component is relevant:

$$
\begin{gathered}
p(\theta) = \omega\,p_1(\theta) + (1 - \omega)\,p_0(\theta), \qquad
p(\theta \mid y) = \omega^{*} p_1(\theta \mid y) + (1 - \omega^{*})\,p_0(\theta \mid y), \\
\omega^{*} = \frac{\omega\,m_1(y)}{\omega\,m_1(y) + (1 - \omega)\,m_0(y)}, \qquad
m_j(y) = \int_0^1 p(y \mid \theta)\,p_j(\theta)\,d\theta.
\end{gathered} \label{eq:ch01-robust}
$$

*Why it holds*: $p(y \mid \theta)\,p_j(\theta) = m_j(y)\,p_j(\theta \mid y)$ for each component, so Bayes’ rule {{< eqref "eq:ch01-bayes" >}} reweights the components by how well each predicted $y$. Take $n = 20$ and $\omega = 0.8$. With $\operatorname{beta}(2, 20)$ as $p_1$, observing $y = 0$ raises the weight to $\omega^{*} = 0.956$ (posterior mean $0.0475$), whereas a conflicting $y = 10$ drops it to $0.064$ (mean $0.486$, against $0.286$ for the informative prior alone). With the miscalibrated $\operatorname{beta}(10, 10)$ and $y = 0$, $\omega^{*} = 0.012$ and the mean is $0.048$, not the $0.250$ of {{< xref "tab:ch01-sensitivity" "full" >}}.

**When to use it.** Prefer the mixture when the prior summarizes *historical* data that may not be exchangeable with the new sample. Hoff’s single beta suffices when conflict is implausible or $n \gg w$. Since $\omega$ is itself a prior choice, report how results vary with it.

### Power-Scaling Sensitivity Analysis {#sec:ch01-power-scaling}

**Power-scaling**{{< index "power-scaling" >}} turns the prior-by-prior comparison of {{< xref "tab:ch01-sensitivity" "full" >}} into a local diagnostic that needs no list of alternative priors.{{< sidenote >}}**Beyond Hoff (2009).** This material is not in Hoff’s book; it follows Kallioinen et al.{{< cite "kallioinen2024" >}} and modernizes sensitivity analysis by hand-picked alternative priors.{{< /sidenote >}} Raise either ingredient of {{< eqref "eq:ch01-bayes" >}} to a power $\alpha$ near $1$:

$$
p_{\alpha}^{\text{prior}}(\theta \mid y) \propto p(y \mid \theta)\,p(\theta)^{\alpha}, \qquad
p_{\alpha}^{\text{lik}}(\theta \mid y) \propto p(y \mid \theta)^{\alpha}\,p(\theta). \label{eq:ch01-power-scale}
$$

*Why it works*: $p_{\alpha}^{\text{prior}}(\theta \mid y)/p(\theta \mid y) \propto p(\theta)^{\alpha - 1}$, so reweighting one set of posterior draws explores the whole family without refitting. The discrepancy from the original posterior is measured by the cumulative Jensen–Shannon distance, which compares distribution functions. Sensitivity to *both* prior and likelihood suggests **prior–data conflict**; sensitivity to the prior but *not* to the likelihood suggests a likelihood that is non-informative relative to the prior.

In the beta–binomial model the families are $\operatorname{beta}\bigl(\alpha(a-1) + 1 + y,\, \alpha(b-1) + 1 + n - y\bigr)$ and $\operatorname{beta}\bigl(a + \alpha y,\, b + \alpha(n - y)\bigr)$. For $n = 20$, $y = 0$ and $\alpha = \tfrac12, 1, 2$, the $\operatorname{beta}(2, 20)$ posterior mean barely moves under prior scaling ($0.047$, $0.048$, $0.048$). For $\operatorname{beta}(10, 10)$ it moves *up* under prior scaling ($0.177$, $0.250$, $0.328$) and *down* under likelihood scaling ($0.333$, $0.250$, $0.167$): the signature of conflict.

**When to use it.** Use it as a routine first screen, especially with many parameters. Hoff’s explicit table and contours remain preferable when a specific alternative prior matters, because power-scaling explores only one direction and is blind to a flat prior, for which $p(\theta)^{\alpha}$ never changes.

### Computational & Symbolic Check {#sec:ch01-modern-check}

The Python block evaluates the weights of {{< eqref "eq:ch01-robust" >}} and both power-scaled families of {{< eqref "eq:ch01-power-scale" >}} at $n = 20$, $\omega = 0.8$; the Wolfram sequence repeats them from the symbolic marginals.{{< sidenote >}}**Beyond Hoff (2009).** This computational check and its Wolfram symbolic counterpart below verify the modern methods in this section and are not in Hoff’s book.{{< /sidenote >}}

```python
import numpy as np
from scipy import stats
from scipy.special import betaln

n, om = 20, 0.8
for a, b, y in [(2, 20, 0), (2, 20, 10), (10, 10, 0)]:
    m1 = np.exp(betaln(a + y, b + n - y) - betaln(a, b))
    m0 = np.exp(betaln(1 + y, 1 + n - y))
    ws = om * m1 / (om * m1 + (1 - om) * m0)
    mean = ws * (a + y) / (a + b + n) + (1 - ws) * (1 + y) / (2 + n)
    print(f"Beta({a},{b}), y={y}: w*={ws:.4f}, mean={mean:.4f}")

for a, b in [(2, 20), (10, 10)]:  # power-scaling at y = 0
    for al in (0.5, 1, 2):
        pr = stats.beta.cdf(0.1, al * (a - 1) + 1, al * (b - 1) + 1 + n)
        lik = stats.beta.cdf(0.1, a, b + al * n)
        print(f"Beta({a},{b}), alpha={al}: prior-scaled {pr:.4f}, lik-scaled {lik:.4f}")
```

{{< marginnote >}}Write the marginal likelihood $m_j(y)$ of a $\operatorname{beta}(a, b)$ component, up to the common binomial coefficient.{{< /marginnote >}}

```js
// Chapter 1 (modern): robust mixture weights & power-scaled tail probabilities
const mj = await show`Beta[a + y, b + n - y] / Beta[a, b]`
```

$$
m_j(y) \propto \frac{B(a+y,b+n-y)}{B(a,b)}
$$

{{< marginnote >}}Confirm that $m_j$ is the integral of the likelihood kernel against the $\operatorname{beta}(a, b)$ density.{{< /marginnote >}}

```js
await show`Assuming[a > 0 && b > 0 && y >= 0 && n >= y, FullSimplify[
  Integrate[th^(a + y - 1)*(1 - th)^(b + n - y - 1)/Beta[a, b], {th, 0, 1}] / (${mj})]]`
```

$$
\frac{1}{m_j(y)}\int_0^1 \theta^y(1-\theta)^{n-y}\,p_j(\theta)\,d\theta = 1
$$

{{< marginnote >}}Write the posterior weight $\omega^*$ of the informative component against the uniform one, $m_0(y) = B(1 + y, 1 + n - y)$.{{< /marginnote >}}

```js
const wStar = await show`om*(${mj}) / (om*(${mj}) + (1 - om)*Beta[1 + y, 1 + n - y])`
```

$$
\omega^{*} = \frac{\omega\,\dfrac{B(a+y,\,b+n-y)}{B(a,b)}}{\omega\,\dfrac{B(a+y,\,b+n-y)}{B(a,b)} + (1-\omega)\,B(1+y,\,1+n-y)}
$$

{{< marginnote >}}Write the mixture posterior mean: the $\omega^*$-weighted average of the two component posterior means.{{< /marginnote >}}

```js
const mixMean = await show`(${wStar})*(a + y)/(a + b + n) + (1 - (${wStar}))*(1 + y)/(2 + n)`
```

$$
\mathbb{E}[\theta \mid y] = \omega^{*}\,\frac{a+y}{a+b+n} + \bigl(1-\omega^{*}\bigr)\,\frac{1+y}{2+n}
$$

{{< marginnote >}}Evaluate $(\omega^*, E[\theta \mid y])$ for $(a, b, y) = (2, 20, 0)$, $(2, 20, 10)$, $(10, 10, 0)$.{{< /marginnote >}}

```js
await show`N[Table[{${wStar}, ${mixMean}} /. {n -> 20, om -> 4/5, a -> p[[1]], b -> p[[2]], y -> p[[3]]},
  {p, {{2, 20, 0}, {2, 20, 10}, {10, 10, 0}}}]]`
```

$$
\begin{aligned}
&\bigl(\omega^{*},\; \mathbb{E}[\theta \mid y]\bigr)_{(2,20,0),\,(2,20,10),\,(10,10,0)} \\
&= \left( \begin{array}{cc} 0.95558 & 0.0475229 \\ 0.0643441 & 0.486212 \\ 0.0120586 & 0.0479211 \\ \end{array} \right)
\end{aligned}
$$

{{< marginnote >}}Tabulate the exact prior-scaled posterior means: nearly flat for $\operatorname{beta}(2, 20)$, rising for $\operatorname{beta}(10, 10)$.{{< /marginnote >}}

```js
await show`Table[(al*(p[[1]] - 1) + 1)/(al*(p[[1]] + p[[2]] - 2) + 2 + 20), {p, {{2, 20}, {10, 10}}}, {al, {1/2, 1, 2}}]`
```

$$
\mathbb{E}_{\alpha}^{\text{prior}}[\theta \mid y=0]\big|_{\alpha = 1/2,\,1,\,2} = \left( \begin{array}{ccc} \frac{3}{64} & \frac{1}{21} & \frac{3}{62} \\ \frac{11}{62} & \frac{1}{4} & \frac{19}{58} \\ \end{array} \right)
$$

{{< marginnote >}}Evaluate the likelihood-scaled $\Pr(\theta < 0.1 \mid y = 0)$ for $\alpha = \tfrac12, 1, 2$ under each prior.{{< /marginnote >}}

```js
await show`N[Table[BetaRegularized[1/10, p[[1]], p[[2]] + 20*al], {p, {{2, 20}, {10, 10}}}, {al, {1/2, 1, 2}}]]`
```

$$
\begin{aligned}
&\Pr\nolimits_{\alpha}^{\text{lik}}(\theta < 0.1 \mid y=0)\big|_{\alpha = 1/2,\,1,\,2} \\
&= \left( \begin{array}{ccc} 0.830435 & 0.926096 & 0.987421 \\ 0.000332596 & 0.00416472 & 0.0665894 \\ \end{array} \right)
\end{aligned}
$$

## Symbolic Check in Wolfram Language {#sec:ch01-wolfram}

Run the following `wolfram-ws-bridge` JavaScript-mode sequence (`W`, `wl`, `show`, `toJS`) to derive the Beta–Binomial normalizer $Z$, posterior mean, posterior variance, mode (for $a+y > 1$, $b+n-y > 1$), and symbolic tail probability $\Pr(\theta < c \mid Y = y)$ completely symbolically, then instantiate the symbolic formulas at $(n, y, c) = (20, 0, 1/10)$ to cross-check the Python output above.

{{< marginnote >}}Integrate the unnormalized Beta–Binomial kernel over $\theta \in (0, 1)$ to obtain the normalizing constant $Z$.{{< /marginnote >}}

```js
// Chapter 1: Symbolic Beta-Binomial posterior, variance, CDF, and numeric check
const { Times, Power, Plus, Subtract, Minus, th, a, b, n, y } = W
const kernel = Times(
  Power(th, Plus(a, y, -1)),
  Power(Subtract(1, th), Plus(b, n, Minus(y), -1))
)
const Z = await show`Assuming[a > 0 && b > 0 && y >= 0 && n >= y,
  FullSimplify[Integrate[${kernel}, {th, 0, 1}]]]`
```

$$
\begin{aligned}
&\int_0^1 \theta^{a+y-1}(1-\theta)^{b+n-y-1}\,d\theta \\
&= \frac{\Gamma (b+n-y) \Gamma (a+y)}{\Gamma (a+b+n)}
\end{aligned}
$$

{{< marginnote >}}Compute the symbolic posterior mean $E[\theta \mid y]$ by integrating $\theta$ against the normalized posterior.{{< /marginnote >}}

```js
const mean = await show`Assuming[a > 0 && b > 0 && y >= 0 && n >= y,
  FullSimplify[Integrate[th * ${kernel}, {th, 0, 1}] / ${Z}]]`
```

$$
\mathbb{E}[\theta \mid y] = \frac{a+y}{a+b+n}
$$

{{< marginnote >}}Compute the symbolic posterior variance $\operatorname{Var}(\theta \mid y) = E[\theta^2 \mid y] - (E[\theta \mid y])^2$.{{< /marginnote >}}

```js
const postVar = await show`Assuming[a > 0 && b > 0 && y >= 0 && n >= y,
  FullSimplify[Integrate[th^2 * ${kernel}, {th, 0, 1}] / ${Z} - (${mean})^2]]`
```

$$
\operatorname{Var}(\theta \mid y) = \frac{(b+n-y) (a+y)}{(a+b+n)^2 (1+a+b+n)}
$$

{{< marginnote >}}Differentiate the log-kernel to find the closed-form posterior mode $\hat{\theta}_{\text{MAP}}$.{{< /marginnote >}}

```js
// Posterior mode (valid when a + y > 1 and b + n - y > 1) and symbolic CDF Pr(th < c | y)
await show`FullSimplify[th /. First[Solve[D[Log[${kernel}], th] == 0, th]]]`
```

$$
\hat{\theta}_{\text{MAP}} = \frac{-1+a+y}{-2+a+b+n}
$$

{{< marginnote >}}Integrate the Beta density up to $c$ to express $\Pr(\theta < c \mid y)$ via the incomplete Beta function.{{< /marginnote >}}

```js
const cdfSym = await show`Assuming[al > 0 && be > 0 && 0 < c < 1,
  FullSimplify[Integrate[th^(al - 1)*(1 - th)^(be - 1), {th, 0, c}] / Beta[al, be]]] /. {al -> a + y, be -> b + n - y}`
```

$$
\Pr(\theta < c \mid y) = \frac{B_c(a+y,b+n-y)}{B(a+y,b+n-y)}
$$

{{< marginnote >}}Verify that the posterior mean is a precision-weighted average of the sample proportion and prior mean.{{< /marginnote >}}

```js
await show`Simplify[${mean} - (n/(n + w)*(y/n) + w/(n + w)*(a/w)) /. w -> a + b]`
```

$$
\mathbb{E}[\theta \mid y] - \left(\frac{n}{n+w}\frac{y}{n} + \frac{w}{n+w}\frac{a}{w}\right) = 0
$$

{{< marginnote >}}Instantiate the posterior mean and $\Pr(\theta < 0.10 \mid y=0)$ across the uniform, epidemiological, and strong-wrong priors.{{< /marginnote >}}

```js
// Instantiate symbolic mean & CDF at n = 20, y = 0, c = 1/10 for Uniform (1,1), Epi (2,20), Strong wrong (10,10)
await show`N[Table[{${mean}, ${cdfSym}} /. {a -> p[[1]], b -> p[[2]], n -> 20, y -> 0, c -> 1/10}, {p, {{1, 1}, {2, 20}, {10, 10}}}]]`
```

$$
\begin{aligned}
&\bigl(\mathbb{E}[\theta \mid y=0],\; \Pr(\theta < 0.10 \mid y=0)\bigr)_{\text{Unif, Epi, Strong}} \\
&= \left( \begin{array}{cc} 0.0454545 & 0.890581 \\ 0.047619 & 0.926096 \\ 0.25 & 0.00416472 \\ \end{array} \right)
\end{aligned}
$$

## Exercises {#sec:ch01-exercises}

{{< thm kind="exercise" label="ex:ch01-prior-dominance" >}}
In the rare-event survey ($n = 20$, $y = 0$), suppose a skeptical colleague insists on a prior centered at $\theta_0 = 0.20$. How large can their prior sample size $w = a + b$ be before $\Pr(\theta < 0.10 \mid Y = 0)$ drops below $0.50$? Verify your answer numerically in Python using `scipy.stats.beta.cdf`.
{{< /thm >}}

{{< details summary="Symbolic Solution & Instantiation" >}}

{{< marginnote >}}Write $\Pr(\theta < c \mid y = 0)$ symbolically as a regularized incomplete Beta ratio in prior weight $w$.{{< /marginnote >}}

```js
// Ex 1.1: Prior dominance threshold w* where Pr(theta < c | y = 0) == 1/2
const cdf = await show`Beta[c, w*th0, w*(1 - th0) + n] / Beta[w*th0, w*(1 - th0) + n]`
```

$$
\begin{aligned}
&\Pr(\theta < c \mid y = 0) \\
&= \frac{B_c(\theta_0 w,n+(1-\theta_0) w)}{B(\theta_0 w,n+(1-\theta_0) w)}
\end{aligned}
$$

{{< marginnote >}}Solve numerically for the critical prior sample size $w^*$ where $\Pr(\theta < 0.10 \mid y = 0) = 1/2$.{{< /marginnote >}}

```js
await show`w /. FindRoot[(${cdf} /. {c -> 1/10, th0 -> 1/5, n -> 20}) == 1/2, {w, 15, 35}]`
```

$$
w^*\big|_{c=0.1,\;\theta_0=0.2,\;n=20} = 22.6228
$$

{{< marginnote >}}Evaluate $\Pr(\theta < 0.10 \mid y = 0)$ at the straddling integers $w = 22$ and $w = 23$.{{< /marginnote >}}

```js
await show`N[{${cdf} /. {c -> 1/10, th0 -> 1/5, n -> 20, w -> 22}, ${cdf} /. {c -> 1/10, th0 -> 1/5, n -> 20, w -> 23}}]`
```

$$
\begin{aligned}
&\bigl(\Pr(\theta < 0.1 \mid y=0, w=22),\;\Pr(\theta < 0.1 \mid y=0, w=23)\bigr) \\
&= \{0.512971,0.492266\}
\end{aligned}
$$

{{< /details >}}

{{< thm kind="exercise" label="ex:ch01-laplace-lasso" >}}
Show that if $Y \mid \beta, \sigma^2 \sim \mathcal{N}_n(X\beta, \sigma^2 I_n)$ and $\beta_1, \dots, \beta_p \stackrel{\text{i.i.d.}}{\sim} \operatorname{Laplace}(0, b)$ with density $p(\beta_j) = \frac{1}{2b}\exp(-\lvert \beta_j \rvert / b)$, then maximizing $\log p(\beta \mid y, X, \sigma^2)$ is equivalent to minimizing $\operatorname{SSR}(\beta) + \lambda \sum_{j=1}^p \lvert \beta_j \rvert$. Express $\lambda$ in terms of $\sigma^2$ and $b$.
{{< /thm >}}

{{< details summary="Symbolic Solution & Instantiation" >}}

{{< marginnote >}}Multiply the negative log-posterior under a Laplace prior by $2\sigma^2$ to reveal the $\ell_1$-penalized objective.{{< /marginnote >}}

```js
// Ex 1.2: Equivalence of Laplace MAP and Lasso penalty lambda = 2*sigma^2 / b
const obj = await show`Expand[-2*s2 * (-ssr/(2*s2) - l1/b)]`
```

$$
\begin{aligned}
&-2\sigma^2 \log p(\beta \mid y, \sigma^2, b) + \text{const} \\
&= \frac{2 \|\beta\|_1 \sigma^2}{b}+\operatorname{SSR}
\end{aligned}
$$

{{< marginnote >}}Extract the coefficient of $\|\beta\|_1$ to identify the exact Lasso penalty $\lambda = 2\sigma^2/b$.{{< /marginnote >}}

```js
const lam = await show`Coefficient[${obj}, l1]`
```

$$
\lambda = \frac{2 \sigma^2}{b}
$$

{{< marginnote >}}Instantiate $\lambda$ at $\sigma^2 = 1$ and Laplace scale $b = 1/2$.{{< /marginnote >}}

```js
await show`${lam} /. {s2 -> 1, b -> 1/2}`
```

$$
\lambda\big|_{\sigma^2=1,\; b=1/2} = 4
$$

{{< /details >}}

{{< thm kind="exercise" label="ex:ch01-wald-coverage" >}}
Plot the exact frequentist coverage of the 95% Wald interval and the 95% plus-four interval as functions of $\theta \in (0, 1)$ for $n = 20$ and $n = 100$. Why does the coverage curve oscillate sharply even for $n = 100$?
{{< /thm >}}

{{< details summary="Symbolic Solution & Instantiation" >}}

{{< marginnote >}}Express the exact finite-sample Binomial coverage probability as a sum over accepted counts $k$.{{< /marginnote >}}

```js
// Ex 1.3: Exact Binomial coverage sum (Wald vs. plus-four) & lattice oscillation
await show`Sum[Binomial[n, k]*th^k*(1 - th)^(n - k)*Boole[Abs[pHat[k] - th] <= z*se[k]], {k, 0, n}]`
```

$$
\begin{aligned}
&\operatorname{Covg}_n(\theta) \\
&= \sum_{k=0}^n (1-\theta)^{-k+n} \theta^k \binom{n}{k} \mathbf{1} [| -\theta +\hat{p} (k)| \leq z \operatorname{se} (k)]
\end{aligned}
$$

{{< marginnote >}}Evaluate exact coverage at $\theta = 0.10$ for $n \in \{20, 100\}$, comparing Wald versus plus-four intervals.{{< /marginnote >}}

```js
await show`N[Table[Sum[Binomial[nVal, k]*(1/10)^k*(9/10)^(nVal - k)*Boole[
  Abs[(k + c0)/(nVal + 2*c0) - 1/10] <= (196/100)*Sqrt[((k + c0)/(nVal + 2*c0))*(1 - (k + c0)/(nVal + 2*c0))/(nVal + 2*c0)]],
  {k, 0, nVal}], {nVal, {20, 100}}, {c0, {0, 2}}]]`
```

$$
\begin{aligned}
&\bigl(\operatorname{Covg}_{n,\text{Wald}}(0.1),\; \operatorname{Covg}_{n,\text{plus-4}}(0.1)\bigr)_{n \in \{20,\,100\}} \\
&= \left( \begin{array}{cc} 0.876037 & 0.956826 \\ 0.932416 & 0.952273 \\ \end{array} \right)
\end{aligned}
$$

{{< /details >}}
