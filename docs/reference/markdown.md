---
title: Markdown Basics
status: reference
tags: markdown, syntax
---

# Markdown Basics

Markdown is a plain-text format for structured writing. Publisher uses [Marked](https://marked.js.org/) to render Markdown in the browser.

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

| Feature | Supported |
| ------- | --------- |
| Headings | Yes |
| Lists | Yes |
| Code fences | Yes |
| Tables | Yes |
| Wiki links | Yes |

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
