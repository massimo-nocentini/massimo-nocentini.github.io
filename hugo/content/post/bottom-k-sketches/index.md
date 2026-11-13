+++
date = '2026-11-12T10:30:00+01:00'
lastmod = '2026-11-13T09:00:00+01:00'
title = 'Comprehensive Guide to Bottom-$k$ Sketches'
subtitle = 'Unweighted, Weighted, Proofs & Implementations; and VarOpt Sketches of a Recurrence on the Bitcoin Chain'
description = 'Bottom-k (KMV) sketches: cardinality, unions and Jaccard similarity; the weighted extension by priority sampling and exponential scaling with the Horvitz-Thompson estimator; the proof of unbiasedness; Rust and C99 implementations. Then a recurrence sketched: the colour of every transaction of the Bitcoin chain up to 2022 as a VarOpt sketch of at most k blocks, with proofs, the Rust implementation and measurements over 778 million records.'
categories = ['data structure', 'rust', 'c']
tags = ['sketches', 'bottom-k', 'priority sampling', 'VarOpt', 'bitcoin']
toc = true
font = 'etbook'
mathFont = 'euler'
+++

<!--more-->


## 1. Introduction to Bottom-$k$ Sketches

A **bottom-$k$ sketch** (also known as a **K-Minimum Values (KMV)** sketch or a
single-hash **MinHash**
sketch){{< cite "cohen2007summarizing,baryossef2002counting,broder1997resemblance" >}}
is a probabilistic data structure used to summarize massive datasets using fixed, tiny
memory footprints. Instead of storing every unique item in a stream, it hashes each item
onto the interval $[0, 1]$ and retains only the **$k$ smallest unique hash values**.

From those $k$ values alone, one can estimate:

* The total number of distinct elements (**cardinality**),
* The similarity between two sets (**Jaccard similarity**), and
* Set operations (unions and intersections) without re-scanning raw data.

### 1.1 Overview & Construction

Suppose you have a stream of elements and a uniform random hash function $h(x) \to [0, 1]$.

1. **Initialize** an empty max-heap of capacity $k$ alongside a lookup structure to
   ignore duplicates.
2. **Hash each item** $x$ to get a value $v = h(x) \in [0, 1]$.
3. **Update the sketch:**
   - If $v$ is already in the sketch, ignore it.
   - If the sketch has fewer than $k$ items, insert $v$.
   - If the sketch has $k$ items and $v < v_{(k)}$ (the current maximum in the heap),
     evict $v_{(k)}$ and insert $v$.

Because updates only require computing a hash and comparing against $v_{(k)}$,
processing each item takes $O(1)$ expected time or $O(\log k)$ worst-case time.

### 1.2 Primary Applications

### 1.2.1 Cardinality Estimation (Count-Distinct)

If $N$ distinct items are hashed uniformly into $[0, 1]$, they divide the interval into
$N + 1$ sub-intervals of expected length $\frac{1}{N + 1}$. The $k$-th smallest hash
value $v_{(k)}$ has expected value:

$$\mathbb{E}[v_{(k)}] = \frac{k}{N + 1}$$

Inverting this yields the unbiased cardinality estimator $\hat{N}$:

$$\hat{N} = \frac{k - 1}{v_{(k)}}$$

The relative standard error of this estimate is approximately
$\frac{1}{\sqrt{k - 2}}$.{{< sidenote >}}The variance is exactly $N(N - k + 1)/(k - 2)$.
Inverting $\mathbb{E}[v_{(k)}]$ is only the heuristic: by Jensen's inequality the plain
$k/v_{(k)}$ overestimates, and what makes $(k - 1)/v_{(k)}$ exactly unbiased is
$\mathbb{E}[1/v_{(k)}] = N/(k - 1)$. Keeping the $k$ smallest hash values goes back to
Bar-Yossef et al.; the unbiased estimator, its variance and the name KMV are from Beyer
et al.{{< cite "baryossef2002counting,beyer2007synopses" >}}{{< /sidenote >}} Storing
$k = 1024$ hashes yields an estimate with $\approx 3.1\%$ error regardless of whether
$N = 10^4$ or $N = 10^{10}$.

### 1.2.2 Set Merging (Unions)

Given sketch $S(A)$ and sketch $S(B)$ built with the same hash function $h$, the exact
bottom-$k$ sketch of $A \cup B$ is:{{< sidenote >}}This is why KMV sketches merge
exactly, in any order and over any partition of the data: the $k$ smallest hashes of a
union are among the $k$ smallest of each of its parts.{{< /sidenote >}}

$$S(A \cup B) = \text{bottom-}k\big(S(A) \cup S(B)\big)$$

### 1.2.3 Jaccard Similarity & Intersections

The Jaccard similarity $J(A, B) = \frac{|A \cap B|}{|A \cup B|}$ is estimated by taking
the fraction of elements in $S(A \cup B)$ present in both $S(A)$ and $S(B)$:

$$\hat{J}(A, B) = \frac{|S(A \cup B) \cap S(A) \cap S(B)|}{k}$$

The intersection size is then estimated as
$|A \cap B| \approx \hat{J}(A, B) \cdot \hat{N}_{A \cup B}$.{{< sidenote >}}These
estimates ask little of the hash function. Thorup shows that with a merely 2-independent
$h$ the expected relative error of estimating a fraction $f$ (here $J$) from a
bottom-$k$ sample is $O(1/\sqrt{fk})$, within a constant factor of truly random hashing
when $fk = \Omega(1)$.{{< cite "thorup2013bottom" >}}{{< /sidenote >}}

### 1.3 Comparison: Bottom-$k$ vs. MinHash vs. HyperLogLog

The two usual alternatives are $k$-hash MinHash{{< cite "broder1997resemblance" >}} and
HyperLogLog:{{< cite "flajolet2007hyperloglog" >}}

| Feature | Bottom-$k$ Sketch (KMV) | $k$-Hash MinHash | HyperLogLog (HLL) |
| :--- | :--- | :--- | :--- |
| **Hash Functions per Item** | $1$ | $k$ | $1$ |
| **Update Time Complexity** | $O(1)$ expected, $O(\log k)$ worst | $O(k)$ | $O(1)$ |
| **Memory Footprint** | $O(k \log u)$ bits | $O(k \log u)$ bits | $O(m \log \log u)$ bits (~5–6 bits/register) |
| **Best Use Case** | Fast updates + set intersections, Jaccard, & subset sums | Locality-Sensitive Hashing (LSH) | Pure `COUNT(DISTINCT)` at minimal memory |


## 2. Weighted Extension: Priority Sampling & Exponential Scaling

A **weighted bottom-$k$ sketch** generalizes count-distinct sketching to items with
positive weights $w_i > 0$ (e.g., revenue, byte volume, or duration). It samples heavy
items with higher probability and yields unbiased
Horvitz-Thompson{{< cite "horvitz1952generalization" >}} estimates for total stream
weight and arbitrary subset sums.

### 2.1 Core Intuition: Virtual Replication

If an item $x_i$ has integer weight $w_i = 100$, an unweighted sketch could conceptually
split $x_i$ into 100 sub-items $(x_i, 1), \dots, (x_i, 100)$, hashing each to $[0, 1]$
and taking the minimum:

$$r_i = \min_{1 \le j \le w_i} h(x_i, j)$$

Computing $w_i$ hashes directly requires $O(w_i)$ work and fails for continuous
non-integer weights. We can simulate this minimum in **$O(1)$ time** using logarithmic
transformations or priority scaling.

### 2.2 Mathematical Formulations

Given uniform random hashes $u_i = h(i) \in (0, 1)$ and weights $w_i > 0$:

### 2.2.1 Method A: Exponential Scaling (PPSWOR)

Transform $u_i \sim \text{Uniform}(0, 1)$ into an exponential variable
$r_i \sim \text{Exp}(w_i)${{< cite "cohen2008tighter,rosen1997asymptotic" >}}:

$$r_i = \frac{-\ln(u_i)}{w_i}$$

The probability that item $i$ achieves the minimum rank among set $S$ is strictly
proportional to its weight:

$$\Pr\left(r_i = \min_{j \in S} r_j\right) = \frac{w_i}{\sum_{j \in S} w_j}$$

### 2.2.2 Method B: Priority Sampling (Uniform Scaling)

Scale the uniform float directly{{< sidenote >}}Priority sampling is due to Duffield,
Lund and Thorup. The same ranks $u_i / w_i$, keeping the $n$ smallest, define Ohlsson's
*sequential Poisson sampling*, used for the Swedish Consumer Price Index since 1989,
whose estimator Ohlsson showed to be asymptotically unbiased; the threshold estimator of
§2.3 is exactly unbiased
(§3).{{< cite "duffield2007priority,ohlsson1998sequential" >}}{{< /sidenote >}}:

$$r_i = \frac{u_i}{w_i}$$

This avoids logarithmic evaluations while maintaining optimal variance
bounds.{{< sidenote >}}Optimal in a precise sense: Duffield, Lund and Thorup
conjectured, and Szegedy proved, that no unbiased scheme sampling $k$ items has a
smaller total variance than priority sampling with $k + 1$
items.{{< cite "szegedy2006dlt" >}}{{< /sidenote >}}

### 2.3 Horvitz-Thompson Estimator

Let $\tau = r_{(k)}$ be the $k$-th smallest rank in the sketch. The first $k - 1$ items
($r_{(1)}, \dots, r_{(k-1)}$) are retained as active samples, while the $k$-th item sets
the threshold $\tau$.

1. **Under Exponential Scaling ($r_i = -\ln(u_i) / w_i$):**
   Inclusion probability: $p_i(\tau) = 1 - e^{-w_i \tau}$
   Adjusted weight:
   $$\hat{w}_i = \frac{w_i}{1 - e^{-w_i \tau}}$$

2. **Under Priority Sampling ($r_i = u_i / w_i$):**
   Inclusion probability: $p_i(\tau) = \min(1, w_i \tau)$
   Adjusted weight:
   $$\hat{w}_i = \max\left(w_i, \frac{1}{\tau}\right)$$

In both schemes, the threshold-setting item $r_{(k)}$ receives an adjusted weight
$\hat{w}_{(k)} = 0$.

### 2.4 Subset Sum Queries

Let $S_{k-1}$ denote the active sample set of size $k - 1$. For any predicate $Q$ (e.g.,
`region == 'EU'`):

$$\hat{W}_Q = \sum_{i \in S_{k-1} \cap Q} \hat{w}_i \quad \text{where } \mathbb{E}[\hat{W}_Q] = \sum_{i \in Q} w_i$$

### 2.5 Worked Numerical Example ($k = 3$)

Consider $N = 4$ items evaluated with Priority Sampling ($r_i = u_i / w_i$):

| Item | Weight ($w_i$) | Hash ($u_i$) | Rank ($r_i$) | Status ($k = 3$) | Adjusted Weight $\hat{w}_i = \max(w_i, 1/\tau)$ |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **A** | $100$ | $0.50$ | $0.0050$ | 1st ($r_{(1)}$) | $\max(100, 50) = \mathbf{100}$ |
| **B** | $10$ | $0.20$ | $0.0200$ | 3rd ($r_{(3)} = \tau$) | $0$ (Threshold setter: $\tau = 0.02 \implies 1/\tau = 50$) |
| **C** | $20$ | $0.10$ | $0.0050$ | 2nd ($r_{(2)}$) | $\max(20, 50) = \mathbf{50}$ |
| **D** | $5$ | $0.40$ | $0.0800$ | Evicted ($r_D > \tau$) | $0$ |

* **True Total Weight:** $W = 100 + 10 + 20 + 5 = \mathbf{135}$
* **Estimated Total Weight:**
  $\hat{W} = \hat{w}_A + \hat{w}_C = 100 + 50 = \mathbf{150}${{< sidenote >}}A note
  added on 2026-11-13: in this table A and C *tie* at rank $0.005$
  ($0.50/100 = 0.10/20$), so "1st" and "2nd" are a convention, not an order. Nothing
  else changes: both are among the $k - 1 = 2$ samples, $\tau = 0.02$ and the estimates
  stand. With hashes drawn from a continuous distribution a tie has probability
  zero.{{< /sidenote >}}

Heavy item A ($w_A > 1/\tau$) retains its exact weight ($100$), whereas light item C
($w_C < 1/\tau$) is scaled up to $1/\tau = 50$ to represent both itself and unsampled
light items.


## 3. Mathematical Proof of Unbiasedness

### 3.1 The Leave-One-Out Threshold $\tau_{-i}$

Let $r_1, \dots, r_N$ be independent continuous random variables with CDFs
$F_i(t) = \Pr(r_i < t)$. Let $r_{(1)} < \dots < r_{(k)}$ be the sorted ranks, and set
global threshold $\tau = r_{(k)}$.

For any item $i$, define the **leave-one-out threshold** $\tau_{-i}$ as the $(k-1)$-th
smallest rank among all items **excluding $i$**:

$$\tau_{-i} = r_{(k-1)}^{(-i)}$$

Because ranks are mutually independent, **$\tau_{-i}$ is independent of
$r_i$**.{{< sidenote >}}Conditioning on the ranks of the other items is Cohen and
Kaplan's *rank conditioning*, which generalises the derivation Duffield, Lund and Thorup
gave for priority sampling to any family of rank
distributions.{{< cite "cohen2008tighter" >}}{{< /sidenote >}}

### 3.1.1 Fundamental Equivalence

1. Item $i$ is inside the top $k-1$ overall ranks if and only if $r_i < \tau_{-i}$:
   $$r_i < \tau \iff r_i < \tau_{-i}$$
2. Whenever $r_i < \tau_{-i}$ holds, inserting $r_i$ shifts the $k$-th overall threshold
   to match $\tau_{-i}$:
   $$r_i < \tau_{-i} \implies \tau = \tau_{-i}$$

### 3.2 General Unbiasedness Proof

Define the indicator $\mathbb{I}(r_i < \tau)$ and the adjusted weight estimator:

$$\hat{w}_i = \frac{w_i}{F_i(\tau)} \cdot \mathbb{I}(r_i < \tau)$$

Using the equivalences from Section 3.1:

$$\hat{w}_i = \frac{w_i}{F_i(\tau_{-i})} \cdot \mathbb{I}(r_i < \tau_{-i})$$

Applying the Law of Total Expectation by conditioning on $\tau_{-i}$:

$$\mathbb{E}[\hat{w}_i] = \mathbb{E}_{\tau_{-i}}\Big[ \mathbb{E}_{r_i}\big[\hat{w}_i \;\big|\; \tau_{-i}\big] \Big]$$

Evaluating the inner expectation with $\tau_{-i}$ held fixed:

$$\begin{aligned}
\mathbb{E}_{r_i}\big[\hat{w}_i \;\big|\; \tau_{-i}\big] &= \frac{w_i}{F_i(\tau_{-i})} \cdot \mathbb{E}_{r_i}\big[\mathbb{I}(r_i < \tau_{-i}) \;\big|\; \tau_{-i}\big] \\
&= \frac{w_i}{F_i(\tau_{-i})} \cdot \Pr(r_i < \tau_{-i} \mid \tau_{-i})
\end{aligned}$$

Since $r_i$ is independent of $\tau_{-i}$,
$\Pr(r_i < \tau_{-i} \mid \tau_{-i}) = F_i(\tau_{-i})$. Thus:

$$\mathbb{E}_{r_i}\big[\hat{w}_i \;\big|\; \tau_{-i}\big] = \frac{w_i}{F_i(\tau_{-i})} \cdot F_i(\tau_{-i}) = w_i$$

Taking the outer expectation:

$$\mathbb{E}[\hat{w}_i] = \mathbb{E}_{\tau_{-i}}[w_i] = w_i$$

By linearity of expectation, for any subset $Q \subseteq \{1, \dots, N\}$:

$$\mathbb{E}[\hat{W}_Q] = \sum_{i \in Q} \mathbb{E}[\hat{w}_i] = \sum_{i \in Q} w_i = W_Q \quad \blacksquare$$

### 3.3 Instantiating Distributions

Evaluating $F_i(t) = \Pr(r_i < t)$ for specific rank transformations:

* **Priority Sampling ($r_i = u_i / w_i$):**
  $$F_i(t) = \Pr(u_i < w_i t) = \min(1, w_i t) \implies \hat{w}_i = \frac{w_i}{\min(1, w_i \tau)} = \max\left(w_i, \frac{1}{\tau}\right)$$

* **Exponential Scaling ($r_i = -\ln(u_i) / w_i$):**
  $$F_i(t) = \Pr(u_i > e^{-w_i t}) = 1 - e^{-w_i t} \implies \hat{w}_i = \frac{w_i}{1 - e^{-w_i \tau}}$$

### 3.4 Why the $k$-th Item acts as a Threshold Setter

Evaluating $\hat{w}_{(k)}$ using $\tau = r_{(k)}$ would require knowing
$r_{(k)}^{(-i)}$, which corresponds to the $(k+1)$-th rank in the full stream. Because a
sketch of capacity $k$ discards all ranks beyond $k$, $r_{(k+1)}$ is unobserved. The
$k$-th item must therefore serve solely as the threshold boundary $\tau$, yielding
$\hat{w}_{(k)} = 0$.

### 3.5 Pairwise Zero Covariance Property

For Priority Sampling, Duffield et al.{{< cite "duffield2007priority" >}} proved that
for any two distinct items $i \ne j$:

$$\text{Cov}(\hat{w}_i, \hat{w}_j) = 0$$

As a result, the variance of a subset sum equals the sum of the individual variances:

$$\text{Var}(\hat{W}_Q) = \sum_{i \in Q} \text{Var}(\hat{w}_i)$$


## 4. High-Performance Implementations

### 4.1 Systems Optimization Strategies

1. **$O(1)$ Branch-Light Fast-Path Rejection:** Cache $\tau = r_{(k)}$ in a dedicated
   field. Over $99\%$ of items in large streams fail $r_i < \tau$ and are rejected
   immediately without touching heap memory.
2. **IEEE-754 Bit-Level Floating Point Generation:** Construct uniform $u_i \in (0, 1)$
   by masking 52 hash bits into the mantissa of double `1.0` (`0x3FF0000000000000`) and
   subtracting `1.0`.
3. **In-Place Heap Replacement:** Overwrite root `heap[0]` directly and run
   `sift_down(0)` instead of executing sequential `pop()` and `push()` calls.

### 4.2 Rust Implementation

```rust
use std::cmp::Ordering;

/// A single entry in the Priority Sampling Bottom-k Sketch.
#[repr(C)]
#[derive(Clone, Copy, Debug)]
pub struct SketchEntry {
    pub rank: f64,      // Priority rank r_i = u_i / w_i
    pub weight: f64,    // True item weight w_i
    pub id: u64,        // Item identifier
    pub payload: u32,   // Dimension tag / group ID for subset predicates
}

impl PartialEq for SketchEntry {
    #[inline(always)]
    fn eq(&self, other: &Self) -> bool {
        self.rank == other.rank && self.id == other.id
    }
}
impl Eq for SketchEntry {}

impl PartialOrd for SketchEntry {
    #[inline(always)]
    fn partial_cmp(&self, other: &Self) -> Option<Ordering> {
        Some(self.cmp(other))
    }
}

impl Ord for SketchEntry {
    #[inline(always)]
    fn cmp(&self, other: &Self) -> Ordering {
        self.rank
            .total_cmp(&other.rank)
            .then_with(|| self.id.cmp(&other.id))
    }
}

pub struct PrioritySketch {
    k: usize,
    seed: u64,
    threshold: f64, // Cached r_(k) for O(1) fast-path rejection
    heap: Vec<SketchEntry>,
}

impl PrioritySketch {
    pub fn with_capacity(k: usize, seed: u64) -> Self {
        assert!(k >= 2, "Capacity k must be >= 2");
        Self {
            k,
            seed,
            threshold: f64::INFINITY,
            heap: Vec::with_capacity(k),
        }
    }

    #[inline(always)]
    fn hash_to_unit_float(&self, id: u64) -> f64 {
        let mut z = id.wrapping_add(self.seed).wrapping_add(0x9E3779B97F4A7C15);
        z = (z ^ (z >> 30)).wrapping_mul(0xBF58476D1CE4E5B9);
        z = (z ^ (z >> 27)).wrapping_mul(0x94D049BB133111EB);
        z ^= z >> 31;

        let bits = 0x3FF0_0000_0000_0000_u64 | (z >> 12) | 1;
        f64::from_bits(bits) - 1.0
    }

    #[inline]
    pub fn update(&mut self, id: u64, weight: f64, payload: u32) {
        if weight <= 0.0 {
            return;
        }

        let u = self.hash_to_unit_float(id);
        let rank = u / weight;

        // FAST PATH: Rejects >99% of stream items with a single register comparison
        if rank >= self.threshold {
            return;
        }

        let entry = SketchEntry { rank, weight, id, payload };

        if self.heap.len() < self.k {
            let idx = self.heap.len();
            self.heap.push(entry);
            self.sift_up(idx);
            if self.heap.len() == self.k {
                self.threshold = self.heap[0].rank;
            }
        } else {
            self.heap[0] = entry;
            self.sift_down(0);
            self.threshold = self.heap[0].rank;
        }
    }

    pub fn estimate_subset<F>(&self, mut predicate: F) -> f64
    where
        F: FnMut(&SketchEntry) -> bool,
    {
        if self.heap.len() < self.k {
            return self.heap.iter().filter(|e| predicate(e)).map(|e| e.weight).sum();
        }

        let inv_tau = 1.0 / self.heap[0].rank;
        let mut sum = 0.0;

        for entry in &self.heap[1..] {
            if predicate(entry) {
                sum += entry.weight.max(inv_tau);
            }
        }
        sum
    }

    #[inline]
    pub fn estimate_total(&self) -> f64 {
        self.estimate_subset(|_| true)
    }

    pub fn merge(&mut self, other: &Self) {
        assert_eq!(self.seed, other.seed, "Seeds must match to merge sketches");

        let mut combined = Vec::with_capacity(self.heap.len() + other.heap.len());
        combined.extend_from_slice(&self.heap);
        combined.extend_from_slice(&other.heap);

        combined.sort_unstable();
        combined.dedup_by_key(|e| e.id);
        combined.truncate(self.k);

        self.heap.clear();
        self.threshold = f64::INFINITY;

        for entry in combined {
            let idx = self.heap.len();
            self.heap.push(entry);
            self.sift_up(idx);
        }
        if self.heap.len() == self.k {
            self.threshold = self.heap[0].rank;
        }
    }

    #[inline(always)]
    fn sift_up(&mut self, mut idx: usize) {
        let item = self.heap[idx];
        while idx > 0 {
            let parent = (idx - 1) >> 1;
            if item <= self.heap[parent] {
                break;
            }
            self.heap[idx] = self.heap[parent];
            idx = parent;
        }
        self.heap[idx] = item;
    }

    #[inline(always)]
    fn sift_down(&mut self, mut idx: usize) {
        let len = self.heap.len();
        let item = self.heap[idx];
        let half = len >> 1;

        while idx < half {
            let mut child = (idx << 1) + 1;
            let right = child + 1;
            if right < len && self.heap[right] > self.heap[child] {
                child = right;
            }
            if item >= self.heap[child] {
                break;
            }
            self.heap[idx] = self.heap[child];
            idx = child;
        }
        self.heap[idx] = item;
    }
}
```

### 4.3 C99 Implementation

```c
#include <stdint.h>
#include <stdlib.h>
#include <stdio.h>
#include <stdbool.h>
#include <math.h>

typedef struct {
    double   rank;      // r_i = u_i / w_i
    double   weight;    // w_i
    uint64_t id;        // Item key
    uint32_t payload;   // Subset filter tag
    uint32_t _pad;      // 32-byte alignment padding
} SketchEntry;

typedef struct {
    size_t      k;
    size_t      len;
    uint64_t    seed;
    double      threshold; // Cached heap[0].rank
    SketchEntry heap[];    // Flexible array member
} PrioritySketch;

static inline double hash_to_unit_float(uint64_t id, uint64_t seed) {
    uint64_t z = id + seed + 0x9E3779B97F4A7C15ULL;
    z = (z ^ (z >> 30)) * 0xBF58476D1CE4E5B9ULL;
    z = (z ^ (z >> 27)) * 0x94D049BB133111EBULL;
    z ^= z >> 31;

    union { uint64_t u; double d; } conv;
    conv.u = 0x3FF0000000000000ULL | (z >> 12) | 1ULL;
    return conv.d - 1.0;
}

static inline bool entry_gt(const SketchEntry *a, const SketchEntry *b) {
    return (a->rank > b->rank) || (a->rank == b->rank && a->id > b->id);
}

PrioritySketch *ps_create(size_t k, uint64_t seed) {
    if (k < 2) return NULL;
    PrioritySketch *ps = malloc(sizeof(PrioritySketch) + k * sizeof(SketchEntry));
    if (!ps) return NULL;
    ps->k = k;
    ps->len = 0;
    ps->seed = seed;
    ps->threshold = INFINITY;
    return ps;
}

static inline void sift_up(SketchEntry *restrict heap, size_t idx) {
    SketchEntry item = heap[idx];
    while (idx > 0) {
        size_t parent = (idx - 1) >> 1;
        if (!entry_gt(&item, &heap[parent])) break;
        heap[idx] = heap[parent];
        idx = parent;
    }
    heap[idx] = item;
}

static inline void sift_down(SketchEntry *restrict heap, size_t len, size_t idx) {
    SketchEntry item = heap[idx];
    size_t half = len >> 1;
    while (idx < half) {
        size_t child = (idx << 1) + 1;
        size_t right = child + 1;
        if (right < len && entry_gt(&heap[right], &heap[child])) {
            child = right;
        }
        if (!entry_gt(&heap[child], &item)) break;
        heap[idx] = heap[child];
        idx = child;
    }
    heap[idx] = item;
}

void ps_update(PrioritySketch *restrict ps, uint64_t id, double weight, uint32_t payload) {
    if (weight <= 0.0) return;

    double u = hash_to_unit_float(id, ps->seed);
    double rank = u / weight;

    if (rank >= ps->threshold) return;

    SketchEntry entry = { .rank = rank, .weight = weight, .id = id, .payload = payload };

    if (ps->len < ps->k) {
        size_t idx = ps->len++;
        ps->heap[idx] = entry;
        sift_up(ps->heap, idx);
        if (ps->len == ps->k) {
            ps->threshold = ps->heap[0].rank;
        }
    } else {
        ps->heap[0] = entry;
        sift_down(ps->heap, ps->k, 0);
        ps->threshold = ps->heap[0].rank;
    }
}

typedef bool (*ps_predicate_fn)(const SketchEntry *entry, void *ctx);

double ps_estimate_subset(const PrioritySketch *restrict ps, ps_predicate_fn pred, void *ctx) {
    double sum = 0.0;
    if (ps->len < ps->k) {
        for (size_t i = 0; i < ps->len; ++i) {
            if (!pred || pred(&ps->heap[i], ctx)) sum += ps->heap[i].weight;
        }
        return sum;
    }

    double inv_tau = 1.0 / ps->heap[0].rank;
    for (size_t i = 1; i < ps->k; ++i) {
        if (!pred || pred(&ps->heap[i], ctx)) {
            double w = ps->heap[i].weight;
            sum += (w > inv_tau) ? w : inv_tau;
        }
    }
    return sum;
}
```

### 4.4 Complexity & Memory Profile

* **Memory Usage:** $32 \times k$ bytes. For $k = 1024$, total memory is $32\text{ KB}$,
  fitting inside standard CPU L1 data caches.
* **Stream Update Throughput:** $\sim 2.5\text{ ns/item}$ (Branch-light $O(1)$ fast rejection path).
* **Heap Replacements:** Expected count is $\approx k \ln(N / k)$. For $N = 10^8$ items
  and $k = 1024$, fewer than $12,000$ items trigger heap re-sorting.


## 5. Sketching a Recurrence: the Colours of Bitcoin Transactions {#sec:colours}

{{< newthought >}}Sections 1–4 sketch a stream{{< /newthought >}}: items arrive, each is
seen once, and the sketch summarises the set seen so far. What follows uses the same
ideas for a different job, and was built and measured in the Rust repository
`coloring-bt-transactions-rs` as a new binary, `sketch` (`src/bin/sketch.rs` and the
modules under `src/bin/sketch/`). Here every sketch is made *from other sketches*, mixed
with real weights, by a recurrence that runs over the 778,613,440 transaction records of
the 2022 Bitcoin chain{{< cite "nakamoto2008bitcoin" >}}.

One thing should be said at the start, because the title of this post promises
bottom-$k$. The sketch that won is **not** literally a bottom-$k$ sketch. It is
VarOpt$_k$ with its light items chosen by *systematic* sampling in block order: a
threshold sampler, the sibling of the priority sampling of §2 rather than one of its
members. The literal weighted bottom-$k$ sketch of §2 was built too (`prio` below) and
measured beside it; it lost by a factor of 6 to 21 at the same size. Section 6 proves
what each variant guarantees, section 7 shows the code, section 8 the measurements, and
the reasons the threshold sampler wins run through all three.

### 5.1 Colours

Number the blocks of the chain $0, 1, \dots, L - 1$, with $L = 762{,}261$ for 2022. The
*colour* of a transaction $t$ is a probability distribution over blocks, written as a
polynomial

$$
C_t = \sum_{b} c_t(b)\, x^{b}, \qquad c_t(b) \ge 0, \quad \sum_b c_t(b) = 1,
$$

where $c_t(b)$ is the fraction of $t$'s value that was minted in block $b$. A coinbase
minted in block $\beta$ has $C_t = x^{\beta}$. Any other transaction spends inputs
$i = 1, \dots, n$ with amounts $a_i$, taken from earlier transactions $p_1, \dots, p_n$,
and its colour is the amount-weighted mixture of theirs:

$$
C_t = \sum_{i=1}^{n} s_{t,i}\, C_{p_i}, \qquad s_{t,i} = \frac{a_i}{\sum_{j} a_j} \label{eq:recurrence}
$$

with equal shares $s_{t,i} = 1/n$ when the amounts sum to zero. The shares are
nonnegative and sum to one, so by induction every colour is a probability
distribution.{{< sidenote >}}Read for one block, or for a set of blocks, this
amount-weighted rule is the *haircut* taint policy of Möser, Böhme and Breuker, under
which a transaction is devalued in proportion to the tainted value among its inputs,
recursively; a colour carries the haircut taint of every coinbase at once. Anderson et
al. argue for a first-in-first-out rule instead, after the precedent of Clayton's
case.{{< cite "moser2014towards,anderson2018bitcoin" >}}{{< /sidenote >}} The records
come in file order and every input spends an earlier record, so the transactions form a
DAG listed in topological order, and {{< eqref "eq:recurrence" >}} is evaluated in one
pass. The repository's main binary does exactly that with `--weighted` (the loop in
`src/main.rs`'s `run()`).

A colour is read through linear functionals: its mean block and its spread, its CDF
$F_t(x) = \sum_{b \le x} c_t(b)$ ("how much of this is older than block $x$"), and its
Laplace values $\Lambda_s(C_t) = \sum_b c_t(b)\, e^{-s b / L}$ at
$s \in \{0.5, 1, 2, 4, 8, 16, 32\}$. All of these are on disk, computed exactly, for
every transaction of the chain (`colors.laplace.zst`, `colors.moments.zst`, and the
1024-band binned colours `colors.bands1024.zst`), and they are what the sketches are
measured against in section 8.

### 5.2 Why the exact colours do not fit

The support of $C_t$ is the union of its parents' supports, so colours only grow. On the
2022 chain they grow fast: an exact fold of the set colours (the same supports, without
the weights) was stopped by a memory guard at 480 GiB of resident memory around record
31.1M, 4% of the way through the chain, holding $1.24 \times 10^{11}$ block ids in 1.45M
live colours, about 85,000 blocks a colour on average. Counted over transactions rather
than live colours, the median transaction among those first 31.2M records has a colour
of about 174,000 blocks, and about 234,000 for the last million of them
(`finalBCUTXO_2022.sets-counts.31187785`). The weighted store is heavier still: it holds
about 43 GB at 1.5M records. The release oracle, which frees a colour as soon as its
last spender has read it, already cuts the live colours from 92.7M to 19.4M over the
chain, and the distinct live colours still peak at about 7.6M (7,593,630 distinct live
sketches in the stores of pass B, §8.1). Multiplied by hundreds of thousands of blocks,
that does not fit in any memory.

### 5.3 Sketching the recurrence

So every colour is replaced by a *sketch* $\hat C_t$ of at most about $k$ entries, and
the sketches are computed by the *same* recurrence:

$$
\hat C_t = R_t\big(X_t\big), \qquad X_t = \sum_{i=1}^{n} s_{t,i}\, \hat C_{p_i}, \label{eq:sketched}
$$

where $X_t$, the *candidate*, is the exact mixture of the parents' sketches, and $R_t$
is a randomised reduction back to about $k$ points, applied only when $X_t$ has more
than $k$ points (otherwise $\hat C_t = X_t$; this holds for `varopt` and `prio`, while
`coord` also applies the threshold inherited from its operands, which can drop terms
even below $k$, §6.6 and §7.7). A coinbase is $\hat C_t = x^{\beta}$, exactly. What one
wants from $R$ is that $\hat C_t$ be an unbiased estimate of $C_t$, still a probability
distribution, and accurate on the functionals of §5.1, with an error that does not grow
as the recurrence goes deeper into the chain.

### 5.4 Why a linear combination of sketches is the crux

In sections 1–4 a merge is a union, $S(A \cup B) = \text{bottom-}k(S(A) \cup S(B))$, and
it is exact because an item has the same weight in $A$, in $B$ and in $A \cup B$. Here
the operation is a *linear combination*: the child's weight of block $b$ is
$\sum_i s_i\, c_{p_i}(b)$, a sum of weights that may each be present in one parent's
sketch and absent from another's. And the parents overlap heavily. Counted over records
1.4–1.5M of the chain, 97% of the terms a merge writes arrive in runs, the one-sided
runs averaging 1,900 blocks and the shared runs 140: colours at depth are near-copies of
a few common ancestors, not independent mixtures.

Three consequences shape everything below.

1. A block's weight in the child is assembled from several parents' estimates. If a
   parent's sketch does not hold the block, its share of that block is simply unknown;
   §6.6 shows that this alone breaks the exactness of a coordinated (same-hash) merge.
2. Each node re-estimates an estimate. For the errors not to compound, each reduction
   must be unbiased *conditionally on its inputs* (§6.2), and its randomness must be
   fresh: independent of the randomness that chose the inputs (§6.5).
3. Overlap means the parents' errors are correlated: they share ancestors. Any argument
   that needs independent parents fails here; the ones below use linearity and
   conditional expectations only.


## 6. Proofs {#sec:proofs}

Throughout this section a reduction acts on a vector of *candidates*
$v = (v_b)_{b \in B}$ over a set $B = \{b_1 < b_2 < \dots < b_n\}$ of blocks, with every
$v_b > 0$, total $W = \sum_b v_b$ and $n > k \ge 1$. In the recurrence $W = 1$ (record
mode, §6.2). For a block $x$ the *cut* at $x$ is $F(x) = \sum_{b \le x} v_b$, and hats
denote the reduced vector: $\hat v_b$, $\hat F(x) = \sum_{b \le x} \hat v_b$.

A word on notation, because some letters change meaning from sections 2–3. There $\tau$
is a threshold on *ranks* $u/w$, small ranks are kept, and a kept item is carried at
$\max(w, 1/\tau)$. In §6.1–6.5 $\tau$ is a threshold on *weights*: an item is heavy when
its weight exceeds $\tau$, and kept lights are carried at weight $\tau$, so this $\tau$
plays the part of §2's $1/\tau$. §6.6 returns to §2's rank convention for `coord`. Also,
$S_j$ below is a cumulative light mass, not a sketch; $h$ counts heavy items, not a
hash; $W$ is a total mass and $W_1$ the Wasserstein distance; and the mixing shares are
always $s$.

### 6.1 VarOpt$_k$ by systematic threshold sampling {#sec:varopt}

{{< definition label="def:varopt" >}}
Let $\tau > 0$ solve $\sum_{b} \min(1, v_b/\tau) = k$. Call $b$ *heavy* if $v_b > \tau$
and *light* otherwise; let $H$ be the heavy set, $h = \lvert H \rvert$, and
$\ell_1 < \dots < \ell_m$ the lights in block order. Put $S_0 = 0$ and
$S_j = \tau^{-1} \sum_{i \le j} v_{\ell_i}$. Draw $U$ uniform on $(0, 1)$, and keep
light $\ell_j$ if and only if $\lfloor U + S_j \rfloor > \lfloor U + S_{j-1} \rfloor$.
The output is

$$
\hat v_b = \begin{cases} v_b & b \in H, \\ \tau & b \text{ light and kept}, \\ 0 & \text{otherwise.} \end{cases}
$$

{{< /definition >}}

This is a VarOpt$_k$-type scheme (inclusion probabilities proportional to weight up to a
threshold, and exactly $k$ points; Chao{{< cite "chao1982general" >}}; Cohen, Duffield,
Kaplan, Lund and Thorup{{< cite "cohen2009stream,cohen2011efficient" >}}), with the
lights chosen by one systematic pass along the block axis instead of a sequence of
random evictions.{{< sidenote >}}One random start along the cumulated sizes is the
classical systematic design of survey sampling with unequal probabilities, usually
traced to Madow.{{< cite "madow1949theory" >}}{{< /sidenote >}} Systematic selection
gives up one property that Cohen et al. include in their definition of VarOpt$_k$: no
positive covariances between the estimates.{{< sidenote >}}Cohen, Cormode and Duffield
make the trade explicit for ordered keys: systematic sampling keeps the number of
sampled keys in every interval within less than one of its expectation but has positive
correlations, while for a VarOpt sample in their sense no bound below two holds on every
input.{{< cite "cohen2011structure" >}}{{< /sidenote >}} With four equal lights at
$v/\tau = \tfrac12$ and $k = 2$, the kept set is either the first and third or the
second and fourth, so the first and third have covariance $\tau^2/4$, and their sum has
variance $\tau^2$ against $\tau^2/2$ under independent inclusion. That matters for
subset sums that are not intervals of the block axis; it does not matter for the cuts
and the bounded-variation functionals read in this post, which
{{< xref "thm:varopt" "full" >}}(5) bounds directly. The accumulator of the code, which
starts at $U$, adds $v/\tau$ and keeps an item each time it crosses an integer, computes
exactly this rule (§7.6).

{{< lemma label="lem:threshold" >}}
The threshold $\tau$ exists and is unique. At most $k - 1$ items are heavy, at least one
is light, the lights hold exactly $(k - h)\tau$ of the mass, and $\tau \le W / k$.
{{< /lemma >}}

{{< proof >}}
Let $f(t) = \sum_b \min(1, v_b/t)$. It is continuous and nonincreasing, equal to $n > k$
for $t \le \min_b v_b$, strictly decreasing for $t > \min_b v_b$ (at least one term is
$v_b/t$ there), and tends to $0$. So $f(t) = k$ has exactly one solution, and it lies
above $\min_b v_b$. At $t = \tau$, $f(\tau) = h + \tau^{-1}\sum_{\text{light}} v_b = k$.
If $h = k$ the light sum would be $0$, so there would be no lights and $n = h = k$, a
contradiction; hence $h \le k - 1$, a light exists, and
$\sum_{\text{light}} v_b = (k - h)\tau$. Finally $f(W/k) \le \sum_b v_b k / W = k < n$,
so $W/k > \min_b v_b$ lies where $f$ is strictly decreasing; if $\tau > W/k$ we would
have $k = f(\tau) < f(W/k) \le k$. Hence $\tau \le W/k$.
{{< /proof >}}

{{< theorem note="VarOpt by systematic sampling" label="thm:varopt" >}}
Under {{< xref "def:varopt" "full" >}}:

1. exactly $k - h$ lights are kept, so the output has exactly $k$ points;
2. block $b$ is kept with probability $\pi_b = \min(1, v_b / \tau)$, and
   $\hat v_b = v_b / \pi_b$ when kept: every estimate is a Horvitz–Thompson weight,
   equal to $v_b$ or to $\tau$;
3. $\mathbb{E}[\hat v_b] = v_b$ for every $b$;
4. $\sum_b \hat v_b = W$ for every value of $U$: the mass is preserved exactly;
5. for every cut $x$, $\hat F(x) - F(x) = \tau\,(\lfloor U + S_{j} \rfloor - S_{j})$,
   where $j$ is the number of lights $\le x$; hence
   $\tau(U - 1) < \hat F(x) - F(x) \le \tau U$ and
   $\lvert \hat F(x) - F(x) \rvert < \tau$, deterministically.
{{< /theorem >}}

{{< proof of="thm:varopt" >}}
(1) Each light adds $v/\tau \le 1$ to $S$, so $\lfloor U + S_j \rfloor$ grows by $0$ or
$1$ at each step, and the number of lights kept is
$\lfloor U + S_m \rfloor - \lfloor U \rfloor$. By {{< xref "lem:threshold" "full" >}},
$S_m = k - h$ is an integer, and $0 < U < 1$, so this is $k - h$.

(2) Heavies are always kept. Light $\ell_j$ is kept if and only if the interval
$(U + S_{j-1}, U + S_j]$, of length $v_{\ell_j}/\tau \le 1$, contains an integer. With
$U$ uniform, $U + S_{j-1}$ is uniform modulo $1$, and an interval of length
$\lambda \le 1$ with a uniform left end modulo 1 contains an integer with probability
$\lambda$. So $\pi_{\ell_j} = v_{\ell_j}/\tau$, and $v/\pi = \tau$.

(3) For a heavy, $\hat v_b = v_b$. For a light,
$\mathbb{E}[\hat v_b] = \tau \cdot v_b / \tau = v_b$.

(4)
$\sum_b \hat v_b = \sum_{H} v_b + (k - h)\tau = \sum_H v_b + \sum_{\text{light}} v_b = W$,
by (1) and {{< xref "lem:threshold" "full" >}}.

(5) Heavies contribute the same amount to $F(x)$ and $\hat F(x)$. The lights $\le x$ are
$\ell_1, \dots, \ell_j$, with true mass $\tau S_j$ and estimated mass $\tau$ times the
number kept,
$\tau(\lfloor U + S_j\rfloor - \lfloor U \rfloor) = \tau \lfloor U + S_j \rfloor$. Since
$y - 1 < \lfloor y \rfloor \le y$, the difference $\lfloor U + S_j \rfloor - S_j$ lies
in $(U - 1, U]$, and $0 < U < 1$ gives the strict bound.
{{< /proof >}}

Point 4 is why every sketched colour is still a probability distribution: the candidate
of a record has mass one, and so has its reduction, for every draw. Point 5 is the
property that matters for colours, which are read through their CDF.

{{< corollary label="cor:bv" >}}
For any function $g$ of the block, with variation
$V(g) = \sum_{j<n} \lvert g(b_{j+1}) - g(b_j) \rvert$ over $B$,
$\big\lvert \sum_b g(b)\,(\hat v_b - v_b) \big\rvert \le \tau\, V(g)$, with strict
inequality when $V(g) > 0$. In particular, for one reduction of a colour ($W = 1$): the
KS distance is below $\tau$; the mean block moves by less than
$\tau\,(b_n - b_1) < \tau L$; each Laplace value $\Lambda_s$ moves by less than $\tau$;
and the Wasserstein distance $W_1$ is below $\tau\,(b_n - b_1)$.
{{< /corollary >}}

{{< proof >}}
Let $d_j = \hat v_{b_j} - v_{b_j}$ and
$D_j = \sum_{i \le j} d_i = \hat F(b_j) - F(b_j)$, with $D_0 = 0$ and $D_n = 0$ by point 4.
Summing by parts,
$\sum_j g(b_j)\, d_j = g(b_n) D_n - \sum_{j < n} D_j\, (g(b_{j+1}) - g(b_j)) = -\sum_{j<n} D_j\,(g(b_{j+1}) - g(b_j))$,
whose absolute value is at most $\max_j \lvert D_j \rvert\, V(g) \le \tau V(g)$,
strictly when $V(g) > 0$ because $\max_j \lvert D_j \rvert < \tau$. The mean is
$g(b) = b$; $e^{-sb/L}$ is monotone with values in $(0, 1]$, so its variation is below
$1$; KS is $\max_j \lvert D_j \rvert$; and
$W_1 = \sum_{j<n} \lvert D_j \rvert\,(b_{j+1} - b_j)$.
{{< /proof >}}

{{< remark >}}
Point 5 also explains a number measured in section 8. For a diffuse colour, whose lights
are all tiny against $\tau$, the fractional parts of the $S_j$ run densely through
$[0, 1)$, so the largest CDF error over all cuts is close to $\tau \max(U, 1 - U)$,
whose expectation is $\tfrac34 \tau$. The single-shot KS distance of `varopt` measured
on the exact colours was between $0.741\tau$ and $0.750\tau$ for $k = 16$ to $4096$, a
little lower at small $k$ (§8.8).{{< /remark >}}

The code never sorts to find $\tau$; it iterates.

{{< lemma label="lem:fixedpoint" >}}
Start from $t_0 = W/k$. Given $t_i$, let $h_i$ count the items above $t_i$, $M_i$ be the
sum of the others (computed directly, not as $W$ minus the heavies) and
$t_{i+1} = M_i / (k - h_i)$. Then $\tau \le t_{i+1} \le t_i$ for every $i$; and if no
item counted in $M_i$ exceeds $t_{i+1}$, then $t_{i+1} = \tau$.
{{< /lemma >}}

{{< proof >}}
*Lower bound.* $t_0 \ge \tau$ by {{< xref "lem:threshold" "full" >}}. Suppose
$t_i \ge \tau$. The items above $t_i$ are above $\tau$, so they contribute $h_i$ to
$f(\tau) = k$, and the rest contribute
$k - h_i = \sum_{v_b \le t_i} \min(1, v_b/\tau) \le M_i/\tau$, so
$t_{i+1} = M_i/(k - h_i) \ge \tau$. (Also $h_i \le h \le k - 1$, so the division is
defined.)

*Monotonicity.* Each of the $h_0$ items above $t_0 = W/k$ exceeds $W/k$, so
$M_0 = W - \sum_{v_b > t_0} v_b \le W - h_0 W/k = (k - h_0)\,t_0$, that is
$t_1 \le t_0$. Suppose $t_i \le t_{i-1}$. The items above $t_{i-1}$ are above $t_i$, so
$h_i \ge h_{i-1}$, and $M_i$ is $M_{i-1}$ less the $h_i - h_{i-1}$ items in
$(t_i, t_{i-1}]$, each larger than $t_i$. With $M_{i-1} = (k - h_{i-1})\,t_i$, the
definition of $t_i$, this gives
$M_i \le (k - h_{i-1})\,t_i - (h_i - h_{i-1})\,t_i = (k - h_i)\,t_i$, that is
$t_{i+1} \le t_i$.

*Stopping.* If every item counted in $M_i$ is at most $t_{i+1}$, and the others exceed
$t_i \ge t_{i+1}$, then $f(t_{i+1}) = h_i + M_i / t_{i+1} = k$, and $t_{i+1} = \tau$ by
uniqueness.
{{< /proof >}}

### 6.2 Unbiasedness through the DAG, with fresh randomness {#sec:unbiased}

Let $\mathcal{F}_t$ be everything drawn up to and including record $t$, in file order.
The shares $s_{t,i}$ are fixed numbers: they come from the amounts, not from any sketch.

{{< theorem note="unbiased recursion" label="thm:dag" >}}
Suppose each reduction $R_t$ draws randomness $U_t$ independent of $\mathcal{F}_{t-1}$,
and is conditionally unbiased: $\mathbb{E}[R_t(X) \mid X] = X$ coordinate by coordinate.
Then $\mathbb{E}[\hat C_t \mid \mathcal{F}_{t-1}] = X_t$ and
$\mathbb{E}[\hat C_t(b)] = C_t(b)$ for every record $t$ and block $b$. If, in addition,
every reduction preserves mass, every $\hat C_t$ has mass exactly one.
{{< /theorem >}}

{{< proof of="thm:dag" >}}
$X_t$ is a function of the parents' sketches, which are $\mathcal{F}_{t-1}$-measurable
because parents come earlier in the file. So
$\mathbb{E}[\hat C_t \mid \mathcal{F}_{t-1}] = \mathbb{E}[R_t(X_t) \mid \mathcal{F}_{t-1}] = X_t$
(and trivially so when no reduction happens). By induction in file order, assuming
$\mathbb{E}[\hat C_p] = C_p$ for every earlier $p$:
$\mathbb{E}[\hat C_t] = \mathbb{E}[X_t] = \sum_i s_{t,i}\, \mathbb{E}[\hat C_{p_i}] = \sum_i s_{t,i}\, C_{p_i} = C_t$.
The base case is a coinbase, $\hat C_t = C_t = x^{\beta}$. Mass: the candidate has mass
$\sum_i s_{t,i} \cdot 1 = 1$, and the reduction keeps it.
{{< /proof >}}

Nothing in the proof asks the parents to be independent. They are not: they share
ancestors, and so they share the errors of those ancestors' reductions. Linearity of
expectation does not care. What the proof does need is that the reduction be unbiased
*given its input*, which is why the randomness must be fresh: it must be independent of
whatever chose the input. VarOpt satisfies this by {{< xref "thm:varopt" "full" >}}(3)
with $U_t$ drawn per reduction. Two engineering details keep the proof intact: operands
that are the same parent are added before reducing ($s\,C + s'\,C = (s + s')\,C$
exactly), and zero-share operands are skipped, which changes nothing in $X_t$.

{{< remark >}}
In code, $U_t$ is a hash of the seed and the record index (§7.3), so a run is a
deterministic function of its input. The theorem treats the hash values as independent
uniforms; that is an idealisation of a good counter-based generator, and the
seed-replicate tests of §8.5 are the check that it is harmless.
{{< /remark >}}

**Record mode against the literal fold.** `run()` folds a record's inputs pairwise, from
the last to the first. Applied literally to sketches (`reduce=step`), that is
$A_1 = s_1 \hat C_{p_1}$ and $A_j = R_{t,j}(s_j \hat C_{p_j} + A_{j-1})$, a reduction
after every combine, with a fresh $U_{t,j}$ each. The same tower argument shows it is
unbiased too. The default (`reduce=record`) merges a record's operands exactly and
reduces once. Both compute the recurrence {{< eqref "eq:recurrence" >}}; they differ
only in how often noise is injected. In step mode a record of $n$ inputs is reduced up
to $n - 1$ times, and the mass folded early is resampled again at every later step. §6.3
shows that every reduction adds a nonnegative term to the variance, so this is the
expected direction, though not a proof that step mode must lose (its intermediate
reductions have smaller thresholds, $\tau_{t,j} \le (s_1 + \dots + s_j)/k$). Measured,
it loses everywhere: 1.24–1.72 times the error of record mode at $k = 64$, with 6.15
times as many reductions (§8.6).

### 6.3 How the error propagates {#sec:propagation}

Let $\delta_r = \hat C_r - X_r$ be the noise injected by the reduction at record $r$
($\delta_r = 0$ when the record is not reduced).

{{< theorem note="error decomposition" label="thm:decomp" >}}
For every record $t$,

$$
\hat C_t - C_t = \sum_{r \preceq t} \alpha_{t,r}\, \delta_r,
$$

where $r \preceq t$ ranges over $t$ and its ancestors, $\alpha_{t,t} = 1$, and
$\alpha_{t,r} = \sum_i s_{t,i}\, \alpha_{p_i, r}$: the sum, over all paths from $r$ to
$t$ in the DAG, of the product of the shares along the path. The coefficients are
deterministic and lie in $[0, 1]$; $\alpha_{t,r}$ is the fraction of $t$'s value that
flowed through $r$.
{{< /theorem >}}

{{< proof of="thm:decomp" >}}
For a coinbase both sides are $0$. Otherwise
$\hat C_t - C_t = (X_t - C_t) + \delta_t = \sum_i s_{t,i}(\hat C_{p_i} - C_{p_i}) + \delta_t$,
and the induction hypothesis on the parents gives
$\sum_i s_{t,i} \sum_{r \preceq p_i} \alpha_{p_i, r}\, \delta_r + \delta_t$, which is
the claim with the stated recursion for $\alpha$. The $\alpha$ are built from shares
only, so they are deterministic, and $\alpha_{t,r} \le \sum_i s_{t,i} = 1$ by induction.
{{< /proof >}}

{{< corollary label="cor:orth" >}}
Let $\varphi$ be any linear functional of a colour (a cut of the CDF, the mean, a
Laplace value). The terms $\varphi(\delta_r)$ are martingale differences in file order,
hence orthogonal{{< cite "williams1991probability" >}}, and

$$
\mathbb{E}\big[\varphi(\hat C_t - C_t)^2\big] = \sum_{r \preceq t} \alpha_{t,r}^2\; \mathbb{E}\big[\varphi(\delta_r)^2\big].
$$

{{< /corollary >}}

{{< proof >}}
$\varphi(\delta_r)$ is $\mathcal{F}_r$-measurable and
$\mathbb{E}[\varphi(\delta_r) \mid \mathcal{F}_{r-1}] = 0$ by conditional unbiasedness.
For $r < r'$,
$\mathbb{E}[\varphi(\delta_r)\varphi(\delta_{r'})] = \mathbb{E}\big[\varphi(\delta_r)\, \mathbb{E}[\varphi(\delta_{r'}) \mid \mathcal{F}_{r'-1}]\big] = 0$.
Expand the square; the $\alpha$ are constants. (Every term is bounded, by
{{< xref "cor:bv" "full" >}}, so the expectations exist.)
{{< /proof >}}

{{< proposition label="prop:cutvar" >}}
For VarOpt in record mode and a cut $x$, let $f_r(x)$ be the fractional part of $S_{j}$
at the cut in reduction $r$. Conditionally on $\mathcal{F}_{r-1}$, the cut error
$\delta_r(x)$ equals $\tau_r(1 - f_r)$ with probability $f_r$ and $-\tau_r f_r$ with
probability $1 - f_r$. Hence

$$
\mathbb{E}\big[(\hat F_t(x) - F_t(x))^2\big] = \sum_{r \preceq t} \alpha_{t,r}^2\; \mathbb{E}\big[\tau_r^2\, f_r(x)\,(1 - f_r(x))\big] \;\le\; \frac14 \sum_{r \preceq t} \alpha_{t,r}^2\, \mathbb{E}[\tau_r^2] \;\le\; \frac{1}{4k^2} \sum_{r \preceq t} \alpha_{t,r}^2 .
$$

{{< /proposition >}}

{{< proof >}}
Write $S_j = N + f$ with $N$ an integer. By {{< xref "thm:varopt" "full" >}}(5) the
error is $\tau(\lfloor U + f \rfloor - f)$, and $\lfloor U + f \rfloor = 1$ exactly when
$U \ge 1 - f$, which has probability $f$. Its conditional variance is
$\tau^2 f(1-f) \le \tau^2/4$. Combine with {{< xref "cor:orth" "full" >}}. In record
mode every candidate has mass $1$, so $\tau_r \le 1/k$ by
{{< xref "lem:threshold" "full" >}}.
{{< /proof >}}

The same argument gives the rate in $k$ through the whole recursion, for every
functional of bounded variation.

{{< corollary note="the 1/k rate through the recursion" label="cor:rate" >}}
In record mode, let $g$ be a function of the block with variation $V(g)$ over all the
blocks $0, \dots, L - 1$ in order, and $\varphi(v) = \sum_b g(b)\, v_b$. For every
record $t$,

$$
\sqrt{\mathbb{E}\big[\varphi(\hat C_t - C_t)^2\big]} \;\le\; \frac{V(g)\,\sqrt{A_t}}{k}, \qquad A_t = \sum_{r \preceq t} \alpha_{t,r}^2,
$$

where $A_t$ depends on the DAG and the shares only, not on $k$, and $A_t \le 1 + d_t$,
with $d_t$ the number of edges of the longest path from a coinbase to $t$.
{{< /corollary >}}

{{< proof >}}
The variation of $g$ over the blocks of one candidate, taken in order, is at most $V(g)$
(the triangle inequality merges the steps it skips). So {{< xref "cor:bv" "full" >}} and
$\tau_r \le 1/k$ give $\lvert\varphi(\delta_r)\rvert \le \tau_r V(g) \le V(g)/k$ for
every reduced record $r$, and $\delta_r = 0$ for the others.
{{< xref "cor:orth" "full" >}} then gives
$\mathbb{E}[\varphi(\hat C_t - C_t)^2] \le (V(g)/k)^2 \sum_{r \preceq t} \alpha_{t,r}^2$.
The $\alpha$ come from the shares alone. For the bound on $A_t$:
$\alpha_{t,r} \in [0, 1]$, so $\alpha_{t,r}^2 \le \alpha_{t,r}$, and $\alpha_{t,r}$ is
the probability that a walk from $t$, stepping to parent $p_i$ with probability
$s_{t,i}$ until it reaches a coinbase, visits $r$ (it visits $r$ at most once, the graph
being acyclic). The sum of these probabilities is the expected number of records the
walk visits, at most $1 + d_t$.
{{< /proof >}}

**What this does and does not bound.** The decomposition is exact, and the per-reduction
term is tight: one reduction alone has a cut error of order $\tau \le 1/k$.
{{< xref "cor:rate" "full" >}} turns this into a proved $O(1/k)$ bound at every record,
for the mean, every Laplace value and every cut. What it does not give is a constant
independent of depth, because $A_t$ is the weak point. Along a chain of near-copies,
each record mostly its parent plus a little new value and each reduced, $\alpha_{t,r}$
stays close to $1$ for many ancestors $r$, and $A_t$ grows linearly with the number of
such reductions: the bound by itself only says that the error's standard deviation is at
most of order $\sqrt{\text{depth}}/k$. It does not explain why the error does *not* grow
with depth. Yet that is what the chain shows:
$\lvert \Delta\text{mean} \rvert / \text{sd}$ is flat from 100M records to the end, at
every $k$ from 16 to 1024 (§8.3). Two things in the decomposition make it plausible
without proving it. Most records do not reduce at all (a record whose operands are one
parent returns that parent's sketch), so most ancestors contribute $\delta_r = 0$. And
mixing spreads $\alpha$: the $\alpha_{t,r}$ over a generation of ancestors sum to at
most one, so when value comes from many ancestors $\sum_r \alpha_{t,r}^2$ is much
smaller than $\sum_r \alpha_{t,r}$. The measured flatness says that, on this chain, the
effective $\sum_r \alpha_{t,r}^2 \mathbb{E}[\tau_r^2 f_r(1-f_r)]$ stays bounded.

What the recursion costs can be read against a single reduction. A single-shot sketch of
the exact colour (the "IDEAL" of §8.7) has one term in the sum. On the first 3M records,
where exact colours are available, the recursive sketch's mean
$\lvert\Delta\text{mean}\rvert$ was 29% to 67% above the single shot's, for $k = 16$ to
$4096$, in the stratum of colours with more than 32,768 blocks. If both errors had the
same shape, those ratios would correspond to variance ratios of $1.29^2 \approx 1.66$ to
$1.67^2 \approx 2.79$: the whole ancestry contributes between about two-thirds of a
single-reduction term and two such terms ($0.66$ to $1.79$) beyond the record's own.
That reading is an inference from the measurements, not a consequence of the
proposition; it also assumes the record's own term equals the single shot's, whereas the
record's reduction uses the threshold of its candidate $X_t$, close to but not equal to
that of the exact colour $C_t$.

### 6.4 Why the error falls as $1/k$, not $1/\sqrt{k}$ {#sec:rates}

For VarOpt by systematic sampling, one reduction has a CDF error below $\tau$, and
$\tau$ is at most $1/k$ (more precisely, $\tau = W_{\text{light}}/(k - h) \le W/k$): the
error of every functional of {{< xref "cor:bv" "full" >}} is $O(1/k)$,
deterministically, by {{< xref "thm:varopt" "full" >}}(5).

{{< proposition label="prop:poisson" >}}
If instead each light $b$ is kept *independently* with probability $v_b/\tau$ and weight
$\tau$ (Poisson sampling with Horvitz–Thompson weights), the cut error is unbiased with
variance $\sum_{\text{light}\, b \le x} v_b(\tau - v_b)$. For a diffuse colour, whose
lights are all small against $\tau \approx W/k$, this is about
$\tau F(x) \approx F(x)/k$, so the error's standard deviation is of order $1/\sqrt{k}$.
{{< /proposition >}}

{{< proof >}}
Each light contributes an independent term $\tau B_b - v_b$, with $B_b$
Bernoulli($v_b/\tau$): mean $0$, variance
$\tau^2 (v_b/\tau)(1 - v_b/\tau) = v_b(\tau - v_b)$. Sum over the lights up to $x$.
{{< /proof >}}

Priority sampling (`prio`) is not Poisson sampling, but its Horvitz–Thompson weights
have zero pairwise covariance (§3.5), and conditionally on the leave-one-out threshold
$T_b$ its weight $\max(v_b, T_b)\,\mathbf{1}\{\text{kept}\}$ has variance
$v_b\,(T_b - v_b)^{+}$, so
$\operatorname{Var}\hat F(x) = \sum_{b \le x} \mathbb{E}[v_b (T_b - v_b)^{+}]$. With
$T_b \approx W/k$ this is the same $F(x)/k$ order. That last step, the concentration of
$T_b$, is argued and not proved here; the measured slope of `prio`'s errors against $k$
is $-0.49$ to $-0.54$ (§8.4).

The two estimators differ in how the lights are spread. Systematic sampling takes
exactly one light per interval of $\tau$ of light mass along the block axis: a
stratified sample whose strata are consecutive slices of the colour. Its errors cannot
pile up along the axis; at every cut they are bounded by one stratum's mass. Independent
inclusion lets them pile up, as a random walk does.

{{< remark >}}
What is proved for the recursion is the rate: {{< xref "cor:rate" "full" >}} bounds the
root-mean-square error of every bounded-variation functional by $V(g)\sqrt{A_t}/k$,
because each reduction's error is at most $\tau_r V(g)$, a per-reduction variance of
order $\tau_r^2$. Under independent inclusion the per-reduction variance is of order
$\tau_r$ ({{< xref "prop:poisson" "full" >}}), and the same decomposition gives only
$\sqrt{A_t/k}$. What is not proved is uniformity in depth, since $A_t$ can grow (§6.3).
Measured: local log-log slopes of $-0.93$ to $-0.97$ for the recursive sketch's
$\lvert\Delta\text{mean}\rvert$ from $k = 16$ to $1024$ over the whole chain (§8.2),
and, for the single-shot IDEAL on exact colours, $-1.17$ for KS, $-1.14$ for $W_1$ and
$-1.12$ for the largest Laplace error (§8.7).

That the difference comes from the systematic pass, and not from the thresholds, was
checked in the design phase with a prototype (not the final binary, and on a prefix of
the chain): a VarOpt with the same thresholds whose lights were chosen in random order
rather than along the block axis, run through the real recursion. On the first 1.1M
records its mean $W_1$ over colours wider than $k$ went from 1,883 to 70 blocks for
$k = 16$ to $1024$, against 898 to 5.3 for the block-ordered prototype, and on the
colours wider than 1024 blocks its log-log slope was $-0.88$, like fresh priority
sampling's $-0.84$, against $-1.32$ for the block-ordered one. Streamed deeper, at 10M
records its mean-block error was 4,457 and 3,182 blocks at $k = 64$ and $128$, against
932 and 479; and in the 10–30M window its median
$\lvert\Delta\text{mean}\rvert/\text{sd}$ was $0.074$ and $0.052$, against $0.016$ and
$0.0082$. Without the block order, VarOpt behaves like priority sampling, at about
$1/\sqrt{k}$.
{{< /remark >}}

### 6.5 Priority bottom-$k$ on the recursion {#sec:prio}

`prio` is the weighted bottom-$k$ sketch of §2 applied at every node: priorities
$q_b = v_b / u_b$ with fresh uniforms $u_b$ for this reduction, the $k$ largest kept,
$\tau_q$ the $(k+1)$-th largest priority, and each kept block carried at
$\max(v_b, \tau_q)$. Priorities are written $v/u$ here, the reciprocals of §2's ranks
$u/w$, so the $k$ largest priorities are the $k$ smallest ranks and $\tau_q$ is §2's
$1/\tau$. (Section 2 keeps $k - 1$ items and uses the $k$-th as the threshold; `prio`
keeps $k$ and uses the $(k+1)$-th. They are the same scheme with $k$ shifted by one.)

{{< proposition label="prop:prio-raw" >}}
The raw Horvitz–Thompson weights of `prio`, never renormalised inside the recursion, are
unbiased at every node: $\mathbb{E}[\hat C_t(b)] = C_t(b)$.
{{< /proposition >}}

{{< proof >}}
Conditionally on the candidate $X$, the proof of §3.2 applies with the leave-one-out
threshold computed from the fresh priorities of the other candidates, which are
independent of $u_b$: $\mathbb{E}[\hat v_b \mid X] = v_b$. That is the hypothesis of
{{< xref "thm:dag" "full" >}}, whose proof uses nothing else.
{{< /proof >}}

Two things are lost against VarOpt. The mass is no longer preserved: the raw total of a
node is a random variable with mean one, and along the DAG it wanders as a martingale
(from 0.66 to 1.48 between the 5th and 95th percentiles, in one simulation of the design
phase). And what is emitted must be a distribution, so it is normalised,
$\hat p_b = \hat v_b / \sum_c \hat v_c$, which is a *ratio* estimator: consistent, with
a bias that vanishes as $k$ grows (of order $1/k$ at a single node; its size deep in the
recursion, where the raw total wanders, was not analysed), but not unbiased.
{{< xref "ex:prio-bias" "full" >}} is the one measurement of it.

{{< example label="ex:prio-bias" >}}
Parent A holds one heavy block of weight $0.5$ and 100 light blocks; parent B holds 300
blocks of equal weight. Each is reduced by `prio` to $k = 8$, and the child
$0.5\,A + 0.5\,B$ is reduced again. Over 200,000 replicates the normalised estimate of
the heavy block averaged $\mathbb{E}[\hat p_{\text{heavy}}] = 0.2690$ against the exact
$0.25$ ($z = 125$), while the raw Horvitz–Thompson weight averaged $0.24998$
($z = -0.9$). (Measured in a simulation during the design; the test suite therefore
asserts unbiasedness of `prio`'s raw weights, not of its output.)
{{< /example >}}

Fresh randomness is not optional either. The design phase also tried *coordinated*
priority sampling with Horvitz–Thompson re-estimation, one $u_b$ per block for the whole
run, and it diverged: raw masses of $10^{10}$ to $10^{28}$. The proof of §3.2 needs the
rank $r_b$ to be independent of the threshold *and* of the weight $v_b$ it is applied
to. With shared keys, the blocks present in a node's input were themselves selected
because their $u_b$ was small, so $u_b$ given the input is no longer uniform but biased
small. The nominal inclusion probability $\min(1, v_b/\tau)$ then *understates* how
likely the block is to be kept again, the Horvitz–Thompson weight $v_b/\pi$
over-inflates it, and the inflation compounds multiplicatively along the DAG: a block
with a small key is kept and inflated to the threshold, its small key gives it a high
priority at the next node, so it is kept and inflated again. (This is the mechanism as
we understand it; the divergence itself is what was measured.)

### 6.6 Coordinated bottom-$k$: exact on disjoint supports, biased under overlap {#sec:coord}

Here $\tau$ is again a threshold on ranks, as in §2, not the weight threshold of
§6.1–6.5. `coord` keeps one key $u_b \in (0, 1)$ per block for the whole run, ranks a
weight $v$ at $u_b / v$, and stores *exact* weights rather than
estimates.{{< sidenote >}}One key per item, shared by many weight assignments over the
same items (here, all the colours over the blocks), is the coordinated weighted sampling
of Cohen, Kaplan and Sen.{{< cite "cohen2009coordinated" >}}{{< /sidenote >}} A
*threshold sample* of a vector $D$ at $\tau$ is
$T_\tau(D) = \{(b, D_b) : u_b / D_b < \tau\}$; a `coord` sketch of a colour is meant to
be such a sample, with its $\tau$ stored beside it.

{{< lemma note="disjoint supports" label="lem:disjoint" >}}
Let $A$ and $B$ have disjoint supports, with exact threshold samples
$S_A = T_{\tau_A}(A)$ and $S_B = T_{\tau_B}(B)$, and let $D = s_a A + s_b B$ with
$s_a, s_b > 0$. Put $c = \min(\tau_A/s_a,\ \tau_B/s_b)$. For every $\tau \le c$, the
threshold sample $T_\tau(D)$ is obtained from the scaled union
$\{(b, s_a A_b) : (b, A_b) \in S_A\} \cup \{(b, s_b B_b) : (b, B_b) \in S_B\}$ by
keeping the entries ranked below $\tau$. Hence the merge that keeps the candidates
ranked below $\tau' = \min(c, r_{(k+1)})$, with $r_{(k+1)}$ the $(k+1)$-th smallest
candidate rank, returns $T_{\tau'}(D)$ exactly, with at most $k$ entries; and when
$c > r_{(k+1)}$ it returns the bottom-$k$ sketch of $D$ itself.
{{< /lemma >}}

{{< proof >}}
For $b$ in the support of $A$, $D_b = s_a A_b$ because the supports are disjoint, so the
rank of $b$ in $D$ is $u_b/(s_a A_b) = (u_b/A_b)/s_a$. If it is below
$\tau \le \tau_A / s_a$, then $u_b / A_b < \tau_A$ and $(b, A_b) \in S_A$; conversely an
entry of $S_A$ ranked below $\tau$ after scaling is in $T_\tau(D)$, with the exact
weight. The same holds for $B$. So every block of $D$ ranked below $c$ is a candidate,
with its true weight and its true rank. If $r_{(k+1)} < c$, every block of $D$ ranked at
or below $r_{(k+1)}$ is a candidate, so $r_{(k+1)}$ is the $(k+1)$-th smallest rank of
$D$ and the output is $D$'s bottom-$k$ sketch. Otherwise $\tau' = c$ and at most $k$
candidates rank below it.
{{< /proof >}}

This is test T5 of the code (§7.11), repeated through nested merges. Overlap breaks it,
because a block held by one parent's sketch and not by the other's has only a *lower
bound* on its weight: the missing parent's share is unknown and is taken as zero (the
"zero rule").

{{< example note="overlap" label="ex:overlap" >}}
Two blocks $b_1, b_2$ with keys $u = (0.3, 0.4)$; $k = 1$; $A = (0.9, 0.1)$,
$B = (0.1, 0.9)$, $s_a = s_b = \tfrac12$, so $D = (0.5, 0.5)$.
In $A$ the ranks are $(0.333, 4)$: $S_A = \{(b_1, 0.9)\}$, $\tau_A = 4$. In $B$ they are
$(3, 0.444)$: $S_B = \{(b_2, 0.9)\}$, $\tau_B = 3$.
The merge sees $b_1$ at $0.45$ and $b_2$ at $0.45$ (each from one parent only), with
ranks $0.667$ and $0.889$; $c = \min(8, 6) = 6$, so $\tau' = 0.889$ and the sketch is
$\{(b_1, 0.45)\}$ at $\tau' = 0.889$.
The truth: in $D$ the ranks are $(0.6, 0.8)$, so
$T_{0.889}(D) = \{(b_1, 0.5), (b_2, 0.5)\}$ and the bottom-1 sketch of $D$ is
$\{(b_1, 0.5)\}$ at $\tau = 0.8$. The merged sketch matches neither: its weight is a
strict lower bound, and its threshold vouches for every block below $0.889$ while $b_2$,
at true rank $0.8$, is missing.
{{< /example >}}

{{< proposition note="the harmonic cap" label="prop:harm" >}}
Let $S_A$ and $S_B$ be exact threshold samples of $A$ and $B$, as in
{{< xref "lem:disjoint" "full" >}}, but without disjointness. A block absent from both
sketches has true rank in $D$ at least $c_H = 1 / (s_a/\tau_A + s_b/\tau_B)$, and
$c_H \le c$.
{{< /proposition >}}

{{< proof >}}
A block absent from $S_A$ has $A_b = 0$ or $u_b/A_b \ge \tau_A$, so $A_b \le u_b/\tau_A$
either way; likewise $B_b \le u_b/\tau_B$. Then $D_b \le u_b (s_a/\tau_A + s_b/\tau_B)$,
that is $u_b/D_b \ge c_H$. And
$1/c_H = s_a/\tau_A + s_b/\tau_B \ge \max(s_a/\tau_A, s_b/\tau_B) = 1/c$.
{{< /proof >}}

So, when the operands are exact threshold samples, the harmonic cap (`cap=harm`) is safe
for the membership of blocks that *no* operand holds: none of them ranks below it. That
is all it guarantees. It does not repair the weights of blocks that one operand holds
and another misses, so the output need not be a threshold sample of $D$ even below the
cap: in {{< xref "ex:overlap" "full" >}} it does not bind ($c_H = 3.43 > 0.889$), and
$b_2$ is lost because its weight was underestimated, not because it was unseen. Nor does
the hypothesis survive the recursion: after the first overlapping merge the operands
carry holes and lower-bound weights, and the guarantee no longer applies. Its price is
that sketches shrink, though not because the cap decays. $c_H \le c$, by a factor of two
when the operands are alike ($s_a = s_b = \tfrac12$ and $\tau_A = \tau_B = \tau$ give
$c = 2\tau$ and $c_H = \tau$); but the shares sum to one, so $c_H$ is at least the
share-weighted harmonic mean of the operands' thresholds and never falls below the
smallest of them. The shrinkage comes from the candidates whose weights are lower
bounds: their ranks are inflated, sit above the tighter cap and are dropped (in the
design-phase prototype the sketches fell to 45–55% of $k$ by 100M records). Measured on
the first 3M records at $k = 64$ it changed nothing (KS $0.0632$ against $0.0631$ for
`cap=min` on colours above 32,768 blocks, with 2.3% fewer peak entries), so the default
stayed `cap=min`. Neither cap removes the bias of the zero rule, which is why `coord`
lost: its error is almost all bias (§8.4) and does not fall with $k$.


## 7. Implementation {#sec:implementation}

The code below is excerpted from the `sketch` binary of `coloring-bt-transactions-rs`,
trimmed (`// …` marks a cut) but not rewritten. It is about 6,500 lines with its tests,
adds no dependency, and reuses the repository's record parser, release oracle, exact
weighted store and Laplace tables through `#[path]` modules.

### 7.1 Where things are

| file | what it holds |
| :--- | :--- |
| `sketch.rs` | command line, global allocator, dispatch to the modes |
| `hash.rs` | every random draw, as a hash of where it is drawn |
| `algebra.rs` | the sketch type, the `Algebra` trait, operand grouping, the n-way merge |
| `varopt.rs`, `prio.rs`, `coord.rs` | the three reductions |
| `driver.rs` | the recurrence, driven exactly as `run()` drives it |
| `exact.rs` | the exact colour as an `Algebra`, bit-identical to `--weighted` |
| `feed.rs` | one parse broadcast to many stores; reference files read in lock-step |
| `metrics.rs` | mean, spread, Laplace, KS, $W_1$, TV over 1024 bands |
| `eval.rs`, `chain.rs`, `modes.rs` | the modes `eval`, `chain`, `check`, `emit`, `decode` |
| `encode.rs` | the binary output format |
| `tests.rs` | tests through the whole pipeline |

### 7.2 A sketch in memory

A sketch is a boxed slice of 8-byte entries in strictly ascending block order, behind an `Rc`:

```rust
/// One term of a sketch: 8 bytes.
#[repr(C)]
#[derive(Clone, Copy, PartialEq, Debug)]
pub struct Entry {
    pub b: u32,
    pub w: f32,
}

/// A sketched colour.
#[derive(Debug)]
pub struct Sketch {
    /// Strictly ascending `b`; every `w` positive, finite and normal.
    pub entries: Box<[Entry]>,
    /// varopt: the light weight of this node's own reduction, or 0.  prio: its
    /// `tau_q`, or 0.  coord: the threshold in this sketch's own scale, `+INF`
    /// when exact.
    pub tau: f64,
    /// A reduction happened here or in an ancestor that had a say.  `false`
    /// means the sketch *is* the exact colour, up to f32 storage.
    pub reduced: bool,
}

pub type Handle = Rc<Sketch>;
```

Weights are `f32` in a sketch (relative error $6 \times 10^{-8}$ per store, far below
anything a $k$-point estimate resolves) and `f64` inside a merge or a reduction. A
weight that rounds to zero or to a subnormal is dropped, and every sketch is allocated
at its exact length. On top of the entries an `Rc` box costs 48 bytes. At $k = 256$ a
full sketch is 2,048 bytes of entries, exactly a jemalloc size class, so only the rare
$k + 1$ output rounds up. The `Rc` matters more than the layout: most transactions spend
one parent, or one parent several times, and their colour *is* the parent's, so the
record answers the parent's `Rc` and costs a reference-count bump.

### 7.3 Randomness

Every draw is a hash of its coordinates, so a run is a deterministic function of its
input (the same seed over the same records writes the same bytes, which is what lets
`check` reproduce a `chain` run from a stored file), and the draws are exactly as
independent as each variant needs{{< sidenote >}}The mixer is the output function of
SplitMix64, which Vigna's public-domain
[`splitmix.c`](https://prng.di.unimi.it/splitmix.c) presents as a fixed-increment
version of Java 8's `SplittableRandom`, the generator of Steele, Lea and
Flood.{{< cite "steele2014fast" >}}{{< /sidenote >}}:

```rust
/// Vigna's SplitMix64 output function.  `splitmix64(0) == 0xE220A8397B1DCDAF`.
#[inline]
pub fn splitmix64(x: u64) -> u64 {
    let mut z = x.wrapping_add(0x9E37_79B9_7F4A_7C15);
    z = (z ^ (z >> 30)).wrapping_mul(0xBF58_476D_1CE4_E5B9);
    z = (z ^ (z >> 27)).wrapping_mul(0x94D0_49BB_1331_11EB);
    z ^ (z >> 31)
}

/// A hash as a uniform draw strictly inside `(0, 1)`.
#[inline]
pub fn unit(h: u64) -> f64 {
    ((h >> 12) as f64 + 0.5) * (1.0 / (1u64 << 52) as f64)
}

/// The hash of the coordinates `(seed, salt, x, y)`.
#[inline]
pub fn h3(seed: u64, salt: u64, x: u64, y: u64) -> u64 {
    splitmix64(splitmix64(splitmix64(seed ^ salt) ^ x) ^ y)
}

/// `(rec << 20) | j`, the coordinate of one reduction.
#[inline]
pub fn coordinate(rec: u64, j: u64) -> u64 {
    assert!(j <= IDEAL_STEP, "step {} does not fit in the 20 bits kept for it", j);
    (rec << 20) | j
}

/// `varopt`'s systematic offset for the reduction at `x`.
#[inline]
pub fn varopt_offset(seed: u64, x: u64) -> f64 {
    unit(h3(seed, SALT_VAROPT, x, 0))
}

/// `prio`'s priority draw for block `b` in the reduction at `x`.
#[inline]
pub fn prio_draw(seed: u64, x: u64, b: u32) -> f64 {
    unit(h3(seed, SALT_PRIO, x, b as u64))
}

/// `coord`'s coordinated key for block `b`: the same in every sketch of a run.
#[inline]
pub fn coord_key(seed: u64, b: u32) -> f64 {
    unit(h3(seed, SALT_COORD, 0, b as u64))
}
```

- **Fresh per reduction** for `varopt` and `prio`: the coordinate holds the record index
  and the step $j$ inside the record ($j = 0$ in record mode, the 1-based fold step in
  step mode), so no two reductions of a run share a draw. That is the hypothesis of
  {{< xref "thm:dag" "full" >}}. The largest step value, `IDEAL_STEP` $= 2^{20} - 1$, is
  reserved for `eval`'s single-shot reduction, so an IDEAL draw is never one the
  recursion also made.
- **Coordinated** for `coord`: the key depends on the block only. It is tabulated once
  per seed for the chain's 762,261 blocks and a few past them; a block past the table is
  hashed on the spot, to the same value.
- **Strictly inside $(0, 1)$.** The top 52 bits plus a half, over $2^{52}$, so the
  extremes are $2^{-53}$ and $1 - 2^{-53}$, both exact. The obvious 53-bit form
  `((h >> 11) + 0.5) / 2^53` is wrong: $2^{53} - 0.5$ is not an `f64` and rounds to
  $2^{53}$, which makes the largest draw exactly $1$.
  {{< xref "thm:varopt" "full" >}}(5) needs $0 < U < 1$, and `prio` divides by its draw.
- **Salts** keep the three variants' streams apart at equal seeds.

### 7.4 The driver

`driver.rs` copies the loop of `src/main.rs`'s `run()` rather than sharing it (that loop
is welded to the exact store), and keeps everything that decides *which* colour is
combined with *what* identical to it: the fold order (inputs from the last to the first,
`foldr`), the shares (the total summed in input order as an `f64`, equal shares when it
is zero), when a colour dies, and the BIP-30 duplicate transaction ids (an insert
displaces the older colour, which is released).

```rust
let total: f64 = inputs.iter().map(|i| i.amount as f64).sum();
let n = inputs.len() as f64;
let share = |i: &Input| if total > 0.0 { i.amount as f64 / total } else { 1.0 / n };
if let Some(o) = &self.oracle {
    o.last_reads(rec, inputs, &mut self.last_reads);
}
debug_assert!(self.ops.is_empty());
for i in (0..inputs.len()).rev() {
    let prev = inputs[i].prev_tx_id;
    let entry = match self.colors.get_mut(&prev) {
        // …
    };
    let taken = match &self.oracle {
        Some(_) => self.last_reads[i],
        None => entry.1 <= 1,
    };
    let s = share(&inputs[i]);
    if !taken {
        entry.1 = entry.1.saturating_sub(1);
        let h = clone_handle(&entry.0);
        self.ops.push((h, s));
    } else {
        let (h, _) = self.colors.remove(&prev).expect("just looked it up");
        self.ops.push((h, s));
    }
}
let c = self.alg.record(&self.ops, rec);
```

With the release oracle an input *moves* its parent's colour out of the map when it is
that colour's last reader, so the colour is freed as soon as the record that consumed it
is done; without it the unspent-output counts decide, as in `run()`. The map is keyed by
transaction id with a multiplicative hash: SipHash's resistance to chosen keys buys
nothing over a file of sequential integers.

### 7.5 One record: grouping, the n-way merge, one reduction

```rust
fn record_mode(&mut self, ops: &[(Handle, f64)], rec: u64) -> Handle {
    self.group(ops);
    assert!(!self.groups.is_empty(), "record {} has no operand with a positive share", rec);
    if self.groups.len() == 1 {
        // sum s_i = 1: the parent's colour is the colour.
        return Rc::clone(&ops[self.groups[0].0].0);
    }
    self.merge_groups(ops);
    let reduced_in = self.groups.iter().any(|&(i, _)| ops[i].0.reduced);
    // … (coord's per-operand caps)
    let out = self.finish(reduced_in, &caps, rec, 0);
    // …
}
```

`group` adds the shares of operands that are the same `Rc` and skips zero shares.
Skipping them is not cosmetic: the chain has tens of thousands of zero-value inputs
inside records of positive total, and a zero-share parent merged anyway adds up to $k$
zero-weight candidates. That pushes $n$ past $k$ when the real support is smaller,
forcing a reduction of an exact colour, and in the textbook VarOpt loop it made the
threshold negative.

The candidates are formed by a balanced tree of two-pointer merges,
$\lceil \log_2 G \rceil$ levels for $G$ groups, in $O(N \log G)$:

```rust
/// `sa . a + sb . b` over ascending entries, into `out` (appended), zeros
/// dropped.
pub fn merge_two(a: &[Entry], sa: f64, b: &[Entry], sb: f64, out: &mut Vec<(u32, f64)>) {
    out.reserve(a.len() + b.len());
    let (mut i, mut j) = (0, 0);
    while i < a.len() && j < b.len() {
        let (x, y) = (a[i], b[j]);
        let (bk, v) = if x.b < y.b {
            i += 1;
            (x.b, sa * x.w as f64)
        } else if y.b < x.b {
            j += 1;
            (y.b, sb * y.w as f64)
        } else {
            i += 1;
            j += 1;
            (x.b, sa * x.w as f64 + sb * y.w as f64)
        };
        if v > 0.0 {
            out.push((bk, v));
        }
    }
    // … (the two tails)
}
```

A heap-based $k$-way merge has the same bound and was measured much slower: over the
first 6M records at $k = 256$ it cost 21 ns a candidate for 3–8 groups and 50 ns above
that, against 4.5 ns for a two-pointer pass, because a heap's sift is a chain of
unpredictable branches and the pass is one predictable compare. The tree fixes the
summation order, so the result is deterministic. Its scratch vectors are pooled between
records and trimmed to 32 MB after a consolidation of thousands of parents.

`finish` then stores the candidates as they are if there are at most $k$ of them (they
are the exact mixture of the parents' sketches), and otherwise reduces once:

```rust
Variant::VarOpt => {
    if n <= k {
        return Sketch::stored(&self.cand, 0.0, reduced_in);
    }
    let u = hash::varopt_offset(self.cfg.seed, hash::coordinate(rec, j));
    let o = varopt::reduce(&self.cand, k, u, &mut self.vo, &mut self.out);
    self.work.reductions += 1;
    if o.off_by_one(k) {
        self.work.off_by_one += 1;
    }
    Sketch::stored(&self.out, o.tau, true)
}
```

`reduce=step` is the same machinery, folding pairwise with
`merge_two(&h.entries, *s, &acc.entries, 1.0, …)` and calling `finish` after every
combine with step index $j$.

### 7.6 The VarOpt reduction

The threshold comes from {{< xref "lem:fixedpoint" "full" >}}: a few linear passes, each
summing the lights *directly*.

```rust
pub fn threshold(cand: &[(u32, f64)], k: usize, scratch: &mut Scratch) -> f64 {
    let w: f64 = cand.iter().map(|c| c.1).sum();
    let mut thr = w / k as f64;
    for _ in 0..MAX_PASSES {
        let (mut heavy, mut light, mut max_light) = (0usize, 0.0f64, 0.0f64);
        for &(_, v) in cand {
            if v > thr {
                heavy += 1;
            } else {
                light += v;
                max_light = max_light.max(v);
            }
        }
        if heavy >= k {
            break; // only rounding can get here; the sort decides
        }
        let next = light / (k - heavy) as f64;
        if max_light <= next {
            return next.max(max_light);
        }
        thr = next;
    }
    threshold_sorted(cand, k, scratch)
}
```

The textbook loop starts from $W$ and subtracts each heavy. On this chain that is wrong
in a way that matters: a merge can have a few items holding nearly all the mass and a
tail of thousands of tiny ones, and $W$ minus the heavies is then the cancellation
residue of two nearly equal numbers. It came out *negative* in half of the trials of a
simulation run during the design, which made every candidate heavy. One to three passes
is the rule; geometrically decaying weights, the shape near-copy chains make, drop the
threshold by a factor of about $k(1 - r)$ a pass. After `MAX_PASSES` $= 24$ the code
falls back to `threshold_sorted`, which partially sorts the top $k$ (only they can be
heavy, since $h \le k - 1$) and builds the tail sums from the small end, again without
differences. The result is clamped to at least the largest light weight, which only
rounding can violate and which keeps every $v/\tau \le 1$.

The sample itself is one pass:

```rust
let (mut heavies, mut lights) = (0, 0);
// The accumulator is kept in [0, 1): subtracting the crossing rather than
// comparing floors keeps its absolute precision at the scale of one item,
// however many items the pass walks.
let mut acc = u;
// A multiply rather than a divide per item; v * (1/tau) and v / tau differ
// by at most an ulp, which moves an inclusion probability by 1e-16.
let inv = 1.0 / tau;
for &(b, v) in cand {
    if v > tau {
        out.push((b, v));
        heavies += 1;
        continue;
    }
    acc += v * inv;
    if acc >= 1.0 {
        out.push((b, tau));
        lights += 1;
        acc -= 1.0;
    }
}
```

In exact arithmetic it keeps exactly $k$ points ({{< xref "thm:varopt" "full" >}}(1));
in floating point the last crossing can land on either side of an integer, giving
$k \pm 1$. The output is never trimmed back to $k$, because trimming would bias it; such
events are only counted (`k+-1` in `--stats`), and the code asserts at most $k + 1$
points. Over the whole chain at $k = 512$ and $1024$ the count was zero.

### 7.7 `prio` and `coord`

`prio` keeps the $k$ largest priorities $v/u$ and carries each kept block at $\max(v, \tau_q)$:

```rust
// …
q.extend(
    cand.iter()
        .enumerate()
        .map(|(i, &(b, v))| (v / prio_draw(seed, x, b), i as u32)),
);
// Descending by priority: the k largest land in q[..k], the (k+1)-th at k.
q.select_nth_unstable_by(k, |a, b| b.0.total_cmp(&a.0));
let tau = q[k].0;
// …
for &i in keep.iter() {
    let (b, v) = cand[i as usize];
    out.push((b, v.max(tau)));
}
```

`prio`'s weights stay raw Horvitz–Thompson inside the recursion
({{< xref "prop:prio-raw" "full" >}}) and are normalised only when emitted. `coord`
merges by {{< xref "lem:disjoint" "full" >}}: each operand's (rank) threshold, rescaled
to the merged colour, caps the new one.

```rust
pub fn cap_of(groups: impl Iterator<Item = (f64, f64)>, mode: Cap) -> f64 {
    match mode {
        Cap::Min => groups
            .filter(|g| g.1.is_finite())
            .map(|(s, tau)| tau / s)
            .fold(f64::INFINITY, f64::min),
        Cap::Harm => {
            let inv: f64 = groups.filter(|g| g.1.is_finite()).map(|(s, tau)| s / tau).sum();
            if inv > 0.0 {
                1.0 / inv
            } else {
                f64::INFINITY
            }
        }
    }
}
```

Unlike the other two, `coord` runs its reduction on every record with several operands,
not only when there are more than $k$ candidates: a cap inherited from reduced operands
can drop candidates even when there are fewer than $k$, and the result then carries a
finite threshold. Its reduction keeps the candidates ranked strictly below
$\min(\text{cap}, r_{(k+1)})$ (with $r_{(k+1)} = \infty$ when there are at most $k$
candidates), and its estimate lifts each kept weight to $\max(v_b, 1/\tau)$ before
normalising, which is mandatory there because the zero rule leaves the raw total below
one. Every variant emits the same way:

```rust
fn emit(&self, c: &Handle, out: &mut Vec<(u32, f64)>) {
    out.clear();
    let finite_coord = self.cfg.variant == Variant::Coord && c.tau.is_finite();
    let lift = if finite_coord { 1.0 / c.tau } else { 0.0 };
    let mut total = 0.0;
    for e in c.entries.iter() {
        let w = (e.w as f64).max(lift);
        total += w;
        out.push((e.b, w));
    }
    if total > 0.0 {
        for x in out.iter_mut() {
            x.1 /= total;
        }
    }
}
```

For `varopt` the normalisation is the identity up to `f32` rounding
({{< xref "thm:varopt" "full" >}}(4)); the DAG test bounds the drift of its mass by
$10^{-5}$.

### 7.8 Numerical care, in one place

- Sums in `f64`, storage in `f32`; zero and subnormal weights dropped at storage.
- No light mass obtained as a difference, in either threshold routine.
- $\tau$ clamped to at least the largest light; a $\tau \le 0$ (heavies holding
  everything) returns the heavies.
- The systematic accumulator kept in $[0, 1)$ by subtracting each crossing, so its
  absolute precision is that of one item whatever the length of the pass.
- Draws strictly inside $(0, 1)$.
- $k \pm 1$ outputs counted, never trimmed.

### 7.9 Modes, threads and the commands that were run

- **`eval`** runs the exact store (`exact.rs`, bit-identical to `--weighted`) on its own
  thread beside one thread per sketch configuration, all fed by one parse, and measures
  every sketch against the whole exact colour every `--every` records, next to the same
  variant's *single-shot* reduction of the exact colour (the IDEAL). The exact store's
  memory caps it at a prefix: 3M records without `--force-exact`.
- **`chain`** runs the whole chain, one store thread per configuration, and compares
  each sampled record's estimate with the exact Laplace values, moments and (optionally)
  1024-band binned colours on disk. Reference threads run `zstd -dc` on those files and
  cut them into batches on the same boundaries as the records (8,192 records a batch),
  checking every line's transaction id. The bounded channels (8 batches) keep the
  fastest store from running away from the slowest. Errors are aggregated per 10M-record
  bucket, over all rows and over *reduced* rows (a reduction somewhere in the ancestry).
- **`emit`** writes every record's estimate: a reader thread parses, the store thread
  folds, an encoder thread writes, so parsing, sketching and the pipe to `zstd` overlap.
- **`check`** recomputes `chain`'s metric columns from an `emit` file, byte for byte, so
  a stored production file can be validated after the fact; **`decode`** turns the
  binary format into text.

The global allocator is jemalloc (the repository's default feature): a fold's heap is
millions of small blocks freed and reallocated at every merge, the shape glibc's malloc
degrades on.

```text
cargo build --release --bin sketch
cargo test  --release --bin sketch -- --include-ignored

# eval3m: the first 3M records, exact colours side by side (abridged: 26 configs in one pass)
sketch eval --config varopt:16 … --config varopt:4096 \
  --config varopt:64:seed=2 … --config varopt:64:reduce=step --config varopt:256:reduce=step \
  --config prio:16 … --config prio:1024 --config coord:16 … --config coord:1024 --config coord:64:cap=harm \
  --oracle lastspend-2022.u32 --out eval3m --limit 3000000 --every 200 \
  --check-ref --laplace-ref colors.laplace.zst --stats < finalBCUTXO_2022.scm

# pass A: the whole chain, k <= 256, baselines, seeds, step mode, with the binned reference
sketch chain --config varopt:16 --config varopt:32 --config varopt:64 --config varopt:128 --config varopt:256 \
  --config varopt:64:seed=2 --config varopt:64:seed=3 --config varopt:256:seed=2 --config varopt:256:seed=3 \
  --config varopt:64:reduce=step --config prio:64 --config prio:256 --config coord:64 --config coord:256 \
  --oracle lastspend-2022.u32 --out A --limit all --every 16 --rows-every 16 --bucket 10000000 \
  --laplace-ref colors.laplace.zst --moments-ref colors.moments.zst \
  --bands-ref colors.bands1024.zst --stats < finalBCUTXO_2022.scm

# pass B: the whole chain, k = 512 and 1024 (no binned reference)
sketch chain --config varopt:512 --config varopt:1024 --config prio:1024 \
  --oracle lastspend-2022.u32 --out B --limit all --every 16 --rows-every 16 --bucket 10000000 \
  --laplace-ref colors.laplace.zst --moments-ref colors.moments.zst --stats < finalBCUTXO_2022.scm

# the cost emits (k = 64, 128, 256; and k = 512, stopped at about 400M records):
# splitcount, a small C helper, cuts the binary stream at record boundaries into
# 10M-record stretches and pipes each through its own `zstd -q -T16 -12`,
# writing raw and compressed bytes per stretch; nothing is stored
sketch emit --config varopt:256 --oracle lastspend-2022.u32 --limit all --stats \
  < finalBCUTXO_2022.scm 2> emit.k256.err | splitcount 10000000 tmp256 > stretches.k256.tsv
# the two --long=27 runs: the same through splitcount2, which takes the zstd options

# production (section 9)
sketch emit --config varopt:512 --oracle lastspend-2022.u32 --limit all --stats \
  < finalBCUTXO_2022.scm 2> emit.err | zstd -q -T16 -12 --long=27 -o colors.sketch-varopt512.zst
```

### 7.10 The output format

From `encode.rs`, integers as LEB128 varints, `z()` zigzag, floats little-endian:

```text
header:  "SKETCH01" | u32 version=1 | u8 variant (0 varopt, 1 prio, 2 coord)
         | u8 reduce (0 record, 1 step) | u8 cap (0 min, 1 harm) | u8 0
         | u32 k | u64 seed | u32 floor | u32 0
record:  varint z(tx - (prev_tx + 1))        prev_tx starts at u64::MAX
         u8 tag                              bit 0: shared form, bit 1: reduced
         [f32 tau | f32 (raw_mass - 1)]      only when reduced
         tag bit 0 clear:  varint n | n x varint db | n x f32 p
         tag bit 0 set:    f32 w* | varint m | m x varint db  (p bit-equal to w*)
                           | varint h | h x varint db | h x f32 p
trailer: "SKEND001" | u64 records | u64 sum over records of (tx ^ n), wrapping
```

Two facts shape it. Block ids sampled from a colour hundreds of thousands of blocks wide
have nearly incompressible gaps, so they are written as varint deltas. And all the light
terms of a `varopt` sketch carry the same weight, $\tau$ over the total, so the *shared
form* stores that weight once and then only the blocks that have it: four bytes saved
per light term, most of a sketch. The encoder does not know which variant wrote a
record; it uses the shared form whenever the most frequent `f32` bit pattern occurs at
least twice, which is lossless whatever wrote it. The `reduced` bit tells a reader which
colours are exact (a record without it *is* the colour, up to `f32`). The format is
meant for `zstd`. The encoder's notes recommend plain `-12` without `--long`, because
`--long=30`'s 1 GiB window must then be passed to every decoder; `--long=27` (a 128 MB
window) avoids that, since it decodes with a plain `zstd -d` (verified with `cmp`), and
production uses it. Those notes, and the production line in `sketch.rs`'s documentation
(`sketch emit ... | zstd -T16 -12`), predate this choice.

### 7.11 The tests

`cargo test --release --bin sketch -- --include-ignored` passed 106 of 106 at the time
of the runs. What they assert:

- **Randomness (T1).** `splitmix64`'s golden value; `unit` strictly inside $(0, 1)$ at
  both ends and over a million draws; streams deterministic and distinct across salts
  and seeds.
- **VarOpt, deterministic (T2).** Over 1,000 random cases $\times$ 64 offsets: output
  ascending, a subset of the input, heavies kept with their weight, lights at $\tau$,
  $\sum_b \min(1, v_b/\tau) = k$ to $10^{-9}$ relative, and, except in $k \pm 1$ events,
  exactly $k$ points, the mass to $10^{-12}$ and every CDF gap below $\tau$
  ({{< xref "thm:varopt" "full" >}}); fewer than 64 $k \pm 1$ events in 64,000
  reductions. The iterated threshold equals the sorted one on 3,000 cases, including
  geometric weights and many-way ties; a few items holding all but $10^{-17}$ of the
  mass never overflow $k + 1$.
- **VarOpt, statistical (T3).** Over 200,000 offsets, every coordinate's mean estimate
  is its weight, every light's inclusion frequency is $v/\tau$, and the mean Laplace
  value at $s = 4$ is exact, all within 5 standard errors.
- **prio (T4).** The mean raw Horvitz–Thompson weight of every coordinate is its weight
  within 5 SE, and the output always has $k$ points.
- **coord (T5, T6).** {{< xref "lem:disjoint" "full" >}} bit for bit in the `f32` world,
  nested; step mode with the binary cap; `cap=harm` keeps a rank prefix of what
  `cap=min` keeps; against the exact store on overlapping DAGs, stored weights are lower
  bounds and an infinite $\tau$ means exact.
- **The driver (T7, T8).** With $k$ at least every support, every variant in both reduce
  modes, with and without the oracle, emits the exact colour; with $k = 64$, every
  record whose exact support is at most 64 comes out exact; with $k = 2^{20}$ every
  variant matches the exact store, and the exact store matches a direct reimplementation
  of `run()`'s fold bit for bit.
- **Through a DAG (T9, T10).** Over 2,000 seeds on a synthetic DAG, `varopt`'s emitted
  estimate and `prio`'s raw weights are unbiased within 5 SE, block by block and for the
  Laplace value; `varopt`'s mass stays within $10^{-5}$ of one at every record.
  `coord`'s bias is documented by an ignored test rather than gated: worst
  $\lvert z \rvert = 19.7$.
- **Format and determinism.** Emitted bytes decode to the text emitted directly,
  metadata included; the same seed writes the same bytes, another seed does not.
- **Integration.** The first 100,000 records of the chain with $k = 2^{20}$, transaction
  by transaction, against `coloring-bt-transactions 100000 --weighted`: worst absolute
  error $3.34 \times 10^{-8}$, worst relative error $2.22 \times 10^{-7}$ for
  coefficients of at least $10^{-6}$.


## 8. Results {#sec:results}

### 8.1 What was measured

- **Pass A** (`chain`, the whole chain, 14 stores in one pass): `varopt` at
  $k = 16, 32, 64, 128, 256$; seeds 2 and 3 at $k = 64$ and $256$; step mode at
  $k = 64$; `prio` and `coord` at $k = 64$ and $256$; with the 1024-band reference.
- **Pass B** (`chain`, the whole chain): `varopt` at $k = 512$ and $1024$ and `prio` at
  $1024$, one seed, without the band reference. It took 11 h 43 min and peaked at 164.4
  GB of resident memory for the three stores together.
- **eval3m** (`eval`, the first 3M records, every 200th record, 15,000 rows a
  configuration): every sketch against its whole exact colour and against the same
  variant's single-shot reduction of it.
- **Cost emits** (`emit` cut into 10M-record stretches, each compressed by its own
  `zstd -T16 -12`, §7.9): `varopt` at $k = 64, 128, 256$ over the whole chain, and at
  $k = 512$ until it was stopped at about 400M records; two more with `--long=27`.

The accuracy tables use every 256th record (3.04M rows), restricted to *reduced* rows: a
larger $k$ keeps more early colours exact, which would lower an all-rows average for a
reason that has nothing to do with how well a sketch approximates. Errors in blocks are
converted from fractions of $L$; a day is about 144 blocks. Labels: **[M]** measured,
**[P]** projected from measurements, **[E]** a rougher estimate (an extrapolated
compression ratio). Every number below comes from the analysis of those runs, checked by
an independent pass.

### 8.2 Error against $k$

| $k$ | mean \|Δmean\| (blocks) | p90 \|Δmean\| (blocks) | mean \|Δmean\|/sd (%) | mean max \|ΔLaplace\| (×10⁻³) | mean \|Δsd\|/L (×10⁻³) |
| ---: | ---: | ---: | ---: | ---: | ---: |
| 16 | 9,401 | 19,186 | 6.17 | 16.7 | 4.30 |
| 32 | 4,951 | 10,174 | 3.25 | 9.18 | 2.33 |
| 64 | 2,580 | 5,330 | 1.69 | 4.89 | 1.22 |
| 128 | 1,333 | 2,759 | 0.873 | 2.53 | 0.615 |
| 256 | 686 | 1,426 | 0.446 | 1.29 | 0.301 |
| 512 | **349** | **729** | 0.225 | 0.659 | 0.143 |
| 1024 | **178** | **372** | 0.114 | 0.338 | 0.070 |
| `prio` 64 / 256 / 1024 | 15,303 / 7,585 / 3,731 | 33,373 / 16,500 / 8,158 | 9.74 / 4.80 / 2.35 | 24.1 / 12.0 / 5.92 | 9.69 / 4.60 / 2.25 |
| `coord` 64 / 256 | 67,482 / 59,072 | 121,513 / 105,765 | 39.4 / 34.5 | 71.0 / 61.6 | 12.2 / 13.4 |
{#tab:k .fullwidth caption="Error of the sketched colour against the exact one, whole chain, reduced rows, seed 1, record mode. Rows without a variant name are varopt. All measured."}

{{< fig src="error-vs-k.svg" type="fullwidth" label="fig:k" alt="Two log-log panels of mean error against k for varopt, prio and coord, with 1/k and 1/sqrt(k) guides." >}}
Error against $k$ on the whole chain, reduced rows: the mean absolute error of the mean
block, and the mean of the largest Laplace error over the seven $s$. `varopt` follows
the $1/k$ guide from 16 to 1024; `prio` follows $1/\sqrt{k}$; `coord` barely moves.
{{< /fig >}}

`varopt`'s error halves with every doubling of $k$, with no floor up to $k = 1024$. Over
$k = 16..256$ the log-log slopes are $-0.93$ to $-0.96$ for
$\lvert\Delta\text{mean}\rvert$, $\lvert\Delta\text{sd}\rvert$, the Laplace errors at
$s = 0.5..8$, the largest Laplace error and the binned $W_1$; $-0.90$ and $-0.85$ for
$\Lambda_{16}$ and $\Lambda_{32}$, the far tail that small sketches undersample. The
local slopes steepen with $k$: about $-0.97$ for $\lvert\Delta\text{mean}\rvert$ from
256 to 512 and from 512 to 1024 over the whole chain ($-0.98$ on 0–300M). An approximate
law is
$\lvert\Delta\text{mean}\rvert \approx (1.0 \text{ to } 1.2)\cdot \text{sd}_{\text{exact}}/k$:
the product $k \cdot \lvert\Delta\text{mean}\rvert/\text{sd}$ drifts from $0.99$ at
$k = 16$ to $1.17$ at $k = 1024$.

### 8.3 Error against depth

| stretch (records) | $k = 128$ | $256$ | $512$ | $1024$ | exact sd (blocks) | $512$: \|Δmean\|/sd (%) | $1024$: \|Δmean\|/sd (%) |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| 0–100M | 774 | 396 | 201 | 102 | 81,722 | 0.241 | 0.121 |
| 100–200M | 1,016 | 522 | 265 | 134 | 117,957 | 0.224 | 0.113 |
| 200–300M | 1,132 | 579 | 294 | 149 | 131,579 | 0.222 | 0.112 |
| 300–400M | 1,328 | 683 | 349 | 179 | 156,036 | 0.223 | 0.114 |
| 400–500M | 1,433 | 746 | 381 | 195 | 173,760 | 0.218 | 0.111 |
| 500–600M | 1,561 | 803 | 409 | 209 | 187,386 | 0.219 | 0.111 |
| 600–700M | 1,661 | 853 | 434 | 221 | 190,819 | 0.228 | 0.116 |
| 700–778.6M | 1,835 | 940 | 481 | 249 | 210,306 | 0.230 | 0.119 |
{#tab:depth caption="varopt, mean absolute error of the mean block (in blocks) by stretch of the chain, reduced rows; the exact spread of the same rows; and the error relative to it."}

{{< fig src="error-vs-depth.svg" type="fullwidth" label="fig:depth" alt="Two panels of error per 10-million-record bucket along the chain for varopt at seven k, prio and coord." >}}
Error along the chain, per 10M-record bucket, reduced rows. In blocks (left) `varopt`'s
error grows by about 1.8× from 100–200M to the end, exactly as the colours' own spread
does; relative to that spread (right) it is flat at every $k$. `coord`'s relative error
keeps growing.
{{< /fig >}}

There is no accumulation with depth. The error in blocks grows, by about 1.8× from
100–200M to 700–778.6M at every $k$, because the colours themselves spread out (their
exact sd goes from 118k to 210k blocks). Relative to the spread it is flat: the ratio of
the last stretch to 100–200M is 1.01–1.02 for $k = 16..256$, 1.03 at $k = 512$ and 1.05
at $k = 1024$. The deepest stretch is still the one to plan against: its p90 is 3,677 /
1,896 / 978 / 503 blocks for $k = 128 / 256 / 512 / 1024$. One thing does grow:
`varopt`'s $\lvert\Delta\text{sd}\rvert$, by 1.12–1.28× with depth at $k \le 256$
(`prio`'s by 1.8×). As §6.3 explains, the flatness is measured, not proved.

### 8.4 The variants compared

- **`prio` falls as $1/\sqrt{k}$** (slopes $-0.49$ to $-0.54$; $-0.51$ from 256 to
  1024), as the argument after {{< xref "prop:poisson" "full" >}} predicts. Its error is
  5.9× `varopt`'s at $k = 64$, 11.1× at $256$ and 20.9× at $1024$: `prio` at 1024 is
  worse than `varopt` at 64, and `prio` at 256 is worse than `varopt` at 32. Against its
  own single-shot reduction on exact colours (eval3m, colours above 32,768 blocks) the
  recursive `prio` is $-13\%$ to $+1\%$ off: the recursion adds nothing, and its whole
  error is the sampling error of one priority-sampling reduction.
- **`coord` does not improve with $k$ and is mostly bias.** Its slopes from 64 to 256
  are $-0.16$ to $+0.08$; its error relative to the spread grows 2.1–2.3× along the
  chain (depth exponent 0.8–0.9 for $\lvert\Delta\text{mean}\rvert$); and its signed
  mean is 0.99 of its mean absolute error for $\Delta$mean and for $\Lambda_{0.5}$ and
  $\Lambda_2$ (0.94–0.95 for $\Lambda_8$, 0.61–0.80 for $\Lambda_{32}$). Its estimated
  colours are systematically too late. On eval3m its excess over its own single shot
  *grows* with $k$ (KS $+120\%$ and $W_1$ $+98\%$ at $k = 1024$). This is §6.6 at scale.

### 8.5 Bias

{{< fig src="bias.svg" type="fullwidth" label="fig:bias" alt="Left: signed mean error of the mean per bucket for three varopt seeds and prio at k 256. Right: signed mean over mean absolute error per bucket for varopt, prio and coord." >}}
Signed error per 10M-record bucket at $k = 256$. Left, in blocks: three `varopt` seeds
stay within a few hundred blocks of zero (RMS about 70 blocks over the 78 buckets),
while `prio` swings by up to about 1,800. Right, signed mean over mean absolute error:
`coord` sits at $+1$, all bias.
{{< /fig >}}

`varopt` is unbiased by {{< xref "thm:dag" "full" >}}, and the chain does not contradict
it, but the test is weak. Rows of one run share sketches and ancestry, so per-row
standard errors understate the spread of a mean many times over (by 3× to 35× on the
first 600k records; that produced "biases" at $z = 24$ that 16 seeds showed were not
there). The honest test uses independent seeds: three at $k = 64$ and at $k = 256$,
whole-chain count-weighted signed means, $t$ with 2 degrees of freedom.

- $\lvert t \rvert \le 2.18$ at $k = 64$ and $\le 0.94$ at $k = 256$ over $\Delta$mean
  and the seven Laplace values ($p \ge 0.16$).
- The 95% bound on $\lvert\text{bias}\rvert$,
  $\lvert\text{mean}\rvert + t_{0.975,2}\cdot\text{SE}$, is at most 11.4% of the mean
  absolute error at $k = 64$ and 16.7% at $k = 256$. Three seeds cannot do better than
  that.
- Per stretch, none of the 128 $t$ values exceeds the critical 4.30 (the largest is
  $-4.27$); per 10M bucket, 1–2 of 78 reject at $k = 256$ and 2–6 of 78 at $k = 64$,
  against about 3.9 expected (and buckets are serially correlated).
- On eval3m with 4 seeds, and in an earlier 12-seed check on a prefix of the chain:
  $\lvert z \rvert \le 1.21$.
- $k = 512$ and $1024$ were run with one seed and were **not** tested for bias.

### 8.6 Record mode against step mode

{{< fig src="step-vs-record.svg" label="fig:step" alt="Ratio of step-mode to record-mode error per bucket for three metrics at k 64." >}}
`varopt` at $k = 64$: the error of the literal pairwise fold (a reduction after every
combine) over that of one reduction per record, per bucket.
{{< /fig >}}

Step mode is worse at every depth: over the whole chain 1.49× for
$\lvert\Delta\text{mean}\rvert$, 1.72× for $\lvert\Delta\text{sd}\rvert$, 1.34× for the
largest Laplace error, 1.24× for $\Lambda_8$, 1.46× for binned $W_1$ and 1.51× for the
band-edge KS, between 1.18× and 2.02× per stretch, with $\lvert\Delta\text{sd}\rvert$
the least uniform (1.26× before 100M, 1.80–2.02× after 200M). It did 6.15× the
reductions (1,219,272,266 against 198,333,465) for about the same CPU time (3,951 s
against 4,048 s of fold time), and on eval3m it multiplied the KS and $W_1$ excess over
the single shot by 2.2–2.6×.

### 8.7 The recursion against a single reduction

{{< fig src="recursion-vs-single-shot.svg" type="fullwidth" label="fig:ideal" alt="Left: W1 against k for recursive and single-shot varopt and prio. Right: percentage excess of recursive varopt over single shot for KS, W1, TV1024 and the mean." >}}
The first 3M records, colours with more than 32,768 blocks, against the exact colours.
Left: $W_1$ of the recursive sketch and of the same reduction applied once to the exact
colour. Right: how much the recursion adds for `varopt`, in percent.
{{< /fig >}}

| metric | excess at $k = 16$ | excess at $k = 4096$ |
| :--- | ---: | ---: |
| KS | +66% | +235% |
| $W_1$ | +31% | +97% |
| TV over 1024 bands | +1% | +52% |
| \|Δmean\| | +29% | +67% |
{#tab:ideal caption="eval3m, varopt, colours with more than 32,768 blocks: excess of the recursive sketch over the single-shot reduction of the exact colour (paired, every 200th record of the first 3M)."}

The recursion has a price, and it grows slowly with $k$, but both errors keep falling:
the recursive KS and $W_1$ fall as $k^{-1.05}$ and $k^{-1.07}$, the single shot as
$k^{-1.17}$ and $k^{-1.14}$. For colours of 4,097 to 32,768 blocks the $W_1$ excess is
only +2% to +28%. And the price does not grow with depth (§8.3).

### 8.8 Floors: what TV1024 cannot say

A sketch of $k$ points of a colour spread over thousands of bands cannot have a small
total variation over 1024 bands, however good it is. Recomputed with each row's own
$\tau$, the single-shot VarOpt lower bound on TV1024 is 0.883, 0.746 and 0.375 against
the measured 0.919, 0.818 and 0.540 at $k = 16, 64, 256$: at least 96%, 91% and 69% of
the measured TV1024 is sampling floor, so it does not measure the recursion at
$k \le 256$ and is left out of the comparisons. The band-edge KS has a floor of about
$0.75\,\tau$ (the remark after {{< xref "cor:bv" "full" >}}; single-shot KS$/\tau$
measured at 0.741–0.750 for $k = 16$ to $4096$), which is 50–70% of the measured value.
The binned $W_1$ has no hard floor (on eval3m the single shot is 60–77% of the measured
value for $k \le 1024$, falling to about 51% at $k = 4096$). So $k$ is chosen on
$\lvert\Delta\text{mean}\rvert$, its p90, the Laplace errors and $W_1$.

### 8.9 Cost

| config | mean / p90 \|Δmean\| (blocks) | ≈ days (mean / p90) | peak RSS | wall time | `zstd -12` | `-12 --long=27` | status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `varopt` 64 | 2,580 / 5,330 [M] | 17.9 / 37 | 8.5 GB [M] | 1.1 h [M] | 31.3 GB [M] | ~20 GB [E] | Pareto |
| `varopt` 128 | 1,333 / 2,759 [M] | 9.3 / 19 | 12.4 GB [M] | 1.8–2.0 h [M] | 65.6 GB [M] | 41.7 GB [M] | Pareto |
| `varopt` 256 | 686 / 1,426 [M] | 4.8 / 9.9 | 20.3 GB [M] | 3.4 h [M] | 144.5 GB [M] | ~86 GB [E] | Pareto, fallback |
| **`varopt` 512** | **349 / 729 [M]** | **2.4 / 5.1** | **36.3 GB [M]** | **5.1 h [M]** | **~312 GB [P]** | **172.7 GB [M]** | **Pareto, chosen** |
| `varopt` 1024 | 178 / 372 [M] | 1.2 / 2.6 | ~68 GB [P] | 11.4–11.9 h [P] | 659–721 GB [P] | ~380–420 GB [E] | Pareto, for a tight tolerance |
| `varopt` 64, step mode | 3,866 / – [M] | 26.8 / – | ≈ `varopt` 64 [E] | fold time 0.98× `varopt` 64 [M] | ≈ `varopt` 64 [E] | – | dominated |
| `prio` 64 | 15,303 / 33,373 [M] | 106 / 232 | ≈ `varopt` 64 | fold time 1.07× `varopt` 64 [M] | not measured | – | dominated |
| `prio` 256 | 7,585 / 16,500 [M] | 53 / 115 | ≈ `varopt` 256 | fold time 1.12× `varopt` 256 [M] | not measured | – | dominated |
| `prio` 1024 | 3,731 / 8,158 [M] | 26 / 57 | ~68 GB [P] | ≥ `varopt` 1024 | not measured | – | dominated |
| `coord` 64 | 67,482 / 121,513 [M] | 469 / 844 | ≈ `varopt` 64 | fold time 0.77× `varopt` 64 [M] | not measured | – | dominated |
| `coord` 256 | 59,072 / 105,765 [M] | 410 / 734 | ≈ `varopt` 256 | fold time 0.64× `varopt` 256 [M] | not measured | – | dominated |
{#tab:cost .fullwidth caption="Error against cost over the whole chain. Wall times are of single-configuration emits run beside other jobs (good to about 12 percent), except k = 512, whose wall time and --long=27 size are those of the production run of section 9, which ran almost alone; for step mode, prio and coord only the fold time of pass A is known, given relative to varopt at the same k. Sizes are the emit compressed by zstd with 16 threads."}

{{< fig src="pareto.svg" type="fullwidth" label="fig:pareto" alt="Two log-log panels: mean and p90 error of the mean against compressed size and against wall time, for varopt k 64 to 1024; measured points filled, projected hollow." >}}
`varopt`, error against cost for $k = 64$ to $1024$. Filled markers are measured, hollow
ones projected or estimated; the horizontal bars are ranges. Every doubling of $k$
halves the error and roughly doubles the bytes and the time: there is no knee.
{{< /fig >}}

- **Size.** Measured with `zstd -T16 -12` over the whole chain: 31.3, 65.6 and 144.5 GB
  at $k = 64, 128, 256$ (raw 114.7, 212.8 and 411.9 GB), and 151.2 GB for the first 400M
  records at $k = 512$ (raw 410.5 GB). Every run parsed all 778,613,440 records with a
  matching trailer, and repeated runs wrote byte-identical output. The whole-chain
  $k = 512$ size is projected by scaling the $k = 256$ tail (400M records to the end) by
  the $k = 512 / k = 256$ ratio: measured over 300–400M, that gives 313.6 GB (403 B a
  record; raw about 806 GB), and measured over 0–400M, 310.7 GB; $k = 1024$ at 659–721
  GB (raw about 1.59 TB, which would not fit on the disk: the raw stream must never be
  written). `--long=27` (a 128 MB window) saved 36.4% at $k = 128$ over the whole chain
  and 40.7% at $k = 256$ over 0–350M; at $k = 512$ the production run measured it over
  the whole chain, 172.7 GB (221.8 B a record), about 45% below the 312 GB projected
  without it. The $k = 64$, $256$ and $1024$ figures with it are estimates. Compressed
  bytes peak at 580–650M records (238.2 B a record at $k = 256$ for 600–610M), not at
  the slowest stretch (290–330M).
- **Memory.** Peak RSS 8.51, 12.39, 20.32 and 36.34 GB at $k = 64, 128, 256, 512$; the
  fit $\text{VmHWM} \approx 4.5\ \text{GB} + 8.3\ \text{B} \times$ peak entries, with
  peak entries $\approx 7.485\text{M} \times k$, projects about 68 GB at $k = 1024$,
  consistent with pass B. Live sketches hold about $0.985\,k$ entries each at the peak.
  The machine has 503 GB, so memory constrains no $k$ here.
- **Time.** 1 h 07 min, 1 h 47 min to 2 h 00 min, and 3 h 23 min at $k = 64, 128, 256$;
  about 2 h 52 min to 400M records at $k = 512$, projected to 6.3–6.6 h for the whole
  chain (the tail runs 1.22–1.28× slower than the head, more so at larger $k$); the
  production run, with almost nothing beside it, took 5 h 06 min, so the projection,
  made from emits that shared the machine, was about 25% high. $k = 1024$ is projected
  at 11.4–11.9 h by the same method, and is probably high by a similar margin. The emit
  uses 120–135% of a core; `zstd -12` with 16 threads runs at 230–290 MB/s against at
  most about 55 MB/s of output, so it is never the bottleneck.

### 8.10 The choice of $k$ {#sec:choice}

The rule: pick the smallest $k$ whose deep-chain p90 $\lvert\Delta\text{mean}\rvert$ is
below the tolerance a downstream analysis can accept for one transaction's mean colour.

| deep-chain p90 \|Δmean\| (700–778.6M) | ≈ days | $k$ |
| ---: | ---: | ---: |
| 1,896 blocks | 13 | 256 |
| 978 blocks | 6.8 | **512** |
| 503 blocks | 3.5 | 1024 |
{#tab:rule caption="The decision rule: deep-chain p90 error of the mean block, by k."}

Relative to a colour's own spread the mean $\lvert\Delta\text{mean}\rvert/\text{sd}$ is
0.45%, 0.23% and 0.11% for $k = 256, 512, 1024$, at every depth. With no stated
tolerance, $k = 512$ is the default: it halves every error of $k = 256$, its memory is
measured, its output takes under a quarter of the 1,291 GB free on the disk even without
`--long`, and it runs overnight. $k = 1024$ is feasible and halves the error once more,
but costs half the free disk at `-12`, a 12-hour run, and an emit whose size, time and
memory are all projected. $k = 256$, the only $k$ with everything measured, is the
fallback.

Pass B finished after this choice was made and confirmed it. The whole-chain
$\lvert\Delta\text{mean}\rvert$ is 349 and 178 blocks for $k = 512$ and $1024$ (a ratio
of 0.51); the ratio of $\lvert\Delta\text{mean}\rvert/\text{sd}$ between the last
stretch and 100–200M is 1.03 and 1.05; pass B's peak resident memory was 164.4 GB for
its three stores; its fold time at $k = 1024$ was 1.90× that at $k = 512$, and its wall
time 11 h 43 min; and `prio` at 1024 is 20.9× worse than `varopt` at 1024.


## 9. The Production Run {#sec:production}

Started on 2026-11-13, with the build used for every measurement above:

```text
sketch emit --config varopt:512 --oracle lastspend-2022.u32 --limit all --stats \
  < finalBCUTXO_2022.scm 2> emit.err \
  | zstd -q -T16 -12 --long=27 -o colors.sketch-varopt512.zst
```

It writes `colors.sketch-varopt512.zst`: for each of the 778,613,440 transactions, in
record order, its colour as a `varopt` sketch of at most 512 blocks ($k \pm 1$ in rare
rounding events), normalised to sum one, with the bit that says whether it is exact
(and, when it is not, its $\tau$ and raw mass), in the format of §7.10. It decodes with
a plain `zstd -d` piped into `sketch decode`, and `sketch check` recomputes from it the
error tables of a `chain` run.

It ran from 07:39 to 12:45, and the pipeline exited with status 0.

| | measured | projected before the run |
| :--- | :--- | :--- |
| wall time | 5 h 05 min 56 s (fold busy 15,797 s; 131% of a core) | 6.3–6.6 h [P] |
| peak RSS (VmHWM) | 35,480,448 kB = 36.3 GB | 36.3 GB (measured on 0–400M) |
| `colors.sketch-varopt512.zst` | 172,702,042,699 bytes, 221.8 B a record | about 175–190 GB [E]; about 312 GB [P] without `--long=27` |
| reductions | 198,939,818 | – |
| peak distinct live sketches | 7,593,630 | – |
| $k \pm 1$ events | 0 | – |
{#tab:production caption="The production run. It shared the machine only with the end of pass B and a site build, which is why it beat the projection, made from emits that ran beside other jobs."}

No reduction rounded to $k \pm 1$: every sketch in the file has at most 512 entries.

**Checked by reading it back.** The file was decoded and scored against the exact
references, independently of the run that wrote it:

```text
zstd -dc colors.sketch-varopt512.zst \
  | sketch check --out check --every 16 --rows-every 16 --bucket 10000000 \
      --laplace-ref colors.laplace.zst --moments-ref colors.moments.zst
```

It took 1 h 03 min in 131 MB, read all 778,613,440 records, and found the count and
checksum of the file's trailer correct. Its per-record error rows (3,041,460 of them,
every 256th record) and its 2,496 bucket rows are byte for byte those of the
`varopt-k512-s1-rec` store of pass B, which computed them in memory while folding. So
the file holds exactly the sketches whose accuracy section 8 reports: over the whole
chain, 349 blocks mean and 729 blocks p90 error on the mean block (Table 1, §8.2). A
plain `zstd -d` decodes it; a 128 MB window needs no flag.


## 10. What Is Left {#sec:left}

- **Bias at $k \ge 512$.** Pass B ran one seed; the 3-seed test covers $k = 64$ and
  $256$ only, and its 95% bounds (11.4% and 16.7% of the mean absolute error) are loose.
  More seeds would tighten both.
- **$k = 1024$ in production.** Its accuracy is measured; its emit size, time and memory
  are projected. A 100M-record emit would firm them up (compare the first 100M records
  at $k = 512$: 34.3 GB with `-12`; a ratio above 2.3 would mean the 659–721 GB bracket
  is low).
- **Why `varopt`'s error does not grow with depth.** {{< xref "cor:rate" "full" >}}
  proves the $1/k$ rate at every record, with a factor $\sqrt{A_t}$ that is allowed to
  grow with depth; that the error relative to the colours' spread stays flat, as
  measured, is not proved (§6.3). The control for the stratification explanation, VarOpt
  with its lights chosen in random order, was run only with the design-phase prototype
  on a prefix of the chain (§6.4); repeating it with the final binary over the whole
  chain is open.
- **Literal bottom-$k$ against VarOpt.** The literal weighted bottom-$k$ sketch of
  sections 2–4 is `prio`, and here it loses by 6–21×; the exponential (PPSWOR) ranks of
  §2.2 were tried in the design phase and were no different from priority ranks. Whether
  some bottom-$k$ variant can recover the $1/k$ rate (for instance by making the choice
  among the lights systematic, which is what VarOpt does) is open.
- **The band-based floors.** The figure of TV1024 against its floor has to be redrawn
  with each row's own $\tau$ before it can be shown; the numbers in §8.8 are the
  corrected ones.
- **`--long=27` sizes** at $k = 64$, $256$ and $1024$ are estimates from the $k = 128$
  saving; at $k = 512$ the production run measured 172.7 GB, just below its estimate.


## 11. Notes and References {#sec:references}

### 11.1 Further reading

- **Sampling theory.** {{< cite keys="horvitz1952generalization" mode="text" >}}
  introduced the estimator that weights each sampled item by the inverse of its
  inclusion probability; every estimate in this post, from $\max(w_i, 1/\tau)$ to the
  $\tau$ carried by a kept light, is one of them.
  {{< cite keys="madow1949theory" mode="text" >}} belongs to the classical theory of
  systematic sampling, the design that §6.1 runs along the block axis.
  {{< cite keys="chao1982general" mode="text" >}} is a fixed-size plan with unequal
  probabilities in which units enter the sample one at a time, and VarOpt's recurrence
  draws exactly the same distribution of samples.
- **Order sampling.** {{< cite keys="rosen1997asymptotic" mode="text" >}} studies the
  designs that give every unit an independent random ranking variable and keep the $n$
  smallest: both rank families of §2.2 are of this kind. With the uniform ranks
  $u_i/w_i$ it is the sequential Poisson sampling of
  {{< cite keys="ohlsson1998sequential" mode="text" >}}, devised for the Swedish
  Consumer Price Index; with exponential ranks it is sampling without replacement with
  probability proportional to weight.
- **Priority sampling and VarOpt.** {{< cite keys="duffield2007priority" mode="text" >}}
  is the source of §2–3: priority sampling, its unbiasedness and its zero covariances.
  {{< cite keys="szegedy2006dlt" mode="text" >}} proved the near-optimality they had
  conjectured. {{< cite keys="cohen2009stream" mode="text" >}}, in its journal version
  {{< cite keys="cohen2011efficient" mode="text" >}}, define VarOpt$_k$, whose estimates
  minimise the average variance over the subsets of every size; §6.1 keeps two of their
  three requirements and trades the third for the block order.
- **Bottom-$k$ sketches.** {{< cite keys="cohen2007summarizing" mode="text" >}} treat
  bottom-$k$ sketches as one family parametrised by the rank distribution, and
  {{< cite keys="cohen2008tighter" mode="text" >}} derive their Horvitz–Thompson
  estimators by rank conditioning, the argument of §3.
  {{< cite keys="thorup2013bottom" mode="text" >}} shows how little independence the
  hash function needs, for bottom-$k$ and for priority sampling alike.
- **Counting distinct elements.** {{< cite keys="baryossef2002counting" mode="text" >}}
  keep the $k$ smallest hash values; {{< cite keys="beyer2007synopses" mode="text" >}}
  name the KMV synopsis, prove the $(k - 1)/v_{(k)}$ estimator of §1.2 unbiased, and
  extend it to multiset unions, intersections and differences.
  {{< cite keys="flajolet2007hyperloglog" mode="text" >}} is the right-hand column of
  the table of §1.3, with a standard error of about $1.04/\sqrt{m}$ for $m$ registers,
  and {{< cite keys="broder1997resemblance" mode="text" >}} the origin of MinHash and of
  resemblance as the Jaccard index of shingle sets.
- **Structure and coordination.** {{< cite keys="cohen2011structure" mode="text" >}}
  design VarOpt samples that respect an order or a hierarchy on the keys, so that range
  sums (here, the cuts of a colour's CDF) are much more accurate; their appendix on
  ordered keys sets systematic sampling beside them, which is the choice §6.1 makes.
  {{< cite keys="cohen2009coordinated" mode="text" >}} coordinate samples of many weight
  assignments over the same keys through shared ranks, as `coord` does over the blocks
  in §6.6.
- **Weighted similarity of distributions.**
  {{< cite keys="ioffe2010improved" mode="text" >}} gives consistent weighted sampling,
  a MinHash whose collision probability is the weighted Jaccard similarity, in constant
  time per nonzero weight. {{< cite keys="moulton2018maximally" mode="text" >}} argue
  that for probability distributions, such as two colours, the natural generalisation of
  the Jaccard index is a different one, and give a MinHash for it.
- **Martingales.** {{< cite keys="williams1991probability" mode="text" >}} covers what
  §6.2–6.3 use: conditional expectation, the tower property, and the orthogonality of
  martingale differences.
- **Bitcoin and taint.** {{< cite keys="nakamoto2008bitcoin" mode="text" >}} describes
  the chain whose transactions are coloured here.
  {{< cite keys="moser2014towards" mode="text" >}} define the *poison* and *haircut*
  blacklisting policies, the second of which is the recurrence of §5.1 read for one set
  of blocks; {{< cite keys="anderson2018bitcoin" mode="text" >}} propose
  first-in-first-out tracing instead, which in their case studies taints far fewer
  addresses than haircut.
- **Randomness.** {{< cite keys="steele2014fast" mode="text" >}} is the SplitMix
  generator whose output function hashes every draw of §7.3.

### 11.2 References

{{< bibliography heading="" >}}
