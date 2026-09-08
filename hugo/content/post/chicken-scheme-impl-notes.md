
+++
date = '2026-08-10T10:33:23+01:00'
title = "CHICKEN Scheme"
subtitle = "Versions and implementation notes"
author = ['The CHICKEN team']
tags = []
categories = [ "scheme", "AI generated"]
summary = ' '
+++

The latest CHICKEN release is [*6.0.0*](https://code.call-cc.org), which came out on August 10th, 2026.

# How the implementation works, and where it could go faster

*Notes written against the tree at commit `178a183a` (2026-08-25). Generated-C
examples in this document were produced with an installed CHICKEN 5.4.0
(`~/Developer/snapshots/chicken/chicken-5.4.0`), because this tree is not built.
The CPS pass in `core.scm` is **byte-identical** between 5.4.0 and this 6.0.0 tree,
and the C backend differs only cosmetically (6.0 dropped the `C_fcall` marker and
renamed `C_externimport`/`C_externexport` to `C_extern`). Everything shown is
therefore representative; where 6.0 differs, it is called out.*

---

## 1. Orientation: two programs in one repository

The repo contains two largely independent artefacts that happen to share a
build system:

| | Written in | Entry point | What it is |
|---|---|---|---|
| **The compiler** | Scheme (self-hosting) | `chicken.scm` → `batch-driver.scm` | Translates a Scheme source file into a single `.c` file |
| **The runtime** | C | `runtime.c` + `chicken.h` | Object representation, GC, arithmetic, I/O, the trampoline |

Plus `library.scm`, `eval.scm`, `extras.scm`, `posix*.scm`, … — the Scheme-level
standard library, itself compiled by the compiler into C and linked into
`libchicken`.

The unifying idea, and the reason the whole design hangs together, is a single
sentence:

> **A Scheme program is compiled into a set of C functions that never return.**

Everything else — the GC, the calling convention, the treatment of `call/cc`,
even the way the C stack is used — follows from that decision.

---

## 2. Data representation

### 2.1 The word

Every Scheme value is one machine word, `C_word` (`chicken.h:531-541`;
`long` on LP64, `int` on 32-bit, `__int64` on LLP64/Win64).

Tagging uses the low bits (`chicken.h:316-338`):

```
    bit 0 == 1                    →  fixnum        (value = word >> 1)
    low 4 bits == 0b0110          →  boolean       (#f = 0x06, #t = 0x16)
    low 4 bits == 0b1010          →  character     (codepoint = word >> 8)
    low 4 bits == 0b1110          →  "special"     ('(), #<unspecified>,
                                                    unbound, eof, broken-weak-ptr)
    low 2 bits == 0b00            →  pointer to a heap block
```

`C_immediatep(x)` is therefore just `(x & 3)` — a value is a pointer exactly
when its low two bits are zero. That single test is the hottest predicate in
the entire runtime; the GC executes it once per slot scanned.

Fixnums get 62 bits of payload on 64-bit
(`C_MOST_POSITIVE_FIXNUM = 0x3fffffffffffffff`). Note that the *character*
range is deliberately limited to a Unicode codepoint (`C_CHAR_BIT_MASK 0x1fffff`),
not to whatever would fit.

### 2.2 Blocks

A heap object is a header word followed by data (`chicken.h:778-782`):

```c
typedef struct C_block_struct {
  C_header header;
  C_word   data[];
} C_SCHEME_BLOCK;
```

The header packs three flag bits, a 4-bit type, and a size
(`chicken.h:405-465`, layout table at `chicken.h:377-403`):

```
  BYTEBLOCK_BIT    data is raw bytes, not slots  → GC must not scan it
  SPECIALBLOCK_BIT slot 0 is a non-value          → GC must skip data[0]
  8ALIGN_BIT       data needs 8-byte alignment    → matters only on 32-bit
```

```
  Symbol   = [  1|3, Value, Name, Plist]
  String   = [  2|4, Name, Count, Offset, Index]
  Pair     = [  3|2, Car, Cdr]
  Closure  = [ S4|1+N, Ptr, Slot, ...]
  Flonum   = [AB5|8, IEEEDouble]
  Bignum   = [  6|1, Bits]
  Structure= [  8|1+N, Tag, Slots, ...]
  ...
```

Two entries deserve comment.

**Closure.** A closure is a block whose slot 0 is a raw C function pointer
(hence `SPECIALBLOCK`) and whose remaining slots are the captured values.
Calling a closure is `((C_proc)(void*)(*((C_word*)f+1)))(argc, argv)`. This is
*flat* closure conversion: no environment chain, no display, just a vector.

**String.** In 6.0 a string is no longer a byte array. It is a 4-slot block:
a UTF-8 bytevector, a codepoint `Count`, and a cached `(Offset, Index)` cursor
pair. `string-ref` therefore costs O(1) for ASCII (`utf_index`, `utf.c:3273`,
short-circuits when `bytelength == codepoints`) and O(n) otherwise, mitigated by
the one-entry cursor cache (`utf_index1`, `utf.c:3247`). This is a significant
change from CHICKEN 5 and, as discussed in §9, one of the best SIMD targets in
the tree.

---

## 3. The compiler pipeline

`batch-driver.scm:639-895` drives the whole thing. In order:

```
  source
    │
    ├─ read + macroexpand + canonicalize        core.scm:532   canonicalize-expression
    │     → "core language" S-expression node graph
    │
    ├─ scrutiny (type checking / specialization) scrutinizer.scm:179
    │
    ├─ CPS conversion                            core.scm:1923  perform-cps-conversion
    │     → every call is a tail call
    │
    ├─ ┌ analysis                                core.scm:2061  analyze-expression
    │  │   → the "database": per-variable and per-lambda facts
    │  ├ high-level optimization                 optimizer.scm:158
    │  │   → inlining, constant folding, contraction, rewriting
    │  └ leaf-routine / direct-lambda transform  optimizer.scm:1516
    │      loop until no more progress
    │
    ├─ secondary flow analysis + float unboxing  lfa2.scm:249, lfa2.scm:524
    │
    ├─ closure conversion                        core.scm:2538  perform-closure-conversion
    │     → lambdas become explicit ##core#closure vectors, free vars become ##core#ref
    │
    ├─ preparation                               core.scm:3106  prepare-for-code-generation
    │     → variables become numbered temporaries, allocation demand is counted,
    │       literals are collected, the "lambda table" is built
    │
    └─ C code generation                         c-backend.scm:93  generate-code
```

The node graph is a mutable tree of `(class, parameters, subexpressions)` triples
(`support.scm`); each pass rewrites it. The three language levels — source, core,
and closure-converted — are documented as grammars in the header comment of
`core.scm:99-243`, which is the single most useful thing to read in the repo.

---

## 4. CPS conversion

This is the heart of the design, and it is only ~130 lines
(`core.scm:1921-2058`). The whole pass is a classic Fischer/Plotkin-style
one-pass CPS transform written in "compiler-in-CPS" style: `walk` takes a node
and a *meta-continuation* `k`, a Scheme procedure from "the node holding the
result value" to "the node for the rest of the computation".

### 4.1 The three interesting cases

**Lambda** — every user lambda gets one extra leading parameter, the
continuation `k`, and its body is walked with a meta-continuation that calls `k`:

```scheme
(define (cps-lambda id llist subs k)
  (let ([t1 (gensym 'k)])
    (k (make-node
        '##core#lambda (list id #t (cons t1 llist) 0)
        (list (walk (car subs)
                    (lambda (r)
                      (make-node '##core#call (list #t)
                                 (list (varnode t1) r)))))))))
```

**If** — the join point is reified as a real continuation `t1` so the code for
`k` is emitted once rather than duplicated into both branches:

```scheme
((if) (let* ((t1 (gensym 'k))
             (t2 (gensym 'r))
             (k1 (lambda (r) (make-node '##core#call (list #t)
                                        (list (varnode t1) r)))))
        (make-node 'let (list t1)
          (list (make-node '##core#lambda (list (gensym-f-id) #f (list t2) 0)
                           (list (k (varnode t2))))
                (walk (car subs)
                      (lambda (v)
                        (make-node 'if '() (list v (walk (cadr subs) k1)
                                                   (walk (caddr subs) k1)))))))))
```

That `let`-bound `##core#lambda` is exactly the `k123`, `k139`, `k146`
functions you see in generated C.

**Call** — a non-tail call becomes a tail call to the callee with a freshly
built continuation closure, after all arguments have been let-bound in order:

```scheme
(define (walk-call fn args params k)
  (let ((t0 (gensym 'k)) (t3 (gensym 'r)))
    (make-node 'let (list t0)
      (list (make-node '##core#lambda (list (gensym-f-id) #f (list t3) 0)
                       (list (k (varnode t3))))
            (walk-arguments args
              (lambda (vars)
                (walk fn (lambda (r)
                  (make-node '##core#call params
                             (cons* r (varnode t0) vars))))))))))
```

### 4.2 Two small but important refinements

`walk-arguments` does **not** name atomic arguments (`atomic?`,
`core.scm:2048-2055`): constants, variables, and side-effect-free allocating
inlines are spliced in directly, which is why `(fact (- n 1))` compiles to a
single `C_s_a_i_minus(&a,2,t2,C_fix(1))` expression inside the argument vector
rather than a separate binding. And both `walk-arguments` and the `let` case
check `node-for-var?` to avoid emitting `(let ((x x)) …)`.

Notice also what CPS conversion *deletes*: `##core#the`, `##core#the/result`
and `##core#typecase` are dropped here, because after scrutiny their information
has already been consumed.

### 4.3 Worked example

```scheme
(define (fact n)
  (if (= n 0) 1 (* n (fact (- n 1)))))
(print (fact 10))
```

compiles to (abridged, from the generated `fact.c`):

```c
/* fact in k123 in k120 */
static void C_ccall f_127(C_word c,C_word *av){
  C_word t0=av[0];              /* the closure itself      */
  C_word t1=av[1];              /* the continuation k      */
  C_word t2=av[2];              /* n                       */
  C_word t3,t4,t5, *a;
  if(c!=3) C_bad_argc_2(c,3,t0);
  C_check_for_interrupt;
  if(C_unlikely(!C_demand(C_calculate_demand(33,c,2)))){
    C_save_and_reclaim((void *)f_127,c,av);}
  a=C_alloc(33);
  if(C_truep(C_i_nequalp(t2,C_fix(0)))){
    t3=t1;{                                   /* return 1 to k: */
      C_word *av2=av;
      av2[0]=t3; av2[1]=C_fix(1);
      ((C_proc)(void*)(*((C_word*)t3+1)))(2,av2);}}
  else{
    /* build the continuation closure {f_141, k, n} */
    t3=(*a=C_CLOSURE_TYPE|3,a[1]=(C_word)f_141,a[2]=t1,a[3]=t2,tmp=(C_word)a,a+=4,tmp);
    t4=C_s_a_i_minus(&a,2,t2,C_fix(1));
    {C_proc tp=(C_proc)C_fast_retrieve_proc(*((C_word*)lf[0]+1));
     C_word *av2=av;
     av2[0]=*((C_word*)lf[0]+1); av2[1]=t3; av2[2]=t4;
     tp(3,av2);}}}                            /* tail call to fact */

/* k139 in fact in k123 in k120  — the continuation of the recursive call */
static void C_ccall f_141(C_word c,C_word *av){
  C_word t0=av[0], t1=av[1], t2, *a;
  C_check_for_interrupt;
  if(C_unlikely(!C_demand(C_calculate_demand(33,c,1)))){
    C_save_and_reclaim((void *)f_141,c,av);}
  a=C_alloc(33);
  t2=((C_word*)t0)[2];                        /* k, from the closure   */
  { C_word *av2=av;
    av2[0]=t2;
    av2[1]=C_s_a_i_times(&a,2,((C_word*)t0)[3],t1);  /* n * result      */
    ((C_proc)(void*)(*((C_word*)t2+1)))(2,av2);}}
```

Read that once and the whole system is visible: recursion depth lives in a chain
of heap-allocated continuation closures, not on the C stack; every C function
ends in a call it never comes back from.

---

## 5. Undoing CPS where it is not needed

Naïve CPS would be catastrophically slow: every loop iteration would cons a
continuation. Three passes claw the cost back.

### 5.1 Direct lambdas / leaf routines (`optimizer.scm:1516-1740`)

If a procedure's body only ever calls (a) its own continuation `k`, or
(b) itself recursively with the *same* `k`, and its total allocation is
statically bounded, it is a **leaf routine**. `transform-direct-lambdas!`:

* drops the continuation parameter, rewriting the node class to
  `##core#direct_lambda`;
* rewrites `(k v)` calls to `##core#return`;
* rewrites self-calls to `##core#recurse`;
* rewrites all known call sites to `##core#direct_call`, passing the caller's
  allocation pointer `&a` so the callee allocates in the caller's frame;
* hoists nested direct lambdas out of the container when it can.

The result is an ordinary C function that *does* return.

### 5.2 Customizable procedures (`core.scm:2620-2660`)

If every reference to a variable is a call site, the argument counts always
match, and the procedure never escapes, it is **customizable**: its arguments
are passed as ordinary C parameters instead of through an argument vector, and
no argument-count check is emitted. Because the runtime may still need to
re-enter it after a GC, the backend emits a small `tr<id>` **trampoline** that
unpacks `av[]` back into positional parameters (`c-backend.scm:701-730`).

### 5.3 Self-tail-call → `goto`

When a direct lambda's recursion is a tail self-call, the backend emits a
`loop:` label and `goto loop` (`c-backend.scm:334-347`), assigning through a
row of scratch temporaries first so that simultaneous update is correct.

Putting all three together:

```scheme
(declare (block) (fixnum-arithmetic) (unsafe))
(import (chicken fixnum))
(define (sum-to n)
  (let loop ((i 0) (acc 0))
    (if (fx= i n) acc (loop (fx+ i 1) (fx+ acc i)))))
```

becomes a plain C loop with no allocation, **no GC check and no interrupt
check inside the loop**:

```c
static C_word f_142(C_word t1,C_word t2){       /* 5.4 emitted "C_fcall"; 6.0 omits it */
  C_word t3,t4,t5,t6;
loop:{}
  t3=C_eqp(t1,C_fix(1000000));
  if(C_truep(t3)){ return(t2); }
  else{
    t5=C_u_fixnum_plus(t1,C_fix(1));
    t6=C_u_fixnum_plus(t2,t1);
    t1=t5; t2=t6;
    goto loop;}}
```

This is the shape CHICKEN is trying to reach for hot code. Anything that
prevents it — an escaping continuation, an unknown callee, or *any* allocation
in the loop body — pushes you back onto the CPS path.

### 5.4 Float unboxing (`lfa2.scm`)

`perform-secondary-flow-analysis` runs a simplified type propagation whose two
jobs are (a) removing type checks that specialization left behind and
(b) counting, for each `let`-bound flonum variable, how many of its uses are
"boxed" vs "unboxed". A variable whose counts are equal is entirely representable
as a C `double` and joins `floatvars`.

`perform-unboxing` (`lfa2.scm:524`) then rewrites the tree with a pair of
mutually recursive walkers — `walk` produces boxed results, `walk/unbox`
produces `double`s — inserting `##core#box_float` / `##core#unbox_float` at the
boundaries. `##core#let_float` binds a numbered `double f<i>` C local
(`c-backend.scm:160-171`). `+unboxed-map+` (`lfa2.scm:207-244`) is the table of
operations that have unboxed counterparts.

---

## 6. Closure conversion and preparation

`perform-closure-conversion` (`core.scm:2538`) does the usual free-variable
analysis (`gather`), records `closure-size` and `captured-variables` in the
database, and rewrites:

* each `##core#lambda` into a `##core#closure` construction whose slot 0 is a
  `##core#proc` (the C function's address) and whose remaining slots are the
  captured values;
* each free-variable reference into `##core#ref` on the closure;
* each variable that is both **assigned and captured** into a heap-allocated
  box (`##core#box` / `##core#unbox` / `##core#updatebox`), because flat
  closures copy values.

CHICKEN 6 adds *closure sharing* (`merge-shareable`, `merge-reusable-closures`):
a "container" closure can hold the transitive free variables of the nested
closures it dominates, so those nested closures can be smaller or elided.
Variables shared this way that provably don't escape are un-boxed again
(`core.scm:2732-2745`).

`prepare-for-code-generation` (`core.scm:3106`) is the flattening pass:

* variables become de Bruijn-ish `##core#local` indices into a temporary array;
* globals become `##core#global` / `##core#setglobal` on a literal-frame slot;
* literals are collected into `lf[]` and encoded as strings for
  `C_decode_literal`;
* **allocation demand is accumulated per lambda** (`allocated`) — the exact
  number of words the body can allocate before its next call. This number ends
  up in the `C_alloc(n)` and `C_demand(n)` in the prologue, and is the reason
  CHICKEN needs no allocation checks at individual allocation sites;
* the `lambda-table` of `lambda-literal` records is built — this is what the
  backend consumes.

---

## 7. The C backend

`c-backend.scm:93` — `generate-code`. Two things are worth understanding in
detail.

### 7.1 The procedure prologue (`c-backend.scm:801-963`)

Every non-direct procedure is emitted as:

```c
static void C_ccall f_NNN(C_word c,C_word *av){
  C_word tmp;
  C_word t0=av[0];  ... C_word tK=av[K];   /* unpack the argument vector */
  C_word tK+1; ...                          /* the temporaries           */
  C_word *a;
  if(c!=N) C_bad_argc_2(c,N,t0);            /* if external and safe      */
  C_check_for_interrupt;                    /* if timer checks enabled   */
  if(C_unlikely(!C_demand(C_calculate_demand(DEMAND,c,MAXAV)))){
    C_save_and_reclaim((void *)f_NNN,c,av);}   /* → GC, then re-enter    */
  a=C_alloc(DEMAND);
  ... body ...
}
```

`DEMAND` is the statically computed word count; `MAXAV` is the largest argument
vector any callee needs. `C_calculate_demand(n,c,m)` (`chicken.h:1066`) adds
headroom for the callee's argument vector when the current one is too small.
The crucial property is that the check happens **once, on entry**, and covers
every allocation the body can perform.

Note the immediate consequence for the loop case: `a=C_alloc(DEMAND)` is
`alloca`, so a `goto loop` back-edge in an *allocating* loop re-executes the
`alloca` and keeps growing the C stack — which is exactly why the interrupt and
demand checks sit *inside* the loop there, and outside it when `DEMAND == 0`.

### 7.2 Argument vectors and their reuse (`push-args`, `c-backend.scm:567-599`)

Calls pass `(argc, C_word *av)` where `av[0]` is the callee itself. Since the
caller never returns, its own `av` is dead the moment its arguments have been
copied into temporaries — so `push-args` reuses it when it is provably big
enough:

```c
C_word *av2;
if(c >= 3) { av2=av; }        /* reuse the caller's vector            */
else       { av2=C_alloc(3); } /* otherwise carve a new one out of the nursery */
av2[0]=callee; av2[1]=k; av2[2]=arg;
tp(3,av2);
```

The three static cases (`C_word av2[N]` on the C stack / `C_word *av2=av` /
the dynamic test above) are chosen from `lambda-literal-argument-count`,
`rest-argument-mode`, and whether any `##core#rest-car` in the arguments still
needs the *original* `av`.

### 7.3 Call dispatch

`##core#call` (`c-backend.scm:308-404`) has five paths, cheapest first:

1. `##core#proc` — the callee is a known C function; call it by name.
2. `call-id` + `looping` — the self tail call; `goto loop`.
3. `call-id` + `customizable` — direct C call with positional arguments.
4. `##core#global` — load the procedure out of the literal frame, with the
   check level chosen by `-unsafe` / `no-procedure-checks` / block mode
   (`C_fast_retrieve_proc` vs `C_retrieve2_symbol_proc`).
5. General — `((C_proc)(void*)(*((C_word*)t+1)))(nf,av2)`.

---

## 8. The runtime

### 8.1 Cheney on the M.T.A.

CHICKEN implements Baker's *"CONS Should Not CONS Its Arguments, Part II:
Cheney on the M.T.A."*:

* `C_alloc(n)` is `alloca` (`chicken.h:1048`). **The C stack is the nursery.**
* Generated functions never return, so the C stack only grows.
* `C_demand(n)` (`chicken.h:1126-1143`) compares the current stack pointer
  against `C_stack_limit`. When the nursery is exhausted, the procedure calls
  `C_save_and_reclaim`, which copies its arguments to the *temporary stack* (a
  small malloc'd area that is a GC root) and calls `C_reclaim`.
* `C_reclaim` (`runtime.c:3423`) performs the collection and then
  `longjmp`s back to `CHICKEN_run` (`runtime.c:1557`), which unwinds the entire
  C stack in one instruction and re-enters the saved continuation via
  `C_restart_trampoline`.

```c
/* CHICKEN_run, runtime.c:1584-1600 */
C_sigsetjmp(C_restart, 0);
if(!return_to_host) {
  C_word *p = C_alloc(C_restart_c);
  C_memcpy(p, C_temporary_stack, C_restart_c * sizeof(C_word));
  C_temporary_stack = C_temporary_stack_bottom;
  ((C_proc)C_restart_trampoline)(C_restart_c, p);
}
```

That `setjmp`/`longjmp` pair *is* the trampoline. Note it fires only on GC, not
on every call — CHICKEN is not a "return-to-trampoline-per-call" system.

### 8.2 The collector

Two generations, both copying (`C_reclaim`, `runtime.c:3423-3730`):

* **Minor**: roots are the temporary stack, the trace buffer, and the
  *mutation stack*. Live data is evacuated from the C stack (nursery) into
  fromspace. Since the C stack is about to be discarded wholesale by the
  `longjmp`, there is nothing to sweep.
* **Major**: triggered when fromspace fills. A full Cheney copy from fromspace
  into tospace, with roots additionally including literal frames, symbol
  tables, GC roots, collectibles, and finalizers; then the spaces are swapped.
* **Realloc** (`C_rereclaim2`, `runtime.c:3940`): a major GC into a
  freshly-`malloc`ed heap of a different size. Growth/shrink policy is at
  `runtime.c:3618-3650`, with a `heap_shrink_counter` hysteresis to avoid
  grow/shrink thrashing.

The evacuation core is `really_mark` (`runtime.c:3853`) — chase forwarding
pointers, bump-allocate in the target space, `memcpy`, install a forwarding
pointer — and the breadth-first scan is `mark_nested_objects`
(`runtime.c:3820`):

```c
while(heap_scan_top < *tgt_space_top) {
  bp = (C_SCHEME_BLOCK *)heap_scan_top;
  if(*((C_word *)bp) == ALIGNMENT_HOLE_MARKER) bp = (C_SCHEME_BLOCK *)((C_word *)bp + 1);
  n = C_header_size(bp);
  h = bp->header;
  bytes = (h & C_BYTEBLOCK_BIT) ? n : n * sizeof(C_word);
  p = bp->data;
  if(n > 0 && (h & C_BYTEBLOCK_BIT) == 0) {
    if(h & C_SPECIALBLOCK_BIT) { --n; ++p; }
    while(n--) mark(p++);              /* mark() = "if(!C_immediatep(*p)) really_mark(p,…)" */
  }
  heap_scan_top = (C_byte *)bp + C_align(bytes) + sizeof(C_word);
}
```

**Write barrier.** `C_mutate_slot` (`runtime.c:3086`) records old→new pointers:

```c
if(C_in_stackp((C_word)slot) || (!C_in_stackp(val) && !C_in_scratchspacep(val)))
  return *slot = val;                 /* nothing to remember */
*(mutation_stack_top++) = slot;
return *slot = val;
```

Only heap→nursery and heap→scratch edges are remembered; the mutation stack is
cleared at every minor GC.

**Scratch space** (`runtime.c:3126`ff) is a third area for objects that must be
sized before they can be built (temporary bignums, in particular). It is
malloc'd, is scanned by the GC through recorded back-pointers, and is discarded
entirely on any non-minor collection.

### 8.3 Continuations

`call/cc` (`C_call_cc`, `runtime.c:7726`) is nearly free:

```c
wrapper = C_closure(&a, 2, (C_word)call_cc_wrapper, k);
av2[0]=cont; av2[1]=k; av2[2]=wrapper;
((C_proc)pr)(3, av2);
```

The continuation object is just a closure over the current CPS continuation
`k`, and invoking it is `C_kontinue(k, result)`. Full multi-shot,
re-entrant continuations, at the cost of one 2-word closure. This is the payoff
for the CPS decision: no stack copying, no segment chains, no
`__builtin_setjmp`.

`chicken.continuation` (`continuation.scm`) exposes the raw one-shot form via a
one-line foreign declaration, `#define C_direct_continuation(dummy) t1` — i.e.
"the continuation is whatever is in `t1`", which is true by the calling
convention.

### 8.4 Interrupts and threads

`C_check_for_interrupt` (`chicken.h:1332`) is a decrement-and-test on
`C_timer_interrupt_counter`; the backend emits it in the prologue of every
restartable (non-direct) procedure. Because it can only fire where the runtime
knows how to restart, green threads (`scheduler.scm`) get preemption for free
and with no safepoint machinery: an interrupt just makes the next `C_demand`
check fail, which routes through `C_reclaim` → `handle_interrupt`.

---

## 9. Where the performance is left on the table

I have split these by (a) how confident I am that the win is real, and
(b) how invasive the change is. Everything below is a proposal, not a
measurement — see §10.

### 9.1 SIMD opportunities

CHICKEN currently contains **zero** SIMD: no `immintrin.h`, no `__m128`, no
`restrict`, not even `unsigned __int128`. Some of that is deliberate (the
project's portability promise — "quite portable C code" — is a stated design
goal in the README). Any of the following should therefore be written as an
`#ifdef`-guarded fast path with the current scalar code as the fallback.

**(S1) UTF-8 scanning — the highest-value target.**
Because 6.0 made strings UTF-8 with a codepoint index, three byte-at-a-time
loops are now on the hot path of ordinary string code:

```c
/* utf.c:3537 — counts codepoints one byte at a time */
C_regparm int C_utf_fast_count(C_char *s, int len) {
  int i = 0, j = 0;
  while (len--) { if ((s[i] & 0xc0) != 0x80) j++; i++; }
  return j;
}
```

This is a textbook vector kernel: load 32 bytes, compare `(b & 0xc0) != 0x80`,
`movemask`, `popcount`. Expect ~10–20× on long strings with AVX2, and a useful
2–4× from a pure-C SWAR version (`(~x & (x >> 7) ...)` tricks) that needs no
intrinsics at all and stays portable.
The same applies to:
* `C_utf_validate` (`utf.c:3516`) — replace with the Keiser–Lemire
  lookup-table SIMD validator (the one in simdjson), which validates UTF-8 at
  ~1 byte/cycle.
* `utf_index1` (`utf.c:3247`) — finding the *n*-th codepoint currently
  `utf8_decode`s every character. It only needs to *count lead bytes*, which is
  the same vectorized primitive as (S1); a chunked version can skip 32 bytes at
  a time and only decode within the final chunk.
* `C_utf_count`, `C_utf_fragment_counts`, `C_latin_to_utf`, `C_utf_to_latin`.

Note `utf8_decode` itself (`utf.c:3175`) is already a nicely branch-reduced
scalar decoder with a comment about manual instruction scheduling — it is
worth keeping as the per-character path and vectorizing only the *scan* around it.

**(S2) Bignum arithmetic — use wide multiply first, SIMD second.**

```c
/* runtime.c:10520 — schoolbook multiply, in HALF digits */
int i, j, length_x = C_bignum_size(x) * 2, length_y = C_bignum_size(y) * 2;
for (j = 0; j < length_y; ++j) {
  yj = C_uhword_ref(yd, j);
  if (yj == 0) continue;
  carry = 0;
  for (i = 0; i < length_x; ++i) {
    product = (C_uword)C_uhword_ref(xd, i) * yj + (C_uword)C_uhword_ref(rd, i + j) + carry;
    C_uhword_set(rd, i + j, product);
    carry = C_BIGNUM_DIGIT_HI_HALF(product);
  }
  C_uhword_set(rd, j + length_x, carry);
}
```

The half-digit representation exists only because portable C has no 64×64→128
multiply. On GCC/Clang, `unsigned __int128` gives it directly; on MSVC,
`_umul128`. Working in full 64-bit digits **halves both loop bounds**, i.e.
~4× fewer partial products, before any vectorization. Then:
* carry chains in `bignum_plus_unsigned` / `bignum_minus_unsigned` /
  `bignum_digits_destructive_scale_up_with_carry` (`runtime.c:10439`) map onto
  `_addcarryx_u64` (ADX), which breaks the flag dependency and roughly doubles
  throughput;
* for genuinely large operands, AVX-512IFMA (`_mm512_madd52lo_epu64`) gives a
  52-bit-limb multiply-accumulate, which is how modern GMP-class code does it —
  but this requires changing the limb representation and is a much bigger
  project.

There is a standing comment at `chicken.h:350-357` that the Karatsuba threshold
of 70 is set high "because it generates a bit more garbage and GC overhead
dominates" — so this interacts with (R1)/(R2) below and the thresholds should be
re-tuned after any of these changes.

**(S3) GC slot scanning.**
The inner loop of `mark_nested_objects` is `while(n--) mark(p++)`, where `mark`
is `if(!C_immediatep(*p)) really_mark(...)`. For slot-blocks that are mostly
immediates (fixnum vectors, structure tag words, `#f`-filled vectors) this is
one dependent branch per word. A vectorized *filter* — load 4–8 words, `AND`
with 3, compare to zero, `movemask`, then iterate only over the set bits — turns
the common all-immediates case into a handful of instructions per 8 slots.
This is a real but moderate win: it helps vector- and structure-heavy heaps and
does nothing for pair-heavy ones (where every slot is a pointer anyway). The
copy itself (`C_memcpy` at `runtime.c:3925`) is already vectorized by libc,
though a size-specialized inline copy for the 3-word pair case would avoid the
`memcpy` call overhead that dominates pair-heavy collections.

**(S4) SRFI-4 bulk operations — the biggest *practical* win, and the easiest.**
Today `srfi-4.scm` offers only element-at-a-time accessors. Every numeric loop
over an `f64vector` therefore runs as a CPS loop with per-iteration interrupt
and demand checks, and — as shown in §9.2 — a heap allocation per element.
Nothing in that shape can ever be vectorized by the C compiler.

The fix does not require any new compiler machinery: add a handful of C loop
kernels exposed through the existing `##core#inline` mechanism —

```c
/* the C compiler auto-vectorizes this; no intrinsics needed */
C_regparm double C_f64vector_dot(C_word x, C_word y, C_word n) {
  double *a = (double *)C_data_pointer(C_block_item(x,1));
  double *b = (double *)C_data_pointer(C_block_item(y,1));
  double s = 0.0;
  C_word i, len = C_unfix(n);
  for(i = 0; i < len; ++i) s += a[i] * b[i];   /* -O3 -ffp-contract=fast */
  return s;
}
```

— plus `f64vector-map!`, `-fill!`, `-scale!`, `axpy!`, `-sum`, `-min`/`-max`,
and the elementwise binary ops. These would be the first operations in CHICKEN
where the C compiler can actually see a vectorizable loop. Caveat: strict IEEE
semantics require `-ffast-math`-style reassociation for reductions, so the
reduction kernels should either document the reassociation or use a
pairwise/Kahan formulation.

**(S5) Byte scanning in `irregex` / string search.** `string-search`,
`string-index`, and irregex's literal-prefix scan are `memchr`-shaped;
delegating to `memchr`/`memmem` (already SIMD in glibc) is nearly free.

**(S6) `hash_string` (`runtime.c:2460`).**

```c
while(len--) key ^= (key << 6) + (key >> 2) + *(str++);
```

This has a serial dependency and cannot be vectorized as written. Symbol
interning caches results, so the payoff is limited to `string-hash` on long
strings — but replacing it with a block-parallel hash (xxh3/wyhash) would also
improve distribution. Low priority, and it changes hash values, which may be
observable.

### 9.2 Non-SIMD wins that are probably larger

These matter more than any of the above for typical Scheme code, and several
are prerequisites for the SIMD work to pay off at all.

**(C1) Unbox flonums across loop back-edges.** This is the clearest single
defect I found. Compile:

```scheme
(define (axpy! a x y n)
  (let loop ((i 0))
    (unless (fx= i n)
      (f64vector-set! y i (fp+ (fp* a (f64vector-ref x i)) (f64vector-ref y i)))
      (loop (fx+ i 1)))))
```

and you get:

```c
f2=C_ub_i_f64vector_ref(((C_word*)t0)[3],t2);
f1=C_ub_i_flonum_times(C_flonum_magnitude(((C_word*)t0)[4]),f2);
f0=C_ub_i_f64vector_ref(((C_word*)t0)[5],t2);
t4=C_flonum(&a,C_ub_i_flonum_plus(f1,f0));      /* ← heap-allocates … */
t5=C_u_i_f64vector_set(((C_word*)t0)[5],t2,t4); /* … and immediately unboxes */
```

Two separate problems:
* **`C_u_i_f64vector_set` has no unboxed variant.** `+unboxed-map+`
  (`lfa2.scm:243-244`) lists `C_ub_i_f32vector_ref` and `C_ub_i_f64vector_ref`
  but there is no `C_ub_i_f64vector_set`, so every store round-trips through a
  freshly allocated flonum. Adding `#define C_ub_i_f64vector_set(v,i,x) (…= (x))`
  and an `acc`-style entry in `+unboxed-map+` removes one allocation per store.
  This is a small, self-contained change.
* **Loop-carried accumulators are always boxed.** In the dot-product version,
  `s` is re-boxed every iteration (`t6=C_flonum(&a, C_ub_i_flonum_plus(...))`)
  because `perform-unboxing` only handles `let`-bound variables
  (`lfa2.scm:569-582`); a variable that crosses a `##core#recurse` /
  `goto loop` back-edge is a *parameter*, not a `let`. Extending unboxing to
  direct-lambda parameters — emitting `double` parameters and `double`
  loop temporaries — would make float loops allocation-free, which in turn
  removes the per-iteration `C_check_for_interrupt` and `C_demand` (§7.1) and
  finally lets GCC vectorize the loop. This is the change with the largest
  expected payoff in the whole list, and also the most invasive: it touches
  `lfa2.scm`, the `lambda-literal` record, and `c-backend.scm`'s prologue and
  `##core#recurse` emission.

**(C2) Fuse `(fp+ (fp* a b) c)` into FMA.** `C_a_i_flonum_multiply_add` and
`C_ub_i_flonum_multiply_add` (→ `C_fma`) both exist, but the only thing that
generates them is an explicit `fp*+` call (`c-platform.scm:657`). A peephole in
the optimizer or in `perform-unboxing` recognizing the mul-then-add pattern
would halve the operation count in exactly the loops that matter. (Semantics
note: FMA changes rounding, so this should follow whatever `fp-contract`
policy the project wants to commit to — most likely opt-in via a declaration.)

**(C3) Hoist checks out of allocating loops.** Once (C1) is in place, many
loops become non-allocating and this happens automatically. Until then,
`C_demand` in a `goto loop` body could be strength-reduced: check once for
*k* iterations' worth of demand and decrement a counter, rather than
re-testing the stack pointer every time.

**(R1) Pair allocation and the `memcpy` call in evacuation.** `really_mark`
calls `C_memcpy(p2->data, p->data, bytes)` for every object. For the
overwhelmingly common 2-slot pair, a specialized inline two-word store would
avoid the call. Similarly, `C_align(bytes) + sizeof(C_word)` recomputation per
object could be folded.

**(R2) Nursery sizing.** `DEFAULT_STACK_SIZE` is 1 MB on 64-bit
(`runtime.c:138`) and `DEFAULT_HEAP_SIZE` equals it. On a machine with a
32 MB L3, a much larger nursery is usually a straight win for allocation-heavy
Scheme; the trade-off is that minor GC cost is proportional to *survivors*, not
to nursery size, so a bigger nursery mostly just reduces collection frequency.
This is a one-line experiment (`-:s`) that should be measured before anything
harder is attempted.

**(R3) Symbol table.** `lookup` (`runtime.c:2471`) walks a chain of weak pairs
per probe, with a `C_memcmp` per candidate. An open-addressed table with stored
hashes would avoid both the pointer chasing and most of the `memcmp` calls.

**(B1) Build flags — check this first, it may dominate everything else.**
The portability-sensitive flags are already right: every platform makefile
passes `-fno-strict-aliasing -fwrapv` (`Makefile.linux:35` and siblings), which
the runtime's `C_word*` ↔ `C_SCHEME_BLOCK*` punning needs. The problem is the
*optimization* level. On Linux the default is

```make
C_COMPILER_OPTIMIZATION_OPTIONS ?= -g -Wall -Wno-unused -O0 -Wno-cpp   # Makefile.linux:37
ifdef OPTIMIZE_FOR_SPEED
C_COMPILER_OPTIMIZATION_OPTIONS ?= -O3 -fomit-frame-pointer            # Makefile.linux:40
```

and that string is baked into `C_INSTALL_CFLAGS` at build time
(`defaults.make:360`), which is exactly what `csc` then passes when compiling
*user* programs (`csc.scm:129-131`). So unless CHICKEN was built with
`OPTIMIZE_FOR_SPEED=1`, every Scheme program compiled on that installation goes
through the C compiler at `-O0` — no inlining of the `C_*` primitives, no
register allocation worth the name, and categorically no auto-vectorization.
Any measurement of the SIMD proposals above is meaningless until this is
confirmed. Beyond that: `-fno-semantic-interposition` and LTO on the shared
`libchicken` are cheap wins for a library whose hot primitives are called across
the shared-object boundary on every operation, and `-march=native`
(or a runtime-dispatch scheme) is a prerequisite for AVX2 paths.

---

## 10. How to actually verify any of this

Nothing above has been measured on this tree — the tree is not built, and the
examples were produced with a 5.4.0 compiler. Before acting on any item:

1. **Build the tree** (`make PLATFORM=linux`), which bootstraps through
   `chicken-boot`. Note that changing the compiler means a full rebuild of every
   `.c` in the distribution, so keep a known-good `chicken-boot` around.
2. **Look at the C.** `chicken foo.scm -output-file foo.c` and read it. Add
   `-debug o` to see the optimizer's decisions ("direct leaf routine",
   "customizable procedures", "calls to known targets", "number of unboxed float
   variables") — this is the fastest way to tell whether a change actually
   reached the code you care about.
3. **Look at the passes.** `-debug 3` prints the CPS node tree, `-debug 7` the
   optimized tree, `-debug 9` the closure-converted tree.
4. **Measure GC separately from mutator.** `-:d` (debug) and `-:g` (GC report)
   at *runtime* print collection counts and heap occupancy; `-:s<size>` and
   `-:h<size>` let you separate "we allocate too much" from "we collect too
   often".
5. **Benchmarks.** `tests/` contains the standard set; the ones relevant here
   are the numeric and string benchmarks. For SIMD work specifically, the
   honest comparison is against a hand-written C loop doing the same thing —
   that gap is the real headroom.

A sensible order of attack, cheapest-first:
confirm the build is not `-O0` (B1) → `C_ub_i_f64vector_set` (C1a) → SRFI-4 bulk kernels (S4) → UTF-8 scan
vectorization (S1) → FMA fusion (C2) → wide-multiply bignums (S2) →
loop-carried float unboxing (C1b) → GC scan vectorization (S3).

---

## Appendix: file map

| File | Role |
|---|---|
| `chicken.h` | Object representation, allocation macros, ~700 `C_*` inline primitives |
| `runtime.c` | GC, trampoline, numeric tower, symbol tables, I/O, process control |
| `utf.c` | UTF-8 codec, Unicode case/property tables |
| `core.scm` | Canonicalization, CPS conversion, analysis, closure conversion, preparation |
| `optimizer.scm` | Inlining, contraction, rewriting, direct-lambda/leaf transform |
| `lfa2.scm` | Secondary flow analysis; flonum unboxing |
| `scrutinizer.scm` | Type checking and specialization |
| `c-backend.scm` | C code generation |
| `c-platform.scm` | Rewrite rules and intrinsic tables mapping Scheme ops to `C_*` |
| `batch-driver.scm` | Pass sequencing, command-line handling |
| `support.scm` | Node representation, the analysis database, utilities |
| `library.scm` | The Scheme-level core library |
| `scheduler.scm` | Green threads, built on the interrupt mechanism |
| `types.db` | Type signatures consumed by the scrutinizer |
| `cconv-sample.c` | A two-function file kept purely to disassemble and check the platform ABI |
