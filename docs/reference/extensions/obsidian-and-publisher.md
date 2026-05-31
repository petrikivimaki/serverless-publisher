---
title: Obsidian and Publisher Extensions
status: reference
tags: obsidian, publisher, syntax
license: CC BY 4.0
---

# Obsidian and Publisher Extensions

Publisher supports standard Markdown plus a few conventions that are useful for published vaults.

## Frontmatter

Frontmatter is metadata at the top of a note.

```md
---
title: Example Note
tags: publisher, markdown
status: draft
---
```

Configured metadata appears in the reader panel and is included in search.

## Wiki links

Use Obsidian-style links to connect notes:

```md
[[workflow/setup]]
[[workflow/setup|Setup workflow]]
```

Publisher resolves those links against the loaded vault and builds backlinks automatically.

## Markdown links to notes

Normal Markdown links to `.md` files can also resolve inside the app:

```md
[Markdown basics](../markdown.md)
```

## Math

Inline math such as $E = mc^2$ and block math are rendered with MathJax when present:

$$
\int_0^1 x^2\,dx = \frac{1}{3}
$$

## Maps

Add a single-line map directive with latitude, longitude, and zoom:

```md
map:[60.1699,24.9384,11]
```

MapLibre loads only when a note contains a map.
