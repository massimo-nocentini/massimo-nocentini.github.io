+++
date = '2002-09-17T18:33:23+01:00'
title = "Final shift for call/cc"
subtitle = "Direct implementation of shift and reset"
author = ["Martin Gasbichler", "Michael Sperber"]
categories = [ "scheme", 'papers']
tags = [ "monads", "callcc", "shift", "reset" ]
abstract = '''
We present a direct implementation of the shift and reset control operators in the SFE system. The new implementation improves upon the traditional technique of simulating shift and reset via callcc. Typical applications of these operators exhibit space savings and a significant overall performance gain. Our technique is based upon the popular incremental stack/heap strategy for representing continuations. We present implementation details as well as some benchmark measurements for typical applications.'''
+++

<!--more-->

{{< bibentry "gasbichler2002final" >}}.

{{< include "test-suites/testsuite-delimcc-suite.html" >}}
