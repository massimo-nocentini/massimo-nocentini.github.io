+++
date = '1994-02-01T18:33:23+01:00'
title = "Representing monads"
author = "Andrzej Filinski"
tags = [ "monads", "callcc", "shift", "reset" ]
categories = [ "ml", 'papers']
summary = ' '
+++

{{< bibtex
author = "Filinski, Andrzej"
title = "Representing monads"
year = "1994"
isbn = "0897916360"
publisher = "Association for Computing Machinery"
address = "New York, NY, USA"
url = "https://doi.org/10.1145/174675.178047"
doi = "10.1145/174675.178047"
abstract = "We show that any monad whose unit and extension operations are expressible as purely functional terms can be embedded in a call-by-value language with “composable continuations”. As part of the development, we extend Meyer and Wand's characterization of the relationship between continuation-passing and direct style to one for continuation-passing vs. general “monadic” style. We further show that the composable-continuations construct can itself be represented using ordinary, non-composable first-class continuations and a single piece of state. Thus, in the presence of two specific computational effects - storage and escapes - any expressible monadic structure (e.g., nondeterminism as represented by the list monad) can be added as a purely definitional extension, without requiring a reinterpretation of the whole language. The paper includes an implementation of the construction (in Standard ML with some New Jersey extensions) and several examples."
booktitle = "Proceedings of the 21st ACM SIGPLAN-SIGACT Symposium on Principles of Programming Languages"
pages = "446–457"
numpages = "12"
location = "Portland, Oregon, USA"
series = "POPL '94"
>}}