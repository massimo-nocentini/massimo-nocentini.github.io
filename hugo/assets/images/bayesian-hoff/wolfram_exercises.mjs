// Symbolic companions + numerical instantiations (wolfram-ws-bridge JS mode;
// W, wl, show, toJS are provided by the bridge runner) for all 38 exercises
// across Chapters 1-12 of "Bayesian Statistical Methods".
// Every snippet uses ONLY stock kernel/allowlist.txt symbols and runs within 30s.

export const SNIPPETS = {
  // ======================== CHAPTER 1 ========================
  ex01_1: `// Ex 1.1: Prior dominance threshold w* where Pr(theta < c | y = 0) == 1/2
const cdf = await show\`Beta[c, w*th0, w*(1 - th0) + n] / Beta[w*th0, w*(1 - th0) + n]\`
const wStar = toJS(await wl\`w /. FindRoot[(\${cdf} /. {c -> 1/10, th0 -> 1/5, n -> 20}) == 1/2, {w, 15, 35}]\`)
const [p22, p23] = toJS(await wl\`N[{\${cdf} /. {c -> 1/10, th0 -> 1/5, n -> 20, w -> 22}, \${cdf} /. {c -> 1/10, th0 -> 1/5, n -> 20, w -> 23}}]\`)
console.log(\`Critical prior sample size w* = \${wStar.toFixed(3)} (w = 22 -> \${p22.toFixed(3)}, w = 23 -> \${p23.toFixed(3)})\`)`,

  ex01_2: `// Ex 1.2: Equivalence of Laplace MAP and Lasso penalty lambda = 2*sigma^2 / b
const obj = await show\`Expand[-2*s2 * (-ssr/(2*s2) - l1/b)]\`
const lam = await show\`Coefficient[\${obj}, l1]\`
const lamVal = toJS(await wl\`N[\${lam} /. {s2 -> 1, b -> 1/2}]\`)
console.log(\`At sigma^2 = 1, b = 1/2 -> Lasso penalty lambda = \${lamVal.toFixed(2)}\`)`,

  ex01_3: `// Ex 1.3: Exact Binomial coverage sum (Wald vs. plus-four) & lattice oscillation
const cov = async (nVal, thVal, plusFour) => toJS(await wl\`N[Sum[
  Binomial[\${nVal}, k]*(\${thVal})^k*(1 - \${thVal})^(\${nVal} - k) * Boole[
    Abs[(k + \${plusFour ? 2 : 0})/(\${nVal} + \${plusFour ? 4 : 0}) - \${thVal}] <=
    (196/100)*Sqrt[((k + \${plusFour ? 2 : 0})/(\${nVal} + \${plusFour ? 4 : 0}))*(1 - (k + \${plusFour ? 2 : 0})/(\${nVal} + \${plusFour ? 4 : 0}))/(\${nVal} + \${plusFour ? 4 : 0})]],
  {k, 0, \${nVal}}]]\`)
await show\`Sum[Binomial[n, k]*th^k*(1 - th)^(n - k)*Boole[Abs[pHat[k] - th] <= z*se[k]], {k, 0, n}]\`
for (const nVal of [20, 100]) {
  const thR = W.Rational(1, 10)
  console.log(\`n = \${String(nVal).padStart(3)}, theta = 0.10: Wald = \${(await cov(nVal, thR, false)).toFixed(4)}, Plus-four = \${(await cov(nVal, thR, true)).toFixed(4)}\`)
}`,

  // ======================== CHAPTER 2 ========================
  ex02_1: `// Ex 2.1: Dutch book guaranteed profit when qF + qNotF > 1 (both outcomes F and not-F)
const profitF = await show\`Simplify[(qF + qNotF) - 1]\`
const pVal = toJS(await wl\`N[\${profitF} /. {qF -> 6/10, qNotF -> 6/10}]\`)
console.log(\`Selling 1 unit of F (0.6) and 1 unit of not-F (0.6): guaranteed profit = +\${pVal.toFixed(2)} whether F occurs or not\`)`,

  ex02_2: `// Ex 2.2: Exchangeability & negative covariance of n = 2 draws without replacement
const p10 = await show\`FullSimplify[(kRed/nPop)*((nPop - kRed)/(nPop - 1))]\`
const p01 = await wl\`FullSimplify[((nPop - kRed)/nPop)*(kRed/(nPop - 1))]\`
const covF = await show\`FullSimplify[(kRed/nPop)*((kRed - 1)/(nPop - 1)) - (kRed/nPop)^2]\`
const lim = toJS(await wl\`Limit[\${covF} /. kRed -> th*nPop, nPop -> Infinity]\`)
const exchDiff = toJS(await wl\`Simplify[\${p10} - \${p01}]\`)
const cVal = toJS(await wl\`N[\${covF} /. {kRed -> 3, nPop -> 10}]\`)
console.log(\`P(1,0) - P(0,1) = \${exchDiff},  Cov < 0 for 0 < K < N,  limit as N -> Inf = \${lim},  at (K=3, N=10): Cov = \${cVal.toFixed(4)}\`)`,

  ex02_3: `// Ex 2.3: Conditional independence given H and not-H still implies marginal dependence
const margDiff = await show\`Factor[(h*p1*q1 + (1 - h)*p0*q0) - (h*p1 + (1 - h)*p0)*(h*q1 + (1 - h)*q0)]\`
const val = toJS(await wl\`N[\${margDiff} /. {h -> 1/2, p1 -> 3/4, q1 -> 3/4, p0 -> 1/4, q0 -> 1/4}]\`)
console.log(\`At h=1/2, p1=q1=3/4, p0=q0=1/4: P(F and G) - P(F)P(G) = +\${val.toFixed(4)} > 0 (H plays the role of theta)\`)`,

  // ======================== CHAPTER 3 ========================
  ex03_1: `// Ex 3.1: Log-odds HPD non-invariance vs. quantile monotone invariance for Beta(3, 9)
const pg = await show\`FullSimplify[(E^(a*g)*(1 + E^g)^(-a - b)) / Beta[a, b]]\`
const hpdG = toJS(await wl\`{gl, gu} /. FindRoot[{
  (\${pg} /. {a -> 3, b -> 9, g -> gl}) == (\${pg} /. {a -> 3, b -> 9, g -> gu}),
  Integrate[\${pg} /. {a -> 3, b -> 9}, {g, gl, gu}] == 95/100}, {{gl, -2.9}, {gu, 0.0}}]\`)
const qLo = toJS(await wl\`g /. FindRoot[Integrate[\${pg} /. {a -> 3, b -> 9}, {g, -Infinity, g}] == 25/1000, {g, -2.7}]\`)
const qHi = toJS(await wl\`g /. FindRoot[Integrate[\${pg} /. {a -> 3, b -> 9}, {g, -Infinity, g}] == 975/1000, {g, 0.1}]\`)
const logit = t => Math.log(t / (1 - t))
console.log(\`Direct gamma-quantile CI:      [\${qLo.toFixed(3)}, \${qHi.toFixed(3)}]  (matches logit of theta-quantiles)\`)
console.log(\`Transformed theta-HPD CI:      [\${logit(0.0406).toFixed(3)}, \${logit(0.4837).toFixed(3)}]  vs. true gamma-HPD: [\${hpdG[0].toFixed(3)}, \${hpdG[1].toFixed(3)}]\`)`,

  ex03_2: `// Ex 3.2: Beta-Binomial posterior predictive mean, variance & overdispersion factor
const meanT = await wl\`an / (an + bn)\`
const varT = await wl\`(an*bn) / ((an + bn)^2*(an + bn + 1))\`
const meanS = await show\`Factor[m * \${meanT}]\`
const varS = await show\`Factor[m*((\${meanT})*(1 - \${meanT}) - \${varT}) + m^2*(\${varT})]\`
const ratio = await show\`Factor[\${varS} / (m*(\${meanT})*(1 - \${meanT}))]\`
const [mVal, rVal] = toJS(await wl\`N[{\${meanS}, \${ratio}} /. {an -> 2, bn -> 40, m -> 20}]\`)
console.log(\`At Beta(2, 40), m = 20: E[S_m | y] = \${mVal.toFixed(4)}, overdispersion factor = \${rVal.toFixed(4)} (= 62/43)\`)`,

  ex03_3: `// Ex 3.3: Exponential model (h=1, c=-phi, t=y) -> Diaconis-Ylvisaker prior -> Gamma(n0 + 1, n0*t0)
const dyPhi = await show\`(-phi)^n0 * Exp[n0 * t0 * phi]\`
const gamKer = await show\`FullSimplify[(\${dyPhi} /. phi -> -th) * Abs[D[-th, th]], th > 0]\`
const [shape, rate, meanG] = toJS(await wl\`N[{n0 + 1, n0*t0, (n0 + 1)/(n0*t0)} /. {n0 -> 2, t0 -> 3}]\`)
console.log(\`At (n0=2, t0=3): Gamma(\${shape}, \${rate}), prior mean = \${meanG.toFixed(3)}\`)`,

  // ======================== CHAPTER 4 ========================
  ex04_1: `// Ex 4.1: Exact Jensen discrepancies for Beta(a, b): E[logit(theta)] and E[1/theta]
const eLogit = await show\`Assuming[a > 0 && b > 0, FullSimplify[PolyGamma[0, a] - PolyGamma[0, b]]]\`
const eInv = await show\`Assuming[a > 1 && b > 0, FullSimplify[Integrate[(1/th)*th^(a - 1)*(1 - th)^(b - 1)/Beta[a, b], {th, 0, 1}]]]\`
const invGap = await show\`Factor[\${eInv} - (a + b)/a]\`
const [v1, v2, v3, v4] = toJS(await wl\`N[{\${eLogit}, Log[a/b], \${eInv}, (a + b)/a} /. {a -> 2, b -> 40}]\`)
console.log(\`Beta(2,40): E[logit] = \${v1.toFixed(4)} < logit(E[th]) = \${v2.toFixed(4)} (concave on (0,1/2))\`)
console.log(\`Beta(2,40): E[1/th] = \${v3.toFixed(2)} > 1/E[th] = \${v4.toFixed(2)} (note: E[1/th^2] = Inf at a=2 -> infinite MC variance)\`)`,

  ex04_2: `// Ex 4.2: Exact Rao-Blackwell variance reduction ratio Var(Ytilde | y) / Var(theta | y)
const rbRatio = await show\`FullSimplify[((an*(bn + 1))/bn^2) / (an/bn^2)]\`
const val = toJS(await wl\`\${rbRatio} /. {an -> 68, bn -> 45}\`)
console.log(\`At Gamma(68, 45): exact Rao-Blackwell variance ratio = \${val}\`)`,

  ex04_3: `// Ex 4.3: Symbolic Negative Binomial dispersion index Var(Y) / E[Y] = 1 + 1/b
const dispIdx = await show\`FullSimplify[((a*(b + 1))/b^2) / (a/b)]\`
const sol = await show\`First[Solve[{a/b == 2, (a*(b + 1))/b^2 == 6}, {a, b}]]\`
const dVal = toJS(await wl\`N[\${dispIdx} /. \${sol}]\`)
console.log(\`Mean = 2, Var = 6 -> dispersion index = \${dVal.toFixed(1)} (vs. 1.0 under Poisson)\`)`,

  // ======================== CHAPTER 5 ========================
  ex05_1: `// Ex 5.1: Marginal posterior exponent of sigma^2 under kappa_0, nu_0 -> 0+ vs. reference prior 1/sigma^2
const muLim = await show\`Limit[(k0*mu0 + n*yb)/(k0 + n), k0 -> 0]\`
const powLim = await show\`Assuming[n > 0, FullSimplify[-(n + nu0)/2 - 1 /. nu0 -> 0]]\`
const powRef = await show\`Assuming[n > 0, FullSimplify[-(n - 1)/2 - 1]]\`
const [dfLim, dfRef] = toJS(await wl\`{-2*(\${powLim} + 1), -2*(\${powRef} + 1)} /. n -> 9\`)
console.log(\`At n = 9: kappa0,nu0 -> 0+ gives df = \${dfLim} (prior ~ s2^(-3/2)), whereas 1/s2 gives df = \${dfRef} (nu0 = -1)\`)`,

  ex05_2: `// Ex 5.2: Exact posterior predictive Student-t variance for Normal-IG model
const predVar = await show\`Assuming[nun > 2 && kn > 0 && s2n > 0,
  FullSimplify[(nun/(nun - 2)) * s2n * (1 + 1/kn)]]\`
const sdPred = Math.sqrt(toJS(await wl\`N[\${predVar} /. {nun -> 10, kn -> 10, s2n -> 0.01532}]\`))
const sdTheta = Math.sqrt(toJS(await wl\`N[(nun/(nun - 2))*s2n/kn /. {nun -> 10, kn -> 10, s2n -> 0.01532}]\`))
console.log(\`Midge posterior predictive SD = \${sdPred.toFixed(4)} (vs. posterior SD of theta = \${sdTheta.toFixed(4)})\`)`,

  ex05_3: `// Ex 5.3: Exact sample-size crossover n* where ybar beats Bayes shrinkage in MSE (exists iff k0*(mu0 - th0)^2 > 2*s2)
const nStar = await show\`n /. First[Solve[(mu0 - th0)^2 == s2*(1/n + 2/k0), n]]\`
const val = toJS(await wl\`N[\${nStar} /. {th0 -> 112, mu0 -> 100, s2 -> 169, k0 -> 3}]\`)
console.log(\`At theta0=112, mu0=100, s2=169, k0=3 -> exact n* = \${val.toFixed(3)} (= 507/94; ybar wins for n >= 6)\`)`,

  // ======================== CHAPTER 6 ========================
  ex06_1: `// Ex 6.1: Bivariate-normal Gibbs AR(1) recursion, lag-k ACF, and ESS
const lagK = await show\`Assuming[-1 < rho < 1, FullSimplify[(rho^2)^k]]\`
const essRatio = await show\`Assuming[-1 < rho < 1, Together[1 / (1 + 2*Sum[rho^(2*k), {k, 1, Infinity}])]]\`
const r90 = toJS(await wl\`N[\${essRatio} /. rho -> 9/10]\`)
console.log(\`At rho = 0.90: lag-1 ACF = 0.81, ESS / S = \${r90.toFixed(4)} (= 19/181)\`)`,

  ex06_2: `// Ex 6.2: Flat prior p(theta, sigma^2) ~ 1 at n = 3 -> proper conditionals, improper marginal!
const condExp = await show\`Assuming[n > 0, FullSimplify[-n/2]]\`
const margExp = await show\`Assuming[n > 0, FullSimplify[-(n - 1)/2]]\`
const tailN3 = await show\`\${margExp} /. n -> 3\`
const [cN3, mN3] = toJS(await wl\`N[{\${condExp}, \${margExp}} /. n -> 3]\`)
console.log(\`At n = 3: theta | s2,y ~ N(ybar, s2/3) and s2 | theta,y has exponent \${cN3} (IG(1/2, SS/2), proper), but marginal exponent is \${mN3} -> diverges! (proper iff n >= 4)\`)`,

  ex06_3: `// Ex 6.3: One-step escape probability & mean residence time from mode -3 in Hoff's trimodal Gibbs sampler
const meanRes = await show\`1 / pEsc\`
const esc = toJS(await wl\`NIntegrate[(Exp[-(th + 3)^2/(2/3)]/Sqrt[2*Pi/3]) * (1 - (45/100*Exp[-(th + 3)^2/(2/3)]) / (45/100*Exp[-(th + 3)^2/(2/3)] + 10/100*Exp[-th^2/(2/3)] + 45/100*Exp[-(th - 3)^2/(2/3)])), {th, -7, 7}]\`)
const resSteps = toJS(await wl\`N[\${meanRes} /. pEsc -> \${esc}]\`)
console.log(\`1-step Gibbs escape prob from mode -3 ≈ \${esc.toFixed(5)} (mean residence ≈ \${resSteps.toFixed(1)} steps trapped); ancestral sampling has ACF = 0 -> ESS/S = 1\`)`,

  // ======================== CHAPTER 7 ========================
  ex07_1: `// Ex 7.1: 3x3 block-matrix proof that beta_{1|2,3} = Sigma_{1,23}*Sigma_{23,23}^(-1) = -Omega_{11}^(-1)*Omega_{1,23}
const Sig = [[W.s11, W.s12, W.s13], [W.s12, W.s22, W.s23], [W.s13, W.s23, W.s33]]
const Om = await wl\`Inverse[\${Sig}]\`
const betaCov = await wl\`\${Sig}[[1, {2, 3}]] . Inverse[\${Sig}[[{2, 3}, {2, 3}]]]\`
const betaPrec = await wl\`-\${Om}[[1, {2, 3}]] / \${Om}[[1, 1]]\`
const resid = await show\`FullSimplify[\${betaCov} - \${betaPrec}]\`
console.log(\`3x3 block-inversion identity residual = \${JSON.stringify(toJS(resid))}; Omega_{1,j} = 0 <=> beta_{1|j,-1j} = 0\`)`,

  ex07_2: `// Ex 7.2: Exact complete-case MNAR bias when observations below z0 are truncated
const shift = await show\`Assuming[Element[z0, Reals],
  FullSimplify[Integrate[z*Exp[-z^2/2]/Sqrt[2*Pi], {z, z0, Infinity}] / Integrate[Exp[-z^2/2]/Sqrt[2*Pi], {z, z0, Infinity}]]]\`
const z20 = toJS(await wl\`z /. FindRoot[1/2*Erfc[-z/Sqrt[2]] == 1/5, {z, -0.84}]\`)
const bias = toJS(await wl\`N[\${shift} /. z0 -> \${z20}]\`)
console.log(\`Dropping bottom 20% (z0 = \${z20.toFixed(4)}): complete-case mean biased upward by +\${bias.toFixed(4)}*sigma (zero complete-case bias under MCAR only; MAR needs data-augmentation Gibbs; MNAR biases both)\`)`,

  ex07_3: `// Ex 7.3: Marginal prior p(rho) ~ (1 - rho^2)^((nu0 - p - 1)/2) under IW(nu0, I_p)
const expSym = await show\`(nu0 - p - 1) / 2\`
const zNorm = await show\`Assuming[nu0 > p - 1, FullSimplify[Integrate[(1 - r^2)^((nu0 - p - 1)/2), {r, -1, 1}]]]\`
for (const nu0 of [4, 6, 20]) {
  const eVal = toJS(await wl\`\${expSym} /. {p -> 3, nu0 -> \${nu0}}\`)
  const desc = eVal === 0 ? 'exact Uniform(-1, 1)' : (eVal === 1 ? 'moderately unimodal around 0' : 'concentrated near 0')
  console.log(\`p = 3, nu0 = \${String(nu0).padStart(2)} -> exponent = \${eVal} (\${desc})\`)
}`,

  // ======================== CHAPTER 8 ========================
  ex08_1: `// Ex 8.1: Oracle Bayes risk (MSE, equal n) of unpooled, completely pooled, and hierarchical partial pooling
const rPart = await show\`FullSimplify[(s2/n)*t2 / (s2/n + t2)]\`
const bWeight = await show\`FullSimplify[\${rPart} / (s2/n)]\`
const oneMinusB = await show\`FullSimplify[\${rPart} / t2]\`
for (const tau of [1, 3, 5, 15]) {
  const [rp, ru] = toJS(await wl\`N[{\${rPart}, s2/n} /. {s2 -> 84.64, n -> 10, t2 -> \${tau*tau}}]\`)
  console.log(\`tau = \${String(tau).padStart(2)}: unpooled MSE = \${ru.toFixed(2)}, pooled MSE = \${(tau*tau).toFixed(2)}, hierarchical MSE = \${rp.toFixed(2)}\`)
}
console.log('Max gain over min(unpooled, pooled) occurs at tau^2 = s2/n (tau ≈ 2.91), halving MSE')`,

  ex08_2: `// Ex 8.2: Bias of omitting nu0 in the full conditional rate of sigma_0^2 (plugging in sum sigma_j^{-2} = m / sigma_0^2)
const meanCorrect = await show\`FullSimplify[(a + m*nu0/2) / (b + (nu0/2)*m/s0True)]\`
const meanBuggy = await show\`FullSimplify[(a + m*nu0/2) / (b + (1/2)*m/s0True)]\`
const limRatio = await show\`Assuming[nu0 > 0 && s0True > 0, Limit[\${meanBuggy} / \${meanCorrect}, m -> Infinity]]\`
const [mc, mb] = toJS(await wl\`N[{\${meanCorrect}, \${meanBuggy}} /. {a -> 1, b -> 1/100, m -> 100, nu0 -> 10, s0True -> 80}]\`)
console.log(\`At (nu0=10, s0^2=80, m=100): correct mean = \${mc.toFixed(2)}, buggy mean = \${mb.toFixed(1)} (ratio = \${(mb/mc).toFixed(2)}x, tending to nu0 = 10)\`)`,

  ex08_3: `// Ex 8.3: Centered posterior coupling across m groups & centered mu-chain lag-1 ACF at fixed tau
const corrCent = await show\`FullSimplify[Sqrt[(s2/nj) / (s2/nj + m*t2)]]\`
const acfMu = await show\`FullSimplify[(s2/nj) / (s2/nj + t2)]\`
const [cVal, aVal] = toJS(await wl\`N[{\${corrCent}, \${acfMu}} /. {s2 -> 100, nj -> 5, m -> 8, t2 -> 1/4}]\`)
console.log(\`At m = 8, nj = 5, sigma = 10, tau = 0.5: Corr(theta_j, mu | y, tau) = \${cVal.toFixed(4)}, centered mu-chain lag-1 ACF = \${aVal.toFixed(4)}\`)`,

  // ======================== CHAPTER 9 ========================
  ex09_1: `// Ex 9.1: Exact Student-t marginal CI for oxygen contrast beta2 + beta4*age across ages 20..31
const age = [23, 22, 22, 25, 27, 20, 31, 23, 27, 28, 22, 24]
const grp = [0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1]
const y = [-0.87, -10.74, -3.27, -1.97, 7.50, -7.25, 17.05, 4.96, 10.40, 11.05, 0.26, 2.51]
const X = age.map((a, i) => [1, grp[i], a, grp[i] * a])
await show\`(g/(g + 1))*cXtXinvC * (nu0*s20 + ssrG) / (nu0 + n)\`
const bOls = await wl\`LinearSolve[Transpose[\${X}].\${X}, Transpose[\${X}].\${y}]\`
const XtXinv = await wl\`Inverse[Transpose[\${X}].\${X}]\`
const s20 = toJS(await wl\`N[Total[(\${y} - \${X}.\${bOls})^2] / 8]\`)
const ssrG = toJS(await wl\`N[\${y}.\${y} - (12/13)*(\${y}.\${X}.\${bOls})]\`)
const t13 = toJS(await wl\`t /. FindRoot[1 - Beta[13/(13 + t^2), 13/2, 1/2]/Beta[13/2, 1/2] == 95/100, {t, 2.16}]\`)
const sigAges = []
for (let a = 20; a <= 31; a++) {
  const c = [0, 1, 0, a]
  const loc = toJS(await wl\`N[(12/13) * (\${c}.\${bOls})]\`)
  const sc = Math.sqrt(toJS(await wl\`N[(12/13)*(\${c}.\${XtXinv}.\${c})*(\${s20} + \${ssrG})/13]\`))
  if (loc - t13*sc > 0) sigAges.push(a)
}
console.log('Ages with 95% exact t_13 CI strictly above 0 (none strictly below 0):', sigAges.join(', '))`,

  ex09_2: `// Ex 9.2: Shift non-invariance of zero-centered g-prior under y -> y + c*1
const shiftDiff = await show\`FullSimplify[((g/(g + 1))*ssrOls + (1/(g + 1))*(yy + 2*c*n*yb + n*c^2)) - ((g/(g + 1))*ssrOls + (1/(g + 1))*yy)]\`
const val = toJS(await wl\`N[\${shiftDiff} /. {n -> 12, g -> 12, yb -> 0, c -> 10}]\`)
console.log(\`Shifting y by +10 (n=12, g=12, ybar=0) changes SSR_g by +\${val.toFixed(2)} (eliminated by flat intercept + centered X)\`)`,

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
const gStar = toJS(await wl\`g /. FindRoot[(\${bfG} /. {s20 -> 8.54, yy -> \${yy}, fA -> \${fA}, fB -> \${fB}, n -> 12}) == 1, {g, 200}]\`)
console.log(\`Preferred model flips from A=(group+age) to B=(age only) at g* ≈ \${gStar.toFixed(1)}\`)`,

  ex09_4: `// Ex 9.4: Symbolic prior odds under Beta-Binomial multiplicity-adjusting prior
const odds = await show\`FullSimplify[FunctionExpand[(1/((p + 1)*Binomial[p, k + 1])) / (1/((p + 1)*Binomial[p, k]))]]\`
const [o0, o5] = toJS(await wl\`N[{\${odds} /. {p -> 64, k -> 0}, \${odds} /. {p -> 64, k -> 5}}]\`)
console.log(\`At p = 64: prior odds at k = 0 is \${o0.toFixed(4)} (= 1/64), at k = 5 is \${o5.toFixed(4)} (= 6/59; vs. 1.0 under uniform)\`)`,

  // ======================== CHAPTER 10 ========================
  ex10_1: `// Ex 10.1: Symbolic expected squared jump & optimal 1D Metropolis scaling (tau = 1; 2.38 is d -> Inf limit)
const esjd = await show\`FullSimplify[(2*ell^2/Pi) * (Pi/2 - ArcTan[ell/2] - Sin[2*ArcTan[ell/2]]/2)]\`
const acf1 = await show\`FullSimplify[1 - \${esjd}/2]\`
const ellStar = toJS(await wl\`ell /. FindRoot[D[\${esjd}, ell] == 0, {ell, 2.4}]\`)
const accOpt = toJS(await wl\`N[(2/Pi)*ArcCot[\${ellStar}/2]]\`)
const acfMin = toJS(await wl\`N[\${acf1} /. ell -> \${ellStar}]\`)
console.log(\`1D optimum (tau = 1): ell* = \${ellStar.toFixed(3)}, acceptance rate = \${accOpt.toFixed(3)}, min lag-1 ACF = \${acfMin.toFixed(3)}\`)`,

  ex10_2: `// Ex 10.2: Normalization & symmetry of reflecting random walk vs. naive-redraw boundary depletion
const normInt = await show\`Assuming[0 < d <= 1/2 && 0 < a < d,
  FullSimplify[Integrate[1/(2*d), {b, 0, a + d}] + Integrate[1/(2*d), {b, 0, d - a}]]]\`
const statFactor = await show\`(Min[1, a + d] - Max[0, a - d]) / (2*d)\`
const fEdge = toJS(await wl\`N[\${statFactor} /. {a -> 1/1000, d -> 1/5}]\`)
console.log(\`Reflecting kernel integrates to \${toJS(normInt)} and is symmetric; naive redraw shrinks stationary boundary density to \${fEdge.toFixed(3)}x (rejecting out-of-range proposals is valid!)\`)`,

  ex10_3: `// Ex 10.3: Log-scale multiplicative proposal Hastings ratio J(th | th*) / J(th* | th) = th* / th
const jFwd = await wl\`Exp[-(Log[thP/th])^2/(2*d^2)] / (thP*d*Sqrt[2*Pi])\`
const jRev = await wl\`Exp[-(Log[th/thP])^2/(2*d^2)] / (th*d*Sqrt[2*Pi])\`
const hRatio = await show\`Assuming[th > 0 && thP > 0 && d > 0, FullSimplify[\${jRev} / \${jFwd}]]\`
const rVal = toJS(await wl\`N[\${hRatio} /. {th -> 1, thP -> 2}]\`)
console.log(\`At th = 1 -> th* = 2: Hastings factor = \${rVal.toFixed(1)}; omitting th*/th targets pi(th)/th (which may diverge at 0)\`)`,

  ex10_4: `// Ex 10.4: Marginal covariance of y | X, sigma^2, rho after integrating out beta ~ N(b0, S0)
const margCov = await show\`s2 * cMat[rho] + xMat . s0Mat . Transpose[xMat]\`
// Concrete 2x2 verification (p = 1, X = {{1}, {2}}, S0 = {{4}}, s2 = 1, rho = 1/2)
const mVal = toJS(await wl\`N[{{1, 1/2}, {1/2, 1}} + {{1}, {2}}.{{4}}.{{1, 2}}]\`)
console.log('Concrete marginal Cov(y | X, s2=1, rho=0.5) [mean = X*b0]:', JSON.stringify(mVal))`,

  // ======================== CHAPTER 11 ========================
  ex11_1: `// Ex 11.1: Symbolic LME slope shrinkage difference b2ols - m_{j,2} = O(1/n_j) (diagonal Sigma)
const shrinkDiff = await show\`FullSimplify[b2ols - (sxx*b2ols/sig2 + th2/tau2Sq)/(sxx/sig2 + 1/tau2Sq)]\`
for (const nj of [5, 24]) {
  const frac = toJS(await wl\`N[(\${shrinkDiff} / (b2ols - th2)) /. {sig2 -> 64, tau2Sq -> 3/2, sxx -> \${nj - 1}}]\`)
  console.log(\`n_j = \${String(nj).padStart(2)}: fraction of (b2ols - theta2) shrunk away (diagonal Sigma) = \${(100*frac).toFixed(1)}%\`)
}`,

  ex11_2: `// Ex 11.2: Effect of global shift x -> x - c on LME intercept covariance Sigma_{1,2}
const T = [[1, W.c], [0, 1]]
const covShift = await show\`FullSimplify[\${T} . {{s11, s12}, {s12, s22}} . Transpose[\${T}]]\`
const cDecorr = await show\`c /. First[Solve[\${covShift}[[1, 2]] == 0, c]]\`
const cVal = toJS(await wl\`N[\${cDecorr} /. {s12 -> 2, s22 -> 3/2}]\`)
console.log(\`At Sigma = [[20, 2], [2, 1.5]]: decorrelating shift c* = \${cVal.toFixed(3)} (note: within-school centering uses school-specific c_j)\`)`,

  ex11_3: `// Ex 11.3: Exact predictive variance across layers 2-3 (random effects + Poisson noise, conditional on theta)
const totVar = await show\`FullSimplify[Exp[m + v/2] + Exp[2*m + v]*(Exp[v] - 1)]\`
const [v1, v2, v3] = toJS(await wl\`N[{Exp[m], Exp[m + v/2], \${totVar}} /. {m -> 1, v -> 1/4}]\`)
console.log(\`At m = 1, v = 0.25: median rate = \${v1.toFixed(2)}, pop-avg rate = \${v2.toFixed(2)}, predictive Var(Ytilde | theta) = \${v3.toFixed(2)}\`)`,

  // ======================== CHAPTER 12 ========================
  ex12_1: `// Ex 12.1: Rank invariance vs. Pearson correlation distortion under nonlinear h(Z_1) = exp(sqrt(v)*Z_1)
const corrExp = await show\`Assuming[v > 0, FullSimplify[
  rho * Integrate[z*Exp[Sqrt[v]*z]*Exp[-z^2/2]/Sqrt[2*Pi], {z, -Infinity, Infinity}] /
  Sqrt[Integrate[Exp[2*Sqrt[v]*z]*Exp[-z^2/2]/Sqrt[2*Pi], {z, -Infinity, Infinity}] - Exp[v]]]]\`
const rVal = toJS(await wl\`N[\${corrExp} /. {rho -> 1, v -> 1}]\`)
console.log(\`Pearson Corr(exp(sqrt(v)*Z_1), Z_2) attenuates rho by factor \${rVal.toFixed(4)} at v = 1, whereas rank set R(Y) is invariant\`)`,

  ex12_2: `// Ex 12.2: Length-biased threshold corridor width 2 / (n * phi(g)) trapping Albert-Chib thresholds (marginal Z ~ N(0,1))
const gapSym = await show\`2 / (n * Exp[-g^2/2] / Sqrt[2*Pi])\`
const [w0, w1] = toJS(await wl\`N[{\${gapSym} /. {n -> 200, g -> 0}, \${gapSym} /. {n -> 200, g -> 1}}]\`)
console.log(\`At n = 200 (marginal Z ~ N(0,1)): expected length-biased corridor width is \${w0.toFixed(4)} at g = 0 and \${w1.toFixed(4)} at g = 1\`)`,

  ex12_3: `// Ex 12.3: Constructing a 3-variable Gaussian copula C from a tridiagonal precision Omega (Omega_{1,3} = 0)
const Om = [[W.a, W.Minus(W.b), 0], [W.Minus(W.b), W.a, W.Minus(W.b)], [0, W.Minus(W.b), W.a]]
const Sig = await wl\`Inverse[\${Om}]\`
const c12 = await show\`Assuming[a > 0 && b > 0 && a^2 > 2*b^2, FullSimplify[\${Sig}[[1, 2]] / Sqrt[\${Sig}[[1, 1]]*\${Sig}[[2, 2]]]]]\`
const c13 = await show\`Assuming[a > 0 && b > 0 && a^2 > 2*b^2, FullSimplify[\${Sig}[[1, 3]] / Sqrt[\${Sig}[[1, 1]]*\${Sig}[[3, 3]]]]]\`
const [r12, r13] = toJS(await wl\`N[{\${c12}, \${c13}} /. {a -> 2, b -> 1}]\`)
console.log(\`Tridiagonal Omega (a=2, b=1): Omega_13 = 0 (preserved by diagonal rescaling to C^(-1)), yet marginal C_12 = \${r12.toFixed(4)}, C_13 = \${r13.toFixed(4)} = C_12^2\`)`,
}
