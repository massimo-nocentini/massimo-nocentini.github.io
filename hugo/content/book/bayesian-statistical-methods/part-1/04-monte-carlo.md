---
title: "Monte Carlo Approximation"
linkTitle: "Monte Carlo"
weight: 40
label: "ch:mc"
---

{{< newthought "Closed-form formulas" />}} only carry us so far. Even with conjugate posteriors, computing $\Pr(\theta_1 > \theta_2 \mid y)$, finding the posterior distribution of a nonlinear transformation such as the log-odds $\gamma = \log\frac{\theta}{1-\theta}$ or ratio $\theta_1 / \theta_2$, or evaluating a goodness-of-fit test statistic quickly leads to awkward multidimensional integrals or doubly infinite sums. **Monte Carlo approximation**{{< index "Monte Carlo approximation" >}} replaces analytical integration with a single universal recipe: draw random samples from the posterior and compute empirical averages.{{< cite "hoff2009,robert2004" >}}

## The Monte Carlo Method and Standard Error {#sec:ch04-mc}

Suppose we can draw $S$ independent samples directly from the posterior distribution:

$$
\theta^{(1)}, \theta^{(2)}, \dots, \theta^{(S)} \stackrel{\text{i.i.d.}}{\sim} p(\theta \mid y_1, \dots, y_n). \label{eq:ch04-iid}
$$

By the **Strong Law of Large Numbers**, for any function $g(\theta)$ with $E[\lvert g(\theta) \rvert \mid y] < \infty$,

$$
\hat{g}_S = \frac{1}{S}\sum_{s=1}^S g\bigl(\theta^{(s)}\bigr)
\;\xrightarrow{S \to \infty}\;
E\bigl[g(\theta) \mid y_1, \dots, y_n\bigr]
= \int_{\Theta} g(\theta)\,p(\theta \mid y_1, \dots, y_n)\,d\theta. \label{eq:ch04-lln}
$$

Setting $g(\theta) = \theta$, $g(\theta) = \mathbf{1}(\theta \le c)$, or taking empirical quantiles of $\{\theta^{(1)}, \dots, \theta^{(S)}\}$ immediately approximates posterior means, variances, tail probabilities, medians, and credible intervals to arbitrary precision.

How large must $S$ be? Whenever $\operatorname{Var}[g(\theta) \mid y] < \infty$,{{< sidenote >}}Always check that the target moment is finite! For example, if $\theta_2 \mid y_2 \sim \operatorname{gamma}(a_2, b_2)$, then $E[\theta_1/\theta_2 \mid y]$ requires $a_2 > 1$ and $\operatorname{Var}[\theta_1/\theta_2 \mid y] < \infty$ requires $a_2 > 2$. When variance is infinite, sample averages still converge by the LLN (if $a_2 > 1$), but the classical CLT standard error fails.{{< /sidenote >}} the **Central Limit Theorem** implies that $\hat{g}_S$ is approximately normal around $E[g(\theta) \mid y]$ with standard error $\sqrt{\operatorname{Var}[g(\theta) \mid y] / S}$. Replacing the unknown variance by the sample variance $\hat{\sigma}_g^2 = \frac{1}{S-1}\sum_{s=1}^S (g(\theta^{(s)}) - \hat{g}_S)^2$ yields the **Monte Carlo standard error (MCSE)**{{< index "Monte Carlo standard error" >}}:

$$
\begin{aligned}
\text{Expectation } \hat{g}_S: &\quad \operatorname{MCSE}(\hat{g}_S) = \frac{\hat{\sigma}_g}{\sqrt{S}}, \\
\text{Probability } \hat{p}_S = \frac{1}{S}\sum_{s=1}^S \mathbf{1}(\theta^{(s)} \in A): &\quad \operatorname{MCSE}(\hat{p}_S) = \sqrt{\frac{\hat{p}_S(1 - \hat{p}_S)}{S}}, \\
\text{$q$-Quantile } \hat{\theta}_{q,S}: &\quad \operatorname{MCSE}(\hat{\theta}_{q,S}) \approx \frac{\sqrt{q(1 - q)}}{\sqrt{S}\,p(\theta_q \mid y)}.
\end{aligned} \label{eq:ch04-mcse}
$$

To guarantee that $\bar{\theta}_S$ lies within tolerance $\epsilon$ of $E[\theta \mid y]$ with roughly 95% probability, we require $2\hat{\sigma}/\sqrt{S} < \epsilon$, i.e., $S > 4\hat{\sigma}^2 / \epsilon^2$. Notice both the $1/\sqrt{S}$ scaling—cutting simulation error in half requires **four times** as many draws—and the $1/p(\theta_q \mid y)$ factor for quantiles: extreme tail quantiles (where density $p(\theta_q \mid y)$ is tiny) require many more draws than the mean or median!

{{< fig src="images/bayesian-hoff/fig-ch04-mc-convergence.svg" type="fullwidth" label="fig:ch04-mc" alt="Three panels showing cumulative Monte Carlo estimates of the mean and tail probability of Gamma(68, 45) converging within a two-MCSE envelope, and a histogram of the posterior predictive check ratio t(Y_rep) with observed value 2.0 in the upper tail (tail probability 0.0051)" short="Monte Carlo convergence and posterior predictive model checking" >}}Left and center: cumulative Monte Carlo estimates of $E[\theta \mid y]$ (with $\pm 2\,\text{MCSE}$ envelope) and $\Pr(\theta < 1.75 \mid y)$ for $\operatorname{gamma}(68, 45)$ converging to the exact analytical values. Right: posterior predictive check of the Poisson model on GSS fertility counts ($S = 50{,}000$ replicates)—only $0.51\%$ of simulated datasets reach the observed ratio $t(y_{\text{obs}}) = \#\{Y=2\}/\#\{Y=1\} = 2.0$.{{< /fig >}}

## Push-Forward Sampling and Multidimensional Comparisons {#sec:ch04-functions}

One of the greatest strengths of sampling-based inference is effortless **push-forward sampling**{{< index "push-forward sampling" >}}: to obtain $S$ exact i.i.d. draws from the posterior of any derived quantity $\gamma = g(\theta)$—without ever computing a Jacobian!—simply apply $g$ to each draw:

1. Draw $\theta^{(s)} \sim p(\theta \mid y)$ for $s = 1, \dots, S$.
2. Compute $\gamma^{(s)} = g(\theta^{(s)})$.

Then $\{\gamma^{(1)}, \dots, \gamma^{(S)}\}$ is an exact i.i.d. sample from the push-forward posterior $p(\gamma \mid y)$. Note why this matters: by **Jensen’s inequality**{{< index "Jensen’s inequality" >}}, $E[g(\theta) \mid y] \neq g(E[\theta \mid y])$ for nonlinear $g$—plugging the posterior mean into $g$ introduces bias, whereas averaging $g(\theta^{(s)})$ estimates $E[g(\theta) \mid y]$ consistently. Two textbook examples illustrate the payoff:

- **Log-odds**{{< index "log-odds" >}}: Given $y = 441$ agreements out of $n = 860$ non-Protestant GSS respondents under a $\operatorname{beta}(1, 1)$ prior, $\theta \mid y \sim \operatorname{beta}(442, 420)$. Transforming draws via $\gamma^{(s)} = \log[\theta^{(s)} / (1 - \theta^{(s)})]$ directly yields the posterior density and credible intervals of the log-odds.
- **Two-group comparisons**: For independent posteriors $\theta_1 \mid y_1 \sim \operatorname{gamma}(219, 112)$ and $\theta_2 \mid y_2 \sim \operatorname{gamma}(68, 45)$, drawing pairs $(\theta_1^{(s)}, \theta_2^{(s)})$ lets us approximate

  $$
  \Pr(\theta_1 > \theta_2 \mid y) \approx \frac{1}{S}\sum_{s=1}^S \mathbf{1}(\theta_1^{(s)} > \theta_2^{(s)}) \approx 0.973
  $$

  (exact value $0.9726$, verified below) and plot the entire posterior of the ratio $\theta_1 / \theta_2$ in three lines of code.

## Ancestral Sampling from Predictive Distributions {#sec:ch04-predictive}

A **predictive distribution**{{< index "predictive distribution" >}} conditions on everything known and integrates out everything unknown:
- **Prior predictive**: $p(\tilde{y}) = \int p(\tilde{y} \mid \theta)\,p(\theta)\,d\theta$ (useful for checking whether a chosen prior implies sensible observables *before* seeing data).
- **Posterior predictive**{{< index "posterior predictive distribution" >}}: $p(\tilde{y} \mid y) = \int p(\tilde{y} \mid \theta)\,p(\theta \mid y)\,d\theta$.

Even when this integral has no closed form, **ancestral (two-stage) sampling** draws exact samples from $p(\tilde{y} \mid y)$:

$$
\text{For } s = 1, \dots, S: \quad
\theta^{(s)} \sim p(\theta \mid y), \qquad
\tilde{y}^{(s)} \sim p(\tilde{y} \mid \theta^{(s)}). \label{eq:ch04-ancestral}
$$

Each pair $(\theta^{(s)}, \tilde{y}^{(s)})$ is a draw from the joint posterior $p(\theta, \tilde{y} \mid y)$, so discarding $\theta^{(s)}$ leaves marginal draws $\tilde{y}^{(s)} \sim p(\tilde{y} \mid y)$. For the GSS birth-rate groups, comparing paired draws $\tilde{y}_1^{(s)} \sim \operatorname{Poisson}(\theta_1^{(s)})$ and $\tilde{y}_2^{(s)} \sim \operatorname{Poisson}(\theta_2^{(s)})$ replaces a doubly infinite negative-binomial sum with a single vectorized comparison, giving $\Pr(\tilde{Y}_1 > \tilde{Y}_2 \mid y) \approx 0.482$.

{{< remark note="Rao–Blackwellization: integrating analytically when you can" label="rem:ch04-rb" >}}
Whenever the conditional expectation $E[\tilde{Y} \mid \theta]$ is known in closed form, averaging $E[\tilde{Y} \mid \theta^{(s)}]$ across draws achieves *strictly smaller* Monte Carlo variance than averaging simulated $\tilde{y}^{(s)}$, because

$$
\operatorname{Var}(E[\tilde{Y} \mid \theta]) = \operatorname{Var}(\tilde{Y}) - E[\operatorname{Var}(\tilde{Y} \mid \theta)] \le \operatorname{Var}(\tilde{Y}).
$$

This variance-reduction principle—**Rao–Blackwellization**{{< index "Rao–Blackwellization" >}}—carries directly into the Gibbs samplers of Part II.
{{< /remark >}}

## Posterior Predictive Model Checking {#sec:ch04-ppd}

Because Bayesian inference always conditions on a chosen sampling model $p(y \mid \theta)$, we must ask: *does the fitted model actually generate datasets that resemble the one we observed?* This is **posterior predictive model checking**{{< index "posterior predictive check" >}}.{{< cite "rubin1984,gelman1996" >}}

{{< thm kind="algorithm" note="Posterior Predictive Check (PPC)" label="alg:ch04-ppc" >}}
Choose a diagnostic test statistic $t(y)$ capturing a structural feature of interest (skewness, overdispersion, zero inflation, or a specific count ratio). Generate $S$ replicated datasets of the same size $n$ as $y_{\text{obs}}$:

1. Sample $\theta^{(s)} \sim p(\theta \mid y_{\text{obs}})$.
2. Sample a replicated dataset $\tilde{Y}^{(s)} = (\tilde{y}_1^{(s)}, \dots, \tilde{y}_n^{(s)}) \stackrel{\text{i.i.d.}}{\sim} p(y \mid \theta^{(s)})$.
3. Compute $t^{(s)} = t(\tilde{Y}^{(s)})$.

Compare the observed value $t(y_{\text{obs}})$ against the empirical distribution of $\{t^{(1)}, \dots, t^{(S)}\}$ via the posterior predictive tail probability

$$
\hat{p}_{\text{PPC}} = \frac{1}{S}\sum_{s=1}^S \mathbf{1}\bigl(t^{(s)} \ge t(y_{\text{obs}})\bigr).
$$

If $t(y_{\text{obs}})$ lies far in the tail, the model fails to reproduce that feature of the population.
{{< /thm >}}

In the GSS fertility data for women without a bachelor’s degree ($n_1 = 111$), 38 women had 2 children while only 19 had 1 child, so $t(y_{\text{obs}}) = \#\{y_i = 2\} / \#\{y_i = 1\} = 2.0$. As {{< xref "fig:ch04-mc" "full" >}} (right panel) shows, only $0.51\%$ of Poisson posterior predictive replicates in our $50{,}000$-draw simulation reach $t(\tilde{Y}) \ge 2.0$ (exact value $\approx 0.0057 \pm 0.0002$): no Poisson distribution with mean near $1.95$—where the theoretical ratio is $p(2)/p(1) = \theta/2 \approx 0.98$—can exhibit such a sharp cultural spike at two children!

{{< remark note="Interpreting PPC p-values and misspecified models" label="rem:ch04-misspec" >}}
Two subtleties govern posterior predictive checks:

1. **Conservatism under the null**: Because $y_{\text{obs}}$ is used twice—both to fit $p(\theta \mid y_{\text{obs}})$ and to evaluate $t(y_{\text{obs}})$—posterior predictive $p$-values are *not* uniformly distributed on $[0, 1]$ even when the model is exact; they tend to concentrate near $0.5$, making very small values (like $0.005$) genuinely strong evidence of misfit{{< cite "bayarri2000" >}}.
2. **Misspecified models can still be useful**: A failing PPC does not invalidate *every* inference{{< cite "white1982" >}}. In the GSS data, the sample mean ($1.95$) and sample variance ($1.90$) are nearly equal, so the Poisson model still provides a consistent estimate and accurate credible interval for the *population mean*—even though it is unsuitable for estimating individual cell probabilities $p(y = 2)$ (for which a multinomial model would be needed). Always check the features relevant to your inferential question.
{{< /remark >}}

```python
import numpy as np

rng = np.random.default_rng(42)
S = 50_000
a, b = 2, 1
n1, sy1 = 111, 217
n2, sy2 = 44, 66

# 1. Group comparison & ratio of means with MCSE
th1 = rng.gamma(a + sy1, 1.0 / (b + n1), size=S)
th2 = rng.gamma(a + sy2, 1.0 / (b + n2), size=S)
p_gt = np.mean(th1 > th2)
mcse_p = np.sqrt(p_gt * (1 - p_gt) / S)
print(f"Pr(theta1 > theta2 | y) = {p_gt:.4f} +/- {2*mcse_p:.4f} (2 MCSE)")

# 2. Posterior predictive individual comparison
y1_tilde = rng.poisson(th1)
y2_tilde = rng.poisson(th2)
print(f"Pr(Y1_tilde > Y2_tilde | y) = {np.mean(y1_tilde > y2_tilde):.4f}")

# 3. Posterior predictive check: t(Y) = #(Y==2) / #(Y==1)
Y_rep = rng.poisson(th1[:, None], size=(S, n1))
t_rep = np.sum(Y_rep == 2, axis=1) / np.maximum(np.sum(Y_rep == 1, axis=1), 1)
p_ppc = np.mean(t_rep >= 2.0)
print(f"PPC tail prob Pr(t(Y_rep) >= 2.0) = {p_ppc:.4f} +/- {2*np.sqrt(p_ppc*(1-p_ppc)/S):.4f}")
```

## Modern Developments: Predictive Evaluation and Validated Computation {#sec:ch04-modern}

### PSIS-LOO and LOO-PIT {#sec:ch04-psis-loo}

**Pareto-smoothed importance sampling leave-one-out cross-validation**{{< index "PSIS-LOO" >}} (PSIS-LOO) estimates how well a model predicts each observation from all the others, using the single set of draws in {{< eqref "eq:ch04-iid" >}}.{{< sidenote >}}**Beyond Hoff (2009).** This material is not in Hoff’s book; it follows Vehtari, Gelman, and Gabry{{< cite "vehtari2017" >}} and Vehtari et al.{{< cite "vehtari2024" >}}, with the sample-size theory of Chatterjee and Diaconis{{< cite "chatterjee2018" >}}. It modernizes the posterior predictive check of {{< xref "alg:ch04-ppc" "full" >}}.{{< /sidenote >}} For conditionally independent data,

$$
p(y_i \mid y_{-i}) = \frac{1}{E\bigl[\,1/p(y_i \mid \theta) \,\big|\, y\,\bigr]}
\approx \frac{\sum_{s} w_i^{(s)}\,p(y_i \mid \theta^{(s)})}{\sum_{s} w_i^{(s)}}, \qquad
r_i^{(s)} = \frac{1}{p(y_i \mid \theta^{(s)})}, \label{eq:ch04-loo}
$$

where $w_i^{(s)}$ is $r_i^{(s)}$ with its largest values smoothed by a fitted generalized Pareto tail.

*Why it holds*: $p(\theta \mid y_{-i}) \propto p(\theta \mid y)/p(y_i \mid \theta)$; integrate both sides. The Pareto shape estimate $\hat{k}$ is the diagnostic: Vehtari et al. flag the result when $\hat{k} > \min(1 - 1/\log_{10} S,\, 0.7)$. A heavy tail means the two posteriors differ, and importance sampling needs on the order of $\exp\{\operatorname{KL}(p(\theta \mid y_{-i}) \,\Vert\, p(\theta \mid y))\}$ draws. The Poisson–gamma model offers an exact check: $\theta \mid y_{-i} \sim \operatorname{gamma}(a_n - y_i,\, b_n - 1)$, so $p(y_i \mid y_{-i})$ is a $\operatorname{negative\ binomial}(a_n - y_i,\, b_n - 1)$ probability, and the raw ratios $r_i \propto e^{\theta}\theta^{-y_i}$ have tail shape $\max(1/b_n,\, y_i/a_n)$, below $1$ exactly when that gamma is proper.

The **LOO-PIT**{{< index "LOO-PIT" >}} values $\Pr(\tilde{Y}_i \le y_i \mid y_{-i})$ (randomized over ties for counts) should look approximately uniform when the model is adequate. Since $y_i$ does not inform its own prediction, they address the double use of data in {{< xref "rem:ch04-misspec" "full" >}}.

**When to use it.** Use PSIS-LOO to compare predictive models and LOO-PIT to check marginal calibration, refitting without $y_i$ wherever $\hat{k}$ is large. Hoff’s check remains the tool for a specific feature, such as the spike at two children.

### Simulation-Based Calibration {#sec:ch04-sbc}

**Simulation-based calibration**{{< index "simulation-based calibration" >}} (SBC) tests whether the code that claims to draw from a posterior really does.{{< sidenote >}}**Beyond Hoff (2009).** This material is not in Hoff’s book; it follows Talts et al.{{< cite "talts2018" >}}, Modrák et al.{{< cite "modrak2025" >}}, and Säilynoja, Bürkner, and Vehtari{{< cite "sailynoja2022" >}}. Where {{< xref "alg:ch04-ppc" "full" >}} checks the model, SBC checks the computation.{{< /sidenote >}} Run the ancestral scheme {{< eqref "eq:ch04-ancestral" >}} from the *prior*, then fit the simulated data and rank the true value, by a test quantity $f(\theta, y)$, among $L$ posterior draws:

$$
\tilde{\theta} \sim p(\theta), \quad
y \sim p(y \mid \tilde{\theta}), \quad
\theta^{(1)}, \dots, \theta^{(L)} \stackrel{\text{i.i.d.}}{\sim} p(\theta \mid y), \qquad
R = \sum_{l=1}^{L} \mathbf{1}\bigl(f(\theta^{(l)}, y) < f(\tilde{\theta}, y)\bigr). \label{eq:ch04-sbc}
$$

If the sampler is exact and ties have probability zero (otherwise break them at random), $R$ is uniform on $\{0, 1, \dots, L\}$.

*Why it holds*: the joint density factors as $p(\tilde{\theta})\,p(y \mid \tilde{\theta}) = p(y)\,p(\tilde{\theta} \mid y)$, so given $y$ the value $\tilde{\theta}$ is itself a posterior draw, i.i.d. with the $\theta^{(l)}$, and every rank is equally likely. Repeat over many simulated datasets and compare the ranks with uniformity through the empirical distribution function and its simultaneous confidence bands, which avoid the arbitrary bins of a histogram.

The converse fails. A broken sampler that ignores $y$ and returns *prior* draws gives uniform ranks for every $f(\theta)$, because $\tilde{\theta}$ and the $\theta^{(l)}$ are then i.i.d. from the prior. Data-dependent quantities such as the log-likelihood $f(\theta, y) = \log p(y \mid \theta)$ can expose it: $y$ was generated from $\tilde{\theta}$, which therefore tends to rank high.

**When to use it.** Run SBC before trusting a new sampler, thinning autocorrelated draws such as those of {{< xref "ch:gibbs" "full" >}}. It complements Hoff’s MCSE {{< eqref "eq:ch04-mcse" >}}, which measures noise but not bias, and his predictive checks: passing SBC says nothing about whether the model fits the observed data.

### Computational & Symbolic Check {#sec:ch04-modern-check}

For the GSS posterior $\operatorname{gamma}(219, 112)$ the importance ratios in {{< eqref "eq:ch04-loo" >}} have tail shape below $1/2$ for these $y_i$, so even the raw harmonic-mean estimate is stable; the Python block compares it with the exact negative-binomial value, and the Wolfram sequence proves the identity.{{< sidenote >}}**Beyond Hoff (2009).** This computational check and its Wolfram symbolic counterpart below verify the modern methods in this section and are not in Hoff’s book.{{< /sidenote >}}

```python
import numpy as np
from scipy import stats

rng = np.random.default_rng(42)
an, bn, S = 219, 112, 200_000
theta = rng.gamma(an, 1.0 / bn, size=S)          # full-data posterior draws
for yi in range(4):
    exact = stats.nbinom.pmf(yi, an - yi, (bn - 1) / bn)   # NB(an - yi, bn - 1)
    r = 1.0 / stats.poisson.pmf(yi, theta)                 # raw importance ratios
    loo = 1.0 / r.mean()                                   # harmonic-mean identity
    mcse = loo**2 * r.std() / np.sqrt(S)                   # delta method
    print(f"y_i={yi}: exact={exact:.6f}, MC LOO={loo:.6f} +/- {2*mcse:.6f}, "
          f"tail shape={max(1/bn, yi/an):.4f}")
```

{{< marginnote >}}Write the exact leave-one-out predictive: a negative binomial with shape $a_n - y_i$ and rate $b_n - 1$.{{< /marginnote >}}

```js
// Chapter 4 (modern): exact Poisson-gamma LOO vs. the harmonic-mean identity
const looNB = await show`Gamma[an]/(Gamma[an - yi]*yi!)*((bn - 1)/bn)^(an - yi)*(1/bn)^yi`
```

$$
p(y_i \mid y_{-i}) = \frac{\left(\frac{1}{b_n}\right)^{y_i} \left(\frac{-1+b_n}{b_n}\right)^{a_n -y_i} \Gamma (a_n)}{y_i ! \Gamma (a_n -y_i)}
$$

{{< marginnote >}}Verify it by integrating $\operatorname{Poisson}(y_i \mid \theta)$ over the leave-one-out posterior $\operatorname{gamma}(a_n - y_i, b_n - 1)$.{{< /marginnote >}}

```js
await show`Assuming[bn > 1 && yi >= 0 && an > yi && Element[yi, Integers], FullSimplify[
  Integrate[th^yi*Exp[-th]/yi! * (bn - 1)^(an - yi)/Gamma[an - yi]*th^(an - yi - 1)*Exp[-(bn - 1)*th],
    {th, 0, Infinity}] / (${looNB})]]`
```

$$
\frac{1}{\operatorname{NB}(y_i)}\int_0^\infty \operatorname{Poisson}(y_i \mid \theta)\,\operatorname{Gamma}(\theta \mid a_n - y_i, b_n - 1)\,d\theta = 1
$$

{{< marginnote >}}Integrate $1/p(y_i \mid \theta)$ over the *full* posterior $\operatorname{gamma}(a_n, b_n)$: the posterior mean of the inverse likelihood.{{< /marginnote >}}

```js
const invP = await show`Assuming[bn > 1 && yi >= 0 && an > yi && Element[yi, Integers], FullSimplify[
  Integrate[yi!*Exp[th]*th^(-yi) * bn^an/Gamma[an]*th^(an - 1)*Exp[-bn*th], {th, 0, Infinity}]]]`
```

$$
\mathbb{E}\bigl[p(y_i \mid \theta)^{-1} \mid y\bigr] = \frac{y_i!\; b_n^{a_n}\,(b_n-1)^{y_i-a_n}\,\Gamma(a_n-y_i)}{\Gamma(a_n)}
$$

{{< marginnote >}}Invert it and divide by the exact LOO predictive: the harmonic-mean identity returns the same probability.{{< /marginnote >}}

```js
await show`Assuming[bn > 1 && yi >= 0 && an > yi && Element[yi, Integers], FullSimplify[(1/(${invP})) / (${looNB})]]`
```

$$
\frac{1/\mathbb{E}\bigl[p(y_i \mid \theta)^{-1} \mid y\bigr]}{p(y_i \mid y_{-i})} = 1
$$

{{< marginnote >}}Instantiate the exact LOO predictive at the GSS posterior for $y_i = 0, 1, 2, 3$ to benchmark the Monte Carlo column.{{< /marginnote >}}

```js
await show`N[Table[(${looNB}) /. {an -> 219, bn -> 112}, {yi, 0, 3}]]`
```

$$
\bigl(p(y_i \mid y_{-i})\bigr)_{y_i=0}^{3}\big|_{a_n=219,\; b_n=112} = \{0.140277,0.275498,0.269293,0.174677\}
$$

## Symbolic Check in Wolfram Language {#sec:ch04-wolfram}

Derives the exact push-forward log-odds density via change-of-variables Jacobian, the closed-form Gamma-ratio mean and variance (exposing the poles at $a_2 = 1, 2$), the symbolic Gamma CDF $\Pr(\theta_2 < c)$, and the general Beta representation of $\Pr(\theta_1 > \theta_2)$, then instantiates all symbolic expressions on the GSS fertility posteriors to benchmark the Monte Carlo estimates.

{{< marginnote >}}Invert $\gamma = \operatorname{logit}(\theta)$ and multiply by its Jacobian to derive the exact log-odds density.{{< /marginnote >}}

```js
// Chapter 4: Symbolic log-odds density, Gamma-ratio moments & symbolic Gamma tail probabilities
const thOfG = await wl`th /. First[Solve[Log[th / (1 - th)] == g, th, Reals]]`
const jac = await wl`FullSimplify[D[${thOfG}, g], Element[g, Reals]]`
await show`FullSimplify[(${thOfG}^(a - 1)*(1 - ${thOfG})^(b - 1)/Beta[a, b]) * ${jac}, Element[g, Reals]]`
```

$$
\begin{aligned}
&p_\gamma(g) = p_\theta\!\left(\frac{e^g}{1+e^g}\right)\left|\frac{d\theta}{dg}\right| \\
&= \frac{e^{a g} \left(1+e^g\right)^{-a-b}}{B(a,b)}
\end{aligned}
$$

{{< marginnote >}}Integrate $1/\theta_2$ against $\operatorname{gamma}(a_2, b_2)$ to compute the exact mean of the rate ratio $\theta_1/\theta_2$.{{< /marginnote >}}

```js
// Exact symbolic moments of ratio R = th1 / th2 for independent Gamma(a1,b1), Gamma(a2,b2)
const eR = await show`Assuming[a1 > 0 && b1 > 0 && a2 > 1 && b2 > 0,
  FullSimplify[(a1/b1)*Integrate[(b2^a2/Gamma[a2])*t^(a2 - 2)*Exp[-b2*t], {t, 0, Infinity}]]]`
```

$$
\mathbb{E}[\theta_1 / \theta_2] = \frac{a_1 b_2}{(-1+a_2) b_1}
$$

{{< marginnote >}}Compute the second moment of $\theta_1/\theta_2$ symbolically to obtain $\operatorname{Var}(\theta_1/\theta_2)$ for $a_2 > 2$.{{< /marginnote >}}

```js
await show`Assuming[a1 > 0 && b1 > 0 && a2 > 2 && b2 > 0,
  FullSimplify[(a1*(a1 + 1)/b1^2)*Integrate[(b2^a2/Gamma[a2])*t^(a2 - 3)*Exp[-b2*t], {t, 0, Infinity}] - (${eR})^2]]`
```

$$
\begin{aligned}
&\operatorname{Var}(\theta_1 / \theta_2) \\
&= \frac{a_1 (-1+a_1 +a_2) b_2^2}{(-2+a_2) (-1+a_2)^2 b_1^2}
\end{aligned}
$$

{{< marginnote >}}Integrate the $\operatorname{gamma}(a_2, b_2)$ density up to $c$ to express its CDF via the incomplete Gamma function.{{< /marginnote >}}

```js
// Symbolic Gamma CDF Pr(th < c) and general Beta-representation of Pr(th1 > th2)
const gamCdf = await show`Assuming[a2 > 0 && b2 > 0 && c > 0,
  FullSimplify[Integrate[(b2^a2/Gamma[a2])*t^(a2 - 1)*Exp[-b2*t], {t, 0, c}]]]`
```

$$
\Pr(\theta_2 < c) = 1-\frac{\Gamma (a_2,b_2 c)}{\Gamma (a_2)}
$$

{{< marginnote >}}Express $\Pr(\theta_1 > \theta_2)$ for independent Gammas via the regularized incomplete Beta function.{{< /marginnote >}}

```js
const pGtSym = await show`1 - Beta[b1 / (b1 + b2), a1, a2] / Beta[a1, a2]`
```

$$
\Pr(\theta_1 > \theta_2) = 1-\frac{B_{\frac{b_1}{b_1 +b_2}}(a_1,a_2)}{B(a_1,a_2)}
$$

{{< marginnote >}}Instantiate both exact GSS fertility tail probabilities to benchmark Monte Carlo estimates.{{< /marginnote >}}

```js
// Instantiate at GSS fertility posteriors Gamma(219,112) vs Gamma(68,45) and c = 7/4
await show`N[{${pGtSym} /. {a1 -> 219, b1 -> 112, a2 -> 68, b2 -> 45}, ${gamCdf} /. {a2 -> 68, b2 -> 45, c -> 7/4}}]`
```

$$
\begin{aligned}
&\bigl(\Pr(\theta_1 > \theta_2 \mid y),\; \Pr(\theta_2 < 1.75 \mid y)\bigr)_{\text{GSS}} \\
&= \{0.97256,0.899829\}
\end{aligned}
$$

## Exercises {#sec:ch04-exercises}

{{< thm kind="exercise" label="ex:ch04-jensen" >}}
For $\theta \mid y \sim \operatorname{beta}(2, 40)$, use $S = 50{,}000$ Monte Carlo draws to compare $E[\log\frac{\theta}{1-\theta} \mid y]$ against $\log\frac{E[\theta \mid y]}{1 - E[\theta \mid y]}$, and compare $E[1/\theta \mid y]$ against $1 / E[\theta \mid y]$. Explain the sign of each discrepancy via Jensen’s inequality.
{{< /thm >}}

{{< details summary="Symbolic Solution & Instantiation" >}}

{{< marginnote >}}Express $E[\operatorname{logit}(\theta)]$ for $\theta \sim \operatorname{beta}(a, b)$ in terms of the digamma function $\psi^{(0)}$.{{< /marginnote >}}

```js
// Ex 4.1: Exact Jensen discrepancies for Beta(a, b): E[logit(theta)] and E[1/theta]
const eLogit = await show`Assuming[a > 0 && b > 0, FullSimplify[PolyGamma[0, a] - PolyGamma[0, b]]]`
```

$$
\mathbb{E}\!\left[\log\frac{\theta}{1-\theta}\right] = \psi^{(0)}(a)-\psi^{(0)}(b)
$$

{{< marginnote >}}Integrate $1/\theta$ against $\operatorname{beta}(a, b)$ to obtain $E[1/\theta]$ for $a > 1$.{{< /marginnote >}}

```js
const eInv = await show`Assuming[a > 1 && b > 0, FullSimplify[Integrate[(1/th)*th^(a - 1)*(1 - th)^(b - 1)/Beta[a, b], {th, 0, 1}]]]`
```

$$
\mathbb{E}\!\left[\frac{1}{\theta}\right] = 1+\frac{b}{-1+a}
$$

{{< marginnote >}}Subtract $1/E[\theta]$ to isolate the exact positive Jensen gap $b/[a(a-1)]$.{{< /marginnote >}}

```js
await show`Factor[${eInv} - (a + b)/a]`
```

$$
\mathbb{E}\!\left[\frac{1}{\theta}\right] - \frac{1}{\mathbb{E}[\theta]} = \frac{b}{(-1+a) a}
$$

{{< marginnote >}}Evaluate $E[\operatorname{logit}\theta]$, $\operatorname{logit}E[\theta]$, $E[1/\theta]$, and $1/E[\theta]$ at $\operatorname{beta}(2, 40)$.{{< /marginnote >}}

```js
await show`N[{${eLogit}, Log[a/b], ${eInv}, (a + b)/a} /. {a -> 2, b -> 40}]`
```

$$
\begin{aligned}
&\bigl(\mathbb{E}[\operatorname{logit}\theta],\; \operatorname{logit}\mathbb{E}[\theta],\; \mathbb{E}[\theta^{-1}],\; (\mathbb{E}[\theta])^{-1}\bigr)_{\operatorname{Beta}(2,40)} \\
&= \{-3.25354,-2.99573,41.,21.\}
\end{aligned}
$$

{{< /details >}}

{{< thm kind="exercise" label="ex:ch04-rb" >}}
For $\theta \mid y \sim \operatorname{gamma}(68, 45)$ and $\tilde{Y} \mid \theta \sim \operatorname{Poisson}(\theta)$, compare the empirical variance across 500 repeated runs ($S = 200$ draws each) of (a) the naive predictive mean $\frac{1}{S}\sum \tilde{y}^{(s)}$ versus (b) the Rao–Blackwellized estimator $\frac{1}{S}\sum \theta^{(s)}$. How closely does the variance ratio match $\operatorname{Var}(\tilde{Y} \mid y) / \operatorname{Var}(\theta \mid y) = (b_n + 1)/1 = 46$?
{{< /thm >}}

{{< details summary="Symbolic Solution & Instantiation" >}}

{{< marginnote >}}Take the ratio of predictive variance to posterior variance to derive the exact Rao–Blackwell efficiency gain.{{< /marginnote >}}

```js
// Ex 4.2: Exact Rao-Blackwell variance reduction ratio Var(Ytilde | y) / Var(theta | y)
const rbRatio = await show`FullSimplify[((an*(bn + 1))/bn^2) / (an/bn^2)]`
```

$$
\frac{\operatorname{Var}(\tilde{Y} \mid y)}{\operatorname{Var}(\theta \mid y)} = 1+b_n
$$

{{< marginnote >}}Instantiate the variance reduction factor at the GSS degree posterior $\operatorname{gamma}(68, 45)$.{{< /marginnote >}}

```js
await show`${rbRatio} /. {an -> 68, bn -> 45}`
```

$$
\begin{aligned}
&\left.\frac{\operatorname{Var}(\tilde{Y} \mid y)}{\operatorname{Var}(\theta \mid y)}\right|_{a_n=68,\; b_n=45} \\
&= 46
\end{aligned}
$$

{{< /details >}}

{{< thm kind="exercise" label="ex:ch04-overdispersion" >}}
Design a posterior predictive check for overdispersion using the dispersion index $t(Y) = s^2(Y) / \bar{Y}$. Simulate a negative-binomial dataset with mean $2$ and variance $6$ ($n = 100$), fit a conjugate Poisson–Gamma model, and verify that {{< xref "alg:ch04-ppc" "full" >}} flags the overdispersion clearly.
{{< /thm >}}

{{< details summary="Symbolic Solution & Instantiation" >}}

{{< marginnote >}}Compute the Negative Binomial dispersion index $\operatorname{Var}(Y)/E[Y] = 1 + 1/b$ symbolically.{{< /marginnote >}}

```js
// Ex 4.3: Symbolic Negative Binomial dispersion index Var(Y) / E[Y] = 1 + 1/b
const dispIdx = await show`FullSimplify[((a*(b + 1))/b^2) / (a/b)]`
```

$$
\frac{\operatorname{Var}(Y)}{\mathbb{E}[Y]} = 1+\frac{1}{b}
$$

{{< marginnote >}}Solve for the Gamma hyperparameters $(a, b)$ matching $E[Y] = 2$ and $\operatorname{Var}(Y) = 6$.{{< /marginnote >}}

```js
const sol = await show`First[Solve[{a/b == 2, (a*(b + 1))/b^2 == 6}, {a, b}]]`
```

$$
\begin{aligned}
&\text{Solution for } (\mathbb{E}[Y]=2,\; \operatorname{Var}(Y)=6) \\
&= \left\{a\to 1,b\to \frac{1}{2}\right\}
\end{aligned}
$$

{{< marginnote >}}Verify that the solved parameters yield a dispersion index of $3$ (triple the Poisson baseline).{{< /marginnote >}}

```js
await show`${dispIdx} /. ${sol}`
```

$$
\left.\frac{\operatorname{Var}(Y)}{\mathbb{E}[Y]}\right|_{a=1,\; b=1/2} = 3
$$

{{< /details >}}
