+++
date = '2026-01-28T09:56:03+01:00'
title = 'SAT Solvers'
tags = ['sat', 'solvers', 'knuth', 'mit', 'acm']
summary = ' '
+++

## The Silent (R)evolution of SAT

Looking at the ACM page of the [MIT Computer Science & Artificial Intelligence Laboratory](https://dl.acm.org/do/10.1145/institution-60006320/full/),
the first article (at the time of writing) in the *Downloads* section is 
[*The Silent (R)evolution of SAT*](https://dl.acm.org/doi/10.1145/3560469) [^1];
for the sake of clarity, its abstract follows:

> Today's powerful, robust SAT solvers have become primary tools for solving hard computational problems.

a [PDF](https://dl.acm.org/doi/pdf/10.1145/3560469) is in open access.

[^1]: *Johannes K. Fichte, Daniel Le Berre, Markus Hecher, and Stefan Szeider*. The Silent (R)evolution of SAT. Commun. ACM 66, 6 (June 2023), 64–72.

## Knuth's solvers

Knuth provides many implementations in [*CWEB*](https://cs.stanford.edu/~knuth/cweb.html) format:
- [Algorithm 7.2.2.2D](https://cs.stanford.edu/~knuth/programs/sat10.w), a *Davis-Putnam* solver,
- [Algorithm 7.2.2.2L](https://cs.stanford.edu/~knuth/programs/sat11.w), a *lookahead 3SAT* solver,
- [Algorithm 7.2.2.2C](https://cs.stanford.edu/~knuth/programs/sat13.w), a *conflict-driven clause learning* solver.
