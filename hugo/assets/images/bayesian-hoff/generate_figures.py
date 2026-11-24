"""Generate publication-quality, dark-mode-aware SVG figures for the
Bayesian Statistical Methods (Companion to Hoff 2009) Hugo book.
"""

import os
import re
import numpy as np
from scipy import stats
from scipy.optimize import brentq
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
from matplotlib.patches import FancyBboxPatch, FancyArrowPatch, Circle

OUT_DIR = os.path.dirname(os.path.abspath(__file__))
os.makedirs(OUT_DIR, exist_ok=True)

# Tufte-inspired palette (matching bottom-k-sketches)
INK = "#111111"
MUTED = "#555555"
FAINT = "#888888"
GRID = "#e3e3e3"
BLUE = "#2a78d6"
ORANGE = "#eb6834"
GREEN = "#16a070"
PURPLE = "#6b4a8f"
PAPER = "#fffff8"

DARK_CSS = (
    "<style>@media (prefers-color-scheme: dark){"
    '[style*="fill: #111111"]{fill:#dddddd!important}'
    '[style*="stroke: #111111"]{stroke:#dddddd!important}'
    '[style*="fill: #555555"]{fill:#aaaaaa!important}'
    '[style*="stroke: #555555"]{stroke:#aaaaaa!important}'
    '[style*="fill: #888888"]{fill:#8f8f8f!important}'
    '[style*="stroke: #888888"]{stroke:#8f8f8f!important}'
    '[style*="fill: #e3e3e3"]{fill:#333333!important}'
    '[style*="stroke: #e3e3e3"]{stroke:#333333!important}'
    '[style*="fill: #2a78d6"]{fill:#5ca0f0!important}'
    '[style*="stroke: #2a78d6"]{stroke:#5ca0f0!important}'
    '[style*="fill: #eb6834"]{fill:#f08458!important}'
    '[style*="stroke: #eb6834"]{stroke:#f08458!important}'
    '[style*="fill: #16a070"]{fill:#3cc493!important}'
    '[style*="stroke: #16a070"]{stroke:#3cc493!important}'
    '[style*="fill: #6b4a8f"]{fill:#bba1dc!important}'
    '[style*="stroke: #6b4a8f"]{stroke:#bba1dc!important}'
    '[style*="fill: #fffff8"]{fill:#151515!important}'
    '[style*="stroke: #fffff8"]{stroke:#151515!important}'
    "}</style>"
)

plt.rcParams.update({
    "font.family": "sans-serif",
    "font.sans-serif": ["DejaVu Sans"],
    "mathtext.fontset": "stix",
    "font.size": 8.5,
    "axes.titlesize": 9.5,
    "axes.labelsize": 8.5,
    "xtick.labelsize": 7.5,
    "ytick.labelsize": 7.5,
    "legend.fontsize": 7.5,
    "axes.edgecolor": MUTED,
    "axes.linewidth": 0.7,
    "text.color": INK,
    "axes.labelcolor": INK,
    "xtick.color": MUTED,
    "ytick.color": MUTED,
    "figure.facecolor": "none",
    "axes.facecolor": "none",
    "savefig.transparent": True,
    "svg.fonttype": "path",
})


def style_ax(ax, grid=False):
    ax.spines["top"].set_visible(False)
    ax.spines["right"].set_visible(False)
    ax.spines["left"].set_color(MUTED)
    ax.spines["bottom"].set_color(MUTED)
    ax.tick_params(direction="out", length=3, width=0.6, colors=MUTED)
    if grid:
        ax.grid(True, color=GRID, linewidth=0.5, linestyle="--", alpha=0.8)


def save_svg(fig, filename):
    path = os.path.join(OUT_DIR, filename)
    fig.savefig(path, format="svg", bbox_inches="tight", pad_inches=0.06, transparent=True)
    plt.close(fig)
    with open(path, "r", encoding="utf-8") as f:
        svg = f.read()
    # Inject dark-mode style right after opening <svg ...>
    svg = re.sub(r"(<svg\b[^>]*>)", r"\1" + DARK_CSS, svg, count=1)
    with open(path, "w", encoding="utf-8") as f:
        f.write(svg)
    print(f"Saved {filename} ({os.path.getsize(path) // 1024} kB)")


# ----------------------------------------------------------------------
# Frontispiece: Bayesian updating from diffuse prior through data to posterior
# ----------------------------------------------------------------------
def make_frontispiece():
    fig, ax = plt.subplots(figsize=(6.4, 2.5))
    x = np.linspace(0.001, 0.999, 600)
    # Sequence of Beta updates for true theta = 0.35
    stages = [
        (2, 2, FAINT, "--", 1.1, "Prior: Beta(2, 2)"),
        (2 + 4, 2 + 6, ORANGE, "-.", 1.3, "After n = 10 (y = 4)"),
        (2 + 18, 2 + 32, BLUE, "-", 1.6, "After n = 50 (y = 18)"),
        (2 + 70, 2 + 130, INK, "-", 2.0, "After n = 200 (y = 70)"),
    ]
    for a, b, col, ls, lw, lab in stages:
        y = stats.beta.pdf(x, a, b)
        ax.plot(x, y, color=col, linestyle=ls, linewidth=lw, label=lab)
        if col == INK:
            ax.fill_between(x, 0, y, color=BLUE, alpha=0.12)
    ax.axvline(0.35, color=GREEN, linestyle=":", linewidth=1.1, label=r"True $\theta = 0.35$")
    ax.set_xlim(0, 1)
    ax.set_ylim(0, None)
    ax.set_xlabel(r"Parameter $\theta$")
    ax.set_ylabel(r"Density $p(\theta \mid y_{1:n})$")
    ax.set_title("Sequential Bayesian Learning: Posterior Concentration with Increasing Data")
    ax.legend(frameon=False, loc="upper right")
    style_ax(ax)
    save_svg(fig, "frontispiece.svg")


# ----------------------------------------------------------------------
# Chapter 1: Rare-event infection rate (Beta(2,20) -> Beta(2,40) + sensitivity)
# ----------------------------------------------------------------------
def make_ch01():
    fig, axes = plt.subplots(1, 3, figsize=(9.2, 2.7))

    # Panel A: Binomial(20, theta)
    ax = axes[0]
    k = np.arange(0, 13)
    w = 0.26
    for idx, (th, col) in enumerate([(0.05, INK), (0.10, BLUE), (0.20, ORANGE)]):
        ax.bar(k + (idx - 1) * w, stats.binom.pmf(k, 20, th), width=w, color=col, alpha=0.85,
               label=rf"$\theta = {th:.2f}$")
    ax.set_xlabel("Infected in sample ($y$)")
    ax.set_ylabel(r"$p(y \mid \theta)$")
    ax.set_title("Sampling Model: Binomial(20, $\\theta$)")
    ax.legend(frameon=False)
    style_ax(ax)

    # Panel B: Beta(2, 20) prior vs Beta(2, 40) posterior given y = 0
    ax = axes[1]
    th = np.linspace(0, 0.35, 400)
    ax.plot(th, stats.beta.pdf(th, 2, 20), color=FAINT, linestyle="--", linewidth=1.4,
            label="Prior Beta(2, 20)")
    p_post = stats.beta.pdf(th, 2, 40)
    ax.plot(th, p_post, color=INK, linewidth=1.8, label="Posterior Beta(2, 40)")
    mask = th <= 0.10
    ax.fill_between(th[mask], 0, p_post[mask], color=BLUE, alpha=0.18,
                    label=r"$\Pr(\theta < 0.10 \mid y=0) = 0.93$")
    ax.axvline(0.10, color=BLUE, linestyle=":", linewidth=1.0)
    ax.set_xlim(0, 0.35)
    ax.set_ylim(0, None)
    ax.set_xlabel(r"Population prevalence $\theta$")
    ax.set_ylabel("Density")
    ax.set_title(r"Prior vs. Posterior ($n=20, y=0$)")
    ax.legend(frameon=False, loc="upper right")
    style_ax(ax)

    # Panel C: Sensitivity contours of Pr(theta < 0.10 | y=0) over (w, theta_0)
    ax = axes[2]
    w_grid = np.linspace(1.0, 25.0, 120)
    th0_grid = np.linspace(0.02, 0.40, 120)
    W, T0 = np.meshgrid(w_grid, th0_grid)
    A = W * T0
    B = W * (1 - T0) + 20.0
    P_lt = stats.beta.cdf(0.10, A, B)
    cs = ax.contour(W, T0, P_lt, levels=[0.50, 0.70, 0.80, 0.90, 0.95, 0.975],
                    colors=[ORANGE, ORANGE, BLUE, BLUE, INK, INK], linewidths=1.1)
    ax.clabel(cs, inline=True, fontsize=7, fmt="%.3g")
    ax.plot([22], [2/22], marker="o", color=GREEN, markersize=5, zorder=5)
    ax.annotate("Beta(2,20)", xy=(22, 2/22), xytext=(14.5, 0.13),
                fontsize=7.2, color=GREEN,
                arrowprops=dict(arrowstyle="->", color=GREEN, lw=0.8))
    ax.set_xlabel(r"Prior sample size $w = a + b$")
    ax.set_ylabel(r"Prior mean $\theta_0 = a / w$")
    ax.set_title(r"Sensitivity: $\Pr(\theta < 0.10 \mid Y = 0)$")
    style_ax(ax)

    fig.tight_layout(w_pad=1.5)
    save_svg(fig, "fig-ch01-beta-update.svg")


# ----------------------------------------------------------------------
# Chapter 2: Skewness (Normal vs Lognormal mean, median, mode)
# ----------------------------------------------------------------------
def make_ch02():
    fig, axes = plt.subplots(1, 2, figsize=(7.2, 2.7))
    mu, sigma = 10.75, 0.8

    ax = axes[0]
    y = np.linspace(8.0, 13.5, 400)
    ax.plot(y, stats.norm.pdf(y, mu, sigma), color=INK, linewidth=1.7)
    ax.axvline(mu, color=BLUE, linestyle="--", linewidth=1.2, label="Mean = Median = Mode = 10.75")
    ax.set_xlabel(r"$y = \log(\mathrm{income})$")
    ax.set_ylabel(r"$p(y)$")
    ax.set_title(r"Normal($\mu=10.75, \sigma=0.8$)")
    ax.legend(frameon=False, loc="upper right")
    style_ax(ax)

    ax = axes[1]
    x = np.linspace(1000, 220000, 500)
    pdf = stats.lognorm.pdf(x, s=sigma, scale=np.exp(mu))
    mode = np.exp(mu - sigma**2)
    median = np.exp(mu)
    mean = np.exp(mu + 0.5 * sigma**2)
    ax.plot(x / 1000.0, pdf * 1e5, color=INK, linewidth=1.7)
    ax.axvline(mode / 1000.0, color=GREEN, linestyle=":", linewidth=1.3,
               label=f"Mode = {mode/1000:.1f}k")
    ax.axvline(median / 1000.0, color=BLUE, linestyle="--", linewidth=1.3,
               label=f"Median = {median/1000:.1f}k")
    ax.axvline(mean / 1000.0, color=ORANGE, linestyle="-.", linewidth=1.3,
               label=f"Mean = {mean/1000:.1f}k")
    ax.set_xlabel(r"$e^y$ (thousands of dollars)")
    ax.set_ylabel(r"$10^5 \, p(e^y)$")
    ax.set_title("Lognormal (Right-Skewed)")
    ax.legend(frameon=False, loc="upper right")
    style_ax(ax)

    fig.tight_layout(w_pad=1.8)
    save_svg(fig, "fig-ch02-skewness.svg")


# ----------------------------------------------------------------------
# Chapter 3: HPD vs Quantile CI + Birth rates posterior vs predictive
# ----------------------------------------------------------------------
def beta_hpd(a, b, level=0.95):
    mode = (a - 1) / (a + b - 2)
    fmax = stats.beta.pdf(mode, a, b)

    def mass_above(h):
        lo = brentq(lambda t: stats.beta.pdf(t, a, b) - h, 1e-12, mode)
        hi = brentq(lambda t: stats.beta.pdf(t, a, b) - h, mode, 1 - 1e-12)
        return stats.beta.cdf(hi, a, b) - stats.beta.cdf(lo, a, b)

    h_star = brentq(lambda h: mass_above(h) - level, 1e-12, fmax - 1e-12)
    lo = brentq(lambda t: stats.beta.pdf(t, a, b) - h_star, 1e-12, mode)
    hi = brentq(lambda t: stats.beta.pdf(t, a, b) - h_star, mode, 1 - 1e-12)
    return lo, hi, h_star


def make_ch03():
    fig, axes = plt.subplots(1, 3, figsize=(9.4, 2.75))

    # Panel A: Beta(3, 9) HPD vs Quantile
    ax = axes[0]
    a, b = 3, 9
    th = np.linspace(0.001, 0.85, 500)
    pdf = stats.beta.pdf(th, a, b)
    ax.plot(th, pdf, color=INK, linewidth=1.7)
    q_lo, q_hi = stats.beta.ppf([0.025, 0.975], a, b)
    h_lo, h_hi, h_val = beta_hpd(a, b, 0.95)
    h50_lo, h50_hi, h50_val = beta_hpd(a, b, 0.50)

    mask_h = (th >= h_lo) & (th <= h_hi)
    ax.fill_between(th[mask_h], 0, pdf[mask_h], color=BLUE, alpha=0.14)
    ax.hlines(h_val, h_lo, h_hi, color=BLUE, linewidth=1.5,
              label=f"95% HPD [{h_lo:.3f}, {h_hi:.3f}]")
    ax.hlines(h50_val, h50_lo, h50_hi, color=GREEN, linewidth=1.3,
              label=f"50% HPD [{h50_lo:.3f}, {h50_hi:.3f}]")
    ax.axvline(q_lo, color=ORANGE, linestyle="--", linewidth=1.1,
               label=f"95% Quantile [{q_lo:.3f}, {q_hi:.3f}]")
    ax.axvline(q_hi, color=ORANGE, linestyle="--", linewidth=1.1)
    ax.set_xlim(0, 0.8)
    ax.set_ylim(0, None)
    ax.set_xlabel(r"$\theta$")
    ax.set_ylabel(r"$p(\theta \mid y)$")
    ax.set_title("Beta(3, 9): HPD vs. Equal-Tailed CI")
    ax.legend(frameon=False, loc="upper right", fontsize=6.8)
    style_ax(ax)

    # Panel B: GSS birth rates posterior Gamma(219, 112) vs Gamma(68, 45)
    ax = axes[1]
    t = np.linspace(0.8, 3.0, 400)
    ax.plot(t, stats.gamma.pdf(t, a=2, scale=1/1), color=FAINT, linestyle=":", linewidth=1.2,
            label="Prior Gamma(2, 1)")
    ax.plot(t, stats.gamma.pdf(t, a=219, scale=1/112), color=INK, linewidth=1.7,
            label="No degree: Gamma(219, 112)")
    ax.plot(t, stats.gamma.pdf(t, a=68, scale=1/45), color=BLUE, linewidth=1.7,
            label="Degree: Gamma(68, 45)")
    ax.set_xlabel(r"Mean fertility rate $\theta$")
    ax.set_ylabel(r"$p(\theta \mid y)$")
    ax.set_title(r"Population Means: $\Pr(\theta_1 > \theta_2 \mid y) = 0.97$")
    ax.legend(frameon=False, loc="upper right", fontsize=6.8)
    style_ax(ax)

    # Panel C: Negative Binomial posterior predictive distributions
    ax = axes[2]
    y = np.arange(0, 9)
    # Hoff parameterization: NegBin(a, b) -> mean a/b, p_scipy = b/(b+1)
    p1 = stats.nbinom.pmf(y, 219, 112 / 113)
    p2 = stats.nbinom.pmf(y, 68, 45 / 46)
    ax.bar(y - 0.18, p1, width=0.35, color=INK, alpha=0.85, label="No degree")
    ax.bar(y + 0.18, p2, width=0.35, color=BLUE, alpha=0.80, label="Degree")
    ax.set_xlabel(r"Future count $\tilde{y}$")
    ax.set_ylabel(r"$p(\tilde{y} \mid y)$")
    ax.set_title(r"Predictives: $\Pr(\tilde{Y}_1 > \tilde{Y}_2 \mid y) = 0.48$")
    ax.legend(frameon=False, loc="upper right", fontsize=7.0)
    style_ax(ax)

    fig.tight_layout(w_pad=1.4)
    save_svg(fig, "fig-ch03-hpd-vs-quantile.svg")


# ----------------------------------------------------------------------
# Chapter 4: Monte Carlo convergence + PPD model check
# ----------------------------------------------------------------------
def make_ch04():
    rng = np.random.default_rng(42)
    S = 2000
    a_p, b_p = 68, 45
    samples = rng.gamma(shape=a_p, scale=1.0 / b_p, size=S)
    idx = np.arange(1, S + 1)
    cum_mean = np.cumsum(samples) / idx
    cum_prob = np.cumsum(samples < 1.75) / idx
    true_mean = a_p / b_p
    true_prob = stats.gamma.cdf(1.75, a=a_p, scale=1.0 / b_p)

    # PPD check for GSS n1=111, sy1=217, t(y) = #(y==2)/#(y==1)
    S_ppd = 50_000
    th_draws = rng.gamma(shape=219, scale=1.0 / 112.0, size=S_ppd)
    Y_rep = rng.poisson(th_draws[:, None], size=(S_ppd, 111))
    n1_cnt = np.sum(Y_rep == 1, axis=1)
    n2_cnt = np.sum(Y_rep == 2, axis=1)
    t_vals = n2_cnt / np.maximum(n1_cnt, 1)
    ppd_p = np.mean(t_vals >= 2.0)

    fig, axes = plt.subplots(1, 3, figsize=(9.4, 2.7))

    ax = axes[0]
    ax.plot(idx, cum_mean, color=INK, linewidth=1.2)
    ax.axhline(true_mean, color=BLUE, linestyle="--", linewidth=1.1,
               label=f"Exact = {true_mean:.3f}")
    # +/- 2 MCSE band
    se_band = 2.0 * np.sqrt(a_p / b_p**2) / np.sqrt(idx)
    ax.fill_between(idx, true_mean - se_band, true_mean + se_band, color=BLUE, alpha=0.12,
                    label=r"$\pm 2\,\mathrm{MCSE}$")
    ax.set_xlim(10, S)
    ax.set_ylim(1.40, 1.62)
    ax.set_xlabel("Monte Carlo draws $S$")
    ax.set_ylabel("Cumulative mean")
    ax.set_title(r"MC Convergence of $E[\theta \mid y]$")
    ax.legend(frameon=False, loc="upper right", fontsize=7.0)
    style_ax(ax)

    ax = axes[1]
    ax.plot(idx, cum_prob, color=INK, linewidth=1.2)
    ax.axhline(true_prob, color=GREEN, linestyle="--", linewidth=1.1,
               label=f"Exact = {true_prob:.3f}")
    ax.set_xlim(10, S)
    ax.set_ylim(0.84, 0.96)
    ax.set_xlabel("Monte Carlo draws $S$")
    ax.set_ylabel(r"Cumulative $\Pr(\theta < 1.75)$")
    ax.set_title("MC Convergence of Tail Probability")
    ax.legend(frameon=False, loc="lower right", fontsize=7.0)
    style_ax(ax)

    ax = axes[2]
    ax.hist(t_vals, bins=32, density=True, color=BLUE, alpha=0.35, edgecolor=BLUE, linewidth=0.5)
    ax.axvline(2.0, color=ORANGE, linewidth=1.8,
               label=f"Observed $t(y_{{\\mathrm{{obs}}}}) = 2.0$\nTail prob = {ppd_p:.4f}")
    ax.set_xlim(0.3, 2.4)
    ax.set_xlabel(r"Test statistic $t(\tilde{Y}) = \#\{\tilde{Y}=2\}/\#\{\tilde{Y}=1\}$")
    ax.set_ylabel("Density")
    ax.set_title("Posterior Predictive Check (Poisson Fit)")
    ax.legend(frameon=False, loc="upper right", fontsize=7.0)
    style_ax(ax)

    fig.tight_layout(w_pad=1.4)
    save_svg(fig, "fig-ch04-mc-convergence.svg")


# ----------------------------------------------------------------------
# Chapter 5: Normal-IG joint posterior (midge) + MSE bias-variance tradeoff (IQ)
# ----------------------------------------------------------------------
def make_ch05():
    fig, axes = plt.subplots(1, 3, figsize=(9.4, 2.75))

    # Panel A: Midge joint posterior contours of (theta, sigma^2)
    y_midge = np.array([1.64, 1.70, 1.72, 1.74, 1.82, 1.82, 1.82, 1.90, 2.08])
    n = len(y_midge)
    ybar, s2 = np.mean(y_midge), np.var(y_midge, ddof=1)
    mu0, k0, s20, nu0 = 1.9, 1.0, 0.01, 1.0
    kn, nun = k0 + n, nu0 + n
    mun = (k0 * mu0 + n * ybar) / kn
    s2n = (nu0 * s20 + (n - 1) * s2 + k0 * n * (ybar - mu0)**2 / kn) / nun

    ax = axes[0]
    th_g = np.linspace(1.62, 2.02, 140)
    s2_g = np.linspace(0.004, 0.045, 140)
    TH, S2 = np.meshgrid(th_g, s2_g)
    # p(theta, sigma^2 | y) = N(theta; mun, S2/kn) * InvGamma(S2; nun/2, nun*s2n/2)
    Z = (stats.norm.pdf(TH, mun, np.sqrt(S2 / kn)) *
         stats.invgamma.pdf(S2, a=nun / 2.0, scale=nun * s2n / 2.0))
    ax.contour(TH, S2, Z, levels=7, colors=INK, linewidths=0.9)
    ax.plot([mun], [s2n * nun / (nun + 2)], marker="o", color=BLUE, markersize=4)
    ax.set_xlabel(r"Mean wing length $\theta$ (mm)")
    ax.set_ylabel(r"Variance $\sigma^2$")
    ax.set_title("Midge Joint Posterior $p(\\theta, \\sigma^2 \\mid y)$")
    style_ax(ax)

    # Panel B: Relative MSE of Bayes estimator vs sample mean (IQ example)
    # True theta0 = 112, sigma^2 = 169, prior mu0 = 100
    ax = axes[1]
    n_vals = np.linspace(1, 50, 200)
    theta0, mu0_iq, sig2_iq = 112.0, 100.0, 169.0
    mse_e = sig2_iq / n_vals
    ax.axhline(1.0, color=FAINT, linestyle=":", linewidth=1.1, label=r"$\kappa_0 = 0$ ($\bar{y}$)")
    for k0_val, col, ls in [(1, BLUE, "-"), (2, GREEN, "--"), (3, ORANGE, "-.")]:
        w = n_vals / (k0_val + n_vals)
        mse_b = (w**2) * (sig2_iq / n_vals) + ((1 - w)**2) * (mu0_iq - theta0)**2
        ax.plot(n_vals, mse_b / mse_e, color=col, linestyle=ls, linewidth=1.5,
                label=rf"$\kappa_0 = {k0_val}$")
    ax.set_xlim(1, 50)
    ax.set_ylim(0.5, 1.15)
    ax.set_xlabel("Sample size $n$")
    ax.set_ylabel(r"$\mathrm{MSE}(\hat{\theta}_b) / \mathrm{MSE}(\bar{y})$")
    ax.set_title(r"Relative MSE ($\theta_0=112, \mu_0=100$)")
    ax.legend(frameon=False, loc="lower right", fontsize=7.0)
    style_ax(ax)

    # Panel C: Sampling distributions at n = 10
    ax = axes[2]
    n10 = 10.0
    x = np.linspace(96, 126, 400)
    ax.axvline(theta0, color=FAINT, linestyle=":", linewidth=1.1, label=r"Truth $\theta_0 = 112$")
    for k0_val, col, ls, lab in [
        (0, INK, "--", r"$\bar{y}$ ($\kappa_0=0$)"),
        (1, BLUE, "-", r"$\kappa_0=1$ (lowest MSE)"),
        (3, ORANGE, "-.", r"$\kappa_0=3$ (over-shrunk)"),
    ]:
        w = n10 / (k0_val + n10)
        mean_est = w * theta0 + (1 - w) * mu0_iq
        sd_est = w * np.sqrt(sig2_iq / n10)
        ax.plot(x, stats.norm.pdf(x, mean_est, sd_est), color=col, linestyle=ls,
                linewidth=1.5, label=lab)
    ax.set_xlabel("Estimate of town mean IQ")
    ax.set_ylabel("Sampling density")
    ax.set_title("Bias–Variance Trade-off ($n = 10$)")
    ax.legend(frameon=False, loc="upper left", fontsize=6.8)
    style_ax(ax)

    fig.tight_layout(w_pad=1.4)
    save_svg(fig, "fig-ch05-mse-tradeoff.svg")


# ----------------------------------------------------------------------
# Chapter 6: Gibbs sampler trajectory + bimodal/trimodal stickiness diagnostic
# ----------------------------------------------------------------------
def make_ch06():
    rng = np.random.default_rng(7)

    # Semiconjugate Gibbs on midge data
    y = np.array([1.64, 1.70, 1.72, 1.74, 1.82, 1.82, 1.82, 1.90, 2.08])
    n, ybar, s2 = len(y), np.mean(y), np.var(y, ddof=1)
    mu0, t20, s20, nu0 = 1.9, 0.95**2, 0.01, 1.0

    # Grid contours
    th_g = np.linspace(1.64, 1.98, 100)
    pr_g = np.linspace(8.0, 145.0, 100)
    TH, PR = np.meshgrid(th_g, pr_g)
    log_p = (stats.norm.logpdf(TH, mu0, np.sqrt(t20))
             + stats.gamma.logpdf(PR, a=nu0 / 2.0, scale=2.0 / (nu0 * s20))
             + 0.5 * n * np.log(PR)
             - 0.5 * PR * ((n - 1) * s2 + n * (ybar - TH)**2))
    Z = np.exp(log_p - np.max(log_p))

    S_g = 500
    phi = np.zeros((S_g, 2))
    th_cur, pr_cur = 1.66, 20.0
    phi[0] = [th_cur, pr_cur]
    for s in range(1, S_g):
        t2n = 1.0 / (1.0 / t20 + n * pr_cur)
        mun = t2n * (mu0 / t20 + n * ybar * pr_cur)
        th_cur = rng.normal(mun, np.sqrt(t2n))
        nun = nu0 + n
        ss = nu0 * s20 + (n - 1) * s2 + n * (ybar - th_cur)**2
        pr_cur = rng.gamma(nun / 2.0, 2.0 / ss)
        phi[s] = [th_cur, pr_cur]

    # Trimodal mixture Gibbs trap (Hoff Section 6.6)
    weights = np.array([0.45, 0.10, 0.45])
    means = np.array([-3.0, 0.0, 3.0])
    sd_m = np.sqrt(1.0 / 3.0)
    S_mix = 1500
    th_mix = np.zeros(S_mix)
    d_cur = 0
    th_c = means[d_cur]
    for s in range(S_mix):
        th_c = rng.normal(means[d_cur], sd_m)
        probs = weights * stats.norm.pdf(th_c, means, sd_m)
        probs /= probs.sum()
        d_cur = rng.choice(3, p=probs)
        th_mix[s] = th_c

    fig, axes = plt.subplots(1, 3, figsize=(9.4, 2.75))

    ax = axes[0]
    ax.contour(TH, PR, Z, levels=6, colors=FAINT, linewidths=0.7)
    ax.scatter(phi[20:, 0], phi[20:, 1], s=4, color=BLUE, alpha=0.25, edgecolors="none")
    ax.plot(phi[:20, 0], phi[:20, 1], color=ORANGE, linewidth=1.0, marker="o", markersize=2.5,
            label="First 20 Gibbs steps")
    ax.set_xlabel(r"Mean $\theta$")
    ax.set_ylabel(r"Precision $\tilde{\sigma}^2 = 1/\sigma^2$")
    ax.set_title("Semiconjugate Gibbs Trajectory")
    ax.legend(frameon=False, loc="upper right", fontsize=7.0)
    style_ax(ax)

    ax = axes[1]
    x_m = np.linspace(-5.5, 5.5, 400)
    true_mix = sum(w * stats.norm.pdf(x_m, m, sd_m) for w, m in zip(weights, means))
    ax.hist(th_mix, bins=40, density=True, color=ORANGE, alpha=0.35, edgecolor=ORANGE,
            linewidth=0.4, label="1,500 Gibbs draws")
    ax.plot(x_m, true_mix, color=INK, linewidth=1.6, label="True mixture density")
    ax.set_xlabel(r"$\theta$")
    ax.set_ylabel(r"$p(\theta)$")
    ax.set_title("Slow Mixing in Multimodal Target")
    ax.legend(frameon=False, loc="upper right", fontsize=6.8)
    style_ax(ax)

    ax = axes[2]
    ax.plot(np.arange(S_mix), th_mix, color=INK, linewidth=0.55, alpha=0.85)
    ax.set_xlabel("Gibbs iteration $s$")
    ax.set_ylabel(r"$\theta^{(s)}$")
    ax.set_title("Traceplot: High Autocorrelation (Stickiness)")
    style_ax(ax)

    fig.tight_layout(w_pad=1.4)
    save_svg(fig, "fig-ch06-gibbs-diagnostics.svg")


# ----------------------------------------------------------------------
# Chapter 7: Multivariate normal contours (rho = -0.5, 0, +0.5)
# ----------------------------------------------------------------------
def make_ch07():
    rng = np.random.default_rng(11)
    fig, axes = plt.subplots(1, 3, figsize=(9.2, 2.7))
    mu = np.array([50.0, 50.0])
    s1, s2 = 8.0, 12.0
    x1 = np.linspace(22, 78, 120)
    x2 = np.linspace(12, 88, 120)
    X1, X2 = np.meshgrid(x1, x2)
    pos = np.dstack((X1, X2))

    for ax, rho, col in zip(axes, [-0.5, 0.0, 0.5], [ORANGE, INK, BLUE]):
        cov = np.array([[s1**2, rho * s1 * s2], [rho * s1 * s2, s2**2]])
        rv = stats.multivariate_normal(mu, cov)
        ax.contour(X1, X2, rv.pdf(pos), levels=5, colors=col, linewidths=1.0)
        pts = rng.multivariate_normal(mu, cov, size=35)
        ax.scatter(pts[:, 0], pts[:, 1], s=10, color=INK, alpha=0.55, edgecolors="none")
        # Show conditional mean line E[Y2 | Y1 = y1]
        slope = rho * (s2 / s1)
        ax.plot(x1, 50.0 + slope * (x1 - 50.0), color=col, linestyle="--", linewidth=1.1,
                label=rf"$E[Y_2 \mid Y_1]$ (slope={slope:+.2f})")
        ax.set_xlim(22, 78)
        ax.set_ylim(12, 88)
        ax.set_xlabel(r"$y_1$")
        if ax is axes[0]:
            ax.set_ylabel(r"$y_2$")
        ax.set_title(rf"$\rho = {rho:+.1f}$ ($\sigma_{{1,2}} = {rho*s1*s2:+.0f}$)")
        ax.legend(frameon=False, loc="lower right", fontsize=6.8)
        style_ax(ax)

    fig.tight_layout(w_pad=1.3)
    save_svg(fig, "fig-ch07-mvn-contours.svg")


# ----------------------------------------------------------------------
# Chapter 8: Hierarchical normal shrinkage + DAG
# ----------------------------------------------------------------------
def make_ch08():
    rng = np.random.default_rng(19)
    # Simulate 60 schools matching ELS parameters (mu=48.1, tau=5.0, sigma=9.2)
    m = 60
    mu_true, tau_true, sig_true = 48.1, 5.0, 9.2
    n_j = rng.integers(5, 32, size=m)
    theta_true = rng.normal(mu_true, tau_true, size=m)
    ybar_j = np.array([rng.normal(th, sig_true / np.sqrt(nj)) for th, nj in zip(theta_true, n_j)])
    # Empirical/posterior shrinkage estimate using true/estimated variance components
    B_j = (n_j / sig_true**2) / (n_j / sig_true**2 + 1.0 / tau_true**2)
    theta_hat = B_j * ybar_j + (1.0 - B_j) * mu_true

    fig, axes = plt.subplots(1, 3, figsize=(9.4, 2.8))

    # Panel A: Hierarchical DAG
    ax = axes[0]
    ax.set_xlim(0, 10)
    ax.set_ylim(0, 10)
    ax.axis("off")
    nodes = [
        (3.0, 8.3, r"$\mu, \tau^2$", BLUE),
        (7.7, 8.3, r"$\sigma^2$", ORANGE),
        (1.6, 4.9, r"$\theta_1$", INK),
        (4.4, 4.9, r"$\theta_j$", INK),
        (7.2, 4.9, r"$\theta_m$", INK),
        (1.6, 1.5, r"$\mathbf{y}_1$", GREEN),
        (4.4, 1.5, r"$\mathbf{y}_j$", GREEN),
        (7.2, 1.5, r"$\mathbf{y}_m$", GREEN),
    ]
    for x, y, txt, col in nodes:
        c = Circle((x, y), 0.95, facecolor=PAPER, edgecolor=col, linewidth=1.3, zorder=3)
        ax.add_patch(c)
        ax.text(x, y, txt, ha="center", va="center", fontsize=8.5, color=INK, zorder=4)
    edges = [
        ((2.5, 7.45), (1.8, 5.85)),
        ((3.3, 7.4), (4.2, 5.85)),
        ((3.7, 7.7), (6.5, 5.6)),
        ((1.6, 3.95), (1.6, 2.45)),
        ((4.4, 3.95), (4.4, 2.45)),
        ((7.2, 3.95), (7.2, 2.45)),
        ((7.2, 7.45), (2.2, 2.3)),
        ((7.4, 7.4), (4.9, 2.3)),
        ((7.65, 7.35), (7.3, 2.45)),
    ]
    for p1, p2 in edges:
        arr = FancyArrowPatch(p1, p2, arrowstyle="-|>", mutation_scale=8,
                              color=MUTED, linewidth=0.85, zorder=2)
        ax.add_patch(arr)
    ax.text(3.0, 4.9, r"$\cdots$", ha="center", va="center", fontsize=11, color=MUTED)
    ax.text(5.8, 4.9, r"$\cdots$", ha="center", va="center", fontsize=11, color=MUTED)
    ax.set_title("Hierarchical Normal DAG")

    # Panel B: Shrinkage ybar_j vs theta_hat_j
    ax = axes[1]
    lims = [34, 64]
    ax.plot(lims, lims, color=FAINT, linestyle="--", linewidth=1.0, label="No pooling ($y = x$)")
    ax.axhline(mu_true, color=ORANGE, linestyle=":", linewidth=1.0, label=r"Grand mean $\hat{\mu}$")
    sc = ax.scatter(ybar_j, theta_hat, s=16, c=n_j, cmap="viridis", alpha=0.85,
                    edgecolors=INK, linewidths=0.3)
    ax.set_xlim(lims)
    ax.set_ylim(lims)
    ax.set_xlabel(r"Sample mean $\bar{y}_j$")
    ax.set_ylabel(r"Hierarchical mean $\hat{\theta}_j$")
    ax.set_title("Partial Pooling Shrinks Extremes")
    ax.legend(frameon=False, loc="upper left", fontsize=6.8)
    style_ax(ax)

    # Panel C: Magnitude of shrinkage vs group sample size n_j
    ax = axes[2]
    ax.axhline(0, color=FAINT, linestyle="--", linewidth=0.9)
    ax.scatter(n_j, ybar_j - theta_hat, s=16, color=BLUE, alpha=0.8,
               edgecolors=INK, linewidths=0.3)
    ax.set_xlabel(r"Group sample size $n_j$")
    ax.set_ylabel(r"Shrinkage $\bar{y}_j - \hat{\theta}_j$")
    ax.set_title("Small Groups Borrow Most Strength")
    style_ax(ax)

    fig.tight_layout(w_pad=1.4)
    save_svg(fig, "fig-ch08-shrinkage.svg")


# ----------------------------------------------------------------------
# Chapter 9: Oxygen uptake exact Zellner g-prior analysis + Bayes factor
# ----------------------------------------------------------------------
def make_ch09():
    rng = np.random.default_rng(2026)
    # Hoff's exact oxygen uptake dataset (Ch 9, p. 153)
    age = np.array([23, 22, 22, 25, 27, 20, 31, 23, 27, 28, 22, 24], dtype=float)
    grp = np.array([0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1], dtype=float)
    y = np.array([-0.87, -10.74, -3.27, -1.97, 7.50, -7.25,
                  17.05, 4.96, 10.40, 11.05, 0.26, 2.51])
    X = np.column_stack([np.ones_like(age), grp, age, grp * age])
    n, p = X.shape
    XtX_inv = np.linalg.inv(X.T @ X)
    beta_ols = XtX_inv @ (X.T @ y)
    s2_ols = np.sum((y - X @ beta_ols)**2) / (n - p)

    # Exact Zellner g-prior MC sampling (g = n = 12, nu0 = 1, s20 = s2_ols)
    g, nu0, s20 = float(n), 1.0, s2_ols
    Hg = (g / (g + 1.0)) * X @ XtX_inv @ X.T
    SSRg = float(y.T @ (np.eye(n) - Hg) @ y)
    S = 5000
    s2_draws = 1.0 / rng.gamma((nu0 + n) / 2.0, 2.0 / (nu0 * s20 + SSRg), size=S)
    Vb = (g / (g + 1.0)) * XtX_inv
    Eb = (g / (g + 1.0)) * beta_ols
    L = np.linalg.cholesky(Vb)
    Z = rng.normal(0, 1, size=(S, p))
    beta_draws = Eb + (Z @ L.T) * np.sqrt(s2_draws)[:, None]

    fig, axes = plt.subplots(1, 3, figsize=(9.4, 2.75))

    # Panel A: Data + posterior mean lines
    ax = axes[0]
    a_line = np.linspace(19.5, 31.5, 100)
    b_mean = beta_draws.mean(axis=0)
    ax.scatter(age[grp == 0], y[grp == 0], color=INK, s=24, label="Running")
    ax.scatter(age[grp == 1], y[grp == 1], color=BLUE, marker="^", s=28, label="Aerobics")
    ax.plot(a_line, b_mean[0] + b_mean[2] * a_line, color=INK, linewidth=1.4)
    ax.plot(a_line, (b_mean[0] + b_mean[1]) + (b_mean[2] + b_mean[3]) * a_line,
            color=BLUE, linewidth=1.4)
    ax.set_xlabel("Age (years)")
    ax.set_ylabel(r"$\Delta$ Max $\mathrm{O}_2$ uptake")
    ax.set_title("Oxygen Uptake: $g$-Prior Fits")
    ax.legend(frameon=False, loc="upper left", fontsize=7.0)
    style_ax(ax)

    # Panel B: Joint posterior (beta2, beta4) showing strong collinearity
    ax = axes[1]
    ax.scatter(beta_draws[:800, 1], beta_draws[:800, 3], s=5, color=BLUE, alpha=0.25,
               edgecolors="none")
    ax.axhline(0, color=FAINT, linestyle=":", linewidth=0.9)
    ax.axvline(0, color=FAINT, linestyle=":", linewidth=0.9)
    ax.set_xlabel(r"Intercept shift $\beta_2$")
    ax.set_ylabel(r"Slope shift $\beta_4$")
    ax.set_title(r"Strong Posterior Correlation ($\beta_2, \beta_4$)")
    style_ax(ax)

    # Panel C: Posterior 95% intervals for beta2 + beta4 * age
    ax = axes[2]
    ages_eval = np.arange(20, 32)
    diffs = beta_draws[:, 1:2] + beta_draws[:, 3:4] * ages_eval[None, :]
    q025, q50, q975 = np.percentile(diffs, [2.5, 50, 97.5], axis=0)
    ax.axhline(0, color=ORANGE, linestyle="--", linewidth=1.0)
    ax.vlines(ages_eval, q025, q975, color=INK, linewidth=1.4)
    ax.plot(ages_eval, q50, marker="o", markersize=3.5, color=BLUE, linewidth=1.2,
            label="Posterior median & 95% CI")
    ax.set_xlabel("Age (years)")
    ax.set_ylabel(r"Aerobics $-$ Running ($\beta_2 + \beta_4 \cdot \mathrm{age}$)")
    ax.set_title("Group Contrast Across Age")
    ax.legend(frameon=False, loc="lower left", fontsize=7.0)
    style_ax(ax)

    fig.tight_layout(w_pad=1.4)
    save_svg(fig, "fig-ch09-regression-bma.svg")


# ----------------------------------------------------------------------
# Chapter 10: Metropolis proposal tuning (Hoff exact 5-point Normal example)
# ----------------------------------------------------------------------
def make_ch10():
    rng = np.random.default_rng(101)
    y = np.array([9.37, 10.18, 9.16, 11.60, 10.33])
    s2, t2, mu = 1.0, 10.0, 5.0
    n = len(y)
    mu_post = (n * np.mean(y) / s2 + mu / t2) / (n / s2 + 1.0 / t2)
    sd_post = np.sqrt(1.0 / (n / s2 + 1.0 / t2))

    def run_mh(delta2, S=600):
        th = 0.0
        out = np.empty(S)
        acc = 0
        for s in range(S):
            prop = rng.normal(th, np.sqrt(delta2))
            log_r = (np.sum(stats.norm.logpdf(y, prop, np.sqrt(s2)))
                     + stats.norm.logpdf(prop, mu, np.sqrt(t2))
                     - np.sum(stats.norm.logpdf(y, th, np.sqrt(s2)))
                     - stats.norm.logpdf(th, mu, np.sqrt(t2)))
            if np.log(rng.uniform()) < log_r:
                th = prop
                acc += 1
            out[s] = th
        return out, acc / S

    fig, axes = plt.subplots(1, 3, figsize=(9.4, 2.7))
    configs = [
        (1.0 / 32.0, ORANGE, r"Too small: $\delta^2 = 1/32$"),
        (2.0, BLUE, r"Balanced: $\delta^2 = 2$"),
        (64.0, PURPLE, r"Too large: $\delta^2 = 64$"),
    ]
    for ax, (d2, col, title) in zip(axes, configs):
        chain, acc = run_mh(d2, S=600)
        ax.plot(chain, color=col, linewidth=0.9)
        ax.axhline(mu_post, color=INK, linestyle="--", linewidth=0.9, alpha=0.7)
        ax.axhspan(mu_post - 2 * sd_post, mu_post + 2 * sd_post, color=FAINT, alpha=0.12)
        ax.set_ylim(-0.5, 13.0)
        ax.set_xlabel("Iteration $s$")
        if ax is axes[0]:
            ax.set_ylabel(r"$\theta^{(s)}$")
        ax.set_title(f"{title}\n(accept = {100*acc:.0f}%)")
        style_ax(ax)

    fig.tight_layout(w_pad=1.3)
    save_svg(fig, "fig-ch10-mh-tuning.svg")


# ----------------------------------------------------------------------
# Chapter 11: Three cumulative layers of uncertainty in a Poisson GLMM
# ----------------------------------------------------------------------
def make_ch11():
    rng = np.random.default_rng(111)
    # Synthetic mouse-intestine-like quartic log-rate curve showing the 3 uncertainty layers
    x = np.linspace(0.05, 0.95, 40)
    # Mean log-intensity curve peaking around x = 0.65
    f_true = -0.3 + 2.6 * x + 1.5 * x**2 - 3.8 * x**3 + 0.5 * x**4
    S = 4000
    # Layer 1: Posterior uncertainty in population curve theta (narrow)
    # Layer 2: Between-mouse heterogeneity beta_j ~ N(theta, Sigma) (medium)
    # Layer 3: Within-mouse Poisson sampling Y ~ Poisson(exp(beta_j^T x)) (wide)
    X_poly = np.column_stack([np.ones_like(x), x, x**2])
    theta_draws = rng.normal(0.0, [0.09, 0.12, 0.10], size=(S, 3))
    beta_draws = theta_draws + rng.normal(0.0, [0.35, 0.25, 0.20], size=(S, 3))

    eta1 = f_true[None, :] + theta_draws @ X_poly.T
    eta2 = f_true[None, :] + beta_draws @ X_poly.T
    lam1 = np.exp(eta1)
    lam2 = np.exp(eta2)
    y_pred = rng.poisson(lam2)

    fig, axes = plt.subplots(1, 3, figsize=(9.4, 2.75), sharey=True)
    panels = [
        (lam1, BLUE, r"1. Typical group rate $\exp(\theta^T x)$", "Parameter uncertainty only"),
        (lam2, GREEN, r"2. New group rate $\exp(\tilde{\beta}^T x)$", "+ Between-group heterogeneity"),
        (y_pred, ORANGE, r"3. New observation $\tilde{Y} \mid x$", "+ Within-group Poisson noise"),
    ]
    for ax, (arr, col, title, sub) in zip(axes, panels):
        lo, med, hi = np.percentile(arr, [2.5, 50, 97.5], axis=0)
        ax.fill_between(x, lo, hi, color=col, alpha=0.22, label="95% interval")
        ax.plot(x, med, color=INK, linewidth=1.6, label="Median")
        ax.set_xlim(0.05, 0.95)
        ax.set_ylim(0, 14)
        ax.set_xlabel("Location $x$")
        ax.set_title(f"{title}\n({sub})", fontsize=8.5)
        ax.legend(frameon=False, loc="upper left", fontsize=7.0)
        style_ax(ax)
    axes[0].set_ylabel("Count / Expected Count")

    fig.tight_layout(w_pad=1.2)
    save_svg(fig, "fig-ch11-uncertainty-layers.svg")


# ----------------------------------------------------------------------
# Chapter 12: Ordered Probit latent thresholds + Gaussian Copula mapping
# ----------------------------------------------------------------------
def make_ch12():
    rng = np.random.default_rng(121)
    fig, axes = plt.subplots(1, 2, figsize=(8.2, 2.9))

    # Panel A: Ordered Probit latent Z -> thresholds g_1..g_4 -> ordinal Y in {1..5}
    ax = axes[0]
    z = np.linspace(-3.5, 3.8, 400)
    mu_z = 0.45
    pdf = stats.norm.pdf(z, mu_z, 1.0)
    gs = [-1.2, -0.1, 0.9, 1.8]
    bounds = [-3.5] + gs + [3.8]
    cols = [FAINT, BLUE, GREEN, ORANGE, PURPLE]
    ax.plot(z, pdf, color=INK, linewidth=1.6)
    for k in range(5):
        m = (z >= bounds[k]) & (z <= bounds[k + 1])
        ax.fill_between(z[m], 0, pdf[m], color=cols[k], alpha=0.22)
        mid = 0.5 * (max(bounds[k], -2.6) + min(bounds[k + 1], 2.9))
        ax.text(mid, 0.035, f"$Y={k+1}$", ha="center", va="bottom", fontsize=7.5, color=INK)
    for idx, gval in enumerate(gs, 1):
        ax.axvline(gval, color=MUTED, linestyle="--", linewidth=0.9)
        ax.text(gval, 0.415, rf"$g_{idx}$", ha="center", va="bottom", fontsize=7.5, color=MUTED)
    ax.set_xlim(-3.2, 3.5)
    ax.set_ylim(0, 0.47)
    ax.set_xlabel(r"Latent variable $Z_i \sim \mathcal{N}(\beta^T x_i, 1)$")
    ax.set_ylabel("Density")
    ax.set_title("Ordered Probit: Latent $Z$ Partitioned by Thresholds")
    style_ax(ax)

    # Panel B: Gaussian copula decoupling latent correlation from skewed/discrete margins
    ax = axes[1]
    rho = 0.68
    cov = np.array([[1.0, rho], [rho, 1.0]])
    Z = rng.multivariate_normal([0, 0], cov, size=220)
    # Transform Z1 -> ordinal 1..5, Z2 -> right-skewed income-like exp(0.6 Z2)
    U1 = stats.norm.cdf(Z[:, 0])
    Y1 = np.digitize(U1, [0.15, 0.45, 0.70, 0.88]) + 1
    Y2 = np.exp(0.55 * Z[:, 1]) * 30.0
    jitter = rng.uniform(-0.18, 0.18, size=len(Y1))
    ax.scatter(Y1 + jitter, Y2, s=12, color=BLUE, alpha=0.55, edgecolors="none")
    for lvl in range(1, 6):
        med_y2 = np.median(Y2[Y1 == lvl])
        ax.hlines(med_y2, lvl - 0.28, lvl + 0.28, color=ORANGE, linewidth=2.0)
    ax.set_xticks([1, 2, 3, 4, 5])
    ax.set_xlabel(r"Ordinal $Y_1 = g_1(Z_1) \in \{1,\dots,5\}$")
    ax.set_ylabel(r"Skewed $Y_2 = g_2(Z_2)$")
    ax.set_title(r"Gaussian Copula ($C_{12} = 0.68$): Mixed Non-Normal Margins")
    style_ax(ax)

    fig.tight_layout(w_pad=1.6)
    save_svg(fig, "fig-ch12-probit-copula.svg")


if __name__ == "__main__":
    make_frontispiece()
    make_ch01()
    make_ch02()
    make_ch03()
    make_ch04()
    make_ch05()
    make_ch06()
    make_ch07()
    make_ch08()
    make_ch09()
    make_ch10()
    make_ch11()
    make_ch12()
    print("All 13 SVG figures generated successfully.")
