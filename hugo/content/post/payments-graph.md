+++
date = '2026-08-28T09:58:04+01:00'
title = 'Inspecting the Payments Graph'
subtitle = 'A Bitcoint induced graph about transactions'
summary = ' '
categories = ['rust']
+++

# Topology & subgraph patterns in `/data/bitcoin/bitcoin-webgraph/pg`

Live analysis log — appended as findings appear (`tail -f` friendly).
Tooling: `webgraph-rs` (this working copy), driven from a small standalone probe crate
that memory-maps the BvGraph and fans out over 112 cores.

| | |
|---|---|
| nodes | 668,261,953 |
| arcs  | 2,162,523,341 |
| avg out-degree | 3.236 |
| transpose | `pg-t` (same n, same m) |
| bits/link | 8.987 (compratio 0.309) |

---

## 0. Setup / how things are measured

All numbers below come from full scans of the graph (no sampling) unless the
section says "sample". Each scan is a `par_apply`/rayon fan-out over node ranges,
`graph.successors(u)` per node, folding per-thread histograms. The transpose `pg-t`
is used whenever an in-degree / predecessor question shows up.

---

## 0.1 Notation — every symbol used in this document

### The graph

| symbol | meaning |
|---|---|
| `n` | number of nodes = 668,261,953 |
| `m` | number of arcs = 2,162,523,341 |
| `u`, `v` | node IDs, in `0 .. n-1` |
| `u -> v` | an arc: "TXO `u` was spent by the transaction that created TXO `v`" |
| `succ(u)` | the successor list (out-neighbourhood) of `u` |
| `outdeg(u)`, `indeg(v)` | sizes of the out- / in-neighbourhood |
| `pg`, `pg-t` | the graph and its transpose. `pg-t.successors(v)` = the **predecessors** of `v` in `pg` |
| DAG | directed acyclic graph. Proven for this graph in §2 |
| `D` | the length of the longest path in the DAG = **2,168,061** hops (§7) |

### Transactions (the biclique decomposition of §4)

Because every successor list is a contiguous interval (§3), the arc set factors exactly into one
complete bipartite graph per transaction. That gives the following objects, used everywhere below.

- `T` — a transaction.
- `I(T)` — its **input set**: the older TXOs it spends. An arbitrary, scattered set of node IDs.
- `O(T)` — its **output set**: always a *contiguous interval* of node IDs `[s, s+len)`.
- `|I|` and `|O|` — the sizes of those sets, i.e. the transaction's input count and output count.
  These two numbers are the workhorses of this whole document.
- **shape** `(|I|, |O|)` — the pair. `(1,2)` = one input, two outputs = the canonical "pay + change"
  transaction, and 55.8 % of the ledger.
- `K(|I|,|O|)` — the complete bipartite graph `I(T) x O(T)`. The entire arc set is a disjoint union
  of these, one per transaction (§4).
- `s` — a **block start**: the first node ID of some `O(T)`. Since the intervals partition the node
  set, `s` identifies its transaction uniquely, and is used as the transaction's name throughout.
- **class** `|O| = L` — the set of all transactions with exactly `L` outputs. Most of Part III is
  about telling these classes apart.

> **A warning about the word "block".** It is overloaded in this document, unavoidably:
>
> * an **output block** / **interval** / **biclique** is `O(T)` — the outputs of *one transaction*;
> * a **Bitcoin block** / **segment** is a mined block containing *many* transactions (§5).
>
> Where it matters I say "output block" or "Bitcoin block". A bare "block start `s`" always means
> the former; "in-block chaining" (§22) and "same block" (§18.3) always mean the latter.

### Derived arrays (what the probe binaries actually build)

Every measurement in this document is computed from these five arrays plus the graph itself:

- `ss[u]` — the **start** of `u`'s successor interval, i.e. *which transaction spent `u`*.
  `NONE` if `u` is unspent.
- `blk_len[s]` — `|O|` of the transaction whose output block starts at `s`; `0` if `s` is not a
  block start.
- `blk_mul[s]` — `|I|` of that transaction (the number of nodes `u` with `ss[u] == s`).
- `own[v]` — `|O|` of the transaction that **created** `v` (paint `blk_len[s]` across `[s, s+len)`);
  `0` means `v` is a coinbase output.
- `seg[v]` — which **Bitcoin block** `v` belongs to, recovered from runs of in-degree-0 nodes (§5).

Two linear sweeps over the ID axis then give:

- `depth[v]` — length of the **longest** chain of transactions from *any* coinbase output down to `v`.
- `height[u]` — length of the longest chain from `u` forward to an *unspent* output.
- **critical** node — one with `depth[v] + height[v] == D`, i.e. lying on *at least one* longest
  path (§24).
- **critical width** at depth `d` — how many critical nodes share that depth. Width 1 = a **forced**
  level: every longest path in the graph must pass through that one node.

### Statistics

- **baseline** — what a quantity would be if the population were drawn at random from the whole
  ledger. Always stated explicitly, because the choice of null matters: §25.1 corrects one of my own
  claims that used the wrong one.
- **enrichment** (written `12x`) — observed share divided by baseline share. `1x` means no signal.
- **self-affinity** of class `L` — the fraction of an `|O|=L` transaction's *inputs* that were
  created by another `|O|=L` transaction. Background is ~1–5 %; the mixer of §17 sits at 78.8 %.
- `R` — same-class arcs per transaction: how many of a transaction's outputs are consumed by another
  transaction of the same class (§21.1).
- `Cnorm` — (share of those same-class arcs leaving the **last** output position) multiplied by `L`.
  `1` = spread uniformly over all positions; `L` = all of it through one position, i.e. a change
  output (§21.1).
- `ext_out / ext_in` — coins leaving a class per coin entering it. Much greater than 1 means a
  distributor; near 1 with heavy recirculation means a mixer.
- **residence time** — expected number of same-class transactions a coin passes through before
  leaving (§20.2). A *model* quantity: there is no value data here.
- **first gap** and **inner gap** — `s_u - u` (how far ahead the spending transaction lies) and
  `v_i - v_(i-1)` within a successor list (§3.2).
- **run** — a maximal stretch of consecutive integers in a successor list (§3), or of consecutive
  depth levels sharing some property (§24.2).
- `p5`, `p50`, `p90`, … — percentiles; `p50` is the median.
- σ (sigma), z — standard deviations from the mean, used when asking whether a per-position
  difference is real rather than noise (§25.1).

> **Table convention.** Inside markdown tables the bars are dropped — `O=101` means `|O|=101`,
> `I=25` means `|I|=25` — because a literal `|` would split the table cell.

---

## 0.2 Glossary — the Bitcoin side

Enough to read this document; not a tutorial. Terms are ordered so each depends only on earlier ones.

**Transaction.** The unit of the Bitcoin ledger. It *consumes* some existing outputs (its **inputs**)
and *creates* new ones (its **outputs**). Nothing else happens on the chain.

**Output / TXO** (transaction output). A discrete parcel of coin, created by exactly one transaction
and destroyed by at most one later transaction. **This is what a node in this graph is.** Outputs of
one transaction are numbered `vout = 0, 1, 2, …` — which is why `O(T)` is a contiguous interval here.

**Input.** A reference from a transaction back to an older, still-unspent output. **This is what an
arc is.** An input is not a separate object on the chain; it is a pointer.

**UTXO** (unspent transaction output). An output no transaction has consumed yet — the coins that
"exist" right now. In this graph: **out-degree 0**, 53,078,524 nodes (7.94 %).

**Coinbase.** The first transaction of every mined block. It has **no inputs** — it mints the block
reward out of nothing. In this graph: **in-degree 0**, 2,032,814 nodes. Because it is always the
*first* transaction in its block, coinbase outputs form a contiguous run at the start of each block's
ID range, which is how §5 recovers the time axis for free.

**Bitcoin block.** A batch of transactions committed to the chain roughly every 10 minutes, in a
strict order. **Block height** is its index (block 0 = January 2009). Node IDs here are assigned
`(block height, transaction index within the block, vout)`, which is why the graph is already
topologically sorted (§2).

**Block reward / subsidy.** The newly minted coins a miner pays itself in the coinbase transaction.

**Change output.** If you hold a 10-BTC output and want to pay 3 BTC, you must spend the *whole*
output: 3 BTC to the payee and ~7 BTC **back to yourself**. That second output is the change. It is
why `(1,2)` is 55.8 % of all transactions (§11) and why batchers show up as `10k + 1` outputs — *k*
payouts plus one change (§4.2).

**Peel chain.** Repeatedly spending the change: a big coin "peels off" one payment at a time,
each transaction consuming the previous one's change output. Appears here as chains of `(1,2)`
transactions — 136.7 M of them (§8), and the 101,158-long isthmus of §19 is one.

**Consolidation / sweep.** The opposite move: gather many small outputs into one
(`|I|` large, `|O|` = 1). Wallet software does this in fixed batch sizes, which is why input counts
spike on round numbers — 20, 25, 50, 100, 200 — and why nine transactions have **exactly** 20,000
inputs (§10, §23.3).

**Batching.** An exchange paying many customers in one transaction instead of many. Signature:
`|O| = k + 1` for round *k*, with a genuine change output at a fixed position (§21).

**CoinJoin / mixer.** Several parties co-sign *one* transaction that takes each of their coins as
inputs and emits **equal, interchangeable outputs**, so an observer cannot match input to output.
Signature: `|I| ≈ |O|`, no distinguished change position, and heavy recirculation. §17 and §21.3
identify exactly one such service in this ledger.

**Dust.** Outputs so small they cost more to spend than they are worth, so nobody ever spends them.
A **dust flood** / **stress test** creates millions of them to bloat the UTXO set — visible in §23
as a campaign whose outputs are **97.6 % unspent** to this day.

**Mempool.** The queue of transactions a node has heard about but that are not yet in a block.

**Ancestor limit** (`-limitancestorcount`). A node's *policy* cap on how many unconfirmed ancestors a
mempool transaction may have; the Bitcoin Core default became **25** in version 0.12 (early 2016).
It is a local policy, not a consensus rule — which is exactly why §22 sees it arrive as a staircase
of independent miner upgrades rather than a single cliff.

**CPFP** (child pays for parent). Spending your own unconfirmed output to attach a higher fee.
One reason long chains of transactions appear *inside a single block* (§18.3, §22).

**P2Pool.** A decentralised mining pool whose coinbase transaction pays every participating miner
directly, producing coinbase transactions with hundreds of outputs — the 8,604 coinbase runs of
length ≥ 64 in §5.

**SegWit commitment.** Since August 2017 a block's coinbase carries an extra `OP_RETURN` output
committing to witness data — which is why the last coinbase runs in §5 all have length exactly 2.

**txid / address / satoshi.** A transaction's hash, a payment destination, and the smallest unit of
value. **None of the three exist in this dataset.** Every claim in this document is derived from arc
structure alone, which is why operators are described by *shape* and never named.


---

## 1. FIRST LOOK — the graph is ID-ordered and forward-only

**What I did.** Loaded `pg` random-access and dumped the successor lists of the
first 10 nodes, of 3 nodes at 1/4, 1/2, 3/4 of the ID range, and of the last 5 nodes.

```
node            0 outdeg      0 -> []
node            9 outdeg      2 -> [171, 172]
node    167065488 outdeg      1 -> [167680989]
node    334130976 outdeg      3 -> [334233088, 334233089, 334233090]
node    501196464 outdeg      1 -> [501263516]
node    668261952 outdeg      0 -> []
```

**Pattern (hypothesis, to be verified by a full scan):**

1. **Every arc points forward in node-ID space** (`v > u`). If this holds
   globally the graph is a **DAG already given in topological order** — exactly
   what you get when Bitcoin entities are numbered in blockchain/temporal order
   and an arc means "value flows from an earlier object to a later one".
2. **Successor lists contain runs of consecutive IDs** (`334233088, 334233089,
   334233090`). The `.properties` file agrees: `intervalisedarcs=917,147,391`, i.e.
   **42.4% of all arcs live inside an interval** of consecutive destinations, and
   `avgbitsforintervals=3.082`. That is the fingerprint of a *fan-out to a block of
   consecutively-numbered children* — e.g. a transaction node pointing at the
   outputs it creates, which were allocated contiguous IDs.
3. The **low IDs are sinks/isolated** (`0..=8` have out-degree 0) while the
   **high IDs are also out-degree 0**. Two different reasons are likely
   (genesis-side vs. unspent-tip-side); the in-degree scan will separate them.

Next: full scan to confirm forward-only, and to get exact degree distributions.

---

## 2. CONFIRMED — the graph is a **DAG given in topological order**

**What I did.** Full parallel scan of all 668,261,953 nodes / 2,162,523,341 arcs
(`rayon` over 65 536-node chunks, `g.successors(u)` on the mmapped BvGraph;
2.5 s wall, ~4 min CPU on 112 cores). For every arc `u -> v` I classified
`v > u`, `v < u`, `v == u`.

```
forward (v > u) = 2,162,523,341     <- 100.000000 %
backward(v < u) =             0
self-loops      =             0
```

**Pattern.** *Not one* arc goes backwards. So:

* the graph is **acyclic** — no SCC of size > 1 exists, no cycle-finding needed;
* the identity permutation is already a **topological sort**;
* node IDs carry a **total temporal order**. For a Bitcoin artefact this means
  IDs were assigned in blockchain order (block height, then position in block).

Practical consequence: any DP over the DAG (reachability, longest path, value
flow, ancestor counts) can be done in **one linear sweep in ID order**, no
visit machinery needed. That is worth knowing before running anything expensive.

---

## 3. THE BIG ONE — every successor list is **one contiguous interval**

**What I did.** In the same scan I decomposed each successor list into maximal
runs of consecutive IDs and histogrammed (a) the number of runs per node, (b) the
run lengths, (c) all "inner" gaps `v_i - v_(i-1)`.

```
--- #maximal consecutive runs per node ---
runs   1:     615,183,429        <- and NOTHING else. no node has 2+ runs.

--- inner gaps (v_i - v_(i-1)) ---
gap == 1 : 1,547,339,912   (= 100.000 % of all 1,547,339,912 inner gaps)
gap  > 1 : 0
```

`615,183,429` is exactly the number of nodes with out-degree > 0.

**Pattern.** For **every** node `u` with out-degree `d > 0`:

```
succ(u) = { s_u , s_u + 1 , s_u + 2 , ... , s_u + d - 1 }      exactly.
```

The whole 2.16-billion-arc graph is therefore *losslessly* described by two
numbers per node — `(start, length)` — i.e. **~5 GB of intervals, and nothing
else**. There is zero "irregular" adjacency anywhere in the graph. This is why
BvGraph compresses it to 8.99 bits/link with `intervalisedarcs = 917 M` and
`avgbitsforintervals = 3.08`.

**How to read it.** A node's out-neighbourhood is *a block of consecutively
allocated objects*. The natural generative story: `u` is consumed by some event
`T`, and `T` **creates a contiguous run of new nodes**; `u` points at all of them.
In Bitcoin terms: **node = transaction output (TXO); arc `u -> v` = "output `u`
was spent by the transaction that created output `v`"**. The outputs of one
transaction were numbered consecutively, hence the interval. Everything below
tests that model.

### 3.1 Degree distribution = the shape of Bitcoin transactions

`out-degree(u)` under that model is *the number of outputs of the transaction
that spent `u`*, and it reproduces the textbook Bitcoin output-count profile:

| out-deg | # nodes | share | reading |
|---|---|---|---|
| 0 | 53,078,524 | 7.94 % | **unspent** (UTXO / unspendable) |
| 1 | 136,486,476 | 20.42 % | sweeps / consolidations, no change |
| **2** | **405,920,772** | **60.74 %** | **payment + change — the canonical tx** |
| 3 | 22,298,825 | 3.34 % | |
| 4 | 5,929,845 | 0.89 % | |
| 5..20 | ~1–4 M each | | smooth decay |
| **21** | **10,812,004** | **1.62 %** | **anomalous spike, see §4** |
| 22..∞ | decaying | | |
| max | **13,107** | | one single node, id 300,889,132 |

The 60.7 % mass on degree exactly 2 is the single most recognisable fingerprint
of a Bitcoin spend graph (pay-to-someone + change-back-to-self).

### 3.2 Distance to the block: a bimodal "time-to-spend" curve

Histogram of the **first gap** `s_u - u` (how far ahead in ID space the spending
event lies) is strongly bimodal on a log scale:

```
gap [2^0 .. 2^1) : 22,424,860     <- spent immediately, next few IDs
gap [2^1 .. 2^2) : 16,011,216
gap [2^2 .. 2^8) : ~4 M per octave   (flat valley)
gap [2^13..2^16) : ~44.5 M per octave <- the mode
gap [2^28..2^29) :  3,193,157
gap [2^29..2^30) :    266,761      <- spent ~half a graph later
```

Two populations: a sharp **"spent within the same block / next few objects"**
peak at gaps 1–3, and a broad log-normal-ish bulk peaking around gap 2^14–2^15
(~30 000 objects ahead). The first peak is chained/immediate spending (child-pays-
for-parent, exchange internal shuffles, peel chains); the bulk is ordinary
coins sitting idle for a while. The tail reaches 2^30 — coins dormant across a
third of the whole history.

---

## 4. THE GLOBAL STRUCTURE — an exact decomposition into 245 M **bicliques**

**What I did.** For every node `u` with out-degree > 0 I recorded the pair
`(s_u, d_u)` = (first successor, out-degree). Then, in an atomic array indexed by
`s`, I (a) checked that all nodes sharing a start also share the length,
(b) counted the multiplicity of each start, (c) painted the interval
`[s, s+len)` into a coverage array to test whether the intervals overlap.

```
length conflicts at same start        = 0            <-- lengths are a function of the start
distinct successor-intervals (blocks) = 244,930,113
sum of block lengths                  = 666,229,139
sum of len * multiplicity             = 2,162,523,341  == m exactly
coverage: nodes in 0 blocks = 2,032,814
          nodes in exactly 1 block = 666,229,139
          nodes in >=2 blocks = 0          max coverage = 1
```

**Pattern — this is the whole topology, exactly:**

> The 668 M nodes are **partitioned** into 244,930,113 intervals `O(T)` (plus
> 2,032,814 leftover nodes). Each interval `O(T)` has a set of "parents" `I(T)`,
> and the arc set is **exactly** the disjoint union of the complete bipartite
> graphs
> `I(T) x O(T)`.
>
> `E = ⨆_T  K_{|I(T)|, |O(T)|}` — 244,930,113 edge-disjoint bicliques,
> with the O-sides tiling the vertex set contiguously.

That "sum of len·mult == m" line is the proof: no arc lives outside a biclique,
and no biclique overlaps another. Every node in a block has **identical
in-neighbourhoods** and **identical in-degree**. There is no other structure in
this graph — clustering coefficient, motif counts, community structure are all
*determined* by the (|I|,|O|) profile and by which older nodes each block picks
as parents.

### 4.1 Ground truth: this is the Bitcoin **UTXO spend graph**

The head of `pg.txt` (the arc list) settles the semantics against history:

```
9 171
9 172
171 193673
172 184
172 185
```

Node `9` is the only node in `0..=9` with out-degree > 0; nodes `0..=8` are
sinks. Block 9's coinbase output is precisely the 50 BTC that Satoshi spent in
**block 170 — the first Bitcoin transaction ever**, 1 input → 2 outputs
(10 BTC to Hal Finney, 40 BTC change). Those two outputs are nodes `171, 172`,
and `172` (the change) is spent again in block 181 into nodes `184, 185`. It
matches the real chain exactly.

So the dictionary is:

| graph object | Bitcoin object |
|---|---|
| node `v` | a **transaction output (TXO)**, numbered in blockchain order |
| block `O(T)` = interval | the **output set of one transaction** `T` |
| `I(T)` = parents of the block | the **input set** (the TXOs `T` spends) |
| arc `u -> v` | "TXO `u` was consumed by the tx that created TXO `v`" |
| out-degree(`u`) | number of outputs of the tx that spent `u` |
| in-degree(`v`) | number of inputs of the tx that created `v` |
| **out-degree 0** | **unspent — the UTXO set: 53,078,524 nodes (7.94 %)** |
| **in-degree 0** | **coinbase outputs (newly minted): 2,032,814 nodes (0.30 %)** |
| # blocks | **244,930,113 non-coinbase transactions** |

The graph is therefore the *transaction-level* Bitcoin ledger, losslessly, in
~2.4 GB.

### 4.2 Outputs per transaction |O(T)| — and the **"batch + change" combs**

```
|O| = 1 :  29,610,210   (12.1 %)
|O| = 2 : 195,103,097   (79.7 %)   <-- pay + change
|O| = 3 :  10,235,168
|O| = 4 :   1,960,112
...
```

79.7 % of all transactions have exactly two outputs. But the tail is not smooth —
it has sharp, isolated **spikes at 11, 21, 41, 51, 61, 101**:

| \|O\| | count | neighbours | ratio |
|---|---|---|---|---|
| 10 | 294,634 | | |
| **11** | **532,286** | 294,634 / 177,438 | **~2.3x** |
| 20 | 146,134 | | |
| **21** | **660,257** | 146,134 / 110,756 | **~5.1x** |
| **41** | 37,771 | 11,477 / 20,779 | ~2.3x |
| 50 | 51,887 | | |
| **51** | **209,271** | 51,887 / 5,801 | **~7.2x** (36x vs |O|=52) |
| **61** | 17,204 | 4,001 / 3,238 | **~4.7x** |
| **101** | 67,231 | (100 is < 20 k) | large |

**Pattern: `|O| = 10k + 1`.** Those are **exchange / payment-processor batch
payouts**: pay *k* round-numbered customers in one transaction, plus **one change
output**. The +1 is the tell — the change output is what turns 10/20/50/100 into
11/21/51/101. Nothing else in the distribution produces spikes on that lattice.
(`|O| = 51` at 7.2x its neighbours and 36x `|O| = 52` is the sharpest single
anomaly in the whole degree profile.)

Largest blocks: max `|O| = 13,107` (one transaction), 3 transactions in
`[2^13, 2^14)`, 827 in `[2^12, 2^13)`.

### 4.3 Inputs per transaction |I(T)| — round-number **consolidation combs**

```
|I| = 1 : 166,299,586   (67.9 %)
|I| = 2 :  42,398,598   (17.3 %)
|I| = 3 :  13,136,146
|I| = 4 :   7,084,100
```

Two-thirds of all transactions spend a **single** input. Again the tail carries
spikes, but on a *different* lattice — the **round numbers themselves**, with no `+1`:

| |I| | count | neighbours |
|---|---|---|---|
| **20** | 317,468 | 210,586 / 182,553 |
| **25** | 217,816 | 116,728 / 113,042 |
| **30** | 105,648 | 79,644 / 75,241 |
| **40** | 58,326 | 30,786 / 31,805 |
| **50** | 29,077 | 18,704 / 18,162 |
| **100** | 89,321 | (large spike) |
| **200** | 31,270 | |
| max | **20,000** | exactly, at block start 230,725,307 |

**Pattern: consolidation/sweeping software with a hard-coded input cap.** Wallets
that sweep dust "N inputs at a time" produce exactly these spikes at
20/25/30/40/50/100/200. And the single largest transaction in the whole ledger
spends **exactly 20,000 inputs** — a round software limit, not an accident.

The asymmetry is the interesting bit: **outputs cluster at `10k+1` (batching pays
out and keeps change), inputs cluster at `10k` (consolidation has nothing to keep
back).** Two different automated behaviours, visible purely from degrees.

---

## 5. The **temporal segmentation** hidden in the node IDs

**What I did.** In-degree-0 nodes = coinbase outputs. Since a block's coinbase is
its *first* transaction, those nodes form a **contiguous run at the start of each
block's ID range**. I painted the covered nodes into a bitmap and scanned for
maximal runs of uncovered nodes.

```
maximal runs of in-degree-0 nodes = 392,047
total in-degree-0 nodes           = 2,032,814
run-length histogram: len 1 : 333,902   len 2 : 35,233   len 3 : 3,861
                      len>=64: 8,604  (these hold ~1.38 M of the coinbase outputs)
first runs: (0,171) (173,11) (186,1) (189,1) (192,4) (197,34) (232,27) (261,248) ...
last runs : (668219989,2) (668224272,2) ... (668257853,2)
```

**Pattern — the runs are block boundaries, and they check out against history:**

* the very first run is `(start=0, len=171)`: nodes `0..170` are the coinbase
  outputs of **blocks 0…170**, one each, all unspent except node 9 — exactly the
  real chain, where block 170 is the first block containing a non-coinbase
  transaction. The second run `(173, 11)` = blocks 171…181 all empty, and the
  next transaction outputs are `184,185` — matching the real spend of node `172`.
* **the last runs all have length exactly 2** — the modern coinbase shape:
  *block reward output + segwit witness-commitment `OP_RETURN`*.
* **8,604 runs of length ≥ 64**, holding ~1.38 M coinbase outputs (~160 outputs
  each on average): these are **P2Pool blocks**, whose coinbase pays every share
  holder directly. They are the only reason the coinbase-output count (2.03 M) is
  5x the run count.

So node ID ordering is `(block height, tx index in block, output index)`, and
runs of in-degree-0 nodes give a free, exact **time axis** — no external metadata
needed. (Runs merge across *empty* blocks, so 392,047 is a lower bound on block
height; combined with 244.9 M non-coinbase transactions and a 53.1 M UTXO set,
the snapshot sits at roughly block ~475 k, i.e. **mid-2017**.)

### 5.1 The ledger's growth curve, read off the graph alone

Bucketing the ID axis into 400 equal slices (each 1.67 M outputs):

| node range | outs/tx | ins/tx | % of tx with O=2 | unspent % | reading |
|---|---|---|---|---|---|
| 0 – 17 M | 2.09 | 1.75 | 74.2 | 9.7 | 2009–2011, tiny blocks, many empty |
| 17 M – 50 M | ~2.5 | ~2.2 | **90–92** | 7.2 | 2011–2012, maximally "canonical" era |
| 83 M – 150 M | ~3.1 | ~2.9 | 76–81 | ~5 | 2013–2014, richer transactions |
| 210 M – 250 M | **3–13** | 2.0–4.8 | **36–80** | up to **56** | the anomaly zone, §6 |
| 300 M – 668 M | ~2.5 | ~2.4 | 77–82 | 7.5 → 14 | 2016–2017, steady state |

Two things stand out: (a) the `|O| = 2` share peaks at **92 %** around node 17–33 M
and never returns there — the ledger was at its most "one payment + change"
uniform in 2011–2012; (b) the unspent fraction rises monotonically toward the end
of the ID axis (7 % → 14 %) exactly as it must, since recent outputs have had
less time to be spent. Any deviation from that monotone ramp is a red flag — and
there is a huge one.

---

## 6. ANOMALY — two distinct **spam / batching campaigns**, visible as degree spikes localised in time

> **[SUPERSEDED IN PART III — see §23.]** The measurements below are all correct, but the
> *reading* of them is not. There are **two disjoint flood campaigns** in this window, not one
> flood followed by its clean-up. The sweep wave of §6 consumes `|O|=101` dust **below chance
> (0.58x baseline)**; what it actually eats is a different campaign's output.

**What I did.** Zoomed the ID axis to nodes 210 M – 250 M in 1 M-node buckets and
tracked, per bucket, the fraction of transactions with `|O| = 21 / 51 / 101` and
the fraction of outputs that are **never spent**.

```
bkt  first_node    txs  outs/tx ins/tx  %|O|=2 %|O|=51 %|O|=101 %|O|>=20 unspent%
  7   217000000  129487    7.72   2.21   42.79   0.002    3.145   11.247   56.05   <-- A
  8   218000000  157278    6.36   2.11   42.25   0.004    2.057    9.161   42.15   <-- A
  9   219000000  190397    5.25   2.03   36.43   0.003    2.033    5.120   45.35   <-- A
 10   220000000  275769    3.62   4.76   72.09   0.019    0.257    3.366   10.12   <-- sweep
 11   221000000  359544    2.78   4.56   70.55   0.012    0.022    1.545    4.92   <-- sweep
 16   226000000   74481   13.42   3.36   61.17  18.709    0.003   23.311    2.06   <-- B
 19   229000000   93621   10.68   2.55   67.61  14.322    0.003   17.860    2.01   <-- B
 21   231000000   81441   12.27   3.10   64.69  15.695    0.006   19.782    3.04   <-- B
 23   233000000   77014   12.98   2.82   62.91  18.141    0.004   22.241    2.11   <-- B
 26   236000000   94736   10.55   2.85   66.78  14.100    0.004   17.562    2.24   <-- B
(baseline elsewhere:  outs/tx ~2.8, %|O|=51 ~0.005, %|O|=101 ~0.02, unspent ~5)
```

### Campaign A — a **dust flood** (nodes ≈ 217 M – 220 M)

* `|O| = 101` transactions jump from a 0.02 % baseline to **3.1 %** — a **~150x**
  enrichment, concentrated in a 3 M-node window.
* Mean out-degree per tx explodes to **7.7** while mean in-degree *drops* to
  **2.2** — pure fan-out, no consolidation.
* The decisive tell: **56 %, 42 %, 45 % of the outputs created in that window are
  still unspent** — against a 5 % baseline for that era. Nobody ever picked them
  up.

That is the fingerprint of a **dust-spam / stress-test attack**: many
identically-shaped 101-output transactions spraying economically-unspendable
amounts into the UTXO set. It is *the* single largest deviation from the
background in the entire 668 M-node ID axis.

### The sweep that follows (nodes ≈ 220 M – 222 M)

Immediately after, `ins/tx` spikes to **4.76 / 4.56** (baseline ≈ 2.7) while
`outs/tx` collapses to 2.8 and the unspent fraction returns to normal. This is
the **clean-up wave**: wallets and miners consolidating the surviving dust back
into normal outputs. Flood → sweep is legible as a two-phase signature in the
degree time-series, with no external data at all.

### Campaign B — a **sustained 50-way batch payout** (nodes ≈ 226 M – 237 M)

* `|O| = 51` transactions go from a **0.005 %** baseline to a sustained
  **10 – 19 %** of *all transactions* over an 11 M-node window — a **~3000x**
  enrichment, the sharpest concentration found anywhere in the graph.
* But here the unspent fraction stays at the floor (**~2 %**) and `ins/tx` is
  normal (2.8–3.4).

So this is *not* spam: it is a single high-volume service emitting
**50 payouts + 1 change** per transaction, month after month — an exchange,
faucet or gambling-payout batcher. Same `10k+1` lattice as §4.2, but here one
operator is large enough to dominate a whole era of the ledger.

A third, milder episode sits at nodes 246 M – 248 M (`%|O| >= 20` = 16 % / 24 %,
unspent 0.4–0.8 %) — another batcher, different output size.

---

## 7. The graph is **astonishingly deep** — a 2.17-million-hop spine across the whole history

**What I did.** Because the graph is a DAG in ID order (§2) and every
out-neighbourhood is an interval (§3), longest-path DP needs **no visit at all** —
just two linear sweeps over the ID axis:

* forward sweep → `depth[v]` = longest chain of transactions from *any coinbase*
  down to `v`;
* backward sweep → `height[u]` = longest chain from `u` forward to an unspent
  output.

Each block's max is memoised at its start, so the total work is `O(n)`, ~40 s.

**Sanity check against the real chain** (node 9 = block-9 coinbase, 171/172 = the
first transaction's outputs, …):

```
depth[9]=0  depth[171]=1  depth[172]=1  depth[184]=2  depth[185]=2  depth[187]=3  depth[190]=4
```
— exactly the hand-computed values. The DP is correct.

### 7.1 Result

```
MAX DEPTH  = 2,168,061 transaction hops
MAX HEIGHT = 2,168,061  , attained starting at node 84,564
```

Both extremes coincide: there is **one longest path of 2,168,062 nodes**, running
from node `84,564` (an output from very early in the chain) to node
`668,259,783` (essentially the last output in the snapshot). **A single
dependency chain spans the entire history of the ledger.**

Depth percentiles over all 668 M nodes:

| percentile | depth |
|---|---|
| p1 | 1 |
| **p5** | **758** |
| **p10** | **367,419** |
| p25 | 835,234 |
| **p50** | **1,477,293** |
| p75 | 1,885,606 |
| p90 | 2,058,158 |
| p99 | 2,159,369 |
| p100 | 2,168,061 |

**Pattern — this DAG is "long and thin", not "wide and shallow".** The *median*
output sits **1.48 million transaction-hops** from freshly minted coins — 68 % of
the maximum possible depth — even though there are only 244.9 M transactions in
total. Nearly every coin in the ledger is a descendant of a chain that has passed
through more than a million transactions.

Note the **hard structural break between p5 and p10**: depth jumps from **758 to
367,419**. There is no smooth middle. Coins are either "still near the mint"
(~5–8 % of outputs: recent coinbase, freshly-minted, early-history) or they are
deep inside the circulating economy — nothing in between. The same break shows in
the UTXO set (p5 = 16, p10 = 289,647).

### 7.2 The spine is *locally* dense — chained transactions inside single blocks

Walking the longest path node by node and measuring how far each hop moves in
node-ID space:

```
spine hop gap: min 1   p25 2   median 3   p75 23   p95 1,224   max 2,313,071
```

**The median hop advances only 3 node IDs.** Since IDs are `(block, tx index,
vout)`, that means the next transaction in the chain is usually *the very next
transaction in the very same block*, spending the change output the previous one
just created. Half of the world-record dependency chain is built out of
**back-to-back same-block transaction chains** (unconfirmed-chain spending / CPFP
/ high-frequency wallets), stitched together by occasional long jumps (max hop
2.3 M IDs — a coin that sat idle for a long time).

Sampled every 5 % of the way, the spine's node IDs climb monotonically through
the whole ID range (84 k → 11.8 M → 60.9 M → 134.7 M → 218.0 M → 322.2 M →
469.6 M → 668.3 M), confirming it really does traverse the full history rather
than looping inside one era.

---

## 8. PEEL CHAINS — 55.8 % of transactions are 1-in/2-out, and they chain up to 25,343 deep

**What I did.** A *peel step* is a transaction with **exactly one input and
exactly two outputs** (`|I(T)| = 1, |O(T)| = 2`) — the canonical "peel a payment
off a big coin, keep the change" shape. In the biclique language of §4 that is a
block with `multiplicity = 1` and `length = 2`. I ran a reverse-order DP
`pl[u] = 1 + max(pl[first output], pl[second output])` restricted to peel steps,
giving the longest run of *consecutive* peel transactions reachable from every node.

```
1-in / 2-out transactions = 136,671,203   (55.80 % of all 244,930,113 transactions)

LONGEST PEEL CHAIN = 25,343 consecutive 1-in-2-out hops, starting at node 473,099,131

chains of length >=      2 :  91,537,787
chains of length >=     10 :  38,054,599
chains of length >=    100 :  10,564,647
chains of length >=  1,000 :   1,555,210
chains of length >=  5,000 :     156,228
chains of length >= 10,000 :      32,268
chains of length >= 20,000 :       5,344
```

**Pattern.** More than half of the entire Bitcoin ledger is the *same* elementary
motif, and those motifs **concatenate**: over 10.5 M nodes start a peel chain of
at least 100 steps, and **32,268 nodes start a peel chain of at least 10,000
steps**. The record is a single unbroken run of **25,343 peel transactions**
beginning at node 473,099,131.

The chain-length distribution decays close to a power law — the counts at
`L >= 10 / 100 / 1000 / 10000` are `38.1 M / 10.6 M / 1.56 M / 32.3 k`, i.e. each
10x in length costs roughly 3–5x in count up to L≈1000 and then steepens. That is
the classic signature of **automated peeling wallets** (exchanges, mixers,
payment processors paying out one customer at a time from a rolling change
output) rather than of independent human transactions, which would give an
exponential tail.

This motif plus the spine of §7 are the same phenomenon seen two ways: a
long-running service whose change output is respent immediately, over and over.

---

## 9. The transpose `pg-t` — the **asymmetry** is the whole story

**What I did.** Ran the same full scan on `pg-t`.

```
forward(v>u)=0   backward(v<u)=2,162,523,341   selfloops=0        <- mirror of §2, as it must be
nodes with in-degree > 0 = 666,229,139         <- exactly the 666,229,139 covered nodes of §4
in-degree 0              =   2,032,814         <- exactly the coinbase outputs

in-degree histogram:  1 -> 432,184,402 (64.67 %)   2 -> 101,856,527 (15.24 %)   3 -> 34,370,113
consecutive inner gaps (=1) = 89,540,795 / 1,496,294,202  =  5.98 %
#runs per predecessor list: 1 -> 433,902,015   2 -> 102,074,212   3 -> 34,207,536  ...  >=255 -> 76,668
```

**Pattern — the graph is maximally structured forward and unstructured backward.**
Out-neighbourhoods are **100 %** single intervals (§3); in-neighbourhoods are
single intervals only when the in-degree is 1. Restricting to transactions with
`|I| >= 2`:

```
transactions with |I| >= 2                            = 78,630,527
  ... whose input set is ONE contiguous ID interval    =    646,996   (0.823 %)
```

So **inputs are essentially arbitrary** — a transaction reaches back to a
scattered handful of older outputs, which is why `pg-t` needs `RESIDUALS_ZETA`
while `pg` gets away with pure intervals. The information content of the whole
ledger lives in *which* old outputs each transaction picks, not in its shape.

### 9.1 …but the 0.8 % of contiguous input sets are not random

Sizes of the fully-contiguous ("sweep a whole earlier batch") input sets:

```
|I| =  2 : 569,986      |I| = 11 : 1,513      |I| = 20 :  288
|I| =  3 :  41,326      |I| = 14 : 2,193      |I| = 21 :  159
|I| =  4 :  10,983      |I| = 15 : 5,002 <--  |I| = 25 : 2,082 <--
|I| =  5 :   5,412      |I| = 16 :    76      |I| = 50 :   961 <--
|I| = 12 :     290      |I| = 17 :   126      (neighbours ~10-30)
```

`|I| = 15`, `25`, `50` stand **20–70x above their neighbours**. These are
transactions that swallow *an entire earlier batch payout in one bite* — the
mirror image of the `10k+1` fan-outs of §4.2. Fan out 15/25/50 ways, then later
reel all 15/25/50 back in. Same operator on both sides.

---

## 10. The largest bicliques, and a **hard-coded 20,000-input limit**

```
--- transactions with the most inputs ---
block start 230,910,487  |I| = 20000  |O| = 1
block start 231,014,489  |I| = 20000  |O| = 1
block start 231,081,170  |I| = 20000  |O| = 1
block start 230,994,044  |I| = 20000  |O| = 1
block start 230,926,434  |I| = 20000  |O| = 1
block start 230,873,887  |I| = 20000  |O| = 1
block start 230,843,654  |I| = 20000  |O| = 1
block start 230,844,251  |I| = 20000  |O| = 1
block start 230,725,307  |I| = 20000  |O| = 1
block start 230,703,549  |I| =  9997  |O| = 1
block start 217,299,929  |I| =  7350  |O| = 1
block start 214,921,415  |I| =  5569  |O| = 1   (five distinct txs with exactly 5569)
block start 215,900,164  |I| =  5000  |O| = 1   (five distinct txs with exactly 5000)
```

**Pattern.** **Nine** separate transactions, all inside a 380 k-node window
(230.70 M – 231.09 M), each spending **exactly 20,000 inputs into 1 output**. A
number that round, repeated nine times back-to-back, is a **software limit**, not
a coincidence — one operator ran a dust-vacuum in a loop with a 20 000-input
batch size. The same signature repeats at 5,000 (x5) and 5,569 (x5).

Note where they sit: **right at the end of Campaign B** (§6, nodes 226 M–237 M).
The fan-out era is followed by the clean-up era, at 20,000 inputs a go.

The largest bicliques by arc count `|I| x |O|`:

```
start  75,551,394   |I|=235  |O|=1653   388,455 arcs
start  90,737,762   |I|=300  |O|=1256   376,800 arcs
start  90,739,018   |I|=300  |O|=1256   376,800 arcs   <-- 90,739,018 - 90,737,762 = 1256 exactly
start 156,167,817   |I|=543  |O|= 500   271,500 arcs
start 232,101,973   |I|=497  |O|= 500
start 224,707,371   |I|=245  |O|=1001
start  77,269,405   |I|=237  |O|=1001
start 204,255,026   |I|=414  |O|= 501
```

Two things: (a) the round `|O| = 500 / 501 / 1000 / 1001` values are the `10^k`
and `10^k + 1` lattice of §4.2 scaled up; (b) the pair at `90,737,762` and
`90,739,018` are **two identical `K(300, 1256)` bicliques whose output blocks are
exactly adjacent** — the same program emitted the same transaction twice in a row
in the same block.

That is a general motif: **1,725,413 pairs of adjacent transactions share an
identical `(|I|, |O|)` shape with `|O| >= 4`** — machine-emitted, back-to-back.

---

## 11. Only **15,378** distinct transaction shapes, and 3 of them are 78 % of the ledger

**What I did.** Counted transactions by their shape `(|I|, |O|)`.

```
(|I|=1, |O|=2) : 136,671,203   55.800 %   cumulative 55.800 %   <- peel / pay+change
(|I|=2, |O|=2) :  33,065,895   13.500 %   cumulative 69.300 %
(|I|=1, |O|=1) :  20,598,005    8.410 %   cumulative 77.710 %   <- forward / sweep
(|I|=3, |O|=2) :   9,676,604    3.951 %   cumulative 81.661 %
(|I|=4, |O|=2) :   5,720,998    2.336 %   cumulative 83.996 %
(|I|=2, |O|=3) :   4,900,580    2.001 %   cumulative 85.997 %
(|I|=1, |O|=3) :   3,624,360    1.480 %
(|I|=2, |O|=1) :   3,112,887    1.271 %
...
(|I|=1, |O|=11):     386,187    0.158 %   <- the batch-of-10 + change, still in the top 25

top 25 shapes  -> 94.868 %
top 50 shapes  -> 96.686 %
top 100 shapes -> 97.927 %
distinct shapes present -> 15,378
```

**Pattern.** The generative "vocabulary" of the whole 2.16-billion-arc graph is
tiny. **Three shapes account for 77.7 %** of all 244.9 M bicliques, 25 shapes for
94.9 %. Note also the strong `|O| = 2` column: for *every* `|I|` from 1 to 12,
the modal output count is 2 — the change-output convention is invariant to how
many inputs you gather.

The one shape that breaks the smooth decay inside the top 25 is
**`(1, 11)` = batch-of-10 + change**, sitting above `(1, 10)` (153,906) and
`(1, 12)` (98,015) by 2.5–4x. There is also a striking local bump at
**`(11, 11)` = 9,843** against `(11, 10) = 2,875` and `(11, 12) = 1,970` — an
11-in / 11-out shape emitted by some specific service.

---

## 12. Connectivity — one giant component, and 256,331 coins that never moved

**What I did.** Union–find over the undirected version, exploiting §4: for each
block I union its output interval together and union each of its inputs into it —
so ~1.28 G union operations with no graph access at all in the sequential phase.

```
weakly connected components = 258,087
largest component           = 667,989,823 nodes = 99.9593 %
second largest              =         391 nodes
nodes outside the giant component = 272,130 (0.0407 %)

component-size histogram (log2):
  size 1        : 256,331 components
  size [2,4)    :   1,029
  size [4,8)    :     393
  size [8,16)   :     151
  ...
  size [256,512):       5
  size [2^29,2^30):     1     <- the giant
```

**Pattern.** The ledger is **one economy**. 99.96 % of all outputs are weakly
connected, and the gap between the giant component (6.68 x 10^8) and the runner-up
(391) is **six orders of magnitude** — there is no second cluster, no meaningful
"separate economy", not even a large isolated exchange sub-ledger.

Everything outside the giant component is trivia, and almost all of it is one
thing:

```
isolated nodes (in-degree 0 AND out-degree 0) = 256,331
```

Those are **coinbase outputs that were mined and never spent** — 256,331 block
rewards that have never moved, 12.6 % of all 2,032,814 coinbase outputs. They are
graph-theoretically invisible: no ancestors, no descendants, no component. (This
is the population that includes the early never-moved mining rewards.)

---

## 13. The DAG is **2.17 million layers deep and ~150 nodes wide** — a filament, not a blob

**What I did.** Levelled the DAG by the `depth` of §7 and measured the width
(number of nodes) of each level.

```
levels = 2,168,062   (every single one occupied — no gaps)
width:  min 1   p25 62   median 149   p75 328   p95 1,074   p99 2,322   mean 308.2
widest level: depth 1, with 4,823,986 nodes  (everything spent straight off a coinbase)
```

**Pattern.** For a graph with 668 million nodes this is an absurd aspect ratio:
**2.17 M levels, median width 149**. Practically the entire ledger is a bundle of
long filaments running in parallel, not a broad shallow fan. And *every* one of
the 2,168,062 levels is occupied — the depth function is surjective, there is no
gap anywhere along the chain.

The width profile has a pronounced **waist**:

```
depth       0 ..   54,201 : mean width 685.2   (37.1 M nodes)
depth  54,201 ..  108,403 : mean width  77.6
depth 108,403 ..  162,604 : mean width  25.2   <-- narrowest
depth 162,604 ..  216,806 : mean width  33.1   <--
depth 216,806 ..  271,007 : mean width  97.6
depth 325,209 ..  379,410 : mean width 269.7
...
depth 1,897,054..1,951,255: mean width 675.2
depth 2,005,457..2,113,860: mean width ~640
```

Cross-referencing with the spine samples of §7.2: depths 108 k–217 k correspond to
node IDs ~11.8 M–15.3 M. So in a **3.5 M-node stretch of the ledger the longest
chain advanced by 108,000 hops** — chains were being extended far faster than new
outputs were being created. That early hyper-chaining episode is the bottleneck
that every deep coin in the graph must pass through: the DAG has a genuine
**hourglass waist ~25 nodes wide** at depth ~150 k. Everything below it is one
narrow strand of history.

---

## 14. The `10k+1` combs are **three different operators**, not one phenomenon

**What I did.** For the three anomalous output counts (`|O| = 11, 21, 51`) I
tabulated the *input*-count distribution and the position along the ID axis.

```
 |I|    |O|=11      |O|=21      |O|=51
   1    386,187      48,061     197,816     <- 11 and 51 are funded by ONE input
   2     48,210       8,634       3,257
   5      7,787       2,462         764
  10      3,499      10,214         345
  15      1,356      39,158         115
  17        877      55,268          87
  18        815      58,248 <-mode    73
  19        729      57,424          68
  20         -       53,178          -
  23         -       42,501          -
  25         -       12,479          -
```

**Pattern — same output lattice, opposite input behaviour:**

* **`|O| = 11` and `|O| = 51`** are overwhelmingly **`|I| = 1`** (58 % and 30 %
  of their class, decaying monotonically). These are **peel-style batchers**: one
  big rolling change output funds 10 (or 50) payouts plus the next change. They
  are the large-scale version of the `(1,2)` peel motif of §8.
* **`|O| = 21` is completely different** — its input count has a **broad mode at
  `|I| = 18`** (58,248) with a hump spanning `|I| = 13..25`, i.e. **`|I| ≈ |O|`**.
  Fixed 21 outputs, variable ~20 inputs, gathered from scattered older coins:

```
example: block start 16,880,894   |O| = 21   |I| = 20
  inputs: 14144381, 16325571, 16569506, 16696995, 16728530, 16728840, 16796132,
          16813861, 16826054, 16826124, 16853034, 16859415, 16860099, 16860103,
          16860105, 16860107, 16860187, 16860215, 16860227, 16860257
  out-degrees of the 21 outputs: [2,2,2,1,29,2,2,1,2,2,0,2,2,2,1,1,2,2,2,2,2]
```

  Note the inputs: a scattered tail plus a **tight cluster of 8 consecutive-ish
  IDs around 16,860,1xx** — coins gathered from one recent block. The 21 outputs
  then go on to be spent completely normally (mostly out-degree 2). That is
  either a **20-payee payout batcher that funds itself from ~20 UTXOs each run**,
  or a **CoinJoin/mixing-service** shape (`|I| ~ |O|`, many participants). The
  *rigidly fixed* `|O| = 21` against a *broad* `|I|` favours the batcher reading —
  a mixer would vary both.

**Temporally they are also distinct.** The `|O| = 21` class is sharply confined:

```
slices  0.. 8 (nodes 0..150 M)      :  ~1-8 k each
slices  9..21 (nodes 150 M..367 M)  :  27 k - 68 k each   <-- the operator's active life
slices 22..39 (nodes 367 M..668 M)  :  ~2-4 k each        <-- switched off
```

It switches on around node 150 M, runs for ~217 M outputs, and switches off
abruptly at node ~367 M — an operator with a beginning and an end, recoverable
from nothing but out-degree counts.

---

## 15. Summary — the complete structural description

Putting §2–§14 together, the graph is **fully characterised** by:

1. **A DAG in topological ID order.** 2,162,523,341 / 2,162,523,341 arcs point
   forward. No cycles, no self-loops, no SCCs. (§2)
2. **Every out-neighbourhood is one contiguous interval.** 615,183,429 non-sink
   nodes, 615,183,429 single runs, zero inner gaps > 1. (§3)
3. **Therefore the arc set is exactly a disjoint union of 244,930,113 complete
   bipartite graphs** `K(|I|,|O|)`, whose O-sides *partition* the vertex set
   (666,229,139 nodes covered exactly once, 2,032,814 uncovered). Verified by
   `Σ |I|·|O| = m` to the arc. (§4)
4. **The uncovered nodes are the mint events** and their runs recover the block
   structure — a free time axis. (§5)
5. Everything else — degree distributions, motif counts, communities — is a
   consequence of (a) the `(|I|,|O|)` shape vocabulary (15,378 shapes, 3 of which
   are 78 % of the ledger, §11), and (b) which older nodes each block chooses as
   parents (essentially unstructured, §9).

**The findings that are *not* implied by the construction** — i.e. the real
discoveries:

| # | pattern | evidence |
|---|---|---|
| §4.2 | output counts spike on the **`10k+1` lattice** (11, 21, 41, 51, 61, 101) | up to 36x the neighbouring bin |
| §4.3 | input counts spike on the **`10k` lattice** (20, 25, 30, 40, 50, 100, 200) | consolidation software |
| §6 | a **dust flood** at nodes 217–220 M | `%O=101` 150x baseline; **56 % of outputs never spent** |
| §6 | its **sweep-up wave** at 220–222 M | ins/tx 4.76 vs 2.7 baseline |
| §6 | an **11 M-node batch-payout era** at 226–237 M | `%O=51` = 10–19 % of *all* tx, ~3000x baseline |
| §7 | a **2,168,062-node dependency spine** across the whole history | node 84,564 → 668,259,783 |
| §7 | **median output is 1.48 M hops deep**; hard break between p5 (758) and p10 (367,419) | |
| §7.2 | the spine's **median hop is 3 node IDs** — same-block chained spending | |
| §8 | **136.7 M peel transactions (55.8 %)**, longest unbroken **peel chain 25,343** | 32,268 chains ≥ 10,000 |
| §9.1 | contiguous "swallow the whole batch" inputs spike at **I = 15, 25, 50** | 20–70x neighbours |
| §10 | **nine transactions with exactly 20,000 inputs**, all in a 380 k-node window | hard software cap |
| §10 | **1,725,413 back-to-back twin transactions** with identical shape | machine-emitted |
| §12 | **one economy**: giant WCC 99.9593 %, runner-up **391 nodes** | 6 orders of magnitude gap |
| §12 | **256,331 mined coins that never moved** (isolated nodes) | 12.6 % of all coinbase outputs |
| §13 | DAG aspect ratio **2.17 M levels x median width 149**, with an **hourglass waist of width ~25** at depth ~150 k | |
| §14 | the `O=11/21/51` combs are **three distinct operators** with opposite input behaviour, and the `O=21` one **switches off** at node ~367 M | |

### Practical consequences for anyone computing on this graph

* **Never run a generic SCC / cycle detection** — §2 makes it trivially the
  identity partition.
* **Never run a generic BFS/DFS for reachability, distances or DP.** §3 means all
  of it collapses to *linear sweeps in ID order* with per-block memoisation: the
  longest-path DP over 2.16 G arcs takes **40 seconds single-threaded**.
* **Store the graph as `(start, length)` pairs** if you need random access in
  your own code — it is exact and needs no decoder.
* **Don't run community detection expecting communities.** §12: there is one
  component and nothing else. The meaningful partition is by *transaction shape*
  and *time*, not by cut.
* Careful with **degree-based heuristics** — the degree distribution is not a
  natural process; it is a superposition of a few pieces of payout software with
  hard-coded batch sizes (§4.2, §4.3, §10, §14).

---

## 16. Method / reproduction

Probe crate (standalone, path-depends on this working copy of `webgraph-rs`):
**`/home/mnocentini/Developer/working-copies/pgprobe`** — with the raw output of
every run alongside it (`scan_pg.txt`, `blocks.txt`, `depth.txt`, `spine.txt`, …).

```
cd /home/mnocentini/Developer/working-copies/pgprobe && cargo build --release
./target/release/pgprobe  <basename>   # full degree/gap/run scan of any BvGraph
./target/release/blocks                # interval partition + biclique verification
./target/release/segments              # coinbase runs -> block segmentation
./target/release/series                # 400-bucket temporal series
./target/release/zoom <lo> <hi> <n>    # zoom the ID axis
./target/release/depth                 # depth / height / peel-chain DP
./target/release/spine                 # percentiles + longest-path extraction
./target/release/tx                    # joint (|I|,|O|), top bicliques, input contiguity
./target/release/shapes                # shape vocabulary, twins, isolated nodes
./target/release/wcc                   # union-find connectivity
./target/release/width                 # DAG layer widths
./target/release/o21                   # the |O|=21 operator
```

All measurements are **full scans, no sampling**. Wall-clock on 112 cores with
the graph mmapped: 2.5 s for a full arc scan, 5 s for the biclique
decomposition, 35–48 s for the sequential DP passes.

### Caveats

* Node semantics (TXO) are inferred from the graph plus the first arcs of
  `pg.txt` matching the real chain (block 170's transaction); there is no
  txid/address metadata in this dataset, so **entity-level** claims (which
  exchange, which mixer) are shape-based inference, not identification.
* The block count 392,047 is a **lower bound** on chain height (runs merge across
  empty blocks); the "mid-2017" dating is inferred from 244.9 M transactions +
  53.1 M UTXOs + a 2-output modern coinbase, not from timestamps.
* `|O| = 21` as batcher-vs-CoinJoin (§14) is the one genuinely ambiguous call
  in this document; value data would settle it, and this graph has none.

*End of log.*

---

# PART II — deeper dives

## 17. The `|O| = 21` operator, resolved: it is a **self-recycling mixer**, not a payout batcher

§14 left this open. Four independent tests settle it.

### 17.1 Test 1 — positional structure of the outputs (the decisive one)

A *batcher* has a **change output**: one distinguished position that is respent
quickly, and respent by another transaction of the same class. A *CoinJoin /
mixer* has **equal, indistinguishable outputs**: no position is special.

For every transaction in each class I measured, **per output position `j`**, the
unspent rate, the rate of being consumed by another transaction of the same
class, and the mean ID gap to the spend.

```
|O| = 11                                 |O| = 51
 pos  unspent%  ->|O|=11%   mean gap      pos  unspent%  ->|O|=51%   mean gap
   0   7.571      6.640    11,928,580       0   4.683     1.516    120,922,994
   5   6.564      6.446    11,656,291      25   4.595     1.461    120,804,790
   9   6.593      6.717    11,669,133      49   4.647     1.488    121,022,186
  10   5.922     15.560    10,382,314 <--  50   3.176     6.858    117,663,620 <--
```

Both have a **clearly distinguished last position**: position 10 of an `|O|=11`
transaction returns into the class at **15.56 %** against 6.4–6.7 % for the other
ten (**2.4x**), and position 50 of an `|O|=51` transaction at **6.86 %** against
~1.47 % (**4.6x**), with a shorter gap and a lower unspent rate in both cases.
**Confirmed: `|O| = 11` and `|O| = 51` are "batch of 10/50 + change", and the
change is the last output.**

Now `|O| = 21`:

```
 pos   unspent%   ->|O|=21%    mean gap    spent within 1000 IDs%
   0     1.211      62.175     1,052,466        47.761
   1     1.187      62.168     1,064,990        47.743
   ...      ...        ...          ...            ...
  18     1.136      62.103     1,014,002        47.661
  19     1.136      62.161     1,008,798        47.621
  20     0.815      63.333       776,986        48.859
```

**All 21 positions are statistically identical** *(qualified in §25.1: positions 0–19 are
identical, but position 20 is distinguishable at +23.5 σ / −25.6 σ with a 2.3 % effect size —
against 2.4x and 4.6x for the two real batchers, so the verdict stands)*. Unspent rate 1.11–1.21 %,
return rate 62.02–62.20 %, mean gap 1.01–1.06 M, immediate-spend rate
47.5–47.8 %. Position 20 is barely distinguishable (63.3 % vs 62.1 %) — nothing
like the 2.4x / 4.6x change signature of the other two classes. **There is no
change output. The 21 outputs are interchangeable.** That is the definition of an
equal-output join.

### 17.2 Test 2 — the self-affinity spectrum (a control over every output size)

For every output size `L`, what fraction of an `|O|=L` transaction's inputs were
created by another `|O|=L` transaction, against the baseline share of arcs that
class holds?

```
  L  |    #tx     | inputs from |O|=L | outputs to |O|=L | baseline | in-enrich | unspent%
  19 |     131363 |     7.988%        |     4.126%       | 0.0575%  |    139x   |   3.61%
  20 |     146134 |     7.037%        |     3.375%       | 0.0606%  |    116x   |   6.48%
  21 |     660257 |    78.835%        |    62.180%       | 0.5000%  |    158x   |   1.13%   <===
  22 |     110756 |     9.609%        |     2.859%       | 0.0325%  |    296x   |   3.13%
  23 |      90326 |     8.162%        |     2.832%       | 0.0261%  |    312x   |  21.61%
```

Against its immediate neighbours `|O| = 20` and `|O| = 22`, class 21 has **8–11x
the raw self-feeding rate**, and it has **the lowest unspent rate of any output
class in the entire graph (1.13 %)** — every coin it makes gets used again.
Nothing sits still inside this system.

The spectrum also exposes the other operators, cleanly separated from the smooth
background (~1–5 % self-feeding):

```
L=11: 24.6 % (326x)   L=14: 41.0 % (688x)   L=35: 22.7 % (3828x)   L=42: 16.4 % (1302x)
L=41:  9.7 % (1223x)  L=50: 39.2 % (3064x)  L=51: 50.2 % (3362x)   L=31:  5.9 % (499x)
```

### 17.3 Test 3 — the input count of the *consumers* (`|I| ~ |O|`)

Splitting the consumers of an `|O|=21` output by whether they are themselves in
the class:

```
  |I|   consumer is |O|=21   consumer is NOT |O|=21
    1             11,222              395,242
    5                774              411,751
   10             69,876              142,089
   15            477,057               46,519
   18            878,976               42,055
   19            912,715  <-- mode      44,866
   20            889,168               48,376
   21            796,274               41,513
   25            202,564              463,293
```

Inside the system the consumer's input count is **sharply peaked at `|I| = 19`**
with a tight symmetric hump over 15–24 — i.e. **`|I| ≈ |O| ≈ 20`, a balanced
join**. Outside the system the same outputs are consumed by transactions with a
completely different, dispersed `|I|` (modes at 1, 5 and 25). The balanced shape
is a property of the *system*, not of the coins.

### 17.4 Test 4 — flow accounting: it recirculates, it does not distribute

```
|O|=11 : inputs 1,631,461 (400,798 internal) ; 5,067,431 outputs leave  -> ext_out/ext_in = 4.12
|O|=51 : inputs   322,922 (162,139 internal) ; 10,021,600 outputs leave -> ext_out/ext_in = 62.33
|O|=21 : inputs 10,812,004 (8,523,609 internal, 2,288,395 external)
         outputs 13,865,397 (157,332 unspent, 8,523,609 internal, 5,184,456 leave)
                                                        -> ext_out/ext_in = 2.27
```

`|O| = 51` is a **distributor**: 160 k coins in, 10.0 M coins out, a 62x fan-out,
almost nothing recirculating. `|O| = 21` is the opposite: **8.52 M of its 13.87 M
outputs (61 %) never leave the system at all** — they are immediately re-joined.
Only a 2.27x split. It is a closed loop with a slow drip in and out.

### 17.5 The shape of the loop

```
LONGEST in-class chain = 394,638 hops  (touches 59.8 % of the whole class),
                         starting at node 152,191,764
  chain >=  10,000 rounds : 531,748 tx (80.5 %)
  chain >= 100,000 rounds : 411,104 tx (62.3 %)
  chain >= 300,000 rounds : 131,208 tx (19.9 %)

in-class weakly connected components = 76,000
  largest = 549,191 transactions = 83.18 % of the class
  runners-up = 1,524 / 754 / 483 / 455 / 450
  isolated  = 66,487
```

**83 % of all 660,257 `|O|=21` transactions are one connected system, and a single
unbroken chain runs through 394,638 of them.** For comparison, the longest peel
chain in the *entire* rest of the ledger (§8) is 25,343. This one subsystem has a
recycling chain **15x longer** than the largest peel chain anywhere else.

### 17.6 It has a birth and a death

```
core density along the ID axis (transactions taking >=1 input from the class):
  slice  8 (node 133 M) :   3,186
  slice  9 (node 150 M) :  58,778   <-- switched ON
  slice 10 (node 167 M) :  67,646
  ...
  slice 21 (node 351 M) :  28,076
  slice 22 (node 368 M) :   1,526   <-- switched OFF (18x cliff)
  slice 23 (node 384 M) :     312   (100x below peak)
```

The operator appears abruptly at node ~150 M, runs for ~217 M outputs, and stops
abruptly at node ~367 M. Both edges are cliffs, not ramps.

### 17.7 …and it has a family

The cross-affinity matrix (`mat[dst][src]` = arcs from an `|O|=src` transaction
into an `|O|=dst` one) shows `|O| = 15..23` forming a loose cluster that feeds
*itself* at 15–21x enrichment, with `|O|=21` as its hub:

```
|O|=18 <- [21: 11.0% x5] [17: 9.7% x20] [18: 8.3% x21] [19: 8.1% x21] [20: 7.1% x16]
|O|=19 <- [21: 12.6% x6] [17: 8.6% x18] [19: 8.0% x20] [18: 7.4% x19] [20: 7.1% x16]
|O|=20 <- [21: 19.7% x9] [17: 7.1% x14] [20: 7.0% x16] [19: 6.7% x17] [18: 6.2% x16]
|O|=21 <- [21: 78.8% x35] [2: 9.8% x0] [20: 2.0% x5] [19: 1.2% x3] [17: 1.2% x2]

FAMILY |O| in 15..=21 : 70.91 % of its inputs come from inside the family
                        (baseline 4.67 %)  ->  15x
```

So `21` is a **hard cap, not a fixed batch size**: full rounds produce 21 outputs
and dominate; short rounds (15–20 participants) produce fewer and draw heavily
from the 21-class. `|O|=21` alone is 78.8 % self-fed; widening to the 15–21 family
raises the *family's* internal share to 70.9 % of a 4x larger input volume.

**Verdict.** Equal, positionally-indistinguishable outputs; `|I| ≈ |O| ≈ 20`;
61 % of all output value recirculating internally; the lowest idle rate in the
graph; 83 % of the class in one component with a 394,638-round chain; a variable
participant count capped at 21; and a hard on/off switch. That is a
**CoinJoin-style mixing / shuffling service**, and §14's batcher reading is
wrong. (Era and size are consistent with the large 2013–2016 web mixers, but with
no txids or values in this dataset that remains shape-based inference, not an
identification.)

### 17.8 Bonus: `|O| = 50` and `|O| = 51` are the *same* operator

```
|O|=50 <- [50: 39.2% x98] [2: 23.4%] [51: 17.2% x10] ...
|O|=51 <- [51: 50.2% x30] [2: 24.7%] [50:  8.1% x20] ...
```

They cross-feed each other far above baseline in both directions. One batcher
paying 50 recipients: **51 outputs when it needs a change output, 50 when it does
not.** The same reading applies to the `41/42` pair (`|O|=42 <- [42: 16.4% x122]`
with 41 nearby) and to `|O| = 14 / 35` as separate independent operators.

---

## 18. The spine, dissected: an **almost-unique** 2.17 M-hop chain that lives inside blocks and rides the mixer

§7 established that one path of 2,168,062 nodes runs from node 84,564 to node
668,259,783. Here is what it is made of.

### 18.1 How unique is it? — the critical subgraph

A node lies on *some* longest path iff `depth[v] + height[v] == D` (`D = 2,168,061`).
One extra linear pass gives the whole critical subgraph.

```
critical nodes = 4,057,782   (0.60721 % of the graph)
critical width per level: p50 = 1   p90 = 4   p99 = 11   max = 102
levels with 0 critical nodes   =         0     (as it must be)
levels with exactly 1 critical node = 1,644,664 / 2,168,062  =  75.86 %
```

**At 76 % of its levels the longest path has no choice at all** — a single node is
forced. The whole family of longest paths is only 4.06 M nodes wide across 2.17 M
levels, i.e. **1.87 alternatives per level on average**, never more than 102.

And the forced levels are not scattered:

```
longest run of consecutive FORCED levels = 101,158 levels, depths 125,757 .. 226,914
```

**A 101,158-transaction isthmus that every single longest path in the graph must
traverse node by node.** This is exactly the hourglass waist located
independently in §13 (depth 108 k–217 k, mean *total* width ~25). The two
measurements agree: in that stretch the ledger's deep structure narrows to a
single unbranchable strand.

The opposite extreme — where alternatives are widest — is a tight cluster:

```
depth 970,289 / 970,290 : 102 critical nodes each
depth 999,455..999,458  : 82-90 critical nodes each
depth 978,170..978,175  : 66-67 critical nodes each
```

Always in *consecutive pairs* of levels, i.e. short parallel bundles, never a
sustained wide region.

### 18.2 What the hops are made of

```
hops                                          : 2,168,061
hops staying inside the SAME block            : 1,984,617  (91.54 %)
hops that are 1-in/2-out peel steps           : 1,271,584  (58.65 %)
hops through an |O|=21 (mixer) transaction    :   230,913  (10.65 %)
hops where >1 output tied for the max height  :   489,138  (22.56 %)
hops taking the LAST output of the transaction: 1,096,963  (50.60 %)

output index chosen:   index 0 : 28.79 %    index 1 : 52.73 %    index >=2 : 18.48 %

top shapes along the spine:
  (|I|= 1, |O|= 2) : 58.65 %      (all ledger: 55.80 %)  ->  1.05x
  (|I|= 2, |O|= 2) :  8.91 %      (all ledger: 13.50 %)  ->  0.66x
  (|I|=18, |O|=21) :  1.08 %  |
  (|I|=19, |O|=21) :  1.08 %  |   all |O|=21 : 10.65 %
  (|I|=20, |O|=21) :  1.01 %  |   (all ledger: 0.2696 %)  ->  39.5x
  (|I|=17, |O|=21) :  1.01 %  |
  (|I|= 3, |O|= 2) :  1.07 %
```

**Two findings here.**

1. **The spine is heavily over-represented in mixer transactions.** *(The "39.5x" below uses a
   per-transaction baseline; §25.1 corrects it — the matched null for a hop gives **6.1x**.)*
   The `|O|=21` class is
   0.27 % of all transactions but **10.65 % of the world-record dependency
   chain**. Peel transactions, by contrast, appear at essentially their
   background rate (1.05x) and `(2,2)` transactions are *depleted* (0.66x). The
   longest chain in the ledger is not made of ordinary payments — it is
   disproportionately made of the mixer of §17.
2. **Index 1 is taken at 52.7 % of hops** and the *last* output at 50.6 %. For
   the dominant `(1,2)` shape those are the same thing: the spine follows the
   **change output**. That is what makes it long — a wallet's rolling change is
   the one output guaranteed to be respent by the same actor.

### 18.3 It lives inside blocks, in bursts

```
hop gap (node-id distance):
  gap  1        :    93,530  ( 4.31 %)
  gap  2-3      : 1,073,437  (49.51 %)   <-- the mode
  gap  4-7      :   125,659  ( 5.80 %)
  gap  16-31    :   302,930  (13.97 %)
  gap >= 8192   :    41,000  ( ~1.9 %)

maximal runs of consecutive same-block hops = 135,269   (mean 14.7 hops each)
longest single-block burst = 2,695 consecutive hops, around node 215,091,253
```

**91.5 % of the spine's hops never leave the block they are in.** The chain
crosses a block boundary only 183,444 times over 2.17 M hops; the rest of the
time it is walking a chain of unconfirmed transactions *within one block*,
averaging **14.7 transactions deep** per visit.

The record is **2,695 chained transactions inside a single block**, around node
215,091,253 — squarely inside the 2015 flood era of §6. (For context, Bitcoin
Core's default in-mempool ancestor limit is 25, introduced in 0.12 / early 2016;
a 2,695-deep in-block chain belongs to the period before that policy existed.)

### 18.4 It weaves through the mixer, it does not ride it

The mixer's own internal chain is 394,638 rounds long (§17.5), so one might
expect the spine to simply follow it. It does not:

```
230,913 mixer hops in 47,632 maximal stretches   (mean 4.8 hops per stretch)
LONGEST uninterrupted mixer stretch = 125 consecutive hops (near node 167,014,925)
  stretches of  1 hop     : 23,266
  stretches of  2-3 hops  :  8,380
  stretches of 32-63 hops :    694
  stretches of 64-127 hops:     50
```

The spine **enters and leaves the mixer 47,632 times**, typically for fewer than
5 hops. So the mixer is not a corridor the longest path travels down — it is a
dense mesh the longest path repeatedly cuts across, gaining a couple of levels of
depth each time. That is why the mixer contributes 10.65 % of the spine while its
own longest internal chain contributes at most 125 consecutive hops to it.

### 18.5 Chaining intensity collapsed 14x over the ledger's life

Spine hops per 16.7 M-node slice of the ID axis:

```
slice  0 (node          0..) : 234,438 hops   = 1.40 % of the slice's nodes
slice  1 (node 16,706,548..) : 114,191
slice  4 (node 66,826,195..) :  41,446
slice  8 (node 133,652,390..): 105,101
slice 13 (node 217,185,134..):  33,053
slice 24 (node 400,957,171..):  21,212
slice 39 (node 651,555,404..):  16,451 hops   = 0.098 % of the slice's nodes
```

The earliest 16.7 M outputs contribute **234,438** hops to the longest chain; the
most recent 16.7 M contribute **16,451** — a **14x** decline in "how much depth a
given amount of ledger activity buys". Early Bitcoin was chained; late Bitcoin is
broad. This is the same phenomenon as the §13 waist seen from the other side: the
depth axis was mostly built in the first sixth of the ID axis, and everything
since has widened rather than deepened the DAG.

### 18.6 Summary of Part II

| | `|O| = 21` system | the spine |
|---|---|---|
| size | 660,257 tx, 83.2 % in one component | 2,168,062 nodes |
| defining test | all 21 output positions statistically identical -> **no change output** | 75.86 % of levels have a **unique** critical node |
| self-structure | 78.8 % of inputs internal (158x), 62.2 % of outputs internal (124x) | 91.5 % of hops stay inside one block |
| record | in-class chain of **394,638 rounds** | in-block burst of **2,695 hops**; forced isthmus of **101,158 levels** |
| lifetime | node 150 M -> 367 M, hard on/off | node 84,564 -> 668,259,783, the whole history |
| link between them | | the spine is **39.5x enriched** in `|O|=21` transactions, entering/leaving them 47,632 times |

**Revision to §14:** the `|O| = 21` class is a **CoinJoin-style self-recycling
mixer**, not a payout batcher — see §17. `|O| = 11` and `|O| = 51` *are* batchers,
now positively confirmed by their change-output signature (§17.1).

---


---

# PART III — six parallel deep dives

Six probes were run concurrently, each written as an independent binary against the mmapped graph.
**Every track was then handed to a second, independent agent whose only job was to refute its
headline numbers** by re-deriving them through a different code path. Verification status is marked
on each section. Three claims were killed outright; they are recorded in §25 rather than hidden.

---

## 19. The isthmus is **one wallet's peel chain from early 2011**

*(this track is my own — its agent hit a tooling failure and I re-ran it)*

**What I did.** Extracted the unique critical node at each of the 101,158 forced levels
(depths 125,757 … 226,914) and characterised the resulting sequence.

```
SANITY depth 9/171/184/187/190 = 0 1 2 3 4          (correct)
longest forced run = 101,158 levels, depths 125,757..226,914

=== ISTHMUS: 101,158 nodes ===
node id range           12,439,718 .. 15,655,652     (span 3,215,934 ids)
block (segment) range      107,831 .. 114,202        (2,997 distinct blocks touched)
broken links (not parent->child) = 0                 -> it IS a path
hops staying in the SAME block = 98,161 / 101,157    (97.04 %)
hop gap: min 1  p25 2  median 2  p75 6  p95 76  max 128,219

--- transaction shapes along the isthmus ---
  (|I|=1, |O|=2) : 101,033  (99.88 %)
  (|I|=2, |O|=2) :      35  ( 0.03 %)
  (|I|=1, |O|=4) :      28  ( 0.03 %)
  (|I|=1, |O|=3) :      16  ( 0.02 %)
  ... 18 distinct shapes in total

output index taken:  index 0 : 101,009 (99.85 %)   index 1 : 134   index 2 : 14
takes the LAST output at 121 / 101,157 hops (0.12 %)

inputs of isthmus transactions that are themselves isthmus nodes: 101,157 / 101,479 = 99.68 %
```

**Pattern.** The object that pins down 101,158 levels of the entire graph's depth — through which
*every one of the ~10^270,178 longest paths must pass node by node* (§24) — is:

> **a single unbroken chain of 101,158 one-input / two-output peel transactions, run by one actor
> across ~3,000 Bitcoin blocks (index 107,831 → 114,202, i.e. early 2011), always spending output
> index 0 and always respending immediately.**

99.68 % of the chain's inputs are its own previous outputs: it is essentially closed. 97 % of its
hops stay inside a single block, and the median hop advances **2 node IDs** — the next transaction
is literally the next transaction in the block. Over 101,158 hops it advances only 3.2 M node IDs,
so it was emitting transactions far faster than the rest of the ledger was producing outputs. That
is exactly why the DAG's depth axis narrows to a thread here (§13's width-25 waist): in early 2011
**one automated wallet was single-handedly extending the longest dependency chain in Bitcoin.**

Note it is *not* a pure peel chain end-to-end — 124 of the 101,157 hops pass through a non-`(1,2)`
transaction, which is why §8's longest *unbroken* peel run (25,343) is smaller and lives elsewhere.

---

## 20. Inside the mixer: five disjoint eras, ~3.6 rounds, and a 25-input software limit on both sides

*Verification: claims 1 and 2 **CONFIRMED** (matrix re-derived twice, byte-identical; residence time
re-derived by three independent methods agreeing to 0.07 % with exact quantile match). Claim 3/4
**PARTIAL** — the substantive numbers all confirm, one enrichment baseline was wrong and is corrected
below.*

### 20.1 `|O| = 21` is not one operator — it is five, and they never touch

Bucketing the class by node ID and counting **in-class arcs between buckets**:

```
in-class arc matrix (row = source era, column = destination era)
A  <45M     [ 1,173        0         0          0        0    ]
B  45-60M   [     0   31,981         0          0        0    ]
C  60-150M  [     0        0    42,207         57        0    ]
D  150-367M [     0        0         0  8,433,566      325    ]
E  >=367M   [     0        0         0          0   14,300    ]

era |  n_tx   | mean |I| | self-affinity | unspent %
 A  |   4,530 |   1.787  |    0.1449     | 14.800
 B  |   2,045 |  16.061  |    0.9737     |  3.337
 C  |  34,991 |  16.438  |    0.0734     |  1.306
 D  | 568,888 |  17.590  |    0.8428     |  0.570
 E  |  49,803 |   3.794  |    0.0774     |  6.130
```

**382 of 8,523,609 internal arcs (0.0045 %) cross an era boundary.** The matrix is essentially
diagonal. So §17's "one mixer" is really **era D (nodes 150 M–367 M, 568,888 transactions)**, which
holds 86.2 % of the class and 98.9 % of its internal arcs. Era B (45–60 M) is a *separate, purer*
precursor — 97.37 % self-affinity, only 864 external inputs in its entire life, and **zero arcs to
any other era**. Era C is a variable-output family (self-affinity only 0.073, drawing inputs from
`|O|` 16..28 at 15–36×), i.e. a different service. Eras A and E are background noise.

### 20.2 Residence time: **3.62 rounds**

Exact unit-mass flow simulation (each external input seeds one unit; each in-class transaction pushes
its round-vector, shifted by one and divided by 21, to its 21 outputs; mass leaving the class is
tallied by round). Mass conservation error 0.000000.

```
round r | % of exiting mass | cumulative
   1    |     31.92 %       |  31.92
   2    |     18.38 %       |  50.30
   3    |     13.13 %       |  63.44
   5    |      6.95 %       |  79.90
  10    |      1.56 %       |  95.25
  20    |      0.09 %       |  99.70
mean 3.6192   median 2   p90 8   p99 16   ends unspent 0.930 %
```

Re-derived by the verifier three ways (exact backward DP 3.6167; exact backward distribution DP
mean 3.6167 with median 2 / p90 8 / p99 16 **exactly**; Monte Carlo over 25,173,136 stratified random
walks 3.6159). The 0.07 % spread is a denominator convention, not an error.

**Caveats the verifier insisted on, and they are right:** this is a *model* quantity assuming a
uniform 1/21 split at every transaction — there is no value data in this dataset — and the tail is
**not** geometric: the continuation probability *rises* monotonically from 0.574 to ~0.76, so the
exit hazard falls from 43 % at round 1 to ~24 % by round 22. The tail is fatter than geometric.

### 20.3 The mixer has a symbiotic partner class defined by `|I| = 25`

Of the 1,573,321 external inputs entering era D, **15.302 % were produced by transactions with
exactly 25 inputs**:

```
producer shapes (|I|,|O|), top rows:
  (1,2) 16.12 %   (2,2) 8.23 %   (4,2) 7.79 %   (5,2) 7.71 %   (3,2) 5.76 %
  (25,20) 5.05 %  (25,19) 3.00 % (25,18) 2.19 % (25,17) 1.82 % (25,16) 1.15 %

partner class (|I|=25, |O|=20): 8,479 tx
   inputs  211,975 : 113,139 (53.37 %) come FROM an |O|=21 transaction
   outputs 169,580 : 82,627 of 169,379 spent (48.78 %) go BACK to an |O|=21 transaction
                     201 unspent (0.119 %)
   (|I|=25,|O|=19): 6,740 tx, 44.38 % in / 39.63 % out
   (|I|=25,|O|=17): 6,195 tx, 35.24 % in / 30.24 % out
```

Roughly **half in, half out** — this class is wired into the mixer as a counterparty. And `|I| = 25`
is itself a ledger-wide spike (`|I|`=24: 116,728 → **25: 217,816** → 26: 113,042).

*Corrected baseline (the verifier's fix):* ledger-wide only **0.2794 %** of spent outputs are produced
by an `|I|=25` transaction, so the mixer's 15.302 % is a **54.8× enrichment** — the original agent's
12.4× figure compared a transaction-level rate against an arc-level baseline. The conclusion is
*stronger* than claimed, not weaker.

*Also corrected:* "entry money is ordinary peel change at baseline" holds only in the `|O|` marginal
(`|O|=2`: 60.36 % of entries vs a 60.59 % baseline, 1.00×). In the `|I|` marginal it is strongly
non-random — producers with `|I|=1` are **18.97 % of entries against a 64.07 % baseline (0.30×)**.
The mixer draws *multi-input* peels, not ordinary single-input change.

### 20.4 The 25-input cap

Exact `|I|` histogram over all 568,888 era-D transactions:

```
|I|  14: 5.06 %   15: 6.49 %   16: 8.08 %   17: 9.39 %   18: 9.99 % (mode)
     19: 9.82 %   20: 9.12 %   21: 7.81 %   22: 6.14 %   23: 7.28 %   24: 3.77 %   25: 1.76 %
     ------------------------------------------------------------- cliff -------
     26: 0.141 %  27: 70 tx   28: 82 tx   29: 70 tx   30: 187 tx

P(|I| <= 25) = 99.689 %       25 -> 26 drop factor = 12.51x
```

**Both sides of the interface are capped at 25 inputs** — the mixer itself and its partner class.
One piece of software, one constant.

### 20.5 The isolated `|O|=21` transactions are a different species

```
                    isolated (66,487)   connected (593,770)
unspent rate            5.416 %              0.655 %      (8.3x)
|I| = 1                49.87 %               2.51 %
modal |I|                  1                   18
share of class inside 150M-367M   0.56-9.95 %
share of class outside 367M      54-89 %
```

They are ordinary transactions that happen to have 21 outputs. The mixer is the connected component,
not the output count.

### 20.6 Drift over its lifetime

```
node bucket | n_tx   | mean |I| | mode |I| | self-aff(in) | self-aff(out) | unspent %
   150M     | 33,701 |  19.46   |    23    |    0.804     |    0.750      |  0.316
   200M     | 38,283 |  18.33   |    18    |    0.816     |    0.714      |  0.267
   300M     | 22,555 |  16.16   |    18    |    0.836     |    0.654      |  1.661
   360M     | 13,031 |  15.34   |    18    |    0.778     |    0.569      |  0.849
```

Inputs shrink, the outward recycling loosens (0.75 → 0.57), single-input transactions grow 8×, and
the unspent rate rises 2.7× — a service winding down. **The `|I|` mode stays locked at 18 throughout.**

---

## 21. An operator taxonomy for the whole ledger — and `|O|=21` is the *only* real CoinJoin

*Verification: the arithmetic reproduced to the last digit across ~60 reported numbers. Two
interpretive claims were overturned (§25). The taxonomy itself survives.*

### 21.1 A three-number classifier

For an output-size class `L`:

* **R** = same-class arcs per transaction (how many of a transaction's outputs are consumed by
  another transaction of the same class);
* **Cnorm** = (share of those same-class arcs leaving the **last** output position) × L — equal to
  1 if the recirculation is spread uniformly over positions, equal to L if it all flows through one;
* **ext_out / ext_in** = coins leaving per coin entering.

```
R >> 1 and Cnorm ~ 1                   ->  MIXER          (recirculates, no change output)
R ~ 1 and Cnorm >> 1                   ->  BATCHER        (a chain through one change output)
R << 1 and ext_out/ext_in >> 1         ->  DISTRIBUTOR    (sprays, does not recirculate)
```

### 21.2 The table

| L | #tx | verdict | deciding number | lifetime (node-id p5..p95) |
|---|---|---|---|---|
| 11 | 532,286 | BATCHER (weak) | last-pos return 15.86 % vs 5.39 % (2.9×), Cnorm 2.1 | 111 M..636 M |
| 14 | 174,108 | **consolidate-and-resplit loop** (see §25) | R=3.03 but 78.6 % of inputs from ONE predecessor tx | 271 M..370 M |
| 16, 17, 42, 31 | 406,248 total | family, flat positions | 22.45 % internal at 19× | broad |
| **21** | **660,257** | **MIXER (multi-party CoinJoin)** | **R=12.91; median 9 distinct same-class predecessors; parallel-arc multiplicity 1** | core 158 M..351 M |
| 35 | 42,583 | BATCHER, *randomised* change position | R=0.68, Cnorm 1.2, positions uniform | 49.5 % of class in 1 % of the axis |
| 41 | 37,771 | DISTRIBUTOR | R=0.44, ext_out/ext_in 8.7, WCC 0.29 % | 19 M..613 M |
| 48 | 17,944 | DISTRIBUTOR | R=0.14, ext_out/ext_in 12.9 | 47.6 % in 1 % of axis |
| 50 | 51,887 | BATCHER, change **externalised** to 51 | Cnorm 1.1, receives 47,606 arcs from 51 | 225 M..583 M |
| 51 | 209,271 | BATCHER | Cnorm 4.4, 94.5 % have I=1 | 177 M..492 M |
| **61** | 17,204 | BATCHER | **last output returns at 28.8 % vs 0.36–0.79 % (80×)** | 122 M..663 M |
| 101 | 67,231 | DISTRIBUTOR (dust) | unspent 31.8 %, ext_out/ext_in 63 | the 2015 flood |
| 102 | 12,823 | BATCHER, randomised change | R=0.84, Cnorm 1.5 | 59 % in 1 % of axis |
| 138,139,140,141,144,146,200,2001 | 20,576+ | **pure-chain BATCHERS** | 96–99.6 % of *all* same-class flow leaves the **last** output | 50 M..660 M |
| 291, 301, 501, 1001, 2501 | 1–15 k each | BATCHER / dust DISTRIBUTOR | all of the form `N+1` | broad |
| 36,40,47,49,76,150,151,251 | 2–24 k each | NOISE | R<0.3, no position structure | broad |

A full sweep of `L = 2 .. 13,107` finds **six** significant classes above `L = 256`, and every one is
of the form **`N+1`**: 291, 301, 501, 1001, 2001, 2501. The `10^k + 1` lattice of §4.2 runs all the
way to the top of the degree distribution.

### 21.3 The decisive statistic: how many counterparties?

The classifier above cannot separate "many people joining" from "two wallets shuffling". The
verifier's control does:

```
                                      share of a tx's inputs supplied by
class core        distinct same-class    its single largest predecessor tx
                  predecessors (median)   median      >=80 % from <=2 preds
|O| = 21  core          9                 0.214            0.50 %
|O| = 14  core          2                 0.786           80.88 %
|O| = 50  core          1                 ~1.0            (|I| p25=p50=p75=61,
                                                          one tx swallows all 50
                                                          outputs of the previous)
```

**`|O| = 21` is the only class in the ledger where a transaction's inputs come from ~9 different
counterparties in roughly equal share.** Every other "mixer-like" class is a
consolidate-and-resplit pipeline between one or two wallets. This *strengthens* §17: the CoinJoin
verdict now rests on counterparty multiplicity, which is far harder to fake than positional
uniformity.

### 21.4 Two batchers that randomise the change position

`|O| = 35` and `|O| = 102` both emit ~0.7–0.8 same-class-consumed outputs per transaction (one chain
link, like a batcher), but spread it **uniformly across all output positions** instead of at the last:

```
L=35 : R=0.682, per-position self-arcs min 765 max 879 (1.15x), Cnorm 1.2, 84.8 % have |I|=1
L=102: R=0.844, per-position min 80 max 146 (1.82x), Cnorm 1.5, 81.7 % have |I|=1
contrast L=138: R=0.875 but Cnorm 136.2 ;  L=200: R=0.715, Cnorm 199.3
```

Same mechanism, deliberately shuffled output order — an early anti-heuristic measure. **Both burst in
the same node-ID window as the 2015 flood**, and §23 shows why.

---

## 22. A mempool policy change is **directly visible in the graph topology**

*Verification: the ceiling **CONFIRMED** exactly (independent pull-DP over the transpose, plus exact
per-block bitset ancestor closure). The word "absolute" was **refuted** — see below. Every number in
the top-20 table reproduced digit for digit, in the same order.*

**What was measured.** For each of the 392,047 block segments, the longest chain of transactions
`T1 -> T2 -> ... -> Tk` **entirely inside that block**, each spending an output of the previous.

### 22.1 The ceiling

```
Post-transition region (segment index >= 329,000, node >= 394,909,953): 63,047 blocks
  per-block max in-block chain length:
    25 -> 39,501 blocks (62.65 %)
    24 ->  3,344        ( 5.30 %)
    23 ->  1,408        ( 2.23 %)
    26 and above ->  0 blocks

Per-transaction chain depth, AFTER: cd=24 0.1256 %  cd=25 0.1039 %  cd>=26  50 transactions total
Per-transaction chain depth, BEFORE (segments 300,000-307,250, 8,990,176 tx):
                                    cd=24 0.1064 %  cd=25 0.1005 %  cd=26 0.0930 %  cd=30 0.0756 %
                                    cd>=26 = 263,388 tx (2.93 %) — decays smoothly straight through 25
```

**Bitcoin Core 0.12's default `-limitancestorcount = 25` is legible in the arc structure of the
graph.** Before, the distribution decays smoothly through 25 with 2.93 % of transactions above it;
after, it stops dead — 50 transactions out of 109.5 million.

Over the whole ledger the fingerprint shows as an 11× spike:

```
per-block max chain length, all 392,047 blocks:
   1 -> 66,276 (16.91 %)    10 -> 9,709 (median)     23 ->  4,629
  24 ->  6,830              25 -> 51,147 (13.05 %)   26 ->  2,405     >=64 -> 17,754 (4.53 %)
```

### 22.2 It is a **staircase**, not a cliff — miners upgrading one at a time

Adoption proxy `r = P(a block exceeds 25 | it reached 25)`:

```
segment  <307,100 (node <309.5M) : r = 0.94-0.98    (22.34 % of blocks exceed 25)
segment 307,100-312,999           : r = 0.73-0.81
segment 313,000-318,999           : r = 0.29-0.54
segment 319,000-327,999           : r = 0.087-0.23
segment 328,000-328,999           : r = 0.015-0.022
segment >=329,000                 : r = 0.0000      (2 of 63,047)

step 1 at seg ~307,100 (node 309,460,867)   step 2 at seg 313,000 (node 332,106,370)
step 3 at seg ~315,500 (node 342,030,503)   step 4 at seg ~328,000 (node 390,852,547)
```

Four discrete steps over ~22,000 blocks. That is exactly the shape of a **policy default propagating
through independent miners**, not of a consensus rule switching on. A consensus change would be one
vertical line.

### 22.3 The two survivors

*(this is where "absolute" was refuted — and the exception is more interesting than the rule)*

```
seg 352,284  nodes 485,897,115..485,901,807  ntx 2,081  max chain = 50 transactions
   traced: 485,899,252 -> 485,899,254 -> ... -> 485,899,350, stepping by exactly 2
   tx 1: |I|=2,|O|=2 ; tx 2..50: all |I|=1,|O|=2  -- a pure peel chain laid down contiguously
   50 = exactly 2 x 25
seg 352,470  node 486,868,136  max ancestor set = 26 (chain depth still <= 25)
```

**Exactly one block in 63,047 breaks the ceiling, and it breaks it by exactly 2×25.** Two 25-chains
concatenated — consistent with a miner assembling two separately-relayed 25-transaction packages.

### 22.4 The deepest in-block chains anywhere, and what they are made of

```
rank  segment   node range                    ntx    max chain
  1   273,371   198,428,543..198,435,066     3,264     3,218
  2   316,193   344,634,817..344,642,225     3,682     3,141
  3   279,136   215,996,694..216,002,935     3,055     2,932
  4   307,632   311,520,012..311,526,092     3,030     2,920
  5   278,719   212,628,896..212,638,823     3,508     2,913
  6   279,004   215,085,419..215,094,766     3,458     2,696   <- the §18.3 spine block
```

Every one of the 11 traced record chains is **100 % single-input**, and each has a single constant
`|O|`: chains 1,2,3,4,6,9 are 100 % `(1,2)`; chains 5,7,8,10 are 100 % `(1,3)`. The record — **3,218
chained transactions inside one block**, nodes 198,428,631..198,435,065, perfectly contiguous with
stride 2 — is a single machine emitting a peel chain as fast as it can into one block.

And the composition shifts with the policy:

```
era              blocks   chain-tx    peel %   |I|=1 %   |O|=2 %
seg <200k       136,081  2,213,240    85.15     90.12     93.10
seg 200-300k     98,512  2,816,560    59.96     77.29     71.99
seg >=328.9k     62,713  1,330,943    95.20     97.62     96.68   (mean |I| = 1.067)
```

After the limit lands, in-block chains become almost purely `(1,2)` peels with mean `|I|` of 1.067 —
the only chaining that survives a 25-ancestor cap is the simplest possible one.

---

## 23. The 2015 anomalies: **two disjoint floods**, and the sweeper did *not* eat the flooder's dust

*Verification: all four headline claims **CONFIRMED**, several by deliberately opposite traversal
directions (forward scan vs transpose enumeration). One sub-number is a definitional divergence,
not an error. This section **overturns the reading I gave in §6.***

§6 read the 217–220 M dust flood and the 220–222 M sweep wave as one story: flood, then clean-up.
That is wrong.

### 23.1 The falsification

```
Ten mega-consolidations (nine with |I| = 20,000, one with 9,997; all |O| = 1),
nodes 230,703,549 .. 231,081,170.  189,997 distinct inputs, 0 duplicates.

HOP 1 (their inputs)   : own = 1   -> 189,997 = 100.0000 %
                         own = 101 ->       0 =   0.0000 %   (global baseline 0.7524 %)
HOP 2 (grandparents), 208,776 slots, nothing else present:
                         own = 102 -> 174,751 = 83.70 %
                         own =  35 ->  34,025 = 16.30 %

Direct reachability: family-A (|O| in {101,47,48}) spent outputs in 216.5-220.5M = 30,437
                     reaching a mega transaction in 1 hop = 0 ; in 2 hops = 0
```

**Not one of the 189,997 inputs of the giant consolidations descends from the `|O|=101` flood.**
Their entire two-hop ancestry is a *different* campaign — `|O|=102` and `|O|=35` spray chains.

### 23.2 Two campaigns, same window, opposite fates

```
in block starts 216.5M - 220.5M:
class      n_tx     outputs    unspent            fed by                   eaten by
|O|=102   2,835     289,170    1  (0.000 %)    99.86 % itself           99.02 % |O|=1
|O|= 35   8,662     303,170    16 (0.005 %)    99.86 % itself           97.09 % |O|=1
|O|=101  11,869   1,198,769    1,170,427 (97.636 %)   87 % itself + 6.5 % |O|=48 + 6.0 % |O|=47
|O|= 47     715      33,605    96.980 % unspent      97.93 % by |O|=101
|O|= 48     778      37,344    97.108 % unspent      98.97 % by |O|=101
```

* **Flood-2** (`|O| = 102` + `|O| = 35`) is a **closed spray-and-reclaim loop**: it sprays, sweeps
  itself back up with `|O|=1` transactions, and leaves **essentially zero permanent dust** — 17
  unspent outputs out of 592,340.
* **Flood-A** (`|O| = 101` + 47 + 48) **abandoned 97.6 % of everything it created.**

The two families **never exchange a single arc** in either direction. A third, weaker campaign
(`|O| = 23`, 78.0 % abandoned) is disjoint from both.

### 23.3 The consolidations tile a contiguous ID interval, exactly

```
start=230,703,549 |I|= 9,997  inputs [216,863,076 .. 216,914,993]
start=230,843,654 |I|=20,000         [216,914,994 .. 217,502,485]
start=230,926,434 |I|=20,000         [217,502,486 .. 217,849,905]
start=231,081,170 |I|=20,000         [217,849,906 .. 218,398,580]
start=230,994,044 |I|=20,000         [218,398,581 .. 218,912,985]
start=230,873,887 |I|=20,000         [218,912,986 .. 219,102,837]
start=231,014,489 |I|=20,000         [219,102,838 .. 219,372,985]
start=230,844,251 |I|=20,000         [219,372,986 .. 219,677,752]
start=230,910,487 |I|=20,000         [219,677,753 .. 219,880,238]
start=230,725,307 |I|=20,000         [219,880,239 .. 224,132,043]

every max + 1 equals the next min.  gaps = 0.  overlaps = 0.
union = 189,997 inputs covering [216,863,076 .. 224,132,043].  all ten outputs UNSPENT.
```

**One operator sweeping its own outputs in strict ID order, in batches of exactly 20,000.** Note the
batch order in ID space is *not* the order of the consolidating transactions themselves. And the
exact-count proof: of the `|O|=1` sweep transactions in 216.8–224.2 M, precisely
**180,000 = 9 × 20,000** of their outputs flow into `|I| >= 20,000` consumers, and every single
mega-feeding sweep has a pure flood-2 diet with **zero** family-A inputs.

There is also an earlier tier of the same operation — `|I|` = 7,350 (×2), 5,569 (×5), 5,000 (×5),
5,160, 4,691 at nodes 213.8 M–217.3 M — each 100 % fed by `|O|=102`, `|O|=35` or `|O|=15`.

### 23.4 The abandoned dust is 2.7 % of the entire UTXO set

```
window 217-220M: 3,000,000 nodes, 1,435,470 unspent (47.85 %)
  by creating class:  own=101 -> 1,101,735 UTXOs (76.75 % of the window), unspent rate 97.58 %
                      own= 23 ->   201,066        (14.01 %), rate 78.03 %
                      own= 47 ->    32,581,  own=48 -> 32,165  (both ~97.5 %)
  family A + |O|=23 = 1,367,547 = 95.27 % of the window's UTXOs

share of ALL 53,078,524 UTXOs in the graph:
  217-220M          -> 1,435,470 = 2.7044 %
  216.5-220.5M      -> 1,637,049 = 3.0842 %
  210-225M          -> 2,367,494 = 4.4604 %
globally own=101 is the 5th-largest UTXO class: 2,161,797 = 4.07 % of the UTXO set,
  50.96 % of which was minted in this one window
```

**A single 2015 campaign, lasting 365 block segments, is still responsible for ~2.7 % of the entire
unspent-output set two years later** — measured from topology alone, with no value data.

It also visibly filled blocks: the `|O|=101` campaign packed 3.23 M outputs into 365 segments =
**8,854 outputs per block**, against 2,688–2,907 in the neighbouring windows.

### 23.5 And the "sweep wave" of §6 was sweeping the *other* flood

```
sweep window 220M-222M: 635,313 tx, 2,950,320 input slots, mean |I| = 4.6439
  input class    share      global baseline    ratio
  own=  2      30.558 %        60.591 %        0.50x
  own=102      19.087 %         0.195 %       98.07x
  own= 35      18.210 %         0.234 %       77.91x
  own= 15       5.369 %         0.316 %       16.99x
  own=101       0.440 %         0.752 %        0.58x   <-- BELOW baseline
```

The elevated `ins/tx` I flagged in §6 is real, but it is flood-2 reclaiming its own dust at ~100×
and ~78× baseline. **`|O|=101` dust is consumed *below* chance.** Nobody swept it — that is why 97.6 %
of it is still sitting in the UTXO set.

### 23.6 A shape signature inside the flood

The `|O|=101` transactions have **no change output at a fixed position** — the chain-continuation
output sits at a uniformly random position (per-position mean 96.79, sd 10.97 against a Poisson
sd of 9.84). But **27 of the 101 output slots are systematically 3–8× more likely to be spent**,
stably across the whole campaign:

```
74 "quiet" positions: spend rate 1.00-2.4 %, ~1 distinct consumer per spend
27 "hot"   positions: spend rate 3.07-7.66 %, mean consumer |I| 150-460, many-to-one consumers
   hot set = {4,13,19,28,29,34,36,37,41,42,45,46,50,51,61,62,65,66,70,71,73,74,78,79,82,85,88}
   stability first-half vs second-half: p=4 446/364, p=13 403/331, p=29 438/349
```

That is the signature of a **fixed, ordered 101-recipient list** where 27 of the recipients happened
to sweep their dust and the other 74 ignored it. *(Rated medium confidence by the original agent; the
verifier independently reproduced the position statistics and the exact hot set.)*

---

## 24. All ~10^270,178 longest paths

*Verification: claim 1 **CONFIRMED** by an independent big-float implementation plus a second
modular prime — log10 agrees to 4×10⁻¹² relative and the mod-2³¹−1 checksum is bit-identical.
Two sub-claims **PARTIAL** (§25).*

### 24.1 How many are there

```
D = 2,168,061 (2,168,062 levels)
critical nodes  4,057,782 (0.60721 % of n)      critical arcs 11,187,805
log10(# distinct longest paths) = 270,177.978695   =>  ~9.53 x 10^270,177
   verified 4 ways: backward DP, forward DP, count mod 2^31-1 = 952,180,286 from BOTH
   directions, and the level invariant sum_v(paths_in[v] * paths_out[v]) identical mod p
   on ALL 2,168,062 levels (0 mismatches)
critical SOURCES (depth 0): exactly 1  = node 84,564
critical SINKS  (height 0): exactly 2  = nodes 668,259,783 and 668,259,784 (one final transaction)
geometric-mean branching per level = 1.3327
BRANCH nodes (>=2 critical children): 2,128,564 = 52.46 %
MERGE  nodes (>=2 critical parents) : 2,151,643 = 53.03 %
```

**Astronomically many longest paths, all starting at one node and ending at one transaction.**

### 24.2 Brittle in topology, resilient in metric

```
1,644,664 nodes each lie on 100 % of those ~10^270,178 paths (the width-1 levels of §18.1).
Deleting any one of them annihilates the entire family.

27 TRUE single-node deletions (full depth+height DP re-run on G - v; no-deletion control = 2,168,061):
  drops sorted: 1,1,1,1,1,6,17,32,40,41,80,188,205,222,267,300,359,819,903,989,
                1930,1930,1951,2561,3808,3808,12731
  median drop 222.   worst found: node 238,404 -> D' = 2,155,330, drop 12,731 (0.587 % of D)
```

So the record is **topologically brittle** — 1.64 M distinct single points of failure — but
**metrically resilient**: killing one of them typically costs only a few hundred of 2.17 M levels.
Long forced runs are *not* expensive per se: deleting the head of the 101,158-level isthmus costs
**6 levels**; deleting a node in its middle costs 1,930.

The most vital node in the graph is **node 238,404**, at the tail of the one stretch where the
*entire DAG* — not just the critical subgraph — is a literal single thread:

```
levels with exactly ONE node in the whole graph: 3,809, in exactly 1 maximal run, depths 18,798..22,606
  head (node 217,674) -> drop 3,808     mid (node 222,121) -> drop 3,808
  tail (node 238,404) -> drop 12,731
```

### 24.3 The record is sharply peaked

```
nodes with D - (depth+height) = g:
  g=0: 4,057,782    g=1: 1,793,892    g=2: 1,042,307    g=5: 532,328    g=10: 362,217
  then a flat shelf of ~72,000-77,000 nodes per gap level out to g=1,000
cumulative: g<=1 0.876 %   g<=10 1.621 %   g<=100 3.699 %   g<=1000 13.819 %
```

The critical population is a strict local maximum, **2.26× larger than the `g=1` population**, then
the almost-critical density collapses and flattens. The depth record is a genuine spike, not the tip
of a smooth distribution.

### 24.4 The critical subgraph is **two mixer bands separated by peel thread**

Mean critical width per depth bucket, and the dominant `|O|` among critical arcs:

```
depth       0 -   433,612 : width ~1.00-1.14 , |O|=2 at 92-100 %   (four buckets exactly 100 % |O|=2
                                                                    and exactly width 1)
depth 433,612 -   813,023 : width 3.07-3.89  , |O|=17 14-19 %, 18 ~13 %, 19 ~12 %, 20 ~10 %, 16 ~11 %
                                               (|O|=21 only 5.5-7.4 %)
depth 813,023 -   921,426 : width back to 1.06-1.24
depth 921,426 - 1,626,046 : width 1.65-3.39  , |O|=21 at 70.7-87.6 %
depth 1,626,046 - D       : width 1.000-1.02 , |O|=2 dominant
```

**The longest-path family fans out in exactly two places, and both are mixers** — a `|O|=16..20`
band at depths 433 k–813 k and the `|O|=21` band at 921 k–1,626 k. Everywhere else the family
collapses to a single width-1 thread of ordinary peel transactions. Critical arcs per bucket run
~54,200 in the thin regions against 600,000–820,000 in the fat bands, a 15× difference.

Composition of the critical subgraph as a whole:

```
                  share of critical NODES   share of critical ARCS   of critical TRANSACTIONS
|O| = 21              27.02 %  (13.0x)          38.13 %  (3.6x)          12.30 %  (45.6x)
|O| = 17/18/19        ~5 % each (~10.7x)        ~6 % each                ~31-33x
|O| =  2              39.27 %  (0.67x)          (0.40x)                  (0.86x)
|O| =  1              (0.13x)                                            
same-block arcs       90.79 % vs 17.31 % baseline (5.25x)
```

### 24.5 A uniformly random longest path looks exactly like the greedy spine

```
                       random longest path (exact arc marginals)   greedy spine (§18)
peel (|I|=1,|O|=2) hops        58.6683 %                                58.65 %
same-block hops                91.5390 %                                91.54 %
|O|=21 mixer hops              10.7584 %                                10.65 %
```

Cross-checked by the verifier with 40 **uniformly sampled** longest paths (walking from the unique
source, choosing each critical child with probability proportional to its exact `paths_out`): peel
58.6680 %, same-block 91.5388 %, mixer 10.7582 %. All 40 sampled paths had length exactly 2,168,061.

**So §18's spine composition was not a greedy artefact** — it is the expected composition of a
uniformly random member of a family of 10^270,178 paths.

### 24.6 The longest-path family lives in the first half of the ledger

```
critical nodes below node 334,130,976 (half the ID axis): 3,379,325 / 4,057,782 = 83.28 %
critical nodes below node 167,065,488 (first quarter)   : 2,021,190              = 49.81 %
densest slices: 11.7M-13.4M 5.41x , 13.4M-15.0M 4.76x , 85.2M-86.9M 4.19x , 135.3M-137.0M 3.85x
sparsest      : 462.8M-464.4M 0.011x , ~400M 0.044x
era enrichment: bucket 5 3.33x -> bucket 20 0.78x -> bucket 39 0.171x (monotone decline)
```

The two densest slices in the whole graph, at 5.4× and 4.8×, are **exactly where the isthmus of §19
lives** (nodes 12.44 M–15.66 M). The post-400 M era is essentially absent from the longest-path
family — consistent with §18.5's 14× collapse in chaining intensity.

---

## 25. Corrections — what the adversarial pass killed

Every track was re-derived by an independent agent instructed to refute it. This is what did not
survive, including three of my own claims from Parts I–II.

### 25.1 Corrections to Parts I–II

| where | what I wrote | what is actually true |
|---|---|---|
| **§6** | the 217–220 M dust flood and the 220–222 M sweep are one story — "flood → clean-up" | **Wrong.** Two disjoint campaigns share that window. The sweep consumes `O=102`/`O=35` dust at 98× and 78× baseline and `O=101` dust at **0.58× — below chance**. The two families exchange **zero** arcs. See §23. |
| **§17.1** | "all 21 output positions are statistically identical … there is no change output" | **Too strong.** Positions 0–19 are identical (z −1.5…+1.3). Position 20 is distinguishable at **+23.5 σ** on same-class return (62.82 % vs 61.32–61.48 %) and **−25.6 σ** on unspent rate (0.815 % vs 1.151 %). The *effect size* is 2.3 % relative, against **2.4×** for `O=11` and **4.6×** for `O=51`, so the CoinJoin verdict stands — but "no distinguishable change output" is false. The verdict now rests on counterparty multiplicity instead (§21.3), which is much stronger evidence. |
| **§18.2** | "the spine is **39.5× enriched** in mixer transactions" | **Baseline error.** The hop share (10.65 %, and 10.76 % for a uniformly random longest path) is confirmed exactly. But 39.5× compares a *hop* share against a *transaction* share. The matched null for a hop is the share of spent outputs consumed by an `O=21` transaction = 10,812,004 / 615,183,429 = **1.7575 %**, giving **6.1×**. Against the arc-share null (10.4994 %) it is **1.02× — no enrichment at all**. The mixer really is over-represented on the longest path, but by ~6×, not ~40×. |
| **§13 / §18.1** | the forced run spans depths 125,757 … **226,915** | Off-by-one: it ends at depth **226,914**. The length, 101,158 levels, is right. |
| **§17** | "the `O=21` mixer" as a single object | It is **five ID-disjoint eras** with 0.0045 % cross-era arcs. The mixer is **era D** (nodes 150 M–367 M, 568,888 tx). Era B is a separate, purer precursor; era C is a different service. See §20.1. |

### 25.2 Claims from Part III that were killed

**REFUTED — the `|O| = 78..102` "band operator".** An agent reported 25 adjacent output-size classes
cross-feeding at 12–94×, aggregating to 137,346 transactions with 31.73 % internal input share at
20× baseline. Every figure reproduced exactly, but three controls the agent never ran destroy the
inference:

* 75.0 % of the "internal" arcs are the **diagonal**, and 71,244 of those belong to `|O|` = 101, 102
  and 99 — classes already identified separately. Genuine cross-class band flow is 7.94 % at 4.9×,
  not 31.73 % at 20×.
* A **sliding-window control** over other 25-wide bands: 103–127 gives 27.7×, 153–177 gives 25.8×,
  203–227 gives 27.9× — all *higher* than 78–102's 4.9×.
* **Adjacent-class cross-feeding is generic** for every sparse class above `L ≈ 50` (114→115 at 219×,
  137→138 at 146×, 153↔154 at 103×/116×).

Nothing singles out 78..102. Dropped.

**LABEL REFUTED — `|O| = 14` as "a second independent mixer".** All ~25 reported numbers reproduced
exactly (R = 3.033, flat position profile, 95.07 % one component, no traffic with `|O|=21`). But the
control that matters shows it is a **1–2 counterparty consolidate-and-resplit loop**, not a
multi-party join:

```
                              inputs from the single largest predecessor tx
|O|=14 core: median 78.6 %,  80.88 % of transactions take >=80 % from <=2 predecessors
|O|=21 core: median 21.4 %,   0.50 % of transactions take >=80 % from <=2 predecessors
```

Its own report used exactly this test to demote `|O|=50` from "mixer", so the two findings were
mutually inconsistent. Also "all 14 positions identical" is false — the per-position unspent rate
runs 4.43 %–6.71 % (z −23 to +25) with a visible step at position 6.

**Net effect: `|O| = 21` is the only multi-party CoinJoin in the dataset.**

**PARTIAL — the pure-chain batchers' amplification factor.** The mechanism is confirmed to 2 decimal
places (96–99.6 % of all same-class recirculation leaves the last output; a spot check on 2,000
`|O|=138` transactions found the last output feeding another 138-transaction **1,583 times against 11
for all 137 other positions combined**). But the reported position ratios of 10⁴–10⁵ were computed on
the `|I|=1` subpopulation while the neighbouring columns were class-wide. Class-wide: `L=138` is
**10,525**, not 67,668; `L=146` is 36,845, not 99,905; `L=200` is 53,914, not 64,393.

**REFUTED — "deleting the unique source node 84,564 costs 205 levels".** It costs **1**. Provable
from the same report's own finding that there is exactly one critical source: `D' ≤ D−1`, and node
87,248 (depth 1, height 2,168,060) has a forward cone that avoids 84,564 entirely because all arcs
point forward in node ID, so `D' ≥ 2,168,060`. Eight of the nine other named deletion costs
reproduced exactly.

### 25.3 What held up

The verifiers reproduced, digit for digit and by deliberately different code paths (transpose vs
forward, pull-DP vs push-DP, bitsets vs sorted unions, big-float vs log-sum-exp, Monte Carlo vs
exact marginals):

* the five-era matrix of §20.1 — twice, byte-identical, once from each graph direction;
* the residence-time distribution of §20.2 — three methods, exact quantile agreement;
* the 25-transaction in-block ceiling and all 20 rows of the deepest-in-block table (§22);
* the ten mega-consolidations' **zero-gap, zero-overlap tiling** of `[216,863,076 .. 224,132,043]`
  and the 100 %/0 % ancestry split (§23) — re-derived by the opposite traversal direction;
* `log10(#longest paths) = 270,177.9787` with a **bit-identical mod-2³¹−1 checksum of 952,180,286**,
  plus a second independent prime, forward and backward (§24);
* the `|O|=21` core's median of 9 distinct same-class predecessors with parallel-arc multiplicity 1.

The coinbase-run segmentation used throughout Parts I–III was independently validated node-for-node:
"uncovered by the interval partition" and "in-degree 0 in the transpose" agree on all 668,261,953
nodes with **0 disagreements**, giving 392,047 segments and 2,032,814 coinbase outputs both ways.

---

## 26. Final picture

The graph is an exact union of 244,930,113 bicliques whose output sides tile the vertex set (§4).
Given that scaffold, everything interesting is in **who chooses whose outputs**, and that turns out to
be dominated by a small number of machines:

1. **One early-2011 peeling wallet** (§19) emitted 101,158 chained transactions across ~3,000 blocks,
   and in doing so built a 101,158-level unbranchable isthmus that *every one of the ~10^270,178
   longest paths in the graph* must traverse node by node.
2. **One CoinJoin mixer** (§17, §20, §21.3) — the only genuinely multi-party one in the ledger —
   recycled coins for ~3.6 rounds each between nodes 150 M and 367 M, capped at 25 inputs on both
   sides of its interface, and it is one of only **two places** where the longest-path family fans
   out at all (§24.4).
3. **Two simultaneous 2015 spam campaigns** (§23) that never touched each other: one closed loop that
   reclaimed every satoshi it sprayed, and one that abandoned 97.6 % of its output and still accounts
   for **2.7 % of the entire UTXO set**.
4. **A mempool policy default** (§22) — 25 ancestors, Bitcoin Core 0.12 — that propagated through
   miners in four discrete steps over ~22,000 blocks and is visible in the arc structure as a hard
   ceiling with exactly one survivor in 63,047 blocks.
5. **A taxonomy of payout software** (§21) whose batch sizes sit on the `10^k` and `10^k + 1`
   lattices all the way from `|O| = 11` to `|O| = 2001`.

None of that needed a txid, an address, or a single satoshi of value data. It is all in the shape of
2,162,523,341 arcs.

*End of log.*
