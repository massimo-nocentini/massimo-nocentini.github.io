---
title: "Belief, Probability, and Exchangeability"
linkTitle: "Exchangeability"
weight: 20
label: "ch:exchangeability"
---

{{< newthought "Before computing posteriors" />}}, we must answer two foundational questions: *Why* should degrees of rational belief obey the mathematical axioms of probability? And *why* do Bayesian statisticians write down conditionally i.i.d. sampling models $Y_1, \dots, Y_n \mid \theta \stackrel{\text{i.i.d.}}{\sim} p(y \mid \theta)$ with a prior $p(\theta)$? Chapter 2 of Hoff{{< cite "hoff2009" >}} answers the first through belief axioms and the second through Bruno de Finetti’s representation theorem.

## Belief Functions and the Axioms of Probability {#sec:ch02-axioms}

Let $F, G, H$ be statements about the world, and let $\operatorname{Be}(F \mid H)$ quantify a rational agent’s degree of belief in $F$ conditional on knowing $H$ (operationalized through betting preferences). Rationality demands three qualitative properties:{{< cite "jaynes2003,savage1972" >}}

- **B1 (Boundedness)**: $\operatorname{Be}(\text{not } H \mid H) \le \operatorname{Be}(F \mid H) \le \operatorname{Be}(H \mid H)$.
- **B2 (Monotonicity under disjunction)**: $\operatorname{Be}(F \text{ or } G \mid H) \ge \max\{\operatorname{Be}(F \mid H),\, \operatorname{Be}(G \mid H)\}$.
- **B3 (Sequential composition)**: $\operatorname{Be}(F \text{ and } G \mid H)$ is determined by $\operatorname{Be}(G \mid H)$ and $\operatorname{Be}(F \mid G \text{ and } H)$.

Compare these directly against Hoff’s **axioms of conditional probability**{{< index "probability axioms" >}}:{{< sidenote >}}Kolmogorov’s 1933 measure-theoretic axioms start from unconditional probabilities $\Pr(F)$ and define $\Pr(F \mid H) = \Pr(F \cap H)/\Pr(H)$. Following de Finetti and Cox, Hoff takes conditional probability $\Pr(F \mid H)$ as primitive—reflecting the fact that every belief is held conditional on background information $H$.{{< /sidenote >}}

- **P1**: $0 = \Pr(\text{not } H \mid H) \le \Pr(F \mid H) \le \Pr(H \mid H) = 1$.
- **P2**: $\Pr(F \cup G \mid H) = \Pr(F \mid H) + \Pr(G \mid H)$ whenever $F \cap G = \emptyset$.
- **P3**: $\Pr(F \cap G \mid H) = \Pr(G \mid H)\,\Pr(F \mid G \cap H)$.

Every probability function satisfies B1–B3. Conversely, under mild regularity conditions (strict monotonicity and smoothness of the combination functions), **Cox’s theorem**{{< cite "cox1946,cox1961" >}} shows that any consistent real-valued belief calculus is isomorphic to a probability function obeying P1–P3. Complementarily, de Finetti’s **Dutch-book argument**{{< index "Dutch book" >}} reaches the same conclusion operationally: an agent whose betting odds violate P1–P3 can be offered a finite portfolio of bets that guarantees a strict monetary loss regardless of which event actually occurs.

## Partitions, Bayes’ Rule, and Bayes Factors {#sec:ch02-partitions}

{{< definition note="Partition" label="def:ch02-partition" >}}
A collection of events $\{H_1, \dots, H_K\}$ is a **partition**{{< index "partition" >}} of $H$ if the events are pairwise disjoint ($H_i \cap H_j = \emptyset$ for $i \neq j$) and exhaustive ($\bigcup_{k=1}^K H_k = H$).
{{< /definition >}}

If $\{H_1, \dots, H_K\}$ partitions the set of possible hypotheses with $\Pr(H) = 1$, and $E$ is an observed event, axioms P1–P3 immediately yield three workhorse identities:

$$
\begin{aligned}
\text{Total probability:} &\quad \sum_{k=1}^K \Pr(H_k) = 1, \\
\text{Marginal probability:} &\quad \Pr(E) = \sum_{k=1}^K \Pr(E \mid H_k)\Pr(H_k), \\
\text{Bayes’ rule:} &\quad \Pr(H_j \mid E) = \frac{\Pr(E \mid H_j)\Pr(H_j)}{\sum_{k=1}^K \Pr(E \mid H_k)\Pr(H_k)}.
\end{aligned} \label{eq:ch02-bayes-discrete}
$$

Dividing $\Pr(H_i \mid E)$ by $\Pr(H_j \mid E)$ cancels the normalizing constant $\Pr(E)$ and isolates how the data $E$ shift the relative odds of two competing hypotheses:

$$
\underbrace{\frac{\Pr(H_i \mid E)}{\Pr(H_j \mid E)}}_{\text{posterior odds}}
= \underbrace{\frac{\Pr(E \mid H_i)}{\Pr(E \mid H_j)}}_{\text{Bayes factor}}
\times \underbrace{\frac{\Pr(H_i)}{\Pr(H_j)}}_{\text{prior odds}}. \label{eq:ch02-bayes-factor}
$$

The ratio $\operatorname{BF}_{ij} = \Pr(E \mid H_i) / \Pr(E \mid H_j)$ is the **Bayes factor**{{< index "Bayes factor" >}}: for *simple* (point) hypotheses, it depends solely on the sampling model and not on the prior odds $\Pr(H_i)/\Pr(H_j)$.{{< sidenote >}}For *composite* hypotheses that contain free parameters (as in model selection in {{< xref "ch:regression" "full" >}}), $\Pr(E \mid H_i) = \int p(E \mid \theta_i, H_i)\,p(\theta_i \mid H_i)\,d\theta_i$, so the Bayes factor *does* depend on the within-model priors $p(\theta_i \mid H_i)$!{{< /sidenote >}}

{{< example note="Worked Discrete Bayes Update: Rare-Disease Screening" label="ex:ch02-screening" >}}
Suppose a rare infection has population prevalence $\Pr(H_1) = 0.01$ (so $\Pr(H_0) = 0.99$, prior odds $1 : 99$). A diagnostic test has sensitivity $\Pr(E \mid H_1) = 0.95$ and false-positive rate $\Pr(E \mid H_0) = 0.05$.

The Bayes factor for a positive test $E$ is $\operatorname{BF}_{10} = 0.95 / 0.05 = 19$. Multiplying by the prior odds gives posterior odds $19 \times (1/99) = 19/99$, and hence

$$
\Pr(H_1 \mid E)
= \frac{0.95 \times 0.01}{0.95 \times 0.01 + 0.05 \times 0.99}
= \frac{0.0095}{0.0590} \approx 0.161.
$$

Even with a 95%-accurate test, a positive screen raises the probability of infection only to $16.1\%$ because false positives from the $99\%$ healthy majority outnumber true positives roughly $5$ to $1$.
{{< /example >}}

## Conditional Independence {#sec:ch02-independence}

{{< definition note="Conditional Independence" label="def:ch02-cond-indep" >}}
Two events $F$ and $G$ are **conditionally independent given $H$**{{< index "conditional independence" >}} if

$$
\Pr(F \cap G \mid H) = \Pr(F \mid H)\,\Pr(G \mid H).
$$

Equivalently (when $\Pr(G \mid H) > 0$), $\Pr(F \mid H \cap G) = \Pr(F \mid H)$: once $H$ is known, learning $G$ does not alter beliefs about $F$.
{{< /definition >}}

For random variables $Y_1, \dots, Y_n$ and a parameter $\theta$, conditional independence given $\theta$ means the joint density factors into a product: $p(y_1, \dots, y_n \mid \theta) = \prod_{i=1}^n p_{Y_i}(y_i \mid \theta)$. When all marginal densities coincide, we write $Y_1, \dots, Y_n \mid \theta \stackrel{\text{i.i.d.}}{\sim} p(y \mid \theta)$.

## Random Variables and Distribution Summaries {#sec:ch02-rv}

In Bayesian inference, a **random variable**{{< index "random variable" >}} is simply any unknown numerical quantity—both future data $Y$ and fixed but unknown parameters $\theta$.

- **Discrete** variables have countable support $\mathcal{Y}$ and a mass function (which Hoff uniformly calls a pdf) $p(y) = \Pr(Y = y) \in [0, 1]$ with $\sum_{y \in \mathcal{Y}} p(y) = 1$ (e.g., Binomial and Poisson).
- **Continuous** variables (more precisely, those with an *absolutely continuous* cumulative distribution function) satisfy $F(y) = \Pr(Y \le y) = \int_{-\infty}^y p(t)\,dt$; note that $p(y)$ is a *density* (it can exceed $1$ and is not $\Pr(Y = y)$), while $\Pr(Y \in A) = \int_A p(y)\,dy$.

Summarizing a distribution requires distinguishing **mean** $E[Y]$, **median** $F^{-1}(0.5)$, and **mode** $\arg\max_y p(y)$. For symmetric densities such as the normal, all three coincide; for skewed distributions such as the lognormal (household income), they diverge sharply.

{{< fig src="images/bayesian-hoff/fig-ch02-skewness.svg" type="main" label="fig:ch02-skewness" alt="Two panels comparing a symmetric Normal(10.75, 0.8^2) density where mean, median, and mode coincide against its exponentiated right-skewed lognormal density where mode 24.6k < median 46.6k < mean 64.2k" short="Normal vs. lognormal location summaries" >}}Left: a symmetric $\operatorname{normal}(10.75, 0.8^2)$ density where mean, median, and mode coincide. Right: exponentiating $Y$ yields a right-skewed lognormal income distribution where $\text{mode} < \text{median} < \text{mean}$ ($24.6\text{k} < 46.6\text{k} < 64.2\text{k}$).{{< /fig >}}

The **variance**{{< index "variance" >}} $\operatorname{Var}[Y] = E[(Y - E[Y])^2] = E[Y^2] - E[Y]^2$ measures average squared spread around the mean, while the **$\alpha$-quantile**{{< index "quantile" >}} $y_\alpha = F^{-1}(\alpha)$ yields order-based spread intervals such as the interquartile range $(y_{0.25}, y_{0.75})$ and the 95% interval $(y_{0.025}, y_{0.975})$ that remain well-defined even when moments do not exist.{{< sidenote >}}Why is the mean $E[Y]$ so prominent? Under squared-error loss $(Y - \hat{y})^2$, the optimal single-number guess is $\hat{y} = E[Y]$ (differentiate $E[(Y - c)^2] = \operatorname{Var}[Y] + (E[Y] - c)^2$ with respect to $c$). Under absolute-error loss $\lvert Y - \hat{y} \rvert$, the optimal guess is the median.{{< /sidenote >}}

### Joint, Marginal, and Conditional Densities {#sec:ch02-joint}

For any two random variables (discrete, continuous, or mixed—such as continuous parameter $\theta$ and discrete count $Y$), the joint density factors in both orders:

$$
p(y, \theta) = p(\theta)\,p(y \mid \theta) = p(y)\,p(\theta \mid y). \label{eq:ch02-factorization}
$$

Crucially, knowing $\{p(\theta),\, p(y \mid \theta)\}$ completely determines the joint density, whereas knowing only the marginals $\{p(\theta),\, p(y)\}$ does *not*. Treating $y$ as fixed after observation, the normalizing constant $p(y) = \int_\Theta p(y \mid \theta)p(\theta)\,d\theta$ does not depend on $\theta$, yielding the single most useful proportionality in Bayesian computation:

$$
p(\theta \mid y) \propto p(\theta)\,p(y \mid \theta). \label{eq:ch02-prop}
$$

## Exchangeability and de Finetti’s Theorem {#sec:ch02-exchangeability}

Why do Bayesians assume observations are *conditionally i.i.d.* given $\theta$, rather than marginally independent? Suppose $Y_1, \dots, Y_{10} \in \{0, 1\}$ record whether 10 survey respondents report being happy. If the $Y_i$ were marginally independent, observing $Y_1 = \dots = Y_9 = 1$ would tell us *nothing* about $Y_{10}$—statistical learning would be impossible! Instead, observations are **marginally dependent** (earlier observations teach us about the population) yet **symmetric in their indices** (the label “respondent 3” carries no special information).

{{< definition note="Exchangeability" label="def:ch02-exchangeable" >}}
Random variables $Y_1, \dots, Y_n$ are **exchangeable**{{< index "exchangeability" >}} if their joint density is invariant under every permutation $\pi$ of $\{1, \dots, n\}$:

$$
p(y_1, \dots, y_n) = p(y_{\pi(1)}, \dots, y_{\pi(n)}). \label{eq:ch02-exch}
$$
{{< /definition >}}

{{< proposition note="Conditionally i.i.d. implies exchangeability" label="prop:ch02-iid-exch" >}}
If $\theta \sim p(\theta)$ and $Y_1, \dots, Y_n \mid \theta \stackrel{\text{i.i.d.}}{\sim} p(y \mid \theta)$, then marginally (integrating out $\theta$), $Y_1, \dots, Y_n$ are exchangeable. Moreover, if $Y_i$ has finite variance, then $\operatorname{Cov}(Y_1, Y_2) = \operatorname{Var}\bigl(E[Y_1 \mid \theta]\bigr) \ge 0$.
{{< /proposition >}}

{{< proof >}}
For any permutation $\pi$ of $\{1, \dots, n\}$,

$$
p(y_1, \dots, y_n)
= \int_{\Theta} \left(\prod_{i=1}^n p(y_i \mid \theta)\right) p(\theta)\,d\theta
= \int_{\Theta} \left(\prod_{i=1}^n p(y_{\pi(i)} \mid \theta)\right) p(\theta)\,d\theta
= p(y_{\pi(1)}, \dots, y_{\pi(n)}),
$$

because multiplication of real numbers is commutative. For the covariance, the law of total covariance gives

$$
\operatorname{Cov}(Y_1, Y_2) = E[\operatorname{Cov}(Y_1, Y_2 \mid \theta)] + \operatorname{Cov}(E[Y_1 \mid \theta], E[Y_2 \mid \theta]) = 0 + \operatorname{Var}(E[Y_1 \mid \theta]) \ge 0.
$$
{{< /proof >}}

Notice what that non-negative covariance immediately implies: **finite exchangeability alone does *not* imply a conditionally i.i.d. mixture!** For example, if $(Y_1, Y_2)$ takes values $(1, 0)$ and $(0, 1)$ with probability $1/2$ each (sampling 2 balls without replacement from an urn with 1 red and 1 blue ball), then $(Y_1, Y_2)$ is exchangeable, yet $\operatorname{Cov}(Y_1, Y_2) = -1/4 < 0$—making any representation of the form {{< eqref "eq:ch02-definetti" >}} impossible. What is needed is **infinite extendability**: that $Y_1, \dots, Y_n$ can be viewed as the first $n$ terms of an arbitrarily long exchangeable sequence.

{{< theorem note="de Finetti’s Representation Theorem" label="thm:ch02-definetti" >}}
Let $\{Y_1, Y_2, \dots\}$ be an infinite sequence of random variables taking values in $\mathcal{Y}$ (a Polish space). If for every $n \ge 1$ the finite joint distribution of $(Y_1, \dots, Y_n)$ is exchangeable, then there exists a random probability distribution $F$ on $\mathcal{Y}$ (drawn from a prior measure $\Pi$ over distributions) such that for all $n$, conditionally on $F$, $Y_1, \dots, Y_n \stackrel{\text{i.i.d.}}{\sim} F$:

$$
p(y_1, \dots, y_n) = \int \left(\prod_{i=1}^n p(y_i \mid F)\right) d\Pi(F). \label{eq:ch02-definetti}
$$

In the binary case $\mathcal{Y} = \{0, 1\}$, $F$ is completely characterized by a single scalar $\theta = \lim_{N \to \infty} \frac{1}{N}\sum_{i=1}^N Y_i \in [0, 1]$, and {{< eqref "eq:ch02-definetti" >}} reduces to

$$
p(y_1, \dots, y_n) = \int_0^1 \theta^{\sum y_i}(1 - \theta)^{n - \sum y_i}\,d\Pi(\theta).
$$

{{< cite "definetti1937" >}}
{{< /theorem >}}

{{< remark note="Parametric models vs. de Finetti’s theorem" label="rem:ch02-parametric" >}}
For binary data, the random distribution $F$ *is* a one-parameter $\operatorname{Bernoulli}(\theta)$ distribution with no extra assumptions. For general real-valued data, however, {{< xref "thm:ch02-definetti" "full" >}} produces a random *nonparametric* distribution $F$; restricting $F$ to a finite-dimensional parametric family (such as $\operatorname{normal}(\theta, \sigma^2)$ or $\operatorname{Poisson}(\theta)$) is an additional modeling approximation that must later be verified via model checking ({{< xref "ch:mc" "full" >}}).
{{< /remark >}}

Why is binary de Finetti true? Imagine fixing $n$ and extending the exchangeable sequence to a huge length $N \gg n$ with total count $S_N = \sum_{i=1}^N Y_i$. By exchangeability, conditional on $S_N = k$, all $\binom{N}{k}$ binary sequences are equally likely, so $(Y_1, \dots, Y_n) \mid S_N = k$ is a simple random sample *without replacement* from $k$ ones and $N - k$ zeros. As $N \to \infty$, sampling without replacement converges to sampling *with* replacement at rate $\theta = k/N$—which is $\operatorname{Bernoulli}(\theta)$ i.i.d.!

Even when the population size $N$ is genuinely finite (so infinite extendability does not literally hold), Diaconis and Freedman{{< cite "diaconis1980" >}} proved that the total-variation distance between an $n$-sample from an $N$-exchangeable sequence and a conditionally i.i.d. mixture is bounded by $2cn / N$ when $\mathcal{Y}$ has $c$ finite states, and by $n(n-1)/N$ for arbitrary measurable spaces. Whenever $n \ll N$, conditionally i.i.d. modeling is an extraordinarily accurate approximation.

## Key Takeaways & Python Check {#sec:ch02-summary}

| Concept | Core Idea | Role in Bayesian Inference |
|:--------|:----------|:---------------------------|
| Belief axioms $\leftrightarrow$ Probability | Coherent betting preferences obey P1–P3 | Justifies probability as the calculus of uncertainty |
| Bayes factor | $\Pr(E \mid H_i) / \Pr(E \mid H_j)$ | Isolates evidential support (depends on within-model priors for composite $H_i$) |
| Proportionality | $p(\theta \mid y) \propto p(\theta)\,p(y \mid \theta)$ | Lets us identify posteriors by kernel shape alone |
| Exchangeability | $p(y_1, \dots, y_n) = p(y_{\pi(1)}, \dots, y_{\pi(n)})$ | Observable symmetry justifying conditionally i.i.d. models + priors |
{#tab:ch02-concepts caption="Summary of the foundational concepts of Chapter 2." short="Chapter 2 foundational concepts"}

```python
import numpy as np
from scipy import stats

# Verify Diaconis-Freedman: hypergeometric (without replacement) vs. binomial (i.i.d.)
n, theta = 10, 0.30
k = np.arange(n + 1)
binom_pmf = stats.binom.pmf(k, n, theta)
for N in [20, 100, 1000]:
    hyper_pmf = stats.hypergeom.pmf(k, M=N, n=int(N * theta), N=n)
    tv_dist = 0.5 * np.sum(np.abs(hyper_pmf - binom_pmf))
    print(f"N={N:4d}: TV distance = {tv_dist:.4f} (bound 2*2*n/N = {4*n/N:.4f})")
```

## Modern Developments: Predictive and Anytime-Valid Inference {#sec:ch02-modern}

### Martingale Posteriors {#sec:ch02-martingale}

A **martingale posterior**{{< index "martingale posterior" >}} starts from predictive distributions for observables and obtains a distribution for $\theta$ without first writing down a prior and a likelihood.{{< sidenote >}}**Beyond Hoff (2009).** This material is not in Hoff’s book; it follows Fong, Holmes, and Walker{{< cite "fong2023" >}}, who develop the predictive reading of de Finetti’s theorem, itself much older.{{< /sidenote >}} In {{< xref "thm:ch02-definetti" "full" >}}, the $F$ in {{< eqref "eq:ch02-definetti" >}} is the limit of the empirical distribution of an infinite sequence: given all the observables, nothing about $\theta$ would be unknown. So simulate the missing ones. Given a one-step predictive $P_N$ based on $y_{1:N}$, *predictive resampling* draws

$$
Y_{N+1} \sim P_N, \quad N = n, n+1, \dots, \qquad
\theta_\infty = \theta(F_\infty), \quad
F_\infty = \lim_{N \to \infty} P_N, \label{eq:ch02-martingale}
$$

and the law of $\theta_\infty$ given $y_{1:n}$ is the martingale posterior. The name reflects the coherence condition $E[P_{N+1}(A) \mid y_{1:N}] = P_N(A)$ for every event $A$: each $P_N(A)$ is a martingale in $[0, 1]$, so it converges almost surely, and imagined data do not shift beliefs on average.

*Why it recovers Bayes*: for binary data, take the Pólya-urn predictive $P_N(1) = (a + \sum_{i \le N} y_i)/(a + b + N)$. This is the predictive of the $\operatorname{beta}(a, b)$ model ({{< xref "ch:one-param" "full" >}}), so given $y_{1:n}$ the simulated sequence is exchangeable and its limiting frequency has exactly the posterior law $\operatorname{beta}\bigl(a + \sum y_i,\, b + n - \sum y_i\bigr)$. Other predictives yield posteriors with no explicit prior.

**When to use it.** Use it when predictions are easier to specify than priors, or when the parametric restriction in {{< xref "rem:ch02-parametric" "full" >}} is unwelcome; the forward simulations are independent and parallel, but truncated at a finite $N$. With a trusted parametric model and prior, Hoff’s route is direct and exact.

### Bayes Factors as e-Values and Anytime-Valid Testing {#sec:ch02-evalues}

For a simple null hypothesis, the Bayes factor of {{< eqref "eq:ch02-bayes-factor" >}} is also an **e-value**{{< index "e-value" >}}, a nonnegative statistic with null expectation at most one.{{< sidenote >}}**Beyond Hoff (2009).** This material is not in Hoff’s book; it follows Grünwald, de Heide, and Koolen{{< cite "grunwald2024" >}} and the survey of Ramdas et al.{{< cite "ramdas2023" >}} The maximal inequality it rests on is classical (Ville, 1939).{{< /sidenote >}} Let $H_0$ specify a joint density $p_0$, let $m_1(y_{1:t}) = \int p(y_{1:t} \mid \theta)\,p(\theta \mid H_1)\,d\theta$ with a proper prior fixed in advance, and set $\operatorname{BF}_t = m_1(y_{1:t})/p_0(y_{1:t})$. Then for every fixed $t$ and every $\alpha \in (0, 1)$,

$$
E_{0}[\operatorname{BF}_t] \le 1, \qquad
\Pr_{0}\Bigl(\sup_{t \ge 1} \operatorname{BF}_t \ge \tfrac{1}{\alpha}\Bigr) \le \alpha, \label{eq:ch02-ville}
$$

with equality in the first relation when $p_0 > 0$ wherever $m_1 > 0$.

*Why it holds*: under $H_0$, $E_0[\operatorname{BF}_{t+1} \mid y_{1:t}] = \operatorname{BF}_t \int \frac{m_1(y \mid y_{1:t})}{p_0(y \mid y_{1:t})}\,p_0(y \mid y_{1:t})\,dy \le \operatorname{BF}_t$, so $\operatorname{BF}_t$ is a nonnegative supermartingale started at $1$, and Ville’s inequality bounds its supremum. In {{< xref "ex:ch02-screening" "full" >}}, a positive test has $\operatorname{BF}_{10} = 19$ and a negative one $1/19$, so $E_0[\operatorname{BF}] = 0.05 \cdot 19 + 0.95/19 = 1$; note that $19 < 20$ does not reject at level $\alpha = 0.05$.

When $H_0$ is *composite*, averaging over a prior on it protects only on average: the expectation can exceed one at particular null values. Choosing the null mixture by **reverse information projection**—the mixture (or limit of mixtures) $p_W$ minimizing $\operatorname{KL}(m_1 \,\Vert\, p_W)$—restores the e-value property when that minimum is finite, but at a fixed sample size; unrestricted optional stopping needs a further argument.

**When to use it.** Use {{< eqref "eq:ch02-ville" >}} to monitor data continuously with a frequentist guarantee. The threshold $1/\alpha$ is conservative compared with a fixed-$n$ test, and unlike Hoff’s posterior odds it ignores $\Pr(H_0)$.

### Computational & Symbolic Check {#sec:ch02-modern-check}

The Python block runs the Pólya urn forward to recover its beta posterior and checks $E_0[\operatorname{BF}_{10}] = 1$ together with the bound {{< eqref "eq:ch02-ville" >}}; the Wolfram sequence proves both identities.{{< sidenote >}}**Beyond Hoff (2009).** This computational check and its Wolfram symbolic counterpart below verify the modern methods in this section and are not in Hoff’s book.{{< /sidenote >}}

```python
import numpy as np
from scipy import stats
from scipy.special import betaln

rng = np.random.default_rng(42)
a, b, n, s, S, M = 1, 1, 10, 7, 20_000, 2_000
ones = np.full(S, float(a + s))
for N in range(n, n + M):                         # Polya-urn predictive resampling
    ones += rng.random(S) < ones / (a + b + N)
post = stats.beta(a + s, b + n - s)
theta = ones / (a + b + n + M)
print(f"mean {theta.mean():.3f} vs {post.mean():.3f}, sd {theta.std():.3f} vs {post.std():.3f}")

y, th0 = np.arange(n + 1), 0.3                    # E_0[BF_10] summed over y = 0..n
bf = np.exp(betaln(a + y, b + n - y) - betaln(a, b) - y * np.log(th0) - (n - y) * np.log1p(-th0))
print("E_0[BF] =", np.sum(stats.binom.pmf(y, n, th0) * bf))
t, c = np.arange(1, 1001), np.cumsum(rng.random((2000, 1000)) < 0.5, axis=1)
log_bf = betaln(1 + c, 1 + t - c) + t * np.log(2)
print("Pr_0(sup BF >= 20) =", np.mean(log_bf.max(axis=1) >= np.log(20)), "<= 0.05")
```

{{< marginnote >}}One urn step: averaging the next predictive over $Y_{N+1}$ returns the current one, with $A$ ones-weight and $T$ total weight.{{< /marginnote >}}

```js
// Chapter 2 (modern): Polya-urn martingale, beta moments & the e-value identity
await show`Simplify[(A/T)*(A + 1)/(T + 1) + (1 - A/T)*A/(T + 1) - A/T]`
```

$$
E[P_{N+1}(1) \mid y_{1:N}] - P_N(1) = 0
$$

{{< marginnote >}}Multiply urn predictives for $r$ successive ones: the result is a ratio of rising factorials.{{< /marginnote >}}

```js
const urnMom = await show`Product[(a + j)/(a + b + j), {j, 0, r - 1}]`
```

$$
\Pr(r \text{ successive ones}) = \frac{(a)_r}{(a+b)_r}
$$

{{< marginnote >}}These equal all the moments of $\operatorname{beta}(a, b)$, and moments determine a law on $[0, 1]$, so the limiting frequency is exactly beta.{{< /marginnote >}}

```js
await show`Assuming[a > 0 && b > 0 && r >= 0 && Element[r, Integers], FullSimplify[
  Integrate[th^(a + r - 1)*(1 - th)^(b - 1)/Beta[a, b], {th, 0, 1}] / (${urnMom})]]`
```

$$
\frac{\int_0^1 \theta^r \operatorname{Beta}(\theta \mid a, b)\,d\theta}{\Pr(r \text{ successive ones})} = 1
$$

{{< marginnote >}}E-value identity for every $n$: $p_0$ cancels, leaving $\sum_y m_1(y)$; sum inside the $\theta$-integral first.{{< /marginnote >}}

```js
await show`Assuming[a > 0 && b > 0 && 0 < th < 1 && n >= 1 && Element[n, Integers],
  Integrate[FullSimplify[Sum[Binomial[n, y]*th^y*(1 - th)^(n - y), {y, 0, n}]]
    * th^(a - 1)*(1 - th)^(b - 1)/Beta[a, b], {th, 0, 1}]]`
```

$$
\mathbb{E}_0[\operatorname{BF}_{10}] = \int_0^1 \sum_{y=0}^n \binom{n}{y}\theta^y(1-\theta)^{n-y}\,p(\theta \mid H_1)\,d\theta = 1
$$

{{< marginnote >}}Write the Bayes factor of a $\operatorname{beta}(2, 3)$ alternative against a symbolic point null $\theta_0$; $B(2, 3) = \tfrac{1}{12}$.{{< /marginnote >}}

```js
const bf10 = await show`Beta[2 + y, 3 + n - y] / (Beta[2, 3]*th0^y*(1 - th0)^(n - y))`
```

$$
\operatorname{BF}_{10}(y) = \frac{B(2+y,\,3+n-y)}{B(2,3)\,\theta_0^{y}(1-\theta_0)^{n-y}} = 12\,B(2+y,\,3+n-y)\,\theta_0^{-y}(1-\theta_0)^{y-n}
$$

{{< marginnote >}}Check by exact summation over $y = 0, \dots, n$ that its null expectation is $1$ for $n = 5, 10, 20$.{{< /marginnote >}}

```js
await show`Table[Simplify[Sum[Binomial[n, y]*th0^y*(1 - th0)^(n - y)*(${bf10}), {y, 0, n}]], {n, {5, 10, 20}}]`
```

$$
\bigl(\mathbb{E}_0[\operatorname{BF}_{10}]\bigr)_{n \in \{5,\,10,\,20\}} = \{1,1,1\}
$$

## Symbolic Check in Wolfram Language {#sec:ch02-wolfram}

This `wolfram-ws-bridge` JavaScript-mode sequence derives Bayes’ rule, the Bayes factor $s/f$, the negative finite-urn covariance $\operatorname{Cov}(Y_1, Y_2)$, and the exact finite-population hypergeometric sample-sum variance symbolically, then instantiates the screening example and exact Diaconis–Freedman total-variation distances.

{{< marginnote >}}Apply Bayes’ rule symbolically to express $\Pr(H_1 \mid E)$ in terms of sensitivity $s$, false-positive rate $f$, and prior $p_0$.{{< /marginnote >}}

```js
// Chapter 2: Symbolic Bayes' rule, Bayes factor, and finite-population covariance & variance
const post = await show`Simplify[(s * p0) / (s * p0 + f * (1 - p0))]`
```

$$
\Pr(H_1 \mid E) = \frac{s\,p_0}{s\,p_0 + f(1 - p_0)} = \frac{p_0 s}{f-f p_0 +p_0 s}
$$

{{< marginnote >}}Divide posterior odds by prior odds to verify that the Bayes factor equals the likelihood ratio $s/f$.{{< /marginnote >}}

```js
await show`Simplify[((${post} / (1 - ${post})) / (p0 / (1 - p0)))]`
```

$$
\operatorname{BF}_{10} = \frac{\text{posterior odds}}{\text{prior odds}} = \frac{s}{f}
$$

{{< marginnote >}}Derive the exact covariance $\operatorname{Cov}(Y_1, Y_2) < 0$ of two without-replacement draws from a finite population.{{< /marginnote >}}

```js
// Finite-population without-replacement covariance Cov(Y1, Y2) < 0 and sample-sum variance
const covF = await show`FullSimplify[(kRed/nPop)*((kRed - 1)/(nPop - 1)) - (kRed/nPop)^2]`
```

$$
\operatorname{Cov}(Y_1, Y_2) = \frac{K (K -N)}{(-1+N) N^2}
$$

{{< marginnote >}}Combine marginal variances and pairwise covariances to obtain the hypergeometric sample-sum variance.{{< /marginnote >}}

```js
const varHyper = await show`FullSimplify[n*(kRed/nPop)*(1 - kRed/nPop) + n*(n - 1)*(${covF})]`
```

$$
\operatorname{Var}\!\left(\sum_{i=1}^n Y_i\right) = \frac{K n (K -N) (n-N)}{(-1+N) N^2}
$$

{{< marginnote >}}Take $N \to \infty$ at fixed proportion $\theta = K/N$ to confirm that finite-population covariance vanishes.{{< /marginnote >}}

```js
await show`Limit[${covF} /. kRed -> th * nPop, nPop -> Infinity]`
```

$$
\lim_{N \to \infty} \operatorname{Cov}(Y_1, Y_2) = 0
$$

{{< marginnote >}}Instantiate Bayes’ rule as an exact fraction for the screening test ($p_0 = 0.01, s = 0.95, f = 0.05$).{{< /marginnote >}}

```js
// Instantiate screening example (p0 = 1/100, s = 95/100, f = 5/100) & Diaconis-Freedman TV (N = 20, 100, 1000)
const pExact = await show`${post} /. {p0 -> 1/100, s -> 95/100, f -> 5/100}`
```

$$
\Pr(H_1 \mid E)\big|_{p_0=0.01,\; s=0.95,\; f=0.05} = \frac{19}{118}
$$

{{< marginnote >}}Convert the exact screening posterior probability $19/118$ to decimal form.{{< /marginnote >}}

```js
await show`N[${pExact}]`
```

$$
\Pr(H_1 \mid E)\big|_{\text{decimal}} = 0.161017
$$

{{< marginnote >}}Compute the exact total-variation distance between hypergeometric and binomial draws as $N$ grows.{{< /marginnote >}}

```js
await show`N[Table[1/2 * Sum[Abs[
  Binomial[3*nPop/10, k]*Binomial[7*nPop/10, 10 - k]/Binomial[nPop, 10]
  - Binomial[10, k]*(3/10)^k*(7/10)^(10 - k)], {k, 0, 10}], {nPop, {20, 100, 1000}}]]`
```

$$
\begin{aligned}
&\bigl(d_{\text{TV}}(\text{Hypergeom}, \text{Binom})\bigr)_{N \in \{20,\,100,\,1000\}} \\
&= \{0.15871,0.0255493,0.00244915\}
\end{aligned}
$$

## Exercises {#sec:ch02-exercises}

{{< thm kind="exercise" label="ex:ch02-dutch-book" >}}
Suppose a bookmaker offers even-money odds corresponding to subjective probabilities $q(F) = 0.6$ and $q(\text{not } F) = 0.6$ (violating P1–P2 because $q(F) + q(\text{not } F) = 1.2 > 1$). Construct a pair of bets against this bookmaker that guarantees you a positive profit whether $F$ occurs or not.
{{< /thm >}}

{{< details summary="Symbolic Solution & Instantiation" >}}

{{< marginnote >}}Simplify the bookmaker’s guaranteed profit when selling one unit each of $F$ and $F^c$ at prices $q_F + q_{F^c} > 1$.{{< /marginnote >}}

```js
// Ex 2.1: Dutch book guaranteed profit when qF + qNotF > 1 (both outcomes F and not-F)
const profitF = await show`Simplify[(qF + qNotF) - 1]`
```

$$
\text{Dutch-book profit} = (q_F - 1) + q_{F^c} = -1+q_F +q_{F^c}
$$

{{< marginnote >}}Instantiate the guaranteed Dutch-book profit when $q_F = q_{F^c} = 0.6$.{{< /marginnote >}}

```js
await show`N[${profitF} /. {qF -> 6/10, qNotF -> 6/10}]`
```

$$
\text{Profit}\big|_{q_F=0.6,\; q_{F^c}=0.6} = 0.2
$$

{{< /details >}}

{{< thm kind="exercise" label="ex:ch02-finite-exch" >}}
Consider drawing $n = 2$ balls without replacement from an urn containing $K$ red balls and $N - K$ blue balls, where $Y_i = 1$ if draw $i$ is red. Verify directly that $(Y_1, Y_2)$ is exchangeable and compute $\operatorname{Cov}(Y_1, Y_2)$ as a function of $K$ and $N$. Show that $\operatorname{Cov}(Y_1, Y_2) < 0$ for every finite $N \ge 2$ with $0 < K < N$, and verify that $\operatorname{Cov}(Y_1, Y_2) \to 0$ as $N \to \infty$ with $K/N \to \theta$.
{{< /thm >}}

{{< details summary="Symbolic Solution & Instantiation" >}}

{{< marginnote >}}Compute $\Pr(Y_1 = 1, Y_2 = 0)$ symbolically for two draws without replacement from an urn of $K$ reds in $N$.{{< /marginnote >}}

```js
// Ex 2.2: Exchangeability & negative covariance of n = 2 draws without replacement
const p10 = await show`FullSimplify[(kRed/nPop)*((nPop - kRed)/(nPop - 1))]`
```

$$
\Pr(Y_1 = 1, Y_2 = 0) = \frac{K (-K +N)}{(-1+N) N}
$$

{{< marginnote >}}Compute $\Pr(Y_1 = 0, Y_2 = 1)$ for the reversed draw order: the same expression.{{< /marginnote >}}

```js
const p01 = await show`FullSimplify[((nPop - kRed)/nPop)*(kRed/(nPop - 1))]`
```

$$
\Pr(Y_1 = 0, Y_2 = 1) = \frac{K (-K +N)}{(-1+N) N}
$$

{{< marginnote >}}Compute $\operatorname{Cov}(Y_1, Y_2)$ symbolically, showing it is strictly negative for $0 < K < N$.{{< /marginnote >}}

```js
const covF = await show`FullSimplify[(kRed/nPop)*((kRed - 1)/(nPop - 1)) - (kRed/nPop)^2]`
```

$$
\operatorname{Cov}(Y_1, Y_2) = \frac{K (K -N)}{(-1+N) N^2}
$$

{{< marginnote >}}Check exchangeability symmetry, the $N \to \infty$ i.i.d. limit, and the concrete value at $(K, N) = (3, 10)$.{{< /marginnote >}}

```js
await show`{Simplify[${p10} - ${p01}], Limit[${covF} /. kRed -> th*nPop, nPop -> Infinity], N[${covF} /. {kRed -> 3, nPop -> 10}]}`
```

$$
\begin{aligned}
&\bigl(P(1,0)-P(0,1),\; \lim_{N\to\infty}\operatorname{Cov},\; \operatorname{Cov}|_{K=3,N=10}\bigr) \\
&= \{0,0,-0.0233333\}
\end{aligned}
$$

{{< /details >}}

{{< thm kind="exercise" label="ex:ch02-conditional-indep" >}}
Give an example of two events $F$ and $G$ that are *conditionally* independent given $H$ and given $\text{not } H$, yet *marginally* dependent. Explain how this mirrors the behavior of observations $Y_1, Y_2$ in a Bayesian model with unknown parameter $\theta$.
{{< /thm >}}

{{< details summary="Symbolic Solution & Instantiation" >}}

{{< marginnote >}}Factor $\Pr(F \cap G) - \Pr(F)\Pr(G)$ to show conditional independence given $H$ still yields marginal dependence.{{< /marginnote >}}

```js
// Ex 2.3: Conditional independence given H and not-H still implies marginal dependence
const margDiff = await show`Factor[(h*p1*q1 + (1 - h)*p0*q0) - (h*p1 + (1 - h)*p0)*(h*q1 + (1 - h)*q0)]`
```

$$
\Pr(F \cap G) - \Pr(F)\Pr(G) = -((-1+h) h (p_0 -p_1) (q_0 -q_1))
$$

{{< marginnote >}}Evaluate the marginal dependence gap at $h = 1/2$, $p_1 = q_1 = 3/4$, and $p_0 = q_0 = 1/4$.{{< /marginnote >}}

```js
await show`${margDiff} /. {h -> 1/2, p1 -> 3/4, q1 -> 3/4, p0 -> 1/4, q0 -> 1/4}`
```

$$
\bigl[\Pr(F \cap G) - \Pr(F)\Pr(G)\bigr]_{h=1/2,\; p_1=q_1=3/4,\; p_0=q_0=1/4} = \frac{1}{16}
$$

{{< /details >}}
