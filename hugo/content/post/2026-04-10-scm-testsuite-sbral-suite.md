+++
date = '2026-04-10T09:58:04+01:00'
title = 'The (aux fds sbral) module'
subtitle = 'Skew Binary Random-Access Lists, aka SBRALs.'
summary = 'A walkthrough of the Scheme module `(aux fds sbral)`, showing how skew binary random-access lists support persistent front operations in constant amortized time and indexed lookup and update in logarithmic time.'
categories = ['scheme']
tags = ['sbral', 'scheme', 'persistent', 'functional', 'sequences', 'indexing', 'trees', 'lookup', 'update', 'amortized']
+++

# Skew Binary Random-Access Lists in Scheme

## Abstract

We describe a CHICKEN Scheme implementation of *skew binary random-access lists*
(SBRALs), a purely functional data structure that provides \\(O(1)\\) worst-case
`cons`, `car`, and `cdr` at the front while supporting \\(O(\\log n)\\) indexed
lookup and persistent update.  The module `(aux fds sbral)` realises the
structure as a list of weight-annotated complete binary trees whose sizes follow
the skew binary number system.  We present the representation, walk through 
every exported definition, give complexity bounds, and illustrate the invariants
with a concrete trace drawn from the accompanying test suite.

## 1. Motivation

Linked lists are the default sequential container in Scheme: `cons`, `car`, and
`cdr` run in \\(O(1)\\), but accessing the \\(i\\)-th element costs \\(O(n)\\).  Vectors
offer \\(O(1)\\) indexing but \\(O(n)\\) functional update.  A skew binary random-access
list closes this gap: it retains the \\(O(1)\\) stack interface at the front and
adds \\(O(\\log n)\\) positional access — all in a persistent, purely functional
setting.

The idea originates from Okasaki (1995) and relies on the *skew binary number
system*, in which every natural number \\(n\\) is represented as a sequence of digits
from \\(\\{0, 1, 2\\}\\) with place values \\(2^{k+1} - 1\\).  The key property is that
incrementing (i.e., `cons`) requires at most one carry, which translates to at
most one tree merge — hence constant time.

## 2. Representation

An SBRAL is stored as an ordinary Scheme list of *weighted trees*.  Each element
is a pair `(w . T)` where:

- \\(w = 2^{k+1} - 1\\) is the number of values stored in the tree \\(T\\);
- \\(T\\) is either
  - a *leaf* `(v)` when \\(w = 1\\), or
  - a *node* `(v L R)` where \\(L\\) and \\(R\\) are subtrees of weight \\(\\lfloor w/2 \\rfloor\\).

Leaves and nodes are distinguished positionally:

```scheme
(define (sbral-tree-leaf? tree) (null? (cdr tree)))
(define (sbral-tree-node? tree) (pair? (cdr tree)))
```

The outer list satisfies the *skew binary invariant*: the sequence of weights
is non-decreasing except that the first two weights may be equal.

## 3. The module, definition by definition

### 3.1 The empty sequence

```scheme
(define empty/sbral '())
```

The empty SBRAL is the empty list, representing the number zero.

### 3.2 `cons/sbral` — front insertion in \\(O(1)\\)

```scheme
(define (cons/sbral v sbral)
  (match/first sbral
    ((((,x . ,xtree) (,y . ,ytree) . ,sbral*) ⊣ (= x y))
     `((,(+ 1 x y) ,v ,xtree ,ytree) . ,sbral*))
    (else `((1 ,v) . ,sbral))))
```

If the first two trees have equal weight \\(x = y\\), they are merged under a new
root carrying value \\(v\\); the resulting tree has weight \\(1 + 2x\\).  Otherwise a
fresh singleton tree `(1 v)` is prepended.  This corresponds to the \\(O(1)\\)
increment rule in the skew binary number system, since at most one carry is ever
needed.

### 3.3 Tree accessors

```scheme
(define (sbral-tree-value tree) (car tree))
(define (sbral-tree-left  tree) (cadr tree))
(define (sbral-tree-right tree) (caddr tree))
```

These project the three fields of an internal node `(v L R)`.

### 3.4 `car/sbral` — front access in \\(O(1)\\)

```scheme
(define (car/sbral sbral)
  (match1/first ((,size . ,tree) (car sbral))
    (cond
      ((or (and (= size 1) (sbral-tree-leaf? tree))
           (sbral-tree-node? tree))
       (sbral-tree-value tree))
      (else (error "car/sbral: not a valid sbral")))))
```

The first logical element always sits at the root of the first tree.  The guard
distinguishes singleton leaves from larger nodes; in both cases the value is
`(car tree)`.

### 3.5 `cdr/sbral` — front removal in \\(O(1)\\)

```scheme
(define (cdr/sbral sbral)
  (match1/first (((,size . ,tree) . ,sbral*) sbral)
    (cond
      ((and (= size 1) (sbral-tree-leaf? tree)) sbral*)
      ((sbral-tree-node? tree)
       (let* ((w (quotient size 2))
              (f (cons w (sbral-tree-left tree)))
              (s (cons w (sbral-tree-right tree))))
         `(,f ,s . ,sbral*)))
      (else (error "cdr/sbral: not a valid sbral")))))
```

Removing the front element is the inverse of the merge performed by
`cons/sbral`.  A singleton tree is simply dropped.  A node of weight \\(w\\) is
*split* into its two children, each of weight \\(\\lfloor w/2 \\rfloor\\), which are
prepended to the remaining forest.  This is exactly the "borrow" operation in
the skew binary system.

### 3.6 `sbral-tree-lookup` — indexed traversal inside a tree, \\(O(\\log w)\\)

```scheme
(define (sbral-tree-lookup w i tree)
  (cond
    ((and (= w 1) (= i 0) (sbral-tree-leaf? tree)) (sbral-tree-value tree))
    ((and (= i 0) (sbral-tree-node? tree))          (sbral-tree-value tree))
    ((sbral-tree-node? tree)
     (let1 (whalf (quotient w 2))
       (cond
         ((<= i whalf) (sbral-tree-lookup whalf (- i 1) (sbral-tree-left tree)))
         (else          (sbral-tree-lookup whalf (- i 1 whalf) (sbral-tree-right tree))))))
    (else (error "sbral-tree-lookup: not a valid sbral"))))
```

Index 0 addresses the root.  For \\(i > 0\\) the function halves the weight and
recurses into the left (\\(i \\le \\lfloor w/2 \\rfloor\\)) or right subtree, adjusting
the index accordingly.  The recursion depth equals the height of a complete
binary tree: \\(O(\\log w)\\).

### 3.7 `sbral-tree-update` — persistent tree update, \\(O(\\log w)\\)

```scheme
(define (sbral-tree-update w i y tree)
  (cond
    ((and (= w 1) (= i 0) (sbral-tree-leaf? tree)) (list y))
    ((and (= i 0) (sbral-tree-node? tree))
     (list y (sbral-tree-left tree) (sbral-tree-right tree)))
    ((sbral-tree-node? tree)
     (let1 (whalf (quotient w 2))
       (cond
         ((<= i whalf)
          (list (sbral-tree-value tree)
                (sbral-tree-update whalf (- i 1) y (sbral-tree-left tree))
                (sbral-tree-right tree)))
         (else
          (list (sbral-tree-value tree)
                (sbral-tree-left tree)
                (sbral-tree-update whalf (- i 1 whalf) y (sbral-tree-right tree)))))))
    (else (error "sbral-tree-update: not a valid sbral"))))
```

The structure mirrors `sbral-tree-lookup` but rebuilds the spine from root to
target, sharing every subtree that is not on the path.  This is the standard
path-copying technique for persistent trees.

### 3.8 `sbral-ref` — global indexed lookup, \\(O(\\log n)\\)

```scheme
(define (sbral-ref sbral i)
  (match/non-overlapping sbral
    ((((,size . ,tree) . _) ⊣ (< -1 i size))
     (sbral-tree-lookup size i tree))
    ((((,size . _) . ,sbral*) ⊣ (<= size i))
     (sbral-ref sbral* (- i size)))))
```

The function walks the forest left to right.  If \\(0 \\le i < \\text{size}\\) for the
current tree, it delegates to `sbral-tree-lookup`; otherwise it subtracts the
weight and recurses on the tail.  The use of `match/non-overlapping` statically
guarantees that exactly one clause fires — any overlap would be flagged at run
time.

### 3.9 `update/sbral` — global indexed update, \\(O(\\log n)\\)

```scheme
(define (update/sbral i y sbral)
  (match1/first (((,size . ,tree) . ,sbral*) sbral)
    (cond
      ((< -1 i size)
       `((,size . ,(sbral-tree-update size i y tree)) . ,sbral*))
      (else
       `(,(car sbral) . ,(update/sbral (- i size) y sbral*))))))
```

Analogous to `sbral-ref` but rebuilds the affected tree via
`sbral-tree-update`, leaving all other trees shared.

### 3.10 `foldr/sbral` — right fold with index

```scheme
(define (foldr/sbral f init sbral)
  (let loop ((l (sub1 (length/sbral sbral))) (out init))
    (if (< l 0) out (loop (sub1 l) (f l (sbral-ref sbral l) out)))))
```

Iterates from the last logical index down to zero, threading an accumulator.
The callback `f` receives three arguments: index, element, accumulator.

### 3.11 Conversions and aggregate queries

```scheme
(define (length/sbral sbral)
  (foldr (λ (each l) (+ (car each) l)) 0 sbral))
```

Sums the weights of all trees.  Because there are at most \\(O(\\log n)\\) trees,
this runs in \\(O(\\log n)\\).

```scheme
(define (list->sbral lst) (foldr cons/sbral empty/sbral lst))
```

Builds an SBRAL from a list by right-folding with `cons/sbral`.

```scheme
(define (sbral->list sbral)
  (foldr/sbral (λ (i each lst) (cons each lst)) '() sbral))
```

The inverse: reconstructs a plain list by right-folding.

### 3.12 Higher-order traversals

```scheme
(define (map/sbral f sbral)
  (foldr/sbral (λ (i each sbral*) (cons/sbral (f i each) sbral*)) empty/sbral sbral))
```

Maps a two-argument function `(f index element)` over the structure, producing a
new SBRAL.

```scheme
(define (filter/sbral pred? sbral)
  (foldr/sbral (λ (i each sbral*) (if (pred? i each) (cons/sbral each sbral*) sbral*))
               empty/sbral sbral))
```

Retains elements for which `(pred? index element)` returns true.

```scheme
(define (exists?/sbral pred? sbral)
  (foldr/sbral (λ (i each exists) (or exists (pred? i each))) #f sbral))
```

Short-circuit existential quantifier over indexed elements.

### 3.13 `prefix/sbral` — structural prefix extraction

```scheme
(define (prefix/sbral s #!key (same? equal?))
  (letrec ((P (μ s*
                (cond
                  ((or (null? s*) (same? s* s)) empty/sbral)
                  (else (cons/sbral (car/sbral s*) (P (cdr/sbral s*))))))))
    P))
```

Returns a *function* that, given an SBRAL `s*`, produces the longest prefix of
`s*` that precedes the suffix `s` under the equality test `same?`.  The use of
`μ` (curried lambda from `(aux base)`) and `letrec` makes the recursive
closure self-contained.

## 4. Complexity summary

| Operation       | Time              | Space (new nodes)  |
|:----------------|:-----------------:|:------------------:|
| `cons/sbral`    | \\(O(1)\\)            | \\(O(1)\\)             |
| `car/sbral`     | \\(O(1)\\)            | —                  |
| `cdr/sbral`     | \\(O(1)\\)            | \\(O(1)\\)             |
| `sbral-ref`     | \\(O(\\log n)\\)       | —                  |
| `update/sbral`  | \\(O(\\log n)\\)       | \\(O(\\log n)\\)        |
| `length/sbral`  | \\(O(\\log n)\\)       | —                  |
| `list->sbral`   | \\(O(n)\\)            | \\(O(n)\\)             |
| `sbral->list`   | \\(O(n \\log n)\\)     | \\(O(n)\\)             |

All bounds are worst-case, not amortized.

## 5. Worked example

We trace `cons/sbral` on the sequence \\(\\langle a, b, c, d, e, f, g \\rangle\\),
inserting elements *from the right* via `list->sbral` (which right-folds):

| Step | Element | Forest (weights)         | Raw representation                          |
|-----:|:-------:|:------------------------:|:--------------------------------------------|
| 1    | g       | 1                        | `((1 g))`                                   |
| 2    | f       | 1 · 1                   | `((1 f) (1 g))`                             |
| 3    | e       | 3                        | `((3 e (f) (g)))`                            |
| 4    | d       | 1 · 3                   | `((1 d) (3 e (f) (g)))`                     |
| 5    | c       | 1 · 1 · 3               | `((1 c) (1 d) (3 e (f) (g)))`               |
| 6    | b       | 3 · 3                   | `((3 b (c) (d)) (3 e (f) (g)))`             |
| 7    | a       | 7                        | `((7 a (b (c) (d)) (e (f) (g))))`           |

After step 7, `(sbral-ref s 0)` returns `a` (root), while `(sbral-ref s 4)`
descends: root \\(\\to\\) right child \\(\\to\\) root, yielding `e`.
`(cdr/sbral s)` splits the weight-7 tree into two weight-3 trees, recovering
step 6.

The test suite verifies all of these transitions:

```scheme
(let1 (q (list->sbral '(a b c d e f g)))
  (⊦= '((7 a (b (c) (d)) (e (f) (g)))) q)
  (⊦= 'a (sbral-ref q 0))
  (⊦= 'g (sbral-ref q 6))
  (⊦= '(a b c d e f g) (sbral->list q)))
```

## 6. Implementation notes

- **Pattern matching.**  The module relies on `match/first` and
  `match/non-overlapping` from `(aux base)`.  The latter statically checks that
  exactly one clause applies, providing a lightweight form of exhaustiveness
  verification.

- **Quasiquote construction.**  Trees are built with back-quote/unquote rather
  than explicit `cons`/`list` calls.  This keeps the code visually close to
  the algebraic-datatype style common in ML presentations of the same structure.

- **Fail-fast errors.**  Every function that pattern-matches raises an explicit
  error on malformed input, making debugging straightforward.

- **Persistence.**  All operations return new structure; no mutation is used.
  Structural sharing is automatic through standard Scheme `cons` semantics.

## References

- C. Okasaki, "Purely Functional Random-Access Lists," in *Functional
  Programming Languages and Computer Architecture (FPCA '95)*, pp. 86–95,
  ACM, 1995.
- C. Okasaki, *Purely Functional Data Structures*, Cambridge University Press,
  1998, §9.3.



{{< include "test-suites/testsuite-sbral-suite.html" >}}