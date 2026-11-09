+++
date = '2026-02-24T10:59:04+01:00'
title = "Pattern matching"
subtitle = 'Scheme macrology: a generalized pattern matcher'
categories = ['scheme']
tags = ['pattern matching']
+++

<!--more-->

This post defines and tests the `match/non-overlapping` Scheme macro which is

>   a simple pattern matcher with guards in the style of Dijkstra’s Guarded Commands
    (Dijkstra 1975). It ensures that the patterns and
    optional guards of diﬀerent clauses do not overlap.3 This 
    non-overlapping property ensures that the ordering of the clauses
    does not matter, and is required for writing correct relational
    programs (Byrd 2009).

Inspired by the good old paper:

{{< bibentry "dijkstra1975guarded" >}}.

{{< abstract >}}
So-called “guarded commands” are introduced as a building block for alternative and repetitive constructs that allow nondeterministic program components for which at least the activity evoked, but possibly even the final state, is not necessarily uniquely determined by the initial state. For the formal derivation of programs expressed in terms of these constructs, a calculus will be be shown.
{{< /abstract >}}

It is a generalization of 
[Oleg Kiselyov’s `pmatch`](https://okmij.org/ftp/Scheme/macros.html#match-case-simple), a 
simple pattern-matcher for linear patterns:
from it we adapt the test [`test/meta-circular-interpreter`](#test/meta-circular-interpreter) about a *meta-circular interpreter*.
This matcher is described and used in [the paper]({{< relref "post/minikanren-live-and-untagged.md" >}}) about *miniKanren*.

Our implementation contains:
- some *refactorings* of the upstream code,
- matching of *vectors* and *records*,
- *guards* are introduced after the `⇒` keyword,
- *injection* and *negated injection* of expressions in patterns (see those in action in a [more complex interpreter]({{< relref "post/minikanren-live-and-untagged.md" >}}#test-%CE%BB-calculus-interpreter))
- sexp-based *error reporting* in case of either no matches or overlapping patterns.

The implementation of the corresponding syntaxes tackles the critique in:

{{< bibentry "wadler1987critique" >}}.

## An example

For the sake of clarity, consider the following definition:

```scheme
(define (w x y)
      (match/non-overlapping (cons x y)
        ((,a . ,b) (and (number? a) (number? b)) ⇒ (* a b))
        ((,a . ,b) (+ a b))
        ((,a ,b ,c) (and (number? a) (number? b) (number? c)) ⇒ (+ a b c))))
```

so that evaluating the expression `(list (w 3 4) (apply w '(1 (3 4))))` yields

```scheme
Error: match/non-overlapping

((reason "overlapping match")
 (expr (cons x y))
 (value (3 . 4))
 (ambiguities
   (((,a unquote b) (and (number? a) (number? b)) ⇒ (* a b))
    ((,a unquote b) #t ⇒ (+ a b)))))
```

as expected.

{{< include "test-suites/testsuite-dmatch-suite.html" >}}
