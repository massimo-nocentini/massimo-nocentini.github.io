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
- **Two-group comparisons**: For independent posteriors $\theta_1 \mid y_1 \sim \operatorname{gamma}(219, 112)$ and $\theta_2 \mid y_2 \sim \operatorname{gamma}(68, 45)$, drawing pairs $(\theta_1^{(s)}, \theta_2^{(s)})$ lets us approximate $\Pr(\theta_1 > \theta_2 \mid y) \approx \frac{1}{S}\sum_{s=1}^S \mathbf{1}(\theta_1^{(s)} > \theta_2^{(s)}) \approx 0.973$ (exact value $0.9726$, verified below) and plot the entire posterior of the ratio $\theta_1 / \theta_2$ in three lines of code.

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
Whenever the conditional expectation $E[\tilde{Y} \mid \theta]$ is known in closed form, averaging $E[\tilde{Y} \mid \theta^{(s)}]$ across draws achieves *strictly smaller* Monte Carlo variance than averaging simulated $\tilde{y}^{(s)}$, because $\operatorname{Var}(E[\tilde{Y} \mid \theta]) = \operatorname{Var}(\tilde{Y}) - E[\operatorname{Var}(\tilde{Y} \mid \theta)] \le \operatorname{Var}(\tilde{Y})$. This variance-reduction principle—**Rao–Blackwellization**{{< index "Rao–Blackwellization" >}}—carries directly into the Gibbs samplers of Part II.
{{< /remark >}}

## Posterior Predictive Model Checking {#sec:ch04-ppd}

Because Bayesian inference always conditions on a chosen sampling model $p(y \mid \theta)$, we must ask: *does the fitted model actually generate datasets that resemble the one we observed?* This is **posterior predictive model checking**{{< index "posterior predictive check" >}}.{{< cite "rubin1984,gelman1996" >}}

{{< thm kind="algorithm" note="Posterior Predictive Check (PPC)" label="alg:ch04-ppc" >}}
Choose a diagnostic test statistic $t(y)$ capturing a structural feature of interest (skewness, overdispersion, zero inflation, or a specific count ratio). Generate $S$ replicated datasets of the same size $n$ as $y_{\text{obs}}$:

1. Sample $\theta^{(s)} \sim p(\theta \mid y_{\text{obs}})$.
2. Sample a replicated dataset $\tilde{Y}^{(s)} = (\tilde{y}_1^{(s)}, \dots, \tilde{y}_n^{(s)}) \stackrel{\text{i.i.d.}}{\sim} p(y \mid \theta^{(s)})$.
3. Compute $t^{(s)} = t(\tilde{Y}^{(s)})$.

Compare the observed value $t(y_{\text{obs}})$ against the empirical distribution of $\{t^{(1)}, \dots, t^{(S)}\}$ via the posterior predictive tail probability $\hat{p}_{\text{PPC}} = \frac{1}{S}\sum_{s=1}^S \mathbf{1}\bigl(t^{(s)} \ge t(y_{\text{obs}})\bigr)$. If $t(y_{\text{obs}})$ lies far in the tail, the model fails to reproduce that feature of the population.
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

## Symbolic Check in Wolfram Language {#sec:ch04-wolfram}

Derives the exact push-forward log-odds density via change-of-variables Jacobian, the closed-form Gamma-ratio mean and variance (exposing the poles at $a_2 = 1, 2$), the symbolic Gamma CDF $\Pr(\theta_2 < c)$, and the general Beta representation of $\Pr(\theta_1 > \theta_2)$, then instantiates all symbolic expressions on the GSS fertility posteriors to benchmark the Monte Carlo estimates.

```js
const thOfG = await wl`th /. First[Solve[Log[th / (1 - th)] == g, th, Reals]]`
const jac = await wl`FullSimplify[D[${thOfG}, g], Element[g, Reals]]`
await show`FullSimplify[(${thOfG}^(a - 1)*(1 - ${thOfG})^(b - 1)/Beta[a, b]) * ${jac}, Element[g, Reals]]`
```


$$
\frac{\theta(g)^{a-1}(1-\theta(g))^{b-1}}{B(a,b)}\,\frac{d\theta}{dg} \;=\; \frac{e^{a g} \left(1+e^g\right)^{-a-b}}{B(a,b)}
$$

```js
// Exact symbolic moments of ratio R = th1 / th2 for independent Gamma(a1,b1), Gamma(a2,b2)
const eR = await show`Assuming[a1 > 0 && b1 > 0 && a2 > 1 && b2 > 0,
  FullSimplify[(a1/b1)*Integrate[(b2^a2/Gamma[a2])*t^(a2 - 2)*Exp[-b2*t], {t, 0, Infinity}]]]`
```


$$
\frac{\text{a1}}{\text{b1}}\int_0^\infty \frac{\text{b2}^{\text{a2}}}{\Gamma(\text{a2})}\,t^{\text{a2}-2} e^{-\text{b2}\,t}\,dt \;=\; \frac{\text{a1} \text{b2}}{(-1+\text{a2}) \text{b1}}
$$

```js
await show`Assuming[a1 > 0 && b1 > 0 && a2 > 2 && b2 > 0,
  FullSimplify[(a1*(a1 + 1)/b1^2)*Integrate[(b2^a2/Gamma[a2])*t^(a2 - 3)*Exp[-b2*t], {t, 0, Infinity}] - (${eR})^2]]`
```


$$
\begin{aligned}
\frac{\text{a1}(\text{a1}+1)}{\text{b1}^2}\int_0^\infty \frac{\text{b2}^{\text{a2}}}{\Gamma(\text{a2})}\,t^{\text{a2}-3} e^{-\text{b2}\,t}\,dt - E\!\left[\frac{\theta_1}{\theta_2}\right]^2 \\
&= \frac{\text{a1} (-1+\text{a1}+\text{a2}) \text{b2}^2}{(-2+\text{a2}) (-1+\text{a2})^2 \text{b1}^2}
\end{aligned}
$$

```js
// Symbolic Gamma CDF Pr(th2 < c) and general Beta representation of Pr(th1 > th2)
const gamCdf = await show`Assuming[a2 > 0 && b2 > 0 && c > 0,
  FullSimplify[Integrate[(b2^a2/Gamma[a2])*t^(a2 - 1)*Exp[-b2*t], {t, 0, c}]]]`
```


$$
\Pr(\theta_2 < c) = \int_0^c \frac{\text{b2}^{\text{a2}}}{\Gamma(\text{a2})}\,t^{\text{a2}-1} e^{-\text{b2}\,t}\,dt \;=\; 1-\frac{\Gamma (\text{a2},\text{b2} c)}{\Gamma (\text{a2})}
$$

```js
const pGtSym = await show`1 - Beta[b1 / (b1 + b2), a1, a2] / Beta[a1, a2]`
```


$$
\Pr(\theta_1 > \theta_2) \;=\; 1-\frac{B_{\frac{\text{b1}}{\text{b1}+\text{b2}}}(\text{a1},\text{a2})}{B(\text{a1},\text{a2})}
$$

```js
// Instantiate at GSS fertility posteriors Gamma(219,112) vs Gamma(68,45) and c = 7/4
const pGt = toJS(await wl`N[${pGtSym} /. {a1 -> 219, b1 -> 112, a2 -> 68, b2 -> 45}]`)
const pLt175 = toJS(await wl`N[${gamCdf} /. {a2 -> 68, b2 -> 45, c -> 7/4}]`)
console.log(`Exact Pr(th1 > th2 | y) = ${pGt.toFixed(4)}  |  Exact Pr(th2 < 1.75 | y) = ${pLt175.toFixed(4)}`)
```


```text
Exact Pr(th1 > th2 | y) = 0.9726  |  Exact Pr(th2 < 1.75 | y) = 0.8998
```

## Exercises {#sec:ch04-exercises}

{{< thm kind="exercise" label="ex:ch04-jensen" >}}
For $\theta \mid y \sim \operatorname{beta}(2, 40)$, use $S = 50{,}000$ Monte Carlo draws to compare $E[\log\frac{\theta}{1-\theta} \mid y]$ against $\log\frac{E[\theta \mid y]}{1 - E[\theta \mid y]}$, and compare $E[1/\theta \mid y]$ against $1 / E[\theta \mid y]$. Explain the sign of each discrepancy via Jensen’s inequality.
{{< /thm >}}

{{< thm kind="exercise" label="ex:ch04-rb" >}}
For $\theta \mid y \sim \operatorname{gamma}(68, 45)$ and $\tilde{Y} \mid \theta \sim \operatorname{Poisson}(\theta)$, compare the empirical variance across 500 repeated runs ($S = 200$ draws each) of (a) the naive predictive mean $\frac{1}{S}\sum \tilde{y}^{(s)}$ versus (b) the Rao–Blackwellized estimator $\frac{1}{S}\sum \theta^{(s)}$. How closely does the variance ratio match $\operatorname{Var}(\tilde{Y} \mid y) / \operatorname{Var}(\theta \mid y) = (b_n + 1)/1 = 46$?
{{< /thm >}}

{{< thm kind="exercise" label="ex:ch04-overdispersion" >}}
Design a posterior predictive check for overdispersion using the dispersion index $t(Y) = s^2(Y) / \bar{Y}$. Simulate a negative-binomial dataset with mean $2$ and variance $6$ ($n = 100$), fit a conjugate Poisson–Gamma model, and verify that {{< xref "alg:ch04-ppc" "full" >}} flags the overdispersion clearly.
{{< /thm >}}
