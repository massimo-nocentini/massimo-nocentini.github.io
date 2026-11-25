#!/usr/bin/env node
// Generate all 13 publication-quality, dark-mode-aware SVG figures for
// "Bayesian Statistical Methods" (Companion to Hoff 2009) using the
// wolfram-ws-bridge JavaScript bindings.

import { readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { WXF } from '/data/bitcoin/mnocentini-home/Developer/working-copies/wolfram-ws-bridge/web/wxf.js'
import { WolframSocket } from '/data/bitcoin/mnocentini-home/Developer/working-copies/wolfram-ws-bridge/web/wolfram-socket.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const URL_WS = process.env.WSBRIDGE_URL || 'ws://127.0.0.1:18179/ws?token=hoffbook'
const WASM_PATH = '/data/bitcoin/mnocentini-home/Developer/working-copies/wolfram-ws-bridge/web/wxf.wasm'

// Tufte-inspired palette (light -> dark CSS mapping)
const PALETTE = [
  ['#111111', '#dddddd'], // INK
  ['#555555', '#aaaaaa'], // MUTED
  ['#888888', '#8f8f8f'], // FAINT
  ['#e3e3e3', '#333333'], // GRID
  ['#2a78d6', '#5ca0f0'], // BLUE
  ['#eb6834', '#f08458'], // ORANGE
  ['#16a070', '#3cc493'], // GREEN
  ['#6b4a8f', '#bba1dc'], // PURPLE
  ['#fffff8', '#151515'], // PAPER
]

const DARK_CSS =
  '<style>@media (prefers-color-scheme: dark){' +
  PALETTE.map(([light, dark]) =>
    `[style*="fill:${light}"]{fill:${dark}!important}[style*="stroke:${light}"]{stroke:${dark}!important}` +
    `[style*="fill: ${light}"]{fill:${dark}!important}[style*="stroke: ${light}"]{stroke:${dark}!important}`
  ).join('') +
  '}</style>'

function hexToRgbPct(hex) {
  const n = parseInt(hex.slice(1), 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255].map(v => (v / 255) * 100)
}

const PALETTE_RGB = PALETTE.map(([hex]) => ({ hex, pct: hexToRgbPct(hex) }))

function postprocessSvg(rawSvg) {
  let svg = rawSvg
  // 1. Replace Cairo's rgb(R%,G%,B%) with canonical hex for our palette colors (within 0.4% tolerance)
  svg = svg.replace(/rgb\(\s*([\d.]+)%\s*,\s*([\d.]+)%\s*,\s*([\d.]+)%\s*\)/g, (match, r, g, b) => {
    const rv = parseFloat(r), gv = parseFloat(g), bv = parseFloat(b)
    // Pure black default text/lines from Wolfram -> INK (#111111)
    if (rv < 0.5 && gv < 0.5 && bv < 0.5) return '#111111'
    for (const { hex, pct } of PALETTE_RGB) {
      if (Math.abs(rv - pct[0]) < 0.45 && Math.abs(gv - pct[1]) < 0.45 && Math.abs(bv - pct[2]) < 0.45) {
        return hex
      }
    }
    return match
  })
  // 2. Remove Cairo's full-canvas white background rect so the SVG is transparent on cream & dark themes
  svg = svg.replace(/<rect[^>]*style="fill:rgb\(100%,\s*99\.99\d*%,\s*100%\);[^"]*"[^>]*\/>/g, '')
  svg = svg.replace(/<rect[^>]*style="fill:rgb\(100%,\s*100%,\s*100%\);[^"]*"[^>]*\/>/g, '')
  // 3. Inject dark-mode CSS right after opening <svg ...>
  svg = svg.replace(/(<svg\b[^>]*>)/, `$1${DARK_CSS}`)
  return svg
}

// Shared Wolfram Language styling preamble loaded once into the kernel session
const WL_PREAMBLE = `
ink = RGBColor["#111111"];
muted = RGBColor["#555555"];
faint = RGBColor["#888888"];
gridC = RGBColor["#e3e3e3"];
blue = RGBColor["#2a78d6"];
orange = RGBColor["#eb6834"];
green = RGBColor["#16a070"];
purple = RGBColor["#6b4a8f"];
paper = RGBColor["#fffff8"];

tufteBase = {
  Frame -> {{True, False}, {True, False}},
  FrameStyle -> Directive[muted, AbsoluteThickness[0.7]],
  FrameTicksStyle -> Directive[muted, FontFamily -> "DejaVu Sans", FontSize -> 8],
  LabelStyle -> Directive[ink, FontFamily -> "DejaVu Sans", FontSize -> 9],
  Axes -> False,
  Background -> None,
  ImagePadding -> {{40, 12}, {34, 24}},
  PlotLabel -> None
};

lbl[s_String] := Style[s, ink, FontFamily -> "DejaVu Sans", FontSize -> 9];
ttl[s_String] := Style[s, ink, FontFamily -> "DejaVu Sans", FontSize -> 10, Bold];
leg[items_List, styles_List, pos_:{0.98, 0.96}, align_:{Right, Top}] := Placed[
  LineLegend[styles, (Style[#, ink, FontFamily -> "DejaVu Sans", FontSize -> 7.5] &) /@ items,
    LegendMarkerSize -> {14, 7}, Spacings -> {0.3, 0.15}],
  Scaled[pos]
];
`

const FIGURES = [
  // ==================== FRONTISPIECE ====================
  {
    file: 'frontispiece.svg',
    wl: `
Plot[
  {PDF[BetaDistribution[2, 2], x],
   PDF[BetaDistribution[6, 8], x],
   PDF[BetaDistribution[20, 34], x],
   PDF[BetaDistribution[72, 132], x]},
  {x, 0.001, 0.999},
  PlotRange -> {{0, 1}, {0, 13.5}},
  PlotStyle -> {
    Directive[faint, Dashed, AbsoluteThickness[1.2]],
    Directive[orange, DotDashed, AbsoluteThickness[1.4]],
    Directive[blue, AbsoluteThickness[1.7]],
    Directive[ink, AbsoluteThickness[2.1]]
  },
  Filling -> {4 -> {Axis, Directive[blue, Opacity[0.14]]}},
  Epilog -> {
    Directive[green, Dotted, AbsoluteThickness[1.3]], Line[{{0.35, 0}, {0.35, 13.2}}],
    Inset[Style["True \\[Theta] = 0.35", green, FontFamily -> "DejaVu Sans", FontSize -> 8], {0.37, 12.2}, {Left, Center}]
  },
  PlotLegends -> Placed[
    LineLegend[
      {Directive[faint, Dashed, AbsoluteThickness[1.2]],
       Directive[orange, DotDashed, AbsoluteThickness[1.4]],
       Directive[blue, AbsoluteThickness[1.7]],
       Directive[ink, AbsoluteThickness[2.1]]},
      Style[#, ink, FontFamily -> "DejaVu Sans", FontSize -> 8] & /@ {
        "Prior: Beta(2, 2)", "After n = 10 (y = 4)", "After n = 50 (y = 18)", "After n = 200 (y = 70)"
      },
      LegendMarkerSize -> {16, 8}, Spacings -> {0.3, 0.15}],
    Scaled[{0.96, 0.92}]
  ],
  FrameLabel -> {lbl["Parameter \\[Theta]"], lbl["Density p(\\[Theta] | y)"]},
  PlotLabel -> ttl["Sequential Bayesian Learning: Posterior Concentration with Increasing Data"],
  AspectRatio -> 0.39,
  ImageSize -> 540,
  Evaluate[Sequence @@ tufteBase]
]`
  },

  // ==================== CHAPTER 1 ====================
  {
    file: 'fig-ch01-beta-update.svg',
    wl: `
Module[{pA, pB, pC, ks = Range[0, 12]},
  pA = BarChart[
    Transpose[Table[PDF[BinomialDistribution[20, th], k], {th, {0.05, 0.10, 0.20}}, {k, ks}]],
    ChartStyle -> {ink, blue, orange},
    ChartLayout -> "Grouped",
    BarSpacing -> {0.0, 0.35},
    ChartLabels -> {Placed[Style[#, muted, FontFamily -> "DejaVu Sans", FontSize -> 7] & /@ ks, Below], None},
    ChartLegends -> Placed[
      SwatchLegend[{ink, blue, orange},
        Style[#, ink, FontFamily -> "DejaVu Sans", FontSize -> 7.5] & /@ {"\\[Theta] = 0.05", "\\[Theta] = 0.10", "\\[Theta] = 0.20"},
        LegendMarkerSize -> 8],
      Scaled[{0.94, 0.88}]
    ],
    FrameLabel -> {lbl["Infected in sample (y)"], lbl["p(y | \\[Theta])"]},
    PlotLabel -> ttl["Sampling Model: Binomial(20, \\[Theta])"],
    AspectRatio -> 0.82, ImageSize -> 240,
    Evaluate[Sequence @@ tufteBase]
  ];
  pB = Show[
    Plot[
      {PDF[BetaDistribution[2, 20], th], PDF[BetaDistribution[2, 40], th]},
      {th, 0.0001, 0.35},
      PlotRange -> {{0, 0.35}, {0, 16.5}},
      PlotStyle -> {Directive[faint, Dashed, AbsoluteThickness[1.4]], Directive[ink, AbsoluteThickness[1.8]]},
      PlotLegends -> Placed[
        LineLegend[
          {Directive[faint, Dashed, AbsoluteThickness[1.4]], Directive[ink, AbsoluteThickness[1.8]]},
          Style[#, ink, FontFamily -> "DejaVu Sans", FontSize -> 7.5] & /@ {"Prior Beta(2, 20)", "Posterior Beta(2, 40)"},
          LegendMarkerSize -> {14, 7}],
        Scaled[{0.95, 0.90}]
      ],
      FrameLabel -> {lbl["Prevalence \\[Theta]"], lbl["Density"]},
      PlotLabel -> ttl["Prior vs. Posterior (n = 20, y = 0)"],
      AspectRatio -> 0.82, ImageSize -> 240,
      Evaluate[Sequence @@ tufteBase]
    ],
    Plot[PDF[BetaDistribution[2, 40], th], {th, 0.0001, 0.10},
      PlotStyle -> None, Filling -> Axis, FillingStyle -> Directive[blue, Opacity[0.20]]],
    Graphics[{
      Directive[blue, Dotted, AbsoluteThickness[1.1]], Line[{{0.10, 0}, {0.10, 16}}],
      Inset[Style["Pr(\\[Theta] < 0.10 | y=0) = 0.93", blue, FontFamily -> "DejaVu Sans", FontSize -> 7.5], {0.11, 10.5}, {Left, Center}]
    }]
  ];
  pC = ContourPlot[
    CDF[BetaDistribution[w*t0, w*(1 - t0) + 20], 0.10],
    {w, 1, 25}, {t0, 0.02, 0.40},
    Contours -> {0.50, 0.70, 0.80, 0.90, 0.95, 0.975},
    ContourShading -> None,
    ContourStyle -> {
      Directive[orange, AbsoluteThickness[1.1]],
      Directive[orange, AbsoluteThickness[1.1]],
      Directive[blue, AbsoluteThickness[1.1]],
      Directive[blue, AbsoluteThickness[1.1]],
      Directive[ink, AbsoluteThickness[1.1]],
      Directive[ink, AbsoluteThickness[1.1]]
    },
    ContourLabels -> Function[{x, y, z}, Text[Style[NumberForm[z, {3, 2}], ink, FontFamily -> "DejaVu Sans", FontSize -> 7], {x, y}, Background -> paper]],
    Epilog -> {
      green, AbsolutePointSize[6], Point[{22, 2/22}],
      Inset[Style["Beta(2, 20)", green, FontFamily -> "DejaVu Sans", FontSize -> 7.5, Bold], {19.5, 0.135}, {Right, Center}]
    },
    FrameLabel -> {lbl["Prior sample size w = a + b"], lbl["Prior mean \\[Theta]0 = a / w"]},
    PlotLabel -> ttl["Sensitivity: Pr(\\[Theta] < 0.10 | Y = 0)"],
    AspectRatio -> 0.82, ImageSize -> 240,
    Evaluate[Sequence @@ tufteBase]
  ];
  GraphicsRow[{pA, pB, pC}, Spacings -> 12, ImageSize -> 740, Background -> None]
]`
  },

  // ==================== CHAPTER 2 ====================
  {
    file: 'fig-ch02-skewness.svg',
    wl: `
Module[{mu = 10.75, sig = 0.8, modeV, medV, meanV, pA, pB},
  modeV = Exp[mu - sig^2]/1000.;
  medV = Exp[mu]/1000.;
  meanV = Exp[mu + sig^2/2]/1000.;
  pA = Plot[
    PDF[NormalDistribution[mu, sig], y], {y, 8.0, 13.5},
    PlotRange -> {{8.0, 13.5}, {0, 0.56}},
    PlotStyle -> Directive[ink, AbsoluteThickness[1.8]],
    Epilog -> {
      Directive[blue, Dashed, AbsoluteThickness[1.2]], Line[{{mu, 0}, {mu, 0.54}}],
      Inset[Style["Mean = Median = Mode = 10.75", blue, FontFamily -> "DejaVu Sans", FontSize -> 7.5], {10.9, 0.51}, {Left, Center}]
    },
    FrameLabel -> {lbl["y = log(income)"], lbl["p(y)"]},
    PlotLabel -> ttl["Normal(\\[Mu] = 10.75, \\[Sigma] = 0.8)"],
    AspectRatio -> 0.65, ImageSize -> 290,
    Evaluate[Sequence @@ tufteBase]
  ];
  pB = Plot[
    10^5 * PDF[LogNormalDistribution[mu, sig], 1000*x], {x, 1, 220},
    PlotRange -> {{0, 220}, {0, 1.55}},
    PlotStyle -> Directive[ink, AbsoluteThickness[1.8]],
    Epilog -> {
      Directive[green, Dotted, AbsoluteThickness[1.4]], Line[{{modeV, 0}, {modeV, 1.48}}],
      Directive[blue, Dashed, AbsoluteThickness[1.3]], Line[{{medV, 0}, {medV, 1.48}}],
      Directive[orange, DotDashed, AbsoluteThickness[1.3]], Line[{{meanV, 0}, {meanV, 1.48}}],
      Inset[Style["Mode = 24.6k", green, FontFamily -> "DejaVu Sans", FontSize -> 7.5], {135, 1.38}, {Left, Center}],
      Inset[Style["Median = 46.6k", blue, FontFamily -> "DejaVu Sans", FontSize -> 7.5], {135, 1.24}, {Left, Center}],
      Inset[Style["Mean = 64.2k", orange, FontFamily -> "DejaVu Sans", FontSize -> 7.5], {135, 1.10}, {Left, Center}]
    },
    FrameLabel -> {lbl["exp(y) (thousands of dollars)"], lbl["10^5 p(exp(y))"]},
    PlotLabel -> ttl["Lognormal (Right-Skewed)"],
    AspectRatio -> 0.65, ImageSize -> 290,
    Evaluate[Sequence @@ tufteBase]
  ];
  GraphicsRow[{pA, pB}, Spacings -> 16, ImageSize -> 600, Background -> None]
]`
  },

  // ==================== CHAPTER 3 ====================
  {
    file: 'fig-ch03-hpd-vs-quantile.svg',
    wl: `
Module[{d39 = BetaDistribution[3, 9], qLo, qHi, h95, h50, pA, pB, pC, ys = Range[0, 8]},
  qLo = Quantile[d39, 0.025]; qHi = Quantile[d39, 0.975];
  h95 = {l, u} /. FindRoot[{PDF[d39, l] == PDF[d39, u], CDF[d39, u] - CDF[d39, l] == 0.95}, {{l, 0.04}, {u, 0.48}}];
  h50 = {l, u} /. FindRoot[{PDF[d39, l] == PDF[d39, u], CDF[d39, u] - CDF[d39, l] == 0.50}, {{l, 0.14}, {u, 0.31}}];
  pA = Show[
    Plot[PDF[d39, th], {th, 0.001, 0.80},
      PlotRange -> {{0, 0.80}, {0, 3.7}},
      PlotStyle -> Directive[ink, AbsoluteThickness[1.7]],
      FrameLabel -> {lbl["\\[Theta]"], lbl["p(\\[Theta] | y)"]},
      PlotLabel -> ttl["Beta(3, 9): HPD vs. Equal-Tailed CI"],
      AspectRatio -> 0.82, ImageSize -> 240,
      Evaluate[Sequence @@ tufteBase]
    ],
    Plot[PDF[d39, th], {th, h95[[1]], h95[[2]]},
      PlotStyle -> None, Filling -> Axis, FillingStyle -> Directive[blue, Opacity[0.16]]],
    Graphics[{
      Directive[blue, AbsoluteThickness[1.6]], Line[{{h95[[1]], PDF[d39, h95[[1]]]}, {h95[[2]], PDF[d39, h95[[2]]]}}],
      Directive[green, AbsoluteThickness[1.4]], Line[{{h50[[1]], PDF[d39, h50[[1]]]}, {h50[[2]], PDF[d39, h50[[2]]]}}],
      Directive[orange, Dashed, AbsoluteThickness[1.1]], Line[{{qLo, 0}, {qLo, 3.5}}], Line[{{qHi, 0}, {qHi, 3.5}}],
      Inset[Style["95% HPD [0.041, 0.484]", blue, FontFamily -> "DejaVu Sans", FontSize -> 7], {0.42, 3.35}, {Left, Center}],
      Inset[Style["50% HPD [0.140, 0.312]", green, FontFamily -> "DejaVu Sans", FontSize -> 7], {0.42, 3.00}, {Left, Center}],
      Inset[Style["95% Quantile [0.060, 0.518]", orange, FontFamily -> "DejaVu Sans", FontSize -> 7], {0.42, 2.65}, {Left, Center}]
    }]
  ];
  pB = Plot[
    {PDF[GammaDistribution[2, 1], t],
     PDF[GammaDistribution[219, 1/112], t],
     PDF[GammaDistribution[68, 1/45], t]},
    {t, 0.8, 3.0},
    PlotRange -> {{0.8, 3.0}, {0, 3.4}},
    PlotStyle -> {
      Directive[faint, Dotted, AbsoluteThickness[1.3]],
      Directive[ink, AbsoluteThickness[1.8]],
      Directive[blue, AbsoluteThickness[1.8]]
    },
    PlotLegends -> Placed[
      LineLegend[
        {Directive[faint, Dotted, AbsoluteThickness[1.3]], Directive[ink, AbsoluteThickness[1.8]], Directive[blue, AbsoluteThickness[1.8]]},
        Style[#, ink, FontFamily -> "DejaVu Sans", FontSize -> 7] & /@ {"Prior Gamma(2, 1)", "No degree: Gamma(219, 112)", "Degree: Gamma(68, 45)"},
        LegendMarkerSize -> {14, 7}],
      Scaled[{0.96, 0.92}]
    ],
    FrameLabel -> {lbl["Mean fertility rate \\[Theta]"], lbl["p(\\[Theta] | y)"]},
    PlotLabel -> ttl["Population Means: Pr(\\[Theta]1 > \\[Theta]2 | y) = 0.97"],
    AspectRatio -> 0.82, ImageSize -> 240,
    Evaluate[Sequence @@ tufteBase]
  ];
  pC = BarChart[
    Transpose[{
      PDF[NegativeBinomialDistribution[219, 112/113], ys],
      PDF[NegativeBinomialDistribution[68, 45/46], ys]
    }],
    ChartStyle -> {ink, blue},
    ChartLayout -> "Grouped",
    BarSpacing -> {0.0, 0.3},
    ChartLabels -> {Placed[Style[#, muted, FontFamily -> "DejaVu Sans", FontSize -> 7.5] & /@ ys, Below], None},
    ChartLegends -> Placed[
      SwatchLegend[{ink, blue},
        Style[#, ink, FontFamily -> "DejaVu Sans", FontSize -> 7.5] & /@ {"No degree", "Degree"},
        LegendMarkerSize -> 8],
      Scaled[{0.94, 0.90}]
    ],
    FrameLabel -> {lbl["Future count y~"], lbl["p(y~ | y)"]},
    PlotLabel -> ttl["Predictives: Pr(Y~1 > Y~2 | y) = 0.48"],
    AspectRatio -> 0.82, ImageSize -> 240,
    Evaluate[Sequence @@ tufteBase]
  ];
  GraphicsRow[{pA, pB, pC}, Spacings -> 12, ImageSize -> 740, Background -> None]
]`
  },

  // ==================== CHAPTER 4 ====================
  {
    file: 'fig-ch04-mc-convergence.svg',
    wl: `
Module[{s = 2000, aP = 68., bP = 45., draws, idxs, cMean, cProb, tMean, tProb, hiBand, loBand,
        thDraws, yRep, n1, n2, tVals, ppdP, pA, pB, pC},
  SeedRandom[42];
  draws = RandomVariate[GammaDistribution[aP, 1/bP], s];
  idxs = Range[10, s, 4];
  cMean = Transpose[{idxs, (Accumulate[draws]/Range[s])[[idxs]]}];
  cProb = Transpose[{idxs, (Accumulate[Boole[Thread[draws < 1.75]]]/Range[s])[[idxs]]}];
  tMean = aP/bP;
  tProb = CDF[GammaDistribution[aP, 1/bP], 1.75];
  hiBand = Transpose[{idxs, tMean + 2*Sqrt[aP/bP^2]/Sqrt[N[idxs]]}];
  loBand = Transpose[{idxs, tMean - 2*Sqrt[aP/bP^2]/Sqrt[N[idxs]]}];
  pA = Show[
    ListLinePlot[{loBand, hiBand}, PlotStyle -> None, Filling -> {1 -> {{2}, Directive[blue, Opacity[0.14]]}},
      PlotRange -> {{10, s}, {1.40, 1.62}},
      FrameLabel -> {lbl["Monte Carlo draws S"], lbl["Cumulative mean"]},
      PlotLabel -> ttl["MC Convergence of E[\\[Theta] | y]"],
      AspectRatio -> 0.82, ImageSize -> 240,
      Evaluate[Sequence @@ tufteBase]
    ],
    ListLinePlot[cMean, PlotStyle -> Directive[ink, AbsoluteThickness[1.2]]],
    Graphics[{
      Directive[blue, Dashed, AbsoluteThickness[1.1]], Line[{{10, tMean}, {s, tMean}}],
      Inset[Style["Exact = 1.511 (+/- 2 MCSE)", blue, FontFamily -> "DejaVu Sans", FontSize -> 7], {1950, 1.60}, {Right, Center}]
    }]
  ];
  pB = Show[
    ListLinePlot[cProb, PlotStyle -> Directive[ink, AbsoluteThickness[1.2]],
      PlotRange -> {{10, s}, {0.84, 0.96}},
      FrameLabel -> {lbl["Monte Carlo draws S"], lbl["Cumulative Pr(\\[Theta] < 1.75)"]},
      PlotLabel -> ttl["MC Convergence of Tail Probability"],
      AspectRatio -> 0.82, ImageSize -> 240,
      Evaluate[Sequence @@ tufteBase]
    ],
    Graphics[{
      Directive[green, Dashed, AbsoluteThickness[1.1]], Line[{{10, tProb}, {s, tProb}}],
      Inset[Style["Exact = 0.900", green, FontFamily -> "DejaVu Sans", FontSize -> 7.5], {1950, 0.855}, {Right, Center}]
    }]
  ];
  thDraws = RandomVariate[GammaDistribution[219, 1/112.], 12000];
  tVals = Table[
    yRep = RandomVariate[PoissonDistribution[th], 111];
    n1 = Count[yRep, 1]; n2 = Count[yRep, 2];
    N[n2 / Max[n1, 1]],
    {th, thDraws}
  ];
  ppdP = N[Mean[Boole[Thread[tVals >= 2.0]]]];
  pC = Histogram[tVals, {0.3, 2.4, 0.07}, "PDF",
    ChartStyle -> Directive[blue, Opacity[0.35], EdgeForm[Directive[blue, AbsoluteThickness[0.5]]]],
    PlotRange -> {{0.3, 2.4}, {0, 2.4}},
    Epilog -> {
      Directive[orange, AbsoluteThickness[1.9]], Line[{{2.0, 0}, {2.0, 2.35}}],
      Inset[Style["Observed t = 2.0\\nTail p = " <> ToString[NumberForm[ppdP, {4, 4}]], orange, FontFamily -> "DejaVu Sans", FontSize -> 7.5], {1.95, 2.05}, {Right, Center}]
    },
    FrameLabel -> {lbl["t(y~) = #{y~=2} / #{y~=1}"], lbl["Density"]},
    PlotLabel -> ttl["Posterior Predictive Check (Poisson Fit)"],
    AspectRatio -> 0.82, ImageSize -> 240,
    Evaluate[Sequence @@ tufteBase]
  ];
  GraphicsRow[{pA, pB, pC}, Spacings -> 12, ImageSize -> 740, Background -> None]
]`
  },

  // ==================== CHAPTER 5 ====================
  {
    file: 'fig-ch05-mse-tradeoff.svg',
    wl: `
Module[{ym = {1.64, 1.70, 1.72, 1.74, 1.82, 1.82, 1.82, 1.90, 2.08},
        n = 9., ybar, s2, kn = 10., nun = 10., mun, s2n, pA, pB, pC},
  ybar = Mean[ym]; s2 = Variance[ym];
  mun = (1.9 + n*ybar)/kn;
  s2n = (0.01 + (n - 1)*s2 + n*(ybar - 1.9)^2/kn)/nun;
  pA = ContourPlot[
    PDF[NormalDistribution[mun, Sqrt[v/kn]], th] * PDF[InverseGammaDistribution[nun/2, nun*s2n/2], v],
    {th, 1.62, 2.02}, {v, 0.004, 0.045},
    Contours -> 7, ContourShading -> None,
    ContourStyle -> Directive[ink, AbsoluteThickness[0.95]],
    Epilog -> {blue, AbsolutePointSize[5], Point[{mun, s2n*nun/(nun + 2)}]},
    FrameLabel -> {lbl["Mean wing length \\[Theta] (mm)"], lbl["Variance \\[Sigma]^2"]},
    PlotLabel -> ttl["Midge Joint Posterior p(\\[Theta], \\[Sigma]^2 | y)"],
    AspectRatio -> 0.82, ImageSize -> 240,
    Evaluate[Sequence @@ tufteBase]
  ];
  pB = Plot[
    {1,
     ((nV/(1 + nV))^2*(169/nV) + (1/(1 + nV))^2*144)/(169/nV),
     ((nV/(2 + nV))^2*(169/nV) + (2/(2 + nV))^2*144)/(169/nV),
     ((nV/(3 + nV))^2*(169/nV) + (3/(3 + nV))^2*144)/(169/nV)},
    {nV, 1, 50},
    PlotRange -> {{1, 50}, {0.5, 1.15}},
    PlotStyle -> {
      Directive[faint, Dotted, AbsoluteThickness[1.2]],
      Directive[blue, AbsoluteThickness[1.6]],
      Directive[green, Dashed, AbsoluteThickness[1.6]],
      Directive[orange, DotDashed, AbsoluteThickness[1.6]]
    },
    PlotLegends -> Placed[
      LineLegend[
        {Directive[faint, Dotted, AbsoluteThickness[1.2]], Directive[blue, AbsoluteThickness[1.6]],
         Directive[green, Dashed, AbsoluteThickness[1.6]], Directive[orange, DotDashed, AbsoluteThickness[1.6]]},
        Style[#, ink, FontFamily -> "DejaVu Sans", FontSize -> 7.2] & /@ {"\\[Kappa]0 = 0 (ybar)", "\\[Kappa]0 = 1", "\\[Kappa]0 = 2", "\\[Kappa]0 = 3"},
        LegendMarkerSize -> {14, 7}],
      Scaled[{0.96, 0.10}]
    ],
    FrameLabel -> {lbl["Sample size n"], lbl["MSE(\\[Theta]hat_b) / MSE(ybar)"]},
    PlotLabel -> ttl["Relative MSE (\\[Theta]0 = 112, \\[Mu]0 = 100)"],
    AspectRatio -> 0.82, ImageSize -> 240,
    Evaluate[Sequence @@ tufteBase]
  ];
  pC = Plot[
    {PDF[NormalDistribution[112, Sqrt[169/10]], x],
     PDF[NormalDistribution[(10*112 + 100)/11, (10/11)*Sqrt[169/10]], x],
     PDF[NormalDistribution[(10*112 + 300)/13, (10/13)*Sqrt[169/10]], x]},
    {x, 96, 126},
    PlotRange -> {{96, 126}, {0, 0.145}},
    PlotStyle -> {
      Directive[ink, Dashed, AbsoluteThickness[1.5]],
      Directive[blue, AbsoluteThickness[1.7]],
      Directive[orange, DotDashed, AbsoluteThickness[1.6]]
    },
    Epilog -> {Directive[faint, Dotted, AbsoluteThickness[1.2]], Line[{{112, 0}, {112, 0.14}}]},
    PlotLegends -> Placed[
      LineLegend[
        {Directive[ink, Dashed, AbsoluteThickness[1.5]], Directive[blue, AbsoluteThickness[1.7]], Directive[orange, DotDashed, AbsoluteThickness[1.6]]},
        Style[#, ink, FontFamily -> "DejaVu Sans", FontSize -> 7] & /@ {"ybar (\\[Kappa]0=0)", "\\[Kappa]0=1 (lowest MSE)", "\\[Kappa]0=3 (over-shrunk)"},
        LegendMarkerSize -> {13, 7}],
      Scaled[{0.04, 0.94}]
    ],
    FrameLabel -> {lbl["Estimate of town mean IQ"], lbl["Sampling density"]},
    PlotLabel -> ttl["Bias-Variance Trade-off (n = 10)"],
    AspectRatio -> 0.82, ImageSize -> 240,
    Evaluate[Sequence @@ tufteBase]
  ];
  GraphicsRow[{pA, pB, pC}, Spacings -> 12, ImageSize -> 740, Background -> None]
]`
  },

  // ==================== CHAPTER 6 ====================
  {
    file: 'fig-ch06-gibbs-diagnostics.svg',
    wl: `
Module[{y = {1.64, 1.70, 1.72, 1.74, 1.82, 1.82, 1.82, 1.90, 2.08},
        n = 9., ybar, s2, mu0 = 1.9, t20 = 0.95^2, s20 = 0.01, nu0 = 1.,
        phi, thCur = 1.66, prCur = 20., t2n, mun, ss,
        w = {0.45, 0.10, 0.45}, ms = {-3., 0., 3.}, sdM = Sqrt[1/3.],
        thMix, dCur = 1, thC, probs, pA, pB, pC},
  SeedRandom[7];
  ybar = Mean[y]; s2 = Variance[y];
  phi = Table[
    If[s > 1,
      t2n = 1./(1./t20 + n*prCur);
      mun = t2n*(mu0/t20 + n*ybar*prCur);
      thCur = RandomVariate[NormalDistribution[mun, Sqrt[t2n]]];
      ss = nu0*s20 + (n - 1)*s2 + n*(ybar - thCur)^2;
      prCur = RandomVariate[GammaDistribution[(nu0 + n)/2., 2./ss]];
    ];
    {thCur, prCur},
    {s, 1, 500}
  ];
  thMix = Table[
    thC = RandomVariate[NormalDistribution[ms[[dCur]], sdM]];
    probs = w * (PDF[NormalDistribution[#, sdM], thC] & /@ ms);
    dCur = RandomChoice[probs -> {1, 2, 3}];
    thC,
    {1500}
  ];
  pA = Show[
    ContourPlot[
      -(th - mu0)^2/(2*t20) + (nu0/2 - 1 + n/2)*Log[pr] - 0.5*pr*(nu0*s20 + (n - 1)*s2 + n*(ybar - th)^2),
      {th, 1.64, 1.98}, {pr, 8, 145},
      Contours -> 6, ContourShading -> None,
      ContourStyle -> Directive[faint, AbsoluteThickness[0.75]],
      FrameLabel -> {lbl["Mean \\[Theta]"], lbl["Precision 1/\\[Sigma]^2"]},
      PlotLabel -> ttl["Semiconjugate Gibbs Trajectory"],
      AspectRatio -> 0.82, ImageSize -> 240,
      Evaluate[Sequence @@ tufteBase]
    ],
    ListPlot[phi[[21 ;; 240]], PlotStyle -> Directive[blue, Opacity[0.35], AbsolutePointSize[3]]],
    ListLinePlot[phi[[1 ;; 20]], PlotStyle -> Directive[orange, AbsoluteThickness[1.1]], PlotMarkers -> {Automatic, 3.5}]
  ];
  pB = Show[
    Histogram[thMix, {-5.5, 5.5, 0.275}, "PDF",
      ChartStyle -> Directive[orange, Opacity[0.35], EdgeForm[Directive[orange, AbsoluteThickness[0.4]]]],
      PlotRange -> {{-5.5, 5.5}, {0, 0.55}},
      FrameLabel -> {lbl["\\[Theta]"], lbl["p(\\[Theta])"]},
      PlotLabel -> ttl["Slow Mixing in Multimodal Target"],
      AspectRatio -> 0.82, ImageSize -> 240,
      Evaluate[Sequence @@ tufteBase]
    ],
    Plot[Sum[w[[k]]*PDF[NormalDistribution[ms[[k]], sdM], x], {k, 1, 3}], {x, -5.5, 5.5},
      PlotStyle -> Directive[ink, AbsoluteThickness[1.6]]]
  ];
  pC = ListLinePlot[Transpose[{Range[1, 1500, 2], thMix[[1 ;; 1500 ;; 2]]}],
    PlotRange -> {{0, 1500}, {-5.5, 5.5}},
    PlotStyle -> Directive[ink, AbsoluteThickness[0.65]],
    FrameLabel -> {lbl["Gibbs iteration s"], lbl["\\[Theta]^(s)"]},
    PlotLabel -> ttl["Traceplot: High Autocorrelation"],
    AspectRatio -> 0.82, ImageSize -> 240,
    Evaluate[Sequence @@ tufteBase]
  ];
  GraphicsRow[{pA, pB, pC}, Spacings -> 12, ImageSize -> 740, Background -> None]
]`
  },

  // ==================== CHAPTER 7 ====================
  {
    file: 'fig-ch07-mvn-contours.svg',
    wl: `
Module[{mu = {50., 50.}, s1 = 8., s2 = 12., panels},
  SeedRandom[11];
  panels = MapThread[
    Function[{rho, col, showY},
      Module[{cov = {{s1^2, rho*s1*s2}, {rho*s1*s2, s2^2}}, dist, pts, sl = rho*s2/s1},
        dist = MultinormalDistribution[mu, cov];
        pts = RandomVariate[dist, 35];
        Show[
          ContourPlot[PDF[dist, {x1, x2}], {x1, 22, 78}, {x2, 12, 88},
            Contours -> 5, ContourShading -> None,
            ContourStyle -> Directive[col, AbsoluteThickness[1.05]],
            FrameLabel -> {lbl["y1"], If[showY, lbl["y2"], None]},
            PlotLabel -> ttl["\\[Rho] = " <> ToString[NumberForm[rho, {3, 1}]] <> " (cov = " <> ToString[Round[rho*s1*s2]] <> ")"],
            AspectRatio -> 0.82, ImageSize -> 240,
            Evaluate[Sequence @@ tufteBase]
          ],
          ListPlot[pts, PlotStyle -> Directive[ink, Opacity[0.6], AbsolutePointSize[4]]],
          Plot[50 + sl*(x1 - 50), {x1, 22, 78}, PlotStyle -> Directive[col, Dashed, AbsoluteThickness[1.15]]],
          Graphics[{Inset[Style["slope = " <> ToString[NumberForm[sl, {3, 2}]], col, FontFamily -> "DejaVu Sans", FontSize -> 7.5], {75, 18}, {Right, Center}]}]
        ]
      ]
    ],
    {{-0.5, 0.0, 0.5}, {orange, ink, blue}, {True, False, False}}
  ];
  GraphicsRow[panels, Spacings -> 10, ImageSize -> 740, Background -> None]
]`
  },

  // ==================== CHAPTER 8 ====================
  {
    file: 'fig-ch08-shrinkage.svg',
    wl: `
Module[{m = 60, muT = 48.1, tauT = 5.0, sigT = 9.2, nj, thT, yb, Bj, thHat, pA, pB, pC},
  SeedRandom[19];
  nj = RandomInteger[{5, 31}, m];
  thT = RandomVariate[NormalDistribution[muT, tauT], m];
  yb = MapThread[RandomVariate[NormalDistribution[#1, sigT/Sqrt[#2]]] &, {thT, nj}];
  Bj = (nj/sigT^2)/(nj/sigT^2 + 1/tauT^2);
  thHat = Bj*yb + (1 - Bj)*muT;
  pA = Graphics[{
    (* Edges *)
    Directive[muted, AbsoluteThickness[0.9], Arrowheads[0.045]],
    Arrow[{{2.6, 7.45}, {1.8, 5.85}}],
    Arrow[{{3.3, 7.4}, {4.2, 5.85}}],
    Arrow[{{3.7, 7.7}, {6.5, 5.6}}],
    Arrow[{{1.6, 3.95}, {1.6, 2.45}}],
    Arrow[{{4.4, 3.95}, {4.4, 2.45}}],
    Arrow[{{7.2, 3.95}, {7.2, 2.45}}],
    Arrow[{{7.2, 7.45}, {2.2, 2.3}}],
    Arrow[{{7.4, 7.4}, {4.9, 2.3}}],
    Arrow[{{7.65, 7.35}, {7.3, 2.45}}],
    (* Nodes *)
    {FaceForm[paper], EdgeForm[Directive[blue, AbsoluteThickness[1.4]]], Disk[{3.0, 8.3}, 0.95]},
    {FaceForm[paper], EdgeForm[Directive[orange, AbsoluteThickness[1.4]]], Disk[{7.7, 8.3}, 0.95]},
    {FaceForm[paper], EdgeForm[Directive[ink, AbsoluteThickness[1.3]]], Disk[{1.6, 4.9}, 0.95], Disk[{4.4, 4.9}, 0.95], Disk[{7.2, 4.9}, 0.95]},
    {FaceForm[paper], EdgeForm[Directive[green, AbsoluteThickness[1.4]]], Disk[{1.6, 1.5}, 0.95], Disk[{4.4, 1.5}, 0.95], Disk[{7.2, 1.5}, 0.95]},
    (* Labels *)
    Text[Style["\\[Mu], \\[Tau]^2", ink, FontFamily -> "DejaVu Sans", FontSize -> 8.5], {3.0, 8.3}],
    Text[Style["\\[Sigma]^2", ink, FontFamily -> "DejaVu Sans", FontSize -> 8.5], {7.7, 8.3}],
    Text[Style["\\[Theta]1", ink, FontFamily -> "DejaVu Sans", FontSize -> 8.5], {1.6, 4.9}],
    Text[Style["\\[Theta]j", ink, FontFamily -> "DejaVu Sans", FontSize -> 8.5], {4.4, 4.9}],
    Text[Style["\\[Theta]m", ink, FontFamily -> "DejaVu Sans", FontSize -> 8.5], {7.2, 4.9}],
    Text[Style["y1", ink, FontFamily -> "DejaVu Sans", FontSize -> 8.5, Bold], {1.6, 1.5}],
    Text[Style["yj", ink, FontFamily -> "DejaVu Sans", FontSize -> 8.5, Bold], {4.4, 1.5}],
    Text[Style["ym", ink, FontFamily -> "DejaVu Sans", FontSize -> 8.5, Bold], {7.2, 1.5}],
    Text[Style["...", muted, FontFamily -> "DejaVu Sans", FontSize -> 11], {3.0, 4.9}],
    Text[Style["...", muted, FontFamily -> "DejaVu Sans", FontSize -> 11], {5.8, 4.9}]
  }, PlotRange -> {{0, 9.4}, {0, 9.8}}, AspectRatio -> 0.85, ImageSize -> 240,
     PlotLabel -> ttl["Hierarchical Normal DAG"], Background -> None];
  pB = Show[
    ListPlot[Transpose[{yb, thHat}],
      PlotStyle -> Directive[blue, Opacity[0.8], AbsolutePointSize[4.5]],
      PlotRange -> {{34, 64}, {34, 64}},
      FrameLabel -> {lbl["Sample mean ybar_j"], lbl["Hierarchical mean \\[Theta]hat_j"]},
      PlotLabel -> ttl["Partial Pooling Shrinks Extremes"],
      AspectRatio -> 0.82, ImageSize -> 240,
      Evaluate[Sequence @@ tufteBase]
    ],
    Graphics[{
      Directive[faint, Dashed, AbsoluteThickness[1.0]], Line[{{34, 34}, {64, 64}}],
      Directive[orange, Dotted, AbsoluteThickness[1.2]], Line[{{34, muT}, {64, muT}}],
      Inset[Style["No pooling (y = x)", faint, FontFamily -> "DejaVu Sans", FontSize -> 7], {35.5, 61.5}, {Left, Center}],
      Inset[Style["Grand mean \\[Mu]hat", orange, FontFamily -> "DejaVu Sans", FontSize -> 7], {35.5, 58.5}, {Left, Center}]
    }]
  ];
  pC = Show[
    ListPlot[Transpose[{nj, yb - thHat}],
      PlotStyle -> Directive[blue, Opacity[0.8], AbsolutePointSize[4.5]],
      PlotRange -> {{3, 33}, {-9, 9}},
      FrameLabel -> {lbl["Group sample size nj"], lbl["Shrinkage ybar_j - \\[Theta]hat_j"]},
      PlotLabel -> ttl["Small Groups Borrow Most Strength"],
      AspectRatio -> 0.82, ImageSize -> 240,
      Evaluate[Sequence @@ tufteBase]
    ],
    Graphics[{Directive[faint, Dashed, AbsoluteThickness[0.9]], Line[{{3, 0}, {33, 0}}]}]
  ];
  GraphicsRow[{pA, pB, pC}, Spacings -> 12, ImageSize -> 740, Background -> None]
]`
  },

  // ==================== CHAPTER 9 ====================
  {
    file: 'fig-ch09-regression-bma.svg',
    wl: `
Module[{age = {23., 22., 22., 25., 27., 20., 31., 23., 27., 28., 22., 24.},
        grp = {0., 0., 0., 0., 0., 0., 1., 1., 1., 1., 1., 1.},
        y = {-0.87, -10.74, -3.27, -1.97, 7.50, -7.25, 17.05, 4.96, 10.40, 11.05, 0.26, 2.51},
        X, XtXinv, bOls, s2Ols, g = 12., nu0 = 1., ssrG, s2Draws, Vb, Eb, L, Z, bDraws, bMean,
        agesEv = Range[20, 31], diffs, qs, pA, pB, pC},
  SeedRandom[2026];
  X = Transpose[{ConstantArray[1., 12], grp, age, grp*age}];
  XtXinv = Inverse[Transpose[X].X];
  bOls = XtXinv.(Transpose[X].y);
  s2Ols = Total[(y - X.bOls)^2]/8.;
  ssrG = y.y - (g/(g + 1.))*(y.X.bOls);
  s2Draws = 1./RandomVariate[GammaDistribution[(nu0 + 12.)/2., 2./(nu0*s2Ols + ssrG)], 4000];
  Vb = (g/(g + 1.))*XtXinv;
  Eb = (g/(g + 1.))*bOls;
  L = Transpose[CholeskyDecomposition[Vb]];
  Z = RandomVariate[NormalDistribution[0, 1], {4000, 4}];
  bDraws = Table[Eb + (L.Z[[s]])*Sqrt[s2Draws[[s]]], {s, 4000}];
  bMean = Mean[bDraws];
  pA = Show[
    Plot[
      {bMean[[1]] + bMean[[3]]*a, (bMean[[1]] + bMean[[2]]) + (bMean[[3]] + bMean[[4]])*a},
      {a, 19.5, 31.5},
      PlotRange -> {{19.5, 31.5}, {-13, 20}},
      PlotStyle -> {Directive[ink, AbsoluteThickness[1.5]], Directive[blue, AbsoluteThickness[1.5]]},
      PlotLegends -> Placed[
        LineLegend[{Directive[ink, AbsoluteThickness[1.5]], Directive[blue, AbsoluteThickness[1.5]]},
          Style[#, ink, FontFamily -> "DejaVu Sans", FontSize -> 7.5] & /@ {"Running", "Aerobics"},
          LegendMarkerSize -> {14, 7}],
        Scaled[{0.06, 0.92}]
      ],
      FrameLabel -> {lbl["Age (years)"], lbl["\\[CapitalDelta] Max O2 uptake"]},
      PlotLabel -> ttl["Oxygen Uptake: g-Prior Fits"],
      AspectRatio -> 0.82, ImageSize -> 240,
      Evaluate[Sequence @@ tufteBase]
    ],
    ListPlot[{Transpose[{age[[1 ;; 6]], y[[1 ;; 6]]}], Transpose[{age[[7 ;; 12]], y[[7 ;; 12]]}]},
      PlotStyle -> {Directive[ink, AbsolutePointSize[5.5]], Directive[blue, AbsolutePointSize[6]]}]
  ];
  pB = Show[
    ListPlot[bDraws[[1 ;; 260, {2, 4}]],
      PlotStyle -> Directive[blue, Opacity[0.35], AbsolutePointSize[3.2]],
      FrameLabel -> {lbl["Intercept shift \\[Beta]2"], lbl["Slope shift \\[Beta]4"]},
      PlotLabel -> ttl["Strong Posterior Correlation (\\[Beta]2, \\[Beta]4)"],
      AspectRatio -> 0.82, ImageSize -> 240,
      Evaluate[Sequence @@ tufteBase]
    ],
    Graphics[{Directive[faint, Dotted, AbsoluteThickness[0.9]], InfiniteLine[{{0, 0}, {1, 0}}], InfiniteLine[{{0, 0}, {0, 1}}]}]
  ];
  qs = Table[
    diffs = bDraws[[All, 2]] + bDraws[[All, 4]]*a;
    {a, Quantile[diffs, 0.025], Median[diffs], Quantile[diffs, 0.975]},
    {a, agesEv}
  ];
  pC = Show[
    ListLinePlot[qs[[All, {1, 3}]],
      PlotStyle -> Directive[blue, AbsoluteThickness[1.3]],
      PlotRange -> {{19.5, 31.5}, {-10, 22}},
      FrameLabel -> {lbl["Age (years)"], lbl["Aerobics - Running"]},
      PlotLabel -> ttl["Group Contrast Across Age"],
      AspectRatio -> 0.82, ImageSize -> 240,
      Evaluate[Sequence @@ tufteBase]
    ],
    Graphics[{
      Directive[orange, Dashed, AbsoluteThickness[1.0]], Line[{{19.5, 0}, {31.5, 0}}],
      Directive[ink, AbsoluteThickness[1.4]], Table[Line[{{r[[1]], r[[2]]}, {r[[1]], r[[4]]}}], {r, qs}],
      blue, AbsolutePointSize[4.5], Point[qs[[All, {1, 3}]]]
    }]
  ];
  GraphicsRow[{pA, pB, pC}, Spacings -> 12, ImageSize -> 740, Background -> None]
]`
  },

  // ==================== CHAPTER 10 ====================
  {
    file: 'fig-ch10-mh-tuning.svg',
    wl: `
Module[{y = {9.37, 10.18, 9.16, 11.60, 10.33}, muP, sdP, runMH, panels},
  SeedRandom[101];
  muP = (5.*Mean[y] + 5./10.)/(5. + 1./10.);
  sdP = Sqrt[1./(5. + 1./10.)];
  runMH[d2_, S_] := Module[{th = 0., acc = 0, prop, lr, ch},
    ch = Table[
      prop = RandomVariate[NormalDistribution[th, Sqrt[d2]]];
      lr = Total[LogPDF[NormalDistribution[prop, 1.], y]] + LogPDF[NormalDistribution[5., Sqrt[10.]], prop]
         - Total[LogPDF[NormalDistribution[th, 1.], y]] - LogPDF[NormalDistribution[5., Sqrt[10.]], th];
      If[Log[RandomReal[]] < lr, th = prop; acc++];
      th,
      {S}
    ];
    {ch, N[acc/S]}
  ];
  panels = MapThread[
    Function[{d2, col, label, showY},
      Module[{res = runMH[d2, 600], ch, acc},
        {ch, acc} = res;
        Show[
          ListLinePlot[ch,
            PlotRange -> {{0, 600}, {-0.5, 13.0}},
            PlotStyle -> Directive[col, AbsoluteThickness[0.95]],
            FrameLabel -> {lbl["Iteration s"], If[showY, lbl["\\[Theta]^(s)"], None]},
            PlotLabel -> ttl[label <> " (acc = " <> ToString[Round[100*acc]] <> "%)"],
            AspectRatio -> 0.80, ImageSize -> 240,
            Evaluate[Sequence @@ tufteBase]
          ],
          Graphics[{
            Directive[faint, Opacity[0.14]], Rectangle[{0, muP - 2*sdP}, {600, muP + 2*sdP}],
            Directive[ink, Dashed, AbsoluteThickness[0.9]], Line[{{0, muP}, {600, muP}}]
          }]
        ]
      ]
    ],
    {{1./32., 2.0, 64.0}, {orange, blue, purple},
     {"Too small: \\[Delta]^2 = 1/32", "Balanced: \\[Delta]^2 = 2", "Too large: \\[Delta]^2 = 64"},
     {True, False, False}}
  ];
  GraphicsRow[panels, Spacings -> 10, ImageSize -> 740, Background -> None]
]`
  },

  // ==================== CHAPTER 11 ====================
  {
    file: 'fig-ch11-uncertainty-layers.svg',
    wl: `
Module[{xs = Subdivide[0.05, 0.95, 39], fTrue, S = 1200, Xp, thD, bD, lam1, lam2, yP, makePanel},
  SeedRandom[111];
  fTrue = -0.3 + 2.6*xs + 1.5*xs^2 - 3.8*xs^3 + 0.5*xs^4;
  Xp = Transpose[{ConstantArray[1., 40], xs, xs^2}];
  thD = Transpose[{
    RandomVariate[NormalDistribution[0, 0.09], S],
    RandomVariate[NormalDistribution[0, 0.12], S],
    RandomVariate[NormalDistribution[0, 0.10], S]
  }];
  bD = thD + Transpose[{
    RandomVariate[NormalDistribution[0, 0.35], S],
    RandomVariate[NormalDistribution[0, 0.25], S],
    RandomVariate[NormalDistribution[0, 0.20], S]
  }];
  lam1 = Exp[Outer[Plus, ConstantArray[0., S], fTrue] + thD.Transpose[Xp]];
  lam2 = Exp[Outer[Plus, ConstantArray[0., S], fTrue] + bD.Transpose[Xp]];
  yP = Map[RandomVariate[PoissonDistribution[#]] &, lam2, {2}];
  makePanel[arr_, col_, title_, showY_] := Module[{lo, med, hi},
    lo = Transpose[{xs, Quantile[#, 0.025] & /@ Transpose[arr]}];
    med = Transpose[{xs, Median /@ Transpose[arr]}];
    hi = Transpose[{xs, Quantile[#, 0.975] & /@ Transpose[arr]}];
    Show[
      ListLinePlot[{lo, hi}, PlotStyle -> None, Filling -> {1 -> {{2}, Directive[col, Opacity[0.24]]}},
        PlotRange -> {{0.05, 0.95}, {0, 14}},
        FrameLabel -> {lbl["Location x"], If[showY, lbl["Count / Expected Count"], None]},
        PlotLabel -> ttl[title],
        AspectRatio -> 0.82, ImageSize -> 240,
        Evaluate[Sequence @@ tufteBase]
      ],
      ListLinePlot[med, PlotStyle -> Directive[ink, AbsoluteThickness[1.6]]]
    ]
  ];
  GraphicsRow[{
    makePanel[lam1, blue, "1. Typical group rate exp(\\[Theta]^T x)", True],
    makePanel[lam2, green, "2. New group rate exp(\\[Beta]~^T x)", False],
    makePanel[yP, orange, "3. New observation Y~ | x", False]
  }, Spacings -> 10, ImageSize -> 740, Background -> None]
]`
  },

  // ==================== CHAPTER 12 ====================
  {
    file: 'fig-ch12-probit-copula.svg',
    wl: `
Module[{muZ = 0.45, gs = {-1.2, -0.1, 0.9, 1.8}, bnds, cols, pA, pB,
        Z, U1, Y1, Y2, jit, meds},
  SeedRandom[121];
  bnds = {-3.2, -1.2, -0.1, 0.9, 1.8, 3.5};
  cols = {faint, blue, green, orange, purple};
  pA = Show[
    Plot[PDF[NormalDistribution[muZ, 1.], z], {z, -3.2, 3.5},
      PlotRange -> {{-3.2, 3.5}, {0, 0.48}},
      PlotStyle -> Directive[ink, AbsoluteThickness[1.7]],
      FrameLabel -> {lbl["Latent variable Z_i ~ N(\\[Beta]^T x_i, 1)"], lbl["Density"]},
      PlotLabel -> ttl["Ordered Probit: Latent Z Partitioned by Thresholds"],
      AspectRatio -> 0.65, ImageSize -> 300,
      Evaluate[Sequence @@ tufteBase]
    ],
    Sequence @@ Table[
      Plot[PDF[NormalDistribution[muZ, 1.], z], {z, bnds[[k]], bnds[[k + 1]]},
        PlotStyle -> None, Filling -> Axis, FillingStyle -> Directive[cols[[k]], Opacity[0.22]]],
      {k, 1, 5}
    ],
    Graphics[{
      Directive[muted, Dashed, AbsoluteThickness[0.9]],
      Table[Line[{{gs[[k]], 0}, {gs[[k]], 0.41}}], {k, 1, 4}],
      Table[Inset[Style["g" <> ToString[k], muted, FontFamily -> "DejaVu Sans", FontSize -> 7.5], {gs[[k]], 0.435}], {k, 1, 4}],
      Table[Inset[Style["Y=" <> ToString[k], ink, FontFamily -> "DejaVu Sans", FontSize -> 7.5],
        {0.5*(Max[bnds[[k]], -2.5] + Min[bnds[[k + 1]], 2.9]), 0.045}], {k, 1, 5}]
    }]
  ];
  Z = RandomVariate[MultinormalDistribution[{0, 0}, {{1, 0.68}, {0.68, 1}}], 220];
  U1 = CDF[NormalDistribution[0, 1], Z[[All, 1]]];
  Y1 = (1 + Total[Boole[Thread[# >= {0.15, 0.45, 0.70, 0.88}]]] &) /@ U1;
  Y2 = Exp[0.55*Z[[All, 2]]]*30.;
  jit = RandomReal[{-0.18, 0.18}, 220];
  meds = Table[{lvl, Median[Pick[Y2, Y1, lvl]]}, {lvl, 1, 5}];
  pB = Show[
    ListPlot[Transpose[{Y1 + jit, Y2}],
      PlotStyle -> Directive[blue, Opacity[0.55], AbsolutePointSize[4]],
      PlotRange -> {{0.4, 5.6}, {0, 160}},
      FrameTicks -> {{Automatic, None}, {{1, 2, 3, 4, 5}, None}},
      FrameLabel -> {lbl["Ordinal Y1 = g1(Z1) in {1,...,5}"], lbl["Skewed Y2 = g2(Z2)"]},
      PlotLabel -> ttl["Gaussian Copula (C12 = 0.68): Mixed Margins"],
      AspectRatio -> 0.65, ImageSize -> 300,
      Evaluate[Sequence @@ tufteBase]
    ],
    Graphics[{
      Directive[orange, AbsoluteThickness[2.2]],
      Table[Line[{{m[[1]] - 0.28, m[[2]]}, {m[[1]] + 0.28, m[[2]]}}], {m, meds}]
    }]
  ];
  GraphicsRow[{pA, pB}, Spacings -> 16, ImageSize -> 620, Background -> None]
]`
  },
]

async function main() {
  const wasmBytes = await readFile(WASM_PATH)
  const wxf = await WXF.load(wasmBytes)
  const sock = await WolframSocket.open(URL_WS, wxf)
  try {
    const pre = await sock.evaluate(WL_PREAMBLE)
    if (pre.messages?.length) {
      throw new Error('Preamble messages: ' + pre.messages.join('; '))
    }
    for (const fig of FIGURES) {
      const t0 = Date.now()
      const reply = await sock.evaluate(fig.wl)
      if (reply.messages?.length) {
        console.warn(`WARN [${fig.file}]:`, reply.messages)
      }
      if (!reply.image || reply.image.format !== 'SVG' || typeof reply.image.data !== 'string') {
        throw new Error(`No SVG image returned for ${fig.file} (format=${reply.image?.format})`)
      }
      if (reply.image.data.includes('data:image/png;base64,')) {
        console.warn(`NOTE [${fig.file}]: rasterized PNG-in-SVG (exceeded 500 kB vector threshold)`)
      }
      const cleanSvg = postprocessSvg(reply.image.data)
      const outPath = path.join(__dirname, fig.file)
      await writeFile(outPath, cleanSvg, 'utf8')
      const kb = Math.round(Buffer.byteLength(cleanSvg, 'utf8') / 1024)
      console.log(`Saved ${fig.file.padEnd(32)} (${String(kb).padStart(3)} kB, ${((Date.now() - t0)/1000).toFixed(1)}s)`)
    }
    console.log(`\nAll ${FIGURES.length} Wolfram SVG figures generated successfully.`)
  } finally {
    sock.close()
  }
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})
