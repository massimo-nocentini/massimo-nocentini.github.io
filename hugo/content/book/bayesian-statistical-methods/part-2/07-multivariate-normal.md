---
title: "The Multivariate Normal Model"
linkTitle: "Multivariate Normal"
weight: 30
label: "ch:mvn"
---

{{< newthought "Real measurements rarely arrive in isolation." />}} A student takes a reading exam before and after instruction; a patient has glucose, blood pressure, skin thickness, and BMI recorded simultaneously. Treating each coordinate with a separate univariate normal model throws away the **covariance structure**—the very information that lets us test paired differences, quantify conditional relationships, and impute missing observations.{{< cite "hoff2009" >}} Chapter 7 generalizes every ingredient of Chapters 5 and 6 from scalars to vectors and positive-definite matrices.

## The Multivariate Normal Density and Quadratic Recognition {#sec:ch07-mvn}

A $p$-dimensional random vector $\mathbf{Y} = (Y_1, \dots, Y_p)^T$ follows a **multivariate normal distribution**{{< index "multivariate normal distribution" >}}, written $\mathbf{Y} \sim \mathcal{N}_p(\boldsymbol{\theta}, \Sigma)$, where $\boldsymbol{\theta} \in \mathbb{R}^p$ is the mean vector and $\Sigma \in \mathbb{R}^{p \times p}$ is a symmetric positive-definite covariance matrix, if its density is

$$
p(\mathbf{y} \mid \boldsymbol{\theta}, \Sigma)
= (2\pi)^{-p/2}\,\lvert \Sigma \rvert^{-1/2}
\exp\left\{-\frac{1}{2}(\mathbf{y} - \boldsymbol{\theta})^T \Sigma^{-1} (\mathbf{y} - \boldsymbol{\theta})\right\}. \label{eq:ch07-mvn-pdf}
$$

Its level sets are $p$-dimensional ellipsoids centered at $\boldsymbol{\theta}$ whose axes align with the eigenvectors of $\Sigma$ ({{< xref "fig:ch07-mvn" "full" >}}). Expanding the exponent in {{< eqref "eq:ch07-mvn-pdf" >}} gives the vector analogue of completing the square (proven in {{< xref "app:toolkit" "full" >}}):

$$
p(\mathbf{x}) \propto \exp\left\{-\frac{1}{2}\mathbf{x}^T A \mathbf{x} + \mathbf{x}^T \mathbf{b}\right\}
\quad (A = A^T \succ 0)
\iff
\mathbf{x} \sim \mathcal{N}_p(A^{-1}\mathbf{b},\, A^{-1}). \label{eq:ch07-quad-recog}
$$

Whenever a log-conditional density is a concave quadratic in a vector parameter $\mathbf{x}$, {{< eqref "eq:ch07-quad-recog" >}} lets us read off its precision matrix $A$ and mean $A^{-1}\mathbf{b}$ in a single line.

{{< fig src="images/bayesian-hoff/fig-ch07-mvn-contours.svg" type="fullwidth" label="fig:ch07-mvn" alt="Three panels showing bivariate normal density contours, simulated data points, and linear conditional expectation lines E[Y2 | Y1] for correlations rho equals -0.5, 0.0, and +0.5" short="Bivariate normal contours and conditional regression lines" >}}Bivariate normal contours ($\boldsymbol{\theta} = (50, 50)^T$, $\sigma_1 = 8$, $\sigma_2 = 12$) for $\rho \in \{-0.5, 0, +0.5\}$, with simulated samples and the linear conditional expectation $E[Y_2 \mid Y_1 = y_1] = \theta_2 + \rho\frac{\sigma_2}{\sigma_1}(y_1 - \theta_1)$ (dashed).{{< /fig >}}

## Semiconjugate Priors: MVN and Inverse-Wishart {#sec:ch07-priors}

Given i.i.d. observations $\mathbf{y}_1, \dots, \mathbf{y}_n \mid \boldsymbol{\theta}, \Sigma \stackrel{\text{i.i.d.}}{\sim} \mathcal{N}_p(\boldsymbol{\theta}, \Sigma)$ stacked as the $n \times p$ data matrix $\mathbf{Y}$, we place independent semiconjugate priors on the mean vector and covariance matrix:

$$
\boldsymbol{\theta} \sim \mathcal{N}_p(\boldsymbol{\mu}_0, \Lambda_0), \qquad
\Sigma \sim \operatorname{inverse-Wishart}(\nu_0, S_0^{-1}), \label{eq:ch07-priors}
$$

where $\Lambda_0 \succ 0$ and $S_0 \succ 0$ are symmetric positive-definite matrices and $\nu_0 > p - 1$ is the prior degrees of freedom.

### The Wishart and Inverse-Wishart Distributions {#sec:ch07-wishart}

How do we construct a probability distribution over symmetric positive-definite $p \times p$ matrices? For any integer $\nu_0 \ge p$, draw $\nu_0$ i.i.d. vectors $\mathbf{z}_1, \dots, \mathbf{z}_{\nu_0} \sim \mathcal{N}_p(\mathbf{0}, \Psi)$ and sum their outer products:

$$
\mathbf{W} = \sum_{i=1}^{\nu_0} \mathbf{z}_i \mathbf{z}_i^T = \mathbf{Z}^T \mathbf{Z} \sim \operatorname{Wishart}(\nu_0, \Psi), \qquad
E[\mathbf{W}] = \nu_0 \Psi. \label{eq:ch07-wishart-def}
$$

This is the exact matrix generalization of the gamma distribution (for $p = 1$, $\operatorname{Wishart}(\nu_0, \psi)$ is $\operatorname{gamma}(\nu_0/2,\, (2\psi)^{-1})$, and the density extends analytically to all real $\nu_0 > p - 1$). Setting $\Sigma = \mathbf{W}^{-1}$ with $\Psi = S_0^{-1}$ defines Hoff’s **inverse-Wishart**{{< index "inverse-Wishart distribution" >}} parameterization $\Sigma \sim \operatorname{inverse-Wishart}(\nu_0, S_0^{-1})$:

$$
p(\Sigma) \propto \lvert \Sigma \rvert^{-(\nu_0 + p + 1)/2}
\exp\left\{-\frac{1}{2}\operatorname{tr}(S_0 \Sigma^{-1})\right\}, \qquad
E[\Sigma] = \frac{1}{\nu_0 - p - 1} S_0 \quad (\nu_0 > p + 1). \label{eq:ch07-iw-pdf}
$$

Setting $\nu_0 = p + 2$ gives a weakly informative prior centered at $E[\Sigma] = S_0$ with finite expectation.{{< sidenote >}}**Limitation of the inverse-Wishart prior:** a single scalar $\nu_0$ simultaneously governs our certainty about all $p$ diagonal variances *and* all $p(p-1)/2$ off-diagonal correlations! When variances differ in prior certainty from correlations, modern practice often separates scale and correlation priors (e.g., LKJ priors on correlations{{< cite "lewandowski2009" >}}, published the same year as Hoff’s book and not covered there; see {{< xref "sec:ch07-huang-wand" "full" >}}), or uses parameter expansion as in {{< xref "ch:ordinal" "full" >}}.{{< /sidenote >}}

### The Trace Trick and Full Conditionals {#sec:ch07-trace-trick}

To recognize the full conditional of $\Sigma$ from the MVN likelihood, we use the cyclic invariance of the matrix trace, $\operatorname{tr}(AB) = \operatorname{tr}(BA)$:

{{< proposition note="The Trace Trick and MVN Full Conditionals" label="prop:ch07-fc" >}}
For any vectors $\mathbf{y}_1, \dots, \mathbf{y}_n, \boldsymbol{\theta} \in \mathbb{R}^p$ and symmetric matrix $\Sigma^{-1}$, define the sum-of-squares matrix $\mathbf{S}_{\boldsymbol{\theta}} = \sum_{i=1}^n (\mathbf{y}_i - \boldsymbol{\theta})(\mathbf{y}_i - \boldsymbol{\theta})^T$. Then

$$
\sum_{i=1}^n (\mathbf{y}_i - \boldsymbol{\theta})^T \Sigma^{-1} (\mathbf{y}_i - \boldsymbol{\theta})
= \operatorname{tr}(\mathbf{S}_{\boldsymbol{\theta}} \Sigma^{-1}). \label{eq:ch07-trace-trick}
$$

Consequently, under the semiconjugate prior {{< eqref "eq:ch07-priors" >}}, the two full conditional distributions are:

1. **Mean vector given covariance**: $\boldsymbol{\theta} \mid \Sigma, \mathbf{Y} \sim \mathcal{N}_p(\boldsymbol{\mu}_n, \Lambda_n)$, where

   $$
   \Lambda_n = \left(\Lambda_0^{-1} + n\Sigma^{-1}\right)^{-1}, \qquad
   \boldsymbol{\mu}_n = \Lambda_n\left(\Lambda_0^{-1}\boldsymbol{\mu}_0 + n\Sigma^{-1}\bar{\mathbf{y}}\right). \label{eq:ch07-fc-theta}
   $$

2. **Covariance matrix given mean vector**:

   $$
   \Sigma \mid \boldsymbol{\theta}, \mathbf{Y} \sim \operatorname{inverse-Wishart}\!\left(\nu_0 + n,\; (S_0 + \mathbf{S}_{\boldsymbol{\theta}})^{-1}\right). \label{eq:ch07-fc-sigma}
   $$
{{< /proposition >}}

{{< proof >}}
Each summand $(\mathbf{y}_i - \boldsymbol{\theta})^T \Sigma^{-1}(\mathbf{y}_i - \boldsymbol{\theta})$ is a $1 \times 1$ scalar, so it equals its own trace. Applying $\operatorname{tr}(ABC) = \operatorname{tr}(CAB)$ and linearity of trace gives

$$
\sum_{i=1}^n \operatorname{tr}\!\left((\mathbf{y}_i - \boldsymbol{\theta})^T \Sigma^{-1}(\mathbf{y}_i - \boldsymbol{\theta})\right)
= \sum_{i=1}^n \operatorname{tr}\!\left((\mathbf{y}_i - \boldsymbol{\theta})(\mathbf{y}_i - \boldsymbol{\theta})^T \Sigma^{-1}\right)
= \operatorname{tr}(\mathbf{S}_{\boldsymbol{\theta}} \Sigma^{-1}).
$$

For $\boldsymbol{\theta} \mid \Sigma, \mathbf{Y}$, collecting terms in $\boldsymbol{\theta}$ from $\log p(\boldsymbol{\theta}) + \log p(\mathbf{Y} \mid \boldsymbol{\theta}, \Sigma)$ gives

$$
-\frac{1}{2}\boldsymbol{\theta}^T(\Lambda_0^{-1} + n\Sigma^{-1})\boldsymbol{\theta} + \boldsymbol{\theta}^T(\Lambda_0^{-1}\boldsymbol{\mu}_0 + n\Sigma^{-1}\bar{\mathbf{y}}),
$$

which matches {{< eqref "eq:ch07-quad-recog" >}} directly. For $\Sigma \mid \boldsymbol{\theta}, \mathbf{Y}$, multiplying {{< eqref "eq:ch07-iw-pdf" >}} by $\lvert \Sigma \rvert^{-n/2}\exp\bigl(-\frac{1}{2}\operatorname{tr}(\mathbf{S}_{\boldsymbol{\theta}}\Sigma^{-1})\bigr)$ yields

$$
\lvert \Sigma \rvert^{-(\nu_0 + n + p + 1)/2}\exp\bigl(-\frac{1}{2}\operatorname{tr}((S_0 + \mathbf{S}_{\boldsymbol{\theta}})\Sigma^{-1})\bigr),
$$

immediately recognizable as {{< eqref "eq:ch07-fc-sigma" >}}.
{{< /proof >}}

{{< thm kind="algorithm" note="Two-Block MVN Gibbs Sampler" label="alg:ch07-mvn-gibbs" >}}
Initialize $\Sigma^{(0)}$ (e.g., at the sample covariance). For $s = 1, \dots, S$:

1. Compute $\Lambda_n$ and $\boldsymbol{\mu}_n$ from {{< eqref "eq:ch07-fc-theta" >}} using $\Sigma^{(s-1)}$ and draw $\boldsymbol{\theta}^{(s)} \sim \mathcal{N}_p(\boldsymbol{\mu}_n, \Lambda_n)$.
2. Compute $\mathbf{S}_{\boldsymbol{\theta}^{(s)}} = \sum_{i=1}^n (\mathbf{y}_i - \boldsymbol{\theta}^{(s)})(\mathbf{y}_i - \boldsymbol{\theta}^{(s)})^T$ and draw $\Sigma^{(s)} \sim \operatorname{inverse-Wishart}\bigl(\nu_0 + n,\, (S_0 + \mathbf{S}_{\boldsymbol{\theta}^{(s)}})^{-1}\bigr)$.
{{< /thm >}}

### Example: Reading Comprehension (Means vs. Individuals Revisited) {#sec:ch07-reading}

Hoff analyzes $n = 22$ children tested before ($Y_{i,1}$) and after ($Y_{i,2}$) a reading program, with $\bar{\mathbf{y}} = (47.18, 53.86)^T$ and sample correlation $\hat{\rho} \approx 0.70$. Running {{< xref "alg:ch07-mvn-gibbs" "full" >}} yields $\Pr(\theta_2 > \theta_1 \mid \mathbf{Y}) \approx 0.99$—virtually certain that the *population* average rises—yet drawing posterior predictive pairs $\tilde{\mathbf{y}}^{(s)} \sim \mathcal{N}_2(\boldsymbol{\theta}^{(s)}, \Sigma^{(s)})$ shows $\Pr(\tilde{Y}_2 > \tilde{Y}_1 \mid \mathbf{Y}) \approx 0.71$: nearly a third of individual children still score lower on the second test!

## Missing Data and Data Augmentation {#sec:ch07-missing}

In real multivariate surveys, entries are frequently missing. Let $\mathbf{O}$ be the binary observation indicator matrix ($O_{i,j} = 1$ if $Y_{i,j}$ is observed, $0$ if missing), splitting $\mathbf{Y} = (\mathbf{Y}_{\text{obs}}, \mathbf{Y}_{\text{mis}})$. Following Little and Rubin{{< cite "little2002" >}}, missingness falls into three regimes:
- **MCAR (Missing Completely At Random)**: $p(\mathbf{O} \mid \mathbf{Y}_{\text{obs}}, \mathbf{Y}_{\text{mis}}, \psi) = p(\mathbf{O} \mid \psi)$.
- **MAR (Missing At Random)**{{< index "missing at random (MAR)" >}}: $p(\mathbf{O} \mid \mathbf{Y}_{\text{obs}}, \mathbf{Y}_{\text{mis}}, \psi) = p(\mathbf{O} \mid \mathbf{Y}_{\text{obs}}, \psi)$—missingness may depend on *observed* values, but not on the unobserved values themselves.
- **MNAR (Missing Not At Random)**: missingness depends on $\mathbf{Y}_{\text{mis}}$ (e.g., high earners refusing to report income).

When the mechanism is **MAR** *and* the missingness parameter $\psi$ is prior-independent of $(\boldsymbol{\theta}, \Sigma)$ (distinct parameters), the missing-data mechanism is **ignorable**: the factor $p(\mathbf{O} \mid \mathbf{Y}_{\text{obs}}, \psi)$ pulls completely outside the posterior for $(\boldsymbol{\theta}, \Sigma)$!

Even under ignorability, computing $p(\mathbf{Y}_{\text{obs}} \mid \boldsymbol{\theta}, \Sigma)$ directly breaks conjugacy because every row has a different subset of observed columns. Instead, **data augmentation**{{< index "data augmentation" >}} treats $\mathbf{Y}_{\text{mis}}$ as an extra vector of unknown parameters and includes it as a third block in the Gibbs sampler! What is the full conditional of the missing entries $\mathbf{y}_{i,b}$ given the observed entries $\mathbf{y}_{i,a}$ in row $i$? It is given by the exact **Schur complement**{{< index "Schur complement" >}} conditional normal theorem (see {{< xref "app:toolkit" "full" >}}):

$$
\mathbf{y}_b \mid \mathbf{y}_a, \boldsymbol{\theta}, \Sigma \sim \mathcal{N}\!\left(
\boldsymbol{\theta}_b + \Sigma_{b,a}\Sigma_{a,a}^{-1}(\mathbf{y}_a - \boldsymbol{\theta}_a),\;
\Sigma_{b,b} - \Sigma_{b,a}\Sigma_{a,a}^{-1}\Sigma_{a,b}
\right). \label{eq:ch07-cond-mvn}
$$

{{< thm kind="algorithm" note="Data-Augmentation MVN Gibbs Sampler for MAR Missing Data" label="alg:ch07-mar-gibbs" >}}
Initialize $\mathbf{Y}_{\text{mis}}^{(0)}$ (e.g., by column means) and $\Sigma^{(0)}$. For $s = 1, \dots, S$:

1. **Update $\boldsymbol{\theta}^{(s)}$** from {{< eqref "eq:ch07-fc-theta" >}} using the completed matrix $\mathbf{Y}^{(s-1)} = (\mathbf{Y}_{\text{obs}}, \mathbf{Y}_{\text{mis}}^{(s-1)})$.
2. **Update $\Sigma^{(s)}$** from {{< eqref "eq:ch07-fc-sigma" >}} using $\boldsymbol{\theta}^{(s)}$ and $\mathbf{Y}^{(s-1)}$.
3. **Impute $\mathbf{Y}_{\text{mis}}^{(s)}$**: for each row $i$ with missing indices $b_i$ and observed indices $a_i$, sample $\mathbf{y}_{i,b_i}^{(s)}$ independently from the conditional MVN {{< eqref "eq:ch07-cond-mvn" >}} given $(\mathbf{y}_{i,a_i}, \boldsymbol{\theta}^{(s)}, \Sigma^{(s)})$.
{{< /thm >}}

Unlike ad-hoc single imputation (which understates uncertainty by treating imputed values as real data), {{< xref "alg:ch07-mar-gibbs" "full" >}} automatically propagates imputation uncertainty into every posterior interval for $\boldsymbol{\theta}$ and $\Sigma$!

## Marginal Correlations vs. Partial Regression Coefficients {#sec:ch07-partial}

In Hoff’s Pima Indians dataset ($n = 200$ women; $p = 4$ variables: glucose `glu`, blood pressure `bp`, skin-fold thickness `skin`, and body mass index `bmi`), all pairwise correlations are positive—for instance, `glu` correlates positively with `bp`, `skin`, and `bmi`. Yet from {{< eqref "eq:ch07-cond-mvn" >}}, the conditional expectation of coordinate $j$ given *all other coordinates* $-j$ is linear with **partial regression coefficients**{{< index "partial regression coefficient" >}}

$$
\boldsymbol{\beta}_{j \mid -j} = \Sigma_{-j,-j}^{-1}\Sigma_{-j,j}, \label{eq:ch07-partial-beta}
$$

which can be computed directly at every Gibbs draw $\Sigma^{(s)}$! In the Pima data, while `bp` correlates positively with `glu` *marginally*, its partial regression coefficient given `bmi` and `skin` shrinks sharply toward zero: the apparent `bp`–`glu` association is largely accounted for by body mass and skin-fold thickness. Furthermore, holding out a subset of entries and comparing imputed posterior means against true values validates the MVN model out-of-sample.

```python
import numpy as np
from scipy import stats

# Semiconjugate MVN Gibbs sampler (illustrated on synthetic reading-score data)
rng = np.random.default_rng(7)
n, p = 22, 2
Y = rng.multivariate_normal([47.18, 53.86], [[182.16, 147.45], [147.45, 243.65]], size=n)
ybar = Y.mean(axis=0)

# Prior hyperparameters (Hoff's weakly informative reading-test prior)
mu0 = np.array([50.0, 50.0])
L0 = np.array([[625.0, 312.5], [312.5, 625.0]])
L0_inv = np.linalg.inv(L0)
nu0 = 4.0
S0 = L0.copy()

S = 4_000
theta_s = np.empty((S, p))
Sigma_s = np.empty((S, p, p))
Sigma_cur = np.cov(Y, rowvar=False)

for s in range(S):
    # 1. theta | Sigma, Y
    Sig_inv = np.linalg.inv(Sigma_cur)
    Ln = np.linalg.inv(L0_inv + n * Sig_inv)
    mun = Ln @ (L0_inv @ mu0 + n * Sig_inv @ ybar)
    th_cur = rng.multivariate_normal(mun, Ln)
    # 2. Sigma | theta, Y  (NOTE: scipy invwishart takes scale = S_post directly!)
    diff = Y - th_cur
    S_th = diff.T @ diff
    Sigma_cur = stats.invwishart.rvs(df=nu0 + n, scale=S0 + S_th, random_state=rng)
    theta_s[s], Sigma_s[s] = th_cur, Sigma_cur

# Compare population mean difference vs. posterior predictive individual difference
y_pred = np.array([rng.multivariate_normal(th, Sg) for th, Sg in zip(theta_s, Sigma_s)])
print(f"Pr(theta_2 > theta_1 | Y) = {np.mean(theta_s[:, 1] > theta_s[:, 0]):.3f}")
print(f"Pr(Ytilde_2 > Ytilde_1 | Y) = {np.mean(y_pred[:, 1] > y_pred[:, 0]):.3f}")
```

## Modern Developments: Covariance Priors, Sparse Graphs, and Missingness {#sec:ch07-modern}

### Huang–Wand Hierarchical Inverse-Wishart and LKJ Priors {#sec:ch07-huang-wand}

A single extra layer of scale parameters repairs the inverse-Wishart’s main defect—one $\nu_0$ governing everything—without leaving the Gibbs sampler.{{< sidenote >}}**Beyond Hoff (2009).** This material is not in Hoff’s book; the hierarchy is due to Huang and Wand (2013), while the LKJ construction of Lewandowski, Kurowicka and Joe appeared in the same year as Hoff’s book and is not covered there.{{< cite "huang2013,lewandowski2009" >}}{{< /sidenote >}} In the notation of {{< eqref "eq:ch07-priors" >}}, let

$$
\Sigma \mid \mathbf{a} \sim \operatorname{inverse-Wishart}\!\left(\nu + p - 1,\; S_{\mathbf{a}}^{-1}\right), \quad
S_{\mathbf{a}} = 2\nu\operatorname{diag}\!\left(\tfrac{1}{a_1}, \dots, \tfrac{1}{a_p}\right), \quad
\frac{1}{a_k} \sim \operatorname{gamma}\!\left(\tfrac12, \tfrac{1}{A_k^2}\right). \label{eq:ch07-huang-wand}
$$

Given $\mathbf{a}$, $\Sigma_{k,k} \sim \operatorname{inverse-gamma}(\nu/2, \nu/a_k)$, and mixing over $a_k$ makes each standard deviation $\sigma_k$ a half-$t$ variable with $\nu$ degrees of freedom and scale $A_k$.{{< index "half-t distribution" >}} Rescaling by a diagonal matrix leaves correlations unchanged, so each $\rho_{i,j}$ has density proportional to $(1 - r^2)^{\nu/2 - 1}$ (compare {{< xref "ex:ch07-iw-scale" "full" >}}): $\nu = 2$ makes every correlation *marginally* uniform. The updates stay conjugate: {{< eqref "eq:ch07-fc-sigma" >}} with $\nu_0 = \nu + p - 1$ and $S_0 = S_{\mathbf{a}}$, followed by $1/a_k \mid \Sigma \sim \operatorname{gamma}\bigl(\frac{\nu + p}{2},\, \nu(\Sigma^{-1})_{k,k} + A_k^{-2}\bigr)$.

The **LKJ prior**{{< index "LKJ prior" >}} instead sets $p(C) \propto \lvert C \rvert^{\eta - 1}$ on correlation matrices, independently of the scales. At $\eta = 1$ it is uniform *jointly*, hence not marginally uniform for $p > 2$.

**When to use it.** Keep {{< eqref "eq:ch07-priors" >}} when $S_0$ carries real information. Choose Huang–Wand as the default inside Gibbs, and LKJ with separate scale priors when scales and correlations must be a priori independent and sampling is gradient-based.

### The Graphical Horseshoe {#sec:ch07-ghs}

The **graphical horseshoe**{{< index "graphical horseshoe" >}} shrinks most off-diagonal entries of $\Omega = \Sigma^{-1}$ almost to zero while leaving strong ones nearly untouched.{{< sidenote >}}**Beyond Hoff (2009).** This material is not in Hoff’s book; Li, Craig and Bhadra (2019) extend the horseshoe shrinkage prior to inverse covariance matrices.{{< cite "li2019" >}}{{< /sidenote >}} By {{< xref "ex:ch07-schur-prec" "full" >}}, $\Omega_{i,j} = 0$ exactly when $Y_i$ and $Y_j$ are conditionally independent, so sparsity in $\Omega$ is sparsity in the coefficients {{< eqref "eq:ch07-partial-beta" >}}. Restricted to $\Omega \succ 0$, the prior is flat on each $\Omega_{i,i}$, with $\Omega_{i,j} \mid \lambda_{i,j}, \tau \sim \mathcal{N}(0, \lambda_{i,j}^2\tau^2)$ for $i < j$ and half-Cauchy $\lambda_{i,j}$ and $\tau$. Write $\mathbf{S} = \mathbf{S}_{\boldsymbol{\theta}}$, single out the last row and column, and let $\boldsymbol{\omega} = \Omega_{-p,p}$, $\gamma = \Omega_{p,p} - \boldsymbol{\omega}^T\Omega_{-p,-p}^{-1}\boldsymbol{\omega}$, and $D = \operatorname{diag}(\lambda_{i,p}^2\tau^2)$. Then, given the rest,

$$
\gamma \sim \operatorname{gamma}\!\left(\tfrac{n}{2} + 1,\, \tfrac{\mathbf{S}_{p,p}}{2}\right), \qquad
\boldsymbol{\omega} \sim \mathcal{N}_{p-1}\bigl(-G\,\mathbf{S}_{-p,p},\, G\bigr), \qquad
G = \bigl(\mathbf{S}_{p,p}\,\Omega_{-p,-p}^{-1} + D^{-1}\bigr)^{-1}. \label{eq:ch07-ghs}
$$

Why? $\lvert \Omega \rvert = \gamma\,\lvert \Omega_{-p,-p} \rvert$, and the trace {{< eqref "eq:ch07-trace-trick" >}} contributes $2\mathbf{S}_{-p,p}^T\boldsymbol{\omega} + \mathbf{S}_{p,p}(\gamma + \boldsymbol{\omega}^T\Omega_{-p,-p}^{-1}\boldsymbol{\omega})$; now apply {{< eqref "eq:ch07-quad-recog" >}}. Because $\gamma > 0$, every draw is positive definite. Cycle over columns; inverse-gamma auxiliary variables handle $\lambda_{i,j}$ and $\tau$.

**When to use it.** For the four Pima variables an inverse-Wishart is enough. Use the graphical horseshoe when $p$ is comparable to or larger than $n$ and few edges are expected; it yields no exact zeros, so edges must still be selected, for example by credible intervals.

### Realized versus Everywhere MAR {#sec:ch07-mar}

The MAR condition of {{< xref "sec:ch07-missing" "full" >}} hides two different assumptions, and Bayesian ignorability needs only the weaker.{{< sidenote >}}**Beyond Hoff (2009).** This material is not in Hoff’s book; Seaman et al. (2013) separate two readings long conflated in the literature descending from Rubin’s original definition of MAR.{{< cite "seaman2013" >}}{{< /sidenote >}} Let $(\tilde{\mathbf{o}}, \tilde{\mathbf{y}}_{\text{obs}})$ be the pattern and values *actually observed*. **Realized MAR**{{< index "realized MAR" >}} requires $\Pr(\mathbf{O} = \tilde{\mathbf{o}} \mid \tilde{\mathbf{y}}_{\text{obs}}, \mathbf{y}_{\text{mis}}, \psi)$ to be constant in $\mathbf{y}_{\text{mis}}$, for every $\psi$; **everywhere MAR** requires this for every pattern and every data set that *could* have occurred. Under realized MAR,

$$
p(\boldsymbol{\theta}, \Sigma, \psi \mid \tilde{\mathbf{y}}_{\text{obs}}, \tilde{\mathbf{o}})
\propto p(\psi)\Pr(\tilde{\mathbf{o}} \mid \tilde{\mathbf{y}}_{\text{obs}}, \psi)
\times p(\boldsymbol{\theta}, \Sigma)\!\int\! p(\tilde{\mathbf{y}}_{\text{obs}}, \mathbf{y}_{\text{mis}} \mid \boldsymbol{\theta}, \Sigma)\,d\mathbf{y}_{\text{mis}}, \label{eq:ch07-realized-mar}
$$

given prior-independent $\psi$. The mechanism is constant in $\mathbf{y}_{\text{mis}}$, so it leaves the integral, and the posterior is evaluated *only* at $\tilde{\mathbf{o}}$: unrealized patterns never enter. Coverage, expected information, and replicated missing-data patterns average over other data sets, so realized MAR does not justify ignoring the mechanism *there*; everywhere MAR, with distinct parameters, is the usual sufficient condition.

Suppose post-tests could be withheld according to their own value, but only for children with a pretest below $30$. If every pretest in our sample was fully observed and exceeded $30$, the data are realized MAR yet not everywhere MAR: the posterior may ignore the mechanism, while a simulation study of its coverage may not.

**When to use it.** For the posterior from {{< xref "alg:ch07-mar-gibbs" "full" >}}, argue realized MAR plus prior independence; for frequentist calibration, defend everywhere MAR or model $\mathbf{O}$ explicitly. Hoff’s single MAR condition does not draw this distinction.

### Computational & Symbolic Check {#sec:ch07-modern-check}

The script simulates {{< eqref "eq:ch07-huang-wand" >}} with $p = \nu = 2$, testing $\rho$ against the uniform and $\sigma_1$ against the half-$t_2$ distribution, and then draws $3 \times 3$ correlation matrices uniformly (LKJ, $\eta = 1$). For $p = 2$ the LKJ density of $\rho$ is proportional to $(1 - \rho^2)^{\eta - 1}$; for general $p$ the exponent becomes $\eta - 2 + p/2$, so at $p = 3$, $\eta = 1$ the marginal variance is $\frac14$ rather than the uniform’s $\frac13$.{{< sidenote >}}**Beyond Hoff (2009).** This computational check and its Wolfram symbolic counterpart below verify the modern methods in this section and are not in Hoff’s book.{{< /sidenote >}}

```python
import numpy as np
from scipy import stats

# Huang-Wand, p = nu = 2: draw IW(3) with scale 4*I, then rescale by 1/a_k (correlations are invariant)
rng = np.random.default_rng(7)
N, nu, A = 50_000, 2, 2.5
Sig0 = stats.invwishart.rvs(df=nu + 1, scale=2 * nu * np.eye(2), size=N, random_state=rng)
inv_a = rng.gamma(0.5, A**2, size=(N, 2))        # NumPy scale = 1/rate = A^2
Sig = Sig0 * np.sqrt(inv_a[:, :, None] * inv_a[:, None, :])
sd1 = np.sqrt(Sig[:, 0, 0])
rho = Sig[:, 0, 1] / (sd1 * np.sqrt(Sig[:, 1, 1]))
print(f"KS(rho, U(-1,1)) = {stats.kstest(rho, stats.uniform(-1, 2).cdf).statistic:.4f}")
print(f"KS(sigma_1, half-t_2) = {stats.kstest(sd1, lambda x: 2 * stats.t.cdf(x / A, nu) - 1).statistic:.4f}")

# LKJ(eta = 1), p = 3: uniform over positive definite correlation matrices, by rejection
r = rng.uniform(-1, 1, size=(400_000, 3))
keep = 1 + 2 * r.prod(axis=1) - (r**2).sum(axis=1) > 0
print(f"LKJ p = 3: Var(rho_12) = {r[keep, 0].var():.4f} (exact 0.25; uniform 0.3333)")
```

{{< marginnote >}}After the change of variables $\Sigma \mapsto (\sigma_1, \sigma_2, \rho)$, each scale is integrated out by this one-dimensional integral.{{< /marginnote >}}

```js
// Chapter 7 (modern): Huang-Wand (p = 2) correlation marginal & LKJ density
const sInt = await show`Assuming[nu > 0 && k > 0,
  FullSimplify[Integrate[s^(-(nu + 2))*Exp[-k/s^2], {s, 0, Infinity}]]]`
```

$$
\int_0^\infty s^{-(\nu+2)} e^{-k/s^2}\,ds = \frac{1}{2} k^{-\frac{1+\nu}{2}} \Gamma \left(\frac{1+\nu}{2}\right)
$$

{{< marginnote >}}Assemble the kernel of $\rho$: the factor $(1 - \rho^2)^{-(\nu+4)/2}$ times both integrated scales, with $k = \nu/[a_j(1 - \rho^2)]$; $a_1, a_2$ enter only as constants.{{< /marginnote >}}

```js
const rhoKer = await show`(1 - r^2)^(-(nu + 4)/2) * (${sInt} /. k -> nu/(a1*(1 - r^2))) * (${sInt} /. k -> nu/(a2*(1 - r^2)))`
```

$$
\begin{aligned}
&p(\rho \mid a_1, a_2) \propto \\
&\frac{1}{4} \left(1-\rho^2\right)^{-\frac{4+\nu}{2}} \left(\frac{\nu}{a_1 (1-\rho^2)}\right)^{-\frac{1+\nu}{2}} \left(\frac{\nu}{a_2 (1-\rho^2)}\right)^{-\frac{1+\nu}{2}} \Gamma \left(\frac{1+\nu}{2}\right)^2
\end{aligned}
$$

{{< marginnote >}}Check that the log-ratio of this kernel to $(1 - \rho^2)^{\nu/2 - 1}$ has zero derivative in $\rho$.{{< /marginnote >}}

```js
await show`Assuming[nu > 0 && a1 > 0 && a2 > 0 && -1 < r < 1,
  FullSimplify[D[Log[${rhoKer} / (1 - r^2)^(nu/2 - 1)], r]]]`
```

$$
\frac{d}{d\rho}\log\!\left(\frac{p(\rho \mid a_1, a_2)}{(1 - \rho^2)^{\nu/2 - 1}}\right) = 0
$$

{{< marginnote >}}Normalize $(1 - \rho^2)^{\eta - 1}$: the LKJ density for $p = 2$, which is also Huang–Wand with $\eta = \nu/2$.{{< /marginnote >}}

```js
const rhoDen = await show`Assuming[eta > 0 && -1 < r < 1,
  FullSimplify[(1 - r^2)^(eta - 1) / Integrate[(1 - t^2)^(eta - 1), {t, -1, 1}]]]`
```

$$
p(\rho \mid \eta) = \frac{\left(1-\rho^2\right)^{-1+\eta} \Gamma \left(\frac{1}{2}+\eta\right)}{\sqrt{\pi} \Gamma (\eta)}
$$

{{< marginnote >}}Instantiate at $\eta = 1$ (Huang–Wand with $\nu = 2$: uniform) and at $\eta = 2$ (concentrated near zero).{{< /marginnote >}}

```js
await show`{${rhoDen} /. eta -> 1, ${rhoDen} /. eta -> 2}`
```

$$
\bigl(p(\rho \mid \eta = 1),\; p(\rho \mid \eta = 2)\bigr) = \left\{\frac{1}{2},\frac{3}{4} \left(1-\rho^2\right)\right\}
$$

{{< marginnote >}}Evaluate $\operatorname{Var}(\rho)$ at $\eta = 1$ and at the effective exponent $\eta = \frac32$ that LKJ$(1)$ induces when $p = 3$.{{< /marginnote >}}

```js
await show`Table[Integrate[r^2*(${rhoDen} /. eta -> e), {r, -1, 1}], {e, {1, 3/2}}]`
```

$$
\bigl(\operatorname{Var}(\rho)_{p=2},\; \operatorname{Var}(\rho)_{p=3}\bigr)_{\text{LKJ}(1)} = \left\{\frac{1}{3},\frac{1}{4}\right\}
$$

## Symbolic Check in Wolfram Language {#sec:ch07-wolfram}

Verifies symbolically for a general $3 \times 3$ covariance matrix $\Sigma$ in `wolfram-ws-bridge` JavaScript mode that the Schur-complement partial regression vector equals $-\Omega_{1,1}^{-1}\Omega_{1,23}^T$, derives the general $2 \times 2$ conditional slope and conditional variance symbolically in terms of $(s_1, s_2, \rho)$, and instantiates them on Hoff’s reading-comprehension covariance.

{{< marginnote >}}Compute the symbolic $3 \times 3$ Schur regression slope vector $\Sigma_{23,23}^{-1}\Sigma_{23,1}$.{{< /marginnote >}}

```js
// Chapter 7: Symbolic 3x3 Schur-precision identity & symbolic 2x2 conditional normal
const Sig = [[W.s11, W.s12, W.s13], [W.s12, W.s22, W.s23], [W.s13, W.s23, W.s33]]
const betaSchur = await show`FullSimplify[Inverse[{{s22, s23}, {s23, s33}}] . {s12, s13}]`
```

$$
\begin{aligned}
&\beta_{\text{Schur}} = \Sigma_{23,23}^{-1}\Sigma_{23,1} \\
&= \left\{\frac{\Sigma_{13} \Sigma_{23} -\Sigma_{12} \Sigma_{33}}{\Sigma_{23}^2-\Sigma_{22} \Sigma_{33}},\frac{\Sigma_{13} \Sigma_{22} -\Sigma_{12} \Sigma_{23}}{-\Sigma_{23}^2+\Sigma_{22} \Sigma_{33}}\right\}
\end{aligned}
$$

{{< marginnote >}}Compute the precision-based slope vector $-\Omega_{11}^{-1}\Omega_{1,23}$ from the inverse covariance $\Omega = \Sigma^{-1}$.{{< /marginnote >}}

```js
const betaPrec = await show`FullSimplify[-Inverse[${Sig}][[1, {2, 3}]] / Inverse[${Sig}][[1, 1]]]`
```

$$
\begin{aligned}
&\beta_{\text{prec}} = -\Omega_{11}^{-1}\Omega_{1,23} \\
&= \left\{\frac{\Sigma_{13} \Sigma_{23} -\Sigma_{12} \Sigma_{33}}{\Sigma_{23}^2-\Sigma_{22} \Sigma_{33}},\frac{\Sigma_{13} \Sigma_{22} -\Sigma_{12} \Sigma_{23}}{-\Sigma_{23}^2+\Sigma_{22} \Sigma_{33}}\right\}
\end{aligned}
$$

{{< marginnote >}}Verify that the Schur slope vector equals $-\Omega_{11}^{-1}\Omega_{1,23}$: the difference vanishes identically.{{< /marginnote >}}

```js
await show`FullSimplify[${betaSchur} - ${betaPrec}]`
```

$$
\beta_{\text{Schur}} - \bigl(-\Omega_{11}^{-1}\Omega_{1,23}\bigr) = \{0,0\}
$$

{{< marginnote >}}Derive the symbolic conditional regression slope $\beta_{2\mid 1} = \rho\,\sigma_2/\sigma_1$ for a $2 \times 2$ normal.{{< /marginnote >}}

```js
// Abstract 2x2 covariance {{s1^2, rho*s1*s2}, {rho*s1*s2, s2^2}}: symbolic slope & cond. variance
const covSym = [[W.Power(W.s1, 2), W.Times(W.rho, W.s1, W.s2)], [W.Times(W.rho, W.s1, W.s2), W.Power(W.s2, 2)]]
const slopeSym = await show`FullSimplify[${covSym}[[1, 2]] / ${covSym}[[1, 1]]]`
```

$$
\beta_{2 \mid 1} = \frac{\Sigma_{1,2}}{\Sigma_{1,1}} = \frac{\rho \sigma_2}{\sigma_1}
$$

{{< marginnote >}}Derive the symbolic conditional variance $\operatorname{Var}(Y_2 \mid Y_1) = (1 - \rho^2)\sigma_2^2$.{{< /marginnote >}}

```js
const cvarSym = await show`FullSimplify[${covSym}[[2, 2]] - ${covSym}[[1, 2]]^2 / ${covSym}[[1, 1]]]`
```

$$
\begin{aligned}
&\operatorname{Var}(Y_2 \mid Y_1) = \Sigma_{2,2} - \frac{\Sigma_{1,2}^2}{\Sigma_{1,1}} \\
&= -\left(\left(-1+\rho^2\right) \sigma_2^2\right)
\end{aligned}
$$

{{< marginnote >}}Instantiate the conditional slope and conditional SD on Hoff’s reading-comprehension covariance.{{< /marginnote >}}

```js
// Instantiate on Hoff's reading-comprehension covariance (s1^2 = 182.16, s2^2 = 243.65, cov = 147.45)
await show`N[{${slopeSym}, Sqrt[${cvarSym}]} /. {s1 -> Sqrt[182.16], s2 -> Sqrt[243.65], rho -> 147.45/Sqrt[182.16*243.65]}]`
```

$$
\begin{aligned}
&\bigl(\beta_{2\mid 1},\; \operatorname{SD}(Y_2 \mid Y_1)\bigr)_{\text{reading}} \\
&= \{0.809453,11.1488\}
\end{aligned}
$$

## Exercises {#sec:ch07-exercises}

{{< thm kind="exercise" label="ex:ch07-schur-prec" >}}
Let $\Omega = \Sigma^{-1}$ be the precision matrix of $\mathbf{Y} \sim \mathcal{N}_p(\boldsymbol{\theta}, \Sigma)$. Using the block-matrix inversion identity, show that the partial regression vector in {{< eqref "eq:ch07-partial-beta" >}} satisfies $\boldsymbol{\beta}_{j \mid -j} = -\Omega_{j,j}^{-1}\Omega_{j,-j}^T$, and deduce that $Y_i$ and $Y_j$ are conditionally independent given all remaining variables if and only if $\Omega_{i,j} = 0$.
{{< /thm >}}

{{< details summary="Symbolic Solution & Instantiation" >}}

{{< marginnote >}}Invert a general symbolic $3 \times 3$ covariance $\Sigma$: the precision $\Omega$ is the adjugate over $\Delta = \det\Sigma$.{{< /marginnote >}}

```js
// Ex 7.1: 3x3 block-matrix proof that beta_{1|2,3} = Sigma_{1,23}*Sigma_{23,23}^(-1) = -Omega_{11}^(-1)*Omega_{1,23}
const Sig = [[W.s11, W.s12, W.s13], [W.s12, W.s22, W.s23], [W.s13, W.s23, W.s33]]
const Om = await show`Inverse[${Sig}]`
```

$$
\begin{aligned}
&\Omega = \Sigma^{-1} = \frac{1}{\Delta}\left( \begin{array}{ccc} \Sigma_{22}\Sigma_{33}-\Sigma_{23}^2 & \Sigma_{13}\Sigma_{23}-\Sigma_{12}\Sigma_{33} & \Sigma_{12}\Sigma_{23}-\Sigma_{13}\Sigma_{22} \\ \Sigma_{13}\Sigma_{23}-\Sigma_{12}\Sigma_{33} & \Sigma_{11}\Sigma_{33}-\Sigma_{13}^2 & \Sigma_{12}\Sigma_{13}-\Sigma_{11}\Sigma_{23} \\ \Sigma_{12}\Sigma_{23}-\Sigma_{13}\Sigma_{22} & \Sigma_{12}\Sigma_{13}-\Sigma_{11}\Sigma_{23} & \Sigma_{11}\Sigma_{22}-\Sigma_{12}^2 \\ \end{array} \right), \\
&\Delta = -\Sigma_{13}^2\Sigma_{22}+2\Sigma_{12}\Sigma_{13}\Sigma_{23}-\Sigma_{11}\Sigma_{23}^2-\Sigma_{12}^2\Sigma_{33}+\Sigma_{11}\Sigma_{22}\Sigma_{33}
\end{aligned}
$$

{{< marginnote >}}Form the covariance-side slope $\Sigma_{1,23}\Sigma_{23,23}^{-1}$ from the $2 \times 2$ block inverse.{{< /marginnote >}}

```js
const betaCov = await show`${Sig}[[1, {2, 3}]] . Inverse[${Sig}[[{2, 3}, {2, 3}]]]`
```

$$
\Sigma_{1,23}\Sigma_{23,23}^{-1} = \left\{\frac{\Sigma_{12}\Sigma_{33}-\Sigma_{13}\Sigma_{23}}{\Sigma_{22}\Sigma_{33}-\Sigma_{23}^2},\frac{\Sigma_{13}\Sigma_{22}-\Sigma_{12}\Sigma_{23}}{\Sigma_{22}\Sigma_{33}-\Sigma_{23}^2}\right\}
$$

{{< marginnote >}}Form the precision-side slope $-\Omega_{11}^{-1}\Omega_{1,23}$: the common factor $1/\Delta$ cancels.{{< /marginnote >}}

```js
const betaPrec = await show`-${Om}[[1, {2, 3}]] / ${Om}[[1, 1]]`
```

$$
-\Omega_{11}^{-1}\Omega_{1,23} = \left\{-\frac{\Sigma_{13}\Sigma_{23}-\Sigma_{12}\Sigma_{33}}{\Sigma_{22}\Sigma_{33}-\Sigma_{23}^2},-\frac{\Sigma_{12}\Sigma_{23}-\Sigma_{13}\Sigma_{22}}{\Sigma_{22}\Sigma_{33}-\Sigma_{23}^2}\right\}
$$

{{< marginnote >}}Verify $\Sigma_{1,23}\Sigma_{23,23}^{-1} - (-\Omega_{11}^{-1}\Omega_{1,23}) = \mathbf{0}$.{{< /marginnote >}}

```js
await show`FullSimplify[${betaCov} - ${betaPrec}]`
```

$$
\Sigma_{1,23}\Sigma_{23,23}^{-1} - \bigl(-\Omega_{11}^{-1}\Omega_{1,23}\bigr) = \{0,0\}
$$

{{< /details >}}

{{< thm kind="exercise" label="ex:ch07-mar-vs-mnar" >}}
Extend the Python script above to create $20\%$ missing entries in column 2 under (a) MCAR (uniform random mask), (b) MAR (missing with higher probability when $Y_{i,1}$ is in its bottom quartile), and (c) MNAR (missing whenever $Y_{i,2}$ falls below its 20th percentile). Implement {{< xref "alg:ch07-mar-gibbs" "full" >}} and compare its posterior for $\boldsymbol{\theta}$ against complete-case analysis across all three regimes.
{{< /thm >}}

{{< details summary="Symbolic Solution & Instantiation" >}}

{{< marginnote >}}Integrate $z\,\phi(z)$ over $(z_0, \infty)$ to derive the inverse Mills ratio bias $E[Z \mid Z > z_0]$ under left truncation.{{< /marginnote >}}

```js
// Ex 7.2: Exact complete-case MNAR bias when observations below z0 are truncated (zero complete-case bias under MCAR only)
const shift = await show`Assuming[Element[z0, Reals],
  FullSimplify[Integrate[z*Exp[-z^2/2]/Sqrt[2*Pi], {z, z0, Infinity}] / Integrate[Exp[-z^2/2]/Sqrt[2*Pi], {z, z0, Infinity}]]]`
```

$$
\begin{aligned}
&\mathbb{E}[Z \mid Z > z_0] \\
&= \frac{e^{-\frac{z_0^2}{2}} \sqrt{\frac{2}{\pi}}}{\operatorname{erfc} \left(\frac{z_0}{\sqrt{2}}\right)}
\end{aligned}
$$

{{< marginnote >}}Solve $\Phi(z) = \tfrac15$ for the $20\%$ standard normal quantile $z_{0.20}$.{{< /marginnote >}}

```js
const z20 = await show`z /. FindRoot[1/2*Erfc[-z/Sqrt[2]] == 1/5, {z, -0.84}]`
```

$$
z_{0.20} : \; \tfrac12\operatorname{erfc}\!\left(-\tfrac{z}{\sqrt{2}}\right) = \tfrac15 \;\Longrightarrow\; z = -0.841621
$$

{{< marginnote >}}Evaluate the resulting MNAR upward bias $\mathbb{E}[Z \mid Z > z_{0.20}]$.{{< /marginnote >}}

```js
await show`N[{${z20}, ${shift} /. z0 -> ${z20}}]`
```

$$
\bigl(z_{0.20},\; \mathbb{E}[Z \mid Z > z_{0.20}]\bigr) = \{-0.841621,0.349952\}
$$

{{< /details >}}

{{< thm kind="exercise" label="ex:ch07-iw-scale" >}}
For $p = 3$ and $S_0 = I_3$, simulate $10{,}000$ draws from $\Sigma \sim \operatorname{inverse-Wishart}(\nu_0, S_0^{-1})$ for $\nu_0 \in \{4, 6, 20\}$ and inspect the implied prior distribution of the off-diagonal correlation $\rho_{1,2} = \Sigma_{1,2}/\sqrt{\Sigma_{1,1}\Sigma_{2,2}}$. Why does $\nu_0 = p + 1 = 4$ produce a uniform marginal prior on each correlation $\rho_{i,j} \in (-1, 1)$?
{{< /thm >}}

{{< details summary="Symbolic Solution & Instantiation" >}}

{{< marginnote >}}Record the exponent $(\nu_0 - p - 1)/2$ of $(1 - r^2)$ in the marginal correlation prior under $\operatorname{IW}(\nu_0, I_p)$.{{< /marginnote >}}

```js
// Ex 7.3: Marginal prior p(rho) ~ (1 - rho^2)^((nu0 - p - 1)/2) under IW(nu0, I_p)
const expSym = await show`(nu0 - p - 1) / 2`
```

$$
\text{Exponent of } (1 - r^2) \text{ in } p(r) = \frac{1}{2} (-1+\nu_0 -p)
$$

{{< marginnote >}}Integrate $(1 - r^2)^{(\nu_0 - p - 1)/2}$ over $(-1, 1)$ to obtain its Beta normalizing constant.{{< /marginnote >}}

```js
await show`Assuming[nu0 > p - 1, FullSimplify[Integrate[(1 - r^2)^((nu0 - p - 1)/2), {r, -1, 1}]]]`
```

$$
\begin{aligned}
&\int_{-1}^1 (1 - r^2)^{(\nu_0 - p - 1)/2}\,dr \\
&= \frac{\sqrt{\pi} \Gamma \left(\frac{1}{2} (1+\nu_0 -p)\right)}{\Gamma \left(\frac{1}{2} (2+\nu_0 -p)\right)}
\end{aligned}
$$

{{< marginnote >}}Evaluate the exponent at $p = 3$ for $\nu_0 \in \{4, 6, 20\}$ (from uniform to concentrated near zero).{{< /marginnote >}}

```js
await show`Table[${expSym} /. {p -> 3, nu0 -> v}, {v, {4, 6, 20}}]`
```

$$
\left(\frac{\nu_0 - p - 1}{2}\right)_{p=3,\; \nu_0 \in \{4,\, 6,\, 20\}} = \{0,1,8\}
$$

{{< /details >}}
