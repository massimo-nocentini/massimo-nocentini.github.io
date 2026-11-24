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

Specifying a full 65-dimensional subjective prior is practically impossible. Instead, we encode one structural belief—**sparsity**{{< index "sparsity" >}}: many of the 64 coefficients are probably zero—by giving each $\beta_j$ a 50% prior point mass at zero (a spike-and-slab prior).{{< sidenote >}}Note a subtlety we revisit in {{< xref "ch:regression" "full" >}}: independent $\Pr(\beta_j \neq 0) = 1/2$ across $p = 64$ predictors actually induces a $\operatorname{binomial}(64, 1/2)$ prior on model size centered at 32 active predictors. True multiplicity-adjusting sparsity places a hierarchical $\operatorname{beta}(1, 1)$ prior on the inclusion probability itself, inducing a uniform prior over model size{{< cite "scott2010" >}}.{{< /sidenote >}} Comparing test-set mean squared prediction error on the 100 held-out patients demonstrates the practical power of Bayesian regularization:

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

## Exercises {#sec:ch01-exercises}

{{< thm kind="exercise" label="ex:ch01-prior-dominance" >}}
In the rare-event survey ($n = 20$, $y = 0$), suppose a skeptical colleague insists on a prior centered at $\theta_0 = 0.20$. How large can their prior sample size $w = a + b$ be before $\Pr(\theta < 0.10 \mid Y = 0)$ drops below $0.50$? Verify your answer numerically in Python using `scipy.stats.beta.cdf`.
{{< /thm >}}

{{< thm kind="exercise" label="ex:ch01-laplace-lasso" >}}
Show that if $Y \mid \beta, \sigma^2 \sim \mathcal{N}_n(X\beta, \sigma^2 I_n)$ and $\beta_1, \dots, \beta_p \stackrel{\text{i.i.d.}}{\sim} \operatorname{Laplace}(0, b)$ with density $p(\beta_j) = \frac{1}{2b}\exp(-\lvert \beta_j \rvert / b)$, then maximizing $\log p(\beta \mid y, X, \sigma^2)$ is equivalent to minimizing $\operatorname{SSR}(\beta) + \lambda \sum_{j=1}^p \lvert \beta_j \rvert$. Express $\lambda$ in terms of $\sigma^2$ and $b$.
{{< /thm >}}

{{< thm kind="exercise" label="ex:ch01-wald-coverage" >}}
Plot the exact frequentist coverage of the 95% Wald interval and the 95% plus-four interval as functions of $\theta \in (0, 1)$ for $n = 20$ and $n = 100$. Why does the coverage curve oscillate sharply even for $n = 100$?
{{< /thm >}}
