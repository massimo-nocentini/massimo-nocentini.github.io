+++
date = '2026-07-03T09:58:04+01:00'
title = 'Neovim'
subtitle = 'Hyperextensible Vim-based text editor'
summary = ' '
categories = ['tools', 'lua']
+++

# Vision 

[Neovim](https://neovim.io/) is a refactor, and sometimes redactor, in the
tradition of Vim (which itself derives from
[Stevie](https://en.wikipedia.org/wiki/Stevie_%28text_editor%29)). It is not a
rewrite but a continuation and extension of Vim. Many clones and derivatives
exist, some very clever—but none are Vim. Neovim is built for users who want
the good parts of Vim, and more.

## Goals

Extensible. Usable. Vim.

- Retain the character of Vim—fast, versatile, quasi-minimal.
- Enable new contributors, remove barriers to entry.
- Unblock plugin authors.
- Deliver a first-class Lua interface, as an alternative to Vimscript.
- Favor composability (long-term thinking) instead of new, incompatible concepts (short-term thinking).
- Leverage ongoing Vim development.
- Optimize “out of the box”, for new users but especially regular users.
- Deliver a consistent cross-platform experience, targeting all libuv-supported platforms.
- In matters of taste/ambiguity, favor tradition/compatibility…
- …but prefer usability if the benefits are extreme.

## Non-goals

- Support Vim9script
- Turn Vim into an IDE
- Limit third-party applications (such as IDEs!) built with Neovim
- Deprecate Vimscript
- Conform to POSIX vi


# Learning and docs

## [Typecraft's](https://typecraft.dev/) playlists

[Chris Power](https://typecraft.dev/authors/chris-power) is the author of the followings:

- [Vim Tips and Tricks](https://www.youtube.com/playlist?list=PLsz00TDipIffY84NOkuTETHVa5FINZj5P)
- [Neovim for Newbs. FREE NEOVIM COURSE](https://www.youtube.com/playlist?list=PLsz00TDipIffreIaUNk64KxTIkQaGguqn)
- [Neovim Configuration](https://www.youtube.com/playlist?list=PLsz00TDipIffxsNXSkskknolKShdbcALR)

and much more on its [Youtube channel](https://www.youtube.com/@typecraft_dev).

# Releases

All the following are released on [GitHub](https://github.com/neovim/neovim/releases).

## Nvim 0.12.3 is out!

Fetch the
[v0.12.3.tar.gz](https://github.com/neovim/neovim/archive/refs/tags/v0.12.3.tar.gz)
tarball, extract it and then build it with:

```zsh
make CMAKE_BUILD_TYPE=Release CMAKE_INSTALL_PREFIX=$HOME/.local/ install
```

according to the [build doc page](https://neovim.io/doc/build/).
