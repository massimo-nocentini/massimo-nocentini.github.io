// Symbolic companions + numerical instantiations (wolfram-ws-bridge JS mode;
// W, wl, show, toJS are provided by the bridge runner) for all 38 exercises
// across Chapters 1-12 of "Bayesian Statistical Methods".
// Every symbolic derivation and numerical instantiation uses `await show` (zero console.log).

export const SNIPPETS = {
  // ======================== CHAPTER 1 ========================
  ex01_1: `// Ex 1.1: Prior dominance threshold w* where Pr(theta < c | y = 0) == 1/2
const cdf = await show\`Beta[c, w*th0, w*(1 - th0) + n] / Beta[w*th0, w*(1 - th0) + n]\`
await show\`w /. FindRoot[(\${cdf} /. {c -> 1/10, th0 -> 1/5, n -> 20}) == 1/2, {w, 15, 35}]\`
await show\`N[{\${cdf} /. {c -> 1/10, th0 -> 1/5, n -> 20, w -> 22}, \${cdf} /. {c -> 1/10, th0 -> 1/5, n -> 20, w -> 23}}]\``,

  ex01_2: `// Ex 1.2: Equivalence of Laplace MAP and Lasso penalty lambda = 2*sigma^2 / b
const obj = await show\`Expand[-2*s2 * (-ssr/(2*s2) - l1/b)]\`
const lam = await show\`Coefficient[\${obj}, l1]\`
await show\`\${lam} /. {s2 -> 1, b -> 1/2}\``,

  ex01_3: `// Ex 1.3: Exact Binomial coverage sum (Wald vs. plus-four) & lattice oscillation
await show\`Sum[Binomial[n, k]*th^k*(1 - th)^(n - k)*Boole[Abs[pHat[k] - th] <= z*se[k]], {k, 0, n}]\`
await show\`N[Table[Sum[Binomial[nVal, k]*(1/10)^k*(9/10)^(nVal - k)*Boole[
  Abs[(k + c0)/(nVal + 2*c0) - 1/10] <= (196/100)*Sqrt[((k + c0)/(nVal + 2*c0))*(1 - (k + c0)/(nVal + 2*c0))/(nVal + 2*c0)]],
  {k, 0, nVal}], {nVal, {20, 100}}, {c0, {0, 2}}]]\``,

  // ======================== CHAPTER 2 ========================
  ex02_1: `// Ex 2.1: Dutch book guaranteed profit when qF + qNotF > 1 (both outcomes F and not-F)
const profitF = await show\`Simplify[(qF + qNotF) - 1]\`
await show\`N[\${profitF} /. {qF -> 6/10, qNotF -> 6/10}]\``,

  ex02_2: `// Ex 2.2: Exchangeability & negative covariance of n = 2 draws without replacement
const p10 = await show\`FullSimplify[(kRed/nPop)*((nPop - kRed)/(nPop - 1))]\`
const p01 = await wl\`FullSimplify[((nPop - kRed)/nPop)*(kRed/(nPop - 1))]\`
const covF = await show\`FullSimplify[(kRed/nPop)*((kRed - 1)/(nPop - 1)) - (kRed/nPop)^2]\`
await show\`{Simplify[\${p10} - \${p01}], Limit[\${covF} /. kRed -> th*nPop, nPop -> Infinity], N[\${covF} /. {kRed -> 3, nPop -> 10}]}\``,

  ex02_3: `// Ex 2.3: Conditional independence given H and not-H still implies marginal dependence
const margDiff = await show\`Factor[(h*p1*q1 + (1 - h)*p0*q0) - (h*p1 + (1 - h)*p0)*(h*q1 + (1 - h)*q0)]\`
await show\`\${margDiff} /. {h -> 1/2, p1 -> 3/4, q1 -> 3/4, p0 -> 1/4, q0 -> 1/4}\``,

  // ======================== CHAPTER 3 ========================
  ex03_1: `// Ex 3.1: Log-odds HPD non-invariance vs. quantile monotone invariance for Beta(3, 9)
const pg = await show\`FullSimplify[(E^(a*g)*(1 + E^g)^(-a - b)) / Beta[a, b]]\`
await show\`{g /. FindRoot[Integrate[\${pg} /. {a -> 3, b -> 9}, {g, -Infinity, g}] == 25/1000, {g, -2.7}],
  g /. FindRoot[Integrate[\${pg} /. {a -> 3, b -> 9}, {g, -Infinity, g}] == 975/1000, {g, 0.1}]}\`
await show\`{gl, gu} /. FindRoot[{
  (\${pg} /. {a -> 3, b -> 9, g -> gl}) == (\${pg} /. {a -> 3, b -> 9, g -> gu}),
  Integrate[\${pg} /. {a -> 3, b -> 9}, {g, gl, gu}] == 95/100}, {{gl, -2.9}, {gu, 0.0}}]\`
await show\`N[{Log[0.0406/(1 - 0.0406)], Log[0.4837/(1 - 0.4837)]}]\``,

  ex03_2: `// Ex 3.2: Beta-Binomial posterior predictive mean, variance & overdispersion factor
const meanT = await wl\`an / (an + bn)\`
const varT = await wl\`(an*bn) / ((an + bn)^2*(an + bn + 1))\`
const meanS = await show\`Factor[m * \${meanT}]\`
const varS = await show\`Factor[m*((\${meanT})*(1 - \${meanT}) - \${varT}) + m^2*(\${varT})]\`
const ratio = await show\`Factor[\${varS} / (m*(\${meanT})*(1 - \${meanT}))]\`
await show\`N[{\${meanS}, \${ratio}} /. {an -> 2, bn -> 40, m -> 20}]\``,

  ex03_3: `// Ex 3.3: Exponential model (h=1, c=-phi, t=y) -> Diaconis-Ylvisaker prior -> Gamma(n0 + 1, n0*t0)
const dyPhi = await show\`(-phi)^n0 * Exp[n0 * t0 * phi]\`
await show\`FullSimplify[(\${dyPhi} /. phi -> -th) * Abs[D[-th, th]], th > 0]\`
await show\`{n0 + 1, n0*t0, (n0 + 1)/(n0*t0)} /. {n0 -> 2, t0 -> 3}\``,

  // ======================== CHAPTER 4 ========================
  ex04_1: `// Ex 4.1: Exact Jensen discrepancies for Beta(a, b): E[logit(theta)] and E[1/theta]
const eLogit = await show\`Assuming[a > 0 && b > 0, FullSimplify[PolyGamma[0, a] - PolyGamma[0, b]]]\`
const eInv = await show\`Assuming[a > 1 && b > 0, FullSimplify[Integrate[(1/th)*th^(a - 1)*(1 - th)^(b - 1)/Beta[a, b], {th, 0, 1}]]]\`
await show\`Factor[\${eInv} - (a + b)/a]\`
await show\`N[{\${eLogit}, Log[a/b], \${eInv}, (a + b)/a} /. {a -> 2, b -> 40}]\``,

  ex04_2: `// Ex 4.2: Exact Rao-Blackwell variance reduction ratio Var(Ytilde | y) / Var(theta | y)
const rbRatio = await show\`FullSimplify[((an*(bn + 1))/bn^2) / (an/bn^2)]\`
await show\`\${rbRatio} /. {an -> 68, bn -> 45}\``,

  ex04_3: `// Ex 4.3: Symbolic Negative Binomial dispersion index Var(Y) / E[Y] = 1 + 1/b
const dispIdx = await show\`FullSimplify[((a*(b + 1))/b^2) / (a/b)]\`
const sol = await show\`First[Solve[{a/b == 2, (a*(b + 1))/b^2 == 6}, {a, b}]]\`
await show\`\${dispIdx} /. \${sol}\``,

  // ======================== CHAPTER 5 ========================
  ex05_1: `// Ex 5.1: Marginal posterior exponent of sigma^2 under kappa_0, nu_0 -> 0+ vs. reference prior 1/sigma^2
await show\`Limit[(k0*mu0 + n*yb)/(k0 + n), k0 -> 0]\`
const powLim = await show\`Assuming[n > 0, FullSimplify[-(n + nu0)/2 - 1 /. nu0 -> 0]]\`
const powRef = await show\`Assuming[n > 0, FullSimplify[-(n - 1)/2 - 1]]\`
await show\`{-2*(\${powLim} + 1), -2*(\${powRef} + 1)} /. n -> 9\``,

  ex05_2: `// Ex 5.2: Exact posterior predictive Student-t variance for Normal-IG model
const predVar = await show\`Assuming[nun > 2 && kn > 0 && s2n > 0,
  FullSimplify[(nun/(nun - 2)) * s2n * (1 + 1/kn)]]\`
await show\`N[{Sqrt[\${predVar}], Sqrt[(nun/(nun - 2))*s2n/kn]} /. {nun -> 10, kn -> 10, s2n -> 0.01532}]\``,

  ex05_3: `// Ex 5.3: Exact sample-size crossover n* where ybar beats Bayes shrinkage in MSE (exists iff k0*(mu0 - th0)^2 > 2*s2)
const nStar = await show\`n /. First[Solve[(mu0 - th0)^2 == s2*(1/n + 2/k0), n]]\`
await show\`{\${nStar}, N[\${nStar}]} /. {th0 -> 112, mu0 -> 100, s2 -> 169, k0 -> 3}\``,

  // ======================== CHAPTER 6 ========================
  ex06_1: `// Ex 6.1: Bivariate-normal Gibbs AR(1) recursion, lag-k ACF, and ESS
await show\`Assuming[-1 < rho < 1, FullSimplify[(rho^2)^k]]\`
const essRatio = await show\`Assuming[-1 < rho < 1, Together[1 / (1 + 2*Sum[rho^(2*k), {k, 1, Infinity}])]]\`
await show\`{\${essRatio}, N[\${essRatio}]} /. rho -> 9/10\``,

  ex06_2: `// Ex 6.2: Flat prior p(theta, sigma^2) ~ 1 at n = 3 -> proper conditionals, improper marginal!
const condExp = await show\`Assuming[n > 0, FullSimplify[-n/2]]\`
const margExp = await show\`Assuming[n > 0, FullSimplify[-(n - 1)/2]]\`
await show\`{\${condExp}, \${margExp}} /. n -> 3\``,

  ex06_3: `// Ex 6.3: One-step escape probability & mean residence time from mode -3 in Hoff's trimodal Gibbs sampler
const meanRes = await show\`1 / pEsc\`
const esc = await wl\`NIntegrate[(Exp[-(th + 3)^2/(2/3)]/Sqrt[2*Pi/3]) * (1 - (45/100*Exp[-(th + 3)^2/(2/3)]) / (45/100*Exp[-(th + 3)^2/(2/3)] + 10/100*Exp[-th^2/(2/3)] + 45/100*Exp[-(th - 3)^2/(2/3)])), {th, -7, 7}]\`
await show\`N[{\${esc}, \${meanRes} /. pEsc -> \${esc}}]\``,

  // ======================== CHAPTER 7 ========================
  ex07_1: `// Ex 7.1: 3x3 block-matrix proof that beta_{1|2,3} = Sigma_{1,23}*Sigma_{23,23}^(-1) = -Omega_{11}^(-1)*Omega_{1,23}
const Sig = [[W.s11, W.s12, W.s13], [W.s12, W.s22, W.s23], [W.s13, W.s23, W.s33]]
const Om = await wl\`Inverse[\${Sig}]\`
const betaCov = await wl\`\${Sig}[[1, {2, 3}]] . Inverse[\${Sig}[[{2, 3}, {2, 3}]]]\`
const betaPrec = await wl\`-\${Om}[[1, {2, 3}]] / \${Om}[[1, 1]]\`
await show\`FullSimplify[\${betaCov} - \${betaPrec}]\``,

  ex07_2: `// Ex 7.2: Exact complete-case MNAR bias when observations below z0 are truncated (zero complete-case bias under MCAR only)
const shift = await show\`Assuming[Element[z0, Reals],
  FullSimplify[Integrate[z*Exp[-z^2/2]/Sqrt[2*Pi], {z, z0, Infinity}] / Integrate[Exp[-z^2/2]/Sqrt[2*Pi], {z, z0, Infinity}]]]\`
const z20 = await wl\`z /. FindRoot[1/2*Erfc[-z/Sqrt[2]] == 1/5, {z, -0.84}]\`
await show\`N[{\${z20}, \${shift} /. z0 -> \${z20}}]\``,

  ex07_3: `// Ex 7.3: Marginal prior p(rho) ~ (1 - rho^2)^((nu0 - p - 1)/2) under IW(nu0, I_p)
const expSym = await show\`(nu0 - p - 1) / 2\`
await show\`Assuming[nu0 > p - 1, FullSimplify[Integrate[(1 - r^2)^((nu0 - p - 1)/2), {r, -1, 1}]]]\`
await show\`Table[\${expSym} /. {p -> 3, nu0 -> v}, {v, {4, 6, 20}}]\``,

  // ======================== CHAPTER 8 ========================
  ex08_1: `// Ex 8.1: Oracle Bayes risk (MSE, equal n) of unpooled, completely pooled, and hierarchical partial pooling
const rPart = await show\`FullSimplify[(s2/n)*t2 / (s2/n + t2)]\`
await show\`FullSimplify[\${rPart} / (s2/n)]\`
await show\`FullSimplify[\${rPart} / t2]\`
// Instantiate {unpooled, pooled, hierarchical} MSE at s2 = 84.64, n = 10 for tau in {1, 3, 5, 15}
await show\`N[Table[{s2/n, tau^2, \${rPart} /. t2 -> tau^2} /. {s2 -> 84.64, n -> 10}, {tau, {1, 3, 5, 15}}]]\``,

  ex08_2: `// Ex 8.2: Bias of omitting nu0 in the full conditional rate of sigma_0^2 (plugging in sum sigma_j^{-2} = m / sigma_0^2)
const meanCorrect = await show\`FullSimplify[(a + m*nu0/2) / (b + (nu0/2)*m/s0True)]\`
const meanBuggy = await show\`FullSimplify[(a + m*nu0/2) / (b + (1/2)*m/s0True)]\`
await show\`Assuming[nu0 > 0 && s0True > 0, Limit[\${meanBuggy} / \${meanCorrect}, m -> Infinity]]\`
await show\`N[{\${meanCorrect}, \${meanBuggy}, \${meanBuggy}/\${meanCorrect}} /. {a -> 1, b -> 1/100, m -> 100, nu0 -> 10, s0True -> 80}]\``,

  ex08_3: `// Ex 8.3: Centered posterior coupling across m groups & centered mu-chain lag-1 ACF at fixed tau
const corrCent = await show\`FullSimplify[Sqrt[(s2/nj) / (s2/nj + m*t2)]]\`
const acfMu = await show\`FullSimplify[(s2/nj) / (s2/nj + t2)]\`
await show\`N[{\${corrCent}, \${acfMu}} /. {s2 -> 100, nj -> 5, m -> 8, t2 -> 1/4}]\``,

  // ======================== CHAPTER 9 ========================
  ex09_1: `// Ex 9.1: Exact Student-t marginal CI for oxygen contrast beta2 + beta4*age across ages 20..31
const age = [23, 22, 22, 25, 27, 20, 31, 23, 27, 28, 22, 24]
const grp = [0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1]
const y = [-0.87, -10.74, -3.27, -1.97, 7.50, -7.25, 17.05, 4.96, 10.40, 11.05, 0.26, 2.51]
const X = age.map((a, i) => [1, grp[i], a, grp[i] * a])
await show\`(g/(g + 1))*cXtXinvC * (nu0*s20 + ssrG) / (nu0 + n)\`
const bOls = await wl\`LinearSolve[Transpose[\${X}].\${X}, Transpose[\${X}].\${y}]\`
const XtXinv = await wl\`Inverse[Transpose[\${X}].\${X}]\`
const s20 = await wl\`N[Total[(\${y} - \${X}.\${bOls})^2] / 8]\`
const ssrG = await wl\`N[\${y}.\${y} - (12/13)*(\${y}.\${X}.\${bOls})]\`
const t13 = await wl\`t /. FindRoot[1 - Beta[13/(13 + t^2), 13/2, 1/2]/Beta[13/2, 1/2] == 95/100, {t, 2.16}]\`
await show\`Select[Range[20, 31], ((12/13)*({0, 1, 0, #}.\${bOls}) - \${t13}*Sqrt[(12/13)*({0, 1, 0, #}.\${XtXinv}.{0, 1, 0, #})*(\${s20} + \${ssrG})/13]) > 0 &]\``,

  ex09_2: `// Ex 9.2: Shift non-invariance of zero-centered g-prior under y -> y + c*1
const shiftDiff = await show\`FullSimplify[((g/(g + 1))*ssrOls + (1/(g + 1))*(yy + 2*c*n*yb + n*c^2)) - ((g/(g + 1))*ssrOls + (1/(g + 1))*yy)]\`
await show\`{\${shiftDiff}, N[\${shiftDiff}]} /. {n -> 12, g -> 12, yb -> 0, c -> 10}\``,

  ex09_3: `// Ex 9.3: Exact switch point g* where Lindley's paradox flips A=(1,1,1,0) vs B=(1,0,1,0) on oxygen data (nu0 = 1)
const age = [23, 22, 22, 25, 27, 20, 31, 23, 27, 28, 22, 24]
const grp = [0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1]
const y = [-0.87, -10.74, -3.27, -1.97, 7.50, -7.25, 17.05, 4.96, 10.40, 11.05, 0.26, 2.51]
const Xfull = age.map((a, i) => [1, grp[i], a, grp[i] * a])
const fitSum = async cols => {
  const Xz = Xfull.map(r => cols.map(c => r[c]))
  return toJS(await wl\`N[\${y}.\${Xz}.LinearSolve[Transpose[\${Xz}].\${Xz}, Transpose[\${Xz}].\${y}]]\`)
}
const yy = toJS(await wl\`N[\${y}.\${y}]\`), fA = await fitSum([0, 1, 2]), fB = await fitSum([0, 2])
const bfG = await show\`(1 + g)^(-1/2) * ((s20 + yy - (g/(g + 1))*fB) / (s20 + yy - (g/(g + 1))*fA))^((n + 1)/2)\`
await show\`g /. FindRoot[(\${bfG} /. {s20 -> 8.54, yy -> \${yy}, fA -> \${fA}, fB -> \${fB}, n -> 12}) == 1, {g, 200}]\``,

  ex09_4: `// Ex 9.4: Symbolic prior odds under Beta-Binomial multiplicity-adjusting prior
const odds = await show\`FullSimplify[FunctionExpand[(1/((p + 1)*Binomial[p, k + 1])) / (1/((p + 1)*Binomial[p, k]))]]\`
await show\`{\${odds} /. {p -> 64, k -> 0}, \${odds} /. {p -> 64, k -> 5}}\``,

  // ======================== CHAPTER 10 ========================
  ex10_1: `// Ex 10.1: Symbolic expected squared jump & optimal 1D Metropolis scaling (tau = 1; 2.38 is d -> Inf limit)
const esjd = await show\`FullSimplify[(2*ell^2/Pi) * (Pi/2 - ArcTan[ell/2] - Sin[2*ArcTan[ell/2]]/2)]\`
const acf1 = await show\`FullSimplify[1 - \${esjd}/2]\`
const ellStar = await wl\`ell /. FindRoot[D[\${esjd}, ell] == 0, {ell, 2.4}]\`
await show\`N[{\${ellStar}, (2/Pi)*ArcCot[\${ellStar}/2], \${acf1} /. ell -> \${ellStar}}]\``,

  ex10_2: `// Ex 10.2: Normalization & symmetry of reflecting random walk vs. naive-redraw boundary depletion
await show\`Assuming[0 < d <= 1/2 && 0 < a < d,
  FullSimplify[Integrate[1/(2*d), {b, 0, a + d}] + Integrate[1/(2*d), {b, 0, d - a}]]]\`
const statFactor = await show\`(Min[1, a + d] - Max[0, a - d]) / (2*d)\`
await show\`N[\${statFactor} /. {a -> 1/1000, d -> 1/5}]\``,

  ex10_3: `// Ex 10.3: Log-scale multiplicative proposal Hastings ratio J(th | th*) / J(th* | th) = th* / th
const jFwd = await wl\`Exp[-(Log[thP/th])^2/(2*d^2)] / (thP*d*Sqrt[2*Pi])\`
const jRev = await wl\`Exp[-(Log[th/thP])^2/(2*d^2)] / (th*d*Sqrt[2*Pi])\`
const hRatio = await show\`Assuming[th > 0 && thP > 0 && d > 0, FullSimplify[\${jRev} / \${jFwd}]]\`
await show\`\${hRatio} /. {th -> 1, thP -> 2}\``,

  ex10_4: `// Ex 10.4: Marginal covariance of y | X, sigma^2, rho after integrating out beta ~ N(b0, S0)
await show\`s2 * cMat[rho] + xMat . s0Mat . Transpose[xMat]\`
await show\`N[{{1, 1/2}, {1/2, 1}} + {{1}, {2}}.{{4}}.{{1, 2}}]\``,

  // ======================== CHAPTER 11 ========================
  ex11_1: `// Ex 11.1: Symbolic LME slope shrinkage difference b2ols - m_{j,2} = O(1/n_j) (diagonal Sigma)
const shrinkDiff = await show\`FullSimplify[b2ols - (sxx*b2ols/sig2 + th2/tau2Sq)/(sxx/sig2 + 1/tau2Sq)]\`
await show\`N[Table[(\${shrinkDiff} / (b2ols - th2)) /. {sig2 -> 64, tau2Sq -> 3/2, sxx -> nj - 1}, {nj, {5, 24}}]]\``,

  ex11_2: `// Ex 11.2: Effect of global shift x -> x - c on LME intercept covariance Sigma_{1,2}
const T = [[1, W.c], [0, 1]]
const covShift = await show\`FullSimplify[\${T} . {{s11, s12}, {s12, s22}} . Transpose[\${T}]]\`
const cDecorr = await show\`c /. First[Solve[\${covShift}[[1, 2]] == 0, c]]\`
await show\`{\${cDecorr}, N[\${cDecorr}]} /. {s12 -> 2, s22 -> 3/2}\``,

  ex11_3: `// Ex 11.3: Exact predictive variance across layers 2-3 (random effects + Poisson noise, conditional on theta)
const totVar = await show\`FullSimplify[Exp[m + v/2] + Exp[2*m + v]*(Exp[v] - 1)]\`
await show\`N[{Exp[m], Exp[m + v/2], \${totVar}} /. {m -> 1, v -> 1/4}]\``,

  // ======================== CHAPTER 12 ========================
  ex12_1: `// Ex 12.1: Rank invariance vs. Pearson correlation distortion under nonlinear h(Z_1) = exp(sqrt(v)*Z_1)
const corrExp = await show\`Assuming[v > 0, FullSimplify[
  rho * Integrate[z*Exp[Sqrt[v]*z]*Exp[-z^2/2]/Sqrt[2*Pi], {z, -Infinity, Infinity}] /
  Sqrt[Integrate[Exp[2*Sqrt[v]*z]*Exp[-z^2/2]/Sqrt[2*Pi], {z, -Infinity, Infinity}] - Exp[v]]]]\`
await show\`N[\${corrExp} /. {rho -> 1, v -> 1}]\``,

  ex12_2: `// Ex 12.2: Length-biased threshold corridor width 2 / (n * phi(g)) trapping Albert-Chib thresholds (marginal Z ~ N(0,1))
const gapSym = await show\`2 / (n * Exp[-g^2/2] / Sqrt[2*Pi])\`
await show\`N[{\${gapSym} /. {n -> 200, g -> 0}, \${gapSym} /. {n -> 200, g -> 1}}]\``,

  ex12_3: `// Ex 12.3: Constructing a 3-variable Gaussian copula C from a tridiagonal precision Omega (Omega_{1,3} = 0)
const Om = [[W.a, W.Minus(W.b), 0], [W.Minus(W.b), W.a, W.Minus(W.b)], [0, W.Minus(W.b), W.a]]
const Sig = await wl\`Inverse[\${Om}]\`
const c12 = await show\`Assuming[a > 0 && b > 0 && a^2 > 2*b^2, FullSimplify[\${Sig}[[1, 2]] / Sqrt[\${Sig}[[1, 1]]*\${Sig}[[2, 2]]]]]\`
const c13 = await show\`Assuming[a > 0 && b > 0 && a^2 > 2*b^2, FullSimplify[\${Sig}[[1, 3]] / Sqrt[\${Sig}[[1, 1]]*\${Sig}[[3, 3]]]]]\`
await show\`N[{\${c12}, \${c13}} /. {a -> 2, b -> 1}]\``,
}
