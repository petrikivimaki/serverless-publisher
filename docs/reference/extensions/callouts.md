---
title: Obsidian Callouts
status: reference
tags: obsidian, callouts, blockquotes, syntax
license: CC BY 4.0
---

# Obsidian Callouts

Papyrus supports Obsidian callouts inside standard Markdown blockquotes. Put `[!type]` at the start of the first quoted line. Add text after the marker for a custom title; otherwise Papyrus supplies the type's default title. Light themes use a pale type-colored background with dark text; Dark and Ocean invert the treatment with a deep type-colored background and white body text. Every theme keeps the regular-weight uppercase title, matching straight left border, and icon-free borderless shape.

```md
> [!note] A custom title
> Callout content supports **Markdown**, lists, links, and other block content.
```

> [!note]
> Callout content supports **Markdown**, lists, links, and other block content.

## Supported types

The supported types and their aliases match Obsidian's built-in set. Each type draws its adaptive background, title, and left-border colors from a blue, cyan, green, orange, red, purple, or gray family.

| Type | Aliases |
| --- | --- |
| `note` | — |
| `abstract` | `summary`, `tldr` |
| `info` | — |
| `todo` | — |
| `tip` | `hint`, `important` |
| `success` | `check`, `done` |
| `question` | `help`, `faq` |
| `warning` | `caution`, `attention` |
| `failure` | `fail`, `missing` |
| `danger` | `error` |
| `bug` | — |
| `example` | — |
| `quote` | `cite` |

## Type gallery

The examples below provide a visual reference for every built-in appearance.

> [!abstract]
> A short summary of a longer note.

> [!info]
> Useful context that supports the surrounding content.

> [!todo]
> - Verify the local vault.
> - Publish the static site.

> [!tip] Small improvements compound
> Keep examples next to the syntax they demonstrate.

> [!success]
> The callout rendered successfully.

> [!question]
> What should a reader explore next?

> [!warning]
> Review public links before publishing a vault.

> [!failure]
> This example represents an unsuccessful outcome.

> [!danger]
> Use this type for consequences that need immediate attention.

> [!bug]
> Describe reproducible behavior and the expected result.

> [!example]
> Callouts can contain `inline code` and [[reference/markdown|internal links]].

> [!quote]
> Typed callouts can also present attributed quotations.

## Foldable callouts

Add `+` or `-` immediately after the type marker to make a callout foldable. `+` starts expanded and `-` starts collapsed. Readers can toggle either callout from its header with a pointer or keyboard.

```md
> [!example]+ Expanded by default
> This content is visible when the note opens.

> [!faq]- Collapsed by default
> This answer is hidden until the reader expands it.
```

> [!example]+ Expanded by default
> This content is visible when the note opens.
>
> > [!tip] Nested callout
> > Callouts can be nested when a note benefits from an extra level of context.

> [!faq]- Collapsed by default
> This answer is hidden until the reader expands it.

Unknown callout types use the `note` appearance and title. A blockquote without a callout marker remains a standard Markdown blockquote; see [[reference/markdown|Markdown blockquotes]] for examples.

## Related reference notes

- [[reference/extensions/obsidian-syntax|Obsidian syntax and note features]]
- [[reference/extensions/mermaid|Mermaid diagrams]]
