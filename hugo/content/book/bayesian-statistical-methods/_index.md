---
title: "Bayesian Statistical Methods"
subtitle: "A Conceptual & Computational Companion to Peter D. Hoff’s First Course"
author: "Massimo Nocentini"
publisher: "tufte.hugo"
date: 2026-11-24
description: "A self-contained, concept-first Hugo book guiding the reader through all twelve chapters of Peter D. Hoff’s A First Course in Bayesian Statistical Methods (2009), with derivations, theorems, figures, Python/NumPy implementations, and cross-referenced appendices."
book: true
font: "etbook"
mathFont: "euler"
cascade:
  params:
    mathFont: "euler"
bibliography: "refs.bib"
outputs: ["html", "rss", "print"]
halftitle: true
frontispiece:
  src: "images/bayesian-hoff/frontispiece.svg"
  alt: "Sequential Bayesian updating of a Beta density as observations accumulate"
  caption: "*Frontispiece.* Sequential Bayesian learning: starting from a weak $\\operatorname{beta}(2, 2)$ prior, the posterior $p(\\theta \\mid y_{1:n})$ sharpens around the true rate $\\theta = 0.35$ as $n$ grows from $10$ to $50$ to $200$."
epigraphs:
  - quote: "Remember that all models are wrong; the practical question is how wrong do they have to be to not be useful."
    author: "George E. P. Box and Norman R. Draper"
    work: "Empirical Model-Building and Response Surfaces (1987)"
  - quote: "Probability theory is nothing but common sense reduced to calculation."
    author: "Pierre-Simon Laplace"
    work: "A Philosophical Essay on Probabilities (1814)"
copyrightPage: |
  *Study companion and conceptual exposition* of Peter D. Hoff, *A First Course in Bayesian Statistical Methods* (Springer Texts in Statistics, 2009, ISBN 978-0-387-92299-7).

  This Hugo book is an independent pedagogical guide written to clarify the mathematical structure, derivations, algorithms, and intuition of every chapter of Hoff’s text; it is not a reproduction of the original work.

  Typeset in **ET Book** and Hermann Zapf’s **Euler Math** with `tufte.hugo`.
tufte:
  style: "latex"
  book:
    numberChapters: true
    continuous: false
    tocDepth: 1
  headings:
    number: 2
  theorems:
    look: "amsthm"
    within: "chapter"
    shared: true
    qed: "openbox"
    kinds:
      algorithm:
        name: "Algorithm"
        style: "definition"
  print:
    paper: "a4"
---

{{< newthought "Bayesian inference" />}} treats every unknown—whether a population proportion, a covariance matrix, a missing measurement, or a latent threshold—as a random variable governed by probability distributions. This companion follows Peter D. Hoff’s *A First Course in Bayesian Statistical Methods*{{< cite "hoff2009" >}} chapter by chapter, stripping away mechanical clutter so that each core idea stands in plain view:

- **Part I** ({{< xref "part:foundations" "full" >}}) builds the logical foundation from belief axioms and de Finetti’s exchangeability theorem through conjugate one-parameter models and i.i.d. Monte Carlo integration.
- **Part II** ({{< xref "part:normal-gibbs" "full" >}}) develops univariate and multivariate normal models, introduces the Gibbs sampler and MCMC diagnostics, and shows how two-level exchangeability gives rise to hierarchical shrinkage.
- **Part III** ({{< xref "part:regression-latent" "full" >}}) moves into Bayesian linear regression, Zellner’s $g$-prior and variable selection, the general Metropolis–Hastings algorithm, linear and generalized linear mixed effects models, and latent-variable methods (ordered probit, rank likelihood, and Gaussian copulas) for ordinal data.
