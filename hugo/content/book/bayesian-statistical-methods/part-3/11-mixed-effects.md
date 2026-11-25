---
title: "Linear and Generalized Linear Mixed Effects Models"
linkTitle: "Mixed Effects Models"
weight: 30
label: "ch:mixed"
---

{{< newthought "Mixed effects models" />}} are the natural marriage of hierarchical shrinkage ({{< xref "ch:hierarchical" "full" >}}), multivariate normal covariance modeling ({{< xref "ch:mvn" "full" >}}), regression ({{< xref "ch:regression" "full" >}}), and Metropolis–Hastings ({{< xref "ch:mh" "full" >}}).{{< cite "hoff2009,gelman2007" >}} Instead of allowing only a scalar group mean $\theta_j$ to vary across schools or subjects, we now let an entire **regression coefficient vector** $\boldsymbol{\beta}_j \in \mathbb{R}^p$—both intercepts *and* slopes—vary across groups while borrowing strength across the population.

## Hierarchical Linear Regression (Linear Mixed Effects) {#sec:ch11-lme}

Return to the $m = 100$ public high schools from the 2002 Educational Longitudinal Study ({{< xref "ch:hierarchical" "full" >}}), now recording both math score $y_{i,j}$ and within-school centered socioeconomic status $x_{i,j}$ for student $i = 1, \dots, n_j$ in school $j = 1, \dots, m$. Fitting $m$ separate OLS lines suggests that *both* the baseline achievement (intercept $\beta_{j,1}$) and the SES gradient (slope $\beta_{j,2}$) vary from school to school—yet small schools ($n_j \approx 5$) produce wildly noisy OLS slopes, some even negative!

A **hierarchical linear regression**{{< index "hierarchical linear regression" >}} (or **linear mixed effects (LME)**{{< index "linear mixed effects model" >}} model){{< cite "lindley1972" >}} stacks each school’s responses into $\mathbf{y}_j \in \mathbb{R}^{n_j}$ with $n_j \times p$ design matrix $\mathbf{X}_j$ and models the group coefficient vectors as draws from a shared multivariate normal population:

$$
\begin{aligned}
\text{Within-group model:} &\quad \mathbf{y}_j \mid \mathbf{X}_j, \boldsymbol{\beta}_j, \sigma^2 \sim \mathcal{N}_{n_j}(\mathbf{X}_j \boldsymbol{\beta}_j,\, \sigma^2 I_{n_j}), \qquad j = 1, \dots, m, \\
\text{Between-group model:} &\quad \boldsymbol{\beta}_1, \dots, \boldsymbol{\beta}_m \mid \boldsymbol{\theta}, \Sigma \stackrel{\text{i.i.d.}}{\sim} \mathcal{N}_p(\boldsymbol{\theta}, \Sigma).
\end{aligned} \label{eq:ch11-lme}
$$

Writing $\boldsymbol{\beta}_j = \boldsymbol{\theta} + \boldsymbol{\gamma}_j$ with $\boldsymbol{\gamma}_j \stackrel{\text{i.i.d.}}{\sim} \mathcal{N}_p(\mathbf{0}, \Sigma)$ explains the classical “mixed effects” terminology:
- $\boldsymbol{\theta}$ is the **fixed effect**{{< index "fixed effects" >}} (the population-average intercept and slope across all schools).
- $\boldsymbol{\gamma}_j$ is the **random effect**{{< index "random effects" >}} (school $j$’s specific deviation from $\boldsymbol{\theta}$), governed by the $p \times p$ between-group covariance matrix $\Sigma$, whose off-diagonal entries capture whether high-achieving schools also have steeper or flatter SES slopes!

### Adding Group-Level Covariates {#sec:ch11-group-cov}

What if some predictors (such as school size or public/private status) vary only at the *group* level, or have effects assumed constant across all groups? Partitioning predictors into covariates with group-specific coefficients ($\mathbf{x}_{i,j}$) and covariates with common coefficients ($\mathbf{z}_{i,j}$, including every group-level covariate) yields the general LME form

$$
y_{i,j} = \boldsymbol{\beta}_j^T \mathbf{x}_{i,j} + \boldsymbol{\alpha}^T \mathbf{z}_{i,j} + \epsilon_{i,j}, \qquad \epsilon_{i,j} \stackrel{\text{i.i.d.}}{\sim} \mathcal{N}(0, \sigma^2), \label{eq:ch11-lme-general}
$$

which integrates seamlessly into the exact same Gibbs framework by adding one linear-regression block for $\boldsymbol{\alpha}$ given the partial residuals $y_{i,j} - \boldsymbol{\beta}_j^T \mathbf{x}_{i,j}$.

## Modular Gibbs Sampling for the LME Model {#sec:ch11-gibbs}

Equipping $(\boldsymbol{\theta}, \Sigma, \sigma^2)$ with the standard semiconjugate priors from Chapters 7 and 9,

$$
\boldsymbol{\theta} \sim \mathcal{N}_p(\boldsymbol{\mu}_0, \Lambda_0), \qquad
\Sigma \sim \operatorname{inverse-Wishart}(\eta_0, S_0^{-1}), \qquad
\frac{1}{\sigma^2} \sim \operatorname{gamma}\!\left(\frac{\nu_0}{2}, \frac{\nu_0 \sigma_0^2}{2}\right), \label{eq:ch11-priors}
$$

requires **zero new derivations**: every single full conditional is a direct drop-in copy of a formula we already proved!

{{< thm kind="algorithm" note="Modular Four-Block Gibbs Sampler for the LME Model" label="alg:ch11-lme-gibbs" >}}
Initialize $\boldsymbol{\beta}_1^{(0)}, \dots, \boldsymbol{\beta}_m^{(0)}$ (e.g., at per-group OLS estimates), $\boldsymbol{\theta}^{(0)}$, $\Sigma^{(0)}$, and $\sigma^{2(0)}$. For $s = 1, \dots, S$:

1. **Group coefficients $\boldsymbol{\beta}_j^{(s)}$** (conditionally independent across $j = 1, \dots, m$; Ch. 9 regression update with prior $\mathcal{N}_p(\boldsymbol{\theta}, \Sigma)$):

   $$
   \boldsymbol{\beta}_j \mid \mathbf{y}_j, \mathbf{X}_j, \boldsymbol{\theta}, \Sigma, \sigma^2
   \sim \mathcal{N}_p(\mathbf{m}_j, V_j), \qquad
   V_j = \left(\Sigma^{-1} + \frac{\mathbf{X}_j^T \mathbf{X}_j}{\sigma^2}\right)^{-1}, \qquad
   \mathbf{m}_j = V_j\!\left(\Sigma^{-1}\boldsymbol{\theta} + \frac{\mathbf{X}_j^T \mathbf{y}_j}{\sigma^2}\right). \label{eq:ch11-fc-betaj}
   $$

2. **Population mean vector $\boldsymbol{\theta}^{(s)}$** (Ch. 7 MVN mean update treating $\boldsymbol{\beta}_1, \dots, \boldsymbol{\beta}_m$ as data):

   $$
   \boldsymbol{\theta} \mid \boldsymbol{\beta}_{1:m}, \Sigma \sim \mathcal{N}_p(\boldsymbol{\mu}_m, \Lambda_m), \qquad
   \Lambda_m = \left(\Lambda_0^{-1} + m\Sigma^{-1}\right)^{-1}, \qquad
   \boldsymbol{\mu}_m = \Lambda_m\!\left(\Lambda_0^{-1}\boldsymbol{\mu}_0 + m\Sigma^{-1}\bar{\boldsymbol{\beta}}\right). \label{eq:ch11-fc-theta}
   $$

3. **Between-group covariance $\Sigma^{(s)}$** (Ch. 7 inverse-Wishart update with $\mathbf{S}_{\boldsymbol{\theta}} = \sum_{j=1}^m (\boldsymbol{\beta}_j - \boldsymbol{\theta})(\boldsymbol{\beta}_j - \boldsymbol{\theta})^T$):

   $$
   \Sigma \mid \boldsymbol{\beta}_{1:m}, \boldsymbol{\theta}
   \sim \operatorname{inverse-Wishart}\!\left(\eta_0 + m,\; (S_0 + \mathbf{S}_{\boldsymbol{\theta}})^{-1}\right). \label{eq:ch11-fc-sigma}
   $$

4. **Within-group precision $1/\sigma^{2(s)}$** (Ch. 9 variance update pooling all $N = \sum_{j=1}^m n_j$ residuals):

   $$
   \frac{1}{\sigma^2} \mid \boldsymbol{\beta}_{1:m}, \mathbf{y}
   \sim \operatorname{gamma}\!\left(\frac{\nu_0 + N}{2},\; \frac{\nu_0 \sigma_0^2 + \sum_{j=1}^m \lVert \mathbf{y}_j - \mathbf{X}_j\boldsymbol{\beta}_j \rVert^2}{2}\right). \label{eq:ch11-fc-sig2}
   $$
{{< /thm >}}

### Population Slopes vs. Predictive Slopes {#sec:ch11-els-slopes}

In Hoff’s 100-school ELS analysis, fitting {{< xref "alg:ch11-lme-gibbs" "full" >}} shrinks the noisy negative OLS slopes of small schools cleanly toward the positive population average ($\hat{\theta}_2 \approx 2.4$ math points per unit SES), while preserving real heterogeneity among larger schools. Moreover, comparing two distinct posteriors resolves an essential scientific question:
- **Posterior of the population average slope** $p(\theta_2 \mid \mathbf{y})$: sharply concentrated above zero (95% CI $(1.83, 2.96)$), proving that *on average across schools*, higher SES is associated with higher math scores.
- **Posterior predictive distribution of a new school’s slope** $\tilde{\beta}_2^{(s)} \sim \mathcal{N}_p(\boldsymbol{\theta}^{(s)}, \Sigma^{(s)})$: much wider, with $\Pr(\tilde{\beta}_2 < 0 \mid \mathbf{y}, \mathbf{X}) \approx 0.07$—showing that individual schools *can* still have flat or slightly negative SES gradients despite the strong positive population average!

## Generalized Linear Mixed Effects Models (GLMMs) {#sec:ch11-glmm}

When the within-group responses are counts or binary outcomes rather than continuous normal measurements, we replace the normal level-1 likelihood in {{< eqref "eq:ch11-lme" >}} with a generalized linear model (GLM, {{< xref "ch:mh" "full" >}}). In Hoff’s mouse-tumor example, researchers recorded tumor counts $y_{i,j}$ at spatial locations $x_{i,j} \in (0, 1)$ along the small intestine of $m = 21$ mice, modeled with a **Poisson GLMM**{{< index "generalized linear mixed effects model" >}} using a quartic polynomial in location:

$$
y_{i,j} \mid \mathbf{x}_{i,j}, \boldsymbol{\beta}_j \stackrel{\text{indep.}}{\sim} \operatorname{Poisson}\!\bigl(\exp(\boldsymbol{\beta}_j^T \mathbf{x}_{i,j})\bigr), \qquad
\boldsymbol{\beta}_1, \dots, \boldsymbol{\beta}_m \mid \boldsymbol{\theta}, \Sigma \stackrel{\text{i.i.d.}}{\sim} \mathcal{N}_p(\boldsymbol{\theta}, \Sigma). \label{eq:ch11-glmm}
$$

Notice the beauty of the hierarchical DAG: **only the level-1 update for $\boldsymbol{\beta}_j$ loses conjugacy!** Because the between-group layer $\boldsymbol{\beta}_j \mid \boldsymbol{\theta}, \Sigma \sim \mathcal{N}_p(\boldsymbol{\theta}, \Sigma)$ is still multivariate normal, the full conditionals for $\boldsymbol{\theta}$ and $\Sigma$ are *unchanged*—we simply swap Step 1 of {{< xref "alg:ch11-lme-gibbs" "full" >}} for a Metropolis–Hastings update, producing a hybrid **Metropolis within Gibbs**{{< index "Metropolis within Gibbs" >}} sampler:

{{< thm kind="algorithm" note="Metropolis-within-Gibbs Sampler for a Poisson GLMM" label="alg:ch11-glmm-mwg" >}}
Initialize $\boldsymbol{\beta}_{1:m}^{(0)}, \boldsymbol{\theta}^{(0)}, \Sigma^{(0)}$ and proposal scale $c > 0$. For $s = 1, \dots, S$:

1. **MH block for each $\boldsymbol{\beta}_j$** ($j = 1, \dots, m$, independently): propose $\boldsymbol{\beta}_j^* \sim \mathcal{N}_p(\boldsymbol{\beta}_j^{(s-1)},\, c\,\Sigma^{(s-1)})$ (or a group covariance $V_j$ fixed after a pilot run so the proposal stays symmetric). Compute the symmetric log-acceptance ratio

   $$
   \begin{aligned}
   \log r_j
   &= \sum_{i=1}^{n_j} \bigl[\log p_{\text{Pois}}(y_{i,j} \mid e^{\boldsymbol{\beta}_j^{*T}\mathbf{x}_{i,j}}) - \log p_{\text{Pois}}(y_{i,j} \mid e^{\boldsymbol{\beta}_j^{(s-1)T}\mathbf{x}_{i,j}})\bigr] \\
   &\quad + \log p_{\mathcal{N}}(\boldsymbol{\beta}_j^* \mid \boldsymbol{\theta}^{(s-1)}, \Sigma^{(s-1)}) - \log p_{\mathcal{N}}(\boldsymbol{\beta}_j^{(s-1)} \mid \boldsymbol{\theta}^{(s-1)}, \Sigma^{(s-1)}),
   \end{aligned}
   $$

   and accept $\boldsymbol{\beta}_j^{(s)} = \boldsymbol{\beta}_j^*$ with probability $\min(1, r_j)$.

2. **Exact Gibbs block for $\boldsymbol{\theta}^{(s)}$**: draw from {{< eqref "eq:ch11-fc-theta" >}}.
3. **Exact Gibbs block for $\Sigma^{(s)}$**: draw from {{< eqref "eq:ch11-fc-sigma" >}}.
{{< /thm >}}

### Three Cumulative Layers of Uncertainty {#sec:ch11-layers}

A fitted GLMM lets us separate three conceptually distinct predictive targets at any covariate location $\mathbf{x}$, each adding a new source of variance ({{< xref "fig:ch11-layers" "full" >}}):

1. **Typical (median) group’s intensity** $\exp(\boldsymbol{\theta}^{(s)T}\mathbf{x})$: reflects only estimation uncertainty in the center curve $\boldsymbol{\theta}$ (narrowest band; note that because $\exp$ is convex, the *population-average* rate across groups is strictly larger,

   $$
   E[\exp(\tilde{\boldsymbol{\beta}}^T\mathbf{x}) \mid \boldsymbol{\theta}, \Sigma] = \exp(\boldsymbol{\theta}^T\mathbf{x} + \frac{1}{2}\mathbf{x}^T\Sigma\mathbf{x})
   $$

   ).
2. **New group’s intensity** $\exp(\tilde{\boldsymbol{\beta}}^{(s)T}\mathbf{x})$ with $\tilde{\boldsymbol{\beta}}^{(s)} \sim \mathcal{N}_p(\boldsymbol{\theta}^{(s)}, \Sigma^{(s)})$: adds *between-group heterogeneity* $\Sigma$ (substantially wider).
3. **New individual count** $\tilde{Y}^{(s)} \sim \operatorname{Poisson}\bigl(\exp(\tilde{\boldsymbol{\beta}}^{(s)T}\mathbf{x})\bigr)$: adds *within-group Poisson sampling noise* (widest band—the honest interval for forecasting a new observation).

{{< fig src="images/bayesian-hoff/fig-ch11-uncertainty-layers.svg" type="fullwidth" label="fig:ch11-layers" alt="Three panels comparing 95 percent intervals across location x in a Poisson GLMM: narrowest band for typical group rate exp(theta^T x), medium band for a new group rate exp(beta_tilde^T x), and widest band for a new count Y_tilde given x" short="Three cumulative layers of uncertainty in a Poisson GLMM" >}}Three nested layers of uncertainty in a Poisson GLMM. Left: uncertainty in the typical (median) group’s rate $\exp(\boldsymbol{\theta}^T\mathbf{x})$. Center: predictive rate $\exp(\tilde{\boldsymbol{\beta}}^T\mathbf{x})$ for an unseen mouse, adding between-mouse variance $\Sigma$. Right: posterior predictive count $\tilde{Y} \mid \mathbf{x}$, adding Poisson sampling noise.{{< /fig >}}

{{< remark note="Mixing in hierarchical mixed models" label="rem:ch11-mixing" >}}
Just as in {{< xref "ch:hierarchical" "full" >}}, when a random-effect variance component $\Sigma_{k,k}$ is small relative to within-group noise, the centered update $\boldsymbol{\beta}_j \sim \mathcal{N}_p(\boldsymbol{\theta}, \Sigma)$ can exhibit high autocorrelation between $\boldsymbol{\beta}_{1:m}$ and $\Sigma$. Writing $\boldsymbol{\beta}_j = \boldsymbol{\theta} + L\,\tilde{\boldsymbol{\gamma}}_j$ (where $\Sigma = L L^T$ and $\tilde{\boldsymbol{\gamma}}_j \sim \mathcal{N}_p(\mathbf{0}, I_p)$) yields the multivariate **non-centered parameterization**{{< cite "papaspiliopoulos2007" >}}, which often accelerates mixing dramatically in weakly informed mixed models.
{{< /remark >}}

```python
import numpy as np
from scipy import stats

# Modular 4-block Gibbs sampler for a 2-parameter LME model (random intercept & slope)
rng = np.random.default_rng(11)
m, p = 40, 2
theta_true = np.array([48.0, 2.5])
Sigma_true = np.array([[20.0, 2.0], [2.0, 1.5]])
sig2_true = 64.0

# Simulate grouped school data with centered covariate x_ij
n_j = rng.integers(5, 25, size=m)
beta_true = rng.multivariate_normal(theta_true, Sigma_true, size=m)
X_list, y_list = [], []
for j in range(m):
    x = rng.normal(0.0, 1.0, size=n_j[j])
    x -= x.mean()
    Xj = np.column_stack([np.ones(n_j[j]), x])
    yj = Xj @ beta_true[j] + rng.normal(0.0, np.sqrt(sig2_true), size=n_j[j])
    X_list.append(Xj)
    y_list.append(yj)
N = int(n_j.sum())

# Weakly informative priors
mu0 = np.array([50.0, 0.0])
L0_inv = np.linalg.inv(np.diag([100.0, 25.0]))
eta0, S0 = p + 2.0, np.diag([25.0, 4.0])
nu0, s20 = 1.0, 64.0

S = 2_500
theta_s, Sigma_s, beta_s = np.empty((S, p)), np.empty((S, p, p)), np.empty((S, m, p))
beta_cur = np.tile(mu0, (m, 1))
th_cur, Sig_cur, s2_cur = mu0.copy(), S0.copy(), 64.0

for s in range(S):
    Sig_inv = np.linalg.inv(Sig_cur)
    # 1. Update each group's regression vector beta_j
    sse = 0.0
    for j in range(m):
        Xj, yj = X_list[j], y_list[j]
        Vj = np.linalg.inv(Sig_inv + (Xj.T @ Xj) / s2_cur)
        mj = Vj @ (Sig_inv @ th_cur + (Xj.T @ yj) / s2_cur)
        beta_cur[j] = rng.multivariate_normal(mj, Vj)
        r = yj - Xj @ beta_cur[j]
        sse += float(r @ r)
    # 2. Update population mean theta
    Lm = np.linalg.inv(L0_inv + m * Sig_inv)
    mum = Lm @ (L0_inv @ mu0 + m * Sig_inv @ beta_cur.mean(axis=0))
    th_cur = rng.multivariate_normal(mum, Lm)
    # 3. Update between-group covariance Sigma (scipy scale = S0 + S_theta)
    diff = beta_cur - th_cur
    Sig_cur = stats.invwishart.rvs(df=eta0 + m, scale=S0 + diff.T @ diff, random_state=rng)
    # 4. Update residual variance sigma^2 (numpy scale = 1/rate)
    s2_cur = 1.0 / rng.gamma((nu0 + N) / 2.0, 2.0 / (nu0 * s20 + sse))
    theta_s[s], Sigma_s[s], beta_s[s] = th_cur, Sig_cur, beta_cur

burn = 500
print("Posterior E[theta | y]:", np.round(theta_s[burn:].mean(axis=0), 2), "(truth:", theta_true, ")")
# Predictive slope for a brand-new school
b_new = np.array([rng.multivariate_normal(th, Sg) for th, Sg in zip(theta_s[burn:], Sigma_s[burn:])])
print(f"Pr(theta_2 > 0 | y) = {np.mean(theta_s[burn:, 1] > 0):.3f}, "
      f"Pr(beta_new_2 > 0 | y) = {np.mean(b_new[:, 1] > 0):.3f}")
```

## Modern Developments: Augmentation, Crossed Effects, and INLA {#sec:ch11-modern}

### Pólya–Gamma Augmentation for Logistic and Negative-Binomial GLMMs {#sec:ch11-polyagamma}

Replacing the Poisson in {{< eqref "eq:ch11-glmm" >}} by a logistic or negative-binomial likelihood still breaks Step 1 of {{< xref "alg:ch11-lme-gibbs" "full" >}}, but for *those two* families a latent variable repairs it exactly.{{< sidenote >}}**Beyond Hoff (2009).** This material is not in Hoff’s book; Pólya–Gamma augmentation is due to Polson, Scott, and Windle (2013) and replaces the Metropolis block for logistic and negative-binomial responses.{{< /sidenote >}} Suppose the likelihood of $y_{i,j}$ is proportional to $e^{a\psi}/(1 + e^\psi)^b$ in $\psi = \boldsymbol{\beta}_j^T\mathbf{x}_{i,j}$: Bernoulli has $(a, b) = (y, 1)$, and negative-binomial with size $r$ and log-odds $\psi$ has $(a, b) = (y, y + r)$. With $\kappa = a - b/2$ and $\operatorname{PG}$ the **Pólya–Gamma**{{< index "Pólya–Gamma distribution" >}} family,{{< cite "polson2013" >}}

$$
\begin{aligned}
\frac{e^{a\psi}}{(1 + e^\psi)^b} &= 2^{-b}e^{\kappa\psi}\,E_{\omega \sim \operatorname{PG}(b, 0)}\bigl[e^{-\omega\psi^2/2}\bigr], \qquad
\omega_{i,j} \mid \boldsymbol{\beta}_j \sim \operatorname{PG}(b_{i,j},\, \boldsymbol{\beta}_j^T\mathbf{x}_{i,j}), \\
\boldsymbol{\beta}_j \mid \boldsymbol{\omega}, \mathbf{y}_j, \boldsymbol{\theta}, \Sigma &\sim \mathcal{N}_p(\mathbf{m}_j, V_j), \qquad
V_j = (\Sigma^{-1} + \mathbf{X}_j^T\operatorname{diag}(\boldsymbol{\omega}_j)\mathbf{X}_j)^{-1}, \quad
\mathbf{m}_j = V_j(\Sigma^{-1}\boldsymbol{\theta} + \mathbf{X}_j^T\boldsymbol{\kappa}_j).
\end{aligned} \label{eq:ch11-pg}
$$

*Why it holds.* Write $(1 + e^\psi)^{-b} = 2^{-b}e^{-b\psi/2}\cosh^{-b}(\psi/2)$; the Laplace transform of $\operatorname{PG}(b, 0)$ is, by construction, $E[e^{-\omega t}] = \cosh^{-b}(\sqrt{t/2})$, taken at $t = \psi^2/2$. Given $\omega$ the exponent is quadratic in $\boldsymbol{\beta}_j$, and the update is {{< eqref "eq:ch11-fc-betaj" >}} with $\omega_{i,j}$ as observation-specific precisions. The draws of $\boldsymbol{\theta}$ and $\Sigma$ are unchanged. For ordinary logistic regression with a normal prior this Gibbs chain is uniformly ergodic;{{< cite "choi2013" >}} that theorem concerns fixed effects, not the full hierarchical scan. The **Poisson** likelihood lacks the denominator, is only an $r \to \infty$ limit, and is *not* covered.

**When to use it.** Use it for logistic and negative-binomial mixed models (an unknown $r$ needs its own update): no proposal to tune. For Poisson GLMMs keep Hoff’s {{< xref "alg:ch11-glmm-mwg" "full" >}} or use HMC ({{< xref "sec:ch10-hmc" "full" >}}).

### Scalable Collapsed Gibbs for Crossed Random Effects {#sec:ch11-crossed}

Every group in {{< eqref "eq:ch11-lme" >}} is nested, so the $\boldsymbol{\beta}_j$ are conditionally independent; if instead each test score belongs to a student *and* an exam item, the random effects are **crossed**{{< index "crossed random effects" >}} and the modular sampler slows down as the data grow.{{< sidenote >}}**Beyond Hoff (2009).** This material is not in Hoff’s book; Papaspiliopoulos, Roberts, and Zanella (2020) analyze crossed effects, and Ascolani and Zanella (2024) the nested two-level models of this chapter.{{< /sidenote >}} Take $y_{s,k} = \mu + a_s + b_k + \epsilon_{s,k}$ with $s \le I$, $k \le J$, one observation per cell ($N = IJ$), a flat prior on $\mu$, and known variances $\sigma_a^2, \sigma_b^2, \sigma^2$. The plain scan $\mu, \mathbf{a}, \mathbf{b}$ has relaxation time $T$, and the collapsed sampler replaces its $\mu$ update as follows:{{< cite "papaspiliopoulos2020" >}}

$$
T = 1 + \frac{\max\{J\sigma_a^2,\, I\sigma_b^2\}}{\sigma^2}, \qquad
\mu \mid \mathbf{b}, \mathbf{y} \sim \operatorname{normal}\!\left(\bar{y} - \bar{b},\; \frac{\sigma_a^2 + \sigma^2/J}{I}\right) \;\text{ then }\; \mathbf{a} \mid \mu, \mathbf{b}, \mathbf{y}, \label{eq:ch11-crossed}
$$

followed by the same pair with $\mathbf{a}$ and $\mathbf{b}$ exchanged.

*Why it holds.* In the plain scan the averages satisfy $E[\bar{a}' \mid \bar{a}] = c_a\bar{a}$ with $c_a = J\sigma_a^2/(J\sigma_a^2 + \sigma^2)$ (and $c_b = I\sigma_b^2/(I\sigma_b^2 + \sigma^2)$ likewise), and the corresponding map for $(\bar{a}, \bar{b})$ is triangular with eigenvalues $c_a, c_b$; contrasts mix at once. Since $\max(I, J) \ge \sqrt{N}$, for fixed variances $T$ is at least of order $\sqrt{N}$ at a cost of $O(N)$ per scan, hence at least of order $N^{3/2}$ in total. Integrating $\mathbf{a}$ out removes the coupling: with $\mu$ flat, the conditional of $\bar{b}$ given $\mathbf{a}$ is just its prior, so in this balanced layout successive collapsed draws of $\mathbf{b}$ are *independent*. For unbalanced designs the speed depends on how well connected the design is. For nested two-level models, Hoff’s own case, the mixing time of suitable Gibbs samplers stays bounded as the number of groups grows, under regularity conditions and from a good starting point.{{< cite "ascolani2024" >}}

**When to use it.** Collapse whenever two or more factors cross. For a single grouping factor, {{< xref "alg:ch11-lme-gibbs" "full" >}} already scales, subject to {{< xref "rem:ch11-mixing" "full" >}}.

### Integrated Nested Laplace Approximation (INLA) {#sec:ch11-inla}

Given $\Sigma$, the unknowns $\boldsymbol{\xi} = (\boldsymbol{\beta}_{1:m}, \boldsymbol{\theta})$ of the Poisson GLMM {{< eqref "eq:ch11-glmm" >}} have a Gaussian prior and a log-concave likelihood, so their posterior is often close to normal and its marginals can be *computed*, approximately, rather than sampled.{{< sidenote >}}**Beyond Hoff (2009).** This material is not in Hoff’s book; INLA (Rue, Martino, and Chopin, 2009) appeared in the same year as Hoff’s book and is not covered there; Van Niekerk et al. (2023) reformulate it.{{< /sidenote >}} With hyperparameters $\boldsymbol{\psi}$ (here the entries of $\Sigma$), **INLA**{{< index "INLA" >}} evaluates{{< cite "rue2009" >}}

$$
\tilde{p}(\boldsymbol{\psi} \mid \mathbf{y}) \propto \left.\frac{p(\boldsymbol{\xi}, \boldsymbol{\psi}, \mathbf{y})}{\tilde{p}_G(\boldsymbol{\xi} \mid \boldsymbol{\psi}, \mathbf{y})}\right|_{\boldsymbol{\xi} = \boldsymbol{\xi}^*(\boldsymbol{\psi})}, \qquad
\tilde{p}(\xi_i \mid \mathbf{y}) = \sum_k \tilde{p}(\xi_i \mid \boldsymbol{\psi}_k, \mathbf{y})\,\tilde{p}(\boldsymbol{\psi}_k \mid \mathbf{y})\,\Delta_k, \label{eq:ch11-inla}
$$

where $\boldsymbol{\xi}^*(\boldsymbol{\psi})$ is the conditional mode, $\tilde{p}_G$ the Gaussian matched there, and $\Delta_k$ are integration weights.

*Why it holds.* The identity $p(\boldsymbol{\psi} \mid \mathbf{y}) = p(\boldsymbol{\xi}, \boldsymbol{\psi} \mid \mathbf{y})/p(\boldsymbol{\xi} \mid \boldsymbol{\psi}, \mathbf{y})$ is exact at *every* $\boldsymbol{\xi}$; only the denominator is approximated, at the point where a Gaussian fits best. As in {{< xref "prop:ch10-concave" "full" >}}, log-concavity makes that mode unique (with a proper normal prior on $\boldsymbol{\theta}$), and Newton’s method finds it quickly because the prior precision is sparse. The marginals are then mixtures over a small grid of $\boldsymbol{\psi}$. A recent reformulation removes the linear predictors from the latent field and corrects the Gaussian means variationally, which helps when data are abundant.{{< cite "vanniekerk2023" >}}

**When to use it.** INLA gives fast, deterministic marginals for latent Gaussian models with few hyperparameters. MCMC is still needed when there are many (an unstructured $5 \times 5$ $\Sigma$ for Hoff’s quartic mouse curves has $15$), when random effects are not Gaussian or the predictor is nonlinear, when the conditional posterior is far from normal, as for sparse binary data, or when the full joint posterior is wanted: there, {{< xref "alg:ch11-glmm-mwg" "full" >}} remains the reference.

### Computational & Symbolic Check {#sec:ch11-modern-check}

At $b = 1$ the first identity of {{< eqref "eq:ch11-pg" >}} rests on $E_{\omega \sim \operatorname{PG}(1,0)}[e^{-\omega\psi^2/2}] = \operatorname{sech}(\psi/2)$. The script checks it by simulating the series $\omega \stackrel{d}{=} \frac{1}{2\pi^2}\sum_{k=1}^\infty g_k/(k - \frac{1}{2})^2$ with $g_k \sim \operatorname{exponential}(1)$, and by the infinite product that the series implies.{{< sidenote >}}**Beyond Hoff (2009).** This computational check and its Wolfram symbolic counterpart below verify the modern methods in this section and are not in Hoff’s book.{{< /sidenote >}}

```python
import numpy as np

rng = np.random.default_rng(111)
K, S = 200, 40_000
k = np.arange(1, K + 1)
# PG(1,0) draws from the first K terms; the mean of the omitted tail is added back
w = 1.0 / (2 * np.pi ** 2 * (k - 0.5) ** 2)
omega = rng.exponential(size=(S, K)) @ w + (0.25 - w.sum())
print(f"E[omega] = {omega.mean():.4f} (exact 0.25)")
kk = np.arange(1, 100_001)
for psi in (1.0, 2.0, 4.0):
    mc = np.exp(-omega * psi ** 2 / 2).mean()
    prod = np.exp(-np.log1p(psi ** 2 / (np.pi * (2 * kk - 1)) ** 2).sum())
    print(f"psi={psi}: Monte Carlo={mc:.4f}, product={prod:.6f}, "
          f"sech(psi/2)={1 / np.cosh(psi / 2):.6f}")
    # Bernoulli likelihood at y = 1: kappa = 1/2
    print("   logistic:", round(0.5 * np.exp(psi / 2) * mc, 4), round(1 / (1 + np.exp(-psi)), 4))
```

{{< marginnote >}}Integrate out one exponential $g_k$: each term of the series contributes the factor $\bigl(1 + \psi^2/(\pi^2(2k-1)^2)\bigr)^{-1}$.{{< /marginnote >}}

```js
// Laplace transform of one term g_k / (2 Pi^2 (k - 1/2)^2) at t = psi^2/2, minus the product factor
await show`Assuming[k >= 1 && Element[psi, Reals],
  FullSimplify[Integrate[Exp[-g]*Exp[-g*psi^2/(4*Pi^2*(k - 1/2)^2)], {g, 0, Infinity}]
    - 1/(1 + psi^2/(Pi^2*(2*k - 1)^2))]]`
```

$$
\int_0^\infty e^{-g}\,e^{-g\psi^2/\{4\pi^2(k-\frac{1}{2})^2\}}\,dg - \left(1 + \frac{\psi^2}{\pi^2(2k-1)^2}\right)^{-1} = 0
$$

{{< marginnote >}}Multiply the independent factors over all $k$: Euler’s product for $\cosh$ closes the Pólya–Gamma transform.{{< /marginnote >}}

```js
const pgLap = await show`FullSimplify[1/Product[1 + psi^2/(Pi^2*(2*k - 1)^2), {k, 1, Infinity}]]`
```

$$
\begin{aligned}
&\mathbb{E}_{\omega\sim\operatorname{PG}(1,0)}\bigl[e^{-\omega\psi^2/2}\bigr] = \prod_{k=1}^\infty \left(1 + \frac{\psi^2}{\pi^2(2k-1)^2}\right)^{-1} \\
&= \operatorname{sech}\left(\frac{\psi}{2}\right)
\end{aligned}
$$

{{< marginnote >}}Substitute the transform into the fundamental identity at $b = 1$, for a symbolic exponent $a$.{{< /marginnote >}}

```js
await show`FullSimplify[TrigToExp[Exp[a*psi]/(1 + Exp[psi]) - 1/2*Exp[(a - 1/2)*psi]*(${pgLap})]]`
```

$$
\frac{e^{a\psi}}{1+e^\psi} - \frac{1}{2}\,e^{(a-\frac{1}{2})\psi}\,\mathbb{E}_{\omega\sim\operatorname{PG}(1,0)}\bigl[e^{-\omega\psi^2/2}\bigr] = 0
$$

{{< marginnote >}}Read $\mathbb{E}[\omega]$ off the $\psi^2$ coefficient and instantiate $\operatorname{sech}(\psi/2)$ at the script’s $\psi \in \{1, 2, 4\}$.{{< /marginnote >}}

```js
await show`{-2*SeriesCoefficient[${pgLap}, {psi, 0, 2}], N[Table[${pgLap}, {psi, {1, 2, 4}}]]}`
```

$$
\begin{aligned}
&\bigl(\mathbb{E}[\omega],\; \operatorname{sech}(\psi/2)_{\psi \in \{1,\, 2,\, 4\}}\bigr) \\
&= \left\{\frac{1}{4},\{0.886819,0.648054,0.265802\}\right\}
\end{aligned}
$$

## Symbolic Check in Wolfram Language {#sec:ch11-wolfram}

Proves symbolically in `wolfram-ws-bridge` JavaScript mode that the Poisson GLMM population-average rate $E[\exp(\tilde{\boldsymbol{\beta}}^T\mathbf{x})]$ exceeds the typical-group rate $\exp(\boldsymbol{\theta}^T\mathbf{x})$ by a factor of $\exp(\tfrac12 \mathbf{x}^T\Sigma\mathbf{x})$, derives both the general $2 \times 2$ LME slope posterior variance $(V_j)_{2,2}$ and the closed-form diagonal-$\Sigma$ shrinkage vector $\mathbf{m}_j$, and instantiates the conditional slope SD for small and large schools.

{{< marginnote >}}Integrate $e^{m + \sqrt{v}z}$ against the standard normal to compute the population-averaged Poisson GLMM rate.{{< /marginnote >}}

```js
// Chapter 11: Symbolic Poisson GLMM rate ratio & symbolic LME intercept/slope shrinkage
const popAvg = await show`Assuming[v > 0 && Element[m, Reals],
  FullSimplify[Integrate[Exp[m + Sqrt[v]*z]*Exp[-z^2/2]/Sqrt[2*Pi], {z, -Infinity, Infinity}]]]`
```

$$
\mathbb{E}[e^{\eta}] = \int_{-\infty}^\infty e^{m+\sqrt{v}\,z}\phi(z)\,dz = e^{m+\frac{v}{2}}
$$

{{< marginnote >}}Divide by the typical-group rate $e^m$ to isolate the exact Jensen inflation factor $e^{v/2}$.{{< /marginnote >}}

```js
await show`FullSimplify[${popAvg} / Exp[m]]`
```

$$
\frac{\mathbb{E}[e^\eta]}{e^m} = e^{v/2}
$$

{{< marginnote >}}Invert the $2 \times 2$ LME posterior precision matrix to extract the conditional slope variance $[V_j]_{2,2}$.{{< /marginnote >}}

```js
// Symbolic 2x2 LME posterior covariance V_j and diagonal-Sigma shrinkage mean m_j
const Vj = await wl`FullSimplify[Inverse[Inverse[{{s11, s12}, {s12, s22}}] + DiagonalMatrix[{nj, sxx}]/sig2]]`
const v22Sym = await show`FullSimplify[${Vj}[[2, 2]]]`
```

$$
\begin{aligned}
&\left[\left(\Sigma^{-1} + \frac{1}{\sigma^2}\operatorname{diag}(n_j, S_{xx})\right)^{-1}\right]_{2,2} \\
&= \frac{\sigma^2 \left(-n_j \Sigma_{12}^2+n_j \Sigma_{11} \Sigma_{22} +\Sigma_{22} \sigma^2 \right)}{-n_j \Sigma_{12}^2 S_{xx} +n_j \Sigma_{11} (\sigma^2 +\Sigma_{22} S_{xx})+\sigma^2 (\sigma^2 +\Sigma_{22} S_{xx})}
\end{aligned}
$$

{{< marginnote >}}Solve the diagonal-$\Sigma$ posterior mean system to display explicit intercept and slope shrinkage formulas.{{< /marginnote >}}

```js
await show`FullSimplify[Inverse[DiagonalMatrix[{1/t1^2, 1/t2^2}] + DiagonalMatrix[{nj, sxx}]/sig2] . {th1/t1^2 + nj*yb/sig2, th2/t2^2 + sxx*b2ols/sig2}]`
```

$$
\begin{aligned}
&\mathbf{m}_j^{\text{diag}} \\
&= \left\{\frac{\sigma^2 \theta_1 +n_j \tau_1^2 \bar{y}}{\sigma^2 +n_j \tau_1^2},\frac{\hat{\beta}_{j,2}^{\text{OLS}} S_{xx} \tau_2^2+\sigma^2 \theta_2}{\sigma^2 +S_{xx} \tau_2^2}\right\}
\end{aligned}
$$

{{< marginnote >}}Instantiate the conditional slope SD for small ($n_j = 5$) versus large ($n_j = 24$) schools.{{< /marginnote >}}

```js
// Instantiate conditional slope SD at Sigma = [[20, 2], [2, 1.5]], sig2 = 64, E[sxx] = nj - 1 (nj in {5, 24})
await show`N[Table[Sqrt[${v22Sym} /. {s11 -> 20, s12 -> 2, s22 -> 3/2, sig2 -> 64, nj -> nVal, sxx -> nVal - 1}], {nVal, {5, 24}}]]`
```

$$
\begin{aligned}
&\bigl(\operatorname{SD}(\beta_{j,2} \mid y_j, \theta, \Sigma, \sigma^2)\bigr)_{n_j \in \{5,\, 24\}} \\
&= \{1.1264,0.947057\}
\end{aligned}
$$

## Exercises {#sec:ch11-exercises}

{{< thm kind="exercise" label="ex:ch11-shrinkage-ols" >}}
In the LME Python simulation above, compute the unpooled OLS slope $\hat{\beta}_{j,2}^{\text{ols}}$ for every school $j = 1, \dots, m$ and compare its total MSE against the hierarchical posterior mean $\hat{\beta}_{j,2}$ from {{< xref "alg:ch11-lme-gibbs" "full" >}}. Plot $\hat{\beta}_{j,2}^{\text{ols}} - \hat{\beta}_{j,2}$ versus $n_j$ to verify that small schools experience the strongest slope shrinkage.
{{< /thm >}}

{{< details summary="Symbolic Solution & Instantiation" >}}

{{< marginnote >}}Compute the shrinkage gap $\hat{\beta}_{j,2}^{\text{OLS}} - m_{j,2}$ symbolically under diagonal $\Sigma$.{{< /marginnote >}}

```js
// Ex 11.1: Symbolic LME slope shrinkage difference b2ols - m_{j,2} = O(1/n_j) (diagonal Sigma)
const shrinkDiff = await show`FullSimplify[b2ols - (sxx*b2ols/sig2 + th2/tau2Sq)/(sxx/sig2 + 1/tau2Sq)]`
```

$$
\begin{aligned}
&\hat{\beta}_{j,2}^{\text{OLS}} - m_{j,2} \\
&= \frac{\sigma^2 (\hat{\beta}_{j,2}^{\text{OLS}} -\theta_2)}{\sigma^2 +S_{xx} \tau_2^2}
\end{aligned}
$$

{{< marginnote >}}Evaluate the fraction of $(\hat{\beta}_{j,2}^{\text{OLS}} - \theta_2)$ shrunk away at $n_j = 5$ ($91.4\%$) and $n_j = 24$ ($65.0\%$).{{< /marginnote >}}

```js
await show`N[Table[(${shrinkDiff} / (b2ols - th2)) /. {sig2 -> 64, tau2Sq -> 3/2, sxx -> nj - 1}, {nj, {5, 24}}]]`
```

$$
\begin{aligned}
&\left(\frac{\hat{\beta}_{j,2}^{\text{OLS}} - m_{j,2}}{\hat{\beta}_{j,2}^{\text{OLS}} - \theta_2}\right)_{n_j \in \{5,\, 24\}} \\
&= \{0.914286,0.649746\}
\end{aligned}
$$

{{< /details >}}

{{< thm kind="exercise" label="ex:ch11-centering" >}}
Why did Hoff center student SES *within* each school ($\bar{x}_j = 0$) before fitting the LME model? Show algebraically how shifting $x_{i,j}$ by a constant changes both the interpretation of the intercept $\beta_{j,1}$ and the off-diagonal covariance $\Sigma_{1,2} = \operatorname{Cov}(\beta_{j,1}, \beta_{j,2})$.
{{< /thm >}}

{{< details summary="Symbolic Solution & Instantiation" >}}

{{< marginnote >}}Conjugate $\Sigma$ by the global covariate-shift matrix $T$ to track how $x \mapsto x - c$ alters $\Sigma_{1,2}$.{{< /marginnote >}}

```js
// Ex 11.2: Effect of global shift x -> x - c on LME intercept covariance Sigma_{1,2}
const T = [[1, W.c], [0, 1]]
const covShift = await show`FullSimplify[${T} . {{s11, s12}, {s12, s22}} . Transpose[${T}]]`
```

$$
\begin{aligned}
&T \Sigma T^\top \\
&= \left( \begin{array}{cc} \Sigma_{11} +c (2 \Sigma_{12} +c \Sigma_{22}) & \Sigma_{12} +c \Sigma_{22} \\ \Sigma_{12} +c \Sigma_{22} & \Sigma_{22} \\ \end{array} \right)
\end{aligned}
$$

{{< marginnote >}}Solve $(T\Sigma T^T)_{1,2} = 0$ for the exact decorrelating shift $c^* = -\Sigma_{12}/\Sigma_{22}$.{{< /marginnote >}}

```js
const cDecorr = await show`c /. First[Solve[${covShift}[[1, 2]] == 0, c]]`
```

$$
c^* = -\frac{\Sigma_{12}}{\Sigma_{22}}
$$

{{< marginnote >}}Instantiate $c^*$ as an exact fraction and decimal at $\Sigma_{12} = 2, \Sigma_{22} = 3/2$.{{< /marginnote >}}

```js
await show`{${cDecorr}, N[${cDecorr}]} /. {s12 -> 2, s22 -> 3/2}`
```

$$
\begin{aligned}
&\bigl(c^*_{\text{exact}},\; c^*_{\text{decimal}}\bigr)_{\Sigma_{12}=2,\; \Sigma_{22}=3/2} \\
&= \left\{-\frac{4}{3},-1.33333\right\}
\end{aligned}
$$

{{< /details >}}

{{< thm kind="exercise" label="ex:ch11-glmm-mh" >}}
Write a short Python implementation of {{< xref "alg:ch11-glmm-mwg" "full" >}} for $m = 15$ groups with $n_j = 12$ Poisson counts $y_{i,j} \sim \operatorname{Poisson}(\exp(\beta_{j,1} + \beta_{j,2} x_{i,j}))$. Tune the proposal scale $c$ so average acceptance across groups stays between $25\%$ and $45\%$, and plot the three uncertainty bands of {{< xref "fig:ch11-layers" "full" >}}!
{{< /thm >}}

{{< details summary="Symbolic Solution & Instantiation" >}}

{{< marginnote >}}Combine Poisson noise and log-normal random-effect variance via the law of total variance.{{< /marginnote >}}

```js
// Ex 11.3: Exact predictive variance across layers 2-3 (random effects + Poisson noise, conditional on theta)
const totVar = await show`FullSimplify[Exp[m + v/2] + Exp[2*m + v]*(Exp[v] - 1)]`
```

$$
\operatorname{Var}(\tilde{Y} \mid \theta) = e^{m+\frac{v}{2}}+e^{2 m+v} \left(-1+e^v\right)
$$

{{< marginnote >}}Instantiate median rate, population-average rate, and total predictive variance at $m = 1, v = 0.25$.{{< /marginnote >}}

```js
await show`N[{Exp[m], Exp[m + v/2], ${totVar}} /. {m -> 1, v -> 1/4}]`
```

$$
\begin{aligned}
&\bigl(e^m,\; e^{m+v/2},\; \operatorname{Var}(\tilde{Y} \mid \theta)\bigr)_{m=1,\; v=0.25} \\
&= \{2.71828,3.08022,5.77497\}
\end{aligned}
$$

{{< /details >}}
