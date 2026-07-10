+++
date = '2018-03-09T10:02:03+01:00'
title = 'The Reasoned Schemer'
subtitle = 'miniKanren, microKanren and some implementations'
summary = ' '
categories = ['scheme', 'kanren', 'logic programming']
tags = ['sbral']
+++

# References

## *The Reasoned Schemer* little book

{{< bibtex
author = "Friedman, Daniel P. and Byrd, William E. and Kiselyov, Oleg and Hemann, Jason"
title = "The Reasoned Schemer"
year = "2018"
isbn = "0262535513"
publisher = "The MIT Press"
edition = "2nd"
url = "https://dl.acm.org/doi/10.5555/3267158"
abstract = "A new edition of a book, written in a humorous question-and-answer style, that shows how to implement and use an elegant little programming language for logic programming. The goal of this book is to show the beauty and elegance of relational programming, which captures the essence of logic programming. The book shows how to implement a relational programming language in Scheme, or in any other functional language, and demonstrates the remarkable flexibility of the resulting relational programs. As in the first edition, the pedagogical method is a series of questions and answers, which proceed with the characteristic humor that marked The Little Schemer and The Seasoned Schemer. Familiarity with a functional language or with the first five chapters of The Little Schemer is assumed. For this second edition, the authors have greatly simplified the programming language used in the book, as well as the implementation of the language. In addition to revising the text extensively, and simplifying and revising the Laws and Commandments, they have added explicit Translation rules to ease translation of Scheme functions into relations."
>}}

## The *µkanren* paper

{{< bibtex
title = "microkanren: A Minimal Functional Core for Relational Programming"
abstract = "This paper presents µKanren, a minimalist language in the miniKanren family of relational (logic) programming languages. Its implementation comprises fewer than 40 lines of Scheme. We motivate the need for a minimalist miniKanren language, and iteratively develop a complete search strategy. Finally, we demonstrate that through suf cient user-level features one regains much of the expressiveness of other miniKanren languages. In our opinion its brevity and simple semantics make µKanren uniquely elegant."
keywords = "miniKanren, relational programming, logic programming, Scheme (Computer program language)"
author = "Jason Hemann and Friedman, Daniel P."
url = "https://shu.elsevierpure.com/en/publications/microkanren-a-minimal-functional-core-for-relational-programming/"
year = "2013"
month = nov,
day = "13"
language = "American English"
note = "Workshop on Scheme and Functional Programming ; Conference date: 13-11-2013 Through 13-11-2013"
>}}

## The *Efficient representations for triangular substitutions* paper

{{< bibtex
author = "Bender, David and Kuper, Lindsey and Byrd, William and Friedman, Daniel"
year = "2015"
month = "03"
url = "https://users.soe.ucsc.edu/~lkuper/papers/walk.pdf"
abstract = "Unification, a fundamental process for logic programming systems, relies on the ability to efficiently look up values of variables in a substitution. Triangular substitutions, which allow associations to variables that are themselves bound by another association, are an attractive choice for purely functional implementations of logic programming systems because of their fast extension time and linear space requirement, but have the disadvantage of costly lookup. We present several representations for triangular substitutions that decrease the cost of lookup to linear or logarithmic time in the size of the substitution while maintaining most of their desirable properties. In particular, we show that triangular substitutions can be represented efficiently using skew binary random-access lists, and that this representation provides a significant decrease in running time for existing programs written in miniKanren, a declarative logic programming system implemented in a pure functional subset of Scheme."
title = "Efficient representations for triangular substitutions: A comparison in miniKanren"
>}}


{{< include "test-suites/testsuite-microkanren-suite.html" >}}

