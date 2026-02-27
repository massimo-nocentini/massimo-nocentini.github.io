+++
date = '2026-02-24T10:59:04+01:00'
title = "Pattern matching"
subtitle = 'Scheme macrology: a generalized pattern matcher'
summary = ' '
tags = ['pattern matching', 'macrology', 'interpreter', 'meta', 'circular']
categories = ['scheme']
+++

This post defines and tests the `match/non-overlapping` pattern matcher, which is a generalization of 
[Oleg Kiselyov’s `pmatch`](https://okmij.org/ftp/Scheme/macros.html#match-case-simple), a 
simple pattern-matcher for linear patterns:
from it we adapt the test [`test/meta-circular-interpreter`](#test/meta-circular-interpreter) about a *meta-circular interpreter*.
This matcher is described and used in [the paper]({{% relref "post/2026-02-04-minikanren-live-and-untagged.md" %}}) about *miniKanren*.

Our implementation contains:
- some *refactorings* of the upstream code,
- matching of *vectors* and *records*,
- *guards* are introduced after the `⇒` keyword,
- sexp-based *error reporting* in case of either no matches or overlapping patterns. 

# An example

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