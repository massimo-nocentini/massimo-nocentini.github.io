+++
date = '2026-04-10T09:58:04+01:00'
title = 'The (aux fds sbral) module'
subtitle = 'Skew Binary Random-Access Lists, aka SBRALs.'
summary = 'A walkthrough of the Scheme module `(aux fds sbral)`, showing how skew binary random-access lists support persistent front operations in constant amortized time and indexed lookup and update in logarithmic time.'
categories = ['scheme']
tags = ['sbral', 'scheme', 'persistent', 'functional', 'sequences', 'indexing', 'trees', 'lookup', 'update', 'amortized']
+++

# Skew Binary Random-Access Lists (SBRALs)

This post explains the implementation of the SBRAL data structure in this repository.

The code lives in `(aux fds sbral)` and implements a persistent sequence with:

- \\(O(1)\\) amortized insertion at the front (`cons/sbral`)
- \\(O(1)\\) front access and removal (`car/sbral`, `cdr/sbral`)
- \\(O(log n)\\) indexed lookup and update (`sbral-ref`, `update/sbral`)

The implementation combines a list-like interface with tree-based indexing.

## Why SBRALs?

A plain linked list gives \\(O(1)\\) `cons` and `car`, but \\(O(n)\\) indexed access.
A vector gives \\(O(1)\\) indexing, but front insertion is expensive.

A skew binary random-access list balances these trade-offs by storing values in a
small forest of complete binary trees, each tagged with its size.

## External representation in this implementation

The sequence is represented as a list of pairs:

- each element has shape `(size . tree)`
- `size` is the number of values inside that tree
- `tree` is one of:
  - leaf: `(value)`
  - node: `(value left right)`

Examples from the tests:

```scheme
'((1 a))
'((1 b) (1 a))
'((3 c (b) (a)))
'((7 g (f (e) (d)) (c (b) (a))))
```

Notice how tree sizes are always of the form \\(2^k - 1\\) (1, 3, 7, 15, ...).

## Core invariant

The head of the SBRAL is a list of weighted trees that behaves like skew binary digits.
`cons/sbral` maintains this invariant:

- if the first two trees have equal size, they are merged with the new value as root
- otherwise, the new value becomes a singleton tree of size 1 at the front

This gives constant-time front insertion while preserving efficient indexing.

## Function-by-function walkthrough

### `empty/sbral`

```scheme
(define empty/sbral '())
```

The empty sequence.

### `cons/sbral`

`cons/sbral` is the key constructor. It pattern-matches the first two weighted trees.

- merge case: two equal sizes `x` and `y` become one tree of size `(+ 1 x y)`
- fallback case: prepend `(1 . (v))`

In this file, the merge is built as:

```scheme
`((,(+ 1 x y) ,v ,xtree ,ytree) . ,sbral*)
```

which corresponds to `(size . tree)` with `tree = (v xtree ytree)`.

### tree access helpers

- `sbral-tree-leaf?`
- `sbral-tree-node?`
- `sbral-tree-value`
- `sbral-tree-left`
- `sbral-tree-right`

These encapsulate the local tree encoding and keep the navigation code readable.

### `car/sbral`

Reads the value at the root of the first tree.

Because every non-empty SBRAL puts its logical front at that root, this is \\(O(1)\\).

### `cdr/sbral`

Removes the front element.

- if first tree has size 1 (leaf), drop it
- if first tree is a node of size `w`, split it into two trees of size `w/2`

This is the inverse of the merge done by `cons/sbral`, and is \\(O(1)\\).

### `sbral-tree-lookup`

Performs indexed traversal inside one weighted tree.

- index 0 is the root
- remaining indexes are routed left or right using `whalf = (quotient w 2)`

The recursion depth is tree height, so \\(O(log w)\\).

### `sbral-ref`

Lookup across the whole structure:

- if index `i` falls in first weighted tree (size `size`), delegate to `sbral-tree-lookup`
- otherwise recurse on the tail with shifted index `(- i size)`

Because there are only \\(O(log n)\\) weighted trees and each tree lookup is \\(O(log n)\\),
this stays logarithmic in practice for this representation.

### `sbral-tree-update` and `update/sbral`

Update mirrors lookup:

- descend to the target position
- rebuild only the nodes along the path
- share untouched subtrees

This keeps persistence and immutability while making update \\(O(log n)\\).

### folds and conversions

- `foldr/sbral`: right fold over logical indexes and values
- `length/sbral`: sums tree weights
- `list->sbral`: `foldr` with `cons/sbral`
- `sbral->list`: right fold over indexes using `sbral-ref`

The module also provides:

- `map/sbral`
- `filter/sbral`
- `exists?/sbral`
- `prefix/sbral`

## Complete function reference (one-line comments)

This is the compact comment-style reference for every definition in the module.

- `cons/sbral`: insert a value at the front, merging first two trees when they have equal weight.
- `sbral-tree-leaf?`: return true when a tree is encoded as a single value.
- `sbral-tree-node?`: return true when a tree is encoded as value plus two children.
- `sbral-tree-value`: extract the root value from a tree.
- `sbral-tree-left`: extract the left subtree from an internal node.
- `sbral-tree-right`: extract the right subtree from an internal node.
- `car/sbral`: return the first logical element of a non-empty SBRAL.
- `cdr/sbral`: remove the first logical element, splitting the first tree when needed.
- `sbral-tree-lookup`: lookup index `i` inside a weighted tree of weight `w`.
- `sbral-tree-update`: update index `i` inside a weighted tree of weight `w`, returning a new tree.
- `sbral-ref`: random-access lookup by logical index across the forest of weighted trees.
- `update/sbral`: persistent update by logical index across the forest.
- `foldr/sbral`: fold right over logical indexes and values.
- `length/sbral`: compute the number of elements by summing tree weights.
- `list->sbral`: build an SBRAL from a plain list.
- `sbral->list`: convert an SBRAL back into a plain list.
- `map/sbral`: map with index over an SBRAL, preserving persistence.
- `filter/sbral`: filter with index over an SBRAL.
- `exists?/sbral`: return true when any indexed element satisfies the predicate.
- `prefix/sbral`: build a function that returns the prefix of a sequence before marker `s`.

## Complexity summary

For a structure with \\(n\\) elements:

- `cons/sbral`: \\(O(1)\\) amortized
- `car/sbral`: \\(O(1)\\)
- `cdr/sbral`: \\(O(1)\\)
- `sbral-ref`: \\(O(log n)\\)
- `update/sbral`: \\(O(log n)\\)
- `length/sbral`: O(number of weighted trees), which is \\(O(log n)\\)

## Small worked example

Starting from empty:

1. `cons a` -> `((1 a))`
2. `cons b` -> `((1 b) (1 a))`
3. `cons c` merges two size-1 trees -> `((3 c (b) (a)))`
4. `cons d` -> `((1 d) (3 c (b) (a)))`
5. `cdr` splits the size-3 root back into two size-1 trees

The tests in `src/test/fds.sbral.scm` exercise exactly these transitions.

## Notes on style and safety

This implementation uses pattern matching utilities from `(aux base)` (`match/first`,
`match1/first`, `match/non-overlapping`) to keep structural cases explicit.

When invariants are violated, functions raise an error such as:

- `car/sbral: not a valid sbral`
- `cdr/sbral: not a valid sbral`
- `sbral-tree-lookup: not a valid sbral`

That makes failures fail-fast and helps debugging malformed values.

## Conclusion

This SBRAL implementation is a compact and idiomatic Scheme realization of a
persistent random-access list. The interesting part is the skew-binary merge/split
logic in `cons/sbral` and `cdr/sbral`: once that invariant is maintained, indexed
lookup and update follow naturally from weighted tree traversal.

{{< include "test-suites/testsuite-sbral-suite.html" >}}