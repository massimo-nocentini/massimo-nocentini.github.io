

+++
date = '2026-07-17T09:58:04+01:00'
title = 'Pharo Smalltalk'
subtitle = 'The immersive programming experience'
summary = 'Pharo is a pure object-oriented programming language and a powerful environment, focused on simplicity and immediate feedback (think IDE and OS rolled into one).'
categories = ['tools', 'AI generated']
+++

The official site, [pharo-project.org](https://pharo-project.org/), presents Pharo as *the immersive programming experience*: a pure object-oriented language and an environment that is IDE and OS rolled into one, open source under the MIT License and available for macOS, Windows and Linux. Its main points:

- **A simple and powerful language.** No constructors, type declarations, interfaces or primitive types: objects and messages all the way down, with a syntax that fits on a postcard.
- **A live, immersive environment.** Immediate feedback while developing, testing and debugging, even in production, with no compile and deploy steps.
- **The debugger.** Step through code, restart the execution of a method, and create methods on the fly.
- **The community.** More than 100 contributors to the last release, and hundreds more writing frameworks and libraries. The Pharo Consortium coordinates the work, with essential support from Inria, RMOD, CNRS, UDL and Cristal.
- **Getting started.** `wget -O- https://get.pharo.org/64 | bash` downloads a VM and an image, and `./pharo Pharo.image eval "42 factorial"` runs one; the Pharo MOOC, a newsletter and a Mastodon account are linked from the page.

## What this fork adds to pharo-12

*Claude generated the content of this section from the repository, its commit messages and its documentation, plus benchmarks run on 2026-10-27. Every number says where it comes from.*

[massimo-nocentini/pharo-vm](https://github.com/massimo-nocentini/pharo-vm/tree/pharo-12) is a fork of [pharo-project/pharo-vm](https://github.com/pharo-project/pharo-vm/tree/pharo-12). Its `pharo-12` branch is 95 commits ahead of `upstream/pharo-12` and 0 behind. The diff covers 306 files, +74.7k/−2.2k lines ([compare](https://github.com/massimo-nocentini/pharo-vm/compare/pharo-project:pharo-vm:pharo-12...massimo-nocentini:pharo-vm:pharo-12)). The changes fall into four groups:

1. **A WebAssembly port of the VM.** It runs stock 64-bit Pharo 12–15 images in node and in the browser.
2. **A website built on that port.** It has a Smalltalk Console, a Notebook, the Morphic world in a canvas, saved images, and Iceberg over libgit2.
3. **Plugins.** There is a new SimdJSONPlugin, a rewrite of LargeIntegers with sub-quadratic kernels, and about twenty robustness fixes in other plugins.
4. **Fixes to the native VM, VMMaker and the build.** These include Windows arm64 and a GitHub Actions CI that publishes releases.

Some terms used below:

- **Slang** is the subset of Smalltalk the VM is written in. VMMaker translates it to C.
- The **StackVM** is the interpreter without a JIT. The **CoInterpreter** is the same interpreter with the JIT (Cog) added.
- **Spur** is the object memory of 64-bit Pharo images.
- A **lane** is one test script of `make wasm-check`.
- A **limb** is one machine word of a large integer.

Where to try it:

- **The site:** <https://massimo-nocentini.github.io/pharo-vm/> (Console and Notebook) and [world.html](https://massimo-nocentini.github.io/pharo-vm/world.html) (the Pharo desktop). It offers Pharo 15 build 50 by default, plus Pharo 14 build 785 ([`?fresh=p14`](https://massimo-nocentini.github.io/pharo-vm/?fresh=p14)) and Pharo 13.1 build 749 ([`?fresh=p13`](https://massimo-nocentini.github.io/pharo-vm/?fresh=p13)).
- **The release:** [PharoVM-v12.0.6-beta-885ae8867](https://github.com/massimo-nocentini/pharo-vm/releases/tag/PharoVM-v12.0.6-beta-885ae8867) has seven zips: Linux x86_64/aarch64, macOS x86_64/arm64, Windows x86_64/arm64, and WebAssembly (the node VM plus the whole site).
- **The documentation:**
  - [docs/WebAssembly.md](https://github.com/massimo-nocentini/pharo-vm/blob/pharo-12/docs/WebAssembly.md) is the long reference for the port.
  - [docs/SimdJSON.md](https://github.com/massimo-nocentini/pharo-vm/blob/pharo-12/docs/SimdJSON.md) and [plugins/LargeIntegers/tests/README.md](https://github.com/massimo-nocentini/pharo-vm/blob/pharo-12/plugins/LargeIntegers/tests/README.md) cover the two big plugins.

## The WebAssembly VM

Upstream `pharo-12` has no Emscripten platform: no file in its tree has `emscripten` or `wasm` in its path. In the fork, one command builds two VMs from the same objects:

```sh
make wasm          # build-wasm/node (command-line VM) and build-wasm/web (the static site)
make wasm-check    # the node test lanes
node build-wasm/node/pharo.js --headless Pharo.image --no-default-preferences eval '3 + 4'
```

`make wasm` first generates the StackVM sources in a native VMMaker tree. It then cross-compiles them with **Emscripten 6.0.10**, and needs exactly that version. The two VMs are:

- **the node VM**, with memory64. It reads the host file system, the environment and the exit status, and needs node 24.15 or later.
- **the web VM**, which runs in a Web Worker. It is linked with `-sMEMORY64=2`: a 32-bit memory with 64-bit pointers. The docs say this is 15–18% faster than memory64, and it also runs in engines without memory64.

Browsers need wasm exception handling with exnref (the newer encoding of wasm exceptions). That means Chrome/Edge 137, Firefox 131 or Safari 18.4. Older engines need a `WASM_SJLJ=wasm-legacy` build. The pages were tested in Chromium 153 and Firefox 155; Safari is untested. The site needs no COOP/COEP headers (cross-origin isolation) and no SharedArrayBuffer, so any static server can host it.

Only the **StackVM** is built, because a JIT needs executable memory. What the port needed:

- **Slices instead of threads.**
  - `main()` only prepares the VM. Each call to `vm_resume()` runs one slice and answers BUSY, SLEEPING or EXITED.
  - A slice ends with a `longjmp` from `ioReturnToHostIfRequested()`, the last statement of the event check. At that point only returns are left on the C stack.
  - Threads would need cross-origin isolation, and JSPI (JavaScript Promise Integration, which lets wasm suspend) is not available everywhere.
  - A side effect: V8 first runs a function in Liftoff, its baseline compiler, and uses optimised code only once the function is entered again. Re-entering `interpret()` every slice therefore makes the VM faster (see the timings).
- **A synchronous heartbeat.**
  - It needs a new Slang hook, `StackInterpreter>>pollHeartbeat`, which is a cmacro for `PHARO_POLL_HEARTBEAT()`.
  - The hook runs before the stack-limit check of every method activation, full block activation and backward jump: 14 sites in the StackVM.
  - On Emscripten it counts down and reads the clock every 2000 polls.
  - Natively it is `((void)0)`. The commit checked that the regenerated native StackVM and CoInterpreter are identical object files.
- **A memory map that fits linear memory.**
  - Under `__EMSCRIPTEN__`, the stack pages move to 64 MiB and new space to 128 MiB.
  - Old space grows over `sbrk()` from 512 MiB, inside a `[base, 2·base)` window, so that address bits still tell young objects from old ones.
  - Perm space is refused, so primitives 90/91/93 fail instead of aborting.
  - A booted worker uses about 675–683 MiB of linear memory.
- **No dlopen, typed indirect calls.**
  - Every plugin the wasm VM has is built in. UnixOSProcessPlugin and SqueakSSL are left out, and so is SurfacePlugin unless SDL2 is on.
  - WebAssembly type-checks indirect calls. The interpreter calls named primitives as `void (*)(void)`, but many plugins define them as `sqInt f(void)`, which traps. A build step (`cmake/emscripten/genPrimitiveTable.cmake`) therefore writes a void trampoline for every exported primitive.
  - Emscripten's generic fix, `-sEMULATE_FUNCTION_POINTER_CASTS`, made the VM 3.3–5.5× slower.
  - `-sTABLE_BASE=1024` keeps function pointers off the quick-primitive indexes, and `--fatal-warnings` refuses signature-mismatch stubs.
  - Lane 50 audits the 411 rows of the primitive table.
- **setjmp/longjmp** use wasm exception handling with exnref by default. The `wasm-legacy` and `emscripten` modes are kept.
- **The FFI runs on upstream libffi 3.8.0** with the same-thread runner.
  - There is no dlopen, so a library name such as `libgit2.so.1.4.4` maps to a static registry of functions.
  - The registry is generated from symbol lists checked against the headers: 144 functions for libc, 120 for cairo, 239 for libgit2, and others.
  - A callout whose declaration does not match the C function fails with `PrimErrFFIException` instead of trapping.
  - `ffiAdapt.c` adapts integer-width mismatches the way an x86-64 caller would.
- **Libraries from pinned archives.**
  - FreeType 2.14.3, cairo 1.18.4 (with pixman, libpng and zlib), libgit2 1.4.4, SDL2 2.32.10 and simdjson 5.0.5 are built from release archives whose SHA256 is checked.
  - There is no configure step: the generated config headers are committed.
  - FreeType draws the same pixels as the native VM's FreeType (lane 64).
  - cairo reproduces the native VM's golden hashes for shapes, gradients, text, a Roassal canvas and a Mondrian view (lane 65).
- **Git over HTTP.** libgit2 gets a smart-HTTP transport (`src/emscripten/gitSupport.c`).
  - In a worker, each request is a synchronous XHR and the browser does the TLS. In node, the request goes through curl.
  - Requests go through a CORS proxy prefix. The transport never sends a remote URL's user info to the proxy, and never downgrades https to http.

**Tests.** `make wasm-check` runs 24 node lanes. They cover:

- a C type check and smoke tests;
- Liftoff-only engines;
- a benchmark;
- the primitive audit;
- the FFI;
- parity of FreeType, cairo and libgit2 with the native VM;
- harnesses for every page.

Seven Playwright specs run the pages in Chromium 153 and Firefox 155.

## The HTML interface

Everything under [packaging/emscripten/web](https://github.com/massimo-nocentini/pharo-vm/tree/pharo-12/packaging/emscripten/web) is new: 21 files and about 14.5k lines. Four Smalltalk scripts under [packaging/emscripten/st](https://github.com/massimo-nocentini/pharo-vm/tree/pharo-12/packaging/emscripten/st) go with them. Every VM runs in its own Web Worker, in slices. The page compiles `pharo-web.wasm` once and hands the module to each worker.

### Console

`index.html` is a Smalltalk REPL. Each line is evaluated and its value is printed. An error prints up to 5 frames, and a syntax error gives its line and column.

- Output streams as it is written.
- History is kept in localStorage.
- Esc or Ctrl+C stops an evaluation through a WebHostPlugin semaphore. A worker that stays silent for 3 s after that is replaced.
- **Save** runs `Smalltalk snapshot: true andQuit: false`, then stores the image in IndexedDB. *Save as*, *Download*, *Restart* and *Delete* are also there.
- **Open** (or drag and drop) accepts a Pharo zip from files.pharo.org, or `.image` + `.changes` [+ `.sources`].
  - The zip is unpacked in the browser with `DecompressionStream`.
  - Before the VM touches anything, the size and CRC-32 of every entry are checked, and the image must be 64-bit Spur.

### Notebook

The Notebook tab runs Smalltalk cells on a **second VM**, the kernel, in its own worker. The kernel boots the Console's image read-only and never saves it. Markdown cells are rendered too.

- A cell is parsed whole and run statement by statement as one DoIt, so a class can be defined and used in the same cell.
- Undeclared assignments become notebook variables.
- Output goes to the cell that produced it, even from processes forked earlier.
- The keys are Jupyter-like: Shift/Ctrl/Alt+Enter, and a/b, d d, m/y in command mode.
- *Run all* stops at the first failure. *Stop* has a watchdog and starts a fresh kernel when it has to.

Rich output comes from the `Notebook` class:

```smalltalk
Notebook markdown: '# Results'.
Notebook show: 42 factorial printString.
Notebook cairo: [ :canvas | "draw on a Roassal canvas: the page gets vector SVG" ].
```

There are also `html:`, `svg:`, `table:`, `image:` and `png:`. A Form, Morph or Roassal canvas returned as the value of a cell shows as an image.

- **Markup handling.** The page never inserts markup as given.
  - HTML and SVG are parsed inertly with `DOMParser` and rebuilt from an allowlist.
  - Markdown is rendered in linear time into DOM nodes.
  - `index.html` has a strict CSP as a second line of defence.
- **Syntax highlighting.** The highlighter runs in linear time. It agrees with the image's own scanner on every token of every method: 3,675,607 tokens on Pharo 12 and 3,698,571 on Pharo 15.
- **Export and import.**
  - Export writes `.st` (chunk format with `"%%"` cell markers), `.json` (with outputs), or one self-contained `.html` with no script.
  - Notebooks autosave to localStorage and check for conflicts across tabs.

### The world page

`world.html` shows the Morphic desktop in a canvas. It does not go through SDL2:

- A new builtin **WebDisplayPlugin** (13 primitives) and an image-side `OSWindow-Web` driver blit the damaged rectangles of the world's Form into an RGBA frame, up to 64 per present.
- Input comes back as 8-integer records in a ring of 256.
- FreeType draws the text, and cairo draws Athens and Roassal.
- On HiDPI displays the world is drawn in device pixels (`canvasScaleFactor = devicePixelRatio`).
- The keyboard, the clipboard and Alt+. (a debugger) work.
- A stock image opened from disk is prepared for the world on the fly.

An opt-in `sdl.html` (`WASM_SDL2=ON`) runs the world through the image's own `OSSDL2Driver` and SDL2 instead. CI builds without it, so the public URL answers 404. The WebDisplay route stays the default because it costs less while idle (see the timings).

### Saved images

Any number of images live in IndexedDB, one slot each. A slot holds:

- the image, its `.changes` and its own `.sources`;
- the files of `/pharo`, up to 256 MiB or 50,000 files: Iceberg clones with their `.git`, the package cache and Epicea.

A reload therefore restores the clones as they were at the last save.

- Each save carries an id, so two tabs never mix their images.
- The Images dialog starts any of the site's images fresh, or opens, renames and deletes saved ones. It also shows storage use and offers `navigator.storage.persist()`.
- Only `?slot=` and `?fresh=` are read from the URL, so links are safe to share.

### Iceberg in the browser

Iceberg works through the image's own LGit bindings: 65 FFI methods and 9 callback classes, checked against the native VM's output by lane 66. They run on the wasm libgit2 and its XHR transport.

- **The proxy.** Git hosts send no CORS headers, so requests go through a proxy prefix.
  - *Settings* offers the site default (`https://cors.isomorphic-git.org/`), *None*, or your own proxy.
  - The setting is never read from the URL.
  - A one-time notice says that a public proxy sees what you clone.
- **Error messages.** Failures name their cause: CORS, a proxy that is down, 401/403/404 or 407.

## The plugins

### SimdJSONPlugin (new)

[plugins/SimdJSONPlugin](https://github.com/massimo-nocentini/pharo-vm/tree/pharo-12/plugins/SimdJSONPlugin) parses JSON with simdjson 5.0.5 (C++17, `-fno-exceptions`). One primitive call builds the whole Pharo value. When the reader uses NeoJSON's defaults, the Dictionaries and Arrays are built directly in C.

[SimdJSON.st](https://github.com/massimo-nocentini/pharo-vm/blob/pharo-12/plugins/SimdJSONPlugin/st/SimdJSON.st) provides `SimdJSONReader`. It has NeoJSONReader's API (`fromString:`, `on:`, `nextAs:`, mappings, …) plus `fromBytes:`, and works in two modes:

- **neo:** a subclass of NeoJSONReader. Anything that strict RFC 8259 rejects is re-read by NeoJSON, so values, errors and stream positions are NeoJSON's.
- **standalone:** a port of NeoJSON's mapper. It is strict and needs no NeoJSON.

Number semantics follow NeoJSON: `1e2` is the Integer 100, `1e-2` is the Fraction 1/100, and integers have arbitrary size.

```smalltalk
SimdJSONReader fromString: '{"name": "pharo", "versions": [12, 13, 14, 15]}'.
```

The plugin is on by default on every platform: an external plugin natively, and built in for wasm. In wasm, simdjson uses its scalar *fallback* kernel. CI loads the plugin from all six native zips.

A caveat: [docs/SimdJSON.md](https://github.com/massimo-nocentini/pharo-vm/blob/pharo-12/docs/SimdJSON.md) still calls macOS, Windows and aarch64 "untested". Since then CI has loaded the plugin on all of them, and the macOS arm64 timings below were measured on one of those VMs.

### LargeIntegers: fixes and sub-quadratic kernels

Upstream's LargeIntegers plugin does schoolbook arithmetic over 32-bit digits. It also has memory-safety bugs. For example, `(LargePositiveInteger new: 64000000) byteAt: 1 put: 1; bitShiftMagnitude: 1` wrote past the new object and segfaulted. The fork's changes ([5ae05479c](https://github.com/massimo-nocentini/pharo-vm/commit/5ae05479c) and the commits after it):

- **Safety.**
  - The heap overflow in the left shift of an unnormalized receiver is gone.
  - Out-of-bounds reads on empty operands are fixed.
  - Failed allocations are checked and fail with `PrimErrNoMemory`.
  - All 15 primitives check their argument count and fail with `PrimErrBadNumArgs`.
  - Scratch LargeInteger objects are no longer used.
- **Kernels** ([LargeIntegersKernels.c](https://github.com/massimo-nocentini/pharo-vm/blob/pharo-12/plugins/LargeIntegers/src/common/LargeIntegersKernels.c), hand-written C called from Slang). They use 64-bit limbs with 128-bit products, or 32-bit limbs on wasm and 32-bit hosts:
  - Karatsuba multiplication from 24 limbs;
  - squaring kernels ([444fb7a65](https://github.com/massimo-nocentini/pharo-vm/commit/444fb7a65));
  - Knuth D division with a Möller–Granlund reciprocal;
  - Burnikel–Ziegler recursive division from 48 limbs ([979bdf33e](https://github.com/massimo-nocentini/pharo-vm/commit/979bdf33e));
  - Montgomery multiplication over 64-bit limbs ([c73195782](https://github.com/massimo-nocentini/pharo-vm/commit/c73195782)).
- **Same answers.**
  - Results are bit-identical to upstream's, including the deliberately unnormalized results and the failure codes. The exceptions are the cases where a crash, undefined behaviour or a missing argument-count check was removed.
  - The test suite compares the kernels with frozen copies of upstream's loops and with a Python oracle, under ASan/UBSan.
  - A mock-VM harness checks 84,773 primitive calls against digests of upstream's plugin, and image differentials add about 92k more calls.
  - `sync-c.sh` checks that the checked-in C is byte-identical to what Slang generates.

The suite was re-run on 2026-10-27 on the M4 Max against upstream's `LargeIntegers.c` (`run-c-tests.sh --reference-c`, ASan+UBSan):

- The fork's plugin matched upstream on all 87,109 differential calls.
- Upstream's plugin tripped ASan with a heap-buffer-overflow on the 3 known shapes.
- Upstream's plugin crashed on 26 of 62 injected out-of-memory failures.
- None of the 180 wrong-arity calls to upstream's plugin failed with `PrimErrBadNumArgs`.

### The other plugins

| Plugin | Fix |
|---|---|
| SocketPlugin | DNS lookups on Unix run on a thread ([595cec865](https://github.com/massimo-nocentini/pharo-vm/commit/595cec865)). Before, `getaddrinfo` blocked the whole VM, so every Process stopped for a DNS round trip. Seven address primitives now kind-check their arguments, the getifaddrs leak is fixed, and UDP to BSD stacks works. |
| FilePlugin | Closing a file disarms its aio watch: before, the next file on the same fd inherited it. NULL dereferences in `dir_Lookup`, an unbounded Win32 name conversion and an iconv loop are fixed. |
| FileAttributesPlugin, NewFilePlugin | Use-after-free on stale directory handles, a readlink off-by-one, `path[-1]`, unchecked spans, and an inverted unmap reference count. |
| BitBlt | Rule 26 at 32 bpp on 64-bit VMs: `Form>>eraseShape:` cleared the whole destination. Depth 0 or >32 and empty halftones raised SIGFPE and now fail the primitive. The surface function pointers have the callee's types. |
| SurfacePlugin | An out-of-range id, a write at `surfaceArray[-1]`, a lost array on realloc failure, and an 8-byte handle in a 4-byte holder. |
| JPEGReadWriter2Plugin, JPEGReaderPlugin | Decoding a 200×150 JPEG into an 8×8 Form overwrote the heap and now fails. Bad MCU indices and empty Huffman tables fail the primitive, and the image falls back to Smalltalk. |
| UnixOSProcessPlugin, SqueakSSL, LocalePlugin, MiscPrimitivePlugin, DSAPrims | One-past-the-end writes, unchecked signal numbers, negative SSL handles, a multi-byte separator in a 1-byte String, run lengths taken on trust, and arity checks. |
| WebDisplayPlugin, WebHostPlugin (new, wasm) | The world page's display and input, and Stop as a user interrupt. |

## The fixes

### Native VM

The WebAssembly port found most of these, because a typed call traps where x86_64 and arm64 forgive undefined behaviour:

- **Interpreter proxy prototypes** ([8b75039f2](https://github.com/massimo-nocentini/pharo-vm/commit/8b75039f2)).
  - `client.c`, `sqExternalSemaphores.c` and `sqVirtualMachine.c` declared interpreter functions with other types than the interpreter defines.
  - Static adapters now fill six interpreterProxy slots with exactly the slot types, and the plugin ABI is unchanged.
  - Compiling these files together with the interpreter went from 15 type errors to 0, and test lane 10 keeps it there.
- **argv[0] fallback** ([883dee2d8](https://github.com/massimo-nocentini/pharo-vm/commit/883dee2d8)). A native VM started through the `PATH` from another directory passed `NULL` to `setVMPath` and exited with status 139. It now keeps `argv[0]`.
- **Session ids** ([d2ad0c767](https://github.com/massimo-nocentini/pharo-vm/commit/d2ad0c767)). They were `seconds + ioMSecs`, which repeats for VMs started seconds apart, so a reloaded snapshot trusted the stale file handles of the session that saved it. They are now seconds plus UTC milliseconds.
- **Fixes found while porting the platform layer to Rust, backported as C** ([2c968686e](https://github.com/massimo-nocentini/pharo-vm/commit/2c968686e), [8392b539d](https://github.com/massimo-nocentini/pharo-vm/commit/8392b539d), [c152df318](https://github.com/massimo-nocentini/pharo-vm/commit/c152df318), [50039a3d2](https://github.com/massimo-nocentini/pharo-vm/commit/50039a3d2)):
  - a NULL dereference on an empty primitive name;
  - `strcpy` into a 256-byte buffer;
  - `strcmp(NULL)` in the path utilities;
  - a leaked `sem_t`;
  - heap-map leaf pages 8× too large;
  - a race in the FFI thread-safe queue on weakly ordered CPUs;
  - freeing the main-thread FFI worker;
  - an epoll `EPERM` that made the idle loop spin at 100% CPU;
  - a use-after-free in aio dispatch;
  - a semaphore mutex that was not signal-safe;
  - a lost wakeup before poll.
- **Windows debug output.** VirtualProtect failures log `GetLastError` instead of `errno`. The ARM64 register dump prints 64-bit registers with `%llx` and labels X18/X19 correctly.

One thing is *not* a fork change: support for 39-bit-VA aarch64 kernels in `memoryUnix.c` is upstream commit [3bf564e91](https://github.com/pharo-project/pharo-vm/commit/3bf564e91), and the fork does not change that file.

### VMMaker and Slang

Three hooks are no-ops in native builds; the commits checked that the regenerated native objects are identical:

- `pollHeartbeat`;
- the `__EMSCRIPTEN__` memory map;
- a perm-space guard in `VMMemoryMap>>ensureAtLeastPermSpaceOf:`.

The other Slang changes also change native code:

- **The session id** is a native fix, made in both the C and the simulation.
- **The BitBlt surface function pointer types** in `BitBltSimulation` remove undefined behaviour on native builds too.
- **`doPrimitiveSameThreadCallout`** returns early when a callout failed. That only happens on wasm.

Two swapped addresses in memory-map error messages are fixed too ([b6c7ce3fe](https://github.com/massimo-nocentini/pharo-vm/commit/b6c7ce3fe)). The wasm configuration refuses generated sources that lack the heartbeat polls, the Emscripten memory map or the failure test after a callout.

### Windows arm64 and the build

- **MSYS2** ([4266c4ec4](https://github.com/massimo-nocentini/pharo-vm/commit/4266c4ec4), [7e95a162a](https://github.com/massimo-nocentini/pharo-vm/commit/7e95a162a), [23f55897f](https://github.com/massimo-nocentini/pharo-vm/commit/23f55897f)).
  - Under MSYS2, CMake sets `MINGW` but neither `UNIX` nor `CYGWIN`, so upstream selected no platform.
  - The fork now builds with **MSYS2 UCRT64 (x86_64)** and **CLANGARM64 (arm64)**.
  - It takes the CPU from the compiler, because the MSYS2 shell runs x64-emulated on arm64.
  - It drops the x86-only flags on arm64 and bundles the MSYS2 DLLs.
- **Smaller fixes:**
  - `ALWAYS_INTERACTIVE=ON` now works; before, only `=1` did.
  - Ninja knows the VMMaker VM byproduct.
  - Linux aarch64 uses the VMMaker VM 10.2.1, because 10.3.2 is missing on files.pharo.org.
  - `git describe` matches only `v[0-9]*`, so a release tag no longer becomes the VM version.
  - SocketPlugin links pthreads explicitly.

### CI and releases

Upstream builds its releases on Jenkins; the `Jenkinsfile` is still in the fork. Upstream's GitHub Actions workflow targets runners and actions that no longer exist (`ubuntu-18.04`, `windows-2016`, `actions/*@v1`). The fork replaces that workflow with [.github/workflows/build.yml](https://github.com/massimo-nocentini/pharo-vm/blob/pharo-12/.github/workflows/build.yml), which builds:

- Linux x86_64 and aarch64, macOS x86_64 and arm64, and Windows x86_64 and arm64.
  - Windows arm64 builds from C sources generated by a shared Linux job, because the x86_64 VMMaker VM dies under Windows-on-ARM emulation.
  - Every zip is smoke-run and loads its SimdJSONPlugin. On Windows the PE machine of every binary is checked.
- WebAssembly: emsdk 6.0.10, the Pharo 15/14/13.1 images pinned by SHA256, then `make wasm` and `make wasm-check`.

Pushes to `pharo-12` deploy the site to gh-pages and publish the release `PharoVM-<version>` with seven zips. Since [885ae8867](https://github.com/massimo-nocentini/pharo-vm/commit/885ae8867) the release, like the Pages deploy, comes only from pushes to `pharo-12`.

## Timings

Every table names its machine and its provenance:

- **Documented:** a line of a file or a commit message in the repository (linked). Most were taken on the machine the port was made on, which has 112 processors ([WebAssembly.md:53](https://github.com/massimo-nocentini/pharo-vm/blob/pharo-12/docs/WebAssembly.md?plain=1#L53)). [SimdJSON.md:242](https://github.com/massimo-nocentini/pharo-vm/blob/pharo-12/docs/SimdJSON.md?plain=1#L242) and the LargeIntegers README name a 2× Xeon Gold 6238R, which has 112 threads. It is probably the same machine, but the docs don't say so.
- **Measured:** run on 2026-10-27 on an Apple M4 Max (16 cores, 128 GB, macOS 27.0.1) with the method stated.
  - macOS has no CPU pinning.
  - The machine was busy during the SimdJSON runs: load average 16 at the start and 4 at the end. Load was not recorded for the other runs.
  - So the ratios are what matter, not the last digit.

**Enhancement** means the same operation, faster than upstream, or newly possible. The wasm-vs-native ratios at the end are context, not enhancements.

### LargeIntegers: the same primitives, faster than upstream

**Measured in the image** on the M4 Max, with the plugin's own benchmark, [bench.sh](https://github.com/massimo-nocentini/pharo-vm/blob/pharo-12/plugins/LargeIntegers/tests/bench.sh):

- **VMs:** upstream's macOS arm64 build of `upstream/pharo-12` (`PharoVM-v12.0.6-beta+0.bebdbaca8`, from files.pharo.org) against the fork's release [PharoVM-v12.0.6-beta-885ae8867](https://github.com/massimo-nocentini/pharo-vm/releases/tag/PharoVM-v12.0.6-beta-885ae8867). Both are the CoInterpreter with the JIT; only the plugins differ.
- **Image:** Pharo 12 (`Pharo12.0-SNAPSHOT-64bit-7d5f14cb47`), a fresh copy for every run.
- **Method:** `LI_BENCH_RUNS=5 sh plugins/LargeIntegers/tests/bench.sh <upstream-vm> <image> <fork-vm>`. The two VMs alternate, run by run, and the table gives the median of 5 runs each. The times are taken inside the image, so VM startup is excluded.

| Expression or primitive | upstream | fork | speedup |
|---|---|---|---|
| `(3 raisedTo: 200000) squared` | 91.24 ms | 2.31 ms | 39.5× |
| 10 squarings of `3 raisedTo: 200000` | 710.87 ms | 16.56 ms | 42.9× |
| `(7 raisedTo: 300000) // (3 raisedTo: 200000)` | 366.75 ms | 12.22 ms | 30.0× |
| `(3 raisedTo: 100000) printString` | 29.47 ms | 4.60 ms | 6.4× |
| `(2 raisedTo: 100000) printString` | 9.96 ms | 2.54 ms | 3.9× |
| `5000 factorial` | 3.00 ms | 1.93 ms | 1.6× |
| `(11 raisedTo: 9000) gcd: (3 raisedTo: 2000) + 1` | 248.0 µs | 129.5 µs | 1.9× |
| 2048-bit `base raisedTo: e modulo: m` (RSA-like) | 7.98 ms | 2.09 ms | 3.8× |
| 4096-bit `base raisedTo: e modulo: m` (RSA-like) | 69.34 ms | 15.21 ms | 4.6× |
| `(3 raisedTo: 5000) raisedTo: (7 raisedTo: 600) modulo: (2 raisedTo: 4253) - 1` | 31.44 ms | 6.58 ms | 4.8× |
| multiply primitive, 262144 × 262144 bits | 46.90 ms | 1.66 ms | 28.3× |
| square primitive, 262144 bits | 46.65 ms | 1.19 ms | 39.3× |
| divide primitive, 524288 / 262144 bits | 75.37 ms | 3.18 ms | 23.7× |
| multiply primitive, 1024 × 1024 bits | 641.6 ns | 232.3 ns | 2.8× |
| Montgomery product primitive, 2048 bits | 3303.8 ns | 899.1 ns | 3.7× |
| SmallInteger `*` / `//` overflowing into the plugin | 72.0 / 131.0 ns | 41.9 / 71.1 ns | 1.7× / 1.8× |

On small operands the two plugins are level: a 64 × 64-bit multiply took 54.0 against 52.6 ns, and a 64-bit `x * x` 52.7 against 57.0 ns, and no row of the benchmark is more than 8% slower in the fork. The full table, 223 rows from 64 to 262144 bits, comes out of the same command.

**Measured, the plugin alone**, on the M4 Max, which reaches larger operands than the image benchmark:

- **Plugins:** upstream's `LargeIntegers.c` (`upstream/pharo-12`) and the fork's, both compiled with Apple clang 21, `-O2 -DNDEBUG`, with the same headers.
- **Calls:** `primDigitMultiplyNegative`, `primDigitDivNegative` and `primMontgomeryTimesModulo`, on the same random operands, through the repository's mock VM (`plugins/LargeIntegers/tests/c/plugin_harness.c`).
- **Method:** the two plugins took turns sample by sample, with samples of at least 30 ms and 9 samples per case. The median is reported.
- **Check:** every answer was hashed and was identical between the two plugins.
- **Scope:** the times cover the plugin only. There is no primitive dispatch, and malloc replaces Spur allocation.

| Operation (operand bits) | upstream | fork | speedup |
|---|---|---|---|
| multiply 1024 × 1024 | 603 ns | 207 ns | 2.9× |
| multiply 4096 × 4096 | 11,143 ns | 1,983 ns | 5.6× |
| multiply 65536 × 65536 | 3.23 ms | 0.192 ms | 16.9× |
| multiply 262144 × 262144 | 51.9 ms | 1.76 ms | 29.5× |
| multiply 1048576 × 1048576 | 832 ms | 15.9 ms | 52.4× |
| square 16384 | 194,053 ns | 14,650 ns | 13.3× |
| square 262144 | 51.9 ms | 1.30 ms | 39.8× |
| square 1048576 | 832 ms | 11.9 ms | 70.1× |
| divide 2048 / 1024 | 1,801 ns | 479 ns | 3.8× |
| divide 131072 / 65536 | 5.64 ms | 0.363 ms | 15.5× |
| divide 524288 / 262144 | 89.9 ms | 3.41 ms | 26.4× |
| divide 2097152 / 1048576 | 1438 ms | 31.3 ms | 46.0× |
| Montgomery product, 2048-bit modulus | 3,413 ns | 946 ns | 3.6× |
| modexp as a Montgomery chain, 1024 bits | 1.26 ms | 0.444 ms | 2.8× |
| modexp as a Montgomery chain, 4096 bits | 94.9 ms | 21.0 ms | 4.5× |

Upstream's time grows about 16× for each 4× in bits, as schoolbook arithmetic does. The fork's grows about 9–10×. In upstream, `x * x` costs the same as `a * b`. In the fork, from 4096 bits up, a square costs 0.70–0.75 of a product.

**Documented, in the image** (the real VM, upstream's plugin vs the fork's first kernels): Xeon Gold 6238R, Linux, clang 18 `-O2`, medians of 5 alternating runs ([README.md:224–241](https://github.com/massimo-nocentini/pharo-vm/blob/pharo-12/plugins/LargeIntegers/tests/README.md?plain=1#L224-L241)).

| Expression | upstream | fork | speedup |
|---|---|---|---|
| [`(3 raisedTo: 100000) printString`](https://github.com/massimo-nocentini/pharo-vm/blob/pharo-12/plugins/LargeIntegers/tests/README.md?plain=1#L239) | 38.6 ms | 10.3 ms | 3.7× |
| [`(3 raisedTo: 200000) squared`](https://github.com/massimo-nocentini/pharo-vm/blob/pharo-12/plugins/LargeIntegers/tests/README.md?plain=1#L240) | 91.4 ms | 4.7 ms | 19.4× |
| [`(7 raisedTo: 300000) // (3 raisedTo: 200000)`](https://github.com/massimo-nocentini/pharo-vm/blob/pharo-12/plugins/LargeIntegers/tests/README.md?plain=1#L241) | 434.6 ms | 50.6 ms | 8.6× |
| [multiply 262144 × 262144 bits](https://github.com/massimo-nocentini/pharo-vm/blob/pharo-12/plugins/LargeIntegers/tests/README.md?plain=1#L233) | 46.8 ms | 2.27 ms | 20.6× |
| [SmallInteger `*` / `//` through the plugin](https://github.com/massimo-nocentini/pharo-vm/blob/pharo-12/plugins/LargeIntegers/tests/README.md?plain=1#L238) | 162 / 340 ns | 92 / 187 ns | 1.8× |

Small operands gain little ([README.md:243–245](https://github.com/massimo-nocentini/pharo-vm/blob/pharo-12/plugins/LargeIntegers/tests/README.md?plain=1#L243-L245)):

- A 256 × 256-bit multiply went from 169 to 151 ns (1.1×, [README.md:229](https://github.com/massimo-nocentini/pharo-vm/blob/pharo-12/plugins/LargeIntegers/tests/README.md?plain=1#L229)).
- Every other call on operands up to 128 bytes runs at 0.73–1.02 of upstream's time.
- `normalize` is about 5% slower, because it now checks its argument count.

**Documented, later kernels against the commit before them** (same Xeon, in the image; these are not comparisons with upstream):

- **Burnikel–Ziegler** ([README.md:254–257](https://github.com/massimo-nocentini/pharo-vm/blob/pharo-12/plugins/LargeIntegers/tests/README.md?plain=1#L254-L257)) cut `(7 raisedTo: 300000) // (3 raisedTo: 200000)` from 47.9 ms to 18.8 ms, 2.5×. Combined with the row above, that is 434.6 ms upstream against 18.8 ms now, about 23× (two separate runs).
- **The Montgomery kernel** ([README.md:273–292](https://github.com/massimo-nocentini/pharo-vm/blob/pharo-12/plugins/LargeIntegers/tests/README.md?plain=1#L273-L292)) was measured against the commit before c73195782, which still ran upstream's 32-bit Montgomery loop:
  - `base raisedTo: e modulo: m` at 2048 bits: 13.1 → 3.81 ms (3.4×).
  - At 4096 bits: 106.7 → 26.0 ms (4.1×).
  - `(3 raisedTo: 5000) raisedTo: (7 raisedTo: 600) modulo: (2 raisedTo: 4253) - 1`: 47.6 → 11.6 ms (4.1×).
  - Below 6 digits the old loop still runs: a 128-bit modulus is at 1.01×.
  - The measured mock-VM table above gives the upstream comparison for Montgomery.

### SimdJSON: newly possible

Upstream has no SimdJSONPlugin, so its baseline is a JSON reader written in Smalltalk.

**Measured** on the M4 Max:

- **VM and image:** the fork's release VM (Darwin arm64, CoInterpreter) with Pharo 15 build 41.
- **Reader:** `SimdJSON.st` filed in, standalone mode.
- **Baseline:** STONJSON, which is in the stock image.
- **Corpus:** simdjson-data.
- **Method:** two warm-up reads, then 10 samples of at least 50 ms each, in 2 separate VM processes. The value is the mean of the two medians: the time of one read.
- **Check:** every result was deep-compared with STON's, including number classes and float bits. All 186 checks were equal.

NeoJSON could not be loaded on the M4 Max, so every NeoJSON number below is documented.

| File (size) | STON | SimdJSON | speedup |
|---|---|---|---|
| twitter.json (632 kB) | 25.66 ms | 1.589 ms | 16.2× |
| citm_catalog.json (1.73 MB) | 67.46 ms | 2.201 ms | 30.6× |
| canada.json (2.25 MB) | 259.4 ms | 3.395 ms | 76.4× |
| marine_ik.json (2.98 MB) | 228.8 ms | 7.415 ms | 30.9× |
| numbers.json (150 kB) | 13.47 ms | 0.195 ms | 69.0× |
| semanticscholar (8.59 MB) | 383.0 ms | 21.96 ms | 17.4× |
| NDJSON, 20k objects (1.37 MB) | 116.9 ms | 15.05 ms | 7.8× |
| small document (1.9 kB) | 0.1195 ms | 0.0076 ms | 15.7× |

**Measured in the WebAssembly node VM:**

- **Setup:** the release's `node/pharo.js` on node 25.2.1, with Pharo 15 build 50 and `SimdJSON.st` filed in.
- **Input:** 1.57 MB of JSON, made by STON `toJsonString:` from 20,000 dictionaries.
- **Method:** 5 runs, median.
- **Result:** 5 reads took **8109 ms with STON and 176 ms with SimdJSONReader**, 46.1× faster. That beats STON on the native JIT, which took 770 ms.

**Documented**, against NeoJSON: Pharo 15 build 41, 2× Xeon Gold 6238R, Linux 6.8, wasm on node 24.19.0 and headless Chromium 153.

| Case | NeoJSON | SimdJSON | speedup |
|---|---|---|---|
| [twitter.json, Cog](https://github.com/massimo-nocentini/pharo-vm/blob/pharo-12/docs/SimdJSON.md?plain=1#L303) | 53.19 ms | 3.25 ms | 16.4× |
| [canada.json, Cog](https://github.com/massimo-nocentini/pharo-vm/blob/pharo-12/docs/SimdJSON.md?plain=1#L305) | 509.1 ms | 7.31 ms | 69.7× |
| [twitter.json, wasm node](https://github.com/massimo-nocentini/pharo-vm/blob/pharo-12/docs/SimdJSON.md?plain=1#L339) | 740.5 ms | 7.38 ms | 100.4× |
| [canada.json, wasm node](https://github.com/massimo-nocentini/pharo-vm/blob/pharo-12/docs/SimdJSON.md?plain=1#L341) | 7051.5 ms | 18.75 ms | 376.1× |
| [canada.json, Chromium](https://github.com/massimo-nocentini/pharo-vm/blob/pharo-12/docs/SimdJSON.md?plain=1#L377) | 6926.0 ms | 15.12 ms | 457.9× |
| [`nextAs:`, Symbol keys, Cog](https://github.com/massimo-nocentini/pharo-vm/blob/pharo-12/docs/SimdJSON.md?plain=1#L423) | 60.91 ms | 3.62 ms | 16.8× |
| [NDJSON 20k, wasm node](https://github.com/massimo-nocentini/pharo-vm/blob/pharo-12/docs/SimdJSON.md?plain=1#L471) | 3138.5 ms | 332.5 ms | 9.4× |

The slower the VM, the larger the gain, because NeoJSON is Smalltalk and the plugin is C.

### Design choices inside the WebAssembly port (documented)

These compare two ways of building the port, not the fork with upstream. All were taken on the machine the port was made on.

- **Typed indirect calls.** `-sEMULATE_FUNCTION_POINTER_CASTS` made the VM 3.3–5.5× slower than the void trampolines ([WebAssembly.md:492](https://github.com/massimo-nocentini/pharo-vm/blob/pharo-12/docs/WebAssembly.md?plain=1#L492)).
- **Web VM memory.** `MEMORY64=2` is 15–18% faster than memory64 ([WebAssembly.md:369](https://github.com/massimo-nocentini/pharo-vm/blob/pharo-12/docs/WebAssembly.md?plain=1#L369)).
- **Re-entering `interpret()`.** 20 × `inject:into:` over 100000 elements took 1217 ms in one activation and 585 ms re-entered each slice, 2.1× ([WebAssembly.md:451](https://github.com/massimo-nocentini/pharo-vm/blob/pharo-12/docs/WebAssembly.md?plain=1#L451)).
- **`NDEBUG` in Release builds.** A 1M-deep recursion took 34 s with the C asserts and 1 s without them ([WebAssembly.md:641](https://github.com/massimo-nocentini/pharo-vm/blob/pharo-12/docs/WebAssembly.md?plain=1#L641)).
- **`--maxFramesToLog` 1000.** A crash dump 100k frames deep went from 4.8 MB in 978 ms to 69 KB in 47 ms, 20.8× ([5f7a8e8c3](https://github.com/massimo-nocentini/pharo-vm/commit/5f7a8e8c3)).
- **Idle world.** `sdl.html` (SDL2) runs 186 slices/s against 61 for `world.html` (WebDisplayPlugin), so the world page costs 3.5× (Chromium) to 4–6× (Firefox) less VM time ([WebAssembly.md:324](https://github.com/massimo-nocentini/pharo-vm/blob/pharo-12/docs/WebAssembly.md?plain=1#L324)).
- **Git clone with no proxy.** Iceberg now reports the CORS failure after 1 request instead of 3 retried ones ([66c3087b3](https://github.com/massimo-nocentini/pharo-vm/commit/66c3087b3)).

### Fixes with a measurable effect (documented)

| Fix | upstream | fork |
|---|---|---|
| [Linux aio after epoll `EPERM` on one fd](https://github.com/massimo-nocentini/pharo-vm/commit/50039a3d2) | idle loop at 100% CPU, 573k log lines in 3 s, no more aio notifications | notifications keep working |
| [heap-map leaf page (64-bit)](https://github.com/massimo-nocentini/pharo-vm/commit/2c968686e) | 8 MiB | 1 MiB |
| [VM started through `PATH` from another directory](https://github.com/massimo-nocentini/pharo-vm/commit/883dee2d8) | exit status 139 | answers `#(7 'pharo' '.')` |
| [interpreter prototypes compiled with the interpreter](https://github.com/massimo-nocentini/pharo-vm/commit/8b75039f2) | 15 type errors | 0 |

### Context: WebAssembly vs native

These are absolute numbers, not enhancements. **Measured** on the M4 Max:

- **VMs:** the release's wasm node VM (StackVM, node 25.2.1) against the native Darwin arm64 VM of the same release (CoInterpreter, so with the JIT).
- **Image:** the site's Pharo 15 build 50.
- **Method:** the two VMs took turns, 5 runs each, median. Each workload was timed with `microsecondsToRun`, which has 1 ms resolution in wasm.

| Workload | native (JIT) | wasm (node) | ratio |
|---|---|---|---|
| startup to the first `eval '3+4'` (wall) | 112.4 ms | 199.2 ms | 1.8× |
| tinyBenchmarks bytecodes/s | 6821M | 418.0M | 16.3× |
| tinyBenchmarks sends/s | 434.6M | 24.4M | 17.8× |
| `32 benchFib` | 16.9 ms | 288 ms | 17.0× |
| sort 200,000 strings | 59.4 ms | 775 ms | 13.0× |
| Dictionary, 200k `at:put:` + lookups | 124.7 ms | 531 ms | 4.3× |
| GC stress, 3M arrays | 445 ms | 993 ms | 2.2× |
| 1M-deep block recursion | 245.6 ms | 378 ms | 1.5× |
| `20000 factorial` (LargeIntegers) | 14.5 ms | 47 ms | 3.2× |
| 10 × `a * b` (a = 3^300000, ~475k bits; b = 7^250000, ~702k bits) | 77.2 ms | 217 ms | 2.8× |
| 10 × `(a * b) // b` (the product, then a ~1.18M-bit by ~702k-bit division) | 197.2 ms | 580 ms | 2.9× |
| 5 × STON `fromString:` of 1.57 MB | 769.9 ms | 8109 ms | 10.5× |
| 5 × SimdJSONReader `fromString:` of 1.57 MB | 99.9 ms | 176 ms | 1.8× |

The ratios run from 1.5× (deep recursion) to 18× (sends):

- Code made only of sends and bytecodes runs 13–18× slower than the JIT.
- Mixed workloads, such as collections or JSON parsed in Smalltalk, fall in between at about 4–11×.
- Where the time goes into primitives, plugins or the GC, the gap shrinks to 1.5–3.5×.

**Documented** ([WebAssembly.md:763–774](https://github.com/massimo-nocentini/pharo-vm/blob/pharo-12/docs/WebAssembly.md?plain=1#L763-L774), [:834](https://github.com/massimo-nocentini/pharo-vm/blob/pharo-12/docs/WebAssembly.md?plain=1#L834)): on the machine the port was made on, with node 25.2.1, wasm against the *native StackVM* (no JIT):

- tinyBenchmarks: 154.5M vs 941.0M bytecodes/s, and 9.5M vs 48.0M sends/s.
- `eval '3+4'`: 325 ms vs 80 ms.
- `26 benchFib`: 41 vs 8 ms.
- 20 × `inject:into:`: 568 vs 120 ms.
- GC stress: 2510 vs 1460 ms.
- 1M-deep recursion: 934 vs 766 ms.
- Overall, the doc puts wasm 5–6× behind the native StackVM and 14–27× behind the JIT.

### The web pages (documented, absolute)

These numbers have no "before": upstream has no web pages. They were measured on localhost on the machine the port was made on, in Chromium 153 and Firefox 155.

| Event | Chromium / Firefox |
|---|---|
| [world page, first frame, nothing cached](https://github.com/massimo-nocentini/pharo-vm/blob/pharo-12/docs/WebAssembly.md?plain=1#L308) | 1.4 s / 2.0 s |
| [stock image from disk: unpacked, prepared, painted](https://github.com/massimo-nocentini/pharo-vm/blob/pharo-12/docs/WebAssembly.md?plain=1#L302) | 4.3 s / 5.0 s |
| [Notebook kernel ready, first visit to the tab](https://github.com/massimo-nocentini/pharo-vm/blob/pharo-12/docs/WebAssembly.md?plain=1#L265) | 1.9 s / 2.0 s |
| [Export .html of the example notebook (28 KB)](https://github.com/massimo-nocentini/pharo-vm/blob/pharo-12/docs/WebAssembly.md?plain=1#L263) | 146 ms / 199 ms |
| [highlighter, first paint of a 32 KB cell](https://github.com/massimo-nocentini/pharo-vm/blob/pharo-12/docs/WebAssembly.md?plain=1#L256) | 32 ms / 37 ms |
| [git clone through the proxy (2 requests)](https://github.com/massimo-nocentini/pharo-vm/blob/pharo-12/docs/WebAssembly.md?plain=1#L627) | 573 ms / 478 ms |
| [200 Delays of 1 ms (timers clamped to 4 ms)](https://github.com/massimo-nocentini/pharo-vm/blob/pharo-12/docs/WebAssembly.md?plain=1#L852) | 1135 ms / 1333 ms |

On the world page, a key press took 40–57 ms (median) to reach the canvas. The doc gives one range for both browsers ([WebAssembly.md:308](https://github.com/massimo-nocentini/pharo-vm/blob/pharo-12/docs/WebAssembly.md?plain=1#L308)).

A first visit downloads about 25 MB ([WebAssembly.md:89](https://github.com/massimo-nocentini/pharo-vm/blob/pharo-12/docs/WebAssembly.md?plain=1#L89)). **Measured** from the M4 Max on a home network, with `curl` against the live site (3 runs each, median):

| File | size downloaded (gzip) | time |
|---|---|---|
| `pharo-web.wasm` | 1,075,471 B | 0.445 s |
| Pharo 15 image | 16,912,103 B | 0.852 s |
| Pharo 15 `.sources` | 7,821,812 B | 0.810 s |

### CI

**Measured** by reading job start and end times from the GitHub API for [run 40482809805](https://github.com/massimo-nocentini/pharo-vm/actions/runs/40482809805), the push of `885ae8867`. The whole run took about 17 minutes on GitHub-hosted runners.

| Job | duration |
|---|---|
| generate C sources (for Windows arm64) | 3m14s |
| Linux x86_64 / aarch64 | 10m12s / 5m18s |
| macOS x86_64 / arm64 | 6m06s / 5m57s |
| Windows x86_64 / arm64 | 5m43s / 6m11s |
| WebAssembly (build 4m04s, node lanes 11m06s) | 16m38s |
| release / GitHub Pages | 12s / 15s |
