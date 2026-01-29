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

[^1]: Johannes K. Fichte, Daniel Le Berre, Markus Hecher, and Stefan Szeider. *The Silent (R)evolution of SAT*. Commun. ACM 66, 6 (June 2023), 64–72 
        ([pdf](https://dl.acm.org/doi/pdf/10.1145/3560469) in open access).

## Knuth's solvers

Knuth hosts lots of [programs](https://cs.stanford.edu/~knuth/programs.html), in particular he 
provides many implementations of SAT solvers, given in the [*CWEB*](https://cs.stanford.edu/~knuth/cweb.html) format:

- [Algorithm 7.2.2.2A](https://cs.stanford.edu/~knuth/programs/sat0.w), a *very basic* SAT solver with the generated [c source](https://github.com/massimo-nocentini/SAT.cweb/blob/master/src/sat0.c) and [pdf](https://github.com/massimo-nocentini/SAT.cweb/blob/master/tex/sat0.pdf);
- [Algorithm 7.2.2.2B](https://cs.stanford.edu/~knuth/programs/sat0w.w), a *teeny tiny* SAT solver with the generated  [c source](https://github.com/massimo-nocentini/SAT.cweb/blob/master/src/sat0w.c) and [pdf](https://github.com/massimo-nocentini/SAT.cweb/blob/master/tex/sat0w.pdf);
- [Algorithm 7.2.2.2W](https://cs.stanford.edu/~knuth/programs/sat8.w), a *walk* SAT solver with the generated  [c source](https://github.com/massimo-nocentini/SAT.cweb/blob/master/src/sat8.c) and [pdf](https://github.com/massimo-nocentini/SAT.cweb/blob/master/tex/sat8.pdf);
- [Algorithm 7.2.2.2S](https://cs.stanford.edu/~knuth/programs/sat9.w), a *survey propagation* SAT solver with the generated [c source](https://github.com/massimo-nocentini/SAT.cweb/blob/master/src/sat9.c) and [pdf](https://github.com/massimo-nocentini/SAT.cweb/blob/master/tex/sat9.pdf);
- [Algorithm 7.2.2.2D](https://cs.stanford.edu/~knuth/programs/sat10.w), a *Davis-Putnam* SAT solver with the generated [c source](https://github.com/massimo-nocentini/SAT.cweb/blob/master/src/sat10.c) and [pdf](https://github.com/massimo-nocentini/SAT.cweb/blob/master/tex/sat10.pdf);
- [Algorithm 7.2.2.2L](https://cs.stanford.edu/~knuth/programs/sat11.w), a *lookahead* 3SAT solver with the generated [c source](https://github.com/massimo-nocentini/SAT.cweb/blob/master/src/sat11.c) and [pdf](https://github.com/massimo-nocentini/SAT.cweb/blob/master/tex/sat11.pdf).
  Moreover, a [change file](https://cs.stanford.edu/~knuth/programs/sat11k.ch) that adapts to clauses of arbitrary length, with the generated [c source](https://github.com/massimo-nocentini/SAT.cweb/blob/master/src/sat11k.c) and [pdf](https://github.com/massimo-nocentini/SAT.cweb/blob/master/tex/sat11k.pdf);
- [preprocessor](https://cs.stanford.edu/~knuth/programs/sat12.w), for SAT solver with the generated [c source](https://github.com/massimo-nocentini/SAT.cweb/blob/master/src/sat12.c) and [pdf](https://github.com/massimo-nocentini/SAT.cweb/blob/master/tex/sat12.pdf);
- [a companion preprocessor](https://cs.stanford.edu/~knuth/programs/sat12-erp.w), for SAT solver with the generated [c source](https://github.com/massimo-nocentini/SAT.cweb/blob/master/src/sat12-erp.c) and [pdf](https://github.com/massimo-nocentini/SAT.cweb/blob/master/tex/sat12-erp.pdf); 
- [Algorithm 7.2.2.2C](https://cs.stanford.edu/~knuth/programs/sat13.w), a *conflict-driven clause learning* SAT solver with the generated [c source](https://github.com/massimo-nocentini/SAT.cweb/blob/master/src/sat13.c) and [pdf](https://github.com/massimo-nocentini/SAT.cweb/blob/master/tex/sat13.pdf).

Also, we provide the following applications:

- [encoder](https://cs.stanford.edu/~knuth/programs/sat-nfa.w), a *forcing encoding of regular languages into SAT via nondeterministic finite automata* with the generated [c source](https://github.com/massimo-nocentini/SAT.cweb/blob/master/src/sat-nfa.c) and [pdf](https://github.com/massimo-nocentini/SAT.cweb/blob/master/tex/sat-nfa.pdf);
