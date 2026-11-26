---
title: "Linear Regression"
linkTitle: "Linear Regression"
weight: 10
label: "ch:regression"
---

{{< newthought "Regression asks a conditional question:" />}} how does the distribution of $Y$ change as $\mathbf{x}$ changes? Up to now every observation in a group shared the same mean. Here each observation carries its own mean, tied to the others through a short coefficient vector $\boldsymbol{\beta}$.{{< cite "hoff2009" >}} The Bayesian treatment of *estimation* turns out to be the multivariate normal update of {{< xref "ch:mvn" "full" >}} in a new costume. The genuinely new idea is what comes next: treating *which variables belong in the model* as one more unknown with a posterior distribution.

## The Normal Linear Model {#sec:ch09-model}

A linear regression model asserts that the conditional mean is linear in the *parameters*, $E[Y \mid \mathbf{x}] = \boldsymbol{\beta}^T\mathbf{x}$; the regressors themselves may be squares, products, or indicators of anything we measured. Stacking $n$ observations, with $\mathbf{X}$ the $n \times p$ matrix whose $i$-th row is $\mathbf{x}_i^T$, the **normal linear model**{{< index "linear regression" >}} is

$$
\mathbf{y} \mid \mathbf{X}, \boldsymbol{\beta}, \sigma^2 \sim \mathcal{N}_n(\mathbf{X}\boldsymbol{\beta},\, \sigma^2 I_n), \qquad
p(\mathbf{y} \mid \mathbf{X}, \boldsymbol{\beta}, \sigma^2)
= (2\pi\sigma^2)^{-n/2}\exp\left\{-\frac{\operatorname{SSR}(\boldsymbol{\beta})}{2\sigma^2}\right\}, \label{eq:ch09-lik}
$$

where $\operatorname{SSR}(\boldsymbol{\beta}) = (\mathbf{y} - \mathbf{X}\boldsymbol{\beta})^T(\mathbf{y} - \mathbf{X}\boldsymbol{\beta})$. Setting its gradient $-2\mathbf{X}^T\mathbf{y} + 2\mathbf{X}^T\mathbf{X}\boldsymbol{\beta}$ to zero gives the **ordinary least squares**{{< index "ordinary least squares" >}} estimate $\hat{\boldsymbol{\beta}}_{\text{ols}} = (\mathbf{X}^T\mathbf{X})^{-1}\mathbf{X}^T\mathbf{y}$, whose sampling variance is $\sigma^2(\mathbf{X}^T\mathbf{X})^{-1}$. Completing the square around it yields the regression analogue of the sum-of-squares decomposition from {{< xref "ch:normal" "full" >}}:

$$
\operatorname{SSR}(\boldsymbol{\beta})
= \operatorname{SSR}_{\text{ols}} +
(\boldsymbol{\beta} - \hat{\boldsymbol{\beta}}_{\text{ols}})^T \mathbf{X}^T\mathbf{X}\,(\boldsymbol{\beta} - \hat{\boldsymbol{\beta}}_{\text{ols}}), \label{eq:ch09-ssr}
$$

the cross term vanishing because the OLS residual is orthogonal to the columns of $\mathbf{X}$. Hence $(\hat{\boldsymbol{\beta}}_{\text{ols}}, \operatorname{SSR}_{\text{ols}})$ is sufficient for $(\boldsymbol{\beta}, \sigma^2)$.

**Running example.** Twelve men were randomized to twelve weeks of flat-terrain running or step aerobics; $y$ is the change in maximal oxygen uptake. With $x_2 = 1$ for aerobics and $x_3$ equal to age, Hoff fits

$$
E[Y \mid \mathbf{x}] = \beta_1 + \beta_2\,\text{group} + \beta_3\,\text{age} + \beta_4\,(\text{group} \times \text{age}), \label{eq:ch09-oxygen}
$$

that is, two unrelated lines: $\beta_1 + \beta_3\,\text{age}$ for runners and $(\beta_1 + \beta_2) + (\beta_3 + \beta_4)\,\text{age}$ for aerobics.{{< sidenote >}}Page 151 of the 2009 printing indexes the two lines by $x_1 = 0, 1$; since $x_1 \equiv 1$ is the intercept column, the switch is $x_2$. See {{< xref "app:errata" "full" >}}.{{< /sidenote >}} Least squares gives $\hat{\boldsymbol{\beta}}_{\text{ols}} = (-51.29, 13.11, 2.09, -0.32)^T$ with standard errors $(12.25, 15.76, 0.53, 0.65)$ and $\hat{\sigma}^2_{\text{ols}} = 8.54$. Read coefficient by coefficient, the group effect looks negligible. We shall see that this reading is wrong.

## Semiconjugate Priors and the Gibbs Sampler {#sec:ch09-semiconj}

As a function of $\boldsymbol{\beta}$, the likelihood {{< eqref "eq:ch09-lik" >}} is an exponentiated quadratic, so a normal prior is conditionally conjugate.

{{< proposition note="Semiconjugate Full Conditionals" label="prop:ch09-fc" >}}
Under independent priors $\boldsymbol{\beta} \sim \mathcal{N}_p(\boldsymbol{\beta}_0, \Sigma_0)$ and $1/\sigma^2 \sim \operatorname{gamma}(\nu_0/2,\, \nu_0\sigma_0^2/2)$,

$$
\begin{aligned}
\boldsymbol{\beta} \mid \mathbf{y}, \mathbf{X}, \sigma^2 &\sim \mathcal{N}_p(\mathbf{m}, V), \qquad
V = \bigl(\Sigma_0^{-1} + \mathbf{X}^T\mathbf{X}/\sigma^2\bigr)^{-1}, \quad
\mathbf{m} = V\bigl(\Sigma_0^{-1}\boldsymbol{\beta}_0 + \mathbf{X}^T\mathbf{y}/\sigma^2\bigr), \\
1/\sigma^2 \mid \mathbf{y}, \mathbf{X}, \boldsymbol{\beta} &\sim \operatorname{gamma}\!\left(\frac{\nu_0 + n}{2},\, \frac{\nu_0\sigma_0^2 + \operatorname{SSR}(\boldsymbol{\beta})}{2}\right).
\end{aligned} \label{eq:ch09-fc}
$$
{{< /proposition >}}

{{< proof >}}
Collecting the terms in $\boldsymbol{\beta}$ from prior and likelihood gives the exponent

$$
-\frac{1}{2}\boldsymbol{\beta}^T(\Sigma_0^{-1} + \mathbf{X}^T\mathbf{X}/\sigma^2)\boldsymbol{\beta} + \boldsymbol{\beta}^T(\Sigma_0^{-1}\boldsymbol{\beta}_0 + \mathbf{X}^T\mathbf{y}/\sigma^2),
$$

whose precision matrix and linear term are read off directly. With $\gamma = 1/\sigma^2$, the second conditional is proportional to $\gamma^{\nu_0/2 - 1}e^{-\gamma\nu_0\sigma_0^2/2} \cdot \gamma^{n/2}e^{-\gamma\operatorname{SSR}(\boldsymbol{\beta})/2}$, a gamma kernel.
{{< /proof >}}

Alternating these two draws is a complete Gibbs sampler. Precisions add and means average by precision, exactly as in one dimension: a vague prior ($\Sigma_0^{-1} \to 0$) returns $\hat{\boldsymbol{\beta}}_{\text{ols}}$, and a noisy experiment ($\sigma^2 \to \infty$) returns $\boldsymbol{\beta}_0$. The obstacle is not computation but *elicitation*: $\Sigma_0$ has $p$ variances and $\binom{p}{2}$ correlations, and few of us hold opinions about the prior correlation between an intercept and an interaction.

## Default Priors: Unit Information and the $g$-Prior {#sec:ch09-gprior}

Two principles let the design matrix supply the prior covariance for us.

**One observation’s worth of information.** The data contribute precision $\mathbf{X}^T\mathbf{X}/\sigma^2$, the work of $n$ observations. A **unit information prior**{{< index "unit information prior" >}}{{< cite "kass1995" >}} therefore uses $\Sigma_0^{-1} = \mathbf{X}^T\mathbf{X}/(n\sigma^2)$. Kass and Wasserman also center it at $\boldsymbol{\beta}_0 = \hat{\boldsymbol{\beta}}_{\text{ols}}$, so it borrows a little from $\mathbf{y}$ and is not a prior in the strict sense; $(\nu_0, \sigma_0^2) = (1, \hat{\sigma}^2_{\text{ols}})$ plays the same role for the variance.

**Invariance to units.** Recording age in months rather than years should not change what we believe about the effect of aging. Suppose the regressors are transformed as $\tilde{\mathbf{X}} = \mathbf{X}H$ with $H$ invertible. The same mean vector is $\tilde{\mathbf{X}}\tilde{\boldsymbol{\beta}} = \mathbf{X}H\tilde{\boldsymbol{\beta}}$, so coherent priors must satisfy $\boldsymbol{\beta} \stackrel{d}{=} H\tilde{\boldsymbol{\beta}}$.

{{< proposition note="Invariance of the g-Prior" label="prop:ch09-invariance" >}}
Let the prior rule assign $\mathcal{N}_p(\mathbf{0},\, k(\mathbf{X}^T\mathbf{X})^{-1})$ to the coefficients of any full-rank design $\mathbf{X}$, with $k > 0$ not depending on the units. Then analysts using $\mathbf{X}$ and $\tilde{\mathbf{X}} = \mathbf{X}H$ reach the same prior, and hence the same posterior, for $\boldsymbol{\beta} = H\tilde{\boldsymbol{\beta}}$.
{{< /proposition >}}

{{< proof >}}
The second analyst has $\operatorname{Var}(\tilde{\boldsymbol{\beta}}) = k(H^T\mathbf{X}^T\mathbf{X}H)^{-1} = kH^{-1}(\mathbf{X}^T\mathbf{X})^{-1}H^{-T}$, so $\operatorname{Var}(H\tilde{\boldsymbol{\beta}}) = k(\mathbf{X}^T\mathbf{X})^{-1}$, and the mean is $\mathbf{0}$ in both cases. The likelihood depends on the coefficients only through $\mathbf{X}\boldsymbol{\beta} = \tilde{\mathbf{X}}\tilde{\boldsymbol{\beta}}$, so the posteriors agree as well.
{{< /proof >}}

Choosing $k = g\sigma^2$ gives the zero-centered **Zellner $g$-prior**{{< index "g-prior" >}}:{{< cite "zellner1986" >}}

$$
\boldsymbol{\beta} \mid \mathbf{X}, \sigma^2 \sim \mathcal{N}_p\bigl(\mathbf{0},\, g\sigma^2(\mathbf{X}^T\mathbf{X})^{-1}\bigr), \qquad
1/\sigma^2 \sim \operatorname{gamma}(\nu_0/2,\, \nu_0\sigma_0^2/2), \label{eq:ch09-gprior}
$$

with $g = n$ carrying one observation’s information. Scaling the prior by $\sigma^2$ restores *full* conjugacy, so Gibbs sampling is unnecessary.

{{< theorem note="Exact Posterior under the g-Prior" label="thm:ch09-gprior" >}}
Under {{< eqref "eq:ch09-lik" >}} and {{< eqref "eq:ch09-gprior" >}}, define

$$
\operatorname{SSR}_g
= \mathbf{y}^T\Bigl(I_n - \frac{g}{g+1}\mathbf{X}(\mathbf{X}^T\mathbf{X})^{-1}\mathbf{X}^T\Bigr)\mathbf{y}
= \frac{g}{g+1}\operatorname{SSR}_{\text{ols}} + \frac{1}{g+1}\mathbf{y}^T\mathbf{y}. \label{eq:ch09-ssrg}
$$

Then

$$
p(\mathbf{y} \mid \mathbf{X}, \sigma^2) = (2\pi\sigma^2)^{-n/2}(1 + g)^{-p/2}\exp\{-\operatorname{SSR}_g/(2\sigma^2)\},
$$

and

$$
\begin{aligned}
1/\sigma^2 \mid \mathbf{y}, \mathbf{X} &\sim \operatorname{gamma}\!\left(\frac{\nu_0 + n}{2},\, \frac{\nu_0\sigma_0^2 + \operatorname{SSR}_g}{2}\right), \\
\boldsymbol{\beta} \mid \mathbf{y}, \mathbf{X}, \sigma^2 &\sim \mathcal{N}_p\!\left(\frac{g}{g+1}\hat{\boldsymbol{\beta}}_{\text{ols}},\; \frac{g}{g+1}\sigma^2(\mathbf{X}^T\mathbf{X})^{-1}\right).
\end{aligned} \label{eq:ch09-gpost}
$$
{{< /theorem >}}

{{< proof >}}
Let $\mathbf{m} = \frac{g}{g+1}\hat{\boldsymbol{\beta}}_{\text{ols}}$. Completing the square in the combined exponent,

$$
(\mathbf{y} - \mathbf{X}\boldsymbol{\beta})^T(\mathbf{y} - \mathbf{X}\boldsymbol{\beta}) + \frac{1}{g}\boldsymbol{\beta}^T\mathbf{X}^T\mathbf{X}\boldsymbol{\beta}
= \frac{g+1}{g}(\boldsymbol{\beta} - \mathbf{m})^T\mathbf{X}^T\mathbf{X}(\boldsymbol{\beta} - \mathbf{m}) + \operatorname{SSR}_g .
$$

The first term gives the conditional distribution of $\boldsymbol{\beta}$. Integrating it over $\boldsymbol{\beta}$ contributes $(2\pi\sigma^2)^{p/2}\bigl(\frac{g}{g+1}\bigr)^{p/2}\lvert\mathbf{X}^T\mathbf{X}\rvert^{-1/2}$, while the prior’s normalizing constant is $(2\pi g\sigma^2)^{-p/2}\lvert\mathbf{X}^T\mathbf{X}\rvert^{1/2}$; their product is $(1 + g)^{-p/2}$. What remains, as a function of $\gamma = 1/\sigma^2$, is $\gamma^{n/2}e^{-\gamma\operatorname{SSR}_g/2}$, which multiplies the $\operatorname{gamma}(\nu_0/2, \nu_0\sigma_0^2/2)$ prior to give the stated gamma posterior.
{{< /proof >}}

The shrinkage factor is the same scalar $g/(g+1)$ in every direction, and $\operatorname{SSR}_g$ interpolates between the residual sum of squares and the total sum of squares.{{< sidenote >}}On p. 157 of Hoff (2009) the normalizing constant of the $g$-prior is printed as $\lvert 2\pi g\sigma^2(\mathbf{X}^T\mathbf{X})^{-1}\rvert^{-1}$; the exponent should be $-1/2$, as the factor $(1+g)^{-p/2}$ on the next page requires. See {{< xref "app:errata" "full" >}}.{{< /sidenote >}} To sample the joint posterior, draw $\sigma^2$ and then $\boldsymbol{\beta}$ given $\sigma^2$: every pair is an *independent* exact draw.

### Collinearity and the Right Contrast {#sec:ch09-contrast}

For the oxygen data with $g = n = 12$ and $(\nu_0, \sigma_0^2) = (1, 8.54)$, {{< eqref "eq:ch09-ssrg" >}} gives $\operatorname{SSR}_g \approx 124.0$, the posterior mean is $\frac{12}{13}\hat{\boldsymbol{\beta}}_{\text{ols}} = (-47.35, 12.10, 1.93, -0.29)^T$, and the exact posterior standard deviations are about $(13.98, 17.98, 0.60, 0.74)$.{{< sidenote >}}Marginally $\boldsymbol{\beta}$ is multivariate $t$ with $\nu_0 + n = 13$ degrees of freedom, and $E[\sigma^2 \mid \mathbf{y}] = (\nu_0\sigma_0^2 + \operatorname{SSR}_g)/(\nu_0 + n - 2) \approx 12.05$. Hoff’s Monte Carlo values $(14.41, 18.62, 0.62, 0.77)$ come from 1,000 draws of a heavy-tailed quantity and agree within simulation error.{{< /sidenote >}} Both marginal intervals for $\beta_2$ and $\beta_4$ comfortably contain zero.

But $\beta_2$ is the group difference *at age zero*, an extrapolation of more than two decades, and it is almost perfectly confounded with $\beta_4$: the posterior correlation is $-0.993$. The estimand a scientist cares about is the **group contrast**{{< index "contrast" >}} at an attainable age, $\delta(a) = \beta_2 + \beta_4 a$, and its posterior follows from the same joint draws. At age 24 its posterior mean is close to $5.0$ with a standard deviation near $2$, not $18$. The exact 95% intervals exclude zero at ages 22 through 25, where both groups contributed data, and widen on either side ({{< xref "fig:ch09-reg" "full" >}}, right). **Two coefficients that are individually uncertain can have a sharply determined linear combination; never judge a joint hypothesis from marginal intervals.**

{{< fig src="images/bayesian-hoff/fig-ch09-regression-bma.svg" type="fullwidth" label="fig:ch09-reg" alt="Three panels for the oxygen uptake data: scatter of uptake change against age with posterior mean lines for running and aerobics groups; scatter of joint posterior draws of beta2 and beta4 lying on a thin negatively sloped ridge; posterior medians and 95 percent intervals of beta2 plus beta4 times age for ages 20 to 31, narrowest near age 24" short="Oxygen uptake: g-prior fits, collinearity, and the group contrast" >}}Oxygen uptake under the $g$-prior with $g = n = 12$ (exact Monte Carlo draws). Left: data and posterior mean lines for the two programs. Center: joint posterior draws of $(\beta_2, \beta_4)$ fall on a thin ridge with correlation $-0.993$. Right: posterior median and 95% interval of the contrast $\beta_2 + \beta_4\,\text{age}$; evidence for a group effect is strongest at ages 22–25 even though neither coefficient is separately distinguishable from zero.{{< /fig >}}

## Model Selection and the Backward-Elimination Trap {#sec:ch09-trap}

Hoff’s second example has 442 diabetes patients and $p = 64$ candidate regressors (10 main effects, 45 interactions, 9 squares), split into 342 training and 100 test cases with all variables standardized. Full OLS attains test error $0.67$, against $0.97$ for predicting zero. **Backward elimination**{{< index "backward elimination" >}}, which repeatedly drops the regressor with the smallest $\lvert t_j \rvert$ until every survivor exceeds $1.65$, keeps 20 variables and lowers the test error to $0.53$. So far, so good.

Now permute $\mathbf{y}$ at random, so that no regressor has any true association with the response. Initially only one $t$-statistic exceeds $1.65$. Yet after elimination Hoff is left with **18 regressors, 17 of them with $\lvert t \rvert > 2$ and four with $\lvert t \rvert > 3$**. The procedure manufactures significance: each deletion discards a noise direction whose estimate happened to be small, and the survivors are exactly those whose noise happened to be large. A $t$-statistic computed after selection no longer has a $t$ distribution, and nothing in the output warns us.

## Spike-and-Slab: Models as Parameters {#sec:ch09-selection}

The Bayesian response is to place the question inside the model. Write $\beta_j = z_j b_j$ with $z_j \in \{0, 1\}$ and $b_j \in \mathbb{R}$, so that each $\mathbf{z} \in \{0,1\}^p$ indexes one regression model. The induced prior on $\beta_j$ has an atom at zero and a continuous part, a **spike-and-slab**{{< index "spike-and-slab prior" >}} prior; George and McCulloch pioneered Gibbs sampling over such indicators.{{< cite "george1993" >}}{{< sidenote >}}Their original spike is a narrow normal rather than a point mass at zero. The point-mass version used here is Hoff’s, and it permits the exact integration below.{{< /sidenote >}} Let $\mathbf{X}_z$ be the $n \times p_z$ matrix of included columns and apply the $g$-prior to them: $\boldsymbol{\beta}_z \mid \mathbf{X}_z, \sigma^2 \sim \mathcal{N}_{p_z}(\mathbf{0}, g\sigma^2(\mathbf{X}_z^T\mathbf{X}_z)^{-1})$.

{{< proposition note="Exact Marginal Likelihood of a Model" label="prop:ch09-marginal" >}}
With $1/\sigma^2 \sim \operatorname{gamma}(\nu_0/2,\, \nu_0\sigma_0^2/2)$ and $\operatorname{SSR}_g^z$ as in {{< eqref "eq:ch09-ssrg" >}} computed from $\mathbf{X}_z$ (and $\operatorname{SSR}_g^z = \mathbf{y}^T\mathbf{y}$ when $p_z = 0$),

$$
p(\mathbf{y} \mid \mathbf{X}, \mathbf{z})
= \pi^{-n/2}\,\frac{\Gamma\bigl(\frac{\nu_0 + n}{2}\bigr)}{\Gamma\bigl(\frac{\nu_0}{2}\bigr)}\,
(1 + g)^{-p_z/2}\,
\frac{(\nu_0\sigma_0^2)^{\nu_0/2}}{(\nu_0\sigma_0^2 + \operatorname{SSR}_g^z)^{(\nu_0 + n)/2}}. \label{eq:ch09-marginal}
$$
{{< /proposition >}}

{{< proof >}}
Multiply $p(\mathbf{y} \mid \mathbf{X}, \mathbf{z}, \gamma)$ from {{< xref "thm:ch09-gprior" "full" >}} by the gamma prior density and integrate over $\gamma = 1/\sigma^2$:

$$
\frac{(1+g)^{-p_z/2}}{(2\pi)^{n/2}}\,\frac{(\nu_0\sigma_0^2/2)^{\nu_0/2}}{\Gamma(\nu_0/2)}
\int_0^\infty \gamma^{\frac{\nu_0 + n}{2} - 1} e^{-\gamma(\nu_0\sigma_0^2 + \operatorname{SSR}_g^z)/2}\,d\gamma
= \frac{(1+g)^{-p_z/2}}{(2\pi)^{n/2}}\,\frac{(\nu_0\sigma_0^2/2)^{\nu_0/2}}{\Gamma(\nu_0/2)}\,
\frac{\Gamma\bigl(\frac{\nu_0+n}{2}\bigr)}{\bigl(\frac{\nu_0\sigma_0^2 + \operatorname{SSR}_g^z}{2}\bigr)^{(\nu_0+n)/2}},
$$

and the powers of $2$ combine to $2^{n/2}$, turning $(2\pi)^{-n/2}$ into $\pi^{-n/2}$.
{{< /proof >}}

Two details deserve care. First, the exponent of the bracket is exactly $(\nu_0 + n)/2$.{{< sidenote >}}The intermediate gamma-normalizer on p. 165 of Hoff (2009) is printed with exponent $(\nu_0 + n)/2 - 1$ (and $\operatorname{SSR}_g^z$ there lacks a transpose on its last $\mathbf{X}_z$); the final formula on the same page is correct. See {{< xref "app:errata" "full" >}}.{{< /sidenote >}} Second, **keep the factor $(\nu_0\sigma_0^2)^{\nu_0/2}$**. It cancels from ratios only when $\sigma_0^2$ is the same for all models. Under Hoff’s model-specific choice $\nu_0 = 1$, $\sigma_0^2 = s_z^2$ (the OLS residual variance of model $\mathbf{z}$), $g = n$, it survives, and the **Bayes factor**{{< index "Bayes factor" >}} is

$$
\frac{p(\mathbf{y} \mid \mathbf{X}, \mathbf{z}_a)}{p(\mathbf{y} \mid \mathbf{X}, \mathbf{z}_b)}
= (1 + n)^{(p_{z_b} - p_{z_a})/2}
\left(\frac{s_{z_a}^2}{s_{z_b}^2}\right)^{1/2}
\left(\frac{s_{z_b}^2 + \operatorname{SSR}_g^{z_b}}{s_{z_a}^2 + \operatorname{SSR}_g^{z_a}}\right)^{(n+1)/2}. \label{eq:ch09-bf}
$$

The first factor charges about $\frac{1}{2}\log(1+n)$ per extra regressor, the same penalty rate as BIC; the last rewards fit. No test and no stopping rule is involved.

| $\mathbf{z}$ | Model for $E[Y \mid \mathbf{x}]$ | $\log p(\mathbf{y} \mid \mathbf{X}, \mathbf{z})$ | $p(\mathbf{z} \mid \mathbf{y}, \mathbf{X})$ |
|:--|:--|--:|--:|
| $(1,0,0,0)$ | constant | $-44.33$ | $0.00$ |
| $(1,1,0,0)$ | group | $-42.35$ | $0.00$ |
| $(1,0,1,0)$ | age | $-37.66$ | $0.18$ |
| $(1,1,1,0)$ | group + age (parallel lines) | $-36.42$ | $0.63$ |
| $(1,1,1,1)$ | group + age + interaction | $-37.60$ | $0.19$ |
{#tab:ch09-models caption="Oxygen uptake: marginal likelihoods and posterior probabilities of five models under equal prior weights (Hoff 2009, Table 9.1)." short="Oxygen uptake model probabilities"}

Age is essentially certain to matter, and parallel lines beat the interaction model by a factor of $e^{1.18} \approx 3.3$. The three models containing a group effect total $0.82$, up from a prior $0.60$: modest evidence, honestly reported ({{< xref "tab:ch09-models" "full" >}}).

{{< remark note="Two paradoxes, and what uniform model priors really say" label="rem:ch09-paradox" >}}
Hold $\sigma_0^2$ common to all models.

1. **Lindley’s paradox**{{< index "Lindley’s paradox" >}}. For fixed data, the Bayes factor of a larger model against a nested one is $O\bigl((1+g)^{-(p_b - p_a)/2}\bigr)$ as $g \to \infty$. A “noninformative” slab is therefore maximally informative: it forces the smaller model. Diffuse proper priors are harmless for *estimation* but not for *comparison*, and improper ones leave the Bayes factor undefined.
2. **The information paradox**{{< index "information paradox" >}}. For fixed $g$, $\operatorname{SSR}_g^z \ge \mathbf{y}^T\mathbf{y}/(1+g)$, so the Bayes factor of $\mathbf{z}$ against the empty model never exceeds $(1+g)^{(\nu_0 + n - p_z)/2}$, *no matter how perfectly the model fits*. Placing a prior on $g$ can remove this defect; Liang et al. study such mixtures of $g$-priors and their consistency.{{< cite "liang2008" >}}
3. **Multiplicity**. Setting $p(\mathbf{z}) = 2^{-p}$ is a binomial prior on model size: for $p = 64$ it expects $32 \pm 4$ active regressors. Letting a common inclusion probability be $\operatorname{uniform}(0,1)$ instead gives $p(\mathbf{z}) = \bigl[(p+1)\binom{p}{p_z}\bigr]^{-1}$, which penalizes the number of *opportunities* for a false discovery automatically.{{< cite "scott2010" >}} The factor $(1+g)^{-p_z/2}$ penalizes complexity within a model; it is not a correction for how many models were tried.
{{< /remark >}}

## Collapsed Gibbs Sampling and Model Averaging {#sec:ch09-bma}

With $p = 64$ there are $2^{64} \approx 1.8 \times 10^{19}$ models. But {{< eqref "eq:ch09-marginal" >}} evaluates any one of them in closed form, so we can run a Markov chain on $\mathbf{z}$ alone with $\boldsymbol{\beta}$ and $\sigma^2$ integrated out, a **collapsed Gibbs sampler**{{< index "collapsed Gibbs sampler" >}}.

{{< thm kind="algorithm" note="Collapsed Gibbs Sampler for Variable Selection" label="alg:ch09-collapsed" >}}
Given $\mathbf{z}^{(s)}$, set $\mathbf{z} = \mathbf{z}^{(s)}$ and proceed as follows.

1. For each $j \in \{1, \dots, p\}$ in random order, compute the conditional odds

   $$
   o_j = \frac{\Pr(z_j = 1 \mid \mathbf{z}_{-j})}{\Pr(z_j = 0 \mid \mathbf{z}_{-j})} \times
   \frac{p(\mathbf{y} \mid \mathbf{X}, \mathbf{z}_{-j}, z_j = 1)}{p(\mathbf{y} \mid \mathbf{X}, \mathbf{z}_{-j}, z_j = 0)} \label{eq:ch09-odds}
   $$

   and set $z_j = 1$ with probability $o_j / (1 + o_j)$, otherwise $z_j = 0$.

2. Set $\mathbf{z}^{(s+1)} = \mathbf{z}$ and draw $1/\sigma^{2(s+1)}$ from {{< eqref "eq:ch09-gpost" >}} using $\mathbf{X}_z$.
3. Draw $\boldsymbol{\beta}_z^{(s+1)}$ from {{< eqref "eq:ch09-gpost" >}} and set the excluded coefficients to $0$.
{{< /thm >}}

The draws of $(\sigma^2, \boldsymbol{\beta})$ never feed back into the chain: they are ancestral samples given $\mathbf{z}$, so only $\mathbf{z}$ needs to mix. (A sampler that alternated $z_j$ with $\beta_j$ would be stuck, since $\beta_j \neq 0$ forces $z_j = 1$.) Averaging $\boldsymbol{\beta}^{(s)}$ over the chain gives the **Bayesian model averaged**{{< index "Bayesian model averaging" >}} estimate{{< cite "madigan1994" >}}

$$
\hat{\boldsymbol{\beta}}_{\text{bma}} = \frac{1}{S}\sum_{s=1}^S \boldsymbol{\beta}^{(s)}
\approx E[\boldsymbol{\beta} \mid \mathbf{y}, \mathbf{X}]
= \sum_{\mathbf{z}} p(\mathbf{z} \mid \mathbf{y}, \mathbf{X})\,E[\boldsymbol{\beta} \mid \mathbf{y}, \mathbf{X}, \mathbf{z}]. \label{eq:ch09-bma}
$$

On the diabetes data, $10{,}000$ scans find six regressors with inclusion probability above $1/2$, and the model-averaged test error is $0.452$, better than full OLS ($0.67$) and backward elimination ($0.53$). On the permuted response, *every* inclusion probability is below $1/2$ and all but two are below $1/4$: the trap does not spring. A sobering count accompanies this success. Only 32 models were visited more than once, so the chain estimates one-dimensional *margins* of $p(\mathbf{z} \mid \mathbf{y}, \mathbf{X})$, not the probabilities of individual models.

{{< remark note="An inclusion probability is not an effect size" label="rem:ch09-pip" >}}
The **posterior inclusion probability**{{< index "posterior inclusion probability" >}} $\Pr(z_j = 1 \mid \mathbf{y}, \mathbf{X})$ measures evidence that $\beta_j \neq 0$ *within the considered family and given the slab width $g$*. A negligible effect measured on a million cases can have probability near $1$; two nearly duplicate regressors can share one strong effect and each show a probability near $1/2$. Report it beside the posterior of $\beta_j$ itself, and inspect joint inclusion for correlated regressors.
{{< /remark >}}

```python
import itertools
import numpy as np
from scipy.special import gammaln

rng = np.random.default_rng(9)
age = np.array([23, 22, 22, 25, 27, 20, 31, 23, 27, 28, 22, 24], dtype=float)
grp = np.repeat([0.0, 1.0], 6)                       # 0 = running, 1 = aerobics
y = np.array([-0.87, -10.74, -3.27, -1.97, 7.50, -7.25,
              17.05, 4.96, 10.40, 11.05, 0.26, 2.51])
X = np.column_stack([np.ones(12), grp, age, grp * age])
n, p = X.shape
g, nu0 = float(n), 1.0

def summaries(X):
    """Return OLS coefficients, residual variance, and SSR_g for design X."""
    if X.shape[1] == 0:
        return np.zeros(0), y @ y / n, y @ y
    b = np.linalg.solve(X.T @ X, X.T @ y)
    fit = y @ X @ b                                  # y' H y
    return b, (y @ y - fit) / (n - X.shape[1]), y @ y - g / (g + 1) * fit

# 1. Exact i.i.d. posterior sampling under the g-prior (no Markov chain)
b_ols, s20, ssr_g = summaries(X)
S = 20_000
sig2 = 1.0 / rng.gamma((nu0 + n) / 2, 2.0 / (nu0 * s20 + ssr_g), size=S)  # scale = 1/rate
L = np.linalg.cholesky(g / (g + 1) * np.linalg.inv(X.T @ X))
beta = g / (g + 1) * b_ols + np.sqrt(sig2)[:, None] * (rng.normal(size=(S, p)) @ L.T)
print("posterior mean", beta.mean(0).round(2), " corr(b2,b4) =",
      np.corrcoef(beta[:, 1], beta[:, 3])[0, 1].round(3))
for a in (20, 24, 30):
    print(f"contrast at age {a}:", np.quantile(beta[:, 1] + beta[:, 3] * a, [.025, .5, .975]).round(2))

# 2. Log marginal likelihood, retaining (nu0 * s20)^(nu0/2) since s20 varies by model
def log_marg(z):
    _, s2, ssr = summaries(X[:, z])
    return (-0.5 * n * np.log(np.pi) - 0.5 * z.sum() * np.log1p(g)
            + 0.5 * nu0 * np.log(nu0 * s2) - 0.5 * (nu0 + n) * np.log(nu0 * s2 + ssr)
            + gammaln((nu0 + n) / 2) - gammaln(nu0 / 2))

# 3. Collapsed Gibbs over all 2^4 models (uniform prior), checked by enumeration
z = np.ones(p, dtype=bool)
lp, pip, bma = log_marg(z), np.zeros(p), np.zeros(p)
for s in range(5_000):
    for j in rng.permutation(p):
        zp = z.copy()
        zp[j] = not zp[j]
        lpp = log_marg(zp)
        if np.log(rng.uniform()) < -np.logaddexp(0.0, lp - lpp):  # Pr(flip) = 1/(1+e^(lp-lpp))
            z, lp = zp, lpp
    pip += z / 5_000
    bma[z] += g / (g + 1) * summaries(X[:, z])[0] / 5_000         # Rao-Blackwellized mean
models = [np.array(m, dtype=bool) for m in itertools.product([0, 1], repeat=p)]
lps = np.array([log_marg(m) for m in models])
w = np.exp(lps - lps.max())
w /= w.sum()
print("inclusion (Gibbs):", pip.round(3), " (exact):", (w @ np.array(models)).round(3))
print("model-averaged beta:", bma.round(2))
```

## Modern Developments: Shrinkage, Correlated Selection, and Stacking {#sec:ch09-modern}

### The Horseshoe and Regularized Horseshoe Priors {#sec:ch09-horseshoe}

The $g$-prior shrinks every coefficient by the same factor $g/(g+1)$ in {{< eqref "eq:ch09-gpost" >}}, whereas a **global–local prior**{{< index "horseshoe prior" >}} gives each coefficient a shrinkage factor of its own.{{< sidenote >}}**Beyond Hoff (2009).** This material is not in Hoff’s book; the horseshoe of Carvalho, Polson, and Scott (2010) and its regularized form (Piironen and Vehtari, 2017) offer a continuous alternative to the spike-and-slab of {{< xref "sec:ch09-selection" "full" >}}.{{< /sidenote >}} The horseshoe{{< cite "carvalho2010" >}} takes half-Cauchy scales; for an orthogonal design with $\mathbf{X}^T\mathbf{X} = nI$,

$$
\begin{aligned}
\beta_j \mid \lambda_j, \tau, \sigma^2 &\sim \operatorname{normal}(0,\, \sigma^2\tau^2\lambda_j^2), \qquad
\lambda_j \stackrel{\text{i.i.d.}}{\sim} C^+(0,1), \quad \tau \sim C^+(0, \tau_0), \\
E[\beta_j \mid \mathbf{y}, \lambda_j, \tau] &= (1 - \kappa_j)\,\hat{\beta}_{j,\text{ols}}, \qquad
\kappa_j = \frac{1}{1 + n\tau^2\lambda_j^2}.
\end{aligned} \label{eq:ch09-horseshoe}
$$

*Why it holds.* Each coordinate is a normal update with data precision $n/\sigma^2$ and prior precision $1/(\sigma^2\tau^2\lambda_j^2)$, and $\kappa_j$ is the prior’s share. At $n\tau^2 = 1$ the half-Cauchy makes $\kappa_j \sim \operatorname{beta}(\frac{1}{2}, \frac{1}{2})$: mass piles up at $0$ (keep) and $1$ (discard). Writing each $\lambda_j^2$ as a mixture of inverse-gammas restores Gibbs sampling,{{< cite "makalic2016" >}} and $\boldsymbol{\beta}$ can be drawn in $O(n^2p)$ operations.{{< cite "bhattacharya2016" >}} A guess of $p_0$ relevant regressors suggests $\tau_0 = p_0/\{(p - p_0)\sqrt{n}\}$, and replacing $\lambda_j^2$ by $c^2\lambda_j^2/(c^2 + \tau^2\lambda_j^2)$ caps the slab at width $c\sigma$, the **regularized horseshoe**.{{< cite "piironen2017" >}} Beware the Bayesian lasso, with its double-exponential prior of rate $\rho$: its *mode* (the lasso{{< cite "tibshirani1996" >}}) is sparse, but its *full posterior* is not. In the sequence model ($\mathbf{X} = I_n$, $\sigma^2 = 1$) with true $\boldsymbol{\beta} = \mathbf{0}$ and $\rho = \sqrt{2\log n}$, each coordinate keeps posterior spread of order $1/\rho$, so $\lVert\boldsymbol{\beta}\rVert$ is of order $\sqrt{n/\log n}$ while the mode’s error vanishes.{{< cite "castillo2015" >}}

**When to use it.** Prefer the horseshoe for prediction or estimation with $p$ large or comparable to $n$ and no need for exact zeros. Keep Hoff’s {{< xref "alg:ch09-collapsed" "full" >}} when model probabilities are themselves the question.

### Sum of Single Effects (SuSiE) {#sec:ch09-susie}

{{< xref "rem:ch09-pip" "full" >}} warned that two nearly duplicate regressors share one strong effect, each showing an inclusion probability near $1/2$; **SuSiE**{{< index "SuSiE" >}} turns that warning into a reportable answer, the *set* of regressors that holds the effect.{{< sidenote >}}**Beyond Hoff (2009).** This material is not in Hoff’s book; the sum-of-single-effects model is due to Wang, Sarkar, Carbonetto, and Stephens (2020) and complements per-variable inclusion probabilities.{{< /sidenote >}} It writes $\boldsymbol{\beta}$ as $L$ vectors with one nonzero entry each:{{< cite "wang2020" >}}

$$
\begin{aligned}
\boldsymbol{\beta} &= \sum_{l=1}^L b_l\,\boldsymbol{\gamma}_l, \qquad
\boldsymbol{\gamma}_l \sim \operatorname{multinomial}(1, \boldsymbol{\pi}), \quad b_l \sim \operatorname{normal}(0, \sigma_{0l}^2), \\
\alpha_{lj} &= \frac{\pi_j\operatorname{BF}_{lj}}{\sum_k \pi_k\operatorname{BF}_{lk}}, \qquad
\operatorname{BF}_{lj} = \sqrt{\frac{s_j^2}{s_j^2 + \sigma_{0l}^2}}\,
\exp\!\left\{\frac{\hat{b}_{lj}^2}{2s_j^2}\cdot\frac{\sigma_{0l}^2}{s_j^2 + \sigma_{0l}^2}\right\},
\end{aligned} \label{eq:ch09-susie}
$$

with $\hat{b}_{lj} = \mathbf{x}_j^T\mathbf{r}_l/\mathbf{x}_j^T\mathbf{x}_j$, $s_j^2 = \sigma^2/\mathbf{x}_j^T\mathbf{x}_j$, and $\mathbf{r}_l$ the residual after subtracting the other $L - 1$ expected effects.

*Why it holds.* With a single effect there are only $p$ models, so Bayes’ rule enumerates them exactly, and $\operatorname{BF}_{lj}$ is a ratio of normal marginals. Cycling over $l$ (iterative Bayesian stepwise selection) is coordinate ascent on a variational objective in which the $L$ effects are independent but the choice *within* each is not. If $\mathbf{x}_1 = \mathbf{x}_2$ and $\pi_1 = \pi_2$, then $\operatorname{BF}_{l1} = \operatorname{BF}_{l2}$. When they carry a strong effect, $\boldsymbol{\alpha}_l \approx (\frac{1}{2}, \frac{1}{2}, 0, \dots)$ and the 95% **credible set**{{< index "credible set" >}} is $\{1, 2\}$: we are sure there is an effect, and unsure which column carries it.

**When to use it.** Choose SuSiE for sparse problems with strongly correlated regressors, such as genetic fine mapping. Because it is variational, dependence *between* effects is lost and local optima are possible; for moderate $p$, or dense signals, {{< xref "alg:ch09-collapsed" "full" >}} targets the exact posterior.

### Bayesian Stacking in $\mathcal{M}$-Open Settings {#sec:ch09-stacking}

The average {{< eqref "eq:ch09-bma" >}} weights models by $p(\mathbf{z} \mid \mathbf{y}, \mathbf{X})$, the right weights when one of the candidates is true (**$\mathcal{M}$-closed**) but not when all are wrong (**$\mathcal{M}$-open**).{{< sidenote >}}**Beyond Hoff (2009).** This material is not in Hoff’s book; stacking is a much older idea for point predictions, extended to full predictive distributions by Yao, Vehtari, Simpson, and Gelman (2018) as an alternative to model averaging.{{< /sidenote >}} As $n$ grows, model averaging typically puts all its weight on the single model closest to the truth in Kullback–Leibler divergence, even if a mixture predicts better. **Stacking**{{< index "stacking" >}} chooses the mixture directly by its leave-one-out log score:{{< cite "yao2018" >}}

$$
\hat{\mathbf{w}} = \operatorname*{arg\,max}_{w_k \ge 0,\; \sum_k w_k = 1}\;
\frac{1}{n}\sum_{i=1}^n \log \sum_{k=1}^K w_k\, p(y_i \mid \mathbf{y}_{-i}, \mathcal{M}_k). \label{eq:ch09-stacking}
$$

*Why it holds.* Each held-out term estimates the mixture’s expected log score on new data without using $y_i$ twice, and the objective is concave on the simplex. Under the $g$-prior, the leave-one-out terms need no refitting. Hold the prior, including $\sigma_0^2$, fixed and let $A = I_n - \frac{g}{g+1}\mathbf{X}_z(\mathbf{X}_z^T\mathbf{X}_z)^{-1}\mathbf{X}_z^T$ be the matrix in {{< eqref "eq:ch09-ssrg" >}}. Marginally $\mathbf{y}$ is multivariate $t$ with scale matrix $\sigma_0^2A^{-1}$, so

$$
y_i \mid \mathbf{y}_{-i}, \mathbf{z} \sim t_{\nu_0 + n - 1}\!\left(y_i - \frac{(A\mathbf{y})_i}{A_{ii}},\;
\frac{\nu_0\sigma_0^2 + \operatorname{SSR}_g^z - (A\mathbf{y})_i^2/A_{ii}}{A_{ii}\,(\nu_0 + n - 1)}\right), \label{eq:ch09-loo}
$$

with location and squared scale; the location does not depend on $y_i$, which cancels. The choice $\sigma_0^2 = s_z^2$ behind {{< xref "tab:ch09-models" "full" >}} uses all of $\mathbf{y}$, so it would have to be recomputed, or fixed, for an honest hold-out score.

**When to use it.** Stack when the goal is prediction and no model is believed. Keep Hoff’s averaging when a true model is plausible or the posterior probabilities answer the scientific question: stacking weights are *not* probabilities, and near-identical models split theirs arbitrarily.

### Computational & Symbolic Check {#sec:ch09-modern-check}

The script compares draws of the shrinkage factor in {{< eqref "eq:ch09-horseshoe" >}} with $\operatorname{beta}(\frac{1}{2}, \frac{1}{2})$, and evaluates the single-effect probabilities of {{< eqref "eq:ch09-susie" >}} for two identical regressors and one unrelated regressor.{{< sidenote >}}**Beyond Hoff (2009).** This computational check and its Wolfram symbolic counterpart below verify the modern methods in this section and are not in Hoff’s book.{{< /sidenote >}}

```python
import numpy as np
from scipy import stats

rng = np.random.default_rng(91)
# 1. Horseshoe: lambda ~ C+(0,1) with n tau^2 = 1 gives kappa ~ Beta(1/2, 1/2)
kappa = 1.0 / (1.0 + rng.standard_cauchy(100_000) ** 2)
print("KS distance:", round(stats.kstest(kappa, stats.beta(0.5, 0.5).cdf).statistic, 4),
      " mean, var:", kappa.mean().round(3), kappa.var().round(3), "(exact 0.5, 0.125)")
# 2. SuSiE single effect: columns 1 and 2 are identical, column 3 is noise
n, sig2, v0 = 200, 1.0, 1.0
x = rng.normal(size=n)
X = np.column_stack([x, x, rng.normal(size=n)])
y = 0.8 * x + rng.normal(size=n)
xx = (X ** 2).sum(axis=0)
bhat, s2 = X.T @ y / xx, sig2 / xx
lbf = 0.5 * np.log(s2 / (s2 + v0)) + bhat ** 2 / (2 * s2) * v0 / (s2 + v0)
alpha = np.exp(lbf - lbf.max())
print("PIPs:", (alpha / alpha.sum()).round(3), "(exact 1/2, 1/2, ~0)")
```

{{< marginnote >}}Invert $\kappa = 1/(1+\lambda^2)$ on $\lambda > 0$: the local scale as a function of the shrinkage factor.{{< /marginnote >}}

```js
// Horseshoe: the half-Cauchy prior on lambda induces kappa = 1/(1 + lambda^2) ~ Beta(1/2, 1/2)
const lamK = await show`Sqrt[1 - k]/Sqrt[k]`
```

$$
\lambda(\kappa) = \frac{\sqrt{1-\kappa}}{\sqrt{\kappa}}
$$

{{< marginnote >}}Change variables in the half-Cauchy density $2/(\pi(1+\lambda^2))$ from $\lambda$ to $\kappa$ (a decreasing map, hence the minus sign).{{< /marginnote >}}

```js
const densK = await show`Assuming[0 < k < 1, FullSimplify[-D[${lamK}, k] * 2/(Pi*(1 + (${lamK})^2))]]`
```

$$
p_\kappa(\kappa) = p_\lambda(\lambda(\kappa))\,\left\lvert\frac{d\lambda}{d\kappa}\right\rvert = \frac{1}{\pi \sqrt{(1-\kappa) \kappa}}
$$

{{< marginnote >}}Divide the induced density by the $\operatorname{Beta}(\tfrac12, \tfrac12)$ density: the ratio is identically $1$.{{< /marginnote >}}

```js
await show`Assuming[0 < k < 1, FullSimplify[(${densK}) / (k^(-1/2)*(1 - k)^(-1/2)/Beta[1/2, 1/2])]]`
```

$$
\begin{aligned}
&\frac{p_\lambda(\lambda(\kappa))\,\lvert d\lambda/d\kappa\rvert}{\kappa^{-1/2}(1-\kappa)^{-1/2}/B\!\left(\frac{1}{2}, \frac{1}{2}\right)} \\
&= 1
\end{aligned}
$$

{{< marginnote >}}Integrate the induced density to get $\mathbb{E}[\kappa]$ and $\operatorname{Var}[\kappa]$, the exact values printed by the script.{{< /marginnote >}}

```js
await show`{Integrate[k*(${densK}), {k, 0, 1}], Integrate[(k - 1/2)^2*(${densK}), {k, 0, 1}]}`
```

$$
\bigl(\mathbb{E}[\kappa],\; \operatorname{Var}[\kappa]\bigr) = \left\{\frac{1}{2},\frac{1}{8}\right\}
$$

{{< marginnote >}}Integrate the effect $b \sim \mathcal{N}(0, \sigma_0^2)$ out of the normal likelihood of $\hat{b}$ and divide by its value at $b = 0$.{{< /marginnote >}}

```js
// SuSiE: Bayes factor as a ratio of normal marginals, then PIPs of two duplicate regressors
const bfOne = await show`Assuming[s2 > 0 && v > 0 && Element[bh, Reals], FullSimplify[Exp[bh^2/(2*s2)]
  *Integrate[Exp[-(bh - b)^2/(2*s2)]*Exp[-b^2/(2*v)]/Sqrt[2*Pi*v], {b, -Infinity, Infinity}]]]`
```

$$
\operatorname{BF}_{lj} = \frac{\int p(\hat{b} \mid b)\,p(b)\,db}{p(\hat{b} \mid b = 0)} = e^{\frac{\hat{b}^2 \sigma_0^2}{2 s^2 (s^2+\sigma_0^2)}} \sqrt{\frac{s^2}{s^2+\sigma_0^2}}
$$

{{< marginnote >}}Divide the integrated Bayes factor by the closed form of $\operatorname{BF}_{lj}$ stated above.{{< /marginnote >}}

```js
await show`Assuming[s2 > 0 && v > 0 && Element[bh, Reals],
  FullSimplify[(${bfOne}) / (Sqrt[s2/(s2 + v)]*Exp[bh^2/(2*s2)*v/(s2 + v)])]]`
```

$$
\frac{\int p(\hat{b} \mid b)\,p(b)\,db \,\big/\, p(\hat{b} \mid b = 0)}{\sqrt{\frac{s^2}{s^2+\sigma_0^2}}\,\exp\!\left\{\frac{\hat{b}^2}{2s^2}\cdot\frac{\sigma_0^2}{s^2+\sigma_0^2}\right\}} = 1
$$

{{< marginnote >}}Duplicate columns have the same Bayes factor, so it cancels; equal prior weights leave $\alpha_1 = \alpha_2 = \tfrac12$.{{< /marginnote >}}

```js
await show`FullSimplify[{w1*(${bfOne}), w2*(${bfOne})} / (w1*(${bfOne}) + w2*(${bfOne}))] /. w2 -> w1`
```

$$
(\alpha_1, \alpha_2)\big|_{\mathbf{x}_1 = \mathbf{x}_2,\; \pi_1 = \pi_2} = \left\{\frac{1}{2},\frac{1}{2}\right\}
$$

## Symbolic Check in Wolfram Language {#sec:ch09-wolfram}

Integrates $\gamma = 1/\sigma^2$ symbolically in `wolfram-ws-bridge` JavaScript mode to derive $p(\mathbf{y} \mid \mathbf{X}, \mathbf{z})$ and the general symbolic Bayes factor $\operatorname{BF}_{a,b}$ (retaining model-specific $s_a^2, s_b^2$), verifies both the Lindley limit ($g \to \infty$) and the information-paradox supremum, and instantiates `margZ` directly to reproduce Table 9.1.

{{< marginnote >}}Integrate precision $\gamma = 1/\sigma^2$ out of the $g$-prior joint model to derive the closed-form marginal likelihood $p(\mathbf{y} \mid \mathbf{X}, \mathbf{z})$.{{< /marginnote >}}

```js
// Chapter 9: Symbolic g-prior marginal likelihood, general Bayes factor & exact Table 9.1
const margZ = await show`Assuming[nu0 > 0 && s20 > 0 && ssr > 0 && g > 0 && n > 0,
  FullSimplify[Integrate[(1 + g)^(-pz/2)*(2*Pi)^(-n/2)*((nu0*s20/2)^(nu0/2)/Gamma[nu0/2])
    *gam^((nu0 + n)/2 - 1)*Exp[-gam*(nu0*s20 + ssr)/2], {gam, 0, Infinity}]]]`
```

$$
\begin{aligned}
&p(\mathbf{y} \mid \mathbf{X}, \mathbf{z}) \\
&= \frac{(1+g)^{-p_z /2} \pi^{-n/2} (\nu_0 \sigma_0^2)^{\nu_0 /2} (\nu_0 \sigma_0^2 +\operatorname{SSR}_g)^{\frac{1}{2} (-n-\nu_0)} \Gamma \left(\frac{n+\nu_0}{2}\right)}{\Gamma \left(\frac{\nu_0}{2}\right)}
\end{aligned}
$$

{{< marginnote >}}Take the ratio of two marginal likelihoods to obtain the general symbolic Bayes factor $\operatorname{BF}_{a,b}$.{{< /marginnote >}}

```js
// General symbolic Bayes factor BF_{a,b} retaining model-specific s20_a, s20_b
await show`Assuming[nu0 > 0 && sa > 0 && sb > 0 && ssra > 0 && ssrb > 0 && g > 0 && n > 0,
  FullSimplify[(${margZ} /. {pz -> pa, s20 -> sa, ssr -> ssra}) / (${margZ} /. {pz -> pb, s20 -> sb, ssr -> ssrb})]]`
```

$$
\begin{aligned}
&\operatorname{BF}_{a,b} = \frac{p(\mathbf{y} \mid \mathbf{X}, \mathbf{z}_a)}{p(\mathbf{y} \mid \mathbf{X}, \mathbf{z}_b)} \\
&= (1+g)^{\frac{1}{2} (-p_a +p_b)} \left(\frac{\sigma_{0,a}^2}{\sigma_{0,b}^2}\right)^{\nu_0 /2} \left(\frac{\nu_0 \sigma_{0,a}^2 +\operatorname{SSR}_a}{\nu_0 \sigma_{0,b}^2 +\operatorname{SSR}_b}\right)^{\frac{1}{2} (-n-\nu_0)}
\end{aligned}
$$

{{< marginnote >}}Divide the marginal of a $p_1$-regressor model, $\operatorname{SSR}_g = \tfrac{g}{g+1} r_1 + \tfrac{1}{g+1}\mathbf{y}^T\mathbf{y}$, by that of the null model ($p_z = 0$, $\operatorname{SSR}_g = \mathbf{y}^T\mathbf{y}$).{{< /marginnote >}}

```js
const bf = await show`FullSimplify[
  (${margZ} /. {pz -> p1, ssr -> (g/(g+1))*r1 + (1/(g+1))*yy}) / (${margZ} /. {pz -> 0, ssr -> yy})]`
```

$$
\begin{aligned}
&\operatorname{BF}_{10}(g) = \frac{p(\mathbf{y} \mid \mathbf{X}, \mathbf{z}_1)}{p(\mathbf{y} \mid \mathbf{X}, \mathbf{z}_0)} \\
&= (1+g)^{-p_1/2} \left(\frac{\nu_0 \sigma_0^2 + \frac{g\, r_1 + \mathbf{y}^T\mathbf{y}}{1+g}}{\nu_0 \sigma_0^2 + \mathbf{y}^T\mathbf{y}}\right)^{-\frac{n+\nu_0}{2}}
\end{aligned}
$$

{{< marginnote >}}Take $g \to \infty$ to prove Lindley’s paradox: diffuse $g$-priors force $\operatorname{BF}_{10} \to 0$ in favor of the null.{{< /marginnote >}}

```js
await show`Assuming[p1 > 0 && nu0 > 0 && s20 > 0 && yy > 0 && r1 > 0 && n > 0, Limit[${bf}, g -> Infinity]]`
```

$$
\lim_{g \to \infty} \operatorname{BF}_{10} = 0
$$

{{< marginnote >}}Take $r_1 \to 0$ at $\sigma_0^2 = 0$ to derive the information-paradox upper bound $(1 + g)^{(n + \nu_0 - p_1)/2}$.{{< /marginnote >}}

```js
await show`Assuming[p1 > 0 && g > 0 && nu0 > 0 && yy > 0 && n > 0,
  FullSimplify[Limit[${bf} /. s20 -> 0, r1 -> 0]]]`
```

$$
\begin{aligned}
&\lim_{r_1 \to 0}\left.\operatorname{BF}_{10}\right|_{\sigma_0^2=0} \\
&= (1+g)^{\frac{1}{2} (n+\nu_0 -p_1)}
\end{aligned}
$$

{{< marginnote >}}Write the OLS estimate $\hat{\boldsymbol{\beta}}_{\text{ols}}$ as a symbolic function of a design $\mathbf{X}_z$ and the response $\mathbf{y}$.{{< /marginnote >}}

```js
// Instantiate margZ directly on Hoff's Oxygen uptake Table 9.1 (g = n = 12, nu0 = 1, s20 = s_z^2)
const age = [23, 22, 22, 25, 27, 20, 31, 23, 27, 28, 22, 24]
const grp = [0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1]
const y = [-0.87, -10.74, -3.27, -1.97, 7.50, -7.25, 17.05, 4.96, 10.40, 11.05, 0.26, 2.51]
const Xfull = age.map((a, i) => [1, grp[i], a, grp[i] * a])
const olsB = await show`Function[{xm, yv}, LinearSolve[Transpose[xm].xm, Transpose[xm].yv]]`
```

$$
\hat{\boldsymbol{\beta}}_{\text{ols}}(\mathbf{X}_z, \mathbf{y}) = (\mathbf{X}_z^T\mathbf{X}_z)^{-1}\mathbf{X}_z^T\mathbf{y}
$$

{{< marginnote >}}Write the residual variance $s_z^2$ used as the prior guess $\sigma_0^2$, with $p_z$ the number of fitted coefficients.{{< /marginnote >}}

```js
const s2Fn = await show`Function[{xm, yv, bv}, (yv - xm.bv).(yv - xm.bv) / (Length[yv] - Length[bv])]`
```

$$
s_z^2(\mathbf{X}_z, \mathbf{y}, \hat{\boldsymbol{\beta}}) = \frac{(\mathbf{y} - \mathbf{X}_z\hat{\boldsymbol{\beta}})^T(\mathbf{y} - \mathbf{X}_z\hat{\boldsymbol{\beta}})}{n - p_z}
$$

{{< marginnote >}}Write the $g$-prior residual sum of squares $\operatorname{SSR}_g$ in terms of the OLS fit.{{< /marginnote >}}

```js
const ssrFn = await show`Function[{xm, yv, bv, g}, yv.yv - (g/(g + 1))*(yv.xm.bv)]`
```

$$
\operatorname{SSR}_g(\mathbf{X}_z, \mathbf{y}, \hat{\boldsymbol{\beta}}) = \mathbf{y}^T\mathbf{y} - \frac{g}{g+1}\,\mathbf{y}^T\mathbf{X}_z\hat{\boldsymbol{\beta}}
$$

{{< marginnote >}}Instantiate $\log p(\mathbf{y} \mid \mathbf{X}, \mathbf{z})$ on all five models of Hoff’s Oxygen Uptake Table 9.1, plugging in $s_z^2$ and $\operatorname{SSR}_g$ for each column subset.{{< /marginnote >}}

```js
const logMargs = await show`N[Table[With[{xz = ${Xfull}[[All, cols]]}, With[{bh = ${olsB}[xz, ${y}]},
  Log[${margZ} /. {n -> 12, g -> 12, nu0 -> 1, pz -> Length[cols],
    s20 -> ${s2Fn}[xz, ${y}, bh], ssr -> ${ssrFn}[xz, ${y}, bh, 12]}]]],
  {cols, {{1}, {1, 2}, {1, 3}, {1, 2, 3}, {1, 2, 3, 4}}}]]`
```

$$
\begin{aligned}
&\bigl(\log p(\mathbf{y} \mid \mathbf{X}, \mathbf{z})\bigr)_{\text{Table 9.1}} \\
&= \{-44.3327,-42.3533,-37.6577,-36.4173,-37.5986\}
\end{aligned}
$$

{{< marginnote >}}Normalize the log marginal likelihoods via softmax to reproduce the exact posterior model probabilities.{{< /marginnote >}}

```js
await show`N[Exp[${logMargs} - Max[${logMargs}]] / Total[Exp[${logMargs} - Max[${logMargs}]]]]`
```

$$
\begin{aligned}
&\bigl(p(\mathbf{z} \mid \mathbf{y}, \mathbf{X})\bigr)_{\text{Table 9.1}} \\
&= \{0.000228291,0.00165244,0.180895,0.625313,0.191911\}
\end{aligned}
$$

## Exercises {#sec:ch09-exercises}

{{< thm kind="exercise" label="ex:ch09-tmarginal" >}}
Integrate $\sigma^2$ out of {{< eqref "eq:ch09-gpost" >}} to show that any contrast $\mathbf{c}^T\boldsymbol{\beta}$ has a Student-$t$ posterior with $\nu_0 + n$ degrees of freedom, location $\frac{g}{g+1}\mathbf{c}^T\hat{\boldsymbol{\beta}}_{\text{ols}}$, and squared scale $\frac{g}{g+1}\,\mathbf{c}^T(\mathbf{X}^T\mathbf{X})^{-1}\mathbf{c}\,(\nu_0\sigma_0^2 + \operatorname{SSR}_g)/(\nu_0 + n)$. Use it to reproduce the claim that the 95% interval for $\beta_2 + \beta_4\,a$ excludes zero at ages $a = 22, \dots, 25$ only.
{{< /thm >}}

{{< details summary="Symbolic Solution & Instantiation" >}}

{{< marginnote >}}Write the squared Student-$t$ marginal scale of a linear contrast $c^T \beta$ under the $g$-prior.{{< /marginnote >}}

```js
// Ex 9.1: Exact Student-t marginal CI for oxygen contrast beta2 + beta4*age across ages 20..31
const age = [23, 22, 22, 25, 27, 20, 31, 23, 27, 28, 22, 24]
const grp = [0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1]
const y = [-0.87, -10.74, -3.27, -1.97, 7.50, -7.25, 17.05, 4.96, 10.40, 11.05, 0.26, 2.51]
const X = age.map((a, i) => [1, grp[i], a, grp[i] * a])
const scale2 = await show`(g/(g + 1))*cXtXinvC * (nu0*s20 + ssrG) / (nu0 + n)`
```

$$
\begin{aligned}
&\operatorname{Scale}^2\!\left(c^\top \beta \mid y\right) \\
&= \frac{(c^\top (X^\top X)^{-1} c) g (\nu_0 \sigma_0^2 +\operatorname{SSR}_g)}{(1+g) (n+\nu_0)}
\end{aligned}
$$

{{< marginnote >}}Write the OLS estimate as a symbolic function of the design and response.{{< /marginnote >}}

```js
const olsB = await show`Function[{xm, yv}, LinearSolve[Transpose[xm].xm, Transpose[xm].yv]]`
```

$$
\hat{\beta}_{\text{ols}}(X, y) = (X^\top X)^{-1} X^\top y
$$

{{< marginnote >}}Write the residual variance $s^2$, the prior guess $\sigma_0^2$ (here $n - p = 8$).{{< /marginnote >}}

```js
const s2Fn = await show`Function[{xm, yv, bv}, (yv - xm.bv).(yv - xm.bv) / (Length[yv] - Length[bv])]`
```

$$
s^2(X, y, \hat{\beta}) = \frac{(y - X\hat{\beta})^\top (y - X\hat{\beta})}{n - p}
$$

{{< marginnote >}}Write the $g$-prior residual sum of squares $\operatorname{SSR}_g$ in terms of the OLS fit.{{< /marginnote >}}

```js
const ssrFn = await show`Function[{xm, yv, bv, g}, yv.yv - (g/(g + 1))*(yv.xm.bv)]`
```

$$
\operatorname{SSR}_g(X, y, \hat{\beta}) = y^\top y - \frac{g}{g+1}\, y^\top X \hat{\beta}
$$

{{< marginnote >}}Solve $\Pr(\lvert T \rvert \le t) = 0.95$ for $T \sim t_{13}$, via the regularized incomplete beta function, to get the two-sided $95\%$ quantile.{{< /marginnote >}}

```js
const t13 = await show`t /. FindRoot[1 - Beta[13/(13 + t^2), 13/2, 1/2]/Beta[13/2, 1/2] == 95/100, {t, 2.16}]`
```

$$
t_{13,\,0.975} = 2.16037
$$

{{< marginnote >}}Filter ages $20, \dots, 31$ where the exact $95\%$ $t_{13}$ credible interval for Aerobics minus Running lies strictly above $0$, plugging $s^2$, $\operatorname{SSR}_g$ and $c^\top (X^\top X)^{-1} c$ into the scale.{{< /marginnote >}}

```js
await show`With[{bh = ${olsB}[${X}, ${y}]},
  Select[Range[20, 31], (12/13)*({0, 1, 0, #}.bh) - ${t13}*Sqrt[${scale2} /. {g -> 12, n -> 12, nu0 -> 1,
    cXtXinvC -> {0, 1, 0, #}.Inverse[Transpose[${X}].${X}].{0, 1, 0, #},
    s20 -> ${s2Fn}[${X}, ${y}, bh], ssrG -> ${ssrFn}[${X}, ${y}, bh, 12]}] > 0 &]]`
```

$$
\bigl\{\text{age} \in [20, 31] : 95\%\text{ exact } t_{13}\text{ CI} > 0\bigr\} = \{22,23,24,25\}
$$

{{< /details >}}

{{< thm kind="exercise" label="ex:ch09-intercept" >}}
The zero-centered $g$-prior also shrinks the intercept. Show that the fitted values are $\frac{g}{g+1}$ times the OLS fitted values, so that adding a constant to every $y_i$ changes the posterior of the slopes’ *variance* (through $\mathbf{y}^T\mathbf{y}$) although it should be irrelevant. Propose a version with a flat prior on the intercept and centered regressors, and explain why a *common* improper prior on the intercept does not harm Bayes factors while one on the slopes would.
{{< /thm >}}

{{< details summary="Symbolic Solution & Instantiation" >}}

{{< marginnote >}}Compute $\operatorname{SSR}_g(y + c\mathbf{1}) - \operatorname{SSR}_g(y)$ symbolically to expose shift non-invariance under a zero-centered $g$-prior.{{< /marginnote >}}

```js
// Ex 9.2: Shift non-invariance of zero-centered g-prior under y -> y + c*1
const shiftDiff = await show`FullSimplify[((g/(g + 1))*ssrOls + (1/(g + 1))*(yy + 2*c*n*yb + n*c^2)) - ((g/(g + 1))*ssrOls + (1/(g + 1))*yy)]`
```

$$
\operatorname{SSR}_g(y + c\mathbf{1}) - \operatorname{SSR}_g(y) = \frac{c n (c+2 \bar{y})}{1+g}
$$

{{< marginnote >}}Instantiate the shift inflation as an exact fraction and decimal at $n = g = 12, \bar{y} = 0, c = 10$.{{< /marginnote >}}

```js
await show`{${shiftDiff}, N[${shiftDiff}]} /. {n -> 12, g -> 12, yb -> 0, c -> 10}`
```

$$
\begin{aligned}
&\bigl(\Delta\operatorname{SSR}_{g,\text{exact}},\; \Delta\operatorname{SSR}_{g,\text{decimal}}\bigr)_{n=12,\; g=12,\; \bar{y}=0,\; c=10} \\
&= \left\{\frac{1200}{13},92.3077\right\}
\end{aligned}
$$

{{< /details >}}

{{< thm kind="exercise" label="ex:ch09-paradox" >}}
Verify both halves of {{< xref "rem:ch09-paradox" "full" >}}. Derive the bound $(1+g)^{(\nu_0+n-p_z)/2}$, and plot the log Bayes factor of $(1,1,1,0)$ against $(1,0,1,0)$ for the oxygen data (common $\sigma_0^2 = 8.54$) as $g$ ranges from $1$ to $10^6$. At what $g$ does the preferred model switch?
{{< /thm >}}

{{< details summary="Symbolic Solution & Instantiation" >}}

{{< marginnote >}}Write the Bayes factor $\operatorname{BF}_{A, B}(g)$ comparing (group + age) against (age only) as a function of $g$.{{< /marginnote >}}

```js
// Ex 9.3: Exact switch point g* where Lindley's paradox flips A=(1,1,1,0) vs B=(1,0,1,0) on oxygen data (nu0 = 1)
const bfG = await show`(1 + g)^(-1/2) * ((s20 + yy - (g/(g + 1))*fB) / (s20 + yy - (g/(g + 1))*fA))^((n + 1)/2)`
```

$$
\begin{aligned}
&\operatorname{BF}_{A, B}(g) \\
&= \frac{\left(\frac{-\frac{F_B g}{1+g}+\sigma_0^2 +y^\top y}{-\frac{F_A g}{1+g}+\sigma_0^2 +y^\top y}\right)^{\frac{1+n}{2}}}{\sqrt{1+g}}
\end{aligned}
$$

{{< marginnote >}}Write the fitted sum $F_z = y^\top X_z \hat{\beta}_{\text{ols}}$ of a model as a symbolic function of its design $X_z$ and the response.{{< /marginnote >}}

```js
const age = [23, 22, 22, 25, 27, 20, 31, 23, 27, 28, 22, 24]
const grp = [0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1]
const y = [-0.87, -10.74, -3.27, -1.97, 7.50, -7.25, 17.05, 4.96, 10.40, 11.05, 0.26, 2.51]
const Xfull = age.map((a, i) => [1, grp[i], a, grp[i] * a])
const fitSum = await show`Function[{xm, yv}, yv.xm.LinearSolve[Transpose[xm].xm, Transpose[xm].yv]]`
```

$$
F(X_z, y) = y^\top X_z (X_z^\top X_z)^{-1} X_z^\top y
$$

{{< marginnote >}}Instantiate $y^\top y$, $F_A$ (columns $1, 2, 3$) and $F_B$ (columns $1, 3$) on the oxygen data and solve $\operatorname{BF}_{A, B}(g^*) = 1$ numerically to locate the exact Lindley-paradox crossover $g^*$.{{< /marginnote >}}

```js
await show`g /. FindRoot[(${bfG} /. {s20 -> 8.54, yy -> N[${y}.${y}], n -> 12,
  fA -> N[${fitSum}[${Xfull}[[All, {1, 2, 3}]], ${y}]], fB -> N[${fitSum}[${Xfull}[[All, {1, 3}]], ${y}]]}) == 1, {g, 200}]`
```

$$
g^*\big|_{\operatorname{BF}_{A,B}(g^*)=1} = 4423.36
$$

{{< /details >}}

{{< thm kind="exercise" label="ex:ch09-permute" >}}
Simulate $\mathbf{X}$ with $n = 342$, $p = 64$ independent standard normal columns and an independent response $\mathbf{y}$. Apply backward elimination with cutoff $1.65$ and record the number of survivors; then run {{< xref "alg:ch09-collapsed" "full" >}} under both the uniform prior and the prior $\bigl[(p+1)\binom{p}{p_z}\bigr]^{-1}$. (For the latter, show that the prior odds in {{< eqref "eq:ch09-odds" >}} equal $(k+1)/(p-k)$ when $k$ other regressors are included.) Compare the three answers.
{{< /thm >}}

{{< details summary="Symbolic Solution & Instantiation" >}}

{{< marginnote >}}Simplify the Beta–Binomial multiplicity-adjusting prior odds for adding one predictor to a model of size $k$.{{< /marginnote >}}

```js
// Ex 9.4: Symbolic prior odds under Beta-Binomial multiplicity-adjusting prior
const odds = await show`FullSimplify[FunctionExpand[(1/((p + 1)*Binomial[p, k + 1])) / (1/((p + 1)*Binomial[p, k]))]]`
```

$$
\frac{\Pr(z_j = 1 \mid z_{-j})}{\Pr(z_j = 0 \mid z_{-j})} = \frac{1+k}{-k+p}
$$

{{< marginnote >}}Evaluate the prior odds at $p = 64$ for $k = 0$ ($1/64$) and $k = 5$ ($6/59$), contrasting with uniform odds $1$.{{< /marginnote >}}

```js
await show`{${odds} /. {p -> 64, k -> 0}, ${odds} /. {p -> 64, k -> 5}}`
```

$$
\begin{aligned}
&\bigl(\text{odds}_{k=0},\; \text{odds}_{k=5}\bigr)_{p=64} \\
&= \left\{\frac{1}{64},\frac{6}{59}\right\}
\end{aligned}
$$

{{< /details >}}
