+++
date = '2026-02-24T10:59:04+01:00'
title = "Pattern matching"
subtitle = 'Scheme Macrology: a generalized and guarded matcher'
summary = ' '
tags = ['pattern matching']
categories = ['scheme']
+++

This post defines and tests the `match/non-overlapping` pattern matcher, which is a generalization of 
[Oleg Kiselyov’s `pmatch`](https://okmij.org/ftp/Scheme/macros.html#match-case-simple) one and used in
[the paper]({{% relref "post/2026-02-04-minikanren-live-and-untagged.md" %}}) about *miniKanren*.

{{< include "test-suites/testsuite-dmatch-suite.html" >}}