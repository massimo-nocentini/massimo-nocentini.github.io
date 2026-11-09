+++
date = '2026-01-08T18:33:23+01:00'
title = "Hyperfunctions"
subtitle = 'Communicating Continuations'
author = ['Donnacha Kidney', 'Nicolas Wu']
categories = ["haskell", 'papers']
tags = [ "continuations"]
abstract = '''
A hyperfunction is a continuation-like construction that can be used to implement communication in the   context of concurrency. Though it has been reinvented many times, it remains somewhat obscure: since its   definition by Launchbury et al., hyperfunctions have been used to implement certain algebraic effect handlers,   coroutines, and breadth-first traversals; however, in each of these examples, the hyperfunction type went   unrecognised.   We identify the hyperfunctions hidden in all of these algorithms, and we exposit the common pattern   between them, building a framework for working with and reasoning about hyperfunctions. We use this   framework to solve a long-standing problem: giving a fully-abstract continuation-based semantics for a   concurrent calculus, the Calculus of Communicating Systems. Finally, we use hyperfunctions to build a   monadic Haskell library for efficient first-class coroutines.'''
+++

<!--more-->

{{< bibentry "kidney2026hyperfunctions" >}}.

It has [supplemental material](https://dl.acm.org/doi/suppl/10.1145/3776649/suppl_file/Hyperfunctions%20Appendix.pdf) and
has been presented (and [recorded](https://www.youtube.com/watch?v=9M_E7mPaLQ4&list=PLyrlk8Xaylp5idWhftYvR7k-TddwfjkKi&index=76)) at *POPL'26*.
