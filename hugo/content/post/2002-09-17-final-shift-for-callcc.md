+++
date = '2002-09-17T18:33:23+01:00'
title = "Final shift for call/cc"
subtitle = "Direct implementation of shift and reset"
author = ["Martin Gasbichler", "Michael Sperber"]
tags = [ "monads", "callcc", "shift", "reset" ]
categories = [ "scheme", 'papers']
summary = ' '
+++

{{< bibtex
author = "Gasbichler, Martin and Sperber, Michael"
title = "Final shift for call/cc: direct implementation of shift and reset"
year = "2002"
issue_date = "September 2002"
publisher = "Association for Computing Machinery"
address = "New York, NY, USA"
volume = "37"
number = "9"
issn = "0362-1340"
url = "https://doi.org/10.1145/583852.581504"
doi = "10.1145/583852.581504"
abstract = "We present a direct implementation of the shift and reset control operators in the SFE system. The new implementation improves upon the traditional technique of simulating shift and reset via callcc. Typical applications of these operators exhibit space savings and a significant overall performance gain. Our technique is based upon the popular incremental stack/heap strategy for representing continuations. We present implementation details as well as some benchmark measurements for typical applications."
journal = "SIGPLAN Not."
month = sep,
pages = "271–282"
numpages = "12"
keywords = "scheme, implementation, continuations"
>}}