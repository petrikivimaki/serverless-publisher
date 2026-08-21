---
title: What Papyrus Does
status: draft
featured: true
tags: papyrus, github-pages, obsidian
edition: 2
published: 2026-08-21
updated: 2026-08-21T12:00:00+03:00
---

# What Papyrus Does

Papyrus is a static frontend for Markdown knowledge bases. It is designed for people who like writing in [Obsidian](https://obsidian.md/) but want a lightweight public website that can run on [GitHub Pages](https://pages.github.com/) without a backend.

The app provides:

- A file tree for large folders
- Manifest-backed search across titles, paths, excerpts, and frontmatter
- Wiki links and backlinks
- Frontmatter metadata
- Bookmarks stored in the browser
- A configurable Linktree profile with grouped links and local clocks
- Reader controls, themes, table of contents, and share links

Papyrus does not replace your editor. It publishes the files you already write.

## How content flows

| Step | Tool | Output |
| ---- | ---- | ------ |
| Write | Obsidian or another Markdown editor | Local `.md` files |
| Save | Git | Versioned content |
| Push | GitHub | Public repository |
| Index | GitHub Actions | Versioned content manifest |
| Publish | GitHub Pages and Papyrus | Static website |

For the practical version, continue to [[workflow/setup]] and [[workflow/content-repository|Content repository and manifest]].
