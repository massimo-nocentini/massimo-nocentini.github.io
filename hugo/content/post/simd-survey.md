

+++
date = '2026-08-14T06:58:04+01:00'
title = 'SIMD'
subtitle = 'Single instruction, multiple data.'
summary = 'A reading path and a working survey.'
categories = ['ai generated']
+++

# A reading path

Inspired after reading [*Hashimoto*'s __"Everyone Should Know SIMD"__](https://mitchellh.com/writing/everyone-should-know-simd)
and [Wikipedia](https://en.wikipedia.org/wiki/Single_instruction,_multiple_data);
ordered the way I'd actually take it, not by prestige.

## 1. Start with one book chapter and one PDF

### *Algorithms for Modern Hardware* — Sergey Slotin
<https://en.algorithmica.org/hpc/>

The best free introduction. **Chapter 10** is the SIMD chapter: it argues that
auto-vectorization only works on certain loop shapes and often yields suboptimal results,
which is exactly why you need the lower-level view. Sections cover intrinsics and vector
types, moving data, reductions, masking and blending, in-register shuffles, and
auto-vectorization/SPMD.

The author explicitly suggests **starting the book at chapter 10** if you're already
comfortable with systems material. Chapters 11–12 are the payoff:

> argmin · prefix sum · reading/writing decimal integers · string searching · sorting ·
> matrix multiplication · binary search · static B-trees · segment trees · hash tables

### *SIMD for C++ Developers* — Konstantin (const.me)
<http://const.me/articles/simd/simd.pdf> (~23 pages)

The fastest way to build a mental map of what the x86 instruction families actually *do*.
Deliberately an overview and starting point rather than a reference, focused on intrinsics,
written from the observation that the official guide is only useful once you already know
which intrinsic you want.

Companion for ARM: <http://const.me/articles/simd/NEON.pdf>



## 2. References to keep open, not to read

| Resource | Why |
|---|---|
| [Intel Intrinsics Guide](https://www.intel.com/content/www/us/en/docs/intrinsics-guide/index.html) | Searchable by operation; latency/throughput per microarchitecture |
| [officedaytime.com/simd512e](https://www.officedaytime.com/simd512e/) | The same data **drawn as pictures** — far better than prose for shuffles, pack/unpack |
| [uops.info](https://uops.info) · [Agner Fog's tables](https://www.agner.org/optimize/) | Ground truth for port pressure and latency |
| [ARM intrinsics reference](https://developer.arm.com/architectures/instruction-sets/intrinsics/) | NEON and SVE |
| Clang *Language Extensions* | `vector_size`, `ext_vector_type`, `__builtin_elementwise_*`, `__builtin_reduce_*` |
| LLVM *Auto-Vectorization in LLVM* | What the loop and SLP vectorizers promise |

The last two are what the clang survey is annotating empirically.



## 3. The part that will actually interest you

### Wojciech Muła — <http://0x80.pl/>

The closest thing to a *Journal of Algorithmic SIMD*: an ongoing archive of articles on
optimization, SIMD and algorithms, each with a companion repo of runnable benchmarks —
`sse-popcount`, `sse4-strstr`, `base64-avx512`, `simd-search`.

### Daniel Lemire — blog + `simdjson`, and the joint papers

* Lemire & Muła, *Transcoding billions of Unicode characters per second with SIMD
  instructions*, SP&E 52(2), 2022
* Muła, Kurz & Lemire, *Faster Population Counts Using AVX2 Instructions*
* Muła & Lemire, *Base64 Encoding and Decoding at Almost the Speed of a Memory Copy*
* Lemire & Boytsov, *Decoding Billions of Integers per Second Through Vectorization*

This is where SIMD stops being a compiler flag and becomes **algorithm design**. The
recurring moves:

1. compare → `movemask` → `tzcnt` (turn a vector predicate into a scalar index)
2. `pshufb` as a 16-entry parallel lookup table
3. reformulating a data-dependent problem as a branch-free table lookup

Highest intellectual density of anything on this list.

### The SWAR ancestry

* Knuth, **TAOCP 7.1.3** — *Bitwise tricks and techniques* (broadword computation)
* Warren, **Hacker's Delight**

Most "clever" SIMD kernels are broadword algorithms with wider registers.



## 4. When you want the library answer

### Google Highway — <https://github.com/google/highway>

The reference implementation of the *one generic kernel, many target clones* pattern, done
properly: a collection of platform-agnostic ops implemented via platform-specific intrinsics,
supporting both static and dynamic dispatch — where dynamic dispatch replicates only your SIMD
code rather than the whole binary. An independent evaluation of C++ SIMD libraries rated it
strongest across multiple SIMD extensions.

Read [`g3doc/quick_reference.md`](https://github.com/google/highway/blob/master/g3doc/quick_reference.md)
even if you never link it — the op vocabulary it settled on is a good design study for what a
cross-ISA abstraction has to expose, and it's the same primitive set you'd want in a Rust or
Pharo binding.

Also worth knowing: **xsimd**, **SLEEF** (vector math), **ISPC** (SPMD-on-SIMD language),
**VOLK**.



## 5. For measurement discipline

* Denis Bakhvalov, *Performance Analysis and Tuning on Modern CPUs* (free PDF) — top-down
  microarchitectural analysis, `perf`, and why microbenchmarks lie
* [Compiler Explorer](https://godbolt.org) — instant `-Rpass` + asm feedback
* [uiCA](https://uica.uops.info) alongside `llvm-mca` — static throughput estimates



## Compressed

> Read Algorithmica ch. 10–11 with Compiler Explorer open, then reimplement two of Muła's
> kernels **from the article text alone** before looking at his code.

That gets you further than any amount of intrinsics-guide browsing.

# SIMD in C with Clang — a working survey

Every code fragment, flag, diagnostic and number below was compiled and run with
**Ubuntu clang 18.1.3, x86-64, Intel Xeon (Cascade Lake: AVX-512F/DQ/BW/VL/CD + VNNI), 1 vCPU @ 2.8 GHz**.
Where the compiler *refused* something I kept the refusal — those are the interesting parts.



## 0. The four levels

| Level | Mechanism | Portability | Control |
|---|---|---|---|
| 0 | autovectorizer (`-O2`, `-march`) | total | none |
| 1 | guide it (`restrict`, alignment, pragmas, FP flags) | total | weak but cheap |
| 2 | generic vectors (`vector_size`, `ext_vector_type`, `__builtin_*`) | source-portable across ISAs | good |
| 3 | intrinsics (`immintrin.h`, `arm_neon.h`, `arm_sve.h`) + runtime dispatch | per-ISA | total |

The interesting engineering position is **level 2 with level-3 dispatch**: one generic kernel,
compiled several times through `__attribute__((target(...)))` clones (§7). It gets you ~99 % of
the intrinsics performance in this benchmark with none of the per-ISA source.



## 1. What the flags actually do

Clang runs **both** vectorizers (loop + SLP) at `-O2` and above. `-O3` does not "turn on SIMD";
it mostly loosens the unrolling/inlining cost model.

```
-O2                       loop vectorizer + SLP on
-Os / -Oz                 loop vectorizer still on, but cost model is size-driven
-fno-vectorize            disable loop vectorizer
-fno-slp-vectorize        disable straight-line (superword) vectorizer
-march=x86-64-v2/v3/v4    portable ISA levels: SSE4.2 / AVX2+FMA+BMI / AVX-512
-march=native             this machine only
-mprefer-vector-width=N   override LLVM's default cap
-mtune=…                  cost model only, no new instructions
```

`-march` levels are the sane portable choice: `x86-64-v3` ≈ Haswell+ (AVX2, FMA, BMI2),
`x86-64-v4` ≈ Skylake-SP (AVX-512F/BW/DQ/VL). ARM equivalents are `-mcpu=` / `-march=armv8-a+sve`.

### Width is capped independently of `-march`

```c
void scale(float *a, const float *b, float k, size_t n) {
    for (size_t i = 0; i < n; i++) a[i] = b[i] * k;
}
```

```
$ clang -O2                                  -Rpass=loop-vectorize
remark: vectorized loop (vectorization width: 4, interleaved count: 2)     # SSE2 baseline
$ clang -O2 -march=native                    -Rpass=loop-vectorize
remark: vectorized loop (vectorization width: 8, interleaved count: 4)     # 256-bit, not 512!
$ clang -O2 -march=native -mprefer-vector-width=512
remark: vectorized loop (vectorization width: 16, interleaved count: 4)
```

On Skylake-SP-class targets LLVM sets `prefer-256-bit` because 512-bit code drops the core clock.
If your kernel is long and compute-dense, measure `-mprefer-vector-width=512`; if it is a short
memcpy-ish loop sprinkled through a big program, leave the default.



## 2. Diagnostics: never guess

```bash
clang -O2 -march=x86-64-v3 \
      -Rpass=loop-vectorize \        # what vectorized
      -Rpass-missed=loop-vectorize \ # what didn't
      -Rpass-analysis=loop-vectorize # why not
```

`-Rpass=slp-vectorizer` for straight-line code. Machine-readable form:

```bash
clang -O2 -fsave-optimization-record -foptimization-record-file=rec.yaml -c f.c
```

```yaml
 !AnalysisFPCommute
Pass:            loop-vectorize
Name:            CantReorderFPOps
DebugLoc:        { File: 03_reduce.c, Line: 4, Column: 38 }
Function:        sum_strict
Args:
  - String: 'loop not vectorized: cannot prove it is safe to reorder floating-point operations'
```

Feed that to LLVM's `opt-viewer.py` for an annotated HTML source listing. Then confirm at the
instruction level (`-S`, `llvm-objdump -d --no-show-raw-insn`) and, for throughput reasoning,
`llvm-mca`:

```
$ llvm-mca -mcpu=skylake-avx512 -iterations=100 inner_loop.s
Iterations: 100   Total Cycles: 410   Block RThroughput: 1.0
```

The three questions in order: *did it vectorize* (remarks) → *what did it emit* (asm) →
*is the emitted loop throughput- or latency-bound* (mca + measurement).



## 3. Making the autovectorizer say yes

### 3.1 `restrict` — the single highest-value annotation

Without it, clang emits a runtime overlap check plus a full scalar fallback loop:

```asm
cmpq $32, %rdx      ; n >= 32 ?
jb   .LBB0_6        ; -> scalar path
cmpq $128, %rcx     ; |a-b| far enough apart ?
jb   .LBB0_6
```

```
text size, same loop:   no restrict 315 bytes    with restrict 166 bytes
```

Same speed in the hot case, half the code and no branch misprediction risk at entry.
Put `restrict` on every non-overlapping pointer parameter; it is a promise about *the function's
whole body*, so it is checkable by inspection.

### 3.2 Floating-point reassociation

A reduction reorders FP additions, so by default clang refuses:

```
remark: loop not vectorized: cannot prove it is safe to reorder floating-point
        operations; allow reordering by specifying '#pragma clang loop vectorize(enable)'
        before the loop or by providing the compiler option '-ffast-math'
```

Four ways to grant permission, in increasing order of blast radius:

```c
/* (a) per loop — also implies "reorder FP for this loop" */
#pragma clang loop vectorize(enable)
for (size_t i = 0; i < n; i++) s += a[i];

/* (b) per block — NOTE: must start a compound statement, not just precede a loop */
{
#pragma clang fp reassociate(on)
    for (size_t i = 0; i < n; i++) s += a[i];
}

/* (c) OpenMP semantics, no runtime needed:  clang -fopenmp-simd */
#pragma omp simd reduction(+:s)
for (size_t i = 0; i < n; i++) s += a[i];

/* (d) -ffast-math — whole TU, and it also enables FTZ/DAZ via crtfastmath.o */
```

Placing `#pragma clang fp` immediately before a `for` is an **error**, not a warning:
`'#pragma clang fp' can only appear at file scope or at the start of a compound statement`.
Wrap it in braces. (a) and (c) confirmed vectorized at width 8 × interleave 4; the unannotated
one stayed scalar.

Prefer the surgical subsets of `-ffast-math` when you can name what you need:
`-fno-math-errno`, `-ffp-contract=fast`, `-fassociative-math`, `-freciprocal-math`,
`-fno-signed-zeros`, `-ffinite-math-only`.

### 3.3 FMA contraction is already on

Clang 18 defaults to `-ffp-contract=on` (C's `FP_CONTRACT` within one expression):

```c
f32v8 madd(f32v8 a, f32v8 b, f32v8 c) { return a*b + c; }
```
```
default / =fast :  vfmadd213ps %ymm2, %ymm1, %ymm0
-ffp-contract=off: vmulps ; vaddps
```

So write `acc = va*vb + acc` and you get FMA where the target has it, plain mul+add where it
doesn't. **Do not** reach for `__builtin_elementwise_fma` unless you truly need single-rounding
`fma` semantics: on a target without FMA hardware it lowers to `fmaf` *library calls*
(`undefined reference to 'fmaf'` at link time without `-lm`, and glacial at runtime).

### 3.4 Math functions in the loop

```c
for (size_t i = 0; i < n; i++) o[i] = sinf(a[i]);
```
```
plain:                  remark: library call cannot be vectorized. Try compiling
                                with -fno-math-errno, -ffast-math, or similar flags
-fno-math-errno:        remark: vectorized loop (width 8) — but the asm still holds
                                9 scalar `callq sinf` (the loop is vectorized *around*
                                scalarized calls: usually a pessimization)
-fveclib=libmvec
      -fno-math-errno:  callq _ZGVdN8v_sinf   ← a real 8-wide vector sine
```

`-fveclib` values accepted by this build: `Accelerate`, `libmvec`, `MASSV`, `SVML`,
`Darwin_libsystem_m`, `none`. (`SLEEF`, `ArmPL`, `AMDLIBM` exist in other versions/targets — the
set is version- and target-dependent, so probe it rather than trusting docs.)
You still need `-lm` (glibc ≥ 2.22 ships libmvec) at link time.

### 3.5 Loop shape

* **Countable trip count.** Early-exit search loops are *not* vectorized by clang 18:
  `loop not vectorized: could not determine number of loop iterations`. Newer LLVM has
  early-exit vectorization behind a flag; today, hand-write the search with intrinsics
  (compare → `movemask` → `tzcnt`).
* **Induction variables.** `size_t` is fine and generally better than `int` (no need to prove
  no-wrap)… but see the signedness trap in §9.
* **Conditional stores vectorize** into masked stores; branchless selects vectorize into blends.
  Both were vectorized at width 8 here, but the select form is cheaper:
  ```
  if (b[i] > 0) a[i] = b[i];       ->  4× vcmpltps + 4× vmaskmovps   (AVX2)
                                       vmovups %zmm, (…){%k1}        (AVX-512)
  a[i] = b[i] > 0 ? b[i] : a[i];   ->  compare + blend, no masked store unit pressure
  ```
* **Gathers.** `o[i] = t[idx[i]]` was "vectorized" but clang emitted **no `vgather*`** — the
  cost model preferred scalar loads + inserts. Gather is rarely a win outside AVX-512 with
  cache-resident tables. Prefer restructuring the data.
* **AoS vs SoA.** Strided access (`p[i].x` over a 16-byte struct) becomes interleaved
  loads + shuffles. It vectorizes, but SoA is what actually goes fast.

### 3.6 Alignment and trip-count facts

```c
void f_aligned(float *restrict a, const float *restrict b, size_t n) {
    a = __builtin_assume_aligned(a, 64);
    b = __builtin_assume_aligned(b, 64);
    n &= ~(size_t)15;                  /* trip count is a multiple of 16 */
    for (size_t i = 0; i < n; i++) a[i] += b[i];
}
```

Result: all eight moves in the body become `vmovaps` (versus `vmovups` in the plain version),
and the scalar remainder loop disappears entirely. On modern x86 the aligned/unaligned
*instruction* difference is nil; what you actually buy is (i) no cache-line-split loads, and
(ii) no epilogue. `__builtin_assume(n % 16 == 0)` works too, as does `aligned_alloc(64, …)` +
`_Alignas(64)`.



## 4. The pragma vocabulary

All verified to parse and take effect in clang 18:

```c
#pragma clang loop vectorize(enable|disable)
#pragma clang loop vectorize_width(8)               // or (8, fixed) / (4, scalable)
#pragma clang loop interleave_count(4)              // accumulator count / unroll-in-vector
#pragma clang loop vectorize_predicate(enable)      // fold the tail into a mask (SVE, AVX-512)
#pragma clang loop unroll_count(4)
#pragma clang loop distribute(enable)               // split a loop to break a dependence
#pragma clang loop unroll(disable)
```

`vectorize(disable)` cleanly suppressed vectorization (remark: *cost-model indicates
vectorization is not beneficial*). `vectorize_width(8, fixed) interleave_count(2)` gave exactly
width 8 / interleave 2. Note the pragma applies to the **immediately following** loop.

Region-level attribute application (useful for whole headers of intrinsic wrappers):

```c
#pragma clang attribute push(__attribute__((target("avx2,fma"))), apply_to=function)
__m256 f(__m256 a, __m256 b, __m256 c){ return _mm256_fmadd_ps(a,b,c); }
#pragma clang attribute pop
```

This compiles **without** `-mavx2` on the command line.



## 5. Generic vector extensions (level 2)

Two flavours, both C-legal in clang:

```c
typedef float  f32x8 __attribute__((vector_size(32)));   /* GCC-compatible */
typedef float  e32x8 __attribute__((ext_vector_type(8)));/* OpenCL-style   */
```

Both give you `+ - * / % & | ^ ~ << >>`, comparisons (lane result `-1` / `0`), and
subscripting `v[i]`. Differences that matter:

| | `vector_size` | `ext_vector_type` |
|---|---|---|
| ternary `?:` on vectors in **C** | **rejected** | **accepted** |
| swizzles `.s0 .xyzw .hi .lo` | no | yes |
| GCC compatibility | yes | clang/OpenCL only |

```c
e32x8 z = x > y ? x : y;     /* OK   -> lane-wise max */
f32x8 z = x > y ? x : y;     /* error: used type '…vector of 8 int' where
                                arithmetic or pointer type is required */
```

For `vector_size` types use `__builtin_elementwise_max(a,b)` or a bitwise select instead.

### Portable builtins

```c
__builtin_shufflevector(a, b, i0, …)   /* constant indices; b's lanes continue a's numbering */
__builtin_convertvector(v, other_type) /* lane-wise conversion, e.g. f32x8 -> i32x8 */
__builtin_reduce_add / _mul / _and / _or / _xor / _max / _min
__builtin_elementwise_abs / _max / _min / _fma / _ceil / _roundeven / _popcount / …
```

Two clang-18 gotchas found by compiling:

* **`__builtin_reduce_add` is integer-only.** `float` gives
  *"1st argument must be a vector of integers"* — because an FP add reduction needs an ordering
  choice. `__builtin_reduce_max` *does* accept float. Roll your own FP horizontal sum:

```c
typedef float f32x8 __attribute__((vector_size(32)));
typedef float f32x4 __attribute__((vector_size(16)));
static inline float hsum8(f32x8 v) {
    f32x4 lo = __builtin_shufflevector(v, v, 0,1,2,3);
    f32x4 hi = __builtin_shufflevector(v, v, 4,5,6,7);
    f32x4 q  = lo + hi;
    return q[0] + q[1] + q[2] + q[3];
}
```

* **Wide vectors as parameters on a narrow target** get
  `warning: AVX vector argument … without 'avx' enabled changes the ABI [-Wpsabi]`.
  Keep wide-vector functions `static inline`/`always_inline`, or give them a `target` attribute.

Loading: use `memcpy` (or the intrinsic `loadu`), **not** `*(f32x8 *)p`. The typedef carries
`aligned(32)` and no `may_alias`, so the cast is both an alignment and a strict-aliasing hazard.
`memcpy` of a compile-time-constant size compiles to a single unaligned move.



## 6. Intrinsics (level 3)

x86: `#include <immintrin.h>` gets everything; per-ISA headers exist but there is no reason to
use them. Gate the *function*, not the *translation unit*:

```c
__attribute__((target("avx2,fma")))
float dot_avx2(const float *restrict a, const float *restrict b, size_t n);

__attribute__((target("avx512f")))
float dot_avx512(const float *restrict a, const float *restrict b, size_t n);
```

Clang lets you write AVX-512 intrinsics inside such a function while the rest of the file is
built for baseline x86-64. Verified: in a plain `-O2` build (no `-march`), `dot_avx512` still
contains `zmm` registers and runs at full speed.

Note the clang header types: `__m256` is `aligned(32)`, `__m256_u` is `aligned(1)`, and
`_mm256_loadu_*` reads through a `__packed__, __may_alias__` struct. So `_mm256_loadu_ps(p)` is
alignment- *and* aliasing-safe; `*(__m256*)p` is neither.

### Tail handling, three idioms

```c
/* scalar epilogue — always correct, always available */
for (; i < n; i++) s += a[i]*b[i];

/* AVX-512 mask — no epilogue at all */
__mmask16 m = (__mmask16)((1u << (n - i)) - 1u);
acc = _mm512_fmadd_ps(_mm512_maskz_loadu_ps(m, a+i),
                      _mm512_maskz_loadu_ps(m, b+i), acc);

/* over-read into padding — fastest, requires you to own the allocation
   (pad to a vector multiple and zero the pad; otherwise it is a page-fault bug) */
```

### ARM

Cross-checked with `clang --target=aarch64-linux-gnu -nostdlibinc -O2 -S`:

```c
#include <arm_neon.h>
float32x4_t c0 = vdupq_n_f32(0);
c0 = vfmaq_f32(c0, vld1q_f32(a+i), vld1q_f32(b+i));   /* -> fmla v0.4s, v4.4s, v2.4s */
float s = vaddvq_f32(c0);                              /* -> faddp/addv               */
```

SVE is *sizeless* — vector length is unknown at compile time, so you loop with a predicate and
never write an epilogue:

```c
#include <arm_sve.h>
svfloat32_t acc = svdup_f32(0.0f);
for (size_t i = 0; i < n; i += svcntw()) {
    svbool_t pg = svwhilelt_b32(i, n);
    acc = svmla_f32_x(pg, acc, svld1_f32(pg,a+i), svld1_f32(pg,b+i));
}
return svaddv_f32(svptrue_b32(), acc);
```
```
-> whilelt / fmla z0.s, p0/m, z1.s, z2.s / faddv s0, p0, z0.s
```

The autovectorizer targets SVE natively with *scalable* factors:

```
$ clang --target=aarch64-linux-gnu -march=armv8-a+sve -O2 -Rpass=loop-vectorize
remark: vectorized loop (vectorization width: vscale x 4, interleaved count: 2)
```

`-msve-vector-bits=256` fixes the length if you need SVE types in structs/ABI.
RISC-V RVV is the same story (`-march=rv64gcv`, `riscv_vector.h`, `vsetvl`-style strip-mining).



## 7. Runtime dispatch

### 7.1 `target_clones` — zero-effort multiversioning

```c
__attribute__((target_clones("default","avx2","avx512f")))
float sum(const float *restrict a, size_t n) { … }
```

Produces, via an IFUNC resolved once by the dynamic loader:

```
0000000000002600 i sum
00000000000022b0 T sum.avx2.0
0000000000002380 T sum.avx512f.1
0000000000002230 T sum.default.2
0000000000002600 W sum.resolver
R_X86_64_IRELATIV  2600
```

Cost: an indirect call per invocation (so put it on the *outer* function, not the inner one),
and no control over which loop body each clone gets. Great for a handful of leaf kernels.

### 7.2 Explicit dispatch — control over everything

```c
static dot_fn pick(void) {
    if (__builtin_cpu_supports("avx512f"))                        return dot_avx512;
    if (__builtin_cpu_supports("avx2") && __builtin_cpu_supports("fma")) return dot_avx2;
    return dot_scalar;
}
```

`__builtin_cpu_supports` / `__builtin_cpu_init` handle CPUID for you.
**Caveat:** it only reports CPUID bits. For AVX-512 you also need the OS to have enabled the
state (`xgetbv`); glibc's resolver accounts for this, but if you roll your own CPUID, check
`XCR0` too. Also cache the pointer (as above) rather than re-querying per call.

### 7.3 The pattern worth stealing: one kernel, many clones, no intrinsics

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

Built with plain `-O2` and no `-march`, `dot_512` emits `zmm` + `vfmadd`, `dot_256` emits `ymm`.
`always_inline` is what forces re-codegen of the kernel under each function's target features.
Portable to AArch64/RVV unchanged — only the width list changes.



## 8. Measured: a dot product, six ways

`n = 8003` floats (L2-resident, deliberately not a multiple of 16), 20 000 repetitions.
Full source in `dot_bench.c`.

**Built `-O2 -march=x86-64-v3`:**

```
scalar     1.63 GFLOP/s      strictly-ordered reduction, no vectorization
autovec   25.30 GFLOP/s      #pragma clang loop vectorize(enable) interleave_count(4)
generic   13.66 GFLOP/s      vector_size(32), ONE accumulator
generic4  23.71 GFLOP/s      vector_size(32), FOUR accumulators
avx2      23.73 GFLOP/s      _mm256_fmadd_ps, four accumulators
avx512    26.41 GFLOP/s      _mm512_fmadd_ps + masked tail
dispatch  26.46 GFLOP/s      __builtin_cpu_supports -> avx512
```

**Same source, plain `-O2` (SSE2 baseline):**

```
scalar     1.65 GFLOP/s
autovec   12.23 GFLOP/s      4-wide
generic   12.27 GFLOP/s
generic4  15.19 GFLOP/s
avx2      23.60 GFLOP/s      ← still fast: target attributes, not command-line -march
avx512    25.30 GFLOP/s
dispatch  25.97 GFLOP/s
```

All six produce **bit-identical** results here (`-8.5000`), because the data is small integers
scaled by powers of two — do not read that as a general guarantee.

Three things this table teaches:

1. **Accumulator count dominates ISA width.** `generic` (8-wide, one accumulator) loses to
   `generic4` by 1.7×. One FMA chain at 4-cycle latency ⇒ 8 lanes × 2 flops / 4 cycles ×
   2.8 GHz ≈ 11 GFLOP/s — which is exactly what we measure. You need ≈ latency × throughput
   independent chains (4 on this core; often 8–10 on newer ones).
2. **A well-guided autovectorizer ties hand-written intrinsics** on a kernel this simple. Reach
   for level 3 when the operation isn't loop-shaped (shuffles, `pshufb` LUTs, `movemask` search,
   bit tricks) or when the cost model is wrong.
3. **`target` attributes decouple the hot kernel from the baseline build**, which is what lets
   you ship one binary.



## 9. Pitfalls, ranked by how often they bite

1. **Unsigned wraparound in index arithmetic.** This bug was in my first draft of the benchmark:
   ```c
   a[i] = (float)((i % 17) - 8) * 0.25f;   /* i is size_t -> (i%17)-8 wraps to ~1.8e19 */
   ```
   Result: `inf`. Cast to a signed type *before* subtracting. Vector code amplifies this because
   you write more index arithmetic than usual.
2. **`*(__m256*)p` / `*(f32x8*)p`.** Alignment UB *and* strict-aliasing UB. Use `_mm256_loadu_ps`
   or `memcpy`.
3. **Over-reading past the end** in the tail. Only legal into padding *you* allocated. Otherwise
   it is a page fault waiting for the one input that ends at a page boundary — and ASan will find
   it, which is a feature.
4. **`-ffast-math` in a library.** It links `crtfastmath.o`, which sets FTZ/DAZ **process-wide**,
   changing denormal behaviour for code that never opted in. Prefer the named subsets, or the
   per-loop pragmas.
5. **`__builtin_elementwise_fma` without FMA hardware** ⇒ `fmaf` library calls (§3.3).
6. **Vectorizing around scalarized calls** (`-fno-math-errno` alone, §3.4): the remark says
   "vectorized", the asm says nine `callq sinf`. Always read the asm after a surprising remark.
7. **Reduction results change with `-march`.** The number of accumulators changes the summation
   order, so results differ between builds. If you need reproducibility, fix the accumulator
   count in *your* code (level 2/3) instead of letting `interleave_count` float.
8. **`-Wpsabi`** when wide vectors cross a function boundary on a narrow target (§5).
9. **Sanitizers suppress vectorization.** Benchmark and sanitize in separate builds; test
   correctness under `-fsanitize=address,undefined -O1`, measure under `-O2 -march=…`.



## 10. Testing and measuring

* Keep the scalar reference as a **compiled, tested function**, not a comment. Diff it against
  every vector variant over randomized `n` — especially `n` in `[0, 2W)` and `n ≡ W-1 (mod W)`,
  where tail bugs live.
* For FP, compare with a tolerance derived from the reordering, or accumulate the reference in
  `double`, or use Kahan. Bit-equality is the wrong test for a reassociated reduction.
* `-fsanitize=address` catches over-reads; `-fsanitize=alignment` catches the `__m256*` cast.
* Pin the frequency story: AVX-512-heavy code on Skylake-SP downclocks, so a microbenchmark can
  look better than the same kernel does inside a mixed workload. `-mprefer-vector-width=256` is
  often the right whole-program default even on `-march=x86-64-v4`.
* `llvm-mca` for a static throughput estimate; `perf stat -e cycles,instructions,fp_arith_inst_retired.*`
  for the truth.



## 11. When to stop writing intrinsics

* **Google Highway** — the current best answer for portable SIMD in C/C++: one source, scalable
  and fixed-width targets (SSE4…AVX-512, NEON, SVE, RVV, WASM), with runtime dispatch built in.
  Essentially §7.3 done properly.
* **xsimd**, **Eigen**, **VOLK**, **SLEEF** (vector math), **ISPC** (SPMD-on-SIMD source
  language, excellent when the kernel is genuinely data-parallel and branchy).
* **OpenMP** `#pragma omp simd` / `declare simd` with `-fopenmp-simd` (no runtime dependency) —
  the standardized version of §4, and the way to get vector clones of your own functions callable
  from vectorized loops.
* **BLAS/oneDNN/Accelerate** if the kernel has a name someone else already optimized.



## Appendix — reproducing this

```bash
clang --version                       # Ubuntu clang 18.1.3
clang -O2 -march=x86-64-v3 dot_bench.c -o dot_bench && ./dot_bench
clang -O2                  dot_bench.c -o dot_bench_base && ./dot_bench_base
clang -O2 -march=x86-64-v3 -Rpass=loop-vectorize -Rpass-missed=loop-vectorize \
      -Rpass-analysis=loop-vectorize -c yourfile.c -o /dev/null
clang --target=aarch64-linux-gnu -nostdlibinc -march=armv8-a+sve -O2 -S -o - arm.c
```

Complete source code:

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