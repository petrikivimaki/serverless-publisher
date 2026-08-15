---
title: Markdown Basics
status: reference
tags: markdown, syntax
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

## Code fences

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
```

## Learn more

- [Markdown Guide](https://www.markdownguide.org/basic-syntax/)
- [GitHub Flavored Markdown Spec](https://github.github.com/gfm/)
