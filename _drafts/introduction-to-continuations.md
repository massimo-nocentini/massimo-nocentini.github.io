---
layout: post
title:  Introduction to Continuations
date:   2016-05-06 
categories: [scheme, continuations, friedman, springer]
---

A computer is like a genie. While computing, it takes snapshots of where
it is in the computation: not every points, only the ones that you tell it
are worth saving. Such snapshots correspond to what are called *escape procedures*
and invoking one them is the same to rub a snapshot. In this essay we reason
about the power of escape procedures.

The following content is taken from Chapter 16 of [Scheme and the Art of Programming][sap]:
we proceed step by step in order to deeply understand the concept of *escape procedures*,
our Scheme environment is [Chicken Scheme][chicken]. Where enlightment sentences are required
and mandatory to understand -- in our opinion -- we simple quote the words of original authors, entirely. 
This essay is structured the same as the upstream chapter.

# Overview

The following parallel with everyday life is pretty interesting:

>Did you ever lie in bed early in the morning and think about what you were going to do that day?
Your thinking probably let to something like this: "I've got to shower, eat breakfast, find my way
to campus and get my first class. After I get to my first class, I'll think about **what I have left to do for the rest of the day**."
You packaged **the rest of the day** into a single concept, relative to some point in the morning;
you have formed an abstraction of the rest of the day.

Toward computation:

>In Scheme **the rest of the computation** relative to some point in an evaluation can
also be packaged in the same way we packaged **the rest of the day**; the rest of a
computation is a **continuation**. In order to understand continuations, two new concepts
-- *contexts* and *escape procedures* -- must be acquired. The former formalizes the 
creation of a procedure with respect to a *sub*-expression of an expression; on the other hand,
the latter characterizes a procedure that upon invocation does not return to the point
of its invocation.

Finally, a definition:

>A **continuation** is a context that has been made into an escape procedure. Such 
continuations are created by invocations of `call-with-current-continuations`.

In the following definition, when function `error` gets invoked, its context -- 
*a procedure that represents the rest of the computation* -- is abandoned:

{% highlight scheme %}

(define /-checked
 (lambda (dividend divisor)
  (cons 
   (if (zero? divisor)
    (error "/:" dividend "divided by zero")
    (/ dividend divisor))
   '(simple hello world list))))

{% endhighlight %}

If `error` were a conventional procedure then, when it returned, we would do the `cons` and variable `x` in list 

    `(,x simple hello world list)

would not like to be a number; therefore, if function `error` gets invoked, no `cons` happens.



[sap]:http://dl.acm.org/citation.cfm?id=75029
[chicken]:https://www.call-cc.org/
