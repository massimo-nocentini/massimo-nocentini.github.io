+++
date = '2008-04-14T18:33:23+01:00'
title = "Pure, declarative, and constructive arithmetic relations"
author = ['William E. Byrd', 'Oleg Kiselyov', 'Daniel P. Friedman', 'Chung-Chieh Shan']
subtitle = 'A declarative pearl'
tags = []
categories = [ "scheme", 'logic programming']
summary = ' '
+++

{{< bibtex
author = "Kiselyov, Oleg and Byrd, William E. and Friedman, Daniel P. and Shan, Chung-Chieh"
title = "Pure, declarative, and constructive arithmetic relations"
year = "2008"
isbn = "3540789685"
publisher = "Springer-Verlag"
url = "https://dl.acm.org/doi/10.5555/1788446.1788456"
address = "Berlin, Heidelberg"
abstract = "We present decidable logic programs for addition, multiplication, division with remainder, exponentiation, and logarithm with remainder over the unbounded domain of natural numbers. Our predicates represent relations without mode restrictions or annotations. They are fully decidable under the common, DFS-like, SLD resolution strategy of Prolog or under an interleaving refinement of DFS. We prove that the evaluation of our arithmetic goals always terminates, given arguments that share no logic variables. Further, the (possibly infinite) set of solutions for a goal denotes exactly the corresponding mathematical relation. (For SLD without interleaving, and for some infinite solution sets, only half of the relation's domain may be covered.) We define predicates to handle unary (for illustration) and binary representations of natural numbers, and prove termination and completeness of these predicates. Our predicates are written in pure Prolog, without cut (!), var/1, or other nonlogical operators. The purity and minimalism of our approach allows us to declare arithmetic in other logic systems, such as Haskell type classes."
booktitle = "Proceedings of the 9th International Conference on Functional and Logic Programming"
pages = "64–80"
numpages = "17"
location = "Ise, Japan"
series = "FLOPS'08"
>}}

