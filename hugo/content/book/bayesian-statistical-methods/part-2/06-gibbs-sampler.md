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

   where $n s_n^2(\theta) = \sum_{i=1}^n (y_i - \theta)^2 = (n - 1)s^2 + n(\bar{y} - \theta)^2$ can be evaluated in $O(1)$ time at every iteration without re-scanning the dataset!

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

In practice, always combine four diagnostic habits:{{< cite "gelman1992,vehtari2021" >}}
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

## Symbolic Check in Wolfram Language {#sec:ch06-wolfram}

Computes the bivariate-normal Gibbs transition mean and variance symbolically in `wolfram-ws-bridge` JavaScript mode, extracts the AR(1) contraction factor $\alpha = \rho^2$, and sums the integrated autocorrelation time to derive $S_{\text{eff}}/S = (1 - \rho^2)/(1 + \rho^2)$, instantiated at $\rho = 0.99$.

```js
// Chapter 6: Symbolic bivariate-normal Gibbs lag-k ACF and exact ESS ratio
const transMean = await show`Assuming[v > 0 && Element[m, Reals],
  Simplify[Integrate[rho*(m + Sqrt[v]*z)*Exp[-z^2/2]/Sqrt[2*Pi], {z, -Infinity, Infinity}]]] /. {m -> rho*x, v -> 1 - rho^2}`
const alpha = await wl`D[${transMean}, x]`   // AR(1) lag-1 contraction coefficient = rho^2
await show`Simplify[(v + Integrate[(rho*Sqrt[v]*z)^2*Exp[-z^2/2]/Sqrt[2*Pi], {z, -Infinity, Infinity}]) /. v -> 1 - rho^2]`
const tauInt = await show`Assuming[-1 < rho < 1, Together[Sum[2*(${alpha})^k, {k, 1, Infinity}] + 1]]`
const essRatio = await show`Together[1 / ${tauInt}]`

// Instantiate at rho = 99/100, S = 10,000
const ess99 = toJS(await wl`N[10000 * (${essRatio} /. rho -> 99/100)]`)
console.log(`At rho = 0.99, S = 10,000 -> exact S_eff = ${ess99.toFixed(2)}`)
```

**Symbolic outputs (`show`):**

- **Transition mean $E[X^{(s+1)} \mid X^{(s)} = x]$**: `rho^2*x`
- **Transition variance $\operatorname{Var}[X^{(s+1)} \mid X^{(s)} = x]$**: `1 - rho^4`
- **Integrated autocorrelation time $\tau_{\text{int}}$**: `(-1 - rho^2)/(-1 + rho^2)`
- **Exact ESS ratio $S_{\text{eff}}/S$**: `(1 - rho^2)/(1 + rho^2)`

**Console output:**

```text
At rho = 0.99, S = 10,000 -> exact S_eff = 100.50
```

## Exercises {#sec:ch06-exercises}

{{< thm kind="exercise" label="ex:ch06-bvn-acf" >}}
Verify {{< eqref "eq:ch06-bvn-acf" >}} by showing that for the bivariate normal target $(X, Y) \sim \mathcal{N}_2\bigl(0, \bigl(\begin{smallmatrix} 1 & \rho \\ \rho & 1 \end{smallmatrix}\bigr)\bigr)$, the Gibbs update satisfies $X^{(s)} = \rho^2 X^{(s-1)} + \eta^{(s)}$ where $\eta^{(s)} \sim \mathcal{N}(0, 1 - \rho^4)$ is independent of $X^{(s-1)}$. Deduce $\operatorname{Corr}(X^{(s)}, X^{(s+k)}) = \rho^{2k}$ and $S_{\text{eff}} = S\,\frac{1-\rho^2}{1+\rho^2}$.
{{< /thm >}}

{{< thm kind="exercise" label="ex:ch06-improper-trap" >}}
Suppose you place the improper prior $p(\theta, \sigma^2) \propto 1$ (flat on $\sigma^2$, not $1/\sigma^2$) with $n = 3$ normal observations. Write down the formal full conditionals $p(\theta \mid \sigma^2, y)$ and $p(\sigma^2 \mid \theta, y)$. Verify that both are proper distributions ($\sigma^2 \mid \theta, y \sim \operatorname{inverse-gamma}(1/2, \text{SS}/2)$), yet after integrating out $\theta$ the marginal density of $\sigma^2$ has a $(\sigma^2)^{-1}$ tail and is *not* integrable as $\sigma^2 \to \infty$!
{{< /thm >}}

{{< thm kind="exercise" label="ex:ch06-mixture-fix" >}}
Implement the trimodal mixture Gibbs sampler from {{< xref "fig:ch06-gibbs" "full" >}} in Python and run 4 chains from $\delta^{(0)} \in \{1, 2, 3\}$ for $S = 2{,}000$ iterations. Compute the empirical component frequencies and $S_{\text{eff}}$ for $\theta$. Why does direct ancestral sampling ($\delta \sim \text{Categorical}(0.45, 0.10, 0.45)$, then $\theta \mid \delta$) have $S_{\text{eff}} = S$?
{{< /thm >}}
