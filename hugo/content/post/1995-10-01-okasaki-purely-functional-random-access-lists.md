+++
date = '1995-10-01T18:33:23+01:00'
title = "Purely functional random-access lists"
author = "Chris Okasaki"
tags = [ 'randomaccess', 'functional', 'lists', 'lookup', 'update', 'indexing', 'arrays', 'persistent', 'logarithmic' ]
categories = [ 'papers', 'Okasaki']
summary = 'Okasaki introduces purely functional random-access lists, a data structure that combines constant-time list operations with logarithmic lookup and update, offering an efficient persistent alternative to arrays in functional programs.'
+++

{{< bibtex
author = "Okasaki, Chris"
title = "Purely functional random-access lists"
year = "1995"
isbn = "0897917197"
publisher = "Association for Computing Machinery"
address = "New York, NY, USA"
url = "https://doi.org/10.1145/224164.224187"
doi = "10.1145/224164.224187"
booktitle = "Proceedings of the Seventh International Conference on Functional Programming Languages and Computer Architecture"
pages = "86–95"
numpages = "10"
location = "La Jolla, California, USA"
series = "FPCA '95"
abstract = "We present a new data structure, called a random-access list, that supports array lookup and update operations in O(log n) time, while simultaneously providing O(1) time list operations (cons, head, tail). A closer analysis of the  array operations improves the bound to O(min{i, log n}) in the worst case and O(log i) in the expected case, where i is the index of the desired element. Empirical evidence suggests that this data structure should be quite efficient in  practice."
>}}