+++
date = '2026-01-28T09:56:03+01:00'
title = 'SAT solvers'
subtitle = "Literate programming, implementations and their containers."
author = 'Donald E. Knuth'
tags = ['knuth', 'containers', 'cweb', 'c', 'stanford', 'sat']
summary = ' '
+++

## Algorithms

Knuth hosts lots of [programs](https://cs.stanford.edu/~knuth/programs.html), in particular he 
provides many implementations of SAT solvers that we collect in the following table:

| Algorithm in [*CWEB*](https://cs.stanford.edu/~knuth/cweb.html)| Description | C source | PDF |
|---|---|---:|---:|
| [Algorithm 7.2.2.2A](https://cs.stanford.edu/~knuth/programs/sat0.w) | very basic SAT solver | [sat0.c](https://github.com/massimo-nocentini/SAT.cweb/blob/master/src/sat0.c) | [sat0.pdf](https://github.com/massimo-nocentini/SAT.cweb/blob/master/tex/sat0.pdf) |
| [Algorithm 7.2.2.2B](https://cs.stanford.edu/~knuth/programs/sat0w.w) | teeny tiny SAT solver | [sat0w.c](https://github.com/massimo-nocentini/SAT.cweb/blob/master/src/sat0w.c) | [sat0w.pdf](https://github.com/massimo-nocentini/SAT.cweb/blob/master/tex/sat0w.pdf) |
| [Algorithm 7.2.2.2W](https://cs.stanford.edu/~knuth/programs/sat8.w) | walk SAT solver | [sat8.c](https://github.com/massimo-nocentini/SAT.cweb/blob/master/src/sat8.c) | [sat8.pdf](https://github.com/massimo-nocentini/SAT.cweb/blob/master/tex/sat8.pdf) |
| [Algorithm 7.2.2.2S](https://cs.stanford.edu/~knuth/programs/sat9.w) | survey propagation SAT solver | [sat9.c](https://github.com/massimo-nocentini/SAT.cweb/blob/master/src/sat9.c) | [sat9.pdf](https://github.com/massimo-nocentini/SAT.cweb/blob/master/tex/sat9.pdf) |
| [Algorithm 7.2.2.2D](https://cs.stanford.edu/~knuth/programs/sat10.w) | Davis–Putnam SAT solver | [sat10.c](https://github.com/massimo-nocentini/SAT.cweb/blob/master/src/sat10.c) | [sat10.pdf](https://github.com/massimo-nocentini/SAT.cweb/blob/master/tex/sat10.pdf) |
| [Algorithm 7.2.2.2L](https://cs.stanford.edu/~knuth/programs/sat11.w) | lookahead 3SAT solver | [sat11.c](https://github.com/massimo-nocentini/SAT.cweb/blob/master/src/sat11.c) | [sat11.pdf](https://github.com/massimo-nocentini/SAT.cweb/blob/master/tex/sat11.pdf) |
| [Change file for Algorithm 7.2.2.2L](https://cs.stanford.edu/~knuth/programs/sat11k.ch) | adapts to clauses of arbitrary length | [sat11k.c](https://github.com/massimo-nocentini/SAT.cweb/blob/master/src/sat11k.c) | [sat11k.pdf](https://github.com/massimo-nocentini/SAT.cweb/blob/master/tex/sat11k.pdf) |
| [preprocessor](https://cs.stanford.edu/~knuth/programs/sat12.w) | preprocessor for SAT solver | [sat12.c](https://github.com/massimo-nocentini/SAT.cweb/blob/master/src/sat12.c) | [sat12.pdf](https://github.com/massimo-nocentini/SAT.cweb/blob/master/tex/sat12.pdf) |
| [companion preprocessor](https://cs.stanford.edu/~knuth/programs/sat12-erp.w) | companion preprocessor | [sat12-erp.c](https://github.com/massimo-nocentini/SAT.cweb/blob/master/src/sat12-erp.c) | [sat12-erp.pdf](https://github.com/massimo-nocentini/SAT.cweb/blob/master/tex/sat12-erp.pdf) |
| [Algorithm 7.2.2.2C](https://cs.stanford.edu/~knuth/programs/sat13.w) | conflict-driven clause learning SAT solver | [sat13.c](https://github.com/massimo-nocentini/SAT.cweb/blob/master/src/sat13.c) | [sat13.pdf](https://github.com/massimo-nocentini/SAT.cweb/blob/master/tex/sat13.pdf) |
| [encoder (sat-nfa)](https://cs.stanford.edu/~knuth/programs/sat-nfa.w) | forcing encoding of regular languages into SAT via NFA | [sat-nfa.c](https://github.com/massimo-nocentini/SAT.cweb/blob/master/src/sat-nfa.c) | [sat-nfa.pdf](https://github.com/massimo-nocentini/SAT.cweb/blob/master/tex/sat-nfa.pdf) |

## Containers

We compiled and ship the corresponding executables in the [`sat.cweb` image](https://github.com/massimo-nocentini/SAT.cweb/pkgs/container/sat.cweb)
that can be pulled easily:

```bash
docker pull ghcr.io/massimo-nocentini/sat.cweb:master
```

which is based on the [`sgb.cweb` Stanford GraphBase image][def] and presented in this [our own page]( {{< relref "2026-01-25-sgb.md" >}} ).

[def]: https://github.com/massimo-nocentini/sgb.cweb/pkgs/container/sgb.cweb