---
title: "Nonconjugate Priors and Metropolis–Hastings"
linkTitle: "Metropolis–Hastings"
weight: 20
label: "ch:mh"
---

{{< newthought "The Gibbs sampler needs" />}} every full conditional to be a distribution we can sample. Change the sampling model from normal to Poisson, or let a correlation parameter enter a covariance matrix, and that requirement fails. The **Metropolis–Hastings algorithm** asks for far less: the ability to *evaluate* the posterior density up to a constant.{{< cite "metropolis1953,hastings1970" >}} This chapter derives it from a counting argument, proves that it works, and shows that the Gibbs sampler of {{< xref "ch:gibbs" "full" >}} was a special case all along.

## Generalized Linear Models and the Loss of Conjugacy {#sec:ch10-glm}

Hoff’s motivating data are the number of offspring $Y$ and the age $x$ of 52 female song sparrows. Two-year-olds do best, and success declines afterwards, so we want a quadratic in age. But a quadratic for the mean itself may go negative. Modeling the *logarithm* of the mean avoids this and gives **Poisson regression**{{< index "Poisson regression" >}}:

$$
Y \mid \mathbf{x} \sim \operatorname{Poisson}(\theta_x), \qquad
\log\theta_x = \boldsymbol{\beta}^T\mathbf{x}, \qquad
\mathbf{x} = (1, x, x^2)^T. \label{eq:ch10-poisreg}
$$

A **generalized linear model**{{< index "generalized linear model" >}} connects a *linear predictor* $\boldsymbol{\beta}^T\mathbf{x}$ to $E[Y \mid \mathbf{x}]$ through a **link function**{{< index "link function" >}}: the log link for counts, and for binary data the logit link $\log\frac{\theta_x}{1 - \theta_x} = \boldsymbol{\beta}^T\mathbf{x}$, that is, logistic regression. With a prior $\boldsymbol{\beta} \sim \mathcal{N}_p(\boldsymbol{\beta}_0, \Sigma_0)$, the log-posterior for {{< eqref "eq:ch10-poisreg" >}} is

$$
\log p(\boldsymbol{\beta} \mid \mathbf{X}, \mathbf{y})
= \sum_{i=1}^n \bigl(y_i\,\boldsymbol{\beta}^T\mathbf{x}_i - e^{\boldsymbol{\beta}^T\mathbf{x}_i}\bigr) -
\frac{1}{2}(\boldsymbol{\beta} - \boldsymbol{\beta}_0)^T\Sigma_0^{-1}(\boldsymbol{\beta} - \boldsymbol{\beta}_0) + \text{const}. \label{eq:ch10-logpost}
$$

The exponential term is not quadratic, so no normal prior yields a normal posterior. The situation is nevertheless benign.

{{< proposition note="Log-Concavity of GLM Posteriors" label="prop:ch10-concave" >}}
Under a normal prior with $\Sigma_0 \succ 0$, the Poisson (log-link) and logistic (logit-link) posteriors are strictly log-concave in $\boldsymbol{\beta}$, hence unimodal.
{{< /proposition >}}

{{< proof >}}
Differentiating twice, the Hessian of the log-posterior is $-\sum_i w_i\mathbf{x}_i\mathbf{x}_i^T - \Sigma_0^{-1}$, with $w_i = \theta_{x_i}$ for Poisson and $w_i = \theta_{x_i}(1 - \theta_{x_i})$ for logistic regression. All weights are positive, so the first term is negative semidefinite and the second negative definite.
{{< /proof >}}

A grid would succeed here, but barely: with 100 points per coordinate, three coefficients need $10^6$ evaluations and five need $10^{10}$. Moreover, because $\beta_2$ and $\beta_3$ are strongly negatively correlated, nearly all of those points carry no probability.

## The Metropolis Algorithm {#sec:ch10-metropolis}

Suppose we wish to build a collection of values whose relative frequencies match the posterior, so that for any two values $\theta_a, \theta_b$ we have $\#\{\theta_a\}/\#\{\theta_b\} \approx p(\theta_a \mid y)/p(\theta_b \mid y)$. Standing at $\theta^{(s)}$, consider adding a nearby candidate $\theta^*$. The comparison we need,

$$
r = \frac{p(\theta^* \mid y)}{p(\theta^{(s)} \mid y)}
= \frac{p(y \mid \theta^*)\,p(\theta^*)}{p(y \mid \theta^{(s)})\,p(\theta^{(s)})}, \label{eq:ch10-ratio}
$$

does not involve the intractable constant $p(y)$. If $r \ge 1$, the candidate deserves at least as many copies as the current value: accept it. If $r < 1$, it deserves only a fraction $r$ of a copy: accept it with probability $r$, and otherwise **record the current value again**. The repeats are not waste. They are how the chain assigns weight.

{{< thm kind="algorithm" note="Metropolis Algorithm" label="alg:ch10-metropolis" >}}
Let $J(\theta^* \mid \theta)$ be a *symmetric* proposal, $J(\theta_b \mid \theta_a) = J(\theta_a \mid \theta_b)$, for example $\operatorname{normal}(\theta, \delta^2)$ or $\operatorname{uniform}(\theta - \delta, \theta + \delta)$. Given $\theta^{(s)}$:

1. Sample $\theta^* \sim J(\theta \mid \theta^{(s)})$.
2. Compute $\log r = \log p(y \mid \theta^*) + \log p(\theta^*) - \log p(y \mid \theta^{(s)}) - \log p(\theta^{(s)})$.
3. Sample $u \sim \operatorname{uniform}(0, 1)$. Set $\theta^{(s+1)} = \theta^*$ if $\log u < \log r$, and $\theta^{(s+1)} = \theta^{(s)}$ otherwise.
{{< /thm >}}

Working on the log scale in step 2 is not a nicety: products of hundreds of densities underflow to zero, and the ratio $0/0$ is meaningless. The output is a Markov chain, so the advice of {{< xref "ch:gibbs" "full" >}} carries over. Discard an initial **burn-in**{{< index "burn-in" >}} while the chain travels to the high-probability region, and measure the remainder by its effective sample size.

### Tuning the Proposal {#sec:ch10-tuning}

Unlike Gibbs, Metropolis has a knob. Hoff’s test case has a known answer: $n = 5$ observations $y = (9.37, 10.18, 9.16, 11.60, 10.33)$ with $\sigma^2 = 1$ and prior $\operatorname{normal}(5, 10)$, so that $\theta \mid y \sim \operatorname{normal}(10.03, 0.20)$. Starting deliberately far away at $\theta^{(0)} = 0$, he runs normal proposals with various $\delta^2$ and reports lag-1 autocorrelations $0.98, 0.77, 0.69, 0.84, 0.86$ for $\delta^2 = \frac{1}{32}, \frac{1}{2}, 2, 32, 64$. The best is in the *middle*. Small steps are nearly always accepted but go nowhere; large steps are nearly always rejected ({{< xref "fig:ch10-mh" "full" >}}).

{{< fig src="images/bayesian-hoff/fig-ch10-mh-tuning.svg" type="fullwidth" label="fig:ch10-mh" alt="Three Metropolis trace plots of 600 iterations started at zero with a shaded band around the posterior mean 10.03: proposal variance 1/32 drifts upward slowly and accepts 79 percent; proposal variance 2 reaches the band within a few steps and accepts 36 percent; proposal variance 64 shows long flat plateaus and accepts 9 percent" short="Metropolis chains under three proposal variances" >}}Metropolis chains of length 600 for Hoff’s five-observation normal model, all started at $\theta^{(0)} = 0$; the dashed line and band mark the exact posterior mean and $\pm 2$ posterior standard deviations. Left: $\delta^2 = 1/32$ accepts most proposals but takes tiny steps. Center: $\delta^2 = 2$ mixes well. Right: $\delta^2 = 64$ is mostly rejected and gets stuck on plateaus. The acceptance rates in the titles ($79\%$, $36\%$, $9\%$) are for these short runs and include the burn-in from zero.{{< /fig >}}

For a normal target the acceptance rate can be computed exactly.

{{< proposition note="Random-Walk Acceptance Rate for a Normal Target" label="prop:ch10-accept" >}}
If the target is $\operatorname{normal}(\mu, \tau^2)$ and the proposal is $\operatorname{normal}(\theta, \delta^2)$, the acceptance rate at stationarity is $\frac{2}{\pi}\arctan(2\tau/\delta)$.
{{< /proposition >}}

{{< proof >}}
Standardize so that $\mu = 0$, $\tau = 1$, $\ell = \delta/\tau$, and write the proposed jump as $u = \ell w$ with $w \sim \operatorname{normal}(0,1)$. Averaging the acceptance probability over the stationary position, $\int \phi(x)\min\{1, \phi(x+u)/\phi(x)\}\,dx = \int \min\{\phi(x), \phi(x + u)\}\,dx = 2\Phi(-\lvert u \rvert/2)$, the overlap of two unit normals a distance $\lvert u \rvert$ apart. With an independent $v \sim \operatorname{normal}(0,1)$, averaging over $w$ gives $2\Pr(v > \ell\lvert w \rvert/2)$. By rotational symmetry the wedge $\{v > \ell\lvert w \rvert/2\}$ has probability $\frac{1}{\pi}\bigl(\frac{\pi}{2} - \arctan\frac{\ell}{2}\bigr) = \frac{1}{\pi}\arctan\frac{2}{\ell}$.
{{< /proof >}}

With $\tau^2 = 1/5.1$ this gives $87.5\%$, $35.6\%$, and $7.0\%$ for $\delta^2 = \frac{1}{32}, 2, 64$, in line with the $87\%$ and $35\%$ Hoff observes for the first two (his finite-run estimate for the third is $5\%$). The usual advice is to run short pilot chains until the **acceptance rate**{{< index "acceptance rate" >}} lies between $20\%$ and $50\%$. Theory supports it. For idealized targets with $d$ independent components, Roberts, Gelman, and Gilks{{< cite "roberts1997" >}}{{< index "optimal scaling" >}} showed that as $d \to \infty$ the efficient proposal has scale about $2.38/\sqrt{d}$ times the target’s, with limiting acceptance rate $0.234$; in one dimension the corresponding optimum is near $0.44$ ({{< xref "ex:ch10-optimal" "full" >}}). These are guides, not certificates: a chain trapped in one mode may boast a perfect acceptance rate.

### Poisson Regression for the Sparrows {#sec:ch10-sparrow}

For several coefficients, the proposal’s *shape* matters as much as its size. The natural choice is a multivariate normal centered at $\boldsymbol{\beta}^{(s)}$ with covariance resembling the posterior’s. Borrowing from normal regression, Hoff uses $\hat{\sigma}^2(\mathbf{X}^T\mathbf{X})^{-1}$, where $\hat{\sigma}^2$ is the sample variance of $\log(y_i + \frac{1}{2})$; the half avoids $\log 0$. With priors $\beta_j \sim \operatorname{normal}(0, 100)$ the acceptance ratio is

$$
r = \frac{\prod_{i=1}^n \operatorname{dpois}\bigl(y_i,\, \exp(\mathbf{x}_i^T\boldsymbol{\beta}^*)\bigr)}{\prod_{i=1}^n \operatorname{dpois}\bigl(y_i,\, \exp(\mathbf{x}_i^T\boldsymbol{\beta}^{(s)})\bigr)} \times
\frac{\prod_{j=1}^3 \operatorname{dnorm}(\beta_j^*, 0, 10)}{\prod_{j=1}^3 \operatorname{dnorm}(\beta_j^{(s)}, 0, 10)}, \label{eq:ch10-sparrow}
$$

in which the Poisson mean is the *exponential* of the linear predictor.{{< sidenote >}}The displayed ratio on p. 180 of Hoff (2009) omits the exponential, writing $\operatorname{dpois}(y_i, \mathbf{x}_i^T\boldsymbol{\beta}^*)$; the R code on the same page correctly uses `exp(X%*%beta.p)`. See {{< xref "app:errata" "full" >}}.{{< /sidenote >}} Ten thousand iterations accept about $43\%$ of proposals and yield effective sample sizes of $818$, $778$, and $726$ for $\beta_1, \beta_2, \beta_3$; the marginals are indistinguishable from the million-point grid.

## Metropolis–Hastings: One Algorithm to Contain Them All {#sec:ch10-mh}

Metropolis proposals are symmetric; Gibbs proposals are not, yet are always accepted. Hastings’ generalization allows *any* proposal, at the price of one correction factor.

{{< thm kind="algorithm" note="Metropolis–Hastings" label="alg:ch10-mh" >}}
Target $p_0(x)$, known up to a constant. Given $x^{(s)}$:

1. Sample $x^* \sim J_s(x^* \mid x^{(s)})$.
2. Compute the acceptance ratio

   $$
   r = \frac{p_0(x^*)}{p_0(x^{(s)})} \times \frac{J_s(x^{(s)} \mid x^*)}{J_s(x^* \mid x^{(s)})}. \label{eq:ch10-mh-ratio}
   $$

3. Set $x^{(s+1)} = x^*$ with probability $\min(1, r)$, and $x^{(s+1)} = x^{(s)}$ otherwise.

The proposal may depend on the current state and on the iteration index $s$, but on no earlier state.
{{< /thm >}}

The correction $J_s(x^{(s)} \mid x^*)/J_s(x^* \mid x^{(s)})$ is easily remembered: *reverse over forward*. If a value is proposed far more often than its reverse move, its acceptance must be discounted or it would be over-represented. Letting $J_s$ depend on $s$ allows different blocks of $x$ to be updated in turn.

{{< proposition note="Metropolis and Gibbs Are Special Cases" label="prop:ch10-special" >}}
(i) If $J_s$ is symmetric, {{< eqref "eq:ch10-mh-ratio" >}} reduces to the Metropolis ratio $p_0(x^*)/p_0(x^{(s)})$. (ii) If $x = (u, v)$ and the proposal replaces $u$ by a draw from its full conditional $p_0(u \mid v)$, then $r \equiv 1$.
{{< /proposition >}}

{{< proof >}}
Part (i) is immediate. For (ii), $J(u^* \mid u, v) = p_0(u^* \mid v)$ and the reverse move has density $p_0(u \mid v)$, so
$$
r = \frac{p_0(u^*, v)}{p_0(u, v)} \cdot \frac{p_0(u \mid v)}{p_0(u^* \mid v)}
= \frac{p_0(u^* \mid v)\,p_0(v)}{p_0(u \mid v)\,p_0(v)} \cdot \frac{p_0(u \mid v)}{p_0(u^* \mid v)} = 1 .
$$
{{< /proof >}}

### Why It Works {#sec:ch10-theory}

Two separate facts are needed: that the chain *converges to something*, and that the something is $p_0$.

A chain is **irreducible**{{< index "irreducibility" >}} if it can eventually reach every region of positive target probability from anywhere. (Proposing $x \pm 2$ on the integers is reducible: even and odd numbers never meet.) It is **aperiodic**{{< index "aperiodicity" >}} if it does not cycle through a fixed sequence of regions, and **recurrent** if it is certain to return to any region of positive probability.

{{< theorem note="Ergodic Theorem" label="thm:ch10-ergodic" >}}
Let $\{x^{(1)}, x^{(2)}, \dots\}$ be an irreducible, aperiodic, and (positive) recurrent Markov chain. Then there is a unique distribution $\pi$ such that, as $s, S \to \infty$,
$$
\Pr(x^{(s)} \in A) \to \pi(A) \quad\text{for every set } A, \qquad
\frac{1}{S}\sum_{s=1}^S g(x^{(s)}) \to \int g(x)\,\pi(x)\,dx \label{eq:ch10-ergodic}
$$
almost surely, for every $g$ with $\int \lvert g(x) \rvert\,\pi(x)\,dx < \infty$. Moreover $\pi$ is **stationary**{{< index "stationary distribution" >}}: if $x^{(s)} \sim \pi$ then $x^{(s+1)} \sim \pi$.
{{< /theorem >}}

Hoff states the theorem with “recurrent” alone; the word *positive* matters, because a symmetric random walk on the integers is irreducible and recurrent but has no stationary distribution.{{< sidenote >}}In general state spaces the theorem holds from almost every starting point, and from every one under *Harris* recurrence. An irreducible chain that possesses a proper invariant distribution is automatically positive recurrent, so {{< xref "thm:ch10-db" "full" >}} supplies the missing ingredient. Aperiodicity is needed for the first limit but not for the second.{{< /sidenote >}} It remains to identify $\pi$. Write $\alpha(x, x') = \min\{1, r\}$ for the acceptance probability. The transition kernel of {{< xref "alg:ch10-mh" "full" >}} has *two* parts, a density for accepted moves and an **atom**{{< index "rejection atom" >}} at the current point for rejections:

$$
T(x, A) = \int_A J(x' \mid x)\,\alpha(x, x')\,dx' + \rho(x)\,\mathbf{1}(x \in A), \qquad
\rho(x) = 1 - \int J(x' \mid x)\,\alpha(x, x')\,dx'. \label{eq:ch10-kernel}
$$

{{< theorem note="Detailed Balance for Metropolis–Hastings" label="thm:ch10-db" >}}
The kernel {{< eqref "eq:ch10-kernel" >}} satisfies **detailed balance**{{< index "detailed balance" >}} with respect to $p_0$: for all sets $A$ and $B$,
$$
\int_A p_0(x)\,T(x, B)\,dx = \int_B p_0(x)\,T(x, A)\,dx . \label{eq:ch10-db}
$$
Consequently $p_0$ is stationary for $T$.
{{< /theorem >}}

{{< proof >}}
*Accepted moves* ($x \neq x'$). Multiplying the acceptance probability through,
$$
p_0(x)\,J(x' \mid x)\,\alpha(x, x')
= p_0(x)\,J(x' \mid x)\,\min\left\{1,\, \frac{p_0(x')\,J(x \mid x')}{p_0(x)\,J(x' \mid x)}\right\}
= \min\bigl\{p_0(x)\,J(x' \mid x),\; p_0(x')\,J(x \mid x')\bigr\},
$$
which is symmetric in $(x, x')$. (Where $p_0(x)J(x' \mid x) = 0$ such a move has probability zero, and both sides vanish.) Integrating over $x \in A$, $x' \in B$ therefore equals integrating over $x \in B$, $x' \in A$.

*Rejections* ($x = x'$). The atom contributes $\int_A p_0(x)\,\rho(x)\,\mathbf{1}(x \in B)\,dx = \int_{A \cap B} p_0(x)\,\rho(x)\,dx$, which is symmetric in $A$ and $B$ whatever $\rho$ is.

Adding the two parts proves {{< eqref "eq:ch10-db" >}}. Taking $A$ to be the whole space and using $T(x, \text{whole space}) = 1$ gives $\int p_0(x)\,T(x, B)\,dx = \int_B p_0(x)\,dx$, which is stationarity.
{{< /proof >}}

The discrete sketch in most textbooks checks only $x \neq x'$ and leaves the diagonal implicit; with densities, the diagonal *is* the rejection atom, and stationarity fails if it is forgotten. A scan that applies several block kernels in turn still preserves $p_0$, since each factor does, although the composed kernel need not satisfy detailed balance.

## Metropolis within Gibbs: Regression with Correlated Errors {#sec:ch10-ar1}

Detailed balance holds kernel by kernel, so we may mix freely: Gibbs updates where full conditionals are available, Metropolis where they are not. This hybrid is **Metropolis within Gibbs**{{< index "Metropolis within Gibbs" >}}. Hoff’s example regresses temperature on CO$_2$ concentration at 200 time points from Antarctic ice cores. Ordinary least squares gives slope $0.08$ with nominal standard error $0.0038$, but the residuals have lag-1 autocorrelation $0.52$, so that standard error cannot be believed. A first-order autoregressive error model replaces $\sigma^2 I$ by

$$
\mathbf{y} \sim \mathcal{N}_n(\mathbf{X}\boldsymbol{\beta},\, \sigma^2 C_\rho), \qquad
(C_\rho)_{s,t} = \rho^{\lvert s - t \rvert}. \label{eq:ch10-ar1}
$$

Given $\rho$ this is regression with a known correlation matrix, and the updates are those of {{< xref "ch:regression" "full" >}} with $C_\rho^{-1}$ inserted:

$$
\begin{aligned}
\boldsymbol{\beta} \mid \cdot &\sim \mathcal{N}_p(\boldsymbol{\beta}_n, \Sigma_n), \qquad
\Sigma_n = \bigl(\mathbf{X}^TC_\rho^{-1}\mathbf{X}/\sigma^2 + \Sigma_0^{-1}\bigr)^{-1}, \quad
\boldsymbol{\beta}_n = \Sigma_n\bigl(\mathbf{X}^TC_\rho^{-1}\mathbf{y}/\sigma^2 + \Sigma_0^{-1}\boldsymbol{\beta}_0\bigr), \\
1/\sigma^2 \mid \cdot &\sim \operatorname{gamma}\!\left(\frac{\nu_0 + n}{2},\, \frac{\nu_0\sigma_0^2 + \operatorname{SSR}_\rho}{2}\right), \qquad
\operatorname{SSR}_\rho = (\mathbf{y} - \mathbf{X}\boldsymbol{\beta})^TC_\rho^{-1}(\mathbf{y} - \mathbf{X}\boldsymbol{\beta}).
\end{aligned} \label{eq:ch10-gls}
$$

With a vague prior $\boldsymbol{\beta}_n$ is close to the generalized least squares estimate, hence **Bayesian GLS**{{< index "generalized least squares" >}}. Naively, each new $\rho$ would cost an $O(n^3)$ inversion. The Markov structure of the errors removes it.

{{< proposition note="Closed Form for the AR(1) Precision Matrix" label="prop:ch10-ar1" >}}
For $\lvert \rho \rvert < 1$, $\lvert C_\rho \rvert = (1 - \rho^2)^{n-1}$, and $C_\rho^{-1}$ is tridiagonal:
$$
C_\rho^{-1} = \frac{1}{1 - \rho^2}
\begin{pmatrix}
1 & -\rho & & & \\
-\rho & 1 + \rho^2 & -\rho & & \\
& \ddots & \ddots & \ddots & \\
& & -\rho & 1 + \rho^2 & -\rho \\
& & & -\rho & 1
\end{pmatrix}. \label{eq:ch10-tridiag}
$$
Hence $\mathbf{e}^TC_\rho^{-1}\mathbf{e} = e_1^2 + \frac{1}{1 - \rho^2}\sum_{t=2}^n (e_t - \rho e_{t-1})^2$, computable in $O(n)$ operations.
{{< /proposition >}}

{{< proof >}}
A unit-variance AR(1) vector satisfies $e_1 = \eta_1$ and $e_t = \rho e_{t-1} + \sqrt{1 - \rho^2}\,\eta_t$ with independent standard normal $\eta_t$, and direct computation gives $\operatorname{Cov}(e_s, e_t) = \rho^{\lvert s - t \rvert}$. So $\boldsymbol{\eta} = M\mathbf{e}$ with $M$ lower bidiagonal: first row $(1, 0, \dots, 0)$, and row $t$ equal to $(1-\rho^2)^{-1/2}(\dots, -\rho, 1, \dots)$. Since $I = MC_\rho M^T$, we get $C_\rho^{-1} = M^TM$, which multiplies out to {{< eqref "eq:ch10-tridiag" >}}, and $\lvert C_\rho \rvert = \lvert M \rvert^{-2} = (1 - \rho^2)^{n-1}$. The quadratic form is $\lVert M\mathbf{e} \rVert^2$.
{{< /proof >}}

The conditional of $\rho$ is not standard, so we propose it with a **reflecting random walk**{{< index "reflecting random walk" >}}: draw $\rho^* \sim \operatorname{uniform}(\rho - \delta, \rho + \delta)$; if $\rho^* < 0$ replace it by $\lvert \rho^* \rvert$, and if $\rho^* > 1$ replace it by $2 - \rho^*$. This is symmetric on $(0, 1)$ ({{< xref "ex:ch10-reflect" "full" >}}), so no Hastings correction is required.

{{< thm kind="algorithm" note="Metropolis-within-Gibbs for AR(1) Regression" label="alg:ch10-mwg" >}}
Given $(\boldsymbol{\beta}^{(s)}, \sigma^{2(s)}, \rho^{(s)})$, one scan consists of:

1. **Gibbs**: draw $\boldsymbol{\beta}^{(s+1)}$ from {{< eqref "eq:ch10-gls" >}} using $\sigma^{2(s)}, \rho^{(s)}$.
2. **Gibbs**: draw $\sigma^{2(s+1)}$ from {{< eqref "eq:ch10-gls" >}} using $\boldsymbol{\beta}^{(s+1)}, \rho^{(s)}$.
3. **Metropolis**: propose $\rho^*$ by reflection and accept it with probability $\min(1, r)$, where

   $$
   \log r = -\frac{n-1}{2}\log\frac{1 - \rho^{*2}}{1 - \rho^{(s)2}} -
   \frac{\operatorname{SSR}_{\rho^*} - \operatorname{SSR}_{\rho^{(s)}}}{2\sigma^{2(s+1)}} +
   \log\frac{p(\rho^*)}{p(\rho^{(s)})}. \label{eq:ch10-rho}
   $$
{{< /thm >}}

With diffuse priors and $\rho \sim \operatorname{uniform}(0,1)$, the first $1{,}000$ scans accept $32\%$ of the $\rho$ proposals, yet their effective sample size is only **23**. The acceptance rate looks healthy and the mixing is dreadful; only the latter matters. Hoff runs $25{,}000$ scans and keeps every 25th. Be clear about what **thinning**{{< index "thinning" >}} achieves: the retained draws are less correlated, but discarding the rest never adds information. For estimating a mean from a given run, using *all* the draws is in general at least as accurate, as Geyer argued;{{< cite "geyer1992" >}} thinning saves memory and downstream computation. Report the effective sample size, and modern rank-normalized $\widehat{R}$ over several chains,{{< cite "vehtari2021" >}} rather than the thinning interval.

The scientific answer changes by more than the standard error. The posterior mean slope is $0.028$ with 95% interval $(0.01, 0.05)$: still positive, but roughly a third of the OLS estimate. Runs of extreme temperatures are highly correlated with one another, and the GLS model counts them as few observations rather than many.

```python
import numpy as np

rng = np.random.default_rng(10)

def metropolis(logp, x0, L, S):
    """Random-walk Metropolis; L is a Cholesky factor of the proposal covariance."""
    x, lp, acc = np.array(x0, dtype=float), logp(x0), 0
    out = np.empty((S, x.size))
    for s in range(S):
        prop = x + L @ rng.normal(size=x.size)
        lpp = logp(prop)
        if np.log(rng.uniform()) < lpp - lp:         # log scale throughout
            x, lp, acc = prop, lpp, acc + 1
        out[s] = x                                   # a rejection repeats the old value
    return out, acc / S

def ess(x):
    """Effective sample size by Geyer's initial positive sequence."""
    x = x - x.mean()
    acf = np.correlate(x, x, "full")[x.size - 1:] / (x @ x)
    tau = -1.0
    for k in range(0, x.size - 1, 2):
        pair = acf[k] + acf[k + 1]
        if pair <= 0:
            break
        tau += 2 * pair
    return x.size / max(tau, 1.0)

# 1. Hoff's normal example: observed acceptance vs (2/pi) arctan(2 tau / delta)
yn = np.array([9.37, 10.18, 9.16, 11.60, 10.33])
lp_norm = lambda t: -0.5 * np.sum((yn - t) ** 2) - 0.5 * np.sum((t - 5.0) ** 2) / 10.0
for d2 in (1 / 32, 2.0, 64.0):
    ch, acc = metropolis(lp_norm, np.array([0.0]), np.array([[np.sqrt(d2)]]), 10_000)
    print(f"delta^2={d2:7.3f} accept={acc:.3f} "
          f"theory={2 / np.pi * np.arctan(2 * np.sqrt(1 / 5.1 / d2)):.3f} ESS={ess(ch[500:, 0]):.0f}")

# 2. Poisson regression on synthetic sparrow-like data
age = rng.integers(1, 7, size=52).astype(float)
X = np.column_stack([np.ones(52), age, age ** 2])
y = rng.poisson(np.exp(X @ np.array([0.2, 0.6, -0.13])))
def lp_pois(b):
    eta = X @ b
    return y @ eta - np.exp(eta).sum() - b @ b / 200.0   # normal(0, 100) priors
V = np.var(np.log(y + 0.5), ddof=1) * np.linalg.inv(X.T @ X)
B, acc = metropolis(lp_pois, np.zeros(3), np.linalg.cholesky(V), 10_000)
print(f"Poisson: accept={acc:.2f}, mean={B[1000:].mean(0).round(2)}, "
      f"ESS={[round(ess(B[1000:, j])) for j in range(3)]}")

# 3. Metropolis within Gibbs for AR(1) regression (synthetic ice-core-like series)
def ar1(n, rho):
    e = rng.normal(size=n)
    for t in range(1, n):
        e[t] = rho * e[t - 1] + np.sqrt(1 - rho ** 2) * e[t]
    return e

def whiten(M, rho):                                  # W'W = M' C_rho^{-1} M in O(n)
    W = M.copy()
    W[1:] = (M[1:] - rho * M[:-1]) / np.sqrt(1 - rho ** 2)
    return W

n = 200
Xt = np.column_stack([np.ones(n), 230 + 25 * ar1(n, 0.8)])
yt = Xt @ np.array([-10.0, 0.03]) + 2.0 * ar1(n, 0.8)
nu0, s20, iS0, delta = 1.0, 1.0, np.eye(2) / 1000.0, 0.1
s2, rho, keep, acc = np.var(yt), 0.5, [], 0
for s in range(10_000):
    W, w = whiten(Xt, rho), whiten(yt, rho)
    Vn = np.linalg.inv(W.T @ W / s2 + iS0)
    beta = Vn @ (W.T @ w) / s2 + np.linalg.cholesky(Vn) @ rng.normal(size=2)
    e = yt - Xt @ beta
    ssr = lambda r: np.sum(whiten(e, r) ** 2)
    s2 = 1.0 / rng.gamma((nu0 + n) / 2, 2.0 / (nu0 * s20 + ssr(rho)))   # scale = 1/rate
    rp = abs(rng.uniform(rho - delta, rho + delta))
    rp = 2 - rp if rp > 1 else rp
    lr = (-0.5 * (n - 1) * (np.log1p(-rp ** 2) - np.log1p(-rho ** 2))
          - (ssr(rp) - ssr(rho)) / (2 * s2))
    if np.log(rng.uniform()) < lr:
        rho, acc = rp, acc + 1
    keep.append((beta[1], s2, rho))
keep = np.array(keep)[1000:]
print(f"AR(1): accept={acc / 10_000:.2f}, slope 95% CI={np.quantile(keep[:, 0], [.025, .975]).round(3)}, "
      f"ESS(slope, sigma^2, rho)={[round(ess(keep[:, j])) for j in range(3)]}")
```

## Symbolic Check in Wolfram Language {#sec:ch10-wolfram}

Evaluates the stationary normal random-walk acceptance integral symbolically in `wolfram-ws-bridge` JavaScript mode, abstracts the normal-target example to general $(n, \sigma^2, \tau_0^2, \delta)$, verifies the closed-form AR(1) determinant and tridiagonal precision matrix for $n = 5$, and instantiates the symbolic acceptance formula on Hoff’s 5-point normal target.

```js
// Chapter 10: Symbolic Metropolis acceptance rate (general normal posterior) & AR(1) precision
const accRate = await show`Assuming[ell > 0,
  FullSimplify[Integrate[Erfc[Abs[ell*w]/(2*Sqrt[2])]*Exp[-w^2/2]/Sqrt[2*Pi], {w, -Infinity, Infinity}]]]`
```

$$
\begin{aligned}
&\alpha(\ell) = \int_{-\infty}^\infty \operatorname{erfc}\!\left(\frac{|\ell w|}{2\sqrt{2}}\right)\phi(w)\,dw \\
&= \frac{2 \cot^{-1}\left(\frac{\ell}{2}\right)}{\pi}
\end{aligned}
$$

```js
// Abstract the normal-target example: ell = delta / tau_n with 1/tau_n^2 = n/s2 + 1/t0^2
const accNormal = await show`Assuming[d > 0 && n > 0 && s2 > 0 && t0 > 0,
  FullSimplify[${accRate} /. ell -> d * Sqrt[n/s2 + 1/t0^2]]]`
```

$$
\begin{aligned}
&\alpha\!\left(d\sqrt{n/\sigma^2 + \tau_0^{-2}}\right) \\
&= \frac{2 \cot^{-1}\left(\frac{1}{2} d \sqrt{\frac{n}{\sigma^2}+\frac{1}{\tau_0^2}}\right)}{\pi}
\end{aligned}
$$

```js
// Verify AR(1) determinant and tridiagonal precision matrix symbolically for n = 5
await show`Factor[Det[Table[rho^Abs[i - j], {i, 5}, {j, 5}]]]`
```

$$
\det\!\bigl(\rho^{|i-j|}\bigr)_{1\le i,j\le 5} = (-1+\rho)^4 (1+\rho)^4
$$

```js
await show`Simplify[(1 - rho^2) * Inverse[Table[rho^Abs[i - j], {i, 5}, {j, 5}]]]`
```

$$
\begin{aligned}
&(1-\rho^2)\bigl(\rho^{|i-j|}\bigr)_{1\le i,j\le 5}^{-1} \\
&= \left( \begin{array}{ccccc} 1 & -\rho & 0 & 0 & 0 \\ -\rho & 1+\rho^2 & -\rho & 0 & 0 \\ 0 & -\rho & 1+\rho^2 & -\rho & 0 \\ 0 & 0 & -\rho & 1+\rho^2 & -\rho \\ 0 & 0 & 0 & -\rho & 1 \\ \end{array} \right)
\end{aligned}
$$

```js
// Instantiate symbolic accNormal on Hoff's 5-point normal target (n = 5, s2 = 1, t0^2 = 10; delta^2 in {1/32, 2, 64})
await show`N[Table[${accNormal} /. {n -> 5, s2 -> 1, t0 -> Sqrt[10], d -> Sqrt[d2]}, {d2, {1/32, 2, 64}}]]`
```

$$
\bigl(\alpha(\delta)\bigr)_{\delta^2 \in \{1/32,\, 2,\, 64\}} = \{0.874573,0.356176,0.0701892\}
$$

## Exercises {#sec:ch10-exercises}

{{< thm kind="exercise" label="ex:ch10-optimal" >}}
Extend the proof of {{< xref "prop:ch10-accept" "full" >}} to the expected squared jump. With $\ell = \delta/\tau$ and $\omega = \arctan(\ell/2)$, show by polar coordinates that $E[(\theta^{(s+1)} - \theta^{(s)})^2] = \frac{2\delta^2}{\pi}\bigl[\frac{\pi}{2} - \omega - \frac{1}{2}\sin 2\omega\bigr]$ at stationarity, and that the lag-1 autocorrelation is $1$ minus this quantity divided by $2\tau^2$. Maximize numerically over $\ell$ and confirm that the optimum is near $\ell = 2.4$ with acceptance rate near $0.44$. Why do finite-run autocorrelations started at $\theta^{(0)} = 0$ differ from these stationary values?
{{< /thm >}}

{{< details summary="Symbolic Solution & Instantiation" >}}

```js
// Ex 10.1: Symbolic expected squared jump & optimal 1D Metropolis scaling (tau = 1; 2.38 is d -> Inf limit)
const esjd = await show`FullSimplify[(2*ell^2/Pi) * (Pi/2 - ArcTan[ell/2] - Sin[2*ArcTan[ell/2]]/2)]`
```

$$
\begin{aligned}
&\operatorname{ESJD}(\ell) \\
&= \frac{\ell^2 \left(-\frac{4 \ell}{4+\ell^2}+\pi -2 \tan^{-1}\left(\frac{\ell}{2}\right)\right)}{\pi}
\end{aligned}
$$

```js
const acf1 = await show`FullSimplify[1 - ${esjd}/2]`
```

$$
\begin{aligned}
&\rho_1(\ell) = 1 - \frac{1}{2}\operatorname{ESJD}(\ell) \\
&= 1-\frac{\ell^2 \left(-\frac{4 \ell}{4+\ell^2}+\pi -2 \tan^{-1}\left(\frac{\ell}{2}\right)\right)}{2 \pi}
\end{aligned}
$$

```js
const ellStar = await wl`ell /. FindRoot[D[${esjd}, ell] == 0, {ell, 2.4}]`
await show`N[{${ellStar}, (2/Pi)*ArcCot[${ellStar}/2], ${acf1} /. ell -> ${ellStar}}]`
```

$$
\bigl(\ell^*,\; \alpha(\ell^*),\; \rho_1(\ell^*)\bigr)_{\tau=1} = \{2.4264,0.438862,0.627898\}
$$

{{< /details >}}

{{< thm kind="exercise" label="ex:ch10-reflect" >}}
Show that for $0 < \delta \le 1$ the reflecting random walk has density $J(b \mid a) = \frac{1}{2\delta}\bigl[\mathbf{1}(\lvert b - a \rvert < \delta) + \mathbf{1}(a + b < \delta) + \mathbf{1}(2 - a - b < \delta)\bigr]$ on $(0,1)$, and conclude that it is symmetric. What goes wrong if out-of-range proposals are instead redrawn until they fall inside $(0, 1)$, with no Hastings correction?
{{< /thm >}}

{{< details summary="Symbolic Solution & Instantiation" >}}

```js
// Ex 10.2: Normalization & symmetry of reflecting random walk vs. naive-redraw boundary depletion
await show`Assuming[0 < d <= 1/2 && 0 < a < d,
  FullSimplify[Integrate[1/(2*d), {b, 0, a + d}] + Integrate[1/(2*d), {b, 0, d - a}]]]`
```

$$
\int_0^1 J_{\text{refl}}(b \mid a)\,db = 1
$$

```js
const statFactor = await show`(Min[1, a + d] - Max[0, a - d]) / (2*d)`
```

$$
\begin{aligned}
&\frac{\pi_{\text{redraw}}(a)}{\pi(a)} \propto \frac{Z(a)}{2d} \\
&= \frac{-\max (0,a-d)+\min (1,a+d)}{2 d}
\end{aligned}
$$

```js
await show`N[${statFactor} /. {a -> 1/1000, d -> 1/5}]`
```

$$
\left.\frac{Z(a)}{2d}\right|_{a=0.001,\; d=0.2} = 0.5025
$$

{{< /details >}}

{{< thm kind="exercise" label="ex:ch10-logscale" >}}
To sample a positive parameter $\theta$, propose $\theta^* = \theta e^{\epsilon}$ with $\epsilon \sim \operatorname{normal}(0, \delta^2)$. Compute the Hastings correction $J(\theta \mid \theta^*)/J(\theta^* \mid \theta)$ and show that it equals $\theta^*/\theta$. Verify that the same algorithm arises by running a symmetric Metropolis walk on $\log\theta$ with the Jacobian included in the target, and demonstrate by simulation what distribution is sampled when the correction is omitted.
{{< /thm >}}

{{< details summary="Symbolic Solution & Instantiation" >}}

```js
// Ex 10.3: Log-scale multiplicative proposal Hastings ratio J(th | th*) / J(th* | th) = th* / th
const jFwd = await wl`Exp[-(Log[thP/th])^2/(2*d^2)] / (thP*d*Sqrt[2*Pi])`
const jRev = await wl`Exp[-(Log[th/thP])^2/(2*d^2)] / (th*d*Sqrt[2*Pi])`
const hRatio = await show`Assuming[th > 0 && thP > 0 && d > 0, FullSimplify[${jRev} / ${jFwd}]]`
```

$$
\frac{J(\theta \mid \theta^*)}{J(\theta^* \mid \theta)} = \frac{\theta^*}{\theta}
$$

```js
await show`${hRatio} /. {th -> 1, thP -> 2}`
```

$$
\left.\frac{J(\theta \mid \theta^*)}{J(\theta^* \mid \theta)}\right|_{\theta=1,\; \theta^*=2} = 2
$$

{{< /details >}}

{{< thm kind="exercise" label="ex:ch10-collapse" >}}
In {{< xref "alg:ch10-mwg" "full" >}} the update of $\rho$ conditions on $\boldsymbol{\beta}$. Integrate $\boldsymbol{\beta}$ out of {{< eqref "eq:ch10-ar1" >}} analytically to obtain $p(\mathbf{y} \mid \mathbf{X}, \sigma^2, \rho)$, and implement the alternative scan that first updates $\rho$ given $\sigma^2$ and then draws $\boldsymbol{\beta}$ given $(\rho, \sigma^2)$. Explain why the pair of steps is a valid update of $(\rho, \boldsymbol{\beta})$ jointly, and compare effective sample sizes per second.
{{< /thm >}}

{{< details summary="Symbolic Solution & Instantiation" >}}

```js
// Ex 10.4: Marginal covariance of y | X, sigma^2, rho after integrating out beta ~ N(b0, S0)
await show`s2 * cMat[rho] + xMat . s0Mat . Transpose[xMat]`
```

$$
\operatorname{Cov}(y \mid X, \sigma^2, \rho) = \sigma^2 C (\rho)+X .\Sigma_0 .X^T
$$

```js
await show`N[{{1, 1/2}, {1/2, 1}} + {{1}, {2}}.{{4}}.{{1, 2}}]`
```

$$
\begin{aligned}
&\operatorname{Cov}(y \mid X, \sigma^2=1, \rho=0.5) \\
&= \left( \begin{array}{cc} 5. & 8.5 \\ 8.5 & 17. \\ \end{array} \right)
\end{aligned}
$$

{{< /details >}}
