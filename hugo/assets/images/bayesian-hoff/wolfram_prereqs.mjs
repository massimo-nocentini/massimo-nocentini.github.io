// All 10 fully symbolic + numeric instantiation snippets in wolfram-ws-bridge JS mode
// for "Mathematical & Probabilistic Prerequisites" of "Bayesian Statistical Methods".
// Every symbolic derivation and numerical instantiation uses `await show` (zero console.log).

export const SNIPPETS = {
  pre1a: `// 1a. Law of total variance on Chapter 6's trimodal normal mixture
const { x, m, v } = W
const phi = await wl\`Exp[-(\${x} - \${m})^2/(2*\${v})]/Sqrt[2*Pi*\${v}]\`
const mom = await show\`Assuming[v > 0 && Element[m, Reals],
  Table[Integrate[x^k*\${phi}, {x, -Infinity, Infinity}], {k, 1, 2}]]\`
const within = await wl\`Sum[w[j]*s2[j], {j, 3}]\`
const between = await wl\`Sum[w[j]*th[j]^2, {j, 3}] - Sum[w[j]*th[j], {j, 3}]^2\`
await show\`Simplify[Sum[w[j]*(\${mom}[[2]] /. {m -> th[j], v -> s2[j]}), {j, 3}] -
  Sum[w[j]*(\${mom}[[1]] /. m -> th[j]), {j, 3}]^2 - (\${within} + \${between})]\`
await show\`Simplify[(\${between} - Sum[w[i]*w[j]*(th[i] - th[j])^2, {i, 3}, {j, i + 1, 3}]) /. w[3] -> 1 - w[1] - w[2]]\`
const hoff = await wl\`{w[1] -> 9/20, w[2] -> 1/10, w[3] -> 9/20, th[1] -> -3, th[2] -> 0, th[3] -> 3, s2[1] -> 1/3, s2[2] -> 1/3, s2[3] -> 1/3}\`
await show\`{\${within}, \${between}, Integrate[x^2*Sum[w[j]*(\${phi} /. {m -> th[j], v -> s2[j]}), {j, 3}] /. \${hoff}, {x, -Infinity, Infinity}]} /. \${hoff}\``,

  pre1b: `// 1b. Two Jensen gaps for a Gamma(a, b) precision random variable
const { a, b, x } = W
const dens = await wl\`\${b}^\${a}/Gamma[\${a}]*\${x}^(\${a} - 1)*Exp[-\${b}*\${x}]\`
const eInv = await show\`Assuming[a > 1 && b > 0, FullSimplify[Integrate[\${dens}/x, {x, 0, Infinity}]]]\`
const eLog = await show\`Assuming[a > 0 && b > 0, FullSimplify[Integrate[Log[x]*\${dens}, {x, 0, Infinity}]]]\`
const gaps = await show\`Assuming[a > 1 && b > 0, {FullSimplify[\${eInv} - b/a], FullSimplify[Log[a/b] - \${eLog}]}]\`
await show\`N[\${gaps} /. {a -> 5, b -> 3/40}]\``,

  pre2a: `// 2a. Normal kernel normalization Z(q, l) and precision-weighted posterior
const { q, l } = W
const z = await show\`Assuming[q > 0 && Element[l, Reals], Integrate[Exp[-\${q}*x^2/2 + \${l}*x], {x, -Infinity, Infinity}]]\`
const mv = await show\`Simplify[{D[Log[\${z}], l], D[Log[\${z}], {l, 2}]}]\`
const post = await show\`Together[\${mv} /. {q -> 1/t0^2 + n/s2, l -> mu0/t0^2 + n*yb/s2}]\`
await show\`N[\${post} /. {mu0 -> 19/10, t0 -> 95/100, n -> 9, yb -> 1804/1000, s2 -> 17/1000}]\``,

  pre2b: `// 2b. Score fingerprints (Beta, Gamma, Normal) and marginal evidence p(y)
const logK = await wl\`{y*Log[t] + (n - y)*Log[1 - t] + (a - 1)*Log[t] + (b - 1)*Log[1 - t],
  sy*Log[t] - n*t + (a - 1)*Log[t] - b*t,
  -n*(yb - t)^2/(2*s2) - (t - mu0)^2/(2*t0^2)}\`
await show\`Simplify[D[\${logK}, t] - {
  (a + y - 1)/t - (b + n - y - 1)/(1 - t),
  (a + sy - 1)/t - (b + n),
  (mu0/t0^2 + n*yb/s2) - (1/t0^2 + n/s2)*t}]\`
const joint = await wl\`Binomial[n, y]*t^y*(1 - t)^(n - y)*t^(a - 1)*(1 - t)^(b - 1)/Beta[a, b]\`
const py = await show\`Assuming[a > 0 && b > 0 && n >= y >= 0,
  Integrate[\${joint}, {t, 0, 1}] /. Gamma[b + n - y]*Gamma[a + y] -> Beta[a + y, b + n - y]*Gamma[a + b + n]]\`
await show\`Assuming[a > 0 && b > 0 && n >= y >= 0 && 0 < t < 1,
  FullSimplify[\${joint}/(t^(a + y - 1)*(1 - t)^(b + n - y - 1)/Beta[a + y, b + n - y]) - \${py}]]\`
await show\`N[{\${py}, (a + y)/(a + b + n)} /. {a -> 2, b -> 20, n -> 20, y -> 0}]\``,

  pre3a: `// 3a. Gamma precision on three scales: precision, variance, and log-precision
const px = await wl\`b^a/Gamma[a]*x^(a - 1)*Exp[-b*x]\`
const pv = await show\`Assuming[a > 0 && b > 0 && v > 0, FullSimplify[(\${px} /. x -> 1/v)*Abs[D[1/v, v]]]]\`
await show\`Assuming[a > 0 && b > 0, Integrate[\${pv}, {v, 0, Infinity}]]\`
const pe = await show\`Assuming[a > 0 && b > 0 && Element[h, Reals], FullSimplify[(\${px} /. x -> Exp[h])*Abs[D[Exp[h], h]]]]\`
const modes = await show\`Assuming[a > 1 && b > 0, Simplify[{x /. First[Solve[D[Log[\${px}], x] == 0, x]], v /. First[Solve[D[Log[\${pv}], v] == 0, v]]}]]\`
await show\`Assuming[a > 0 && b > 0 && x > 0 && v > 0 && Element[h, Reals], Simplify[{D[Log[\${px}], {x, 2}], D[Log[\${pv}], {v, 2}], D[Log[\${pe}], {h, 2}]}]]\`
await show\`N[{1/\${modes}[[1]], \${modes}[[2]]} /. {a -> 5, b -> 3/40}]\`
await show\`N[{1/Median[GammaDistribution[5, 40/3]], Median[InverseGammaDistribution[5, 3/40]]}]\``,

  pre3b: `// 3b. Deriving the Beta integral & independence via a 2D Jacobian
const jac = await show\`Simplify[Det[D[{s*u, s*(1 - u)}, {{s, u}}]]]\`
const joint = await wl\`Assuming[s > 0 && 0 < u < 1 && a > 0 && b > 0, Simplify[PowerExpand[
  (x1^(a - 1)*Exp[-x1]/Gamma[a])*(x2^(b - 1)*Exp[-x2]/Gamma[b]) /. {x1 -> s*u, x2 -> s*(1 - u)}]*Abs[\${jac}]]]\`
const margU = await show\`Assuming[0 < u < 1 && a > 0 && b > 0, FullSimplify[Integrate[\${joint}, {s, 0, Infinity}]]]\`
await show\`Assuming[s > 0 && 0 < u < 1 && a > 0 && b > 0,
  FullSimplify[\${joint}/(\${margU}*s^(a + b - 1)*Exp[-s]/Gamma[a + b])]]\`
await show\`{Gamma[a]*Gamma[b]/Gamma[a + b] /. {a -> 3, b -> 9}, Integrate[u^2*(1 - u)^8, {u, 0, 1}]}\``,

  pre4a: `// 4a. Completing the square in R^2 and symbolic Cholesky factorization
const x = [W.x1, W.x2], b = [W.b1, W.b2], A = [[W.a11, W.a12], [W.a12, W.a22]]
const m = await show\`Simplify[Inverse[\${A}] . \${b}]\`
await show\`Simplify[(-\${x} . \${A} . \${x}/2 + \${x} . \${b}) - (-(\${x} - \${m}) . \${A} . (\${x} - \${m})/2 + \${b} . \${m}/2)]\`
const cov = await wl\`{{s1^2, rho*s1*s2}, {rho*s1*s2, s2^2}}\`
const L = await show\`Assuming[s1 > 0 && s2 > 0 && -1 < rho < 1, FullSimplify[Transpose[CholeskyDecomposition[\${cov}]]]]\`
await show\`{\${L} /. {s1 -> 25, s2 -> 25, rho -> 1/2}, Simplify[\${L} . Transpose[\${L}] - \${cov}, -1 < rho < 1]}\``,

  pre4b_schur: `// 4b-i. 3x3 Schur complement determinant & quadratic-form factorization
const Sig = [[W.s11, W.s12, W.s13], [W.s12, W.s22, W.s23], [W.s13, W.s23, W.s33]]
const z = [W.z1, W.z2, W.z3], za = [W.z1, W.z2]
const coef = await wl\`\${Sig}[[3, {1, 2}]] . Inverse[\${Sig}[[{1, 2}, {1, 2}]]]\`
const schur = await wl\`\${Sig}[[3, 3]] - \${coef} . \${Sig}[[{1, 2}, 3]]\`
await show\`Simplify[{Det[\${Sig}] - Det[\${Sig}[[{1, 2}, {1, 2}]]]*\${schur}, Inverse[\${Sig}][[3, 3]]*\${schur}}]\`
await show\`Simplify[\${z} . Inverse[\${Sig}] . \${z} - \${za} . Inverse[\${Sig}[[{1, 2}, {1, 2}]]] . \${za} - (z3 - \${coef} . \${za})^2/\${schur}]\`
await show\`{\${coef}, \${schur}, Det[\${Sig}]} /. {s11 -> 4, s22 -> 4, s33 -> 4, s12 -> 2, s13 -> 2, s23 -> 1}\``,

  pre4b_proj: `// 4b-ii. OLS projection matrix P_X, g-prior determinant & inverse, and Pythagoras
const X = [[1, W.x1], [1, W.x2], [1, W.x3]]
const P = await wl\`Simplify[\${X} . Inverse[Transpose[\${X}] . \${X}] . Transpose[\${X}]]\`
await show\`Simplify[{\${P} . \${P} - \${P}, Transpose[\${X}] . (IdentityMatrix[3] - \${P})}]\`
await show\`Simplify[{Tr[\${P}], Det[IdentityMatrix[3] + g*\${P}]}]\`
await show\`Simplify[Inverse[IdentityMatrix[3] + g*\${P}] - (IdentityMatrix[3] - g/(1 + g)*\${P})]\`
await show\`With[{h = \${P} /. {x1 -> -1, x2 -> 0, x3 -> 1}, y = {1, 2, 6}}, {h . y, y . h . y, y . (y - h . y), y . y}]\``,

  pre5a: `// 5a. Exact finite-S variance inflation & ESS for geometric autocorrelation rho^t
const { r, t, ns } = W
const infl = await show\`Assuming[0 < r < 1 && ns >= 1 && Element[ns, Integers],
  FullSimplify[1 + 2*Sum[(1 - \${t}/\${ns})*\${r}^\${t}, {t, 1, ns - 1}]]]\`
const iact = await show\`Assuming[0 < r < 1, Limit[\${infl}, ns -> Infinity]]\`
await show\`Table[Simplify[Total[Table[r^Abs[i - j], {i, k}, {j, k}], 2]/k - (\${infl} /. ns -> k)], {k, {2, 3, 7}}]\`
await show\`Table[{ns/\${infl}, ns/\${iact}, Sqrt[\${infl}/ns]} /. {ns -> 1000, r -> rv}, {rv, {0., 0.5, 0.9, 0.9801}}]\``,

  pre5b: `// 5b. Three-state Metropolis chain: detailed balance, spectrum, and geometric TV convergence
const tgt = [W.p1, W.p2, W.p3]
const K = await show\`Assuming[p1 >= p2 >= p3 > 0, Simplify[With[
  {off = Table[If[i == j, 0, Min[1, \${tgt}[[j]]/\${tgt}[[i]]]/2], {i, 3}, {j, 3}]},
  off + DiagonalMatrix[1 - Total[off, {2}]]]]]\`
await show\`Simplify[{DiagonalMatrix[\${tgt}] . \${K} - Transpose[DiagonalMatrix[\${tgt}] . \${K}], \${tgt} . \${K} - \${tgt}}]\`
await show\`Simplify[Eigenvalues[\${K}]]\`
await show\`N[Table[Total[Abs[MatrixPower[\${K} /. {p1 -> 1/2, p2 -> 3/10, p3 -> 1/5}, k][[3]] - {1/2, 3/10, 1/5}]]/2, {k, {1, 2, 5, 10}}]]\``,
}
