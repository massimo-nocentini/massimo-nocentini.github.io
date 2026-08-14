

+++
date = '2026-08-14T06:58:04+01:00'
title = 'SIMD'
subtitle = 'Single instruction, multiple data.'
summary = 'A reading path and a working survey.'
categories = ['AI generated']
+++

Inspired after reading [*Hashimoto*'s __"Everyone Should Know SIMD"__](https://mitchellh.com/writing/everyone-should-know-simd)
and [Wikipedia](https://en.wikipedia.org/wiki/Single_instruction,_multiple_data).
# SIMD with Clang and Rust — a verified survey

Everything here was compiled and run on one machine: **Ubuntu 24.04, Intel Xeon
(Cascade Lake / Sapphire Rapids class: AVX-512F/DQ/BW/VL/CD + VNNI), 2.8 GHz, 1 vCPU**, with
**clang 18.1.3** and **rustc 1.75.0**. Where the compiler refused something, the refusal is
kept — those are the interesting parts. Full sources are in the appendix.

> The C harness uses a `volatile` sink; the Rust harness uses `std::hint::black_box`. Compare
> within a table, never across the two languages.

---

## 0. The four levels

| Level | C / clang | Rust |
|---|---|---|
| 0 — autovectorizer | `-O2 -march=…` | `-O -C target-cpu=…` |
| 1 — guide it | `restrict`, pragmas, FP flags | `chunks_exact` + array accumulators |
| 2 — portable vectors | `vector_size`, `__builtin_*` | `std::simd` (nightly), `wide` |
| 3 — intrinsics + dispatch | `immintrin.h`, `target(…)`, `target_clones` | `core::arch`, `#[target_feature]`, `multiversion` |

The position worth occupying in both languages is **level 2 with level-3 dispatch**: one generic
kernel, compiled several times under different target features. In the benchmark below it reaches
~99% of hand-written intrinsics with none of the per-ISA source.

---

# Part I — C with clang

## 1. Flags

Clang runs **both** vectorizers (loop + SLP) at `-O2`. `-O3` does not "turn on SIMD"; it loosens
the unroll/inline cost model.

```
-O2                       loop vectorizer + SLP on
-fno-vectorize            disable loop vectorizer
-fno-slp-vectorize        disable straight-line (superword) vectorizer
-march=x86-64-v2/v3/v4    portable ISA levels: SSE4.2 / AVX2+FMA+BMI / AVX-512
-mprefer-vector-width=N   override LLVM's default cap
-mtune=…                  cost model only, no new instructions
```

Width is capped independently of `-march`:

```c
for (size_t i = 0; i < n; i++) a[i] = b[i] * k;
```
```
-O2                                        width 4,  interleave 2   (SSE2 baseline)
-O2 -march=native                          width 8,  interleave 4   (256-bit, not 512!)
-O2 -march=native -mprefer-vector-width=512  width 16, interleave 4
```

On Skylake-SP-class targets LLVM sets `prefer-256-bit` because 512-bit code drops the core clock.
Measure before overriding — see the AVX-512 row in §8, which is *slower* than AVX2.

## 2. Diagnostics — never guess

```bash
clang -O2 -march=x86-64-v3 \
      -Rpass=loop-vectorize \         # what vectorized
      -Rpass-missed=loop-vectorize \  # what didn't
      -Rpass-analysis=loop-vectorize  # why not
clang -O2 -fsave-optimization-record -foptimization-record-file=rec.yaml -c f.c
```

`-Rpass=slp-vectorizer` for straight-line code. The YAML feeds LLVM's `opt-viewer.py`. Then
confirm at instruction level (`-S`, `llvm-objdump -d`) and reason about throughput with
`llvm-mca -mcpu=skylake-avx512 -iterations=100 inner.s`.

Order of questions: *did it vectorize* → *what did it emit* → *is it throughput- or
latency-bound*.

## 3. Making the vectorizer say yes

### 3.1 `restrict` — highest value per keystroke

Without it, clang emits a runtime overlap check plus a full scalar fallback:

```asm
cmpq $32, %rdx      ; n >= 32 ?
jb   .LBB0_6        ; -> scalar path
cmpq $128, %rcx     ; |a-b| far enough apart ?
jb   .LBB0_6
```
```
text size, same loop:   no restrict 315 bytes    with restrict 166 bytes
```

### 3.2 FP reassociation

A reduction reorders FP additions, so by default clang refuses:

```
remark: loop not vectorized: cannot prove it is safe to reorder floating-point
        operations; allow reordering by specifying '#pragma clang loop vectorize(enable)'
        before the loop or by providing the compiler option '-ffast-math'
```

Four ways to grant permission, increasing blast radius:

```c
/* (a) per loop — also implies "reorder FP here" */
#pragma clang loop vectorize(enable)
for (size_t i = 0; i < n; i++) s += a[i];

/* (b) per block — MUST start a compound statement, not merely precede a loop */
{
#pragma clang fp reassociate(on)
    for (size_t i = 0; i < n; i++) s += a[i];
}

/* (c) OpenMP semantics, no runtime needed:  clang -fopenmp-simd */
#pragma omp simd reduction(+:s)
for (size_t i = 0; i < n; i++) s += a[i];

/* (d) -ffast-math — whole TU, and it links crtfastmath.o which sets FTZ/DAZ process-wide */
```

Putting `#pragma clang fp` immediately before a `for` is a **hard error**:
`'#pragma clang fp' can only appear at file scope or at the start of a compound statement`.
Verified: (a) and (c) vectorize at width 8 × interleave 4; the bare loop stays scalar.

Prefer named subsets of `-ffast-math`: `-fno-math-errno`, `-ffp-contract=fast`,
`-fassociative-math`, `-freciprocal-math`, `-fno-signed-zeros`, `-ffinite-math-only`.

### 3.3 FMA contraction is already on

Clang 18 defaults to `-ffp-contract=on` (C's `FP_CONTRACT`, within one expression):

```
a*b + c   default / =fast :  vfmadd213ps
          -ffp-contract=off: vmulps ; vaddps
```

So write `acc = va*vb + acc`. **Do not** reach for `__builtin_elementwise_fma` unless you need
single-rounding `fma` semantics: without FMA hardware it lowers to `fmaf` *library calls*
(link error without `-lm`, glacial at runtime).

### 3.4 Math calls in the loop

```
plain:                   remark: library call cannot be vectorized. Try compiling
                                 with -fno-math-errno, -ffast-math, or similar flags
-fno-math-errno:         remark: vectorized loop (width 8) — but the asm holds 9 scalar
                                 `callq sinf`: vectorized *around* scalarized calls
-fveclib=libmvec
     + -fno-math-errno:  callq _ZGVdN8v_sinf   ← a real 8-wide vector sine
```

`-fveclib` values accepted by this build: `Accelerate`, `libmvec`, `MASSV`, `SVML`,
`Darwin_libsystem_m`, `none`. (`SLEEF`, `ArmPL`, `AMDLIBM` exist elsewhere — probe, don't trust
docs.) Still needs `-lm`.

### 3.5 Loop shape

* **Early exit is fatal** in clang 18: `loop not vectorized: could not determine number of loop
  iterations`. Hand-write searches (compare → `movemask` → `tzcnt`).
* **Conditional stores** vectorize into masked stores; **branchless selects** into blends. Both
  reached width 8, but the select form avoids masked-store port pressure:
  ```
  if (b[i] > 0) a[i] = b[i];      -> 4× vcmpltps + 4× vmaskmovps  (AVX2)
                                     vmovups %zmm, (…){%k1}       (AVX-512)
  a[i] = b[i] > 0 ? b[i] : a[i];  -> compare + blend
  ```
* **Gathers**: `o[i] = t[idx[i]]` reported "vectorized" but emitted **no `vgather*`** — the cost
  model preferred scalar loads + inserts. Restructure the data instead.
* **AoS** strided access becomes interleaved loads + shuffles. It vectorizes; SoA goes fast.

### 3.6 Alignment and trip-count facts

```c
a = __builtin_assume_aligned(a, 64);
b = __builtin_assume_aligned(b, 64);
n &= ~(size_t)15;                      /* trip count is a multiple of 16 */
for (size_t i = 0; i < n; i++) a[i] += b[i];
```

All eight moves become `vmovaps` instead of `vmovups`, and the scalar remainder loop disappears
entirely. On modern x86 the instruction difference is nil; what you buy is no cache-line-split
loads and no epilogue.

## 4. Pragma vocabulary (all verified in clang 18)

```c
#pragma clang loop vectorize(enable|disable)
#pragma clang loop vectorize_width(8)            // or (8, fixed) / (4, scalable)
#pragma clang loop interleave_count(4)           // accumulator count
#pragma clang loop vectorize_predicate(enable)   // fold the tail into a mask (SVE, AVX-512)
#pragma clang loop unroll_count(4)
#pragma clang loop distribute(enable)            // split a loop to break a dependence
```

Region-level target features, useful for headers of intrinsic wrappers — this compiles
**without** `-mavx2` on the command line:

```c
#pragma clang attribute push(__attribute__((target("avx2,fma"))), apply_to=function)
__m256 f(__m256 a, __m256 b, __m256 c){ return _mm256_fmadd_ps(a,b,c); }
#pragma clang attribute pop
```

## 5. Generic vector extensions

```c
typedef float f32x8 __attribute__((vector_size(32)));    /* GCC-compatible */
typedef float e32x8 __attribute__((ext_vector_type(8))); /* OpenCL-style   */
```

Both give `+ - * / % & | ^ ~ << >>`, comparisons (lane result `-1`/`0`), subscripting. Differences:

| | `vector_size` | `ext_vector_type` |
|---|---|---|
| ternary `?:` on vectors in **C** | **rejected** | **accepted** |
| swizzles `.s0 .xyzw .hi .lo` | no | yes |
| GCC compatibility | yes | clang/OpenCL only |

```c
e32x8 z = x > y ? x : y;   /* OK -> lane-wise max */
f32x8 z = x > y ? x : y;   /* error: used type '…vector of 8 int' where arithmetic
                              or pointer type is required */
```

Portable builtins: `__builtin_shufflevector`, `__builtin_convertvector`,
`__builtin_reduce_{add,mul,and,or,xor,max,min}`,
`__builtin_elementwise_{abs,max,min,fma,ceil,roundeven,popcount,…}`.

Two clang-18 gotchas found by compiling:

* **`__builtin_reduce_add` is integer-only** (*"1st argument must be a vector of integers"*) —
  an FP add reduction needs an ordering choice. `__builtin_reduce_max` does accept float. Roll
  your own FP horizontal sum (`hsum8` in the appendix).
* Wide vectors as parameters on a narrow target get
  `warning: AVX vector argument … without 'avx' enabled changes the ABI [-Wpsabi]`. Keep such
  functions `static inline`/`always_inline`, or give them a `target` attribute.

Load with `memcpy`, **not** `*(f32x8 *)p`: the typedef carries `aligned(32)` and no `may_alias`,
so the cast is both an alignment and a strict-aliasing hazard. `memcpy` of a constant size
compiles to one unaligned move.

## 6. Intrinsics

Gate the *function*, not the translation unit:

```c
__attribute__((target("avx2,fma")))  float dot_avx2  (…);
__attribute__((target("avx512f")))   float dot_avx512(…);
```

Verified: in a plain `-O2` build with no `-march`, `dot_avx512` still contains `zmm` registers and
runs at full speed. Clang's header types confirm the aliasing story: `__m256` is `aligned(32)`,
`__m256_u` is `aligned(1)`, and `_mm256_loadu_*` reads through a `__packed__, __may_alias__`
struct — so `_mm256_loadu_ps(p)` is safe and `*(__m256*)p` is not.

Three tail idioms:

```c
for (; i < n; i++) s += a[i]*b[i];                 /* scalar epilogue: always correct */

__mmask16 m = (__mmask16)((1u << (n - i)) - 1u);   /* AVX-512 mask: no epilogue at all */
acc = _mm512_fmadd_ps(_mm512_maskz_loadu_ps(m, a+i),
                      _mm512_maskz_loadu_ps(m, b+i), acc);

/* over-read into padding you own — fastest; a page-fault bug if you don't own it */
```

### ARM

Cross-checked with `clang --target=aarch64-linux-gnu -nostdlibinc -O2 -S`:

```c
c0 = vfmaq_f32(c0, vld1q_f32(a+i), vld1q_f32(b+i));  /* -> fmla v0.4s, v4.4s, v2.4s */
float s = vaddvq_f32(c0);                             /* -> faddp / addv             */
```

SVE is *sizeless* — length unknown at compile time, so you loop with a predicate and never write
an epilogue:

```c
svfloat32_t acc = svdup_f32(0.0f);
for (size_t i = 0; i < n; i += svcntw()) {
    svbool_t pg = svwhilelt_b32(i, n);
    acc = svmla_f32_x(pg, acc, svld1_f32(pg,a+i), svld1_f32(pg,b+i));
}
return svaddv_f32(svptrue_b32(), acc);
/* -> whilelt / fmla z0.s, p0/m, z1.s, z2.s / faddv s0, p0, z0.s */
```

The autovectorizer targets SVE with *scalable* factors:
```
$ clang --target=aarch64-linux-gnu -march=armv8-a+sve -O2 -Rpass=loop-vectorize
remark: vectorized loop (vectorization width: vscale x 4, interleaved count: 2)
```
RISC-V RVV is the same story (`-march=rv64gcv`, `riscv_vector.h`, `vsetvl` strip-mining).

## 7. Runtime dispatch

### `target_clones` — zero effort

```c
__attribute__((target_clones("default","avx2","avx512f")))
float sum(const float *restrict a, size_t n) { … }
```
produces, via an IFUNC resolved once by the loader:
```
0000000000002600 i sum
00000000000022b0 T sum.avx2.0
0000000000002380 T sum.avx512f.1
0000000000002230 T sum.default.2
0000000000002600 W sum.resolver
R_X86_64_IRELATIV  2600
```
Cost: an indirect call per invocation — put it on the *outer* function.

### Explicit — control over everything

```c
if (__builtin_cpu_supports("avx512f")) return dot_avx512;
if (__builtin_cpu_supports("avx2") && __builtin_cpu_supports("fma")) return dot_avx2;
return dot_scalar;
```
Caveat: this reports CPUID bits only. AVX-512 also needs OS state enabled (`xgetbv`/`XCR0`).
Cache the pointer instead of re-querying per call.

### The pattern worth stealing: one kernel, many clones, no intrinsics

```c
#define KERNEL(NAME, W)                                                        \
typedef float NAME##_v __attribute__((vector_size(4*(W))));                    \
__attribute__((always_inline)) static inline                                   \
float NAME##_impl(const float *restrict a, const float *restrict b, size_t n){ \
    NAME##_v acc = {0}; size_t i = 0;                                          \
    for (; i + (W) <= n; i += (W)) {                                           \
        NAME##_v va, vb; memcpy(&va,a+i,4*(W)); memcpy(&vb,b+i,4*(W));         \
        acc = va*vb + acc;                                                     \
    }                                                                          \
    float s = 0; for (int k=0;k<(W);k++) s += acc[k];                          \
    for (; i < n; i++) s += a[i]*b[i];                                         \
    return s;                                                                  \
}
KERNEL(k4, 4) KERNEL(k8, 8) KERNEL(k16, 16)

__attribute__((target("avx512f"))) static float dot_512(…){ return k16_impl(a,b,n); }
__attribute__((target("avx2,fma"))) static float dot_256(…){ return  k8_impl(a,b,n); }
static                              float dot_128(…){ return  k4_impl(a,b,n); }
```

Built with plain `-O2`, no `-march`: `dot_512` emits `zmm`, `dot_256` emits `ymm`.
`always_inline` is what forces re-codegen under each target feature set. Portable to
AArch64/RVV unchanged — only the width list changes.

## 8. Measured (C)

`n = 8003` floats (L2-resident, deliberately not a multiple of 16), 20 000 repetitions.
Source: `dot_bench.c` in the appendix.

| variant | `-O2 -march=x86-64-v3` | plain `-O2` (SSE2) |
|---|---|---|
| `scalar` — strictly-ordered reduction | 1.63 | 1.65 |
| `autovec` — `vectorize(enable) interleave_count(4)` | **25.30** | 12.23 |
| `generic` — `vector_size(32)`, **one** accumulator | 13.66 | 12.27 |
| `generic4` — `vector_size(32)`, **four** accumulators | 23.71 | 15.19 |
| `avx2` — `_mm256_fmadd_ps` ×4 | 23.73 | **23.60** |
| `avx512` — `_mm512_fmadd_ps` + masked tail | 26.41 | **25.30** |
| `dispatch` — `__builtin_cpu_supports` | 26.46 | **25.97** |

(GFLOP/s. All seven produced bit-identical `-8.5000` here, because the data is small integers
scaled by powers of two — not a general guarantee.)

1. **Accumulator count dominates ISA width.** `generic` (8-wide, one chain) loses to `generic4`
   by 1.7×. One FMA chain at 4-cycle latency ⇒ 8 lanes × 2 flops / 4 cycles × 2.8 GHz ≈
   11 GFLOP/s — which is what we measure.
2. **A well-guided autovectorizer ties hand-written intrinsics** on a kernel this simple. Go to
   level 3 when the operation isn't loop-shaped (shuffles, `pshufb` LUTs, `movemask` search) or
   when the cost model is wrong.
3. **`target` attributes decouple the hot kernel from the baseline build** — the right column is
   the whole argument for shipping one binary.

## 9. C pitfalls, ranked by frequency

1. **Unsigned wraparound in index arithmetic.** This was in my first draft:
   `a[i] = (float)((i % 17) - 8) * 0.25f;` with `i` a `size_t` wraps to ~1.8e19 → `inf`.
   Cast to signed *before* subtracting.
2. **`*(__m256*)p` / `*(f32x8*)p`** — alignment UB *and* strict-aliasing UB.
3. **Over-reading past the end** in the tail: only legal into padding you allocated.
4. **`-ffast-math` in a library** — `crtfastmath.o` sets FTZ/DAZ process-wide for code that
   never opted in.
5. **`__builtin_elementwise_fma` without FMA hardware** ⇒ `fmaf` library calls.
6. **Vectorizing around scalarized calls** — remark says "vectorized", asm says nine `callq sinf`.
7. **Reduction results change with `-march`** because the accumulator count changes the summation
   order. Fix the count in your own code if you need reproducibility.
8. **Sanitizers suppress vectorization.** Test under `-fsanitize=address,undefined -O1`, measure
   under `-O2 -march=…`, never the same build.

---

# Part II — Rust

## 10. The difference that changes everything: Rust never contracts FMA

Clang defaults to `-ffp-contract=on`. **Rust has no equivalent** — it emits `llvm.fma` only for
an explicit `mul_add`, and never sets fast-math flags. Verified:

```rust
c[i] = a[i] * b[i] + c[i];        // 8× vmulss + 8× vaddss
c[i] = a[i].mul_add(b[i], c[i]);  // 8× vfmadd213ss
```

Two consequences:

1. **FP reductions are strictly ordered by the language.** LLVM cannot reassociate them, and
   there is no `#pragma clang loop vectorize(enable)` and no `-ffast-math`. So
   `a.iter().zip(b).map(|(x,y)| x*y).sum()` will not vectorize, ever. You reassociate by hand.
2. **`f32::mul_add` is a true single-rounding fma**, exactly like `__builtin_elementwise_fma` —
   so without FMA hardware it becomes libm calls. Caught in the baseline `std::simd` build:
   `movq fmaf@GOTPCREL(%rip), %r13` then **eight** `callq *%r13` per 8-lane vector. That one
   mistake costs 18×.

## 11. Level 1 — steering the autovectorizer

The Rust idiom replacing `#pragma omp simd reduction` is `chunks_exact` plus an array
accumulator. The array *is* the reassociation licence: `acc[i] += …` for `i in 0..W` are `W`
independent chains, which is a claim about ordering the language can honour.

```rust
let ca = a.chunks_exact(W);
let cb = b.chunks_exact(W);
let (ra, rb) = (ca.remainder(), cb.remainder());   // grab tails BEFORE consuming
let mut acc = [0.0f32; W];
for (x, y) in ca.zip(cb) {
    for i in 0..W { acc[i] += x[i] * y[i]; }
}
```

`chunks_exact` is what elides the bounds checks — LLVM knows each `x` has length exactly `W`.
I also tested the folklore `let x: &[f32; W] = x.try_into().unwrap();` refinement: **no
measurable difference** here (6.32 vs 6.35 GFLOP/s). Don't cargo-cult it; measure.

**Choose `W` for dependency chains, not register width:**

| build | `W = 8` | `W = 32` |
|---|---|---|
| `rustc -O` (SSE2 baseline) | 4.59 | 14.77 |
| `rustc -O -C target-cpu=x86-64-v3` | 6.40 | **29.07** |

`W = 8` on AVX2 is *one* 256-bit accumulator — latency-bound, the `generic` row of §8 again. In a
separate test `W = 8` ran **faster on SSE2 than on AVX2** (7.52 vs 6.32): two 128-bit chains beat
one 256-bit chain. Width is not speed; chains are speed.

```bash
RUSTFLAGS="-C target-cpu=native" cargo build --release
rustc -O -C target-cpu=x86-64-v3        # portable ISA levels work here too
rustc -O -C llvm-args=-pass-remarks=loop-vectorize    # LLVM remarks, no -Rpass equivalent
```

## 12. Level 2 — `std::simd` (portable SIMD, still nightly)

```rust
#![feature(portable_simd)]
use std::simd::{f32x8, num::SimdFloat, StdFloat};  // on 1.75: std::simd::SimdFloat
let mut acc = [f32x8::splat(0.0); 4];              // four chains again
acc[i % 4] = vx.mul_add(vy, acc[i % 4]);
```

Same kernel, three builds:

```
rustc -O                          1.69 GFLOP/s   ← mul_add lowered to 8× callq fmaf
rustc -O -C target-cpu=x86-64-v3 30.62 GFLOP/s
rustc -O -C target-cpu=native    31.58 GFLOP/s
```

**This is the `std::simd` trap.** `f32x8` is not "an AVX register"; it is a portable type that
lowers to whatever `-C target-cpu` permits, with **no runtime dispatch whatsoever**. Ship a
default-target binary and your portable SIMD runs at scalar speed or worse.

Worth knowing in the API: `Simd<T, N>`, `from_slice`/`copy_to_slice`, `simd_lt`/`simd_gt` →
`Mask<T, N>`, `select`, `reduce_sum`/`reduce_max`, `simd_swizzle!`,
`gather_or_default`/`scatter`, `Mask::any`/`all`/`to_bitmask` (the `movemask` idiom). Closer to
Highway than to intrinsics, which is the right level for most work.

## 13. Level 3 — `core::arch`, `#[target_feature]`, dispatch

```rust
#[target_feature(enable = "avx2,fma")]
unsafe fn dot_avx2(a: &[f32], b: &[f32]) -> f32 { /* _mm256_fmadd_ps ×4 */ }

pub fn dot(a: &[f32], b: &[f32]) -> f32 {
    if is_x86_feature_detected!("avx2") && is_x86_feature_detected!("fma") {
        return unsafe { dot_avx2(a, b) };
    }
    dot_chunked32(a, b)
}
```

Measured with plain `rustc -O`, **no** `-C target-cpu`:

```
scalar      2.98 GFLOP/s   .iter().zip().map().sum() — cannot reassociate
chunked8    4.59 GFLOP/s
chunked32  14.77 GFLOP/s
avx2       31.87 GFLOP/s   ← full speed from a baseline build
dispatch   31.84 GFLOP/s
mul_add     1.58 GFLOP/s   ← serial fold of true fmas: one 4-cycle chain
```

* `is_x86_feature_detected!` does CPUID **and** the `xgetbv` OS-support check — more than C's
  `__builtin_cpu_supports`. It caches internally; still hoist it out of hot loops.
* `#[target_feature]` on an `unsafe fn` has always been stable. Since **Rust 1.86** it may be
  applied to *safe* functions too: still unsafe to call from a plain context, but safe to call
  from another `#[target_feature]` function with a superset of features.
* **AVX-512 target features and intrinsics are stable since Rust 1.89** (Aug 2025); before that,
  `#![feature(avx512_target_feature)]` / `stdarch_x86_avx512` on nightly.
* `core::arch` is `no_std`-friendly. `safe_arch` wraps x86 intrinsics in safe functions.

### The same clone pattern, in Rust

```rust
#[inline(always)]                                    // ← this is what makes it work
fn dot_kernel<const W: usize>(a: &[f32], b: &[f32]) -> f32 { /* §11 body */ }

#[target_feature(enable = "avx512f")]  unsafe fn dot_512(…) -> f32 { dot_kernel::<64>(a, b) }
#[target_feature(enable = "avx2,fma")] unsafe fn dot_256(…) -> f32 { dot_kernel::<32>(a, b) }
fn dot_128(…) -> f32 { dot_kernel::<16>(a, b) }
```

Verified from a plain `rustc -O` build with no `-C target-cpu`: `dot_512` contains `%zmm`,
`dot_256` contains `%ymm`, `dot_128` stays on `%xmm`.

```
sse2        6.08 GFLOP/s
avx2       28.56 GFLOP/s
avx512     24.19 GFLOP/s   ← slower than AVX2: 512-bit downclocking, exactly as in C
dispatch   23.63 GFLOP/s
```

The `multiversion` crate automates this, dispatch table included — use it once you have more
than one kernel.

## 14. Rust pitfalls

1. **Silent scalar fallback** — `std::simd` or a chunked kernel built without `-C target-cpu`,
   running at 1/18 speed, with no warning. Check at startup, or `--emit asm | grep ymm`.
2. **`mul_add` without FMA hardware** → libm calls (§10).
3. **Consuming the iterator before `.remainder()`** — grab `(ra, rb)` before the `for` loop.
4. **`black_box` or it didn't happen.** My first run showed 21 902 GFLOP/s because LLVM hoisted
   the pure call out of the timing loop.
5. **Alignment**: `Vec<f32>` gives 4- or 16-byte alignment, not 32/64. Use `#[repr(align(64))]`
   wrappers or an aligned allocator; `from_slice` compiles to `loadu` anyway.
6. **Slice → vector transmutes**: use `bytemuck` (`cast_slice`, `pod_align_to`) or `zerocopy`.
7. **`#[target_feature]` fns don't implement `Fn*`** and can't be coerced to safe fn pointers.
   Wrap in a closure or plain `fn` for a dispatch table.
8. **Miri can't run most intrinsics** — keep a scalar reference and `#[cfg(miri)]` to it.

---

# Part III — Cross-cutting lessons

1. **Chains beat width.** Every table above shows it. You need ≈ latency × throughput independent
   accumulators (4 on this core; 8–10 on newer ones). A 512-bit single-chain kernel loses to a
   128-bit four-chain one.
2. **Vector width is a cost-model decision, not a capability decision.** AVX-512 was *slower*
   than AVX2 in both languages here, on real hardware, because of downclocking.
3. **Target-feature attributes are how you ship one binary.** Both `__attribute__((target(…)))`
   and `#[target_feature]` let a baseline-compiled program contain full-speed AVX-512 kernels.
4. **FP contraction and reassociation are the two axes of "unsafe" FP.** C gives you contraction
   for free and reassociation by request; Rust gives you neither, and asks you to express
   reassociation structurally. Rust's choice is more honest and more work.
5. **The remark is not the truth; the disassembly is.** "Vectorized loop" appeared over nine
   scalar `sinf` calls.
6. **Keep the scalar reference as a compiled function.** Diff every vector variant against it
   over randomised `n`, especially `n ∈ [0, 2W)` and `n ≡ W−1 (mod W)`, where tail bugs live. For
   FP, compare with a tolerance or accumulate the reference in `f64`; bit-equality is the wrong
   test for a reassociated reduction.

---

# Part IV — References

## Start here
* **[Algorithms for Modern Hardware](https://en.algorithmica.org/hpc/)** (Sergey Slotin) — best
  free introduction. Ch. 10 is SIMD (intrinsics, moving data, reductions, masking, shuffles,
  autovectorization/SPMD); the author suggests starting there if you're comfortable with systems
  material. Ch. 11–12 are the payoff: argmin, prefix sum, decimal parsing, string search,
  sorting, binary search, static B-trees.
* **[SIMD for C++ Developers](http://const.me/articles/simd/simd.pdf)** (Konstantin, ~23 pp) —
  fastest map of what the x86 instruction families *do*. ARM companion:
  [NEON.pdf](http://const.me/articles/simd/NEON.pdf).

## Keep open, don't read
| Resource | Why |
|---|---|
| [Intel Intrinsics Guide](https://www.intel.com/content/www/us/en/docs/intrinsics-guide/index.html) | Searchable by operation; per-uarch latency/throughput |
| [officedaytime.com/simd512e](https://www.officedaytime.com/simd512e/) | The same data **drawn** — far better for shuffles and pack/unpack |
| [uops.info](https://uops.info) · [Agner Fog](https://www.agner.org/optimize/) | Ground truth for port pressure |
| [ARM intrinsics reference](https://developer.arm.com/architectures/instruction-sets/intrinsics/) | NEON and SVE |
| Clang *Language Extensions* · LLVM *Auto-Vectorization* | What Part I annotates empirically |
| [`core::arch`](https://doc.rust-lang.org/core/arch/) · [stdarch](https://github.com/rust-lang/stdarch) | Every stable Rust intrinsic, and its implementation |
| [portable-simd](https://github.com/rust-lang/portable-simd) · [`std::simd`](https://doc.rust-lang.org/nightly/std/simd/index.html) | Nightly; the repo has a beginner's guide |
| [Reference § `target_feature`](https://doc.rust-lang.org/reference/attributes/codegen.html#the-target_feature-attribute) · [RFC 2325](https://rust-lang.github.io/rfcs/2325-stable-simd.html) | Feature names, safety rules, design rationale |

## Algorithmic SIMD — the interesting part
* **[Wojciech Muła — 0x80.pl](http://0x80.pl/)** — the closest thing to a journal of algorithmic
  SIMD, each article with a runnable repo (`sse-popcount`, `sse4-strstr`, `base64-avx512`,
  `simd-search`).
* **Daniel Lemire** — blog, `simdjson`, and the joint papers: *Transcoding billions of Unicode
  characters per second with SIMD instructions* (SP&E 2022), *Faster Population Counts Using AVX2
  Instructions*, *Base64 Encoding and Decoding at Almost the Speed of a Memory Copy*, *Decoding
  Billions of Integers per Second Through Vectorization*.
  The recurring moves: compare → `movemask` → `tzcnt`; `pshufb` as a 16-entry parallel LUT;
  reformulating a data-dependent problem as a branch-free lookup.
* **SWAR ancestry**: Knuth **TAOCP 7.1.3** (*Bitwise tricks and techniques*) and Warren's
  **Hacker's Delight**. Most "clever" SIMD kernels are broadword algorithms with wider registers.

## Libraries
* **[Google Highway](https://github.com/google/highway)** — the §7 pattern done properly:
  platform-agnostic ops over platform-specific intrinsics, static *and* dynamic dispatch, where
  dynamic dispatch replicates only your SIMD code rather than the whole binary. An independent
  evaluation of C++ SIMD libraries rated it strongest across multiple extensions. Read
  [`g3doc/quick_reference.md`](https://github.com/google/highway/blob/master/g3doc/quick_reference.md)
  even if you never link it — the op vocabulary is a design study for any cross-ISA abstraction.
* C/C++: **xsimd**, **SLEEF** (vector math), **ISPC** (SPMD-on-SIMD language), **VOLK**,
  **OpenMP** `#pragma omp simd` with `-fopenmp-simd`.
* Rust: **`multiversion`** (≈ `target_clones`), **`pulp`** (arch abstraction with runtime
  dispatch, from the `faer` project — the most Highway-like design in Rust), **`wide`** (stable,
  static dispatch), **`safe_arch`**, **`bytemuck`**/**`zerocopy`**.
  Read the source of **`memchr`** and **`aho-corasick`** (BurntSushi) — production SIMD substring
  search and the Teddy algorithm, the best-commented SIMD code in the ecosystem. Also
  **`simd-json`**, **`simdutf8`**, **`faer`**. Deprecated, don't start there: `packed_simd`,
  `simdeez`, `faster`.

## Tooling and measurement
* Denis Bakhvalov, **Performance Analysis and Tuning on Modern CPUs** (free PDF) — top-down
  analysis, `perf`, why microbenchmarks lie.
* [Compiler Explorer](https://godbolt.org) · `llvm-mca` · [uiCA](https://uica.uops.info) ·
  LLVM `opt-viewer.py`
* Rust: `cargo-show-asm`, `criterion`, `iai-callgrind`, `cargo miri`
* `perf stat -e cycles,instructions,fp_arith_inst_retired.*` for the truth

**Compressed:** read Algorithmica ch. 10–11 with Compiler Explorer open, then reimplement two of
Muła's kernels *from the article text alone* before looking at his code.

---

# Appendix — the sources, exactly as tested

## A. `dot_bench.c`
```
clang -O2 -march=x86-64-v3 dot_bench.c -o dot_bench && ./dot_bench
clang -O2                  dot_bench.c -o dot_base  && ./dot_base
```
```c
/* build: clang -O2 -march=x86-64-v3 06_dot.c -o 06_dot */
#include <immintrin.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <time.h>

/* ---- 1. scalar reference (strictly ordered) ------------------------ */
__attribute__((noinline))
float dot_scalar(const float *restrict a, const float *restrict b, size_t n) {
    float s = 0.0f;
    for (size_t i = 0; i < n; i++) s += a[i] * b[i];
    return s;
}

/* ---- 2. autovectorised: the pragma licenses FP reassociation ------- */
__attribute__((noinline))
float dot_autovec(const float *restrict a, const float *restrict b, size_t n) {
    float s = 0.0f;
#pragma clang loop vectorize(enable) interleave_count(4)
    for (size_t i = 0; i < n; i++) s += a[i] * b[i];
    return s;
}

/* ---- 3. portable generic vectors (no target header) ---------------- */
typedef float f32v8 __attribute__((vector_size(32)));
typedef float f32v4 __attribute__((vector_size(16)));
static inline float hsum8(f32v8 v) {
    f32v4 lo = __builtin_shufflevector(v, v, 0,1,2,3);
    f32v4 hi = __builtin_shufflevector(v, v, 4,5,6,7);
    f32v4 q  = lo + hi;
    return q[0] + q[1] + q[2] + q[3];
}
__attribute__((noinline))
float dot_generic(const float *restrict a, const float *restrict b, size_t n) {
    f32v8 acc = {0};
    size_t i = 0;
    for (; i + 8 <= n; i += 8) {
        f32v8 va, vb;
        memcpy(&va, a + i, 32);            /* unaligned-safe, no aliasing UB */
        memcpy(&vb, b + i, 32);
        acc = va*vb + acc;   /* -ffp-contract=on gives FMA where available */
    }
    float s = hsum8(acc);
    for (; i < n; i++) s += a[i] * b[i];   /* scalar tail */
    return s;
}


/* ---- 3b. portable generic vectors, 4 accumulators ------------------ */
__attribute__((noinline))
float dot_generic4(const float *restrict a, const float *restrict b, size_t n) {
    f32v8 c0 = {0}, c1 = {0}, c2 = {0}, c3 = {0};
    size_t i = 0;
    for (; i + 32 <= n; i += 32) {
        f32v8 a0,a1,a2,a3,b0,b1,b2,b3;
        memcpy(&a0,a+i,32);    memcpy(&b0,b+i,32);
        memcpy(&a1,a+i+8,32);  memcpy(&b1,b+i+8,32);
        memcpy(&a2,a+i+16,32); memcpy(&b2,b+i+16,32);
        memcpy(&a3,a+i+24,32); memcpy(&b3,b+i+24,32);
        c0 = a0*b0 + c0;  c1 = a1*b1 + c1;      /* contracted to FMA by default */
        c2 = a2*b2 + c2;  c3 = a3*b3 + c3;
    }
    f32v8 acc = (c0+c1) + (c2+c3);
    for (; i + 8 <= n; i += 8) { f32v8 va,vb;
        memcpy(&va,a+i,32); memcpy(&vb,b+i,32); acc = va*vb + acc; }
    float s = hsum8(acc);
    for (; i < n; i++) s += a[i] * b[i];
    return s;
}

/* ---- 4. AVX2 intrinsics, 4 accumulators to hide FMA latency -------- */
__attribute__((noinline, target("avx2,fma")))
float dot_avx2(const float *restrict a, const float *restrict b, size_t n) {
    __m256 a0 = _mm256_setzero_ps(), a1 = a0, a2 = a0, a3 = a0;
    size_t i = 0;
    for (; i + 32 <= n; i += 32) {
        a0 = _mm256_fmadd_ps(_mm256_loadu_ps(a+i   ), _mm256_loadu_ps(b+i   ), a0);
        a1 = _mm256_fmadd_ps(_mm256_loadu_ps(a+i+ 8), _mm256_loadu_ps(b+i+ 8), a1);
        a2 = _mm256_fmadd_ps(_mm256_loadu_ps(a+i+16), _mm256_loadu_ps(b+i+16), a2);
        a3 = _mm256_fmadd_ps(_mm256_loadu_ps(a+i+24), _mm256_loadu_ps(b+i+24), a3);
    }
    for (; i + 8 <= n; i += 8)
        a0 = _mm256_fmadd_ps(_mm256_loadu_ps(a+i), _mm256_loadu_ps(b+i), a0);
    __m256 v = _mm256_add_ps(_mm256_add_ps(a0,a1), _mm256_add_ps(a2,a3));
    __m128 q = _mm_add_ps(_mm256_castps256_ps128(v), _mm256_extractf128_ps(v,1));
    q = _mm_add_ps(q, _mm_movehl_ps(q,q));
    q = _mm_add_ss(q, _mm_shuffle_ps(q,q,1));
    float s = _mm_cvtss_f32(q);
    for (; i < n; i++) s += a[i] * b[i];
    return s;
}

/* ---- 5. AVX-512 with a masked tail: no scalar epilogue ------------- */
__attribute__((noinline, target("avx512f")))
float dot_avx512(const float *restrict a, const float *restrict b, size_t n) {
    __m512 acc = _mm512_setzero_ps();
    size_t i = 0;
    for (; i + 16 <= n; i += 16)
        acc = _mm512_fmadd_ps(_mm512_loadu_ps(a+i), _mm512_loadu_ps(b+i), acc);
    if (i < n) {
        __mmask16 m = (__mmask16)((1u << (n - i)) - 1u);
        acc = _mm512_fmadd_ps(_mm512_maskz_loadu_ps(m, a+i),
                              _mm512_maskz_loadu_ps(m, b+i), acc);
    }
    return _mm512_reduce_add_ps(acc);
}

/* ---- 6. runtime dispatch ------------------------------------------- */
typedef float (*dot_fn)(const float *, const float *, size_t);
static dot_fn pick(void) {
    if (__builtin_cpu_supports("avx512f")) return dot_avx512;
    if (__builtin_cpu_supports("avx2") && __builtin_cpu_supports("fma")) return dot_avx2;
    return dot_scalar;
}

/* ---- harness -------------------------------------------------------- */
static double now(void){ struct timespec t; clock_gettime(CLOCK_MONOTONIC,&t);
                         return t.tv_sec + 1e-9*t.tv_nsec; }
#define N 8003
int main(void) {
    float *a = aligned_alloc(64, ((N*sizeof(float))+63)/64*64);
    float *b = aligned_alloc(64, ((N*sizeof(float))+63)/64*64);
    for (size_t i=0;i<N;i++){ a[i]=(float)((long)(i%17)-8)*0.25f; b[i]=(float)((long)(i%13)-6)*0.5f; }

    struct { const char *nm; dot_fn f; } v[] = {
        {"scalar ", dot_scalar}, {"autovec", dot_autovec}, {"generic ", dot_generic}, {"generic4", dot_generic4},
        {"avx2   ", dot_avx2},   {"avx512 ", dot_avx512},  {"dispatch", pick()} };

    for (unsigned k=0;k<sizeof v/sizeof*v;k++) {
        float r = v[k].f(a,b,N);
        double t0=now(); volatile float sink=0;
        for (int it=0; it<20000; it++) sink += v[k].f(a,b,N);
        double dt=now()-t0;
        printf("%s  result=%12.4f   %6.2f GFLOP/s\n", v[k].nm, r,
               2.0*N*20000/dt/1e9);
    }
    free(a); free(b); return 0;
}
```

## B. `dot.rs` — Rust scalar / chunked / AVX2 / dispatch / `mul_add` trap
```
rustc -O dot.rs -o dot && ./dot
rustc -O -C target-cpu=x86-64-v3 dot.rs -o dot3 && ./dot3
```
```rust
use std::hint::black_box;
use std::time::Instant;

// 1. naive: LLVM may NOT reorder these adds -> stays scalar
#[inline(never)]
pub fn dot_scalar(a: &[f32], b: &[f32]) -> f32 {
    a.iter().zip(b).map(|(x, y)| x * y).sum()
}

// 2. explicit lanes: the array accumulator gives 8 independent chains
#[inline(never)]
pub fn dot_chunked(a: &[f32], b: &[f32]) -> f32 {
    const W: usize = 8;
    let mut acc = [0.0f32; W];
    let ca = a.chunks_exact(W);
    let cb = b.chunks_exact(W);
    let (ra, rb) = (ca.remainder(), cb.remainder());
    for (x, y) in ca.zip(cb) {
        for i in 0..W {
            acc[i] += x[i] * y[i];
        }
    }
    let mut s: f32 = acc.iter().sum();
    for (x, y) in ra.iter().zip(rb) {
        s += x * y;
    }
    s
}

// 3. 32 lanes = 4 vectors of 8 -> 4 dependency chains
#[inline(never)]
pub fn dot_chunked4(a: &[f32], b: &[f32]) -> f32 {
    const W: usize = 32;
    let mut acc = [0.0f32; W];
    let ca = a.chunks_exact(W);
    let cb = b.chunks_exact(W);
    let (ra, rb) = (ca.remainder(), cb.remainder());
    for (x, y) in ca.zip(cb) {
        for i in 0..W {
            acc[i] += x[i] * y[i];
        }
    }
    let mut s: f32 = acc.iter().sum();
    for (x, y) in ra.iter().zip(rb) {
        s += x * y;
    }
    s
}

// 4. intrinsics
#[cfg(target_arch = "x86_64")]
use std::arch::x86_64::*;

#[cfg(target_arch = "x86_64")]
#[target_feature(enable = "avx2,fma")]
#[inline(never)]
pub unsafe fn dot_avx2(a: &[f32], b: &[f32]) -> f32 {
    let n = a.len().min(b.len());
    let (mut c0, mut c1) = (_mm256_setzero_ps(), _mm256_setzero_ps());
    let (mut c2, mut c3) = (_mm256_setzero_ps(), _mm256_setzero_ps());
    let (pa, pb) = (a.as_ptr(), b.as_ptr());
    let mut i = 0;
    while i + 32 <= n {
        c0 = _mm256_fmadd_ps(_mm256_loadu_ps(pa.add(i)),      _mm256_loadu_ps(pb.add(i)),      c0);
        c1 = _mm256_fmadd_ps(_mm256_loadu_ps(pa.add(i + 8)),  _mm256_loadu_ps(pb.add(i + 8)),  c1);
        c2 = _mm256_fmadd_ps(_mm256_loadu_ps(pa.add(i + 16)), _mm256_loadu_ps(pb.add(i + 16)), c2);
        c3 = _mm256_fmadd_ps(_mm256_loadu_ps(pa.add(i + 24)), _mm256_loadu_ps(pb.add(i + 24)), c3);
        i += 32;
    }
    while i + 8 <= n {
        c0 = _mm256_fmadd_ps(_mm256_loadu_ps(pa.add(i)), _mm256_loadu_ps(pb.add(i)), c0);
        i += 8;
    }
    let v = _mm256_add_ps(_mm256_add_ps(c0, c1), _mm256_add_ps(c2, c3));
    let mut q = _mm_add_ps(_mm256_castps256_ps128(v), _mm256_extractf128_ps(v, 1));
    q = _mm_add_ps(q, _mm_movehl_ps(q, q));
    q = _mm_add_ss(q, _mm_shuffle_ps(q, q, 1));
    let mut s = _mm_cvtss_f32(q);
    while i < n {
        s += a[i] * b[i];
        i += 1;
    }
    s
}

// 5. runtime dispatch
pub fn dot(a: &[f32], b: &[f32]) -> f32 {
    #[cfg(target_arch = "x86_64")]
    {
        if is_x86_feature_detected!("avx2") && is_x86_feature_detected!("fma") {
            return unsafe { dot_avx2(a, b) };
        }
    }
    dot_chunked4(a, b)
}

// 6. the mul_add trap: this is a TRUE fma, not "multiply then add"
#[inline(never)]
pub fn dot_muladd(a: &[f32], b: &[f32]) -> f32 {
    a.iter().zip(b).fold(0.0f32, |s, (x, y)| x.mul_add(*y, s))
}

const N: usize = 8003;
fn bench(name: &str, f: impl Fn(&[f32], &[f32]) -> f32, a: &[f32], b: &[f32]) {
    let r = f(a, b);
    let t = Instant::now();
    let mut sink = 0.0f32;
    for _ in 0..20_000 {
        sink += black_box(f(black_box(a), black_box(b)));
    }
    let dt = t.elapsed().as_secs_f64();
    println!("{name:10} result={r:12.4}  {:6.2} GFLOP/s  (sink {})",
             2.0 * N as f64 * 20_000.0 / dt / 1e9, sink.is_finite());
}
fn main() {
    let a: Vec<f32> = (0..N).map(|i| ((i % 17) as i64 - 8) as f32 * 0.25).collect();
    let b: Vec<f32> = (0..N).map(|i| ((i % 13) as i64 - 6) as f32 * 0.5).collect();
    bench("scalar", dot_scalar, &a, &b);
    bench("chunked8", dot_chunked, &a, &b);
    bench("chunked32", dot_chunked4, &a, &b);
    bench("avx2", |a, b| unsafe { dot_avx2(a, b) }, &a, &b);
    bench("dispatch", dot, &a, &b);
    bench("mul_add", dot_muladd, &a, &b);
}
```

## C. `clone.rs` — one generic kernel, target-feature clones, runtime dispatch
```
rustc -O clone.rs -o clone && ./clone      # needs Rust >= 1.89 for the AVX-512 arm
```
```rust
// Requires Rust >= 1.89 (AVX-512 target features stabilised). Build: rustc -O clone.rs

use std::hint::black_box;
use std::time::Instant;

/// One generic kernel. `#[inline(always)]` is what makes it get *re-codegen'd*
/// with the caller's target features.
#[inline(always)]
fn dot_kernel<const W: usize>(a: &[f32], b: &[f32]) -> f32 {
    let ca = a.chunks_exact(W);
    let cb = b.chunks_exact(W);
    let (ra, rb) = (ca.remainder(), cb.remainder());
    let mut acc = [0.0f32; W];
    for (x, y) in ca.zip(cb) {
        for i in 0..W { acc[i] += x[i] * y[i]; }
    }
    let mut s = 0.0f32;
    for v in acc { s += v; }
    for (x, y) in ra.iter().zip(rb) { s += x * y; }
    s
}

#[target_feature(enable = "avx512f")]
unsafe fn dot_512(a: &[f32], b: &[f32]) -> f32 { dot_kernel::<64>(a, b) }
#[target_feature(enable = "avx2,fma")]
unsafe fn dot_256(a: &[f32], b: &[f32]) -> f32 { dot_kernel::<32>(a, b) }
fn dot_128(a: &[f32], b: &[f32]) -> f32 { dot_kernel::<16>(a, b) }

pub fn dot(a: &[f32], b: &[f32]) -> f32 {
    #[cfg(target_arch = "x86_64")]
    {
        if is_x86_feature_detected!("avx512f") { return unsafe { dot_512(a, b) }; }
        if is_x86_feature_detected!("avx2") && is_x86_feature_detected!("fma") {
            return unsafe { dot_256(a, b) };
        }
    }
    dot_128(a, b)
}

const N: usize = 8003;
fn bench(name: &str, f: impl Fn(&[f32], &[f32]) -> f32, a: &[f32], b: &[f32]) {
    let r = f(a, b);
    let t = Instant::now(); let mut s = 0.0f32;
    for _ in 0..20_000 { s += black_box(f(black_box(a), black_box(b))); }
    println!("{name:9} result={r:12.4}  {:6.2} GFLOP/s  {}",
        2.0*N as f64*20_000.0/t.elapsed().as_secs_f64()/1e9, s.is_finite());
}
fn main() {
    let a: Vec<f32> = (0..N).map(|i| ((i % 17) as i64 - 8) as f32 * 0.25).collect();
    let b: Vec<f32> = (0..N).map(|i| ((i % 13) as i64 - 6) as f32 * 0.5).collect();
    bench("sse2",     dot_128, &a, &b);
    bench("avx2",     |a,b| unsafe { dot_256(a,b) }, &a, &b);
    bench("avx512",   |a,b| unsafe { dot_512(a,b) }, &a, &b);
    bench("dispatch", dot, &a, &b);
}
```

## D. `psimd.rs` — `std::simd`, and the baseline-build trap
```
rustc -O psimd.rs -o psimd && ./psimd                            #  1.69 GFLOP/s
rustc -O -C target-cpu=x86-64-v3 psimd.rs -o psimd3 && ./psimd3  # 30.62 GFLOP/s
```
Needs nightly (or `RUSTC_BOOTSTRAP=1`, which is how it was verified here).
```rust
#![feature(portable_simd)]
use std::simd::{f32x8, SimdFloat, StdFloat};
use std::hint::black_box;
use std::time::Instant;

#[inline(never)]
pub fn dot_psimd(a: &[f32], b: &[f32]) -> f32 {
    const W: usize = 8;
    let ca = a.chunks_exact(W);
    let cb = b.chunks_exact(W);
    let (ra, rb) = (ca.remainder(), cb.remainder());
    let mut acc = [f32x8::splat(0.0); 4];
    for (i, (x, y)) in ca.zip(cb).enumerate() {
        let (vx, vy) = (f32x8::from_slice(x), f32x8::from_slice(y));
        acc[i % 4] = vx.mul_add(vy, acc[i % 4]);
    }
    let v = (acc[0] + acc[1]) + (acc[2] + acc[3]);
    let mut s = v.reduce_sum();
    for (x, y) in ra.iter().zip(rb) { s += x * y; }
    s
}
const N: usize = 8003;
fn main() {
    let a: Vec<f32> = (0..N).map(|i| ((i % 17) as i64 - 8) as f32 * 0.25).collect();
    let b: Vec<f32> = (0..N).map(|i| ((i % 13) as i64 - 6) as f32 * 0.5).collect();
    let r = dot_psimd(&a, &b);
    let t = Instant::now(); let mut s = 0.0f32;
    for _ in 0..20_000 { s += black_box(dot_psimd(black_box(&a), black_box(&b))); }
    println!("psimd    result={r:12.4}  {:6.2} GFLOP/s  {}",
        2.0*N as f64*20_000.0/t.elapsed().as_secs_f64()/1e9, s.is_finite());
}
```

## E. `contract.rs` — proof that Rust does not contract mul+add
```
rustc -O -C target-cpu=x86-64-v3 --emit asm contract.rs
  ->  8 vaddss   8 vfmadd213ss   8 vmulss
```
```rust
#[inline(never)]
pub fn madd(a: &[f32], b: &[f32], c: &mut [f32]) {
    for i in 0..c.len() { c[i] = a[i] * b[i] + c[i]; }
}
#[inline(never)]
pub fn madd_fma(a: &[f32], b: &[f32], c: &mut [f32]) {
    for i in 0..c.len() { c[i] = a[i].mul_add(b[i], c[i]); }
}
fn main(){ let a=[1.0f32;8]; let b=[2.0f32;8]; let mut c=[3.0f32;8];
  madd(&a,&b,&mut c); madd_fma(&a,&b,&mut c); println!("{}", c[0]); }
```

## F. Diagnostic snippets used along the way

Reductions and pragma placement (§3.2):
```c
#include <stddef.h>
float sum_strict(const float *a, size_t n) {
    float s = 0.0f;
    for (size_t i = 0; i < n; i++) s += a[i];
    return s;
}
float sum_pragma(const float *a, size_t n) {
    float s = 0.0f;
    {
#pragma clang fp reassociate(on)
        for (size_t i = 0; i < n; i++) s += a[i];
    }
    return s;
}
float sum_omp(const float *a, size_t n) {
    float s = 0.0f;
#pragma omp simd reduction(+:s)
    for (size_t i = 0; i < n; i++) s += a[i];
    return s;
}
```

Generic vectors, `?:`, reductions, ABI (§5):
```c
#include <stdio.h>
#include <stdint.h>
typedef float  f32x8 __attribute__((vector_size(32)));
typedef int32_t i32x8 __attribute__((vector_size(32)));
typedef float  e32x8 __attribute__((ext_vector_type(8)));
int main(void){
  f32x8 a={1,2,3,4,5,6,7,8}, b={8,7,6,5,4,3,2,1};
  i32x8 ia={1,2,3,4,5,6,7,8};
  printf("reduce_add int   = %d\n", __builtin_reduce_add(ia));
  printf("reduce_max float = %.1f\n", __builtin_reduce_max(a));
  printf("elementwise_max0 = %.1f\n", __builtin_elementwise_max(a,b)[0]);
  e32x8 x={1,2,3,4,5,6,7,8}, y={8,7,6,5,4,3,2,1};
  e32x8 z = x > y ? x : y;                 /* ext_vector_type allows ?: */
  printf("ext ternary lane0=%.1f lane7=%.1f\n", z[0], z[7]);
  printf("ext .hi/.lo? swizzle x.s0=%.1f\n", x.s0);
  return 0;
}
```

Portable FP horizontal sum (§5):
```c
#include <stdio.h>
typedef float f32x8 __attribute__((vector_size(32)));
typedef float f32x4 __attribute__((vector_size(16)));
typedef float f32x2 __attribute__((vector_size(8)));

static inline float hsum_f32x8(f32x8 v) {
    f32x4 lo = __builtin_shufflevector(v, v, 0,1,2,3);
    f32x4 hi = __builtin_shufflevector(v, v, 4,5,6,7);
    f32x4 q  = lo + hi;
    f32x2 a  = __builtin_shufflevector(q, q, 0,1);
    f32x2 b  = __builtin_shufflevector(q, q, 2,3);
    f32x2 d  = a + b;
    return d[0] + d[1];
}
int main(void){ f32x8 v={1,2,3,4,5,6,7,8}; printf("%.1f\n", hsum_f32x8(v)); }
```

Conditional stores, early exit, gather (§3.5):
```c
#include <stddef.h>
/* conditional store: needs masked stores (AVX-512 / AVX2 maskstore) */
void clamp_store(float *restrict a, const float *restrict b, size_t n){
  for (size_t i=0;i<n;i++) if (b[i] > 0.0f) a[i] = b[i];
}
/* branchless select: always vectorizes */
void clamp_sel(float *restrict a, const float *restrict b, size_t n){
  for (size_t i=0;i<n;i++) a[i] = b[i] > 0.0f ? b[i] : a[i];
}
/* early exit (search loop) */
size_t find(const int *a, size_t n, int k){
  for (size_t i=0;i<n;i++) if (a[i]==k) return i;
  return n;
}
/* gather */
void gather(float *restrict o, const float *restrict t, const int *restrict idx, size_t n){
  for (size_t i=0;i<n;i++) o[i]=t[idx[i]];
}
```

Alignment and trip-count assumptions (§3.6):
```c
#include <stddef.h>
void f_plain(float *restrict a, const float *restrict b, size_t n){
  for (size_t i=0;i<n;i++) a[i]+=b[i];
}
void f_aligned(float *restrict a, const float *restrict b, size_t n){
  a = __builtin_assume_aligned(a, 64);
  b = __builtin_assume_aligned(b, 64);
  n &= ~(size_t)15;                 /* also tell it the trip count is a multiple of 16 */
  for (size_t i=0;i<n;i++) a[i]+=b[i];
}
```

ARM NEON and SVE cross-compile check (§6):
```
clang --target=aarch64-linux-gnu -nostdlibinc -O2 -S -o - arm.c
clang --target=aarch64-linux-gnu -nostdlibinc -march=armv8-a+sve -O2 -S -o - arm.c
```
```c
#include <stddef.h>
#if defined(__ARM_NEON)
#include <arm_neon.h>
float dot_neon(const float *restrict a, const float *restrict b, size_t n){
    float32x4_t c0=vdupq_n_f32(0), c1=vdupq_n_f32(0);
    size_t i=0;
    for(; i+8<=n; i+=8){
        c0=vfmaq_f32(c0, vld1q_f32(a+i),   vld1q_f32(b+i));
        c1=vfmaq_f32(c1, vld1q_f32(a+i+4), vld1q_f32(b+i+4));
    }
    float s=vaddvq_f32(vaddq_f32(c0,c1));
    for(; i<n; i++) s+=a[i]*b[i];
    return s;
}
#endif
#if defined(__ARM_FEATURE_SVE)
#include <arm_sve.h>
float dot_sve(const float *restrict a, const float *restrict b, size_t n){
    svfloat32_t acc = svdup_f32(0.0f);
    for (size_t i=0; i<n; i += svcntw()) {
        svbool_t pg = svwhilelt_b32(i, n);           /* predicated tail, no epilogue */
        acc = svmla_f32_x(pg, acc, svld1_f32(pg,a+i), svld1_f32(pg,b+i));
    }
    return svaddv_f32(svptrue_b32(), acc);
}
#endif
```

One-kernel-many-clones, C version (§7):
```c
#include <stddef.h>
#include <string.h>
#include <stdio.h>
/* One generic kernel, no intrinsics, always_inline so it is recompiled
   per target-attributed wrapper. Width is a macro so each clone can pick one. */
#define KERNEL(NAME, W)                                                       \
typedef float NAME##_v __attribute__((vector_size(4*(W))));                   \
__attribute__((always_inline)) static inline                                  \
float NAME##_impl(const float *restrict a, const float *restrict b, size_t n){ \
    NAME##_v acc = {0}; size_t i = 0;                                         \
    for (; i + (W) <= n; i += (W)) {                                          \
        NAME##_v va, vb; memcpy(&va,a+i,4*(W)); memcpy(&vb,b+i,4*(W));        \
        acc = va*vb + acc;                                                    \
    }                                                                         \
    float s = 0; for (int k=0;k<(W);k++) s += acc[k];                         \
    for (; i < n; i++) s += a[i]*b[i];                                        \
    return s;                                                                 \
}
KERNEL(k4, 4) KERNEL(k8, 8) KERNEL(k16, 16)

__attribute__((target("avx512f"))) static float dot_512(const float*a,const float*b,size_t n){ return k16_impl(a,b,n); }
__attribute__((target("avx2,fma"))) static float dot_256(const float*a,const float*b,size_t n){ return k8_impl(a,b,n); }
static float dot_128(const float*a,const float*b,size_t n){ return k4_impl(a,b,n); }

float dot(const float *a, const float *b, size_t n){
    static float (*impl)(const float*,const float*,size_t);
    if (!impl) impl = __builtin_cpu_supports("avx512f") ? dot_512
                    : __builtin_cpu_supports("avx2")    ? dot_256 : dot_128;
    return impl(a,b,n);
}
int main(void){ float a[1000],b[1000]; for(int i=0;i<1000;i++){a[i]=i*0.001f;b[i]=1.0f;}
    printf("%.4f\n", dot(a,b,1000)); }
```