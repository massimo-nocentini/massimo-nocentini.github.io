+++
date = '2012-09-09T18:33:23+01:00'
title = "miniKanren, live and untagged"
author = ['William E. Byrd', 'Eric Holk', 'Daniel P. Friedman']
subtitle = 'Quine generation via relational interpreters'
tags = [ "kanren" ]
categories = ["acm", "scheme", 'papers', 'programming pearls']
summary = ' '
+++

{{< bibtex
author="Byrd, William E. and Holk, Eric and Friedman, Daniel P."
title="miniKanren, live and untagged: quine generation via relational interpreters (programming pearl)"
year="2012"
isbn="9781450318952"
publisher="Association for Computing Machinery"
address="New York, NY, USA"
url="https://doi.org/10.1145/2661103.2661105"
doi="10.1145/2661103.2661105"
abstract="We present relational interpreters for several subsets of Scheme, written in the pure logic programming language miniKanren. We demonstrate these interpreters running \"backwards\"---that is, generating programs that evaluate to a specified value---and show how the interpreters can trivially generate quines (programs that evaluate to themselves). We demonstrate how to transform environment-passing interpreters written in Scheme into relational interpreters written in miniKanren. We show how constraint extensions to core miniKanren can be used to allow shadowing of the interpreter's primitive forms (using the absent° tree constraint), and to avoid having to tag expressions in the languages being interpreted (using disequality constraints and symbol/number type-constraints), simplifying the interpreters and eliminating the need for parsers/unparsers.We provide four appendices to make the code in the paper completely self-contained. Three of these appendices contain new code: the complete implementation of core miniKanren extended with the new constraints; an extended relational interpreter capable of running factorial and doing list processing; and a simple pattern matcher that uses Dijkstra guards. The other appendix presents our preferred version of code that has been presented elsewhere: the miniKanren relational arithmetic system used in the extended interpreter."
booktitle="Proceedings of the 2012 Annual Workshop on Scheme and Functional Programming"
pages="8–29"
numpages="22"
keywords="tagging, scheme, relational programming, quines, miniKanren, logic programming, interpreters"
location="Copenhagen, Denmark"
series="Scheme '12"
>}}