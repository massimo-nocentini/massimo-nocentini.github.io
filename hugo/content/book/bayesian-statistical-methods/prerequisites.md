---
title: "Mathematical & Probabilistic Prerequisites"
linkTitle: "Prerequisites"
matter: front
unnumbered: true
weight: 30
label: "ch:prerequisites"
---

{{< newthought "Every chapter of Hoff’s course" />}} rests on five compact mathematical pillars: iterated expectation and Jensen’s inequality, kernel recognition via Bayes’ rule, change-of-variables calculus with special functions, positive-definite linear algebra, and the ergodic theory of Monte Carlo and Markov chains. While {{< xref "ch:notation" "full" >}} catalogues symbols and parameterization conventions and {{< xref "app:dists" "full" >}} and {{< xref "app:toolkit" "full" >}} serve as quick-reference sheets, this introductory chapter *derives* each prerequisite from first principles and verifies it symbolically and numerically in the Wolfram Language (`wolfram-ws-bridge` JavaScript mode).{{< sidenote >}}All eleven working examples below are collected in `wolfram_prereqs.mjs` and were evaluated live against the Wolfram kernel with zero `console.log` calls—each symbolic derivation and numerical instantiation appears as a KaTeX equation directly beneath its `await show` call.{{< /sidenote >}}

## Probability, Expectation, and Jensen’s Inequality {#sec:pre-prob}

A Bayesian model specifies a **joint distribution** $p(x, z)$ over observable data and latent unknowns, then extracts **marginals** by integrating out nuisance variables, $p(x) = \int p(x \mid z)\,p(z)\,dz$, and **conditionals** by slicing and renormalizing, $p(z \mid x) = p(x, z)/p(x)$. Two variables $X_1, X_2$ are **conditionally independent** given $Z$ when $p(x_1, x_2 \mid z) = p(x_1 \mid z)\,p(x_2 \mid z)$—the structural backbone of exchangeability in {{< xref "ch:exchangeability" "full" >}}, hierarchical modeling in {{< xref "ch:hierarchical" "full" >}}, and graphical copulas in {{< xref "ch:ordinal" "full" >}}.

{{< thm kind="theorem" title="Laws of Total Expectation and Total Variance" label="thm:pre-tower" >}}
Let $X$ and $Z$ be random variables on a common probability space.
1. If $E\lvert X\rvert < \infty$, then $E[X] = E\{E[X \mid Z]\}$.
2. If $E[X^2] < \infty$, then

$$
\operatorname{Var}(X) = E\{\operatorname{Var}(X \mid Z)\} + \operatorname{Var}(E[X \mid Z]).
$$
{{< /thm >}}

*Proof sketch.* Expanding $\operatorname{Var}(X) = E[X^2] - (E[X])^2$ and applying part 1 to both $E[X^2] = E\{E[X^2 \mid Z]\}$ and $E[X] = E\{E[X \mid Z]\}$, add and subtract $E\{(E[X \mid Z])^2\}$ to separate the average within-group variance $E\{\operatorname{Var}(X \mid Z)\}$ from the between-group variance $\operatorname{Var}(E[X \mid Z])$. $\square$

{{< thm kind="corollary" title="Information Reduces Variance on Average" label="cor:pre-var-drop" >}}
For any square-integrable parameter $\theta$ and data $Y$, $E\{\operatorname{Var}(\theta \mid Y)\} \le \operatorname{Var}(\theta)$, with strict inequality whenever $E[\theta \mid Y]$ is non-constant. This holds *on average* over $Y$; a single surprising observation $y$ can increase $\operatorname{Var}(\theta \mid y)$ relative to $\operatorname{Var}(\theta)$.
{{< /thm >}}

The variance decomposition reappears throughout the book: posterior predictive overdispersion in {{< xref "ch:one-param" "full" >}}, Rao–Blackwellization in {{< xref "ch:mc" "full" >}}, MSE decomposition in {{< xref "ch:normal" "full" >}}, within/between-school variance in {{< xref "ch:hierarchical" "full" >}}, and nested GLMM predictive variance in {{< xref "ch:mixed" "full" >}}.

### Working Example 1a: Total Variance of a Mixture

Consider the three-component normal mixture from {{< xref "ch:gibbs" "full" >}} with weights $w_j$, means $\theta_j$, and variances $\sigma_j^2$. We verify symbolically that $\operatorname{Var}(X)$ splits into within-component and between-component terms, rewrite the between-component variance as a pairwise sum $\sum_{i<j} w_i w_j (\theta_i - \theta_j)^2$, and instantiate on Hoff’s trimodal target ($w = (0.45, 0.10, 0.45)$, $\theta = (-3, 0, 3)$, $\sigma_j^2 = 1/3$):

{{< marginnote >}}Write the density of a single $\mathcal{N}(m, v)$ mixture component.{{< /marginnote >}}

```js
// 1a. Law of total variance on Chapter 6's trimodal normal mixture
const { x, m, v } = W
const phi = await show`Exp[-(${x} - ${m})^2/(2*${v})]/Sqrt[2*Pi*${v}]`
```

$$
\phi(x \mid m, v) = \frac{e^{-\frac{(x-m)^2}{2 v}}}{\sqrt{2 \pi} \sqrt{v}}
$$

{{< marginnote >}}Compute the first two raw moments of a $\mathcal{N}(m, v)$ component by symbolic integration.{{< /marginnote >}}

```js
const mom = await show`Assuming[v > 0 && Element[m, Reals],
  Table[Integrate[x^k*${phi}, {x, -Infinity, Infinity}], {k, 1, 2}]]`
```

$$
\bigl(E[X \mid m, v],\; E[X^2 \mid m, v]\bigr) = \left\{m,m^2+v\right\}
$$

{{< marginnote >}}Write the within-component variance: the $w$-weighted average of the $\sigma_j^2$.{{< /marginnote >}}

```js
const within = await show`Sum[w[j]*s2[j], {j, 3}]`
```

$$
E\{\operatorname{Var}(X \mid Z)\} = w_1 \sigma_1^2 + w_2 \sigma_2^2 + w_3 \sigma_3^2
$$

{{< marginnote >}}Write the between-component variance: the $w$-weighted variance of the means $\theta_j$.{{< /marginnote >}}

```js
const between = await show`Sum[w[j]*th[j]^2, {j, 3}] - Sum[w[j]*th[j], {j, 3}]^2`
```

$$
\operatorname{Var}(E[X \mid Z]) = w_1 \theta_1^2 + w_2 \theta_2^2 + w_3 \theta_3^2 - \left(w_1 \theta_1 + w_2 \theta_2 + w_3 \theta_3\right)^2
$$

{{< marginnote >}}Verify the law of total variance symbolically for a 3-component normal mixture.{{< /marginnote >}}

```js
await show`Simplify[Sum[w[j]*(${mom}[[2]] /. {m -> th[j], v -> s2[j]}), {j, 3}] -
  Sum[w[j]*(${mom}[[1]] /. m -> th[j]), {j, 3}]^2 - (${within} + ${between})]`
```

$$
\begin{aligned}
&\operatorname{Var}(X) - \Bigl(\sum_{j=1}^3 w_j \sigma_j^2 + \sum_{j=1}^3 w_j\theta_j^2 - \bigl(\textstyle\sum_{j=1}^3 w_j\theta_j\bigr)^2\Bigr) \\
&= 0
\end{aligned}
$$

{{< marginnote >}}Rewrite the between-component variance as a pairwise sum of squared mean differences.{{< /marginnote >}}

```js
await show`Simplify[(${between} - Sum[w[i]*w[j]*(th[i] - th[j])^2, {i, 3}, {j, i + 1, 3}]) /. w[3] -> 1 - w[1] - w[2]]`
```

$$
\operatorname{Var}(E[X \mid Z]) - \sum_{i<j} w_i w_j (\theta_i - \theta_j)^2 = 0
$$

{{< marginnote >}}Write Chapter 6’s trimodal target as a list of substitution rules.{{< /marginnote >}}

```js
const hoff = await show`{w[1] -> 9/20, w[2] -> 1/10, w[3] -> 9/20, th[1] -> -3, th[2] -> 0, th[3] -> 3, s2[1] -> 1/3, s2[2] -> 1/3, s2[3] -> 1/3}`
```

$$
\begin{aligned}
&\bigl(w,\; \theta,\; \sigma^2\bigr)_{\text{Ch. 6}} \\
&= \Bigl\{w_1\to \frac{9}{20},w_2\to \frac{1}{10},w_3\to \frac{9}{20},\theta_1\to -3,\theta_2\to 0,\theta_3\to 3, \\
&\qquad \sigma_1^2\to \frac{1}{3},\sigma_2^2\to \frac{1}{3},\sigma_3^2\to \frac{1}{3}\Bigr\}
\end{aligned}
$$

{{< marginnote >}}Instantiate the within, between, and total variance on Chapter 6’s trimodal mixture.{{< /marginnote >}}

```js
await show`{${within}, ${between}, Integrate[x^2*Sum[w[j]*(${phi} /. {m -> th[j], v -> s2[j]}), {j, 3}] /. ${hoff}, {x, -Infinity, Infinity}]} /. ${hoff}`
```

$$
\begin{aligned}
&\bigl(E\{\operatorname{Var}(X \mid Z)\},\; \operatorname{Var}(E[X \mid Z]),\; \operatorname{Var}(X)\bigr)_{\text{Ch. 6}} \\
&= \left\{\frac{1}{3},\frac{81}{10},\frac{253}{30}\right\}
\end{aligned}
$$

Because $E[X] = 0$ by symmetry, $\operatorname{Var}(X) = E[X^2] = 253/30 \approx 8.433$. Nearly $96\%$ of the variance ($81/10$ out of $253/30$) lives *between* modes—explaining why a Gibbs sampler trapped in a single mode drastically underestimates posterior uncertainty.

{{< thm kind="theorem" title="Jensen’s Inequality" label="thm:pre-jensen" >}}
If $g$ is convex on an interval containing the support of $X$ and both $E\lvert X\rvert$ and $E\lvert g(X)\rvert$ are finite, then $E[g(X)] \ge g(E[X])$. If $g$ is strictly convex, equality holds if and only if $X$ is almost surely constant. (For concave $g$, the inequality reverses.)
{{< /thm >}}

*Proof sketch.* Choose a supporting line $g(x) \ge g(\mu) + c(x - \mu)$ at $\mu = E[X]$ and take expectations of both sides; the linear term vanishes. $\square$

Jensen’s inequality governs every nonlinear reparameterization in the book: log-odds versus probability in {{< xref "ch:mc" "full" >}}, variance $\sigma^2 = 1/\tilde{\sigma}^2$ versus precision in {{< xref "ch:normal" "full" >}}, and population-averaged rate $E[e^\eta]$ versus typical-group rate $e^{E[\eta]}$ in {{< xref "ch:mixed" "full" >}}.

### Working Example 1b: Two Jensen Gaps for a Gamma Precision

For $X \sim \operatorname{gamma}(a, b)$ (shape $a$, rate $b$), $x \mapsto 1/x$ is strictly convex while $x \mapsto \log x$ is strictly concave. Computing both expectations symbolically exposes the exact Jensen gaps, which we instantiate at the midge precision posterior $(a, b) = (5, 3/40)$:

{{< marginnote >}}Write the $\operatorname{gamma}(a, b)$ density in shape–rate form.{{< /marginnote >}}

```js
// 1b. Two Jensen gaps for a Gamma(a, b) precision random variable
const { a, b, x } = W
const dens = await show`${b}^${a}/Gamma[${a}]*${x}^(${a} - 1)*Exp[-${b}*${x}]`
```

$$
p(x \mid a, b) = \frac{b^a e^{-b x} x^{-1+a}}{\Gamma (a)}
$$

{{< marginnote >}}Integrate $1/x$ against a $\operatorname{gamma}(a, b)$ density to obtain $E[1/X]$ symbolically.{{< /marginnote >}}

```js
const eInv = await show`Assuming[a > 1 && b > 0, FullSimplify[Integrate[${dens}/x, {x, 0, Infinity}]]]`
```

$$
E[1/X] = \frac{b}{-1+a}
$$

{{< marginnote >}}Integrate $\log x$ against the same gamma density to express $E[\log X]$ via the digamma function.{{< /marginnote >}}

```js
const eLog = await show`Assuming[a > 0 && b > 0, FullSimplify[Integrate[Log[x]*${dens}, {x, 0, Infinity}]]]`
```

$$
E[\log X] = -\log (b)+\psi^{(0)}(a)
$$

{{< marginnote >}}Form the two exact Jensen gaps for $1/x$ (convex) and $\log x$ (concave).{{< /marginnote >}}

```js
const gaps = await show`Assuming[a > 1 && b > 0, {FullSimplify[${eInv} - b/a], FullSimplify[Log[a/b] - ${eLog}]}]`
```

$$
\begin{aligned}
&\Bigl(E[1/X] - \frac{1}{E[X]},\; \log E[X] - E[\log X]\Bigr) \\
&= \left\{\frac{b}{(-1+a) a},\log (a)-\psi^{(0)}(a)\right\}
\end{aligned}
$$

{{< marginnote >}}Evaluate both Jensen gaps numerically at the midge precision posterior $(a, b) = (5, 3/40)$.{{< /marginnote >}}

```js
await show`N[${gaps} /. {a -> 5, b -> 3/40}]`
```

$$
\bigl(\Delta_{1/x},\; \Delta_{\log}\bigr)_{a=5,\; b=3/40} = \{0.00375,0.10332\}
$$

---

## Conditioning, Bayes’ Rule, and Kernel Recognition {#sec:pre-kernel}

Bayes’ rule turns a generative model $p(y \mid \theta)$ and prior $p(\theta)$ into the posterior

$$
p(\theta \mid y) = \frac{p(y \mid \theta)\,p(\theta)}{p(y)}, \qquad p(y) = \int_\Theta p(y \mid \theta)\,p(\theta)\,d\theta.
$$

Dividing two hypotheses $H_1, H_0$ cancels $p(y)$ and yields $\text{posterior odds} = \operatorname{BF}_{10} \times \text{prior odds}$ (used in {{< xref "ch:exchangeability" "full" >}} and {{< xref "ch:regression" "full" >}}). When observations are conditionally independent given $\theta$, updating sequentially with $y_1$ and then $y_2$ produces the exact same posterior as updating in a single batch with $(y_1, y_2)$.

{{< thm kind="proposition" title="Kernel Uniqueness" label="prop:pre-kernel" >}}
Suppose a density $f(\theta)$ satisfies $f(\theta) \propto k(\theta)$ as a function of $\theta$. If $0 < \int_\Theta k(\theta)\,d\theta < \infty$, then $f(\theta) = k(\theta) / \int_\Theta k(\theta)\,d\theta$ uniquely. If $\int_\Theta k(\theta)\,d\theta = \infty$, no proper posterior exists.
{{< /thm >}}

The integrability clause is not a technicality: {{< xref "ch:gibbs" "full" >}} shows an improper prior whose full conditionals are all proper while the joint kernel integrates to $\infty$.

{{< thm kind="proposition" title="Score Identification" label="prop:pre-score" >}}
Two strictly positive $C^1$ densities $f_1, f_2$ on the same connected open support are identical if and only if their log-gradients (scores) agree everywhere: $\nabla \log f_1(\theta) = \nabla \log f_2(\theta)$.
{{< /thm >}}

Every full-conditional derivation in Parts II and III works by matching one of three score fingerprints:
- **Beta($\alpha, \beta$):** $\frac{\alpha - 1}{\theta} - \frac{\beta - 1}{1 - \theta}$,
- **Gamma($\alpha, \beta$):** $\frac{\alpha - 1}{\theta} - \beta$,
- **Normal($\ell/q, 1/q$):** $\ell - q\theta$ (linear coefficient $\ell$, precision $q$).

{{< remark note="What may—and may not—be dropped" label="rem:pre-drop" >}}
A multiplicative factor may be absorbed into $\propto$ only if it does not depend on the *variable currently being conditioned on*. The marginal likelihood $p(y)$ drops out when normalizing $p(\theta \mid y)$ within a single model, but it is the exact quantity that drives Bayes factors and model averaging across competing models in {{< xref "ch:regression" "full" >}}.
{{< /remark >}}

### Working Example 2a: Normal Kernel Normalization and Precision Weighting

Integrating the unnormalized normal kernel $e^{-\frac{1}{2}qx^2 + \ell x}$ yields its log-normalizer $\log Z(q, \ell)$, whose first two $\ell$-derivatives immediately return the mean $\ell/q$ and variance $1/q$. Substituting the sum of prior and data precisions reproduces the conjugate normal posterior of {{< xref "ch:normal" "full" >}}:

{{< marginnote >}}Integrate the unnormalized normal kernel $e^{-qx^2/2 + \ell x}$ to find its normalizing constant $Z(q, \ell)$.{{< /marginnote >}}

```js
// 2a. Normal kernel normalization Z(q, l) and precision-weighted posterior
const { q, l } = W
const z = await show`Assuming[q > 0 && Element[l, Reals], Integrate[Exp[-${q}*x^2/2 + ${l}*x], {x, -Infinity, Infinity}]]`
```

$$
\begin{aligned}
&Z(q,\ell) = \int_{-\infty}^{\infty} e^{-\frac{1}{2}q x^2 + \ell x}\,dx \\
&= \frac{e^{\frac{\ell^2}{2 q}} \sqrt{2 \pi}}{\sqrt{q}}
\end{aligned}
$$

{{< marginnote >}}Differentiate $\log Z(q, \ell)$ twice in $\ell$ to read off the mean $\ell/q$ and variance $1/q$.{{< /marginnote >}}

```js
const mv = await show`Simplify[{D[Log[${z}], l], D[Log[${z}], {l, 2}]}]`
```

$$
\begin{aligned}
&\bigl(\partial_\ell \log Z,\; \partial_\ell^2 \log Z\bigr) = \bigl(E[X],\; \operatorname{Var}(X)\bigr) \\
&= \left\{\frac{\ell}{q},\frac{1}{q}\right\}
\end{aligned}
$$

{{< marginnote >}}Substitute prior and data precisions to obtain the conjugate normal posterior mean and variance.{{< /marginnote >}}

```js
const post = await show`Together[${mv} /. {q -> 1/t0^2 + n/s2, l -> mu0/t0^2 + n*yb/s2}]`
```

$$
\begin{aligned}
&(\mu_n,\; \tau_n^2) \\
&= \left\{\frac{\mu_0 \sigma^2 +n \tau_0^2 \bar{y}}{\sigma^2 +n \tau_0^2},\frac{\sigma^2 \tau_0^2}{\sigma^2 +n \tau_0^2}\right\}
\end{aligned}
$$

{{< marginnote >}}Instantiate the normal posterior on Hoff’s midge wing-length data at $\sigma^2 = 0.017$.{{< /marginnote >}}

```js
await show`N[${post} /. {mu0 -> 19/10, t0 -> 95/100, n -> 9, yb -> 1804/1000, s2 -> 17/1000}]`
```

$$
(\mu_n,\; \tau_n^2)_{\text{midge},\; \sigma^2 = 0.017} = \{1.8042,0.00188494\}
$$

### Working Example 2b: Score Fingerprints and Marginal Evidence

We verify all three conjugate score fingerprints simultaneously (Beta–Binomial, Gamma–Poisson, Normal–Normal), and then confirm that dividing the joint density $p(y \mid \theta)\,p(\theta)$ by the recognized posterior $p(\theta \mid y)$ recovers the exact marginal evidence $p(y)$—instantiated on the rare-infection example ($a=2, b=20, n=20, y=0$) of {{< xref "ch:intro" "full" >}}:

{{< marginnote >}}Write the three log joint kernels $\log\{p(y \mid \theta)\,p(\theta)\}$: Beta–Binomial, Gamma–Poisson, Normal–Normal.{{< /marginnote >}}

```js
// 2b. Score fingerprints (Beta, Gamma, Normal) and marginal evidence p(y)
const logK = await show`{y*Log[t] + (n - y)*Log[1 - t] + (a - 1)*Log[t] + (b - 1)*Log[1 - t],
  sy*Log[t] - n*t + (a - 1)*Log[t] - b*t,
  -n*(yb - t)^2/(2*s2) - (t - mu0)^2/(2*t0^2)}`
```

$$
\begin{aligned}
&\bigl(\log k_{\text{beta}},\; \log k_{\text{gamma}},\; \log k_{\text{normal}}\bigr)(\theta) \\
&= \Bigl\{(-1+a) \log (\theta)+y \log (\theta)+(-1+b) \log (1-\theta)+(n-y) \log (1-\theta), \\
&\qquad -b \theta-n \theta+(-1+a) \log (\theta)+s_y \log (\theta),\; -\frac{n (\bar{y}-\theta)^2}{2 \sigma^2}-\frac{(\theta-\mu_0)^2}{2 \tau_0^2}\Bigr\}
\end{aligned}
$$

{{< marginnote >}}Check that the log-derivatives of the Beta, Gamma, and Normal kernels match their claimed posterior scores.{{< /marginnote >}}

```js
await show`Simplify[D[${logK}, t] - {
  (a + y - 1)/t - (b + n - y - 1)/(1 - t),
  (a + sy - 1)/t - (b + n),
  (mu0/t0^2 + n*yb/s2) - (1/t0^2 + n/s2)*t}]`
```

$$
\begin{aligned}
&\partial_\theta \log\{p(y \mid \theta)\,p(\theta)\} - \partial_\theta \log p_{\text{claimed}}(\theta \mid y)\Big|_{\text{beta},\,\text{gamma},\,\text{normal}} \\
&= \{0,0,0\}
\end{aligned}
$$

{{< marginnote >}}Write the Beta–Binomial joint density $p(y \mid \theta)\,p(\theta)$.{{< /marginnote >}}

```js
const joint = await show`Binomial[n, y]*t^y*(1 - t)^(n - y)*t^(a - 1)*(1 - t)^(b - 1)/Beta[a, b]`
```

$$
p(y \mid \theta)\,p(\theta) = \frac{(1-\theta)^{-1+b+n-y} \theta^{-1+a+y} \binom{n}{y}}{B(a,b)}
$$

{{< marginnote >}}Integrate out $\theta$ to compute the exact Beta–Binomial marginal likelihood $p(y)$.{{< /marginnote >}}

```js
const py = await show`Assuming[a > 0 && b > 0 && n >= y >= 0,
  Integrate[${joint}, {t, 0, 1}] /. Gamma[b + n - y]*Gamma[a + y] -> Beta[a + y, b + n - y]*Gamma[a + b + n]]`
```

$$
p(y) = \int_0^1 p(y \mid \theta)\,p(\theta)\,d\theta = \frac{B(a+y,b+n-y) \binom{n}{y}}{B(a,b)}
$$

{{< marginnote >}}Confirm that dividing the joint density by the normalized posterior recovers $p(y)$ identically.{{< /marginnote >}}

```js
await show`Assuming[a > 0 && b > 0 && n >= y >= 0 && 0 < t < 1,
  FullSimplify[${joint}/(t^(a + y - 1)*(1 - t)^(b + n - y - 1)/Beta[a + y, b + n - y]) - ${py}]]`
```

$$
\frac{p(y \mid \theta)\,p(\theta)}{p(\theta \mid y)} - p(y) = 0
$$

{{< marginnote >}}Evaluate the marginal evidence and posterior mean on Chapter 1’s rare-infection dataset ($n=20, y=0$).{{< /marginnote >}}

```js
await show`N[{${py}, (a + y)/(a + b + n)} /. {a -> 2, b -> 20, n -> 20, y -> 0}]`
```

$$
\bigl(p(y),\; E[\theta \mid y]\bigr)_{a=2,\; b=20,\; n=20,\; y=0} = \{0.256098,0.047619\}
$$

---

## Transformations, Special Functions, and Log-Concavity {#sec:pre-calculus}

Working in Bayesian inference constantly requires switching parameter scales—from probability $\theta$ to log-odds $\log\frac{\theta}{1-\theta}$ ({{< xref "ch:mc" "full" >}}), from precision $\tilde{\sigma}^2$ to variance $\sigma^2$ ({{< xref "ch:normal" "full" >}}), from centered $\theta_j$ to non-centered $\tilde{\theta}_j$ ({{< xref "ch:hierarchical" "full" >}}), and from positive $\theta$ to $\log\theta$ in Metropolis–Hastings proposals ({{< xref "ch:mh" "full" >}}).

{{< thm kind="theorem" title="Change of Variables" label="thm:pre-cov" >}}
Let $g : U \to V$ be a $C^1$ diffeomorphism between open subsets of $\mathbb{R}^p$, and let $X$ have density $p_X$ on $U$. Then $V = g(X)$ has density

$$
p_V(v) = p_X\bigl(g^{-1}(v)\bigr)\,\bigl\lvert \det Dg^{-1}(v) \bigr\rvert.
$$
{{< /thm >}}

{{< remark note="What commutes with reparameterization" label="rem:pre-equivariance" >}}
Quantiles are equivariant under strictly increasing maps ($Q_\alpha(g(X)) = g(Q_\alpha(X))$), while strictly decreasing maps send the $\alpha$-quantile to the $(1-\alpha)$-quantile. By contrast, **modes, HPD intervals, and means are not invariant**: the Jacobian factor $\lvert \det Dg^{-1}(v)\rvert$ shifts peaks and tilts density contours (a theme explored in {{< xref "ch:one-param" "full" >}} and {{< xref "ch:mc" "full" >}}).
{{< /remark >}}

Three special-function identities underpin almost every closed-form integral in Parts I–III:
- **Gamma recursion:** $\Gamma(a + 1) = a\,\Gamma(a)$ for $a > 0$, with $\Gamma(n) = (n - 1)!$ and $\Gamma(1/2) = \sqrt{\pi}$.
- **Beta–Gamma identity:**

  $$
  B(a, b) = \int_0^1 u^{a-1}(1-u)^{b-1}\,du = \frac{\Gamma(a)\Gamma(b)}{\Gamma(a+b)}.
  $$

- **Gaussian integral:** squaring $I = \int_{-\infty}^\infty e^{-x^2/2}\,dx$ and switching to polar coordinates gives

  $$
  I^2 = \int_0^{2\pi} \int_0^\infty r e^{-r^2/2}\,dr\,d\varphi = 2\pi \implies I = \sqrt{2\pi}.
  $$

{{< thm kind="proposition" title="Log-Concavity and Unimodality" label="prop:pre-logconcave" >}}
A density $p$ is **log-concave** if $\log p$ is concave on its support. Log-concavity is preserved under products (priors times likelihoods), affine pre-composition ($x \mapsto Ax + b$), and marginalization (Prékopa’s theorem). A *strictly* log-concave density has **at most one** mode (existence also requires that the supremum be attained in the interior).
{{< /thm >}}

Log-concavity guarantees well-behaved posterior geometry in GLMs ({{< xref "ch:mh" "full" >}}) and ordered probit models ({{< xref "ch:ordinal" "full" >}}), though it is sufficient rather than necessary for unimodality: both the inverse-gamma and Student-$t$ densities are unimodal yet not globally log-concave.

### Working Example 3a: Gamma Precision on Three Scales

Starting from $\tilde{\sigma}^2 \sim \operatorname{gamma}(a, b)$, we transform to variance $\sigma^2 = 1/\tilde{\sigma}^2$ and log-precision $\eta = \log\tilde{\sigma}^2$. Notice how the modes fail to commute ($1/\operatorname{mode}(\tilde{\sigma}^2) \ne \operatorname{mode}(\sigma^2)$) whereas the medians match identically, and how $\eta$ is strictly log-concave for *every* $a > 0$ (while $\tilde{\sigma}^2$ requires $a \ge 1$ and $\sigma^2$ is never globally log-concave). Here $(a, b) = (5, 3/40)$ is the midge posterior with $\sigma_n^2 \approx 0.015$, and Wolfram’s `GammaDistribution` uses *scale* $1/b = 40/3$:

{{< marginnote >}}Write the $\operatorname{gamma}(a, b)$ density of the precision $\tilde{\sigma}^2$.{{< /marginnote >}}

```js
// 3a. Gamma precision on three scales: precision, variance, and log-precision
const px = await show`b^a/Gamma[a]*x^(a - 1)*Exp[-b*x]`
```

$$
p_{\tilde{\sigma}^2}(x) = \frac{b^a e^{-b x} x^{-1+a}}{\Gamma (a)}
$$

{{< marginnote >}}Apply the 1-D change-of-variables formula to map $\tilde{\sigma}^2 \sim \operatorname{gamma}(a, b)$ to variance $\sigma^2 = 1/\tilde{\sigma}^2$.{{< /marginnote >}}

```js
const pv = await show`Assuming[a > 0 && b > 0 && v > 0, FullSimplify[(${px} /. x -> 1/v)*Abs[D[1/v, v]]]]`
```

$$
\begin{aligned}
&p_{\sigma^2}(v) = p_{\tilde{\sigma}^2}(1/v)\,\bigl\lvert \tfrac{d}{dv} v^{-1}\bigr\rvert \\
&= \frac{b^a e^{-\frac{b}{v}} v^{-1-a}}{\Gamma (a)}
\end{aligned}
$$

{{< marginnote >}}Verify that the resulting inverse-gamma density integrates to $1$ over $(0, \infty)$.{{< /marginnote >}}

```js
await show`Assuming[a > 0 && b > 0, Integrate[${pv}, {v, 0, Infinity}]]`
```

$$
\int_0^\infty p_{\sigma^2}(v)\,dv = 1
$$

{{< marginnote >}}Transform the same precision to the log scale $\eta = \log \tilde{\sigma}^2$ via its exponential Jacobian.{{< /marginnote >}}

```js
const pe = await show`Assuming[a > 0 && b > 0 && Element[h, Reals], FullSimplify[(${px} /. x -> Exp[h])*Abs[D[Exp[h], h]]]]`
```

$$
p_{\eta}(\eta)\big|_{\eta = \log \tilde{\sigma}^2} = \frac{b^a e^{-b e^\eta+a \eta}}{\Gamma (a)}
$$

{{< marginnote >}}Solve $\partial \log p = 0$ on both scales to compare the precision mode with the variance mode.{{< /marginnote >}}

```js
const modes = await show`Assuming[a > 1 && b > 0, Simplify[{x /. First[Solve[D[Log[${px}], x] == 0, x]], v /. First[Solve[D[Log[${pv}], v] == 0, v]]}]]`
```

$$
\begin{aligned}
&\bigl(\operatorname{mode}(\tilde{\sigma}^2),\; \operatorname{mode}(\sigma^2)\bigr) \\
&= \left\{\frac{-1+a}{b},\frac{b}{1+a}\right\}
\end{aligned}
$$

{{< marginnote >}}Compute the second log-derivatives on all three scales to test global log-concavity.{{< /marginnote >}}

```js
await show`Assuming[a > 0 && b > 0 && x > 0 && v > 0 && Element[h, Reals], Simplify[{D[Log[${px}], {x, 2}], D[Log[${pv}], {v, 2}], D[Log[${pe}], {h, 2}]}]]`
```

$$
\begin{aligned}
&\bigl(\partial_x^2 \log p_{\tilde{\sigma}^2},\; \partial_v^2 \log p_{\sigma^2},\; \partial_\eta^2 \log p_\eta\bigr) \\
&= \left\{\frac{1-a}{x^2},\frac{-2 b+v+a v}{v^3},-b e^\eta\right\}
\end{aligned}
$$

{{< marginnote >}}Instantiate $1/\operatorname{mode}(\tilde{\sigma}^2)$ versus $\operatorname{mode}(\sigma^2)$ to show that modes do not commute.{{< /marginnote >}}

```js
await show`N[{1/${modes}[[1]], ${modes}[[2]]} /. {a -> 5, b -> 3/40}]`
```

$$
\begin{aligned}
&\bigl(1/\operatorname{mode}(\tilde{\sigma}^2),\; \operatorname{mode}(\sigma^2)\bigr)_{a=5,\; b=3/40} \\
&= \{0.01875,0.0125\}
\end{aligned}
$$

{{< marginnote >}}Compare $1/\operatorname{med}(\tilde{\sigma}^2)$ with $\operatorname{med}(\sigma^2)$ to confirm median equivariance.{{< /marginnote >}}

```js
await show`N[{1/Median[GammaDistribution[5, 40/3]], Median[InverseGammaDistribution[5, 3/40]]}]`
```

$$
\begin{aligned}
&\bigl(1/\operatorname{med}(\tilde{\sigma}^2),\; \operatorname{med}(\sigma^2)\bigr)_{a=5,\; b=3/40} \\
&= \{0.0160568,0.0160568\}
\end{aligned}
$$

### Working Example 3b: The Beta Integral from a 2-D Jacobian

Let $X_1 \sim \operatorname{gamma}(a, 1)$ and $X_2 \sim \operatorname{gamma}(b, 1)$ be independent, and set $S = X_1 + X_2$, $U = X_1 / (X_1 + X_2)$. The inverse map $(x_1, x_2) = (su, s(1-u))$ has Jacobian determinant $-s$, which simultaneously proves $B(a, b) = \Gamma(a)\Gamma(b)/\Gamma(a+b)$ and shows that $S \sim \operatorname{gamma}(a+b, 1)$ is *independent* of $U \sim \operatorname{beta}(a, b)$:

{{< marginnote >}}Compute the 2-D Jacobian determinant of the map $(s, u) \mapsto (su, s(1 - u))$.{{< /marginnote >}}

```js
// 3b. Deriving the Beta integral & independence via a 2D Jacobian
const jac = await show`Simplify[Det[D[{s*u, s*(1 - u)}, {{s, u}}]]]`
```

$$
\det\frac{\partial(x_1, x_2)}{\partial(s, u)} = -s
$$

{{< marginnote >}}Push the two independent gamma densities through $(s, u)$ and multiply by $\lvert -s \rvert$ to get the joint density of $(S, U)$.{{< /marginnote >}}

```js
const joint = await show`Assuming[s > 0 && 0 < u < 1 && a > 0 && b > 0, Simplify[PowerExpand[
  (x1^(a - 1)*Exp[-x1]/Gamma[a])*(x2^(b - 1)*Exp[-x2]/Gamma[b]) /. {x1 -> s*u, x2 -> s*(1 - u)}]*Abs[${jac}]]]`
```

$$
\begin{aligned}
&p_{S,U}(s,u) = p_{X_1}(su)\,p_{X_2}\bigl(s(1-u)\bigr)\,\lvert -s \rvert \\
&= \frac{e^{-s} s^{-1+a+b} (1-u)^{-1+b} u^{-1+a}}{\Gamma (a) \Gamma (b)}
\end{aligned}
$$

{{< marginnote >}}Integrate out the total $s$ to derive the $\operatorname{beta}(a, b)$ marginal density of $u = X_1/(X_1 + X_2)$.{{< /marginnote >}}

```js
const margU = await show`Assuming[0 < u < 1 && a > 0 && b > 0, FullSimplify[Integrate[${joint}, {s, 0, Infinity}]]]`
```

$$
\begin{aligned}
&p_U(u) = \int_0^\infty p_{S,U}(s,u)\,ds \\
&= \frac{(1-u)^{-1+b} u^{-1+a} \Gamma (a+b)}{\Gamma (a) \Gamma (b)}
\end{aligned}
$$

{{< marginnote >}}Check that the joint density factors as $p_S(s)\,p_U(u)$, proving $S \perp U$.{{< /marginnote >}}

```js
await show`Assuming[s > 0 && 0 < u < 1 && a > 0 && b > 0,
  FullSimplify[${joint}/(${margU}*s^(a + b - 1)*Exp[-s]/Gamma[a + b])]]`
```

$$
\frac{p_{S,U}(s,u)}{p_S(s)\,p_U(u)} = 1
$$

{{< marginnote >}}Cross-check $\Gamma(3)\Gamma(9)/\Gamma(12)$ directly against $\int_0^1 u^2(1-u)^8\,du$.{{< /marginnote >}}

```js
await show`{Gamma[a]*Gamma[b]/Gamma[a + b] /. {a -> 3, b -> 9}, Integrate[u^2*(1 - u)^8, {u, 0, 1}]}`
```

$$
\begin{aligned}
&\Bigl(\tfrac{\Gamma(3)\Gamma(9)}{\Gamma(12)},\; \int_0^1 u^2(1-u)^8\,du\Bigr) \\
&= \left\{\frac{1}{495},\frac{1}{495}\right\}
\end{aligned}
$$

---

## Linear Algebra for Multivariate Models {#sec:pre-linalg}

From {{< xref "ch:mvn" "full" >}} onward, scalar variances become symmetric positive-definite (SPD) covariance matrices $\Sigma$, precisions become $\Omega = \Sigma^{-1}$, and regression projections become idempotent matrices $P_X$.

{{< thm kind="proposition" title="Characterizations of Positive-Definite Matrices" label="prop:pre-spd" >}}
For a real symmetric $p \times p$ matrix $A = A^T$, the following are equivalent: (i) $\mathbf{x}^T A \mathbf{x} > 0$ for all $\mathbf{x} \ne \mathbf{0}$; (ii) all eigenvalues of $A$ are strictly positive; (iii) all leading principal minors of $A$ are strictly positive; (iv) $A = L L^T$ for a *unique* lower-triangular Cholesky factor $L$ with strictly positive diagonal entries.
{{< /thm >}}

Cholesky factorization turns standard normal draws $\mathbf{z} \sim \mathcal{N}_p(\mathbf{0}, I_p)$ into arbitrary multivariate normals without explicitly inverting large matrices:
- **Covariance form:** if $\Sigma = L L^T$, then $\boldsymbol{\mu} + L\mathbf{z} \sim \mathcal{N}_p(\boldsymbol{\mu}, \Sigma)$.
- **Precision form:** if $A = L L^T$, then $A^{-1}\mathbf{b} + L^{-T}\mathbf{z} \sim \mathcal{N}_p(A^{-1}\mathbf{b}, A^{-1})$.

**Completing the square** ({{< eqref "eq:appB-vec-sq" >}} in {{< xref "app:toolkit" "full" >}}) expands $-\tfrac{1}{2}(\mathbf{x} - \mathbf{m})^T A (\mathbf{x} - \mathbf{m})$ around $\mathbf{m} = A^{-1}\mathbf{b}$ using symmetry $A = A^T$, immediately giving the multivariate Gaussian integral

$$
\int_{\mathbb{R}^p} \exp\!\left(-\tfrac{1}{2}\mathbf{x}^T A \mathbf{x} + \mathbf{b}^T\mathbf{x}\right) d\mathbf{x}
= (2\pi)^{p/2} \lvert A \rvert^{-1/2} \exp\!\left(\tfrac{1}{2}\mathbf{b}^T A^{-1} \mathbf{b}\right),
$$

used in {{< xref "ch:mvn" "full" >}}, {{< xref "ch:hierarchical" "full" >}}, {{< xref "ch:regression" "full" >}}, and {{< xref "ch:mixed" "full" >}}.

{{< thm kind="theorem" title="Schur Complement Factorization" label="thm:pre-schur" >}}
Partition an SPD matrix $\Sigma$ and vector $\mathbf{z}$ into blocks $a$ and $b$, with Schur complement $\Sigma_{b\mid a} = \Sigma_{b,b} - \Sigma_{b,a}\Sigma_{a,a}^{-1}\Sigma_{a,b}$ and residual $\mathbf{r} = \mathbf{z}_b - \Sigma_{b,a}\Sigma_{a,a}^{-1}\mathbf{z}_a$. Then

$$
\lvert \Sigma \rvert = \lvert \Sigma_{a,a} \rvert \cdot \lvert \Sigma_{b\mid a} \rvert, \qquad
\mathbf{z}^T \Sigma^{-1} \mathbf{z} = \mathbf{z}_a^T \Sigma_{a,a}^{-1} \mathbf{z}_a + \mathbf{r}^T \Sigma_{b\mid a}^{-1} \mathbf{r}.
$$
{{< /thm >}}

Together, those two identities *are* the marginal $\times$ conditional factorization of the multivariate normal density powering missing-data imputation in {{< xref "ch:mvn" "full" >}} and partial correlations in {{< xref "ch:ordinal" "full" >}}.

{{< thm kind="theorem" title="Orthogonal Projection and Zellner’s g-Prior Identity" label="thm:pre-proj" >}}
Let $X \in \mathbb{R}^{n \times p}$ have full column rank $p$, and set $P_X = X(X^T X)^{-1} X^T$. Then $P_X$ is symmetric and idempotent ($P_X^2 = P_X$), has $\operatorname{tr}(P_X) = \operatorname{rank}(P_X) = p$, and satisfies $X^T(I_n - P_X) = 0$. Because its eigenvalues lie in $\{0, 1\}$ ($p$ ones and $n - p$ zeros), for every $g > -1$,

$$
\lvert I_n + g P_X \rvert = (1 + g)^p, \qquad (I_n + g P_X)^{-1} = I_n - \frac{g}{1 + g} P_X.
$$
{{< /thm >}}

This theorem gives the entire closed-form marginal likelihood and $\operatorname{SSR}_g$ formula of {{< xref "ch:regression" "full" >}} in two lines.

### Working Example 4a: Vector Completing the Square and Cholesky

We verify completing the square in $\mathbb{R}^2$ and compute the symbolic lower-triangular Cholesky factor $L$ of a $2 \times 2$ covariance matrix (note that Wolfram’s `CholeskyDecomposition` returns the *upper* factor $R$ with $\Sigma = R^T R$, so we transpose it), instantiated on the reading-comprehension prior of {{< xref "ch:mvn" "full" >}}:

{{< marginnote >}}Solve the $2 \times 2$ linear system $A\mathbf{m} = \mathbf{b}$ symbolically for the quadratic center.{{< /marginnote >}}

```js
// 4a. Completing the square in R^2 and symbolic Cholesky factorization
const x = [W.x1, W.x2], b = [W.b1, W.b2], A = [[W.a11, W.a12], [W.a12, W.a22]]
const m = await show`Simplify[Inverse[${A}] . ${b}]`
```

$$
\begin{aligned}
&\mathbf{m} = A^{-1}\mathbf{b} \\
&= \left\{\frac{-A_{2,2} b_1 +A_{1,2} b_2}{A_{1,2}^2-A_{1,1} A_{2,2}},\frac{A_{1,2} b_1 -A_{1,1} b_2}{A_{1,2}^2-A_{1,1} A_{2,2}}\right\}
\end{aligned}
$$

{{< marginnote >}}Verify the vector completing-the-square identity in $\mathbb{R}^2$ by symbolic simplification.{{< /marginnote >}}

```js
await show`Simplify[(-${x} . ${A} . ${x}/2 + ${x} . ${b}) - (-(${x} - ${m}) . ${A} . (${x} - ${m})/2 + ${b} . ${m}/2)]`
```

$$
\begin{aligned}
&\Bigl(-\tfrac12\mathbf{x}^T A\mathbf{x} + \mathbf{x}^T\mathbf{b}\Bigr) - \Bigl(-\tfrac12(\mathbf{x}-\mathbf{m})^T A(\mathbf{x}-\mathbf{m}) + \tfrac12\mathbf{b}^T A^{-1}\mathbf{b}\Bigr) \\
&= 0
\end{aligned}
$$

{{< marginnote >}}Write a general $2 \times 2$ covariance matrix in standard-deviation and correlation form.{{< /marginnote >}}

```js
const cov = await show`{{s1^2, rho*s1*s2}, {rho*s1*s2, s2^2}}`
```

$$
\Sigma = \left( \begin{array}{cc} \sigma_1^2 & \rho \sigma_1 \sigma_2 \\ \rho \sigma_1 \sigma_2 & \sigma_2^2 \\ \end{array} \right)
$$

{{< marginnote >}}Compute the symbolic lower-triangular Cholesky factor $L$ of a $2 \times 2$ covariance matrix.{{< /marginnote >}}

```js
const L = await show`Assuming[s1 > 0 && s2 > 0 && -1 < rho < 1, FullSimplify[Transpose[CholeskyDecomposition[${cov}]]]]`
```

$$
\begin{aligned}
&L = \operatorname{chol}(\Sigma) \\
&= \left( \begin{array}{cc} \sigma_1 & 0 \\ \rho \sigma_2 & \sqrt{1-\rho^2} \sigma_2 \\ \end{array} \right)
\end{aligned}
$$

{{< marginnote >}}Instantiate $L$ on Chapter 7’s reading-comprehension prior and verify $L L^T = \Sigma$.{{< /marginnote >}}

```js
await show`{${L} /. {s1 -> 25, s2 -> 25, rho -> 1/2}, Simplify[${L} . Transpose[${L}] - ${cov}, -1 < rho < 1]}`
```

$$
\begin{aligned}
&\bigl(L_{\text{reading prior}},\; LL^T - \Sigma\bigr) \\
&= \left\{\left( \begin{array}{cc} 25 & 0 \\ \frac{25}{2} & \frac{25 \sqrt{3}}{2} \\ \end{array} \right),\left( \begin{array}{cc} 0 & 0 \\ 0 & 0 \\ \end{array} \right)\right\}
\end{aligned}
$$

### Working Example 4b: Schur Complement and Projection Matrix $P_X$

First we verify both Schur-complement identities on a general symbolic $3 \times 3$ covariance matrix $\Sigma$, then instantiate at $\Sigma_{1,1} = \Sigma_{2,2} = \Sigma_{3,3} = 4$, $\Sigma_{1,2} = \Sigma_{1,3} = 2$, $\Sigma_{2,3} = 1$—where the regression coefficient on $Y_2$ vanishes ($\{1/2, 0\}$), proving $Y_2 \perp Y_3 \mid Y_1$ despite $\Sigma_{2,3} \ne 0$:

{{< marginnote >}}Compute the regression coefficients $\Sigma_{b,a}\Sigma_{a,a}^{-1}$ of $z_3$ on $(z_1, z_2)$ for a general symmetric $3 \times 3$ $\Sigma$.{{< /marginnote >}}

```js
// 4b-i. 3x3 Schur complement determinant & quadratic-form factorization
const Sig = [[W.s11, W.s12, W.s13], [W.s12, W.s22, W.s23], [W.s13, W.s23, W.s33]]
const z = [W.z1, W.z2, W.z3], za = [W.z1, W.z2]
const coef = await show`${Sig}[[3, {1, 2}]] . Inverse[${Sig}[[{1, 2}, {1, 2}]]]`
```

$$
\begin{aligned}
&\Sigma_{b,a}\Sigma_{a,a}^{-1} \\
&= \left\{\frac{\Sigma_{1,3} \Sigma_{2,2}-\Sigma_{1,2} \Sigma_{2,3}}{\Sigma_{1,1} \Sigma_{2,2}-\Sigma_{1,2}^2},\frac{\Sigma_{1,1} \Sigma_{2,3}-\Sigma_{1,2} \Sigma_{1,3}}{\Sigma_{1,1} \Sigma_{2,2}-\Sigma_{1,2}^2}\right\}
\end{aligned}
$$

{{< marginnote >}}Form the Schur complement $\Sigma_{b\mid a} = \Sigma_{3,3} - \Sigma_{b,a}\Sigma_{a,a}^{-1}\Sigma_{a,b}$, the conditional variance of $z_3$.{{< /marginnote >}}

```js
const schur = await show`${Sig}[[3, 3]] - ${coef} . ${Sig}[[{1, 2}, 3]]`
```

$$
\Sigma_{b\mid a} = \Sigma_{3,3} - \frac{\Sigma_{2,2} \Sigma_{1,3}^2 - 2 \Sigma_{1,2} \Sigma_{1,3} \Sigma_{2,3} + \Sigma_{1,1} \Sigma_{2,3}^2}{\Sigma_{1,1} \Sigma_{2,2}-\Sigma_{1,2}^2}
$$

{{< marginnote >}}Verify both the Schur-complement determinant factorization and the precision identity $\Omega_{b,b}\Sigma_{b\mid a} = 1$ in $3 \times 3$.{{< /marginnote >}}

```js
await show`Simplify[{Det[${Sig}] - Det[${Sig}[[{1, 2}, {1, 2}]]]*${schur}, Inverse[${Sig}][[3, 3]]*${schur}}]`
```

$$
\begin{aligned}
&\bigl(\lvert\Sigma\rvert - \lvert\Sigma_{a,a}\rvert\,\Sigma_{b\mid a},\; \Omega_{b,b}\,\Sigma_{b\mid a}\bigr)_{a=\{1,2\},\; b=\{3\}} \\
&= \{0,1\}
\end{aligned}
$$

{{< marginnote >}}Confirm that the $3 \times 3$ quadratic form splits into marginal and conditional-residual squares.{{< /marginnote >}}

```js
await show`Simplify[${z} . Inverse[${Sig}] . ${z} - ${za} . Inverse[${Sig}[[{1, 2}, {1, 2}]]] . ${za} - (z3 - ${coef} . ${za})^2/${schur}]`
```

$$
\begin{aligned}
&\mathbf{z}^T\Sigma^{-1}\mathbf{z} - \mathbf{z}_a^T\Sigma_{a,a}^{-1}\mathbf{z}_a - \frac{(z_3 - \Sigma_{b,a}\Sigma_{a,a}^{-1}\mathbf{z}_a)^2}{\Sigma_{b\mid a}} \\
&= 0
\end{aligned}
$$

{{< marginnote >}}Instantiate on a $3 \times 3$ covariance where $Y_2 \perp Y_3 \mid Y_1$ despite nonzero $\Sigma_{2,3}$.{{< /marginnote >}}

```js
await show`{${coef}, ${schur}, Det[${Sig}]} /. {s11 -> 4, s22 -> 4, s33 -> 4, s12 -> 2, s13 -> 2, s23 -> 1}`
```

$$
\begin{aligned}
&\bigl(\Sigma_{b,a}\Sigma_{a,a}^{-1},\; \Sigma_{b\mid a},\; \lvert\Sigma\rvert\bigr) \\
&= \left\{\left\{\frac{1}{2},0\right\},3,36\right\}
\end{aligned}
$$

Next we verify idempotence, orthogonality, trace, $\lvert I_3 + g P_X\rvert = (1 + g)^2$, the Woodbury inverse $(I_3 + g P_X)^{-1} = I_3 - \frac{g}{1+g} P_X$, and the Pythagorean decomposition:

$$
\mathbf{y}^T P_X \mathbf{y} + \mathbf{y}^T(I_3 - P_X)\mathbf{y} = \frac{79}{2} + \frac{3}{2} = 41 = \mathbf{y}^T \mathbf{y}.
$$

{{< marginnote >}}Build the hat matrix $P_X$ of a straight-line design with intercept and covariate values $x_1, x_2, x_3$; here $D = (x_1-x_2)^2+(x_1-x_3)^2+(x_2-x_3)^2$.{{< /marginnote >}}

```js
// 4b-ii. OLS projection matrix P_X, g-prior determinant & inverse, and Pythagoras
const X = [[1, W.x1], [1, W.x2], [1, W.x3]]
const P = await show`Simplify[${X} . Inverse[Transpose[${X}] . ${X}] . Transpose[${X}]]`
```

$$
\begin{aligned}
&P_X = X(X^TX)^{-1}X^T \\
&= \frac{1}{D}\left( \begin{array}{ccc} (x_1-x_2)^2+(x_1-x_3)^2 & (x_1-x_3) (x_2-x_3) & (x_1-x_2) (x_3-x_2) \\ (x_1-x_3) (x_2-x_3) & (x_1-x_2)^2+(x_2-x_3)^2 & (x_2-x_1) (x_3-x_1) \\ (x_1-x_2) (x_3-x_2) & (x_2-x_1) (x_3-x_1) & (x_1-x_3)^2+(x_2-x_3)^2 \\ \end{array} \right)
\end{aligned}
$$

{{< marginnote >}}Verify symbolically that the OLS hat matrix $P_X$ is idempotent and orthogonal to the residual space.{{< /marginnote >}}

```js
await show`Simplify[{${P} . ${P} - ${P}, Transpose[${X}] . (IdentityMatrix[3] - ${P})}]`
```

$$
\begin{aligned}
&\bigl(P_X^2 - P_X,\; X^T(I_3 - P_X)\bigr) \\
&= \left\{\left( \begin{array}{ccc} 0 & 0 & 0 \\ 0 & 0 & 0 \\ 0 & 0 & 0 \\ \end{array} \right),\left( \begin{array}{ccc} 0 & 0 & 0 \\ 0 & 0 & 0 \\ \end{array} \right)\right\}
\end{aligned}
$$

{{< marginnote >}}Compute $\operatorname{tr}(P_X)$ and the $g$-prior determinant $\lvert I_3 + g P_X\rvert = (1 + g)^2$.{{< /marginnote >}}

```js
await show`Simplify[{Tr[${P}], Det[IdentityMatrix[3] + g*${P}]}]`
```

$$
\bigl(\operatorname{tr}P_X,\; \lvert I_3 + gP_X\rvert\bigr) = \left\{2,(1+g)^2\right\}
$$

{{< marginnote >}}Confirm the Woodbury inverse $(I_3 + g P_X)^{-1} = I_3 - g/(1+g)P_X$ symbolically.{{< /marginnote >}}

```js
await show`Simplify[Inverse[IdentityMatrix[3] + g*${P}] - (IdentityMatrix[3] - g/(1 + g)*${P})]`
```

$$
\begin{aligned}
&(I_3 + gP_X)^{-1} - \Bigl(I_3 - \tfrac{g}{1+g}P_X\Bigr) \\
&= \left( \begin{array}{ccc} 0 & 0 & 0 \\ 0 & 0 & 0 \\ 0 & 0 & 0 \\ \end{array} \right)
\end{aligned}
$$

{{< marginnote >}}Instantiate $P_X\mathbf{y}$ and verify the Pythagorean sum-of-squares split on a concrete vector $\mathbf{y}$.{{< /marginnote >}}

```js
await show`With[{h = ${P} /. {x1 -> -1, x2 -> 0, x3 -> 1}, y = {1, 2, 6}}, {h . y, y . h . y, y . (y - h . y), y . y}]`
```

$$
\begin{aligned}
&\bigl(P_X\mathbf{y},\; \mathbf{y}^T P_X\mathbf{y},\; \mathbf{y}^T(I_3-P_X)\mathbf{y},\; \mathbf{y}^T\mathbf{y}\bigr) \\
&= \left\{\left\{\frac{1}{2},3,\frac{11}{2}\right\},\frac{79}{2},\frac{3}{2},41\right\}
\end{aligned}
$$

---

## Monte Carlo and Markov Chain Foundations {#sec:pre-mcmc}

When posterior integrals lack closed forms, Parts I–III replace exact calculus with simulation—first via independent draws ({{< xref "ch:mc" "full" >}}) and then via Markov chains ({{< xref "ch:gibbs" "full" >}}–{{< xref "ch:ordinal" "full" >}}).

{{< thm kind="theorem" title="Strong Law and Central Limit Theorem for i.i.d. Monte Carlo" label="thm:pre-lln" >}}
Let $\phi^{(1)}, \dots, \phi^{(S)} \stackrel{\text{i.i.d.}}{\sim} \pi$ and set $\bar{g}_S = \frac{1}{S} \sum_{s=1}^S g(\phi^{(s)})$. If $E_\pi\lvert g(\phi)\rvert < \infty$, then $\bar{g}_S \to E_\pi[g(\phi)]$ almost surely. If $\sigma^2 = \operatorname{Var}_\pi(g(\phi)) < \infty$, then

$$
\sqrt{S}\,\bigl(\bar{g}_S - E_\pi[g(\phi)]\bigr) \xrightarrow{d} \mathcal{N}(0, \sigma^2), \qquad \mathrm{MCSE} = \frac{\sigma}{\sqrt{S}},
$$

a convergence rate of $O(S^{-1/2})$ that is *independent of parameter dimension* $p$.
{{< /thm >}}

When direct sampling from $\pi$ is impossible, we construct a Markov chain with transition kernel $K(\phi, \phi')$ that leaves $\pi$ **stationary** (invariant): $\pi K = \pi$, i.e., $\int \pi(\phi)\,K(\phi, \phi')\,d\phi = \pi(\phi')$. A stronger, easily checked sufficient condition is **detailed balance** (reversibility):

$$
\pi(\phi)\,K(\phi, \phi') = \pi(\phi')\,K(\phi', \phi).
$$

Integrating both sides over $\phi$ immediately yields $\pi K = \pi$. The converse fails: a systematic-scan Gibbs sampler ({{< xref "ch:gibbs" "full" >}}) is generally stationary without being reversible.

{{< thm kind="theorem" title="Ergodic Theorem for Markov Chains" label="thm:pre-ergodic" >}}
Let $\pi$ be an invariant probability distribution of a $\pi$-irreducible Markov chain with transition kernel $K$.
1. For every $\pi$-integrable function $g$, time averages converge almost surely: $\bar{g}_S \to E_\pi[g(\phi)]$ from $\pi$-almost every starting state (no aperiodicity required).
2. If in addition the chain is **aperiodic**, the $s$-step distribution converges in total variation: $\lVert K^s(\phi, \cdot) - \pi \rVert_{\text{TV}} \to 0$ from $\pi$-almost every start.
3. If the chain is **Harris recurrent**, both conclusions hold from *every* starting state $\phi \in \Theta$.
{{< /thm >}}

{{< remark note="Why aperiodicity separates averages from distributions" label="rem:pre-periodic" >}}
The deterministic two-state flip

$$
K = \begin{pmatrix} 0 & 1 \\ 1 & 0 \end{pmatrix}
$$

is irreducible with invariant distribution $\pi = (1/2, 1/2)$: its ergodic averages converge to $\frac{1}{2}(g(1) + g(2))$, yet $K^s$ oscillates forever and never converges in total variation.
{{< /remark >}}

{{< thm kind="proposition" title="Asymptotic Variance and Effective Sample Size" label="prop:pre-ess" >}}
For a stationary Markov chain with lag-$t$ autocorrelations $\rho_t = \operatorname{Corr}(g(\phi^{(s)}), g(\phi^{(s+t)}))$ satisfying $\sum_{t=1}^\infty \lvert\rho_t\rvert < \infty$,

$$
S\operatorname{Var}(\bar{g}_S) \longrightarrow \sigma^2\!\left(1 + 2\sum_{t=1}^\infty \rho_t\right), \qquad S_{\text{eff}} = \frac{S}{1 + 2\sum_{t=1}^\infty \rho_t}.
$$

When negative autocorrelations dominate (antithetic sampling), $S_{\text{eff}}$ can exceed $S$. A Markov chain CLT requires stronger mixing—for example, geometric ergodicity together with $E_\pi\lvert g\rvert^{2+\delta} < \infty$.
{{< /thm >}}

### Working Example 5a: Exact Finite-$S$ Variance Inflation and ESS

For geometric autocorrelation $\rho_t = \rho^t$ ($0 < \rho < 1$), we sum the exact finite-$S$ variance inflation factor $1 + 2\sum_{t=1}^{S-1}(1 - t/S)\rho^t$, take its $S \to \infty$ limit $(1+\rho)/(1-\rho)$, cross-check against the Toeplitz correlation matrix $\frac{1}{S}\mathbf{1}^T(\rho^{\lvert i-j\rvert})\mathbf{1}$, and tabulate $(S_{\text{eff}}^{\text{exact}},\; S_{\text{eff}}^{\infty},\; \mathrm{MCSE}/\sigma)$ at $S = 1000$—ending with the bivariate normal Gibbs chain of {{< xref "ch:gibbs" "full" >}} where $\rho = 0.99^2 = 0.9801$ collapses $1{,}000$ draws to roughly $10$ effective draws:

{{< marginnote >}}Sum the exact finite-$S$ variance inflation factor for geometric autocorrelation $\rho_t = \rho^t$.{{< /marginnote >}}

```js
// 5a. Exact finite-S variance inflation & ESS for geometric autocorrelation rho^t
const { r, t, ns } = W
const infl = await show`Assuming[0 < r < 1 && ns >= 1 && Element[ns, Integers],
  FullSimplify[1 + 2*Sum[(1 - ${t}/${ns})*${r}^${t}, {t, 1, ns - 1}]]]`
```

$$
\begin{aligned}
&\frac{S\operatorname{Var}(\bar g_S)}{\sigma^2} = 1 + 2\sum_{t=1}^{S-1}\Bigl(1-\frac{t}{S}\Bigr)\rho^t \\
&= 1+\frac{2 \rho \left(-1+S -S \rho+\rho^{S}\right)}{S (-1+\rho)^2}
\end{aligned}
$$

{{< marginnote >}}Take $S \to \infty$ to recover the asymptotic autocorrelation time $(1 + \rho)/(1 - \rho)$.{{< /marginnote >}}

```js
const iact = await show`Assuming[0 < r < 1, Limit[${infl}, ns -> Infinity]]`
```

$$
\lim_{S\to\infty}\frac{S\operatorname{Var}(\bar g_S)}{\sigma^2} = \frac{1+\rho}{1-\rho}
$$

{{< marginnote >}}Cross-check the closed form against the explicit Toeplitz correlation matrix for $S \in \{2, 3, 7\}$.{{< /marginnote >}}

```js
await show`Table[Simplify[Total[Table[r^Abs[i - j], {i, k}, {j, k}], 2]/k - (${infl} /. ns -> k)], {k, {2, 3, 7}}]`
```

$$
\begin{aligned}
&\frac{1}{S}\mathbf{1}^T\bigl(\rho^{\lvert i-j\rvert}\bigr)\mathbf{1} - \frac{S\operatorname{Var}(\bar g_S)}{\sigma^2}\Big|_{S\in\{2,3,7\}} \\
&= \{0,0,0\}
\end{aligned}
$$

{{< marginnote >}}Tabulate exact ESS, asymptotic ESS, and $\mathrm{MCSE}/\sigma$ at $S = 1000$ across four autocorrelations.{{< /marginnote >}}

```js
await show`Table[{ns/${infl}, ns/${iact}, Sqrt[${infl}/ns]} /. {ns -> 1000, r -> rv}, {rv, {0., 0.5, 0.9, 0.9801}}]`
```

$$
\begin{aligned}
&\bigl(S_{\text{eff}}^{\text{exact}},\; S_{\text{eff}}^{\infty},\; \mathrm{MCSE}/\sigma\bigr)_{S=1000;\; \rho\in\{0,\, 0.5,\, 0.9,\, 0.9801\}} \\
&= \left( \begin{array}{ccc} 1000. & 1000. & 0.0316228 \\ 333.778 & 333.333 & 0.0547357 \\ 53.135 & 52.6316 & 0.137186 \\ 10.5761 & 10.05 & 0.307494 \\ \end{array} \right)
\end{aligned}
$$

### Working Example 5b: A Three-State Metropolis Chain

Finally, consider a three-state target $\boldsymbol{\pi} = (\pi_1, \pi_2, \pi_3)$ ordered so $\pi_1 \ge \pi_2 \ge \pi_3 > 0$, with uniform proposal to either of the two other states (probability $1/2$ each) and Metropolis acceptance $\min(1, \pi_j/\pi_i)$. We construct the exact transition matrix $K$, verify detailed balance and stationarity symbolically, compute its closed-form spectrum $\operatorname{spec}(K)$, and evaluate the total-variation distance $\lVert K^s(3, \cdot) - \boldsymbol{\pi}\rVert_{\text{TV}}$ at $\boldsymbol{\pi} = (1/2, 3/10, 1/5)$:

{{< marginnote >}}Build the exact $3 \times 3$ Metropolis transition matrix $K$ for ordered target probabilities $\pi_1 \ge \pi_2 \ge \pi_3$.{{< /marginnote >}}

```js
// 5b. Three-state Metropolis chain: detailed balance, spectrum, and geometric TV convergence
const tgt = [W.p1, W.p2, W.p3]
const K = await show`Assuming[p1 >= p2 >= p3 > 0, Simplify[With[
  {off = Table[If[i == j, 0, Min[1, ${tgt}[[j]]/${tgt}[[i]]]/2], {i, 3}, {j, 3}]},
  off + DiagonalMatrix[1 - Total[off, {2}]]]]]`
```

$$
\begin{aligned}
&K \\
&= \left( \begin{array}{ccc} -\frac{-2 \pi_1 +\pi_2 +\pi_3}{2 \pi_1} & \frac{\pi_2}{2 \pi_1} & \frac{\pi_3}{2 \pi_1} \\ \frac{1}{2} & \frac{\pi_2 -\pi_3}{2 \pi_2} & \frac{\pi_3}{2 \pi_2} \\ \frac{1}{2} & \frac{1}{2} & 0 \\ \end{array} \right)
\end{aligned}
$$

{{< marginnote >}}Verify detailed balance $\operatorname{diag}(\boldsymbol\pi)K = K^T\operatorname{diag}(\boldsymbol\pi)$ and stationarity $\boldsymbol\pi^T K = \boldsymbol\pi^T$.{{< /marginnote >}}

```js
await show`Simplify[{DiagonalMatrix[${tgt}] . ${K} - Transpose[DiagonalMatrix[${tgt}] . ${K}], ${tgt} . ${K} - ${tgt}}]`
```

$$
\begin{aligned}
&\bigl(\operatorname{diag}(\boldsymbol\pi)K - K^T\operatorname{diag}(\boldsymbol\pi),\; \boldsymbol\pi^T K - \boldsymbol\pi^T\bigr) \\
&= \left\{\left( \begin{array}{ccc} 0 & 0 & 0 \\ 0 & 0 & 0 \\ 0 & 0 & 0 \\ \end{array} \right),\{0,0,0\}\right\}
\end{aligned}
$$

{{< marginnote >}}Compute the exact eigenvalues of $K$ to identify the spectral gap governing convergence.{{< /marginnote >}}

```js
await show`Simplify[Eigenvalues[${K}]]`
```

$$
\begin{aligned}
&\operatorname{spec}(K) \\
&= \left\{1,-\frac{-\pi_1 +\pi_2 +\pi_3}{2 \pi_1},-\frac{\pi_3}{2 \pi_2}\right\}
\end{aligned}
$$

{{< marginnote >}}Evaluate the total-variation error $\lVert K^s(3, \cdot) - \boldsymbol\pi\rVert_{\text{TV}}$ at $s \in \{1, 2, 5, 10\}$.{{< /marginnote >}}

```js
await show`N[Table[Total[Abs[MatrixPower[${K} /. {p1 -> 1/2, p2 -> 3/10, p3 -> 1/5}, k][[3]] - {1/2, 3/10, 1/5}]]/2, {k, {1, 2, 5, 10}}]]`
```

$$
\begin{aligned}
&\lVert K^s(3,\cdot) - \boldsymbol\pi\rVert_{\text{TV}}\Big|_{\boldsymbol\pi=(\frac12,\frac3{10},\frac15);\; s\in\{1,2,5,10\}} \\
&= \{0.2,0.0666667,0.00246914,0.0000101611\}
\end{aligned}
$$

Notice that the four total-variation errors equal $\frac{1}{5}\,3^{-(s-1)}$ exactly—shrinking at every step by the subdominant eigenvalue magnitude $\lvert\lambda_3\rvert = \pi_3/(2\pi_2) = 1/3$, a concrete preview of the Metropolis–Hastings convergence machinery developed in {{< xref "ch:mh" "full" >}}.
