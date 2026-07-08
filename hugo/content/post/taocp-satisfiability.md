+++
date = '2026-01-28T09:56:03+01:00'
title = 'TAOCP: Volume 4, Fascicle 6.'
subtitle = "Satisfiability"
author = 'Donald E. Knuth'
tags = ['satisfiability']
categories = ['taocp', 'knuth', 'cweb', 'c', 'books', 'computer science']
summary = ' '
+++

The following paper:

{{< bibtex
author = "Fichte, Johannes K. and Berre, Daniel Le and Hecher, Markus and Szeider, Stefan"
title = "The Silent (R)evolution of SAT"
year = "2023"
issue_date = "June 2023"
publisher = "Association for Computing Machinery"
address = "New York, NY, USA"
volume = "66"
number = "6"
issn = "0001-0782"
url = "https://doi.org/10.1145/3560469"
doi = "10.1145/3560469"
abstract = "Today's powerful, robust SAT solvers have become primary tools for solving hard computational problems."
journal = "Commun. ACM"
month = may,
pages = "64–72"
numpages = "9"
>}}

inspired us to go deep in Knuth's work on *satisfiability*, which is the topic of the current post.

# Fascicle

{{< bibtex

author = "Knuth, Donald E."
title = "The Art of Computer Programming, Volume 4, Fascicle 6: Satisfiability"
year = "2015"
url = "https://dl.acm.org/doi/book/10.5555/2898950"
isbn = "0134397606"
publisher = "Addison-Wesley Professional"
edition = "1st"
abstract = "This multivolume work on the analysis of algorithms has long been recognized as the definitive description of classical computer science. The four volumes published to date already comprise a unique and invaluable resource in programming theory and practice. Countless readers have spoken about the profound personal influence of Knuths writings. Scientists have marveled at the beauty and elegance of his analysis, while practicing programmers have successfully applied his cookbook solutions to their day-to-day problems. All have admired Knuth for the breadth, clarity, accuracy, and good humor found in his books. To continue the fourth and later volumes of the set, and to update parts of the existing volumes, Knuth has created a series of small books called fascicles, which are published at regular intervals. Each fascicle encompasses a section or more of wholly new or revised material. Ultimately, the content of these fascicles will be rolled up into the comprehensive, final versions of each volume, and the enormous undertaking that began in 1962 will be complete. Volume 4 Fascicle 6 This fascicle, brimming with lively examples, forms the middle third of what will eventually become hardcover Volume 4B. It introduces and surveys Satisfiability, one of the most fundamental problems in all of computer science: Given a Boolean function, can its variables be set to at least one pattern of 0s and 1s that will make the function true? Satisfiability is far from an abstract exercise in understanding formal systems. Revolutionary methods for solving such problems emerged at the beginning of the twenty-first century, and theyve led to game-changing applications in industry. These so-called SAT solvers can now routinely find solutions to practical problems that involve millions of variables and were thought until very recently to be hopelessly difficult. Fascicle 6 presents full details of seven different SAT solvers, ranging from simple algorithms suitable for small problems to state-of-the-art algorithms of industrial strength. Many other significant topics also arise in the course of the discussion, such as bounded model checking, the theory of traces, Las Vegas algorithms, phase changes in random processes, the efficient encoding of problems into conjunctive normal form, and the exploitation of global and local symmetries. More than 500 exercises are provided, arranged carefully for self-instruction, together with detailed answers."


>}}

# Algorithms

Knuth hosts lots of [programs](https://cs.stanford.edu/~knuth/programs.html), in particular he 
provides many implementations of SAT solvers that we collect in the following table:

| Algorithm in [*CWEB*](https://cs.stanford.edu/~knuth/cweb.html)| Description | C source | PDF |
|---|---|---:|---:|
| [Algorithm 7.2.2.2A](https://cs.stanford.edu/~knuth/programs/sat0.w) | very basic SAT solver | [sat0.c](https://github.com/massimo-nocentini/SAT.cweb/blob/master/src/sat0.c) | [sat0.pdf](https://github.com/massimo-nocentini/SAT.cweb/blob/master/tex/sat0.pdf) |
| [Algorithm 7.2.2.2B](https://cs.stanford.edu/~knuth/programs/sat0w.w) | teeny tiny SAT solver | [sat0w.c](https://github.com/massimo-nocentini/SAT.cweb/blob/master/src/sat0w.c) | [sat0w.pdf](https://github.com/massimo-nocentini/SAT.cweb/blob/master/tex/sat0w.pdf) |
| [Algorithm 7.2.2.2W](https://cs.stanford.edu/~knuth/programs/sat8.w) | walk SAT solver | [sat8.c](https://github.com/massimo-nocentini/SAT.cweb/blob/master/src/sat8.c) | [sat8.pdf](https://github.com/massimo-nocentini/SAT.cweb/blob/master/tex/sat8.pdf) |
| [Algorithm 7.2.2.2S](https://cs.stanford.edu/~knuth/programs/sat9.w) | survey propagation SAT solver | [sat9.c](https://github.com/massimo-nocentini/SAT.cweb/blob/master/src/sat9.c) | [sat9.pdf](https://github.com/massimo-nocentini/SAT.cweb/blob/master/tex/sat9.pdf) |
| [Algorithm 7.2.2.2D](https://cs.stanford.edu/~knuth/programs/sat10.w) | Davis–Putnam SAT solver | [sat10.c](https://github.com/massimo-nocentini/SAT.cweb/blob/master/src/sat10.c) | [sat10.pdf](https://github.com/massimo-nocentini/SAT.cweb/blob/master/tex/sat10.pdf) |
| [Algorithm 7.2.2.2L](https://cs.stanford.edu/~knuth/programs/sat11.w) | lookahead 3SAT solver | [sat11.c](https://github.com/massimo-nocentini/SAT.cweb/blob/master/src/sat11.c) | [sat11.pdf](https://github.com/massimo-nocentini/SAT.cweb/blob/master/tex/sat11.pdf) |
| [Change file for Algorithm 7.2.2.2L](https://cs.stanford.edu/~knuth/programs/sat11k.ch) | adapts to clauses of arbitrary length | [sat11k.c](https://github.com/massimo-nocentini/SAT.cweb/blob/master/src/sat11k.c) | [sat11k.pdf](https://github.com/massimo-nocentini/SAT.cweb/blob/master/tex/sat11k.pdf) |
| [preprocessor](https://cs.stanford.edu/~knuth/programs/sat12.w) | preprocessor for SAT solver | [sat12.c](https://github.com/massimo-nocentini/SAT.cweb/blob/master/src/sat12.c) | [sat12.pdf](https://github.com/massimo-nocentini/SAT.cweb/blob/master/tex/sat12.pdf) |
| [companion preprocessor](https://cs.stanford.edu/~knuth/programs/sat12-erp.w) | companion preprocessor | [sat12-erp.c](https://github.com/massimo-nocentini/SAT.cweb/blob/master/src/sat12-erp.c) | [sat12-erp.pdf](https://github.com/massimo-nocentini/SAT.cweb/blob/master/tex/sat12-erp.pdf) |
| [Algorithm 7.2.2.2C](https://cs.stanford.edu/~knuth/programs/sat13.w) | conflict-driven clause learning SAT solver | [sat13.c](https://github.com/massimo-nocentini/SAT.cweb/blob/master/src/sat13.c) | [sat13.pdf](https://github.com/massimo-nocentini/SAT.cweb/blob/master/tex/sat13.pdf) |
| [encoder (sat-nfa)](https://cs.stanford.edu/~knuth/programs/sat-nfa.w) | forcing encoding of regular languages into SAT via NFA | [sat-nfa.c](https://github.com/massimo-nocentini/SAT.cweb/blob/master/src/sat-nfa.c) | [sat-nfa.pdf](https://github.com/massimo-nocentini/SAT.cweb/blob/master/tex/sat-nfa.pdf) |

# Containers

We compiled and ship the corresponding executables in the [`sat.cweb` image](https://github.com/massimo-nocentini/SAT.cweb/pkgs/container/sat.cweb)
that can be pulled easily:

```bash
docker pull ghcr.io/massimo-nocentini/sat.cweb:master
```

which is based on the [`sgb.cweb` Stanford GraphBase image][def] and presented in this [our own page]( {{< relref "2026-01-25-sgb.md" >}} ).

[def]: https://github.com/massimo-nocentini/sgb.cweb/pkgs/container/sgb.cweb