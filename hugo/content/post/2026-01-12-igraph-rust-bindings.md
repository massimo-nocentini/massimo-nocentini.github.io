+++
date = '2026-01-12T16:12:22+01:00'
title = 'Rust bindings for igraph'
subtitle = 'and the companion container'
tags = ["rust", "bindings", "containers", "graph", "c"]
summary = ' '
+++

We provide a new Rust crate [igraph-rs](https://github.com/massimo-nocentini/igraph-rs), with 
the relative [documentation](https://massimo-nocentini.github.io/igraph-rs/igraph/), that
supply bindings over the C library [igraph](https://github.com/igraph/igraph).

As companion artifact, we provide the corresponding [Docker container](https://github.com/massimo-nocentini/igraph-rs/pkgs/container/igraph-rs/619892997?tag=master), that can be pulled with:
```bash
docker pull ghcr.io/massimo-nocentini/igraph-rs:master
```
