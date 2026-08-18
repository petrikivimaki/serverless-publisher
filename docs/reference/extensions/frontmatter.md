---
title: Frontmatter Properties
status: reference
tags: obsidian, frontmatter, metadata, configuration
license: CC BY 4.0
---

# Frontmatter Properties

Frontmatter is note-level metadata placed between `---` delimiters at the very beginning of a Markdown file. The content-manifest generator copies every property into the note record, and Papyrus uses that manifest metadata for article identity, search, reader details, header images, and content-rights overrides.

```md
---
title: Example Note
tags: [papyrus, markdown]
authors:
  - Papyrus Team
status: draft
featured: true
image: images/example-header.jpeg
grayscale: true
copyright: (c) 2026 Papyrus Team
license: CC BY 4.0
---
```

## Available properties

The table lists every property with a defined role in the current implementation. Property names should use lowercase even though most special-property lookups and reader-panel allowlists are case-insensitive.

| Property | Accepted value | Special role | Reader details behavior |
| --- | --- | --- | --- |
| `title` | Plain text | Sets the note title used by the article, file tree, search, bookmarks, and links. Falls back to the first level-one heading and then the filename. | Always appears in the generated **Title** row and is never duplicated as ordinary metadata. |
| `tags` | Plain text, inline array, or list | Adds searchable classification terms. | Appears when included in `metadata.allowedKeys`; included by default. |
| `authors` | Plain text, inline array, or list | Adds searchable author names. | Appears when included in `metadata.allowedKeys`; included by default. |
| `status` | Plain text | Adds a searchable workflow label such as `draft`, `review`, or `published`. | Appears when included in `metadata.allowedKeys`; included by default. |
| `featured` | `true` or `false` | Makes the note eligible for a home-page card when `true`. Papyrus displays the first three featured notes in manifest order. | Hidden by default; add `featured` to `metadata.allowedKeys` to also show it. |
| `image` | Relative asset path, root-relative path, HTTP(S) URL, or data URL | Creates the full-width article header image. Relative GitHub-vault paths use the configured `github.assetRootPath`. | Hidden by default; add `image` to `metadata.allowedKeys` to also show its raw value. |
| `grayscale` | `true` or `false` | Applies a grayscale filter to the article header image when the value is `true`. It has no visible effect without `image`. | Hidden by default; add `grayscale` to `metadata.allowedKeys` to also show it. |
| `copyright` | Plain text | Overrides `contentRights.copyright` for the note. | Always appears in the generated **Copyright** row, using the global value or `Not specified` as fallback. |
| `license` | Plain text | Overrides `contentRights.license` for the note. | Always appears in the generated **License** row, using the global value or `Not specified` as fallback. |
| Any custom key | Plain text, inline array, or list | Its value is indexed for search but has no other built-in behavior. | Appears only when its lowercase name is included in `metadata.allowedKeys`. Hyphens and underscores become spaces in its displayed label. |

Unlisted Obsidian properties are accepted as custom metadata. They do not acquire Obsidian-specific behavior until Papyrus explicitly implements that property.

## Value shapes

Papyrus reads a deliberately small YAML-style subset. A scalar uses one `key: value` line:

```md
status: draft
```

Arrays can use brackets or an indented list:

```md
tags: [papyrus, reference, markdown]
authors:
  - Ada Lovelace
  - Grace Hopper
```

Array values are displayed and indexed as comma-separated text. Nested objects, multiline scalar operators, anchors, and other advanced YAML features are not interpreted.

## Reader details allowlist

All frontmatter values participate in manifest-backed search without requiring the note body to be downloaded. The `metadata.allowedKeys` array in `config/app-config.json` separately controls which ordinary properties appear in the reader's Details panel:

```json
"metadata": {
	"allowedKeys": [
		"tags",
		"authors",
		"status",
		"reviewed-by"
	]
}
```

`title`, `copyright`, and `license` already have dedicated generated rows, so adding them to the allowlist does not create duplicates. The Details panel also generates **Path**, **Words**, **Characters**, and **Reading time** values; these are calculated by Papyrus rather than read from frontmatter.

See [[workflow/content-repository|Content repository and manifest]] for generation and lazy loading, [[workflow/setup|Setup workflow]] for the active configuration files, and [[reference/extensions/obsidian-syntax|Obsidian syntax and note features]] for links, comments, and math.
