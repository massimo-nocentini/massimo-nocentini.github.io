+++
date = '2008-04-14T18:33:23+01:00'
title = "Pure, declarative, and constructive arithmetic relations"
subtitle = 'A declarative pearl'
author = ['William E. Byrd', 'Oleg Kiselyov', 'Daniel P. Friedman', 'Chung-Chieh Shan']
categories = [ "scheme", 'logic programming']
abstract = '''
We present decidable logic programs for addition, multiplication, division with remainder, exponentiation, and logarithm with remainder over the unbounded domain of natural numbers. Our predicates represent relations without mode restrictions or annotations. They are fully decidable under the common, DFS-like, SLD resolution strategy of Prolog or under an interleaving refinement of DFS. We prove that the evaluation of our arithmetic goals always terminates, given arguments that share no logic variables. Further, the (possibly infinite) set of solutions for a goal denotes exactly the corresponding mathematical relation. (For SLD without interleaving, and for some infinite solution sets, only half of the relation's domain may be covered.) We define predicates to handle unary (for illustration) and binary representations of natural numbers, and prove termination and completeness of these predicates. Our predicates are written in pure Prolog, without cut (!), var/1, or other nonlogical operators. The purity and minimalism of our approach allows us to declare arithmetic in other logic systems, such as Haskell type classes.'''
+++

<!--more-->

{{< bibentry "kiselyov2008pure" >}}.
