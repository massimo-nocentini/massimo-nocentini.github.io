// All 12 symbolic + numeric double-check snippets in wolfram-ws-bridge JavaScript mode
// for "Bayesian Statistical Methods" (Companion to Hoff 2009).
// Uses ONLY stock kernel/allowlist.txt symbols and runs within the default 30s limit.

export const SNIPPETS = {
  ch01: `// Chapter 1: Symbolic Beta-Binomial posterior, shrinkage identity, and numeric check
const { Times, Power, Plus, Subtract, Minus, th, a, b, n, y } = W
const kernel = Times(
  Power(th, Plus(a, y, -1)),
  Power(Subtract(1, th), Plus(b, n, Minus(y), -1))
)
const Z = await show\`Assuming[a > 0 && b > 0 && y >= 0 && n >= y,
  FullSimplify[Integrate[\${kernel}, {th, 0, 1}]]]\`
const mean = await show\`Assuming[a > 0 && b > 0 && y >= 0 && n >= y,
  FullSimplify[Integrate[th * \${kernel}, {th, 0, 1}] / \${Z}]]\`
// Posterior mode (valid when a + y > 1 and b + n - y > 1)
await show\`FullSimplify[th /. First[Solve[D[Log[\${kernel}], th] == 0, th]]]\`
const resid = toJS(await wl\`Simplify[
  \${mean} - (n/(n + w)*(y/n) + w/(n + w)*(a/w)) /. w -> a + b]\`)
console.log('Shrinkage identity residual =', resid)

// Instantiate at n = 20, y = 0 across all three priors (cross-check with Python)
for (const [name, a0, b0] of [['Uniform', 1, 1], ['Epidemiological', 2, 20], ['Strong wrong', 10, 10]]) {
  const m = toJS(await wl\`N[\${mean} /. {a -> \${a0}, b -> \${b0}, n -> 20, y -> 0}]\`)
  const pLt = toJS(await wl\`N[Beta[1/10, \${a0}, \${b0 + 20}] / Beta[\${a0}, \${b0 + 20}]]\`)
  console.log(\`\${name.padEnd(16)} -> mean = \${m.toFixed(3)}, Pr(theta < 0.10 | y=0) = \${pLt.toFixed(3)}\`)
}`,

  ch02: `// Chapter 2: Symbolic Bayes' rule, Bayes factor, and finite-population covariance
const post = await show\`Simplify[(s * p0) / (s * p0 + f * (1 - p0))]\`
await show\`Simplify[((\${post} / (1 - \${post})) / (p0 / (1 - p0)))]\`

// Finite-population without-replacement covariance Cov(Y1, Y2) < 0
const covF = await show\`FullSimplify[(kRed/nPop)*((kRed - 1)/(nPop - 1)) - (kRed/nPop)^2]\`
const covLim = toJS(await wl\`Limit[\${covF} /. kRed -> th * nPop, nPop -> Infinity]\`)
console.log('Limit of Cov(Y1, Y2) as N -> Infinity =', covLim)

// Screening example (p0 = 1/100, s = 95/100, f = 5/100) & Diaconis-Freedman TV
const pExact = await show\`\${post} /. {p0 -> 1/100, s -> 95/100, f -> 5/100}\`
console.log('Screening Pr(H1 | E) ≈', toJS(await wl(W.N(pExact))).toFixed(4))
for (const nPop of [20, 100, 1000]) {
  const kRed = Math.round(0.3 * nPop)
  const tv = toJS(await wl\`N[1/2 * Sum[Abs[
    Binomial[\${kRed}, k]*Binomial[\${nPop - kRed}, 10 - k]/Binomial[\${nPop}, 10]
    - Binomial[10, k]*(3/10)^k*(7/10)^(10 - k)], {k, 0, 10}]]\`)
  console.log(\`N = \${String(nPop).padStart(4)}: exact TV distance = \${tv.toFixed(4)}\`)
}`,

  ch03: `// Chapter 3: Symbolic Poisson-Gamma -> Negative Binomial predictive & numerical Beta(3,9) HPD
const { Times, Divide, Power, Exp, Minus, Subtract, Gamma, Factorial, th, yt, an, bn } = W
const pois = Divide(Times(Power(th, yt), Exp(Minus(th))), Factorial(yt))
const gam = Times(Divide(Power(bn, an), Gamma(an)), Power(th, Subtract(an, 1)), Exp(Times(-1, bn, th)))
const pred = await show\`Assuming[an > 0 && bn > 0 && yt >= 0 && Element[yt, Integers],
  FullSimplify[Integrate[\${pois} * \${gam}, {th, 0, Infinity}]]]\`
const predMean = await show\`Assuming[an > 0 && bn > 0, FullSimplify[Sum[yt * \${pred}, {yt, 0, Infinity}]]]\`
await show\`Assuming[an > 0 && bn > 0,
  FullSimplify[Sum[yt^2 * \${pred}, {yt, 0, Infinity}] - (\${predMean})^2]]\`

// Instantiate GSS no-degree group (an = 219, bn = 112) and compare with Python
const pmf = toJS(await wl\`N[Table[\${pred} /. {an -> 219, bn -> 112}, {yt, 0, 5}]]\`)
console.log('GSS pred PMF (y=0..5):', pmf.map(v => v.toFixed(3)).join(', '))

// Numerical 95% HPD interval for Beta(3, 9) via FindRoot
const hpd = toJS(await wl\`{l, u} /. FindRoot[{
  l^2 (1 - l)^8 == u^2 (1 - u)^8,
  Integrate[t^2 (1 - t)^8 / Beta[3, 9], {t, l, u}] == 95/100}, {{l, 0.04}, {u, 0.48}}]\`)
console.log(\`Beta(3,9) 95% HPD = [\${hpd[0].toFixed(4)}, \${hpd[1].toFixed(4)}], width = \${(hpd[1] - hpd[0]).toFixed(4)}\`)`,

  ch04: `// Chapter 4: Symbolic log-odds push-forward density, gamma-ratio moments & exact benchmark
const thOfG = await wl\`th /. First[Solve[Log[th / (1 - th)] == g, th, Reals]]\`
const jac = await wl\`FullSimplify[D[\${thOfG}, g], Element[g, Reals]]\`
await show\`FullSimplify[(\${thOfG}^(a - 1)*(1 - \${thOfG})^(b - 1)/Beta[a, b]) * \${jac}, Element[g, Reals]]\`

// Exact moments of ratio R = th1 / th2 for independent Gamma(a1,b1), Gamma(a2,b2)
const eR = await show\`Assuming[a1 > 0 && b1 > 0 && a2 > 1 && b2 > 0,
  FullSimplify[(a1/b1)*Integrate[(b2^a2/Gamma[a2])*t^(a2 - 2)*Exp[-b2*t], {t, 0, Infinity}]]]\`
await show\`Assuming[a1 > 0 && b1 > 0 && a2 > 2 && b2 > 0,
  FullSimplify[(a1*(a1 + 1)/b1^2)*Integrate[(b2^a2/Gamma[a2])*t^(a2 - 3)*Exp[-b2*t], {t, 0, Infinity}] - (\${eR})^2]]\`

// Exact incomplete-Beta benchmark for Pr(th1 > th2 | y) (Gamma(219,112) vs Gamma(68,45))
const pGt = toJS(await wl\`N[1 - Beta[112/157, 219, 68] / Beta[219, 68]]\`)
const pLt175 = toJS(await wl\`N[1 - Gamma[68, 45 * 7/4] / Gamma[68]]\`)
console.log(\`Exact Pr(th1 > th2 | y) = \${pGt.toFixed(4)}  |  Exact Pr(th2 < 1.75 | y) = \${pLt175.toFixed(4)}\`)`,

  ch05: `// Chapter 5: Symbolic Normal-IG -> Student-t marginalization & exact MSE inequality
const marg = await show\`Assuming[nun > 0 && rate > 0,
  FullSimplify[Integrate[p^((nun + 1)/2 - 1)*Exp[-rate*p/2], {p, 0, Infinity}]]] /. rate -> nun*s2n + kn*(th - mun)^2\`
const tKer = await wl\`(1 + kn*(th - mun)^2 / (nun*s2n))^(-(nun + 1)/2)\`
const ratioSlope = toJS(await wl\`Assuming[kn > 0 && nun > 0 && s2n > 0 && Element[{th, mun}, Reals],
  FullSimplify[D[Log[\${marg} / \${tKer}], th]]]\`)
console.log('d/dth log(marginal / Student-t kernel) =', ratioSlope)

// Scaled MSE difference (n + k0)^2 * (MSE(theta_b) - MSE(ybar))
const { Plus, Times, Power, Divide, Subtract, n, k0, s2, mu0, th0 } = W
const mseB = Plus(
  Times(Power(Divide(n, Plus(n, k0)), 2), Divide(s2, n)),
  Times(Power(Divide(k0, Plus(n, k0)), 2), Power(Subtract(mu0, th0), 2))
)
await show\`Factor[Together[(\${mseB} - s2/n) * (n + k0)^2]]\`

// Instantiate on Hoff's midge wing lengths (n = 9) and verify exact t_10 95% CI
const y = [1.64, 1.70, 1.72, 1.74, 1.82, 1.82, 1.82, 1.90, 2.08]
const mun = toJS(await wl\`N[(19/10 + Total[\${y}]) / 10]\`)
const s2n = toJS(await wl\`N[(1/100 + 8*Variance[\${y}] + (9/10)*(Mean[\${y}] - 19/10)^2) / 10]\`)
const tCrit = toJS(await wl\`t /. FindRoot[
  Integrate[(1 + u^2/10)^(-11/2) / (Sqrt[10]*Beta[1/2, 5]), {u, -t, t}] == 95/100, {t, 2.2}]\`)
const lo = mun - tCrit * Math.sqrt(s2n / 10), hi = mun + tCrit * Math.sqrt(s2n / 10)
console.log(\`Midge exact: mu_n = \${mun.toFixed(4)}, s2_n = \${s2n.toFixed(5)}, 95% CI = [\${lo.toFixed(4)}, \${hi.toFixed(4)}]\`)`,

  ch06: `// Chapter 6: Symbolic bivariate-normal Gibbs lag-k ACF and exact ESS ratio
const transMean = await show\`Assuming[v > 0 && Element[m, Reals],
  Simplify[Integrate[rho*(m + Sqrt[v]*z)*Exp[-z^2/2]/Sqrt[2*Pi], {z, -Infinity, Infinity}]]] /. {m -> rho*x, v -> 1 - rho^2}\`
const alpha = await wl\`D[\${transMean}, x]\`   // AR(1) lag-1 contraction coefficient = rho^2
await show\`Simplify[(v + Integrate[(rho*Sqrt[v]*z)^2*Exp[-z^2/2]/Sqrt[2*Pi], {z, -Infinity, Infinity}]) /. v -> 1 - rho^2]\`
const tauInt = await show\`Assuming[-1 < rho < 1, Together[Sum[2*(\${alpha})^k, {k, 1, Infinity}] + 1]]\`
const essRatio = await show\`Together[1 / \${tauInt}]\`

// Instantiate at rho = 99/100, S = 10,000
const ess99 = toJS(await wl\`N[10000 * (\${essRatio} /. rho -> 99/100)]\`)
console.log(\`At rho = 0.99, S = 10,000 -> exact S_eff = \${ess99.toFixed(2)}\`)`,

  ch07: `// Chapter 7: Symbolic Schur complement, precision matrix Omega, and partial regression identity
const Sig = [[W.s11, W.s12, W.s13], [W.s12, W.s22, W.s23], [W.s13, W.s23, W.s33]]
const betaSchur = await show\`FullSimplify[Inverse[{{s22, s23}, {s23, s33}}] . {s12, s13}]\`
const betaPrec = await wl\`FullSimplify[-Inverse[\${Sig}][[1, {2, 3}]] / Inverse[\${Sig}][[1, 1]]]\`
await show\`FullSimplify[\${betaSchur} - \${betaPrec}]\`

// Instantiate on Hoff's reading-comprehension covariance (s1^2=182.16, s2^2=243.65, r=0.70)
const cov2 = [[182.16, 147.45], [147.45, 243.65]]
const slope = toJS(await wl\`N[\${cov2}[[1, 2]] / \${cov2}[[1, 1]]]\`)
const condVar = toJS(await wl\`N[\${cov2}[[2, 2]] - \${cov2}[[1, 2]]^2 / \${cov2}[[1, 1]]]\`)
console.log(\`Reading scores: E[Y2 | Y1] slope = \${slope.toFixed(4)}, cond SD = \${Math.sqrt(condVar).toFixed(2)}\`)`,

  ch08: `// Chapter 8: Symbolic two-group correlation, shrinkage weight, and sigma_0^2 full conditional
// 1. Derive Corr(theta_1, theta_2) from (theta_1, theta_2) = (mu + delta, mu - delta)
const A = [[1, 1], [1, -1]]
const cov2 = await wl\`\${A} . DiagonalMatrix[{g0^2, t0^2}] . Transpose[\${A}]\`
await show\`Together[\${cov2}[[1, 2]] / \${cov2}[[1, 1]]]\`

// 2. Shrinkage weight B_j and non-circular derivation of sigma_0^2 shape & rate (m = 3)
const Bj = await show\`Together[(nj / s2) / (nj / s2 + 1 / t2)]\`
const logp = await wl\`(a - 1)*Log[s0] - b*s0 + Sum[nu0/2*Log[nu0*s0/2] - LogGamma[nu0/2]
  + (nu0/2 - 1)*Log[x] - nu0*s0*x/2, {x, {x1, x2, x3}}]\`
const dLogp = await wl\`Expand[D[\${logp}, s0]]\`
await show\`Simplify[1 + Coefficient[\${dLogp}, s0, -1]]\`   // shape: a + 3*nu0/2
await show\`Simplify[-Coefficient[\${dLogp}, s0, 0]]\`       // rate:  b + nu0*(x1+x2+x3)/2

// 3. Plug-in shrinkage at (mu, tau, sigma) = (48.1, 5.0, 9.2) for School 46 vs. School 82
for (const [label, nj, yb] of [['School 46', 21, 40.18], ['School 82', 5, 38.76]]) {
  const w = toJS(await wl\`N[\${Bj} /. {nj -> \${nj}, t2 -> 25, s2 -> 84.64}]\`)
  const plugMean = w * yb + (1 - w) * 48.1
  console.log(\`\${label} (n=\${nj}, ybar=\${yb.toFixed(2)}): B_j = \${w.toFixed(3)}, plug-in mean = \${plugMean.toFixed(2)}\`)
}`,

  ch09: `// Chapter 9: Symbolic g-prior marginal likelihood, paradox limits & exact Table 9.1
const margZ = await show\`Assuming[nu0 > 0 && s20 > 0 && ssr > 0 && g > 0 && n > 0,
  FullSimplify[Integrate[(1 + g)^(-pz/2)*(2*Pi)^(-n/2)*((nu0*s20/2)^(nu0/2)/Gamma[nu0/2])
    *gam^((nu0 + n)/2 - 1)*Exp[-gam*(nu0*s20 + ssr)/2], {gam, 0, Infinity}]]]\`
const bf = await wl\`FullSimplify[
  (\${margZ} /. {pz -> p1, ssr -> (g/(g+1))*r1 + (1/(g+1))*yy}) / (\${margZ} /. {pz -> 0, ssr -> yy})]\`
const lindley = toJS(await wl\`Assuming[p1 > 0 && nu0 > 0 && s20 > 0 && yy > 0 && r1 > 0 && n > 0,
  Limit[\${bf}, g -> Infinity]]\`)
console.log('Lindley limit (g -> Infinity): BF =', lindley)
// Information-paradox supremum (attained in the limit r1 -> 0, s20 -> 0)
await show\`Assuming[p1 > 0 && g > 0 && nu0 > 0 && yy > 0 && n > 0,
  FullSimplify[Limit[\${bf} /. s20 -> 0, r1 -> 0]]]\`

// Instantiate margZ directly on Hoff's Oxygen uptake Table 9.1 (g = n = 12, nu0 = 1, s20 = s_z^2)
const age = [23, 22, 22, 25, 27, 20, 31, 23, 27, 28, 22, 24]
const grp = [0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1]
const y = [-0.87, -10.74, -3.27, -1.97, 7.50, -7.25, 17.05, 4.96, 10.40, 11.05, 0.26, 2.51]
const Xfull = age.map((a, i) => [1, grp[i], a, grp[i] * a])
const logMargs = []
for (const cols of [[0], [0, 1], [0, 2], [0, 1, 2], [0, 1, 2, 3]]) {
  const Xz = Xfull.map(row => cols.map(c => row[c]))
  const pz = cols.length
  const bOls = await wl\`LinearSolve[Transpose[\${Xz}].\${Xz}, Transpose[\${Xz}].\${y}]\`
  const s2z = await wl\`Total[(\${y} - \${Xz}.\${bOls})^2] / (12 - \${pz})\`
  const ssrG = await wl\`\${y}.\${y} - (12/13)*(\${y}.\${Xz}.\${bOls})\`
  logMargs.push(toJS(await wl\`N[Log[\${margZ} /. {n -> 12, g -> 12, nu0 -> 1, pz -> \${pz}, s20 -> \${s2z}, ssr -> \${ssrG}}]]\`))
}
const maxLm = Math.max(...logMargs)
const ws = logMargs.map(v => Math.exp(v - maxLm))
const sumW = ws.reduce((a, b) => a + b, 0)
console.log('Oxygen Table 9.1 log p(y|X,z):', logMargs.map(v => v.toFixed(2)).join(', '))
console.log('Oxygen Table 9.1 posterior p(z|y,X):', ws.map(v => (v / sumW).toFixed(2)).join(', '))`,

  ch10: `// Chapter 10: Symbolic Metropolis acceptance rate & closed-form AR(1) precision matrix
const accRate = await show\`Assuming[ell > 0,
  FullSimplify[Integrate[Erfc[Abs[ell*w]/(2*Sqrt[2])]*Exp[-w^2/2]/Sqrt[2*Pi], {w, -Infinity, Infinity}]]]\`

// Verify AR(1) determinant and tridiagonal precision matrix symbolically for n = 5
await show\`Factor[Det[Table[rho^Abs[i - j], {i, 5}, {j, 5}]]]\`
await show\`Simplify[(1 - rho^2) * Inverse[Table[rho^Abs[i - j], {i, 5}, {j, 5}]]]\`

// Instantiate acceptance rate on Hoff's 5-point normal target (tau^2 = 1/5.1)
for (const [label, num, den] of [['1/32', 1, 32], ['2', 2, 1], ['64', 64, 1]]) {
  const rate = toJS(await wl\`N[\${accRate} /. ell -> Sqrt[(\${num}/\${den}) * 51/10]]\`)
  console.log(\`delta^2 = \${label.padStart(4)} -> exact acceptance rate = \${rate.toFixed(3)}\`)
}`,

  ch11: `// Chapter 11: Symbolic Poisson GLMM population-average vs. median rate & LME shrinkage
const popAvg = await show\`Assuming[v > 0 && Element[m, Reals],
  FullSimplify[Integrate[Exp[m + Sqrt[v]*z]*Exp[-z^2/2]/Sqrt[2*Pi], {z, -Infinity, Infinity}]]]\`
await show\`FullSimplify[\${popAvg} / Exp[m]]\`

// Symbolic 2x2 LME conditional posterior variance V_j for centered x (X_j^T X_j = diag(nj, sxx))
const Vj = await wl\`FullSimplify[Inverse[Inverse[{{s11, s12}, {s12, s22}}] + DiagonalMatrix[{nj, sxx}]/sig2]]\`
const v22Sym = await show\`FullSimplify[\${Vj}[[2, 2]]]\`

// Instantiate conditional slope SD at Sigma = [[20, 2], [2, 1.5]], sig2 = 64, E[sxx] = nj - 1
for (const nj of [5, 24]) {
  const v22 = toJS(await wl\`N[\${v22Sym} /. {s11 -> 20, s12 -> 2, s22 -> 3/2, sig2 -> 64, nj -> \${nj}, sxx -> \${nj - 1}}]\`)
  console.log(\`n_j = \${String(nj).padStart(2)} (sxx = \${nj - 1}) -> cond. slope SD = \${Math.sqrt(v22).toFixed(3)} (prior SD = \${Math.sqrt(1.5).toFixed(3)})\`)
}`,

  ch12: `// Chapter 12: Symbolic ordered-probit invariance & latent Gaussian graphical model
const invResid = toJS(await wl\`Assuming[a > 0, Simplify[
  1/2*Erfc[-((a*g + c) - (a*eta + c))/(a*Sqrt[2])] - 1/2*Erfc[-(g - eta)/Sqrt[2]]]]\`)
console.log('Ordered-probit shift/scale invariance residual =', invResid)

// Latent conditional independence Z1 _|_ Z3 | Z2 iff (C^(-1))_{1,3} == 0
const C3 = [[1, W.r12, W.r13], [W.r12, 1, W.r23], [W.r13, W.r23, 1]]
const omega13 = await show\`Factor[Inverse[\${C3}][[1, 3]]]\`
const solR13 = await show\`r13 /. First[Solve[\${omega13} == 0, r13]]\`

// Contrast exact conditional independence (r13 = 13/40 = 0.325) vs. Ch. 12 Python (r13 = 3/10 = 0.30)
const omZero = toJS(await wl\`\${omega13} /. {r12 -> 13/20, r23 -> 1/2, r13 -> 13/40}\`)
const omPy = toJS(await wl\`N[\${omega13} /. {r12 -> 13/20, r23 -> 1/2, r13 -> 3/10}]\`)
console.log(\`At (r12, r23) = (0.65, 0.50): Omega_13(0.325) = \${omZero},  Omega_13(0.30) = \${omPy.toFixed(4)}\`)`,
}
