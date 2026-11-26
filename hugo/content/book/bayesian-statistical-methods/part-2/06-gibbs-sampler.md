---
title: "Posterior Approximation with the Gibbs Sampler"
linkTitle: "The Gibbs Sampler"
weight: 20
label: "ch:gibbs"
---

{{< newthought "The moment we relax" />}} the artificial prior coupling $\operatorname{Var}(\theta \mid \sigma^2) = \sigma^2/\kappa_0$ from {{< xref "ch:normal" "full" >}} and specify independent priors $p(\theta, \sigma^2) = p(\theta)\,p(\sigma^2)$, the joint posterior $p(\theta, \sigma^2 \mid y)$ loses its closed form. Yet its *conditional* distributions—$p(\theta \mid \sigma^2, y)$ and $p(\sigma^2 \mid \theta, y)$—remain completely standard! Chapter 6 introduces the **Gibbs sampler**{{< index "Gibbs sampler" >}}{{< cite "geman1984,gelfand1990,hoff2009" >}}, our first **Markov chain Monte Carlo (MCMC)**{{< index "MCMC" >}} algorithm, which turns a sequence of tractable full conditional draws into dependent samples from an intractable joint posterior.

## Semiconjugate Priors and the Curse of Dimensionality {#sec:ch06-semiconjugate}

Consider the normal sampling model $Y_1, \dots, Y_n \mid \theta, \sigma^2 \stackrel{\text{i.i.d.}}{\sim} \operatorname{normal}(\theta, \sigma^2)$ with **semiconjugate**{{< index "semiconjugate prior" >}} (conditionally conjugate) independent priors:

$$
\theta \sim \operatorname{normal}(\mu_0, \tau_0^2), \qquad
\tilde{\sigma}^2 = \frac{1}{\sigma^2} \sim \operatorname{gamma}\!\left(\frac{\nu_0}{2},\, \frac{\nu_0 \sigma_0^2}{2}\right), \qquad
p(\theta, \sigma^2) = p(\theta)\,p(\sigma^2). \label{eq:ch06-semiconj-prior}
$$

Here $\tau_0^2$ is fixed directly by domain knowledge (for the midge wing lengths, $\mu_0 = 1.9$ and $\tau_0 = 0.95$ so that $\mu_0 - 2\tau_0 = 0$, placing 97.5% prior mass on positive lengths) rather than tied to $\sigma^2$. Why not approximate the resulting 2-D posterior $p(\theta, \tilde{\sigma}^2 \mid y)$ on a discrete grid of $G \times G$ points? In two dimensions ($G = 100 \implies 10^4$ grid points), a grid works—but in a $d$-parameter model, a grid requires $G^d$ evaluations (for $d = 20$ and $G = 100$, that is $10^{40}$ points!). This **curse of dimensionality**{{< index "curse of dimensionality" >}} forces us to abandon grids in favor of simulation methods that concentrate automatically where posterior mass lives.

### Full Conditional Distributions {#sec:ch06-full-cond}

A **full conditional distribution**{{< index "full conditional distribution" >}} is the posterior distribution of one parameter block given the data *and* all remaining parameters. Under {{< eqref "eq:ch06-semiconj-prior" >}}, both full conditionals are obtained immediately by kernel recognition:

1. **Mean given variance**: holding $\sigma^2$ fixed, {{< xref "prop:ch05-normal-mean" "full" >}} applies verbatim, giving

   $$
   \theta \mid \sigma^2, y_{1:n} \sim \operatorname{normal}(\mu_n, \tau_n^2), \qquad
   \tau_n^2 = \left(\frac{1}{\tau_0^2} + \frac{n}{\sigma^2}\right)^{-1}, \qquad
   \mu_n = \tau_n^2\!\left(\frac{\mu_0}{\tau_0^2} + \frac{n\bar{y}}{\sigma^2}\right). \label{eq:ch06-fc-theta}
   $$

2. **Precision given mean**: holding $\theta$ fixed, the likelihood is proportional to $(\tilde{\sigma}^2)^{n/2}\exp\bigl(-\frac{1}{2}\tilde{\sigma}^2\sum_{i=1}^n (y_i - \theta)^2\bigr)$, so multiplying by the $\operatorname{gamma}(\nu_0/2, \nu_0\sigma_0^2/2)$ prior gives

   $$
   \tilde{\sigma}^2 \mid \theta, y_{1:n} \sim \operatorname{gamma}\!\left(\frac{\nu_0 + n}{2},\; \frac{\nu_0 \sigma_0^2 + n s_n^2(\theta)}{2}\right), \label{eq:ch06-fc-prec}
   $$

   where

$$
n s_n^2(\theta) = \sum_{i=1}^n (y_i - \theta)^2 = (n - 1)s^2 + n(\bar{y} - \theta)^2
$$

can be evaluated in $O(1)$ time at every iteration without re-scanning the dataset!

## The Gibbs Sampler Algorithm {#sec:ch06-algorithm}

Suppose our target joint posterior is $p(\phi_1, \dots, \phi_p \mid y)$ and we can sample from every full conditional $p(\phi_j \mid \phi_{-j}, y)$. The **systematic-scan Gibbs sampler** cycles through the blocks, always conditioning on the most recently updated values:

{{< thm kind="algorithm" note="Systematic-Scan Gibbs Sampler" label="alg:ch06-gibbs" >}}
Initialize $\phi^{(0)} = (\phi_1^{(0)}, \dots, \phi_p^{(0)})$ in the support of the posterior. For $s = 1, 2, \dots, S$:

1. Sample $\phi_1^{(s)} \sim p(\phi_1 \mid \phi_2^{(s-1)}, \phi_3^{(s-1)}, \dots, \phi_p^{(s-1)}, y)$.
2. Sample $\phi_2^{(s)} \sim p(\phi_2 \mid \phi_1^{(s)}, \phi_3^{(s-1)}, \dots, \phi_p^{(s-1)}, y)$.
3. $\;\vdots$
4. Sample $\phi_p^{(s)} \sim p(\phi_p \mid \phi_1^{(s)}, \dots, \phi_{p-1}^{(s)}, y)$.

Return the Markov chain $\phi^{(1)}, \dots, \phi^{(S)}$ (typically discarding an initial warm-up/burn-in prefix).
{{< /thm >}}

For the two-block semiconjugate normal model ($\phi = (\theta, \tilde{\sigma}^2)$), each iteration simply alternates one draw from {{< eqref "eq:ch06-fc-theta" >}} and one draw from {{< eqref "eq:ch06-fc-prec" >}}. Because each move updates only one coordinate at a time, the trajectory takes axis-aligned horizontal and vertical steps across the posterior contours ({{< xref "fig:ch06-gibbs" "full" >}}, left panel).

{{< fig src="images/bayesian-hoff/fig-ch06-gibbs-diagnostics.svg" type="fullwidth" label="fig:ch06-gibbs" alt="Three panels: semiconjugate Gibbs sampler trajectory stepping across the midge wing-length posterior contours; slow mixing histogram versus true trimodal normal mixture density; and sticky traceplot showing infrequent jumps between modes at -3, 0, and +3" short="Gibbs trajectory and slow mixing in a multimodal target" >}}Left: semiconjugate Gibbs trajectory on the midge wing-length posterior, rapidly entering the high-density region within a few iterations. Center and right: Hoff’s trimodal mixture diagnostic ($0.45\,\mathcal{N}(-3, \tfrac13) + 0.10\,\mathcal{N}(0, \tfrac13) + 0.45\,\mathcal{N}(3, \tfrac13)$)—the Gibbs sampler gets trapped in individual modes for hundreds of steps, producing severe autocorrelation and a distorted empirical histogram after 1,500 draws.{{< /fig >}}

## Why Does Gibbs Sampling Work? Theory and Pitfalls {#sec:ch06-theory}

At first sight it feels almost magical that alternating *conditional* draws recovers the *joint* distribution. The mathematical mechanism rests on **stationarity**{{< index "stationary distribution" >}} and **ergodicity**:

{{< proposition note="Invariance of the Target Posterior under Gibbs Updates" label="prop:ch06-invariance" >}}
If $\phi^{(s-1)} \sim p(\phi \mid y)$, then a single conditional update replacing block $\phi_j$ by $\phi_j' \sim p(\phi_j \mid \phi_{-j}^{(s-1)}, y)$ preserves the joint distribution: $(\phi_j', \phi_{-j}^{(s-1)}) \sim p(\phi \mid y)$. Consequently, the full systematic scan in {{< xref "alg:ch06-gibbs" "full" >}} leaves $p(\phi \mid y)$ invariant.
{{< /proposition >}}

{{< proof >}}
By definition of conditional probability, the joint density of the new state $(\phi_j', \phi_{-j})$ when the previous state was drawn from $p(\phi \mid y)$ is

$$
p_{\text{new}}(\phi_j', \phi_{-j})
= p(\phi_{-j} \mid y)\,p(\phi_j' \mid \phi_{-j}, y)
= p(\phi_j', \phi_{-j} \mid y).
$$

Since every single-block kernel preserves $p(\phi \mid y)$, their composition (the full systematic scan) also preserves $p(\phi \mid y)$.
{{< /proof >}}

{{< remark note="Subtle caveats every practitioner should know" label="rem:ch06-caveats" >}}
1. **Invariance is not reversibility**: Although each single-coordinate Gibbs step is reversible with respect to $p(\phi \mid y)$, a *systematic* scan of $p \ge 2$ blocks is generally **not** reversible as a joint chain (though for $p = 2$, each marginal coordinate subchain is reversible); it preserves the target by {{< xref "prop:ch06-invariance" "full" >}} without obeying detailed balance for the whole sweep. In {{< xref "ch:mh" "full" >}} we show each single-block Gibbs update is a Metropolis–Hastings move with acceptance probability $r \equiv 1$.
2. **Positivity (irreducibility) is required**: If the support of $p(\phi_1, \phi_2 \mid y)$ consists of disconnected islands (for instance, uniform on $[0, 1]^2 \cup [2, 3]^2$), every coordinate-wise Gibbs step is trapped forever in whichever island it starts in! Strict positivity on a product support—or connectivity via coordinate moves—is required for convergence to $p(\phi \mid y)$ from arbitrary starting points.
3. **Proper conditionals do not guarantee a proper joint**: A notorious trap with improper priors is that well-defined full conditionals can correspond to an *improper* (non-integrable) joint posterior. For example, $p(x \mid y) = y e^{-xy}$ and $p(y \mid x) = x e^{-xy}$ on $(0, \infty)^2$ are both proper exponential densities, yet the only compatible joint density $p(x, y) \propto e^{-xy}$ has infinite integral! Always check joint propriety when using improper priors.
{{< /remark >}}

Under irreducibility and aperiodicity (formalized in {{< xref "ch:mh" "full" >}}), the **Ergodic Theorem** guarantees that regardless of the starting point $\phi^{(0)}$, as $S \to \infty$:
- the marginal distribution of $\phi^{(s)}$ converges in total variation to $p(\phi \mid y)$, and
- ergodic averages converge almost surely: $\frac{1}{S}\sum_{s=1}^S g(\phi^{(s)}) \to E[g(\phi) \mid y]$.

### Estimation vs. Approximation {#sec:ch06-est-vs-approx}

Hoff highlights a conceptual point that prevents endless confusion: **increasing the number of MCMC draws $S$ improves numerical approximation, never statistical information.** With $n = 9$ midges, running $S = 10^6$ Gibbs draws pins down the exact posterior mean $E[\theta \mid y]$ to five decimals, but the posterior *width* still reflects only $n = 9$ observations. Simulation cannot manufacture data!

## Diagnostics: Autocorrelation, Mixing, and Effective Sample Size {#sec:ch06-diagnostics}

Unlike i.i.d. Monte Carlo draws in {{< xref "ch:mc" "full" >}}, consecutive Gibbs draws $\phi^{(s-1)}$ and $\phi^{(s)}$ are **positively correlated**. Consider the cleanest analytical benchmark: a bivariate normal target with correlation $\rho$. Alternating draws from $X \mid Y \sim \mathcal{N}(\rho Y, 1 - \rho^2)$ and $Y \mid X \sim \mathcal{N}(\rho X, 1 - \rho^2)$ produces a Markov chain whose exact lag-$k$ autocorrelation is

$$
\operatorname{Corr}\bigl(X^{(s)}, X^{(s+k)}\bigr) = \rho^{2k}. \label{eq:ch06-bvn-acf}
$$

When $\rho = 0.99$, $\rho^2 = 0.9801$: consecutive draws are 98% redundant, and the chain crawls agonizingly along the diagonal ridge! Even worse, in a **multimodal target**—such as Hoff’s three-component normal mixture $\theta \mid \delta \sim \mathcal{N}(\mu_\delta, \tfrac13)$ with $\mu = (-3, 0, 3)$ and mixture weights $(0.45, 0.10, 0.45)$—the joint Gibbs sampler alternating $\theta \mid \delta$ and $\delta \mid \theta$ becomes **sticky**: once $\theta$ is near $-3$, $\delta$ stays at component $1$ with probability $> 0.999$, and the chain barely crosses the low-density valley ({{< xref "fig:ch06-gibbs" "full" >}}, center and right).

How does autocorrelation inflate our Monte Carlo variance? For a stationary chain with posterior variance $\sigma_g^2 = \operatorname{Var}[g(\phi) \mid y]$ and lag-$k$ autocorrelations $\rho_k = \operatorname{Corr}(g(\phi^{(s)}), g(\phi^{(s+k)}))$, the asymptotic variance of the ergodic average $\bar{g}_S = \frac{1}{S}\sum_{s=1}^S g(\phi^{(s)})$ is{{< cite "geyer1992,robert2004" >}}

$$
\operatorname{Var}(\bar{g}_S)
\approx \frac{\sigma_g^2}{S}\left(1 + 2\sum_{k=1}^{\infty} \rho_k\right)
= \frac{\sigma_g^2}{S_{\text{eff}}}, \qquad
S_{\text{eff}} = \frac{S}{1 + 2\sum_{k=1}^{\infty} \rho_k}. \label{eq:ch06-ess}
$$

The quantity $S_{\text{eff}}$ is the **effective sample size (ESS)**{{< index "effective sample size" >}}: the number of *independent* posterior draws that would yield the same Monte Carlo standard error as our $S$ correlated MCMC draws. For the bivariate normal benchmark {{< eqref "eq:ch06-bvn-acf" >}}, summing the geometric series gives $S_{\text{eff}} = S\,\frac{1 - \rho^2}{1 + \rho^2}$—so at $\rho = 0.99$, $S = 10{,}000$ Gibbs draws are worth only about $100$ independent draws!

In practice, always combine four diagnostic habits:{{< cite "gelman1992,vehtari2021" >}}{{< sidenote >}}Vehtari et al. (2021) is beyond Hoff (2009): rank-normalized split-$\widehat{R}$, its $1.01$ threshold, and separate bulk and tail effective sample sizes are not in Hoff’s book.{{< /sidenote >}}
1. **Traceplots**: inspect $\phi^{(s)}$ versus $s$ for drift (non-stationarity) or sticky plateaus.
2. **Multiple overdispersed chains & $\widehat{R}$**: launch chains from widely separated starting points; if they fail to overlap (as in a multimodal trap), the split-$\widehat{R}$ statistic stays above $1.01$.
3. **Autocorrelation function (ACF) and $S_{\text{eff}}$**: verify that lag-$k$ autocorrelations decay quickly to zero and that $S_{\text{eff}}$ is large enough (typically $S_{\text{eff}} \ge 1{,}000$) for every target quantity and tail quantile of interest.
4. **Reparameterization or blocking**: when high correlation slows Gibbs mixing, sample strongly correlated parameters *jointly* in one block or reparameterize to decouple them (a theme we revisit in {{< xref "ch:hierarchical" "full" >}} and {{< xref "ch:ordinal" "full" >}}).

```python
import numpy as np

# Semiconjugate Gibbs sampler for Hoff's midge wing length data
y = np.array([1.64, 1.70, 1.72, 1.74, 1.82, 1.82, 1.82, 1.90, 2.08])
n, ybar, s2 = len(y), np.mean(y), np.var(y, ddof=1)
mu0, t20, s20, nu0 = 1.9, 0.95**2, 0.01, 1.0

rng = np.random.default_rng(42)
S = 5_000
theta = np.empty(S)
sigma2 = np.empty(S)
s2_cur = s2  # initialize variance at sample variance

for s in range(S):
    # 1. Full conditional for theta | sigma^2, y
    t2n = 1.0 / (1.0 / t20 + n / s2_cur)
    mun = t2n * (mu0 / t20 + n * ybar / s2_cur)
    th_cur = rng.normal(mun, np.sqrt(t2n))
    # 2. Full conditional for 1/sigma^2 | theta, y (O(1) sum-of-squares identity)
    ss = nu0 * s20 + (n - 1) * s2 + n * (ybar - th_cur)**2
    prec_cur = rng.gamma(shape=(nu0 + n) / 2.0, scale=2.0 / ss)
    s2_cur = 1.0 / prec_cur
    theta[s], sigma2[s] = th_cur, s2_cur

def ess_fft(x):
    """Estimate ESS via initial positive sequence of FFT autocorrelations."""
    x = x - np.mean(x)
    n_x = len(x)
    f = np.fft.rfft(x, n=2 * n_x)
    acf = np.fft.irfft(f * np.conjugate(f))[:n_x]
    acf /= acf[0]
    # Sum paired autocorrelations (Geyer's initial positive sequence: (rho_0+rho_1), (rho_2+rho_3), ...)
    tau = -1.0
    for k in range(0, n_x // 2, 2):
        pair = acf[k] + acf[k + 1]
        if pair <= 0:
            break
        tau += 2.0 * pair
    return n_x / max(tau, 1.0)

print(f"Posterior theta: mean={theta.mean():.4f}, 95% CI={np.round(np.quantile(theta, [0.025, 0.975]), 4)}")
print(f"ESS(theta) = {ess_fft(theta):.0f} / {S}, ESS(sigma^2) = {ess_fft(sigma2):.0f} / {S}")
```

## Modern Developments: Couplings, Variational Inference, and Tempering {#sec:ch06-modern}

### Unbiased MCMC via Couplings {#sec:ch06-unbiased}

Running *two* Gibbs chains that eventually meet removes burn-in bias exactly, rather than waiting for it to become negligible.{{< sidenote >}}**Beyond Hoff (2009).** This material is not in Hoff’s book; Jacob, O’Leary and Atchadé (2020) turn coupling, an older proof technique, into a practical estimator.{{< cite "jacob2020" >}}{{< /sidenote >}} Let $(X_t)$ and $(Y_t)$ be two copies of the chain in {{< xref "alg:ch06-gibbs" "full" >}} with the same initial law, $Y$ lagging by one step, moved by a joint kernel under which each is marginally the Gibbs chain. Let $\tau = \inf\{t \ge 1 : X_t = Y_{t-1}\}$ be the **meeting time**{{< index "meeting time" >}}, after which the chains stay equal. Then

$$
H_k = h(X_k) + \sum_{t=k+1}^{\tau - 1}\bigl[h(X_t) - h(Y_{t-1})\bigr], \qquad
E[H_k] = E[h(\phi) \mid y]. \label{eq:ch06-unbiased}
$$

Why? Telescoping writes $E[h(\phi) \mid y] = E[h(X_k)] + \sum_{t > k}\bigl(E[h(X_t)] - E[h(X_{t-1})]\bigr)$; since $Y_{t-1}$ has the law of $X_{t-1}$, it may replace $X_{t-1}$, and all terms with $t \ge \tau$ are zero. If the chain converges with uniformly bounded moments of $h$ of order slightly above two and $\tau$ has geometric tails, the interchange of sum and expectation is justified, and $H_k$ has finite variance and finite expected cost. For Gibbs, draw each full conditional {{< eqref "eq:ch06-fc-theta" >}}–{{< eqref "eq:ch06-fc-prec" >}} from a *maximal coupling* of the two chains’ versions, which makes the two draws equal with the largest possible probability.

**When to use it.** Independent replicates of $H_k$ can be averaged across processors, with ordinary i.i.d. standard errors in place of {{< eqref "eq:ch06-ess" >}}. For one long, fast-mixing chain, Hoff’s recipe is cheaper. In a sticky multimodal target unbiasedness still holds in expectation, but rare enormous corrections make the variance misleading.

### Coordinate Ascent Variational Inference {#sec:ch06-cavi}

**Variational inference**{{< index "variational inference" >}} replaces simulation by optimization, approximating $p(\phi \mid y)$ by the closest factorized density $q(\phi) = \prod_j q_j(\phi_j)$ in $\operatorname{KL}(q \,\|\, p)$.{{< sidenote >}}**Beyond Hoff (2009).** This material is not in Hoff’s book; mean-field methods came from machine learning before 2009, and Blei, Kucukelbir and McAuliffe (2017) give the standard statistical account.{{< cite "blei2017" >}}{{< /sidenote >}} Holding the other factors fixed, minimizing over $q_j$ gives the **CAVI** update

$$
q_j(\phi_j) \;\propto\; \exp\bigl\{E_{q_{-j}}\bigl[\log p(\phi_j \mid \phi_{-j}, y)\bigr]\bigr\}, \label{eq:ch06-cavi}
$$

because, as a function of $q_j$, the objective is the KL divergence from $q_j$ to this density plus a constant. It is Gibbs with averaging in place of sampling: under {{< eqref "eq:ch06-semiconj-prior" >}}, $q(\theta)$ is normal and $q(\tilde{\sigma}^2)$ is gamma, as in {{< eqref "eq:ch06-fc-theta" >}} and {{< eqref "eq:ch06-fc-prec" >}} with $\tilde{\sigma}^2$ replaced by $E_q[\tilde{\sigma}^2]$ and $(\bar{y} - \theta)^2$ by $E_q[(\bar{y} - \theta)^2]$.

For the bivariate normal benchmark behind {{< eqref "eq:ch06-bvn-acf" >}}, averaging $-\frac{(x - \rho Y)^2}{2(1 - \rho^2)}$ over $q_Y$ gives

$$
q_X = \mathcal{N}\bigl(\rho\,m_Y,\; 1 - \rho^2\bigr), \qquad
m_X^{(s+1)} = \rho\,m_Y^{(s)}, \quad m_Y^{(s)} = \rho\,m_X^{(s)}
\;\Longrightarrow\; m_X^{(s+1)} = \rho^2\,m_X^{(s)}. \label{eq:ch06-cavi-bvn}
$$

The means converge to the exact value $0$, contracting by $\rho^2$ per sweep—precisely Gibbs’ lag-1 autocorrelation. But the variance is $1 - \rho^2$, the *conditional* variance, instead of the marginal value $1$: at $\rho = 0.99$ the reported standard deviation is $0.141$, about seven times too small, and no amount of iteration repairs it.

**When to use it.** Use CAVI for fast point estimates or initialization on large problems; keep Gibbs whenever interval widths matter.

### Non-Reversible Parallel Tempering {#sec:ch06-nrpt}

**Parallel tempering**{{< index "parallel tempering" >}} can cure the sticky trimodal example of {{< xref "fig:ch06-gibbs" "full" >}} by linking it to an easy distribution through a ladder of intermediate ones.{{< sidenote >}}**Beyond Hoff (2009).** This material is not in Hoff’s book; parallel tempering itself predates 2009, but the round-trip and communication-barrier analysis of non-reversible swap schedules is due to Syed et al. (2022).{{< cite "syed2022" >}}{{< /sidenote >}} Choose a reference $\pi_0$ that is easy to sample (here, a wide normal), set $\pi_\beta \propto \pi_0^{1-\beta}\,\pi^{\beta}$ on $0 = \beta_0 < \dots < \beta_N = 1$, run one chain per $\beta_i$, and propose to swap the states of neighbours. The non-reversible scheme *alternates deterministically* between swapping the even pairs and the odd pairs, instead of choosing between them at random. If the swap between levels $i-1$ and $i$ is rejected with probability $r_i$, and swaps behave independently across iterations (efficient local exploration), the total rate of reference-to-target round trips is, with the limit taken as the largest gap $\beta_i - \beta_{i-1}$ shrinks to $0$,

$$
\mathcal{T} = \frac{1}{2 + 2\sum_{i=1}^N \frac{r_i}{1 - r_i}}
\;\longrightarrow\; \frac{1}{2 + 2\Lambda} \quad (N \to \infty), \qquad
\Lambda = \lim_{N \to \infty}\sum_{i=1}^N r_i. \label{eq:ch06-nrpt}
$$

Why? A state keeps moving in one direction until a rejection reverses it. Crossing two barriers with success probabilities $p_1, p_2$, with all back-and-forth reflections counted, succeeds with probability $p_1p_2/[1 - (1 - p_1)(1 - p_2)]$; hence $1/p - 1 = r/(1-r)$ *adds* along the ladder. Refining the ladder therefore does no harm, whereas random alternation makes each state a diffusive random walk whose round-trip rate tends to $0$. The **global communication barrier** $\Lambda$ depends on $\pi_0$ and $\pi$, not on the schedule.

**When to use it.** Plain Gibbs suffices for unimodal posteriors. When $\widehat{R}$ exposes separated modes—or the $\approx 306$-step residence time in {{< xref "ex:ch06-mixture-fix" "full" >}}—temper, with a reference wide enough to cover every mode.

### Computational & Symbolic Check {#sec:ch06-modern-check}

The script iterates the CAVI update {{< eqref "eq:ch06-cavi-bvn" >}} from the target’s precision matrix, and runs the Gibbs sampler on the same target to compare its lag-1 autocorrelation and standard deviation.{{< sidenote >}}**Beyond Hoff (2009).** This computational check and its Wolfram symbolic counterpart below verify the modern methods in this section and are not in Hoff’s book.{{< /sidenote >}}

```python
import numpy as np

# CAVI on the standardized bivariate normal, written in terms of its precision matrix
rho = 0.99
Om = np.linalg.inv(np.array([[1.0, rho], [rho, 1.0]]))
m_x, means = 3.0, [3.0]
for _ in range(400):
    m_y = -Om[1, 0] * m_x / Om[1, 1]
    m_x = -Om[0, 1] * m_y / Om[0, 0]
    means.append(m_x)
print(f"CAVI: mean {m_x:.5f}, SD {np.sqrt(1 / Om[0, 0]):.4f} (exact 1), rate {means[1] / means[0]:.4f}")

# Gibbs on the same target: same rate, as lag-1 autocorrelation, but the correct marginal SD
rng, S, sd = np.random.default_rng(6), 200_000, np.sqrt(1 - rho**2)
Z, x, cur = rng.normal(size=(S, 2)), np.empty(S), 0.0
for s in range(S):
    cur = rho * (rho * cur + sd * Z[s, 0]) + sd * Z[s, 1]
    x[s] = cur
print(f"Gibbs: SD {x.std():.3f}, lag-1 ACF {np.corrcoef(x[:-1], x[1:])[0, 1]:.4f} (exact {rho**2:.4f})")
```

{{< marginnote >}}Average the log kernel of $p(x \mid Y)$ over $q_Y$ with mean $m_Y$ and variance $v_Y$, writing $Y = m_Y + \sqrt{v_Y}\,Z$ with $Z \sim \mathcal{N}(0, 1)$.{{< /marginnote >}}

```js
// Chapter 6 (modern): CAVI fixed-point update on the standardized bivariate normal
const eLog = await show`Assuming[vY > 0 && Element[{mY, x, rho}, Reals],
  Integrate[-(x - rho*(mY + Sqrt[vY]*z))^2/(2*(1 - rho^2))*Exp[-z^2/2]/Sqrt[2*Pi], {z, -Infinity, Infinity}]]`
```

$$
E_{q_Y}\!\left[-\frac{(x - \rho Y)^2}{2(1-\rho^2)}\right] = -\frac{(x-\rho m_Y)^2+\rho^2 v_Y}{2 \left(1-\rho^2\right)}
$$

{{< marginnote >}}The curvature in $x$ gives the CAVI variance, whatever $v_Y$ is.{{< /marginnote >}}

```js
const qVar = await show`Simplify[-1/D[${eLog}, {x, 2}]]`
```

$$
\operatorname{Var}_{q}(X) = 1-\rho^2
$$

{{< marginnote >}}Solve for the stationary point in $x$ to obtain the mean update.{{< /marginnote >}}

```js
const qMean = await show`x /. First[Solve[D[${eLog}, x] == 0, x]]`
```

$$
E_{q}[X] = m_Y \rho
$$

{{< marginnote >}}Compose the $Y$ and $X$ updates into one full sweep, $m_X \mapsto \rho^2 m_X$.{{< /marginnote >}}

```js
const sweep = await show`${qMean} /. mY -> rho*mX`
```

$$
m_X^{(s+1)} = m_X \rho^2
$$

{{< marginnote >}}Subtract Gibbs’ lag-1 autocorrelation $E\bigl[X \cdot E[X^{(s+1)} \mid X]\bigr] = E[X \cdot \rho^2 X]$ from the CAVI contraction rate.{{< /marginnote >}}

```js
await show`Simplify[D[${sweep}, mX] - Integrate[x*(rho^2*x)*Exp[-x^2/2]/Sqrt[2*Pi], {x, -Infinity, Infinity}]]`
```

$$
\frac{\partial m_X^{(s+1)}}{\partial m_X^{(s)}} - \operatorname{Corr}\!\left(X^{(s)}, X^{(s+1)}\right)_{\text{Gibbs}} = 0
$$

{{< marginnote >}}Instantiate the CAVI standard deviation, the contraction rate, and the factor by which the true SD is understated, at $\rho = 0.99$.{{< /marginnote >}}

```js
await show`N[{Sqrt[${qVar}], D[${sweep}, mX], 1/Sqrt[${qVar}]} /. rho -> 99/100]`
```

$$
\begin{aligned}
&\bigl(\operatorname{SD}_q(X),\; \text{rate},\; \operatorname{SD}_p(X)/\operatorname{SD}_q(X)\bigr)_{\rho=0.99} \\
&= \{0.141067,0.9801,7.08881\}
\end{aligned}
$$

## Symbolic Check in Wolfram Language {#sec:ch06-wolfram}

Computes the bivariate-normal Gibbs transition mean and variance symbolically in `wolfram-ws-bridge` JavaScript mode, extracts the AR(1) contraction factor $\alpha = \rho^2$, sums the integrated autocorrelation time to derive $S_{\text{eff}}/S = (1 - \rho^2)/(1 + \rho^2)$, verifies the $O(1)$ sum-of-squares decomposition symbolically, and instantiates $S_{\text{eff}}$ at $\rho = 0.99$.

{{< marginnote >}}Integrate one full two-step Gibbs sweep of a bivariate normal to derive the conditional mean $E[X^{(s+1)} \mid X^{(s)} = x] = \rho^2 x$.{{< /marginnote >}}

```js
// Chapter 6: Symbolic bivariate-normal Gibbs transition, ACF, ESS & O(1) sum-of-squares identity
const transMean = await show`Assuming[v > 0 && Element[m, Reals],
  Simplify[Integrate[rho*(m + Sqrt[v]*z)*Exp[-z^2/2]/Sqrt[2*Pi], {z, -Infinity, Infinity}]]] /. {m -> rho*x, v -> 1 - rho^2}`
```

$$
\mathbb{E}\!\left[X^{(s+1)} \mid X^{(s)} = x\right] = \rho^2 x
$$

{{< marginnote >}}Differentiate the transition mean in $x$ to read off the AR(1) contraction coefficient $\alpha$.{{< /marginnote >}}

```js
const alpha = await show`D[${transMean}, x]`   // AR(1) lag-1 contraction coefficient = rho^2
```

$$
\alpha = \frac{\partial}{\partial x}\,\mathbb{E}\!\left[X^{(s+1)} \mid X^{(s)} = x\right] = \rho^2
$$

{{< marginnote >}}Compute the one-step conditional variance $1 - \rho^4$, confirming an exact AR(1) transition.{{< /marginnote >}}

```js
await show`Simplify[(v + Integrate[(rho*Sqrt[v]*z)^2*Exp[-z^2/2]/Sqrt[2*Pi], {z, -Infinity, Infinity}]) /. v -> 1 - rho^2]`
```

$$
\operatorname{Var}\!\left(X^{(s+1)} \mid X^{(s)} = x\right) = 1-\rho^4
$$

{{< marginnote >}}Sum $1 + 2\sum_{k=1}^\infty \rho^{2k}$ to obtain the integrated autocorrelation time $\tau_{\text{int}}$.{{< /marginnote >}}

```js
const tauInt = await show`Assuming[-1 < rho < 1, Together[Sum[2*(${alpha})^k, {k, 1, Infinity}] + 1]]`
```

$$
\tau_{\text{int}} = 1 + 2\sum_{k=1}^\infty \rho^{2k} = \frac{-1-\rho^2}{-1+\rho^2}
$$

{{< marginnote >}}Invert $\tau_{\text{int}}$ to express the effective sample size ratio $S_{\text{eff}}/S = (1 - \rho^2)/(1 + \rho^2)$.{{< /marginnote >}}

```js
const essRatio = await show`Together[1 / ${tauInt}]`
```

$$
\frac{S_{\text{eff}}}{S} = \frac{1}{\tau_{\text{int}}} = \frac{1-\rho^2}{1+\rho^2}
$$

{{< marginnote >}}Verify the $O(1)$ sum-of-squares decomposition symbolically for $n = 3$ observations.{{< /marginnote >}}

```js
// Symbolic verification of the O(1) Gibbs sum-of-squares decomposition (n = 3)
await show`Expand[Sum[(y[i] - th)^2, {i, 3}]
  - (Sum[(y[i] - (y[1] + y[2] + y[3])/3)^2, {i, 3}] + 3*((y[1] + y[2] + y[3])/3 - th)^2)]`
```

$$
\begin{aligned}
&\sum_{i=1}^3 (y_i - \theta)^2 - \left[\sum_{i=1}^3 (y_i - \bar{y})^2 + 3(\bar{y} - \theta)^2\right] \\
&= 0
\end{aligned}
$$

{{< marginnote >}}Instantiate $S_{\text{eff}}$ at $\rho = 0.99$ and $S = 10{,}000$, illustrating severe correlation loss.{{< /marginnote >}}

```js
// Instantiate exact S_eff at rho = 99/100, S = 10,000
await show`N[10000 * (${essRatio} /. rho -> 99/100)]`
```

$$
S_{\text{eff}}\big|_{\rho=0.99,\; S=10{,}000} = 100.5
$$

## Exercises {#sec:ch06-exercises}

{{< thm kind="exercise" label="ex:ch06-bvn-acf" >}}
Verify {{< eqref "eq:ch06-bvn-acf" >}} by showing that for the bivariate normal target $(X, Y) \sim \mathcal{N}_2\bigl(0, \bigl(\begin{smallmatrix} 1 & \rho \\ \rho & 1 \end{smallmatrix}\bigr)\bigr)$, the Gibbs update satisfies $X^{(s)} = \rho^2 X^{(s-1)} + \eta^{(s)}$ where $\eta^{(s)} \sim \mathcal{N}(0, 1 - \rho^4)$ is independent of $X^{(s-1)}$. Deduce $\operatorname{Corr}(X^{(s)}, X^{(s+k)}) = \rho^{2k}$ and $S_{\text{eff}} = S\,\frac{1-\rho^2}{1+\rho^2}$.
{{< /thm >}}

{{< details summary="Symbolic Solution & Instantiation" >}}

{{< marginnote >}}Simplify the lag-$k$ autocorrelation of the bivariate-normal Gibbs chain to $(\rho^2)^k$.{{< /marginnote >}}

```js
// Ex 6.1: Bivariate-normal Gibbs AR(1) recursion, lag-k ACF, and ESS
await show`Assuming[-1 < rho < 1, FullSimplify[(rho^2)^k]]`
```

$$
\operatorname{Corr}\!\left(X^{(s)}, X^{(s+k)}\right) = \left(\rho^2\right)^k
$$

{{< marginnote >}}Sum the geometric series to obtain the exact ESS ratio $(1 - \rho^2)/(1 + \rho^2)$.{{< /marginnote >}}

```js
const essRatio = await show`Assuming[-1 < rho < 1, Together[1 / (1 + 2*Sum[rho^(2*k), {k, 1, Infinity}])]]`
```

$$
\begin{aligned}
&\frac{\operatorname{ESS}}{S} = \frac{1}{1 + 2\sum_{k=1}^\infty \rho^{2k}} \\
&= \frac{1-\rho^2}{1+\rho^2}
\end{aligned}
$$

{{< marginnote >}}Instantiate the exact fraction and decimal ESS ratio at $\rho = 0.90$.{{< /marginnote >}}

```js
await show`{${essRatio}, N[${essRatio}]} /. rho -> 9/10`
```

$$
\begin{aligned}
&\left(\frac{\operatorname{ESS}}{S}_{\text{exact}},\; \frac{\operatorname{ESS}}{S}_{\text{decimal}}\right)_{\rho=0.9} \\
&= \left\{\frac{19}{181},0.104972\right\}
\end{aligned}
$$

{{< /details >}}

{{< thm kind="exercise" label="ex:ch06-improper-trap" >}}
Suppose you place the improper prior $p(\theta, \sigma^2) \propto 1$ (flat on $\sigma^2$, not $1/\sigma^2$) with $n = 3$ normal observations. Write down the formal full conditionals $p(\theta \mid \sigma^2, y)$ and $p(\sigma^2 \mid \theta, y)$. Verify that both are proper distributions ($\sigma^2 \mid \theta, y \sim \operatorname{inverse-gamma}(1/2, \text{SS}/2)$), yet after integrating out $\theta$ the marginal density of $\sigma^2$ has a $(\sigma^2)^{-1}$ tail and is *not* integrable as $\sigma^2 \to \infty$!
{{< /thm >}}

{{< details summary="Symbolic Solution & Instantiation" >}}

{{< marginnote >}}Record the full-conditional exponent $-n/2$ of $\sigma^2$ under the flat prior $p(\theta, \sigma^2) \propto 1$.{{< /marginnote >}}

```js
// Ex 6.2: Flat prior p(theta, sigma^2) ~ 1 at n = 3 -> proper conditionals, improper marginal!
const condExp = await show`Assuming[n > 0, FullSimplify[-n/2]]`
```

$$
\begin{aligned}
&\text{Full-conditional exponent of } \sigma^2 \text{ in } p(\sigma^2 \mid \theta, y) \\
&= -\frac{n}{2}
\end{aligned}
$$

{{< marginnote >}}Record the marginal exponent $(1 - n)/2$ of $\sigma^2$ after integrating out $\theta$.{{< /marginnote >}}

```js
const margExp = await show`Assuming[n > 0, FullSimplify[-(n - 1)/2]]`
```

$$
\text{Marginal exponent of } \sigma^2 \text{ in } p(\sigma^2 \mid y) = \frac{1-n}{2}
$$

{{< marginnote >}}Evaluate both exponents at $n = 3$, exposing a proper conditional ($-3/2$) alongside a divergent marginal ($-1$).{{< /marginnote >}}

```js
await show`{${condExp}, ${margExp}} /. n -> 3`
```

$$
\begin{aligned}
&\bigl(\text{cond. exponent},\; \text{marginal exponent}\bigr)_{n=3} \\
&= \left\{-\frac{3}{2},-1\right\}
\end{aligned}
$$

{{< /details >}}

{{< thm kind="exercise" label="ex:ch06-mixture-fix" >}}
Implement the trimodal mixture Gibbs sampler from {{< xref "fig:ch06-gibbs" "full" >}} in Python and run 4 chains from $\delta^{(0)} \in \{1, 2, 3\}$ for $S = 2{,}000$ iterations. Compute the empirical component frequencies and $S_{\text{eff}}$ for $\theta$. Why does direct ancestral sampling ($\delta \sim \text{Categorical}(0.45, 0.10, 0.45)$, then $\theta \mid \delta$) have $S_{\text{eff}} = S$?
{{< /thm >}}

{{< details summary="Symbolic Solution & Instantiation" >}}

{{< marginnote >}}Express the mean residence time in mode $-3$ as the reciprocal of the one-step escape probability $p_{\text{esc}}$.{{< /marginnote >}}

```js
// Ex 6.3: One-step escape probability & mean residence time from mode -3 in Hoff's trimodal Gibbs sampler
const meanRes = await show`1 / pEsc`
```

$$
\mathbb{E}[\text{steps before escaping mode } -3] = \frac{1}{p_{\text{esc}}}
$$

{{< marginnote >}}Integrate numerically the probability that, from $\theta \sim \mathcal{N}(-3, \tfrac13)$, the next $\delta$-update leaves mode $-3$.{{< /marginnote >}}

```js
const esc = await show`NIntegrate[(Exp[-(th + 3)^2/(2/3)]/Sqrt[2*Pi/3]) * (1 - (45/100*Exp[-(th + 3)^2/(2/3)]) / (45/100*Exp[-(th + 3)^2/(2/3)] + 10/100*Exp[-th^2/(2/3)] + 45/100*Exp[-(th - 3)^2/(2/3)])), {th, -7, 7}]`
```

$$
\begin{aligned}
&p_{\text{esc}} = \int_{-7}^{7} \sqrt{\tfrac{3}{2\pi}}\, e^{-\frac{3}{2}(\theta+3)^2} \left(1-\frac{0.45\, e^{-\frac{3}{2}(\theta+3)^2}}{0.45\, e^{-\frac{3}{2}(\theta+3)^2}+0.10\, e^{-\frac{3}{2}\theta^2}+0.45\, e^{-\frac{3}{2}(\theta-3)^2}}\right) d\theta \\
&= 0.00327041
\end{aligned}
$$

{{< marginnote >}}Plug $p_{\text{esc}}$ into $1/p_{\text{esc}}$ to get the expected number of trapped iterations.{{< /marginnote >}}

```js
await show`N[{${esc}, ${meanRes} /. pEsc -> ${esc}}]`
```

$$
\begin{aligned}
&\bigl(p_{\text{esc}},\; \mathbb{E}[\text{steps trapped}]\bigr)_{\text{mode }-3} \\
&= \{0.00327041,305.772\}
\end{aligned}
$$

{{< /details >}}
