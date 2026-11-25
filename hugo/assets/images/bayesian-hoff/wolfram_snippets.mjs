// All 12 fully symbolic + numeric instantiation snippets in wolfram-ws-bridge JS mode
// for "Bayesian Statistical Methods" (Companion to Hoff 2009).
// Every symbolic derivation and numerical instantiation uses `await show` (zero console.log).

export const SNIPPETS = {
  ch01: `// Chapter 1: Symbolic Beta-Binomial posterior, variance, CDF, and numeric check
const { Times, Power, Plus, Subtract, Minus, th, a, b, n, y } = W
const kernel = Times(
  Power(th, Plus(a, y, -1)),
  Power(Subtract(1, th), Plus(b, n, Minus(y), -1))
)
const Z = await show\`Assuming[a > 0 && b > 0 && y >= 0 && n >= y,
  FullSimplify[Integrate[\${kernel}, {th, 0, 1}]]]\`
const mean = await show\`Assuming[a > 0 && b > 0 && y >= 0 && n >= y,
  FullSimplify[Integrate[th * \${kernel}, {th, 0, 1}] / \${Z}]]\`
const postVar = await show\`Assuming[a > 0 && b > 0 && y >= 0 && n >= y,
  FullSimplify[Integrate[th^2 * \${kernel}, {th, 0, 1}] / \${Z} - (\${mean})^2]]\`
// Posterior mode (valid when a + y > 1 and b + n - y > 1) and symbolic CDF Pr(th < c | y)
await show\`FullSimplify[th /. First[Solve[D[Log[\${kernel}], th] == 0, th]]]\`
const cdfSym = await show\`Assuming[al > 0 && be > 0 && 0 < c < 1,
  FullSimplify[Integrate[th^(al - 1)*(1 - th)^(be - 1), {th, 0, c}] / Beta[al, be]]] /. {al -> a + y, be -> b + n - y}\`
await show\`Simplify[\${mean} - (n/(n + w)*(y/n) + w/(n + w)*(a/w)) /. w -> a + b]\`
// Instantiate symbolic mean & CDF at n = 20, y = 0, c = 1/10 for Uniform (1,1), Epi (2,20), Strong wrong (10,10)
await show\`N[Table[{\${mean}, \${cdfSym}} /. {a -> p[[1]], b -> p[[2]], n -> 20, y -> 0, c -> 1/10}, {p, {{1, 1}, {2, 20}, {10, 10}}}]]\``,

  ch02: `// Chapter 2: Symbolic Bayes' rule, Bayes factor, and finite-population covariance & variance
const post = await show\`Simplify[(s * p0) / (s * p0 + f * (1 - p0))]\`
await show\`Simplify[((\${post} / (1 - \${post})) / (p0 / (1 - p0)))]\`
// Finite-population without-replacement covariance Cov(Y1, Y2) < 0 and sample-sum variance
const covF = await show\`FullSimplify[(kRed/nPop)*((kRed - 1)/(nPop - 1)) - (kRed/nPop)^2]\`
const varHyper = await show\`FullSimplify[n*(kRed/nPop)*(1 - kRed/nPop) + n*(n - 1)*(\${covF})]\`
await show\`Limit[\${covF} /. kRed -> th * nPop, nPop -> Infinity]\`
// Instantiate screening example (p0 = 1/100, s = 95/100, f = 5/100) & Diaconis-Freedman TV (N = 20, 100, 1000)
const pExact = await show\`\${post} /. {p0 -> 1/100, s -> 95/100, f -> 5/100}\`
await show\`N[\${pExact}]\`
await show\`N[Table[1/2 * Sum[Abs[
  Binomial[3*nPop/10, k]*Binomial[7*nPop/10, 10 - k]/Binomial[nPop, 10]
  - Binomial[10, k]*(3/10)^k*(7/10)^(10 - k)], {k, 0, 10}], {nPop, {20, 100, 1000}}]]\``,

  ch03: `// Chapter 3: Symbolic Poisson-Gamma predictive & general Beta(a,b) HPD integral
const { Times, Divide, Power, Exp, Minus, Subtract, Gamma, Factorial, th, yt, an, bn } = W
const pois = Divide(Times(Power(th, yt), Exp(Minus(th))), Factorial(yt))
const gam = Times(Divide(Power(bn, an), Gamma(an)), Power(th, Subtract(an, 1)), Exp(Times(-1, bn, th)))
const pred = await show\`Assuming[an > 0 && bn > 0 && yt >= 0 && Element[yt, Integers],
  FullSimplify[Integrate[\${pois} * \${gam}, {th, 0, Infinity}]]]\`
const predMean = await show\`Assuming[an > 0 && bn > 0, FullSimplify[Sum[yt * \${pred}, {yt, 0, Infinity}]]]\`
await show\`Assuming[an > 0 && bn > 0,
  FullSimplify[Sum[yt^2 * \${pred}, {yt, 0, Infinity}] - (\${predMean})^2]]\`
// Symbolic interval probability Int_l^u Beta(a, b) for general HPD system
const betaMass = await show\`Assuming[a > 0 && b > 0 && 0 < l < u < 1,
  FullSimplify[Integrate[t^(a - 1)*(1 - t)^(b - 1) / Beta[a, b], {t, l, u}]]]\`
// Instantiate GSS no-degree group (an = 219, bn = 112) and Beta(3, 9) 95% HPD
await show\`N[Table[\${pred} /. {an -> 219, bn -> 112}, {yt, 0, 5}]]\`
await show\`{l, u, u - l} /. FindRoot[{
  l^(a - 1)*(1 - l)^(b - 1) == u^(a - 1)*(1 - u)^(b - 1),
  (\${betaMass}) == 95/100} /. {a -> 3, b -> 9}, {{l, 0.04}, {u, 0.48}}]\``,

  ch04: `// Chapter 4: Symbolic log-odds density, Gamma-ratio moments & symbolic Gamma tail probabilities
const thOfG = await wl\`th /. First[Solve[Log[th / (1 - th)] == g, th, Reals]]\`
const jac = await wl\`FullSimplify[D[\${thOfG}, g], Element[g, Reals]]\`
await show\`FullSimplify[(\${thOfG}^(a - 1)*(1 - \${thOfG})^(b - 1)/Beta[a, b]) * \${jac}, Element[g, Reals]]\`
// Exact symbolic moments of ratio R = th1 / th2 for independent Gamma(a1,b1), Gamma(a2,b2)
const eR = await show\`Assuming[a1 > 0 && b1 > 0 && a2 > 1 && b2 > 0,
  FullSimplify[(a1/b1)*Integrate[(b2^a2/Gamma[a2])*t^(a2 - 2)*Exp[-b2*t], {t, 0, Infinity}]]]\`
await show\`Assuming[a1 > 0 && b1 > 0 && a2 > 2 && b2 > 0,
  FullSimplify[(a1*(a1 + 1)/b1^2)*Integrate[(b2^a2/Gamma[a2])*t^(a2 - 3)*Exp[-b2*t], {t, 0, Infinity}] - (\${eR})^2]]\`
// Symbolic Gamma CDF Pr(th < c) and general Beta-representation of Pr(th1 > th2)
const gamCdf = await show\`Assuming[a2 > 0 && b2 > 0 && c > 0,
  FullSimplify[Integrate[(b2^a2/Gamma[a2])*t^(a2 - 1)*Exp[-b2*t], {t, 0, c}]]]\`
const pGtSym = await show\`1 - Beta[b1 / (b1 + b2), a1, a2] / Beta[a1, a2]\`
// Instantiate at GSS fertility posteriors Gamma(219,112) vs Gamma(68,45) and c = 7/4
await show\`N[{\${pGtSym} /. {a1 -> 219, b1 -> 112, a2 -> 68, b2 -> 45}, \${gamCdf} /. {a2 -> 68, b2 -> 45, c -> 7/4}}]\``,

  ch05: `// Chapter 5: Symbolic Normal-IG -> Student-t marginal, variance & exact MSE inequality
const marg = await show\`Assuming[nun > 0 && rate > 0,
  FullSimplify[Integrate[p^((nun + 1)/2 - 1)*Exp[-rate*p/2], {p, 0, Infinity}]]] /. rate -> nun*s2n + kn*(th - mun)^2\`
const tKer = await wl\`(1 + kn*(th - mun)^2 / (nun*s2n))^(-(nun + 1)/2)\`
await show\`Assuming[kn > 0 && nun > 0 && s2n > 0 && Element[{th, mun}, Reals],
  FullSimplify[D[Log[\${marg} / \${tKer}], th]]]\`
// Symbolic Student-t variance Var[theta | y] = (nun / (nun - 2)) * (s2n / kn) for nun > 2
const tVar = await show\`Assuming[nun > 2 && kn > 0 && s2n > 0,
  FullSimplify[(s2n/kn) * Integrate[u^2*(1 + u^2/nun)^(-(nun + 1)/2) / (Sqrt[nun]*Beta[1/2, nun/2]), {u, -Infinity, Infinity}]]]\`
// Scaled MSE difference (n + k0)^2 * (MSE(theta_b) - MSE(ybar))
const { Plus, Times, Power, Divide, Subtract, n, k0, s2, mu0, th0 } = W
const mseB = Plus(
  Times(Power(Divide(n, Plus(n, k0)), 2), Divide(s2, n)),
  Times(Power(Divide(k0, Plus(n, k0)), 2), Power(Subtract(mu0, th0), 2))
)
await show\`Factor[Together[(\${mseB} - s2/n) * (n + k0)^2]]\`
// Instantiate symbolic formulas on Hoff's midge wing lengths (n = 9)
const y = [1.64, 1.70, 1.72, 1.74, 1.82, 1.82, 1.82, 1.90, 2.08]
const mun = await wl\`N[(19/10 + Total[\${y}]) / 10]\`
const s2n = await wl\`N[(1/100 + 8*Variance[\${y}] + (9/10)*(Mean[\${y}] - 19/10)^2) / 10]\`
const tCrit = await wl\`t /. FindRoot[1 - Beta[10/(10 + t^2), 5, 1/2]/Beta[5, 1/2] == 95/100, {t, 2.2}]\`
await show\`N[{\${mun}, \${s2n}, Sqrt[\${tVar} /. {nun -> 10, kn -> 10, s2n -> \${s2n}}], \${mun} - \${tCrit}*Sqrt[\${s2n}/10], \${mun} + \${tCrit}*Sqrt[\${s2n}/10]}]\``,

  ch06: `// Chapter 6: Symbolic bivariate-normal Gibbs transition, ACF, ESS & O(1) sum-of-squares identity
const transMean = await show\`Assuming[v > 0 && Element[m, Reals],
  Simplify[Integrate[rho*(m + Sqrt[v]*z)*Exp[-z^2/2]/Sqrt[2*Pi], {z, -Infinity, Infinity}]]] /. {m -> rho*x, v -> 1 - rho^2}\`
const alpha = await wl\`D[\${transMean}, x]\`   // AR(1) lag-1 contraction coefficient = rho^2
await show\`Simplify[(v + Integrate[(rho*Sqrt[v]*z)^2*Exp[-z^2/2]/Sqrt[2*Pi], {z, -Infinity, Infinity}]) /. v -> 1 - rho^2]\`
const tauInt = await show\`Assuming[-1 < rho < 1, Together[Sum[2*(\${alpha})^k, {k, 1, Infinity}] + 1]]\`
const essRatio = await show\`Together[1 / \${tauInt}]\`
// Symbolic verification of the O(1) Gibbs sum-of-squares decomposition (n = 3)
await show\`Expand[Sum[(y[i] - th)^2, {i, 3}]
  - (Sum[(y[i] - (y[1] + y[2] + y[3])/3)^2, {i, 3}] + 3*((y[1] + y[2] + y[3])/3 - th)^2)]\`
// Instantiate exact S_eff at rho = 99/100, S = 10,000
await show\`N[10000 * (\${essRatio} /. rho -> 99/100)]\``,

  ch07: `// Chapter 7: Symbolic 3x3 Schur-precision identity & symbolic 2x2 conditional normal
const Sig = [[W.s11, W.s12, W.s13], [W.s12, W.s22, W.s23], [W.s13, W.s23, W.s33]]
const betaSchur = await show\`FullSimplify[Inverse[{{s22, s23}, {s23, s33}}] . {s12, s13}]\`
const betaPrec = await wl\`FullSimplify[-Inverse[\${Sig}][[1, {2, 3}]] / Inverse[\${Sig}][[1, 1]]]\`
await show\`FullSimplify[\${betaSchur} - \${betaPrec}]\`
// Abstract 2x2 covariance {{s1^2, rho*s1*s2}, {rho*s1*s2, s2^2}}: symbolic slope & cond. variance
const covSym = [[W.Power(W.s1, 2), W.Times(W.rho, W.s1, W.s2)], [W.Times(W.rho, W.s1, W.s2), W.Power(W.s2, 2)]]
const slopeSym = await show\`FullSimplify[\${covSym}[[1, 2]] / \${covSym}[[1, 1]]]\`
const cvarSym = await show\`FullSimplify[\${covSym}[[2, 2]] - \${covSym}[[1, 2]]^2 / \${covSym}[[1, 1]]]\`
// Instantiate on Hoff's reading-comprehension covariance (s1^2 = 182.16, s2^2 = 243.65, cov = 147.45)
await show\`N[{\${slopeSym}, Sqrt[\${cvarSym}]} /. {s1 -> Sqrt[182.16], s2 -> Sqrt[243.65], rho -> 147.45/Sqrt[182.16*243.65]}]\``,

  ch08: `// Chapter 8: Symbolic two-group correlation, ranking-reversal condition & sigma_0^2 full conditional
const A = [[1, 1], [1, -1]]
const cov2 = await wl\`\${A} . DiagonalMatrix[{g0^2, t0^2}] . Transpose[\${A}]\`
await show\`Together[\${cov2}[[1, 2]] / \${cov2}[[1, 1]]]\`
// Shrinkage weight B_j and symbolic shrunk-mean gap thetaHat_2 - thetaHat_1
const Bj = await show\`Together[(nj / s2) / (nj / s2 + 1 / t2)]\`
const gapSym = await show\`FullSimplify[((\${Bj} /. nj -> n2)*yb2 + (1 - (\${Bj} /. nj -> n2))*mu)
  - ((\${Bj} /. nj -> n1)*yb1 + (1 - (\${Bj} /. nj -> n1))*mu)]\`
// Non-circular derivation of sigma_0^2 full conditional shape & rate (m = 3)
const logp = await wl\`(a - 1)*Log[s0] - b*s0 + Sum[nu0/2*Log[nu0*s0/2] - LogGamma[nu0/2]
  + (nu0/2 - 1)*Log[x] - nu0*s0*x/2, {x, {x1, x2, x3}}]\`
const dLogp = await wl\`Expand[D[\${logp}, s0]]\`
await show\`Simplify[1 + Coefficient[\${dLogp}, s0, -1]]\`
await show\`Simplify[-Coefficient[\${dLogp}, s0, 0]]\`
// Instantiate plug-in shrinkage on School 46 (n1=21, yb1=40.18) vs School 82 (n2=5, yb2=38.76)
await show\`N[Table[{w, w*p[[2]] + (1 - w)*48.1} /. w -> (\${Bj} /. {nj -> p[[1]], t2 -> 25, s2 -> 84.64}), {p, {{21, 40.18}, {5, 38.76}}}]]\`
await show\`N[\${gapSym} /. {n1 -> 21, yb1 -> 40.18, n2 -> 5, yb2 -> 38.76, mu -> 48.1, t2 -> 25, s2 -> 84.64}]\``,

  ch09: `// Chapter 9: Symbolic g-prior marginal likelihood, general Bayes factor & exact Table 9.1
const margZ = await show\`Assuming[nu0 > 0 && s20 > 0 && ssr > 0 && g > 0 && n > 0,
  FullSimplify[Integrate[(1 + g)^(-pz/2)*(2*Pi)^(-n/2)*((nu0*s20/2)^(nu0/2)/Gamma[nu0/2])
    *gam^((nu0 + n)/2 - 1)*Exp[-gam*(nu0*s20 + ssr)/2], {gam, 0, Infinity}]]]\`
// General symbolic Bayes factor BF_{a,b} retaining model-specific s20_a, s20_b
await show\`Assuming[nu0 > 0 && sa > 0 && sb > 0 && ssra > 0 && ssrb > 0 && g > 0 && n > 0,
  FullSimplify[(\${margZ} /. {pz -> pa, s20 -> sa, ssr -> ssra}) / (\${margZ} /. {pz -> pb, s20 -> sb, ssr -> ssrb})]]\`
const bf = await wl\`FullSimplify[
  (\${margZ} /. {pz -> p1, ssr -> (g/(g+1))*r1 + (1/(g+1))*yy}) / (\${margZ} /. {pz -> 0, ssr -> yy})]\`
await show\`Assuming[p1 > 0 && nu0 > 0 && s20 > 0 && yy > 0 && r1 > 0 && n > 0, Limit[\${bf}, g -> Infinity]]\`
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
await show\`N[\${logMargs}]\`
await show\`N[Exp[\${logMargs} - Max[\${logMargs}]] / Total[Exp[\${logMargs} - Max[\${logMargs}]]]]\``,

  ch10: `// Chapter 10: Symbolic Metropolis acceptance rate (general normal posterior) & AR(1) precision
const accRate = await show\`Assuming[ell > 0,
  FullSimplify[Integrate[Erfc[Abs[ell*w]/(2*Sqrt[2])]*Exp[-w^2/2]/Sqrt[2*Pi], {w, -Infinity, Infinity}]]]\`
// Abstract the normal-target example: ell = delta / tau_n with 1/tau_n^2 = n/s2 + 1/t0^2
const accNormal = await show\`Assuming[d > 0 && n > 0 && s2 > 0 && t0 > 0,
  FullSimplify[\${accRate} /. ell -> d * Sqrt[n/s2 + 1/t0^2]]]\`
// Verify AR(1) determinant and tridiagonal precision matrix symbolically for n = 5
await show\`Factor[Det[Table[rho^Abs[i - j], {i, 5}, {j, 5}]]]\`
await show\`Simplify[(1 - rho^2) * Inverse[Table[rho^Abs[i - j], {i, 5}, {j, 5}]]]\`
// Instantiate symbolic accNormal on Hoff's 5-point normal target (n = 5, s2 = 1, t0^2 = 10; delta^2 in {1/32, 2, 64})
await show\`N[Table[\${accNormal} /. {n -> 5, s2 -> 1, t0 -> Sqrt[10], d -> Sqrt[d2]}, {d2, {1/32, 2, 64}}]]\``,

  ch11: `// Chapter 11: Symbolic Poisson GLMM rate ratio & symbolic LME intercept/slope shrinkage
const popAvg = await show\`Assuming[v > 0 && Element[m, Reals],
  FullSimplify[Integrate[Exp[m + Sqrt[v]*z]*Exp[-z^2/2]/Sqrt[2*Pi], {z, -Infinity, Infinity}]]]\`
await show\`FullSimplify[\${popAvg} / Exp[m]]\`
// Symbolic 2x2 LME posterior covariance V_j and diagonal-Sigma shrinkage mean m_j
const Vj = await wl\`FullSimplify[Inverse[Inverse[{{s11, s12}, {s12, s22}}] + DiagonalMatrix[{nj, sxx}]/sig2]]\`
const v22Sym = await show\`FullSimplify[\${Vj}[[2, 2]]]\`
await show\`FullSimplify[Inverse[DiagonalMatrix[{1/t1^2, 1/t2^2}] + DiagonalMatrix[{nj, sxx}]/sig2] . {th1/t1^2 + nj*yb/sig2, th2/t2^2 + sxx*b2ols/sig2}]\`
// Instantiate conditional slope SD at Sigma = [[20, 2], [2, 1.5]], sig2 = 64, E[sxx] = nj - 1 (nj in {5, 24})
await show\`N[Table[Sqrt[\${v22Sym} /. {s11 -> 20, s12 -> 2, s22 -> 3/2, sig2 -> 64, nj -> nVal, sxx -> nVal - 1}], {nVal, {5, 24}}]]\``,

  ch12: `// Chapter 12: Symbolic ordered-probit invariance & 3-variable Gaussian copula partial correlation
await show\`Assuming[a > 0, Simplify[
  1/2*Erfc[-((a*g + c) - (a*eta + c))/(a*Sqrt[2])] - 1/2*Erfc[-(g - eta)/Sqrt[2]]]]\`
// Latent precision Omega_{1,3}, partial correlation rho_{13|2}, and conditional-independence condition
const C3 = [[1, W.r12, W.r13], [W.r12, 1, W.r23], [W.r13, W.r23, 1]]
const Om = await wl\`Inverse[\${C3}]\`
const omega13 = await show\`Factor[\${Om}[[1, 3]]]\`
const pcorr13 = await show\`Assuming[-1 < r12 < 1 && -1 < r23 < 1,
  FullSimplify[-\${Om}[[1, 3]] / Sqrt[\${Om}[[1, 1]] * \${Om}[[3, 3]]]]]\`
await show\`r13 /. First[Solve[\${omega13} == 0, r13]]\`
// Instantiate at (r12, r23) = (0.65, 0.50): r13 = 0.325 (exact CI) vs. Ch. 12 Python (r13 = 0.30)
await show\`{\${omega13} /. {r12 -> 13/20, r23 -> 1/2, r13 -> 13/40},
  N[\${omega13} /. {r12 -> 13/20, r23 -> 1/2, r13 -> 3/10}],
  N[\${pcorr13} /. {r12 -> 13/20, r23 -> 1/2, r13 -> 3/10}]}\``,
}
