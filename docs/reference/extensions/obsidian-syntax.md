---
title: Obsidian Syntax and Note Features
status: reference
tags: obsidian, syntax, links, comments, math
license: CC BY 4.0
---

# Obsidian Syntax and Note Features

Papyrus supports standard Markdown plus several Obsidian conventions that help a published vault retain its structure and connections. See [[reference/extensions/frontmatter|Frontmatter properties]] for note metadata and its special roles.

## Wiki links

Use Obsidian-style links to connect notes:

```md
[[workflow/setup]]
[[workflow/setup|Setup workflow]]
```

Papyrus resolves those links against the loaded vault and builds backlinks automatically.

## Markdown links to notes

Normal Markdown links to `.md` files can also resolve inside the app:

```md
[Markdown basics](../markdown.md)
```

## Comments

Obsidian comments remain visible in the Markdown source but are removed before Papyrus renders the note. Inline comments begin and end with `%%`:

```md
Visible before. %%INLINE_COMMENT_SHOULD_NOT_RENDER%% Visible after.
```

Visible before. %%INLINE_ACTUAL_COMMENT_SHOULD_NOT_RENDER%% Visible after.

Put the markers on separate lines to hide a complete block. Markdown inside the block is not rendered:

```md
This paragraph appears before the block comment.

%%
BLOCK_COMMENT_SHOULD_NOT_RENDER
> [!warning]
> This callout is inside a comment.
%%

This paragraph appears after the block comment.
```

This paragraph appears before the block comment.

%%
BLOCK_ACTUAL_COMMENT_SHOULD_NOT_RENDER
## COMMENTED_HEADING_SHOULD_NOT_RENDER
> [!warning]
> This callout is inside a comment.
> [[workflow/publish|COMMENTED_LINK_SHOULD_NOT_RENDER]]
%%

This paragraph appears after the block comment.

Comment markers inside inline and fenced code remain literal: `%%LITERAL_INLINE_CODE%%`.

```md
%% LITERAL_FENCED_CODE %%
```

## Math

Inline math such as $E = mc^2$ and block math are rendered with MathJax when present:

$$
\int_0^1 x^2\,dx = \frac{1}{3}
$$

## Related reference notes

- [[reference/extensions/frontmatter|Frontmatter properties]]
- [[reference/extensions/callouts|Obsidian callouts]]
- [[reference/extensions/mermaid|Mermaid diagrams]]
- [[reference/markdown|Markdown basics]]
