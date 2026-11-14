+++
date = '2026-11-12T10:30:00+01:00'
lastmod = '2026-11-14T10:03:00+01:00'
title = 'Comprehensive Guide to Bottom-$k$ Sketches'
subtitle = 'Unweighted, Weighted, Proofs & Implementations; and VarOpt Sketches of a Recurrence on the Bitcoin Chain'
description = 'Bottom-k (KMV) sketches: cardinality, unions and Jaccard similarity; the weighted extension by priority sampling and exponential scaling with the Horvitz-Thompson estimator; the proof of unbiasedness; Rust and C99 implementations. Then a recurrence sketched: the colour of every transaction of the Bitcoin chain up to 2022 as a VarOpt sketch of at most k blocks, with proofs, the Rust implementation and measurements over 778 million records; and count-distinct and Jaccard similarity of the colours by a coordinated bottom-k of their supports, exact through the DAG, with a weighted similarity by a Cauchy linear sketch.'
categories = ['data structure', 'rust', 'c']
tags = ['sketches', 'bottom-k', 'priority sampling', 'VarOpt', 'bitcoin', 'count-distinct', 'Jaccard']
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

The same estimator is exactly unbiased in a finite model as well. If the hash is a
uniformly random *permutation* of a universe of $M$ items, with ranks $0, \dots, M - 1$,
and $R$ is the $k$-th smallest rank of the $N$ items as an integer, then
$\hat N = (k - 1)M / R$ has $\mathbb{E}[\hat N] = N$, and its variance is slightly below
$N(N - k + 1)/(k - 2) \cdot (M - N)/(M - 1)$, within 1% for $k \ge 256$: the
finite-population factor $(M - N)/(M - 1)$ is a free gain when the set fills a good part
of its universe. Section 10.4 proves this, writing $n$ for the set size and $N$ for the
universe, and uses it with a smaller universe chosen for each record.

### 1.2.2 Set Merging (Unions)

Given sketch $S(A)$ and sketch $S(B)$ built with the same hash function $h$, the exact
bottom-$k$ sketch of $A \cup B$ is:{{< sidenote >}}This is why KMV sketches merge
exactly, in any order and over any partition of the data: the $k$ smallest hashes of a
union are among the $k$ smallest of each of its parts.{{< /sidenote >}}

$$S(A \cup B) = \text{bottom-}k\big(S(A) \cup S(B)\big)$$

### 1.2.3 Jaccard Similarity & Intersections

The Jaccard similarity $J(A, B) = \frac{|A \cap B|}{|A \cup B|}$ is estimated from the
bottom-$k$ sketch of the union, $S(A \cup B) = \text{bottom-}k\big(S(A) \cup S(B)\big)$,
by the fraction of its elements present in both $S(A)$ and $S(B)$:

$$\hat{J}(A, B) = \frac{|S(A \cup B) \cap S(A) \cap S(B)|}{|S(A \cup B)|}, \qquad |S(A \cup B)| = \min(k, |A \cup B|).$$

Membership is read off exactly: an element of $S(A \cup B)$ that belongs to $A$ has fewer
than $k$ elements of $A$ hashed below it, so it is in $S(A)$. When $|A \cup B| > k$,
$S(A \cup B)$ is a uniformly random $k$-subset of $A \cup B$, the count in the numerator
is hypergeometric, and $\hat J$ is exactly unbiased, with variance
$J(1 - J)/k \cdot (|A \cup B| - k)/(|A \cup B| - 1) \le 1/(4k)$. When both sketches hold
their whole sets (each set has at most $k$ items), compute $J$ exactly from them: the
formula above is then still an estimate whenever the union exceeds $k$ (§10.5).

The intersection size is then estimated as
$|A \cap B| \approx \hat{J}(A, B) \cdot \hat{N}_{A \cup B}$, consistently but not
unbiasedly, and the *containment* $|A \cap B| / |A|$ by the elements of $S(A)$ that hash
at or below the $k$-th hash of $S(B)$ (all of $S(A)$ when $S(B)$ holds the whole of
$B$): the fraction of them found in $S(B)$. That $k$-th element belongs to $B$, so when
it is also in $A$ it is a sure hit, which biases the fraction up by about $c(1 - c)/k$
for a containment $c$ (at most 0.00025 at $k = 1024$). The fraction is undefined when no
element of $S(A)$ is that small, which is common when $A$ is much smaller than
$B$.{{< sidenote >}}These estimates ask little of the hash function. Thorup shows that
with a merely 2-independent $h$ the expected relative error of estimating a fraction $f$
(here $J$) from a bottom-$k$ sample is $O(1/\sqrt{fk})$, within a constant factor of
truly random hashing when $fk = \Omega(1)$. Bottom-$k$ estimators of Jaccard and
containment from two sketches are treated by Cohen and
Kaplan.{{< cite "thorup2013bottom,cohen2007summarizing" >}}{{< /sidenote >}}

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
the reasons the threshold sampler wins run through all three. Section 10 turns to two
questions that no sketch of a colour answers: from how many blocks a transaction
descends, and how much two transactions share.

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
   §6.6 shows that this alone breaks the exactness of a coordinated (same-hash) merge
   whose ranks depend on the weights. With ranks that depend on the block alone it does
   not: a block kept in the child's sketch is kept in the sketch of every parent whose
   support contains it, and its weight is assembled exactly (§10.3).
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

The share is missing because `coord`'s rank $u_b / v$ depends on the weight, and a
block's weight in a parent differs from its weight in the child: the block can rank
below the merged sketch's threshold in the child and outside a parent's sketch, as $b_2$
does below. With ranks that depend on the block alone the share is never missing: a
block kept by the child is kept by every parent whose support holds it
({{< xref "lem:kmv-sub" "full" >}}), and the weights of a coordinated merge are then
exact ({{< xref "lem:kmv-weights" "full" >}}). What such a sketch gives up is the
weighting itself: it is a uniform sample of the support, which serves the count and the
Jaccard similarity of §10 and not the functionals of §5.1.

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
trimmed (`// …` marks a cut) but not rewritten. It is about 6,500 lines with its tests
(about 12,700 with the stores of section 10), adds no dependency, and reuses the
repository's record parser, release oracle, exact weighted store and Laplace tables
through `#[path]` modules.

### 7.1 Where things are

| file | what it holds |
| :--- | :--- |
| `sketch.rs` | command line, global allocator, dispatch to the modes |
| `hash.rs` | every random draw, as a hash of where it is drawn; the permutation of the blocks and the Cauchy draws of §10 |
| `algebra.rs` | the sketch type, the `Algebra` trait, operand grouping, the n-way merge |
| `varopt.rs`, `prio.rs`, `coord.rs` | the three reductions |
| `driver.rs` | the recurrence, driven exactly as `run()` drives it |
| `exact.rs` | the exact colour as an `Algebra`, bit-identical to `--weighted`, with its `sets` and `pos` supports |
| `feed.rs` | one parse broadcast to many stores; reference files read in lock-step |
| `metrics.rs` | mean, spread, Laplace, KS, $W_1$, TV over 1024 bands; $t$ and $\chi^2$ quantiles |
| `eval.rs`, `chain.rs`, `modes.rs` | the modes `eval`, `chain`, `check`, `emit`, `decode` |
| `encode.rs` | the binary output format |
| `kmv.rs` | the coordinated bottom-$k$ of the support: store, capped merges, estimators, count stream |
| `l1.rs` | the Cauchy projection of the colour: store, scale MLE, weighted Jaccard |
| `count.rs`, `pick.rs`, `pairs.rs` | the modes `count`, `pick`, `pairs` |
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
of the runs of section 8, and 139 of 139 with the stores of section 10. What they
assert:

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
- **The permutation (T-K1).** `Perm` is a bijection with `block(rank(b)) == b` on all of
  $[0, 2^{\text{bits}})$ for bits 12, 16 and 20 and three seeds, with its first ranks
  pinned; seeds share fewer than 1% of fixed points; a block past the universe is a hard
  error. Over $2^{16}$ seeds at 12 bits the rank of a fixed block passes a $\chi^2$ test
  on 64 cells ($p > 10^{-4}$), and the ranks of two blocks show no correlation.
- **Capped merges (T-K2).** The two-way merge, the tree and the heap equal a
  brute-force bottom-$k$ of the union, with the truncation flag exact, over random runs
  with overlaps, identical and empty runs, $k \in \{1, 2, 3, 16, 64\}$.
- **KMV through the driver (T-K3 to T-K5).** On the synthetic streams of T7 (shared
  parents, repeated inputs, zero amounts, all-zero records, one-group records, the
  BIP-30 duplicate) and on a random DAG, with and without the oracle,
  $k \in \{2, 3, 16, 64\}$: every sketch is the bottom-$k$ of the brute-force support,
  `full` holds exactly when the support exceeds $k$, a whole sketch's count is the
  support's size, the `sets` support equals the exact store's terms and the `pos`
  support its positive-share reachability; permuting or splitting operands changes no
  byte. A block diluted $10^{18}$-fold over 30 steps, whose coefficient underflows to
  0, stays in the `pos` support.
- **Estimators over 2,000 seeds (T-K6 to T-K8).** The count over both universes
  (including dense subsets of $[0, \beta]$) and the restricted union count are
  unbiased within 4 SE, with RMS within 10% of the formula; Jaccard is exact when both
  sketches are whole, also when their union exceeds $k$ (where the textbook form is
  not), and over $J \in \{0, 0.024, 0.2, 0.95, 1\}$ its mean is within 4 SE and its SD
  within 10% of the hypergeometric value; containment is NaN exactly when its sample is
  empty and otherwise unbiased within 4 SE where its sample is large.
- **The projection (T-L1 to T-L4).** The L1 store's vector equals $A\,C_t$ computed from
  the exact colour, through the grouped and the free path, to $10^{-6}$ relative in
  `f32` and $10^{-12}$ in `f64`; over 400 seeds at $m \in \{128, 512\}$ and
  $\mathrm{TV} \in \{0.001, 0.01, 0.1, 0.5, 1\}$ the scale MLE has a relative bias of at
  most 2% and a relative SD times $\sqrt m$ in $[1.30, 1.52]$ ($\sqrt 2 = 1.414$);
  identical colours give $\widehat{\mathrm{TV}} = 0$ exactly, disjoint ones a value
  within $3\sqrt{2/m}$ of 1, injected infinities a finite one; two seeds are
  uncorrelated.
- **Streams and modes (T-K9, T-K10, T-P1, T-P2, T-E1).** The count stream round-trips
  with its checksum at fixed width, `decode` dispatches on the magic and still writes
  the old text for `SKETCH01`; the same seed writes the same bytes; `pairs` equals the
  pure estimators and is byte-identical at 1 and 8 threads; `pick` captures each
  selected record once; `eval` finds no set mismatch; damaged headers are an error, not
  a panic; the new modes refuse options they would ignore.
- **Integration (T-I1).** The first 1,000,000 records of the chain at $k = 1024$
  against the exact support sizes: exact wherever the support has at most $k$ blocks,
  and every seed gate of a 16-seed family at $k = 256$ passes.


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

A second product sits beside it: `colors.kmv1024.counts.zst`, the size of every
transaction's support, counted by the coordinated bottom-$k$ of section 10, exactly when
the support has at most 1024 blocks and by an unbiased estimate otherwise. Section 10.10
says how to read it.


## 10. Counting and Comparing Colours {#sec:counting}

{{< newthought >}}Sections 5–9 read a colour{{< /newthought >}} through linear
functionals: its mean, its CDF, its Laplace values. Two questions about transactions are
not of that kind. *From how many blocks does a transaction descend?* And *how much do two
transactions share?* The `varopt` sketches cannot answer either (§10.2), and nothing about
them needs to change for the answers: two more stores, folded by the same driver beside
or instead of `varopt`, answer them, one exactly through the whole DAG (§10.3–10.5) and
one through a linear sketch (§10.6).

### 10.1 What is asked

Both questions are about the *support* of a colour, the blocks it descends from, and the
support has a recurrence of its own, the set-valued shadow of
{{< eqref "eq:recurrence" >}}:

$$
S_t = \{\beta\} \ \text{for a coinbase of block } \beta, \qquad S_t = \bigcup_{i=1}^{n} S_{p_i} \ \text{otherwise.} \label{eq:support}
$$

It comes with two semantics, and every number below names which one it is about:

- **`sets`** keeps every input, zero-amount ones included. It is what the repository's
  `--sets` computes, the exact sizes of the first 31,187,785 records are on disk
  (`finalBCUTXO_2022.sets-counts.31187785.txt`), and it is the default.
- **`pos`** keeps the operands with a positive share,
  $S^+_t = \bigcup_{i : s_{t,i} > 0} S^+_{p_i}$: the blocks reachable through
  positive-share edges. In exact arithmetic this is $\{b : c_t(b) > 0\}$, the support of
  the weighted colour, since $c_t(b)$ is a sum over paths of products of shares. In
  `f64` a coefficient can underflow to zero while its block stays reachable: record
  2,499,382 has 96,213 terms, 9,392 of them exactly 0, every one an underflow. On this
  chain the two supports nearly coincide; their $k = 1024$ seed-1 count streams differ
  in 104 of the 31,187,785 records.

Three measures are asked of it.

- **Count**, $\lvert S_t \rvert$: the number of blocks a transaction's coins descend
  from (under `sets`, through zero-amount inputs too). §5.2 gives its scale: a median of
  about 174,000 blocks over the first 31.2M records.
- **Jaccard similarity**,
  $J(x, y) = \lvert S_x \cap S_y \rvert / \lvert S_x \cup S_y \rvert$, and the
  **containment** $\lvert S_x \cap S_y \rvert / \lvert S_x \rvert$: shared *ancestry*.
- **Weighted Jaccard similarity**,
  $J_w(x, y) = \sum_b \min(c_x(b), c_y(b)) / \sum_b \max(c_x(b), c_y(b))$: shared
  *value*.

On this chain the last two say very different things. Among 255 deep transactions spread
over the first 3M records (the `deep` selection of §10.8, every support of at least
1,024 blocks), the median $J$ of a pair is 0.157 but the median $J_w$ is
$1.4 \times 10^{-4}$, and 92% of the pairs have $J_w < 0.01$: old supports are largely
shared, while a colour's weight sits on its recent blocks, which two transactions far
apart in time do not share. Inside a window of three blocks (the `window` selection) the
median $J$ is 0.994 and the median $J_w$ is 0.18. Over the whole chain the weights
overlap more: among 512 deep transactions spread from 2010 to 2022 (§10.9) the median
$J$ of a pair is 0.48 and the median estimated $J_w$ is 0.21, still 0.18 for pairs more
than 60,000 blocks apart.

### 10.2 Why the VarOpt sketches cannot answer

The production file of §9 holds a sketch of every colour, and it is tempting to read
counts and similarities off it. It cannot be done, for four reasons.

1. **Its randomness is fresh at every reduction** (§6.2), so two sketches are not
   coordinated: a block in both supports is kept in both sketches only by coincidence,
   and the overlap of two kept sets does not estimate the overlap of the supports.
2. **Kept lights are carried at $\tau$** ({{< xref "def:varopt" "full" >}}), so a kept
   light's true weight, and with it its inclusion probability $v_b/\tau$, is not in the
   sketch: a Horvitz–Thompson count $\sum 1/\pi_b$ cannot be formed from it, even
   after a single reduction.
3. **A block dropped at an ancestor is gone for every descendant**: the candidate of a
   record holds only blocks its parents' sketches kept.
4. **Blocks reached only through zero-amount inputs have weight 0** and are skipped
   (§6.2), so they are in the `sets` support and in no weighted sketch.

The weighted similarity has a natural plug-in,
$(1 - \widehat{\mathrm{TV}})/(1 + \widehat{\mathrm{TV}})$ of the two sketches ($J_w$ is
a function of TV, §10.6), and it is biased low. With $Q_x, Q_y$ the two sketches, $\min$
is concave, so by Jensen
$\mathbb{E}[\min(Q_x(b), Q_y(b))] \le \min(\mathbb{E} Q_x(b), \mathbb{E} Q_y(b)) = \min(x_b, y_b)$
block by block: the sum of minima, $1 - \widehat{\mathrm{TV}}$, is biased low, and
$\widehat{\mathrm{TV}}$ high. That alone does not sign the bias of the plug-in, a convex
function of $\widehat{\mathrm{TV}}$; what does is the size of the loss on the light
blocks. Heavy blocks are exact; a light block shared by two independent reductions is
kept by both with probability $(x_b/\tau_x)(y_b/\tau_y)$ and then counts
$\min(\tau_x, \tau_y)$, so it contributes about $x_b y_b / \max(\tau_x, \tau_y)$, far
less than $\min(x_b, y_b)$, and the plug-in came out low in every stratum measured
(§10.8). Within one run the two sketches share the reductions of their common ancestors,
so the bias depends on how many fresh reductions separate a pair from its common
ancestry, and it grows with depth. Measured:

- Two independent `varopt` sketches ($k = 512$, seeds 1 and 2) of the *same* colour
  give a plug-in $J_w$ with mean 0.963 and minimum 0, against the truth 1 (design-phase
  prototype, colours of the first 2M records).
- On pairs of reduced colours with $J_w \in [0.1, 0.5)$, the bias of the same-run
  plug-in grows from $-0.014$ over records 0–1M to $-0.079$ over 1–1.5M and $-0.111$
  over 1.5–2M (same prototype).
- On the prefix runs of §10.8 the same-run plug-in of `varopt:512` underestimates $J_w$
  by 0.171 on average over the 32,640 pairs of the `window` selection (mean 0.029 against
  0.200), by 0.268 for $J_w \in [0.2, 0.5)$ and by 0.430 for $J_w \in [0.5, 0.9)$
  (the table of weighted errors in §10.8).

The plug-in is therefore not shipped; `pairs` writes it only to document this. The
Wasserstein distance between two `varopt` sketches has no such problem. It is a metric
under which each sketch is close to its colour (section 8 measures $W_1(Q_x, x)$: a
reduction moves mass only between nearby blocks), so by the triangle inequality it is
off by at most those two errors. TV is a metric too, but under TV a sketch is far from
its colour, since its kept lights are carried at $\tau$: that is the bias above. $W_1$
serves below as a "temporal distance" between transactions.

### 10.3 A coordinated bottom-$k$ of the support is exact through the DAG

A word on notation, as in §6. From here on $\tau$ is a threshold on *ranks*, small ranks
kept, as in §2 and §6.6, not the weight threshold of §6.1–6.5 and §10.2; and $M$ is the
size of the permutation, the universe of §1.2.1.

Number the blocks $0, \dots, M - 1$ with $M = 2^{20} = 1{,}048{,}576 > L$, and let $\rho$
be a uniformly random permutation of $[0, M)$, drawn once per run and shared by every
sketch: block $b$ has *rank* $\rho(b)$, and the ranks are what makes the sketches
coordinated. For a set of blocks $S$ let $K_k(S)$ be its $\min(k, \lvert S \rvert)$
elements of smallest rank. The `kmv` store keeps, for every colour, $K_k(S_t)$ as an
ascending array of ranks and one bit, *full*, which says $\lvert S_t \rvert > k$. A
sketch that is not full *is* the support. Throughout, $S$, $A$, $B$ are supports, which
are functions of the chain alone and independent of $\rho$.

{{< lemma note="union" label="lem:kmv-union" >}}
For any sets $S_1, \dots, S_G$ with union $S$,
$K_k(S) = K_k\big(K_k(S_1) \cup \dots \cup K_k(S_G)\big)$. Hence any tree of pairwise
merges, each keeping the $k$ smallest ranks of its two inputs, computes $K_k(S)$, in any
order and grouping.
{{< /lemma >}}

{{< proof >}}
Let $x \in K_k(S)$, so fewer than $k$ elements of $S$ rank below $x$. If $x \in S_i$,
fewer than $k$ elements of $S_i \subseteq S$ rank below $x$, so $x \in K_k(S_i)$. Hence
$K_k(S) \subseteq T \subseteq S$ with $T = \bigcup_i K_k(S_i)$. For any such $T$,
$K_k(T) = K_k(S)$: if $\lvert S \rvert \le k$ then $K_k(S) = S$ and $T = S$; otherwise
$T$ contains the $k$ smallest elements of $S$, and every other element of $T$ is an
element of $S$ ranked above all of them, so the $k$ smallest of $T$ are those. The tree:
by induction on its height, a node over the leaves $S_i, i \in I$, outputs
$K_k\big(K_k(\bigcup_{I_1}) \cup K_k(\bigcup_{I_2})\big) = K_k(\bigcup_I S_i)$.
{{< /proof >}}

{{< lemma note="subsets" label="lem:kmv-sub" >}}
If $T \subseteq S$ and $x \in K_k(S) \cap T$, then $x \in K_k(T)$. In particular, for
$x \in K_k(A \cup B)$: $x \in A$ if and only if $x \in K_k(A)$.
{{< /lemma >}}

{{< proof >}}
The elements of $T$ ranked below $x$ are elements of $S$ ranked below $x$, of which
there are fewer than $k$. For the second statement take $T = A \subseteq A \cup B$; the
converse is $K_k(A) \subseteq A$.
{{< /proof >}}

{{< theorem note="exact through the DAG" label="thm:kmv-dag" >}}
Fold $K_k$ through the driver of §7.4: a coinbase of block $\beta$ is $\{\rho(\beta)\}$,
not full; a record groups its operands by parent (under `pos` it skips those of share
0), answers the parent's own sketch when one group is left, and otherwise merges the
groups' sketches by capped merges, with *full* set when an operand is full or a merge
had elements left over. Then for every record $t$ the stored sketch is $K_k(S_t)$ (or
$K_k(S^+_t)$) and *full* holds if and only if $\lvert S_t \rvert > k$
($\lvert S^+_t \rvert > k$), whatever the fold order, the grouping, the repeated
operands, the zero amounts and the release oracle.
{{< /theorem >}}

{{< proof of="thm:kmv-dag" >}}
By induction in file order; parents come earlier, so their sketches are
$K_k(S_{p_i})$. A coinbase is $K_k(\{\beta\})$. Operands that are the same parent are
the same set, and a union is idempotent, so grouping changes nothing; one group means
$S_t = S_p$, and the parent's sketch is $K_k(S_p)$. Otherwise
{{< xref "lem:kmv-union" "full" >}} gives $K_k(S_t)$. *Full*: if an operand is full,
$\lvert S_t \rvert \ge \lvert S_{p_i} \rvert > k$; if a merge had leftovers, the union
below it exceeds $k$. Conversely, if no operand is full, every operand is its whole
support, and if no merge had leftovers the root holds the whole union, so
$\lvert S_t \rvert \le k$. Under `sets` every operand is kept, which is
{{< eqref "eq:support" >}}; under `pos` the skipped operands are exactly those outside
the union defining $S^+_t$. The release oracle frees a colour after its last spender has
read it and never changes which colour an input reads, and a BIP-30 duplicate displaces
the older colour as in `run()`, the same for the support as for the colour.
{{< /proof >}}

So the fold has **no recursion error**. The sketch of a record at any depth is the
one-shot bottom-$k$ of its support, a deterministic function of $\rho$ and $S_t$, and
every estimate read from it has exactly the law of a one-shot KMV estimate. This is the
opposite of §6.3, where the whole difficulty was the error the recursion adds. What the
records of one run do share is the permutation: their errors are correlated, and
questions of bias are asked across seeds (§10.8).

The same argument gives what §5.4 and §6.6 said a coordinated merge could not have:
exact weights.

{{< lemma note="kept weights" label="lem:kmv-weights" >}}
Let each sketch also store the colour weight $c_t(b)$ of every kept block. Then for
every record $t$ and every $b \in K_k(S_t)$,
$c_t(b) = \sum_{i : b \in K_k(S_{p_i})} s_{t,i}\, c_{p_i}(b)$: the child's kept weights
are computed exactly from the parents' sketches.
{{< /lemma >}}

{{< proof >}}
$c_t(b) = \sum_i s_{t,i}\, c_{p_i}(b)$ by {{< eqref "eq:recurrence" >}}. A term with
$s_{t,i}\, c_{p_i}(b) > 0$ has $b$ in the support of $C_{p_i}$, which is contained in
$S_{p_i} \subseteq S_t$ (in $S^+_{p_i} \subseteq S^+_t$ under `pos`, since
$s_{t,i} > 0$), so $b \in K_k(S_{p_i})$ by {{< xref "lem:kmv-sub" "full" >}}: every
nonzero term is held by the corresponding parent's sketch, and by induction with its
exact weight.
{{< /proof >}}

{{< remark >}}
{{< xref "lem:kmv-sub" "full" >}} is the property `coord` lacks. Its rank $u_b / v$ uses
the weight, which changes from parent to child, so a block can rank below the child's
merged threshold and outside a parent's sketch: in {{< xref "ex:overlap" "full" >}}
block $b_2$ ranks 0.8 in $D$, inside the merged threshold $0.889$, and 4 in $A$, outside
$A$'s sketch, so its share from $A$ is unknown. Ranks that depend on the block alone
keep the lemma, and so would block-level priorities $u_b / g(b)$ for any *fixed*
function $g$ of the block: a sample weighted by a prior rather than by the colour, which
§12 leaves open.
{{< /remark >}}

The exact weights were not shipped.{{< sidenote >}}The design-phase prototype stored
them and, summing in the exact store's order, matched the exact colour bit for bit on
the kept blocks (14,219 sampled records of the first 3M, four values of $k$: maximum
difference 0). As an estimator of $J_w$, though, a uniform sample of the support misses
the few heavy recent blocks that hold most of the mass: the ratio
$\sum_K \min / \sum_K \max$ over the kept blocks was biased upward by 0.051, 0.030 and
0.015 at $k = 64$, 256 and 1024 for pairs with $J_w \ge 0.9$. Weights also double the
memory. §10.6 has a better tool for $J_w$.{{< /sidenote >}} The store keeps ranks only.

| | `kmv` store |
| :--- | :--- |
| rank | a Fisher–Yates permutation of $[0, 2^{20})$, seeded, 8 MiB of tables per seed (both directions) |
| why a finite permutation | the count is then exactly unbiased in the model actually run, and it can be restricted to the blocks a support can hold (§10.4) |
| an entry | 4 bytes (a `u32` rank); the block is the inverse permutation of the rank |
| a sketch | at most $k$ ranks plus the *full* bit, behind an `Rc` of about 40 bytes |
| a record of $G$ distinct parents | $O(Gk)$ by a balanced tree of two-pointer merges, each capped at $k$; one parent costs a reference-count bump |
| error added by the recursion | none: every sketch is the one-shot $K_k$ of its support |
| limit | blocks below $2^{20}$; a larger block is a hard error naming `:bits=` |
{#tab:kmv caption="The coordinated bottom-k of the support, as stored by the kmv store."}

### 10.4 Counting {#sec:kmv-count}

{{< proposition note="KMV over a finite universe" label="prop:kmv-count" >}}
Let $V$ be a set of $N$ blocks fixed independently of $\rho$, $S \subseteq V$ with
$n = \lvert S \rvert$, and $k \ge 2$. If the sketch is not full,
$\hat n = \lvert K_k(S) \rvert = n$. If it is full, let $R$ be the number of blocks of
$V$ ranked below the $k$-th smallest rank of $S$ (the 0-based position of that rank
among the ranks of $V$). Then $\hat n = (k - 1) N / R$ satisfies
$\mathbb{E}[\hat n] = n$ exactly, and $(k - 1)(k - 2) N (N - 1) / (R (R - 1))$ is an
unbiased estimate of $n(n - 1)$ for $k \ge 3$.
{{< /proposition >}}

{{< proof >}}
The restriction of a uniform permutation of $[0, M)$ to $V$ orders $V$ uniformly at
random, so the positions of $S$ among the $N$ positions of $V$ are a uniformly random
$n$-subset of $\{0, \dots, N - 1\}$, and $R$ is its $k$-th smallest element. Choosing
$k - 1$ positions below $r$ and $n - k$ above,

$$
\Pr(R = r) = \binom{r}{k-1}\binom{N-1-r}{n-k} \Big/ \binom{N}{n}, \qquad k - 1 \le r \le N - n + k - 1 .
$$

Since $\frac{k-1}{r}\binom{r}{k-1} = \binom{r-1}{k-2}$,

$$
\mathbb{E}\Big[\frac{k-1}{R}\Big] = \sum_r \binom{r-1}{k-2}\binom{N-1-r}{n-k} \Big/ \binom{N}{n} = \binom{N-1}{n-1} \Big/ \binom{N}{n} = \frac{n}{N},
$$

where the middle sum counts the $(n-1)$-subsets of an $(N-1)$-set by the position
$r - 1$ of their $(k-1)$-th smallest element. Multiplying by $N$ gives
$\mathbb{E}[\hat n] = n$. In the same way
$\frac{(k-1)(k-2)}{r(r-1)}\binom{r}{k-1} = \binom{r-2}{k-3}$, and the sum of
$\binom{r-2}{k-3}\binom{N-1-r}{n-k}$ is $\binom{N-2}{n-2}$, which gives
$\mathbb{E}\big[\frac{(k-1)(k-2)}{R(R-1)}\big] = \frac{n(n-1)}{N(N-1)}$.
($R \ge k - 1 \ge 1$ throughout.)
{{< /proof >}}

Write $\hat n_V$ for this estimator. Then, for $k \ge 3$,
$\hat n_V^2 - \hat n_V - (k-1)(k-2)N(N-1)/(R(R-1))$ is an unbiased estimate of
$\operatorname{Var}(\hat n_V)$, since $n(n - 1) + n = n^2$. The variance itself has no
closed form, though it is a finite sum over the law of $R$; it is about

$$
\operatorname{Var}(\hat n_V) \approx \frac{n(n - k + 1)}{k - 2} \cdot \frac{N - n}{N - 1},
$$

the continuous-hash value of §1.2.1 times the finite-population factor (§1.2.1 writes
$N$ for the set size and $M$ for the universe). The approximation slightly overstates
it: summed exactly over the law of $R$, for $n/N \le 0.9$ the variance is below it by
under 1% at $k \ge 256$, under 3% at $k = 64$ and up to 11.5% at $k = 16$. The seed
tests of §10.8 check it on the chain.

The proposition leaves the universe $V$ free, and the choice matters. The textbook
choice is the whole permutation, $V = [0, M)$, with $R$ the $k$-th smallest rank itself:
$\hat n_M = (k - 1)M/R$. But every block of $S_t$ is at most $\beta_t$, the newest block
seen up to record $t$ (the record's own block, on a chain read in block order), and
$\beta_t$ is a function of the chain, not of $\rho$. So $V = [0, \beta_t]$ is a valid
universe with $N = \beta_t + 1$, and $R_t$, the number of blocks $b \le \beta_t$ ranked
below the $k$-th smallest rank of $S_t$, gives

$$
\hat n = \frac{(k - 1)(\beta_t + 1)}{R_t},
$$

exactly unbiased as well and never above $\beta_t + 1$. Supports on this chain are dense
in their universe: the supports of records 3,000,000 and 31,187,785 cover 70% and 84% of
$[0, \beta_t]$, so at the latter the finite-population factor is about 0.16 where $M$'s
is 0.78. In the deepest stratum of the first 31.2M records (supports of 131,072 to
262,144 blocks) the theory RSE at $k = 1024$ is 0.0144 for $\hat n$ against 0.0283 for
$\hat n_M$: half the error, the gain a $k$ nearly four times larger would bring. The
measured RMS over 16 seeds is 0.0152 against 0.0266, 57% of the error, the gain of a $k$
about three times larger. $R_t$ costs one query of a Fenwick tree over rank space per
full record, into which the blocks are inserted as the chain's newest block advances
(§10.7). Both estimates are written; $\hat n$ is the primary one.

### 10.5 Jaccard, containment and unions {#sec:kmv-pairs}

For two transactions with supports $A$ and $B$ and sketches $K_k(A)$, $K_k(B)$:

{{< proposition note="Jaccard" label="prop:kmv-jaccard" >}}
If neither sketch is full, $J(A, B)$ is computed exactly from the two stored sets. If one
is, let $K = K_k\big(K_k(A) \cup K_k(B)\big)$ and
$X = \lvert K \cap K_k(A) \cap K_k(B) \rvert$, and put $\hat J = X / k$. Then $X$ is
hypergeometric with population $n_u = \lvert A \cup B \rvert$, $\lvert A \cap B \rvert$
successes and $k$ draws, so $\mathbb{E}[\hat J] = J$ and

$$
\operatorname{Var}(\hat J) = \frac{J(1 - J)}{k} \cdot \frac{n_u - k}{n_u - 1} \le \frac{1}{4k}.
$$

{{< /proposition >}}

{{< proof >}}
A sketch that is not full is its whole support. If one is full, $n_u > k$, and
$K = K_k(A \cup B)$ by {{< xref "lem:kmv-union" "full" >}}; since $A \cup B$ is fixed
and $\rho$ uniform, $K$ is a uniformly random $k$-subset of $A \cup B$. By
{{< xref "lem:kmv-sub" "full" >}}, an element of $K$ is in $K_k(A)$ if and only if it is
in $A$, and likewise for $B$, so $X = \lvert K \cap A \cap B \rvert$: the number of
successes among $k$ draws without replacement. Its mean is $k J$ and its variance
$k J (1 - J)(n_u - k)/(n_u - 1)$.
{{< /proof >}}

When neither sketch is full but their union exceeds $k$, the textbook formula over $K$
is still an estimate (it deviated by up to 0.0035 in the design-phase prototype); the
exact value is in hand, so it is used. In the `even` selection of §10.8, 208,335 of the
499,500 pairs have both sketches whole at $k = 1024$ and are computed exactly; in 57 of
them the union exceeds $k$, where the textbook formula would have been an estimate.
Neither estimator uses everything: both sketches are complete below the smaller of their
two thresholds, so the union is known there, with between $k$ and $2k$ elements, which
could lower the variance for small $J$.{{< sidenote >}}Cohen and Kaplan's estimators
for bottom-$k$ sketches use such samples, which hold more than the $k$ smallest of the
union.{{< cite "cohen2007summarizing" >}}{{< /sidenote >}}

The **union count** $\lvert A \cup B \rvert$ is exact when neither sketch is full (the
union is then in hand, whatever its size). Otherwise it is the count of
$K = K_k(A \cup B)$, which the proof above has in hand, by
{{< xref "prop:kmv-count" "full" >}} with the pair's universe
$N = \max(\beta_A, \beta_B) + 1$: exactly unbiased. The **intersection**
$\hat J \cdot \hat n_u$ is a product of dependent estimates: consistent, not unbiased.

The **containment** of $A$ in $B$, $\lvert A \cap B \rvert / \lvert A \rvert$, is read
from the part of $A$'s sketch that $B$'s sketch can vouch for. Let $\tau_B$ be the
$k$-th smallest rank of $B$ when $B$'s sketch is full and $+\infty$ otherwise, let
$T = \{x \in K_k(A) : \rho(x) \le \tau_B\}$, and estimate the containment by
$\lvert T \cap K_k(B) \rvert / \lvert T \rvert$. $T$ is the set of elements of $A$
ranked at most $\min(\tau_A, \tau_B)$, and for each of them membership in $B$ is exact,
because $B$'s sketch holds every element of $B$ up to $\tau_B$. So the estimate is a
ratio over a random subset of $A$ whose memberships are known exactly: consistent. It is
not unbiased, because $\tau_B$ depends on the ranks of $B$, and with them on those of
$A \cap B$; in particular the element at $\tau_B$ belongs to $B$, so when it is in $T$
it is a sure hit. That biases the ratio up by about $c(1 - c)/k$ for a containment $c$:
0.004 at $k = 64$ in a simulation, and at most 0.00025 at $k = 1024$. With a strict
threshold, $\rho(x) < \tau_B$, the same simulation (20,000 permutations per case) showed
no bias within its standard error. The code keeps $\le$: at $k = 1024$ its bias is far
below every error measured in §10.8. The estimate is undefined when $T$ is empty, which
happens when $A$ is much smaller than $B$: $A$ then has few elements below $\tau_B$,
about $k \lvert A \rvert / \lvert B \rvert$ on average. `pairs` writes the size of $T$
beside every containment, and the ratio $\hat J \hat n_u / \hat n_A$ as a flagged
fallback.

### 10.6 Weighted similarity: a function of L1, and L1 has a linear sketch {#sec:l1}

The support's sketch says nothing about weights. The weighted Jaccard similarity needs a
different tool, and the shape of the colours makes it simple.

{{< lemma label="lem:jw-tv" >}}
For probability vectors $x$ and $y$, with $\mathrm{TV} = \tfrac12 \lVert x - y \rVert_1$,
$\sum_b \min(x_b, y_b) = 1 - \mathrm{TV}$ and $\sum_b \max(x_b, y_b) = 1 + \mathrm{TV}$,
so

$$
J_w(x, y) = \frac{1 - \mathrm{TV}}{1 + \mathrm{TV}} .
$$

{{< /lemma >}}

{{< proof >}}
Coordinate by coordinate $\min + \max = x_b + y_b$ and
$\max - \min = \lvert x_b - y_b \rvert$. Summing, $\sum \min + \sum \max = 2$ and
$\sum \max - \sum \min = 2\,\mathrm{TV}$.
{{< /proof >}}

So $J_w$ of two colours depends on their L1 distance alone, and L1 distance has a
*linear* sketch: random projections by a 1-stable law, the Cauchy
distribution.{{< cite "indyk2006stable" >}} Let $\Pi$ be an $m \times M$ matrix of
independent standard Cauchy draws $\Pi_{jb}$, one column per block, drawn once per run
(coordinated, like $\rho$), and let the `l1` store keep $v(C) = \Pi\,C \in \mathbb{R}^m$
for every colour.

{{< proposition note="the projection commutes with the recurrence" label="prop:l1-linear" >}}
Fold $v$ through the driver: a coinbase of block $\beta$ is the column
$(\Pi_{j\beta})_j$; a record groups its operands by parent, skipping those of share 0,
with $q_g$ the parent of group $g$ and $\bar s_g = \sum_{i : p_i = q_g} s_{t,i}$ its
summed share, answers the parent's own vector when one group is left, and otherwise
stores $\sum_g \bar s_g\, v_{q_g}$. Then in exact arithmetic $v_t = \Pi\,C_t$ for every
record $t$, at any depth.
{{< /proposition >}}

{{< proof >}}
By induction in file order: a coinbase of block $\beta$ has the colour $e_\beta$, all
its mass on $\beta$, and $\Pi\,e_\beta$ is column $\beta$; otherwise
$\sum_g \bar s_g\, \Pi\,C_{q_g} = \Pi \sum_i s_{t,i}\, C_{p_i} = \Pi\,C_t$ by
linearity, where grouping only reassociates the sum, share-0 operands contribute 0, and
one group has $\bar s_g = 1$ and $C_t = C_{q_g}$.
{{< /proof >}}

There is no reduction, no $k$, no per-record randomness: the only error is floating
point. The fold accumulates in `f64` in group order and stores `f32` (or `f64`); on the
first 3M records the stored vector matched $\Pi\,C_t$ computed from the exact colour to
$6.8 \times 10^{-7}$ relative in `f32` and $5.7 \times 10^{-14}$ in `f64` (§10.8).

For two fixed colours $x$ and $y$, which are functions of the chain and independent of
$\Pi$, the differences $d_j = v_j(x) - v_j(y) = \sum_b \Pi_{jb}(x_b - y_b)$ are
independent over $j$ and, by 1-stability, each is Cauchy with scale
$\sigma = \lVert x - y \rVert_1 = 2\,\mathrm{TV}$. The scale is estimated by maximum
likelihood, one of the estimators of a Cauchy scale that Li, Hastie and Church
compare:{{< cite "li2007nonlinear" >}} the log-likelihood
$\sum_j \big[\ln \sigma - \ln(\sigma^2 + d_j^2)\big]$ is stationary where

$$
\sum_{j=1}^{m} \frac{\sigma^2}{\sigma^2 + d_j^2} = \frac{m}{2},
$$

whose left side increases from the number of zero $d_j$ to $m$, so the root
$\hat\sigma$ is unique (and $\hat\sigma = 0$ when at least half the $d_j$ are 0, as for
equal colours). The Fisher information of a Cauchy scale is $1/(2\sigma^2)$ per
observation, so $\hat\sigma$ has relative SD about $\sqrt{2/m}$: 0.0625 at $m = 512$,
0.0442 at $m = 1024$. The estimates are
$\widehat{\mathrm{TV}} = \hat\sigma/2$ and
$\hat J_w = (1 - \min(\widehat{\mathrm{TV}}, 1))/(1 + \min(\widehat{\mathrm{TV}}, 1))$,
whose SD is, by the delta method, about
$2\,\mathrm{TV}/(1 + \mathrm{TV})^2 \cdot \sqrt{2/m}$, at most $\tfrac12\sqrt{2/m}$
(0.022 at $m = 1024$). The mean of $\lvert d_j \rvert$ would be the obvious estimator and
has no expectation at all; the median is consistent but has relative SD
$\pi/(2\sqrt m)$, 11% more than the MLE.

The clipping leaves a **floor**. For disjoint colours ($\mathrm{TV} = 1$, $J_w = 0$),
$\widehat{\mathrm{TV}} \approx 1 + \varepsilon$ with $\varepsilon$ about normal with SD
$\sqrt{2/m}$, and $\hat J_w \approx \max(-\varepsilon, 0)/2$, whose mean is

$$
\mathbb{E}[\hat J_w] \approx \frac{\sqrt{2/m}}{2\sqrt{2\pi}} :
$$

0.0176, 0.0125 and 0.0088 at $m = 256$, 512 and 1024. Pairs with $J_w$ below a few
hundredths cannot be resolved one by one; the unclipped $\widehat{\mathrm{TV}}$ is
written beside $\hat J_w$ for averages over many pairs. On the prefix, where the median
$J_w$ of deep pairs across time is $1.4 \times 10^{-4}$ (§10.1), a weighted map would
show only the floor. Over the whole chain it would not (§10.9: only a fifth of the pairs
lie below the floor), but there the maps are drawn for windows of a few blocks, where
$J$ is near 1 and $J_w$ is what tells transactions apart.

Why a linear sketch and not a weighted MinHash? Consistent weighted
sampling{{< cite "manasse2010consistent,ioffe2010improved" >}} and P-MinHash, the
sampler of Moulton and Jiang,{{< cite "moulton2018maximally" >}} make two vectors'
samples collide with a probability equal to a weighted similarity, and their samples
are coordinated, as `coord`'s are. But a colour is a *sum* of its parents' colours, and
for the simplest of these samplers no merge exists.

{{< proposition note="no merge under sums, for priority ranks" label="prop:no-sum-merge" >}}
Let the sample of a nonnegative vector $x$ be $\mathrm{sk}(x) = (b^*, r_{b^*})$, with
ranks $r_b = E_b / x_b$ ($+\infty$ when $x_b = 0$) and $b^* = \arg\min_b r_b$, where the
$E_b$ are independent and identically distributed with a positive density on an interval
$(0, c)$: exponential for P-MinHash, uniform for priority sampling and for `coord`'s
$u_b / v$. Then no function $f$ satisfies
$\mathrm{sk}(\tfrac12 x + \tfrac12 y) = f(\mathrm{sk}(x), \mathrm{sk}(y))$ almost surely
for all probability vectors $x, y$.
{{< /proposition >}}

{{< proof >}}
Over four blocks take $x = (\tfrac12, \tfrac12, 0, 0)$,
$x' = (\tfrac12, 0, 0, \tfrac12)$ and $y = (0, \tfrac12, \tfrac12, 0)$, and the event
$E_1 < E_2$, $E_1 < E_4$, $E_3 < E_2$, $E_2 < 2\min(E_1, E_3)$, which has positive
probability (it is open and holds at $E \propto (1, 1.5, 1.1, 2)$, scaled into
$(0, c)$). On it $\mathrm{sk}(x) = \mathrm{sk}(x') = (1, 2E_1)$ and
$\mathrm{sk}(y) = (3, 2E_3)$. But $\tfrac12(x + y) = (\tfrac14, \tfrac12, \tfrac14, 0)$
has ranks $(4E_1, 2E_2, 4E_3, \infty)$ and sample block 2, while
$\tfrac12(x' + y) = (\tfrac14, \tfrac14, \tfrac14, \tfrac14)$ has ranks $4E_b$ and a
sample block other than 2, since $E_1 < E_2$. The same inputs to $f$ require two
different outputs.
{{< /proof >}}

Samples of $k$ follow on the same event intersected with one on which $k - 1$ further
blocks, shared by all three vectors, have ranks small enough to fill the first $k - 1$
places. The proposition is about this class only, ranks $E_b / x_b$; consistent weighted
sampling as Ioffe defines it ranks by a randomised step function of $x_b$, also
nonincreasing in $x_b$, and is not covered by the proof. The same samplers do compose
under the coordinate-wise **maximum**: the rank of $b$ in $\max(x, y)$ is
$E_b / \max(x_b, y_b) = \min(E_b/x_b, E_b/y_b)$, so the bottom-$k$ of $\max(x, y)$ is the
bottom-$k$ of the two samples merged. A union is a maximum of indicator vectors, and the
support of a positive mixture is the support of the maximum, which is why the KMV of
the support folds exactly and the weighted samples do not. Linearity is what survives
the sum.

### 10.7 Implementation {#sec:kmv-impl}

Both stores are `Algebra`s of their own, each on its own thread and fed by the same
parse as every other store (§7.9); the `SKETCH01` format, the production file and the
`varopt` code are untouched, and the old modes write byte-identical output. That was
checked during the implementation against two references: the build of the commit
before the stores (`f09847c`), on `emit`, `decode`, `eval`, `chain`, `check` and the
first 300 MB of the production file's `decode`; and the binary of the section-8 sweep, on
`chain`, an `emit` of 1M records and the first 1,000,000 records of the production
file's `decode`. With the final binary, the one of every run below, the `emit` and
`eval` checks were repeated.

The permutation is a Fisher–Yates shuffle{{< cite "knuth1997taocp2" >}} driven by the
hash of §7.3, built once per seed and shared by every store of that seed:

```rust
pub fn new(seed: u64, bits: u32) -> Perm {
    // …
    let m = 1usize << bits;
    let mut fwd: Box<[u32]> = (0..m as u32).collect();
    for i in (1..m).rev() {
        let j = (h3(seed, SALT_KMV, i as u64, 0) % (i as u64 + 1)) as usize;
        fwd.swap(i, j);
    }
    let mut inv = vec![0u32; m].into_boxed_slice();
    for (b, &r) in fwd.iter().enumerate() {
        inv[r as usize] = b as u32;
    }
    Perm { bits, seed, fwd, inv }
}
```

The modulo bias of each swap is below $M / 2^{64}$. A Feistel network would also be a
bijection and needs no table, but even with ideal round functions it is not a uniform
permutation, and both counts of §10.4 are proved exactly unbiased under one;
Fisher–Yates with ideal swaps is exactly uniform.

The capped merge of two ascending runs of ranks stops as soon as it holds $k$:

```rust
/// `K_k(a u b)` of two ascending runs into `out` (cleared first), equal ranks
/// once; answers whether anything was left over, i.e. whether the union has
/// more than `k` elements.  It stops as soon as `out` holds `k`.
pub fn merge_cap(a: &[u32], b: &[u32], k: usize, out: &mut Vec<u32>) -> bool {
    out.clear();
    out.reserve(k.min(a.len() + b.len()));
    let (mut i, mut j) = (0, 0);
    while i < a.len() && j < b.len() {
        if out.len() == k {
            return true;
        }
        let (x, y) = (a[i], b[j]);
        if x < y {
            out.push(x);
            i += 1;
        } else if y < x {
            out.push(y);
            j += 1;
        } else {
            out.push(x);
            i += 1;
            j += 1;
        }
    }
    let rest = if i < a.len() { &a[i..] } else { &b[j..] };
    let room = k - out.len();
    if rest.len() > room {
        out.extend_from_slice(&rest[..room]);
        true
    } else {
        out.extend_from_slice(rest);
        false
    }
}
```

and a record is {{< xref "thm:kmv-dag" "full" >}} in code. `union_cap` runs a balanced
tree of `merge_cap`s, or a heap from 2,048 groups on; supports here are nested, so the
parents' sketches nearly coincide and the heap, which pops every duplicate, was slower
than the tree below that (measured over the first 15M records at $k = 1024$: 106 s of
store time with a heap from 3 groups, 26–28 s with the tree).

```rust
fn record(&mut self, ops: &[(KHandle, f64)], rec: u64) -> KHandle {
    self.group(ops);
    assert!(!self.groups.is_empty(), "record {} has no operand with a say in its support", rec);
    if self.groups.len() == 1 {
        // The union of one set with itself: the parent's own sketch.
        return Rc::clone(&ops[self.groups[0]].0);
    }
    let groups = &self.groups;
    let any_full = groups.iter().any(|&i| ops[i].0.full);
    let k = self.spec.k;
    let cut = union_cap(groups.len(), |g| &ops[groups[g]].0.r, k, &mut self.out, &mut self.scratch);
    if cut {
        self.work.reductions += 1;
    }
    let full = any_full || cut;
    debug_assert!(self.out.len() <= k && (!full || self.out.len() == k));
    Kmv::new(self.out.as_slice().into(), full)
}
```

`group` collects the operands by `Rc` pointer, as `Sketcher::group` does (§7.5), and
under `pos` skips those of share 0. The restricted rank $R_t$ of §10.4 comes from a
Fenwick tree over rank space, grown block by block as the chain's newest block advances,
so a whole run costs one insertion per block and one query per full record:

```rust
pub fn grow(&mut self, n: u64) {
    while self.n < n {
        let r = self.perm.rank(u32::try_from(self.n).expect("a block id fits in a u32")) as usize;
        let mut i = r + 1;
        while i < self.tree.len() {
            self.tree[i] += 1;
            i += i & i.wrapping_neg();
        }
        self.n += 1;
    }
}

/// How many inserted blocks rank strictly below `r`.
#[inline]
pub fn below(&self, r: u32) -> u64 {
    let mut i = r as usize;
    let mut s = 0u64;
    while i > 0 {
        s += self.tree[i] as u64;
        i &= i - 1;
    }
    s
}

// …

#[inline]
pub fn count_full(k: usize, n_univ: u64, below: u64) -> f64 {
    (k as f64 - 1.0) * n_univ as f64 / below.max(1) as f64
}
```

All pair estimates come from one merge walk over the two sketches, which reads
membership off each side ({{< xref "lem:kmv-sub" "full" >}}), counts the first $k$
distinct ranks for the Jaccard similarity, and every rank for the containments:

```rust
pub fn pair_raw(a: View, b: View, k: usize) -> PairRaw {
    let exact = !a.full && !b.full;
    let (ta, tb) = (a.rk().unwrap_or(u32::MAX), b.rk().unwrap_or(u32::MAX));
    let mut p = PairRaw { exact, ..PairRaw::default() };
    let (mut i, mut j) = (0, 0);
    let mut taken = 0usize;
    while i < a.r.len() || j < b.r.len() {
        // … the next rank `v` of the union, and whether it is in `a` and in `b`
        if exact || taken < k {
            taken += 1;
            p.union += 1;
            if in_a && in_b {
                p.inter += 1;
            }
            if !exact && taken == k {
                p.union_rk = Some(v);
            }
        }
        if in_a && v <= tb {
            p.t_ab += 1;
            p.hit_ab += in_b as u64;
        }
        if in_b && v <= ta {
            p.t_ba += 1;
            p.hit_ba += in_a as u64;
        }
    }
    // …
    p
}
```

`pair_est` turns these into $\hat J$ (`inter / union` when exact, `inter / k`
otherwise), its hypergeometric SE, the intersection and the two containments, NaN when
their sample is empty.

The `l1` store's record is the sum of {{< xref "prop:l1-linear" "full" >}}, with the
shares of repeated parents added first:

```rust
fn record(&mut self, ops: &[(LHandle, f64)], rec: u64) -> LHandle {
    self.group(ops);
    assert!(!self.groups.is_empty(), "record {} has no operand with a positive share", rec);
    if self.groups.len() == 1 {
        return Rc::clone(&ops[self.groups[0].0].0);
    }
    self.acc.iter_mut().for_each(|a| *a = 0.0);
    for &(i, s) in &self.groups {
        match &*ops[i].0 {
            Vector::F32(v) => {
                for (a, &x) in self.acc.iter_mut().zip(v.iter()) {
                    *a += s * x as f64;
                }
            }
            Vector::F64(v) => {
                for (a, &x) in self.acc.iter_mut().zip(v.iter()) {
                    *a += s * x;
                }
            }
        }
    }
    stored(&self.acc, self.spec.prec)
}
```

A coinbase is $m$ draws `tan(pi (u - 1/2))` with `u = unit(h3(seed, SALT_L1, b, j))`,
always finite since `unit` is strictly inside $(0, 1)$ (§7.3). The scale MLE solves its
equation by Newton's method on $\ln \sigma$, started at the median of $\lvert d_j \rvert$
and safeguarded by a bisection bracket, so heavy Cauchy tails cannot throw it off:

```rust
pub fn cauchy_scale_mle(d: &[f64]) -> f64 {
    let m = d.len();
    // …
    let half = m as f64 / 2.0;
    let mut a: Vec<f64> = d.iter().map(|x| if x.is_finite() { x.abs() } else { f64::INFINITY }).collect();
    let zeros = a.iter().filter(|&&x| x == 0.0).count();
    if zeros as f64 >= half {
        return 0.0;
    }
    let mid = a.len() / 2;
    let med = *a.select_nth_unstable_by(mid, |x, y| x.total_cmp(y)).1;
    // f(t) = sum 1/(1 + (a/s)^2) - m/2, f'(t) = sum 2 q (1 - q).
    let f = |t: f64| -> (f64, f64) {
        let inv = (-t).exp();
        let (mut v, mut dv) = (0.0f64, 0.0f64);
        for &x in &a {
            let r = x * inv;
            let q = 1.0 / (1.0 + r * r);
            v += q;
            dv += 2.0 * q * (1.0 - q);
        }
        (v - half, dv)
    };
    // … t = ln med; a bracket [lo, hi] with f(lo) < 0 < f(hi)
    for _ in 0..200 {
        let (v, dv) = f(t);
        if v == 0.0 {
            break;
        }
        if v < 0.0 {
            lo = t;
        } else {
            hi = t;
        }
        let mut next = t - v / dv;
        if !(dv > 0.0) || !(next > lo && next < hi) {
            next = 0.5 * (lo + hi);
        }
        let done = (next - t).abs() <= 1e-12 || (hi - lo) <= 1e-12;
        t = next;
        if done {
            break;
        }
    }
    t.exp()
}
```

**Modes.** Three modes use the stores, and `eval` and `decode` learn them:

- **`count`** folds one store per `--kmv` and writes every record's count as a
  fixed-width stream, comparing as it goes with the exact sizes of `--sets-counts`
  where they exist. A whole sketch whose length is not the exact size, a full sketch of
  a support of at most $k$, or a whole sketch of a larger one fails the run. It folds no
  colour, so it costs the parse and a capped merge per record.
- **`pick`** folds any stores once (`--config`, `--kmv`, `--l1`, and the exact store
  with `--exact` on a prefix) and dumps the sketches of the records listed in a
  selection file. Which records are worth comparing (deep ones, a window, an even
  spread) is known only after a `count` run, so selection is a second pass, and
  sketches of every record are never stored: at $k = 1024$ they would be about 3.2 TB.
- **`pairs`** reads a `pick` directory and computes every pair of each group, by every
  measure it finds, with the exact values beside them when the exact store was dumped;
  it writes a long table and a square matrix per group and measure, byte-identical at
  any thread count.
- **`eval --kmv/--l1`** checks the sketches against the exact store on a prefix, and
  **`decode`** reads a count stream; with `--select` it cuts the records of a selection
  out of a `SKETCH01` file, which is how the production `varopt` sketches of selected
  records are read without a new fold.

The count stream (`kmv.rs`):

```text
header (48 B): "KMVCNT01" | u32 version=1 | u32 k | u64 seed | u8 support (0 sets, 1 pos)
               | u8 bits | u16 0 | u32 0 | u64 M | u64 0
record (20 B): u64 tx | u32 block | u32 m | u32 rk
               m  = len, with bit 31 set when full
               rk = the 0-based k-th smallest rank when full, else 0
trailer:       "KMVEND01" | u64 records | u64 sum of (tx ^ m ^ (rk << 32)), wrapping
```

Record $i$ is at byte $48 + 20i$; its field `m` is the sketch's length, not the
dimension $m$ of §10.6. Both counts are lossless from it: the header's seed and bits
rebuild the permutation, and the running maximum of `block` is the universe of §10.4.

The commands that were run (`$K` and `$L` are lists of `--kmv` and `--l1` specs):

```text
# R1 and R2, concurrently: k = 64, 256, 1024 at seeds 1..16
K=""; for k in 64 256 1024; do for s in $(seq 1 16); do K="$K --kmv $k:seed=$s"; done; done
sketch eval $K --kmv 1024:support=pos --l1 512 --l1 1024 --l1 1024:prec=f64 \
  --sets-counts finalBCUTXO_2022.sets-counts.31187785.txt --oracle lastspend-2022.u32 \
  --limit 3000000 --every 97 --l1-every 997 --metric-threads 32 --out R1-eval3m --stats < finalBCUTXO_2022.scm
sketch count $K --sets-counts finalBCUTXO_2022.sets-counts.31187785.txt --oracle lastspend-2022.u32 \
  --limit 31187785 --every 97 --zstd --out R2-count31m --stats < finalBCUTXO_2022.scm

# R3: the prefix selections from R2's seed-1 stream, one fold with the exact store, then all pairs
#   $K: k = 1024 at seeds 1..16, k = 128, 512, 2048 at seeds 1..4
#   $L: m = 1024 at seeds 1..8, m = 256, 512 at seeds 1..4
python3 select.py prefix --bin sketch --counts R2-count31m/counts.kmv-k1024-s1-sets.bin.zst \
  --sc finalBCUTXO_2022.sets-counts.31187785.txt --limit 3000000 --out sel/prefix
sketch pick --select sel/prefix.txt --config varopt:512 $K --kmv 1024:support=pos $L --l1 1024:prec=f64 \
  --exact --oracle lastspend-2022.u32 --limit 3000000 --out R3-pick3m --stats < finalBCUTXO_2022.scm
sketch pairs --in R3-pick3m --out R3-pairs3m --threads 64
# R3b: more seeds on the same selection (k = 1024 seeds 17..64, k = 128, 512, 2048 seeds 5..16),
#   no exact fold: pairs reuses R3's exact.bin

# R4: the whole chain
sketch count --kmv 1024 --kmv 1024:seed=2 --kmv 1024:seed=3 --kmv 256 --kmv 1024:support=pos \
  --sets-counts finalBCUTXO_2022.sets-counts.31187785.txt --oracle lastspend-2022.u32 \
  --limit all --every 4001 --zstd --out R4-countall --stats < finalBCUTXO_2022.scm

# R5 to R7: the whole-chain selections from R4's seed-1 stream, one fold, the production
# varopt sketches of the same records, and all pairs
python3 select.py chain --bin sketch --counts R4-countall/counts.kmv-k1024-s1-sets.bin.zst --out sel/chain
sketch pick --select sel/chain.txt --kmv 1024 --kmv 1024:seed=2 --kmv 1024:seed=3 \
  --l1 1024 --l1 1024:prec=f64 --l1 512:seed=2 --kmv 1024:support=pos \
  --oracle lastspend-2022.u32 --limit all --out R5-pickall --stats < finalBCUTXO_2022.scm
# (--long=27 is redundant: as section 9 says, a plain zstd -d reads the production file)
zstd -dc --long=27 < colors.sketch-varopt512.zst | sketch decode --select sel/chain.txt > varopt512.sel.txt
sketch pairs --in R5-pickall --varopt-text varopt512.sel.txt --out R7-pairsall --threads 64
```

### 10.8 Results on the first 3M and 31.2M records {#sec:kmv-results}

Four runs on prefixes of the chain, where exact answers exist, with the binary of §10.7
(139 tests passing):

- **R1** (`eval`, the first 3M records, every 97th record, 30,928 records): 49 KMV
  stores ($k = 64, 256, 1024$ at 16 seeds each under `sets`, and $k = 1024$ under
  `pos`) and three L1 stores against the exact store.
- **R2** (`count`, the first 31,187,785 records, all of them): 48 KMV stores
  ($k = 64, 256, 1024$ at 16 seeds) against the exact sizes.
- **R3** (`pick` and `pairs`, the first 3M records): three selections, with the exact
  store, `varopt:512` and L1 stores beside the KMV ones. `deep`: records with supports
  of at least 1,024 blocks, one for each of 256 target blocks evenly spaced from the
  first such record's block, 44,006, to block 178,609; each target takes such a record
  of its own block or of the next block that has one (118 moved), and the last target
  found none left after the `window` had taken the last deep records: 255 records in
  blocks 44,006 to 178,081, 32,385 pairs. `window`: the last 256 such records before
  record 3M, records 2,999,685 to 2,999,999 in blocks 178,608 to 178,610, 32,640 pairs.
  `even`: 1,000 records evenly spaced over the 3M, with no depth condition, 499,500
  pairs. **R3b** added seeds on the same selection, so that $k = 1024$ has 64 seeds and
  $k = 128, 512, 2048$ have 16.

Within one run every record and every pair shares one permutation (or one projection),
so their errors are correlated: within a 10M-record bucket, the error of a count is
mostly one offset shared by all its records. A per-run spread across records says
nothing about the estimator; **seeds are the unit** of every bias and variance claim
below. A bias test is Student's $t$ over the seeds' means, Bonferroni-corrected for the
strata tested; a variance test compares the mean over records of each record's variance
*across seeds* with the theory, inside the $\chi^2$ band that would hold even if all the
records of a stratum moved together.

**Exactness.** In R1 every one of the 49 stores' 30,928 sampled sketches was compared
with the bottom-$k$ of the exact support, ranked by the same permutation: 1,515,472
comparisons, **0 mismatches**, and *full* was set exactly when the support exceeded $k$.
The exact store's support size equalled the `--sets` size on all 30,928 records. In R2
every whole sketch had exactly the reference size: 4,615,915, 4,715,656 and 4,792,897
records at $k = 64$, 256 and 1024, for every seed, and no full sketch had a support of
$k$ or fewer blocks. The L1 projection matched $\Pi\,C_t$ from the exact colour on 3,010
records with a worst deviation per coordinate, relative to
$\sum_b \lvert \Pi_{jb} \rvert c_t(b)$, of $5.1 \times 10^{-7}$ ($m = 512$, `f32`),
$6.8 \times 10^{-7}$ ($m = 1024$, `f32`) and $5.7 \times 10^{-14}$ ($m = 1024$, `f64`).
In R3, at every $k$, the pairs whose sketches were both whole had $\hat J$ equal to the
exact $J$ in every case: 208,335 `even` pairs at $k = 1024$ (and 190,653, 205,120 and
209,628 at $k = 128$, 512 and 2048), and 1,953 `deep` pairs at $k = 2048$.

**Counts.** All 184 seed gates of R2 (92 testable strata, bias and variance) passed, and
all 160 of R1. The largest $\lvert t \rvert$ in R2 was 2.08 ($k = 64$, $\hat n_M$,
supports of 8,192 to 16,384 blocks), against Bonferroni thresholds of 4.20 to 4.36; the
across-seed variance over theory ran from 0.57 to 1.49, inside bands of about
$[0.19, 2.76]$.

| $k$ | estimator | mean relative error, all full records | $t$ | RMS, deepest stratum | theory | ratio |
| ---: | :--- | ---: | ---: | ---: | ---: | ---: |
| 64 | $\hat n$ | $+0.0066 \pm 0.0117$ | 0.56 | 0.0549 | 0.0588 | 0.93 |
| 64 | $\hat n_M$ | $-0.0012 \pm 0.0212$ | $-0.06$ | 0.1009 | 0.1151 | 0.88 |
| 256 | $\hat n$ | $+0.0075 \pm 0.0060$ | 1.26 | 0.0269 | 0.0290 | 0.93 |
| 256 | $\hat n_M$ | $+0.0045 \pm 0.0151$ | 0.29 | 0.0667 | 0.0568 | 1.17 |
| 1024 | $\hat n$ | $+0.0019 \pm 0.0035$ | 0.55 | 0.0152 | 0.0144 | 1.05 |
| 1024 | $\hat n_M$ | $+0.0097 \pm 0.0055$ | 1.76 | 0.0266 | 0.0283 | 0.94 |
{#tab:count .fullwidth caption="R2, support=sets, the first 31,187,785 records, 16 seeds per k. Mean relative error of the count over every record whose support exceeds k (26.6M, 26.5M and 26.4M records), as the mean of the 16 seeds' means plus or minus the standard error across seeds, and its t. RMS: pooled over the 16 seeds, in the deepest stratum (supports of 131,072 to 262,144 blocks, 24,334,496 records), against the theory RSE of section 10.4 with each estimator's universe."}

The ratios are those of 16 draws of a stratum that moves as a whole within a run. One
seed's RMS over theory, in a stratum of more than 100,000 records, ranged from 0.22 to
3.08; pooled over 16 seeds, among the strata of more than 100,000 records the ratio left
$[0.85, 1.2]$ in a few (0.82–0.84 and 1.23 for $\hat n$ at $k = 64$, 0.75–0.79 for
$\hat n_M$ at $k = 1024$), all inside the variance bands. The figure below draws the
strata of $\lvert S \rvert / k$ with at least 1,000 records, among them some of fewer than
100,000, where the ratio reaches 1.24 for $\hat n$ at $k = 64$ (1.22 for $\hat n_M$) and
0.78 for $\hat n$ at $k = 1024$. A per-run accuracy band is not a test, and none is used.

{{< fig src="count-accuracy.svg" type="fullwidth" label="fig:count" alt="Three panels. Top left: pooled RMS relative error of the count against the support size over k, for k 64, 256 and 1024, with theory curves, for the restricted and the full-universe estimator. Top right: mean relative error of the restricted count with across-seed error bars, all near zero. Bottom: the median count per 10 million records over the whole chain, rising from about 130 to 710 thousand blocks, with its 10th and 90th percentiles, the exact quantiles on the first 31.2 million records, the most a count can be, and on a second axis the share of records counted exactly, 30 percent at first and under 2 percent after 60 million records." >}}
Counts against their exact sizes, then over the whole chain; `sets`. (a) and (b): the
first 31,187,785 records, 16 seeds per $k$, by stratum of $\lvert S \rvert / k$ (log 2),
strata with at least 1,000 records. (a) RMS relative error pooled over the seeds, with
$\pm 2$ standard errors across seeds, against the theory RSE of each estimator (lines):
the restricted $\hat n$ over $[0, \beta_t]$ (filled markers, solid lines) and $\hat n_M$
over $M = 2^{20}$ (hollow, dotted). (b) Mean relative error of $\hat n$, with $\pm 2$
standard errors across seeds. (c) R4, all 778,613,440 records, $k = 1024$, seed 1, per
10M records: the median $\hat n$ (dots) and its 10th and 90th percentiles (thin lines
and band), in thousands of blocks; the exact quantiles (crosses) in the three buckets
wholly inside the first 31.2M records; the median $\beta_t + 1$ (grey, dotted), the most
an $\hat n$ can be; and, on the right axis, the share of records whose sketch is whole
and counted exactly. Years along the top. Records of one seed share one permutation, so
their errors are correlated; the spread that counts is across seeds.
{{< /fig >}}

**Jaccard similarity.** No bias gate failed (0 of 52, groups $\times$ $k$ $\times$
strata of $J$). Pooled over seeds, the RMS error matches the hypergeometric SD of
{{< xref "prop:kmv-jaccard" "full" >}}, in the table below and in panels (a) and (b) of
{{< xref "fig:jerror" "full" >}}:

| selection | pairs, $0 < J < 1$ | $k$ (seeds) | largest $\lvert t \rvert$ | threshold | RMS / hypergeometric SD |
| :--- | ---: | :--- | ---: | ---: | :--- |
| `deep` | 31,969 | 128 (16) | 1.08 | 3.73 | 0.93–1.05 |
| | | 512 (16) | 0.82 | 3.73 | 0.89–1.04 |
| | | 1024 (64) | 2.37 | 3.23 | 0.98–1.03 |
| | | 2048 (16) | 0.99 | 3.73 | 0.93–1.01 |
| `window` | 29,749 | 128 (16) | 0.38 | 3.48 | 0.87–1.26 |
| | | 512 (16) | 2.22 | 3.48 | 0.94–1.29 |
| | | 1024 (64) | 2.21 | 3.05 | 0.83–1.02 |
| | | 2048 (16) | 2.06 | 3.48 | 0.81–0.86 |
| `even` | 200,021 | 128 (16) | 1.62 | 3.73 | 0.87–1.12 |
| | | 512 (16) | 1.79 | 3.73 | 0.87–1.13 |
| | | 1024 (64) | 2.20 | 3.23 | 0.94–1.03 |
| | | 2048 (16) | 1.52 | 3.73 | 0.92–1.02 |
{#tab:jaccard .fullwidth caption="R3 and R3b, support=sets, the first 3M records. Strata of the exact J: (0, 0.05], (0.05, 0.2], (0.2, 0.5], (0.5, 0.9], (0.9, 1); the window has no pairs below 0.2. Largest |t| of the across-seed bias test over the strata, with its Bonferroni threshold; range over the strata of the RMS error pooled over seeds, over the hypergeometric SD."}

The `window` is the exception, and it is a small one. Its 256 records have only 110
distinct support sizes, nested within three blocks, so a seed's error moves almost all
of its pairs together and the per-seed spread is heavy-tailed. Its stratum
$J \in (0.9, 1)$ came out at a ratio of 0.83 with 64 seeds (ratio squared
$0.70 \pm 0.07$); recomputed by brute force from the exact supports with 200 fresh seeds
on 3,000 of its 26,899 pairs, the ratio squared was $0.955 \pm 0.066$ (in batches of 50
seeds: 1.040, 1.027, 0.700, 1.053). The $k = 2048$ shortfall in the window (0.81–0.86
over 16 seeds) is within about two standard errors of its ratio as well. Within one seed
the fraction of pairs off by more than two hypergeometric SDs was mostly 2–6% per
stratum (extremes 0.7% and 12.5%, in the window's smallest strata).{{< sidenote >}}The
SE that `pairs` writes per pair is the plug-in
$\sqrt{\hat J(1 - \hat J)/k \cdot (\hat n_u - k)/(\hat n_u - 1)}$, which is 0 whenever
$\hat J$ is 0 or 1. Against it, 18.5% of the window's pairs and 24.8% of the even
selection's were off by more than two SEs (averages over the 16 seeds of R3); among the
pairs with a positive SE, 4.5% of `deep`, 1.1% of `window` and 3.8% of `even`. Coverage
should be judged against the true SD, as above.{{< /sidenote >}}

**Containment** of one support in another was defined for every pair of `deep` and
`window`, and for 73.1% and 86.4% of the ordered `even` pairs (older in newer, newer in
older): the undefined ones are small supports against large ones. Across 16 seeds at
$k = 1024$ no stratum showed a bias ($\lvert t \rvert \le 2.55$ against a threshold of
3.62); the RMS error per stratum was 0.002 to 0.016 in `deep` and `window`, and up to
0.131 in the `even` pairs whose containment lies in $[0.5, 0.9)$.

**Union counts** (the restricted universe of the pair) were unbiased in a separate check
with 32 seeds on 2.5M records: relative bias $-0.0026$ ($t = -0.82$) and RMS over theory
1.01 at $k = 1024$ on deep pairs. {{< xref "fig:jprefix" "full" >}} draws one seed's
$\hat J$ for the `deep` selection against the exact values.

{{< fig src="jaccard-prefix.svg" type="fullwidth" label="fig:jprefix" alt="For 255 deep transactions of the first 3M records in time order, 2010 to 2012: a strip of support sizes at the left; a matrix with the estimated Jaccard similarity below the diagonal and the exact one above, nearly mirror images; and a triangle of the estimation error below the diagonal, within a few hundredths, in stripes." >}}
The `deep` selection: 255 transactions with supports of 1,046 to 123,230 blocks, one
per evenly spaced target block of the first 3M records, in time order; `sets`,
$k = 1024$, seed 1. (a) $\hat J$ below the diagonal, the exact $J$ above; agreement shows
as mirror symmetry. (b) $\hat J - J$ below the diagonal, clipped at $\pm 0.05$ (RMS
0.0102; 1st and 99th percentiles $-0.032$ and $+0.022$; none beyond $\pm 0.05$). (c) The
strip at the left: $\log_{10}$ of the exact support size, from 3 (dark) to 5.2 (light).
Year ticks where the rows cross 1 January. Errors share one permutation, so they are
correlated across cells (the stripes); the honest spread is across seeds (the Jaccard
table above).
{{< /fig >}}

**Weighted similarity.** The L1 store was run at $m = 1024$ with 8 seeds and at
$m = 256$ and $512$ with 4 each.

| exact $J_w$ | pairs | $m = 256$ | $m = 512$ | $m = 1024$ | `varopt` plug-in |
| :--- | ---: | ---: | ---: | ---: | ---: |
| $< 0.01$ | 3,410 | $+0.014$ / 0.028 | $+0.014$ / 0.024 | $+0.008$ / 0.017 | $-0.003$ / 0.004 |
| $[0.01, 0.05)$ | 2,553 | $+0.004$ / 0.031 | $+0.006$ / 0.024 | $+0.002$ / 0.019 | $-0.020$ / 0.023 |
| $[0.05, 0.2)$ | 12,230 | $-0.004$ / 0.041 | $+0.002$ / 0.029 | $-0.003$ / 0.021 | $-0.121$ / 0.127 |
| $[0.2, 0.5)$ | 13,376 | $+0.002$ / 0.035 | $+0.003$ / 0.025 | $-0.003$ / 0.019 | $-0.268$ / 0.275 |
| $[0.5, 0.9)$ | 1,050 | $+0.006$ / 0.026 | $+0.006$ / 0.019 | $-0.003$ / 0.015 | $-0.430$ / 0.434 |
| $\ge 0.9$ | 21 | $+0.000$ / 0.002 | $+0.000$ / 0.001 | $-0.000$ / 0.001 | $-0.017$ / 0.032 |
{#tab:jw .fullwidth caption="R3, the window selection (32,640 pairs, records 2,999,685 to 2,999,999): bias / RMS error of the weighted Jaccard similarity by stratum of its exact value. L1 estimates averaged over 4, 4 and 8 seeds; the varopt plug-in is the one production run's (k = 512, seed 1)."}

On the window's pairs with $J_w \ge 0.05$ (26,677 of them) the L1 store at $m = 1024$
has a bias of $-0.0029$ (SE across seeds 0.0029) and an RMS error of 0.0201, against
0.0263 at $m = 512$ and 0.0379 at $m = 256$: the $\sqrt{2/m}$ law of §10.6. Below
$J_w = 0.01$ the mean estimate is the floor (panel (c) of
{{< xref "fig:jerror" "full" >}}): 0.009–0.011 at $m = 1024$, 0.013–0.017 at $m = 512$,
0.017–0.019 at $m = 256$ over the three selections, against 0.0088, 0.0125 and 0.0176
predicted for $J_w = 0$. `f32` and `f64` stores gave the same $\widehat{\mathrm{TV}}$ to
$9.6 \times 10^{-7}$ relative in the window and $1.9 \times 10^{-7}$ in `deep`; in
`even` one pair reached $1.08 \times 10^{-5}$, at a TV of $2.1 \times 10^{-4}$ (an
absolute difference of $2.3 \times 10^{-9}$). The plug-in column is §10.2's bias,
measured. {{< xref "fig:jwindow" "full" >}} draws the window's two matrices, the
estimates against the exact values.

{{< fig src="jaccard-error.svg" type="fullwidth" label="fig:jerror" alt="Three panels. Top left: RMS error of the Jaccard estimate against the exact J in 13 bins, for k 128, 512, 1024 and 2048, lying on the hypergeometric curves. Top right: mean error by bin with across-seed error bars, within a few thousandths of zero. Bottom: on log-log axes, the mean weighted Jaccard estimate against the exact value by bin, for L1 at three m, which follow the diagonal down to a floor between 0.01 and 0.02, and for the varopt plug-in, which lies far below the diagonal." >}}
The first 3M records (R3 and R3b), `sets`. (a) RMS of $\hat J - J$ pooled over seeds
(markers, with $\pm 2$ standard errors) and the hypergeometric SD of §10.5 (lines), in
13 bins of the exact $J$, over the `deep` and `even` pairs with at least one full sketch
and $0 < J < 1$ (the others are exact); 64 seeds at $k = 1024$, 16 at $k = 128$, 512
and 2048. Measured over predicted runs from 0.82 to 1.15 across the bins. (b) The mean of
$\hat J - J$ in the same bins, with $\pm 2$ standard errors across seeds, in units of
$10^{-2}$, the four $k$ slightly offset; the largest $\lvert t \rvert$ is 2.87
($k = 1024$), against a Bonferroni threshold of 3.0 for 13 bins. (c) The weighted
similarity over the 564,525 pairs of all three selections, in 11 bins of the exact $J_w$
(the first, $J_w < 10^{-3}$, at the left edge): the mean $\hat J_w$ of the L1 store at
$m = 256$ and 512 (4 seeds each) and 1024 (8 seeds), with $\pm 2$ standard errors across
seeds, and the mean plug-in of the production `varopt:512` sketches (not used; below
$10^{-4}$, off the axis, in the first bin). The L1 curves follow the diagonal down to
the floor of §10.6 (mean $\hat J_w$ 0.019, 0.013 and 0.0089 where $J_w < 10^{-3}$); the
plug-in is 4 to 10 times too small for $J_w$ from $10^{-3}$ to 0.7. Errors share one
permutation or projection within a seed, so the honest spread is across seeds.
{{< /fig >}}

{{< fig src="jaccard-window.svg" type="fullwidth" label="fig:jwindow" alt="For 256 transactions in a window of three blocks, clustered, with a strip of support sizes at the left: the set distance on a log scale, the KMV estimate below the diagonal and the exact value above, mostly below one in a hundred; and the weighted Jaccard similarity, the L1 estimate below and the exact value above, mostly below four tenths (median 0.18)." >}}
The `window`: the last 256 deep transactions before record 3M (records 2,999,685 to
2,999,999, blocks 178,608 to 178,610), ordered by average-linkage clustering on
$1 - \hat J$ with optimal leaf ordering (on the estimate, since production has no exact
values). (a) The set distance $1 - J$ on a log scale, `sets`, $k = 1024$ seed 1 below
the diagonal, exact above; values of $10^{-3}$ or less, including identical supports
(8.9% of the pairs), take the end colour. (b) $J_w$ on a linear scale to 0.6 (0.45% of
the exact values lie above), L1 $m = 1024$ seed 1 below, exact above. The strip at the
left: $\log_{10}$ of the exact support size, from 4.79 (dark) to 5.10 (light). The two
matrices say different things: nearly the whole history is shared (median $J$ 0.994),
while the shared *value* is a few tenths at most (median $J_w$ 0.18).
{{< /fig >}}

**Cost.** Peak memory is the VmHWM of `/usr/bin/time -v`, in GB of $10^9$ bytes as in
§8.9. R1 took 8 min 24 s and 100.2 GB, almost all of it the exact store. R2 folded
48 KMV stores over 31.2M records in 2 min 55 s and 68.0 GB; a $k = 1024$ store was busy
146.7 s and peaked at 617,119,725 ranks in 733,466 live sketches. In R3, which folded
the exact store and 29 KMV, 17 L1 and one `varopt` store in one pass (7 min 36 s,
107.6 GB), a $k = 1024$ KMV store was busy 11.5 s over the 3M records, an L1 store at
$m = 1024$ 14.3 s and `varopt:512` 23.9 s; `pairs` took 56 s for the 564,525 pairs.

### 10.9 The whole chain {#sec:kmv-chain}

**Counts.** R4 counted every one of the 778,613,440 records with five stores in one
pass: $k = 1024$ at seeds 1, 2 and 3, $k = 256$, and $k = 1024$ under `pos`. It took
1 h 09 min 47 s, at 544% of a core, and 144.2 GB.

| store | busy | peak ranks | peak live sketches | records cut to $k$ |
| :--- | ---: | ---: | ---: | ---: |
| $k = 1024$, seed 1 | 3,853 s | 7,660,615,688 | 7,593,632 | 137,238,198 |
| $k = 1024$, seed 2 | 3,817 s | 7,660,615,688 | 7,593,632 | 135,831,031 |
| $k = 1024$, seed 3 | 3,910 s | 7,660,615,688 | 7,593,632 | 135,305,680 |
| $k = 256$, seed 1 | 2,143 s | 1,916,423,324 | 7,593,632 | 102,302,532 |
| $k = 1024$, seed 1, `pos` | 3,777 s | 7,660,613,640 | 7,593,630 | 137,238,132 |
{#tab:r4 caption="R4, all 778,613,440 records: per store, the time its thread was busy, the peaks of ranks held and of live sketches, and the number of records whose merge had elements left over. The seed changes the peaks not at all and the last column by about 1 percent."}

At the peak a $k = 1024$ store holds about 1,009 ranks in each of 7.59M live sketches,
as many as the production run of §9 keeps alive: 30.6 GB of ranks.

- **Against the exact sizes.** On the first 31,187,785 records every hard counter of
  every store was 0: no whole sketch of the wrong size, no full sketch of a support of at
  most $k$, no whole sketch of a larger one, no sketch of more than $k$ ranks. The whole
  sketches of exactly the reference size were R2's: 4,792,897 at $k = 1024$, at every
  seed, and 4,715,656 at $k = 256$.
- **Determinism.** The first 623,755,748 bytes of R4's seed-1 stream,
  $48 + 20 \cdot 31{,}187{,}785$, equal R2's: the whole-chain stream extends the one
  validated against the exact sizes.
- **Seeds against each other.** Past record 31,187,785 there is no reference, so the
  three $k = 1024$ seeds were compared with each other: per 10M-record bucket and per
  pair of seeds, the RMS of the relative difference of their $\hat n$ over $\sqrt 2$,
  against the RMS of the records' theory RSE. Pooled over the 767,323,643 records full
  at every seed, the ratio was 0.424 for seeds 1 and 2, 0.966 for 1 and 3, 0.828 for 2
  and 3; per bucket it ranged from 0.23 to 1.58. Within a bucket, though, the spread of
  the differences around their bucket's mean is only 0.16 to 0.55 of the theory: most of
  a bucket's seed difference is one offset shared by its 10M records, as one
  permutation per seed and heavily overlapping supports make it. The pooled ratios are
  therefore a handful of effective draws, not 767M, and should scatter around 1 by a
  factor of about 2. Seeds 1 and 2 sit low all along, as on R2, where seed 1 had the
  smallest error (RMS over theory 0.37, 0.70 and 0.76 for seeds 1 to 3, and 0.50 for
  the pair 1–2); without a reference this cannot be told from two close offsets.
  Reported, not gated. The seed gates of the first 31.2M records passed (0 of 52 failed;
  with 3 seeds they are weak, a $t$ threshold of 36).
- **Never above the universe.** No record has a restricted $\hat n$ above $\beta_t + 1$
  (0 of 778,613,440), as {{< xref "prop:kmv-count" "full" >}} guarantees: a check of the
  decoding.
- **Counted exactly.** 11,289,797 records, 1.450%, have a whole sketch at $k = 1024$,
  and 4,792,897 of them lie in the first 31.2M records. Their supports are small: in a
  1-in-4001 sample of the records the median is 2 blocks, the 90th percentile 54 and
  the largest 983. Under `pos` exactly as many sketches are full as under `sets`.
- **The file.** The seed-1 stream compresses to 1,842,558,077 bytes, 2.37 B a record,
  8.45 times less than its 15,572,268,872 raw bytes; it is the production count file of
  §10.10.

Panel (c) of {{< xref "fig:count" "full" >}} follows the counts down the chain. Where
the exact sizes exist, a bucket's median $\hat n$ is within 0.5% of the exact median
(0.9965, 1.0008 and 1.0047 in the first three 10M-record buckets). The median support
grows from 131,000 blocks in the first 10M records to 708,000 in the last 8.6M, and
fills more of its universe as it grows: the median of $\hat n / (\beta_t + 1)$ is 0.85
over the first 100M records and 0.93 over the last 78.6M. The share counted exactly is
30% of the first 10M records, 6.1% of the first 100M, and between 0.25% and 1.9% of
every 10M bucket after the first 60M. The finite-population factor shrinks as the
supports fill their universe, so the theory RSE falls with depth: over the full records
its median is 1.21% in the first 100M, 0.92% over the chain (10th and 90th percentiles
0.82% and 1.19%) and 0.81% in the last 78.6M. $\hat n_M$, over $2^{20}$, has a median
RSE of 2.25% over the chain, about 2.4 times that of $\hat n$.

**Matrices.** R5 folded the stores of the selected records over the whole chain, and R6
read the production `varopt` sketches of the same records out of
`colors.sketch-varopt512.zst`. The selections were drawn from R4's seed-1 stream; a
record is deep when its $k = 1024$ sketch is full, so $\lvert S \rvert > 1024$ exactly
by {{< xref "thm:kmv-dag" "full" >}}.

- `w2013` and `w2017`: the first 256 deep records from blocks 240,000 and 470,000
  (records 19,031,618 to 19,031,920 in blocks 240,000 to 240,002, and records
  229,491,548 to 229,491,813, all in block 470,000). `w2022`: the last 256 deep records
  of the chain, which are its last 256 records, all in block 762,260.
- `chain`: 512 target blocks evenly spaced from 50,000 to 762,260; each takes a deep
  record not already selected, from the first block at or after the target that has
  one (40 picks moved past their target). All 512 targets found a record: records
  51,126 to 778,611,720, in blocks 50,299 to 762,260, with $\hat n$ from 1,254 to 711,490
  (median 354,641).
- R5 folded seven stores, four KMV ($k = 1024$ at seeds 1, 2 and 3, and seed 1 under
  `pos`) and three L1 ($m = 1024$ at seed 1 in `f32` and in `f64`, $m = 512$ at seed 2),
  over all 778,613,440 records, and dumped the 1,280 selected: 1 h 10 min 05 s at 607%
  of a core, and 249.8 GB, 4% below the 260.1 GB that a memory model fitted to R4
  predicted. A KMV store was busy 3,872 to 3,969 s and reproduced R4's peaks and counts
  of cut records exactly; the L1 stores were busy 2,667 s ($m = 1024$, `f32`), 3,374 s
  (`f64`) and 2,348 s ($m = 512$).
- R6 cut the 1,280 records out of the production file, beside R5.
- R7 computed the 228,736 pairs (130,816 in `chain`, 32,640 in each window) in 3.84 s and
  0.2 GB.

The checks on these pairs (`r7_checks.py`):

- **$\hat J$ across seeds 1, 2 and 3.** For each cell, $s$ is the standard deviation of
  the three seeds' $\hat J$ and $\sigma$ the hypergeometric SD of
  {{< xref "prop:kmv-jaccard" "full" >}} at their mean $\hat J$ and union count. If the
  estimates were independent and normal, $s^2/\sigma^2$ would be distributed as
  $\chi^2_2/2$: mean 1, and $s \le \sqrt 3\,\sigma$ with probability
  $1 - e^{-3} = 0.95$. The gate, a mean $(s/\sigma)^2$ in $[1/3, 3]$, passed in every
  group: 0.933 in `chain`, 0.876 in `w2013`, 1.154 in `w2017`, 1.134 in `w2022`. The
  share of cells with $s \le \sqrt 3\,\sigma$, among those with $kJ$ and $k(1 - J)$ at
  least 10, is reported, not gated: 0.976, 0.991, 0.963 and 0.699. The low one is a
  single offset: in `w2022` the difference between seeds 1 and 2 has mean
  $-1.55 \sqrt 2\,\sigma$ and a mean $(\Delta \hat J)^2 / (2\sigma^2)$ of 3.73, against
  0.99 and 1.50 for the other two pairs of seeds. Its 32,640 cells share one permutation
  per seed, so one unlucky pair of permutations moves them all. No pair in these groups
  has two whole sketches, so no cell is exact.
- **L1 in `f32` against `f64`.** The two gave the same $\widehat{\mathrm{TV}}$ to
  $7.8 \times 10^{-5}$ relative at worst (in `w2013`; $1.9 \times 10^{-5}$ in `chain`),
  with a 99th percentile of at most $3.2 \times 10^{-7}$ in every group, and a pair at 0
  in `f64` was 0 in `f32`: below the $10^{-4}$ that the check allows. The figures use
  `f64` all the same.
- **L1 against the exact $J_w$** could not be checked at full depth. It needs pairs whose
  two `varopt` sketches are unreduced, and so *are* the colours, up to `f32`; every
  selected record has more than 1,024 blocks, so its `varopt:512` sketch is always
  reduced. The check stands on the prefix (§10.8).
- **L1 against an exact lower bound.** Binning two colours into the same 1,024 bands
  can only lower their TV, and `colors.bands1024.zst` holds every record's exact binned
  colour; so $\widehat{\mathrm{TV}} \ge \mathrm{TV}_{1024} - 3\sqrt{2/m}\,\widehat{\mathrm{TV}}$
  should hold in at least 99% of the pairs. Read for the 1,280 selected records (a
  streaming pass over the 1.67 TB file that took 3 h 42 min), it holds in
  99.986% of the 130,816 `chain` pairs at $m = 1024$, in 100%, 99.97% and 99.997% of the
  32,640 pairs of `w2013`, `w2017` and `w2022`, and likewise at $m = 512$ and in `f64`;
  every band line's transaction matched the selection. The bound is far from tight
  inside a window: the median of $\widehat{\mathrm{TV}} / \mathrm{TV}_{1024}$ (over
  pairs with $\mathrm{TV}_{1024} > 0.01$) is 1.10 in `chain` but 1.36 to 1.82 in the
  windows, whose colours differ mostly within bands of 745 blocks. A check that passes,
  then, and not an exact reference.

Across time, in the whole-chain matrix of {{< xref "fig:jchain" "full" >}}, the upper
triangle has no exact $J$ to show, as the prefix's has, and a containment drawn on
$[0, 1]$ would be a flat field. On the prefix `deep` pairs, the containment of the older
support in the newer is exactly 1 in 81.6% of the cells and at least 0.9 in 90.9%, and
the share of cells at 1 grows with the gap: 41% under 5,000 blocks apart, 63% at
5,000–20,000, 86% at 20,000–60,000 and 97% beyond. For nested pairs $J$ is just the
ratio of the two sizes, which the $\log_{10} \hat n$ strip already shows. What is
informative is the 18.4% of cells that are *not* nested (5,968 of 32,385), whose
$\log_{10}(1 - c)$ spreads from $-2.7$ (p10) through $-1.0$ (p50) to $-0.01$ (p90), and
the KMV estimate tracks the exact value there (721 cells fall below the resolution of
$k = 1024$). So the upper triangle of the whole-chain matrix shows
$\log_{10}(1 - \hat c_{\text{old} \subseteq \text{new}})$, clipped to $[-3, 0]$: its
floor colour means "nested, to the resolution of $k$".

Over the whole chain the field is flatter still. The containment is defined in 129,791
of the 130,816 cells of `chain`, and 98.5% of those are at the floor ($\hat c = 1$
exactly); only 1,970 cells, 1.5%, are not nested to the resolution of $k$, with
$\log_{10}(1 - \hat c)$ at $-2.04$, $-0.97$ and $-0.39$ (p10, p50, p90), and 316 of them
in one row: record 102,455, of block 73,701, with 1,623 blocks, whose median containment
in the later supports is 0.917. The containment is undefined in 1,025 cells (0.78%):
small early supports (1,250 to 2,400 blocks, in blocks 75,115 to 116,905) against late
ones (from block 554,576), where no sampled element of the older support ranks below
the newer one's threshold. The fallback $\hat J \hat n_u / \hat n_A$ is 0 in all of them,
since $\hat J$ is, and 0 would read as "disjoint", so they are drawn hatched instead.
$\hat J$ has percentiles 0.016, 0.48 and 0.90 (p10, p50, p90), and its median by block
gap tracks the ratio of the smaller count to the larger (0.989 against 0.990 under
5,000 blocks apart, 0.413 against 0.412 beyond 60,000): nested pairs, as the
containment says.

{{< fig src="jaccard-chain.svg" type="fullwidth" label="fig:jchain" alt="Two matrices for 512 deep transactions spread over the whole chain in time order, 2010 to 2022, with a strip of support sizes at the left. Left: the estimated Jaccard similarity below the diagonal, falling with the time between two transactions; above it the containment of the older support in the newer, at the nested floor nearly everywhere, with a few hatched undefined cells near the top right. Right: the Wasserstein distance between the production VarOpt sketches in years, small near the diagonal and growing with the time between two transactions." >}}
The `chain` selection: 512 deep transactions, one per evenly spaced target block from
block 50,000 to the end of the chain, in time order (blocks 50,299 to 762,260); `sets`,
$k = 1024$, seed 1. (a) Below the diagonal, $\hat J$. Above it,
$\log_{10}(1 - \hat c)$ for the containment $\hat c$ of the older support in the newer,
clipped to $[-3, 0]$: the floor colour, $-3$ or less, means nested to the resolution of
$k$ (98.5% of the defined cells); grey and hatched, undefined (1,025 cells): no sampled
element of the older support ranks below the newer one's threshold. The strip at the
left: $\log_{10} \hat n$, from 3 (dark) to 6 (light). (b) $W_1$ between the production
`varopt:512` sketches of the same records, read out of the production file without a
new fold, in years of 144 blocks a day, on a log scale clipped to $[0.13, 9]$. Year
ticks, every other year, where the rows cross 1 January. $J_w$ is not drawn; its
quantiles are in the text. Errors share one permutation, so they are correlated across
cells; the honest spread is across seeds.
{{< /fig >}}

$W_1$, the "temporal distance", has percentiles 0.48, 1.86 and 4.26 years (p10, p50,
p90), and a Spearman correlation of 0.82 with the gap in blocks and of 0.77 with
$1 - \hat J$. The weighted similarity is far from the floor across the whole chain, unlike
on the prefix: L1 $\hat J_w$ ($m = 1024$, `f64`) has percentiles 0, 0.21 and 0.59 (p10,
p50, p90), only 20.5% of the pairs lie below the floor of 0.0088, and its median falls
with the gap from 0.55 under 5,000 blocks to 0.18 beyond 60,000. The independent store
at $m = 512$, seed 2, agrees (median 0.18, p90 0.59). On the prefix, deep pairs across
time had a median $J_w$ of $1.4 \times 10^{-4}$ (§10.1): what holds for the first 3M
records does not hold for the chain as a whole.

Inside a window, where $J$ is close to 1, the weighted similarity is what tells
transactions apart, and the three windows differ ({{< xref "fig:jeras" "full" >}}):

{{< fig src="jaccard-eras.svg" type="fullwidth" label="fig:jeras" alt="Six matrices in two rows and three columns, for 256 transactions each in 2013, 2017 and 2022, each column clustered. Top row: the estimated set distance on a log scale, mostly a few thousandths or less (median 2 in 1024), with a few bands of larger distance. Bottom row: the weighted Jaccard estimate on a scale from 0 to 1, low and mixed in 2013, mostly between 0.6 and 0.9 in 2017 and 2022." >}}
Three windows of the whole chain, 256 deep transactions each: 2013, the first from
block 240,000 (blocks 240,000 to 240,002); 2017, the first from block 470,000 (all in
that block); 2022, the last 256 records of the chain (all in block 762,260). Each column
is ordered by average-linkage clustering on $1 - \hat J$ with optimal leaf ordering, and
both rows follow that order. No exact values exist here, so both triangles show the
estimate. Top: the set distance $1 - \hat J$, `sets`, $k = 1024$, seed 1, on a log
scale; $10^{-3}$ or less, identical sketches included, takes the end colour. Bottom:
$\hat J_w$ from L1, $m = 1024$, seed 1, `f64`, on $[0, 1]$.
{{< /fig >}}

In all three the median $1 - \hat J$ is $2/1024$, two sampled elements apart, and
$\hat J = 1$ in 21.9%, 32.4% and 36.9% of the pairs. The weighted similarity rises from
era to era: $\hat J_w$ has percentiles 0.11, 0.44 and 0.72 (p10, p50, p90) in 2013,
0.40, 0.75 and 0.85 in 2017, and 0.58, 0.78 and 0.87 in 2022, below the floor in 2.7%,
1.6% and 0.02% (5 pairs) of the pairs. The median $W_1$ between two transactions of a
window is 0.19, 0.25 and 0.35 years. Under `pos`, every $\hat J$ of the four groups
equals the `sets` one.

### 10.10 The production count file {#sec:kmv-file}

`colors.kmv1024.counts.zst`, 1,842,558,077 bytes (SHA-256
`c8d38950e06278e86b4affc86f1906bbb59712746aba29d2e1d9fce9485a7a7d`), is R4's seed-1
stream, copied after R4's checks passed. It is one zstd frame with a 4 MiB window, so
a plain `zstd -d` reads it.

It holds, for each of the 778,613,440 transactions in record order, the 20-byte record of
§10.7 for the $k = 1024$, seed-1, `sets` sketch of its support. Read it with

```text
zstd -dc colors.kmv1024.counts.zst | sketch decode
```

which verifies the trailer and writes a comment line naming the stream
(`# kmv-k1024-s1-sets k=1024 seed=1 support=sets bits=20 M=1048576`) and then
`rec tx block univ full m n_hat se n_hat_M se_M`, one line a record. Or read the raw
records with numpy, dtype `[('tx','<u8'),('block','<u4'),('m','<u4'),('rk','<u4')]` at
offset 48 with `count = (size - 48 - 24) // 20` (the last 24 bytes are the trailer):
then `m & 0x7fffffff` is the sketch's length, bit 31 says *full*, and
$\hat n_M = 1023 \cdot 2^{20} / \texttt{rk}$ follows directly, while the restricted
$\hat n$ needs the permutation, which `decode` rebuilds from the header.

What an $\hat n$ means: when *full* is clear (every support of at most 1024 blocks, 1.45%
of the records) it *is* $\lvert S_t \rvert$, the number of blocks the transaction
descends from, through zero-amount inputs too. Otherwise it is an exactly unbiased
estimate with an RSE of about
$\sqrt{(n - k + 1)/(n(k - 2)) \cdot (N - n)/(N - 1)}$, written as `se`: a median of
0.92% over the chain, 1.2% over its first 100M records and 0.8% over its last 78.6M. All
records share one permutation, so their errors are correlated, by design: two records
with nearly the same support get nearly the same error. A second seed's file is the
way to an independent estimate; R4 computed seeds 2 and 3, which are not shipped.


## 11. Ten Sketched Colours {#sec:ten}

What the production file holds, read for a few transactions: the sketch $\hat C_t$ of
§5.3, a polynomial in $x$ with at most 512 terms, where the exponent is the block a coin
was minted in and the coefficient the sketch's estimate of the share of $t$'s value
minted there. The ten below are among the 1,280 records of §10.9 that R6 cut out of
`colors.sketch-varopt512.zst`, each picked for one property of its sketch. Each has
exactly 512 terms, and its coefficients sum to 1 to seven digits, as point 4 of
{{< xref "thm:varopt" "full" >}} and {{< xref "thm:dag" "full" >}} say they must. The
subscript is the record number.

Terms with equal coefficients are grouped, heaviest group first, and only the first
four groups are written out; $\rho(x)$ is the rest, $\rho(1)$ its mass. The
coefficients are rounded to six digits. All 5,120 terms, as stored, are in
[`ten-colours.txt`](ten-colours.txt).

| record | block | group | distinct coefficients | heavy entries | largest coefficient | mean block | newest block | $\hat n$ | KS | $W_1$ (blocks) |
| ---: | ---: | :--- | ---: | ---: | :--- | ---: | ---: | ---: | ---: | ---: |
| 51,126 | 50,299 | `chain` | 8 | 263 | 0.0150 at each of 16 | 39,923 | 47,918 | 1,506 | $2 \times 10^{-8}$ | 0 |
| 99,576 | 72,310 | `chain` | 26 | 109 | 0.9942 at 71,925 | 71,906 | 71,925 | 2,267 | $3.8 \times 10^{-8}$ | 0 |
| 243,275 | 104,360 | `chain` | 33 | 352 | 0.9500 at 99,535 | 98,783 | 102,880 | 20,742 | $3.8 \times 10^{-7}$ | 0 |
| 456,104 | 121,087 | `chain` | 54 | 285 | 0.0083 at each of 2 | 66,631 | 93,271 | 16,532 | 0.00028 | 10 |
| 19,031,745 | 240,001 | `w2013` | 107 | 113 | 0.9093 at 239,070 | 236,737 | 239,070 | 190,919 | $8.4 \times 10^{-5}$ | 6 |
| 69,818,050 | 358,042 | `chain` | 437 | 439 | 0.0100 at 357,814 | 357,545 | 357,937 | 310,142 | $1.8 \times 10^{-5}$ | 2 |
| 77,146,563 | 366,405 | `chain` | 308 | 321 | 0.0337 at 366,190 | 366,128 | 366,271 | 320,370 | $3.3 \times 10^{-9}$ | 0 |
| 229,491,784 | 470,000 | `w2017` | 35 | 48 | 0.0501 at 210,595 | 165,048 | 229,223 | 183,586 | 0.0016 | 142 |
| 778,613,383 | 762,260 | `w2022` | 1 | 0 | $1/512$ at each of 512 | 175,122 | 391,528 | 443,316 | 0.0025 | 262 |
| 778,611,720 | 762,260 | `chain` | 1 | 0 | $1/512$ at each of 512 | 351,468 | 761,472 | 711,490 | 0.0025 | 524 |
{#tab:ten .fullwidth caption="The ten sketches. Heavy entries: those above the threshold tau of the last reduction, kept with their own weight; the others equal tau. Largest coefficient: its value and the block (or the number of blocks) that carries it. Mean and newest block: of the sketch. n hat: the support size from the production count file of section 10.10. KS and W1: the sketch against the exact colour, both read at the 1,024 band edges of colors.bands1024.zst (the exact colours are on disk only binned, in bands of 745 blocks); W1 is the area between the two CDFs so read, rounded to whole blocks."}

The ten, in the order of the table:

1. **The first `chain` record.** It is the first deep record at or after block 50,000;
   the first deep record of the chain is earlier, record 44,447 in block 44,006. Its 512
   terms take only 8 values. Equal coefficients are lights of some earlier reduction,
   which set every light it kept to its own $\tau$, carried down to this record by the
   same shares; 263 of them are heavy at the last reduction, which kept them as they
   came.

$$
\begin{aligned}
\hat C_{51126}(x) ={}& 0.01505\,\underbrace{(x^{46567} + x^{46633} + \dots + x^{47918})}_{16\ \text{terms}} \\
&+ 0.0123652\,(x^{30732} + x^{33941} + x^{34409}) \\
&+ 0.00368812\,(x^{13316} + x^{24451} + x^{35892}) \\
&+ 0.00355412\,\underbrace{(x^{36099} + x^{36101} + \dots + x^{41649})}_{200\ \text{terms}} \\
&+ \rho(x), \quad \text{290 terms with 4 coefficients},\ \rho(1) = 0.000216719
\end{aligned}
$$

2. **The most concentrated colour.** One block, minted 385 blocks earlier, carries
   99.42% of the value. Binned, the exact colour puts 0.9949 in that block's band
   (blocks 71,520 to 72,264), and so does the sketch.

$$
\begin{aligned}
\hat C_{99576}(x) ={}& 0.994246\,x^{71925} \\
&+ 8.25445 \times 10^{-5}\,x^{70186} \\
&+ 8.2528 \times 10^{-5}\,x^{70566} \\
&+ 8.25116 \times 10^{-5}\,\underbrace{(x^{70432} + x^{70627} + \dots + x^{71402})}_{8\ \text{terms}} \\
&+ \rho(x), \quad \text{501 terms with 22 coefficients},\ \rho(1) = 0.00492931
\end{aligned}
$$

3. **One block and a long tail.** 95% from block 99,535, and a tail that reaches back
   to block 9.

$$
\begin{aligned}
\hat C_{243275}(x) ={}& 0.950014\,x^{99535} \\
&+ 0.0178931\,x^{99327} \\
&+ 0.00582011\,(x^{93408} + x^{93446} + x^{93795}) \\
&+ 0.00133668\,(x^{99223} + x^{99305} + x^{99466}) \\
&+ \rho(x), \quad \text{504 terms with 29 coefficients},\ \rho(1) = 0.0106228
\end{aligned}
$$

4. **Old money in 2011.** A diffuse colour, with no coefficient above 0.84%, whose
   heaviest terms are blocks of early 2009.

$$
\begin{aligned}
\hat C_{456104}(x) ={}& 0.00832831\,(x^{2659} + x^{5065}) \\
&+ 0.00832812\,\underbrace{(x^{2775} + x^{3549} + \dots + x^{7312})}_{4\ \text{terms}} \\
&+ 0.00831587\,(x^{1025} + x^{2148}) \\
&+ 0.0083124\,x^{80654} \\
&+ \rho(x), \quad \text{503 terms with 50 coefficients},\ \rho(1) = 0.925087
\end{aligned}
$$

5. **The 2013 window.** 91% of the value was minted in one block, 931 blocks earlier.

$$
\begin{aligned}
\hat C_{19031745}(x) ={}& 0.909327\,x^{239070} \\
&+ 0.0087706\,x^{235587} \\
&+ 0.00719864\,x^{234980} \\
&+ 0.00359045\,x^{237394} \\
&+ \rho(x), \quad \text{508 terms with 103 coefficients},\ \rho(1) = 0.0711136
\end{aligned}
$$

6. **The richest structure.** 437 distinct coefficients out of 512: the sketch is mostly
   heavy entries (439), which the last reduction kept with their own weights. Its top band (blocks
   357,600 to 358,344) holds 0.5665 of the value, in the sketch and in the exact
   colour.

$$
\begin{aligned}
\hat C_{69818050}(x) ={}& 0.0100038\,x^{357814} \\
&+ 0.00999311\,x^{357928} \\
&+ 0.00997362\,x^{357875} \\
&+ 0.0099514\,x^{357858} \\
&+ \rho(x), \quad \text{508 terms with 433 coefficients},\ \rho(1) = 0.960078
\end{aligned}
$$

7. **The youngest money of a deep colour.** The sketch's mean block is only 277 blocks
   before the transaction's own, though its support is about 320,000 blocks: 99.58% of
   the value was minted in blocks 365,795 to 366,539, and the sketch puts the same
   99.58% there.

$$
\begin{aligned}
\hat C_{77146563}(x) ={}& 0.0336654\,x^{366190} \\
&+ 0.0335747\,x^{366239} \\
&+ 0.0335313\,x^{366088} \\
&+ 0.0334709\,x^{366001} \\
&+ \rho(x), \quad \text{508 terms with 304 coefficients},\ \rho(1) = 0.865758
\end{aligned}
$$

8. **The 2017 window, spending 2013 coins.** In block 470,000, mid-2017, the newest
   block of the sketch is 229,223, from spring 2013; and the exact colour agrees at the
   bands' resolution: none of its value was minted after block 229,459.

$$
\begin{aligned}
\hat C_{229491784}(x) ={}& 0.0500903\,x^{210595} \\
&+ 0.05\,x^{197851} \\
&+ 0.0499097\,x^{210667} \\
&+ 0.048659\,x^{192682} \\
&+ \rho(x), \quad \text{508 terms with 31 coefficients},\ \rho(1) = 0.801341
\end{aligned}
$$

9. **Pre-2016 money in 2022: a flat sketch.** In the last block of the data, the
   sketch's newest block is 391,528, from early January 2016. The exact colour is not
   quite so old: 0.051% of its value was minted after that block's band, as late as
   blocks 495,425 to 496,169, in late 2017. Together those shares are about a quarter
   of $\tau = 1/512$; a light entry is kept with probability $v / \tau$, and the
   sketch kept none of them. That is VarOpt sampling, not an error: in expectation they
   are there.

$$
\begin{aligned}
\hat C_{778613383}(x) ={}& \tfrac{1}{512}\,\underbrace{(x^{2717} + x^{4596} + \dots + x^{391528})}_{512\ \text{terms}}
\end{aligned}
$$

10. **The largest support.** About 711,490 distinct blocks, 93% of the 762,261 that
    existed then, also as a flat sketch. Its 512 blocks are a sample of the whole
    chain: binned, it puts mass in 498 of the 1,023 bands where the colour has some,
    and its total variation distance from the binned colour is 0.42, yet its CDF is
    within 0.0025 of the exact one everywhere, and its $W_1$ is 524 blocks, under four
    days.

$$
\begin{aligned}
\hat C_{778611720}(x) ={}& \tfrac{1}{512}\,\underbrace{(x^{3607} + x^{7180} + \dots + x^{761472})}_{512\ \text{terms}}
\end{aligned}
$$

**Flat sketches.** 543 of the 1,280 sketches of §10.9 are flat, as 9 and 10 are: 512
coefficients all equal to $1/512$. A sketch is flat when no entry of the merged parents'
sketch exceeds the threshold $\tau$ of the last reduction
({{< xref "def:varopt" "full" >}}). Every entry is then light, each is kept with
probability $v / \tau$, and every kept one gets $\tau$; the mass is 1 and exactly
$k$ entries are kept, so $\tau = 1/k$. A flat sketch is thus an equal-weight sample of
512 blocks, each drawn with probability proportional to its weight in the merged
sketch, and is unbiased like any other.

**Read with care.** Each coefficient estimates the share of one block without bias
({{< xref "thm:dag" "full" >}}), but the estimate of a single light block is
crude: it is $\tau$ or 0. What a sketch gets right is the colour's CDF, and the
functionals of §5.1. The KS column of the table, against the binned exact colour, runs
from $3 \times 10^{-9}$, for colours made of heavy entries, to $0.0025$ for the flat
sketches, a little over $\tau = 1/512$. That is allowed: the bound $\tau$ of
{{< xref "cor:bv" "full" >}} is for one reduction against its own input, and through
the recurrence the errors of the earlier reductions add to it (§6.3).


## 12. What Is Left {#sec:left}

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
- **The permutation is pseudo-random.** The exact unbiasedness of §10.4–10.5 is a
  theorem about a uniform permutation; the code draws a Fisher–Yates shuffle from a
  hash. The seed tests of §10.8 and the uniformity test T-K1 are the evidence that the
  difference is harmless, and a change to the shuffle or the hash must rerun them.
- **One permutation per run.** Every count and every cell of a matrix shares it, so
  errors are correlated across records and cells, and a single run can say nothing
  about bias. The production count file is one seed; R4 computed seeds 2 and 3 beside it
  but they are not shipped.
- **Weighted similarity near the floor.** The L1 store's floor is 0.0088 at
  $m = 1024$, so pairs with smaller $J_w$ cannot be told apart one by one; a larger $m$
  lowers the floor only as $1/\sqrt m$. On the prefix that is most deep pairs across
  time (92% below 0.01); over the whole chain it is a fifth of the `chain` pairs and
  almost none inside a window. The `f32` fold was checked against `f64` on the first 3M
  records and, at full depth, only on the 1,280 records R5 selected
  ($7.8 \times 10^{-5}$ relative at worst). L1 against the exact $J_w$ was checked on the
  prefix only: no record of the whole-chain selections has an unreduced `varopt`
  sketch to compare with. At full depth there is only the band lower bound of §10.9,
  which holds but is loose inside a window.
- **A weighted sample that keeps the subset lemma.** Ranks $u_b / g(b)$ with a fixed
  function $g$ of the block keep {{< xref "lem:kmv-sub" "full" >}}, so they would fold
  exactly with exact weights, sampling blocks by a prior rather than by the colour. Which
  $g$ (recency, minted value) would serve $J_w$ or the functionals of §5.1 is open, and
  so is whether a weighted MinHash outside the class of
  {{< xref "prop:no-sum-merge" "full" >}} can compose under sums. The probability
  Jaccard index of Moulton and Jiang is not a function of L1, and no composing sketch
  for it is known here.
- **Containment is often undefined** for a small support against a large one (27% of
  the ordered `even` pairs of the prefix one way, 14% the other; 0.78% of the cells of
  the whole-chain matrix), and its estimate is consistent but not unbiased: the
  inclusive threshold of the code biases it up by about $c(1 - c)/k$. A strict threshold
  showed no bias in simulation; adopting it changes the output of `pairs`, so it waits
  for a new version. The fallback $\hat J \hat n_u / \hat n_A$ is a biased ratio and
  is flagged.
- **More of the sketch for Jaccard.** Both sketches are complete below the smaller
  threshold, so up to $2k$ elements of the union are known; an estimator that uses them
  could lower the variance at small $J$.
- **Sketches of every record are not stored.** At $k = 1024$ they would take about
  3.2 TB. The counts are stored; sketches exist only for selections, and a new
  selection needs a new fold (about 70 minutes, as R5 took).
- **The universe.** Blocks must stay below $2^{20} = 1{,}048{,}576$, which at 144 blocks a
  day the chain passes in about 2028; `:bits=21` doubles the tables to 16 MiB.


## 13. Notes and References {#sec:references}

### 13.1 Further reading

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
  {{< cite keys="manasse2010consistent" mode="text" >}} define consistent weighted
  sampling, a MinHash for vectors whose collision probability is the weighted Jaccard
  similarity, and {{< cite keys="ioffe2010improved" mode="text" >}} makes it run in
  constant time per nonzero weight. {{< cite keys="moulton2018maximally" mode="text" >}}
  argue that for probability distributions, such as two colours, the natural
  generalisation of the Jaccard index is a different one, and give a MinHash for it,
  P-MinHash, whose ranks are those of {{< xref "prop:no-sum-merge" "full" >}}. None of
  them composes through the sums of the colour recurrence; §10.6 uses instead that for
  distributions the weighted Jaccard similarity is a function of the L1 distance.
- **Stable projections.** {{< cite keys="indyk2006stable" mode="text" >}} sketches the
  L1 distance of streamed vectors by projections with Cauchy entries, which are linear
  and therefore follow any sequence of updates, including the mixtures of §5.1;
  {{< cite keys="li2007nonlinear" mode="text" >}} study estimators of the scale from
  Cauchy projections, among them the maximum likelihood estimator of §10.6, and their
  tail bounds.
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
  generator whose output function hashes every draw of §7.3. The permutation of §10.7 is
  the shuffle of Fisher and Yates in Durstenfeld's in-place form, Algorithm P of Knuth's
  §3.4.2.{{< cite "knuth1997taocp2" >}}

### 13.2 References

{{< bibliography heading="" >}}
