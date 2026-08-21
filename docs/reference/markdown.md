---
title: Markdown Basics
status: reference
featured: true
tags: markdown, syntax
published: 2026-08-18
updated: 2026-08-20T16:45:00+03:00
---

# Markdown Basics

Markdown is a plain-text format for structured writing. Papyrus uses [Marked](https://marked.js.org/) to render Markdown in the browser.

## Core syntax

```md
# Heading 1

## Heading 2

Paragraph text with **bold**, *italic*, and `inline code`.

- Unordered list item
- Another item

1. Ordered item
2. Another ordered item

> A blockquote.

[External link](https://www.markdownguide.org/)
```

## Tables

Papyrus places standard Markdown tables in a responsive scroll container. Each table receives a generated header with its body-row and column counts plus a copy button that copies the table as tab-separated text. A successful copy briefly holds the button's hover treatment while changing its icon and label to a checkmark and “Copied,” then restores “Copy.” Tables also use a distinct column header, row separators, alternating backgrounds, and horizontal scrolling when wider than the article.

| Feature | Support | Example |
| :------ | :-----: | ------: |
| Headings | Yes | `## Title` |
| Lists | Yes | `- Item` |
| Code fences | Yes | Three backticks |
| Tables | Yes | This table |
| Wiki links | Yes | Internal notes |

## Blockquotes

Use `>` at the start of a line for a standard Markdown blockquote. Papyrus gives ordinary quotes a thick straight inset edge, callout-like spacing, and a transparent background while preserving nested Markdown.

```md
> Good documentation is a map: it shows both the destination and the useful paths between ideas.
>
> — Papyrus example
```

> Good documentation is a map: it shows both the destination and the useful paths between ideas.
>
> — Papyrus example

Blockquotes can contain multiple paragraphs, emphasis, links, lists, and nested quotes:

> A longer quotation can introduce a few related points.
>
> - Plain Markdown stays portable.
> - **Formatting** continues to work inside the quote.
>
> > Nested blockquotes remain visually distinct.

For titled, typed, or foldable quote blocks, see [[reference/extensions/callouts|Obsidian callouts]].

## Code fences

Papyrus adds language and line-count metadata plus copy, line wrapping, and collapse controls to fenced code blocks. **Wrap** soft-wraps long lines within the available reading width and changes to **Unwrap** while active. JavaScript fences also include a **Run** action. Each run starts in a hidden, script-only iframe sandbox protected by a restrictive content security policy. Calls to `console.log`, `console.info`, `console.warn`, `console.error`, and `console.debug` appear in a console directly below the code block; returned values are not printed automatically. The console header provides dedicated controls to copy its output or close the console and stop its sandbox. Running the block again replaces its previous sandbox and console.

The `mermaid` fence is rendered as an Obsidian-compatible diagram instead of a normal code block. See [[reference/extensions/mermaid|Mermaid diagrams]] for examples and internal note links.

```js
/**
 * Greets a reader.
 * @param {object} params
 * @param {string} params.name
 * @returns {string}
 */
function greetReader({ name }) {
	return `Hello, ${name}.`;
}

console.log(greetReader({ name: "reader" }));
```

## Learn more

- [Markdown Guide](https://www.markdownguide.org/basic-syntax/)
- [GitHub Flavored Markdown Spec](https://github.github.com/gfm/)
