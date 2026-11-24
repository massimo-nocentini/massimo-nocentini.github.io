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

Setting $\nu_0 = p + 2$ gives a weakly informative prior centered at $E[\Sigma] = S_0$ with finite expectation.{{< sidenote >}}**Limitation of the inverse-Wishart prior:** a single scalar $\nu_0$ simultaneously governs our certainty about all $p$ diagonal variances *and* all $p(p-1)/2$ off-diagonal correlations! When variances differ in prior certainty from correlations, modern practice often separates scale and correlation priors (e.g., LKJ priors on correlations), or uses parameter expansion as in {{< xref "ch:ordinal" "full" >}}.{{< /sidenote >}}

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
For $\boldsymbol{\theta} \mid \Sigma, \mathbf{Y}$, collecting terms in $\boldsymbol{\theta}$ from $\log p(\boldsymbol{\theta}) + \log p(\mathbf{Y} \mid \boldsymbol{\theta}, \Sigma)$ gives $-\frac{1}{2}\boldsymbol{\theta}^T(\Lambda_0^{-1} + n\Sigma^{-1})\boldsymbol{\theta} + \boldsymbol{\theta}^T(\Lambda_0^{-1}\boldsymbol{\mu}_0 + n\Sigma^{-1}\bar{\mathbf{y}})$, which matches {{< eqref "eq:ch07-quad-recog" >}} directly. For $\Sigma \mid \boldsymbol{\theta}, \mathbf{Y}$, multiplying {{< eqref "eq:ch07-iw-pdf" >}} by $\lvert \Sigma \rvert^{-n/2}\exp\bigl(-\frac{1}{2}\operatorname{tr}(\mathbf{S}_{\boldsymbol{\theta}}\Sigma^{-1})\bigr)$ yields $\lvert \Sigma \rvert^{-(\nu_0 + n + p + 1)/2}\exp\bigl(-\frac{1}{2}\operatorname{tr}((S_0 + \mathbf{S}_{\boldsymbol{\theta}})\Sigma^{-1})\bigr)$, immediately recognizable as {{< eqref "eq:ch07-fc-sigma" >}}.
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

## Exercises {#sec:ch07-exercises}

{{< thm kind="exercise" label="ex:ch07-schur-prec" >}}
Let $\Omega = \Sigma^{-1}$ be the precision matrix of $\mathbf{Y} \sim \mathcal{N}_p(\boldsymbol{\theta}, \Sigma)$. Using the block-matrix inversion identity, show that the partial regression vector in {{< eqref "eq:ch07-partial-beta" >}} satisfies $\boldsymbol{\beta}_{j \mid -j} = -\Omega_{j,j}^{-1}\Omega_{j,-j}^T$, and deduce that $Y_i$ and $Y_j$ are conditionally independent given all remaining variables if and only if $\Omega_{i,j} = 0$.
{{< /thm >}}

{{< thm kind="exercise" label="ex:ch07-mar-vs-mnar" >}}
Extend the Python script above to create $20\%$ missing entries in column 2 under (a) MCAR (uniform random mask), (b) MAR (missing with higher probability when $Y_{i,1}$ is in its bottom quartile), and (c) MNAR (missing whenever $Y_{i,2}$ falls below its 20th percentile). Implement {{< xref "alg:ch07-mar-gibbs" "full" >}} and compare its posterior for $\boldsymbol{\theta}$ against complete-case analysis across all three regimes.
{{< /thm >}}

{{< thm kind="exercise" label="ex:ch07-iw-scale" >}}
For $p = 3$ and $S_0 = I_3$, simulate $10{,}000$ draws from $\Sigma \sim \operatorname{inverse-Wishart}(\nu_0, S_0^{-1})$ for $\nu_0 \in \{4, 6, 20\}$ and inspect the implied prior distribution of the off-diagonal correlation $\rho_{1,2} = \Sigma_{1,2}/\sqrt{\Sigma_{1,1}\Sigma_{2,2}}$. Why does $\nu_0 = p + 1 = 4$ produce a uniform marginal prior on each correlation $\rho_{i,j} \in (-1, 1)$?
{{< /thm >}}
