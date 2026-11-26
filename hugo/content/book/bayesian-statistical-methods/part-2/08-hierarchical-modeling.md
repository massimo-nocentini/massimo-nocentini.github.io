---
title: "Group Comparisons and Hierarchical Modeling"
linkTitle: "Hierarchical Modeling"
weight: 40
label: "ch:hierarchical"
---

{{< newthought "Whenever data come in groups" />}}—students nested inside schools, patients nested inside hospitals, or baseball players across a league—two naive extremes tempt the analyst. **No pooling** fits each group completely separately, leaving small groups noisy and erratic. **Complete pooling** lumps all groups into one common mean, erasing genuine differences between groups. Chapter 8 resolves this tension cleanly through **hierarchical modeling**{{< index "hierarchical model" >}}{{< cite "hoff2009,lindley1972,gelman2007" >}}, where groups share information smoothly (**partial pooling**) in direct proportion to their sample sizes and between-group variance.

## Two-Group Comparisons: Continuous Pooling via $(\mu \pm \delta)$ {#sec:ch08-two-groups}

Start with $m = 2$ urban public high schools from the 2002 Educational Longitudinal Study (ELS): $n_1 = 31$ tenth graders in School 1 ($\bar{y}_1 = 50.81$) and $n_2 = 28$ in School 2 ($\bar{y}_2 = 46.15$), a sample gap of $\bar{y}_1 - \bar{y}_2 = 4.66$ points. Classical practice runs a two-sample $t$-test: if $p < 0.05$, report separate means $\bar{y}_1, \bar{y}_2$; if $p \ge 0.05$, pool both schools into a single grand mean. That binary switch is discontinuous and wastes information when groups are similar yet non-identical.

Hoff replaces the binary switch with a reparameterization into an overall level $\mu$ and a half-difference $\delta$:

$$
\theta_1 = \mu + \delta, \qquad \theta_2 = \mu - \delta, \qquad
\mu \sim \operatorname{normal}(\mu_0, \gamma_0^2), \qquad
\delta \sim \operatorname{normal}(\delta_0, \tau_0^2), \label{eq:ch08-two-group}
$$

with a shared variance $\sigma^{-2} \sim \operatorname{gamma}(\nu_0/2, \nu_0\sigma_0^2/2)$. With $\delta_0 = 0$, the prior variance $\tau_0^2$ dials continuously between the two extremes: as $\tau_0^2 \to 0$, $\delta \to 0$ (complete pooling); as $\gamma_0^2, \tau_0^2 \to \infty$ together with $\gamma_0^2 = \tau_0^2$, $\theta_1$ and $\theta_2$ become prior-independent (no pooling); for finite $\tau_0^2$, the data themselves determine how far apart the two school means should be pulled.

## Many Groups: Double Exchangeability and the Hierarchical Normal Model {#sec:ch08-hierarchical}

Now suppose we observe $m = 100$ public high schools from the 2002 ELS, with $n_j$ tenth-grade students in school $j$ ($n_j$ ranging from $4$ to $32$). Two symmetries hold simultaneously:
1. **Within-group exchangeability**: given school $j$’s mean $\theta_j$ and within-school variance $\sigma^2$, student scores $Y_{1,j}, \dots, Y_{n_j,j}$ are exchangeable, so $Y_{i,j} \mid \theta_j, \sigma^2 \stackrel{\text{i.i.d.}}{\sim} \operatorname{normal}(\theta_j, \sigma^2)$.
2. **Between-group exchangeability**: the 100 schools are themselves a sample from the population of U.S. public high schools, so their means $\theta_1, \dots, \theta_m$ are exchangeable across schools: $\theta_j \mid \mu, \tau^2 \stackrel{\text{i.i.d.}}{\sim} \operatorname{normal}(\mu, \tau^2)$.

{{< remark note="Sampling model vs. prior in hierarchical models" label="rem:ch08-two-stage" >}}
Hoff emphasizes a vital conceptual distinction: $p(\theta_1, \dots, \theta_m \mid \mu, \tau^2)$ is **not** merely a fixed prior—it is a *between-group sampling model* describing variation across schools, whose population parameters $(\mu, \tau^2)$ are estimated from the data! Only the top-level distribution $p(\mu, \tau^2, \sigma^2)$ is a subjective prior.
{{< /remark >}}

Equipping $(\mu, \tau^2, \sigma^2)$ with independent semiconjugate priors,

$$
\mu \sim \operatorname{normal}(\mu_0, \gamma_0^2), \qquad
\frac{1}{\tau^2} \sim \operatorname{gamma}\!\left(\frac{\eta_0}{2}, \frac{\eta_0 \tau_0^2}{2}\right), \qquad
\frac{1}{\sigma^2} \sim \operatorname{gamma}\!\left(\frac{\nu_0}{2}, \frac{\nu_0 \sigma_0^2}{2}\right), \label{eq:ch08-hyperpriors}
$$

yields the directed acyclic graph (DAG) in {{< xref "fig:ch08-shrinkage" "full" >}} (left panel) and the joint posterior factorization

$$
p(\theta_1, \dots, \theta_m, \mu, \tau^2, \sigma^2 \mid \mathbf{y}_1, \dots, \mathbf{y}_m)
\propto p(\mu)\,p(\tau^2)\,p(\sigma^2)
\prod_{j=1}^m p(\theta_j \mid \mu, \tau^2)
\prod_{i=1}^{n_j} p(y_{i,j} \mid \theta_j, \sigma^2). \label{eq:ch08-joint}
$$

{{< fig src="images/bayesian-hoff/fig-ch08-shrinkage.svg" type="fullwidth" label="fig:ch08-shrinkage" alt="Three panels: hierarchical normal DAG connecting hyperparameters (mu, tau^2) and sigma^2 to group means theta_j and observations y_j; scatter plot of sample means ybar_j versus shrunk hierarchical estimates theta_hat_j colored by group size; and scatter plot of shrinkage magnitude ybar_j minus theta_hat_j versus sample size n_j" short="Hierarchical normal DAG and adaptive partial pooling" >}}Left: DAG of the hierarchical normal model. Center: hierarchical posterior means $\hat{\theta}_j$ pull extreme group averages $\bar{y}_j$ toward the grand mean $\hat{\mu}$. Right: shrinkage magnitude $\lvert \bar{y}_j - \hat{\theta}_j \rvert$ is largest for small groups ($n_j \approx 5$) and vanishes for large groups.{{< /fig >}}

### Full Conditionals and Modular Gibbs Sampling {#sec:ch08-gibbs}

Reading directly off the DAG factorization {{< eqref "eq:ch08-joint" >}}, each parameter depends only on its immediate Markov blanket (parents, children, and co-parents), yielding four standard full conditionals:

{{< proposition note="Full Conditionals of the Hierarchical Normal Model" label="prop:ch08-fc" >}}
Under {{< eqref "eq:ch08-hyperpriors" >}}–{{< eqref "eq:ch08-joint" >}}, let $N = \sum_{j=1}^m n_j$ and $\bar{\theta} = \frac{1}{m}\sum_{j=1}^m \theta_j$. Then:

1. **Group means** (conditionally independent across $j = 1, \dots, m$):

   $$
   \theta_j \mid \mu, \tau^2, \sigma^2, \mathbf{y}_j \sim \operatorname{normal}\!\left(
   \frac{\frac{n_j}{\sigma^2}\bar{y}_j + \frac{1}{\tau^2}\mu}{\frac{n_j}{\sigma^2} + \frac{1}{\tau^2}},\;
   \frac{1}{\frac{n_j}{\sigma^2} + \frac{1}{\tau^2}}
   \right). \label{eq:ch08-fc-thetaj}
   $$

2. **Population grand mean** (depends on $\mathbf{y}$ *only* through $\theta_1, \dots, \theta_m$):

   $$
   \mu \mid \boldsymbol{\theta}, \tau^2 \sim \operatorname{normal}\!\left(
   \frac{\frac{m}{\tau^2}\bar{\theta} + \frac{1}{\gamma_0^2}\mu_0}{\frac{m}{\tau^2} + \frac{1}{\gamma_0^2}},\;
   \frac{1}{\frac{m}{\tau^2} + \frac{1}{\gamma_0^2}}
   \right). \label{eq:ch08-fc-mu}
   $$

3. **Between-group precision**:

   $$
   \frac{1}{\tau^2} \mid \boldsymbol{\theta}, \mu \sim \operatorname{gamma}\!\left(
   \frac{\eta_0 + m}{2},\; \frac{\eta_0 \tau_0^2 + \sum_{j=1}^m (\theta_j - \mu)^2}{2}
   \right). \label{eq:ch08-fc-tau2}
   $$

4. **Within-group precision**:

   $$
   \frac{1}{\sigma^2} \mid \boldsymbol{\theta}, \mathbf{y} \sim \operatorname{gamma}\!\left(
   \frac{\nu_0 + N}{2},\; \frac{\nu_0 \sigma_0^2 + \sum_{j=1}^m \sum_{i=1}^{n_j} (y_{i,j} - \theta_j)^2}{2}
   \right). \label{eq:ch08-fc-sig2}
   $$
{{< /proposition >}}

Notice how every single equation in {{< xref "prop:ch08-fc" "full" >}} is just the Chapter 6 semiconjugate normal update applied at two levels: $(\mu, \tau^2)$ treat $\theta_1, \dots, \theta_m$ as their “data,” while each $\theta_j$ treats $(\mu, \tau^2)$ as its “prior.”{{< sidenote >}}Note a minor typographical slip on p. 135 of the 2009 printing of Hoff, which prints $1/\tau^2$ instead of $\mu/\tau^2$ in the numerator of {{< eqref "eq:ch08-fc-thetaj" >}} (Hoff’s R code on p. 138 correctly writes `mu/tau2`); see {{< xref "app:errata" "full" >}}.{{< /sidenote >}}

## Adaptive Shrinkage and Stein’s Paradox {#sec:ch08-shrinkage}

Rewriting the conditional expectation in {{< eqref "eq:ch08-fc-thetaj" >}} exposes the exact **shrinkage weight**{{< index "shrinkage" >}} for group $j$:

$$
E[\theta_j \mid \mu, \tau^2, \sigma^2, \mathbf{y}_j]
= B_j\,\bar{y}_j + (1 - B_j)\,\mu, \qquad
B_j = \frac{n_j / \sigma^2}{n_j / \sigma^2 + 1 / \tau^2}
= \frac{n_j}{n_j + \sigma^2 / \tau^2}. \label{eq:ch08-shrink-weight}
$$

Two forces control how aggressively group $j$ borrows strength from the grand mean $\mu$:
- **Sample size $n_j$**: small groups (small $n_j$) receive smaller weight $B_j$ and shrink strongly toward $\mu$; large groups stay near $\bar{y}_j$ ({{< xref "fig:ch08-shrinkage" "full" >}}, right).
- **Variance ratio $\sigma^2/\tau^2$**: when schools are genuinely similar ($\tau^2 \ll \sigma^2$), $\sigma^2/\tau^2$ is large and shrinkage is strong; when schools truly differ widely ($\tau^2 \gg \sigma^2$), $B_j \to 1$ and the model lets each school stand on its own.

In the 2002 ELS math scores ($m = 100$ schools, posterior $\hat{\mu} \approx 48.1$, $\hat{\tau} \approx 5.0$, $\hat{\sigma} \approx 9.2$, so $\hat{\sigma}^2/\hat{\tau}^2 \approx 3.4$), this produces a dramatic **ranking reversal** among low-scoring schools: School 82 has the *lower* raw sample mean ($\bar{y}_{82} = 38.76$) based on only $n_{82} = 5$ students, so its hierarchical estimate shrinks strongly *upward* toward $\hat{\mu}$ to $42.53$; School 46 has a slightly higher raw mean ($\bar{y}_{46} = 40.18$) based on $n_{46} = 21$ students, so it shrinks far less to $41.31$—reversing their order so that $\hat{\theta}_{82} > \hat{\theta}_{46}$! This echoes **Stein’s phenomenon**{{< cite "stein1956,efron1973" >}}{{< index "Stein’s paradox" >}}: with known equal variances, suitable shrinkage toward a fixed point ($m \ge 3$) or toward the estimated grand mean ($m \ge 4$) strictly dominates the unpooled sample means under total squared error $\sum_{j=1}^m (\hat{\theta}_j - \theta_j)^2$.

{{< remark note="Two modern caveats: variance priors and non-centered parameterizations" label="rem:ch08-modern" >}}
1. **Prior sensitivity for $\tau^2$ when $m$ is small**: With $m = 100$ schools, the data pin down $\tau^2$ easily. When $m$ is small (say $m = 5$), however, standard $\operatorname{inverse-gamma}(\epsilon, \epsilon)$ priors on $\tau^2$ can severely distort inference near $\tau = 0$; weakly informative half-$t$ or half-Cauchy priors on the standard deviation $\tau$ are far safer{{< cite "gelman2006" >}}.
2. **Centered vs. non-centered mixing**: When $\tau^2$ is small relative to $\sigma^2/n_j$, the centered parameterization $\theta_j \sim \mathcal{N}(\mu, \tau^2)$ creates a narrow “funnel” geometry where Gibbs steps stall. Writing $\theta_j = \mu + \tau\,\tilde{\theta}_j$ with $\tilde{\theta}_j \stackrel{\text{i.i.d.}}{\sim} \mathcal{N}(0, 1)$ (the **non-centered parameterization**{{< cite "papaspiliopoulos2007" >}}) decouples $\tilde{\theta}_j$ from $\tau$ and restores fast mixing.
{{< /remark >}}

## Heterogeneous Group Variances {#sec:ch08-het-var}

What if different schools also have different within-school spreads $\sigma_1^2, \dots, \sigma_m^2$? Adding a second hierarchy for the variances borrows strength across groups for variance estimation as well:

$$
\frac{1}{\sigma_j^2} \mid \nu_0, \sigma_0^2 \stackrel{\text{i.i.d.}}{\sim} \operatorname{gamma}\!\left(\frac{\nu_0}{2},\, \frac{\nu_0 \sigma_0^2}{2}\right), \qquad
\sigma_0^2 \sim \operatorname{gamma}(a, b), \qquad
p(\nu_0) \propto e^{-\alpha \nu_0} \quad (\nu_0 \in \{1, 2, \dots, \nu_{\max}\}). \label{eq:ch08-het-prior}
$$

Each $\sigma_j^{-2}$ now has its own conjugate gamma full conditional $\operatorname{gamma}\bigl(\frac{\nu_0 + n_j}{2},\, \frac{\nu_0 \sigma_0^2 + \sum_{i=1}^{n_j}(y_{i,j} - \theta_j)^2}{2}\bigr)$. Multiplying $\prod_{j=1}^m p(\sigma_j^{-2} \mid \nu_0, \sigma_0^2)$ by $\sigma_0^{2(a - 1)} e^{-b\sigma_0^2}$ yields the exact conjugate full conditional for the shared variance hyperparameter $\sigma_0^2$:

$$
p(\sigma_0^2 \mid \nu_0, \sigma_1^2, \dots, \sigma_m^2)
\propto (\sigma_0^2)^{a - 1} e^{-b\sigma_0^2}
\prod_{j=1}^m \left[(\sigma_0^2)^{\nu_0/2} \exp\!\left(-\frac{\nu_0 \sigma_0^2}{2\sigma_j^2}\right)\right]
= (\sigma_0^2)^{a + \frac{m\nu_0}{2} - 1}
\exp\!\left\{-\left(b + \frac{\nu_0}{2}\sum_{j=1}^m \frac{1}{\sigma_j^2}\right)\sigma_0^2\right\}, \label{eq:ch08-fc-sig0}
$$

which is $\operatorname{gamma}\!\bigl(a + \frac{m\nu_0}{2},\; b + \frac{\nu_0}{2}\sum_{j=1}^m \sigma_j^{-2}\bigr)$.{{< sidenote >}}Watch out for a missing factor of $\nu_0$ in the rate parameter printed on p. 144 of Hoff (2009), which writes $b + 1/2\sum \sigma_j^{-2}$ instead of $b + \nu_0/2\sum \sigma_j^{-2}$; see {{< xref "app:errata" "full" >}}.{{< /sidenote >}} Because $\nu_0$ enters inside the gamma function $\Gamma(\nu_0/2)$, it has no standard conjugate density; restricting $\nu_0$ to a discrete grid $\{1, 2, \dots, \nu_{\max}\}$ lets us evaluate its exact log-full conditional (using the log-sum-exp trick for numerical stability) and draw $\nu_0$ from a categorical distribution at every Gibbs step:

$$
\begin{aligned}
\log p(\nu_0 \mid \sigma_0^2, \sigma_1^2, \dots, \sigma_m^2)
&= \text{const} + m\!\left[\frac{\nu_0}{2}\log\!\left(\frac{\nu_0 \sigma_0^2}{2}\right) - \log\Gamma\!\left(\frac{\nu_0}{2}\right)\right] \\
&\quad + \left(\frac{\nu_0}{2} - 1\right)\sum_{j=1}^m \log\!\left(\frac{1}{\sigma_j^2}\right) - \frac{\nu_0 \sigma_0^2}{2}\sum_{j=1}^m \frac{1}{\sigma_j^2} - \alpha \nu_0.
\end{aligned} \label{eq:ch08-fc-nu0}
$$

```python
import numpy as np

# Hierarchical normal Gibbs sampler on synthetic 60-school ELS-like data
rng = np.random.default_rng(42)
m = 60
n_j = rng.integers(4, 25, size=m)
th_true = rng.normal(48.1, 4.5, size=m)
groups = [rng.normal(th, 9.2, size=nj) for th, nj in zip(th_true, n_j)]
ybar = np.array([g.mean() for g in groups])
ss_within = np.array([np.sum((g - g.mean())**2) for g in groups])
N = int(n_j.sum())

# Weakly informative hyperparameters (matching Hoff Ch. 8)
mu0, g20 = 50.0, 25.0
eta0, t20 = 1.0, 100.0
nu0, s20 = 1.0, 100.0

S = 4_000
mu_s, tau2_s, sig2_s = np.empty(S), np.empty(S), np.empty(S)
theta_s = np.empty((S, m))
th_cur, mu_cur, t2_cur, s2_cur = ybar.copy(), ybar.mean(), np.var(ybar, ddof=1), 85.0

for s in range(S):
    # 1. Vectorized full conditional for all m group means theta_j
    v_j = 1.0 / (n_j / s2_cur + 1.0 / t2_cur)
    m_j = v_j * (n_j * ybar / s2_cur + mu_cur / t2_cur)
    th_cur = rng.normal(m_j, np.sqrt(v_j))
    # 2. Grand mean mu | theta, tau^2
    v_mu = 1.0 / (m / t2_cur + 1.0 / g20)
    m_mu = v_mu * (m * th_cur.mean() / t2_cur + mu0 / g20)
    mu_cur = rng.normal(m_mu, np.sqrt(v_mu))
    # 3. Between-group variance tau^2 | theta, mu
    t2_cur = 1.0 / rng.gamma((eta0 + m) / 2.0,
                             2.0 / (eta0 * t20 + np.sum((th_cur - mu_cur)**2)))
    # 4. Within-group variance sigma^2 | theta, y (fast O(m) sum of squares)
    sse = np.sum(ss_within + n_j * (ybar - th_cur)**2)
    s2_cur = 1.0 / rng.gamma((nu0 + N) / 2.0, 2.0 / (nu0 * s20 + sse))
    theta_s[s], mu_s[s], tau2_s[s], sig2_s[s] = th_cur, mu_cur, t2_cur, s2_cur

th_hat = theta_s[500:].mean(axis=0)
print(f"Posterior means: mu={mu_s[500:].mean():.2f}, tau={np.sqrt(tau2_s[500:]).mean():.2f}, "
      f"sigma={np.sqrt(sig2_s[500:]).mean():.2f}")
print(f"Total MSE vs truth: unpooled={np.mean((ybar - th_true)**2):.2f}, "
      f"hierarchical={np.mean((th_hat - th_true)**2):.2f}")
```

## Modern Developments: Complexity Priors, Assisted Intervals, and Ranking {#sec:ch08-modern}

### Penalized Complexity Priors {#sec:ch08-pc}

A **penalized complexity (PC) prior**{{< index "penalized complexity prior" >}} derives the prior on $\tau$ from how far the hierarchical model departs from complete pooling.{{< sidenote >}}**Beyond Hoff (2009).** This material is not in Hoff’s book; Simpson et al. (2017) supply a general construction that complements the half-$t$ advice for $\tau$.{{< cite "simpson2017" >}}{{< /sidenote >}} Take $\tau = 0$ as the simple base model, measure departure by $d(\tau) = \sqrt{2\operatorname{KL}}$, and put a constant-rate (exponential) prior on $d$. Approaching the base through $\operatorname{normal}(0, \epsilon^2)$ with $\epsilon \to 0$,

$$
\sqrt{2\operatorname{KL}\bigl(\mathcal{N}(0, \tau^2)\,\|\,\mathcal{N}(0, \epsilon^2)\bigr)}
= \sqrt{\frac{\tau^2}{\epsilon^2} - 1 - \log\frac{\tau^2}{\epsilon^2}} \;\sim\; \frac{\tau}{\epsilon}
\;\Longrightarrow\; \tau \sim \operatorname{exponential}(\lambda), \quad
\lambda = -\frac{\log\alpha}{U}, \label{eq:ch08-pc}
$$

where $(U, \alpha)$ encodes one interpretable statement, $\Pr(\tau > U) = \alpha$. Distance is proportional to $\tau$, and the constant $1/\epsilon$ is absorbed into $\lambda$.

Compare {{< eqref "eq:ch08-hyperpriors" >}} with $\eta_0 = 1$, $\tau_0^2 = 100$, under which $100/\tau^2 \sim \chi^2_1$ and $\Pr(\tau < 3) \approx 0.0009$: the prior virtually forbids strong pooling. Taking $\Pr(\tau > 10) = 0.05$ gives $\lambda \approx 0.30$ and $\Pr(\tau < 3) \approx 0.59$, with its density maximal, rather than vanishing, at $\tau = 0$.

**When to use it.** With $m = 100$ schools the choice hardly matters. For small $m$ (see {{< xref "rem:ch08-modern" "full" >}}), or several variance components needing comparable scaling, prefer the PC prior; the update {{< eqref "eq:ch08-fc-tau2" >}} is then no longer conjugate, so draw $\tau$ by a one-dimensional slice or Metropolis step.

### Frequentist-Assisted Bayes Confidence Intervals {#sec:ch08-fab}

**FAB intervals**{{< index "FAB interval" >}} borrow strength across groups, yet cover each $\theta_j$ with *exactly* the nominal frequency.{{< sidenote >}}**Beyond Hoff (2009).** This material is not in Hoff’s book; Yu and Hoff himself (2018) develop it, extending an older idea of Pratt to adaptive multigroup intervals.{{< cite "yu2018" >}}{{< /sidenote >}} The credible interval centered at {{< eqref "eq:ch08-shrink-weight" >}} covers $95\%$ only on average over $\theta_j \sim \operatorname{normal}(\mu, \tau^2)$, undercovering schools far from $\mu$. With $s_j = \sigma/\sqrt{n_j}$ known, split the test error $\alpha$ unevenly as $\alpha w$ below and $\alpha(1 - w)$ above, with $w$ depending on the tested $\theta$:

$$
\begin{aligned}
C(\bar{y}_j) &= \Bigl\{\theta : \bar{y}_j + s_j\,\Phi^{-1}\bigl(\alpha(1 - w(\theta))\bigr) \le \theta \le \bar{y}_j + s_j\,\Phi^{-1}\bigl(1 - \alpha w(\theta)\bigr)\Bigr\}, \\
&\qquad \Phi^{-1}(\alpha w) - \Phi^{-1}(\alpha(1 - w)) = \frac{2 s_j(\theta - \mu)}{\tau^2}.
\end{aligned} \label{eq:ch08-fab}
$$

Every test has level $\alpha$ for *any* $w(\theta)$, so coverage is exactly $1 - \alpha$ at every $\theta_j$, even if the prior is wrong, provided $(\mu, \tau^2)$ are estimated independently of $\bar{y}_j$—for instance, from the other schools. The stated $w$ minimizes expected length under the prior: equating the ratio of the $\operatorname{normal}(\theta, s_j^2)$ to the marginal $\operatorname{normal}(\mu, s_j^2 + \tau^2)$ density at both endpoints of the acceptance region puts its midpoint at $\theta + s_j^2(\theta - \mu)/\tau^2$. As $\tau \to \infty$, $w \to \frac12$ recovers the usual $z$-interval.

For School 82 (plug-in $\mu = 48.1$, $\tau = 5$, $\sigma = 9.2$) the $z$-interval is $[30.7, 46.8]$, FAB gives $[32.0, 47.4]$, and the credible interval is $[36.3, 48.8]$.

**When to use it.** Report Hoff’s credible intervals for prior-averaged accuracy; choose FAB when every group must be covered at the nominal rate. Unknown $\sigma$ calls for the $t$-version.

### Ranking as a Compound Decision and the NPMLE {#sec:ch08-ranking}

Ranking schools is a decision problem with its own loss, and the posterior mean need not be the right ranking score.{{< sidenote >}}**Beyond Hoff (2009).** This material is not in Hoff’s book; Gu and Koenker (2023) treat ranking and selection as compound decisions, while the nonparametric MLE—an idea from the 1950s—became routinely computable through the convex optimization of Koenker and Mizera (2014).{{< cite "gu2023,koenker2014" >}}{{< /sidenote >}} Suppose we flag a fraction of schools as belonging to the lowest $\alpha$ of the population, with $\theta_j \sim G$ and $\theta_\alpha$ the $\alpha$-quantile of $G$. Subject to a cap on the number flagged, the expected number of correct flags is maximized by thresholding the **posterior tail probability**{{< index "posterior tail probability" >}}

$$
v_\alpha(\bar{y}_j, n_j) = \Pr(\theta_j \le \theta_\alpha \mid \bar{y}_j, n_j)
= \frac{\int_{-\infty}^{\theta_\alpha} \mathcal{N}(\bar{y}_j \mid \theta, \sigma^2/n_j)\,dG(\theta)}{\int \mathcal{N}(\bar{y}_j \mid \theta, \sigma^2/n_j)\,dG(\theta)}, \label{eq:ch08-tail}
$$

because the expected number of correct flags is the sum of the flagged $v_\alpha$, so one should take the largest. With equal $n_j$ this agrees with ranking by {{< eqref "eq:ch08-shrink-weight" >}}; with unequal $n_j$ it need not.

Revisit the reversal of Schools 46 and 82, whose plug-in posteriors are $\operatorname{normal}(41.28, 1.86^2)$ and $\operatorname{normal}(42.53, 3.18^2)$. For the lowest decile ($\theta_{0.10} = 41.69$), $v = 0.59$ for School 46 and $0.40$ for School 82, agreeing with the posterior means. For the lowest $2.5\%$ ($\theta_{0.025} = 38.30$), $v = 0.055$ against $0.091$: School 82’s wider posterior puts it *first*, reversing the reversal.

Normality of $G$ matters in such tails. The **NPMLE**{{< index "NPMLE" >}} $\hat{G} = \arg\max_G \sum_j \log\int \mathcal{N}(\bar{y}_j \mid \theta, \sigma^2/n_j)\,dG(\theta)$ is a convex problem with a discrete solution, and replaces $G$ in {{< eqref "eq:ch08-tail" >}}.

**When to use it.** Hoff’s posterior means suit squared-error estimation. To select or rank, use $v_\alpha$ at the cutoff that matters, with $\hat{G}$ when $m$ is large and normality doubtful.

### Computational & Symbolic Check {#sec:ch08-modern-check}

The script checks the PC tail statement below {{< eqref "eq:ch08-pc" >}}, solves {{< eqref "eq:ch08-fab" >}} for School 82, and simulates the coverage of FAB and credible intervals at fixed values of $\theta$.{{< sidenote >}}**Beyond Hoff (2009).** This computational check and its Wolfram symbolic counterpart below verify the modern methods in this section and are not in Hoff’s book.{{< /sidenote >}}

```python
import numpy as np
from scipy import optimize, stats

U, al, rng, q = 10.0, 0.05, np.random.default_rng(8), stats.norm.ppf
lam = -np.log(al) / U
tau = rng.exponential(1 / lam, size=1_000_000)   # NumPy scale = 1/rate
print(f"PC: lambda = {lam:.4f}, Pr(tau > U) = {np.mean(tau > U):.4f}, Pr(tau < 3) = {np.mean(tau < 3):.4f}")

mu, t, s, yb = 48.1, 5.0, 9.2 / np.sqrt(5), 38.76
def w(th):   # optimal split of the test error alpha at the tested value th
    return optimize.brentq(lambda x: q(al * x) - q(al * (1 - x)) - 2 * s * (th - mu) / t**2, 1e-15, 1 - 1e-15)
lo = optimize.brentq(lambda th: yb + s * q(al * (1 - w(th))) - th, 30, 60)
hi = optimize.brentq(lambda th: yb - s * q(al * w(th)) - th, 30, 60)   # -q(p) = q(1 - p)
print(f"School 82 FAB interval: [{lo:.1f}, {hi:.1f}]")
B = t**2 / (t**2 + s**2)
for th in (35.0, 48.1, 60.0):
    Y, wt = rng.normal(th, s, size=400_000), w(th)
    fab = (Y + s * q(al * (1 - wt)) <= th) & (th <= Y - s * q(al * wt))
    cred = np.abs(B * Y + (1 - B) * mu - th) <= q(1 - al / 2) * np.sqrt(B) * s
    print(f"theta = {th}: coverage FAB {fab.mean():.4f}, credible {cred.mean():.4f}")
```

{{< marginnote >}}Integrate the exponential density beyond $U$.{{< /marginnote >}}

```js
// Chapter 8 (modern): exact PC-prior tail probability & exact FAB coverage
const pcTail = await show`Assuming[lam > 0 && u > 0, Integrate[lam*Exp[-lam*x], {x, u, Infinity}]]`
```

$$
\Pr(\tau > U) = \int_U^\infty \lambda e^{-\lambda\tau}\,d\tau = e^{-\lambda U}
$$

{{< marginnote >}}Substitute the PC rate $\lambda = -\log(\alpha)/U$: the tail mass is exactly $\alpha$.{{< /marginnote >}}

```js
await show`Simplify[${pcTail} /. lam -> -Log[al]/u]`
```

$$
\Pr(\tau > U)\,\big|_{\lambda = -\log(\alpha)/U} = \alpha
$$

{{< marginnote >}}Instantiate $\lambda$ and $\Pr(\tau < 3)$ at $(U, \alpha) = (10, 0.05)$.{{< /marginnote >}}

```js
await show`N[{lam, 1 - (${pcTail} /. u -> 3)} /. lam -> -Log[5/100]/10]`
```

$$
\bigl(\lambda,\; \Pr(\tau < 3)\bigr)_{U=10,\;\alpha=0.05} = \{0.299573,0.592909\}
$$

{{< marginnote >}}Lower normal quantile of the FAB interval, via $\Phi^{-1}(p) = -\sqrt{2}\,\operatorname{erfc}^{-1}(2p)$.{{< /marginnote >}}

```js
// Normal quantile: Phi^(-1)(p) = -Sqrt[2]*InverseErfc[2*p]
const qLo = await show`-Sqrt[2]*InverseErfc[2*al*(1 - w)]`
```

$$
\Phi^{-1}\bigl(\alpha(1 - w)\bigr) = -\sqrt{2}\, \operatorname{erfc}^{-1}\bigl(2 \alpha (1-w)\bigr)
$$

{{< marginnote >}}Upper normal quantile of the FAB interval, by the same identity.{{< /marginnote >}}

```js
const qHi = await show`-Sqrt[2]*InverseErfc[2*(1 - al*w)]`
```

$$
\Phi^{-1}(1 - \alpha w) = -\sqrt{2}\, \operatorname{erfc}^{-1}\bigl(2 (1-\alpha w)\bigr)
$$

{{< marginnote >}}Evaluate $\Pr_\theta(\theta \in C) = \Phi\bigl(\Phi^{-1}(1 - \alpha w)\bigr) - \Phi\bigl(\Phi^{-1}(\alpha(1 - w))\bigr)$, since $(\theta - \bar{Y})/s$ is standard normal at every $\theta$: the split $w$ cancels.{{< /marginnote >}}

```js
await show`FullSimplify[1/2*Erfc[-(${qHi})/Sqrt[2]] - 1/2*Erfc[-(${qLo})/Sqrt[2]]]`
```

$$
\Pr_\theta\bigl(\theta \in C(\bar{Y})\bigr) = 1-\alpha
$$

{{< marginnote >}}Evaluate the left side of the $w$-equation at $w = \frac12$: it vanishes, so $\theta = \mu$ (or $\tau \to \infty$) recovers the $z$-interval.{{< /marginnote >}}

```js
await show`Simplify[(-Sqrt[2]*InverseErfc[2*al*w] + Sqrt[2]*InverseErfc[2*al*(1 - w)]) /. w -> 1/2]`
```

$$
\Bigl[\Phi^{-1}(\alpha w) - \Phi^{-1}(\alpha(1 - w))\Bigr]_{w = 1/2} = 0
$$

## Symbolic Check in Wolfram Language {#sec:ch08-wolfram}

Derives the two-group prior correlation from $(\theta_1, \theta_2) = (\mu + \delta, \mu - \delta)$, the shrinkage weight $B_j$, the symbolic shrunk-mean gap $\hat{\theta}_2 - \hat{\theta}_1$ governing ranking reversals between two groups $(n_1, \bar{y}_1)$ and $(n_2, \bar{y}_2)$, and (non-circularly from the log-density derivative) both the shape and $\nu_0/2$-scaled rate of $\sigma_0^2$, then evaluates plug-in shrinkage on Schools 46 and 82 (compare Hoff’s full MCMC means $41.31$ and $42.53$).

{{< marginnote >}}Push $\operatorname{diag}(\gamma_0^2, \tau_0^2)$ through $(\theta_1, \theta_2)^\top = A(\mu, \delta)^\top$ to get the prior covariance of the two group means.{{< /marginnote >}}

```js
// Chapter 8: Symbolic two-group correlation, ranking-reversal condition & sigma_0^2 full conditional
const A = [[1, 1], [1, -1]]
const cov2 = await show`${A} . DiagonalMatrix[{g0^2, t0^2}] . Transpose[${A}]`
```

$$
\operatorname{Cov}(\theta_1, \theta_2) = A\operatorname{diag}(\gamma_0^2, \tau_0^2)A^\top = \left( \begin{array}{cc} \gamma_0^2+\tau_0^2 & \gamma_0^2-\tau_0^2 \\ \gamma_0^2-\tau_0^2 & \gamma_0^2+\tau_0^2 \\ \end{array} \right)
$$

{{< marginnote >}}Compute the prior correlation between two group means under the $(\mu, \delta)$ parameterization.{{< /marginnote >}}

```js
await show`Together[${cov2}[[1, 2]] / ${cov2}[[1, 1]]]`
```

$$
\begin{aligned}
&\frac{(A\operatorname{diag}(\gamma_0^2, \tau_0^2)A^\top)_{1,2}}{(A\operatorname{diag}(\gamma_0^2, \tau_0^2)A^\top)_{1,1}} \\
&= \frac{\gamma_0^2-\tau_0^2}{\gamma_0^2+\tau_0^2}
\end{aligned}
$$

{{< marginnote >}}Simplify the hierarchical shrinkage weight $B_j = (n_j/\sigma^2)/(n_j/\sigma^2 + 1/\tau^2)$.{{< /marginnote >}}

```js
// Shrinkage weight B_j and symbolic shrunk-mean gap thetaHat_2 - thetaHat_1
const Bj = await show`Together[(nj / s2) / (nj / s2 + 1 / t2)]`
```

$$
B_j = \frac{n_j/\sigma^2}{n_j/\sigma^2 + 1/\tau^2} = \frac{n_j \tau^2}{\sigma^2 +n_j \tau^2}
$$

{{< marginnote >}}Derive the closed-form difference $\hat{\theta}_2 - \hat{\theta}_1$ between two shrunk group means.{{< /marginnote >}}

```js
const gapSym = await show`FullSimplify[((${Bj} /. nj -> n2)*yb2 + (1 - (${Bj} /. nj -> n2))*mu)
  - ((${Bj} /. nj -> n1)*yb1 + (1 - (${Bj} /. nj -> n1))*mu)]`
```

$$
\begin{aligned}
&\hat{\theta}_2 - \hat{\theta}_1 = \bigl[B_2\bar{y}_2 + (1-B_2)\mu\bigr] - \bigl[B_1\bar{y}_1 + (1-B_1)\mu\bigr] \\
&= \frac{\tau^2 (\mu (n_1 -n_2) \sigma^2 -n_1 (\sigma^2 +n_2 \tau^2) \bar{y}_1 +n_2 (\sigma^2 +n_1 \tau^2) \bar{y}_2)}{(\sigma^2 +n_1 \tau^2) (\sigma^2 +n_2 \tau^2)}
\end{aligned}
$$

{{< marginnote >}}Write $\log p(\sigma_0^2 \mid \nu_0, x_1, x_2, x_3)$: a $\operatorname{gamma}(a, b)$ prior times three $\operatorname{gamma}(\nu_0/2, \nu_0\sigma_0^2/2)$ likelihood terms ($m = 3$).{{< /marginnote >}}

```js
// Non-circular derivation of sigma_0^2 full conditional shape & rate (m = 3)
const logp = await show`(a - 1)*Log[s0] - b*s0 + Sum[nu0/2*Log[nu0*s0/2] - LogGamma[nu0/2]
  + (nu0/2 - 1)*Log[x] - nu0*s0*x/2, {x, {x1, x2, x3}}]`
```

$$
\begin{aligned}
&\log p(\sigma_0^2 \mid \nu_0, x_1, x_2, x_3) = (a-1)\log\sigma_0^2 - b\,\sigma_0^2 + \frac{3\nu_0}{2}\log\frac{\nu_0\sigma_0^2}{2} - 3\log\Gamma\!\left(\frac{\nu_0}{2}\right) \\
&\quad + \left(\frac{\nu_0}{2}-1\right)(\log x_1+\log x_2+\log x_3) - \frac{\nu_0\sigma_0^2}{2}(x_1+x_2+x_3)
\end{aligned}
$$

{{< marginnote >}}Differentiate in $\sigma_0^2$ and expand into powers of $\sigma_0^2$.{{< /marginnote >}}

```js
const dLogp = await show`Expand[D[${logp}, s0]]`
```

$$
\frac{\partial}{\partial \sigma_0^2}\log p = -b-\frac{1}{\sigma_0^2}+\frac{a}{\sigma_0^2}+\frac{3 \nu_0}{2 \sigma_0^2}-\frac{\nu_0 x_1}{2}-\frac{\nu_0 x_2}{2}-\frac{\nu_0 x_3}{2}
$$

{{< marginnote >}}Extract the $[(\sigma_0^2)^{-1}]$ coefficient of $\partial_{\sigma_0^2}\log p$ to verify the Gamma full-conditional shape ($m = 3$).{{< /marginnote >}}

```js
await show`Simplify[1 + Coefficient[${dLogp}, s0, -1]]`
```

$$
\begin{aligned}
&1 + [(\sigma_0^2)^{-1}]\frac{\partial}{\partial \sigma_0^2}\log p(\sigma_0^2 \mid \nu_0, x_1, x_2, x_3) \\
&= a+\frac{3 \nu_0}{2}
\end{aligned}
$$

{{< marginnote >}}Extract the constant term of $-\partial_{\sigma_0^2}\log p$ to verify the Gamma full-conditional rate.{{< /marginnote >}}

```js
await show`Simplify[-Coefficient[${dLogp}, s0, 0]]`
```

$$
\begin{aligned}
&-[(\sigma_0^2)^0]\frac{\partial}{\partial \sigma_0^2}\log p(\sigma_0^2 \mid \nu_0, x_1, x_2, x_3) \\
&= b+\frac{1}{2} \nu_0 (x_1 +x_2 +x_3)
\end{aligned}
$$

{{< marginnote >}}Instantiate shrinkage weights and posterior means for School 46 ($n=21$) and School 82 ($n=5$).{{< /marginnote >}}

```js
// Instantiate plug-in shrinkage on School 46 (n1=21, yb1=40.18) vs School 82 (n2=5, yb2=38.76)
await show`N[Table[{w, w*p[[2]] + (1 - w)*48.1} /. w -> (${Bj} /. {nj -> p[[1]], t2 -> 25, s2 -> 84.64}), {p, {{21, 40.18}, {5, 38.76}}}]]`
```

$$
\begin{aligned}
&\bigl(B_j,\; \hat{\theta}_j\bigr)_{\text{School 46, School 82}} \\
&= \left( \begin{array}{cc} 0.861164 & 41.2796 \\ 0.59626 & 42.5309 \\ \end{array} \right)
\end{aligned}
$$

{{< marginnote >}}Evaluate the shrunk difference $\hat{\theta}_{82} - \hat{\theta}_{46}$, confirming the ranking reversal over the raw gap.{{< /marginnote >}}

```js
await show`N[${gapSym} /. {n1 -> 21, yb1 -> 40.18, n2 -> 5, yb2 -> 38.76, mu -> 48.1, t2 -> 25, s2 -> 84.64}]`
```

$$
(\hat{\theta}_{82} - \hat{\theta}_{46})_{\text{shrunk}} = 1.25135
$$

## Exercises {#sec:ch08-exercises}

{{< thm kind="exercise" label="ex:ch08-stein-risk" >}}
In the Python script above, vary the true between-school standard deviation $\tau \in \{1, 3, 5, 15\}$ while holding $\sigma = 9.2$ fixed. Compare the total estimation MSE $\frac{1}{m}\sum_{j=1}^m (\hat{\theta}_j - \theta_j)^2$ of the hierarchical posterior mean against both the unpooled sample means $\bar{y}_j$ and the completely pooled grand mean $\bar{y}$. When is the gain from partial pooling largest?
{{< /thm >}}

{{< details summary="Symbolic Solution & Instantiation" >}}

{{< marginnote >}}Simplify the oracle hierarchical Bayes risk (MSE) $(\sigma^2/n)\tau^2 / (\sigma^2/n + \tau^2)$ for equal group sizes $n$.{{< /marginnote >}}

```js
// Ex 8.1: Oracle Bayes risk (MSE, equal n) of unpooled, completely pooled, and hierarchical partial pooling
const rPart = await show`FullSimplify[(s2/n)*t2 / (s2/n + t2)]`
```

$$
\begin{aligned}
&\operatorname{Risk}_{\text{hier}}(\sigma^2, \tau^2, n) \\
&= \frac{\sigma^2 \tau^2}{\sigma^2 +n \tau^2}
\end{aligned}
$$

{{< marginnote >}}Express the risk ratio relative to unpooled $\bar{y}_j$ as the shrinkage weight $B_j$.{{< /marginnote >}}

```js
await show`FullSimplify[${rPart} / (s2/n)]`
```

$$
B_j = \frac{\operatorname{Risk}_{\text{hier}}}{\sigma^2/n} = \frac{n \tau^2}{\sigma^2 +n \tau^2}
$$

{{< marginnote >}}Express the risk ratio relative to complete pooling as $1 - B_j$.{{< /marginnote >}}

```js
await show`FullSimplify[${rPart} / t2]`
```

$$
1 - B_j = \frac{\operatorname{Risk}_{\text{hier}}}{\tau^2} = \frac{\sigma^2}{\sigma^2 +n \tau^2}
$$

{{< marginnote >}}Tabulate unpooled, pooled, and hierarchical MSE across $\tau \in \{1, 3, 5, 15\}$ at $\sigma^2 = 84.64, n = 10$.{{< /marginnote >}}

```js
// Instantiate {unpooled, pooled, hierarchical} MSE at s2 = 84.64, n = 10 for tau in {1, 3, 5, 15}
await show`N[Table[{s2/n, tau^2, ${rPart} /. t2 -> tau^2} /. {s2 -> 84.64, n -> 10}, {tau, {1, 3, 5, 15}}]]`
```

$$
\begin{aligned}
&\bigl(\text{unpooled},\; \text{pooled},\; \text{hierarchical MSE}\bigr)_{\tau \in \{1,\,3,\,5,\,15\}} \\
&= \left( \begin{array}{ccc} 8.464 & 1. & 0.894336 \\ 8.464 & 9. & 4.36189 \\ 8.464 & 25. & 6.32321 \\ 8.464 & 225. & 8.15715 \\ \end{array} \right)
\end{aligned}
$$

{{< /details >}}

{{< thm kind="exercise" label="ex:ch08-heterogeneous-gibbs" >}}
Extend the Python Gibbs sampler to allow heterogeneous school variances $\sigma_1^2, \dots, \sigma_m^2$ using {{< eqref "eq:ch08-fc-sig0" >}} and {{< eqref "eq:ch08-fc-nu0" >}} over the grid $\nu_0 \in \{1, 2, \dots, 50\}$ (remembering to subtract `log_p.max()` before exponentiating when normalizing $\nu_0$). Verify that the factor $\nu_0$ in the rate of {{< eqref "eq:ch08-fc-sig0" >}} is required by checking whether your sampler recovers known synthetic values $(\nu_0, \sigma_0^2) = (10, 80)$.
{{< /thm >}}

{{< details summary="Symbolic Solution & Instantiation" >}}

{{< marginnote >}}Compute the posterior mean of $\sigma_0^2$ under the correct full-conditional rate $b + \nu_0/2\sum_j \sigma_j^{-2}$.{{< /marginnote >}}

```js
// Ex 8.2: Bias of omitting nu0 in the full conditional rate of sigma_0^2 (plugging in sum sigma_j^{-2} = m / sigma_0^2)
const meanCorrect = await show`FullSimplify[(a + m*nu0/2) / (b + (nu0/2)*m/s0True)]`
```

$$
\begin{aligned}
&\mathbb{E}[\sigma_0^2 \mid \text{correct rate},\; \sum_j \sigma_j^{-2} = m/\sigma_0^2] \\
&= \frac{(2 a+m \nu_0) \sigma_0^2}{m \nu_0 +2 b \sigma_0^2}
\end{aligned}
$$

{{< marginnote >}}Compute the distorted posterior mean when the factor $\nu_0$ is mistakenly omitted from the rate.{{< /marginnote >}}

```js
const meanBuggy = await show`FullSimplify[(a + m*nu0/2) / (b + (1/2)*m/s0True)]`
```

$$
\begin{aligned}
&\mathbb{E}[\sigma_0^2 \mid \text{buggy rate},\; \sum_j \sigma_j^{-2} = m/\sigma_0^2] \\
&= \frac{(2 a+m \nu_0) \sigma_0^2}{m+2 b \sigma_0^2}
\end{aligned}
$$

{{< marginnote >}}Take $m \to \infty$ to prove the bug inflates the posterior mean by an exact asymptotic factor of $\nu_0$.{{< /marginnote >}}

```js
await show`Assuming[nu0 > 0 && s0True > 0, Limit[${meanBuggy} / ${meanCorrect}, m -> Infinity]]`
```

$$
\begin{aligned}
&\lim_{m \to \infty} \frac{\mathbb{E}[\sigma_0^2 \mid \text{buggy}]}{\mathbb{E}[\sigma_0^2 \mid \text{correct}]} \\
&= \nu_0
\end{aligned}
$$

{{< marginnote >}}Instantiate correct mean, buggy mean, and their ratio at $(\nu_0 = 10, \sigma_0^2 = 80, m = 100)$.{{< /marginnote >}}

```js
await show`N[{${meanCorrect}, ${meanBuggy}, ${meanBuggy}/${meanCorrect}} /. {a -> 1, b -> 1/100, m -> 100, nu0 -> 10, s0True -> 80}]`
```

$$
\begin{aligned}
&\bigl(\mathbb{E}_{\text{correct}},\; \mathbb{E}_{\text{buggy}},\; \text{ratio}\bigr)_{\nu_0=10,\;\sigma_0^2=80,\;m=100} \\
&= \{80.0319,788.976,9.85827\}
\end{aligned}
$$

{{< /details >}}

{{< thm kind="exercise" label="ex:ch08-noncentered" >}}
Simulate $m = 8$ groups with $n_j = 5$, $\sigma = 10$, and very small true between-group spread $\tau = 0.5$. Compare the lag-1 autocorrelation and $S_{\text{eff}}$ of $\tau$ under (a) the centered Gibbs sampler {{< xref "prop:ch08-fc" "full" >}} and (b) the non-centered reparameterization $\theta_j = \mu + \tau\tilde{\theta}_j$ (see {{< xref "rem:ch08-modern" "full" >}}).
{{< /thm >}}

{{< details summary="Symbolic Solution & Instantiation" >}}

{{< marginnote >}}Derive the posterior correlation $\operatorname{Corr}(\theta_j, \mu \mid y, \sigma^2, \tau^2)$ across $m$ groups under centered parameterization.{{< /marginnote >}}

```js
// Ex 8.3: Centered posterior coupling across m groups & centered mu-chain lag-1 ACF at fixed tau
const corrCent = await show`FullSimplify[Sqrt[(s2/nj) / (s2/nj + m*t2)]]`
```

$$
\begin{aligned}
&\operatorname{Corr}(\theta_j, \mu \mid y, \sigma^2, \tau^2) \\
&= \sqrt{\frac{\sigma^2}{\sigma^2 +m n_j \tau^2}}
\end{aligned}
$$

{{< marginnote >}}Derive the lag-1 autocorrelation of the centered $\mu$-chain at fixed $\tau$.{{< /marginnote >}}

```js
const acfMu = await show`FullSimplify[(s2/nj) / (s2/nj + t2)]`
```

$$
\operatorname{ACF}_1(\mu^{(s)} \mid \tau) = \frac{\sigma^2}{\sigma^2 +n_j \tau^2}
$$

{{< marginnote >}}Evaluate both coupling diagnostics at $m = 8, n_j = 5, \sigma = 10, \tau = 0.5$.{{< /marginnote >}}

```js
await show`N[{${corrCent}, ${acfMu}} /. {s2 -> 100, nj -> 5, m -> 8, t2 -> 1/4}]`
```

$$
\begin{aligned}
&\bigl(\operatorname{Corr}(\theta_j, \mu \mid y, \tau),\; \operatorname{ACF}_1(\mu \mid \tau)\bigr)_{m=8,\; n_j=5,\; \sigma=10,\; \tau=0.5} \\
&= \{0.953463,0.987654\}
\end{aligned}
$$

{{< /details >}}
