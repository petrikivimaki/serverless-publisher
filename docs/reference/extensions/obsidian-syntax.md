---
title: Obsidian Syntax and Note Features
status: reference
tags: obsidian, syntax, links, comments, footnotes, math
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

## Footnotes

Papyrus collects Obsidian-style footnotes into a numbered block at the end of the article. Select a superscript number to scroll to its explanation; a compact circle marks the active footnote number. Select the upward arrow to return to the exact reference.

Write an inline footnote directly beside the text it explains:

```md
Papyrus does not need a backend.^[All rendering and navigation happen in the browser.]
```

This sentence has an inline footnote.^[Inline footnotes are numbered automatically and moved to the article's footnote block.]

For a referenced footnote, use a label at the reference point and define that label elsewhere in the same note. Labels are not displayed; numbering follows the order in which references first appear.

```md
The vault can be published as a static site.[^static-hosting]

[^static-hosting]: GitHub Pages is one supported publishing target.
```

The same referenced footnote can be used more than once.[^shared-note] Reusing its label points to the same numbered explanation.[^shared-note]

[^shared-note]: A repeated footnote includes a return control for every place where it was referenced. The explanation can also contain **Markdown formatting** and [[workflow/publish|internal links]].

Indent continuation lines by at least two spaces to make a longer definition:

```md
Long explanations can span paragraphs.[^long-note]

[^long-note]: The first line starts beside the definition label.

  Indented lines continue the same footnote.
```

Here is the multi-paragraph form rendered in this note.[^long-example]

[^long-example]: The definition begins on the label's line.

  An indented paragraph remains part of the same explanation in the generated footnote block.

Footnote-like text inside inline code and fenced code remains literal, so examples such as `^[inline example]`, `[^example]`, and `[^example]: definition` do not create footnotes.

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
