---
title: "A First Course in Bayesian Statistical Methods"
author: "Peter D. Hoff"
publisher: "Springer"
description: "A First Course in Bayesian Statistical Methods by Peter D. Hoff: study companion with derivations, theorems, Wolfram Language symbolic checks, Python implementations, and exercises."
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
  *Study companion and conceptual exposition* of Peter D. Hoff, *A First Course in Bayesian Statistical Methods* (Springer Texts in Statistics, 2009, ISBN 978-0-387-92299-7), prepared by Massimo Nocentini.

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
