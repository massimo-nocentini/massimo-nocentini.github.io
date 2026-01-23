+++
date = '2026-01-22T10:18:13+01:00'
title = 'Chez, 48 and Chicken Schemes'
subtitle = 'Some docs, refs and containers, respectively.' 
tags = ['containers', 'scheme',]
+++

## On learning the Scheme language

The good [Will Byrd](http://webyrd.net/) ([github](https://github.com/webyrd)), that I met in person at [ICFP 2017](https://icfp17.sigplan.org/),
has many advices and the video [Resources for Learning Scheme](https://www.youtube.com/watch?v=iC8eSdoyu9A) is a good starting point.

{{< youtube iC8eSdoyu9A >}}


## Cisco's Chez Scheme

Cisco open sourced its repo [Chez Scheme](https://cisco.github.io/ChezScheme/), which contains an implementation of a (superset) of 
[The Revised⁶ Report on the Algorithmic Language Scheme](https://www.r6rs.org/).

We provide a [container](https://github.com/massimo-nocentini/chez-scheme.docker/pkgs/container/chez-scheme.docker/652560938?tag=10.3.0)
for version [10.3.0](https://github.com/cisco/ChezScheme/releases/tag/v10.3.0), which can be pulled by:
```bash
docker pull ghcr.io/massimo-nocentini/chez-scheme.docker:10.3.0
```
it is an [*alpine*-based image](https://hub.docker.com/_/alpine) and the code is compiled with [clang](https://clang.llvm.org/).

## Scheme48 

> Scheme 48 is an implementation of Scheme written by Richard Kelsey and Jonathan Rees. 
> It is based on a byte-code interpreter and is designed to be used as a testbed for experiments 
> in implementation techniques and as an expository tool.

The current version of [Scheme 48](https://s48.org/) is [1.9.3](https://s48.org/1.9.3/scheme48-1.9.3.tgz) (released November 2024)
and implements the [The Revised⁵ Report on the Algorithmic Language Scheme](https://dl.acm.org/doi/10.1145/290229.290234).

We provide the companion [container](https://github.com/massimo-nocentini/scheme48.docker/pkgs/container/scheme48.docker/575699347?tag=1.9.3)
which can be pulled by:
```bash
docker pull ghcr.io/massimo-nocentini/scheme48.docker:1.9.3
```


