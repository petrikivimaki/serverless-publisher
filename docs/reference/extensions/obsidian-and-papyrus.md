---
title: Obsidian and Papyrus Extensions
status: reference
tags: obsidian, papyrus, syntax
license: CC BY 4.0
---

# Obsidian and Papyrus Extensions

Papyrus supports standard Markdown plus a few conventions that are useful for published vaults.

## Frontmatter

Frontmatter is metadata at the top of a note.

```md
---
title: Example Note
tags: papyrus, markdown
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

Papyrus resolves those links against the loaded vault and builds backlinks automatically.

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

## Map components

Papyrus uses the standard Markdown code-fence shape as its custom component contract. The fence identifier selects the component, and its body contains one `property: value` pair per line. A map is written as:

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

| Property | Value | Behavior |
| --- | --- | --- |
| `latitude` | Number from `-90` to `90` | Sets the map center latitude. |
| `longitude` | Number from `-180` to `180` | Sets the map center longitude. |
| `zoom` | Number from `0` to `22` | Sets the initial zoom level. |
| `marker` | `true` or `false` | Places a marker at the configured latitude and longitude. Defaults to `false`. |
| `grayscale` | `true` or `false` | Filters the map canvas without filtering its markers. Defaults to `maps.grayscale` from the app configuration. |
| `label` | Plain text | Names the location in the component footer and labels its marker for assistive technology. |

Missing or out-of-range numeric properties use the fallback under `maps.fallback` in the active app configuration. The footer displays the label, current center coordinates, current zoom, a Google Maps link, and the fullscreen action. Its coordinates, zoom, and external link update as the reader moves the map.

Because the identifier is exactly `map`, ordinary fences such as `js`, `json`, and `md` continue to render as code. See [[reference/markdown|Markdown basics]] for normal code-block behavior.

MapLibre loads only when a note contains a map.
