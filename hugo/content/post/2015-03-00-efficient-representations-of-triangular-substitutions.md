+++
date = '2015-03-01T18:33:23+01:00'
title = "Eﬃcient representations for triangular substitutions"
author = ["David C. Bender", "Lindsey Kuper", "William E. Byrd", "Daniel P. Friedman"]
subtitle = 'A comparison in miniKanren'
tags = [ 'kanren', 'sbral', 'substitutions', 'unification', 'logic', 'scheme', 'functional', 'lookup', 'triangular', 'minikanren' ]
categories = [ "scheme", 'papers']
summary = 'This paper studies efficient representations for triangular substitutions in miniKanren, showing how skew binary random-access lists reduce lookup costs while preserving the advantages of a purely functional Scheme implementation.'
+++

{{< bibtex
author = "Bender, David and Kuper, Lindsey and Byrd, William and Friedman, Daniel"
year = "2015"
month = "03"
url = "https://users.soe.ucsc.edu/~lkuper/papers/walk.pdf"
abstract = "Unification, a fundamental process for logic programming systems, relies on the ability to efficiently look up values of variables in a substitution. Triangular substitutions, which allow associations to variables that are themselves bound by another association, are an attractive choice for purely functional implementations of logic programming systems because of their fast extension time and linear space requirement, but have the disadvantage of costly lookup. We present several representations for triangular substitutions that decrease the cost of lookup to linear or logarithmic time in the size of the substitution while maintaining most of their desirable properties. In particular, we show that triangular substitutions can be represented efficiently using skew binary random-access lists, and that this representation provides a significant decrease in running time for existing programs written in miniKanren, a declarative logic programming system implemented in a pure functional subset of Scheme."
title = "Efficient representations for triangular substitutions: A comparison in miniKanren"
>}}
