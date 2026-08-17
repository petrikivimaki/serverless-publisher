# Papyrus

Papyrus is a client-side Markdown knowledge base frontend for GitHub Pages. It is shaped like a lightweight Obsidian-style reader: file tree, search, calendar, bookmarks, backlinks, article metadata, and Markdown rendering all run in the browser without a backend.

## Features

- Static HTML, CSS, and JavaScript
- Public GitHub repository loading through browser `fetch()`
- Markdown rendering with Marked
- Syntax highlighting with PrismJS and the Prism Tomorrow theme
- Obsidian-compatible Mermaid diagrams with light and dark themes
- Markdown file tree with expandable folders
- Wiki links, backlinks, and outgoing link lists
- Obsidian `%%` source comments hidden from rendered articles and indexes
- Standard Markdown blockquotes and typed, foldable Obsidian callouts
- Full-vault search over titles, paths, tags, and body text
- Browser-local bookmarks using `localStorage`
- Runtime-generated Cuelume interaction sounds with a saved on/off control
- Calendar panel with configurable first day of week
- Configurable home screen and startup animation
- Fenced MapLibre map components with configurable markers and labels
- Fenced market ticker cards with signed price-change styling and Google search links
- Fenced periodic tables with selected-element highlighting and configurable reference links
- Fenced four-quadrant SWOT analysis cards
- GitHub Pages friendly deployment

## Quick Start

Start the dependency-free static development server:

```sh
npm run dev
```

Then open:

```text
http://localhost:4242/
```

Opening `index.html` directly may not work in every browser because the app loads JSON and markdown files with `fetch()`.

## Configuration

The active runtime config lives at:

```text
config/app-config.json
```

Use `config/app-config.example.json` as a reference for all available options. A JSON Schema is available at:

```text
config/app-config.schema.json
```

To load markdown from a public GitHub repository, set:

```json
{
	"github": {
		"enabled": true,
		"owner": "your-user-or-org",
		"repo": "your-markdown-vault",
		"branch": "master",
		"rootPath": ""
	}
}
```

`rootPath` can point to a subdirectory inside the repository, such as `notes` or `docs`.

The bundled local demo vault lives in:

```text
docs
```

It doubles as a short Papyrus guide and as sample content for local testing. The active demo manifest is configured at `docs/manifest.json`.

External links can receive configured UTM parameters by enabling `externalLinks.utm` in `config/app-config.json`.

## Dependencies

Papyrus imports Marked, Mermaid, PrismJS, QRCode, and Cuelume directly from version-pinned jsDelivr URLs. Marked handles Markdown parsing, Mermaid renders Obsidian-compatible diagram fences, PrismJS handles syntax highlighting with the Prism Tomorrow theme, QRCode renders selected-text codes, and Cuelume synthesizes interaction sounds at runtime. The static app has no package installation or build step.

MapLibre GL JS is loaded only when a note contains a map component.

## Content

Papyrus expects Markdown files (`.md` or `.mdx`). Frontmatter is optional:

```md
---
title: Example note
tags: publishing, markdown
---

# Example note

Link to [[another-note]] or [[folder/note|a labeled note]].
```

Maps use a fenced Markdown component with one property per line:

````md
```map
latitude: 60.1699
longitude: 24.9384
zoom: 11
marker: true
grayscale: true
label: Helsinki
```
````

Map support, fallback coordinates, and the default grayscale value are configured under `maps` in `config/app-config.json`. Individual map fences can override that default.

Ticker cards use the same one-property-per-line fenced component contract:

````md
```ticker
symbol: NOKIA
label: Nokia Oyj
market: Nasdaq Helsinki
quote: 4.67 EUR
change: +0.73%
```
````

Ticker values are display-only content. The card links to a Google search for `stock ticker {symbol}`; changes beginning with `+` or `↑` use positive styling, while changes beginning with `-`, `−`, or `↓` use negative styling.

Periodic tables use the `pte` fence and accept a label plus a comma- or space-separated list of symbols:

````md
```pte
label: Elements in caffeine
elements: H, C, N, O
```
````

Every element links to the reference service configured under `periodicTable`. Its `linkTemplate` can contain `{Z}`, `{symbol}`, or both; Papyrus substitutes the element's atomic number and standard symbol before rendering the URL.

SWOT analyses use four plain-text properties and always render a complete quadrant grid:

````md
```swot
strengths: Strong customer retention and a focused product.
weaknesses: A small team with limited distribution.
opportunities: Growing demand in adjacent markets.
threats: Larger competitors entering the category.
```
````

## Deployment

This project is intended for GitHub Pages:

1. Commit the static app files.
2. Configure `config/app-config.json`.
3. Enable GitHub Pages for the repository.
4. Keep the markdown vault in the same public repository or another public repository.

## License

MIT
