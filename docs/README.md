---
title: Papyrus Docs
status: demo
tags: papyrus, documentation, markdown
authors:
  - Papyrus Team
edition: 1
published: 2026-08-21T09:00:00+03:00
updated: 2026-08-21T15:30:00+03:00
---

# Papyrus Docs

Papyrus turns a folder of Markdown files into a public, Obsidian-style knowledge base for GitHub Pages. This docs vault introduces the project and also acts as live sample content for testing search, file browsing, backlinks, metadata, source comments, blockquotes, callouts, tables, code, maps, tickers, periodic tables, SWOT analyses, and wiki links.

## Start here

- [[start/papyrus|What Papyrus does]]
- [[workflow/setup|Setup workflow]]
- [[reference/markdown|Markdown basics]]
- [[reference/extensions/obsidian-and-papyrus|Obsidian and Papyrus extensions]]

## The idea

Keep your writing as plain text, keep your publishing site as static files, and let the browser do the reading experience. Papyrus can load content from a public GitHub repository, or from this local `docs` manifest while you are developing.

> This vault is intentionally small. Replace these notes with your own Markdown vault when you are ready.

> [!tip] Use the reference notes as a test gallery
> [[reference/markdown|Markdown basics]] includes standard blockquote examples. [[reference/extensions/callouts|Obsidian callouts]] includes every callout type plus expanded, collapsed, and nested examples.

## Example map

Papyrus turns a `map` code fence into an interactive component. See [[reference/extensions/papyrus-components|the map component contract]] for every property.

```map
latitude: 60.1699
longitude: 24.9384
zoom: 11
marker: true
grayscale: true
label: Helsinki
```

## Example tickers

Papyrus turns a `ticker` code fence into a full-width linked market card. The values below are illustrative snapshots rather than live market data. See [[reference/extensions/papyrus-components|the custom component contract]] for every property.

```ticker
symbol: NOKIA
label: Nokia Oyj
market: Nasdaq Helsinki
quote: 4.67 EUR
change: +0.73% · illustrative
```

```ticker
symbol: IBM
label: International Business Machines
market: NYSE
quote: 241.20 USD
change: -0.42% · illustrative
```

## Example periodic table

Papyrus turns a `pte` code fence into a complete linked periodic table. The symbols listed under `elements` receive highlighted styling. See [[reference/extensions/papyrus-components|the periodic-table component contract]] for its properties and link configuration.

Papyrus also renders Obsidian-compatible `mermaid` code fences as diagrams, including vault navigation from nodes marked with Mermaid's `internal-link` class. See [[reference/extensions/mermaid|the Mermaid diagram guide]].

```pte
label: Elements in caffeine
elements: H, C, N, O
```

## Example SWOT analysis

Papyrus turns a `swot` code fence into a four-quadrant analysis card. See [[reference/extensions/papyrus-components|the custom component contract]] for the complete syntax.

```swot
strengths: Plain-text content stays portable and easy to version.
weaknesses: Large vaults depend on clear structure and naming.
opportunities: Public knowledge bases can grow directly from existing notes.
threats: Remote content and browser APIs can be affected by network limits.
```
